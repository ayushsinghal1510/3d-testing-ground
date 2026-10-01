// npm run add-user -- <username> <password> <demo,demo,...|*> [--super]
// Adds or replaces a user in the Neon database (DATABASE_URL in .env).
//   npm run add-user -- msf secret123 mm,pr
//   npm run add-user -- lab secret123 lab
//   npm run add-user -- admin secret123 '*' --super   (super-admin: manages users in the UI)

import { randomBytes, scryptSync } from 'node:crypto'

import { neon } from '@neondatabase/serverless'

const args = process.argv.slice(2)
const superAdmin = args.includes('--super')
const [username, password, demos] = args.filter((a) => a !== '--super')
if (!username || !password || !demos) {
  console.error('usage: npm run add-user -- <username> <password> <demo,demo,...|*> [--super]')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

// Same table as server/auth.ts, so this works before the server has ever run.
await sql`
  CREATE TABLE IF NOT EXISTS app_users (
    username    text PRIMARY KEY,
    password    text NOT NULL,
    demos       text[] NOT NULL DEFAULT '{}',
    super_admin boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
  )`
await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS accent text`
await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS voice text`

const salt = randomBytes(16).toString('hex')
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const list = demos.split(',').map((d) => d.trim()).filter(Boolean)

await sql`
  INSERT INTO app_users (username, password, demos, super_admin)
  VALUES (${username}, ${hash}, ${list}, ${superAdmin})
  ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password, demos = EXCLUDED.demos, super_admin = EXCLUDED.super_admin`

console.log(`saved ${username} → ${list.join(', ')}${superAdmin ? ' (super-admin)' : ''}`)
