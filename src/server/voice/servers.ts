// The three Voxio backends, in one place.

/** A bare host, from a host or a URL. Empty stays empty. */
function host(value: string | undefined, fallback = ''): string {
  const raw = (value ?? '').trim() || fallback
  if (!raw) return ''
  return raw
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/+$/, '')
    .replace(/\/.*$/, '')
}

export const SERVERS = {
  /** Browser WebRTC, audio only — the interview and navigator demos. */
  voicebot: host(process.env.VX_VOICEBOT ?? process.env.VX_SERVER, 'voice.voxio.in'),

  voicebotGpu: host(process.env.VX_VOICEBOT_GPU ?? process.env.VX_SERVER_GPU),

  /** Telephony. Not the same host as either of the above. */
  callbot: host(process.env.VX_CALLBOT ?? process.env.VOXIO_GATEWAY),

  /** Text chat with a flow (the SDK's chat: /agents/start_session, /agents/process_input). */
  chat: host(process.env.VX_CHAT, 'chat.voxio.in'),

  /** Config store (flows, numbers, agents) — the dashboard reads and writes here. */
  database: host(process.env.VX_DATABASE),
} as const

export type ServerName = keyof typeof SERVERS
