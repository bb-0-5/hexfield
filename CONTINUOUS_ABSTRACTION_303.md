# Hexfield 303 — continuous recursive abstraction and renderer fusion

**Surfaces:** https://hexfield.org/ (RULES mode) and
https://hexfield.org/legacy.html (RULE ENGINE / CONTINUOUS).

## Behaviour

Click **KEEP ABSTRACTING** on RULES, or **CONTINUOUSLY ABSTRACT**
on the experimental archive. The controls explicitly start a cancellable
loop; no cloud image requests are triggered automatically.

Each pass has a literal parent–child relation:

1. Read the **actual previous canvas pixels**.
2. Collect available source canvases from distinct rendering families:
   - synthesized geometric reality anchor;
   - procedural landscape painter with an evolving procedure genome;
   - glyph/letterform renderer;
   - legacy experimental archive's actual view canvas, or its last stored
     constrained frame if the archive is not currently open;
   - most recent model-created IMAGINE painting **if already generated**,
     retrieved from the existing browser IndexedDB store;
   - user-supplied photograph and/or a saved Rule Studio study when available.
3. Combine all available canvases via executed source-composition programs:
   spatial quilting, negative-space cutaway, chromatic dissonance, displacement
   by brightness, or edge-directed repainting.
4. Apply formal visual laws. The new **hybrid** mark-making mode simultaneously
   applies five different mark renderers in regions of the SAME image:
   short dashes, discrete points, hatching, cutout quads, and carve-back.
5. Reabstract by downsampling into masses, repainting negative space,
   misreading the previous frame, or forbidding its previous brush method.
6. Make that actual output the NEXT source, not the original reference.
   Record parent ID, generation, visual law and mark / blend programs.
7. If the picture resembles the parent too closely (pixel-difference proxy),
   regenerate the source bank to prevent the image collapsing into repetition.

A ten-image strip displays recent generations. KEEP and REJECT pause the sequence
and register feedback. The same origin-local rule memory informs both pages.
Manual reworks and PNG exports remain available.

## Performance and compatibility

- An explicit START runs the loop. It pauses when the tab is hidden. Leaving
  RULES mode pauses it. No server jobs, background tasks, automatic image-model
  inference, or Stripe changes are involved.
- The archive's original generator, museum, and artwork database remain intact.
  Rule-bound output is displayed in an independent overlaid canvas rather than
  written into historic archive canvases and exported metadata.
- Cross-page source snapshots are stored as compressed images in localStorage,
  while an existing generated AI artwork can be read from IndexedDB.
- Optional input renderer failures do not disable the reality-anchor source.
- The negative-space constraint currently uses image colour-distance to
  approximate figure and ground, not model-based segmentation or semantic
  understanding. Pixel novelty is not a measure of artistic merit.

## Tests

GitHub Actions runs ten-iteration renderer-fusion tests alongside hard-constraint,
image novelty, evolving-procedure and server-inference tests. Tests guard against
losing all source renderers after a novelty reset. Browser smoke checks have
confirmed live continuous painting in RULES and the experimental archive with
distinct source identities and parent-child frames.
