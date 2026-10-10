/* Hexfield 314 / integrated one-canvas word construction and archive safety. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return new Canvas(1,1)}};
const kv=new Map();
globalThis.localStorage={getItem:k=>kv.get(k)||null,setItem:(k,v)=>kv.set(k,String(v))};
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const fresh=()=>{
  const c=new Canvas(360,220),g=c.getContext('2d');
  g.fillStyle='#ede1cc';g.fillRect(0,0,360,220);
  g.fillStyle='#274058';g.fillRect(0,0,190,110);
  g.fillStyle='#da593c';g.fillRect(190,65,170,150);
  g.fillStyle='#97b095';g.fillRect(30,130,250,75);return c;
};
const diff=(a,b)=>{
  const x=a.getContext('2d').getImageData(0,0,360,220).data;
  const y=b.getContext('2d').getImageData(0,0,360,220).data;
  let pixels=0,sum=0;
  for(let i=0;i<x.length;i+=4){
    const d=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);
    if(d>35)pixels++;sum+=d;
  }
  return {fraction:pixels/(360*220),mean:sum/(360*220*765)};
};
const original=fresh(),empty=fresh();
assert.equal(paintWordsOnCanvas(empty,'').painted,false);
assert.equal(diff(empty,original).mean,0,'No words must leave the canvas unchanged');
const recipe=makeRecipe({seed:31,subject:'abstract',primary:'no_curves',mark:'invented'});
const wordA=fresh(),wordB=fresh();
const A=paintWordsOnCanvas(wordA,'HEXFIELD',{recipe,seed:31});
const B=paintWordsOnCanvas(wordB,'HEXFIELD',{recipe,seed:31});
assert.ok(A.painted&&A.count>300&&A.count<360*220*.3,'Glyphs must occupy a bounded region');
assert.deepEqual(A.bounds,B.bounds);
assert.equal(diff(wordA,wordB).mean,0,'Word deposition must be deterministic');
assert.ok(diff(wordA,original).fraction>.008,
  'An actual rule-rendered word must change the production canvas');
assert.ok(diff(wordA,original).fraction<.3,
  'The word must coexist with the previous painting rather than replace the canvas');
const wordC=fresh();
paintWordsOnCanvas(wordC,'RECURSION',{recipe,seed:31});
assert.ok(diff(wordC,wordA).mean>.004,'Changing the actual text must change the canvas');
assert.ok(A.chromaticFraction>.65,
  'The words must have true chromatic pigment, not a grey/white material');
assert.equal(A.palette.length,3);
assert.ok(new Set(A.palette).size>=2,'At least two independent pigment hues');
const {wordApplication,WORD_APPLICATIONS}=await import('../public/studio/word-surface.js');
const designs=new Set(),faces=new Set(),colours=new Set();
for(let n=0;n<40;n++){
 const chosen=wordApplication(31+n*37,n,'source-mark');
 designs.add(chosen.name);faces.add(chosen.family.name);
 const image=fresh();
 const result=paintWordsOnCanvas(image,'MUTATION',{recipe,seed:31+n*37,iteration:n});
 colours.add(result.palette[0]);
}
assert.ok(designs.size>=6&&faces.size>=4,
 'A painter must actually invent different type anatomy and font construction');
assert.ok(colours.size>=12,'Newly seeded colour families must not freeze at grey');
assert.ok(WORD_APPLICATIONS.length>=8);
const text=readFileSync('public/index.html','utf8');
assert.doesNotMatch(text,/id="archiveDock"/,'No embedded competing canvas');
assert.doesNotMatch(text,/data-mode="(?:rules|landscape|lettering|imagination)"/,
  'No user-facing tabs remain');
assert.match(text,/id="ruleModelPromptSlot"/);
assert.match(text,/id="ruleImagine"/);
assert.match(text,/id="ruleArtwork"/);
assert.match(text,/id="ruleWords"/);
assert.match(text,/id="ruleUseArchive"/);
const code=readFileSync('public/app.js','utf8');
assert.match(code,/addEventListener\("click", \(\) => changeSeed\(false\)\)/);
assert.doesNotMatch(code,/location\.replace\(url\.toString\(\)\)/,
  'Archive must not automatically navigate away from its first painting');
console.log('Unified surface: real word masks, composition preservation, live ink, seed-click correctness and no first-paint reload PASS.');
