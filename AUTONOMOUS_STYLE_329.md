# Hexfield 329 — The painter auditions its own techniques

Hexfield no longer needs the user to keep pressing CHANGE STYLE to escape one procedural texture. In the **continuous** canvas, the existing two or three cheap real-pixel sketch slots compare different executable brush grammars (ink, pointillist, cut paper, engraved, gestural). The next full-size painting is made only with the one or two candidates the performance governor already allows. **No additional paid image requests, sliders, canvases on the page or full-render passes.**

## What changes

1. Every short chapter begins from the **last actually accepted style**. A rotating neighbour is given an authentic low-resolution trial. The third slot periodically studies a more distant technique rather than a third iteration of the same hybrid.
2. An existing full-size slot can be reserved for a different technique **only if** its real thumbnail score is within 0.055 of the leader. On a hot mobile device with one full-size slot, the algorithm does not increase its render budget to chase variety.
3. The final decision uses **the fully painted W / φ / H quality**. Every third generation, a different style can win within a very small 0.027 overall margin, but only if it also satisfies the shape-heritage and geometry scores within 0.075. Strict golden qualification still overrides exploration. Weak alternative paint is rejected; five changed labels are not the output.
4. In LOW, the non-destructive edge-aware composition preservation from 328 is still applied to the actual brushwork, and aggressive destructive reworks remain disabled. In MEDIUM/HIGH, each candidate uses its **own** mixer, not the original style's mixer.
5. The canvas reports which real techniques were auditioned and why the selected one won; the selected style remains the starting point of the next cycle. Explicit locked laws/marks disable automatic style replacement.

## Manual gestures remain precise

**CHANGE STYLE** and **REPEAT STYLE** still hold an immutable real reference and a reproducible seed while the painter is paused. Those buttons never invoke style auditions. After manual restyling, importing a picture, or accepting another manual painting, **PAINT & EVOLVE now rebases its internal parent on that actual accepted image**, including an unlettered original for clean text recomposition. It no longer resumes from an old cached auto frame. Selecting FILE / IMAGINED / ARCHIVE explicitly now actually switches the CHANGE STYLE source; otherwise the accepted painting stays anchored.

## Verification and limits

- Deterministic rotation reaches all five executable grammars; explicitly locked methods have priority.
- The thermal governor caps previews to three and full renders to one or two as before.
- Tests exercise real preflight budget reservation and full W/φ/H safety guards, manual-to-auto rebasing, and explicit reference selection.
- These remain procedural ink grammars, **not** a semantic image-to-image diffusion restyler. Pixel-preserved outlines are not semantic object masks. An alternate technique cannot be forced if measured artwork quality is clearly worse.
