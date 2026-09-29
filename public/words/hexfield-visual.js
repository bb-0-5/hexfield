/* A visual dictionary: what things look like, told in words.
 * ---------------------------------------------------------------------------
 *
 * hexfield-words.js knows how a word *behaves* - calm or violent, one or many,
 * contained or diffuse - and deliberately knows nothing about how a thing
 * looks. That is the right target for mood and the wrong one for a noun: no
 * amount of "concrete, bounded, one" will ever paint a door.
 *
 * This file is the other half, and it contains no pictures. Each entry is the
 * kind of note a painter makes in a sketchbook - a door is a tall rectangle
 * with a frame, two panels and a handle, wood-grained, standing on the ground -
 * written in a small drawing kit of about twenty pieces (rectangles, ellipses,
 * polygons, lines, flame tongues, clusters, bands, rays, glows, textures).
 * Nothing here was traced from an image; it is language knowledge compiled
 * into shapes the painter can use.
 *
 * What the painter does with it is deliberately modest. A scene is painted
 * into the painting's *reference* - the picture the stroke painter works
 * toward - as big value shapes, and the brushwork, palette and plan do the
 * rest. So a door arrives as a loosely painted door, not as clip-art.
 *
 * Coordinates: every part is drawn inside its item's box, x and y from 0 to 1,
 * y downward. Colours are HSL triples [hue, saturation %, lightness %]. A part's
 * `tone` shifts lightness by tone × 100.
 */
