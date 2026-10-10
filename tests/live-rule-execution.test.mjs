/* Build 322: accepted pixels are drawn by the SAME rule engine that
 * produces scored paintings, but now one physical brush row at a time.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)||null,
 setItem:(k,v)=>storage.set(k,String(v))};
globalThis.document={hidden:false,createElement(tag){
 assert.equal(tag,'canvas');return new Canvas(1,1);
}};
const {makeRecipe,applyRules}=await import('../public/studio/rule-engine.js');
const {renderRuleLive}=await import('../public/studio/live-rule-execution.js');
const {createLivingPainting}=await import('../public/studio/live-painting.js');
const width=420,height=260;
function source(){
 const c=new Canvas(width,height),ctx=c.getContext('2d');
 ctx.fillStyle='#bcb4a6';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#df3826';ctx.fillRect(44,28,164,155);
 ctx.fillStyle='#247dc2';ctx.fillRect(220,85,153,128);
 ctx.fillStyle='#41976e';ctx.fillRect(18,205,380,24);
 return c;
}
const input=source();
const canvas=()=>new Canvas(width,height);
function bytes(c){
 return Buffer.from(c.getContext('2d',{willReadFrequently:true}).
  getImageData(0,0,width,height).data);
}
const variants=[
 {primary:'no_curves',mark:'hybrid',rework:'abstract_masses'},
 {primary:'negative_space',mark:'dots',rework:'misread'},
 {primary:'opposite_bend',mark:'dashes',rework:'remove_strength'}
];
for(let variant=0;variant<variants.length;variant++){
 const recipe=makeRecipe({seed:782+variant,subject:'abstract',...variants[variant]});
 const synchronous=canvas(),incremental=canvas(),seen=[];
 const opts={iteration:variant+2,trace:true};
 const expectation=applyRules(input,synchronous,recipe,opts);
 const run=await renderRuleLive(input,incremental,recipe,{
   options:opts,rowsPerTurn:2,yieldTurn:async()=>{},
   onProgress:event=>{
     const now=bytes(event.canvas);
     seen.push({rows:event.completedRows,strokes:event.strokes,data:now});
   }
 });
 assert.equal(run.cancelled,false);
 assert.deepEqual(run.metrics,expectation,
  'The same program must execute identical mark counts, lineage and trace');
 assert.deepEqual(bytes(incremental),bytes(synchronous),
  'LIVE executed marks must be byte-for-byte identical to synchronous rules');
 assert.ok(seen.length>=3,'Genuine intermediate progress should be observable');
 assert.ok(seen.some(s=>!s.data.equals(bytes(synchronous))),
  'Intermediate frame must not be an after-the-fact replay of final pixels');
 assert.ok(seen.some(s=>s.strokes>0));
 assert.ok(seen.every((s,i)=>!i||s.rows>seen[i-1].rows));
}
const recipe=makeRecipe({seed:174,subject:'abstract',
 primary:'no_curves',mark:'dots'});
const previous=source(),unfinished=canvas();
let stopped=false,updates=0;
const halted=await renderRuleLive(input,unfinished,recipe,{
 rowsPerTurn:2,options:{iteration:4,trace:true,localApplication:true,
  baseCanvas:previous,dirtyTiles:[{x:0,y:0,w:96,h:96}]},
 isCancelled:()=>stopped,
 onProgress:()=>{updates++;if(updates>=2)stopped=true;},
 yieldTurn:async()=>{}
});
assert.equal(halted.cancelled,true);
assert.ok(updates>=2);
const ctx=unfinished.getContext('2d');
ctx.fillStyle='#ee08aa';
ctx.fillRect(width-16,height-16,14,14);
const p=ctx.getImageData(width-11,height-11,1,1).data;
assert.ok(p[0]>200&&p[2]>100,
 'Cancelling yielded painting MUST unwind the clip/transform context');
// Production canvas always contains actual strokes—not a film overlay.
const visible=canvas(),stages=[];
const live=createLivingPainting({canvas:visible,
 onPhase:state=>stages.push(state.phase),
 reducedMotion:()=>true});
const partial=canvas();
partial.getContext('2d').fillStyle='#1447ad';
partial.getContext('2d').fillRect(0,0,width,height);
live.work({painting:partial,completedRows:3,rows:20,strokes:61});
assert.equal(live.getState().phase,'working');
assert.deepEqual(bytes(visible),bytes(partial));
live.completedCandidate({painting:input,words:'HEXFIELD',attempt:1});
assert.equal(live.getState().phase,'candidate');
assert.deepEqual(bytes(visible),bytes(input));
live.accept({final:previous,candidates:2});
assert.equal(live.getState().phase,'accepted');
assert.deepEqual(bytes(visible),bytes(previous));
assert.deepEqual(stages,['working','candidate','accepted']);
console.log('322 real mark generator: synchronous parity, true intermediate canvas pixels, cooperative cancellation and live decision PASS');
