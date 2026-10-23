/* Builds 359–366 — the hyperbolic moiré painter: its geometry is the
 * hyperbolic plane's (standing in space, or flat as one of its own maps), its
 * structures stand - pillars of stacked pieces apart, in depth or not, arches
 * landing on their tops with smaller ones set back inside them - above a
 * ground the camera never goes below, its colours run with its value at full
 * chroma - its sims act on each other - moving and swelling each other's lines
 * (and leave each other alone when they are not coupled) - every silhouette is
 * whole and centred in the frame, its genomes always make a painting, a
 * painting carried on keeps its composition, and it learns: with the same
 * number of paintings, its best and what it paints next beat random tries by
 * its own eye. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
await import('../public/moire/moire.js');
await import('../public/moire/learn.js');
const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn;

// Every model of the plane lands on it (x² + y² − z² = −1), and sliding it keeps it there.
for (const P of [M.fromPolar(1.7, 2.1), M.fromDisk(-0.6, 0.7), M.fromHalfPlane(-1.2, 0.3), M.fromKlein(0.3, -0.9), M.slideTo(M.fromPolar(1.1, 0.4))(M.fromDisk(0.5, 0.2))])
  assert.ok(Math.abs(M.mink(P, P) + 1) < 1e-9, 'a point off the plane');
// The Klein map keeps the plane's lines straight: three points in a straight row on it lie on one line of the plane.
for (const [ax, ay, bx, by] of [[-0.9, 0.1, 0.7, 0.6], [0.2, -0.95, 0.1, 0.97]]) {
  const n = M.lineThrough(M.fromKlein(ax, ay), M.fromKlein(bx, by));
  for (const t of [0.17, 0.5, 0.83]) assert.ok(Math.abs(M.mink(M.fromKlein(ax + t * (bx - ax), ay + t * (by - ay)), n)) < 1e-9, 'a straight row on the Klein map off the line');
}

// Horocycles are the plane's straight waves: walking toward their point at infinity, each step of t crosses t worth of rings.
for (const a of [0.3, 2.2, 4.9]) {
  const ring = (t) => { const P = M.fromPolar(t, a); return Math.log(P[2] - P[0] * Math.cos(a) - P[1] * Math.sin(a)); };
  assert.ok(Math.abs((ring(0.4) - ring(2.9)) - 2.5) < 1e-9, 'horocycles not evenly spaced');
}

// A billiard path: every chord runs between two points of its circle, and is turned the same angle from the last.
{
  const centre = [0.7, 1.1], radius = 1.6, turn = 2 * Math.PI * (Math.SQRT2 % 1), b = M.billiard(centre, radius, turn, 40, 0.02, 0.5);
  const slide = M.slideTo(M.fromPolar(...centre));
  assert.equal(b.normals.length, 40);
  b.normals.forEach((n, k) => {
    assert.ok(Math.abs(M.mink(n, n) - 1) < 1e-9);
    for (const a of [0.5 + k * turn, 0.5 + (k + 1) * turn]) {
      const P = slide(M.fromPolar(radius, a));
      assert.ok(Math.abs(M.mink(P, n)) < 1e-9, 'a chord that misses its end on the circle');
      assert.ok(Math.abs(-M.mink(P, b.C) - b.coshR) < 1e-9, 'a chord end off the circle');
    }
  });
}

// Ripples spread evenly: from their source, each step out of `every` crosses one ripple.
{
  const w = M.waves([0.9, 1.3], 0.2), S = M.fromPolar(0.9, 1.3), slide = M.slideTo(S);
  for (const a of [0.4, 3.0]) {
    const at = (d) => Math.acosh(-M.mink(slide(M.fromPolar(d, a)), w.S)) / w.every;
    assert.ok(Math.abs(at(1.7) - at(0.3) - 7) < 1e-6, 'ripples not evenly spaced');
  }
}

// Sims acting on each other: uncoupled they are exactly what they are apart; coupled, each one's beats move the others' lines.
{
  const families = [M.horocycles(0.3, 0.14), M.waves([0.8, 2.0], 0.15), M.billiard([0.2, 1], 1.7, 2 * Math.PI * (Math.SQRT2 % 1), 80, 0.02)];
  const apart = M.raw({ surface: 'dome', overlap: 'xor', families }, 160, 120);
  const still = M.raw({ surface: 'dome', overlap: 'xor', families, couple: [[0, 0, 0], [0, 0, 0], [0, 0, 0]] }, 160, 120);
  const acting = M.raw({ surface: 'dome', overlap: 'xor', families, couple: [[0, 1.2, -0.8], [0.9, 0, 0.6], [-1, 0.7, 0]] }, 160, 120);
  let moved = 0, covered = 0;
  for (let o = 0; o < apart.ink.length; o++) {
    assert.equal(still.ink[o], apart.ink[o], 'uncoupled sims changed each other');
    if (apart.cover[o]) { covered++; moved += apart.ink[o] !== acting.ink[o]; }
  }
  assert.ok(moved / covered > 0.1, 'coupled sims barely moved each other');
  assert.ok(acting.acting.push > 0, 'no push measured between coupled sims');
  // (And the other ways a push can land: lines swollen or thinned, or moved and swollen at once.)
  for (const mode of ['swell', 'both']) {
    const pushed = M.raw({ surface: 'dome', overlap: 'xor', families, mode, couple: [[0, 1.2, -0.8], [0.9, 0, 0.6], [-1, 0.7, 0]] }, 160, 120);
    let changed = 0;
    for (let o = 0; o < apart.ink.length; o++) if (apart.cover[o]) changed += apart.ink[o] !== pushed.ink[o];
    assert.ok(changed / covered > 0.05, `pushes that ${mode} barely changed the lines`);
  }
}

// Every genome makes a painting: a structure of at least two of its surfaces, two or three sims acting on each other, sensible numbers; a change stays a genome.
{
  const rng = M.mulberry32(5);
  for (let i = 0; i < 200; i++) {
    const genes = L.randomGenes(rng), scene = L.decode(genes), child = L.mutate(genes, rng), F = scene.families.length;
    const { plan } = scene, pieces = plan.pillars * plan.stack.length + plan.pillars - 1;
    assert.ok(plan.pillars >= 1 && plan.pillars <= 3 && plan.stack.length >= 1 && plan.stack.length <= 4 && pieces >= 2, 'a structure of fewer than two pieces');
    assert.ok(plan.stack.every((p) => M.SURFACES[p.key]) && scene.kind.split('+').every((t) => L.TYPES.includes(t)));
    assert.equal(scene.form, L.FORMS[plan.pillars - 1] + '-' + (plan.stack.length <= 2 ? 'low' : 'tall'));
    assert.ok(F >= 2 && F <= 3 && scene.families.every((f) => f.type !== 'billiard' || f.normals.length > 0));
    assert.ok(scene.couple.length === F && scene.couple.every((row, a) => row.length === F && row[a] === 0));
    assert.ok(Math.max(...scene.couple.flat().map(Math.abs)) >= 1, 'sims that do not push each other hard anywhere');
    assert.ok(['shift', 'swell', 'both'].includes(scene.mode) && scene.rounds >= 3 && scene.rounds <= 6);
    // (A painting carried on keeps its structure, view, framing and colours, and which sims it has.)
    const carried = L.drift(genes, rng);
    for (const name of ['pillars', 'storeys', 'p0', 'p1', 'p2', 'p3', 'flips', 'taper', 'span', 'gap', 'layout', 'depth', 'sun', 'height', 'nest', 'fit', 'recess', 'yaw', 'pitch', 'dist', 'fill', 'hue', 'harmony', 'lift', 'light', 'spill', 'stroke', 's0', 's1', 's2'])
      assert.equal(carried[L.GENES.indexOf(name)], genes[L.GENES.indexOf(name)], `drift changed ${name}`);
    assert.ok(scene.frame.fill >= 0.72 && scene.frame.fill <= 0.92 && Number.isFinite(scene.view.yaw + scene.view.pitch + scene.view.dist));
    assert.equal(child.length, L.GENES.length);
    assert.ok(child.every((g) => g >= 0 && g < 1) && child.some((g, k) => g !== genes[k]), 'a change that is not a genome, or no change');
  }
}

// Builds 364–366: structures stand. Pillars never touch each other, in a row or in depth; every piece sits on the one below with a
// gap; each arch, however it is turned, has its feet centred on the tops it springs from and just as wide, and the arches inside
// it spring from the same line, each fitting inside the opening of the one in front and set back behind it; every piece carries
// the plane (its glaze turned and slid, still on it).
{
  const rng = M.mulberry32(364), layouts = new Set();
  for (let i = 0; i < 300; i++) {
    const { plan } = L.decode(L.randomGenes(rng)), st = M.structure(plan), n = plan.stack.length, P = plan.pillars, col = st.pieces.slice(0, n * P);
    if (P > 1) layouts.add(plan.layout);
    for (let p = 0; p < P; p++) for (let k = 0; k < n; k++) {
      const a = col[p * n + k];
      if (k) { const b = col[p * n + k - 1]; assert.ok(Math.abs(a.base - (b.base + b.height + plan.gap)) < 1e-9, 'a piece not set on the one below'); }
      if (p) { const b = col[(p - 1) * n + k]; assert.ok(Math.hypot(a.x - b.x, a.z - b.z) - (a.width + b.width) / 2 >= plan.gap * 2 - 1e-9, 'neighbouring pillars touching'); }
    }
    const arches = st.pieces.slice(n * P), per = plan.nest + 1;
    assert.equal(arches.length, (P - 1) * per, 'not every arch nesting its smaller ones');
    for (let p = 0; p + 1 < P; p++) {
      const arch = arches[p * per], left = col[p * n + n - 1], right = col[(p + 1) * n + n - 1], mid = (arch.u[0] + arch.u[1]) / 2, top = left.base + left.height + plan.gap;
      for (const [foot, a] of [[left, Math.PI], [right, 0]]) {
        const q = arch.pos(mid, a), inner = arch.pos(arch.u[0], a), outer = arch.pos(arch.u[1], a);
        assert.ok(Math.hypot(q[0] - foot.x, q[2] - foot.z) < 1e-9 && Math.abs(q[1] - top) < 1e-9, 'an arch foot not on its top');
        assert.ok(Math.abs(Math.hypot(outer[0] - inner[0], outer[2] - inner[2]) - foot.width) < 1e-9, 'an arch foot not as wide as its top');
      }
      for (let j = 1; j < per; j++) {
        const front = arches[p * per + j - 1], inside = arches[p * per + j], facing = [Math.sin(front.yaw), Math.cos(front.yaw)];
        assert.ok(Math.abs(inside.base - front.base) < 1e-9 && inside.yaw === front.yaw, 'an inner arch not on the same springing line');
        assert.ok(inside.width / 2 <= front.width / 2 * front.u[0] / front.u[1] + 1e-9, 'an inner arch not inside the opening of the one in front');
        assert.ok((inside.x - front.x) * facing[0] + (inside.z - front.z) * facing[1] < 0, 'an inner arch not set back');
      }
    }
    if (i < 20) for (const pc of st.pieces) {
      const P0 = pc.plane((pc.u[0] + pc.u[1]) / 2, (pc.v[0] + pc.v[1]) / 2);
      assert.ok(Math.abs(M.mink(P0, P0) + 1) < 1e-8, 'a piece carrying a point off the plane');
    }
    // (The camera never goes below the ground.)
    const stg = M.stage(L.decode(L.randomGenes(rng)));
    assert.ok(M.camera(stg.view, 160, 120).eye[1] > 0, 'the camera under the ground');
  }
  assert.equal(layouts.size, 3, 'not every way of standing pillars tried');
}

// Builds 363–366: the whole structure, centred, for every form and in every shape of frame - never cut by its edge - as big as
// the genome says.
{
  const rng = M.mulberry32(363), seen = new Set(), G = (n) => L.GENES.indexOf(n);
  for (let i = 0; i < 24; i++) {
    const genes = L.randomGenes(rng);
    genes[G('pillars')] = ((i % 3) + 0.5) / 3;
    genes[G('storeys')] = (Math.floor(i / 3) % 2) ? 0.9 : 0.3;
    const scene = L.decode(genes);
    seen.add(scene.form);
    for (const [w, h] of [[160, 120], [90, 160], [120, 120]]) {
      const R = M.raw(scene, w, h);
      let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (R.cover[y * w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      assert.ok(x0 > 0 && y0 > 0 && x1 < w - 1 && y1 < h - 1, `${scene.form} cut by the frame at ${w}×${h}`);
      assert.ok(Math.abs((x0 + x1) / 2 - (w - 1) / 2) <= 3 && Math.abs((y0 + y1) / 2 - (h - 1) / 2) <= 3, `${scene.form} off centre at ${w}×${h}`);
      assert.ok(Math.abs(Math.max((x1 - x0 + 1) / w, (y1 - y0 + 1) / h) - scene.frame.fill) < 0.07, `${scene.form} not as big as its genome says at ${w}×${h}`);
    }
  }
  assert.equal(seen.size, 6, 'not every form framed');
  // (One flat map alone, seen square on and not turned: half of a disk is a half-disk, π/4 of its box.)
  for (const surface of ['disk', 'klein']) {
    const families = [M.horocycles(0.3, 0.14), M.waves([0.8, 2.0], 0.15)];
    const R = M.raw({ surface, overlap: 'xor', families, view: { yaw: 0, pitch: 0, roll: 0 } }, 200, 150);
    let n = 0, x0 = 200, x1 = -1, y0 = 150, y1 = -1;
    for (let y = 0; y < 150; y++) for (let x = 0; x < 200; x++) if (R.cover[y * 200 + x]) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    assert.ok(Math.abs(n / ((x1 - x0 + 1) * (y1 - y0 + 1)) - Math.PI / 4) < 0.03 && (x1 - x0) > 1.8 * (y1 - y0), `${surface} is not a flat half-disk seen square on`);
  }
}

// Build 366: its colours. Every step of every palette is at full chroma - as strong as a screen can show at that lightness and hue
// (a channel at its limit) - and its lightness runs with the value: on paper from light to dark, in neon from dark to bright (or
// the other way, lifted); the paper ground is light, the neon ground near black.
{
  const Y = (c) => c.map((v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
  for (const light of ['paper', 'neon']) for (const harmony of Object.keys(M.HARMONIES)) for (const lift of [false, true]) for (const hue of [10, 130, 250]) {
    const pal = M.palette({ hue, harmony, lift, light }), ys = pal.stops.map(([, c]) => Y(c)), rising = (light === 'neon') !== lift;
    assert.equal(pal.neon, light === 'neon');
    pal.stops.forEach(([, c]) => assert.ok(c.every((v) => v >= 0 && v <= 255) && (Math.min(...c) <= 2 || Math.max(...c) >= 253), `${light} ${harmony}: a colour short of full chroma: ${c}`));
    for (let i = 1; i < ys.length; i++) assert.ok(rising ? ys[i] >= ys[i - 1] - 0.02 : ys[i] <= ys[i - 1] + 0.02, `${light} ${harmony}${lift ? ' lifted' : ''}: lightness not running with the value`);
    assert.ok(light === 'neon' ? Y(pal.ground) < 0.03 : Y(pal.ground) > 0.75, `${light}: the ground the wrong lightness`);
  }
}

// Its eye: scores between 0 and 1, one kind of picture for each painting, the archive keeping the best of each kind.
{
  const rng = M.mulberry32(9), arc = L.archive();
  for (let i = 0; i < 12; i++) {
    const genes = L.randomGenes(rng), judged = L.evaluate(genes, 160, 120);
    assert.ok(judged.score >= 0 && judged.score <= 1 && /^(column|gate|arcade)-(low|tall)·[a-z+]+·[0-2]$/.test(judged.key));
    assert.ok(judged.parts.interplay >= 0 && judged.parts.interplay <= 1, 'interplay out of range');
    const before = arc.cells[judged.key]?.score ?? -1;
    assert.equal(L.offer(arc, genes, judged), judged.score > before);
    assert.ok(arc.cells[judged.key].score >= before);
  }
  assert.equal(arc.made, 12);
}

// It learns: the same number of paintings, the same first tries; then random tries against the archive's way.
// Even at a budget this small its best paintings beat random, and so does what it paints next. (How good its whole
// archive is across every kind of picture is reported, not required: random tries find about as many kinds, or more.)
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
function race(seed, n, warm, learn) {
  const rng = M.mulberry32(seed), arc = L.archive();
  for (let i = 0; i < n; i++) {
    const genes = learn && i >= warm ? L.next(arc, rng) : L.randomGenes(rng);
    L.offer(arc, genes, L.evaluate(genes, 160, 120));
  }
  return { arc, quality: L.quality(arc), top: mean(L.best(arc, 10).map((c) => c.score)) };
}
function nextAgainstRandom(arc, seed, n) {
  const rng = M.mulberry32(seed), next = [], tries = [];
  for (let i = 0; i < n; i++) { next.push(L.evaluate(L.next(arc, rng), 160, 120).score); tries.push(L.evaluate(L.randomGenes(rng), 160, 120).score); }
  return [mean(next), mean(tries)];
}
// (The budget grows with the kinds there are to fill: 280 paintings for the 84 kinds of four surfaces, 420 for the 126 of six.)
for (const seed of [21, 22]) {
  const random = race(seed, 420, 75, false), learned = race(seed, 420, 75, true), [next, tries] = nextAgainstRandom(learned.arc, seed + 100, 40);
  console.log(`seed ${seed}: best ten ${learned.top.toFixed(3)} learned vs ${random.top.toFixed(3)} random · next paintings ${next.toFixed(3)} vs random tries ${tries.toFixed(3)} · whole archive ${learned.quality.toFixed(1)} vs ${random.quality.toFixed(1)}`);
  assert.ok(learned.top > random.top, 'its best paintings no better than random tries');
  assert.ok(next > tries, 'what it paints next no better than random tries');
}
// The memory the homepage starts from (public/moire/archive.json): what it paints next from there clearly beats random tries.
{
  const arc = L.merge(L.archive(), JSON.parse(readFileSync(new URL('../public/moire/archive.json', import.meta.url), 'utf8')));
  assert.ok(Object.keys(arc.cells).length >= 40, 'the shipped memory has too few kinds (or is for another genome)');
  const [next, tries] = nextAgainstRandom(arc, 31, 60);
  console.log(`shipped memory: ${Object.keys(arc.cells).length} kinds · next paintings ${next.toFixed(3)} vs random tries ${tries.toFixed(3)}`);
  assert.ok(next > tries + 0.1, 'what the homepage paints next is not clearly better than random tries');
}
console.log('hyperbolic moiré: geometry, sims acting on each other, genomes, eye and learning verified');
