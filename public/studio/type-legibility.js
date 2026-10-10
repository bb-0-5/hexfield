/* HEXFIELD 333 — evidence from the actual glyph-mask pixels.
 * No OCR or network classifier: structure, surviving counters, separation
 * and foreground coverage are measured before a painting can be selected.
 */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const round=n=>+clamp(n).toFixed(4);
const isInk=(arr,w,x,y)=>arr[y*w+x]>=120;
const COUNTERS=new Set([...'ABDOPQR0689abdegopq@']);
/* Sample just a tiny binary grid. Flood-fill white pixels connected to
 * its boundary; remaining white islands are actual enclosed counters.
 * Use the reference font's topology, not the character's assumed shape.
 */
function holes(mask,w,h,part){
 const cols=30,rows=34;
 const x0=Math.max(0,Math.floor(part.x0)-2),
   x1=Math.min(w,Math.ceil(part.x1)+2),
   y0=Math.max(0,Math.floor(part.top)-2),
   y1=Math.min(h,Math.ceil(part.bottom)+2);
 if(x1-x0<6||y1-y0<6)return 0;
 const field=new Uint8Array(cols*rows),visited=new Uint8Array(cols*rows);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=Math.min(w-1,Math.floor(x0+(i+.5)*(x1-x0)/cols));
  const y=Math.min(h-1,Math.floor(y0+(j+.5)*(y1-y0)/rows));
  field[j*cols+i]=isInk(mask,w,x,y)?1:0;
 }
 let count=0,queue=new Int32Array(cols*rows);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const index=j*cols+i;
  if(field[index]||visited[index])continue;
  let n=0,head=0,border=false;
  queue[n++]=index;visited[index]=1;
  while(head<n){
   const q=queue[head++],x=q%cols,y=Math.floor(q/cols);
   if(x===0||y===0||x===cols-1||y===rows-1)border=true;
   const neighbors=[x>0?q-1:-1,x<cols-1?q+1:-1,
     y>0?q-cols:-1,y<rows-1?q+cols:-1];
   for(const next of neighbors){
    if(next>=0&&!field[next]&&!visited[next]){
     visited[next]=1;queue[n++]=next;
    }
   }
  }
  // Ignore isolated one-pixel antialias holes that aren't a counter.
  if(!border&&n>=3)count++;
 }
 return count;
}
export function assessGlyphMask(reference,painted,w,h,parts=[]){
 if(reference?.length!==w*h||painted?.length!==w*h||
  !Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)
  throw Error('Glyph assessment requires matching full-size masks');
 let glyphs=0,recallSum=0,weightSum=0,minShape=1,
   counterCount=0,counterScore=0,separation=0,gaps=0;
 const step=Math.max(1,Math.floor(Math.min(w,h)/360));
 for(const part of parts){
  if(!part?.char||!part.char.trim())continue;
  const lo=Math.max(0,Math.floor(part.x0)),
    hi=Math.min(w,Math.ceil(part.x1)),
    top=Math.max(0,Math.floor(part.top)),
    bottom=Math.min(h,Math.ceil(part.bottom));
  if(hi<=lo||bottom<=top)continue;
  let base=0,now=0,survived=0;
  for(let y=top;y<bottom;y+=step)
   for(let x=lo;x<hi;x+=step){
    const a=isInk(reference,w,x,y),b=isInk(painted,w,x,y);
    base+=a?1:0;now+=b?1:0;survived+=a&&b?1:0;
   }
  if(base<2)continue;
  const recall=survived/base,
    inkMass=Math.min(base,now)/Math.max(1,base,now),
    shape=clamp(.65*recall+.35*inkMass);
  recallSum+=shape;weightSum+=recall;
  minShape=Math.min(minShape,shape);glyphs++;
  if(COUNTERS.has(part.char)){
   const known=holes(reference,w,h,part);
   if(known){
    counterCount++;
    counterScore+=Math.min(1,holes(painted,w,h,part)/known);
   }
  }
 }
 for(let i=0;i<parts.length-1;i++){
  const a=parts[i],b=parts[i+1];
  if(!a?.char?.trim()||!b?.char?.trim())continue;
  const gap=b.x0-a.x1;
  if(gap<2)continue;
  const x=Math.max(0,Math.min(w-1,Math.round((a.x1+b.x0)/2)));
  const top=Math.max(0,Math.floor(Math.max(a.top,b.top)));
  const bottom=Math.min(h,Math.ceil(Math.min(a.bottom,b.bottom)));
  let ref=0,out=0,total=0;
  for(let y=top;y<bottom;y+=step){
   ref+=isInk(reference,w,x,y)?1:0;
   out+=isInk(painted,w,x,y)?1:0;total++;
  }
  if(total&&ref/total<.16){
   // Compare only clean reference gaps; ornaments do not count as glyphs.
   separation+=clamp(1-Math.max(0,out/total-.10)*2.3);
   gaps++;
  }
 }
 const shape=glyphs?recallSum/glyphs:1,
  counters=counterCount?counterScore/counterCount:1,
  spacing=gaps?separation/gaps:1,
  score=.52*shape+.28*counters+.20*spacing;
 return {score:round(score),shape:round(shape),minShape:round(minShape),
  counters:round(counters),spacing:round(spacing),
  glyphs,countersTested:counterCount,gapsTested:gaps,
  readable:!!glyphs&&score>=.72&&minShape>=.52&&
   counters>=.75&&spacing>=.60,
  unassessed:!glyphs};
}
/** A balanced aesthetic winner cannot sacrifice readable copy to a
 * small novelty improvement. This only switches among ALREADY rendered
 * full-resolution candidates and honours strict golden qualification.
 */
export function protectReadableWinner(ranked,selected,{
 hasWords=true,strict=false,margin=.075
}={}){
 if(!selected)return {winner:null,reason:'no-finalist'};
 if(!hasWords||!selected.composite?.painted)
  return {winner:selected,reason:'no-typographic-gate'};
 const old=selected.composite.typeLegibility;
 if(!old||old.readable)return {winner:selected,reason:'readable-selected'};
 const baseline=selected.threeWay?.score??0;
 const options=ranked.filter(candidate=>{
  const evidence=candidate.composite?.typeLegibility;
  if(!evidence?.readable)return false;
  if(strict&&selected.golden?.qualifies&&!candidate.golden?.qualifies)
   return false;
  if((candidate.threeWay?.score??0)<baseline-margin)return false;
  if((candidate.threeWay?.phi??0)<(selected.threeWay?.phi??0)-.15||
     (candidate.threeWay?.H??0)<(selected.threeWay?.H??0)-.15)return false;
  return true;
 }).sort((a,b)=>{
  if(strict&&!!a.golden?.qualifies!==!!b.golden?.qualifies)
   return a.golden?.qualifies?-1:1;
  const scoreA=(a.threeWay?.score||0)+a.composite.typeLegibility.score*.035;
  const scoreB=(b.threeWay?.score||0)+b.composite.typeLegibility.score*.035;
  return scoreB-scoreA;
 });
 return options.length?
  {winner:options[0],reason:'readability-over-novelty'}:
  {winner:selected,reason:'repaired-mask-no-better-finalist'};
}
