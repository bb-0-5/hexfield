/* hexfield-study.js - Studies.
 *
 * The art school's first exercises, painted by the rules of application
 * rather than copied from a picture. Nothing is drawn first and matched:
 * a sphere, a cube, a tetrahedron or an octahedron - or two of them, one
 * standing on a cube - in a plain room whose eye level runs through the
 * middle of the canvas (the vanishing point is its centre), and the
 * painting is a sequence of strokes laid from the farthest paint to the
 * nearest, each stroke done as it goes on. If the order of application is
 * right, the form reads as solid without the painter ever rendering it.
 *
 * Before a stroke is laid the study is mapped (premap): every corner of
 * each solid carried into the picture, and every plane of it found facing
 * the eye or not. A solid is shown with three planes at most, and two or
 * one, as it turns and as its level planes lie under the horizon (their
 * tops seen), over it (their undersides seen) or across it (seen edge-on,
 * as a line) - which is also what sets the angle of each corner, its edges
 * running back toward the vanishing point from above or below. (An
 * octahedron mostly shows four; it is turned until it shows three, or two.)
 * Then:
 *   the wall, then the floor from the horizon down, far rows first;
 *   the shadows thrown on the floor - each edge the line where the light
 *     leaves a form, carried down the light - and the dark where the
 *     bottom solid touches;
 *   the solids, the one underneath first. A sphere as brush shapes stacked
 *     inside its volume: the outermost ring (the farthest of it that can be
 *     seen) first, each nearer ring over the last, each stroke coloured by
 *     how the surface turns to the light where it lies, the highlight last.
 *     A flat-sided solid by points: the corner farthest from the eye first,
 *     its edge laid square to the plane it stands over where it has an
 *     upright edge; a second point gives a line its tilt; more points close
 *     a plane, and the plane is filled, far to near, before the next is
 *     begun. A solid standing on another throws its shadow on the plane it
 *     stands on before it is painted itself.
 */
