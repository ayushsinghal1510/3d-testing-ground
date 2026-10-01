// The `jl` graph — Mr Jeremy Lim. Same shape as tanCustoms, with one
// structural difference: the session opens on a `greeting` node rather than on
// `ask_for_input`.
//
// The other four roleplays start by waiting, because in every one of them the
// human walks up to a person who is already there. This one is a telephone
// call that the resident has placed, and a phone answered by silence is a
// broken phone. So Jeremy speaks first, then the loop begins.

import { accentSpeech, type AccentId } from '#/lib/accents'
import { buildVoiceCustoms, roleplayWebhook, sttForAccent } from './shared'
import {
  JEREMY_DEBRIEF_PROMPT,
  JEREMY_GREETING,
  JEREMY_OPENING_FRAME,
  JEREMY_PROMPT,
  type JeremyFrame,
} from './jeremyPrompt'

export const JEREMY_FACES: { uuid: string; label: JeremyFrame; usage: string }[] = [
  {
    uuid: '41f2c30a-9e92-4026-a3aa-7954ba10517f',
    label: 'main',
    usage:
      'the only face — a worried son on the phone at work. Held for the whole call; there is nothing to cut to.',
  },
]

export function buildJeremyCustoms(userName: string, accent?: AccentId) {
  const systemPrompt = `${JEREMY_PROMPT}

— — —
THE PERSON ON THE OTHER END:
A physiotherapy resident at Tan Tock Seng Hospital who has telephoned you about your father. You do not yet know their name, their grade, or whether they were the one in the room when it happened — unless and until they tell you. Do not assume they are the treating therapist, and do not call them by a name you have not been given. If you reach for "doctor" they may correct you; take the correction without fuss. They have been introduced to you only as ${userName}.

— — —
${accentSpeech(accent)}`

  return {
    'warmup-agent': true,
    'process-type': 'stt-native',
    'lipsync-model': 'wav2lip',
    'lipsync-quality': 'low',
    faces: JEREMY_FACES,
    agent_id: {
      workflow: {
        nodes: {
          /* He picks up. See JEREMY_GREETING for why he does not give his own
             name here — the resident has to ask for it. */
          greeting: {
            type: 'out',
            parameters: {
              out_dict: { speak: JEREMY_GREETING },
              interruption_type: 'full',
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
                user_input: {
                  type: 'str',
                  description: 'What the physiotherapy resident just said on the phone.',
                },
                score: {
                  type: 'str',
                  description:
                    'Jeremy’s running judgement of how this call is being handled, in STATUS_VALUE form (e.g. "retry_5"). Carry it forward and return it updated.',
                },
              },
              prompt_template: 'base_llm',
              system_prompt: systemPrompt,
              service: 'openrouter',
              model: 'google/gemini-3.1-flash-lite-preview',
              history_key: 'conversation_history',
              llm_return_type: {
                speak: {
                  type: 'str',
                  description:
                    "Jeremy's next spoken line — Singapore English, short, on the phone at work. Worried and direct rather than abusive; he raises his voice only when he is blamed or fobbed off. One or two sentences, one question at a time. Plain text, numbers written as words. NEVER supply a reassuring fact about his father that the resident has not told him.",
                },
                frame: {
                  type: 'str',
                  description:
                    'Always EXACTLY the lowercase word "main". He is a voice on a telephone and there is only one face. Required on every reply. Never any other word.',
                },
                covered: {
                  type: 'str',
                  description:
                    'Which of the four things Jeremy wants have now been ANSWERED by the resident, as a comma-separated list drawn only from: "events" (a sequence of what actually happened), "checks" (what was examined and by whom, including the surgeon or the X-ray), "training" (whether the stairs work continues), "prevention" (how a recurrence is avoided). Empty string on the first turns. Carry forward what was already covered and add to it; never remove one. Judge by what the RESIDENT said, never by what Jeremy already knew.',
                },
                end_session: {
                  type: 'str',
                  description:
                    'Whether the call is now over. EXACTLY the lowercase word "yes" or the lowercase word "no" — never capitalised, never "true", never a sentence. "no" on almost every turn. "yes" ONLY once the call has genuinely closed on one of the three endings and Jeremy has said his last line. Required on every reply.',
                },
                score: {
                  type: 'str',
                  description:
                    'The running score in STATUS_VALUE form, e.g. "pass_9", "retry_5", "fail_1". VALUE is a whole number zero to ten carried forward from the value you were given and adjusted; STATUS is "pass", "retry" or "fail". Blaming the patient, or reassuring with no examination named, should move it down sharply; naming what was checked and committing to a specific follow-up should move it up. Required on every reply including the last.',
                },
              },
            },
            next: ['response', 'judge_session_end'],
          },
          response: {
            type: 'out',
            parameters: {
              variables: ['speak', 'frame', 'covered', 'score', 'end_session'],
              interruption_type: 'full',
              interruption_metadata: {},
            },
            next: 'hold_frame',
          },
          hold_frame: {
            type: 'out',
            parameters: {
              variables: ['frame'],
              interruption_type: 'no',
              interruption_metadata: {},
            },
          },
          judge_session_end: {
            type: 'conditional',
            parameters: {
              input_variables: { end_session: {} },
              mappings: {
                yes: 'debrief',
                no: 'ask_for_input',
              },
            },
          },
          debrief: {
            type: 'llm',
            parameters: {
              input_variables: {
                conversation_history: {
                  type: 'list',
                  description:
                    'The full transcript of the call between the physiotherapy resident and Mr Jeremy Lim.',
                },
              },
              prompt_template: 'base_llm',
              system_prompt: JEREMY_DEBRIEF_PROMPT,
              service: 'openrouter',
              model: 'google/gemini-3.1-flash-lite-preview',
              history_key: 'debrief_conversation_history',
              llm_return_type: {
                final_score: {
                  type: 'str',
                  description:
                    "The resident's overall handling, zero to ten, as digits with at most one decimal place. The bare number only — no words, no \"/10\", no percent sign.",
                },
                feedback: {
                  type: 'str',
                  description:
                    'A markdown table and nothing else, with the header row: | Criteria | Rating (1-10) | Brief justification | — one row per numbered criterion, in the order given, keeping the numbering.',
                },
                summary: {
                  type: 'str',
                  description:
                    'Markdown prose: a **What went well:** bulleted section followed by an **Areas for improvement:** bulleted section.',
                },
              },
            },
            next: 'debrief_out',
          },
          debrief_out: {
            type: 'out',
            parameters: {
              variables: ['final_score', 'feedback', 'summary'],
              interruption_type: 'no',
              interruption_metadata: {},
            },
          },
        },
        variables: {
          user_input: { type: 'str' },
          conversation_history: { type: 'list', default: [] },
          speak: { type: 'str' },
          frame: { type: 'str', default: JEREMY_OPENING_FRAME },
          covered: { type: 'str', default: '' },
          end_session: { type: 'str', default: 'no' },
          score: { type: 'str', default: 'retry_5' },
          debrief_conversation_history: { type: 'list', default: [] },
          final_score: { type: 'str' },
          feedback: { type: 'str' },
          summary: { type: 'str' },
          node_type: { type: 'str' },
        },
        start_node: 'greeting',
      },
      'webhook-url': roleplayWebhook(),
    },
    ...buildVoiceCustoms({
      accent,
      preFire: false,
      inactivityMessage: 'Hello? Are you still there?',
    }),
    tts_id: { service: 'deepgram', model: 'flux-naveen-en' },
    stt_id: sttForAccent(accent),
  }
}
