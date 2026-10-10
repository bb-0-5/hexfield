/* Hexfield Build 303 / A true parent→child abstracting process.
 * At every iteration combine renderers at pixel level, enforce new formal
 * visual laws, then use the ACTUAL result as the next source image.
 * Explicit start/stop. Never invokes a paid image model automatically.
 */
import {makeRecipe,mutateRecipe,applyRules,noteLineage,LAWS,MARKS,SUBJECTS,ruleTaste} from './rule-engine.js';
import {createSourceBank,mixSources,cloneCanvas,prepareMixSamples} from './source-mixer.js';
import {planDirtyTiles,shouldUseLocalRender} from './dirty-tiles.js';
import {renderPlan,recordRenderTime,yieldToBrowser} from './render-governor.js';
import {evolveSeed,rankNoveltyCandidates,commitCanvas,
  methodSignature,snapshotNoveltyMemory} from './nonredundancy.js';
import {paintHeldMotifs,advanceMotifMemory,motifEvidence} from './motif-memory.js';
import {extractStructuralIdea,paintInheritedIdeas,advanceStructuralIdeas,
 heritageEvidence,judgeStructuralIdeas,rankBalancedCandidates,
 recallStructuralIdea} from './structural-heritage.js';
import {getGoldenMode} from './golden-taste.js';
import {newMarkProgram,evolveMarkProgram,rememberedMarkPrograms} from './mark-program.js';
import {chooseGeometryRelation} from './geometry-coupling.js';
import {deriveBetweenFrames,DERIVATION_METHODS,derivationMethod} from './frame-derivation.js';
import {loadObjectRegistry,loadObjectRegistryFromDB,saveObjectRegistry,
 updateObjectRegistry,paintStableObjects,rememberObjectVerdict} from './object-memory.js';
import {PREVIEW_WIDTH,PREVIEW_HEIGHT,scorePreflight,
 chooseFullRenderCandidates,budgetEvidence} from './render-budget.js';
