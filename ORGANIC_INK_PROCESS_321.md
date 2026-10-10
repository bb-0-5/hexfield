# Build 321 — Organic Ink / the Painter Changes Its Mind

Hexfield no longer reveals the accepted image in obvious rectangular blocks. Build 321 uses **measured colour contours** from the real final painting and the **individual executed mark footprints** from the existing brush trace as construction paths.

## What is actually happening

1. Automatic painting continues to show genuinely rendered, scored candidate sketches on the one production canvas.
2. When a winner has been evaluated, Hexfield takes the last authentic sketch currently on that same canvas and, if an earlier accepted painting exists, **erases parts of the discarded draft** by copying authentic pixels from the parent *through traced colour boundaries*. It then removes the remaining rejected pixels before building the accepted painting.
3. Ink appears in **real rectangles, circles, polygon paths, and strokes** recorded by the rule engine, rather than arbitrary progress bars or tiles. Real-world production pixels are revealed through those shapes. Boundaries are extracted from the accepted picture with colour-region connected components and a smooth closed contour path.
4. Major contours, inherited-object regions and the word area are scheduled separately. Previous geometry remains visible until its area changes; the lettering region is brought forward near the end. For a local dirty-region generation, paths remain clipped to the changed region.
5. At the end of each construction Hexfield copies the **complete exact winning image**. In-progress brush shapes are an animated disclosure of genuine accepted pixels, not a new competing render. The source used for W/φ/H, KEEP/REJECT, inheritance and export remains the fully evaluated image.

The process animation remains finite, capped to at most 170 actual gestures and 24 major pigment contours per generation, and uses existing canvas pixel buffers rather than model calls or new controls. Erasure is performed only from a real previously displayed candidate. A hidden tab, user Pause, rapid text editing, or reduced-motion preference resolves to the complete accepted work safely.

This is an **accurate visual presentation of actual executed marks and resulting pigments**, not a claim that full procedural scoring was moved onto the display thread; scoring still determines the accepted painting first. The improvement is that the making now resembles physically drawn and undone ink instead of growing rectangles.

Tests cover connected contour extraction, actual trace path geometry, dirty clip exclusion, genuine changes during the animation, erasure, completion pixel equality and previous Build 320 safeguards.