// Which sessions were started from the Test tab.
//
// Sessions of flows in our own tables carry `test: true`. Live flows' sessions
// come from the voice backend, which has no such flag yet, so the ids of tests
// run from this browser are remembered here too. Per browser, best effort.

import type { Session } from './types'

const KEY = 'vx.test.sessions'
const MAX = 200

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch { return [] }
}

export function rememberTestSession(id: string) {
  try { localStorage.setItem(KEY, JSON.stringify([id, ...read().filter((x) => x !== id)].slice(0, MAX))) } catch {}
}

/** Ids remembered in this browser; empty on the server. */
export function testSessionIds(): Set<string> {
  return typeof window === 'undefined' ? new Set() : new Set(read())
}

export const isTestSession = (s: Session, local: Set<string>) => !!s.test || local.has(s.sessionId)
