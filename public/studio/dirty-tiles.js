/* HEXFIELD 318 — conservative dirty-tile planning.
 * A LOCAL interpretation explicitly preserves every pixel outside a small
 * change region. It is NOT a shortcut for a global formal-law replacement.
 * No paid rendering, no hidden canvas displayed to the user.
 */
export const TILE_SIZE=48;
export const MAX_DIRTY_FRACTION=.24;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const rgbDiff=(a,b,i)=>(
  Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/765;
export function tilesCoverage(tiles,width,height){
 if(!Array.isArray(tiles))return 0;
 return tiles.reduce((sum,t)=>sum+
  Math.max(0,Math.min(width,t.x+t.w)-Math.max(0,t.x))*
  Math.max(0,Math.min(height,t.y+t.h)-Math.max(0,t.y)),0)/
  Math.max(1,width*height);
}
export function validDirtyTiles(tiles,w,h,{max=.26}={}){
 if(!Array.isArray(tiles)||!tiles.length||tiles.length>50||!w||!h)return false;
 const seen=new Set();
 for(const t of tiles){
  if(!t||![t.x,t.y,t.w,t.h].every(Number.isInteger)||
    t.w<=0||t.h<=0||t.x<0||t.y<0||
    t.x+t.w>w||t.y+t.h>h)return false;
  const token=[t.x,t.y,t.w,t.h].join(':');
  if(seen.has(token))return false;seen.add(token);
 }
 return tilesCoverage(tiles,w,h)<=max;
}
export function planDirtyTiles(previous,proposal,{
 seed=1,cycle=0,objects=[],tileSize=TILE_SIZE
}={}){
 if(!previous?.getContext||!proposal?.getContext||
   previous.width<100||previous.height<100)return null;
 const w=previous.width,h=previous.height;
 const size=clamp(Math.round(tileSize),24,64);
 const cols=Math.ceil(w/size),rows=Math.ceil(h/size);
 // Only analyze 1 pixel per tile using a *real* small raster of both images.
 // This is a cheap planner, NOT a replacement for actual W/φ/H evaluation.
 const old=make(cols,rows),next=make(cols,rows);
 const a=old.getContext('2d',{willReadFrequently:true}),
   b=next.getContext('2d',{willReadFrequently:true});
 a.drawImage(previous,0,0,cols,rows);
 b.drawImage(proposal,0,0,cols,rows);
 const before=a.getImageData(0,0,cols,rows).data,
   after=b.getImageData(0,0,cols,rows).data;
 const stable=objects.filter(x=>x?.age>=3&&x.stability>=.68&&
  x.volatility<.24&&x.votes>-3&&x.bbox);
 let regionCols=Math.min(cols,4),regionRows=Math.min(rows,3);
 // Smaller test canvases and mobile preview sizes require fewer tiles.
 // Never let the planning rectangle exceed the intended sparse budget.
 while(regionCols*size*regionRows*size>w*h*.18&&
       (regionCols>1||regionRows>1)){
   if(regionCols>=regionRows&&regionCols>1)regionCols--;
   else if(regionRows>1)regionRows--;
   else regionCols--;
 }
 let winner=null;
 for(let gy=0;gy<=rows-regionRows;gy++)for(let gx=0;gx<=cols-regionCols;gx++){
  let score=0,protectedCells=0;
  for(let ry=0;ry<regionRows;ry++)for(let rx=0;rx<regionCols;rx++){
   const x=gx+rx,y=gy+ry,i=(y*cols+x)*4;
   let difference=rgbDiff(before,after,i);
   for(const obj of stable){
    const b=obj.bbox,cx=(x+.5)/cols,cy=(y+.5)/rows;
    if(cx>=b.x&&cx<b.x+b.w&&cy>=b.y&&cy<b.y+b.h){
      difference*=.25;protectedCells++;
    }
   }
   score+=difference;
  }
  // The seeded term breaks flat plateaus while preserving determinism.
  const tie=(((Math.imul(gx+13,2654435761)^Math.imul(gy+7,2246822519)^
    Math.imul(seed,3266489917)^cycle)>>>0)/4294967296)*.000001;
  score=score/(regionCols*regionRows)+tie;
  if(!winner||score>winner.score)
    winner={x:gx,y:gy,score,protectedCells};
 }
 if(!winner)return null;
 const tiles=[];
 for(let y=winner.y;y<winner.y+regionRows;y++)for(let x=winner.x;x<winner.x+regionCols;x++){
  const px=x*size,py=y*size;
  tiles.push({x:px,y:py,w:Math.min(size,w-px),h:Math.min(size,h-py)});
 }
 if(!validDirtyTiles(tiles,w,h,{max:MAX_DIRTY_FRACTION}))return null;
 return {tiles,coverage:tilesCoverage(tiles,w,h),
   totalTiles:cols*rows,dirtyTiles:tiles.length,
   skippedTiles:cols*rows-tiles.length,
   protectedCells:winner.protectedCells,score:winner.score,
   mode:'local-application',reason:'bounded measured scene change'};
}
export function shouldUseLocalRender({cycle=0,previous=null,inherited=null,
 words='',textChanged=false,donorsRefreshed=false,forceFull=false}={}){
 // Global composition changes (new donors, first frame, edited text,
 // explicit full reset) MUST NOT be represented as a valid partial update.
 return !!previous?.getContext&&!!inherited&&
   cycle>=1&&cycle%4===1&&!textChanged&&
   !donorsRefreshed&&!forceFull;
}
export function sameOutsideDirty(canvas,parent,tiles){
 if(!canvas?.getContext||!parent?.getContext)return false;
 const w=canvas.width,h=canvas.height;
 if(w!==parent.width||h!==parent.height)return false;
 const a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const b=parent.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(tiles.some(t=>x>=t.x&&x<t.x+t.w&&y>=t.y&&y<t.y+t.h))continue;
  const i=(y*w+x)*4;
  for(let c=0;c<4;c++)if(a[i+c]!==b[i+c])return false;
 }
 return true;
}
