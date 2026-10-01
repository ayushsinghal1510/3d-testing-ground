// The API, mounted into Vite: the dev server in dev, `vite preview` in prod.
// The customs builders use `?raw` prompt imports and `#/` aliases, so they are
// always loaded through Vite — ssrLoadModule in dev, and in prod the SSR bundle
// that `npm run build` writes to dist/server (see server/entry.ts).

import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Connect, Plugin } from 'vite'

import {
  canUse,
  checkPassword,
  clearCookie,
  findUser,
  deleteUser,
  hashPassword,
  loadUsers,
  saveUser,
  sessionCookie,
  userFromCookie,
  type User,
} from './auth.ts'

const ROOM_MAX_SECONDS = Number(process.env.ROOM_MAX_SECONDS) || 300

function host(value: string | undefined): string {
  return (value ?? '').trim().replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '')
}

function participantsFor(video: boolean) {
  return {
    ai_participant: 'ai',
    participants: [
      { name: 'user', connections: [{ name: 'ai', video, audio: true }] },
      { name: 'ai', connections: [{ name: 'user', video, audio: true }] },
    ],
  }
}

type Entry = typeof import('./entry')

/* Voice style, chosen separately from the accent. "standard" is whatever voice
   the room's own vx config uses. "expressive" swaps in an ElevenLabs voice for the
   accents that have one; the UI only ever says Standard / Expressive. Applied after
   the room's customs are built, so it also covers rooms that hard-code their own
   tts_id (Jeremy, Marcia, the lab desk). */
export type VoiceStyle = 'standard' | 'expressive'
const EXPRESSIVE_MODEL = 'eleven_v3'
/* Shown names that differ from vx's. The id stays vx's, so the customs builders
   still get the accent they know; only the label people see changes. */
const ACCENT_LABELS: Record<string, string> = { english: 'American' }

/* What Expressive falls back to when the chosen accent has no expressive voice. */
const EXPRESSIVE_DEFAULT_ACCENT = 'english'

const EXPRESSIVE_VOICES: Record<string, string> = {
  english: '7EzWGsX10sAS4c9m9cPf', // American
  singaporean: 'aFxDLa1A1dSRlzW8nziT',
}

/* Expressive where the accent has a voice for it; standard otherwise. */
function resolveVoice(accent: string, wanted: string | null | undefined): VoiceStyle {
  return wanted === 'expressive' && EXPRESSIVE_VOICES[accent] ? 'expressive' : 'standard'
}

function withVoice(accent: string, voice: VoiceStyle, customs: unknown): unknown {
  const id = EXPRESSIVE_VOICES[accent]
  if (voice !== 'expressive' || !id) return customs
  return { ...(customs as object), tts_id: { service: 'elevenlabs', voice: id, model: EXPRESSIVE_MODEL } }
}

/* FACE_<DEMO>=uuid[,uuid…] in .env replaces that demo's face uuids in order,
   e.g. FACE_MC=… gives Marcia her own face instead of Jeremy's (vx reuses his). */
function withFaceOverride(id: string, customs: unknown): unknown {
  const raw = process.env[`FACE_${id.toUpperCase()}`]
  const c = customs as { faces?: { uuid: string }[] }
  if (!raw || !Array.isArray(c?.faces)) return customs
  const uuids = raw.split(',').map((u) => u.trim()).filter(Boolean)
  return { ...c, faces: c.faces.map((f, i) => (uuids[i] ? { ...f, uuid: uuids[i] } : f)) }
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return (raw ? JSON.parse(raw) : {}) as T
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(JSON.stringify(body))
}

export function api(): Plugin {
  return {
    name: 'avatar-api',
    configureServer(server) {
      server.middlewares.use(handler(() => server.ssrLoadModule('/server/entry.ts') as Promise<Entry>))
    },
    configurePreviewServer(server) {
      const built = pathToFileURL(resolve(process.cwd(), 'dist/server/entry.js')).href
      server.middlewares.use(handler(() => import(/* @vite-ignore */ built) as Promise<Entry>))
    },
  }
}

