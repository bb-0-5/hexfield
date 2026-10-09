import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
const entries=new Map();
globalThis.localStorage={
 getItem:key=>entries.get(key)||null,setItem:(key,v)=>entries.set(key,String(v))
};
globalThis.document={createElement(tag){
 assert.equal(tag,'canvas');return new Canvas(1,1);
}};
const {
 evolveSeed,canvasFingerprint,fingerprintDistance,noveltyAssessment,
 assessCanvas,commitCanvas,rankNoveltyCandidates,snapshotNoveltyMemory,
 methodSignature,OBSERVATION_LIMIT,NOVELTY_STORAGE
}=await import('../public/studio/nonredundancy.js');

const picture=(kind='red',seed=0)=>{
 const canvas=new Canvas(240,160),ctx=canvas.getContext('2d');
 ctx.fillStyle='#e1dcd1';ctx.fillRect(0,0,240,160);
 if(kind==='red'){ctx.fillStyle='#b32f30';ctx.fillRect(45,20,150,120);}
 if(kind==='blue'){ctx.fillStyle='#2975b0';ctx.fillRect(45,20,150,120);}
 if(kind==='checker'){
   for(let y=0;y<160;y+=20)for(let x=0;x<240;x+=20){
     if((x/20+y/20+seed)%2===0){ctx.fillStyle='#263651';ctx.fillRect(x,y,20,20);}
   }
 }
 if(kind==='bars'){
   for(let i=0;i<8;i++){ctx.fillStyle='#1d5b49';
     ctx.fillRect(20+i*26,20+(seed%5),13,123);}
 }
 return canvas;
};
assert.equal(evolveSeed(90210,4,1,'logo'),evolveSeed(90210,4,1,'logo'));
assert.notEqual(evolveSeed(90210,4,1,'logo'),evolveSeed(90210,4,2,'logo'));
assert.notEqual(evolveSeed(90210,4,1,'logo'),evolveSeed(90210,5,1,'logo'));
assert.notEqual(evolveSeed(90210,4,1,'logo'),evolveSeed(90211,4,1,'logo'));
const start=picture('red'),copy=picture('red'),alternate=picture('blue');
const fp=canvasFingerprint(start),fp2=canvasFingerprint(copy),fb=canvasFingerprint(alternate);
assert.equal(fingerprintDistance(fp,fp2),0,'Identical pictures must have zero visual distance');
assert.ok(fingerprintDistance(fp,fb)>.025,'Colour swap should register novelty');
const flat=canvasFingerprint(picture()),structured=canvasFingerprint(picture('checker'));
assert.ok(structured.structure>flat.structure,'Spatial structure should reflect edge complexity');
const key=methodSignature({mode:'lettering',text:'HEXFIELD',mark:'dots',primary:'counter'});
assert.ok(key.includes('lettering|')&&key.includes('dots'));
const initial=assessCanvas(start,{mode:'landscape',method:key});
assert.equal(initial.observed,0);
commitCanvas(start,{mode:'landscape',method:key,seed:777});
const same=assessCanvas(copy,{mode:'landscape',method:key,parent:fp});
assert.equal(same.redundant,true);
assert.equal(same.methodRepeats,1);
assert.equal(same.novelty,0);
assert.equal(same.globalNovelty,0);
const cross=assessCanvas(copy,{mode:'lettering',method:'wordmark'});
assert.equal(cross.novelty,1,'Different discipline can still have a different local history');
assert.equal(cross.globalNovelty,0,'But identical pictures share global history');
const ranked=rankNoveltyCandidates([
 {canvas:copy,method:key},{canvas:picture('checker'),method:'fracture'},
 {canvas:picture('blue'),method:'counter'}],
 {mode:'landscape',parent:fp});
assert.ok(ranked[0].method!=='logo'&&ranked[0].method!==key,
 'Candidate selection should not choose the exact same known image');
assert.ok(!ranked[0].assessment.redundant);
const changed=assessCanvas(picture('checker'),{mode:'landscape',method:'fracture',parent:fp});
assert.ok(changed.parentNovelty>.04,'The child genuinely differs from its parent');
assert.ok(changed.complexityGain>0,'Structural complexity gain must use actual parent canvas or fingerprint');
for(let i=0;i<OBSERVATION_LIMIT+25;i++){
 const alternate=picture(i%3===0?'red':i%3===1?'blue':'bars',i);
 commitCanvas(alternate,{mode:i%3===0?'logo':'archive',method:'branch-'+i,
   seed:evolveSeed(1234,i,0)});
}
const final=snapshotNoveltyMemory();
assert.ok(final.stored<=OBSERVATION_LIMIT);
assert.equal(final.count,OBSERVATION_LIMIT+26);
assert.ok(entries.get(NOVELTY_STORAGE).length<160000,'History must remain mobile localStorage friendly');
assert.ok(final.modes.includes('logo')&&final.modes.includes('archive'));
console.log('Global W nonredundancy: identical images rejected, cross-mode memory, evolving seeds, complexity, candidate ranking and bounded storage passed.');
