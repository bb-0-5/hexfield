/* Build 323 — a painting with nine independent regional judgements.
 * Tests genuine local rerender, independent history and exact preservation.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const storage=new Map();
globalThis.localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,String(value))
};
globalThis.document={hidden:false,createElement(name){
 assert.equal(name,'canvas');return new Canvas(1,1);
}};
const {createRegionMemory,loadRegionMemory,saveRegionMemory,REGION_GRID,
 regionRects,selectReviewRegions,scoreRegion,alternativeRegionalMark,
 updateRegionMemory,auditRegions}=await import('../public/studio/regional-judgement.js');
const {makeRecipe,applyRules}=await import('../public/studio/rule-engine.js');
const W=360,H=240;
function artwork(colour='#b4b6b5'){
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle=colour;ctx.fillRect(0,0,W,H);return c;
}
function pixels(c){
 return Buffer.from(c.getContext('2d',{willReadFrequently:true}).
  getImageData(0,0,W,H).data);
}
function exactlyOutside(a,b,rect){
 const x=a.getContext('2d').getImageData(0,0,W,H).data;
 const y=b.getContext('2d').getImageData(0,0,W,H).data;
 for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){
  if(ix>=rect.x&&ix<rect.x+rect.w&&iy>=rect.y&&iy<rect.y+rect.h)continue;
  const offset=(iy*W+ix)*4;
  for(let c=0;c<4;c++)assert.equal(x[offset+c],y[offset+c],
   'A local judgement must NEVER modify pixels outside its chosen region');
 }
}
const input=artwork(),accepted=artwork();
const ctx=input.getContext('2d');
ctx.fillStyle='#cb5541';ctx.fillRect(24,20,140,164);
ctx.fillStyle='#2c70bd';ctx.fillRect(185,60,124,149);
const memory=createRegionMemory();
assert.equal(Object.keys(memory.cells).length,REGION_GRID*REGION_GRID);
const rects=regionRects(W,H);
assert.equal(rects.length,9);
assert.equal(rects.reduce((sum,r)=>sum+r.w*r.h,0),W*H);
assert.ok(rects.every(r=>r.w*r.h<W*H*.26));
const chosen=selectReviewRegions({width:W,height:H,cycle:1,
 attempt:0,memory,maxReviews:2});
assert.equal(chosen.length,2);
assert.notEqual(chosen[0].id,chosen[1].id);
const mark=alternativeRegionalMark({mark:'hybrid'},{cycle:1,region:chosen[0]});
assert.ok(mark&&mark!=='hybrid');
assert.equal(alternativeRegionalMark({mark:'hybrid'},{
 cycle:2,attempt:0,region:chosen[0],preferred:'hatch'}),'hatch',
 'Successful prior local marks should influence this region in future generations');
const recipe=makeRecipe({seed:128,subject:'abstract',
 mark:'hybrid',primary:'no_curves'});
const first=artwork(),before=artwork();
let count=0;
const assisted=auditRegions({
 canvas:first,source:input,parent:accepted,recipe,cycle:1,
 memory,maxReviews:2,threshold:.06,
 renderAlternative:({canvas,region})=>{
   const trial=artwork(),g=trial.getContext('2d');
   g.drawImage(canvas,0,0);
   count++;
   if(count===1){
     g.fillStyle='#04ca37';g.fillRect(region.x,region.y,region.w,region.h);
   }
   return trial;
 },
 grade:(canvas,region)=>{
   const data=canvas.getContext('2d').getImageData(
     region.x+10,region.y+10,1,1).data;
   const good=data[1]>190&&data[0]<25;
   const score=good?.92:.35;
   return {score,W:score,phi:score,H:score};
 }
});
assert.equal(assisted.reviews,2);
assert.equal(assisted.revisions,1);
assert.equal(assisted.kept,1);
assert.deepEqual(assisted.decisions.map(d=>d.verdict),['REWORK','KEEP']);
exactlyOutside(first,before,assisted.decisions[0].region);
const revisedPixel=first.getContext('2d').getImageData(
 assisted.decisions[0].region.x+10,
 assisted.decisions[0].region.y+10,1,1).data;
assert.ok(revisedPixel[1]>180&&revisedPixel[0]<30);
const next=updateRegionMemory(memory,assisted.decisions,2);
assert.equal(next.cells[assisted.decisions[0].region.id].revised,1);
assert.equal(next.cells[assisted.decisions[1].region.id].kept,1);
assert.equal(memory.cells[assisted.decisions[0].region.id].revised,0,
 'Only the WINNING candidate should commit changes to persistent region taste');
assert.equal(next.cells[assisted.decisions[0].region.id].mark,
 assisted.decisions[0].mark);
assert.equal(next.cells[assisted.decisions[1].region.id].mark,null);
assert.ok(next.cells[assisted.decisions[1].region.id].stability>0);
assert.ok(saveRegionMemory(next));
const loaded=loadRegionMemory();
assert.deepEqual(loaded,next);
const skipped=auditRegions({canvas:artwork(),source:input,recipe,memory,
 dirtyTiles:[{x:0,y:0,w:60,h:60}]});
assert.equal(skipped.reviews,0,
 'Sparse renderer outside regions must remain byte-for-byte protected');
const scored=scoreRegion(input,rects[0],{parent:accepted});
assert.ok([scored.score,scored.W,scored.phi,scored.H,
 scored.complexity,scored.delta].every(x=>x>=0&&x<=1));
const scoreCopy=scoreRegion(input,rects[0],{parent:accepted});
assert.deepEqual(scored,scoreCopy,'Spatial taste must be deterministic');
const stable=[{age:6,volatility:.01,bbox:{
 x:chosen[0].x/W,y:chosen[0].y/H,
 w:chosen[0].w/W,h:chosen[0].h/H}}];
const protectedRegions=selectReviewRegions({width:W,height:H,
 cycle:1,attempt:0,memory,objects:stable,maxReviews:2});
assert.ok(protectedRegions.every(r=>r.id!==chosen[0].id),
 'A mature stable object must not be overwritten by local experimentation');
const native=artwork(),unmodified=artwork(),marks=[];
const actual=auditRegions({canvas:native,source:input,recipe,
 memory,cycle:2,maxReviews:1,threshold:-2,
 onDecision:d=>marks.push(d)});
assert.equal(actual.reviews,1);
assert.equal(actual.revisions,1);
assert.ok(marks[0].mark!==recipe.mark,
 'The region must actually execute an alternative DRAWING procedure');
exactlyOutside(native,unmodified,actual.decisions[0].region);
assert.notDeepEqual(pixels(native),pixels(unmodified),
 'Reworking an actual source should visibly change some painted marks');
const noCorrupt=artwork();
applyRules(input,noCorrupt,recipe,{iteration:0});
assert.ok(noCorrupt.getContext('2d').getImageData(0,0,1,1).data[3]>0,
 'The ordinary full-frame rule engine remains unaffected by local critique');
console.log('323: nine independent region memories, W/phi/H local scoring, true alternate marks, KEEP/REWORK, stable-form protection and exact outside pixels PASS');
