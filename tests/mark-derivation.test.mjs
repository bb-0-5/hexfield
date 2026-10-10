/* Build 313 / procedural application, not imitation by style labels.
 * Test real pixels and deterministic intermediate ancestry, not mock art.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
globalThis.document={createElement(tag){
  assert.equal(tag,'canvas');return new Canvas(1,1);
}};
const memory=new Map();
globalThis.localStorage={
  getItem:key=>memory.get(key)||null,
  setItem:(key,value)=>memory.set(key,String(value))
};
const {DERIVED_MARKS,MARK_PALETTE,markAtCell}=await import('../public/studio/mark-grammar.js');
const {MARKS,makeRecipe,applyRules}=await import('../public/studio/rule-engine.js');
const {DERIVATION_METHODS,deriveBetweenFrames,derivationMethod}=
  await import('../public/studio/frame-derivation.js');
const pixelDifference=(a,b)=>{
  const A=a.getContext('2d').getImageData(0,0,a.width,a.height).data;
  const B=b.getContext('2d').getImageData(0,0,b.width,b.height).data;
  let n=0;for(let i=0;i<A.length;i+=4)
    n+=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
  return n/(a.width*a.height*765);
};
const canvas=(w=194,h=122)=>new Canvas(w,h);
const source=canvas(),ctx=source.getContext('2d');
ctx.fillStyle='#e7d3a2';ctx.fillRect(0,0,194,122);
ctx.fillStyle='#273552';ctx.fillRect(20,18,78,80);
ctx.fillStyle='#d14837';ctx.fillRect(75,42,98,45);
for(let i=0;i<40;i++){
  ctx.fillStyle=i%2?'#203a3c':'#eddace';
  ctx.fillRect(i*5,((i*i*11)%110),2,13);
}
assert.equal(Object.keys(DERIVED_MARKS).length,10);
assert.equal(new Set(MARK_PALETTE).size,15);
assert.ok(Object.keys(DERIVED_MARKS).every(k=>k in MARKS));
assert.notEqual(markAtCell(2,1,2,0,1),markAtCell(3,1,2,0,1));
const signatures=new Set();
for(const [n,mark] of Object.keys(DERIVED_MARKS).entries()){
  const output=canvas();
  const ink=output.getContext('2d');
  ink.arc=()=>{throw Error(mark+' violated the straight-mark law');};
  const rule=makeRecipe({subject:'abstract',primary:'no_curves',
    mark,seed:100+n});
  const result=applyRules(source,output,rule,{trace:true});
  assert.ok(result.strokes>=100,mark+' should really paint');
  assert.ok(result.trace.marks.length>0,mark+' must show executed gestures');
  assert.ok(pixelDifference(source,output)>.04,mark+' changed the source');
  const data=output.getContext('2d').getImageData(0,0,194,122).data;
  signatures.add([...data].filter((_,i)=>i%31===0).join(','));
}
assert.ok(signatures.size>=9,'Procedural marks must generate distinct pixels');
const hybrid=canvas();
hybrid.getContext('2d').arc=()=>{throw Error('Hybrid curved under no_curves');};
applyRules(source,hybrid,makeRecipe({subject:'abstract',primary:'no_curves',
  mark:'hybrid',seed:13}),{trace:true});
const proposal=canvas(),g=proposal.getContext('2d');
g.fillStyle='#eee8e0';g.fillRect(0,0,194,122);
g.fillStyle='#28a7ad';g.fillRect(0,10,150,54);
g.fillStyle='#2f3353';g.fillRect(70,60,100,50);
for(const method of DERIVATION_METHODS){
  const result=deriveBetweenFrames(source,proposal,{method,seed:47,cycle:3});
  const again=deriveBetweenFrames(source,proposal,{method,seed:47,cycle:3});
  assert.equal(pixelDifference(result.canvas,again.canvas),0,
    method+' must be replayable from actual parent/proposal and a seed');
  assert.ok(result.parentContribution>.03&&result.parentContribution<.97);
  assert.ok(pixelDifference(source,result.canvas)>.008,
    method+' should develop its parent, not clone it');
  assert.ok(pixelDifference(proposal,result.canvas)>.008,
    method+' should not wipe the previous composition');
  assert.ok(result.retained>=0&&result.retained<=1);
  assert.ok(result.interwoven>=0&&result.interwoven<=1);
}
let parent=source;
const visited=new Set();
for(let generation=0;generation<22;generation++){
  const mark=Object.keys(DERIVED_MARKS)[generation%10];
  const candidate=canvas();
  applyRules(parent,candidate,makeRecipe({subject:'abstract',
    primary:'no_shading',mark,seed:generation*971+41}));
  const method=derivationMethod(generation*971+41,generation);
  visited.add(method);
  const result=deriveBetweenFrames(parent,candidate,{
    seed:generation*971+41,cycle:generation,method
  });
  assert.ok(result.changed>.001,'Generation '+generation+' must do real editing');
  assert.ok(result.parentContribution>.01,
    'Generation '+generation+' should retain some previous mark application');
  parent=result.canvas;
}
assert.ok(visited.size>=3,'Lineage experiments must vary their derivation methods');
console.log('Build 313: ten actual mark procedures, forbidden curves, traced application, five frame bridges and 22 generations passed.');
