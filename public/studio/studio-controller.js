/* Hexfield Studio 297 — human-guided evolution of visual procedures.
 * Legacy painter / hand-drawn reference library is never loaded on this page.
 * The old engine and historic museum remain reachable at /legacy.html.
 */
import {initImagination} from './imagination.js';
import {initRuleStudio} from './rule-studio.js';
import {initAnatomyControls} from './anatomy-controls.js';
import {initLogoEvolution} from './logo-evolution.js';
import {evolveSeed,assessCanvas,commitCanvas,rankNoveltyCandidates,
  methodSignature,snapshotNoveltyMemory} from './nonredundancy.js';
import {publishSource} from './source-mixer.js';
import {LAWS,MARKS,makeRecipe as makeLawRecipe,mutateRecipe as mutateLawRecipe,
  applyRules as paintUnderLaw,noteRuleVerdict} from './rule-engine.js';
import {SCENES,MOODS,renderLandscape,landscapeDescription,landscapeFeatures} from './landscape.js';
import {LETTER_STYLES,LETTER_TYPES,cleanLogoText,renderLettering,letteringDescription,letteringFeatures} from './lettering.js';
import {FOCI,makeGenome,mutateGenome,sampleGenome,proposeExperiments,methodDescription,programKey,methodFingerprint,geneFeatures,methodDistance,evaluateSurface,randomFrom} from './evolution.js';
import {describeCanvas,descriptorValid,visualDistance,visualBreakdown,visualFeedbackScore,discoveryLabel,blindSummary} from './vision.js';

const $ = id=>document.getElementById(id);
const storage = {
  taste:'hexfield.studio.discipline-taste.v1',
  kept:'hexfield.studio.kept.v1',
  votes:'hexfield.studio.pending-votes.v1',
  shared:'hexfield.studio.collective-bias.v1',
  session:'hexfield.taste.session.v1',
  count:'hexfield.studio.paint-count.v1',
  evolution:'hexfield.studio.procedure-memory.v1',
  visual:'hexfield.studio.visual-evidence.v1',
  blind:'hexfield.studio.blind-tests.v1',
};
const API='https://uiobhojjgtsvyzuzqqiy.supabase.co';
// Supabase's public, publishable key: safe in a browser, never an admin credential.
const PUBLIC_KEY='sb_publishable_G6unWGHkbOkjAaRHhaq_8Q_j-1T4jA8';
const readJson=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback;}catch{return fallback;}};
const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const rand=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const state={
  mode:'landscape',recipe:null,working:false,controller:null,queued:false,
  canvas:$('artwork'),sample:0,revision:0,kept:readJson(storage.kept,[]),
  learned:readJson(storage.taste,{landscape:{},lettering:{}}),
  collective:readJson(storage.shared,{landscape:{},lettering:{}}),
  pending:readJson(storage.votes,[]),
  evolution:readJson(storage.evolution,{landscape:{elites:[],rejected:[],focus:{}},lettering:{elites:[],rejected:[],focus:{}}}),
  experiments:[],experimentRevision:0,currentVisual:null,comparisonReference:null,nonredundancy:null,
  visual:readJson(storage.visual,{landscape:[],lettering:[]}),
  blindHistory:readJson(storage.blind,[]),blindCurrent:null,blindRevision:0,
};
try{state.sample=Number(localStorage.getItem(storage.count))||0;}catch{state.sample=0;}
if(!Array.isArray(state.kept))state.kept=[];
if(!Array.isArray(state.pending))state.pending=[];
for(const k of ['landscape','lettering']){
  if(!state.learned?.[k]||typeof state.learned[k]!=='object')state.learned={...state.learned,[k]:{}};
  if(!state.collective?.[k]||typeof state.collective[k]!=='object')state.collective={...state.collective,[k]:{}};
  if(!state.evolution?.[k] || !Array.isArray(state.evolution[k].elites)) {
    state.evolution={...state.evolution,[k]:{elites:[],rejected:[],focus:{}}};
  }
  if(!Array.isArray(state.evolution[k].rejected))state.evolution[k].rejected=[];
  if(!state.evolution[k].focus)state.evolution[k].focus={};
  if(!Array.isArray(state.evolution[k].comparisons))state.evolution[k].comparisons=[];
  if(!Array.isArray(state.visual?.[k]))state.visual={...state.visual,[k]:[]};
}

