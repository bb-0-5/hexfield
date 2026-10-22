/* The homepage: one painting at a time, and nothing to press. Each is a new
 * set of gratings on half of an inverted hyperbolic surface; its moiré is read
 * and painted stroke by stroke, big to small, then held, then the next. For
 * now the gratings are chosen at random - what it learns to choose comes next
 * (MOIRE_HYPERBOLIC_358.md). */
(function () {
  "use strict";
  const M = globalThis.HexfieldMoire, canvas = document.getElementById("view");
  if (!M || !canvas) return;
  const ctx = canvas.getContext("2d");
  const HOLD_MS = 14000, PER_FRAME = 45, MAX_PIXELS = 1.6e6;
  const rng = M.mulberry32((Date.now() ^ Math.floor(Math.random() * 2 ** 32)) >>> 0);
  const pick = (list) => list[Math.floor(rng() * list.length)];
  // A ratio near 1 that never comes out even: an irrational number over the nearest fraction to it.
  const nearOne = () => { const c = pick(Object.values(M.IRRATIONAL)), q = pick([5, 8, 10, 12]); return c / (Math.round(c * q) / q); };
  function genome() {
    const surface = pick(Object.keys(M.SURFACES)), base = M.SURFACES[surface].view;
    const view = { yaw: base.yaw + (rng() - 0.5) * 0.3, pitch: base.pitch + (rng() - 0.5) * 0.2 };
    const every = 0.1 + rng() * 0.1, start = rng() * Math.PI * 2;
    if (rng() < 0.75) {
      const n = rng() < 0.6 ? 2 : 3;
      return { surface, view, overlap: "xor", families: Array.from({ length: n }, (_, k) => M.horocycles(start + k * M.GOLDEN_TURN, every * (k ? nearOne() : 1), rng())) };
    }
    // (Trajectories: a bundle of geodesics, each turned the golden angle from the last and drifted out by an irrational step, against one grating.)
    const count = 70 + Math.floor(rng() * 70), drift = pick(Object.values(M.IRRATIONAL)) % 1;
    return { surface, view, overlap: "xor", families: [M.geodesics(count, M.GOLDEN_TURN, drift, 2, 0.03, start), M.horocycles(start + 1, every * 1.4, rng())] };
  }
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
    const k = Math.min(1, Math.sqrt(MAX_PIXELS / (w * h)));
    w = Math.max(64, Math.round(w * k)); h = Math.max(64, Math.round(h * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return [w, h];
  }
  let resized = false, held = null;
  window.addEventListener("resize", () => { resized = true; });
  function next() {
    clearTimeout(held);
    resized = false;
    const [W, H] = fit(), g = genome();
    const R = M.raw(g, W, H), read = M.read(R, 6 * Math.min(W, H) / 390), list = M.strokes(R, read, Math.floor(rng() * 1e9));
    ctx.fillStyle = M.GROUND;
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    let i = 0;
    const frame = () => {
      // (A new size mid-painting: a new painting at that size.)
      if (resized) return next();
      for (const end = Math.min(list.length, i + PER_FRAME); i < end; i++) M.drawStroke(ctx, list[i]);
      if (i < list.length) requestAnimationFrame(frame);
      else held = setTimeout(next, HOLD_MS);
    };
    requestAnimationFrame(frame);
  }
  next();
})();
