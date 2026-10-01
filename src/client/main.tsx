import { StrictMode, useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import Admin from './Admin'
import PasswordInput from './PasswordInput'
import Room, { type DemoCard } from './Room'
import './app.css'

export type AccentOpt = { id: string; label: string; note: string; expressive: boolean }
export type VoiceStyle = 'standard' | 'expressive'

type Me = {
  username: string
  superAdmin: boolean
  demos: DemoCard[]
  accents: AccentOpt[]
  defaultAccent: string
  /** the accent Expressive switches to when the current one has no expressive voice */
  expressiveDefault: string
  /** this user's own default, set by a super-admin */
  accent: string | null
  voice: VoiceStyle | null
}

function App() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const [open, setOpen] = useState<DemoCard | null>(null)
  const [view, setView] = useState<'rooms' | 'admin'>('rooms')

  const refresh = useCallback(async () => {
    const r = await fetch('/api/me')
    setMe(r.ok ? ((await r.json()) as Me) : null)
  }, [])

  useEffect(() => void refresh(), [refresh])

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setOpen(null)
    setView('rooms')
    setMe(null)
  }

  if (me === undefined) return <div className="shell muted">Loading…</div>
  if (me === null) return <Login onDone={refresh} />

  return (
    <div className="shell">
      <header className="top">
        <b>Avatar Rooms</b>
        {me.superAdmin ? (
          <nav className="tabs">
            <button className={view === 'rooms' ? 'on' : ''} onClick={() => setView('rooms')}>Rooms</button>
            <button className={view === 'admin' ? 'on' : ''} onClick={() => { setOpen(null); setView('admin') }}>Users</button>
          </nav>
        ) : null}
        <span className="muted">{me.username}</span>
        <button className="btn ghost" onClick={logout}>Sign out</button>
      </header>

      {view === 'admin' && me.superAdmin ? (
        <Admin me={me.username} />
      ) : open ? (
        <>
          <button className="btn ghost back" onClick={() => setOpen(null)}>← All rooms</button>
          <Room key={open.id} demo={open} accents={me.accents} expressiveDefault={me.expressiveDefault} initialAccent={me.accent ?? me.defaultAccent} initialVoice={me.voice ?? 'standard'} />
        </>
      ) : (
        <main>
          <h1>Choose who to talk to</h1>
          {!me.demos.length ? (
            <p className="muted">No rooms are assigned to your account yet.</p>
          ) : (
            <div className="grid">
              {me.demos.map((d) => (
                <button key={d.id} className="card" onClick={() => setOpen(d)}>
                  <span className="tag">{d.video ? 'Video avatar' : 'Voice'}</span>
                  <b>{d.label}</b>
                  <span className="muted">{d.role}</span>
                  <p>{d.blurb}</p>
                </button>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    setBusy(false)
    if (r.ok) return onDone()
    setError(((await r.json().catch(() => null)) as { reason?: string } | null)?.reason ?? 'Sign in failed.')
  }

  return (
    <div className="shell center">
      <form className="login" onSubmit={submit}>
        <h1>Sign in</h1>
        <label>Username<input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Password<PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error ? <p className="err">{error}</p> : null}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