function pickWeighted(values,key){
  const pool=state.learned[state.mode]||{},shared=state.collective[state.mode]||{};
  const scores=values.map(value=>Math.max(.22,1+(Number(pool[key+':'+value])||0)*.28+
    Math.max(-2,Math.min(2,(Number(shared[key+':'+value])||0)*.07))));
  const total=scores.reduce((a,b)=>a+b,0);let target=(rand()/4294967296)*total;
  for(let i=0;i<values.length;i++){target-=scores[i];if(target<=0)return values[i];}
  return values.at(-1);
}
function selected(select,possibles,key){const v=$(select).value;return possibles.includes(v)?v:pickWeighted(possibles,key);}
// KEEP preserves a successful *procedure*; REJECT records a failed one.
// Mutations modify operator trees and brush/letter construction grammars.
// The human is asked which counterfactual to inspect: a binary rejection alone
// cannot tell us whether lighting, structure, subject, or the marks were wrong.
const saveEvolution=()=>writeJson(storage.evolution,state.evolution);
const saveVisual=()=>writeJson(storage.visual,state.visual);
const saveBlind=()=>writeJson(storage.blind,state.blindHistory);
const methodMemory=mode=>state.evolution[mode];
function genomeValue(mode,g){
  const model=state.learned[mode]||{},shared=state.collective[mode]||{};
  const components=geneFeatures(g);
  let value=0;
  for(const [key,feature] of Object.entries(components)){
    value+=Math.max(-10,Math.min(10,Number(model[key+':'+feature])||0))*.36;
    value+=Math.max(-18,Math.min(18,Number(shared[key+':'+feature])||0))*.07;
  }
  const rejected=methodMemory(mode).rejected||[];
  const signature=methodFingerprint(g);
  if(rejected.includes(signature))value-=10;
  // A rare method has room to grow, even before anyone likes its first image.
  value+=Math.min(2,rejected.reduce((best,old)=>best+Number(old!==signature),0)*.024);
  return value;
}
function chooseLearnedFocus(mode,r){
  const focus=methodMemory(mode).focus||{};
  if(r()<.35)return FOCI[Math.floor(r()*FOCI.length)];
  const weights=FOCI.map(x=>Math.max(.18,1+(Number(focus[x])||0)*.22));
  let total=weights.reduce((a,b)=>a+b,0),target=r()*total;
  for(let i=0;i<FOCI.length;i++){target-=weights[i];if(target<=0)return FOCI[i];}
  return 'structure';
}
function selectGenome(mode,seed){
  const memory=methodMemory(mode),r=randomFrom(seed),seen=new Set(memory.rejected.slice(-30));
  const possibilities=[];
  for(let i=0;i<9;i++){
    const candidate=i===0||r()<.3?makeGenome(mode,(seed+i*137)>>>0)
      :memory.elites.length&&i%2===0
      ?mutateGenome(memory.elites[(seed+i)%memory.elites.length].genome,
        chooseLearnedFocus(mode,r),(seed+i*727)>>>0)
      :sampleGenome(memory.elites,mode,(seed+i*727)>>>0);
    if(evaluateSurface(candidate).length)continue;
    const signature=methodFingerprint(candidate);
    const score=genomeValue(mode,candidate)+(seen.has(signature)?-11:0);
    possibilities.push({genome:candidate,score});
  }
  // One in four inventions is exploration independent of audience preference.
  if(r()<.25)return makeGenome(mode,seed^0x61813);
  possibilities.sort((a,b)=>b.score-a.score);
  return possibilities[0]?.genome || makeGenome(mode,seed);
}
function makeRecipe({parent=null,focus=null,genome=null,subjectChange=false,
  evolutionSeed=null}={}){
  const seed=parent?.seed ?? rand(),mode=state.mode;
  let method=(focus==='constraint'&&parent?.genome)?structuredClone(parent.genome):
    genome || (parent?.genome
    ? mutateGenome(parent.genome,focus||FOCI[Math.floor(rand()%FOCI.length)],
       Number.isFinite(evolutionSeed)?(evolutionSeed>>>0):evolveSeed(seed,parent.genome.generation+1,0,'studio-genome'),
       methodMemory(mode).elites.find(e=>programKey(e.genome)!==programKey(parent.genome))?.genome || null)
    :selectGenome(mode,seed));
  if(evaluateSurface(method).length)method=makeGenome(mode,seed);
  const base={version:2,mode,seed,genome:method,experiment:focus||'invent',
    parentMethod:parent?.genome?methodFingerprint(parent.genome):null};
  if(mode==='landscape'){
    const scene=parent?.mode===mode?parent.scene:selected('landscapeScene',SCENES,'scene');
    const mood=parent?.mode===mode?parent.mood:selected('landscapeMood',MOODS,'mood');
    const enabled=$('landscapeConstraintOn')?.checked??false;
    const wantedLaw=$('landscapeConstraintLaw')?.value||'surprise';
    const wantedMark=$('landscapeConstraintMark')?.value||'surprise';
    let constraint=null;
    if(enabled){
      if(parent?.constraint){
        constraint=focus==='constraint'?
          mutateLawRecipe(parent.constraint,'law'):structuredClone(parent.constraint);
      }else{
        constraint=makeLawRecipe({subject:'coast',primary:wantedLaw,
          mark:wantedMark,seed,secondary:'none'});
      }
      if(wantedLaw!=='surprise')constraint.primary=wantedLaw;
      if(wantedMark!=='surprise')constraint.mark=wantedMark;
      constraint.enabled=true;
    }
    return {...base,scene:subjectChange?SCENES.filter(v=>v!==scene)[rand()%(SCENES.length-1)]:scene,
      mood,constraint};
  }
  const anatomy=logoControls?.programForGenome(method.anatomy,!!parent) || method.anatomy;
  if(anatomy)method={...method,anatomy};
  return {...base,genome:method,
    anatomy,
    showAnatomyGuides:logoControls?.guides()||false,
    text:parent?.mode===mode?cleanLogoText(parent.text):cleanLogoText($('logoText').value),
    style:parent?.mode===mode?parent.style:selected('logoStyle',LETTER_STYLES,'style'),
    type:parent?.mode===mode?parent.type:LETTER_TYPES.includes($('logoType').value)?$('logoType').value:'wordmark'};
}
function studioMethod(recipe){
 return methodSignature({
   mode:recipe.mode,
   genome:programKey(recipe.genome),
   primary:recipe.constraint?.primary||recipe.anatomy?.rules?.[0]?.target||'',
   secondary:recipe.constraint?.secondary||recipe.anatomy?.rules?.[0]?.operation||'',
   mark:recipe.constraint?.mark||recipe.genome?.letterStroke||recipe.genome?.brush||'',
   scene:recipe.scene||'',
   text:recipe.text||'',style:recipe.style||'',type:recipe.type||''
 });
}
function recordProcedure(recipe,liked){
  const g=recipe.genome;
  if(!g||evaluateSurface(g).length)return;
  const memory=methodMemory(recipe.mode),key=methodFingerprint(g);
  const existing=memory.elites.find(e=>methodFingerprint(e.genome)===key);
  if(liked){
    if(existing)existing.score=Math.min(20,(existing.score||0)+1);
    else memory.elites.unshift({genome:structuredClone(g),score:1,learnedAt:Date.now()});
    memory.rejected=memory.rejected.filter(k=>k!==key);
  }else{
    memory.rejected.unshift(key);memory.rejected=memory.rejected.slice(0,50);
    if(existing)existing.score=Math.max(0,(existing.score||1)-1);
  }
  if(recipe.experiment&&recipe.experiment!=='invent'){
    memory.focus[recipe.experiment]=Math.max(-20,Math.min(20,(Number(memory.focus[recipe.experiment])||0)+(liked?1:-1)));
  }
  if(recipe.comparison && ['structure','surface','light','subject'].includes(recipe.comparison.focus)) {
    const cmp=recipe.comparison;
    const comparisons=memory.comparisons||[];
    comparisons.push({parent:cmp.parent,child:key,focus:cmp.focus,liked,
      distance:Number(cmp.distance)||0,at:Date.now()});
    memory.comparisons=comparisons.slice(-100);
  }
  memory.elites=memory.elites.filter(e=>e.score>0).slice(0,28);
  saveEvolution();
}
function clearExperiments(){
  state.experimentRevision++;state.experiments=[];
  const root=$('experiments');if(root){root.hidden=true;$('experimentCards').replaceChildren();}
  if($('rejectedReference'))$('rejectedReference').hidden=true;
}
const pauseFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
async function renderPreview(recipe,quality=.17){
  const canvas=document.createElement('canvas');canvas.width=390;canvas.height=241;
  if(recipe.mode==='landscape'){
    await renderLandscape(canvas,recipe,{animate:false,quality});
    if(recipe.constraint?.enabled)paintUnderLaw(canvas,canvas,recipe.constraint);
  }else renderLettering(canvas,recipe);
  return {canvas,visual:describeCanvas(canvas,recipe.mode)};
}
function voteEvidence(recipe,liked,visual,clientId){
  if(!descriptorValid(visual))return;
  const history=state.visual[recipe.mode];
  history.push({id:clientId,visual,liked,method:methodFingerprint(recipe.genome),focus:recipe.experiment||null,
    comparison:recipe.comparison?.distance??null,at:Date.now()});
  state.visual[recipe.mode]=history.slice(-100);
  saveVisual();
}
async function showExperiments(rejected){
  if(!rejected.genome)return;
  clearExperiments();const token=state.experimentRevision;
  // Compare against an equivalent low-resolution render, not the full-detail
  // original versus deliberately cheap thumbnails; that would inflate change.
  const reference=await renderPreview(rejected,.17);
  if(token!==state.experimentRevision)return;
  const referenceVisual=reference.visual;
  const referenceImg=$('rejectedSnapshot');
  if(referenceImg){referenceImg.src=thumbnail();$('rejectedReference').hidden=false;}
  const root=$('experiments'),cards=$('experimentCards');root.hidden=false;
  $('experimentHeading').textContent='THAT FAILED. WHICH CHANGE IS WORTH TESTING?';
  const methods=methodMemory(rejected.mode).elites.map(item=>item.genome);
  const proposals=proposeExperiments(rejected.genome,rand(),methods);
  if(rejected.mode==='landscape' && $('landscapeScene').value==='surprise')
    proposals.push({focus:'subject',genome:mutateGenome(rejected.genome,'structure',rand())});
  let found=0;
  for(const {focus,genome} of proposals){
    if(token!==state.experimentRevision)return;
    let best=null;
    // Retries are bounded. We measure actual previews and prefer a visually
    // different counterfactual, instead of pretending changed code means new art.
    for(let attempt=0;attempt<3;attempt++){
      const alternative=attempt===0?genome:mutateGenome(rejected.genome,
        focus==='subject'?'structure':focus,rand(),methods.length?methods[rand()%methods.length]:null);
      const recipe=makeRecipe({parent:rejected,focus,genome:alternative,subjectChange:focus==='subject'});
      let rendered;
      try{rendered=await renderPreview(recipe,.17);}catch(err){console.warn('Experiment paint failure:',err);continue;}
      if(token!==state.experimentRevision)return;
      const difference=visualDistance(referenceVisual,rendered.visual);
      const relative=state.experiments.some(x=>visualDistance(x.visual,rendered.visual)<.043);
      const score=difference-(relative?.12:0)+Math.min(.015,visualFeedbackScore(rendered.visual,state.visual[rejected.mode])*.011);
      if(!best||score>best.score)best={focus,recipe,score,visual:rendered.visual,canvas:rendered.canvas,difference};
      if(difference>=.13&&!relative)break;
      await pauseFrame();
    }
    if(!best)continue;
    // Insist that the result looks different, not merely that its genome differs.
    const threshold=rejected.mode==='lettering'?.026:.045;
    if(best.difference<threshold || state.experiments.some(x=>visualDistance(x.visual,best.visual)<threshold*.95))continue;
    best.recipe.comparison={parent:methodFingerprint(rejected.genome),focus, distance:best.difference};
    state.experiments.push(best);found++;
    const button=document.createElement('button');button.type='button';button.className='experiment-card';
    const img=document.createElement('img');img.alt='';
    try{img.src=best.canvas.toDataURL('image/webp',.62);}catch{}
    const title=document.createElement('strong');
    const labels=rejected.mode==='lettering'
      ? {structure:'REBUILD THE LETTERS',surface:'CHANGE THE STROKES',light:'CHANGE THE COMPOSITION'}
      : {structure:'REBUILD THE TERRAIN',surface:'CHANGE THE BRUSHWORK',light:'CHANGE THE ATMOSPHERE',subject:'PAINT SOMEWHERE ELSE'};
    title.textContent=labels[focus]||'A DIFFERENT METHOD';
    const detail=document.createElement('span');detail.textContent=methodDescription(best.recipe.genome);
    const measured=document.createElement('small');measured.className='image-distance';
    measured.textContent=`IMAGE DISTANCE ${best.difference.toFixed(3)} · ${discoveryLabel(best.difference,rejected.mode)}`;
    button.append(img,title,detail,measured);
    button.setAttribute('aria-label',`${title.textContent}: ${measured.textContent}`);
    button.addEventListener('click',()=>{
      if(token!==state.experimentRevision)return;
      const chosen=structuredClone(best.recipe);
      state.comparisonReference=state.currentVisual;
      clearExperiments();
      setStatus(`Testing ${focus} with the same seed and subject. Judge the actual result.`);
      void paintRecipe(chosen);
    });
    cards.append(button);
    await pauseFrame();
  }
  if(token!==state.experimentRevision)return;
  if(!found){
    const msg=document.createElement('p');msg.className='empty-experiments';
    msg.textContent='These method changes still looked too similar. No discovery counted. Try INVENT A NEW METHOD.';
    cards.append(msg);
  }
  if(matchMedia('(max-width:730px)').matches)
    root.scrollIntoView({behavior:'smooth',block:'start'});
}
function disableVoting(value){$('keep').disabled=value;$('reject').disabled=value;}
function setStatus(message){$('feedbackStatus').textContent=message;}
function setMode(mode,{paint=true}={}){
  if(!['rules','imagination','landscape','lettering'].includes(mode))return;
  if(state.mode==='rules'&&mode!=='rules')ruleStudio?.hide();
  if(state.mode==='lettering'&&mode!=='lettering')logoLoop?.pause('switched modes');
  clearExperiments();clearBlind();state.controller?.abort();state.mode=mode;
  const imagining=mode==='imagination',ruling=mode==='rules';
  $('ruleControls').hidden=!ruling;
  $('ruleWorkspace').hidden=!ruling;
  $('imaginationControls').hidden=!imagining;
  $('imaginationWorkspace').hidden=!imagining;
  $('proceduralWorkspace').hidden=imagining||ruling;
  $('proceduralActions').hidden=imagining||ruling;
  $('shelf').hidden=imagining||ruling;
  if(imagining)imagination.show();
  if(ruling)ruleStudio?.show();
  $('landscapeControls').hidden=mode!=='landscape';
  $('letteringControls').hidden=mode!=='lettering';
  for(const el of document.querySelectorAll('[data-mode]')) {
    const active=el.dataset.mode===mode;
    el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
  }
  $('generate').firstChild.textContent=mode==='landscape'?'PAINT SOMETHING ':'DESIGN A LOGO ';
  $('canvasWrap').classList.toggle('logo-surface',mode==='lettering');
  if(imagining||ruling)return;
  updateBlindSummary();
  if(paint)void paintFresh();
}
async function paintRecipe(recipe,{newStudy=true}={}) {
  state.controller?.abort();const abort=new AbortController();state.controller=abort;
  state.mode=recipe.mode;
  state.recipe=recipe;
  state.currentVisual=null;
  state.working=true;state.revision++;
  const version=state.revision;
  disableVoting(true);
  $('statusOrb').classList.add('busy');$('paintingOverlay').hidden=false;
  $('paintingOverlay').textContent=recipe.mode==='landscape'?'BUILDING A LANDSCAPE':'SETTING THE LETTERS';
  $('workHeading').textContent=recipe.mode==='landscape'?'CURRENT STUDY / LANDSCAPE':'CURRENT STUDY / LETTERFORM';
  $('renderStatus').textContent='WORK IN PROGRESS';
  $('workCaption').textContent=recipe.mode==='landscape'?landscapeDescription(recipe):letteringDescription(recipe);
  $('methodLine').textContent=recipe.genome?`METHOD / GENERATION ${recipe.genome.generation||0} · ${String(recipe.genome.origin||'invented').toUpperCase()}`:'ARCHIVE STUDY';
  if(newStudy){state.sample++;try{localStorage.setItem(storage.count,String(state.sample));}catch{}}
  $('workNumber').textContent=`STUDY ${String(state.sample).padStart(3,'0')}`;
  try {
    let glyphResult=null;
    if(recipe.mode==='landscape') {
      const ok=await renderLandscape(state.canvas,recipe,{
        signal:abort.signal,
        onProgress:(step,progress)=>{
          if(abort.signal.aborted)return;
          $('paintingOverlay').textContent=step.toUpperCase();
          $('renderStatus').textContent=`PAINTING / ${Math.round(progress*100)}%`;
        },
      });
      if(!ok)return;
      if(recipe.constraint?.enabled){
        $('paintingOverlay').textContent='ENFORCING '+recipe.constraint.primary.toUpperCase();
        paintUnderLaw(state.canvas,state.canvas,recipe.constraint);
      }
    }else{
      glyphResult=renderLettering(state.canvas,recipe);
    }
    if(abort.signal.aborted||version!==state.revision)return;
    if(recipe.mode==='lettering'){
      logoControls?.updateAfterRender(glyphResult,recipe);
      publishSource(state.canvas,'logo',recipe);
    }
    // All renderers observe the SAME global visual nonredundancy memory:
    // logos and terrain cannot silently create the same pixels forever.
    const parentFp=state.nonredundancy?.fingerprint||null;
    const observation=assessCanvas(state.canvas,{
      mode:recipe.mode,method:studioMethod(recipe),parent:parentFp
    });
    state.nonredundancy={
      ...observation,
      ...commitCanvas(state.canvas,{
        mode:recipe.mode,method:studioMethod(recipe),seed:recipe.seed,
        parentId:recipe.parentMethod||null,evaluation:observation
      })
    };
    state.currentVisual=describeCanvas(state.canvas,recipe.mode);
    if(recipe.comparison&&descriptorValid(state.comparisonReference)){
      const delta=visualDistance(state.comparisonReference,state.currentVisual);
      recipe.comparison.distance=delta;
      $('visualMetric').textContent=`MEASURED CHANGE ${delta.toFixed(3)} · ${discoveryLabel(delta,recipe.mode)}`;
    }else{
      const saved=state.visual[recipe.mode];
      const last=saved.length?saved.at(-1).visual:null;
      const dist=visualDistance(last,state.currentVisual);
      $('visualMetric').textContent=dist===null?'IMAGE MEASUREMENT READY':
        `DISTANCE FROM LAST JUDGED IMAGE ${dist.toFixed(3)} · ${discoveryLabel(dist,recipe.mode)}`;
    }
    if(state.nonredundancy){
      const W=state.nonredundancy;
      $('visualMetric').textContent+=' · GLOBAL W NOVELTY '+
        (W.globalNovelty*100).toFixed(1)+'% · STRUCTURAL COMPLEXITY '+
        (W.complexity*100).toFixed(1)+'%'+
        (W.redundant?' · REPEATED METHOD / IMAGE':'')+
        ' · DERIVED SEED '+(recipe.seed>>>0);
    }
    $('paintingOverlay').hidden=true;
    $('statusOrb').classList.remove('busy');
    $('renderStatus').textContent=state.nonredundancy?.redundant?
      'REPEATED VISUAL / TEST ANOTHER METHOD':'READY FOR YOUR VERDICT';
    disableVoting(false);
    setStatus('KEEP or REJECT this image. Rejection tests visibly different construction methods, not shuffled positions.');
  }catch(error){
    if(!abort.signal.aborted){console.error('Hexfield painter error:',error);$('paintingOverlay').textContent='COULD NOT FINISH THE STUDY';setStatus('The artist ran into a rendering error. Try another version.');}
  }finally{if(version===state.revision)state.working=false;}
}
// A new painting competes with other *rendered* options, not just with genetic
// instructions. This protects against the user's core failure mode: repeatedly
// showing the same visual arrangement with a different random seed.
async function paintFresh(){
  clearExperiments();clearBlind();
  const token=++state.experimentRevision,
    parent=state.recipe?.mode===state.mode?state.recipe:null,
    // Inherit current seed and derive deterministic branches from it.
    seed=parent?.seed??rand(),
    options=[],seen=state.visual[state.mode];
  const limit=matchMedia('(max-width:730px)').matches?3:5;
  for(let i=0;i<limit;i++){
    const branch=evolveSeed(seed,(parent?.genome?.generation||0)+state.sample+1,
      i,'studio-fresh-'+state.mode);
    const recipe=makeRecipe({
      parent,genome:selectGenome(state.mode,branch),
      evolutionSeed:branch
    });
    try{
      const preview=await renderPreview(recipe,.12);
      if(token!==state.experimentRevision)return;
      const prior=seen.filter(x=>descriptorValid(x.visual)).slice(-45);
      const visualNovelty=prior.length?Math.min(...prior.map(x=>
        visualDistance(preview.visual,x.visual))):1;
      const novelty=assessCanvas(preview.canvas,{
        mode:recipe.mode,method:studioMethod(recipe),
        parent:state.nonredundancy?.fingerprint||null
      });
      const score=genomeValue(state.mode,recipe.genome)*.12+
        visualFeedbackScore(preview.visual,seen)+visualNovelty*.35+
        novelty.score*2.6-(novelty.redundant?2:0);
      options.push({recipe,score,novelty,visualNovelty});
    }catch(err){console.warn('New procedure preview failed:',err);}
    await pauseFrame();
  }
  if(token!==state.experimentRevision)return;
  options.sort((a,b)=>b.score-a.score);
  const chosen=options[0]?.recipe||makeRecipe({parent});
  state.comparisonReference=null;
  return paintRecipe(chosen);
}
async function varyMethod(){
  const parent=state.recipe?.mode===state.mode?structuredClone(state.recipe):null;
  clearExperiments();clearBlind();
  state.comparisonReference=state.currentVisual;
  if(!parent)return paintFresh();
  const candidates=[];
  for(let i=0;i<3;i++){
    const branch=evolveSeed(parent.seed,
      (parent.genome?.generation||0)+1,i,'studio-mutant-'+parent.mode);
    const recipe=makeRecipe({parent,focus:FOCI[i%FOCI.length],
      evolutionSeed:branch});
    try{
      const preview=await renderPreview(recipe,.14);
      const novelty=assessCanvas(preview.canvas,{
        mode:recipe.mode,method:studioMethod(recipe),
        parent:state.nonredundancy?.fingerprint||null
      });
      candidates.push({recipe,novelty});
    }catch(error){console.warn('Novelty counterfactual failed:',error);}
  }
  candidates.sort((a,b)=>b.novelty.score-a.novelty.score);
  return paintRecipe(candidates[0]?.recipe||
    makeRecipe({parent,focus:'structure',evolutionSeed:evolveSeed(parent.seed,1)}));
}
function updatePreference(recipe,liked){
  const features=recipe.mode==='landscape'?landscapeFeatures(recipe):letteringFeatures(recipe);
  const model=state.learned[recipe.mode];
  for(const [k,v] of Object.entries(features)){
    if(k==='discipline')continue;
    const key=k+':'+v;
    model[key]=Math.max(-12,Math.min(12,(Number(model[key])||0)+(liked?1:-1)));
  }
  writeJson(storage.taste,state.learned);
}
function thumbnail(){
  try{const tiny=document.createElement('canvas');tiny.width=256;tiny.height=158;
    const c=tiny.getContext('2d');c?.drawImage(state.canvas,0,0,tiny.width,tiny.height);
    return tiny.toDataURL('image/webp',.55);
  }catch{return ''}
}
function rememberKeep(recipe){
  const description=recipe.mode==='landscape'?landscapeDescription(recipe):letteringDescription(recipe);
  const entry={id:crypto.randomUUID(),recipe,description,image:thumbnail(),created_at:new Date().toISOString()};
  state.kept.unshift(entry);state.kept=state.kept.slice(0,12);
  writeJson(storage.kept,state.kept);
  buildGallery();
}
function vote(liked){
  if(state.mode==='lettering')logoLoop?.pause('waiting for human verdict');
  if(state.working||!state.recipe||$('keep').disabled)return;
  const recipe=structuredClone(state.recipe);
  disableVoting(true);
  const client_id=crypto.randomUUID();
  updatePreference(recipe,liked);
  voteEvidence(recipe,liked,state.currentVisual,client_id);
  recordProcedure(recipe,liked);
  if(recipe.mode==='landscape'&&recipe.constraint?.enabled)
    noteRuleVerdict(recipe.constraint,liked);
  if(liked)rememberKeep(recipe);
  const features=recipe.mode==='landscape'?landscapeFeatures(recipe):letteringFeatures(recipe);
  state.pending.push({client_id,mode:recipe.mode,liked,recipe,features,
    visual_signature:descriptorValid(state.currentVisual)?state.currentVisual:null});
  if(state.pending.length>120)state.pending=state.pending.slice(-120);
  writeJson(storage.votes,state.pending);
  void syncVotes();
  if(liked){
    setStatus('KEPT. The exact painting method and its visual evidence were retained for future descendants.');
    clearExperiments();
  }else{
    setStatus('REJECTED. Rendering controlled experiments, then measuring how different they really look.');
    void showExperiments(recipe);
  }
}
async function download(){
  if(state.working||!state.recipe){setStatus('Finish the painting first.');return;}
  const recipe=structuredClone(state.recipe),btn=$('export');btn.disabled=true;
  try{
    const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1480;
    if(recipe.mode==='landscape'){
      await renderLandscape(canvas,recipe,{animate:false});
      if(recipe.constraint?.enabled)paintUnderLaw(canvas,canvas,recipe.constraint);
    }else renderLettering(canvas,recipe);
    let final=canvas;
    if(recipe.mode==='lettering' && recipe.type!=='wordmark'){
      const square=document.createElement('canvas');square.width=1480;square.height=1480;
      square.getContext('2d').drawImage(canvas,460,0,1480,1480,0,0,1480,1480);
      final=square;
    }
    const blob=await new Promise(resolve=>final.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Could not encode artwork');
    const obj=URL.createObjectURL(blob),link=document.createElement('a');
    const label=recipe.mode==='landscape'?recipe.scene:cleanLogoText(recipe.text).replace(/[^a-z0-9]+/gi,'-').toLowerCase();
    link.href=obj;link.download=`hexfield-${recipe.mode}-${label}-${recipe.seed}.png`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(obj),60000);
    setStatus(`Exported ${final.width} × ${final.height} PNG.`);
  }catch(error){console.error('Export failed',error);setStatus('Export failed on this device. Try again.');}
  finally{btn.disabled=false;}
}
function buildGallery(){
  const root=$('savedGallery');root.replaceChildren();$('keepCount').textContent=String(state.kept.length).padStart(2,'0');
  if(!state.kept.length){const p=document.createElement('p');p.className='empty-gallery';p.textContent="You haven't kept anything yet. When you see something good, tell the artist.";root.append(p);return;}
  for(const item of state.kept){
    if(!item.recipe||!['landscape','lettering'].includes(item.recipe.mode))continue;
    const button=document.createElement('button');button.className='saved-item';button.type='button';
    const img=document.createElement('img');img.alt='';img.loading='lazy';if(item.image?.startsWith('data:image/'))img.src=item.image;
    const label=document.createElement('span');label.textContent=item.description||'Kept study';
    button.append(img,label);
    button.addEventListener('click',()=>{
      setMode(item.recipe.mode,{paint:false});
      if(item.recipe.mode==='lettering'){
        $('logoText').value=cleanLogoText(item.recipe.text);$('logoStyle').value=item.recipe.style;$('logoType').value=item.recipe.type;
      }else{$('landscapeScene').value=item.recipe.scene;$('landscapeMood').value=item.recipe.mood;}
      state.comparisonReference=null;void paintRecipe(item.recipe,{newStudy:false});
      window.scrollTo({top:0,behavior:'smooth'});
    });root.append(button);
  }
}
// Reuse the legacy anonymous Supabase Auth identity when possible. All studio
// history is owner-only via RLS; public keys never authorize private access.
let sessionPromise=null;
async function withTimeout(url,options={}){
  const controller=new AbortController(),id=setTimeout(()=>controller.abort(),6500);
  try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(id);}
}
async function authPost(path,payload){
  const res=await withTimeout(API+path,{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!res.ok)throw Error('Authentication HTTP '+res.status);
  return res.json();
}
async function acquireSession(){
  if(sessionPromise)return sessionPromise;
  sessionPromise=(async()=>{
    const saved=readJson(storage.session,null);
    if(saved?.access_token&&saved?.user?.id&&saved?.expires_at>Date.now()/1000+100)return saved;
    if(saved?.refresh_token){try{
      const updated=await authPost('/auth/v1/token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
      const session=updated.session||updated;
      if(session?.access_token&&session?.user?.id){writeJson(storage.session,session);return session;}
    }catch{/* A fresh anonymous identity is valid if an expired token cannot refresh. */}}
    const created=await authPost('/auth/v1/signup',{data:{source:'hexfield-studio'}});
    const session=created.session||created;
    if(!session?.access_token||!session?.user?.id)throw Error('Anonymous session unavailable');
    writeJson(storage.session,session);return session;
  })();
  try{return await sessionPromise;}finally{sessionPromise=null;}
}
let sharedLoading=false;
async function loadSharedTaste(){
  if(sharedLoading)return;
  sharedLoading=true;
  try{
    const session=await acquireSession();
    for(const discipline of ['landscape','lettering']) {
      const res=await withTimeout(API+'/rest/v1/rpc/hexfield_studio_shared_taste',{
        method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+session.access_token,
          'Content-Type':'application/json'},body:JSON.stringify({p_mode:discipline}),
      });
      if(!res.ok)throw Error('shared taste HTTP '+res.status);
      const rows=await res.json();
      const totals={};
      for(const row of rows){
        if(!['scene','mood','style','type','terrain','brush','sky','layout','growth','construction','stroke','frame','joint'].includes(row.feature))continue;
        totals[row.feature+':'+row.value]=Number(row.keeps)-Number(row.rejects);
      }
      state.collective[discipline]=totals;
    }
    writeJson(storage.shared,state.collective);
    $('syncNote').textContent='LEARNING: PROCEDURE VOTES + COLLECTIVE MEMORY';
  } catch(error){console.info('Collective taste offline; using saved preferences',error);}
  finally{sharedLoading=false;}
}
let syncing=false;
async function syncVotes(){
  if(syncing||!state.pending.length)return;
  syncing=true;
  try{
    const session=await acquireSession();
    while(state.pending.length){
      const next=state.pending[0];
      const row={...next,visitor_id:session.user.id};
      const res=await withTimeout(API+'/rest/v1/hexfield_studio_votes?on_conflict=client_id',{
        method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+session.access_token,
          'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(row),
      });
      if(!res.ok){console.warn('Studio vote not synced',res.status);throw Error('vote sync HTTP '+res.status);}
      state.pending.shift();writeJson(storage.votes,state.pending);
    }
    $('syncNote').textContent='LEARNING: SAVED TO STUDIO MEMORY';
    void loadSharedTaste();
  }catch(error){console.warn('Votes kept locally; cloud sync pending',error);$('syncNote').textContent='LEARNING: STORED ON THIS DEVICE';}
  finally{syncing=false;}
}
let remoteProceduresLoaded=false;
async function restoreRemoteProcedures(){
  if(remoteProceduresLoaded)return;
  try{
    const session=await acquireSession();
    const res=await withTimeout(API+'/rest/v1/hexfield_studio_votes?select=client_id,mode,liked,recipe,visual_signature,created_at&order=created_at.desc&limit=80',{
      headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+session.access_token},
    });
    if(!res.ok)return;
    const rows=await res.json();
    for(const row of rows.reverse()){
      // Own private rendered fingerprints survive moving to another device.
      if(['landscape','lettering'].includes(row.mode)&&descriptorValid(row.visual_signature)){
        const local=state.visual[row.mode];
        if(!local.some(v=>v.id===row.client_id))local.push({id:row.client_id,
          liked:row.liked,visual:row.visual_signature,at:new Date(row.created_at).getTime()||Date.now(),
          method:methodFingerprint(row.recipe?.genome)});
        state.visual[row.mode]=local.slice(-100);
      }
      const g=row.recipe?.genome;
      if(!row.liked||!g||g.kind!==row.mode||evaluateSurface(g).length)continue;
      const memory=methodMemory(row.mode);
      const key=methodFingerprint(g),existing=memory.elites.find(x=>methodFingerprint(x.genome)===key);
      if(existing)existing.score=Math.max(existing.score||1,2);
      else memory.elites.unshift({genome:g,score:2,learnedAt:new Date(row.created_at).getTime()||Date.now()});
      memory.elites=memory.elites.slice(0,28);
    }
    saveEvolution();saveVisual();remoteProceduresLoaded=true;
  }catch(err){console.info('Studio method archive offline; local evolution continues.',err);}
}
// The comparison is blinded: left/right are randomized, the fresh baseline
// and learned descendants receive the exact same subject, lighting and seed.
// A preference is independent evidence, not an automated claim of improvement.
function clearBlind(){
  state.blindRevision++;state.blindCurrent=null;
  if($('blindPanel')){$('blindPanel').hidden=true;$('blindCards').replaceChildren();}
}
function updateBlindSummary(){
  const s=blindSummary(state.blindHistory.filter(t=>t.mode===state.mode));
  $('blindCount').textContent=s.trials?`${s.wins}/${s.trials} chose the trained method`:'No blind comparisons yet';
  $('blindVerdict').textContent=s.trials<12?'At least 12 comparisons are needed to begin judging whether feedback helped.':
    s.lower>.5?'The learned methods beat fresh methods in these blind trials (95% interval entirely above 50%).':
    s.upper<.5?'Fresh methods beat learned methods in these blind trials (95% interval entirely below 50%).':
    'Inconclusive: the 95% preference interval still includes 50%. Keep testing.';
}
async function beginBlindTest(){
  clearExperiments();clearBlind();
  const mode=state.mode,elite=methodMemory(mode).elites.filter(e=>e.score>0);
  if(!elite.length){setStatus('KEEP at least one painting before testing whether learned methods beat untrained ones.');return;}
  const token=state.blindRevision,seed=rand();
  // Both canvases get the SAME recipe apart from the painting procedure.
  const control=makeRecipe({genome:makeGenome(mode,seed+911)});
  control.seed=seed;
  const ranked=[...elite].sort((a,b)=>b.score-a.score);
  const eliteGen=ranked[seed%Math.min(ranked.length,6)].genome;
  const trained={...control,genome:mutateGenome(eliteGen,FOCI[seed%FOCI.length],seed+733),experiment:'blind-trained'};
  const conditions=[{role:'trained',recipe:trained},{role:'baseline',recipe:control}];
  if(seed%2)conditions.reverse();
  const rendered=[];
  try{
    for(const condition of conditions){
      const preview=await renderPreview(condition.recipe,.22);
      if(token!==state.blindRevision||mode!==state.mode)return;
      rendered.push({...condition,...preview});await pauseFrame();
    }
    state.blindCurrent={seed,mode,conditions:rendered.map(x=>({role:x.role,recipe:x.recipe,visual:x.visual}))};
    $('blindPanel').hidden=false;
    $('blindAnswer').textContent='Which painting would you keep? The labels are hidden until you vote.';
    $('blindCards').replaceChildren();
    for(const [index,candidate] of rendered.entries()){
      const btn=document.createElement('button');btn.type='button';btn.className='blind-card';
      const image=document.createElement('img');image.alt=`Painting ${index===0?'A':'B'}`;
      image.src=candidate.canvas.toDataURL('image/webp',.75);
      const label=document.createElement('strong');label.textContent=`PREFER ${index===0?'A':'B'}`;
      btn.append(image,label);btn.addEventListener('click',()=>chooseBlind(index));
      $('blindCards').append(btn);
    }
    $('blindPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(err){console.error('Blind comparison failed:',err);setStatus('Could not render comparison on this device.');}
}
function chooseBlind(index){
  const current=state.blindCurrent;if(!current||!current.conditions[index])return;
  const winner=current.conditions[index],loser=current.conditions[1-index];
  const preferred=winner.role==='trained',distance=visualDistance(winner.visual,loser.visual);
  state.blindHistory.push({id:crypto.randomUUID(),mode:current.mode,
    trainedPreferred:preferred,distance,at:Date.now()});
  state.blindHistory=state.blindHistory.slice(-120);saveBlind();
  state.blindCurrent=null;
  for(const btn of $('blindCards').children)btn.disabled=true;
  $('blindAnswer').textContent=`You preferred ${winner.role==='trained'?'the learned descendant':'the untrained fresh method'}.
    Image distance: ${distance?.toFixed(3)??'unmeasured'}. This choice is a test result, not automatically counted as a general KEEP/REJECT vote.`;
  updateBlindSummary();
}
let imagination,ruleStudio,logoControls,logoLoop;
async function paintNextLogoGeneration(parent,focus){
  const last=state.currentVisual,options=[];
  // Use the CURRENT font genome and CURRENT seed to explore competing,
  // heritable per-part edits before accepting one. Repeating an operation
  // on a new seed is not enough: only the actual glyph geometry can
  // demonstrate that it made a different painting.
  for(let i=0;i<3;i++){
    const branch=evolveSeed(parent.seed,
      (parent.genome?.generation||0)+1,i,'letter-anatomy-'+focus);
    const recipe=makeRecipe({parent,focus,evolutionSeed:branch});
    recipe.experiment='continuous-'+focus;
    try{
      const preview=await renderPreview(recipe,.14);
      const novelty=assessCanvas(preview.canvas,{
        mode:'lettering',method:studioMethod(recipe),
        parent:state.nonredundancy?.fingerprint||null
      });
      options.push({recipe,novelty});
    }catch(error){console.warn('Logo anatomy candidate omitted:',error);}
  }
  options.sort((a,b)=>{
    if(a.novelty.redundant!==b.novelty.redundant)
      return a.novelty.redundant?1:-1;
    return b.novelty.score-a.novelty.score;
  });
  const chosen=options[0]?.recipe||makeRecipe({parent,focus,
    evolutionSeed:evolveSeed(parent.seed,parent.genome.generation+1,7,'letter-fallback')});
  await paintRecipe(chosen);
  const diff=visualDistance(last,state.currentVisual);
  chosen._measuredDistance=Number.isFinite(diff)?diff:null;
  chosen._globalNovelty=state.nonredundancy?.novelty??null;
  chosen._testedCandidates=options.length;
  return chosen;
}
function applyEditedLogo(program,why='edit'){
 logoLoop?.pause('editing selected letter part');
 if(state.mode!=='lettering')return;
 const old=state.recipe?.mode==='lettering'?state.recipe:null;
 const base=structuredClone(old?.genome||makeGenome('lettering',rand()));
 base.anatomy=program;
 base.generation=(base.generation||0)+1;
 base.origin='anatomy-'+why;
 const recipe={
    version:2,mode:'lettering',seed:old?.seed??rand(),genome:base,
    text:cleanLogoText($('logoText').value),
    style:LETTER_STYLES.includes($('logoStyle').value)?$('logoStyle').value:'anatomy',
    type:LETTER_TYPES.includes($('logoType').value)?$('logoType').value:'wordmark',
    anatomy:program,showAnatomyGuides:logoControls?.guides()||false,
    experiment:'part-'+why,
    parentMethod:old?.genome?methodFingerprint(old.genome):null
 };
 state.comparisonReference=state.currentVisual;
 clearExperiments();clearBlind();
 void paintRecipe(recipe,{newStudy:why!=='visibility'});
}
function bind(){
  for(const btn of document.querySelectorAll('[data-mode]'))btn.addEventListener('click',()=>setMode(btn.dataset.mode));
  $('generate').addEventListener('click',()=>{
    if(state.mode==='lettering')logoLoop?.pause('new logo requested');
    void paintFresh();
  });
  $('vary').addEventListener('click',()=>{
    if(state.mode==='lettering')logoLoop?.pause('manual mutation requested');
    void varyMethod();
  });
  $('keep').addEventListener('click',()=>vote(true));
  $('reject').addEventListener('click',()=>vote(false));
  $('export').addEventListener('click',()=>void download());
  $('blindStart').addEventListener('click',()=>void beginBlindTest());
  $('logoText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void paintFresh();}});
  $('logoType').addEventListener('change',()=>{
    logoControls?.glossary();
    if(state.mode==='lettering')void paintFresh();
  });
  $('logoStyle').addEventListener('change',()=>{if(state.mode==='lettering')void paintFresh();});
  $('landscapeScene').addEventListener('change',()=>{if(state.mode==='landscape')void paintFresh();});
  $('landscapeMood').addEventListener('change',()=>{if(state.mode==='landscape')void paintFresh();});
  $('landscapeConstraintLaw').innerHTML=
    '<option value="surprise">Invent / learn a law</option>'+
    Object.entries(LAWS).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('');
  $('landscapeConstraintMark').innerHTML=
    '<option value="surprise">Evolve the drawing medium</option>'+
    Object.entries(MARKS).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('');
  for(const id of ['landscapeConstraintLaw','landscapeConstraintMark','landscapeConstraintOn']){
    $(id).addEventListener('change',()=>{if(state.mode==='landscape')void paintFresh();});
  }
  $('landscapeMutateLaw').addEventListener('click',()=>{
    if(state.mode==='landscape'&&state.recipe?.mode==='landscape'){
      clearExperiments();clearBlind();void paintRecipe(makeRecipe({parent:state.recipe,focus:'constraint'}));
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void syncVotes();});
  imagination=initImagination({getSession:acquireSession});
  ruleStudio=initRuleStudio();
  logoControls=initAnatomyControls({
     onApply:applyEditedLogo,
     getText:()=>{
       const raw=cleanLogoText($('logoText').value);
       if($('logoType').value==='wordmark')return raw;
       return (raw.includes(' ')?raw.split(/\s+/).map(x=>x[0]||'').join(''):raw)
         .slice(0,3).toUpperCase();
     }
  });
  logoLoop=initLogoEvolution({
    getRecipe:()=>state.recipe,
    paint:paintNextLogoGeneration,
    onError:error=>setStatus('Logo evolution paused: '+String(error.message||error).slice(0,140))
  });
  buildGallery();setMode('rules');updateBlindSummary();
  void restoreRemoteProcedures();
  if(state.pending.length)void syncVotes();
  void loadSharedTaste();
}
bind();
