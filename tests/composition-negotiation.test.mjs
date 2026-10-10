/* Build 324 — real neighbour votes over genuine pigment and contour change. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const storage=new Map();
globalThis.localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,v)=>storage.set(key,String(v))
};
globalThis.document={hidden:false,createElement(type){
 assert.equal(type,'canvas');return new Canvas(1,1);
}};
const {regionRects,createRegionMemory}=await import(
 '../public/studio/regional-judgement.js');
const {pairCoherence,selectNegotiation,proposeInfluence,
 negotiateComposition,createCompositionMemory,loadCompositionMemory,
 saveCompositionMemory,updateCompositionMemory,MAX_NEGOTIATED_PATCHES}
 =await import('../public/studio/composition-negotiation.js');
const W=360,H=240;
const canvas=()=>new Canvas(W,H);
const getPixels=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
function createScene(){
 const c=canvas(),ctx=c.getContext('2d');
 const regions=regionRects(W,H);
 ctx.fillStyle='#b94e35';ctx.fillRect(0,0,W,H);
 // A contrasting district is surrounded by compatible but distinct
 // neighbours; its preferred alliance is not a uniform final image.
 const center=regions.find(r=>r.id==='region-1-1');
 ctx.fillStyle='#3451d7';
 ctx.fillRect(center.x,center.y,center.w,center.h);
 ctx.fillStyle='#da8b50';ctx.fillRect(20,20,40,36);
 ctx.fillStyle='#872c4a';ctx.fillRect(260,162,56,33);
 return c;
}
function outsideEqual(a,b,rect){
 const pixelsA=getPixels(a),pixelsB=getPixels(b);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(x>=rect.x&&x<rect.x+rect.w&&
   y>=rect.y&&y<rect.y+rect.h)continue;
  const offset=(y*W+x)*4;
  for(let k=0;k<4;k++)assert.equal(pixelsA[offset+k],pixelsB[offset+k],
   'Only a single follower region may change after neighbours negotiate');
 }
}
const golden=(1+Math.sqrt(5))/2;
const a={palette:[200,64,34],edges:.4,edgeAngle:0},
 b={palette:[45,84,200],edges:.25,edgeAngle:Math.PI*.618};
const compare=pairCoherence(a,b);
assert.ok(compare.score>=0&&compare.score<=1);
assert.ok(compare.colour>=0&&compare.geometry<=1);
assert.ok(Math.abs(compare.pigmentDifference-
  Math.hypot(155,-20,-166)/(255*Math.sqrt(3)))<.0001);
assert.ok(Math.abs(1/(golden*golden)-.381966)<.0001);
const memory=createRegionMemory();
for(const item of Object.values(memory.cells)){
 item.quality=.95;item.stability=.64;item.age=4;
}
memory.cells['region-1-1']={...memory.cells['region-1-1'],
 quality:.03,stability:0};
const base=createScene(),original=getPixels(base),blank=createCompositionMemory();
const selection=selectNegotiation({canvas:base,memory,cycle:4,attempt:0});
assert.equal(selection?.follower.rect.id,'region-1-1',
 'Only needy district should be selected as a possible follower');
assert.ok(Math.abs(selection.leader.rect.column-1)+
 Math.abs(selection.leader.rect.row-1)===1,
 'Influence must originate from an ACTUAL adjacent region');
const change=proposeInfluence(base,selection.leader,selection.follower,{
 seed:3571,strength:.26
});
assert.equal(change.patch.width,120);
assert.equal(change.patch.height,80);
assert.ok(change.coverage>.001,'Real pixels change under neighbour influence');
assert.ok(change.palette.every(x=>x>=0&&x<=255));
const chosen=selection.follower.rect;
const snapshots=[];
const result=negotiateComposition({
 canvas:base,memory,compositionMemory:blank,cycle:4,
 grade:()=>({score:.71}),
 threshold:.0,
 onDecision:(d,c)=>snapshots.push({d,pixels:getPixels(c)})
});
assert.equal(result.attempts,1);
assert.equal(snapshots.length,1,'Every local debate must have an observable vote');
assert.ok(result.decision.neighborhood.length>=2);
assert.ok(result.decision.neighborhood.every(v=>
  Number.isFinite(v.vote)&&Number.isFinite(v.weight)&&
  typeof v.support==='boolean'));
assert.equal(result.decision.from,selection.leader.rect.id);
assert.equal(result.decision.to,selection.follower.rect.id);
assert.ok(result.decision.from!==result.decision.to);
assert.ok(result.decision.supporters+result.decision.opponents>=2);
assert.equal(result.decision.accepted,result.accepted===1);
outsideEqual(base,originalCanvas(original),chosen);
if(result.accepted)assert.notDeepEqual(getPixels(base),original,
 'An accepted treaty must carry authentic revised pixels into one district');
// Composition memory inherits ONLY the finally selected painting vote.
assert.equal(blank.generation,0);
assert.deepEqual(blank.treaties,{});
const next=updateCompositionMemory(blank,result.decision,1);
assert.equal(next.generation,1);
assert.equal(next.history.length,1);
assert.equal(next.history[0].accepted,result.decision.accepted);
assert.ok(saveCompositionMemory(next));
assert.deepEqual(loadCompositionMemory(),next);
const ignored=negotiateComposition({
 canvas:createScene(),memory,compositionMemory:next,cycle:5,
 locked:true});
assert.equal(ignored.attempts,0,'Artist-locked constraints must win');
const sparse=negotiateComposition({
 canvas:createScene(),memory,compositionMemory:next,
 dirtyTiles:[{x:0,y:0,w:30,h:30}]});
assert.equal(sparse.attempts,0,
 'Sparse-render pixel conservation overrides all composition treaties');
const protectedMemory=createRegionMemory();
for(const cell of Object.values(protectedMemory.cells)){
 cell.quality=.97;cell.stability=.7;
}
protectedMemory.cells['region-1-1'].quality=.02;
protectedMemory.cells['region-1-1'].stability=0;
const protectedAreas=[{age:8,volatility:.02,bbox:{
 x:1/3,y:1/3,w:1/3,h:1/3
}}];
const protectedSelection=selectNegotiation({canvas:createScene(),
 memory:protectedMemory,objects:protectedAreas});
assert.notEqual(protectedSelection?.follower.rect.id,'region-1-1',
 'Stable artistic ancestors cannot be negotiated away');
assert.ok(MAX_NEGOTIATED_PATCHES===1);
assert.ok(Object.keys(next.treaties).length<=1);
function originalCanvas(data){
 const c=canvas();
 const ctx=c.getContext('2d');
 const image=ctx.createImageData(W,H);
 image.data.set(data);
 ctx.putImageData(image,0,0);
 return c;
}
console.log('324: neighbouring visual regions negotiate true geometric/pigment changes; parent pixels, local identities, sparse and user locks remain protected PASS');
