# Hexfield 314 — invented mark procedures and one shared canvas

## Intended interaction

The main RULES/CANVAS workspace is the composite surface. Its essential actions are **Paint**, **Keep Abstracting**, **Pause**, **KEEP**, and **REJECT**. The adjacent word field accepts optional text and redraws the *current production canvas* with typography whose ink is constructed by the same rule-based mark engine as the painting. Advanced laws, manual font anatomy, terrain settings and additional simulators remain accessible but collapsed.

The historical experimental engine opens inside the main page and is unloaded when the dock is closed, avoiding a hidden second CPU-intensive painter. Its actual completed fields, including ruled reworks, publish a bounded browser-local reference for the Rule Studio. Press **USE EXPERIMENTAL FRAME AS REFERENCE** to begin a new canvas from the latest experimental work; continuous abstraction subsequently also mixes that source with terrain, lettering, other available sources and retained canvas fragments.

## How the artist now creates a drawing procedure

`public/studio/mark-program.js` is an executable, deterministic program genome:

- Two distinct existing mark gestures form the parent ink vocabulary.
- One to three actual spatial operators derive the deposited primitives: **branch, interrupt, echo, facet, scatter, twist, pressure**.
- A routine can *inherit*, *mutate*, or *cross two parents' mark grammars*. An accepted program becomes the candidate's procedural ancestor.
- Each mark program has a stable root/parent ID and bounded size. Only four KEEP-approved programs can be stored in browser localStorage. REJECT removes that lineage from the tiny stored repertoire.
- The renderer evaluates real finished pixels and uses existing W / φ / H metrics. Invented marks obey a strict `no_curves` law and contribute executed vector geometry to the process-theatre animation.

The human vote memory automatically prefers successful mark applications. Disliked behaviours are not banned; hybrid painter regions bias toward alternative marks, while negative votes encourage small inherited program mutations.

## How words belong to the artwork

`public/studio/word-surface.js` constructs a word occupancy mask on a scratch canvas, uses actual canvas salience to choose an open region, derives segmented glyph geometry from the current seed, and deposits marks/pigments sampled from the current Rule Studio artwork. The finished words and picture coexist in the **same actual canvas**. Word input can be changed without starting an independent logo generation screen; words are included in candidate W/φ/H evaluation before the best frame is accepted. Temporary scratch canvases are necessary rendering buffers, not a separate off-canvas art workflow.

The optional older LOGOS/anatomy editor is retained for inspection and backwards compatibility, but is not required for drawing text.

## Archive defects fixed

- The historic page's 12-second build check previously called `location.replace` whenever its stale version badge was less than the current deployment marker. It no longer reloads a running painting; it reports an update for the next visit.
- `reseedNow.addEventListener('click', changeSeed)` previously passed the truthy MouseEvent to `changeSeed(auto=false)`, accidentally treating the human click as an automatic reseed. The new event wrapper explicitly passes `false`, restoring the fast user-requested seed branch.
- The legacy archive badge is brought up to Build 314.

## Verification

GitHub Actions covers the original Rule Studio and printed-image safety checks, the 313 mark systems and between-frame derivation, new 314 program heredity and 24 actual ink generations, real in-canvas word painting, and source-level regression guards for historic page reload / manual reseed.

## Boundaries

This remains browser-local procedural art with heuristic compositional choices and bounded memory; it is **not** semantic object tracking, autonomous authorship validation, or a universal theory of beauty. Experimental frames are transferred as same-origin local references, not synchronized across devices. Legacy experiments are embedded and exchanged with the shared canvas rather than completely re-engineered into one synchronous simulation runtime. No new paid AI requests, checkout account, or new required user configuration was introduced.
