// The `jl` roleplay script — Mr Jeremy Lim, on the phone about his father.
//
// The TTSH physiotherapy residency's disclosure scenario. Unlike the other
// four, the difficulty here is not the character's temperament: every clinical
// fact is reassuring and the patient is fine. What is being assessed is
// whether the resident can SAY so in a way a frightened relative can follow.
//
// Which makes information asymmetry the load-bearing constraint of the whole
// demo. Jeremy knows exactly one phone call's worth: his father fell, scraped
// his heel, says he is fine. The examination, the surgeon, the X-ray and the
// incident report are all things the resident has to volunteer. Put any of
// them in the persona and Jeremy arrives already reassured, which is the one
// way to make this scenario worthless. See persona.md.

import { md } from '../prompts/render'
import jeremyPersona from '../prompts/roleplays/jeremy/persona.md?raw'
import jeremyDebrief from '../prompts/roleplays/jeremy/debrief.md?raw'

/* One face, held throughout. He is a voice on a telephone: there is no second
   render to cut to, and a face that changed expression would be claiming to
   show something the resident cannot actually see. The score carries the mood
   instead. */
export const JEREMY_FRAMES = ['main'] as const
export type JeremyFrame = (typeof JEREMY_FRAMES)[number]

export const JEREMY_OPENING_FRAME: JeremyFrame = 'main'

export const JEREMY_NAME = 'Mr Jeremy Lim'

/* He answers the phone without announcing himself, on purpose. The marksheet
   gives the resident credit for confirming who they are speaking to and how
   they are related to the patient (criteria 2 and 3), and a greeting that
   opens with "this is Jeremy Lim, the son" hands them both for free. So he
   gives the worry and withholds the identity. */
export const JEREMY_GREETING =
  'Hello? Sorry, is this the hospital? My dad just called me, he said he fell during his therapy. Is he okay?'

export const JEREMY_PROMPT = md(jeremyPersona)

export const JEREMY_DEBRIEF_PROMPT = md(jeremyDebrief)
