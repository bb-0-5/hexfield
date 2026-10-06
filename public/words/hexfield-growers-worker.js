/* Growers, simulated off the painting's thread (app.js, "Growers"): a set
 * of rules played out through its life, a patch played out over weeks, or
 * a kept outcome drawn again - pure arithmetic, so it runs here while the
 * studio paints, and only the result goes back. */
/* global importScripts */
importScripts("hexfield-growers.js");
const G = self.HexfieldGrowers;
self.onmessage = (event) => {
  const { id, op } = event.data || {};
  try {
    if (op === "grow") {
      const { genes, at } = event.data;
      const entries = G.growAt(genes, at);
      self.postMessage({ id, entries, judged: entries.map((entry) => G.judge(entry)) });
    } else if (op === "patch") {
      const { genes, pool } = event.data, S = G.patches;
      let top = null;
      for (const snap of S.simulate(genes, pool)) { const judged = S.judge(snap, pool, genes); if (!top || judged.score > top.judge) top = { snap, judge: judged.score }; }
      self.postMessage({ id, top, entry: top ? S.draw(top.snap, pool, genes) : null });
    } else if (op === "draw") {
      const { outcome } = event.data;
      const entry = outcome.patch ? G.patches.draw(outcome.patch, outcome.pool, outcome.genes)
        : G.grow(outcome.genes, { age: outcome.age, yaw: outcome.yaw, pitch: outcome.pitch });
      self.postMessage({ id, entry });
    } else self.postMessage({ id, error: "unknown op" });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
};
