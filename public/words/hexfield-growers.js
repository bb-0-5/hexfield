/* Things grown by playing out their rules over time.
 * ---------------------------------------------------------------------------
 *
 * A drawn thing (words/hexfield-visual.js) is a copy of one idea of it; a
 * grower is the rules a thing arises by - how a fern's crown puts up fronds,
 * how each frond unrolls from a fiddlehead, lengthens, arches under its own
 * weight and yellows - and `grow` plays them out to a given day, so the same
 * rules give a young clump of fiddleheads, a full one, or an old one with
 * dead fronds lying round it. `judge` says how good an outcome is by the
 * rules of a good picture of it (a balanced clump, not a tangle, with life
 * in it), before anyone's taste; app.js ("Growers") breeds the rules in the
 * background, keeps the best outcomes in a library, and the painter drops
 * those in when the words name the thing.
 *
 * Every grower returns the visual dictionary's drawing format (fitted to a
 * unit box, far parts first), so a grown thing is painted, lit and laid out
 * like a written one.
 */
(function (global) {
  "use strict";

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const gauss = (rng) => (rng() + rng() + rng() - 1.5) / 0.5;
  const copy = (g) => JSON.parse(JSON.stringify(g));
  const GOLDEN = 2.39996;
  const v3 = {
    add: (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k],
    scale: (d, k) => [d[0] * k, d[1] * k, d[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; },
  };
  // v turned about the unit axis k by t (Rodrigues).
  const turnAbout = (v, k, t) => {
    const c = Math.cos(t), s = Math.sin(t), d = v3.dot(k, v), x = v3.cross(k, v);
    return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
  };
  const UP = [0, -1, 0];
  // A small seeded random, so a grown outcome is the same every time.
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── Rules as numbers ────────────────────────────────────────────────
   * Each grower lists its rules as [name, low, high, step, whole?] (bred by
   * nudging) and [name, options] (bred by switching), and the rules that
   * make a fresh one. */
  function seedFrom(spec, rng) {
    const g = { kind: spec.kind, seed: Math.floor(rng() * 4294967296) >>> 0 };
    for (const [name, lo, hi, , whole] of spec.numeric) {
      const v = lo + (hi - lo) * (0.2 + 0.6 * rng());
      g[name] = whole ? Math.round(v) : +v.toFixed(4);
    }
    for (const [name, options] of spec.choices) g[name] = options[Math.floor(rng() * options.length) % options.length];
    return g;
  }
  function mutateBy(spec, genes, rng, rate = 0.3) {
    const g = copy(genes);
    for (const [name, lo, hi, step, whole] of spec.numeric) {
      if (rng() > rate) continue;
      const v = clamp(Number(g[name]) + gauss(rng) * step, lo, hi);
      g[name] = whole ? Math.round(v) : +v.toFixed(4);
    }
    for (const [name, options] of spec.choices) if (rng() < rate * 0.3) g[name] = options[Math.floor(rng() * options.length) % options.length];
    // The chance in how it grows (which frond leans where) is a rule too:
    // now and then a new draw of it.
    if (rng() < rate * 0.5) g.seed = Math.floor(rng() * 4294967296) >>> 0;
    return g;
  }
  function crossBy(spec, a, b, rng) {
    const g = { kind: spec.kind, seed: (rng() < 0.5 ? a : b).seed };
    for (const [name] of spec.numeric) g[name] = (rng() < 0.5 ? a : b)[name];
    for (const [name] of spec.choices) g[name] = (rng() < 0.5 ? a : b)[name];
    return g;
  }
  function distanceBy(spec, a, b) {
    let d = 0, n = 0;
    for (const [name, lo, hi] of spec.numeric) { d += Math.abs(Number(a[name]) - Number(b[name])) / (hi - lo); n++; }
    for (const [name] of spec.choices) { d += a[name] === b[name] ? 0 : 1; n++; }
    return d / n;
  }

  /* ── Fern ─────────────────────────────────────────────────────────────
   * A crown at the ground puts up a frond every few days, each turned round
   * it by the golden angle. A frond comes up as a fiddlehead - its blade
   * rolled tight, tip inward - and unrolls from the base up while it
   * lengthens; its pinnae open behind the unrolling. Grown, it leans out
   * from the crown (the older the further) and arches under its weight.
   * After its life it yellows, then browns and lies down. A pinna is longest
   * where the blade's outline says (at the base for a triangular frond, in
   * the middle for a lance), angled toward the tip, toothed or lobed into
   * pinnules by its rules. */
  const FERN = {
    kind: "fern",
    numeric: [
      ["fronds", 4, 18, 2, true],       // fronds the crown puts up in its life
      ["interval", 0.5, 2.2, 0.25],     // days between them
      ["unroll", 2, 7, 0.6],            // days a fiddlehead takes to open
      ["mature", 3, 10, 0.8],           // days to full length
      ["life", 8, 30, 3],               // days a frond stays green
      ["length", 0.6, 1.4, 0.1],        // a grown frond's length
      ["stipe", 0.08, 0.35, 0.04],      // bare stalk below the blade
      ["spread", 0.15, 1.1, 0.12],      // how far grown fronds lean out
      ["droop", 0, 1.6, 0.18],          // the arch of a frond under its weight
      ["twist", -0.5, 0.5, 0.1],        // the blade turning along its length
      ["pinnae", 8, 28, 2, true],       // pinnae each side
      ["angle", 0.55, 1.35, 0.1],       // a pinna's angle from the rachis
      ["outline", 0, 1, 0.15],          // 0 triangular .. 1 lance
      ["reach", 0.18, 0.45, 0.04],      // longest pinna over the blade's length
      ["breadth", 0.12, 0.42, 0.04],    // a pinna's width over its length
      ["lobes", 0, 12, 2, true],        // pinnules (lobes) along a pinna
      ["cut", 0, 0.85, 0.12],           // how deep the lobes are cut
      ["curl", 5, 12, 1],               // how tight a fiddlehead is rolled
      ["hue", 78, 140, 7, true],
      ["sat", 28, 72, 6, true],
      ["light", 24, 50, 4, true],
      ["stem", 18, 70, 8, true],        // the stalk's hue
    ],
    choices: [["set", ["alternate", "opposite"]]],
    // A clump is best judged from a little above, and at its own age.
    lifespan: (g) => g.fronds * g.interval + g.life * 1.2,
    grow: growFern,
    judge: judgeFern,
  };

  function growFern(g, { age = null, yaw = 0, pitch = 0.18 } = {}) {
    const rng = seeded(g.seed ^ 0x6fe2);
    const day = Number.isFinite(age) ? age : g.fronds * g.interval * 0.8 + g.mature;
    const parts = [], stems = [];
    const facts = { fronds: 0, young: 0, old: 0, dead: 0, crossings: 0 };
    let budget = 1400;
    for (let i = 0; i < g.fronds && budget > 0; i++) {
      const born = i * g.interval * (0.75 + rng() * 0.5);
      const a = day - born;
      // (The draws are taken whatever happens, so a frond's chances do not
      // shift with the age it is seen at.)
      const jitterA = (rng() - 0.5) * 0.6, jitterL = 0.8 + rng() * 0.4, jitterLean = 0.85 + rng() * 0.3;
      if (a <= 0) continue;
      const grown = smooth(a / g.mature), opened = clamp(a / g.unroll, 0, 1);
      const old = clamp((a - g.life) / (g.life * 0.5), 0, 1.5);
      if (old >= 1.4) continue;           // gone
      facts.fronds++;
      if (opened < 0.85) facts.young++;
      if (old > 0.2) facts.old++;
      if (old >= 1) facts.dead++;
      const theta = i * GOLDEN + jitterA;
      const out = [Math.cos(theta), 0, Math.sin(theta)];
      const L = g.length * jitterL * (0.18 + 0.82 * grown);
      // Upright as it comes up, leaning out as it grows; flopping as it dies.
      let phi = (0.08 + g.spread * jitterLean * (0.25 + 0.75 * grown)) + old * 0.9;
      const side = v3.norm(v3.cross(out, UP));     // across the frond's plane
      const segs = 22, ds = L / segs;
      const open = opened * L;                      // unrolled length from the base
      let p = [Math.cos(theta) * 0.02, 0, Math.sin(theta) * 0.02];
      const spine = [{ p, t: v3.norm(v3.add(v3.scale(out, Math.sin(phi)), UP, Math.cos(phi))), s: 0 }];
      for (let k = 1; k <= segs; k++) {
        const s = k * ds;
        // Unrolled: arching outward with the weight beyond; rolled: curling
        // in toward the crown, tighter toward the tip.
        const kappa = s <= open ? g.droop * (0.4 + 0.6 * grown) * (s / Math.max(0.2, L)) * (1 + old)
          : -g.curl / Math.max(0.3, L) * (0.6 + 0.8 * (s - open) / Math.max(1e-3, L - open));
        phi += kappa * ds;
        // Lying on the ground at most (a frond does not dig in).
        if (phi > Math.PI * 0.55 && s <= open) phi = Math.PI * 0.55;
        const t = v3.norm(v3.add(v3.scale(out, Math.sin(phi)), UP, Math.cos(phi)));
        p = v3.add(p, t, ds);
        if (p[1] > 0 && s <= open) p[1] = 0;
        spine.push({ p, t, s });
      }
      const tone = old > 0 ? "old" : opened < 0.6 ? "young" : "leaf";
      const stalkColour = old > 0.5 ? "old" : "stem";
      const width = 0.012 + 0.012 * grown;
      // The bare stalk in its own colour; up the blade the rachis is the
      // leaf's, a shade darker.
      const blade0 = g.stipe * L, bladeLen = L - blade0;
      const cut = Math.max(1, Math.min(spine.length - 2, Math.round(blade0 / ds)));
      parts.push({ line: spine.slice(0, cut + 1).map((n) => n.p), width, colour: stalkColour, tone: old > 1 ? -0.15 : 0 });
      parts.push({ line: spine.slice(cut).map((n) => n.p), width: width * 0.7, colour: tone, tone: -0.18 });
      stems.push(spine.map((n) => n.p));
      budget -= 2;
      // The pinnae, along the blade above the stalk.
      const n = Math.max(3, Math.round(g.pinnae * (0.5 + 0.5 * grown)));
      for (let j = 0; j < n && budget > 0; j++) {
        for (const sideSign of [-1, 1]) {
          const u = (j + (g.set === "alternate" && sideSign > 0 ? 0.5 : 0)) / n;   // 0 base .. 1 tip
          const s = blade0 + u * bladeLen;
          const at = spineAt(spine, s, ds);
          const rolled = s > open;
          // A pinna's length by the blade's outline, tapering to the tip.
          const tri = Math.pow(1 - u, 0.75), lance = Math.sin(Math.PI * clamp(u * 0.92 + 0.06, 0, 1));
          const shape = (1 - g.outline) * tri + g.outline * lance;
          // Opening behind the unrolling.
          const expand = rolled ? 0.12 : 0.25 + 0.75 * smooth((open - s) / Math.max(0.05, L * 0.35));
          const len = bladeLen * g.reach * shape * expand * (0.9 + rng() * 0.2);
          if (len < 0.006) continue;
          // The blade turns along its length.
          const twist = g.twist * (s / Math.max(0.2, L)) * Math.PI;
          const across = turnAbout(side, at.t, twist);
          const ang = rolled ? 0.3 : g.angle * (0.8 + 0.3 * u);
          let dir = v3.norm(v3.add(v3.scale(at.t, Math.cos(ang)), across, sideSign * Math.sin(ang)));
          // Pinnae hang a little with their weight.
          dir = v3.norm(v3.add(dir, UP, -0.15 - 0.2 * old));
          const normal = v3.norm(v3.cross(dir, at.t));
          const wide = v3.norm(v3.cross(normal, dir));
          parts.push({ poly: pinnaOutline(at.p, dir, wide, len, g), colour: tone, tone: (rng() - 0.5) * 0.06 + (old > 1 ? -0.12 : 0), leaf: true });
          budget--;
        }
      }
    }
    // The crown: a dark knot at the foot.
    parts.push({ dot: [0, 0, 0], r: 0.025, colour: "stem", tone: -0.25 });
    facts.crossings = crossingsOf(stems, yaw, pitch);
    return seen(g, parts, stems, { yaw, pitch, age: day, facts });
  }

  // Where along the spine arc-length s falls: point and tangent.
  function spineAt(spine, s, ds) {
    const f = clamp(s / ds, 0, spine.length - 1.001), k = Math.floor(f), t = f - k;
    const a = spine[k], b = spine[k + 1];
    return { p: [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t, a.p[2] + (b.p[2] - a.p[2]) * t], t: b.t };
  }

  /* A pinna from its base along `dir`: an almond, its edge cut into lobes
   * (pinnules) as deep as the rules say. */
  function pinnaOutline(base, dir, wide, len, g) {
    const w = len * g.breadth, steps = Math.max(6, Math.min(26, 6 + g.lobes * 2)), pts = [];
    for (const sideSign of [-1, 1]) {
      const run = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        let r = Math.sin(Math.PI * Math.pow(u, 0.8)) * w * 0.5;
        if (g.lobes) r *= 1 - g.cut * 0.5 * (1 - Math.abs(Math.cos(Math.PI * g.lobes * u)));
        run.push(v3.add(v3.add(base, dir, u * len), wide, sideSign * r));
      }
      if (sideSign > 0) run.reverse();
      pts.push(...run);
    }
    return pts;
  }

  // How many frond stalks cross another, as seen: a tangle reads badly.
  function crossingsOf(stems, yaw, pitch) {
    const flat = stems.map((pts) => pts.filter((_, i) => i % 3 === 0).map((p) => project(p, yaw, pitch, 0)));
    const cross = (a, b, c, d) => {
      const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
      return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
    };
    let n = 0;
    for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) {
      // (Not where they leave the crown together.)
      for (let a = 1; a < flat[i].length - 1; a++) for (let b = 1; b < flat[j].length - 1; b++) {
        if (cross(flat[i][a], flat[i][a + 1], flat[j][b], flat[j][b + 1])) n++;
      }
    }
    return n;
  }

  function project([x, y, z], yaw, pitch, shear) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    const y1 = y * cp - z1 * sp;
    return [x1, y1 + x1 * shear, y * sp + z1 * cp];
  }

  /* Seen from the angle, farther parts first, fitted to a unit box, with
   * its stalks as anatomy for a brush that follows them. */
  function seen(g, parts, stems, { yaw, pitch, age, facts }) {
    const items = parts.map((part) => {
      if (part.line) { const pts = part.line.map((p) => project(p, yaw, pitch, 0)); return { line: pts, width: part.width, colour: part.colour, tone: part.tone, depth: pts.reduce((s, q) => s + q[2], 0) / pts.length }; }
      if (part.poly) { const pts = part.poly.map((p) => project(p, yaw, pitch, 0)); return { poly: pts, colour: part.colour, tone: part.tone, depth: pts.reduce((s, q) => s + q[2], 0) / pts.length }; }
      const q = project(part.dot, yaw, pitch, 0);
      return { dot: [q[0], q[1], part.r], colour: part.colour, tone: part.tone, depth: q[2] - part.r };
    }).sort((p, q) => q.depth - p.depth);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const it of items) {
      if (it.line) it.line.forEach(([x, y]) => take(x, y, it.width / 2));
      else if (it.poly) it.poly.forEach(([x, y]) => take(x, y));
      else take(it.dot[0], it.dot[1], it.dot[2]);
    }
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = ([x, y]) => [r4((x - x0) / bw), r4((y - y0) / bh)];
    const out = items.map((it) => {
      if (it.line) return { shape: "line", pts: it.line.map(U), width: r4(it.width / bw), colour: it.colour, tone: it.tone || 0 };
      if (it.poly) return { shape: "poly", smooth: true, pts: it.poly.map(U), colour: it.colour, tone: it.tone || 0 };
      const [cx, cy, r] = it.dot;
      return { shape: "ellipse", box: [r4((cx - r - x0) / bw), r4((cy - r - y0) / bh), r4(2 * r / bw), r4(2 * r / bh)], colour: it.colour, tone: it.tone || 0 };
    });
    const anatomy = stems.flatMap((pts) => pts.slice(1).filter((_, i) => i % 2 === 0).map((q, i) => ({
      k: "stem", a: U(project(pts[i * 2], yaw, pitch, 0)), b: U(project(q, yaw, pitch, 0)), r: r4(0.01 / bw) })));
    // Where its weight sits across the box (0 left .. 1 right), for the judge.
    let mass = 0, mx = 0;
    for (const it of out) if (it.shape === "poly") for (const [x] of it.pts) { mx += x; mass++; }
    facts.balance = mass ? mx / mass : 0.5;
    facts.crown = r4((0 - x0) / bw);
    facts.aspect = bw / bh;
    // Its real extent, for setting it among others at its true size.
    facts.span = [r4(bw), r4(bh)];
    return {
      kind: "subject", anchor: "ground", size: clamp(0.22 + 0.14 * g.length, 0.15, 0.5),
      aspect: clamp(bw / bh, 0.3, 4), depth: 0.5,
      colours: {
        leaf: [g.hue, g.sat, g.light], young: [g.hue - 18, clamp(g.sat + 8, 0, 90), clamp(g.light + 12, 0, 80)],
        old: [40, 48, 48], stem: [g.stem, clamp(g.sat - 12, 12, 70), clamp(g.light - 8, 14, 50)],
      },
      parts: out, grown: true, plant: true, anatomy, grower: g.kind, age: r4(age), yaw, pitch, facts,
    };
  }

  /* A good fern clump, as a picture: enough fronds to read as a clump, its
   * weight over its crown without being a stamp of symmetry, wider than tall
   * but not a flat mat, a fiddlehead or two for life, few dead, and not a
   * tangle of crossing stalks. 0..1, with the reasons. */
  function judgeFern(entry) {
    const f = entry.facts || {};
    const band = (v, lo, hi, soft) => v < lo ? Math.max(0, 1 - (lo - v) / soft) : v > hi ? Math.max(0, 1 - (v - hi) / soft) : 1;
    const off = Math.abs((f.balance ?? 0.5) - (f.crown ?? 0.5));
    const reasons = {
      fullness: band(f.fronds || 0, 6, 13, 5),
      balance: band(off, 0.015, 0.1, 0.12),
      shape: band(f.aspect || 1, 1.1, 2.4, 1),
      life: f.young ? Math.min(1, 0.7 + 0.3 * f.young / 2) : 0.6,
      decay: Math.max(0, 1 - (f.dead || 0) / Math.max(1, f.fronds) * 2.5),
      clarity: Math.max(0, 1 - (f.crossings || 0) / (6 + 2 * (f.fronds || 0))),
    };
    reasons.green = Math.max(0, 1 - 0.8 * (f.old || 0) / Math.max(1, f.fronds));
    const weights = { fullness: 1, balance: 1, shape: 0.8, life: 0.5, decay: 0.8, clarity: 1.2, green: 0.6 };
    // Every rule must hold: one badly broken spoils the rest (a weighted
    // geometric mean, not an average).
    let s = 0, w = 0;
    for (const k in weights) { s += Math.log(Math.max(0.05, reasons[k])) * weights[k]; w += weights[k]; }
    return { score: Math.exp(s / w), reasons };
  }

  /* ── Patches: things grown together ──────────────────────────────────
   * A scene sim: a few founders on a plot of ground - each one of the
   * kind's kept outcomes (their rules) - grow side by side for weeks. A
   * grown one spreads by its rhizome, putting up a young one a step away;
   * a taller neighbour shades a smaller one, which loses vigour and stays
   * small or dies; a gap is filled by whoever spreads into it. Snapshots of
   * the whole patch along the way are judged as a grouping - a clear
   * largest, sizes stepping down, uneven spacing, overlapping but not one
   * blob, a broken top line - and the best is kept as one composition,
   * drawn as one thing: the painter drops a whole stand of ferns in at once. */
  const PATCH = {
    kind: "patch",
    numeric: [
      ["founders", 1, 4, 1, true],      // crowns it starts from
      ["clones", 0, 1, 0.2],            // how often a founder is the same rules as another
      ["spread", 0.12, 0.4, 0.04],      // a rhizome's step, across the plot
      ["recruit", 0.02, 0.12, 0.015],   // chance a day a grown one puts up a young one
      ["shade", 0.2, 1.4, 0.15],        // how hard shade weakens the shaded
      ["days", 25, 90, 8, true],        // how long it is played out
      ["depth", 0.15, 0.45, 0.05],      // how far back the plot runs
      ["width", 1, 2.4, 0.2],           // how wide it is
    ],
    choices: [],
  };
  const PATCH_CAP = 9;

  /* Played out. `pool` is the kept outcomes it may be grown from: { genes,
   * age (its best day), aspect, judge }. Returns snapshots along the way:
   * [{ day, members: [{ x, z, pick, born, vigour, yaw }] }]. */
  function simulatePatch(p, pool, rng = seeded(p.seed ^ 0x9a7c)) {
    if (!pool.length) return [];
    const members = [];
    const picks = [];
    for (let f = 0; f < p.founders; f++) {
      picks.push(f && rng() < p.clones ? picks[Math.floor(rng() * picks.length)] : Math.floor(rng() * pool.length));
      members.push({ x: (rng() - 0.5) * p.width * 0.6, z: rng() * p.depth, pick: picks[f], born: -rng() * 6 - (f ? 0 : 8), vigour: 1, yaw: rng() * Math.PI * 2 });
    }
    const height = (m, day) => {
      const o = pool[m.pick], a = day - m.born;
      return o.genes.length * (0.35 + 0.65 * smooth(a / Math.max(4, o.age))) * (0.55 + 0.45 * m.vigour);
    };
    const snaps = [];
    const every = Math.max(3, Math.round(p.days / 8));
    for (let day = 0; day <= p.days; day++) {
      // Light: shaded by every taller neighbour near enough to overlap.
      for (const m of members) {
        const h = height(m, day);
        let shade = 0;
        for (const n of members) {
          if (n === m) continue;
          const hn = height(n, day), reach = (h + hn) * 0.35;
          const d = Math.hypot(m.x - n.x, (m.z - n.z) * 2);
          if (hn > h && d < reach) shade += (hn - h) / hn * (1 - d / reach);
        }
        m.vigour = clamp(m.vigour + 0.04 - p.shade * 0.12 * shade, 0, 1);
      }
      for (let i = members.length - 1; i >= 0; i--) if (members[i].vigour <= 0 && day - members[i].born > 3) members.splice(i, 1);
      // Spreading into the room left.
      for (const m of members.slice()) {
        if (members.length >= PATCH_CAP || day - m.born < pool[m.pick].age * 0.5 || rng() > p.recruit * m.vigour) continue;
        const a = rng() * Math.PI * 2, r = p.spread * (0.6 + rng() * 0.8);
        const x = clamp(m.x + Math.cos(a) * r, -p.width / 2, p.width / 2), z = clamp(m.z + Math.sin(a) * r * 0.5, 0, p.depth);
        if (members.some((n) => Math.hypot(n.x - x, (n.z - z) * 2) < p.spread * 0.4)) continue;
        members.push({ x, z, pick: m.pick, born: day, vigour: 0.8, yaw: rng() * Math.PI * 2 });
      }
      if (day >= every && day % every === 0 || day === p.days) {
        snaps.push({ day, members: members.map((m) => ({ ...m, h: +height(m, day).toFixed(4) })) });
      }
    }
    return snaps;
  }

  // Where each member stands in the picture: farther back is higher and smaller.
  function patchPlaces(snap, pool, p) {
    return snap.members.map((m) => {
      const k = 1 - 0.4 * m.z / 0.45;
      const h = m.h * k, w = h * (pool[m.pick].aspect || 1.5);
      return { m, k, cx: m.x * k, foot: -m.z * 0.6, w, h };
    }).filter((s) => s.h > 0.05);
  }

  /* A grouping, judged as a picture: 0..1 with the reasons. */
  function judgePatch(snap, pool, p) {
    const places = patchPlaces(snap, pool, p);
    const n = places.length;
    const band = (v, lo, hi, soft) => v < lo ? Math.max(0, 1 - (lo - v) / soft) : v > hi ? Math.max(0, 1 - (v - hi) / soft) : 1;
    if (!n) return { score: 0, reasons: {} };
    const hs = places.map((s) => s.h).sort((a, b) => b - a);
    const mean = hs.reduce((a, b) => a + b, 0) / n;
    const cv = Math.sqrt(hs.reduce((a, h) => a + (h - mean) ** 2, 0) / n) / mean;
    const xs = places.map((s) => s.cx).sort((a, b) => a - b);
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    const gm = gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length);
    const gcv = gaps.length > 1 ? Math.sqrt(gaps.reduce((a, g) => a + (g - gm) ** 2, 0) / gaps.length) / Math.max(1e-3, gm) : 0.5;
    let overlapping = 0;
    for (const s of places) if (places.some((t) => t !== s && Math.abs(t.cx - s.cx) < (t.w + s.w) * 0.3)) overlapping++;
    const left = Math.min(...places.map((s) => s.cx - s.w / 2)), right = Math.max(...places.map((s) => s.cx + s.w / 2));
    const top = Math.max(...places.map((s) => s.h - s.foot));
    const reasons = {
      count: band(n, 3, 7, 3) * (n % 2 ? 1 : 0.92),
      dominant: n > 1 ? band(hs[0] / hs[1], 1.12, 1.9, 0.6) : 0.5,
      steps: band(cv, 0.18, 0.55, 0.3),
      spacing: band(gcv, 0.3, 1, 0.4),
      grouped: band(overlapping / n, 0.35, 0.9, 0.4),
      shape: band((right - left) / Math.max(0.05, top), 1.4, 3.6, 1.2),
      members: places.reduce((a, s) => a + (pool[s.m.pick].judge || 0.5), 0) / n,
    };
    const weights = { count: 1, dominant: 1, steps: 0.8, spacing: 0.8, grouped: 1, shape: 0.6, members: 0.8 };
    let s = 0, w = 0;
    for (const k in weights) { s += Math.log(Math.max(0.05, reasons[k])) * weights[k]; w += weights[k]; }
    return { score: Math.exp(s / w), reasons };
  }

  /* The patch drawn as one thing: each member grown (its rules, at an age
   * by how long it has stood, as large as its vigour let it), set at its
   * place, farther ones first, and the whole fitted to a unit box. Each
   * member's rules keep their own colours (leaf, leaf~1, ...). */
  function drawPatch(snap, pool, p, pitch = 0.2) {
    const places = patchPlaces(snap, pool, p).sort((a, b) => b.m.z - a.m.z);
    const parts = [], colours = {}, anatomy = [];
    const boxes = [];
    for (const s of places) {
      const o = pool[s.m.pick], a = snap.day - s.m.born;
      const age = o.age * clamp(a / Math.max(4, o.age), 0.15, 1);
      const e = GROWERS[o.genes.kind].grow(o.genes, { age, yaw: s.m.yaw, pitch });
      const suffix = s.m.pick ? "~" + s.m.pick : "";
      for (const [name, c] of Object.entries(e.colours)) colours[name + suffix] = c;
      // Shaded and far: a little darker and duller.
      const dim = -0.12 * (1 - s.m.vigour) - 0.08 * s.m.z / Math.max(0.01, p.depth);
      // At its true grown size (smaller for vigour lost and for distance),
      // its crown on its place.
      const k = s.k * (0.6 + 0.4 * s.m.vigour), span = e.facts?.span || [s.w, s.h];
      const w = span[0] * k, h = span[1] * k;
      const x0 = s.cx - (e.facts?.crown ?? 0.5) * w, y0 = s.foot - h;
      boxes.push({ x0, y0, w, h });
      for (const part of e.parts) parts.push({ part, x0, y0, w, h, suffix, dim });
      for (const an of e.anatomy || []) anatomy.push({ an, x0, y0, w, h });
    }
    if (!boxes.length) return null;
    const X0 = Math.min(...boxes.map((b) => b.x0)), X1 = Math.max(...boxes.map((b) => b.x0 + b.w));
    // (y up is negative: the plot's front edge is at 0.)
    const Y0 = Math.min(...boxes.map((b) => b.y0)), Y1 = Math.max(...boxes.map((b) => b.y0 + b.h));
    const BW = Math.max(1e-3, X1 - X0), BH = Math.max(1e-3, Y1 - Y0);
    const r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = (q, pt) => [r4((q.x0 + pt[0] * q.w - X0) / BW), r4((q.y0 + pt[1] * q.h - Y0) / BH)];
    const out = parts.map((q) => {
      const part = q.part, colour = part.colour + q.suffix, tone = (part.tone || 0) + q.dim;
      if (part.shape === "line") return { shape: "line", pts: part.pts.map((pt) => U(q, pt)), width: r4(part.width * q.w / BW), colour, tone };
      if (part.shape === "poly") return { shape: "poly", smooth: true, pts: part.pts.map((pt) => U(q, pt)), colour, tone };
      const [bx, by, bw, bh] = part.box, at = U(q, [bx, by]);
      return { shape: "ellipse", box: [at[0], at[1], r4(bw * q.w / BW), r4(bh * q.h / BH)], colour, tone };
    });
    const first = Object.keys(colours).filter((k) => !k.includes("~"));
    const ordered = {};
    for (const k of ["leaf", ...first, ...Object.keys(colours)]) if (colours[k] && !ordered[k]) ordered[k] = colours[k];
    return {
      kind: "subject", anchor: "ground", size: clamp(0.3 + 0.12 * p.width, 0.3, 0.6), aspect: clamp(BW / BH, 0.6, 5), depth: 0.6,
      colours: ordered, parts: out, grown: true, plant: true, grower: "patch", members: places.length, day: snap.day,
      anatomy: anatomy.map(({ an, ...q }) => ({ k: an.k, a: U(q, an.a), b: U(q, an.b), r: r4(an.r * q.w / BW) })),
    };
  }

  /* ── The growers ───────────────────────────────────────────────────── */
  const GROWERS = { fern: FERN };
  // The words that name a grower's thing.
  // (Plurals are read as plurals by the dictionary: "ferns" is a few.)
  const WORDS = { fern: "fern", bracken: "fern", undergrowth: "fern", fernery: "fern", frond: "fern", fiddlehead: "fern" };

  function seed(kind, rng) { return seedFrom(GROWERS[kind], rng); }
  function mutate(genes, rng, rate) { return mutateBy(GROWERS[genes.kind], genes, rng, rate); }
  function crossover(a, b, rng) { return crossBy(GROWERS[a.kind], a, b, rng); }
  function distance(a, b) { return a.kind === b.kind ? distanceBy(GROWERS[a.kind], a, b) : 1; }
  function grow(genes, view) { return GROWERS[genes.kind].grow(genes, view); }
  function judge(entry) { return GROWERS[entry.grower]?.judge(entry) || { score: 0.5, reasons: {} }; }
  function lifespan(genes) { return GROWERS[genes.kind].lifespan(genes); }
  const kindOfWord = (word) => WORDS[String(word || "").toLowerCase()] || null;
  // Words for many grown together: a patch of the kind, not separate ones.
  const MASS = { bracken: "fern", undergrowth: "fern", fernery: "fern" };
  const patches = {
    seed: (rng) => seedFrom(PATCH, rng), mutate: (g, rng, rate) => mutateBy(PATCH, g, rng, rate),
    crossover: (a, b, rng) => crossBy(PATCH, a, b, rng), distance: (a, b) => distanceBy(PATCH, a, b),
    simulate: simulatePatch, judge: judgePatch, draw: drawPatch,
  };

  global.HexfieldGrowers = { GROWERS, WORDS, MASS, kindOfWord, seed, mutate, crossover, distance, grow, judge, lifespan, patches };
})(typeof window !== "undefined" ? window : globalThis);
