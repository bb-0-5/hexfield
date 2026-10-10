/* 330 — inherited typographic anatomy is visibly rasterized on the ONE artwork. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={createElement(type){assert.equal(type,'canvas');return new Canvas(1,1)},hidden:false};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const {typeGenome,evolveTypeGenome,glyphTraits,validTypeGenome,
 TYPE_GRAMMARS}=await import('../public/studio/type-genome.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
assert.equal(TYPE_GRAMMARS.length,4);
const original=typeGenome(3321,'rounded');
assert.ok(validTypeGenome(original));
assert.notDeepEqual(glyphTraits(original,'H',0),glyphTraits(original,'E',1));
let parent=original;
const roots=new Set(),fingerprints=new Set();
for(let cycle=0;cycle<18;cycle++){
 const next=evolveTypeGenome(parent,{seed:6771+cycle,cycle,branch:cycle%3,gentle:cycle%2===0});
 assert.ok(validTypeGenome(next));assert.equal(next.root,original.root);
 assert.equal(next.generation,cycle+1);
 assert.deepEqual(next,evolveTypeGenome(parent,{seed:6771+cycle,
   cycle,branch:cycle%3,gentle:cycle%2===0}),
   'Same accepted type lineage and seed must be byte-deterministic');
 fingerprints.add(JSON.stringify(next));roots.add(next.root);parent=next;
}
assert.equal(roots.size,1);
assert.ok(fingerprints.size>=12,'Child generations must undergo real structural mutations');
const W=360,H=215;
const make=()=>{const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#dddacb';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#216bad';ctx.fillRect(30,28,90,145);
 ctx.fillStyle='#d44731';ctx.fillRect(240,50,95,80);return c};
const pixels=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const recipe=makeRecipe({subject:'coast',primary:'no_shading',mark:'dots',seed:7575,generation:1});
let artifacts=[],shapeStats=[];
for(const grammar of TYPE_GRAMMARS){
 const first=make(),second=make();
 const program=typeGenome(111,grammar);
 const r1=paintWordsOnCanvas(first,'HEXFIELD',{
   recipe:{...recipe,typeGenome:program},seed:7575,iteration:1
 });
 const r2=paintWordsOnCanvas(second,'HEXFIELD',{
   recipe:{...recipe,typeGenome:program},seed:7575,iteration:1
 });
 assert.equal(r1.painted,true);
 assert.equal(r1.glyphs,8);
 assert.ok(r1.count>75,'Procedural glyph must be physically deposited');
 assert.ok(r1.typeAnatomy.includes(grammar));
 assert.deepEqual(pixels(first),pixels(second),
  'Identical typography, background, law and seed must reproduce all pixels');
 assert.deepEqual(r1,r2);
 artifacts.push(pixels(first));shapeStats.push(r1);
}
let differences=0;
for(let i=1;i<artifacts.length;i++)
 if(!artifacts[i].equals(artifacts[0]))differences++;
assert.ok(differences>=3,
 'Changing typography grammars must change true art pixels, not labels');
const layer=readFileSync('public/studio/word-surface.js','utf8');
const loop=readFileSync('public/studio/abstraction-loop.js','utf8');
assert.match(layer,/glyphTraits\(genome,ch,i\)/);
assert.match(layer,/trait\.top:trait\.bottom/);
assert.match(layer,/trait\.bubble/);
assert.match(loop,/recipe\.typeGenome=evolveTypeGenome\(inheritedRecipe\?\.typeGenome/);
assert.ok(loop.includes('const composite=postProcess(output,recipe,metrics'),
 'Mutation must be painted BEFORE the W/phi/H ranking');
console.log('330: four independently morphed glyph grammars, upper/lower weights, bubble shape, inherited mutation and reproducible pixels PASS');
