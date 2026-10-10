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
const text=readFileSync('public/index.html','utf8');
assert.match(text,/id="archiveDock"/);
assert.match(text,/id="ruleWords"/);
assert.match(text,/id="ruleUseArchive"/);
const code=readFileSync('public/app.js','utf8');
assert.match(code,/addEventListener\("click", \(\) => changeSeed\(false\)\)/);
assert.doesNotMatch(code,/location\.replace\(url\.toString\(\)\)/,
  'Archive must not automatically navigate away from its first painting');
console.log('Unified surface: real word masks, composition preservation, live ink, seed-click correctness and no first-paint reload PASS.');
