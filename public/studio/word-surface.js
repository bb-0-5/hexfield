/* HEXFIELD / unified canvas lettering. The word is not a second opaque
 * artwork or a prebuilt font logo: native glyphs provide only an occupancy
 * mask. Existing rule-based marks and pigment from the LIVE canvas supply
 * the final letter ink, with a seed-driven segmented geometry.
 */
import {applyRules,makeRecipe} from './rule-engine.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const brightness=(d,i)=>(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255;
export function paintWordsOnCanvas(canvas,words,{
  recipe=null,seed=1,iteration=0,sourceCanvas=null
}={}){
  if(!canvas?.getContext)return {painted:false,reason:'no canvas'};
  const text=String(words||'').replace(/\s+/g,' ').trim().slice(0,48);
  if(!text)return {painted:false,reason:'no words'};
  const w=canvas.width,h=canvas.height;
  const base=sourceCanvas||canvas;
  const ink=create(w,h),dataContext=ink.getContext('2d',{willReadFrequently:true});
  dataContext.drawImage(base,0,0,w,h);
  const before=dataContext.getImageData(0,0,w,h).data;
  // Scan actual painted values; choose the emptiest band, with golden
  // ratio placements breaking ties. No manual text layout configuration.
  const bands=[.22,.39,.59,.77];
  const height=Math.min(h*.34,Math.max(19,h*.22));
  const boxWidth=w*.91,margin=w*.045;
  const candidates=bands.map((middle,j)=>{
    const top=clamp(Math.round(h*middle-height*.5),0,h-1);
    let sum=0;
    for(let yy=top;yy<Math.min(h,top+height);yy+=6){
      for(let xx=6;xx<w-6;xx+=8){
        const i=(yy*w+xx)*4;
        sum+=Math.abs(brightness(before,i)-brightness(before,(Math.min(h-1,top)*w+6)*4));
      }
    }
    return {top,middle,activity:sum/(Math.max(1,w*h/48)),
      distance:Math.abs(middle-.61803398875),j};
  }).sort((a,b)=>(a.activity+bias(a,seed))-(b.activity+bias(b,seed)));
  const chosen=candidates[0];
  const mask=create(w,h),mc=mask.getContext('2d',{willReadFrequently:true});
  mc.fillStyle='#fff';mc.textAlign='center';mc.textBaseline='middle';
  let size=Math.min(height*.75,w/Math.max(2,text.length*.56));
  mc.font='900 '+Math.floor(size)+'px sans-serif';
  while(mc.measureText(text).width>boxWidth&&size>12){
    size*=.9;mc.font='900 '+Math.floor(size)+'px sans-serif';
  }
  const centerY=chosen.top+height*.52;
  mc.fillText(text,w*.5,centerY,boxWidth);
  // Segment the actual glyph occupancy into strata whose geometric shifts
  // are inherited from the evolving generation seed. This is a real change
  // in letter geometry before the painting is deposited onto the canvas.
  const original=mc.getImageData(0,0,w,h).data;
  const indexed=new Uint8ClampedArray(w*h);
  const tierHeight=Math.max(3,Math.round(size*.28));
  const maxShift=Math.min(w*.012,Math.max(1,size*.085));
  for(let y=Math.max(0,chosen.top-3);y<Math.min(h,chosen.top+height+4);y++){
    const stratum=Math.floor((y-chosen.top)/tierHeight);
    const sign=((stratum+(seed&3))&1)?-1:1;
    const slide=Math.round(sign*maxShift*(.55+((seed>>>8)%23)/55));
    for(let x=0;x<w;x++){
      const from=x-slide;
      if(from>=0&&from<w)indexed[y*w+x]=original[(y*w+from)*4+3];
    }
  }
  const rule=recipe&&recipe.mark?{...recipe,seed:(seed>>>0)}:
    makeRecipe({seed:seed>>>0,subject:'abstract',primary:'no_shading',mark:'hybrid'});
  const field=create(w,h),markMetrics=applyRules(base,field,rule,{
    iteration,trace:false
  });
  const markInk=field.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  const newPixels=dataContext.createImageData(w,h),out=newPixels.data;
  let count=0;
  // Letter pigment physically negotiates with what's already there:
  // high contrast darkens lighter areas; a dark ground opens light ink;
  // original multi-colour paint shows through the procedural deposits.
  for(let p=0;p<w*h;p++){
    const i=p*4,coverage=indexed[p]/255;
    const beforeLum=brightness(before,i);
    let markLum=brightness(markInk,i);
    const opposite=beforeLum>.48?.13:.88;
    // Blend actual procedural pigments with a contrasting ink reference.
    for(let channel=0;channel<3;channel++){
      const material=markInk[i+channel]*.52+opposite*255*.48;
      const blend=coverage*.92;
      out[i+channel]=Math.round(before[i+channel]*(1-blend)+material*blend);
    }
    out[i+3]=255;
    if(coverage>.1)count++;
  }
  canvas.getContext('2d').putImageData(newPixels,0,0);
  return {painted:true,text,count,bounds:{x:margin,y:chosen.top,w:boxWidth,h:height},
    mark:rule.mark,method:'stratified rule-bound text',strata:tierHeight,
    marks:markMetrics.strokes,source:'live painted canvas'};
}
function bias(candidate,seed){
  return candidate.distance*.018+
    ((Math.imul(candidate.j+1,2654435761)^(seed>>>0))>>>0)%71/100000;
}
