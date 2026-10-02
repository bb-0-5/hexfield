/* Visual primes, and things grown from them before they have a name.
 * ---------------------------------------------------------------------------
 *
 * The visual dictionary (hexfield-visual.js) draws what words name, each
 * thing a recipe somebody wrote. This file is underneath that: a few forms
 * nothing else is made of, a few ways of putting them together, and bodies
 * GROWN from them by a small rule set - a genome - instead of drawn. Change
 * a rule a little and the body that grows can change a lot; nothing here
 * says what any body should look like. The population that breeds them
 * (app.js, "Morphology") keeps what taste and votes favour, and a lineage
 * that survives long enough can be given a word.
 *
 * The primes - forms:
 *   mass    a filled body, its outline a sum of a few waves round a circle
 *   line    a direction: a stroke of even taper
 *   arc     a line that turns as it goes
 *   loop    an enclosure: a mass with its middle taken out
 *   branch  a fork: one line becoming two
 *   point   a spike: an outline drawn out to a tip - ears, horns, beaks,
 *           thorns, a crest
 * ...and relations:
 *   symmetry   none, mirror (left = right) or radial (n-fold)
 *   repeat     a body in segments, each smaller or larger than the last
 *   nest       a form inside itself, smaller, in another tone
 *   taper      every generation of growth thinner and shorter
 *   radiate    limbs set round a body at even angles
 *
 * A genome says which primes, how many and how related. `develop` grows it
 * into the dictionary's own drawing format (parts in box units), so a grown
 * thing is lit, framed, composed, attached to and painted like anything a
 * word names. `mutate` nudges its rules; `crossover` takes whole rule groups
 * from either parent, so a child is a coherent body, not a blend of two;
 * `distance` says how alike two genomes are.
 */
