// PORTED, not written here. This is tempp's
// src/lib/voice/roleplays\cherylCustoms.ts — the graph the running deployment
// sends — copied with two edits and no others:

import { accentSpeech, type AccentId } from '#/lib/accents';
import { buildVoiceCustoms, roleplayWebhook, sttForAccent } from './shared';
import {
  CHERYL_FEEDBACK_PROMPT,
  CHERYL_OPENING_FRAME,
  CHERYL_PROMPT,
  CHERYL_SUMMARY_PROMPT,
  type CherylFrame,
} from "./cherylPrompt";

/** The two avatar faces, by the labels the model returns as `frame`. */
export const CHERYL_FACES: { uuid: string; label: CherylFrame; usage: string }[] =
  [
    {
      uuid: "11f6dbe7-797c-4a1b-8da1-12164c5dfeae",
      label: "main",
      usage:
        "default and idle — firm, impatient, arms crossed. Levels 3 to 5. The session opens here.",
    },
    {
      uuid: "de60e205-5aff-49e4-809d-bd51679ed65c",
      label: "normal",
      usage:
        "settled and cooperative — levels 1 and 2, once the trainee has handled him well. Revertible.",
    },
  ];

/** Who the trainee is talking to, for every label the room puts on screen. */
export const CHERYL_NAME = "Mr Cheryl";

