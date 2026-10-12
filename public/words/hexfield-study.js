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
 * sphere in bands round the point of it nearest the light, as lines of
 * latitude go round a pole - each band's curve held as it is seen, so the
 * nearer the rim the harder it bends - and the highlight last; a shadow
 * that falls across a round solid laid along those same curves; a
 * flat-sided solid by points. The seed
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
 *
 * Depth. Far off, a colour gives way: its chroma first, then its value
 * toward the picture's tonal centre, under the air's own hue - near is rich
 * and sharp, far is quiet. A solid far back has its outline lost (a soft
 * brush drawn along it) and fewer, broader marks within it.
 *
 * Perspective. The eye may stand level and see a solid square on (one
 * vanishing point) or turned (two), look down from higher up or up from near
 * the floor (the uprights run to a third), or see everything flat, on one
 * plane: each solid its outline in as few straight lines as say it, one
 * colour, no light across it, and nothing to say what is behind what but
 * what overlaps what. Now and then it sees the same structure again from
 * another place, on a fresh sheet.
 *
 * Type. Words - asked for, or of its own - are lettered in the room: each
 * letter's strokes built as solids (bars, upright cylinders, slab feet,
 * balls), in a face chosen by what those solids have done.
 *
 * Plants. No picture of a plant: what kind of plant it is says how it grows
 * - from its line of kinds, each saying why it is as it is - and how it
 * grows gives its shape: its stems rising toward the light, its leaves set
 * round them so none shades the next, its flowers where whatever carries
 * its pollen will see them. Grown, it is painted like the solids.
 *
 * Asking. Whoever watches can ask, with a tap, for a plant, a word,
 * another view or a turn (suggestions, ask): it is made next, and counts
 * as liked.
 *
 * Colour. A painting's colours are a key: one dominant hue in its tints,
 * tones and shades, a support set by a harmony (next to it, opposite,
 * either side of opposite, a third of the way round, or none), now and
 * then one accent on something small, the room in greyed hues of the same
 * key - with how strong the colour is and where the values sit.
 *
 * Composition. Where the structure stands in the picture and which way it
 * grows - on a golden point or a third, a centred pyramid, a steelyard, a
 * diagonal into depth, a frieze - is a style of its own, chosen and learned.
 *
 * Turning. A solid is turned about its own upright with all that is built
 * off it going round with it, each keeping its place on what it was built
 * off. Every side of a solid is decided when it is made - its carvings, a
 * dome's openings - so a turn shows what was always there.
 *
 * Carving. A flat face may be set in, raised, studded, grooved or hollowed,
 * each plane of the carving in the light it turns to - an indent turned from
 * the eye dark, a raised part lighter - or, as one plane that says two
 * sides, a flat shape split light and dark.
 *
 * Form. A shape made by the rules of form - one side convex, the other
 * concave, unlike across and mirrored up and down - painted out of the
 * room: a loose patch of its colour, the room cut back round it so its
 * outline is the background's edge, then turned into a form.
 *
 * Letters are built as the solids are: each its outline a solid, mapped and
 * built point by point, plane by plane.
 *
 * Munker-White. A look taken now and then: stripes over the picture, one
 * colour over the room and one over each solid, so colours are seen as
 * they are not.
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

  const KINDS = ["sphere", "cube", "tetrahedron", "octahedron", "dome", "blob", "stack"];
  const SOLIDS = ["sphere", "cube", "tetrahedron", "octahedron"];
  const NAMES = { sphere: "a sphere", cube: "a cube", tetrahedron: "a tetrahedron", octahedron: "an octahedron", dome: "a dome", blob: "a form" };
  const theOf = (P) => P.name.replace(/^an? /, "the ");

  /* The room and the eye. World units (a cube's edge is one): the eye is
   * `eye` above the floor, looking level along +z, so the horizon is the
   * middle of the canvas and the vanishing point its centre; the wall is
   * `wall` away; `lens` is the focal length against the canvas's short side.
   *   size     the first solid's height against the canvas's short side
   *   foot     how far down the canvas the foot of a solid may come
   *   batch    strokes to a step at most
   *   turns    turns tried for the first solid to show the planes wanted
   *   rest     ms the painting is left to be seen after each change */
  const ROOM = { eye: 2, wall: 10, lens: 1.15, size: 0.24, foot: 0.93, batch: 90, turns: 120, rest: 1600 };
  /* The structure (how much of it there is, and how it changes, is learned: Learning).
   *   tries    places tried for a new solid
   *   near     the nearest a solid may stand to the eye; `back`, its room before the wall
   *   margin   the canvas's edge kept clear
   *   hidden   how much of a new solid may stand hidden behind others; `covers`, how much of one it may hide
   *   dark     how much of where a solid goes may be too dark to paint it over, in a medium that cannot cover
   *   touch    how near two solids may come (they touch, never pass into each other)
   *   kinds    how often each solid is the next */
  const BUILD = { tries: 40, near: 2.8, back: 0.6, margin: 0.03, hidden: 0.55, covers: 0.8, dark: 0.04, touch: 0.006,
    kinds: { cube: 0.38, sphere: 0.17, tetrahedron: 0.17, octahedron: 0.13, dome: 0.08, blob: 0.07 } };

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
  /* Far off (Depth): what the distance does, from where the nearest solid may
   * stand (`near`) to the wall, along a curve (`curve`, under 1: it starts
   * early).
   *   chroma  how much of a colour's chroma is gone at the wall
   *   value   how far its value has gone toward the picture's tonal centre
   *   air     how far it has gone into the colour of the air
   *   edge    how soft a far solid's outline is (and from how far: `from`)
   *   detail  how much of its marking a far solid loses (fewer, broader marks) */
  const DEPTH = { near: 2.6, curve: 0.8, chroma: 0.8, value: 0.5, air: 0.2, edge: 1, from: 0.18, detail: 0.6 };

  /* ── The eye (Perspective) ────────────────────────────────────────────
   * Where the eye stands - `eye` above the floor - and which way it looks.
   * Level, its horizon runs through the middle of the picture and every
   * upright stays upright: one vanishing point for what is square on to it,
   * two for what is turned. Pitched - looking down from higher up, or up
   * from near the floor - the uprights run to a third. A flat eye sees the
   * same things on one plane: no vanishing point, each thing its own size
   * wherever it stands, the floor a line, and nothing to say what is behind
   * what but what overlaps what.
   *   eye     how high it stands; `pitch`, how far it looks down (up, under 0)
   *   square  the seed's turn against the picture, where the view fixes it (square on)
   *   flat    one plane */
  const VIEWS = {
    one: { id: "one", name: "one-point perspective", eye: 2, pitch: 0, square: 0 },
    two: { id: "two", name: "two-point perspective", eye: 2, pitch: 0 },
    above: { id: "above", name: "three-point perspective, from above", eye: 4.6, pitch: 0.44 },
    below: { id: "below", name: "three-point perspective, from below", eye: 0.6, pitch: -0.26 },
    flat: { id: "flat", name: "flat, on one plane", square: 0, flat: true },
  };
  /* ── Composition ──────────────────────────────────────────────────────
   * Where the structure stands in the picture, and which way it grows, is a
   * style of its own, chosen for each painting like its medium:
   *   at       how far across the picture the eye's middle is set - the seed
   *            stands there (mirrored to the other side half the time)
   *   horizon  how high the eye's level lies in the picture
   *   size     how tall the seed stands against the picture's short side
   *   grow     which way new solids are favoured: balance (the mass kept
   *            over its point), up (stacked, a pyramid), far (small ones far
   *            out on the other side, a steelyard), back (into the depth, a
   *            diagonal), across (a row, a frieze) */
  const PHI = (Math.sqrt(5) - 1) / 2;
  const COMPOSITIONS = {
    golden: { name: "golden section", at: 1 - PHI, horizon: 1 - PHI, size: 0.27, grow: "balance" },
    thirds: { name: "rule of thirds", at: 1 / 3, horizon: 1 / 3, size: 0.25, grow: "balance" },
    pyramid: { name: "a pyramid, centred", at: 0.5, horizon: 0.42, size: 0.3, grow: "up" },
    steelyard: { name: "steelyard balance", at: 0.36, horizon: 0.4, size: 0.28, grow: "far" },
    diagonal: { name: "a diagonal into depth", at: 0.32, horizon: 0.34, size: 0.24, grow: "back" },
    frieze: { name: "a frieze across", at: 0.5, horizon: 0.46, size: 0.2, grow: "across" },
  };
  function compositionOf(rng, choose = null) {
    const keys = Object.keys(COMPOSITIONS), key = choose ? choose("composition", "scheme", keys) : keys[Math.floor(rng() * keys.length)];
    const C = COMPOSITIONS[key] || COMPOSITIONS.golden;
    return { key, ...C, x: rng() < 0.5 ? C.at : 1 - C.at };
  }
  function camera(W, H, view = VIEWS.two, comp = null) {
    const pitch = view.pitch || 0, f = ROOM.lens * Math.min(W, H);
    // (Where the composition sets the eye's middle: across, and - level - the horizon's height; looked down or up, half as far.)
    const cx = W * (comp ? comp.x : 0.5), cy = H * (comp ? (pitch ? 0.5 + (comp.horizon - 0.5) * 0.5 : comp.horizon) : 0.5);
    const cam = { W, H, f, cx, cy, eye: view.eye ?? ROOM.eye, pitch, cos: Math.cos(pitch), sin: Math.sin(pitch), view: view.id || "two", flat: Boolean(view.flat) };
    cam.horizon = cam.cy - f * Math.tan(pitch);
    // (Flat: so many pixels to a unit wherever a thing stands, and the floor a line low in the picture.)
    if (cam.flat) { cam.s = (comp?.size ?? ROOM.size) * Math.min(W, H) * 1.35; cam.base = H * (comp ? clamp(comp.horizon + 0.36, 0.62, 0.8) : 0.76); cam.horizon = cam.base; }
    return cam;
  }
  // A point as the eye has it: across, up, and how far ahead along the way it looks.
  const toEye = (cam, [X, Y, Z]) => { const y = Y - cam.eye; return [X, y * cam.cos + Z * cam.sin, Z * cam.cos - y * cam.sin]; };
  function project(cam, p) {
    if (cam.flat) return [cam.cx + cam.s * p[0], cam.base - cam.s * p[1]];
    const [x, y, z] = toEye(cam, p), d = Math.max(1e-3, z);
    return [cam.cx + cam.f * x / d, cam.cy - cam.f * y / d];
  }
  // How many pixels a unit is at a point (by its depth from the eye).
  const scaleAt = (cam, p) => (cam.flat ? cam.s : cam.f / Math.max(1e-3, toEye(cam, p)[2]));
  // The eye's ray through a point of the picture: from where, which way (not of unit length).
  function rayOf(cam, x, y) {
    if (cam.flat) return { o: [(x - cam.cx) / cam.s, (cam.base - y) / cam.s, -50], d: [0, 0, 1] };
    const a = (x - cam.cx) / cam.f, b = -(y - cam.cy) / cam.f;
    return { o: [0, cam.eye, 0], d: [a, b * cam.cos - cam.sin, b * cam.sin + cam.cos] };
  }
  // Where the ray through a point of the picture meets a plane (square to `n`, through `c`): the point, or null.
  function onPlane(cam, x, y, n, c) {
    const { o, d } = rayOf(cam, x, y), den = dot(n, d);
    if (Math.abs(den) < 1e-9) return null;
    const t = dot(n, sub(c, o)) / den;
    return t > 0 ? add(o, times(d, t)) : null;
  }
  // Where it meets a level plane `h` high (null over the horizon).
  const onLevel = (cam, x, y, h = 0) => onPlane(cam, x, y, [0, 1, 0], [0, h, 0]);
  // How far off a level plane lies at a height in the picture.
  const planeDepth = (cam, y, h = 0) => onLevel(cam, cam.cx, y, h)?.[2] ?? ROOM.wall * 4;
  // How far a plane turns toward the eye (the flat eye looks from straight in front, everywhere).
  const facingOf = (cam, normal, centre) => (cam.flat ? -normal[2] : dot(normal, sub([0, cam.eye, 0], centre)));

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
  /* A dome: half a sphere of radius `r` on its flat face - a frame of rings
   * for where it stands, what it hides and the shadow it throws; it is
   * painted round, as the sphere is. */
  function domeSolid(r, m = 16) {
    const rings = [0, 0.3, 0.6, 0.85].map((t) => t * Math.PI / 2), verts = [];
    for (const e of rings) for (let k = 0; k < m; k++) { const a = k / m * 2 * Math.PI; verts.push([r * Math.cos(e) * Math.cos(a), r * Math.sin(e), r * Math.cos(e) * Math.sin(a)]); }
    verts.push([0, r, 0]);
    const crown = verts.length - 1, last = (rings.length - 1) * m, faces = [{ name: "bottom", idx: Array.from({ length: m }, (_, k) => k) }];
    for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < m; k++) faces.push({ name: "side", idx: [j * m + k, j * m + (k + 1) % m, (j + 1) * m + (k + 1) % m, (j + 1) * m + k] });
    for (let k = 0; k < m; k++) faces.push({ name: "crown", idx: [last + k, last + (k + 1) % m, crown] });
    return { verts, faces, low: 0, high: r };
  }
  /* ── Form ─────────────────────────────────────────────────────────────
   * A shape made by the rules of form, not copied: its two sides answer
   * each other - one swelling out (convex), the other drawn in (concave) -
   * so it is not the same on the left as on the right (asymmetry across),
   * while its top and bottom mirror each other (symmetry up and down); and
   * it closes on itself. Stood up as a slab facing the eye, it is painted
   * out of the room (formSteps).
   *   swell  how far the convex side bows out; `dent`, how far the concave side is drawn in
   *   tall   its height against its width; `ends`, how square its top and bottom */
  function formOutline(rng) {
    const swell = 0.1 + rng() * 0.2, dent = 0.42 + rng() * 0.28, tall = 1.2 + rng() * 0.8, ends = 2.4 + rng() * 1.2, n = 14, flip = rng() < 0.5 ? -1 : 1;
    const w = (t) => 0.5 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), ends)), 1 / ends), ring = [];
    // Up the convex side, then down the concave one (both even in t: the bottom mirrors the top).
    for (let i = 0; i <= n; i++) { const t = -1 + 2 * i / n; ring.push([flip * w(t) * (1 + swell * (1 - t * t)), (t + 1) / 2 * tall]); }
    for (let i = n - 1; i >= 1; i--) { const t = -1 + 2 * i / n; ring.push([-flip * (w(t) - dent * 0.5 * (1 - t * t) ** 2), (t + 1) / 2 * tall]); }
    // (Wound anticlockwise, across and up.)
    return { ring: flip < 0 ? ring.reverse() : ring, tall, swell: +swell.toFixed(2), dent: +dent.toFixed(2) };
  }
  // A form's solid: its outline as a slab `dep` deep, its front toward -z; every face wound anticlockwise seen from outside.
  function formSolid(outline, e, dep = e * 0.3) {
    const ring = outline.ring.map(([x, y]) => [x * e, y * e]), n = ring.length, verts = [];
    for (const [x, y] of ring) verts.push([x, y, -dep / 2]);
    for (const [x, y] of ring) verts.push([x, y, dep / 2]);
    const faces = [{ name: "front", idx: Array.from({ length: n }, (_, k) => n - 1 - k), concave: true }, { name: "back", idx: Array.from({ length: n }, (_, k) => n + k), concave: true }];
    for (let k = 0; k < n; k++) faces.push({ name: "side", idx: [k, (k + 1) % n, n + (k + 1) % n, n + k] });
    return { verts, faces, low: 0, high: outline.tall * e, wound: true };
  }
  // A face's way out by its winding (Newell's): right for a face not convex, where the way from the middle is not.
  function newell(w) {
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < w.length; i++) { const a = w[i], b = w[(i + 1) % w.length]; x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); }
    return unit([x, y, z]);
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
  const SIZES = { cube: 1, tetrahedron: 1.25, octahedron: 1.05, pyramid: 1.1, cylinder: 0.9, cone: 1, dome: 0.65, blob: 0.75 };
  // The solids that are curved: painted round, in strokes that follow the curve; the rest are built plane by plane.
  const ROUND = new Set(["sphere", "cylinder", "cone", "dome"]);
  // (A sphere, or half of one: painted in bands round the light, a shadow on it laid along them.)
  const isBall = (P) => P?.kind === "sphere" || P?.kind === "dome";
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
    else if (kind === "dome") return domeSolid(e);
    else if (kind === "blob") return formSolid(form.outline || formOutline(Math.random), e);
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
    const faces = solid.faces.map((f) => {
      const world = f.idx.map((i) => solid.verts[i]);
      const centre = times(world.reduce(add, [0, 0, 0]), 1 / world.length);
      // (Square to the face itself, outward: a stretched solid's faces no longer face away from its middle.)
      let normal = solid.wound ? newell(world) : unit(cross(sub(world[1], world[0]), sub(world[2], world[1])));
      if (!solid.wound && dot(normal, sub(centre, solid.middle)) < 0) normal = times(normal, -1);
      const facing = facingOf(cam, normal, centre);
      const level = Math.abs(normal[1]) > 0.99;
      // A level plane under the eye shows its top, over it its underside; at its height (or to the flat eye), only its edge.
      const horizon = level ? (cam.flat || Math.abs(centre[1] - cam.eye) < 1e-3 ? "on" : centre[1] < cam.eye ? "below" : "above") : null;
      const holes = f.holes ? { holeWorld: f.holes.map((h) => h.map((i) => solid.verts[i])), holeScreens: f.holes.map((h) => h.map((i) => pts[i])) } : {};
      return { ...f, ...holes, world, centre, normal, facing, level, horizon, visible: facing > 1e-6, depth: centre[2], screen: f.idx.map((i) => pts[i]) };
    });
    const visible = faces.filter((f) => f.visible);
    // The edges of the planes that are seen (each once), and the corners' angles in the picture.
    const edges = new Map();
    for (const f of visible) {
      for (const ring of [f.idx, ...(f.holes || [])]) for (let k = 0; k < ring.length; k++) {
        const a = ring[k], b = ring[(k + 1) % ring.length], key = a < b ? a + "-" + b : b + "-" + a;
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
    return { pts, faces, visible, planes: visible.length, edges: [...edges.values()], horizonY: cam.horizon };
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
  /* ── Colour ───────────────────────────────────────────────────────────
   * A painting's colours as a key, not a scatter - the same grammar as the
   * painter's own: one hue the structure keeps coming back to (its
   * dominant), in tints, tones and shades of it; a second, its support,
   * set by how it stands to the first; and now and then one note of an
   * accent, on something small. The room is in the key too: the wall and
   * the floor are greyed hues of it. With the harmony are chosen how strong
   * the colour is (its chroma) and where the values sit (light, middle or
   * dark), each learned like any other choice.
   *   support  where the support hue stands to the dominant (degrees round the wheel)
   *   accent   where the accent stands to it
   *   wall     whose hue the wall is a greyed tint of */
  const HARMONIES = {
    monochrome: { support: [0], accent: [0], wall: "dominant" },
    analogous: { support: [-40, 40, -28, 28], accent: [-75, 75], wall: "dominant" },
    complementary: { support: [180, 168, 192], accent: [180], wall: "support" },
    "split complementary": { support: [150, 210], accent: [210, 150], wall: "support" },
    triadic: { support: [120, 240], accent: [240, 120], wall: "dominant" },
  };
  // How strong the colour is: the saturation of the dominant, the support, the accent and the room.
  const CHROMAS = { muted: [0.2, 0.14, 0.45, 0.05], moderate: [0.34, 0.24, 0.6, 0.09], rich: [0.52, 0.36, 0.74, 0.14] };
  // Where the values sit: the wall's, the floor's and the solids' lightness (a dark room keeps its solids light).
  const VALUE_KEYS = { light: { wall: [0.8, 0.9], floor: [0.64, 0.76], solid: [0.48, 0.66] }, middle: { wall: [0.6, 0.72], floor: [0.44, 0.56], solid: [0.4, 0.62] },
    dark: { wall: [0.2, 0.3], floor: [0.3, 0.4], solid: [0.5, 0.7] } };
  function palette(rng, choose = null) {
    const chosen = (key, options) => (choose ? choose("colour", key, options) : options[Math.floor(rng() * options.length)]);
    const relation = chosen("harmony", Object.keys(HARMONIES)), chroma = chosen("chroma", Object.keys(CHROMAS)), key = chosen("key", Object.keys(VALUE_KEYS));
    const H = HARMONIES[relation], C = CHROMAS[chroma], K = VALUE_KEYS[key], at = ([a, b]) => a + rng() * (b - a), one = (list) => list[Math.floor(rng() * list.length)];
    // (The accent stands somewhere the support does not, where the harmony has room for it.)
    const hue = rng() * 360, sOff = one(H.support), aOff = one(H.accent.filter((a) => Math.abs(a - sOff) > 20).concat(H.accent.length > 1 ? [] : H.accent));
    const support = (hue + sOff + 360) % 360, accent = (hue + (aOff ?? H.accent[0]) + (rng() - 0.5) * 16 + 360) % 360;
    const wallHue = (H.wall === "support" ? support : hue) + (rng() - 0.5) * 20, floorHue = wallHue + (rng() < 0.5 ? -1 : 1) * (14 + rng() * 26);
    /* Its tonal centre: what everything far off settles toward - the value
     * the key sets (light, middle, dark) in a colour of its own: neutral,
     * warm, cool, the dominant's hue or its opposite. The room leans to it. */
    const tone = chosen("centre", ["neutral", "warm", "cool", "dominant", "complement"]);
    const toneHue = { neutral: wallHue, warm: 28 + rng() * 20, cool: 200 + rng() * 28, dominant: hue, complement: hue + 180 }[tone];
    const centre = hsl((toneHue + 360) % 360, tone === "neutral" ? 0.05 : 0.22 + rng() * 0.16, { light: 0.72 + rng() * 0.1, middle: 0.44 + rng() * 0.12, dark: 0.16 + rng() * 0.1 }[key]);
    const lean = tone === "neutral" ? 0.15 : 0.35;
    return {
      relation, chroma, key, hue, support, accent, sat: C, light: K.solid, tone, centre,
      wall: mix(hsl((wallHue + 360) % 360, C[3] * (0.6 + rng() * 0.6), at(K.wall)), centre, lean),
      floor: mix(hsl((floorHue + 360) % 360, C[3] * (0.9 + rng() * 0.7), at(K.floor)), centre, lean * 0.6),
      solid: hsl(hue, C[0] * (0.85 + rng() * 0.3), at(K.solid)),
      solid2: hsl(support, C[1] * (0.85 + rng() * 0.3), at(K.solid)),
    };
  }
  // A colour's hue (degrees), saturation and lightness (0 to 1).
  function hslOf([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
  }
  // A colour brought into the painting's key: no stronger than `most`.
  const keyed = (c, most) => { const [h, sat, l] = hslOf(c); return paint(hsl(h, Math.min(sat, most), l)); };
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
        if (!Q.alive || Q === self || Q === self?.of || !Q.base) continue;
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
    return paint(distant(S, c, Z));
  }
  // How far back a depth is, 0 (as near as a solid stands) to 1 (the wall); and a solid.
  const farness = (Z) => clamp((Z - DEPTH.near) / (ROOM.wall - DEPTH.near), 0, 1) ** DEPTH.curve;
  const farOf = (S, P) => (S.cam.flat ? 0 : farness((P.middle || P.placed.middle)[2]));
  /* A colour as far off as `Z`: its chroma going first, its value drawn
   * toward the picture's tonal centre, the air over both - near is rich and
   * sharp, far is quiet. (To the flat eye nothing is far: it has no depth.) */
  function distant(S, c, Z) {
    const d = S.cam?.flat ? 0 : farness(Z);
    if (d <= 0) return c;
    const L = lum(c), keep = 1 - DEPTH.chroma * d, v = L + ((S.centre ?? L) - L) * DEPTH.value * d;
    return mix(c.map((x) => v + (x - L) * keep), S.air || c, (S.airAmount ?? DEPTH.air) * d);
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
      const k = typeof s.soften === "number" ? s.soften : 1;
      s.colour = paint(under); s.alpha = +(0.4 * k).toFixed(3); s.tip = "soft"; s.plain = true;
      after = toward(under, 0.3 * k);
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
    if (S.cam.flat) { yield* flatRoom(S); return; }
    const { cam } = S, W = cam.W, H = cam.H, side = S.light.side;
    const meet = meetOf(cam);
    const wallLit = shade(S, S.palette.wall, [0, 0, -1], ROOM.wall);
    const wallAt = (x, y) => wallLit.map((v) => v * (1 + 0.16 * side * (x / W - 0.5) * 2 - 0.05 * (1 - clamp(y, 0, meet) / meet)));
    // (The floor's own light: what the solids standing on it shut out round them is laid with each of them - the ground round it.)
    const floorAt = (x, y) => {
      const Z = Math.min(ROOM.wall, (onLevel(cam, x, Math.max(y, meet + 0.5)) || [0, 0, ROOM.wall])[2]);
      return shade(S, S.palette.floor, [0, 1, 0], Z).map((v) => v * (1 + 0.12 * side * (x / W - 0.5) * 2));
    };
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
  /* The room to the flat eye: the wall in one colour down to the floor's
   * line, the floor's edge in one colour under it, and the line between
   * them - no light across either. */
  function* flatRoom(S) {
    const { cam } = S, W = cam.W, H = cam.H, line = cam.base, rowW = Math.max(6, line / 9);
    const wallAt = () => S.palette.wall, floorAt = () => S.palette.floor;
    yield* inSteps("the wall, flat", wallStrokes(S, line, rowW, wallAt));
    yield* glazes(S, null, [[0, 0], [W, 0], [W, line], [0, line]], "the wall", () => wallStrokes(S, line, rowW, wallAt));
    if (S.app.wet === "on dry") S.paint.clock += S.M.wet;
    const band = () => {
      const out = [], h = Math.max(6, (H - line) / 4);
      for (let y = line + h * 0.45; y < H + h * 0.5; y += h * 0.8) {
        for (let x = -W * (0.05 + S.rng() * 0.2); x < W * 1.05; x += W * (0.18 + S.rng() * 0.1)) {
          const len = W * (0.26 + S.rng() * 0.08), x0 = x + (S.rng() - 0.5) * W * 0.05;
          out.push(stroke(S, [[x0, y], [x0 + len * 0.5, y + (S.rng() - 0.5) * h * 0.1], [x0 + len, y]], h * 1.5, floorAt(), "flat", { meant: floorAt, clip: [[-W, line], [2 * W, line], [2 * W, 2 * H], [-W, 2 * H]] }));
        }
      }
      return out;
    };
    yield* inSteps("the floor, flat", band());
    yield* glazes(S, null, [[0, line], [W, line], [W, H], [0, H]], "the floor", band);
    yield { label: "the floor's line", strokes: [stroke(S, [[-2, line], [W / 2, line + (S.rng() - 0.5)], [W + 2, line]], S.lineW, paint(mix(S.palette.floor, [30, 30, 40], 0.5)), "round", { line: true })] };
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
      const Z = planeDepth(cam, Math.max(y, meetOf(cam) + 0.5)), next = Math.min(H + 2, Math.max(y + 2, project(cam, [0, 0, Z / 1.13])[1])), h = Math.max(2, next - y);
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
    // (A shape that is not convex throws its own outline, carried down the light: Form.)
    if (E.placed?.wound) return E.placed.faces[0].idx.map((i) => down(E.placed.verts[i]));
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
    if (S.cam.flat) return;
    const { cam } = S, out = [], h = ground.h;
    // (A thing of many parts throws the shadows of its parts: Type, Plants.)
    const shapes = (E.parts || [E]).map((q) => shadowOutline(S, q, h)), shots = shapes.map((shape) => shape.map((p) => project(cam, p)));
    const shape = shapes.flat(), all = shots.flat(), shot = shots.length === 1 ? shots[0] : hull2(all);
    (E.shot ||= {})[h > 0 ? "top" : "floor"] = shot;
    const lowest = E.parts ? E.low : E.kind === "sphere" ? E.middle[1] - E.radius : Math.min(...E.placed.verts.map((v) => v[1]));
    const standing = Math.abs(lowest - h) < 0.02, contact = E.middle || E.placed.middle;
    const ys = all.map((p) => p[1]), top = Math.min(...ys), foot = Math.max(...ys);
    const reach = Math.max(...shape.map((p) => Math.hypot(p[0] - contact[0], p[2] - contact[2]))) || 1, clear = 0.8 * (1 - (E.form?.opacity ?? 1));
    // The shadow's colour where it falls: the plane's own, without the light, deepest at the solid's foot.
    const darkAt = (x, y) => {
      const p = onLevel(cam, x, Math.max(y, cam.horizon + 1), h) || [contact[0], h, contact[2]], X = p[0], Z = p[2];
      const far = clamp(Math.hypot(X - contact[0], Z - contact[2]) / reach, 0, 1);
      // (A solid seen through lets some light through its shadow.)
      const dark = shade(S, ground.base, [0, 1, 0], Z, { at: [X, h, Z] }).map((v, i) => v * (0.38 + 0.25 * far) + S.light.ambient[i] * 0.06);
      return clear ? mix(dark, shade(S, ground.base, [0, 1, 0], Z), clear) : dark;
    };
    const rows = Math.max(4, Math.round((foot - top) / Math.max(3, cam.W * 0.012)));
    // (On the floor only as far as the wall: past it, the shadow climbs the wall.)
    const climbs = h === 0 && shape.some((p) => p[2] > ROOM.wall), extra = ground.clip ? { clip: ground.clip } : climbs ? { clip: floorOf(cam) } : {};
    for (let r = 0; r < rows && foot > cam.horizon; r++) {
      const y = top + (r + 0.5) * (foot - top) / rows, band = (foot - top) / rows;
      if (y <= cam.horizon) continue;
      let start = null;
      const step = Math.max(2, cam.W * 0.008), left = Math.min(...all.map((p) => p[0])), right = Math.max(...all.map((p) => p[0]));
      for (let x = left - step; x <= right + step; x += step) {
        const isIn = shots.length === 1 ? inPoly(shot, x, y) : shots.some((q) => inPoly(q, x, y));
        if (isIn && start === null) start = x;
        if (!isIn && start !== null) {
          const mid = (start + x) / 2, q = onLevel(cam, mid, y, h) || [contact[0], h, contact[2]];
          const far = clamp(Math.hypot(q[0] - contact[0], q[2] - contact[2]) / reach, 0, 1);
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
      const r = scaleAt(cam, E.middle) * E.radius, [x, y] = project(cam, [E.middle[0], h, E.middle[2]]);
      for (let k = 0; k < 3; k++) {
        const w = r * (0.9 - k * 0.22);
        touch.push(stroke(S, [[x - w / 2, y - k], [x, y + 1 - k], [x + w / 2, y - k]], Math.max(3, r * 0.07), shade(S, ground.base, [0, 1, 0], E.middle[2]).map((c) => c * 0.3), "filbert", extra));
      }
    } else {
      for (const q of E.parts || [E]) {
        if (!q.map) continue;
        const lineW = S.lineW, pts = q.map.pts, verts = q.placed.verts;
        for (const e of q.map.edges) {
          if (Math.abs(verts[e.a][1] - h) > 0.02 || Math.abs(verts[e.b][1] - h) > 0.02) continue;
          touch.push(stroke(S, [pts[e.a], pts[e.b]], lineW * 2.4, shade(S, ground.base, [0, 1, 0], e.depth).map((c) => c * 0.32), "filbert", extra));
        }
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
    // (Things of many parts throw, and take, shadows part by part: Type, Plants.)
    const casters = (A.parts || [A]).filter((q) => A.kind !== "plant" || q.size > 0.06).map((q) => (q.kind === "sphere" ? rimOf(S, q) : q.placed.verts));
    const faces = (B.parts || [B]).filter((q) => B.kind !== "plant" || q.size > 0.06).flatMap((q) => (ROUND.has(q.kind) ? [Object.assign(discOf(S, q), { part: q })].filter((f) => f.world.length >= 3) : q.map ? q.map.visible.map((f) => ({ ...f, part: q })) : []));
    for (const f of faces) {
      const nl = dot(f.normal, L);
      if (nl < 0.05) continue;
      for (const points of casters) {
        const proj = [];
        for (const p of points) {
          const t = dot(f.normal, sub(p, f.centre)) / nl;
          if (t > 1e-3) proj.push(sub(p, times(L, t)));
        }
        if (proj.length < 3) continue;
        const u = unit(sub(f.world[1], f.world[0])), v = cross(f.normal, u);
        const flat = (p) => [dot(sub(p, f.centre), u), dot(sub(p, f.centre), v)];
        const cut = f.concave ? clipConvex(f.world.map(flat), hull2(proj.map(flat))) : clipConvex(hull2(proj.map(flat)), f.world.map(flat));
        if (cut.length < 3 || Math.abs(areaOf(cut)) < 1e-4) continue;
        let world = cut.map(([a, b]) => add(f.centre, add(times(u, a), times(v, b))));
        // (On a curved solid, each point of it carried on up the light from the plane through its middle to where the light meets it, so the shadow wraps round it.)
        if (f.curved) world = densify(world, 6).map((q) => onSurface(S, f.part, q));
        out.push({ face: f, world, shot: world.map((p) => project(S.cam, p)) });
      }
    }
    return out;
  }
  const densify = (poly, k) => poly.flatMap((p, i) => Array.from({ length: k }, (_, j) => mix(p, poly[(i + 1) % poly.length], j / k)));
  // A point on a curved solid's middle plane, carried up the light to its surface (where the light first meets it there).
  function onSurface(S, B, q) {
    const L = S.light.L;
    if (isBall(B)) {
      // (A point on the edge of the many-sided disc stands for the circle: on it, where the light only grazes the sphere, it is not lifted at all.)
      const d = sub(q, B.middle), l = Math.hypot(d[0], d[1], d[2]), rim = B.radius * Math.cos(Math.PI / 24) * 0.999;
      if (l >= rim) return add(B.middle, times(d, B.radius / (l || 1)));
      return add(q, times(L, Math.sqrt(Math.max(0, B.radius ** 2 - l * l))));
    }
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
    if (isBall(B)) {
      const [cx, cy] = project(cam, B.middle), r = scaleAt(cam, B.middle) * B.radius, nx = clamp((x - cx) / r, -1, 1), ny = clamp(-(y - cy) / r, -1, 1);
      return [nx, ny, -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
    }
    const m = B.placed.middle, r = scaleAt(cam, m) * B.radius, nx = clamp((x - project(cam, m)[0]) / r, -1, 1), nz = -Math.sqrt(Math.max(0, 1 - nx * nx));
    return B.kind === "cone" ? unit([nx * (B.high - B.low), B.radius, nz * (B.high - B.low)]) : [nx, 0, nz];
  }
  /* The wall, as somewhere a shadow can climb: the one upright plane every
   * solid stands before, square to the eye, facing the light (the light is
   * always on the eye's side of the solids). */
  const wallOf = (S) => (S.wall ||= { id: "wall", kind: "wall", name: "the wall", low: 0, high: 30, get base() { return S.palette.wall; },
    map: { visible: [{ normal: [0, 0, -1], centre: [0, 15, ROOM.wall], world: [[-40, 0, ROOM.wall], [40, 0, ROOM.wall], [40, 30, ROOM.wall], [-40, 30, ROOM.wall]] }] } });
  // Where the floor meets the wall, in the picture; and the floor below it.
  const meetOf = (cam) => project(cam, [0, 0, ROOM.wall])[1];
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
    const normal = isBall(B) ? L : unit([L[0], 0, L[2]]), u = unit(cross([0, 1, 0], normal)), v = cross(normal, u);
    let world = isBall(B) ? Array.from({ length: 24 }, (_, k) => add(m, add(times(u, r * Math.cos(k / 24 * 2 * Math.PI)), times(v, r * Math.sin(k / 24 * 2 * Math.PI)))))
      : B.kind === "cone" ? [add([m[0], B.low, m[2]], times(u, -r)), add([m[0], B.low, m[2]], times(u, r)), [m[0], B.high, m[2]]]
        : [add([m[0], B.low, m[2]], times(u, -r)), add([m[0], B.low, m[2]], times(u, r)), add([m[0], B.high, m[2]], times(u, r)), add([m[0], B.high, m[2]], times(u, -r))];
    // (A dome's: only the part over its flat face.)
    if (B.kind === "dome") world = overLevel(world, B.low);
    return { normal, centre: world.length ? times(world.reduce(add, [0, 0, 0]), 1 / world.length) : m, world, curved: true };
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
    if (S.cam.flat) return;
    const marks = castOn(S, A, B), out = [], { cam } = S;
    (A.shot.on ||= new Map()).set(B.id, marks.map((m) => clipOf(m.shot, 2)));
    for (const m of marks) {
      const f = m.face, clip = clipOf(m.shot, 0.6);
      const ball = f.curved && isBall(f.part);
      const darkAt = (x, y) => {
        const p = ball ? sphereAt(S, f.part, x, y) : onPlane(cam, x, y, f.normal, f.centre) || f.centre;
        return shade(S, B.base, ball ? unit(sub(p, f.part.middle)) : f.curved ? roundNormal(S, f.part, x, y) : f.normal, p[2], { at: p, self: B, direct: 0 });
      };
      // (On a curved solid, along its own curves; on a plane, in rows across it.)
      out.push(...(f.curved ? roundShadow(S, f.part, m.shot, darkAt, { clip, meant: darkAt }) : rowsIn(S, m.shot, Math.max(3, cam.W * 0.012), darkAt, "filbert", { clip, meant: darkAt })));
    }
    if (out.length) yield* inSteps("the shadow of " + theOf(A) + " on " + theOf(B), out);
  }
  /* The ground round a solid where it stands, gone over again once it is
   * there: darker close in, where it shuts out the light from round about
   * (occlusion), and touched with its colour (diffusion). */
  function* groundSteps(S, P) {
    if (S.cam.flat || P.parts) return;
    const g = P.ground, h = g.h, { cam } = S, m = P.middle || P.placed.middle, ring = P.foot.map(([x, z]) => [m[0] + (x - m[0]) * 1.8, h, m[2] + (z - m[2]) * 1.8]);
    const shot = hull2(ring.map((p) => project(cam, p))), crosses = h === 0 && ring.some((p) => p[2] > ROOM.wall);
    if (shot.length < 3 || Math.max(...shot.map((p) => p[1])) <= cam.horizon) return;
    const base = h > 0 ? P.host.base : S.palette.floor, side = S.light.side, self = h > 0 ? P.host : null, middle = [m[0], m[2]];
    const groundAt = (x, y) => {
      const at = onLevel(cam, x, Math.max(y, cam.horizon + 1), h) || [m[0], h, m[2]], Z = at[2], near = Math.min(ROOM.wall, Z);
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
    if (S.cam.flat) return;
    const m = P.middle || P.placed.middle, out = [];
    for (const Q of alive(S)) {
      if (Q === P || Q.round || Q.kind === "sphere" || Q.parts) continue;
      for (const f of Q.map.visible) {
        if (dot(f.normal, sub(m, f.centre)) <= 0 || Math.hypot(...sub(m, f.centre)) > 1.8) continue;
        const fill = f.idx.length > 4 ? fillPolygon(S, f, Q.base, Q) : fillPlane(S, f, Q.base, Q), fronts = outsFor(S, Q);
        for (const s of fill) out.push(Object.assign(s, { faint: true, app: Q.app, clipOut: fronts }));
      }
    }
    if (out.length) yield* inSteps("what stands near " + theOf(P) + " takes its colour", out);
  }

  /* ── A sphere: in bands round the way the light comes ─────────────────
   * Painted as it is lit: in bands that each take the light at one angle -
   * circles round the point of it nearest the light, as lines of latitude go
   * round a pole. Seen, each band is an arc that runs nearly straight
   * across the middle of the sphere and curves harder the nearer it comes to
   * the sphere's edge, turning to run along the rim; its strokes follow it,
   * so the shading turns with the form - and a shadow thrown on the sphere
   * is laid along the same arcs. In paint, from the shadowed side to the
   * light, the lights going on last over the darks; in a medium that cannot
   * go lighter, the lights first and the darks over them, the highlight
   * kept bare. */
  function* sphereSteps(S, E) {
    const { cam } = S, R = E.radius, C = E.middle, L = S.light.L, r = scaleAt(cam, C) * R, far = farOf(S, E), short = Math.min(cam.W, cam.H);
    const toEye = cam.flat ? [0, 0, -1] : unit(sub([0, cam.eye, 0], C));
    // (Far back, or small, it takes fewer bands: Depth.)
    const N = E.bands = clamp(Math.round(r / (short * 0.011) * (1 - DEPTH.detail * far)), 5, 16), w = r / N;
    const colourAt = (x, y) => { const p = sphereAt(S, E, x, y); return shade(S, E.base, unit(sub(p, C)), p[2], { shine: 0.55, at: p, self: E }); };
    // The highlight: where the sphere turns halfway between the light and the eye.
    const [hx, hy] = project(cam, add(C, times(unit(add(L, toEye)), R)));
    const keep = S.rules.reserve ? [oval(hx, hy, w * 0.7, w * 0.55, 14)] : null;
    const clip = clipOf(E.outline, 0.6), extra = keep ? { meant: colourAt, clipOut: keep, clip } : { meant: colourAt, clip };
    yield* bandSteps(S, E, N, extra, "");
    if (far < 0.55) yield* glazes(S, E, E.outline, E.name, () => [...bandSteps(S, E, N, extra, ", glazed again")].flatMap((step) => step.strokes));
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
    // (Kept bare, the ground is its highlight - and a dome has none where it is not.)
    if (keep || (E.kind === "dome" && add(C, times(unit(add(L, toEye)), R))[1] < E.low)) return;
    const shine = mix(S.light.colour, E.base, 0.12);
    yield {
      label: "the highlight on " + theOf(E),
      strokes: [stroke(S, [off(S, [hx - w * 0.35, hy], 1), [hx, hy - w * 0.05], off(S, [hx + w * 0.35, hy], 1)], w * 0.8, mix(colourAt(hx, hy), shine, 0.55), "round", { clip }),
        stroke(S, [[hx - w * 0.12, hy], [hx + w * 0.12, hy]], w * 0.45, shine, "round", { clip })],
    };
  }
  /* ── A dome ───────────────────────────────────────────────────────────
   * Half a sphere, standing on its flat face. All the way round it - the
   * side turned from the eye as much as the side it sees, decided when it
   * is made - what it was made with: doors and windows into it, niches in
   * it, ribs from its foot toward its crown, a groove round it, an eye open
   * at its crown. Turned, its far side comes round with what was always on
   * it (Turning).
   *   az   where round it (its own way round, as it was made); `w` how wide
   *   el   how far up (0 its foot, 1 its crown); `h` how tall */
  function domeFeatures(S) {
    const rng = S.rng, out = [], n = 2 + Math.floor(rng() * 3), a0 = rng() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const type = ["door", "window", "niche", "rib", "rib"][Math.floor(rng() * 5)];
      out.push({ type, az: a0 + i * 2 * Math.PI / n + (rng() - 0.5) * 0.5, w: type === "rib" ? 0.07 : 0.3 + rng() * 0.2,
        h: type === "door" ? 0.4 + rng() * 0.18 : type === "rib" ? 0.82 : 0.2 + rng() * 0.1, el: type === "window" ? 0.3 + rng() * 0.18 : 0 });
    }
    if (rng() < 0.5) out.push({ type: "ring", el: 0.3 + rng() * 0.3 });
    if (rng() < 0.35) out.push({ type: "eye", r: 0.1 + rng() * 0.08 });
    return out;
  }
  // A point on a dome: `az` round it, `el` up it, `out` from its middle (1: on it).
  const domeAt = (P, az, el, out = 1) => { const a = az - (P.yaw || 0), e = el * Math.PI / 2; return add(P.middle, times([Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)], P.radius * out)); };
  // A dome as the eye sees it: round over its flat face.
  function domeOutline(S, P) {
    const pts = [];
    for (let j = 0; j <= 6; j++) for (let k = 0; k < 40; k++) pts.push(project(S.cam, domeAt(P, k / 40 * 2 * Math.PI, j / 6)));
    return hull2(pts);
  }
  // A ring of points cut to what lies over a level `h`.
  function overLevel(poly, h) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ain = a[1] >= h, bin = b[1] >= h;
      if (ain) out.push(a);
      if (ain !== bin) out.push(mix(a, b, (h - a[1]) / (b[1] - a[1])));
    }
    return out;
  }
  // A dome painted as a sphere is, in bands round the light over its flat face; then what it was made with, where it is seen.
  function* domeSteps(S, E) {
    yield* sphereSteps(S, E);
    if (farOf(S, E) < 0.7) yield* inSteps("what " + theOf(E) + " was made with, where it is seen", domeFeatureStrokes(S, E));
  }
  /* Its features: an opening dark inside - deepest at the foot of a door,
   * under the hood of a niche - its jamb turned to the light catching it; a
   * rib's two sides, one to the light, one away; a groove round it, dark
   * over light; an eye at its crown. Only those wholly seen (a groove, where
   * it is seen). */
  function domeFeatureStrokes(S, E) {
    const { cam } = S, out = [], clip = clipOf(E.outline, 0.4), band = Math.max(2.5, Math.min(cam.W, cam.H) * 0.007), L = S.light.L;
    const seen = (p) => facingOf(cam, sub(p, E.middle), p) > 0.04 * E.radius;
    const lit = (p, direct = 1) => shade(S, E.base, unit(sub(p, E.middle)), p[2], { at: p, self: E, direct });
    const colourAt = (f) => (x, y) => f(sphereAt(S, E, x, y));
    const paintIn = (pts, f) => { if (pts.length < 3 || !pts.every(seen)) return; const at = colourAt(f); out.push(...rowsIn(S, pts.map((p) => project(cam, p)), band, at, "flat", { clip, meant: at })); };
    const light = (p) => mix(lit(p), S.light.colour, 0.18), dark = (p) => lit(p).map((v) => v * 0.68);
    for (const f of E.features || []) {
      // (Which way round is toward the light, where it stands: the side of an opening away from the light faces it.)
      const a = f.az - (E.yaw || 0), tangent = [-Math.sin(a), 0, Math.cos(a)], fromLight = dot(tangent, L) > 0 ? -1 : 1;
      if (f.type === "door" || f.type === "window" || f.type === "niche") {
        const half = f.w * Math.PI / 4, lo = f.el, hi = f.el + f.h, spring = lo + (hi - lo) * 0.7, edge = [];
        for (let i = 0; i <= 6; i++) edge.push(domeAt(E, f.az - half, lo + (spring - lo) * i / 6));
        for (let i = 1; i < 10; i++) { const t = -1 + 2 * i / 10; edge.push(domeAt(E, f.az + half * t, spring + (hi - spring) * Math.sqrt(Math.max(0, 1 - t * t)))); }
        for (let i = 6; i >= 0; i--) edge.push(domeAt(E, f.az + half, lo + (spring - lo) * i / 6));
        const deep = f.type === "door" ? 0.3 : f.type === "window" ? 0.38 : 0.6, top = E.middle[1] + E.radius * Math.sin(hi * Math.PI / 2), bottom = E.middle[1] + E.radius * Math.sin(lo * Math.PI / 2);
        paintIn(edge, (p) => { const t = clamp((p[1] - bottom) / Math.max(1e-3, top - bottom), 0, 1); return lit(p, 0).map((v) => v * (f.type === "niche" ? deep + 0.3 * (1 - t) : deep + 0.22 * t)); });
        const side = f.az + fromLight * half, inner = f.az + fromLight * half * 0.78;
        paintIn([domeAt(E, side, lo), domeAt(E, side, spring), domeAt(E, inner, spring), domeAt(E, inner, lo)], light);
      } else if (f.type === "rib") {
        const half = f.w * Math.PI / 4;
        for (const sgn of [1, -1]) {
          const pts = [];
          for (let i = 0; i <= 8; i++) pts.push(domeAt(E, f.az, f.h * i / 8, 1.012));
          for (let i = 8; i >= 0; i--) pts.push(domeAt(E, f.az + sgn * half * (1 - 0.5 * i / 8), f.h * i / 8, 1.006));
          paintIn(pts, sgn === -fromLight ? light : dark);
        }
      } else if (f.type === "ring") {
        // (Seen in runs round it; the upper lip's underside dark, the lower lip's top catching the light.)
        const m = 64, ok = Array.from({ length: m }, (_, k) => seen(domeAt(E, k / m * 2 * Math.PI, f.el)));
        const from = ok.findIndex((x) => !x);
        if (from < 0) continue;
        let run = [];
        const flush = () => {
          if (run.length > 2) {
            const upper = run.map((az) => domeAt(E, az, f.el + 0.03)), mid = run.map((az) => domeAt(E, az, f.el)), lower = run.map((az) => domeAt(E, az, f.el - 0.03));
            paintIn(upper.concat(mid.slice().reverse()), dark);
            paintIn(mid.concat(lower.slice().reverse()), light);
          }
          run = [];
        };
        for (let i = 1; i <= m; i++) { const k = (from + i) % m; if (ok[k]) run.push(k / m * 2 * Math.PI); else flush(); }
        flush();
      } else if (f.type === "eye") {
        const ring = Array.from({ length: 20 }, (_, k) => domeAt(E, k / 20 * 2 * Math.PI, 1 - f.r));
        paintIn(ring, (p) => lit(p, 0).map((v) => v * 0.35));
      }
    }
    return out;
  }
  /* A form painted out of the room (Form): first a loose patch of its own
   * colour, bigger than it; then what was there before cut back in round
   * it - the background laid where it belongs, the form left as what was
   * not painted over, so its outline is the room's edge, not a line; then
   * the side of the slab that is seen; then the patch turned into a form,
   * in bands following its outline from the edge in, each in the light of a
   * surface swelling toward the eye in the middle and turning away at the
   * edge - hardest at the edge. A medium that cannot go lighter keeps to
   * the outline and lays its bands lightest first. */
  function* formSteps(S, E) {
    const { cam } = S, P0 = S.paint, outline = E.outline, short = Math.min(cam.W, cam.H), far = farOf(S, E), name = theOf(E);
    const faced = E.map.faces.filter((f) => f.concave).sort((a, b) => b.facing - a.facing)[0], Nf = faced?.normal || [0, 0, -1];
    const across = [Math.cos(E.yaw || 0), 0, -Math.sin(E.yaw || 0)], at = E.placed.middle, Z = at[2];
    const [cx, cy] = [outline.reduce((t, q) => t + q[0], 0) / outline.length, outline.reduce((t, q) => t + q[1], 0) / outline.length];
    // (Where nothing can cover, out to the edge of what was kept bare for it: no ring of bare ground left round it.)
    const box = boxOf([outline]), size = Math.max(box.x1 - box.x0, box.y1 - box.y0), margin = size * 0.14, clip = clipOf(outline, S.rules.darkenOnly ? S.lineW * 0.7 + 1.4 : 0.5);
    // What was round it before anything of it was laid: the room, the shadows, what stands by.
    const was = { want: P0.want.slice(), has: P0.has.slice(), colour: P0.colour.slice() };
    const before = (x, y) => { const k = cellAt(P0, x, y); if (k < 0) return S.palette.wall; const c = was.has[k] ? was.want : was.colour; return [c[k * 3], c[k * 3 + 1], c[k * 3 + 2]]; };
    const patch = () => shade(S, E.base, Nf, Z, { at, self: E }).map((v) => v * 0.92);
    const opaque = !S.rules.darkenOnly;
    yield* inSteps("a loose patch of " + name + "'s colour", rowsIn(S, opaque ? clipOf(outline, margin * 0.45) : outline, Math.max(4, short * 0.018), patch, "soft", { meant: patch, ...(opaque ? {} : { clip }) }));
    if (opaque) yield* inSteps("the room cut back round " + name + ": its shape is what is left", rowsIn(S, clipOf(outline, margin), Math.max(3, short * 0.011), before, "filbert", { clipOut: [outline], meant: before }));
    // Its depth: the side of the slab the eye sees.
    const sides = E.map.visible.filter((f) => f.name === "side" && Math.abs(areaOf(f.screen)) > 2);
    if (sides.length) yield* inSteps(name + "'s side", sides.flatMap((f) => fillPlane(S, f, E.base, E)));
    // The patch turned into a form: bands from its edge in.
    const K = clamp(Math.round(size / (short * 0.022) * (1 - 0.5 * far)), 5, 12), order = Array.from({ length: K }, (_, j) => j);
    if (!opaque) order.reverse();
    for (const j of order) {
      const sIn = (j + 0.5) / K, k = 1 - 0.92 * sIn, tilt = 0.92 * (1 - sIn) ** 1.6, width = size * 0.92 / K * 1.15 + 2;
      const ring = outline.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]), out = [];
      const colourAt = (x, y) => {
        const ox = x - cx, oy = y - cy, l = Math.hypot(ox, oy) || 1, way = unit(add(times(across, ox / l), [0, -oy / l, 0]));
        return shade(S, E.base, unit(add(times(Nf, 1 - tilt), times(way, tilt))), Z, { at, self: E, shine: 0.25 });
      };
      for (let i = 0; i < ring.length; i += 4) {
        const chunk = Array.from({ length: Math.min(6, ring.length + 1 - i) }, (_, m) => ring[(i + m) % ring.length]);
        if (chunk.length < 2) continue;
        const mid = chunk[Math.floor(chunk.length / 2)];
        out.push(stroke(S, chunk, width, colourAt(mid[0], mid[1]), j === 0 ? "soft" : "filbert", { clip, meant: colourAt }));
      }
      yield { label: name + ", its band " + (j + 1) + " of " + K + " from the edge in", strokes: out };
    }
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  // Where the eye's ray through a point of the picture meets a sphere (or, missing it, the nearest of its rim).
  function sphereAt(S, E, x, y) {
    const { o, d } = rayOf(S.cam, x, y), u = unit(d), oc = sub(E.middle, o), b = dot(u, oc), q = b * b - (dot(oc, oc) - E.radius ** 2);
    if (q >= 0) return add(o, times(u, b - Math.sqrt(q)));
    return add(E.middle, times(unit(sub(add(o, times(u, b)), E.middle)), E.radius));
  }
  // A sphere's bands: the point of it `t` round from the light (0 the nearest to it) and `a` round the way to the light.
  function bandFrame(S, E) {
    const L = S.light.L, u = unit(Math.abs(L[1]) > 0.9 ? cross(L, [1, 0, 0]) : cross(L, [0, 1, 0])), v = cross(L, u);
    return (t, a) => add(E.middle, times(add(times(L, Math.cos(t)), add(times(u, Math.cos(a) * Math.sin(t)), times(v, Math.sin(a) * Math.sin(t)))), E.radius));
  }
  /* The seen part of the band `t` round from the light, in runs along it
   * (only of the points `keep` keeps, where it is given - each run carried
   * a point on past either end, for the clip to cut it to the exact edge). */
  function bandRuns(S, E, at, t, keep = null, n = 56, given = null) {
    const pts = [];
    for (let k = 0; k < n; k++) {
      const g = given?.[k], a = g ? g.a : k / n * Math.PI * 2, p = g ? g.p : at(t, a), q = g ? g.q : project(S.cam, p), seen = g ? g.seen : facingOf(S.cam, sub(p, E.middle), p) > 0;
      pts.push({ p, q, a, seen, in: seen && (!keep || keep(q, p)) });
    }
    if (pts.every((x) => x.in)) return [[...pts, pts[0]]];
    // (Begun just after a point that is out, so no run is cut by the band's own start.)
    const from = pts.findIndex((x) => !x.in), runs = [];
    let run = [];
    for (let i = 1; i <= n; i++) {
      const x = pts[(from + i) % n];
      if (x.in) {
        if (!run.length && keep) { const before = pts[(from + i - 1) % n]; if (before.seen) run.push(before); }
        run.push(x);
      } else if (run.length) { if (keep && x.seen) run.push(x); runs.push(run); run = []; }
    }
    if (run.length) runs.push(run);
    return runs;
  }
  // A band's strokes: along each run of it, a few points at a time, each in the light where it lies.
  function bandStrokes(S, runs, width, colourOf, tip, extra) {
    const out = [];
    for (const run of runs) {
      if (run.length === 1) { out.push(stroke(S, [run[0].q, [run[0].q[0] + 0.6, run[0].q[1] + 0.4]], width, colourOf(run[0].p, run[0].q), tip, extra)); continue; }
      for (let i = 0; i < run.length - 1; i += 4) {
        const chunk = run.slice(i, Math.min(run.length, i + 6)), mid = chunk[Math.floor(chunk.length / 2)];
        out.push(stroke(S, chunk.map((x) => x.q), width, colourOf(mid.p, mid.q), tip, extra));
      }
    }
    return out;
  }
  // A sphere's bands, a step each: in paint from the shadowed side to the light; in a medium that cannot go lighter, the other way.
  function* bandSteps(S, E, N, extra, again) {
    // (A dome's bands only where it is: over its flat face.)
    const keep = E.kind === "dome" ? (q, p) => p[1] >= E.low - 1e-6 : null;
    const at = bandFrame(S, E), step = Math.PI / N, width = scaleAt(S.cam, E.middle) * E.radius * step * 1.75;
    const order = Array.from({ length: N }, (_, k) => (k + 0.5) * step);
    if (!S.rules.darkenOnly) order.reverse();
    const colourOf = (p) => shade(S, E.base, unit(sub(p, E.middle)), p[2], { shine: 0.55, at: p, self: E });
    let first = true;
    for (const t of order) {
      const runs = bandRuns(S, E, at, t, keep);
      if (!runs.length) continue;
      // On dry: each band left to dry before the next goes over its edge.
      if (!first && E.app?.wet === "on dry") S.paint.clock += S.M.wet;
      first = false;
      const edge = t < step * 1.5 || t > Math.PI - step * 1.5;
      yield { label: E.name + ", its band " + Math.round(t / Math.PI * 180) + "\u00b0 from the light" + again, strokes: bandStrokes(S, runs, width, colourOf, edge ? "soft" : "filbert", extra) };
    }
  }
  /* A shadow thrown on a curved solid, laid along the solid's own curves -
   * on a sphere along its bands round the light, on a cylinder or a cone
   * along its rulings - so it travels round the form as its shading does. */
  function roundShadow(S, B, shot, darkAt, extra) {
    const { cam } = S, inside = (q, p) => inPoly(shot, q[0], q[1]) && (B.kind !== "dome" || p[1] >= B.low - 1e-6), out = [];
    if (isBall(B)) {
      const N = B.bands || 8, at = bandFrame(S, B), step = Math.PI / N, width = scaleAt(cam, B.middle) * B.radius * step * 1.75;
      // (Its bands' points found once for the eye as it is - every shadow on it laid along the same ones.)
      if (B.bandPoints?.cam !== cam || B.bandPoints.middle !== B.middle || B.bandPoints.N !== N) {
        B.bandPoints = { cam, middle: B.middle, N, bands: Array.from({ length: N }, (_, k) => Array.from({ length: 112 }, (_, i) => {
          const a = i / 112 * Math.PI * 2, p = at((k + 0.5) * step, a);
          return { a, p, q: project(cam, p), seen: facingOf(cam, sub(p, B.middle), p) > 0 };
        })) };
      }
      const box = boxOf([shot]), near = (q, p) => q[0] >= box.x0 - 1 && q[0] <= box.x1 + 1 && q[1] >= box.y0 - 1 && q[1] <= box.y1 + 1 && inside(q, p);
      for (let k = 0; k < N; k++) {
        const band = B.bandPoints.bands[k];
        if (!band.some((x) => x.seen && near(x.q, x.p))) continue;
        out.push(...bandStrokes(S, bandRuns(S, B, at, (k + 0.5) * step, near, 112, band), width, (p, q) => darkAt(q[0], q[1]), "soft", extra));
      }
      return out;
    }
    // A cylinder's or a cone's rulings: from its foot up (to its point, on a cone), where each is seen.
    const [mx, , mz] = B.placed.middle, r = B.radius, lo = B.low, hi = B.high, N = 40, cone = B.kind === "cone";
    const width = Math.max(2, 2 * Math.PI * r / N * scaleAt(cam, B.placed.middle) * 1.6);
    for (let k = 0; k < N; k++) {
      const t = (k + 0.5) / N * Math.PI * 2, foot = [mx + r * Math.cos(t), lo, mz + r * Math.sin(t)], top = cone ? [mx, hi, mz] : [foot[0], hi, foot[2]];
      if (facingOf(cam, cone ? [Math.cos(t) * (hi - lo), r, Math.sin(t) * (hi - lo)] : [Math.cos(t), 0, Math.sin(t)], foot) <= 0) continue;
      let run = [];
      const flush = () => { if (run.length > 1) { const mid = run[Math.floor(run.length / 2)]; out.push(stroke(S, run, width, darkAt(mid[0], mid[1]), "soft", extra)); } run = []; };
      for (let i = 0; i <= 12; i++) { const p = mix(foot, top, i / 12 * (cone ? 0.95 : 1)), q = project(cam, p); if (inside(q, p)) run.push(q); else flush(); }
      flush();
    }
    return out;
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
    // (Far back the drawing goes thinner and quieter, toward the solid's own colour: Depth.)
    const far = farOf(S, E), own = shade(S, E.base, [0, 0, -1], E.placed.middle[2]);
    const lineColour = paint(mix(light ? mix(S.bare, [70, 72, 84], 0.32) : mix(own, [30, 30, 40], 0.45), own, 0.6 * far));
    const lineW = S.lineW * (light ? 0.6 : 1) * (1 - 0.45 * far);
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
      // (Round its holes, a letter's counters, the same way.)
      for (const ring of face.holes || []) for (let s = 0; s < ring.length; s++) {
        const a = ring[s], b = ring[(s + 1) % ring.length];
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
      if (far < 0.55) yield* glazes(S, E, face.screen, name + "'s " + plane, fill);
      // (Its carving, once the plane is laid: Carving.)
      if (E.carve && far < 0.7) yield* inSteps("carving " + name + "'s " + plane + " (" + E.carve.faces[map.faces.indexOf(face)]?.type + ", " + E.carve.way + ")", carveSteps(S, E, face, map.faces.indexOf(face)));
      done.push(face);
    }
    if (E.form?.soft && far < 0.6) yield* softEdges(S, E);
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  /* ── Carving ──────────────────────────────────────────────────────────
   * No face need be plain. Every face of a solid is decided when the solid
   * is made - seen or not, so a turn shows what was always on its far side
   * (Turning). A face may be:
   *   panel   set in: a smaller face sunk into it, its walls each in the
   *           light it turns to, its floor in the rim's shadow where the
   *           light comes over the rim - an indent turned from the eye, dark
   *   boss    raised: a smaller face stood out of it, lighter as it comes
   *           toward the eye, its shadow thrown on the face round it
   *   stud    a low point raised in its middle: the face cut into as many
   *           planes as it has edges, each its own value
   *   groove  a V cut across it: one plane to the light, one away
   *   dimple  a round hollow
   * and each solid's carvings are toned one way (`way`):
   *   ramp     each plane lighter toward the light
   *   crevice  darker where planes meet, deep in the indent
   *   swell    lighter where it comes toward the eye
   *   fold     no gradient at all: the carving one flat shape split in two -
   *            the half to the light lighter, the half away darker (on a
   *            hollow the other way round) - one plane that says two sides */
  const CARVINGS = ["panel", "boss", "stud", "groove", "dimple"], CARVE_WAYS = ["ramp", "crevice", "swell", "fold"];
  // A face's outward way: square to it, away from the solid's middle.
  function faceNormal(solid, f) {
    const w = f.idx.map((i) => solid.verts[i]), c = times(w.reduce(add, [0, 0, 0]), 1 / w.length);
    const n = unit(cross(sub(w[1], w[0]), sub(w[2], w[1])));
    return dot(n, sub(c, solid.middle)) < 0 ? times(n, -1) : n;
  }
  // A solid's carvings, face by face (what it stands on left plain: never seen), one theme and now and then something else.
  function carvingsFor(S, P) {
    const rng = S.rng, solid = P.placed, faces = {}, theme = CARVINGS[Math.floor(rng() * CARVINGS.length)], odd = CARVINGS[Math.floor(rng() * CARVINGS.length)];
    solid.faces.forEach((f, i) => {
      if (faceNormal(solid, f)[1] < -0.9 || rng() < 0.18) return;
      faces[i] = { type: rng() < 0.3 ? odd : theme, k: 0.5 + rng() * 0.22, depth: 0.05 + rng() * 0.06, turn: Math.floor(rng() * 4) };
    });
    return Object.keys(faces).length ? { faces, way: CARVE_WAYS[Math.floor(rng() * CARVE_WAYS.length)] } : null;
  }
  // A carving in the room: the planes it is made of, each with its way out.
  function carving(face, spec) {
    const w = face.world, N = face.normal, n = w.length, c = times(w.reduce(add, [0, 0, 0]), 1 / n);
    const reach = w.reduce((t, q) => t + Math.hypot(...sub(q, c)), 0) / n, u = unit(sub(w[1], w[0])), v = cross(N, u);
    const inner = (k, lift = 0) => w.map((q) => add(add(c, times(sub(q, c), k)), times(N, lift)));
    const d = spec.depth * 1.6 * reach, k = spec.k;
    // (A quad's way out, turned toward - or from - a point.)
    const plane = (poly, toward, from = false) => {
      let nn = unit(cross(sub(poly[1], poly[0]), sub(poly[poly.length - 1], poly[0])));
      const mid = times(poly.reduce(add, [0, 0, 0]), 1 / poly.length);
      if ((dot(nn, sub(toward, mid)) < 0) !== from) nn = times(nn, -1);
      return { poly, normal: nn };
    };
    const base = { c, N, u, v, reach, depth: d };
    if (spec.type === "panel" || spec.type === "dimple") {
      const m = 14, ring = spec.type === "dimple"
        ? Array.from({ length: m }, (_, i) => add(c, add(times(u, Math.cos(i / m * 2 * Math.PI) * reach * k * 0.62), times(v, Math.sin(i / m * 2 * Math.PI) * reach * k * 0.62))))
        : inner(k);
      const floor = ring.map((q) => add(add(c, times(sub(q, c), spec.type === "dimple" ? 0.5 : 0.92)), times(N, -d))), inside = add(c, times(N, -d * 0.5));
      return { ...base, kind: "in", foot: ring, opening: ring, floor, walls: ring.map((q, i) => plane([q, ring[(i + 1) % ring.length], floor[(i + 1) % ring.length], floor[i]], inside)) };
    }
    if (spec.type === "boss") {
      const foot = inner(k), top = inner(k * 0.84, d), core = add(c, times(N, d * 0.5));
      return { ...base, kind: "out", foot, top, planes: foot.map((q, i) => plane([q, foot[(i + 1) % n], top[(i + 1) % n], top[i]], core, true)) };
    }
    if (spec.type === "stud") {
      const foot = inner(k), apex = add(c, times(N, d * 1.6));
      return { ...base, kind: "out", foot, apex, depth: d * 1.6, planes: foot.map((q, i) => plane([q, foot[(i + 1) % n], apex], add(c, times(N, -1)), true)) };
    }
    // (A groove: along one of the face's ways - an edge's, or a diagonal.)
    const along = unit([u, v, add(u, v), sub(u, v)][spec.turn % 4]), side = cross(N, along), half = reach * k, hw = reach * 0.07;
    const a0 = sub(c, times(along, half)), a1 = add(c, times(along, half)), b0 = add(a0, times(N, -d)), b1 = add(a1, times(N, -d));
    const w1 = [add(a0, times(side, hw)), add(a1, times(side, hw)), b1, b0], w2 = [add(a1, times(side, -hw)), add(a0, times(side, -hw)), b0, b1];
    return { ...base, kind: "in", foot: [w1[0], w1[1], w2[0], w2[1]], opening: [w1[0], w1[1], w2[0], w2[1]], floor: null, walls: [plane(w1, add(c, times(N, -d * 0.3))), plane(w2, add(c, times(N, -d * 0.3)))] };
  }
  /* A face's carving painted, once the face is: through the opening of a
   * hollow its floor (in the rim's shadow where the light comes over the
   * rim) and its far walls; round a raised one its shadow on the face, then
   * its sides and its top - each plane in the light it turns to, toned as
   * the solid's way says. */
  function carveSteps(S, E, face, index) {
    const spec = E.carve?.faces?.[index];
    if (!spec || !face.visible) return [];
    const { cam } = S, short = Math.min(cam.W, cam.H), area = Math.abs(areaOf(face.screen));
    if (area < (short * 0.045) ** 2) return [];
    const geo = carving(face, spec), way = E.carve.way, L = S.light.L, N = geo.N, c = geo.c;
    const band = Math.max(2.5, short * 0.007), screen = (poly) => poly.map((q) => project(cam, q)), faceClip = clipOf(face.screen, 0.3);
    const centreOf = (poly) => times(poly.reduce(add, [0, 0, 0]), 1 / poly.length);
    const seen = (q) => facingOf(cam, q.normal, centreOf(q.poly)) > 0;
    const lit = (n, q, direct = 1) => shade(S, E.base, n, q[2], { at: q, self: E, direct });
    const scale = (col, k) => col.map((x) => x * k);
    // (The light along the face: which way across it is toward the light.)
    const lp = sub(L, times(N, dot(L, N))), toLight = Math.hypot(...lp) > 0.05 ? unit(lp) : geo.v;
    const across = (q) => clamp(dot(sub(q, c), toLight) / geo.reach, -1, 1);
    const fill = (poly, colourAt, clip = faceClip) => rowsIn(S, screen(poly), band, colourAt, "flat", { clip, meant: colourAt });
    const out = [];
    if (way === "fold") {
      // One flat shape, split across the light: two values, no gradient.
      const flat = (q) => [dot(sub(q, c), geo.u), dot(sub(q, c), geo.v)], back = ([a, b]) => add(c, add(times(geo.u, a), times(geo.v, b)));
      const t2 = [dot(toLight, geo.u), dot(toLight, geo.v)], big = geo.reach * 4, perp = [-t2[1], t2[0]];
      const half = (sgn) => [[perp[0] * big, perp[1] * big], [perp[0] * big + t2[0] * big * sgn, perp[1] * big + t2[1] * big * sgn], [-perp[0] * big + t2[0] * big * sgn, -perp[1] * big + t2[1] * big * sgn], [-perp[0] * big, -perp[1] * big]];
      const own = lit(N, c), light = mix(own, S.light.colour, 0.2), dark = scale(own, 0.7), hollow = geo.kind === "in";
      for (const sgn of [1, -1]) {
        const part = clipConvex(geo.foot.map(flat), half(sgn));
        if (part.length < 3) continue;
        const col = (sgn > 0) !== hollow ? light : dark, at = () => col;
        out.push(...fill(part.map(back), at));
      }
      return out;
    }
    const toned = (col, q, t) => (way === "ramp" ? scale(col, 1 + 0.12 * across(q)) : way === "crevice" ? scale(col, 1 - 0.22 * t) : scale(col, 1 + 0.1 * (1 - t)));
    if (geo.kind === "in") {
      const clip = clipOf(screen(geo.opening), 0.3), nl = dot(L, N);
      const flat = (q) => [dot(sub(q, c), geo.u), dot(sub(q, c), geo.v)], opening2 = geo.opening.map(flat);
      // (The rim's shadow on the floor: a point is in it where its way up to the light leaves by a wall, not the opening.)
      const inShadow = (q) => nl <= 0.05 || !inPoly(opening2, ...flat(add(q, times(L, geo.depth / nl))));
      if (geo.floor) {
        const edgeOf = (q) => { const [a, b] = flat(q); return Math.min(...opening2.map(([x, y], i) => { const [x2, y2] = opening2[(i + 1) % opening2.length]; const dx = x2 - x, dy = y2 - y, l2 = dx * dx + dy * dy || 1, t = clamp(((a - x) * dx + (b - y) * dy) / l2, 0, 1); return Math.hypot(a - x - dx * t, b - y - dy * t); })) / geo.reach; };
        const at = (x, y) => { const q = onPlane(cam, x, y, N, geo.floor[0]) || geo.floor[0]; return toned(scale(lit(N, q, inShadow(q) ? 0 : 1), 0.86), q, 1 - clamp(edgeOf(q) / 0.35, 0, 1)); };
        out.push(...fill(geo.floor, at, clip));
      }
      for (const wall of geo.walls.filter(seen)) {
        const at = (x, y) => { const q = onPlane(cam, x, y, wall.normal, wall.poly[0]) || wall.poly[0]; return toned(scale(lit(wall.normal, q), 0.9), q, clamp(-dot(sub(q, c), N) / (geo.depth || 1), 0, 1)); };
        out.push(...fill(wall.poly, at, clip));
      }
      return out;
    }
    // Raised: its shadow on the face first, then its planes seen, its top last - lighter, nearer the eye.
    const nl = dot(L, N);
    if (nl > 0.05) {
      const flat = (q) => [dot(sub(q, c), geo.u), dot(sub(q, c), geo.v)], back = ([a, b]) => add(c, add(times(geo.u, a), times(geo.v, b)));
      const raised = geo.top || [geo.apex], thrown = raised.map((q) => sub(q, times(L, dot(sub(q, c), N) / nl)));
      const shadow = hull2(geo.foot.concat(thrown).map(flat)).map(back), at = (x, y) => { const q = onPlane(cam, x, y, N, c) || c; return lit(N, q, 0); };
      out.push(...fill(shadow, at));
    }
    for (const pl of geo.planes.filter(seen)) {
      const at = (x, y) => { const q = onPlane(cam, x, y, pl.normal, pl.poly[0]) || pl.poly[0]; return toned(lit(pl.normal, q), q, 1 - clamp(dot(sub(q, c), N) / (geo.depth || 1), 0, 1)); };
      out.push(...fill(pl.poly, at));
    }
    if (geo.top) {
      const at = (x, y) => { const q = onPlane(cam, x, y, N, geo.top[0]) || geo.top[0]; return toned(mix(lit(N, q), S.light.colour, 0.08), q, clamp(Math.hypot(...sub(q, add(c, times(N, geo.depth)))) / geo.reach, 0, 1)); };
      out.push(...fill(geo.top, at));
    }
    return out;
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
      const width = Math.max(3, scaleAt(cam, mid) * E.size * soft);
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
    const rings = [flat, ...(face.holeWorld || []).map((h) => h.map((p) => [dot(sub(p, c), u), dot(sub(p, c), v)]))];
    const v0 = Math.min(...vs), v1 = Math.max(...vs), back = (a, b) => add(c, add(times(u, a), times(v, b)));
    const deep = Math.hypot(...sub(project(cam, back(0, v0)), project(cam, back(0, v1)))), brush = Math.max(5, Math.min(cam.W, cam.H) * 0.034);
    const rows = Math.max(2, Math.round(deep / (brush * 0.8))), band = (v1 - v0) / rows, clip = face.holeScreens || face.concave ? face.screen : clipOf(face.screen);
    const meantAt = (x, y) => {
      const p = onPlane(cam, x, y, n, c) || c;
      return shade(S, base, n, p[2], { at: p, self: E });
    };
    const out = [];
    // (Each row's runs inside it: where it crosses the face's edges, and its holes', taken in pairs.)
    const holes = (face.holeScreens || []).length ? { clipOut: face.holeScreens } : {};
    for (let r = 0; r < rows; r++) {
      const vv = v0 + (r + 0.5) * band, cuts = [];
      for (const ring of rings) for (let i = 0; i < ring.length; i++) {
        const [pu, pv] = ring[i], [qu, qv] = ring[(i + 1) % ring.length];
        if ((pv - vv) * (qv - vv) > 0 || pv === qv) continue;
        cuts.push(pu + (qu - pu) * (vv - pv) / (qv - pv));
      }
      cuts.sort((x, y) => x - y);
      for (let k = 0; k + 1 < cuts.length; k += 2) {
        const a = cuts[k], b = cuts[k + 1];
        if (!(b > a)) continue;
        const pa = back(a - band * 0.2, vv), pb = back(b + band * 0.2, vv), m = back((a + b) / 2, vv);
        const width = Math.hypot(...sub(project(cam, back(0, vv - band * 0.75)), project(cam, back(0, vv + band * 0.75))));
        out.push({ z: m[2], s: stroke(S, [project(cam, pa), project(cam, m), project(cam, pb)], Math.max(3, width), meantAt(...project(cam, m)), "flat", { alpha: 0.97, clip, meant: meantAt, ...holes }) });
      }
    }
    return out.sort((p, q) => q.z - p.z).map((x) => x.s);
  }
  /* A cylinder, built like the sphere from what is farthest of it in to
   * what faces the eye: its side in upright strokes from where it turns
   * away, on either hand, in to the front, each in the light it turns to;
   * then its top, if the eye is over it, as a plane. */
  function* cylinderSteps(S, E) {
    const { cam } = S, [mx, , mz] = E.placed.middle, r = E.radius, lo = E.low, hi = E.high, eye = [0, cam.eye, 0], far = farOf(S, E), clip = clipOf(E.outline, 0.6);
    const N = Math.max(14, Math.round(44 * (1 - DEPTH.detail * far) * clamp(scaleAt(cam, E.placed.middle) * r / (Math.min(cam.W, cam.H) * 0.08), 0.5, 1)));
    const sides = () => {
      const side = [];
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N * 2 * Math.PI, n = [Math.cos(t), 0, Math.sin(t)], p = [mx + r * n[0], (lo + hi) / 2, mz + r * n[2]];
        if (facingOf(cam, n, p) <= 0) continue;
        const a = project(cam, [p[0], lo, p[2]]), b = project(cam, [p[0], hi, p[2]]), q = [mx + r * Math.cos(t + 2 * Math.PI / N), lo, mz + r * Math.sin(t + 2 * Math.PI / N)];
        const width = Math.hypot(...sub(project(cam, q), a)) * 1.7 + 2;
        const meant = () => shade(S, E.base, n, p[2], { at: p, self: E, shine: 0.3 });
        side.push({ far: Math.hypot(...sub(p, eye)), s: stroke(S, [a, off(S, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 1), b], width, meant(), "flat", { meant, clip }) });
      }
      return side.sort((p, q) => q.far - p.far).map((x) => x.s);
    };
    yield* inSteps(theOf(E) + "'s side", sides());
    if (far < 0.55) yield* glazes(S, E, E.outline, E.name + "'s side", sides);
    const top = E.map.faces.find((f) => f.name === "top" && f.visible);
    if (top) yield* inSteps(theOf(E) + "'s top", fillPolygon(S, top, E.base, E));
    if (E.app?.handling === "blended") yield* softenSteps(S, E);
  }
  /* A cone: in strokes up its slope from the rim toward the point, far to
   * near round it, each in the light its slope turns to; the point last. */
  function* coneSteps(S, E) {
    const { cam } = S, [mx, , mz] = E.placed.middle, r = E.radius, lo = E.low, hi = E.high, eye = [0, cam.eye, 0], far = farOf(S, E), clip = clipOf(E.outline, 0.6);
    const N = Math.max(14, Math.round(40 * (1 - DEPTH.detail * far) * clamp(scaleAt(cam, E.placed.middle) * r / (Math.min(cam.W, cam.H) * 0.08), 0.5, 1)));
    const h = hi - lo, apex = [mx, hi, mz];
    const slopes = () => {
      const side = [];
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N * 2 * Math.PI, n = unit([Math.cos(t) * h, r, Math.sin(t) * h]), base = [mx + r * Math.cos(t), lo, mz + r * Math.sin(t)];
        const p = mix(base, apex, 0.35);
        if (facingOf(cam, n, p) <= 0) continue;
        const a = project(cam, base), b = project(cam, mix(base, apex, 0.88)), q = [mx + r * Math.cos(t + 2 * Math.PI / N), lo, mz + r * Math.sin(t + 2 * Math.PI / N)];
        const width = Math.hypot(...sub(project(cam, q), a)) * 1.8 + 2;
        const meant = () => shade(S, E.base, n, p[2], { at: p, self: E, shine: 0.3 });
        side.push({ far: Math.hypot(...sub(p, eye)), s: stroke(S, [a, project(cam, mix(base, apex, 0.45)), b], width, meant(), "round", { meant, clip }) });
      }
      return side.sort((p, q) => q.far - p.far).map((x) => x.s);
    };
    yield* inSteps(theOf(E) + "'s slope", slopes());
    if (far < 0.55) yield* glazes(S, E, E.outline, E.name + "'s slope", slopes);
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
    const c0 = face.centre;
    const meant = (x, y) => { const p = onPlane(cam, x, y, n, c0) || c0; return shade(S, base, n, p[2], { at: p, self: E }); };
    /* Rows across the plane, ordered far to near by where each lies, laid
     * inside its edges (each stroke clipped to the plane's shape, a hair
     * outside it so two planes meet without a gap) - so the lines its corners
     * were drawn with still show round it. */
    const clip = clipOf(w.map((q) => project(cam, q)));
    const span = (p, q) => Math.hypot(...sub(project(cam, p), project(cam, q)));
    const deep = span(at(0.5, 0), at(0.5, 1)), brush = Math.max(5, Math.min(cam.W, cam.H) * 0.034) * (1 + 1.6 * DEPTH.detail * (E ? farOf(S, E) : 0));
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
  /* Far back, a solid's edge is lost (Depth): a soft brush drawn along its
   * outline carries a little of each side into the other - the farther, the
   * broader and the more. Near, it stays as sharp as it was painted. */
  function* edgeSteps(S, P) {
    const far = farOf(S, P);
    // (A plant's parts are thin already: far back it loses them by fewer marks, not by a soft edge on each.)
    if (far < DEPTH.from || P.kind === "plant") return;
    const k = (far - DEPTH.from) / (1 - DEPTH.from), w = S.lineW * (1.2 + 3.4 * DEPTH.edge * far), out = [];
    // (Along the outline in runs a brush's length long: a curve's many little edges taken together; a thing of many parts, part by part.)
    const run = Math.max(w * 2.5, S.cam.W * 0.04);
    for (const o of (P.parts || [P]).map((q) => q.outline)) {
      let from = o[0], length = 0, path = [o[0]];
      for (let i = 1; i <= o.length; i++) {
        const q = o[i % o.length], prev = path[path.length - 1];
        length += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
        path.push(q);
        if (length >= run || i === o.length) {
          if (length > 2) out.push(stroke(S, path.length > 3 ? [from, path[Math.floor(path.length / 2)], q] : path.slice(), w, [0, 0, 0], "soft", { soften: +clamp(0.3 + 0.8 * k, 0.3, 1).toFixed(2) }));
          from = q; length = 0; path = [q];
        }
      }
    }
    yield* inSteps("losing the edge of " + theOf(P) + ", far back", out);
  }
  /* Blended: a clean brush - or the stump - drawn back through what was
   * just laid, across a sphere's bands or along a plane's rows, so its
   * marks run into each other. */
  function* softenSteps(S, E) {
    const out = [];
    if (isBall(E)) {
      // (Across the bands, where one meets the next: the brush drawn from the lighter into the darker - over a dome's flat face only.)
      const N = E.bands || 8, at = bandFrame(S, E), step = Math.PI / N, w = scaleAt(S.cam, E.middle) * E.radius * step, keep = E.kind === "dome" ? (q, p) => p[1] >= E.low : null;
      for (let k = 1; k < N; k++) {
        for (const run of bandRuns(S, E, at, k * step, keep, 28)) {
          for (let i = 0; i < run.length; i += 2) {
            const a = run[i].a + (S.rng() - 0.5) * 0.05;
            out.push(stroke(S, [project(S.cam, at(k * step - step * 0.6, a)), project(S.cam, at(k * step + step * 0.6, a))], w * 1.3, [0, 0, 0], "soft", { soften: true, clip: clipOf(E.outline, 0.6) }));
          }
        }
      }
    } else if (E.kind === "blob") {
      // (A form: across its bands, from its middle out, all the way round.)
      const o = E.outline, cx = o.reduce((t, q) => t + q[0], 0) / o.length, cy = o.reduce((t, q) => t + q[1], 0) / o.length, clip = clipOf(o, 0.5);
      for (let i = 0; i < o.length; i += 2) {
        for (const k of [0.35, 0.6, 0.85]) {
          const [x, y] = o[i], a = [cx + (x - cx) * (k - 0.12), cy + (y - cy) * (k - 0.12)], b = [cx + (x - cx) * (k + 0.12), cy + (y - cy) * (k + 0.12)];
          out.push(stroke(S, [a, b], Math.max(3, Math.hypot(x - cx, y - cy) * 0.18), [0, 0, 0], "soft", { soften: true, clip }));
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
    if (kind === "blob" && !form.outline) form.outline = formOutline(S.rng);
    const P = { id: S.nextId++, kind, form, name: nameFor(kind, form), size, yaw, host, how, alive: true, shot: {} };
    if (kind === "sphere") {
      P.radius = size; P.middle = [foot[0], foot[1] + size, foot[2]];
      P.low = foot[1]; P.high = foot[1] + 2 * size; P.planes = 0;
      P.foot = oval(foot[0], foot[2], size, size, 16);
    } else {
      const shape = shapeOf(kind, size, form);
      P.placed = place(shape, yaw, [foot[0], foot[1] - shape.low, foot[2]]);
      // (A cylinder or a cone: its frame of many sides is for where it stands, what it hides and the shadow it throws; it is painted round.)
      P.round = ROUND.has(kind);
      if (P.round) P.radius = size / 2 * ((form.stretch || [1])[0]);
      // (A dome: its middle the centre of the sphere it is half of; all the way round it, what it was made with - Turning.)
      if (kind === "dome") { P.radius = size; P.middle = P.placed.middle; P.features = domeFeatures(S); }
      P.low = foot[1]; P.high = foot[1] + shape.high - shape.low;
      P.foot = hull2(P.placed.verts.map((v) => [v[0], v[2]]));
      // (Each face carved or not, decided now - the far ones too: Carving.)
      if (!P.round && size >= 0.45 && pick(S.rng, [{ c: 1, feats: ["carved faces"] }, { c: 0, feats: ["plain faces"] }]).c) P.carve = carvingsFor(S, P);
    }
    return frame(S, P);
  }
  /* A solid as the eye sees it, from where it stands in the room: its
   * planes and corners in the picture, its outline and what it covers
   * there, the ground it throws its shadow on - found again whenever the
   * eye moves. */
  function frame(S, P) {
    const { cam } = S, host = P.host;
    if (P.kind === "sphere") {
      const [cx, cy] = project(cam, P.middle), r = scaleAt(cam, P.middle) * P.radius;
      P.outline = oval(cx, cy, r, r, 28);
      P.top = null;
    } else if (P.placed && !P.parts) {
      P.map = premap(cam, P.placed);
      // (A dome round; a form by its own outline - front or back, whichever the eye faces - not its hull: Form.)
      const flat = P.kind === "blob" && P.map.faces.filter((f) => f.concave).sort((a, b) => b.facing - a.facing)[0];
      P.outline = P.kind === "dome" ? domeOutline(S, P) : flat && flat.facing > 0.05 ? flat.screen : hull2(P.map.pts);
      P.top = P.map.faces.find((f) => f.level && f.normal[1] > 0.99 && Math.abs(f.centre[1] - P.high) < 1e-6) || null;
      P.planes = P.map.planes;
      /* Against the seed, as the seed's planes were against the horizon:
       * each level plane of a solid built on is under the seed's top (seen
       * more open than it), level with it (the seed's top carried on, seen
       * just as it is) or over it (seen less, and not at all once it is
       * over the eye - its lines still run to the horizon). */
      if (S.seed && host) for (const f of P.map.faces) if (f.level) f.seed = Math.abs(f.centre[1] - S.seed.high) < 0.02 ? "level" : f.centre[1] < S.seed.high ? "below" : "above";
    } else if (P.parts) {
      // (Part by part, and the whole as one outline round all of them.)
      for (const q of P.parts) {
        if (q.kind === "sphere") { const [cx, cy] = project(cam, q.middle), r = scaleAt(cam, q.middle) * q.radius; q.outline = oval(cx, cy, r, r, 20); }
        else if (q.kind === "rod") { q.outline = hull2(q.placed.verts.map((v) => project(cam, v))); q.map = null; }
        else if (q.kind === "blade") {
          // (A leaf or a petal is one plane, seen from whichever side faces the eye.)
          const pts = q.world.map((v) => project(cam, v)), centre = q.placed.middle, facing = facingOf(cam, q.normal, centre);
          const face = { name: q.name, idx: q.world.map((_, i) => i), world: hull3(q.world, q.normal), centre, normal: facing >= 0 ? q.normal : times(q.normal, -1), facing: Math.abs(facing), level: false, visible: true, depth: centre[2], screen: pts };
          q.outline = pts.length > 2 ? pts : hull2(pts);
          q.under = facing < 0;
          q.map = { pts, faces: [face], visible: [face], edges: [], planes: 1 };
        } else { q.map = premap(cam, q.placed); q.outline = hull2(q.map.pts); }
        q.box = boxOf([q.outline]);
      }
      P.outline = hull2(P.parts.flatMap((q) => q.outline));
      if (P.glyph) P.glyph.map = premap(cam, P.glyph.placed);
      const faces = P.parts.flatMap((q) => q.map?.faces || []);
      P.map = { faces, visible: faces.filter((f) => f.visible), pts: [], edges: [], planes: 0 };
      P.top = null;
      P.planes = 0;
    }
    P.box = boxOf([P.outline]);
    // What it covers in the picture, its drawing with it.
    P.cover = clipOf(P.outline, S.lineW * 0.7 + 1.2);
    P.coverBox = boxOf([P.cover]);
    // (Set on another, it stands on that one's top; set beside one, on the floor.)
    P.ground = host && P.how === "on" ? { h: host.high, get base() { return host.base; }, clip: host.top?.visible ? clipOf(host.top.screen, 0.5) : null } : S.floor;
    P.shot = {};
    P.guides = [];
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
    // (A thing of many parts: the nearest of the parts whose place in the picture the point is in.)
    if (P.parts) { let t = Infinity; for (const q of P.parts) if (q.box && x >= q.box.x0 - 1 && x <= q.box.x1 + 1 && y >= q.box.y0 - 1 && y <= q.box.y1 + 1) t = Math.min(t, rayHit(S, q, x, y)); return t; }
    const ray = rayOf(S.cam, x, y), o = ray.o, d = unit(ray.d);
    if (P.kind === "rod") {
      // (A stem: where the ray passes nearest its line, if that is within its thickness.)
      const u = unit(sub(P.b, P.a)), w0 = sub(o, P.a), b = dot(d, u), dd = dot(d, w0), e = dot(u, w0), den = 1 - b * b;
      if (den < 1e-9) return Infinity;
      const t = (b * e - dd) / den, sl = clamp((e - b * dd) / den, 0, Math.hypot(...sub(P.b, P.a)));
      const miss = Math.hypot(...sub(add(o, times(d, t)), add(P.a, times(u, sl))));
      return t > 0 && miss <= P.r * 1.5 ? t : Infinity;
    }
    if (P.kind === "blade") {
      const f = P.map.faces[0], den = dot(f.normal, d);
      if (Math.abs(den) < 1e-9) return Infinity;
      const t = dot(f.normal, sub(f.centre, o)) / den;
      return t > 0 && inPoly(P.outline, x, y) ? t : Infinity;
    }
    if (P.kind === "sphere") {
      const oc = sub(P.middle, o), b = dot(d, oc), q = b * b - (dot(oc, oc) - P.radius * P.radius);
      return q < 0 || b - Math.sqrt(q) <= 0 ? Infinity : b - Math.sqrt(q);
    }
    if (P.placed?.wound) {
      // (Not convex: the nearest face the ray passes through.)
      let best = Infinity;
      for (const f of P.map.faces) {
        const den = dot(f.normal, d);
        if (Math.abs(den) < 1e-9) continue;
        const t = dot(f.normal, sub(f.centre, o)) / den;
        if (t <= 0 || t >= best) continue;
        const hit = add(o, times(d, t)), u = unit(sub(f.world[1], f.world[0])), v = cross(f.normal, u), flat = (q) => [dot(sub(q, f.centre), u), dot(sub(q, f.centre), v)];
        if (inPoly(f.world.map(flat), ...flat(hit))) best = t;
      }
      return best;
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
    // (What was asked for may stand more hidden, hide more and come nearer the edge than what it chooses itself: Asking.)
    const { cam } = S, loose = Boolean(S.relaxed), m = loose ? 0.012 : BUILD.margin, b = P.box;
    const zs = P.kind === "sphere" ? [P.middle[2] - P.radius, P.middle[2] + P.radius] : P.placed.verts.map((v) => v[2]);
    if (Math.min(...zs) < BUILD.near || Math.max(...zs) > ROOM.wall - BUILD.back) return false;
    if (b.x0 < cam.W * m || b.x1 > cam.W * (1 - m) || b.y0 < cam.H * m || b.y1 > cam.H * ROOM.foot || b.x1 - b.x0 < cam.W * 0.04) return false;
    if (P.map && !P.round && P.kind !== "blob" && P.map.planes > 3) return false;
    const standing = alive(S);
    if (standing.some((Q) => collide(P, Q))) return false;
    const near = standing.filter((Q) => boxesMeet(P.coverBox, Q.coverBox));
    if (hiddenBy(P, near.filter((Q) => inFront(S, Q, P)).map((Q) => Q.cover)) > (loose ? 0.8 : BUILD.hidden)) return false;
    if (near.some((Q) => inFront(S, P, Q) && hiddenBy(Q, [P.cover]) > (loose ? 0.95 : BUILD.covers))) return false;
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
    if (S.square === null && !P.round && P.kind !== "sphere" && P.kind !== "blob" && !P.parts) S.square = P.yaw - edgeTurn(P.kind, P.form);
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
    const size = want.size || (isBall({ kind }) ? inner * (0.5 + S.rng() * 0.4)
      : inner * 2 * k / (kind === "cube" ? Math.SQRT2 : ROUND.has(kind) ? 1 : 1.16) / spread);
    if (kind === "blob" && !form.outline) form.outline = formOutline(S.rng);
    const yaw = kind === "blob" ? (S.cam.flat ? 0 : Math.atan2(mx, mz)) : squareYaw(S, kind, form), a = S.rng() * Math.PI * 2, d = S.rng() * inner * 0.3;
    const P = makePiece(S, kind, size, [mx + Math.cos(a) * d, host.high, mz + Math.sin(a) * d], yaw, host, "on", form);
    P.away = [0, 1, 0];
    const stands = kind === "sphere" ? inPoly(top, P.middle[0], P.middle[2]) : P.foot.every(([x, z]) => inPoly(top, x, z));
    return stands ? P : null;
  }
  // Something tried by the looser rules what was asked for may stand by (Asking).
  function loosely(S, f) { S.relaxed = true; try { return f(); } finally { S.relaxed = false; } }
  /* A solid standing free on the floor, touching nothing: near `near`, the
   * way asked (in front toward the eye, behind, to the left or right), or
   * anywhere in view - asked for where nothing else would take it. */
  function placeFree(S, kind, near = null, rel = null) {
    const way = { front: [0, -1], behind: [0, 1], left: [-1, 0], right: [1, 0] }[rel], base = near && (near.low > 0.01 && near.host ? near.host : near);
    const size = kind === "sphere" ? 0.32 : kind === "dome" ? 0.42 : kind === "cube" ? 0.7 : 0.75, form = kind === "blob" ? { outline: formOutline(S.rng) } : {};
    for (let t = 0; t < 40; t++) {
      let x, z;
      if (base && t < 24) {
        const m = base.middle || base.placed.middle, reach = Math.max(...base.foot.map(([fx, fz]) => Math.hypot(fx - m[0], fz - m[2]))), d = reach + size * 0.9 + 0.1 + S.rng() * 0.6;
        const a = way ? Math.atan2(way[1], way[0]) + (S.rng() - 0.5) * 0.8 : S.rng() * Math.PI * 2;
        x = m[0] + Math.cos(a) * d; z = m[2] + Math.sin(a) * d;
      } else {
        const p = onLevel(S.cam, S.cam.W * (0.15 + S.rng() * 0.7), S.cam.horizon + (S.cam.H * ROOM.foot - S.cam.horizon) * (0.25 + S.rng() * 0.7));
        if (!p) continue;
        x = p[0]; z = p[2];
      }
      const P = makePiece(S, kind, size, [x, 0, z], kind === "blob" ? (S.cam.flat ? 0 : Math.atan2(x, z)) : squareYaw(S, kind, form), null, null, form);
      P.base = pieceColour(S, null, P);
      if (fits(S, P)) return P;
    }
    return null;
  }
  // A solid set on the crown of a round one - a sphere's top, a dome's - small, balanced where it touches it: asked for, never chosen.
  function placeOnCrown(S, host, kind) {
    const m = host.middle, form = kind === "blob" ? { outline: formOutline(S.rng) } : {};
    const size = isBall({ kind }) ? host.radius * 0.4 : host.radius * (kind === "cube" ? 0.7 : 0.8);
    const P = makePiece(S, kind, size, [m[0], host.high, m[2]], kind === "blob" ? Math.atan2(m[0], m[2]) : squareYaw(S, kind, form), host, "on", form);
    P.away = [0, 1, 0];
    return P;
  }
  /* A solid set against another's side on the floor: square to the seed,
   * moved in along one of the seed's own edges - slid a little along the
   * side it meets - until the two touch. */
  function placeBeside(S, host, kind, want = {}) {
    const form = want.form || {};
    if (kind === "blob" && !form.outline) form.outline = formOutline(S.rng);
    const size = want.size || (kind === "sphere" ? 0.3 + S.rng() * 0.25 : kind === "dome" ? 0.4 + S.rng() * 0.25 : kind === "cube" ? [1, 0.8, 0.6][Math.floor(S.rng() * 3)] : kind === "tetrahedron" ? 0.9 + S.rng() * 0.4
      : kind === "pyramid" ? 0.8 + S.rng() * 0.3 : kind === "cylinder" ? 0.6 + S.rng() * 0.3 : kind === "cone" ? 0.7 + S.rng() * 0.3 : 0.75 + S.rng() * 0.3);
    // (A form faces the eye, not the seed's square: Form.)
    const at = host.kind === "sphere" ? host.middle : host.placed.middle, yaw = kind === "blob" ? (S.cam.flat ? 0 : Math.atan2(at[0], at[2])) : squareYaw(S, kind, form);
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
    const standing = alive(S).filter((P) => !P.parts);
    for (let t = 0; t < BUILD.tries && standing.length; t++) {
      const host = standing[Math.floor(S.rng() * standing.length)];
      const mode = how || (host.top && S.rng() < 0.45 ? "on" : "beside");
      if (mode === "on" ? !host.top : host.low > 0.01) continue;
      const k = kind || pickKind(S);
      const P = mode === "on" ? placeOn(S, host, k) : placeBeside(S, host, k);
      if (!P) continue;
      P.base = pieceColour(S, null, P);
      if (fits(S, P)) return P;
    }
    return null;
  }
  /* How well a new solid goes with the composition's way of growing: a
   * small push - what it has learned still chooses (Composition). */
  function composed(S, P) {
    const C = S.composition;
    if (!C || !P.box || !S.seed) return 0;
    const W = S.cam.W, x = (P.box.x0 + P.box.x1) / 2 / W, away = C.x < 0.5 ? 1 : -1, seed = S.seed, sm = seed.middle || seed.placed.middle, m = P.middle || P.placed.middle;
    const big = P.high - P.low >= 0.7 * (seed.high - seed.low);
    // (Whatever the scheme, nothing crowds the picture's edge.)
    if (Math.min(P.box.x0, W - P.box.x1) < W * 0.08) return -0.12;
    if (C.grow === "up") return P.how === "on" ? 0.07 : -0.2 * Math.abs(x - 0.5);
    if (C.grow === "far") return (x - C.x) * away > 0.12 ? (big ? -0.02 : 0.07) : big ? 0.04 : -0.03;
    if (C.grow === "back") return m[2] - sm[2] > 0.3 && (x - C.x) * away > 0 ? 0.07 : -0.03;
    if (C.grow === "across") return P.how !== "on" && Math.abs(m[2] - sm[2]) < 0.5 ? 0.06 : -0.04;
    // (Balanced: the whole structure's mass kept over its point.)
    const all = alive(S).filter((Q) => Q.box).concat([P]), area = (Q) => (Q.box.x1 - Q.box.x0) * (Q.box.y1 - Q.box.y0);
    const mass = all.reduce((t, Q) => t + area(Q) * (Q.box.x0 + Q.box.x1) / 2, 0) / ((all.reduce((t, Q) => t + area(Q), 0) * W) || 1);
    return 0.06 - 0.4 * Math.abs(mass - C.x);
  }
  /* A new solid's colour, by its part in the key (Colour): most often the
   * dominant - a tint, tone or shade of it - sometimes the support, and once
   * or twice in a painting the accent, on something small; or again one of
   * the few colours it has used already. */
  function pieceColour(S, not = null, P = null, role = null) {
    const K = S.palette, rng = S.rng, known = S.colours.filter((c) => !not || apart(c, not) > 30);
    if (!role && known.length >= 2 && rng() < 0.55) return known[Math.floor(rng() * known.length)].slice();
    if (!role) {
      const small = !P || !S.seed || P.high - P.low < 0.75 * (S.seed.high - S.seed.low);
      role = small && (S.accents || 0) < 2 && S.pieces.length >= 2 && rng() < 0.16 ? "accent" : K.relation !== "monochrome" && rng() < 0.32 ? "support" : "dominant";
    }
    if (role === "accent") S.accents = (S.accents || 0) + 1;
    const [sd, ss, sa] = K.sat, [l0, l1] = K.light, hue = role === "accent" ? K.accent : role === "support" ? K.support : K.hue;
    const sat = (role === "accent" ? sa : role === "support" ? ss : sd) * (0.7 + rng() * 0.45);
    return hsl((hue + (rng() - 0.5) * (role === "accent" ? 8 : 16) + 360) % 360, sat, l0 + rng() * (l1 - l0));
  }
  // How the paint is handled for a form: each freedom the medium leaves, chosen (by the ledger, where there is one).
  function chooseApp(S, P) {
    const form = P.kind === "room" ? "broad" : P.kind === "sphere" ? "round" : "flat", app = { form };
    for (const [key, options] of Object.entries(freedomsOf(S.M))) app[key] = S.choose("application · " + S.medium, key + " · " + form, options);
    // (A solid seen through is painted in thinner paint, whatever the handling: Mutation.)
    if ((P.form?.opacity ?? 1) < 0.95) app.opacity = P.form.opacity;
    return app;
  }
  // What the structure is, in words.
  function nameOf(S) {
    const all = alive(S), standing = all.filter((P) => !P.parts), word = S.word && all.some((P) => P.kind === "letter") ? "the word \u201c" + S.word.text + "\u201d" : null;
    if (!word && standing.length === 2 && standing[1].host === standing[0] && standing[1].how === "on") return standing[1].name + " on " + standing[0].name;
    const count = new Map();
    for (const P of standing) count.set(P.name, (count.get(P.name) || 0) + 1);
    const numbers = ["", "a", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const parts = [...count].map(([name, n]) => (n === 1 ? name : (numbers[n] || n) + " " + plural(name)));
    // (Things of many parts by their own names: a word, a plant.)
    if (word) parts.push(word);
    for (const P of all) if (P.parts && P.kind !== "letter") parts.push(P.name);
    return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0] || "an empty room";
  }
  // Lifted (twice, if once is not enough) where a solid is meant lighter than what is there now: what cannot cover has to take back off first.
  function* liftFor(S, P, front, label) {
    if (!S.rules.darkenOnly) return;
    for (let pass = 0; pass < 2; pass++) {
      yield look(label);
      // (A thing of many parts is lifted part by part, each on its own, where it is meant lighter than what is under it - not the space between them.)
      const where = P.parts ? P.parts.filter((q) => q.size > 0.04 && needsLift(S, q)).map((q) => clipOf(q.outline, 0.6))
        : needsLift(S, P) ? [P.round || P.kind === "sphere" ? clipOf(P.outline, 0.6) : P.cover] : [];
      if (!where.length) return;
      // (A curved solid - a sphere, a cylinder, a cone - has no drawn edge to cover the rim of a lift: it is lifted just where it will be painted.)
      for (const one of where) yield* laid(S, liftSteps(S, [one], label + (pass ? ", again" : "")), { within: [one], box: boxOf([one]), out: front });
    }
  }
  // Whether a solid is meant lighter than what is now where it will go (a transparent medium has to lift that first).
  function needsLift(S, P) {
    sync(S);
    if (!P.box) return false;
    const faces = P.kind === "sphere" || P.kind === "rod" ? null : P.map?.visible || [];
    if (faces && !faces.length) return false;
    const lightest = !faces ? shade(S, P.base, S.light.L, (P.middle || P.placed.middle)[2]) : faces.map((f) => shade(S, P.base, f.normal, f.depth)).reduce((a, b) => (lum(a) > lum(b) ? a : b));
    const cells = cellsOf(S.paint, { points: [[P.box.x0, (P.box.y0 + P.box.y1) / 2], [P.box.x1, (P.box.y0 + P.box.y1) / 2]], width: P.box.y1 - P.box.y0, clip: P.outline });
    if (!cells.length) return false;
    const under = cells.reduce((t, k) => t + lum([S.paint.colour[k * 3], S.paint.colour[k * 3 + 1], S.paint.colour[k * 3 + 2]]), 0) / cells.length;
    return under < lum(S.rules.value ? valueOf(lightest) : lightest) - 12;
  }
  const pieceSteps = (S, P) => (S.cam.flat ? flatSteps(S, P) : P.kind === "letter" ? letterSteps(S, P) : P.kind === "plant" ? plantSteps(S, P) : P.kind === "sphere" ? sphereSteps(S, P) : P.kind === "dome" ? domeSteps(S, P) : P.kind === "blob" ? formSteps(S, P) : P.kind === "cylinder" ? cylinderSteps(S, P) : P.kind === "cone" ? coneSteps(S, P) : facetedSteps(S, P));
  /* A solid to the flat eye: its outline on the one plane, drawn in as few
   * straight lines as say it (a curve as one round line) - each the
   * shortest way from one corner to the next - and filled in its own colour,
   * one colour, no light across it. What stands in front is painted over
   * what is behind, and that is all the depth there is. */
  function* flatSteps(S, P) {
    // (A letter built as a solid: its own outline - and its counters' - on the one plane: Type.)
    if (P.glyph) { yield* flatGlyph(S, P); return; }
    const name = theOf(P), own = P.base, parts = P.parts || [P], w = S.lineW;
    const lineColour = S.rules.lines === "light" ? paint(mix(S.bare, [70, 72, 84], 0.32)) : paint(mix(own, [30, 30, 40], 0.55));
    const lines = [];
    let count = 0;
    for (const q of parts) {
      // (A plant's small parts - its leaves and petals - are shapes of colour, not drawn round.)
      if (P.kind === "plant" && q.size < 0.12) continue;
      const o = isBall(q) ? q.outline : fewest(q.outline);
      if (isBall(q)) { lines.push(stroke(S, [...o, o[0], o[1]], w, lineColour, "round", { line: true })); count++; continue; }
      for (let i = 0; i < o.length; i++) lines.push(stroke(S, [off(S, o[i], w * 0.4), off(S, o[(i + 1) % o.length], w * 0.4)], w, lineColour, "round", { line: true }));
      count += o.length;
    }
    yield* inSteps(name + ", flat: " + (count === 1 ? "one round line" : count + " lines"), lines);
    // (Each part in its own colour - a petal's, a leaf's - one colour each.)
    const band = Math.max(3, Math.min(S.cam.W, S.cam.H) * (P.kind === "plant" ? 0.012 : 0.03));
    const fill = () => parts.flatMap((q) => { const at = () => q.base || own; return rowsIn(S, q.outline, band, at, "flat", { clip: clipOf(q.outline, 0.6), meant: at }); });
    yield* inSteps(name + ", in one colour", fill());
    yield* glazes(S, P, P.outline, name, fill);
  }
  // A letter to the flat eye: round its outline and its holes in as few lines as say them, filled in its one colour, its holes left.
  function* flatGlyph(S, P) {
    const name = theOf(P), front = P.glyph.map.faces.filter((f) => f.name === "front"), w = S.lineW;
    const lineColour = S.rules.lines === "light" ? paint(mix(S.bare, [70, 72, 84], 0.32)) : paint(mix(P.base, [30, 30, 40], 0.55)), lines = [];
    for (const f of front) for (const ring of [f.screen, ...(f.holeScreens || [])]) {
      const o = fewest(ring);
      for (let i = 0; i < o.length; i++) lines.push(stroke(S, [off(S, o[i], w * 0.4), off(S, o[(i + 1) % o.length], w * 0.4)], w, lineColour, "round", { line: true }));
    }
    yield* inSteps(name + ", flat: " + lines.length + " lines", lines);
    const band = Math.max(3, Math.min(S.cam.W, S.cam.H) * 0.012), at = () => P.base;
    const fill = () => front.flatMap((f) => rowsIn(S, f.screen, band, at, "flat", { clip: f.screen, clipOut: f.holeScreens || [], meant: at }));
    yield* inSteps(name + ", in one colour", fill());
    yield* glazes(S, P, P.outline, name, fill);
  }
  // A shape in as few straight lines as say it: corners where it turns, none where it runs on straight.
  function fewest(poly) {
    let out = poly.slice();
    for (let changed = true; changed && out.length > 3;) {
      changed = false;
      for (let i = 0; i < out.length && out.length > 3; i++) {
        const a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i + 1) % out.length];
        const turn = Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) / ((Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1])) || 1);
        if (turn < 0.12) { out.splice(i, 1); changed = true; }
      }
    }
    return out;
  }

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
    S.action = P.kind === "plant" ? "growing " + P.name + (P.host ? " in " + theOf(P.host) : "") + ": " + P.rules.whys[P.rules.whys.length - 1] : P.host ? "adding " + P.name + " " + P.how + " " + theOf(P.host) : P.kind === "letter" ? "lettering \u201c" + (S.word?.text || P.char) + "\u201d in " + S.word?.face.name + " letters" : "setting up " + P.name;
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
    yield* laid(S, edgeSteps(S, P), { out: front });
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
  function* reworkPiece(S, P, recolour = false, colour = null) {
    // (A medium that cannot cover restates a solid in its own colour, deeper; it cannot put another over it.)
    const name = theOf(P), since = S.paint.clock;
    recolour = recolour && !S.rules.darkenOnly;
    S.action = (recolour ? "repainting " : "restating ") + name;
    S.notes.reworked++;
    if (recolour) {
      // (The colour asked for, where one was: Asking.)
      P.base = colour ? colour.slice() : pieceColour(S, P.base);
      if (!S.colours.some((c) => apart(c, P.base) < 4)) S.colours.push(P.base.slice());
    }
    P.app = chooseApp(S, P);
    S.lastApp = P.app;
    const front = outsFor(S, P);
    yield* liftFor(S, P, front, "lifting " + name);
    yield* laid(S, pieceSteps(S, P), { out: front, app: P.app });
    yield* laid(S, edgeSteps(S, P), { out: front });
    for (const Q of alive(S)) {
      if (Q.host === P && Q.how === "on" && Q.ground.clip) yield* laid(S, shadowSteps(S, Q, Q.ground, "the shadow of " + theOf(Q) + " on it"), { out: outsFor(S, P).filter((c) => c !== Q.cover) });
      if (Q !== P) yield* laid(S, castSteps(S, Q, P), { out: front });
    }
    yield* lookAgain(S, since, name, P);
  }
  /* ── Things of many parts (Type, Plants) ──────────────────────────────
   * A letter (or a plant) is one thing in the structure - one place, one
   * colour, one turn at being painted - made of parts, each a solid of its
   * own: a bar (a box stretched along a stroke), a ball, an upright stem.
   * Where it stands, hides and is hidden it is taken as one, its outline
   * round all of its parts; where light falls on it, where it throws a
   * shadow and where the eye's ray meets it, part by part. */
  function compound(S, kind, name, parts, base, extra = {}) {
    const verts = parts.flatMap((q) => (q.kind === "sphere" ? [-1, 1].flatMap((sg) => [add(q.middle, [sg * q.radius, 0, 0]), add(q.middle, [0, sg * q.radius, 0]), add(q.middle, [0, 0, sg * q.radius])]) : q.placed.verts));
    const ys = verts.map((v) => v[1]), middle = times(verts.reduce(add, [0, 0, 0]), 1 / verts.length);
    const P = Object.assign({ id: S.nextId++, kind, name, form: {}, size: Math.max(...ys) - Math.min(...ys), yaw: 0, host: null, how: null, alive: true, shot: {}, parts, base,
      placed: { verts, faces: [], middle }, middle, low: Math.max(0, Math.min(...ys)), high: Math.max(...ys), foot: hull2(verts.map((v) => [v[0], v[2]])) }, extra);
    // (A part's handling is its thing's, and so is its colour - unless it has its own: a leaf, a petal.)
    for (const q of parts) Object.defineProperties(q, { base: q.colour ? { value: q.colour } : { get: () => P.base }, app: { get: () => P.app }, owner: { value: P } });
    return frame(S, P);
  }
  // A bar: a box `len` along `e1`, `w` across it (along `e2`), `dep` deep (along `e3`), its middle at `centre`.
  function barPart(centre, e1, e2, e3, len, w, dep, name) {
    const box = cubeSolid(1), verts = box.verts.map(([x, y, z]) => add(centre, add(times(e1, x * len), add(times(e2, y * w), times(e3, z * dep)))));
    const ys = verts.map((v) => v[1]);
    return { kind: "bar", name, form: {}, placed: { verts, faces: box.faces, middle: centre }, low: Math.min(...ys), high: Math.max(...ys), size: Math.max(len, w) };
  }

  /* ── Type ─────────────────────────────────────────────────────────────
   * Letters out of the solids. A letter is drawn as strokes - point to
   * point, the shortest way, a corner here and there rounded - and each
   * stroke is built as a solid: a bar (a box stretched along it), or, where
   * it stands upright and the face says so, a cylinder; a stem that ends
   * free may stand on a slab foot, and a curve that ends free may end in a
   * ball. A rounded corner is cut across (a short bar from one stroke to the
   * next, as an octahedron's faces cut a cube's corners) or kept square.
   * Which of these a painting's typeface is made of comes from what those
   * solids - the platonic ones and their mutants - have done in its
   * paintings, and from what letters made of them have done.
   *   [x, y, round?] points, a cap high; a stroke ending where it began is closed */
  const GLYPHS = {
    A: [[[0, 0], [0.36, 1], [0.72, 0]], [[0.15, 0.38], [0.57, 0.38]]],
    B: [[[0, 0], [0, 1], [0.52, 1, 1], [0.52, 0.54, 1], [0, 0.54]], [[0, 0.54], [0.62, 0.54, 1], [0.62, 0, 1], [0, 0]]],
    C: [[[0.68, 1], [0, 1, 1], [0, 0, 1], [0.68, 0]]],
    D: [[[0, 0], [0, 1], [0.66, 1, 1], [0.66, 0, 1], [0, 0]]],
    E: [[[0.62, 1], [0, 1], [0, 0], [0.62, 0]], [[0, 0.52], [0.5, 0.52]]],
    F: [[[0.62, 1], [0, 1], [0, 0]], [[0, 0.52], [0.5, 0.52]]],
    G: [[[0.68, 1], [0, 1, 1], [0, 0, 1], [0.68, 0, 1], [0.68, 0.46], [0.36, 0.46]]],
    H: [[[0, 0], [0, 1]], [[0.68, 0], [0.68, 1]], [[0, 0.52], [0.68, 0.52]]],
    I: [[[0, 0], [0, 1]]],
    J: [[[0.56, 1], [0.56, 0, 1], [0, 0, 1], [0, 0.3]]],
    K: [[[0, 0], [0, 1]], [[0.64, 1], [0, 0.4]], [[0.2, 0.56], [0.68, 0]]],
    L: [[[0, 1], [0, 0], [0.58, 0]]],
    M: [[[0, 0], [0, 1], [0.42, 0.42], [0.84, 1], [0.84, 0]]],
    N: [[[0, 0], [0, 1], [0.7, 0], [0.7, 1]]],
    O: [[[0, 0, 1], [0, 1, 1], [0.72, 1, 1], [0.72, 0, 1], [0, 0, 1]]],
    P: [[[0, 0], [0, 1], [0.62, 1, 1], [0.62, 0.48, 1], [0, 0.48]]],
    Q: [[[0, 0, 1], [0, 1, 1], [0.72, 1, 1], [0.72, 0, 1], [0, 0, 1]], [[0.42, 0.26], [0.8, -0.08]]],
    R: [[[0, 0], [0, 1], [0.62, 1, 1], [0.62, 0.5, 1], [0, 0.5]], [[0.3, 0.5], [0.66, 0]]],
    S: [[[0.66, 1], [0, 1, 1], [0, 0.52, 1], [0.66, 0.52, 1], [0.66, 0, 1], [0, 0]]],
    T: [[[0, 1], [0.72, 1]], [[0.36, 1], [0.36, 0]]],
    U: [[[0, 1], [0, 0, 1], [0.68, 0, 1], [0.68, 1]]],
    V: [[[0, 1], [0.36, 0], [0.72, 1]]],
    W: [[[0, 1], [0.22, 0], [0.46, 0.62], [0.7, 0], [0.92, 1]]],
    X: [[[0, 1], [0.7, 0]], [[0, 0], [0.7, 1]]],
    Y: [[[0, 1], [0.36, 0.48], [0.72, 1]], [[0.36, 0.48], [0.36, 0]]],
    Z: [[[0, 1], [0.68, 1], [0, 0], [0.7, 0]]],
    0: [[[0, 0, 1], [0, 1, 1], [0.62, 1, 1], [0.62, 0, 1], [0, 0, 1]]],
    1: [[[0.04, 0.78], [0.28, 1], [0.28, 0]]],
    2: [[[0, 1], [0.62, 1, 1], [0.62, 0.56, 1], [0, 0], [0.64, 0]]],
    3: [[[0, 1], [0.62, 1, 1], [0.62, 0, 1], [0, 0]], [[0.16, 0.52], [0.62, 0.52]]],
    4: [[[0.48, 0], [0.48, 1], [0, 0.34], [0.68, 0.34]]],
    5: [[[0.64, 1], [0, 1], [0, 0.56], [0.64, 0.56, 1], [0.64, 0, 1], [0, 0]]],
    6: [[[0.6, 1], [0, 1, 1], [0, 0, 1], [0.64, 0, 1], [0.64, 0.54, 1], [0, 0.54]]],
    7: [[[0, 1], [0.64, 1], [0.2, 0]]],
    8: [[[0, 0, 1], [0, 1, 1], [0.62, 1, 1], [0.62, 0, 1], [0, 0, 1]], [[0, 0.52], [0.62, 0.52]]],
    9: [[[0.64, 0], [0.64, 1, 1], [0, 1, 1], [0, 0.46, 1], [0.64, 0.46]]],
  };
  const glyphWide = (ch) => (ch === " " ? 0.45 : Math.max(...GLYPHS[ch].flat().map((q) => q[0])));
  // A stroke's rounded corners cut across (`by`, a cap's share), or kept: closed strokes round their ends too.
  function cutCorners(stroke2, by) {
    const closed = stroke2.length > 2 && stroke2[0][0] === stroke2[stroke2.length - 1][0] && stroke2[0][1] === stroke2[stroke2.length - 1][1];
    const pts = closed ? stroke2.slice(0, -1) : stroke2, out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
      if (!by || !p[2] || (!closed && (i === 0 || i === pts.length - 1))) { out.push([p[0], p[1]]); continue; }
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]), c = Math.min(by, la * 0.4, lb * 0.4);
      out.push([p[0] + (a[0] - p[0]) * c / la, p[1] + (a[1] - p[1]) * c / la], [p[0] + (b[0] - p[0]) * c / lb, p[1] + (b[1] - p[1]) * c / lb]);
    }
    if (closed) out.push(out[0]);
    return out;
  }
  /* A painting's typeface: what its letters are built of, chosen by what
   * those solids have done (their best mutants) and what letters built of
   * them have done. */
  function faceOf(S) {
    const v = (f) => memory().values[f]?.[1] ?? 0, r = S.rng, better = (a, b, lean = 0.5) => (Math.abs(v(a) - v(b)) > 0.02 ? v(a) > v(b) : r() < lean);
    const face = {
      stems: opened("turn") && v("adding a cylinder") + v("letters of cylinders") > v("adding a tall box") + v("letters of boxes") + 0.02 ? "cylinder" : "box",
      serifs: better("letters on slab feet", "letters without feet", v("adding a slab") > 0.04 ? 0.7 : 0.25),
      cut: better("letters with cut corners", "letters with square corners", v("adding a tetrahedron") + v("adding an octahedron") >= 2 * v("adding a cube") ? 0.8 : 0.4),
      balls: better("letters ending in balls", "letters ending plain", v("adding a sphere") > 0.05 ? 0.7 : 0.2),
      bold: better("bold letters", "light letters", v("flattened") > v("stretched tall") ? 0.7 : 0.35),
      soft: opened("soften") && v("softened corners") > 0 ? 0.14 : 0,
      clear: opened("clear") && v("seen through") > 0.05 ? 0.7 : 1,
    };
    // (Now and then one thing about it tried the other way: the untried get their chance.)
    if (r() < 0.3) { const k = ["serifs", "cut", "balls", "bold"][Math.floor(r() * 4)]; face[k] = !face[k]; }
    face.weight = face.bold ? 0.2 : 0.14;
    face.depth = face.stems === "cylinder" ? face.weight : face.bold ? 0.45 : 0.3;
    face.feats = [face.stems === "cylinder" ? "letters of cylinders" : "letters of boxes", face.serifs ? "letters on slab feet" : "letters without feet",
      face.cut ? "letters with cut corners" : "letters with square corners", face.balls ? "letters ending in balls" : "letters ending plain", face.bold ? "bold letters" : "light letters"];
    face.name = [face.bold ? "bold" : "light", face.stems === "cylinder" ? "round-stemmed" : "square-stemmed", face.cut ? "cut-cornered" : "square-cornered", face.serifs ? "slab-footed" : "", face.balls ? "ball-ended" : ""].filter(Boolean).join(", ");
    return face;
  }
  /* A letter's parts in the room: `at` the left end of its baseline, `h` a
   * cap high, its row along `U`, its face toward `N` (toward the eye). */
  function letterParts(ch, face, h, at, U, N) {
    const V = [0, 1, 0], w = face.weight * h, dep = face.depth * h, parts = [];
    // (Its feet on the floor: the lowest bar's underside, not its middle, on the baseline.)
    const world = (x, y, z) => add(at, add(times(U, x * h), add(times(V, y * h + w / 2), times(N, z))));
    const strokes2 = GLYPHS[ch].map((st) => cutCorners(st, face.cut ? 0.2 : 0));
    const segs = strokes2.flatMap((pts) => pts.slice(1).map((q, i) => [pts[i], q]));
    const along = (p, [a, b]) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1);
      return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
    };
    // Ends that meet nothing else: where a foot or a ball may go.
    const free = (p, own) => !segs.some((sg) => !own.includes(sg) && along(p, sg) < face.weight * 0.6);
    for (const [p, q] of segs) {
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], upright = Math.abs(dx) < 1e-6;
      if (upright && face.stems === "cylinder") {
        const tall = len * h + w, shape = prismSolid(w / 2, tall, 14), centre = world(mid[0], mid[1], dep / 2);
        parts.push({ kind: "cylinder", round: true, name: "a stem", form: {}, radius: w / 2, placed: place(shape, 0, centre), low: centre[1] - tall / 2, high: centre[1] + tall / 2, size: tall });
      } else {
        const e1 = add(times(U, dx / len), times(V, dy / len)), e2 = add(times(U, -dy / len), times(V, dx / len));
        parts.push(barPart(world(mid[0], mid[1], dep / 2), e1, e2, N, len * h + w, w, dep, "a bar"));
      }
    }
    for (let i = 0; i < strokes2.length; i++) {
      const pts = strokes2[i], closed = pts.length > 2 && pts[0] === pts[pts.length - 1];
      if (closed) continue;
      const own = segs.filter(([a, b]) => pts.includes(a) && pts.includes(b)), curved = GLYPHS[ch][i].some((q) => q[2]);
      for (const end of [pts[0], pts[pts.length - 1]]) {
        if (!free(end, own)) continue;
        const next = end === pts[0] ? pts[1] : pts[pts.length - 2], upright = Math.abs(next[0] - end[0]) < 1e-6;
        // A slab foot under (or over) a stem that ends free at the baseline or the cap.
        if (face.serifs && upright && (end[1] < 0.01 || end[1] > 0.99)) parts.push(barPart(world(end[0], end[1], dep / 2), U, V, N, 0.36 * h, w * 0.75, dep, "a foot"));
        // A ball where a curve ends free.
        else if (face.balls && !upright && curved) {
          const middle = world(end[0], end[1], dep / 2), radius = w * 0.85;
          parts.push({ kind: "sphere", name: "a ball", form: {}, radius, middle, low: middle[1] - radius, high: middle[1] + radius, size: radius * 2 });
        }
      }
    }
    return parts;
  }
  /* A letter's outline, as one shape: its strokes - each a bar `weight`
   * wide, square at its ends - with its feet and balls, found from how far
   * each point of a fine grid lies from the nearest of them and traced
   * round where that is nothing (marching squares): its outside wound
   * anticlockwise, any holes (an O's, an A's) clockwise, in as few straight
   * lines as say it. In a cap's units: across, and up from the baseline. */
  const GLYPH_OUTLINES = new Map();
  function glyphOutline(ch, face) {
    const key = [ch, face.weight, face.cut, face.serifs, face.balls].join("|");
    if (!GLYPH_OUTLINES.has(key)) { if (GLYPH_OUTLINES.size > 400) GLYPH_OUTLINES.clear(); GLYPH_OUTLINES.set(key, traceGlyph(ch, face)); }
    return GLYPH_OUTLINES.get(key);
  }
  function traceGlyph(ch, face) {
    const w = face.weight, hw = w / 2, strokes2 = GLYPHS[ch].map((st) => cutCorners(st, face.cut ? 0.2 : 0)), fields = [];
    const box = (mx, my, ux, uy, hx, hy) => (x, y) => { const ax = (x - mx) * ux + (y - my) * uy, ay = -(x - mx) * uy + (y - my) * ux, qx = Math.abs(ax) - hx, qy = Math.abs(ay) - hy; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0); };
    const segs = strokes2.flatMap((pts) => pts.slice(1).map((q, i) => [pts[i], q]));
    for (const [p, q] of segs) {
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
      if (len > 1e-6) fields.push(box((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, dx / len, dy / len, len / 2 + hw, hw));
    }
    // (Its feet and its balls, where its strokes end free - as its parts are found.)
    const along = (pt, [a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = clamp(((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / l2, 0, 1); return Math.hypot(pt[0] - a[0] - dx * t, pt[1] - a[1] - dy * t); };
    strokes2.forEach((pts, i) => {
      if (pts.length > 2 && pts[0] === pts[pts.length - 1]) return;
      const own = segs.filter(([a, b]) => pts.includes(a) && pts.includes(b)), curved = GLYPHS[ch][i].some((q) => q[2]);
      for (const end of [pts[0], pts[pts.length - 1]]) {
        if (segs.some((sg) => !own.includes(sg) && along(end, sg) < w * 0.6)) continue;
        const next = end === pts[0] ? pts[1] : pts[pts.length - 2], upright = Math.abs(next[0] - end[0]) < 1e-6;
        if (face.serifs && upright && (end[1] < 0.01 || end[1] > 0.99)) fields.push(box(end[0], end[1], 1, 0, 0.18, w * 0.375));
        else if (face.balls && !upright && curved) fields.push((x, y) => Math.hypot(x - end[0], y - end[1]) - w * 0.85);
      }
    });
    const res = 0.022, x0 = -0.3, y0 = -0.4, nx = Math.ceil((glyphWide(ch) + 0.6) / res) + 1, ny = Math.ceil(1.8 / res) + 1, g = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * res, y = y0 + j * res; let d = Infinity; for (const f of fields) d = Math.min(d, f(x, y)); g[j * nx + i] = d; }
    // Marching squares: each cell's crossings, joined edge to edge into rings.
    const at = (i, j) => g[j * nx + i], crossing = (id) => {
      const [k, i, j] = id.split(","), a = +i, b = +j, va = at(a, b), vb = k === "h" ? at(a + 1, b) : at(a, b + 1), t = va / (va - vb);
      return k === "h" ? [x0 + (a + t) * res, y0 + b * res] : [x0 + a * res, y0 + (b + t) * res];
    };
    const links = new Map(), link = (a, b) => { (links.get(a) || links.set(a, []).get(a)).push(b); (links.get(b) || links.set(b, []).get(b)).push(a); };
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const c = (at(i, j) < 0 ? 1 : 0) | (at(i + 1, j) < 0 ? 2 : 0) | (at(i + 1, j + 1) < 0 ? 4 : 0) | (at(i, j + 1) < 0 ? 8 : 0);
      if (!c || c === 15) continue;
      const e = ["h," + i + "," + j, "v," + (i + 1) + "," + j, "h," + i + "," + (j + 1), "v," + i + "," + j], mid = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) / 4 < 0;
      const table = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: mid ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]],
        10: mid ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[3, 0]] };
      for (const [a, b] of table[c]) link(e[a], e[b]);
    }
    const rings = [], done = new Set();
    for (const start of links.keys()) {
      if (done.has(start)) continue;
      const ring = [];
      let prev = null, at0 = start;
      while (at0 && !done.has(at0)) { done.add(at0); ring.push(crossing(at0)); const next = links.get(at0).find((q) => q !== prev && !done.has(q)); prev = at0; at0 = next; }
      if (ring.length > 4) rings.push(simplify(ring, res * 0.45));
    }
    // (The outside anticlockwise, a hole - inside another ring - clockwise.)
    return rings.filter((r) => r.length >= 3).map((r) => {
      const hole = rings.some((o) => o !== r && inPoly(o, r[0][0], r[0][1])), ccw = areaOf(r) > 0;
      return { ring: hole === ccw ? r.slice().reverse() : r, hole };
    });
  }
  // A ring in as few points as keep it within `tol` (Douglas and Peucker's way, from its two farthest-apart points).
  function simplify(ring, tol) {
    const far = (a, b, pts) => { let best = -1, at = -1; const [ax, ay] = a, dx = b[0] - ax, dy = b[1] - ay, l = Math.hypot(dx, dy) || 1e-9; pts.forEach(([x, y], i) => { const d = Math.abs((x - ax) * dy - (y - ay) * dx) / l; if (d > best) { best = d; at = i; } }); return [best, at]; };
    const keep = (pts) => { if (pts.length < 3) return pts; const [d, i] = far(pts[0], pts[pts.length - 1], pts.slice(1, -1)); return d <= tol ? [pts[0], pts[pts.length - 1]] : keep(pts.slice(0, i + 2)).slice(0, -1).concat(keep(pts.slice(i + 1))); };
    let split = 0, best = 0;
    ring.forEach((q, i) => { const d = Math.hypot(q[0] - ring[0][0], q[1] - ring[0][1]); if (d > best) { best = d; split = i; } });
    const one = keep(ring.slice(0, split + 1)), two = keep(ring.slice(split).concat([ring[0]]));
    return one.slice(0, -1).concat(two.slice(0, -1));
  }
  /* A letter built as the solids are: its outline a face toward the eye,
   * the same behind it, and its sides between - one solid, wound so each
   * face's way out is its own, mapped and built point by point and plane by
   * plane as the cube is (facetedSteps). */
  function glyphSolid(ch, face, h, at, U, N) {
    const w = face.weight * h, dep = face.depth * h, V = [0, 1, 0], verts = [], faces = [];
    const world = (x, y, z) => add(at, add(times(U, x * h), add(times(V, y * h + w / 2), times(N, z))));
    const rings = glyphOutline(ch, face), fronts = [];
    for (const { ring, hole } of rings) {
      const base = verts.length, n = ring.length;
      for (const [x, y] of ring) verts.push(world(x, y, dep));
      for (const [x, y] of ring) verts.push(world(x, y, 0));
      fronts.push({ hole, ring, front: Array.from({ length: n }, (_, k) => base + n - 1 - k), back: Array.from({ length: n }, (_, k) => base + n + k) });
      for (let k = 0; k < n; k++) faces.push({ name: "side", idx: [base + k, base + (k + 1) % n, base + n + (k + 1) % n, base + n + k] });
    }
    // (Each outside ring a face toward the eye and one behind, with the holes inside it.)
    for (const o of fronts.filter((r) => !r.hole)) {
      const holes = fronts.filter((r) => r.hole && inPoly(o.ring, r.ring[0][0], r.ring[0][1]));
      faces.push({ name: "front", idx: o.front, holes: holes.map((r) => r.front), concave: true });
      faces.push({ name: "back", idx: o.back, holes: holes.map((r) => r.back), concave: true });
    }
    const middle = times(verts.reduce(add, [0, 0, 0]), 1 / Math.max(1, verts.length));
    return { verts, faces, middle, low: 0, high: Math.max(...verts.map((v) => v[1])), wound: true };
  }
  // The way a row of letters runs: along the seed's own square, the way nearest across the picture (so it shares the seed's vanishing points).
  function rowTurn(S) {
    if (S.square === null || S.cam.flat) return 0;
    let a = -S.square;
    while (a > Math.PI / 4) a -= Math.PI / 2;
    while (a <= -Math.PI / 4) a += Math.PI / 2;
    return a;
  }
  /* A word set out in letters on the floor, in front of what stands (or to
   * one side): each letter a thing of many parts, all one colour, the row
   * square to the seed, as big as fits - or nowhere, if nowhere fits. */
  // (Letters in one row at most.)
  const LETTERS_ROW = 12;
  function placeWord(S, text, face) {
    const chars = [...String(text).toUpperCase()].filter((c) => GLYPHS[c] || c === " ").slice(0, LETTERS_ROW);
    while (chars[0] === " ") chars.shift();
    while (chars[chars.length - 1] === " ") chars.pop();
    if (!chars.length) return null;
    const standing = alive(S).filter((P) => !P.parts), a = rowTurn(S), U = [Math.cos(a), 0, Math.sin(a)], N = [Math.sin(a), 0, -Math.cos(a)];
    const gap = 0.26, wide = chars.reduce((t, c) => t + glyphWide(c) + face.weight, 0) + gap * (chars.length - 1);
    const feet = standing.flatMap((P) => P.foot), xs = feet.map(([x]) => x), zs = feet.map(([, z]) => z);
    const front = zs.length ? Math.min(...zs) : BUILD.near + 2, behind = zs.length ? Math.max(...zs) : BUILD.near + 2;
    const mx = standing.length ? standing.reduce((t, P) => t + (P.middle || P.placed.middle)[0], 0) / standing.length : 0, mz = zs.length ? (front + behind) / 2 : front;
    const left = xs.length ? Math.min(...xs) : mx, right = xs.length ? Math.max(...xs) : mx;
    const base = pieceColour(S, null, null, S.palette.relation === "monochrome" ? "dominant" : "support"), h0 = clamp((S.seed?.high || 1) * 0.5, 0.3, 0.7);
    // (In front of what stands, if there is room between it and the eye; else to one side of it; else behind it.)
    const spots = (h) => [[mx, front - 0.3], [mx - 0.4 * wide * h, front - 0.3], [mx + 0.4 * wide * h, front - 0.3],
      [left - wide * h / 2 - 0.3, mz], [right + wide * h / 2 + 0.3, mz], [mx, behind + 0.35 + face.depth * h]];
    for (let shrink = 0; shrink < 4; shrink++) {
      const h = h0 * (1 - 0.2 * shrink), dep = face.depth * h, nearest = BUILD.near + 0.08 + dep + Math.abs(U[2]) * wide * h / 2;
      for (const [cx, z] of spots(h)) {
        const back = Math.max(z, nearest);
        const start = add([cx, 0, back], times(U, -wide * h / 2)), letters = [];
        let x = 0, ok = true;
        for (const c of chars) {
          if (c !== " ") {
            const at = add(start, times(U, x * h)), parts = letterParts(c, face, h, at, U, N);
            const L = compound(S, "letter", "the letter " + c, parts, base, { char: c, front: N, face, form: face.clear < 1 ? { opacity: face.clear } : {} });
            L.built = () => glyphSolid(c, face, h, at, U, N);
            if (!fitsLetter(S, L, letters)) { ok = false; break; }
            letters.push(L);
          }
          x += glyphWide(c) + face.weight + gap;
        }
        // (Built as solids only once they have somewhere to stand.)
        if (ok && letters.length) { for (const L of letters) { glyphOf(S, L, L.built()); delete L.built; } return letters; }
      }
    }
    return null;
  }
  // Whether a letter can stand where it was set: in the room and the picture, clear of the others, seen, hiding little.
  function fitsLetter(S, L, earlier) {
    const { cam } = S, m = BUILD.margin, b = L.box, zs = L.placed.verts.map((v) => v[2]);
    if (Math.min(...zs) < BUILD.near || Math.max(...zs) > ROOM.wall - BUILD.back) return false;
    if (b.x0 < cam.W * m || b.x1 > cam.W * (1 - m) || b.y0 < cam.H * m || b.y1 > cam.H * ROOM.foot) return false;
    const standing = alive(S);
    if (standing.some((Q) => collide(L, Q)) || earlier.some((Q) => collide(L, Q))) return false;
    const near = standing.filter((Q) => boxesMeet(L.coverBox, Q.coverBox));
    if (hiddenBy(L, near.filter((Q) => inFront(S, Q, L)).map((Q) => Q.cover)) > (S.relaxed ? 0.6 : 0.3)) return false;
    return !near.some((Q) => inFront(S, L, Q) && hiddenBy(Q, [L.cover]) > (S.relaxed ? 0.85 : 0.5));
  }
  /* A letter painted: first its drawing - every edge of its bars that is
   * seen - then its planes: the sides of its bars (the letter's depth) far
   * to near, its upright stems round, and its face toward the eye last, so
   * it reads as one; its balls last of all. */
  // A letter's built solid, standing in for it when it is painted: its colour, handling and look are the letter's.
  function glyphOf(S, L, solid) {
    if (!solid.faces.some((f) => f.name === "front")) return;
    const G = { id: L.id, kind: "glyph", name: L.name, form: L.form, placed: solid, host: null, guides: [], of: L };
    Object.defineProperties(G, { base: { get: () => L.base }, app: { get: () => L.app }, low: { get: () => L.low }, high: { get: () => L.high } });
    G.map = premap(S.cam, solid);
    L.glyph = G;
  }
  function* letterSteps(S, L) {
    // (Built as the cube is, point by point, plane by plane: Type.)
    if (L.glyph) { yield* facetedSteps(S, L.glyph); return; }
    const name = theOf(L), far = farOf(S, L), bars = L.parts.filter((q) => q.kind === "bar");
    const light = S.rules.lines === "light", own = shade(S, L.base, L.front, L.middle[2]);
    const lineColour = paint(mix(light ? mix(S.bare, [70, 72, 84], 0.32) : mix(own, [30, 30, 40], 0.45), own, 0.6 * far)), lineW = S.lineW * (light ? 0.6 : 0.85) * (1 - 0.45 * far);
    const lines = [];
    for (const q of bars) for (const e of q.map.edges) lines.push(stroke(S, [off(S, q.map.pts[e.a], lineW * 0.5), off(S, q.map.pts[e.b], lineW * 0.5)], lineW, lineColour, "round", { line: true }));
    yield* inSteps("drawing " + name, lines);
    const faces = bars.flatMap((q) => q.map.visible.map((f) => ({ q, f }))), toward = (f) => dot(f.normal, L.front) > 0.9;
    const sides = faces.filter((x) => !toward(x.f)).sort((p, q) => q.f.depth - p.f.depth), fronts = faces.filter((x) => toward(x.f));
    const fill = (list) => list.flatMap(({ f }) => fillPlane(S, f, L.base, L));
    yield* inSteps(name + "'s depth", fill(sides));
    for (const q of L.parts) if (q.kind === "cylinder") yield* cylinderSteps(S, q);
    yield* inSteps(name, fill(fronts));
    if (far < 0.55) yield* glazes(S, L, L.outline, name, () => fill(fronts));
    for (const q of L.parts) if (q.kind === "sphere") yield* sphereSteps(S, q);
  }
  // A word of its own when none was asked for: the name of what it began with, or of the place.
  // (The seed's own name, as a word short enough to letter: a tetrahedron is TETRA.)
  const seedWord = (S) => { const w = S.seed ? S.seed.name.split(" ").pop().toUpperCase() : "HEX"; return w.length <= 9 ? w : w.replace(/HEDRON$/, "").slice(0, 9); };
  const ownWord = (S) => (S.rng() < 0.6 && S.seed ? seedWord(S) : ["HEX", "FIELD", "HEXFIELD"][Math.floor(S.rng() * 3)]);
  // A word lettered: its letters, one after another, each with its shadow and a look.
  function* addWord(S, m) {
    S.word = { text: m.text, face: m.face, letters: m.letters };
    for (const L of m.letters) yield* addPiece(S, L);
    m.pieces = m.letters;
  }

  /* ── Plants ───────────────────────────────────────────────────────────
   * No picture of a plant to copy. What a plant is - where it stands among
   * plants - says how it grows, and how it grows gives its shape: each kind
   * below says only what is different from the kind it comes from, and why.
   * Grown, a plant is a thing of many parts - stems, leaves, petals, a
   * flower's middle - painted far to near by the same rules as the solids.
   *   habit   how it rises: one stem; a rosette of leaves on the ground and a
   *           stalk out of it; a clump of blades; a branching bush; fronds
   *   tall    how tall (a cube's edge is one); `stems`, how many from the ground;
   *           `thick`, its stem; `nodes`, its leaf joints
   *   apical  how far the leading shoot holds the others back (one tall stem,
   *           or a spreading bush)
   *   set     how its leaves go round the stem: a spiral at the golden angle,
   *           opposite pairs each a quarter turn on, or whorls - each leaf
   *           shading the ones under it as little as it can
   *   leaf    its shape, length, how far it tilts up to the light, its veins
   *           (parallel or a net), how it droops
   *   flower  where it comes (the top of the stem, or where the leaves join
   *           it), its parts and their shape, how open, its colour (for
   *           whoever carries its pollen), a head of many small flowers in the
   *           golden spiral (the daisies)
   *   seek    how far its stem bends toward the light; `nod`, how far a heavy
   *           head weighs it over */
  const PLANTS = {
    plant: { why: "a green thing that makes itself out of light", habit: "single", tall: 0.9, stems: 1, thick: 0.022, apical: 0.8, set: "spiral", nodes: 6,
      leaf: { shape: "broad", length: 0.22, tilt: 0.5, veins: "net", droop: 0.25 }, flower: null, seek: 0.25, nod: 0, green: [70, 120, 60] },
    grass: { from: "plant", why: "it grows from its base, so it can be grazed and grow again", habit: "clump", tall: 0.7, stems: 9,
      leaf: { shape: "blade", length: 0.62, tilt: 1.15, veins: "parallel", droop: 0.45 }, flower: { at: "top", head: "spike", colour: [196, 178, 112], size: 0.1 }, green: [92, 140, 70] },
    fern: { from: "plant", why: "it has no flowers: it spreads by spores under its fronds, and its fronds unroll from the middle", habit: "fronds", tall: 0.7, stems: 7,
      leaf: { shape: "pinna", length: 0.72, tilt: 0.95, droop: 0.65 }, green: [60, 118, 64] },
    flowering: { from: "plant", why: "it flowers, for whatever carries its pollen", flower: { at: "top", parts: 5, petal: "round", size: 0.18, open: 1.2, colour: [210, 90, 120], middle: [220, 190, 70] } },
    monocot: { from: "flowering", why: "one seed leaf: its leaves are blades with parallel veins, its flower parts in threes",
      leaf: { shape: "blade", veins: "parallel", length: 0.4, tilt: 0.9 }, flower: { parts: 6, petal: "pointed" } },
    lily: { from: "monocot", why: "its leaves climb the stem, and its flowers turn out and back to show the bees the way in", tall: 1.1, nodes: 9,
      leaf: { length: 0.22, tilt: 0.7 }, flower: { size: 0.22, open: 1.75, colour: [238, 140, 60], middle: [120, 60, 40] } },
    tulip: { from: "monocot", why: "a bulb's store sends one stalk up fast, its few broad leaves low, its flower a closed cup", habit: "rosette", tall: 0.55, nodes: 3,
      leaf: { shape: "broadblade", length: 0.34, tilt: 1.0 }, flower: { petal: "cup", size: 0.16, open: 0.32, colour: [214, 50, 60], middle: [60, 40, 30] } },
    eudicot: { from: "flowering", why: "two seed leaves: a net of veins, its flower parts in fours and fives", leaf: { veins: "net" } },
    poppy: { from: "eudicot", why: "on a bare stalk from a rosette it opens four thin petals wide, for the light and the bees", habit: "rosette", tall: 0.7, nodes: 3,
      leaf: { shape: "lobed", length: 0.26 }, flower: { parts: 4, petal: "round", size: 0.21, open: 1.35, colour: [222, 48, 40], middle: [40, 34, 40] }, nod: 0.15 },
    rose: { from: "eudicot", why: "a woody bush: its leading shoots give way, so it spreads, and flowers at every tip", habit: "branching", tall: 0.85, apical: 0.35, nodes: 7, thick: 0.026,
      leaf: { shape: "broad", length: 0.13, tilt: 0.45 }, flower: { parts: 10, petal: "round", size: 0.15, open: 0.9, colour: [206, 64, 96], middle: [230, 190, 90] }, green: [56, 98, 52] },
    mint: { from: "eudicot", why: "its square stem sets its leaves in opposite pairs, each pair a quarter turn on, and it flowers where they join", set: "opposite", tall: 0.6, nodes: 6,
      leaf: { shape: "broad", length: 0.12, tilt: 0.4 }, flower: { at: "joints", parts: 5, petal: "round", size: 0.06, open: 1.2, colour: [190, 160, 220], middle: [230, 220, 240] } },
    aster: { from: "eudicot", why: "each head is many small flowers: the middle ones packed in the golden spiral, the outer ones its rays", flower: { head: true, rays: 21, petal: "ray", open: 1.45 } },
    daisy: { from: "aster", why: "a small meadow plant: heads on thin stalks from a rosette, white rays round a yellow middle", habit: "rosette", tall: 0.45, stems: 3, nodes: 3,
      leaf: { shape: "broad", length: 0.12 }, flower: { size: 0.13, colour: [246, 244, 236], middle: [236, 190, 40], rays: 21 } },
    sunflower: { from: "aster", why: "one thick stem grown as tall as it can for the light, its great head turned to the sun", tall: 1.5, thick: 0.05, nodes: 8, apical: 1,
      leaf: { shape: "heart", length: 0.24, tilt: 0.35 }, flower: { size: 0.3, colour: [246, 196, 40], middle: [110, 66, 34], rays: 34 }, seek: 0.5, nod: 0.22 },
  };
  const GROWN = Object.keys(PLANTS).filter((k) => !["plant", "flowering", "monocot", "eudicot", "aster"].includes(k));
  // A plant's rules: the line of kinds it comes from, each one's way over the one before.
  function plantRules(kind) {
    const line = [];
    for (let k = kind; k; k = PLANTS[k].from) line.unshift(PLANTS[k]);
    const rules = { kind, whys: [] };
    for (const r of line) {
      for (const [key, v] of Object.entries(r)) {
        if (key === "from") continue;
        if (key === "why") rules.whys.push(v);
        else if (v && typeof v === "object" && !Array.isArray(v) && rules[key]) rules[key] = { ...rules[key], ...v };
        else rules[key] = v;
      }
    }
    return rules;
  }
  // A leaf or petal's width at each point along its middle (0 its foot, 1 its tip), against its length.
  const BLADES = {
    blade: (t) => 0.06 * (1 - t * t), broadblade: (t) => 0.2 * Math.sin(Math.PI * Math.min(1, t ** 0.8)), broad: (t) => 0.32 * Math.sin(Math.PI * t ** 0.85),
    heart: (t) => 0.42 * Math.sin(Math.PI * t) ** 0.6 + (t < 0.15 ? 0.1 * (1 - t / 0.15) : 0), lobed: (t) => 0.3 * Math.sin(Math.PI * t) * (0.7 + 0.35 * Math.abs(Math.sin(Math.PI * t * 3))),
    round: (t) => 0.48 * Math.sin(Math.PI * t ** 0.75) ** 0.7, pointed: (t) => 0.3 * Math.sin(Math.PI * t), cup: (t) => 0.42 * Math.sin(Math.PI * Math.min(1, t ** 0.65)) ** 0.8,
    ray: (t) => 0.09 * Math.sin(Math.PI * t) ** 0.5, pinna: (t) => 0.2 * Math.sin(Math.PI * t), spike: (t) => 0.16 * Math.sin(Math.PI * t) ** 0.7,
  };
  // The points of a plane round about, in order (by angle round its middle, in its own plane).
  function hull3(points, normal) {
    const c = times(points.reduce(add, [0, 0, 0]), 1 / points.length), u = unit(Math.abs(normal[1]) > 0.9 ? cross(normal, [1, 0, 0]) : cross(normal, [0, 1, 0])), v = cross(normal, u);
    return hull2(points.map((p) => [dot(sub(p, c), u), dot(sub(p, c), v)])).map(([a, b]) => add(c, add(times(u, a), times(v, b))));
  }
  // A leaf or a petal: `len` long from `foot` along `dir`, its sides along `side`, its middle curving down by `droop`.
  function bladePart(name, role, foot, dir, side, len, shape, colour, droop = 0, n = 7) {
    const width = BLADES[shape] || BLADES.broad, left = [], right = [], mid = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, along = add(foot, add(times(dir, t * len), [0, -droop * len * t * t, 0])), w = width(t) * len;
      mid.push(along);
      if (i < n) { left.push(add(along, times(side, w))); if (i) right.push(add(along, times(side, -w))); }
    }
    const world = [...left, mid[n], ...right.reverse()], ys = world.map((v) => v[1]);
    return { kind: "blade", role, name, colour: paint(colour), shape, world, mid, side, len, normal: unit(cross(side, dir)), placed: { verts: world, middle: mid[Math.floor(n / 2)] },
      low: Math.min(...ys), high: Math.max(...ys), size: len };
  }
  // A stem from `a` to `b`, `r` thick.
  function rodPart(name, a, b, r, colour) {
    const d = unit(sub(b, a)), side = unit(cross(d, Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]));
    const verts = [add(a, times(side, r)), add(a, times(side, -r)), add(b, times(side, r)), add(b, times(side, -r))];
    return { kind: "rod", role: "stem", name, colour: paint(colour), a, b, r, placed: { verts, middle: mix(a, b, 0.5) }, low: Math.min(a[1], b[1]), high: Math.max(a[1], b[1]), size: Math.hypot(...sub(b, a)) };
  }
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  /* A plant grown by its rules from `root`: its shoots rise and bend toward
   * the light, thinning as they go (each carries less above it); its leaves
   * set round them as its kind sets them, the lower ones the larger; its
   * flowers where its kind has them. Its parts, as the room has them. */
  function growPlant(S, R, root, scale) {
    // (Its greens and its flower in the painting's key: no stronger than its colour allows - Colour.)
    const K = S.palette, F = R.flower && { ...R.flower, colour: R.flower.colour && keyed(R.flower.colour, K.sat[2] + 0.06), middle: R.flower.middle && keyed(R.flower.middle, K.sat[2]) };
    const rng = S.rng, parts = [], L = S.light.L, toLight = unit([L[0], 0.0001, L[2]]), up = [0, 1, 0];
    const green = keyed(R.green, K.sat[0] * 1.4 + 0.1), stemColour = mix(green, [120, 112, 70], 0.3);
    const leafColour = () => mix(green, rng() < 0.5 ? [150, 176, 80] : [40, 80, 50], 0.12 + rng() * 0.12);
    const tall = R.tall * scale, thick = R.thick * scale;
    let turn = rng() * Math.PI * 2;
    // A leaf at a joint: out along its turn round the stem, tilted up toward the light, turned a little to face it.
    const leaf = (at, az, size, tilt = R.leaf.tilt, shape = R.leaf.shape, droop = R.leaf.droop) => {
      const out = [Math.cos(az), 0, Math.sin(az)], dir = unit(add(times(out, Math.cos(tilt)), [0, Math.sin(tilt), 0]));
      const side = unit(add(cross(up, out), times(toLight, 0.15 * dot(toLight, cross(up, out)))));
      parts.push(bladePart("a leaf", "leaf", at, dir, side, R.leaf.length * scale * size, shape, leafColour(), droop));
    };
    // The leaves at a joint, as its kind sets them round the stem.
    const setLeaves = (at, i, n, size) => {
      if (R.set === "opposite") { turn += Math.PI / 2; leaf(at, turn, size); leaf(at, turn + Math.PI, size); }
      else if (R.set === "whorled") { turn += Math.PI / 3; for (let k = 0; k < 3; k++) leaf(at, turn + k * Math.PI * 2 / 3, size); }
      else { turn += GOLDEN; leaf(at, turn, size); }
    };
    // A shoot: rising, bending toward the light, a heavy head weighing its last joint over; thinner as it goes.
    const shoot = (from, dir0, length, n, r0, leaves) => {
      let p = from, dir = dir0, r = r0;
      const joints = [];
      for (let i = 0; i < n; i++) {
        dir = unit(add(dir, add(times(toLight, R.seek * 0.22), times(up, 0.1))));
        if (R.nod && i === n - 1) dir = unit(add(dir, [0, -R.nod * 1.4, 0]));
        const q = add(p, times(dir, length / n * (0.85 + 0.3 * rng())));
        parts.push(rodPart("the stem", p, q, r, stemColour));
        if (leaves && i < n - 1) setLeaves(q, i, n, 1 - 0.45 * i / n);
        joints.push({ at: q, dir });
        p = q;
        r *= 0.86;
      }
      return { tip: p, dir, joints };
    };
    // A flower: its petals round its middle, opening out from the way it faces; or a head of rays round a disc of florets.
    const flower = (centre, facing, size) => {
      const e1 = unit(cross(facing, Math.abs(facing[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), e2 = cross(facing, e1), n = F.head === true ? F.rays : F.parts, a0 = rng() * Math.PI * 2;
      if (F.head === "spike") { parts.push(bladePart("a seed head", "petal", centre, facing, e1, size * 2.2, "spike", F.colour, 0)); return; }
      for (let k = 0; k < n; k++) {
        const a = a0 + k * Math.PI * 2 / n + (k % 2 ? Math.PI / n * 0.5 * (F.parts > 5 && !F.head ? 1 : 0) : 0), radial = add(times(e1, Math.cos(a)), times(e2, Math.sin(a)));
        const open = F.open * (F.parts > 5 && !F.head && k % 2 ? 0.85 : 1), dir = unit(add(times(facing, Math.cos(open)), times(radial, Math.sin(open))));
        const colour = mix(F.colour, [255, 255, 255], (rng() - 0.5) * 0.12);
        parts.push(bladePart("a petal", "petal", add(centre, times(radial, size * (F.head ? 0.38 : 0.08))), dir, unit(cross(facing, radial)), size, F.petal, colour, F.head ? 0.04 : 0.1, 5));
      }
      if (F.head === true) {
        const disc = [], rd = size * 0.42;
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; disc.push(add(centre, add(times(e1, Math.cos(a) * rd), times(e2, Math.sin(a) * rd)))); }
        const ys = disc.map((v) => v[1]);
        parts.push({ kind: "blade", role: "disc", name: "its florets", colour: paint(F.middle), world: disc, mid: [centre, centre], side: e1, len: rd * 2, normal: facing, florets: { centre, e1, e2, rd },
          placed: { verts: disc, middle: centre }, low: Math.min(...ys), high: Math.max(...ys), size: rd * 2 });
      } else {
        const r = size * 0.16;
        parts.push({ kind: "sphere", role: "middle", name: "its middle", colour: paint(F.middle), middle: add(centre, times(facing, r * 0.3)), radius: r, low: centre[1] - r, high: centre[1] + r, size: 2 * r });
      }
    };
    const facingAt = (dir) => (F?.head === true && R.seek > 0.3 ? unit([L[0], Math.max(0.25, L[1] * 0.6), L[2]]) : unit(add(dir, add(times(up, 0.8), times(toLight, 0.25)))));
    const bloom = (tip) => { if (F && F.at === "top") flower(add(tip.tip, times(tip.dir, 0.01)), facingAt(tip.dir), F.size * scale); };
    if (R.habit === "clump") {
      for (let k = 0; k < R.stems; k++) {
        const az = turn + k * GOLDEN, at = add(root, [Math.cos(az) * 0.03 * scale, 0, Math.sin(az) * 0.03 * scale]);
        leaf(at, az, 0.75 + 0.5 * rng(), R.leaf.tilt + (rng() - 0.5) * 0.3);
        if (F && k % 3 === 0) bloom(shoot(at, unit([Math.cos(az) * 0.15, 1, Math.sin(az) * 0.15]), tall * (0.8 + 0.3 * rng()), 3, thick * 0.6, false));
      }
    } else if (R.habit === "fronds") {
      for (let k = 0; k < R.stems; k++) {
        // A frond: its stalk arching out and over, its pinnae in pairs along it, smaller toward its tip.
        const az = turn + k * GOLDEN, out = [Math.cos(az), 0, Math.sin(az)];
        let p = root, dir = unit(add(times(out, 0.45), [0, 1, 0]));
        const n = 7, len = tall * (0.8 + 0.4 * rng());
        for (let i = 0; i < n; i++) {
          dir = unit(add(dir, add(times(out, 0.18), [0, -R.leaf.droop * 0.22 * i / n, 0])));
          const q = add(p, times(dir, len / n));
          parts.push(rodPart("a frond's stalk", p, q, thick * 0.5 * (1 - i / n) + 0.004, stemColour));
          if (i) {
            const side = unit(cross(dir, up)), size = R.leaf.length * scale * 0.32 * (1 - 0.7 * i / n);
            for (const sgn of [1, -1]) parts.push(bladePart("a pinna", "leaf", q, unit(add(times(side, sgn), times(dir, 0.35))), unit(cross(dir, side)), size, "pinna", leafColour(), 0.1, 4));
          }
          p = q;
        }
      }
    } else if (R.habit === "rosette") {
      // Its leaves flat round its foot, each a golden turn from the last; its stalks up out of them.
      for (let k = 0; k < 6; k++) { turn += GOLDEN; leaf(add(root, [0, 0.005, 0]), turn, 0.8 + 0.3 * rng(), R.leaf.tilt * 0.35, R.leaf.shape, 0.15); }
      for (let k = 0; k < R.stems; k++) {
        const az = turn + k * 2.1, lean = R.stems > 1 ? 0.25 : 0.06;
        bloom(shoot(root, unit([Math.cos(az) * lean, 1, Math.sin(az) * lean]), tall * (0.85 + 0.3 * rng()), R.nodes, thick, false));
      }
    } else if (R.habit === "branching") {
      // The leading shoot gives way (little apical dominance): side shoots from its joints, each flowering at its tip.
      const main = shoot(root, up, tall, R.nodes, thick, true);
      bloom(main);
      main.joints.forEach((j, i) => {
        if (i < 1 || i >= main.joints.length - 1 || rng() < R.apical) return;
        const az = turn + i * GOLDEN, out = [Math.cos(az), 0, Math.sin(az)];
        const side = shoot(j.at, unit(add(times(out, 0.9), [0, 0.7, 0])), tall * (1 - R.apical) * (1 - i / main.joints.length) * 0.9, 3, thick * 0.6, true);
        bloom(side);
      });
    } else {
      for (let k = 0; k < R.stems; k++) {
        const az = turn + k * 2.3, lean = R.stems > 1 ? 0.2 : 0;
        const main = shoot(add(root, [Math.cos(az) * lean * 0.1, 0, Math.sin(az) * lean * 0.1]), unit([Math.cos(az) * lean, 1, Math.sin(az) * lean]), tall, R.nodes, thick, true);
        bloom(main);
        // Flowers where the leaves join the stem, all the way up.
        if (F && F.at === "joints") main.joints.slice(1, -1).forEach((j) => { for (const sgn of [1, -1]) flower(add(j.at, times(cross(j.dir, [0, 0, 1]), sgn * 0.02 * scale)), unit(add(j.dir, [0, 0.5, 0])), F.size * scale); });
      }
    }
    return parts;
  }
  // Plants a word names: a kind, or a word for one (flowers: any that flowers).
  const PLANT_WORDS = { rose: "rose", roses: "rose", tulip: "tulip", tulips: "tulip", lily: "lily", lilies: "lily", daisy: "daisy", daisies: "daisy", sunflower: "sunflower",
    sunflowers: "sunflower", poppy: "poppy", poppies: "poppy", grass: "grass", grasses: "grass", fern: "fern", ferns: "fern", mint: "mint", flower: "any", flowers: "any", plant: "any", plants: "any" };
  // A plant's name, with its article.
  const plantName = (kind) => ({ grass: "a clump of grass", mint: "a mint plant" })[kind] || (/^[aeiou]/.test(kind) ? "an " : "a ") + kind;
  // A kind to grow: one asked for, or one it has done well with, the untried given their chance.
  const plantKind = (S) => S.wantPlant || pick(S.rng, GROWN.map((k) => ({ k, feats: ["growing " + plantName(k)] }))).k;
  /* Somewhere for a plant: on the top of a solid (a pot), or on the floor
   * beside what stands - wherever it fits whole in the picture, clear of
   * the others' feet, mostly seen, hiding little of them. */
  function placePlant(S, kind, near = null, rel = null) {
    const R = plantRules(kind), standing = alive(S).filter((P) => !P.parts), scale = clamp((S.seed?.high || 1) * 1.25 / R.tall, 0.6, 2.4);
    // (Asked for in one, or on it: there, if it has a top; asked for by one: on the floor round it - Asking.)
    const inside = near && (rel === "in" || rel === "on") && near.top;
    const pots = near ? (inside ? [near] : []) : standing.filter((P) => P.top && P.top.visible && P.high < 1.6 && (P.kind === "cylinder" || P.kind === "cube"));
    const spots = [];
    for (const host of pots) spots.push({ host, at: [host.top.centre[0], host.high, host.top.centre[2]] });
    for (const Q of near && !inside ? [near.low > 0.01 && near.host ? near.host : near] : near ? [] : standing) {
      if (Q.low > 0.01) continue;
      const m = Q.middle || Q.placed.middle, reach = Math.max(...Q.foot.map(([x, z]) => Math.hypot(x - m[0], z - m[2])));
      for (let k = 0; k < 4; k++) { const a = S.rng() * Math.PI * 2; spots.push({ host: null, at: [m[0] + Math.cos(a) * (reach + 0.25), 0, m[2] + Math.sin(a) * (reach + 0.25)] }); }
    }
    for (let t = spots.length - 1; t > 0; t--) { const j = Math.floor(S.rng() * (t + 1)); [spots[t], spots[j]] = [spots[j], spots[t]]; }
    for (const spot of spots.slice(0, 10)) {
      const parts = growPlant(S, R, spot.at, spot.host ? scale * 0.8 : scale);
      const P = compound(S, "plant", plantName(kind), parts, R.green, { plant: kind, rules: R, host: spot.host, how: spot.host ? "on" : null });
      P.low = spot.at[1];
      // (Its foot: where its stems come out of the ground, not where its leaves reach.)
      P.foot = oval(spot.at[0], spot.at[2], 0.08 * scale, 0.08 * scale, 8);
      frame(S, P);
      if (fitsPlant(S, P)) return P;
    }
    return null;
  }
  function fitsPlant(S, P) {
    const { cam } = S, m = BUILD.margin, b = P.box, zs = P.placed.verts.map((v) => v[2]);
    if (Math.min(...zs) < BUILD.near || Math.max(...zs) > ROOM.wall - BUILD.back) return false;
    if (b.x0 < cam.W * m || b.x1 > cam.W * (1 - m) || b.y0 < cam.H * m || b.y1 > cam.H * ROOM.foot) return false;
    const standing = alive(S).filter((Q) => Q !== P.host);
    if (standing.some((Q) => overlaps(P.foot, Q.foot) && Q.low < P.low + 0.01 && Q.high > P.low)) return false;
    const near = standing.filter((Q) => boxesMeet(P.coverBox, Q.coverBox));
    if (hiddenBy(P, near.filter((Q) => inFront(S, Q, P)).map((Q) => Q.cover)) > (S.relaxed ? 0.8 : 0.5)) return false;
    return !near.some((Q) => inFront(S, P, Q) && hiddenBy(Q, [P.cover]) > (S.relaxed ? 0.9 : 0.6));
  }
  /* A plant painted, far to near, part by part: each stem along its length
   * (its lit side touched in where it is thick enough), each leaf and
   * petal in strokes from its foot to its tip, the side the eye sees (a
   * leaf's underside paler), its veins over it; a flower's middle round, a
   * daisy's florets in their spiral. Each step says why it grows so. */
  function* plantSteps(S, P) {
    const R = P.rules, far = farOf(S, P), why = { stem: "rising and leaning to the light", leaf: R.set === "opposite" ? "in opposite pairs, each a quarter turn on" : "each a golden turn round from the last, so none shades the next",
      petal: "where whatever carries its pollen sees it", disc: "its florets packed in the golden spiral", middle: "its middle" };
    const order = P.parts.slice().sort((a, b) => (b.placed?.middle || b.middle)[2] - (a.placed?.middle || a.middle)[2]);
    let run = [], role = null;
    const flush = function* () { if (run.length) yield* inSteps(theOf(P) + ": " + (role === "stem" ? "its stems, " : role === "leaf" ? "its leaves, " : role === "petal" ? "its petals, " : "") + why[role], run); run = []; };
    for (const q of order) {
      const r = q.role === "middle" ? "middle" : q.role;
      if (r !== role) { yield* flush(); role = r; }
      if (q.kind === "rod") run.push(...rodStrokes(S, q, far));
      else if (q.kind === "blade") run.push(...bladeStrokes(S, q, P, far));
      else if (q.kind === "sphere") { yield* flush(); yield* sphereSteps(S, q); }
    }
    yield* flush();
  }
  // A stem: one stroke along it in its own light, and its lit side where it is thick enough to show one.
  function rodStrokes(S, q, far) {
    const { cam } = S, a = project(cam, q.a), b = project(cam, q.b), m = mix(q.a, q.b, 0.5), d = unit(sub(q.b, q.a)), L = S.light.L;
    const w = Math.max(1.4, 2 * q.r * scaleAt(cam, m)), toEye = unit(sub([0, cam.eye, 0], m)), side = (v) => unit(sub(v, times(d, dot(v, d))));
    const colour = shade(S, q.base, side(toEye), m[2], { at: m, self: q.owner }), out = [stroke(S, [a, b], w, colour, "round", { meant: () => colour })];
    if (w > 4 && far < 0.6) {
      const lit = side(L), [lx, ly] = sub(project(cam, add(m, times(lit, q.r))), project(cam, m)), l = Math.hypot(lx, ly) || 1;
      const sh = shade(S, q.base, lit, m[2], { shine: 0.2 });
      out.push(stroke(S, [[a[0] + lx / l * w * 0.22, a[1] + ly / l * w * 0.22], [b[0] + lx / l * w * 0.22, b[1] + ly / l * w * 0.22]], w * 0.4, sh, "round", { meant: () => sh }));
    }
    return out;
  }
  // A leaf or a petal: strokes from its foot to its tip across its width, in the light of the side the eye sees; its veins; a disc's florets.
  function bladeStrokes(S, q, P, far) {
    const { cam } = S, f = q.map.faces[0], m = q.placed.middle, n = f.normal;
    const colour = mix(shade(S, q.base, n, m[2], { at: m, self: P }), [235, 240, 225], q.under ? 0.14 : 0), clip = clipOf(q.outline, 0.8), out = [];
    const width = BLADES[q.shape] || (() => 0.5), wide = q.florets ? 0.5 : Math.max(...[0.2, 0.5, 0.8].map(width));
    const px = scaleAt(cam, m) * q.len, across = Math.max(1, Math.min(4, Math.round(px * wide * 2 / Math.max(4, cam.W * 0.012) * (1 - 0.5 * far))));
    if (q.florets) {
      // A disc: filled across, then its florets in the golden spiral, each a little darker or lighter than the next.
      out.push(...rowsIn(S, q.outline, Math.max(3, cam.W * 0.008), () => colour, "soft", { clip, meant: () => colour }));
      const { centre, e1, e2, rd } = q.florets, count = Math.round(clamp(px * 1.2, 20, 140) * (1 - 0.5 * far));
      for (let k = 1; k <= count; k++) {
        const r = rd * 0.95 * Math.sqrt(k / count), a = k * GOLDEN, p = project(cam, add(centre, add(times(e1, Math.cos(a) * r), times(e2, Math.sin(a) * r))));
        out.push(stroke(S, [p, [p[0] + 0.6, p[1] + 0.4]], Math.max(1.4, px / Math.sqrt(count) * 0.7), mix(colour, k % 2 ? [20, 14, 10] : [250, 220, 120], 0.25), "round", { clip }));
      }
      return out;
    }
    for (let k = 0; k < across; k++) {
      const s = across === 1 ? 0 : -0.55 + 1.1 * k / (across - 1), pts = [];
      for (const t of [0.04, 0.35, 0.68, 0.97]) {
        const i = Math.min(q.mid.length - 1, Math.round(t * (q.mid.length - 1))), w = width(t) * q.len;
        pts.push(project(cam, add(q.mid[i], times(q.side, w * s))));
      }
      out.push(stroke(S, pts, Math.max(1.6, px * wide * 2 / across * 1.05), colour, "soft", { clip, meant: () => colour }));
    }
    // Its veins: a midrib (and, in a net, a pair or two off it), a little darker than the leaf; none on a petal, or far off.
    if (q.role === "leaf" && px > 18 && far < 0.6) {
      const vein = mix(colour, [30, 50, 30], 0.3), vw = Math.max(1, px * 0.012);
      out.push(stroke(S, q.mid.map((v) => project(cam, v)), vw, vein, "round", { clip, meant: () => vein }));
      if ((P.rules.leaf.veins || "net") === "net") {
        for (const t of [0.3, 0.55]) {
          const i = Math.round(t * (q.mid.length - 1)), at = q.mid[i], w = width(t) * q.len * 0.8;
          for (const sgn of [1, -1]) out.push(stroke(S, [project(cam, at), project(cam, add(q.mid[Math.min(q.mid.length - 1, i + 1)], times(q.side, sgn * w)))], vw * 0.8, vein, "round", { clip, meant: () => vein }));
        }
      }
    }
    return out;
  }
  // A plant grown: placed, then painted like any solid set down.
  function* addPlant(S, m) {
    (S.plants ||= []).push(m.plant);
    yield* addPiece(S, m.plant);
    m.pieces = [m.plant];
  }

  /* Seeing it again from somewhere else (Perspective): a fresh sheet, and
   * the same structure - every solid where it stood - painted again as the
   * new eye has it: the room, then each solid in the order it was built,
   * its shadows first, and the shadows of those already painted on it. */
  function* viewAgain(S, view) {
    const { W, H } = S.cam;
    S.view = view;
    S.cam = fitView(camera(W, H, view, S.composition), alive(S), S.composition);
    S.viewedAt = S.moves;
    S.action = "seeing it again, " + view.name;
    yield* paintAgain(S, view.name);
  }
  /* Everything painted again on a fresh sheet, as it now stands and as the
   * eye now sees it: the room, then each solid with its shadows, what it
   * throws on the others and they on it. */
  function* paintAgain(S, what) {
    const { W, H } = S.cam, standing = alive(S);
    S.front = new Map();
    for (const P of standing) frame(S, P);
    S.paint = paintState(W, H, S.ground, S.M.grain);
    yield { label: "a fresh sheet, " + what, strokes: [], look: true, fresh: S.ground };
    // (Where nothing lighter can go over the room, it is painted round all of them - but a plant, all gaps, is lifted where it is light instead.)
    // (Kept bare as near its outline as it is painted, as the first solid's is: no ring of bare paper left round it.)
    yield* laid(S, room(S), { out: S.rules.reserve ? standing.filter((P) => P.kind !== "plant").map((P) => clipOf(P.outline, 0.5)) : null, app: S.app });
    const done = [];
    for (const P of standing) {
      const others = standing.filter((Q) => Q !== P), front = outsFor(S, P), own = S.rules.darkenOnly ? [P.outline] : [];
      if (P.kind === "plant") yield* liftFor(S, P, front, "lifting the ground for " + theOf(P));
      yield* laid(S, groundSteps(S, P), { out: (P.how === "on" ? outsFor(S, P.host).filter((c) => c !== P.cover) : others.map((Q) => Q.cover)).concat(own) });
      yield* laid(S, shadowSteps(S, P, S.floor, "the shadow of " + theOf(P)), { out: others.map((Q) => Q.cover).concat(own) });
      if (P.how === "on" && P.ground.clip) yield* laid(S, shadowSteps(S, P, P.ground, "its shadow on " + theOf(P.host)), { out: outsFor(S, P.host).filter((c) => c !== P.cover).concat(own) });
      for (const Q of done) yield* laid(S, castSteps(S, P, Q), { out: outsFor(S, Q).filter((c) => c !== P.cover).concat(own) });
      yield* laid(S, pieceSteps(S, P), { out: front, app: P.app });
      for (const Q of done) yield* laid(S, castSteps(S, Q, P), { out: front });
      yield* laid(S, edgeSteps(S, P), { out: front });
      done.push(P);
      yield BEAT;
    }
    S.name = nameOf(S);
    yield* lookAgain(S, 0, "it, " + what, null);
  }

  // Painted again in another medium, on a fresh ground for it: the same structure, the same eye, its paint handled as that medium handles it.
  function* inMedium(S, medium) {
    if (!MEDIA[medium] || medium === S.medium) return;
    S.medium = medium;
    S.M = MEDIA[medium];
    S.rules = rulesOf(S.M);
    groundFor(S, medium);
    S.app = chooseApp(S, { kind: "room" });
    for (const P of alive(S)) P.app = chooseApp(S, P);
    S.lastApp = S.app;
    S.action = "painting it all again in " + medium;
    yield* paintAgain(S, "in " + medium);
  }
  // Nearer (`by` over 1) or further off: the eye's picture narrowed or widened - no nearer than leaves all of it in the picture - and painted again.
  function* closer(S, by) {
    const cam = S.cam;
    if (cam.flat) cam.s *= by; else cam.f *= by;
    S.cam = fitView(cam, alive(S), S.composition);
    S.action = by > 1 ? "coming closer" : "stepping back";
    yield* paintAgain(S, by > 1 ? "closer" : "further off");
  }

  /* ── Turning ──────────────────────────────────────────────────────────
   * A solid turned about its own upright, and everything built on it or
   * against it - and on those - turned with it, about the same upright and
   * by the same angle: each keeps its place on the one it was built off,
   * going round with it as the moon keeps its face to the earth. What was
   * behind comes round: every side of a solid was decided when it was made
   * (its carvings, a dome's openings), seen or not, so a turn shows what
   * was always there. */
  const spinPoint = (p, a, [ax, az]) => { const c = Math.cos(a), sn = Math.sin(a), x = p[0] - ax, z = p[2] - az; return [x * c + z * sn + ax, p[1], -x * sn + z * c + az]; };
  // A solid and all that is built off it, and off those.
  function family(S, P) {
    const out = [P], standing = alive(S);
    for (let i = 0; i < out.length; i++) for (const Q of standing) if (Q.host === out[i] && !out.includes(Q)) out.push(Q);
    return out;
  }
  // Moved as `at` moves its points and `way` its directions: its corners, middle and foot, its parts, the way it was set against its host.
  function moveBy(Q, at, way) {
    if (Q.middle) Q.middle = at(Q.middle);
    if (Q.placed) Q.placed = { ...Q.placed, verts: Q.placed.verts.map(at), middle: at(Q.placed.middle) };
    for (const q of Q.parts || []) {
      if (q.middle) q.middle = at(q.middle);
      if (q.kind === "rod") { q.a = at(q.a); q.b = at(q.b); }
      if (q.kind === "blade") {
        q.world = q.world.map(at); q.mid = q.mid.map(at); q.side = way(q.side); q.normal = way(q.normal);
        if (q.florets) q.florets = { ...q.florets, centre: at(q.florets.centre), e1: way(q.florets.e1), e2: way(q.florets.e2) };
        q.placed = { verts: q.world, middle: at(q.placed.middle) };
      } else if (q.placed) q.placed = { ...q.placed, verts: q.placed.verts.map(at), middle: at(q.placed.middle) };
    }
    Q.foot = Q.foot.map(([x, z]) => { const r = at([x, 0, z]); return [r[0], r[2]]; });
    if (Q.away) {
      Q.away = way(Q.away);
      if (Q.how && Q.how !== "on") Q.how = Q.away[2] < -0.7 ? "in front of" : Q.away[2] > 0.7 ? "behind" : "beside";
    }
  }
  // Turned by `a` about the upright through `axis` (x, z), as place() turns a solid.
  const spin = (Q, a, axis) => { moveBy(Q, (p) => spinPoint(p, a, axis), (v) => spinPoint(v, a, [0, 0])); Q.yaw = (Q.yaw || 0) + a; };
  // Pushed back (or brought forward) by `dz`.
  const pushBack = (Q, dz) => { if (dz) moveBy(Q, (p) => [p[0], p[1], p[2] + dz], (v) => v); };
  const depths = (pieces) => pieces.flatMap((Q) => (Q.kind === "sphere" ? [Q.middle[2] - Q.radius, Q.middle[2] + Q.radius] : Q.placed.verts.map((v) => v[2])));
  // Where a solid would be in the picture, without framing it again: its box, from its corners.
  function boxNow(S, Q) {
    const pts = Q.kind === "sphere" ? [-1, 1].flatMap((sx) => [-1, 1].map((sy) => add(Q.middle, [sx * Q.radius, sy * Q.radius, 0]))) : Q.placed.verts;
    return boxOf([pts.map((p) => project(S.cam, p))]);
  }
  /* A turn for a solid: of the turns that keep all of it in the room - the
   * whole of it pushed back, as a turntable is, where its far side would
   * come round nearer than a solid may stand - the one that brings most of
   * what was out of sight round into view (its carved faces most), and
   * clears away least of what does not go round with it (a word, a plant
   * on the floor) where the turn would run into it. */
  function planTurn(S, P) {
    const kin = family(S, P), rest = alive(S).filter((Q) => !kin.includes(Q)), m = P.middle || P.placed.middle, axis = [m[0], m[2]];
    const seenNow = new Set();
    for (const Q of kin) (Q.map?.faces || []).forEach((f, i) => { if (f.visible) seenNow.add(Q.id + ":" + i); });
    let best = null;
    for (const a of [Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 3, -Math.PI / 3, 2 * Math.PI / 3, -2 * Math.PI / 3, Math.PI / 4, -Math.PI / 4]) {
      for (const Q of kin) spin(Q, a, axis);
      const zs = depths(kin), dz = Math.max(0, BUILD.near - Math.min(...zs));
      const ok = Math.max(...zs) + dz <= ROOM.wall - BUILD.back;
      let score = -1, clear = [];
      if (ok) {
        for (const Q of kin) pushBack(Q, dz);
        // (Loose things in the way: a whole word goes if one of its letters does.)
        clear = rest.filter((R) => kin.some((Q) => collide(Q, R)));
        if (clear.some((R) => R.kind === "letter")) clear = [...new Set(clear.concat(rest.filter((R) => R.kind === "letter")))];
        const stuck = clear.some((R) => R.kind !== "letter" && !(R.kind === "plant" && !R.host));
        let shown = 0;
        for (const Q of kin) {
          if (!Q.placed?.faces?.length || Q.parts) continue;
          premap(S.cam, Q.placed).faces.forEach((f, i) => { if (f.visible && !seenNow.has(Q.id + ":" + i)) shown += Q.carve?.faces?.[i] ? 2 : 1; });
        }
        shown += kin.reduce((t, Q) => t + (Q.features ? Q.features.filter((f) => f.az !== undefined).length * 0.5 : 0), 0);
        if (!stuck) score = shown - 1.5 * clear.length - dz + S.rng() * 1.5;
        for (const Q of kin) pushBack(Q, -dz);
      }
      for (const Q of kin) spin(Q, -a, axis);
      if (score > -1 && (!best || score > best.score)) best = { a, dz, clear, score };
    }
    return best && { ...best, kin, axis };
  }
  // Turning it: the turn made (pushed back as it needs), what was in the way cleared off, the eye let out if it no longer all shows, all of it painted again.
  function* turnAgain(S, P, turn) {
    const { a, dz, clear, kin, axis } = turn, deg = Math.round(Math.abs(a) * 180 / Math.PI);
    for (const Q of kin) { spin(Q, a, axis); pushBack(Q, dz); }
    for (const R of clear) { R.alive = false; S.notes.removed++; }
    if (clear.some((R) => R.kind === "letter")) S.word = null;
    // (The seed's square goes round with it: what is built after is squared to it as it now stands.)
    if (kin.includes(S.seed) && S.square !== null) S.square += a;
    const out = alive(S).some((Q) => { const b = boxNow(S, Q); return b.x0 < 0 || b.x1 > S.cam.W || b.y0 < 0 || b.y1 > S.cam.H * ROOM.foot; });
    if (out || dz) S.cam = fitView(camera(S.cam.W, S.cam.H, S.view, S.composition), alive(S), S.composition);
    S.turnedAt = S.moves;
    const others = kin.length - 1, cleared = clear.some((R) => R.kind === "letter") ? "the word" : clear.length ? theOf(clear[0]) : "";
    S.action = "turning " + theOf(P) + " " + deg + "\u00b0 to the " + (a > 0 ? "left" : "right") + (others ? ", " + (others === 1 ? "what is built off it" : "the " + others + " things built off it") + " going round with it" : "") +
      (cleared ? " (" + cleared + " cleared away)" : "") + ": its far side comes round";
    yield* paintAgain(S, "turned " + deg + "\u00b0");
  }

  /* The new eye let out - its picture widened, and shifted - until all of
   * what stands is in it with room round it, its foot well inside. */
  function fitView(cam, pieces, comp = null) {
    const pts = pieces.flatMap((P) => (P.kind === "sphere" ? [-1, 1].flatMap((sx) => [-1, 1].map((sy) => add(P.middle, [sx * P.radius, sy * P.radius, 0]))) : P.placed.verts));
    if (!pts.length) return cam;
    const boxNow = () => boxOf([pts.map((p) => project(cam, p))]);
    let b = boxNow();
    const k = Math.min(1, cam.W * 0.84 / Math.max(1, b.x1 - b.x0), cam.H * 0.78 / Math.max(1, b.y1 - b.y0));
    if (cam.flat) cam.s *= k; else cam.f *= k;
    b = boxNow();
    // (Its middle over the composition's point, as far as the picture's edges let it be: Composition.)
    const want = cam.W * (comp ? comp.x : 0.5), half = (b.x1 - b.x0) / 2, dx = clamp(want, cam.W * 0.06 + half, cam.W * 0.94 - half) - (b.x0 + b.x1) / 2, dy = clamp(cam.H * 0.9 - b.y1, cam.H * 0.08 - b.y0, 0);
    cam.cx += dx;
    if (cam.flat) { cam.base += dy; cam.horizon = cam.base; } else { cam.cy += dy; cam.horizon = cam.cy - cam.f * Math.tan(cam.pitch); }
    return cam;
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
   *   review   changes before it may see the structure again from another place; `letter`, before it letters a word of its own; `plant`, before it grows a plant of its own
   *   form     what two changes together must have done for a form to be kept
   *   forms    forms kept at most; `seen`, arrangements remembered
   *   master   uses of a rule before what stands on it can open; `pass`, how well they must have gone
   *   vote     what a vote is worth; `recent`, changes back a vote reaches */
  const LEARN = { key: "hexfield.study.memory.v1", taste: 12, fresh: 0.12, stale: 0.04, error: 0.5, rate: 0.1, explore: 0.25, warmth: 0.12,
    start: 3, per: 4, grow: 8, most: 14, review: 14, letter: 6, plant: 5, form: 0.06, forms: 24, seen: 300, master: 3, pass: -0.02, vote: 0.8, recent: 6 };
  const RULES = [
    { id: "join", name: "joining solids", needs: [] },
    { id: "stack", name: "stacking them", needs: ["join"] },
    { id: "stretch", name: "stretching squares into rectangles", needs: ["join"] },
    { id: "turn", name: "turning a sphere into a cylinder, triangles into pyramids and cones", needs: ["stretch", "stack"] },
    { id: "soften", name: "softening corners", needs: ["stretch"] },
    { id: "forms", name: "building the forms it learned", needs: ["join", "stack"] },
    { id: "vary", name: "varying its forms", needs: ["forms", "stretch"] },
    { id: "clear", name: "making solids that can be seen through", needs: ["soften", "turn"] },
    { id: "views", name: "seeing it again from another place", needs: ["stack"] },
    { id: "grow", name: "growing plants from why they grow", needs: ["join"] },
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
      if (kind === "sphere") kind = S.rng() < 0.6 ? "cylinder" : "dome";
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
    if (P.carve) f.push("carved faces", "carved faces, " + P.carve.way); else if (P.placed && !P.round && !P.parts) f.push("plain faces");
    for (const r of rules) f.push("rule: " + r);
    return f;
  }
  const labelOf = (P) => (P.host ? P.name + " " + P.how + " " + theOf(P.host) : P.name);
  // Places another solid could go - each connected to one standing, each as its rules let it be (a beat after each one that fits, and every few tried).
  function* candidates(S, count, out) {
    const standing = alive(S).filter((P) => !P.parts);
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
    const standing = alive(S), free = standing.filter((P) => P !== S.seed && (!P.parts || (P.kind === "plant" && !P.asked)) && !standing.some((Q) => Q.host === P));
    if (!free.length) return [];
    const worst = free.reduce((a, b) => ((b.reward ?? 0) < (a.reward ?? 0) ? b : a)), oldest = free.reduce((a, b) => (b.id < a.id ? b : a));
    const any = free[Math.floor(S.rng() * free.length)], out = [[worst, "what came out worst"]];
    if (oldest !== worst) out.push([oldest, "the oldest"]);
    if (any !== worst && any !== oldest) out.push([any, "one at random"]);
    return out;
  }
  // The structure as an arrangement: what stands on or against what, wherever it is.
  const arrangement = (S) => S.view.id + ": " + alive(S).map((P) => P.name + (P.host ? (P.how === "on" ? " on " : " by ") + P.host.name : "")).sort().join(", ");
  /* The next change, chosen from those it could make by what it has
   * learned of each: adding (as its rules let it), building a form it
   * learned, taking something away (likelier the fuller it is, and seldom
   * in a medium that cannot take paint back off), or reworking. */
  function* nextAction(S) {
    // (Something asked for - a plant, a word, another view - comes before anything it would choose itself: Asking.)
    const ask = S.asks?.shift();
    if (ask) {
      const m = askedMove(S, ask);
      if (m) {
        // (Asked for is liked: what it was is learned as liked, before it is even made.)
        for (const f of m.feats) teach(f, LEARN.vote * 0.5);
        remember();
        S.asking = ask;
        yield* move(S, m);
        S.asking = null;
        return;
      }
    }
    const standing = alive(S), n = standing.filter((P) => !P.parts).length, cap = most(S), forced = S.queue.shift();
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
      for (const c of found) options.push({ type: "add", piece: c.piece, feats: addFeatures(S, c.piece, c.rules), label: labelOf(c.piece), prior: over + composed(S, c.piece) });
      if (opened("forms") && n < cap) {
        const forms = memory().forms.filter((f) => f.mean > -0.05 && !S.unbuilt.has(f.sig)).sort((a, b) => b.mean - a.mean).slice(0, 3);
        for (const form of forms) options.push({ type: "form", form, feats: ["building a form it learned", "the form " + form.name, "rule: forms"], label: form.name, prior: 0.03 });
      }
    }
    const restraint = S.rules.darkenOnly ? Math.log(Math.max(0.05, S.M.lift)) * 0.25 : 0, crowd = n >= cap ? 0.2 : -0.5 + 0.45 * n / cap;
    for (const [P, why] of removables(S)) options.push({ type: "remove", piece: P, feats: ["taking away " + P.name, "taking away " + why], label: "taking away " + theOf(P), prior: crowd + restraint });
    // (Lettering: the words asked for, at once; or now and then a word of its own, once there is something to letter beside: Type.)
    if (!S.word && S.moves >= (S.wordAgain ?? 0) && (S.wanted || (n >= 3 && S.moves >= LEARN.letter))) {
      const face = faceOf(S), text = S.wanted || ownWord(S);
      options.push({ type: "word", text, face, feats: ["lettering a word", ...face.feats], label: "lettering \u201c" + text + "\u201d", prior: S.wanted ? 0.5 : -0.08 });
    }
    // (A plant: the one asked for, at once; or now and then one of its own kind's choosing, once it may grow them: Plants.)
    const plants = standing.filter((P) => P.kind === "plant").length;
    if (plants < 3 && S.moves >= (S.plantAgain ?? 0) && ((S.wantPlant && !plants) || (opened("grow") && n >= 2 && S.moves >= LEARN.plant))) {
      const kind = plantKind(S);
      options.push({ type: "plant", kind, feats: ["growing a plant", "growing " + plantName(kind)], label: "growing " + plantName(kind), prior: S.wantPlant && !plants ? 0.6 : -0.06 });
    }
    // (Seen again from another place - once there is something to see, now and then: Perspective.)
    if (opened("views") && n >= 4 && S.moves - (S.viewedAt ?? 0) >= LEARN.review) {
      const ids = Object.keys(VIEWS).filter((id) => id !== S.view.id), view = VIEWS[ids[Math.floor(S.rng() * ids.length)]];
      options.push({ type: "view", view, feats: ["seeing it again", "seeing it " + view.name, "rule: views"], label: "seeing it again, " + view.name, prior: -0.1 });
    }
    // (Turned round - the seed, or a solid on another with things of its own on it - once something is built off it, now and then: Turning.)
    if (n >= 3 && S.moves - (S.turnedAt ?? 0) >= LEARN.review) {
      const can = standing.filter((P) => !P.parts && (P === S.seed || P.how === "on") && family(S, P).length >= 2);
      if (can.length) {
        const P = can.includes(S.seed) && S.rng() < 0.7 ? S.seed : can[Math.floor(S.rng() * can.length)];
        options.push({ type: "turn", piece: P, feats: ["turning it round", "turning " + P.name + " round"], label: "turning " + theOf(P) + " round", prior: -0.08 });
      }
    }
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
    // (A word with nowhere to stand is tried again a few changes on.)
    if (m.type === "word" && !(m.letters = placeWord(S, m.text, m.face) || (m.asked ? loosely(S, () => placeWord(S, m.text, m.face)) : null))) { S.wordAgain = S.moves + 5; return; }
    // (A turn with nowhere to go is tried again later.)
    if (m.type === "turn" && !(m.turn = planTurn(S, m.piece))) { S.turnedAt = S.moves; return; }
    if (m.type === "plant") {
      if (!(m.plant = placePlant(S, m.kind, m.near, m.rel) || (m.near ? placePlant(S, m.kind) : null) || (m.asked ? loosely(S, () => placePlant(S, m.kind, m.near, m.rel) || placePlant(S, m.kind)) : null))) { S.plantAgain = S.moves + 4; return; }
      m.plant.asked = m.asked || m.kind === S.wantPlant;
      m.feats.push(m.plant.host ? "a plant in a pot" : "a plant on the floor");
    }
    const before = judged(S), k = known(m.feats);
    S.why = m.type === "form" ? "a form it learned" + (m.form.n ? " (" + (m.form.mean >= 0 ? "+" : "") + m.form.mean.toFixed(2) + ", built " + m.form.n + "×)" : "")
      : k.n ? (k.mean >= 0 ? "it has done well " : "it has gone badly ") + "(" + (k.mean >= 0 ? "+" : "") + k.mean.toFixed(2) + ", " + k.n + "×)" : "something it has not tried";
    if (m.type === "add") yield* addPiece(S, m.piece);
    else if (m.type === "form") yield* buildForm(S, m);
    else if (m.type === "remove") yield* removePiece(S, m.piece);
    else if (m.type === "view") yield* viewAgain(S, m.view);
    else if (m.type === "turn") yield* turnAgain(S, m.piece, m.turn);
    else if (m.type === "medium") yield* inMedium(S, m.medium);
    else if (m.type === "clear") { for (const P of m.pieces) if (P.alive) yield* removePiece(S, P); S.word = null; }
    else if (m.type === "zoom") yield* closer(S, m.by);
    else if (m.type === "word") yield* addWord(S, m);
    else if (m.type === "plant") yield* addPlant(S, m);
    else yield* reworkPiece(S, m.piece, m.recolour, m.colour);
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
    for (const P of (m.pieces || []).filter((Q) => !Q.parts)) for (const f of addFeatures(S, P, [])) teach(f, reward * 0.5);
    M.moves++;
    M.skill = Math.max(0, +(M.skill + (reward > 0.02 ? 1 : reward < -0.02 ? -0.5 : 0)).toFixed(2));
    Object.assign(m, { reward, taste, fresh });
    if (m.type === "add") m.piece.reward = reward;
    if (m.type === "plant") m.plant.reward = reward;
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
    const first = steps[0], anchors = alive(S).filter((Q) => !Q.parts && (first.how === "on" ? Q.top : Q.low < 0.01));
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
  /* ── Munker-White ─────────────────────────────────────────────────────
   * A look the painter takes now and then, and goes on taking as far as it
   * is liked - nothing to set: thin level stripes over the whole picture,
   * over the room in one dark colour, over each solid in a colour of its own,
   * so the colours between them are not seen as they are - a solid's colour
   * drawn toward its stripes' (Munker), a tone between dark stripes looking
   * lighter than the same tone between light ones (White). Two solids of
   * one colour, striped two ways, are seen as two. The stripes lie over the
   * paint, not in it: they are drawn on a layer of their own.
   *   period  the stripes' spacing against the picture's short side; `thick`, their share of it */
  const MUNKER = { period: 0.014, thick: 0.42 };
  function stripes(S) {
    if (!S || S.look !== "munker") return null;
    const { cam } = S, period = Math.max(5, Math.min(cam.W, cam.H) * MUNKER.period), K = S.palette;
    // (Each solid's own outline - a letter's with its holes; a plant, all gaps, is left to the room's.)
    const shapes = (P) => (P.glyph ? P.glyph.map.faces.filter((f) => f.name === "front" && f.visible).flatMap((f) => [f.screen, ...(f.holeScreens || [])]) : [P.outline]);
    const nearest = (P) => Math.min(...depths([P.parts ? { placed: P.placed } : P]));
    const order = alive(S).filter((P) => P.kind !== "plant" && P.outline?.length >= 3).sort((a, b) => nearest(b) - nearest(a));
    // (Two tints opposite on the wheel, one light, one dark: what each draws its solids toward is as far from the other as it can be.)
    // (In a medium of values only, two greys - White's own: the same grey between light stripes and between dark ones.)
    const room = paint(mix(K.wall, [18, 18, 26], 0.74)), tints = S.rules.value ? [[214, 212, 206], [58, 56, 62]] : [hsl(K.support, 0.72, 0.66), hsl((K.support + 180) % 360, 0.72, 0.4)];
    const turn = new Map(alive(S).map((P, i) => [P.id, i % 2]));
    const rows = [];
    for (let y = period / 2; y < cam.H; y += period) {
      const segs = [{ x0: 0, x1: cam.W, colour: room }];
      for (const P of order) for (const [a, b] of spansAt(shapes(P), y)) segs.push({ x0: a, x1: b, colour: tints[turn.get(P.id)] });
      rows.push({ y, segs });
    }
    return { period, thick: period * MUNKER.thick, rows };
  }
  // Where a level line at `y` lies inside some rings (holes too, counted in and out): its runs, left to right.
  function spansAt(rings, y) {
    const xs = [];
    for (const poly of rings) for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
      if ((y0 - y) * (y1 - y) > 0 || y0 === y1) continue;
      xs.push(x0 + (x1 - x0) * (y - y0) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    const out = [];
    for (let k = 0; k + 1 < xs.length; k += 2) out.push([xs[k], xs[k + 1]]);
    return out;
  }

  /* ── Asking ───────────────────────────────────────────────────────────
   * Whoever watches can ask - with a tap, not a word typed - for a plant to
   * be grown, a word to be lettered, or the structure seen from another
   * place. What is asked for is made next, and counts as liked. What it
   * offers to be asked for: plants it has not grown in this painting (the
   * ones it has done well with first), a word of its own, the other views. */
  function ask(S, request) {
    if (!S || !request) return false;
    (S.asks ||= []).push(request);
    // (No waiting out the breath it takes after a change: what was asked for comes now.)
    S.restUntil = 0;
    S.restAfter = 0;
    return true;
  }
  function askedMove(S, a) {
    if (a.type === "plant" && PLANTS[a.kind]) return { type: "plant", kind: a.kind, near: onto(S, a.onto), rel: a.rel, asked: true, feats: ["growing a plant", "growing " + plantName(a.kind)], label: "growing " + plantName(a.kind) };
    if (a.type === "word" && a.text) {
      // (One typeface for every row of one line typed.)
      const face = (a.group && S.faces?.[a.group]) || faceOf(S);
      if (a.group) (S.faces ||= {})[a.group] = face;
      return { type: "word", text: String(a.text).toUpperCase().slice(0, LETTERS_ROW), face, asked: true, feats: ["lettering a word", ...face.feats], label: "lettering “" + a.text + "”" };
    }
    // (A solid asked for by name: where it was asked - on another, against it - in the colour asked, where one was: Asking.)
    if (a.type === "solid") {
      const host = onto(S, a.onto);
      let P = null;
      if (host && !host.parts) {
        const up = a.rel === "on" || a.rel === "in";
        // (On its top, if it has one; on the crown of one that is round; else against it - or, where it stands up on another, against that.)
        if (up && host.top) P = placeOn(S, host, a.kind);
        if (up && !P && isBall(host)) P = placeOnCrown(S, host, a.kind);
        if (P) { P.base = pieceColour(S, null, P); if (!fits(S, P)) P = null; }
        const ground = host.low > 0.01 && host.host ? host.host : host;
        for (let t = 0; t < 8 && !P; t++) { const Q = placeBeside(S, ground, a.kind, { axis: wayFor(S, a.rel) }); if (Q) { Q.base = pieceColour(S, null, Q); if (fits(S, Q)) P = Q; } }
      }
      for (let t = 0; t < 2 && !P; t++) P = findPlace(S, null, a.kind);
      if (!P) {
        // (Still nowhere: more loosely - built on any of them, or standing free on the floor near what it was asked by, or anywhere in view.)
        S.relaxed = true;
        try { for (let t = 0; t < 3 && !P; t++) P = findPlace(S, null, a.kind); P ||= placeFree(S, a.kind, host, a.rel); } finally { S.relaxed = false; }
      }
      if (!P) return null;
      if (a.colour) P.base = a.colour.slice();
      (S.madeFor ||= {})[a.key] = P;
      return { type: "add", piece: P, asked: true, feats: addFeatures(S, P, []), label: labelOf(P) };
    }
    if (a.type === "remove") {
      const P = a.id !== undefined ? alive(S).find((Q) => Q.id === a.id) : standingOf(S, a.thing);
      // (Not the seed - all of it stands on that - nor one with something built on it.)
      if (!P || P === S.seed || alive(S).some((Q) => Q.host === P)) return null;
      return { type: "remove", piece: P, asked: true, feats: ["taking away " + P.name], label: "taking away " + theOf(P) };
    }
    if (a.type === "clear") {
      const letters = alive(S).filter((P) => P.kind === "letter");
      return letters.length ? { type: "clear", pieces: letters, asked: true, feats: ["taking away the word"], label: "taking away the word" } : null;
    }
    if (a.type === "recolour") {
      const solids = alive(S).filter((Q) => !Q.parts);
      const P = a.thing ? standingOf(S, a.thing) : solids[solids.length - 1] || S.seed;
      if (!P) return null;
      return { type: "rework", piece: P, recolour: true, colour: a.colour, asked: true, feats: ["repainting " + P.name], label: "repainting " + theOf(P) };
    }
    if (a.type === "medium" && MEDIA[a.medium] && a.medium !== S.medium) return { type: "medium", medium: a.medium, asked: true, feats: ["painting it again in " + a.medium], label: "painting it again in " + a.medium };
    if (a.type === "zoom") return { type: "zoom", by: a.by, asked: true, feats: [a.by > 1 ? "coming closer" : "stepping back"], label: a.by > 1 ? "coming closer" : "stepping back" };
    // (Turned round: the seed, with all that is built off it - Turning.)
    if (a.type === "turn" && S.seed?.alive) return { type: "turn", piece: S.seed, asked: true, feats: ["turning it round", "turning " + S.seed.name + " round"], label: "turning " + theOf(S.seed) + " round" };
    if (a.type === "view" && VIEWS[a.view] && a.view !== S.view.id) return { type: "view", view: VIEWS[a.view], asked: true, feats: ["seeing it again", "seeing it " + VIEWS[a.view].name, "rule: views"], label: "seeing it again, " + VIEWS[a.view].name };
    return null;
  }
  const VIEW_ASKS = { one: "see it square on", two: "see it turned", above: "see it from above", below: "see it from below", flat: "see it flat" };
  // (Three at most, one of each: a plant, a word - or, while a word stands, another plant - and a view.)
  function suggestions(S) {
    if (!S) return [];
    const grown = new Set(alive(S).filter((P) => P.kind === "plant").map((P) => P.plant)), r = seeded((S.moves || 0) * 7919 + 17), out = [];
    const kinds = GROWN.filter((k) => !grown.has(k)).map((k) => ({ k, feats: ["growing " + plantName(k)] }));
    const plant = () => { if (!kinds.length) return; const { k } = pick(r, kinds); kinds.splice(kinds.findIndex((x) => x.k === k), 1); out.push({ label: "grow " + plantName(k), request: { type: "plant", kind: k } }); };
    plant();
    if (!(S.word && alive(S).some((P) => P.kind === "letter"))) { const word = S.wanted || seedWord(S); out.push({ label: "letter \u201c" + word + "\u201d", request: { type: "word", text: word } }); }
    else plant();
    // (The third: another view, or - every other time, once the seed stands - turning it round.)
    const ids = Object.keys(VIEWS).filter((id) => id !== S.view.id), id = ids[Math.floor(r() * ids.length)];
    out.push(S.seed?.alive && r() < 0.5 ? { label: "turn it round", request: { type: "turn" } } : { label: VIEW_ASKS[id], request: { type: "view", view: id } });
    return out;
  }
  /* ── Asking in words ──────────────────────────────────────────────────
   * A typed line read for what it asks, in the order it asks it:
   *   things    a solid it names is added, a plant grown - "two", "three"
   *             before it for more, a colour before it for its colour (in
   *             the painting's key)
   *   where     "on", "in", "beside", "next to", "in front of", "behind",
   *             "left of", "right of" before another thing sets the first
   *             there - on its top where it has one, else against it. The
   *             thing after is one already standing if there is one ("the
   *             dome"), else it is made first.
   *   commands  "remove" a thing; "make it gold", "paint the cube red" (only
   *             deeper, where the medium cannot cover); "in watercolour",
   *             "oil", "gouache", "charcoal" - all of it painted again in
   *             that medium; "bigger", "closer", "smaller", "further"; "from
   *             above", "below", "flat", "square on", "turned"; "turn", "spin"
   *   the rest  lettered: as many of its words as go in nine letters.
   * Six asks at most from one line. */
  const SOLID_WORDS = { cube: "cube", cubes: "cube", box: "cube", boxes: "cube", block: "cube", sphere: "sphere", spheres: "sphere", ball: "sphere", balls: "sphere",
    tetrahedron: "tetrahedron", tetrahedra: "tetrahedron", octahedron: "octahedron", octahedra: "octahedron", pyramid: "pyramid", pyramids: "pyramid",
    cylinder: "cylinder", cylinders: "cylinder", cone: "cone", cones: "cone", dome: "dome", domes: "dome", form: "blob", forms: "blob", blob: "blob", bean: "blob" };
  const VIEW_PHRASES = { fromabove: "above", overhead: "above", frombelow: "below", flat: "flat", squareon: "one", front: "one", turned: "two" };
  const REL_PHRASES = { ontopof: "on", on: "on", onto: "on", atop: "on", upon: "on", above: "on", over: "on", in: "in", inside: "in", into: "in", within: "in",
    beside: "beside", by: "beside", nextto: "beside", near: "beside", against: "beside", under: "beside", below: "beside", beneath: "beside",
    infrontof: "front", before: "front", behind: "behind", leftof: "left", rightof: "right" };
  const JOINED = [["on top of", "ontopof"], ["in front of", "infrontof"], ["next to", "nextto"], ["to the left of", "leftof"], ["to the right of", "rightof"],
    ["left of", "leftof"], ["right of", "rightof"], ["from above", "fromabove"], ["from below", "frombelow"], ["square on", "squareon"], ["take away", "remove"],
    ["get rid of", "remove"], ["zoom in", "closer"], ["zoom out", "further"], ["step back", "further"], ["come closer", "closer"], ["move closer", "closer"]];
  const COLOUR_HUES = { red: 2, orange: 28, yellow: 52, gold: 45, golden: 45, green: 125, teal: 175, cyan: 188, blue: 220, navy: 228, purple: 275, violet: 268, pink: 330, magenta: 310, brown: 25 };
  const COLOUR_GREYS = { white: 0.92, grey: 0.55, gray: 0.55, silver: 0.7, black: 0.12 };
  const MEDIUM_WORDS = { oil: "oil", oils: "oil", gouache: "gouache", watercolour: "watercolour", watercolours: "watercolour", watercolor: "watercolour", watercolors: "watercolour", charcoal: "charcoal" };
  const ZOOM_WORDS = { bigger: 1.3, closer: 1.3, larger: 1.3, nearer: 1.3, zoom: 1.3, smaller: 0.78, further: 0.78, farther: 0.78, wider: 0.78 };
  const NUMBER_WORDS = { two: 2, three: 3, "2": 2, "3": 3, pair: 2, couple: 2, few: 3, some: 2 };
  const REMOVE_WORDS = new Set(["remove", "delete", "erase", "drop", "lose"]), PAINT_WORDS = new Set(["make", "paint", "colour", "color", "recolour", "recolor", "dye"]);
  const IT_WORDS = new Set(["it", "them", "this", "that", "everything", "all"]), WORD_WORDS = new Set(["word", "words", "letters", "letter", "text"]);
  const QUIET = new Set(["a", "an", "the", "of", "and", "at", "to", "with", "from", "please", "it", "its", "see", "add", "grow", "put", "place", "set", "build", "write", "me", "view",
    "seen", "look", "new", "another", "more", "then", "also", "now", "is", "be", "one", "1", "plain", "some", "again", "painted", "painting", "all"]);
  const colourOf = (S, w) => (COLOUR_GREYS[w] !== undefined ? hsl(S.palette.hue, 0.04, COLOUR_GREYS[w]) : COLOUR_HUES[w] !== undefined ? hsl(COLOUR_HUES[w], clamp(S.palette.sat[0] * 1.6, 0.35, 0.75), 0.5) : null);
  // A thing standing of a kind (a plant's kind, or a solid's - boxes and slabs are cubes, discs cylinders): the seed if it is one, else the last made.
  function standingOf(S, thing) {
    const of = alive(S).filter((P) => (thing.plant ? P.kind === "plant" && (thing.kind === "any" || P.plant === thing.kind) : thing.letters ? P.kind === "letter" : P.kind === thing.kind));
    return of.includes(S.seed) ? S.seed : of[of.length - 1] || null;
  }
  const nameOfThing = (thing) => (thing.plant ? plantName(thing.kind) : nameFor(thing.kind, thing.kind === "pyramid" ? { sides: 4 } : {}));
  // Text to letter in rows of at most twelve, broken between words; three rows at most.
  function rowsOf(text) {
    const rows = [];
    let row = "";
    for (const w of String(text).toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").split(/\s+/).filter(Boolean)) {
      const next = row ? row + " " + w : w;
      if (next.length <= LETTERS_ROW) { row = next; continue; }
      if (row) rows.push(row);
      row = w.slice(0, LETTERS_ROW);
    }
    if (row) rows.push(row);
    return rows.slice(0, 3);
  }
  // The rows of a text asked to be lettered: each its own ask, one typeface; a word standing taken away first.
  function letterAsks(S, rows, group, asks) {
    if (!rows.length) return;
    if (alive(S).some((P) => P.kind === "letter") && !asks.some((a) => a?.type === "clear")) asks.push({ type: "clear", label: "take away “" + (S.word?.text || "the word") + "”" });
    for (const row of rows) asks.push({ type: "word", text: row, group, label: "letter “" + row + "”" });
  }
  function askText(S, text) {
    const raw = String(text || "").trim();
    if (!S || !raw) return [];
    // (Quoted, or after "write", "letter", "say" or "spell": lettered just as it is typed - Type.)
    const quoted = raw.match(/["\u201c\u201d'\u2018\u2019]([^"\u201c\u201d'\u2018\u2019]+)["\u201c\u201d'\u2018\u2019]/), spoken = raw.match(/^(?:write|letter|say|spell|type)\s+(.+)$/i);
    if (quoted || spoken) {
      const asks = [];
      letterAsks(S, rowsOf((quoted || spoken)[1]), (S.askGroup = (S.askGroup || 0) + 1), asks);
      for (const a of asks) ask(S, a);
      const others = quoted ? askText(S, raw.replace(quoted[0], " ")) : [];
      return asks.map((a) => a.label).concat(others);
    }
    let line = " " + raw.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ") + " ";
    for (const [phrase, token] of JOINED) line = line.split(" " + phrase + " ").join(" " + token + " ");
    const words = line.trim().split(" ").filter(Boolean);
    if (!S || !words.length) return [];
    const things = [], asks = [], rest = [], hasColour = words.some((w) => colourOf(S, w));
    let colour = null, colourWord = null, count = 1, rel = null, verb = null, paintTarget = null, paintColour = null, paintWord = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (MEDIUM_WORDS[w]) { if (MEDIUM_WORDS[w] !== S.medium) asks.push({ type: "medium", medium: MEDIUM_WORDS[w], label: "paint it again in " + MEDIUM_WORDS[w] }); rel = null; continue; }
      if (ZOOM_WORDS[w]) { asks.push({ type: "zoom", by: ZOOM_WORDS[w], label: ZOOM_WORDS[w] > 1 ? "come closer" : "step back" }); continue; }
      if (VIEW_PHRASES[w]) { if (VIEW_PHRASES[w] !== S.view.id) asks.push({ type: "view", view: VIEW_PHRASES[w], label: VIEW_ASKS[VIEW_PHRASES[w]] }); continue; }
      if (["turn", "spin", "rotate"].includes(w) && !(hasColour && w === "turn")) { asks.push({ type: "turn", label: "turn it round" }); continue; }
      if (REMOVE_WORDS.has(w)) { verb = "remove"; continue; }
      if (PAINT_WORDS.has(w) || w === "turn") { verb = "paint"; continue; }
      if (NUMBER_WORDS[w]) { count = NUMBER_WORDS[w]; continue; }
      const c = colourOf(S, w);
      if (c) {
        if (verb === "paint") { paintColour = c; paintWord = w; continue; }
        if (colourWord) rest.push(colourWord);
        colour = c; colourWord = w;
        continue;
      }
      if (verb && IT_WORDS.has(w)) { if (verb === "paint") paintTarget = "it"; continue; }
      if (REL_PHRASES[w] && things.length && !verb) { rel = REL_PHRASES[w]; continue; }
      const kind = PLANT_WORDS[w] || SOLID_WORDS[w], letters = WORD_WORDS.has(w);
      if (kind || (letters && verb)) {
        const thing = { kind: kind || "letter", plant: Boolean(PLANT_WORDS[w]), letters, colour, colourWord, count: Math.min(3, count) };
        colour = null; colourWord = null; count = 1;
        if (verb === "remove") { asks.push(letters ? { type: "clear", label: "take away the word" } : { type: "remove", thing, label: "take away " + theOf({ name: nameOfThing(thing) }) }); verb = null; continue; }
        if (verb === "paint") { paintTarget = thing; continue; }
        // (After "on", "beside" and the rest: what the last thing named is set by.)
        if (rel) { const from = things[things.length - 1]; from.rel = rel; from.target = thing; thing.target_of = from; rel = null; }
        things.push(thing);
        continue;
      }
      if (!QUIET.has(w) && !REL_PHRASES[w] && !IT_WORDS.has(w)) { if (colourWord) { rest.push(colourWord); colour = null; colourWord = null; } rest.push(w); }
    }
    if (colourWord && !things.length && !paintTarget && !rest.length && !asks.length) { verb = "paint"; paintColour = colour; paintWord = colourWord; paintTarget = "it"; colourWord = null; }
    if (colourWord) rest.push(colourWord);
    if (verb === "paint" && paintColour) {
      const label = "paint " + (paintTarget && paintTarget !== "it" ? theOf({ name: nameOfThing(paintTarget) }) : "it") + " " + paintWord;
      asks.push({ type: "recolour", thing: paintTarget === "it" ? null : paintTarget, colour: paintColour, label });
    }
    // Things in an order that makes what another is set by first - unless it already stands.
    const group = (S.askGroup = (S.askGroup || 0) + 1), done = new Set();
    const emit = (thing, idx) => {
      if (done.has(thing)) return;
      done.add(thing);
      const target = thing.target ? standingOf(S, thing.target) : null;
      if (thing.target && !target) emit(thing.target, things.indexOf(thing.target));
      for (let n = 0; n < thing.count; n++) {
        const key = group + ":" + idx + ":" + n, where = thing.rel ? { on: "on", in: "in", beside: "beside", front: "in front of", behind: "behind", left: "left of", right: "right of" }[thing.rel] : null;
        const onto = thing.target ? (target ? { id: target.id } : { ref: group + ":" + things.indexOf(thing.target) + ":0" }) : null;
        const label = (thing.plant ? "grow " : "add ") + (thing.colourWord ? thing.colourWord + " " : "") + nameOfThing(thing).replace(/^an? /, "") + (where ? " " + where + " " + theOf({ name: nameOfThing(thing.target) }) : "");
        asks.push(thing.plant ? { type: "plant", kind: thing.kind === "any" ? GROWN.filter((k) => plantRules(k).flower)[Math.floor(S.rng() * 7)] : thing.kind, rel: thing.rel, onto, key, label }
          : thing.letters ? null : { type: "solid", kind: thing.kind, colour: thing.colour, rel: thing.rel, onto, key, label });
      }
    };
    // (A thing named only as where another goes is made only if it does not stand already - by the one that needs it.)
    things.forEach((t, i) => { if (!t.target_of) emit(t, i); });
    // (What is left, lettered - in rows, in place of a word standing.)
    letterAsks(S, rowsOf(rest.join(" ")), group, asks);
    const out = [];
    for (const a of asks.filter(Boolean)) { if (out.length >= 6) break; out.push(a); ask(S, a); }
    return out.map((a) => a.label);
  }
  // A thing asked to stand by: one already standing (by its number), or one made earlier from the same line.
  const onto = (S, o) => (!o ? null : o.id !== undefined ? alive(S).find((P) => P.id === o.id) || null : S.madeFor?.[o.ref]?.alive ? S.madeFor[o.ref] : null);
  // Which of the seed's four ways round out from a solid goes toward where it was asked: in front (to the eye), behind, left, right, or beside (either side).
  function wayFor(S, rel) {
    if (S.square === null) return undefined;
    const ways = [0, 1, 2, 3].map((k) => ({ k, t: -S.square + k * Math.PI / 2 })).map((w) => ({ ...w, x: Math.cos(w.t), z: Math.sin(w.t) }));
    const score = { front: (w) => -w.z, behind: (w) => w.z, left: (w) => -w.x, right: (w) => w.x, beside: (w) => -Math.abs(w.z) + S.rng() * 0.2 }[rel];
    return score ? ways.reduce((a, b) => (score(b) > score(a) ? b : a)).k : undefined;
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
  /* The first solid: on the floor near the middle, as far back as makes it
   * its size in the picture and no nearer than keeps its foot well inside
   * the canvas - wherever the eye is. Square on where the view says so. */
  function firstPiece(S, kind, wants) {
    const { cam } = S, short = Math.min(cam.W, cam.H);
    const size = kind === "sphere" ? 0.6 : SIZES[kind], shape = kind === "sphere" ? null : shapeOf(kind, size), tall = shape ? shape.high - shape.low : 2 * size;
    let Z = BUILD.near + 2.2;
    if (!cam.flat) {
      const seenTall = (z) => project(cam, [0, 0, z])[1] - project(cam, [0, tall, z])[1];
      let lo = BUILD.near + 0.8, hi = ROOM.wall - 2;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (seenTall(mid) > short * (S.composition?.size ?? ROOM.size)) lo = mid; else hi = mid; }
      const room = onLevel(cam, cam.cx, cam.H * (ROOM.foot - 0.06))?.[2] ?? BUILD.near + 0.8;
      Z = clamp(Math.max(lo, room, BUILD.near + 0.8), BUILD.near + 0.8, ROOM.wall - 2);
    }
    const x = (S.rng() - 0.5) * 0.2 * cam.W / scaleAt(cam, [0, 0, Z]);
    if (!shape) return makePiece(S, "sphere", size, [x, 0, Z]);
    if (kind === "dome") return makePiece(S, "dome", size, [x, 0, Z], S.rng() * Math.PI * 2);
    if (kind === "blob") return makePiece(S, "blob", size, [x, 0, Z], cam.flat ? 0 : Math.atan2(x, Z));
    if (S.square === 0) return makePiece(S, kind, size, [x, 0, Z], edgeTurn(kind));
    const want = clamp(Number(wants.planes) || [3, 2, 3][Math.floor(S.rng() * 3)], 1, 3);
    const t = turnFor(cam, shape, [want === 1 ? 0 : x, -shape.low, Z], want, S.rng);
    return makePiece(S, kind, size, [want === 1 ? 0 : x, 0, Z], t.yaw);
  }

  // The ground a medium is laid on - a toned canvas, toned paper, white paper - and what taking paint off goes back to.
  function groundFor(S, medium) {
    const colours = S.palette;
    if (medium === "watercolour") S.ground = PAPER;
    else if (medium === "charcoal") S.ground = S.choose("application \u00b7 charcoal", "ground", ["toned", "white"]) === "toned" ? valueOf(mix(colours.wall, colours.floor, 0.5)).map((v) => v * 0.8) : DRAWING_PAPER;
    else if (medium === "gouache") S.ground = mix(colours.wall, [236, 232, 224], 0.55);
    else S.ground = colours.wall.map((v) => v * 0.8);
    S.ground = paint(S.ground);
    S.bare = medium === "charcoal" ? DRAWING_PAPER : S.ground;
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
    const choose = wants.choose || ((freedom, key, options) => options[Math.floor(rng() * options.length)]);
    const view = VIEWS[wants.view] || VIEWS[choose("view", "view", Object.keys(VIEWS))] || VIEWS.two;
    const composition = compositionOf(rng, choose), cam = camera(W, H, view, composition), light = lighting(rng), colours = palette(rng, choose);
    // (Now and then a look over the whole picture - Munker-White - chosen as the ledger leans.)
    const style = rng() < 0.35 ? choose("look", "look", ["plain", "munker"]) : "plain";
    const S = { kind, cam, view, composition, look: style, light, palette: colours, rng, medium, M: MEDIA[medium], rules: rulesOf(MEDIA[medium]), level: "below",
      pieces: [], front: new Map(), nextId: 1, square: view.square ?? null, colours: [colours.solid, colours.solid2], queue: [], error: null, action: "", label: "",
      notes: { kept: 0, lifted: 0, corrected: 0, added: 0, removed: 0, reworked: 0 },
      choose, report: wants.report || null,
      judge: wants.judge || null, history: [], moves: 0, unbuilt: new Set() };
    Object.defineProperty(S, "entries", { get: () => alive(S) });
    // The air (far off, everything goes toward it) and the picture's tonal centre (its middle value, which far values settle on).
    // (Far off, all of it settles toward the painting's own tonal centre - its value, and its colour: Colour.)
    S.air = mix(colours.centre, light.colour, 0.1);
    S.centre = lum(colours.centre);
    S.airAmount = colours.tone === "neutral" ? DEPTH.air : DEPTH.air * 1.8;
    const l2 = Math.hypot(light.L[0], light.L[1]) || 1;
    S.lightX = +(light.L[0] / l2).toFixed(3);
    S.lightY = +(-light.L[1] / l2).toFixed(3);
    S.lineW = Math.max(1.6, Math.min(W, H) * 0.006);
    S.floor = { h: 0, base: colours.floor, clip: null };
    S.app = chooseApp(S, { kind: "room" });
    // The ground the medium is laid on, and what taking paint off goes back to.
    groundFor(S, medium);
    S.paint = paintState(W, H, S.ground, S.M.grain);
    const first = firstPiece(S, kind === "stack" ? "cube" : kind, wants);
    // The seed: what every solid after it is squared to and seen against - in the key's own hue (Colour).
    S.seed = first;
    first.base = colours.solid.slice();
    if (first.placed && !first.round && !first.carve) first.carve = carvingsFor(S, first);
    if (kind === "stack") S.queue.push({ how: "on", kind: SOLIDS.includes(wants.top) ? wants.top : null });
    S.name = first.name;
    S.planes = first.planes;
    // The words asked for, if any: a plant they name is grown first thing (Plants); any other words are lettered (Type).
    const asked = String(wants.words || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean);
    const named = asked.map((w) => PLANT_WORDS[w]).find(Boolean);
    S.wantPlant = named === "any" ? GROWN.filter((k) => plantRules(k).flower)[Math.floor(rng() * 7)] : named || null;
    S.wanted = named ? null : asked.filter((w) => !["a", "an", "the", "of", "and"].includes(w)).slice(0, 2).join(" ").toUpperCase().slice(0, 9) || null;
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

  global.HexfieldStudy = { KINDS, SOLIDS, NAMES, ROOM, BUILD, MEDIA, MEDIUMS, LOOK, LEARN, RULES, VIEWS, PLANTS, COMPOSITIONS, HARMONIES, make, premap, camera, project, cubeSolid, tetraSolid, octaSolid, pyramidSolid, prismSolid, place,
    rulesOf, freedomsOf, credit, learned, seedKind, memory, ask, askText, suggestions, stripes };
})(typeof globalThis !== "undefined" ? globalThis : this);
