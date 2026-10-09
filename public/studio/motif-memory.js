/* HEXFIELD 310 — PERSISTENCE OF FORM
 * A painting can change its laws and materials without every discovered
 * shape disappearing. A motif is sampled from actual painted pixels once
 * and physically carried for a bounded number of parent→child revisions.
 *
 * New strokes obey each new executable law. The surviving islands remain
 * evidence of previous laws — deliberate archaeological layers, not an
 * assertion that inherited strokes obey a subsequently incompatible law.
 * No paid inference, image segmentation, storage upload or external model.
 */
import {evolveSeed} from './nonredundancy.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=n=>Number.isFinite(n)?n:0;
export const MOTIF_TTL=9,MAX_MOTIFS=3;
const canvasOf=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const overlap=(a,b)=>{
 const ix=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const iy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return ix*iy/(a.w*a.h+b.w*b.h-ix*iy||1);
};
export function findMotifRegion(canvas,{seed=1,exclude=[]}={}){
 if(!canvas?.getContext||!canvas.width||!canvas.height)return null;
 const tw=60,th=40,small=canvasOf(tw,th);
 const ctx=small.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,0,0,tw,th);
 const data=ctx.getImageData(0,0,tw,th).data;
 const px=(x,y)=>{const i=(y*tw+x)*4;
   return [data[i],data[i+1],data[i+2]];
 };
 const lum=(p)=>p[0]*.2126+p[1]*.7152+p[2]*.0722;
 const samples=[];
 // Occupied islands, not a random piece of empty sky. Regions are of
 // human-visible size and intentionally remain at the same coordinates.
 const cols=5,rows=4,w=.26,h=.29;
 for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
   const x=clamp((gx+.5)/cols-w/2,0,1-w);
   const y=clamp((gy+.5)/rows-h/2,0,1-h);
   const rect={x,y,w,h};
   if(exclude.some(o=>overlap(rect,o)>.11))continue;
   let n=0,sum=0,ss=0,edge=0,chroma=0;
   for(let py=Math.ceil(y*th)+1;py<Math.min(th-1,Math.floor((y+h)*th));py+=2)
   for(let pxn=Math.ceil(x*tw)+1;pxn<Math.min(tw-1,Math.floor((x+w)*tw));pxn+=2){
     const rgb=px(pxn,py),l=lum(rgb),prev=lum(px(pxn-1,py));
     const up=lum(px(pxn,py-1));
     sum+=l;ss+=l*l;n++;
     edge+=Math.abs(l-prev)+Math.abs(l-up);
     chroma+=Math.max(...rgb)-Math.min(...rgb);
   }
   if(n<3)continue;
   const variance=Math.sqrt(Math.max(0,ss/n-(sum/n)**2));
   const detail=clamp(variance/68,0,1)*.50+
     clamp(edge/n/82,0,1)*.35+clamp(chroma/n/100,0,1)*.15;
   const wobble=evolveSeed(seed,gx+1,gy+1,'motif-cell')/4294967296;
   samples.push({...rect,detail,score:detail+.045*wobble});
 }
 samples.sort((a,b)=>b.score-a.score);
 return samples[0]?.detail>.045?samples[0]:null;
}
export function captureMotif(source,{seed=1,cycle=0,exclude=[]}={}){
 const spot=findMotifRegion(source,{seed,exclude});
 if(!spot)return null;
 const w=source.width,h=source.height;
 const sx=Math.round(spot.x*w),sy=Math.round(spot.y*h);
 const sw=Math.min(w-sx,Math.max(12,Math.round(spot.w*w)));
 const sh=Math.min(h-sy,Math.max(12,Math.round(spot.h*h)));
 const image=canvasOf(sw,sh),ctx=image.getContext('2d');
 ctx.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
 // A soft elliptical edge allows recognisable structures to survive
 // without a hard rectangular Photoshop seam. The interior ink is exact.
 ctx.globalCompositeOperation='destination-in';
 const radius=Math.max(sw,sh)*.67;
 const mask=ctx.createRadialGradient(sw/2,sh/2,Math.min(sw,sh)*.21,
   sw/2,sh/2,radius);
 mask.addColorStop(0,'rgba(0,0,0,1)');
 mask.addColorStop(.62,'rgba(0,0,0,.97)');
 mask.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=mask;ctx.fillRect(0,0,sw,sh);
 ctx.globalCompositeOperation='source-over';
 return {
   id:'motif-'+cycle+'-'+evolveSeed(seed,cycle+1,0,'held-form').toString(36),
   born:cycle,age:0,ttl:MOTIF_TTL,
   x:spot.x,y:spot.y,w:spot.w,h:spot.h,
   detail:spot.detail,image,seed
 };
}
export function paintHeldMotifs(target,motifs,{cycle=0,opacity=1}={}){
 const valid=(motifs||[]).filter(m=>m?.image&&m.age<m.ttl);
 const ctx=target.getContext('2d');
 if(!ctx)return {held:[],coverage:0};
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 const held=[];
 for(const item of valid){
   const age=item.age||0;
   const fade=age<6?1:clamp((item.ttl-age)/3,0,1);
   // Original idea survives for six full cycles, then exits gradually.
   const strength=clamp(opacity,0,1)*fade;
   if(strength<=0)continue;
   const x=Math.round(item.x*target.width),y=Math.round(item.y*target.height);
   const w=Math.round(item.w*target.width),h=Math.round(item.h*target.height);
   ctx.globalAlpha=strength;
   ctx.drawImage(item.image,x,y,w,h);
   held.push({id:item.id,age,x,y,w,h,detail:item.detail,strength});
 }
 ctx.restore();
 return {held,coverage:held.reduce((a,m)=>a+m.w*m.h*m.strength,0)/
   (target.width*target.height)};
}
export function advanceMotifMemory(motifs,chosen,{seed=1,cycle=0,
  parent=null}={}){
 const aged=(motifs||[]).map(m=>({...m,age:m.age+1}))
   .filter(m=>m.age<m.ttl);
 const result=aged.slice(-MAX_MOTIFS);
 // First surviving idea is taken from the ACTUAL previous artwork.
 if(!result.length){
   const first=captureMotif(parent||chosen,{
     seed:evolveSeed(seed,1,0,'motif-start'),cycle,
     exclude:[]
   });
   if(first)result.push(first);
 }
 // Let new, differently shaped ideas enter every third generation.
 // Each old one remains recognisable; the studio does not freeze the
 // whole canvas into an unchanged accumulated collage.
 if(cycle>1&&cycle%3===0){
   const candidate=captureMotif(chosen,{
     seed:evolveSeed(seed,cycle,1,'motif-enter'),cycle,
     exclude:result
   });
   if(candidate){
     if(result.length>=MAX_MOTIFS)result.shift();
     result.push(candidate);
   }
 }
 return result;
}
export function motifEvidence(motifs){
 return (motifs||[]).filter(m=>m.age<m.ttl).map(m=>({
   id:m.id,age:m.age,ttl:m.ttl,x:m.x,y:m.y,w:m.w,h:m.h,
   detail:+finite(m.detail).toFixed(3)
 }));
}
