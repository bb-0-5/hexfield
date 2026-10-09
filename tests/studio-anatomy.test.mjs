/* Actual geometry-and-pixel tests of individually mutable letter anatomy. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
globalThis.document={createElement(name){assert.equal(name,'canvas');return new Canvas(1,1);}};
const mod=await import('../public/studio/glyph-anatomy.js');
const {ANATOMY,PART_OPERATIONS,ANATOMY_PRESETS,GUIDELINES,glyphAnatomy,
 partsForWord,compileAnatomyGlyph,mutateAnatomyProgram,editAnatomyProgram}=mod;
const {paintAnatomyWord,hitTestAnatomy}=await import('../public/studio/anatomy-renderer.js');
const {makeGenome,mutateGenome,evaluateSurface,geneFeatures}=await import('../public/studio/evolution.js');
const {renderLettering}=await import('../public/studio/lettering.js');

assert.ok(Object.keys(ANATOMY).length>=28);
assert.ok(Object.keys(PART_OPERATIONS).length>=18);
assert.ok(GUIDELINES.cap<GUIDELINES.x && GUIDELINES.x<GUIDELINES.baseline);
for(const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&-+.'){
 const anatomy=glyphAnatomy(char);
 assert.ok(anatomy.components.length>0,'Every common printable logo character needs actual paths: '+char);
 for(const component of anatomy.components){
   assert.ok(component.points.length>=2,'Component missing geometry on '+char);
   assert.ok(component.points.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)),'Non-finite geometry on '+char);
   assert.ok(component.part in ANATOMY,'Unrecognised anatomical label '+component.part+' on '+char);
 }
}
const available=partsForWord('HEXFIELD');
for(const part of ['stem','crossbar','diagonal','arm','counter','join','terminal'])
 assert.ok(available[part]?.length,part+' must be named in HEXFIELD');
assert.ok(glyphAnatomy('g').parts.includes('descender'));
assert.ok(glyphAnatomy('i').parts.includes('dot'));
assert.ok(glyphAnatomy('O').parts.includes('counter'));
assert.ok(glyphAnatomy('C').parts.includes('aperture'));
const none=editAnatomyProgram({v:1,enabled:true,rules:[]});
assert.equal(none.rules.length,0,'UNDO should not reintroduce a default rule');

const crossbar=editAnatomyProgram({v:1,enabled:true,rules:[
 {target:'crossbar',operation:'lift',amount:.90,glyph:'H'}
]});
const H0=compileAnatomyGlyph('H',0,none);
const H1=compileAnatomyGlyph('H',0,crossbar);
const get=(glyph,part)=>glyph.components.filter(c=>c.part===part).map(c=>c.points);
assert.notDeepEqual(get(H0,'crossbar'),get(H1,'crossbar'),'A crossbar rule changes the crossbar');
assert.deepEqual(get(H0,'stem'),get(H1,'stem'),'It MUST NOT alter the stems');
const E0=compileAnatomyGlyph('E',1,none);
const E1=compileAnatomyGlyph('E',1,crossbar);
assert.deepEqual(E0.components,E1.components,'Scoped H edit MUST NOT alter E');
const bowl0=compileAnatomyGlyph('O',0,none);
const opened=compileAnatomyGlyph('O',0,editAnatomyProgram({rules:[
 {target:'counter',operation:'open',amount:.90,glyph:'all'}
]}));
assert.equal(opened.components.find(c=>c.part==='bowl').open,true,'Opening counter must alter its bowl path');
assert.notDeepEqual(bowl0.components,opened.components);
const stacked=editAnatomyProgram({rules:[
 {target:'stem',operation:'bend',amount:.74,glyph:'all'},
 {target:'stem',operation:'thin',amount:.50,glyph:'all'}
]});
const affected=compileAnatomyGlyph('H',0,stacked);
assert.ok(affected.components[0].width<1,'Stacked thin applies after bend');
assert.notDeepEqual(affected.components[0].points,H0.components[0].points,'Stacked bend still applies');

const canvas=()=>new Canvas(1200,740);
const first=canvas(),second=canvas(),guided=canvas(),native=canvas();
const standard={
 mode:'lettering',seed:5,text:'HexField',style:'anatomy',type:'wordmark',
 genome:makeGenome('lettering',153),anatomy:none
};
const baseline=paintAnatomyWord(first,standard);
const mutant=paintAnatomyWord(second,{...standard,anatomy:editAnatomyProgram({rules:[
 {target:'crossbar',operation:'lift',amount:.95,glyph:'H'},
 {target:'counter',operation:'expand',amount:.84,glyph:'all'}
]})});
const monogram=paintAnatomyWord(canvas(),{...standard,type:'monogram',text:'Half Man Studios',anatomy:none});
assert.equal(monogram.text,'HMS','Monogram must use initials instead of painting the whole phrase');
const emblem=paintAnatomyWord(canvas(),{...standard,type:'emblem',text:'ABC',anatomy:none});
assert.equal(emblem.text,'ABC','Short-word emblems keep readable initials');
assert.ok(baseline.paintedComponents>=10);
assert.ok(mutant.mutatedComponents>0);
assert.ok(mutant.affected.crossbar>0&&mutant.affected.counter>0);
assert.notDeepEqual(first.toBufferSync('png'),second.toBufferSync('png'),'Named-area rules must change final pixels');
const guide=paintAnatomyWord(guided,{...standard,anatomy:{rules:[ANATOMY_PRESETS.flying_crossbars]}},{guide:true});
assert.equal(guide.engine,'named-glyph-anatomy');
assert.ok(guide.hitMap.length>0);
const p=guide.hitMap[0].points[0];
const selected=hitTestAnatomy(guide,p[0],p[1],20);
assert.ok(selected&&selected.char==='H','Canvas inspector should resolve real glyph strokes');
const oldFont=renderLettering(native,{...standard,style:'anatomy',anatomy:{enabled:false,rules:[]}});
assert.ok(oldFont.text,'Native font rendering should still work when anatomy is disabled');

const gene=makeGenome('lettering',134);
assert.ok(gene.anatomy.rules.length>=1);
assert.equal(evaluateSurface(gene).length,0);
const child=mutateGenome(gene,'structure',981);
assert.equal(evaluateSurface(child).length,0);
assert.ok(child.anatomy.rules.length>=1);
assert.ok(geneFeatures(child).anatomyPart,'Anatomy identity must feed preference learning');
const mutated=mutateAnatomyProgram(crossbar,131,{forcePart:'crossbar'});
assert.ok(mutated.rules[0].target==='crossbar');
console.log('Glyph anatomy: 66 letter/number/punctuation structures, direct component-only edits, stacked programs, counter openings, final canvas pixels and clickable inspector passed.');
