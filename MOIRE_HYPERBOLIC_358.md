# Builds 358–360 plan: moiré on half of an inverted hyperbolic plane, and a painter that learns

The old painter (solid shapes, plants, characters and words in a room) is retired
from the homepage. It is kept, unchanged, at `/studies.html`. The site stays
offline while this is built: hexfield.org shows only `offline/index.html`.

## What it paints

The subject is always the same kind of thing, and never the same picture.

- **The surface.** Half (a 180° slice) of the hyperbolic plane, turned upside down
  or inside out, standing in space. Four candidates are built in the prototype:
  - **dome**: the hyperboloid model upside down;
  - **bell**: the pseudosphere, rim up and spike down;
  - **saddle**: a saddle turned over, carrying the Poincaré disk;
  - **arch**: the Poincaré disk turned inside out (inverted in its rim), with its
    upper half standing as an arch.
- **The camera.** Three-point perspective. The camera is raised or lowered and
  tilted, so verticals meet at a third point above or below the picture.
- **The gratings.** These are drawn in the plane's own geometry, not laid on like wallpaper.
  - **Horocycles** are the hyperbolic plane's straight waves: rings round a point at
    infinity, evenly spaced however far out they go. A painting uses two or three
    families of them, turned from each other by the golden angle and spaced in
    irrational ratios (√2, φ, √3, e or π over its nearest fraction), so they never
    line up again.
  - **Trajectories** are bundles of geodesics. Each is turned the golden angle from
    the last and drifted out by an irrational step, the way a path that never closes
    lays itself down.
- **The moiré.** The gratings overlap. Perspective foreshortens them, the plane's
  exponential growth crowds them, and in places they fall finer than the pixels.
  Where all that happens, they beat. **The beats are the subject.**

## How it paints it: reinterpreting, not copying

1. **Raw.** The gratings are rendered on the surface with one sample per pixel. The
   artifacts are wanted.
2. **Read.** It reads the moiré as an eye does: the lines are blurred away and the
   beats (bands, rings, knots) are kept.
3. **Paint.** Strokes are laid along the bands, from big to small. Each stroke is
   coloured by how crowded the lines are where it lies, and lit as the surface is lit.
   The lines themselves are never drawn.

The prototype is `public/moire/moire.js`. The homepage runs it through
`public/moire/page.js`, which has nothing to press.

## What stays fixed: its style

Every painting keeps the same:
- surface family;
- camera rule;
- palette family (paper, slate, ink and one vermilion);
- stroke vocabulary.

What changes from painting to painting is only what the mathematics produces. The old
painter did the reverse: it re-rolled its style every painting and kept the same
subject.

## How it learns, without buttons

**Why the old one didn't learn.**
- It learned mostly from its own accuracy: how close the canvas came to what it
  meant. That can make a painter more correct, but never more interesting.
- Votes were rare and spread over dozens of knobs.
- Everything it learned stayed in one browser's local storage.

**What it learns.** Each painting has one small genome of about 12 numbers:
- surface;
- camera tilt and turn;
- number of gratings, their directions and spacing ratios, and the line width;
- how the gratings overlap;
- how much the reading blurs;
- stroke sizes;
- where in the palette the painting sits.

**Its own eye.** Every painting is scored on what this idea needs:
- **Legible beats:** strong, slow bands, not noise.
- **Structure:** not empty and not static.
- **Composition:** where the bands mass in the frame.
- **Novelty:** how different it is from what the archive already holds.

**Memory.** An archive of niches (for example surface × beat size × darkness) keeps
the best painting found in each niche.
- Most new paintings are a small change to a good one; some are fresh tries.
- It gets better inside each niche and stays varied across them.
- This is a quality-diversity archive (MAP-Elites).

**Your taste, still without buttons.**
- **While offline:** sheets like the earlier 20. You name the numbers you like, and
  your picks count for far more than its own score.
- **Once online again:**
  - how long people stay on a painting is a weak signal;
  - the archive is shared between visitors, not kept per browser.

