/* How it learns what to paint, with nothing to press.
 *
 * A painting is a genome: 61 numbers between 0 and 1, read as a structure -
 * one, two or three pillars of up to four stacked pieces (any of the six
 * surfaces, upright or upside down, narrowing or widening as they rise),
 * standing in a row, staggered back and forth or stepping back, arches
 * springing between neighbouring pillars with smaller and smaller arches set
 * back inside them, and how the glaze is turned and slid from storey to
 * storey - the sun that lights it, then which sims run over it - two or three
 * of rings, billiard paths and ripples, each with its own spacings, turns and
 * widths - how strongly each one's beats push the others' lines, how (moving
 * them across, swelling them, or both) and for how many rounds back and
 * forth, the camera, how wide the reading blurs, how big the painting sits in
 * the middle of the frame, and its colours: a hue, the colour-theory path its
 * value takes round the wheel from there, which way the value runs, and
 * paper or neon. Its own eye scores each painting on what this kind of painting
 * needs - beats you can see, bands neither too few nor too many, a picture
 * that holds together, sims that visibly act on each other - and an archive
 * keeps the best it has found of each
 * kind of picture (form × which sims × how many bands): most new paintings
 * are a small change to one of those, some are new tries. It gets better
 * within each kind and stays varied across them. Paintings someone has picked
 * are kept apart and bred from more often: picks count for more than its own
 * eye. */
