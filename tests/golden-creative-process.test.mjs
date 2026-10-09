/* Hexfield 308: test the measurable golden geometry, colour and cross-effect,
 * the live glyph anatomy changes and the creative animation's truthful plan.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const db=new Map();
globalThis.document={createElement(name){assert.equal(name,'canvas');return new Canvas(1,1);}};
globalThis.localStorage={
 getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v))
};
const {PHI,GOLD,GOLD_MINOR,GOLDEN_ANGLE,phiFit,measureGoldenTaste,
 goldenPrior,rankGoldenCandidates,getGoldenMode,setGoldenMode,GOLDEN_THRESHOLDS,
 explainGolden,diagnoseGolden,compareGoldenTaste}=await import('../public/studio/golden-taste.js');
const {refineGoldenRecipe,PHI_BRANCHES}=await import('../public/studio/phi-refinement.js');
const {makeGenome,evaluateSurface}=await import('../public/studio/evolution.js');
const {rankNoveltyCandidates}=await import('../public/studio/nonredundancy.js');
const {makeRecipe,applyRules,drawReality}=await import('../public/studio/rule-engine.js');
const {performancePlan}=await import('../public/studio/creative-performance.js');
const {compileAnatomyGlyph,editAnatomyProgram}=await import('../public/studio/glyph-anatomy.js');
const {renderLettering}=await import('../public/studio/lettering.js');
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<eps,a+' should approximate '+b);
near(PHI,1.61803398875);near(GOLD,.61803398875);
near(GOLD_MINOR,.38196601125);near(GOLDEN_ANGLE,137.50776405);
near(phiFit(GOLD),1);near(phiFit(GOLD_MINOR),1);
assert.ok(phiFit(.50)<1);
const paper=()=>{const c=new Canvas(300,200);const ctx=c.getContext('2d');
 ctx.fillStyle='#e8e5dc';ctx.fillRect(0,0,c.width,c.height);return c;};
const empty=measureGoldenTaste(paper(),{mode:'lettering'});
assert.equal(empty.geometry,0);assert.equal(empty.color,0);
assert.equal(empty.qualifies,false);
for(const k of ['geometry','color','coupling','combined'])
 assert.ok(empty[k]>=0&&empty[k]<=1);
const makeStudy=(shape='diamond',shift=0,flat=false)=>{
 const c=paper(),ctx=c.getContext('2d');ctx.save();
 if(shape==='diamond'){
   ctx.beginPath();ctx.moveTo(80,27);ctx.lineTo(220,47);
   ctx.lineTo(256,142);ctx.lineTo(98,174);ctx.closePath();ctx.clip();
 }else if(shape==='oval'){
   ctx.beginPath();ctx.ellipse(160,100,95,72,0,0,Math.PI*2);ctx.clip();
 }else{ctx.beginPath();ctx.rect(35,56,230,95);ctx.clip();}
 ctx.fillStyle='#273f63';ctx.fillRect(0,0,300,200);
 if(!flat){
   ctx.fillStyle='#ce7032';ctx.fillRect(30+shift,0,132,200);
   ctx.fillStyle='#94b789';ctx.fillRect(156+shift,30,53,130);
 }
 ctx.restore();return c;
};
const a=makeStudy('diamond'),b=makeStudy('diamond',40),
  oval=makeStudy('oval'),monochrome=makeStudy('diamond',0,true);
const A=measureGoldenTaste(a),B=measureGoldenTaste(b),
  C=measureGoldenTaste(oval),D=measureGoldenTaste(monochrome);
for(const p of [A,B,C,D]){
 for(const key of ['geometry','color','coupling','combined'])
   assert.ok(p[key]>=0&&p[key]<=1&&Number.isFinite(p[key]),key);
 assert.equal(typeof p.qualifies,'boolean');
 assert.ok(typeof p.interaction.effect==='number');
 assert.ok(Math.abs(p.interaction.effect)<=1);
 assert.ok(p.ratios.dominantColor>=0&&p.ratios.dominantColor<=1);
 assert.ok(explainGolden(p).includes('G '));
 if(p.qualifies){
   for(const key of ['geometry','color','coupling','combined'])
     assert.ok(p[key]>=GOLDEN_THRESHOLDS[key]);
 }
}
assert.notDeepEqual(A.ratios,C.ratios,'Changing the silhouette changes geometry');
assert.notDeepEqual(A.ratios,D.ratios,'Changing pigment changes colour numbers');
assert.ok(A.coupling!==B.coupling||A.interaction.effect!==B.interaction.effect,
 'Moving colours while preserving shape affects the colour↔geometry interaction');
assert.ok(A.combined!==C.combined||A.combined!==D.combined);
assert.equal(goldenPrior(A,{mode:'off'}),0);
assert.ok(goldenPrior(A,{mode:'strict'})<=goldenPrior(A,{mode:'guide'}));
assert.equal(getGoldenMode(),'strict');
assert.equal(setGoldenMode('guide'),'guide');assert.equal(getGoldenMode(),'guide');
assert.equal(setGoldenMode('invalid'),'strict');assert.equal(getGoldenMode(),'strict');
const ranked=rankGoldenCandidates([{canvas:a},{canvas:b},{canvas:oval}],{mode:'strict'});
assert.equal(ranked.length,3);
assert.ok(ranked.every(item=>typeof item.golden.geometry==='number'));
const globalRank=rankNoveltyCandidates([
 {canvas:a,method:'poly'},{canvas:b,method:'split'},{canvas:oval,method:'ellipse'}],
 {mode:'art',goldenMode:'strict'});
assert.equal(globalRank.length,3);
assert.ok(globalRank.every(item=>item.golden&&Number.isFinite(item.weighted)));
const program=rules=>editAnatomyProgram({rules});
const original=compileAnatomyGlyph('H',0,program([]));
const split=compileAnatomyGlyph('H',0,program([
 {target:'top_zone',operation:'upper_bold',amount:.95,glyph:'all'}
]));
const stem=split.components.find(p=>p.part==='stem');
assert.ok(stem.localWeights?.length>2);
assert.ok(stem.localWeights[0]>stem.localWeights.at(-1),
 'Upper bold actually thickens upper glyph more than its lower half');
assert.deepEqual(original.components[0].points[0],split.components[0].points[0]);
assert.deepEqual(original.components[0].points.at(-1),split.components[0].points.at(-1));
assert.ok(split.components[0].points.every(p=>Math.abs(p[0]-.17)<1e-8),
 'The same straight stem is resampled for local weight, not moved');
const bubble=compileAnatomyGlyph('O',0,program([
 {target:'bowl',operation:'bubble',amount:.9,glyph:'all'}
]));
assert.ok(bubble.components[0].width>1&&bubble.components[0].bubble===true);
const triangle=compileAnatomyGlyph('O',0,program([
 {target:'counter',operation:'triangle',amount:.85,glyph:'all'}
]));
assert.notDeepEqual(triangle.components[0].points,
 compileAnatomyGlyph('O',0,program([])).components[0].points);
const source=new Canvas(220,140),out=new Canvas(220,140);
drawReality(source,'sphere',19);
const rule=makeRecipe({subject:'sphere',primary:'no_curves',mark:'dots',seed:19,rework:'none'});
const trace=applyRules(source,out,rule,{iteration:0,trace:true}).trace;
assert.ok(trace?.marks?.length>30);
assert.ok(trace.total>=trace.marks.length);
assert.ok(trace.marks.every(x=>['line','rect','circle'].includes(x.type)));
assert.ok(trace.marks.every(x=>x.type!=='circle'),
 'Mark trace must obey no-curves, never animate invented circles');
const logoCanvas=new Canvas(1200,740);
const logoMeta=renderLettering(logoCanvas,{
 mode:'lettering',seed:98,text:'HEX',style:'anatomy',type:'wordmark',
 genome:{v:1,kind:'lettering',letterForm:'upright',letterStroke:'solid',
 letterFrame:'none',joint:'discrete',terminal:'round',track:.03,mass:1,color:.2,
 generation:0,anatomy:program([{target:'crossbar',operation:'lift',amount:.6,glyph:'all'}])}
});
const score=performancePlan({kind:'logo',anatomy:logoMeta,
 recipe:{seed:98,anatomy:program([{target:'crossbar',operation:'lift',amount:.6,glyph:'all'}])},
 trials:[{canvas:a,method:'candidate A',score:.2},
 {canvas:b,method:'candidate B',score:.7,selected:true}]});
assert.ok(score.parts.length>2);assert.equal(score.tests.length,2);
assert.ok(score.phaseLabels.some(x=>x.key==='construct'));
const ruled=performancePlan({kind:'rule',recipe:rule,trace});
assert.equal(ruled.kind,'rule');assert.ok(ruled.marks.length>30);
assert.ok(ruled.phaseLabels.some(x=>x.key==='undo'));
const diagnose=diagnoseGolden(A);
assert.ok(['geometry','color','coupling','combined','qualified'].includes(diagnose.target));
assert.equal(diagnose.passes.length,4);
assert.ok(typeof diagnose.instruction==='string'&&diagnose.instruction.length>20);
const diff=compareGoldenTaste(A,B);
assert.equal(diff.first,false);
assert.ok(diff.deltas.geometry===+(B.geometry-A.geometry).toFixed(4));
assert.ok(diff.deltas.colorOnGeometry===+
  (B.interaction.colorOnGeometry-A.interaction.colorOnGeometry).toFixed(4));
assert.ok(compareGoldenTaste(null,A).first);
const originalGenome=makeGenome('lettering',754);
const originalRecipe={
  mode:'lettering',seed:754,genome:originalGenome,
  anatomy:originalGenome.anatomy,
  text:'HELLO',style:'anatomy',type:'wordmark'
};
const candidates=Array.from({length:PHI_BRANCHES},(_,i)=>
  refineGoldenRecipe(originalRecipe,i,{target:'geometry'}));
assert.equal(new Set(candidates.map(x=>x.seed)).size,PHI_BRANCHES,
  'Every φ candidate must derive a distinct deterministic descendant seed');
assert.ok(candidates.every(x=>x.text==='HELLO'&&x.genome.generation===
  originalGenome.generation+1));
assert.ok(candidates.every(x=>JSON.stringify(x.anatomy)===
  JSON.stringify(originalRecipe.anatomy)),
  'Golden layout and colour cannot erase the user’s locked glyph rules');
assert.equal(candidates[3].parentSeed,originalRecipe.seed);
const secondRun=refineGoldenRecipe(originalRecipe,3,{target:'geometry'});
assert.deepEqual(secondRun,candidates[3],'Same seed and branch must generate the same construction');
assert.equal(originalRecipe.phiComposition,undefined,'Refinement must not mutate the parent');
const rendered=[];
for(const candidate of candidates.slice(0,5)){
  assert.equal(evaluateSurface(candidate.genome).length,0);
  const result=new Canvas(1200,740);
  renderLettering(result,candidate);
  rendered.push(result.toBufferSync('png'));
}
assert.ok(new Set(rendered.map(b=>b.toString('base64'))).size>=4,
  'Golden-guided attempts must alter actual glyph layout and pigment, not only metadata');
const landscapeGenome=makeGenome('landscape',912);
const terrain={mode:'landscape',seed:912,scene:'mountain',mood:'golden',
  genome:landscapeGenome,constraint:{enabled:true,primary:'no_curves',mark:'dots'}};
const hill=refineGoldenRecipe(terrain,2,{target:'geometry'});
assert.equal(hill.scene,terrain.scene);
assert.deepEqual(hill.constraint,terrain.constraint);
assert.notEqual(hill.seed,terrain.seed);
assert.equal(hill.genome.generation,landscapeGenome.generation+1);
assert.equal(evaluateSurface(hill.genome).length,0);
const repair=diagnoseGolden({
 geometry:.71,color:.63,coupling:.31,combined:.23,
 constraints:GOLDEN_THRESHOLDS,
 ratios:{geometryLeft:.615,geometryTop:.4,aspect:1.2,occupied:.62,
   hueAngle:137.5,dominantPair:.62,colorLeft:.62,colorTop:.38},
 interaction:{colorOnGeometry:.05,geometryOnColor:-.04},
 qualifies:false
});
assert.equal(repair.target,'coupling',
 'Diagnose the fixable failed interaction, not just the low aggregate score');
const nativeRecipe=structuredClone(originalRecipe);
nativeRecipe.anatomy.enabled=false;
nativeRecipe.genome.anatomy.enabled=false;
const nativeRepair=refineGoldenRecipe(nativeRecipe,3,{target:'geometry'});
assert.equal(nativeRepair.anatomy.enabled,false,
 'Native fonts must not silently be converted into anatomy-rendered glyphs');
assert.equal(nativeRepair.genome.anatomy.enabled,false);
assert.notEqual(nativeRepair.genome.color,nativeRecipe.genome.color);
assert.equal(evaluateSurface(nativeRepair.genome).length,0);
const nativeA=new Canvas(1200,740),nativeB=new Canvas(1200,740);
renderLettering(nativeA,nativeRecipe);renderLettering(nativeB,nativeRepair);
assert.notDeepEqual(nativeA.toBufferSync('png'),nativeB.toBufferSync('png'),
 'Phi refinement in native comparison mode must affect actual rendered pixels');

console.log('Dual golden constraints: measured geometry/color/cross-effect, strict gate, W, anatomical bubble and upper bold, real creative process scored.');
