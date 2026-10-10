# HEXFIELD 324 — Composition-wide negotiation

Build 323 let each region judge its own marks. Build 324 makes the regions **negotiate with each other** before the global W / φ / H verdict, without blending the entire work into uniform mush.

## Visual mechanism
1. The painter studies the *actual candidate pixels* at nine spatial regions. Each has a measured colour-weighted pigment palette, edge density and directional geometry; mature identity and local-quality memory influence which areas offer and receive advice.
2. A high-quality neighbour can propose to influence a less confident adjacent region. The influence changes **both** actual pigment and mark geometry: a small spatially varying echo of the donor's measured RGB palette and a subtle, directed displacement along the recipient's measured contour edges. The influence is **not** a flat global filter, and the donor's original pixels are left alone.
3. An entire surrounding neighbourhood then votes on the *actual resulting raster*. Each of up to four neighbours measures the real difference in cross-region compatibility. The scoring has two precise golden-ratio constraints: colour separateness targets 0.68/φ² rather than uniformity; geometric edge strength ratios target 1/φ²; the angle between edge directions is compared with π(1−1/φ²). Local W, φ, H/complexity scoring still checks that a more unified painting did not damage the changed region.
4. The vote succeeds only if a majority of neighbours do not oppose it, its weighted net compatibility improves, the recipient's local quality stays within tolerance, and the image retains nonzero pigment difference. Otherwise the neighbours veto the change. In either case the painter displays the actual tested candidate and the resulting decision *while still working*, not a retrospective film.
5. At most **one** recipient region changes per full-resolution candidate. Every candidate is evaluated globally using the **actual** negotiated final pixels alongside the previous structural memories, golden-ratio constraints, scene/word coupling and novelty. Only the **globally adopted** candidate adds its treaty to the small localStorage memory. Repeated one-way transfers are discouraged, so visual dialogue can shift partners rather than homogenise the image.
6. Stable named objects, untouched sparse tiles and explicit law-locks are excluded from negotiation. Source images, prior frames, print-ready exports, live lettering and human KEEP/REJECT remain authoritative.

## Performance and fidelity
- Nine inexpensive 18×12 region readbacks; one native-resolution patch candidate at most.
- No additional paid image models, configuration controls, overlays or server-side storage.
- The final image is a genuine painted candidate plus at most one precisely bounded, voted-on region change.
- No pixels outside the recipient region may change. Existing 323 independent regional KEEP/REWORK is preserved and executes before the 324 cross-region negotiation.
- The build does not claim human-level artistic judgement. Harmony is a numerical heuristic; testing against a real painting is still important.

## Verification
CI tests cover neighbour adjacency, objective golden relationships, preservation of parent pixels and adjacent areas, bounded visual influence, independent treaty memory with persistence, explicit lock and stable-object safeguards, sparse-output bypass, and live ten-generation integration prior to global artistic judgement.