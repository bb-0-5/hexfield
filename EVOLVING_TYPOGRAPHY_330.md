# Hexfield 330 — Typography grows with the artwork

The live painting now carries an explicit, serializable **typeGenome** on each evaluated art recipe. Unlike swapping browser fonts or applying one global filter, the raster painter changes each letter's width, slant, independent upper/lower stroke weight, rounded expansion (bubble), and the offset between upper and lower segments. Its pigments still come from the artwork and its contours still negotiate with actual scene pixels.

**Heredity:** Each cheap real-canvas candidate mutates a bounded dimension of the globally accepted parent genome. A failed trial never becomes the next parent. All accepted generations keep one root identity even when individual letter anatomy and ink material evolve. Strictly bounded traits protect readability; LOW mutates gently. Four structural grammars (rounded, split, kinetic and architectural) cover very different shape families. Every glyph receives its own seeded variation.

**Consistency:** Manual CHANGE STYLE and REPEAT retain the accepted type genome, seed, wording and frozen reference for pixel-identical reconstruction. The prior lettering canvas is restored before reapplying edited text; glyphs cannot build up on top of old lettering. The engine stores its type genome in the same recipe it already persists, so no additional UI tabs or external AI requests are needed.

**Verification:** A pixel-level skia test paints identical words twice for each grammar, checks that different grammars change actual raster output, and proves that repeated genome inheritance preserves a stable root without freezing every child.
