// Starting points for a new workflow. Shapes follow flows already in production.

import type { Workflow } from './convert'

const say = (speak: string) => ({ out_dict: { speak }, interruption_type: 'no', interruption_metadata: {} })

const llm = (system_prompt: string, extra: Record<string, unknown> = {}) => ({
  input_variables: { user_input: { type: 'str', description: 'What the caller said.' } },
  prompt_template: 'base_llm',
  system_prompt,
  service: 'groq',
  model: 'openai/gpt-oss-120b',
  history_key: 'conversation_history',
  interruption_type: 'full',
  interruption_metadata: {},
  llm_return_type: {
    speak: { type: 'str', description: 'What to say to the caller.' },
    hangup: { type: 'bool', description: 'True once the conversation is over.' },
  },
  ...extra,
})

export type Template = { id: string; name: string; blurb: string; workflow: Workflow }

export const TEMPLATES: Template[] = [
  {
    id: 'simple',
    name: 'Simple assistant',
    blurb: 'Greet, listen, answer with one LLM.',
    workflow: {
      nodes: {
        greeting: { type: 'out', parameters: say('Hi! How can I help you today?'), next: 'listen' },
        listen: { type: 'input', parameters: { input_variables: { user_input: 'str' } }, next: 'reply' },
        reply: { type: 'llm-streaming', parameters: llm('You are a friendly, concise voice assistant. Keep replies to one or two sentences.') },
      },
    },
  },
  {
    id: 'ack',
    name: 'Quick ack + main LLM',
    blurb: 'A tiny model acknowledges instantly while the main one thinks.',
    workflow: {
      nodes: {
        greeting: { type: 'out', parameters: say('Hello, thanks for calling. How can I help?'), next: 'listen' },
        listen: { type: 'input', parameters: { input_variables: { user_input: 'str' } }, next: ['ack', 'reply', 'transcription'] },
        transcription: { type: 'out', parameters: { variables: ['user_input'], interruption_type: 'no', interruption_metadata: {} } },
        ack: {
          type: 'llm-streaming',
          parameters: llm("Respond with ONLY 2-3 words like 'Okay', 'Got it', 'Sure'.", {
            model: 'openai/gpt-oss-20b', history_key: 'conversation_history_ack', stream_timeout: 0.5, interruption_type: 'no',
          }),
        },
        reply: { type: 'llm-streaming', parameters: llm('You are a helpful support agent. Be brief and accurate.') },
      },
    },
  },
  {
    id: 'hangup',
    name: 'Branch on hang-up',
    blurb: 'The LLM decides when the call is done; a branch says goodbye.',
    workflow: {
      nodes: {
        greeting: { type: 'out', parameters: say('Hi, this is a quick survey call. Do you have a minute?'), next: 'listen' },
        listen: { type: 'input', parameters: { input_variables: { user_input: 'str' } }, next: 'reply' },
        reply: { type: 'llm', parameters: llm('Ask three short survey questions, one at a time. Set hangup when done.'), next: 'done?' },
        'done?': {
          type: 'conditional',
          parameters: { input_variables: { hangup: 'bool' }, mappings: { true: 'goodbye', false: 'listen' } },
        },
        goodbye: { type: 'out', parameters: { out_dict: { speak: 'Thanks for your time, goodbye!', hangup: true }, interruption_type: 'no', interruption_metadata: {} } },
      },
    },
  },
  {
    id: 'rag',
    name: 'Knowledge support',
    blurb: 'Look up the knowledge base, then answer from it.',
    workflow: {
      nodes: {
        greeting: { type: 'out', parameters: say('Hi, ask me anything about our products.'), next: 'listen' },
        listen: { type: 'input', parameters: { input_variables: { user_input: 'str' } }, next: 'lookup' },
        lookup: { type: 'rag', parameters: { input_variables: { user_input: 'str' }, output_variables: ['context'], collection_name: '', top_k: 5, entities: ['text'] }, next: 'reply' },
        reply: {
          type: 'llm-streaming',
          parameters: llm('Answer only from the context. If it is not there, say you will pass it on.', {
            input_variables: {
              user_input: { type: 'str', description: 'What the caller said.' },
              context: { type: 'str', description: 'Retrieved passages.' },
            },
          }),
        },
      },
    },
  },
  {
    id: 'blank',
    name: 'Blank',
    blurb: 'An empty canvas: add every step yourself.',
    workflow: { nodes: {} },
  },
]