(function (global) {
  "use strict";

  const seeded = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const times = (a, k) => a.map((v) => v * k);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const paint = (c) => c.map((v) => clamp(Math.round(v), 0, 255));
  function hsl(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }

  const KINDS = ["sphere", "cube", "tetrahedron", "octahedron", "stack"];
  const SOLIDS = ["sphere", "cube", "tetrahedron", "octahedron"];
  const NAMES = { sphere: "a sphere", cube: "a cube", tetrahedron: "a tetrahedron", octahedron: "an octahedron" };

  /* The room and the eye. World units (a cube's edge is one): the eye is
   * `eye` above the floor, looking level along +z, so the horizon is the
   * middle of the canvas and the vanishing point its centre - high enough
   * over a solid on the floor that its top is seen as a plane, not a sliver;
   * the wall is `wall` away; `lens` is the focal length against the canvas's
   * short side.
   *   size     a solid's height against the canvas's short side (`stack`: two)
   *   foot     how far down the canvas the foot of a solid on the floor may come
   *   rings    a sphere's rings, rim to front
   *   batch    strokes to a step at most
   *   turns    turns tried for a solid to show the planes wanted */
  const ROOM = { eye: 2, wall: 10, lens: 1.15, size: 0.32, stack: 0.44, foot: 0.9, rings: 9, batch: 90, turns: 120 };

  const camera = (W, H) => ({ W, H, f: ROOM.lens * Math.min(W, H), cx: W / 2, cy: H / 2, eye: ROOM.eye });
  const project = (cam, [X, Y, Z]) => [cam.cx + cam.f * X / Z, cam.cy - cam.f * (Y - cam.eye) / Z];
  // How far off a level plane `h` high lies at a height in the picture (planes under the eye).
  const planeDepth = (cam, y, h = 0) => cam.f * (cam.eye - h) / Math.max(1e-3, y - cam.cy);

  /* ── The solids ───────────────────────────────────────────────────────
   * Corners about the solid's own middle, and its faces as rings of
   * corners; a face's outward way is from the middle through its own. */
  function cubeSolid(e) {
    const a = e / 2, verts = [];
    for (let i = 0; i < 8; i++) verts.push([i & 1 ? a : -a, i & 2 ? a : -a, i & 4 ? a : -a]);
    const faces = [
      { name: "front", idx: [0, 1, 3, 2] }, { name: "back", idx: [4, 6, 7, 5] },
      { name: "left", idx: [0, 2, 6, 4] }, { name: "right", idx: [1, 5, 7, 3] },
      { name: "bottom", idx: [0, 4, 5, 1] }, { name: "top", idx: [2, 3, 7, 6] },
    ];
    return { verts, faces, low: -a, high: a };
  }
  function tetraSolid(e) {
    const r = e / Math.sqrt(3), h = e * Math.sqrt(2 / 3), verts = [];
    for (let k = 0; k < 3; k++) {
      const t = Math.PI / 2 + k * 2 * Math.PI / 3;
      verts.push([r * Math.cos(t), -h / 4, r * Math.sin(t)]);
    }
    verts.push([0, h * 3 / 4, 0]);
    const faces = [{ name: "base", idx: [0, 2, 1] }, { name: "side a", idx: [0, 1, 3] }, { name: "side b", idx: [1, 2, 3] }, { name: "side c", idx: [2, 0, 3] }];
    return { verts, faces, low: -h / 4, high: h * 3 / 4 };
  }
  /* An octahedron: on a vertex (a corner up and a corner down), or resting
   * on a face - turned so one face lies level underneath and its opposite
   * level on top. */
  function octaSolid(e, onFace = true) {
    const a = e / Math.SQRT2;
    let verts = [[a, 0, 0], [-a, 0, 0], [0, a, 0], [0, -a, 0], [0, 0, a], [0, 0, -a]];
    const faces = [];
    let k = 0;
    for (const sx of [0, 1]) for (const sy of [2, 3]) for (const sz of [4, 5]) faces.push({ name: "face " + "abcdefgh"[k++], idx: [sx, sy, sz] });
    if (onFace) {
      // The face whose way out is (1, 1, 1) turned to face straight down.
      const from = unit([1, 1, 1]), to = [0, -1, 0], axis = unit(cross(from, to)), c = dot(from, to), s = Math.sqrt(1 - c * c);
      verts = verts.map((v) => { const kv = cross(axis, v), kd = dot(axis, v); return v.map((x, i) => x * c + kv[i] * s + axis[i] * kd * (1 - c)); });
    }
    const ys = verts.map((v) => v[1]);
    return { verts, faces, low: Math.min(...ys), high: Math.max(...ys) };
  }
  // Turned about the upright by `yaw`, its middle carried to `at`.
  function place(solid, yaw, at) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const verts = solid.verts.map(([x, y, z]) => [x * c + z * s + at[0], y + at[1], -x * s + z * c + at[2]]);
    return { ...solid, verts, middle: at };
  }

  /* ── Premap ───────────────────────────────────────────────────────────
   * Before any paint: every corner in the picture, every plane facing the
   * eye or not, where each level plane lies against the horizon, the edges
   * that can be seen, and the angle each seen corner makes. */
  function premap(cam, solid) {
    const pts = solid.verts.map((v) => project(cam, v));
    const eyeAt = [0, cam.eye, 0];
    const faces = solid.faces.map((f) => {
      const world = f.idx.map((i) => solid.verts[i]);
      const centre = times(world.reduce(add, [0, 0, 0]), 1 / world.length);
      const normal = unit(sub(centre, solid.middle));
      const facing = dot(normal, sub(eyeAt, centre));
      const level = Math.abs(normal[1]) > 0.99;
      // A level plane under the horizon shows its top, over it its underside; on it, only its edge.
      const horizon = level ? (Math.abs(centre[1] - cam.eye) < 1e-3 ? "on" : centre[1] < cam.eye ? "below" : "above") : null;
      return { ...f, world, centre, normal, facing, level, horizon, visible: facing > 1e-6, depth: centre[2], screen: f.idx.map((i) => pts[i]) };
    });
    const visible = faces.filter((f) => f.visible);
    // The edges of the planes that are seen (each once), and the corners' angles in the picture.
    const edges = new Map();
    for (const f of visible) {
      for (let k = 0; k < f.idx.length; k++) {
        const a = f.idx[k], b = f.idx[(k + 1) % f.idx.length], key = a < b ? a + "-" + b : b + "-" + a;
        const e = edges.get(key) || { a: Math.min(a, b), b: Math.max(a, b), faces: [] };
        e.faces.push(f);
        edges.set(key, e);
      }
    }
    for (const e of edges.values()) {
      const [x0, y0] = pts[e.a], [x1, y1] = pts[e.b];
      e.angle = Math.atan2(y1 - y0, x1 - x0);
      e.depth = (solid.verts[e.a][2] + solid.verts[e.b][2]) / 2;
      e.upright = Math.abs(solid.verts[e.a][0] - solid.verts[e.b][0]) < 1e-6 && Math.abs(solid.verts[e.a][2] - solid.verts[e.b][2]) < 1e-6;
      e.outline = e.faces.length === 1;
    }
    return { pts, faces, visible, planes: visible.length, edges: [...edges.values()], horizonY: cam.cy };
  }
  /* Turned until it shows the planes wanted - never more than three -
   * trying the square-on turns and then all the way round; among the turns
   * that do, one at random. */
  function turnFor(cam, base, at, want, rng) {
    const tries = [0, Math.PI / 4], phase = rng() * Math.PI;
    for (let i = 0; i < ROOM.turns; i++) tries.push(phase + i * Math.PI / ROOM.turns);
    const all = tries.map((yaw) => {
      const placed = place(base, yaw, at), map = premap(cam, placed);
      return { placed, map, yaw, miss: Math.abs(map.planes - want) + (map.planes > 3 ? 10 : 0) };
    });
    const best = Math.min(...all.map((t) => t.miss)), fits = all.filter((t) => t.miss === best);
    return fits[Math.floor(rng() * fits.length)];
  }

  /* ── Light and colour ────────────────────────────────────────────────── */
  function lighting(rng) {
    const side = rng() < 0.5 ? -1 : 1, elev = 0.6 + rng() * 0.35, front = 0.35 + rng() * 0.35;
    const L = unit([side * Math.cos(elev), Math.sin(elev), -front]);
    const warm = rng() < 0.7;
    return { side, L, colour: warm ? [255, 242, 222] : [228, 236, 255], ambient: warm ? [122, 132, 168] : [156, 138, 122] };
  }
  function palette(rng) {
    const wallHue = rng() * 360, floorHue = (wallHue + 40 + rng() * 140) % 360, solidHue = rng() * 360;
    return {
      wall: hsl(wallHue, 0.08 + rng() * 0.14, 0.72 + rng() * 0.12),
      floor: hsl(floorHue, 0.12 + rng() * 0.18, 0.5 + rng() * 0.16),
      solid: hsl(solidHue, 0.35 + rng() * 0.4, 0.48 + rng() * 0.16),
      // A second solid: well round the colour wheel from the first.
      solid2: hsl((solidHue + 100 + rng() * 160) % 360, 0.35 + rng() * 0.4, 0.5 + rng() * 0.16),
    };
  }
  /* How a surface looks: its own colour in the light as far as it turns to
   * it, toward the ambient where it turns away; the floor's light bounced
   * up into what faces down; the light's shine where it mirrors to the eye;
   * and the air over it the farther off it is (far is neutral, near is
   * rich). */
  function shade(S, base, n, Z, { shine = 0, bounce = 0.6, lift = 0 } = {}) {
    const { L, colour: lit, ambient: amb } = S.light;
    const d = Math.max(0, dot(n, L));
    let c = base.map((b, i) => b * (0.5 * amb[i] / 255 + 0.78 * d * lit[i] / 255) + lift);
    if (n[1] < 0 && bounce) c = c.map((v, i) => v + S.palette.floor[i] * 0.2 * bounce * -n[1] * (1 - d));
    if (shine) {
      const h = unit(add(L, [0, 0, -1]));
      const s = Math.pow(Math.max(0, dot(n, h)), 36) * shine;
      c = c.map((v, i) => v + (lit[i] - v) * s);
    }
    const air = clamp((Z - 2.4) / (ROOM.wall - 2.4), 0, 1) * 0.42;
    return paint(mix(c, S.air, air));
  }

  /* ── Strokes ─────────────────────────────────────────────────────────
   * A stroke is done as it goes on: no light of its own along it, nothing
   * breathed round it - the study's order of application does that work. */
  function stroke(S, points, width, colour, tip, extra = null) {
    const s = { points, width, colour: paint(colour), bristle: S.rng(), tip, light: null, recede: 0 };
    return extra ? Object.assign(s, extra) : s;
  }
  // A hand is never exact: a point a little off where it was meant.
  const off = (S, [x, y], by) => [x + (S.rng() - 0.5) * 2 * by, y + (S.rng() - 0.5) * 2 * by];
  // Steps of at most ROOM.batch strokes.
  function* inSteps(label, strokes) {
    for (let i = 0; i < strokes.length; i += ROOM.batch) yield { label, strokes: strokes.slice(i, i + ROOM.batch) };
  }
  // A shape in the picture a hair larger (no gap where two meet), for strokes to be laid inside.
  function clipOf(shape, by = 1.2) {
    const mx = shape.reduce((t, q) => t + q[0], 0) / shape.length, my = shape.reduce((t, q) => t + q[1], 0) / shape.length;
    return shape.map(([x, y]) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + (x - mx) / d * by, y + (y - my) / d * by]; });
  }

  /* ── The room: wall, then floor, far to near ─────────────────────────── */
  function* room(S) {
    const { cam } = S, W = cam.W, H = cam.H, side = S.light.side;
    const meet = cam.cy + cam.f * cam.eye / ROOM.wall;
    // The wall: soft and even, a little lighter toward the light.
    const wall = [], rowW = Math.max(6, (meet / 9));
    // (Each row begun somewhere else, so no seam runs down the wall.)
    for (let y = rowW / 2; y < meet + rowW * 0.4; y += rowW * 0.8) {
      for (let x = -W * (0.05 + S.rng() * 0.2); x < W * 1.05; x += W * (0.17 + S.rng() * 0.1)) {
        const len = W * (0.24 + S.rng() * 0.08), x0 = x + (S.rng() - 0.5) * W * 0.05, y0 = Math.min(meet, y + (S.rng() - 0.5) * rowW * 0.3);
        const across = (x0 + len / 2) / W - 0.5;
        const c = shade(S, S.palette.wall, [0, 0, -1], ROOM.wall).map((v) => v * (1 + 0.16 * side * across * 2 - 0.05 * (1 - y0 / meet)));
        wall.push(stroke(S, [[x0, y0], [x0 + len * 0.5, y0 + (S.rng() - 0.5) * rowW * 0.2], [x0 + len, y0]], rowW * 1.6, c, "soft"));
      }
    }
    yield* inSteps("the wall", wall);
    // The floor from where it meets the wall down, row by row: thin and far first, broad and near last.
    const floor = [];
    let y = meet;
    while (y < H) {
      const Z = planeDepth(cam, y), next = Math.min(H + 2, cam.cy + cam.f * cam.eye / (Z / 1.13)), h = Math.max(2, next - y);
      const near = clamp((ROOM.wall - Z) / (ROOM.wall - 1.5), 0, 1);
      for (let x = -W * (0.04 + S.rng() * 0.16); x < W * 1.04; x += W * (0.14 + S.rng() * 0.08 - 0.04 * near)) {
        const len = W * (0.2 + S.rng() * 0.1 - 0.05 * near), x0 = x + (S.rng() - 0.5) * W * 0.04, ym = y + h / 2 + (S.rng() - 0.5) * h * 0.25;
        const across = (x0 + len / 2) / W - 0.5;
        const c = shade(S, S.palette.floor, [0, 1, 0], Z).map((v) => v * (1 + 0.12 * side * across * 2));
        floor.push(stroke(S, [[x0, ym], [x0 + len * 0.5, ym + (S.rng() - 0.5) * h * 0.2], [x0 + len, ym]], h * 1.7, c, near < 0.35 ? "soft" : near < 0.7 ? "filbert" : "flat"));
      }
      y = next;
    }
    yield* inSteps("the floor", floor);
  }

  /* ── Shadows ─────────────────────────────────────────────────────────
   * What a solid throws on a level plane (the floor, or the top of the
   * solid it stands on): every corner - or, for a sphere, the line where
   * the light leaves it - carried down the light to that plane, and the
   * outline of all of them, filled in rows far to near in the plane's own
   * colour without the light: darkest where the solid stands, softening
   * toward the far end; inside the plane's own edges where it has them. */
  function shadowOutline(S, E, h) {
    const L = S.light.L, down = (p) => (p[1] <= h + 1e-6 ? [p[0], h, p[2]] : [p[0] - L[0] * (p[1] - h) / L[1], h, p[2] - L[2] * (p[1] - h) / L[1]]);
    if (E.kind !== "sphere") return hull(E.placed.verts.map(down), h);
    const u = unit([-L[2], 0, L[0]]), v = unit([L[1] * L[0], -(L[0] * L[0] + L[2] * L[2]), L[1] * L[2]]), pts = [];
    for (let k = 0; k < 40; k++) {
      const t = k / 40 * Math.PI * 2;
      pts.push(down(add(E.middle, add(times(u, E.radius * Math.cos(t)), times(v, E.radius * Math.sin(t))))));
    }
    return hull(pts, h);
  }
  // Convex hull of points on a level plane (x, z), as points on it in order.
  function hull(points, h) {
    const p = points.map((q) => [q[0], q[2]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(([x, z]) => [x, h, z]);
  }
  function* shadowSteps(S, E, ground, label) {
    const { cam } = S, out = [], h = ground.h;
    const shape = shadowOutline(S, E, h), shot = shape.map((p) => project(cam, p));
    const lowest = E.kind === "sphere" ? E.middle[1] - E.radius : Math.min(...E.placed.verts.map((v) => v[1]));
    const standing = Math.abs(lowest - h) < 0.02, contact = E.kind === "sphere" ? E.middle : E.placed.middle;
    const ys = shot.map((p) => p[1]), top = Math.min(...ys), foot = Math.max(...ys);
    const inside = (x, y) => {
      let hit = false;
      for (let i = 0, j = shot.length - 1; i < shot.length; j = i++) {
        const [xi, yi] = shot[i], [xj, yj] = shot[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const reach = Math.max(...shape.map((p) => Math.hypot(p[0] - contact[0], p[2] - contact[2]))) || 1;
    const rows = Math.max(4, Math.round((foot - top) / Math.max(3, cam.W * 0.012)));
    const extra = ground.clip ? { clip: ground.clip } : null;
    for (let r = 0; r < rows && foot > cam.cy; r++) {
      const y = top + (r + 0.5) * (foot - top) / rows, Z = planeDepth(cam, y, h), band = (foot - top) / rows;
      if (y <= cam.cy) continue;
      let start = null;
      const step = Math.max(2, cam.W * 0.008), left = Math.min(...shot.map((p) => p[0])), right = Math.max(...shot.map((p) => p[0]));
      for (let x = left - step; x <= right + step; x += step) {
        const isIn = inside(x, y);
        if (isIn && start === null) start = x;
        if (!isIn && start !== null) {
          const mid = (start + x) / 2, X = (mid - cam.cx) * Z / cam.f;
          const far = clamp(Math.hypot(X - contact[0], Z - contact[2]) / reach, 0, 1);
          const dark = shade(S, ground.base, [0, 1, 0], Z).map((v, i) => v * (0.38 + 0.25 * far) + S.light.ambient[i] * 0.06);
          out.push(stroke(S, [[start, y], [mid, y + (S.rng() - 0.5) * band * 0.2], [x - step, y]], band * 1.8, dark, !standing || far > 0.6 ? "soft" : "filbert", extra));
          start = null;
        }
      }
    }
    yield* inSteps(label, out);
    if (!standing) return;
    // Where it touches, the light is shut out.
    const touch = [];
    if (E.kind === "sphere") {
      const r = cam.f * E.radius / E.middle[2], [x, y] = project(cam, [E.middle[0], h, E.middle[2]]);
      for (let k = 0; k < 3; k++) {
        const w = r * (0.9 - k * 0.22);
        touch.push(stroke(S, [[x - w / 2, y - k], [x, y + 1 - k], [x + w / 2, y - k]], Math.max(3, r * 0.07), shade(S, ground.base, [0, 1, 0], E.middle[2]).map((c) => c * 0.3), "filbert", extra));
      }
    } else {
      const lineW = Math.max(1.6, Math.min(cam.W, cam.H) * 0.006), pts = E.map.pts, verts = E.placed.verts;
      for (const e of E.map.edges) {
        if (Math.abs(verts[e.a][1] - h) > 0.02 || Math.abs(verts[e.b][1] - h) > 0.02) continue;
        touch.push(stroke(S, [pts[e.a], pts[e.b]], lineW * 2.4, shade(S, ground.base, [0, 1, 0], e.depth).map((c) => c * 0.32), "filbert", extra));
      }
    }
    if (touch.length) yield { label: "where " + E.name.replace(/^an? /, "the ") + " stands", strokes: touch };
  }

  /* ── A sphere: brush shapes stacked inside its volume ─────────────────
   * Rings from the rim (the farthest of it that can be seen) to the front,
   * each ring's strokes going round it from its darkest side, so the light
   * strokes go on over the dark; the highlight last. */
  function* sphereSteps(S, E) {
    const { cam } = S, R = E.radius, C = E.middle, L = S.light.L;
    const [cx, cy] = project(cam, C), r = cam.f * R / C[2];
    const N = ROOM.rings, ring = r / N;
    const dark = Math.atan2(L[1], -L[0]);   // in the picture: away from the light
    const colourAt = (x, y) => {
      const nx = clamp((x - cx) / r, -1, 1), ny = clamp(-(y - cy) / r, -1, 1), nz = -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      return shade(S, E.base, [nx, ny, nz], C[2] + R * nz, { shine: 0.55 });
    };
    for (let k = 0; k < N; k++) {
      const outer = r - k * ring, mid = Math.max(ring * 0.35, outer - ring / 2), width = ring * (1.7 + 0.25 * k / N);
      const strokes = [];
      if (k === N - 1) {
        // The front: a few touches across the last of it.
        for (let j = 0; j < 4; j++) {
          const a = dark + j * Math.PI / 2 + S.rng() * 0.6, x = cx + Math.cos(a) * ring * 0.3, y = cy - Math.sin(a) * ring * 0.3;
          strokes.push(stroke(S, [off(S, [x - ring * 0.6, y], ring * 0.1), [x, y], off(S, [x + ring * 0.6, y], ring * 0.1)], width, colourAt(x, y), "filbert"));
        }
      } else {
        const around = 2 * Math.PI * mid, count = Math.max(5, Math.ceil(around / (width * 1.25))), arc = (2 * Math.PI / count) * 1.35;
        for (let j = 0; j < count; j++) {
          const sideWay = j % 2 ? 1 : -1, a0 = dark + sideWay * Math.ceil(j / 2) * (2 * Math.PI / count) + (S.rng() - 0.5) * 0.15;
          const pts = [];
          for (let p = 0; p < 4; p++) {
            const a = a0 - arc / 2 + arc * p / 3, rr = mid + (S.rng() - 0.5) * ring * 0.2;
            pts.push([cx + Math.cos(a) * rr, cy - Math.sin(a) * rr]);
          }
          const [mx, my] = pts[1];
          strokes.push(stroke(S, pts, width, colourAt(mx, my), k === 0 ? "soft" : "filbert"));
        }
      }
      yield { label: E.name + ", ring " + (k + 1) + " of " + N, strokes };
    }
    const h = unit(add(L, [0, 0, -1])), hx = cx + h[0] * r * 0.92, hy = cy - h[1] * r * 0.92;
    const shine = mix(S.light.colour, E.base, 0.12);
    yield {
      label: "the highlight on " + E.name.replace(/^an? /, "the "),
      strokes: [stroke(S, [off(S, [hx - ring * 0.35, hy], 1), [hx, hy - ring * 0.05], off(S, [hx + ring * 0.35, hy], 1)], ring * 0.8, mix(colourAt(hx, hy), shine, 0.55), "round"),
        stroke(S, [[hx - ring * 0.12, hy], [hx + ring * 0.12, hy]], ring * 0.45, shine, "round")],
    };
  }

  /* ── A flat-sided solid, built by points ─────────────────────────────
   * The first line is the edge at the corner farthest from the eye - an
   * upright edge, square to the plane it stands over, where the solid has
   * one - laid as a thin line the planes will be painted against. Then
   * point by point: each new corner gives a line its tilt (toward the
   * vanishing point, from above or below as the premap says), and when a
   * plane's corners are all placed it is filled - in strokes running the
   * way its edges do, from its far end to its near end - before the next
   * plane is begun. The planes, three at most, go far to near, each
   * sharing an edge with one already painted. */
  function* facetedSteps(S, E) {
    const { cam } = S, map = E.map, pts = map.pts, the = E.name.replace(/^an? /, "the ");
    const lineColour = paint(mix(shade(S, E.base, [0, 0, -1], E.placed.middle[2]), [30, 30, 40], 0.45));
    const lineW = Math.max(1.6, Math.min(cam.W, cam.H) * 0.006);
    // The first line: the farthest edge that can be seen - upright where the solid has upright edges.
    const outline = map.edges.filter((e) => e.outline);
    const pool = outline.some((e) => e.upright) ? outline.filter((e) => e.upright) : outline.length ? outline : map.edges;
    const first = pool.reduce((best, e) => (e.depth > best.depth ? e : best), pool[0]);
    const placed = new Set([first.a, first.b]), lines = new Set([first.a + "-" + first.b]);
    yield { label: "the far corner of " + the, strokes: [stroke(S, [off(S, pts[first.a], lineW * 0.6), off(S, pts[first.b], lineW * 0.6)], lineW, lineColour, "round")] };
    const left = map.visible.slice(), done = [];
    while (left.length) {
      const touches = (f) => done.length === 0 ? f.idx.includes(first.a) && f.idx.includes(first.b) : f.idx.some((i) => placed.has(i));
      const ready = left.filter(touches);
      const face = (ready.length ? ready : left).reduce((best, f) => (f.depth > best.depth ? f : best));
      left.splice(left.indexOf(face), 1);
      // Its corners, point by point from one already placed: each a line with its tilt.
      const n = face.idx.length;
      let k0 = face.idx.findIndex((i) => placed.has(i));
      if (k0 < 0) k0 = 0;
      const build = [];
      for (let s = 0; s < n; s++) {
        const a = face.idx[(k0 + s) % n], b = face.idx[(k0 + s + 1) % n], key = a < b ? a + "-" + b : b + "-" + a;
        placed.add(a); placed.add(b);
        if (lines.has(key) || lines.has(b + "-" + a)) continue;
        lines.add(key);
        build.push(stroke(S, [off(S, pts[a], lineW * 0.6), off(S, pts[b], lineW * 0.6)], lineW, lineColour, "round"));
      }
      const plane = (face.level ? (face.horizon === "above" ? "underside" : "top") : face.name.startsWith("face") || face.name.startsWith("side") ? "face" : face.name + " face");
      if (build.length) yield { label: "the corners of " + the + "'s " + plane, strokes: build };
      yield* inSteps(the + "'s " + plane, fillPlane(S, face, E.base));
      done.push(face);
    }
  }
  /* A plane filled: strokes the way it runs (upright on an upright plane,
   * across on a level one, along its lowest edge on a slanted one), laid
   * from its far end to its near end, each in the plane's own light at the
   * depth it lies. */
  function fillPlane(S, face, base) {
    const { cam } = S, w = face.world, n = face.normal;
    const corners = w.length;
    // Which way its strokes run (they are laid one after another across it, far to near).
    let along;
    if (corners === 4) {
      const e1 = sub(w[1], w[0]), e2 = sub(w[2], w[1]);
      const upright1 = Math.abs(unit(e1)[1]) > 0.9, upright2 = Math.abs(unit(e2)[1]) > 0.9;
      if (upright1 || upright2) along = upright1 ? 0 : 1;   // upright plane: strokes up and down
      else {
        // level plane: strokes along the edge that is most across the picture
        const p = w.map((q) => project(cam, q));
        const flat1 = Math.abs(p[1][1] - p[0][1]) / (Math.abs(p[1][0] - p[0][0]) + 1e-6), flat2 = Math.abs(p[2][1] - p[1][1]) / (Math.abs(p[2][0] - p[1][0]) + 1e-6);
        along = flat1 < flat2 ? 0 : 1;
      }
    }
    const at = (u, v) => {
      if (corners === 4) {
        // u along the strokes, v across them
        const [s, t] = along === 0 ? [u, v] : [v, u];
        return add(times(add(times(w[0], 1 - s), times(w[1], s)), 1 - t), times(add(times(w[3], 1 - s), times(w[2], s)), t));
      }
      // A triangle: rows parallel to its lowest edge, v from that edge to the opposite corner.
      const order = [0, 1, 2].sort((i, j) => w[i][1] - w[j][1]);
      const A = w[order[0]], B = w[order[1]], Cn = w[order[2]];
      const base0 = add(times(A, 1 - v), times(Cn, v)), base1 = add(times(B, 1 - v), times(Cn, v));
      return add(times(base0, 1 - u), times(base1, u));
    };
    /* Rows across the plane, ordered far to near by where each lies, laid
     * inside its edges (each stroke clipped to the plane's shape, a hair
     * outside it so two planes meet without a gap) - so the lines its corners
     * were drawn with still show round it. */
    const clip = clipOf(w.map((q) => project(cam, q)));
    const span = (p, q) => Math.hypot(...sub(project(cam, p), project(cam, q)));
    const deep = span(at(0.5, 0), at(0.5, 1)), brush = Math.max(5, Math.min(cam.W, cam.H) * 0.034);
    const rows = Math.max(2, Math.round(deep / (brush * 0.9)));
    const band = 1 / rows, inset = band * 0.3, gap = rows === 1 ? 1 : (1 - 2 * inset) / (rows - 1);
    const order = [];
    for (let r = 0; r < rows; r++) order.push(rows === 1 ? 0.5 : inset + (1 - 2 * inset) * r / (rows - 1));
    order.sort((a, b) => at(0.5, b)[2] - at(0.5, a)[2]);
    const out = [];
    for (const v of order) {
      const p0 = at(0, v), p1 = at(1, v), long = span(p0, p1), pieces = Math.max(1, Math.round(long / (brush * 4.5)));
      const shift = (S.rng() - 0.5) * 0.5 / pieces;
      for (let k = 0; k < pieces; k++) {
        const u0 = clamp(k / pieces + (k ? shift : 0) - 0.03, -0.04, 1), u1 = clamp((k + 1) / pieces + (k < pieces - 1 ? shift : 0) + 0.03, 0, 1.04);
        const a = project(cam, at(u0, v)), b = project(cam, at(u1, v)), m = at((u0 + u1) / 2, v);
        // (Wide enough to meet the next row: two rows set in from the edges stand further apart than a band.)
        const width = deep * Math.max(band * 1.25, gap * 1.15) * (1 + 0.12 * clamp((4 - m[2]) / 2, -1, 1));
        const colour = shade(S, base, n, m[2]).map((c) => c + (S.rng() - 0.5) * 4);
        out.push(stroke(S, [a, off(S, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], width * 0.04), b], width, colour, "flat", { alpha: 0.97, clip }));
      }
    }
    return out;
  }

  /* ── Placing solids ──────────────────────────────────────────────────── */
  const SIZES = { cube: 1, tetrahedron: 1.25, octahedron: 1.05 };
  // A flat-sided solid of `kind`, its edge `e`; an octahedron on a face, unless it floats (then on a vertex).
  function shapeOf(kind, e, floating = false) {
    return kind === "cube" ? cubeSolid(e) : kind === "tetrahedron" ? tetraSolid(e) : octaSolid(e, !floating);
  }
  // How many planes to try to show: three at most, and two or one.
  function wantFor(kind, level, rng) {
    if (kind === "cube") return [3, 2, 3, 1, 2][Math.floor(rng() * 5)];
    return level === "across" ? 2 : [3, 3, 2][Math.floor(rng() * 3)];
  }

  /* ── A study ─────────────────────────────────────────────────────────
   * Its subject - one solid, or two with one standing on a cube - the light,
   * its colours, where it stands against the horizon (under it, across it,
   * over it) and how many planes of each solid show - and the steps that
   * paint it. */
  function make(W, H, seed, kind = null, wants = {}) {
    const rng = seeded(seed ^ 0x57d1e5);
    kind = KINDS.includes(kind) ? kind : KINDS[Math.floor(rng() * KINDS.length)];
    const cam = camera(W, H), light = lighting(rng), colours = palette(rng);
    const S = { kind, cam, light, palette: colours, rng, entries: [] };
    S.air = mix(shade({ light, palette: colours, air: colours.wall }, colours.wall, [0, 0, -1], 0), light.colour, 0.25);
    const short = Math.min(W, H);
    // Far enough back that a foot on the floor is still in the canvas.
    const footRoom = cam.f * cam.eye / Math.max(1, H * (ROOM.foot - 0.5));
    const xAt = (Z) => (rng() - 0.5) * 0.24 * W * Z / cam.f;
    const floor = { h: 0, base: colours.floor, clip: null };

    if (kind === "stack") {
      // A cube on the floor and a smaller solid standing on its top.
      const topKind = wants.top && SOLIDS.includes(wants.top) ? wants.top : SOLIDS[Math.floor(rng() * SOLIDS.length)];
      const bottomShape = cubeSolid(1);
      const topShape = topKind === "sphere" ? null : shapeOf(topKind, SIZES[topKind] * 0.55);
      const topHeight = topKind === "sphere" ? 0.62 : topShape.high - topShape.low;
      const Z = Math.max(cam.f * (1 + topHeight) / (short * ROOM.stack), footRoom);
      S.level = "below";
      const bottom = turnFor(cam, bottomShape, [xAt(Z), -bottomShape.low, Z], wants.planes || [3, 3, 2][Math.floor(rng() * 3)], rng);
      const B = { kind: "cube", name: "a cube", base: colours.solid, placed: bottom.placed, map: bottom.map, ground: floor };
      // Where on its top the other stands: a little off the middle, never over the edge.
      const reachOut = topKind === "sphere" ? 0.31 : Math.max(...topShape.verts.map((v) => Math.hypot(v[0], v[2])));
      const spare = Math.max(0, 0.5 - reachOut) * 0.9, ox = (rng() * 2 - 1) * spare, oz = (rng() * 2 - 1) * spare;
      const c = Math.cos(bottom.yaw), s = Math.sin(bottom.yaw), mid = bottom.placed.middle;
      const onTop = [mid[0] + ox * c + oz * s, 1, mid[2] - ox * s + oz * c];
      const topFace = bottom.map.faces.find((f) => f.name === "top");
      const support = { h: 1, base: colours.solid, clip: topFace?.visible ? clipOf(topFace.screen, 0.5) : null };
      let T;
      if (topKind === "sphere") {
        T = { kind: "sphere", name: "a sphere", base: colours.solid2, radius: 0.31, middle: [onTop[0], 1 + 0.31, onTop[2]], ground: support };
      } else {
        const t = turnFor(cam, topShape, [onTop[0], 1 - topShape.low, onTop[2]], wantFor(topKind, "below", rng), rng);
        T = { kind: topKind, name: NAMES[topKind], base: colours.solid2, placed: t.placed, map: t.map, ground: support };
      }
      S.entries = [B, T];
      S.name = T.name + " on a cube";
      S.planes = B.map.planes;
      S.steps = (function* () {
        yield* room(S);
        // Both shadows on the floor, the one underneath first; then it, then what it carries.
        yield* shadowSteps(S, B, floor, "the cube's shadow");
        yield* shadowSteps(S, T, floor, "the shadow of " + T.name.replace(/^an? /, "the "));
        yield* facetedSteps(S, B);
        if (support.clip) yield* shadowSteps(S, T, support, "its shadow on the cube");
        yield* T.kind === "sphere" ? sphereSteps(S, T) : facetedSteps(S, T);
      })();
      return S;
    }

    // One solid: under the horizon (its top seen), across it, or over it (its underside seen).
    const level = wants.level || (kind === "sphere" ? (rng() < 0.75 ? "below" : "above")
      : kind === "octahedron" ? ["below", "below", "across", "above"][Math.floor(rng() * 4)]
      : ["below", "below", "across", "above"][Math.floor(rng() * 4)]);
    S.level = level;
    if (kind === "sphere") {
      const R = 0.6, Z = Math.max(cam.f * 2 * R / (short * ROOM.size), level === "below" ? footRoom : 0);
      const y = level === "below" ? R : level === "across" ? cam.eye : cam.eye + R * 1.5;
      const E = { kind, name: NAMES.sphere, base: colours.solid, radius: R, middle: [xAt(Z), y, Z], ground: floor };
      S.entries = [E];
      S.name = E.name;
      S.planes = 0;
      S.steps = (function* () { yield* room(S); yield* shadowSteps(S, E, floor, "its shadow"); yield* sphereSteps(S, E); })();
      return S;
    }
    const shape = shapeOf(kind, SIZES[kind], level !== "below");
    const Z = Math.max(cam.f * (shape.high - shape.low) / (short * ROOM.size), level === "below" ? footRoom : 0);
    const y = level === "below" ? -shape.low : level === "across" ? cam.eye - (shape.low + shape.high) / 2 : cam.eye + 0.3 - shape.low;
    const want = clamp(Number(wants.planes) || wantFor(kind, level, rng), 1, 3);
    // (One plane only square-on, near the middle.)
    const turned = turnFor(cam, shape, [want === 1 ? 0 : xAt(Z), y, Z], want, rng);
    const E = { kind, name: NAMES[kind], base: colours.solid, placed: turned.placed, map: turned.map, ground: floor };
    S.entries = [E];
    S.name = E.name;
    S.planes = turned.map.planes;
    S.steps = (function* () { yield* room(S); yield* shadowSteps(S, E, floor, "its shadow"); yield* facetedSteps(S, E); })();
    return S;
  }

  global.HexfieldStudy = { KINDS, SOLIDS, NAMES, ROOM, make, premap, camera, project, cubeSolid, tetraSolid, octaSolid, place };
})(typeof globalThis !== "undefined" ? globalThis : this);
