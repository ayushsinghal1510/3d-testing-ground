// Every workflow step the agent engine accepts, declared once. The step
// picker, the canvas card, the settings form, the defaults and validation all
// read this. Parameter names and defaults mirror
// agent/src/agent/routers/agents/parameters/**; labels are for people.

import type { IconName } from '#/components/dashboard/Icon'

export type FieldKind =
  | 'text'
  | 'number'
  | 'bool'
  | 'select'
  | 'prompt'
  | 'model'
  | 'kv'
  | 'list'
  | 'schema'
  | 'typemap'
  | 'mappings'
  | 'knowledge'
  | 'json'
  /** The `speak` entry of out_dict, as one big text box. */
  | 'speak'
  /** interruption_type + its settings (seconds, words, ignored words). */
  | 'interrupt'
  /** A number of seconds. */
  | 'seconds'
  /** Pick values produced by earlier steps. */
  | 'vars'
  /** The one value a branch decides on. */
  | 'decideon'
  /** What a Listen step saves the caller's answer as. */
  | 'listen'

export type Field = {
  key: string
  label: string
  kind: FieldKind
  help?: string
  options?: { value: string; label: string; hint?: string; info?: string }[]
  advanced?: boolean
  placeholder?: string
}

export type OutMode = 'single' | 'mappings' | 'none'

export type NodeGroup = 'Conversation' | 'AI' | 'Logic' | 'Knowledge' | 'Shopify'

export type NodeSpec = {
  type: string
  label: string
  group: NodeGroup
  icon: IconName
  /** Accent colour for the card and picker tile. */
  color: string
  /** Kept for the minimap and older callers. */
  hue: number
  glyph: string
  blurb: string
  out: OutMode
  fields: Field[]
  defaults: Record<string, unknown>
  /** One plain sentence about what this step will do, for the canvas card. */
  summary: (p: Record<string, unknown>) => string
  aliases?: string[]
  /** Accepted by the parameter classes but not yet by the engine's node factory. */
  unsupported?: string
  /** Not offered in the picker (still renders if a workflow has one). */
  hidden?: boolean
}

export const PROVIDERS = [
  { value: 'groq', label: 'Groq', hint: 'Fastest' },
  { value: 'openrouter', label: 'OpenRouter', hint: 'Most models' },
  { value: 'sarvam', label: 'Sarvam', hint: 'Indian languages' },
]

