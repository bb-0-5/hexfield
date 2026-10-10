# Build 334 — The artwork needs a direction, not another parameter

The previous build passed technical regression tests but could still look unattractive. A valid mask, chromatic pixel ratio and W/φ/H score are not aesthetic approval. This is a deliberately **subtractive** visual-quality pass.

## What changes

1. **Art first, text optional.** New sessions no longer stamp a default "HEXFIELD" label across every painting. Deliberately entered wording is retained unchanged. No saved user copy is discarded.
2. **Stop re-injecting wordmarks.** The recursive painter no longer spends CPU drawing a hidden donor wordmark. A donor already containing text can no longer be mixed into the automatic painting. Words are typeset once, in the single final compositing operation, if the user actually supplied them. This also eliminates the phantom-branding path when the user leaves text blank. The separate creative lettering editor remains intact; only redundant source-bank typography is retired.
3. **One deliberate pigment choice per word.** The old glyph colour could flip from pale to black wherever it crossed a bright/dark patch of the *same* picture, making each character look dirty. The renderer now measures the background *under all its actual glyph pixels*, selects one coherent scene-derived ink direction and maintains that direction across the word. Tiny source-material modulation survives, but there are no arbitrary multicolour stripes.
4. **Real visual difference between Bubble and Block.** Bubble gains a visibly inflated, rounded stroke with clear padding, an actual dark rim surrounding its body and restrained highlights. Block uses a heavier, flatter solid body and sharp outer geometry. Both still use sampled constraints to retain counters and open letterforms. Other existing creative grammars remain available by reseeding.
5. **Declutter the first screen.** The live canvas and immediate artist status remain visible. The increasingly long rule, lineage and golden-ratio diagnostic paragraphs move behind an optional "WHY THIS PAINTING?" disclosure. The existing reseed, pause, purpose, abstraction and feedback interactions remain available; no extra control is added.

## What it does not claim

This update does not make every picture aesthetically successful. It removes three concrete sources of poor graphic composition—automatic watermarking, unwanted secondary letters and inconsistent ink—and draws a clearer distinction between two primary display styles. It introduces no image generation calls or new render passes.

## Automated evidence

Raster tests verify physical bubble rim pixels, measurable word coverage, exact replay, consistent word-level light/dark ink directions on deliberately light/dark paintings and absence of implicit wordmarks. The multi-generation studio regression is updated to assert that duplicate wordmark donors do NOT enter accepted painting sources.
