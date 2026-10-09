# Hexfield 310 — surviving motifs and an autonomous painter

## Intent

The artist should decide its own visual constraints and **remember particular
pieces of what it has actually painted**. Novelty is not permission to erase
everything on every pass. The creative process itself is presented as an
animated sequence of decisions.

## Physical motif continuity

- `public/studio/motif-memory.js` finds occupied, visually detailed regions
  of the **real parent canvas** by sampling colour variation, edges and
  chromatic difference. It is not choosing arbitrary placeholder rectangles.
- It snapshots those pixel regions into genuine offscreen canvas fragments.
- During each subsequent render, the new mixed-source and formally constrained
  painting is executed, **then** inherited fragments are composited into
  localized soft-edged areas.
- Protected centres can remain essentially unchanged across successive
  generations. Other areas are free to be entirely reconstructed.
- Multiple independent motifs coexist. Every third generation can bring in
  a new motif; inherited ones stay fully visible for approximately six
  generations and progressively fade through nine. Memory remains bounded
  to three concurrently active fragments.
- Survival records give a motif ID, age, location and inherited coverage.
  Each generation history entry reports how many fragments survived.
- Manual **REABSTRACT / REPAINT** operations in Rule Studio also reuse
  physical fragments. A deliberately **new** painting starts a new lineage.
- The historic experimental archive shows its shared renderer's motif count.
- The renderer bank's landscape and lettering *program ancestry* also survives
  source refreshes, while W novelty still ranks distinct outcomes.

### Important formal-law nuance

Freshly generated marks obey each generation's current law, while a physical
fragment inherited from a previous generation is intentionally allowed to
retain evidence of that earlier law. Thus a 'no curves' new layer may contain
an older curved painted element. The studio calls these *archaeological
survivors*, not hard-law violations hidden from the user. A future
strict-compliance mode could reinterpret protected fragments instead of
copying their original ink.

Motifs are not semantic AI object detections. The feature selector works with
visible raster regions and can mistake a strongly textured background patch
for a meaningful subject. User KEEP/REJECT still supplies artistic judgement.

## Fewer user controls by default

- Rule Studio now opens with only **Paint**, **Keep Abstracting**, **Pause** and
  **One More Pass** as the primary drawing actions.
- Manual subject, law, secondary law, mark, source upload, rework method,
  mixer configuration, speed and manual mutation controls stay available in
  collapsed **OPTIONAL** panels rather than disappearing.
- Landscape settings and law overrides are likewise optional.
- Logo text remains available. The glyph anatomy editor, construction family
  and manual constraints are behind an optional inspector, while continuous
  logo evolution stays discoverable.
- In the default autonomous path, the underlying programs vary subject,
  procedural landscape lighting, drawing constraints, brush grammar and
  compositing method based on seeded parent→child mutations.
- The painter generally inherits the previous program when creating new
  procedural/logo generations; some candidates still come from a radical
  new procedure to avoid total genetic stagnation.
- User-selected manual settings remain authoritative.

## Animated process instead of scene-replacement effects

The RULES performance theatre receives *actual protected island positions*
and draws them during its parent, deletion and reconstruction phases. The
theatre already replays executed drawing marks and named glyph strokes.
When the procedural painter creates alternative candidates, its theatre
now shows real rendered trials and reports their φ geometry / colour / mutual
effect measurements before adopting a choice.

The underlying canvas is never replaced by the theatre's transient overlay.
Exports, feedback and the independent Australian printer referral use the
actual accepted image.

## Performance and limits

- Zero new paid image-model calls. All motif capture, candidate ranking and
  animation are local browser-canvas operations.
- Mobile continuous abstraction compares two rendered candidate images by
  default, versus three on larger screens.
- A hidden tab suspends the continuous loop.
- Protected motifs persist within an active loop. On page reload, the
  previously saved Rule Studio painting can be restored and used as a new
  parent, but the prior in-memory motif patch bank is not itself saved as
  a durable multi-image gallery. New motifs will be captured from that work.
- Captured local patches are not the same as fully semantic object tracking.

## Verification

- `tests/motif-memory.test.mjs`: deterministic salience selection, retained
  original pixels, unconstrained areas, multiple inherited motifs, and
  aging/exit.
- `tests/studio-abstraction-loop.test.mjs`: ten actual recursive passes,
  nonzero protected area on each child and persistent motif identity over
  multiple stages, plus all-renderer fusion and donor grammar ancestry.
- Remaining CI covers anatomy, real mark-trace animation, golden taste,
  worker security and Print Handoff.
