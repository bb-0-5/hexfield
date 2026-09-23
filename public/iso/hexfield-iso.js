/* Isometric hex-cube field — the ground the whole page is rendered on.
 *
 * Ported from the Hex studio (dropkickfriend-spec/Hex, docs/index.html:
 * `buildPageHexBg`, the `#mhPageHexBg` / `.mh-pxhex` / `.mh-pxf-*` rules, and
 * the wheel colour pipeline at `hexRadius` .. `rgbAt`). Everything that decides
 * how the field *looks* is carried over unchanged: the CMY-anchored hue wheel,
 * the tone ramp, the hex lattice metrics, the three-rhombus cube faces and
 * their brightness multipliers, the per-face Munker stripe angles, the
 * construct-in sweep and the ambient two-phase pulse.
 *
 * What changed is the substrate. Hex builds the field out of DOM: one absolutely
 * positioned div per hex plus three clip-path children, each running a CSS
 * animation. At hexfield's tile size that is ~1,400 animated, filtered,
 * background-image-scrolling elements, and Hex already had to walk that back
 * once ("Fix mobile crash: cut load, cap loops, tear down"). hexfield spends its
 * frame budget on the print canvas, the candidate search and synchronous neural
 * inference, so the field is drawn here into a single canvas instead:
 *
 *   - one fill per face (~3 per hex) for colour, and
 *   - one pattern fill for every stripe on screen, because the lattice is
 *     periodic and Hex's stripes are per-face-local, so a single period of the
 *     finished stripe layer tiles the whole field (see buildPatterns).
 *
 * That is ~1.5k cheap path fills plus two full-surface blits, rather than ~1.4k
 * animated DOM nodes, and it degrades by dropping cells rather than by dropping
 * the tab.
 *
 * No dependencies, no build step, no globals beyond `window.HexfieldIso` — the
 * page is served byte-for-byte as it sits in the repository.
 */
