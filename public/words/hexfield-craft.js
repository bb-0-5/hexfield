/* A craft dictionary: ways of painting, told as principles.
 * Three independent axes: the manner (how marks are made - below), the
 * dimensionality (how solid things are - DIMENSIONS) and the perspective
 * (where the viewer stands - PERSPECTIVES).
 * ---------------------------------------------------------------------------
 *
 * The visual dictionary (hexfield-visual.js) says what things look like. This
 * file says how a picture can be *made* - the studio knowledge a painter
 * carries about handling, not about any one painter. A heavy even outline
 * around flat colour, or smoke-soft edges on a dark warm ground, are ways of
 * working that whole traditions share; none of it is traced from a picture
 * and no entry is named after an artist.
 *
 * Each manner is a set of principles (said in words, for the readout and for
 * whoever edits this) and the settings that carry them out:
 *
 * reference - how the picture the brush works toward is reshaped
 *   saturation   multiplies colour away from grey (1 = as composed)
 *   warmth       shifts colour toward amber (+) or blue (-), in RGB steps
 *   keys         [low, high]: the value range the picture is squeezed into
 *   groundDark   0..1: how much the ground (away from the focus) is darkened
 *   light        0..1: a light falling from one side across the picture
 *   blur         0..1: soft edges, as a fraction of the short side (x 0.02);
 *                the focus keeps most of its edges
 *   palette      how many colours the palette is mixed down to
 *   snap         0..1: how far every colour is pulled onto its palette colour
 *                (1 = flat colour, no modelling at all)
 *   contour      0..1: an even outline around every shape, in brush widths
 *   twoTone      0..1: values pushed toward two, paper and ink
 *   flatGround   0..1: away from the focus and the named things, the ground
 *                settles to one colour (figures on a field, not a texture)
 *   chroma       0..1: value told by hue at full strength instead of by
 *                white and black (app.js, full chroma)
 *   lightHold    0..1: how much of the painting's light the brushwork puts
 *                back after the palette flattens it (lit warm and loaded,
 *                shade cool and thin)
 *
 * brush - how each stroke is laid
 *   alpha        opacity of a stroke (low = glazes that build up slowly)
 *   bristle      whether the stroke shows a bristle line inside it
 *   jitter       colour variation between strokes (high = broken colour)
 *   length       stroke length relative to the painter's default
 *   width        stroke width relative to the painter's default
 *   hatch        0..1: strokes keep one direction instead of following forms
 *   evenDetail   0..1: fine brushes work all over, not only at the focus
 *   round        round stroke ends (a marker or a loaded round brush)
 *   edgeStop     a stroke stops where the picture's colour differs from its
 *                own by more than this (0 = only the painter's usual rule)
 *
 * leans - which word qualities (hexfield-words.js axes) pull toward it, and
 * words that name it outright. Taste and votes decide the rest.
 */
