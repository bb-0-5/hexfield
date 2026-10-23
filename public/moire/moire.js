/* Hexfield moiré.
 *
 * The hyperbolic plane - half of it, turned upside down or inside out - laid on
 * a surface and seen in three-point perspective, or flat, as one of its own
 * maps (the Poincaré or the Klein disk) seen straight on. Gratings are drawn on it in
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
  const fromKlein = (x, y) => { const t = 1 / Math.sqrt(1 - x * x - y * y); return [x * t, y * t, t]; };
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
   * y up) and which point of the plane it carries (plane). The flat ones are
   * the plane's own maps, half of each, seen straight on (the camera square to
   * them, turned only in their own plane): no perspective, the picture is the map. */
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
    // The Poincaré disk, flat: true to angles; the plane crowds ever finer toward its rim, which is infinitely far away. Half of it.
    disk: {
      name: "half of the Poincaré disk, flat", flat: true, u: [0, 0.998], v: [0, Math.PI], reach: [0.9, 0.998],
      pos: (r, a) => [r * Math.cos(a), r * Math.sin(a), 0],
      plane: (r, a) => fromDisk(r * Math.cos(a), r * Math.sin(a)),
      view: { target: [0, 0.5, 0], yaw: 0, pitch: 0, dist: 8, fov: 0.6 },
    },
    // The Klein disk, flat: true to straight lines - the plane's lines are straight chords, its circles ellipses - and crowding harder toward the rim. Half of it.
    klein: {
      name: "half of the Klein disk, flat", flat: true, u: [0, 0.9998], v: [0, Math.PI], reach: [0.99, 0.9998],
      pos: (r, a) => [r * Math.cos(a), r * Math.sin(a), 0],
      plane: (r, a) => fromKlein(r * Math.cos(a), r * Math.sin(a)),
      view: { target: [0, 0.5, 0], yaw: 0, pitch: 0, dist: 8, fov: 0.6 },
    },
  };

  /* ── Structures: pillars of stacked pieces, arches between them ────────
   * A piece is one of the surfaces, turned to show the side its own view
   * shows (the bell and the saddle from inside), upright or upside down,
   * scaled to its pillar's width at its storey and set on the piece below it
   * with a little gap. The plane it carries is turned and slid (an isometry of
   * the plane), so each storey shows its own part of the same gratings: one
   * glaze over the whole structure. Pillars stand `span` times the width of
   * their tops apart along the row (and never so close their widest storeys
   * touch) - in a straight row, staggered back and forth, or stepping back one
   * after another, `depth` times that apart front to back - and an arch - the
   * inside-out disk - springs from each two neighbouring tops, turned to span
   * between them however far apart in depth, its feet solved to be just as
   * wide as the pieces they stand on. The ground is y = 0. */
  const FACING = { bell: Math.PI, saddle: Math.PI }, ARCH_OUT = 3.1, LAYOUTS = ["row", "zigzag", "steps"];
  // The plane turned by `turn` about its centre, then slid `slide` toward `dir`.
  function isometry(turn, slide, dir) {
    const c = Math.cos(turn), s = Math.sin(turn), to = slide > 1e-6 ? slideTo(fromPolar(slide, dir)) : null;
    return (P) => { const Q = [P[0] * c - P[1] * s, P[0] * s + P[1] * c, P[2]]; return to ? to(Q) : Q; };
  }
  // One piece: a surface turned (and flipped), scaled to `width`, its lowest point at height `base`, centred on (x, z) and turned `yaw` about the upright.
  function piece(key, { flip = false, width = 1, x = 0, z = 0, base = 0, yaw = 0, u = null, iso = null } = {}) {
    const S = SURFACES[key], [u0, u1] = u || S.u, [v0, v1] = S.v, f = FACING[key] || 0, cf = Math.cos(f), sf = Math.sin(f), fl = flip ? -1 : 1;
    const turn = (p) => [fl * (p[0] * cf + p[2] * sf), fl * p[1], -p[0] * sf + p[2] * cf];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
      const p = turn(S.pos(u0 + (u1 - u0) * i / 24, v0 + (v1 - v0) * j / 24));
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    const k = width / (x1 - x0), mx = (x0 + x1) / 2, cy = Math.cos(yaw), sy = Math.sin(yaw);
    return {
      key, flip, flat: S.flat, u: [u0, u1], v: [v0, v1], x, z, base, width, yaw, height: (y1 - y0) * k,
      pos: (a, b) => { const p = turn(S.pos(a, b)), lx = (p[0] - mx) * k, lz = p[2] * k; return [x + lx * cy + lz * sy, base + (p[1] - y0) * k, z - lx * sy + lz * cy]; },
      plane: iso ? (a, b) => iso(S.plane(a, b)) : S.plane,
    };
  }
  /* A structure from its plan - { pillars, stack: [{ key, flip }, ...] from the
   * ground up, taper, span, gap, layout, depth, slide, turn, vary } - as its
   * pieces (pillar by pillar from the ground up, then the arches), the middle
   * of its box, its size, and how far its footing reaches round that middle. */
  function structure(plan) {
    const pieces = [], P = plan.pillars, widths = plan.stack.map((_, k) => Math.pow(plan.taper, k)), top = widths[widths.length - 1];
    const spacing = Math.max(plan.span * top, Math.max(...widths) + 2 * plan.gap), depth = (plan.depth || 0) * spacing;
    // (Where each pillar stands: x along the row; z back from the front - none, every other one back, or each one further back.)
    const at = (p) => [(p - (P - 1) / 2) * spacing, plan.layout === "zigzag" ? -(p % 2) * depth : plan.layout === "steps" ? -p * depth : 0];
    let height = 0;
    for (let p = 0; p < P; p++) {
      let base = 0;
      const [x, z] = at(p);
      plan.stack.forEach(({ key, flip }, k) => {
        const iso = isometry(k * plan.turn + p * plan.vary, k * plan.slide, k * GOLDEN_TURN);
        const pc = piece(key, { flip, width: widths[k], x, z, base, iso });
        pieces.push(pc);
        base += pc.height + plan.gap;
      });
      height = base;
    }
    // (The arch's feet: centred on two tops and as wide as them - its inner edge where that puts it, between the rim at infinity and its outer edge - turned to face along the line between them.)
    const k = plan.stack.length;
    for (let p = 0; p + 1 < P; p++) {
      const [xa, za] = at(p), [xb, zb] = at(p + 1), d = Math.hypot(xb - xa, zb - za), span = d / top, sIn = ARCH_OUT * (span - 1) / (span + 1);
      pieces.push(piece("arch", { width: d * 2 * ARCH_OUT / (sIn + ARCH_OUT), x: (xa + xb) / 2, z: (za + zb) / 2, yaw: Math.atan2(-(zb - za), xb - xa), base: height, u: [sIn, ARCH_OUT],
        iso: isometry(k * plan.turn + p * plan.vary + 0.5, k * plan.slide, k * GOLDEN_TURN) }));
    }
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const pc of pieces) for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
      const q = pc.pos(pc.u[0] + (pc.u[1] - pc.u[0]) * i / 6, pc.v[0] + (pc.v[1] - pc.v[0]) * j / 6);
      for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], q[c]); hi[c] = Math.max(hi[c], q[c]); }
    }
    const centre = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    return { pieces, centre, size: Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), reach: Math.hypot(hi[0] - lo[0], hi[2] - lo[2]) / 2 };
  }

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
   * for a path's chords - and swollen or thinned by `swell`. (Shifts and swells
   * are how the sims act on each other: interact.) */
  const CHORD_SHIFT = 0.12;
  function lineAt(f, P, shift = 0, swell = 0) {
    if (f.type === "horocycles" || f.type === "waves") {
      const d = f.type === "waves" ? Math.acosh(Math.max(1, -mink(P, f.S))) : Math.log(P[2] - P[0] * f.cx - P[1] * f.cy);
      const t = d / f.every + f.phase + shift, width = swell ? Math.min(0.92, Math.max(0.08, f.width * (1 + 0.8 * swell))) : f.width;
      return Math.abs(t - Math.round(t)) < width / 2 ? 1 : 0;
    }
    if (f.type === "billiard" && -mink(P, f.C) > f.coshR) return 0;
    const off = shift * CHORD_SHIFT, reach = swell ? f.sinhWidth * Math.max(0.2, 1 + 0.8 * swell) : f.sinhWidth;
    for (const n of f.normals) if (Math.abs(P[0] * n[0] + P[1] * n[1] - P[2] * n[2] + off) < reach) return 1;
    return 0;
  }
  // How one sim's push lands on another's lines: moved across (shift), swollen or thinned (swell), or both.
  const pushOf = (mode, v) => (mode === "swell" ? [0, v] : mode === "both" ? [v, v] : [v, 0]);
  // Ink at a point of the plane: each grating on or off there (pushed by the others, if they act on it), overlapped as the genome says.
  function inkAt(P, g, pushes = null) {
    let ink = 0;
    for (let i = 0; i < g.families.length; i++) {
      const [shift, swell] = pushes ? pushOf(g.mode, pushes[i]) : [0, 0];
      const on = lineAt(g.families[i], P, shift, swell);
      ink = g.overlap === "or" ? Math.max(ink, on) : g.overlap === "and" ? (ink && on ? 1 : 0) : ink ^ on;
    }
    return ink;
  }

  /* ── Three-point perspective ───────────────────────────────────────────
   * A pinhole camera raised (or lowered) and turned: tipped, it makes the
   * verticals meet at a third point above or below the picture. (Square to a
   * flat map it is turned only about its own axis - roll - and the picture is
   * the map, scaled.) */
  function camera(view, W, H) {
    const { target, yaw, pitch, dist, fov, roll = 0 } = view;
    const eye = [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
    const fwd = unit(sub(target, eye)), r0 = unit(cross(fwd, [0, 1, 0])), u0 = cross(r0, fwd), c = Math.cos(roll), s = Math.sin(roll);
    const right = [r0[0] * c + u0[0] * s, r0[1] * c + u0[1] * s, r0[2] * c + u0[2] * s], up = [u0[0] * c - r0[0] * s, u0[1] * c - r0[1] * s, u0[2] * c - r0[2] * s];
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
   * Framed by the lens shifted and zoomed, which keeps the perspective as it
   * is, as a view camera's shift does: the whole silhouette in the middle of
   * the picture, `fill` of its width or of its height (whichever is tighter) -
   * never cut by the frame. */
  const FRAME = { fill: 0.84 }, MAX_FILL = 0.94;
  // Where a point of the world lands in the camera's picture (before framing), and how far in front of it.
  const project = (cam, W, H, p) => { const d = sub(p, cam.eye), zc = dot(d, cam.fwd); return [W / 2 + cam.f * dot(d, cam.right) / zc, H / 2 - cam.f * dot(d, cam.up) / zc, zc]; };
  // One piece's mesh, seen by the camera: where each corner lands, its depth, its parameters, where it is in the world and the light on it.
  function mesh(S, cam, W, H, NU, NV, light = LIGHT) {
    const nu = NU + 1, nv = NV + 1, m = nu * nv;
    const sx = new Float32Array(m), sy = new Float32Array(m), iz = new Float32Array(m), pu = new Float32Array(m), pv = new Float32Array(m), sh = new Float32Array(m);
    const wx = new Float32Array(m), wy = new Float32Array(m), wz = new Float32Array(m);
    const [u0, u1] = S.u, [v0, v1] = S.v, du = (u1 - u0) / NU, dv = (v1 - v0) / NV;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const k = i * nv + j, u = u0 + i * du, v = v0 + j * dv, p = S.pos(u, v);
      // (Its slope both ways, for which way it faces: the light on it, from either side.)
      const e = 1e-4, a = sub(S.pos(Math.min(u + e, u1), v), S.pos(Math.max(u - e, u0), v)), b = sub(S.pos(u, Math.min(v + e, v1)), S.pos(u, Math.max(v - e, v0)));
      let nrm = cross(a, b);
      if (!(Math.hypot(nrm[0], nrm[1], nrm[2]) > 1e-12)) nrm = S.flat ? [0, 0, 1] : [0, 1, 0];
      nrm = unit(nrm);
      const [x, y, zc] = project(cam, W, H, p);
      sx[k] = x; sy[k] = y; iz[k] = zc > 0.05 ? 1 / zc : 0;
      pu[k] = u; pv[k] = v; wx[k] = p[0]; wy[k] = p[1]; wz[k] = p[2];
      sh[k] = 0.3 + 0.7 * Math.abs(dot(nrm, light));
    }
    return { NU, NV, nv, m, sx, sy, iz, pu, pv, sh, wx, wy, wz };
  }
  /* A surface, or a structure's pieces, drawn into the same buffers (nearest
   * wins): for each pixel which piece is there, its parameters and its light.
   * Standing on the ground, the shadows it casts there are part of the
   * picture too: they are framed with it, so they are never cut either. */
  function rasterize(pieces, view, W, H, frame = FRAME, NU = 180, NV = 180, light = LIGHT, ground = null) {
    const list = Array.isArray(pieces) ? pieces : [pieces], cam = camera(view, W, H), n = W * H;
    const depth = new Float32Array(n).fill(Infinity), U = new Float32Array(n), V = new Float32Array(n), shade = new Float32Array(n), cover = new Uint8Array(n), which = new Uint8Array(n);
    // (Each piece's mesh as fine as its share of the picture needs.)
    const per = Math.sqrt(list.length), meshes = list.map((S) => mesh(S, cam, W, H, Math.max(24, Math.round(NU / per)), Math.max(24, Math.round(NV / per)), light));
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const box = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
    for (const g of meshes) for (let k = 0; k < g.m; k++) {
      if (g.iz[k]) box(g.sx[k], g.sy[k]);
      // (Where the sun throws this point onto the ground.)
      if (ground && light[1] > 0.05 && g.wy[k] >= 0) {
        const t = g.wy[k] / light[1], [x, y, zc] = project(cam, W, H, [g.wx[k] - t * light[0], 0, g.wz[k] - t * light[2]]);
        if (zc > 0.05) box(x, y);
      }
    }
    // (Every point of the surface lands inside the box round its mesh's corners, so that box fitted and centred is the silhouette fitted and centred.)
    const fill = Math.min(frame.fill ?? FRAME.fill, MAX_FILL), k0 = fill * Math.min(W / (x1 - x0), H / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    meshes.forEach((g, index) => {
      const { sx, sy, iz, pu, pv, sh, nv } = g;
      for (let k = 0; k < g.m; k++) { sx[k] = W / 2 + (sx[k] - cx) * k0; sy[k] = H / 2 + (sy[k] - cy) * k0; }
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
          which[o] = index;
        }
      };
      for (let i = 0; i < g.NU; i++) for (let j = 0; j < g.NV; j++) {
        const a = i * nv + j, b = (i + 1) * nv + j, c = (i + 1) * nv + j + 1, d = i * nv + j + 1;
        tri(a, b, c); tri(a, c, d);
      }
    });
    return { W, H, depth, U, V, shade, cover, piece: which, cam, frameMap: { k0, cx, cy }, meshes, light, ground };
  }
  /* ── Sims acting on each other ─────────────────────────────────────────
   * Each grating's beats move the other gratings' lines: where one crowds,
   * another's lines slide over (by how much, and which way, couple[i][j]:
   * grating j's beats on grating i's lines; 0 leaves it alone). Worked out on
   * a small picture - the beats are broad, so a small one holds them - over a
   * few rounds back and forth: each round every grating is drawn with its
   * lines moved by the others' beats from the round before, and blurred into
   * beats of its own again. What comes back is how hard each grating is
   * pushed, all over the picture (moving its lines across, swelling them, or
   * both, as the genome's mode says), how hard on average, and how much the
   * pushing changed the sims' own bands from what each makes alone. */
  function interact(pieces, view, frame, g, W, H, sigma, rounds = 3, light = LIGHT, ground = null) {
    const list = Array.isArray(pieces) ? pieces : [pieces];
    const k = Math.min(1, 200 / Math.max(W, H)), w = Math.max(32, Math.round(W * k)), h = Math.max(24, Math.round(H * k)), n = w * h, F = g.families.length;
    const r = rasterize(list, view, w, h, frame, 90, 90, light, ground), P = new Array(n), cov = new Float32Array(n);
    for (let o = 0; o < n; o++) if (r.cover[o]) { P[o] = list[r.piece[o]].plane(r.U[o], r.V[o]); cov[o] = 1; }
    const sig = Math.max(1, sigma * k), bc = blur(cov, w, h, sig), shifts = g.families.map(() => new Float32Array(n)), ink = new Float32Array(n);
    let alone = null, last = null;
    for (let round = 0; round < rounds; round++) {
      const beats = g.families.map((f, i) => {
        for (let o = 0; o < n; o++) { if (!P[o]) { ink[o] = 0; continue; } const [shift, swell] = pushOf(g.mode, shifts[i][o]); ink[o] = lineAt(f, P[o], shift, swell); }
        const b = blur(ink, w, h, sig);
        let sum = 0, m = 0;
        for (let o = 0; o < n; o++) if (cov[o] && bc[o] > 0.05) { b[o] /= bc[o]; sum += b[o]; m++; } else b[o] = 0;
        const mean = m ? sum / m : 0;
        for (let o = 0; o < n; o++) if (cov[o]) b[o] -= mean;
        return b;
      });
      // (The first round is each sim on its own, unpushed: what the rounds after it change is the interaction.)
      if (!round) alone = beats;
      last = beats;
      for (let i = 0; i < F; i++) {
        shifts[i].fill(0);
        for (let j = 0; j < F; j++) {
          const c = g.couple?.[i]?.[j] || 0;
          if (i === j || !c) continue;
          for (let o = 0; o < n; o++) shifts[i][o] += 2 * c * beats[j][o];
        }
      }
    }
    // How hard the sims pushed, and how much they changed each other's bands from what each would make alone - on average over the surface.
    let push = 0, changed = 0, m = 0;
    for (let o = 0; o < n; o++) if (cov[o]) { for (let i = 0; i < F; i++) { push += Math.abs(shifts[i][o]); changed += Math.abs(last[i][o] - alone[i][o]); } m += F; }
    return { w, h, shifts, push: m ? push / m : 0, changed: m && rounds > 1 ? changed / m : 0 };
  }
  // A small picture's value at a pixel of the full one, read between its four nearest.
  function sample(field, w, h, x, y) {
    const fx = Math.min(w - 1.001, Math.max(0, x)), fy = Math.min(h - 1.001, Math.max(0, y)), x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0, o = y0 * w + x0;
    return (field[o] * (1 - tx) + field[o + 1] * tx) * (1 - ty) + (field[o + w] * (1 - tx) + field[o + w + 1] * tx) * ty;
  }
  /* What a genome stands in front of the camera: a structure's pieces on the
   * ground, under its sun, its camera aimed at the middle of it from `dist`
   * times its size away and never below the ground - or one surface, as its
   * own view sees it, under the usual light. */
  function stage(genome) {
    if (genome.plan) {
      const st = structure(genome.plan), v = genome.view || {}, sun = genome.sun;
      const light = sun ? [Math.sin(sun.az) * Math.cos(sun.el), Math.sin(sun.el), Math.cos(sun.az) * Math.cos(sun.el)] : LIGHT, dist = st.size * (v.dist ?? 2.2);
      // (The eye kept above the ground, an eighth of the structure's size at least: looking up, it looks up from just above the ground.)
      const pitch = Math.max(v.pitch ?? -0.1, Math.asin(Math.max(-1, Math.min(1, (0.12 * st.size - st.centre[1]) / dist))));
      return { pieces: st.pieces, view: { target: st.centre, fov: 0.8, yaw: v.yaw ?? 0.3, pitch, dist }, light, ground: { centre: [st.centre[0], 0, st.centre[2]], radius: st.reach + 0.45 * st.size } };
    }
    // (A flat map reaches as near its rim as the genome says: the nearer, the finer the plane crowds there.)
    const base = SURFACES[genome.surface], surface = genome.reach ? { ...base, u: [base.u[0], Math.min(base.u[1], genome.reach)] } : base;
    return { pieces: [surface], view: { ...surface.view, ...genome.view }, light: LIGHT, ground: null };
  }
  // The raw moiré: ink at every covered pixel, from the plane point there - its gratings moved by each other first, if they act on each other.
  function raw(genome, W, H, sigma = 6 * Math.min(W, H) / 390) {
    const { pieces, view, light, ground } = stage(genome), frame = { ...FRAME, ...genome.frame };
    const r = rasterize(pieces, view, W, H, frame, 180, 180, light, ground), ink = new Float32Array(W * H);
    const acting = genome.couple?.some((row) => row.some((c) => c)) ? interact(pieces, view, frame, genome, W, H, sigma, genome.rounds || 3, light, ground) : null;
    const shifts = acting ? new Float32Array(genome.families.length) : null, sx = acting ? acting.w / W : 0, sy = acting ? acting.h / H : 0;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o++) {
      if (!r.cover[o]) continue;
      if (acting) for (let i = 0; i < shifts.length; i++) shifts[i] = sample(acting.shifts[i], acting.w, acting.h, (x + 0.5) * sx - 0.5, (y + 0.5) * sy - 0.5);
      ink[o] = inkAt(pieces[r.piece[o]].plane(r.U[o], r.V[o]), genome, shifts);
    }
    return { ...r, ink, acting, pieces };
  }

  /* ── Sun and shadow ────────────────────────────────────────────────────
   * The structure seen from its sun: on a grid square to the light, how near
   * the sun the nearest piece comes. A point of a piece, or of the ground, is
   * in shadow where a piece stands between it and the sun - softened over its
   * neighbours on the grid. Pieces are painted darker where they are in
   * shadow; the ground is a pool of tone round the structure, fading into
   * the paper, with the shadows it casts. (Only for painting: its eye judges
   * the glaze, not the light on it. A glaze changes neither the structure nor
   * its sun nor the camera, so the shadows worked out for its painting - `from`
   * - are its shadows too.) */
  function shadows(R, from = null, N = 384) {
    if (!R.ground || R.pool) return R;
    if (from?.sunlit && from.W === R.W && from.H === R.H) {
      for (let o = 0; o < R.shade.length; o++) R.shade[o] *= from.sunlit[o];
      R.pool = from.pool; R.shadow = from.shadow; R.sunlit = from.sunlit;
      return R;
    }
    const { W, H, cover, piece: which, U, V, shade, cam, frameMap: { k0, cx, cy }, meshes, light: L, ground, pieces } = R;
    const ref = Math.abs(L[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0], lu = unit(cross(ref, L)), lv = cross(L, lu);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const g of meshes) for (let k = 0; k < g.m; k++) {
      const a = g.wx[k] * lu[0] + g.wy[k] * lu[1] + g.wz[k] * lu[2], b = g.wx[k] * lv[0] + g.wy[k] * lv[1] + g.wz[k] * lv[2];
      a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b);
    }
    const pad = 0.02 * Math.max(a1 - a0, b1 - b0);
    a0 -= pad; a1 += pad; b0 -= pad; b1 += pad;
    const sa = (N - 1) / (a1 - a0), sb = (N - 1) / (b1 - b0), map = new Float32Array(N * N).fill(-Infinity);
    for (const g of meshes) {
      const ga = new Float32Array(g.m), gb = new Float32Array(g.m), gt = new Float32Array(g.m);
      for (let k = 0; k < g.m; k++) {
        ga[k] = (g.wx[k] * lu[0] + g.wy[k] * lu[1] + g.wz[k] * lu[2] - a0) * sa;
        gb[k] = (g.wx[k] * lv[0] + g.wy[k] * lv[1] + g.wz[k] * lv[2] - b0) * sb;
        gt[k] = g.wx[k] * L[0] + g.wy[k] * L[1] + g.wz[k] * L[2];
      }
      const tri = (a, b, c) => {
        const area = (ga[b] - ga[a]) * (gb[c] - gb[a]) - (gb[b] - gb[a]) * (ga[c] - ga[a]);
        if (Math.abs(area) < 1e-9) return;
        const i0 = Math.max(0, Math.floor(Math.min(ga[a], ga[b], ga[c]))), i1 = Math.min(N - 1, Math.ceil(Math.max(ga[a], ga[b], ga[c])));
        const j0 = Math.max(0, Math.floor(Math.min(gb[a], gb[b], gb[c]))), j1 = Math.min(N - 1, Math.ceil(Math.max(gb[a], gb[b], gb[c])));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const wa = ((ga[c] - ga[b]) * (j - gb[b]) - (gb[c] - gb[b]) * (i - ga[b])) / area, wb = ((ga[a] - ga[c]) * (j - gb[c]) - (gb[a] - gb[c]) * (i - ga[c])) / area, wc = 1 - wa - wb;
          if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) continue;
          const t = wa * gt[a] + wb * gt[b] + wc * gt[c], o = j * N + i;
          if (t > map[o]) map[o] = t;
        }
      };
      for (let i = 0; i < g.NU; i++) for (let j = 0; j < g.NV; j++) {
        const a = i * g.nv + j, b = (i + 1) * g.nv + j, c = (i + 1) * g.nv + j + 1, d = i * g.nv + j + 1;
        tri(a, b, c); tri(a, c, d);
      }
    }
    // How much of a point the sun reaches, 0 to 1 (nine neighbours on the grid; a little leeway so a piece does not shadow itself).
    const bias = 2.5 * Math.max(1 / sa, 1 / sb);
    const lit = (P) => {
      const ia = Math.round((dot(P, lu) - a0) * sa), ib = Math.round((dot(P, lv) - b0) * sb), t = dot(P, L);
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const i = ia + di, j = ib + dj;
        n += i < 0 || j < 0 || i >= N || j >= N || t >= map[j * N + i] - bias ? 1 : 0;
      }
      return n / 9;
    };
    const pool = new Float32Array(W * H), shadow = new Float32Array(W * H), sunlit = new Float32Array(W * H).fill(1), R2 = ground.radius;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o++) {
      if (cover[o]) { sunlit[o] = 0.55 + 0.45 * lit(pieces[which[o]].pos(U[o], V[o])); shade[o] *= sunlit[o]; continue; }
      const G = groundAt(cam, W, H, k0, cx, cy, x + 0.5, y + 0.5);
      if (!G) continue;
      // (The pool of tone fades into the paper; the shadows go on across it, as far as they fall - the paper is the ground.)
      const r = Math.hypot(G[0] - ground.centre[0], G[2] - ground.centre[2]) / R2;
      pool[o] = r < 0.55 ? 1 : r < 1 ? Math.pow(1 - (r - 0.55) / 0.45, 2) : 0;
      shadow[o] = 1 - lit(G);
    }
    R.pool = pool;
    R.sunlit = sunlit;
    R.shadow = blur(shadow, W, H, Math.max(1, Math.min(W, H) / 400));
    return R;
  }
  // Where a pixel of the picture looks onto the ground (y = 0), if it does.
  function groundAt(cam, W, H, k0, cx, cy, x, y) {
    const px = (cx + (x - W / 2) / k0 - W / 2) / cam.f, py = (cy + (y - H / 2) / k0 - H / 2) / cam.f;
    const d = [cam.fwd[0] + cam.right[0] * px - cam.up[0] * py, cam.fwd[1] + cam.right[1] * px - cam.up[1] * py, cam.fwd[2] + cam.right[2] * px - cam.up[2] * py];
    if (d[1] > -1e-6) return null;
    const t = -cam.eye[1] / d[1];
    return t > 0 ? [cam.eye[0] + t * d[0], 0, cam.eye[2] + t * d[2]] : null;
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
  /* The strokes, in the order they are laid: { pts, rgb, width, alpha, hair }.
   * A glaze is a painting carried on over itself: no broad first pass, and
   * thinner paint, so what is under it still shows through where it changes. */
  function strokes(R, read, seed = 1, style = STYLE, glaze = false) {
    const fine = read.M || read, coarse = read.coarse || fine, pal = palette(style);
    const { W, H, cover, shade } = R, rng = mulberry32(seed), at = (x, y) => (Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, x | 0)));
    const s = Math.min(W, H) / 480 * (style.stroke ?? 1), out = [];
    const passes = glaze ? [{ step: 8, len: 26, width: 7, alpha: 0.32, M: fine }, { step: 4.5, len: 13, width: 2.6, alpha: 0.48, M: fine }]
      : [{ step: 15, len: 44, width: 15, alpha: 0.42, M: coarse }, { step: 8, len: 26, width: 7, alpha: 0.6, M: fine }, { step: 4.5, len: 13, width: 2.6, alpha: 0.8, M: fine }];
    for (const pass of passes) {
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
  /* The ground the structure stands on, painted: a pool of tone fading into
   * the paper, its strokes laid across the ground (so they recede with it),
   * then the shadows the structure casts there, laid along the way they fall. */
  function shadowStrokes(R, seed = 1, style = STYLE) {
    if (!R.pool) return [];
    const { W, H, pool, shadow, cam, frameMap: { k0, cx, cy }, light: L } = R, rng = mulberry32((seed ^ 0x51ed270b) >>> 0), pal = palette(style), s = Math.min(W, H) / 480, out = [];
    const at = (x, y) => Math.min(H - 1, Math.max(0, y | 0)) * W + Math.min(W - 1, Math.max(0, x | 0));
    // (The way a step across the ground from a pixel goes on the picture.)
    const along = (x, y, step) => {
      const G = groundAt(cam, W, H, k0, cx, cy, x, y);
      if (!G) return null;
      const [x2, y2] = project(cam, W, H, [G[0] + step[0], 0, G[2] + step[2]]), fx = W / 2 + (x2 - cx) * k0 - x, fy = H / 2 + (y2 - cy) * k0 - y, l = Math.hypot(fx, fy);
      return l > 1e-6 ? [fx / l, fy / l] : null;
    };
    const h = Math.hypot(L[0], L[2]), fall = h > 1e-3 ? [-L[0] / h * 0.2, 0, -L[2] / h * 0.2] : [0.2, 0, 0];
    const tone = pal.ground.map((v) => v * 0.92), slate = [70, 78, 98], mix = (a, b, t) => a.map((v, i) => clamp255(v + (b[i] - v) * t));
    const lay = (step, len, width, keep, dirOf, colourOf, alphaOf) => {
      for (let y = 0; y < H; y += step * s) for (let x = 0; x < W; x += step * s) {
        const px = x + (rng() - 0.5) * step * s, py = y + (rng() - 0.5) * step * s, o = at(px, py);
        if (!keep(o)) continue;
        const d = dirOf(px, py);
        if (!d) continue;
        const l = len * s * (0.7 + 0.6 * rng());
        out.push({ pts: [[px - d[0] * l / 2, py - d[1] * l / 2], [px + d[0] * l / 2, py + d[1] * l / 2]], rgb: colourOf(o), width: width * s * (0.75 + 0.5 * rng()), alpha: alphaOf(o), hair: rng() < 0.5 ? -1 : 1 });
      }
    };
    lay(13, 46, 15, (o) => pool[o] > 0.06 && rng() < 0.75, (x, y) => along(x, y, [0.3, 0, 0]), () => tone.map((v) => clamp255(v + (rng() - 0.5) * 10)), (o) => 0.2 * pool[o]);
    lay(7, 22, 9, (o) => shadow[o] > 0.12, (x, y) => along(x, y, fall), (o) => mix(tone, slate, 0.3 + 0.45 * shadow[o]), (o) => 0.3 * shadow[o]);
    lay(4.5, 12, 4.5, (o) => shadow[o] > 0.2, (x, y) => along(x, y, fall), (o) => mix(tone, slate, 0.4 + 0.5 * shadow[o]), (o) => 0.42 * shadow[o]);
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
    shadows(R);
    const { W, H } = R, pal = palette(style), layer = canvasOf(W, H), lg = layer.getContext("2d");
    ctx.fillStyle = `rgb(${pal.ground.join(",")})`;
    ctx.fillRect(0, 0, W, H);
    for (const g of [ctx, lg]) { g.lineCap = "round"; g.lineJoin = "round"; }
    for (const k of groundStrokes(W, H, seed, style)) drawStroke(ctx, k);
    for (const k of shadowStrokes(R, seed, style)) drawStroke(ctx, k);
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
    PHI, IRRATIONAL, GOLDEN_TURN, SURFACES, FRAME, STYLE, mink, fromPolar, fromDisk, fromHalfPlane, fromKlein, slideTo, lineThrough,
    LAYOUTS, horocycles, billiard, waves, geodesics, lineAt, inkAt, interact, camera, project, isometry, piece, structure, stage, rasterize, raw, shadows, groundAt,
    blur, beatAt, reading, read, palette, ramp, strokes, groundStrokes, shadowStrokes, drawStroke, maskImage, canvasOf, paint, compose, rawImage, readImage, mulberry32,
    get GROUND() { return `rgb(${palette().ground.join(",")})`; },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
