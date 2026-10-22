/* Hexfield moiré: a first sketch to plan around.
 *
 * The hyperbolic plane - half of it, turned upside down or inside out - laid on
 * a surface and seen in three-point perspective. Gratings are drawn on it in
 * its own geometry: horocycles (its straight waves: rings the same distance
 * apart however far out they go) spaced in irrational ratios, and bundles of
 * geodesics turned by irrational angles. Where they overlap, foreshortened and
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
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ── The plane ─────────────────────────────────────────────────────────
   * Every point as the hyperboloid model has it: x² + y² − z² = −1, z > 0.
   * The models a surface carries (the disk, the half-plane, polar distance
   * and angle) all come here, so a grating is the same grating on any of them. */
  const fromPolar = (rho, a) => { const s = Math.sinh(rho); return [s * Math.cos(a), s * Math.sin(a), Math.cosh(rho)]; };
  const fromDisk = (x, y) => { const r2 = x * x + y * y, k = 1 / (1 - r2); return [2 * x * k, 2 * y * k, (1 + r2) * k]; };
  const fromHalfPlane = (x, y) => { const q = x * x + y * y; return [x / y, (q - 1) / (2 * y), (q + 1) / (2 * y)]; };

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
   * spaced by irrational ratios. geodesics: a bundle of straight lines of the
   * plane, each turned from the last by an irrational angle and drifted out by
   * an irrational step, as a trajectory that never closes would lay them. */
  function horocycles(at, every, phase = 0, width = 0.5) {
    return { type: "horocycles", at, cx: Math.cos(at), cy: Math.sin(at), every, phase, width };
  }
  function geodesics(count, turn, drift, reach, width, start = 0) {
    const normals = [];
    for (let j = 0; j < count; j++) {
      const beta = start + j * turn, s = reach * ((j * drift) % 1);
      normals.push([Math.cosh(s) * Math.cos(beta), Math.cosh(s) * Math.sin(beta), Math.sinh(s)]);
    }
    return { type: "geodesics", normals, sinhWidth: Math.sinh(width), width };
  }
  // Ink at a point of the plane: each grating on or off there, the gratings overlapped as the genome says.
  function inkAt(P, g) {
    let ink = 0;
    for (const f of g.families) {
      let on = 0;
      if (f.type === "horocycles") {
        const t = Math.log(P[2] - P[0] * f.cx - P[1] * f.cy) / f.every + f.phase;
        on = Math.abs(t - Math.round(t)) < f.width / 2 ? 1 : 0;
      } else {
        for (const n of f.normals) if (Math.abs(P[0] * n[0] + P[1] * n[1] - P[2] * n[2]) < f.sinhWidth) { on = 1; break; }
      }
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
   * where the lines fall finer than the pixels the grid itself beats with them. */
  function rasterize(surface, view, W, H, NU = 180, NV = 180, frame = 0.84) {
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
    // (Framed: the lens shifted and zoomed so the surface fills the picture - a shift keeps the perspective as it is, as a view camera's does.)
    if (frame) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let k = 0; k < m; k++) if (iz[k]) { x0 = Math.min(x0, sx[k]); x1 = Math.max(x1, sx[k]); y0 = Math.min(y0, sy[k]); y1 = Math.max(y1, sy[k]); }
      const k0 = Math.min(W * frame / (x1 - x0), H * frame / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (let k = 0; k < m; k++) { sx[k] = W / 2 + (sx[k] - cx) * k0; sy[k] = H / 2 + (sy[k] - cy) * k0; }
    }
    const tri = (a, b, c) => {
      if (!iz[a] || !iz[b] || !iz[c]) return;
      const area = (sx[b] - sx[a]) * (sy[c] - sy[a]) - (sy[b] - sy[a]) * (sx[c] - sx[a]);
      if (Math.abs(area) < 1e-9) return;
      const x0 = Math.max(0, Math.floor(Math.min(sx[a], sx[b], sx[c]))), x1 = Math.min(W - 1, Math.ceil(Math.max(sx[a], sx[b], sx[c])));
      const y0 = Math.max(0, Math.floor(Math.min(sy[a], sy[b], sy[c]))), y1 = Math.min(H - 1, Math.ceil(Math.max(sy[a], sy[b], sy[c])));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
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
  // The raw moiré: ink at every covered pixel, from the plane point there.
  function raw(genome, W, H) {
    const surface = SURFACES[genome.surface], r = rasterize(surface, { ...surface.view, ...genome.view }, W, H);
    const ink = new Float32Array(W * H);
    for (let o = 0; o < ink.length; o++) if (r.cover[o]) ink[o] = inkAt(surface.plane(r.U[o], r.V[o]), genome);
    return { ...r, ink };
  }

  /* ── Reading the moiré ─────────────────────────────────────────────────
   * What an eye sees in a moiré is not its lines but their beats - what
   * survives a blur too wide for the lines. A blur over the covered part only
   * (so the edge of the surface does not read as a beat), stretched to its
   * full range: 0 where the lines thin out, 1 where they crowd. */
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
  function read(R, sigma) {
    const { W, H, ink, cover } = R, n = W * H, c = new Float32Array(n);
    for (let o = 0; o < n; o++) c[o] = cover[o];
    const bi = blur(ink, W, H, sigma), bc = blur(c, W, H, sigma), M = new Float32Array(n), vals = [];
    for (let o = 0; o < n; o++) if (cover[o] && bc[o] > 0.2) { M[o] = bi[o] / bc[o]; vals.push(M[o]); }
    vals.sort((a, b) => a - b);
    const lo = vals[Math.floor(vals.length * 0.02)] ?? 0, hi = vals[Math.floor(vals.length * 0.98)] ?? 1;
    for (let o = 0; o < n; o++) M[o] = cover[o] ? Math.min(1, Math.max(0, (M[o] - lo) / Math.max(1e-6, hi - lo))) : 0;
    return M;
  }

  /* ── Painting what was read ────────────────────────────────────────────
   * Strokes laid along the beats - each follows the band it starts in, across
   * the way the moiré changes, and stops where the band ends - big ones first,
   * then smaller, coloured by how crowded the lines are there and lit as the
   * surface is lit. The lines themselves are not drawn: the painting is of
   * what they make. */
  const RAMP = [[0, [234, 226, 211]], [0.3, [190, 180, 160]], [0.55, [104, 116, 134]], [0.8, [36, 41, 56]], [0.92, [150, 62, 44]], [1, [196, 86, 58]]];
  function ramp(t) {
    for (let i = 1; i < RAMP.length; i++) if (t <= RAMP[i][0]) {
      const [t0, a] = RAMP[i - 1], [t1, b] = RAMP[i], k = (t - t0) / (t1 - t0);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    return RAMP[RAMP.length - 1][1];
  }
  // The strokes, in the order they are laid: { pts, rgb, width, alpha }.
  function strokes(R, M, seed = 1) {
    const { W, H, cover, shade } = R, rng = mulberry32(seed), at = (x, y) => (Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, x | 0)));
    const grad = (x, y) => [M[at(x + 2, y)] - M[at(x - 2, y)], M[at(x, y + 2)] - M[at(x, y - 2)]];
    const s = Math.min(W, H) / 480, out = [];
    for (const pass of [{ step: 15, len: 44, width: 15, alpha: 0.42 }, { step: 8, len: 26, width: 7, alpha: 0.6 }, { step: 4.5, len: 13, width: 2.6, alpha: 0.8 }]) {
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
        const c = ramp(m0), lit = 0.62 + 0.38 * shade[o0];
        out.push({ pts, rgb: [c[0] * lit | 0, c[1] * lit | 0, c[2] * lit | 0], width: pass.width * s * (0.75 + 0.5 * rng()), alpha: pass.alpha });
      }
    }
    return out;
  }
  const GROUND = "rgb(226,219,205)";
  function drawStroke(ctx, k) {
    ctx.strokeStyle = `rgba(${k.rgb[0]},${k.rgb[1]},${k.rgb[2]},${k.alpha})`;
    ctx.lineWidth = k.width;
    ctx.beginPath();
    ctx.moveTo(k.pts[0][0], k.pts[0][1]);
    for (let i = 1; i < k.pts.length; i++) ctx.lineTo(k.pts[i][0], k.pts[i][1]);
    ctx.stroke();
  }
  function paint(ctx, R, M, seed = 1) {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, R.W, R.H);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const k of strokes(R, M, seed)) drawStroke(ctx, k);
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
    const { W, H, cover } = R, d = img.data;
    for (let o = 0; o < W * H; o++) {
      const v = cover[o] ? 245 - 225 * M[o] : 214;
      d[4 * o] = v; d[4 * o + 1] = v * 0.98; d[4 * o + 2] = v * 0.94; d[4 * o + 3] = 255;
    }
    return img;
  }

  global.HexfieldMoire = { PHI, IRRATIONAL, GOLDEN_TURN, SURFACES, GROUND, horocycles, geodesics, inkAt, camera, rasterize, raw, read, strokes, drawStroke, paint, rawImage, readImage, fromPolar, fromDisk, fromHalfPlane, mulberry32 };
})(typeof globalThis !== "undefined" ? globalThis : this);
