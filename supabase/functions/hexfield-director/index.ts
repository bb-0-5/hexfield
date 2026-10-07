/* hexfield-director: the painter's planner and critic.
 *
 * Owner-only: a request must carry the owner's key (x-hexfield-director,
 * matched against the HEXFIELD_DIRECTOR_KEY secret), so the site's visitors
 * never spend the owner's API budget. Two modes:
 *   plan     - the words and the painter's option lists in; which way to lean
 *              on each choice, the mood and what to emphasise out.
 *   critique - a small thumbnail of the canvas and its context in; a note,
 *              up to four regions to work on (with an action each) and the
 *              kinds of marks to favour out.
 * Secrets: ANTHROPIC_API_KEY, HEXFIELD_DIRECTOR_KEY. Optional: DIRECTOR_DAILY_CAP. */
import Anthropic from "npm:@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const MAX_BODY_BYTES = 400_000;
const DAILY_CAP = Number(Deno.env.get("DIRECTOR_DAILY_CAP") || 150);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey, x-hexfield-director",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

// A backstop against a runaway loop (per running instance; the key is the real gate).
let day = "", calls = 0;
function underCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; calls = 0; }
  return ++calls <= DAILY_CAP;
}

const ACTIONS = ["detail", "simplify", "darken", "lighten", "warm", "cool", "saturate", "mute"];

const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    note: { type: "string", description: "One short sentence for the painter's status line: what this pass should fix." },
    regions: {
      type: "array",
      description: "Up to four places to work on next, most important first. Coordinates are fractions of the canvas (0..1), origin top-left.",
      items: {
        type: "object",
        properties: {
          x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" },
          action: { type: "string", enum: ACTIONS },
          strength: { type: "number", description: "0..1" },
          why: { type: "string" },
        },
        required: ["x", "y", "w", "h", "action", "strength", "why"],
        additionalProperties: false,
      },
    },
    marks: { type: "array", items: { type: "string" }, description: "Names of mark kinds to favour now, from the list given." },
    done: { type: "boolean", description: "True when the painting reads well and further work would only fuss it." },
  },
  required: ["note", "regions", "marks", "done"],
  additionalProperties: false,
};

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    mood: { type: "string", description: "A few words: the feeling the painting should have." },
    emphasis: { type: "array", items: { type: "string" }, description: "Which named things should read first." },
    lean: {
      type: "array",
      description: "For each choice axis given, the option to lean toward (only options from its list).",
      items: {
        type: "object",
        properties: { axis: { type: "string" }, option: { type: "string" }, strength: { type: "number", description: "0..1" } },
        required: ["axis", "option", "strength"],
        additionalProperties: false,
      },
    },
    note: { type: "string", description: "One short sentence about the plan, for the status line." },
  },
  required: ["mood", "emphasis", "lean", "note"],
  additionalProperties: false,
};

const SYSTEM = `You direct a generative painting program, hexfield. It paints in layers of brush marks, from big brushes to fine ones, toward a plan made from the user's words. Your job is a painter's judgement, given briefly and concretely: what a painting needs next, or how to set one up. Prefer a few strong decisions over many small ones. The owner likes bold, readable, hand-made pictures, not ones that look like a filter over a photo. Reply only with the JSON the schema asks for.`;

const client = new Anthropic();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  const ownerKey = Deno.env.get("HEXFIELD_DIRECTOR_KEY");
  if (!ownerKey || !Deno.env.get("ANTHROPIC_API_KEY")) return json({ error: "director is not configured" }, 503);
  if (req.headers.get("x-hexfield-director") !== ownerKey) return json({ error: "forbidden" }, 403);
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY_BYTES) return json({ error: "payload too large" }, 413);
  if (!underCap()) return json({ error: "daily cap reached" }, 429);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }
  const mode = body?.mode === "plan" ? "plan" : body?.mode === "critique" ? "critique" : null;
  if (!mode) return json({ error: "mode must be plan or critique" }, 400);
  const context = JSON.stringify({
    words: String(body.words || "").slice(0, 300),
    lettering: String(body.lettering || "").slice(0, 40),
    choices: body.choices ?? {},
    options: body.options ?? {},
    things: Array.isArray(body.things) ? body.things.slice(0, 12) : [],
    marks: Array.isArray(body.marks) ? body.marks.slice(0, 60) : [],
    pass: body.pass ?? null,
  });

  const content: any[] = [];
  if (mode === "critique") {
    const image = String(body.image || "");
    if (!/^[A-Za-z0-9+/=]{100,}$/.test(image)) return json({ error: "critique needs a base64 jpeg image" }, 400);
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } });
    content.push({ type: "text", text: `The canvas as it stands, and its context:\n${context}\n\nSay what this painting needs next: up to four regions to work on (each with one action) and which mark kinds to favour. Set done only if more work would spoil it.` });
  } else {
    content.push({ type: "text", text: `Set up a painting from these words and choices:\n${context}\n\nLean each listed axis toward the option that best serves the words, say the mood, and which named things should read first.` });
  }

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: mode === "critique" ? CRITIQUE_SCHEMA : PLAN_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    } as any);
    if (response.stop_reason === "refusal") return json({ error: "declined" }, 422);
    const text = response.content.find((b: any) => b.type === "text") as any;
    if (!text?.text) return json({ error: "no answer" }, 502);
    return json({ mode, result: JSON.parse(text.text), usage: response.usage });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: "rate limited" }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: `api ${error.status}` }, 502);
    return json({ error: "director failed" }, 500);
  }
});
