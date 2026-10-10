/* Hexfield 329 — autonomous styles: honest previews, guarded full selection,
 * zero additional passes, explicit user locks, and exact manual repeats.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STYLE_PRESETS} from '../public/studio/style-presets.js';
import {styleAuditions,reserveStyleFinalist,chooseStyleWinner} from
 '../public/studio/auto-style.js';

const ids=STYLE_PRESETS.map(x=>x.id);
assert.equal(ids.length,5);
assert.deepEqual(styleAuditions({selected:'ink',cycle:0,count:3}),
 ['ink','stipple','engrave']);
assert.deepEqual(styleAuditions({selected:'ink',cycle:0,count:3}),
 styleAuditions({selected:'ink',cycle:0,count:3}),
 'Same style and generation must reproduce the same audition order');
assert.deepEqual(styleAuditions({selected:'poster',previous:'engrave',
 cycle:2,count:2}),['engrave','expression']);
assert.deepEqual(styleAuditions({selected:'poster',previous:'engrave',
 cycle:2,count:2,locked:true}),[null,null]);
assert.equal(styleAuditions({selected:'ink',cycle:2,count:99}).length,3);
assert.equal(styleAuditions({selected:'ink',cycle:2,count:0}).length,0);
const visited=new Set();
for(let cycle=0;cycle<18;cycle++)
 for(const id of styleAuditions({selected:'ink',cycle,count:3}))
  visited.add(id);
assert.deepEqual(visited,new Set(ids),
 'Across chapters the machine MUST audition all five real mark grammars');

const audition=(style,score,quality=score,qualified=true)=>({
 recipe:{styleId:style},preflight:{score,
  golden:{qualifies:qualified}},
 threeWay:{score,H:quality,phi:quality},
 golden:{qualifies:qualified}
});
const first=audition('ink',.7),second=audition('ink',.68),
 alternate=audition('poster',.665);
const coarse=[first,second,alternate];
const allocated=reserveStyleFinalist(coarse,[first,second],{
 cycle:2,previous:'ink'
});
assert.equal(allocated.length,2,'Style trials must NEVER increase full render cost');
assert.ok(allocated.includes(alternate),
 'A credible non-ink style must get one of the budgeted physical trials');
assert.ok(allocated.includes(first),'A credible challenger cannot erase the leader');
assert.deepEqual(reserveStyleFinalist(coarse,[first,second],{
 cycle:2,previous:'ink',locked:true}),[first,second],
 'An explicit law lock forbids autonomous style substitutions');
assert.deepEqual(reserveStyleFinalist(coarse,[first],{
 cycle:2,previous:'ink'}),[first],
 'A thermally limited phone must not be forced into extra full renders');
assert.deepEqual(reserveStyleFinalist(coarse,[first,second],{
 cycle:1,previous:'ink'}),[first,second],
 'Reserve alternate physical execution only on exploration chapters');
const unqualified=audition('stipple',.66,.67,false);
assert.deepEqual(reserveStyleFinalist([first,second,unqualified],
 [first,second],{cycle:2,previous:'ink',strict:true}),[first,second],
 'In strict golden mode an unqualified technique must not displace a qualified winner');
const weak=audition('expression',.59,.1);
assert.deepEqual(reserveStyleFinalist([first,second,weak],
 [first,second],{cycle:2,previous:'ink'}),[first,second],
 'A weak cheap sketch cannot consume a full expensive render');

const almost=audition('poster',.678,.677);
let picked=chooseStyleWinner([first,almost],{
 cycle:2,previous:'ink'});
assert.equal(picked.winner,almost);
assert.equal(picked.reason,'credible-new-technique');
assert.equal(chooseStyleWinner([first,almost],{
 cycle:1,previous:'ink'}).winner,first,
 'Outside exploration generation the physically best painting wins');
assert.equal(chooseStyleWinner([first,almost],{
 cycle:2,previous:'ink',locked:true}).winner,first);
assert.equal(chooseStyleWinner([first,weak],{
 cycle:2,previous:'ink'}).winner,first,
 'Changing the style name cannot override clearly worse image evidence');
assert.equal(chooseStyleWinner([first,unqualified],{
 cycle:2,previous:'ink',strict:true}).winner,first,
 'STRICT φ must outrank technique novelty');
assert.equal(chooseStyleWinner([],{}).winner,null);

const loop=readFileSync('public/studio/abstraction-loop.js','utf8');
const ui=readFileSync('public/studio/rule-studio.js','utf8');
assert.match(loop,/styleAuditions\(\{/);
assert.match(loop,/reserveStyleFinalist\(proposals,finalists/);
assert.match(loop,/chooseStyleWinner\(ranked/);
assert.match(loop,/style:autopilot\?auditions\[attempt\]/);
assert.match(loop,/styleById\(recipe\.styleId\|\|config\.style\)/,
 'Each style must use its own real source-mixing technique, not a fixed hybrid');
assert.match(loop,/last=cloneCanvas\(canvas,width,height\)/,
 'External accepted image must be cloned as the new automatic parent');
assert.match(loop,/lastRecipe=structuredClone\(recipe\)/);
assert.match(ui,/style:styleId,autoStyle:true/);
assert.match(ui,/loop\.adoptCanvas\(unlettered\|\|target,recipe\)/);
assert.match(ui,/result\.styleAudition\.considered/);
assert.match(ui,/useNewReference\?\s*await sourceFor\(sourceRecipe\)/,
 'Explicit upload and archive switches must take precedence over cached prior art');
console.log('329: automatic executable technique variety, W/phi/H safety, bounded mobile allocation, and real manual-to-auto rebasing PASS');
