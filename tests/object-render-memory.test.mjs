/* 317 / Render memory is an executable test, not a benchmark claim. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const kv=new Map();
globalThis.localStorage={getItem:k=>kv.get(k)||null,
  setItem:(k,v)=>kv.set(k,String(v))};
globalThis.document={createElement(type){assert.equal(type,'canvas');return new Canvas(1,1)}};
const {extractVisualObjects,updateObjectRegistry,saveObjectRegistry,
  loadObjectRegistry,rememberObjectVerdict,paintStableObjects,
  MAX_OBJECTS}=await import('../public/studio/object-memory.js');
const {chooseFullRenderCandidates,budgetEvidence,scorePreflight}=await
  import('../public/studio/render-budget.js');
function scene(dx=0){
 const c=new Canvas(480,300),g=c.getContext('2d');
 g.fillStyle='#c2c2c2';g.fillRect(0,0,480,300);
 g.fillStyle='#d7233d';g.fillRect(65+dx,48,140,100);
 g.fillStyle='#216bc4';g.fillRect(278,124,155,140);
 g.fillStyle='#286f3d';g.fillRect(70,180,120,85);
 return c;
}
const a=scene();
const extracted=extractVisualObjects(a);
assert.ok(extracted.length>=2&&extracted.length<=MAX_OBJECTS,
 'Actual colour components should form a small object list');
assert.ok(extracted.every(o=>o.mask?.length>0&&o.grid[0]===48&&o.bbox.w>0));
let registry={objects:[],nextId:1};
registry=updateObjectRegistry(registry.objects,a,{
 generation:1,priorId:registry.nextId
});
const first=registry.objects.map(o=>o.id);
assert.ok(first.length>=2);
for(let g=2;g<=5;g++){
 registry=updateObjectRegistry(registry.objects,scene(),{
   generation:g,priorId:registry.nextId
 });
}
assert.ok(registry.matched>=2,
 'An unchanged shape should be recognized rather than re-created');
assert.ok(first.some(id=>registry.objects.some(o=>o.id===id&&o.age>=3)),
 'A stable object must retain its root identity across generations');
assert.ok(registry.stable>=1,
 'Actually stable descriptors should qualify for reusing old pixels');
const target=new Canvas(480,300),ctx=target.getContext('2d');
ctx.fillStyle='#f1f1f1';ctx.fillRect(0,0,480,300);
const reuse=paintStableObjects(target,a,registry.objects,{
 generation:5,opacity:.93
});
assert.ok(reuse.reused>=1&&reuse.coverage>0,
 'Stable shapes must be physically restored from the parent painting');
const painted=ctx.getImageData(0,0,480,300).data;
const neutral=[painted[(10*480+10)*4],painted[(10*480+10)*4+1],
  painted[(10*480+10)*4+2]];
assert.ok(neutral.every(v=>v>=190),
 'Untouched regions should retain the next painting, not copy the entire parent');
const altered=new Set();
for(let y=0;y<300;y+=6)for(let x=0;x<480;x+=6){
 const i=(y*480+x)*4;
 if(painted[i]<220||painted[i+1]<210||painted[i+2]<210)altered.add(y*480+x);
}
assert.ok(altered.size>50,'Real source pixel islands must be visually restored');
const voted=rememberObjectVerdict(registry.objects,true,'braid');
assert.ok(voted.every(x=>x.votes>=1&&x.relationHistory.at(-1)==='braid'));
assert.ok(saveObjectRegistry({...registry,objects:voted}));
const recalled=loadObjectRegistry();
assert.deepEqual(recalled.objects.map(o=>o.id),voted.map(o=>o.id));
assert.ok(recalled.objects.length<=MAX_OBJECTS);
const beforeMove=registry.objects.map(o=>o.id);
const moved=updateObjectRegistry(registry.objects,scene(3),{
 generation:6,priorId:registry.nextId
});
assert.ok(moved.matched>=1,"Slight drift must not reset every object\'s identity");
assert.ok(moved.objects.some(o=>beforeMove.includes(o.id)));
const contacted=updateObjectRegistry(moved.objects,scene(3),{
 generation:7,priorId:moved.nextId,
 wordBounds:{x:58,y:38,w:185,h:125},relation:'graft'
});
assert.ok(contacted.objects.some(o=>o.wordContacts>0&&
 o.relationHistory.includes('graft')),
 'Physical word/shape intersection must be remembered with the form');
assert.ok(moved.objects.every(o=>o.area>0&&o.area<.62));
const proposals=[
 {id:0,preflight:{score:.86,agreement:true,golden:{qualifies:true}}},
 {id:1,preflight:{score:.43,agreement:false,golden:{qualifies:false}}},
 {id:2,preflight:{score:.31,agreement:false,golden:{qualifies:false}}}
];
assert.equal(chooseFullRenderCandidates(proposals,{cycle:6,strict:true}).length,1,
 'A convincing preview may avoid a redundant second full-size pass');
assert.equal(chooseFullRenderCandidates(proposals,{cycle:1,strict:true}).length,2,
 'Early generations compare two genuinely full renderings');
assert.equal(chooseFullRenderCandidates(proposals,{
 cycle:6,strict:true,mobile:true
}).length,1);
assert.equal(budgetEvidence(proposals,proposals.slice(0,1)).fullAvoided,2);
const quick=scorePreflight(a,{novelty:.35,continuity:.8});
assert.ok(Number.isFinite(quick.score)&&quick.golden);
console.log('317: real component identities, retained pixels, storage restore, adaptive full-render budget PASS');
