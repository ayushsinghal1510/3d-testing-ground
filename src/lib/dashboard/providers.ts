// Every STT / TTS setting the voice pipeline can take, per provider. Keys are
// our hyphenated config names; see vx-backend-monorepo/docs/VOICE_PROVIDER_CONFIG.md
// for which ones the clients read today. `encoding` and `sample-rate` are set
// by the pipeline per surface, so they're deliberately not here.

export type Option = { value: string; label: string; hint?: string; /** Longer note shown beside the open dropdown. */ info?: string }

export type ProviderField = {
  key: string
  label: string
  kind: 'select' | 'number' | 'slider' | 'bool' | 'text' | 'tags'
  options?: Option[]
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  default?: unknown
  /** Shown up front; everything else sits under "More settings". */
  basic?: boolean
  /** One line, shown in the (i) tooltip. */
  help?: string
  /** Only relevant when another field has this value, e.g. a model family. */
  when?: { key: string; test: (v: unknown) => boolean }
}

export type Provider = { service: string; label: string; blurb: string; fields: ProviderField[]; defaults: Record<string, unknown> }

const opts = (...v: (string | [string, string, string?, string?])[]): Option[] =>
  v.map((x) => (typeof x === 'string' ? { value: x, label: x } : { value: x[0], label: x[1], hint: x[2], info: x[3] }))

const INDIC = opts(
  ['en-IN', 'English (India)'], ['hi-IN', 'Hindi'], ['bn-IN', 'Bengali'], ['gu-IN', 'Gujarati'], ['kn-IN', 'Kannada'],
  ['ml-IN', 'Malayalam'], ['mr-IN', 'Marathi'], ['od-IN', 'Odia'], ['pa-IN', 'Punjabi'], ['ta-IN', 'Tamil'], ['te-IN', 'Telugu'],
)

const isFlux = (v: unknown) => String(v ?? '').startsWith('flux')
const notFlux = (v: unknown) => !isFlux(v)
const isBulbul3 = (v: unknown) => String(v ?? 'bulbul:v3') === 'bulbul:v3'
const isBulbul2 = (v: unknown) => String(v ?? '') === 'bulbul:v2'

