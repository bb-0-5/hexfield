/* Hexfield 314: prove new mark PROCEDURES are executed, heritable,
 * bounded, reproducible, visibly different and teachable via KEEP/REJECT. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const db=new Map();
globalThis.localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v))};
globalThis.document={createElement(t){assert.equal(t,'canvas');return new Canvas(1,1)}};
const {newMarkProgram,evolveMarkProgram,validMarkProgram,paintInventedMark,
  rememberMarkVerdict,rememberedMarkPrograms,MAX_MARK_PRIMITIVES,
  MAX_MARK_OPERATIONS}=await import('../public/studio/mark-program.js');
const {MARKS,makeRecipe,applyRules}=await import('../public/studio/rule-engine.js');
const {performancePlan}=await import('../public/studio/creative-performance.js');
const drawSource=()=>{
  const c=new Canvas(240,144),g=c.getContext('2d');
  g.fillStyle='#e8dfc3';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#213854';g.fillRect(18,12,87,115);
  g.fillStyle='#cc5939';g.fillRect(68,24,151,58);
  g.fillStyle='#6b9a8b';g.fillRect(140,72,75,65);
  return c;
};
const delta=(a,b)=>{
  const x=a.getContext('2d').getImageData(0,0,240,144).data;
  const y=b.getContext('2d').getImageData(0,0,240,144).data;
  let sum=0;
  for(let i=0;i<x.length;i+=4)
    sum+=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);
  return sum/(240*144*765);
};
const source=drawSource();
assert.ok('invented' in MARKS,'Generated mark type must be exposed in optional mark menu');
const origin=newMarkProgram(817,0);
const recreated=newMarkProgram(817,0);
assert.deepEqual(origin,recreated,'Procedures must be repeatable from their seed');
assert.equal(origin.sources.length,2);
assert.notEqual(origin.sources[0],origin.sources[1]);
assert.ok(validMarkProgram(origin));
const kept=evolveMarkProgram(origin,{seed:97,branch:0});
const changed=evolveMarkProgram(origin,{seed:97,branch:1});
const donor=newMarkProgram(219);
const hybrid=evolveMarkProgram(origin,{seed:1025,branch:2,mate:donor});
assert.deepEqual(kept.sources,origin.sources,'Inheritance must preserve source gestures');
assert.deepEqual(kept.operations,origin.operations);
assert.equal(changed.rootId,origin.rootId);
assert.equal(changed.parentId,origin.id);
assert.notDeepEqual(changed.sources,origin.sources,'Mutation must change a source gesture');
assert.notEqual(changed.signature,origin.signature,'A changed program must differ in grammar');
assert.equal(hybrid.parents.length,2,'Crossover must record both ancestral procedures');
assert.equal(hybrid.parents[1],donor.id);
assert.ok(hybrid.operations.length<=MAX_MARK_OPERATIONS);
assert.ok(validMarkProgram(hybrid));
const paint=(program,mark='invented')=>{
  const image=new Canvas(240,144),ctx=image.getContext('2d');
  ctx.arc=()=>{throw Error('An invented mark violated no_curves');};
  const rule=makeRecipe({seed:183,subject:'abstract',
    primary:'no_curves',mark,markProgram:program});
  const evidence=applyRules(source,image,rule,{trace:true});
  return {image,rule,evidence};
};
const A=paint(origin),A2=paint(origin),B=paint(changed),C=paint(hybrid);
assert.equal(delta(A.image,A2.image),0,'Same program renders the same pixels');
assert.ok(delta(A.image,B.image)>0,
  'Mutating procedure structure must change ACTUAL rendered pixels / delta '+delta(A.image,B.image));
assert.ok(delta(A.image,C.image)>0,
  'Crossover must change ACTUAL ink application / delta '+delta(A.image,C.image));
for(const result of [A,B,C]){
  assert.ok(result.evidence.invented.stamps>100);
  assert.ok(result.evidence.invented.primitives>result.evidence.invented.stamps);
  assert.equal(result.evidence.trace.program.signature,result.rule.markProgram.signature);
  assert.ok(result.evidence.trace.marks.length>0);
  assert.ok(result.evidence.trace.marks.every(mark=>mark.type!=='circle'),
    'No curve primitive should leak through the no_curves law');
  const plan=performancePlan({recipe:result.rule,trace:result.evidence.trace});
  assert.ok(plan.method.startsWith('INVENT /'));
  assert.ok(plan.phaseLabels.some(p=>p.key==='invent'));
}
const mix=paint(origin,'hybrid');
assert.equal(mix.evidence.hybrid,true);
assert.ok(mix.evidence.invented.stamps>0,
  'Default hybrid painting must execute some invented mark programs');
assert.ok(!validMarkProgram({...origin,operations:Array.from({length:50},()=>origin.operations[0])}),
  'Unbounded imported genomes must be rejected');
assert.ok(!validMarkProgram({...origin,sources:['not-a-gesture','ribbon']}));
const emitted=[];
const pen=new Canvas(240,144).getContext('2d');
const execution=paintInventedMark(pen,{program:hybrid,x:60,y:40,step:18,
  noCurves:true,seed:18,emit:mark=>emitted.push(mark)});
assert.ok(execution.used);
assert.ok(emitted.length<=MAX_MARK_PRIMITIVES,'Keep construction bounded on mobile');
assert.ok(emitted.every(x=>x.type==='line'||x.type==='polygon'||x.type==='rect'));
let current=origin,art=source;
const seen=new Set(),roots=new Set();
for(let i=1;i<=24;i++){
  const next=evolveMarkProgram(current,{seed:(i*7477)>>>0,branch:i%3,mate:donor});
  assert.ok(validMarkProgram(next));
  assert.equal(next.parentId,current.id);
  assert.equal(next.rootId,origin.rootId);
  const r=new Canvas(240,144);
  r.getContext('2d').arc=()=>{throw Error('Forbidden curve in generation '+i)};
  const recipe=makeRecipe({seed:183+i,subject:'abstract',primary:'no_curves',
    mark:'invented',markProgram:next});
  const outcome=applyRules(art,r,recipe,{trace:i===24});
  assert.ok(outcome.invented.stamps>=100,'Generation '+i+' must execute its grammar');
  assert.ok(delta(r,art)>0,'Generation '+i+' should generate different pixels');
  seen.add(next.signature);roots.add(next.rootId);current=next;art=r;
}
assert.ok(seen.size>=8,'Procedures should diverge over 24 generations');
assert.equal(roots.size,1,'The original root should remain traceable');
for(let i=0;i<9;i++)rememberMarkVerdict(newMarkProgram(240+i),true);
assert.equal(rememberedMarkPrograms().length,4,'Bounded preference library, not an image database');
const remembered=rememberedMarkPrograms()[0];
rememberMarkVerdict(remembered,false);
assert.ok(!rememberedMarkPrograms().some(x=>x.rootId===remembered.rootId));
console.log('Build 314: inherited/mutated/crossbred drawing programs, 24 rendered generations, no curves, genuine stroke traces, bounded memory PASS.');
