# Hexfield 328 — Change the way it paints without destroying what it paints

The current image is the artwork—not a disposable prompt. The previous CHANGE STYLE action could unexpectedly fetch an unrelated freshly generated reality image; automatic LOW painting could likewise replace the whole field with an entirely new render. Both behaviours undermined the promised reproducibility and long-lived visual identity.

## What now happens

**CHANGE STYLE captures the actual accepted canvas once.** If lettering is present, it uses the last real unlettered version and then recomposes the current editable words cleanly. The capture is immutable until the user chooses a new reference or resumes and produces a new accepted generation. The five style presets are tried against that *same real compositional snapshot* and *same seed*. REPEAT STYLE is a deterministic byte-for-byte reconstruction when source pixels, seed, lettering and browser canvas environment remain unchanged.

**Actual paint builds in place.** The row-by-row renderer still executes the selected full-size mark grammar. Instead of clearing the visible canvas to a beige placeholder as it progresses, a preview begins with the authentic original image and shows the physically computed new strokes only in the rows already painted. Unfinished areas remain exactly the old picture, not a simulated stroke trace. No second visible canvas or animation overlay is required.

**The new material is integrated with the structure instead of replacing it.** The completed candidate is blended with source pixels. In LOW, the original picture contributes about 65% in undetailed areas and a little more around measured silhouette edges and saturated regions. The full executed new marks remain perceptible. MEDIUM retains about 31% plus structural detail. HIGH stays unmodified: maximum stylistic freedom. The original image's *actual pixel gradients and chroma* decide what survives. No fake semantic object labels, cloud image models or fabricated annotations are involved.

**Continuous painting preserves the evolving composition too.** LOW now executes actual incremental strokes over the prior accepted canvas, physically conserves parent colour boundaries before scoring, and avoids unrelated region reworks, rediscovery stamps, large-scale form overlays and other disruptive interactions. A fixed, selected style does not become a partial paint that silently falls back to the previous hybrid law. The performance governor still limits full-size candidates.

**Review the visible decisions.** The production canvas reports that a structure has survived and shows its measured source-retention fraction. Every genuine style change still appears as physically computed ink building onto the existing artwork.

## Limitations

This is an edge-aware **pixel-conservation mechanism**, not semantic scene segmentation. It retains original physical geometry proportionally; it cannot distinguish a human face from a painted abstraction through semantic reasoning. Artistic style textures may become subtler on LOW. MEDIUM and HIGH intentionally permit more severe transformations. Results match deterministically with the same source image, seed, parameters and unchanged words on the same canvas runtime; different browser raster engines can exhibit minor antialiasing differences.

## Verification

Tests compare five actual rule styles against the same high-contrast reference, assert LOW is measurably closer to the original than the raw style pass, require exact per-pixel reproducibility, prove uncompleted brush rows do not blank the original, ensure HIGH leaves the output intact, and verify an eleventh live autonomous generation carrying out the selected style while retaining the accepted composition.
