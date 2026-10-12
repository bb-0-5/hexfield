/* hexfield-study.js - Studies.
 *
 * The art school's first exercises, painted by the rules of application
 * rather than copied from a picture - and then built on, without end.
 *
 * One solid stands in a plain room - a sphere, a cube, a tetrahedron or an
 * octahedron - whose eye level runs through the middle of the canvas (the
 * vanishing point is its centre). Then the painter keeps going: it connects
 * another solid to one already standing, on its top or set against its
 * side, and builds it on the canvas; now and then it takes one away and
 * paints back what was behind it, or reworks one. It never finishes, and
 * the structure becomes something nobody planned.
 *
 * Before a stroke is laid each solid is mapped (premap): every corner
 * carried into the picture, every plane found facing the eye or not (three
 * at most are shown), each level plane found under the horizon (its top
 * seen), over it (its underside) or on it (an edge), which also sets the
 * angle of each corner. The first solid - the seed - is found from the
 * horizon; every solid after it is squared to the seed, so its lines run to
 * the seed's vanishing points on the horizon, and its level planes are seen
 * against the seed's top: under it, level with it (the seed's top carried
 * on) or over it. Which of two solids stands in front is found by looking
 * along the eye's rays (inFront), and nothing is painted over what stands
 * in front of it.
 *
 * A solid is built by the rules of application: its shadows first; a
 * sphere as brush shapes stacked inside its volume, the outermost ring
 * first and the highlight last; a flat-sided solid by points. The seed
 * begins at the corner farthest from the eye, upright, square to the floor;
 * a solid built on begins where it meets what it stands on or against, then
 * the right angle off it - the edges leaving the join square to it, each
 * run on toward the vanishing point it shares with the seed. Each new point
 * gives a line its tilt, more points close a plane, and the plane is filled
 * before the next is begun.
 *
 * Mediums. A painting is in one medium - oil, gouache, watercolour or
 * charcoal - and a medium is a handful of physical properties (MEDIA): how
 * far it covers, how long it stays wet, how much of the wet paint under it
 * a stroke drags in, how it runs, how the ground's tooth shows through it,
 * its body, how much of it lifts off again. Its rules of work are derived
 * from those, not written for it (rulesOf): what cannot cover can only
 * darken, so it goes on light first, its lights left bare or lifted where it
 * lifts well, and what one thin wash cannot reach it glazes again; what
 * stays wet blends; what dries is worked into wet or on dry. The same
 * restraint shapes what it builds: a medium that cannot cover takes things
 * away about as seldom as it can lift them, reworks a solid only in its own
 * colour, deeper, and puts nothing where it could not paint over what is
 * there. The painter keeps a picture of its canvas (paintState): the colour
 * of each part, how long ago it was painted, what was meant there. Each
 * stroke is laid by the medium (lay), along its length what is meant there:
 * a transparent stroke on dry paint darkens only what is lighter than it,
 * and into its own wet wash it runs together with it; an opaque stroke into
 * wet paint goes on a little stronger and drags some of what it went
 * through to its end. What the medium leaves open - into wet or on dry,
 * thin or full, blended or left (freedomsOf) - is chosen for each form, and
 * after each change the painter looks at the canvas, measures how far it is
 * from what was meant, corrects the worst of it as far as the medium
 * allows, and reports the error, so it learns which handling suits which
 * form.
 *
 * Mutation. The platonic solids are where it starts, not all it can make:
 * a square stretched into a rectangle - taller, flatter, longer - a sphere
 * turned into a cylinder, a tetrahedron's triangles into a pyramid of more
 * sides or a cone, its corners softened, the solid made to be seen through.
 *
 * Light between the solids. A solid's shadow runs along the floor, and
 * where it meets an upright plane - a side of another solid, the wall - it
 * climbs it: each corner carried down the light onto that plane, so the
 * shadow is turned to the plane's angle and pressed by its tilt, beginning
 * nearest the light; on a curved solid it wraps round it. The shadows of
 * one solid are worked out and painted first, then what the next throws.
 * Clutter shuts out some of the light from round about - the nearer and
 * the more a surface faces it, the more (occlusion) - and each solid gives
 * some of its colour to what faces it (diffusion), so the light is carved
 * into peaks and valleys of colour, not laid flat.
 *
 * Learning. Each change is judged - the picture as a whole, before and
 * after, by the taste learned from votes - and what it did is kept against
 * what the change was, across paintings; the next change is chosen by what
 * such changes have done, the untried given their chance, the same
 * arrangement made again counting against itself. Two changes that did
 * well together are kept as a form and built again, varied. Its rules come
 * one at a time, each only once those it stands on have gone well (RULES):
 * joining before stacking, stretching before turning or softening, forms
 * before varying them. What it has learned sets how much it takes on.
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
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  // How far apart two colours look, 0 to about 255.
  const apart = (a, b) => Math.sqrt((2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2) / 9);
  function hsl(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }

  const KINDS = ["sphere", "cube", "tetrahedron", "octahedron", "stack"];
  const SOLIDS = ["sphere", "cube", "tetrahedron", "octahedron"];
  const NAMES = { sphere: "a sphere", cube: "a cube", tetrahedron: "a tetrahedron", octahedron: "an octahedron" };
  const theOf = (P) => P.name.replace(/^an? /, "the ");

  /* The room and the eye. World units (a cube's edge is one): the eye is
   * `eye` above the floor, looking level along +z, so the horizon is the
   * middle of the canvas and the vanishing point its centre; the wall is
   * `wall` away; `lens` is the focal length against the canvas's short side.
   *   size     the first solid's height against the canvas's short side
   *   foot     how far down the canvas the foot of a solid may come
   *   rings    a sphere's rings, rim to front
   *   batch    strokes to a step at most
   *   turns    turns tried for the first solid to show the planes wanted
   *   rest     ms the painting is left to be seen after each change */
  const ROOM = { eye: 2, wall: 10, lens: 1.15, size: 0.24, foot: 0.93, rings: 9, batch: 90, turns: 120, rest: 1600 };
  /* The structure (how much of it there is, and how it changes, is learned: Learning).
   *   tries    places tried for a new solid
   *   near     the nearest a solid may stand to the eye; `back`, its room before the wall
   *   margin   the canvas's edge kept clear
   *   hidden   how much of a new solid may stand hidden behind others; `covers`, how much of one it may hide
   *   dark     how much of where a solid goes may be too dark to paint it over, in a medium that cannot cover
   *   touch    how near two solids may come (they touch, never pass into each other)
   *   kinds    how often each solid is the next */
  const BUILD = { tries: 40, near: 2.8, back: 0.6, margin: 0.03, hidden: 0.55, covers: 0.8, dark: 0.04, touch: 0.006,
    kinds: { cube: 0.45, sphere: 0.2, tetrahedron: 0.2, octahedron: 0.15 } };

  /* ── Mediums ──────────────────────────────────────────────────────────
   * What a medium is: what the paint does once it leaves the brush.
   *   cover   how far a stroke hides what is under it (under a half, what
   *           is under always shows through: only darker can go on)
   *   wet     how long it stays open, in strokes laid since (0: a dry medium)
   *   pickup  how much of the wet paint under it a stroke drags into itself
   *   bleed   how far wet paint runs into the wet paint beside it
   *   grain   how much of the ground's tooth shows through it
   *   body    how thick it stands (its ridges catch the light)
   *   lift    how much of it can be taken back off
   *   mono    values only, no colour */
  const MEDIA = {
    oil: { cover: 0.95, wet: 2400, pickup: 0.26, bleed: 0, grain: 0.05, body: 0.7, lift: 0.85, mono: false },
    gouache: { cover: 0.92, wet: 50, pickup: 0.1, bleed: 0, grain: 0.1, body: 0.1, lift: 0.5, mono: false },
    watercolour: { cover: 0, wet: 160, pickup: 0, bleed: 0.55, grain: 0.3, body: 0, lift: 0.45, mono: false },
    charcoal: { cover: 0.2, wet: 0, pickup: 0, bleed: 0, grain: 0.55, body: 0, lift: 0.75, mono: true },
  };
  const MEDIUMS = Object.keys(MEDIA);
  const PAPER = [246, 243, 236], DRAWING_PAPER = [238, 235, 228], CHARCOAL = [40, 38, 44];
  /* A medium's rules of work, from its properties:
   *   darkenOnly  it cannot hide what is under it, so nothing lighter goes
   *               on over it: light first
   *   reserve     its lights are the ground, left bare - they cannot be had back
   *   liftLights  its lights are taken out of a tone laid over them
   *   blends      laid into wet paint, a stroke mixes with it
   *   dries       drying is part of the work: into wet, or wait for it to dry
   *   bleeds      wet into wet, it runs
   *   lines       under a wash that cannot be lifted the drawing shows to the end, so it is drawn light
   *   value       it has values, not colours */
  function rulesOf(m) {
    const darkenOnly = m.cover < 0.5;
    return { darkenOnly, reserve: darkenOnly && m.lift < 0.6, liftLights: darkenOnly && m.lift >= 0.6, blends: m.pickup > 0 && m.wet > 0,
      dries: m.wet > 0 && m.wet < 1000, bleeds: m.bleed > 0, lines: darkenOnly && m.lift < 0.6 ? "light" : "paint", value: m.mono };
  }
  /* What a medium leaves open - what to do with the paint - and so what is
   * chosen for each form: into wet or on dry where it dries, blended or
   * left where it blends (a brush or the stump), thin or full. */
  function freedomsOf(m) {
    const r = rulesOf(m), f = {};
    if (r.dries) f.wet = ["into wet", "on dry"];
    if (r.blends || r.value) f.handling = ["blended", "left"];
    f.load = ["thin", "full"];
    return f;
  }
  // A colour as a value: charcoal's dark to the paper's light, the scene's values stretched over the whole of that.
  const valueOf = (c) => mix(CHARCOAL, DRAWING_PAPER, clamp((lum(c) - 25) / 185, 0, 1));
  /* How the painter looks.
   *   cells   cells across the canvas's short side, in its picture of the canvas
   *   off     how far a cell may be from what was meant before it counts as wrong
   *   edge    a cell this varied inside is an edge or a mark, not a colour
   *   most    corrections after a change, at most
   *   apart   cells between two corrections */
  const LOOK = { cells: 80, off: 22, edge: 46, most: 16, apart: 3 };

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
  /* A pyramid: `sides` triangles round a level base of radius `r`, `h`
   * high - three make a tetrahedron's shape, many a cone's. */
  function pyramidSolid(r, sides, h) {
    const verts = [];
    for (let k = 0; k < sides; k++) {
      const t = Math.PI / 2 + k * 2 * Math.PI / sides;
      verts.push([r * Math.cos(t), -h / 4, r * Math.sin(t)]);
    }
    verts.push([0, h * 3 / 4, 0]);
    const faces = [{ name: "base", idx: Array.from({ length: sides }, (_, k) => sides - 1 - k) }];
    for (let k = 0; k < sides; k++) faces.push({ name: "side", idx: [k, (k + 1) % sides, sides] });
    return { verts, faces, low: -h / 4, high: h * 3 / 4 };
  }
  // A prism of `sides` round a level ring of radius `r`, `h` high: with many sides, a cylinder's frame.
  function prismSolid(r, h, sides) {
    const verts = [];
    for (const y of [-h / 2, h / 2]) for (let k = 0; k < sides; k++) verts.push([r * Math.cos(k * 2 * Math.PI / sides), y, r * Math.sin(k * 2 * Math.PI / sides)]);
    const faces = [{ name: "bottom", idx: Array.from({ length: sides }, (_, k) => sides - 1 - k) }, { name: "top", idx: Array.from({ length: sides }, (_, k) => sides + k) }];
    for (let k = 0; k < sides; k++) faces.push({ name: "side", idx: [k, (k + 1) % sides, sides + (k + 1) % sides, sides + k] });
    return { verts, faces, low: -h / 2, high: h / 2 };
  }
  // A solid stretched along its three ways: a cube into a box, squares into rectangles (Mutation).
  const stretched = (shape, st) => (!st || st.every((v) => v === 1) ? shape
    : { ...shape, verts: shape.verts.map(([x, y, z]) => [x * st[0], y * st[1], z * st[2]]), low: shape.low * st[1], high: shape.high * st[1] });
  // Turned about the upright by `yaw`, its middle carried to `at`.
  function place(solid, yaw, at) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const verts = solid.verts.map(([x, y, z]) => [x * c + z * s + at[0], y + at[1], -x * s + z * c + at[2]]);
    return { ...solid, verts, middle: at };
  }
  const SIZES = { cube: 1, tetrahedron: 1.25, octahedron: 1.05, pyramid: 1.1, cylinder: 0.9, cone: 1 };
  // The solids that are curved: painted round, in strokes that follow the curve; the rest are built plane by plane.
  const ROUND = new Set(["sphere", "cylinder", "cone"]);
  /* A solid that can stand, as its form says (Mutation): an octahedron on a
   * face; a pyramid of so many sides; a cylinder or a cone (a frame of many
   * sides); and any of them stretched. */
  function shapeOf(kind, e, form = {}) {
    let shape;
    if (kind === "cube") shape = cubeSolid(e);
    else if (kind === "tetrahedron") shape = tetraSolid(e);
    else if (kind === "octahedron") shape = octaSolid(e, true);
    else if (kind === "pyramid") shape = pyramidSolid(e / (2 * Math.sin(Math.PI / (form.sides || 4))), form.sides || 4, e * 0.95);
    else if (kind === "cylinder") shape = prismSolid(e / 2, e, 24);
    else shape = pyramidSolid(e / 2, 24, e * 1.15);
    return stretched(shape, form.stretch);
  }
  // What a solid is called, as its form makes it.
  function nameFor(kind, form = {}) {
    const st = form.stretch || [1, 1, 1], wide = Math.max(st[0], st[2]);
    if (kind === "cube") return st.every((v) => Math.abs(v - 1) < 0.06) ? "a cube" : st[1] > 1.25 * wide ? "a tall box" : st[1] < 0.75 * Math.min(st[0], st[2]) ? "a slab" : "a box";
    if (kind === "pyramid") return "a " + (["three", "four", "five", "six", "seven", "eight"][(form.sides || 4) - 3] || "many") + "-sided pyramid";
    if (kind === "cylinder") return st[1] < 0.6 ? "a disc" : "a cylinder";
    if (kind === "cone") return "a cone";
    return NAMES[kind];
  }
  const plural = (name) => { const w = name.replace(/^an? /, ""); return /hedron$/.test(w) ? w.replace(/on$/, "a") : /(x|s)$/.test(w) ? w + "es" : w + "s"; };

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
      // (Square to the face itself, outward: a stretched solid's faces no longer face away from its middle.)
      let normal = unit(cross(sub(world[1], world[0]), sub(world[2], world[1])));
      if (dot(normal, sub(centre, solid.middle)) < 0) normal = times(normal, -1);
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
      hue: solidHue,
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
   * rich). Where it is (`at`, a point), the solids standing near it count
   * too: clutter shuts out some of the light from all round - the nearer
   * and the more it faces them, the more (occlusion) - and each gives back
   * some of its own colour onto what faces it (diffusion of nearby
   * colours); and close over what a solid stands on, in the crevice, it is
   * darker. `direct: 0` is the surface out of the light (in a shadow). */
  function shade(S, base, n, Z, { shine = 0, bounce = 0.6, lift = 0, at = null, self = null, direct = 1 } = {}) {
    const { L, colour: lit, ambient: amb } = S.light;
    const d = Math.max(0, dot(n, L)) * direct;
    let keep = 1, give = null;
    if (at && S.pieces?.length) {
      let occ = 0, w = 0;
      const tint = [0, 0, 0];
      for (const Q of S.pieces) {
        if (!Q.alive || Q === self || !Q.base) continue;
        const m = Q.middle || Q.placed.middle, dv = sub(m, at), dist = Math.hypot(dv[0], dv[1], dv[2]) || 1;
        const near = clamp(((Q.high - Q.low) * 0.55 + 0.15) / dist, 0, 1) ** 2, facing = Math.max(0, dot(n, dv) / dist);
        occ += near * (0.3 + 0.7 * facing);
        if (near * facing > 0) { for (let i = 0; i < 3; i++) tint[i] += Q.base[i] * near * facing; w += near * facing; }
      }
      if (self && n[1] < 0.9) occ += 0.3 * Math.exp(-Math.max(0, at[1] - self.low) / 0.15);
      keep = 1 - clamp(occ * 0.5, 0, 0.45);
      if (w > 0) give = { colour: tint.map((v) => v / w), amount: clamp(w * 0.4, 0, 0.24) };
    }
    let c = base.map((b, i) => b * (0.5 * keep * amb[i] / 255 + 0.78 * d * lit[i] / 255) + lift);
    if (give) c = c.map((v, i) => v + base[i] * give.colour[i] / 255 * give.amount * (1 - 0.5 * d));
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
   * breathed round it - the study's order of application does that work.
   * `meant` gives what was meant at any point under it (the form's own
   * colour there), for the painter to measure the canvas against. */
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
  // A shape in the picture a little larger (no gap where two meet), for strokes to be laid inside.
  function clipOf(shape, by = 1.2) {
    const mx = shape.reduce((t, q) => t + q[0], 0) / shape.length, my = shape.reduce((t, q) => t + q[1], 0) / shape.length;
    return shape.map(([x, y]) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + (x - mx) / d * by, y + (y - my) / d * by]; });
  }
  function inPoly(poly, x, y) {
    // (Its box first: most points asked about are nowhere near it.)
    const b = poly.box || (poly.box = boxOf([poly]));
    if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) return false;
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }
  // The box round some shapes, and whether two boxes meet.
  function boxOf(shapes) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const shape of shapes) for (const [x, y] of shape) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0, y0, x1, y1 };
  }
  const boxesMeet = (a, b) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1;
  function strokeMeets(s, box) {
    const r = s.width;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of s.points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return boxesMeet({ x0: x0 - r, y0: y0 - r, x1: x1 + r, y1: y1 + r }, box);
  }
  // Convex hull of points in a plane, in order.
  function hull2(points) {
    const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }
  // An ellipse as a polygon.
  const oval = (cx, cy, rx, ry, n = 24) => Array.from({ length: n }, (_, k) => [cx + rx * Math.cos(k / n * 2 * Math.PI), cy + ry * Math.sin(k / n * 2 * Math.PI)]);

  /* ── The painter's picture of its canvas ─────────────────────────────
   * In cells: the colour each is (as the strokes are expected to leave it,
   * and as it is seen once they have landed), when it was last painted (so
   * whether it is still wet), what was meant there, and the stroke that
   * laid it. The clock is strokes laid. */
  function paintState(W, H, ground, grain = 0) {
    const n = Math.max(6, Math.round(Math.min(W, H) / LOOK.cells)), cols = Math.ceil(W / n), rows = Math.ceil(H / n), N = cols * rows;
    const colour = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) colour.set(ground, k * 3);
    // (A toothy medium varies inside a cell where nothing is wrong.)
    const edge = LOOK.edge + 110 * grain;
    return { n, cols, rows, colour, want: new Float32Array(N * 3), has: new Uint8Array(N), vary: new Float32Array(N), line: new Uint8Array(N),
      laid: new Float64Array(N).fill(-1e9), by: new Array(N).fill(null), clock: 0, seen: null, edge };
  }
  const cellAt = (P, x, y) => (x < 0 || y < 0 || x >= P.cols * P.n || y >= P.rows * P.n ? -1 : Math.floor(y / P.n) * P.cols + Math.floor(x / P.n));
  // Where a stroke can land: inside its own shape and the part being worked again, never on what stands in front.
  function canLand(s, x, y) {
    if (s.clip && s.clip.length >= 3 && !inPoly(s.clip, x, y)) return false;
    if (s.within && !s.within.some((p) => inPoly(p, x, y))) return false;
    return !(s.clipOut && s.clipOut.some((p) => inPoly(p, x, y)));
  }
  // The cells a stroke lands on.
  function cellsOf(P, s) {
    const pts = s.points, r = s.width * 0.5, r2 = r * r, out = [], segs = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], dx = pts[k][0] - ax, dy = pts[k][1] - ay;
      segs.push([ax, ay, dx, dy, dx * dx + dy * dy || 1]);
    }
    if (!segs.length) segs.push([pts[0][0], pts[0][1], 0, 0, 1]);
    const i0 = Math.max(0, Math.floor((x0 - r) / P.n)), i1 = Math.min(P.cols - 1, Math.floor((x1 + r) / P.n));
    const j0 = Math.max(0, Math.floor((y0 - r) / P.n)), j1 = Math.min(P.rows - 1, Math.floor((y1 + r) / P.n));
    for (let j = j0; j <= j1; j++) {
      const y = (j + 0.5) * P.n;
      for (let i = i0; i <= i1; i++) {
        const x = (i + 0.5) * P.n;
        let near = false;
        for (const [ax, ay, dx, dy, l] of segs) {
          const t = clamp(((x - ax) * dx + (y - ay) * dy) / l, 0, 1), ex = x - ax - t * dx, ey = y - ay - t * dy;
          if (ex * ex + ey * ey <= r2) { near = true; break; }
        }
        if (near && canLand(s, x, y)) out.push(j * P.cols + i);
      }
    }
    return out;
  }
  /* A stroke laid by its medium. What it does over what is there decides
   * how it goes on and in what colour, and the painter's picture of the
   * canvas is moved on to what it will look like. Null when the medium will
   * not let it go on at all (nothing lighter over a transparent medium). */
  function lay(S, s) {
    const P = S.paint, M = S.M, R = S.rules, A = s.app || S.app || {}, C = P.colour;
    const cells = cellsOf(P, s);
    const probe = cells.length ? cells : s.points.map(([x, y]) => cellAt(P, x, y)).filter((k) => k >= 0);
    if (!probe.length) return null;
    if (!s.intended) s.intended = s.colour;
    // (A solid seen through carries thinner paint: Mutation.)
    const full = A.load !== "thin", see = A.opacity ?? 1, lumAt = (k) => 0.299 * C[k * 3] + 0.587 * C[k * 3 + 1] + 0.114 * C[k * 3 + 2];
    const under = [0, 0, 0];
    let wet = 0;
    for (const k of probe) {
      under[0] += C[k * 3]; under[1] += C[k * 3 + 1]; under[2] += C[k * 3 + 2];
      if (P.clock - P.laid[k] < M.wet) wet++;
    }
    for (let i = 0; i < 3; i++) under[i] /= probe.length;
    const intoWet = wet > probe.length / 2;
    const value = (c) => (R.value ? valueOf(c) : c);
    const meant = value(s.intended);
    /* A long stroke follows what is meant along it: what is meant at each
     * end, and what is under each end, give its colour at each end - the
     * brush reloaded as it goes, so stroke meets stroke without a step. */
    const a0 = s.points[0], a1 = s.points[s.points.length - 1], dx = a1[0] - a0[0], dy = a1[1] - a0[1], len2 = dx * dx + dy * dy;
    const along = Boolean(s.meant) && !s.soften && !s.lift && len2 > 4 * P.n * P.n;
    const m0 = along ? value(s.meant(a0[0], a0[1])) : meant, m1 = along ? value(s.meant(a1[0], a1[1])) : meant;
    // (Where a cell lies along the stroke, 0 to 1.)
    const tOf = (k) => (along ? clamp((((k % P.cols) + 0.5) * P.n - a0[0]) * dx / len2 + ((Math.floor(k / P.cols) + 0.5) * P.n - a0[1]) * dy / len2, 0, 1) : 0);
    const ends = (c0, c1) => { s.colour = paint(c0); if (along && apart(c0, c1) > 1) s.smear = paint(c1); };
    let after;   // a cell (at C[o..o+2], t along the stroke) as the stroke leaves it
    const toward = (to, f) => (o) => { for (let i = 0; i < 3; i++) C[o + i] += (to[i] - C[o + i]) * f; };
    if (s.soften) {
      // A clean brush (or the stump) drawn through what is there: it carries a little of it along.
      s.colour = paint(under); s.alpha = 0.4; s.tip = "soft"; s.plain = true;
      after = toward(under, 0.3);
    } else if (s.lift) {
      // Taken back off toward the ground, as far as the medium gives it back.
      s.colour = paint(S.bare); s.alpha = M.lift * s.lift; s.tip = "soft"; s.plain = true; s.grain = M.grain * 0.6;
      after = toward(S.bare, s.alpha * 0.85);
      S.notes.lifted++;
    } else if (R.darkenOnly) {
      let space = 0;
      const light = lum(meant) + 3, load = (full ? 0.9 : 0.62) * see;
      for (const k of probe) if (lumAt(k) > light) space++;
      if (intoWet && R.bleeds) {
        // Into its own wet wash it runs together with it - lighter or darker, a bloom where it is lighter - and spreads.
        s.alpha = load; s.plain = true;
        ends(m0, m1);
        s.bleed = +(M.bleed * (A.wet === "on dry" ? 0.5 : 1)).toFixed(3);
        const f = load * 0.85;
        after = (o, t) => { for (let i = 0; i < 3; i++) C[o + i] += (m0[i] + (m1[i] - m0[i]) * t - C[o + i]) * f; };
      } else if (lum(meant) > lum(under) + 4 && (R.liftLights || s.fix)) {
        // Meant lighter than what is there: nothing lighter goes on, so the light is taken back out of it (the eraser, a damp brush).
        const need = clamp((lum(under) - lum(meant)) / Math.max(8, lum(under) - lum(S.bare)), 0, 1);
        if (need < 0.03) return null;
        s.colour = paint(S.bare); s.alpha = +Math.min(M.lift, need * 1.15).toFixed(3); s.tip = "soft"; s.plain = true; s.grain = M.grain * 0.6;
        after = toward(S.bare, s.alpha * 0.85);
        S.notes.lifted++;
      } else if (!space) {
        // Everywhere under it already darker than it: it would do nothing, and is left.
        S.notes.kept++;
        return null;
      } else {
        /* On dry, it darkens what is lighter than it and leaves what is
         * darker: over the ground or a lighter wash it lands on what is meant
         * (a thin wash only part of the way, and is glazed again), and where
         * two strokes overlap it never doubles. */
        s.alpha = load; s.plain = true; s.blend = "darken";
        ends(m0, m1);
        const f = load * 0.92;
        after = (o, t) => { for (let i = 0; i < 3; i++) C[o + i] += (Math.min(C[o + i], m0[i] + (m1[i] - m0[i]) * t) - C[o + i]) * f; };
        // The ground's tooth: a dry medium catches on it everywhere, a wash settles into it where it is dark.
        s.grain = +(M.grain * (R.value ? 1 : 0.35 + 0.65 * (1 - lum(meant) / 255)) * (full ? 1 : 1.35)).toFixed(3);
      }
    } else {
      /* Opaque: it covers. Into wet paint it drags in some of what is under
       * it, so it goes on a little stronger than what is meant and its far
       * end carries some of what it went through - between them, about what
       * was meant. */
      const p = intoWet && M.pickup ? M.pickup * (full ? 1 : 1.3) : 0;
      const push = (m) => (p ? m.map((w, i) => clamp(w + 0.4 * p * (w - under[i]) / (1 - p), 0, 255)) : m);
      const put0 = push(m0), put1 = p ? mix(m1, under, p) : m1;
      ends(put0, put1);
      if (p && !s.smear) s.smear = paint(put1);
      s.alpha = Math.min(1, M.cover * (full ? 1 : 0.85) * see);
      // Thick where it is light (fat over lean): its ridges catch the light. A soft brush leaves none.
      if (M.body && !s.line && s.tip !== "soft" && A.form !== "broad") s.body = [+(M.body * (full ? 1 : 0.4) * (0.35 + 0.65 * lum(meant) / 255)).toFixed(3), S.lightX, S.lightY];
      if (M.grain) s.grain = +(M.grain * (full ? 1 : 2.2)).toFixed(3);
      if (M.body < 0.3) s.plain = true;
      const a = s.alpha;
      after = (o, t) => { for (let i = 0; i < 3; i++) C[o + i] += (put0[i] + (put1[i] - put0[i]) * t - C[o + i]) * a; };
    }
    // (Where a line runs is the drawing: it is not measured against the colour meant there, nor corrected.)
    if (s.line) {
      const steps = Math.ceil(Math.sqrt(len2) / (P.n / 2)) + 1;
      for (let i = 0; i <= steps; i++) { const k = cellAt(P, a0[0] + dx * i / steps, a0[1] + dy * i / steps); if (k >= 0) P.line[k] = 1; }
    }
    // The picture of the canvas as the stroke leaves it, and what was meant where it landed.
    const keepsMeaning = s.soften || s.lift;
    for (const k of cells) {
      after(k * 3, tOf(k));
      P.laid[k] = P.clock;
      if (keepsMeaning) continue;
      const w = s.meant ? value(s.meant(((k % P.cols) + 0.5) * P.n, (Math.floor(k / P.cols) + 0.5) * P.n)) : meant;
      P.want[k * 3] = w[0]; P.want[k * 3 + 1] = w[1]; P.want[k * 3 + 2] = w[2];
      P.has[k] = 1;
      P.by[k] = s;
    }
    // (A guide is laid lightly.)
    if (s.faint) s.alpha = +((s.alpha || 0.9) * 0.45).toFixed(3);
    P.clock++;
    return s;
  }
  /* The painter looks: once a step has landed, its picture of the canvas is
   * what the canvas shows (`S.seen`, given it by whoever paints the steps):
   * each cell's colour, and how much it varies inside (an edge, or a mark). */
  function sync(S) {
    const P = S.paint, seen = S.seen;
    if (!seen || seen === P.seen || seen.width !== S.cam.W || seen.height !== S.cam.H) return;
    P.seen = seen;
    const px = seen.pixels, W = seen.width, H = seen.height, n = P.n, q = n / 4;
    for (let j = 0; j < P.rows; j++) {
      for (let i = 0; i < P.cols; i++) {
        let r = 0, g = 0, b = 0, lo = 255, hi = 0;
        for (let s = 0; s < 4; s++) {
          const x = Math.min(W - 1, Math.floor(i * n + (s & 1 ? 3 : 1) * q)), y = Math.min(H - 1, Math.floor(j * n + (s & 2 ? 3 : 1) * q)), o = (y * W + x) * 4;
          r += px[o]; g += px[o + 1]; b += px[o + 2];
          const l = 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2];
          if (l < lo) lo = l;
          if (l > hi) hi = l;
        }
        const k = j * P.cols + i;
        P.colour[k * 3] = r / 4; P.colour[k * 3 + 1] = g / 4; P.colour[k * 3 + 2] = b / 4;
        P.vary[k] = hi - lo;
      }
    }
  }
  // A cell that is one colour, meant as one: not an edge, a line or a mark (the ground's tooth allowed for).
  function plainCell(P, k) {
    if (P.line[k] || P.vary[k] > P.edge) return false;
    const W = P.want, i = k % P.cols;
    for (const d of [i > 0 ? -1 : 0, i < P.cols - 1 ? 1 : 0, -P.cols, P.cols]) {
      const m = k + d;
      if (!d || m < 0 || m >= P.has.length || !P.has[m]) continue;
      if (Math.abs(W[k * 3] - W[m * 3]) + Math.abs(W[k * 3 + 1] - W[m * 3 + 1]) + Math.abs(W[k * 3 + 2] - W[m * 3 + 2]) > 60) return false;
    }
    return true;
  }
  const cellError = (P, k) => apart([P.colour[k * 3], P.colour[k * 3 + 1], P.colour[k * 3 + 2]], [P.want[k * 3], P.want[k * 3 + 1], P.want[k * 3 + 2]]);
  // How far the canvas is from what was meant, over the cells painted since `since`: how many are off, and by how much.
  function measure(S, since) {
    const P = S.paint;
    let n = 0, off = 0, sum = 0;
    for (let k = 0; k < P.has.length; k++) {
      if (!P.has[k] || P.laid[k] < since || !plainCell(P, k)) continue;
      const e = cellError(P, k);
      n++; sum += e;
      if (e > LOOK.off) off++;
    }
    return { n, rate: n ? off / n : 0, mean: n ? sum / n / 255 : 0 };
  }
  /* How much of a shape is still lighter than meant: a medium that only
   * darkens, laid thin, goes part of the way, and is glazed again. */
  function shortOf(S, shape) {
    const P = S.paint, b = shape.box || (shape.box = boxOf([shape]));
    sync(S);
    let n = 0, light = 0;
    for (let j = Math.max(0, Math.floor(b.y0 / P.n)); j <= Math.min(P.rows - 1, Math.floor(b.y1 / P.n)); j++) {
      for (let i = Math.max(0, Math.floor(b.x0 / P.n)); i <= Math.min(P.cols - 1, Math.floor(b.x1 / P.n)); i++) {
        const k = j * P.cols + i;
        if (!P.has[k] || P.line[k] || !inPoly(shape, (i + 0.5) * P.n, (j + 0.5) * P.n)) continue;
        n++;
        const o = k * 3;
        if (0.299 * (P.colour[o] - P.want[o]) + 0.587 * (P.colour[o + 1] - P.want[o + 1]) + 0.114 * (P.colour[o + 2] - P.want[o + 2]) > 12) light++;
      }
    }
    return n ? light / n : 0;
  }
  /* A look: before it goes on, the study has to see the canvas as it is -
   * whoever paints its steps paints what it has before going on (`look`). */
  const look = (label) => ({ label, strokes: [], look: true });
  // Glazed again while it is short of its value - on dry, once the last is dry - three layers at most.
  function* glazes(S, E, shape, label, again) {
    if (!S.rules.darkenOnly) return;
    for (let layer = 2; layer <= 3; layer++) {
      yield look(label);
      if (shortOf(S, shape) <= 0.25) return;
      if ((E?.app || S.app).wet === "on dry") S.paint.clock += S.M.wet;
      yield* inSteps(label + ", glazed again", again());
    }
  }
  /* The worst of what is off, corrected: a short stroke where each of the
   * worst cells is (a few, apart), laid the way the stroke that painted it
   * went and inside the same shape, in what was meant there - as far as
   * the medium lets it go on. */
  function corrections(S, since) {
    const P = S.paint, worst = [], picked = [], out = [];
    for (let k = 0; k < P.has.length; k++) {
      if (!P.has[k] || P.laid[k] < since || !P.by[k] || !plainCell(P, k)) continue;
      const e = cellError(P, k);
      if (e > LOOK.off * 1.3) worst.push([e, k]);
    }
    worst.sort((a, b) => b[0] - a[0]);
    for (const [, k] of worst) {
      if (picked.length >= LOOK.most) break;
      const i = k % P.cols, j = Math.floor(k / P.cols);
      if (picked.some(([pi, pj]) => Math.abs(pi - i) < LOOK.apart && Math.abs(pj - j) < LOOK.apart)) continue;
      picked.push([i, j]);
      const src = P.by[k], x = (i + 0.5) * P.n, y = (j + 0.5) * P.n;
      const a = src.points[0], b = src.points[src.points.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const [ux, uy] = l > 1 ? [(b[0] - a[0]) / l, (b[1] - a[1]) / l] : [1, 0], half = clamp(l / 3, P.n, P.n * 2.5);
      out.push(stroke(S, [[x - ux * half, y - uy * half], [x, y], [x + ux * half, y + uy * half]], Math.max(3, Math.min(src.width, P.n * 3)),
        src.meant ? src.meant(x, y) : src.intended || src.colour, src.tip === "flat" ? "flat" : "soft",
        { clip: src.clip, within: src.within, clipOut: src.clipOut, meant: src.meant, app: src.app, fix: true }));
    }
    return out;
  }

  /* ── The room: wall, then floor, far to near ─────────────────────────── */
  function* room(S) {
    const { cam } = S, W = cam.W, H = cam.H, side = S.light.side;
    const meet = meetOf(cam);
    const wallLit = shade(S, S.palette.wall, [0, 0, -1], ROOM.wall);
    const wallAt = (x, y) => wallLit.map((v) => v * (1 + 0.16 * side * (x / W - 0.5) * 2 - 0.05 * (1 - clamp(y, 0, meet) / meet)));
    const floorAt = (x, y) => { const Z = Math.min(ROOM.wall, planeDepth(cam, Math.max(y, meet))); return shade(S, S.palette.floor, [0, 1, 0], Z, { at: [(x - cam.cx) * Z / cam.f, 0, Z] }).map((v) => v * (1 + 0.12 * side * (x / W - 0.5) * 2)); };
    // The wall: soft and even, a little lighter toward the light.
    const rowW = Math.max(6, (meet / 9)), wall = wallStrokes(S, meet, rowW, wallAt);
    yield* inSteps("the wall", wall);
    const wallShape = [[0, 0], [W, 0], [W, meet], [0, meet]], floorShape = [[0, meet], [W, meet], [W, H], [0, H]];
    yield* glazes(S, null, wallShape, "the wall", () => wallStrokes(S, meet, rowW, wallAt));
    // On dry: the wall left to dry before the floor meets it, so the line between them stays.
    if (S.app.wet === "on dry") S.paint.clock += S.M.wet;
    yield* inSteps("the floor", floorStrokes(S, meet, floorAt));
    yield* glazes(S, null, floorShape, "the floor", () => floorStrokes(S, meet, floorAt));
  }
  // The wall in soft rows (each row begun somewhere else, so no seam runs down it).
  function wallStrokes(S, meet, rowW, wallAt) {
    const W = S.cam.W, wall = [];
    for (let y = rowW / 2; y < meet + rowW * 0.4; y += rowW * 0.8) {
      for (let x = -W * (0.05 + S.rng() * 0.2); x < W * 1.05; x += W * (0.17 + S.rng() * 0.1)) {
        const len = W * (0.24 + S.rng() * 0.08), x0 = x + (S.rng() - 0.5) * W * 0.05, y0 = Math.min(meet, y + (S.rng() - 0.5) * rowW * 0.3);
        wall.push(stroke(S, [[x0, y0], [x0 + len * 0.5, y0 + (S.rng() - 0.5) * rowW * 0.2], [x0 + len, y0]], rowW * 1.6, wallAt(x0 + len / 2, y0), "soft", { meant: wallAt }));
      }
    }
    return wall;
  }
  // The floor from where it meets the wall down, row by row: thin and far first, broad and near last.
  function floorStrokes(S, meet, floorAt) {
    const { cam } = S, W = cam.W, H = cam.H, floor = [];
    let y = meet;
    while (y < H) {
      const Z = planeDepth(cam, y), next = Math.min(H + 2, cam.cy + cam.f * cam.eye / (Z / 1.13)), h = Math.max(2, next - y);
      const near = clamp((ROOM.wall - Z) / (ROOM.wall - 1.5), 0, 1);
      for (let x = -W * (0.04 + S.rng() * 0.16); x < W * 1.04; x += W * (0.14 + S.rng() * 0.08 - 0.04 * near)) {
        const len = W * (0.2 + S.rng() * 0.1 - 0.05 * near), x0 = x + (S.rng() - 0.5) * W * 0.04, ym = y + h / 2 + (S.rng() - 0.5) * h * 0.25;
        floor.push(stroke(S, [[x0, ym], [x0 + len * 0.5, ym + (S.rng() - 0.5) * h * 0.2], [x0 + len, ym]], h * 1.7, floorAt(x0 + len / 2, y),
          near < 0.35 ? "soft" : near < 0.7 ? "filbert" : "flat", { meant: floorAt }));
      }
      y = next;
    }
    return floor;
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
  const hull = (points, h) => hull2(points.map((q) => [q[0], q[2]])).map(([x, z]) => [x, h, z]);
  function* shadowSteps(S, E, ground, label) {
    const { cam } = S, out = [], h = ground.h;
    const shape = shadowOutline(S, E, h), shot = shape.map((p) => project(cam, p));
    (E.shot ||= {})[h > 0 ? "top" : "floor"] = shot;
    const lowest = E.kind === "sphere" ? E.middle[1] - E.radius : Math.min(...E.placed.verts.map((v) => v[1]));
    const standing = Math.abs(lowest - h) < 0.02, contact = E.kind === "sphere" ? E.middle : E.placed.middle;
    const ys = shot.map((p) => p[1]), top = Math.min(...ys), foot = Math.max(...ys);
    const reach = Math.max(...shape.map((p) => Math.hypot(p[0] - contact[0], p[2] - contact[2]))) || 1, clear = 0.8 * (1 - (E.form?.opacity ?? 1));
    // The shadow's colour where it falls: the plane's own, without the light, deepest at the solid's foot.
    const darkAt = (x, y) => {
      const Z = planeDepth(cam, Math.max(y, cam.cy + 1), h), X = (x - cam.cx) * Z / cam.f;
      const far = clamp(Math.hypot(X - contact[0], Z - contact[2]) / reach, 0, 1);
      // (A solid seen through lets some light through its shadow.)
      const dark = shade(S, ground.base, [0, 1, 0], Z, { at: [X, h, Z] }).map((v, i) => v * (0.38 + 0.25 * far) + S.light.ambient[i] * 0.06);
      return clear ? mix(dark, shade(S, ground.base, [0, 1, 0], Z), clear) : dark;
    };
    const rows = Math.max(4, Math.round((foot - top) / Math.max(3, cam.W * 0.012)));
    // (On the floor only as far as the wall: past it, the shadow climbs the wall.)
    const climbs = h === 0 && shape.some((p) => p[2] > ROOM.wall), extra = ground.clip ? { clip: ground.clip } : climbs ? { clip: floorOf(cam) } : {};
    for (let r = 0; r < rows && foot > cam.cy; r++) {
      const y = top + (r + 0.5) * (foot - top) / rows, band = (foot - top) / rows;
      if (y <= cam.cy) continue;
      let start = null;
      const step = Math.max(2, cam.W * 0.008), left = Math.min(...shot.map((p) => p[0])), right = Math.max(...shot.map((p) => p[0]));
      for (let x = left - step; x <= right + step; x += step) {
        const isIn = inPoly(shot, x, y);
        if (isIn && start === null) start = x;
        if (!isIn && start !== null) {
          const mid = (start + x) / 2, Z = planeDepth(cam, y, h), X = (mid - cam.cx) * Z / cam.f;
          const far = clamp(Math.hypot(X - contact[0], Z - contact[2]) / reach, 0, 1);
          out.push(stroke(S, [[start, y], [mid, y + (S.rng() - 0.5) * band * 0.2], [x - step, y]], band * 1.8, darkAt(mid, y),
            !standing || far > 0.6 ? "soft" : "filbert", { ...extra, meant: darkAt }));
          start = null;
        }
      }
    }
    yield* inSteps(label, out);
    if (climbs) yield* castSteps(S, E, wallOf(S));
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
      const lineW = S.lineW, pts = E.map.pts, verts = E.placed.verts;
      for (const e of E.map.edges) {
        if (Math.abs(verts[e.a][1] - h) > 0.02 || Math.abs(verts[e.b][1] - h) > 0.02) continue;
        touch.push(stroke(S, [pts[e.a], pts[e.b]], lineW * 2.4, shade(S, ground.base, [0, 1, 0], e.depth).map((c) => c * 0.32), "filbert", extra));
      }
    }
    if (touch.length) yield { label: "where " + theOf(E) + " stands", strokes: touch };
  }

  /* A solid's shadow on another: each corner of the one - or, for a
   * sphere, the line where the light leaves it - carried down the light
   * onto the plane of each face of the other that the light reaches (from
   * the light's side of it), and the outline of those cut to the face. So
   * the shadow that runs along the floor climbs the side it meets, turned to
   * that face's angle and pressed by its tilt, beginning nearest the light.
   * A curved solid takes it on the plane through its middle square to the
   * light, cut to its outline. */
  function castOn(S, A, B) {
    const L = S.light.L, out = [];
    const points = A.kind === "sphere" ? rimOf(S, A) : A.placed.verts;
    const faces = ROUND.has(B.kind) ? [discOf(S, B)] : B.map.visible;
    for (const f of faces) {
      const nl = dot(f.normal, L);
      if (nl < 0.05) continue;
      const proj = [];
      for (const p of points) {
        const t = dot(f.normal, sub(p, f.centre)) / nl;
        if (t > 1e-3) proj.push(sub(p, times(L, t)));
      }
      if (proj.length < 3) continue;
      const u = unit(sub(f.world[1], f.world[0])), v = cross(f.normal, u);
      const flat = (p) => [dot(sub(p, f.centre), u), dot(sub(p, f.centre), v)];
      const cut = clipConvex(hull2(proj.map(flat)), f.world.map(flat));
      if (cut.length < 3 || Math.abs(areaOf(cut)) < 1e-4) continue;
      let world = cut.map(([a, b]) => add(f.centre, add(times(u, a), times(v, b))));
      // (On a curved solid, each point of it carried on up the light from the plane through its middle to where the light meets it, so the shadow wraps round it.)
      if (f.curved) world = densify(world, 6).map((q) => onSurface(S, B, q));
      out.push({ face: f, world, shot: world.map((p) => project(S.cam, p)) });
    }
    return out;
  }
  const densify = (poly, k) => poly.flatMap((p, i) => Array.from({ length: k }, (_, j) => mix(p, poly[(i + 1) % poly.length], j / k)));
  // A point on a curved solid's middle plane, carried up the light to its surface (where the light first meets it there).
  function onSurface(S, B, q) {
    const L = S.light.L;
    if (B.kind === "sphere") { const d = sub(q, B.middle); return add(q, times(L, Math.sqrt(Math.max(0, B.radius ** 2 - dot(d, d))))); }
    const m = B.placed.middle, level = Math.hypot(L[0], L[2]) || 1e-3, a = dot(sub(q, m), unit([-L[2], 0, L[0]]));
    const radius = (y) => (B.kind === "cone" ? B.radius * clamp((B.high - y) / (B.high - B.low), 0, 1) : B.radius);
    let t = Math.sqrt(Math.max(0, radius(q[1]) ** 2 - a * a)) / level;
    // (A cone narrows as the light climbs it: once more at the height it reaches.)
    if (B.kind === "cone") t = Math.sqrt(Math.max(0, radius(q[1] + L[1] * t) ** 2 - a * a)) / level;
    const p = add(q, times(L, t));
    return [p[0], Math.min(p[1], B.high), p[2]];
  }
  // A curved solid's surface where the eye meets it at a point of the picture: its normal there (as its own painting reads it).
  function roundNormal(S, B, x, y) {
    const { cam } = S;
    if (B.kind === "sphere") {
      const [cx, cy] = project(cam, B.middle), r = cam.f * B.radius / B.middle[2], nx = clamp((x - cx) / r, -1, 1), ny = clamp(-(y - cy) / r, -1, 1);
      return [nx, ny, -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
    }
    const m = B.placed.middle, r = cam.f * B.radius / m[2], nx = clamp((x - project(cam, m)[0]) / r, -1, 1), nz = -Math.sqrt(Math.max(0, 1 - nx * nx));
    return B.kind === "cone" ? unit([nx * (B.high - B.low), B.radius, nz * (B.high - B.low)]) : [nx, 0, nz];
  }
  /* The wall, as somewhere a shadow can climb: the one upright plane every
   * solid stands before, square to the eye, facing the light (the light is
   * always on the eye's side of the solids). */
  const wallOf = (S) => (S.wall ||= { id: "wall", kind: "wall", name: "the wall", low: 0, high: 30, get base() { return S.palette.wall; },
    map: { visible: [{ normal: [0, 0, -1], centre: [0, 15, ROOM.wall], world: [[-40, 0, ROOM.wall], [40, 0, ROOM.wall], [40, 30, ROOM.wall], [-40, 30, ROOM.wall]] }] } });
  // Where the floor meets the wall, in the picture; and the floor below it.
  const meetOf = (cam) => cam.cy + cam.f * cam.eye / ROOM.wall;
  const floorOf = (cam) => [[-cam.W, meetOf(cam)], [2 * cam.W, meetOf(cam)], [2 * cam.W, 2 * cam.H], [-cam.W, 2 * cam.H]];
  // Where the light leaves a sphere: the ring square to the light round its middle.
  function rimOf(S, A) {
    const L = S.light.L, u = unit([-L[2], 0, L[0]]), v = unit(cross(L, u)), pts = [];
    for (let k = 0; k < 32; k++) { const t = k / 32 * Math.PI * 2; pts.push(add(A.middle, add(times(u, A.radius * Math.cos(t)), times(v, A.radius * Math.sin(t))))); }
    return pts;
  }
  // A curved solid's stand-in plane for a shadow: through its middle, turned to the light, as wide and high as it.
  function discOf(S, B) {
    const L = S.light.L, m = B.middle || B.placed.middle, r = B.radius;
    const normal = B.kind === "sphere" ? L : unit([L[0], 0, L[2]]), u = unit(cross([0, 1, 0], normal)), v = cross(normal, u);
    const world = B.kind === "sphere" ? Array.from({ length: 24 }, (_, k) => add(m, add(times(u, r * Math.cos(k / 24 * 2 * Math.PI)), times(v, r * Math.sin(k / 24 * 2 * Math.PI)))))
      : B.kind === "cone" ? [add([m[0], B.low, m[2]], times(u, -r)), add([m[0], B.low, m[2]], times(u, r)), [m[0], B.high, m[2]]]
        : [add([m[0], B.low, m[2]], times(u, -r)), add([m[0], B.low, m[2]], times(u, r)), add([m[0], B.high, m[2]], times(u, r)), add([m[0], B.high, m[2]], times(u, -r))];
    return { normal, centre: times(world.reduce(add, [0, 0, 0]), 1 / world.length), world, curved: true };
  }
  const areaOf = (poly) => poly.reduce((t, p, i) => { const q = poly[(i + 1) % poly.length]; return t + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  // A convex shape cut to a convex shape (each edge of the cutter, in turn).
  function clipConvex(subject, cutter) {
    const sign = areaOf(cutter) > 0 ? 1 : -1;
    let out = subject;
    for (let i = 0; i < cutter.length && out.length; i++) {
      const a = cutter[i], b = cutter[(i + 1) % cutter.length], input = out, d1 = [b[0] - a[0], b[1] - a[1]];
      const inside = (p) => sign * (d1[0] * (p[1] - a[1]) - d1[1] * (p[0] - a[0])) >= 0;
      out = [];
      for (let j = 0; j < input.length; j++) {
        const p = input[j], q = input[(j + 1) % input.length], pin = inside(p), qin = inside(q);
        if (pin) out.push(p);
        if (pin !== qin) {
          const d2 = [q[0] - p[0], q[1] - p[1]], den = d1[0] * d2[1] - d1[1] * d2[0];
          const t = Math.abs(den) < 1e-12 ? 0 : (d1[0] * (a[1] - p[1]) - d1[1] * (a[0] - p[0])) / den;
          out.push([p[0] + d2[0] * t, p[1] + d2[1] * t]);
        }
      }
    }
    return out;
  }
  // Strokes across a shape in the picture, in rows: each row's runs inside it (a long run in lengths of at most `most`, each in its own colour).
  function rowsIn(S, shot, band, colourAt, tip, extra, most = Infinity) {
    const ys = shot.map((p) => p[1]), xs = shot.map((p) => p[0]), top = Math.min(...ys), foot = Math.max(...ys), left = Math.min(...xs), right = Math.max(...xs);
    const rows = Math.max(1, Math.round((foot - top) / band)), step = Math.max(2, S.cam.W * 0.006), out = [];
    for (let r = 0; r < rows; r++) {
      const y = top + (r + 0.5) * (foot - top) / rows, h = (foot - top) / rows;
      let start = null;
      for (let x = left - step; x <= right + step; x += step) {
        const isIn = inPoly(shot, x, y);
        if (isIn && start === null) start = x;
        if (!isIn && start !== null) {
          const from = start - step * 0.5, to = x - step * 0.5, n = Math.max(1, Math.ceil((to - from) / most));
          for (let k = 0; k < n; k++) {
            const a = from + (to - from) * k / n, b = from + (to - from) * (k + 1) / n, mid = n === 1 ? (start + x) / 2 : (a + b) / 2;
            out.push(stroke(S, [[a, y], [mid, y + (S.rng() - 0.5) * h * 0.15], [b, y]], h * 1.8, colourAt(mid, y), tip, extra));
          }
          start = null;
        }
      }
    }
    return out;
  }
  // How far a shape on a level plane (x, z) reaches from a point inside it, the way of another point.
  function reachToward(shape, [mx, mz], [x, z]) {
    const l = Math.hypot(x - mx, z - mz) || 1e-9, ux = (x - mx) / l, uz = (z - mz) / l;
    let best = Infinity;
    for (let i = 0; i < shape.length; i++) {
      const [ax, az] = shape[i], [bx, bz] = shape[(i + 1) % shape.length], ex = bx - ax, ez = bz - az, den = ux * ez - uz * ex;
      if (Math.abs(den) < 1e-12) continue;
      const t = ((ax - mx) * ez - (az - mz) * ex) / den, k = ((ax - mx) * uz - (az - mz) * ux) / den;
      if (t > 0 && k >= 0 && k <= 1) best = Math.min(best, t);
    }
    return best;
  }
  // A solid's shadow painted on another: in the other's own colour there, out of the light.
  function* castSteps(S, A, B) {
    const marks = castOn(S, A, B), out = [], { cam } = S, o = [0, cam.eye, 0];
    (A.shot.on ||= new Map()).set(B.id, marks.map((m) => clipOf(m.shot, 2)));
    for (const m of marks) {
      const f = m.face, clip = clipOf(m.shot, 0.6);
      const darkAt = (x, y) => {
        const d = [(x - cam.cx) / cam.f, -(y - cam.cy) / cam.f, 1], den = dot(f.normal, d), t = Math.abs(den) < 1e-6 ? f.centre[2] : dot(f.normal, sub(f.centre, o)) / den;
        const p = t > 0 ? add(o, times(d, t)) : f.centre;
        return shade(S, B.base, f.curved ? roundNormal(S, B, x, y) : f.normal, p[2], { at: p, self: B, direct: 0 });
      };
      out.push(...rowsIn(S, m.shot, Math.max(3, cam.W * 0.012), darkAt, f.curved ? "soft" : "filbert", { clip, meant: darkAt }));
    }
    if (out.length) yield* inSteps("the shadow of " + theOf(A) + " on " + theOf(B), out);
  }
  /* The ground round a solid where it stands, gone over again once it is
   * there: darker close in, where it shuts out the light from round about
   * (occlusion), and touched with its colour (diffusion). */
  function* groundSteps(S, P) {
    const g = P.ground, h = g.h, { cam } = S, m = P.middle || P.placed.middle, ring = P.foot.map(([x, z]) => [m[0] + (x - m[0]) * 1.8, h, m[2] + (z - m[2]) * 1.8]);
    const shot = hull2(ring.map((p) => project(cam, p))), crosses = h === 0 && ring.some((p) => p[2] > ROOM.wall);
    if (shot.length < 3 || Math.max(...shot.map((p) => p[1])) <= cam.cy) return;
    const base = h > 0 ? P.host.base : S.palette.floor, side = S.light.side, self = h > 0 ? P.host : null, middle = [m[0], m[2]];
    const groundAt = (x, y) => {
      const Z = planeDepth(cam, Math.max(y, cam.cy + 1), h), at = [(x - cam.cx) * Z / cam.f, h, Z], near = Math.min(ROOM.wall, Z);
      // (Shut in where it stands, opening out to the ground as it was by the ring's edge: no edge where it ends.)
      const foot = reachToward(P.foot, middle, [at[0], at[2]]), d = Math.hypot(at[0] - m[0], at[2] - m[2]), open = Number.isFinite(foot) ? clamp((d - foot) / (foot * 0.8), 0, 1) : 1;
      const c = mix(shade(S, base, [0, 1, 0], near, { at, self }), shade(S, base, [0, 1, 0], near), open * open * (3 - 2 * open));
      return h > 0 ? c : c.map((v) => v * (1 + 0.12 * side * (x / cam.W - 0.5) * 2));
    };
    yield* inSteps("the ground round " + theOf(P), rowsIn(S, shot, Math.max(4, cam.W * 0.016), groundAt, "soft", { meant: groundAt, ...(g.clip ? { clip: g.clip } : crosses ? { clip: floorOf(cam) } : {}) }, cam.W * 0.03));
  }
  /* What stands near a new solid takes some of its colour, and loses some
   * light to it: their faces turned to it gone over again, lightly, where
   * they are near it. */
  function* nearSteps(S, P) {
    const m = P.middle || P.placed.middle, out = [];
    for (const Q of alive(S)) {
      if (Q === P || Q.round || Q.kind === "sphere") continue;
      for (const f of Q.map.visible) {
        if (dot(f.normal, sub(m, f.centre)) <= 0 || Math.hypot(...sub(m, f.centre)) > 1.8) continue;
        const fill = f.idx.length > 4 ? fillPolygon(S, f, Q.base, Q) : fillPlane(S, f, Q.base, Q), fronts = outsFor(S, Q);
        for (const s of fill) out.push(Object.assign(s, { faint: true, app: Q.app, clipOut: fronts }));
      }
    }
    if (out.length) yield* inSteps("what stands near " + theOf(P) + " takes its colour", out);
  }

  /* ── A sphere: brush shapes stacked inside its volume ─────────────────
   * Rings from the rim (the farthest of it that can be seen) to the front,
   * each ring's strokes going round it from its darkest side, so the light
   * strokes go on over the dark; the highlight last - or, in a medium that
   * cannot go lighter, the ground kept bare for it from the start. */
  function* sphereSteps(S, E) {
    const { cam } = S, R = E.radius, C = E.middle, L = S.light.L;
    const [cx, cy] = project(cam, C), r = cam.f * R / C[2];
    const N = ROOM.rings, ring = r / N;
    const dark = Math.atan2(L[1], -L[0]);   // in the picture: away from the light
    const colourAt = (x, y) => {
      const nx = clamp((x - cx) / r, -1, 1), ny = clamp(-(y - cy) / r, -1, 1), nz = -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      return shade(S, E.base, [nx, ny, nz], C[2] + R * nz, { shine: 0.55, at: add(C, times([nx, ny, nz], R)), self: E });
    };
    const h = unit(add(L, [0, 0, -1])), hx = cx + h[0] * r * 0.92, hy = cy - h[1] * r * 0.92;
    const keep = S.rules.reserve ? [oval(hx, hy, ring * 0.6, ring * 0.45, 14)] : null;
    const extra = keep ? { meant: colourAt, clipOut: keep } : { meant: colourAt };
    yield* rings(S, E, cx, cy, r, dark, colourAt, extra, "");
    yield* glazes(S, E, E.outline, E.name, () => [...rings(S, E, cx, cy, r, dark, colourAt, extra, ", glazed again")].flatMap((step) => step.strokes));
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
    // (Kept bare, the ground is its highlight.)
    if (keep) return;
    const shine = mix(S.light.colour, E.base, 0.12);
    yield {
      label: "the highlight on " + theOf(E),
      strokes: [stroke(S, [off(S, [hx - ring * 0.35, hy], 1), [hx, hy - ring * 0.05], off(S, [hx + ring * 0.35, hy], 1)], ring * 0.8, mix(colourAt(hx, hy), shine, 0.55), "round"),
        stroke(S, [[hx - ring * 0.12, hy], [hx + ring * 0.12, hy]], ring * 0.45, shine, "round")],
    };
  }
  // A sphere's rings, rim to front, each from its darkest side round.
  function* rings(S, E, cx, cy, r, dark, colourAt, extra, again) {
    const N = ROOM.rings, ring = r / N;
    for (let k = 0; k < N; k++) {
      // On dry: each ring left to dry before the next goes over its edge.
      if (k && E.app?.wet === "on dry") S.paint.clock += S.M.wet;
      const outer = r - k * ring, mid = Math.max(ring * 0.35, outer - ring / 2), width = ring * (1.7 + 0.25 * k / N);
      const strokes = [];
      if (k === N - 1) {
        // The front: a few touches across the last of it.
        for (let j = 0; j < 4; j++) {
          const a = dark + j * Math.PI / 2 + S.rng() * 0.6, x = cx + Math.cos(a) * ring * 0.3, y = cy - Math.sin(a) * ring * 0.3;
          strokes.push(stroke(S, [off(S, [x - ring * 0.6, y], ring * 0.1), [x, y], off(S, [x + ring * 0.6, y], ring * 0.1)], width, colourAt(x, y), "filbert", extra));
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
          strokes.push(stroke(S, pts, width, colourAt(mx, my), k === 0 ? "soft" : "filbert", extra));
        }
      }
      yield { label: E.name + ", ring " + (k + 1) + " of " + N + again, strokes };
    }
  }

  /* ── A flat-sided solid, built by points ─────────────────────────────
   * First, where it meets what it is built on or against: those edges, so
   * it is drawn out of what already stands. Then the edge at the corner
   * farthest from the eye - an upright edge, square to the plane it stands
   * over, where the solid has one - laid as a thin line the planes will be
   * painted against. Then point by point: each new corner gives a line its
   * tilt (toward the vanishing point, from above or below as the premap
   * says), and when a plane's corners are all placed it is filled - in
   * strokes running the way its edges do, from its far end to its near
   * end - before the next plane is begun. The planes, three at most, go far
   * to near (lightest first where nothing lighter can go over them), each
   * sharing an edge with one already painted. */
  function* facetedSteps(S, E) {
    const { cam } = S, map = E.map, pts = map.pts, name = theOf(E);
    if (!map.visible.length || !map.edges.length) return;
    // In paint the drawing is a darker line the planes are laid against; under a transparent medium it shows to the end, so it is drawn light and thin.
    const light = S.rules.lines === "light";
    const lineColour = light ? paint(mix(S.bare, [70, 72, 84], 0.32)) : paint(mix(shade(S, E.base, [0, 0, -1], E.placed.middle[2]), [30, 30, 40], 0.45));
    const lineW = S.lineW * (light ? 0.6 : 1);
    const line = (a, b) => stroke(S, [off(S, pts[a], lineW * 0.6), off(S, pts[b], lineW * 0.6)], lineW, lineColour, "round", { line: true });
    // (A line run on from a corner the way its edge goes, a quarter as far again: it heads for the edge's vanishing point.)
    const runOn = (a, b) => {
      const v = E.placed.verts, end = project(cam, add(v[b], times(sub(v[b], v[a]), 0.25)));
      (E.guides ||= []).push([pts[b], end]);
      return stroke(S, [pts[b], end], lineW * 0.6, lineColour, "round", { line: true, faint: true });
    };
    const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
    const placed = new Set(), lines = new Set();
    let first = null;
    if (E.host) {
      /* Built on another: drawn out of the seed's lines, not found again
       * from the horizon - where it meets what it stands on or against, then
       * the right angle off it, the edges leaving where they meet square to
       * the face they leave, each run on toward the vanishing point it
       * shares with the seed. */
      const meets = contactEdges(E);
      for (const e of meets) { placed.add(e.a); placed.add(e.b); lines.add(key(e.a, e.b)); }
      if (meets.length) {
        yield { label: "where " + name + " meets " + theOf(E.host), strokes: meets.map((e) => line(e.a, e.b)) };
        // (Square to it: along the way it leaves what it meets - up off a top, out along the seed's edge off a side.)
        const v = E.placed.verts, away = E.away || [0, 1, 0];
        const square = map.edges.filter((e) => !lines.has(key(e.a, e.b)) && placed.has(e.a) !== placed.has(e.b) &&
          Math.abs(dot(unit(sub(v[e.b], v[e.a])), away)) > 0.98);
        const strokes = [];
        for (const e of square) {
          const [a, b] = placed.has(e.a) ? [e.a, e.b] : [e.b, e.a];
          lines.add(key(a, b));
          strokes.push(line(a, b), runOn(a, b));
        }
        for (const e of square) { placed.add(e.a); placed.add(e.b); }
        if (strokes.length) yield { label: "the right angle off " + theOf(E.host), strokes };
      }
    }
    if (!placed.size) {
      // Standing alone: the first line is the farthest edge that can be seen - upright where the solid has upright edges, square to the floor under the horizon.
      const outline = map.edges.filter((e) => e.outline);
      const pool = outline.some((e) => e.upright) ? outline.filter((e) => e.upright) : outline.length ? outline : map.edges;
      first = pool.reduce((best, e) => (e.depth > best.depth ? e : best), pool[0]);
      placed.add(first.a); placed.add(first.b);
      lines.add(key(first.a, first.b));
      yield { label: "the far corner of " + name, strokes: [line(first.a, first.b)] };
    }
    const lighter = (f) => lum(shade(S, E.base, f.normal, f.depth));
    const left = map.visible.slice(), done = [];
    while (left.length) {
      const touches = (f) => (done.length === 0 && first ? f.idx.includes(first.a) && f.idx.includes(first.b) : f.idx.some((i) => placed.has(i)));
      const ready = left.filter(touches), choice = ready.length ? ready : left;
      const face = S.rules.darkenOnly ? choice.reduce((best, f) => (lighter(f) > lighter(best) ? f : best)) : choice.reduce((best, f) => (f.depth > best.depth ? f : best));
      left.splice(left.indexOf(face), 1);
      // Its corners, point by point from one already placed: each a line with its tilt.
      const n = face.idx.length;
      let k0 = face.idx.findIndex((i) => placed.has(i));
      if (k0 < 0) k0 = 0;
      const build = [];
      for (let s = 0; s < n; s++) {
        const a = face.idx[(k0 + s) % n], b = face.idx[(k0 + s + 1) % n];
        placed.add(a); placed.add(b);
        if (lines.has(key(a, b))) continue;
        lines.add(key(a, b));
        build.push(line(a, b));
      }
      // On dry: the planes already laid left to dry first, so this one's edge against them stays crisp.
      if (done.length && E.app?.wet === "on dry") S.paint.clock += S.M.wet;
      const plane = (face.level ? (face.horizon === "above" ? "underside" : "top") : face.name.startsWith("face") || face.name.startsWith("side") ? "face" : face.name + " face") +
        (face.seed === "level" ? ", the seed's top carried on" : face.seed === "below" ? ", under the seed's top" : face.seed === "above" ? ", over the seed's top" : "");
      if (build.length) yield { label: "the corners of " + name + "'s " + plane, strokes: build };
      const fill = () => (face.idx.length > 4 ? fillPolygon(S, face, E.base, E) : fillPlane(S, face, E.base, E));
      yield* inSteps(name + "'s " + plane, fill());
      yield* glazes(S, E, face.screen, name + "'s " + plane, fill);
      done.push(face);
    }
    if (E.form?.soft) yield* softEdges(S, E);
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  /* Softened corners (Mutation): where two of its planes meet, the edge is
   * rounded off - a soft stroke along it in the light of a surface turned
   * halfway between the two, so an edge turned to the light catches it (a
   * peak) and one turned away falls between them. */
  function* softEdges(S, E) {
    const { cam } = S, v = E.placed.verts, out = [], soft = E.form.soft, clip = clipOf(E.outline, 0.5);
    for (const e of E.map.edges) {
      if (e.faces.length !== 2) continue;
      const n = unit(add(e.faces[0].normal, e.faces[1].normal)), mid = times(add(v[e.a], v[e.b]), 0.5);
      const width = Math.max(3, cam.f * E.size * soft / Math.max(1, mid[2]));
      const at = (x, y) => shade(S, E.base, n, mid[2], { at: mid, self: E, shine: 0.25 });
      out.push(stroke(S, [E.map.pts[e.a], E.map.pts[e.b]], width, at(), "soft", { meant: at, clip, edge: true }));
    }
    yield* inSteps("softening the corners of " + theOf(E), out);
  }
  /* A plane of many corners (a cylinder's top) filled in rows level across
   * the picture, far to near, each in the plane's light where it lies. */
  function fillPolygon(S, face, base, E) {
    const { cam } = S, w = face.world, n = face.normal, c = face.centre;
    const u = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : unit(cross([0, 1, 0], n)), v = unit(cross(n, u));
    const flat = w.map((p) => [dot(sub(p, c), u), dot(sub(p, c), v)]), vs = flat.map((q) => q[1]);
    const v0 = Math.min(...vs), v1 = Math.max(...vs), back = (a, b) => add(c, add(times(u, a), times(v, b)));
    const deep = Math.hypot(...sub(project(cam, back(0, v0)), project(cam, back(0, v1)))), brush = Math.max(5, Math.min(cam.W, cam.H) * 0.034);
    const rows = Math.max(2, Math.round(deep / (brush * 0.8))), band = (v1 - v0) / rows, clip = clipOf(face.screen);
    const o = [0, cam.eye, 0];
    const meantAt = (x, y) => {
      const d = [(x - cam.cx) / cam.f, -(y - cam.cy) / cam.f, 1], den = dot(n, d), t = Math.abs(den) < 1e-6 ? c[2] : dot(n, sub(c, o)) / den;
      return shade(S, base, n, t > 0 ? t : c[2], { at: t > 0 ? add(o, times(d, t)) : c, self: E });
    };
    const out = [];
    for (let r = 0; r < rows; r++) {
      const vv = v0 + (r + 0.5) * band;
      let a = Infinity, b = -Infinity;
      for (let i = 0; i < flat.length; i++) {
        const [pu, pv] = flat[i], [qu, qv] = flat[(i + 1) % flat.length];
        if ((pv - vv) * (qv - vv) > 0 || pv === qv) continue;
        const uu = pu + (qu - pu) * (vv - pv) / (qv - pv);
        a = Math.min(a, uu); b = Math.max(b, uu);
      }
      if (!(b > a)) continue;
      const pa = back(a - band * 0.2, vv), pb = back(b + band * 0.2, vv), m = back((a + b) / 2, vv);
      const width = Math.hypot(...sub(project(cam, back(0, vv - band * 0.75)), project(cam, back(0, vv + band * 0.75))));
      out.push({ z: m[2], s: stroke(S, [project(cam, pa), project(cam, m), project(cam, pb)], Math.max(3, width), meantAt(...project(cam, m)), "flat", { alpha: 0.97, clip, meant: meantAt }) });
    }
    return out.sort((p, q) => q.z - p.z).map((x) => x.s);
  }
  /* A cylinder, built like the sphere from what is farthest of it in to
   * what faces the eye: its side in upright strokes from where it turns
   * away, on either hand, in to the front, each in the light it turns to;
   * then its top, if the eye is over it, as a plane. */
  function* cylinderSteps(S, E) {
    const { cam } = S, [mx, , mz] = E.placed.middle, r = E.radius, lo = E.low, hi = E.high, eye = [0, cam.eye, 0], N = 44, clip = clipOf(E.outline, 0.6);
    const sides = () => {
      const side = [];
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N * 2 * Math.PI, n = [Math.cos(t), 0, Math.sin(t)], p = [mx + r * n[0], (lo + hi) / 2, mz + r * n[2]];
        if (dot(n, sub(eye, p)) <= 0) continue;
        const a = project(cam, [p[0], lo, p[2]]), b = project(cam, [p[0], hi, p[2]]), q = [mx + r * Math.cos(t + 2 * Math.PI / N), lo, mz + r * Math.sin(t + 2 * Math.PI / N)];
        const width = Math.hypot(...sub(project(cam, q), a)) * 1.7 + 2;
        const meant = () => shade(S, E.base, n, p[2], { at: p, self: E, shine: 0.3 });
        side.push({ far: Math.hypot(...sub(p, eye)), s: stroke(S, [a, off(S, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 1), b], width, meant(), "flat", { meant, clip }) });
      }
      return side.sort((p, q) => q.far - p.far).map((x) => x.s);
    };
    yield* inSteps(theOf(E) + "'s side", sides());
    yield* glazes(S, E, E.outline, E.name + "'s side", sides);
    const top = E.map.faces.find((f) => f.name === "top" && f.visible);
    if (top) yield* inSteps(theOf(E) + "'s top", fillPolygon(S, top, E.base, E));
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  /* A cone: in strokes up its slope from the rim toward the point, far to
   * near round it, each in the light its slope turns to; the point last. */
  function* coneSteps(S, E) {
    const { cam } = S, [mx, , mz] = E.placed.middle, r = E.radius, lo = E.low, hi = E.high, eye = [0, cam.eye, 0], N = 40, clip = clipOf(E.outline, 0.6);
    const h = hi - lo, apex = [mx, hi, mz];
    const slopes = () => {
      const side = [];
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N * 2 * Math.PI, n = unit([Math.cos(t) * h, r, Math.sin(t) * h]), base = [mx + r * Math.cos(t), lo, mz + r * Math.sin(t)];
        const p = mix(base, apex, 0.35);
        if (dot(n, sub(eye, p)) <= 0) continue;
        const a = project(cam, base), b = project(cam, mix(base, apex, 0.88)), q = [mx + r * Math.cos(t + 2 * Math.PI / N), lo, mz + r * Math.sin(t + 2 * Math.PI / N)];
        const width = Math.hypot(...sub(project(cam, q), a)) * 1.8 + 2;
        const meant = () => shade(S, E.base, n, p[2], { at: p, self: E, shine: 0.3 });
        side.push({ far: Math.hypot(...sub(p, eye)), s: stroke(S, [a, project(cam, mix(base, apex, 0.45)), b], width, meant(), "round", { meant, clip }) });
      }
      return side.sort((p, q) => q.far - p.far).map((x) => x.s);
    };
    yield* inSteps(theOf(E) + "'s slope", slopes());
    yield* glazes(S, E, E.outline, E.name + "'s slope", slopes);
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  function contactEdges(E) {
    const H = E.host, v = E.placed.verts;
    const against = (p) => (H.kind === "sphere" ? Math.hypot(...sub(p, H.middle)) - H.radius < 0.03 : H.map.faces.every((f) => dot(f.normal, sub(p, f.centre)) < 0.03));
    return E.map.edges.filter((e) => against(v[e.a]) && against(v[e.b]));
  }
  /* A plane filled: strokes the way it runs (upright on an upright plane,
   * across on a level one, along its lowest edge on a slanted one), laid
   * from its far end to its near end, each in the plane's own light at the
   * depth it lies. */
  function fillPlane(S, face, base, E = null) {
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
    // What the plane is meant to look like anywhere on it: its light at the depth the eye's ray meets it.
    const o = [0, cam.eye, 0], c0 = face.centre;
    const depthAt = (x, y) => {
      const d = [(x - cam.cx) / cam.f, -(y - cam.cy) / cam.f, 1], den = dot(n, d);
      const t = Math.abs(den) < 1e-6 ? c0[2] : dot(n, sub(c0, o)) / den;
      return t > 0 ? t : c0[2];
    };
    const pointAt = (x, y) => { const d = [(x - cam.cx) / cam.f, -(y - cam.cy) / cam.f, 1], z = depthAt(x, y); return add(o, times(d, z)); };
    const meant = (x, y) => shade(S, base, n, depthAt(x, y), { at: pointAt(x, y), self: E });
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
        const colour = shade(S, base, n, m[2], { at: m, self: E }).map((c) => c + (S.rng() - 0.5) * 4);
        out.push(stroke(S, [a, off(S, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], width * 0.04), b], width, colour, "flat", { alpha: 0.97, clip, meant }));
      }
    }
    return out;
  }
  /* Blended: a clean brush - or the stump - drawn back through what was
   * just laid, across a sphere's rings or along a plane's rows, so its
   * marks run into each other. */
  function* softenSteps(S, E) {
    const out = [];
    if (E.kind === "sphere") {
      const [cx, cy] = project(S.cam, E.middle), r = S.cam.f * E.radius / E.middle[2], ring = r / ROOM.rings;
      for (let k = 1; k < ROOM.rings - 1; k++) {
        const rr = r - k * ring, count = Math.max(6, Math.round(2 * Math.PI * rr / (ring * 2.6)));
        for (let j = 0; j < count; j++) {
          const a = (j + S.rng() * 0.6) / count * 2 * Math.PI, b = a + 0.12 * (S.rng() - 0.5);
          out.push(stroke(S, [[cx + Math.cos(a) * (rr + ring * 0.7), cy - Math.sin(a) * (rr + ring * 0.7)], [cx + Math.cos(b) * (rr - ring * 0.7), cy - Math.sin(b) * (rr - ring * 0.7)]],
            ring * 1.4, [0, 0, 0], "soft", { soften: true }));
        }
      }
    } else if (!E.round) {
      for (const face of E.map.visible) {
        const fill = face.idx.length > 4 ? fillPolygon(S, face, E.base, E) : fillPlane(S, face, E.base, E);
        fill.forEach((s, i) => { if (i % 2 === 0) out.push(Object.assign(s, { soften: true, width: s.width * 0.8, tip: "soft", meant: null })); });
      }
    }
    yield* inSteps("blending " + theOf(E), out);
  }
  // Paint taken back off a region, in rows across it.
  function* liftSteps(S, region, label) {
    const b = boxOf(region), band = Math.max(8, S.paint.n * 1.7), out = [];
    for (let y = b.y0 + band * 0.4; y < b.y1 + band * 0.4; y += band * 0.75) {
      out.push(stroke(S, [[b.x0 - band * 0.5, y], [(b.x0 + b.x1) / 2, y + (S.rng() - 0.5) * band * 0.2], [b.x1 + band * 0.5, y]], band * 1.3, S.bare, "soft", { lift: 1 }));
    }
    yield* inSteps(label, out);
  }

  /* ── The structure ────────────────────────────────────────────────────
   * A solid in it: where it stands (on the floor, or on another's top),
   * its corners and planes in the picture (premap), its footprint on the
   * level it stands on, its outline in the picture and what it covers
   * there, and the ground it throws its shadow on. */
  function makePiece(S, kind, size, foot, yaw = 0, host = null, how = null, form = {}) {
    const { cam } = S, P = { id: S.nextId++, kind, form, name: nameFor(kind, form), size, yaw, host, how, alive: true, shot: {} };
    if (kind === "sphere") {
      P.radius = size; P.middle = [foot[0], foot[1] + size, foot[2]];
      P.low = foot[1]; P.high = foot[1] + 2 * size; P.top = null; P.planes = 0;
      P.foot = oval(foot[0], foot[2], size, size, 16);
      const [cx, cy] = project(cam, P.middle), r = cam.f * size / P.middle[2];
      P.outline = oval(cx, cy, r, r, 28);
    } else {
      const shape = shapeOf(kind, size, form);
      P.placed = place(shape, yaw, [foot[0], foot[1] - shape.low, foot[2]]);
      // (A cylinder or a cone: its frame of many sides is for where it stands, what it hides and the shadow it throws; it is painted round.)
      P.round = ROUND.has(kind);
      if (P.round) P.radius = size / 2 * ((form.stretch || [1])[0]);
      P.map = premap(cam, P.placed);
      P.low = foot[1]; P.high = foot[1] + shape.high - shape.low;
      P.foot = hull2(P.placed.verts.map((v) => [v[0], v[2]]));
      P.outline = hull2(P.map.pts);
      P.top = P.map.faces.find((f) => f.level && f.normal[1] > 0.99 && Math.abs(f.centre[1] - P.high) < 1e-6) || null;
      P.planes = P.map.planes;
      /* Against the seed, as the seed's planes were against the horizon:
       * each level plane of a solid built on is under the seed's top (seen
       * more open than it), level with it (the seed's top carried on, seen
       * just as it is) or over it (seen less, and not at all once it is
       * over the eye - its lines still run to the horizon). */
      if (S.seed && host) for (const f of P.map.faces) if (f.level) f.seed = Math.abs(f.centre[1] - S.seed.high) < 0.02 ? "level" : f.centre[1] < S.seed.high ? "below" : "above";
    }
    P.box = boxOf([P.outline]);
    // What it covers in the picture, its drawing with it.
    P.cover = clipOf(P.outline, S.lineW * 0.7 + 1.2);
    P.coverBox = boxOf([P.cover]);
    // (Set on another, it stands on that one's top; set beside one, on the floor.)
    P.ground = host && how === "on" ? { h: host.high, get base() { return host.base; }, clip: host.top?.visible ? clipOf(host.top.screen, 0.5) : null } : S.floor;
    return P;
  }
  const alive = (S) => S.pieces.filter((P) => P.alive);
  // Whether two convex footprints pass into each other (more than touching), by their separating axes.
  function overlaps(A, B) {
    for (const poly of [A, B]) {
      for (let i = 0; i < poly.length; i++) {
        const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length], l = Math.hypot(x1 - x0, z1 - z0) || 1, nx = (z1 - z0) / l, nz = (x0 - x1) / l;
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const [x, z] of A) { const p = x * nx + z * nz; if (p < a0) a0 = p; if (p > a1) a1 = p; }
        for (const [x, z] of B) { const p = x * nx + z * nz; if (p < b0) b0 = p; if (p > b1) b1 = p; }
        if (a1 <= b0 + BUILD.touch || b1 <= a0 + BUILD.touch) return false;
      }
    }
    return true;
  }
  const collide = (P, Q) => Math.min(P.high, Q.high) - Math.max(P.low, Q.low) > 0.01 && overlaps(P.foot, Q.foot);
  // How far along the eye's ray through a point of the picture a solid is first met (Infinity: it is missed).
  function rayHit(S, P, x, y) {
    const { cam } = S, o = [0, cam.eye, 0], d = unit([(x - cam.cx) / cam.f, -(y - cam.cy) / cam.f, 1]);
    if (P.kind === "sphere") {
      const oc = sub(P.middle, o), b = dot(d, oc), q = b * b - (dot(oc, oc) - P.radius * P.radius);
      return q < 0 || b - Math.sqrt(q) <= 0 ? Infinity : b - Math.sqrt(q);
    }
    let enter = 0, leave = Infinity;
    for (const f of P.map.faces) {
      const den = dot(f.normal, d), num = dot(f.normal, sub(f.centre, o));
      if (Math.abs(den) < 1e-9) { if (num < 0) return Infinity; continue; }
      if (den < 0) enter = Math.max(enter, num / den); else leave = Math.min(leave, num / den);
    }
    return enter <= leave ? enter : Infinity;
  }
  /* Whether solid A stands in front of solid B somewhere in the picture:
   * looked at along the eye's rays where their outlines overlap - or, where
   * only their drawn edges meet, whichever comes nearer the eye. */
  function inFront(S, A, B) {
    const key = A.id + ">" + B.id;
    if (S.front.has(key)) return S.front.get(key);
    let a = 0, b = 0;
    if (boxesMeet(A.coverBox, B.coverBox)) {
      const x0 = Math.max(A.box.x0, B.box.x0), x1 = Math.min(A.box.x1, B.box.x1), y0 = Math.max(A.box.y0, B.box.y0), y1 = Math.min(A.box.y1, B.box.y1);
      for (let i = 0; i < 8 && x1 > x0 && y1 > y0; i++) {
        for (let j = 0; j < 8; j++) {
          const x = x0 + (x1 - x0) * (i + 0.5) / 8, y = y0 + (y1 - y0) * (j + 0.5) / 8;
          if (!inPoly(A.outline, x, y) || !inPoly(B.outline, x, y)) continue;
          const ta = rayHit(S, A, x, y), tb = rayHit(S, B, x, y);
          if (ta < Infinity && tb < Infinity) { if (ta < tb) a++; else b++; }
        }
      }
      if (!a && !b) {
        const nearest = (P) => (P.kind === "sphere" ? P.middle[2] - P.radius : Math.min(...P.placed.verts.map((v) => v[2])));
        if (nearest(A) < nearest(B)) a = 1; else b = 1;
      }
    }
    S.front.set(key, a > b);
    S.front.set(B.id + ">" + A.id, b > a);
    return a > b;
  }
  // What stands in front of a solid: what it covers, kept out of its strokes.
  const outsFor = (S, P) => alive(S).filter((Q) => Q !== P && inFront(S, Q, P)).map((Q) => Q.cover);
  // How much of a solid's outline lies inside what some other solids cover.
  function hiddenBy(P, fronts) {
    if (!fronts.length) return 0;
    let n = 0, hid = 0;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const x = P.box.x0 + (P.box.x1 - P.box.x0) * (i + 0.5) / 6, y = P.box.y0 + (P.box.y1 - P.box.y0) * (j + 0.5) / 6;
        if (!inPoly(P.outline, x, y)) continue;
        n++;
        if (fronts.some((c) => inPoly(c, x, y))) hid++;
      }
    }
    return n ? hid / n : 0;
  }
  // Whether a new solid can go where it was put: in the room and the picture, clear of the others, mostly seen, hiding none of them whole.
  function fits(S, P) {
    const { cam } = S, m = BUILD.margin, b = P.box;
    const zs = P.kind === "sphere" ? [P.middle[2] - P.radius, P.middle[2] + P.radius] : P.placed.verts.map((v) => v[2]);
    if (Math.min(...zs) < BUILD.near || Math.max(...zs) > ROOM.wall - BUILD.back) return false;
    if (b.x0 < cam.W * m || b.x1 > cam.W * (1 - m) || b.y0 < cam.H * m || b.y1 > cam.H * ROOM.foot || b.x1 - b.x0 < cam.W * 0.04) return false;
    if (P.map && !P.round && P.map.planes > 3) return false;
    const standing = alive(S);
    if (standing.some((Q) => collide(P, Q))) return false;
    const near = standing.filter((Q) => boxesMeet(P.coverBox, Q.coverBox));
    if (hiddenBy(P, near.filter((Q) => inFront(S, Q, P)).map((Q) => Q.cover)) > BUILD.hidden) return false;
    if (near.some((Q) => inFront(S, P, Q) && hiddenBy(Q, [P.cover]) > BUILD.covers)) return false;
    // (Where nothing can cover, not over what is darker than it can be made to look: that would show through it.)
    return !S.rules.darkenOnly || darkUnder(S, P) <= BUILD.dark;
  }
  // How much of where a solid would go is darker than its own lightest, past what lifting gives back.
  function darkUnder(S, P) {
    sync(S);
    const L = P.kind === "sphere" ? shade(S, P.base, S.light.L, P.middle[2]) : P.map.visible.map((f) => shade(S, P.base, f.normal, f.depth)).reduce((a, b) => (lum(a) > lum(b) ? a : b));
    const light = lum(S.rules.value ? valueOf(L) : L), give = S.M.lift * (lum(S.bare) - light);
    const cells = cellsOf(S.paint, { points: [[P.box.x0, (P.box.y0 + P.box.y1) / 2], [P.box.x1, (P.box.y0 + P.box.y1) / 2]], width: P.box.y1 - P.box.y0, clip: P.outline });
    let dark = 0;
    for (const k of cells) if (0.299 * S.paint.colour[k * 3] + 0.587 * S.paint.colour[k * 3 + 1] + 0.114 * S.paint.colour[k * 3 + 2] < light - 30 - Math.max(0, give)) dark++;
    return cells.length ? dark / cells.length : 0;
  }
  /* Square to the seed. The first solid's planes are found from the
   * horizon; every solid built on after it is turned square to that one -
   * a bottom edge of it along one of the seed's own edges, at a right angle
   * or in line - so its lines run to the seed's vanishing points, not to
   * ones of its own. (A sphere begun with has no edges: the first solid
   * with edges is the seed's square then.) */
  function edgeTurn(kind, form = {}) {
    const shape = shapeOf(kind, 1, form);
    const bottom = shape.faces.map((f) => ({ f, y: f.idx.reduce((t, i) => t + shape.verts[i][1], 0) / f.idx.length })).reduce((a, b) => (b.y < a.y ? b : a)).f;
    const a = shape.verts[bottom.idx[0]], b = shape.verts[bottom.idx[1]];
    return Math.atan2(b[2] - a[2], b[0] - a[0]);
  }
  const squareYaw = (S, kind, form) => (S.square === null ? S.rng() * Math.PI * 2 : S.square + edgeTurn(kind, form) + Math.floor(S.rng() * 4) * Math.PI / 2);
  // The seed's square, from the first solid with edges.
  function squareTo(S, P) {
    if (S.square === null && !P.round && P.kind !== "sphere") S.square = P.yaw - edgeTurn(P.kind, P.form);
  }
  // A solid set on another's top: smaller than it, square to the seed, standing wholly on it.
  function placeOn(S, host, kind, want = {}) {
    const top = host.top.world.map((v) => [v[0], v[2]]);
    const mx = top.reduce((t, q) => t + q[0], 0) / top.length, mz = top.reduce((t, q) => t + q[1], 0) / top.length;
    let inner = Infinity;
    for (let i = 0; i < top.length; i++) {
      const [x0, z0] = top[i], [x1, z1] = top[(i + 1) % top.length], l = Math.hypot(x1 - x0, z1 - z0) || 1;
      inner = Math.min(inner, Math.abs((x1 - x0) * (z0 - mz) - (z1 - z0) * (x0 - mx)) / l);
    }
    const k = 0.5 + S.rng() * 0.4, form = want.form || {}, spread = Math.max(...(form.stretch || [1, 1, 1]).filter((v, i) => i !== 1));
    const size = want.size || (kind === "sphere" ? inner * (0.5 + S.rng() * 0.4)
      : inner * 2 * k / (kind === "cube" ? Math.SQRT2 : ROUND.has(kind) ? 1 : 1.16) / spread);
    const yaw = squareYaw(S, kind, form), a = S.rng() * Math.PI * 2, d = S.rng() * inner * 0.3;
    const P = makePiece(S, kind, size, [mx + Math.cos(a) * d, host.high, mz + Math.sin(a) * d], yaw, host, "on", form);
    P.away = [0, 1, 0];
    const stands = kind === "sphere" ? inPoly(top, P.middle[0], P.middle[2]) : P.foot.every(([x, z]) => inPoly(top, x, z));
    return stands ? P : null;
  }
  /* A solid set against another's side on the floor: square to the seed,
   * moved in along one of the seed's own edges - slid a little along the
   * side it meets - until the two touch. */
  function placeBeside(S, host, kind, want = {}) {
    const form = want.form || {};
    const size = want.size || (kind === "sphere" ? 0.3 + S.rng() * 0.25 : kind === "cube" ? [1, 0.8, 0.6][Math.floor(S.rng() * 3)] : kind === "tetrahedron" ? 0.9 + S.rng() * 0.4
      : kind === "pyramid" ? 0.8 + S.rng() * 0.3 : kind === "cylinder" ? 0.6 + S.rng() * 0.3 : kind === "cone" ? 0.7 + S.rng() * 0.3 : 0.75 + S.rng() * 0.3);
    const at = host.kind === "sphere" ? host.middle : host.placed.middle, yaw = squareYaw(S, kind, form);
    const t = S.square === null ? S.rng() * Math.PI * 2 : -S.square + (want.axis ?? Math.floor(S.rng() * 4)) * Math.PI / 2;
    const way = [Math.cos(t), Math.sin(t)], across = [-way[1], way[0]];
    const shape = kind === "sphere" ? null : shapeOf(kind, size, form), c = Math.cos(yaw), sn = Math.sin(yaw);
    const local = shape ? hull2(shape.verts.map(([x, , z]) => [x * c + z * sn, -x * sn + z * c])) : oval(0, 0, size, size, 16);
    const reach = Math.max(...host.foot.map(([x, z]) => Math.hypot(x - at[0], z - at[2])));
    const slide = S.rng() < 0.5 ? 0 : (S.rng() - 0.5) * reach * 0.7;
    const footAt = (dd) => local.map(([x, z]) => [x + at[0] + way[0] * dd + across[0] * slide, z + at[2] + way[1] * dd + across[1] * slide]);
    // (From where they overlap out to where they are clear: the touch is between.)
    let lo = 0, hi = 4;
    if (!overlaps(footAt(lo), host.foot) || overlaps(footAt(hi), host.foot)) return null;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (overlaps(footAt(mid), host.foot)) lo = mid; else hi = mid; }
    const d = hi + BUILD.touch;
    const P = makePiece(S, kind, size, [at[0] + way[0] * d + across[0] * slide, 0, at[2] + way[1] * d + across[1] * slide], yaw, host,
      way[1] < -0.7 ? "in front of" : way[1] > 0.7 ? "behind" : "beside", form);
    P.away = [way[0], 0, way[1]];
    return P;
  }
  function pickKind(S) {
    let r = S.rng();
    for (const [kind, p] of Object.entries(BUILD.kinds)) if ((r -= p) < 0) return kind;
    return "cube";
  }
  // Somewhere for another solid, connected to one already standing: a few tried, the first that fits.
  function findPlace(S, how = null, kind = null) {
    const standing = alive(S);
    for (let t = 0; t < BUILD.tries && standing.length; t++) {
      const host = standing[Math.floor(S.rng() * standing.length)];
      const mode = how || (host.top && S.rng() < 0.45 ? "on" : "beside");
      if (mode === "on" ? !host.top : host.low > 0.01) continue;
      const k = kind || pickKind(S);
      const P = mode === "on" ? placeOn(S, host, k) : placeBeside(S, host, k);
      if (!P) continue;
      P.base = pieceColour(S);
      if (fits(S, P)) return P;
    }
    return null;
  }
  // A new solid's colour: one of the few the structure keeps coming back to, or now and then a new one.
  function pieceColour(S, not = null) {
    const known = S.colours.filter((c) => !not || apart(c, not) > 30);
    if (known.length >= 2 && S.rng() < 0.7) return known[Math.floor(S.rng() * known.length)].slice();
    return hsl((S.palette.hue + S.colours.length * 137.5 + (S.rng() - 0.5) * 40) % 360, 0.35 + S.rng() * 0.4, 0.46 + S.rng() * 0.18);
  }
  // How the paint is handled for a form: each freedom the medium leaves, chosen (by the ledger, where there is one).
  function chooseApp(S, P) {
    const form = P.kind === "room" ? "broad" : P.kind === "sphere" ? "round" : "flat", app = { form };
    for (const [key, options] of Object.entries(freedomsOf(S.M))) app[key] = S.choose("application · " + S.medium, key + " · " + form, options);
    return app;
  }
  // What the structure is, in words.
  function nameOf(S) {
    const standing = alive(S);
    if (standing.length === 2 && standing[1].host === standing[0] && standing[1].how === "on") return standing[1].name + " on " + standing[0].name;
    const count = new Map();
    for (const P of standing) count.set(P.name, (count.get(P.name) || 0) + 1);
    const numbers = ["", "a", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const parts = [...count].map(([name, n]) => (n === 1 ? name : (numbers[n] || n) + " " + plural(name)));
    return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0] || "an empty room";
  }
  // Lifted (twice, if once is not enough) where a solid is meant lighter than what is there now: what cannot cover has to take back off first.
  function* liftFor(S, P, front, label) {
    if (!S.rules.darkenOnly) return;
    for (let pass = 0; pass < 2; pass++) {
      yield look(label);
      if (!needsLift(S, P)) return;
      // (A curved solid has no drawn edge to cover the rim of a lift: it is lifted just where it will be painted.)
      const where = P.round ? clipOf(P.outline, 0.6) : P.cover;
      yield* laid(S, liftSteps(S, [where], label + (pass ? ", again" : "")), { within: [where], box: P.coverBox, out: front });
    }
  }
  // Whether a solid is meant lighter than what is now where it will go (a transparent medium has to lift that first).
  function needsLift(S, P) {
    sync(S);
    const lightest = P.kind === "sphere" ? shade(S, P.base, S.light.L, P.middle[2]) : P.map.visible.map((f) => shade(S, P.base, f.normal, f.depth)).reduce((a, b) => (lum(a) > lum(b) ? a : b));
    const cells = cellsOf(S.paint, { points: [[P.box.x0, (P.box.y0 + P.box.y1) / 2], [P.box.x1, (P.box.y0 + P.box.y1) / 2]], width: P.box.y1 - P.box.y0, clip: P.outline });
    if (!cells.length) return false;
    const under = cells.reduce((t, k) => t + lum([S.paint.colour[k * 3], S.paint.colour[k * 3 + 1], S.paint.colour[k * 3 + 2]]), 0) / cells.length;
    return under < lum(S.rules.value ? valueOf(lightest) : lightest) - 12;
  }
  const pieceSteps = (S, P) => (P.kind === "sphere" ? sphereSteps(S, P) : P.kind === "cylinder" ? cylinderSteps(S, P) : P.kind === "cone" ? coneSteps(S, P) : facetedSteps(S, P));

  /* ── Changes ──────────────────────────────────────────────────────────
   * Each step's strokes laid by the medium, in order: inside the part
   * being worked again (`within`, its box `box`), never over what stands
   * in front (`out`), with the handling chosen for the form (`app`). */
  function* laid(S, steps, ctx = {}) {
    for (const step of steps) {
      if (step.look) { yield step; continue; }
      sync(S);
      const out = [];
      for (const s of step.strokes) {
        if (ctx.within) {
          // (Only the parts of the place being worked again that it reaches: fewer to draw it through, and none at all for one that reaches none.)
          if (!strokeMeets(s, ctx.box)) continue;
          const boxes = (ctx.boxes ||= ctx.within.map((w) => boxOf([w]))), reach = ctx.within.filter((w, i) => strokeMeets(s, boxes[i]));
          if (!reach.length) continue;
          s.within = reach.length === ctx.within.length ? ctx.within : reach;
        }
        if (ctx.out?.length) s.clipOut = s.clipOut ? s.clipOut.concat(ctx.out) : ctx.out;
        if (ctx.app && !s.app) s.app = ctx.app;
        if (lay(S, s)) out.push(s);
      }
      if (out.length) yield { label: (ctx.prefix || "") + step.label, strokes: out };
    }
  }
  /* After a change the painter looks at the canvas (the step before has
   * landed by the time this runs), measures how far it is from what was
   * meant, corrects the worst of it, looks again, and says how it went for
   * the form and the handling it was painted with. */
  function* lookAgain(S, since, what, piece) {
    yield look("looking at " + what);
    sync(S);
    const before = measure(S, since);
    let after = before;
    const fixes = before.rate > 0.004 ? corrections(S, since).filter((s) => lay(S, s)) : [];
    if (fixes.length) {
      S.notes.corrected += fixes.length;
      yield { label: "looking again at " + what + " · " + fixes.length + (fixes.length === 1 ? " correction" : " corrections"), strokes: fixes };
      yield look("looking again at " + what);
      sync(S);
      after = measure(S, since);
    }
    S.error = { rate: after.rate, mean: after.mean, before: before.rate, what };
    // (A breath once the change is done, for it to be seen.)
    yield { label: what, strokes: [], look: true, rest: ROOM.rest };
    if (piece) piece.rate = after.rate;
    if (piece?.app && S.report) S.report({ medium: S.medium, app: piece.app, rate: after.rate, mean: after.mean, before: before.rate });
  }
  // Adding a solid: its shadows, then it - built out of what it meets, kept out from behind what stands in front of it - then a look.
  function* addPiece(S, P) {
    const name = theOf(P), since = S.paint.clock;
    S.action = P.host ? "adding " + P.name + " " + P.how + " " + theOf(P.host) : "setting up " + P.name;
    P.base ||= pieceColour(S);
    if (!S.colours.some((c) => apart(c, P.base) < 4)) S.colours.push(P.base.slice());
    S.pieces.push(P);
    squareTo(S, P);
    P.app = chooseApp(S, P);
    S.lastApp = P.app;
    S.notes.added++;
    const others = alive(S).filter((Q) => Q !== P), front = outsFor(S, P);
    // A medium that cannot go lighter: where the new solid is meant lighter than what is there now, that is lifted first.
    yield* liftFor(S, P, front, "lifting the ground for " + name);
    // (Where nothing can cover, its shadows are painted round it, not under it: it could never hide them.)
    const own = S.rules.darkenOnly ? [P.outline] : [];
    yield* laid(S, groundSteps(S, P), { out: (P.how === "on" ? outsFor(S, P.host).filter((c) => c !== P.cover) : others.map((Q) => Q.cover)).concat(own) });
    yield* laid(S, shadowSteps(S, P, S.floor, "the shadow of " + name), { out: others.map((Q) => Q.cover).concat(own) });
    if (P.how === "on" && P.ground.clip) yield* laid(S, shadowSteps(S, P, P.ground, "its shadow on " + theOf(P.host)), { out: outsFor(S, P.host).filter((c) => c !== P.cover).concat(own) });
    // Its shadow on the solids it reaches - the floor's shadow climbing their sides - then it, then theirs on it.
    for (const Q of others) yield* laid(S, castSteps(S, P, Q), { out: outsFor(S, Q).filter((c) => c !== P.cover).concat(own) });
    yield* laid(S, pieceSteps(S, P), { out: front, app: P.app });
    for (const Q of others) yield* laid(S, castSteps(S, Q, P), { out: front });
    // What stands near takes some of its colour, and loses some light to it.
    yield* laid(S, nearSteps(S, P));
    S.name = nameOf(S);
    yield* lookAgain(S, since, name, P);
  }
  /* Taking a solid away: lifted off (in a medium that cannot cover it) and
   * what it hid painted back far to near inside where it was - the room,
   * the shadows, the solids behind. A transparent medium never quite gives
   * it back. */
  function* removePiece(S, P) {
    const name = theOf(P), since = S.paint.clock;
    S.action = "taking away " + name;
    P.alive = false;
    S.notes.removed++;
    const w = S.lineW * 1.2, guides = (P.guides || []).map(([[x0, y0], [x1, y1]]) => {
      const l = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l * w, ny = (x1 - x0) / l * w, ex = (x1 - x0) / l * w, ey = (y1 - y0) / l * w;
      return [[x0 + nx - ex, y0 + ny - ey], [x1 + nx + ex, y1 + ny + ey], [x1 - nx + ex, y1 - ny + ey], [x0 - nx - ex, y0 - ny - ey]];
    });
    const cast = P.shot.on ? [...P.shot.on.values()].flat() : [];
    const region = [clipOf(P.outline, S.lineW * 1.8 + 2), ...(P.shot.floor ? [clipOf(P.shot.floor, 3)] : []), ...(P.shot.top ? [clipOf(P.shot.top, 3)] : []), ...guides, ...cast];
    const box = boxOf(region), standing = alive(S), covers = standing.map((Q) => Q.cover), prefix = "where " + name + " was: ";
    S.name = nameOf(S);
    if (S.rules.darkenOnly) yield* laid(S, liftSteps(S, region, "lifting " + name + " off"), { within: region, box, out: covers });
    yield* laid(S, room(S), { within: region, box, out: covers, prefix });
    for (const Q of standing) {
      if (Q.shot.floor && boxesMeet(boxOf([Q.shot.floor]), box)) yield* laid(S, shadowSteps(S, Q, S.floor, "the shadow of " + theOf(Q)), { within: region, box, out: covers.filter((c) => c !== Q.cover), prefix });
    }
    // The solids it hid, each after what it stands on, each with its shadow on that first.
    for (const Q of standing) {
      if (Q.how === "on" && Q.ground.clip && Q.shot.top && boxesMeet(boxOf([Q.shot.top]), box)) {
        yield* laid(S, shadowSteps(S, Q, Q.ground, "the shadow of " + theOf(Q) + " on " + theOf(Q.host)), { within: region, box, out: outsFor(S, Q.host).filter((c) => c !== Q.cover), prefix });
      }
      if (boxesMeet(Q.coverBox, box)) {
        yield* laid(S, pieceSteps(S, Q), { within: region, box, out: outsFor(S, Q), app: Q.app, prefix });
        // (And the shadows the others still throw on it.)
        for (const C of standing) if (C !== Q) yield* laid(S, castSteps(S, C, Q), { within: region, box, out: outsFor(S, Q), prefix });
      }
    }
    yield* lookAgain(S, since, "where " + name + " was", null);
  }
  // Reworking a solid: painted again over itself - in a new colour, or the same with the handling chosen afresh - and what stands on it throws its shadow on it again.
  function* reworkPiece(S, P, recolour = false) {
    // (A medium that cannot cover restates a solid in its own colour, deeper; it cannot put another over it.)
    const name = theOf(P), since = S.paint.clock;
    recolour = recolour && !S.rules.darkenOnly;
    S.action = (recolour ? "repainting " : "restating ") + name;
    S.notes.reworked++;
    if (recolour) {
      P.base = pieceColour(S, P.base);
      if (!S.colours.some((c) => apart(c, P.base) < 4)) S.colours.push(P.base.slice());
    }
    P.app = chooseApp(S, P);
    S.lastApp = P.app;
    const front = outsFor(S, P);
    yield* liftFor(S, P, front, "lifting " + name);
    yield* laid(S, pieceSteps(S, P), { out: front, app: P.app });
    for (const Q of alive(S)) {
      if (Q.host === P && Q.how === "on" && Q.ground.clip) yield* laid(S, shadowSteps(S, Q, Q.ground, "the shadow of " + theOf(Q) + " on it"), { out: outsFor(S, P).filter((c) => c !== Q.cover) });
      if (Q !== P) yield* laid(S, castSteps(S, Q, P), { out: front });
    }
    yield* lookAgain(S, since, name, P);
  }
  /* ── Learning ─────────────────────────────────────────────────────────
   * It learns what to build. Every change it makes is described by what it
   * was - adding a sphere on a cube, rising over the seed, smaller than what
   * it joins, stretched tall, on the left, into a crowd; taking away the
   * oldest; restating a cube; a form it learned - and the picture is judged
   * as a whole before and after it, by its taste as learned from your votes
   * (`judge`). What the change did - better or worse to look at, something
   * new or an arrangement made before, near what was meant or not - is kept
   * against each of those features, across paintings (memory). Each next
   * change is chosen from several it could make by what their features
   * have done, with room for what it has not tried; the same arrangement
   * made again counts against itself. Two changes that did well together,
   * one built on the other, are kept as a form and built again - varied -
   * as one move, so what it builds with grows. Its rules come one at a time
   * (RULES), each only once the rules it stands on have gone well: joining
   * before stacking, stretching before turning or softening, forms before
   * varying them - never a rule before what it needs. What it has learned
   * sets how much it takes on: it starts with a few solids, and builds
   * bigger as it does well. KEEP and REJECT, and a vote on its last move,
   * count most.
   *   taste    a change's worth for each unit of taste it adds to the picture
   *   fresh    what an arrangement never made before is worth; `stale`, what each time it was made before costs
   *   error    what being off what was meant costs, per share of the canvas off
   *   rate     the least what it has learned moves by, each time
   *   explore  what the untried is worth for not being known yet
   *   warmth   how loosely it picks among its options (0: always the best)
   *   start    solids it takes on at first; `per`, net good changes for each one more; `grow`, changes in a painting for each one more; `most`, the most ever
   *   form     what two changes together must have done for a form to be kept
   *   forms    forms kept at most; `seen`, arrangements remembered
   *   master   uses of a rule before what stands on it can open; `pass`, how well they must have gone
   *   vote     what a vote is worth; `recent`, changes back a vote reaches */
  const LEARN = { key: "hexfield.study.memory.v1", taste: 12, fresh: 0.12, stale: 0.04, error: 0.5, rate: 0.1, explore: 0.25, warmth: 0.12,
    start: 3, per: 4, grow: 8, most: 14, form: 0.06, forms: 24, seen: 300, master: 3, pass: -0.02, vote: 0.8, recent: 6 };
  const RULES = [
    { id: "join", name: "joining solids", needs: [] },
    { id: "stack", name: "stacking them", needs: ["join"] },
    { id: "stretch", name: "stretching squares into rectangles", needs: ["join"] },
    { id: "turn", name: "turning a sphere into a cylinder, triangles into pyramids and cones", needs: ["stretch", "stack"] },
    { id: "soften", name: "softening corners", needs: ["stretch"] },
    { id: "forms", name: "building the forms it learned", needs: ["join", "stack"] },
    { id: "vary", name: "varying its forms", needs: ["forms", "stretch"] },
    { id: "clear", name: "making solids that can be seen through", needs: ["soften", "turn"] },
  ];
  let MEMORY = null;
  function memory() {
    if (MEMORY) return MEMORY;
    let m = null;
    try { m = JSON.parse(global.localStorage?.getItem(LEARN.key) || "null"); } catch { m = null; }
    if (!m || typeof m !== "object" || !m.values || !Array.isArray(m.forms) || !m.seen) m = { values: {}, forms: [], seen: {}, skill: 0, moves: 0 };
    return (MEMORY = m);
  }
  function remember() {
    try { global.localStorage?.setItem(LEARN.key, JSON.stringify(memory())); } catch { /* none here, or full */ }
  }
  // What a change did, kept against one thing about it: a running mean that never stops moving.
  function teach(f, r) {
    const v = memory().values, cell = v[f] || (v[f] = [0, 0]);
    cell[0]++;
    cell[1] = +(cell[1] + (r - cell[1]) * Math.max(LEARN.rate, 1 / cell[0])).toFixed(4);
  }
  // What a change is expected to do: what its features have done, the untried worth something for being untried.
  function worth(feats) {
    const M = memory(), spread = Math.log(1 + M.moves);
    let sum = 0;
    for (const f of feats) { const [n, mean] = M.values[f] || [0, 0]; sum += mean + LEARN.explore * Math.sqrt(spread / (1 + n)); }
    return feats.length ? sum / feats.length : 0;
  }
  // How well it knows a change: the fewest times any of its features was tried, and what they did on the whole.
  function known(feats) {
    const M = memory();
    let n = Infinity, sum = 0;
    for (const f of feats) { const c = M.values[f] || [0, 0]; n = Math.min(n, c[0]); sum += c[1]; }
    return { n: Number.isFinite(n) ? n : 0, mean: feats.length ? sum / feats.length : 0 };
  }
  // One of the options by what each is worth - loosely, so the less tried still come up.
  function pick(rng, options) {
    const scores = options.map((o) => worth(o.feats) + (o.prior || 0)), top = Math.max(...scores);
    const weights = scores.map((v) => Math.exp((v - top) / LEARN.warmth)), total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < options.length; i++) if ((r -= weights[i]) <= 0) return options[i];
    return options[options.length - 1];
  }
  const ruleRow = (id) => memory().values["rule: " + id] || [0, 0];
  const mastered = (id) => { const [n, mean] = ruleRow(id); return n >= LEARN.master && mean >= LEARN.pass; };
  const opened = (id) => RULES.find((r) => r.id === id).needs.every(mastered);
  // How many solids it takes on: more as it has done well - and, in each painting, more the longer it goes on.
  const most = (S = null) => clamp(LEARN.start + Math.floor(memory().skill / LEARN.per) + (S ? Math.floor((S.moves || 0) / LEARN.grow) : 0), LEARN.start, LEARN.most);
  /* A solid to add, as far as its rules have opened (Mutation): a platonic
   * solid; or turned - a sphere into a cylinder, triangles into a pyramid of
   * more sides or a cone; stretched taller, flatter or longer; its corners
   * softened; seen through. */
  function mutated(S, kind) {
    const form = {}, rules = [], was = kind;
    if (opened("turn") && S.rng() < 0.4) {
      if (kind === "sphere") kind = "cylinder";
      else if (kind === "tetrahedron" || kind === "octahedron") kind = S.rng() < 0.5 ? "cone" : "pyramid";
      else if (kind === "cube" && S.rng() < 0.3) kind = "cylinder";
      if (kind !== was) rules.push("turn");
    }
    if (kind === "pyramid") form.sides = 4 + Math.floor(S.rng() * 3);
    if (opened("stretch") && kind !== "sphere" && S.rng() < 0.5) {
      const st = [1, 1, 1], r = S.rng();
      if (r < 0.4 || ROUND.has(kind)) st[1] = r < 0.7 ? 1.3 + S.rng() * 0.6 : 0.45 + S.rng() * 0.3;
      else if (r < 0.65) st[1] = 0.45 + S.rng() * 0.3;
      else st[S.rng() < 0.5 ? 0 : 2] = 1.3 + S.rng() * 0.6;
      form.stretch = st.map((v) => +v.toFixed(2));
      rules.push("stretch");
    }
    if (opened("soften") && !ROUND.has(kind) && S.rng() < 0.35) { form.soft = +(0.1 + S.rng() * 0.18).toFixed(2); rules.push("soften"); }
    if (opened("clear") && S.rng() < 0.2) { form.opacity = +(0.5 + S.rng() * 0.35).toFixed(2); rules.push("clear"); }
    return { kind, form, rules };
  }
  const stretchWord = (st) => (st[1] > 1.25 ? "stretched tall" : st[1] < 0.8 ? "flattened" : Math.max(st[0], st[2]) > 1.25 ? "stretched long" : "kept square");
  // What a solid added is, as features to learn by.
  function addFeatures(S, P, rules) {
    const n = alive(S).length, x = (P.box.x0 + P.box.x1) / 2 / S.cam.W;
    const f = ["adding " + P.name, x < 0.36 ? "on the left" : x > 0.64 ? "on the right" : "in the middle", n <= 2 ? "into an empty room" : n <= 5 ? "among a few" : "into a crowd"];
    if (P.host) {
      f.push(P.name + " " + P.how + " " + P.host.name, P.how === "on" ? "set on top of another" : "set " + P.how + " another");
      const h = (P.high - P.low) / Math.max(1e-3, P.host.high - P.host.low);
      f.push(h < 0.75 ? "smaller than what it joins" : h > 1.3 ? "bigger than what it joins" : "as big as what it joins");
      f.push(apart(P.base, P.host.base) < 25 ? "in the colour of what it joins" : "in another colour");
    }
    if (S.seed && P !== S.seed) f.push(P.high > S.seed.high + 0.02 ? "rising over the seed" : P.high < S.seed.high - 0.02 ? "lower than the seed" : "as high as the seed");
    if (P.form.stretch) f.push(stretchWord(P.form.stretch));
    if (P.form.soft) f.push("softened corners");
    if ((P.form.opacity ?? 1) < 0.95) f.push("seen through");
    for (const r of rules) f.push("rule: " + r);
    return f;
  }
  const labelOf = (P) => (P.host ? P.name + " " + P.how + " " + theOf(P.host) : P.name);
  // Places another solid could go - each connected to one standing, each as its rules let it be (a beat after each one that fits, and every few tried).
  function* candidates(S, count, out) {
    const standing = alive(S);
    for (let t = 0; t < BUILD.tries && out.length < count && standing.length; t++) {
      if (t && t % 6 === 0) yield BEAT;
      const host = standing[Math.floor(S.rng() * standing.length)], on = opened("stack") && host.top && S.rng() < 0.45;
      if (!on && host.low > 0.01) continue;
      const m = mutated(S, pickKind(S));
      const P = on ? placeOn(S, host, m.kind, { form: m.form }) : placeBeside(S, host, m.kind, { form: m.form });
      if (!P) continue;
      P.base = pieceColour(S);
      if (fits(S, P)) { out.push({ piece: P, rules: [on ? "stack" : "join", ...m.rules] }); yield BEAT; }
    }
  }
  // A step with nothing laid in it: where whoever lays the steps may stop a while (thinking takes time too).
  const BEAT = Object.freeze({ label: "thinking", strokes: Object.freeze([]), beat: true });
  // What can be taken away: nothing standing on it, never the seed - the one that came out worst, the oldest, any.
  function removables(S) {
    const standing = alive(S), free = standing.filter((P) => P !== S.seed && !standing.some((Q) => Q.host === P));
    if (!free.length) return [];
    const worst = free.reduce((a, b) => ((b.reward ?? 0) < (a.reward ?? 0) ? b : a)), oldest = free.reduce((a, b) => (b.id < a.id ? b : a));
    const any = free[Math.floor(S.rng() * free.length)], out = [[worst, "what came out worst"]];
    if (oldest !== worst) out.push([oldest, "the oldest"]);
    if (any !== worst && any !== oldest) out.push([any, "one at random"]);
    return out;
  }
  // The structure as an arrangement: what stands on or against what, wherever it is.
  const arrangement = (S) => alive(S).map((P) => P.name + (P.host ? (P.how === "on" ? " on " : " by ") + P.host.name : "")).sort().join(", ");
  /* The next change, chosen from those it could make by what it has
   * learned of each: adding (as its rules let it), building a form it
   * learned, taking something away (likelier the fuller it is, and seldom
   * in a medium that cannot take paint back off), or reworking. */
  function* nextAction(S) {
    const standing = alive(S), n = standing.length, cap = most(S), forced = S.queue.shift();
    if (forced) {
      const P = findPlace(S, forced.how, forced.kind);
      if (P) { yield* move(S, { type: "add", piece: P, feats: addFeatures(S, P, [forced.how === "on" ? "stack" : "join"]), label: labelOf(P) }); return; }
    }
    const options = [];
    if (n < LEARN.most) {
      // (Past what it takes on, adding is still open - crowded, worth less the further past.)
      const over = n < cap ? 0.04 : -0.12 * (n - cap + 1);
      const found = [];
      yield* candidates(S, n < cap ? 5 : 2, found);
      for (const c of found) options.push({ type: "add", piece: c.piece, feats: addFeatures(S, c.piece, c.rules), label: labelOf(c.piece), prior: over });
      if (opened("forms") && n < cap) {
        const forms = memory().forms.filter((f) => f.mean > -0.05 && !S.unbuilt.has(f.sig)).sort((a, b) => b.mean - a.mean).slice(0, 3);
        for (const form of forms) options.push({ type: "form", form, feats: ["building a form it learned", "the form " + form.name, "rule: forms"], label: form.name, prior: 0.03 });
      }
    }
    const restraint = S.rules.darkenOnly ? Math.log(Math.max(0.05, S.M.lift)) * 0.25 : 0, crowd = n >= cap ? 0.2 : -0.5 + 0.45 * n / cap;
    for (const [P, why] of removables(S)) options.push({ type: "remove", piece: P, feats: ["taking away " + P.name, "taking away " + why], label: "taking away " + theOf(P), prior: crowd + restraint });
    if (n) {
      const P = standing[Math.floor(S.rng() * n)], recolour = !S.rules.darkenOnly && S.rng() < 0.5;
      options.push({ type: "rework", piece: P, recolour, feats: [(recolour ? "repainting " : "restating ") + P.name], label: (recolour ? "repainting " : "restating ") + theOf(P), prior: n >= cap ? 0.05 : -0.15 });
    }
    if (options.length) yield* move(S, pick(S.rng, options));
  }
  // A change made, and learned from.
  function* move(S, m) {
    // (A form with nowhere to go now is passed over for the rest of the painting: not judged, not learned from.)
    if (m.type === "form" && !(m.plan = planForm(S, m))) { S.unbuilt.add(m.form.sig); return; }
    const before = judged(S), k = known(m.feats);
    S.why = m.type === "form" ? "a form it learned" + (m.form.n ? " (" + (m.form.mean >= 0 ? "+" : "") + m.form.mean.toFixed(2) + ", built " + m.form.n + "×)" : "")
      : k.n ? (k.mean >= 0 ? "it has done well " : "it has gone badly ") + "(" + (k.mean >= 0 ? "+" : "") + k.mean.toFixed(2) + ", " + k.n + "×)" : "something it has not tried";
    if (m.type === "add") yield* addPiece(S, m.piece);
    else if (m.type === "form") yield* buildForm(S, m);
    else if (m.type === "remove") yield* removePiece(S, m.piece);
    else yield* reworkPiece(S, m.piece, m.recolour);
    learnFrom(S, m, before);
  }
  // The picture judged as it is - once for each state of it: the judging after one change is the judging before the next.
  function judged(S) {
    if (!S.judge) return null;
    if (S.judgedAt?.clock !== S.paint.clock) S.judgedAt = { clock: S.paint.clock, value: S.judge() };
    return S.judgedAt.value;
  }
  // After a change: the picture judged again, and what the change did kept against what it was.
  function learnFrom(S, m, before) {
    const M = memory(), after = judged(S);
    const taste = Number.isFinite(before) && Number.isFinite(after) ? +clamp((after - before) * LEARN.taste, -1, 1).toFixed(4) : 0;
    const shape = arrangement(S), times = M.seen[shape] || 0, fresh = times ? -LEARN.stale * Math.min(times, 5) : LEARN.fresh;
    delete M.seen[shape];
    M.seen[shape] = times + 1;
    const keys = Object.keys(M.seen);
    for (const k of keys.slice(0, Math.max(0, keys.length - LEARN.seen))) delete M.seen[k];
    const reward = +(taste + fresh - LEARN.error * (S.error?.rate || 0)).toFixed(4);
    for (const f of m.feats) teach(f, reward);
    teach("beginning with " + (S.kind === "stack" ? "a stack" : NAMES[S.kind]), reward * 0.3);
    if (m.form) teachForm(m.form, reward);
    // (The solids a form put up are learned about too, at half the weight.)
    for (const P of m.pieces || []) for (const f of addFeatures(S, P, [])) teach(f, reward * 0.5);
    M.moves++;
    M.skill = Math.max(0, +(M.skill + (reward > 0.02 ? 1 : reward < -0.02 ? -0.5 : 0)).toFixed(2));
    Object.assign(m, { reward, taste, fresh });
    if (m.type === "add") m.piece.reward = reward;
    S.history.push(m);
    if (S.history.length > 12) S.history.shift();
    S.lastMove = m;
    S.moves = (S.moves || 0) + 1;
    keepForm(S, m);
    remember();
  }
  function teachForm(form, r) {
    form.n++;
    form.mean = +(form.mean + (r - form.mean) * Math.max(LEARN.rate, 1 / form.n)).toFixed(4);
  }
  /* Two changes that did well together, one built on the other, kept as a
   * form: the solid built on and the one built on it, as they stood - what
   * each is, how it joins, how big against what it joins, which way. */
  function keepForm(S, m) {
    if (m.type !== "add" || !m.piece?.host?.host) return;
    const P = m.piece, H = P.host, prior = S.history.find((h) => h.type === "add" && h.piece === H);
    if (!prior || (prior.taste + m.taste) / 2 + (prior.fresh + m.fresh) / 4 < LEARN.form) return;
    rememberForm(S, [H, P], (prior.reward + m.reward) / 2);
  }
  function axisOf(S, P) {
    if (S.square === null || !P.away || P.how === "on") return null;
    return ((Math.round((Math.atan2(P.away[2], P.away[0]) + S.square) / (Math.PI / 2)) % 4) + 4) % 4;
  }
  const formName = (steps) => steps.map((st, i) => (i ? (st.how === "on" ? " carrying " : " with ") : "") + nameFor(st.kind, st.form) + (i && st.how !== "on" ? " beside it" : "")).join("");
  function rememberForm(S, chain, value) {
    const M = memory(), steps = chain.map((P, i) => ({ kind: P.kind, form: P.form, how: P.how === "on" ? "on" : "beside",
      scale: +((P.high - P.low) / Math.max(1e-3, P.host.high - P.host.low)).toFixed(3), axis: axisOf(S, P), parent: i }));
    const sig = steps.map((st) => [st.kind, JSON.stringify(st.form), st.how, st.parent, st.axis ?? "-"].join("/")).join("|");
    let form = M.forms.find((f) => f.sig === sig);
    if (!form) {
      form = { sig, name: formName(steps), steps, n: 0, mean: 0, at: Date.now() };
      M.forms.push(form);
      if (M.forms.length > LEARN.forms) M.forms.splice(M.forms.indexOf(M.forms.reduce((a, b) => (b.mean < a.mean ? b : a))), 1);
      S.newForm = form;
    }
    teachForm(form, value);
    return form;
  }
  /* A form it learned, built again from something standing - varied, once
   * it may vary them (another solid in one place, another way, another
   * size), so what it knows keeps turning into something new. */
  // Where a form's first solid would go (varied first, if its rules let it): or nowhere, now.
  function planForm(S, m) {
    const steps = m.form.steps.map((st) => ({ ...st, form: { ...st.form } }));
    if (opened("vary") && S.rng() < 0.5) {
      const st = steps[Math.floor(S.rng() * steps.length)], r = S.rng();
      if (r < 0.4) { const v = mutated(S, SOLIDS[Math.floor(S.rng() * SOLIDS.length)]); st.kind = v.kind; st.form = v.form; }
      else if (r < 0.7 && st.axis !== null) st.axis = (st.axis + 1 + Math.floor(S.rng() * 3)) % 4;
      else st.scale *= 0.75 + S.rng() * 0.5;
      m.feats.push("varying a form", "rule: vary");
    }
    const first = steps[0], anchors = alive(S).filter((Q) => (first.how === "on" ? Q.top : Q.low < 0.01));
    let P = null;
    for (let t = 0; t < 8 && anchors.length && !P; t++) P = placeStep(S, anchors[Math.floor(S.rng() * anchors.length)], first);
    return P ? { steps, first: P } : null;
  }
  function* buildForm(S, m) {
    const { steps, first: P } = m.plan, made = [P];
    yield* addPiece(S, P);
    for (let i = 1; i < steps.length; i++) {
      const Q = placeStep(S, made[steps[i].parent - 1] || made[made.length - 1], steps[i]);
      if (!Q) break;
      made.push(Q);
      yield* addPiece(S, Q);
    }
    m.pieces = made;
    return made.length;
  }
  function placeStep(S, host, step) {
    if (step.how === "on" ? !host.top : host.low > 0.01) return null;
    const unitHigh = step.kind === "sphere" ? 2 : (() => { const sh = shapeOf(step.kind, 1, step.form); return sh.high - sh.low; })();
    const size = clamp(step.scale * (host.high - host.low) / unitHigh, 0.15, 2.5);
    const P = step.how === "on" ? placeOn(S, host, step.kind, { size, form: step.form }) : placeBeside(S, host, step.kind, { size, axis: step.axis ?? undefined, form: step.form });
    if (!P) return null;
    P.base = pieceColour(S);
    return fits(S, P) ? P : null;
  }
  /* A vote. On the painting (KEEP, REJECT): the changes just made take it,
   * the latest most; a painting kept keeps its forms. On its last move:
   * that one alone. */
  function credit(S, vote, last = false) {
    if (!S?.history?.length) return;
    const moves = last ? S.history.slice(-1) : S.history.slice(-LEARN.recent).reverse();
    moves.forEach((m, i) => {
      const r = vote * LEARN.vote * Math.pow(0.75, i);
      for (const f of m.feats) teach(f, r);
      if (m.form) teachForm(m.form, r);
    });
    if (!last && vote > 0) for (const P of alive(S)) if (P.host?.host) rememberForm(S, [P.host, P], vote * 0.5);
    remember();
  }
  // What it has learned, to be shown: what has done best and worst, its rules, its forms, how much it takes on.
  function learned() {
    const M = memory(), rows = Object.entries(M.values).filter(([f, [n]]) => n >= 2 && !f.startsWith("rule: ") && !f.startsWith("beginning"));
    const up = rows.filter(([, [, v]]) => v > 0.03).sort((a, b) => b[1][1] - a[1][1]).slice(0, 3).map(([f]) => f);
    const down = rows.filter(([, [, v]]) => v < -0.03).sort((a, b) => a[1][1] - b[1][1]).slice(0, 2).map(([f]) => f);
    const rules = RULES.map((r) => ({ id: r.id, name: r.name, state: mastered(r.id) ? "learned" : opened(r.id) ? "learning" : "waiting", uses: ruleRow(r.id)[0] }));
    return { up, down, rules, forms: M.forms.filter((f) => f.mean > 0).map((f) => f.name), most: most(), moves: M.moves, skill: M.skill };
  }
  // What to begin a painting with: what has done well, the untried worth something for being untried.
  const seedKind = (rng = Math.random) => pick(rng, KINDS.map((k) => ({ k, feats: ["beginning with " + (k === "stack" ? "a stack" : NAMES[k])] }))).k;
  // The first solid: on the floor near the middle, far enough back that its foot is well inside the canvas.
  function firstPiece(S, kind, wants) {
    const { cam } = S, short = Math.min(cam.W, cam.H);
    const footRoom = cam.f * cam.eye / Math.max(1, cam.H * (ROOM.foot - 0.06 - 0.5));
    const size = kind === "sphere" ? 0.6 : SIZES[kind], shape = kind === "sphere" ? null : shapeOf(kind, size);
    const Z = Math.max(cam.f * (shape ? shape.high - shape.low : 2 * size) / (short * ROOM.size), footRoom, BUILD.near + 0.8);
    const x = (S.rng() - 0.5) * 0.2 * cam.W * Z / cam.f;
    if (!shape) return makePiece(S, "sphere", size, [x, 0, Z]);
    const want = clamp(Number(wants.planes) || [3, 2, 3][Math.floor(S.rng() * 3)], 1, 3);
    const t = turnFor(cam, shape, [want === 1 ? 0 : x, -shape.low, Z], want, S.rng);
    return makePiece(S, kind, size, [want === 1 ? 0 : x, 0, Z], t.yaw);
  }

  /* ── A study ─────────────────────────────────────────────────────────
   * Its first solid, its light and colours, its medium (and the ground the
   * medium is laid on), and the steps that paint it - the room, the first
   * solid, and then change after change, for as long as it is left to go
   * on. `wants`: medium, planes (the first solid's), top (what a "stack"
   * puts on its cube first), choose (freedom, key, options) and report
   * (how a change came out) for whoever keeps a ledger. */
  function make(W, H, seed, kind = null, wants = {}) {
    const rng = seeded(seed ^ 0x57d1e5);
    kind = KINDS.includes(kind) ? kind : KINDS[Math.floor(rng() * KINDS.length)];
    const medium = MEDIA[wants.medium] ? wants.medium : MEDIUMS[Math.floor(rng() * MEDIUMS.length)];
    const cam = camera(W, H), light = lighting(rng), colours = palette(rng);
    const S = { kind, cam, light, palette: colours, rng, medium, M: MEDIA[medium], rules: rulesOf(MEDIA[medium]), level: "below",
      pieces: [], front: new Map(), nextId: 1, square: null, colours: [colours.solid, colours.solid2], queue: [], error: null, action: "", label: "",
      notes: { kept: 0, lifted: 0, corrected: 0, added: 0, removed: 0, reworked: 0 },
      choose: wants.choose || ((freedom, key, options) => options[Math.floor(rng() * options.length)]), report: wants.report || null,
      judge: wants.judge || null, history: [], moves: 0, unbuilt: new Set() };
    Object.defineProperty(S, "entries", { get: () => alive(S) });
    S.air = mix(shade({ light, palette: colours, air: colours.wall }, colours.wall, [0, 0, -1], 0), light.colour, 0.25);
    const l2 = Math.hypot(light.L[0], light.L[1]) || 1;
    S.lightX = +(light.L[0] / l2).toFixed(3);
    S.lightY = +(-light.L[1] / l2).toFixed(3);
    S.lineW = Math.max(1.6, Math.min(W, H) * 0.006);
    S.floor = { h: 0, base: colours.floor, clip: null };
    S.app = chooseApp(S, { kind: "room" });
    // The ground the medium is laid on, and what taking paint off goes back to.
    if (medium === "watercolour") S.ground = PAPER;
    else if (medium === "charcoal") S.ground = S.choose("application · charcoal", "ground", ["toned", "white"]) === "toned" ? valueOf(mix(colours.wall, colours.floor, 0.5)).map((v) => v * 0.8) : DRAWING_PAPER;
    else if (medium === "gouache") S.ground = mix(colours.wall, [236, 232, 224], 0.55);
    else S.ground = colours.wall.map((v) => v * 0.8);
    S.ground = paint(S.ground);
    S.bare = medium === "charcoal" ? DRAWING_PAPER : S.ground;
    S.paint = paintState(W, H, S.ground, S.M.grain);
    const first = firstPiece(S, kind === "stack" ? "cube" : kind, wants);
    // The seed: what every solid after it is squared to and seen against.
    S.seed = first;
    if (kind === "stack") S.queue.push({ how: "on", kind: SOLIDS.includes(wants.top) ? wants.top : null });
    S.name = first.name;
    S.planes = first.planes;
    S.steps = (function* () {
      S.action = "the room";
      // (Painted round the first solid where nothing lighter can go over the room afterwards and nothing lifts well.)
      yield* laid(S, room(S), { out: S.rules.reserve ? [first.outline] : null, app: S.app });
      yield* lookAgain(S, 0, "the room", { app: S.app });
      yield* addPiece(S, first);
      for (let idle = 0; ;) {
        const at = S.paint.clock;
        yield* nextAction(S);
        S.name = nameOf(S);
        if (S.paint.clock !== at) idle = 0;
        else if (++idle > 2) { idle = 0; yield look("looking"); }
      }
    })();
    return S;
  }

  global.HexfieldStudy = { KINDS, SOLIDS, NAMES, ROOM, BUILD, MEDIA, MEDIUMS, LOOK, LEARN, RULES, make, premap, camera, project, cubeSolid, tetraSolid, octaSolid, pyramidSolid, prismSolid, place,
    rulesOf, freedomsOf, credit, learned, seedKind, memory };
})(typeof globalThis !== "undefined" ? globalThis : this);
