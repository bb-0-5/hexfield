# Hexfield 302 — executable visual-law painter on BOTH surfaces

## What changed

The old model-backed **IMAGINE** mode remains accessible, but it is no longer the default.
The default is now **RULES**. It uses a locally executed constraint engine instead of asking
a general-purpose image model to merely *describe* adherence to a style.

The **experimental archive generator**, at `/legacy.html`, now applies **the same exact**
rule engine to the live `#view` field automatically when a new original is generated.
Its rule panel is `RULE ENGINE 302 · FORBID / REWORK`; open it to set laws and mark
systems, test other laws with an unchanged source, recursively repaint a result,
keep/reject methods and export the constrained PNG.

Crucially, the original archive canvas and its museum records remain untouched. The
new constrained image is a visible canvas overlay, **not an in-place change to the
old 2.6 MB app.js renderer**. This preserves the old research pipeline and old
museum. Its live rendered image is sampled and rebuilt with formal laws for display
and constrained export, and new children use the constrained pixels as their source.
This distinction should not be obscured.

## Implemented procedural constraints

- `no_curves`: all rendered marks are straight segments or rectangles, even
  in point mode (squares replace circular dots).
- `opposite_bend`: reflected coordinates displace with opposing horizontal
  signs, so mirrored paths no longer track as rigid straight-line counterparts.
- `blue_for_red`: red-dominant pixels are converted into a blue-dominant pigment
  *before mark rendering*, not just described in prose.
- `negative_space`: source foreground is estimated from its difference to a
  border colour reference. Marks are omitted from those regions: negative space
  receives the paint. This is a **colour-contrast proxy, not semantic segmentation**.
- `no_shading`: brightness is quantized into two explicit steps.
- `fractured_horizon`, `unclosed_forms`, `bright_shadow`, `warm_cool_swap`,
  `flatten_perspective`, `density_contrast`, `orientation_colour`:
  deterministic canvas transforms and mark omissions.
- Mark systems: short dashes, points, directional hatching, flat cutout quadrilaterals,
  dark-field carve-back.
- Rework systems: abstract masses, negative-space repaint, spatial misreading,
  remove-strongest-device. Every rework takes the **actual previous rendered pixels**
  as input. The recipe includes parent ID and generation depth.

These are simple mechanical exercises, not a semantic artist trained on images.
For example, the painter cannot robustly infer complex objects' negative spaces
from a busy photograph; it uses a deterministic contrast proxy instead.

## Browser workflow

On the homepage, pick subject, a primary constraint, optional secondary constraint,
mark system and rework. Use a simple locally generated reality anchor, an uploaded
image, a previous IMAGINE model image, or the Rule Studio's current result.
Then use PAINT, SAME SUBJECT/NEW LAW, SAME LAW/NEW SUBJECT or REABSTRACT/REPAINT.

The image-model reference is **optional**; all constraint execution, iterative
repainting, grading and exports work without cloud inference, quota, account,
Stripe, or a network connection once the page assets are cached.

KEEP/REJECT (and optionally a specific criticism) update one shared
origin-local `hexfield.rule-studio.memory.v1` model across the homepage and archive.
The sampler uses the feedback to adjust which subjects, laws and mark systems
are attempted when a control is set to Surprise. Feedback is **not**
fine-tuning or changing the cloud image model's weights.

## Verification

- `node --experimental-default-type=module tests/studio-rules.test.mjs` after
  installing `skia-canvas` tests red-to-blue substitution, square-dot no-curve
  enforcement, negative-space exclusion, procedural subject changes,
  recursive rework and rule-scoped preference memory.
- `tests/imagination-worker.test.mjs`, `studio-evolution.test.mjs`,
  `studio-vision.test.mjs` remain in the GitHub Actions suite.
- Live browser smoke test verifies painting and recursive rework in RULES,
  plus live `legacy.html` canvas output and child creation under chosen laws.

## Deliberate limitations

The historic archive's underlying search still produces its normal field
**before** the new pixel-constraint layer is applied; its old museum thumbnails,
print editions and metrics therefore describe the original field. A constrained
export is a different artifact, with its own KEEP/REJECT memory and lineage.
The HTML overlay preserves that distinction, avoiding accidental corruption of
the existing archive.
