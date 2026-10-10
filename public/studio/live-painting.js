/* HEXFIELD 320 — the ONE production canvas is a living process.
 * A candidate sketch is actual renderer output; construction patches copy
 * ONLY authentic pixels from the accepted, evaluated full painting.
 * No opaque theatre, fabricated brushes, or secondary visible canvas.
 */
export const CONSTRUCTION_TILE=32;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number(n)||0));
const centerInside=(box,x,y)=>!!box&&x>=box.x&&y>=box.y&&
 x<box.x+box.w&&y<box.y+box.h;
const parseBounds=(b,w,h)=>{
 if(!b)return null;
 return {x:b.x*w,y:b.y*h,w:b.w*w,h:b.h*h};
};
function tileKey(x,y){return x+':'+y;}
function markXY(mark){
 if(!mark||!Number.isFinite(mark.x)||!Number.isFinite(mark.y))return null;
 return {x:mark.x,y:mark.y};
}
export function constructionPlan({width,height,parent=null,final=null,
 trace=null,wordBounds=null,objects=[],dirtyTiles=null,tile=CONSTRUCTION_TILE}={}){
 const w=Math.max(1,Math.round(width||final?.width||0));
 const h=Math.max(1,Math.round(height||final?.height||0));
 const step=Math.round(clamp(tile,16,96));
 const columns=Math.ceil(w/step),rows=Math.ceil(h/step);
 const marks=Array.isArray(trace?.marks)?trace.marks:[];
 const markCells=new Map();
 for(const mark of marks){
  const point=markXY(mark);if(!point)continue;
  const x=Math.floor(point.x/step),y=Math.floor(point.y/step);
  if(x<0||y<0||x>=columns||y>=rows)continue;
  const key=tileKey(x,y);
  markCells.set(key,(markCells.get(key)||0)+1);
 }
 const preserved=(objects||[]).filter(o=>o?.bbox&&o.age>=3&&
   o.volatility<.3).map(o=>parseBounds(o.bbox,w,h));
 const changedOnly=Array.isArray(dirtyTiles)&&dirtyTiles.length>0;
 const samples=parent?.getContext&&final?.getContext?
  sampleSceneDelta(parent,final,columns,rows):null;
 const tiles=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=col*step,y=row*step,
   tw=Math.min(step,w-x),th=Math.min(step,h-y),
   cx=x+tw*.5,cy=y+th*.5;
  // Dirty-only reworks need not recopy the 80% of the canvas known to be
  // unchanged. Every other pass still covers its entire exact pixel surface.
  if(changedOnly&&!dirtyTiles.some(t=>x<t.x+t.w&&x+tw>t.x&&
    y<t.y+t.h&&y+th>t.y))continue;
  const markHits=markCells.get(tileKey(col,row))||0;
  const word=centerInside(wordBounds,cx,cy);
  const inherited=preserved.some(b=>centerInside(b,cx,cy));
  const delta=samples?.[row*columns+col]??1;
  // Ink appears in genuinely executed mark locations early. Inherited
  // objects live longer. Letter anatomy is constructed last, not erased by
  // a subsequent scene repaint. Stable sort breaks ties deterministically.
  const order=(word?120:0)+(inherited?70:0)-
    Math.min(8,markHits)*11-Math.round(delta*24)+
    ((col*17+row*11)%23)*.12;
  tiles.push({x,y,w:tw,h:th,order,markHits,
    word,inherited,delta:+delta.toFixed(3)});
 }
 tiles.sort((a,b)=>a.order-b.order||
   a.y-b.y||a.x-b.x);
 return {width:w,height:h,tile:step,tiles,total:tiles.length,
   totalCanvasTiles:columns*rows,
   skipped:columns*rows-tiles.length,
   marks:marks.length,
   inherited:tiles.filter(t=>t.inherited).length,
   lettering:tiles.filter(t=>t.word).length,
   dirty:changedOnly};
}
function sampleSceneDelta(parent,final,w,h){
 try{
  const a=document.createElement('canvas'),
    b=document.createElement('canvas');
  a.width=b.width=w;a.height=b.height=h;
  const ac=a.getContext('2d',{willReadFrequently:true}),
    bc=b.getContext('2d',{willReadFrequently:true});
  ac.drawImage(parent,0,0,w,h);bc.drawImage(final,0,0,w,h);
  const ad=ac.getImageData(0,0,w,h).data,
    bd=bc.getImageData(0,0,w,h).data;
  const result=new Float32Array(w*h);
  for(let p=0;p<w*h;p++){
   const i=p*4;
   result[p]=(Math.abs(ad[i]-bd[i])+
     Math.abs(ad[i+1]-bd[i+1])+
     Math.abs(ad[i+2]-bd[i+2]))/765;
  }
  return result;
 }catch{return null;}
}
export function paintConstructionSlice(canvas,final,tiles,start,end){
 if(!canvas?.getContext||!final?.getContext)return 0;
 const ctx=canvas.getContext('2d');
 let count=0;
 for(let index=start;index<Math.min(tiles.length,end);index++){
  const t=tiles[index];if(!t)continue;
  // Draw the exact FINAL rectangle without resampling; no invented brush
  // may corrupt accepted pixels, colour constraints or export.
  ctx.drawImage(final,t.x,t.y,t.w,t.h,t.x,t.y,t.w,t.h);
  count++;
 }
 return count;
}
export function createLivingPainting({
 canvas,onPhase=()=>{},clock=()=>performance.now(),
 requestFrame=cb=>requestAnimationFrame(cb),
 cancelFrame=id=>cancelAnimationFrame(id),
 reducedMotion=()=>!!globalThis.matchMedia?.
   ('(prefers-reduced-motion: reduce)')?.matches
}={}){
 if(!canvas?.getContext)throw Error('A visible production canvas is required');
 let sequence=0,raf=0,active=null,stats={phase:'idle',done:0,total:0};
 const ctx=canvas.getContext('2d');
 const exact=source=>{
  if(!source?.width)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(source,0,0,canvas.width,canvas.height);
  ctx.restore();
 };
 function stop({finalize=true}={}){
  sequence++;
  if(raf){cancelFrame(raf);raf=0;}
  if(active){
   if(finalize)exact(active.final);
   active=null;
  }
  stats={...stats,phase:'idle'};
 }
 function preview({painting,parent=null,trial=0,total=3}={}){
  stop({finalize:false});
  if(!painting?.width)return;
  exact(parent||painting);
  // Actual evaluated low-res sketch is shown directly in the same canvas,
  // while residual old form remains visible under the painter's sketch.
  ctx.save();ctx.globalAlpha=parent?.width?.72:1;
  ctx.drawImage(painting,0,0,canvas.width,canvas.height);
  ctx.restore();
  stats={phase:'sketch',done:trial+1,total,tiles:0};
  onPhase({...stats});
 }
 function commit({parent=null,final=null,trace=null,wordBounds=null,
  objects=[],dirtyTiles=null,duration=1350}={}){
  stop({finalize:false});
  if(!final?.width)return Promise.resolve({reason:'missing final'});
  const plan=constructionPlan({width:canvas.width,height:canvas.height,
   parent,final,trace,wordBounds,objects,dirtyTiles});
  const my=sequence;
  if(reducedMotion()||typeof document!=='undefined'&&document.hidden||
    !plan.total){
   exact(final);
   stats={phase:'complete',done:plan.total,total:plan.total,tiles:plan.total};
   onPhase({...stats});
   return Promise.resolve({reason:'instant',plan});
  }
  exact(parent||final);
  const begin=clock();
  const targetMs=clamp(duration,240,4500);
  return new Promise(resolve=>{
   active={final,resolve,plan};
   const frame=now=>{
    if(my!==sequence||!active)return;
    const progress=clamp((now-begin)/targetMs,0,1);
    // Prioritize actual changed material without fragmenting into so many
    // slow RAF callbacks that the automatic painting falls behind.
    const desired=Math.min(plan.total,Math.max(1,
      Math.ceil(plan.total*(progress<1?
        progress*progress*(3-2*progress):1))));
    const done=stats.phase==='construct'?stats.done:0;
    paintConstructionSlice(canvas,final,plan.tiles,done,desired);
    stats={phase:'construct',done:desired,total:plan.total,
      tiles:plan.total,markHits:plan.marks,
      inherited:plan.inherited,lettering:plan.lettering,
      skipped:plan.skipped};
    if(desired!==done)onPhase({...stats});
    if(progress>=1){
     // An exact full-frame final copy fixes colour interpolation and any
     // global effect not localizable by the trace/word/object heuristics.
     exact(final);
     stats={...stats,phase:'complete',done:plan.total};
     active=null;raf=0;
     onPhase({...stats});
     resolve({reason:'completed',plan});
    }else raf=requestFrame(frame);
   };
   stats={phase:'construct',done:0,total:plan.total,tiles:plan.total};
   onPhase({...stats});
   raf=requestFrame(frame);
  });
 }
 return {preview,commit,stop,getState:()=>({...stats})};
}
