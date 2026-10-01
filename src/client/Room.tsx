// A live session with one agent — the WebRTC part of vx's VoiceRoom, plus a
// live transcript and a fullscreen mode. The scene panel is left out (it needs
// vx's webhook + database).
//
// The transcript arrives over the `web_actions` data channel, the same one the
// Voxio SDK opens (voice-bot-sdk/packages/client/src/session.ts). vx's
// VoiceRoom names its channel `chat`, which is why nothing ever comes back on it.

import { useCallback, useEffect, useRef, useState } from 'react'

import { type AccentOpt, type VoiceStyle } from './main'

export type DemoCard = {
  id: string
  label: string
  role: string
  blurb: string
  asks: string[]
  opener?: string
  video: boolean
}

type Start = {
  sessionId: string
  server: string
  apiKey: string
  customs: unknown
  participants: unknown
  maxSeconds: number
}

type Phase = 'idle' | 'connecting' | 'live' | 'ended' | 'failed'

type Line = { key: number; role: 'user' | 'agent'; text: string; final: boolean; turnId?: number }

const MAX_RECONNECTS = 5
const DATA_CHANNEL_LABEL = 'web_actions'

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener('icegatheringstatechange', check)
      clearTimeout(timer)
      resolve()
    }
    const check = () => pc.iceGatheringState === 'complete' && done()
    const timer = setTimeout(done, 5000)
    pc.addEventListener('icegatheringstatechange', check)
  })
}

/* Partials (final: false) keep rewriting the open line for that speaker; the
   final for the turn settles it. A new line starts only when nothing is open. */
function addTranscript(lines: Line[], t: Omit<Line, 'key'>, key: number): Line[] {
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]!
    if (l.role !== t.role) continue
    const sameTurn = t.turnId !== undefined && l.turnId === t.turnId
    if (!l.final || sameTurn) {
      const next = lines.slice()
      next[i] = { ...l, ...t }
      return next
    }
    break
  }
  return [...lines, { ...t, key }]
}

