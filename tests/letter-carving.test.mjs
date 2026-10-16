/* Carved lettering must inherit its contour and pigment from the real stack. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const {Canvas,ImageData}=createRequire(import.meta.url)('skia-canvas');
const sandbox={console,Uint8Array,Uint8ClampedArray,Float32Array,Math,
  ImageData,
  document:{createElement(tag){assert.equal(tag,'canvas');return new Canvas(1,1);}}};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../public/letter-carving.js',import.meta.url),'utf8'),sandbox);
const carving=sandbox.HexfieldCarving;
assert.equal(typeof carving?.derive,'function');
assert.equal(typeof carving?.compose,'function');
// Reuse the exact alphabet the studio passes into the renderer.
const alphabet=readFileSync(new URL('../public/app.js',import.meta.url),'utf8')
  .match(/^const LETTER_SKELETONS = \{[\s\S]*?^\};/m)?.[0];
assert.ok(alphabet,'The studio lettering alphabet must be available');
vm.runInContext(alphabet+'\nglobalThis.testSkeletons=LETTER_SKELETONS;',sandbox);
const skeletons=sandbox.testSkeletons;
const W=720,H=220;
const pixels=c=>Buffer.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data);
const polygon=(ctx,points,color)=>{
  ctx.fillStyle=color;ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.fill();
};
const fixture=(shift=0)=>{
  const c=new Canvas(W,H),g=c.getContext('2d');
  // Transparent material edges and actual overlapping pigment seams.
  polygon(g,[[8,30],[W-25,8],[W-4,167],[36,211]],'#d74c37');
  polygon(g,[[23+shift,12],[235+shift,2],[337+shift,197],[81+shift,217]],'#235d71');
  polygon(g,[[216+shift,20],[502+shift,6],[596+shift,202],[298+shift,210]],'#d4b942');
  polygon(g,[[446-shift,11],[673-shift,8],[W-12,191],[541-shift,213]],'#383047');
  polygon(g,[[125+shift,86],[W-46,57],[639-shift,147],[177,166]],'#598575');
  return c;
};
const solid=()=>{
  const c=new Canvas(W,H),g=c.getContext('2d');
  g.fillStyle='#854d29';g.fillRect(0,0,W,H);return c;
};
const options={text:'ABOR',template:'block',skeletons};
const sum=a=>a.reduce((n,v)=>n+(v?1:0),0);
const sameMask=(a,b)=>assert.deepEqual(Buffer.from(a),Buffer.from(b));
const contour=mask=>Buffer.from(Array.from(mask,alpha=>alpha>=128?1:0));
const componentCount=(mask,w,h)=>{
  const visited=new Uint8Array(w*h);let count=0;
  for(let i=0;i<mask.length;i++){
    if(mask[i]<128||visited[i])continue;
    count++;const pending=[i];visited[i]=1;
    for(let at=0;at<pending.length;at++){
      const p=pending[at],x=p%w,y=Math.floor(p/w);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,q=ny*w+nx;
        if(nx<0||nx>=w||ny<0||ny>=h||visited[q]||mask[q]<128)continue;
        visited[q]=1;pending.push(q);
      }
    }
  }
  return count;
};
const enclosedVoids=(mask,w,h)=>{
  const visited=new Uint8Array(w*h),holes=[];
  for(let i=0;i<mask.length;i++){
    if(mask[i]||visited[i])continue;
    const pending=[i],cells=[];visited[i]=1;let edge=false;
    for(let at=0;at<pending.length;at++){
      const p=pending[at],x=p%w,y=Math.floor(p/w);cells.push(p);
      if(!x||!y||x===w-1||y===h-1)edge=true;
      for(const q of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1]){
        if(q<0||mask[q]||visited[q])continue;
        visited[q]=1;pending.push(q);
      }
    }
    if(!edge&&cells.length>4)holes.push(cells);
  }
  return holes;
};

const source=fixture(),before=pixels(source);
const first=carving.derive(source,options),again=carving.derive(source,options);
assert.deepEqual(pixels(source),before,'Planning a carving must leave its material untouched');
assert.equal(first.sourceFingerprint,again.sourceFingerprint);
assert.equal(first.maskFingerprint,again.maskFingerprint);
sameMask(first.cutMask,again.cutMask);
assert.equal(first.cutMask.length,first.w*first.h);
assert.equal(first.templateMask.length,first.cutMask.length);
assert.equal(first.occupancy.length,first.cutMask.length);
assert.ok(sum(first.cutMask)>100,'The plan must cut actual letter strokes');
assert.ok(first.constrainedPixels>0,'Real material must constrain the reference template');
for(let i=0;i<first.cutMask.length;i++){
  if(first.cutMask[i])assert.ok(first.occupancy[i],'Cuts can only remove actual source material');
}
const moved=carving.derive(fixture(31),options);
assert.notEqual(first.sourceFingerprint,moved.sourceFingerprint);
assert.notDeepEqual(Buffer.from(first.cutMask),Buffer.from(moved.cutMask),
  'Moving real material must change the cut contour, not only the provenance label');
assert.notEqual(first.maskFingerprint,moved.maskFingerprint);
assert.notDeepEqual(contour(first.cutMask),contour(moved.cutMask),
  'Material seams must move a visible half-opacity cut boundary, beyond changing pixel metadata');
const templates=['block','rounded','condensed'].map(template=>carving.derive(source,{...options,template}));
assert.equal(new Set(templates.map(p=>p.maskFingerprint)).size,3,
  'Each lettering template must affect actual carved pixels');
assert.notEqual(first.maskFingerprint,carving.derive(source,{...options,text:'HEXF'}).maskFingerprint,
  'Changing the word must change the carving');

const topology=carving.derive(solid(),options);
const counters=enclosedVoids(topology.templateMask,topology.w,topology.h);
assert.ok(counters.length>=5,'A, B, O and R must retain their five real counters');
for(const cells of counters){
  for(const p of cells)assert.equal(topology.cutMask[p],0,
    'A reference counter must remain an uncut island of source material');
}
assert.ok(sum(topology.protectedMask)>0,'A readable stroke core must be protected');
assert.equal(componentCount(topology.protectedMask,topology.w,topology.h),4,
  'A, B, O and R must each have one continuous protected stroke core');
for(let i=0;i<topology.protectedMask.length;i++){
  if(topology.protectedMask[i])assert.ok(topology.cutMask[i],
    'Source-dependent contour changes must keep the protected stroke core');
}

assert.equal(typeof carving.carveLayer,'function');
const material=fixture(),materialBefore=pixels(material);
const materialPlan=carving.derive(material,options);
const carved=carving.carveLayer(material,materialPlan),materialAfter=pixels(carved);
assert.equal(materialBefore.length,materialAfter.length);
let changed=0,removed=0,unchanged=0;
for(let p=0;p<materialPlan.cutMask.length;p++){
  const i=p*4,oldAlpha=materialBefore[i+3],newAlpha=materialAfter[i+3];
  const differs=materialBefore.subarray(i,i+4).some((v,c)=>v!==materialAfter[i+c]);
  if(differs){changed++;assert.ok(materialPlan.cutMask[p],
    'A carving must never change a pixel outside its actual cut mask');}
  if(!materialPlan.cutMask[p]){
    unchanged++;
    assert.deepEqual(materialAfter.subarray(i,i+4),materialBefore.subarray(i,i+4),
      'Material outside the cut must preserve the exact original pigment and alpha');
  }
  assert.ok(newAlpha<=oldAlpha,'A carving must remove material without adding pigment');
  if(newAlpha<oldAlpha)removed++;
  if(newAlpha>64){
    for(let channel=0;channel<3;channel++)assert.ok(
      Math.abs(materialAfter[i+channel]-materialBefore[i+channel])<=4,
      'Surviving material must retain source pigment (allowing alpha premultiplication rounding)');
  }
}
assert.ok(changed>100&&removed>100,'The carving must remove hundreds of actual source pixels');
assert.ok(unchanged>materialPlan.cutMask.length*.5,'The source stack must survive outside the letters');
const shapes=['#c54b30','#235d71','#d4b942'].map((color,index)=>{
  const c=new Canvas(180,180),g=c.getContext('2d');
  polygon(g,index===0?[[13,21],[160,7],[174,148],[29,177]]:
    index===1?[[3,156],[77,8],[178,168]]:[[18,19],[152,9],[172,170],[67,157]],color);
  return {canvas:c};
});
const stackOptions={seed:17,aspect:W/H,width:W};
const stack=carving.createStack(shapes,stackOptions);
const replay=carving.createStack(shapes,stackOptions);
assert.deepEqual(pixels(stack.canvas),pixels(replay.canvas),
  'The same harvested pieces and render seed must reproduce the real overlap stack');
assert.ok(stack.placements.length>=shapes.length,'The mass must stack real harvested pieces');
const variants=[17,18,19,20,21].map(seed=>{
  const next=carving.createStack(shapes,{...stackOptions,seed});
  assert.equal(next.sourceFingerprint,stack.sourceFingerprint,
    'Changing the stack must retain the exact source-piece provenance');
  return carving.derive(next.canvas,options);
});
assert.equal(new Set(variants.map(p=>contour(p.cutMask).toString('base64'))).size,5,
  'Each render seed must create a distinct visible letter contour');
assert.equal(new Set(variants.map(p=>p.maskFingerprint)).size,5,
  'Each new render seed must create a physically different lettering constraint');
const offCanvas=new Canvas(W,H),cutCanvas=new Canvas(W,H);
const off=carving.compose(offCanvas.getContext('2d'),W,H,{...options,stack,mode:'off'});
const cut=carving.compose(cutCanvas.getContext('2d'),W,H,{...options,stack,mode:'carve'});
assert.equal(off.mode,'off');assert.equal(cut.mode,'carve');
assert.equal(off.sourceFingerprint,cut.sourceFingerprint,
  'Source comparison and carved view must share the same real stack');
const offPixels=pixels(offCanvas),cutPixels=pixels(cutCanvas);let visibleCuts=0;
for(let p=0;p<cut.cutMask.length;p++){
  const i=p*4;
  if(!cut.cutMask[p])assert.deepEqual(cutPixels.subarray(i,i+4),offPixels.subarray(i,i+4),
    'Source comparison and carved output must match exactly outside the cut');
  else if(cutPixels.subarray(i,i+4).some((v,c)=>v!==offPixels[i+c]))visibleCuts++;
}
assert.ok(visibleCuts>100,'Carved view must visibly subtract letters from the source comparison');

// Exercise the actual app's harvest -> quarry bridge as well as the geometry
// module. Its legacy harvest defaults to WHITE alpha silhouettes, which must
// never replace the real source pigment on the new carving path.
const appSource=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const appFunction=name=>{
  const match=appSource.match(new RegExp('^function '+name+'\\([^]*?^\\}\\n','m'));
  assert.ok(match,'Missing studio function '+name);return match[0];
};
vm.runInContext(`
  const MAX_HARVEST_TILE=256,HARVEST_MAX_BOX_FRAC=.42,HARVEST_MIN_INK=.02,
    MIN_HARVEST_SHAPES=4,HARVEST_MAX_ASPECT=10,FULL_BLEED_FG_FRAC=.72,
    MASTER_DESIGN_WIDTH=440,MASTER_DESIGN_HEIGHT=100,MASTER_DESIGN_ASPECT=4.4;
  let harvestPathStat='none';
  function shapeOrientationDescriptor(){return {}};
  function carvingSettings(){return {text:'ABOR',template:'block',mode:'carve'}};
  ${['subdivideComponent','fallbackHarvestTiles','otsuThreshold','extractShapes',
    'rememberCarvingProperty','renderCarvedStack'].map(appFunction).join('\n')}
  globalThis.testHarvest=extractShapes;
  globalThis.testQuarry=renderCarvedStack;
  globalThis.testFallback=fallbackHarvestTiles;
`,sandbox);
const actualSource=new Canvas(W,H),ag=actualSource.getContext('2d');
ag.fillStyle='#08080c';ag.fillRect(0,0,W,H);
for(let i=0;i<4;i++){
  ag.fillStyle=['#c54b30','#235d71','#d4b942','#598575'][i];
  ag.fillRect(24+i*171,37+i%2*11,120,140-i*7);
}
const legacy=sandbox.testHarvest(ag,W,H,18,.0012,.82);
assert.ok(legacy.length>=4);
for(const shape of legacy){
  const bytes=pixels(shape.canvas);
  for(let p=0;p<bytes.length;p+=4)if(bytes[p+3]){
    assert.equal(bytes[p],255,'Historic silhouette harvesting must retain its default behavior');
  }
}
const appParams={artifact:{seed:17}};
sandbox.testQuarry(ag,W,H,appParams,'carved');
const harvestedPigment=pixels(appParams.__hexfieldCarveStack.canvas);
let colored=0;
for(let p=0;p<harvestedPigment.length;p+=4)if(harvestedPigment[p+3]>128&&
  Math.max(...harvestedPigment.subarray(p,p+3))-Math.min(...harvestedPigment.subarray(p,p+3))>30)colored++;
assert.ok(colored>1000,'The actual app quarry must retain painted source pigment instead of white masks');
const fallback=sandbox.testFallback(new Uint8ClampedArray(before),W,H,8,0,{preserveColour:true});
assert.ok(fallback.some(shape=>{
  const bytes=pixels(shape.canvas);
  for(let p=0;p<bytes.length;p+=4)if(bytes[p+3]>128&&bytes[p]!==255)return true;
  return false;
}),'Fallback material tiles must also retain source pigment');

// A freshly deserialized recipe can reuse the same cached master, and must
// receive the exact material snapshot with it before redraw diagnostics run.
vm.runInContext(`
  const CANONICAL_MASTER_WIDTH=880,CANONICAL_MASTER_HEIGHT=200,CANONICAL_MASTER_SLOTS=2;
  let canonicalMasters=[]; const measuredMiniMasters=new Map();
  function canonicalMasterKey(){return 'same-public-recipe-and-seed'};
  function isCarvedMode(){return true};
  function mulberry32(){return ()=>0};
  function paintBuffer(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  function renderComposite(ctx,w,h,params,rng,text,mode){renderCarvedStack(ctx,w,h,params,mode)};
  ${['hydrateCarvingMaster','canonicalMasterCanvas'].map(appFunction).join('\n')}
  globalThis.testCachedMaster=canonicalMasterCanvas;
`,sandbox);
const firstMaster=sandbox.testCachedMaster(appParams,17,'ABOR','carved');
const clonedParams=JSON.parse(JSON.stringify(appParams));
assert.equal(clonedParams.__hexfieldCarveStack,undefined);
const clonedMaster=sandbox.testCachedMaster(clonedParams,17,'ABOR','carved');
assert.equal(clonedMaster,firstMaster,'A same-recipe clone should reuse the immutable master');
assert.equal(clonedParams.__hexfieldCarveStack,appParams.__hexfieldCarveStack,
  'Cache replay must restore the exact source quarry onto a fresh plain recipe');
assert.equal(clonedParams.__hexfieldCarvePlan.maskFingerprint,appParams.__hexfieldCarvePlan.maskFingerprint,
  'Cached pixels and their measured cut provenance must be restored together');
console.log('Carved lettering: deterministic material constraints, three templates, five counters, four continuous cores, source-only subtraction, five unique stacks and exact source comparison passed.');
