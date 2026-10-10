/* Build 332 / single text compositor, legible contrasted bubble + block. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(type){
 assert.equal(type,'canvas');return new Canvas(1,1);
}};
const kv=new Map();
globalThis.localStorage={getItem:k=>kv.get(k)||null,
 setItem:(k,v)=>kv.set(k,String(v))};
const {wordSafeSources}=await import('../public/studio/source-mixer.js');
const {typeGenome,evolveTypeGenome,glyphTraits,validTypeGenome}=await
 import('../public/studio/type-genome.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const all=[
 {name:'reality'},{name:'terrain'},{name:'parent'},
 {name:'lettering'},{name:'logo'},{name:'kept'},{name:'archive'}
];
assert.deepEqual(wordSafeSources(all,true).map(x=>x.name),
 ['reality','terrain','parent','archive'],
 'Previously printed letters cannot be mixed into the new art as paint donors');
assert.deepEqual(wordSafeSources(all,false),all,
 'Art without a live typed message still has every source available');
const prior=typeGenome(17,'rounded');
delete prior.outline;delete prior.boxiness;
assert.equal(validTypeGenome(prior),true,
 'Legacy 330 saved genomes need to remain loadable and mutable');
const seed=123456;
assert.equal(evolveTypeGenome(prior,{seed,cycle:4,branch:1,mode:'auto'}).grammar,'bubble');
assert.equal(evolveTypeGenome(prior,{seed,cycle:5,branch:1,mode:'auto'}).grammar,'block');
const fixed=evolveTypeGenome(prior,{seed,cycle:6,branch:1,mode:'block'});
assert.equal(fixed.grammar,'block');
assert.equal(fixed.root,prior.root);
assert.equal(fixed.generation,1);
assert.deepEqual(fixed,evolveTypeGenome(prior,{seed,cycle:6,branch:1,mode:'block'}));
for(const style of ['bubble','block']){
 const g=typeGenome(seed,style);
 assert.equal(validTypeGenome(g),true);
 const a=glyphTraits(g,'H',0),b=glyphTraits(g,'E',1);
 assert.ok(a.outline>=.02&&a.outline<=.12);
 assert.notDeepEqual(a,b,'Each glyph gets bounded individual rule parameters');
 assert.ok(style==='block'?a.boxiness>.9:a.boxiness<.1);
}
const W=400,H=240;
const background=(dark=false)=>{
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle=dark?'#13242f':'#eee6d6';ctx.fillRect(0,0,W,H);
 ctx.fillStyle=dark?'#172a41':'#e8cfaf';
 ctx.fillRect(30,65,150,110);
 ctx.fillStyle=dark?'#304d43':'#ddbcaa';
 ctx.fillRect(220,70,140,100);
 return c;
};
const bytes=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const dist=(a,b)=>{
 let changes=0,difference=0;
 for(let i=0;i<a.length;i+=4){
  const d=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
   Math.abs(a[i+2]-b[i+2]))/3;
  if(d>15){changes++;difference+=d;}
 }
 return {changes,mean:difference/Math.max(1,changes)};
};
const opts={seed:0x332,iteration:2};
const samples=[];
for(const style of ['bubble','block']){
 for(const dark of [false,true]){
  const clean=background(dark),canvas=background(dark),repeat=background(dark),
   recipe={...makeRecipe({mark:'dots',primary:'no_shading',
     subject:'sphere',seed:0x332,generation:2}),
     typeGenome:typeGenome(717,style)};
  const first=paintWordsOnCanvas(canvas,'HEXA 2026',{
    ...opts,recipe,sourceCanvas:clean
  });
  const replay=paintWordsOnCanvas(repeat,'HEXA 2026',{
    ...opts,recipe,sourceCanvas:clean
  });
  assert.equal(first.painted,true);
  assert.ok(first.count>100);
  assert.deepEqual(first,replay);
  assert.deepEqual(bytes(canvas),bytes(repeat),
   'Immutable same paint plate + genome must reproduce every colored glyph pixel');
  const proof=dist(bytes(clean),bytes(canvas));
  assert.ok(proof.changes>150,'Actual glyphs must be visible at this image size');
  assert.ok(proof.mean>36,
   'Text should have strong measured local color contrast on both bright and dark paintings');
  // New label applied on the SAME visible canvas from clean source must not
  // retain an old stamped word or compound glyph outlines.
  const twice=paintWordsOnCanvas(canvas,'HEXA 2026',{
    ...opts,recipe,sourceCanvas:clean
  });
  assert.equal(twice.painted,true);
  assert.deepEqual(bytes(canvas),bytes(repeat),
    'Re-typing the same words from the clean plate must be idempotent');
  samples.push(bytes(canvas));
 }
}
assert.notDeepEqual(samples[0],samples[2],
 'Bubble and block render distinct actual glyph pixels');
const loop=readFileSync('public/studio/abstraction-loop.js','utf8');
const ui=readFileSync('public/studio/rule-studio.js','utf8');
const html=readFileSync('public/index.html','utf8');
assert.match(html,/id="ruleTypeMode"/);
assert.match(html,/value="bubble"/);
assert.match(html,/value="block"/);
assert.match(loop,/wordSafeSources\(bank\.sources\(previous\),!!getWords\(\)\)/);
assert.match(loop,/lastClean=composite\?\.clean\|\|null/);
assert.match(loop,/const scenePlate=composite\?\.clean\|\|output/);
assert.match(ui,/clean:plate\?\.toDataURL/);
assert.match(ui,/loop\.adoptCanvas\(unlettered,current\.recipe\)/);
assert.match(ui,/\$\('ruleTypeMode'\)\.addEventListener\('change'/);
console.log('332: bubble/block real outlines, strong contrast, clean-parent autorecomposition, no duplicated glyph donors, old genome compatibility and deterministic reproducibility PASS');
