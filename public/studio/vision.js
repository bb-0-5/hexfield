/* Hexfield 297 — visual evidence about what was actually painted.
 * Low-resolution, deterministic image descriptors; no remote AI service,
 * face recognition, uploaded pixels or opaque model judgments. The features
 * describe composition, colour masses and edge placement, not 'beauty'.
 */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const round=v=>Math.round(clamp(v)*1000)/1000;
const GRID_X=8,GRID_Y=5, RGB_X=6,RGB_Y=4;
export const DESCRIPTOR_VERSION=1;
export function describePixels(data,width,height){
  if(!(width>3&&height>3)||data.length<width*height*4)throw Error('Invalid painting pixels');
  const n=width*height, lum=new Float32Array(n), r=new Float32Array(n),g=new Float32Array(n),b=new Float32Array(n);
  let mean=0,contrast=0;
  const hist=new Array(8).fill(0);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x,p=i*4,alpha=data[p+3]/255;
    // Rendered canvases are opaque, but handle transparent tests predictably.
    const rr=(data[p]*alpha+255*(1-alpha))/255;
    const gg=(data[p+1]*alpha+255*(1-alpha))/255;
    const bb=(data[p+2]*alpha+255*(1-alpha))/255;
    r[i]=rr;g[i]=gg;b[i]=bb;
    const l=.2126*rr+.7152*gg+.0722*bb;lum[i]=l;mean+=l;
    hist[Math.min(7,Math.floor(l*8))]++;
  }
  mean/=n;
  const cells=(w,h,project)=>{
    const out=[];
    for(let cy=0;cy<h;cy++)for(let cx=0;cx<w;cx++){
      const x0=Math.floor(cx*width/w),x1=Math.floor((cx+1)*width/w);
      const y0=Math.floor(cy*height/h),y1=Math.floor((cy+1)*height/h);
      let sum=0,count=0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){sum+=project(y*width+x,x,y);count++;}
      out.push(round(sum/Math.max(1,count)));
    }
    return out;
  };
  const luminance=cells(GRID_X,GRID_Y,i=>lum[i]);
  const colors=[];
  for(const channel of [r,g,b])colors.push(...cells(RGB_X,RGB_Y,i=>channel[i]));
  const edges=cells(GRID_X,GRID_Y,(i,x,y)=>{
    const dx=x+1<width?Math.abs(lum[i+1]-lum[i]):0;
    const dy=y+1<height?Math.abs(lum[i+width]-lum[i]):0;
    return clamp((dx+dy)*2.4);
  });
  for(const l of lum)contrast+=(l-mean)*(l-mean);
  const spread=Math.sqrt(contrast/n);
  return {v:DESCRIPTOR_VERSION,l:luminance,c:colors,e:edges,h:hist.map(x=>round(x/n)),
    mean:round(mean),spread:round(spread)};
}
export function describeCanvas(source,mode='landscape'){
  const tile=document.createElement('canvas');tile.width=64;tile.height=40;
  const ctx=tile.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Visual comparison unavailable');
  if(mode==='lettering'){
    // Most logo backgrounds are intentionally blank. Compare the region where
    // the actual glyph shapes live, otherwise the background overwhelms edits.
    const x=source.width*.07,y=source.height*.20;
    ctx.drawImage(source,x,y,source.width*.86,source.height*.58,0,0,64,40);
  }else ctx.drawImage(source,0,0,tile.width,tile.height);
  return describePixels(ctx.getImageData(0,0,tile.width,tile.height).data,64,40);
}
export function descriptorValid(a){return !!a&&a.v===DESCRIPTOR_VERSION&&Array.isArray(a.l)&&a.l.length===40&&
 Array.isArray(a.c)&&a.c.length===72&&Array.isArray(a.e)&&a.e.length===40&&
 Array.isArray(a.h)&&a.h.length===8;}
function averageDifference(a,b){let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);return sum/a.length;}
export function visualBreakdown(a,b){
  if(!descriptorValid(a)||!descriptorValid(b))return null;
  const composition=averageDifference(a.l,b.l);
  const colour=averageDifference(a.c,b.c);
  const edges=Math.min(1,averageDifference(a.e,b.e)*2.5);
  const histogram=Math.min(1,averageDifference(a.h,b.h)*3.3);
  const distance=clamp(.34*composition+.27*colour+.29*edges+.10*histogram);
  return {distance:round(distance),composition:round(composition),colour:round(colour),edges:round(edges)};
}
export function visualDistance(a,b){return visualBreakdown(a,b)?.distance??null;}
export function visualFeedbackScore(descriptor,records){
  if(!descriptorValid(descriptor))return 0;
  const pool=Array.isArray(records)?records.filter(r=>descriptorValid(r?.visual)).slice(-90):[];
  const disliked=pool.filter(r=>r.liked===false).map(r=>visualDistance(descriptor,r.visual));
  const liked=pool.filter(r=>r.liked===true).map(r=>visualDistance(descriptor,r.visual));
  const nearestRejected=disliked.length?Math.min(...disliked):null;
  const nearestKept=liked.length?Math.min(...liked):null;
  // Escaping a failed picture matters more than imitating a kept one.
  // Explicit exploration remains independent of these rankings.
  const avoid=nearestRejected===null?0:1.4*clamp(nearestRejected/.24);
  const familiarity=nearestKept===null?0:.85*(1-clamp(nearestKept/.32));
  return Math.round((avoid+familiarity)*1000)/1000;
}
export function discoveryLabel(distance,mode='landscape'){
  if(distance===null||!Number.isFinite(distance))return 'unmeasured';
  // Letterform signatures focus on glyphs, so even a 0.03 shift can change
  // readability. Do not apply landscape-scale thresholds to small glyph edits.
  const thresholds=mode==='lettering'?[.022,.055,.095]:[.045,.105,.18];
  if(distance<thresholds[0])return 'nearly identical';
  if(distance<thresholds[1])return 'subtle visual change';
  if(distance<thresholds[2])return 'noticeable visual change';
  return 'major visual change';
}
// True comparisons require visual change, not merely an altered instruction tree.
export function rankVisualExperiments(parent,items,{floor=.045}={}){
  if(!descriptorValid(parent))return [];
  const ranked=items.filter(x=>descriptorValid(x.visual)).map(item=>({
    ...item,visualDifference:visualDistance(parent,item.visual),
  })).sort((a,b)=>b.visualDifference-a.visualDifference);
  const selected=[];
  for(const item of ranked){
    if(item.visualDifference<floor)continue;
    if(selected.some(old=>visualDistance(old.visual,item.visual)<floor*.8))continue;
    selected.push(item);
  }
  return selected;
}
export function blindSummary(trials){
  const rows=(Array.isArray(trials)?trials:[]).filter(x=>x&&typeof x.trainedPreferred==='boolean');
  const wins=rows.filter(x=>x.trainedPreferred).length;
  const n=rows.length,rate=n?wins/n:null,z=1.96;
  const denom=1+z*z/(n||1);
  const center=n?(rate+z*z/(2*n))/denom:null;
  const margin=n?(z*Math.sqrt(rate*(1-rate)/n+z*z/(4*n*n)))/denom:null;
  return {trials:n,wins,losses:n-wins,rate,
    lower:n?Math.max(0,center-margin):null,upper:n?Math.min(1,center+margin):null};
}
