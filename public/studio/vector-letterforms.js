/* HEXFIELD 335 / VECTOR LETTERFORMS — NO SYSTEM-FONT WARPING.
 * Manually drawn structural paths are the source of every Latin glyph.
 * Round is inflated geometry; block has squared stems and flat terminals.
 * A saved seed adjusts proportions, never destroys the letter skeleton.
 */
import {glyphTraits} from './type-genome.js';
import {repairGlyphMask} from './type-legibility.js';

const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
// Independent centreline constructions, not fonts or CSS outlines.
// Units are 0..1; each ; starts a NEW separate pen stroke.
// Loops have generous counters; compound characters retain open apertures.
export const VECTOR_GLYPHS=Object.freeze({
 A:'M .12 .92 L .32 .14 Q .50 -.02 .68 .14 L .88 .92; M .24 .58 L .76 .58',
 B:'M .15 .10 L .15 .90; M .16 .10 L .61 .10 Q .87 .10 .86 .30 Q .84 .48 .57 .49 L .16 .49; M .17 .49 L .62 .49 Q .92 .49 .86 .73 Q .84 .90 .16 .90',
 C:'M .86 .19 Q .49 -.03 .22 .22 Q .04 .50 .22 .79 Q .49 1.00 .86 .81',
 D:'M .15 .10 L .15 .90; M .16 .10 L .52 .10 Q .93 .10 .90 .50 Q .93 .90 .52 .90 L .16 .90',
 E:'M .86 .10 L .17 .10 L .17 .90 L .86 .90; M .18 .50 L .73 .50',
 F:'M .18 .92 L .18 .10 L .86 .10; M .18 .49 L .76 .49',
 G:'M .86 .19 Q .49 -.03 .22 .22 Q .04 .50 .22 .78 Q .50 1.00 .85 .80 L .85 .53 L .57 .53',
 H:'M .16 .10 L .16 .90; M .84 .10 L .84 .90; M .16 .51 L .84 .51',
 I:'M .24 .10 L .76 .10; M .50 .10 L .50 .90; M .24 .90 L .76 .90',
 J:'M .78 .10 L .78 .69 Q .78 .94 .48 .91 Q .21 .91 .15 .72',
 K:'M .15 .10 L .15 .90; M .84 .10 L .17 .53 L .86 .90',
 L:'M .16 .10 L .16 .90 L .86 .90',
 M:'M .10 .92 L .10 .12 Q .10 .04 .18 .13 L .50 .63 L .82 .13 Q .90 .04 .90 .12 L .90 .92',
 N:'M .15 .92 L .15 .10 L .85 .90 L .85 .10',
 O:'M .50 .10 C .92 .10 .92 .90 .50 .90 C .08 .90 .08 .10 .50 .10 Z',
 P:'M .16 .91 L .16 .10 L .61 .10 Q .88 .10 .88 .35 Q .88 .60 .61 .60 L .16 .60',
 Q:'M .50 .10 C .92 .10 .92 .90 .50 .90 C .08 .90 .08 .10 .50 .10 Z; M .61 .72 L .91 .97',
 R:'M .16 .92 L .16 .10 L .62 .10 Q .87 .10 .87 .34 Q .87 .57 .62 .57 L .16 .57; M .58 .57 L .88 .92',
 S:'M .83 .18 Q .57 .03 .30 .17 Q .07 .31 .26 .45 Q .41 .55 .66 .54 Q .94 .59 .82 .78 Q .57 .98 .16 .82',
 T:'M .10 .10 L .90 .10; M .50 .10 L .50 .91',
 U:'M .15 .10 L .15 .64 Q .15 .91 .50 .91 Q .85 .91 .85 .64 L .85 .10',
 V:'M .11 .10 L .41 .88 Q .50 1 .59 .88 L .89 .10',
 W:'M .08 .10 L .23 .89 L .49 .39 L .77 .89 L .92 .10',
 X:'M .15 .10 L .85 .90; M .85 .10 L .15 .90',
 Y:'M .11 .10 L .50 .53 L .89 .10; M .50 .53 L .50 .91',
 Z:'M .14 .10 L .86 .10 L .14 .90 L .86 .90',
 '0':'M .50 .10 C .90 .10 .90 .90 .50 .90 C .10 .90 .10 .10 .50 .10 Z',
 '1':'M .34 .27 L .54 .10 L .54 .90; M .31 .90 L .77 .90',
 '2':'M .19 .26 Q .23 .08 .52 .10 Q .90 .10 .85 .36 Q .83 .50 .18 .90 L .85 .90',
 '3':'M .19 .18 Q .50 .05 .72 .15 Q .93 .31 .63 .49 Q .95 .54 .80 .77 Q .59 1 .19 .82; M .40 .50 L .63 .49',
 '4':'M .71 .90 L .71 .10 L .17 .65 L .87 .65',
 '5':'M .84 .10 L .22 .10 L .20 .48 Q .54 .34 .76 .52 Q .96 .75 .71 .87 Q .48 1 .17 .80',
 '6':'M .80 .14 Q .45 -.02 .23 .40 Q .04 .79 .45 .90 Q .86 .97 .84 .69 Q .82 .43 .25 .58',
 '7':'M .13 .10 L .87 .10 L .39 .91',
 '8':'M .50 .10 Q .16 .10 .18 .30 Q .18 .48 .50 .50 Q .83 .48 .83 .30 Q .83 .10 .50 .10 Z; M .50 .50 Q .09 .51 .18 .76 Q .28 .99 .50 .90 Q .81 .99 .84 .76 Q .90 .51 .50 .50',
 '9':'M .76 .44 Q .30 .66 .18 .36 Q .09 .06 .50 .10 Q .92 .13 .79 .56 Q .70 .94 .19 .87',
 '!':'M .50 .12 L .50 .66; M .50 .88 L .50 .90',
 '?':'M .20 .24 Q .25 .10 .51 .10 Q .87 .10 .82 .37 Q .77 .52 .52 .58 L .52 .70; M .52 .88 L .52 .90',
 '.':'M .50 .88 L .50 .90',
 ',':'M .53 .84 L .42 1.00',
 ':':'M .50 .29 L .50 .31; M .50 .82 L .50 .84',
 '/':'M .16 .95 L .84 .05',
 '-':'M .18 .51 L .82 .51',
 '+':'M .17 .51 L .83 .51; M .50 .18 L .50 .83',
 '&':'M .84 .78 Q .50 1 .27 .78 Q .07 .58 .37 .40 Q .66 .23 .47 .11 Q .24 .03 .22 .24 Q .23 .54 .87 .92',
 '%':'M .16 .91 L .86 .09; M .28 .20 C .43 .20 .43 .41 .28 .41 C .13 .41 .13 .20 .28 .20 Z; M .72 .61 C .87 .61 .87 .82 .72 .82 C .57 .82 .57 .61 .72 .61 Z',
 '#':'M .37 .10 L .26 .90; M .72 .10 L .61 .90; M .14 .37 L .88 .37; M .10 .66 L .84 .66',
 '@':'M .76 .76 Q .52 .94 .28 .72 Q .10 .54 .27 .26 Q .50 -.01 .78 .26 Q .91 .41 .77 .63 Q .65 .76 .60 .61; M .60 .61 Q .40 .77 .34 .57 Q .28 .35 .50 .33 Q .75 .30 .60 .61',
 "'":'M .52 .09 L .47 .31',
 '"':'M .32 .09 L .29 .30; M .72 .09 L .69 .30',
 '(':'M .66 .06 Q .23 .48 .66 .96',
 ')':'M .34 .06 Q .77 .48 .34 .96',
 '=':'M .17 .39 L .83 .39; M .17 .65 L .83 .65',
 '_':'M .12 .96 L .88 .96'
});
const parse=text=>text.split(';').map(piece=>{
 const tokens=piece.match(/[MLQCZ]|-?(?:\d*\.\d+|\d+)/g)||[];
 const result=[];
 for(let i=0;i<tokens.length;){
  const kind=tokens[i++],count={M:2,L:2,Q:4,C:6,Z:0}[kind];
  if(count===undefined)throw Error('Unsupported vector letter command '+kind);
  const numbers=tokens.slice(i,i+count).map(Number);i+=count;
  if(numbers.some(n=>!Number.isFinite(n)))throw Error('Broken letter path '+text);
  result.push([kind,...numbers]);
 }
 return result;
});
const PATHS=Object.fromEntries(Object.entries(VECTOR_GLYPHS).map(
 ([name,definition])=>[name,parse(definition)]));
