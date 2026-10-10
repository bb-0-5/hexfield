/* 334: measured graphic coherence, not just "the renderer ran". */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(kind){
 assert.equal(kind,'canvas');return new Canvas(1,1);
}};
const saved=new Map();
globalThis.localStorage={
 getItem:key=>saved.get(key)||null,
 setItem:(key,val)=>saved.set(key,String(val))
};
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {typeGenome}=await import('../public/studio/type-genome.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const {wordSafeSources,createSourceBank}=await import('../public/studio/source-mixer.js');
const W=380,H=220;
function plate(background){
 const canvas=new Canvas(W,H),ctx=canvas.getContext('2d');
 ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=background==='#e4dbce'?'#b0baa9':'#253d44';
 ctx.fillRect(45,47,115,118);return canvas;
}
const pixels=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const bgChoices=[['#e4dbce','dark-on-light'],['#182932','light-on-dark']];
const snapshots={};
for(const [background,expected] of bgChoices){
 for(const grammar of ['bubble','block']){
  const base=plate(background),one=plate(background),two=plate(background);
  const recipe={...makeRecipe({
   seed:454,generation:1,subject:'abstract',mark:'dots',primary:'no_shading'
  }),typeGenome:typeGenome(454,grammar)};
  const options={recipe,sourceCanvas:base,seed:454,iteration:1};
  const a=paintWordsOnCanvas(one,'HELLO',options),
    b=paintWordsOnCanvas(two,'HELLO',options);
  assert.ok(a.painted&&a.count>1000,'Large display text must be genuinely printed');
  assert.equal(a.inkDirection,expected,
   'Choose one legible pigment direction for an entire word');
  assert.equal(a.coherentInk,true);
  assert.ok(a.chromaticFraction>.20,
   'The dark contour is intentionally neutral; a visible proportion of the body must retain hue');
  assert.ok(a.typeLegibility.score>.65,
   'Artist should keep recognisable glyph skeletons');
  assert.deepEqual(a,b);
  assert.deepEqual(pixels(one),pixels(two),
   'A deliberate art direction must still reproduce pixels exactly');
  if(grammar==='bubble')
    assert.ok(a.rimPixels>100,
     'Bubble must contain an actual thick outer rim, not just a font name');
  else assert.equal(a.rimPixels,0,
    'Block is flat/squared, not the same rimmed bubble treatment');
  snapshots[background+grammar]=pixels(one);
 }
 assert.notDeepEqual(snapshots[background+'bubble'],snapshots[background+'block'],
   'Two type grammars must have visibly different raster output');
}
const all=[{name:'reality'},{name:'terrain'},{name:'parent'},
 {name:'lettering'},{name:'logo'},{name:'kept'}];
assert.deepEqual(wordSafeSources(all,true).map(x=>x.name),
 ['reality','terrain','parent'],
 'Avoid brand marks or unrelated lettering stamped into a clean painting');
const clean=plate('#e4dbce'),noText=plate('#e4dbce');
assert.equal(paintWordsOnCanvas(noText,'').painted,false);
assert.deepEqual(pixels(noText),pixels(clean));
const studio=readFileSync('public/studio/rule-studio.js','utf8'),
 source=readFileSync('public/studio/source-mixer.js','utf8'),
 loop=readFileSync('public/studio/abstraction-loop.js','utf8'),
 html=readFileSync('public/index.html','utf8');
assert.match(studio,/stored===null\?'':String\(stored\)/,
 'A new visitor should see art rather than an unsolicited watermark');
assert.doesNotMatch(source,/getWords\(\)\|\|'HEXFIELD'/,
 'No permanent phantom HEXFIELD lettering in donor painting');
assert.doesNotMatch(source,/renderLettering\(lettering/,
 'Typeset once in final unified canvas, not as a redundant donor');
assert.match(loop,/wordSafeSources\(bank\.sources\(previous\),true\)/);
assert.match(html,/id="ruleTechnicalDetails"/,
 'Explanation should be available but not plastered over the artwork');
assert.match(html,/id="ruleHeroStatus"/);
console.log('334: no ghost wordmarks, bubble has physical rims, consistent word ink on dark/light art, type reproducibility, one visible status PASS');
