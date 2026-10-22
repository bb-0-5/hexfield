/* The homepage: one painting at a time, and nothing to press. What it paints
 * next comes from what it has learned (learn.js): it starts from the archive
 * shipped with the site (moire/archive.json) and goes on learning in this
 * browser - every painting judged by its own eye before a stroke is laid, and
 * kept if it is the best of its kind so far. Each painting's moiré is read and
 * painted stroke by stroke, big to small, kept to its surface (a little paint
 * straying past the edge), then held, then the next. (MOIRE_HYPERBOLIC_358.md) */
(function () {
  "use strict";
  const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn, canvas = document.getElementById("view");
  if (!M || !L || !canvas) return;
  const ctx = canvas.getContext("2d");
  const HOLD_MS = 14000, PER_FRAME = 45, MAX_PIXELS = 1.6e6, KEY = "hexfield.moire.archive.v1";
  const rng = M.mulberry32((Date.now() ^ Math.floor(Math.random() * 2 ** 32)) >>> 0);
  const arc = L.archive();
  const local = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ version: 1, made: arc.made, cells: arc.cells, picked: arc.picked })); } catch { /* a private window, or full: it learns for this visit only */ } };
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
    const [W, H] = fit(), genes = L.next(arc, rng), scene = L.decode(genes);
    const R = M.raw(scene, W, H), read = M.reading(R, L.sigmaFor(scene, W, H)), judged = L.judge(R, read, scene);
    if (L.offer(arc, genes, judged)) save();
    canvas.dataset.painting = [scene.surface, scene.kind, judged.key, judged.score.toFixed(3)].join(" | ");
    const seed = Math.floor(rng() * 1e9), list = M.strokes(R, read, seed, scene.style), pal = M.palette(scene.style);
    // (The ground painted once; the strokes on a layer of their own, kept to the surface by its mask as they land.)
    const ground = M.canvasOf(W, H), gg = ground.getContext("2d"), layer = M.canvasOf(W, H), lg = layer.getContext("2d"), mask = M.canvasOf(W, H), kept = M.canvasOf(W, H);
    gg.fillStyle = `rgb(${pal.ground.join(",")})`;
    gg.fillRect(0, 0, W, H);
    for (const g of [gg, lg]) { g.lineCap = "round"; g.lineJoin = "round"; }
    for (const k of M.groundStrokes(W, H, seed, scene.style)) M.drawStroke(gg, k);
    mask.getContext("2d").putImageData(M.maskImage(R, new ImageData(W, H)), 0, 0);
    let i = 0;
    const frame = () => {
      // (A new size mid-painting: a new painting at that size.)
      if (resized) return next();
      for (const end = Math.min(list.length, i + PER_FRAME); i < end; i++) M.drawStroke(lg, list[i]);
      ctx.drawImage(ground, 0, 0);
      M.compose(ctx, layer, R, scene.style, mask, kept);
      if (i < list.length) requestAnimationFrame(frame);
      else held = setTimeout(next, HOLD_MS);
    };
    requestAnimationFrame(frame);
  }
  // What it starts from: the archive shipped with the site, and on top of it what this browser has learned.
  fetch("moire/archive.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((shared) => { L.merge(arc, shared); L.merge(arc, local()); next(); });
})();
