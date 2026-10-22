/* Does it learn? The same number of paintings made two ways - every one a new
 * random try, or the archive's way (mostly small changes to the best it has
 * kept) - each judged by its own eye, on several seeds. Learning has to beat
 * random on both counts: the best paintings it keeps, and how good the archive
 * is across every kind of picture. Writes the archive the homepage starts from.
 *
 *   node tools/moire-learn.mjs [--evals 600] [--seeds 3] [--size 320x240]
 *                              [--out public/moire/archive.json] [--report report.json] */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
await import(new URL("../public/moire/moire.js", import.meta.url).href);
await import(new URL("../public/moire/learn.js", import.meta.url).href);
const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn;

const arg = (name, fallback) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : fallback; };
const evals = Number(arg("evals", 600)), seeds = Number(arg("seeds", 3)), [W, H] = arg("size", "320x240").split("x").map(Number);
const WARM = Math.min(60, Math.floor(evals / 5)), seed0 = Number(arg("seed0", 1));
// (Settings for how it picks what to paint next, to try others: --next '{"rate":0.2}'.)
const NEXT = JSON.parse(arg("next", "{}"));
const mean = (xs) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

export function run(seed, n, w, h, learn) {
  const rng = M.mulberry32(seed), arc = L.archive(), curve = [];
  for (let i = 0; i < n; i++) {
    // (Both ways start alike: the same first random tries, then the archive's way takes over.)
    const genes = learn && i >= WARM ? L.next(arc, rng, NEXT) : L.randomGenes(rng);
    L.offer(arc, genes, L.evaluate(genes, w, h));
    if ((i + 1) % 50 === 0 || i === n - 1) curve.push({ made: i + 1, quality: +L.quality(arc).toFixed(3), top10: +mean(L.best(arc, 10).map((c) => c.score)).toFixed(4), kinds: Object.keys(arc.cells).length });
  }
  return { arc, curve };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = [], t0 = Date.now();
  let keep = null;
  for (let s = seed0; s < seed0 + seeds; s++) {
    const random = run(s * 7919, evals, W, H, false), learned = run(s * 7919, evals, W, H, true);
    const r = random.curve.at(-1), l = learned.curve.at(-1);
    rows.push({ seed: s, random: r, learned: l, randomCurve: random.curve, learnedCurve: learned.curve });
    console.log(`seed ${s}: random  quality ${r.quality.toFixed(2)} · best ten ${r.top10.toFixed(3)} · kinds ${r.kinds}`);
    console.log(`        learned quality ${l.quality.toFixed(2)} · best ten ${l.top10.toFixed(3)} · kinds ${l.kinds}`);
    if (!keep || l.quality > L.quality(keep)) keep = learned.arc;
  }
  const won = rows.filter((r) => r.learned.quality > r.random.quality && r.learned.top10 > r.random.top10).length;
  console.log(`${evals} paintings a run at ${W}×${H}, ${seeds} seeds, ${((Date.now() - t0) / 1000).toFixed(0)} s: learning beat random on both counts in ${won} of ${seeds}`);
  const out = arg("out", null);
  if (out) {
    writeFileSync(out, JSON.stringify({ version: 1, size: [W, H], made: keep.made, cells: keep.cells, picked: [] }) + "\n");
    console.log("archive:", out, Object.keys(keep.cells).length, "kinds kept");
  }
  const report = arg("report", null);
  if (report) writeFileSync(report, JSON.stringify({ evals, seeds, size: [W, H], rows }, null, 1));
  void here;
}
