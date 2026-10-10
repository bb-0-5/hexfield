/* HEXFIELD 326 — selective forgetting and rediscovery.
 * No snapshots, external services or fake image claims: only bounded,
 * colour-classified 12x8 material silhouettes extracted from accepted pixels.
 * Nothing learned from a losing candidate is committed to visual memory.
 */
import {scoreRegion} from './regional-judgement.js';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
const round=n=>Math.round(n*10000)/10000;
const WIDTH=12,HEIGHT=8,MAX_ARCHIVE=4;
export const CREATIVE_MEMORY_KEY='hexfield.creative-forgetting.326';
export const RECALL_EVERY=4;
const anchorId=id=>/^form-[01]$/.test(id||'');
const validBox=b=>b&&['x','y','w','h'].every(k=>Number.isFinite(b[k]))&&
 b.x>=0&&b.y>=0&&b.w>.015&&b.h>.015&&b.x+b.w<=1.005&&b.y+b.h<=1.005;
const validInk=ink=>Array.isArray(ink)&&ink.length===3&&
 ink.every(n=>Number.isInteger(n)&&n>=0&&n<=255);
const validMask=s=>typeof s==='string'&&/^[01]{96}$/.test(s)&&
 s.includes('1')&&s.includes('0');
const canvasOf=(w,h)=>{const c=document.createElement('canvas');
 c.width=w;c.height=h;return c;};
