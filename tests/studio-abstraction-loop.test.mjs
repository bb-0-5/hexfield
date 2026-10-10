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
const {validMarkProgram}=await import('../public/studio/mark-program.js');
const {setGoldenMode}=await import('../public/studio/golden-taste.js');
// This test exercises deliberate application/mixer exploration. Strict φ
// qualification precedence is verified independently in golden tests.
setGoldenMode('guide');

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
const produced=[],errors=[],processEvents=[];
const loop=createAbstractionLoop({
 width:240,height:145,
 getArchive:()=>supplies[4].canvas,
 getParent:()=>produced.at(-1)?.canvas||null,
 onFrame:x=>{produced.push(x);processEvents.push({type:'accepted-frame'});},
 onProcess:e=>processEvents.push({type:e.type,progress:e.progress?
   {completedRows:e.progress.completedRows,strokes:e.progress.strokes}:null}),
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
assert.ok(processEvents.some(e=>e.type==='painting'&&e.progress?.strokes>0),
 'A real brush row must be displayed WHILE the full candidate is rendered');
assert.ok(processEvents.some(e=>e.type==='candidate-painted'),
 'Actual lettering and material must appear before candidate judgement');
assert.ok(processEvents.indexOf(processEvents.find(e=>e.type==='painting'))<
 processEvents.findIndex(e=>e.type==='accepted-frame'),
 'The live production canvas must exhibit executed ink BEFORE choosing the winner');
assert.ok(produced[0].liveExecution?.drawnBeforeSelection,
 'The accepted result must identify real incremental execution, not playback');
assert.ok(produced[0].regional?.reviews>=1,
 'A full-size candidate should audit its actual local paint before global adoption');
assert.ok(produced[0].regional.decisions.every(x=>x.verdict==='KEEP'||x.verdict==='REWORK'),
 'Each local region must make a real autonomous KEEP or REWORK decision');
assert.ok(processEvents.some(e=>e.type==='regional-decision'),
 'The local spatial judgement is visible DURING candidate construction');
assert.ok(produced[0].sources.includes('terrain'),'Procedural terrain must be rendered into the first pass');
assert.ok(produced[0].sources.includes('lettering'),'Lettering renderer must participate in the first pass');
assert.ok(produced[0].sources.includes('archive'),'Historic archive canvas must participate');
loop.once({mixMode:'dissonance',subject:'sphere',speed:1500});
await waitGeneration(2);
assert.ok(produced[1].sources.includes('parent'),'Second pass must use output of first pass');
assert.equal(produced[1].recipe.parentId,produced[0].recipe.id);
assert.ok(validMarkProgram(produced[1].recipe.markProgram));
assert.equal(produced[1].recipe.markProgram.parentId,produced[0].recipe.markProgram.id);
assert.equal(produced[1].recipe.markProgram.rootId,produced[0].recipe.markProgram.rootId);
assert.ok(produced[1].novelty>0,'Recursive rework must modify pixels');
assert.ok(produced[1].derivation?.retained>=0,
  'The second frame must be physically derived from the first frame');
assert.equal(produced[1].recipe.application,produced[1].derivation.method);
assert.ok(produced[1].trials.length>=2,'Process theatre must use multiple truly rendered alternatives');
assert.equal(produced[1].trials.filter(t=>t.selected).length,1,
 'Exactly one actually tested method should be adopted');
assert.ok(produced[1].trials.every(t=>t.canvas?.width===320&&
 t.canvas?.height===200&&Number.isFinite(t.score)),
 'Performance score must use bounded preview canvases and numerical W/phi/H judgements');
assert.ok(produced[1].survival?.carried>=1,
 'The second painting must PHYSICALLY preserve a motif from the first');
const preservedFirst=produced[1].survival.held[0].id;
// Regression: a novelty reset used to clear the donor bank and leave the
// experiment painting nothing except its own previous canvas.
for(let pass=3;pass<=10;pass++){
  loop.once({mixMode:'auto',speed:1500,subject:'coast'});
  await waitGeneration(pass);
  assert.ok(produced.at(-1).sources.includes('reality'),
    'Pass '+pass+' must retain a reality donor after a novelty reset');
  assert.ok(produced.at(-1).sources.includes('terrain'),
    'Pass '+pass+' must retain a terrain donor');
  assert.ok(produced.at(-1).sources.includes('lettering'),
    'Pass '+pass+' must retain an independent lettering donor');
  assert.equal(produced.at(-1).recipe.parentId,produced.at(-2).recipe.id);
  assert.ok(produced.at(-1).trials.some(t=>t.label.startsWith(
    produced.at(-2).recipe.application+' /')),
    'Each generation should trial retaining its parent application style');
  assert.notEqual(produced.at(-1).recipe.seed,produced.at(-2).recipe.seed,
    'Generation '+pass+' must branch from the previous seed, not repeat it');
  assert.ok(produced.at(-1).nonredundancy?.candidates>=1&&
    produced.at(-1).nonredundancy.candidates<=2,
    'Only one or two full-resolution candidates are painted per generation');
  assert.equal(produced.at(-1).renderBudget?.predicted,3,
    'Three actual coarse previews must still be compared');
  assert.equal(produced.at(-1).trials.length,3,
    'All three visibly painted previews must remain inspectable');
  assert.ok(produced.at(-1).renderBudget.fullAvoided>=1,
    'Every generation avoids at least one former full-size render');
  assert.ok(produced.at(-1).trials.some(x=>x.fidelity==='preview'),
    'The inexpensive competing image must be an actual preview, not a fake score');
  assert.ok(produced.at(-1).objectMemory?.count<=8,
    'Object memory must remain bounded on mobile');
  assert.equal(produced.at(-1).trials.filter(t=>t.selected).length,1,
    'The chosen generation is always linked to exactly one actually tested alternative');
  assert.ok(Number.isFinite(produced.at(-1).heritage?.tradeoff?.W)&&
    Number.isFinite(produced.at(-1).heritage?.tradeoff?.phi)&&
    Number.isFinite(produced.at(-1).heritage?.tradeoff?.H),
    'W/phi/H metrics are always present on accepted frames');
  assert.ok(produced.at(-1).heritage?.living?.length<=2,
    'Only two geometric ancestor identities may be retained');
  assert.ok(Number.isFinite(produced.at(-1).nonredundancy?.complexity),
    'Global W novelty must produce a structural complexity reading');
  assert.ok(produced.at(-1).survival?.carried>=1,
    'Pass '+pass+' must carry some previous physical artwork forward');
  assert.ok(produced.at(-1).survival?.coverage>0,
    'Pass '+pass+' must visibly preserve a nonzero area of the parent');
  if(pass<=6){
    assert.ok(produced.at(-1).survival.held.some(x=>x.id===preservedFirst),
      'Same original motif must persist across reworks, not respawn as a fresh unrelated patch');
  }
}
assert.ok(produced.some(x=>x.metrics.invented.stamps>0),
  'A continuous painting must actually execute an invented mark program');
assert.ok(new Set(produced.map(x=>x.recipe.markProgram.rootId)).size===1,
  'A self-developing mark process keeps its root identity through ten frames');
assert.ok(loop.state().globalMemory>=10,'Ten accepted passes must enter the shared memory');
const regional=loop.state().regionMemory;
assert.equal(regional.cells.length,9,'Nine spatial identities persist independently');
assert.ok(regional.cells.some(x=>x.age>=1),
 'At least one locality should have accumulated an accepted judgement');
assert.ok(regional.cells.some(x=>x.kept+x.revised>=1),
 'Local aesthetic memory must reflect an actual prior verdict');
assert.ok(produced.some(frame=>frame.regional?.reviews>0),
 'The painter must run true regional review in some full-frame generations');
assert.ok(loop.state().donorGenerations.terrain>=1,
 'Terrain programs must mutate instead of restarting from scratch');
assert.ok(loop.state().donorGenerations.lettering>=1,
 'Letter anatomy must develop a procedure lineage alongside the landscape');
assert.ok(new Set(produced.map(p=>p.blend)).size>=4,'Auto mixing should rotate materially different renderers');
loop.pause();
assert.equal(loop.state().cycle,10);
assert.equal(loop.state().running,false);
assert.equal(loop.state().history.length,10);
loop.dispose();
console.log('All available renderers actually mixed, outputs changed across methods, recursive parent and pause verified.');
