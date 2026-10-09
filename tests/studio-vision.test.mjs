import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
globalThis.document={createElement:tag=>{if(tag==='canvas')return new Canvas(64,40);throw Error(tag)}};
import {makeGenome,mutateGenome,methodFingerprint,programKey} from '../public/studio/evolution.js';
import {renderLandscape} from '../public/studio/landscape.js';
import {renderLettering} from '../public/studio/lettering.js';
import {describeCanvas,visualDistance,visualBreakdown,visualFeedbackScore,
  discoveryLabel,rankVisualExperiments,blindSummary} from '../public/studio/vision.js';
async function paint(mode,recipe){
 const c=new Canvas(390,241);
 if(mode==='landscape')await renderLandscape(c,recipe,{animate:false,quality:.17});
 else renderLettering(c,recipe);
 return describeCanvas(c,mode);
}
const g=makeGenome('landscape',36);
const recipe={mode:'landscape',genome:g,seed:35,scene:'mountains',mood:'golden'};
const original=await paint('landscape',recipe),same=await paint('landscape',recipe);
assert.equal(visualDistance(original,same),0,'pixel-identical means visual distance zero');
const edits=[];
for(const focus of ['structure','surface','light']){
 const mutated=mutateGenome(g,focus,9876+edits.length*17);
 const target=await paint('landscape',{...recipe,genome:mutated});
 const distance=visualDistance(original,target);
 edits.push({focus,distance,visual:target});
 assert.ok(distance>0.005,focus+' must change visual output');
 assert.notEqual(methodFingerprint(g),methodFingerprint(mutated),'method id changes');
 console.log(focus,'visual distance',distance,'group',discoveryLabel(distance));
}
const other=await paint('landscape',{...recipe,scene:'coast',mood:'storm',genome:makeGenome('landscape',952)});
console.log('different scene/mood distance',visualDistance(original,other));
const ranked=rankVisualExperiments(original,edits);
assert.ok(ranked.length>=1,'visual experiments rank nontrivial methods');
assert.ok(ranked.every(x=>x.visualDifference>=.045));
assert.ok(visualFeedbackScore(original,[{liked:false,visual:original}])<
   visualFeedbackScore(other,[{liked:false,visual:original}]),'disliked visual similarity discouraged');
const bl=blindSummary([{trainedPreferred:true},{trainedPreferred:false},{trainedPreferred:true}]);
assert.deepEqual({wins:bl.wins,losses:bl.losses,trials:bl.trials},{wins:2,losses:1,trials:3});
assert.ok(bl.lower<.5&&bl.upper>.5,'small sample inconclusive');
assert.ok(blindSummary(Array.from({length:20},()=>({trainedPreferred:true}))).lower>.5,'20/20 is evidence of preference');
const lg=makeGenome('lettering',36),lr={mode:'lettering',genome:lg,seed:21,text:'HEXFIELD',style:'geometric',type:'wordmark'};
const a=await paint('lettering',lr),b=await paint('lettering',lr);
assert.equal(visualDistance(a,b),0);
for(const focus of ['structure','surface','light']){
 const variation=mutateGenome(lg,focus,555+focus.length);
 const dist=visualDistance(a,await paint('lettering',{...lr,genome:variation}));
 assert.ok(dist>.005,focus+' letter procedure visibly changes');
 console.log('letter',focus,'distance',dist);
}
// Numeric parameters belong to the method identity, even if operations unchanged.
const h=structuredClone(g);h.horizon+=.03;
assert.equal(programKey(h),programKey(g));
assert.notEqual(methodFingerprint(h),methodFingerprint(g));
console.log('VISUAL DISCOVERY TESTS PASSED');
