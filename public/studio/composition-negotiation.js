/* HEXFIELD 324 — Composition-wide negotiation.
 * Real nearby visual regions propose, compare and vote on a bounded change.
 * One region's actual pigment/geometry can influence another while stable
 * objects, sparse untouched tiles and other regions remain intact.
 */
import {regionRects,scoreRegion} from './regional-judgement.js';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
const phi=(1+Math.sqrt(5))/2;
const goldenMinor=1/(phi*phi);
export const MAX_NEGOTIATED_PATCHES=1;
export const COMPOSITION_MEMORY_KEY='hexfield.composition-treaties.324';
const fresh=(w,h)=>{
 const c=document.createElement('canvas');c.width=w;c.height=h;return c;
};
const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
 Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
const adjacent=(a,b)=>Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1;
const same=(a,b)=>a?.id===b?.id;
const round=n=>+n.toFixed(5);
function describe(canvas,rect){
 const w=18,h=12,c=fresh(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,rect.x,rect.y,rect.w,rect.h,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h).data;
 let rr=0,gg=0,bb=0,weight=0,edges=0;
 let edgeX=0,edgeY=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];
  const chroma=(Math.max(r,g,b)-Math.min(r,g,b))/255;
  const value=.34+chroma*1.9;
  rr+=r*value;gg+=g*value;bb+=b*value;weight+=value;
  if(x&&y){
   const li=(y*w+x-1)*4,up=((y-1)*w+x)*4;
   const dx=(r-data[li])*.213+(g-data[li+1])*.715+
    (b-data[li+2])*.072;
   const dy=(r-data[up])*.213+(g-data[up+1])*.715+
    (b-data[up+2])*.072;
   const magnitude=Math.hypot(dx,dy)/255;
   edges+=magnitude;
   edgeX+=dx/255;edgeY+=dy/255;
  }
 }
 return {rect,palette:[rr/weight,gg/weight,bb/weight],
  edges:clamp(edges/(w*h)*4,0,1),
  edgeAngle:Math.atan2(edgeY,edgeX),
  chroma:clamp((Math.max(rr,gg,bb)-Math.min(rr,gg,bb))/weight/255,0,1)};
}
export function pairCoherence(a,b){
 const diff=Math.hypot(...a.palette.map((v,i)=>v-b.palette[i]))/
  (255*Math.sqrt(3));
 // Golden minor measures the desired nonzero relationship in pigments.
 // Full uniformity is deliberately penalized, not rewarded.
 const colour=clamp(1-Math.abs(diff-goldenMinor*.68)/.48,0,1);
 const low=Math.min(a.edges,b.edges),high=Math.max(a.edges,b.edges);
 const edgeRatio=high<.025?.5:low/high;
 const geometry=clamp(1-Math.abs(edgeRatio-goldenMinor)/.65,0,1);
 const direction=Math.abs(Math.atan2(Math.sin(a.edgeAngle-b.edgeAngle),
  Math.cos(a.edgeAngle-b.edgeAngle)));
 const goldenAngle=Math.PI*(1-goldenMinor);
 const relation=clamp(1-Math.abs(direction-goldenAngle)/Math.PI,0,1);
 return {score:round(colour*.48+geometry*.33+relation*.19),
  colour:round(colour),geometry:round(geometry),relation:round(relation),
  pigmentDifference:round(diff),edgeRatio:round(edgeRatio)};
}
export function selectNegotiation({canvas,memory,compositionMemory=null,
 objects=[],cycle=0,attempt=0,dirtyTiles=null,locked=false}={}){
 if(!canvas?.getContext||locked||
   Array.isArray(dirtyTiles)&&dirtyTiles.length)return null;
 const regions=regionRects(canvas.width,canvas.height,{grid:3}),
  descriptions=regions.map(r=>describe(canvas,r));
 const safe=region=>!objects.some(o=>{
  if((o.age||0)<3||(o.volatility??1)>=.24||!o.bbox)return false;
  const b={x:o.bbox.x*canvas.width,y:o.bbox.y*canvas.height,
   w:o.bbox.w*canvas.width,h:o.bbox.h*canvas.height};
  return overlap(b,region)>region.w*region.h*.22;
 });
 const ranked=[];
 for(const follower of descriptions){
  if(!safe(follower.rect))continue;
  const history=memory?.cells?.[follower.rect.id]||{};
  for(const leader of descriptions){
   if(!adjacent(leader.rect,follower.rect))continue;
   const sourceHistory=memory?.cells?.[leader.rect.id]||{};
   const self=pairCoherence(leader,follower);
   const leadership=(sourceHistory.quality??.5)*.65+
     (sourceHistory.stability??0)*.35;
   const need=(1-(history.quality??.5))*.58+
     (1-(history.stability??0))*.42;
   const previous=compositionMemory?.treaties?.[follower.rect.id];
   const antiLoop=previous?.from===leader.rect.id?
     Math.min(.16,(previous.count||0)*.035):0;
   const priority=need*.52+leadership*.3+
     (1-self.score)*.18-antiLoop+
     ((cycle*7+attempt*11+follower.rect.row*3+leader.rect.column)%13)*.00001;
   ranked.push({leader,follower,score:priority,
    pair:self,leadership,need});
  }
 }
 ranked.sort((a,b)=>b.score-a.score||
  a.follower.rect.id.localeCompare(b.follower.rect.id));
 return ranked[0]||null;
}
export function createCompositionMemory(){
 return {version:1,generation:0,treaties:{},history:[]};
}
export function loadCompositionMemory(){
 const blank=createCompositionMemory();
 try{
  const saved=JSON.parse(localStorage.getItem(COMPOSITION_MEMORY_KEY)||'null');
  if(saved?.version!==1||!saved.treaties||typeof saved.treaties!=='object')
   return blank;
  for(const [id,t] of Object.entries(saved.treaties)){
   if(!/^region-[0-2]-[0-2]$/.test(id)||
     !/^region-[0-2]-[0-2]$/.test(t?.from||''))continue;
   blank.treaties[id]={from:t.from,count:clamp(t.count|0,0,200),
    acceptance:clamp(+t.acceptance,0,1)};
  }
  blank.generation=clamp(saved.generation|0,0,500000);
  if(Array.isArray(saved.history))blank.history=saved.history.slice(-8)
   .filter(x=>x&&typeof x.from==='string'&&typeof x.to==='string')
   .map(x=>({from:x.from,to:x.to,accepted:!!x.accepted,
    score:clamp(+x.score,0,1)}));
 }catch{}
 return blank;
}
export function saveCompositionMemory(memory){
 try{localStorage.setItem(COMPOSITION_MEMORY_KEY,JSON.stringify(memory));
  return true;}catch{return false;}
}
export function updateCompositionMemory(memory,decision,generation){
 const next={version:1,generation,
  treaties:{...(memory?.treaties||{})},
  history:(memory?.history||[]).slice(-7)};
 if(!decision)return next;
 const {from,to,accepted}=decision,old=next.treaties[to];
 if(accepted){
  next.treaties[to]={from,
   count:old?.from===from?clamp(old.count+1,0,200):1,
   acceptance:clamp((old?.acceptance??.5)*.5+.5,0,1)};
 }else if(old){
  next.treaties[to]={...old,acceptance:clamp(old.acceptance*.92,0,1)};
 }
 next.history.push({from,to,accepted,score:decision.after?.score||0});
 return next;
}
export function proposeInfluence(canvas,leader,follower,{seed=0,
 strength=.21}={}){
 const rect=follower.rect,w=rect.w,h=rect.h,patch=fresh(w,h),
  target=patch.getContext('2d',{willReadFrequently:true});
 target.drawImage(canvas,rect.x,rect.y,w,h,0,0,w,h);
 const src=target.getImageData(0,0,w,h),out=target.createImageData(w,h);
 const data=src.data,result=out.data;
 const sourcePalette=leader.palette;
 const vx=leader.rect.column-follower.rect.column,
  vy=leader.rect.row-follower.rect.row;
 let moved=0,pigment=0;
 const phase=((seed>>>0)%157)/157*Math.PI*2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,localX=x/w,localY=y/h;
  const ax=(localX-.5)*2,ay=(localY-.5)*2,
   radial=Math.max(0,1-ax*ax*.78-ay*ay*.78);
  const mass=Math.pow(radial,.67);
  const phiWave=.65+.35*Math.sin(
   (localX*phi+localY/phi)*Math.PI*3+phase)**2;
  const power=clamp(strength,0,.27)*mass*phiWave;
  const contrast=Math.abs(data[i]-data[Math.max(0,i-4)])+
    Math.abs(data[i+1]-data[Math.max(0,i-4)+1]);
  const displacement=contrast>28?Math.round((2+Math.min(3,contrast/70))*
   mass):0;
  const srcX=clamp(x-vx*displacement,0,w-1),
   srcY=clamp(y-vy*displacement,0,h-1),si=(srcY*w+srcX)*4;
  moved+=displacement>0?1:0;
  for(let k=0;k<3;k++){
   const original=data[si+k],proposed=original*(1-power)+
    sourcePalette[k]*power;
   result[i+k]=Math.round(clamp(proposed,0,255));
   pigment+=Math.abs(result[i+k]-data[i+k]);
  }
  result[i+3]=data[i+3];
 }
 target.putImageData(out,0,0);
 return {patch,coverage:round(pigment/(w*h*765)),
  displaced:moved,palette:[...sourcePalette]};
}
function trialCanvas(canvas,rect,patch){
 const candidate=fresh(canvas.width,canvas.height),
  ctx=candidate.getContext('2d');
 ctx.drawImage(canvas,0,0);
 ctx.drawImage(patch,0,0,rect.w,rect.h,rect.x,rect.y,rect.w,rect.h);
 return candidate;
}
export function negotiateComposition({canvas,parent=null,memory,
 compositionMemory=createCompositionMemory(),objects=[],cycle=0,
 attempt=0,dirtyTiles=null,locked=false,onDecision=()=>{},
 makeInfluence=proposeInfluence,threshold=.003,grade=scoreRegion}={}){
 const option=selectNegotiation({canvas,memory,compositionMemory,
  objects,cycle,attempt,dirtyTiles,locked});
 if(!option)return {attempts:0,accepted:0,decision:null};
 const {leader,follower}=option,rect=follower.rect;
 const influence=makeInfluence(canvas,leader,follower,{
  seed:((cycle+1)*1337+(attempt+1)*739)|0
 });
 if(!influence?.patch)return {attempts:0,accepted:0,decision:null};
 const before=pairCoherence(leader,follower);
 const next=trialCanvas(canvas,rect,influence.patch);
 const descriptors=regionRects(canvas.width,canvas.height,{grid:3})
  .filter(r=>adjacent(r,rect))
  .map(r=>({region:r,old:describe(canvas,r)}));
 const now=describe(next,rect);
 const neighbors=descriptors.map(({region,old})=>{
  const initial=pairCoherence(old,follower),
    changed=pairCoherence(old,now);
  const vote=changed.score-initial.score;
  const voter=memory?.cells?.[region.id]||{};
  return {id:region.id,vote:round(vote),
   weight:round(.65+(voter.quality??.5)*.5+
    (voter.stability??0)*.15),support:vote>=-.001};
 });
 const after=pairCoherence(leader,now);
 const qualityBefore=grade(canvas,rect,{parent,
  stability:memory?.cells?.[rect.id]?.stability||0});
 const qualityAfter=grade(next,rect,{parent,
  stability:memory?.cells?.[rect.id]?.stability||0});
 const weightedVote=neighbors.reduce((sum,v)=>sum+v.vote*v.weight,0)/
  Math.max(1,neighbors.reduce((sum,v)=>sum+v.weight,0));
 const localLoss=qualityAfter.score-qualityBefore.score;
 const nonuniform=after.pigmentDifference>.08;
 const support=neighbors.filter(v=>v.support).length,
  opposition=neighbors.length-support;
 // There must be a measurable actual change, adequate independent local
 // quality, and a net positive reaction across adjacent visual districts.
 const accepted=influence.coverage>.002&&nonuniform&&
  localLoss>=-.035&&
  (weightedVote>.004||
    weightedVote>threshold*.20&&after.score>before.score+.008)&&
  support>=Math.ceil(neighbors.length/2);
 if(accepted){
  const ctx=canvas.getContext('2d');
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;
  ctx.drawImage(influence.patch,0,0,rect.w,rect.h,
   rect.x,rect.y,rect.w,rect.h);
  ctx.restore();
 }
 const decision={from:leader.rect.id,to:rect.id,
  accepted,method:'pigment echo + guided contour drift',
  before,after,localLoss:round(localLoss),neighborhood:neighbors,
  supporters:support,opponents:opposition,
  vote:round(weightedVote),coverage:influence.coverage,
  displaced:influence.displaced,palette:influence.palette,
  rect};
 onDecision(decision,canvas);
 return {attempts:1,accepted:accepted?1:0,decision};
}
