/* Words as stance, not as meaning.
 * ---------------------------------------------------------------------------
 *
 * The problem with drawing a word is that you cannot enumerate meaning. A table
 * of word -> picture fails on the first word nobody typed in, and "shapes" as a
 * substrate fails immediately on a word like `help`, which is not a shape and
 * never will be.
 *
 * So this does not encode what a word means. It encodes how a word *behaves* -
 * its stance - along eight axes chosen because each one already drives
 * something the renderer can do. `help` has no shape and a perfectly clear
 * stance: kind, gentle, aimed at something outside itself, unbounded, not
 * forceful on its own. That is drawable.
 *
 * Eight is an extension of a real finding rather than a guess. Osgood's
 * semantic differential work found that most of the variance in how people rate
 * any word, across dozens of languages, collapses onto three dimensions -
 * evaluation, potency, activity. Three is too few to draw with. The five added
 * here are the ones with somewhere to go in this renderer.
 *
 * WHAT THIS IS NOT: knowledge. It does not know a cat has fur, or that Tuesday
 * follows Monday. It knows that `cat` is concrete, small, self-contained and
 * mildly active. For abstract drawing that is the right target, but it will
 * never answer a question of fact and is not meant to.
 *
 * The "fractal" property - the same rule at every scale - is real here and it
 * is structural rather than visual: the same eight axes describe a word, a
 * phrase and a whole sentence, composed upward by the grammar. There is one
 * vocabulary at every level.
 */