export const coversVectorGlyph=character=>character===' '||
 Object.prototype.hasOwnProperty.call(PATHS,String(character).toUpperCase());
const glyphWidth=character=>{
 if(character===' ')return .48;
 if('I1!.,:/()'.includes(character))return .70;
 if(character==='M'||character==='W')return 1.12;
 if(character==='?')return .94;
 return 1.0;
};

function drawPaths(ctx,character){
 const paths=PATHS[character.toUpperCase()];
 if(!paths)return false;
 for(const commands of paths){
  ctx.beginPath();
  for(const [kind,...v] of commands){
   switch(kind){
    case 'M':ctx.moveTo(v[0],v[1]);break;
    case 'L':ctx.lineTo(v[0],v[1]);break;
    case 'Q':ctx.quadraticCurveTo(...v);break;
    case 'C':ctx.bezierCurveTo(...v);break;
    case 'Z':ctx.closePath();break;
   }
  }
  ctx.stroke();
 }
 return true;
}
const alpha=c=>{
 const {width:w,height:h}=c;
 const {data}=c.getContext('2d',{willReadFrequently:true})
  .getImageData(0,0,w,h);
 const mask=new Uint8ClampedArray(w*h);
 for(let i=0;i<mask.length;i++)mask[i]=data[i*4+3];
 return mask;
};
function strokeWeight(style,trait){
 const emphasis=clamp((trait.top+trait.bottom)/2,.78,1.53);
 switch(style){
  case 'bubble':return .208*emphasis+.20*trait.bubble;
  case 'rounded':return .167*emphasis+.1*trait.bubble;
  case 'block':return .179*emphasis;
  case 'architectural':return .156*emphasis;
  case 'kinetic':return .144*emphasis;
  default:return .145*emphasis;
 }
}
/** Constructs complete physically drawn glyph masks, with no destructive
 * row translations or canvas-font mutation. Keeps the return contract of
 * the former buildMask so existing painting/quality code stays integrated.
 */
