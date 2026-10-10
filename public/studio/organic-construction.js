/* HEXFIELD 321 — geometry of the actual making.
 * Contours come from the ACCEPTED raster's colour regions and changes.
 * Gestures come from the rule engine's EXECUTED mark trace.
 * Clip paths only REVEAL actual pixels; no illustrative fake ink is invented.
 */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const key=(x,y)=>x+','+y;
export function gestureBounds(mark){
 if(!mark||!['rect','circle','line','polygon'].includes(mark.type))return null;
 if(mark.type==='rect'&&[mark.x,mark.y,mark.a,mark.b].every(Number.isFinite))
   return {x:mark.x,y:mark.y,w:mark.a,h:mark.b};
 if(mark.type==='circle'&&[mark.x,mark.y,mark.a].every(Number.isFinite))
   return {x:mark.x-mark.a,y:mark.y-mark.a,w:mark.a*2,h:mark.a*2};
 if(mark.type==='line'&&[mark.x,mark.y,mark.a,mark.b].every(Number.isFinite)){
  const p=Math.max(1,Number(mark.width)||3);
  return {x:Math.min(mark.x,mark.a)-p,y:Math.min(mark.y,mark.b)-p,
    w:Math.abs(mark.a-mark.x)+2*p,h:Math.abs(mark.b-mark.y)+2*p};
 }
 if(mark.type==='polygon'&&mark.points?.length>=3){
  const points=mark.points.filter(p=>p.length>=2&&p.every(Number.isFinite));
  if(points.length<3)return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {x:Math.min(...xs),y:Math.min(...ys),
   w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 }
 return null;
}
function intersects(a,b){
 return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
}
export function gesturePath(ctx,mark){
 const b=gestureBounds(mark);if(!b)return false;
 ctx.beginPath();
 if(mark.type==='rect')ctx.rect(mark.x,mark.y,mark.a,mark.b);
 if(mark.type==='circle')ctx.arc(mark.x,mark.y,Math.max(.25,mark.a),0,Math.PI*2);
 if(mark.type==='polygon'){
  ctx.moveTo(...mark.points[0]);
  for(const point of mark.points.slice(1))ctx.lineTo(...point);
  ctx.closePath();
 }
 if(mark.type==='line'){
  const thick=Math.max(1,Number(mark.width)||3),
    dx=mark.a-mark.x,dy=mark.b-mark.y,
    length=Math.max(.001,Math.hypot(dx,dy)),nx=-dy/length*thick*.65,
    ny=dx/length*thick*.65;
  ctx.moveTo(mark.x+nx,mark.y+ny);
  ctx.lineTo(mark.a+nx,mark.b+ny);
  ctx.lineTo(mark.a-nx,mark.b-ny);
  ctx.lineTo(mark.x-nx,mark.y-ny);ctx.closePath();
 }
 return true;
}
function tone(r,g,b){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),value=(r+g+b)/3;
 if(hi-lo<34)return 'neutral-'+Math.min(4,(value/51)|0);
 let channel=r>g*1.12&&r>b*1.12?'red':
  b>r*1.09&&b>g*1.08?'blue':
  g>r*1.09&&g>b*1.07?'green':'mixed';
 return channel+'-'+Math.min(2,(value/85)|0);
}
export function extractRasterContours(canvas,{
 columns=54,rows=34,maxContours=28,minCells=3,mask=null
}={}){
 if(!canvas?.getContext)return [];
 const w=canvas.width,h=canvas.height,cols=clamp(Math.round(columns),8,100),
  rws=clamp(Math.round(rows),6,75);
 const small=document.createElement('canvas');
 small.width=cols;small.height=rws;
 const sc=small.getContext('2d',{willReadFrequently:true});
 sc.drawImage(canvas,0,0,cols,rws);
 const pixel=sc.getImageData(0,0,cols,rws).data;
 const labels=new Array(cols*rws);
 for(let i=0;i<labels.length;i++)labels[i]=tone(pixel[i*4],pixel[i*4+1],pixel[i*4+2]);
 const visited=new Uint8Array(labels.length),shapes=[];
 const sx=w/cols,sy=h/rws;
 for(let origin=0;origin<labels.length;origin++){
  if(visited[origin])continue;
  visited[origin]=1;
  const component=[],queue=[origin],family=labels[origin];
  for(let at=0;at<queue.length;at++){
   const index=queue[at],x=index%cols,y=Math.floor(index/cols);
   component.push(index);
   const neighbors=[x?index-1:-1,x<cols-1?index+1:-1,
     y?index-cols:-1,y<rws-1?index+cols:-1];
   for(const next of neighbors){
    if(next<0||visited[next]||labels[next]!==family)continue;
    visited[next]=1;queue.push(next);
   }
  }
  if(component.length<minCells||component.length>cols*rws*.72)continue;
  const members=new Set(component),edges=[],xs=[],ys=[];
  for(const cell of component){
   const x=cell%cols,y=Math.floor(cell/cols);
   xs.push(x);ys.push(y);
   // Boundary segments are oriented clockwise along actual sampled
   // pigment regions, not rectangular paint-reveal tiles.
   if(!members.has(cell-cols))edges.push([[x,y],[x+1,y]]);
   if(!members.has(cell+1)||x===cols-1)edges.push([[x+1,y],[x+1,y+1]]);
   if(!members.has(cell+cols))edges.push([[x+1,y+1],[x,y+1]]);
   if(!members.has(cell-1)||x===0)edges.push([[x,y+1],[x,y]]);
  }
  if(edges.length<4)continue;
  const nextByStart=new Map();
  for(let i=0;i<edges.length;i++){
   const from=key(...edges[i][0]);
   if(!nextByStart.has(from))nextByStart.set(from,[]);
   nextByStart.get(from).push(i);
  }
  const used=new Set(),loops=[];
  for(let start=0;start<edges.length;start++){
   if(used.has(start))continue;
   let i=start;const loop=[];
   for(let step=0;step<=edges.length;step++){
    if(used.has(i))break;
    used.add(i);loop.push(edges[i][0]);
    const end=edges[i][1];
    if(key(...end)===key(...edges[start][0]))break;
    const options=nextByStart.get(key(...end))||[];
    const next=options.find(j=>!used.has(j));
    if(next===undefined)break;i=next;
   }
   if(loop.length>=4)loops.push(loop.map(p=>[p[0]*sx,p[1]*sy]));
  }
  if(!loops.length)continue;
  const x0=Math.min(...xs)*sx,y0=Math.min(...ys)*sy,
    x1=(Math.max(...xs)+1)*sx,y1=(Math.max(...ys)+1)*sy;
  const box={x:x0,y:y0,w:x1-x0,h:y1-y0};
  if(mask&&!mask.some(m=>intersects(box,m)))continue;
  shapes.push({type:'contour',loops,bounds:box,cells:component.length,
   palette:family,rank:component.length});
 }
 return shapes.sort((a,b)=>b.cells-a.cells||
  a.bounds.y-b.bounds.y).slice(0,clamp(maxContours,1,64));
}
export function contourPath(ctx,shape){
 if(!shape?.loops?.length)return false;
 ctx.beginPath();
 for(const points of shape.loops){
  if(points.length<3)continue;
  const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const n=points.length;
  ctx.moveTo(...midpoint(points[n-1],points[0]));
  for(let i=0;i<n;i++){
   const p=points[i],q=points[(i+1)%n];
   ctx.quadraticCurveTo(p[0],p[1],...midpoint(p,q));
  }
  ctx.closePath();
 }
 return true;
}
export function buildOrganicStages({final,sketch=null,parent=null,trace=null,
 wordBounds=null,objects=[],dirtyTiles=null,maxMarks=170}={}){
 if(!final?.getContext)return {stages:[],erases:[],gestures:[],contours:[]};
 const dirty=Array.isArray(dirtyTiles)&&dirtyTiles.length>0?dirtyTiles:null;
 const overlapsDirty=box=>!dirty||dirty.some(d=>intersects(box,d));
 const brush=(trace?.marks||[]).filter(m=>{
  const b=gestureBounds(m);
  return b&&overlapsDirty(b);
 });
 // Evenly sample actual recorded marks in their genuine execution order,
 // capping clip draws for mobile GPUs rather than running 900 full blits.
 const marks=brush.filter((_,i)=>i%Math.max(1,Math.ceil(brush.length/maxMarks))===0)
  .slice(0,maxMarks).map(mark=>({type:'gesture',mark,bounds:gestureBounds(mark),
   group:'ink'}));
 const contours=extractRasterContours(final,{maxContours:24,mask:dirty})
   .map(item=>({...item,group:'scene'}));
 const inherited=(objects||[]).filter(o=>o?.bbox&&o.age>=3&&o.volatility<.3);
 // Individual physical contours delay their inherited motifs and word band
 // without replacing the parent image with a screen-size rectangular wipe.
 const order=part=>{
  const box=part.bounds||part,
    cx=box.x+box.w/2,cy=box.y+box.h/2;
  const word=wordBounds&&intersects(box,wordBounds);
  const preserved=inherited.some(o=>{
   const b={x:o.bbox.x*final.width,y:o.bbox.y*final.height,
    w:o.bbox.w*final.width,h:o.bbox.h*final.height};
   return intersects(box,b);
  });
  return (word?90:0)+(preserved?38:0)+
   (part.type==='contour'?26:0)+
   (part.type==='gesture'?0:12)+
   ((Math.round(cx)*17+Math.round(cy)*7)%19)*.013;
 };
 const stages=[...marks,...contours].sort((a,b)=>order(a)-order(b));
 const erases=parent&&sketch?
  extractRasterContours(sketch,{maxContours:10,mask:dirty})
  .map(shape=>({...shape,group:'undo'})):[];
 return {stages,erases,gestures:marks,contours,
  total:stages.length,erased:erases.length,
  inherited:inherited.length,word:!!wordBounds};
}
export function revealOrganic(canvas,source,parts,start,end,{dirtyTiles=null}={}){
 if(!canvas?.getContext||!source?.getContext)return 0;
 const ctx=canvas.getContext('2d');let count=0;
 for(let i=start;i<Math.min(parts.length,end);i++){
  const part=parts[i];if(!part)continue;
  ctx.save();
  // A scheduled dirty-only rework cannot affect parent pixels elsewhere.
  if(Array.isArray(dirtyTiles)&&dirtyTiles.length){
   ctx.beginPath();
   for(const t of dirtyTiles)ctx.rect(t.x,t.y,t.w,t.h);
   ctx.clip();
  }
  const valid=part.type==='gesture'?
   gesturePath(ctx,part.mark):contourPath(ctx,part);
  if(valid){
   ctx.clip();
   const b=part.bounds||{x:0,y:0,w:canvas.width,h:canvas.height};
   const x=Math.max(0,Math.floor(b.x-2)),y=Math.max(0,Math.floor(b.y-2));
   const right=Math.min(canvas.width,Math.ceil(b.x+b.w+2)),
    bottom=Math.min(canvas.height,Math.ceil(b.y+b.h+2));
   if(right>x&&bottom>y)ctx.drawImage(source,x,y,right-x,bottom-y,
    x,y,right-x,bottom-y);
   count++;
  }
  ctx.restore();
 }
 return count;
}
