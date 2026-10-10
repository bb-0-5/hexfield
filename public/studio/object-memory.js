/* HEXFIELD 317 — bounded persistent VISUAL object memory.
 * Actual raster components, not semantic guesses ("cat"/"window").
 * The same identities may survive via palette, area, location and footprint.
 * Pixels for a stable form come from the ACTUAL previous painting.
 * No cloud, no unbounded canvas cache, and no full-resolution stored bitmaps.
 */
export const OBJECT_STORE='hexfield.visual-objects.v1';
export const OBJECT_DB='hexfield-art-memory';
export const GRID_W=48,GRID_H=30,MAX_OBJECTS=8;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number(x)||0));
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const pixelDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/441.673;
const rectOverlap=(a,b)=>{
 const x=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const y=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const union=a.w*a.h+b.w*b.h-x*y;
 return union>0?x*y/union:0;
};
const paletteClass=([r,g,b])=>{
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,
   avg=(r+g+b)/3;
 if(d<32)return 'neutral:'+Math.min(3,Math.floor(avg/64));
 const winner=r>=g&&r>=b?'r':g>=b?'g':'b';
 // Distinguishes at least two colour bands, without fragmenting every stroke.
 return winner+':'+Math.min(2,Math.floor(avg/85));
};
const maskRLE=cells=>{
 let runs=[],last=cells[0]||0,length=0;
 for(let i=0;i<=cells.length;i++){
  const value=i<cells.length?cells[i]:1-last;
  if(value!==last){runs.push(length.toString(36));last=value;length=0;}
  length++;
 }
 return (cells[0]?'1':'0')+runs.join('.');
};
const fromRLE=(encoded,size=GRID_W*GRID_H)=>{
 const bits=new Uint8Array(size);if(typeof encoded!=='string'||!encoded.length)return bits;
 const runs=encoded.slice(1).split('.');let at=0,value=encoded[0]==='1'?1:0;
 for(const run of runs){
  const n=parseInt(run,36);if(!Number.isFinite(n)||n<0)break;
  if(value)bits.fill(1,at,Math.min(size,at+n));
  at+=n;if(at>=size)break;value^=1;
 }
 return bits;
};
export function extractVisualObjects(canvas,{gridW=GRID_W,gridH=GRID_H,max=MAX_OBJECTS}={}){
 if(!canvas?.getContext)return [];
 const w=Math.max(8,Math.round(gridW)),h=Math.max(8,Math.round(gridH)),
   sample=create(w,h),ctx=sample.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h).data;
 const pixels=Array.from({length:w*h},(_,p)=>{
  const i=p*4;return [data[i],data[i+1],data[i+2]];
 });
 const labels=pixels.map(paletteClass),visited=new Uint8Array(w*h),components=[];
 for(let start=0;start<w*h;start++){
  if(visited[start])continue;
  visited[start]=1;
  const todo=[start],members=[],tone=labels[start];
  let x0=w,y0=h,x1=0,y1=0,sum=[0,0,0],cx=0,cy=0,edges=0;
  while(todo.length){
   const at=todo.pop(),x=at%w,y=Math.floor(at/w);
   members.push(at);x0=Math.min(x0,x);x1=Math.max(x1,x);
   y0=Math.min(y0,y);y1=Math.max(y1,y);cx+=x;cy+=y;
   for(let k=0;k<3;k++)sum[k]+=pixels[at][k];
   for(const near of [x>0?at-1:-1,x<w-1?at+1:-1,
     y>0?at-w:-1,y<h-1?at+w:-1]){
    if(near<0)continue;
    if(labels[near]!==tone){edges++;continue;}
    if(!visited[near]){visited[near]=1;todo.push(near);}
   }
  }
  if(members.length<4||members.length>w*h*.62)continue;
  const area=members.length,occupancy=new Uint8Array(w*h);
  for(const n of members)occupancy[n]=1;
  const normalized={x:x0/w,y:y0/h,w:(x1-x0+1)/w,h:(y1-y0+1)/h};
  components.push({
   class:tone,centroid:{x:cx/area/w,y:cy/area/h},bbox:normalized,
   area:area/(w*h),palette:sum.map(v=>Math.round(v/area)),
   edges:Math.round(edges/Math.max(1,area)*100)/100,
   mask:maskRLE(occupancy),
   cells:area,grid:[w,h]
  });
 }
 return components.sort((a,b)=>b.cells-a.cells).slice(0,clamp(max,1,32));
}
function similarity(a,b){
 if(a.class!==b.class)return 0;
 const distance=Math.hypot(a.centroid.x-b.centroid.x,
   a.centroid.y-b.centroid.y);
 const color=pixelDistance(a.palette,b.palette);
 const area=Math.abs(Math.log(Math.max(.001,a.area)/Math.max(.001,b.area)));
 return clamp(.51*rectOverlap(a.bbox,b.bbox)+
   .27*Math.max(0,1-distance*3)+.16*(1-color)+.06*Math.max(0,1-area),
   0,1);
}
export function updateObjectRegistry(registry=[],canvas,{generation=0,
 max=MAX_OBJECTS,priorId=1}={}){
 const old=Array.isArray(registry)?registry.slice(0,MAX_OBJECTS):[];
 const fresh=extractVisualObjects(canvas,{max});
 let nextId=Math.max(1,priorId,
  ...old.map(x=>Number(String(x.id||'').replace(/^o-/,'')||0)+1).filter(Number.isFinite));
 const assigned=new Set(),rows=[];
 for(const found of fresh){
  let best=null,bestScore=0;
  for(const remembered of old){
   if(assigned.has(remembered.id))continue;
   const score=similarity(remembered,found);
   if(score>bestScore){best=remembered;bestScore=score;}
  }
  if(bestScore>=.42&&best){
   assigned.add(best.id);
   const volatility=clamp((Number(best.volatility)||0)*.58+
     (1-bestScore)*.42,0,1);
   const age=Number(best.age||1)+1;
   rows.push({...found,id:best.id,rootId:best.rootId||best.id,
     birth:best.birth??generation,seen:generation,age,
     volatility,stability:clamp(bestScore*.6+(1-volatility)*.4,0,1),
     votes:clamp(best.votes||0,-12,12),
     relationHistory:Array.isArray(best.relationHistory)?
       best.relationHistory.slice(-5):[]});
  }else{
   const id='o-'+nextId++;
   rows.push({...found,id,rootId:id,birth:generation,seen:generation,
     age:1,volatility:.5,stability:0,votes:0,relationHistory:[]});
  }
 }
 // Keep a few missing forms for short-term recognition of returning objects,
 // but never copy absent shapes into the painting as a fake continuation.
 const missing=old.filter(x=>!assigned.has(x.id)&&
   generation-(x.seen??0)<=2).slice(0,2);
 const objects=rows.concat(missing).slice(0,clamp(max,1,MAX_OBJECTS));
 return {objects,nextId,matched:assigned.size,extracted:fresh.length,
   stable:objects.filter(x=>x.seen===generation&&x.age>=3&&x.volatility<.24).length};
}
export function paintStableObjects(target,parent,objects=[],{
 generation=0,opacity=.78,max=3
}={}){
 if(!target?.getContext||!parent?.getContext)return {reused:0,cells:0};
 const w=target.width,h=target.height,ctx=target.getContext('2d');
 let reused=0,cells=0;
 for(const object of objects){
  if(reused>=max)break;
  if(object.age<3||object.volatility>.24||object.stability<.68||
    object.seen<generation-1||object.votes<=-3)continue;
  const [gw,gh]=object.grid||[];
  if(gw!==GRID_W||gh!==GRID_H)continue;
  const occupancy=fromRLE(object.mask,gw*gh);
  if(!occupancy.some(Boolean))continue;
  ctx.save();ctx.beginPath();
  let regions=0;
  for(let y=0;y<gh;y++){
   let start=-1;
   for(let x=0;x<=gw;x++){
    const occupied=x<gw&&occupancy[y*gw+x];
    if(occupied&&start<0)start=x;
    if(!occupied&&start>=0){
     const sx=Math.floor(start*w/gw),ex=Math.ceil(x*w/gw);
     const sy=Math.floor(y*h/gh),ey=Math.ceil((y+1)*h/gh);
     ctx.rect(sx,sy,ex-sx,ey-sy);regions++;start=-1;
    }
   }
  }
  if(regions){
   ctx.clip();ctx.globalAlpha=clamp(opacity,0,.94);
   ctx.drawImage(parent,0,0,w,h);reused++;cells+=object.cells;
  }
  ctx.restore();
 }
 return {reused,cells,coverage:cells/(GRID_W*GRID_H)};
}
export function rememberObjectVerdict(objects,liked,relation=null){
 return objects.map(obj=>({...obj,
   votes:clamp((obj.votes||0)+(liked?1:-1),-12,12),
   relationHistory:relation?
     [...(obj.relationHistory||[]),relation].slice(-5):
     (obj.relationHistory||[]).slice(-5)}));
}
const validRow=row=>row&&typeof row.id==='string'&&
 typeof row.mask==='string'&&
 Array.isArray(row.grid)&&row.grid.length===2&&
 Array.isArray(row.palette)&&row.bbox?.w>0;