(function (global) {
  "use strict";

  /* ── Hex's wheel colour pipeline, carried over verbatim ─────────────────── */

  const mod = (n, m) => ((n % m) + m) % m;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* Where each named primary sits on the wheel (degrees). Hex's defaults put
   * yellow at the top with magenta and cyan 120 degrees away; the RGB inverses
   * are derived rather than stored so the wheel stays additively consistent
   * however the anchors are moved. */
  const ANCHORS = { Y: 90, M: 330, C: 210, rot: 0 };

  function calibratedAnchors(anchors) {
    const a = anchors || ANCHORS;
    const Y = mod(a.Y + a.rot, 360);
    const M = mod(a.M + a.rot, 360);
    const C = mod(a.C + a.rot, 360);
    // Additive (RGB) inverses sit 180 degrees opposite each CMY anchor.
    const B = mod(Y + 180, 360);
    const G = mod(M + 180, 360);
    const R = mod(C + 180, 360);
    return [
      { name: "Y", a: Y, rgb: [255, 255, 0] },
      { name: "G", a: G, rgb: [0, 255, 0] },
      { name: "C", a: C, rgb: [0, 255, 255] },
      { name: "B", a: B, rgb: [0, 0, 255] },
      { name: "M", a: M, rgb: [255, 0, 255] },
      { name: "R", a: R, rgb: [255, 0, 0] },
    ].sort((p, q) => p.a - q.a);
  }

  const DEFAULT_ANCHORS = calibratedAnchors(ANCHORS);

  function hueAtAngle(deg, anchors) {
    const list = anchors || DEFAULT_ANCHORS;
    deg = mod(deg, 360);
    for (let i = 0; i < list.length; i++) {
      const A = list[i];
      const B = list[(i + 1) % list.length];
      const span = mod(B.a - A.a, 360);
      const off = mod(deg - A.a, 360);
      if (off <= span) {
        const t = span === 0 ? 0 : off / span;
        return [
          Math.round(lerp(A.rgb[0], B.rgb[0], t)),
          Math.round(lerp(A.rgb[1], B.rgb[1], t)),
          Math.round(lerp(A.rgb[2], B.rgb[2], t)),
        ];
      }
    }
    return [255, 255, 255];
  }

  // Chroma scales toward neutral (50% grey), not toward white or black.
  function applyChroma(rgb, chromaPct) {
    const k = chromaPct / 100;
    return rgb.map((c) => Math.round(lerp(127.5, c, k)));
  }

  // Tone 0..100: 0 = black, 50 = full chroma, 100 = white. Additive ramp.
  function toneAdjust(rgb, tone) {
    if (tone <= 50) {
      const t = tone / 50;
      return rgb.map((c) => Math.round(c * t));
    }
    const t = (tone - 50) / 50;
    return rgb.map((c) => Math.round(c + (255 - c) * t));
  }

  function rgbAt(deg, tone, chroma, anchors) {
    return toneAdjust(applyChroma(hueAtAngle(deg, anchors), chroma == null ? 100 : chroma), tone);
  }

  /* ── Cube constants, carried over from the CSS ──────────────────────────── */

  /* Standard isometric lighting: key light upper-left, so the top face catches
   * sky, the right face catches sun and the left face is shadowed. These are
   * the full-page field's multipliers (`.mh-pxf-t/-r/-l` brightness filters),
   * which are pushed harder than the in-panel hue cube's 1.18/0.92/0.62 —
   * the page ground wants the cubes to read as solid geometry from across the
   * room, not as a subtle tint. */
  const FACE_BRIGHTNESS = { top: 1.55, right: 0.88, left: 0.48 };

  /* Each rhombus has natural axes matching the cube's perspective; stripes
   * parallel to those axes look painted onto the surface rather than laid over
   * it. Three distinct angles is what sells the 3D illusion. */
  const FACE_STRIPE_ANGLE = { top: 60, right: 120, left: 90 };

  /* Stripe drift, derived from the stripe angle rather than tabled beside it.
   *
   * This was {top:[69,-40], right:[69,40], left:[80,0]}, read off Hex's
   * mhBgFaceTop/Right/Left keyframes - a second table free to disagree with the
   * angles, which it did in two branches.
   *
   * A stripe pattern only appears to move perpendicular to its own lines;
   * motion along them is invisible. So the vector is determined by the angle,
   * not chosen. Measured against the three face angles, the hand-written
   * vectors were the negated stripe normal at 80px to within a rounding error -
   * correct, but by coincidence. `uniform` mode paired the top face's angle
   * with the left face's vector, 30 degrees apart, so half its travel could not
   * be seen; `grid` gave two crosshatched families one vector, freezing the
   * horizontal set on the left face entirely.
   *
   * One table now, and every set of lines travels square-on to itself. */
  const DRIFT_DISTANCE = 80;
  function stripeDrift(angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    // Stripe normal is the rotated y axis, (-sin, cos); travel is its negation.
    return [Math.sin(rad) * DRIFT_DISTANCE, -Math.cos(rad) * DRIFT_DISTANCE];
  }
  const DRIFT_PERIOD = 9; // seconds, `--mh-face-speed`
  // Distinct stripe offsets rendered across one drift cycle. See
  // updateStripeSprite: this is a cache granularity, not a frame rate.
  const DRIFT_STEPS = 72;

  /* Lattice metrics. A pointy-top hex of width `size` is `size / 0.866` tall,
   * rows overlap at three quarters of that height, and the +2px on each step is
   * the mortar line that keeps adjacent cubes from fusing into one mass. */
  const TILE_SIZE = 80;
  const HEX_ASPECT = 0.866;
  const MORTAR = 2;

  // Ambient pulse, from @keyframes mhPxPulse / mhPxPulseB.
  const PULSE_A = { period: 4, from: 0.55, to: 0.88 };
  const PULSE_B = { period: 6, from: 0.42, to: 0.72 };
  const PULSE_STAGGER = 0.04; // seconds per diagonal step
  const PULSE_STAGGER_MAX = 2.4;

  // Construct-in sweep, from @keyframes mhTileSpawn.
  const SPAWN_DURATION = 0.46;

  /* Cells are cheap but not free, and a phone asked to draw a desktop's worth of
   * them is the failure Hex hit. The tile size grows until the lattice fits in
   * the budget, so a small screen gets bigger cubes rather than a stalled one. */
  const CELL_BUDGET = 620;

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeSpawn = (t) => 1 - Math.pow(1 - t, 3);

  function tintFace(rgb, mul) {
    return [
      Math.min(255, Math.round(rgb[0] * mul)),
      Math.min(255, Math.round(rgb[1] * mul)),
      Math.min(255, Math.round(rgb[2] * mul)),
    ];
  }

  /* ── The line patterns ───────────────────────────────────────────────────
   *
   * Hex's Munker system, ported whole. It was previously reduced to a single
   * thin white stripe, which is one setting out of a space the studio can
   * actually move through - and moving through it is the point, because the
   * taste model picks from it (see chooser, and syncIsoPattern in index.html).
   *
   * The illusion the system is named for: identical colours read as different
   * hues depending on the lines laid over them. On a cube field that also does
   * the ordinary work of making three flat rhombi read as three surfaces, since
   * each face carries its stripes on its own axis.
   *
   * `pattern` names a colour pair rather than a colour. A and B are the wheel's
   * own - the field's hue and its additive complement - so a pattern stays in
   * the palette however the ground is re-tinted, which a literal colour could
   * not do. */
  const PATTERN_NAMES = ["white", "black", "bw", "A", "B", "AB", "comp"];
  const PATTERN_MODES = ["off", "lines", "grid"];
  /* Which way the lines travel. `face` is Hex's own arrangement - each of the
   * three surfaces scrolls along its own axis, which is most of what stops a
   * cube reading as one flat plane. `uniform` scrolls all three together, so
   * the field slides as a single sheet behind the lattice. They look nothing
   * alike, and the direction sign reverses either of them. */
  const PATTERN_AXES = ["face", "uniform"];

  const DEFAULT_PATTERN = {
    mode: "lines",
    pattern: "white",
    thickness: 1.5,
    spacing: 6.5,
    opacity: 0.1,
    // Seconds for one drift cycle, Hex's `--mh-face-speed`.
    speed: DRIFT_PERIOD,
    direction: 1,
    axis: "face",
    /* Single-cube colour slots.
     *
     * `slotInk` names a colour pair the same way `pattern` does, and a slotted
     * cube is painted flat in it - no lines, no face lighting. One cell of one
     * colour in a field of shaded geometry is the strongest mark this surface
     * can make without changing what it is, and it is deliberately a *count*
     * rather than a probability: the field has to stay legible as a ground, and
     * a slot density that scaled with the viewport would put a phone and a
     * desktop in different pictures. Null means none. */
    slotInk: null,
    slotCount: 0,
  };

  function normalisePattern(next, base) {
    const from = base || DEFAULT_PATTERN;
    const cfg = next || {};
    return {
      mode: PATTERN_MODES.indexOf(cfg.mode) >= 0 ? cfg.mode : from.mode,
      pattern: PATTERN_NAMES.indexOf(cfg.pattern) >= 0 ? cfg.pattern : from.pattern,
      thickness: Number.isFinite(cfg.thickness) ? clamp(cfg.thickness, 0.5, 14) : from.thickness,
      // Zero spacing is meaningful, not a missing value: with two different
      // colours it is what produces solid alternating bands with no ground
      // showing between them.
      spacing: Number.isFinite(cfg.spacing) ? clamp(cfg.spacing, 0, 40) : from.spacing,
      opacity: Number.isFinite(cfg.opacity) ? clamp(cfg.opacity, 0, 1) : from.opacity,
      speed: Number.isFinite(cfg.speed) ? clamp(cfg.speed, 0.5, 120) : from.speed,
      direction: Number(cfg.direction) < 0 ? -1 : Number(cfg.direction) > 0 ? 1 : from.direction,
      axis: PATTERN_AXES.indexOf(cfg.axis) >= 0 ? cfg.axis : from.axis,
      // Explicit null clears the slots; undefined keeps whatever was there.
      slotInk: cfg.slotInk === null ? null
        : PATTERN_NAMES.indexOf(cfg.slotInk) >= 0 ? cfg.slotInk : from.slotInk,
      slotCount: Number.isFinite(cfg.slotCount)
        ? Math.round(clamp(cfg.slotCount, 0, 64)) : from.slotCount,
    };
  }

  /* The two line colours for a pattern name. `hue`/`tone` are the ground's, so
   * A and B track it. */
  function patternColours(cfg, hue, tone, chroma) {
    const A = rgbAt(hue, tone, chroma);
    const B = rgbAt(mod(hue + 180, 360), tone, chroma);
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    switch (cfg.pattern) {
      case "black": return [black, black];
      case "bw": return [white, black];
      case "A": return [A, A];
      case "B": return [B, B];
      case "AB": return [A, B];
      // The additive complement is B on this wheel, so `comp` is B on both
      // lines where `AB` alternates between the two.
      case "comp": return [B, B];
      default: return [white, white];
    }
  }

  /* One period of the pattern as a tile, to be used as a repeating fill.
   *
   * The three cases are Hex's, and they are visually distinct rather than
   * three spellings of one thing:
   *   - spacing 0 with two colours: solid alternating bands, no ground between.
   *   - two colours with spacing: both lines within one period, ground showing.
   *   - one colour: the ordinary stripe.
   * `s` is floored at thickness + 1 so a gap narrower than the line cannot
   * collapse the period to nothing and produce a solid block. */
  function buildStripeTile(doc, cfg, hue, tone, chroma, scale) {
    const [c1, c2] = patternColours(cfg, hue, tone, chroma);
    const alt = c1[0] !== c2[0] || c1[1] !== c2[1] || c1[2] !== c2[2];
    const noGapAlt = cfg.spacing === 0 && alt;
    const t = cfg.thickness;
    const s = noGapAlt ? t : Math.max(t + 1, cfg.spacing + t);
    const period = noGapAlt ? 2 * t : alt ? 2 * s : s;

    const px = (v) => Math.max(1, Math.round(v * scale));
    const tileH = Math.max(2, Math.round(period * scale));
    const line = px(t);
    const tile = doc.createElement("canvas");
    tile.width = 8;
    tile.height = tileH;
    const c = tile.getContext("2d");
    if (!c) return tile;
    c.globalAlpha = cfg.opacity;
    const paint = (colour, y, h) => {
      c.fillStyle = "rgb(" + colour[0] + "," + colour[1] + "," + colour[2] + ")";
      c.fillRect(0, y, 8, h);
    };
    if (noGapAlt) {
      paint(c1, 0, line);
      paint(c2, line, tileH - line);
    } else if (alt) {
      paint(c1, 0, line);
      paint(c2, Math.round(s * scale), line);
    } else {
      paint(c1, 0, line);
    }
    return tile;
  }

  /* ── The field ──────────────────────────────────────────────────────────── */

  function mount(options) {
    const opts = options || {};
    const doc = opts.document || global.document;
    const canvas = typeof opts.canvas === "string" ? doc.getElementById(opts.canvas) : opts.canvas;
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const state = {
      /* Where the left edge of the lattice sits on the wheel. The sweep is a
       * full 360 across the page either way, so this rotates which hue lands
       * where rather than narrowing the range — the studio's current palette
       * turns the whole ground without ever flattening it to one colour. */
      hueOffset: Number.isFinite(opts.hue) ? opts.hue : 0,
      chroma: Number.isFinite(opts.chroma) ? opts.chroma : 100,
      /* Hex's page field runs a vivid 35..65 tone band because there it *is*
       * the artwork. Here it sits behind a print that has to stay the subject,
       * so the band is darker by default and the whole field is composited
       * under an opacity. Both are options, not decisions baked into the port. */
      toneTop: Number.isFinite(opts.toneTop) ? opts.toneTop : 44,
      toneBottom: Number.isFinite(opts.toneBottom) ? opts.toneBottom : 22,
      opacity: Number.isFinite(opts.opacity) ? opts.opacity : 0.72,
      // `stripes: false` is the same thing as pattern mode "off"; both are kept
      // because the first is what a caller who wants a plain lattice reaches
      // for, and the second is what the pattern space itself contains.
      stripes: opts.stripes !== false,
      pattern: normalisePattern(opts.pattern),
      /* A radial hole in the middle of the field. The print is centred and the
       * lattice would otherwise compete with it edge to edge; darkening the
       * centre lets the field own the margins, which is where the dead flat
       * background used to be.
       *
       * The radius is a fraction of the viewport diagonal rather than of its
       * larger side, which is what keeps the fade off the margins. Scaled to
       * the width it reached the left and right edges on a 16:10 screen and
       * drained exactly the region this whole change exists to fill. */
      centreFade: Number.isFinite(opts.centreFade) ? opts.centreFade : 0.55,
      centreFadeRadius: Number.isFinite(opts.centreFadeRadius) ? opts.centreFadeRadius : 0.3,
      /* Nothing in the field moves quickly. The ambient pulse is a 4-6 second
       * opacity drift and the stripes scroll a 6px texture over 9 seconds, so
       * the redraw rate is set by what those need to read as continuous, not by
       * the display. Measured on a software rasteriser at 1920x1080 a full draw
       * is ~28ms; at 20fps that leaves the studio's own canvas, candidate search
       * and neural inference the majority of every second, which is the right
       * split for a background. Hardware canvas is far cheaper again. */
      fps: Number.isFinite(opts.fps) ? opts.fps : 20,
      tileSize: Number.isFinite(opts.tileSize) ? opts.tileSize : TILE_SIZE,
    };

    const motionQuery =
      typeof global.matchMedia === "function"
        ? global.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    let reducedMotion = !!(motionQuery && motionQuery.matches);

    let lattice = null;
    let stripePatterns = null;
    /* One cube's worth of stripes, drawn once per frame and stamped per cell.
     *
     * The obvious canvas translation of Hex's stripes - accumulate every top
     * face into one path and fill it with a rotated pattern - measured at
     * +100ms per frame at 1920x1080, because a rotated pattern fill over a
     * 500-rhombus path drops out of the fast path entirely.
     *
     * It was also wrong. In Hex every face is its own element and
     * `background-position` is resolved against that element, so the stripes
     * restart at each face's own origin rather than running continuously across
     * the field. Per-face-local is what the original does, and it means all
     * ~520 cubes wear the identical stripe sprite: build it once at tile size,
     * blit it per cell, and the pass costs three small pattern fills instead of
     * three enormous ones. */
    let stripeSprite = null;
    let stripeSpriteCtx = null;
    let stripePeriod = null;
    let stripePeriodCtx = null;
    let stripeFill = null;
    let lastDriftStep = -1;
    // The centre fade is a full-viewport gradient. Rasterising it per frame cost
    // another +16ms, and it only changes on resize, so it is baked once.
    let fadeLayer = null;
    let dpr = 1;
    let raf = 0;
    let lastDraw = 0;
    let startTime = 0;
    let running = false;
    /* Hex's `.mh-bg-pulse` class: a short, whole-field surge used to mark that
     * something was generated. Held as a decaying scalar rather than a class so
     * it can overlap with the ambient pulse instead of overriding it. */
    let surge = 0;
    let surgeAt = 0;

    function buildLattice() {
      const w = canvas.clientWidth || global.innerWidth || 1;
      const h = canvas.clientHeight || global.innerHeight || 1;

      let size = state.tileSize;
      let cols;
      let rows;
      let hexH;
      let rowStep;
      let colStep;
      // Grow the tile until the lattice fits the budget. Ten passes is far more
      // headroom than any real viewport needs; the cap just stops the loop from
      // depending on the arithmetic never stalling.
      for (let attempt = 0; attempt < 10; attempt++) {
        hexH = size / HEX_ASPECT;
        rowStep = hexH * 0.75 + MORTAR;
        colStep = size + MORTAR;
        cols = Math.ceil(w / colStep) + 2;
        rows = Math.ceil((h + 200) / rowStep) + 2;
        if (cols * rows <= CELL_BUDGET) break;
        size = Math.round(size * 1.18);
      }

      const cells = [];
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? colStep * 0.5 : 0;
        for (let c = 0; c < cols; c++) {
          const delay = Math.min(PULSE_STAGGER_MAX, (r + c) * PULSE_STAGGER);
          cells.push({
            x: c * colStep + off,
            y: r * rowStep,
            // Hue sweeps left to right across the page, tone runs bottom to
            // top — the same mapping Hex's hex view gives the hue cube, so the
            // page ground is literally a slice of the cube laid flat.
            hue: (c / Math.max(1, cols - 1)) * 360,
            toneT: 1 - r / Math.max(1, rows - 1),
            phase: (r + c) % 2,
            delay: delay,
          });
        }
      }

      lattice = {
        cells: cells,
        size: size,
        hexH: hexH,
        cols: cols,
        rows: rows,
        // The lattice's period, which the stripe layer is tiled against.
        colStep: colStep,
        rowStep: rowStep,
        // Face outlines in tile-local coordinates. The hexagon's silhouette is
        // the union of the three: a cube seen down its main diagonal.
        faces: {
          top: [
            [0.5 * size, 0],
            [size, 0.25 * hexH],
            [0.5 * size, 0.5 * hexH],
            [0, 0.25 * hexH],
          ],
          right: [
            [size, 0.25 * hexH],
            [size, 0.75 * hexH],
            [0.5 * size, hexH],
            [0.5 * size, 0.5 * hexH],
          ],
          left: [
            [0, 0.25 * hexH],
            [0.5 * size, 0.5 * hexH],
            [0.5 * size, hexH],
            [0, 0.75 * hexH],
          ],
        },
      };
    }

    function buildPatterns() {
      stripePatterns = null;
      stripeSprite = null;
      stripeSpriteCtx = null;
      stripePeriod = null;
      stripePeriodCtx = null;
      stripeFill = null;
      lastDriftStep = -1;
      if (!state.stripes || !lattice || state.pattern.mode === "off") return;

      const sprite = doc.createElement("canvas");
      sprite.width = Math.max(1, Math.ceil(lattice.size * dpr));
      sprite.height = Math.max(1, Math.ceil(lattice.hexH * dpr));
      const sctx = sprite.getContext("2d");
      if (!sctx) return;

      /* The lines take their colour from the middle of the ground's own tone
       * band, so an A or B pattern sits in the palette the cubes are already
       * wearing rather than beside it. */
      const tile = buildStripeTile(
        doc,
        state.pattern,
        state.hueOffset,
        (state.toneTop + state.toneBottom) / 2,
        state.chroma,
        dpr
      );
      const patterns = {};
      for (const face of ["top", "right", "left"]) {
        const pattern = sctx.createPattern(tile, "repeat");
        if (!pattern) return;
        patterns[face] = pattern;
      }
      stripePatterns = patterns;
      stripeSprite = sprite;
      stripeSpriteCtx = sctx;

      /* The lattice repeats every column and every two rows, so the finished
       * stripe layer is itself a tiling texture: one period of it, used as a
       * pattern, reproduces the stripes over the entire field.
       *
       * Blitting the sprite per cube was the previous approach and cost a whole
       * 16ms frame at 1920x1080 - 520 alpha-blended draws covering roughly twice
       * the screen. This is one fill instead, and compositing it `source-atop`
       * means the stripes land only where cubes were already drawn and are
       * modulated by each cube's own alpha, so the ambient pulse still shows
       * through without a single per-cell operation. */
      const period = doc.createElement("canvas");
      period.width = Math.max(1, Math.ceil(lattice.colStep * dpr));
      period.height = Math.max(1, Math.ceil(lattice.rowStep * 2 * dpr));
      const pctx = period.getContext("2d");
      if (!pctx) return;
      stripePeriod = period;
      stripePeriodCtx = pctx;
    }

    /* Redraw one lattice period from the current sprite. Hexes are taller than
     * the row step, so neighbouring rows overlap into this tile and have to be
     * drawn for the seams to close when it repeats. */
    function updateStripePeriod() {
      if (!stripePeriod || !stripeSprite) return;
      const pctx = stripePeriodCtx;
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      pctx.clearRect(0, 0, stripePeriod.width, stripePeriod.height);
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let r = -2; r <= 3; r++) {
        const off = mod(r, 2) ? lattice.colStep * 0.5 : 0;
        for (let c = -1; c <= 1; c++) {
          pctx.drawImage(
            stripeSprite,
            c * lattice.colStep + off,
            r * lattice.rowStep,
            lattice.size,
            lattice.hexH
          );
        }
      }
      stripeFill = ctx.createPattern(stripePeriod, "repeat");
      if (stripeFill && stripeFill.setTransform) {
        stripeFill.setTransform(new global.DOMMatrix().scale(1 / dpr, 1 / dpr));
      }
    }

    /* Redraw the one cube's stripes for this frame's drift. Each face gets its
     * own angle and its own scroll direction, which is what stops the three
     * surfaces of a cube from reading as one flat plane. */
    function updateStripeSprite(drift) {
      if (!stripeSprite || !stripePatterns) return;
      /* Quantised, and then skipped when the step has not moved. The drift is a
       * 9-second scroll of a 6px stripe; resolving it to a fraction of a pixel
       * every frame buys nothing visible and costs three clipped pattern fills
       * each time. At this many steps the sprite is rebuilt a few times a second
       * and the motion still reads as continuous. */
      const step = mod(Math.round(drift * DRIFT_STEPS), DRIFT_STEPS);
      if (step === lastDriftStep) return;
      lastDriftStep = step;
      drift = step / DRIFT_STEPS;
      const sctx = stripeSpriteCtx;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, stripeSprite.width, stripeSprite.height);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const grid = state.pattern.mode === "grid";
      const uniform = state.pattern.axis === "uniform";
      const dir = state.pattern.direction < 0 ? -1 : 1;
      for (const face of ["top", "right", "left"]) {
        const pts = lattice.faces[face];
        sctx.save();
        sctx.beginPath();
        sctx.moveTo(pts[0][0], pts[0][1]);
        for (let p = 1; p < pts.length; p++) sctx.lineTo(pts[p][0], pts[p][1]);
        sctx.closePath();
        sctx.clip();
        /* Grid crosshatches each face at 0 and 90 instead of laying one set of
         * lines along the face's own axis. It reads as a woven surface rather
         * than a brushed one, and it deliberately gives up some of the per-face
         * 3D cue - which is Hex's behaviour, where grid mode ignores the passed
         * angle entirely because a per-face grid is not meaningful. */
        /* `uniform` gives every face the top face's angle, so the three
         * surfaces move as one sheet instead of three. */
        const angles = grid ? [0, 90] : [uniform ? FACE_STRIPE_ANGLE.top : FACE_STRIPE_ANGLE[face]];
        for (const angle of angles) {
          // Perpendicular to this set of lines, so all of the travel is visible.
          const [dx, dy] = stripeDrift(angle);
          stripePatterns[face].setTransform(
            new global.DOMMatrix()
              .translate(dx * drift * dir, dy * drift * dir)
              .rotate(angle)
              .scale(1 / dpr, 1 / dpr)
          );
          sctx.fillStyle = stripePatterns[face];
          sctx.fillRect(0, 0, lattice.size, lattice.hexH);
        }
        sctx.restore();
      }
      updateStripePeriod();
    }

    function buildFadeLayer() {
      fadeLayer = null;
      if (!(state.centreFade > 0)) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      if (!(w > 0 && h > 0)) return;
      const layer = doc.createElement("canvas");
      layer.width = Math.max(1, Math.round(w));
      layer.height = Math.max(1, Math.round(h));
      const lctx = layer.getContext("2d");
      if (!lctx) return;
      const outer = Math.hypot(w, h) * state.centreFadeRadius;
      const grad = lctx.createRadialGradient(w / 2, h / 2, outer * 0.15, w / 2, h / 2, outer);
      grad.addColorStop(0, "rgba(8,8,12," + state.centreFade + ")");
      grad.addColorStop(0.6, "rgba(8,8,12," + state.centreFade * 0.42 + ")");
      grad.addColorStop(1, "rgba(8,8,12,0)");
      lctx.fillStyle = grad;
      lctx.fillRect(0, 0, w, h);
      fadeLayer = layer;
    }

    function resize() {
      const w = canvas.clientWidth || global.innerWidth || 1;
      const h = canvas.clientHeight || global.innerHeight || 1;
      // Capped: the field is soft-edged geometry, not type, and a retina phone
      // gains nothing from 3x here except a third of its frame budget.
      dpr = Math.min(global.devicePixelRatio || 1, 1.75);
      const pw = Math.max(1, Math.round(w * dpr));
      const ph = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      buildLattice();
      buildPatterns();
      buildFadeLayer();
    }

    function cellAlpha(cell, t) {
      if (reducedMotion) return (PULSE_A.from + PULSE_A.to) / 2;
      const pulse = cell.phase ? PULSE_B : PULSE_A;
      // CSS `alternate` is a triangle wave over two periods, and the negative
      // animation-delay Hex uses to stagger the field is just a phase offset.
      const cycle = mod((t + cell.delay) / pulse.period, 2);
      const tri = cycle <= 1 ? cycle : 2 - cycle;
      const base = lerp(pulse.from, pulse.to, easeInOut(tri));
      return surge > 0 ? lerp(base, 1, surge) : base;
    }

    function spawnAt(cell, t) {
      if (reducedMotion) return 1;
      const local = t - cell.delay;
      if (local >= SPAWN_DURATION) return 1;
      if (local <= 0) return 0;
      return easeSpawn(local / SPAWN_DURATION);
    }

    function draw(now) {
      if (!lattice) return;
      const t = (now - startTime) / 1000;

      if (surge > 0) {
        // ~0.55s decay, matching the length of Hex's .mh-bg-pulse burst.
        surge = Math.max(0, 1 - (now - surgeAt) / 550);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const cells = lattice.cells;
      const visible = [];

      /* Pass 1: colour. Every cell needs its own fill because every cell has its
       * own hue, tone and pulse phase — this is the only genuinely per-cell
       * work in the frame. */
      ctx.globalAlpha = 1;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const spawn = spawnAt(cell, t);
        if (spawn <= 0.004) continue;
        const alpha = cellAlpha(cell, t) * spawn * state.opacity;
        if (alpha <= 0.004) continue;
        cell._a = alpha;
        visible.push(cell);

        const tone = lerp(state.toneBottom, state.toneTop, cell.toneT);
        const rgb = rgbAt(cell.hue + state.hueOffset, tone, state.chroma);
        const y = cell.y;
        // The spawn sweep lifts each tile off the floor as it scales up, so the
        // field builds itself along the same diagonal its pulse is staggered by.
        const rise = spawn < 1 ? (1 - spawn) * lattice.hexH * 0.4 : 0;

        ctx.save();
        if (rise) ctx.translate(0, rise);
        for (const face of ["top", "right", "left"]) {
          const tinted = tintFace(rgb, FACE_BRIGHTNESS[face]);
          const pts = lattice.faces[face];
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgb(" + tinted[0] + "," + tinted[1] + "," + tinted[2] + ")";
          ctx.beginPath();
          ctx.moveTo(cell.x + pts[0][0], y + pts[0][1]);
          for (let p = 1; p < pts.length; p++) ctx.lineTo(cell.x + pts[p][0], y + pts[p][1]);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      /* Pass 2: stripes — a single fill of one lattice period, clipped to the
       * cubes by `source-atop` and modulated by their alpha as a side effect of
       * it. The stripes stay lattice-aligned through the construct-in sweep
       * while the cubes themselves rise into place, which is invisible at a 6px
       * stripe over a 0.46s intro and costs nothing to allow. */
      if (stripeSprite && visible.length) {
        const period = state.pattern.speed || DRIFT_PERIOD;
        updateStripeSprite(reducedMotion ? 0 : mod(t, period) / period);
        if (stripeFill) {
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = stripeFill;
          ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
          ctx.globalCompositeOperation = "source-over";
        }
      }

      /* Pass 2b: the colour slots.
       *
       * A handful of individual cubes painted flat in the slot ink, over the
       * top of the lines rather than under them, so a slot is one solid colour
       * and not a shaded cube wearing stripes. The point is a cell that reads
       * as a *pixel* - the field's smallest possible mark - and shading or
       * striping it merges it straight back into the lattice.
       *
       * Drawn per cube, which the stripe layer deliberately is not. That is
       * affordable only because the count is capped at a few dozen: the whole
       * reason the stripes are one periodic fill is that ~520 per-cube blits
       * cost a 16ms frame, and this pass has to stay two orders of magnitude
       * under that. It is also why slots are a count rather than a density -
       * a probability would scale with the cell budget and put a desktop back
       * in the per-cube regime the port exists to avoid.
       *
       * Which cubes is a hash of the address, not a draw from the frame's rng,
       * so the slots hold still between frames instead of flickering. */
      const slotInk = state.pattern.slotInk;
      const slotCount = Math.min(state.pattern.slotCount | 0, visible.length);
      if (slotInk && slotCount > 0) {
        const tone = (state.toneTop + state.toneBottom) / 2;
        const [ink] = patternColours({ pattern: slotInk }, state.hueOffset, tone, state.chroma);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgb(" + ink[0] + "," + ink[1] + "," + ink[2] + ")";
        const stride = Math.max(1, Math.floor(visible.length / slotCount));
        for (let s = 0; s < slotCount; s++) {
          const cell = visible[(s * stride + (s * 7919) % stride) % visible.length];
          // The slot fades in with its cube rather than appearing at full
          // strength on a tile that has not finished arriving.
          ctx.globalAlpha = Math.min(1, cell._a / Math.max(0.001, state.opacity));
          for (const face of ["top", "right", "left"]) {
            const pts = lattice.faces[face];
            ctx.beginPath();
            ctx.moveTo(cell.x + pts[0][0], cell.y + pts[0][1]);
            for (let p = 1; p < pts.length; p++) ctx.lineTo(cell.x + pts[p][0], cell.y + pts[p][1]);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      /* Pass 3: the centre fade, blitted from the layer baked at resize.
       * Painted into the field rather than laid over it as an element, so it
       * composites against the field's own alpha instead of also dimming
       * whatever the page puts on top. */
      if (fadeLayer) {
        ctx.globalAlpha = 1;
        ctx.drawImage(fadeLayer, 0, 0);
      }

      ctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      const interval = 1000 / Math.max(1, state.fps);
      if (now - lastDraw >= interval - 1) {
        lastDraw = now;
        draw(now);
      }
      // A settled field under reduced motion has nothing left to animate, so
      // the loop stops instead of repainting an identical frame forever.
      if (reducedMotion && now - startTime > (SPAWN_DURATION + PULSE_STAGGER_MAX) * 1000) {
        running = false;
        return;
      }
      raf = global.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      lastDraw = 0;
      if (!startTime) startTime = global.performance ? global.performance.now() : Date.now();
      raf = global.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0;
    }

    let resizeTimer = 0;
    function onResize() {
      global.clearTimeout(resizeTimer);
      resizeTimer = global.setTimeout(() => {
        resize();
        if (!running) start();
        else draw(global.performance ? global.performance.now() : Date.now());
      }, 140);
    }

    function onVisibility() {
      if (doc.hidden) stop();
      else start();
    }

    function onMotionChange(event) {
      reducedMotion = !!event.matches;
      start();
    }

    global.addEventListener("resize", onResize);
    doc.addEventListener("visibilitychange", onVisibility);
    if (motionQuery) {
      if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
    }

    resize();
    startTime = global.performance ? global.performance.now() : Date.now();
    start();

    return {
      /* The studio calls this on every accepted render, so the ground carries
       * the same hue the print does. Only the wheel offset moves — the sweep
       * still spans the full circle, so the field stays a spectrum rather than
       * collapsing to a single tint. */
      setPalette(next) {
        if (!next) return;
        if (Number.isFinite(next.hue)) state.hueOffset = mod(next.hue, 360);
        if (Number.isFinite(next.chroma)) state.chroma = clamp(next.chroma, 0, 100);
        if (Number.isFinite(next.toneTop)) state.toneTop = clamp(next.toneTop, 0, 100);
        if (Number.isFinite(next.toneBottom)) state.toneBottom = clamp(next.toneBottom, 0, 100);
        if (Number.isFinite(next.opacity)) state.opacity = clamp(next.opacity, 0, 1);
        if (!running) start();
      },
      /* Change the lines playing over the cubes. The whole pattern space is
       * reachable from here, which is what lets the studio's taste model pick a
       * point in it rather than the module hard-coding one. */
      setPattern(next) {
        state.pattern = normalisePattern(next, state.pattern);
        buildPatterns();
        if (!running) start();
        else lastDriftStep = -1;
      },
      get pattern() {
        return Object.assign({}, state.pattern);
      },
      // Hex's .mh-bg-pulse, as a decaying scalar: the field flares once when the
      // studio commits to a new field, then settles back into its ambient pulse.
      surge() {
        surge = 1;
        surgeAt = global.performance ? global.performance.now() : Date.now();
        if (!running) start();
      },
      state: state,
      get cellCount() {
        return lattice ? lattice.cells.length : 0;
      },
      get tileSize() {
        return lattice ? lattice.size : state.tileSize;
      },
      start: start,
      stop: stop,
      destroy() {
        stop();
        global.removeEventListener("resize", onResize);
        doc.removeEventListener("visibilitychange", onVisibility);
        if (motionQuery) {
          if (motionQuery.removeEventListener) motionQuery.removeEventListener("change", onMotionChange);
          else if (motionQuery.removeListener) motionQuery.removeListener(onMotionChange);
        }
      },
    };
  }

  /* ── Boards ──────────────────────────────────────────────────────────────
   *
   * The page ground is one use of this geometry; the studio's simulations are
   * the other. A board is a small, explicitly sized lattice drawn into a canvas
   * of its own, where each cell carries a colour and a *lift* - the cube
   * extruded upward on its own axis, side faces stretching to the ground.
   *
   * Lift is what makes the isometric projection worth using for a simulation
   * rather than decorative. A flat grid of tinted hexes can only encode one
   * value per cell in colour; extruding it means a cube's height reads as
   * magnitude at a glance, from across a room, with no legend - which is the
   * whole reason isometric charts exist. The studio has two things that want
   * exactly that: a population of candidates with scores, and a render's
   * luminance as a surface.
   *
   * Boards are deliberately pull-based and stateless. They own no timer and no
   * data; the caller paints when it has something new to show. A simulation
   * that stalls therefore leaves its last frame standing rather than animating
   * over nothing, which is the honest reading of a stalled simulation. */
  function board(canvasRef, options) {
    const opts = options || {};
    const doc = opts.document || global.document;
    const canvas = typeof canvasRef === "string" ? doc.getElementById(canvasRef) : canvasRef;
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let cols = Math.max(1, Math.round(opts.cols || 6));
    let rows = Math.max(1, Math.round(opts.rows || 4));
    const chroma = Number.isFinite(opts.chroma) ? opts.chroma : 100;
    // How much of the cell's height a full lift is worth. Past about a hexagon's
    // own height the columns occlude the rows behind them and the board stops
    // being readable, which is the ceiling this is set under.
    const liftRatio = Number.isFinite(opts.liftRatio) ? opts.liftRatio : 0.55;
    const stripes = opts.stripes !== false;
    let pattern = normalisePattern(opts.pattern);
    // Where an A/B pattern takes its colour from on a board, whose cells carry
    // their own unrelated hues rather than the page's single sweep.
    let patternHue = Number.isFinite(opts.patternHue) ? opts.patternHue : 210;

    let metrics = null;

    function measure() {
      const w = canvas.width;
      const h = canvas.height;
      /* Fit the lattice to the canvas rather than the other way round: these
       * panels have fixed boxes in the sidebar, and a board that sized itself
       * would be cropped by them without saying so. */
      const byWidth = w / (cols + 0.5);
      // Rows overlap at 3/4 of a hexagon's height, plus the headroom the tallest
      // possible column needs above the back row.
      const byHeight = h / (((rows - 1) * 0.75 + 1) / HEX_ASPECT + liftRatio / HEX_ASPECT);
      const size = Math.max(4, Math.min(byWidth, byHeight));
      const hexH = size / HEX_ASPECT;
      const rowStep = hexH * 0.75;
      const colStep = size;
      const liftMax = hexH * liftRatio;
      const boardW = colStep * cols + colStep * 0.5;
      const boardH = rowStep * (rows - 1) + hexH;
      metrics = {
        size: size,
        hexH: hexH,
        rowStep: rowStep,
        colStep: colStep,
        liftMax: liftMax,
        // Centred, with the lift headroom reserved at the top so a full-height
        // column in the back row cannot run off the canvas.
        originX: (w - boardW) / 2,
        originY: (h - boardH - liftMax) / 2 + liftMax,
      };
    }

    /* One cube. `lift` extrudes it: the top face and the upper edges of both
     * side faces rise by `lift` while their lower edges stay on the ground, so
     * the sides stretch into the column's walls. */
    function cube(x, y, rgb, lift, alpha, mark) {
      const s = metrics.size;
      const h = metrics.hexH;
      const faces = {
        top: [
          [x + 0.5 * s, y - lift],
          [x + s, y + 0.25 * h - lift],
          [x + 0.5 * s, y + 0.5 * h - lift],
          [x, y + 0.25 * h - lift],
        ],
        right: [
          [x + s, y + 0.25 * h - lift],
          [x + s, y + 0.75 * h],
          [x + 0.5 * s, y + h],
          [x + 0.5 * s, y + 0.5 * h - lift],
        ],
        left: [
          [x, y + 0.25 * h - lift],
          [x + 0.5 * s, y + 0.5 * h - lift],
          [x + 0.5 * s, y + h],
          [x, y + 0.75 * h],
        ],
      };
      ctx.globalAlpha = alpha;
      for (const face of ["left", "right", "top"]) {
        const tinted = tintFace(rgb, FACE_BRIGHTNESS[face]);
        const pts = faces[face];
        ctx.fillStyle = "rgb(" + tinted[0] + "," + tinted[1] + "," + tinted[2] + ")";
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
        ctx.closePath();
        ctx.fill();
      }
      if (mark) {
        // The top face outlined in its own lit colour: enough to pick a cube out
        // of the field without adding a shape the projection does not have.
        const lit = tintFace(rgb, FACE_BRIGHTNESS.top * 1.5);
        const pts = faces.top;
        ctx.globalAlpha = Math.min(1, alpha + 0.25);
        ctx.strokeStyle = "rgb(" + lit[0] + "," + lit[1] + "," + lit[2] + ")";
        ctx.lineWidth = Math.max(1, s * 0.055);
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
        ctx.closePath();
        ctx.stroke();
      }
    }

    return {
      setSize(nextCols, nextRows) {
        cols = Math.max(1, Math.round(nextCols));
        rows = Math.max(1, Math.round(nextRows));
        metrics = null;
      },
      // Boards follow the ground's chosen pattern, so the whole page changes
      // material together rather than the panels keeping a stale one.
      setPattern(next, hue) {
        pattern = normalisePattern(next, pattern);
        if (Number.isFinite(hue)) patternHue = mod(hue, 360);
      },
      get cols() { return cols; },
      get rows() { return rows; },
      /* `cellFn(xi, yi)` returns the cube at that address, or null for a hole.
       * Either `rgb` or a `hue`/`tone` pair on the shared wheel; `lift` and
       * `alpha` are 0..1; `mark` outlines the top face. */
      paint(cellFn) {
        if (!metrics) measure();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        /* Back to front, top row first. Painter's algorithm is the whole depth
         * model here - a lifted cube has to cover the row behind it and be
         * covered by the row in front, and drawing in address order is what
         * makes that true without a z-buffer. */
        for (let yi = 0; yi < rows; yi++) {
          const off = yi % 2 ? metrics.colStep * 0.5 : 0;
          for (let xi = 0; xi < cols; xi++) {
            const cell = cellFn(xi, yi);
            if (!cell) continue;
            const rgb = cell.rgb
              ? cell.rgb
              : rgbAt(
                  Number.isFinite(cell.hue) ? cell.hue : 0,
                  Number.isFinite(cell.tone) ? cell.tone : 45,
                  Number.isFinite(cell.chroma) ? cell.chroma : chroma
                );
            cube(
              metrics.originX + xi * metrics.colStep + off,
              metrics.originY + yi * metrics.rowStep,
              rgb,
              clamp(Number(cell.lift) || 0, 0, 1) * metrics.liftMax,
              cell.alpha == null ? 1 : clamp(Number(cell.alpha), 0, 1),
              !!cell.mark
            );
          }
        }
        if (stripes && pattern.mode !== "off") {
          /* The same lines the page ground wears, so a board reads as cut from
           * the same material rather than as a chart that happens to be
           * isometric.
           *
           * One `source-atop` pass over everything already drawn, rather than
           * the per-face clipping the page field uses. A board's cubes are
           * extruded to different heights, so the per-face sprite that makes
           * the page field cheap cannot align here - and one composited pass
           * costs the same whatever the board contains. The trade is that the
           * lines run on one axis across the whole board instead of per face;
           * at this size the extrusion is already carrying the depth, and the
           * lines are texture rather than the 3D cue. */
          const tile = buildStripeTile(doc, pattern, patternHue, 45, chroma, 1);
          const fill = ctx.createPattern(tile, "repeat");
          if (fill) {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-atop";
            for (const angle of pattern.mode === "grid" ? [0, 90] : [FACE_STRIPE_ANGLE.top]) {
              if (fill.setTransform) fill.setTransform(new global.DOMMatrix().rotate(angle));
              ctx.fillStyle = fill;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.globalCompositeOperation = "source-over";
          }
        }
        ctx.globalAlpha = 1;
      },
    };
  }

  /* ── Samples ─────────────────────────────────────────────────────────────
   *
   * A patch of the ground's material drawn into an arbitrary canvas, so the
   * studio's taste model can look at a pattern before the page wears it. The
   * taste model judges observed pixels rather than parameters, so the only way
   * to ask it about a line pattern is to render one.
   *
   * Deliberately opaque and unpulsed: the live field breathes on a 4-6 second
   * cycle and sits under a global opacity, and a score that moved with the
   * phase of the pulse would rank whichever candidate happened to be sampled at
   * a bright moment. This draws the material, not the page. */
  function sample(canvasRef, options) {
    const opts = options || {};
    const doc = opts.document || global.document;
    const canvas = typeof canvasRef === "string" ? doc.getElementById(canvasRef) : canvasRef;
    if (!canvas || !canvas.getContext) return false;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;

    const cfg = normalisePattern(opts.pattern);
    const hue = Number.isFinite(opts.hue) ? opts.hue : 0;
    const chroma = Number.isFinite(opts.chroma) ? opts.chroma : 100;
    const toneTop = Number.isFinite(opts.toneTop) ? opts.toneTop : 44;
    const toneBottom = Number.isFinite(opts.toneBottom) ? opts.toneBottom : 22;
    const W = canvas.width;
    const H = canvas.height;

    const cols = Math.max(2, Math.round(opts.cols || 5));
    const size = W / (cols + 0.5);
    const hexH = size / HEX_ASPECT;
    const rowStep = hexH * 0.75;
    const rows = Math.max(2, Math.ceil(H / rowStep) + 1);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // The page's own ground colour behind the lattice, so the mortar lines the
    // taste model sees between cubes are the ones the page actually shows.
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, W, H);

    const faceFor = (x, y) => ({
      top: [[x + 0.5 * size, y], [x + size, y + 0.25 * hexH], [x + 0.5 * size, y + 0.5 * hexH], [x, y + 0.25 * hexH]],
      right: [[x + size, y + 0.25 * hexH], [x + size, y + 0.75 * hexH], [x + 0.5 * size, y + hexH], [x + 0.5 * size, y + 0.5 * hexH]],
      left: [[x, y + 0.25 * hexH], [x + 0.5 * size, y + 0.5 * hexH], [x + 0.5 * size, y + hexH], [x, y + 0.75 * hexH]],
    });

    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? size * 0.5 : 0;
      for (let c = 0; c < cols + 1; c++) {
        const x = c * size + off;
        const y = r * rowStep;
        // Same mapping as the page: hue sweeps across, tone runs bottom to top.
        const cellHue = hue + (c / Math.max(1, cols)) * 360;
        const tone = lerp(toneBottom, toneTop, 1 - r / Math.max(1, rows - 1));
        const rgb = rgbAt(cellHue, tone, chroma);
        const faces = faceFor(x, y);
        for (const face of ["left", "right", "top"]) {
          const tinted = tintFace(rgb, FACE_BRIGHTNESS[face]);
          const pts = faces[face];
          ctx.fillStyle = "rgb(" + tinted[0] + "," + tinted[1] + "," + tinted[2] + ")";
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (cfg.mode !== "off") {
      const tile = buildStripeTile(doc, cfg, hue, (toneTop + toneBottom) / 2, chroma, 1);
      const fill = ctx.createPattern(tile, "repeat");
      if (fill) {
        const grid = cfg.mode === "grid";
        // Per face, clipped, so each surface wears its lines on its own axis -
        // the same arrangement the live field uses.
        for (let r = 0; r < rows; r++) {
          const off = r % 2 ? size * 0.5 : 0;
          for (let c = 0; c < cols + 1; c++) {
            const faces = faceFor(c * size + off, r * rowStep);
            for (const face of ["left", "right", "top"]) {
              const pts = faces[face];
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(pts[0][0], pts[0][1]);
              for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
              ctx.closePath();
              ctx.clip();
              for (const angle of grid ? [0, 90] : [FACE_STRIPE_ANGLE[face]]) {
                if (fill.setTransform) fill.setTransform(new global.DOMMatrix().rotate(angle));
                ctx.fillStyle = fill;
                ctx.fillRect(0, 0, W, H);
              }
              ctx.restore();
            }
          }
        }
      }
    }

    /* The slots, on the sample too.
     *
     * Not optional. The whole argument for scoring a rendered patch rather than
     * the parameters is that the taste model judges observed pixels - so a
     * sample that left the slots out would have the model voting on a picture
     * the ground does not show, and the slot settings would be decided by
     * whatever they happened to correlate with. The sample is a patch, so the
     * count is scaled to the patch's share of the field's cell budget rather
     * than copied across whole. */
    if (cfg.slotInk && cfg.slotCount > 0) {
      const cells = rows * (cols + 1);
      const scaled = Math.max(1, Math.round(cfg.slotCount * (cells / CELL_BUDGET)));
      const [ink] = patternColours({ pattern: cfg.slotInk }, hue, (toneTop + toneBottom) / 2, chroma);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgb(" + ink[0] + "," + ink[1] + "," + ink[2] + ")";
      const stride = Math.max(1, Math.floor(cells / scaled));
      for (let s = 0; s < scaled; s++) {
        const index = (s * stride) % cells;
        const r = Math.floor(index / (cols + 1));
        const c = index % (cols + 1);
        const faces = faceFor(c * size + (r % 2 ? size * 0.5 : 0), r * rowStep);
        for (const face of ["left", "right", "top"]) {
          const pts = faces[face];
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    return true;
  }

  global.HexfieldIso = {
    mount: mount,
    board: board,
    sample: sample,
    normalisePattern: normalisePattern,
    patternColours: patternColours,
    PATTERN_NAMES: PATTERN_NAMES,
    PATTERN_MODES: PATTERN_MODES,
    PATTERN_AXES: PATTERN_AXES,
    DEFAULT_PATTERN: DEFAULT_PATTERN,
    rgbAt: rgbAt,
    hueAtAngle: hueAtAngle,
    calibratedAnchors: calibratedAnchors,
    tintFace: tintFace,
    FACE_BRIGHTNESS: FACE_BRIGHTNESS,
    FACE_STRIPE_ANGLE: FACE_STRIPE_ANGLE,
    TILE_SIZE: TILE_SIZE,
  };
})(typeof window !== "undefined" ? window : globalThis);
