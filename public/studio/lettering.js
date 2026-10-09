/* Hexfield 296: evolving construction strategies for readable letterforms.
 * Letterforms stay rooted in recognizable font outlines; the *procedures* for
 * transforming, joining, weighting, cutting and framing them are heritable.
 * An experiment changes its glyph-making procedure, not merely its position.
 */
import {makeGenome,randomFrom,methodDescription,evaluateSurface} from './evolution.js';
import {paintAnatomyWord} from './anatomy-renderer.js';
export const LETTER_STYLES=['anatomy','geometric','minimal','heavy','elegant','experimental'];
export const LETTER_TYPES=['wordmark','monogram','emblem'];
const W=1200,H=740,PI=Math.PI;
const FONTS={
 anatomy:{font:'Arial, Helvetica, sans-serif',weight:750},
 geometric:{font:'Arial, Helvetica, sans-serif',weight:750},
 minimal:{font:'Arial, Helvetica, sans-serif',weight:400},
 heavy:{font:'Impact, "Arial Black", sans-serif',weight:900},
 elegant:{font:'Georgia, "Times New Roman", serif',weight:600},
 experimental:{font:'"Trebuchet MS", Arial, sans-serif',weight:800}
};
const PALETTES=[['#202d2c','#6b8374','#f4f0e9'],['#212b43','#c3885f','#f3f0e8'],
 ['#392e42','#cc735c','#f3eee7'],['#263f53','#7bbaa9','#f5f4ec']];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cleanLogoText(raw){return String(raw||'HEXFIELD').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||'HEXFIELD';}
