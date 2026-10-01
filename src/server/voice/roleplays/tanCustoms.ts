// The `tn` graph — Tanaka-san. Built to the same shape as muthuCustoms so the
// two read as a matched pair, with three deliberate differences:
//
//   - the faces are Muthu's UUIDs for now, and are a PLACEHOLDER. "main" here
//     means closed and withdrawn, not shouting. Swap the two uuids below for
//     the Japanese renders and nothing else in this file has to change.
//   - the inactivity nudge is stretched a long way out. Holding a silence is
//     the single move this scenario exists to reward, and an agent that fills
//     the pause after one second has answered for the trainee.
//   - his own inactivity line is in character: he does not chase you.

import { accentSpeech, type AccentId } from '#/lib/accents'
import {
  buildVoiceCustoms,
  roleplayWebhook,
  sttForAccent,
} from './shared'
import {
  TAN_DEBRIEF_PROMPT,
  TAN_OPENING_FRAME,
  TAN_PROMPT,
  type TanFrame,
} from './tanPrompt'

export const TAN_FACES: { uuid: string; label: TanFrame; usage: string }[] = [
  {
    // PLACEHOLDER — currently Muthu's angry render.
    uuid: '11f6dbe7-797c-4a1b-8da1-12164c5dfeae',
    label: 'main',
    usage:
      'default and idle — closed, formal, looking away. Not hostile. The session opens here.',
  },
  {
    // PLACEHOLDER — currently Muthu's settled render.
    uuid: 'de60e205-5aff-49e4-809d-bd51679ed65c',
    label: 'normal',
    usage:
      'open — present in the room and willing to say a true thing. Only once the carer has earned it, and revertible.',
  },
]

export function buildTanCustoms(userName: string, accent?: AccentId) {
  const systemPrompt = `${TAN_PROMPT}

— — —
THE PERSON IN FRONT OF YOU:
You are speaking out loud, on a live call, to a care worker named ${userName} who is on shift at your facility. They may not be Japanese, and their Japanese may be poor. That is not something you hold against them — you are gentle about it, and you repeat yourself in English without ever making a point of it. Use their name rarely, and only warmly.

— — —
${accentSpeech(accent)}`

  return {
    'warmup-agent': true,
    'process-type': 'stt-native',
    faces: TAN_FACES,
    agent_id: {
      workflow: {
        nodes: {
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
                  description: 'What the care worker just said to Tanaka-san.',
                },
                score: {
                  type: 'str',
                  description:
                    'Tanaka-san\'s running judgement of the care worker so far, in STATUS_VALUE form (e.g. "retry_5"). Carry it forward and return it updated.',
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
                    "Tanaka-san's next spoken line — quiet, short, polite, in character. NEVER an exclamation mark and never a raised voice; when he is upset his sentences get shorter, not louder. At most one short Japanese phrase, with its English immediately after it. Plain text, numbers written as words.",
                },
                frame: {
                  type: 'str',
                  description:
                    'Which face Tanaka-san is wearing for this line. EXACTLY one of: "main" (the name of his CLOSED face — withdrawn, formal, looking away, giving nothing; this is the default and where the conversation starts, and it means a door shutting rather than anger) or "normal" (open — present in the room and willing to say a true thing; use ONLY once the carer has earned it by holding a silence, sitting down, asking a factual question, or following a thread he offered, and switch straight back to "main" the moment they turn cheerful, rush him, name his feelings for him, take a note instead of replying, or promise to tell his daughter unasked). Required on every reply. Never any other word.',
                },
                actions: {
                  type: 'list',
                  description:
                    'The physical things Tanaka-san does this turn, as a list of strings. He does not complain; he produces documents. Empty list [] on most turns. Allowed values, and ONLY these five: "meal-record" (the turn he slides the meal log across rather than answer whether he has been eating), "med-calendar" (the turn he produces the medicine calendar after being asked about his tablets, saying nothing about the four full evening pockets), "care-plan" (the turn the suspended outings or his daughter come up and he puts the plan down without mentioning the signature), "call-log" (the nurse-call history from that night — ONLY once the carer has reached the six calls, and produced instead of finishing the sentence), "turn-away" (only on the exit turn). Fire each at most once per session.',
                },
                end_session: {
                  type: 'str',
                  description:
                    'Whether the conversation is now over. EXACTLY the lowercase word "yes" or the lowercase word "no" — never capitalised, never "true", never a sentence. "no" on almost every turn; this is his room and he is not going anywhere. "yes" ONLY once it has genuinely finished, either because the carer reached something real and treated it as a thing that happened to a person, or because he has closed the door politely and finally. Required on every reply.',
                },
                score: {
                  type: 'str',
                  description:
                    'The running score in STATUS_VALUE form, e.g. "pass_9", "retry_5", "fail_1". VALUE is a whole number zero to ten carried forward from the value you were given and adjusted; STATUS is "pass", "retry" or "fail". Required on every reply including the last.',
                },
              },
            },
            next: ['response', 'judge_session_end'],
          },
          response: {
            type: 'out',
            parameters: {
              variables: ['speak', 'frame', 'actions', 'score', 'end_session'],
              interruption_type: 'no',
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
                    'The full transcript of the conversation between the care worker and Tanaka-san.',
                },
              },
              prompt_template: 'base_llm',
              system_prompt: TAN_DEBRIEF_PROMPT,
              service: 'openrouter',
              model: 'google/gemini-3.1-flash-lite-preview',
              history_key: 'debrief_conversation_history',
              llm_return_type: {
                final_score: {
                  type: 'str',
                  description:
                    "The care worker's overall handling, zero to ten, as digits with at most one decimal place. The bare number only — no words, no \"/10\", no percent sign.",
                },
                feedback: {
                  type: 'str',
                  description:
                    'A markdown table and nothing else, with the header row: | Criteria | Rating (1-10) | Brief justification | — one row per criterion, in the order given.',
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
          frame: { type: 'str', default: TAN_OPENING_FRAME },
          end_session: { type: 'str', default: 'no' },
          actions: { type: 'list', default: [] },
          score: { type: 'str', default: 'retry_5' },
          debrief_conversation_history: { type: 'list', default: [] },
          final_score: { type: 'str' },
          feedback: { type: 'str' },
          summary: { type: 'str' },
          node_type: { type: 'str' },
        },
        start_node: 'ask_for_input',
      },
      'webhook-url': roleplayWebhook(),
    },
    ...buildVoiceCustoms({
      accent,
      ttsModel: 'aura-2-odysseus-en',
      preFire: false,
      // Six times the default. A trainee who says something and then waits is
      // doing the right thing, and must not be rescued out of it.
      inactivityPeriod: 6000,
      inactivityTimes: 2,
      inactivityMessage: 'It is all right. You do not have to stay.',
    }),
    stt_id: sttForAccent(accent),
  }
}