(function (global) {
  "use strict";

  const PRIME_FORMS = ["mass", "line", "arc", "loop", "branch", "point"];
  const PRIME_RELATIONS = ["symmetry", "repeat", "nest", "taper", "radiate"];
  const SYMMETRIES = ["mirror", "radial", "none"];
  const LIMB_PRIMES = ["line", "arc", "mass"];
  const BODY_PRIMES = ["mass", "loop"];
  const ANCHORS = ["ground", "sky", "centre"];
  const TEXTURES = [null, null, "fur", "scales", "speckle", "grain-v", "grain-h", "veins"];

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pickOf = (rng, list) => list[Math.floor(rng() * list.length) % list.length];
  const gauss = (rng) => (rng() + rng() + rng() - 1.5) / 0.5;

  /* A genome at random: the founders of a population. */
  function randomGenome(rng) {
    const symmetry = rng() < 0.6 ? "mirror" : rng() < 0.6 ? "radial" : "none";
    return {
      body: {
        prime: rng() < 0.82 ? "mass" : "loop",
        // Waves round the outline: 2 (oval), 3 (trefoil), 4 (square-ish), 5...
        waves: [rng() * 0.25, rng() * 0.18, rng() * 0.14, rng() * 0.1],
        phases: [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28],
        aspect: 0.6 + rng() * 1.0,
      },
      symmetry, radialN: 3 + Math.floor(rng() * 6),
      segments: { n: 1 + Math.floor(rng() * 3), vertical: rng() < 0.55, shrink: 0.6 + rng() * 0.45, overlap: 0.15 + rng() * 0.3 },
      nest: { depth: rng() < 0.35 ? 1 + Math.floor(rng() * 2) : 0, scale: 0.35 + rng() * 0.35, tone: rng() < 0.5 ? -0.18 : 0.15 },
      limbs: {
        n: Math.floor(rng() * 5), prime: pickOf(rng, LIMB_PRIMES), length: 0.5 + rng() * 1.2,
        spread: 0.3 + rng() * 1.2, down: rng() < 0.6, width: 0.06 + rng() * 0.1, taper: 0.5 + rng() * 0.4,
        depth: Math.floor(rng() * 3), forkAngle: 0.3 + rng() * 0.8, forkShrink: 0.5 + rng() * 0.3, curl: (rng() - 0.5) * 1.2,
      },
      head: { on: rng() < 0.6, prime: rng() < 0.85 ? "mass" : "loop", size: 0.35 + rng() * 0.4, eyes: Math.floor(rng() * 3.4),
        points: { n: rng() < 0.45 ? 1 + Math.floor(rng() * 2) : 0, at: 0.3 + rng() * 0.6, length: 0.3 + rng() * 0.6, width: 0.15 + rng() * 0.25 } },
      points: { n: rng() < 0.3 ? 1 + Math.floor(rng() * 5) : 0, at: rng() * 0.8, spread: 0.2 + rng() * 1.2, length: 0.2 + rng() * 0.5, width: 0.08 + rng() * 0.2 },
      tail: { on: rng() < 0.35, prime: rng() < 0.6 ? "arc" : "line", length: 0.5 + rng() * 1.0, curl: (rng() - 0.5) * 2, width: 0.05 + rng() * 0.08, side: rng() < 0.5 ? 1 : -1 },
      surface: { texture: pickOf(rng, TEXTURES) },
      colour: { h: Math.floor(rng() * 360), s: 35 + Math.floor(rng() * 50), l: 30 + Math.floor(rng() * 35), accent: 120 + Math.floor(rng() * 120), limbShift: (rng() - 0.5) * 60 },
      anchor: rng() < 0.7 ? "ground" : rng() < 0.6 ? "sky" : "centre",
      size: 0.25 + rng() * 0.25,
    };
  }

  /* A genome from before a rule existed gets that rule switched off, so an
   * old population keeps breeding (the point prime and the tail came later). */
  const DEFAULTS = {
    head: { points: { n: 0, at: 0.5, length: 0.5, width: 0.2 } },
    points: { n: 0, at: 0, spread: 0.6, length: 0.35, width: 0.15 },
    tail: { on: false, prime: "arc", length: 0.8, curl: 0.6, width: 0.07, side: 1 },
  };
  function normalise(g) {
    if (!g) return g;
    g.head ||= { on: false, prime: "mass", size: 0.5, eyes: 0 };
    g.head.points ||= { ...DEFAULTS.head.points };
    g.points ||= { ...DEFAULTS.points };
    g.tail ||= { ...DEFAULTS.tail };
    return g;
  }

  /* ── Growth ─────────────────────────────────────────────────────────────
   * Everything is grown in a unit space (y down) and then fitted into a box:
   * the drawing's parts are in box units like every dictionary entry. */
  function outline(g, cx, cy, rx, ry, n = 28) {
    const pts = [];
    const sym = g.symmetry;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      let r = 1;
      if (sym === "radial") r += (g.body.waves[0] + 0.12) * Math.cos(g.radialN * t);
      else {
        for (let k = 0; k < 4; k++) {
          // Mirror: cosines about the vertical only, so left and right agree.
          const phase = sym === "mirror" ? 0 : g.body.phases[k];
          r += g.body.waves[k] * Math.cos((k + 2) * t + phase);
        }
      }
      r = Math.max(0.35, r);
      // t = 0 at the top, going round: x by sine, y by cosine.
      pts.push([cx + Math.sin(t) * rx * r, cy - Math.cos(t) * ry * r]);
    }
    return pts;
  }

  /* A point: the outline of an ellipse (cx, cy, rx, ry) drawn out at angle
   * `a` (0 = straight up, clockwise) to a tip `length` beyond it, `width` of
   * a turn wide at its foot. */
  function growPoint(out, cx, cy, rx, ry, a, length, width, colour, tone = 0) {
    const at = (t, k = 1) => [cx + Math.sin(t) * rx * k, cy - Math.cos(t) * ry * k];
    const r = Math.hypot(Math.sin(a) * rx, Math.cos(a) * ry);
    const tip = [cx + Math.sin(a) * (rx + r * length), cy - Math.cos(a) * (ry + r * length)];
    // Its foot sunk a little into the body, so the two read as one.
    out.masses.push({ pts: [at(a - width, 0.82), tip, at(a + width, 0.82), at(a, 0.6)], colour, tone, point: true });
  }

  // A limb, grown and forked: strokes (line, arc) or a chain of small masses.
  function growLimb(g, out, x, y, angle, length, width, depth) {
    const L = g.limbs;
    const steps = 5;
    const pts = [[x, y]];
    let a = angle, px = x, py = y;
    const curl = L.prime === "arc" ? L.curl : L.curl * 0.15;
    for (let i = 1; i <= steps; i++) {
      a += curl / steps;
      px += Math.cos(a) * length / steps; py += Math.sin(a) * length / steps;
      pts.push([px, py]);
    }
    if (L.prime === "mass") {
      for (let i = 1; i < pts.length; i++) {
        const k = 1 - (i / pts.length) * (1 - L.taper);
        out.masses.push({ cx: pts[i][0], cy: pts[i][1], rx: width * 0.9 * k, ry: width * 0.9 * k, colour: "limb", tone: 0 });
      }
    } else {
      out.lines.push({ pts, width, colour: "limb" });
    }
    if (depth > 0) {
      for (const side of [-1, 1]) {
        growLimb(g, out, px, py, a + side * L.forkAngle, length * L.forkShrink, width * L.taper, depth - 1);
      }
    }
  }

  function develop(genome) {
    const g = normalise(genome);
    const out = { masses: [], lines: [], loops: [] };
    // The body: segments along an axis, each a scaled copy.
    const seg = g.segments, n = Math.max(1, Math.min(5, seg.n));
    const centres = [];
    let along = 0, scale = 1;
    for (let i = 0; i < n; i++) {
      const rx = 0.5 * scale * g.body.aspect, ry = 0.5 * scale;
      const cx = seg.vertical ? 0 : along, cy = seg.vertical ? -along : 0;
      centres.push({ cx, cy, rx, ry });
      const reach = seg.vertical ? ry : rx;
      scale *= seg.shrink;
      const next = seg.vertical ? 0.5 * scale : 0.5 * scale * g.body.aspect;
      along += (reach + next) * (1 - seg.overlap);
    }
    // Limbs on the first (largest) segment: in pairs (mirror), round it
    // (radial), or wherever (none). Down-pointing limbs are legs.
    const base = centres[0], L = g.limbs;
    const limbN = Math.max(0, Math.min(8, L.n));
    const angles = [];
    if (g.symmetry === "radial") {
      const k = Math.max(limbN, g.radialN);
      for (let i = 0; i < (limbN ? k : 0); i++) angles.push(-Math.PI / 2 + (i / k) * Math.PI * 2);
    } else if (g.symmetry === "mirror") {
      const pairs = Math.ceil(limbN / 2);
      for (let i = 0; i < pairs; i++) {
        const off = pairs > 1 ? (i / (pairs - 1) - 0.5) * L.spread : 0;
        const a = (L.down ? Math.PI / 2 : 0) + off + (L.down ? 0.45 : -0.45);
        angles.push(a, Math.PI - a);
      }
    } else {
      for (let i = 0; i < limbN; i++) angles.push((L.down ? Math.PI / 2 : -Math.PI / 2) + (i - limbN / 2) * L.spread * 0.6 + (g.body.phases[i % 4] - 3.14) * 0.2);
    }
    for (const a of angles) {
      const sx = base.cx + Math.cos(a) * base.rx * 0.82, sy = base.cy + Math.sin(a) * base.ry * 0.82;
      growLimb(g, out, sx, sy, a, L.length * 0.5, L.width, Math.max(0, Math.min(3, L.depth)));
    }
    // A tail: one limb off the side of the last segment, curling.
    if (g.tail.on) {
      const t = centres[centres.length - 1], side = g.tail.side || 1;
      const a = seg.vertical ? (side > 0 ? 0.35 : Math.PI - 0.35) : (side > 0 ? 0 : Math.PI);
      const sx = t.cx + Math.cos(a) * t.rx * 0.8, sy = t.cy + Math.sin(a) * t.ry * 0.8 + (seg.vertical ? t.ry * 0.3 : 0);
      const tailLimb = { ...g, limbs: { ...g.limbs, prime: g.tail.prime, curl: g.tail.curl * side, taper: 0.7 } };
      growLimb(tailLimb, out, sx, sy, a - (seg.vertical ? 0.9 * side : 0), g.tail.length * 0.5, g.tail.width, 0);
    }
    // Bodies over limbs: segments last to first, so the first is in front.
    for (let i = centres.length - 1; i >= 0; i--) {
      const c = centres[i];
      if (g.body.prime === "loop") out.loops.push({ pts: outline(g, c.cx, c.cy, c.rx, c.ry), inner: outline(g, c.cx, c.cy, c.rx * 0.55, c.ry * 0.55), colour: "body" });
      else out.masses.push({ pts: outline(g, c.cx, c.cy, c.rx, c.ry), colour: "body", tone: 0, texture: i === 0 ? g.surface.texture : null });
      // Points on the first segment: a crest, horns, thorns - in pairs about
      // the top (mirror), evenly round (radial), or one-sided (none).
      const P = g.points;
      if (i === 0 && P.n > 0) {
        const n = Math.min(8, P.n), angles = [];
        if (g.symmetry === "radial") for (let k = 0; k < n; k++) angles.push(P.at * Math.PI + (k / n) * Math.PI * 2);
        else if (g.symmetry === "mirror") for (let k = 0; k < Math.ceil(n / 2); k++) { const a = P.at * Math.PI * 0.5 + k * P.spread * 0.5; angles.push(a, -a); }
        else for (let k = 0; k < n; k++) angles.push(P.at * Math.PI + k * P.spread * 0.4);
        for (const a of angles) growPoint(out, c.cx, c.cy, c.rx, c.ry, a, P.length, P.width, "body", 0.04);
      }
      // Nested: the form inside itself, smaller, another tone.
      let k = 1;
      for (let d = 0; d < (g.nest.depth || 0); d++) {
        k *= g.nest.scale;
        out.masses.push({ pts: outline(g, c.cx, c.cy, c.rx * k, c.ry * k), colour: "body", tone: g.nest.tone * (d + 1) });
      }
    }
    // A head: at the leading end - the top of a stack, the front of a row.
    if (g.head.on) {
      const lead = centres[centres.length - 1];
      const hr = 0.5 * g.head.size;
      const hx = seg.vertical ? lead.cx : lead.cx + lead.rx + hr * 0.6;
      const hy = seg.vertical ? lead.cy - lead.ry - hr * 0.6 : lead.cy - lead.ry * 0.3;
      // Points on the head first (ears, horns), so the head covers their feet.
      const HP = g.head.points;
      for (let k = 0; k < Math.min(3, HP.n || 0); k++) {
        const a = HP.at * Math.PI * 0.5 + k * 0.5;
        for (const side of (g.symmetry === "none" ? [1] : [1, -1])) growPoint(out, hx, hy, hr, hr, side * a, HP.length, HP.width, "body", 0.06);
      }
      if (g.head.prime === "loop") out.loops.push({ pts: outline(g, hx, hy, hr, hr, 20), inner: outline(g, hx, hy, hr * 0.5, hr * 0.5, 20), colour: "body" });
      else out.masses.push({ pts: outline(g, hx, hy, hr, hr, 20), colour: "body", tone: 0.06 });
      const eyes = Math.max(0, Math.min(3, g.head.eyes));
      for (let e = 0; e < eyes; e++) {
        const ex = hx + (eyes === 1 ? 0 : (e / (eyes - 1) - 0.5) * hr * 0.9), ey = hy - hr * 0.1;
        out.masses.push({ cx: ex, cy: ey, rx: hr * 0.16, ry: hr * 0.2, colour: "accent", tone: 0.3, eye: true });
        out.masses.push({ cx: ex, cy: ey + hr * 0.03, rx: hr * 0.08, ry: hr * 0.1, colour: "eye", tone: 0 });
      }
    }
    return fit(g, out);
  }

  /* Fit what grew into a box: its bounds become 0..1, its aspect the box's. */
  function fit(g, out) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const m of out.masses) { if (m.pts) m.pts.forEach(([x, y]) => take(x, y)); else take(m.cx, m.cy, Math.max(m.rx, m.ry)); }
    for (const l of out.loops) l.pts.forEach(([x, y]) => take(x, y));
    for (const l of out.lines) l.pts.forEach(([x, y]) => take(x, y, l.width / 2));
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const U = ([x, y]) => [+((x - x0) / bw).toFixed(4), +((y - y0) / bh).toFixed(4)];
    const parts = [];
    for (const l of out.lines) parts.push({ shape: "line", pts: l.pts.map(U), width: +(l.width / bw).toFixed(4), colour: l.colour });
    for (const l of out.loops) {
      parts.push({ shape: "poly", smooth: true, pts: l.pts.map(U), colour: l.colour });
      parts.push({ shape: "poly", smooth: true, pts: l.inner.map(U), colour: l.colour, cut: true });
    }
    for (const m of out.masses) {
      if (m.pts) parts.push({ shape: "poly", smooth: !m.point, pts: m.pts.map(U), colour: m.colour, tone: m.tone || 0, ...(m.texture ? { texture: m.texture } : {}) });
      else parts.push({ shape: "ellipse", box: [+((m.cx - m.rx - x0) / bw).toFixed(4), +((m.cy - m.ry - y0) / bh).toFixed(4), +(2 * m.rx / bw).toFixed(4), +(2 * m.ry / bh).toFixed(4)], colour: m.colour, tone: m.tone || 0 });
    }
    const c = g.colour;
    return {
      kind: "subject", anchor: g.anchor, size: clamp(g.size, 0.15, 0.6), aspect: clamp(bw / bh, 0.25, 4), depth: 0.6,
      colours: {
        body: [c.h, c.s, c.l], limb: [(c.h + c.limbShift + 360) % 360, c.s, clamp(c.l - 12, 8, 80)],
        accent: [(c.h + c.accent) % 360, clamp(c.s + 20, 0, 100), clamp(c.l + 30, 20, 92)], eye: [0, 0, 8],
      },
      parts, grown: true,
    };
  }

  /* ── Inheritance ────────────────────────────────────────────────────── */
  const NUMERIC = [
    ["body.aspect", 0.35, 2.2, 0.15], ["body.waves.0", 0, 0.35, 0.05], ["body.waves.1", 0, 0.3, 0.04], ["body.waves.2", 0, 0.25, 0.04],
    ["body.waves.3", 0, 0.2, 0.03], ["radialN", 3, 9, 1, true], ["segments.n", 1, 5, 1, true], ["segments.shrink", 0.45, 1.15, 0.08],
    ["segments.overlap", 0, 0.5, 0.06], ["nest.depth", 0, 2, 1, true], ["nest.scale", 0.25, 0.75, 0.06],
    ["limbs.n", 0, 8, 1, true], ["limbs.length", 0.2, 2.2, 0.18], ["limbs.spread", 0.1, 2, 0.15], ["limbs.width", 0.03, 0.22, 0.02],
    ["limbs.taper", 0.3, 1, 0.06], ["limbs.depth", 0, 3, 1, true], ["limbs.forkAngle", 0.15, 1.3, 0.12], ["limbs.forkShrink", 0.35, 0.9, 0.06],
    ["limbs.curl", -1.5, 1.5, 0.25], ["head.size", 0.2, 0.9, 0.06], ["head.eyes", 0, 3, 1, true],
    ["colour.h", 0, 359, 18, true], ["colour.s", 15, 95, 8, true], ["colour.l", 18, 75, 6, true], ["colour.accent", 60, 300, 20, true],
    ["colour.limbShift", -60, 60, 10], ["size", 0.15, 0.55, 0.04],
    ["points.n", 0, 8, 1, true], ["points.at", 0, 1, 0.08], ["points.spread", 0.1, 1.6, 0.12], ["points.length", 0.1, 1, 0.08], ["points.width", 0.05, 0.35, 0.03],
    ["head.points.n", 0, 3, 1, true], ["head.points.at", 0.1, 1, 0.08], ["head.points.length", 0.15, 1.2, 0.08], ["head.points.width", 0.08, 0.45, 0.04],
    ["tail.length", 0.3, 2, 0.15], ["tail.curl", -1.6, 1.6, 0.25], ["tail.width", 0.03, 0.15, 0.015],
  ];
  const CATEGORICAL = [
    ["body.prime", BODY_PRIMES], ["symmetry", SYMMETRIES], ["segments.vertical", [true, false]], ["limbs.prime", LIMB_PRIMES],
    ["limbs.down", [true, false]], ["head.on", [true, false]], ["head.prime", BODY_PRIMES], ["surface.texture", TEXTURES], ["anchor", ANCHORS],
    ["tail.on", [true, false]], ["tail.prime", ["arc", "line"]], ["tail.side", [1, -1]],
  ];
  const getAt = (o, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), o);
  const setAt = (o, path, value) => { const ks = path.split("."); const last = ks.pop(); ks.reduce((v, k) => v[k], o)[last] = value; };
  const copy = (g) => JSON.parse(JSON.stringify(g));

  /* A child a step from its parent: a few rules nudged, now and then one
   * switched outright. `rate` 0..1: how many rules move. */
  function mutate(genome, rng, rate = 0.25) {
    const g = normalise(copy(genome));
    for (const [path, lo, hi, step, int] of NUMERIC) {
      if (rng() > rate) continue;
      let v = Number(getAt(g, path)) + gauss(rng) * step;
      if (path === "colour.h") v = (v + 360) % 360;
      v = clamp(v, lo, hi);
      setAt(g, path, int ? Math.round(v) : +v.toFixed(4));
    }
    for (const [path, options] of CATEGORICAL) {
      if (rng() > rate * 0.25) continue;
      setAt(g, path, pickOf(rng, options));
    }
    return g;
  }

  /* A child of two: each rule group (body, symmetry, segments, nest, limbs,
   * head, surface, colour, anchor and size) whole from one parent or the
   * other - so legs come with their branching, a head with its eyes. */
  const GROUPS = ["body", "symmetry", "radialN", "segments", "nest", "limbs", "head", "surface", "colour", "anchor", "size", "points", "tail"];
  function crossover(a, b, rng) {
    normalise(a); normalise(b);
    const child = {};
    for (const key of GROUPS) child[key] = copy((rng() < 0.5 ? a : b)[key]);
    return child;
  }

  /* How unalike two genomes are, 0 (the same rules) up. */
  function distance(a, b) {
    normalise(a); normalise(b);
    let d = 0, n = 0;
    for (const [path, lo, hi] of NUMERIC) {
      let x = Number(getAt(a, path)), y = Number(getAt(b, path));
      if (path === "colour.h") { const dh = Math.abs(x - y) % 360; d += Math.min(dh, 360 - dh) / 180 * 0.5; n += 0.5; continue; }
      d += Math.abs(x - y) / (hi - lo); n++;
    }
    for (const [path] of CATEGORICAL) { d += getAt(a, path) === getAt(b, path) ? 0 : 1.5; n += 1.5; }
    return d / n;
  }

  /* What a genome is made of, in primes, for the readout. */
  function primesOf(g) {
    normalise(g);
    const forms = new Set([g.body.prime]);
    if (g.points.n > 0 || (g.head.on && g.head.points.n > 0)) forms.add("point");
    if (g.tail.on) forms.add(g.tail.prime);
    if (g.limbs.n > 0) forms.add(g.limbs.prime === "mass" ? "mass" : g.limbs.prime);
    if (g.limbs.n > 0 && g.limbs.depth > 0) forms.add("branch");
    if (g.head.on) forms.add(g.head.prime);
    const relations = [g.symmetry === "none" ? null : g.symmetry === "radial" ? "radiate" : "symmetry"];
    if (g.segments.n > 1) relations.push("repeat");
    if (g.nest.depth > 0) relations.push("nest");
    if (g.limbs.n > 0 && g.limbs.taper < 0.85) relations.push("taper");
    return { forms: [...forms], relations: relations.filter(Boolean) };
  }

  global.HexfieldMorph = { PRIME_FORMS, PRIME_RELATIONS, randomGenome, develop, mutate, crossover, distance, primesOf, normalise };
})(typeof window !== "undefined" ? window : globalThis);
