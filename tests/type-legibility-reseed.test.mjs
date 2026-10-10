/* Build 333 — letter-shape integrity and one-button art/type reseeding. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(tag){
 assert.equal(tag,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const {assessGlyphMask,repairGlyphMask,protectReadableWinner}=
 await import('../public/studio/type-legibility.js');
const {reseedProfile}=await import('../public/studio/reseed-cycle.js');
const {TYPE_GRAMMARS,typeGenome}=await import('../public/studio/type-genome.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const styles=new Set(),grammars=new Set(),pairs=new Set();
for(let i=1;i<=30;i++){
 const a=reseedProfile(i),b=reseedProfile(i);
 assert.deepEqual(a,b,'One RESEED index must reproduce the precise style and type');
 styles.add(a.style);grammars.add(a.grammar);pairs.add(a.style+'/'+a.grammar);
}
assert.equal(styles.size,5,'Reseed must cover every actual painting system');
assert.equal(grammars.size,6,'Reseed must visit bubble, block and all legacy grammars');
assert.deepEqual(grammars,new Set(TYPE_GRAMMARS));
assert.equal(pairs.size,30,'All 30 cross-grammar combinations must be visited');
assert.deepEqual(reseedProfile(31),{...reseedProfile(1),ordinal:31,chapter:1});
const w=70,h=45,ref=new Uint8ClampedArray(w*h);
const ink=(arr,x0,x1,y0,y1,v=255)=>{
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)arr[y*w+x]=v;
};
// An O with one genuine counter and a separate H with whitespace between.
ink(ref,7,25,8,31);ink(ref,12,20,13,25,0);
ink(ref,34,38,8,31);ink(ref,52,56,8,31);ink(ref,34,56,19,22);
const parts=[{char:'O',x0:6,x1:26,top:6,bottom:33},
 {char:'H',x0:33,x1:57,top:6,bottom:33}];
const intact=assessGlyphMask(ref,ref,w,h,parts);
assert.ok(intact.readable);
assert.equal(intact.countersTested,1);
assert.equal(intact.counters,1);
assert.equal(intact.spacing,1);
const ruined=new Uint8ClampedArray(ref);
ink(ruined,12,20,13,25); // counter is now clogged
ink(ruined,26,34,12,28); // visible letters have merged
const unreadable=assessGlyphMask(ref,ruined,w,h,parts);
assert.equal(unreadable.readable,false);
assert.ok(unreadable.score<intact.score);
assert.ok(unreadable.counters<1);
const repaired=repairGlyphMask(ref,ruined,w,h,parts);
assert.ok(repaired.evidence.repaired);
assert.ok(repaired.evidence.counters>.75);
assert.ok(repaired.evidence.score>unreadable.score);
assert.equal(repairGlyphMask(ref,ref,w,h,parts).evidence.repaired,false);
const candidate=(readability,score,phi=.8,H=.8,qualified=true)=>({
 composite:{painted:true,typeLegibility:{readable:readability,score:readability?.9:.3}},
 threeWay:{score,phi,H},golden:{qualifies:qualified}
});
const bad=candidate(false,.76),good=candidate(true,.745);
assert.equal(protectReadableWinner([bad,good],bad).winner,good,
 'Readability can choose an almost equally strong physically painted candidate');
assert.equal(protectReadableWinner([bad,candidate(true,.51)],bad).winner,bad,
 'Readability cannot justify a major W/phi/H collapse');
assert.equal(protectReadableWinner([bad,candidate(true,.75,.3)],bad).winner,bad,
 'Readability cannot justify destroying golden composition');
assert.equal(protectReadableWinner([bad,good],bad,{hasWords:false}).winner,bad);
assert.equal(protectReadableWinner([bad,candidate(true,.75,.8,.8,false)],bad,
 {strict:true}).winner,bad);
const W=420,Hh=250,background=()=>{
 const c=new Canvas(W,Hh),g=c.getContext('2d');
 g.fillStyle='#dbc5a2';g.fillRect(0,0,W,Hh);
 g.fillStyle='#23466a';g.fillRect(8,8,W*.43,Hh*.72);
 g.fillStyle='#f05e4f';g.fillRect(W*.55,Hh*.38,W*.45,Hh*.5);
 return c;
};
const pixels=c=>Buffer.from(c.getContext('2d').getImageData(0,0,W,Hh).data);
const actual=new Map();
for(const grammar of ['bubble','block','rounded']){
 const base=background(),paint=background(),replay=background();
 const recipe={...makeRecipe({seed:3347,subject:'abstract',
   mark:'dots',primary:'no_curves'}),typeGenome:typeGenome(3347,grammar)};
 const r=paintWordsOnCanvas(paint,'BOO BOLD',{recipe,sourceCanvas:base,
   seed:3347,iteration:2});
 const again=paintWordsOnCanvas(replay,'BOO BOLD',{recipe,sourceCanvas:base,
   seed:3347,iteration:2});
 assert.equal(r.typeLegibility.lines,1);
 assert.ok(r.typeLegibility.score>.60,
   'A painted style must keep measured glyph anatomy from its own source');
 assert.deepEqual(r,again);
 assert.deepEqual(pixels(paint),pixels(replay));
 assert.notDeepEqual(pixels(base),pixels(paint));
 actual.set(grammar,pixels(paint));
}
assert.notDeepEqual(actual.get('bubble'),actual.get('block'),
 'Bubble and Block must affect actual different pixels, not labels');
const ui=readFileSync('public/index.html','utf8');
const ctrl=readFileSync('public/studio/rule-studio.js','utf8');
const surface=readFileSync('public/studio/word-surface.js','utf8');
const loop=readFileSync('public/studio/abstraction-loop.js','utf8');
assert.match(ui,/RESEED \/ ART \+ TYPE/);
assert.doesNotMatch(ui,/id="ruleTypeMode"/,'No more font parameters exposed');
assert.match(ctrl,/reseedProfile\(reseedCount\)/);
assert.match(ctrl,/typeMode:'auto'/);
assert.match(surface,/repairGlyphMask\(reference,pixels,w,h,parts\)/);
assert.match(surface,/const brightGround=\(samples\?background\/samples/,
 'One art-directed foreground lightness decision replaces pixel-by-pixel colour switching');
assert.match(loop,/protectReadableWinner\(ranked,initialBest/);
console.log('333: real bubble/block pixels, counter topology repair, readability arbitration and 30 art/type reseeds PASS');
