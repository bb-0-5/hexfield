# Hexfield 323 — The painting judges itself locally

Build 323 gives the existing automatic artwork **nine independent spatial memories** and a bounded KEEP / REWORK process. A small part of a still-unfinished candidate can challenge its own executed brush system *before* the full painting enters global W / φ / H comparison.

## Real local experimentation
- The canvas is divided conceptually into a 3×3 set of stable region identities. These are not rendered as a visible tiled UI. Every region has its own quality estimate, age, remembered mark, KEEP count, REWORK count, volatility proxy and last review generation.
- When a full-sized candidate finishes its genuine row-by-row brush stage, the painter selects at most **two** relatively uncertain neighbourhoods on desktop, or **one** on mobile. It entirely avoids already protected sparse-render generations. Stable recognized objects covering significant portions of a region exclude that region from experimentation.
- Each selected region evaluates the actual image and an actual re-execution of the rule engine using a **different mark language** (including experimental, invented, hatch, dot and hybrid marks). The alternative is drawn only inside that 1/9-sized rectangle using strict canvas clipping and physical source image pixels.
- Both outcomes are scored *from actual raster pixels* for local visual novelty (W), geometric/palette proportion influenced by the golden ratio (φ), continuity with the previous painting (H), and visual complexity. A challenger must improve the overall region score by a meaningful margin; otherwise **KEEP** wins and the original ink survives.
- Accepted local corrections change only the corresponding spatial rectangle, not nearby typography or the canvas outside it. The current production canvas visibly updates during the candidate construction and announces KEEP or REWORK. Lettering is added afterward and is still considered part of the final global judgement.
- The globally selected candidate alone commits its region decisions to memory. The nine compact histories are persisted locally and restored at the next visit; losing candidates do not teach it misleading preferences. Individual regions develop at different rates, with uncertain, long-neglected areas re-evaluated more frequently.

## Constraints / honest limits
This is **regional self-correction before choosing a finished artwork**, not an additional neural model with human visual understanding. The region score is a documented numerical approximation, and global W / φ / H continues to determine whether the whole composition qualifies. Alternative law painting is real, but costs an extra bounded local painting pass; the existing adaptive device governor limits how many are attempted.

The engine's parent history, object survival, responsive actual brush-row execution, canvas-first presentation, automatic Paint & Abstract, exact image export, reduced-motion handling, print handoff and no additional buttons or paid cloud calls are preserved.

## Verification
Automated tests cover deterministic local raster scores, independent regional-memory persistence, alternate real mark execution, one KEEP and one REWORK verdict in the same candidate, exact pixel conservation outside the revised patch, skipping dirty/protected regions, and ten-generation integration with actual live regional decision events.