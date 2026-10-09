# Hexfield Studio — Build 297: Judge the Image, Not Just the Method

## The actual failure this fixes

In build 296, rejection mutated instructions and compared strings such as
`terrain|sky|brush`. Entirely different programs could still paint visually
indistinguishable pictures. The next attempt also drew a new random seed,
confounding a method comparison with changes to placement. Binary likes/dislikes
had no durable representation of the image that was liked or rejected.

Build 297 adds **visual evidence and a controlled, human-judged experiment**.

### Visual fingerprints

`public/studio/vision.js` downsamples each *rendered canvas* and extracts compact
spatial luminance, colour masses, edges, and tonal-distribution features. The
signature is 164 small numbers, not the full image, and is interpreted strictly
as a rough **visual difference**, never as "beauty", "quality" or "meaning".
Logo signatures focus on the visible letter area instead of large blank margins.

KEEP and REJECT record this visual evidence. It influences the next candidate
search: paintings that resemble disliked results are disadvantaged. Promising
kept pictures influence candidate selection without eliminating fresh exploration.
Signatures now sync to the visitor's existing owner-private `hexfield_studio_votes`
row via the optional `visual_signature` column. The last 80 owner-private remote votes can restore this memory for the same
Supabase Auth identity. The current anonymous login is device-bound; moving
between devices does not automatically carry an anonymous login session. Existing votes and artwork remain untouched.

### Controlled counterfactuals after REJECT

The three competing questions are: change **structure**, **surface** or **light**
(and optionally the scene, if the subject was unlocked). Each proposed method
is rendered at preview resolution and compared with a matching preview of the
rejected picture using **the same random seed**. If the resulting pixels are
nearly identical to the rejected painting or another candidate, the suggestion
is retried or discarded; it does not count as an artistic discovery simply
because its underlying procedure changed.

Each card displays the **measured image distance**, and selecting it compares
the full painting with the rejected original. A subsequent KEEP/REJECT records a
paired outcome: source method, descendant method, the single intervention and
its human evaluation. Positive focus outcomes now influence subsequent mutation
choices; some mutations remain deliberately random so exploration continues.

A method fingerprint now includes numeric parameters and nested expressions
instead of just the operation names: successful descendants are distinguishable
from similarly named procedures.

### New paintings run a small visual search

Before PAINT SOMETHING, the studio renders **up to five** cheap previews on
desktop, **three** on mobile, and combines prior human feedback with visual
distance to past voted paintings to select a candidate. This discourages
repainting something the user just rejected. It is not a guarantee of quality.

### Test whether learning transfers

The optional **BLIND TEST / HAS IT LEARNED?** button presents two unseen
paintings in a randomized order: one descendant of previously KEPT work and
one fresh untrained procedural genome. They share the same scene, seed and
mood/text. The visitor chooses which image they prefer **before learning which
was trained**. The result is held out from regular taste training to keep the
evaluation separate. Counts survive reloads locally. At 12 or more votes,
we show a Wilson 95% interval and distinguish evidence from an inconclusive
test. Even a preference for trained methods isn't proof of autonomous learning
without replication; other sources of bias remain.

### Preserved / intentionally unchanged

- No hand-drawn reference library reintroduced.
- Landscape and lettering disciplines still separate.
- Existing private personal vote policies enforced, no new public personal data.
- Legacy experimental archive and previous artworks preserved.
- Stripe payment/print work untouched and live purchases not enabled.
- Mutations remain within a **finite, constrained grammar**; there is no
  invention of arbitrary new renderer algorithms or evidence of professional
  art quality yet.

## Local verification

```bash
node tests/studio-evolution.test.mjs
node tests/studio-vision.test.mjs
node tests/test_renderer.mjs
python tests/browser297_inline.py
python tests/browser297_mobile.py
```

The browser tests run against local, self-contained modules with Supabase
requests mocked offline (no customer records affected). The private database
migration and RLS permissions were verified independently on active Supabase.

A value like `IMAGE DISTANCE 0.15` is **not** 15% prettier, nor necessarily
15% pixel difference. It is a normalized score from the documented spatial
colour/luminance/edge descriptor. The user remains the judge of quality.