**Proof that it learns.** An offline run of a few hundred generations, with two
outputs:
- its score against random genomes, as a curve;
- a before-and-after sheet: 20 random paintings against 20 from the archive.

If it doesn't beat random, it isn't learning, and that build doesn't ship.

## Builds

- **358:**
  - the prototype engine;
  - the buttonless homepage (the old painter is kept at `/studies.html`);
  - this plan.
- **359: the painter proper, and it learns.** Answers to the open questions: all
  four surfaces, and both gratings and trajectories.
  - **Trajectories:** billiard paths in circles of the plane, turned an irrational
    angle at every bounce, alone or crossed with rings.
  - **Painting:**
    - reading at two scales;
    - marks with bristles;
    - the silhouette kept by a mask, with paint straying past it;
    - a painted ground;
    - framing and colour as genes;
    - on a tall screen, a wide surface may run off the sides.
  - **Learning (`learn.js`):** the 25-number genome, its own eye, and the archive
    (up to 108 kinds).
  - **Starting memory (`archive.json`):** three learning runs merged, 76 kinds.
  - **On the homepage:** it judges every painting and goes on learning in each browser.
  - **Proof (`tools/moire-learn.mjs`):** 600 paintings a run at 320×240, on seeds
    never used for tuning.

    | seed | best ten: random → learned | whole archive: random → learned |
    |---|---|---|
    | 1 | 0.969 → 0.977 | 50.2 → 50.1 |
    | 2 | 0.953 → 0.987 | 49.2 → 55.4 |
    | 3 | 0.962 → 0.975 | 46.1 → 46.3 |

    What it paints next, from what it learned, averages 0.85, against 0.57–0.59 for
    random tries. Between 74% and 82% of its next paintings score 0.75 or more,
    against 18–20% of random tries.
  - **The result:** its best paintings beat random every time. Its whole archive
    comes out about even with random at this budget.
  - **CI:** `tests/moire-learning.test.mjs` checks four things:
    - the geometry;
    - the genomes;
    - its eye;
    - that its best paintings and its next paintings beat random tries.
- **360: sims that act on each other.** Each painting runs two or three sims at once:
  - rings;
  - billiard paths;
  - ripples, which are new: circles spreading from a point of the plane.

  Each sim's beats move the other sims' lines: where one crowds, another's lines
  slide over. How strongly each pushes each other one, and which way, is part of the
  genome (40 numbers), so it learns which interactions make good paintings.
  - **How it runs:** the interaction is worked out on a small picture over three
    rounds back and forth, then the full picture is drawn with the moved lines.
    Uncoupled, the sims come out exactly as they are apart.
  - **Kinds:** surface × which sims × how many bands (84).
  - **Starting memory (`archive.json`):** three learning runs merged, 74 kinds,
    covering all seven mixes of sims.
  - **Proof:** 600 paintings a run, on untuned seeds.

    | seed | best ten: random → learned | whole archive: random → learned |
    |---|---|---|
    | 1 | 0.933 → 0.986 | 50.1 → 47.0 |
    | 2 | 0.954 → 0.985 | 51.6 → 50.0 |
    | 3 | 0.947 → 0.981 | 49.2 → 48.2 |

    What it paints next averages 0.82–0.83, against 0.59–0.60 for random tries.
    Two thirds of its next paintings score 0.75 or more, against 17–18% of random
    tries.
  - **The result:** with more numbers to learn, its best paintings beat random by
    more than before, but random tries now find more kinds of picture across the
    whole archive.
  - **The test** (`tests/moire-learning.test.mjs`) also checks:
    - uncoupled sims come out unchanged;
    - coupled sims move each other's lines;
    - ripples are evenly spaced;
    - what the homepage paints next, from the shipped memory, clearly beats random
      tries.
- **Next: your picks.** Sheets of what it learned; the numbers you name go into the
  archive as picks, which it breeds from more often.
- **Back online, only when you say so:** shared archive and the dwell signal.

## Questions answered

1. Which surface? All four: dome, bell, saddle and arch.
2. Gratings or trajectories? Both, and a mix of the two.

Which of them it paints, and how, is what it learns.
