// The admissions call graph — outbound telephony.

import type { DeskId } from "#/lib/desks";
import { greetingFor, systemPromptFor } from "./deskScripts";

const WEBHOOK_URL = process.env.PUBLIC_URL || "";

export const NIMC_WEBHOOK_URL = WEBHOOK_URL
  ? `${WEBHOOK_URL.replace(/\/+$/, "")}/api/call-webhook`
  : "";

export const NIMC_FIELD_KEYS = [
  "name",
  "course",
  "academic_percent",
  "residence",
] as const;

export type NimcFieldKey = (typeof NIMC_FIELD_KEYS)[number];

export type NimcCustomsOptions = {
  desk?: DeskId;
  /** Institution name substituted into the script and the greeting. */
  brand?: string;
  /** Overrides the call webhook; the browser room posts to its own. */
  webhookUrl?: string;
};

export function buildNimcCustoms({
  desk = "university",
  brand,
  webhookUrl = NIMC_WEBHOOK_URL,
}: NimcCustomsOptions = {}) {
  const org = brand || "";
  return {
    "warmup-agent": true,
    "streaming-grace-ms": 2500,
    "process-type": "speech-native",
    "speaker-turn-timeout-ms": 600,
    "voice-isolation": 0.1,
    agent_id: {
      workflow: {
        nodes: {
          greeting: {
            type: "out",
            parameters: {
              out_dict: { speak: greetingFor(desk, org) },
              interruption_type: "no",
              interruption_metadata: {},
            },
            next: "ask_for_input",
          },
          ask_for_input: {
            type: "input",
            parameters: { input_variables: { user_input: "str" } },
            next: ["prev_llm", "llm", "transcription"],
          },
          transcription: {
            type: "out",
            parameters: {
              variables: ["user_input"],
              interruption_type: "no",
              interruption_metadata: {},
            },
          },
          prev_llm: {
            type: "llm-streaming",
            parameters: {
              input_variables: {
                user_input: {
                  type: "str",
                  description:
                    "The raw spoken or text response provided by the customer.",
                },
              },
              prompt_template: "base_llm",
              system_prompt:
                "You are a quick acknowledgment assistant. Respond with ONLY 2-3 words max like: 'Okay', 'Got it', 'Sure', 'Bilkul', 'Theek hai'. Be brief and natural in Hinglish.",
              service: "groq",
              model: "openai/gpt-oss-20b",
              history_key: "conversation_history_prev",
              stream_timeout: 0.5,
              interruption_type: "no",
              interruption_metadata: {},
              llm_return_type: {
                speak: {
                  type: "str",
                  description: "Brief 2-3 word acknowledgment in Hinglish.",
                },
                hangup: {
                  type: "bool",
                  description: "Always false for acknowledgment.",
                },
              },
            },
          },
          llm: {
            type: "llm-streaming",
            parameters: {
              input_variables: {
                user_input: {
                  type: "str",
                  description:
                    "The raw spoken or text response provided by the customer.",
                },
              },
              prompt_template: "base_llm",
              system_prompt: systemPromptFor(desk, org),
              service: "openrouter",
              model: "google/gemini-3.1-flash-lite-preview",
              history_key: "conversation_history",
              interruption_type: "full",
              interruption_metadata: {
                "min-interruption-delay": 15,
                "min-interruption-debounce": 2,
              },
              llm_return_type: {
                speak: {
                  type: "str",
                  description:
                    "The full conversational response in Hinglish that seamlessly follows the quick acknowledgment. Natural, warm, and logically complete.",
                },
                hangup: {
                  type: "bool",
                  description:
                    "Set true ONLY after the entire conversation flow is complete or if customer indicates they're done.",
                },
              },
            },
            next: ["response", "ask_for_input"],
          },
          response: {
            type: "out",
            parameters: {
              variables: ["speak", "hangup"],
              interruption_type: "no",
              interruption_metadata: {},
            },
          },
        },
        variables: {
          user_input: { type: "str" },
          llm_response: { type: "str" },
          conversation_history: { type: "list", default: [] },
          conversation_history_prev: { type: "list", default: [] },
          speak: { type: "str" },
          analysis: { type: "str" },
          next_step: { type: "str" },
          total_score: { type: "int" },
          net_score: { type: "int" },
          hangup: { type: "bool", default: false },
          node_type: { type: "str" },
        },
        start_node: "greeting",
      },
      "webhook-url": webhookUrl,
    },
    tts_id: { service: "sarvam", speaker: "simran" },

    stt_id: {
      service: "soniox",
      language: ["hi", "en"],
      "enable-speaker-diarization": true,
      "speaker-lock": "first",
      "max-speakers": 1,
    },
    "pre-fire": true,
    "pre-fire-config": { min: 10, max: 5000, current: 40 },
    "grain-voice": false,
    "grain-level": 0.025,
    inactivity: true,
    "inactivity-metadata": {
      "time-period": 1000,
      "max-times": 3,
      "inactivity-type": "static",
      message:
        "Are you still there? No rush — take your time and answer whenever you're ready.",
      "interruption-type": "full",
      "interruption-metadata": {},
    },
  };
}
