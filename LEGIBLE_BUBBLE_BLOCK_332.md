# Hexfield 332 — readable bubble/block lettering without double-stamping

## Observed failure and root causes

The live text was difficult to decipher because a mutable font mask was shredded by large row shifts, occasional full gaps, poor foreground/background luminance contrast, and over-aggressive scene-edge occlusion. The same wording could also appear multiple times because the previous *fully lettered* painting and separately rendered wordmark/logo donor images were recycled as new paint material, then the post-processor printed fresh type again. The legacy reload checkpoint only stored the lettered bitmap and did not retain the pre-type plate.

## The actual renderer changes

- Six compatible type grammars now include dedicated **BUBBLE** and **BLOCK** methods, not just styling labels.
- Both draw actual bold glyph outlines. Bubble thickens the contour with a round join; block uses harder mitered construction. Each character independently inherits bounded width, slant, upper/lower weight, inflation, outline thickness, tracking, and split offset. The legacy 330 four grammars still load.
- Large destructive row dislocations, random cutout cells and arbitrary holes across the glyph body are replaced by smaller, bounded variations. A real painted word maintains its foreground core when it crosses scene geometry.
- Final pigment is picked from three scene-derived hue families, with **light ink over dark patches and dark ink over light patches**, rather than arbitrarily choosing saturated pigment that may have the same brightness as its background. Local contrast is measured from the actual selected pixels.
- The existing three approximate style trials (two on hot mobile devices) can trial BUBBLE and BLOCK without adding any new full-size render passes. Only a globally accepted recipe passes its evolved type genome to the next generation. A single new select offers AUTO (default), BUBBLE and BLOCK; the parameters are never required of the user.

## Single-compositor rule

The word is drawn only once per accepted painting, **after** all scene paint/geometry changes. The next generation takes the true **unlettered** plate as its paint ancestor. Source mixing excludes pre-rendered LETTERING, LOGO and KEPT bitmaps when a live word is present. The living shape/pigment/region lineage also samples the clean accepted scene, not a text-covered bitmap. KEEP/REJECT and W/phi/H still inspect the composited final art with its actual words.

When the user changes text, purpose or shape, the visible canvas is rebuilt from its unlettered source. The clean plate is persisted beside the final picture, ensuring browser reloads do not create an extra text stamp. Older versions did not save clean plates, so one-time legacy restoration starts its next generation from a fresh clean procedural source instead of tracing unremovable embedded words; the saved visible image remains on screen until the next composition.

## Verification

The new pixel regression suite checks explicit BUBBLE and BLOCK output against the same bright/dark reference, exact per-pixel replay, edit/reapply idempotence, measured chromatic contrast, heritage of old 330 genomes, automatic grammar auditions, filtering text-bearing donors and persisted clean-plate integration. It is run alongside the full Rule Studio and recursive abstraction tests in CI.
