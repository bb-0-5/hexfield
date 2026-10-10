# Hexfield 317 — object memory and fewer full renders

**One painted canvas remains the UI.** This build adds memory and evaluation planning underneath it rather than new tabs, settings, or expensive model requests.

## Persistent visual objects

The object extractor downsamples only the *accepted* artwork to a 48×30 structural grid, quantizes major colour regions, finds connected components, and keeps up to eight physical shape descriptors. Each descriptor stores a stable ID/root, age, area, normalized bounding box and centroid, predominant palette, edge density, compact run-length occupancy mask, stability/volatility, voting history and recent scene/letter interaction methods. Objects match subsequent winners by contour overlap, palette, position and area. No generic model inference, semantic labelling ("cat"/"building"), or expensive per-pixel instance segmentation is claimed.

Compact object histories persist in browser localStorage, with an asynchronous IndexedDB backup. If the page reloads, previously recognised shapes can be identified against the recovered painting. Stable object masks clip actual **parent canvas pixels** back into the next painting, conserving part of the picture without keeping a duplicate high-resolution bitmap in storage. The shape cache is deliberately bounded: up to eight descriptors and at most three physically reused objects per pass.

KEEP/REJECT updates object votes and records the latest relation. This complements the existing independently inherited contour ideas and raster motif memory.

## Render budget: 3 cheap previews, 1–2 full renders

Before this build, each pass rendered two (mobile) or three (desktop) full-size candidates. Build 317 instead does the following:

1. Prepare three seeded procedure genomes and candidate relationships without rendering.
2. Execute **three actual 240×150 rule-rendered previews**, including real source mixing. Score those previews for novelty, phi and broad continuity.
3. Select **at most two full-resolution finalists**. When a credible strong winner leads decisively from generation 3 onward, make **one full render**.
4. Apply parent-derived material, remembered contours and stable cached object pixels. Put scene-aware typography in the winner's actual painting. Commit W/φ/H and update the object registry only after selecting the winner.
5. Keep the coarse rejected candidates visible as *coarse preview trials*, not pretend they were fully evaluated.

The studio UI reports how many full renders were avoided and how many actual object identities were recognised or reused. Tests enforce the render budget and the use of genuine image data rather than manufactured scores.

## Limits and follow-ups

This is **not** yet a full semantic object tracker or truly sparse tile renderer. The surviving finalists still execute full-canvas rules, but fewer times, and stable physical regions are reused rather than lost. Scene changes that radically alter shape silhouettes may reset an object's identity; no inaccurate semantic label is manufactured.

A potential Build 318 is a conservative dirty-tile renderer which draws marks only in validated mutable regions, with a full-pass fallback when a global rule changes. This should be benchmarked against test canvases before enabling automatically.

No additional cloud image generations, fees, accounts, or print transactions.
