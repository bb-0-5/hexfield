/* Build 360 — the hyperbolic moiré painter: its geometry is the hyperbolic
 * plane's, its genomes always make a painting, and it learns: with the same
 * number of paintings, the archive's way beats random tries by its own eye. */
import assert from 'node:assert/strict';
await import('../public/moire/moire.js');
await import('../public/moire/learn.js');
const M = globalThis.HexfieldMoire, L = globalThis.HexfieldLearn;

// Every model of the plane lands on it (x² + y² − z² = −1), and sliding it keeps it there.
for (const P of [M.fromPolar(1.7, 2.1), M.fromDisk(-0.6, 0.7), M.fromHalfPlane(-1.2, 0.3), M.slideTo(M.fromPolar(1.1, 0.4))(M.fromDisk(0.5, 0.2))])
  assert.ok(Math.abs(M.mink(P, P) + 1) < 1e-9, 'a point off the plane');

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

// Every genome makes a painting: a surface it has, gratings, sensible numbers; a change stays a genome.
{
  const rng = M.mulberry32(5);
  for (let i = 0; i < 200; i++) {
    const genes = L.randomGenes(rng), scene = L.decode(genes), child = L.mutate(genes, rng);
    assert.ok(M.SURFACES[scene.surface] && L.KINDS.includes(scene.kind));
    assert.ok(scene.families.length >= 1 && scene.families.every((f) => f.type !== 'billiard' || f.normals.length > 0));
    assert.ok(scene.frame.fill >= 0.7 && scene.frame.fill <= 1.25 && Number.isFinite(scene.view.yaw + scene.view.pitch + scene.view.dist));
    assert.equal(child.length, L.GENES.length);
    assert.ok(child.every((g) => g >= 0 && g < 1) && child.some((g, k) => g !== genes[k]), 'a change that is not a genome, or no change');
  }
}

// Its eye: scores between 0 and 1, one kind of picture for each painting, the archive keeping the best of each kind.
{
  const rng = M.mulberry32(9), arc = L.archive();
  for (let i = 0; i < 12; i++) {
    const genes = L.randomGenes(rng), judged = L.evaluate(genes, 160, 120);
    assert.ok(judged.score >= 0 && judged.score <= 1 && /^[a-z]+·[a-z]+·[0-2]·[0-2]$/.test(judged.key));
    const before = arc.cells[judged.key]?.score ?? -1;
    assert.equal(L.offer(arc, genes, judged), judged.score > before);
    assert.ok(arc.cells[judged.key].score >= before);
  }
  assert.equal(arc.made, 12);
}

// It learns: the same number of paintings, the same first tries; then random tries against the archive's way.
// Its best paintings must beat random every time, and so must what it paints next. (How good its whole archive is
// across every kind of picture is reported, not required: at budgets this small random tries find about as many kinds.)
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
function race(seed, n, warm, learn) {
  const rng = M.mulberry32(seed), arc = L.archive();
  for (let i = 0; i < n; i++) {
    const genes = learn && i >= warm ? L.next(arc, rng) : L.randomGenes(rng);
    L.offer(arc, genes, L.evaluate(genes, 160, 120));
  }
  return { arc, quality: L.quality(arc), top: mean(L.best(arc, 10).map((c) => c.score)) };
}
for (const seed of [21, 22]) {
  const random = race(seed, 280, 50, false), learned = race(seed, 280, 50, true), rng = M.mulberry32(seed + 100);
  const next = [], tries = [];
  for (let i = 0; i < 40; i++) { next.push(L.evaluate(L.next(learned.arc, rng), 160, 120).score); tries.push(L.evaluate(L.randomGenes(rng), 160, 120).score); }
  console.log(`seed ${seed}: best ten ${learned.top.toFixed(3)} learned vs ${random.top.toFixed(3)} random · next paintings ${mean(next).toFixed(3)} vs random tries ${mean(tries).toFixed(3)} · whole archive ${learned.quality.toFixed(1)} vs ${random.quality.toFixed(1)}`);
  assert.ok(learned.top > random.top, 'its best paintings no better than random tries');
  assert.ok(mean(next) > mean(tries) + 0.1, 'what it paints next no better than random tries');
}
console.log('hyperbolic moiré: geometry, genomes, eye and learning verified');
