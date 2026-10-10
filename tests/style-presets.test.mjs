/* 327 — a real visible style switch, not five adjectives on one hybrid. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(type){
 assert.equal(type,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const {STYLE_PRESETS,ABSTRACTION_LEVELS,
 styleRecipe,styleById,nextStyle,styleReference,
 styleCaption}=await import('../public/studio/style-presets.js');
const {applyRules}=await import('../public/studio/rule-engine.js');
const {nextAbstractRecipe,visualDelta}=await import('../public/studio/abstraction-loop.js');
const {mixSources}=await import('../public/studio/source-mixer.js');
const w=360,h=230;
const base=new Canvas(w,h),b=base.getContext('2d');
b.fillStyle='#ece2c6';b.fillRect(0,0,w,h);
b.fillStyle='#ca4830';b.fillRect(30,25,105,115);
b.fillStyle='#216fa2';b.fillRect(195,58,122,137);
b.fillStyle='#8cbb45';b.fillRect(108,168,132,35);
const image=()=>new Canvas(w,h);
const bytes=canvas=>Buffer.from(canvas.getContext('2d',
 {willReadFrequently:true}).getImageData(0,0,w,h).data);
assert.equal(STYLE_PRESETS.length,5);
assert.equal(Object.keys(ABSTRACTION_LEVELS).length,3);
assert.equal(new Set(STYLE_PRESETS.map(s=>s.mark)).size,5);
let id='ink';
for(const preset of STYLE_PRESETS.slice(1)){
 id=nextStyle(id).id;assert.equal(id,preset.id);
}
assert.equal(nextStyle(id).id,'ink');
const paintings=[],signatures=new Set();
for(const preset of STYLE_PRESETS){
 const recipe=styleRecipe({style:preset.id,abstraction:'gentle',
   seed:0x327ee,subject:'coast'});
 const copy=styleRecipe({style:preset.id,abstraction:'gentle',
   seed:0x327ee,subject:'coast'});
 assert.equal(recipe.primary,preset.law);
 assert.equal(recipe.mark,preset.mark);
 assert.equal(recipe.styleId,preset.id);
 assert.equal(recipe.rework,'none',
  'Gentle style explicitly disables destructive abstract masses');
 assert.deepEqual(
  [recipe.primary,recipe.secondary,recipe.mark,recipe.rework,recipe.seed],
  [copy.primary,copy.secondary,copy.mark,copy.rework,copy.seed]);
 const first=image(),second=image();
 const a=applyRules(base,first,recipe,{iteration:1,trace:true});
 const c=applyRules(base,second,copy,{iteration:1,trace:true});
 assert.deepEqual(bytes(first),bytes(second),
  'REPEAT STYLE must produce byte-for-byte same image from same source and seed');
 assert.deepEqual(a,c,'Repeat must produce same executed mark trace and counts');
 paintings.push(first);
 signatures.add(preset.mark+':'+preset.law);
 assert.match(styleCaption({style:preset.id,
  abstraction:'gentle',seed:0x327ee}),/SEED 000327EE/);
}
assert.equal(signatures.size,5);
let differences=0;
for(let i=1;i<paintings.length;i++)if(
 visualDelta(paintings[i-1],paintings[i])>.08)differences++;
assert.ok(differences>=3,
 'Different style presets MUST give several materially different raster results');
const ink=styleRecipe({style:'ink',seed:9});
const wild=styleRecipe({style:'ink',seed:9,abstraction:'wild'});
assert.equal(ink.rework,'none');
assert.equal(wild.rework,'abstract_masses');
const medium=styleRecipe({style:'expression',seed:9,
 abstraction:'balanced'});
assert.equal(medium.rework,'none');
assert.equal(styleById('not-known').id,'ink');
const list=[
 {name:'parent',canvas:paintings[0]},
 {name:'reality',canvas:base},
 {name:'archive',canvas:paintings[1]}
];
const chosen=styleReference(list,{abstraction:'gentle'});
assert.equal(chosen.name,'reality',
 'LOW must prioritise a coherent recognizable reference over an already abstracted parent');
assert.equal(styleReference(list,{abstraction:'wild'}),null);
const clean=mixSources([chosen],{width:w,height:h,mode:'quilt',seed:27});
assert.deepEqual(bytes(clean.canvas),bytes(base),
 'One-source gentle mixer must not introduce additional colour dissonance');
const automatic=nextAbstractRecipe(null,{seed:754,cycle:0,
 subject:'coast',style:'poster',abstraction:'gentle'});
assert.equal(automatic.mark,'cutout');
assert.equal(automatic.primary,'no_shading');
assert.equal(automatic.rework,'none');
assert.equal(nextAbstractRecipe(automatic,{seed:755,cycle:3,
 subject:'coast',style:'poster',abstraction:'gentle'}).mark,'cutout',
 'A chosen auto style must not silently mutate back to hybrid');
const html=readFileSync('public/index.html','utf8');
const ui=readFileSync('public/studio/rule-studio.js','utf8');
assert.match(html,/id="ruleChangeStyle"/);
assert.match(html,/id="ruleRepeatStyle"/);
assert.match(html,/id="ruleAbstractionLevel"/);
assert.match(html,/LOW · recognisable subject/);
assert.match(ui,/paintSelectedStyle/);
assert.match(ui,/styleAnchor=cleanCopy\(original\)/,
 'Five variations must reuse an immutable original reference');
assert.match(ui,/renderRuleLive\(styleAnchor,target,recipe/,
 'Clicking CHANGE STYLE must visibly execute real paint strokes');
assert.match(ui,/present\(recipe,styleAnchor,false,\{canvas:target,metrics:painted.metrics\}\)/,
 'The accepted result must reuse actual painted pixels instead of creating a fake duplicate');
console.log('327: five distinct repeatable brush styles, low/medium/high REAL abstraction controls, original-source conservation and live renderer switch PASS');
