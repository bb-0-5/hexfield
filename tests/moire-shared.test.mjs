/* Build 362 — the moiré painter's shared memory: what the site takes (a find
 * of this genome version, from hexfield.org, at a sane rate), what it keeps
 * (per kind the six best claimed and the six newest), and what it gives back
 * (per kind the two best and the two newest). Run against real SQLite, standing
 * in for D1, made from the same schema (migrations/0001_moire_finds.sql). */
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const { moireFind, apiMoireFinds } = await import('../worker.js');

function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_moire_finds.sql', import.meta.url), 'utf8'));
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
  });
  return { db, prepare: (sql) => statement(sql), batch: async (list) => { for (const s of list) await s.run(); return []; } };
}
const genes = (seed) => Array.from({ length: 40 }, (_, i) => ((seed * 7919 + i * 104729) % 9973) / 9973);
const find = (kind, seed, score) => ({ version: 4, kind, genes: genes(seed), score });
const post = (env, body, origin = 'https://hexfield.org') => apiMoireFinds(new Request('https://hexfield.org/api/moire/finds', {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }), env);
const get = async (env) => (await apiMoireFinds(new Request('https://hexfield.org/api/moire/finds'), env)).json();
let clock = 1_800_000_000_000;
Date.now = () => ++clock;

// What counts as a find.
assert.ok(moireFind(find('dome·billiard+rings·1', 1, 0.9)) && moireFind(find('klein·billiard+waves·2', 2, 0.8)) && moireFind(find('disk·rings·0', 3, 0.7)));
for (const bad of [
  { ...find('dome·billiard+rings·1', 1, 0.9), version: 3 }, { ...find('dome·billiard+rings·1', 1, 0.9), version: 3, genes: [...genes(1), 0.5, 0.5] },
  find('cube·rings·1', 1, 0.9), find('dome·rings·3', 1, 0.9), find('dome·rings+rings+rings+rings·1', 1, 0.9),
  { ...find('dome·rings·1', 1, 0.9), genes: genes(1).slice(1) }, { ...find('dome·rings·1', 1, 0.9), genes: [...genes(1).slice(1), 1] },
  { ...find('dome·rings·1', 1, 0.9), genes: [...genes(1).slice(1), 'x'] }, find('dome·rings·1', 1, 1.5), find('dome·rings·1', 1, NaN), null,
]) assert.equal(moireFind(bad), null, 'took something that is not a find: ' + JSON.stringify(bad)?.slice(0, 80));

// Not set up, from elsewhere, not a find, too many at once: refused, and nothing kept.
{
  assert.equal((await apiMoireFinds(new Request('https://hexfield.org/api/moire/finds'), {})).status, 503);
  const env = { MOIRE: d1() };
  assert.equal((await post(env, find('dome·rings·1', 1, 0.9), 'https://elsewhere.example')).status, 403);
  assert.equal((await post(env, '{"version":3,"kind":"dome·rings·1"')).status, 400);
  assert.equal((await post(env, find('dome·rings·9', 1, 0.9))).status, 400);
  assert.equal((await post(env, 'x'.repeat(5000))).status, 413);
  assert.equal((await post({ ...env, MOIRE_POSTS: { limit: async () => ({ success: false }) } }, find('dome·rings·1', 1, 0.9))).status, 429);
  assert.deepEqual(await get(env), { version: 4, finds: [] });
}

// From the site's own pages wherever the Worker is served (its workers.dev address, a local preview): taken. With no origin: refused.
{
  const env = { MOIRE: d1() }, at = 'https://hexfield.example.workers.dev';
  const sent = (origin) => apiMoireFinds(new Request(at + '/api/moire/finds', {
    method: 'POST', headers: origin ? { origin } : {}, body: JSON.stringify(find('saddle·waves·2', 5, 0.8)) }), env);
  assert.equal((await sent(null)).status, 403, 'taken with no origin');
  assert.equal((await sent('https://elsewhere.example')).status, 403);
  assert.equal((await sent(at)).status, 204);
  assert.equal((await get(env)).finds.length, 1);
}

// Kept and given back: per kind, the six best and the six newest are kept; the two best and the two newest go out, best first.
{
  const env = { MOIRE: d1(), MOIRE_POSTS: { limit: async () => ({ success: true }) } };
  for (let i = 0; i < 20; i++) assert.equal((await post(env, find('arch·rings+waves·1', i, (i * 37 % 20) / 20))).status, 204);
  assert.equal((await post(env, find('bell·billiard·0', 99, 0.5))).status, 204);
  assert.equal((await post(env, find('bell·billiard·0', 99, 0.5))).status, 204, 'the same find twice');
  const rows = env.MOIRE.db.prepare("SELECT score, at FROM finds WHERE kind = 'arch·rings+waves·1'").all();
  assert.ok(rows.length >= 6 && rows.length <= 12, `kept ${rows.length} of one kind`);
  const scores = rows.map((r) => r.score).sort((a, b) => b - a), all = Array.from({ length: 20 }, (_, i) => (i * 37 % 20) / 20).sort((a, b) => b - a);
  assert.deepEqual(scores.slice(0, 6), all.slice(0, 6), 'lost one of the six best');
  const out = (await get(env)).finds, arch = out.filter((f) => f.kind === 'arch·rings+waves·1');
  assert.ok(arch.length >= 2 && arch.length <= 4 && arch[0].score === all[0] && arch[0].genes.length === 40);
  assert.equal(out.filter((f) => f.kind === 'bell·billiard·0').length, 1, 'the same find kept twice');
  assert.ok(out.every((f, i) => !i || out[i - 1].score >= f.score), 'not best first');
}

// Given out from the edge cache for a minute, under one key whatever the query: one read of the memory however many browsers ask.
{
  const store = new Map();
  globalThis.caches = { default: { match: async (r) => store.get(r.url)?.clone(), put: async (r, res) => { store.set(r.url, res); } } };
  const env = { MOIRE: d1() }, prepare = env.MOIRE.prepare;
  let reads = 0;
  env.MOIRE.prepare = (sql) => { reads++; return prepare(sql); };
  for (const q of ['', '?a', '?b']) assert.deepEqual(await (await apiMoireFinds(new Request('https://hexfield.org/api/moire/finds' + q), env)).json(), { version: 4, finds: [] });
  assert.equal(reads, 1, 'read the memory once per ask');
  delete globalThis.caches;
}
console.log('moiré shared memory: takes only finds, keeps the best and the newest, gives back the most promising');
