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

  function develop(genome, { pose = "stand", yaw = 0, pitch = 0, shear = 0, light = null } = {}) {
    const g = normalise(genome);
    if (g.spine.on) return developSkeleton(g, pose, yaw, pitch, shear, light);
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
   * genes. And it is a body in three dimensions, so it can be seen from any
   * side (yaw) and from above or below (pitch): turned to sit in a scene's
   * perspective, and looked down on below the eye line, up at above it. */
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

  /* Grown from its bones, in three dimensions, then seen from an angle:
   * `yaw` turns it about the vertical (0 side on, head to the right; -pi/2
   * facing the viewer; pi/2 facing away; pi head to the left) and `pitch`
   * tilts the view (above it, positive: its back shows and its far side
   * rises; below it, negative: its belly). The trunk is a chain of spheres
   * round the spine, so it reads from any side; legs, ears and eyes come in
   * left and right pairs; what is farther is drawn first. */
  function developSkeleton(g, pose = "stand", yaw = 0, pitch = 0, shear = 0, light = null) {
    const S = { ...SPINE_DEFAULT, ...g.spine };
    const swim = Boolean(S.swim), sit = pose === "sit" && !swim, walk = pose === "walk" && !swim;
    const up = clamp((S.posture - 0.5) / 0.9, 0, 1);
    const add3 = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
    const dxy = (a) => [Math.cos(a), Math.sin(a), 0];
    const Z = [0, 0, 1];
    const parts = [];      // { kind, ... } in 3D, projected below
    const bones = [];      // anatomy, in 3D
    // The trunk: hip at the origin, the head end to the right (+x); an
    // upright body's trunk stands up from the hips. z is across the body.
    const trunkA = -(S.posture + (sit ? 0.5 * (1 - up) : 0));
    const n = Math.max(2, Math.round(S.bones)), bone = S.length / n;
    const spine = [[0, 0, 0]];
    let a = trunkA - S.curve / 2;
    for (let i = 0; i < n; i++) { a += S.curve / n; spine.push(add3(spine[spine.length - 1], dxy(a), bone)); }
    const endA = a, shoulder = spine[n], hip = spine[0];
    const girth = spine.map((_, i) => { const t = i / n; return S.hips * (1 - t) + S.chest * t + S.belly * Math.sin(Math.PI * t); });
    const backAt = (i) => { const p = spine[Math.max(0, i - 1)], q = spine[Math.min(n, i + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[1] - p[1]) / l, -(q[0] - p[0]) / l, 0]; };
    // The trunk's flesh: a sphere at each vertebra, and between them.
    const balls = [];
    for (let i = 0; i <= n; i++) {
      balls.push({ c: spine[i], r: girth[i] });
      if (i < n) balls.push({ c: add3(spine[i], [spine[i + 1][0] - spine[i][0], spine[i + 1][1] - spine[i][1], 0], 0.5), r: (girth[i] + girth[i + 1]) / 2 });
    }
    parts.push({ trunk: balls, colour: "body", texture: g.surface?.texture || null });
    for (let i = 0; i < n; i++) bones.push({ k: "trunk", a: spine[i], b: spine[i + 1], r: (girth[i] + girth[i + 1]) / 2 });
    // Neck and head.
    const neckA = endA - S.lift * (1 - up);
    const neckEnd = add3(shoulder, dxy(neckA), S.neck);
    const skullA = neckA + (0 - neckA) * 0.65;
    const cr = S.skull * 0.32;
    const fwd = dxy(skullA), upS = dxy(skullA - Math.PI / 2);
    const cranium = add3(neckEnd, fwd, cr * 0.6);
    const snoutLen = S.skull * (0.35 + 0.65 * S.snout);
    const neckW = Math.max(girth[n] * 1.2, cr * 1.4);
    parts.push({ line: [shoulder, add3(shoulder, dxy(neckA), S.neck * 0.5), neckEnd], width: neckW, colour: "body", bias: -0.005 });
    bones.push({ k: "neck", a: shoulder, b: neckEnd, r: neckW / 2 });
    parts.push({ ball: { c: cranium, r: cr }, colour: "body", tone: 0.04, bias: -0.01 });
    // The snout: from the front of the skull to its tip, as wide as the
    // jaw - its outline is the hull of where those points fall.
    const base = add3(cranium, fwd, cr * 0.3);
    parts.push({ hull: [add3(cranium, upS, cr * 0.7), add3(base, upS, -cr * 0.75), add3(base, Z, cr * 0.5), add3(base, Z, -cr * 0.5),
      add3(cranium, fwd, cr * 0.5 + snoutLen), add3(add3(cranium, fwd, cr * 0.5 + snoutLen * 0.8), upS, -cr * 0.2)], colour: "body", tone: 0.04, bias: -0.015 });
    bones.push({ k: "head", a: cranium, b: add3(cranium, fwd, cr * 0.5 + snoutLen), r: cr });
    // Ears: a pair, left and right on top of the skull.
    if (Math.round(S.ears) > 0) {
      const len = S.skull * S.earLen * (Math.round(S.ears) === 1 ? 0.6 : 1);
      for (const side of [-1, 1]) {
        const back = dxy(skullA - Math.PI / 2 - 0.35), root = add3(add3(cranium, back, cr * 0.75), Z, side * cr * 0.45);
        // A shade darker than the head, so an ear reads against the body
        // behind it from the front or back.
        parts.push({ poly: [add3(root, fwd, -cr * S.earW), add3(root, dxy(skullA - Math.PI / 2 - 0.5), len), add3(root, fwd, cr * S.earW)], colour: "body", tone: -0.12, bias: -0.012 });
      }
    }
    // Eyes: a pair, seen only from their own side.
    for (const side of [-1, 1]) {
      const eye = add3(add3(add3(cranium, fwd, cr * 0.35), upS, cr * 0.25), Z, side * cr * 0.42);
      parts.push({ eye: { c: eye, r: cr * 0.2, centre: cranium }, bias: -0.2 });
    }
    // Limbs: left and right of each girdle, joints by pose; walking, the
    // diagonal pairs swing together.
    const legs = [];
    if (!swim && S.pairs > 0) {
      const girdles = S.pairs >= 2 ? [["front", n, shoulder], ["rear", 0, hip]] : [["rear", 0, hip]];
      for (const [which, i, at] of girdles) {
        for (const side of [-1, 1]) {
          const root = add3(add3(at, backAt(i), -girth[i] * 0.45), Z, side * girth[i] * 0.55);
          const wing = which === "front" && S.wings;
          let angles = null;
          if (!wing) {
            if (up > 0.5) angles = which === "front" ? [Math.PI / 2 + 0.25, Math.PI / 2 - 0.2, Math.PI / 2] : [Math.PI / 2 - 0.05, Math.PI / 2 + 0.05, 0.05];
            else if (which === "rear") angles = sit ? [-0.25, Math.PI / 2 + 1.25, 0] : [Math.PI / 2 - 0.45 - S.bend * 0.25, Math.PI / 2 + 0.45 + S.bend * 0.4, Math.PI / 2 - 0.15 - S.bend * 0.15];
            else angles = [Math.PI / 2 + 0.2, Math.PI / 2 - 0.08, Math.PI / 2 - 0.35];
          }
          const swing = walk ? (which === "front" ? 0.35 : -0.35) * side : 0;
          legs.push({ which, side, root, angles, wing, swing });
        }
      }
    }
    const legPoints = (leg) => {
      const [u, l, f] = leg.angles;
      const k = add3(leg.root, dxy(u + leg.swing), S.upper);
      const ankle = add3(k, dxy(l + leg.swing * 0.6), S.lower);
      return [leg.root, k, ankle, add3(ankle, dxy(f), S.foot)];
    };
    for (const leg of legs) {
      if (leg.wing) {
        // A wing folded along the back: a fan of feathers from the shoulder.
        const len = (S.upper + S.lower) * 1.5, back = trunkA + Math.PI, pts = [leg.root];
        for (let k = 0; k <= 6; k++) pts.push(add3(add3(leg.root, dxy(back + 0.05 - k * 0.07), len * (1 - k * 0.06)), Z, leg.side * 0.04));
        pts.push(add3(leg.root, dxy(back - 0.55), len * 0.35));
        parts.push({ poly: pts, colour: "limb", leg: true });
        bones.push({ k: "wing", a: leg.root, b: add3(leg.root, dxy(back - 0.2), len * 0.9), r: len * 0.18, leg: true });
        continue;
      }
      const p = legPoints(leg), w = S.legW;
      const group = [];
      group.push({ line: [p[0], p[1]], width: w }, { line: [p[1], p[2]], width: w * 0.75 }, { line: [p[2], p[3]], width: w * 0.55 });
      for (let d = 0; d < Math.round(S.digits); d++) {
        const spread = (d / Math.max(1, Math.round(S.digits) - 1) - 0.5) * 0.7;
        group.push({ line: [p[3], add3(p[3], [Math.cos(spread * 0.6), Math.sin(spread * 0.6) * 0.3, Math.sin(spread) * 0.6], S.foot * 0.35)], width: w * 0.2 });
      }
      parts.push({ group, leg: true, foot: p[3], which: leg.which });
      bones.push({ k: "leg", a: p[0], b: p[1], r: w / 2, leg: true }, { k: "leg", a: p[1], b: p[2], r: w * 0.375, leg: true }, { k: "leg", a: p[2], b: p[3], r: w * 0.275, leg: true });
    }
    // The tail: the spine carried on behind, curling, thinning.
    if (S.tail > 0) {
      let ta = trunkA + Math.PI - (swim ? 0 : 0.35), p = hip;
      const tn = Math.round(S.tail), tl = S.tailLen / tn;
      for (let k = 0; k < tn; k++) {
        ta -= S.tailCurl / tn;
        const q = add3(p, dxy(ta), tl), w = Math.max(0.015, S.hips * 0.7 * (1 - k / tn));
        parts.push({ line: [p, q], width: w, colour: "body", bias: 0.01 });
        bones.push({ k: "tail", a: p, b: q, r: w / 2 });
        p = q;
      }
      if (swim) parts.push({ hull: [p, add3(p, dxy(ta - 0.7), S.tailLen * 0.45), add3(p, dxy(ta), S.tailLen * 0.2), add3(p, dxy(ta + 0.7), S.tailLen * 0.45)], colour: "limb", bias: 0.01 });
    }
    // Fins: a fish's on its back, and a pair under it where limbs will be.
    if (swim) {
      const mid = Math.floor(n / 2), back = backAt(mid);
      parts.push({ poly: [add3(spine[Math.max(0, mid - 1)], back, girth[mid] * 0.8), add3(spine[mid], back, girth[mid] * 1.7), add3(spine[Math.min(n, mid + 1)], back, girth[mid] * 0.8)], colour: "limb", bias: 0.002 });
      for (const i of S.pairs >= 2 ? [n - 1, 1] : S.pairs >= 1 ? [1] : []) {
        for (const side of [-1, 1]) {
          const root = add3(add3(spine[i], backAt(i), -girth[i] * 0.7), Z, side * girth[i] * 0.6);
          parts.push({ poly: [root, add3(root, dxy(trunkA + Math.PI * 0.75), S.upper * 0.6), add3(add3(root, dxy(trunkA + Math.PI * 0.95), S.upper * 0.45), Z, side * 0.05)], colour: "limb", leg: true });
        }
      }
    }

    /* Seen from the angle: turned by yaw, tilted by pitch; z2 is how far. */
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const view = ([x, y, z]) => { const x1 = x * cy - z * sy, z1 = x * sy + z * cy; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
    // ...and sheared so its length lies along the scene's perspective
    // (verticals stay vertical): `shear` is set by the scene (orientGrownItems).
    const flat = (p) => { const v = view(p); return [v[0], v[1] + v[0] * shear]; };
    const depthOf = (pts) => pts.reduce((s, p) => s + view(p)[2], 0) / pts.length;
    const trunkDepth = depthOf(spine);
    const hull2 = (pts) => {
      const P = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
      const lo = [], hi = [];
      for (const p of P) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of P.slice().reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
      return lo.slice(0, -1).concat(hi.slice(0, -1));
    };
    const items = [];
    for (const part of parts) {
      if (part.trunk) {
        // The union of the trunk's spheres as seen: each a disc; its outline
        // the farthest edge of any disc along rays from their middle.
        const discs = part.trunk.map((b) => ({ c: flat(b.c), r: b.r }));
        const m = discs.reduce((s, d) => [s[0] + d.c[0] / discs.length, s[1] + d.c[1] / discs.length], [0, 0]);
        const outline = [];
        for (let k = 0; k < 40; k++) {
          const t0 = (k / 40) * Math.PI * 2, u = [Math.cos(t0), Math.sin(t0)];
          let far = 0;
          for (const d of discs) {
            const ox = d.c[0] - m[0], oy = d.c[1] - m[1], along = ox * u[0] + oy * u[1], off2 = ox * ox + oy * oy - along * along;
            if (off2 < d.r * d.r) far = Math.max(far, along + Math.sqrt(d.r * d.r - off2));
          }
          outline.push([m[0] + u[0] * far, m[1] + u[1] * far]);
        }
        items.push({ poly: outline, colour: part.colour, texture: part.texture, smooth: true, depth: trunkDepth });
      } else if (part.line) items.push({ line: part.line.map(flat), width: part.width, colour: part.colour, depth: depthOf(part.line) + (part.bias || 0) });
      else if (part.poly) {
        const d = depthOf(part.poly);
        items.push({ poly: part.poly.map(flat), colour: part.leg && d > trunkDepth ? "far" : part.colour, tone: part.tone || 0, smooth: false, depth: d + (part.bias || 0) });
      } else if (part.hull) items.push({ poly: hull2(part.hull.map(flat)), colour: part.colour, tone: part.tone || 0, smooth: true, depth: depthOf(part.hull) + (part.bias || 0) });
      else if (part.ball) { const [x, y] = flat(part.ball.c); items.push({ ellipse: [x, y, part.ball.r, part.ball.r], colour: part.colour, tone: part.tone || 0, depth: depthOf([part.ball.c]) + (part.bias || 0) }); }
      else if (part.eye) {
        // Behind the head from here: not seen.
        if (view(part.eye.c)[2] > view(part.eye.centre)[2] - part.eye.r * 0.2) continue;
        const [x, y] = flat(part.eye.c), r = part.eye.r, d = depthOf([part.eye.c]) + part.bias;
        items.push({ ellipse: [x, y, r, r], colour: "accent", tone: 0.3, depth: d }, { ellipse: [x + r * 0.15, y, r * 0.5, r * 0.6], colour: "eye", tone: 0, depth: d - 0.001 });
      } else if (part.group) {
        const d = depthOf(part.group.flatMap((l) => l.line));
        const colour = d > trunkDepth ? "far" : "limb";
        part.group.forEach((l, k) => items.push({ line: l.line.map(flat), width: l.width, colour, depth: d - k * 1e-4, foot: k === 2 ? flat(part.foot) : null, which: part.which }));
      }
    }
    items.sort((p, q) => q.depth - p.depth);
    const anatomy = bones.map((b) => {
      const far = b.leg && depthOf([b.a, b.b]) > trunkDepth;
      return { k: far ? (b.k === "leg" ? "far" : b.k) : b.k, a: flat(b.a), b: flat(b.b), r: b.r };
    });
    // The eye, last of all, is part of the anatomy too.
    const eyeItem = items.find((it) => it.colour === "eye");
    if (eyeItem) anatomy.push({ k: "eye", a: [eyeItem.ellipse[0], eyeItem.ellipse[1]], b: [eyeItem.ellipse[0], eyeItem.ellipse[1]], r: eyeItem.ellipse[2] * 2 });
    // Stood on the ground: tilted so the lowest front and rear feet are level
    // (side on enough for there to be a front and a back to level).
    if (!sit && !legs.some((l) => l.wing) && Math.abs(cy) > 0.5 && Math.abs(pitch) < 0.3) {
      const lowest = (which) => items.filter((it) => it.foot && it.which === which).reduce((best, it) => (!best || it.foot[1] > best[1] ? it.foot : best), null);
      const f = lowest("front"), r = lowest("rear");
      if (f && r) {
        // The line from the rear foot to the front one, made level.
        let dx = f[0] - r[0], dy = f[1] - r[1];
        if (dx < 0) { dx = -dx; dy = -dy; }
        const t = Math.atan2(dy, dx);
        if (Math.abs(t) < 0.6 && Math.abs(t) > 0.01) rotateItems(items, -t, anatomy);
      }
    }
    /* Its shadow, if a light is given (a direction toward it, in the scene:
     * x across, y up negative, z into the picture): every part of the body
     * carried along the light onto the ground it stands on, and seen from the
     * same angle - so the shadow has its legs, tail and head, and says what
     * the thing is even when the thing itself is painted loosely. */
    const shadow = [];
    if (light && !swim) {
      // The light's travel, from the scene into the body's own frame.
      const wx = -light[0], wy = -light[1], wz = -light[2];
      const L = [wx * cy + wz * sy, Math.max(0.18, wy), -wx * sy + wz * cy];
      const ground = Math.max(...legs.filter((l) => !l.wing).map((l) => legPoints(l)[3][1]), ...balls.map((b) => b.c[1] + b.r));
      const onGround = (p) => { const t = (ground - p[1]) / L[1]; return [p[0] + L[0] * t, ground, p[2] + L[2] * t]; };
      const disc = (c, r) => {
        // A sphere's shadow: a disc on the ground, drawn out along the light.
        const s = onGround(c), hx = L[0], hz = L[2], hl = Math.hypot(hx, hz) || 1, stretch = Math.min(3, 1 / L[1]);
        const pts = [];
        for (let k = 0; k < 12; k++) {
          const t = (k / 12) * Math.PI * 2, a = Math.cos(t) * r * stretch, b = Math.sin(t) * r;
          pts.push(flat([s[0] + (hx / hl) * a - (hz / hl) * b, ground, s[2] + (hz / hl) * a + (hx / hl) * b]));
        }
        return pts;
      };
      for (const b of balls) shadow.push({ poly: hull2(disc(b.c, b.r)) });
      shadow.push({ poly: hull2(disc(cranium, cr)) });
      shadow.push({ line: [shoulder, neckEnd].map((p) => flat(onGround(p))), width: neckW });
      for (const part of parts) {
        if (part.group) for (const l of part.group.slice(0, 3)) shadow.push({ line: l.line.map((p) => flat(onGround(p))), width: l.width });
        else if (part.line && part.bias === 0.01) shadow.push({ line: part.line.map((p) => flat(onGround(p))), width: part.width });
      }
    }
    const entry = fitItems(g, items, swim, anatomy, shadow);
    // What it was grown from and how it is seen, so it can be turned again
    // (a painting's perspective; the garden's views; a learned word).
    entry.genome = g; entry.pose = pose; entry.yaw = yaw; entry.pitch = pitch; entry.shear = shear;
    return entry;
  }
  function rotateItems(items, angle, anatomy = []) {
    const c = Math.cos(angle), s = Math.sin(angle), r = ([x, y]) => [x * c - y * s, x * s + y * c];
    for (const part of anatomy) { part.a = r(part.a); part.b = r(part.b); }
    for (const it of items) {
      if (it.line) it.line = it.line.map(r);
      if (it.poly) it.poly = it.poly.map(r);
      if (it.ellipse) { const [x, y] = r(it.ellipse); it.ellipse = [x, y, it.ellipse[2], it.ellipse[3]]; }
    }
  }
  /* Fitted into a box, in the order drawn. */
  function fitItems(g, items, swim, anatomy = [], shadow = []) {
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
      // In the box's units (r in parts of its width).
      anatomy: anatomy.map((p) => ({ k: p.k, a: U(p.a), b: U(p.b), r: +(p.r / bw).toFixed(4) })),
      // Its shadow, in the same units (it reaches outside the box).
      ...(shadow.length ? { shadow: shadow.map((p) => (p.poly ? { poly: p.poly.map(U) } : { line: p.line.map(U), width: +(p.width / bw).toFixed(4) })) } : {}),
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

  /* The shadow of a grown body as it was drawn (its genes, pose and angle on
   * the entry), under a light (a direction toward it, in the scene). */
  function shadowOf(entry, light) {
    if (!entry?.genome?.spine?.on || !light) return null;
    return develop(entry.genome, { pose: entry.pose, yaw: entry.yaw || 0, pitch: entry.pitch || 0, shear: entry.shear || 0, light }).shadow || null;
  }

  global.HexfieldMorph = { PRIME_FORMS, PRIME_RELATIONS, POSES, shadowOf, randomGenome, cellGenome, develop, mutate, crossover, distance, primesOf, normalise };
})(typeof window !== "undefined" ? window : globalThis);
