# Shape-carved lettering

The main studio now defaults to letters cut through overlapping shapes.
Enter up to 24 letters, digits, and spaces; choose a block, rounded, or
condensed template. **Show uncut stack** compares the same material without
the subtraction. **CHANGE SEED** supplies a new composition and new cuts.

`public/letter-carving.js` creates a transparent material layer from the
current field's harvested silhouettes, preserving their pigment. Material
coverage, mass distribution, and colour seams constrain letter placement,
shear, and stroke contours. A protected stroke core and bounded outer
template preserve recognizable letters and counters. The renderer removes
material with `destination-out`; it does not paint lettering over the stack.

The main renderer holds the source stack independently from the word and
template. The visible canvas, source comparison, and PNG export replay that
held stack and cut plan at their requested sizes. This snapshot lasts for the
current page; it is not a new durable reconstruction format for old archive
recipes. Kept image pixels and PNG files retain the finished result.

Inspection hooks are at `window.__hexfield.carving`. Geometry tests cover
determinism, actual source-only alpha subtraction, counters, connected stroke
cores, template changes, and different constraints from different stacks:

```sh
node tests/letter-carving.test.mjs
```

Like the existing canvas tests, this uses `skia-canvas@3.0.8`; the GitHub
workflow installs it. Browser verification also covers the actual harvested
source path, text/template/source controls, reseeding, mobile layout, and PNG
export parity.

Hosting uses the existing `hexfield` Worker with static assets and the AI
binding. `/api/*` explicitly runs through the Worker. The shared Supabase
database remains intact. The separately deleted legacy curator Worker has no
recoverable source in this repository; shared curator submissions and its
live top-ten endpoint remain unavailable. The existing Supabase museum
batch service is separate and remains deployed.
