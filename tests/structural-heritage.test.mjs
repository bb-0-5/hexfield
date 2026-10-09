/* Hexfield 311: compare actual pixels, rebuild the same silhouette in
 * distinct materials, preserve stable lineage and verify W/phi/H negotiation.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
const data=new Map();
globalThis.document={
 createElement(tag){assert.equal(tag,'canvas');return new Canvas(1,1);}
};
globalThis.localStorage={
 getItem:key=>data.get(key)||null,
 setItem:(key,value)=>data.set(key,String(value))
};
const {
 extractStructuralIdea,paintInheritedIdeas,advanceStructuralIdeas,evolveContour,
 judgeStructuralIdeas,heritageEvidence,heritageTaste,
 rememberStructuralIdeas,rememberedSignatures,recallStructuralIdea,
 HERITAGE_LIBRARY_LIMIT,rankBalancedCandidates,selectBalancedCandidate,
 HERITAGE_TTL,MAX_STRUCTURAL_IDEAS,SAMPLES,MATERIALS
}=await import('../public/studio/structural-heritage.js');

const ring=()=>{
 const c=new Canvas(360,240),ctx=c.getContext('2d');
 ctx.fillStyle='#e7e3da';ctx.fillRect(0,0,360,240);
 ctx.lineWidth=19;ctx.strokeStyle='#c4412a';
 ctx.beginPath();ctx.ellipse(180,120,49,35,0,0,2*Math.PI);ctx.stroke();
 return c;
};
const parent=ring(),region={x:.26,y:.20,w:.48,h:.60};
const shape=extractStructuralIdea(parent,{region,seed:981,cycle:3});
assert.ok(shape,'An actual painted ring should yield an extractable silhouette');
assert.equal(shape.outline.length,SAMPLES);
assert.ok(shape.holes.length>=1,'The enclosed empty counter must survive separately');
assert.ok(shape.stats.aspect>.8&&shape.stats.aspect<2.1);
assert.ok(shape.ink.startsWith('#'));
assert.equal(shape.generation,0);
assert.deepEqual(shape.rootOutline,shape.outline,
 'An actual measured root contour must remain an immutable resemblance anchor');
const evolved=evolveContour(shape,112233);
assert.ok(evolved?.outline?.length===SAMPLES);
assert.ok(evolved.magnitude>.002&&evolved.magnitude<.12,
 'Contour must genuinely mutate, without losing its ancestry in a single step');
assert.deepEqual(evolveContour(shape,112233),evolved,
 'Same seed and parent shape reproduce identical geometric descendants');
assert.notDeepEqual(evolved.outline,shape.outline);
assert.equal(evolved.preservesHoles,shape.holes.length);
assert.deepEqual(extractStructuralIdea(parent,{region,seed:981,cycle:3}),shape,
 'Feature extraction must be deterministic for the same ancestor');
assert.ok(!('image' in shape),'Structural genome must not secretly store an image bitmap');
const fresh=()=>{const c=new Canvas(360,240),ctx=c.getContext('2d');
 ctx.fillStyle='#e2d9bd';ctx.fillRect(0,0,360,240);return c;};
const methods=[
 {mark:'dots',primary:'no_curves',expected:'dots'},
 {mark:'hatch',primary:'no_curves',expected:'hatch'},
 {mark:'cutout',primary:'no_curves',expected:'facets'},
 {mark:'hybrid',primary:'negative_space',expected:'negative'}
];
const signatures=new Set(),seenIds=new Set(),scores=[];
for(const [i,method] of methods.entries()){
 const c=fresh();
 const painted=paintInheritedIdeas(c,[shape],{
   seed:100+i,cycle:5+i,recipe:method
 });
 assert.equal(painted.drawn.length,1);
 assert.equal(painted.drawn[0].material,method.expected);
 assert.equal(painted.drawn[0].id,shape.id);
 assert.ok(painted.drawn[0].fidelity>.75);
 assert.ok(painted.coverage>0&&painted.coverage<.4);
 assert.ok(painted.score>0&&painted.score<=1);
 assert.ok(painted.drawn[0].visibleChange>0);
 signatures.add(c.toBufferSync('png').toString('base64'));
 seenIds.add(painted.drawn[0].id);
 scores.push(painted.score);
}
assert.equal(seenIds.size,1,'The same idea identity must survive multiple media');
assert.equal(signatures.size,methods.length,
 'Inherited form must be repainted into materially different visible art');
assert.equal(shape.material,'original','Rendering must not mutate ancestor genomes');
assert.ok(MATERIALS.length>=6);
let current=[shape];
for(let cycle=4;cycle<11;cycle++){
 const c=fresh();
 const drawn=paintInheritedIdeas(c,current,{
   seed:cycle*819,cycle,recipe:{primary:'no_curves',mark:'hybrid'}
 });
 current=advanceStructuralIdeas(current,c,{
   seed:cycle*819,cycle,source:parent,rendered:drawn
 });
 assert.ok(current.some(item=>item.id===shape.id),'Contour survives generation '+cycle);
 assert.ok(current.length<=MAX_STRUCTURAL_IDEAS);
 assert.equal(current.find(x=>x.id===shape.id).age,cycle-3);
}
assert.ok(heritageEvidence(current).every(x=>x.generation>0));
assert.ok(heritageEvidence(current).every(x=>typeof x.material==='string'));
const descendant=current.find(x=>x.id===shape.id);
assert.ok(descendant?.rootOutline?.length===SAMPLES,
 'Original shape must remain alongside the descendant in every generation');
assert.deepEqual(descendant.rootOutline,shape.outline);
assert.notDeepEqual(descendant.outline,shape.outline,
 'The inherited visual idea must actually develop geometric form over generations');
const ancestorDrift=descendant.outline.reduce((a,p,i)=>a+
 Math.hypot(p[0]-shape.outline[i][0],p[1]-shape.outline[i][1]),0)/SAMPLES;
assert.ok(ancestorDrift>.002&&ancestorDrift<.22,
 'Evolution should remain related to the original form, not randomized beyond recognition');
const boosted=judgeStructuralIdeas(current,true);
assert.ok(boosted[0].trust>current[0].trust);
assert.equal(heritageTaste().votes,1);
const storedSignatures=rememberedSignatures();
assert.ok(storedSignatures.length>=1&&storedSignatures.length<=HERITAGE_LIBRARY_LIMIT,
 'KEEP makes a bounded, browser-local visual signature library');
const archived=JSON.stringify(storedSignatures);
assert.ok(!archived.includes('data:image')&&!archived.includes('base64'),
 'Learned visual identity saves only editable geometric descriptions, not image files');
assert.deepEqual(storedSignatures[0].rootOutline,shape.outline,
 'The original root shape remains retrievable after approval');
const recalled=recallStructuralIdea({seed:612,cycle:28});
assert.ok(recalled&&recalled.id===shape.id);
assert.equal(recalled.age,0);
assert.equal(recalled.recalled,1);
assert.ok(recalled.generation>=7,'Remembered signatures retain generational ancestry');
assert.deepEqual(recallStructuralIdea({seed:612,cycle:28}),recalled,
 'An autonomous return of a learned idea is deterministic for the same seed');
rememberStructuralIdeas(Array(11).fill(current[0]).map((g,i)=>({...g,id:'saved-'+i})));
assert.ok(rememberedSignatures().length<=HERITAGE_LIBRARY_LIMIT,
 'Persistent signatures cannot grow indefinitely on Android');
assert.ok(heritageTaste().weights['material:'+current[0].material]>0,
 'A human KEEP should establish a reusable material preference');
const rejected=judgeStructuralIdeas(current,false);
assert.ok(rejected[0].trust<current[0].trust);
assert.equal(heritageTaste().votes,2);
assert.ok(heritageTaste().weights['material:'+current[0].material]<
  heritageTaste().weights['shape:'+
    (current[0].holes?.length?'counter':current[0].stats.circularity>.49?'round':'angular')]+1);
const mine={canvas:fresh(),assessment:{score:.61,redundant:false},
 golden:{combined:.41,qualifies:false},heritage:{score:.95}};
const stranger={canvas:fresh(),assessment:{score:.7,redundant:false},
 golden:{combined:.50,qualifies:false},heritage:{score:.05}};
const choice=selectBalancedCandidate([stranger,mine]);
assert.equal(choice.heritage.score,.95,'Heritage must meaningfully influence winner selection');
assert.ok(choice.threeWay.W>0&&choice.threeWay.H>0&&choice.threeWay.phi>0);
const fullyRanked=rankBalancedCandidates([mine,stranger]);
assert.equal(fullyRanked.length,2);
assert.ok(fullyRanked.every(x=>typeof x.threeWay?.W==='number'&&
 typeof x.threeWay?.H==='number'&&typeof x.threeWay?.phi==='number'),
 'Explorer-mode candidate selection must never discard the computed three-way score');
assert.equal(fullyRanked.find(x=>x===stranger),undefined,
 'Ranking returns scored copies rather than leaking undecorated original candidates');
const qualified={...stranger,golden:{combined:.66,qualifies:true}};
assert.equal(selectBalancedCandidate([mine,qualified],{strict:true}).golden.qualifies,true,
 'Strict golden constraints should retain their documented qualification priority');
console.log('Build 311: real-pixel contour + counter extraction; stable idea ID over six reconstructed materials; 7 generations of genealogy; preference feedback; three-objective W/phi/H selection.');
