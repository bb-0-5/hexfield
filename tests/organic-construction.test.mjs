/* Hexfield 321: executed mark footprints and genuine pigment contours,
 * with live rethink/erasure and exact final-pixel conservation.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
globalThis.document={hidden:false,createElement(tag){
 assert.equal(tag,'canvas');return new Canvas(1,1);
}};
const {gestureBounds,gesturePath,extractRasterContours,contourPath,
 buildOrganicStages,revealOrganic}=await import(
 '../public/studio/organic-construction.js');
const {createLivingPainting}=await import('../public/studio/live-painting.js');
function drawing(altered=false){
 const c=new Canvas(240,160),ctx=c.getContext('2d');
 ctx.fillStyle=altered?'#f1dcc1':'#e1dfc8';
 ctx.fillRect(0,0,240,160);
 ctx.fillStyle=altered?'#b62b3e':'#7b454c';
 ctx.fillRect(26,15,70,120);
 ctx.fillStyle=altered?'#2765c7':'#5578ab';
 ctx.fillRect(126,46,94,80);
 ctx.fillStyle=altered?'#43a656':'#5d7458';
 ctx.fillRect(90,113,40,36);
 return c;
}
const old=drawing(false),final=drawing(true),sketch=drawing(true);
const trace={marks:[
 {type:'line',x:19,y:20,a:76,b:57,width:6},
 {type:'rect',x:145,y:61,a:32,b:45},
 {type:'circle',x:47,y:66,a:19},
 {type:'polygon',points:[[128,100],[170,90],[175,132],[129,140]]}
]};
const contours=extractRasterContours(final,{columns:48,rows:32});
assert.ok(contours.length>=2,'Actual final pigments should form distinct regions');
assert.ok(contours.some(x=>x.loops.some(l=>l.length>4)));
assert.ok(contours.every(x=>x.type==='contour'&&x.bounds.w>0));
assert.ok(contours.every(x=>x.loops.every(points=>points.length>=4)));
assert.deepEqual(contours,extractRasterContours(final,{columns:48,rows:32}),
 'Contour extraction must be deterministic for same genuine raster');
const pathCanvas=new Canvas(240,160),ctx=pathCanvas.getContext('2d');
for(const mark of trace.marks){
 assert.ok(gestureBounds(mark));
 assert.equal(gesturePath(ctx,mark),true);
 ctx.clip();ctx.restore?.();
}
assert.equal(gestureBounds({type:'circle',x:47,y:66,a:19}).w,38);
assert.equal(gestureBounds({type:'line',x:19,y:20,a:76,b:57,width:6}).w,69);
assert.equal(contourPath(ctx,contours[0]),true);
const plan=buildOrganicStages({final,parent:old,sketch,trace,
 objects:[{age:4,volatility:.02,bbox:{x:.1,y:.08,w:.24,h:.7}}],
 wordBounds:{x:90,y:70,w:128,h:70}});
assert.ok(plan.gestures.length>=4);
assert.ok(plan.contours.length>=2);
assert.ok(plan.erases.length>0,'Real discarded sketch must have erase regions');
assert.ok(plan.stages.some(x=>x.type==='gesture'));
assert.ok(plan.stages.some(x=>x.type==='contour'));
assert.equal(plan.total,plan.stages.length);
const filtered=buildOrganicStages({final,parent:old,sketch,trace,
 dirtyTiles:[{x:0,y:0,w:96,h:160}]});
assert.ok(filtered.gestures.length<plan.gestures.length);
assert.ok(filtered.contours.every(c=>c.bounds.x<96));
const copy=new Canvas(240,160);
copy.getContext('2d').drawImage(old,0,0);
const before=Buffer.from(copy.getContext('2d').
 getImageData(0,0,240,160).data);
const moved=revealOrganic(copy,final,plan.stages,0,1);
assert.equal(moved,1);
const after=Buffer.from(copy.getContext('2d').
 getImageData(0,0,240,160).data);
assert.notDeepEqual(after,before,'Actual accepted ink must change real pixels');
assert.notDeepEqual(after,Buffer.from(final.getContext('2d').
 getImageData(0,0,240,160).data),
 'One executed mark must not reveal the entire rectangular final painting');
const frameQueue=[],cancelled=new Set(),events=[];
let clock=0,frameId=0;
const displayed=new Canvas(240,160);
const painter=createLivingPainting({
 canvas:displayed,
 clock:()=>clock,
 requestFrame:fn=>{const id=++frameId;frameQueue.push({id,fn});return id;},
 cancelFrame:id=>cancelled.add(id),
 reducedMotion:()=>false,
 onPhase:phase=>events.push({...phase})
});
painter.preview({painting:sketch,parent:old,trial:1,total:3});
const out=painter.commit({parent:old,final,trace,duration:500,
 wordBounds:{x:90,y:70,w:128,h:70}});
for(let i=0;i<40&&frameQueue.length;i++){
 const job=frameQueue.shift();
 if(cancelled.has(job.id))continue;
 clock+=25;job.fn(clock);
}
const completed=await out;
assert.equal(completed.reason,'completed');
assert.ok(completed.organic.gestures.length>=4);
assert.ok(completed.organic.contours.length>=2);
assert.ok(events.some(e=>e.phase==='reconsider'),
 'An actual rough study must be visibly corrected by parent pixels');
assert.ok(events.some(e=>e.phase==='construct'&&e.done>0),
 'Real executed marks and pigment boundaries must be progressively revealed');
assert.ok(events.some(e=>e.phase==='complete'));
assert.ok(events.some(e=>e.phase==='construct'&&e.done<e.total));
assert.deepEqual(
 Buffer.from(painterCanvas().getContext('2d').getImageData(0,0,240,160).data),
 Buffer.from(final.getContext('2d').getImageData(0,0,240,160).data),
 'The finished canvas MUST match actual evaluated source pixels exactly'
);
function painterCanvas(){return displayed;}

console.log('321 organic marks, pigment contours, erasure and exact final art PASS');