function monoOf(text){const initials=text.split(/\s+/).map(x=>x[0]).join('');return (text.includes(' ')?initials:text).slice(0,3).toUpperCase();}
function fontFor(ctx,family,weight,size){ctx.font=`${weight} ${size}px ${family}`;ctx.textBaseline='alphabetic';ctx.textAlign='left';}
function widthOf(ctx,text,track){return [...text].reduce((v,g)=>v+ctx.measureText(g).width,0)+Math.max(0,[...text].length-1)*track;}
function line(ctx,a,b,col,size,opacity=1){ctx.save();ctx.globalAlpha=opacity;ctx.strokeStyle=col;ctx.lineCap='square';ctx.lineWidth=size;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.restore();}
function paintFrame(ctx,g,ink,accent){
 if(g.letterFrame==='none')return;
 ctx.strokeStyle=ink;ctx.lineWidth=3;
 if(g.letterFrame==='ring'){
   ctx.beginPath();ctx.ellipse(W/2,H/2,390,286,0,0,PI*2);ctx.stroke();
 }else if(g.letterFrame==='box'){
   ctx.strokeRect(130,102,940,530);line(ctx,[142,621],[1058,621],accent,2,.52);
 }else if(g.letterFrame==='brackets'){
   line(ctx,[150,215],[150,520],ink,6);line(ctx,[150,215],[218,215],accent,6);
   line(ctx,[1050,215],[1050,520],ink,6);line(ctx,[982,215],[1050,215],accent,6);
 }else if(g.letterFrame==='rails'){
   line(ctx,[175,227],[1025,227],accent,6);line(ctx,[175,550],[1025,550],ink,6);
 }
}
function drawGlyph(ctx,glyph,atY,size,params){
 const {x,advance,index,genome:g,ink,accent,bg}=params;
 ctx.save();ctx.translate(x,atY);
 const form=g.letterForm;
 const shear=clamp((g.angle||0)+(form==='shear'?.19:0),-.38,.38);
 if(shear)ctx.transform(1,0,shear,1,-shear*size*.6,0);
 if(form==='squeeze')ctx.transform(.82,0,0,1,.09*advance,0);
 if(form==='stagger')ctx.translate(0,(index%3===1?-1:1)*size*.035);
 if(form==='waist')ctx.transform(1,0,0,index%2===0?1.04:.95,0,0);
 const mass=clamp(Number(g.mass)||1,.5,1.75);
 const fill=()=>{ctx.fillStyle=ink;ctx.fillText(glyph,0,0);};
 const out=(color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.strokeText(glyph,0,0);};
 const mode=g.letterStroke;
 if(mode==='solid'){fill();if(mass>1.05)out(ink,(mass-1)*size*.035);}
 else if(mode==='outline'){out(ink,clamp(size*.029*mass,1.4,9));}
 else if(mode==='inline'){
   out(ink,clamp(size*.072*mass,5,19));out(bg,clamp(size*.030,2,6));
 }else if(mode==='double'){
   ctx.save();ctx.translate(size*.042,size*.042);out(accent,clamp(size*.055*mass,3,12));ctx.restore();fill();
 }else if(mode==='stencil'){
   fill();ctx.save();ctx.globalCompositeOperation='destination-out';
   // Cut two deliberate gaps through the stem field of each letter;
   // the cut is restricted to the glyph's own compositing layer.
   ctx.lineWidth=Math.max(2,size*.026);ctx.strokeStyle='#000';ctx.beginPath();
   const cut=-size*(.35+(index%3)*.09);
   ctx.moveTo(-size*.12,cut);ctx.lineTo(advance+size*.12,cut);ctx.stroke();ctx.restore();
 }
 if(g.terminal==='serif' && ['solid','double'].includes(mode)){
   // A restrained bar family, sized to the glyph's actual advance.
   line(ctx,[advance*.06, size*.04],[advance*.55,size*.04],ink,Math.max(1,size*.015),.6);
 }
 ctx.restore();
}
export function renderLettering(canvas,recipe){
 const g=recipe.genome || makeGenome('lettering',recipe.seed);
 if(evaluateSurface(g).length)throw Error('Invalid letter construction procedure');
 // A font is now a collection of named mutable parts rather than a
 // single opaque fillText call. The legacy native typeface is still
 // available explicitly by disabling the anatomy program.
 const anatomy=recipe.anatomy??g.anatomy;
 if(anatomy?.enabled!==false && (anatomy || recipe.style==='anatomy')){
   return paintAnatomyWord(canvas,{...recipe,genome:g,anatomy},{
      guide:!!(recipe.showAnatomyGuides??anatomy?.guide)
   });
 }
 const text=cleanLogoText(recipe.text),style=LETTER_STYLES.includes(recipe.style)?recipe.style:'geometric';
 const type=LETTER_TYPES.includes(recipe.type)?recipe.type:'wordmark';
 const word=(type==='wordmark'?text:monoOf(text)).toUpperCase(),ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Canvas 2D is unavailable');
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
 const colors=PALETTES[clamp(Math.floor((g.color||0)*PALETTES.length),0,PALETTES.length-1)],
   [ink,accent,bg]=colors,face=FONTS[style];
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const margin= type==='wordmark'?170:300,target=W-margin*2;
 let fontSize=type==='wordmark'?237:290;
 const track=(Number(g.track)||.08)*fontSize;
 while(fontSize>32){fontFor(ctx,face.font,face.weight,fontSize);
   if(widthOf(ctx,word,track*fontSize/(type==='wordmark'?237:290))<=target)break;
   fontSize-=3;
 }
 fontFor(ctx,face.font,face.weight,fontSize);
 const tracking=(Number(g.track)||.08)*fontSize;
 const glyphs=[...word],advances=glyphs.map(ch=>ctx.measureText(ch).width);
 let full=advances.reduce((a,b)=>a+b,0)+Math.max(0,glyphs.length-1)*tracking;
 const x0=(W-full)/2,y=H*.58;
 paintFrame(ctx,g,ink,accent);
 // Apply the entire glyph family to a dedicated transparent layer so that
 // stencil cuts affect the lettering but cannot punch holes in its background.
 const layer=document.createElement('canvas');layer.width=W;layer.height=H;
 const lc=layer.getContext('2d');if(!lc)throw Error('Glyph layer unavailable');
 fontFor(lc,face.font,face.weight,fontSize);
 let at=x0;const positions=[];
 for(let i=0;i<glyphs.length;i++){
   drawGlyph(lc,glyphs[i],y,fontSize,{x:at,advance:advances[i],index:i,genome:g,ink,accent,bg});
   positions.push({x:at,width:advances[i]});at+=advances[i]+tracking;
 }
 if(g.joint==='ligature'&&positions.length>1){
   for(let i=0;i<positions.length-1;i++){
     const left=positions[i],right=positions[i+1];
     line(lc,[left.x+left.width*.79,y-fontSize*.35],[right.x+right.width*.12,y-fontSize*.35],ink,Math.max(1.5,fontSize*.025),.9);
   }
 }else if(g.joint==='shared' &&positions.length>1){
   for(let i=0;i<positions.length-1;i++){
     const left=positions[i],right=positions[i+1];
     line(lc,[left.x+left.width*.88,y-fontSize*.77],[right.x+right.width*.09,y-fontSize*.77],ink,Math.max(1.5,fontSize*.022),.86);
   }
 }
 ctx.drawImage(layer,0,0);
 if(g.letterForm==='bridge'&&positions.length>1){
   line(ctx,[x0,y+fontSize*.15],[x0+full,y+fontSize*.15],accent,Math.max(2,fontSize*.043),.9);
 }
 if(type==='emblem'&&g.letterFrame==='none'){
   ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.strokeRect(W*.22,H*.16,W*.56,H*.68);
 }
 return {text,letters:word,style,type,method:methodDescription(g)};
}
export function letteringDescription(recipe){
 const first=(recipe.anatomy||recipe.genome?.anatomy)?.rules?.[0];
 return `${cleanLogoText(recipe.text)} · ${first?first.target+' '+first.operation+' · ':''}${methodDescription(recipe.genome)}`;
}
import {geneFeatures} from './evolution.js';
export function letteringFeatures(recipe){return {style:recipe.style,type:recipe.type,...(recipe.genome?geneFeatures(recipe.genome):{}),discipline:'lettering'};}
