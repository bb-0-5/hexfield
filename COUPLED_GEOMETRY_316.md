# Build 316 — shared geometry instead of overlaid lettering

The canvas is now a **two-way material exchange**. Build 315 placed procedural text into the same image. Build 316 makes source objects and words structurally interact: source contour gradients alter the glyph mask, scene paint is physically displaced around letter outlines, object edges can pass in front of the text, and contour grafting can join an object and a letter.

Six executable geometry relations compete: **repel**, **thread**, **graft**, **carve**, **braid** and **orbit**. They are actual raster operators on the live painting, not prompts or decorative motion. The same geometry is exported, judged under W/φ/H, and inherited by the next abstraction; there are no extra visible canvases or tabs.

## Interaction and taste

A geometry trial measures real scene–glyph contacts, bent glyph pixels, displaced scene pixels, occlusions and grafted segments, and writes its relation into nonredundancy method provenance and the ten-frame process history.

The first candidate prefers the parent's relation if it isn't strongly disliked. Other candidates explore alternative relationships. **KEEP/REJECT** records a bounded, local preference score by relation. A strongly rejected relation is no longer forcibly inherited. No manual collision settings are necessary.

The interaction is bounded near the text region, deliberately leaves unrelated canvas pixels intact, and requires an actual scene colour edge to move source pixels. Empty text performs no interaction. No cloud-model calls are added.

## Validation

`tests/scene-geometry.test.mjs` checks all six procedures for genuine real-pixel scene movement outside the letters, occlusion/grafting, reproducibility, no mutation of source buffers, unchanged flat background, preference updates, and a fully painted, chromatic word collision. Existing integration, studio, geometry, and 24-generation regressions remain in CI.