export function loadObjectRegistry(){
 try{
  const saved=JSON.parse(localStorage.getItem(OBJECT_STORE)||'null');
  if(saved?.v!==1||!Array.isArray(saved.objects))return {objects:[],nextId:1};
  return {objects:saved.objects.filter(validRow).slice(0,MAX_OBJECTS),
   nextId:clamp(saved.nextId||1,1,1e7)};
 }catch{return {objects:[],nextId:1};}
}
export function saveObjectRegistry(registry){
 const record={v:1,objects:(registry?.objects||[]).slice(0,MAX_OBJECTS),
   nextId:registry?.nextId||1};
 let saved=false;
 try{localStorage.setItem(OBJECT_STORE,JSON.stringify(record));saved=true;}catch{}
 // IndexedDB stores the same bounded compact descriptors for users whose
 // localStorage is cleared by quota pressure; reading never delays a render.
 try{
  if(typeof indexedDB!=='undefined'){
   const request=indexedDB.open(OBJECT_DB,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains('registry'))
      request.result.createObjectStore('registry');
   };
   request.onsuccess=()=>{
    try{
     const db=request.result,t=db.transaction('registry','readwrite');
     t.objectStore('registry').put(record,'current');
     t.oncomplete=()=>db.close();t.onerror=()=>db.close();
    }catch{request.result.close();}
   };
  }
 }catch{}
 return saved;
}
export function loadObjectRegistryFromDB(){
 return new Promise(resolve=>{
  if(typeof indexedDB==='undefined')return resolve(null);
  try{
   const request=indexedDB.open(OBJECT_DB,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains('registry'))
      request.result.createObjectStore('registry');
   };
   request.onerror=()=>resolve(null);
   request.onsuccess=()=>{
    const db=request.result,t=db.transaction('registry','readonly'),
      get=t.objectStore('registry').get('current');
    get.onsuccess=()=>{
     const val=get.result;
     resolve(val?.v===1&&Array.isArray(val.objects)?
       {objects:val.objects.filter(validRow).slice(0,MAX_OBJECTS),
        nextId:val.nextId||1}:null);
    };
    get.onerror=()=>resolve(null);
    t.oncomplete=()=>db.close();t.onerror=()=>db.close();
   };
  }catch{resolve(null);}
 });
}
