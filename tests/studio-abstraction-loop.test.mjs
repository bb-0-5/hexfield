/* Build 303: exercise actual pixel fusion and a multi-generation loop.
 * No cloud inference, no Supabase/Stripe, no fake screenshots.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas,Image}=require('skia-canvas');
const kv=new Map();
const listeners=new Map();
globalThis.document={
 hidden:false,
 createElement(type){assert.equal(type,'canvas');return new Canvas(1,1);},
 addEventListener(type,callback){listeners.set(type,callback)},
 removeEventListener(type,callback){if(listeners.get(type)===callback)listeners.delete(type)}
};
globalThis.localStorage={
 getItem:key=>kv.get(key)||null,setItem:(key,val)=>kv.set(key,String(val))
};
globalThis.Image=Image;
const {mixSources,cloneCanvas,publishSource,CROSS_STUDIO_KEYS}=await import('../public/studio/source-mixer.js');
const {createAbstractionLoop,visualDelta}=await import('../public/studio/abstraction-loop.js');

function solid(colour){
 const canvas=new Canvas(200,120);
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=colour;ctx.fillRect(0,0,canvas.width,canvas.height);
 return canvas;
}
const supplies=[
 {name:'parent',canvas:solid('#141414')},
 {name:'reality',canvas:solid('#ff0000')},
 {name:'terrain',canvas:solid('#00ff00')},
 {name:'lettering',canvas:solid('#0000ff')},
 {name:'archive',canvas:solid('#ffff00')},
 {name:'imagination',canvas:solid('#ff00ff')}
];
const q=mixSources(supplies,{width:200,height:120,mode:'quilt',cycle:5,seed:7});
assert.deepEqual(q.sources,supplies.map(s=>s.name));
assert.equal(q.stats.donorCount,5);
const d=q.canvas.getContext('2d').getImageData(0,0,200,120).data;
const seen=new Set();
for(let y=0;y<120;y+=5)for(let x=0;x<200;x+=5){
 const i=(y*200+x)*4;
 const dominant=[d[i],d[i+1],d[i+2]].map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0])[0][1];
 seen.add(dominant);
}
assert.ok(seen.size>=3,'Multiple actual renderer image colours should reach the composited output');
for(const method of ['cutaway','dissonance','relief','edges']){
 const other=mixSources(supplies,{width:200,height:120,mode:method,cycle:5,seed:7});
 assert.ok(visualDelta(q.canvas,other.canvas)>.01,'Mixer strategy '+method+' should change visual pixels');
}
assert.ok(publishSource(q.canvas,'archive',{id:'abc',parentId:null,primary:'blue_for_red',mark:'hatch'}));
assert.ok(kv.get(CROSS_STUDIO_KEYS.archive),'Archive result is shared across pages');
const produced=[],errors=[];
const loop=createAbstractionLoop({
 width:240,height:145,
 getArchive:()=>supplies[4].canvas,
 getParent:()=>produced.at(-1)?.canvas||null,
 onFrame:x=>produced.push(x),
 onError:err=>errors.push(err.message||String(err))
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitGeneration(target){
 for(let n=0;n<100;n++){
   if(loop.state().cycle>=target)return;
   if(errors.length)throw Error(errors.join('; '));
   await sleep(75);
 }
 throw Error('Continuous renderer pass '+target+' took too long');
}
loop.once({mixMode:'quilt',subject:'sphere',speed:1500});
await waitGeneration(1);
assert.ok(produced[0].sources.includes('terrain'),'Procedural terrain must be rendered into the first pass');
assert.ok(produced[0].sources.includes('lettering'),'Lettering renderer must participate in the first pass');
assert.ok(produced[0].sources.includes('archive'),'Historic archive canvas must participate');
loop.once({mixMode:'dissonance',subject:'sphere',speed:1500});
await waitGeneration(2);
assert.ok(produced[1].sources.includes('parent'),'Second pass must use output of first pass');
assert.equal(produced[1].recipe.parentId,produced[0].recipe.id);
assert.ok(produced[1].novelty>0,'Recursive rework must modify pixels');
loop.pause();
assert.equal(loop.state().cycle,2);
assert.equal(loop.state().running,false);
assert.equal(loop.state().history.length,2);
loop.dispose();
console.log('All available renderers actually mixed, outputs changed across methods, recursive parent and pause verified.');
