/* A craft dictionary: ways of painting, told as principles.
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
      reference: { saturation: 1.45, keys: [18, 240], palette: 5, snap: 1, contour: 1, flatGround: 0.9 },
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
      reference: { saturation: 0.72, warmth: 12, keys: [14, 238], groundDark: 0.65, light: 0.3, blur: 0.5, palette: 7, snap: 0.3 },
      brush: { alpha: 0.7, bristle: false, jitter: 3, length: 1.1 },
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
      reference: { saturation: 1.35, keys: [70, 245], palette: 9, snap: 0.4 },
      brush: { alpha: 0.9, bristle: true, jitter: 42, length: 0.35, width: 0.8, evenDetail: 0.5 },
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
      reference: { saturation: 0.35, keys: [14, 238], twoTone: 0.85, palette: 3, snap: 0.9, flatGround: 0.5 },
      brush: { alpha: 1, bristle: false, jitter: 2, length: 1.4, width: 0.55, hatch: 0.85, evenDetail: 0.4, edgeStop: 48 },
      leans: { con: 0.5, bnd: 0.4, pot: 0.3 },
      words: ["storm", "wood", "forest", "war", "raven", "crow", "skull", "bone", "winter", "ink", "wolf", "woodcut", "print"],
    },
  };

  /* A manner's full settings: every field present, the painterly defaults
   * where the manner says nothing. */
  const REFERENCE_DEFAULTS = {
    saturation: 1, warmth: 0, keys: [0, 255], groundDark: 0, light: 0, blur: 0,
    palette: 0, snap: -1, contour: 0, twoTone: 0, flatGround: 0,
  };
  const BRUSH_DEFAULTS = { alpha: 0, bristle: true, round: false, jitter: -1, length: 1, width: 1, hatch: 0, evenDetail: 0, edgeStop: 0 };

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

  global.HexfieldCraft = { MANNERS, KEYS: Object.keys(MANNERS), manner, wordLeans };
})(typeof window !== "undefined" ? window : globalThis);
