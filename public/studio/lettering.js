/* Hexfield Studio 296A — typography is built from actual glyphs, not pseudo-glyph fragments.
 * Rendered entirely with Canvas 2D. Editable text remains the source of truth. */
export const LETTER_STYLES=['geometric','minimal','heavy','elegant','experimental'];
export const LETTER_TYPES=['wordmark','monogram','emblem'];
const WIDTH=1200,HEIGHT=740;
const faces={
  geometric:{family:'Arial, Helvetica, sans-serif',weight:800,spacing:0.055},
  minimal:{family:'Arial, Helvetica, sans-serif',weight:400,spacing:0.17},
  heavy:{family:'Impact, "Arial Black", sans-serif',weight:900,spacing:.012},
  elegant:{family:'Georgia, "Times New Roman", serif',weight:600,spacing:.07},
  experimental:{family:'"Trebuchet MS", Arial, sans-serif',weight:900,spacing:.065},
};
function randomFrom(seed){let s=(Number(seed)>>>0)||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function letterRun(ctx,text,{font,weight,fontSize,tracking,x,y,paint,outline=false,variation=0}) {
  ctx.font=`${weight} ${fontSize}px ${font}`;ctx.textBaseline='alphabetic';
  const glyphs=Array.from(text);
  let w=0;
  const widths=glyphs.map(g=>{const n=ctx.measureText(g).width;w+=n;return n;});
  const gap=tracking*fontSize;
  w+=(glyphs.length-1)*gap;
  let cursor=x-w/2;
  for(let i=0;i<glyphs.length;i++){
    const g=glyphs[i];
    const yoffset=variation && i%5===2 ? -fontSize*.07 : 0;
    ctx.fillStyle=paint;
    if(outline){ctx.lineJoin='round';ctx.lineWidth=Math.max(1.6,fontSize*.012);ctx.strokeStyle=paint;ctx.strokeText(g,cursor,y+yoffset);}
    ctx.fillText(g,cursor,y+yoffset);
    cursor+=widths[i]+gap;
  }
  return w;
}
function spacedToFit(ctx,text,font,weight,targetWidth,maxFont=226,tracking=.05){
  let size=maxFont;
  while(size>28){ctx.font=`${weight} ${size}px ${font}`;
    const width=Array.from(text).reduce((sum,ch)=>sum+ctx.measureText(ch).width,0)+Math.max(0,Array.from(text).length-1)*size*tracking;
    if(width<targetWidth)break;size-=3;
  }
  return size;
}
const gradients={
  geometric:['#172a37','#229f9a'],minimal:['#232827','#232827'],
  heavy:['#222b42','#da6748'],elegant:['#423c50','#9e715b'],
  experimental:['#264d67','#d56758'],
};
function circle(ctx,x,y,r,col,width=2){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
function line(ctx,x1,y1,x2,y2,color,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=w;ctx.strokeStyle=color;ctx.stroke();}
export function cleanLogoText(raw){
  return String(raw||'HEXFIELD').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||'HEXFIELD';
}
export function renderLettering(canvas,recipe) {
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('2D canvas unavailable');
  const text=cleanLogoText(recipe.text);
  const style=LETTER_STYLES.includes(recipe.style)?recipe.style:'geometric';
  const type=LETTER_TYPES.includes(recipe.type)?recipe.type:'wordmark';
  const {family,weight,spacing}=faces[style];
  const rng=randomFrom(recipe.seed),ink=gradients[style][0],accent=gradients[style][1];
  const W=canvas.width,H=canvas.height;
  ctx.setTransform(W/WIDTH,0,0,H/HEIGHT,0,0);ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const word=type==='wordmark'?text:type==='monogram'?(text.includes(' ')?text.split(' ').map(x=>x[0]).join(''):text).slice(0,3):
    (text.includes(' ')?text.split(' ').map(x=>x[0]).join(''):text).slice(0,3);
  const letters=word.toLocaleUpperCase('en-AU');
  const size=spacedToFit(ctx,letters,family,weight,type==='wordmark'?920:370,type==='wordmark'?220:295,spacing);
  const tracking=spacing*(style==='experimental' ? .62:1);
  ctx.save();
  if(type==='emblem') {
    // Geometric frame around correctly shaped letters.
    circle(ctx,600,366,228,ink,11);
    circle(ctx,600,366,209,accent,2.6);
    if(style==='geometric'||style==='experimental'){
      line(ctx,395,366,805,366,accent,1.4);
    }
  }
  const baseY=type==='wordmark'?404:441;
  // Measure and centre to the actual glyph bounding boxes.
  letterRun(ctx,letters,{font:family,weight,fontSize:size,tracking,x:600,y:baseY,
    paint:ink,outline:style==='heavy',variation:style==='experimental'?1:0});
  if(type==='wordmark'){
    if(style==='geometric'){
      line(ctx,600-Math.min(445,size*letters.length*.31),447,600+Math.min(445,size*letters.length*.31),447,accent,7);
      circle(ctx,600,447,9,accent,2);
    } else if(style==='minimal'){
      line(ctx,390,467,810,467,ink,1.4);
    } else if(style==='heavy'){
      ctx.fillStyle=accent;ctx.fillRect(600-Math.min(360,size*letters.length*.23),458,Math.min(720,size*letters.length*.46),12);
    } else if(style==='elegant'){
      line(ctx,470,475,730,475,accent,1.7);
    } else if(style==='experimental'){
      const offset=between(rng,28,64);
      line(ctx,600-offset-260,462,600+offset+260,462,accent,9);
      line(ctx,600-offset-260,473,600+offset+260,473,ink,2);
    }
  } else if(type==='monogram') {
    if(style==='minimal')circle(ctx,600,360,258,ink,1.8);
    if(style==='geometric'||style==='heavy')line(ctx,390,518,810,518,accent,style==='heavy'?15:6);
    if(style==='experimental'){
      line(ctx,371,520,830,520,accent,10);
      circle(ctx,602,360,252,ink,3);
    }
  }
  ctx.restore();
  return {text,letters,style,type};
}
function between(rng,a,b){return a+(b-a)*rng();}
export function letteringDescription(recipe){return `${cleanLogoText(recipe.text)} / ${recipe.style} ${recipe.type}`;}
export function letteringFeatures(recipe){return {style:recipe.style,type:recipe.type,discipline:'lettering'};}