(function (global) {
  "use strict";

  const MANNERS = {
    painterly: {
      name: "painterly",
      principles: [
        "visible strokes that follow the forms",
        "a few colours mixed on one palette",
        "detail gathered at the focus, the ground left broad",
      ],
      reference: {},
      brush: {},
      // The studio's own hand gets a small head start: the others have to
      // be wanted by the words, the taste or the votes to take over.
      base: 0.25,
      leans: {},
      words: [],
    },

    "bold-line": {
      name: "bold line",
      principles: [
        "flat colour with no modelling",
        "one heavy, even outline around every shape",
        "few colours, fully saturated",
        "the same energy all over the picture, no quiet ground",
      ],
      reference: { saturation: 1.45, keys: [18, 240], palette: 5, snap: 1, contour: 1, flatGround: 0.9, lightHold: 0.35 },
      brush: { alpha: 1, bristle: false, round: true, jitter: 0, length: 1.5, evenDetail: 0.85, edgeStop: 22 },
      leans: { pot: 0.6, ene: 0.4, con: 0.3 },
      words: ["pop", "cartoon", "comic", "neon", "graffiti", "dance", "party", "bold", "loud", "sign", "poster", "street"],
    },

    "soft-light": {
      name: "soft light",
      principles: [
        "edges dissolve like smoke; no lines anywhere",
        "light falls from one side and models every form",
        "a dark, warm ground with the light gathered at the focus",
        "a narrow, earthy palette, low in saturation",
      ],
      reference: { saturation: 0.72, warmth: 12, keys: [14, 238], groundDark: 0.65, light: 0.3, blur: 0.5, palette: 7, snap: 0.3, lightHold: 0.6 },
      brush: { alpha: 0.7, bristle: false, jitter: 3, length: 1.1, tips: { soft: 0.75, filbert: 0.25 } },
      leans: { ene: -0.6, pot: -0.4, val: -0.3 },
      words: ["old", "ancient", "portrait", "saint", "angel", "mist", "fog", "smoke", "dream", "quiet", "candle", "dusk", "memory", "silence"],
    },

    "broken-colour": {
      name: "broken colour",
      principles: [
        "short dabs of pure colour laid side by side, mixed by the eye",
        "high in key: no black, shadows are coloured",
        "warm light against cool shade",
        "the whole surface alive with touches",
      ],
      reference: { saturation: 1.35, keys: [70, 245], palette: 9, snap: 0.4, lightHold: 0.6 },
      brush: { alpha: 0.9, bristle: true, jitter: 42, length: 0.35, width: 0.8, evenDetail: 0.5, tips: { filbert: 0.45, round: 0.35, flat: 0.2 } },
      leans: { val: 0.5, mul: 0.4, ene: 0.2 },
      words: ["garden", "flower", "flowers", "sun", "summer", "spring", "morning", "meadow", "pond", "picnic", "bloom", "blossom"],
    },

    "stark-print": {
      name: "stark print",
      principles: [
        "two values, paper and ink, with one colour at most",
        "hard edges cut, not brushed",
        "tone made by hatching in a single direction",
        "big dark shapes against white",
      ],
      reference: { saturation: 0.35, keys: [14, 238], twoTone: 0.85, palette: 3, snap: 0.9, flatGround: 0.5, lightHold: 0.2 },
      brush: { alpha: 1, bristle: false, jitter: 2, length: 1.4, width: 0.55, hatch: 0.85, evenDetail: 0.4, edgeStop: 48, tips: { flat: 1 } },
      leans: { con: 0.5, bnd: 0.4, pot: 0.3 },
      words: ["storm", "wood", "forest", "war", "raven", "crow", "skull", "bone", "winter", "ink", "wolf", "woodcut", "print"],
    },

    "full-chroma": {
      name: "full chroma",
      principles: [
        "every colour at full strength; nothing greyed, nothing black",
        "light and shade told by hue: toward the light's colour in the light, toward the shade's in the shade",
        "each colour turns the way round the wheel it is already on - warm through orange and red, cool through green and blue",
        "gradients that travel through the spectrum instead of fading",
      ],
      reference: { chroma: 0.85, saturation: 1.3, keys: [16, 248], palette: 12, snap: 0.2, lightHold: 0.75 },
      brush: { alpha: 0.95, jitter: 16, length: 0.9, tips: { filbert: 0.4, flat: 0.3, round: 0.3 } },
      leans: { val: 0.4, ene: 0.4, mul: 0.3 },
      words: ["vivid", "rainbow", "wild", "psychedelic", "tropical", "carnival", "festival", "colourful", "colorful", "jungle", "parrot", "fauve", "spectrum", "prism"],
    },
  };

  /* A manner's full settings: every field present, the painterly defaults
   * where the manner says nothing. */
  const REFERENCE_DEFAULTS = {
    saturation: 1, warmth: 0, keys: [0, 255], groundDark: 0, light: 0, blur: 0,
    palette: 0, snap: -1, contour: 0, twoTone: 0, flatGround: 0, chroma: 0, lightHold: 0.5,
  };
  // `tips`: which brush tips the manner paints with (app.js, BRUSH_TIPS);
  // null leaves it to the painting's own kit.
  const BRUSH_DEFAULTS = { alpha: 0, bristle: true, round: false, jitter: -1, length: 1, width: 1, hatch: 0, evenDetail: 0, edgeStop: 0, tips: null };

  function manner(key) {
    const entry = MANNERS[key] || MANNERS.painterly;
    return {
      key: MANNERS[key] ? key : "painterly",
      name: entry.name,
      principles: entry.principles.slice(),
      reference: { ...REFERENCE_DEFAULTS, ...entry.reference },
      brush: { ...BRUSH_DEFAULTS, ...entry.brush },
      leans: { ...entry.leans },
      words: entry.words.slice(),
    };
  }

  /* How much the words lean toward each manner: named outright counts most,
   * then the qualities the word engine read. */
  function wordLeans(text, axes) {
    const words = new Set((String(text || "").toLowerCase().match(/[a-z]+/g) || []));
    const out = {};
    for (const [key, entry] of Object.entries(MANNERS)) {
      let lean = Number(entry.base) || 0;
      for (const [axis, weight] of Object.entries(entry.leans)) lean += 0.6 * weight * (Number(axes?.[axis]) || 0);
      for (const word of entry.words) if (words.has(word)) lean += 0.4;
      out[key] = lean;
    }
    return out;
  }

  /* ── Dimensionality ───────────────────────────────────────────────────
   * A second axis, independent of the manner: how solid the things in the
   * picture are. A bold-line painting can be of blocks; a soft-light one can
   * be of flat cut-outs. Settings are read by hexfield-visual.js (paint):
   *   model   light and shade across each form
   *   cast    a shadow thrown on the ground, away from the light
   *   depth   an extruded body behind each face */
  const DIMENSIONS = {
    flat: {
      name: "flat",
      principles: ["shapes as flat as paper", "no light direction, no shadow", "space made by overlap and placement alone"],
      settings: { model: 0, cast: 0, depth: 0 },
      base: 0.15,
      leans: { con: 0.3 },
      words: ["flat", "poster", "sign", "icon", "pattern", "cartoon", "comic", "pop", "paper", "cutout"],
    },
    shaded: {
      name: "shaded",
      principles: ["one light, from one side", "every form lit on the near side and falling into shade on the far", "shadows cast on the ground"],
      settings: { model: 1, cast: 0.85, depth: 0 },
      leans: { val: 0.3, ene: -0.2 },
      words: ["sun", "sunny", "morning", "evening", "portrait", "candle", "lamp", "shadow", "noon", "light"],
    },
    solid: {
      name: "solid",
      principles: ["things as blocks with a body behind the face", "the side away from the light in shade", "a shadow on the ground"],
      settings: { model: 0.6, cast: 0.6, depth: 0.75 },
      leans: { pot: 0.3, bnd: 0.3 },
      words: ["solid", "block", "stone", "building", "city", "tower", "statue", "sculpture", "castle", "box", "heavy"],
    },
  };

  function dimension(key) {
    const entry = DIMENSIONS[key] || DIMENSIONS.flat;
    return { key: DIMENSIONS[key] ? key : "flat", name: entry.name, principles: entry.principles.slice(), settings: { ...entry.settings } };
  }

  function dimensionLeans(text, axes) {
    const words = new Set((String(text || "").toLowerCase().match(/[a-z]+/g) || []));
    const out = {};
    for (const [key, entry] of Object.entries(DIMENSIONS)) {
      let lean = Number(entry.base) || 0;
      for (const [axis, weight] of Object.entries(entry.leans)) lean += 0.6 * weight * (Number(axes?.[axis]) || 0);
      for (const word of entry.words) if (words.has(word)) lean += 0.4;
      out[key] = lean;
    }
    return out;
  }

  /* ── Light ────────────────────────────────────────────────────────────
   * The one light a painting is lit by: how high it stands, whether it comes
   * from the viewer's side or from behind the things, its colour and the
   * colour of the shade it leaves, and how soft. Read by the visual
   * dictionary's paint (hexfield-visual.js, lighting):
   *   elev     how high the light is, in radians: low light, long shadows
   *   front    1 from behind the viewer onto the faces, -1 from behind the
   *            things toward the viewer (faces in shade, rims lit)
   *   colour   the light's colour; ambient, the colour of the shade
   *   soft     0 a crisp shadow and a hard edge to the shade, 1 overcast
   *   strength how dark the shade and shadows go
   *   point    a lamp in the picture: shadows spread out from it
   *   sky      a sun or moon seen in the sky, where there is sky
   *   grade    how far the whole picture is tinted by the light
   *   exposure how bright the picture is under it: night is dark, and a
   *            lamp lights its surroundings and falls off away from it */
  const LIGHTS = {
    noon: {
      name: "noon sun", settings: { elev: 1.15, front: 0.4, colour: [255, 247, 230], ambient: [86, 104, 150], soft: 0.15, strength: 0.8, point: false, sky: null, grade: 0.1, exposure: 1 },
      base: 0.1, words: ["noon", "summer", "beach", "desert", "midday", "sunny", "bright", "day"],
    },
    golden: {
      name: "golden hour", settings: { elev: 0.38, front: 0.5, colour: [255, 196, 120], ambient: [70, 78, 150], soft: 0.25, strength: 0.75, point: false, sky: "sun", grade: 0.22, exposure: 0.96 },
      base: 0.1, words: ["morning", "golden", "autumn", "warm", "harvest", "afternoon", "field"],
    },
    dusk: {
      name: "dusk", settings: { elev: 0.12, front: 0.2, colour: [255, 128, 96], ambient: [58, 46, 116], soft: 0.4, strength: 0.7, point: false, sky: "sun", grade: 0.3, exposure: 0.8 },
      words: ["sunset", "dusk", "evening", "twilight", "sundown"],
    },
    dawn: {
      name: "dawn", settings: { elev: 0.16, front: 0.35, colour: [255, 172, 160], ambient: [92, 96, 158], soft: 0.55, strength: 0.55, point: false, sky: "sun", grade: 0.28, exposure: 0.86 },
      words: ["dawn", "sunrise", "daybreak", "first light"],
    },
    moon: {
      name: "moonlight", settings: { elev: 0.8, front: 0.3, colour: [176, 196, 255], ambient: [22, 26, 62], soft: 0.3, strength: 0.9, point: false, sky: "moon", grade: 0.32, exposure: 0.55 },
      words: ["night", "moon", "moonlight", "midnight", "stars", "dark", "ghost", "owl"],
    },
    overcast: {
      name: "overcast", settings: { elev: 1.35, front: 0.6, colour: [232, 234, 240], ambient: [118, 124, 140], soft: 0.95, strength: 0.45, point: false, sky: null, grade: 0.12, exposure: 0.92 },
      words: ["cloudy", "rain", "fog", "grey", "gray", "mist", "winter", "snow", "quiet", "calm"],
    },
    backlit: {
      name: "backlit", settings: { elev: 0.3, front: -0.85, colour: [255, 214, 160], ambient: [52, 58, 96], soft: 0.3, strength: 0.85, point: false, sky: "sun", grade: 0.2, exposure: 0.9 },
      words: ["silhouette", "behind", "glow", "halo", "against", "shadow", "dramatic"],
    },
    lamp: {
      name: "lamplight", settings: { elev: 0.55, front: 0.55, colour: [255, 190, 118], ambient: [34, 30, 52], soft: 0.25, strength: 0.9, point: true, sky: null, grade: 0.28, exposure: 0.5 },
      words: ["lamp", "candle", "fire", "fireplace", "lantern", "cosy", "cozy", "room", "indoors", "bedroom", "kitchen", "cafe"],
    },
  };

  function light(key) {
    const entry = LIGHTS[key] || LIGHTS.noon;
    return { key: LIGHTS[key] ? key : "noon", name: entry.name, settings: { ...entry.settings } };
  }

  function lightLeans(text) {
    const words = new Set((String(text || "").toLowerCase().match(/[a-z]+/g) || []));
    const out = {};
    for (const [key, entry] of Object.entries(LIGHTS)) {
      let lean = Number(entry.base) || 0;
      for (const word of entry.words) if (words.has(word)) lean += 0.7;
      out[key] = lean;
    }
    return out;
  }

  /* ── Perspective ──────────────────────────────────────────────────────
   * A third axis: where the viewer stands and how space is projected. The
   * settings are read by the visual dictionary's layout and paint (see the
   * notes on layout in hexfield-visual.js). */
  const PERSPECTIVES = {
    frontal: {
      name: "straight on",
      principles: ["seen square on, at the things' own height", "space made by placement and overlap"],
      settings: {},
      base: 0.3,
      leans: {},
      words: ["portrait", "sign", "icon", "poster", "flat"],
    },
    "one-point": {
      name: "one-point",
      principles: ["one horizon at eye level", "lines of the ground meet at one vanishing point",
        "further back is higher, smaller and paler", "solid things recede toward the vanishing point"],
      settings: { horizon: 0.42, ground: 0.85, depth: 0.75, lines: 0.8, aerial: 0.5 },
      leans: { ver: -0.3, bnd: 0.2 },
      words: ["road", "street", "path", "corridor", "hall", "railway", "tunnel", "avenue", "bridge", "distance", "far"],
    },
    above: {
      name: "from above",
      principles: ["a high eye: the horizon near the top, the ground laid out below",
        "standing things widen toward the viewer", "a map-like spread of near and far"],
      settings: { horizon: 0.12, ground: 0.88, depth: 0.8, lines: 0.5, aerial: 0.25, keystone: 1.16 },
      leans: { mul: 0.3 },
      words: ["above", "aerial", "flying", "fly", "bird", "map", "town", "village", "view", "overhead"],
    },
    below: {
      name: "from below",
      principles: ["a low eye: the horizon near the ground", "the main thing towers and narrows toward its top",
        "sky fills the picture behind it"],
      settings: { horizon: 0.86, ground: 0.6, depth: 0.45, lines: 0.35, aerial: 0.2, keystone: 0.7, scale: 1.3 },
      leans: { pot: 0.3, ver: 0.3 },
      words: ["giant", "tall", "huge", "tower", "monster", "hero", "skyscraper", "statue", "titan", "looming"],
    },
    isometric: {
      name: "isometric",
      principles: ["parallel projection: far things are not smaller", "depth runs up and across at thirty degrees",
        "a diamond grid for the ground"],
      settings: { iso: 1, lines: 0.7 },
      leans: { con: 0.3, bnd: 0.2 },
      words: ["game", "pixel", "toy", "block", "blocks", "lego", "room", "puzzle", "diagram", "model"],
    },
    importance: {
      name: "by importance",
      principles: ["size by importance, not distance", "the main thing large, the rest small around it",
        "no single viewpoint"],
      settings: { hierarchy: 1 },
      leans: { bnd: 0.3 },
      words: ["king", "queen", "god", "goddess", "saint", "holy", "ruler", "emperor", "legend", "myth"],
    },
  };

  function perspective(key) {
    const entry = PERSPECTIVES[key] || PERSPECTIVES.frontal;
    return { key: PERSPECTIVES[key] ? key : "frontal", name: entry.name, principles: entry.principles.slice(), settings: { ...entry.settings } };
  }

  function perspectiveLeans(text, axes) {
    const words = new Set((String(text || "").toLowerCase().match(/[a-z]+/g) || []));
    const out = {};
    for (const [key, entry] of Object.entries(PERSPECTIVES)) {
      let lean = Number(entry.base) || 0;
      for (const [axis, weight] of Object.entries(entry.leans)) lean += 0.6 * weight * (Number(axes?.[axis]) || 0);
      for (const word of entry.words) if (words.has(word)) lean += 0.4;
      out[key] = lean;
    }
    return out;
  }

  /* ── Form ─────────────────────────────────────────────────────────────
   * How the things themselves are drawn (the styles and their genes live in
   * the visual dictionary, FORM_STYLES): one style per painting. These are
   * the words that lean toward each; taste and votes decide the rest. */
  const FORM_LEANS = {
    plain: { base: 0.2, words: [] },
    angular: { words: ["cubist", "angular", "geometric", "sharp", "crystal", "broken", "shattered", "jagged"] },
    rounded: { words: ["soft", "round", "bubble", "chubby", "cosy", "cozy", "fluffy", "puffy", "gentle"] },
    wobbly: { words: ["wobbly", "sketch", "doodle", "childlike", "scribble", "drawn", "wild", "crazy", "drunk"] },
    elongated: { words: ["tall", "thin", "slender", "long", "elegant", "ghost", "ghostly", "stretched"] },
    squat: { words: ["fat", "tiny", "chunky", "stout", "squat", "heavy", "little"] },
    cartoon: { words: ["cartoon", "cute", "comic", "kawaii", "funny", "silly", "baby", "happy", "toy"] },
  };

  function formLeans(text) {
    const words = new Set((String(text || "").toLowerCase().match(/[a-z]+/g) || []));
    const out = {};
    for (const [key, entry] of Object.entries(FORM_LEANS)) {
      let lean = Number(entry.base) || 0;
      for (const word of entry.words) if (words.has(word)) lean += 0.5;
      out[key] = lean;
    }
    return out;
  }

  global.HexfieldCraft = {
    formLeans,
    MANNERS, KEYS: Object.keys(MANNERS), manner, wordLeans,
    DIMENSIONS, DIMENSION_KEYS: Object.keys(DIMENSIONS), dimension, dimensionLeans,
    PERSPECTIVES, PERSPECTIVE_KEYS: Object.keys(PERSPECTIVES), perspective, perspectiveLeans,
    LIGHTS, LIGHT_KEYS: Object.keys(LIGHTS), light, lightLeans,
  };
})(typeof window !== "undefined" ? window : globalThis);
