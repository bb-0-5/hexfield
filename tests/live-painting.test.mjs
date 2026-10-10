/* 320 — the painted PROCESS is now visible on the production canvas. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
globalThis.document={
 hidden:false,createElement(tag){assert.equal(tag,'canvas');return new Canvas(1,1);}
};
const {constructionPlan,paintConstructionSlice,
 createLivingPainting}=await import('../public/studio/live-painting.js');
function scene(col,detail=false){
 const c=new Canvas(192,128),ctx=c.getContext('2d');
 ctx.fillStyle=col;ctx.fillRect(0,0,c.width,c.height);
 if(detail){
  ctx.fillStyle='#cb3929';ctx.fillRect(28,22,40,51);
  ctx.fillStyle='#2360c4';ctx.fillRect(87,41,92,48);
  ctx.fillStyle='#eee4c2';ctx.fillRect(17,105,162,16);
 }
 return c;
}
const parent=scene('#d8dbb8'),final=scene('#f2f0d8',true),
  shown=scene('#202020'),sketch=scene('#23622f',true);
function pixels(c){
 return Buffer.from(c.getContext('2d',{willReadFrequently:true}).
   getImageData(0,0,c.width,c.height).data);
}
const dataBefore=pixels(parent),dataFinal=pixels(final);
const registry=[{bbox:{x:.12,y:.16,w:.24,h:.4},
 age:4,volatility:.02}];
const trace={marks:[{type:'rect',x:50,y:43,a:35,b:27},
 {type:'rect',x:52,y:44,a:35,b:27},{type:'line',x:49,y:44,a:60,b:62}]};
const plan=constructionPlan({width:192,height:128,
 parent,final,trace,objects:registry,
 wordBounds:{x:70,y:70,w:115,h:52},tile:32});
assert.ok(plan.total>8&&plan.total===24);
assert.ok(plan.inherited>0&&plan.lettering>0);
assert.ok(plan.tiles.some(t=>t.markHits>0));
assert.ok(plan.tiles.at(0).order<=plan.tiles.at(-1).order);
assert.deepEqual(plan.tiles,
 constructionPlan({width:192,height:128,parent,final,
 trace,objects:registry,wordBounds:{x:70,y:70,w:115,h:52},tile:32}).tiles,
 'The making order must be reproducible for the same actual marks');
const scratch=scene('#d8dbb8');
const count=paintConstructionSlice(scratch,final,plan.tiles,0,2);
assert.equal(count,2);
assert.notDeepEqual(pixels(scratch),dataFinal,
 'Visible construction must not be an instant pre-rendered full image');
const events=[],queue=[],cancelled=new Set();
let t=0,serial=0;
const requestFrame=cb=>{const id=++serial;queue.push({id,cb});return id;};
const process=createLivingPainting({
 canvas:shown,onPhase:p=>events.push(p),
 clock:()=>t,requestFrame,cancelFrame:id=>cancelled.add(id),
 reducedMotion:()=>false
});
process.preview({painting:sketch,parent,trial:1,total:3});
assert.equal(process.getState().phase,'sketch');
assert.notDeepEqual(pixels(shown),dataFinal);
assert.deepEqual(pixels(parent),dataBefore,
 'Preview must not mutate the accepted parent used for next generation');
const pending=process.commit({parent,final,trace,
 wordBounds:{x:70,y:70,w:115,h:52},objects:registry,duration:480});
assert.equal(process.getState().phase,'construct');
assert.notDeepEqual(pixels(shown),dataFinal);
let stages=0;
while(queue.length&&stages<30){
 const frame=queue.shift();if(cancelled.has(frame.id))continue;
 t+=45;frame.cb(t);stages++;
 if(stages===4){
  const fragment=pixels(shown);
  assert.notDeepEqual(fragment,dataFinal);
  assert.notDeepEqual(fragment,dataBefore,
   'Actual image material must become visible incrementally');
 }
}
const outcome=await pending;
assert.equal(outcome.reason,'completed');
assert.deepEqual(pixels(shown),dataFinal,
 'The production canvas MUST be the exact final evaluated painting');
assert.deepEqual(pixels(final),dataFinal);
assert.ok(events.some(e=>e.phase==='construct'&&e.done>0&&e.done<e.total));
assert.ok(events.some(e=>e.phase==='complete'));
process.preview({painting:sketch,parent,trial:0,total:2});
const interrupted=process.commit({parent,final,duration:1100});
const stalledBefore=process.getState();
assert.equal(stalledBefore.phase,'construct');
process.stop({finalize:true});
assert.equal((await interrupted).reason,'interrupted');
assert.deepEqual(pixels(shown),dataFinal,
 'Cancelling a movie must restore the COMPLETE accepted painting');
const partial=constructionPlan({width:192,height:128,
 parent,final,dirtyTiles:[{x:0,y:0,w:32,h:32}],tile:32});
assert.equal(partial.total,1);
assert.equal(partial.skipped,23,
 'Sparse paintings animate only physically changed tiles');
const motionless=createLivingPainting({
 canvas:shown,reducedMotion:()=>true,requestFrame
});
const instant=await motionless.commit({parent,final,trace});
assert.equal(instant.reason,'instant');
assert.deepEqual(pixels(shown),dataFinal,
 'Reduced motion must still show EXACT full accepted painting');
const pristine=scene('#c8c6a5'),canvas=scene('#a0a0a0');
const first=createLivingPainting({canvas,
 requestFrame,cancelFrame:id=>cancelled.add(id),clock:()=>t,reducedMotion:()=>false});
first.preview({painting:sketch,trial:0,total:3});
const noParent=first.commit({final:pristine,duration:350});
assert.equal(first.getState().phase,'construct');
assert.notDeepEqual(pixels(canvas),pixels(pristine),
 'First automatic painting should construct from actual visible sketch');
first.stop({finalize:true});
assert.equal((await noParent).reason,'interrupted');
console.log('320: real candidate studies and incremental exact production pixels, one visible canvas, inherited shapes, word-last assembly, cancellation, reduced-motion PASS');
