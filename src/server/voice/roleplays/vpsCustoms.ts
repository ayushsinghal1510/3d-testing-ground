// PORTED, not written here. This is tempp's
// src/lib/voice/roleplays\vpsCustoms.ts — the graph the running deployment sends
// — copied with two edits and no others:

import { accentSpeech, type AccentId } from '#/lib/accents';
import { buildVoiceCustoms, roleplayWebhook, sttForAccent } from './shared';
import {
  VPS_FEEDBACK_PROMPT,
  VPS_OPENING_FRAME,
  VPS_PROMPT,
  VPS_SUMMARY_PROMPT,
  type VpsFrame,
} from "./vpsPrompt";

export const VPS_FACES: { uuid: string; label: VpsFrame; usage: string }[] = [
  {
    uuid: "95573501-07a3-45d1-bdff-cfff66d9d33c",
    label: "main",
    usage:
      "default and idle — sitting normally, hands in his lap. The encounter opens here and returns here whenever a hand is lowered.",
  },
  {
    uuid: "f8baed69-a8bb-41d9-9076-bfa6b74b55b6",
    label: "right-hand",
    usage:
      "right hand held up. Entered only when the trainee asks for it, and held until they ask him to lower it or to switch hands.",
  },
  {
    uuid: "34db4124-f98d-4a26-8ecd-4ff1a37a20a3",
    label: "left-hand",
    usage:
      "left hand held up. Same rules as the right; only ever one hand up at a time.",
  },
];

export const VPS_TRANSITIONS: { uuid: string; from: VpsFrame; to: VpsFrame }[] =
  [
    {
      uuid: "b300ff6b-a1e9-4193-8f41-55d0f4f2b8dc",
      from: "main",
      to: "right-hand",
    },
    {
      uuid: "0dc83a39-a92a-4570-adb8-bce679aaedce",
      from: "main",
      to: "left-hand",
    },
  ];

export const VPS_FACE_MANIFEST = {
  expressions: VPS_FACES,
  transitions: VPS_TRANSITIONS,
};

/** Who the trainee is talking to, for every label the room puts on screen. */
export const VPS_NAME = "Mr Nair";

export function buildVpsCustoms(userName: string, accent?: AccentId) {
  const systemPrompt = `${VPS_PROMPT}

— — —
THE PERSON IN FRONT OF YOU:
You are speaking out loud, in a clinic consulting room, to a healthcare trainee named ${userName}. They are the one seeing you today. Use their name the way an older patient uses a young doctor's name — with a little formality, and more often once you have decided you trust them.

— — —
${accentSpeech(accent)}`;

  return {
    "warmup-agent": true,
    "process-type": "stt-native",
    faces: VPS_FACE_MANIFEST,
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
                  description: "What the trainee just said to Mr Nair.",
                },
                score: {
                  type: "str",
                  description:
                    "Mr Nair's running judgement of the trainee so far, in STATUS_VALUE form (e.g. \"retry_5\"). Carry it forward and return it updated.",
                },
                frame: {
                  type: "str",
                  description:
                    "The pose Mr Nair is CURRENTLY holding, one of \"main\", \"right-hand\" or \"left-hand\". This is his live body position, not a history — return it UNCHANGED unless the trainee asked him to move his hands this turn.",
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
                    "Mr Nair's next spoken line, fully in character — short and deflecting when guarded, longer and warmer once he has opened up. Never coaching, never a comment on the trainee's technique. Plain text, numbers written as words, and never any bracketed tag.",
                },
                frame: {
                  type: "str",
                  description:
                    "WHERE MR NAIR'S BODY IS for this line — a physical pose, NOT a mood, and never influenced by how the conversation is going. EXACTLY one of: \"main\" (sitting normally, hands in his lap), \"right-hand\" (his right hand is held up) or \"left-hand\" (his left hand is held up). START FROM THE `frame` VALUE YOU WERE GIVEN AS INPUT — that is the pose he is holding right now — and return it UNCHANGED unless the trainee asked him to move his hands THIS turn. Change it only for: right hand asked for -> \"right-hand\", left hand asked for -> \"left-hand\", both or unspecified -> \"right-hand\", told to put it down/lower it/relax or that they are finished looking -> \"main\". Everything else, including any change in his mood, leaves it exactly as it was. Returning \"main\" when you were given \"right-hand\" and were not asked to lower it will drop his arm mid-examination. Only one hand is ever up. Required on every reply. Never any other word.",
                },
                actions: {
                  type: "list",
                  description:
                    "The physical things that happen this turn, as a list of strings. Empty list [] on most turns. Allowed values, and ONLY these five: \"medication-bag\" (the turn he tips out the plastic bag of tablet strips, after being asked what he takes), \"report-sheet\" (the turn he hands over the folded blood test paper, after being asked about his sugar or previous tests), \"shows-foot\" (the turn the trainee asks to look at/see/check/examine the sore — required on that turn even if he is silent and withdrawn while he does it), \"companion-cuts-in\" (any turn on which his daughter Lakshmi speaks — this one MAY repeat), \"turn-away\" (only on the exit turn, when he closes the conversation and stands to leave). Apart from \"companion-cuts-in\", fire each at most once per session.",
                },
                end_diagnosis: {
                  type: "str",
                  description:
                    "Whether the encounter is now over. EXACTLY the lowercase word \"yes\" or the lowercase word \"no\" — never capitalised, never \"true\". \"no\" on almost every turn. \"yes\" only a turn or two AFTER the hidden concern has come out and been met as a person rather than as a clinical problem (a pass), or when Mr Nair closes the conversation himself and stands to leave after being rushed or dismissed (a fail). Never \"yes\" on the disclosure turn itself.",
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
                    "The full transcript of the consultation between the trainee and Mr Nair.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: VPS_FEEDBACK_PROMPT,
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
                    "The full transcript of the consultation between the trainee and Mr Nair.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: VPS_SUMMARY_PROMPT,
              service: "openrouter",
              model: "google/gemini-3.1-flash-lite-preview",
              history_key: "feedback_conversation_history",
              emotion: false,
              llm_return_type: {
                summary: {
                  type: "str",
                  description:
                    "Markdown prose: **What Went Well:**, **Areas for Improvement:**, **Key Takeaway:**. If the trainee never reached the hidden concern, this must name what it was.",
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
          frame: { type: "str", default: VPS_OPENING_FRAME },
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
      ttsModel: "aura-2-arcas-en",
      preFire: false,
      inactivityMessage:
        "Sorry, doctor. Did I say something wrong? You carry on, I am listening.",
    }),
    stt_id: sttForAccent(accent),
  };
}
