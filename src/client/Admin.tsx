// Super-admin: create users, edit which rooms they can open, delete them.

import { useCallback, useEffect, useState } from 'react'

import { type AccentOpt, type VoiceStyle } from './main'
import PasswordInput from './PasswordInput'

type DemoOpt = { id: string; label: string; role: string }
type AdminUser = { username: string; demos: string[]; superAdmin: boolean; accent: string | null; voice: VoiceStyle | null }

const EMPTY = { username: '', password: '', demos: [] as string[], superAdmin: false, accent: '', voice: 'standard' as VoiceStyle }

async function call<T>(method: string, url: string, body?: unknown): Promise<T & { ok: boolean; reason?: string }> {
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

export default function Admin({ me }: { me: string }) {
  const [demos, setDemos] = useState<DemoOpt[]>([])
  const [accents, setAccents] = useState<AccentOpt[]>([])
  const [defaultAccent, setDefaultAccent] = useState('')
  const [expressiveDefault, setExpressiveDefault] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [d, u] = await Promise.all([
      call<{ demos: DemoOpt[]; accents: AccentOpt[]; defaultAccent: string; expressiveDefault: string }>('GET', '/api/admin/demos'),
      call<{ users: AdminUser[] }>('GET', '/api/admin/users'),
    ])
    if (d.ok) {
      setDemos(d.demos)
      setAccents(d.accents)
      setDefaultAccent(d.defaultAccent)
      setExpressiveDefault(d.expressiveDefault)
    }
    if (u.ok) setUsers(u.users.sort((a, b) => a.username.localeCompare(b.username)))
    if (!d.ok || !u.ok) setMsg({ kind: 'err', text: d.reason ?? u.reason ?? 'Could not load.' })
  }, [])

  useEffect(() => void load(), [load])

  const labelOf = (id: string) => (id === '*' ? 'All rooms' : (demos.find((d) => d.id === id)?.label ?? id))

  const toggleDemo = (id: string) =>
    setForm((f) => ({ ...f, demos: f.demos.includes(id) ? f.demos.filter((x) => x !== id) : [...f.demos, id] }))

  const allRooms = form.demos.includes('*')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const r = await call<{ created: boolean }>('POST', '/api/admin/users', { ...form, accent: form.accent || null, voice: form.voice === 'expressive' ? 'expressive' : null })
    setBusy(false)
    if (!r.ok) return setMsg({ kind: 'err', text: r.reason ?? 'Save failed.' })
    setMsg({ kind: 'ok', text: `${form.username} ${r.created ? 'created' : 'updated'}.` })
    setForm(EMPTY)
    setEditing(false)
    void load()
  }

  const remove = async (username: string) => {
    if (!window.confirm(`Delete ${username}?`)) return
    const r = await call('DELETE', '/api/admin/users', { username })
    setMsg(r.ok ? { kind: 'ok', text: `${username} deleted.` } : { kind: 'err', text: r.reason ?? 'Delete failed.' })
    void load()
  }

  const edit = (u: AdminUser) => {
    setForm({ username: u.username, password: '', demos: u.demos, superAdmin: u.superAdmin, accent: u.accent ?? '', voice: u.voice ?? 'standard' })
    setEditing(true)
    setMsg(null)
  }

  return (
    <main className="admin">
      <h1>Users</h1>
      {msg ? <p className={msg.kind === 'err' ? 'err' : 'ok'}>{msg.text}</p> : null}

      <form className="panel" onSubmit={save}>
        <h2>{editing ? `Edit ${form.username}` : 'Create a user'}</h2>
        <div className="row">
          <label>Username
            <input value={form.username} disabled={editing} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label>{editing ? 'New password (blank keeps it)' : 'Password'}
            <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </label>
          <label>Default voice
            <select value={form.voice} onChange={(e) => {
              const v = e.target.value as VoiceStyle
              // Expressive needs an accent that has an expressive voice; switch to the default one if not.
              const ok = !!accents.find((a) => a.id === form.accent)?.expressive
              setForm({ ...form, voice: v, accent: v === 'expressive' && !ok ? expressiveDefault : form.accent })
            }}>
              <option value="standard">Standard</option>
              <option value="expressive">Expressive</option>
            </select>
          </label>
          <label>Default accent
            <select value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })}>
              <option value="" disabled={form.voice === 'expressive'}>Site default ({accents.find((a) => a.id === defaultAccent)?.label ?? defaultAccent})</option>
              {accents.map((a) => (
                <option key={a.id} value={a.id} disabled={form.voice === 'expressive' && !a.expressive}>{a.label} — {a.note}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend>Rooms this user can open</legend>
          <label className="check">
            <input type="checkbox" checked={allRooms} onChange={() => setForm({ ...form, demos: allRooms ? [] : ['*'] })} />
            <b>All rooms</b>
          </label>
          <div className="checks">
            {demos.map((d) => (
              <label key={d.id} className="check">
                <input type="checkbox" disabled={allRooms || form.superAdmin} checked={allRooms || form.demos.includes(d.id)} onChange={() => toggleDemo(d.id)} />
                <span>{d.label}<small className="muted"> — {d.role}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="check">
          <input type="checkbox" checked={form.superAdmin} disabled={editing && form.username === me} onChange={(e) => setForm({ ...form, superAdmin: e.target.checked })} />
          <span>Super-admin <small className="muted">— can manage users and opens every room</small></span>
        </label>

        <div className="actions">
          <button className="btn" disabled={busy}>{editing ? 'Save changes' : 'Create user'}</button>
          {editing ? <button type="button" className="btn ghost" onClick={() => { setForm(EMPTY); setEditing(false) }}>Cancel</button> : null}
        </div>
      </form>

      <table className="users">
        <thead><tr><th>User</th><th>Rooms</th><th>Voice / accent</th><th /></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.username}{u.superAdmin ? <span className="tag inline">super-admin</span> : null}</td>
              <td className="muted">{u.superAdmin ? 'All rooms' : u.demos.length ? u.demos.map(labelOf).join(', ') : 'None'}</td>
              <td className="muted">{u.voice === 'expressive' ? 'Expressive' : 'Standard'} · {u.accent ? (accents.find((a) => a.id === u.accent)?.label ?? u.accent) : 'Default'}</td>
              <td className="right">
                <button className="btn ghost sm" onClick={() => edit(u)}>Edit</button>
                {u.username !== me ? <button className="btn ghost sm danger" onClick={() => remove(u.username)}>Delete</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
