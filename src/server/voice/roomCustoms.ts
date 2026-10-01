// The call graph for a browser demo — the WebRTC side of the house.

import type { AccentId } from '#/lib/accents'
import type { DemoId } from '#/lib/demos'
import { demoById } from '#/lib/demos'
import { buildCherylCustoms } from './roleplays/cherylCustoms'
import { buildJeremyCustoms } from './roleplays/jeremyCustoms'
import { buildMarciaCustoms } from './roleplays/marciaCustoms'
import { buildMuthuCustoms } from './roleplays/muthuCustoms'
import { buildVoiceCustoms, setRoleplayWebhook } from './roleplays/shared'
import { buildTanCustoms } from './roleplays/tanCustoms'
import { buildVpsCustoms } from './roleplays/vpsCustoms'
import type { SurfaceId } from '#/lib/surfaces'
import { buildWebActionCustoms } from './webActionCustoms'
import { deskById, type DeskId } from '#/lib/desks'
import { buildNimcCustoms } from './admissionsCall'

const ROLEPLAYS: Partial<
  Record<DemoId, (userName: string, accent?: AccentId) => unknown>
> = {
  mm: buildMuthuCustoms,
  tn: buildTanCustoms,
  pr: buildCherylCustoms,
  vps: buildVpsCustoms,
  jl: buildJeremyCustoms,
  mc: buildMarciaCustoms,
}

/** Browser demos that are a /calling desk heard through the page. */
const PHONE_DESKS: Partial<Record<DemoId, DeskId>> = {
  lab: 'lab',
}

export function buildRoomCustoms(
  id: DemoId,
  webhookUrl: string,
  accent?: AccentId,
) {
  const demo = demoById(id)

  if (id.startsWith('wa-')) {
    return buildWebActionCustoms(id.slice(3) as SurfaceId, accent, webhookUrl)
  }

  const roleplay = ROLEPLAYS[id]
  if (roleplay) {
    setRoleplayWebhook(webhookUrl)
    return roleplay('you', accent)
  }

  // The phone desk's own graph, so the room gets its Hindi and English ears and voice.
  const desk = PHONE_DESKS[id]
  if (desk) {
    return buildNimcCustoms({ desk, brand: deskById(desk).defaultBrand, webhookUrl })
  }

  return {
    'warmup-agent': true,
    'process-type': 'speech-native',
    'streaming-grace-ms': 2500,
    agent_id: {
      workflow: {
        nodes: {
          greeting: {
            type: 'out',
            parameters: {
              out_dict: { speak: demo.greeting },
              interruption_type: 'no',
              interruption_metadata: {},
            },
            next: 'ask_for_input',
          },
          ask_for_input: {
            type: 'input',
            parameters: { input_variables: { user_input: 'str' } },
            next: 'transcription',
          },
          transcription: {
            type: 'out',
            parameters: {
              variables: ['user_input'],
              interruption_type: 'no',
              interruption_metadata: {},
            },
            next: 'llm',
          },
          llm: {
            type: 'llm',
            parameters: {
              input_variables: {
                user_input: { type: 'str', description: 'What the user just said.' },
              },
              prompt_template: 'base_llm',
              system_prompt: demo.systemPrompt,
              service: 'groq',
              model: 'openai/gpt-oss-120b',
              history_key: 'conversation_history',
              llm_return_type: {
                speak: {
                  type: 'str',
                  description: "The agent's spoken reply.",
                },
              },
            },
            next: 'response',
          },
          response: {
            type: 'out',
            parameters: {
              variables: ['speak'],
              interruption_type: 'full',
              interruption_metadata: {},
            },
            next: 'ask_for_input',
          },
        },
        variables: {
          user_input: { type: 'str' },
          conversation_history: { type: 'list', default: [] },
          speak: { type: 'str' },
          node_type: { type: 'str' },
        },
        start_node: 'greeting',
      },
      'webhook-url': webhookUrl,
    },
    ...buildVoiceCustoms({ accent }),
  }
}
