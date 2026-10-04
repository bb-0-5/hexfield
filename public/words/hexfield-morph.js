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
      // A skeleton's genes, carried unseen until a backbone is grown.
      spine: spineGenes(rng),
    };
  }

  /* The first cell: a body and nothing else - no limbs, head, tail,
   * spikes, segments or symmetry. New populations start from these and
   * climb the tree of life (hexfield-phylo.js) one body plan at a time. */
  function cellGenome(rng) {
    const g = randomGenome(rng);
    g.body.prime = "mass";
    g.body.waves = [rng() * 0.12, rng() * 0.08, rng() * 0.05, rng() * 0.03];
    g.body.aspect = 0.8 + rng() * 0.4;
    g.symmetry = "none";
    g.segments.n = 1;
    g.nest.depth = 0;
    g.limbs.n = 0;
    g.head.on = false;
    g.head.points.n = 0;
    g.points.n = 0;
    g.tail.on = false;
    g.anchor = "centre";
    g.surface.texture = null;
    g.size = 0.25 + rng() * 0.1;
    return g;
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
    // (and the skeleton, which came later still: off, with its defaults)
    g.spine = { ...SPINE_DEFAULT, ...(g.spine || {}) };
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

  function develop(genome, { pose = "stand" } = {}) {
    const g = normalise(genome);
    if (g.spine.on) return developSkeleton(g, pose);
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

  /* ── The skeleton ─────────────────────────────────────────────────────
   * Past a certain point on the tree a body is built on bones, not out of
   * blobs: a spine (a chain of vertebrae, arched or not, level or upright),
   * a neck and a skull with a snout, eyes and ears, a tail that is the spine
   * carried on, and limbs on two girdles - shoulders and hips - each a
   * thigh, a shin and a foot with toes, bent at its joints. Flesh is wrapped
   * round the bones: the trunk thick at the chest and hips, the legs thick
   * at the top and thin at the foot. Drawn from the side, a near leg in
   * front of the body and a far one behind it, darker.
   *
   * The genes are carried, unseen, by every creature (spine.on false) and
   * vary while unused, like a plant's flower genes. When the skeleton is
   * switched on it is first a fish's - a swimming body, fins where limbs
   * will be, a tail - the way backbones began; legs, a neck held up, ears,
   * fur and wings come after, by the tree's order (hexfield-phylo.js).
   *
   * One skeleton stands, walks or sits: a pose changes the joints, not the
   * genes. */
  const POSES = ["stand", "walk", "sit"];
  const SPINE_DEFAULT = {
    on: false, bones: 6, length: 1.2, curve: 0.1, posture: 0.1, swim: true, wings: false,
    neck: 0.22, lift: 0.35, skull: 0.42, snout: 0.5, ears: 0, earLen: 0.4, earW: 0.25,
    tail: 6, tailLen: 0.8, tailCurl: 0.2, pairs: 2,
    upper: 0.45, lower: 0.42, foot: 0.16, digits: 3, legW: 0.1, bend: 0.4,
    chest: 0.3, hips: 0.24, belly: 0.06,
  };
  function spineGenes(rng) {
    const r = (lo, hi) => +(lo + rng() * (hi - lo)).toFixed(4);
    return {
      on: false, bones: 5 + Math.floor(rng() * 4), length: r(0.9, 1.5), curve: r(-0.2, 0.3), posture: r(0, 0.2), swim: true, wings: false,
      neck: r(0.12, 0.35), lift: r(0.15, 0.6), skull: r(0.32, 0.55), snout: r(0.2, 0.8), ears: 0, earLen: r(0.25, 0.6), earW: r(0.15, 0.35),
      tail: 3 + Math.floor(rng() * 6), tailLen: r(0.4, 1.2), tailCurl: r(-0.6, 0.8), pairs: 2,
      upper: r(0.32, 0.6), lower: r(0.3, 0.55), foot: r(0.1, 0.24), digits: 2 + Math.floor(rng() * 3), legW: r(0.07, 0.14), bend: r(0.2, 0.6),
      chest: r(0.22, 0.38), hips: r(0.18, 0.3), belly: r(0, 0.12),
    };
  }

  const dir = (a) => [Math.cos(a), Math.sin(a)];
  const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];

  /* Grown from its bones, in order of drawing (far first). */
  function developSkeleton(g, pose = "stand") {
    const S = { ...SPINE_DEFAULT, ...g.spine };
    const items = [];
    const swim = Boolean(S.swim), sit = pose === "sit" && !swim, walk = pose === "walk" && !swim;
    const up = clamp((S.posture - 0.5) / 0.9, 0, 1);
    // The trunk: hip at the origin, the head end to the right; an upright
    // body's trunk stands up from the hips.
    const trunkA = -(S.posture + (sit ? 0.5 * (1 - up) : 0));
    const n = Math.max(2, Math.round(S.bones)), bone = S.length / n;
    const spine = [[0, 0]];
    let a = trunkA - S.curve / 2;
    for (let i = 0; i < n; i++) { a += S.curve / n; spine.push(add(spine[spine.length - 1], dir(a), bone)); }
    const endA = a, shoulder = spine[n], hip = spine[0];
    const girth = spine.map((_, i) => { const t = i / n; return S.hips * (1 - t) + S.chest * t + S.belly * Math.sin(Math.PI * t); });
    // Which way is up from the spine at each vertebra (perpendicular, toward
    // the back).
    const backAt = (i) => { const p = spine[Math.max(0, i - 1)], q = spine[Math.min(n, i + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[1] - p[1]) / l, -(q[0] - p[0]) / l]; };
    // Neck and skull.
    const neckA = endA - S.lift * (1 - up);
    const neckEnd = add(shoulder, dir(neckA), S.neck);
    const skullA = neckA + (0 - neckA) * 0.65;
    const cr = S.skull * 0.32;
    const cranium = add(neckEnd, dir(skullA), cr * 0.6);
    const snoutLen = S.skull * (0.35 + 0.65 * S.snout);
    const tip = add(cranium, dir(skullA), cr * 0.5 + snoutLen);
    const upS = dir(skullA - Math.PI / 2);
    // Limbs: where each girdle hangs from, and its joints for the pose.
    const legs = [];
    if (!swim && S.pairs > 0) {
      const girdles = S.pairs >= 2 ? [["front", n, shoulder], ["rear", 0, hip]] : [["rear", 0, hip]];
      for (const [which, i, at] of girdles) {
        const back = backAt(i), root = add(at, back, -girth[i] * 0.45);
        const wing = which === "front" && S.wings;
        let angles;
        if (wing) angles = null;
        else if (up > 0.5) angles = which === "front" ? [Math.PI / 2 + 0.25, Math.PI / 2 - 0.2, Math.PI / 2] : [Math.PI / 2 - 0.05, Math.PI / 2 + 0.05, 0.05];
        // On its toes: the hind foot is a long bone stood nearly upright (a
        // cat's hock), the front a short pastern; only the toes lie forward.
        else if (which === "rear") angles = sit ? [-0.25, Math.PI / 2 + 1.25, 0] : [Math.PI / 2 - 0.45 - S.bend * 0.25, Math.PI / 2 + 0.45 + S.bend * 0.4, Math.PI / 2 - 0.15 - S.bend * 0.15];
        else angles = [Math.PI / 2 + 0.2, Math.PI / 2 - 0.08, Math.PI / 2 - 0.35];
        legs.push({ which, root, angles, wing, i });
      }
    }
    const legPoints = (leg, swing) => {
      const [u, l, f] = leg.angles;
      const k = add(leg.root, dir(u + swing), S.upper);
      const ankle = add(k, dir(l + swing * 0.6), S.lower);
      const toe = add(ankle, dir(f), S.foot);
      return [leg.root, k, ankle, toe];
    };
    const drawLeg = (leg, swing, colour) => {
      const p = legPoints(leg, swing), w = S.legW;
      items.push({ line: [p[0], p[1]], width: w, colour });
      items.push({ line: [p[1], p[2]], width: w * 0.75, colour });
      items.push({ line: [p[2], p[3]], width: w * 0.55, colour });
      // Toes, splayed a little.
      for (let d = 0; d < Math.round(S.digits); d++) {
        const spread = (d / Math.max(1, Math.round(S.digits) - 1) - 0.5) * 0.7;
        items.push({ line: [p[3], add(p[3], dir(spread * 0.6), S.foot * 0.35)], width: w * 0.2, colour });
      }
      return p;
    };
    const drawWing = (leg, colour, tone) => {
      // A wing folded along the back: a long fan of feathers from the shoulder.
      const len = (S.upper + S.lower) * 1.5, base = leg.root, back = trunkA + Math.PI;
      const pts = [base];
      for (let k = 0; k <= 6; k++) pts.push(add(base, dir(back + 0.05 - k * 0.07), len * (1 - k * 0.06)));
      pts.push(add(base, dir(back - 0.55), len * 0.35));
      items.push({ poly: pts, colour, tone, smooth: false });
    };
    // The far side first: far legs (or wing), far ear.
    const swingOf = (leg, far) => (walk ? (leg.which === "front" ? 0.35 : -0.35) * (far ? -1 : 1) : 0);
    for (const leg of legs) {
      if (leg.wing) continue;
      const shifted = { ...leg, root: add(leg.root, dir(trunkA + Math.PI), S.legW * 0.6) };
      drawLeg(shifted, swingOf(leg, true), "far");
    }
    // The tail: the spine carried on behind, curling, thinning.
    if (S.tail > 0) {
      let ta = trunkA + Math.PI - (swim ? 0 : 0.35), p = hip;
      const tn = Math.round(S.tail), tl = S.tailLen / tn;
      for (let k = 0; k < tn; k++) {
        ta -= S.tailCurl / tn;
        const q = add(p, dir(ta), tl);
        items.push({ line: [p, q], width: Math.max(0.015, S.hips * 0.7 * (1 - k / tn)), colour: "body" });
        p = q;
      }
      // A fish's tail ends in a fin.
      if (swim) items.push({ poly: [p, add(p, dir(ta - 0.7), S.tailLen * 0.45), add(p, dir(ta), S.tailLen * 0.2), add(p, dir(ta + 0.7), S.tailLen * 0.45)], colour: "limb", smooth: false });
    }
    // The trunk's flesh round the spine: along the back, round the chest,
    // back under the belly, round the rump.
    const outline = [];
    for (let i = 0; i <= n; i++) outline.push(add(spine[i], backAt(i), girth[i] * 0.9));
    for (let k = 1; k <= 4; k++) outline.push(add(shoulder, dir(endA - Math.PI / 2 + k * Math.PI / 5), girth[n]));
    for (let i = n; i >= 0; i--) outline.push(add(spine[i], backAt(i), -girth[i] * 1.05));
    for (let k = 1; k <= 4; k++) outline.push(add(hip, dir(trunkA + Math.PI / 2 + k * Math.PI / 5), girth[0]));
    items.push({ poly: outline, colour: "body", texture: g.surface?.texture || null, smooth: true });
    // Fins: a fish's on its back and under it where limbs will be.
    if (swim) {
      const mid = Math.floor(n / 2), back = backAt(mid);
      items.push({ poly: [add(spine[mid - 1 >= 0 ? mid - 1 : 0], back, girth[mid] * 0.8), add(spine[mid], back, girth[mid] * 1.7), add(spine[Math.min(n, mid + 1)], back, girth[mid] * 0.8)], colour: "limb", smooth: false });
      for (const i of S.pairs >= 2 ? [n - 1, 1] : S.pairs >= 1 ? [1] : []) {
        const b = backAt(i), root = add(spine[i], b, -girth[i] * 0.7);
        items.push({ poly: [root, add(root, dir(trunkA + Math.PI * 0.75), S.upper * 0.6), add(root, dir(trunkA + Math.PI * 0.95), S.upper * 0.45)], colour: "limb", smooth: false });
      }
    }
    // Neck, head.
    items.push({ line: [shoulder, add(shoulder, dir(neckA), S.neck * 0.5), neckEnd], width: Math.max(girth[n] * 1.2, cr * 1.4), colour: "body" });
    const ears = Math.round(S.ears);
    const ear = (k, colour) => {
      const ba = skullA - Math.PI / 2 - 0.35 + k * 0.55, base = add(cranium, dir(ba), cr * 0.75), side = dir(ba + Math.PI / 2);
      items.push({ poly: [add(base, side, -cr * S.earW), add(base, dir(ba - 0.15), S.skull * S.earLen), add(base, side, cr * S.earW)], colour, smooth: false });
    };
    if (ears >= 2) ear(1, "far");
    items.push({ ellipse: [cranium[0], cranium[1], cr, cr * 0.9], colour: "body", tone: 0.04 });
    items.push({ poly: [add(cranium, upS, cr * 0.7), tip, add(add(cranium, dir(skullA), cr * 0.3), upS, -cr * 0.75)], colour: "body", tone: 0.04, smooth: true });
    if (ears >= 1) ear(0, "body");
    // The near side: legs (or wing) over the body.
    for (const leg of legs) {
      if (leg.wing) drawWing(leg, "limb", 0);
      else drawLeg(leg, swingOf(leg, false), "limb");
    }
    // The eye.
    const eye = add(add(cranium, dir(skullA), cr * 0.35), upS, cr * 0.25);
    items.push({ ellipse: [eye[0], eye[1], cr * 0.2, cr * 0.2], colour: "accent", tone: 0.3 });
    items.push({ ellipse: [eye[0] + cr * 0.03, eye[1], cr * 0.1, cr * 0.12], colour: "eye", tone: 0 });
    // Stood on the ground: tilted so the lowest front and rear feet are level.
    if (legs.length === 2 && !legs.some((l) => l.wing) && !sit) {
      const feet = legs.map((l) => legPoints(l, 0)[3]);
      const tilt = Math.atan2(feet[0][1] - feet[1][1], feet[0][0] - feet[1][0]);
      if (Math.abs(tilt) < 0.6 && Math.abs(tilt) > 0.01) rotateItems(items, -tilt);
    }
    return fitItems(g, items, swim);
  }
  function rotateItems(items, angle) {
    const c = Math.cos(angle), s = Math.sin(angle), r = ([x, y]) => [x * c - y * s, x * s + y * c];
    for (const it of items) {
      if (it.line) it.line = it.line.map(r);
      if (it.poly) it.poly = it.poly.map(r);
      if (it.ellipse) { const [x, y] = r(it.ellipse); it.ellipse = [x, y, it.ellipse[2], it.ellipse[3]]; }
    }
  }
  /* Fitted into a box, in the order drawn. */
  function fitItems(g, items, swim) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const it of items) {
      if (it.line) it.line.forEach(([x, y]) => take(x, y, it.width / 2));
      if (it.poly) it.poly.forEach(([x, y]) => take(x, y));
      if (it.ellipse) { take(it.ellipse[0] - it.ellipse[2], it.ellipse[1] - it.ellipse[3]); take(it.ellipse[0] + it.ellipse[2], it.ellipse[1] + it.ellipse[3]); }
    }
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const U = ([x, y]) => [+((x - x0) / bw).toFixed(4), +((y - y0) / bh).toFixed(4)];
    const parts = items.map((it) => {
      if (it.line) return { shape: "line", pts: it.line.map(U), width: +(it.width / bw).toFixed(4), colour: it.colour };
      if (it.poly) return { shape: "poly", smooth: it.smooth !== false, pts: it.poly.map(U), colour: it.colour, tone: it.tone || 0, ...(it.texture ? { texture: it.texture } : {}) };
      const [cx, cy, rx, ry] = it.ellipse;
      return { shape: "ellipse", box: [+((cx - rx - x0) / bw).toFixed(4), +((cy - ry - y0) / bh).toFixed(4), +(2 * rx / bw).toFixed(4), +(2 * ry / bh).toFixed(4)], colour: it.colour, tone: it.tone || 0 };
    });
    const c = g.colour;
    return {
      kind: "subject", anchor: swim ? "centre" : g.spine?.wings && g.anchor === "sky" ? "sky" : "ground",
      size: clamp(g.size + 0.08, 0.18, 0.62), aspect: clamp(bw / bh, 0.25, 4), depth: 0.6,
      colours: {
        body: [c.h, c.s, c.l], limb: [(c.h + c.limbShift * 0.3 + 360) % 360, c.s, clamp(c.l - 6, 8, 80)], far: [c.h, clamp(c.s - 8, 0, 100), clamp(c.l - 16, 6, 70)],
        accent: [(c.h + c.accent) % 360, clamp(c.s + 20, 0, 100), clamp(c.l + 30, 20, 92)], eye: [0, 0, 8],
      },
      parts, grown: true, skeleton: true,
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
    ["spine.bones", 3, 12, 1, true], ["spine.length", 0.6, 2.2, 0.12], ["spine.curve", -0.6, 0.6, 0.1], ["spine.posture", 0, 1.5, 0.15],
    ["spine.neck", 0.05, 0.8, 0.06], ["spine.lift", 0, 1.2, 0.12], ["spine.skull", 0.22, 0.7, 0.05], ["spine.snout", 0, 1, 0.1],
    ["spine.ears", 0, 2, 1, true], ["spine.earLen", 0.1, 1, 0.08], ["spine.earW", 0.1, 0.5, 0.05],
    ["spine.tail", 0, 12, 1, true], ["spine.tailLen", 0.2, 1.8, 0.12], ["spine.tailCurl", -1.2, 1.2, 0.2], ["spine.pairs", 0, 2, 1, true],
    ["spine.upper", 0.15, 0.9, 0.06], ["spine.lower", 0.15, 0.9, 0.06], ["spine.foot", 0.05, 0.4, 0.04], ["spine.digits", 0, 5, 1, true],
    ["spine.legW", 0.04, 0.2, 0.015], ["spine.bend", 0, 1, 0.1], ["spine.chest", 0.12, 0.5, 0.04], ["spine.hips", 0.1, 0.45, 0.04], ["spine.belly", 0, 0.2, 0.03],
  ];
  const CATEGORICAL = [
    ["body.prime", BODY_PRIMES], ["symmetry", SYMMETRIES], ["segments.vertical", [true, false]], ["limbs.prime", LIMB_PRIMES],
    ["limbs.down", [true, false]], ["head.on", [true, false]], ["head.prime", BODY_PRIMES], ["surface.texture", TEXTURES], ["anchor", ANCHORS],
    ["tail.on", [true, false]], ["tail.prime", ["arc", "line"]], ["tail.side", [1, -1]],
    ["spine.on", [true, false]], ["spine.swim", [true, false]], ["spine.wings", [true, false]],
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
  const GROUPS = ["body", "symmetry", "radialN", "segments", "nest", "limbs", "head", "surface", "colour", "anchor", "size", "points", "tail", "spine"];
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
    if (g.spine.on) {
      // Bones are lines; flesh is mass; a curling tail an arc; ears and fins
      // points; toes a fork. Vertebrae repeat; limbs taper.
      const S = g.spine, forms = ["mass", "line"];
      if (S.tail > 0) forms.push(S.tailCurl ? "arc" : "line");
      if (S.ears > 0 || S.swim) forms.push("point");
      if (!S.swim && S.digits > 1 && S.pairs > 0) forms.push("branch");
      return { forms: [...new Set(forms)], relations: ["symmetry", "repeat", "taper"] };
    }
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

  global.HexfieldMorph = { PRIME_FORMS, PRIME_RELATIONS, POSES, randomGenome, cellGenome, develop, mutate, crossover, distance, primesOf, normalise };
})(typeof window !== "undefined" ? window : globalThis);
