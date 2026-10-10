/* HEXFIELD 328 — The painting changes its *technique*, not its subject.
 *
 * These functions consume ACTUAL source and actual executed paint pixels.
 * A single immutable compositional plate keeps silhouettes/edges and
 * meaningful colour regions visible while the rule engine applies new ink.
 * No geometry is invented, and no hidden regeneration resets the canvas.
 */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(v)?v:lo));
export const STRUCTURE_STRENGTH=Object.freeze({
 gentle:.65,balanced:.31,wild:0
});
const gain=level=>STRUCTURE_STRENGTH[level]??STRUCTURE_STRENGTH.gentle;
const luma=(data,i)=>data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;

export function previewRestyling(reference,unfinished,preview,{
 completedRows=0,cell=1,level='gentle'
}={}){
 if(!reference?.getContext||!unfinished?.getContext||
  !preview?.getContext)return false;
 const w=preview.width,h=preview.height,
  extent=clamp(Math.ceil(completedRows*Math.max(1,cell)),0,h),
  ctx=preview.getContext('2d');
 // The unpainted portion is never a synthetic beige void: it is always
 // the accepted REAL composition as it existed before style revision.
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.globalAlpha=1;ctx.clearRect(0,0,w,h);
 ctx.drawImage(reference,0,0,w,h);
 if(extent){
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,extent);ctx.clip();
  ctx.globalAlpha=1-gain(level)*.65;
  ctx.drawImage(unfinished,0,0,w,h);
  ctx.restore();
 }
 ctx.restore();
 return true;
}

export function conserveComposition(reference,painting,{
 level='gentle',baseRatio=null
}={}){
 const result={applied:false,level,changedPixels:0,
  protectedEdges:0,meanRetention:0};
 if(!reference?.getContext||!painting?.getContext||
  reference.width!==painting.width||reference.height!==painting.height)
  return result;
 const base=baseRatio===null?gain(level):clamp(baseRatio,0,.96);
 if(!base)return result; // HIGH remains truly experimental.
 const w=painting.width,h=painting.height,
  src=reference.getContext('2d',{willReadFrequently:true})
   .getImageData(0,0,w,h).data,
  ctx=painting.getContext('2d',{willReadFrequently:true}),
  image=ctx.getImageData(0,0,w,h),
  dst=image.data;
 let protectedEdges=0,total=0,changed=0;
 // Edge direction is derived from the ORIGINAL painting's physical
 // colour boundaries, NOT the procedural marks that replace them.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,left=(y*w+Math.max(0,x-1))*4,
   up=(Math.max(0,y-1)*w+x)*4;
  const difference=(Math.abs(luma(src,i)-luma(src,left))+
   Math.abs(luma(src,i)-luma(src,up)))/112;
  const edge=clamp(difference,0,1);
  const chroma=(Math.max(src[i],src[i+1],src[i+2])-
   Math.min(src[i],src[i+1],src[i+2]))/255;
  // More source structure survives where outlines and meaningful pigments
  // occur. Elsewhere the actual new material remains prominent.
  const retention=clamp(base+(1-base)*edge*.65+
   (1-base)*chroma*.16,0,.92);
  if(edge>.28)protectedEdges++;
  total+=retention;
  const newWeight=1-retention;
  for(let ch=0;ch<3;ch++){
   const mixed=Math.round(src[i+ch]*retention+dst[i+ch]*newWeight);
   if(mixed!==dst[i+ch])changed++;
   dst[i+ch]=mixed;
  }
  // An opaque painting remains opaque. Original alpha cannot disappear.
  dst[i+3]=255;
 }
 ctx.putImageData(image,0,0);
 return {applied:true,level,changedPixels:changed,
  protectedEdges,meanRetention:+(total/(w*h)).toFixed(4)};
}