export default function Room({
  demo,
  accents,
  expressiveDefault,
  initialAccent,
  initialVoice,
}: {
  demo: DemoCard
  accents: AccentOpt[]
  expressiveDefault: string
  initialAccent: string
  initialVoice: VoiceStyle
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [left, setLeft] = useState<number | null>(null)
  const [muted, setMuted] = useState(false)
  const [hasAgentVideo, setHasAgentVideo] = useState(false)
  /* Voice is chosen first. A saved Expressive default on an accent without an
     expressive voice starts on the expressive default accent instead. */
  const hasExpressive = (id: string) => !!accents.find((a) => a.id === id)?.expressive
  const [voice, setVoice] = useState<VoiceStyle>(initialVoice)
  const [accent, setAccent] = useState(
    initialVoice === 'expressive' && !hasExpressive(initialAccent) ? expressiveDefault : initialAccent,
  )

  const chooseVoice = (next: VoiceStyle) => {
    setVoice(next)
    if (next === 'expressive' && !hasExpressive(accent)) setAccent(expressiveDefault)
  }
  const [lines, setLines] = useState<Line[]>([])
  const [agentState, setAgentState] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)

  const rootRef = useRef<HTMLElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const agentVideoRef = useRef<HTMLVideoElement>(null)
  const ownVideoRef = useRef<HTMLVideoElement>(null)
  const stoppedRef = useRef(false)
  const keyRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const followRef = useRef(true)

  const hangUp = useCallback((next: Phase = 'ended') => {
    stoppedRef.current = true
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    pcRef.current?.close()
    pcRef.current = null
    for (const el of [audioRef.current, agentVideoRef.current, ownVideoRef.current]) if (el) el.srcObject = null
    setHasAgentVideo(false)
    setAgentState(null)
    setLeft(null)
    setMuted(false)
    setPhase(next)
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }, [])

  useEffect(() => () => hangUp('idle'), [hangUp])

  useEffect(() => {
    if (phase !== 'live' || left === null) return
    if (left <= 0) return hangUp('ended')
    const t = setTimeout(() => setLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [phase, left, hangUp])

  /* Track the real fullscreen state, so Esc (which the browser handles itself)
     updates the button too. */
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else void rootRef.current?.requestFullscreen().catch(() => {})
  }

  /* Follow new lines unless the reader has scrolled up to read back. */
  useEffect(() => {
    const el = scrollRef.current
    if (el && followRef.current) el.scrollTop = el.scrollHeight
  }, [lines, fullscreen, panelOpen])

  const onScroll = () => {
    const el = scrollRef.current
    if (el) followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  const onChannelMessage = useCallback(
    (raw: unknown) => {
      let msg: { type?: string; [k: string]: unknown }
      try {
        msg = typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof msg)
      } catch {
        return
      }
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'transcript' && typeof msg.text === 'string' && (msg.role === 'user' || msg.role === 'agent')) {
        const t = {
          role: msg.role,
          text: msg.text,
          final: msg.final !== false,
          turnId: typeof msg.turn_id === 'number' ? msg.turn_id : undefined,
        } as const
        if (!t.text.trim()) return
        setLines((ls) => addTranscript(ls, t, ++keyRef.current))
      } else if (msg.type === 'state' && typeof msg.state === 'string') {
        setAgentState(msg.state)
      } else if (msg.type === 'ended') {
        hangUp('ended')
      }
    },
    [hangUp],
  )

  const start = async () => {
    setError(null)
    setLines([])
    followRef.current = true
    setPhase('connecting')
    stoppedRef.current = false
    try {
      const r = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: demo.id, accent, voice }),
      })
      const config = (await r.json()) as Start & { ok: boolean; reason?: string }
      if (!config.ok) throw new Error(config.reason ?? 'Could not start.')

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: demo.video })
      } catch (err) {
        if (!demo.video) throw err
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      streamRef.current = stream
      if (stream.getVideoTracks().length && ownVideoRef.current) {
        ownVideoRef.current.srcObject = stream
        void ownVideoRef.current.play().catch(() => {})
      }

      let attempts = 0
      const attempt = async (): Promise<void> => {
        if (stoppedRef.current) return
        let iceServers: RTCIceServer[] = []
        try {
          const ice = await fetch(`https://${config.server}/rtc/ice-servers`, {
            signal: AbortSignal.timeout(5000),
            headers: { 'ngrok-skip-browser-warning': 'true' },
          })
          if (ice.ok) iceServers = (await ice.json()).ice_servers || []
        } catch {
          // STUN-less still works on most networks; carry on.
        }

        const pc = new RTCPeerConnection({ iceServers })
        pcRef.current = pc
        stream.getTracks().forEach((t) => pc.addTrack(t, stream))

        // Must exist before the offer so it is part of the SDP.
        const channel = pc.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true })
        channel.onmessage = (e) => {
          if (pcRef.current === pc) onChannelMessage(e.data)
        }

        pc.ontrack = (e) => {
          const s = e.streams[0]
          if (!s) return
          if (e.track.kind === 'audio' && audioRef.current) {
            audioRef.current.srcObject = s
            void audioRef.current.play().catch(() => {})
          }
          if (e.track.kind === 'video' && agentVideoRef.current) {
            agentVideoRef.current.srcObject = s
            void agentVideoRef.current.play().catch(() => {})
            setHasAgentVideo(true)
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            attempts = 0
            setPhase('live')
            setLeft((l) => l ?? config.maxSeconds)
          }
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            pc.close()
            if (stoppedRef.current) return
            if (attempts++ < MAX_RECONNECTS) {
              setPhase('connecting')
              setTimeout(() => void attempt(), Math.min(1000 * attempts, 5000))
            } else {
              setError('The connection dropped and would not come back.')
              hangUp('failed')
            }
          }
        }

        await pc.setLocalDescription(await pc.createOffer())
        await waitForIceGathering(pc)

        const res = await fetch(`https://${config.server}/rtc/offer/audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            api_key: config.apiKey,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            sdp: pc.localDescription?.sdp,
            type: pc.localDescription?.type,
            participants: config.participants,
            customs: config.customs,
            session_id: config.sessionId,
          }),
        })
        if (!res.ok) throw new Error(`Offer rejected: ${res.status}`)
        await pc.setRemoteDescription(new RTCSessionDescription(await res.json()))
      }
      await attempt()
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'NotFoundError')
      setError(denied ? 'Allow your microphone and press start again.' : (err as Error).message)
      hangUp('failed')
    }
  }

  const toggleMute = () => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMuted(!track.enabled)
  }

  const live = phase === 'live'
  const busy = phase === 'connecting'
  const clock = left !== null ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : null
  const accentOpt = accents.find((a) => a.id === accent)
  const accentNote = accentOpt?.note

  const transcript = (
    <aside className={`transcript${panelOpen ? '' : ' is-closed'}`} aria-label="Transcript">
      <div className="transcript-head">
        <b>Transcript</b>
        {fullscreen ? (
          <button className="icon-btn" onClick={() => setPanelOpen(false)} aria-label="Hide transcript" title="Hide transcript">×</button>
        ) : null}
      </div>
      <div className="transcript-body" ref={scrollRef} onScroll={onScroll} aria-live="polite">
        {lines.length ? (
          lines.map((l) => (
            <p key={l.key} className={`tl tl--${l.role}${l.final ? '' : ' is-partial'}`}>
              <span className="tl-who">{l.role === 'agent' ? demo.label : 'You'}</span>
              {l.text}
            </p>
          ))
        ) : (
          <p className="muted small">
            {live ? 'Listening. What you both say appears here.' : 'The conversation will appear here once you start.'}
          </p>
        )}
      </div>
    </aside>
  )

  return (
    <section className={`room${fullscreen ? ' is-fullscreen' : ''}`} ref={rootRef}>
      {!fullscreen ? (
        <div className="room-head">
          <div>
            <h1>{demo.label}</h1>
            <p className="muted">{demo.role}</p>
          </div>
        </div>
      ) : null}
      <audio ref={audioRef} hidden />

      <div className="room-body">
        <div className="stage">
          <div className="pane">
            <video ref={agentVideoRef} playsInline autoPlay />
            {!hasAgentVideo ? (
              <span className="empty">{live ? (demo.video ? 'Waiting for the face…' : 'Voice only') : demo.role}</span>
            ) : null}
            <span className="pane-tag">{demo.label}{live && agentState ? ` · ${agentState}` : ''}</span>
            {live ? (
              <button className="icon-btn pane-fs" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  {fullscreen ? (
                    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                  ) : (
                    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                  )}
                </svg>
              </button>
            ) : null}
          </div>
          {demo.video ? (
            <div className="pane small">
              <video ref={ownVideoRef} playsInline autoPlay muted />
              <span className="pane-tag">You</span>
            </div>
          ) : null}

          {/* Fullscreen controls: the page's buttons are out of reach in fullscreen. */}
          {fullscreen ? (
            <div className="fs-bar">
              {clock ? <span className="fs-clock">{clock} left</span> : null}
              <button className={`btn ghost${muted ? ' is-on' : ''}`} onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
              <button className="btn danger-solid" onClick={() => hangUp('ended')}>End session</button>
              {!panelOpen ? <button className="btn ghost" onClick={() => setPanelOpen(true)}>Transcript</button> : null}
              <button className="btn ghost" onClick={toggleFullscreen}>Exit fullscreen</button>
            </div>
          ) : null}
        </div>

        {transcript}
      </div>

      {!fullscreen ? (
        <>
          <p className="state">
            {phase === 'idle' && 'Pick an accent, press start and talk.'}
            {phase === 'connecting' && 'Connecting…'}
            {live && `Live${clock ? ` — ${clock} left` : ''}`}
            {phase === 'ended' && 'Session ended.'}
            {phase === 'failed' && <span className="err">{error}</span>}
          </p>

          <div className="actions">
            <label className="accent">
              <span className="muted small">Voice</span>
              <select value={voice} disabled={live || busy} onChange={(e) => chooseVoice(e.target.value as VoiceStyle)}>
                <option value="standard">Standard</option>
                <option value="expressive">Expressive</option>
              </select>
            </label>
            <label className="accent">
              <span className="muted small">Accent</span>
              <select value={accent} disabled={live || busy} onChange={(e) => setAccent(e.target.value)}>
                {accents.map((a) => (
                  <option key={a.id} value={a.id} disabled={voice === 'expressive' && !a.expressive}>
                    {a.label}{voice === 'expressive' && !a.expressive ? ' (Standard voice only)' : ''}
                  </option>
                ))}
              </select>
            </label>
            {live || busy ? (
              <>
                <button className="btn ghost" onClick={toggleMute} disabled={!live}>{muted ? 'Unmute' : 'Mute'}</button>
                <button className="btn" onClick={() => hangUp('ended')}>End session</button>
                <button className="btn ghost" onClick={toggleFullscreen} disabled={!live}>Fullscreen</button>
              </>
            ) : (
              <button className="btn" onClick={start}>{phase === 'ended' ? 'Start again' : 'Start talking'}</button>
            )}
          </div>
          {accentNote ? <p className="muted small">Speak {accentNote}. Accent and voice are fixed once the session starts.</p> : null}

          {demo.opener && !live ? <p className="muted">Open with: “{demo.opener}”</p> : null}
          {demo.asks.length ? (
            <div className="asks">
              <b>Try saying</b>
              <ul>{demo.asks.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
