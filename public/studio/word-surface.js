/* HEXFIELD 315 / CHROMATIC WORD APPLICATION
 * Text is a geometry mask, NEVER a stock font layer sitting over a painting.
 * It mutates as a series of executable spatial operations, then receives the
 * rule painter's actual source-derived marks, colour and counterpoint.
 * Internal masks are calculation buffers; only the production canvas is shown.
 */
import {applyRules,makeRecipe} from './rule-engine.js';
import {coupleWordGeometry,chooseGeometryRelation} from './geometry-coupling.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const lum=(data,i)=>(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255;
const hash=(s)=>{
  let x=2166136261>>>0;for(const ch of String(s))x=Math.imul(x^ch.charCodeAt(0),16777619);
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;return(x>>>0);
};
const rand=(seed,tag)=>hash(seed+'|'+tag)/4294967296;
const phi=.618033988749895;
const hue=(rgb)=>{
  const [r,g,b]=rgb.map(v=>v/255),lo=Math.min(r,g,b),hi=Math.max(r,g,b),d=hi-lo;
  if(d<.001)return null;
  const h=hi===r?(g-b)/d%6:hi===g?(b-r)/d+2:(r-g)/d+4;
  return ((h*60)%360+360)%360;
};
const rgbOf=(h,s,l)=>{
  const chroma=(1-Math.abs(2*l-1))*s,z=chroma*(1-Math.abs((h/60)%2-1)),v=l-chroma/2;
  let a=[0,0,0];
  if(h<60)a=[chroma,z,0];else if(h<120)a=[z,chroma,0];
  else if(h<180)a=[0,chroma,z];else if(h<240)a=[0,z,chroma];
  else if(h<300)a=[z,0,chroma];else a=[chroma,0,z];
  return a.map(x=>Math.round(clamp((x+v)*255,0,255)));
};
const hex=rgb=>'#'+rgb.map(x=>x.toString(16).padStart(2,'0')).join('');
const FAMILIES=Object.freeze([
  {name:'geometric',face:'900 sans-serif',width:1,slant:0},
  {name:'soft',face:'900 system-ui',width:.93,slant:0},
  {name:'editorial',face:'900 Georgia, serif',width:1.08,slant:0},
  {name:'mechanical',face:'900 monospace',width:.86,slant:0},
  {name:'italic',face:'italic 900 serif',width:1.04,slant:.12}
]);
export const WORD_APPLICATIONS=Object.freeze([
  'inflated counters','upper-heavy split','sheared strata',
  'cutaway stencil','chromatic misregistration','faceted terminals',
  'raked letterpress','dual-outline'
]);
export function wordApplication(seed=1,generation=0,signature=''){
  const key=hash(seed+'-'+generation+'-'+signature);
  return {name:WORD_APPLICATIONS[key%WORD_APPLICATIONS.length],
    family:FAMILIES[(key>>>4)%FAMILIES.length],
    index:key%WORD_APPLICATIONS.length,
    jitter:rand(key,'jitter'),key};
}
function palette(before,w,h,choice){
  const swatches=[],stride=Math.max(19,Math.round(w*h/180));
  for(let p=0;p<w*h;p+=stride){
    const i=p*4,c=[before[i],before[i+1],before[i+2]],hueFound=hue(c);
    if(hueFound!=null&&Math.max(...c)-Math.min(...c)>=38)swatches.push(hueFound);
  }
  const sourceHue=swatches.length?swatches[choice.key%swatches.length]:
    ((choice.key>>>7)%360);
  // Golden-angle family: two chromatic inks derived from actual canvas hues.
  // Bounded chromatic deviation prevents a short source palette from
  // collapsing every new font generation onto the same four ink colours.
  const offset=(rand(choice.key,'pigment-variation')-.5)*67;
  const a=(sourceHue+137.50776405*(1+Math.floor(choice.jitter*4))+offset+360)%360;
  const b=(a+137.50776405)%360;
  return {first:rgbOf(a,.84,.45),second:rgbOf(b,.79,.54),
    third:rgbOf((b+137.50776405)%360,.81,.46)};
}
function chooseBand(before,w,h,seed){
  const bands=[.21,.39,.60,.78],height=Math.max(16,Math.round(h*.24));
  const scored=bands.map((y,j)=>{
    const top=Math.round(clamp(h*y-height/2,0,h-height)),bottom=Math.min(h,top+height);
    let changes=0;
    for(let py=top+2;py<bottom;py+=5)for(let x=8;x<w-8;x+=7){
      const i=(py*w+x)*4,up=((py-2)*w+x)*4;
      changes+=Math.abs(lum(before,i)-lum(before,up));
    }
    return {top,activity:changes+Math.abs(y-phi)*.15+rand(seed,'band'+j)*.09};
  });
  scored.sort((a,b)=>a.activity-b.activity);
  return {top:scored[0].top,height};
}
function buildMask(text,w,h,bounds,choice){
  const mask=create(w,h),ctx=mask.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.textAlign='center';
  const words=[...text],maxWidth=w*.92;
  let size=Math.min(bounds.height*.77,w/Math.max(2,words.length*.49));
  // CSS canvas font shorthand requires "weight SIZE family", not
  // "SIZE weight family". The old invalid order silently fell back to
  // 10px sans-serif, making text effectively disappear in the painting.
  const font=px=>choice.family.face.replace(/900/,
    String(choice.index===1?900:850)+' '+Math.max(10,Math.round(px))+'px');
  while(size>10){
    ctx.font=font(size);
    if(ctx.measureText(text).width*choice.family.width<=maxWidth)break;
    size*=.92;
  }
  ctx.font=font(size);
  const width=ctx.measureText(text).width,scale=Math.min(1,maxWidth/Math.max(1,width));
  ctx.save();ctx.translate(w*.5,bounds.top+bounds.height*.52);
  ctx.scale(scale*choice.family.width,1);
  ctx.transform(1,0,choice.family.slant,1,0,0);
  ctx.fillText(text,0,0);
  ctx.restore();
  const old=ctx.getImageData(0,0,w,h).data;
  const pixels=new Uint8ClampedArray(w*h),stride=Math.max(2,Math.round(size*.22));
  const minY=Math.max(0,bounds.top-5),maxY=Math.min(h,bounds.top+bounds.height+6);
  for(let y=minY;y<maxY;y++){
    const row=y*w,group=Math.floor((y-bounds.top)/stride),phase=(y-bounds.top)/Math.max(1,bounds.height);
    for(let x=0;x<w;x++){
      let shift=0;
      switch(choice.index){
        case 0:shift=Math.sin((y-bounds.top)/Math.max(2,size)*7)*size*.07;break;
        case 1:shift=phase<.47?-size*.036:size*.04;break;
        case 2:shift=((group&1)?-1:1)*size*.105;break;
        case 3:shift=((Math.floor(x/Math.max(3,size*.20))+group)%7===0)?w:-size*.025;break;
        case 4:shift=((group+Math.floor(x/Math.max(4,size*.4)))&1)?size*.047:-size*.043;break;
        case 5:shift=Math.sin(x/Math.max(3,size*.21))*size*.053;break;
        case 6:shift=((group%3)-1)*size*.08;break;
        default:shift=Math.sin((y-bounds.top)/Math.max(2,size*.24))*size*.023;
      }
      let sx=Math.round(x-shift);
      if(sx<0||sx>=w)continue;
      let value=old[(row+sx)*4+3];
      const expansion=(choice.index===0||choice.index===1&&phase<.5)?Math.max(1,Math.round(size*.025)):0;
      if(expansion>0)for(let d=1;d<=expansion;d++){
        if(sx+d<w)value=Math.max(value,old[(row+sx+d)*4+3]);
        if(sx-d>=0)value=Math.max(value,old[(row+sx-d)*4+3]);
      }
      if(choice.index===6&&((y+Math.floor(x*.22))%Math.max(4,Math.round(size*.12))===0))value=Math.round(value*.25);
      if(choice.index===3&&x%Math.max(7,Math.round(size*.42))<size*.043)value=Math.round(value*.10);
      pixels[row+x]=value;
    }
  }
  return {pixels,size,font:ctx.font};
}
export function paintWordsOnCanvas(canvas,words,{
  recipe=null,seed=1,iteration=0,sourceCanvas=null,relation=null
}={}){
  if(!canvas?.getContext)return {painted:false,reason:'no canvas'};
  const text=String(words||'').replace(/\s+/g,' ').trim().slice(0,48);
  if(!text)return {painted:false,reason:'no words'};
  const w=canvas.width,h=canvas.height,source=sourceCanvas||canvas;
  if(!w||!h)return {painted:false,reason:'empty canvas'};
  const origin=create(w,h),og=origin.getContext('2d',{willReadFrequently:true});
  og.drawImage(source,0,0,w,h);
  const before=og.getImageData(0,0,w,h).data;
  const signature=recipe?.markProgram?.signature||recipe?.mark||'hybrid';
  const choice=wordApplication(seed,iteration,signature);
  const bounds=chooseBand(before,w,h,seed);
  const {pixels:letters,size,font}=buildMask(text,w,h,bounds,choice);
  // The original art and the word now push back on one another as geometry.
  // This happens before chromatic deposition, not in an overlay after scoring.
  const selectedRelation=relation||recipe?.wordRelation||
    chooseGeometryRelation(seed,iteration);
  const coupled=coupleWordGeometry(before,letters,w,h,{
    seed,relation:selectedRelation,bounds,size
  });
  const mask=coupled.mask,scene=coupled.scene;
  const colours=palette(before,w,h,choice);
  const rule=recipe?.mark?{...recipe,seed:seed>>>0}:
    makeRecipe({subject:'abstract',primary:'no_shading',mark:'hybrid',seed:seed>>>0});
  // Source-driven material is rendered at an internal bounded resolution.
  // Keeping the type mask at full canvas resolution preserves crisp anatomy,
  // while limiting redundant mobile mark simulation per candidate.
  const pw=Math.min(480,w),ph=Math.min(300,h);
  const pattern=create(pw,ph);
  const marks=applyRules(source,pattern,rule,{iteration});
  const inkSource=create(w,h),inkCtx=inkSource.getContext('2d',{willReadFrequently:true});
  inkCtx.drawImage(pattern,0,0,w,h);
  const pigment=inkCtx.getImageData(0,0,w,h).data;
  const out=og.createImageData(w,h),d=out.data;
  let count=0,chromatic=0;
  const layers=[colours.first,colours.second,colours.third];
  // A word is an interactively placed material; pixel deposits use actual
  // painter colour, geometric rhythm and the local background contrast.
  for(let p=0;p<w*h;p++){
    const i=p*4,coverage=mask[p]/255;
    const x=p%w,y=(p/w)|0;
    let ink=0;
    if(coverage>0){
      const stripe=Math.floor((x+y*.46)/Math.max(3,size*.18));
      const role=(stripe+((choice.key>>>5)%3)+Math.floor(y/Math.max(5,size*.3)))%3;
      const band=layers[role],beforeLight=lum(scene,i);
      const materialLight=lum(pigment,i);
      const hueColor=band.map((v,ch)=>clamp(Math.round(v*.82+pigment[i+ch]*.18),0,255));
      // Source-sensitive contrast is achieved by luminance, not greyscaling.
      const bright=beforeLight<.46?1.18:.83;
      ink=hueColor.map(v=>clamp(Math.round(v*bright+(materialLight-.5)*27),0,255));
      count++;
      if(Math.max(...ink)-Math.min(...ink)>48)chromatic++;
    }
    for(let ch=0;ch<3;ch++)d[i+ch]=coverage>0?
      Math.round(scene[i+ch]*(1-coverage*.94)+ink[ch]*coverage*.94):scene[i+ch];
    d[i+3]=255;
  }
  canvas.getContext('2d').putImageData(out,0,0);
  return {painted:true,text,count,chromaticFraction:count?chromatic/count:0,
    bounds:{x:Math.round(w*.04),y:bounds.top,w:Math.round(w*.92),h:bounds.height},
    mark:rule.mark,method:choice.name,face:choice.family.name,fontSize:Math.round(size),font,
    palette:layers.map(hex),marks:marks.strokes,interaction:coupled.stats,
    source:'live painted canvas'};
}
