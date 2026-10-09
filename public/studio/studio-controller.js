/* Hexfield Studio 295 — small, accessible two-discipline controller.
 * Legacy painter / hand-drawn reference library is never loaded on this page.
 * The old engine and historic museum remain reachable at /legacy.html.
 */
import {SCENES,MOODS,renderLandscape,landscapeDescription,landscapeFeatures} from './landscape.js';
import {LETTER_STYLES,LETTER_TYPES,cleanLogoText,renderLettering,letteringDescription,letteringFeatures} from './lettering.js';

const $ = id=>document.getElementById(id);
const storage = {
  taste:'hexfield.studio.discipline-taste.v1',
  kept:'hexfield.studio.kept.v1',
  votes:'hexfield.studio.pending-votes.v1',
  shared:'hexfield.studio.collective-bias.v1',
  session:'hexfield.taste.session.v1',
  count:'hexfield.studio.paint-count.v1',
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
};
try{state.sample=Number(localStorage.getItem(storage.count))||0;}catch{state.sample=0;}
if(!Array.isArray(state.kept))state.kept=[];
if(!Array.isArray(state.pending))state.pending=[];
for(const k of ['landscape','lettering']){
  if(!state.learned?.[k]||typeof state.learned[k]!=='object')state.learned={...state.learned,[k]:{}};
  if(!state.collective?.[k]||typeof state.collective[k]!=='object')state.collective={...state.collective,[k]:{}};
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
function makeRecipe(){
  const seed=rand(),mode=state.mode;
  if(mode==='landscape')return {version:1,mode,seed,scene:selected('landscapeScene',SCENES,'scene'),mood:selected('landscapeMood',MOODS,'mood')};
  return {version:1,mode,seed,text:cleanLogoText($('logoText').value),style:selected('logoStyle',LETTER_STYLES,'style'),type:LETTER_TYPES.includes($('logoType').value)?$('logoType').value:'wordmark'};
}
function disableVoting(value){$('keep').disabled=value;$('reject').disabled=value;}
function setStatus(message){$('feedbackStatus').textContent=message;}
function setMode(mode,{paint=true}={}){
  if(!['landscape','lettering'].includes(mode))return;
  state.mode=mode;
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
    setStatus('KEEP makes this direction more likely. REJECT makes it less likely.');
  }catch(error){
    if(!abort.signal.aborted){console.error('Hexfield painter error:',error);$('paintingOverlay').textContent='COULD NOT FINISH THE STUDY';setStatus('The artist ran into a rendering error. Try another version.');}
  }finally{if(version===state.revision)state.working=false;}
}
function paintFresh(){return paintRecipe(makeRecipe());}
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
  if(liked)rememberKeep(recipe);
  const features=recipe.mode==='landscape'?landscapeFeatures(recipe):letteringFeatures(recipe);
  state.pending.push({client_id:crypto.randomUUID(),mode:recipe.mode,liked,recipe,features});
  if(state.pending.length>120)state.pending=state.pending.slice(-120);
  writeJson(storage.votes,state.pending);
  void syncVotes();
  setStatus(liked?'KEPT. The artist will favour choices like these.':'REJECTED. This direction will become less likely.');
  setTimeout(()=>{if(state.recipe===null||state.mode!==recipe.mode)return;void paintFresh();},500);
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
        if(!['scene','mood','style','type'].includes(row.feature))continue;
        totals[row.feature+':'+row.value]=Number(row.keeps)-Number(row.rejects);
      }
      state.collective[discipline]=totals;
    }
    writeJson(storage.shared,state.collective);
    $('syncNote').textContent='LEARNING: YOUR TASTE + COLLECTIVE MEMORY';
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
function bind(){
  for(const btn of document.querySelectorAll('[data-mode]'))btn.addEventListener('click',()=>setMode(btn.dataset.mode));
  $('generate').addEventListener('click',()=>void paintFresh());
  $('vary').addEventListener('click',()=>void paintFresh());
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
  if(state.pending.length)void syncVotes();
  void loadSharedTaste();
}
bind();
