// The scripts for the desks other than university.

import type { DeskId } from '#/lib/desks'
import { NIMC_BRAND_TOKEN, nimcGreeting, nimcSystemPrompt } from './admissionsPrompt'
import { md, render } from './prompts/render'
import sharedRules from './prompts/calling/shared-rules.md?raw'
import school from './prompts/calling/school.md?raw'
import opd from './prompts/calling/opd.md?raw'
import hotel from './prompts/calling/hotel.md?raw'
import supportEngine from './prompts/calling/support-engine.md?raw'
import nsdc from './prompts/calling/nsdc.md?raw'
import lab from './prompts/calling/lab.md?raw'

const SHARED_RULES = md(sharedRules)

/** A helpdesk product layer on top of the shared support engine. */
const onSupportEngine = (product: string) => md(`${supportEngine}\n---\n---\n\n${product}`)

const withRules = (template: string) =>
  render(md(template), { SHARED_RULES })

const SCRIPTS: Record<Exclude<DeskId, 'university'>, string> = {
  school: withRules(school),
  opd: withRules(opd),
  hotel: withRules(hotel),
  /* No SHARED_RULES: the support engine carries its own language, turn-length
     and number rules, and they are stricter than the shared ones. Splicing
     both in would give the model two versions of the same rule to reconcile. */
  nsdc: onSupportEngine(nsdc),
  lab: onSupportEngine(lab),
}

const GREETINGS: Record<Exclude<DeskId, 'university'>, string> = {
  school: `Hello! {{BRAND}} front office, this is Priya. How can I help you today?`,
  opd: `Hello? Haan ji, main {{BRAND}} OPD ke liye baat kar raha hoon. Mujhe pet mein dard ho raha hai do din se.`,
  hotel: `Good evening! {{BRAND}}, front desk, Ravi speaking. How may I help you?`,
  /* Seven seconds, and it says the three things a helpline has to say before
     anything else: where you have reached, that this is an AI, and that the
     call is recorded. No {{BRAND}} — the line is Skill India's whichever
     scheme the caller is ringing about. */
  nsdc:
    `नमस्कार, Skill India हेल्पलाइन में आपका स्वागत है। मैं विद्या हूँ, एक AI असिस्टेंट। ` +
    `यह कॉल रिकॉर्ड हो रही है। बताइए, मैं आपकी क्या मदद कर सकती हूँ?`,
  /* English opening; the support engine's language rules take over from the caller's first reply. */
  lab:
    `Hello, you have reached the {{BRAND}} service desk. I am Rachel, an AI assistant, and this call is recorded. ` +
    `What is the problem with your machine?`,
}

function fill(text: string, brand: string): string {
  return text.split(NIMC_BRAND_TOKEN).join(brand)
}

/** The system prompt for a desk, with the organisation name substituted in. */
export function systemPromptFor(desk: DeskId, brand: string): string {
  if (desk === 'university') return nimcSystemPrompt(brand)
  return fill(SCRIPTS[desk], brand)
}

/** The opening line for a desk, with the organisation name substituted in. */
export function greetingFor(desk: DeskId, brand: string): string {
  if (desk === 'university') return nimcGreeting(brand)
  return fill(GREETINGS[desk], brand)
}