export const REWORK_SEQUENCE=['abstract_masses','negative_repaint','misread','remove_strength'];
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const choice=(a,seed=1)=>a[(seed>>>0)%a.length];
const freshCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function visualDelta(a,b){
 if(!a||!b)return 1;
 const w=48,h=30;
 const sample=canvas=>{
   const c=freshCanvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(canvas,0,0,w,h);return ctx.getImageData(0,0,w,h).data;
 };
 const x=sample(a),y=sample(b);let dist=0;
 for(let i=0;i<x.length;i+=4)dist+=
   (Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]))/765;
 return dist/(w*h);
}
export function nextAbstractRecipe(parent,{cycle=0,branch=0,seed=null,
  subject='abstract',lockLaw=false,
  law='surprise',secondary='none',mark='surprise'}={}){
 const options={subject:subject==='surprise'?'abstract':subject};
 let recipe;
 if(!parent){
   recipe=makeRecipe({
     ...options,primary:law,secondary,mark,
     rework:'abstract_masses',seed:Number.isFinite(seed)?seed:
       (Math.random()*4294967295)>>>0
   });
   // The first picture uses all mark-making engines together unless the
   // painter explicitly locks an individual mark as a formal restriction.
   if(!lockLaw||mark==='surprise')recipe.mark='hybrid';
 }else{
   // Invent the next constraint, scene, brush and rework autonomously.
   // Deliberate locks remain authoritative; the basic UI needs no knobs.
   const focus=cycle%7===0?'subject':cycle%5===1?'mark':
     cycle%4===0?'law':'rework';
   const nextSeed=Number.isFinite(seed)?seed:
     evolveSeed(parent.seed,cycle+1,branch,'abstract');
   recipe=mutateRecipe(parent,focus,'studio',nextSeed);
   recipe.seed=nextSeed;
   recipe.rework=REWORK_SEQUENCE[(cycle+branch)%REWORK_SEQUENCE.length];
   recipe.parentId=parent.id;
   recipe.generation=(parent.generation||0)+1;
   // Every procedure mutation and renderer sampler now uses a branch of
   // the existing seed, not a fresh random draw or a fixed repeated seed.
   recipe.seed=nextSeed;
   if(lockLaw&&law!=='surprise'){recipe.primary=law;recipe.secondary=secondary==='none'?'none':secondary;}
   if(lockLaw&&mark!=='surprise')recipe.mark=mark;
   else if(recipe.rework!=='remove_strength' && cycle%5!==0)
     recipe.mark='hybrid'; // Use all surface renderers together for most generations.
   if(recipe.rework==='remove_strength'){
     if(lockLaw&&mark!=='surprise'){
       // The user explicitly locked the brush. Do a subtractive rebuild
       // rather than silently violating that lock.
       recipe.rework='negative_repaint';
     }else{
       recipe.forbiddenMark=parent.mark;
       if(recipe.mark===parent.mark)
         recipe.mark=choice(Object.keys(MARKS).filter(x=>x!==parent.mark),
           nextSeed);
     }
   }
 }
 if(recipe.primary===recipe.secondary)recipe.secondary='none';
 if(!(recipe.primary in LAWS))recipe.primary=choice(Object.keys(LAWS),recipe.seed);
 if(!(recipe.mark in MARKS))recipe.mark=choice(Object.keys(MARKS),recipe.seed);
 return recipe;
}
export function createAbstractionLoop({
  width=720,height=450,
  getArchive=()=>null,getUploaded=()=>null,getParent=()=>null,
  getParentRecipe=()=>null,getWords=()=>'',
  postProcess=()=>null,
  onFrame=()=>{},onState=()=>{},onError=()=>{}
}={}){
 const bank=createSourceBank({width,height,getArchive,getUploaded,getParent,getWords});
 let running=false,waiting=false,timer=null,activeStep=false;
 let cycle=0,seed=Math.floor(Math.random()*4294967295),last=null;
 let lastRecipe=null,config={},lastMix=null,lastError=null,lastAssessment=null;
 let stamps=[],stamp=0,forceFreshSources=true,motifs=[],ideas=[];
 let objects=loadObjectRegistry(),renderBudget=null,dirtyStats=null;
 let performanceHistory={emaMs:0,samples:0},lastFrameMs=0,stage='idle';
 void loadObjectRegistryFromDB().then(saved=>{
  if(saved?.objects?.length&&!objects.objects.length&&cycle===0)objects=saved;
 }).catch(()=>{});
 const state=()=>({
   running,waiting,cycle,recipe:lastRecipe,
   sourceNames:lastMix?.sources||[],method:lastMix?.mode||null,
   lastError,nonredundancy:lastAssessment,golden:lastAssessment?.golden||null,
   globalMemory:snapshotNoveltyMemory().count,
   currentSeed:lastRecipe?.seed??seed,donorGenerations:bank.genomes(),
   motifs:motifEvidence(motifs),ideas:heritageEvidence(ideas),
   heritage:lastAssessment?.heritage||null,
   objects:(objects.objects||[]).map(o=>({
     id:o.id,rootId:o.rootId,bbox:o.bbox,age:o.age,
     palette:o.palette,volatility:o.volatility,votes:o.votes,
     wordContacts:o.wordContacts||0,
     stable:o.age>=3&&o.volatility<.24
   })),
   renderBudget,dirtyStats,lastFrameMs,
   performanceHistory:{...performanceHistory},stage,
   threeWay:lastAssessment?.threeWay||null,
   history:stamps.map(x=>({...x})),
   waitingReason:waiting?'Page hidden':''
 });
 const status=()=>onState(state());
 function delay(ms){
   if(timer)clearTimeout(timer);
   if(!running||document.hidden){waiting=!!running;status();return;}
   waiting=false;
   timer=setTimeout(()=>{timer=null;void step();},ms);
 }
 function pause(){
   running=false;waiting=false;stamp++;stage='paused';
   if(timer)clearTimeout(timer);timer=null;
   status();
 }
 function reset(){
   pause();cycle=0;last=null;lastRecipe=null;lastMix=null;stamps=[];lastAssessment=null;
   motifs=[];ideas=[];dirtyStats=null;performanceHistory={emaMs:0,samples:0};
   lastFrameMs=0;stage='idle';
   seed=Math.floor(Math.random()*4294967295);
   bank.clear();forceFreshSources=true;status();
 }
 function configure(newConfig={}){
   config={...config,...newConfig};
   if(typeof config.speed!=='number'||!Number.isFinite(config.speed))config.speed=3000;
   config.speed=clamp(config.speed,1200,12000);
   status();
 }
 async function step(){
   if(activeStep||document.hidden)return;
   activeStep=true;
   const currentStamp=stamp;
   const begun=typeof performance!=='undefined'&&performance.now?
     performance.now():Date.now();
   let committed=false;
   const checkpoint=async message=>{
     stage=message;status();
     await yieldToBrowser();
     return currentStamp===stamp&&!document.hidden;
   };
   try{
     // Give the initial visible canvas a genuine browser paint opportunity.
     if(!await checkpoint('Preparing painter'))return;
     const previous=last||getParent();
     const inheritedRecipe=lastRecipe||(previous?getParentRecipe():null);
     const parentSeed=inheritedRecipe?.seed??seed;
     const baseSeed=evolveSeed(parentSeed,cycle+1,0,'abstraction-parent');
     if(!motifs.length&&previous)motifs=advanceMotifMemory([],previous,{
       seed:parentSeed,cycle,parent:previous
     });
     if(!ideas.length&&previous){
       const recovered=extractStructuralIdea(previous,{
         seed:parentSeed,cycle:Math.max(0,cycle-1),
         exclude:motifEvidence(motifs).slice(0,1)
       })||extractStructuralIdea(previous,{
         seed:parentSeed,cycle:Math.max(0,cycle-1)
       });
       if(recovered)ideas=[recovered];
     }
     if(!ideas.length){
       const recollected=recallStructuralIdea({
         seed:parentSeed,cycle
       });
       if(recollected)ideas=[recollected];
     }
     // The source bank refreshes from the current lineage seed. The
     // picture still has an external reference; the generator isn't reset.
     const donorsRefreshed=cycle===0||cycle%6===0||forceFreshSources;
     if(donorsRefreshed){
       try{
         const scene=config.subject&&config.subject!=='surprise'?
           config.subject:choice(Object.keys(SUBJECTS),baseSeed);
         await bank.refresh(baseSeed,scene,{force:true});
         forceFreshSources=false;
       }catch(error){
         forceFreshSources=true;
         lastError='One renderer unavailable: '+String(error.message||error).slice(0,120);
       }
     }
     if(currentStamp!==stamp)return;
     if(!await checkpoint('Preparing source materials'))return;
     const inputs=bank.sources(previous);
     if(!inputs.length)throw Error('No renderer produced an image');
     const candidates=[];
     const localAllowed=shouldUseLocalRender({
       cycle,previous,inherited:inheritedRecipe,words:getWords(),
       donorsRefreshed,
       forceFull:!!config.forceFull||!!(config.lockLaw&&(
         (config.law&&config.law!=='surprise'&&
           config.law!==inheritedRecipe?.primary)||
         (config.mark&&config.mark!=='surprise'&&
           config.mark!==inheritedRecipe?.mark)))
     });
     const smallSamples=prepareMixSamples(inputs,{
       width:PREVIEW_WIDTH,height:PREVIEW_HEIGHT
     });
     // Invent three proposals and execute their REAL cheap raster previews.
     // Only the winning one/two need full-size paint and W/φ/H scoring.
     const mobile=typeof matchMedia==='function'&&
       matchMedia('(max-width:730px)').matches;
     const devicePlan=renderPlan({
       mobile,emaMs:performanceHistory.emaMs,samples:performanceHistory.samples
     });
     const proposals=[];
     for(let attempt=0;attempt<devicePlan.previews;attempt++){
       if(!await checkpoint('Sketch '+(attempt+1)+'/'+devicePlan.previews))return;
       const candidateSeed=evolveSeed(baseSeed,cycle+1,attempt,'render-branch');
       const recipe=nextAbstractRecipe(inheritedRecipe,{
         cycle,branch:attempt,seed:candidateSeed,subject:config.subject||'abstract',
         lockLaw:!!config.lockLaw,law:config.law||'surprise',
         secondary:config.secondary||'none',mark:config.mark||'surprise'
       });
       const learned=rememberedMarkPrograms();
       const mate=learned.length?learned[(cycle+attempt)%learned.length]:null;
       const dislike=Number(ruleTaste()['mark:'+inheritedRecipe?.mark])||0;
       const mutation=attempt===0&&dislike<-.75?1:attempt;
       // A local change retains global drawing laws instead of pretending a
       // new global style is validly painted with only a few dirty tiles.
       if(localAllowed){
         recipe.primary=inheritedRecipe.primary;
         recipe.secondary=inheritedRecipe.secondary;
         recipe.mark=inheritedRecipe.mark;
         recipe.rework=inheritedRecipe.rework;
       }
       // Once every five generations the entire shortlist deliberately
       // executes an invented compound mark rather than leaving its rare
       // selection to hybrid probabilities. User-locked laws still win.
       if(cycle%5===3&&!config.lockLaw&&!localAllowed)recipe.mark='invented';
       recipe.markProgram=inheritedRecipe?.markProgram?
         evolveMarkProgram(inheritedRecipe.markProgram,{seed:candidateSeed,branch:mutation,mate}):
         newMarkProgram(candidateSeed,recipe.generation);
       recipe.wordRelation=chooseGeometryRelation(candidateSeed,cycle,
         inheritedRecipe?.wordRelation||null,attempt);
       const autoMixer=!config.mixMode||config.mixMode==='auto';
       const families=['quilt','cutaway','dissonance','relief','edges'];
       const mode=autoMixer?
         families[(Math.floor(cycle/3)+attempt)%families.length]:config.mixMode;
       const ancestor=lastRecipe?.application,
         inheritedIndex=DERIVATION_METHODS.indexOf(ancestor);
       const application=inheritedIndex<0?
         derivationMethod(candidateSeed,cycle,attempt):
         attempt===0?ancestor:
         attempt===1?DERIVATION_METHODS[(inheritedIndex+1+cycle%2)%DERIVATION_METHODS.length]:
         derivationMethod(candidateSeed,cycle,attempt);
       recipe.application=application;
       const lowMix=mixSources(inputs,{
         width:PREVIEW_WIDTH,height:PREVIEW_HEIGHT,
         cycle:cycle+attempt*2,seed:candidateSeed,mode,
         prepared:smallSamples
       });
       const preview=freshCanvas(PREVIEW_WIDTH,PREVIEW_HEIGHT);
       applyRules(lowMix.canvas,preview,recipe,{iteration:cycle+attempt,trace:false});
       const preflight=scorePreflight(preview,{
         novelty:visualDelta(previous,preview),
         continuity:ideas.length?.55:.4,
         taste:1-Math.min(1,Math.abs(dislike)/8)
       });
       proposals.push({attempt,candidateSeed,recipe,mode,application,
         preview,preflight});
       if(currentStamp!==stamp)return;
     }
     const finalists=chooseFullRenderCandidates(proposals,{
       cycle,mobile,strict:getGoldenMode()==='strict',
       maxFull:devicePlan.finalists
     });
     // The auto-mixer deliberately explores a scheduled NEW material family
     // every third pass. Preflight must not systematically prune the one
     // candidate carrying that family, or ten generations may all converge.
     // Reserve only an existing finalist slot; do not increase render cost.
     if((!config.mixMode||config.mixMode==='auto')&&cycle%3===0&&
        !finalists.some(x=>x.attempt===0)){
       finalists[finalists.length-1]=proposals[0];
     }
     renderBudget=budgetEvidence(proposals,finalists);
     renderBudget.device=devicePlan.speed;
     renderBudget.recentMs=devicePlan.recentMs;
     if(!await checkpoint('Preparing full-size paints'))return;
     const fullSamples=prepareMixSamples(inputs,{width,height});
     renderBudget.cache={
       preview:smallSamples.cacheEvidence||null,
       full:fullSamples.cacheEvidence||null
     };
     // No preview is misrepresented as a full-resolution candidate.
     for(let finalIndex=0;finalIndex<finalists.length;finalIndex++){
       if(!await checkpoint('Painting '+(finalIndex+1)+'/'+finalists.length))return;
       const proposal=finalists[finalIndex];
       const {attempt,candidateSeed,recipe,mode,application}=proposal;
       const tilePlan=localAllowed?planDirtyTiles(previous,proposal.preview,{
         seed:candidateSeed,cycle,objects:objects.objects
       }):null;
       const partial=!!tilePlan;
       const mixed=mixSources(inputs,{
         width,height,
         cycle:cycle+attempt*2,
         seed:candidateSeed,mode,prepared:fullSamples,
         dirtyTiles:partial?tilePlan.tiles:null
       });
       const output=freshCanvas(width,height);
       const metrics=applyRules(mixed.canvas,output,recipe,{
         iteration:cycle+attempt,trace:true,
         baseCanvas:partial?previous:null,
         dirtyTiles:partial?tilePlan.tiles:null,
         localApplication:partial
       });
       // Derive a real intermediate image from the accepted parent and proposal.
       // This applied process competes alongside source mixers and mark laws.
       // The painter inherits the previously chosen APPLICATION process as well
       // as shape. A competing candidate deliberately mutates that method.
       const derivation=partial?{method:'graft',canvas:null,
         retained:1-tilePlan.coverage,interwoven:tilePlan.coverage,
         changed:tilePlan.coverage}:
         previous?deriveBetweenFrames(previous,output,{
           seed:candidateSeed,cycle,branch:attempt,method:application
         }):null;
       recipe.application=derivation?.method||'fresh';
       if(derivation?.canvas){
         const context=output.getContext('2d');
         context.save();context.setTransform(1,0,0,1,0,0);
         context.drawImage(derivation.canvas,0,0,width,height);context.restore();
       }
       // The new law governs the NEW marks; islands of actual previous
       // brushwork survive as archaeological material. Even wildly
       // different mixers cannot erase them just to score high W novelty.
       const painter=output.getContext('2d');
       if(partial){
         painter.save();painter.setTransform(1,0,0,1,0,0);
         painter.beginPath();
         for(const t of tilePlan.tiles)painter.rect(t.x,t.y,t.w,t.h);
         painter.clip();
       }
       const held=paintHeldMotifs(output,motifs,{cycle,opacity:.93});
       // Geometry survives separately from the original pixels: it
       // undergoes a NEW mark law and pigment material on each child.
       const heritage=paintInheritedIdeas(output,ideas,{
         seed:candidateSeed,cycle,recipe
       });
       const stable=paintStableObjects(output,previous,objects.objects,{
         generation:cycle,opacity:.74,max:3
       });
       if(partial)painter.restore();
       // The word is painted into each competing canvas BEFORE its W/φ/H
       // analysis, so word-and-image composition belongs to the same artwork.
       const composite=postProcess(output,recipe,metrics,{cycle,branch:attempt,
         dirtyTiles:partial?tilePlan.tiles:null});
       const method=methodSignature({mode:'abstraction',primary:recipe.primary,
         secondary:recipe.secondary,mark:recipe.mark,rework:recipe.rework,
         blend:mixed.mode,subject:recipe.subject,
         application:derivation?.method||'new',
         markProgram:metrics.invented.stamps?recipe.markProgram.signature:'',
         interaction:composite?.interaction?.relation||''});
       candidates.push({canvas:output,recipe,mixed,metrics,held,heritage,stable,derivation,composite,method,attempt,dirty:tilePlan});
       if(currentStamp!==stamp)return;
     }
     if(!await checkpoint('Judging actual paintings'))return;
     const evaluated=rankNoveltyCandidates(candidates,{
       mode:'abstraction',parent:previous
     });
     // None of these objectives may monopolize artistic judgement:
     // W seeks novelty, φ seeks proportional harmony, H preserves a
     // recognizable identity while its EXECUTED material evolves.
     const ranked=rankBalancedCandidates(evaluated,{
       strict:getGoldenMode()==='strict'
     });
     const goal=ranked[0];
     // Every third pass deliberately trials a new mixer family. This is
     // genuine active non-redundancy at the METHOD level, not simply
     // scoring arbitrary pixel differences. Strict φ-qualified work
     // retains precedence over this exploratory scheduling.
     const families=['quilt','cutaway','dissonance','relief','edges'];
     const evolvingMix=!config.mixMode||config.mixMode==='auto';
     const expected=families[Math.floor(cycle/3)%families.length];
     const strictQualified=getGoldenMode()==='strict'&&
       ranked.some(x=>x.golden?.qualifies);
     // The exploratory branch MUST use a fully evaluated (W/φ/H) entry;
     // otherwise its threeWay fields disappear, and the frame crashes
     // after incrementing the generation counter.
     const best=evolvingMix&&cycle%3===0&&!strictQualified?
       ranked.find(x=>x.mixed.mode===expected)||goal:goal;
     const {canvas:output,recipe,mixed,metrics,assessment,
       golden,held,heritage,threeWay,derivation,composite}=best;
     dirtyStats=best.dirty?{
       partial:true,coverage:best.dirty.coverage,
       skippedTiles:best.dirty.skippedTiles,dirtyTiles:best.dirty.dirtyTiles,
       processedPixels:mixed.stats.processedPixels,
       omittedRuleCells:metrics.dirty?.omittedCells||0
     }:{partial:false,coverage:1,dirtyTiles:0,skippedTiles:0,
       processedPixels:width*height,omittedRuleCells:0};
     const novelty=visualDelta(previous,output);
     const stalled=cycle>2&&(assessment.redundant||novelty<.035);
     const recorded=commitCanvas(output,{mode:'abstraction',method:best.method,
       seed:recipe.seed,parentId:recipe.parentId,evaluation:assessment});
     lastAssessment={...recorded,golden,
       heritage:{score:heritage.score,coverage:heritage.coverage,
         count:heritage.drawn.length},
       threeWay,markProgram:recipe.markProgram.signature,
       invented:metrics.invented,
       interaction:composite?.interaction||null,
       derivation:derivation?{method:derivation.method,
         retained:derivation.retained,interwoven:derivation.interwoven,
         changed:derivation.changed}:null,candidates:candidates.length,
        preflight:renderBudget,dirty:dirtyStats};
     const survived=motifEvidence(motifs);
     const inherited=heritageEvidence(ideas);
     // Extract once on the winning FULL image; rejected trials are discarded.
     objects=updateObjectRegistry(objects.objects,output,{
       generation:cycle+1,priorId:objects.nextId,
       wordBounds:composite?.bounds||null,
       relation:composite?.interaction?.relation||null
     });
     if(cycle%3===0||objects.stable>0)saveObjectRegistry(objects);
     motifs=advanceMotifMemory(motifs,output,{
       seed:recipe.seed,cycle:cycle+1,parent:previous
     });
     ideas=advanceStructuralIdeas(ideas,output,{
       seed:recipe.seed,cycle:cycle+1,
       source:previous||output,rendered:heritage
     });
     // The creative process is itself a moving artwork: exhibit the
     // ACTUAL rendered alternatives and why one was adopted. Small
     // downscaled canvases cap mobile memory and prevent preview images
     // from becoming hidden background renders or paid model requests.
     const trials=proposals.map(plan=>{
       const actual=ranked.find(entry=>entry.attempt===plan.attempt);
       const preview=freshCanvas(320,200);
       preview.getContext('2d').drawImage(
         actual?.canvas||plan.preview,0,0,320,200);
       return {canvas:preview,
         label:plan.application+' / '+plan.mode+' / '+plan.recipe.primary+
           ' / '+plan.recipe.mark+
           ' / '+(actual?'FINALIST':'COARSE SCREEN')+
           ' / '+(actual?.composite?.interaction?.relation||plan.recipe.wordRelation)+
           ' / φ '+Math.round(
             (actual?.threeWay?.phi??plan.preflight.golden.combined)*100)+'%',
         score:actual?.threeWay?.score??plan.preflight.score,
         golden:actual?.golden??plan.preflight.golden,
         fidelity:actual?'full':'preview',
         selected:actual===best
       };
     });
     const result={canvas:output,recipe,cycle:cycle+1,metrics,trials,
       blend:mixed.mode,derivation,composite,sources:mixed.sources,novelty,stalled,
       survival:{held:survived,coverage:held.coverage,
         carried:held.held.length,available:motifEvidence(motifs).length},
       heritage:{...heritage,ancestors:inherited,
         living:heritageEvidence(ideas),tradeoff:threeWay},
       golden,nonredundancy:lastAssessment,renderBudget,dirty:dirtyStats,
        objectMemory:{count:objects.objects.length,stable:objects.stable,
          matched:objects.matched,extracted:objects.extracted,
          reused:best.stable?.reused||0}};
     last=output;lastRecipe=recipe;lastMix=mixed;cycle++;lastError=null;
     noteLineage(recipe);
     const frame=freshCanvas(164,104);frame.getContext('2d').drawImage(output,0,0,164,104);
     stamps.push({cycle,thumb:frame.toDataURL('image/webp',.60),
       id:recipe.id,parentId:recipe.parentId,seed:recipe.seed,
       mark:recipe.mark,law:recipe.primary,blend:mixed.mode,novelty,
       inventedStamps:metrics.invented.stamps,
       words:composite?.text||'',
       relation:composite?.interaction?.relation||'',
       coupledPixels:(composite?.interaction?.displacedPixels||0)+
         (composite?.interaction?.bentPixels||0),
       markProgram:metrics.invented.stamps?recipe.markProgram.signature:null,
       markRootId:recipe.markProgram.rootId,
       derivedBy:derivation?.method||'fresh',
       retained:derivation?.retained||0,
       globalNovelty:lastAssessment.globalNovelty,
       minSimilarity:lastAssessment.novelty,
       complexity:lastAssessment.complexity,
       survivors:survived.length,heldCoverage:held.coverage,
       inheritedIdeas:heritage.drawn.length,heritageScore:heritage.score,
       inheritedMaterials:heritage.drawn.map(x=>x.material),
       W:threeWay.W,phi:threeWay.phi,H:threeWay.H,
        objectCount:objects.objects.length,stableObjects:objects.stable,
        cachedObjectReuses:best.stable?.reused||0,
        previewTrials:renderBudget.predicted,fullRenders:renderBudget.full,
         dirtyCoverage:dirtyStats.coverage,omittedRuleCells:dirtyStats.omittedRuleCells});
     stamps=stamps.slice(-10);
     const now=typeof performance!=='undefined'&&performance.now?
       performance.now():Date.now();
     lastFrameMs=Math.max(0,Math.round(now-begun));
     performanceHistory=recordRenderTime(performanceHistory,lastFrameMs);
     stage='evolving';committed=true;
     result.renderTiming={elapsedMs:lastFrameMs,
       averageMs:Math.round(performanceHistory.emaMs),
       device:renderBudget.device,
       donorReadbacksSaved:(renderBudget.cache?.full?.hits||0)+
         (renderBudget.cache?.preview?.hits||0)};
     try{onFrame(result)}catch(error){onError(error)}
     status();
     if(stalled){
       // Never leave the next cycle with only its parent. Rebuild REALITY,
       // TERRAIN, and LETTERING before executing the next generation.
       bank.clear();
       forceFreshSources=true;
       // Even stagnation recovery continues the current seed's lineage.
       seed=evolveSeed(recipe.seed,cycle+1,7,'novelty-reseed');
     }
   }catch(error){
     lastError=String(error.message||error).slice(0,240);
     onError(error);status();
   }finally{
     activeStep=false;
     if(!running)stage='paused';
     if(running)delay(committed?config.speed||3000:150);
   }
 }
 function start(options={}){
   configure(options);
   if(running)return;
   running=true;waiting=false;stamp++;
   if(!document.hidden){void step();}
   else{waiting=true;status();}
 }
 function once(options={}){
   configure(options);
   if(activeStep)return;
   stamp++;
   void step();
 }
 function onVisibility(){
   if(!running)return;
   if(document.hidden){
     waiting=true;if(timer)clearTimeout(timer);timer=null;
     status();
   }else if(!activeStep){
     delay(120);
   }
 }
 document.addEventListener('visibilitychange',onVisibility);
 function invalidateSources(){forceFreshSources=true;status();}
 function feedback(liked){
   ideas=judgeStructuralIdeas(ideas,!!liked);
   objects.objects=rememberObjectVerdict(objects.objects,!!liked,
     lastRecipe?.wordRelation);
   saveObjectRegistry(objects);
   status();
   return heritageEvidence(ideas);
 }
 function dispose(){
   pause();document.removeEventListener('visibilitychange',onVisibility);
   bank.clear();
 }
 return {start,pause,once,reset,configure,state,feedback,dispose,
   invalidateSources,isRunning:()=>running,getLast:()=>last,getRecipe:()=>lastRecipe};
}
