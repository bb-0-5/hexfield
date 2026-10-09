# Hexfield 308 — φ × φ / Beauty as an inspectable constraint, art as a performed process

**Intent:** a procedural artist with a mathematical PRIOR for choosing
experiments rather than claiming it has discovered a universal theorem of
beauty. Users' KEEP/REJECT judgements remain authoritative.

The generator now tests each visible candidate against two separate
golden-ratio fields and one interaction / ablation field:

## Geometry (G)

Normalize the actual painted pixels to a 54×34 analysis raster. Obtain a
luminance-based structural salience map (background difference + local
luminance gradients), avoiding hue-based geometry measurement. Compute:
- structural-ink mass left of the φ division (x = 0.618 width);
- structural-ink mass above y = 0.618 height;
- occupied silhouette normalized width/height (target φ or 1/φ);
- percentage of positive/non-background area (target φ or 1−1/φ).

Each comparison uses a bounded Gaussian distance from the appropriate
golden proportion (0.61803398875 or 0.38196601125). Geometry is weighted
39% structural balance, 38% silhouette aspect, 23% occupancy, multiplied
by observable visual structure to penalize blank canvases.

## Color (C)

A separate saturation-aware pigment field calculates:
- largest hue family compared with the top two families (golden split);
- total dominant-hue share (target φ or 1−1/φ);
- chromatic pigment distribution on each side of the golden x/y dividers;
- golden-angle spacing between primary hue families (137.507764°).

Color needs at least two meaningful pigment families. A flat monochrome
painting receives zero color score even if it is evenly filled.

Color weights: 32% top-two pigment balance, 24% dominant hue share,
25% spatial balance, 19% golden hue angle, multiplied by pigment energy
and palette diversity. These are explicit design hypotheses, not proven
psychophysical preferences.

## Interaction (X) — how each affected the other

Compare observed overlap between the geometry's luminance salience
and the pigment distribution against TWO independent spatial ablations:

1. **Colour → geometry**: shift the pigment field horizontally by 0.382 of
   the canvas and vertically by 0.618, holding geometry fixed.
2. **Geometry → colour**: shift the geometry field by the same offsets,
   holding pigment fixed.

Each ablation records its own signed delta relative to the observed
composition. The interface displays BOTH causal-direction *proxies*,
rather than incorrectly treating all harmony as a single colour score.

Additionally score whether joint shape-and-color attention is supported
at the four golden-grid intersections. X combines true overlap,
the two separate ablation impacts and golden-focal-point support.

A stronger shape can make an otherwise sensible color palette fail this
interaction, and moving only the colored segments may change X without
changing the abstract geometry. This is the requested *third layer*.

## Hard qualification

The score is always measured, and an image only receives the label
**φ-qualified study** when ALL FOUR independent gates pass:

- G >= 0.54
- C >= 0.50
- X >= 0.53
- combined >= 0.57

The combined score is a geometric mean of G and C moderated by X:
`sqrt(G*C) * (0.54 + 0.46*X)`. No single exceptional
geometry or color score compensates for failure of the other.

The site offers:
- **STRICT** (default) — among rendered alternatives, prefer qualified
  images whenever one is available; do not falsely label failing studies;
- **GUIDE** — mix the golden scores into the user's learned taste and W
  novelty measurements;
- **OBSERVE** — inspect golden scores without allowing them to influence
  candidate selection.

If none of the currently rendered candidates passes the gate, Hexfield
still displays the best experimental study but marks its failure. **It
does not invent a claim of beauty.**

The local browser stores the user's mode selection. The scoring algorithm
does not upload personal images to external servers.

## Creative process as an artwork

An animated stage *performs the actual sequence*:

1. Reveal the parent artwork, its true previous glyph anatomy and a φ grid.
2. Present previously rendered candidate experiments.
3. Identify the actual surviving method and report its measured G/C/X values.
4. Undo or dismantle the previous arrangement.
5. Rebuild it from the actual named letter components or actual sampled rule
   drawing commands in their executed order.
6. Display the resulting authentic production canvas unchanged.

Replay, pause/resume, skip and hidden-tab stopping are available, with
prefers-reduced-motion supported. The performance is an explanatory visual
**process score**, not a fake claim about private model reasoning. The
underlying export and saved artwork remain clean, with no overlays.

## Glyph structure now responds more radically

Named glyph anatomy received:
- bubble swelling with rounded caps and expanded bowl proportions;
- upper-bold and lower-bold local segmentation;
- top-bold/bottom-fractured hybrids;
- rounded-square bowls and triangular counters;
- jagged geometry and specific top/bottom/left/right regions.

These operators are part of the inherited rule genome and are available to
the manual anatomy editor and continuous logo evolution.

## Boundaries

- The golden ratio does not objectively define human beauty; this is a
  falsifiable, adjustable mathematical aesthetic prior.
- Hue pairs are classified into 12 coarse buckets; contrast and saturation
  depend on displayed pixels.
- X is a single deterministic placement-ablation experiment, not proof of
  causal psychological response.
- The printer referral remains independent; the animation's extra overlay
  is never printed, scored as final artwork or sold as a bitmap.
- Existing Cloudflare AI inference budget and user vote storage are unchanged.

## Tests

`tests/golden-creative-process.test.mjs` tests φ constants, empty
scenes, independent geometry/color variation, pigment-position ablation
differences, strict qualification, interaction with W and actual
glyph/mark anatomy in the performance plan. It runs alongside the existing
artwork, archive, printable image and cloud security tests in GitHub Actions.
