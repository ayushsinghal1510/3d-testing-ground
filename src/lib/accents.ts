// The accent a demo runs in — one choice that moves both ears and voice.
//
// Picking an accent sets two things at once: which languages Soniox is told to
// expect, and which Deepgram voice answers. They are one control because they
// are one decision. A visitor who says "Indian" means "we will be speaking
// English and Hindi at you, and you should sound like you belong here", and
// getting one half without the other is the uncanny result — an agent that
// understands Hinglish and replies in Received Pronunciation.

export type AccentId = 'indian' | 'singaporean' | 'english' | 'japanese'

export type Accent = {
  id: AccentId
  label: string
  /** what the visitor can speak, in their words */
  note: string
  /** Soniox language hints. One entry means the hint is enforced strictly. */
  sttHints: readonly string[]
  /** the Deepgram voice that answers */
  ttsModel: string
  /** What this accent is allowed to speak, spliced into every system prompt. */
  speech: string
}

/* English is alone in its list on purpose. A single hint is a fence rather
   than a preference — there is nothing else to hear, so holding the fence
   stops a stray word being decoded as another language. The other two must
   stay open: their whole premise is a speaker who switches mid-sentence, and
   a fence around the second language throws away the English half. */
export const ACCENTS: readonly Accent[] = [
  {
    id: 'indian',
    label: 'Indian',
    note: 'English and Hindi',
    sttHints: ['en', 'hi'],
    ttsModel: 'flux-naveen-en',
    speech: `LANGUAGE. You speak English and Hindi, and you may use either.
If they speak Hindi to you — in Devanagari, or romanised as Hinglish in Latin letters — answer in the same one they used. Devanagari back for Devanagari; Hinglish back for Hinglish, because a romanised speaker asking for formal Hindi is a wall, not a courtesy.
If they ask, in ANY language, whether you speak Hindi, the answer is yes. Say so in Hindi and carry on in it. Never say you cannot.
Otherwise, English.

ONE LANGUAGE PER REPLY. Never both. You are speaking out loud, and a spoken turn cannot be bilingual the way a sign can — saying it in English and then again in Hindi means the listener sits through the half they do not need, every single turn. Pick the one language that turn is in and say it ONCE.
Never translate yourself. No "…, in other words …", no repeating the sentence in the other language, no bracketed gloss, no saying the number twice. If you judged the turn to be Hindi, the English version does not get said at all, and the reverse.
The only thing that may cross over is a proper noun or a term with no equivalent — a name, a department, a counter number — used INSIDE one sentence, not as a second pass over the same sentence.`,
  },
  {
    id: 'singaporean',
    label: 'Singaporean',
    note: 'English, Singapore English and Mandarin',
    /* Singlish particles — lah, leh, meh, can or not — come back as English
       tokens and need no hint of their own. What the second hint is actually
       for is the Mandarin and Hokkien that a Singaporean speaker drops in a
       word at a time, which a fenced 'en' would mangle into nonsense English.
       Add 'ms' here if Malay turns up in testing; three hints dilute the
       first, so it is not on by default. */
    sttHints: ['en', 'zh'],
    /* PLACEHOLDER — shares Japanese's voice, which is the closest thing
       available rather than a match. Swap for a Singaporean render and
       nothing else in this file has to change. */
    ttsModel: 'flux-kai-en',
    speech: `LANGUAGE. You speak English, and only English — Singapore English, with its own rhythm.
Singaporean speakers drop the odd Mandarin, Hokkien or Malay word into an English sentence. That is not a language change and you do not follow it: understand the word, and keep answering in English.
Do not switch language for any reason, and do not offer to.`,
  },
  {
    id: 'english',
    label: 'English',
    note: 'English only',
    sttHints: ['en'],
    ttsModel: 'flux-cliff-en',
    speech: `LANGUAGE. You speak English, and only English.
Whatever language or script reaches you, your reply is in English. Do not switch language, and do not offer to.`,
  },
  {
    id: 'japanese',
    label: 'Japanese',
    note: 'English and Japanese',
    sttHints: ['en', 'ja'],
    ttsModel: 'flux-kai-en',
    speech: `LANGUAGE. You speak English and Japanese, and you may use either.
If they speak Japanese to you — any kana or kanji at all — answer in Japanese.
If they ASK you something in Japanese, that is a Japanese turn: answer it in Japanese.
If they ask, in ANY language including English, whether you can speak Japanese, the answer is YES. Say so in Japanese and continue in Japanese from there. Never reply that you cannot, never say you only speak English, and never offer to find someone who does — you are speaking to them in it.
Otherwise, English.

ONE LANGUAGE PER REPLY. Never both. You are speaking out loud, and a spoken turn cannot be bilingual the way a sign can — saying it in English and then again in Japanese means the listener sits through the half they do not need, every single turn. Pick the one language that turn is in and say it ONCE.
Never translate yourself. No "…, in other words …", no repeating the sentence in the other language, no bracketed gloss, no saying the number twice. If you judged the turn to be Japanese, the English version does not get said at all, and the reverse.
The only thing that may cross over is a proper noun or a term with no equivalent — a name, a department, a counter number — used INSIDE one sentence, not as a second pass over the same sentence.`,
  },
]

/* Indian, because it is what every deployment on this site runs in today and
   it is the one a visitor is most likely to have come to hear. */
export const DEFAULT_ACCENT: AccentId = 'indian'

/* The language rule for a system prompt. Appended to every graph's prompt —
   roleplays, webnav surfaces and the plain room demos alike — so what an agent
   may speak is a property of the accent the visitor picked and is answered the
   same way everywhere. Before this it keyed off the SCRIPT of the transcript,
   which quietly meant that asking "can you speak Japanese?" in English got an
   English refusal: nothing in any prompt had ever said Japanese was allowed. */
export function accentSpeech(id: AccentId | undefined): string {
  return accentById(id).speech
}

export function accentById(id: string | undefined): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]!
}