export function buildCherylCustoms(userName: string, accent?: AccentId) {
  const systemPrompt = `${CHERYL_PROMPT}

— — —
THE PERSON IN FRONT OF YOU:
You are speaking out loud, at a retail service counter, to a frontline trainee named ${userName}. They are the one who has to sort this out. Use their name the way an impatient customer uses a name — to press them — never as small talk.

— — —
${accentSpeech(accent)}`;

  return {
    "warmup-agent": true,
    "process-type": "stt-native",
    faces: CHERYL_FACES,
    agent_id: {
      workflow: {
        nodes: {
          ask_for_input: {
            type: "input",
            parameters: { input_variables: { user_input: "str" } },
            next: "transcription",
          },
          transcription: {
            type: "out",
            parameters: {
              variables: ["user_input"],
              interruption_type: "no",
              interruption_metadata: {},
            },
            next: "llm",
          },
          llm: {
            type: "llm",
            parameters: {
              input_variables: {
                user_input: {
                  type: "str",
                  description: "What the trainee just said to Mr Cheryl.",
                },
                score: {
                  type: "str",
                  description:
                    "Mr Cheryl's running judgement of the trainee so far, in STATUS_VALUE form (e.g. \"retry_5\"). Carry it forward and return it updated.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: systemPrompt,
              service: "openrouter",
              model: "google/gemini-3.1-flash-lite-preview",
              history_key: "conversation_history",
              emotion: false,
              llm_return_type: {
                speak: {
                  type: "str",
                  description:
                    "Mr Cheryl's next spoken line — short, clipped, in character. Plain text, numbers written as words, and never any bracketed tag.",
                },
                frame: {
                  type: "str",
                  description:
                    "Which face Mr Cheryl is wearing for this line. EXACTLY one of: \"main\" (firm, impatient, hostile — emotional levels three to five, the default, and where the conversation starts) or \"normal\" (settled and cooperative — levels one and two, once the trainee has handled him politely; revert to \"main\" the moment they stonewall, blame him, or use a prohibited phrase). Required on every reply. Never any other word.",
                },
                actions: {
                  type: "list",
                  description:
                    "The physical things Mr Cheryl does this turn, as a list of strings. Empty list [] on most turns. Allowed values, and ONLY these five: \"receipt\" (the turn he hands over his receipt, after being asked for proof of purchase), \"shirt\" (the turn the trainee asks to inspect/see/check/examine the shirt or the defect — required on that turn even if he is complaining while he passes it over), \"get-details\" (the exact turn the trainee FIRST mentions or offers an escalation form, service alert or supervisor review — not at the end of the session), \"phone\" (only if pushed to level five and he raises his phone to threaten a post), \"turn-away\" (only on the exit turn, when he gives up and walks out). Fire each at most once per session.",
                },
                end_diagnosis: {
                  type: "str",
                  description:
                    "Whether the scenario is now over. EXACTLY the lowercase word \"yes\" or the lowercase word \"no\" — never capitalised, never \"true\". \"no\" on almost every turn. \"yes\" only when the trainee confirms the escalation form has been submitted, or calls the manager proactively (both passes), or when Mr Cheryl walks out on hostility (a fail).",
                },
                score: {
                  type: "str",
                  description:
                    "The running score in STATUS_VALUE form, e.g. \"pass_9\", \"retry_5\", \"fail_1\". VALUE is a whole number zero to ten carried forward from the value you were given and adjusted; STATUS is \"pass\", \"retry\" or \"fail\". Required on every reply including the last.",
                },
              },
            },
            next: ["response", "judge_scenario_end"],
          },
          response: {
            type: "out",
            parameters: {
              variables: ["speak", "frame", "actions", "score", "end_diagnosis"],
              interruption_type: "no",
              interruption_metadata: {},
            },
            next: "hold_frame",
          },
          hold_frame: {
            type: "out",
            parameters: {
              variables: ["frame"],
              interruption_type: "no",
              interruption_metadata: {},
            },
          },
          judge_scenario_end: {
            type: "conditional",
            parameters: {
              input_variables: { end_diagnosis: {} },
              mappings: {
                yes: ["feedback", "summary"],
                no: "ask_for_input",
              },
            },
          },
          feedback: {
            type: "llm",
            parameters: {
              input_variables: {
                conversation_history: {
                  type: "list",
                  description:
                    "The full transcript of the exchange between the trainee and Mr Cheryl.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: CHERYL_FEEDBACK_PROMPT,
              service: "openrouter",
              model: "google/gemini-3.1-flash-lite-preview",
              history_key: "feedback_conversation_history",
              emotion: false,
              llm_return_type: {
                total: {
                  type: "str",
                  description:
                    "The trainee's total out of twenty. Digits only — no \"/20\", no words.",
                },
                feedback: {
                  type: "str",
                  description:
                    "The full markdown report in the structure given: SUMMARY, HOW THE CONVERSATION WENT, then the four per-dimension blocks, then TOTAL.",
                },
              },
            },
            next: "feedback_out",
          },
          summary: {
            type: "llm",
            parameters: {
              input_variables: {
                conversation_history: {
                  type: "list",
                  description:
                    "The full transcript of the exchange between the trainee and Mr Cheryl.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: CHERYL_SUMMARY_PROMPT,
              service: "openrouter",
              model: "google/gemini-3.1-flash-lite-preview",
              history_key: "feedback_conversation_history",
              emotion: false,
              llm_return_type: {
                summary: {
                  type: "str",
                  description:
                    "Markdown prose: **What Went Well:**, **Areas for Improvement:**, **Key Takeaway:**.",
                },
              },
            },
            next: "summary_out",
          },
          feedback_out: {
            type: "out",
            parameters: {
              variables: ["total", "feedback"],
              interruption_type: "no",
              interruption_metadata: {},
            },
          },
          summary_out: {
            type: "out",
            parameters: {
              variables: ["summary"],
              interruption_type: "no",
              interruption_metadata: {},
            },
          },
        },
        variables: {
          user_input: { type: "str" },
          conversation_history: { type: "list", default: [] },
          speak: { type: "str" },
          frame: { type: "str", default: CHERYL_OPENING_FRAME },
          actions: { type: "list", default: [] },
          score: { type: "str", default: "retry_5" },
          end_diagnosis: { type: "str", default: "no" },
          feedback_conversation_history: { type: "list", default: [] },
          total: { type: "str" },
          feedback: { type: "str" },
          summary: { type: "str" },
          node_type: { type: "str" },
        },
        start_node: "ask_for_input",
      },
      "webhook-url": roleplayWebhook(),
    },
    ...buildVoiceCustoms({
      accent,
      ttsModel: "aura-2-odysseus-en",
      preFire: false,
      inactivityMessage:
        "Hello? I am still standing here. There are people waiting behind me, you know.",
    }),
    stt_id: sttForAccent(accent),
  };
}
