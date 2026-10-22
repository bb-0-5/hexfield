/* The homepage: a painting that never stops, and nothing to press.
 *
 * What it paints comes from what it has learned (learn.js): it starts from the
 * archive shipped with the site (moire/archive.json) and goes on learning in
 * this browser. A composition is chosen - the first of up to five ideas its
 * eye finds worth painting - and painted stroke by stroke, big to small, kept
 * to its surface. Then it carries on: its sims drift (their spacings and turns,
 * how hard they push each other and how), the best of five drifted versions is
 * glazed over what is there, then again, so the painting keeps changing; after
 * a few glazes a new composition fades in over the old one. Every idea it has,
 * painted or not, is judged and learned from, and while nobody is looking (the
 * page hidden) it goes on having ideas and learning from them. If anything
 * goes wrong it starts a new painting rather than stopping.
 * (MOIRE_HYPERBOLIC_358.md) */
(function () {
  "use strict";
  const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn, canvas = document.getElementById("view");
  if (!M || !L || !canvas) return;
  const ctx = canvas.getContext("2d");
  // (Asked for less motion: each stage appears whole instead of stroke by stroke, and rests longer.)
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PER_FRAME = still ? Infinity : 45, MAX_PIXELS = 1.6e6, KEY = "hexfield.moire.archive.v3";
  // How long it rests on a finished stage, how many glazes a composition gets before a new one, and how good an idea must be to be painted.
  const REST_MS = still ? 20000 : 3500, GLAZES = 6, WORTH = 0.6;
  const rng = M.mulberry32((Date.now() ^ Math.floor(Math.random() * 2 ** 32)) >>> 0);
  const arc = L.archive();
  const local = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ version: 3, made: arc.made, cells: arc.cells, picked: arc.picked })); } catch { /* a private window, or full: it learns for this visit only */ } };
  // The canvas's own box on the page (the whole window on the homepage), in device pixels up to a limit.
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round((canvas.clientWidth || window.innerWidth) * dpr), h = Math.round((canvas.clientHeight || window.innerHeight) * dpr);
    const k = Math.min(1, Math.sqrt(MAX_PIXELS / (w * h)));
    w = Math.max(64, Math.round(w * k)); h = Math.max(64, Math.round(h * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return [w, h];
  }
  let resized = false, timer = null, lastTick = Date.now(), current = null;
  window.addEventListener("resize", () => { resized = true; });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) lastTick = Date.now(); });

  // Ideas, judged small (as its archive was learned) and every one learned from: the best of them, or the first worth painting if `first`.
  function think(make, W, H, first) {
    const w = 320, h = Math.max(120, Math.round(320 * H / W));
    let best = null, kept = false;
    for (let t = 0; t < 5; t++) {
      const genes = make(), judged = L.evaluate(genes, w, h);
      kept = L.offer(arc, genes, judged) || kept;
      if (!best || judged.score > best.judged.score) best = { genes, judged };
      if (first && judged.score >= WORTH) break;
    }
    if (kept) save();
    canvas.dataset.ideas = String(arc.made);
    return best;
  }
  const label = (scene, judged) => { canvas.dataset.painting = [scene.surface, scene.kind, scene.mode, judged.key, judged.score.toFixed(3), "glaze " + (current?.glazes ?? 0)].join(" | "); };
  // A new composition: the ground painted once, the strokes on a layer of their own kept to the surface by its mask, the old painting fading out over it.
  function compose(W, H) {
    const pick = think(() => L.next(arc, rng), W, H, true), scene = L.decode(pick.genes), sigma = L.sigmaFor(scene, W, H);
    const R = M.raw(scene, W, H, sigma), read = M.reading(R, sigma), seed = Math.floor(rng() * 1e9), pal = M.palette(scene.style);
    let before = null;
    if (current && current.W === W && current.H === H) { before = M.canvasOf(W, H); before.getContext("2d").drawImage(canvas, 0, 0); }
    const ground = M.canvasOf(W, H), gg = ground.getContext("2d"), layer = M.canvasOf(W, H), lg = layer.getContext("2d"), mask = M.canvasOf(W, H);
    gg.fillStyle = `rgb(${pal.ground.join(",")})`;
    gg.fillRect(0, 0, W, H);
    for (const g of [gg, lg]) { g.lineCap = "round"; g.lineJoin = "round"; }
    for (const k of M.groundStrokes(W, H, seed, scene.style)) M.drawStroke(gg, k);
    mask.getContext("2d").putImageData(M.maskImage(R, new ImageData(W, H)), 0, 0);
    current = { genes: pick.genes, scene, R, W, H, ground, layer, lg, mask, kept: M.canvasOf(W, H), glazes: 0, before, fade: before ? 1 : 0 };
    label(scene, pick.judged);
    paint(M.strokes(R, read, seed, scene.style));
  }
  // A glaze: the best of five drifted versions of what is there, laid over it in thinner paint (or a new composition, if every one drifted somewhere poor).
  function glaze(W, H) {
    const pick = think(() => L.drift(current.genes, rng), W, H, false);
    if (pick.judged.score < WORTH * 0.85) return compose(W, H);
    const scene = L.decode(pick.genes), sigma = L.sigmaFor(scene, W, H), R = M.raw(scene, W, H, sigma), read = M.reading(R, sigma);
    current.genes = pick.genes;
    current.scene = scene;
    current.glazes++;
    label(scene, pick.judged);
    paint(M.strokes(R, read, Math.floor(rng() * 1e9), scene.style, true));
  }
  function paint(list) {
    let i = 0;
    const frame = () => {
      try {
        lastTick = Date.now();
        // (A new size mid-painting: a new painting at that size.)
        if (resized) return stage();
        const c = current;
        for (const end = Math.min(list.length, i + PER_FRAME); i < end; i++) M.drawStroke(c.lg, list[i]);
        ctx.drawImage(c.ground, 0, 0);
        M.compose(ctx, c.layer, c.R, c.scene.style, c.mask, c.kept);
        if (c.before && c.fade > 0) { ctx.globalAlpha = c.fade; ctx.drawImage(c.before, 0, 0); ctx.globalAlpha = 1; c.fade = Math.max(0, c.fade - 0.03); }
        if (i < list.length || c.fade > 0) requestAnimationFrame(frame);
        else { c.before = null; timer = setTimeout(stage, REST_MS); }
      } catch (error) { recover(error); }
    };
    requestAnimationFrame(frame);
  }
  function stage() {
    clearTimeout(timer);
    try {
      const [W, H] = fit(), fresh = !current || resized || current.glazes >= GLAZES || current.W !== W || current.H !== H;
      resized = false;
      if (fresh) compose(W, H);
      else glaze(W, H);
    } catch (error) { recover(error); }
  }
  // Whatever went wrong, a new painting a moment later rather than a stopped one.
  function recover(error) {
    console.warn("hexfield: starting a new painting after", error);
    current = null;
    clearTimeout(timer);
    timer = setTimeout(stage, 1500);
  }
  // (A watchdog: on screen, but no paint landing for half a minute - start again.)
  setInterval(() => { if (!document.hidden && Date.now() - lastTick > 30000 + REST_MS) { lastTick = Date.now(); recover(new Error("no paint for 30 s")); } }, 10000);
  // While nobody is looking, it goes on having ideas and learning from them (as often as the browser lets a hidden page run).
  setInterval(() => {
    if (!document.hidden) return;
    try { const genes = L.next(arc, rng); if (L.offer(arc, genes, L.evaluate(genes, 320, 240))) save(); canvas.dataset.ideas = String(arc.made); } catch { /* the next idea */ }
  }, 3000);
  // What it starts from: the archive shipped with the site, and on top of it what this browser has learned.
  fetch("moire/archive.json").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((shared) => { L.merge(arc, shared); L.merge(arc, local()); stage(); });
})();
