/* HEXFIELD 315 / CHROMATIC WORD APPLICATION
 * Text is a geometry mask, NEVER a stock font layer sitting over a painting.
 * It mutates as a series of executable spatial operations, then receives the
 * rule painter's actual source-derived marks, colour and counterpoint.
 * Internal masks are calculation buffers; only the production canvas is shown.
 */
import {applyRules,makeRecipe} from './rule-engine.js';
import {coupleWordGeometry,chooseGeometryRelation} from './geometry-coupling.js';
import {validDirtyTiles} from './dirty-tiles.js';
import {glyphTraits,typeGenome,validTypeGenome} from './type-genome.js';
import {validDesignGenome,newDesignGenome,designBounds,paintDesignAccent} from './design-genome.js';
import {assessGlyphMask,repairGlyphMask} from './type-legibility.js';
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
  const skeleton=create(w,h),base=skeleton.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.textAlign='left';
  base.fillStyle='#fff';base.textBaseline='middle';base.textAlign='left';
  const letters=[...text],maxWidth=w*(bounds.widthRatio||.92);
  const genome=choice.type;
  const bubble=genome.grammar==='bubble'||genome.grammar==='rounded';
  const block=genome.grammar==='block'||genome.grammar==='architectural';
  let size=Math.min(bounds.height*.77,w/Math.max(2,letters.length*.49));
  // Actual heavyweight glyph outlines are the source of the mutation.
  // Do not sample a randomly chosen thin or italic face for display copy.
  const font=px=>(bubble?'700 system-ui':block?'900 sans-serif':
    choice.family.face.replace(/900/,'850'))
    .replace(/(700|850|900)/, '$1 '+Math.max(10,Math.round(px))+'px');
  const metrics=px=>{
    ctx.font=font(px);
    const glyphs=letters.map((ch,i)=>{
      const shape=glyphTraits(genome,ch,i);
      return {ch,i,shape,advance:ctx.measureText(ch).width*shape.width};
    });
    const tracking=px*genome.tracking;
    return {glyphs,tracking,total:glyphs.reduce((v,g)=>v+g.advance,0)+
      Math.max(0,glyphs.length-1)*tracking};
  };
  let layout=metrics(size);
  while(size>10&&layout.total>maxWidth){size*=.92;layout=metrics(size);}
  base.font=font(size);
  const scale=Math.min(1,maxWidth/Math.max(1,layout.total)),
    centerY=bounds.top+bounds.height*.52,
    left=(bounds.centerX??w*.5)-layout.total*scale*.5;
  const owner=new Int16Array(w).fill(-1),parts=[];
  let at=0;
  for(const glyph of layout.glyphs){
    const x0=left+at*scale,x1=x0+glyph.advance*scale;
    parts.push({x0,x1,char:glyph.ch,shape:glyph.shape,
      top:Math.max(0,centerY-size*.73),
      bottom:Math.min(h,centerY+size*.73)});
    ctx.save();ctx.translate(x0,centerY);
    ctx.scale(scale*glyph.shape.width,1);
    ctx.transform(1,0,glyph.shape.slant,1,0,0);
    const stroke=Math.min(size*.13,Math.max(1,size*glyph.shape.outline));
    ctx.lineWidth=stroke;
    ctx.lineJoin=bubble?'round':block?'miter':'round';
    ctx.miterLimit=block?2.5:1.2;
    ctx.strokeStyle='#fff';
    ctx.strokeText(glyph.ch,0,0);
    ctx.fillText(glyph.ch,0,0);
    ctx.restore();
    // Reference is the exact un-mutated glyph skeleton at identical
    // coordinates. It is not an OCR guess or a second final text layer.
    base.save();base.translate(x0,centerY);
    base.scale(scale*glyph.shape.width,1);
    base.transform(1,0,glyph.shape.slant,1,0,0);
    base.fillText(glyph.ch,0,0);base.restore();
    at+=glyph.advance+layout.tracking;
  }
  // Every letter owns its own top and bottom morphology, including its
  // true irregular width, bubble, split, slant and stem thickness.
  // Attribution is a single O(width * letters) preprocessing pass.
  for(let i=0;i<parts.length;i++){
    const item=parts[i],lo=Math.max(0,Math.floor(item.x0-size*.10)),
      hi=Math.min(w,Math.ceil(item.x1+size*.10));
    for(let x=lo;x<hi;x++)owner[x]=i;
  }
  const old=ctx.getImageData(0,0,w,h).data;
  const pixels=new Uint8ClampedArray(w*h),
    stride=Math.max(2,Math.round(size*.22));
  const minY=Math.max(0,bounds.top-8),maxY=Math.min(h,bounds.top+bounds.height+9);
  for(let y=minY;y<maxY;y++){
    const row=y*w,group=Math.floor((y-bounds.top)/stride),
      phase=(y-bounds.top)/Math.max(1,bounds.height);
    for(let x=0;x<w;x++){
      const part=owner[x]>=0?parts[owner[x]]:null;
      const trait=part?.shape;
      let shift=0;
      switch(choice.index){
        case 0:shift=Math.sin((y-bounds.top)/Math.max(2,size)*7)*size*.008;break;
        case 1:shift=phase<.47?-size*.009:size*.009;break;
        case 2:shift=((group&1)?-1:1)*size*.014;break;
        case 3:shift=-size*.007;break;
        case 4:shift=((group+Math.floor(x/Math.max(4,size*.4)))&1)?size*.009:-size*.009;break;
        case 5:shift=Math.sin(x/Math.max(3,size*.21))*size*.012;break;
        case 6:shift=((group%3)-1)*size*.013;break;
        default:shift=Math.sin((y-bounds.top)/Math.max(2,size*.24))*size*.007;
      }
      // This is a structural upper/lower split on EACH glyph, not a
      // uniformly tinted stock-font string.
      if(trait)shift+=(phase<.48?-1:1)*trait.split*size;
      const sx=Math.round(x-shift);
      if(sx<0||sx>=w)continue;
      let value=old[(row+sx)*4+3];
      const weight=trait?(phase<.48?trait.top:trait.bottom):1;
      // Controlled round or square stroke dilation, NOT accidental half
      // glyph erasure; thin counters survive because expansion is capped.
      const expansion=trait?
        Math.max(0,Math.min(4,Math.round(size*(trait.bubble*.13+
          Math.max(0,weight-1)*.026)))):0;
      const legacy=0;
      for(let d=1;d<=Math.max(expansion,legacy);d++){
        if(sx+d<w)value=Math.max(value,old[(row+sx+d)*4+3]);
        if(sx-d>=0)value=Math.max(value,old[(row+sx-d)*4+3]);
        if(d<=expansion&&y+d<h)
          value=Math.max(value,old[((y+d)*w+sx)*4+3]);
        if(d<=expansion&&y-d>=0)
          value=Math.max(value,old[((y-d)*w+sx)*4+3]);
      }
      if(weight<1)value=Math.round(255*Math.pow(value/255,1+(1-weight)*2));
      // Material texture may still change, but it never punches random
      // holes through the character skeleton or obliterates letter counters.
      pixels[row+x]=value;
    }
  }
  const baseline=base.getImageData(0,0,w,h).data;
  const reference=new Uint8ClampedArray(w*h);
  for(let p=0;p<reference.length;p++)reference[p]=baseline[p*4+3];
  const corrected=repairGlyphMask(reference,pixels,w,h,parts);
  return {pixels:corrected.pixels,size,font:ctx.font,parts,
    typeLegibility:corrected.evidence,
    anatomy:genome.grammar+'/'+genome.root+' / '+genome.generation};
}
export function paintWordsOnCanvas(canvas,words,{
  recipe=null,seed=1,iteration=0,sourceCanvas=null,relation=null,dirtyTiles=null
}={}){
  if(!canvas?.getContext)return {painted:false,reason:'no canvas'};
  const copy=String(words||'').replace(/\s+/g,' ').trim().slice(0,96);
  if(!copy)return {painted:false,reason:'no words'};
  const design=validDesignGenome(recipe?.designGenome)?recipe.designGenome:
    newDesignGenome(recipe?.purpose||'art',seed);
  const blocks=design.purpose==='art'?[copy]:copy.split('|').map(s=>s.trim()).filter(Boolean);
  const text=(blocks[0]||copy).slice(0,48);
  const w=canvas.width,h=canvas.height,source=sourceCanvas||canvas;
  const partial=validDirtyTiles(dirtyTiles,w,h);
  if(!w||!h)return {painted:false,reason:'empty canvas'};
  const origin=create(w,h),og=origin.getContext('2d',{willReadFrequently:true});
  og.drawImage(source,0,0,w,h);
  const initial=og.getImageData(0,0,w,h).data;
  const signature=recipe?.markProgram?.signature||recipe?.mark||'hybrid';
  const choice=wordApplication(seed,iteration,signature);
  choice.type=validTypeGenome(recipe?.typeGenome)?recipe.typeGenome:typeGenome(seed);
  const bounds=designBounds(initial,w,h,design,seed)||chooseBand(initial,w,h,seed);
  const accented=paintDesignAccent(og,initial,w,h,bounds,design);
  const before=accented?og.getImageData(0,0,w,h).data:initial;
  const built=buildMask(text,w,h,bounds,choice);
  const {pixels:letters,size,font,parts,anatomy}=built;
  const letterQuality=[built.typeLegibility];
  // A single optional pipe-delimited input supports a real headline, detail
  // and action line without exposing a second screen full of ad controls.
  let glyphCount=parts.length;
  if(design.purpose!=='art'&&blocks.length>1){
    for(let i=1;i<Math.min(3,blocks.length);i++){
      const top=Math.round(h*(i===1?.73:.865));
      const supporting={top,height:Math.max(20,Math.round(h*(i===1?.115:.093))),
        centerX:bounds.centerX,widthRatio:Math.min(.82,bounds.widthRatio+.07)};
      const sub=buildMask(blocks[i].slice(0,32),w,h,supporting,choice);
      glyphCount+=sub.parts.length;letterQuality.push(sub.typeLegibility);
      for(let p=0;p<letters.length;p++)letters[p]=
        Math.max(letters[p],Math.round(sub.pixels[p]*(i===1?.95:1)));
    }
  }
  // The original art and the word now push back on one another as geometry.
  // This happens before chromatic deposition, not in an overlay after scoring.
  const selectedRelation=relation||recipe?.wordRelation||
    chooseGeometryRelation(seed,iteration);
  const coupled=coupleWordGeometry(before,letters,w,h,{
    seed,relation:selectedRelation,bounds,size
  });
  const mask=coupled.mask,scene=coupled.scene;
  // We retain readable foreground cores even when a scene edge negotiates
  // a weave or carve. New pixels outside the original outline still flow.
  for(let p=0;p<mask.length;p++)
    if(letters[p]>200)mask[p]=Math.max(mask[p],Math.round(letters[p]*.94));
  // Protect the actual legible foreground after scene-edge coupling too.
  const geometryRepair=repairGlyphMask(letters,mask,w,h,parts);
  if(geometryRepair.evidence.repaired)mask.set(geometryRepair.pixels);
  const colours=palette(before,w,h,choice);
  const rule=recipe?.mark?{...recipe,seed:seed>>>0}:
    makeRecipe({subject:'abstract',primary:'no_shading',mark:'hybrid',seed:seed>>>0});
  // Source-driven material is rendered at an internal bounded resolution.
  // Keeping the type mask at full canvas resolution preserves crisp anatomy,
  // while limiting redundant mobile mark simulation per candidate.
  const pw=Math.min(partial?320:480,w),ph=Math.min(partial?200:300,h);
  const pattern=create(pw,ph);
  const marks=applyRules(source,pattern,rule,{iteration});
  const inkSource=create(w,h),inkCtx=inkSource.getContext('2d',{willReadFrequently:true});
  inkCtx.drawImage(pattern,0,0,w,h);
  const pigment=inkCtx.getImageData(0,0,w,h).data;
  const out=og.createImageData(w,h),d=out.data;
  let count=0,chromatic=0,contrast=0;
  const layers=[colours.first,colours.second,colours.third];
  // A word is an interactively placed material; pixel deposits use actual
  // painter colour, geometric rhythm and the local background contrast.
  for(let p=0;p<w*h;p++){
    const i=p*4,coverage=mask[p]/255;
    const x=p%w,y=(p/w)|0;
    let ink=0;
    if(coverage>0){
      // One intentional ink per word, not a new pigment every few pixels.
      // Small banded colours used to make the letter look scrambled.
      const role=(choice.key>>>5)%3;
      const band=layers[role],beforeLight=lum(scene,i);
      const materialLight=lum(pigment,i);
      // Resolve a genuine luminance contrast BEFORE applying chromatic ink.
      // Previous independent pigments could closely match local background,
      // making text almost invisible even though the mask was valid.
      const inkHue=hue(band)??(choice.key%360);
      const strong=rgbOf(inkHue,.94,beforeLight>.52?.14:.86);
      ink=strong.map(v=>clamp(Math.round(v+(materialLight-.5)*9),0,255));
      count++;
      if(Math.max(...ink)-Math.min(...ink)>48)chromatic++;
      contrast+=Math.abs(beforeLight-(ink[0]*.2126+ink[1]*.7152+
        ink[2]*.0722)/255);
    }
    for(let ch=0;ch<3;ch++)d[i+ch]=coverage>0?
      Math.round(scene[i+ch]*(1-coverage*.995)+ink[ch]*coverage*.995):scene[i+ch];
    d[i+3]=255;
  }
  const target=canvas.getContext('2d');
  if(partial){
    // putImageData ignores Canvas clipping. Upload only the dirty rectangles:
    // the parent letter structure remains byte-for-byte identical elsewhere.
    for(const t of dirtyTiles)
      target.putImageData(out,0,0,t.x,t.y,t.w,t.h);
  }else target.putImageData(out,0,0);
  const typeLegibility={...letterQuality[0],
    score:+Math.min(geometryRepair.evidence.score,
      letterQuality.reduce((s,q)=>s+q.score,0)/letterQuality.length).toFixed(4),
    readable:letterQuality.every(q=>q.readable)&&geometryRepair.evidence.readable,
    repaired:letterQuality.some(q=>q.repaired)||geometryRepair.evidence.repaired,
    counters:Math.min(letterQuality[0].counters,geometryRepair.evidence.counters),
    spacing:Math.min(letterQuality[0].spacing,geometryRepair.evidence.spacing),
    lines:letterQuality.length};
  return {painted:true,text:copy,count,typeLegibility,
    legibility:count?+clamp(contrast/count*2.6,0,1).toFixed(4):0,
    design:{purpose:design.purpose,root:design.root,
      ornament:design.ornament,activity:bounds.activity??null},
    chromaticFraction:count?chromatic/count:0,
    bounds:{x:Math.round(w*.04),y:bounds.top,w:Math.round(w*.92),h:bounds.height},
    mark:rule.mark,method:choice.name,face:choice.family.name,fontSize:Math.round(size),font,
    typeAnatomy:anatomy,glyphs:glyphCount,
    palette:layers.map(hex),marks:marks.strokes,interaction:coupled.stats,
    source:'live painted canvas',partial};
}