export const MODELS: Record<string, { value: string; label: string; hint?: string; info?: string }[]> = {
  groq: [
    { value: 'openai/gpt-oss-120b', label: 'Llama 3.3 70B', hint: 'Balanced', info: 'Good all-rounder for conversations. Fast and capable.' },
    { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', hint: 'Smartest', info: 'Best at following long instructions. A little slower.' },
    { value: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', hint: 'Quick', info: 'Very fast. Great for short acknowledgements like “Got it”.' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', hint: 'Fastest', info: 'Tiny and instant. Only for very simple replies.' },
  ],
  openrouter: [
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', hint: 'Fast', info: 'Quick and good at many languages.' },
    { value: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5', hint: 'Careful', info: 'Very good at nuance and following rules. Slower to start.' },
    { value: 'openai/gpt-5-mini', label: 'GPT-5 mini', hint: 'Balanced', info: 'Solid reasoning at a good speed.' },
  ],
  sarvam: [{ value: 'sarvam-m', label: 'Sarvam M', info: 'Tuned for Indian languages and Hinglish.' }],
}

// The six interruption behaviours the pipeline implements
// (services/general/interruption_manager/im_.py). "Words" counts the words in the
// agent's own reply; "seconds" is how long the agent has been speaking.
export const INTERRUPT_OPTIONS = [
  { value: 'full', label: 'Stop and listen', hint: 'Recommended', info: 'The agent stops as soon as the caller starts talking.' },
  { value: 'no', label: 'Always finish', info: 'The agent never stops mid-reply. Good for legal lines and key details.' },
  { value: 'duration', label: 'Only at the start', info: 'The caller can cut in during the first few seconds; after that the agent finishes.' },
  { value: 'inverse_duration', label: 'Only after a few seconds', info: 'The opening of every reply is protected; after that the caller can cut in.' },
  { value: 'word_length', label: 'Only on short replies', info: 'Short replies can be interrupted; longer ones are always finished.' },
  { value: 'inverse_word_length', label: 'Only on long replies', info: 'Short replies are always finished; the caller can cut into longer ones.' },
]

const interrupt: Field = { key: 'interruption_type', label: 'If the caller interrupts', kind: 'interrupt', help: 'What happens when the caller talks over the agent.' }

/** Outputs the pipeline understands on its own, shown by what they do rather than their key. */
export const SPECIAL_OUTPUTS: Record<string, { label: string; note: string }> = {
  speak: { label: 'Spoken reply', note: 'What the caller hears' },
  hangup: { label: 'End the call', note: 'Hangs up when this is yes' },
  actions: { label: 'Website actions', note: 'Moves the caller’s web page' },
}

/** How a value reads to a person: special outputs by name, the rest in words. */
export const friendlyVar = (k: string) => SPECIAL_OUTPUTS[k]?.label ?? ({ user_input: 'What the caller said', context: 'Looked-up info' } as Record<string, string>)[k] ?? prettyName(k)

const EMOTION_STYLES = [{ value: 'eleven_v3', label: 'ElevenLabs v3', info: 'Adds cues like [laughs] or [whispers] that ElevenLabs v3 voices perform.' }]

const brain: Field[] = [
  { key: 'system_prompt', label: 'Instructions', kind: 'prompt', help: 'Tell the agent who it is, what to do and how to talk.', placeholder: 'You are a friendly receptionist for…' },
  { key: 'service', label: 'AI provider', kind: 'select', options: PROVIDERS, help: 'Which company runs the model.' },
  { key: 'model', label: 'Model', kind: 'model', help: 'Hover an option to compare.' },
  { key: 'llm_return_type', label: 'What it decides', kind: 'schema', help: 'Things the AI fills in every turn. The spoken reply is what the caller hears; the rest goes to your webhook.' },
]
const memory: Field[] = [
  { key: 'input_variables', label: 'What it reads', kind: 'schema', advanced: true, help: 'Information from earlier steps the AI can use.' },
  { key: 'history_key', label: 'Shared memory', kind: 'text', advanced: true, help: 'Steps with the same name here remember the same conversation.' },
  { key: 'summariser', label: 'Summarise long calls', kind: 'bool', advanced: true, help: 'Keeps long conversations quick by summarising older turns.' },
]
const emotion: Field[] = [
  { key: 'emotion', label: 'Add emotion', kind: 'bool', help: 'Lets the voice sound happy, calm or excited where it fits.' },
  { key: 'emotion_tts', label: 'Emotion style', kind: 'select', options: EMOTION_STYLES, help: 'Which voice understands the emotion cues.' },
]

const aiDefaults = {
  system_prompt: '',
  service: 'groq',
  model: 'openai/gpt-oss-120b',
  prompt_template: 'base_llm',
  input_variables: { user_input: { type: 'str', description: 'What the caller said.' } },
  llm_return_type: {
    speak: { type: 'str', description: 'What to say to the caller.' },
    hangup: { type: 'bool', description: 'True to end the call.' },
  },
  history_key: 'conversation_history',
  interruption_type: 'full',
  interruption_metadata: {},
}

const lookup: Field[] = [
  { key: 'collection_name', label: 'Knowledge base', kind: 'knowledge', help: 'Where to look.' },
  { key: 'input_variables', label: 'Search using', kind: 'schema', advanced: true, help: 'What to search for — usually what the caller said.' },
  { key: 'output_variables', label: 'Save results as', kind: 'list', advanced: true, help: 'The AI step after this one reads the results by this name.' },
]

/** Knowledge base names by id, filled in by the editor so cards can show names. */
const KB_NAMES = new Map<string, string>()
export const setKnowledgeNames = (list: { value: string; label: string }[]) => { KB_NAMES.clear(); for (const k of list) KB_NAMES.set(k.value, k.label) }
const knowledgeName = (id: string) => KB_NAMES.get(id) ?? id

const clip = (s: unknown, n = 70) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const modelName = (p: Record<string, unknown>) => MODELS[String(p.service)]?.find((m) => m.value === p.model)?.label ?? String(p.model ?? 'AI')

export const NODE_SPECS: NodeSpec[] = [
  {
    type: 'out', label: 'Say', group: 'Conversation', icon: 'voice', color: '#5ee6c8', hue: 165, glyph: '❝',
    blurb: 'Say a fixed line, like a greeting or goodbye.',
    out: 'single',
    fields: [
      { key: 'out_dict', label: 'What to say', kind: 'speak', placeholder: 'Hi! Thanks for calling…' },
      interrupt,
      { key: 'out_dict', label: 'Also send', kind: 'kv', advanced: true, help: 'Extra details sent to your webhook, not spoken — like end the call.' },
      { key: 'variables', label: 'Pass along', kind: 'vars', advanced: true, help: 'Values from earlier steps to send with it.' },
    ],
    defaults: { out_dict: { speak: '' }, interruption_type: 'full', interruption_metadata: {} },
    summary: (p) => {
      const speak = (p.out_dict as Record<string, unknown> | undefined)?.speak
      if (typeof speak === 'string' && speak.trim()) return `“${clip(speak)}”`
      const vars = Array.isArray(p.variables) ? p.variables : []
      return vars.length ? `Sends ${vars.join(', ')} (silently)` : 'Nothing to say yet'
    },
  },
  {
    type: 'input', label: 'Listen', group: 'Conversation', icon: 'phone', color: '#7aa9ff', hue: 215, glyph: '◉',
    blurb: 'Wait for the caller to speak, and keep what they said.',
    out: 'single',
    fields: [{ key: 'input_variables', label: 'Save what they say as', kind: 'listen', help: 'The name later steps use to read the caller’s answer. Almost always “What the caller said”.' }],
    defaults: { input_variables: { user_input: 'str' } },
    summary: (p) => {
      const names = Object.keys((p.input_variables as object) ?? {})
      return names.length ? `Waits for the caller · saves ${names.map((n) => friendlyVar(n).toLowerCase()).join(', ')}` : 'Waits for the caller to speak'
    },
  },
  {
    type: 'random-speak-out', label: 'Filler', group: 'Conversation', icon: 'list', color: '#8fd3ff', hue: 200, glyph: '≈',
    blurb: 'Say a quick “one moment…” while something happens.',
    out: 'single',
    fields: [
      { key: 'phrases', label: 'Phrases', kind: 'list', help: 'One is picked at random each time.' },
      { key: 'variance', label: 'Variety', kind: 'number', advanced: true, help: 'Higher mixes the phrases up more.' },
    ],
    defaults: { phrases: ['One moment…', 'Let me check that.'], variance: 1.0 },
    summary: (p) => {
      const ph = Array.isArray(p.phrases) ? p.phrases : []
      return ph.length ? `“${clip(ph[0], 40)}”${ph.length > 1 ? ` + ${ph.length - 1} more` : ''}` : 'No phrases yet'
    },
  },
  {
    type: 'llm-streaming', label: 'AI reply', group: 'AI', icon: 'bolt', color: '#c79bff', hue: 270, glyph: '✦',
    blurb: 'Let the AI answer, speaking as it thinks.',
    out: 'single',
    fields: [...brain, interrupt, ...memory,
      { key: 'stream_timeout', label: 'Give up after', kind: 'seconds', advanced: true, help: 'When two AI replies race, drop this one if it takes longer than this.' }],
    defaults: aiDefaults,
    summary: (p) => (String(p.system_prompt ?? '').trim() ? `${modelName(p)} · ${clip(p.system_prompt, 52)}` : `${modelName(p)} · no instructions yet`),
  },
  {
    type: 'llm', label: 'AI decision', group: 'AI', icon: 'check', color: '#e0a3ff', hue: 285, glyph: '✧',
    blurb: 'Let the AI think it through before answering.',
    out: 'single',
    fields: [...brain, ...emotion, ...memory],
    defaults: aiDefaults,
    summary: (p) => (String(p.system_prompt ?? '').trim() ? `${modelName(p)} · ${clip(p.system_prompt, 52)}` : `${modelName(p)} · no instructions yet`),
  },
  {
    type: 'llm_webnavigation', label: 'Guide on website', group: 'AI', icon: 'cursor', color: '#ff9ecb', hue: 320, glyph: '⌖',
    blurb: 'Talk while clicking and scrolling the caller’s web page.',
    out: 'single',
    fields: [...brain.filter((f) => f.key !== 'llm_return_type'), ...emotion, ...memory],
    defaults: { ...aiDefaults, prompt_template: 'web_navigation', llm_return_type: undefined },
    summary: (p) => `${modelName(p)} · drives the page`,
    unsupported: 'Coming soon — not available on calls yet.',
  },
  {
    type: 'conditional', label: 'Branch', group: 'Logic', icon: 'flows', color: '#ffc670', hue: 38, glyph: '⑂',
    blurb: 'Go different ways depending on an answer.',
    out: 'mappings',
    fields: [
      { key: 'input_variables', label: 'Decide on', kind: 'decideon', help: 'Something an earlier step decided, like End the call.' },
      { key: 'mappings', label: 'Paths', kind: 'mappings', help: 'One path per answer. Connect each path to the step it leads to.' },
    ],
    defaults: { input_variables: { hangup: 'bool' }, mappings: { true: '', false: '' } },
    summary: (p) => {
      const v = Object.keys((p.input_variables as object) ?? {})[0]
      return v ? `Checks ${friendlyVar(v).toLowerCase()}` : 'Choose what to check'
    },
  },
  {
    type: 'rag', label: 'Look up knowledge', group: 'Knowledge', icon: 'book', color: '#6fe3a1', hue: 145, glyph: '▤',
    blurb: 'Find the answer in your documents or website.',
    out: 'single',
    fields: lookup,
    defaults: { input_variables: { user_input: 'str' }, output_variables: ['context'], top_k: 5, entities: ['text'] },
    summary: (p) => (p.collection_name ? `Searches ${knowledgeName(String(p.collection_name))}` : 'Pick a knowledge base'),
  },
  {
    type: 'rag_shopify', label: 'Search catalog', group: 'Shopify', icon: 'search', color: '#9be15d', hue: 95, glyph: '⛁',
    blurb: 'Answer from your Shopify products.',
    out: 'single',
    fields: [
      ...lookup,
      ...brain,
    ],
    defaults: { ...aiDefaults, top_k: 5, entities: ['text'], context_key: 'shopify_context' },
    summary: (p) => (p.collection_name ? `Searches ${p.collection_name}` : 'Pick a catalog'),
    hidden: true,
  },
  {
    type: 'llm_shopify', label: 'Product reply', group: 'Shopify', icon: 'plug', color: '#b6e36b', hue: 80, glyph: '⛃',
    blurb: 'Answer with product cards.',
    out: 'single',
    aliases: ['shopify_llm'],
    fields: [
      ...brain, ...memory,
      { key: 'layout_type', label: 'Layout', kind: 'select', options: [{ value: 'horizontal', label: 'Side by side' }, { value: 'vertical', label: 'Stacked' }] },
    ],
    defaults: { ...aiDefaults, card_type: 'modern_minimalistic', layout_type: 'horizontal' },
    summary: (p) => `${modelName(p)} · product cards`,
    hidden: true,
  },
]

const BY_TYPE = new Map<string, NodeSpec>()
for (const s of NODE_SPECS) {
  BY_TYPE.set(s.type, s)
  for (const a of s.aliases ?? []) BY_TYPE.set(a, s)
}

/** The spec for a type string, or a generic one so unknown types still render and round-trip. */
export function specFor(type: string): NodeSpec {
  return (
    BY_TYPE.get(type) ?? {
      type, label: type, group: 'Logic', icon: 'sliders', color: '#9aa5a8', hue: 0, glyph: '?',
      blurb: 'A custom step.',
      out: 'single', fields: [], defaults: {},
      summary: () => 'Custom step',
      unsupported: `“${type}” isn’t a step this editor knows.`,
    }
  )
}

export const GROUPS: NodeGroup[] = ['Conversation', 'AI', 'Logic', 'Knowledge', 'Shopify']

/** "ask_for_input" → "Ask for input". Step names stay as they are; this is only how they read. */
export const prettyName = (id: string) => {
  const s = id.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return s ? s[0].toUpperCase() + s.slice(1) : id
}
