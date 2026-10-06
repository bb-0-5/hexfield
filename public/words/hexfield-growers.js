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

  /* ── Tree ─────────────────────────────────────────────────────────────
   * A tree grows toward light and room: each year its crown's room widens
   * (the shape its kind keeps - round, oval, a cone, spreading, a column,
   * weeping) and fills with open air the shoots can reach; every shoot tip
   * near open air grows a step toward it (with a pull up or down and a
   * little wander), and air a shoot reaches is taken. As the crown rises the
   * shaded lower limbs are shed, so an old tree has a clear trunk. A limb is
   * as thick as all the twigs it carries (the pipe rule), and leaves cluster
   * at the twigs - thinner where the crown is open, so sky shows through. */
  const CROWNS = ["round", "oval", "cone", "spread", "column", "weep"];
  const TREE = {
    kind: "tree",
    numeric: [
      ["years", 8, 40, 4, true],        // how long it takes to come to its full size
      ["width", 0.45, 1.3, 0.1],        // crown width over height
      ["clear", 0.12, 0.45, 0.05],      // clear trunk under the crown, grown
      ["air", 160, 420, 40, true],      // open air the crown holds
      ["reach", 0.12, 0.3, 0.03],       // how far a shoot feels open air
      ["step", 0.025, 0.05, 0.005],     // a year's shoot
      ["rise", -0.6, 0.6, 0.12],        // pull up (+) or down (-, weeping)
      ["wander", 0, 0.6, 0.1],          // how crooked
      ["lean", -0.2, 0.2, 0.05],        // windswept
      ["leaf", 0.025, 0.06, 0.006],     // a leaf cluster's size
      ["foliage", 0.35, 1, 0.1],        // how thick the leaves
      ["hue", 70, 135, 8, true], ["sat", 25, 65, 6, true], ["light", 22, 42, 4, true],
      ["bark", 15, 40, 5, true], ["barkLight", 14, 40, 5, true],
    ],
    choices: [["crown", CROWNS]],
    lifespan: (g) => g.years * 1.6,
    grow: growTree,
    judge: judgeTree,
    manyAtOnce: true,
    rooms: true,
  };

  // Inside the crown's room? (x, z across, y up from the crown's foot; 0..1 of its height.)
  function inCrown(crown, x, y, z, w) {
    const r = Math.hypot(x, z) / (w / 2);
    switch (crown) {
      case "cone": return y >= 0 && y <= 1 && r <= (1 - y) * 1.05;
      case "column": return y >= 0 && y <= 1 && r <= 0.55 * Math.sin(Math.PI * Math.min(1, y * 1.1 + 0.05));
      case "spread": { const t = (y - 0.45) / 0.55; return y >= 0 && r * r + t * t * 1.4 <= 1; }
      case "oval": { const t = (y - 0.5) / 0.5; return r * r + t * t <= 1; }
      case "weep": { const t = (y - 0.55) / 0.45; return y >= -0.25 && (r * r + t * t <= 1 || (r <= 1 && y < 0.55)); }
      default: { const t = (y - 0.5) / 0.5; return r * r + t * t <= 1; }
    }
  }

  /* (With `at`, a list of { age, yaw, pitch } in rising age, one run of
   * the years gives the tree at each of them - the same as growing it to
   * each age alone.) */
  /* (With `room` - a mask of the shape it is to grow into, { mask, mw, mh,
   * aspect }, row 0 at the top, as tall as the tree - the open air is found
   * only inside that shape, and the trunk rises from its foot: the tree
   * takes the shape it was given, a mass on a sprayed canvas say.) */
  function roomOf(room) {
    const { mask, mw, mh } = room, widths = new Float32Array(mh), cells = [];
    let widest = 0, footU = 0, footN = 0;
    for (let v = 0; v < mh; v++) {
      let n = 0;
      for (let u = 0; u < mw; u++) if (mask[v * mw + u]) { n++; cells.push([u, v]); if (v >= mh * 0.85) { footU += u; footN++; } }
      widths[v] = n / mw; widest = Math.max(widest, widths[v]);
    }
    // The crown's foot: the lowest row still a good share of the widest.
    let foot = mh - 1;
    while (foot > 0 && widths[foot] < widest * 0.4) foot--;
    return { cells, widths, root: footN ? (footU / footN + 0.5) / mw : 0.5, base: Math.max(0.12, Math.min(0.6, 1 - (foot + 1) / mh)) };
  }
  function growTree(g, { age = null, yaw = 0, pitch = 0.08, at = null, room = null } = {}) {
    const rng = seeded(g.seed ^ 0x7ee5);
    const views = at || [{ age: Number.isFinite(age) ? age : g.years, yaw, pitch }];
    const years = Math.max(...views.map((v) => v.age));
    const seen = [];
    let next = 0;
    const R = room?.mask && room.mw && room.mh ? { ...room, ...roomOf(room) } : null;
    if (R && !R.cells.length) return growTree(g, { age, yaw, pitch, at });
    const rootX = R ? (R.root - 0.5) * R.aspect : 0;
    const nodes = [{ p: [rootX, 0, 0], parent: -1, kids: 0, born: 0 }];
    let air = [];
    const H = 1;
    let top = 0;
    const grid = new Map(), cell = g.reach;
    // (Cells by number, not by string: this is the inner loop.)
    const cellKey = (cx, cy, cz) => ((cx + 512) * 1024 + (cy + 512)) * 1024 + (cz + 512);
    const key = (p) => cellKey(Math.floor(p[0] / cell), Math.floor(p[1] / cell), Math.floor(p[2] / cell));
    const index = (i) => { const k = key(nodes[i].p); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); };
    index(0);
    const add = (parent, p, year) => { nodes.push({ p, parent, kids: 0, born: year }); nodes[parent].kids++; index(nodes.length - 1); return nodes.length - 1; };
    const lean = [g.lean, 0, 0];
    let budget = 1100;
    for (let year = 1; year <= Math.ceil(years) && budget > 0; year++) {
      const grown = smooth(year / g.years);
      const h = R ? H : H * (0.12 + 0.88 * grown);
      const base = R ? R.base : h * g.clear * (0.3 + 0.7 * grown);           // the crown's foot rises as it grows
      const crownH = h - base, crownW = crownH * g.width * (g.crown === "spread" ? 1.4 : 1);
      // The leader climbs to the crown.
      while (top < nodes.length && -nodes[top].p[1] < base + crownH * 0.25 && budget > 0) {
        const q = nodes[top].p;
        top = add(top, [q[0] + lean[0] * g.step * 2 + (rng() - 0.5) * g.wander * 0.02, q[1] - g.step * 1.5, q[2] + (rng() - 0.5) * g.wander * 0.02], year);
        budget--;
      }
      // Open air in this year's room.
      const want = Math.round(g.air * (0.25 + 0.75 * grown));
      for (let tries = 0; air.length < want && tries < want * 8; tries++) {
        if (R) {
          // Inside the shape it was given, above its foot; as deep as it is wide there.
          const [u, v] = R.cells[Math.floor(rng() * R.cells.length)];
          const up = 1 - (v + rng()) / R.mh;
          if (up < base * 0.9) continue;
          const half = R.widths[Math.min(R.mh - 1, v)] * R.aspect / 2;
          air.push([((u + rng()) / R.mw - 0.5) * R.aspect, -up, (rng() * 2 - 1) * half * 0.6]);
          continue;
        }
        const x = (rng() * 2 - 1) * crownW / 2, y = rng() * 1.3 - 0.3, z = (rng() * 2 - 1) * crownW / 2;
        if (inCrown(g.crown, x, y, z, crownW)) air.push([x + lean[0] * (base + y * crownH), -(base + y * crownH), z]);
      }
      // Shoots grow toward the air near them.
      for (let it = 0; it < 5 && budget > 0; it++) {
        const pull = new Map();
        const keep = [];
        for (const a of air) {
          const cx = Math.floor(a[0] / cell), cy = Math.floor(a[1] / cell), cz = Math.floor(a[2] / cell);
          let best = -1, bd = g.reach;
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
            const list = grid.get(cellKey(cx + dx, cy + dy, cz + dz));
            if (!list) continue;
            for (const i of list) { const p = nodes[i].p, d = Math.hypot(a[0] - p[0], a[1] - p[1], a[2] - p[2]); if (d < bd) { bd = d; best = i; } }
          }
          if (bd < g.step * 1.6) continue;                    // reached: taken
          keep.push(a);
          if (best < 0) continue;
          const p = nodes[best].p, d = v3.norm([a[0] - p[0], a[1] - p[1], a[2] - p[2]]);
          const s = pull.get(best) || [0, 0, 0];
          pull.set(best, [s[0] + d[0], s[1] + d[1], s[2] + d[2]]);
        }
        air = keep;
        if (!pull.size) break;
        for (const [i, s] of pull) {
          if (budget <= 0) break;
          const d = v3.norm(v3.add(v3.add(v3.norm(s), UP, g.rise * 0.5), [(rng() - 0.5) * g.wander, (rng() - 0.5) * g.wander * 0.5, (rng() - 0.5) * g.wander]));
          add(i, v3.add(nodes[i].p, d, g.step), year);
          budget--;
        }
      }
      // Shaded lower limbs are shed: whatever grew out of the trunk below
      // the crown's foot goes (and all it carried).
      const shed = new Set();
      for (let i = 1; i < nodes.length; i++) {
        const par = nodes[i].parent;
        if (shed.has(par)) { shed.add(i); continue; }
        if (par >= 0 && nodes[par].kids > 1 && -nodes[par].p[1] < base * 0.85 && onTrunk(nodes, par, top) && !onTrunk(nodes, i, top)) shed.add(i);
      }
      if (shed.size) {
        // (Rebuilt without them.)
        const map = new Map(), kept = [];
        nodes.forEach((n, i) => { if (!shed.has(i)) { map.set(i, kept.length); kept.push(n); } });
        for (const n of kept) { n.parent = n.parent >= 0 ? map.get(n.parent) : -1; n.kids = 0; }
        for (const n of kept) if (n.parent >= 0) kept[n.parent].kids++;
        top = map.get(top) ?? 0;
        nodes.length = 0; nodes.push(...kept);
        grid.clear(); nodes.forEach((_, i) => index(i));
      }
      while (next < views.length && views[next].age <= year) { seen.push(drawTree(g, nodes, top, views[next])); next++; }
    }
    while (next < views.length) { seen.push(drawTree(g, nodes, top, views[next])); next++; }
    return at ? seen : seen[0];
  }
  // Is node i on the trunk (the leader's line from the ground)?
  function onTrunk(nodes, i, top) {
    for (let j = top; j >= 0; j = nodes[j].parent) if (j === i) return true;
    return false;
  }

  function drawTree(g, nodes, top, { yaw = 0, pitch = 0.08, age }) {
    // (Its own chance, by age: the same leaves whichever way it was grown.)
    const rng = seeded((g.seed ^ 0x1eaf ^ Math.round(age * 1000)) >>> 0);
    // Pipe rule: a twig is 1, a limb the sum of what it carries.
    const load = new Float64Array(nodes.length);
    for (let i = nodes.length - 1; i >= 0; i--) { load[i] += 1; if (nodes[i].parent >= 0) load[nodes[i].parent] += load[i]; }
    const width = (i) => 0.0035 * Math.pow(load[i], 0.5);
    const parts = [], tips = [];
    // Branches as runs of segments, each run one width (so a limb tapers in steps).
    const kidsOf = nodes.map(() => []);
    nodes.forEach((n, i) => { if (n.parent >= 0) kidsOf[n.parent].push(i); });
    const runs = [];
    const walk = (start) => {
      const stack = [[start, [nodes[start].p], width(start)]];
      while (stack.length) {
        const [i, pts, w] = stack.pop();
        const kids = kidsOf[i];
        if (!kids.length) { runs.push({ pts, w }); tips.push(i); continue; }
        kids.sort((a, b) => load[b] - load[a]);
        kids.forEach((k, n) => {
          const wk = width(k);
          if (n === 0 && wk > w * 0.7) { pts.push(nodes[k].p); stack.push([k, pts, w]); }
          else { if (n === 0) runs.push({ pts, w }); stack.push([k, [nodes[i].p, nodes[k].p], wk]); }
        });
        if (kids.length && !(width(kids[0]) > w * 0.7)) { /* the run ended at this fork */ }
      }
    };
    walk(0);
    for (const r of runs) if (r.pts.length > 1) parts.push({ line: r.pts, width: Math.max(0.003, r.w), colour: "bark", tone: 0 });
    // Leaves: clusters at the twigs and a little way in, fewer where it is open.
    let yMin = 0;
    for (const n of nodes) yMin = Math.min(yMin, n.p[1]);
    const leafy = [];
    // Leaves grow with the tree: a sapling's are small.
    const scale = 0.45 + 0.55 * smooth(age / g.years);
    const weeping = g.crown === "weep" || g.rise < -0.25;
    for (const i of tips) {
      let j = i;
      for (let d = 0; d < 3 && j >= 0; d++, j = nodes[j].parent) {
        if (rng() > g.foliage * (1 - d * 0.35)) continue;
        const p = nodes[j].p, r = g.leaf * scale * (0.7 + rng() * 0.6) * (1 - d * 0.15);
        const jit = [(rng() - 0.5) * r, (rng() - 0.5) * r, (rng() - 0.5) * r];
        leafy.push({ c: v3.add(p, jit), r, up: -p[1] / Math.max(1e-3, -yMin), rot: (rng() - 0.5) * 1.2, flat: 0.6 + rng() * 0.3 });
      }
      // A weeping tree hangs curtains from its twigs.
      if (weeping && rng() < g.foliage) {
        const p = nodes[i].p, len = (0.1 + rng() * 0.25) * (0.5 + Math.max(0, -g.rise)) * scale;
        const end = [p[0] + (rng() - 0.5) * 0.02, Math.min(-0.02, p[1] + len), p[2] + (rng() - 0.5) * 0.02];
        parts.push({ line: [p, [p[0] + (end[0] - p[0]) * 0.5 + 0.01, (p[1] + end[1]) / 2, (p[2] + end[2]) / 2], end], width: g.leaf * scale * 0.55, colour: "leaves", tone: -0.04 + (rng() - 0.5) * 0.08 });
      }
    }
    for (const L of leafy) {
      /* Each clump as a painter blocks it in: its shaded mass, and the
       * lit top of it toward the light, smaller; lighter toward the top
       * of the tree, where the light falls. */
      const tone = -0.06 + 0.14 * L.up + (rng() - 0.5) * 0.06;
      parts.push({ dot: L.c, r: L.r, colour: "leaves", tone: tone - 0.1, rot: L.rot, flat: L.flat, leaf: true });
      parts.push({ dot: v3.add(L.c, [-L.r * 0.15, -L.r * 0.3, -L.r * 0.2]), r: L.r * 0.62, colour: "leaves", tone: tone + 0.07, rot: L.rot, flat: L.flat, leaf: true });
    }
    const facts = { nodes: nodes.length, leaves: leafy.length, tips: tips.length };
    // How tall the clear trunk stands: the lowest leaf over the height.
    const lowLeaf = leafy.length ? Math.max(...leafy.map((L) => L.c[1])) : 0;
    facts.clear = -yMin > 0 ? (-lowLeaf) / -yMin : 0;
    // Its main limbs: those off the trunk carrying a good share.
    facts.limbs = nodes.reduce((n, nd, i) => n + (nd.parent >= 0 && onTrunk(nodes, nd.parent, top) && !onTrunk(nodes, i, top) && load[i] > load[0] * 0.08 ? 1 : 0), 0);
    const entry = seenTree(g, parts, leafy, { yaw, pitch, age, facts });
    return entry;
  }

  function seenTree(g, parts, leafy, { yaw, pitch, age, facts }) {
    const items = parts.map((part) => {
      if (part.line) { const pts = part.line.map((p) => project(p, yaw, pitch, 0)); return { line: pts, width: part.width, colour: part.colour, tone: part.tone, depth: pts.reduce((s, q) => s + q[2], 0) / pts.length }; }
      const q = project(part.dot, yaw, pitch, 0);
      // Leaves at the back of the crown a shade darker: the crown is round.
      return { dot: [q[0], q[1], part.r], rot: part.rot || 0, flat: part.flat || 0.85, colour: part.colour, tone: part.tone - 0.12 * Math.max(0, q[2]) / 0.5, depth: q[2] - part.r * 0.5 };
    }).sort((p, q) => q.depth - p.depth);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const it of items) { if (it.line) it.line.forEach(([x, y]) => take(x, y, it.width / 2)); else take(it.dot[0], it.dot[1], it.dot[2]); }
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = ([x, y]) => [r4((x - x0) / bw), r4((y - y0) / bh)];
    const out = items.map((it) => {
      if (it.line) return { shape: "line", pts: it.line.map(U), width: r4(it.width / bw), colour: it.colour, tone: it.tone || 0 };
      const [cx, cy, r] = it.dot;
      return { shape: "ellipse", box: [r4((cx - r - x0) / bw), r4((cy - r * it.flat - y0) / bh), r4(2 * r / bw), r4(2 * it.flat * r / bh)], rot: r4(it.rot), colour: it.colour, tone: r4(it.tone || 0) };
    });
    // The canopy (for things put in it) and the balance of its leaves.
    let cx0 = Infinity, cy0 = Infinity, cx1 = -Infinity, cy1 = -Infinity, mx = 0;
    for (const L of leafy) {
      const q = project(L.c, yaw, pitch, 0);
      cx0 = Math.min(cx0, q[0]); cx1 = Math.max(cx1, q[0]); cy0 = Math.min(cy0, q[1]); cy1 = Math.max(cy1, q[1]); mx += q[0];
    }
    const canopy = leafy.length ? { x: r4((cx0 - x0) / bw), y: r4((cy0 - y0) / bh), w: r4((cx1 - cx0) / bw), h: r4((cy1 - cy0) / bh) } : null;
    facts.balance = leafy.length ? (mx / leafy.length - x0) / bw : 0.5;
    facts.crown = r4((0 - x0) / bw);
    facts.aspect = bw / bh;
    facts.span = [r4(bw), r4(bh)];
    // How much of the canopy's box the leaves cover (sky holes or a solid lump).
    if (canopy) {
      const N = 16, grid = new Uint8Array(N * N);
      for (const it of out) if (it.shape === "ellipse") {
        const [bx, by, w, h] = it.box;
        for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
          const px = canopy.x + (gx + 0.5) / N * canopy.w, py = canopy.y + (gy + 0.5) / N * canopy.h;
          const dx = (px - bx - w / 2) / (w / 2), dy = (py - by - h / 2) / (h / 2);
          if (dx * dx + dy * dy <= 1) grid[gy * N + gx] = 1;
        }
      }
      facts.cover = grid.reduce((a, b) => a + b, 0) / (N * N);
    }
    const anatomy = out.filter((p) => p.shape === "line" && p.width > 0.01).flatMap((p) => p.pts.slice(1).map((b, i) => ({ k: "stem", a: p.pts[i], b, r: r4(p.width / 2) })));
    return {
      kind: "subject", anchor: "ground", size: clamp(0.55 + 0.35 * smooth(age / g.years), 0.4, 0.92), aspect: clamp(bw / bh, 0.3, 2.5), depth: 0.5,
      colours: { leaves: [g.hue, g.sat, g.light], bark: [g.bark, 25, g.barkLight] },
      parts: out, grown: true, plant: true, anatomy, canopy, grower: g.kind, age: r4(age), yaw, pitch, facts,
    };
  }

  /* A good tree, as a picture: a trunk you can see, a crown with some sky
   * through it but not a skeleton, its weight over its foot (a little off is
   * alive, a lot is falling), a few main limbs, in proportion. */
  function judgeTree(entry) {
    const f = entry.facts || {};
    const band = (v, lo, hi, soft) => v < lo ? Math.max(0, 1 - (lo - v) / soft) : v > hi ? Math.max(0, 1 - (v - hi) / soft) : 1;
    const off = Math.abs((f.balance ?? 0.5) - (f.crown ?? 0.5));
    const reasons = {
      trunk: band(f.clear || 0, 0.12, 0.45, 0.15),
      cover: band(f.cover || 0, 0.5, 0.85, 0.25),
      balance: band(off, 0, 0.09, 0.12),
      limbs: band(f.limbs || 0, 2, 7, 3),
      leaves: band(f.leaves || 0, 80, 600, 60),
      shape: band(f.aspect || 1, 0.45, 1.5, 0.4),
    };
    const weights = { trunk: 1, cover: 1.2, balance: 1, limbs: 0.7, leaves: 0.8, shape: 0.6 };
    let s = 0, w = 0;
    for (const k in weights) { s += Math.log(Math.max(0.05, reasons[k])) * weights[k]; w += weights[k]; }
    return { score: Math.exp(s / w), reasons };
  }

  /* ── Cat ──────────────────────────────────────────────────────────────
   * A cat is a stick figure first - a spine from hip to shoulder, a neck,
   * four legs of two bones and a paw, a tail of a few joints - set in a pose
   * by its joint angles (standing, walking, sitting side on or facing you, a
   * loaf, curled up asleep), and its body is built round the bones. It grows
   * up: a kitten is mostly head, ears and eyes on short legs; a grown cat
   * has its own proportions (long or cobby, big-eared or round-headed); an
   * old one thins. Its coat is rules too - solid, tabby stripes that ring
   * the legs and tail, a tuxedo's white bib and socks, calico patches, a
   * colourpoint's dark mask and paws, tortie mottling. Its face has the
   * parts any face has (eyes, nose, mouth, ears), each from a few shapes,
   * and a mood that sets the eyelids. */
  const CAT_POSES = ["stand", "walk", "sit", "front", "loaf", "curl"];
  const COATS = ["solid", "tabby", "tuxedo", "calico", "point", "tortie"];
  const MOODS = ["alert", "content", "sleepy"];
  const CAT = {
    kind: "cat",
    numeric: [
      ["body", 0.8, 1.25, 0.06],        // length of the back
      ["girth", 0.18, 0.3, 0.02],       // how stout
      ["legs", 0.42, 0.62, 0.03],       // leg length
      ["head", 0.2, 0.3, 0.015],        // head size
      ["ears", 0.08, 0.17, 0.012],      // ear size
      ["earSet", 0.2, 0.7, 0.08],       // ears upright (0) .. spread (1)
      ["muzzle", 0.25, 0.6, 0.05],      // how far the face comes forward
      ["eyes", 0.2, 0.38, 0.03],        // eye size, of the head
      ["tail", 0.6, 1.2, 0.08],         // tail length
      ["tailCurl", -0.6, 1, 0.15],      // a straight tail .. a hook
      ["fluff", 0, 1, 0.15],            // short hair .. long
      ["hue", 0, 40, 6, true],          // the coat's colour: grey-blue to ginger
      ["sat", 0, 70, 8, true],
      ["light", 8, 80, 8, true],
      ["eyeHue", 40, 200, 20, true],
      ["stripes", 5, 12, 1, true],
      ["years", 0.15, 14, 1.5],         // how old it is when seen
    ],
    choices: [["pose", CAT_POSES], ["coat", COATS], ["mood", MOODS], ["eyeShape", ["round", "almond"]], ["facing", [-1, 1]]],
    lifespan: () => 14,
    grow: growCat,
    judge: judgeCat,
  };

  // A capsule round a bone: its outline, round at both ends.
  function capsule(a, b, ra, rb, n = 7) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + (i / n) * Math.PI; pts.push([b[0] + (ux * Math.cos(t - Math.PI) + nx * Math.sin(t - Math.PI)) * -rb, b[1] + (uy * Math.cos(t - Math.PI) + ny * Math.sin(t - Math.PI)) * -rb]); }
    for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + (i / n) * Math.PI; pts.push([a[0] - (ux * Math.cos(t) - nx * Math.sin(t)) * ra, a[1] - (uy * Math.cos(t) - ny * Math.sin(t)) * ra]); }
    return pts;
  }
  const ellipsePts = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  });
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const at2 = (p, a, r) => [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r];

  function growCat(g, { age = null, pose = null } = {}) {
    const rng = seeded(g.seed ^ 0xca7);
    const years = Number.isFinite(age) ? age : g.years;
    // Growing up: a kitten (0) to grown (1), then old age.
    const grown = smooth(years / 1.2), old = clamp((years - 10) / 5, 0, 1);
    const kit = 1 - grown;
    const P = pose || g.pose;
    const mood = P === "curl" ? "sleepy" : g.mood;
    // (Standing, the back is shorter for its legs than lying: a cat is not a stoat.)
    const body = g.body * (0.72 + 0.28 * grown) * (P === "stand" || P === "walk" ? 0.78 : 1), girth = g.girth * (0.9 + 0.1 * grown) * (1 - 0.12 * old) * (1 + 0.25 * g.fluff);
    const legs = g.legs * (0.78 + 0.22 * grown), head = g.head * (1 + 0.45 * kit), ears = g.ears * (1 + 0.5 * kit);
    const eyes = g.eyes * (1 + 0.35 * kit), tail = g.tail * (0.65 + 0.35 * grown);
    const legW = girth * 0.32 * (1 + 0.2 * g.fluff);
    const parts = [];   // { poly | line | ellipse, colour, tone, layer } - layer orders them (far legs first)
    const bones = [];   // the stick figure, for the brush and the judge
    const push = (layer, part) => parts.push({ layer, ...part });
    const limb = (layer, hip, knee, foot, w, colour = "fur", tone = 0) => {
      bones.push([hip, knee], [knee, foot]);
      push(layer, { poly: capsule(hip, knee, w * 1.25, w), colour, tone });
      push(layer, { poly: capsule(knee, foot, w, w * 0.85), colour, tone });
      push(layer, { poly: ellipsePts(foot[0] + w * 0.35, foot[1] - w * 0.45, w * 1.05, w * 0.55), colour: "paw", tone });
      return foot;
    };
    const tailChain = (start, dir, layer, curl, lie = false) => {
      const pts = [start];
      let a = dir;
      const n = 7, step = tail / n;
      for (let i = 0; i < n; i++) {
        a += lie ? curl * 0.25 : curl * 0.35 * (i / n) * 2;
        let q = at2(pts[pts.length - 1], a, step);
        if (q[1] > -0.02) q = [q[0], -0.02];
        pts.push(q);
      }
      bones.push(...pts.slice(1).map((q, i) => [pts[i], q]));
      push(layer, { line: pts, width: girth * (lie ? 0.34 : 0.42) * (1 + 0.6 * g.fluff), colour: "tail", tone: lie ? -0.04 : 0 });
      return pts;
    };
    let headAt, front = false, chest, hip, tailPts = null, feet = [];
    if (P === "stand" || P === "walk") {
      const H = legs * 0.95, swing = P === "walk" ? 0.35 : 0.08;
      hip = [-body / 2, -H]; chest = [body / 2, -H - 0.03];
      const mid = [0, -H - girth * 0.15 + 0.02];
      // Far legs, then the body, then near legs.
      feet.push(limb(0, [chest[0] - 0.02, chest[1] + girth * 0.4], [chest[0] + 0.02 - swing * 0.15, -H * 0.45], [chest[0] - swing * 0.2, 0], legW, "fur", -0.12));
      feet.push(limb(0, [hip[0] + 0.03, hip[1] + girth * 0.3], [hip[0] + 0.12 + swing * 0.1, -H * 0.5], [hip[0] + 0.04 + swing * 0.25, 0], legW * 1.1, "fur", -0.12));
      bones.push([hip, mid], [mid, chest]);
      push(1, { poly: capsule(hip, mid, girth * 1.05, girth * 0.95), colour: "fur", tone: 0 });
      push(1, { poly: capsule(mid, chest, girth * 0.95, girth * 1.05), colour: "fur", tone: 0 });
      feet.push(limb(2, [chest[0] - 0.04, chest[1] + girth * 0.5], [chest[0] + swing * 0.12, -H * 0.45], [chest[0] + swing * 0.25 - 0.02, 0], legW));
      feet.push(limb(2, [hip[0] + 0.06, hip[1] + girth * 0.4], [hip[0] + 0.16 - swing * 0.1, -H * 0.5], [hip[0] + 0.07 - swing * 0.2, 0], legW * 1.1));
      headAt = [chest[0] + head * 0.9, chest[1] - head * 1.25];
      bones.push([chest, headAt]);
      push(1, { poly: capsule(chest, headAt, girth * 0.8, head * 0.6), colour: "fur", tone: 0 });
      tailPts = tailChain([hip[0] - girth * 0.6, hip[1] - girth * 0.2], -Math.PI + (P === "walk" ? -0.9 : -0.35), 0, g.tailCurl);
    } else if (P === "sit") {
      // Haunch on the ground, back rising to the chest, front legs straight.
      hip = [-body * 0.18, -girth * 1.2]; chest = [body * 0.12, -legs * 0.95 - girth * 0.4];
      bones.push([hip, chest]);
      tailPts = tailChain([hip[0] - girth * 0.9, -0.03], 0.15, 3, g.tailCurl * 0.5, true);
      push(1, { poly: ellipsePts(hip[0], hip[1] - girth * 0.1, girth * 1.55, girth * 1.3), colour: "fur", tone: 0 });
      push(1, { poly: capsule(hip, chest, girth * 1.3, girth * 1.0), colour: "fur", tone: 0 });
      feet.push(limb(0, [chest[0] + 0.02, chest[1] + girth * 0.3], [chest[0] + 0.05, -legs * 0.45], [chest[0] + 0.06, 0], legW, "fur", -0.12));
      feet.push(limb(2, [chest[0] + 0.07, chest[1] + girth * 0.4], [chest[0] + 0.1, -legs * 0.45], [chest[0] + 0.12, 0], legW));
      push(2, { poly: ellipsePts(hip[0] + girth * 0.5, -legW * 0.6, girth * 0.9, legW * 0.7), colour: "paw", tone: 0 });
      headAt = [chest[0] + head * 0.35, chest[1] - head * 1.35];
      bones.push([chest, headAt]);
      push(1, { poly: capsule(chest, headAt, girth * 0.9, head * 0.6), colour: "fur", tone: 0 });
    } else if (P === "front") {
      // Facing you: a pear of a body, the front legs two columns, the tail round the paws.
      front = true;
      const top = -legs * 0.95 - girth * 0.6;
      chest = [0, top + girth * 0.6]; hip = [0, -girth * 1.1];
      bones.push([hip, chest]);
      push(1, { poly: ellipsePts(0, hip[1] + girth * 0.05, girth * 1.7, girth * 1.15), colour: "fur", tone: -0.03 });
      push(1, { poly: capsule(hip, chest, girth * 1.45, girth * 1.05), colour: "fur", tone: 0 });
      for (const side of [-1, 1]) feet.push(limb(2, [side * girth * 0.45, chest[1] + girth * 0.4], [side * girth * 0.45, -legs * 0.45], [side * girth * 0.5, 0], legW, "fur", 0));
      tailPts = tailChain([girth * 1.3, -0.04], Math.PI * 0.95, 3, -0.15, true);
      headAt = [0, chest[1] - head * 1.2];
      bones.push([chest, headAt]);
    } else if (P === "loaf") {
      hip = [-body * 0.42, -girth * 1.1]; chest = [body * 0.32, -girth * 1.15];
      bones.push([hip, chest]);
      // The tail laid along the ground at its side, round to the front paws.
      tailPts = tailChain([hip[0] - girth * 0.5, -0.03], 0, 3, 0.05, true);
      push(1, { poly: capsule(hip, chest, girth * 1.15, girth * 1.15), colour: "fur", tone: 0 });
      push(2, { poly: ellipsePts(chest[0] + girth * 0.55, -legW * 0.5, legW * 1.3, legW * 0.6), colour: "paw", tone: 0 });
      headAt = [chest[0] + head * 0.5, chest[1] - girth * 0.6 - head * 0.55];
    } else {
      // Curled up asleep: a round of body, the tail wrapped round the nose.
      const R = body * 0.42;
      hip = [-R * 0.3, -R * 0.75]; chest = [R * 0.35, -R * 0.75];
      bones.push([hip, chest]);
      push(1, { poly: ellipsePts(0, -R * 0.62, R * 1.05, R * 0.66), colour: "fur", tone: 0 });
      headAt = [R * 0.45, -R * 0.5];
      // The tail hugging the round of it, from the back along the bottom
      // to the front, its tip by the nose.
      const cy = -R * 0.62, rx = R * 1.08, ry = R * 0.7;
      tailPts = Array.from({ length: 9 }, (_, k) => { const a = Math.PI * 0.95 - (k / 8) * Math.PI * 0.95; return [rx * Math.cos(a), Math.min(-0.02, cy + ry * Math.sin(a))]; });
      bones.push(...tailPts.slice(1).map((q, i) => [tailPts[i], q]));
      push(3, { line: tailPts, width: girth * 0.36 * (1 + 0.6 * g.fluff), colour: "tail", tone: -0.04 });
    }
    // The head: skull, muzzle, ears, the face.
    const hx = headAt[0], hy = headAt[1];
    const earSpread = 0.35 + 0.5 * g.earSet;
    for (const side of front ? [-1, 1] : [-1, 1]) {
      // Side on, the far ear shows a little behind the near one.
      const ex = front ? side * head * earSpread * 0.9 : (side < 0 ? -head * 0.35 : head * 0.15);
      const base = [hx + ex, hy - head * 0.55];
      const tip = [base[0] + (front ? side * ears * 0.35 * (0.5 + g.earSet) : ears * 0.1), base[1] - ears * (1.1 - 0.25 * g.earSet)];
      const w = ears * 0.62;
      const layer = !front && side < 0 ? 3 : 4;
      push(layer, { poly: [[base[0] - w, base[1] + w * 0.3], tip, [base[0] + w, base[1] + w * 0.3]], colour: "ear", tone: !front && side < 0 ? -0.1 : 0 });
      push(layer, { poly: [[base[0] - w * 0.5, base[1] + w * 0.1], lerp2(tip, base, 0.2), [base[0] + w * 0.5, base[1] + w * 0.1]], colour: "inner", tone: 0 });
    }
    push(4, { poly: ellipsePts(hx, hy, head * (front ? 0.82 : 0.78), head * 0.68), colour: "face", tone: 0 });
    const curled = P === "curl";
    if (!curled) {
      // The muzzle comes forward (side on) or sits low in the middle (facing you).
      const mx = front ? hx : hx + head * (0.45 + 0.4 * g.muzzle), my = hy + head * 0.22;
      push(4, { poly: ellipsePts(mx, my, head * (front ? 0.36 : 0.3 + 0.12 * g.muzzle), head * 0.24), colour: "muzzle", tone: 0.04 });
      const nose = front ? [hx, hy + head * 0.12] : [mx + head * 0.22, my - head * 0.08];
      push(5, { poly: [[nose[0] - head * 0.07, nose[1] - head * 0.04], [nose[0] + head * 0.07, nose[1] - head * 0.04], [nose[0], nose[1] + head * 0.05]], colour: "nose", tone: 0 });
      // The mouth: a small "w" under the nose.
      const m0 = [nose[0], nose[1] + head * 0.05];
      push(5, { line: [[m0[0] - head * 0.12, m0[1] + head * 0.08], [m0[0] - head * 0.05, m0[1] + head * 0.1], m0, [m0[0] + head * 0.05, m0[1] + head * 0.1], [m0[0] + head * 0.12, m0[1] + head * 0.08]].filter((_, i) => front || i >= 2), width: head * 0.025, colour: "line", tone: 0 });
      // Whiskers.
      for (const side of front ? [-1, 1] : [1]) for (let k = -1; k <= 1; k++) {
        const o = [nose[0] + side * head * 0.12, nose[1] + head * 0.08];
        push(6, { line: [o, [o[0] + side * head * 0.75, o[1] + k * head * 0.14 - head * 0.05]], width: head * 0.012, colour: "whisker", tone: 0 });
      }
    }
    // Eyes: their shape, the pupil (round in a kitten or in the dark, a slit
    // in light), and the lids by mood.
    const eyeR = head * eyes * 0.55;
    const eyeAt = front ? [[hx - head * 0.33, hy - head * 0.08], [hx + head * 0.33, hy - head * 0.08]] : [[hx + head * (0.25 + 0.2 * g.muzzle), hy - head * 0.1]];
    for (const [ex, ey] of eyeAt) {
      if (mood === "sleepy" || curled) {
        push(5, { line: [[ex - eyeR, ey], [ex, ey + eyeR * 0.35], [ex + eyeR, ey]], width: head * 0.03, colour: "line", tone: 0 });
        continue;
      }
      const ry = eyeR * (g.eyeShape === "round" ? 0.95 : 0.62) * (mood === "content" ? 0.55 : 1);
      push(5, { poly: ellipsePts(ex, ey, eyeR * (front ? 1 : 0.8), ry, g.eyeShape === "almond" ? -0.2 : 0), colour: "eye", tone: 0 });
      const slit = kit < 0.5 && mood !== "content";
      push(6, { poly: ellipsePts(ex + (front ? 0 : eyeR * 0.2), ey, slit ? eyeR * 0.16 : eyeR * 0.42, ry * 0.92), colour: "pupil", tone: 0 });
      push(6, { poly: ellipsePts(ex + eyeR * 0.25, ey - ry * 0.4, eyeR * 0.13, eyeR * 0.13), colour: "glint", tone: 0 });
      if (mood === "content") push(6, { line: [[ex - eyeR, ey - ry * 0.6], [ex + eyeR, ey - ry * 0.6]], width: head * 0.035, colour: "face", tone: -0.05 });
    }
    // The coat's markings, on top of the body and head they mark.
    coatMarks(g, { push, rng, hip, chest, headAt, head, girth, legs, tailPts, feet, front, P, legW, body, curled });
    const facts = { pose: P, kit, feet: feet.length, tail: !!tailPts };
    return seenCat(g, parts, bones, { facing: g.facing || 1, age: years, facts, headAt, head, ears, tailPts });
  }

  /* Tabby stripes ring the legs and tail and bar the back, with an M on the
   * brow; a tuxedo is white at the chest, muzzle and paws; a colourpoint is
   * dark at the face, ears, paws and tail; calico and tortie are patched. */
  function coatMarks(g, { push, rng, hip, chest, headAt, head, girth, legs, tailPts, feet, front, P, legW, curled }) {
    const coat = g.coat;
    if (coat === "tabby") {
      const n = g.stripes;
      for (let i = 0; i < n && !front && !curled; i++) {
        const t = (i + 0.5) / n, p = lerp2(hip, chest, t);
        push(3, { line: [[p[0] - girth * 0.05, p[1] - girth * 0.95], [p[0] + girth * 0.08, p[1] - girth * 0.2], [p[0] + girth * 0.02, p[1] + girth * 0.35]], width: girth * 0.16, colour: "dark", tone: 0 });
      }
      if (front) for (let i = 0; i < 4; i++) push(3, { line: [[-girth * 0.9, chest[1] + girth * (0.3 + i * 0.35)], [-girth * 0.5, chest[1] + girth * (0.4 + i * 0.35)]], width: girth * 0.12, colour: "dark", tone: 0 }, push(3, { line: [[girth * 0.9, chest[1] + girth * (0.3 + i * 0.35)], [girth * 0.5, chest[1] + girth * (0.4 + i * 0.35)]], width: girth * 0.12, colour: "dark", tone: 0 }));
      if (tailPts) for (let i = 2; i < tailPts.length; i += 2) {
        const a = tailPts[i - 1], b = tailPts[i], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1, nx = -d[1] / l, ny = d[0] / l, w = girth * 0.3;
        push(3, { line: [[b[0] - nx * w, b[1] - ny * w], [b[0] + nx * w, b[1] + ny * w]], width: girth * 0.14, colour: "dark", tone: 0 });
      }
      // The M on the brow.
      const [hx, hy] = headAt;
      push(5, { line: [[hx - head * 0.25, hy - head * 0.3], [hx - head * 0.15, hy - head * 0.5], [hx, hy - head * 0.35], [hx + head * 0.15, hy - head * 0.5], [hx + head * 0.25, hy - head * 0.3]], width: head * 0.05, colour: "dark", tone: 0 });
    }
    if (coat === "tuxedo" || coat === "calico") {
      const bib = front ? [0, chest[1] + girth * 0.5] : [chest[0] + girth * 0.4, chest[1] + girth * 0.3];
      if (!curled && P !== "loaf") push(3, { poly: ellipsePts(bib[0], bib[1], girth * (front ? 0.7 : 0.45), girth * 0.75), colour: "white", tone: 0 });
      for (const f of feet) push(3, { poly: ellipsePts(f[0] + legW * 0.35, f[1] - legW * 0.7, legW * 1.1, legW * 0.95), colour: "white", tone: 0 });
    }
    if (coat === "calico" || coat === "tortie") {
      // Patches: irregular, spread along the back and flank, within the body.
      const n = coat === "calico" ? 5 : 9;
      for (let i = 0; i < n; i++) {
        const t = rng(), p = lerp2(hip, chest, t), r = girth * (coat === "calico" ? 0.4 + rng() * 0.35 : 0.22 + rng() * 0.25);
        const c = [p[0] + (rng() - 0.5) * girth * 0.8, p[1] - girth * (0.1 + rng() * 0.6)];
        const pts = Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2, rr = r * (0.7 + 0.5 * rng()); return [c[0] + Math.cos(a) * rr * 1.3, c[1] + Math.sin(a) * rr * 0.75]; });
        push(3, { poly: pts, colour: i % 2 ? "patchB" : "patchA", tone: 0 });
      }
      push(5, { poly: ellipsePts(headAt[0] - head * 0.3, headAt[1] - head * 0.2, head * 0.35, head * 0.3, 0.4), colour: "patchA", tone: 0 });
    }
    if (coat === "point") {
      push(5, { poly: ellipsePts(headAt[0] + (front ? 0 : head * 0.25), headAt[1] + head * 0.12, head * 0.5, head * 0.4), colour: "dark", tone: 0 });
      for (const f of feet) push(3, { poly: ellipsePts(f[0] + legW * 0.2, f[1] - legW * 1.3, legW * 1.05, legW * 1.6), colour: "dark", tone: 0 });
    }
  }

  function seenCat(g, parts, bones, { facing, age, facts, headAt, head, ears, tailPts }) {
    // Facing left is the cat mirrored.
    const fx = (p) => [p[0] * facing, p[1]];
    const ordered = parts.map((p, i) => ({ p, i })).sort((a, b) => a.p.layer - b.p.layer || a.i - b.i).map((x) => x.p);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = ([x, y], pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const part of ordered) (part.poly || part.line).forEach((q) => take(fx(q), part.line ? part.width / 2 : 0));
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = (q) => { const [x, y] = fx(q); return [r4((x - x0) / bw), r4((y - y0) / bh)]; };
    const out = ordered.map((part) => part.line
      ? { shape: "line", pts: part.line.map(U), width: r4(part.width / bw), colour: part.colour, tone: part.tone || 0 }
      : { shape: "poly", smooth: true, pts: part.poly.map(U), colour: part.colour, tone: part.tone || 0 });
    // Coat colours: the main one ("fur") first, so a painting's colour for
    // the word recolours the cat; the rest follow the coat.
    const base = [g.hue, g.coat === "point" ? Math.min(20, g.sat) : g.sat, g.coat === "point" ? Math.max(70, g.light) : g.coat === "calico" ? 90 : g.light];
    const dark = g.coat === "point" ? [g.hue + 5, Math.min(40, g.sat + 10), 22] : [g.hue, Math.min(90, g.sat + 10), Math.max(6, g.light * 0.45)];
    const white = [40, 15, 93];
    const colours = {
      fur: base, face: base, tail: base, ear: g.coat === "point" ? dark : base, paw: base, muzzle: g.coat === "tuxedo" ? white : [base[0], base[1], Math.min(95, base[2] + 8)],
      dark, white, patchA: [26, 80, 52], patchB: [30, 12, 12], inner: [350, 45, 72], nose: [355, 40, g.light < 30 ? 30 : 62],
      eye: [g.eyeHue, 70, 52], pupil: [0, 0, 6], glint: [0, 0, 98], line: [0, 0, 12], whisker: [0, 0, 92],
    };
    if (g.coat === "tortie") { colours.patchA = [24, 75, 40]; colours.patchB = [20, 25, 10]; }
    const hd = U(headAt);
    const anatomy = bones.map(([a, b]) => ({ k: "bone", a: U(a), b: U(b), r: r4(0.04 / bw) }));
    facts.aspect = bw / bh;
    facts.headShare = (head * 2) / bh;
    facts.earsShow = (headAt[1] - head * 0.55 - ears) < y0 + bh * 0.12 || facts.pose === "curl" ? 1 : 0;
    facts.tailOut = tailPts ? Math.hypot(tailPts[tailPts.length - 1][0] - tailPts[0][0], tailPts[tailPts.length - 1][1] - tailPts[0][1]) / bw : 0;
    return {
      kind: "subject", anchor: "ground", size: clamp(0.22 + 0.14 * (1 - facts.kit * 0.5) * (facts.pose === "curl" || facts.pose === "loaf" ? 0.8 : 1), 0.18, 0.4),
      aspect: clamp(bw / bh, 0.4, 3), depth: 0.5, colours, parts: out, grown: true, anatomy, grower: g.kind, age: r4(age),
      head: { x: hd[0], y: r4(hd[1] - head / bh), w: r4(head * 1.6 / bw) }, facts, pose: facts.pose,
    };
  }

  /* A good cat, as a picture: it reads as a cat from its silhouette - ears
   * up, a tail out from the body - in a cat's proportions for its age. */
  function judgeCat(entry) {
    const f = entry.facts || {};
    const band = (v, lo, hi, soft) => v < lo ? Math.max(0, 1 - (lo - v) / soft) : v > hi ? Math.max(0, 1 - (v - hi) / soft) : 1;
    const reasons = {
      ears: f.earsShow ? 1 : 0.4,
      tail: f.tail ? band(f.tailOut, 0.15, 0.9, 0.2) : 0.5,
      head: f.pose === "curl" ? 0.85 : band(f.headShare, 0.28 + 0.15 * f.kit, 0.55 + 0.2 * f.kit, 0.15),
      shape: band(f.aspect, 0.55, 2.2, 0.4),
    };
    const weights = { ears: 1, tail: 0.7, head: 1, shape: 0.6 };
    let s = 0, w = 0;
    for (const k in weights) { s += Math.log(Math.max(0.05, reasons[k])) * weights[k]; w += weights[k]; }
    return { score: Math.exp(s / w), reasons };
  }

  /* ── Faces ────────────────────────────────────────────────────────────
   * A face is a head and its parts, each part one of a few shapes, and any
   * shape may go on any head - a cartoon eye is a frog's eye is a cat's eye.
   * Heads: the angular cat (wide at the top, ears out, cheeks in jagged
   * tufts), the dome (a half round on its flat), the long face with a hood
   * of hair, the loaf. Parts: eyes (almond with a slit pupil, round with a
   * heavy lid and a glint, a dot, a ring, shut), brows (thick, cross,
   * raised), noses (the cat's triangle, a contour line, a dot), mouths (a
   * grin with fangs and tongue, open with teeth, a smile, a flat line, an
   * O), ears (cat's triangles, a C-curve), cheeks (tufts, blush, whisker
   * dots, jowl lines). A mood chooses parts the way a face does: sleepy
   * shuts the eyes, cross pulls the brows down and the mouth flat,
   * surprised rounds eyes and mouth, snarling bares the fangs. Drawn as a 2D
   * line drawing: flat fills under an ink line. */
  const FACE_HEADS = ["cat", "dome", "long", "loaf"];
  const FACE = {
    kind: "face",
    numeric: [
      ["width", 0.7, 1.15, 0.06],      // head width over height
      ["eyeY", -0.25, 0.05, 0.04],     // eye line, from the head's middle
      ["eyeGap", 0.2, 0.42, 0.03],     // eye centres apart (half)
      ["eyeSize", 0.1, 0.24, 0.02],
      ["noseY", 0.05, 0.3, 0.03],
      ["noseSize", 0.06, 0.18, 0.02],
      ["mouthY", 0.3, 0.6, 0.04],
      ["mouthW", 0.22, 0.55, 0.04],
      ["earSize", 0.22, 0.5, 0.04],
      ["hue", 0, 360, 30, true], ["sat", 10, 70, 8, true], ["light", 30, 82, 8, true],
      ["eyeHue", 30, 220, 25, true],
    ],
    choices: [
      ["head", FACE_HEADS],
      ["eyes", ["slit", "lidded", "dot", "ring", "shut"]],
      ["brows", ["none", "thick", "cross", "raised"]],
      ["nose", ["triangle", "contour", "dot", "none"]],
      ["mouth", ["fangs", "teeth", "smile", "flat", "o"]],
      ["ears", ["cat", "c", "none"]],
      ["cheeks", ["tufts", "blush", "whiskers", "jowls", "none"]],
      ["mood", ["happy", "sleepy", "cross", "surprised", "snarl", "plain"]],
      ["hair", ["none", "hood", "tuft"]],
    ],
    lifespan: () => 1,
    grow: growFace,
    judge: judgeFace,
  };
  // What each head usually has, before breeding moves parts between them.
  const FACE_DEFAULTS = {
    cat: { eyes: "slit", nose: "triangle", mouth: "fangs", ears: "cat", cheeks: "tufts", hair: "none", brows: "none" },
    dome: { eyes: "dot", nose: "none", mouth: "smile", ears: "cat", cheeks: "whiskers", hair: "none", brows: "none" },
    long: { eyes: "lidded", nose: "contour", mouth: "teeth", ears: "c", cheeks: "jowls", hair: "hood", brows: "thick" },
    loaf: { eyes: "dot", nose: "none", mouth: "smile", ears: "none", cheeks: "blush", hair: "none", brows: "none" },
  };
  // A mood's parts, over whatever the face has.
  const FACE_MOODS = {
    sleepy: { eyes: "shut", mouth: "smile" },
    cross: { brows: "cross", mouth: "flat" },
    surprised: { eyes: "ring", mouth: "o", brows: "raised" },
    snarl: { mouth: "fangs", brows: "cross" },
    happy: {},
    plain: {},
  };
  function faceSeed(rng) {
    const g = seedFrom(FACE, rng);
    // A face starts as its head usually is; breeding moves parts about.
    Object.assign(g, FACE_DEFAULTS[g.head]);
    if (g.head === "long") { g.hue = 20 + Math.floor(rng() * 20); g.sat = 25 + Math.floor(rng() * 30); g.light = 40 + Math.floor(rng() * 40); }
    return g;
  }

  function growFace(g) {
    const parts = [];   // in face space: x across (-1..1), y down (-1..1)
    const P = (shape, pts, colour, extra = {}) => parts.push({ shape, pts, colour, ...extra });
    const L = (pts, width = 0.035, colour = "ink") => parts.push({ shape: "line", pts, width, colour });
    const parts2 = { ...g, ...(FACE_MOODS[g.mood] || {}) };
    const W = g.width, head = g.head;
    const ell = (cx, cy, rx, ry, n = 24, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
    // ── The hair or hood, behind the head.
    if (parts2.hair === "hood" && head !== "cat") P("poly", [[-W * 0.95, 1.05], [-W * 0.75, -0.75], [-W * 0.3, -1.08], [W * 0.45, -1.02], [W * 0.82, -0.7], [W * 1.05, 1.05], [W * 0.6, 0.98], [W * 0.2, 1.08], [-W * 0.25, 1.0]], "hair");
    // ── Ears, behind the head.
    const es = g.earSize;
    if (parts2.ears === "cat") {
      for (const s of [-1, 1]) {
        const base = head === "cat" ? [[s * W * 0.95, -0.55], [s * W * 0.45, -0.92]] : [[s * W * 0.7, -0.35], [s * W * 0.25, -0.88]];
        const tip = [s * (W * 0.95 + es * 0.4), -1 - es * 1.3];
        P("poly", [base[0], tip, base[1]], "skin");
        P("poly", [[base[0][0] * 0.92 + tip[0] * 0.08, base[0][1] - 0.04], [tip[0] * 0.75 + base[1][0] * 0.25, tip[1] * 0.75 + base[1][1] * 0.25], [base[1][0], base[1][1] + 0.02]], "inner");
      }
    } else if (parts2.ears === "c") {
      for (const s of [-1, 1]) P("poly", ell(s * W * 0.98, 0.05, es * 0.35, es * 0.6, 14, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5), "skin");
    }
    // ── The head.
    let outline;
    if (head === "cat") {
      // Wide at the brow, jagged tufts at the cheeks, a round chin.
      const tuft = parts2.cheeks === "tufts";
      outline = [[-W, -0.6], [-W * 0.5, -0.92], [0, -0.85], [W * 0.5, -0.92], [W, -0.6], [W * 1.02, 0.1],
        ...(tuft ? [[W * 1.12, 0.35], [W * 0.92, 0.38], [W * 1.05, 0.62], [W * 0.82, 0.6]] : [[W * 0.95, 0.5]]),
        [W * 0.55, 0.92], [0, 1], [-W * 0.55, 0.92],
        ...(tuft ? [[-W * 0.82, 0.6], [-W * 1.05, 0.62], [-W * 0.92, 0.38], [-W * 1.12, 0.35]] : [[-W * 0.95, 0.5]]), [-W * 1.02, 0.1]];
    } else if (head === "dome") {
      outline = [...ell(0, 0.55, W, 1.45, 28, Math.PI, Math.PI * 2), [W, 0.55], [-W, 0.55]];
    } else if (head === "loaf") {
      outline = [...ell(0, -0.3, W, 0.65, 20, Math.PI, Math.PI * 2), [W, 0.75], [W * 0.9, 0.9], [-W * 0.9, 0.9], [-W, 0.75]];
    } else {
      // A long face: brow, cheeks, a jaw a little heavy, a wavering chin.
      outline = [[-W * 0.78, -0.75], [-W * 0.35, -0.98], [W * 0.35, -0.98], [W * 0.8, -0.72], [W * 0.92, -0.1], [W * 0.88, 0.45], [W * 0.62, 0.85], [W * 0.25, 1.0], [0, 0.97], [-W * 0.25, 1.02], [-W * 0.62, 0.86], [-W * 0.9, 0.45], [-W * 0.94, -0.1]];
    }
    P("poly", outline, "skin", { smooth: head !== "cat" });
    L([...outline, outline[0]], 0.04);
    // ── Cheeks.
    if (parts2.cheeks === "blush") for (const s of [-1, 1]) P("ellipse", null, "blush", { box: [s * g.eyeGap * 1.3 - 0.13, g.mouthY - 0.18, 0.26, 0.14] });
    if (parts2.cheeks === "whiskers") for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P("ellipse", null, "ink", { box: [s * (g.eyeGap * 0.9 + k * 0.08) - 0.018, g.noseY + 0.12 + (k % 2) * 0.05 - 0.018, 0.036, 0.036] });
    if (parts2.cheeks === "jowls") for (const s of [-1, 1]) L([[s * W * 0.5, 0.15], [s * W * 0.58, 0.45], [s * W * 0.42, 0.7]], 0.025);
    // ── Eyes.
    const er = g.eyeSize, ey = g.eyeY;
    for (const s of [-1, 1]) {
      const ex = s * g.eyeGap;
      if (parts2.eyes === "slit") {
        const almond = [...ell(ex, ey, er * 1.2, er * 0.7, 12, Math.PI, Math.PI * 2), ...ell(ex, ey, er * 1.2, er * 0.7, 12, 0, Math.PI)];
        P("poly", almond, "eye");
        P("poly", ell(ex, ey, er * 0.14, er * 0.65, 12), "pupil");
        L([...almond, almond[0]], 0.028);
        L([[ex - s * er * 1.5, ey - er * 0.35], [ex - s * er * 0.9, ey + er * 0.1]], 0.02);
      } else if (parts2.eyes === "lidded") {
        P("poly", ell(ex, ey, er, er * 0.95, 20), "white");
        P("poly", ell(ex + s * er * 0.1, ey + er * 0.15, er * 0.32, er * 0.32, 12), "pupil");
        P("poly", ell(ex + s * er * 0.2, ey + er * 0.02, er * 0.09, er * 0.09, 8), "white");
        // The heavy lid, halfway down.
        P("poly", [...ell(ex, ey, er * 1.02, er * 0.97, 12, Math.PI, Math.PI * 2), [ex + er, ey - er * 0.05], [ex - er, ey - er * 0.05]], "skin");
        L(ell(ex, ey, er, er * 0.95, 20), 0.026);
        L([[ex - er * 1.05, ey - er * 0.05], [ex + er * 1.05, ey - er * 0.05]], 0.03);
      } else if (parts2.eyes === "dot") {
        P("poly", ell(ex, ey, er * 0.38, er * 0.45, 12), "pupil");
      } else if (parts2.eyes === "ring") {
        P("poly", ell(ex, ey, er * 0.9, er * 0.9, 18), "white");
        L(ell(ex, ey, er * 0.9, er * 0.9, 18), 0.028);
        P("poly", ell(ex, ey, er * 0.3, er * 0.3, 10), "pupil");
      } else {
        L(ell(ex, ey - er * 0.1, er * 0.85, er * 0.45, 10, 0.15, Math.PI - 0.15), 0.035);
      }
      // ── Brows.
      const by = ey - er * 1.6;
      if (parts2.brows === "thick") P("poly", [[ex - er * 1.2, by + 0.02], [ex - er * 0.2, by - 0.05], [ex + er * 1.2, by - 0.02], [ex + er * 1.15, by + 0.06], [ex - er * 1.15, by + 0.09]], "hair");
      else if (parts2.brows === "cross") L([[ex + s * er * 1.2, by - 0.08], [ex - s * er * 0.8, by + 0.08]], 0.05);
      else if (parts2.brows === "raised") L(ell(ex, by + 0.02, er * 1.1, er * 0.5, 10, Math.PI * 1.1, Math.PI * 1.9), 0.035);
    }
    // ── Nose.
    const ny = g.noseY, ns = g.noseSize;
    if (parts2.nose === "triangle") {
      const tri = [[-ns, ny - ns * 0.5], [ns, ny - ns * 0.5], [0, ny + ns * 0.6]];
      P("poly", tri, "nose"); L([...tri, tri[0]], 0.03);
      L([[0, ny + ns * 0.6], [0, ny + ns * 1.2]], 0.028);
      // The line down from between the eyes, as the sketch has it.
      L([[0, g.eyeY], [-ns * 0.9, ny - ns * 0.5]], 0.02); L([[0, g.eyeY], [ns * 0.9, ny - ns * 0.5]], 0.02);
    } else if (parts2.nose === "contour") {
      L([[-ns * 0.3, g.eyeY + 0.05], [-ns * 0.6, ny], [-ns * 1.2, ny + ns * 0.7], [-ns * 0.6, ny + ns * 1.1], [0, ny + ns * 0.9], [ns * 0.6, ny + ns * 1.1], [ns * 1.1, ny + ns * 0.6]], 0.03);
    } else if (parts2.nose === "dot") {
      P("poly", ell(0, ny, ns * 0.35, ns * 0.25, 10), "nose");
    }
    // ── Mouth.
    const my = g.mouthY, mw = g.mouthW;
    if (parts2.mouth === "fangs" || parts2.mouth === "teeth") {
      const open = [...ell(0, my - 0.05, mw, 0.24, 16, 0.05, Math.PI - 0.05), [-mw, my - 0.07], [mw, my - 0.07]];
      P("poly", open, "mouth");
      if (parts2.mouth === "fangs") {
        for (const s of [-1, 1]) P("poly", [[s * mw * 0.75, my - 0.06], [s * mw * 0.45, my - 0.06], [s * mw * 0.6, my + 0.12]], "white");
        P("poly", ell(0, my + 0.12, mw * 0.4, 0.08, 12), "tongue");
      } else {
        P("poly", [[-mw * 0.7, my - 0.06], [mw * 0.7, my - 0.06], [mw * 0.6, my + 0.03], [-mw * 0.6, my + 0.03]], "white");
      }
      L([...open, open[0]], 0.035);
    } else if (parts2.mouth === "smile") {
      L(ell(0, my - 0.12, mw * 0.8, 0.16, 12, 0.3, Math.PI - 0.3), 0.035);
    } else if (parts2.mouth === "flat") {
      L([[-mw * 0.6, my], [mw * 0.6, my + 0.01]], 0.035);
    } else {
      P("poly", ell(0, my, mw * 0.25, mw * 0.3, 14), "mouth"); L(ell(0, my, mw * 0.25, mw * 0.3, 14), 0.03);
    }
    // ── Fitted to a unit box.
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) {
      if (p.pts) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      else { const [bx, by, bw, bh] = p.box; x0 = Math.min(x0, bx); x1 = Math.max(x1, bx + bw); y0 = Math.min(y0, by); y1 = Math.max(y1, by + bh); }
    }
    const bw = x1 - x0, bh = y1 - y0, r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = ([x, y]) => [r4((x - x0) / bw), r4((y - y0) / bh)];
    const out = parts.map((p) => p.shape === "ellipse"
      ? { shape: "ellipse", box: [r4((p.box[0] - x0) / bw), r4((p.box[1] - y0) / bh), r4(p.box[2] / bw), r4(p.box[3] / bh)], colour: p.colour }
      : p.shape === "line" ? { shape: "line", pts: p.pts.map(U), width: r4(p.width / bw), colour: p.colour }
      : { shape: "poly", pts: p.pts.map(U), colour: p.colour, ...(p.smooth ? { smooth: true } : {}) });
    const skin = [g.hue, g.sat, g.light];
    const facts = { aspect: bw / bh, eyes: parts2.eyes, mouth: parts2.mouth, head, mood: g.mood, gap: g.eyeGap / W, eyeSize: g.eyeSize };
    return {
      kind: "subject", anchor: "centre", size: 0.62, aspect: Math.max(0.5, Math.min(1.6, bw / bh)), centred: true,
      colours: { skin, hair: [g.hue, Math.min(60, g.sat + 10), Math.max(10, g.light - 35)], ink: [0, 0, 10], eye: [g.eyeHue, 70, 60],
        pupil: [0, 0, 6], white: [40, 20, 96], inner: [350, 50, 75], nose: [350, 40, 45], mouth: [355, 55, 22], tongue: [350, 70, 65],
        blush: [350, 70, 72] },
      parts: out, grown: true, grower: "face", head: { x: 0.5, y: r4((-1 - y0) / bh), w: r4(2 * W / bw) }, facts,
      // Small and telling: kept on any palette the painting is squeezed to.
      keepColours: ["ink", "white", "pupil", "mouth", "eye"], noHatch: true,
    };
  }
  /* A face that reads: its eyes a face's distance apart and of a face's
   * size, its mouth under them, nothing crowded off the head. */
  function judgeFace(entry) {
    const f = entry.facts || {};
    const band = (v, lo, hi, soft) => v < lo ? Math.max(0, 1 - (lo - v) / soft) : v > hi ? Math.max(0, 1 - (v - hi) / soft) : 1;
    const reasons = { gap: band(f.gap, 0.22, 0.42, 0.1), eyes: band(f.eyeSize, 0.11, 0.22, 0.06), shape: band(f.aspect, 0.65, 1.4, 0.3) };
    let s = 0;
    for (const k in reasons) s += Math.log(Math.max(0.05, reasons[k]));
    return { score: Math.exp(s / 3), reasons };
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
      // (Its grown height: its drawing's, or a fern's frond length.)
      return (o.height || o.genes.length || 1) * (0.35 + 0.65 * smooth(a / Math.max(4, o.age))) * (0.55 + 0.45 * m.vigour);
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
  const GROWERS = { fern: FERN, tree: TREE, cat: CAT, face: FACE };
  // The words that name a grower's thing.
  // (Plurals are read as plurals by the dictionary: "ferns" is a few.)
  const WORDS = {
    fern: "fern", bracken: "fern", undergrowth: "fern", fernery: "fern", frond: "fern", fiddlehead: "fern",
    tree: "tree", oak: "tree", willow: "tree", birch: "tree", maple: "tree", elm: "tree", poplar: "tree", cypress: "tree",
    aspen: "tree", beech: "tree", ash: "tree", sapling: "tree", grove: "tree", copse: "tree",
    cat: "cat", kitten: "cat", kitty: "cat", moggy: "cat", tabby: "cat",
    face: "face", portrait: "face", grin: "face", smiley: "face", character: "face", critter: "face", mascot: "face", bun: "face",
  };
  // Words that say which of a kind: a shape it keeps (matched on the shelf),
  // or a setting of its rules, or an age (a share of its growing up).
  const TRAITS = {
    tree: {
      oak: { crown: "spread" }, spreading: { crown: "spread" }, willow: { crown: "weep" }, weeping: { crown: "weep" },
      poplar: { crown: "column" }, cypress: { crown: "column" }, tall: { crown: "column" }, birch: { crown: "oval" },
      aspen: { crown: "oval" }, elm: { crown: "oval" }, maple: { crown: "round" }, beech: { crown: "round" }, ash: { crown: "oval" },
      sapling: { age: 0.3 }, young: { age: 0.35 }, old: { age: 1.4 }, ancient: { age: 1.6 }, windswept: { set: { lean: 0.2 } },
    },
    cat: {
      kitten: { age: 0.35 }, kitty: { age: 0.7 }, old: { age: 13 }, tabby: { coat: "tabby" }, calico: { coat: "calico" },
      tuxedo: { coat: "tuxedo" }, siamese: { coat: "point" }, tortoiseshell: { coat: "tortie" }, tortie: { coat: "tortie" },
      ginger: { coat: ["tabby", "solid"], set: { hue: 24, sat: 70, light: 50 } },
      sitting: { pose: ["sit", "front"] }, sits: { pose: ["sit", "front"] }, sat: { pose: ["sit", "front"] },
      sleeping: { pose: "curl" }, asleep: { pose: "curl" }, curled: { pose: "curl" }, napping: { pose: "curl" },
      walking: { pose: "walk" }, prowling: { pose: "walk" }, stalking: { pose: "walk" }, standing: { pose: "stand" },
      lying: { pose: "loaf" }, loaf: { pose: "loaf" }, resting: { pose: ["loaf", "curl"] },
    },
    face: {
      cat: { head: ["cat", "dome"] }, kitty: { head: "dome" }, man: { head: "long" }, woman: { head: "long" }, old: { head: "long" },
      person: { head: "long" }, bun: { head: "loaf" }, bread: { head: "loaf" }, blob: { head: ["loaf", "dome"] }, critter: { head: ["dome", "loaf"] },
      happy: { mood: "happy", mouth: ["smile", "teeth"] }, smiling: { mood: "happy", mouth: ["smile", "teeth"] }, grinning: { mood: "happy", mouth: ["teeth", "fangs"] },
      laughing: { mood: "happy", mouth: "teeth" }, sleepy: { mood: "sleepy" }, tired: { mood: "sleepy" }, angry: { mood: "cross" }, cross: { mood: "cross" },
      grumpy: { mood: "cross" }, surprised: { mood: "surprised" }, shocked: { mood: "surprised" }, snarling: { mood: "snarl" }, fierce: { mood: "snarl" }, wild: { mood: "snarl" },
    },
  };
  // What the words ask of a kind: { match: {gene: [options]}, set: {gene: value}, age }.
  function traitsOf(kind, text) {
    const table = TRAITS[kind], out = { match: {}, set: {}, age: null, key: "" };
    if (!table) return out;
    for (const word of String(text || "").toLowerCase().match(/[a-z]+/g) || []) {
      const t = table[word];
      if (!t) continue;
      out.key += word + ";";
      for (const [gene, v] of Object.entries(t)) {
        if (gene === "set") Object.assign(out.set, v);
        else if (gene === "age") out.age = v;
        else out.match[gene] = [].concat(v);
      }
    }
    return out;
  }

  function seed(kind, rng) { return kind === "face" ? faceSeed(rng) : seedFrom(GROWERS[kind], rng); }
  function mutate(genes, rng, rate) { return mutateBy(GROWERS[genes.kind], genes, rng, rate); }
  function crossover(a, b, rng) { return crossBy(GROWERS[a.kind], a, b, rng); }
  function distance(a, b) { return a.kind === b.kind ? distanceBy(GROWERS[a.kind], a, b) : 1; }
  function grow(genes, view) { return GROWERS[genes.kind].grow(genes, view); }
  // The same rules at several ages (rising): one run where the grower can.
  function growAt(genes, at) {
    const G = GROWERS[genes.kind];
    return G.manyAtOnce ? G.grow(genes, { at }) : at.map((v) => G.grow(genes, v));
  }
  function judge(entry) { return GROWERS[entry.grower]?.judge(entry) || { score: 0.5, reasons: {} }; }
  function lifespan(genes) { return GROWERS[genes.kind].lifespan(genes); }
  const kindOfWord = (word) => WORDS[String(word || "").toLowerCase()] || null;
  // Words for many grown together: a patch of the kind, not separate ones.
  const MASS = { bracken: "fern", undergrowth: "fern", fernery: "fern", grove: "tree", copse: "tree" };
  const patches = {
    seed: (rng) => seedFrom(PATCH, rng), mutate: (g, rng, rate) => mutateBy(PATCH, g, rng, rate),
    crossover: (a, b, rng) => crossBy(PATCH, a, b, rng), distance: (a, b) => distanceBy(PATCH, a, b),
    simulate: simulatePatch, judge: judgePatch, draw: drawPatch,
  };

  // Kinds that grow together in patches (plants; a crowd of cats is another matter).
  FERN.patches = true; TREE.patches = true;
  global.HexfieldGrowers = { GROWERS, WORDS, MASS, TRAITS, FACE_DEFAULTS, traitsOf, kindOfWord, seed, mutate, crossover, distance, grow, growAt, judge, lifespan, patches };
})(typeof window !== "undefined" ? window : globalThis);
