/* Hexfield moiré.
 *
 * The hyperbolic plane - half of it, turned upside down or inside out - laid on
 * a surface and seen in three-point perspective. Gratings are drawn on it in
 * its own geometry: horocycles (its straight waves: rings the same distance
 * apart however far out they go) spaced in irrational ratios, and the paths of
 * a billiard ball in one of its circles, turned an irrational angle at every
 * bounce so that the path never closes. Where they overlap, foreshortened and
 * sampled by the pixel grid, they beat: moiré. The painter does not copy the
 * lines; it reads the moiré the way an eye does - what is left when the lines
 * are blurred away - and paints that. */
(function (global) {
  "use strict";
  const PHI = (1 + Math.sqrt(5)) / 2;
  // Numbers whose ratios never come out even: gratings spaced or turned by them never line up again, so their beats never repeat.
  const IRRATIONAL = { "√2": Math.SQRT2, "√3": Math.sqrt(3), "φ": PHI, "√5": Math.sqrt(5), "π": Math.PI, "e": Math.E, "ln 3": Math.log(3) };
  const GOLDEN_TURN = 2 * Math.PI / (PHI * PHI);

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const clamp255 = (v) => Math.max(0, Math.min(255, v | 0));
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ── The plane ─────────────────────────────────────────────────────────
   * Every point as the hyperboloid model has it: x² + y² − z² = −1, z > 0,
   * measured with the Minkowski product. The models a surface carries (the
   * disk, the half-plane, distance and angle from a centre) all come here, so
   * a grating is the same grating on any of them. */
  const mink = (a, b) => a[0] * b[0] + a[1] * b[1] - a[2] * b[2];
  const fromPolar = (rho, a) => { const s = Math.sinh(rho); return [s * Math.cos(a), s * Math.sin(a), Math.cosh(rho)]; };
  const fromDisk = (x, y) => { const r2 = x * x + y * y, k = 1 / (1 - r2); return [2 * x * k, 2 * y * k, (1 + r2) * k]; };
  const fromHalfPlane = (x, y) => { const q = x * x + y * y; return [x / y, (q - 1) / (2 * y), (q + 1) / (2 * y)]; };
  // The plane slid so that its centre lands on C (a boost toward C): a circle about the centre becomes a circle about C.
  function slideTo(C) {
    const rho = Math.acosh(Math.max(1, C[2])), phi = Math.atan2(C[1], C[0]), ch = Math.cosh(rho), sh = Math.sinh(rho), c = Math.cos(phi), s = Math.sin(phi);
    return (P) => {
      const along = P[0] * c + P[1] * s, across = -P[0] * s + P[1] * c, a2 = along * ch + P[2] * sh;
      return [a2 * c - across * s, a2 * s + across * c, along * sh + P[2] * ch];
    };
  }

  /* ── Surfaces: a 180° slice of the plane, inverted, standing in space ──
   * Each has a parameter domain (u, v), where a parameter point stands (pos,
   * y up) and which point of the plane it carries (plane). */
  const SURFACES = {
    // The hyperboloid itself, upside down: a dome whose flanks run out toward a cone; half of it, cut through its peak.
    dome: {
      name: "upside-down hyperboloid", u: [0, 2.2], v: [0, Math.PI],
      pos: (rho, a) => [Math.sinh(rho) * Math.cos(a), 1 - Math.cosh(rho), Math.sinh(rho) * Math.sin(a)],
      plane: (rho, a) => fromPolar(rho, a),
      view: { target: [0, -1.5, 1.6], yaw: 0.6, pitch: 0.62, dist: 11.5, fov: 0.78 },
    },
    // The pseudosphere (a horn of constant negative curvature), rim up and spike down; half of it, cut down its length.
    bell: {
      name: "upside-down pseudosphere", u: [0.02, 3.4], v: [0, Math.PI],
      pos: (t, a) => { const r = 2 / Math.cosh(t); return [r * Math.cos(a), -2 * (t - Math.tanh(t)), r * Math.sin(a)]; },
      // (Its angle runs along the half-plane's x, its height up the half-plane's y: the horocycles round its axis are y = constant.)
      plane: (t, a) => fromHalfPlane(a - Math.PI / 2, Math.cosh(t)),
      view: { target: [0, -2.2, 0.6], yaw: Math.PI + 0.6, pitch: 0.62, dist: 10.5, fov: 0.8 },
    },
    // A saddle turned over, carrying the Poincaré disk; half of the disk, so half of the saddle.
    saddle: {
      name: "upside-down saddle carrying the disk", u: [0, 0.992], v: [0, Math.PI],
      pos: (r, a) => { const x = r * Math.cos(a), z = r * Math.sin(a); return [3.2 * x, 1.7 * (z * z - x * x), 3.2 * z]; },
      plane: (r, a) => fromDisk(r * Math.cos(a), r * Math.sin(a)),
      view: { target: [0, -0.2, 1.3], yaw: Math.PI + 0.6, pitch: 0.62, dist: 9.5, fov: 0.8 },
    },
    // The disk turned inside out (inverted in its rim): its edge at infinity is now the arch's inner edge; the upper half stands as an arch.
    arch: {
      name: "inside-out disk standing as an arch", u: [1.012, 3.1], v: [0, Math.PI],
      pos: (s, a) => [1.6 * s * Math.cos(a), 1.6 * s * Math.sin(a), 0],
      plane: (s, a) => fromDisk(Math.cos(a) / s, Math.sin(a) / s),
      view: { target: [0, 2.3, 0], yaw: 0.6, pitch: -0.28, dist: 10.5, fov: 0.85 },
    },
  };

  /* ── Gratings, in the plane's own geometry ─────────────────────────────
   * horocycles: the rings around one point at infinity, every `every` apart
   * (the plane's plane waves); several, toward points turned from each other,
   * spaced by irrational ratios.
   * billiard: a ball going round inside a circle of the plane. In a circle
   * every chord of a path is the last one turned by the same angle; turned by
   * an irrational angle the path never closes, and its chords fill a ring
   * whose inner edge - the caustic - it never crosses. Two paths turned by
   * nearly the same angle beat against each other.
   * geodesics: a bundle of straight lines, turned and drifted irrationally. */
  function horocycles(at, every, phase = 0, width = 0.5) {
    return { type: "horocycles", at, cx: Math.cos(at), cy: Math.sin(at), every, phase, width };
  }
  // The straight line of the plane through two of its points, as the unit normal (Minkowski) of the plane through them and the origin.
  function lineThrough(A, B) {
    const c = cross(A, B), n = [c[0], c[1], -c[2]], q = mink(n, n);
    return q > 1e-12 ? n.map((x) => x / Math.sqrt(q)) : null;
  }
  function billiard(centre, radius, turn, count, width, start = 0) {
    const C = fromPolar(centre[0], centre[1]), slide = slideTo(C), normals = [];
    for (let k = 0; k < count; k++) {
      const n = lineThrough(slide(fromPolar(radius, start + k * turn)), slide(fromPolar(radius, start + (k + 1) * turn)));
      if (n) normals.push(n);
    }
    return { type: "billiard", C, coshR: Math.cosh(radius), normals, sinhWidth: Math.sinh(width), radius, turn, width };
  }
  // waves: ripples spreading from one point of the plane - circles about it, `every` apart.
  function waves(source, every, phase = 0, width = 0.5) {
    return { type: "waves", S: fromPolar(source[0], source[1]), every, phase, width };
  }
  function geodesics(count, turn, drift, reach, width, start = 0) {
    const normals = [];
    for (let j = 0; j < count; j++) {
      const beta = start + j * turn, s = reach * ((j * drift) % 1);
      normals.push([Math.cosh(s) * Math.cos(beta), Math.cosh(s) * Math.sin(beta), Math.sinh(s)]);
    }
    return { type: "geodesics", normals, sinhWidth: Math.sinh(width), width };
  }
  /* One grating at a point of the plane: on or off there, its lines moved by
   * `shift` - in its own spacings for rings and ripples, a little way across
   * for a path's chords. (Shifts are how the sims move each other: interact.) */
  const CHORD_SHIFT = 0.08;
  function lineAt(f, P, shift = 0) {
    if (f.type === "horocycles" || f.type === "waves") {
      const d = f.type === "waves" ? Math.acosh(Math.max(1, -mink(P, f.S))) : Math.log(P[2] - P[0] * f.cx - P[1] * f.cy);
      const t = d / f.every + f.phase + shift;
      return Math.abs(t - Math.round(t)) < f.width / 2 ? 1 : 0;
    }
    if (f.type === "billiard" && -mink(P, f.C) > f.coshR) return 0;
    const off = shift * CHORD_SHIFT;
    for (const n of f.normals) if (Math.abs(P[0] * n[0] + P[1] * n[1] - P[2] * n[2] + off) < f.sinhWidth) return 1;
    return 0;
  }
  // Ink at a point of the plane: each grating on or off there (moved by its shift, if it has one), overlapped as the genome says.
  function inkAt(P, g, shifts = null) {
    let ink = 0;
    for (let i = 0; i < g.families.length; i++) {
      const on = lineAt(g.families[i], P, shifts ? shifts[i] : 0);
      ink = g.overlap === "or" ? Math.max(ink, on) : g.overlap === "and" ? (ink && on ? 1 : 0) : ink ^ on;
    }
    return ink;
  }

  /* ── Three-point perspective ───────────────────────────────────────────
   * A pinhole camera raised (or lowered) and turned: tipped, it makes the
   * verticals meet at a third point above or below the picture. */
  function camera(view, W, H) {
    const { target, yaw, pitch, dist, fov } = view;
    const eye = [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
    const fwd = unit(sub(target, eye)), right = unit(cross(fwd, [0, 1, 0])), up = cross(right, fwd);
    const f = (Math.min(W, H) / 2) / Math.tan(fov / 2);
    return { eye, fwd, right, up, f, W, H };
  }
  const LIGHT = unit([-0.45, 0.8, 0.5]);

  /* ── The picture of the surface ────────────────────────────────────────
   * The surface as a fine mesh, drawn into buffers a pixel at a time: for each
   * pixel the nearest point of the surface (its parameters, interpolated in
   * perspective) and how the light falls on it. The grating is then worked
   * out at each pixel from the plane point there - one sample a pixel, so
   * where the lines fall finer than the pixels the grid itself beats with them.
   * Framed by the lens shifted and zoomed - how much of the picture the
   * surface fills and where it sits - which keeps the perspective as it is, as
   * a view camera's shift does. */
  const FRAME = { fill: 0.84, dx: 0, dy: 0 };
  function rasterize(surface, view, W, H, frame = FRAME, NU = 180, NV = 180) {
    const cam = camera(view, W, H), n = W * H;
    const depth = new Float32Array(n).fill(Infinity), U = new Float32Array(n), V = new Float32Array(n), shade = new Float32Array(n), cover = new Uint8Array(n);
    const nu = NU + 1, nv = NV + 1, m = nu * nv;
    const sx = new Float32Array(m), sy = new Float32Array(m), iz = new Float32Array(m), pu = new Float32Array(m), pv = new Float32Array(m), sh = new Float32Array(m);
    const [u0, u1] = surface.u, [v0, v1] = surface.v, du = (u1 - u0) / NU, dv = (v1 - v0) / NV;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const k = i * nv + j, u = u0 + i * du, v = v0 + j * dv, p = surface.pos(u, v);
      // (Its slope both ways, for which way it faces: the light on it, from either side.)
      const e = 1e-4, a = sub(surface.pos(Math.min(u + e, u1), v), surface.pos(Math.max(u - e, u0), v)), b = sub(surface.pos(u, Math.min(v + e, v1)), surface.pos(u, Math.max(v - e, v0)));
      let nrm = cross(a, b);
      if (!(Math.hypot(nrm[0], nrm[1], nrm[2]) > 1e-12)) nrm = [0, 1, 0];
      nrm = unit(nrm);
      const d = sub(p, cam.eye), zc = dot(d, cam.fwd);
      sx[k] = W / 2 + cam.f * dot(d, cam.right) / zc;
      sy[k] = H / 2 - cam.f * dot(d, cam.up) / zc;
      iz[k] = zc > 0.05 ? 1 / zc : 0;
      pu[k] = u; pv[k] = v;
      sh[k] = 0.3 + 0.7 * Math.abs(dot(nrm, LIGHT));
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let k = 0; k < m; k++) if (iz[k]) { x0 = Math.min(x0, sx[k]); x1 = Math.max(x1, sx[k]); y0 = Math.min(y0, sy[k]); y1 = Math.max(y1, sy[k]); }
    // (On a tall screen a wide surface may run off the sides - up to half again as big - rather than sit as a strip across the middle.)
    const fill = frame.fill ?? FRAME.fill, byW = W * fill / (x1 - x0), byH = H * fill / (y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const k0 = W < H * 0.8 && byW < byH ? Math.min(byH, byW * 1.5) : Math.min(byW, byH);
    const ox = W / 2 + (frame.dx || 0) * W, oy = H / 2 + (frame.dy || 0) * H;
    for (let k = 0; k < m; k++) { sx[k] = ox + (sx[k] - cx) * k0; sy[k] = oy + (sy[k] - cy) * k0; }
    const tri = (a, b, c) => {
      if (!iz[a] || !iz[b] || !iz[c]) return;
      const area = (sx[b] - sx[a]) * (sy[c] - sy[a]) - (sy[b] - sy[a]) * (sx[c] - sx[a]);
      if (Math.abs(area) < 1e-9) return;
      const bx0 = Math.max(0, Math.floor(Math.min(sx[a], sx[b], sx[c]))), bx1 = Math.min(W - 1, Math.ceil(Math.max(sx[a], sx[b], sx[c])));
      const by0 = Math.max(0, Math.floor(Math.min(sy[a], sy[b], sy[c]))), by1 = Math.min(H - 1, Math.ceil(Math.max(sy[a], sy[b], sy[c])));
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const wa = ((sx[c] - sx[b]) * (py - sy[b]) - (sy[c] - sy[b]) * (px - sx[b])) / area;
        const wb = ((sx[a] - sx[c]) * (py - sy[c]) - (sy[a] - sy[c]) * (px - sx[c])) / area;
        const wc = 1 - wa - wb;
        if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) continue;
        const q = wa * iz[a] + wb * iz[b] + wc * iz[c], z = 1 / q, o = y * W + x;
        if (z >= depth[o]) continue;
        depth[o] = z;
        const ka = wa * iz[a] / q, kb = wb * iz[b] / q, kc = wc * iz[c] / q;
        U[o] = ka * pu[a] + kb * pu[b] + kc * pu[c];
        V[o] = ka * pv[a] + kb * pv[b] + kc * pv[c];
        shade[o] = ka * sh[a] + kb * sh[b] + kc * sh[c];
        cover[o] = 1;
      }
    };
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = i * nv + j, b = (i + 1) * nv + j, c = (i + 1) * nv + j + 1, d = i * nv + j + 1;
      tri(a, b, c); tri(a, c, d);
    }
    return { W, H, depth, U, V, shade, cover };
  }
  /* ── Sims acting on each other ─────────────────────────────────────────
   * Each grating's beats move the other gratings' lines: where one crowds,
   * another's lines slide over (by how much, and which way, couple[i][j]:
   * grating j's beats on grating i's lines; 0 leaves it alone). Worked out on
   * a small picture - the beats are broad, so a small one holds them - over a
   * few rounds back and forth: each round every grating is drawn with its
   * lines moved by the others' beats from the round before, and blurred into
   * beats of its own again. What comes back is how far each grating's lines
   * have been moved, all over the picture. */
  function interact(surface, view, frame, g, W, H, sigma, rounds = 3) {
    const k = Math.min(1, 200 / Math.max(W, H)), w = Math.max(32, Math.round(W * k)), h = Math.max(24, Math.round(H * k)), n = w * h, F = g.families.length;
    const r = rasterize(surface, view, w, h, frame, 90, 90), P = new Array(n), cov = new Float32Array(n);
    for (let o = 0; o < n; o++) if (r.cover[o]) { P[o] = surface.plane(r.U[o], r.V[o]); cov[o] = 1; }
    const sig = Math.max(1, sigma * k), bc = blur(cov, w, h, sig), shifts = g.families.map(() => new Float32Array(n)), ink = new Float32Array(n);
    for (let round = 0; round < rounds; round++) {
      const beats = g.families.map((f, i) => {
        for (let o = 0; o < n; o++) ink[o] = P[o] ? lineAt(f, P[o], shifts[i][o]) : 0;
        const b = blur(ink, w, h, sig);
        let sum = 0, m = 0;
        for (let o = 0; o < n; o++) if (cov[o] && bc[o] > 0.05) { b[o] /= bc[o]; sum += b[o]; m++; } else b[o] = 0;
        const mean = m ? sum / m : 0;
        for (let o = 0; o < n; o++) if (cov[o]) b[o] -= mean;
        return b;
      });
      for (let i = 0; i < F; i++) {
        shifts[i].fill(0);
        for (let j = 0; j < F; j++) {
          const c = g.couple?.[i]?.[j] || 0;
          if (i === j || !c) continue;
          for (let o = 0; o < n; o++) shifts[i][o] += 2 * c * beats[j][o];
        }
      }
    }
    return { w, h, shifts };
  }
  // A small picture's value at a pixel of the full one, read between its four nearest.
  function sample(field, w, h, x, y) {
    const fx = Math.min(w - 1.001, Math.max(0, x)), fy = Math.min(h - 1.001, Math.max(0, y)), x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0, o = y0 * w + x0;
    return (field[o] * (1 - tx) + field[o + 1] * tx) * (1 - ty) + (field[o + w] * (1 - tx) + field[o + w + 1] * tx) * ty;
  }
  // The raw moiré: ink at every covered pixel, from the plane point there - its gratings moved by each other first, if they act on each other.
  function raw(genome, W, H, sigma = 6 * Math.min(W, H) / 390) {
    const surface = SURFACES[genome.surface], view = { ...surface.view, ...genome.view }, frame = { ...FRAME, ...genome.frame };
    const r = rasterize(surface, view, W, H, frame), ink = new Float32Array(W * H);
    const acting = genome.couple?.some((row) => row.some((c) => c)) ? interact(surface, view, frame, genome, W, H, sigma, genome.rounds || 3) : null;
    const shifts = acting ? new Float32Array(genome.families.length) : null, sx = acting ? acting.w / W : 0, sy = acting ? acting.h / H : 0;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o++) {
      if (!r.cover[o]) continue;
      if (acting) for (let i = 0; i < shifts.length; i++) shifts[i] = sample(acting.shifts[i], acting.w, acting.h, (x + 0.5) * sx - 0.5, (y + 0.5) * sy - 0.5);
      ink[o] = inkAt(surface.plane(r.U[o], r.V[o]), genome, shifts);
    }
    return { ...r, ink, acting };
  }

  /* ── Reading the moiré ─────────────────────────────────────────────────
   * What an eye sees in a moiré is not its lines but their beats - what
   * survives a blur too wide for the lines. A blur over the covered part only
   * (so the edge of the surface does not read as a beat): `beat` as it comes
   * out (how crowded the lines are, 0 to 1), `M` stretched to its full range,
   * and `coarse` the same at two and a half times the width, for the big
   * strokes that go down first. */
  function boxBlur(src, W, H, r) {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), w = 2 * r + 1;
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        tmp[y * W + x] = s / w;
        s += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        out[y * W + x] = s / w;
        s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
      }
    }
    return out;
  }
  const blur = (src, W, H, sigma) => { const r = Math.max(1, Math.round(sigma * 0.87)); return boxBlur(boxBlur(boxBlur(src, W, H, r), W, H, r), W, H, r); };
  function beatAt(R, sigma, coverBlur = null) {
    const { W, H, ink, cover } = R, n = W * H, bi = blur(ink, W, H, sigma);
    let bc = coverBlur;
    if (!bc) { const c = new Float32Array(n); for (let o = 0; o < n; o++) c[o] = cover[o]; bc = blur(c, W, H, sigma); }
    const out = new Float32Array(n);
    for (let o = 0; o < n; o++) out[o] = cover[o] && bc[o] > 0.05 ? bi[o] / bc[o] : 0;
    return out;
  }
  function stretch(R, B) {
    const { cover } = R, vals = [];
    for (let o = 0; o < B.length; o++) if (cover[o]) vals.push(B[o]);
    vals.sort((a, b) => a - b);
    const lo = vals[Math.floor(vals.length * 0.02)] ?? 0, hi = vals[Math.floor(vals.length * 0.98)] ?? 1, out = new Float32Array(B.length);
    for (let o = 0; o < B.length; o++) out[o] = cover[o] ? Math.min(1, Math.max(0, (B[o] - lo) / Math.max(1e-6, hi - lo))) : 0;
    return out;
  }
  function reading(R, sigma) {
    const beat = beatAt(R, sigma), coarseBeat = beatAt(R, sigma * 2.5);
    return { sigma, beat, coarseBeat, M: stretch(R, beat), coarse: stretch(R, coarseBeat) };
  }
  const read = (R, sigma) => reading(R, sigma).M;

  /* ── Painting what was read ────────────────────────────────────────────
   * Strokes laid along the beats - each follows the band it starts in, across
   * the way the moiré changes, and stops where the band ends - big ones first
   * from the wide reading, then smaller ones from the fine one, coloured by how
   * crowded the lines are there and lit as the surface is lit. The lines
   * themselves are not drawn: the painting is of what they make.
   * Its colours are always the same family - paper, slate, ink and one
   * vermilion where the lines crowd most; a painting's style only moves where
   * the vermilion starts, how warm the paper is, how far paint strays past the
   * edge of the surface and how big the brush is. */
  const STYLE = { accent: 0.9, warmth: 0.6, spill: 0.15, stroke: 1 };
  function palette(style = STYLE) {
    const w = style.warmth ?? STYLE.warmth, a = Math.min(0.97, Math.max(0.8, style.accent ?? STYLE.accent));
    const mix = (c, d) => [c[0] + (d[0] - c[0]) * w, c[1] + (d[1] - c[1]) * w, c[2] + (d[2] - c[2]) * w];
    const paper = mix([231, 229, 222], [238, 226, 205]), grey = mix([180, 180, 174], [192, 180, 158]);
    return {
      ground: paper.map((v) => v * 0.955 | 0),
      stops: [[0, paper], [0.3, grey], [0.55, [104, 116, 134]], [a - 0.1, [36, 41, 56]], [a, [150, 62, 44]], [1, [198, 88, 58]]],
    };
  }
  function ramp(t, pal) {
    const stops = pal.stops;
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [t0, a] = stops[i - 1], [t1, b] = stops[i], k = (t - t0) / Math.max(1e-6, t1 - t0);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    return stops[stops.length - 1][1];
  }
  // The strokes, in the order they are laid: { pts, rgb, width, alpha, hair }.
  function strokes(R, read, seed = 1, style = STYLE) {
    const fine = read.M || read, coarse = read.coarse || fine, pal = palette(style);
    const { W, H, cover, shade } = R, rng = mulberry32(seed), at = (x, y) => (Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, x | 0)));
    const s = Math.min(W, H) / 480 * (style.stroke ?? 1), out = [];
    for (const pass of [{ step: 15, len: 44, width: 15, alpha: 0.42, M: coarse }, { step: 8, len: 26, width: 7, alpha: 0.6, M: fine }, { step: 4.5, len: 13, width: 2.6, alpha: 0.8, M: fine }]) {
      const M = pass.M, grad = (x, y) => [M[at(x + 2, y)] - M[at(x - 2, y)], M[at(x, y + 2)] - M[at(x, y - 2)]];
      const seeds = [], step = pass.step * s;
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) seeds.push([x + (rng() - 0.5) * step, y + (rng() - 0.5) * step]);
      for (let i = seeds.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [seeds[i], seeds[j]] = [seeds[j], seeds[i]]; }
      for (const [x0, y0] of seeds) {
        const o0 = at(x0, y0);
        if (!cover[o0]) continue;
        const m0 = M[o0], pts = [[x0, y0]];
        // (Along the band both ways from where it starts: across the way the beat changes.)
        for (const sign of [1, -1]) {
          let x = x0, y = y0, prev = null;
          for (let k = 0; k < pass.len * s / 2; k += 1.5 * s) {
            const [gx, gy] = grad(x, y), l = Math.hypot(gx, gy);
            let dx = l > 1e-5 ? -gy / l : 1, dy = l > 1e-5 ? gx / l : 0;
            if (prev && dx * prev[0] + dy * prev[1] < 0) { dx = -dx; dy = -dy; }
            prev = [dx, dy];
            x += sign * dx * 1.5 * s; y += sign * dy * 1.5 * s;
            const o = at(x, y);
            if (!cover[o] || Math.abs(M[o] - m0) > 0.18) break;
            sign > 0 ? pts.push([x, y]) : pts.unshift([x, y]);
          }
        }
        if (pts.length === 1) pts.push([x0 + 0.1, y0]);
        const c = ramp(m0, pal), lit = 0.62 + 0.38 * shade[o0];
        out.push({ pts, rgb: [c[0] * lit | 0, c[1] * lit | 0, c[2] * lit | 0], width: pass.width * s * (0.75 + 0.5 * rng()), alpha: pass.alpha, hair: rng() < 0.5 ? -1 : 1 });
      }
    }
    return out;
  }
  // The ground is painted too: a few broad, faint, nearly level strokes in the paper's own tones.
  function groundStrokes(W, H, seed = 1, style = STYLE) {
    const rng = mulberry32(seed ^ 0x9e3779b9), pal = palette(style), out = [], s = Math.min(W, H) / 480;
    for (let i = 0; i < 46; i++) {
      const y = rng() * H, x = rng() * W, len = (0.25 + rng() * 0.5) * W, tilt = (rng() - 0.5) * 0.08, shift = (rng() - 0.5) * 14;
      out.push({ pts: [[x - len / 2, y - tilt * len / 2], [x + len / 2, y + tilt * len / 2]], rgb: pal.ground.map((v) => clamp255(v + shift)), width: (18 + rng() * 40) * s, alpha: 0.18, hair: 1 });
    }
    return out;
  }
  function path(ctx, pts, ox, oy) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
  }
  // A stroke: its body, then two hairs of it a little off its line and off its colour - the marks a loaded brush leaves.
  function drawStroke(ctx, k) {
    const [r, g, b] = k.rgb, pts = k.pts;
    ctx.lineWidth = k.width;
    ctx.strokeStyle = `rgba(${r},${g},${b},${(k.alpha * 0.72).toFixed(3)})`;
    path(ctx, pts, 0, 0);
    ctx.stroke();
    if (k.width < 3) return;
    const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1], l = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l, ny = (x1 - x0) / l;
    for (const side of [-0.28, 0.3]) {
      const shift = 11 * Math.sign(side) * (k.hair || 1);
      ctx.lineWidth = k.width * 0.3;
      ctx.strokeStyle = `rgba(${clamp255(r + shift)},${clamp255(g + shift)},${clamp255(b + shift)},${(k.alpha * 0.5).toFixed(3)})`;
      path(ctx, pts, nx * side * k.width, ny * side * k.width);
      ctx.stroke();
    }
  }
  // Where the surface is, as a picture's alpha (its edge softened by a pixel), to keep the paint on it.
  function maskImage(R, img) {
    const { W, H, cover } = R, c = new Float32Array(W * H);
    for (let o = 0; o < c.length; o++) c[o] = cover[o];
    const b = boxBlur(c, W, H, 1), d = img.data;
    for (let o = 0; o < c.length; o++) { d[4 * o] = d[4 * o + 1] = d[4 * o + 2] = 0; d[4 * o + 3] = Math.round(255 * b[o]); }
    return img;
  }
  const canvasOf = (W, H) => { if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(W, H); const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  /* The painting at once (for sheets): the ground, then the strokes on a layer
   * of their own, laid over the ground a little (paint straying past the edge)
   * and then kept to the surface, so its edge is found where the light found it. */
  function paint(ctx, R, read, seed = 1, style = STYLE) {
    const { W, H } = R, pal = palette(style), layer = canvasOf(W, H), lg = layer.getContext("2d");
    ctx.fillStyle = `rgb(${pal.ground.join(",")})`;
    ctx.fillRect(0, 0, W, H);
    for (const g of [ctx, lg]) { g.lineCap = "round"; g.lineJoin = "round"; }
    for (const k of groundStrokes(W, H, seed, style)) drawStroke(ctx, k);
    for (const k of strokes(R, read, seed, style)) drawStroke(lg, k);
    compose(ctx, layer, R, style);
  }
  // The layer over the picture: a little of it anywhere (the spill), then all of it where the surface is. (Mask and scratch canvases can be passed in to be used again, frame after frame.)
  function compose(ctx, layer, R, style = STYLE, mask = null, kept = null) {
    const { W, H } = R, spill = style.spill ?? STYLE.spill;
    if (spill > 0) { ctx.globalAlpha = spill; ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1; }
    if (!mask) { mask = canvasOf(W, H); mask.getContext("2d").putImageData(maskImage(R, new ImageData(W, H)), 0, 0); }
    kept = kept || canvasOf(W, H);
    const kg = kept.getContext("2d");
    kg.globalCompositeOperation = "source-over";
    kg.clearRect(0, 0, W, H);
    kg.drawImage(layer, 0, 0);
    kg.globalCompositeOperation = "destination-in";
    kg.drawImage(mask, 0, 0);
    kg.globalCompositeOperation = "source-over";
    ctx.drawImage(kept, 0, 0);
  }
  // The raw moiré as pixels: ink on paper, lit as the surface is lit; the background a flat tone.
  function rawImage(R, img) {
    const { W, H, ink, cover, shade } = R, d = img.data;
    for (let o = 0; o < W * H; o++) {
      let v = 214;
      if (cover[o]) v = ink[o] ? 28 : 236 * (0.55 + 0.45 * shade[o]);
      d[4 * o] = v; d[4 * o + 1] = v * 0.98; d[4 * o + 2] = v * 0.94; d[4 * o + 3] = 255;
    }
    return img;
  }
  function readImage(R, M, img) {
    const { W, H, cover } = R, d = img.data, m = M.M || M;
    for (let o = 0; o < W * H; o++) {
      const v = cover[o] ? 245 - 225 * m[o] : 214;
      d[4 * o] = v; d[4 * o + 1] = v * 0.98; d[4 * o + 2] = v * 0.94; d[4 * o + 3] = 255;
    }
    return img;
  }

  global.HexfieldMoire = {
    PHI, IRRATIONAL, GOLDEN_TURN, SURFACES, FRAME, STYLE, mink, fromPolar, fromDisk, fromHalfPlane, slideTo, lineThrough,
    horocycles, billiard, waves, geodesics, lineAt, inkAt, interact, camera, rasterize, raw, blur, beatAt, reading, read, palette, ramp,
    strokes, groundStrokes, drawStroke, maskImage, canvasOf, paint, compose, rawImage, readImage, mulberry32,
    get GROUND() { return `rgb(${palette().ground.join(",")})`; },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
