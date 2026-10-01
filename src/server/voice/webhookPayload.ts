// What the voice server posts back about a session, and how to read it.

type Turn = { role?: string; content?: string };

type RunningResponse = {
  session_id?: string;
  /** Only streaming fragments carry this; a finished node's post does not. */
  node?: string;
  streaming?: boolean;
  chunk?: string;
  out?: unknown;
  error?: string;
};
type Payload = {
  status?: string;
  "session-data"?: {
    state?: {
      session_id?: string;
      step?: string;
      conversation_history?: Turn[];
    };
  };
  responses?: RunningResponse[];
  session_id?: string;
  sessionId?: string;
  "session-id"?: string;
  transcript?: unknown;
  conversation?: unknown;
  turns?: unknown;
};

/* The vision report is concatenated straight into the transcription node's
   own string, inside this tag. It is context for the model, not something the
   caller said, so it never belongs in a transcript. */
const VISUAL_CONTEXT = /<turn-visual-context>[\s\S]*?<\/turn-visual-context>/gi;

/* The page driver's reply carries a marker wherever the screen should move.
   It is timing for the runtime, not something said. */
const WEB_ACTION = /<\|web_action\|>/g;

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(VISUAL_CONTEXT, '').replace(WEB_ACTION, '').replace(/\s{2,}/g, ' ').trim();
  return text || null;
}

/** A node's output dict, unwrapping the `out_dict` some nodes nest it in. */
function outObject(out: unknown): Record<string, unknown> | null {
  if (!out || typeof out !== "object") return null;
  const o = out as Record<string, unknown>;
  const inner = o.out_dict;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return o;
}

function spokenText(out: unknown): string | null {
  if (typeof out === "string") return clean(out);
  const o = outObject(out);
  if (!o) return null;
  return clean(o.speak) ?? clean(o.text);
}

/** The id the post belongs to, wherever this version of the gateway put it. */
export function sessionIdOf(body: Payload | null): string | undefined {
  return (
    body?.['session-data']?.state?.session_id ||
    body?.responses?.find((r) => r?.session_id)?.session_id ||
    body?.session_id ||
    body?.sessionId ||
    body?.['session-id']
  );
}

/* ---------- one turn, read live ----------

   A per-turn post is a bag of node outputs, not a conversation: the caller's
   words arrive on the transcription node as `user_input` , the agent's reply on
   the response node as `speak` , and between them sit two kinds of noise —
   `streaming : true` fragments of that same reply , and the filler node's own
   short `speak` ("Theek hai") , which is latency cover rather than something
   said.

   Fragments are dropped outright ; the whole line arrives on the response node
   regardless. The filler is handled by taking the LAST `speak` in the post
   rather than the first : the filler node runs before the real one , so the
   real reply overwrites it. That is deliberate — a non-streaming post carries
   no `node` name to filter on, so position is the only thing left to use. */
function turnOf(body: Payload): Turn[] {
  let said: string | null = null;
  let replied: string | null = null;

  for (const response of body.responses ?? []) {
    if (response?.streaming) continue;
    const out = outObject(response?.out);
    if (!out) continue;

    said = clean(out.user_input) ?? said;
    replied = spokenText(response?.out) ?? replied;
  }

  const turns: Turn[] = [];
  if (said) turns.push({ role: 'user', content: said });
  if (replied) turns.push({ role: 'assistant', content: replied });
  return turns;
}

/* The `start` post and the first `running` post overlap on the greeting, and a
   retried delivery repeats a whole turn, so an append that does not check would
   double every line it lands on.

   The comparison is against the TAIL AS A BLOCK, not line by line: a turn
   arrives as a pair (what was said, what was answered) , and a per-line check
   would compare the incoming user line against the stored agent line, match
   nothing, and let the whole pair through again. */
function appended(existing: Turn[], incoming: Turn[]): Turn[] {
  const tail = existing.slice(-incoming.length);

  const repeat =
    tail.length === incoming.length &&
    tail.every(
      (turn, i) =>
        turn.role === incoming[i]!.role && turn.content === incoming[i]!.content,
    );

  if (repeat) return existing;

  /* A partial overlap — the greeting arriving on `start` and again on the
     first `running` post — is one line, so it is caught by the same check at
     length 1. */
  const last = existing[existing.length - 1];
  const fresh =
    last &&
    incoming[0] &&
    last.role === incoming[0].role &&
    last.content === incoming[0].content
      ? incoming.slice(1)
      : incoming;

  return fresh.length ? [...existing, ...fresh] : existing;
}

export function nextTranscript(
  body: Payload,
  existing: Turn[],
): Turn[] | null {
  /* The finished transcript, when it comes, is authoritative — it is the
     agent's own history and carries both sides in the order they happened. It
     replaces rather than appends. */
  const history = body['session-data']?.state?.conversation_history;
  if (history) return history;

  const turn = turnOf(body);
  if (!turn.length) return null;

  const next = appended(existing, turn);
  return next.length === existing.length ? null : next;
}

/** Whether this post says the session is over. */
export function isFinished(body: Payload): boolean {
  const status = (body.status || '').toLowerCase();
  return status.includes('complete') || status.includes('end');
}

export type { Payload, Turn };

/* ---------- the scene ----------

   The roleplay graphs return more than a spoken line. Every `response` node in
   cheryl/muthu/vps emits `frame` (which face he is wearing), `actions` (the
   physical things he does this turn) and, for cheryl and vps, a running
   `score`. tempp reads those back out of its own database and draws them; this
   is the same reading, against the same payload shape.

   Kept append-only and turn-numbered so the browser can poll for "anything
   after N" rather than re-reading the whole session every second. */

export type SceneBeat = {
  /** Monotonic, assigned on write. What the poller asks for "after". */
  n: number;
  /** The avatar's face or pose for this turn, as the model labelled it. */
  frame?: string;
  /** Physical things done this turn — "receipt", "shirt", "phone", … */
  actions?: string[];
  /** Running judgement, STATUS_VALUE form, e.g. "retry_5". cheryl/vps only. */
  score?: string;
};

/** The beats carried by one post, in order, ready to append. */
export function sceneBeats(body: Payload, from: number): SceneBeat[] {
  const beats: SceneBeat[] = [];
  let n = from;

  for (const response of body.responses ?? []) {
    if (response?.streaming) continue;
    const out = outObject(response?.out);
    if (!out) continue;

    const frame = typeof out.frame === "string" ? out.frame : undefined;
    const score = typeof out.score === "string" ? out.score : undefined;
    const actions = Array.isArray(out.actions)
      ? out.actions.filter((a): a is string => typeof a === "string" && !!a)
      : undefined;

    // `hold_frame` re-emits the face on its own to keep the avatar on it. That
    // is not a beat — appending it would replay the same face change forever.
    if (!frame && !score && !actions?.length) continue;

    beats.push({
      n: ++n,
      ...(frame ? { frame } : {}),
      ...(actions?.length ? { actions } : {}),
      ...(score ? { score } : {}),
    });
  }

  return beats;
}
