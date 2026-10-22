/* Does the shared memory help? Visitors one after another, each a fresh browser
 * starting from the shipped archive, each staying for the same number of stages
 * (a composition, six glazes, a composition ...), the homepage's loop at the level
 * of ideas: with the shared memory (finds sent, kept by the server's rule, given
 * back, checked in the rests, every other composition a confirmed shared find)
 * and without it. Measured: what each visitor is shown (the judged score of every
 * stage painted), and how good its archive is when it leaves. (Build 362;
 * the loop is public/moire/page.js's, the server's rule worker.js's.)
 *   node tools/moire-share.mjs [--visitors 6] [--stages 21] [--seeds 2] */
import { readFileSync } from "node:fs";
await import(new URL("../public/moire/moire.js", import.meta.url).href);
await import(new URL("../public/moire/learn.js", import.meta.url).href);
const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn;
const shipped = JSON.parse(readFileSync(new URL("../public/moire/archive.json", import.meta.url), "utf8"));
const arg = (n, f) => { const i = process.argv.indexOf("--" + n); return i > 0 ? Number(process.argv[i + 1]) : f; };
const VISITORS = arg("visitors", 6), STAGES = arg("stages", 21), SEEDS = arg("seeds", 2), GLAZES = 6, WORTH = 0.6, CHECKS_PER_REST = 8;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// The server's rule (worker.js): per kind the six best and six newest kept; per kind the two best and two newest given, best first.
function server() {
  const rows = new Map(); let clock = 0;
  return {
    post(f) { const k = rows.get(f.kind) || []; if (!k.some((r) => r.key === f.genes.join(","))) k.push({ ...f, key: f.genes.join(","), at: ++clock });
      const keep = new Set([...[...k].sort((a, b) => b.score - a.score).slice(0, 6), ...[...k].sort((a, b) => b.at - a.at).slice(0, 6)]); rows.set(f.kind, k.filter((r) => keep.has(r))); },
    get() { const out = []; for (const k of rows.values()) out.push(...new Set([...[...k].sort((a, b) => b.score - a.score).slice(0, 2), ...[...k].sort((a, b) => b.at - a.at).slice(0, 2)]));
      return out.sort((a, b) => b.score - a.score).map((r) => ({ kind: r.kind, genes: r.genes, score: r.score })); },
  };
}

function visit(seed, srv) {
  const rng = M.mulberry32(seed), arc = L.archive();
  L.merge(arc, JSON.parse(JSON.stringify(shipped)));
  const seen = new Set(), key = (g) => g.join(","), shown = [], from = { own: 0, shared: 0 };
  let unchecked = srv ? srv.get().filter((f) => !seen.has(key(f.genes))).slice(0, 120) : [], outbox = [], keepers = [], compositions = 0, current = null, evals = 0;
  const learnFrom = (genes, own) => { evals++; const judged = L.evaluate(genes, 320, 240), kept = L.offer(arc, genes, judged);
    if (kept && own && srv) { const f = { kind: judged.key, genes: Array.from(genes, (g) => Math.round(g * 1e4) / 1e4), score: Math.round(judged.score * 1e4) / 1e4 }; seen.add(key(f.genes)); outbox.push(f); }
    return { judged, kept }; };
  const checkShared = () => { const genes = unchecked.shift().genes, r = learnFrom(genes, false); seen.add(key(genes));
    if (r.kept && r.judged.score >= WORTH) keepers = [...keepers, { genes, judged: r.judged, shared: true }].sort((x, y) => y.judged.score - x.judged.score).slice(0, 24); };
  const think = (make, first) => { let best = null; for (let t = 0; t < 5; t++) { const genes = make(), r = learnFrom(genes, true);
    if (!best || r.judged.score > best.judged.score) best = { genes, judged: r.judged }; if (first && r.judged.score >= WORTH) break; }
    if (srv && outbox.length) { outbox.sort((a, b) => b.score - a.score); srv.post(outbox.shift()); outbox.length = Math.min(outbox.length, 8); }
    return best; };
  const compose = () => { const pick = compositions++ % 2 === 1 && keepers.length ? keepers.shift() : think(() => L.next(arc, rng), true);
    current = { genes: pick.genes, glazes: 0 }; from[pick.shared ? "shared" : "own"]++; shown.push(pick.judged.score); };
  for (let s = 0; s < STAGES; s++) {
    if (!current || current.glazes >= GLAZES) compose();
    else { const pick = think(() => L.drift(current.genes, rng), false);
      if (pick.judged.score < WORTH * 0.85) compose(); else { current.genes = pick.genes; current.glazes++; shown.push(pick.judged.score); } }
    for (let c = 0; c < CHECKS_PER_REST && unchecked.length; c++) checkShared();
  }
  return { shown: mean(shown), quality: L.quality(arc), kinds: Object.keys(arc.cells).length, evals, from };
}

const t0 = Date.now(), table = [];
for (let s = 1; s <= SEEDS; s++) {
  const srv = server();
  for (let v = 0; v < VISITORS; v++) {
    const seed = s * 104729 + v * 7919, alone = visit(seed, null), shared = visit(seed, srv);
    table.push({ seed: s, visitor: v + 1, alone, shared });
    console.log(`seed ${s} visitor ${v + 1}: shown ${alone.shown.toFixed(3)} alone, ${shared.shown.toFixed(3)} shared | archive ${alone.quality.toFixed(2)} → ${shared.quality.toFixed(2)} | kinds ${alone.kinds} → ${shared.kinds} | ideas judged ${alone.evals} → ${shared.evals} | compositions own/shared ${shared.from.own}/${shared.from.shared}`);
  }
}
const later = table.filter((r) => r.visitor > 1);
console.log(`visitors after the first: shown ${mean(later.map((r) => r.alone.shown)).toFixed(3)} alone → ${mean(later.map((r) => r.shared.shown)).toFixed(3)} shared; archive ${mean(later.map((r) => r.alone.quality)).toFixed(2)} → ${mean(later.map((r) => r.shared.quality)).toFixed(2)}; better archive in ${later.filter((r) => r.shared.quality > r.alone.quality).length} of ${later.length}; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
