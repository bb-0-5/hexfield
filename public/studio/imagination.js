/* Hexfield 299 / visual imagination. The image is produced by a learned image
 * model, not the old horizon-and-hills procedural canvas. Human criticism is
 * recorded and passed to a language model as evidence for the NEXT painting.
 * This is prompt-level adaptation, NOT fine-tuning the image model weights.
 */
const $=id=>document.getElementById(id);
const API='https://uiobhojjgtsvyzuzqqiy.supabase.co';
const PUBLIC_KEY='sb_publishable_G6unWGHkbOkjAaRHhaq_8Q_j-1T4jA8';
const HISTORY_KEY='hexfield.imagination.feedback.v1';
const readHistory=()=>{try{const rows=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(rows)?rows.slice(-40):[];}catch{return [];}};
const persist=rows=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify(rows.slice(-40)));}catch{}};
function safeText(x,n=400){return String(x||'').slice(0,n).trim();}
const noStore={cache:'no-store'};
const PAINTING_DB='hexfield-imagination-images-v1';
const openArtworkDB=()=>new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));
  const request=indexedDB.open(PAINTING_DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('artwork'))request.result.createObjectStore('artwork');};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Painting storage unavailable'));
});
async function storeCurrentPainting(current){
  try{
    const db=await openArtworkDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('artwork','readwrite');
      tx.objectStore('artwork').put(current,'latest');
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error);
    });db.close();
  }catch(error){console.info('Painting will remain in this tab only:',String(error).slice(0,130));}
}
async function restoreCurrentPainting(){
  try{
    const db=await openArtworkDB();
    const picture=await new Promise((resolve,reject)=>{
      const tx=db.transaction('artwork','readonly');
      const req=tx.objectStore('artwork').get('latest');
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });db.close();return picture;
  }catch{return null;}
}

