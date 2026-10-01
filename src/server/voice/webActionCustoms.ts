// The graphs for the website-navigation demos on /webnav.

import type { SurfaceId } from '#/lib/surfaces'
import { buildVoiceCustoms } from './roleplays/shared'
import { accentSpeech, type AccentId } from '#/lib/accents'

import { opdForPrompt } from '#/lib/sites/clinic'
import { calendarForPrompt, trainsForPrompt } from '#/lib/sites/rail'
import { catalogForPrompt } from '#/lib/sites/shop'
import { datesForPrompt } from '#/lib/sites/uni'
import { DAYS, MONTHS_LONG, startOfDay } from '#/lib/sites/util'

import { md, render } from './prompts/render'
import craftRules from './prompts/webnav/craft.md?raw'
import clinicPage from './prompts/webnav/clinic.md?raw'
import universityPage from './prompts/webnav/university.md?raw'
import railPage from './prompts/webnav/rail.md?raw'
import shopPage from './prompts/webnav/shop.md?raw'
import carePage from './prompts/webnav/care.md?raw'

const MARKER = '<|web_action|>'

const CRAFT = render(md(craftRules), { MARKER })

type PageSpec = {
  /** The line it opens with. English, and the default for every accent. */
  greeting: string
  /* Per-accent overrides. The greeting is a static out_dict spoken BEFORE the
     model has run once, so unlike every other line it cannot react to the
     visitor — which is why a bilingual greeting is the wrong fix: on the three
     accents that are not Japanese it offers Japanese to someone who never
     asked, and it is the first thing they hear. Only fill in an accent where
     that surface genuinely has something to say in it. */
  greetings?: Partial<Record<AccentId, string>>
  page: string
}

/* The rebuilt sites work out their calendars from today — the next cardiology
   day, the re-evaluation deadline, which trains run on the twenty sixth — so
   the page notes are rendered per session, from the same functions the pages
   draw with. */
function facts(): Record<string, string> {
  const today = startOfDay(new Date())
  return {
    TODAY: `${DAYS[today.getDay()]} ${today.getDate()} ${MONTHS_LONG[today.getMonth()]} ${today.getFullYear()}`,
    CALENDAR: calendarForPrompt(today),
    TRAINS: trainsForPrompt(),
    CATALOG: catalogForPrompt(),
    OPD: opdForPrompt(today),
    DATES: datesForPrompt(today),
  }
}

const PAGES: Record<SurfaceId, PageSpec> = {
  clinic: {
    greeting: 'Civil Hospital appointments. What is the trouble, and who is it for?',
    greetings: {
      japanese: 'シビル病院の予約受付です。どなたの予約でしょうか。',
    },
    page: render(md(clinicPage), { MARKER }),
  },

  university: {
    greeting: 'Meridian Institute helpdesk, Meera speaking. How can I help?',
    page: render(md(universityPage), { MARKER }),
  },

  rail: {
    greeting: 'Namaste, railway booking helpdesk. Where would you like to travel?',
    page: render(md(railPage), { MARKER }),
  },

  shop: {
    greeting: 'Hi, bazaar here. What are you after?',
    page: render(md(shopPage), { MARKER }),
  },

  /* Greets in Japanese and then gets out of the way, because the worker on the
     other end is not going to be answering in it. */
  care: {
    greeting:
      'お疲れさまです。Record assistant here — tell me what happened and I will write it up.',
    greetings: {
      japanese: 'お疲れさまです。記録の方、お手伝いします。何がありましたか。',
    },
    page: render(md(carePage), { MARKER }),
  },
}

export function buildWebActionCustoms(
  surface: SurfaceId,
  accent?: AccentId,
  webhookUrl = '',
) {
  const spec = PAGES[surface]
  const greeting = (accent && spec.greetings?.[accent]) || spec.greeting
  const page = render(spec.page, facts())

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
              out_dict: { speak: greeting },
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
              system_prompt: `${page}

${accentSpeech(accent)}

${CRAFT}

THE SHAPE OF A REPLY, so the markers and the speech line up:
{
  "speak": "Fees sit under students rather than admissions, sir. ${MARKER} And fee payment is the first one here. ${MARKER} Seventy one thousand two hundred for the semester, without hostel.",
  "actions": [
    {"action": "click", "target": "Students"},
    {"action": "click", "target": "Fee Payment", "within": "Students"}
  ]
}`,
              service: 'groq',
              model: 'openai/gpt-oss-120b',
              history_key: 'conversation_history',
              llm_return_type: {
                speak: {
                  type: 'str',
                  description: `The spoken reply, with ${MARKER} markers where the screen should change.`,
                },
                actions: {
                  type: 'list',
                  description: `One action dict per ${MARKER} marker in speak, in order.`,
                },
              },
            },
            next: 'response',
          },
          response: {
            type: 'out',
            parameters: {
              variables: ['speak', 'actions'],
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
          actions: { type: 'list', default: [] },
          node_type: { type: 'str' },
        },
        start_node: 'greeting',
      },
      'webhook-url': webhookUrl,
    },
    ...buildVoiceCustoms({ preFire: false, accent }),
  }
}
