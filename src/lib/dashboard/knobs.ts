// Runtime settings callbot / voicebot read off the flow document
// (callbot/connection/services_.py, voicebot/connection/services_.py, dcs/voice_/config_.py).
// Behaviour, Voice and Avatar edit them; Customs overrides them per call.
// Settings that are objects on the document are described field by field, so
// the UI never shows JSON.

import type { Option } from './providers'

export type SubField = { key: string; label: string; kind: 'number' | 'text' | 'select'; unit?: string; min?: number; max?: number; step?: number; options?: Option[]; help?: string }

export type Knob = {
  key: string
  label: string
  kind: 'bool' | 'number' | 'slider' | 'select' | 'object'
  help?: string
  options?: Option[]
  /** (i) text per option, for selects. */
  optionInfo?: Record<string, string>
  fields?: SubField[]
  min?: number
  max?: number
  step?: number
  unit?: string
  default: unknown
  surface?: 'web' | 'phone'
  group: 'Pipeline' | 'Turn-taking' | 'Inactivity' | 'Listening' | 'Speaking' | 'Avatar'
  /** Only shown when this other knob is on. */
  requires?: string
}

const INTERRUPT: Option[] = [
  { value: 'full', label: 'Stop and listen' },
  { value: 'no', label: 'Finish the sentence' },
  { value: 'duration', label: 'Finish the first moment, then listen' },
]

export const KNOBS: Knob[] = [
  { key: 'process-type', label: 'Conversation engine', help: 'How the agent decides the caller has finished. Hover each option to compare.', kind: 'select', default: 'stt-native', group: 'Pipeline',
    options: [{ value: 'speech-native', label: 'Speech-native', hint: 'Recommended' }, { value: 'stt-native', label: 'Transcript-based' }],
    optionInfo: {
      'speech-native': 'Listens to how the caller speaks to know when they’ve finished, and can start replying early.',
      'stt-native': 'Waits for the finished transcript before replying. Simpler, a little slower.',
    } },
  { key: 'warmup-agent', label: 'Warm up before the call', kind: 'bool', default: false, group: 'Pipeline', help: 'Makes the first reply faster.' },
  { key: 'first-chunk-fast', label: 'Speak the first words immediately', help: 'Start talking as soon as the first words are ready.', kind: 'bool', default: false, group: 'Pipeline' },

  { key: 'pre-fire', label: 'Reply early', kind: 'bool', default: false, group: 'Turn-taking', help: 'Starts answering before the silence ends; undone if the caller keeps talking.' },
  { key: 'pre-fire-config', label: 'Early-reply window', help: 'How early the agent may start replying; it adapts between the shortest and longest.', kind: 'object', default: { min: 50, max: 5000, current: 100 }, group: 'Turn-taking', requires: 'pre-fire',
    fields: [
      { key: 'current', label: 'Start at', kind: 'number', unit: 'ms', min: 0, step: 10 },
      { key: 'min', label: 'Shortest', kind: 'number', unit: 'ms', min: 0, step: 10 },
      { key: 'max', label: 'Longest', kind: 'number', unit: 'ms', min: 0, step: 100 },
    ] },
  { key: 'streaming-grace-ms', label: 'Hold the floor after replying', kind: 'number', unit: 'ms', min: 0, max: 5000, step: 50, default: 250, group: 'Turn-taking', help: 'A late “uh” in this window isn’t treated as a new turn.' },
  { key: 'speaker-turn-timeout-ms', label: 'Caller’s pause before replying', help: 'How long the caller can pause before the agent answers.', kind: 'number', unit: 'ms', min: 100, max: 5000, step: 50, default: 600, group: 'Turn-taking' },
  { key: 'vad-threshold', label: 'Voice detection sensitivity', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, surface: 'web', group: 'Turn-taking', help: 'Higher ignores background noise. Web calls only.' },

  { key: 'inactivity', label: 'Nudge when the caller goes quiet', help: 'Say something if the caller goes quiet.', kind: 'bool', default: false, group: 'Inactivity' },
  { key: 'inactivity-metadata', label: 'Nudge', help: 'What the agent says, and how often.', kind: 'object', group: 'Inactivity', requires: 'inactivity',
    default: { 'time-period': 1000, 'max-times': 3, 'inactivity-type': 'static', message: 'Are you still there?', 'interruption-type': 'full', 'interruption-metadata': {} },
    fields: [
      { key: 'message', label: 'What to say', kind: 'text' },
      { key: 'time-period', label: 'After', kind: 'number', unit: 'ms', min: 500, step: 100 },
      { key: 'max-times', label: 'At most', kind: 'number', unit: 'times', min: 1, step: 1 },
      { key: 'interruption-type', label: 'If the caller talks over it', kind: 'select', options: INTERRUPT },
    ] },

  { key: 'voice-isolation', label: 'Background noise suppression', help: 'Removes background noise from the caller’s audio.', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0, group: 'Listening' },

  { key: 'grain-voice', label: 'Natural texture', kind: 'bool', default: true, group: 'Speaking', help: 'Adds a faint grain so the voice sounds less synthetic.' },
  { key: 'grain-level', label: 'Texture strength', help: 'How strong the texture is.', kind: 'slider', min: 0, max: 0.15, step: 0.005, default: 0.025, group: 'Speaking', requires: 'grain-voice' },

  { key: 'lipsync-model', label: 'Lip-sync model', kind: 'select', default: 'wav2lip', surface: 'web', group: 'Avatar',
    options: [{ value: 'wav2lip', label: 'Wav2Lip' }, { value: 'musetalk', label: 'MuseTalk' }], help: 'Must match how the faces were prepared.' },
  { key: 'lipsync-quality', label: 'Lip-sync quality', help: 'Higher looks sharper.', kind: 'select', default: 'medium', surface: 'web', group: 'Avatar',
    options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
]

export const BEHAVIOUR_GROUPS = ['Pipeline', 'Turn-taking', 'Inactivity'] as const
export const knobsIn = (g: Knob['group']) => KNOBS.filter((k) => k.group === g)

/** Flow keys PUT /flow accepts today. Everything else is held by the dashboard until the backend adds it. */
export const LIVE_WRITABLE = new Set(['flow_name', 'kbs', 'stt', 'tts', 'faces', 'transitions', 'vision_id', 'running_vision_id', 'agent'])
