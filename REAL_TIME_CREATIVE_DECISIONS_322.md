# Build 322 — Actual creative decisions happen while the painter computes

**The live canvas is now displaying genuine work-in-progress stroke data**, not a replay that simulates the calculations after selecting a winner.

## What is different from Build 321

Build 321 animated shapes cropped from a fully evaluated image. Build 322 allows the actual deterministic rule engine to pause after drawing a few physical rows of brushwork, give the browser a frame to display the incomplete painting, then continue drawing more rows. This is the **same executable program** as the original synchronous full render; it has only one implementation and is pixel-identical. A new async runner advances the generator without executing a second illustration or a fake mark-trace replay.

Sequence:
1. Present real cheap preview studies to choose candidate procedures.
2. Start the first full-size candidate. As actual strokes are drawn in the rule renderer, reveal the real partially drawn canvas after every 3 desktop / 4 mobile rows. The actual source/mixing/mark law controls every stroke that appears. This happens **before** the completed candidate has a score.
3. Apply genuine parent derivation, surviving objects, inherited geometry and actual scene-coupled lettering to that candidate. Display it, fully lettered, before judging the next.
4. Draw further finalists through the same visible process; evaluate the finished real canvases using W / φ / H and existing taste. Commit the winner immediately, without replaying previously drawn marks from a finished bitmap.
5. Keep the only visible canvas as the actual production surface, with no new settings, automatic cloud requests, or account dependencies.

The automatic experience **no longer runs the Build 320/321 constructed-image replay after candidate selection**. Manual PAINT/REWORK may still use the organic old-form construction presentation, because it does not drive the continuous rule runner.

### Performance, safety, and fidelity

The async generator yields only after *actual* brush row completion, never during part of a single stroke. Yielding allows browser paints and rapid Pause/word-edit interruption. If a generation is invalidated, the iterator is safely closed, including resetting Canvas 2D clipping/transforms. The displayed painting is reset to the latest accepted canvas rather than persisting a rejected draft. The accepted source, local dirty tile logic, colour rules, golden-ratio scoring, print exports and stable object history are unchanged.

The trade-off is more browser scheduling turns per full painting; this deliberately prioritizes responsiveness and actual visible making over maximal uninterrupted throughput. The mobile governor still caps full-size finalists after slow frames. Frame-time diagnostics can be used to decide if batch size should increase in a future build.

Regression tests verify that synchronous and progressive versions produce **exactly the same image pixels, trace, metrics, and marks** under multiple rule systems, that visible intermediate canvases are really incomplete, that clipping resets on cancellation, and that user-facing creation events precede final winner selection. The live mobile experience still needs testing on a real device.