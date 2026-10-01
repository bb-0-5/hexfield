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
      // A tall town house, a flat-roofed one, a round hut.
      variants: [
        {
          aspect: 0.62,
          parts: [
            { shape: "rect", box: [0.08, 0.22, 0.84, 0.78], colour: "wall", texture: "brick" },
            { shape: "poly", pts: [[0.02, 0.25], [0.5, 0], [0.98, 0.25]], colour: "roof", texture: "grain-h" },
            { shape: "rect", box: [0.2, 0.32, 0.2, 0.15], colour: "window" },
            { shape: "rect", box: [0.6, 0.32, 0.2, 0.15], colour: "window" },
            { shape: "rect", box: [0.2, 0.55, 0.2, 0.15], colour: "window" },
            { shape: "rect", box: [0.6, 0.74, 0.18, 0.26], colour: "door" },
          ],
        },
        {
          aspect: 1.5,
          parts: [
            { shape: "rect", box: [0.04, 0.3, 0.92, 0.7], colour: "wall" },
            { shape: "rect", box: [0, 0.24, 1, 0.08], colour: "roof", tone: -0.06 },
            { shape: "rect", box: [0.12, 0.44, 0.44, 0.3], colour: "window" },
            { shape: "rect", box: [0.68, 0.55, 0.14, 0.45], colour: "door" },
          ],
        },
        {
          aspect: 1,
          parts: [
            { shape: "rect", box: [0.14, 0.5, 0.72, 0.5], colour: "wall", texture: "grain-v" },
            { shape: "poly", pts: [[0, 0.56], [0.5, 0], [1, 0.56]], colour: "roof", texture: "grain-h" },
            { shape: "rect", box: [0.42, 0.68, 0.16, 0.32], colour: "door" },
          ],
        },
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
      // A pine, a tall poplar, a windswept tree.
      variants: [
        {
          aspect: 0.56,
          parts: [
            { shape: "poly", pts: [[0.45, 1], [0.47, 0.78], [0.53, 0.78], [0.55, 1]], colour: "bark", texture: "bark" },
            { shape: "poly", pts: [[0.5, 0.36], [0.98, 0.84], [0.02, 0.84]], colour: "leaves", tone: -0.05 },
            { shape: "poly", pts: [[0.5, 0.16], [0.86, 0.58], [0.14, 0.58]], colour: "leaves" },
            { shape: "poly", pts: [[0.5, 0], [0.74, 0.32], [0.26, 0.32]], colour: "leaves", tone: 0.04 },
          ],
        },
        {
          aspect: 0.38,
          parts: [
            { shape: "rect", box: [0.44, 0.78, 0.12, 0.22], colour: "bark", texture: "bark" },
            { shape: "almond", box: [0.1, 0, 0.8, 0.86], vertical: true, colour: "leaves", texture: "leafy" },
          ],
        },
        {
          aspect: 1,
          parts: [
            { shape: "poly", pts: [[0.3, 1], [0.42, 0.5], [0.5, 0.42], [0.44, 0.56], [0.4, 1]], colour: "bark", texture: "bark" },
            { shape: "line", pts: [[0.45, 0.5], [0.8, 0.3]], width: 0.03, colour: "bark" },
            { shape: "line", pts: [[0.47, 0.46], [0.66, 0.16]], width: 0.03, colour: "bark" },
            { shape: "cluster", box: [0.36, 0, 0.62, 0.48], n: 11, r: 0.2, colour: "leaves", texture: "leafy" },
          ],
        },
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
      // Arms up (dancing), walking side-on, sitting.
      variants: [
        {
          aspect: 0.62,
          parts: [
            { shape: "line", pts: [[0.44, 0.6], [0.3, 1]], width: 0.1, colour: "legs" },
            { shape: "line", pts: [[0.56, 0.6], [0.72, 0.98]], width: 0.1, colour: "legs" },
            { shape: "line", pts: [[0.36, 0.24], [0.14, 0.02]], width: 0.08, colour: "clothes", tone: -0.05 },
            { shape: "line", pts: [[0.64, 0.24], [0.88, 0.06]], width: 0.08, colour: "clothes", tone: -0.05 },
            { shape: "poly", pts: [[0.34, 0.2], [0.66, 0.2], [0.6, 0.62], [0.4, 0.62]], colour: "clothes", texture: "grain-v" },
            { shape: "ellipse", box: [0.39, 0.02, 0.22, 0.16], colour: "skin" },
          ],
        },
        {
          aspect: 0.42,
          parts: [
            { shape: "line", pts: [[0.5, 0.58], [0.3, 1]], width: 0.14, colour: "legs", tone: -0.05 },
            { shape: "line", pts: [[0.5, 0.58], [0.72, 1]], width: 0.14, colour: "legs" },
            { shape: "line", pts: [[0.5, 0.24], [0.28, 0.5]], width: 0.11, colour: "clothes", tone: -0.08 },
            { shape: "poly", pts: [[0.34, 0.18], [0.66, 0.18], [0.64, 0.6], [0.36, 0.6]], colour: "clothes", texture: "grain-v" },
            { shape: "line", pts: [[0.5, 0.24], [0.72, 0.52]], width: 0.11, colour: "clothes" },
            { shape: "ellipse", box: [0.3, 0, 0.4, 0.17], colour: "skin" },
          ],
        },
        {
          aspect: 0.66, size: 0.56,
          parts: [
            { shape: "line", pts: [[0.3, 0.62], [0.8, 0.66]], width: 0.16, colour: "legs" },
            { shape: "line", pts: [[0.8, 0.66], [0.84, 1]], width: 0.13, colour: "legs", tone: -0.05 },
            { shape: "poly", pts: [[0.18, 0.2], [0.54, 0.2], [0.5, 0.64], [0.2, 0.64]], colour: "clothes", texture: "grain-v" },
            { shape: "line", pts: [[0.4, 0.26], [0.66, 0.56]], width: 0.1, colour: "clothes", tone: -0.05 },
            { shape: "ellipse", box: [0.18, 0.01, 0.34, 0.18], colour: "skin" },
          ],
        },
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
      // Other ways a cat is: sitting side-on, curled up as a loaf, walking.
      variants: [
        {
          aspect: 0.78,
          parts: [
            { shape: "line", pts: [[0.28, 0.94], [0.06, 0.9], [0.04, 0.7]], width: 0.07, colour: "fur" },
            { shape: "egg", box: [0.18, 0.36, 0.56, 0.64], colour: "fur", texture: "fur" },
            { shape: "line", pts: [[0.6, 0.62], [0.62, 1]], width: 0.08, colour: "fur" },
            { shape: "ellipse", box: [0.44, 0.08, 0.44, 0.36], colour: "fur" },
            { shape: "poly", pts: [[0.48, 0.16], [0.5, -0.04], [0.62, 0.1]], colour: "fur" },
            { shape: "poly", pts: [[0.66, 0.1], [0.76, -0.04], [0.8, 0.16]], colour: "fur" },
            { shape: "ellipse", box: [0.72, 0.2, 0.07, 0.06], colour: "eye" },
          ],
        },
        {
          aspect: 1.6,
          parts: [
            { shape: "ellipse", box: [0.04, 0.4, 0.78, 0.6], colour: "fur", texture: "fur" },
            { shape: "line", pts: [[0.1, 0.92], [0.36, 1], [0.6, 0.96]], width: 0.05, colour: "fur", tone: -0.05 },
            { shape: "ellipse", box: [0.58, 0.14, 0.38, 0.5], colour: "fur" },
            { shape: "poly", pts: [[0.62, 0.24], [0.64, 0.02], [0.74, 0.16]], colour: "fur" },
            { shape: "poly", pts: [[0.82, 0.16], [0.92, 0.02], [0.93, 0.24]], colour: "fur" },
            { shape: "almond", box: [0.66, 0.34, 0.09, 0.05], colour: "eye" },
            { shape: "almond", box: [0.8, 0.34, 0.09, 0.05], colour: "eye" },
          ],
        },
        {
          aspect: 1.45,
          parts: [
            { shape: "line", pts: [[0.22, 0.45], [0.08, 0.26], [0.12, 0.04]], width: 0.05, colour: "fur" },
            { shape: "line", pts: [[0.26, 0.58], [0.22, 1]], width: 0.06, colour: "fur", tone: -0.06 },
            { shape: "line", pts: [[0.36, 0.58], [0.38, 1]], width: 0.06, colour: "fur" },
            { shape: "line", pts: [[0.62, 0.58], [0.6, 1]], width: 0.06, colour: "fur", tone: -0.06 },
            { shape: "line", pts: [[0.7, 0.58], [0.74, 1]], width: 0.06, colour: "fur" },
            { shape: "ellipse", box: [0.18, 0.32, 0.6, 0.34], colour: "fur", texture: "fur" },
            { shape: "ellipse", box: [0.66, 0.14, 0.3, 0.32], colour: "fur" },
            { shape: "poly", pts: [[0.69, 0.22], [0.7, 0.02], [0.8, 0.16]], colour: "fur" },
            { shape: "poly", pts: [[0.84, 0.16], [0.93, 0.02], [0.94, 0.24]], colour: "fur" },
            { shape: "ellipse", box: [0.84, 0.26, 0.05, 0.05], colour: "eye" },
          ],
        },
      ],
    },
    // ── people of consequence, and what they sit on ────────────────────
    king: {
      kind: "subject", anchor: "ground", size: 0.76, aspect: 0.52,
      colours: { robe: [350, 58, 34], skin: [24, 42, 62], crown: [46, 85, 55], trim: [40, 12, 92] },
      parts: [
        { shape: "poly", pts: [[0.26, 0.2], [0.74, 0.2], [0.96, 1], [0.04, 1]], colour: "robe", texture: "grain-v" },
        { shape: "ellipse", box: [0.22, 0.16, 0.56, 0.1], colour: "trim" },
        { shape: "line", pts: [[0.82, 0.28], [0.84, 0.82]], width: 0.05, colour: "crown" },
        { shape: "ellipse", box: [0.78, 0.22, 0.12, 0.08], colour: "crown", tone: 0.1 },
        { shape: "ellipse", box: [0.36, 0.03, 0.28, 0.16], colour: "skin" },
        { shape: "poly", pts: [[0.35, 0.07], [0.35, -0.04], [0.42, 0.01], [0.5, -0.06], [0.58, 0.01], [0.65, -0.04], [0.65, 0.07]], colour: "crown" },
      ],
      variants: [
        {
          aspect: 0.8, size: 0.62,
          parts: [
            { shape: "poly", pts: [[0.2, 0.22], [0.6, 0.22], [0.64, 0.66], [0.16, 0.66]], colour: "robe", texture: "grain-v" },
            { shape: "poly", pts: [[0.16, 0.6], [0.9, 0.62], [0.96, 1], [0.1, 1]], colour: "robe", tone: -0.06 },
            { shape: "ellipse", box: [0.16, 0.18, 0.48, 0.1], colour: "trim" },
            { shape: "line", pts: [[0.72, 0.24], [0.76, 0.9]], width: 0.04, colour: "crown" },
            { shape: "ellipse", box: [0.26, 0.04, 0.28, 0.17], colour: "skin" },
            { shape: "poly", pts: [[0.25, 0.08], [0.25, -0.03], [0.32, 0.02], [0.4, -0.05], [0.48, 0.02], [0.55, -0.03], [0.55, 0.08]], colour: "crown" },
          ],
        },
      ],
    },
    throne: {
      kind: "subject", anchor: "ground", size: 0.5, aspect: 0.72, seat: 0.56,
      colours: { gold: [42, 70, 46], cushion: [350, 60, 36] },
      parts: [
        { shape: "poly", pts: [[0.2, 0.6], [0.2, 0.1], [0.35, 0], [0.5, 0.08], [0.65, 0], [0.8, 0.1], [0.8, 0.6]], colour: "gold", texture: "grain-v" },
        { shape: "rect", box: [0.28, 0.14, 0.44, 0.42], colour: "cushion" },
        { shape: "rect", box: [0.04, 0.4, 0.14, 0.2], colour: "gold", tone: -0.06 },
        { shape: "rect", box: [0.82, 0.4, 0.14, 0.2], colour: "gold", tone: -0.06 },
        { shape: "rect", box: [0.08, 0.56, 0.84, 0.12], colour: "cushion", tone: -0.04 },
        { shape: "rect", box: [0.12, 0.66, 0.1, 0.34], colour: "gold" },
        { shape: "rect", box: [0.78, 0.66, 0.1, 0.34], colour: "gold" },
      ],
    },
    face: {
      kind: "subject", anchor: "centre", size: 0.72, aspect: 0.8, centred: true,
      colours: { skin: [24, 42, 62], hair: [28, 40, 20], eye: [210, 30, 25], lips: [355, 45, 48], clothes: [215, 35, 32] },
      parts: [
        { shape: "dome", box: [0.02, 0.8, 0.96, 0.2], colour: "clothes", texture: "grain-v" },
        { shape: "rect", box: [0.4, 0.66, 0.2, 0.18], colour: "skin", tone: -0.06 },
        { shape: "ellipse", box: [0.18, 0.02, 0.64, 0.62], colour: "hair" },
        { shape: "egg", box: [0.24, 0.1, 0.52, 0.64], colour: "skin" },
        { shape: "dome", box: [0.22, 0.02, 0.56, 0.18], colour: "hair" },
        { shape: "almond", box: [0.32, 0.34, 0.12, 0.05], colour: "eye" },
        { shape: "almond", box: [0.56, 0.34, 0.12, 0.05], colour: "eye" },
        { shape: "line", pts: [[0.5, 0.38], [0.47, 0.5], [0.52, 0.52]], width: 0.02, colour: "skin", tone: -0.14 },
        { shape: "almond", box: [0.42, 0.57, 0.16, 0.06], colour: "lips" },
      ],
      variants: [
        {
          aspect: 0.8,
          parts: [
            { shape: "dome", box: [0.02, 0.8, 0.96, 0.2], colour: "clothes", texture: "grain-v" },
            { shape: "rect", box: [0.38, 0.64, 0.2, 0.2], colour: "skin", tone: -0.06 },
            { shape: "ellipse", box: [0.14, 0.02, 0.62, 0.6], colour: "hair" },
            { shape: "egg", box: [0.26, 0.1, 0.48, 0.62], colour: "skin" },
            { shape: "poly", pts: [[0.7, 0.4], [0.8, 0.46], [0.72, 0.5]], colour: "skin" },
            { shape: "almond", box: [0.52, 0.33, 0.12, 0.05], colour: "eye" },
            { shape: "almond", box: [0.58, 0.56, 0.12, 0.05], colour: "lips" },
          ],
        },
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
      // Sitting, lying down, running.
      variants: [
        {
          aspect: 0.9,
          parts: [
            { shape: "line", pts: [[0.14, 0.86], [0.02, 0.7]], width: 0.06, colour: "fur" },
            { shape: "ellipse", box: [0.08, 0.38, 0.56, 0.6], colour: "fur", texture: "fur" },
            { shape: "line", pts: [[0.56, 0.5], [0.57, 1]], width: 0.08, colour: "fur", tone: -0.06 },
            { shape: "line", pts: [[0.67, 0.5], [0.69, 1]], width: 0.08, colour: "fur" },
            { shape: "ellipse", box: [0.4, 0.2, 0.36, 0.5], colour: "fur" },
            { shape: "ellipse", box: [0.54, 0.02, 0.36, 0.3], colour: "fur" },
            { shape: "ellipse", box: [0.8, 0.14, 0.18, 0.12], colour: "dark" },
            { shape: "ellipse", box: [0.55, 0.04, 0.1, 0.28], colour: "dark" },
          ],
        },
        {
          aspect: 2,
          parts: [
            { shape: "line", pts: [[0.08, 0.8], [0, 0.96]], width: 0.04, colour: "fur" },
            { shape: "ellipse", box: [0.05, 0.45, 0.72, 0.5], colour: "fur", texture: "fur" },
            { shape: "line", pts: [[0.62, 0.9], [0.98, 0.94]], width: 0.06, colour: "fur", tone: -0.06 },
            { shape: "ellipse", box: [0.64, 0.16, 0.26, 0.44], colour: "fur" },
            { shape: "ellipse", box: [0.84, 0.36, 0.14, 0.14], colour: "dark" },
            { shape: "ellipse", box: [0.64, 0.18, 0.08, 0.32], colour: "dark" },
          ],
        },
        {
          aspect: 1.6,
          parts: [
            { shape: "line", pts: [[0.26, 0.55], [0.06, 0.9]], width: 0.06, colour: "fur", tone: -0.06 },
            { shape: "line", pts: [[0.34, 0.58], [0.18, 1]], width: 0.06, colour: "fur" },
            { shape: "line", pts: [[0.64, 0.55], [0.84, 0.95]], width: 0.06, colour: "fur", tone: -0.06 },
            { shape: "line", pts: [[0.72, 0.55], [0.98, 0.82]], width: 0.06, colour: "fur" },
            { shape: "line", pts: [[0.18, 0.4], [0.02, 0.2], [0.04, 0.08]], width: 0.05, colour: "fur" },
            { shape: "ellipse", box: [0.16, 0.3, 0.6, 0.32], colour: "fur", texture: "fur" },
            { shape: "ellipse", box: [0.7, 0.05, 0.26, 0.3], colour: "fur" },
            { shape: "ellipse", box: [0.9, 0.18, 0.1, 0.1], colour: "dark" },
            { shape: "ellipse", box: [0.7, 0.02, 0.1, 0.2], colour: "dark" },
          ],
        },
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
      // A rowing boat, a steamer, one big leaning sail.
      variants: [
        {
          aspect: 2.2, size: 0.2,
          parts: [
            { shape: "line", pts: [[0.32, 0.12], [0.06, 0.9]], width: 0.025, colour: "mast" },
            { shape: "poly", pts: [[0, 0.35], [1, 0.35], [0.86, 1], [0.14, 1]], colour: "hull", texture: "grain-h" },
          ],
        },
        {
          aspect: 2,
          parts: [
            { shape: "rect", box: [0.56, 0.02, 0.1, 0.3], colour: "hull", tone: -0.12 },
            { shape: "rect", box: [0.24, 0.28, 0.48, 0.28], colour: "sail" },
            { shape: "rect", box: [0.3, 0.36, 0.06, 0.08], colour: "mast" },
            { shape: "rect", box: [0.44, 0.36, 0.06, 0.08], colour: "mast" },
            { shape: "poly", pts: [[0, 0.55], [1, 0.55], [0.9, 1], [0.08, 1]], colour: "hull", texture: "grain-h" },
          ],
        },
        {
          aspect: 1.2,
          parts: [
            { shape: "line", pts: [[0.45, 0.72], [0.52, 0]], width: 0.03, colour: "mast" },
            { shape: "poly", pts: [[0.54, 0.02], [0.96, 0.66], [0.52, 0.66]], colour: "sail" },
            { shape: "poly", pts: [[0.04, 0.72], [0.98, 0.72], [0.8, 1], [0.2, 1]], colour: "hull", texture: "grain-h" },
          ],
        },
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
      // Perched, and wings spread side-on.
      variants: [
        {
          aspect: 1.2,
          parts: [
            { shape: "poly", pts: [[0.24, 0.5], [0, 0.72], [0.26, 0.66]], colour: "body", tone: -0.06 },
            { shape: "line", pts: [[0.46, 0.74], [0.46, 1]], width: 0.04, colour: "body" },
            { shape: "line", pts: [[0.56, 0.74], [0.57, 1]], width: 0.04, colour: "body" },
            { shape: "ellipse", box: [0.2, 0.34, 0.58, 0.42], colour: "body" },
            { shape: "ellipse", box: [0.6, 0.14, 0.3, 0.3], colour: "body" },
            { shape: "poly", pts: [[0.88, 0.26], [1, 0.31], [0.88, 0.36]], colour: "body", tone: 0.3 },
          ],
        },
        {
          aspect: 1.8,
          parts: [
            { shape: "poly", pts: [[0.34, 0.52], [0.1, 0.64], [0.34, 0.6]], colour: "body" },
            { shape: "poly", pts: [[0.52, 0.5], [0.86, 0.08], [0.68, 0.52]], colour: "body", tone: -0.08 },
            { shape: "ellipse", box: [0.3, 0.44, 0.46, 0.2], colour: "body" },
            { shape: "poly", pts: [[0.42, 0.5], [0.2, 0], [0.62, 0.46]], colour: "body" },
            { shape: "ellipse", box: [0.7, 0.4, 0.16, 0.16], colour: "body" },
          ],
        },
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
    // ── more things: household, tools and toys ───────────────────────────
    window: {
      kind: "subject", anchor: "centre", size: 0.5, aspect: 0.8,
      colours: { glass: [205, 45, 62], frame: [30, 15, 88] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 0.94], colour: "frame" },
        { shape: "rect", box: [0.08, 0.07, 0.84, 0.8], colour: "glass" },
        { shape: "line", pts: [[0.5, 0.07], [0.5, 0.87]], width: 0.06, colour: "frame" },
        { shape: "line", pts: [[0.08, 0.47], [0.92, 0.47]], width: 0.06, colour: "frame" },
        { shape: "line", pts: [[0.18, 0.2], [0.38, 0.12]], width: 0.03, colour: "glass", tone: 0.25 },
        { shape: "rect", box: [-0.06, 0.92, 1.12, 0.08], colour: "frame", tone: -0.1 },
      ],
    },
    table: {
      kind: "subject", anchor: "ground", size: 0.42, aspect: 1.8,
      colours: { wood: [28, 45, 36] },
      parts: [
        { shape: "line", pts: [[0.2, 0.1], [0.22, 0.8]], width: 0.035, colour: "wood", tone: -0.1 },
        { shape: "line", pts: [[0.8, 0.1], [0.78, 0.8]], width: 0.035, colour: "wood", tone: -0.1 },
        { shape: "line", pts: [[0.06, 0.1], [0.06, 1]], width: 0.04, colour: "wood" },
        { shape: "line", pts: [[0.94, 0.1], [0.94, 1]], width: 0.04, colour: "wood" },
        { shape: "rect", box: [0, 0, 1, 0.13], colour: "wood", texture: "grain-h" },
      ],
    },
    bed: {
      kind: "subject", anchor: "ground", size: 0.36, aspect: 2,
      colours: { blanket: [220, 45, 42], sheet: [40, 20, 90], wood: [26, 40, 30] },
      parts: [
        { shape: "rect", box: [0, 0, 0.1, 1], colour: "wood" },
        { shape: "rect", box: [0.05, 0.46, 0.95, 0.3], colour: "sheet" },
        { shape: "ellipse", box: [0.1, 0.3, 0.22, 0.2], colour: "sheet", tone: 0.03 },
        { shape: "rect", box: [0.3, 0.4, 0.7, 0.4], colour: "blanket", texture: "grain-h", r: 0.15 },
        { shape: "rect", box: [0.93, 0.6, 0.07, 0.4], colour: "wood" },
      ],
    },
    umbrella: {
      kind: "subject", anchor: "ground", size: 0.6, aspect: 0.95,
      colours: { cloth: [352, 70, 46], handle: [28, 30, 22] },
      parts: [
        { shape: "line", pts: [[0.5, 0.3], [0.5, 0.94], [0.43, 1], [0.37, 0.94]], width: 0.035, colour: "handle" },
        { shape: "dome", box: [0, 0.02, 1, 0.42], colour: "cloth", rim: true },
        { shape: "line", pts: [[0.5, 0.03], [0.25, 0.44]], width: 0.015, colour: "cloth", tone: -0.15 },
        { shape: "line", pts: [[0.5, 0.03], [0.75, 0.44]], width: 0.015, colour: "cloth", tone: -0.15 },
        { shape: "line", pts: [[0.5, 0], [0.5, 0.44]], width: 0.015, colour: "cloth", tone: -0.15 },
      ],
    },
    balloon: {
      kind: "subject", anchor: "sky", size: 0.3, aspect: 0.62,
      colours: { rubber: [0, 76, 52], string: [0, 0, 30] },
      parts: [
        { shape: "line", pts: [[0.5, 0.74], [0.42, 0.88], [0.56, 1]], width: 0.02, colour: "string" },
        { shape: "egg", box: [0, 0, 1, 0.74], colour: "rubber" },
        { shape: "poly", pts: [[0.44, 0.76], [0.56, 0.76], [0.5, 0.71]], colour: "rubber", tone: -0.1 },
        { shape: "ellipse", box: [0.2, 0.12, 0.2, 0.18], colour: "rubber", tone: 0.22 },
      ],
    },
    kite: {
      kind: "subject", anchor: "sky", size: 0.34, aspect: 0.7,
      colours: { cloth: [48, 90, 56], cross: [28, 30, 24], tail: [352, 70, 50] },
      parts: [
        { shape: "line", pts: [[0.5, 0.62], [0.36, 0.72], [0.56, 0.82], [0.4, 0.92], [0.52, 1]], width: 0.03, colour: "tail" },
        { shape: "poly", pts: [[0.5, 0], [0.95, 0.24], [0.5, 0.62], [0.05, 0.24]], colour: "cloth" },
        { shape: "poly", pts: [[0.5, 0], [0.95, 0.24], [0.5, 0.24]], colour: "cloth", tone: -0.1 },
        { shape: "line", pts: [[0.5, 0], [0.5, 0.62]], width: 0.025, colour: "cross" },
        { shape: "line", pts: [[0.05, 0.24], [0.95, 0.24]], width: 0.025, colour: "cross" },
      ],
    },
    ball: {
      kind: "subject", anchor: "ground", size: 0.2, aspect: 1,
      colours: { skin: [8, 76, 50], band: [44, 90, 60] },
      parts: [
        { shape: "ellipse", box: [0, 0, 1, 1], colour: "skin" },
        { shape: "wave", box: [0, 0.38, 1, 0.22], colour: "band" },
        { shape: "ellipse", box: [0.2, 0.12, 0.22, 0.16], colour: "skin", tone: 0.2 },
      ],
    },
    bicycle: {
      kind: "subject", anchor: "ground", size: 0.36, aspect: 1.7,
      colours: { frame: [200, 60, 40], tyre: [0, 0, 12] },
      parts: [
        { shape: "ring", box: [0, 0.42, 0.4, 0.58], thickness: 0.14, colour: "tyre" },
        { shape: "ring", box: [0.6, 0.42, 0.4, 0.58], thickness: 0.14, colour: "tyre" },
        { shape: "line", pts: [[0.2, 0.71], [0.42, 0.34], [0.72, 0.34], [0.8, 0.71]], width: 0.03, colour: "frame" },
        { shape: "line", pts: [[0.42, 0.34], [0.48, 0.71], [0.2, 0.71]], width: 0.03, colour: "frame" },
        { shape: "line", pts: [[0.48, 0.71], [0.72, 0.34]], width: 0.03, colour: "frame" },
        { shape: "line", pts: [[0.72, 0.34], [0.7, 0.12], [0.78, 0.1]], width: 0.025, colour: "frame", tone: -0.15 },
        { shape: "rect", box: [0.34, 0.24, 0.14, 0.06], colour: "tyre", r: 0.5 },
      ],
    },
    train: {
      kind: "subject", anchor: "ground", size: 0.36, aspect: 2.6,
      colours: { body: [0, 62, 40], cabin: [220, 30, 30], window: [46, 80, 70], wheel: [0, 0, 12], smoke: [215, 8, 75] },
      parts: [
        { shape: "cluster", box: [0.02, -0.4, 0.3, 0.42], n: 5, r: 0.3, colour: "smoke" },
        { shape: "rect", box: [0.1, 0.02, 0.08, 0.22], colour: "wheel" },
        { shape: "rect", box: [0, 0.22, 0.62, 0.52], colour: "body", r: 0.2 },
        { shape: "rect", box: [0.56, 0.02, 0.3, 0.72], colour: "cabin" },
        { shape: "rect", box: [0.62, 0.12, 0.18, 0.2], colour: "window" },
        { shape: "ellipse", box: [0.04, 0.66, 0.16, 0.34], colour: "wheel" },
        { shape: "ellipse", box: [0.26, 0.66, 0.16, 0.34], colour: "wheel" },
        { shape: "ellipse", box: [0.62, 0.66, 0.16, 0.34], colour: "wheel" },
      ],
    },
    plane: {
      kind: "subject", anchor: "sky", size: 0.22, aspect: 2.4,
      colours: { hull: [210, 10, 86], wing: [210, 12, 70] },
      parts: [
        { shape: "poly", pts: [[0.38, 0.48], [0.6, 0.48], [0.46, 0]], colour: "wing", tone: -0.06 },
        { shape: "poly", pts: [[0.02, 0.5], [0.12, 0.5], [0.04, 0.12]], colour: "wing" },
        { shape: "almond", box: [0, 0.36, 1, 0.28], colour: "hull" },
        { shape: "poly", pts: [[0.38, 0.52], [0.6, 0.52], [0.46, 1]], colour: "wing" },
      ],
    },
    rocket: {
      kind: "subject", anchor: "centre", size: 0.62, aspect: 0.4,
      colours: { hull: [210, 10, 88], fin: [0, 62, 46], window: [200, 55, 45], flame: [30, 96, 56] },
      parts: [
        { shape: "glow", box: [-0.4, 0.7, 1.8, 0.6], colour: "flame" },
        { shape: "tongues", box: [0.3, 0.78, 0.4, 0.26], n: 3, colour: "flame", flip: true },
        { shape: "poly", pts: [[0.2, 0.55], [0, 0.82], [0.22, 0.78]], colour: "fin" },
        { shape: "poly", pts: [[0.8, 0.55], [1, 0.82], [0.78, 0.78]], colour: "fin" },
        { shape: "poly", pts: [[0.5, 0], [0.8, 0.26], [0.78, 0.8], [0.22, 0.8], [0.2, 0.26]], colour: "hull", texture: "grain-v" },
        { shape: "poly", pts: [[0.5, 0], [0.8, 0.26], [0.2, 0.26]], colour: "fin" },
        { shape: "ring", box: [0.34, 0.32, 0.32, 0.16], thickness: 0.3, colour: "hull", tone: -0.2 },
        { shape: "ellipse", box: [0.38, 0.34, 0.24, 0.12], colour: "window" },
      ],
    },
    bell: {
      kind: "subject", anchor: "centre", size: 0.4, aspect: 0.9,
      colours: { metal: [42, 70, 48] },
      parts: [
        { shape: "ring", box: [0.42, 0, 0.16, 0.12], thickness: 0.35, colour: "metal", tone: -0.1 },
        { shape: "poly", pts: [[0.32, 0.1], [0.68, 0.1], [0.78, 0.6], [1, 0.84], [0, 0.84], [0.22, 0.6]], colour: "metal", texture: "grain-v" },
        { shape: "ellipse", box: [0.42, 0.8, 0.16, 0.18], colour: "metal", tone: -0.2 },
        { shape: "rect", box: [0.26, 0.2, 0.08, 0.5], colour: "metal", tone: 0.2 },
      ],
    },
    anchor: {
      kind: "subject", anchor: "centre", size: 0.5, aspect: 0.8,
      colours: { iron: [215, 15, 34] },
      parts: [
        { shape: "ring", box: [0.4, 0, 0.2, 0.16], thickness: 0.35, colour: "iron" },
        { shape: "rect", box: [0.46, 0.14, 0.08, 0.76], colour: "iron" },
        { shape: "rect", box: [0.24, 0.22, 0.52, 0.06], colour: "iron" },
        { shape: "line", pts: [[0.08, 0.6], [0.2, 0.86], [0.5, 0.93], [0.8, 0.86], [0.92, 0.6]], width: 0.07, colour: "iron" },
        { shape: "poly", pts: [[0.02, 0.66], [0.08, 0.54], [0.16, 0.66]], colour: "iron" },
        { shape: "poly", pts: [[0.84, 0.66], [0.92, 0.54], [0.98, 0.66]], colour: "iron" },
      ],
    },
    sword: {
      kind: "subject", anchor: "centre", size: 0.7, aspect: 0.3,
      colours: { blade: [210, 12, 80], gold: [44, 75, 50], grip: [20, 40, 20] },
      parts: [
        { shape: "poly", pts: [[0.42, 0.66], [0.58, 0.66], [0.58, 0.07], [0.5, 0], [0.42, 0.07]], colour: "blade" },
        { shape: "line", pts: [[0.5, 0.06], [0.5, 0.64]], width: 0.04, colour: "blade", tone: -0.15 },
        { shape: "rect", box: [0.05, 0.65, 0.9, 0.06], colour: "gold", r: 0.4 },
        { shape: "rect", box: [0.42, 0.7, 0.16, 0.22], colour: "grip", texture: "grain-h" },
        { shape: "ellipse", box: [0.38, 0.9, 0.24, 0.1], colour: "gold" },
      ],
    },
    shield: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 0.85,
      colours: { field: [220, 55, 34], gold: [44, 75, 52] },
      parts: [
        { shape: "poly", pts: [[0, 0], [1, 0], [1, 0.45], [0.5, 1], [0, 0.45]], colour: "gold" },
        { shape: "poly", pts: [[0.07, 0.05], [0.93, 0.05], [0.93, 0.44], [0.5, 0.92], [0.07, 0.44]], colour: "field", texture: "grain-v" },
        { shape: "rect", box: [0.44, 0.05, 0.12, 0.84], colour: "gold" },
        { shape: "rect", box: [0.07, 0.3, 0.86, 0.1], colour: "gold" },
      ],
    },
    guitar: {
      kind: "subject", anchor: "centre", size: 0.72, aspect: 0.42,
      colours: { body: [28, 62, 46], neck: [24, 40, 22], hole: [0, 0, 10] },
      parts: [
        { shape: "rect", box: [0.43, 0, 0.14, 0.52], colour: "neck", texture: "grain-h" },
        { shape: "rect", box: [0.38, -0.02, 0.24, 0.08], colour: "neck", tone: -0.05 },
        { shape: "ellipse", box: [0.08, 0.32, 0.84, 0.36], colour: "body" },
        { shape: "ellipse", box: [0, 0.54, 1, 0.46], colour: "body", texture: "grain-d" },
        { shape: "ellipse", box: [0.38, 0.55, 0.24, 0.12], colour: "hole" },
        { shape: "rect", box: [0.36, 0.8, 0.28, 0.04], colour: "neck" },
      ],
    },
    cake: {
      kind: "subject", anchor: "ground", size: 0.36, aspect: 1.1,
      colours: { sponge: [338, 50, 78], icing: [40, 30, 94], flame: [40, 100, 62], candle: [200, 60, 60] },
      parts: [
        { shape: "line", pts: [[0.3, 0.3], [0.3, 0.12]], width: 0.04, colour: "candle" },
        { shape: "line", pts: [[0.5, 0.3], [0.5, 0.1]], width: 0.04, colour: "candle", tone: 0.1 },
        { shape: "line", pts: [[0.7, 0.3], [0.7, 0.12]], width: 0.04, colour: "candle" },
        { shape: "tongues", box: [0.26, 0, 0.08, 0.12], n: 1, colour: "flame" },
        { shape: "tongues", box: [0.46, -0.02, 0.08, 0.12], n: 1, colour: "flame" },
        { shape: "tongues", box: [0.66, 0, 0.08, 0.12], n: 1, colour: "flame" },
        { shape: "rect", box: [0, 0.34, 1, 0.66], colour: "sponge", texture: "grain-h" },
        { shape: "wave", box: [0, 0.3, 1, 0.14], colour: "icing" },
      ],
    },
    mushroom: {
      kind: "subject", anchor: "ground", size: 0.36, aspect: 1,
      colours: { cap: [4, 76, 46], stem: [40, 26, 88], spot: [40, 20, 96] },
      parts: [
        { shape: "rect", box: [0.34, 0.42, 0.32, 0.58], colour: "stem", r: 0.3 },
        { shape: "dome", box: [0, 0, 1, 0.56], colour: "cap", rim: true },
        { shape: "ellipse", box: [0.22, 0.2, 0.14, 0.1], colour: "spot" },
        { shape: "ellipse", box: [0.52, 0.1, 0.16, 0.12], colour: "spot" },
        { shape: "ellipse", box: [0.7, 0.32, 0.1, 0.08], colour: "spot" },
      ],
    },
    cactus: {
      kind: "subject", anchor: "ground", size: 0.62, aspect: 0.7,
      colours: { green: [122, 40, 34] },
      parts: [
        { shape: "line", pts: [[0.24, 0.3], [0.24, 0.55], [0.4, 0.55]], width: 0.13, colour: "green", tone: -0.05 },
        { shape: "line", pts: [[0.78, 0.18], [0.78, 0.45], [0.6, 0.45]], width: 0.13, colour: "green", tone: -0.05 },
        { shape: "rect", box: [0.37, 0, 0.26, 1], colour: "green", r: 0.5, texture: "grain-v" },
      ],
    },
    pine: {
      kind: "subject", anchor: "ground", size: 0.9, aspect: 0.55,
      colours: { needles: [140, 40, 24], bark: [25, 35, 22] },
      parts: [
        { shape: "rect", box: [0.44, 0.84, 0.12, 0.16], colour: "bark" },
        { shape: "poly", pts: [[0.5, 0.38], [1, 0.88], [0, 0.88]], colour: "needles", texture: "grain-d" },
        { shape: "poly", pts: [[0.5, 0.16], [0.88, 0.6], [0.12, 0.6]], colour: "needles", tone: 0.04 },
        { shape: "poly", pts: [[0.5, 0], [0.76, 0.34], [0.24, 0.34]], colour: "needles", tone: 0.08 },
      ],
    },
    palm: {
      kind: "subject", anchor: "ground", size: 0.86, aspect: 0.8,
      colours: { frond: [110, 50, 34], trunk: [32, 35, 42] },
      parts: [
        { shape: "line", pts: [[0.42, 1], [0.46, 0.6], [0.56, 0.2]], width: 0.07, colour: "trunk", texture: "grain-h" },
        { shape: "line", pts: [[0.56, 0.2], [0.3, 0.08], [0.06, 0.3]], width: 0.06, colour: "frond" },
        { shape: "line", pts: [[0.56, 0.2], [0.82, 0.06], [1, 0.3]], width: 0.06, colour: "frond" },
        { shape: "line", pts: [[0.56, 0.2], [0.36, 0.26], [0.2, 0.5]], width: 0.06, colour: "frond", tone: -0.06 },
        { shape: "line", pts: [[0.56, 0.2], [0.76, 0.3], [0.88, 0.52]], width: 0.06, colour: "frond", tone: -0.06 },
        { shape: "line", pts: [[0.56, 0.2], [0.56, 0]], width: 0.06, colour: "frond", tone: 0.05 },
      ],
    },
    bush: {
      kind: "subject", anchor: "ground", size: 0.32, aspect: 1.5,
      colours: { leaves: [115, 42, 30] },
      parts: [{ shape: "cluster", box: [0, 0, 1, 1], n: 10, r: 0.34, colour: "leaves", texture: "leafy" }],
    },
    sunflower: {
      kind: "subject", anchor: "ground", size: 0.72, aspect: 0.45,
      colours: { petal: [48, 92, 56], centre: [26, 55, 24], stem: [105, 45, 32] },
      parts: [
        { shape: "line", pts: [[0.5, 1], [0.52, 0.3]], width: 0.06, colour: "stem" },
        { shape: "almond", box: [0.5, 0.56, 0.4, 0.12], colour: "stem", tone: 0.05 },
        { shape: "petals", box: [0, 0, 1, 0.46], n: 14, colour: "petal" },
        { shape: "ellipse", box: [0.3, 0.11, 0.4, 0.24], colour: "centre", texture: "speckle" },
      ],
    },
    // ── more creatures ───────────────────────────────────────────────────
    horse: {
      kind: "subject", anchor: "ground", size: 0.56, aspect: 1.3,
      colours: { coat: [24, 45, 30], mane: [20, 30, 12] },
      parts: [
        { shape: "line", pts: [[0.2, 0.5], [0.2, 1]], width: 0.05, colour: "coat", tone: -0.06 },
        { shape: "line", pts: [[0.3, 0.5], [0.3, 1]], width: 0.05, colour: "coat" },
        { shape: "line", pts: [[0.62, 0.5], [0.62, 1]], width: 0.05, colour: "coat", tone: -0.06 },
        { shape: "line", pts: [[0.7, 0.5], [0.7, 1]], width: 0.05, colour: "coat" },
        { shape: "line", pts: [[0.14, 0.36], [0.04, 0.5], [0.06, 0.66]], width: 0.05, colour: "mane" },
        { shape: "ellipse", box: [0.12, 0.28, 0.66, 0.3], colour: "coat", texture: "fur" },
        { shape: "poly", pts: [[0.62, 0.36], [0.76, 0.34], [0.9, 0.06], [0.78, 0.02]], colour: "coat" },
        { shape: "poly", pts: [[0.78, 0], [0.98, 0.14], [0.94, 0.22], [0.8, 0.14]], colour: "coat" },
        { shape: "line", pts: [[0.78, 0.04], [0.66, 0.34]], width: 0.03, colour: "mane" },
      ],
    },
    cow: {
      kind: "subject", anchor: "ground", size: 0.46, aspect: 1.5,
      colours: { hide: [40, 10, 92], patch: [0, 0, 14], nose: [350, 40, 70] },
      parts: [
        { shape: "line", pts: [[0.2, 0.55], [0.2, 1]], width: 0.06, colour: "hide", tone: -0.1 },
        { shape: "line", pts: [[0.32, 0.55], [0.32, 1]], width: 0.06, colour: "hide" },
        { shape: "line", pts: [[0.62, 0.55], [0.62, 1]], width: 0.06, colour: "hide", tone: -0.1 },
        { shape: "line", pts: [[0.72, 0.55], [0.72, 1]], width: 0.06, colour: "hide" },
        { shape: "rect", box: [0.1, 0.24, 0.7, 0.4], colour: "hide", r: 0.3 },
        { shape: "ellipse", box: [0.2, 0.28, 0.2, 0.18], colour: "patch" },
        { shape: "ellipse", box: [0.5, 0.36, 0.16, 0.2], colour: "patch" },
        { shape: "rect", box: [0.76, 0.14, 0.2, 0.28], colour: "hide", r: 0.3 },
        { shape: "ellipse", box: [0.78, 0.32, 0.2, 0.12], colour: "nose" },
        { shape: "line", pts: [[0.8, 0.14], [0.76, 0.04]], width: 0.025, colour: "patch" },
        { shape: "line", pts: [[0.92, 0.14], [0.96, 0.04]], width: 0.025, colour: "patch" },
      ],
    },
    rabbit: {
      kind: "subject", anchor: "ground", size: 0.32, aspect: 0.8,
      colours: { fur: [30, 16, 66], inner: [350, 50, 78], tail: [40, 10, 94] },
      parts: [
        { shape: "almond", box: [0.3, -0.02, 0.14, 0.42], vertical: true, colour: "fur" },
        { shape: "almond", box: [0.52, -0.02, 0.14, 0.42], vertical: true, colour: "fur" },
        { shape: "almond", box: [0.34, 0.04, 0.06, 0.3], vertical: true, colour: "inner" },
        { shape: "ellipse", box: [0.12, 0.46, 0.76, 0.54], colour: "fur", texture: "fur" },
        { shape: "ellipse", box: [0.28, 0.26, 0.42, 0.34], colour: "fur" },
        { shape: "ellipse", box: [0.8, 0.7, 0.16, 0.16], colour: "tail" },
        { shape: "ellipse", box: [0.54, 0.36, 0.06, 0.06], colour: "tail", tone: -0.85 },
      ],
    },
    owl: {
      kind: "subject", anchor: "centre", size: 0.42, aspect: 0.8,
      colours: { feathers: [30, 34, 34], eye: [48, 90, 58], pupil: [0, 0, 8], beak: [36, 60, 50] },
      parts: [
        { shape: "poly", pts: [[0.08, 0.2], [0.18, 0], [0.3, 0.16]], colour: "feathers" },
        { shape: "poly", pts: [[0.7, 0.16], [0.82, 0], [0.92, 0.2]], colour: "feathers" },
        { shape: "egg", box: [0, 0.08, 1, 0.92], colour: "feathers", texture: "scales" },
        { shape: "ellipse", box: [0.12, 0.2, 0.34, 0.3], colour: "eye" },
        { shape: "ellipse", box: [0.54, 0.2, 0.34, 0.3], colour: "eye" },
        { shape: "ellipse", box: [0.22, 0.28, 0.14, 0.14], colour: "pupil" },
        { shape: "ellipse", box: [0.64, 0.28, 0.14, 0.14], colour: "pupil" },
        { shape: "poly", pts: [[0.44, 0.46], [0.56, 0.46], [0.5, 0.58]], colour: "beak" },
      ],
    },
    whale: {
      kind: "subject", anchor: "water", size: 0.34, aspect: 2.4,
      colours: { skin: [215, 32, 34], belly: [210, 20, 70], spout: [200, 30, 90] },
      parts: [
        { shape: "line", pts: [[0.3, 0.2], [0.26, 0]], width: 0.02, colour: "spout" },
        { shape: "line", pts: [[0.3, 0.2], [0.34, 0]], width: 0.02, colour: "spout" },
        { shape: "poly", pts: [[0.8, 0.5], [1, 0.2], [0.94, 0.5], [1, 0.8]], colour: "skin" },
        { shape: "almond", box: [0, 0.2, 0.86, 0.66], colour: "skin" },
        { shape: "almond", box: [0.08, 0.54, 0.6, 0.26], colour: "belly" },
        { shape: "ellipse", box: [0.16, 0.44, 0.04, 0.06], colour: "skin", tone: -0.25 },
      ],
    },
    turtle: {
      kind: "subject", anchor: "ground", size: 0.22, aspect: 1.8,
      colours: { shell: [96, 38, 30], skin: [90, 30, 48] },
      parts: [
        { shape: "ellipse", box: [0.78, 0.4, 0.22, 0.34], colour: "skin" },
        { shape: "ellipse", box: [0.14, 0.72, 0.14, 0.28], colour: "skin" },
        { shape: "ellipse", box: [0.6, 0.72, 0.14, 0.28], colour: "skin" },
        { shape: "dome", box: [0.06, 0, 0.76, 0.8], colour: "shell", texture: "scales" },
      ],
    },
    frog: {
      kind: "subject", anchor: "ground", size: 0.22, aspect: 1.3,
      colours: { skin: [100, 55, 40], eye: [52, 80, 60], pupil: [0, 0, 8] },
      parts: [
        { shape: "ellipse", box: [0, 0.6, 0.34, 0.4], colour: "skin", tone: -0.06 },
        { shape: "ellipse", box: [0.66, 0.6, 0.34, 0.4], colour: "skin", tone: -0.06 },
        { shape: "ellipse", box: [0.12, 0.24, 0.76, 0.7], colour: "skin", texture: "speckle" },
        { shape: "ellipse", box: [0.16, 0.06, 0.26, 0.3], colour: "skin" },
        { shape: "ellipse", box: [0.58, 0.06, 0.26, 0.3], colour: "skin" },
        { shape: "ellipse", box: [0.22, 0.12, 0.14, 0.16], colour: "eye" },
        { shape: "ellipse", box: [0.64, 0.12, 0.14, 0.16], colour: "eye" },
        { shape: "ellipse", box: [0.26, 0.16, 0.06, 0.08], colour: "pupil" },
        { shape: "ellipse", box: [0.68, 0.16, 0.06, 0.08], colour: "pupil" },
      ],
    },
    butterfly: {
      kind: "subject", anchor: "sky", size: 0.24, aspect: 1.3,
      colours: { wing: [28, 90, 55], spot: [0, 0, 10], body: [0, 0, 12] },
      parts: [
        { shape: "ellipse", box: [0.04, 0.02, 0.46, 0.52], rot: -0.4, colour: "wing" },
        { shape: "ellipse", box: [0.5, 0.02, 0.46, 0.52], rot: 0.4, colour: "wing" },
        { shape: "ellipse", box: [0.12, 0.5, 0.36, 0.4], rot: 0.3, colour: "wing", tone: -0.08 },
        { shape: "ellipse", box: [0.52, 0.5, 0.36, 0.4], rot: -0.3, colour: "wing", tone: -0.08 },
        { shape: "ellipse", box: [0.18, 0.18, 0.1, 0.1], colour: "spot" },
        { shape: "ellipse", box: [0.72, 0.18, 0.1, 0.1], colour: "spot" },
        { shape: "almond", box: [0.46, 0.1, 0.08, 0.8], vertical: true, colour: "body" },
        { shape: "line", pts: [[0.48, 0.12], [0.4, 0]], width: 0.015, colour: "body" },
        { shape: "line", pts: [[0.52, 0.12], [0.6, 0]], width: 0.015, colour: "body" },
      ],
    },
    bee: {
      kind: "subject", anchor: "sky", size: 0.14, aspect: 1.4,
      colours: { body: [48, 92, 55], band: [0, 0, 10], wing: [200, 30, 92] },
      parts: [
        { shape: "ellipse", box: [0.3, 0, 0.3, 0.4], rot: -0.3, colour: "wing" },
        { shape: "ellipse", box: [0.5, 0, 0.3, 0.4], rot: 0.3, colour: "wing", tone: -0.05 },
        { shape: "ellipse", box: [0.08, 0.3, 0.84, 0.6], colour: "body" },
        { shape: "rect", box: [0.34, 0.3, 0.1, 0.6], colour: "band" },
        { shape: "rect", box: [0.56, 0.3, 0.1, 0.6], colour: "band" },
        { shape: "ellipse", box: [0, 0.42, 0.2, 0.36], colour: "band" },
      ],
    },
    snake: {
      kind: "subject", anchor: "ground", size: 0.2, aspect: 4,
      colours: { scales: [100, 45, 34], belly: [60, 50, 60] },
      parts: [
        { shape: "line", pts: [[0, 0.72], [0.14, 0.32], [0.28, 0.76], [0.44, 0.34], [0.6, 0.76], [0.76, 0.4], [0.88, 0.5]], width: 0.05, colour: "scales" },
        { shape: "ellipse", box: [0.86, 0.3, 0.1, 0.4], colour: "scales", tone: -0.06 },
        { shape: "line", pts: [[0.96, 0.5], [1, 0.46]], width: 0.01, colour: "belly" },
      ],
    },
    snail: {
      kind: "subject", anchor: "ground", size: 0.22, aspect: 1.4,
      colours: { shell: [28, 55, 40], body: [40, 30, 66] },
      parts: [
        { shape: "line", pts: [[0.84, 0.72], [0.8, 0.36]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.9, 0.72], [0.96, 0.4]], width: 0.025, colour: "body" },
        { shape: "poly", pts: [[0, 1], [1, 1], [0.98, 0.84], [0.84, 0.66], [0.2, 0.8]], colour: "body" },
        { shape: "ellipse", box: [0.16, 0.06, 0.6, 0.82], colour: "shell", texture: "rays" },
        { shape: "ring", box: [0.3, 0.26, 0.32, 0.44], thickness: 0.3, colour: "shell", tone: -0.12 },
      ],
    },
    spider: {
      kind: "subject", anchor: "centre", size: 0.26, aspect: 1.4,
      colours: { body: [0, 0, 10] },
      parts: [
        { shape: "line", pts: [[0.4, 0.5], [0.2, 0.2], [0, 0.3]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.4, 0.55], [0.16, 0.44], [0, 0.6]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.4, 0.6], [0.18, 0.7], [0.04, 0.92]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.42, 0.62], [0.28, 0.86], [0.2, 1]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.6, 0.5], [0.8, 0.2], [1, 0.3]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.6, 0.55], [0.84, 0.44], [1, 0.6]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.6, 0.6], [0.82, 0.7], [0.96, 0.92]], width: 0.025, colour: "body" },
        { shape: "line", pts: [[0.58, 0.62], [0.72, 0.86], [0.8, 1]], width: 0.025, colour: "body" },
        { shape: "ellipse", box: [0.34, 0.4, 0.32, 0.34], colour: "body" },
        { shape: "ellipse", box: [0.4, 0.26, 0.2, 0.2], colour: "body", tone: 0.06 },
      ],
    },
    ghost: {
      kind: "subject", anchor: "centre", size: 0.56, aspect: 0.75,
      colours: { sheet: [220, 16, 92], eye: [0, 0, 8] },
      parts: [
        { shape: "glow", box: [-0.5, -0.4, 2, 1.8], colour: "sheet" },
        { shape: "poly", pts: [[0.05, 1], [0.05, 0.4], [0.2, 0.08], [0.5, 0], [0.8, 0.08], [0.95, 0.4], [0.95, 1], [0.8, 0.9], [0.66, 1], [0.5, 0.9], [0.34, 1], [0.2, 0.9]], colour: "sheet" },
        { shape: "ellipse", box: [0.28, 0.26, 0.14, 0.18], colour: "eye" },
        { shape: "ellipse", box: [0.58, 0.26, 0.14, 0.18], colour: "eye" },
        { shape: "ellipse", box: [0.42, 0.5, 0.16, 0.16], colour: "eye" },
      ],
    },
    robot: {
      kind: "subject", anchor: "ground", size: 0.62, aspect: 0.62,
      colours: { metal: [210, 12, 68], eye: [180, 90, 55], dark: [215, 15, 25] },
      parts: [
        { shape: "line", pts: [[0.5, 0.04], [0.5, -0.06]], width: 0.03, colour: "dark" },
        { shape: "ellipse", box: [0.46, -0.1, 0.08, 0.06], colour: "eye" },
        { shape: "rect", box: [0.26, 0.02, 0.48, 0.24], colour: "metal", r: 0.2 },
        { shape: "ellipse", box: [0.34, 0.08, 0.1, 0.08], colour: "eye" },
        { shape: "ellipse", box: [0.56, 0.08, 0.1, 0.08], colour: "eye" },
        { shape: "rect", box: [0.4, 0.18, 0.2, 0.03], colour: "dark" },
        { shape: "rect", box: [0.02, 0.3, 0.12, 0.36], colour: "metal", tone: -0.08, r: 0.4 },
        { shape: "rect", box: [0.86, 0.3, 0.12, 0.36], colour: "metal", tone: -0.08, r: 0.4 },
        { shape: "rect", box: [0.16, 0.28, 0.68, 0.42], colour: "metal", texture: "grain-h" },
        { shape: "rect", box: [0.36, 0.38, 0.28, 0.14], colour: "dark" },
        { shape: "rect", box: [0.24, 0.7, 0.18, 0.3], colour: "metal", tone: -0.05 },
        { shape: "rect", box: [0.58, 0.7, 0.18, 0.3], colour: "metal", tone: -0.05 },
      ],
    },
    hand: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 0.8,
      colours: { skin: [24, 45, 62] },
      parts: [
        { shape: "rect", box: [0.2, 0.06, 0.12, 0.44], colour: "skin", r: 0.5 },
        { shape: "rect", box: [0.34, 0, 0.12, 0.46], colour: "skin", r: 0.5 },
        { shape: "rect", box: [0.48, 0.02, 0.12, 0.46], colour: "skin", r: 0.5 },
        { shape: "rect", box: [0.62, 0.1, 0.11, 0.42], colour: "skin", r: 0.5 },
        { shape: "line", pts: [[0.7, 0.66], [0.84, 0.48], [0.94, 0.36]], width: 0.13, colour: "skin" },
        { shape: "rect", box: [0.2, 0.38, 0.54, 0.5], colour: "skin", r: 0.3 },
        { shape: "rect", box: [0.28, 0.84, 0.4, 0.16], colour: "skin", tone: -0.06 },
      ],
    },
    // ── more buildings and landmarks ─────────────────────────────────────
    tent: {
      kind: "subject", anchor: "ground", size: 0.44, aspect: 1.4,
      colours: { canvas: [30, 60, 46], door: [26, 40, 16] },
      parts: [
        { shape: "poly", pts: [[0, 1], [0.5, 0], [1, 1]], colour: "canvas", texture: "grain-d" },
        { shape: "poly", pts: [[0.5, 0], [1, 1], [0.64, 1]], colour: "canvas", tone: -0.1 },
        { shape: "poly", pts: [[0.5, 0.36], [0.62, 1], [0.38, 1]], colour: "door" },
      ],
    },
    windmill: {
      kind: "subject", anchor: "ground", size: 0.86, aspect: 0.8,
      colours: { tower: [30, 22, 72], cap: [8, 40, 34], sail: [36, 22, 86] },
      parts: [
        { shape: "poly", pts: [[0.38, 0.3], [0.62, 0.3], [0.7, 1], [0.3, 1]], colour: "tower", texture: "brick" },
        { shape: "dome", box: [0.36, 0.2, 0.28, 0.12], colour: "cap" },
        { shape: "rect", box: [0.45, 0.8, 0.1, 0.2], colour: "cap", tone: -0.1 },
        { shape: "line", pts: [[0.5, 0.26], [0.08, 0]], width: 0.06, colour: "sail" },
        { shape: "line", pts: [[0.5, 0.26], [0.92, 0.52]], width: 0.06, colour: "sail" },
        { shape: "line", pts: [[0.5, 0.26], [0.74, -0.14]], width: 0.06, colour: "sail", tone: -0.06 },
        { shape: "line", pts: [[0.5, 0.26], [0.26, 0.66]], width: 0.06, colour: "sail", tone: -0.06 },
        { shape: "ellipse", box: [0.46, 0.22, 0.08, 0.08], colour: "cap" },
      ],
    },
    church: {
      kind: "subject", anchor: "ground", size: 0.8, aspect: 0.95,
      colours: { stone: [34, 16, 70], roof: [220, 22, 34], window: [46, 70, 62] },
      parts: [
        { shape: "rect", box: [0, 0.5, 0.7, 0.5], colour: "stone", texture: "brick" },
        { shape: "poly", pts: [[-0.03, 0.52], [0.35, 0.3], [0.73, 0.52]], colour: "roof" },
        { shape: "rect", box: [0.68, 0.24, 0.3, 0.76], colour: "stone", tone: -0.04, texture: "brick" },
        { shape: "poly", pts: [[0.66, 0.26], [0.83, 0], [1, 0.26]], colour: "roof" },
        { shape: "rect", box: [0.77, 0.38, 0.12, 0.16], colour: "window", r: 0.5 },
        { shape: "rect", box: [0.12, 0.62, 0.1, 0.18], colour: "window", r: 0.5 },
        { shape: "rect", box: [0.42, 0.62, 0.1, 0.18], colour: "window", r: 0.5 },
        { shape: "rect", box: [0.78, 0.78, 0.1, 0.22], colour: "roof", tone: -0.1 },
      ],
    },
    pyramid: {
      kind: "subject", anchor: "ground", size: 0.6, aspect: 1.6,
      colours: { stone: [40, 50, 62] },
      parts: [
        { shape: "poly", pts: [[0, 1], [0.5, 0], [1, 1]], colour: "stone", texture: "brick" },
        { shape: "poly", pts: [[0.5, 0], [1, 1], [0.66, 1]], colour: "stone", tone: -0.14 },
      ],
    },
    fence: {
      kind: "subject", anchor: "ground", size: 0.26, aspect: 4,
      colours: { wood: [36, 30, 80] },
      parts: [
        { shape: "rect", box: [0, 0.3, 1, 0.1], colour: "wood", tone: -0.1 },
        { shape: "rect", box: [0, 0.7, 1, 0.1], colour: "wood", tone: -0.1 },
        { shape: "pickets", box: [0, 0, 1, 1], n: 12, colour: "wood" },
      ],
    },
    wall: {
      kind: "subject", anchor: "ground", size: 0.42, aspect: 3,
      colours: { brick: [14, 40, 44] },
      parts: [{ shape: "rect", box: [0, 0, 1, 1], colour: "brick", texture: "brick" }],
    },
    stairs: {
      kind: "subject", anchor: "ground", size: 0.52, aspect: 1.2,
      colours: { stone: [34, 12, 60] },
      parts: [
        { shape: "poly", pts: [[0, 1], [0, 0.8], [0.2, 0.8], [0.2, 0.6], [0.4, 0.6], [0.4, 0.4], [0.6, 0.4], [0.6, 0.2], [0.8, 0.2], [0.8, 0], [1, 0], [1, 1]], colour: "stone", texture: "speckle" },
        { shape: "rungs", box: [0, 0.02, 1, 0.98], n: 5, width: 0.01, colour: "stone", tone: 0.14 },
      ],
    },
    arch: {
      kind: "subject", anchor: "ground", size: 0.72, aspect: 0.95,
      colours: { stone: [32, 18, 58] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "stone", texture: "brick" },
        { shape: "rect", box: [0.22, 0.42, 0.56, 0.6], cut: true },
        { shape: "ellipse", box: [0.22, 0.14, 0.56, 0.56], cut: true },
      ],
    },
    waterfall: {
      kind: "subject", anchor: "ground", size: 0.9, aspect: 0.7,
      colours: { rock: [30, 10, 30], water: [198, 40, 82], foam: [200, 20, 96] },
      parts: [
        { shape: "rect", box: [0, 0, 0.34, 1], colour: "rock", texture: "speckle" },
        { shape: "rect", box: [0.66, 0, 0.34, 1], colour: "rock", texture: "speckle", tone: 0.04 },
        { shape: "rect", box: [0.3, 0, 0.4, 0.92], colour: "water", texture: "grain-v" },
        { shape: "cluster", box: [0.2, 0.8, 0.6, 0.2], n: 7, r: 0.3, colour: "foam" },
      ],
    },
    volcano: {
      kind: "subject", anchor: "ground", size: 0.8, aspect: 1.8,
      colours: { rock: [14, 20, 22], lava: [14, 92, 50], smoke: [215, 8, 50] },
      parts: [
        { shape: "cluster", box: [0.3, -0.3, 0.4, 0.4], n: 6, r: 0.35, colour: "smoke" },
        { shape: "glow", box: [0.15, -0.2, 0.7, 0.6], colour: "lava" },
        { shape: "poly", pts: [[0, 1], [0.4, 0.08], [0.6, 0.08], [1, 1]], colour: "rock", texture: "grain-d" },
        { shape: "tongues", box: [0.4, 0, 0.2, 0.14], n: 3, colour: "lava" },
        { shape: "line", pts: [[0.46, 0.1], [0.4, 0.4], [0.34, 0.7]], width: 0.03, colour: "lava" },
      ],
    },
    planet: {
      kind: "subject", anchor: "sky", size: 0.34, aspect: 1.7,
      colours: { body: [30, 52, 56], ring: [40, 30, 78] },
      parts: [
        { shape: "ellipse", box: [0.2, 0, 0.6, 1], colour: "body", texture: "grain-h" },
        { shape: "ring", box: [0, 0.36, 1, 0.3], thickness: 0.22, colour: "ring" },
      ],
    },
    crystal: {
      kind: "subject", anchor: "centre", size: 0.36, aspect: 0.8,
      colours: { gem: [190, 62, 58] },
      parts: [
        { shape: "glow", box: [-0.5, -0.4, 2, 1.8], colour: "gem" },
        { shape: "poly", pts: [[0.5, 0], [1, 0.34], [0.5, 1], [0, 0.34]], colour: "gem" },
        { shape: "poly", pts: [[0.5, 0], [0.7, 0.34], [0.5, 1], [0.3, 0.34]], colour: "gem", tone: 0.15 },
        { shape: "poly", pts: [[0, 0.34], [0.3, 0.34], [0.5, 1]], colour: "gem", tone: -0.12 },
      ],
    },
    lantern: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 0.55,
      colours: { light: [44, 92, 64], frame: [24, 20, 18] },
      parts: [
        { shape: "glow", box: [-1, -0.4, 3, 1.8], colour: "light" },
        { shape: "ring", box: [0.3, 0, 0.4, 0.2], thickness: 0.25, colour: "frame" },
        { shape: "poly", pts: [[0.1, 0.26], [0.5, 0.12], [0.9, 0.26]], colour: "frame" },
        { shape: "rect", box: [0.14, 0.26, 0.72, 0.62], colour: "light" },
        { shape: "line", pts: [[0.5, 0.26], [0.5, 0.88]], width: 0.05, colour: "frame" },
        { shape: "rect", box: [0.08, 0.86, 0.84, 0.1], colour: "frame" },
      ],
    },
    chimney: {
      kind: "subject", anchor: "ground", size: 0.2, aspect: 0.55,
      colours: { brick: [8, 46, 38], cap: [20, 10, 22] },
      parts: [
        { shape: "rect", box: [0.12, 0.16, 0.76, 0.84], colour: "brick", texture: "brick" },
        { shape: "rect", box: [0, 0.06, 1, 0.16], colour: "cap" },
      ],
    },
    hat: {
      kind: "subject", anchor: "centre", size: 0.26, aspect: 1.6,
      colours: { felt: [0, 0, 14], band: [352, 60, 42] },
      parts: [
        { shape: "ellipse", box: [0, 0.72, 1, 0.28], colour: "felt", tone: 0.04 },
        { shape: "rect", box: [0.24, 0, 0.52, 0.84], colour: "felt", r: 0.15 },
        { shape: "rect", box: [0.24, 0.6, 0.52, 0.12], colour: "band" },
      ],
    },
    hourglass: {
      kind: "subject", anchor: "centre", size: 0.46, aspect: 0.6,
      colours: { glass: [200, 20, 86], sand: [40, 62, 60], wood: [26, 40, 28] },
      parts: [
        { shape: "poly", pts: [[0.12, 0.08], [0.88, 0.08], [0.5, 0.5]], colour: "glass" },
        { shape: "poly", pts: [[0.5, 0.5], [0.88, 0.92], [0.12, 0.92]], colour: "glass" },
        { shape: "poly", pts: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5]], colour: "sand" },
        { shape: "poly", pts: [[0.5, 0.7], [0.82, 0.92], [0.18, 0.92]], colour: "sand" },
        { shape: "line", pts: [[0.5, 0.5], [0.5, 0.72]], width: 0.02, colour: "sand" },
        { shape: "rect", box: [0, 0, 1, 0.08], colour: "wood" },
        { shape: "rect", box: [0, 0.92, 1, 0.08], colour: "wood" },
      ],
    },
    mirror: {
      kind: "subject", anchor: "centre", size: 0.56, aspect: 0.7,
      colours: { frame: [44, 70, 48], glass: [205, 18, 80] },
      parts: [
        { shape: "ellipse", box: [0, 0, 1, 1], colour: "frame", texture: "grain-v" },
        { shape: "ellipse", box: [0.08, 0.06, 0.84, 0.88], colour: "glass" },
        { shape: "line", pts: [[0.28, 0.3], [0.44, 0.16]], width: 0.04, colour: "glass", tone: 0.18 },
        { shape: "line", pts: [[0.28, 0.44], [0.54, 0.2]], width: 0.03, colour: "glass", tone: 0.14 },
      ],
    },
    bowl: {
      kind: "subject", anchor: "ground", size: 0.2, aspect: 2,
      colours: { glaze: [200, 32, 66] },
      parts: [
        { shape: "dome", box: [0, 0, 1, 1], down: true, colour: "glaze", texture: "grain-h", rim: true },
        { shape: "ellipse", box: [0, -0.1, 1, 0.2], colour: "glaze", tone: -0.2 },
      ],
    },
    vase: {
      kind: "subject", anchor: "ground", size: 0.46, aspect: 0.55,
      colours: { clay: [200, 52, 40], band: [40, 30, 88] },
      parts: [
        { shape: "rect", box: [0.3, 0, 0.4, 0.26], colour: "clay", tone: -0.05 },
        { shape: "ellipse", box: [0.22, -0.02, 0.56, 0.08], colour: "clay", tone: 0.06 },
        { shape: "egg", box: [0, 0.18, 1, 0.82], colour: "clay" },
        { shape: "bands", box: [0.06, 0.46, 0.88, 0.2], n: 3, colour: "band" },
      ],
    },
    teapot: {
      kind: "subject", anchor: "ground", size: 0.32, aspect: 1.5,
      colours: { china: [205, 18, 88], blue: [220, 60, 42] },
      parts: [
        { shape: "ring", box: [0.72, 0.3, 0.26, 0.44], thickness: 0.3, colour: "china", tone: -0.06 },
        { shape: "poly", pts: [[0.28, 0.56], [0.02, 0.2], [0.08, 0.16], [0.3, 0.42]], colour: "china", tone: -0.04 },
        { shape: "ellipse", box: [0.2, 0.24, 0.6, 0.76], colour: "china" },
        { shape: "dome", box: [0.34, 0.1, 0.32, 0.18], colour: "blue" },
        { shape: "ellipse", box: [0.46, 0.04, 0.08, 0.08], colour: "blue" },
        { shape: "bands", box: [0.22, 0.56, 0.56, 0.14], n: 1, colour: "blue" },
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
    sunset: {
      kind: "setting", region: [0, 0, 1, 0.66], horizon: 0.66,
      colours: { high: [262, 38, 30], low: [22, 90, 62], sun: [40, 95, 70] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "high", to: "low" },
        { shape: "glow", box: [0.3, 0.55, 0.4, 0.9], colour: "sun" },
        { shape: "dome", box: [0.42, 0.84, 0.16, 0.16], colour: "sun" },
      ],
    },
    fog: {
      kind: "setting", region: [0, 0, 1, 1], overlay: true,
      colours: { mist: [210, 12, 86] },
      parts: [{ shape: "gradient", box: [0, 0, 1, 1], colour: "mist", to: "mist" }],
    },
    underwater: {
      kind: "setting", region: [0, 0, 1, 1],
      colours: { top: [190, 70, 44], deep: [218, 70, 14], bubble: [190, 50, 85], light: [185, 60, 70] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "top", to: "deep" },
        { shape: "streaks", box: [0, 0, 1, 0.7], n: 14, colour: "light" },
        { shape: "scatter", box: [0, 0, 1, 1], n: 40, r: 0.006, colour: "bubble" },
      ],
    },
    cave: {
      kind: "setting", region: [0, 0, 1, 1], horizon: 0.82,
      colours: { rock: [26, 16, 14] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "rock", texture: "speckle" },
        { shape: "ellipse", box: [0.16, 0.14, 0.68, 1.2], cut: true },
      ],
    },
    room: {
      kind: "setting", region: [0, 0, 1, 1], horizon: 0.7,
      colours: { wall: [36, 30, 72], floor: [28, 42, 36] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 0.7], colour: "wall" },
        { shape: "rect", box: [0, 0.7, 1, 0.3], colour: "floor", texture: "grain-h" },
        { shape: "rect", box: [0, 0.68, 1, 0.03], colour: "floor", tone: -0.1 },
      ],
    },
    island: {
      kind: "setting", region: [0, 0.55, 1, 0.45], horizon: 0.55,
      colours: { sea: [196, 60, 44], sand: [40, 55, 70] },
      parts: [
        { shape: "gradient", box: [0, 0, 1, 1], colour: "sea", to: "sea" },
        { shape: "ripples", box: [0, 0.05, 1, 0.95], n: 7, colour: "sand" },
        { shape: "dome", box: [0.2, 0.18, 0.6, 0.34], colour: "sand" },
      ],
    },
    garden: {
      kind: "setting", region: [0, 0.62, 1, 0.38], horizon: 0.62,
      colours: { grass: [100, 45, 38], flowers: [335, 70, 64] },
      parts: [
        { shape: "rect", box: [0, 0, 1, 1], colour: "grass", texture: "grass" },
        { shape: "scatter", box: [0, 0.1, 1, 0.9], n: 50, r: 0.007, colour: "flowers" },
      ],
    },
  };

  /* Words that name a thing by its family: an oak is drawn as a tree until it
   * has an entry of its own. A value may name several entries (a beach is
   * sand and sea). */
  const FAMILIES = {
    oak: "tree", willow: "tree", birch: "tree", maple: "tree", elm: "tree",
    cottage: "house", home: "house", hut: "house", cabin: "house", building: "house", barn: "house",
    castle: "tower", steeple: "tower", spire: "tower", skyscraper: "tower",
    gate: "door", portal: "door", entrance: "door", doorway: "door",
    ship: "boat", yacht: "boat", sailboat: "boat", canoe: "boat",
    man: "person", woman: "person", girl: "person", boy: "person", child: "person", figure: "person",
    people: "person", friend: "person", stranger: "person", mother: "person", father: "person",
    queen: "king", prince: "king", princess: "king", emperor: "king", empress: "king", ruler: "king", monarch: "king",
    poplar: "tree", cypress: "tree", aspen: "tree", steamer: "boat", steamboat: "boat", ferry: "boat", liner: "boat",
    rowboat: "boat", dinghy: "boat", bungalow: "house", shack: "house", townhouse: "house",
    portrait: "face", head: "face", selfie: "face", dancer: "person", seagull: "bird",
    kitten: "cat", lion: "cat", tiger: "cat", puppy: "dog", wolf: "dog", fox: "dog", donkey: "horse", pony: "horse",
    rose: "flower", tulip: "flower", daisy: "flower", lily: "flower", blossom: "flower", bloom: "flower",
    flame: "fire", blaze: "fire", bonfire: "fire", campfire: "fire",
    rock: "stone", boulder: "stone", pebble: "stone",
    hill: "mountain", peak: "mountain",
    lamp: "lantern",
    mug: "cup", teacup: "cup", glass: "cup",
    crow: "bird", raven: "bird", gull: "bird", dove: "bird", swallow: "bird",
    comet: "star",
    heartbeat: "heart", love: "heart",
    skull: "bone", seed: "egg",
    ocean: "sea", lake: "sea", pond: "sea", water: "sea", waves: "sea", wave: "sea",
    stream: "river", creek: "river",
    meadow: "field", grass: "field", farm: "field", prairie: "field",
    sand: "desert", dune: "desert", dunes: "desert",
    woods: "forest", jungle: "forest",
    town: "city", street: "city", village: "city",
    space: "night", stars: "night", dark: "night",
    beach: ["sea", "desert"], coast: ["sea", "desert"], shore: ["sea", "desert"],
    path: "road", highway: "road",
    thunder: "storm", lightning: "storm",
    winter: "snow",
    automobile: "car", truck: "car",
    // Added with the second batch of entries.
    fir: "pine", spruce: "pine", conifer: "pine", evergreen: "pine", christmas: "pine",
    coconut: "palm", shrub: "bush", hedge: "bush", fern: "bush", plant: "bush",
    cathedral: "church", chapel: "church", temple: "church", mosque: "church",
    stallion: "horse", mare: "horse", unicorn: "horse", deer: "horse", zebra: "horse",
    cattle: "cow", bull: "cow", ox: "cow", sheep: "cow", goat: "cow", pig: "cow",
    bunny: "rabbit", hare: "rabbit", mouse: "rabbit", rat: "rabbit", squirrel: "rabbit",
    dolphin: "whale", shark: "whale", seal: "whale",
    tortoise: "turtle", toad: "frog", lizard: "snake", serpent: "snake", worm: "snake", dragon: "snake",
    moth: "butterfly", insect: "bee", wasp: "bee", ant: "spider", bug: "spider", beetle: "spider",
    eagle: "bird", hawk: "bird", sparrow: "bird", robin: "bird", parrot: "bird", swan: "bird", duck: "bird",
    owlet: "owl", penguin: "owl", chicken: "owl", hen: "owl",
    spirit: "ghost", phantom: "ghost", soul: "ghost",
    android: "robot", machine: "robot", cyborg: "robot",
    fist: "hand", finger: "hand",
    bike: "bicycle",
    locomotive: "train", tram: "train", bus: "train",
    airplane: "plane", aeroplane: "plane", jet: "plane", aircraft: "plane",
    spaceship: "rocket", spacecraft: "rocket", missile: "rocket",
    blade: "sword", knife: "sword", dagger: "sword", spear: "sword",
    armour: "shield", armor: "shield",
    violin: "guitar", instrument: "guitar", music: "guitar",
    cupcake: "cake", birthday: "cake", pie: "cake", bread: "cake",
    toadstool: "mushroom", fungus: "mushroom",
    desk: "table", bench: "table",
    sofa: "bed", couch: "bed", pillow: "bed",
    parasol: "umbrella",
    balloons: "balloon", bubble: "balloon",
    football: "ball", orb: "ball", sphere: "ball",
    bells: "bell", gong: "bell",
    tents: "tent", camp: "tent", teepee: "tent",
    mill: "windmill", pyramids: "pyramid", tomb: "pyramid",
    railing: "fence", barrier: "fence", brick: "wall", bricks: "wall",
    staircase: "stairs", steps: "stairs", step: "stairs",
    archway: "arch", doorframe: "arch",
    cascade: "waterfall",
    saturn: "planet", jupiter: "planet", mars: "planet", world: "planet", globe: "planet",
    gem: "crystal", diamond: "crystal", jewel: "crystal",
    torch: "lantern",
    cap: "hat", helmet: "hat",
   
    reflection: "mirror",
    dish: "bowl", plate: "bowl",
    jar: "vase", pot: "vase", urn: "vase",
    kettle: "teapot", tea: "teapot",
    sunflowers: "sunflower",
    dusk: "sunset", dawn: "sunset", sunrise: "sunset", evening: "sunset", twilight: "sunset",
    mist: "fog", haze: "fog",
    reef: "underwater", seabed: "underwater",
    cavern: "cave", tunnel: "cave",
    kitchen: "room", bedroom: "room", hall: "room", interior: "room", indoors: "room",
    isle: "island", park: "garden", orchard: "garden",
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
    // Along a thing's guide lines: "a cat behind a dog", "a well to the left of a house".
    behind: "behind", left: "left", right: "right", next: "beside",
  };

  /* ── Adding onto a thing ────────────────────────────────────────────────
   *
   * "A cat wearing a hat", "a house with a chimney", "a person holding a
   * flag", "a tree with apples", "a bird on the cat's head": the second thing
   * is put onto the first, at a spot on its 3D frame (frameOf) - head, hand,
   * top, roof, canopy, base, front, back, side - and drawn in the first
   * thing's own perspective. "With" adds on only what can be added on (a hat,
   * a chimney, apples); "a man with a dog" still stands them side by side. */
  const ATTACH_WORDS = { wearing: "head", wears: "head", wear: "head", holding: "hand", holds: "hand", hold: "hand",
    carrying: "hand", carries: "hand", with: "auto", has: "auto", having: "auto" };
  const PART_WORDS = { head: "head", heads: "head", hat: null, hand: "hand", hands: "hand", paw: "hand", top: "top",
    roof: "roof", rooftop: "roof", back: "back", front: "front", side: "side", feet: "base", foot: "base",
    base: "base", branches: "canopy", branch: "canopy", canopy: "canopy", leaves: "canopy", mast: "top" };
  const HEADWEAR = new Set(["hat", "crown", "flower", "bird", "candle"]);
  const HELD = new Set(["flag", "umbrella", "sword", "guitar", "book", "cup", "balloon", "flower", "candle", "apple",
    "ball", "fish", "bone", "lamp", "star"]);
  const TOPPERS = new Set(["chimney", "flag", "bird", "star", "moon", "candle"]);
  const FRUIT = new Set(["apple", "flower", "bird", "star", "balloon"]);
  const TREES = new Set(["tree", "pine", "palm", "bush", "forest"]);
  const ANIMATE = new Set(["person", "king", "queen", "face", "cat", "dog", "horse", "cow", "rabbit", "bear", "fox",
    "wolf", "lion", "tiger", "elephant", "deer", "monkey", "owl", "duck", "frog", "mouse", "penguin", "bird", "pig",
    "sheep", "snowman", "robot", "ghost", "angel", "knight", "witch", "wizard", "clown", "child", "baby", "girl", "boy",
    "man", "woman"]);

  /* ── Reading ─────────────────────────────────────────────────────────── */

  /* Drawings the painter grew itself, from the shapes people kept with a word
   * the dictionary does not have (app.js, learnedVisualEntry). A written entry
   * always comes first: a learned drawing never replaces one. */
  const LEARNED = {};
  function learn(word, entry) {
    if (!word || ENTRIES[word] || FAMILIES[word]) return false;
    if (entry) LEARNED[word] = entry; else delete LEARNED[word];
    return true;
  }
  const entryOf = (key) => ENTRIES[key] || LEARNED[key];

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
    if (LEARNED[word]) return { keys: [word], plural: false };
    for (const single of singulars) if (LEARNED[single]) return { keys: [single], plural: true };
    return null;
  }

  /* What a sentence names, in order: the things (with how many, their colour
   * and how each relates to the one before) and the places. A thing named
   * twice is drawn once. Up to three things and three places. */
  function read(text) {
    const words = String(text || "").toLowerCase().match(/[a-z]+/g) || [];
    const subjects = [], settings = [];
    let count = 1, colour = null, relation = null, attach = null;
    // The nearest thing named that is not itself added onto another.
    const hostIndex = () => { for (let i = subjects.length - 1; i >= 0; i--) if (!subjects[i].attach) return i; return -1; };
    // "A pine tree", "an oak tree", "a sail boat": the general word after a
    // thing that already names it adds nothing.
    const HEADS = new Set(["tree", "boat", "house", "bird", "flower", "ship"]);
    let lastWasThing = false;
    for (const word of words) {
      if (lastWasThing && HEADS.has(word)) { lastWasThing = false; continue; }
      lastWasThing = false;
      if (COUNT_WORDS[word]) { count = COUNT_WORDS[word]; continue; }
      if (COLOUR_WORDS[word]) { colour = COLOUR_WORDS[word]; continue; }
      if (ATTACH_WORDS[word] && hostIndex() >= 0) { attach = ATTACH_WORDS[word]; relation = null; continue; }
      // "...on its head", "...on the roof": where the last thing goes. After
      // "a bird on the cat", the bird is put onto the cat at that spot.
      // "in front of": the relation, not the front of something.
      if (word === "front" && relation === "in") { relation = "front"; continue; }
      const partContext = subjects.length && (subjects[subjects.length - 1].attach || subjects[subjects.length - 1].relation === "on");
      if (PART_WORDS[word] && partContext) {
        const last = subjects[subjects.length - 1];
        if (last.attach) last.attach.spot = PART_WORDS[word];
        else if (last.relation === "on" && subjects.length >= 2 && !subjects[subjects.length - 2].attach) {
          subjects[subjects.length - 2].attach = { host: subjects.length - 1, spot: PART_WORDS[word] };
          last.relation = null;
        }
        relation = null;
        continue;
      }
      if (RELATIONS[word] && subjects.length) { relation = RELATIONS[word]; continue; }
      const found = lookup(word);
      if (!found) continue;
      for (const key of found.keys) {
        const entry = entryOf(key);
        if (entry.kind === "setting") {
          if (!settings.some((s) => s.key === key) && settings.length < 3) settings.push({ key, entry, colour });
          // "A whale under the sea", "a fish in the river": in water, a thing
          // goes below the surface. On land, "in a field" still stands on it.
          if ((relation === "below" || relation === "in") && subjects.length && ["sea", "underwater", "river"].includes(key)) {
            subjects[subjects.length - 1].within = key;
          }
        } else if (attach && hostIndex() >= 0 && subjects.filter((s) => s.attach).length < 3) {
          const host = hostIndex();
          const spot = attach === "auto" ? autoSpot(subjects[host], key, entry) : attach;
          const many = found.plural ? (count > 1 ? count : 3) : count;
          if (spot) subjects.push({ key, entry, count: Math.min(6, many), colour, attach: { host, spot } });
          else if (!subjects.some((s) => s.key === key) && subjects.filter((s) => !s.attach).length < 3) {
            subjects.push({ key, entry, count: Math.min(6, many), colour, relation: "beside" });
          }
          lastWasThing = true;
        } else if (!subjects.some((s) => s.key === key && !s.attach) && subjects.filter((s) => !s.attach).length < 3) {
          // "Two birds" is two; plain "birds" is a few.
          const many = found.plural ? (count > 1 ? count : 3) : count;
          // "mountains" as a place, not as three separate mountains.
          if (key === "mountain" && found.plural && !settings.some((s) => s.key === "mountains")) {
            settings.push({ key: "mountains", entry: ENTRIES.mountains, colour });
          } else {
            subjects.push({ key, entry, count: Math.min(key === "star" ? 30 : 6, many), colour, relation });
          }
          lastWasThing = true;
        }
      }
      count = 1; colour = null; relation = null; attach = null;
    }
    /* A thing in the sky, or ground that runs to a horizon, implies a sky
     * above it - otherwise whatever the field happens to be fills that half
     * and a green tree disappears against green. Moon and stars imply night. */
    const hasSky = settings.some((s) => ["sky", "night", "storm", "city", "forest", "snow", "sunset", "underwater",
      "cave", "room"].includes(s.key));
    const wantsSky = subjects.some((s) => s.entry.anchor === "sky") ||
      settings.some((s) => Number.isFinite(s.entry.horizon) && !s.entry.overlay);
    if (!hasSky && wantsSky && settings.length < 4) {
      const nightly = subjects.some((s) => s.key === "moon" || s.key === "star");
      const key = nightly ? "night" : "sky";
      settings.unshift({ key, entry: ENTRIES[key], colour: null, implied: true });
    }
    return { subjects, settings, words: subjects.map((s) => s.key).concat(settings.map((s) => s.key)) };
  }

  /* Where a "with" puts one thing on another, or null if it does not. */
  function autoSpot(host, key, entry) {
    const he = host.entry;
    if (HEADWEAR.has(key) && key !== "flower" && key !== "bird" && key !== "candle") return headOf(he) ? "head" : "top";
    if (TREES.has(host.key)) return key === "star" || key === "flag" ? "top" : FRUIT.has(key) ? "canopy" : null;
    if (ANIMATE.has(host.key)) {
      if (HELD.has(key) && handOf(he)) return "hand";
      if (key === "bird" || key === "crown") return headOf(he) ? "head" : "top";
      return entry.size <= he.size * 0.6 ? "base" : null;
    }
    if (TOPPERS.has(key)) return key === "chimney" ? "roof" : "top";
    return entry.size <= he.size * 0.5 ? "front" : null;
  }

  /* ── A thing's frame ────────────────────────────────────────────────────
   *
   * Every placed thing is held in a box in space: its face is the box it was
   * laid out in (narrowed at the top or the foot by a keystone, leaning with
   * its form), and its back is that face set back by the thing's depth -
   * toward the vanishing point in a one-point view, along the 30-degree axis
   * isometric, up and across otherwise. A point on or in it is (u, v, w):
   * u across from the left, v up from the foot, w back from the face. */
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function frameOf(item, view = null) {
    const b = item.box, ks = item.keystone && item.keystone !== 1 ? item.keystone : 1;
    const lean = (item.form?.lean || 0) * b.w, cx = b.x + b.w / 2;
    const front = { tl: [cx - b.w / 2 * ks + lean, b.y], tr: [cx + b.w / 2 * ks + lean, b.y], br: [b.x + b.w, b.y + b.h], bl: [b.x, b.y + b.h] };
    const depth = Math.min(b.w, b.h) * (item.entry.depth ?? 0.6);
    const map = (f) => Object.fromEntries(Object.entries(front).map(([k, p]) => [k, f(p)]));
    let back, kBack = 1, mode;
    if (view?.iso) {
      mode = "iso";
      const dx = 0.87 * (view.isoDir || 1) * depth * 0.55, dy = -0.5 * depth * 0.55;
      back = map(([x, y]) => [x + dx, y + dy]);
    } else if (view?.vanish) {
      mode = "vanish";
      const [vx, vy] = view.vanish;
      kBack = 1 - 0.3 * Math.min(1, depth / Math.max(1, b.w, b.h));
      back = map(([x, y]) => [vx + (x - vx) * kBack, vy + (y - vy) * kBack]);
    } else {
      mode = "oblique";
      back = map(([x, y]) => [x + 0.72 * depth * 0.4, y - 0.62 * depth * 0.4]);
    }
    return { front, back, kBack, mode, vanish: view?.vanish || null, iso: Boolean(view?.iso) };
  }
  function framePoint(frame, u, v, w = 0) {
    const face = (f) => lerp2(lerp2(f.bl, f.br, u), lerp2(f.tl, f.tr, u), v);
    return lerp2(face(frame.front), face(frame.back), w);
  }
  const frameScale = (frame, w) => Math.max(0.2, 1 + (frame.kBack - 1) * w);
  /* The guide lines out of a frame, each from a face outward: forward toward
   * the eye, back toward the vanishing point, left and right along the
   * ground, up and down along the thing's own upright. (u, v, w) beyond 0..1
   * carries on along the same lines, so a thing placed along a guide is in
   * the same perspective. */
  const FRAME_GUIDES = {
    forward: [[0.5, 0, 0], [0.5, 0, -1.6]], back: [[0.5, 0, 1], [0.5, 0, 3.5]],
    left: [[0, 0, 0.5], [-1.6, 0, 0.5]], right: [[1, 0, 0.5], [2.6, 0, 0.5]],
    up: [[0.5, 1, 0.5], [0.5, 1.8, 0.5]], down: [[0.5, 0, 0.5], [0.5, -0.4, 0.5]],
  };
  function frameGuides(frame) {
    return Object.fromEntries(Object.entries(FRAME_GUIDES).map(([dir, [a, b]]) =>
      [dir, [framePoint(frame, ...a), framePoint(frame, ...b)]]));
  }

  /* Spots on a drawing, found from its own parts (so every pose, and a drawing
   * the painter learned, has them): in the face's units, x across, y down. */
  function partBounds(part) {
    if (part.box) { const [x, y, w, h] = part.box; return { x0: x, y0: y, x1: x + w, y1: y + h }; }
    if (part.pts) {
      const pad = (part.width || 0) / 2, xs = part.pts.map((p) => p[0]), ys = part.pts.map((p) => p[1]);
      return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
    }
    return null;
  }
  // The head: the highest roundish part of a moderate size.
  function headOf(entry) {
    let best = null;
    for (const part of entry?.parts || []) {
      if (!part.box || part.cut || !["ellipse", "egg", "dome", "almond"].includes(part.shape)) continue;
      const [x, y, w, h] = part.box, area = w * h;
      if (area < 0.008 || area > 0.3 || y > 0.45) continue;
      if (!best || y < best.y) best = { x: x + w / 2, y, w };
    }
    return best;
  }
  // A hand: the far end of an arm - the outermost end of a line part between
  // shoulder and knee, toward the right.
  function handOf(entry) {
    let best = null;
    for (const part of entry?.parts || []) {
      if (part.shape !== "line" || !part.pts || part.pts.length < 2) continue;
      const end = part.pts[part.pts.length - 1];
      if (end[1] < 0.02 || end[1] > 0.8 || end[0] < 0.55) continue;
      if (!best || end[0] > best.x) best = { x: end[0], y: end[1] };
    }
    return best;
  }
  // How high the drawing reaches at x (its top surface there), or null.
  function surfaceAt(entry, x) {
    let top = null;
    for (const part of entry?.parts || []) {
      if (part.cut || part.shape === "glow") continue;
      if (part.pts && part.shape === "poly") {
        const pts = part.pts;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[0] - x) * (b[0] - x) > 0 || a[0] === b[0]) continue;
          const y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
          if (top === null || y < top) top = y;
        }
      } else {
        const bnd = partBounds(part);
        if (bnd && bnd.x0 <= x && x <= bnd.x1 && (top === null || bnd.y0 < top)) top = bnd.y0;
      }
    }
    return top;
  }
  function topOf(entry) {
    let best = null;
    for (const part of entry?.parts || []) {
      if (part.cut || part.shape === "glow") continue;
      if (part.pts) for (const [x, y] of part.pts) if (!best || y < best.y) best = { x, y };
      const bnd = part.box && partBounds(part);
      if (bnd && (!best || bnd.y0 < best.y)) best = { x: (bnd.x0 + bnd.x1) / 2, y: bnd.y0 };
    }
    return best || { x: 0.5, y: 0 };
  }
  // The leafy mass: the biggest rounded, clustered or many-sided part in the
  // upper part of the drawing (a pine's triangles count).
  function canopyOf(entry) {
    let best = null;
    for (const part of entry?.parts || []) {
      if (part.cut || part.shape === "line") continue;
      if (part.box && !["ellipse", "egg", "dome", "cloud", "blob", "cluster"].includes(part.shape)) continue;
      if (!part.box && part.shape !== "poly") continue;
      const bnd = partBounds(part);
      if (!bnd) continue;
      const x = bnd.x0, y = bnd.y0, w = bnd.x1 - bnd.x0, h = bnd.y1 - bnd.y0;
      if (y + h / 2 > 0.65 || w * h < 0.04) continue;
      if (!best || w * h > best.w * best.h) best = { x, y, w, h };
    }
    return best;
  }

  /* Where on a frame a spot is: (u, v, w), how the added thing sits there
   * ("on" it, "centre"d on it, or "grip"ped by its handle there), how far it
   * sinks in, and its size as a share of the thing it is added to. */
  function spotOn(entry, spot, guest, rng, toward = 1, copy = 0, copies = 1) {
    const ratio = (cap, floor = 0.1) => Math.max(floor, Math.min(cap, (guest.size || 0.3) / Math.max(0.05, entry.size || 0.4)));
    if (spot === "head") {
      const h = headOf(entry);
      if (h) return { at: [h.x, 1 - h.y, 0.35], sit: "on", sink: 0.14, width: h.w * 1.35 };
      spot = "top";
    }
    if (spot === "hand") {
      const h = handOf(entry);
      if (h) return { at: [h.x, 1 - h.y, 0.15], sit: "grip", height: ratio(0.6, 0.22) };
      spot = "side";
    }
    if (spot === "roof") {
      const y = surfaceAt(entry, 0.72);
      return { at: [0.72, 1 - (y ?? 0), 0.5], sit: "on", sink: 0.3, height: ratio(0.32, 0.16) };
    }
    if (spot === "canopy") {
      const c = canopyOf(entry);
      if (c) {
        // Spread round the canopy, not bunched: each its own share of the circle.
        const a = ((copy + 0.2 + rng() * 0.6) / copies) * Math.PI * 2, r = 0.18 + rng() * 0.2;
        return { at: [c.x + c.w / 2 + Math.cos(a) * c.w * r, 1 - (c.y + c.h / 2 + Math.sin(a) * c.h * r), 0], sit: "centre", height: 0.1 };
      }
      spot = "top";
    }
    if (spot === "top") {
      const t = topOf(entry);
      return { at: [t.x, 1 - t.y, 0.4], sit: "on", sink: 0.06, height: ratio(0.32, 0.12) };
    }
    // Beside: on whichever side faces the middle of the picture (`toward`).
    const beside = toward > 0 ? 1.04 : -0.04;
    if (spot === "base") return { at: [beside, 0, 0.15], sit: "on", sink: 0, height: ratio(0.35, 0.14) };
    if (spot === "back") return { at: [0.5, 0.7, 1], sit: "centre", height: ratio(0.5, 0.2) };
    if (spot === "side") return { at: [beside, 0.5, 0.5], sit: "centre", height: ratio(0.45, 0.18) };
    return { at: [0.5, 0.28, 0], sit: "centre", height: ratio(0.4, 0.16) };
  }
  // Where a held thing is held: its handle, in its own box.
  const GRIPS = { flag: [0.06, 0.82], umbrella: [0.5, 0.96], sword: [0.5, 0.9], guitar: [0.2, 0.8], balloon: [0.5, 1],
    candle: [0.5, 0.85], lamp: [0.5, 0.9], star: [0.5, 0.5] };

  /* Put the added things onto the things they were added to, in place. */
  function placeAttachments(scene, items, view, rng, W) {
    const added = [];
    scene.subjects.forEach((s) => {
      if (!s.attach) return;
      // Onto a named thing, or onto one of the painting's own blobs.
      const onBlob = Number.isInteger(s.attach.blob);
      const host = onBlob ? null : scene.subjects[s.attach.host];
      const hosts = onBlob ? [scene.blobs?.[s.attach.blob]].filter(Boolean)
        : items.filter((it) => it.key === host?.key && !it.attachedTo && it.entry.kind === "subject");
      for (const hostItem of hosts) {
        const frame = frameOf(hostItem, view);
        const copies = s.attach.spot === "canopy" ? Math.max(1, s.count) : 1;
        for (let c = 0; c < copies; c++) {
          const toward = hostItem.box.x + hostItem.box.w / 2 < W / 2 ? 1 : -1;
          const spot = spotOn(hostItem.entry, s.attach.spot, s.entry, rng, toward, c, copies);
          const [u, v, w] = spot.at;
          const p = framePoint(frame, u, v, w), k = frameScale(frame, w);
          const hb = hostItem.box, aspect = s.entry.aspect || 1;
          let gw, gh;
          if (spot.width) { gw = spot.width * hb.w * k; gh = gw / aspect; }
          else { gh = spot.height * hb.h * k; gw = gh * aspect; }
          let box;
          if (spot.sit === "on") box = { x: p[0] - gw / 2, y: p[1] - gh * (1 - (spot.sink || 0)), w: gw, h: gh };
          else if (spot.sit === "grip") {
            const [gx, gy] = GRIPS[s.key] || [0.5, 0.75];
            box = { x: p[0] - gx * gw, y: p[1] - gy * gh, w: gw, h: gh };
          } else box = { x: p[0] - gw / 2, y: p[1] - gh / 2, w: gw, h: gh };
          const item = { ...s, box, alpha: 1, depth: hostItem.depth, z: hostItem.z, attachedTo: hostItem.key, spot: s.attach.spot };
          if (hostItem.keystone) item.keystone = hostItem.keystone;
          if (hostItem.aerial) item.aerial = hostItem.aerial;
          if (s.form) item.form = c ? { ...s.form, seed: (s.form.seed + c * 7919) >>> 0, parts: null } : s.form;
          // In front of the thing, or behind it if it is set back past the middle.
          added.push({ item, host: hostItem, behind: w > 0.5 });
        }
      }
    });
    return added;
  }
  /* Each added thing goes next to its own thing in the painting order - just
   * after it, or just before it if it is behind - so whatever stands in front
   * of the thing stands in front of what is on it too. */
  function orderAttachments(items, added) {
    for (const { item, host, behind } of added) {
      const at = items.indexOf(host);
      if (at < 0) { items.push(item); continue; }
      let end = at + 1;
      while (end < items.length && items[end].attachedTo === host.key) end++;
      items.splice(behind ? at : end, 0, item);
    }
  }

  /* The frames drawn over a picture, for checking: each thing's box (face
   * solid, back dashed), the lines from the vanishing point through its
   * corners - the radial guides anything added along its depth follows - and
   * its spots. */
  function drawFrames(ctx, items, view, W, H) {
    ctx.save();
    ctx.lineWidth = Math.max(1, Math.min(W, H) / 300);
    for (const item of items) {
      if (item.entry.kind !== "subject" || item.lettering) continue;
      const f = frameOf(item, view);
      const order = ["tl", "tr", "br", "bl"];
      const poly = (face) => { ctx.beginPath(); order.forEach((k, i) => (i ? ctx.lineTo(...face[k]) : ctx.moveTo(...face[k]))); ctx.closePath(); };
      if (f.vanish && !f.iso) {
        ctx.strokeStyle = "rgba(255, 210, 60, 0.35)"; ctx.setLineDash([]);
        ctx.beginPath();
        for (const k of order) {
          const [x, y] = f.front[k], [vx, vy] = f.vanish;
          ctx.moveTo(vx, vy); ctx.lineTo(vx + (x - vx) * 1.6, vy + (y - vy) * 1.6);
        }
        ctx.stroke();
      }
      if (!item.attachedTo) {
        const colours = { forward: "rgba(80, 220, 120, 0.8)", back: "rgba(255, 170, 40, 0.8)", left: "rgba(120, 140, 255, 0.8)",
          right: "rgba(120, 140, 255, 0.8)", up: "rgba(240, 240, 240, 0.8)", down: "rgba(240, 240, 240, 0.8)" };
        for (const [dir, [a, b]] of Object.entries(frameGuides(f))) {
          ctx.strokeStyle = colours[dir]; ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = item.attachedTo ? "rgba(255, 90, 200, 0.9)" : item.blob ? "rgba(255, 150, 40, 0.95)" : "rgba(60, 230, 255, 0.9)";
      ctx.setLineDash([4, 4]); poly(f.back); ctx.stroke();
      ctx.setLineDash([]); poly(f.front); ctx.stroke();
      ctx.beginPath();
      for (const k of order) { ctx.moveTo(...f.front[k]); ctx.lineTo(...f.back[k]); }
      ctx.stroke();
      if (!item.attachedTo) {
        ctx.fillStyle = "rgba(255, 90, 200, 0.95)";
        for (const spot of ["head", "hand", "top", "roof"]) {
          const at = spotOn(item.entry, spot, { size: 0.2 }, () => 0.5);
          if ((spot === "head" && !headOf(item.entry)) || (spot === "hand" && !handOf(item.entry))) continue;
          const [x, y] = framePoint(f, at.at[0], at.at[1], at.at[2]);
          ctx.beginPath(); ctx.arc(x, y, Math.max(2, W / 200), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  /* ── Placing ────────────────────────────────────────────────────────────
   *
   * The first thing named is the subject and takes the focus - a third across,
   * chosen by the caller (fx). Places fill their regions; a place with a
   * horizon sets the ground line everything else stands on. A relation says
   * where the earlier thing is relative to the later one - "trees under the
   * sun" puts the sun above the trees, "a cat on a chair" puts the chair
   * under the cat, "a bird in a tree" puts the tree around the bird (and
   * draws it first). Anything else takes the other third.
   *
   * `persp` (hexfield-craft.js, PERSPECTIVES) is where the viewer stands:
   *   horizon    eye level as a fraction of the height (null: the places decide)
   *   ground     how far below the horizon the nearest things stand (0..1)
   *   depth      how far back things after the first are set; further back is
   *              higher, smaller and nearer the vanishing point
   *   vanishX    where the lines of the ground meet, across the width
   *   iso        parallel projection: further back is up and across, not smaller
   *   hierarchy  size by importance: the first thing large, the others small
   *   scale      the first thing's size (a low view makes it tower)
   *   keystone   top width over bottom width of standing things (< 1: seen
   *              from below; > 1: from above)
   *   aerial     distant things fade toward the air
   * Places with a horizon are re-drawn to the eye level; their shapes keep
   * their order above and below it. */
  function layout(scene, W, H, rng, fx = null, persp = null) {
    const items = [];
    let horizon = null;
    const eye = persp && Number.isFinite(persp.horizon) ? persp.horizon : null;
    for (const s of scene.settings) {
      const [rx, ry, rw, rh] = s.entry.region;
      const h0 = s.entry.horizon;
      let y0 = ry, y1 = ry + rh;
      if (eye != null && Number.isFinite(h0) && !s.entry.overlay) {
        const map = (y) => y <= h0 ? y * eye / h0 : eye + (y - h0) * (1 - eye) / Math.max(0.01, 1 - h0);
        y0 = map(y0); y1 = map(y1);
      }
      items.push({ ...s, box: { x: rx * W, y: y0 * H, w: rw * W, h: (y1 - y0) * H }, alpha: s.entry.overlay ? 0.55 : 0.8 });
      if (Number.isFinite(h0) && !s.entry.overlay) horizon = Math.max(horizon ?? 0, eye ?? h0);
    }
    if (horizon == null && eye != null) horizon = eye;
    const groundShare = persp && Number.isFinite(persp.ground) ? persp.ground : 0.62;
    const groundY = (horizon != null ? horizon + (1 - horizon) * groundShare : 0.92) * H;
    const horizonY = (horizon ?? 0.62) * H;
    const depthK = Number(persp?.depth) || 0, iso = Number(persp?.iso) || 0;
    const vanishX = (Number.isFinite(persp?.vanishX) ? persp.vanishX : 0.5) * W;
    const isoDir = fx != null && fx > 0.5 ? -1 : 1;
    // The view as far as frames need it, while things are still being placed.
    const provisional = depthK || iso ? { horizon: horizonY, vanish: [vanishX, horizonY], iso, isoDir } : null;
    const skyY = (horizon != null ? horizon * 0.42 : 0.26) * H;
    let mainX = Number.isFinite(fx) ? fx : (rng() < 0.5 ? 1 / 3 : 2 / 3);
    const placed = [];
    const sizeOf = (entry, scale) => {
      let h = entry.size * H * scale;
      let w = h * entry.aspect;
      const maxW = W * 0.8;
      if (w > maxW) { h *= maxW / w; w = maxW; }
      return { w, h };
    };
    /* Two things side by side ("a tree to the left of a house") share the
     * width: the first goes to the side that leaves the second room, and
     * both are scaled together until they fit. */
    const GUIDED = ["behind", "front", "left", "right"];
    const pair = scene.subjects.filter((s) => !s.attach);
    let pairScale = 1;
    if (pair[1] && (pair[1].relation === "left" || pair[1].relation === "right")) {
      mainX = pair[1].relation === "left" ? 0.3 : 0.7;
      const total = sizeOf(pair[0].entry, 1).w + sizeOf(pair[1].entry, 1).w * 1.25;
      pairScale = Math.max(0.4, Math.min(1, (W * 0.9) / total));
    }
    scene.subjects.forEach((s, index) => {
      if (s.attach) return;
      const main = index === 0;
      // A second thing is smaller - unless the first sits on it or in it.
      // (Things standing together along guide lines keep their own sizes;
      // only their distance changes them.)
      const scale = (main || s.relation === "on" || s.relation === "in" || GUIDED.includes(s.relation) ? 1 : 0.68) * pairScale;
      const { w, h } = sizeOf(s.entry, s.count > 1 ? scale * 0.7 : scale);
      // A face (or anything that asks to be) sits in the middle, portrait-wise.
      let cx = (main ? (s.entry.centred ? 0.5 : mainX) : (mainX < 0.5 ? 2 / 3 : 1 / 3) + (index - 1) * 0.12) * W;
      let bottom;
      const anchor = s.entry.anchor;
      if (anchor === "sky") bottom = skyY + h / 2;
      else if (anchor === "water") bottom = ((horizon ?? 0.62) + 0.1) * H;
      else if (anchor === "centre") bottom = H * 0.5 + h / 2;
      else bottom = groundY;
      const inside = s.within && items.find((it) => it.key === s.within);
      // Size by importance: the first thing large, the rest small.
      const importance = persp?.hierarchy ? (main ? 1 + 0.5 * persp.hierarchy : 1 - 0.45 * persp.hierarchy) : 1;
      const towering = main && Number(persp?.scale) > 0 ? persp.scale : 1;
      const standing = anchor !== "sky" && anchor !== "centre";
      if (inside) {
        const r = inside.box;
        bottom = Math.min(r.y + r.h * 0.92, Math.max(r.y + h * 1.05, r.y + r.h * 0.5 + h / 2));
      }
      const before = placed[placed.length - 1];
      let z = 0;
      let lift = null;
      let guideK = 1, guideDepth = null;
      if (before && s.relation) {
        const b = before.box, under = b.x + b.w / 2;
        // The earlier thing is <relation> this one. Above and below keep their
        // own place across the canvas; on and in line the two up.
        if (s.relation === "above") bottom = Math.max(b.y + b.h + h * 1.02, bottom);
        if (s.relation === "below") bottom = Math.min(b.y - h * 0.1, bottom);
        if (s.relation === "on") { cx = under; z = -1; lift = before.key; }
        if (s.relation === "in") { cx = under; bottom = b.y + b.h / 2 + h * 0.55; z = -1; }
        /* Along the other's guide lines, on the same ground: "a cat behind a
         * dog" puts the dog on the cat's forward line (nearer, larger), "a
         * dog in front of a house" the house on the dog's back line (further,
         * smaller), "a well to the left of a house" the house on the well's
         * right line. */
        if (["behind", "front", "left", "right"].includes(s.relation)) {
          const f = frameOf(before, provisional), gap = 0.25, across = w / Math.max(1, before.box.w);
          const [u, back] = s.relation === "behind" ? [0.5, -(0.55 + gap)] : s.relation === "front" ? [0.5, 1.6 + gap]
            : s.relation === "left" ? [1 + gap + across / 2, 0.5] : [-(gap + across / 2), 0.5];
          const at = framePoint(f, u, 0, back);
          guideK = frameScale(f, back);
          cx = at[0]; bottom = at[1];
          guideDepth = (before.depth || 0) + (back > 0.5 ? 0.12 : back < 0 ? -0.12 : 0.01);
          z = before.z || 0;
        }
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
        let bw = w * k * fit * importance * towering * guideK * (s.form?.stretch || 1), bh = h * k * fit * importance * towering * guideK;
        if (bw > W * 0.9) { bh *= W * 0.9 / bw; bw = W * 0.9; }
        /* Set back in depth: the first thing stands in front; the others (and
         * copies, spread through the depth) further back - smaller, higher
         * and toward the vanishing point, or, isometric, up and across. */
        let depth = 0;
        if ((depthK || iso) && standing && !inside && !(before && s.relation)) {
          depth = main && copies === 1 ? 0.05 : copies > 1 ? 0.1 + 0.7 * (c / (copies - 1)) : 0.3 + rng() * 0.45;
          if (iso) {
            x += depth * 0.4 * W * isoDir;
            y -= depth * (y - horizonY) * 0.55;
          } else {
            const sc = Math.max(0.22, 1 - depth * depthK);
            y = horizonY + (y - horizonY) * sc;
            x = vanishX + (x - vanishX) * sc;
            bw *= sc; bh *= sc;
          }
        }
        if (guideDepth !== null) depth = guideDepth;
        // A towering thing still keeps its top on the canvas.
        const room = Math.min(H - bh * 0.02, y) - H * 0.02;
        if (bh > room && room > 0) { bw *= room / bh; bh = room; }
        const box = { x: x - bw / 2, y: Math.min(H - bh * 0.02, y) - bh, w: bw, h: bh };
        const item = { ...s, box, alpha: 1, z, depth };
        // Copies are cousins, not clones: the same style, their own genes.
        if (s.form) item.form = c ? { ...s.form, seed: (s.form.seed + c * 7919) >>> 0, parts: null } : s.form;
        if (persp?.aerial && depth) item.aerial = Math.min(0.7, depth * persp.aerial);
        if (persp?.keystone && persp.keystone !== 1 && standing) item.keystone = persp.keystone;
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
          // Lifted onto a seat it must still fit under the top of the canvas.
          const k = Math.min(1, (top - H * 0.02) / Math.max(1, other.box.h));
          const w = other.box.w * k, h = other.box.h * k;
          other.box = { ...other.box, x: support.x + support.w / 2 - w / 2, y: top - h, w, h };
        }
      }
    });
    const view = persp && (depthK || iso || persp.lines) ? {
      horizon: horizonY, vanish: [vanishX, horizonY], lines: Number(persp.lines) || 0, iso, isoDir, ground: groundY,
    } : null;
    // Things added onto things, on their frames, in the same view.
    const added = placeAttachments(scene, items, view, rng, W);
    // Containers first, so what is in them is painted over them; and further
    // back before nearer, so nearer things overlap them.
    items.sort((a, b) => (a.entry.kind === "setting" ? -2 : a.z || 0) - (b.entry.kind === "setting" ? -2 : b.z || 0) ||
      (b.depth || 0) - (a.depth || 0));
    orderAttachments(items, added);
    /* Each thing's pitch: how far above or below the eye it is (+ looking
     * down on it). The eye is the view's horizon; straight on, it is at the
     * main thing's own height; isometric looks down on everything. */
    const main = placed[0];
    const eyeY = persp && Number.isFinite(persp.horizon) ? persp.horizon * H : main ? main.box.y + main.box.h / 2 : H * 0.5;
    for (const item of items) {
      if (item.entry.kind !== "subject") continue;
      item.pitch = iso ? 0.55 : Math.max(-1, Math.min(1, (item.box.y + item.box.h / 2 - eyeY) / H * 2.4));
    }
    const first = placed[0];
    const focus = first
      ? { fx: (first.box.x + first.box.w / 2) / W, fy: (first.box.y + first.box.h / 2) / H }
      : null;
    return { items, focus, horizon, view };
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

  /* ── Form ────────────────────────────────────────────────────────────────
   * The same thing is never drawn the same way twice. Each painting draws its
   * things in one of these styles, and each thing gets its own genes within
   * it: a gentle warp, a lean, larger or smaller features (eyes, ears),
   * stretched or squat proportions. The entry is the idea of a cat; the form
   * is this cat.
   *   warp      how far a smooth field pushes parts and points (of the box)
   *   features  scale of small parts (eyes, ears, windows) about their centre
   *   stretch   width over the entry's own proportions
   *   lean      how far the top leans over the foot
   *   facets    angular: round parts become polygons with this many sides
   *   smooth    rounded: polygons are rounded, corners softened
   *   jitter    wobbly: every point shakes, outlines go hand-drawn */
  const FORM_STYLES = {
    plain: { warp: 0.02, features: [0.9, 1.15], stretch: [0.92, 1.08], lean: 0.04 },
    angular: { warp: 0.03, features: [0.9, 1.1], stretch: [0.9, 1.1], lean: 0.05, facets: [4, 7] },
    rounded: { warp: 0.02, features: [1, 1.2], stretch: [0.95, 1.12], lean: 0.02, smooth: true },
    wobbly: { warp: 0.06, features: [0.85, 1.2], stretch: [0.9, 1.1], lean: 0.08, jitter: 0.022 },
    elongated: { warp: 0.03, features: [0.8, 1], stretch: [0.6, 0.76], lean: 0.05 },
    squat: { warp: 0.03, features: [1, 1.2], stretch: [1.28, 1.48], lean: 0.03 },
    cartoon: { warp: 0.02, features: [1.35, 1.6], stretch: [0.9, 1.05], lean: 0.03, smooth: true },
  };

  function sampleForm(style, rng) {
    const f = FORM_STYLES[style] || FORM_STYLES.plain;
    const between = ([lo, hi]) => lo + (hi - lo) * rng();
    return {
      style: FORM_STYLES[style] ? style : "plain", seed: Math.floor(rng() * 1e9),
      warp: f.warp * (0.6 + rng() * 0.8), features: between(f.features), stretch: between(f.stretch),
      lean: (rng() - 0.5) * 2 * f.lean, facets: f.facets ? Math.round(between(f.facets)) : 0,
      smooth: Boolean(f.smooth), jitter: f.jitter || 0,
    };
  }

  function formField(seed) {
    const r = seededRandom(seed >>> 0);
    const p = [r(), r(), r(), r()].map((v) => v * Math.PI * 2), k = [2 + r() * 2, 2 + r() * 2, 2 + r() * 2, 2 + r() * 2];
    return (x, y) => [Math.sin(x * k[0] + p[0]) * Math.cos(y * k[1] + p[1]), Math.sin(y * k[2] + p[2]) * Math.cos(x * k[3] + p[3])];
  }

  const ROUND_SHAPES = new Set(["ellipse", "egg", "almond", "dome"]);

  /* The entry's parts, drawn in this item's form (cached on the form). */
  function formParts(item) {
    const form = item.form;
    if (!form) return item.entry.parts;
    if (form.parts && form.partsOf === item.entry) return form.parts;
    const field = formField(form.seed), rng = seededRandom((form.seed ^ 0x51ab) >>> 0);
    const move = ([x, y]) => {
      const [fx, fy] = field(x, y);
      return [x + fx * form.warp + (1 - y) * form.lean, y + fy * form.warp];
    };
    const shake = (pt) => form.jitter ? [pt[0] + (rng() - 0.5) * 2 * form.jitter, pt[1] + (rng() - 0.5) * 2 * form.jitter] : pt;
    const parts = item.entry.parts.map((part) => {
      const out = { ...part };
      if (part.box) {
        let [bx, by, bw, bh] = part.box;
        // Small parts - eyes, ears, windows - are where character lives.
        const small = bw * bh < 0.03 ? form.features : 1;
        const [cx, cy] = move([bx + bw / 2, by + bh / 2]);
        bw *= small; bh *= small;
        out.box = [cx - bw / 2, cy - bh / 2, bw, bh];
        if (!part.cut && ROUND_SHAPES.has(part.shape) && (form.facets || form.jitter)) {
          // Angular: facets. Wobbly: a shaky outline.
          const n = form.facets || 14, a0 = rng() * Math.PI * 2;
          out.shape = "poly";
          out.pts = Array.from({ length: n }, (_, i) => {
            const a = a0 + (i / n) * Math.PI * 2, j = form.facets ? 1 + (rng() - 0.5) * 0.24 : 1 + (rng() - 0.5) * form.jitter * 8;
            return [cx + Math.cos(a) * bw / 2 * j, cy + Math.sin(a) * bh / 2 * j];
          });
          out.smooth = Boolean(form.jitter);
        } else if (part.shape === "rect" && form.smooth) out.r = Math.max(part.r || 0, 0.4);
      }
      if (part.pts) {
        const pts = part.pts.map(move);
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
        const k = area < 0.03 ? form.features : 1;
        const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
        out.pts = pts.map(([x, y]) => shake([mx + (x - mx) * k, my + (y - my) * k]));
        if (part.shape === "poly" && form.smooth) out.smooth = true;
      }
      return out;
    });
    form.parts = parts;
    form.partsOf = item.entry;
    return parts;
  }

  /* Words that ask for a particular way of being: "a dancer" dances, "a
   * sleeping dog" lies down, "a pine" is a pine. Pose numbers index the
   * entry's variants (0 = the entry as written). `sit` is the pose a thing
   * takes when it is on something. */
  const POSE_WORDS = {
    cat: { side: 1, profile: 1, curled: 2, sleeping: 2, asleep: 2, lying: 2, loaf: 2, walking: 3, prowling: 3, stalking: 3, sit: 1 },
    dog: { sitting: 1, sits: 1, lying: 2, sleeping: 2, asleep: 2, resting: 2, running: 3, runs: 3, chasing: 3, sit: 1 },
    person: { dancing: 1, dancer: 1, dance: 1, dances: 1, cheering: 1, walking: 2, walks: 2, walker: 2, sitting: 3, sits: 3, seated: 3, sit: 3 },
    tree: { pine: 1, fir: 1, christmas: 1, spruce: 1, poplar: 2, cypress: 2, tall: 2, windswept: 3, bare: 3, lonely: 3 },
    house: { townhouse: 1, terrace: 1, modern: 2, bungalow: 2, hut: 3, shack: 3 },
    boat: { rowing: 1, rowboat: 1, dinghy: 1, steamer: 2, steamboat: 2, ship: 2, ferry: 2, sailing: 3, yacht: 3 },
    bird: { perched: 1, sitting: 1, flying: 2, soaring: 2, sit: 1 },
    king: { sitting: 1, seated: 1, enthroned: 1, sit: 1 },
    face: { profile: 1, side: 1 },
  };

  function poseFor(key, words, sitting = false) {
    const poses = POSE_WORDS[key];
    if (!poses) return null;
    for (const word of words) if (poses[word] !== undefined && word !== "sit") return poses[word];
    return sitting && poses.sit !== undefined ? poses.sit : null;
  }

  /* One of an entry's ways of being (0 is the entry as written). */
  function entryVariant(entry, index) {
    const variants = entry?.variants || [];
    if (!index || !variants[index - 1]) return entry;
    return { ...entry, ...variants[index - 1], variantOf: entry, variantIndex: index };
  }

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
        boxPath(box, b, (x, y, w, h) => path.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), part.rot || 0, 0, Math.PI * 2));
        return path;
      case "dome":
        // Half an ellipse: a cap, a roof, a shell - or, with `down`, a bowl.
        boxPath(box, b, (x, y, w, h) => {
          if (part.down) path.ellipse(x + w / 2, y, w / 2, h, 0, 0, Math.PI);
          else path.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, Math.PI * 2);
          path.closePath();
        });
        return path;
      case "poly": {
        if (part.smooth && part.pts.length > 2) {
          // Round through the midpoints: the same shape, softened.
          const pts = part.pts.map((pt) => P(box, pt)), n = pts.length;
          const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const start = mid(pts[n - 1], pts[0]);
          path.moveTo(start[0], start[1]);
          for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
          path.closePath();
          return path;
        }
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
        ctx.save();
        // Flames that point down, out of a rocket.
        if (part.flip) { ctx.translate(0, 2 * y + h); ctx.scale(1, -1); }
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
        ctx.restore();
        return true;
      }
      case "pickets": {
        const n = part.n || 8, pw = w / n * 0.72;
        ctx.fillStyle = hsl(colour, tone);
        for (let i = 0; i < n; i++) {
          const px = x + (i + 0.14) * w / n;
          ctx.beginPath();
          ctx.moveTo(px, y + h);
          ctx.lineTo(px, y + pw * 0.7);
          ctx.lineTo(px + pw / 2, y);
          ctx.lineTo(px + pw, y + pw * 0.7);
          ctx.lineTo(px + pw, y + h);
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

  /* Round rims in perspective. A circle lying level - an umbrella's edge, a
   * mushroom's cap, a bowl's mouth - is seen as an ellipse, rounder the
   * further it is above or below the eye (the item's pitch: + looking down
   * on it, - looking up at it). Its near edge bows toward the eye, so the
   * straight edge of a front-on drawing bends; from below, a canopy shows its
   * underside and the ribs running to its hub; from above, a bowl shows its
   * inside. Only parts marked `rim` - a shoulder or a head of hair is not. */
  function rimParts(parts, item) {
    const pitch = item.pitch || 0;
    if (Math.abs(pitch) < 0.05 || !parts.some((p) => p.rim && p.shape === "dome" && p.box)) return parts;
    const s = Math.min(0.6, Math.abs(Math.sin(pitch)));
    const wide = item.box.w / Math.max(1, item.box.h);
    const out = [], rims = [];
    for (const part of parts) {
      if (!part.rim || part.shape !== "dome" || !part.box) { out.push(part); continue; }
      const [x, y, w, h] = part.box, rx = w / 2, cx = x + rx;
      // Half the rim's depth, in the drawing's height units.
      const ey = rx * s * wide;
      const rimY = part.down ? y : y + h;
      const inside = part.down ? pitch > 0 : pitch < 0;
      rims.push({ cx, rx, rimY, ey, inside, box: part.box, down: Boolean(part.down) });
      out.push(part);
      out.push({ shape: "ellipse", box: [x, rimY - ey, w, 2 * ey], colour: part.colour, tone: part.tone || 0 });
      if (inside) {
        out.push({ shape: "ellipse", box: [x + w * 0.025, rimY - ey * 0.95, w * 0.95, 2 * ey * 0.95], colour: part.colour, tone: (part.tone || 0) - 0.24 });
        if (!part.down) {
          const hubY = rimY - ey * 0.25, n = 8;
          for (let i = 0; i < n; i++) {
            const a = ((i + 0.5) / n) * Math.PI * 2;
            out.push({ shape: "line", pts: [[cx, hubY], [cx + Math.cos(a) * rx * 0.95, rimY + Math.sin(a) * ey * 0.95]],
              width: 0.012, colour: part.colour, tone: (part.tone || 0) - 0.4, rimRib: true });
          }
        }
      }
    }
    // Lines on a rimmed part: seen from below, the outside seams are hidden;
    // seen from above, where they meet the rim they bend with it.
    return out.filter((part) => {
      if (part.rimRib || part.shape !== "line" || !part.pts) return true;
      const rim = rims.find((r) => r.inside && !r.down && part.pts.every(([px, py]) =>
        px >= r.box[0] - 0.02 && px <= r.box[0] + r.box[2] + 0.02 && py >= r.box[1] - 0.04 && py <= r.rimY + 0.04));
      return !rim;
    }).map((part) => {
      if (part.rimRib || part.shape !== "line" || !part.pts) return part;
      let bent = null;
      for (const r of rims) {
        if (r.inside || r.down) continue;
        part.pts.forEach(([px, py], i) => {
          if (Math.abs(py - r.rimY) > 0.04 || Math.abs(px - r.cx) > r.rx) return;
          bent ||= part.pts.map((pt) => pt.slice());
          bent[i][1] = py + r.ey * Math.sqrt(Math.max(0, 1 - ((px - r.cx) / r.rx) ** 2));
        });
      }
      return bent ? { ...part, pts: bent } : part;
    });
  }

  function paintItem(ctx, item, rng) {
    const box = item.box;
    for (const part of rimParts(formParts(item), item)) {
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

  /* ── Dimensionality ──────────────────────────────────────────────────────
   * How solid a thing looks, independent of what it is and how it is
   * painted (hexfield-craft.js, DIMENSIONS):
   *   model   0..1  light and shade across the form: lit toward the light,
   *                 falling into shadow on the far side
   *   cast    0..1  a shadow thrown on the ground, away from the light
   *   depth   0..1  an extruded body behind the face, receding away from the
   *                 light - the thing becomes a block, not a cut-out
   * `light` is the direction toward the light, in radians (canvas y down,
   * so a light above has a negative sine). Only subjects take it; settings
   * are the space they stand in. */
  function tintedCopy(source, W, H, fill) {
    const copy = document.createElement("canvas");
    copy.width = W; copy.height = H;
    const c = copy.getContext("2d");
    c.drawImage(source, 0, 0);
    c.globalCompositeOperation = "source-atop";
    c.fillStyle = fill;
    c.fillRect(0, 0, W, H);
    return copy;
  }

  function dimensionItem(ctx, layer, lctx, item, W, H, dims) {
    const b = item.box;
    const sx = Math.cos(dims.light), sy = Math.sin(dims.light);
    const anchor = item.entry.anchor;
    const grounded = anchor !== "sky" && anchor !== "centre";
    // A shadow on the ground, thrown away from the light and lying flat.
    if (dims.cast > 0 && grounded) {
      const shadow = tintedCopy(layer, W, H, "rgb(12, 12, 24)");
      const yb = b.y + b.h, k = -sx * 1.1;
      ctx.save();
      ctx.globalAlpha = (item.alpha ?? 1) * dims.cast * 0.75;
      if ("filter" in ctx) ctx.filter = `blur(${Math.max(1, Math.round(Math.min(b.w, b.h) * 0.03))}px)`;
      ctx.setTransform(1, 0, -k, 0.28, k * yb, 0.72 * yb);
      ctx.drawImage(shadow, 0, 0);
      ctx.restore();
      shadow.width = 0;
    }
    /* An extruded body: the face's own colours, darkened, stepped back. In a
     * one-point view it recedes toward the vanishing point, shrinking as it
     * goes; isometric, along the fixed 30-degree depth axis; otherwise up and
     * away from the light. */
    if (dims.depth > 0 && anchor !== "sky") {
      const side = tintedCopy(layer, W, H, "rgba(10, 12, 26, 0.5)");
      const steps = Math.max(4, Math.round(dims.depth * 14));
      ctx.save();
      ctx.globalAlpha = item.alpha ?? 1;
      if (dims.vanish && !dims.iso) {
        const [vx, vy] = dims.vanish;
        for (let i = steps; i >= 1; i--) {
          const k = 1 - dims.depth * 0.3 * (i / steps);
          ctx.setTransform(k, 0, 0, k, vx * (1 - k), vy * (1 - k));
          ctx.drawImage(side, 0, 0);
        }
      } else {
        const reach = dims.depth * Math.min(b.w, b.h) * 0.32;
        const ex = dims.iso ? 0.87 * (dims.isoDir || 1) : -Math.sign(sx || 1) * 0.72, ey = dims.iso ? -0.5 : -0.62;
        for (let i = steps; i >= 1; i--) ctx.drawImage(side, ex * reach * i / steps, ey * reach * i / steps);
      }
      ctx.restore();
      side.width = 0;
    }
    // Light and shade across the form.
    if (dims.model > 0) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.max(b.w, b.h) * 0.6;
      const g = lctx.createLinearGradient(cx + sx * R, cy + sy * R, cx - sx * R, cy - sy * R);
      g.addColorStop(0, `rgba(255, 246, 228, ${0.42 * dims.model})`);
      g.addColorStop(0.42, "rgba(255, 255, 255, 0)");
      g.addColorStop(0.62, `rgba(8, 10, 30, ${0.35 * dims.model})`);
      g.addColorStop(1, `rgba(8, 10, 30, ${0.8 * dims.model})`);
      lctx.save();
      lctx.globalCompositeOperation = "source-atop";
      lctx.fillStyle = g;
      lctx.fillRect(b.x - b.w, b.y - b.h, b.w * 3, b.h * 3);
      lctx.restore();
    }
  }

  /* ── Perspective ───────────────────────────────────────────────────────
   * The ground made to recede: lines that meet at the vanishing point and
   * cross-lines that close up toward the horizon (or, isometric, a diamond
   * grid of parallels). Faint - a floor, furrows, paving, not a diagram. */
  function groundCues(ctx, W, H, view) {
    if (!view?.lines) return;
    // Only the ground: never over the sky.
    const top = Math.max(0, view.horizon);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, H - top);
    ctx.clip();
    ctx.strokeStyle = `rgba(20, 18, 32, ${0.2 * view.lines})`;
    ctx.lineWidth = Math.max(1, Math.min(W, H) / 240);
    ctx.beginPath();
    if (view.iso) {
      const c = Math.cos(Math.PI / 6), sn = Math.sin(Math.PI / 6), L = W + H * 3, step = Math.max(W, H) / 9;
      for (let x0 = -L; x0 < W + L; x0 += step) {
        ctx.moveTo(x0, H); ctx.lineTo(x0 + c * L, H - sn * L);
        ctx.moveTo(x0, H); ctx.lineTo(x0 - c * L, H - sn * L);
      }
    } else {
      const [vx, vy] = view.vanish;
      for (let i = -7; i <= 7; i++) {
        const xb = W / 2 + i * W * 0.16;
        ctx.moveTo(vx, vy); ctx.lineTo(vx + (xb - vx) * 3, vy + (H - vy) * 3);
      }
      for (let k = 1; k <= 8; k++) {
        const y = vy + (H - vy) * Math.pow(k / 8, 2);
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /* A standing thing seen from below narrows toward its top, from above
   * toward its foot: drawn in thin rows, each scaled about the thing's axis. */
  function drawKeystoned(ctx, layer, box, keystone, W) {
    const cx = box.x + box.w / 2;
    const y0 = Math.max(0, Math.floor(box.y)), y1 = Math.ceil(box.y + box.h);
    for (let y = y0; y < y1; y += 2) {
      const t = Math.min(1, Math.max(0, (y - box.y) / Math.max(1, box.h)));
      const f = keystone + (1 - keystone) * t;
      ctx.drawImage(layer, 0, y, W, 2, cx - cx * f, y, W * f, 2);
    }
  }

  /* Paint laid-out items onto ctx (transparent where nothing is), each on its
   * own layer so a cut-out (the moon's crescent, a bridge's arch) removes only
   * that thing. `only` limits it to "subject" or "setting"; `dims` gives the
   * subjects their solidity (see Dimensionality); `view` is the perspective
   * the layout was made in (ground lines, keystones, aerial fade). `pick`
   * paints just that one item, exactly as it looks among the others (same
   * seed) - the painter's mask for a thing's own brush. */
  function paint(ctx, W, H, items, rng, only = null, dims = null, view = null, pick = null) {
    const layer = document.createElement("canvas");
    layer.width = W; layer.height = H;
    const lctx = layer.getContext("2d");
    // One seed per item, drawn up front, so an item looks the same whether or
    // not the others are painted with it.
    const seeds = items.map(() => Math.floor(rng() * 4294967296) >>> 0);
    const solid = dims && (dims.model > 0 || dims.cast > 0 || dims.depth > 0);
    // The ground's lines go down once the places are painted, under the things.
    let cued = !view || only === "subject" || pick !== null;
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (!cued && item.entry.kind !== "setting") { groundCues(ctx, W, H, view); cued = true; }
      if (only && item.entry.kind !== only) continue;
      if (pick !== null && index !== pick) continue;
      lctx.clearRect(0, 0, W, H);
      paintItem(lctx, item, seededRandom(seeds[index]));
      if (solid && item.entry.kind === "subject" && !item.lettering) dimensionItem(ctx, layer, lctx, item, W, H, dims);
      // Distance: far things fade toward the air.
      if (item.aerial) {
        lctx.save();
        lctx.globalCompositeOperation = "source-atop";
        lctx.fillStyle = `rgba(196, 208, 226, ${item.aerial})`;
        lctx.fillRect(0, 0, W, H);
        lctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = item.alpha ?? 1;
      if (item.keystone && item.keystone !== 1) drawKeystoned(ctx, layer, item.box, item.keystone, W);
      else ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }
    if (!cued) groundCues(ctx, W, H, view);
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

  global.HexfieldVisual = { ENTRIES, FAMILIES, COLOUR_WORDS, RELATIONS, LEARNED, lookup, read, layout, paint, subjectColours,
    FORM_STYLES, FORM_KEYS: Object.keys(FORM_STYLES), sampleForm, entryVariant, poseFor, learn,
    frameOf, framePoint, drawFrames };
})(typeof globalThis !== "undefined" ? globalThis : this);