const pixelBox=(a,w,h)=>({
 x:Math.max(0,Math.floor(a.box.x*w)),
 y:Math.max(0,Math.floor(a.box.y*h)),
 w:Math.max(1,Math.min(w,Math.ceil(a.box.w*w))),
 h:Math.max(1,Math.min(h,Math.ceil(a.box.h*h)))
});
const delta=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/441.67295593;
export function createCreativeMemory(root=null){
 return {version:1,root:root||null,generation:0,habits:{},
  archive:[],events:[],forgotten:0,rediscovered:0};
}
export function loadCreativeMemory(root=null){
 const empty=createCreativeMemory(root);
 if(!root)return empty;
 try{
  const saved=JSON.parse(localStorage.getItem(CREATIVE_MEMORY_KEY)||'null');
  if(saved?.version!==1||saved.root!==root||!saved.habits||
   !Array.isArray(saved.archive))return empty;
  const habits={};
  for(const [id,h] of Object.entries(saved.habits)){
   if(!anchorId(id)||!h||!Number.isFinite(h.misses))continue;
   habits[id]={streak:clamp(h.streak||0,0,1000),
    misses:clamp(h.misses,0,1000),held:clamp(h.held||0,0,1000),
    lastSeen:clamp(h.lastSeen||0,0,100000),
    confidence:clamp(h.confidence||0,0,1),
    snapshot:validSignature(h.snapshot)?sanitizeSignature(h.snapshot):null};
  }
  const archive=saved.archive.slice(0,MAX_ARCHIVE)
   .filter(x=>validSignature(x)&&anchorId(x.id)&&
    Number.isFinite(x.dormantSince))
   .map(x=>({...sanitizeSignature(x),
    dormantSince:clamp(x.dormantSince,0,100000),
    revisits:clamp(x.revisits||0,0,1000)}));
  const events=(Array.isArray(saved.events)?saved.events:[]).slice(-8)
   .filter(e=>['FORGOT','RETURNED'].includes(e?.type)&&anchorId(e?.id))
   .map(e=>({type:e.type,id:e.id,generation:
    clamp(e.generation||0,0,100000)}));
  return {...empty,generation:clamp(saved.generation||0,0,100000),
   habits,archive,events,
   forgotten:clamp(saved.forgotten||0,0,100000),
   rediscovered:clamp(saved.rediscovered||0,0,100000)};
 }catch{return empty;}
}
export function saveCreativeMemory(memory){
 if(!memory?.root)return false;
 try{localStorage.setItem(CREATIVE_MEMORY_KEY,JSON.stringify(memory));
  return true;}catch{return false;}
}
function validSignature(x){
 return !!x&&anchorId(x.id)&&validBox(x.box)&&validInk(x.ink)&&
  validMask(x.mask);
}
function sanitizeSignature(x){
 return {id:x.id,box:{x:x.box.x,y:x.box.y,w:x.box.w,h:x.box.h},
  ink:x.ink.slice(),mask:x.mask};
}
export function sampleVisualSignature(canvas,anchor){
 if(!canvas?.getContext||!anchorId(anchor?.id)||
  !validBox(anchor.box)||!validInk(anchor.ink))return null;
 const b=pixelBox(anchor,canvas.width,canvas.height),
  small=canvasOf(WIDTH,HEIGHT),ctx=small.getContext('2d',
   {willReadFrequently:true});
 ctx.drawImage(canvas,b.x,b.y,b.w,b.h,0,0,WIDTH,HEIGHT);
 const data=ctx.getImageData(0,0,WIDTH,HEIGHT).data;
 let mask='',near=0;
 for(let i=0;i<WIDTH*HEIGHT;i++){
  const j=i*4,c=[data[j],data[j+1],data[j+2]],
   isForm=delta(c,anchor.ink)<.245;
  mask+=isForm?'1':'0';near+=isForm?1:0;
 }
 // If the sampled interior is solid, retain an inset footprint. A solid
 // field must not become a 100%-opaque 1/9th-canvas colour rectangle.
 if(near>=93)mask=Array.from({length:HEIGHT},(_,y)=>
  Array.from({length:WIDTH},(_,x)=>
    x>0&&x<WIDTH-1&&y>0&&y<HEIGHT-1?'1':'0').join('')).join('');
 if(!validMask(mask)||mask.split('1').length<6)return null;
 return {id:anchor.id,box:{...anchor.box},
  ink:anchor.ink.slice(),mask};
}
export function measureHabit(canvas,anchor){
 if(!canvas?.getContext||!validBox(anchor?.box))return 0;
 const b=pixelBox(anchor,canvas.width,canvas.height),
  small=canvasOf(WIDTH,HEIGHT),ctx=small.getContext('2d',
   {willReadFrequently:true});
 ctx.drawImage(canvas,b.x,b.y,b.w,b.h,0,0,WIDTH,HEIGHT);
 const d=ctx.getImageData(0,0,WIDTH,HEIGHT).data;
 let same=0;
 for(let i=0;i<WIDTH*HEIGHT;i++){
  const p=i*4;
  same+=delta([d[p],d[p+1],d[p+2]],anchor.ink)<.245?1:0;
 }
 return round(same/(WIDTH*HEIGHT));
}
function record(history,event){
 history.push(event);return history.slice(-8);
}
export function settleCreativeMemory(memory,identity,canvas,{
 generation=identity?.generation||0,recall=null,quality=1
}={}){
 if(!identity?.root||!canvas?.getContext)
  return {memory:memory||createCreativeMemory(),identity,events:[]};
 const current=memory?.root===identity.root?memory:
  createCreativeMemory(identity.root);
 const updated={...current,generation,habits:{...current.habits},
  archive:current.archive.map(x=>({...x})),
  events:current.events.slice(),forgotten:current.forgotten,
  rediscovered:current.rediscovered};
 const output={...identity,anchors:identity.anchors.map(a=>({...a,
  box:{...a.box},ink:a.ink.slice()}))};
 const events=[];
 if(recall?.accepted&&validSignature(recall.signature)&&
  !output.anchors.some(a=>a.id===recall.signature.id)&&
  output.anchors.length<2){
  const sign=recall.signature;
  output.anchors.push({id:sign.id,box:{...sign.box},
   ink:sign.ink.slice(),age:1,vitality:.6});
  updated.archive=updated.archive.filter(x=>x.id!==sign.id);
  updated.habits[sign.id]={streak:1,misses:0,held:1,
   lastSeen:generation,confidence:.6,snapshot:sanitizeSignature(sign)};
  updated.rediscovered++;
  const event={type:'RETURNED',id:sign.id,generation};
  events.push(event);updated.events=record(updated.events,event);
 }
 for(const anchor of output.anchors.slice()){
  const habit=updated.habits[anchor.id]||{streak:0,misses:0,
   held:0,lastSeen:generation,confidence:0,snapshot:null};
  const presence=measureHabit(canvas,anchor);
  // Distinctive material can become a tradition if it contributes to
  // several accepted paintings. Weak signatures can then really be let go.
  const contributes=presence>=.29&&quality>=.17;
  const snapshot=contributes?
    sampleVisualSignature(canvas,anchor)||habit.snapshot:habit.snapshot;
  const revised={...habit,
   streak:contributes?Math.min(1000,habit.streak+1):0,
   misses:contributes?0:Math.min(1000,habit.misses+1),
   held:contributes?Math.min(1000,habit.held+1):habit.held,
   lastSeen:contributes?generation:habit.lastSeen,
   confidence:round(habit.confidence*.55+presence*.45),
   snapshot};
  updated.habits[anchor.id]=revised;
  const forget=revised.misses>=3&&revised.held>=1&&
   generation-revised.lastSeen>=3&&revised.snapshot;
  if(forget){
   output.anchors=output.anchors.filter(a=>a.id!==anchor.id);
   updated.archive=[{...sanitizeSignature(revised.snapshot),
    dormantSince:generation,revisits:0},
    ...updated.archive.filter(x=>x.id!==anchor.id)].slice(0,MAX_ARCHIVE);
   delete updated.habits[anchor.id];updated.forgotten++;
   const event={type:'FORGOT',id:anchor.id,generation};
   events.push(event);updated.events=record(updated.events,event);
  }
 }
 return {memory:updated,identity:output,events};
}
export function scheduleRediscovery({identity,memory,generation=0,
 locked=false,dirtyTiles=null}={}){
 if(!identity?.root||memory?.root!==identity.root||locked||
  Array.isArray(dirtyTiles)&&dirtyTiles.length||
  identity.anchors.length>=2||generation%RECALL_EVERY!==0)return null;
 const dormant=(memory.archive||[]).filter(x=>
  validSignature(x)&&generation-x.dormantSince>=3&&
  !identity.anchors.some(a=>a.id===x.id));
 if(!dormant.length)return null;
 return dormant[(Math.floor(generation/RECALL_EVERY)-1)%dormant.length];
}
export function paintHistoricalSilhouette(canvas,signature,{
 alpha=.72,wordBounds=null
}={}){
 if(!canvas?.getContext||!validSignature(signature))return 0;
 const b=pixelBox(signature,canvas.width,canvas.height);
 if(b.w*b.h>canvas.width*canvas.height*.15)return 0;
 const overlap=wordBounds?Math.max(0,Math.min(b.x+b.w,
  wordBounds.x+wordBounds.w)-Math.max(b.x,wordBounds.x))*
  Math.max(0,Math.min(b.y+b.h,wordBounds.y+wordBounds.h)-
  Math.max(b.y,wordBounds.y)):0;
 if(overlap>b.w*b.h*.15)return 0;
 const ctx=canvas.getContext('2d');ctx.save();
 ctx.setTransform(1,0,0,1,0,0);
 // Elliptical brush samples can extend past a footprint's outer cells.
 // Clip them to the remembered bbox so not even one neighbour pixel changes.
 ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();
 ctx.globalAlpha=clamp(alpha,0,.83);
 let painted=0;
 // The dark/light occupancy here was physically sampled from an earlier
 // ACCEPTED painting. The lost original pixels cannot be reconstructed;
 // this is an authentic compact *shape record* in its learned pigment.
 ctx.fillStyle='rgb('+signature.ink.join(',')+')';
 const sx=b.w/WIDTH,sy=b.h/HEIGHT;
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
  if(signature.mask[y*WIDTH+x]!=='1')continue;
  ctx.beginPath();
  ctx.ellipse(b.x+(x+.5)*sx,b.y+(y+.5)*sy,
   Math.max(.6,sx*.67),Math.max(.6,sy*.70),0,0,Math.PI*2);
  ctx.fill();painted++;
 }
 ctx.restore();
 return painted;
}
export function attemptRediscovery({canvas,parent=null,identity,memory,
 generation=0,locked=false,dirtyTiles=null,wordBounds=null,
 minImprovement=.012,judge=scoreRegion,onTrial=()=>{}
}={}){
 const signature=scheduleRediscovery({identity,memory,generation,
  locked,dirtyTiles});
 if(!canvas?.getContext||!signature)
  return {attempted:false,accepted:false,signature:null};
 const region=pixelBox(signature,canvas.width,canvas.height);
 const copy=canvasOf(canvas.width,canvas.height);
 copy.getContext('2d').drawImage(canvas,0,0);
 const ink=paintHistoricalSilhouette(copy,signature,{wordBounds});
 if(!ink)return {attempted:false,accepted:false,signature:null};
 const criteria={parent,stability:.4};
 const before=judge(canvas,region,criteria),after=judge(copy,region,criteria);
 // An old idea returns only if genuinely useful on the CURRENT canvas.
 // It does not win simply because it was historically successful.
 const gain=after.score-before.score,accepted=gain>minImprovement;
 if(accepted){
  const ctx=canvas.getContext('2d');ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(copy,region.x,region.y,region.w,region.h,
   region.x,region.y,region.w,region.h);ctx.restore();
 }
 const event={type:'rediscovery-trial',id:signature.id,accepted,
  gain:round(gain),marks:ink,canvas};
 onTrial(event);
 return {attempted:true,accepted,signature:sanitizeSignature(signature),
  gain:round(gain),marks:ink};
}