export function initImagination({getSession}){
  let current=null,working=false,history=readHistory(),loadPromise=null,syncing=false;
  let lastCritique='';
  const uiStatus=(message)=>{$('imagineStatus').textContent=message;};
  let quotaLoading=false;
  async function refreshQuota(){
    if(quotaLoading)return;
    quotaLoading=true;
    try{
      const session=await getSession();
      const response=await fetch(API+'/rest/v1/rpc/hexfield_imagination_remaining',{
        method:'POST',cache:'no-store',
        headers:{apikey:PUBLIC_KEY,authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
        body:'{}',signal:AbortSignal.timeout(9000)
      });
      if(!response.ok)throw Error('quota status unavailable');
      const info=await response.json();
      const remaining=Number(info.paintings_remaining);
      const retries=Number(info.retry_attempts_remaining);
      const site=Number(info.site_attempts_remaining);
      if(Number.isFinite(remaining)&&Number.isFinite(retries)){
        const exhausted=remaining<1||retries<1||site<1;
        const quotaMessage=remaining+' paintings available today · '+retries+' attempts available'+
          (Number.isFinite(site)?' · '+site+' shared studio attempts available':'')+
          (Number(info.in_progress)>0?' · '+info.in_progress+' in progress':'');
        $('imagineQuota').textContent=exhausted?
          quotaMessage+' · Budget resets at 00:00 UTC.':quotaMessage;
      }
    }catch(error){console.info('Could not read imagination quota:',String(error).slice(0,120));}
    finally{quotaLoading=false;}
  }
  const setBusy=(busy)=>{
    working=busy;
    for(const key of ['imaginePaint','imagineRevise','imagineExport','imagineKeep','imagineReject']){
      const el=$(key);if(!el)continue;
      el.disabled=busy || (key!=='imaginePaint'&&!current) ||
        (['imagineKeep','imagineReject'].includes(key)&&!!current?.judged);
    }
    $('imaginePaint').textContent=busy?'IMAGINING…':'PAINT A NEW IDEA ↗';
    $('imagineBusy').hidden=!busy;
  };
  function summariseHistory(){
    const kept=history.filter(x=>x.liked===true).length;
    const rejected=history.filter(x=>x.liked===false).length;
    $('imagineMemory').textContent=`MEMORY / ${kept} KEPT · ${rejected} REJECTED · FEEDBACK SHAPES FUTURE PROMPTS`;
    const recent=history.slice(-4).reverse();const parent=$('imagineHistory');parent.replaceChildren();
    for(const item of recent){
      const card=document.createElement('div');card.className='imagine-history-item';
      const flag=document.createElement('strong');flag.textContent=item.liked?'KEPT':'REJECTED';
      const note=document.createElement('span');note.textContent=safeText(item.critique||item.method||item.idea||'no note',110);
      if(item.thumb&&item.thumb.startsWith('data:image/')){const img=document.createElement('img');img.src=item.thumb;img.alt='Kept painting thumbnail';card.append(img);}
      card.append(flag,note);parent.append(card);
    }
  }
  function updateCurrent(){
    $('imagineEmpty').hidden=!!current;
    $('imaginePicture').hidden=!current;
    $('imagineDecision').hidden=!current;
    $('imagineTitle').textContent=current?.title||'A painting waiting to be made';
    $('imagineMethod').textContent=current?.method||'The model can attempt an unfamiliar painting method or subject.';
    if(current){$('imaginePicture').src=current.image;}
    $('imagineRevise').disabled=working||!current;
    $('imagineExport').disabled=working||!current;
    $('imagineKeep').disabled=working||!current||!!current.judged;
    $('imagineReject').disabled=working||!current||!!current.judged;
  }
  async function fetchRemoteFeedback(){
    if(loadPromise)return loadPromise;
    loadPromise=(async()=>{
      try{
        const session=await getSession();
        const res=await fetch(API+'/rest/v1/hexfield_imagination_feedback?select=id,image_id,liked,idea,prompt,critique,method_note,created_at&order=created_at.desc&limit=30',{
          ...noStore,headers:{apikey:PUBLIC_KEY,authorization:'Bearer '+session.access_token}});
        if(!res.ok)return;
        const rows=await res.json();const merged=new Map();
        for(const entry of history)merged.set(entry.id,entry);
        for(const row of rows){
          if(!merged.has(row.id))merged.set(row.id,{id:row.id,imageId:row.image_id,liked:row.liked,
            idea:row.idea,prompt:row.prompt,critique:row.critique,method:row.method_note,createdAt:row.created_at,synced:true});
          else merged.get(row.id).synced=true;
        }
        history=[...merged.values()].sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))).slice(-40);
        persist(history);summariseHistory();
      }catch(error){console.info('Imagination will use local preferences until sync is possible',String(error).slice(0,150));}
    })();return loadPromise;
  }
  async function syncFeedback(){
    if(syncing)return;syncing=true;
    try{
      const session=await getSession();
      for(const row of history.filter(x=>!x.synced)){
        const payload={id:row.id,image_id:row.imageId,visitor_id:session.user.id,
          liked:row.liked,idea:row.idea||'',prompt:row.prompt||'',critique:row.critique||'',
          method_note:row.method||''};
        const res=await fetch(API+'/rest/v1/hexfield_imagination_feedback?on_conflict=id',{
          ...noStore,method:'POST',headers:{apikey:PUBLIC_KEY,authorization:'Bearer '+session.access_token,
            'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},
          body:JSON.stringify(payload)});
        if(!res.ok)throw Error('Feedback HTTP '+res.status);
        row.synced=true;persist(history);
      }
    }catch(error){console.info('Feedback will sync when a session is available',String(error).slice(0,150));}
    finally{syncing=false;}
  }
  async function smallCanvasB64(image){
    const pic=new Image();pic.src=image;
    await new Promise((resolve,reject)=>{
      if(pic.complete&&pic.naturalWidth)return resolve();
      const timer=setTimeout(()=>reject(Error('The earlier painting could not be decoded in time. Try a new painting instead.')),9000);
      pic.onload=()=>{clearTimeout(timer);resolve();};
      pic.onerror=()=>{clearTimeout(timer);reject(Error('The earlier painting could not be read. Try a new painting instead.'));};
    });
    const c=document.createElement('canvas');c.width=448;c.height=336;
    c.getContext('2d').drawImage(pic,0,0,448,336);
    return c.toDataURL('image/png').split(',')[1];
  }
  async function makePainting(edit=false){
    if(working)return;
    setBusy(true);uiStatus('Connecting to the image studio…');
    const controller=new AbortController();
    let deadline=null,progressTimer=null;
    try{
      // The local feedback is sufficient to start painting. Never block GPU
      // generation while a separate remote-history sync is stalled.
      void fetchRemoteFeedback();
      const session=await getSession();
      const idea=safeText($('imagineIdea').value,360);
      const note=safeText($('imagineCritique').value,400);
      const image_b64=edit&&current?await smallCanvasB64(current.image):null;
      uiStatus('The model is painting. This can take a minute — the page is still responsive.');
      progressTimer=setTimeout(()=>uiStatus('Still generating the image. Your previous painting will be preserved if this attempt fails.'),35000);
      deadline=setTimeout(()=>controller.abort(),115000);
      const response=await fetch('/api/imagine',{method:'POST',...noStore,
        signal:controller.signal,
        headers:{'Content-Type':'application/json',authorization:'Bearer '+session.access_token},
        body:JSON.stringify({request_id:crypto.randomUUID(),idea,
          critique:edit?note||'Rework this composition substantially; do not just colour grade it.':note||lastCritique,
          edit:!!edit,image_b64,history:history.slice(-8).map(h=>({
            liked:h.liked,idea:h.idea,prompt:h.prompt,critique:h.critique,method:h.method
          }))})});
      const result=await response.json().catch(()=>({error:'Invalid response from the image studio'}));
      if(!response.ok||!result.image)throw Error(result.error||'The image generator is unavailable.');
      current={image:result.image,id:crypto.randomUUID(),
        idea,title:safeText(result.title,85),method:safeText(result.method,220),
        prompt:safeText(result.prompt,1400),judged:false};
      $('imagineCritique').value='';lastCritique='';
      document.querySelectorAll('[data-critique]').forEach(b=>b.classList.remove('selected'));
      updateCurrent();
      void storeCurrentPainting(current);
      void refreshQuota();
      uiStatus('Painting finished. '+result.credits_remaining+' painting(s) remaining today. The image is saved in this browser.');
    }catch(error){
      const timedOut=controller.signal.aborted||error?.name==='AbortError';
      let detail=timedOut?
        'This image request timed out. Your previous painting is safe. You can retry.' :
        safeText(error.message||'The image service could not complete this painting.',300);
      if(!timedOut)detail+=' Your previous painting is safe.';
      // The status line is a visible diagnostic, not an indefinite spinner.
      uiStatus(detail);
      void refreshQuota();
    }
    finally{
      if(deadline!==null)clearTimeout(deadline);
      if(progressTimer!==null)clearTimeout(progressTimer);
      setBusy(false);updateCurrent();
    }
  }
  function vote(liked){
    if(!current||working||current.judged)return;
    const critique=safeText($('imagineCritique').value,400) || (!liked?'The painting did not work for me. Explore a genuinely different image and visual method.':'The visual direction is worth developing.');
    let thumb='';
    if(liked){try{const c=document.createElement('canvas');c.width=240;c.height=180;c.getContext('2d').drawImage($('imaginePicture'),0,0,240,180);thumb=c.toDataURL('image/webp',.48);}catch{}}
    const feedback={id:crypto.randomUUID(),imageId:current.id,liked,thumb,idea:current.idea,
      prompt:current.prompt,method:current.method,critique,createdAt:new Date().toISOString(),synced:false};
    current.judged=true;
    void storeCurrentPainting(current);
    history.push(feedback);history=history.slice(-40);persist(history);
    if(!liked)lastCritique=critique;
    summariseHistory();updateCurrent();void syncFeedback();
    uiStatus(liked?'KEPT. Its concept and approach will inform future paintings.':
      'REJECTED. The next image brief will use your criticism to change the subject, method or composition.');
    $('imaginePaint').textContent=liked?'EXPLORE ANOTHER IDEA ↗':'INVESTIGATE A DIFFERENT IDEA ↗';
  }
  function exportPNG(){
    if(!current)return;
    const anchor=document.createElement('a');anchor.href=current.image;
    anchor.download=`hexfield-imagination-${current.id}.png`;
    document.body.append(anchor);anchor.click();anchor.remove();
  }
  $('imaginePaint').addEventListener('click',()=>void makePainting(false));
  $('imagineRevise').addEventListener('click',()=>void makePainting(true));
  $('imagineExport').addEventListener('click',exportPNG);
  $('imagineKeep').addEventListener('click',()=>vote(true));
  $('imagineReject').addEventListener('click',()=>vote(false));
  document.querySelectorAll('[data-critique]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.critique;
    const input=$('imagineCritique');input.value=[input.value.trim(),value].filter(Boolean).join('. ').slice(0,400);
    button.classList.add('selected');
  }));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void syncFeedback();});
  summariseHistory();updateCurrent();
  void restoreCurrentPainting().then(saved=>{
    if(current||!saved||typeof saved.image!=='string'||!saved.image.startsWith('data:image/'))return;
    current=saved;updateCurrent();setBusy(false);
    uiStatus('Restored your previous painting from this browser. You can keep it, critique it, export it or paint again.');
  });
  void fetchRemoteFeedback().then(()=>syncFeedback());
  void refreshQuota();
  return {show(){summariseHistory();},hide(){},getHistory:()=>history};
}
