# Builds 358–362 plan: moiré on half of an inverted hyperbolic plane, and a painter that learns

The old painter (solid shapes, plants, characters and words in a room) is retired
from the homepage. It is kept, unchanged, at `/studies.html`. The site was
offline while 358 and 359 were built; it has been back online since 360.

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
- **361: sims that act on each other more, and a painting that never stops.**
  - **Pushes:** stronger (up to ±2.5, the strongest at least 1). They land three
    ways: lines moved across, lines swollen or thinned, or both. Each painting gets
    3–6 rounds back and forth. All of this is in the genome (42 numbers).
  - **Its eye rewards interplay:** how much the sims change each other's bands from
    what each would make alone. That is now a quarter of the score.
  - **Measured on what the homepage paints next:** the interaction changes the
    painted bands by 0.212 on average, against 0.167 in build 360 (+27%).
  - **Proof:** 600 paintings a run, on untuned seeds. Its best ten beat random on
    all three seeds (0.976, 0.990 and 0.969 against 0.935, 0.949 and 0.956). Its
    whole archive beats random on two of three. What it paints next averages
    0.82–0.84, against 0.58–0.60 for random tries.
  - **Never stops:**
    - A composition is painted, then glazed over six times. Each glaze is the best
      of five drifted versions: same surface, view, framing and colours, its sims
      and their pushes changed a little.
    - Then a new composition fades in over the old one.
    - Any error starts a new painting 1.5 s later.
    - A watchdog restarts it if no paint has landed for 30 s on screen.
    - While the page is hidden, it goes on having ideas and learning from them.
- **362: one memory for every visitor's browser.**
  - **What goes in:** each browser's new bests. A find is its kind, its 42 genes and
    the score its own eye gave it. Finds go to `/api/moire/finds` one at a time, at
    least 15 s apart.
  - **What is kept** (Cloudflare D1, `hexfield-moire`; schema in
    `migrations/0001_moire_finds.sql`): per kind, the six best claimed and the six
    newest. A false claim can hold a place among the best, but it can't stop new
    finds coming through.
  - **What comes back:** per kind, the two best and the two newest, most promising
    first. A browser fetches them when it opens, then every ten minutes.
  - **Trust:** a claimed score is only a hint.
    - Each browser judges every shared find with its own eye, at the size every
      browser judges at (320×240).
    - It keeps a find only if it is the best of its kind there.
    - It does this in the rests between stages, when nothing is moving, so the
      painting never waits on it.
  - **What you see:** every other new composition is the best shared find this
    browser has confirmed. The ones in between are its own ideas.
  - **Guarded:**
    - finds are taken only from the site's own pages;
    - they must be well formed: this genome version, a real kind, 42 genes in [0, 1),
      at most 4 KB;
    - at most 20 a minute from one address;
    - what goes out is kept at the edge for a minute, so many browsers asking cost
      one read.
  - **Checked:**
    - `tests/moire-shared.test.mjs` runs the Worker against real SQLite made from the
      same schema.
    - Two browsers ran against the site locally (`wrangler dev`, local D1). The first,
      starting with no memory, sent its finds. The second, also starting empty,
      fetched them, checked them, kept them, and painted one as its second
      composition.
  - **Does sharing help?** `tools/moire-share.mjs` plays the homepage's loop at the
    level of ideas.
    - **Setup:** visitors arrive one after another. Each is a fresh browser that
      starts from the shipped archive and stays for 21 stages (three compositions and
      their glazes, about five minutes). Each visit is run twice: with the shared
      memory and alone.
    - **Results,** on two seeds, for the ten visitors after the first:

      | | alone | shared |
      |---|---|---|
      | what they were shown (judged score of every stage painted) | 0.908 | 0.945 |
      | archive when they left (summed over 73 kinds) | 64.55 | 64.64 |

      What they were shown was higher for 9 of the 10 and the same for one. Their
      archive was better for 8 of the 10.
    - **The archive gain is small.** In a five-minute visit a browser rarely beats the
      shipped archive: its kinds average 0.88, and half of them are above 0.9. So the
      memory fills slowly, and it grows with every visitor and every tab left open.
- **Next: your picks.** Sheets of what it learned; the numbers you name go into the
  archive as picks, which it breeds from more often.
- **Then:** the dwell signal (how long people stay on a painting).

## Questions answered

1. Which surface? All four: dome, bell, saddle and arch.
2. Gratings or trajectories? Both, and a mix of the two.

Which of them it paints, and how, is what it learns.
