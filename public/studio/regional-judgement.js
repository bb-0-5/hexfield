/* HEXFIELD 323 / Local self-correction inside each evolving candidate.
 * Each spatial region tests a genuinely different executed brush law,
 * compares REAL painted pixels, and autonomously keeps or rejects the change.
 * Decisions are local, memory-bearing, bounded, and happen BEFORE global
 * W / phi / H judging. Never fabricate a score or repaint outside the patch.
 */
import {applyRules,MARKS} from './rule-engine.js';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const SHAPES=['hybrid','hatch','dots','cutout','dashes','carve','invented'];
export const REGION_GRID=3;
export const MAX_REGIONAL_REVIEWS=2;
const fresh=(w,h)=>{
 const c=document.createElement('canvas');c.width=w;c.height=h;return c;
};
function intersect(a,b){
 return Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
   Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
}
export function regionRects(width,height,{grid=REGION_GRID}={}){
 const n=clamp(Math.round(grid),2,4),rects=[];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const x0=Math.floor(width*x/n),x1=Math.floor(width*(x+1)/n),
    y0=Math.floor(height*y/n),y1=Math.floor(height*(y+1)/n);
  if(x1>x0&&y1>y0)rects.push({
   id:'region-'+x+'-'+y,x:x0,y:y0,w:x1-x0,h:y1-y0,
   column:x,row:y
  });
 }
 return rects;
}
export function createRegionMemory({grid=REGION_GRID}={}){
 const n=clamp(Math.round(grid),2,4);
 return {grid:n,generation:0,cells:Object.fromEntries(
  regionRects(n*120,n*120,{grid:n}).map(({id})=>
   [id,{id,age:0,kept:0,revised:0,lastSeen:-1,lastRevision:-1,
    quality:.5,mark:null,stability:0}]))};
}
export function selectReviewRegions({width,height,cycle=0,attempt=0,
 memory=createRegionMemory(),objects=[],maxReviews=MAX_REGIONAL_REVIEWS,
 dirtyTiles=null}={}){
 // The sparse renderer has already protected unchanged areas. Never
 // invalidate that proof by staging a second large regional repaint.
 if(Array.isArray(dirtyTiles)&&dirtyTiles.length)return [];
 const regions=regionRects(width,height,{grid:memory.grid||REGION_GRID});
 const safe=regions.filter(r=>{
  const area=r.w*r.h;
  for(const object of objects){
   if((object?.age||0)<3||(object?.volatility??1)>=.24||!object.bbox)continue;
   const b={x:object.bbox.x*width,y:object.bbox.y*height,
    w:object.bbox.w*width,h:object.bbox.h*height};
   if(intersect(r,b)/area>.29)return false;
  }
  return true;
 });
 const offset=(Math.imul(cycle+1,5)+Math.imul(attempt+1,3))>>>0;
 return safe.sort((a,b)=>{
  const score=r=>{
   const m=memory.cells?.[r.id]||{};
   const recency=Math.max(0,cycle-(m.lastSeen??-1));
   const uncertainty=1-(m.stability||0);
   const revisit=clamp(recency/5,0,1);
   // Region ages and separate scores create independent tempos:
   // trustworthy neighbourhoods rest, uncertain ones re-evaluate.
   return uncertainty*.48+revisit*.38+
     (1-(m.quality??.5))*.12+
     ((offset+r.row*11+r.column*19)%17)*.0001;
  };
  return score(b)-score(a);
 }).slice(0,Math.max(0,Math.min(MAX_REGIONAL_REVIEWS,maxReviews|0)));
}
function raster(canvas,rect,w=18,h=12){
 const c=fresh(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,rect.x,rect.y,rect.w,rect.h,0,0,w,h);
 return ctx.getImageData(0,0,w,h).data;
}
export function scoreRegion(canvas,rect,{parent=null,stability=0}={}){
 const w=18,h=12,p=raster(canvas,rect,w,h),
  old=parent?.getContext?raster(parent,rect,w,h):null;
 let novelty=0,edges=0,colour=0,coupling=0,spread=0;
 let edgeSum=0,edgeX=0,edgeY=0;
 const palette=new Set();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  const r=p[i],g=p[i+1],b=p[i+2],max=Math.max(r,g,b),
    min=Math.min(r,g,b),chroma=(max-min)/255;
  colour+=chroma;palette.add([r>>6,g>>6,b>>6].join(''));
  if(old)novelty+=(
    Math.abs(r-old[i])+Math.abs(g-old[i+1])+
    Math.abs(b-old[i+2]))/765;
  if(x&&y){
   const lx=((y*w+x-1)*4),up=((y-1)*w+x)*4,
    contrast=(Math.abs(r-p[lx])+Math.abs(g-p[lx+1])+
      Math.abs(b-p[lx+2])+Math.abs(r-p[up])+
      Math.abs(g-p[up+1])+Math.abs(b-p[up+2]))/1530;
   const strength=clamp(contrast*3,0,1);
   edges+=strength;coupling+=strength*chroma;
   edgeSum+=strength;edgeX+=strength*x/w;edgeY+=strength*y/h;
  }
 }
 const n=w*h,variation=old?novelty/n:.26,
  complexity=clamp(edges/(n*.4),0,1),
  chroma=clamp(colour/n,0,1),
  diversity=clamp(palette.size/24,0,1);
 const cx=edgeSum?edgeX/edgeSum:.5,cy=edgeSum?edgeY/edgeSum:.5,
  phi=(1+Math.sqrt(5))/2,minor=1/(phi*phi),major=1-minor,
  distance=v=>Math.min(Math.abs(v-minor),Math.abs(v-major)),
  geometry=clamp(1-(distance(cx)+distance(cy))*1.5,0,1);
 // A region with nothing happening isn't beautiful simply because
 // it resembles the previous painting. Excess visual violence is penalized.
 const W=clamp(1-Math.abs(variation-.26)/.43,0,1);
 const H=old?clamp(1-Math.abs(variation-.20)/.65,0,1):.6;
 const phiScore=clamp(geometry*.45+chroma*.17+
   diversity*.20+clamp(coupling/(n*.17),0,1)*.18,0,1);
 const beauty=clamp(.23*W+.20*H+.31*phiScore+.26*complexity,0,1);
 const score=clamp(beauty-
   Math.max(0,stability-.72)*Math.max(0,variation-.25)*.33,0,1);
 return {score:+score.toFixed(5),W:+W.toFixed(5),
  phi:+phiScore.toFixed(5),H:+H.toFixed(5),
  complexity:+complexity.toFixed(5),
  delta:+variation.toFixed(5),palette:palette.size};
}
export function alternativeRegionalMark(recipe,{cycle=0,attempt=0,region}={}){
 const base=SHAPES.indexOf(recipe?.mark);
 const candidates=SHAPES.filter(mark=>mark!==recipe?.mark&&mark in MARKS);
 return candidates[(Math.imul(cycle+1,7)+Math.imul(attempt+1,5)+
   (region?.row||0)*3+(region?.column||0)*11+(base+1))%candidates.length];
}
export function updateRegionMemory(memory,decisions=[],generation=0){
 const clone={grid:memory.grid||REGION_GRID,generation,
  cells:Object.fromEntries(Object.entries(memory.cells||{}).map(
   ([id,m])=>[id,{...m}]))};
 const visited=new Set();
 for(const decision of decisions){
  const id=decision.region?.id;if(!id||visited.has(id))continue;
  visited.add(id);
  const old=clone.cells[id]||{id,age:0,kept:0,revised:0,
   stability:0,quality:.5,lastSeen:-1,lastRevision:-1,mark:null};
  const revised=decision.verdict==='REWORK',
    age=old.age+1,
    stability=clamp((old.stability||0)*.62+
      (revised?.08:.29),0,1);
  clone.cells[id]={...old,age,kept:old.kept+(revised?0:1),
   revised:old.revised+(revised?1:0),
   stability,lastSeen:generation,
   lastRevision:revised?generation:old.lastRevision,
   mark:revised?decision.mark:old.mark,
   quality:clamp((old.quality||.5)*.33+
     (decision.selected?.score??.5)*.67,0,1)};
 }
 return clone;
}
export function auditRegions({
 canvas,source,parent=null,recipe,cycle=0,attempt=0,
 memory=createRegionMemory(),objects=[],dirtyTiles=null,
 maxReviews=MAX_REGIONAL_REVIEWS,threshold=.028,
 renderAlternative=null,grade=scoreRegion,onDecision=()=>{}
}={}){
 if(!canvas?.getContext||!source?.getContext||!recipe)
  return {decisions:[],reviews:0,revisions:0,kept:0};
 const chosen=selectReviewRegions({width:canvas.width,height:canvas.height,
  cycle,attempt,memory,objects,dirtyTiles,maxReviews});
 const decisions=[];
 for(const region of chosen){
  const remembered=memory.cells?.[region.id]||{};
  const mark=alternativeRegionalMark(recipe,{cycle,attempt,region});
  const criterion={parent,stability:remembered.stability||0};
  const baseline=grade(canvas,region,criterion);
  // The alternate IS executed against the actual full-size mixer source,
  // but only the audited 1/9 patch is allowed to change.
  const trial=renderAlternative?
   renderAlternative({canvas,source,recipe,region,mark,cycle,attempt}):
   (()=>{const output=fresh(canvas.width,canvas.height);
    const mutated={...recipe,mark};
    applyRules(source,output,mutated,{
     iteration:cycle+attempt+1,trace:false,
     localApplication:true,baseCanvas:canvas,dirtyTiles:[region]});
    return output;})();
  if(!trial?.getContext||trial.width!==canvas.width||
    trial.height!==canvas.height)continue;
  const challenger=grade(trial,region,criterion);
  const improvement=challenger.score-baseline.score;
  const revised=improvement>threshold;
  if(revised){
   const ctx=canvas.getContext('2d');
   // Exactly one native-resolution patch changes; other spatial identities,
   // including persistent glyphs, remain untouched.
   ctx.save();ctx.setTransform(1,0,0,1,0,0);
   ctx.globalAlpha=1;
   ctx.drawImage(trial,region.x,region.y,region.w,region.h,
     region.x,region.y,region.w,region.h);
   ctx.restore();
  }
  const verdict=revised?'REWORK':'KEEP';
  const decision={region,mark,verdict,baseline,challenger,
   selected:revised?challenger:baseline,
   improvement:+improvement.toFixed(5),priorAge:remembered.age||0};
  decisions.push(decision);
  onDecision(decision,canvas);
 }
 return {decisions,reviews:decisions.length,
  revisions:decisions.filter(d=>d.verdict==='REWORK').length,
  kept:decisions.filter(d=>d.verdict==='KEEP').length};
}
