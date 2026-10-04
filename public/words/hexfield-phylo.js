/* Where on the tree of life a grown thing stands.
 * ---------------------------------------------------------------------------
 *
 * Grown things (hexfield-morph.js for creatures, hexfield-flora.js for
 * plants) have no names: they are rules. This file names them anyway, by
 * the tree biology already drew - which body plan came out of which, in
 * order - so a body that grows a tail on a single cell is a collared cell,
 * and one that grows a backbone, four legs, fur, ears and a tail is in the
 * cat family. Each clade has a test on what the body has (its traits), and
 * a body belongs to the deepest clade whose test it passes, walking down
 * from the first cell.
 *
 * The tree is also the order things may happen in. A child may move only a
 * short way on it from its parent (`allowed`): up a step or two, across to
 * a near relative, but never from a fern straight to a rose, nor a fish
 * straight to a cat. So a population climbs the tree the way life did.
 *
 * It is a simplification: a few dozen clades, chosen so each one is a body
 * plan these genomes can draw, and the tests read drawn traits (legs, a
 * head, fur, flower parts), not ancestry. A body is filed where it looks
 * like it belongs.
 */
(function (global) {
  "use strict";

  /* What a genome's body has, in terms the tree tests. */
  function traits(g) {
    if (!g) return null;
    if (g.kind === "plant") {
      const L = g.leaf || {}, F = g.flower || {}, B = g.branching || {};
      return {
        kind: "plant", vascular: !!g.vascular, filament: Number(g.filament) || 0, leaf: L.type || "none",
        lobes: Number(L.lobes) || 0, serrate: !!L.serrate, leaflets: Number(L.leaflets) || 0, wood: Number(g.wood) || 0,
        repro: g.repro || "spores", petals: Number(F.petals) || 5, flowerSize: Number(F.size) || 0, composite: !!F.composite,
        bilateral: !!F.bilateral, umbel: !!F.umbel, set: B.set || "alternate",
      };
    }
    // A body built on bones (hexfield-morph.js, the skeleton): read from them.
    if (g.spine?.on) {
      const S = g.spine, pairs = Math.max(0, Math.min(2, Math.round(S.pairs || 0)));
      const wings = !S.swim && pairs >= 2 && Boolean(S.wings);
      // Fins are not legs; a front pair that is wings leaves the hind legs.
      const legs = S.swim ? 0 : wings ? 2 : pairs * 2;
      return {
        kind: "creature", sym: "mirror", legs, radialN: 0, limbPrime: "line", limbsDown: true, fork: 0,
        head: true, eyes: 2, ears: Math.round(S.ears || 0), tail: (S.tail || 0) > 0, spikes: 0, segs: 1, upright: (S.posture || 0) > 0.9,
        nest: 0, loop: false, texture: g.surface?.texture || null, sky: wings && g.anchor === "sky", backbone: true, wings, fins: Boolean(S.swim),
      };
    }
    const limbs = g.limbs || {}, head = g.head || {}, sym = g.symmetry || "none", n = Math.max(0, Math.min(8, limbs.n || 0));
    // Legs as drawn: mirror grows pairs, radial grows round the body.
    const legs = sym === "mirror" ? Math.ceil(n / 2) * 2 : sym === "radial" ? (n ? Math.max(n, g.radialN || 0) : 0) : n;
    return {
      kind: "creature", sym, legs, radialN: g.radialN || 0, limbPrime: limbs.prime || "line", limbsDown: !!limbs.down, fork: limbs.depth || 0,
      head: !!head.on, eyes: head.on ? Math.max(0, head.eyes || 0) : 0, ears: head.on ? (head.points?.n || 0) : 0,
      tail: !!g.tail?.on, spikes: g.points?.n || 0, segs: Math.max(1, g.segments?.n || 1), upright: !!g.segments?.vertical,
      nest: g.nest?.depth || 0, loop: g.body?.prime === "loop", texture: g.surface?.texture || null, sky: g.anchor === "sky",
    };
  }

  // A creature with nothing but a body: no limbs, head, tail, spikes,
  // segments, nesting, hole or symmetry - the first cell.
  const plain = (t) => !t.legs && !t.head && !t.tail && !t.spikes && t.segs === 1 && !t.nest && !t.loop && t.sym === "none";
  const tailOnly = (t) => t.tail && !t.legs && !t.head && !t.spikes && t.segs === 1 && !t.nest && !t.loop && t.sym === "none";
  const fiveFold = (t) => (t.legs ? t.legs : t.radialN) === 5;

  /* The tree. Each clade: its parent, its scientific name, a common name
   * for a body that stops there, a single word for it (what typing paints),
   * and its test - which assumes the parent's passed. Children are tried in
   * order; the first that passes is gone down. */
  const CLADES = [
    ["life", null, "Eukaryota", "first cell", "protist", () => true],
    // Animals
    ["choanozoa", "life", "Choanozoa", "collared cell", "choanoflagellate", (t) => t.kind === "creature" && !plain(t)],
    ["metazoa", "choanozoa", "Metazoa", "animal", null, (t) => !tailOnly(t)],
    ["porifera", "metazoa", "Porifera", "sponge", "sponge", (t) => !t.head && !t.legs && t.sym === "none"],
    ["cnidaria", "metazoa", "Cnidaria", "polyp", "polyp", (t) => t.sym === "radial" && !t.head && !fiveFold(t)],
    ["scyphozoa", "cnidaria", "Scyphozoa", "jellyfish", "jellyfish", (t) => t.legs > 0 && t.limbsDown],
    ["anthozoa", "cnidaria", "Anthozoa", "sea anemone", "anemone", (t) => t.legs > 0],
    ["bilateria", "metazoa", "Bilateria", "bilateral animal", null, () => true],
    ["echinodermata", "bilateria", "Echinodermata", "echinoderm", "echinoderm", (t) => t.sym === "radial" && fiveFold(t)],
    ["asteroidea", "echinodermata", "Asteroidea", "starfish", "starfish", (t) => t.legs > 0],
    ["echinoidea", "echinodermata", "Echinoidea", "sea urchin", "urchin", (t) => t.spikes > 0],
    ["arthropoda", "bilateria", "Arthropoda", "arthropod", "arthropod", (t) => t.legs >= 6 && t.segs >= 2 && t.limbPrime !== "mass"],
    ["insecta", "arthropoda", "Insecta", "insect", "insect", (t) => t.legs === 6],
    ["crustacea", "arthropoda", "Crustacea", "crustacean", "crab", (t) => t.spikes > 0],
    ["arachnida", "arthropoda", "Arachnida", "spider", "spider", (t) => t.legs === 8],
    ["mollusca", "bilateria", "Mollusca", "mollusc", "mollusc", (t) => (t.legs >= 6 && t.limbPrime === "arc") || (t.head && !t.legs && !t.tail && (t.nest > 0 || t.loop || t.ears > 0))],
    ["cephalopoda", "mollusca", "Cephalopoda", "octopus", "octopus", (t) => t.legs >= 6],
    ["gastropoda", "mollusca", "Gastropoda", "snail", "snail", (t) => t.nest > 0 || t.loop],
    ["vertebrata", "bilateria", "Vertebrata", "vertebrate", "vertebrate", (t) => t.backbone || (t.head && t.eyes > 0 && t.sym !== "radial" && t.legs <= 4 && t.segs <= 3 && (t.tail || t.legs >= 2))],
    ["actinopterygii", "vertebrata", "Actinopterygii", "fish", "fish", (t) => !t.legs && t.tail],
    ["tetrapoda", "vertebrata", "Tetrapoda", "tetrapod", null, (t) => t.legs >= 2],
    ["amniota", "tetrapoda", "Amniota", "amniote", null, (t) => t.texture === "fur" || t.texture === "scales" || t.ears > 0 || t.wings],
    ["mammalia", "amniota", "Mammalia", "mammal", "mammal", (t) => t.texture === "fur" || t.ears > 0],
    ["felidae", "mammalia", "Felidae", "cat family", "cat", (t) => t.tail && t.legs >= 4 && t.ears > 0 && !t.upright],
    ["hominidae", "mammalia", "Hominidae", "great ape", "ape", (t) => t.upright && !t.tail && t.legs === 4 && t.segs <= 2],
    ["reptilia", "amniota", "Reptilia", "reptile", "reptile", () => true],
    ["aves", "reptilia", "Aves", "bird", "bird", (t) => t.wings || t.legs === 2 || t.sky],
    ["amphibia", "tetrapoda", "Amphibia", "amphibian", "frog", () => true],
    ["annelida", "bilateria", "Annelida", "segmented worm", "worm", (t) => !t.legs && t.segs >= 3 && !t.upright],
    ["platyhelminthes", "bilateria", "Platyhelminthes", "flatworm", "flatworm", (t) => !t.legs && !t.head && t.segs === 1],
    // Plants
    ["viridiplantae", "life", "Viridiplantae", "green cell", "chlamydomonas", (t) => t.kind === "plant"],
    ["streptophyta", "viridiplantae", "Streptophyta", "green algae", "algae", (t) => t.filament > 0 || t.leaf !== "none" || t.vascular],
    ["embryophyta", "streptophyta", "Embryophyta", "land plant", null, (t) => t.leaf !== "none" || t.vascular],
    ["bryophyta", "embryophyta", "Bryophyta", "moss", "moss", (t) => !t.vascular],
    ["tracheophyta", "embryophyta", "Tracheophyta", "vascular plant", null, () => true],
    ["spermatophyta", "tracheophyta", "Spermatophyta", "seed plant", null, (t) => t.repro !== "spores"],
    ["angiospermae", "spermatophyta", "Angiospermae", "flowering plant", "waterlily", (t) => t.repro === "flowers"],
    ["monocots", "angiospermae", "Monocotyledons", "monocot", null, (t) => t.leaf === "blade"],
    ["poaceae", "monocots", "Poaceae", "grass", "grass", (t) => t.flowerSize < 0.18],
    ["orchidaceae", "monocots", "Orchidaceae", "orchid", "orchid", (t) => t.bilateral],
    ["liliaceae", "monocots", "Liliaceae", "lily", "lily", () => true],
    ["magnoliids", "angiospermae", "Magnoliids", "magnolia", "magnolia", (t) => t.wood > 0.4 && t.petals >= 7 && !t.composite && t.leaf === "broad" && !t.serrate && !t.lobes],
    ["eudicots", "angiospermae", "Eudicots", "eudicot", "eudicot", (t) => t.leaf === "broad" || t.leaf === "none" || t.composite || t.umbel || t.bilateral || t.petals === 4 || t.petals === 5],
    ["cactaceae", "eudicots", "Cactaceae", "cactus", "cactus", (t) => t.leaf === "none"],
    ["asteraceae", "eudicots", "Asteraceae", "daisy family", "daisy", (t) => t.composite],
    ["apiaceae", "eudicots", "Apiaceae", "carrot family", "fennel", (t) => t.umbel],
    ["fabaceae", "eudicots", "Fabaceae", "pea family", "pea", (t) => t.bilateral && t.leaflets > 0.3],
    ["lamiaceae", "eudicots", "Lamiaceae", "mint family", "mint", (t) => t.bilateral && t.set === "opposite"],
    ["brassicaceae", "eudicots", "Brassicaceae", "mustard family", "mustard", (t) => t.petals === 4],
    ["fagaceae", "eudicots", "Fagaceae", "oak family", "oak", (t) => t.wood > 0.5 && t.lobes > 0],
    ["rosaceae", "eudicots", "Rosaceae", "rose family", "rose", (t) => t.petals === 5 && t.serrate],
    ["pinophyta", "spermatophyta", "Pinophyta", "conifer", null, (t) => t.repro === "cones" && (t.leaf === "needle" || t.leaf === "scale")],
    ["pinaceae", "pinophyta", "Pinaceae", "pine family", "pine", (t) => t.leaf === "needle"],
    ["cupressaceae", "pinophyta", "Cupressaceae", "cypress family", "cypress", () => true],
    ["ginkgo", "spermatophyta", "Ginkgophyta", "ginkgo", "ginkgo", (t) => t.repro === "cones" && t.leaf === "fan"],
    ["cycadophyta", "spermatophyta", "Cycadophyta", "cycad", "cycad", () => true],
    ["lycopodiophyta", "tracheophyta", "Lycopodiophyta", "club moss", "clubmoss", (t) => t.leaf === "scale" || t.leaf === "needle" || t.leaf === "none"],
    ["polypodiopsida", "tracheophyta", "Polypodiopsida", "fern", "fern", () => true],
  ];
  // What a body that stops at an inner clade is called, when that differs
  // from the clade's own name: a flowering plant in none of the big groups
  // is one of the early kinds (water lilies and the like).
  const ALONE = { angiospermae: "early flowering plant", bilateria: "bilateral animal", life: "first cell" };
  const NODES = {};
  for (const [id, parent, latin, name, word, test] of CLADES) NODES[id] = { id, parent, latin, name, word, test, children: [], depth: 0, alone: ALONE[id] || name };
  for (const node of Object.values(NODES)) if (node.parent) { NODES[node.parent].children.push(node); node.depth = NODES[node.parent].depth + 1; }

  /* The clade a genome belongs to: the path from the first cell down to the
   * deepest clade whose test it passes. */
  function classify(genome) {
    const t = traits(genome);
    const path = [NODES.life];
    if (!t) return { node: NODES.life, path, traits: t };
    for (;;) {
      const at = path[path.length - 1];
      const next = at.children.find((c) => { try { return c.test(t); } catch { return false; } });
      if (!next) break;
      path.push(next);
    }
    return { node: path[path.length - 1], path, traits: t };
  }

  /* Steps on the tree between two clades: up to their common ancestor and down. */
  function steps(a, b) {
    const up = new Map();
    for (let n = a, d = 0; n; n = NODES[n.parent], d++) up.set(n.id, d);
    for (let n = b, d = 0; n; n = NODES[n.parent], d++) if (up.has(n.id)) return up.get(n.id) + d;
    return Infinity;
  }

  /* May a child be born so far from its parent? A few steps across the tree
   * and at most two deeper - so new body plans come in their order. */
  const REACH = { steps: 3, deeper: 2 };
  function allowed(parent, child) {
    const a = classify(parent).node, b = classify(child).node;
    return steps(a, b) <= REACH.steps && b.depth - a.depth <= REACH.deeper;
  }

  /* For the readout: "first cell › collared cell › …", in common names
   * where a clade has one people say, its Latin otherwise. */
  function label(genome) {
    const { node, path } = classify(genome);
    return { name: node.alone, latin: node.latin, word: node.word, id: node.id, depth: node.depth,
      path: path.map((n) => n.name), latinPath: path.map((n) => n.latin) };
  }

  global.HexfieldPhylo = { traits, classify, steps, allowed, label, NODES, REACH };
})(typeof window !== "undefined" ? window : globalThis);
