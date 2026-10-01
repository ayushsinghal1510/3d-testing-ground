// What the roleplays put on the counter, and how the room draws each one.
//
// Ported from tempp's SCENE_PROPS, with two differences. The imagery is local
// rather than hotlinked — this is a marketing page that just spent real effort
// on how fast it paints, and a third-party image server is not something to
// hand that back to. And the receipt and the phone are drawn rather than
// photographed: a receipt rendered as an actual receipt, with the shirt he is
// arguing about printed on it, says more than a stock photo of a receipt.
//
// The keys are the exact strings the model is allowed to return in `actions`.
// See cherylCustoms.ts and vpsCustoms.ts for the enumerations.

export type ScenePropKind =
  | 'image'
  | 'receipt'
  | 'recording'
  | 'report'
  | 'form'
  /* mm — Mr Muthu. All drawn, none photographed: what he puts on the desk is
     paper, and paper is the one thing this page can render honestly. */
  | 'bills'
  | 'aid-letter'
  | 'mp-letter'
  | 'referral'
  /* tn — Tan-san. Japanese care-facility paperwork, drawn the same way. The
     documents are the argument: he will not say he is unhappy, but the meal
     log and the call history say it for him. */
  | 'meal-record'
  | 'med-calendar'
  | 'care-plan'
  | 'call-log'

export type SceneProp = {
  /** What the card is called, in the visitor's terms. */
  label: string
  kind: ScenePropKind
  /** For `image` props. */
  src?: string
  /** One line under the card saying why it just appeared. */
  note?: string
}

export const SCENE_PROPS: Record<string, SceneProp> = {
  /* --- pr: Mr Cheryl, returning a shirt --- */
  receipt: {
    label: 'His receipt',
    kind: 'receipt',
    note: 'He put it on the counter when you asked for proof of purchase.',
  },
  shirt: {
    label: 'The shirt',
    kind: 'image',
    src: '/assets/scene-shirt.webp',
    note: 'He passed it over when you asked to see the defect.',
  },
  phone: {
    label: 'His phone',
    kind: 'recording',
    note: 'He is recording. You have pushed him to the top of his range.',
  },
  'get-details': {
    label: 'Escalation form',
    kind: 'form',
    note: 'You offered to raise it. He is waiting to hear that you did.',
  },

  /* --- vps: Mr Nair, elderly diabetic ---
     `shows-foot` is deliberately absent. It is a body, and this page is not
     going to render one; it falls out of the visible list the same way
     `turn-away` does, which coincides with the session ending and is already
     announced by the room itself. */
  'medication-bag': {
    label: 'His tablets',
    kind: 'image',
    src: '/assets/scene-tablets.webp',
    note: 'He brought them, loose in a bag, when you asked what he is taking.',
  },
  'report-sheet': {
    label: 'Blood test report',
    kind: 'report',
    note: 'Three months old. He has been carrying it folded in his wallet since.',
  },

  /* --- mm: Mr Muthu, aggrieved applicant ---
     He came in with a folder and he uses it as an argument. Each of these is a
     turn where he stops talking and puts something down, which is the beat a
     transcript loses. */
  bills: {
    label: 'His stack of bills',
    kind: 'bills',
    note: 'He pushed the whole stack across the desk rather than answer you.',
  },
  'aid-letter': {
    label: 'His assistance letter',
    kind: 'aid-letter',
    note: 'Nine hundred a month, in writing. He wants you to read it again.',
  },
  'mp-letter': {
    label: 'Meet-the-People letter',
    kind: 'mp-letter',
    note: 'The MP’s office. He is showing you he has already been higher than you.',
  },
  'referral-form': {
    label: 'Job coaching referral',
    kind: 'referral',
    note: 'You offered it. It is on the desk between you, unsigned.',
  },

  /* --- tn: Tan-san, a resident who has stopped asking ---
     Nothing here is handed over in anger. He is a polite man who produces a
     document instead of a complaint, and the document is worse than the
     complaint would have been. */
  'meal-record': {
    label: '食事記録 · Meal record',
    kind: 'meal-record',
    note: 'He slid it over when you asked whether he had eaten.',
  },
  'med-calendar': {
    label: 'お薬カレンダー · Medicine calendar',
    kind: 'med-calendar',
    note: 'Four evenings still in their pockets. He did not mention it.',
  },
  'care-plan': {
    label: 'ケアプラン · Care plan',
    kind: 'care-plan',
    note: 'Signed by his daughter. He was not in the room when it was agreed.',
  },
  'call-log': {
    label: 'ナースコール履歴 · Call history',
    kind: 'call-log',
    note: 'Six calls in one night, then nothing for three weeks.',
  },
}

/* ---------- the face ----------

   `mood` demos (mm, pr) change face because of how the conversation is going,
   so a change there is worth announcing — it is the closest thing these demos
   have to a score you can read at a glance. `pose` demos (vps) change frame
   because the trainee asked the patient to move an arm, which is not news. */

export type MoodTone = 'calm' | 'angry'

/** Which frame labels mean "settled". Everything else reads as agitated. */
const CALM_FRAMES = new Set(['normal', 'calm'])

export function toneOf(frame: string): MoodTone {
  return CALM_FRAMES.has(frame) ? 'calm' : 'angry'
}

/* Two registers, because two cultures fail differently. Muthu's displeasure is
   loud and you cannot miss it. Tan-san's is a closed door: he goes polite,
   formal and brief, and a trainee who reads that as "fine" has already lost
   him. Naming the withdrawal is the whole point of drawing the banner. */
export type MoodRegister = 'anger' | 'withdrawal'

export function moodLine(
  tone: MoodTone,
  name: string,
  register: MoodRegister = 'anger',
): string {
  if (register === 'withdrawal') {
    return tone === 'calm'
      ? `${name} has opened up a little — he is telling you things again.`
      : `${name} has closed. Still polite, still answering, no longer with you.`
  }
  return tone === 'calm'
    ? `${name} is settling down — whatever you just did, it worked.`
    : `You have lost ${name}. He is agitated again.`
}

/* ---------- the running score ----------

   Arrives as STATUS_VALUE, e.g. "retry_5". Split rather than shown raw: the
   number alone is meaningless and the status alone is imprecise. */

export type ScoreStatus = 'pass' | 'retry' | 'fail'

export function parseScore(
  raw: string,
): { status: ScoreStatus; value: number } | null {
  const [status, value] = raw.split('_')
  const n = Number(value)
  if (status !== 'pass' && status !== 'retry' && status !== 'fail') return null
  if (!Number.isFinite(n)) return null
  return { status, value: n }
}

export const SCORE_LABEL: Record<ScoreStatus, string> = {
  pass: 'On track',
  retry: 'Recoverable',
  fail: 'Losing him',
}