function handler(load: () => Promise<Entry>): Connect.NextHandleFunction {
  const demos = load
  const customs = load

  const visible = async (user: User) => {
    const { DEMOS } = await demos()
    return DEMOS.filter((d) => canUse(user, d.id)).map((d) => ({
      id: d.id,
      label: d.label,
      role: d.role,
      blurb: d.blurb,
      asks: d.asks,
      opener: d.opener,
      video: d.video,
    }))
  }

  const accentList = async () => {
    const { ACCENTS, DEFAULT_ACCENT } = await load()
    return {
      accents: ACCENTS.map((a) => ({
        id: a.id,
        label: ACCENT_LABELS[a.id] ?? a.label,
        note: a.note,
        expressive: !!EXPRESSIVE_VOICES[a.id],
      })),
      expressiveDefault: EXPRESSIVE_DEFAULT_ACCENT,
      defaultAccent: DEFAULT_ACCENT,
    }
  }

  /* An unknown id from the wire falls back to the vx default. */
  const resolveAccent = async (id: string | undefined): Promise<string> => {
    return (await load()).accentById(id).id
  }

  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    const path = req.url.split('?')[0]
    try {
      if (path === '/api/login' && req.method === 'POST') {
        const { username = '', password = '' } = await readJson<{ username?: string; password?: string }>(req)
        const user = await findUser(username.trim())
        if (!user || !checkPassword(user, password)) {
          return send(res, 401, { ok: false, reason: 'Wrong username or password.' })
        }
        return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(user.username) })
      }

      if (path === '/api/logout' && req.method === 'POST') {
        return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie })
      }

      const user = await userFromCookie(req.headers.cookie)
      if (!user) return send(res, 401, { ok: false, reason: 'Not signed in.' })

      if (path === '/api/me' && req.method === 'GET') {
        return send(res, 200, {
          ok: true,
          username: user.username,
          superAdmin: !!user.superAdmin,
          accent: user.accent ?? null,
          voice: user.voice ?? null,
          demos: await visible(user),
          ...(await accentList()),
        })
      }

      /* ---------- super-admin: user management ---------- */
      if (path.startsWith('/api/admin/')) {
        if (!user.superAdmin) return send(res, 403, { ok: false, reason: 'Super-admin only.' })
        const publicUser = (u: User) => ({ username: u.username, demos: u.demos, superAdmin: !!u.superAdmin, accent: u.accent ?? null, voice: u.voice ?? null })

        if (path === '/api/admin/demos' && req.method === 'GET') {
          const { DEMOS } = await demos()
          return send(res, 200, {
            ok: true,
            demos: DEMOS.map((d) => ({ id: d.id, label: d.label, role: d.role })),
            ...(await accentList()),
          })
        }

        if (path === '/api/admin/users' && req.method === 'GET') {
          return send(res, 200, { ok: true, users: (await loadUsers()).map(publicUser) })
        }

        /* Create, or update an existing user. A blank password on update keeps the old one. */
        if (path === '/api/admin/users' && req.method === 'POST') {
          const body = await readJson<{ username?: string; password?: string; demos?: string[]; superAdmin?: boolean; accent?: string | null; voice?: string | null }>(req)
          const username = (body.username ?? '').trim()
          if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(username)) {
            return send(res, 400, { ok: false, reason: 'Username: 2–40 letters, digits, _ . -' })
          }
          const existing = await findUser(username)
          const password = body.password ?? ''
          if (!existing && password.length < 6) {
            return send(res, 400, { ok: false, reason: 'Password must be at least 6 characters.' })
          }
          if (existing && password && password.length < 6) {
            return send(res, 400, { ok: false, reason: 'Password must be at least 6 characters.' })
          }
          if (existing?.superAdmin && !body.superAdmin && username === user.username) {
            return send(res, 400, { ok: false, reason: 'You cannot remove your own super-admin.' })
          }
          const next: User = {
            username,
            password: password ? hashPassword(password) : existing!.password,
            demos: Array.isArray(body.demos) ? body.demos.filter((d) => typeof d === 'string') : [],
            ...(body.superAdmin ? { superAdmin: true } : {}),
            ...(body.accent ? { accent: await resolveAccent(body.accent) } : {}),
            ...(body.voice === 'expressive' ? { voice: 'expressive' as const } : {}),
          }
          await saveUser(next)
          return send(res, 200, { ok: true, user: publicUser(next), created: !existing })
        }

        if (path === '/api/admin/users' && req.method === 'DELETE') {
          const { username = '' } = await readJson<{ username?: string }>(req)
          if (username === user.username) return send(res, 400, { ok: false, reason: 'You cannot delete yourself.' })
          if (!(await deleteUser(username))) return send(res, 404, { ok: false, reason: 'No such user.' })
          return send(res, 200, { ok: true })
        }

        return send(res, 404, { ok: false, reason: 'Not found.' })
      }

      if (path === '/api/start' && req.method === 'POST') {
        const { demo: id = '', accent: wanted, voice: wantedVoice } = await readJson<{ demo?: string; accent?: string; voice?: string }>(req)
        if (!canUse(user, id)) return send(res, 403, { ok: false, reason: 'You do not have access to that one.' })

        const { demoById } = await demos()
        const demo = demoById(id)
        if (demo.id !== id) return send(res, 404, { ok: false, reason: 'Unknown demo.' })

        const apiKey = process.env.VX_FLOW_API_KEY || ''
        const target = host(demo.video ? process.env.VX_VOICEBOT_GPU : process.env.VX_VOICEBOT || 'voice.voxio.in')
        if (!apiKey || !target) {
          return send(res, 503, { ok: false, reason: 'The voice server is not configured (.env).' })
        }

        const { buildRoomCustoms } = await customs()
        const accent = await resolveAccent(wanted ?? user.accent ?? undefined)
        const voice = resolveVoice(accent, wantedVoice ?? user.voice)
        return send(res, 200, {
          ok: true,
          sessionId: crypto.randomUUID(),
          server: target,
          apiKey,
          accent,
          voice,
          customs: withVoice(accent, voice, withFaceOverride(demo.id, buildRoomCustoms(demo.id, '', accent as never))),
          participants: participantsFor(demo.video),
          maxSeconds: ROOM_MAX_SECONDS,
        })
      }

      return send(res, 404, { ok: false, reason: 'Not found.' })
    } catch (err) {
      console.error('[api]', err)
      return send(res, 500, { ok: false, reason: 'Server error.' })
    }
  }
}
