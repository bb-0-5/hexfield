/* Build 326: selectively forget underperforming painted forms and
 * reconstruct dormant ideas from tiny ACTUAL accepted-painting silhouettes.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
const store=new Map();
globalThis.document={hidden:false,createElement(name){
 assert.equal(name,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={
 getItem:k=>store.get(k)||null,
 setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k)
};
const {adoptVisualIdentity}=await import('../public/studio/living-identity.js');
const {CREATIVE_MEMORY_KEY,RECALL_EVERY,
 createCreativeMemory,loadCreativeMemory,saveCreativeMemory,
 sampleVisualSignature,measureHabit,settleCreativeMemory,
 scheduleRediscovery,paintHistoricalSilhouette,
 attemptRediscovery}=await import('../public/studio/creative-forgetting.js');
const W=360,H=240;
function art(){
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#d3e1dd';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#e33630';ctx.fillRect(20,22,93,86);
 ctx.fillStyle='#2e6be0';ctx.fillRect(212,89,106,104);
 ctx.fillStyle='#23a74a';ctx.fillRect(93,146,38,57);
 return c;
}
function blank(){
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#22252a';ctx.fillRect(0,0,W,H);
 return c;
}
const pixels=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true})
 .getImageData(0,0,W,H).data);
function outsideSame(a,b,box){
 const first=pixels(a),second=pixels(b);
 const x=Math.floor(box.x*W),y=Math.floor(box.y*H),
  w=Math.ceil(box.w*W),h=Math.ceil(box.h*H);
 for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){
  if(xx>=x&&xx<x+w&&yy>=y&&yy<y+h)continue;
  const off=(yy*W+xx)*4;
  for(let c=0;c<4;c++)assert.equal(first[off+c],second[off+c],
   'A forgotten idea may return only in its own compact footprint');
 }
}
let identity=adoptVisualIdentity(null,art());
assert.match(identity.root,/^vision-/);
assert.ok(identity.anchors.length>=1);
const first=identity.anchors[0];
assert.ok(measureHabit(art(),first)>=.29,
 'Traditions should be based on the actual appearance of an accepted form');
assert.ok(measureHabit(blank(),first)<.29,
 'A vanished form is measurable rather than being immortal');
const sign=sampleVisualSignature(art(),first);
assert.equal(sign.id,first.id);
assert.equal(sign.mask.length,96);
assert.ok(sign.mask.includes('1')&&sign.mask.includes('0'));
assert.ok(!JSON.stringify(sign).includes('data:image'),
 'An archived silhouette must not be a compressed copy of a full bitmap');
let memory=createCreativeMemory(identity.root);
assert.equal(memory.archive.length,0);
let summary=settleCreativeMemory(memory,identity,art(),{generation:1});
identity=summary.identity;memory=summary.memory;
assert.ok(memory.habits[first.id]?.snapshot?.mask.length===96);
assert.ok(memory.habits[first.id].streak>=1);
assert.equal(summary.events.length,0);
for(let generation=2;generation<=4;generation++){
 summary=settleCreativeMemory(memory,identity,blank(),{generation});
 identity=summary.identity;memory=summary.memory;
}
assert.ok(summary.events.some(e=>e.type==='FORGOT'));
assert.ok(!identity.anchors.some(a=>a.id===first.id),
 'A no-longer-visible signature must STOP being reimposed as inherited art');
assert.ok(memory.archive.some(a=>a.id===first.id),
 'Only tiny accepted-pixel shape recipes survive creative forgetting');
assert.equal(memory.forgotten>=1,true);
assert.ok(memory.archive.length<=4);
assert.equal(saveCreativeMemory(memory),true);
assert.deepEqual(loadCreativeMemory(identity.root),memory);
assert.deepEqual(loadCreativeMemory('vision-different').archive,[],
 'A different visual root must never inherit another painting memory');
assert.ok(store.get(CREATIVE_MEMORY_KEY).length<3600,
 'Persistent habits, traditions and silhouettes must remain small');
const dormant=memory.archive.find(a=>a.id===first.id);
assert.ok(scheduleRediscovery({identity,memory,generation:8}));
assert.equal(8%RECALL_EVERY,0);
assert.equal(scheduleRediscovery({identity,memory,generation:7}),null);
assert.equal(scheduleRediscovery({identity,memory,generation:8,locked:true}),null);
assert.equal(scheduleRediscovery({identity,memory,generation:8,
 dirtyTiles:[{x:0,y:0,w:40,h:40}]}),null);
const original=blank(),patched=blank();
assert.ok(paintHistoricalSilhouette(patched,dormant)>0);
assert.notDeepEqual(pixels(patched),pixels(original),
 'Rediscovery should create REAL new pixels from a historical material imprint');
outsideSame(patched,original,dormant.box);
const ignore=blank(),before=pixels(ignore);
const rejected=attemptRediscovery({canvas:ignore,identity,memory,
 generation:8,judge:()=>({score:.5}),minImprovement:.01});
assert.equal(rejected.attempted,true);
assert.equal(rejected.accepted,false);
assert.deepEqual(pixels(ignore),before,
 'An unaesthetic resurrection may not change actual canvas pixels');
const active=blank(),messages=[];
const recall=attemptRediscovery({canvas:active,identity,memory,
 generation:8,minImprovement:.01,
 judge:canvas=>({score:pixels(canvas).equals(before)?.1:.9}),
 onTrial:e=>messages.push(e)});
assert.equal(recall.attempted,true);
assert.equal(recall.accepted,true);
assert.ok(messages[0].marks>0&&messages[0].accepted);
assert.notDeepEqual(pixels(active),before);
outsideSame(active,original,recall.signature.box);
assert.ok(memory.archive.some(a=>a.id===recall.signature.id),
 'Trial acceptance must NOT mutate persistent memory before global judgement');
const won=settleCreativeMemory(memory,identity,active,{
 generation:8,recall});
assert.ok(won.events.some(e=>e.type==='RETURNED'));
assert.ok(won.identity.anchors.some(a=>a.id===recall.signature.id),
 'Only GLOBALLY selected resurrection becomes a living ancestry form');
assert.ok(!won.memory.archive.some(a=>a.id===recall.signature.id));
assert.ok(won.memory.rediscovered>=1);
assert.equal(memory.rediscovered,0,
 'Rejected global candidates must not mutate old memory in-place');
assert.ok(won.memory.events.length<=8);
assert.ok(won.memory.archive.length<=4);
const again=blank();
const later=attemptRediscovery({canvas:again,
 identity:won.identity,memory:won.memory,generation:12});
assert.ok(!later.attempted||later.signature.id!==recall.signature.id,
 'A returned LIVING form cannot be reintroduced again; a different still-forgotten form may be reviewed');
const locked=blank(),lockBefore=pixels(locked);
assert.equal(attemptRediscovery({canvas:locked,identity,memory,
 generation:8,locked:true}).attempted,false);
assert.equal(attemptRediscovery({canvas:locked,identity,memory,
 generation:8,dirtyTiles:[{x:0,y:0,w:12,h:12}]}).attempted,false);
assert.deepEqual(pixels(locked),lockBefore);
const covered=blank();
assert.equal(paintHistoricalSilhouette(covered,dormant,{wordBounds:{
 x:dormant.box.x*W,y:dormant.box.y*H,
 w:dormant.box.w*W,h:dormant.box.h*H}}),0,
 'An archived visual form must never overwrite user lettering');
store.set(CREATIVE_MEMORY_KEY,JSON.stringify({...memory,archive:[
 {...dormant,mask:'1'.repeat(600),box:{x:-2,y:1,w:1,h:1}}]}));
assert.equal(loadCreativeMemory(identity.root).archive.length,0,
 'Tampered silhouettes and invalid geometry are never drawn');
console.log('326: tradition, selective forgetting, truthful compact historical silhouettes, gated rediscovery, winner-only learning, hard locks and exact outside-pixel protection PASS');
