/* HEXFIELD 325 — A living visual identity, not a sequence of resets.
 * An accepted work owns a small, durable constitution: measured palette,
 * distinct real-pixel forms, and a few past cross-region relationships.
 * Offspring mutate it gradually. No images leave the device or enter storage.
 */
import {extractVisualObjects} from './object-memory.js';
import {regionRects} from './regional-judgement.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const round=x=>Math.round(x*10000)/10000;
const colour=c=>Array.isArray(c)&&c.length===3?
 c.slice(0,3).map(v=>Math.round(clamp(Number(v),0,255))):[120,120,120];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/441.67295593;
const midpoint=r=>({x:r.x+r.w*.5,y:r.y+r.h*.5});
const boxOK=b=>!!b&&[b.x,b.y,b.w,b.h].every(Number.isFinite)&&
 b.x>=0&&b.y>=0&&b.w>0&&b.h>0&&b.x+b.w<=1.005&&b.y+b.h<=1.005;
const average=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
const averageBox=(a,b,t)=>Object.fromEntries(
 ['x','y','w','h'].map(k=>[k,round(a[k]*(1-t)+b[k]*t)]));
const canvasOf=(w,h)=>{
 const c=document.createElement('canvas');c.width=w;c.height=h;return c;
};
export const IDENTITY_KEY='hexfield.visual-identity.325';
export const IDENTITY_ANCHORS=2;
export const IDENTITY_VERSION=1;
export function createVisualIdentity(){
 return {version:IDENTITY_VERSION,root:null,generation:0,
  palette:[],anchors:[],relations:[],retained:0,adaptations:0};
}
export function loadVisualIdentity(){
 const blank=createVisualIdentity();
 try{
  const data=JSON.parse(localStorage.getItem(IDENTITY_KEY)||'null');
  if(!data||data.version!==IDENTITY_VERSION||
   typeof data.root!=='string'||!/^[a-z0-9-]{1,45}$/.test(data.root)||
   !Array.isArray(data.palette)||data.palette.length!==9||
   !data.palette.every(p=>Array.isArray(p)&&p.length===3&&
     p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)))
   return blank;
  const anchors=(Array.isArray(data.anchors)?data.anchors:[]).slice(0,IDENTITY_ANCHORS)
   .filter(a=>typeof a?.id==='string'&&/^form-[01]$/.test(a.id)&&
      boxOK(a.box)&&Array.isArray(a.ink)&&a.ink.length===3&&
      a.ink.every(n=>Number.isInteger(n)&&n>=0&&n<=255))
   .map(a=>({id:a.id,box:{...a.box},ink:colour(a.ink),
    age:clamp(Number(a.age),1,100000),vitality:clamp(Number(a.vitality),0,1)}));
  const relations=(Array.isArray(data.relations)?data.relations:[])
   .slice(0,4).filter(r=>/^region-[0-2]-[0-2]$/.test(r?.from||'')&&
    /^region-[0-2]-[0-2]$/.test(r?.to||'')&&
    r.from!==r.to&&Number.isFinite(r.count))
   .map(r=>({from:r.from,to:r.to,count:clamp(Math.round(r.count),1,80)}));
  return {...blank,root:data.root,palette:data.palette.map(colour),
   anchors,relations,generation:clamp(Number(data.generation),0,100000),
   retained:clamp(Number(data.retained),0,100000),
   adaptations:clamp(Number(data.adaptations),0,100000)};
 }catch{return blank;}
}
export function saveVisualIdentity(identity){
 if(!identity?.root)return false;
 try{
  localStorage.setItem(IDENTITY_KEY,JSON.stringify(identity));
  return true;
 }catch{return false;}
}
export function measureIdentityPalette(canvas){
 if(!canvas?.getContext||!canvas.width||!canvas.height)return [];
 // Nine regional pigments, measured only from the genuine adopted bitmap.
 // Small fixed readback supports mobile and never stores a full image.
 const w=27,h=18,small=canvasOf(w,h);
 const ctx=small.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,0,0,w,h);
 const px=ctx.getImageData(0,0,w,h).data,colors=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const sum=[0,0,0];let weight=0;
  for(let y=row*6;y<(row+1)*6;y++)
   for(let x=col*9;x<(col+1)*9;x++){
    const i=(y*w+x)*4,r=px[i],g=px[i+1],b=px[i+2],
     chroma=(Math.max(r,g,b)-Math.min(r,g,b))/255,
     importance=.75+chroma*.75;
    for(let j=0;j<3;j++)sum[j]+=px[i+j]*importance;
    weight+=importance;
   }
  colors.push(sum.map(v=>Math.round(v/weight)));
 }
 return colors;
}
function visualForms(canvas){
 return extractVisualObjects(canvas,{max:8})
  .filter(o=>boxOK(o.bbox)&&o.area>=.006&&o.area<=.23&&
   o.bbox.w<=.63&&o.bbox.h<=.68&&o.palette?.length===3)
  .sort((a,b)=>b.area-a.area);
}
function pickAnchors(forms,max=IDENTITY_ANCHORS){
 const selected=[];
 for(const form of forms){
  const c=midpoint(form.bbox);
  if(selected.some(prev=>{
    const p=midpoint(prev.box);
    return Math.hypot(c.x-p.x,c.y-p.y)<.18;
  }))continue;
  selected.push({id:'form-'+selected.length,
   box:{...form.bbox},ink:colour(form.palette),
   age:1,vitality:.67});
  if(selected.length===max)break;
 }
 return selected;
}
export function identitySafeguards(identity){
 return (identity?.anchors||[]).filter(a=>a.vitality>.25).map(a=>({
  bbox:a.box,age:5,volatility:0,stability:.9,
  identity:true,id:a.id
 }));
}
function hashPalette(palette){
 let hash=2166136261>>>0;
 for(const band of palette)for(const v of band){
  hash^=v;hash=Math.imul(hash,16777619)>>>0;
 }
 return hash.toString(36);
}
function updateAnchor(anchor,forms){
 const start=midpoint(anchor.box);
 let best=null,bestFit=0;
 for(const form of forms){
  const pos=midpoint(form.bbox);
  const shift=Math.hypot(start.x-pos.x,start.y-pos.y);
  const chroma=distance(anchor.ink,form.palette);
  const ar=Math.abs(Math.log(form.area/
   Math.max(.00001,anchor.box.w*anchor.box.h)));
  const fit=1-shift*2.8-chroma*.34-ar*.12;
  if(fit>bestFit){best=form;bestFit=fit;}
 }
 if(!best||bestFit<.27)return {...anchor,
  age:anchor.age+1,vitality:round(Math.max(.2,anchor.vitality*.94))};
 // A learned shape cannot teleport across the canvas to a different
 // component; its centre moves at most 1.8% of normalized width per pass.
 const proposed=averageBox(anchor.box,best.bbox,.13),
  before=midpoint(anchor.box),after=midpoint(proposed),
  dx=after.x-before.x,dy=after.y-before.y,
  length=Math.hypot(dx,dy),factor=length>.018?.018/length:1;
 const box={...proposed,x:round(clamp(proposed.x-dx*(1-factor),0,1-proposed.w)),
  y:round(clamp(proposed.y-dy*(1-factor),0,1-proposed.h))};
 return {...anchor,box,ink:average(anchor.ink,colour(best.palette),.16),
  age:anchor.age+1,vitality:round(clamp(anchor.vitality*.82+.18,0,1))};
}
export function adoptVisualIdentity(identity,canvas,{
 generation=0,composition=null
}={}){
 if(!canvas?.getContext)return identity||createVisualIdentity();
 const before=identity?.version===IDENTITY_VERSION?identity:createVisualIdentity();
 const measured=measureIdentityPalette(canvas);
 if(measured.length!==9)return before;
 const first=!before.root,forms=visualForms(canvas);
 let palette=first?measured:before.palette.map((p,i)=>
  average(p,measured[i],.12));
 // Avoid slowly destroying a distinctive palette: the root remembers
 // an acquired constraint and follows actual results with low plasticity.
 const anchors=first?pickAnchors(forms):
  before.anchors.map(a=>updateAnchor(a,forms));
 const oldRelations=(before.relations||[]).map(r=>({...r}));
 if(composition?.accepted&&composition.from&&composition.to){
  const found=oldRelations.find(r=>r.from===composition.from&&
   r.to===composition.to);
  if(found)found.count=Math.min(80,found.count+1);
  else oldRelations.unshift({from:composition.from,
   to:composition.to,count:1});
 }
 const relations=oldRelations.sort((a,b)=>b.count-a.count).slice(0,4);
 return {version:IDENTITY_VERSION,
  root:first?'vision-'+hashPalette(measured):before.root,
  generation:Math.max(before.generation+1,generation),
  palette,anchors,relations,
  retained:before.retained||0,adaptations:before.adaptations||0};
}
function organicClip(ctx,b,seed=0){
 // An elliptical, gently perturbed contour—not a region-grid square.
 // Actual parent pixels remain intact in the extracted real-pixel islands.
 const steps=18,cx=b.x+b.w/2,cy=b.y+b.h/2,
  rx=b.w*.42,ry=b.h*.42;
 ctx.beginPath();
 for(let i=0;i<steps;i++){
  const angle=i/steps*Math.PI*2,
    fluct=1+.052*Math.sin(angle*3+seed*.33);
  const x=cx+Math.cos(angle)*rx*fluct,
    y=cy+Math.sin(angle)*ry*fluct;
  if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.closePath();ctx.clip();
}
export function inheritVisualIdentity(canvas,parent,identity,{
 cycle=0,locked=false,dirtyTiles=null,wordBounds=null,
 onStep=()=>{}
}={}){
 const summary={root:identity?.root||null,forms:0,
  pigmentRegions:0,coverage:0,history:identity?.generation||0};
 // Sparse work and hard explicit laws trump identity pressure.
 if(!canvas?.getContext||!parent?.getContext||!identity?.root||
  locked||Array.isArray(dirtyTiles)&&dirtyTiles.length)return summary;
 const w=canvas.width,h=canvas.height,
  ctx=canvas.getContext('2d');
 let area=0;
 for(const anchor of (identity.anchors||[]).slice(0,IDENTITY_ANCHORS)){
  if(anchor.vitality<.25||!boxOK(anchor.box))continue;
  const b={x:anchor.box.x*w,y:anchor.box.y*h,
   w:anchor.box.w*w,h:anchor.box.h*h};
  if(wordBounds&&Math.max(0,
   Math.min(b.x+b.w,wordBounds.x+wordBounds.w)-
   Math.max(b.x,wordBounds.x))*
   Math.max(0,Math.min(b.y+b.h,wordBounds.y+wordBounds.h)-
   Math.max(b.y,wordBounds.y))>.17*b.w*b.h)continue;
  const pixelArea=b.w*b.h/(w*h);
  if(pixelArea>.13||area+pixelArea*.57>.15)continue;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  organicClip(ctx,b,cycle+anchor.age);
  // Subtle directed location drift is bounded; actual pixels originate
  // in the last adopted frame, NEVER fabricated from a reference label.
  const driftX=Math.sin((cycle+anchor.age)*.7)*Math.min(2,w*.002),
    driftY=Math.cos((cycle+anchor.age)*.7)*Math.min(2,h*.002);
  ctx.globalAlpha=clamp(.42+anchor.vitality*.29,.35,.75);
  ctx.drawImage(parent,driftX,driftY,w,h);ctx.restore();
  summary.forms++;area+=pixelArea*.57;
  onStep({type:'form',id:anchor.id,canvas,root:identity.root});
 }
 // The nine measured pigment zones are distinct: edit only ONE bounded
 // recipient region instead of recolouring the whole artwork uniformly.
 const zones=regionRects(w,h,{grid:3});
 const band=(cycle+(identity.generation||0))%9,target=identity.palette?.[band];
 const zone=zones[band];
 if(zone&&target&&zone.w*zone.h<=w*h*.12){
  const small=canvasOf(1,1),sctx=small.getContext('2d');
  sctx.drawImage(canvas,zone.x,zone.y,zone.w,zone.h,0,0,1,1);
  const measured=sctx.getImageData(0,0,1,1).data,
   mismatch=distance(target,measured);
  if(mismatch>.055){
   const rect=ctx.getImageData(zone.x,zone.y,zone.w,zone.h);
   const data=rect.data, nudges=target.map((t,k)=>
    clamp((t-measured[k])*.115,-11,11));
   const centerX=zone.w*.5,centerY=zone.h*.5;
   for(let y=0;y<zone.h;y++)for(let x=0;x<zone.w;x++){
    const nx=(x-centerX)/centerX,ny=(y-centerY)/centerY;
    const feather=Math.max(0,1-Math.pow(Math.hypot(nx,ny),2));
    if(feather<=0)continue;
    const index=(y*zone.w+x)*4,
     chroma=(Math.max(data[index],data[index+1],data[index+2])-
      Math.min(data[index],data[index+1],data[index+2]))/255;
    // Higher chroma regions retain more individual pigment.
    for(let k=0;k<3;k++)data[index+k]=
      clamp(Math.round(data[index+k]+nudges[k]*feather*(.9-chroma*.35)),0,255);
   }
   ctx.putImageData(rect,zone.x,zone.y);
   summary.pigmentRegions=1;
   onStep({type:'pigment',id:zone.id,canvas,root:identity.root});
  }
 }
 summary.coverage=round(area);
 return summary;
}
