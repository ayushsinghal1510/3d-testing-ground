// The `tn` roleplay script — Tanaka-san, a resident who has stopped asking.
//
// Muthu's Japanese counterpart, and deliberately not a translation of him. The
// two demos exist as a pair: the same machinery — a face the model chooses, a
// running score, things put on the table — pointed at a culture where distress
// does not arrive as volume. Muthu shouts and you cannot miss him. Tanaka-san
// thanks you politely and you lose him for three weeks.
//
// Which means the mood axis here is open against closed, not angry against
// calm. See MoodRegister in lib/sceneProps.

import { md } from '../prompts/render'
import tanPersona from '../prompts/roleplays/tan/persona.md?raw'
import tanDebrief from '../prompts/roleplays/tan/debrief.md?raw'

export const TAN_FRAMES = ['main', 'normal'] as const
export type TanFrame = (typeof TAN_FRAMES)[number]

/** The face he starts on. Closed, not hostile. */
export const TAN_OPENING_FRAME: TanFrame = 'main'

export const TAN_NAME = 'Tanaka-san'

export const TAN_GREETING =
  'Ah. Good morning. 大丈夫です, I am fine, thank you. Sorry — you must be busy today.'

export const TAN_PROMPT = md(tanPersona)

export const TAN_DEBRIEF_PROMPT = md(tanDebrief)
