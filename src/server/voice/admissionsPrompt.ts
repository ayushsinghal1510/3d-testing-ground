// The NIMS admissions script, ported verbatim from the reference deployment's
// assets/prompts/college/nims_admission_eng.md.

import admissionsScript from './prompts/calling/admissions.md?raw';
import { md } from './prompts/render';

export const NIMC_BRAND_TOKEN = "{{BRAND}}";
export const NIMC_DEFAULT_BRAND = "NIMS University";

export const NIMC_GREETING =
  "Hello! Thank you for calling {{BRAND}}, this is Sneha from the admissions team. May I know your name, and which course you are interested in?";

const NIMC_SCRIPT = md(admissionsScript);

/** The system prompt for the main LLM node, with the brand substituted in. */
export function nimcSystemPrompt(brand: string = NIMC_DEFAULT_BRAND): string {
  return NIMC_SCRIPT.split(NIMC_BRAND_TOKEN).join(brand);
}

/** The opening line, with the brand substituted in. */
export function nimcGreeting(brand: string = NIMC_DEFAULT_BRAND): string {
  return NIMC_GREETING.split(NIMC_BRAND_TOKEN).join(brand);
}
