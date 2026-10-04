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

  function develop(genome) {
    const g = normalise(genome);
    const out = { polys: [], lines: [], dots: [] };
    const leafC = "leaf", stemC = "stem";
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
    // Everything else stands on a stem and branches.
    const B = g.branching, L = g.leaf;
    const height = g.vascular ? 0.4 + g.height * 1.2 : 0.18;
    // No leaves on a stem that carries water: the stem is the leaf - thick,
    // green and fleshy (a cactus).
    const fleshy = g.vascular && L.type === "none";
    const trunkW = fleshy ? 0.1 + g.wood * 0.04 : (g.vascular ? 0.02 + g.wood * 0.08 : 0.015);
    const tips = [];
    const leafAt = (x, y, a, k) => {
      if (L.type === "none") return;
      const len = (L.type === "frond" ? 0.5 : 0.18) * (0.6 + L.size) * k;
      if (L.type === "frond") {
        // A frond: a curved stalk with leaflets (pinnae) both sides.
        const pts = [[x, y]]; let px = x, py = y, aa = a;
        const pin = Math.max(4, Math.round(6 + L.leaflets * 6));
        for (let i = 1; i <= pin; i++) {
          aa += 0.06; px += Math.cos(aa) * len / pin; py += Math.sin(aa) * len / pin; pts.push([px, py]);
          const pl = len * 0.22 * (1 - i / (pin + 2));
          for (const side of [-1, 1]) out.lines.push({ pts: [[px, py], [px + Math.cos(aa + side * 1.2) * pl, py + Math.sin(aa + side * 1.2) * pl]], width: 0.012, colour: leafC });
        }
        out.lines.push({ pts, width: 0.014, colour: leafC });
        return;
      }
      const leaflets = L.type === "broad" ? Math.round(L.leaflets * 3) : 0;
      const shape = leafPolygon(L.type, L, len, L.aspect, L.lobes, L.serrate);
      const put = (ox, oy, ang, scale = 1) => out.polys.push({ pts: shape.map(([u, v]) => [ox + (u * Math.cos(ang) - v * Math.sin(ang)) * scale, oy + (u * Math.sin(ang) + v * Math.cos(ang)) * scale]), colour: leafC, tone: 0, leaf: true });
      if (leaflets) {
        // Compound: leaflets in pairs along a little stalk.
        for (let i = 0; i <= leaflets; i++) {
          const t = (i + 0.5) / (leaflets + 1), lx = x + Math.cos(a) * len * t, ly = y + Math.sin(a) * len * t;
          for (const side of [-1, 1]) put(lx, ly, a + side * 0.9, 0.45);
        }
        out.lines.push({ pts: [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], width: 0.01, colour: stemC });
      } else put(x, y, a);
    };
    const grow = (x, y, a, len, w, depth, gen) => {
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const mid = [x + Math.cos(a + B.curl * 0.3) * len * 0.5, y + Math.sin(a + B.curl * 0.3) * len * 0.5];
      out.lines.push({ pts: [[x, y], mid, [ex, ey]], width: w, colour: fleshy || !g.vascular ? leafC : stemC });
      // Leaves set along it.
      const nodes = Math.max(1, Math.round(2 + L.density * 4 * len));
      for (let i = 1; i <= nodes; i++) {
        const t = i / (nodes + 1), nx = x + (ex - x) * t, ny = y + (ey - y) * t;
        const sides = B.set === "opposite" ? [-1, 1] : B.set === "whorled" ? Array.from({ length: B.whorl }, (_, k) => k) : [i % 2 ? 1 : -1];
        sides.forEach((s, k) => {
          const off = B.set === "whorled" ? (k / B.whorl) * Math.PI * 2 : B.set === "spiral" ? i * 2.4 : 0;
          const la = a + (B.set === "whorled" || B.set === "spiral" ? Math.sin(off) * 1.1 + 0.15 : s * 0.9);
          leafAt(nx, ny, la, 0.7 + 0.3 * (1 - t));
        });
      }
      if (depth <= 0) { tips.push([ex, ey, a]); return; }
      // Branching: the leader goes on (apical dominance) and side branches fork off.
      const kids = B.set === "whorled" ? Math.max(2, B.whorl) : 2;
      for (let k = 0; k < kids; k++) {
        const side = kids === 2 ? (k ? 1 : -1) : (k / (kids - 1) - 0.5) * 2;
        grow(ex, ey, a + side * B.angle, len * B.ratio * (1 - B.apical * 0.3), w * 0.7, depth - 1, gen + 1);
      }
      if (B.apical > 0.45) grow(ex, ey, a + B.curl * 0.1, len * B.ratio, w * 0.8, depth - 1, gen + 1);
    };
    const depth = g.vascular ? Math.max(0, Math.min(5, B.depth)) : 0;
    const firstLen = height / (1 + (depth ? B.ratio : 0) * 1.4);
    if (!g.vascular) {
      // Moss: a low cushion of tiny upright shoots.
      for (let s = -3; s <= 3; s++) grow(s * 0.06, 0, -Math.PI / 2 + s * 0.12, 0.16 + 0.03 * Math.cos(s), 0.012, 0, 0);
    } else grow(0, 0, -Math.PI / 2, firstLen, trunkW, depth, 0);
    // What it makes at its tips: spore heads, cones or flowers.
    const F = g.flower;
    for (const [tx, ty, ta] of tips) {
      if (g.repro === "spores" && g.vascular && L.type === "scale") out.dots.push({ cx: tx, cy: ty, r: 0.035, colour: stemC, tone: 0.1 });
      else if (!g.vascular) out.lines.push({ pts: [[tx, ty], [tx, ty - 0.08]], width: 0.008, colour: stemC }), out.dots.push({ cx: tx, cy: ty - 0.09, r: 0.012, colour: stemC, tone: 0 });
      else if (g.repro === "cones") {
        const cl = 0.09 + F.size * 0.1;
        for (let k = 0; k < 5; k++) out.dots.push({ cx: tx + Math.cos(ta) * cl * k / 5, cy: ty + Math.sin(ta) * cl * k / 5, r: cl * 0.28 * (1 - k / 8), colour: stemC, tone: -0.05 - k * 0.02 });
      } else if (g.repro === "flowers") {
        const r = 0.05 + F.size * 0.16;
        if (F.umbel) {
          // An umbrella of small flowers on spokes from one point.
          for (let k = 0; k < 9; k++) { const sa = -Math.PI / 2 + (k / 8 - 0.5) * 2.2, sx = tx + Math.cos(sa) * r * 1.4, sy = ty + Math.sin(sa) * r * 1.4;
            out.lines.push({ pts: [[tx, ty], [sx, sy]], width: 0.006, colour: stemC }); out.dots.push({ cx: sx, cy: sy, r: r * 0.22, colour: "petal", tone: 0 }); }
          continue;
        }
        const n = F.composite ? F.rays : F.petals;
        for (let k = 0; k < n; k++) {
          let pa = (k / n) * Math.PI * 2 - Math.PI / 2;
          // A lip: one petal larger, the flower turned to one side (bilateral).
          const lip = F.bilateral && k === 0;
          if (F.bilateral) pa = -Math.PI / 2 + (k / n - 0.5) * Math.PI * 1.6 + Math.PI;
          const pl = r * (F.composite ? 1.3 : F.shape === "long" ? 1.5 : 1) * (lip ? 1.5 : 1), pw = F.composite ? r * 0.16 : r * (F.shape === "pointed" ? 0.45 : 0.62);
          const shape = F.shape === "pointed" || F.composite ? [[0, -pw / 2], [pl, 0], [0, pw / 2]]
            : Array.from({ length: 10 }, (_, i) => { const t = (i / 9) * Math.PI; return [Math.sin(t / 2) * pl, Math.cos(t) * pw / 2]; });
          out.polys.push({ pts: shape.map(([u, v]) => [tx + u * Math.cos(pa) - v * Math.sin(pa), ty + u * Math.sin(pa) + v * Math.cos(pa)]), colour: "petal", tone: lip ? -0.1 : 0 });
        }
        out.dots.push({ cx: tx, cy: ty, r: r * (F.composite ? 0.5 : 0.3), colour: "centre", tone: 0 });
      }
    }
    return fit(g, out);
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

  global.HexfieldFlora = { cellGenome, develop, mutate, crossover, distance, normalise, LEAVES, REPRO };
})(typeof window !== "undefined" ? window : globalThis);
