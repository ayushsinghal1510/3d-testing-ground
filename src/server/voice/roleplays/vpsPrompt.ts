// The `vps` roleplay script — Mr Suresh Nair, an elderly diabetic patient with a
// foot ulcer he is deflecting about and a fear he will not name.

import { md } from '../prompts/render';
import vpsPersona from '../prompts/roleplays/vps/persona.md?raw';
import vpsFeedback from '../prompts/roleplays/vps/feedback.md?raw';
import vpsSummary from '../prompts/roleplays/vps/summary.md?raw';

export const VPS_FRAMES = ["main", "right-hand", "left-hand"] as const;
export type VpsFrame = (typeof VPS_FRAMES)[number];

export const VPS_OPENING_FRAME: VpsFrame = "main";

export const VPS_ACTIONS = [
  "medication-bag",
  "report-sheet",
  "shows-foot",
  "companion-cuts-in",
  "turn-away",
] as const;
export type VpsAction = (typeof VPS_ACTIONS)[number];

export const VPS_GREETING =
  "Namaste, doctor. My daughter made me come. I told her it is nothing, but she does not listen to me. So here I am, sitting in front of you, wasting your time.";

export const VPS_PROMPT = md(vpsPersona);

export const VPS_FEEDBACK_PROMPT = md(vpsFeedback);

/** The debrief's prose half. Separate node, separate model, same history key. */
export const VPS_SUMMARY_PROMPT = md(vpsSummary);