(function (global) {
  "use strict";

  /* ── The axes ────────────────────────────────────────────────────────────
   *
   * Every one runs -1..+1 with 0 as neutral, and every one has a rendering
   * consequence. An axis that drives nothing is an axis nobody can have an
   * opinion about, which is the same argument that put the halftone and the
   * Munker pattern on the taste model's ballot. */
  const AXES = ["val", "ene", "pot", "con", "bnd", "dir", "mul", "ver"];
  const AXIS_LABELS = {
    val: "valence · bad→good",
    ene: "energy · calm→violent",
    pot: "potency · weak→strong",
    con: "concreteness · abstract→physical",
    bnd: "boundedness · diffuse→contained",
    dir: "direction · inward→outward",
    mul: "multiplicity · one→many",
    ver: "verticality · down→up",
  };

  const clamp = (n) => Math.max(-1, Math.min(1, Number(n) || 0));
  const zero = () => ({ val: 0, ene: 0, pot: 0, con: 0, bnd: 0, dir: 0, mul: 0, ver: 0 });

  /* ── Nothing, and the word for it ────────────────────────────────────────
   *
   * The first entry in the atlas, and deliberately the only one for now.
   *
   * The engine could not previously say "nothing". Zero on all eight axes is
   * not nothing - toParams maps -1..+1 onto 0..1, so the neutral vector lands
   * at the *middle* of every range and renders as a mid-hue, mid-lit picture at
   * density 0.39. Neutral is beige, not absent. And an unknown word did not
   * even reach neutral: it fell through to soundVector, which reads the
   * consonants and commits to all eight axes at once. Measured on the word
   * "not" itself, that produced pot 0.46, bnd 0.55, a green at density 0.53 -
   * a specific, confident picture of a potent contained thing, from a word that
   * means the absence of one.
   *
   * So nothing is given its own representation rather than a coordinate. It is
   * a flag, not a vector, because any vector is a position and a position is
   * something. What it renders as is the darkest tone the palette can reach and
   * no marks at all: a black screen is what "nothing" looks like, and it is the
   * ground everything else will be defined against.
   *
   * This is the primitive the atlas gets built on. Words will earn their shapes
   * by how they depart from here. */
  const NOTHING_WORDS = ["not", "nothing", "none", "no"];
  /* And the far end of the same line.
   *
   * A single pole is not an opposition, it is a floor. Measured across all 62
   * lexicon words the renderer only ever reaches saturation 18..92, lightness
   * 25..78 and density 0.14..0.615 - so with nothing at zero the atlas spanned
   * absence to *middling*, and the top third of every range was dead space no
   * word could reach. Naming the opposite pole makes the opposition real: the
   * two anchors now sit at the extremes of the same axes, and every word the
   * engine knows falls somewhere between them.
   *
   * Only "everything", and only as an entire utterance. "all" was the obvious
   * second name and is deliberately left out - it is a determiner far more
   * often than a subject ("all the stones"), and making it a pole would put a
   * zero-axis head on the front of ordinary sentences. */
  const EVERYTHING_WORDS = ["everything"];

  /* One constructor for both, because they are the same kind of thing pointing
   * opposite ways. Written once so they cannot drift apart into two special
   * cases that gradually stop being each other's opposite. */
  function poleStance(word, pole) {
    return {
      word, root: null, pos: "x", axes: zero(),
      // Full confidence, and that is the point. "I know this is nothing" is a
      // firm statement; it is the *guesses* that are uncertain. Marking it
      // vague would put it back among the words the engine is unsure about,
      // which is the opposite of what it is.
      confidence: 1, pole, nothing: pole === "nothing", source: pole,
    };
  }

  function vec(partial) {
    const out = zero();
    for (const axis of AXES) if (partial && partial[axis] != null) out[axis] = clamp(partial[axis]);
    return out;
  }
  function blend(a, b, t) {
    const out = zero();
    for (const axis of AXES) out[axis] = clamp(a[axis] * (1 - t) + b[axis] * t);
    return out;
  }
  function scaleVec(a, k) {
    const out = zero();
    for (const axis of AXES) out[axis] = clamp(a[axis] * k);
    return out;
  }
  function addVec(a, b) {
    const out = zero();
    for (const axis of AXES) out[axis] = clamp(a[axis] + b[axis]);
    return out;
  }

  /* ── The seed lexicon ────────────────────────────────────────────────────
   *
   * Deliberately small and hand-placed. It is a set of anchors for the fallback
   * machinery below to interpolate between, not a dictionary - a dictionary is
   * the thing this design exists to avoid needing.
   *
   * Only non-zero axes are written, so a sparse entry means "neutral on
   * everything unstated", which is usually the honest reading. */
  const LEXICON = {
    // ── nouns: concrete
    cat:      ["n", { con: 0.9, pot: -0.2, bnd: 0.7, mul: -0.5, ene: 0.3, val: 0.4 }],
    stone:    ["n", { con: 1, pot: 0.6, bnd: 0.9, ene: -0.8, mul: -0.3, ver: -0.5 }],
    tree:     ["n", { con: 0.9, pot: 0.4, bnd: 0.6, ver: 0.7, val: 0.4, ene: -0.3 }],
    water:    ["n", { con: 0.7, bnd: -0.7, ene: 0.2, mul: 0.5, ver: -0.4, val: 0.3 }],
    fire:     ["n", { con: 0.6, ene: 1, pot: 0.8, bnd: -0.5, ver: 0.6, val: -0.1, dir: 0.8 }],
    bird:     ["n", { con: 0.8, pot: -0.3, ver: 0.8, ene: 0.6, mul: -0.2, val: 0.4 }],
    mountain: ["n", { con: 1, pot: 0.9, bnd: 0.8, ver: 0.9, ene: -0.9, mul: -0.6 }],
    city:     ["n", { con: 0.8, pot: 0.6, mul: 0.9, ene: 0.5, bnd: 0.4, ver: 0.3 }],
    machine:  ["n", { con: 0.9, pot: 0.7, bnd: 0.8, ene: 0.4, val: -0.1 }],
    bone:     ["n", { con: 1, bnd: 0.8, ene: -0.7, pot: 0.2, val: -0.3 }],
    glass:    ["n", { con: 0.8, bnd: 0.6, pot: -0.4, val: 0.2, ene: -0.2 }],
    smoke:    ["n", { con: 0.3, bnd: -0.9, ver: 0.6, ene: 0.3, mul: 0.4, val: -0.3 }],
    seed:     ["n", { con: 0.8, bnd: 0.9, mul: -0.4, pot: -0.5, val: 0.5, ver: -0.3 }],
    crowd:    ["n", { con: 0.7, mul: 1, ene: 0.6, bnd: -0.4, pot: 0.5 }],
    door:     ["n", { con: 0.9, bnd: 0.5, dir: 0.4, mul: -0.4 }],
    wire:     ["n", { con: 0.8, bnd: 0.3, pot: -0.2, mul: 0.3, ene: 0.2 }],
    // ── nouns: abstract
    help:     ["n", { con: -0.7, val: 0.8, pot: -0.1, dir: 0.8, bnd: -0.5, ene: 0.2 }],
    fear:     ["n", { con: -0.8, val: -0.9, ene: 0.7, pot: 0.4, bnd: -0.6, dir: -0.6, ver: -0.4 }],
    hope:     ["n", { con: -0.9, val: 0.9, ene: 0.2, bnd: -0.4, ver: 0.7, dir: 0.5 }],
    time:     ["n", { con: -0.9, bnd: -0.8, ene: 0.1, mul: 0.6, dir: 0.5 }],
    order:    ["n", { con: -0.5, bnd: 0.9, pot: 0.5, ene: -0.4, mul: 0.3, val: 0.3 }],
    chaos:    ["n", { con: -0.5, bnd: -1, ene: 1, mul: 0.9, val: -0.4, pot: 0.6 }],
    silence:  ["n", { con: -0.7, ene: -1, bnd: -0.3, mul: -0.6, val: 0.2 }],
    memory:   ["n", { con: -0.8, bnd: -0.5, ene: -0.2, mul: 0.4, val: 0.2, ver: -0.2 }],
    war:      ["n", { con: -0.2, val: -1, ene: 0.9, pot: 1, mul: 0.7, bnd: -0.5 }],
    truth:    ["n", { con: -0.9, val: 0.6, pot: 0.7, bnd: 0.8, ene: -0.3, ver: 0.4 }],
    grief:    ["n", { con: -0.8, val: -0.8, ene: -0.5, bnd: -0.6, ver: -0.8, pot: 0.3 }],
    joy:      ["n", { con: -0.8, val: 1, ene: 0.8, ver: 0.8, bnd: -0.3, mul: 0.3 }],

    // ── adjectives
    red:      ["a", { ene: 0.6, pot: 0.5, val: 0.1, dir: 0.4 }],
    blue:     ["a", { ene: -0.5, val: 0.2, ver: 0.3, dir: -0.3 }],
    green:    ["a", { val: 0.5, ene: -0.2, con: 0.3 }],
    black:    ["a", { val: -0.4, pot: 0.6, ver: -0.6, ene: -0.3 }],
    white:    ["a", { val: 0.3, pot: -0.2, ver: 0.5, bnd: -0.2 }],
    big:      ["a", { pot: 0.8, con: 0.2, bnd: -0.2 }],
    small:    ["a", { pot: -0.8, bnd: 0.5, con: 0.2 }],
    old:      ["a", { ene: -0.6, pot: 0.2, val: 0.1, ver: -0.3 }],
    new:      ["a", { ene: 0.5, val: 0.4, ver: 0.3 }],
    sharp:    ["a", { ene: 0.7, pot: 0.6, bnd: 0.6, val: -0.2 }],
    soft:     ["a", { ene: -0.6, pot: -0.5, bnd: -0.5, val: 0.5 }],
    heavy:    ["a", { pot: 0.7, ver: -0.7, ene: -0.4, con: 0.4 }],
    bright:   ["a", { ene: 0.6, val: 0.6, ver: 0.4 }],
    dark:     ["a", { val: -0.5, ver: -0.5, ene: -0.3, bnd: -0.2 }],
    quiet:    ["a", { ene: -0.8, pot: -0.3, val: 0.3, mul: -0.3 }],
    wild:     ["a", { ene: 0.9, bnd: -0.9, pot: 0.5, mul: 0.4 }],
    broken:   ["a", { val: -0.6, bnd: -0.7, pot: -0.5, mul: 0.5 }],
    hollow:   ["a", { bnd: 0.3, pot: -0.6, val: -0.3, con: -0.2 }],
    vast:     ["a", { pot: 0.7, bnd: -0.8, mul: 0.4 }],
    ancient:  ["a", { ene: -0.8, pot: 0.5, ver: -0.2, val: 0.2 }],

    // ── verbs. `dir` is the outward reach of the action, `pot` its force.
    crush:    ["v", { pot: 1, ene: 0.8, val: -0.7, dir: 0.7, ver: -0.8, bnd: 0.4 }],
    lift:     ["v", { pot: 0.6, ene: 0.4, val: 0.5, dir: 0.6, ver: 1 }],
    hold:     ["v", { pot: 0.4, ene: -0.4, val: 0.4, dir: 0.3, bnd: 0.8 }],
    break:    ["v", { pot: 0.8, ene: 0.9, val: -0.6, dir: 0.6, bnd: -0.9, mul: 0.6 }],
    open:     ["v", { pot: 0.3, ene: 0.3, val: 0.5, dir: 0.8, bnd: -0.8 }],
    close:    ["v", { pot: 0.4, ene: -0.2, val: -0.1, dir: -0.7, bnd: 0.9 }],
    burn:     ["v", { pot: 0.8, ene: 1, val: -0.5, dir: 0.7, ver: 0.6, bnd: -0.6 }],
    feed:     ["v", { pot: 0.2, ene: 0.2, val: 0.8, dir: 0.9, mul: 0.3 }],
    watch:    ["v", { pot: 0.1, ene: -0.6, val: 0.2, dir: 0.5, bnd: 0.3 }],
    flee:     ["v", { pot: -0.4, ene: 0.9, val: -0.5, dir: -0.9, mul: 0.2 }],
    build:    ["v", { pot: 0.6, ene: 0.4, val: 0.7, dir: 0.5, bnd: 0.7, ver: 0.5 }],
    drown:    ["v", { pot: 0.7, ene: 0.5, val: -0.9, dir: 0.5, ver: -0.9, bnd: -0.4 }],
    sing:     ["v", { pot: 0.2, ene: 0.6, val: 0.8, dir: 0.8, ver: 0.5, bnd: -0.5 }],
    forget:   ["v", { pot: -0.2, ene: -0.5, val: -0.3, dir: -0.6, bnd: -0.7, con: -0.5 }],
  };

  /* ── Morphology: affixes as operators ────────────────────────────────────
   *
   * The cheapest way to reach a word nobody typed in, and by far the highest
   * yield: `unhelpful` is `un` + `help` + `ful`, and each affix is a *function*
   * on the axes rather than a meaning of its own. Thirty of these cover an
   * enormous amount of English productively.
   *
   * `cost` is what the affix does to confidence - a derived word is known less
   * well than a root, and the drawing says so. */
  const PREFIXES = [
    ["un", (v) => ({ ...v, val: -v.val, pot: -v.pot * 0.6 }), 0.12],
    ["in", (v) => ({ ...v, val: -v.val * 0.8 }), 0.18],
    ["im", (v) => ({ ...v, val: -v.val * 0.8 }), 0.18],
    ["dis", (v) => ({ ...v, val: -v.val, bnd: -v.bnd }), 0.12],
    ["non", (v) => scaleVec(v, -0.5), 0.15],
    ["anti", (v) => ({ ...scaleVec(v, -1), ene: Math.abs(v.ene) }), 0.12],
    ["re", (v) => ({ ...v, mul: clamp(v.mul + 0.5), ene: clamp(v.ene + 0.2) }), 0.1],
    ["over", (v) => ({ ...scaleVec(v, 1.4), bnd: clamp(v.bnd - 0.3) }), 0.1],
    ["under", (v) => ({ ...scaleVec(v, 0.6), ver: clamp(v.ver - 0.5) }), 0.1],
    ["out", (v) => ({ ...v, dir: clamp(v.dir + 0.6), pot: clamp(v.pot + 0.2) }), 0.12],
    ["fore", (v) => ({ ...v, dir: clamp(v.dir + 0.4) }), 0.15],
    ["mis", (v) => ({ ...v, val: clamp(v.val - 0.7), bnd: clamp(v.bnd - 0.3) }), 0.12],
    ["sub", (v) => ({ ...v, ver: clamp(v.ver - 0.6), pot: clamp(v.pot - 0.2) }), 0.15],
    ["super", (v) => scaleVec(v, 1.5), 0.12],
    ["multi", (v) => ({ ...v, mul: clamp(v.mul + 0.8) }), 0.1],
    ["semi", (v) => scaleVec(v, 0.6), 0.15],
  ];
  const SUFFIXES = [
    ["less", (v) => ({ ...scaleVec(v, 0.3), pot: -0.6, bnd: -0.6, val: clamp(-v.val * 0.5) }), 0.12, "a"],
    ["ful", (v) => ({ ...scaleVec(v, 1.2), bnd: clamp(v.bnd + 0.4) }), 0.1, "a"],
    ["ness", (v) => ({ ...v, con: clamp(v.con - 1.2) }), 0.12, "n"],
    ["ity", (v) => ({ ...v, con: clamp(v.con - 1.2) }), 0.15, "n"],
    ["tion", (v) => ({ ...v, con: clamp(v.con - 0.9), ene: clamp(v.ene * 0.7) }), 0.15, "n"],
    ["ment", (v) => ({ ...v, con: clamp(v.con - 0.8) }), 0.15, "n"],
    ["ing", (v) => ({ ...v, ene: clamp(v.ene + 0.35), bnd: clamp(v.bnd - 0.3) }), 0.1, "a"],
    ["ed", (v) => ({ ...v, ene: clamp(v.ene - 0.35), bnd: clamp(v.bnd + 0.2) }), 0.1, "a"],
    ["er", (v) => ({ ...v, con: clamp(v.con + 0.6), mul: clamp(v.mul - 0.2) }), 0.15, "n"],
    ["ish", (v) => scaleVec(v, 0.55), 0.12, "a"],
    ["like", (v) => scaleVec(v, 0.7), 0.12, "a"],
    ["y", (v) => ({ ...scaleVec(v, 0.85), con: clamp(v.con - 0.3) }), 0.18, "a"],
    ["ly", (v) => ({ ...v, ene: clamp(v.ene + 0.15) }), 0.18, "a"],
    ["s", (v) => ({ ...v, mul: clamp(v.mul + 0.55) }), 0.06, null],
    ["en", (v) => ({ ...v, pot: clamp(v.pot + 0.2) }), 0.2, "v"],
  ];

  /* ── Sound ───────────────────────────────────────────────────────────────
   *
   * For a root with no morphology to grab and no close neighbour, the letters
   * themselves are the last honest source of a prior. This is the bouba/kiki
   * effect, which is among the most replicated results in psychology and holds
   * across cultures and pre-literate children: hard stops read as angular and
   * sharp, sonorants as round and soft, front vowels as small and quick, back
   * vowels as large and slow.
   *
   * It is a weak signal and it is treated as one - it only survives into the
   * answer when nothing better is available, and it drags confidence down hard
   * so the picture admits it is guessing. */
  const SOUND = {
    k: { ene: 0.5, bnd: 0.5, pot: 0.3 }, x: { ene: 0.6, bnd: 0.4, pot: 0.3 },
    t: { ene: 0.4, bnd: 0.5 }, p: { ene: 0.35, bnd: 0.4 },
    g: { pot: 0.4, ver: -0.2, ene: 0.2 }, b: { pot: 0.4, bnd: 0.3, ver: -0.2 },
    d: { pot: 0.3, ver: -0.2 }, z: { ene: 0.6, mul: 0.4, bnd: -0.3 },
    l: { bnd: -0.4, val: 0.3, ene: -0.3 }, m: { bnd: -0.3, val: 0.35, ene: -0.4 },
    n: { bnd: -0.2, val: 0.2, ene: -0.2 }, r: { ene: 0.35, pot: 0.3 },
    s: { ene: 0.25, mul: 0.4, bnd: -0.3 }, f: { ene: 0.2, bnd: -0.3, pot: -0.2 },
    v: { ene: 0.2, pot: 0.2 }, w: { bnd: -0.4, ene: -0.2 },
    h: { bnd: -0.4, pot: -0.3 }, j: { ene: 0.4 },
    i: { pot: -0.5, ene: 0.4, ver: 0.3 }, e: { pot: -0.25, ene: 0.25, ver: 0.15 },
    a: { pot: 0.2, bnd: -0.2 }, o: { pot: 0.5, ene: -0.3, bnd: 0.3, ver: -0.2 },
    u: { pot: 0.45, ene: -0.4, ver: -0.4 },
  };

  function soundVector(word) {
    const letters = String(word).toLowerCase().replace(/[^a-z]/g, "");
    if (!letters.length) return zero();
    const total = zero();
    for (const ch of letters) {
      const nudge = SOUND[ch];
      if (!nudge) continue;
      for (const axis of AXES) if (nudge[axis]) total[axis] += nudge[axis];
    }
    // Averaged over length, so a long word is not automatically an extreme one.
    return scaleVec(total, 1.6 / Math.sqrt(letters.length));
  }

  /* ── Neighbours ──────────────────────────────────────────────────────────
   *
   * Character trigrams against the lexicon. `gloamy` is near gloom and foam and
   * loam; averaging those, weighted by overlap, beats anything the sound table
   * can say on its own. No embeddings and no download - the lexicon is the only
   * corpus, which is the point. */
  function trigrams(word) {
    const padded = "  " + String(word).toLowerCase() + "  ";
    const out = new Set();
    for (let i = 0; i + 3 <= padded.length; i++) out.add(padded.slice(i, i + 3));
    return out;
  }
  const LEXICON_GRAMS = {};
  for (const word of Object.keys(LEXICON)) LEXICON_GRAMS[word] = trigrams(word);

  function neighbourVector(word) {
    const mine = trigrams(word);
    const scored = [];
    for (const other of Object.keys(LEXICON)) {
      const theirs = LEXICON_GRAMS[other];
      let shared = 0;
      for (const gram of mine) if (theirs.has(gram)) shared++;
      const union = mine.size + theirs.size - shared;
      const similarity = union ? shared / union : 0;
      if (similarity > 0.12) scored.push([other, similarity]);
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b[1] - a[1]);
    const top = scored.slice(0, 3);
    let mass = 0;
    const total = zero();
    for (const [other, similarity] of top) {
      const entry = vec(LEXICON[other][1]);
      for (const axis of AXES) total[axis] += entry[axis] * similarity;
      mass += similarity;
    }
    if (!mass) return null;
    return { vector: scaleVec(total, 1 / mass), best: top[0][0], similarity: top[0][1] };
  }

  /* ── One word ────────────────────────────────────────────────────────────
   *
   * Lexicon, then morphology, then neighbours, then sound - each strictly
   * weaker than the last, and each costing confidence.
   *
   * Confidence is not diagnostics. It is rendered: a word the studio barely
   * understood is drawn more vaguely than one it knows, so the picture is an
   * honest report of how well the word landed. That is the same principle as
   * the thread catalogue refusing to guess a trait it does not have. */
  function readWord(raw) {
    const word = String(raw || "").toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return null;

    // Before the lexicon, because the poles are not meanings to be looked up.
    // They are the two ends the rest of the atlas is measured between.
    if (NOTHING_WORDS.includes(word)) return poleStance(word, "nothing");
    if (EVERYTHING_WORDS.includes(word)) return poleStance(word, "everything");

    const direct = LEXICON[word];
    if (direct) {
      /* Drifted, not seed. This is the one line that makes the other half of
       * the loop reach a picture: without it the offsets accumulate correctly,
       * stay bounded, survive every collapse test, and change nothing anybody
       * can see. A word with no history reads exactly as it always did, because
       * driftedAxes returns the seed until an observation is applied. */
      return { word, pos: direct[0], axes: driftedAxes(word), confidence: 1, source: "lexicon", root: word };
    }

    // Morphology. Strips one prefix and one suffix at most, which is where the
    // yield is; deeper stacking mostly produces spurious roots.
    for (const [suffix, apply, cost, pos] of SUFFIXES) {
      if (!word.endsWith(suffix) || word.length - suffix.length < 3) continue;
      let stem = word.slice(0, -suffix.length);
      // `-y` on a doubled consonant, and the dropped `e` before `-ing`/`-ed`.
      const restored = [stem, stem + "e", stem.slice(0, -1)];
      for (const candidate of restored) {
        const inner = candidate === stem ? null : LEXICON[candidate];
        const base = LEXICON[candidate] || inner;
        if (!base) continue;
        return {
          word, root: candidate, pos: pos || base[0],
          // Built on the root's drifted stance, so `stones` follows `stone`
          // rather than quietly reading from a lexicon nothing updates.
          axes: vec(apply(driftedAxes(candidate) || vec(base[1]))),
          confidence: 1 - cost, source: "suffix:" + suffix,
        };
      }
    }
    for (const [prefix, apply, cost] of PREFIXES) {
      if (!word.startsWith(prefix) || word.length - prefix.length < 3) continue;
      const stem = word.slice(prefix.length);
      const base = LEXICON[stem];
      if (!base) continue;
      return {
        word, root: stem, pos: base[0],
        axes: vec(apply(driftedAxes(stem) || vec(base[1]))),
        confidence: 1 - cost, source: "prefix:" + prefix,
      };
    }
    // A prefix over a suffixed stem: `unhelpful`.
    for (const [prefix, applyPrefix, prefixCost] of PREFIXES) {
      if (!word.startsWith(prefix) || word.length - prefix.length < 4) continue;
      const inner = readWord(word.slice(prefix.length));
      if (!inner || inner.source === "sound" || inner.source === "neighbour") continue;
      return {
        word, root: inner.root, pos: inner.pos,
        axes: vec(applyPrefix(inner.axes)),
        confidence: Math.max(0.2, inner.confidence - prefixCost),
        source: "prefix:" + prefix + "+" + inner.source,
      };
    }

    const near = neighbourVector(word);
    const sound = soundVector(word);
    if (near && near.similarity > 0.25) {
      // Neighbours lead, sound seasons. A word that looks like something known
      // is better explained by that thing than by its consonants.
      return {
        word, root: null, pos: guessPos(word),
        axes: blend(near.vector, sound, 0.25),
        confidence: Math.min(0.6, 0.2 + near.similarity),
        source: "neighbour:" + near.best,
      };
    }
    return {
      word, root: null, pos: guessPos(word),
      axes: sound, confidence: 0.18, source: "sound",
    };
  }

  /* Part of speech for a word the lexicon does not hold. Suffix shape is the
   * only evidence available and it is genuinely informative in English. */
  function guessPos(word) {
    if (/(ing|ise|ize|ate|ify)$/.test(word)) return "v";
    if (/(ous|ful|less|ish|ive|able|ible|al|ic|y)$/.test(word)) return "a";
    return "n";
  }

  /* ── The grammar ─────────────────────────────────────────────────────────
   *
   * This is where order stops being decoration. Averaging the words together
   * would make every arrangement of the same words identical, which is exactly
   * the mush this is trying not to be.
   *
   * Instead order assigns a *role*, and the role decides which part of the
   * picture a word controls:
   *
   *   noun      -> becomes a scene object; its axes set that object's size,
   *                depth, hue and position.
   *   adjective -> modifies the object it attaches to, and nothing else.
   *   verb      -> is not an object at all. It is the relation between two of
   *                them, and the motion of the whole field.
   *
   * So `stone crushes bird` and `bird crushes stone` diverge properly: not
   * because any number was reordered, but because the subject and object slots
   * swapped and `crush` acts on whatever is in the object slot. */
  function parse(text) {
    const tokens = String(text || "").toLowerCase().split(/[^a-z]+/).filter(Boolean)
      .filter((token) => !STOPWORDS.has(token));

    /* Negation is an operator on what follows, not a thing in its own right.
     *
     * It used to be read as an ordinary word, which made it the head of its own
     * phrase - so "not bird" parsed as subject "not", object "bird", and "not
     * not bird" parsed as subject "not", object "not", with *bird dropped
     * entirely*. The word being negated fell out of the sentence. Double
     * negation did not merely fail to return; it lost the thing it was about.
     *
     * Leading negations are counted off here and their parity carried. Even is
     * the plain sentence back again, which is what makes `not not X` mean X.
     * "not" with nothing after it is still the empty frame - that is the pole,
     * and it is the one case where negation is a thing rather than an operator,
     * because there is nothing for it to be an operator on. */
    let negations = 0;
    while (tokens.length > 1 && NOTHING_WORDS.includes(tokens[0])) {
      negations++;
      tokens.shift();
    }

    const read = tokens.map(readWord).filter(Boolean);
    if (!read.length) return null;
    // Parity, not count: a claim negated twice is the claim.
    const negated = negations % 2 === 1;

    const phrases = [];
    let pending = [];
    let relation = null;
    for (const item of read) {
      if (item.pos === "v" && phrases.length && !relation) {
        // The first verb after a noun phrase is the relation. A second verb is
        // treated as an adjective on what follows, which is wrong in general
        // and right often enough for two-object sentences.
        relation = item;
        continue;
      }
      if (item.pos === "a") { pending.push(item); continue; }
      phrases.push({ head: item, modifiers: pending });
      pending = [];
    }
    // Trailing adjectives with no noun to attach to become their own subject:
    // "quiet" alone is a perfectly good thing to draw.
    if (pending.length && !phrases.length) {
      phrases.push({ head: pending[pending.length - 1], modifiers: pending.slice(0, -1) });
    } else if (pending.length) {
      phrases[phrases.length - 1].modifiers.push(...pending);
    }
    if (!phrases.length) return null;
    return { phrases, relation, tokens: read, negated };
  }

  /* ── What a word truly says about the canvas ──────────────────────────────
   *
   * The canvas can say three things about itself, and only three: where weight
   * sits vertically, where it sits horizontally, and whether the picture is
   * held at its edge or in its middle. Those are intangible and completely
   * definite - they exist the moment a canvas exists - which makes them the
   * only vocabulary a picture can use that refers to nothing outside itself.
   *
   * A canvas rule is a basic word's true claim in that vocabulary. Bird is up.
   * Not "bird has a positive number on an axis that happens to drive vertical
   * placement" - birds are up, and up is a thing the canvas can actually mean.
   * The association has to be true rather than assigned, or the visual grounding
   * is arbitrary again and every complaint about arbitrary scores applies to it.
   *
   * Held as *admissible sets* rather than single positions, and that is what
   * makes negation work. "not up" is not "down" - it is anywhere but up - and
   * a set has a complement, so negating twice returns the original exactly.
   * Written as a single position, `not not bird` could only approximate its way
   * back.
   *
   * Deliberately sparse. Most words have no true canvas rule: "helpful" does not
   * sit anywhere, and inventing a position for it would be exactly the guessing
   * this exists to replace. A word with no rule constrains nothing, which is the
   * honest answer and the same rule the thread catalogue follows everywhere. */
  const CANVAS_POSITIONS = Object.freeze({
    vertical: ["above-centre", "centred", "below-centre"],
    horizontal: ["left-weighted", "centred", "right-weighted"],
    gravity: ["edge-held", "centre-held"],
  });

  const CANVAS_RULES = Object.freeze({
    // Things that are up, because they are.
    bird:     { vertical: ["above-centre"] },
    fire:     { vertical: ["above-centre"] },
    // Rooted and reaching: a tree is not up the way a bird is, it is both ends.
    tree:     { vertical: ["above-centre", "below-centre"] },
    // Things that fall.
    stone:    { vertical: ["below-centre"] },
    water:    { vertical: ["below-centre"], gravity: ["edge-held"] },
    // A crowd fills rather than sits: no vertical claim, but it reaches the
    // edges, which is a true thing about many-ness on a bounded surface.
    crowd:    { gravity: ["edge-held"] },
  });
  /* Only words the lexicon actually holds.
   *
   * `sky` and `stillness` were in this table and are not lexicon entries, so
   * they reach readWord's sound fallback at confidence 0.18 - a guess from
   * consonants. Attaching a confident spatial claim on top of a guessed meaning
   * is the same defect as a guessed trait, one layer down and harder to see:
   * the picture would place a word firmly while having no idea what it meant.
   * A canvas rule is a claim about something the studio knows. */

  function negateCanvasRule(rule) {
    if (!rule) return null;
    const out = {};
    for (const [axis, allowed] of Object.entries(rule)) {
      const all = CANVAS_POSITIONS[axis];
      if (!all) continue;
      const complement = all.filter((position) => !allowed.includes(position));
      // Negating a claim that already admits everything leaves nothing
      // admissible, which is not a constraint but a contradiction. Dropped
      // rather than published as an empty set nothing could ever satisfy.
      if (complement.length) out[axis] = complement;
    }
    return Object.keys(out).length ? out : null;
  }

  /* Move a placement until it satisfies the rule, and no further.
   *
   * Negative dy is up, matching the canvas. A rule is a *constraint*, not a
   * position: if the placement the axes produced already lands somewhere the
   * rule admits, it is left exactly alone. Only a placement the rule forbids is
   * moved, and only to the near edge of what is allowed.
   *
   * That is what makes the rule reinterpretable rather than a puppet string. It
   * says where weight may fall, not what is drawn, so it holds equally over an
   * abstract picture and a literal one - and a word with a rule can still be
   * placed a hundred ways inside it. A rule that assigned a position would be a
   * second, quieter way of hard-coding the picture. */
  const RULE_EDGE = 0.12;
  function applyVerticalRule(dy, rule) {
    const allowed = rule?.vertical;
    if (!Array.isArray(allowed) || !allowed.length) return dy;
    const where = dy < -RULE_EDGE ? "above-centre" : dy > RULE_EDGE ? "below-centre" : "centred";
    if (allowed.includes(where)) return dy;
    if (allowed.includes("centred")) return 0;
    return allowed.includes("above-centre") ? -RULE_EDGE * 1.5 : RULE_EDGE * 1.5;
  }

  function applyHorizontalRule(dx, rule) {
    const allowed = rule?.horizontal;
    if (!Array.isArray(allowed) || !allowed.length) return dx;
    const where = dx < -RULE_EDGE ? "left-weighted" : dx > RULE_EDGE ? "right-weighted" : "centred";
    if (allowed.includes(where)) return dx;
    if (allowed.includes("centred")) return 0;
    return allowed.includes("left-weighted") ? -RULE_EDGE * 1.5 : RULE_EDGE * 1.5;
  }

  /* Edge versus centre is a relation of the pair of coordinates, so it cannot
   * be enforced independently on x or y. It preserves the direction the word
   * recipe already chose and moves only far enough to enter the admissible
   * region. A rule constrains the placement; it never chooses a fresh one. */
  function applyGravityRule(dx, dy, rule) {
    const allowed = rule?.gravity;
    if (!Array.isArray(allowed) || !allowed.length) return { dx, dy };
    const radius = Math.hypot(dx, dy);
    const edgeRadius = RULE_EDGE * 1.65;
    const where = radius >= edgeRadius ? "edge-held" : "centre-held";
    if (allowed.includes(where)) return { dx, dy };
    if (allowed.includes("centre-held")) {
      if (!radius) return { dx, dy };
      const scale = (RULE_EDGE * 0.65) / radius;
      return { dx: dx * scale, dy: dy * scale };
    }
    const safeRadius = radius || 1;
    return { dx: (dx || RULE_EDGE) / safeRadius * edgeRadius,
             dy: dy / safeRadius * edgeRadius };
  }

  /* One word's rule, with the sentence's negation applied.
   *
   * Per word rather than per sentence, and that distinction is load-bearing. A
   * first version resolved one rule from the subject and applied it to every
   * placement, so in "stone lifts bird" the stone's own below-centre claim
   * clamped the bird as well and the verb could no longer raise anything -
   * check-words caught it as lifting and crushing putting the object in exactly
   * the same place. A rule is a claim about the thing it belongs to. */
  /* Rules the studio wrote for itself, injected by the page.
   *
   * Held here rather than merged into CANVAS_RULES because that table is frozen
   * and authored, and the difference between "somebody knew this" and "the
   * studio noticed this" has to survive being read back - the lexicon surface
   * reports which is which, and a rule that could not say where it came from
   * would make the two indistinguishable.
   *
   * Validated on the way in. This crosses a boundary from stored JSON that a
   * previous build wrote, so an axis or a position the vocabulary does not have
   * would otherwise become a constraint nothing could ever satisfy and every
   * placement carrying that word would be dragged to a nonexistent edge. */
  let LEARNED_RULES = {};
  function setLearnedRules(map) {
    const next = {};
    for (const [word, entry] of Object.entries(map || {})) {
      const rule = entry?.rule || entry;
      if (!rule || typeof rule !== "object") continue;
      // An authored rule is never replaced by a learned one.
      if (CANVAS_RULES[word]) continue;
      const kept = {};
      for (const [axis, allowed] of Object.entries(rule)) {
        const positions = CANVAS_POSITIONS[axis];
        if (!positions || !Array.isArray(allowed)) continue;
        const valid = allowed.filter((position) => positions.includes(position));
        // Admitting everything is not a constraint; admitting nothing is a
        // contradiction. Neither is worth storing as a rule.
        if (valid.length && valid.length < positions.length) kept[axis] = valid;
      }
      if (Object.keys(kept).length) next[word] = kept;
    }
    LEARNED_RULES = next;
    return Object.keys(next).length;
  }
  function learnedRules() {
    return JSON.parse(JSON.stringify(LEARNED_RULES));
  }

  function canvasRuleForWord(word, negated = false) {
    const base = CANVAS_RULES[word] || LEARNED_RULES[word] || null;
    if (!base) return null;
    const rule = {};
    for (const [axis, allowed] of Object.entries(base)) rule[axis] = allowed.slice();
    return negated ? negateCanvasRule(rule) : rule;
  }

  /* What the sentence as a whole asserts, which is its subject's claim. */
  function canvasRuleFor(composition) {
    if (!composition) return null;
    return canvasRuleForWord(
      composition.subject?.root || composition.subject?.word,
      composition.negated === true);
  }

  const STOPWORDS = new Set(["the", "a", "an", "of", "to", "and", "is", "are", "it", "in", "on", "at", "with"]);

  /* An adjective multiplies rather than averages. Averaging would let a neutral
   * modifier drag a strong noun toward the middle - "big" would make "mountain"
   * less itself, which is backwards. */
  function applyModifiers(head, modifiers) {
    let axes = head.axes;
    for (const modifier of modifiers) {
      const out = zero();
      for (const axis of AXES) {
        const m = modifier.axes[axis];
        /* A modifier silent on an axis leaves it exactly alone.
         *
         * Without this the rule diluted: `big` says nothing about verticality,
         * and averaging - or even the disagreement branch below - dragged
         * `mountain` down from 0.9 to about 0.5 on the one axis a mountain is
         * most itself. A modifier must modify what it is about and nothing
         * else, or every adjective makes its noun blander. */
        if (Math.abs(m) < 0.05) { out[axis] = axes[axis]; continue; }
        // Agreement amplifies, disagreement pulls toward the modifier. This is
        // what makes "quiet fire" a genuinely different thing from "wild fire"
        // rather than a slightly damped one.
        out[axis] = axes[axis] * m > 0
          ? clamp(axes[axis] + m * 0.5)
          : clamp(axes[axis] * 0.55 + m * 0.7);
      }
      axes = out;
    }
    return axes;
  }

  function compose(text) {
    const parsed = parse(text);
    if (!parsed) return null;
    const { phrases, relation, negated } = parsed;

    const built = phrases.map((phrase) => ({
      word: phrase.head.word,
      root: phrase.head.root,
      axes: applyModifiers(phrase.head, phrase.modifiers),
      confidence: Math.min(phrase.head.confidence,
        ...phrase.modifiers.map((m) => m.confidence), 1),
      modifiers: phrase.modifiers.map((m) => m.word),
      source: phrase.head.source,
      pole: phrase.head.pole || null,
      nothing: phrase.head.nothing === true,
    }));

    const subject = built[0];
    const object = built[1] || null;

    /* The verb transfers force from subject to object. This is the asymmetry -
     * the reason word order changes the picture rather than just the caption. */
    if (relation && object) {
      const force = (Math.abs(relation.axes.pot) + Math.abs(relation.axes.ene)) / 2;
      const sign = relation.axes.pot >= 0 ? 1 : -1;
      subject.axes = addVec(subject.axes, scaleVec(relation.axes, 0.35 * sign));
      /* Written absolutely rather than through addVec.
       *
       * It was `addVec(object.axes, {...relation, ver: object.ver + relation.ver/2})`,
       * which mixes a delta and an absolute in one object: addVec then added
       * the object's own value a second time. Every verb drove the object's
       * verticality to the clamp, so a crushed bird and a lifted bird sat at
       * exactly the same height and the two verbs were indistinguishable on the
       * axis that most obviously separates them. */
      const hit = zero();
      for (const axis of AXES) hit[axis] = clamp(object.axes[axis] + relation.axes[axis] * 0.35);
      // The object absorbs the force rather than receiving the verb's own.
      hit.pot = clamp(object.axes.pot - force * 1.2);
      hit.bnd = clamp(object.axes.bnd + relation.axes.bnd * 0.6);
      hit.ver = clamp(object.axes.ver + relation.axes.ver * 0.55);
      object.axes = hit;
    } else if (relation) {
      // No object: the verb acts on the field rather than on anything in it.
      subject.axes = addVec(subject.axes, scaleVec(relation.axes, 0.45));
    }

    // The sentence's own stance, on the same eight axes as its words. Same
    // vocabulary at every level - this is the recursion, and it is structural
    // rather than visual.
    let whole = subject.axes;
    if (object) whole = blend(whole, object.axes, 0.4);
    if (relation) whole = addVec(whole, scaleVec(relation.axes, 0.3));

    const confidence = Math.min(
      subject.confidence,
      object ? object.confidence : 1,
      relation ? relation.confidence : 1);

    /* The whole sentence is nothing only when nothing is all it says.
     *
     * Deliberately narrow while this is primitive. "not" on its own is the
     * empty frame; "not a stone" is a stone standing in some relation to
     * absence, and working out what that picture should be is the atlas's job
     * once it has more than one entry in it. Treating any sentence containing
     * "not" as empty would be the easy reading and the wrong one - it would
     * make negation delete a sentence rather than shape it. */
    const alone = !object && !relation && !subject.modifiers.length;
    const pole = alone && subject.pole ? subject.pole : null;

    return {
      text: String(text || ""),
      subject, object,
      relation: relation ? { word: relation.word, axes: relation.axes, confidence: relation.confidence } : null,
      axes: whole, confidence, pole, nothing: pole === "nothing",
      negated: negated === true,
    };
  }

  /* ── Onto the canvas ─────────────────────────────────────────────────────
   *
   * Deltas on a recipe rather than a recipe, so this steers the studio's own
   * renderer instead of replacing it. Scene objects are written as overrides on
   * `artifact.objects`, which is the addressable form the scene graph already
   * reads; everything else moves the field.
   *
   * Low confidence is spent on vagueness - softer edges, lower opacity, more
   * drift spread. A word the studio does not understand should look like one. */
  function toParams(composition, base) {
    if (!composition) return null;

    /* Nothing renders as nothing.
     *
     * The darkest tone the palette reaches, no saturation to carry a hue, no
     * density to make a mark, and no objects placed. Not a dark picture - the
     * absence of one. Everything the atlas later learns will be a departure
     * from this frame, so it has to be genuinely empty rather than merely
     * quiet, or the first real word would be measured against a picture that
     * was already there.
     *
     * Checked before axes are read at all, because there are no axes to read:
     * nothing is a flag rather than a position. */
    if (composition.pole) {
      const full = composition.pole === "everything";
      return {
        /* The two ends of every range the renderer has, and nothing in
         * between. Measured over the whole lexicon the engine only ever
         * reaches sat 18..92, light 25..78, density 0.14..0.615, so both
         * extremes are outside anything a word can say - which is what makes
         * them anchors rather than just two more entries. */
        palette: full
          ? { hue: 0, hueStep: 360, sat: 100, light: 100 }
          : { hue: 0, hueStep: 0, sat: 0, light: 0 },
        density: full ? 1 : 0,
        symmetry: false,
        artifact: { dimension: full ? 1 : 0, count: full ? 1 : 0 },
        objects: [],
        pole: composition.pole,
        nothing: !full,
        confidence: 1,
      };
    }

    const { axes, confidence } = composition;
    const unit = (v) => (clamp(v) + 1) / 2;                 // -1..1 -> 0..1
    const vague = 1 - Math.max(0, Math.min(1, confidence));

    const palette = {
      // Valence runs the hue: bad is the red-through-violet side, good the
      // green-through-cyan side.
      hue: Math.round(((1 - unit(axes.val)) * 320 + 20) % 360),
      // Multiplicity widens the step, so "crowd" alternates between hues and a
      // single object stays close to one.
      hueStep: Math.round(18 + unit(axes.mul) * 150),
      sat: Math.round(18 + unit(axes.ene) * 74),
      light: Math.round(22 + unit(axes.ver) * 56),
    };

    const objects = [];
    const place = (item, slot) => {
      if (!item) return;
      const rule = canvasRuleForWord(item.root || item.word, composition.negated === true);
      let dx = applyHorizontalRule((slot === 0 ? -1 : 1) *
        (0.05 + unit(item.axes.dir) * 0.22), rule);
      let dy = applyVerticalRule(-item.axes.ver * 0.2, rule);
      ({ dx, dy } = applyGravityRule(dx, dy, rule));
      objects.push({
        // Potency is size, straightforwardly.
        scale: Number((0.55 + unit(item.axes.pot) * 1.1).toFixed(4)),
        // Direction pushes the subject out and pulls the object in, so a
        // transitive sentence reads as one thing acting on another.
        dx: Number(dx.toFixed(4)),
        // The item's own claim, not the sentence's. A verb must still be able
        // to lift the thing it acts on.
        dy: Number(dy.toFixed(4)),
        depth: Number((item.axes.con * 0.4).toFixed(4)),
        hue: Math.round(((1 - unit(item.axes.val)) * 320 + 20) % 360),
        saturation: Number((0.35 + unit(item.axes.ene) * 0.9).toFixed(4)),
        opacity: Number((0.35 + unit(item.axes.bnd) * 0.5 - vague * 0.2).toFixed(4)),
        visible: true,
      });
    };
    place(composition.subject, 0);
    place(composition.object, 1);

    return {
      palette,
      // Boundedness decides whether the marks hold together or spread.
      density: Number((0.14 + unit(axes.bnd) * 0.5).toFixed(4)),
      symmetry: axes.bnd > 0.45 && axes.ene < 0.2,
      artifact: {
        // Concreteness is literally how much perspective space the picture
        // commits to - abstract words stay flat.
        dimension: Number(unit(axes.con).toFixed(4)),
        count: Math.max(2, Math.round(3 + unit(axes.mul) * 12)),
        // A word is a material choice, not a transparent overlay. The painter
        // still varies opacity per relationship, but named forms need a face
        // solid enough to compete with the field and each other.
        depthMode: "interplay",
        opacity: Number((0.66 + unit(axes.bnd) * 0.22).toFixed(4)),
        objects,
      },
      drift: {
        speed: Number((0.4 + unit(axes.ene) * 3.4).toFixed(3)),
        direction: axes.dir >= 0 ? 1 : -1,
        axis: axes.bnd > 0.2 ? "uniform" : "face",
        sync: axes.mul > 0.35 ? "scatter" : axes.ene > 0.4 ? "wave" : "locked",
        // The one place vagueness is additive rather than subtractive: a word
        // the studio is unsure of scatters.
        spread: Number(Math.min(1, unit(axes.mul) * 0.5 + vague * 0.5).toFixed(3)),
      },
      __hexfieldWords: {
        text: composition.text, confidence: Number(confidence.toFixed(3)),
        subject: composition.subject.word,
        object: composition.object ? composition.object.word : null,
        relation: composition.relation ? composition.relation.word : null,
        axes: Object.fromEntries(AXES.map((a) => [a, Number(axes[a].toFixed(3))])),
      },
    };
  }

  /* ── Reference, chosen rather than dropped ───────────────────────────────
   *
   * The painter has a harvest pool - fragments of earlier fields, kept as found
   * objects - and it picks from that pool with a seeded RNG. Every shape is as
   * likely as every other, so the composition is assembled from whatever the
   * seed happened to land on. That is why it reads as arrangement rather than
   * as painting: nothing about the picture chose its own material.
   *
   * But the pool is not dumb. Every harvested shape carries measurements taken
   * when it was cut - its area, its edge character, its skeleton. Those are the
   * same kind of quantity the eight axes are, so a word's stance can be a
   * *retrieval key* over the pool rather than a description laid on top of it.
   * This does not draw the word. It finds the material that already matches it.
   *
   * Deliberately a score and not a filter. A filter would empty the pool for
   * any word the harvest has nothing like, and an empty composition is worse
   * than an approximate one; a score degrades to "the closest thing available",
   * which is what a painter with a limited palette does anyway.
   *
   * The opinion stays inside. Nothing here asks a visitor what a word means -
   * a like or a dislike on the finished painting is the only evidence, and it
   * reaches the lexicon through the thread catalogue rather than through a
   * control that would make the studio's uncertainty the visitor's problem. */
  const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
  // A middling harvested fragment, in pixels. Only used when no pool is at hand.
  const TYPICAL_SHAPE_AREA = 1200;

  /* Reads a harvest summary into the same -1..1 language the axes use, so the
   * comparison below is between two things of the same kind. Missing
   * measurements come back at 0 - neutral, matching everything equally badly,
   * which is the honest reading of a shape nobody measured. */
  function shapeStance(shape, context = {}) {
    if (!shape || typeof shape !== "object") return null;
    const edge = shape.edge || {};
    const topology = shape.topology || {};
    /* Potency is relative size, so it needs something to be relative to. The
     * caller normally supplies the pool's median; a standalone call gets this
     * instead of 1, because harvested areas are in pixels and dividing by 1
     * sent every shape past the clamp - three fragments of wildly different
     * size all read as maximally forceful, and the axis silently stopped
     * ranking anything. Same defect as an unscaled novelty distance. */
    const areaScale = num(context.medianArea, 0) > 0 ? num(context.medianArea) : TYPICAL_SHAPE_AREA;
    const area = num(shape.area) / areaScale;
    const components = Math.max(1, num(topology.components, 1));
    // Canvas y runs downward, so a low centroid is a high shape.
    const centroidY = num(edge.centroidY, 0.5);
    return vec({
      pot: clamp(Math.log2(Math.max(0.05, area)) / 2.2 + num(edge.hard) * 0.4 - num(edge.fade) * 0.3),
      ene: clamp(num(edge.edgeDensity) * 1.4 + num(edge.corner) * 0.8 + num(edge.hard) * 0.5 - num(edge.softness) - 0.35),
      bnd: clamp(0.65 - num(edge.fragmentation) * 1.6 - (components - 1) * 0.28 + num(edge.convex) * 0.4 - num(edge.concave) * 0.4),
      ver: clamp((0.5 - centroidY) * 2.2 + num(topology.convergeTop) * 0.5 - num(topology.convergeBottom) * 0.5),
      mul: clamp((components - 1) * 0.45 + num(edge.fragmentation) * 1.2 + num(edge.dotted) * 0.6 - 0.35),
      con: clamp(num(edge.hard) * 0.7 - num(edge.softness) * 0.9 + num(edge.edgeDensity) * 0.4),
      dir: clamp((num(edge.centroidX, 0.5) - 0.5) * 1.6 + Math.cos(num(edge.axis) * 2) * 0.35),
      // Valence is carried by the palette rather than by silhouette. Left at
      // zero on purpose so it cannot pretend a shape is cheerful.
      val: 0,
    });
  }

  /* Which axes a silhouette can actually speak to.
   *
   * Valence is absent because a shape has no opinion about good and bad - that
   * lives in the palette. Leaving it in the comparison was the novelty-ceiling
   * mistake in miniature: `hope` and `war` feel more strongly about valence
   * than about anything else, so it took the largest share of the weighting
   * while reading 0 for every shape in the pool. A constant cannot rank, and
   * the axes that could rank were left arguing over the remainder. */
  const STANCE_AXES = AXES.filter((axis) => axis !== "val");

  /* How well a piece of reference matches a stance, 0..1.
   *
   * Weighted by how strongly the word feels about each axis: a word with no
   * opinion on verticality must not reject a shape for being tall. The
   * weighting is what enforces that - the early `continue` below only skips
   * arithmetic that would contribute nothing either way. */
  function referenceFit(shape, axes, context = {}) {
    const stance = shapeStance(shape, context);
    if (!stance) return 0;
    let weighted = 0, mass = 0;
    for (const axis of STANCE_AXES) {
      const want = Math.abs(axes[axis]);
      if (want < 0.05) continue;
      weighted += want * (1 - Math.abs(axes[axis] - stance[axis]) / 2);
      mass += want;
    }
    // A word with no strong opinion anywhere accepts anything equally.
    return mass ? Math.max(0, Math.min(1, weighted / mass)) : 0.5;
  }

  /* Orders a pool best-first for a composition, and says how much the ordering
   * is worth. `confidence` scales the whole effect: material chosen on a word
   * guessed from its consonants is barely chosen at all, so a low-confidence
   * reading falls back toward the seeded pick rather than confidently
   * retrieving the wrong fragments. */
  function selectReference(pool, composition, options = {}) {
    if (!Array.isArray(pool) || !pool.length || !composition) return { order: [], strength: 0 };
    const areas = pool.map((shape) => num(shape?.area)).filter((value) => value > 0).sort((a, b) => a - b);
    const context = { medianArea: areas.length ? areas[areas.length >> 1] : 1 };
    const axes = options.axes || composition.axes;
    const scored = pool.map((shape, index) => ({
      shape, index, fit: referenceFit(shape, axes, context),
    }));
    // Stable: equal fits keep the pool's own order, so an unmeasured pool comes
    // back exactly as it went in rather than in a scrambled order that looks
    // like a choice.
    scored.sort((a, b) => (b.fit - a.fit) || (a.index - b.index));
    const spread = scored.length > 1 ? scored[0].fit - scored[scored.length - 1].fit : 0;
    return {
      order: scored,
      // Worth acting on only when the pool actually separates and the word was
      // actually understood.
      strength: Math.max(0, Math.min(1, spread * 2)) * Math.max(0, Math.min(1, composition.confidence)),
      context,
    };
  }

  /* A sentence in one line, for the status strip. It has to be able to say what
   * it did not understand. */
  function describe(composition) {
    if (!composition) return "words: nothing to read";
    const strongest = AXES.slice()
      .sort((a, b) => Math.abs(composition.axes[b]) - Math.abs(composition.axes[a]))[0];
    const level = composition.axes[strongest] >= 0 ? "high" : "low";
    const parts = [composition.subject.word];
    if (composition.relation) parts.push(composition.relation.word);
    if (composition.object) parts.push(composition.object.word);
    const known = composition.confidence >= 0.9 ? "known"
      : composition.confidence >= 0.55 ? "derived"
      : composition.confidence >= 0.3 ? "guessed from neighbours"
      : "guessed from sound";
    return "words: " + parts.join(" → ") + " · " + level + " " +
      AXIS_LABELS[strongest].split(" ·")[0] + " · " + known +
      " (" + Math.round(composition.confidence * 100) + "%)";
  }

  /* A word is not a hidden dictionary entry. This is the honest definition the
   * renderer can use even when it has never seen the thing: a bundle of
   * contrasts it can test in an image. It tells the visitor which of those
   * contrasts came from an anchor and which are still a weak inference. */
  function explain(composition) {
    if (!composition?.subject) return "word definition: nothing to infer";
    /* readWord tags a neighbour reading as `neighbour:<the word it matched>`,
     * never as a bare "neighbour" - so an equality test here is unreachable and
     * every near-miss fell through to the sound branch. `mountian` is derived
     * from the recognised word `mountain` and this line called it consonants.
     *
     * That matters more here than it would anywhere else: telling a visitor how
     * a definition was arrived at is the entire job of this string, and
     * under-reporting the basis makes the studio sound less sure of a reading
     * than it actually is. The matched word is named, because the engine knows
     * it and "nearby word forms" is a category where a fact was available. */
    const source = composition.subject.source || "unknown";
    const near = source.startsWith("neighbour:") ? source.slice("neighbour:".length) : "";
    const basis = source === "lexicon" ? "anchor observations"
      : source.startsWith("suffix:") || source.startsWith("prefix:") ? "word parts applied to a known root"
      : near ? "the nearby word " + near
      : "sound and letter shape";
    const axes = AXES.slice().sort((a, b) => Math.abs(composition.axes[b]) - Math.abs(composition.axes[a]))
      .slice(0, 3).map((axis) => {
        const labels = AXIS_LABELS[axis].split(" · ")[0];
        return (composition.axes[axis] >= 0 ? "more " : "less ") + labels;
      });
    const certainty = composition.confidence >= 0.9 ? "anchored"
      : composition.confidence >= 0.55 ? "derived"
      : "tentative";
    return "word definition: " + composition.subject.word + " = " + axes.join(", ") +
      " · " + certainty + " from " + basis;
  }

  /* ── Drift: words moving toward what they turned out to draw ──────────────
   *
   * The other half of the loop. A word's stance is a guess about how it
   * behaves; what it actually produced is evidence about that guess, and a
   * studio that never updates on it is not learning, it is consulting a table.
   *
   * This is also the single most dangerous thing in the repository, because
   * done naively it looks exactly like learning the whole way down. Let words
   * drift toward the pictures they made and every word drifts toward whatever
   * the renderer finds easy to draw; the lexicon converges on one stance, every
   * phrase produces the same picture, and the confidence numbers keep going up
   * the entire time. Nothing about the output says "this collapsed".
   *
   * So there are five gates, and each is an *outside* term - something the loop
   * cannot generate for itself:
   *
   *   1. A human liked it. The studio's own approval of its own output is not
   *      evidence; this is the same rule that governs made material.
   *   2. Only a seed word drifts. A word derived from morphology or guessed
   *      from sound has no stable identity to move, and admitting them would
   *      let the lexicon grow its own vocabulary out of typos.
   *   3. One observation per context, ever. A context is the confound - field,
   *      palette, text mode. Repeating the same setup a thousand times moves a
   *      word exactly as far as doing it once, so a page left on one
   *      configuration cannot vote its own lexicon into a corner. This is the
   *      independent-context floor the thread catalogue uses, made stricter:
   *      there, contexts gate settling; here they are the only currency.
   *   4. Surprise weights the step. A render that did what the word already
   *      predicted teaches nothing and moves nothing.
   *   5. The seed lexicon pulls back, always. This is the term that makes
   *      collapse impossible rather than unlikely: every word is pulled toward
   *      its *own* distinct origin, so the between-word spread has a floor
   *      built out of the seed spread itself.
   *
   * On the spread, honestly: it does shrink, and it must. A drift that cannot
   * move the lexicon at all is not drift. With the prior pull at PRIOR_PULL and
   * the step at RATE, a word settles about a fifth of the way toward what it
   * drew, so the worst case - every word in the language liked while drawing
   * one identical picture, in every context, forever - lands the lexicon at
   * roughly four fifths of its original spread and stays there. What
   * check-words-drift holds is therefore a floor and a *plateau*: the spread
   * must stay above SPREAD_FLOOR of the seed's, and it must stop falling rather
   * than keep creeping down. "Never shrinks at all" would be a guard against
   * the feature existing. */
  const DRIFT = {
    RATE: 0.08,          // step toward the drawn stance, per accepted observation
    PRIOR_PULL: 0.22,    // shrink toward the seed lexicon, per accepted observation
    MAX_OFFSET: 0.3,     // hard bound: how far one axis may ever leave its seed
    MIN_CONTEXTS: 3,     // distinct contexts before any drift is applied at all
    MIN_SURPRISE: 0.05,  // below this the render told us nothing
    SPREAD_FLOOR: 0.7,   // of the seed lexicon's spread; asserted, not assumed
  };

  // word -> { offset, contexts: [keys], applied }
  let driftState = Object.create(null);

  function driftReset() { driftState = Object.create(null); }

  function driftExport() {
    const out = {};
    for (const word of Object.keys(driftState)) {
      const row = driftState[word];
      out[word] = {
        offset: Object.fromEntries(AXES.map((a) => [a, Number(row.offset[a].toFixed(4))])),
        contexts: row.contexts.slice(0, 64),
        applied: row.applied,
      };
    }
    return out;
  }

  function driftImport(raw) {
    driftReset();
    if (!raw || typeof raw !== "object") return driftState;
    for (const word of Object.keys(raw)) {
      // A stored word that is no longer in the seed lexicon is dropped rather
      // than kept: without its prior there is nothing pulling it back.
      if (!LEXICON[word]) continue;
      const row = raw[word] || {};
      driftState[word] = {
        offset: boundOffset(vec(row.offset)),
        contexts: Array.isArray(row.contexts) ? row.contexts.slice(0, 64).map(String) : [],
        applied: Math.max(0, Math.round(num(row.applied))),
      };
    }
    return driftState;
  }

  function boundOffset(offset) {
    const out = zero();
    for (const axis of AXES) {
      out[axis] = Math.max(-DRIFT.MAX_OFFSET, Math.min(DRIFT.MAX_OFFSET, num(offset[axis])));
    }
    return out;
  }

  /* The seed stance of a word, before anything it drew. Always available, and
   * never itself modified - LEXICON is the prior and stays frozen. */
  function seedAxes(word) {
    const entry = LEXICON[String(word || "").toLowerCase()];
    return entry ? vec(entry[1]) : null;
  }

  /* The stance a word carries now. Seed plus a bounded offset, so a word with
   * no history reads exactly as it always did. */
  function driftedAxes(word) {
    const seed = seedAxes(word);
    if (!seed) return null;
    const row = driftState[String(word).toLowerCase()];
    if (!row || row.applied < 1) return seed;
    const out = zero();
    for (const axis of AXES) out[axis] = clamp(seed[axis] + row.offset[axis]);
    return out;
  }

  /* How much a render told us. The distance between what the word predicted and
   * what the picture turned out to be - so a render that matched the prediction
   * carries no information and moves nothing. */
  function driftSurprise(word, drawn) {
    const current = driftedAxes(word);
    if (!current || !drawn) return 0;
    let sum = 0;
    for (const axis of AXES) {
      const d = clamp(drawn[axis]) - current[axis];
      sum += d * d;
    }
    // Normalised by the widest possible distance across eight axes on -1..1.
    return Math.min(1, Math.sqrt(sum / AXES.length) / 2);
  }

  /* One observation. Returns why it was refused rather than a bare false, so
   * the page can say what the loop is waiting for. */
  function driftObserve(observation) {
    const word = String(observation?.word || "").toLowerCase();
    const seed = seedAxes(word);
    if (!seed) return { applied: false, reason: "not-a-seed-word" };
    // Gate 1. The studio's own approval of its own output is not evidence.
    if (observation?.liked !== true) return { applied: false, reason: "not-liked-by-a-human" };
    const context = String(observation?.context || "");
    if (!context) return { applied: false, reason: "no-context" };
    const drawn = observation?.drawn;
    if (!drawn || typeof drawn !== "object") return { applied: false, reason: "nothing-was-drawn" };

    const row = driftState[word] || (driftState[word] = { offset: zero(), contexts: [], applied: 0 });
    // Gate 3. One observation per context, ever - the whole currency of this
    // loop. A thousand likes in one configuration are worth exactly one.
    if (row.contexts.includes(context)) return { applied: false, reason: "context-already-counted" };
    row.contexts.push(context);
    if (row.contexts.length < DRIFT.MIN_CONTEXTS) {
      return { applied: false, reason: "too-few-contexts", contexts: row.contexts.length };
    }

    // Gate 4. Surprise, measured rather than supplied - a caller cannot talk
    // the loop into a bigger step than the render earned.
    const surprise = driftSurprise(word, drawn);
    if (surprise < DRIFT.MIN_SURPRISE) {
      return { applied: false, reason: "no-surprise", surprise };
    }

    const step = DRIFT.RATE * surprise;
    const next = zero();
    for (const axis of AXES) {
      const toward = clamp(drawn[axis]) - seed[axis] - row.offset[axis];
      // Gate 5. Step toward what it drew, then shrink toward its own seed. The
      // pull is what every word has that is different from every other word,
      // and therefore what the spread is rebuilt out of on every update.
      next[axis] = (row.offset[axis] + step * toward) * (1 - DRIFT.PRIOR_PULL);
    }
    // Gate 2's other half: bounded, so no sequence of observations however long
    // can move a word further than MAX_OFFSET from where it started.
    row.offset = boundOffset(next);
    row.applied++;
    return { applied: true, reason: "drifted", surprise, contexts: row.contexts.length };
  }

  /* The measurement the collapse guard is written against: how far apart the
   * lexicon's words are, right now. Mean per-axis standard deviation across
   * every seed word, under whatever offsets are currently in force. */
  function lexiconSpread(useDrift = true) {
    const words = Object.keys(LEXICON);
    if (words.length < 2) return 0;
    let total = 0;
    for (const axis of AXES) {
      let sum = 0;
      const values = words.map((word) => {
        const axes = useDrift ? driftedAxes(word) : seedAxes(word);
        const value = axes ? axes[axis] : 0;
        sum += value;
        return value;
      });
      const mean = sum / values.length;
      let variance = 0;
      for (const value of values) variance += (value - mean) * (value - mean);
      total += Math.sqrt(variance / values.length);
    }
    return total / AXES.length;
  }

  /* ── The first departure ─────────────────────────────────────────────────
   *
   * Nothing on its own is a black screen, and a black screen is not a
   * relationship. This is the thing that makes "not" mean something: how far a
   * composition has travelled from nothing, on the line between the two poles.
   * 0 is the empty frame, 1 is the full one, and every word the engine knows
   * falls somewhere between.
   *
   * Measured through toParams rather than off the axes, and that is the whole
   * point. The axes are what a word *says*; the rendered parameters are what it
   * would actually put on a canvas, and departure is a claim about the picture.
   * Reading it from the poles' own output means it cannot disagree with them -
   * if the far pole is ever rescaled, this rescales with it, because both ends
   * are asked rather than assumed.
   *
   * Only the three dimensions both poles actually set. Hue is deliberately
   * excluded: it is a circle, so "distance from hue 0" is meaningless, and a
   * red picture is not further from nothing than a blue one. */
  const DEPARTURE_KEYS = [
    (p) => p.palette.sat,
    (p) => p.palette.light,
    (p) => p.density,
  ];

  function departure(composition) {
    if (!composition) return 0;
    const here = toParams(composition);
    if (!here) return 0;
    const none = toParams({ pole: "nothing" });
    const all = toParams({ pole: "everything" });
    let total = 0;
    for (const read of DEPARTURE_KEYS) {
      const span = read(all) - read(none);
      // A pole that has collapsed onto its opposite contributes nothing rather
      // than dividing by zero and reporting infinite travel.
      total += span === 0 ? 0 : (read(here) - read(none)) / span;
    }
    return Math.max(0, Math.min(1, total / DEPARTURE_KEYS.length));
  }

  global.HexfieldWords = {
    AXES, AXIS_LABELS, LEXICON, STOPWORDS, departure,
    vec, blend, zero,
    readWord, guessPos, soundVector, neighbourVector,
    parse, compose, toParams, describe, explain,
    CANVAS_POSITIONS, CANVAS_RULES, canvasRuleFor, canvasRuleForWord, negateCanvasRule,
    applyVerticalRule, applyHorizontalRule, applyGravityRule,
    setLearnedRules, learnedRules,
    shapeStance, referenceFit, selectReference, STANCE_AXES,
    DRIFT, driftObserve, driftedAxes, seedAxes, driftSurprise,
    driftExport, driftImport, driftReset, lexiconSpread,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