export const STT_PROVIDERS: Provider[] = [
  {
    service: 'deepgram-streaming', label: 'Deepgram', blurb: 'Fast, accurate English and Indian English',
    defaults: { model: 'nova-3', language: 'en-IN' },
    fields: [
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'nova-3', options: opts(
        ['nova-3', 'Nova 3', 'Best general accuracy', 'The safe default. Accurate on English and Indian English, fast enough for live calls.'], ['nova-3-medical', 'Nova 3 Medical', '', 'Knows drug names, conditions and procedures. Use for clinics and pharmacies.'], ['nova-2', 'Nova 2', '', 'Previous generation. Only pick it if Nova 3 struggles with a specific accent.'],
        ['nova-2-phonecall', 'Nova 2 Phone call', 'Tuned for 8 kHz calls', 'Trained on low-quality phone audio. Can help on noisy mobile lines.'],
        ['flux-general-en', 'Flux (English)', 'Built-in turn detection', 'Knows when the caller has finished speaking, so replies feel snappier. English only.'], ['flux-general-multi', 'Flux (Multilingual)', 'Built-in turn detection', 'Flux turn detection for callers who switch languages.']), help: 'Which speech model listens. Hover an option to compare.' },
      { key: 'language', label: 'Language', kind: 'select', basic: true, default: 'en-IN', when: { key: 'model', test: notFlux },
        options: opts(['en-IN', 'English (India)'], ['en', 'English'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['hi', 'Hindi'], ['multi', 'Multilingual', 'Code-switching']), help: 'The language callers speak.' },
      { key: 'language-hint', label: 'Language hint', kind: 'text', placeholder: 'e.g. hi', when: { key: 'model', test: (v) => v === 'flux-general-multi' }, help: 'The language callers most often use.' },
      { key: 'keyterm', label: 'Boost words', kind: 'tags', basic: true, placeholder: 'Product names, jargon…', help: 'Words the agent should never mishear.' },
      { key: 'endpointing', label: 'End-of-speech silence', kind: 'number', unit: 'ms', min: 10, max: 5000, step: 10, default: 300, when: { key: 'model', test: notFlux }, help: 'Silence before a sentence is considered finished.' },
      { key: 'utterance-end-ms', label: 'Utterance end', kind: 'number', unit: 'ms', min: 1000, max: 1000, step: 100, default: 1000, when: { key: 'model', test: notFlux }, help: 'Longest gap allowed inside one sentence.' },
      { key: 'eot-threshold', label: 'Turn-end confidence', kind: 'slider', min: 0.5, max: 1, step: 0.05, default: 0.7, when: { key: 'model', test: isFlux }, help: 'How sure the model must be that the caller finished.' },
      { key: 'eager-eot-threshold', label: 'Early reply confidence', kind: 'slider', min: 0.3, max: 0.9, step: 0.05, when: { key: 'model', test: isFlux }, help: 'Lets the agent start answering early.' },
      { key: 'eot-timeout-ms', label: 'Turn timeout', kind: 'number', unit: 'ms', min: 500, max: 60000, step: 100, default: 5000, when: { key: 'model', test: isFlux }, help: 'Longest the agent waits before replying anyway.' },
      { key: 'smart-format', label: 'Smart formatting', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Numbers, dates and currency as digits.' },
      { key: 'punctuate', label: 'Punctuation', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Add commas, full stops and question marks.' },
      { key: 'numerals', label: 'Numbers as digits', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Write “twenty five” as 25.' },
      { key: 'interim-results', label: 'Live partial results', kind: 'bool', default: true, when: { key: 'model', test: notFlux }, help: 'Transcribe while the caller is still talking.' },
      { key: 'vad-events', label: 'Speech-start events', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Signal the moment the caller starts speaking.' },
      { key: 'profanity-filter', label: 'Filter profanity', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Mask swear words in transcripts.' },
      { key: 'diarize', label: 'Tell speakers apart', kind: 'bool', default: false, when: { key: 'model', test: notFlux }, help: 'Label who said what when more than one person talks.' },
      { key: 'redact', label: 'Redact', kind: 'tags', placeholder: 'pci, ssn, numbers', when: { key: 'model', test: notFlux }, help: 'Hide card numbers, SSNs or all numbers from transcripts.' },
    ],
  },
  {
    service: 'soniox', label: 'Soniox', blurb: 'Strong on Hindi–English mixing',
    defaults: { model: 'stt-rt-v4', language: ['hi', 'en'] },
    fields: [
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'stt-rt-v4', options: opts(['stt-rt-v5', 'Real-time v5', 'Latest', 'Newest Soniox model, with finer control over when a sentence ends.'], ['stt-rt-v4', 'Real-time v4', '', 'Proven on Hindi-English mixing. Our current default.']), help: 'Which speech model listens. Hover an option to compare.' },
      { key: 'language', label: 'Languages', kind: 'tags', basic: true, placeholder: 'hi, en', help: 'Languages callers are likely to speak.' },
      { key: 'language-hints-strict', label: 'Only these languages', kind: 'bool', default: false, help: 'Ignore any language not listed.' },
      { key: 'keyterm', label: 'Boost words', kind: 'tags', basic: true, placeholder: 'Product names, jargon…', help: 'Words the agent should never mishear.' },
      { key: 'context-text', label: 'Context', kind: 'text', placeholder: 'A sentence about the call, e.g. a clinic helpline', help: 'Background that helps recognition.' },
      { key: 'enable-endpoint-detection', label: 'Detect end of speech', kind: 'bool', default: true, help: 'Let the model decide when a sentence has ended.' },
      { key: 'max-endpoint-delay-ms', label: 'Max end-of-speech delay', kind: 'number', unit: 'ms', min: 500, max: 3000, step: 100, default: 2000, help: 'Longest wait for the end of a sentence.' },
      { key: 'endpoint-sensitivity', label: 'End-of-speech sensitivity', kind: 'slider', min: -1, max: 1, step: 0.1, default: 0, when: { key: 'model', test: (v) => v === 'stt-rt-v5' }, help: 'Higher ends sentences sooner.' },
      { key: 'endpoint-latency-adjustment-level', label: 'Latency adjustment', kind: 'slider', min: 0, max: 3, step: 1, default: 0, when: { key: 'model', test: (v) => v === 'stt-rt-v5' }, help: 'Trade accuracy for speed. 0 is the most accurate.' },
      { key: 'enable-speaker-diarization', label: 'Tell speakers apart', kind: 'bool', default: false, help: 'Label who said what when more than one person talks.' },
      { key: 'enable-language-identification', label: 'Identify language', kind: 'bool', default: false, help: 'Detect which language each sentence is in.' },
    ],
  },
  {
    service: 'sarvam', label: 'Sarvam', blurb: 'Built for Indian languages',
    defaults: { model: 'saaras:v3', language: 'hi-IN', mode: 'transcribe' },
    fields: [
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'saaras:v3', options: opts(['saaras:v4', 'Saaras v4', 'Latest', 'Newest Sarvam model, better across Indian languages.'], ['saaras:v3', 'Saaras v3', '', 'Reliable for Hindi and English calls.']), help: 'Which speech model listens. Hover an option to compare.' },
      { key: 'language', label: 'Language', kind: 'select', basic: true, default: 'hi-IN', options: [{ value: 'unknown', label: 'Detect automatically' }, ...INDIC], help: 'The language callers speak, or detect it.' },
      { key: 'mode', label: 'Output', kind: 'select', basic: true, default: 'transcribe', options: opts(
        ['transcribe', 'Transcribe', 'In the spoken language'], ['translate', 'Translate to English'], ['codemix', 'Code-mixed', 'Hinglish-style'],
        ['translit', 'Transliterate', 'In Latin script'], ['verbatim', 'Verbatim', 'Every filler word']), help: 'How the transcript is written.' },
      { key: 'keyterm', label: 'Boost words', kind: 'tags', placeholder: 'Product names, jargon…', help: 'Words the agent should never mishear.' },
      { key: 'vad-signals', label: 'Speech-start events', kind: 'bool', default: true, help: 'Signal the moment the caller starts speaking.' },
      { key: 'high-vad-sensitivity', label: 'Hear quiet speakers', kind: 'bool', default: false, help: 'Pick up soft voices; may also pick up background noise.' },
      { key: 'positive-speech-threshold', label: 'Speech threshold', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0.7, help: 'How confident it must be that someone is speaking.' },
      { key: 'negative-speech-threshold', label: 'Silence threshold', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0.45, help: 'How confident it must be that speech has stopped.' },
    ],
  },
]

const SARVAM_V3 = ['shubh', 'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'ashutosh', 'advait', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali']
const SARVAM_V2 = ['anushka', 'manisha', 'vidya', 'arya', 'abhilash', 'karun', 'hitesh']
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export const TTS_PROVIDERS: Provider[] = [
  {
    service: 'sarvam', label: 'Sarvam', blurb: 'Natural Indian voices',
    defaults: { model: 'bulbul:v3', speaker: 'simran', language: 'en-IN' },
    fields: [
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'bulbul:v3', options: opts(['bulbul:v3', 'Bulbul v3', 'Latest', '37 natural voices. Best for Indian-English and Hindi conversations.'], ['bulbul:v2', 'Bulbul v2', '', 'Fewer voices, but lets you tune pitch and loudness.']), help: 'Which voice model speaks. Hover an option to compare.' },
      { key: 'speaker', label: 'Voice', kind: 'select', basic: true, default: 'simran', when: { key: 'model', test: isBulbul3 }, options: SARVAM_V3.map((v) => ({ value: v, label: cap(v) })), help: 'The voice callers hear.' },
      { key: 'speaker', label: 'Voice', kind: 'select', basic: true, default: 'anushka', when: { key: 'model', test: isBulbul2 }, options: SARVAM_V2.map((v) => ({ value: v, label: cap(v) })), help: 'The voice callers hear.' },
      { key: 'language', label: 'Language', kind: 'select', basic: true, default: 'en-IN', options: INDIC, help: 'The language the agent speaks in.' },
      { key: 'pace', label: 'Speed', kind: 'slider', basic: true, min: 0.5, max: 2, step: 0.05, default: 1, unit: '×', help: 'How fast the agent talks.' },
      { key: 'temperature', label: 'Expressiveness', kind: 'slider', min: 0.01, max: 1, step: 0.01, default: 0.6, when: { key: 'model', test: isBulbul3 }, help: 'Higher sounds livelier; lower sounds steadier.' },
      { key: 'pitch', label: 'Pitch', kind: 'slider', min: -1, max: 1, step: 0.05, default: 0, when: { key: 'model', test: isBulbul2 }, help: 'Higher or lower voice.' },
      { key: 'loudness', label: 'Loudness', kind: 'slider', min: 0.1, max: 3, step: 0.05, default: 1, when: { key: 'model', test: isBulbul2 }, help: 'How loud the voice is.' },
      { key: 'enable-preprocessing', label: 'Normalise text', kind: 'bool', default: false, when: { key: 'model', test: isBulbul2 }, help: 'Reads numbers and abbreviations naturally.' },
      { key: 'min-buffer-size', label: 'Start speaking after', kind: 'number', unit: 'chars', min: 30, max: 200, step: 5, default: 50, help: 'Lower starts sooner; higher sounds smoother.' },
      { key: 'max-chunk-length', label: 'Chunk length', kind: 'number', unit: 'chars', min: 50, max: 500, step: 10, default: 150, help: 'Longest piece of text spoken at once.' },
      { key: 'dictionary-id', label: 'Pronunciation dictionary', kind: 'text', when: { key: 'model', test: isBulbul3 }, help: 'Your own pronunciations for names and brands.' },
    ],
  },
  {
    service: 'elevenlabs', label: 'ElevenLabs', blurb: 'Expressive, cloneable voices',
    defaults: { voice: '', model: 'eleven_flash_v2_5' },
    fields: [
      { key: 'voice', label: 'Voice ID', kind: 'text', basic: true, placeholder: 'From your ElevenLabs voice library', help: 'Copy it from your ElevenLabs voice library.' },
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'eleven_flash_v2_5', options: opts(
        ['eleven_flash_v2_5', 'Flash v2.5', 'Lowest latency', 'Starts speaking fastest. The best choice for live calls.'], ['eleven_turbo_v2_5', 'Turbo v2.5', '', 'A little richer than Flash, slightly slower.'], ['eleven_multilingual_v2', 'Multilingual v2', 'Highest quality', 'Most natural, but slower to start. Better for recordings than live calls.'], ['eleven_v3', 'v3', 'Most expressive', 'Emotional and dramatic delivery. Slowest to start.']), help: 'Which voice model speaks. Hover an option to compare.' },
      { key: 'language', label: 'Language', kind: 'text', placeholder: 'e.g. en, hi', help: 'Force a language instead of detecting it.' },
      { key: 'speed', label: 'Speed', kind: 'slider', basic: true, min: 0.7, max: 1.2, step: 0.05, default: 1, unit: '×', help: 'How fast the agent talks.' },
      { key: 'stability', label: 'Stability', kind: 'slider', basic: true, min: 0, max: 1, step: 0.05, default: 0.5, help: 'Higher is steadier; lower is more varied.' },
      { key: 'similarity-boost', label: 'Voice likeness', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0.75, help: 'How closely it matches the original voice.' },
      { key: 'style', label: 'Style', kind: 'slider', min: 0, max: 1, step: 0.05, default: 0, help: 'Exaggerates the voice style. Keep low for calls.' },
      { key: 'use-speaker-boost', label: 'Speaker boost', kind: 'bool', default: true, help: 'Sharper, more present voice.' },
      { key: 'apply-text-normalization', label: 'Normalise text', kind: 'select', default: 'auto', options: opts('auto', 'on', 'off'), help: 'Read numbers and abbreviations naturally.' },
    ],
  },
  {
    service: 'deepgram', label: 'Deepgram Aura', blurb: 'Low-latency conversational voices',
    defaults: { model: 'aura-2-thalia-en' },
    fields: [
      { key: 'model', label: 'Voice', kind: 'select', basic: true, default: 'aura-2-thalia-en', options: opts(
        ['aura-2-thalia-en', 'Thalia', 'English · female'], ['aura-2-andromeda-en', 'Andromeda', 'English · female'], ['aura-2-athena-en', 'Athena', 'English · female'],
        ['aura-2-luna-en', 'Luna', 'English · female'], ['aura-2-apollo-en', 'Apollo', 'English · male'], ['aura-2-orion-en', 'Orion', 'English · male'],
        ['aura-2-agustina-es', 'Agustina', 'Spanish'], ['aura-2-fabian-de', 'Fabian', 'German'], ['aura-2-agathe-fr', 'Agathe', 'French'],
        ['aura-2-cesare-it', 'Cesare', 'Italian'], ['aura-2-ama-ja', 'Ama', 'Japanese']), help: 'The voice callers hear.' },
      { key: 'speed', label: 'Speed', kind: 'slider', basic: true, min: 0.7, max: 1.5, step: 0.05, default: 1, unit: '×', help: 'How fast the agent talks.' },
    ],
  },
  {
    service: 'google', label: 'Google', blurb: 'Chirp 3 HD voices in many languages',
    defaults: { name: 'en-IN-Chirp3-HD-Kore', language: 'en-IN', gender: 'female' },
    fields: [
      { key: 'name', label: 'Voice', kind: 'text', basic: true, placeholder: 'e.g. en-IN-Chirp3-HD-Kore', help: 'A Google voice name, e.g. en-IN-Chirp3-HD-Kore.' },
      { key: 'language', label: 'Language', kind: 'select', basic: true, default: 'en-IN', options: [...INDIC, ...opts(['en-US', 'English (US)'], ['en-GB', 'English (UK)'])], help: 'The language the agent speaks in.' },
      { key: 'gender', label: 'Gender', kind: 'select', basic: true, default: 'female', options: opts(['female', 'Female'], ['male', 'Male']), help: 'Used when the voice name isn’t set.' },
      { key: 'speaking-rate', label: 'Speed', kind: 'slider', min: 0.25, max: 2, step: 0.05, default: 1, unit: '×', help: 'How fast the agent talks.' },
      { key: 'pitch', label: 'Pitch', kind: 'slider', min: -20, max: 20, step: 1, default: 0, unit: 'st', help: 'Not supported by Chirp 3 HD voices.' },
      { key: 'volume-gain-db', label: 'Volume', kind: 'slider', min: -12, max: 12, step: 1, default: 0, unit: 'dB', help: 'Louder or quieter than normal.' },
    ],
  },
  {
    service: 'resembleai', label: 'Resemble', blurb: 'Custom cloned voices',
    defaults: { voice: '', model: 'chatterbox-turbo' },
    fields: [
      { key: 'voice', label: 'Voice ID', kind: 'text', basic: true, placeholder: 'Resemble voice UUID', help: 'Copy it from your Resemble project.' },
      { key: 'model', label: 'Model', kind: 'select', basic: true, default: 'chatterbox-turbo', options: opts(['chatterbox-turbo', 'Chatterbox Turbo', '', 'Low latency, good for live calls.'], ['chatterbox', 'Chatterbox', '', 'Richer voice, slower to start.']), help: 'Which voice model speaks. Hover an option to compare.' },
      { key: 'use-hd', label: 'HD quality', kind: 'bool', default: false, help: 'Higher audio quality, slightly slower.' },
    ],
  },
]

export const providerFor = (kind: 'stt' | 'tts', service: string) =>
  (kind === 'stt' ? STT_PROVIDERS : TTS_PROVIDERS).find((p) => p.service === service)

/** Fields that apply given the current config (model-dependent ones filtered). */
export const activeFields = (p: Provider, cfg: Record<string, unknown>) =>
  p.fields.filter((f) => !f.when || f.when.test(cfg[f.when.key] ?? p.fields.find((x) => x.key === f.when!.key)?.default))

export function describe(config: { service: string; [k: string]: unknown } | null | undefined): string {
  if (!config) return 'Not set'
  const p = providerFor('tts', config.service) ?? providerFor('stt', config.service)
  const label = (k: string) => {
    const v = config[k]
    if (v === undefined || v === '') return null
    const opt = p?.fields.find((f) => f.key === k)?.options?.find((o) => o.value === v)
    return opt?.label ?? (Array.isArray(v) ? v.join('/') : String(v))
  }
  return [p?.label ?? config.service, ...['speaker', 'voice', 'name', 'model', 'language'].map(label).filter(Boolean)].slice(0, 3).join(' · ')
}
