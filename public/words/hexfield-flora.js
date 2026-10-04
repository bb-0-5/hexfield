/* Plants grown from rules, before they have a name.
 * ---------------------------------------------------------------------------
 *
 * The plant counterpart of hexfield-morph.js. A genome is a small rule set
 * - is there a stem that carries water (vascular), how it branches and at
 * what angle, how leaves are set round it (alternate, opposite, whorled,
 * spiral), what kind of leaf (none, scale, needle, frond, broad, blade, fan),
 * and how it reproduces (spores, cones, flowers - and then petals, heads,
 * umbels, a lip) - and `develop` grows it into the visual dictionary's
 * drawing format. Every plant begins as one green cell; the population that
 * breeds them (app.js, "Morphology") climbs the plant tree from there
 * (hexfield-phylo.js says where on it a plant stands).
 */
(function (global) {
  "use strict";

  const LEAVES = ["none", "scale", "needle", "frond", "broad", "blade", "fan"];
  const REPRO = ["spores", "cones", "flowers"];
  const SETS = ["alternate", "opposite", "whorled", "spiral"];
  const PETAL_SHAPES = ["round", "pointed", "long"];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const gauss = (rng) => (rng() + rng() + rng() - 1.5) / 0.5;
  const pickOf = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

  /* The first plant: one green cell. Nothing else switched on. */
  function cellGenome(rng) {
    return {
      kind: "plant",
      cell: { size: 0.5 + rng() * 0.3, wobble: rng() * 0.15, flagella: rng() < 0.6 ? 2 : 0 },
      vascular: false, height: 0.15, wood: 0,
      branching: { depth: 0, angle: 0.5 + rng() * 0.4, ratio: 0.7, apical: 0.6, set: "alternate", whorl: 3, curl: (rng() - 0.5) * 0.3 },
      filament: 0,
      leaf: { type: "none", size: 0.3, aspect: 2.2, lobes: 0, serrate: false, leaflets: 0, density: 0.6 },
      repro: "spores",
      // Rules nothing uses yet ride along unseen, varying, until a flower
      // comes to use them.
      flower: { petals: 5, shape: "round", size: 0.25, composite: false, rays: 16, bilateral: false, umbel: false,
        h: Math.floor(rng() * 360), s: 55 + Math.floor(rng() * 35), l: 50 + Math.floor(rng() * 25), centre: 40 + Math.floor(rng() * 20) },
      colour: { leaf: 110 + Math.floor(rng() * 30), stem: 30, sat: 45 + Math.floor(rng() * 20), light: 38 + Math.floor(rng() * 10) },
      size: 0.35,
    };
  }

  const copy = (g) => JSON.parse(JSON.stringify(g));
  function normalise(g) { return g; }

  /* ── Growth ─────────────────────────────────────────────────────────── */
  function leafPolygon(type, L, len, aspect, lobes, serrate) {
    // A leaf along +x from (0,0), `len` long: points of its outline.
    const pts = [];
    const n = 14, w = len / aspect;
    if (type === "needle") return [[0, -w * 0.12], [len, 0], [0, w * 0.12]];
    if (type === "scale") return [[0, -w * 0.5], [len * 0.9, 0], [0, w * 0.5]];
    if (type === "fan") {
      for (let i = 0; i <= n; i++) { const a = -0.9 + (i / n) * 1.8; pts.push([Math.cos(a) * len, Math.sin(a) * len * 0.9]); }
      pts.push([0, 0]);
      return pts;
    }
    if (type === "blade") return [[0, -w * 0.18], [len * 0.7, -w * 0.15], [len, 0], [len * 0.7, w * 0.15], [0, w * 0.18]];
    // broad: an almond, with lobes and teeth if the rules say so
    for (let side of [-1, 1]) {
      const seg = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        let r = Math.sin(Math.PI * t) * w * 0.5;
        if (lobes) r *= 0.75 + 0.35 * Math.abs(Math.sin(Math.PI * t * (lobes + 1)));
        if (serrate && i % 2) r *= 1.12;
        seg.push([t * len, side * r]);
      }
      if (side > 0) seg.reverse();
      pts.push(...seg);
    }
    return pts;
  }

  function develop(genome, view = {}) {
    const g = normalise(genome);
    const out = { polys: [], lines: [], dots: [] };
    const leafC = "leaf";
    // One green cell, or a few: no stem, no leaves.
    if (!g.vascular && g.leaf.type === "none" && !(g.filament > 0)) {
      const r = g.cell.size * 0.5, pts = [];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const k = 1 + g.cell.wobble * Math.sin(3 * a + 1.3); pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]); }
      out.polys.push({ pts, colour: leafC, tone: 0 });
      out.dots.push({ cx: r * 0.15, cy: -r * 0.1, r: r * 0.28, colour: leafC, tone: -0.15 });
      for (let f = 0; f < g.cell.flagella; f++) out.lines.push({ pts: [[0, -r * 0.95], [(f ? 1 : -1) * r * 0.5, -r * 1.6], [(f ? 1 : -1) * r * 0.3, -r * 2.2]], width: 0.02, colour: leafC });
      return fit(g, out);
    }
    // Algae: green filaments - cells in a row, branching a little.
    if (!g.vascular && g.leaf.type === "none") {
      const strands = 1 + Math.round(g.filament * 4);
      for (let s = 0; s < strands; s++) {
        const pts = [[0, 0]];
        let x = 0, y = 0, a = -Math.PI / 2 + (s - (strands - 1) / 2) * 0.35;
        for (let i = 0; i < 8; i++) { a += Math.sin(i * 1.7 + s) * 0.25 + g.branching.curl * 0.2; x += Math.cos(a) * 0.14; y += Math.sin(a) * 0.14; pts.push([x, y]); }
        out.lines.push({ pts, width: 0.05, colour: leafC });
        for (const [px, py] of pts.slice(1)) out.dots.push({ cx: px, cy: py, r: 0.035, colour: leafC, tone: 0.1 });
      }
      return fit(g, out);
    }
    // Everything else stands on a stem and branches, in three dimensions.
    return develop3(g, view);
  }

  /* ── Growing in three dimensions ───────────────────────────────────────
   * A plant on a stem grows in space, not on a page: each fork spreads round
   * its stem (by the golden angle, as real shoots do), leaves are set round
   * the stem by their arrangement - alternate, opposite, whorled, spiral -
   * each blade lying across the stem, and flowers face outward and up. Then
   * it is seen from an angle, like a grown creature (hexfield-morph.js):
   * turned (yaw) and from above or below (pitch), farther parts first; and
   * under a light its shadow is every stem, leaf and flower carried along the
   * light onto the ground - a tree's shadow has its trunk and branches and
   * the dapple of its leaves. y is down (the ground at 0), z into the
   * picture. */
  const GOLDEN = 2.39996;
  const v3 = {
    add: (p, d, k = 1) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k],
    lerp: (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; },
  };
  // v turned about the unit axis k by t (Rodrigues).
  const turnAbout = (v, k, t) => {
    const c = Math.cos(t), s = Math.sin(t), d = v3.dot(k, v), x = v3.cross(k, v);
    return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
  };
  const across = (d) => v3.norm(v3.cross(d, Math.abs(d[1]) < 0.9 ? [0, -1, 0] : [1, 0, 0]));
  // d leant away from itself by `angle`, the lean turned round d by `round`.
  const leanFrom = (d, angle, round) => v3.norm(turnAbout(turnAbout(d, across(d), angle), d, round));
  const UP = [0, -1, 0];

  function develop3(g, { yaw = 0, pitch = 0, shear = 0, light = null } = {}) {
    const B = g.branching, L = g.leaf, F = g.flower;
    const parts = [];   // 3D: { line, width, colour } | { poly, colour, tone, leaf } | { dot, r, colour, tone }
    const leafC = "leaf", stemC = "stem";
    const fleshy = g.vascular && L.type === "none";
    // (Returns how many pieces it drew, for the budget.)
    const leafAt = (p, ld, stemDir, k) => {
      if (L.type === "none") return 0;
      const len = (L.type === "frond" ? 0.5 : 0.18) * (0.6 + L.size) * k;
      // The blade's breadth lies across the stem.
      let fv = v3.cross(ld, stemDir);
      fv = Math.hypot(...fv) < 1e-3 ? across(ld) : v3.norm(fv);
      if (L.type === "frond") {
        const pts = [p];
        let q = p, aa = ld;
        const pin = Math.max(4, Math.round(6 + L.leaflets * 6));
        for (let i = 1; i <= pin; i++) {
          aa = v3.norm(turnAbout(aa, fv, 0.06));
          q = v3.add(q, aa, len / pin); pts.push(q);
          const pl = len * 0.22 * (1 - i / (pin + 2));
          for (const side of [-1, 1]) parts.push({ line: [q, v3.add(q, v3.norm(v3.add(v3.add([0, 0, 0], aa, Math.cos(1.2)), fv, side * Math.sin(1.2))), pl)], width: 0.012, colour: leafC });
        }
        parts.push({ line: pts, width: 0.014, colour: leafC });
        return pin * 2 + 1;
      }
      const shape = leafPolygon(L.type, L, len, L.aspect, L.lobes, L.serrate);
      const put = (o, dirL, scale = 1) => {
        let fl = v3.cross(dirL, stemDir);
        fl = Math.hypot(...fl) < 1e-3 ? fv : v3.norm(fl);
        parts.push({ poly: shape.map(([u, v]) => v3.add(v3.add(o, dirL, u * scale), fl, v * scale)), colour: leafC, tone: 0, leaf: true });
      };
      const leaflets = L.type === "broad" ? Math.round(L.leaflets * 3) : 0;
      if (leaflets) {
        for (let i = 0; i <= leaflets; i++) {
          const o = v3.add(p, ld, len * (i + 0.5) / (leaflets + 1));
          for (const side of [-1, 1]) put(o, v3.norm(v3.add(v3.add([0, 0, 0], ld, Math.cos(0.9)), fv, side * Math.sin(0.9))), 0.45);
        }
        parts.push({ line: [p, v3.add(p, ld, len)], width: 0.01, colour: stemC });
        return (leaflets + 1) * 2 + 1;
      }
      put(p, ld);
      return 1;
    };
    const tips = [];
    // A budget: a whorled plant five forks deep would be thousands of
    // branches; past this many stems it stops forking, past this many leaf
    // pieces (a frond is a dozen) it stops leafing (it still flowers).
    let stems = 160, leaves = 900, petals = 500;
    const grow = (p, d, len, w, depth, gen, spin) => {
      stems--;
      const bend = turnAbout(d, across(d), B.curl * 0.3);
      const mid = v3.add(p, bend, len * 0.5), end = v3.add(mid, d, len * 0.5);
      parts.push({ line: [p, mid, end], width: w, colour: fleshy || !g.vascular ? leafC : stemC });
      const nodes = Math.max(1, Math.round(2 + L.density * 4 * len));
      for (let i = 1; i <= nodes; i++) {
        const np = v3.lerp(p, end, i / (nodes + 1)), t = i / (nodes + 1);
        const rounds = B.set === "opposite" ? [spin + i * Math.PI / 2, spin + i * Math.PI / 2 + Math.PI]
          : B.set === "whorled" ? Array.from({ length: B.whorl }, (_, k) => spin + i * 0.5 + (k / B.whorl) * Math.PI * 2)
          : B.set === "spiral" ? [spin + i * GOLDEN] : [spin + i * Math.PI];
        for (const r of rounds) if (leaves > 0) leaves -= leafAt(np, leanFrom(d, 0.9, r), d, 0.7 + 0.3 * (1 - t));
      }
      if (depth <= 0 || stems <= 0) { tips.push([end, d]); return; }
      const kids = B.set === "whorled" ? Math.max(2, B.whorl) : 2;
      for (let k = 0; k < kids; k++) {
        grow(end, leanFrom(d, B.angle, spin + gen * GOLDEN + (k / kids) * Math.PI * 2), len * B.ratio * (1 - B.apical * 0.3), w * 0.7, depth - 1, gen + 1, spin + GOLDEN * (k + 1));
      }
      if (B.apical > 0.45) grow(end, leanFrom(d, Math.abs(B.curl) * 0.1, spin), len * B.ratio, w * 0.8, depth - 1, gen + 1, spin + GOLDEN);
    };
    const height = g.vascular ? 0.4 + g.height * 1.2 : 0.18;
    const trunkW = fleshy ? 0.1 + g.wood * 0.04 : (g.vascular ? 0.02 + g.wood * 0.08 : 0.015);
    const depth = g.vascular ? Math.max(0, Math.min(5, B.depth)) : 0;
    if (!g.vascular) {
      // Moss: a low cushion of tiny upright shoots, round as well as across.
      for (let s = 0; s < 9; s++) {
        const a = s * GOLDEN, r = 0.03 + 0.06 * Math.sqrt(s / 9);
        grow([Math.cos(a) * r, 0, Math.sin(a) * r], leanFrom(UP, 0.15 + 0.2 * Math.sqrt(s / 9), a), 0.16 + 0.03 * Math.cos(s), 0.012, 0, 0, a);
      }
    } else grow([0, 0, 0], UP, height / (1 + (depth ? B.ratio : 0) * 1.4), trunkW, depth, 0, 0);
    // What it makes at its tips: spore heads, cones or flowers.
    for (const [t, d] of tips) {
      if (g.repro === "spores" && g.vascular && L.type === "scale") parts.push({ dot: t, r: 0.035, colour: stemC, tone: 0.1 });
      else if (!g.vascular) { const q = v3.add(t, UP, 0.08); parts.push({ line: [t, q], width: 0.008, colour: stemC }, { dot: v3.add(q, UP, 0.01), r: 0.012, colour: stemC, tone: 0 }); }
      else if (g.repro === "cones") {
        const cl = 0.09 + F.size * 0.1;
        for (let k = 0; k < 5; k++) parts.push({ dot: v3.add(t, d, cl * k / 5), r: cl * 0.28 * (1 - k / 8), colour: stemC, tone: -0.05 - k * 0.02 });
      } else if (g.repro === "flowers") {
        const r = 0.05 + F.size * 0.16;
        // It faces outward and up.
        const face = v3.norm(v3.add(d, UP, 0.8));
        if (F.umbel) {
          for (let k = 0; k < 9; k++) {
            const sp = leanFrom(face, 0.9, k * GOLDEN), q = v3.add(t, sp, r * 1.4);
            parts.push({ line: [t, q], width: 0.006, colour: stemC }, { dot: q, r: r * 0.22, colour: "petal", tone: 0 });
          }
          continue;
        }
        // (Petals are budgeted too: past it, a flower is its centre alone.)
        const n = petals > 0 ? (F.composite ? F.rays : F.petals) : 0;
        petals -= n;
        const side = across(face), up2 = v3.norm(v3.cross(face, side));
        for (let k = 0; k < n; k++) {
          let a = (k / n) * Math.PI * 2;
          const lip = F.bilateral && k === 0;
          if (F.bilateral) a = -Math.PI / 2 + (k / n - 0.5) * Math.PI * 1.6 + Math.PI;
          const pd = v3.norm(v3.add(v3.add([0, 0, 0], side, Math.cos(a)), up2, Math.sin(a)));
          const pw3 = v3.norm(v3.cross(face, pd));
          const pl = r * (F.composite ? 1.3 : F.shape === "long" ? 1.5 : 1) * (lip ? 1.5 : 1), pw = F.composite ? r * 0.16 : r * (F.shape === "pointed" ? 0.45 : 0.62);
          const shape = F.shape === "pointed" || F.composite ? [[0, -pw / 2], [pl, 0], [0, pw / 2]]
            : Array.from({ length: 10 }, (_, i) => { const tt = (i / 9) * Math.PI; return [Math.sin(tt / 2) * pl, Math.cos(tt) * pw / 2]; });
          parts.push({ poly: shape.map(([u, v]) => v3.add(v3.add(t, pd, u), pw3, v)), colour: "petal", tone: lip ? -0.1 : 0 });
        }
        parts.push({ dot: v3.add(t, face, 0.005), r: r * (F.composite ? 0.5 : 0.3), colour: "centre", tone: 0 });
      }
    }

    // Seen from the angle (as hexfield-morph.js's skeletons are).
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const view = ([x, y, z]) => { const x1 = x * cy - z * sy, z1 = x * sy + z * cy; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
    const flat = (p) => { const v = view(p); return [v[0], v[1] + v[0] * shear]; };
    const depthOf = (pts) => pts.reduce((s, p) => s + view(p)[2], 0) / pts.length;
    const items = parts.map((part) => {
      if (part.line) return { line: part.line.map(flat), width: part.width, colour: part.colour, depth: depthOf(part.line) };
      if (part.poly) return { poly: part.poly.map(flat), colour: part.colour, tone: part.tone || 0, smooth: !part.leaf || L.type === "broad", depth: depthOf(part.poly) };
      const [x, y] = flat(part.dot);
      return { dot: [x, y, part.r], colour: part.colour, tone: part.tone || 0, depth: depthOf([part.dot]) - part.r * 0.5 };
    }).sort((p, q) => q.depth - p.depth);
    // Its shadow: everything carried along the light onto the ground (y 0).
    const shadow = [];
    if (light && g.vascular) {
      const wx = -light[0], wy = -light[1], wz = -light[2];
      const Ld = [wx * cy + wz * sy, Math.max(0.18, wy), -wx * sy + wz * cy];
      const onGround = (p) => { const t = (0 - p[1]) / Ld[1]; return [p[0] + Ld[0] * t, 0, p[2] + Ld[2] * t]; };
      for (const part of parts) {
        if (part.line) shadow.push({ line: part.line.map((p) => flat(onGround(p))), width: part.width });
        else if (part.poly) shadow.push({ poly: part.poly.map((p) => flat(onGround(p))) });
        else {
          const c = onGround(part.dot), pts = [];
          for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pts.push(flat([c[0] + Math.cos(a) * part.r, 0, c[2] + Math.sin(a) * part.r])); }
          shadow.push({ poly: pts });
        }
      }
    }
    return fit3(g, items, parts, flat, shadow, { yaw, pitch, shear });
  }

  /* Fitted into a box, in the order drawn, with its stems as anatomy and its
   * shadow (which reaches outside the box) in the same units. */
  function fit3(g, items, parts, flat, shadow, angle) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const it of items) {
      if (it.line) it.line.forEach(([x, y]) => take(x, y, it.width / 2));
      else if (it.poly) it.poly.forEach(([x, y]) => take(x, y));
      else take(it.dot[0], it.dot[1], it.dot[2]);
    }
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    // (Rounded by arithmetic: a tree is thousands of points, and string
    // rounding is slow.)
    const r4 = (v) => Math.round(v * 1e4) / 1e4;
    const U = ([x, y]) => [r4((x - x0) / bw), r4((y - y0) / bh)];
    const out = items.map((it) => {
      if (it.line) return { shape: "line", pts: it.line.map(U), width: r4(it.width / bw), colour: it.colour };
      if (it.poly) return { shape: "poly", smooth: it.smooth, pts: it.poly.map(U), colour: it.colour, tone: it.tone };
      const [cx, cy, r] = it.dot;
      return { shape: "ellipse", box: [r4((cx - r - x0) / bw), r4((cy - r - y0) / bh), r4(2 * r / bw), r4(2 * r / bh)], colour: it.colour, tone: it.tone };
    });
    const c = g.colour, F = g.flower;
    const anatomy = parts.filter((p) => p.line && p.line.length >= 2).flatMap((p) => p.line.slice(1).map((q, i) => ({ k: "stem", a: U(flat(p.line[i])), b: U(flat(q)), r: r4(p.width / 2 / bw) })));
    return {
      kind: "subject", anchor: "ground", size: clamp(g.size + (g.vascular ? g.height * 0.25 : 0), 0.12, 0.7),
      aspect: clamp(bw / bh, 0.2, 4), depth: 0.5,
      colours: {
        leaf: [c.leaf, c.sat, c.light], stem: [c.stem, clamp(c.sat - 15, 10, 80), clamp(c.light - 10, 12, 60)],
        petal: [F.h, F.s, F.l], centre: [(F.h + 60) % 360, 70, F.centre],
      },
      parts: out, grown: true, plant: true, anatomy,
      ...(shadow.length ? { shadow: shadow.map((p) => (p.poly ? { poly: p.poly.map(U) } : { line: p.line.map(U), width: r4(p.width / bw) })) } : {}),
      genome: g, yaw: angle.yaw, pitch: angle.pitch, shear: angle.shear, turnable: true,
    };
  }

  function fit(g, out) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const take = (x, y, pad = 0) => { x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad); };
    for (const p of out.polys) p.pts.forEach(([x, y]) => take(x, y));
    for (const l of out.lines) l.pts.forEach(([x, y]) => take(x, y, l.width / 2));
    for (const d of out.dots) take(d.cx, d.cy, d.r);
    const bw = Math.max(1e-3, x1 - x0), bh = Math.max(1e-3, y1 - y0);
    const U = ([x, y]) => [+((x - x0) / bw).toFixed(4), +((y - y0) / bh).toFixed(4)];
    const parts = [];
    for (const l of out.lines) parts.push({ shape: "line", pts: l.pts.map(U), width: +(l.width / bw).toFixed(4), colour: l.colour });
    for (const p of out.polys) parts.push({ shape: "poly", smooth: !p.leaf || g.leaf.type === "broad", pts: p.pts.map(U), colour: p.colour, tone: p.tone || 0 });
    for (const d of out.dots) parts.push({ shape: "ellipse", box: [+((d.cx - d.r - x0) / bw).toFixed(4), +((d.cy - d.r - y0) / bh).toFixed(4), +(2 * d.r / bw).toFixed(4), +(2 * d.r / bh).toFixed(4)], colour: d.colour, tone: d.tone || 0 });
    const c = g.colour, F = g.flower;
    const single = !g.vascular && g.leaf.type === "none";
    return {
      kind: "subject", anchor: single ? "centre" : "ground", size: clamp(g.size + (g.vascular ? g.height * 0.25 : 0), 0.12, 0.7),
      aspect: clamp(bw / bh, 0.2, 4), depth: 0.5,
      colours: {
        leaf: [c.leaf, c.sat, c.light], stem: [c.stem, clamp(c.sat - 15, 10, 80), clamp(c.light - 10, 12, 60)],
        petal: [F.h, F.s, F.l], centre: [(F.h + 60) % 360, 70, F.centre],
      },
      parts, grown: true, plant: true,
      // Its stems, for a brush that follows them (in the box's units).
      anatomy: out.lines.flatMap((l) => l.pts.slice(1).map((q, i) => ({ k: "stem", a: U(l.pts[i]), b: U(q), r: +(l.width / 2 / bw).toFixed(4) }))),
    };
  }

  /* ── Inheritance ──────────────────────────────────────────────────── */
  const NUMERIC = [
    ["cell.size", 0.3, 0.9, 0.06], ["cell.wobble", 0, 0.3, 0.04], ["cell.flagella", 0, 2, 1, true],
    ["height", 0.05, 1.6, 0.12], ["wood", 0, 1, 0.1], ["filament", 0, 1, 0.15],
    ["branching.depth", 0, 5, 1, true], ["branching.angle", 0.15, 1.3, 0.1], ["branching.ratio", 0.5, 0.88, 0.04],
    ["branching.apical", 0, 1, 0.12], ["branching.whorl", 2, 6, 1, true], ["branching.curl", -0.8, 0.8, 0.12],
    ["leaf.size", 0.1, 1, 0.08], ["leaf.aspect", 1.2, 6, 0.4], ["leaf.lobes", 0, 3, 1, true], ["leaf.leaflets", 0, 1, 0.15], ["leaf.density", 0.1, 1, 0.1],
    ["flower.petals", 3, 12, 1, true], ["flower.size", 0.05, 1, 0.08], ["flower.rays", 8, 32, 3, true],
    ["flower.h", 0, 359, 25, true], ["flower.s", 30, 95, 8, true], ["flower.l", 35, 85, 6, true], ["flower.centre", 20, 70, 8, true],
    ["colour.leaf", 60, 160, 8, true], ["colour.stem", 15, 120, 10, true], ["colour.sat", 25, 75, 6, true], ["colour.light", 22, 60, 5, true],
    ["size", 0.2, 0.55, 0.04],
  ];
  const CATEGORICAL = [
    ["vascular", [true, false]], ["leaf.type", LEAVES], ["repro", REPRO], ["branching.set", SETS], ["leaf.serrate", [true, false]],
    ["flower.shape", PETAL_SHAPES], ["flower.composite", [true, false]], ["flower.bilateral", [true, false]], ["flower.umbel", [true, false]],
  ];
  const getAt = (o, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), o);
  const setAt = (o, path, value) => { const ks = path.split("."); const last = ks.pop(); ks.reduce((v, k) => v[k], o)[last] = value; };

  function mutate(genome, rng, rate = 0.25) {
    const g = copy(genome);
    for (const [path, lo, hi, step, int] of NUMERIC) {
      if (rng() > rate) continue;
      let v = Number(getAt(g, path)) + gauss(rng) * step;
      if (path === "flower.h") v = (v + 360) % 360;
      v = clamp(v, lo, hi);
      setAt(g, path, int ? Math.round(v) : +v.toFixed(4));
    }
    for (const [path, options] of CATEGORICAL) {
      if (rng() > rate * 0.3) continue;
      setAt(g, path, pickOf(rng, options));
    }
    return g;
  }
  const GROUPS = ["cell", "vascular", "height", "wood", "branching", "filament", "leaf", "repro", "flower", "colour", "size"];
  function crossover(a, b, rng) {
    const child = { kind: "plant" };
    for (const key of GROUPS) child[key] = copy((rng() < 0.5 ? a : b)[key]);
    return child;
  }
  function distance(a, b) {
    let d = 0, n = 0;
    for (const [path, lo, hi] of NUMERIC) {
      const x = Number(getAt(a, path)), y = Number(getAt(b, path));
      if (path === "flower.h") { const dh = Math.abs(x - y) % 360; d += Math.min(dh, 360 - dh) / 180 * 0.5; n += 0.5; continue; }
      d += Math.abs(x - y) / (hi - lo); n++;
    }
    for (const [path] of CATEGORICAL) { d += getAt(a, path) === getAt(b, path) ? 0 : 1.5; n += 1.5; }
    return d / n;
  }

  /* The shadow of a plant as it was drawn (its genes and angle on the entry),
   * under a light (a direction toward it, in the scene). */
  function shadowOf(entry, light) {
    if (!entry?.genome || !entry.turnable || !light) return null;
    return develop(entry.genome, { yaw: entry.yaw || 0, pitch: entry.pitch || 0, shear: entry.shear || 0, light }).shadow || null;
  }

  global.HexfieldFlora = { cellGenome, develop, shadowOf, mutate, crossover, distance, normalise, LEAVES, REPRO };
})(typeof window !== "undefined" ? window : globalThis);
