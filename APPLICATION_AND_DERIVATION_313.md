# Hexfield 313 — Styles of Application and Between-Frame Derivation

## Artistic thesis

A recognisable way of making art does not have to imitate a known artist or use a style prompt. It can emerge from **how marks are deposited, removed, dragged, interrupted, repeated and inherited**, and from **how one abstraction frame is physically derived from another**.

A frame is not a disposable output. It is material for the next work.

## Actual implementation

### Ten additional mark procedures

`public/studio/mark-grammar.js` exposes ten executable mark families in addition to the original five: contour, rake, weave, ribbon, stipple, echo, scratch, tessellate, lattice and orbit.

- Contour strokes turn toward the **measured local image gradient** instead of randomly applying a label.
- Rakes have multiple bristles; woven marks deliberately interrupt one strand where another passes over it.
- Ribbons deposit faceted, variable-width pigment; stipples distribute small independent deposits according to local luminosity.
- Echo repeats and offsets a gesture; scratch overlays inconsistent drypoint traces.
- Tessellations build intersecting polygonal tiles; lattice creates a connected diamond structure; polygonal orbit traces repeated angular rings.
- Every new family respects the `no_curves` rule; polygons are replayed in the performance theatre from the *executed* paint trace.
- Existing `hybrid` painting uses the original five plus all ten new choices. No extra default user controls were added: the procedural painter varies application automatically, while optional mark locking remains authoritative.

### Five between-frame derivations

`public/studio/frame-derivation.js` receives TWO true source canvases: the accepted parent and the new candidate. It creates a **third image** before held pixel islands and shape genes are painted:

- **Conserve:** keep contiguous portions of actual parent paint while letting new marks develop around them.
- **Graft:** displace inherited pigment before applying it into new spatial regions.
- **Palimpsest:** layer new work translucently over the underlying frame.
- **Weft:** interleave alternating spatial strands from the two successive paintings.
- **Abrade:** let the mismatch between frames determine which previous material reappears.

Each application method produces deterministic pixels for a given parent, proposal, seed and cycle. Fields have a bounded 24-pixel resolution for mobile-scale cost and smooth transitions across patch boundaries. Methods report measured parent contribution, parent-dominant coverage, interwoven area and proportion of changed output pixels.

### Integration

- Every recursive candidate is a real rendered intermediate composition, not a metadata tag or hypothetical recipe. Its source mixer, formal laws and application method are evaluated together by the existing W / φ / H scoring pipeline.
- The method becomes part of candidate method identity, appears in the animated candidate-selection labels, and is recorded in the ten-generation history.
- Manual Rule Studio **repaint/rework** applies the same derivation between its existing picture and the freshly repainted proposal.
- Previously implemented pixel islands and reconstructed geometric shape ancestry are applied **after** this intermediate-stage transformation, so explicit heritage can survive radical derivative changes.
- The creative-performance theatre understands executed faceted polygon marks alongside its existing rect/circle/line traces.

## Limits

This is **procedural spatial editing**, not semantic object tracking. Local masks operate on pixels and known image structure; they may preserve a texture when a human would preserve a subject. A high parent-contribution number is not a psychological measure of artistic identity. Some intentionally hard edits may still break the composition; KEEP/REJECT and comparisons decide whether they are desirable.

No additional AI inference, external storage, paid API, checkout, or default configuration panel is introduced. The final accepted canvas remains the sole image used for exports and third-party Australian print handoff.

## Verification

`tests/mark-derivation.test.mjs` renders all ten new mark procedures under `no_curves`, inspects genuine performance traces and distinct pixel results, checks determinism for each of five between-frame methods, verifies both source paintings contribute, and exercises 22 consecutive derivative generations.

The existing Rule Studio, structural heritage, novelty, golden taste, printer handoff and ten-generation abstraction tests remain in the same GitHub Actions suite.