(function (global) {
  "use strict";

  /* ── The dictionary ──────────────────────────────────────────────────────
   *
   * kind     subject (a thing, placed) or setting (a place, fills a region)
   * anchor   where a subject stands: ground, sky, water or centre
   * size     height as a fraction of the canvas height
   * aspect   width / height of its box
   * region   for settings: [x, y, w, h] of the canvas it fills
   * horizon  for settings that have one: its height as a fraction of the canvas
   * colours  named colours its parts refer to; the first is its main colour,
   *          which a colour adjective ("red door") replaces */
  const ENTRIES = {
    // ── things that stand on the ground ─────────────────────────────────
    door: {
      kind: "subject", anchor: "ground", size: 0.72, aspect: 0.46,
      colours: { wood: [28, 42, 34], frame: [26, 30, 20], metal: [45, 45, 62] },
      parts: [
        { shape: "rect", box: [-0.07, -0.05, 1.14, 1.05], colour: "frame" },
        { shape: "rect", box: [0, 0, 1, 1], colour: "wood", texture: "grain-v" },
        { shape: "rect", box: [0.13, 0.07, 0.74, 0.38], colour: "wood", tone: -0.08 },
        { shape: "rect", box: [0.13, 0.53, 0.74, 0.39], colour: "wood", tone: -0.08 },
        { shape: "ellipse", box: [0.74, 0.47, 0.1, 0.06], colour: "metal" },
      ],
    },
    house: {
      kind: "subject", anchor: "ground", size: 0.62, aspect: 1.1,
      colours: { wall: [36, 38, 70], roof: [8, 48, 36], door: [26, 40, 24], window: [46, 80, 70] },
      parts: [
        { shape: "rect", box: [0.7, 0.08, 0.09, 0.26], colour: "roof", tone: -0.08 },
        { shape: "rect", box: [0.1, 0.42, 0.8, 0.58], colour: "wall", texture: "brick" },
        { shape: "poly", pts: [[0, 0.47], [0.5, 0], [1, 0.47]], colour: "roof", texture: "grain-h" },
        { shape: "rect", box: [0.43, 0.66, 0.15, 0.34], colour: "door" },
        { shape: "rect", box: [0.18, 0.55, 0.16, 0.15], colour: "window" },
        { shape: "rect", box: [0.66, 0.55, 0.16, 0.15], colour: "window" },
      ],
    },
    tower: {
      kind: "subject", anchor: "ground", size: 0.92, aspect: 0.32,
      colours: { stone: [30, 12, 58], roof: [222, 26, 30], window: [46, 80, 68] },
      parts: [
        { shape: "rect", box: [0.1, 0.14, 0.8, 0.86], colour: "stone", texture: "brick" },
        { shape: "poly", pts: [[0, 0.16], [0.5, 0], [1, 0.16]], colour: "roof" },
        { shape: "rect", box: [0.4, 0.26, 0.2, 0.08], colour: "window" },
        { shape: "rect", box: [0.4, 0.5, 0.2, 0.08], colour: "window" },
      ],
    },
    lighthouse: {
      kind: "subject", anchor: "ground", size: 0.9, aspect: 0.3,
      colours: { red: [2, 70, 45], white: [40, 15, 92], lamp: [48, 100, 70], cap: [220, 20, 22] },
      parts: [
        { shape: "glow", box: [-1.2, -0.5, 3.4, 0.9], colour: "lamp" },
        { shape: "poly", pts: [[0.18, 0.22], [0.82, 0.22], [0.95, 1], [0.05, 1]], colour: "white" },
        { shape: "bands", box: [0.05, 0.22, 0.9, 0.78], n: 5, colour: "red", alternate: "white", taper: true },
        { shape: "rect", box: [0.22, 0.1, 0.56, 0.12], colour: "lamp" },
        { shape: "poly", pts: [[0.14, 0.11], [0.5, 0], [0.86, 0.11]], colour: "cap" },
      ],
    },
    bridge: {
      kind: "subject", anchor: "ground", size: 0.42, aspect: 2.8,
      colours: { stone: [32, 16, 54] },
      parts: [
        { shape: "rect", box: [0, 0.18, 1, 0.82], colour: "stone", texture: "brick" },
        { shape: "ellipse", box: [0.12, 0.42, 0.34, 1.2], cut: true },
        { shape: "ellipse", box: [0.54, 0.42, 0.34, 1.2], cut: true },
        { shape: "rect", box: [-0.02, 0.1, 1.04, 0.1], colour: "stone", tone: -0.1 },
      ],
    },
    tree: {
      kind: "subject", anchor: "ground", size: 0.86, aspect: 0.8,
      colours: { leaves: [112, 44, 32], bark: [25, 35, 22] },
      parts: [
        { shape: "poly", pts: [[0.43, 1], [0.47, 0.42], [0.53, 0.42], [0.57, 1]], colour: "bark", texture: "bark" },
        { shape: "line", pts: [[0.5, 0.6], [0.3, 0.4]], width: 0.04, colour: "bark" },
        { shape: "line", pts: [[0.5, 0.55], [0.7, 0.38]], width: 0.04, colour: "bark" },
        { shape: "cluster", box: [0.04, 0, 0.92, 0.62], n: 16, r: 0.22, colour: "leaves", texture: "leafy" },
      ],
    },
    flower: {
      kind: "subject", anchor: "ground", size: 0.46, aspect: 0.55,
      colours: { petal: [338, 70, 60], stem: [110, 45, 34], centre: [46, 90, 55] },
      parts: [
        { shape: "line", pts: [[0.5, 1], [0.5, 0.34]], width: 0.06, colour: "stem" },
        { shape: "ellipse", box: [0.5, 0.62, 0.34, 0.12], colour: "stem", tone: 0.06 },
        { shape: "petals", box: [0.05, 0, 0.9, 0.5], n: 7, colour: "petal" },
        { shape: "ellipse", box: [0.38, 0.17, 0.24, 0.16], colour: "centre" },
      ],
    },
    person: {
      kind: "subject", anchor: "ground", size: 0.74, aspect: 0.36,
      colours: { clothes: [215, 35, 32], skin: [24, 42, 62], legs: [220, 25, 20] },
      parts: [
        { shape: "line", pts: [[0.4, 0.6], [0.35, 1]], width: 0.15, colour: "legs" },
        { shape: "line", pts: [[0.6, 0.6], [0.65, 1]], width: 0.15, colour: "legs" },
        { shape: "line", pts: [[0.22, 0.22], [0.08, 0.55]], width: 0.12, colour: "clothes", tone: -0.05 },
        { shape: "line", pts: [[0.78, 0.22], [0.92, 0.55]], width: 0.12, colour: "clothes", tone: -0.05 },
        { shape: "poly", pts: [[0.2, 0.19], [0.8, 0.19], [0.72, 0.64], [0.28, 0.64]], colour: "clothes", texture: "grain-v" },
        { shape: "ellipse", box: [0.32, 0, 0.36, 0.17], colour: "skin" },
      ],
    },
    cat: {
      kind: "subject", anchor: "ground", size: 0.4, aspect: 0.8,
      colours: { fur: [240, 8, 14], eye: [52, 90, 55] },
      parts: [
        { shape: "line", pts: [[0.82, 0.92], [1, 0.7], [0.95, 0.45]], width: 0.07, colour: "fur" },
        { shape: "ellipse", box: [0.12, 0.34, 0.76, 0.66], colour: "fur", texture: "fur" },
        { shape: "ellipse", box: [0.25, 0.06, 0.5, 0.4], colour: "fur" },
        { shape: "poly", pts: [[0.27, 0.16], [0.3, -0.04], [0.43, 0.09]], colour: "fur" },
        { shape: "poly", pts: [[0.57, 0.09], [0.7, -0.04], [0.73, 0.16]], colour: "fur" },
        { shape: "ellipse", box: [0.36, 0.2, 0.08, 0.06], colour: "eye" },
        { shape: "ellipse", box: [0.56, 0.2, 0.08, 0.06], colour: "eye" },
      ],
    },
    dog: {
      kind: "subject", anchor: "ground", size: 0.38, aspect: 1.35,
      colours: { fur: [30, 42, 40], dark: [28, 35, 20] },
      parts: [
        { shape: "line", pts: [[0.24, 0.55], [0.22, 1]], width: 0.07, colour: "fur", tone: -0.06 },
        { shape: "line", pts: [[0.36, 0.55], [0.36, 1]], width: 0.07, colour: "fur" },
        { shape: "line", pts: [[0.62, 0.55], [0.62, 1]], width: 0.07, colour: "fur", tone: -0.06 },
        { shape: "line", pts: [[0.72, 0.55], [0.74, 1]], width: 0.07, colour: "fur" },
        { shape: "line", pts: [[0.14, 0.4], [0.02, 0.2]], width: 0.05, colour: "fur" },
        { shape: "ellipse", box: [0.12, 0.3, 0.66, 0.36], colour: "fur", texture: "fur" },
        { shape: "ellipse", box: [0.66, 0.06, 0.3, 0.34], colour: "fur" },
        { shape: "ellipse", box: [0.86, 0.2, 0.14, 0.12], colour: "dark" },
        { shape: "ellipse", box: [0.66, 0.06, 0.1, 0.24], colour: "dark" },
      ],
    },
    fire: {
      kind: "subject", anchor: "ground", size: 0.6, aspect: 0.8,
      colours: { flame: [14, 92, 50], mid: [32, 96, 56], core: [50, 100, 72], log: [24, 40, 16] },
      parts: [
        { shape: "glow", box: [-0.6, -0.4, 2.2, 1.6], colour: "mid" },
        { shape: "tongues", box: [0, 0, 1, 0.92], n: 7, colour: "flame" },
        { shape: "tongues", box: [0.14, 0.22, 0.72, 0.7], n: 5, colour: "mid" },
        { shape: "tongues", box: [0.3, 0.45, 0.4, 0.47], n: 3, colour: "core" },
        { shape: "line", pts: [[0.1, 0.96], [0.9, 0.86]], width: 0.08, colour: "log" },
        { shape: "line", pts: [[0.12, 0.86], [0.88, 0.97]], width: 0.08, colour: "log", tone: -0.04 },
      ],
    },
    candle: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 0.32,
      colours: { wax: [44, 40, 88], flame: [40, 100, 62], wick: [0, 0, 12] },
      parts: [
        { shape: "glow", box: [-1.2, -0.5, 3.4, 1.2], colour: "flame" },
        { shape: "rect", box: [0.22, 0.36, 0.56, 0.64], colour: "wax", texture: "grain-v" },
        { shape: "line", pts: [[0.5, 0.36], [0.5, 0.3]], width: 0.04, colour: "wick" },
        { shape: "tongues", box: [0.34, 0.04, 0.32, 0.28], n: 1, colour: "flame" },
      ],
    },
    stone: {
      kind: "subject", anchor: "ground", size: 0.34, aspect: 1.45,
      colours: { rock: [30, 8, 46] },
      parts: [
        { shape: "poly", pts: [[0.02, 1], [0.08, 0.42], [0.3, 0.1], [0.62, 0.04], [0.9, 0.3], [1, 1]], colour: "rock", texture: "speckle" },
        { shape: "poly", pts: [[0.3, 0.14], [0.62, 0.08], [0.8, 0.28], [0.5, 0.3]], colour: "rock", tone: 0.12 },
      ],
    },
    mountain: {
      kind: "subject", anchor: "ground", size: 0.8, aspect: 1.9,
      colours: { rock: [216, 18, 40], snow: [210, 12, 92] },
      parts: [
        { shape: "poly", pts: [[0, 1], [0.46, 0], [0.62, 0.26], [0.73, 0.12], [1, 1]], colour: "rock", texture: "grain-d" },
        { shape: "poly", pts: [[0.36, 0.22], [0.46, 0], [0.56, 0.22], [0.5, 0.18], [0.46, 0.26], [0.41, 0.18]], colour: "snow" },
        { shape: "poly", pts: [[0.46, 0], [0.62, 0.26], [0.55, 1], [0.5, 1]], colour: "rock", tone: -0.1 },
      ],
    },
    chair: {
      kind: "subject", anchor: "ground", size: 0.5, aspect: 0.7, seat: 0.55,
      colours: { wood: [28, 45, 34] },
      parts: [
        { shape: "line", pts: [[0.15, 0], [0.15, 1]], width: 0.08, colour: "wood" },
        { shape: "line", pts: [[0.85, 0], [0.85, 1]], width: 0.08, colour: "wood" },
        { shape: "rect", box: [0.15, 0.06, 0.7, 0.28], colour: "wood", texture: "grain-h" },
        { shape: "rect", box: [0.08, 0.52, 0.84, 0.1], colour: "wood", tone: 0.06 },
      ],
    },
    ladder: {
      kind: "subject", anchor: "ground", size: 0.9, aspect: 0.34,
      colours: { wood: [30, 40, 40] },
      parts: [
        { shape: "line", pts: [[0.12, 0], [0.12, 1]], width: 0.1, colour: "wood" },
        { shape: "line", pts: [[0.88, 0], [0.88, 1]], width: 0.1, colour: "wood" },
        { shape: "rungs", box: [0.12, 0.06, 0.76, 0.9], n: 7, width: 0.06, colour: "wood", tone: 0.06 },
      ],
    },
    cup: {
      kind: "subject", anchor: "ground", size: 0.34, aspect: 1.05,
      colours: { china: [200, 30, 82], steam: [210, 10, 92] },
      parts: [
        { shape: "ring", box: [0.62, 0.3, 0.34, 0.42], thickness: 0.3, colour: "china", tone: -0.06 },
        { shape: "poly", pts: [[0.08, 0.2], [0.78, 0.2], [0.7, 1], [0.16, 1]], colour: "china" },
        { shape: "ellipse", box: [0.08, 0.14, 0.7, 0.12], colour: "china", tone: -0.35 },
      ],
    },
    apple: {
      kind: "subject", anchor: "ground", size: 0.26, aspect: 1,
      colours: { skin: [2, 76, 44], stem: [28, 40, 22], leaf: [110, 50, 36] },
      parts: [
        { shape: "ellipse", box: [0, 0.14, 1, 0.86], colour: "skin", texture: "speckle" },
        { shape: "line", pts: [[0.5, 0.2], [0.54, 0]], width: 0.05, colour: "stem" },
        { shape: "almond", box: [0.54, 0.02, 0.3, 0.14], colour: "leaf" },
        { shape: "ellipse", box: [0.2, 0.3, 0.2, 0.2], colour: "skin", tone: 0.18 },
      ],
    },
    bottle: {
      kind: "subject", anchor: "ground", size: 0.48, aspect: 0.34,
      colours: { glass: [150, 42, 28] },
      parts: [
        { shape: "rect", box: [0.36, 0, 0.28, 0.36], colour: "glass" },
        { shape: "rect", box: [0.06, 0.32, 0.88, 0.68], colour: "glass", r: 0.3 },
        { shape: "rect", box: [0.18, 0.4, 0.12, 0.5], colour: "glass", tone: 0.25 },
      ],
    },
    boat: {
      kind: "subject", anchor: "water", size: 0.3, aspect: 1.7,
      colours: { hull: [14, 55, 38], sail: [40, 30, 92], mast: [28, 30, 22] },
      parts: [
        { shape: "line", pts: [[0.5, 0.62], [0.5, 0]], width: 0.03, colour: "mast" },
        { shape: "poly", pts: [[0.53, 0.04], [0.53, 0.58], [0.92, 0.58]], colour: "sail" },
        { shape: "poly", pts: [[0.47, 0.1], [0.47, 0.58], [0.16, 0.58]], colour: "sail", tone: -0.08 },
        { shape: "poly", pts: [[0, 0.62], [1, 0.62], [0.84, 1], [0.16, 1]], colour: "hull", texture: "grain-h" },
      ],
    },
    car: {
      kind: "subject", anchor: "ground", size: 0.3, aspect: 2.2,
      colours: { body: [0, 62, 44], glass: [205, 40, 70], tyre: [0, 0, 10] },
      parts: [
        { shape: "poly", pts: [[0.24, 0.42], [0.36, 0.08], [0.7, 0.08], [0.8, 0.42]], colour: "glass" },
        { shape: "rect", box: [0, 0.38, 1, 0.42], colour: "body", r: 0.3 },
        { shape: "ellipse", box: [0.12, 0.62, 0.2, 0.38], colour: "tyre" },
        { shape: "ellipse", box: [0.68, 0.62, 0.2, 0.38], colour: "tyre" },
      ],
    },
    flag: {
      kind: "subject", anchor: "ground", size: 0.72, aspect: 0.75,
      colours: { cloth: [0, 72, 46], pole: [30, 10, 60] },
      parts: [
        { shape: "line", pts: [[0.06, 0], [0.06, 1]], width: 0.04, colour: "pole" },
        { shape: "wave", box: [0.08, 0.03, 0.9, 0.4], colour: "cloth", texture: "ripple" },
      ],
    },
    // ── things in the sky ────────────────────────────────────────────────
    sun: {
      kind: "subject", anchor: "sky", size: 0.36, aspect: 1,
      colours: { core: [46, 96, 62], glow: [36, 96, 58] },
      parts: [
        { shape: "glow", box: [-0.8, -0.8, 2.6, 2.6], colour: "glow" },
        { shape: "rays", box: [-0.35, -0.35, 1.7, 1.7], n: 12, colour: "glow" },
        { shape: "ellipse", box: [0, 0, 1, 1], colour: "core" },
      ],
    },
    moon: {
      kind: "subject", anchor: "sky", size: 0.32, aspect: 1,
      colours: { face: [50, 16, 88], glow: [220, 30, 72] },
      parts: [
        { shape: "ellipse", box: [0, 0, 1, 1], colour: "face", texture: "speckle" },
        { shape: "ellipse", box: [0.3, -0.1, 1, 1], cut: true },
        // After the cut, so the crescent glows and the cut-away part stays sky.
        { shape: "glow", box: [-0.7, -0.7, 2.4, 2.4], colour: "glow" },
      ],
    },
    star: {
      kind: "subject", anchor: "sky", size: 0.14, aspect: 1,
      colours: { light: [52, 80, 86] },
      parts: [
        { shape: "glow", box: [-0.8, -0.8, 2.6, 2.6], colour: "light" },
        { shape: "star", box: [0, 0, 1, 1], n: 5, colour: "light" },
      ],
    },
    cloud: {
      kind: "subject", anchor: "sky", size: 0.3, aspect: 2.1,
      colours: { white: [210, 15, 92], shade: [215, 16, 72] },
      parts: [
        { shape: "ellipse", box: [0, 0.42, 1, 0.58], colour: "shade" },
        { shape: "ellipse", box: [0.08, 0.24, 0.42, 0.6], colour: "white" },
        { shape: "ellipse", box: [0.32, 0, 0.42, 0.8], colour: "white" },
        { shape: "ellipse", box: [0.58, 0.26, 0.36, 0.56], colour: "white", tone: -0.04 },
      ],
    },
    bird: {
      kind: "subject", anchor: "sky", size: 0.14, aspect: 1.7,
      colours: { body: [222, 18, 18] },
      parts: [
        { shape: "line", pts: [[0, 0.35], [0.24, 0.02], [0.5, 0.5], [0.76, 0.02], [1, 0.35]], width: 0.12, colour: "body" },
      ],
    },
    // ── things held up to look at ────────────────────────────────────────
    fish: {
      kind: "subject", anchor: "centre", size: 0.26, aspect: 2,
      colours: { scales: [196, 45, 52], eye: [0, 0, 10] },
      parts: [
        { shape: "poly", pts: [[0.7, 0.5], [1, 0.1], [0.94, 0.5], [1, 0.9]], colour: "scales", tone: -0.1 },
        { shape: "almond", box: [0, 0.1, 0.78, 0.8], colour: "scales", texture: "scales" },
        { shape: "ellipse", box: [0.12, 0.36, 0.08, 0.14], colour: "eye" },
      ],
    },
    heart: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 1.05,
      colours: { red: [352, 76, 48] },
      parts: [
        { shape: "heart", box: [0, 0, 1, 1], colour: "red" },
        { shape: "ellipse", box: [0.18, 0.14, 0.2, 0.16], colour: "red", tone: 0.2 },
      ],
    },
    eye: {
      kind: "subject", anchor: "centre", size: 0.3, aspect: 2,
      colours: { white: [40, 20, 92], iris: [200, 52, 40], pupil: [0, 0, 6], lid: [24, 30, 45] },
      parts: [
        { shape: "almond", box: [-0.04, -0.06, 1.08, 1.12], colour: "lid" },
        { shape: "almond", box: [0, 0, 1, 1], colour: "white" },
        { shape: "ellipse", box: [0.33, 0.12, 0.34, 0.76], colour: "iris", texture: "rays" },
        { shape: "ellipse", box: [0.43, 0.32, 0.14, 0.36], colour: "pupil" },
        { shape: "ellipse", box: [0.54, 0.26, 0.06, 0.12], colour: "white", tone: 0.06 },
      ],
    },
    key: {
      kind: "subject", anchor: "centre", size: 0.28, aspect: 2.3,
      colours: { metal: [44, 70, 50] },
      parts: [
        { shape: "ring", box: [0, 0.1, 0.36, 0.8], thickness: 0.34, colour: "metal" },
        { shape: "rect", box: [0.34, 0.42, 0.66, 0.16], colour: "metal" },
        { shape: "rect", box: [0.78, 0.56, 0.07, 0.24], colour: "metal" },
        { shape: "rect", box: [0.9, 0.56, 0.07, 0.3], colour: "metal" },
      ],
    },
    clock: {
      kind: "subject", anchor: "centre", size: 0.42, aspect: 1,
      colours: { face: [40, 22, 90], rim: [30, 30, 24] },
      parts: [
        { shape: "ellipse", box: [0, 0, 1, 1], colour: "rim" },
        { shape: "ellipse", box: [0.07, 0.07, 0.86, 0.86], colour: "face" },
        { shape: "ticks", box: [0.1, 0.1, 0.8, 0.8], n: 12, colour: "rim" },
        { shape: "line", pts: [[0.5, 0.5], [0.5, 0.2]], width: 0.05, colour: "rim" },
        { shape: "line", pts: [[0.5, 0.5], [0.7, 0.58]], width: 0.04, colour: "rim" },
      ],
    },
    crown: {
      kind: "subject", anchor: "centre", size: 0.3, aspect: 1.5,
      colours: { gold: [44, 82, 50], jewel: [350, 75, 42] },
      parts: [
        { shape: "poly", pts: [[0, 1], [0, 0.2], [0.22, 0.55], [0.36, 0], [0.5, 0.5], [0.64, 0], [0.78, 0.55], [1, 0.2], [1, 1]], colour: "gold", texture: "grain-h" },
        { shape: "ellipse", box: [0.44, 0.68, 0.12, 0.18], colour: "jewel" },
        { shape: "ellipse", box: [0.16, 0.7, 0.1, 0.14], colour: "jewel", tone: 0.1 },
        { shape: "ellipse", box: [0.74, 0.7, 0.1, 0.14], colour: "jewel", tone: 0.1 },
      ],
    },
    bone: {
      kind: "subject", anchor: "centre", size: 0.2, aspect: 3,
      colours: { bone: [40, 22, 86] },
      parts: [
        { shape: "rect", box: [0.12, 0.34, 0.76, 0.32], colour: "bone" },
        { shape: "ellipse", box: [0, 0.05, 0.18, 0.45], colour: "bone" },
        { shape: "ellipse", box: [0, 0.5, 0.18, 0.45], colour: "bone" },
        { shape: "ellipse", box: [0.82, 0.05, 0.18, 0.45], colour: "bone" },
        { shape: "ellipse", box: [0.82, 0.5, 0.18, 0.45], colour: "bone" },
      ],
    },
    leaf: {
      kind: "subject", anchor: "centre", size: 0.4, aspect: 0.6,
      colours: { green: [108, 50, 38], vein: [100, 40, 58] },
      parts: [
        { shape: "almond", box: [0, 0, 1, 1], vertical: true, colour: "green", texture: "veins" },
        { shape: "line", pts: [[0.5, 1.08], [0.5, 0.04]], width: 0.04, colour: "vein" },
      ],
    },
    feather: {
      kind: "subject", anchor: "centre", size: 0.5, aspect: 0.3,
      colours: { vane: [30, 20, 82], quill: [36, 20, 60] },
      parts: [
        { shape: "almond", box: [0, 0, 1, 0.9], vertical: true, colour: "vane", texture: "grain-d" },
        { shape: "line", pts: [[0.5, 1], [0.5, 0.05]], width: 0.06, colour: "quill" },
      ],
    },
    egg: {
      kind: "subject", anchor: "ground", size: 0.22, aspect: 0.78,
      colours: { shell: [36, 36, 86] },
      parts: [
        { shape: "egg", box: [0, 0, 1, 1], colour: "shell", texture: "speckle" },
      ],
    },
    book: {
      kind: "subject", anchor: "centre", size: 0.3, aspect: 1.4,
      colours: { cover: [220, 45, 32], pages: [42, 30, 90] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "cover" },
        { shape: "rect", box: [0.05, 0.08, 0.42, 0.84], colour: "pages", texture: "grain-h" },
        { shape: "rect", box: [0.53, 0.08, 0.42, 0.84], colour: "pages", texture: "grain-h", tone: -0.04 },
      ],
    },
    // ── places ───────────────────────────────────────────────────────────
    sky: {
      kind: "setting", region: [0, 0, 1, 0.66], horizon: 0.66,
      colours: { high: [212, 55, 52], low: [200, 45, 82] },
      parts: [{ shape: "gradient", box: [0, 0, 1, 1], colour: "high", to: "low" }],
    },
    night: {
      kind: "setting", region: [0, 0, 1, 1],
      colours: { high: [234, 48, 8], low: [226, 40, 22], star: [52, 60, 90] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "high", to: "low" },
        { shape: "scatter", box: [0, 0, 1, 0.6], n: 60, r: 0.0035, colour: "star" },
      ],
    },
    sea: {
      kind: "setting", region: [0, 0.6, 1, 0.4], horizon: 0.6,
      colours: { water: [204, 60, 34], light: [196, 50, 58] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "light", to: "water" },
        { shape: "ripples", box: [0, 0.05, 1, 0.95], n: 9, colour: "light" },
      ],
    },
    river: {
      kind: "setting", region: [0, 0.55, 1, 0.45], horizon: 0.55,
      colours: { water: [198, 55, 45], bank: [96, 35, 34] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "bank", texture: "grass" },
        { shape: "river", box: [0, 0, 1, 1], colour: "water", texture: "ripple" },
      ],
    },
    field: {
      kind: "setting", region: [0, 0.64, 1, 0.36], horizon: 0.64,
      colours: { grass: [96, 45, 40] },
      parts: [{ shape: "rect", box: [0, 0, 1, 1], colour: "grass", texture: "grass" }],
    },
    desert: {
      kind: "setting", region: [0, 0.6, 1, 0.4], horizon: 0.6,
      colours: { sand: [38, 52, 64], shade: [30, 45, 48] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "sand" },
        { shape: "dunes", box: [0, 0, 1, 1], n: 4, colour: "shade" },
      ],
    },
    snow: {
      kind: "setting", region: [0, 0, 1, 1], horizon: 0.7,
      colours: { ground: [206, 14, 92], flake: [210, 20, 97] },
      parts: [
        { shape: "rect", box: [0, 0.7, 1, 0.3], colour: "ground" },
        { shape: "scatter", box: [0, 0, 1, 1], n: 90, r: 0.006, colour: "flake" },
      ],
    },
    forest: {
      kind: "setting", region: [0, 0.3, 1, 0.7], horizon: 0.78,
      colours: { dark: [130, 40, 18], light: [118, 40, 30] },
      parts: [{ shape: "treeline", box: [0, 0, 1, 1], n: 9, colour: "dark", alternate: "light" }],
    },
    city: {
      kind: "setting", region: [0, 0.28, 1, 0.72], horizon: 0.86,
      colours: { building: [226, 16, 24], window: [46, 80, 66] },
      parts: [{ shape: "skyline", box: [0, 0, 1, 1], n: 11, colour: "building", alternate: "window" }],
    },
    mountains: {
      kind: "setting", region: [0, 0.22, 1, 0.5], horizon: 0.72,
      colours: { far: [220, 20, 58], near: [218, 22, 38], snow: [210, 12, 92] },
      parts: [
        { shape: "range", box: [0, 0.1, 1, 0.9], n: 5, colour: "far" },
        { shape: "range", box: [0, 0.35, 1, 0.65], n: 4, colour: "near", snow: "snow" },
      ],
    },
    rain: {
      kind: "setting", region: [0, 0, 1, 1], overlay: true,
      colours: { drop: [210, 22, 72] },
      parts: [{ shape: "streaks", box: [0, 0, 1, 1], n: 70, colour: "drop" }],
    },
    storm: {
      kind: "setting", region: [0, 0, 1, 0.7], horizon: 0.7,
      colours: { cloud: [226, 22, 22], low: [222, 18, 38], bolt: [52, 70, 92] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "cloud", to: "low" },
        { shape: "bolt", box: [0.35, 0.1, 0.3, 0.9], colour: "bolt" },
      ],
    },
    road: {
      kind: "setting", region: [0, 0.62, 1, 0.38], horizon: 0.62,
      colours: { tar: [30, 8, 32], verge: [96, 35, 36], line: [48, 60, 80] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "verge", texture: "grass" },
        { shape: "poly", pts: [[0.47, 0], [0.53, 0], [0.9, 1], [0.1, 1]], colour: "tar" },
        { shape: "line", pts: [[0.5, 0.05], [0.5, 1]], width: 0.01, colour: "line", dash: true },
      ],
    },
  };

  /* Words that name a thing by its family: an oak is drawn as a tree until it
   * has an entry of its own. A value may name several entries (a beach is
   * sand and sea). */
  const FAMILIES = {
    oak: "tree", pine: "tree", willow: "tree", birch: "tree", palm: "tree", maple: "tree", elm: "tree",
    cottage: "house", home: "house", hut: "house", cabin: "house", building: "house", barn: "house",
    castle: "tower", church: "tower", steeple: "tower", spire: "tower", skyscraper: "tower",
    gate: "door", portal: "door", entrance: "door", doorway: "door",
    ship: "boat", yacht: "boat", sailboat: "boat", canoe: "boat",
    man: "person", woman: "person", girl: "person", boy: "person", child: "person", figure: "person",
    people: "person", friend: "person", stranger: "person", mother: "person", father: "person",
    kitten: "cat", lion: "cat", tiger: "cat", puppy: "dog", wolf: "dog", fox: "dog", horse: "dog",
    rose: "flower", tulip: "flower", daisy: "flower", lily: "flower", blossom: "flower", bloom: "flower",
    flame: "fire", blaze: "fire", bonfire: "fire", campfire: "fire",
    rock: "stone", boulder: "stone", pebble: "stone",
    hill: "mountain", peak: "mountain", volcano: "mountain",
    lamp: "candle", lantern: "candle",
    mug: "cup", teacup: "cup", glass: "cup",
    crow: "bird", raven: "bird", gull: "bird", dove: "bird", swallow: "bird",
    planet: "moon", comet: "star",
    heartbeat: "heart", love: "heart",
    skull: "bone", seed: "egg",
    ocean: "sea", lake: "sea", pond: "sea", water: "sea", waves: "sea", wave: "sea",
    stream: "river", creek: "river",
    meadow: "field", grass: "field", garden: "field", farm: "field", prairie: "field",
    sand: "desert", dune: "desert", dunes: "desert",
    woods: "forest", jungle: "forest",
    town: "city", street: "city", village: "city",
    space: "night", stars: "night", dark: "night",
    beach: ["sea", "desert"], coast: ["sea", "desert"], shore: ["sea", "desert"],
    path: "road", highway: "road",
    thunder: "storm", lightning: "storm",
    winter: "snow",
    automobile: "car", truck: "car",
  };

  const COLOUR_WORDS = {
    red: [2, 76, 46], orange: [26, 90, 52], yellow: [52, 90, 58], gold: [44, 80, 50],
    golden: [44, 80, 52], green: [122, 55, 40], blue: [218, 70, 46], purple: [280, 55, 42],
    violet: [268, 58, 50], pink: [332, 70, 70], brown: [26, 46, 30], black: [240, 8, 10],
    white: [40, 12, 92], grey: [210, 6, 52], gray: [210, 6, 52], silver: [210, 10, 74],
  };
  const COUNT_WORDS = { two: 2, three: 3, four: 4, five: 5, pair: 2, few: 3, several: 4, many: 5, some: 3 };
  const RELATIONS = {
    above: "above", over: "above", atop: "on", on: "on", onto: "on",
    under: "below", below: "below", beneath: "below", underneath: "below",
    in: "in", inside: "in", within: "in", into: "in",
    beside: "beside", by: "beside", near: "beside", with: "beside", and: "beside",
  };

  /* ── Reading ─────────────────────────────────────────────────────────── */

  function lookup(word) {
    if (ENTRIES[word]) return { keys: [word], plural: false };
    if (FAMILIES[word]) return { keys: [].concat(FAMILIES[word]), plural: false };
    const singulars = [];
    if (word.endsWith("ies")) singulars.push(word.slice(0, -3) + "y");
    if (word.endsWith("es")) singulars.push(word.slice(0, -2));
    if (word.endsWith("s")) singulars.push(word.slice(0, -1));
    for (const single of singulars) {
      if (ENTRIES[single]) return { keys: [single], plural: true };
      if (FAMILIES[single]) return { keys: [].concat(FAMILIES[single]), plural: true };
    }
    return null;
  }

  /* What a sentence names, in order: the things (with how many, their colour
   * and how each relates to the one before) and the places. A thing named
   * twice is drawn once. Up to three things and three places. */
  function read(text) {
    const words = String(text || "").toLowerCase().match(/[a-z]+/g) || [];
    const subjects = [], settings = [];
    let count = 1, colour = null, relation = null;
    for (const word of words) {
      if (COUNT_WORDS[word]) { count = COUNT_WORDS[word]; continue; }
      if (COLOUR_WORDS[word]) { colour = COLOUR_WORDS[word]; continue; }
      if (RELATIONS[word] && subjects.length) { relation = RELATIONS[word]; continue; }
      const found = lookup(word);
      if (!found) continue;
      for (const key of found.keys) {
        const entry = ENTRIES[key];
        if (entry.kind === "setting") {
          if (!settings.some((s) => s.key === key) && settings.length < 3) settings.push({ key, entry, colour });
        } else if (!subjects.some((s) => s.key === key) && subjects.length < 3) {
          const many = found.plural ? Math.max(count, 3) : count;
          // "mountains" as a place, not as three separate mountains.
          if (key === "mountain" && found.plural && !settings.some((s) => s.key === "mountains")) {
            settings.push({ key: "mountains", entry: ENTRIES.mountains, colour });
          } else {
            subjects.push({ key, entry, count: Math.min(key === "star" ? 30 : 6, many), colour, relation });
          }
        }
      }
      count = 1; colour = null; relation = null;
    }
    /* A thing in the sky, or ground that runs to a horizon, implies a sky
     * above it - otherwise whatever the field happens to be fills that half
     * and a green tree disappears against green. Moon and stars imply night. */
    const hasSky = settings.some((s) => ["sky", "night", "storm", "city", "forest", "snow"].includes(s.key));
    const wantsSky = subjects.some((s) => s.entry.anchor === "sky") ||
      settings.some((s) => Number.isFinite(s.entry.horizon) && !s.entry.overlay);
    if (!hasSky && wantsSky && settings.length < 4) {
      const nightly = subjects.some((s) => s.key === "moon" || s.key === "star");
      const key = nightly ? "night" : "sky";
      settings.unshift({ key, entry: ENTRIES[key], colour: null, implied: true });
    }
    return { subjects, settings, words: subjects.map((s) => s.key).concat(settings.map((s) => s.key)) };
  }

  /* ── Placing ────────────────────────────────────────────────────────────
   *
   * The first thing named is the subject and takes the focus - a third across,
   * chosen by the caller (fx). Places fill their regions; a place with a
   * horizon sets the ground line everything else stands on. A relation says
   * where the earlier thing is relative to the later one - "trees under the
   * sun" puts the sun above the trees, "a cat on a chair" puts the chair
   * under the cat, "a bird in a tree" puts the tree around the bird (and
   * draws it first). Anything else takes the other third. */
  function layout(scene, W, H, rng, fx = null) {
    const items = [];
    let horizon = null;
    for (const s of scene.settings) {
      const [rx, ry, rw, rh] = s.entry.region;
      items.push({ ...s, box: { x: rx * W, y: ry * H, w: rw * W, h: rh * H }, alpha: s.entry.overlay ? 0.55 : 0.8 });
      if (Number.isFinite(s.entry.horizon) && !s.entry.overlay) horizon = Math.max(horizon ?? 0, s.entry.horizon);
    }
    const groundY = (horizon != null ? horizon + (1 - horizon) * 0.62 : 0.92) * H;
    const skyY = (horizon != null ? horizon * 0.42 : 0.26) * H;
    const mainX = Number.isFinite(fx) ? fx : (rng() < 0.5 ? 1 / 3 : 2 / 3);
    const placed = [];
    const sizeOf = (entry, scale) => {
      let h = entry.size * H * scale;
      let w = h * entry.aspect;
      const maxW = W * 0.8;
      if (w > maxW) { h *= maxW / w; w = maxW; }
      return { w, h };
    };
    scene.subjects.forEach((s, index) => {
      const main = index === 0;
      // A second thing is smaller - unless the first sits on it or in it.
      const scale = main || s.relation === "on" || s.relation === "in" ? 1 : 0.68;
      const { w, h } = sizeOf(s.entry, s.count > 1 ? scale * 0.7 : scale);
      let cx = (main ? mainX : (mainX < 0.5 ? 2 / 3 : 1 / 3) + (index - 1) * 0.12) * W;
      let bottom;
      const anchor = s.entry.anchor;
      if (anchor === "sky") bottom = skyY + h / 2;
      else if (anchor === "water") bottom = ((horizon ?? 0.62) + 0.1) * H;
      else if (anchor === "centre") bottom = H * 0.5 + h / 2;
      else bottom = groundY;
      const before = placed[placed.length - 1];
      let z = 0;
      let lift = null;
      if (before && s.relation) {
        const b = before.box, under = b.x + b.w / 2;
        // The earlier thing is <relation> this one. Above and below keep their
        // own place across the canvas; on and in line the two up.
        if (s.relation === "above") bottom = Math.max(b.y + b.h + h * 1.02, bottom);
        if (s.relation === "below") bottom = Math.min(b.y - h * 0.1, bottom);
        if (s.relation === "on") { cx = under; z = -1; lift = before.key; }
        if (s.relation === "in") { cx = under; bottom = b.y + b.h / 2 + h * 0.55; z = -1; }
      }
      // Whatever stands on something keeps its top inside the canvas.
      const fit = Math.min(1, (bottom - H * 0.02) / h);
      const copies = Math.max(1, s.count);
      for (let c = 0; c < copies; c++) {
        let x = cx, y = bottom, k = 1;
        if (copies > 1) {
          const spread = anchor === "sky" || s.key === "star" ? 0.9 : 0.42;
          x = (s.key === "star" ? rng() : cx / W + (c / (copies - 1) - 0.5) * spread + (rng() - 0.5) * 0.06) * W;
          if (anchor === "sky") y = (s.key === "star" ? 0.06 + rng() * 0.5 : 0.1 + rng() * 0.3) * H + h / 2;
          else y = bottom + (rng() - 0.5) * h * 0.08;
          k = 0.7 + rng() * 0.5;
        }
        const bw = w * k * fit, bh = h * k * fit;
        const box = { x: x - bw / 2, y: Math.min(H - bh * 0.02, y) - bh, w: bw, h: bh };
        const item = { ...s, box, alpha: 1, z };
        placed.push(item);
        items.push(item);
      }
      // "A cat on a chair": the chair stands where it stands, and the cat is
      // lifted onto its seat (or its top).
      if (lift) {
        const support = placed[placed.length - 1].box;
        const top = support.y + support.h * (s.entry.seat ?? 0.04);
        for (const other of placed) {
          if (other.key !== lift) continue;
          other.box = { ...other.box, x: support.x + support.w / 2 - other.box.w / 2, y: top - other.box.h };
        }
      }
    });
    // Containers first, so what is in them is painted over them.
    items.sort((a, b) => (a.entry.kind === "setting" ? -2 : a.z || 0) - (b.entry.kind === "setting" ? -2 : b.z || 0));
    const first = placed[0];
    const focus = first
      ? { fx: (first.box.x + first.box.w / 2) / W, fy: (first.box.y + first.box.h / 2) / H }
      : null;
    return { items, focus, horizon };
  }

  /* ── Drawing ──────────────────────────────────────────────────────────── */

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function hsl(c, tone = 0, alpha = 1) {
    const [h, s, l] = c;
    return `hsla(${h}, ${s}%, ${clamp(l + tone * 100, 0, 100)}%, ${alpha})`;
  }
  function colourOf(item, part, name = part.colour) {
    const colours = item.entry.colours;
    const main = Object.keys(colours)[0];
    if (item.colour && name === main) return item.colour;
    return colours[name] || colours[main];
  }

  function boxPath(box, b, fn) {
    const x = box.x + b[0] * box.w, y = box.y + b[1] * box.h, w = b[2] * box.w, h = b[3] * box.h;
    return fn(x, y, w, h);
  }
  const P = (box, pt) => [box.x + pt[0] * box.w, box.y + pt[1] * box.h];

  function shapePath(part, box) {
    const path = new Path2D();
    const b = part.box || [0, 0, 1, 1];
    switch (part.shape) {
      case "rect":
        boxPath(box, b, (x, y, w, h) => {
          const r = (part.r || 0) * Math.min(w, h);
          if (r && path.roundRect) path.roundRect(x, y, w, h, r); else path.rect(x, y, w, h);
        });
        return path;
      case "ellipse":
        boxPath(box, b, (x, y, w, h) => path.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2));
        return path;
      case "poly": {
        part.pts.forEach((pt, i) => { const [x, y] = P(box, pt); if (i) path.lineTo(x, y); else path.moveTo(x, y); });
        path.closePath();
        return path;
      }
      case "almond":
        boxPath(box, b, (x, y, w, h) => {
          if (part.vertical) {
            path.moveTo(x + w / 2, y);
            path.quadraticCurveTo(x + w * 1.1, y + h * 0.5, x + w / 2, y + h);
            path.quadraticCurveTo(x - w * 0.1, y + h * 0.5, x + w / 2, y);
          } else {
            path.moveTo(x, y + h / 2);
            path.quadraticCurveTo(x + w * 0.5, y - h * 0.1, x + w, y + h / 2);
            path.quadraticCurveTo(x + w * 0.5, y + h * 1.1, x, y + h / 2);
          }
          path.closePath();
        });
        return path;
      case "egg":
        boxPath(box, b, (x, y, w, h) => {
          path.moveTo(x + w / 2, y);
          path.bezierCurveTo(x + w * 1.02, y, x + w * 1.05, y + h, x + w / 2, y + h);
          path.bezierCurveTo(x - w * 0.05, y + h, x - w * 0.02, y, x + w / 2, y);
        });
        return path;
      case "heart":
        boxPath(box, b, (x, y, w, h) => {
          path.moveTo(x + w / 2, y + h);
          path.bezierCurveTo(x - w * 0.1, y + h * 0.55, x, y - h * 0.05, x + w * 0.27, y + h * 0.02);
          path.bezierCurveTo(x + w * 0.42, y + h * 0.05, x + w / 2, y + h * 0.2, x + w / 2, y + h * 0.26);
          path.bezierCurveTo(x + w / 2, y + h * 0.2, x + w * 0.58, y + h * 0.05, x + w * 0.73, y + h * 0.02);
          path.bezierCurveTo(x + w, y - h * 0.05, x + w * 1.1, y + h * 0.55, x + w / 2, y + h);
        });
        return path;
      case "star":
        boxPath(box, b, (x, y, w, h) => {
          const n = part.n || 5, cx = x + w / 2, cy = y + h / 2;
          for (let i = 0; i < n * 2; i++) {
            const r = (i % 2 ? 0.2 : 0.5) * Math.min(w, h);
            const a = -Math.PI / 2 + i * Math.PI / n;
            if (i) path.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else path.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          path.closePath();
        });
        return path;
      case "ring":
        boxPath(box, b, (x, y, w, h) => {
          const t = part.thickness || 0.3;
          path.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          path.ellipse(x + w / 2, y + h / 2, (w / 2) * (1 - t), (h / 2) * (1 - t), 0, Math.PI * 2, 0, true);
        });
        return path;
      case "wave":
        boxPath(box, b, (x, y, w, h) => {
          path.moveTo(x, y);
          path.bezierCurveTo(x + w * 0.3, y - h * 0.15, x + w * 0.6, y + h * 0.15, x + w, y);
          path.lineTo(x + w, y + h);
          path.bezierCurveTo(x + w * 0.6, y + h * 1.15, x + w * 0.3, y + h * 0.85, x, y + h);
          path.closePath();
        });
        return path;
      default:
        return null;
    }
  }

  function texture(ctx, path, kind, box, colour, rng) {
    if (!kind) return;
    ctx.save();
    ctx.clip(path);
    const s = Math.max(4, Math.min(box.w, box.h));
    const dark = hsl(colour, -0.12, 0.55), light = hsl(colour, 0.1, 0.5);
    ctx.lineCap = "round";
    if (kind.startsWith("grain") || kind === "bark") {
      const gap = s / 11;
      ctx.lineWidth = Math.max(1, s / 90);
      const n = Math.ceil((kind === "grain-h" ? box.h : box.w) / gap) + 2;
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = i % 2 ? dark : light;
        ctx.beginPath();
        if (kind === "grain-h") {
          const y = box.y + i * gap + (rng() - 0.5) * gap * 0.4;
          ctx.moveTo(box.x, y);
          ctx.bezierCurveTo(box.x + box.w * 0.3, y + (rng() - 0.5) * gap, box.x + box.w * 0.7, y + (rng() - 0.5) * gap, box.x + box.w, y);
        } else if (kind === "grain-d") {
          const x = box.x - box.h + i * gap * 1.4;
          ctx.moveTo(x, box.y + box.h);
          ctx.lineTo(x + box.h * 0.8, box.y);
        } else {
          const x = box.x + i * gap + (rng() - 0.5) * gap * 0.4;
          const wobble = kind === "bark" ? gap * 0.5 : gap * 0.2;
          ctx.moveTo(x, box.y);
          ctx.bezierCurveTo(x + (rng() - 0.5) * wobble, box.y + box.h * 0.33, x + (rng() - 0.5) * wobble, box.y + box.h * 0.66, x, box.y + box.h);
        }
        ctx.stroke();
      }
    } else if (kind === "brick") {
      const rowH = s / 9, brickW = rowH * 2.2;
      ctx.strokeStyle = dark;
      ctx.lineWidth = Math.max(1, rowH / 7);
      for (let row = 0, y = box.y; y < box.y + box.h; row++, y += rowH) {
        ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
        for (let x = box.x + (row % 2 ? brickW / 2 : 0); x < box.x + box.w; x += brickW) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
        }
      }
    } else if (kind === "speckle" || kind === "scales" || kind === "fur") {
      const n = kind === "fur" ? 90 : 60;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = rng() < 0.5 ? dark : light;
        const r = s * (kind === "scales" ? 0.05 : 0.018) * (0.6 + rng());
        ctx.beginPath();
        if (kind === "fur") {
          const x = box.x + rng() * box.w, y = box.y + rng() * box.h;
          ctx.ellipse(x, y, r * 0.6, r * 2.2, 0.3, 0, Math.PI * 2);
        } else {
          ctx.arc(box.x + rng() * box.w, box.y + rng() * box.h, r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    } else if (kind === "ripple") {
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1, s / 60);
      for (let y = box.y + s / 14; y < box.y + box.h; y += s / 9) {
        ctx.beginPath();
        for (let x = box.x; x <= box.x + box.w; x += s / 20) {
          const yy = y + Math.sin((x - box.x) / (s / 6)) * s / 50;
          if (x === box.x) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    } else if (kind === "leafy") {
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = hsl(colour, (rng() - 0.45) * 0.24, 0.8);
        ctx.beginPath();
        ctx.ellipse(box.x + rng() * box.w, box.y + rng() * box.h, s * 0.05, s * 0.028, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === "grass") {
      ctx.lineWidth = Math.max(1, s / 120);
      for (let i = 0; i < 160; i++) {
        const x = box.x + rng() * box.w, y = box.y + rng() * box.h;
        ctx.strokeStyle = rng() < 0.5 ? dark : light;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rng() - 0.5) * s * 0.02, y - s * (0.03 + rng() * 0.04)); ctx.stroke();
      }
    } else if (kind === "veins" || kind === "rays") {
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      ctx.strokeStyle = kind === "rays" ? dark : light;
      ctx.lineWidth = Math.max(1, s / 70);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        ctx.beginPath();
        if (kind === "veins") {
          const t = box.y + (i / 14) * box.h;
          ctx.moveTo(cx, t); ctx.lineTo(cx + (i % 2 ? 1 : -1) * box.w * 0.4, t - box.h * 0.08);
        } else {
          ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * box.w / 2, cy + Math.sin(a) * box.h / 2);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // The pieces that are drawn rather than filled as one path.
  function special(ctx, part, box, item, rng) {
    const colour = colourOf(item, part);
    const tone = part.tone || 0;
    const b = part.box || [0, 0, 1, 1];
    const x = box.x + b[0] * box.w, y = box.y + b[1] * box.h, w = b[2] * box.w, h = b[3] * box.h;
    const s = Math.max(2, Math.min(box.w, box.h));
    switch (part.shape) {
      case "line": {
        ctx.strokeStyle = hsl(colour, tone);
        ctx.lineWidth = Math.max(1, (part.width || 0.05) * box.w);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (part.dash) ctx.setLineDash([s * 0.08, s * 0.08]);
        ctx.beginPath();
        part.pts.forEach((pt, i) => { const [px, py] = P(box, pt); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        ctx.stroke();
        ctx.setLineDash([]);
        return true;
      }
      case "glow": {
        const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) / 2);
        g.addColorStop(0, hsl(colour, 0.05, 0.55));
        g.addColorStop(1, hsl(colour, 0, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        return true;
      }
      case "gradient": {
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, hsl(colour, tone));
        g.addColorStop(1, hsl(colourOf(item, part, part.to), tone));
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        return true;
      }
      case "tongues": {
        const n = part.n || 5;
        ctx.fillStyle = hsl(colour, tone);
        for (let i = 0; i < n; i++) {
          const cx = x + w * (n === 1 ? 0.5 : 0.12 + 0.76 * (i / (n - 1))) + (rng() - 0.5) * w * 0.06;
          const middle = 1 - Math.abs(i / Math.max(1, n - 1) - 0.5) * 1.2;
          const top = y + h * (1 - (0.55 + 0.45 * middle) * (0.8 + rng() * 0.3));
          const half = w / n * 0.9;
          const lean = (rng() - 0.5) * half;
          ctx.beginPath();
          ctx.moveTo(cx - half, y + h);
          ctx.bezierCurveTo(cx - half * 1.1, y + h * 0.7, cx + lean - half * 0.2, top + (y + h - top) * 0.3, cx + lean, top);
          ctx.bezierCurveTo(cx + lean + half * 0.2, top + (y + h - top) * 0.3, cx + half * 1.1, y + h * 0.7, cx + half, y + h);
          ctx.closePath();
          ctx.fill();
        }
        return true;
      }
      case "cluster": {
        const n = part.n || 12, r = (part.r || 0.2) * Math.min(w, h * 1.4);
        const path = new Path2D();
        for (let i = 0; i < n; i++) {
          const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * 0.5;
          const px = x + w / 2 + Math.cos(a) * d * (w - r), py = y + h / 2 + Math.sin(a) * d * (h - r);
          const rr = r * (0.6 + rng() * 0.5);
          path.moveTo(px + rr, py);
          path.ellipse(px, py, rr, rr * 0.85, 0, 0, Math.PI * 2);
        }
        ctx.fillStyle = hsl(colour, tone);
        ctx.fill(path);
        texture(ctx, path, part.texture, { x, y, w, h }, colour, rng);
        return true;
      }
      case "petals": {
        const n = part.n || 6, cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
        ctx.fillStyle = hsl(colour, tone);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5, r * 0.26, a, 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      }
      case "rays": {
        const n = part.n || 12, cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
        ctx.strokeStyle = hsl(colour, tone, 0.8);
        ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.lineCap = "round";
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62);
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.stroke();
        }
        return true;
      }
      case "rungs": case "ticks": {
        const n = part.n || 6;
        ctx.strokeStyle = hsl(colour, tone);
        ctx.lineWidth = Math.max(1, (part.width || 0.05) * box.w);
        ctx.lineCap = "round";
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          if (part.shape === "rungs") {
            const yy = y + (i + 0.5) * h / n;
            ctx.moveTo(x, yy); ctx.lineTo(x + w, yy);
          } else {
            const a = (i / n) * Math.PI * 2, cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
            ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          ctx.stroke();
        }
        return true;
      }
      case "bands": {
        const n = part.n || 4;
        for (let i = 0; i < n; i++) {
          if (i % 2) continue;
          const yy = y + (i / n) * h, hh = h / n;
          const inset = part.taper ? (1 - (i + 0.5) / n) * w * 0.12 : 0;
          ctx.fillStyle = hsl(colour, tone);
          ctx.fillRect(x + inset, yy, w - inset * 2, hh);
        }
        return true;
      }
      case "scatter": {
        const n = part.n || 40, r = (part.r || 0.004) * Math.max(ctx.canvas.width, ctx.canvas.height);
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = hsl(colour, (rng() - 0.5) * 0.1, 0.6 + rng() * 0.4);
          ctx.beginPath();
          ctx.arc(x + rng() * w, y + rng() * h, r * (0.5 + rng()), 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      }
      case "ripples": {
        const n = part.n || 8;
        ctx.strokeStyle = hsl(colour, tone, 0.7);
        for (let i = 0; i < n; i++) {
          const yy = y + (i / n) * h * (0.3 + 0.7 * (i / n));
          ctx.lineWidth = Math.max(1, (1 + i) * h / 260);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const x0 = x + rng() * w, len = w * (0.05 + rng() * 0.12) * (1 + i / n);
            ctx.moveTo(x0, yy + (rng() - 0.5) * h / n);
            ctx.lineTo(x0 + len, yy + (rng() - 0.5) * h / n);
          }
          ctx.stroke();
        }
        return true;
      }
      case "river": {
        ctx.fillStyle = hsl(colour, tone);
        ctx.beginPath();
        ctx.moveTo(x + w * 0.46, y);
        ctx.bezierCurveTo(x + w * 0.2, y + h * 0.3, x + w * 0.75, y + h * 0.6, x + w * 0.15, y + h);
        ctx.lineTo(x + w * 0.65, y + h);
        ctx.bezierCurveTo(x + w * 1.0, y + h * 0.6, x + w * 0.35, y + h * 0.3, x + w * 0.54, y);
        ctx.closePath();
        ctx.fill();
        return true;
      }
      case "dunes": {
        const n = part.n || 3;
        ctx.fillStyle = hsl(colour, tone, 0.8);
        for (let i = 0; i < n; i++) {
          const yy = y + h * (0.15 + 0.8 * i / n);
          ctx.beginPath();
          ctx.moveTo(x, yy + h * 0.1);
          ctx.bezierCurveTo(x + w * 0.3, yy - h * 0.12, x + w * 0.6, yy + h * 0.2, x + w, yy);
          ctx.lineTo(x + w, yy + h * 0.06);
          ctx.bezierCurveTo(x + w * 0.6, yy + h * 0.24, x + w * 0.3, yy - h * 0.06, x, yy + h * 0.16);
          ctx.closePath();
          ctx.fill();
        }
        return true;
      }
      case "treeline": {
        const n = part.n || 8;
        for (let i = 0; i < n; i++) {
          const tw = w / n * (1.3 + rng() * 0.6), th = h * (0.55 + rng() * 0.4);
          const cx = x + (i + 0.5) * w / n + (rng() - 0.5) * w / n * 0.4;
          ctx.fillStyle = hsl(colourOf(item, part, i % 2 && part.alternate ? part.alternate : part.colour), (rng() - 0.5) * 0.08);
          ctx.beginPath();
          ctx.moveTo(cx - tw / 2, y + h);
          ctx.lineTo(cx, y + h - th);
          ctx.lineTo(cx + tw / 2, y + h);
          ctx.closePath();
          ctx.fill();
        }
        return true;
      }
      case "skyline": {
        const n = part.n || 10;
        let cx = x;
        for (let i = 0; i < n && cx < x + w; i++) {
          const bw = w / n * (0.7 + rng() * 0.6), bh = h * (0.3 + rng() * 0.65);
          ctx.fillStyle = hsl(colour, (rng() - 0.5) * 0.08);
          ctx.fillRect(cx, y + h - bh, bw * 0.96, bh);
          ctx.fillStyle = hsl(colourOf(item, part, part.alternate), 0, 0.85);
          for (let wy = y + h - bh + bw * 0.12; wy < y + h - bw * 0.1; wy += bw * 0.2) {
            for (let wx = cx + bw * 0.14; wx < cx + bw * 0.84; wx += bw * 0.24) {
              if (rng() < 0.45) ctx.fillRect(wx, wy, bw * 0.1, bw * 0.08);
            }
          }
          cx += bw;
        }
        return true;
      }
      case "range": {
        const n = part.n || 4;
        ctx.fillStyle = hsl(colour, tone);
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        const peaks = [];
        for (let i = 0; i <= n; i++) {
          const px = x + (i / n) * w + (rng() - 0.5) * w / n * 0.5;
          const py = y + h * (0.05 + rng() * 0.45);
          peaks.push([px, py]);
          ctx.lineTo(px - w / n * 0.25, y + h * (0.55 + rng() * 0.2));
          ctx.lineTo(px, py);
        }
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
        if (part.snow) {
          ctx.fillStyle = hsl(colourOf(item, part, part.snow));
          for (const [px, py] of peaks) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - w / n * 0.08, py + h * 0.12);
            ctx.lineTo(px + w / n * 0.08, py + h * 0.12);
            ctx.closePath();
            ctx.fill();
          }
        }
        return true;
      }
      case "streaks": {
        const n = part.n || 60;
        ctx.strokeStyle = hsl(colour, tone, 0.55);
        ctx.lineWidth = Math.max(1, Math.max(w, h) / 500);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const sx = x + rng() * w, sy = y + rng() * h, len = h * (0.05 + rng() * 0.06);
          ctx.moveTo(sx, sy); ctx.lineTo(sx - len * 0.25, sy + len);
        }
        ctx.stroke();
        return true;
      }
      case "bolt": {
        ctx.strokeStyle = hsl(colour, tone);
        ctx.lineWidth = Math.max(2, w * 0.05);
        ctx.lineJoin = "miter";
        ctx.beginPath();
        let bx = x + w * 0.5, by = y;
        ctx.moveTo(bx, by);
        for (let i = 0; i < 6; i++) {
          bx += (rng() - 0.5) * w * 0.6; by += h / 6;
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
        return true;
      }
      default:
        return false;
    }
  }

  function paintItem(ctx, item, rng) {
    const box = item.box;
    for (const part of item.entry.parts) {
      if (part.cut) {
        const path = shapePath(part, box);
        if (!path) continue;
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill(path);
        ctx.restore();
        continue;
      }
      if (special(ctx, part, box, item, rng)) continue;
      const path = shapePath(part, box);
      if (!path) continue;
      const colour = colourOf(item, part);
      ctx.fillStyle = hsl(colour, part.tone || 0);
      ctx.fill(path, "evenodd");
      if (part.texture) {
        const b = part.box || [0, 0, 1, 1];
        const pbox = part.pts
          ? bounds(part.pts.map((pt) => P(box, pt)))
          : { x: box.x + b[0] * box.w, y: box.y + b[1] * box.h, w: b[2] * box.w, h: b[3] * box.h };
        texture(ctx, path, part.texture, pbox, colour, rng);
      }
    }
  }

  function seededRandom(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function bounds(points) {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }

  /* Paint laid-out items onto ctx (transparent where nothing is), each on its
   * own layer so a cut-out (the moon's crescent, a bridge's arch) removes only
   * that thing. `only` limits it to "subject" or "setting". */
  function paint(ctx, W, H, items, rng, only = null) {
    const layer = document.createElement("canvas");
    layer.width = W; layer.height = H;
    const lctx = layer.getContext("2d");
    // One seed per item, drawn up front, so an item looks the same whether or
    // not the others are painted with it.
    const seeds = items.map(() => Math.floor(rng() * 4294967296) >>> 0);
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (only && item.entry.kind !== only) continue;
      lctx.clearRect(0, 0, W, H);
      paintItem(lctx, item, seededRandom(seeds[index]));
      ctx.save();
      ctx.globalAlpha = item.alpha ?? 1;
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }
    layer.width = 0; layer.height = 0;
  }

  /* The main colour of each thing in a laid-out scene, as RGB - a painting of
   * a red door keeps a red on its palette even when the door is small. */
  function subjectColours(items) {
    const out = [];
    for (const item of items) {
      if (item.entry.kind !== "subject") continue;
      const [h, sat, l] = item.colour || Object.values(item.entry.colours)[0];
      const a = (sat / 100) * Math.min(l / 100, 1 - l / 100);
      const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
      out.push([f(0), f(8), f(4)]);
    }
    return out;
  }

  global.HexfieldVisual = { ENTRIES, FAMILIES, COLOUR_WORDS, RELATIONS, lookup, read, layout, paint, subjectColours };
})(typeof globalThis !== "undefined" ? globalThis : this);
