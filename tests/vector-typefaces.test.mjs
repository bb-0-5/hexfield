/* Hexfield 335 / fresh procedural vector glyphs, not masked stock fonts. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(kind){
 assert.equal(kind,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const {VECTOR_GLYPHS,coversVectorGlyph,constructVectorLetters}=
 await import('../public/studio/vector-letterforms.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {typeGenome}=await import('../public/studio/type-genome.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const {assessGlyphMask}=await import('../public/studio/type-legibility.js');
assert.ok(Object.keys(VECTOR_GLYPHS).length>=49);
for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:/+-&%@#'){
 assert.ok(coversVectorGlyph(letter),'Missing hand-drawn path for '+letter);
}
const W=480,H=270,band={top:86,height:84,widthRatio:.92,centerX:240};
const choice=(grammar,seed=37)=>({type:typeGenome(seed,grammar)});
const painted=new Map();
for(const grammar of ['bubble','block','rounded','architectural','kinetic','split']){
 const word='HEXFIELD',render=()=>constructVectorLetters(word,W,H,band,choice(grammar));
 const a=render(),b=render();
 assert.equal(a.fallbackGlyphs,0);
 assert.equal(a.vectorGlyphs,8);
 assert.equal(a.parts.length,8);
 assert.match(a.anatomy,new RegExp('^'+grammar+'/'));
 assert.deepEqual(a.pixels,b.pixels);
 assert.deepEqual(a.core,b.core);
 assert.ok(a.typeLegibility.score>=.7);
 assert.ok(a.parts.every(p=>p.x0<p.x1&&p.bottom>p.top));
 let count=0;
 for(const px of a.pixels)if(px>100)count++;
 assert.ok(count>800,'No genuine vector type pixels from '+grammar);
 painted.set(grammar,Buffer.from(a.pixels));
}
assert.notDeepEqual(painted.get('bubble'),painted.get('block'));
assert.notDeepEqual(painted.get('rounded'),painted.get('architectural'));
assert.notDeepEqual(painted.get('kinetic'),painted.get('split'));
const o=constructVectorLetters('O',W,H,
 {top:76,height:124,widthRatio:.91,centerX:240},choice('bubble',222));
const {pixels:p,core:c,parts} =o;
const evidence=assessGlyphMask(c,p,W,H,parts);
assert.ok(evidence.countersTested>=1,'O must have an enclosed and preserved aperture');
assert.ok(evidence.counters>=.75,
 'Inflated bubble O must not collapse its counter to a solid circle');
const foreign=constructVectorLetters('Bé♥',W,H,band,choice('block'));
assert.equal(foreign.fallbackGlyphs,1,
 'Unsupported multilingual letters must have reliable Canvas fallback');
const canvas=()=>{const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#e1d8bc';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#23475f';ctx.fillRect(5,10,180,160);return c};
const pixels=c=>Buffer.from(c.getContext('2d').
 getImageData(0,0,W,H).data);
const recipe={...makeRecipe({seed:777,subject:'coast',
 mark:'dots',primary:'no_shading'}),typeGenome:typeGenome(777,'bubble')};
const a=canvas(),b=canvas(),source=canvas(),text='BUBBLE 2026';
const options={recipe,sourceCanvas:source,seed:777,iteration:4};
const first=paintWordsOnCanvas(a,text,options),second=paintWordsOnCanvas(b,text,options);
assert.equal(first.face,'HEXFIELD VECTOR');
assert.equal(first.construction,'inflated-vector-strokes');
assert.equal(first.vectorGlyphs,text.length);
assert.equal(first.fallbackGlyphs,0);
assert.ok(first.rimPixels>150);
assert.ok(first.count>1000);
assert.ok(first.typeLegibility.readable);
assert.deepEqual(pixels(a),pixels(b));
assert.deepEqual(first,second);
const sourceCode=readFileSync('public/studio/word-surface.js','utf8');
assert.doesNotMatch(sourceCode,/function buildMask\([\s\S]*?ctx\.fillText\(glyph\.ch/,
 'Final type renderer must no longer distort browser system-font pixels');
assert.match(sourceCode,/constructVectorLetters\(text,w,h,bounds,choice\)/);
console.log('335: hand-drawn 26 Latin letters, 10 digits and punctuation, 6 distinguishable vector constructions, preserved bubble counters, 1-pass painter integration PASS');
