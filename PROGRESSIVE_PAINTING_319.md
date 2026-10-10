# Hexfield 319 — Progressive Painting + Reusable Donor Memory

Build 319 tackles browser responsiveness and redundant source readbacks while retaining the canvas-first automatic painting and live coloured lettering introduced in Build 318.

## Responsive painting stages
The abstraction loop yields to the browser before donor preparation, between each real low-resolution sketch, before full-size paints, between expensive finalists and before judging the final full image. These are genuine browser turns, not mock animation. On each checkpoint the main studio reports what process is actually executing. The user can pause or type while rendering; a generation invalidated at any checkpoint is discarded rather than overwriting a newer decision. A rejected/pause-aborted stage can resume promptly, while failed renderers retain the normal interval to avoid repeated CPU/battery spikes.

## Adaptive mobile budget
Each completed generation measures actual elapsed rendering time and records an exponentially weighted estimate. Desktop and initial phone generations still explore three real previews and up to two full-size finalists. Only after two measured expensive phone generations does the painter automatically reduce previews to two (over roughly 950ms), and at a hotter threshold (~1750ms) it evaluates one full-size finalist. Existing mark and source-family exploration remains scheduled; strict golden qualification still affects ranking. There are no extra user settings.

## Immutable donor image memory
The source bank labels only its own immutable, stable canvas generations as cacheable. A WeakMap holds prepared RGBA snapshots keyed by canvas identity and target dimensions. Each prepared sample contains the actual source pixels; unchanged terrain, lettering and other prepared donor canvases need not be rescaled or read back repeatedly. When a donor is regenerated, its identity changes and old cache entries are garbage-collectible. Mutable uploads, parents and live archive frames are never cached. Buffer-hit and fresh-read counts are measured and exposed to the studio.

## Visual and safety behaviour
The live canvas remains first on mobile and desktop. Painting and abstraction auto-start; lettering remains part of the same painting with KEEP / REJECT and Pause / Resume. Creative history is only rebuilt when a generation changes, not on every inter-stage progress event. Default retry intervals apply to errors; visibility suspension and deliberate cancellation are preserved. Build 318's exact-pixel sparse rendering and Build 317's actual object memory are unchanged.

## Automated verification
Tests exercise donor RGBA reuse, a fresh sample when a canvas or dimensions change, no stale readbacks of mutable canvases, hot-phone candidate budgets, normal desktop budgets, cooperative event-loop yielding and cancelled generations never being committed. Full regression suite also covers recursive evolution, typography and scene interactions, sparse dirty tiles and artistic genealogy. Timings are measurements, not promises of a particular FPS gain on any device.