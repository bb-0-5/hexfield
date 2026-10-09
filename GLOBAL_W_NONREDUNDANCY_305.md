# Hexfield 305 — W / global renderer non-redundancy

## Design objective

Keep exploring from **the current seed and the current image / procedure lineage**.
Do not restart the artistic grammar for every generation and do not allow a
single old renderer style to dominate the output indefinitely.

**W is a candidate-ranking objective, not a theorem or a formal proof of
non-redundancy.** Visually unfamiliar does not necessarily mean better art.
A globally novel image can still be meaningless; measured structural
complexity is a proxy, not an aesthetic judgment.

## What Build 305 actually does

### One bounded global image memory

`public/studio/nonredundancy.js` maintains a per-browser,
per-origin localStorage ring of up to 84 render observations. Every entry
contains a 24×16 quantized luminance fingerprint, colour-role map, edge
fingerprint, a compact structural complexity estimate and a method signature.
It tracks art across Rule Studio, procedural landscapes, glyph/lettering,
the historical archive, and continuously composited experiments.

The memory contains reduced pixel descriptors, not original image files,
and is not synced with Supabase or other visitors. It resets if local site
data is cleared.

### Three rendered seed descendants

The continuous abstraction loop, initial Rule Studio paintings, and several
manual terrain/logo paths now:
1. derive a deterministic candidate seed from the current lineage seed;
2. vary the executable drawing law, mark method, composition or genome;
3. actually **render** each candidate;
4. compare the result with remembered image fingerprints and its parent;
5. penalize near-identical outputs and repeated method signatures; and
6. keep the least redundant viable candidate and store its observation.

Fast mobile abstraction passes test two candidates to reduce heat and CPU;
other flows test up to three. These are bounded local painting comparisons
and **do not make additional Cloudflare AI image requests**.

### Real procedural inheritance, not seed shuffling

The combined renderer bank keeps **terrain and lettering genome ancestry**
through novelty-triggered source refreshes. Mutations use deterministic seed
branches derived from their most recent lineage. A stagnation rescue refreshes
the source images without discarding the parent grammar.

Ancestry is tracked separately for each donor. A scene can accumulate
additional construction complexity without being constrained to random pixel
noise. However no explicit guarantee of monotonically increasing complexity
is imposed: non-redundancy balances visual change, method reuse and structural
complexity, and may select a simpler, more novel frame.

### Feedback and visibility

Both studios already collect KEEP/REJECT preferences. W complements those
weights and influences which rendered methods get shown. Rule Studio and
the experimental archive show current novelty and complexity. Procedural
landscapes and logos display a global W metric and their seed in the visual
metadata. Continuous sequences show W scores and retain parent→child history.

## Non-goals and limits

- Not a new paid AI model, not automatic Flux generation.
- Not a mathematical proof of global uniqueness.
- Not semantic scene understanding.
- Not globally aggregated across users, and not a blockchain.
- Not unbounded recursive complexity. Text readability, thermal performance,
  visual appearance and finite storage are important constraints.

## Regression tests

`tests/global-nonredundancy.test.mjs` checks:
- deterministic yet diverging seed branches;
- exact same pixels recognized as redundant;
- a blue/red variant and structurally different grids producing distinct
  fingerprints;
- cross-mode collisions still recognized globally;
- ranking favors genuinely changed outputs over familiar ones;
- increased edge structure contributes to the complexity estimate; and
- persistent global memory stays bounded after more than 84 renders.

`tests/studio-abstraction-loop.test.mjs` also tests 10 recursive generations
with multiple independent source renderers and real parent ancestry.
Other existing studio rendering, glyph anatomy and cloud inference tests
remain part of GitHub Actions.

## Versioning

The homepage displays **STUDIO / 305** and `public/build.txt` should read
`305`. Cloudflare's GitHub integration deploys the tracked repository.
