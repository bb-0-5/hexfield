# HEXFIELD 311 — The Heredity of Visual Ideas

## Objective

In Build 310, a surviving motif retained the *same original pixels*.
Build 311 introduces a separate inheritance path: **extract an actual
image contour, retain its identity, and draw it again under new media,
colours, geometrical segmentation and formal constraints.**

The recurrent mark should be demonstrably derived from an earlier image.
Do not pretend that Hexfield can recognize semantic objects merely
because it can preserve a raster silhouette.

## Implemented structural genes

`public/studio/structural-heritage.js` samples a detailed region of the
real parent painting at 52×40 pixels, estimates the local background,
segments a dominant connected foreground region and traces a normalized
40-point contour. It detects up to two *enclosed* negative-space counters
and stores approximate circularity, aspect, position, material, trust
rating, original colour, age, stable ID and ancestral ID.

A gene is **not an image file**: it contains geometry, topology, colour
and reproduction metadata. Its visual contour is an actual, inspectable
approximation of painted pixels, not a label hallucinated by a text
model.

The visual extraction is intentionally heuristic. A complex texture may
be interpreted as a shape, and some images produce no suitable gene;
the earlier physical pixel-memory remains available as a fallback.

## New generations reconstruct the inherited shape

Each independent geometric idea can be drawn with:
- an outline;
- simplified straight-edged facets;
- discrete dots (squares under the no-curves law);
- hatching clipped inside the contour;
- a negative-space cutout in a local neutral frame; or
- radiating strokes inside the same silhouette.

A previous red contour may thus become blue, then a polygon, then the
opening of a negative-space field without changing its lineage ID.
Counters remain encoded separately. The renderer changes the actual
pixels; it does not simply replace a method string.

Formal laws remain authoritative for new marks where implemented.
As in Build 310, retained physical pixel islands intentionally preserve
older paint and are not claimed to follow newly introduced laws.

The engine keeps **at most two geometric identities** in an active
recursive loop, with a maximum lifespan of 16 accepted generations.
Distinct new geometries may enter around every fourth generation.
Inheritance is bounded; it cannot permanently occupy the whole canvas.

## Negotiating visual objectives

Every candidate is a real rendered image. Candidate selection now
balances three experimental objectives:

- **W / Non-redundancy:** new visual properties relative to earlier work.
- **φ / Harmony:** the already measured golden geometry, pigment ratios,
  and their spatial interaction.
- **H / Heritage:** retained geometric identity, executed change in
  rendering material, and measured visibility relative to the canvas
  *before* reconstruction.

The present experimental weighted score is **41% W + 29% φ + 30% H**,
with an explicit penalty for near-duplicate paintings. A user-selected
STRICT golden mode still prioritizes candidates that actually qualify.
These coefficients are artist-configured heuristics, not scientifically
validated estimates of aesthetic worth.

## Human feedback develops limited habits

The KEEP / REJECT buttons in RULES and in the historical experimental
archive update trust in the current geometric ancestors. They also
store small bounded browser-local preferences for named material
techniques and shape categories. A favoured material can recur
occasionally without suppressing the exploration of other methods
or overriding a user's explicitly locked formal rule.

This is an experimental **preference history**, not autonomous
consciousness or true semantic understanding.

## Animation is the artistic performance

RULES now animates **the original painting, preserved pixel islands,
the inherited contours as geometric paths, executed construction marks,
and the accepted painting**. The last stage presents the actual
W / φ / H scores. The creative animation remains a temporary overlay:
it cannot alter final artwork, PNG exports or Australian print referrals.

A new **SURVIVING IDEAS** genealogy panel renders the sampled outline,
its stable generation number, current medium and age. There are no
new configuration knobs.

## Tests

`tests/structural-heritage.test.mjs` validates actual-source contour and
hole extraction, stable ancestry across four materially different
renderers, visible canvas pixel changes, seven inheriting generations,
bounded idea counts and feedback-driven genealogy preferences, as well
as the three-way selector and strict-φ precedence.

Existing multi-generation abstraction and print/export tests continue
to run in GitHub Actions. No paid model requests, new company accounts,
or new payments infrastructure are required.

## Limitations and next research

This first structural extractor represents silhouettes as star-shaped
radial approximations, not full topology-preserving vectorization of
arbitrary shapes; concavities and winding may be simplified. The
displayed lineage proves which extracted contour was reused, not that
an artist would regard every transformation as preserving the *same
concept*. More sophisticated contour tracking and user-driven identity
labels could follow after this baseline is evaluated.
