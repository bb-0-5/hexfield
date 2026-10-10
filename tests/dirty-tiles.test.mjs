/* Build 318 — proof of actual skipped cell work and unchanged ink.
 * Verify precise outside-tile bytes, safe global fallbacks and reused donors.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
globalThis.document={createElement(name){assert.equal(name,'canvas');return new Canvas(1,1)}};
const {planDirtyTiles,shouldUseLocalRender,validDirtyTiles,sameOutsideDirty,
  tilesCoverage}=await import('../public/studio/dirty-tiles.js');
const {prepareMixSamples,mixSources}=await import('../public/studio/source-mixer.js');
const {makeRecipe,applyRules}=await import('../public/studio/rule-engine.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const W=480,H=300;
function surface(change=0){
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#e3cfab';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#354a77';ctx.fillRect(30,35,140,180);
 ctx.fillStyle='#bd5735';ctx.fillRect(225,90,180,140);
 if(change){
   ctx.fillStyle='#d5d43c';ctx.fillRect(240,75,100,110);
   ctx.fillStyle='#164c75';ctx.fillRect(278,130,100,76);
 }
 return c;
}
const previous=surface(),future=surface(1);
const plan=planDirtyTiles(previous,future,{seed:92,cycle:5});
assert.ok(plan&&plan.dirtyTiles>0);
assert.ok(plan.coverage>0&&plan.coverage<.24);
assert.ok(plan.skippedTiles>plan.dirtyTiles);
assert.ok(validDirtyTiles(plan.tiles,W,H));
assert.deepEqual(plan,planDirtyTiles(previous,future,{seed:92,cycle:5}),
  'Dirty region scheduling must be deterministic for the same source');
assert.equal(validDirtyTiles([{x:-1,y:0,w:10,h:10}],W,H),false);
assert.equal(validDirtyTiles([{x:0,y:0,w:480,h:300}],W,H),false,
  'Large or global modifications cannot sneak through the sparse painter');
const sum=tilesCoverage(plan.tiles,W,H);
assert.ok(Math.abs(sum-plan.coverage)<1e-6);
const donor={name:'parent',canvas:previous},
  supplied=[donor,{name:'terrain',canvas:future}];
const samples=prepareMixSamples(supplied,{width:W,height:H});
const mixed=mixSources(supplied,{width:W,height:H,cycle:5,seed:92,
  mode:'edges',prepared:samples,dirtyTiles:plan.tiles});
assert.equal(mixed.stats.partial,true);
assert.equal(mixed.stats.processedPixels,Math.round(sum*W*H));
assert.ok(mixed.stats.savedPixels>=W*H*.76,
 'Unchanged scene pixels must NOT be composited');
assert.ok(sameOutsideDirty(mixed.canvas,previous,plan.tiles),
 'The mixer must retain parent pixels outside the requested tiles');
const recipe=makeRecipe({seed:92,subject:'abstract',primary:'no_curves',mark:'hybrid'});
const local=new Canvas(W,H);
const metrics=applyRules(mixed.canvas,local,recipe,{
 iteration:5,trace:true,baseCanvas:previous,
 dirtyTiles:plan.tiles,localApplication:true
});
assert.equal(metrics.dirty.partial,true);
assert.ok(metrics.dirty.omittedCells>metrics.dirty.visitedCells,
 'The drawing engine must ACTUALLY skip most mark cells');
assert.ok(metrics.dirty.visitedCells<metrics.dirty.totalCells*.55);
assert.ok(sameOutsideDirty(local,previous,plan.tiles),
 'The rule painter must preserve every unchanged pixel EXACTLY');
const beforeWords=new Canvas(W,H);
beforeWords.getContext('2d').drawImage(local,0,0);
const words=paintWordsOnCanvas(local,'HEXFIELD',{
 recipe,seed:92,iteration:5,dirtyTiles:plan.tiles
});
assert.ok(words.painted&&words.count>1000);
assert.ok(words.fontSize>=20,'The text should not silently fall back to 10px glyphs');
assert.ok(sameOutsideDirty(local,beforeWords,plan.tiles),
 'Editing word material must conserve all previous lettering outside dirty tiles');
let changed=0;
const p=previous.getContext('2d').getImageData(0,0,W,H).data,
 q=local.getContext('2d').getImageData(0,0,W,H).data;
for(const t of plan.tiles){
 for(let y=t.y;y<t.y+t.h;y++)for(let x=t.x;x<t.x+t.w;x++){
  const i=(y*W+x)*4;
  if(p[i]!==q[i]||p[i+1]!==q[i+1]||p[i+2]!==q[i+2])changed++;
 }
}
assert.ok(changed>100,'The dirty region must contain real rule-painted marks');
const global=new Canvas(W,H);
const globalMetrics=applyRules(mixed.canvas,global,recipe,{iteration:5});
assert.equal(globalMetrics.dirty.partial,false);
assert.equal(globalMetrics.dirty.omittedCells,0);
assert.ok(!sameOutsideDirty(global,previous,plan.tiles),
 'Ordinary global painting must remain a REAL full-frame repaint');
const bad=new Canvas(W,H);
const fallback=applyRules(mixed.canvas,bad,recipe,{
 baseCanvas:previous,localApplication:true,
 dirtyTiles:[{x:0,y:0,w:W,h:H}]
});
assert.equal(fallback.dirty.partial,false,
 'Unsafe partial requests must automatically fall back to full repaint');
for(const args of [
 {cycle:0,previous,inherited:recipe},
 {cycle:1,previous:null,inherited:recipe},
 {cycle:1,previous,inherited:recipe,words:'HELLO',textChanged:true},
 {cycle:1,previous,inherited:recipe,donorsRefreshed:true},
 {cycle:1,previous,inherited:recipe,forceFull:true},
 {cycle:2,previous,inherited:recipe}
])assert.equal(shouldUseLocalRender(args),false,
  'Global event/changed words/missing parent must disable partial computation');
assert.equal(shouldUseLocalRender({cycle:1,previous,inherited:recipe}),true);
assert.equal(shouldUseLocalRender({cycle:1,previous,inherited:recipe,
  words:'HEXFIELD',textChanged:false}),true,
  'Unchanged on-canvas words must not disable the fast path');
const tiny=new Canvas(240,145),tinyOther=new Canvas(240,145);
tiny.getContext('2d').drawImage(previous,0,0,240,145);
tinyOther.getContext('2d').drawImage(future,0,0,240,145);
const smallPlan=planDirtyTiles(tiny,tinyOther,{seed:92,cycle:1});
assert.ok(smallPlan?.coverage>0&&smallPlan.coverage<=.24,
 'A small phone canvas must still be able to render sparingly');
console.log('318 / dirty tiles: exact unchanged pixels, skipped real rule cells, sparse donor mixing, global fallback PASS');