(function (global) {
  "use strict";
  const M = global.HexfieldMoire;
  const SURFACE_KEYS = Object.keys(M.SURFACES), TYPES = ["rings", "billiard", "waves"], FORMS = ["column", "gate", "arcade"], HARMONY_KEYS = Object.keys(M.HARMONIES);
  const CONSTANTS = Object.values(M.IRRATIONAL), DENOMINATORS = [5, 6, 8, 10, 12];
  // (Each sim's slot: what it is, then six numbers it reads its own way - see sim().)
  const SLOT = (k) => ["s" + k, ...["a", "b", "c", "d", "e", "f"].map((x) => "s" + k + x)];
  const GENES = ["pillars", "storeys", "p0", "p1", "p2", "p3", "flips", "taper", "span", "gap", "slide", "turn", "vary", "layout", "depth", "sun", "height",
    "nest", "fit", "recess", "overlap", "yaw", "pitch", "dist", "blur", "fill", "hue", "harmony", "lift", "light", "spill", "stroke",
    ...SLOT(0), ...SLOT(1), ...SLOT(2), "k01", "k02", "k10", "k12", "k20", "k21", "mode", "rounds"];
  const N = GENES.length, gi = Object.fromEntries(GENES.map((g, i) => [g, i]));
  // (Genes read as a choice among a few, not a quantity: these change by being chosen again, not by being nudged.)
  const CHOICE = new Set(["pillars", "storeys", "p0", "p1", "p2", "p3", "flips", "layout", "nest", "harmony", "lift", "light", "overlap", "s0", "s1", "s2", "s0c", "s1c", "s2c", "mode"]);
  const pickOf = (list, g) => list[Math.min(list.length - 1, Math.floor(g * list.length))];

  // A ratio near 1 that never comes out even: an irrational number over the nearest fraction to it.
  const nearOne = (c, q) => c / (Math.round(c * q) / q);
  /* One sim from its six numbers:
   * rings - the direction they face, their spacing (times an irrational ratio), their width, where they start;
   * billiard - where its circle is and how big, its turn (an irrational fraction of a full turn), its width;
   * waves - where they spread from, their spacing (times an irrational ratio), their width, where they start.
   * (One set of sims for the whole structure: each piece shows its own part of them.) */
  function sim(type, [a, b, c, d, e, f]) {
    const k = pickOf(CONSTANTS, c);
    if (type === "rings") return M.horocycles(a * 2 * Math.PI, (0.07 + b * 0.18) * nearOne(k, pickOf(DENOMINATORS, d)), f, 0.3 + e * 0.4);
    if (type === "waves") return M.waves([d * 1.4, a * 2 * Math.PI], (0.07 + b * 0.18) * nearOne(k, 8), f, 0.3 + e * 0.4);
    return M.billiard([d * 1.2, a * 2 * Math.PI], 0.9 + b * 1.8, 2 * Math.PI * ((k * (1 + Math.floor(f * 4))) % 1), 130, 0.006 + e * 0.03, a * 2 * Math.PI);
  }
  /* A painting from its genes: the structure (at least two pieces: a column
   * of two or more, or pillars with arches between them); two sims, or three;
   * how strongly each one's beats push each other one's lines, and which way
   * (every painting's sims push each other hard somewhere: the strongest push
   * at least 1), how the pushes land, and for how many rounds; then the sun
   * (from in front, from either side or from behind, between a third and two
   * thirds of the way up the sky), the camera (low and looking up, or higher
   * and looking down at the ground, so the uprights meet at a third point),
   * the framing - always the whole silhouette and its shadow, centred - the
   * reading and the colours. Its kind of form: column, gate (two pillars, one
   * arch) or arcade (three, two arches), low (one or two storeys) or tall. */
  function decode(genes) {
    const g = (name) => genes[gi[name]];
    const pillars = pickOf([1, 2, 3], g("pillars")), storeys = Math.max(pillars === 1 ? 2 : 1, pickOf([1, 2, 3, 4], g("storeys"))), flips = Math.floor(g("flips") * 16);
    const plan = {
      pillars, stack: Array.from({ length: storeys }, (_, k) => ({ key: pickOf(SURFACE_KEYS, g("p" + k)), flip: !!((flips >> k) & 1) })),
      taper: 0.7 + g("taper") * 0.45, span: 2 + g("span") * 2, gap: 0.02 + g("gap") * 0.08,
      layout: pickOf(M.LAYOUTS, g("layout")), depth: 0.3 + g("depth") * 0.9,
      nest: pickOf([1, 2, 3, 4, 5], g("nest")), fit: 0.8 + g("fit") * 0.2, recess: 0.08 + g("recess") * 0.5,
      slide: g("slide") * 0.9, turn: g("turn") * 2 * Math.PI, vary: g("vary") < 0.5 ? 0 : (g("vary") - 0.5) * 4 * Math.PI,
    };
    const form = FORMS[pillars - 1] + "-" + (storeys <= 2 ? "low" : "tall");
    const slots = [0, 1, 2].map((k) => ({ k, type: k < 2 ? pickOf(TYPES, g("s" + k)) : pickOf([...TYPES, "off", "off"], g("s2")) })).filter((x) => x.type !== "off");
    const families = slots.map(({ k, type }) => sim(type, ["a", "b", "c", "d", "e", "f"].map((x) => g("s" + k + x))));
    const couple = slots.map(({ k: i }) => slots.map(({ k: j }) => (i === j ? 0 : (g("k" + i + j) - 0.5) * 5)));
    let most = 0;
    for (const row of couple) for (const c of row) if (Math.abs(c) > Math.abs(most)) most = c;
    if (Math.abs(most) < 1) for (const row of couple) for (let j = 0; j < row.length; j++) if (row[j] === most) row[j] = most < 0 ? -1 : 1;
    const kind = [...new Set(slots.map((x) => x.type))].sort().join("+");
    return {
      genes: Array.from(genes), plan, form, kind, types: slots.map((x) => x.type), families, couple, overlap: g("overlap") < 0.75 ? "xor" : "or",
      mode: pickOf(["shift", "swell", "both"], g("mode")), rounds: 3 + Math.floor(g("rounds") * 3.999),
      // (Its distance in the structure's own size; the sun's bearing from in front of the structure, and its height, in radians.)
      view: { yaw: (g("yaw") - 0.5) * 1.1, pitch: -0.3 + g("pitch") * 0.9, dist: 1.5 + g("dist") * 1.5 },
      sun: { az: (g("sun") - 0.5) * 3.8, el: 0.55 + g("height") * 0.6 },
      frame: { fill: 0.72 + g("fill") * 0.2 },
      blur: 0.6 + g("blur") * 1.4,
      style: { hue: g("hue") * 360, harmony: pickOf(HARMONY_KEYS, g("harmony")), lift: g("lift") >= 0.5, light: pickOf(["paper", "paper", "paper", "neon", "neon"], g("light")), spill: g("spill") * 0.4, stroke: 0.7 + g("stroke") * 0.7 },
    };
  }
  const sigmaFor = (scene, W, H) => 6 * Math.min(W, H) / 390 * scene.blur;
  const randomGenes = (rng) => Array.from({ length: N }, () => rng());
  function gauss(rng) { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }
  /* (However many genes there are, a child has about seven and a half of its
   * numbers nudged, and three children in four have one choice made again - as
   * many changes as when the genome was 40 numbers: the more genes, the less
   * likely each one is to change, so a child stays near its parent.) */
  const CONTINUOUS = N - CHOICE.size, RATE = 7.75 / CONTINUOUS, CHOICE_RATE = 0.72 / CHOICE.size;
  function mutate(genes, rng, rate = RATE, size = 0.08) {
    const out = Array.from(genes);
    let changed = false;
    for (let i = 0; i < N; i++) {
      if (CHOICE.has(GENES[i])) { if (rng() < CHOICE_RATE) { out[i] = rng(); changed = true; } continue; }
      if (rng() < rate) { out[i] = Math.min(0.9999, Math.max(0, out[i] + gauss(rng) * size)); changed = true; }
    }
    // (Never the same painting twice: something always changes.)
    if (!changed) { const i = Math.floor(rng() * N); out[i] = CHOICE.has(GENES[i]) ? rng() : Math.min(0.9999, Math.max(0, out[i] + gauss(rng) * size)); }
    return out;
  }

  // A painting carried on: the same structure, view, framing and colours; its sims, their pushes, how and for how long, and how the glaze lies on each storey, changed a little.
  const DRIFTS = GENES.map((name, i) => [name, i]).filter(([name]) => /^s\d[a-f]$|^k\d\d$|^mode$|^rounds$|^slide$|^turn$|^vary$/.test(name)).map(([, i]) => i);
  function drift(genes, rng, size = 0.05) {
    const out = Array.from(genes);
    for (let t = 0; t < 4; t++) { const i = DRIFTS[Math.floor(rng() * DRIFTS.length)]; out[i] = CHOICE.has(GENES[i]) ? rng() : Math.min(0.9999, Math.max(0, out[i] + gauss(rng) * size)); }
    return out;
  }

  /* ── Its eye ────────────────────────────────────────────────────────────
   * From the reading (and how hard its sims pushed each other), before a
   * stroke is laid:
   * beats - how strongly the beats stand out (the spread of the reading);
   * structure - how many bands a line across the surface crosses, best at
   *   about five (ten crossings) and worse toward one band or a hundred;
   * composition - how much of the picture the structure fills (best near
   *   three tenths: pillars, gaps and arches leave paper between them), and
   *   where its weight sits (anywhere but jammed against an edge; the
   *   silhouette itself is always whole and centred);
   * interplay - how much its sims changed each other's bands from what
   *   each would make alone, on average over the surface (full marks at 0.15:
   *   a quarter of random paintings reach it). */
  function judge(R, read, scene) {
    const { W, H, cover } = R, beat = read.beat;
    let n = 0, sum = 0, sum2 = 0, wx = 0, wy = 0, ws = 0;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o++) if (cover[o]) {
      const b = beat[o], w = 0.3 + b;
      n++; sum += b; sum2 += b * b; wx += w * x; wy += w * y; ws += w;
    }
    if (n < W * H * 0.02) return { score: 0, parts: { beats: 0, structure: 0, composition: 0, interplay: 0 }, key: [scene.form, scene.kind, 0].join("·"), bands: 0, darkness: 0 };
    const mean = sum / n, spread = Math.sqrt(Math.max(0, sum2 / n - mean * mean)), f = n / (W * H);
    // (Bands crossed: along rows and columns a twenty-fourth of the picture apart, counting a crossing only once it is clear of the middle.)
    let crossings = 0, run = 0;
    const scan = (len, idx) => {
      let side = 0;
      for (let i = 0; i < len; i++) {
        const o = idx(i);
        if (!cover[o]) { side = 0; continue; }
        run++;
        const d = beat[o] - mean, s = d > 0.035 ? 1 : d < -0.035 ? -1 : 0;
        if (s && side && s !== side) crossings++;
        if (s) side = s;
      }
    };
    for (let k = 1; k < 24; k++) { const y = Math.floor(k * H / 24); scan(W, (i) => y * W + i); }
    for (let k = 1; k < 24; k++) { const x = Math.floor(k * W / 24); scan(H, (i) => i * W + x); }
    const bands = run ? crossings / run * Math.min(W, H) : 0;
    const cx = wx / ws / W, cy = wy / ws / H;
    const beats = Math.min(1, spread / 0.25);
    const structure = bands > 0 ? Math.exp(-Math.pow(Math.log(bands / 10), 2) / (2 * 0.7 * 0.7)) : 0;
    const fills = Math.exp(-Math.pow((f - 0.3) / 0.2, 2));
    const balance = Math.max(0, 1 - 2.5 * (Math.max(0, Math.abs(cx - 0.5) - 0.2) + Math.max(0, Math.abs(cy - 0.5) - 0.2)));
    const composition = 0.6 * fills + 0.4 * balance;
    const interplay = Math.min(1, (R.acting?.changed || 0) / 0.15);
    const score = 0.35 * beats + 0.2 * structure + 0.2 * composition + 0.25 * interplay;
    const bandBin = bands < 7 ? 0 : bands < 14 ? 1 : 2;
    return { score, parts: { beats, structure, composition, interplay }, key: [scene.form, scene.kind, bandBin].join("·"), bands, darkness: mean };
  }
  // One painting made and judged (no strokes): what the archive needs to know about it.
  function evaluate(genes, W, H) {
    const scene = decode(genes), sigma = sigmaFor(scene, W, H), R = M.raw(scene, W, H, sigma), read = M.reading(R, sigma);
    return { scene, R, read, ...judge(R, read, scene) };
  }

  /* ── The archive ─────────────────────────────────────────────────────── */
  const archive = () => ({ cells: {}, picked: [], made: 0 });
  // Offered a judged painting: kept if it is the best of its kind so far.
  function offer(arc, genes, judged) {
    arc.made++;
    const cell = arc.cells[judged.key];
    if (cell && cell.score >= judged.score) return false;
    arc.cells[judged.key] = { genes: Array.from(genes, (v) => Math.round(v * 1e4) / 1e4), score: Math.round(judged.score * 1e4) / 1e4, parts: Object.fromEntries(Object.entries(judged.parts).map(([k, v]) => [k, Math.round(v * 1e3) / 1e3])), made: arc.made };
    return true;
  }
  const quality = (arc) => Object.values(arc.cells).reduce((s, c) => s + c.score, 0);
  const best = (arc, k) => Object.values(arc.cells).sort((a, b) => b.score - a.score).slice(0, k);
  /* What to paint next: now and then a new try; otherwise a change to one it
   * keeps - one someone picked more often than its own eye would choose it;
   * otherwise any kind it keeps, or the better of three (so every kind gets
   * better, and the best kinds most); mostly a small change to a few numbers,
   * sometimes a bigger jump (to reach the kinds next to it). */
  const NEXT = { explore: 0.15, tournament: 0.5, rate: RATE, small: 0.08, big: 0.2, bigChance: 0.25, picked: 0.35 };
  function next(arc, rng, options = {}) {
    const o = { ...NEXT, ...options }, cells = Object.values(arc.cells);
    if (!cells.length || rng() < o.explore) return randomGenes(rng);
    const size = rng() < o.bigChance ? o.big : o.small;
    if (arc.picked.length && rng() < o.picked) return mutate(arc.picked[Math.floor(rng() * arc.picked.length)].genes, rng, o.rate, size);
    let parent = cells[Math.floor(rng() * cells.length)];
    if (rng() < o.tournament) for (let t = 0; t < 2; t++) { const c = cells[Math.floor(rng() * cells.length)]; if (c.score > parent.score) parent = c; }
    return mutate(parent.genes, rng, o.rate, size);
  }
  // Two archives as one (the shared one and this browser's own): the better of each kind, and every pick.
  function merge(into, from) {
    if (!from) return into;
    for (const [k, c] of Object.entries(from.cells || {})) if (Array.isArray(c.genes) && c.genes.length === N && (!into.cells[k] || into.cells[k].score < c.score)) into.cells[k] = c;
    for (const p of from.picked || []) if (Array.isArray(p.genes) && p.genes.length === N && !into.picked.some((q) => q.genes.join() === p.genes.join())) into.picked.push(p);
    into.made = Math.max(into.made, from.made || 0);
    return into;
  }

  global.HexfieldLearn = { GENES, TYPES, FORMS, SURFACE_KEYS, NEXT, decode, sigmaFor, randomGenes, mutate, drift, judge, evaluate, archive, offer, quality, best, next, merge };
})(typeof globalThis !== "undefined" ? globalThis : this);
