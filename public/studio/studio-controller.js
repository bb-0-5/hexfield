/* Hexfield Studio 296 — human-guided evolution of visual procedures.
 * Legacy painter / hand-drawn reference library is never loaded on this page.
 * The old engine and historic museum remain reachable at /legacy.html.
 */
import {SCENES,MOODS,renderLandscape,landscapeDescription,landscapeFeatures} from './landscape.js';
import {LETTER_STYLES,LETTER_TYPES,cleanLogoText,renderLettering,letteringDescription,letteringFeatures} from './lettering.js';
import {FOCI,makeGenome,mutateGenome,sampleGenome,proposeExperiments,methodDescription,programKey,geneFeatures,methodDistance,evaluateSurface,randomFrom} from './evolution.js';

const $ = id=>document.getElementById(id);
const storage = {
  taste:'hexfield.studio.discipline-taste.v1',
  kept:'hexfield.studio.kept.v1',
  votes:'hexfield.studio.pending-votes.v1',
  shared:'hexfield.studio.collective-bias.v1',
  session:'hexfield.taste.session.v1',
  count:'hexfield.studio.paint-count.v1',
  evolution:'hexfield.studio.procedure-memory.v1',
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
  experiments:[],experimentRevision:0,
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
  const signature=programKey(g);
  if(rejected.includes(signature))value-=10;
  // A rare method has room to grow, even before anyone likes its first image.
  value+=Math.min(2,rejected.reduce((best,old)=>best+Number(old!==signature),0)*.024);
  return value;
}
function selectGenome(mode,seed){
  const memory=methodMemory(mode),r=randomFrom(seed),seen=new Set(memory.rejected.slice(-30));
  const possibilities=[];
  for(let i=0;i<9;i++){
    const candidate=i===0||r()<.3?makeGenome(mode,(seed+i*137)>>>0)
      :sampleGenome(memory.elites,mode,(seed+i*727)>>>0);
    if(evaluateSurface(candidate).length)continue;
    const signature=programKey(candidate);
    const score=genomeValue(mode,candidate)+(seen.has(signature)?-11:0);
    possibilities.push({genome:candidate,score});
  }
  // One in four inventions is exploration independent of audience preference.
  if(r()<.25)return makeGenome(mode,seed^0x61813);
  possibilities.sort((a,b)=>b.score-a.score);
  return possibilities[0]?.genome || makeGenome(mode,seed);
}
function makeRecipe({parent=null,focus=null,genome=null,subjectChange=false}={}){
  const seed=rand(),mode=state.mode;
  let method=genome || (parent?.genome
    ? mutateGenome(parent.genome,focus||FOCI[Math.floor(rand()%FOCI.length)],seed,
       methodMemory(mode).elites.find(e=>programKey(e.genome)!==programKey(parent.genome))?.genome || null)
    :selectGenome(mode,seed));
  if(evaluateSurface(method).length)method=makeGenome(mode,seed);
  const base={version:2,mode,seed,genome:method,experiment:focus||'invent',
    parentMethod:parent?.genome?programKey(parent.genome).slice(0,120):null};
  if(mode==='landscape'){
    const scene=parent?.mode===mode?parent.scene:selected('landscapeScene',SCENES,'scene');
    const mood=parent?.mode===mode?parent.mood:selected('landscapeMood',MOODS,'mood');
    return {...base,scene:subjectChange?SCENES.filter(v=>v!==scene)[rand()%(SCENES.length-1)]:scene,mood};
  }
  return {...base,text:parent?.mode===mode?cleanLogoText(parent.text):cleanLogoText($('logoText').value),
    style:parent?.mode===mode?parent.style:selected('logoStyle',LETTER_STYLES,'style'),
    type:parent?.mode===mode?parent.type:LETTER_TYPES.includes($('logoType').value)?$('logoType').value:'wordmark'};
}
function recordProcedure(recipe,liked){
  const g=recipe.genome;
  if(!g||evaluateSurface(g).length)return;
  const memory=methodMemory(recipe.mode),key=programKey(g);
  const existing=memory.elites.find(e=>programKey(e.genome)===key);
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
  memory.elites=memory.elites.filter(e=>e.score>0).slice(0,28);
  saveEvolution();
}
function clearExperiments(){
  state.experimentRevision++;state.experiments=[];
  const root=$('experiments');if(root){root.hidden=true;$('experimentCards').replaceChildren();}
}
async function showExperiments(rejected){
  if(!rejected.genome)return;
  clearExperiments();const token=state.experimentRevision;
  const otherMethods=methodMemory(rejected.mode).elites.map(item=>item.genome);
  const proposals=proposeExperiments(rejected.genome,rand(),otherMethods);
  if(rejected.mode==='landscape' && $('landscapeScene').value==='surprise'){
    proposals.push({focus:'subject',genome:mutateGenome(rejected.genome,'structure',rand())});
  }
  const root=$('experiments'),cards=$('experimentCards');root.hidden=false;
  const heading=$('experimentHeading');
  if(heading)heading.textContent='THAT FAILED. WHAT SHOULD CHANGE?';
  state.experiments=proposals.map(({focus,genome})=>({focus,recipe:makeRecipe({parent:rejected,focus,genome,subjectChange:focus==='subject'})}));
  for(const [i,item] of state.experiments.entries()){
    if(token!==state.experimentRevision)return;
    const button=document.createElement('button');button.type='button';button.className='experiment-card';
    const canvas=document.createElement('canvas');canvas.width=390;canvas.height=241;
    try{
      if(rejected.mode==='landscape')await renderLandscape(canvas,item.recipe,{animate:false,quality:.20});
      else renderLettering(canvas,item.recipe);
    }catch(err){console.warn('Experiment thumbnail unavailable:',err);}
    if(token!==state.experimentRevision)return;
    const img=document.createElement('img');img.alt='';
    try{img.src=canvas.toDataURL('image/webp',.62);}catch{/* no thumbnail on restricted browsers */}
    const name=document.createElement('strong');name.textContent={structure:'REBUILD THE STRUCTURE',surface:'CHANGE THE MARKS',light:'CHANGE THE LIGHT',subject:'PAINT SOMEWHERE ELSE'}[item.focus];
    const sub=document.createElement('span');sub.textContent=methodDescription(item.recipe.genome);
    button.append(img,name,sub);
    button.setAttribute('aria-label',`${name.textContent}: ${sub.textContent}`);
    button.addEventListener('click',()=>{
      if(token!==state.experimentRevision)return;
      const chosen=structuredClone(item.recipe);clearExperiments();
      setStatus(`Testing ${item.focus}: this changes the painting procedure. KEEP or REJECT the result to teach the artist.`);
      void paintRecipe(chosen);
    });
    cards.append(button);
    // Give touch devices a chance to paint the preview before the next.
    await new Promise(resolve=>requestAnimationFrame(resolve));
  }
}
function disableVoting(value){$('keep').disabled=value;$('reject').disabled=value;}
function setStatus(message){$('feedbackStatus').textContent=message;}
function setMode(mode,{paint=true}={}){
  if(!['landscape','lettering'].includes(mode))return;
  clearExperiments();state.mode=mode;
  $('landscapeControls').hidden=mode!=='landscape';
  $('letteringControls').hidden=mode!=='lettering';
  for(const el of document.querySelectorAll('[data-mode]')) {
    const active=el.dataset.mode===mode;
    el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
  }
  $('generate').firstChild.textContent=mode==='landscape'?'PAINT SOMETHING ':'DESIGN A LOGO ';
  $('canvasWrap').classList.toggle('logo-surface',mode==='lettering');
  if(paint)void paintFresh();
}
async function paintRecipe(recipe,{newStudy=true}={}) {
  state.controller?.abort();const abort=new AbortController();state.controller=abort;
  state.mode=recipe.mode;
  state.recipe=recipe;
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
    }else{
      renderLettering(state.canvas,recipe);
    }
    if(abort.signal.aborted||version!==state.revision)return;
    $('paintingOverlay').hidden=true;
    $('statusOrb').classList.remove('busy');
    $('renderStatus').textContent='READY FOR YOUR VERDICT';
    disableVoting(false);
    setStatus('KEEP preserves this method. REJECT opens genuinely different ways of constructing it.');
  }catch(error){
    if(!abort.signal.aborted){console.error('Hexfield painter error:',error);$('paintingOverlay').textContent='COULD NOT FINISH THE STUDY';setStatus('The artist ran into a rendering error. Try another version.');}
  }finally{if(version===state.revision)state.working=false;}
}
function paintFresh(){clearExperiments();return paintRecipe(makeRecipe());}
function varyMethod(){
  const base=state.recipe?.mode===state.mode?structuredClone(state.recipe):null;
  clearExperiments();return paintRecipe(makeRecipe({parent:base,focus:FOCI[rand()%FOCI.length]}));
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
  if(state.working||!state.recipe||$('keep').disabled)return;
  const recipe=structuredClone(state.recipe);
  disableVoting(true);
  updatePreference(recipe,liked);
  recordProcedure(recipe,liked);
  if(liked)rememberKeep(recipe);
  const features=recipe.mode==='landscape'?landscapeFeatures(recipe):letteringFeatures(recipe);
  state.pending.push({client_id:crypto.randomUUID(),mode:recipe.mode,liked,recipe,features});
  if(state.pending.length>120)state.pending=state.pending.slice(-120);
  writeJson(storage.votes,state.pending);
  void syncVotes();
  if(liked){
    setStatus('KEPT. This painting procedure survived. Its descendants can mutate and recombine.');
    clearExperiments();
  }else{
    setStatus('REJECTED. Compare changes to the construction, brushwork and light — then choose what to investigate.');
    void showExperiments(recipe);
  }
}
async function download(){
  if(state.working||!state.recipe){setStatus('Finish the painting first.');return;}
  const recipe=structuredClone(state.recipe),btn=$('export');btn.disabled=true;
  try{
    const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1480;
    if(recipe.mode==='landscape')await renderLandscape(canvas,recipe,{animate:false});
    else renderLettering(canvas,recipe);
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
      void paintRecipe(item.recipe,{newStudy:false});
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
    const res=await withTimeout(API+'/rest/v1/hexfield_studio_votes?select=mode,liked,recipe,created_at&order=created_at.desc&limit=80',{
      headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+session.access_token},
    });
    if(!res.ok)return;
    const rows=await res.json();
    for(const row of rows.reverse()){
      const g=row.recipe?.genome;
      if(!row.liked||!g||g.kind!==row.mode||evaluateSurface(g).length)continue;
      const memory=methodMemory(row.mode);
      const key=programKey(g),existing=memory.elites.find(x=>programKey(x.genome)===key);
      if(existing)existing.score=Math.max(existing.score||1,2);
      else memory.elites.unshift({genome:g,score:2,learnedAt:new Date(row.created_at).getTime()||Date.now()});
      memory.elites=memory.elites.slice(0,28);
    }
    saveEvolution();remoteProceduresLoaded=true;
  }catch(err){console.info('Studio method archive offline; local evolution continues.',err);}
}
function bind(){
  for(const btn of document.querySelectorAll('[data-mode]'))btn.addEventListener('click',()=>setMode(btn.dataset.mode));
  $('generate').addEventListener('click',()=>void paintFresh());
  $('vary').addEventListener('click',()=>void varyMethod());
  $('keep').addEventListener('click',()=>vote(true));
  $('reject').addEventListener('click',()=>vote(false));
  $('export').addEventListener('click',()=>void download());
  $('logoText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void paintFresh();}});
  $('logoType').addEventListener('change',()=>{if(state.mode==='lettering')void paintFresh();});
  $('logoStyle').addEventListener('change',()=>{if(state.mode==='lettering')void paintFresh();});
  $('landscapeScene').addEventListener('change',()=>{if(state.mode==='landscape')void paintFresh();});
  $('landscapeMood').addEventListener('change',()=>{if(state.mode==='landscape')void paintFresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void syncVotes();});
  buildGallery();setMode('landscape');
  void restoreRemoteProcedures();
  if(state.pending.length)void syncVotes();
  void loadSharedTaste();
}
bind();
