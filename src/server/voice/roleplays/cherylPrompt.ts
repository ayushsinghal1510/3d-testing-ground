// The `pr` roleplay script — Mr Cheryl, a firm retail customer with a defective
// shirt.

import { md } from '../prompts/render';
import cherylPersona from '../prompts/roleplays/cheryl/persona.md?raw';
import cherylFeedback from '../prompts/roleplays/cheryl/feedback.md?raw';
import cherylSummary from '../prompts/roleplays/cheryl/summary.md?raw';

/** The two avatar faces, and the exact strings the model must return. */
export const CHERYL_FRAMES = ["main", "normal"] as const;
export type CherylFrame = (typeof CHERYL_FRAMES)[number];

export const CHERYL_OPENING_FRAME: CherylFrame = "main";

/** The five action tags, in the order the scenario tends to produce them. */
export const CHERYL_ACTIONS = [
  "receipt",
  "shirt",
  "get-details",
  "phone",
  "turn-away",
] as const;
export type CherylAction = (typeof CHERYL_ACTIONS)[number];

export const CHERYL_GREETING =
  "Excuse me. I need to speak to someone about this shirt. I bought it here last week — and look at this. One of the buttons is already missing. This is clearly a manufacturing defect. I want a refund. I paid good money for this, and it is not acceptable.";

export const CHERYL_PROMPT = md(cherylPersona);

export const CHERYL_FEEDBACK_PROMPT = md(cherylFeedback);

/** The debrief's prose half. Separate node, separate model, same history key. */
export const CHERYL_SUMMARY_PROMPT = md(cherylSummary);
