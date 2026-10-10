/* Build 319: prove cooperative scheduling and actual donor readback reuse. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas,Image}=require('skia-canvas');
const storage=new Map(),listeners=new Map();
globalThis.localStorage={
 getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))
};
globalThis.Image=Image;
globalThis.document={
 hidden:false,
 createElement:name=>{assert.equal(name,'canvas');return new Canvas(1,1)},
 addEventListener:(name,cb)=>listeners.set(name,cb),
 removeEventListener:(name,cb)=>{if(listeners.get(name)===cb)listeners.delete(name)}
};
const {renderPlan,recordRenderTime,yieldToBrowser}=await import('../public/studio/render-governor.js');
const {prepareMixSamples}=await import('../public/studio/source-mixer.js');
const {chooseFullRenderCandidates,budgetEvidence}=await import('../public/studio/render-budget.js');
const {createAbstractionLoop}=await import('../public/studio/abstraction-loop.js');
assert.deepEqual(renderPlan({mobile:true,emaMs:800,samples:4}).previews,3);
assert.deepEqual(renderPlan({mobile:true,emaMs:1150,samples:4}).previews,2);
assert.deepEqual(renderPlan({mobile:true,emaMs:2150,samples:4}).finalists,1);
assert.deepEqual(renderPlan({mobile:false,emaMs:12000,samples:6}).finalists,2);
assert.deepEqual(renderPlan({mobile:true,emaMs:2200,samples:0}).previews,3,
 'One expensive first load must not prematurely degrade visual exploration');
let history={emaMs:0,samples:0};
history=recordRenderTime(history,2200);
history=recordRenderTime(history,2000);
assert.equal(history.samples,2);
assert.ok(history.emaMs>1900);
await yieldToBrowser();
const painted=(hex)=>{
 const c=new Canvas(120,80),ctx=c.getContext('2d');
 ctx.fillStyle=hex;ctx.fillRect(0,0,120,80);return c;
};
const steady=painted('#d25133');
const volatile=painted('#334da1');
const cacheable=[{name:'terrain',canvas:steady,cacheable:true}];
const first=prepareMixSamples(cacheable,{width:120,height:80});
assert.equal(first.cacheEvidence.hits,0);
assert.equal(first.cacheEvidence.reads,1);
const again=prepareMixSamples(cacheable,{width:120,height:80});
assert.equal(again.cacheEvidence.hits,1);
assert.equal(again.cacheEvidence.reads,0);
assert.equal(again[0].data,first[0].data,
 'Stable donor pixels must reuse the original actual RGBA backing buffer');
assert.equal(prepareMixSamples(cacheable,{width:60,height:40}).cacheEvidence.hits,0,
 'Different output sizes must have separate material snapshots');
const mutable=[{name:'parent',canvas:volatile,cacheable:false}];
const snapshot1=prepareMixSamples(mutable,{width:120,height:80});
volatile.getContext('2d').fillStyle='#f8b212';
volatile.getContext('2d').fillRect(0,0,120,80);
const snapshot2=prepareMixSamples(mutable,{width:120,height:80});
assert.equal(snapshot2.cacheEvidence.hits,0);
assert.notDeepEqual(snapshot1[0].data,snapshot2[0].data,
 'Mutating parent art may never be read from a stale saved donor snapshot');
const newDonor=painted('#d25133');
assert.equal(prepareMixSamples([{
 name:'terrain',canvas:newDonor,cacheable:true
}],{width:120,height:80}).cacheEvidence.hits,0,
 'A refreshed donor canvas must invalidate its old snapshot by identity');
const qualifies={combined:.8,qualifies:true};
const previews=[
 {preflight:{score:.75,agreement:true,golden:qualifies}},
 {preflight:{score:.70,agreement:true,golden:qualifies}},
 {preflight:{score:.60,agreement:true,golden:qualifies}}
];
assert.equal(chooseFullRenderCandidates(previews,{
 cycle:5,maxFull:1,mobile:true
}).length,1);
assert.equal(chooseFullRenderCandidates(previews,{
 cycle:5,maxFull:2,mobile:false
}).length,2);
assert.equal(budgetEvidence(previews.slice(0,2),[previews[0]]).fullAvoided,2,
 'Two cheap previews and one full painting still save two previous full passes');
const stages=[],frames=[],errors=[];
const loop=createAbstractionLoop({
 width:160,height:120,
 onFrame:frame=>frames.push(frame),
 onState:state=>stages.push(state.stage),
 onError:error=>errors.push(String(error))
});
loop.start({speed:1500});
assert.equal(loop.isRunning(),true);
loop.pause();
await new Promise(resolve=>setTimeout(resolve,50));
assert.equal(loop.isRunning(),false);
assert.equal(frames.length,0,
 'Pause must cancel an in-progress stage before any stale frame is committed');
assert.equal(loop.state().cycle,0);
assert.equal(loop.state().stage,'paused');
assert.ok(stages.includes('Preparing painter'),
 'The expensive refresh must give the browser a visible progress checkpoint');
loop.dispose();
assert.deepEqual(errors,[]);
console.log('319 / autonomous painting: bounded adaptive governor, abortable stages, immutable donor snapshot reuse PASS');
