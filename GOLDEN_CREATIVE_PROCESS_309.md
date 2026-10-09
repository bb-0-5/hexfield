# HEXFIELD 309 — Golden Taste as a Creative Constraint

**Goal:** the painter should *make* and *show* variants under strict, inspectable
proportional rules, not merely publish a numerical judgement about images.

## Two constraint families, plus their two-way interaction

- **G / Geometry:** the proportion of structural ink on either side of
  golden dividers (0.618 / 0.382), occupied area and shape aspect.
- **C / Colour:** pigment distribution along the same dividers, hue-family
  dominance, dominant pigment share, and the *measured* hue separation
  relative to the golden angle (137.507764°).
- **X / Relationship:** the colour-on-shape effect and the reciprocal
  shape-on-colour effect are each measured by shifting one spatial field
  while holding the other constant. A local `interaction.effect` reports
  their signed average; the coupling score is a different bounded objective.

The current adjustable evaluation uses these explicit thresholds:

| Domain | Minimum score |
|---|---:|
| G / geometric | 0.54 |
| C / pigment | 0.50 |
| X / coupling | 0.53 |
| Combined | 0.57 |

**A painting is φ-qualified only if all four pass.** None of this claims to
scientifically or universally define beauty. The 0.54–0.57 thresholds and
Gaussian tolerances are experimental settings. A high score may reflect
mathematical convenience rather than a human-preferred image; KEEP/REJECT
remains the final creative judgement.

## Executed φ reworks

The **φ SEEK / IMPROVE GEOMETRY × COLOUR** action is visible next to the
procedural painting controls. The full φ panel gives STRICT / GUIDE / OBSERVE
modes (persistent per browser).

When clicked, HEXFIELD:
1. Inspects the existing canvas and diagnoses the most repairable failed
   independent constraint (geometry, colour or coupling).
2. Makes seed-derived alternatives from the **current** procedure.
3. In **LOGOS**, changes executable letter layout, weight and accented
   segment proportions (0.618 / 0.382), while preserving the actual text,
   anatomy and user-selected glyph laws.
4. In **LANDSCAPES**, mutates the inherited terrain program's light,
   structure, surface and palette without removing hard visual laws.
5. Renders up to **five** full counterfactual previews on phones, **nine**
   on desktop, scoring their pixels before changing the visible artwork.
6. Ranks candidates using φ + global W novelty; STRICT prioritizes actual
   φ-qualified candidates.
7. Uses the existing process theatre to animate the *real rendered trials*,
   showing which ideas were rejected and the one adopted.
8. Reports measured **G/C/X changes from the parent**, both directional
   ablation changes, and an instruction for the remaining failed constraint.

This does not make repeated Cloudflare AI requests. Existing high-resolution
PNG, the Australian printer referral handoff, history and feedback continue
to use the selected final rendering program.

## Other renderers

RULES / continuous abstraction and the experimental archive already rank
candidate canvases using the same phi scoring alongside W non-redundancy;
the RULES interface also shows per-generation G/C/X changes and proposes
a specific correction. Their executable drawing laws stay in force.

## Limitations

- Image proportions are measured at a coarse sampling grid; exact underlying
  brush geometry remains higher resolution than the sample. Hue-family
  dominance uses 12 stable bins, but actual hue angle uses weighted mean hue
  within each bin rather than falsely reporting only 30° increments.
- Changing colour sometimes also affects inferred luminance boundaries;
  these are separate tests on the same RGB raster, not physically
  independent interventions on real-world geometry.
- No automatic guarantee that a qualifying image can be produced in
  five or nine trials. Failed strict searches are explicitly labelled
  *not yet φ-qualified* rather than promoted to beauty.
- φ is a constraint experiment, not a replacement for human aesthetic
  judgement. A good human choice can deliberately break golden ratios.

## Verification

`tests/golden-creative-process.test.mjs` verifies numeric targets,
separate G/C/X responses to geometry/pigment changes, reciprocal ablation,
strict qualification, accurate diagnoses, deterministic seed lineage,
real pixel differences across nine logo variants, preservation of named
glyph rules and safe native-font fallback. GitHub Actions tests run the
complete studio and original Worker security suite.

Live Chrome smoke testing additionally verifies changing a real wordmark
through φ SEEK, measuring the old/new scores and displaying actual selected
candidate history in the creative process theatre.