export function constructVectorLetters(text,w,h,bounds,choice){
 if(!w||!h)throw Error('Vector letters require a drawable canvas');
 const genome=choice.type,style=genome.grammar||'bubble',
  inflated=style==='bubble'||style==='rounded',
  square=style==='block'||style==='architectural';
 const characters=Array.from(String(text||''));
 const maxWidth=w*(bounds.widthRatio||.92);
 const band=Math.max(22,bounds.height||h*.24);
 let size=Math.min(band*.96,w/Math.max(2,characters.length*.48));
 const partsFor=fontSize=>{
  const tracking=fontSize*(.14+genome.tracking);
  const items=characters.map((char,i)=>{
   const shape=glyphTraits(genome,char,i);
   return {char,shape,width:fontSize*glyphWidth(char)*shape.width};
  });
  const total=items.reduce((a,x)=>a+x.width,0)+
   Math.max(0,items.length-1)*tracking;
  return {items,tracking,total};
 };
 let layout=partsFor(size);
 while(size>11&&layout.total>maxWidth){
  size*=.95;layout=partsFor(size);
 }
 const scale=Math.min(1,maxWidth/Math.max(1,layout.total));
 const xStart=(bounds.centerX??w*.5)-layout.total*scale/2;
 const yStart=bounds.top+(band-size)/2;
 const outside=create(w,h),inside=create(w,h);
 const outer=outside.getContext('2d'),inner=inside.getContext('2d');
 const parts=[];let at=0,fallbacks=0;
 for(const entry of layout.items){
  const {char,shape}=entry;
  const x0=xStart+at*scale,advance=entry.width*scale,
   x1=x0+advance;
  const top=Math.max(0,yStart-size*.05),
   bottom=Math.min(h,yStart+size*1.06);
  parts.push({char,x0,x1,top,bottom,shape});
  at+=entry.width+layout.tracking;
  if(char===' ')continue;
  const weight=strokeWeight(style,shape);
  if(!coversVectorGlyph(char)){
   // Preserve user-provided multilingual characters faithfully: never
   // drop unsupported code points or render placeholder boxes by design.
   for(const [ctx,extra] of [[outer,.12],[inner,0]]){
    ctx.save();ctx.fillStyle='#fff';
    ctx.strokeStyle='#fff';
    ctx.font='800 '+Math.max(12,Math.round(size*.81))+'px sans-serif';
    ctx.textBaseline='middle';
    ctx.lineWidth=Math.max(0,size*extra);
    ctx.lineJoin='round';
    ctx.strokeText(char,x0+size*.08,yStart+size*.52);
    ctx.fillText(char,x0+size*.08,yStart+size*.52);
    ctx.restore();
   }
   fallbacks++;continue;
  }
  for(const [ctx,isOutside] of [[outer,true],[inner,false]]){
   ctx.save();
   ctx.translate(x0,yStart);
   ctx.scale(size*glyphWidth(char)*shape.width*scale,size);
   ctx.transform(1,0,shape.slant*(style==='kinetic'?1.6:.28),1,0,0);
   ctx.strokeStyle='#fff';
   ctx.lineCap=inflated?'round':square?'square':'round';
   ctx.lineJoin=inflated?'round':square?'miter':'bevel';
   ctx.miterLimit=2;
   const radius=isOutside?weight:inflated?Math.max(.103,weight-.095):
     Math.max(.113,weight-.014);
   ctx.lineWidth=radius;
   drawPaths(ctx,char);
   ctx.restore();
  }
 }
 const pixels=alpha(outside),core=alpha(inside);
 const corrected=repairGlyphMask(core,pixels,w,h,parts);
 return {pixels:corrected.pixels,core,size,
  font:'900 '+Math.max(10,Math.round(size))+'px sans-serif',
  parts,anatomy:style+'/'+genome.root+' / '+genome.generation,
  typeLegibility:corrected.evidence,
  vectorGlyphs:characters.length-fallbacks,
  fallbackGlyphs:fallbacks,
  construction:inflated?'inflated-vector-strokes':
    square?'square-ended-vector-strokes':'vector-strokes'};
}
