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

export function initImagination({getSession}){
  let current=null,working=false,history=readHistory(),loadPromise=null,syncing=false;
  let lastCritique='';
  const uiStatus=(message)=>{$('imagineStatus').textContent=message;};
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
    await new Promise((resolve,reject)=>{if(pic.complete&&pic.naturalWidth)return resolve();pic.onload=resolve;pic.onerror=reject;});
    const c=document.createElement('canvas');c.width=448;c.height=336;
    c.getContext('2d').drawImage(pic,0,0,448,336);
    return c.toDataURL('image/png').split(',')[1];
  }
  async function makePainting(edit=false){
    if(working)return;
    setBusy(true);uiStatus('Investigating visual ideas. No landscape template is being reused.');
    try{
      await fetchRemoteFeedback();
      const session=await getSession();
      const idea=safeText($('imagineIdea').value,360);
      const note=safeText($('imagineCritique').value,400);
      const image_b64=edit&&current?await smallCanvasB64(current.image):null;
      const response=await fetch('/api/imagine',{method:'POST',...noStore,
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
      uiStatus(`Made with a generative image model. ${result.credits_remaining} painting${result.credits_remaining===1?'':'s'} left today. Tell it what succeeded or failed.`);
    }catch(error){uiStatus(safeText(error.message,280));}
    finally{setBusy(false);updateCurrent();}
  }
  function vote(liked){
    if(!current||working||current.judged)return;
    const critique=safeText($('imagineCritique').value,400) || (!liked?'The painting did not work for me. Explore a genuinely different image and visual method.':'The visual direction is worth developing.');
    let thumb='';
    if(liked){try{const c=document.createElement('canvas');c.width=240;c.height=180;c.getContext('2d').drawImage($('imaginePicture'),0,0,240,180);thumb=c.toDataURL('image/webp',.48);}catch{}}
    const feedback={id:crypto.randomUUID(),imageId:current.id,liked,thumb,idea:current.idea,
      prompt:current.prompt,method:current.method,critique,createdAt:new Date().toISOString(),synced:false};
    current.judged=true;
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
  void fetchRemoteFeedback().then(()=>syncFeedback());
  return {show(){summariseHistory();},hide(){},getHistory:()=>history};
}
