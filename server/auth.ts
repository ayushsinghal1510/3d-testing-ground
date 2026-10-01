// Users, passwords and the session cookie. Users live in Neon Postgres
// (DATABASE_URL); the table is created on first use.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { neon } from '@neondatabase/serverless'

export type User = {
  username: string
  /** "salt:hash", both hex, from scrypt */
  password: string
  /** demo ids this user may open, or ["*"] for all of them */
  demos: string[]
  /** can open the Users page and manage users; sees every demo */
  superAdmin?: boolean
  /** accent id the rooms open with; the user can still change it per session */
  accent?: string
  /** default voice style; absent means standard */
  voice?: 'expressive'
}

const COOKIE = 'sid'
const MAX_AGE_S = 60 * 60 * 12

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set')
  return s
}

let sqlFn: ReturnType<typeof neon> | null = null
let ready: Promise<unknown> | null = null

/* Lazy, so the env is loaded by the time the first request needs it. */
async function sql() {
  if (!sqlFn) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    sqlFn = neon(url)
  }
  ready ??= sqlFn`
    CREATE TABLE IF NOT EXISTS app_users (
      username    text PRIMARY KEY,
      password    text NOT NULL,
      demos       text[] NOT NULL DEFAULT '{}',
      super_admin boolean NOT NULL DEFAULT false,
      created_at  timestamptz NOT NULL DEFAULT now()
    )`.then(() => sqlFn!`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS accent text`)
    .then(() => sqlFn!`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS voice text`)
  await ready
  return sqlFn
}

type Row = { username: string; password: string; demos: string[]; super_admin: boolean; accent: string | null; voice: string | null }

const toUser = (r: Row): User => ({
  username: r.username,
  password: r.password,
  demos: r.demos ?? [],
  ...(r.super_admin ? { superAdmin: true } : {}),
  ...(r.accent ? { accent: r.accent } : {}),
  ...(r.voice === 'expressive' ? { voice: 'expressive' as const } : {}),
})

export async function loadUsers(): Promise<User[]> {
  const db = await sql()
  const rows = (await db`SELECT username, password, demos, super_admin, accent, voice FROM app_users ORDER BY username`) as Row[]
  return rows.map(toUser)
}

export async function findUser(username: string): Promise<User | undefined> {
  const db = await sql()
  const rows = (await db`SELECT username, password, demos, super_admin, accent, voice FROM app_users WHERE username = ${username}`) as Row[]
  return rows[0] ? toUser(rows[0]) : undefined
}

/** Insert, or replace an existing user of the same name. */
export async function saveUser(user: User): Promise<void> {
  const db = await sql()
  await db`
    INSERT INTO app_users (username, password, demos, super_admin, accent, voice)
    VALUES (${user.username}, ${user.password}, ${user.demos}, ${!!user.superAdmin}, ${user.accent ?? null}, ${user.voice ?? null})
    ON CONFLICT (username) DO UPDATE
      SET password = EXCLUDED.password, demos = EXCLUDED.demos,
          super_admin = EXCLUDED.super_admin, accent = EXCLUDED.accent, voice = EXCLUDED.voice`
}

export async function deleteUser(username: string): Promise<boolean> {
  const db = await sql()
  const rows = (await db`DELETE FROM app_users WHERE username = ${username} RETURNING username`) as Row[]
  return rows.length > 0
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

export function checkPassword(user: User, password: string): boolean {
  const [salt, hash] = user.password.split(':')
  if (!salt || !hash) return false
  const got = scryptSync(password, salt, 64)
  const want = Buffer.from(hash, 'hex')
  return got.length === want.length && timingSafeEqual(got, want)
}

export function canUse(user: User, demoId: string): boolean {
  return !!user.superAdmin || user.demos.includes('*') || user.demos.includes(demoId)
}

const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url')

/** `username.expiry.signature` — enough for a testing ground, no server-side store. */
export function sessionCookie(username: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S
  const body = `${Buffer.from(username).toString('base64url')}.${exp}`
  return `${COOKIE}=${body}.${sign(body)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}`
}

export const clearCookie = `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`

/* The user is re-read from the database on every request, so a deleted user
   or a changed room list takes effect immediately, cookie or not. */
export async function userFromCookie(header: string | undefined): Promise<User | null> {
  const raw = header
    ?.split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  if (!raw) return null
  const [name, exp, sig] = raw.split('.')
  if (!name || !exp || !sig) return null
  const expected = sign(`${name}.${exp}`)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  if (Number(exp) < Date.now() / 1000) return null
  return (await findUser(Buffer.from(name, 'base64url').toString())) ?? null
}
