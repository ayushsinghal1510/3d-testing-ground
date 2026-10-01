// The dashboard's data model. Shapes follow the backend's documents (flow keys
// are hyphenated like the engine reads them); anything the backend can't hold
// yet lives in the mock store and is marked by `mock` below.

import type { Workflow } from '#/lib/workflow/convert'

export type Source = 'live' | 'mock'

export type ProviderConfig = { service: string; [k: string]: unknown }

export type Session = {
  sessionId: string
  type: string // phone | browser | avatar
  startTime: string
  endTime: string
  totalConnectedTime: number // seconds
  totalAiTime: number
  totalHumanTime: number
  aiTokens: number
  humanTokens: number
  recordingUrl?: string
  transcription: { role: string; content: string }[] | string | unknown
  from?: string
  to?: string
  status?: string
  /** Avatar sessions: the agent's rendered face, and the user's camera if it was on. */
  avatarVideoUrl?: string
  clientVideoUrl?: string
  /** Web-navigation sessions: every action the agent took on the page, in order. */
  webActions?: WebActionEvent[]
  /** Started from the dashboard's Test tab. */
  test?: boolean
}

/** What the Test tab may do for a flow. */
export type TestSetup = {
  /** The voice servers can run this flow. */
  testable: boolean
  /** Why not, in plain words, when it can't. */
  reason?: string
  /** Phone tests are available (the backend's calls API is configured). */
  phone: boolean
  /** Voice server for the browser session. */
  baseUrl: string
  /** Chat server for the chat test. */
  chatUrl: string
  /** The flow's API key: tests authenticate with it. Only for a flow this account may test. */
  flowKey?: string
  /** Copied from the old backend: the voice servers run their own copy of it. */
  imported?: boolean
}

export type TestTurn = { role: 'user' | 'assistant'; content: string }

export type TestCall = {
  id: string
  status: 'scheduled' | 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'canceled'
  sessionId?: string
  /** Filled once the call has ended and the session could be read. */
  transcript?: TestTurn[]
  seconds?: number
}

export type WebActionEvent = {
  /** Seconds into the session. */
  at: number
  /** What the agent was saying when it acted. */
  said: string
  action: { type: string; target?: string }
  status: 'ok' | 'error' | 'timeout' | 'interrupted' | 'no_channel'
  /** How long the page took to ack. */
  ms: number
}

export type NumberDoc = { phone_number: string; provider?: string; added_at?: string }

export type WebAction = { type: string; description: string; params?: string }

export type Delivery = {
  id: string
  at: string
  event: string
  url: string
  status: number | null
  ms: number
  attempt: number
  request: unknown
  response?: string
}

export type FlowDoc = {
  key: string
  source: Source
  /** Fields held by the mock store because the backend can't store them yet. */
  mock: string[]
  flow_name: string
  created_at?: string

  workflow: Workflow
  'webhook-url': string
  'webhook-secret'?: string
  'webhook-events'?: string[]

  stt: ProviderConfig | null
  tts: ProviderConfig | null
  /** Shared voice presets this flow points at (mock until the backend supports references). */
  stt_ref?: string | null
  tts_ref?: string | null

  kbs: string[]
  faces: { version?: string | null; expressions: { uuid: string; label: string; usage?: string }[]; transitions: { from: string; to: string; uuid: string; label: string }[] }
  vision_id: Record<string, unknown> | null
  running_vision_id: Record<string, unknown> | null
  integrations: string[]
  'web-actions': WebAction[]

  numbers: NumberDoc[]
  sessions: Session[]
  deliveries: Delivery[]

  /** Runtime knobs (pre-fire, inactivity, process-type, …) — see lib/dashboard/knobs. */
  [knob: string]: unknown
}

export type Connection = { kind: 'number' | 'integration' | 'webhook' | 'web'; label: string }
export type FlowSummary = { key: string; name: string; source: Source; sessions: number; minutes: number; connections: Connection[]; error?: string }

export type VoicePreset = { id: string; name: string; kind: 'stt' | 'tts'; config: ProviderConfig; used_by: string[] }
export type KnowledgeBase = { id: string; name: string; sources: { kind: string; label: string; status: 'ready' | 'indexing' | 'failed'; chunks: number; added_at: string }[] }
export type Avatar = { uuid: string; label: string; detector: 's3fd' | 'dwpose'; frames: number; fps: number; created_at: string; /** A short looping preview of the face. */ preview?: string }
export type Integration = { id: string; kind: 'shopify'; name: string; status: 'connected' | 'error'; connected_at: string }

export type OwnedNumber = { phone_number: string; label?: string; added_at: string }

export type Account = {
  /** Numbers Voxio has provisioned for this account. */
  numbers?: OwnedNumber[]
  name: string
  email: string
  apiKey: string
  apiKeyRotatedAt?: string
  voices: VoicePreset[]
  knowledge: KnowledgeBase[]
  avatars: Avatar[]
  integrations: Integration[]
}

export type Result<T = unknown> = { ok: true; data: T; note?: string } | { ok: false; reason: string }
