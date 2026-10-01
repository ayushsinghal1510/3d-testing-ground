// The `mm` roleplay script — Mr Muthu, a hostile aid applicant.

import { md } from '../prompts/render';
import muthuPersona from '../prompts/roleplays/muthu/persona.md?raw';
import muthuDebrief from '../prompts/roleplays/muthu/debrief.md?raw';

export const MUTHU_FRAMES = ["main", "normal"] as const;
export type MuthuFrame = (typeof MUTHU_FRAMES)[number];

/** The face he starts on, before the officer has said anything. Angry. */
export const MUTHU_OPENING_FRAME: MuthuFrame = "main";

export const MUTHU_GREETING =
  "See here! I'm showing you all these bills, look! Nine hundred dollars they give me, nine hundred! How to survive like this?! My mother is bedridden, my children eating bread every day! You tell me now, how?!";

export const MUTHU_PROMPT = md(muthuPersona);

export const MUTHU_DEBRIEF_PROMPT = md(muthuDebrief);
