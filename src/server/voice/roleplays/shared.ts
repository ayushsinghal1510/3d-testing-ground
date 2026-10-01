// What the three ported roleplay graphs import.

import { accentById, type AccentId } from '#/lib/accents'

export type VoiceSettings = {
  preFire?: boolean
  inactivityMessage?: string
  /** How long to leave a silence before nudging. Tan-san needs a long one:
      holding a pause is the move his scenario is built to reward, and an agent
      that fills it has answered the trainee's question for them. */
  inactivityPeriod?: number
  inactivityTimes?: number
  ttsModel?: string
  sttModel?: string
  sttLanguage?: string
  /** The visitor's accent choice. Set, it decides both the voice and the ears,
      and outranks ttsModel / sttModel / sttLanguage. */
  accent?: AccentId
}

export function buildVoiceCustoms(settings: VoiceSettings = {}) {
  const preFire = settings.preFire ?? true
  const accent = settings.accent ? accentById(settings.accent) : null
  return {
    tts_id: {
      service: 'deepgram',
      model: accent ? accent.ttsModel : (settings.ttsModel ?? 'aura-2-thalia-en'),
    },
    stt_id: accent
      ? sttSoniox(accent.sttHints)
      : {
          service: 'deepgram-streaming',
          'model-name': settings.sttModel ?? 'nova-3',
          language: settings.sttLanguage ?? 'en-IN',
        },
    'grain-voice': false,
    'grain-level': 0,
    'pre-fire': preFire,
    'pre-fire-config': preFire ? { min: 5, max: 5000, current: 10 } : {},
    inactivity: true,
    'inactivity-metadata': {
      'time-period': settings.inactivityPeriod ?? 1000,
      'max-times': settings.inactivityTimes ?? 3,
      'inactivity-type': 'static',
      message:
        settings.inactivityMessage ??
        'Are you still there? No rush — take your time and answer whenever you are ready.',
      'interruption-type': 'full',
      'interruption-metadata': {},
    },
  }
}

/* Soniox, with the languages it should expect on the wire.
   `strict` is the flag that decides whether a hint is a preference or a
   fence. English-only scenarios keep the fence: there is nothing else to
   hear, and holding it there keeps a stray word from being decoded as
   another language. Anything involving Japanese must NOT be strict — the
   worker these scenarios are built around code-switches mid-sentence, and a
   fence around `ja` throws away the English half of what they said. */
export function sttSoniox(
  hints: readonly string[],
  strict = hints.length === 1,
) {
  return {
    service: 'soniox',
    'language-hints': [...hints],
    'language-hints-strict': strict,
    'enable-speaker-diarization': true,
  }
}

/** English only, fenced. What the four ported roleplays run on. */
export const STT_SONIOX_EN = sttSoniox(['en'])

/** Japanese first, English still allowed through. */
export const STT_SONIOX_JA = sttSoniox(['ja', 'en'])

/** The ears for an accent, for the graphs that set stt_id themselves. */
export function sttForAccent(accent: AccentId | undefined) {
  return accent ? sttSoniox(accentById(accent).sttHints) : STT_SONIOX_EN
}

let webhookUrl = ''
export function setRoleplayWebhook(url: string) {
  webhookUrl = url
}
export function roleplayWebhook(): string {
  return webhookUrl
}
