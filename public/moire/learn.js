/* How it learns what to paint, with nothing to press.
 *
 * A painting is a genome: 25 numbers between 0 and 1, read as which surface,
 * which kind of gratings (rings, trajectories, or one of each), the camera,
 * the gratings' spacings, turns and widths, how wide the reading blurs, the
 * framing, and where the painting sits in its colours. Its own eye scores
 * each painting on what this kind of painting needs - beats you can see,
 * bands neither too few nor too many, a picture that holds together - and an
 * archive keeps the best it has found of each kind of picture (surface ×
 * gratings × how many bands × how dark): most new paintings are a small change
 * to one of those, some are new tries. It gets better within each kind and
 * stays varied across them. Paintings someone has picked are kept apart and
 * bred from more often: picks count for more than its own eye. */
(function (global) {
  "use strict";
  const M = global.HexfieldMoire;
  const SURFACE_KEYS = Object.keys(M.SURFACES), KINDS = ["rings", "trajectories", "mixed"];
  const CONSTANTS = Object.values(M.IRRATIONAL), DENOMINATORS = [5, 6, 8, 10, 12];
  const GENES = ["surface", "kind", "yaw", "pitch", "dist", "count", "every", "constant", "denominator", "start", "duty",
    "radius", "centre", "multiple", "chords", "width", "overlap", "blur", "fill", "dx", "dy", "accent", "warmth", "spill", "stroke"];
  const N = GENES.length, gi = Object.fromEntries(GENES.map((g, i) => [g, i]));
  // (Genes read as a choice among a few, not a quantity: these change by being chosen again, not by being nudged.)
  const CHOICE = new Set(["surface", "kind", "constant", "denominator", "overlap", "multiple"]);
  const pickOf = (list, g) => list[Math.min(list.length - 1, Math.floor(g * list.length))];

  // A ratio near 1 that never comes out even: an irrational number over the nearest fraction to it.
  const nearOne = (c, q) => c / (Math.round(c * q) / q);
  function decode(genes) {
    const g = (name) => genes[gi[name]];
    const surface = pickOf(SURFACE_KEYS, g("surface")), kind = pickOf(KINDS, g("kind")), base = M.SURFACES[surface].view;
    const c = pickOf(CONSTANTS, g("constant")), ratio = nearOne(c, pickOf(DENOMINATORS, g("denominator")));
    const start = g("start") * 2 * Math.PI, every = 0.07 + g("every") * 0.18, duty = 0.3 + g("duty") * 0.4;
    const rings = (n) => Array.from({ length: n }, (_, k) => M.horocycles(start + k * M.GOLDEN_TURN, every * Math.pow(ratio, k), k * 0.37, duty));
    // (A billiard's circle: on the dome, the bell and the saddle near the middle of what shows; on the arch out toward its rim, which is where the arch shows the plane.)
    const radius = 0.9 + g("radius") * 1.8, centre = [surface === "arch" ? 1.6 + g("centre") * 1.4 : g("centre") * 1.2, surface === "arch" ? Math.PI / 2 : start];
    const turn = 2 * Math.PI * ((c * (1 + Math.floor(g("multiple") * 4))) % 1), chords = 60 + Math.floor(g("chords") * 120), width = 0.006 + g("width") * 0.03;
    const beam = (t, offset = 0) => M.billiard(centre, radius, t, chords, width, start + offset);
    const families = kind === "rings" ? rings(2 + Math.floor(g("count") * 1.999))
      : kind === "trajectories" ? [beam(turn), beam(turn * ratio, 0.3)]
        : [...rings(1), beam(turn)];
    return {
      genes: Array.from(genes), surface, kind, families, overlap: g("overlap") < 0.75 ? "xor" : "or",
      view: { yaw: base.yaw + (g("yaw") - 0.5) * 0.6, pitch: base.pitch + (g("pitch") - 0.5) * 0.4, dist: base.dist * (0.7 + g("dist") * 0.7) },
      frame: { fill: 0.7 + g("fill") * 0.55, dx: (g("dx") - 0.5) * 0.3, dy: (g("dy") - 0.5) * 0.3 },
      blur: 0.6 + g("blur") * 1.4,
      style: { accent: 0.82 + g("accent") * 0.15, warmth: g("warmth"), spill: g("spill") * 0.4, stroke: 0.7 + g("stroke") * 0.7 },
    };
  }
  const sigmaFor = (scene, W, H) => 6 * Math.min(W, H) / 390 * scene.blur;
  const randomGenes = (rng) => Array.from({ length: N }, () => rng());
  function gauss(rng) { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }
  function mutate(genes, rng, rate = 0.25, size = 0.08) {
    const out = Array.from(genes);
    let changed = false;
    for (let i = 0; i < N; i++) {
      if (CHOICE.has(GENES[i])) { if (rng() < 0.08) { out[i] = rng(); changed = true; } continue; }
      if (rng() < rate) { out[i] = Math.min(0.9999, Math.max(0, out[i] + gauss(rng) * size)); changed = true; }
    }
    // (Never the same painting twice: something always changes.)
    if (!changed) { const i = Math.floor(rng() * N); out[i] = CHOICE.has(GENES[i]) ? rng() : Math.min(0.9999, Math.max(0, out[i] + gauss(rng) * size)); }
    return out;
  }

  /* ── Its eye ────────────────────────────────────────────────────────────
   * From the reading, before a stroke is laid:
   * beats - how strongly the beats stand out (the spread of the reading);
   * structure - how many bands a line across the surface crosses, best at
   *   about five (ten crossings) and worse toward one band or a hundred;
   * composition - how much of the picture the surface fills (best near two
   *   fifths), where its weight sits (anywhere but jammed against an edge), and
   *   not too much of it cut off by the frame. */
  function judge(R, read, scene) {
    const { W, H, cover } = R, beat = read.beat;
    let n = 0, sum = 0, sum2 = 0, wx = 0, wy = 0, ws = 0;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o++) if (cover[o]) {
      const b = beat[o], w = 0.3 + b;
      n++; sum += b; sum2 += b * b; wx += w * x; wy += w * y; ws += w;
    }
    if (n < W * H * 0.02) return { score: 0, parts: { beats: 0, structure: 0, composition: 0 }, key: [scene.surface, scene.kind, 0, 0].join("·"), bands: 0, darkness: 0 };
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
    let edge = 0;
    for (let x = 0; x < W; x++) edge += cover[x] + cover[(H - 1) * W + x];
    for (let y = 0; y < H; y++) edge += cover[y * W] + cover[y * W + W - 1];
    const cx = wx / ws / W, cy = wy / ws / H, cut = edge / (2 * (W + H));
    const beats = Math.min(1, spread / 0.25);
    const structure = bands > 0 ? Math.exp(-Math.pow(Math.log(bands / 10), 2) / (2 * 0.7 * 0.7)) : 0;
    const fills = Math.exp(-Math.pow((f - 0.42) / 0.22, 2));
    const balance = Math.max(0, 1 - 2.5 * (Math.max(0, Math.abs(cx - 0.5) - 0.2) + Math.max(0, Math.abs(cy - 0.5) - 0.2)));
    const crop = Math.max(0, 1 - 2 * Math.max(0, cut - 0.25));
    const composition = 0.5 * fills + 0.3 * balance + 0.2 * crop;
    const score = 0.45 * beats + 0.3 * structure + 0.25 * composition;
    const bandBin = bands < 7 ? 0 : bands < 14 ? 1 : 2, darkBin = mean < 0.33 ? 0 : mean < 0.5 ? 1 : 2;
    return { score, parts: { beats, structure, composition }, key: [scene.surface, scene.kind, bandBin, darkBin].join("·"), bands, darkness: mean };
  }
  // One painting made and judged (no strokes): what the archive needs to know about it.
  function evaluate(genes, W, H) {
    const scene = decode(genes), R = M.raw(scene, W, H), read = M.reading(R, sigmaFor(scene, W, H));
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
  const NEXT = { explore: 0.15, tournament: 0.5, rate: 0.25, small: 0.08, big: 0.2, bigChance: 0.25, picked: 0.35 };
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

  global.HexfieldLearn = { GENES, KINDS, SURFACE_KEYS, NEXT, decode, sigmaFor, randomGenes, mutate, judge, evaluate, archive, offer, quality, best, next, merge };
})(typeof globalThis !== "undefined" ? globalThis : this);
