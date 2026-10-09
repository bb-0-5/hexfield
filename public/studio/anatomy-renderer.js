/* HEXFIELD 304 — render and inspect genuine named glyph strokes.
 * The skeleton is a procedural display font (not a raster filter placed on
 * Arial). Stem, counter, bowl etc have separable geometry and a mutation
 * applies only to the parts that actually exist in the selected glyph.
 */
import {glyphAnatomy,glyphWidth,compileAnatomyGlyph,editAnatomyProgram,
  GUIDELINES,ANATOMY} from './glyph-anatomy.js';
const W=1200,H=740,PI=Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PROFILES={
  geometric:{weight:.106,contrast:1,tracking:.16,cap:'round',ink:'#223c37'},
  minimal:{weight:.068,contrast:1,tracking:.20,cap:'square',ink:'#233e40'},
  heavy:{weight:.153,contrast:1,tracking:.10,cap:'square',ink:'#2a3235'},
  elegant:{weight:.083,contrast:.68,tracking:.15,cap:'round',ink:'#2e3143'},
  experimental:{weight:.115,contrast:.87,tracking:.13,cap:'square',ink:'#273b47'},
  anatomy:{weight:.112,contrast:.83,tracking:.16,cap:'round',ink:'#243633'}
};
const PALETTES=[
  ['#233c36','#c57952','#ede9df'],['#24344c','#c2886d','#eeede8'],
  ['#50344f','#dd8662','#f2eee5'],['#27353d','#79c5ae','#f2f0e7'],
  ['#453b36','#727f9d','#f2eadb']
];
const clipPath=(ctx,points)=>{if(!points.length)return;ctx.beginPath();ctx.moveTo(...points[0]);
 for(const p of points.slice(1))ctx.lineTo(...p);};
const distToSegment=(x,y,a,b)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
 const t=den?clamp(((x-a[0])*dx+(y-a[1])*dy)/den,0,1):0;
 return Math.hypot(x-(a[0]+dx*t),y-(a[1]+dy*t));
};
function sampleCurve(item){
 const points=item.points;
 if(!item.faceted||item.kind!=='curve')return points;
 const segments=clamp(Math.round(4+item.amount*4),4,8),sample=[];
 for(let i=0;i<=segments;i++)sample.push(points[Math.round(i*(points.length-1)/segments)]);
 return sample;
}
function paintPart(ctx,item,points,scaleX,scaleY,originX,originY,baseWidth,ink,accent,{
  harsh=false,guide=false,highlight=false}={}){
 if(item.omit||!points.length)return null;
 const real=points.map(([x,y])=>[originX+x*scaleX,originY+y*scaleY]);
 const weight=baseWidth*(item.width||1);
 const colour=item.invert?accent:ink;
 ctx.save();ctx.lineJoin=(harsh||item.faceted)?'miter':'round';
 ctx.lineCap=harsh?'square':'round';ctx.strokeStyle=colour;ctx.fillStyle=colour;
 ctx.lineWidth=weight;
 if(item.dotted){
   const radius=Math.max(.8,weight*.55),skip=Math.max(1,Math.round(real.length/21));
   for(let i=0;i<real.length;i+=skip){
     const [x,y]=real[i];
     if(harsh)ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
     else{ctx.beginPath();ctx.arc(x,y,radius,0,PI*2);ctx.fill();}
   }
 }else{
   for(let i=1;i<real.length;i++){
     const t=i/(real.length-1);
     if(item.open&&(t<.11||t>.86))continue;
     if(item.fractured&&(item.isTerm?t<.17||t>.83:
       Math.floor(t*(4+Math.floor(item.amount*6)))%3===1))continue;
     if(item.dashed&&Math.floor(t*20)%2===1)continue;
     const a=real[i-1],b=real[i];if(!a||!b)continue;
     ctx.lineWidth=item.width&&item.width<.8?weight:weight;
     if(item.width&&item.width>.2&&item.amount&&item.isTerm)ctx.lineWidth=weight*(1-.28*t);
     // Deliberately draw each segment, rather than join a single font outline:
     // a rule may forbid an individual terminal, section or counter aperture.
     ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   }
 }
 if(item.serifs){
   const ends=[real[0],real.at(-1)];
   for(const end of ends){if(!end)continue;
     ctx.beginPath();ctx.moveTo(end[0]-weight*1.25,end[1]);
     ctx.lineTo(end[0]+weight*1.25,end[1]);ctx.lineWidth=weight*.45;ctx.stroke();
   }
 }
 ctx.restore();
 if(guide||highlight){
   ctx.save();ctx.strokeStyle=highlight?'#cf704e':'#71a7b1';ctx.lineWidth=highlight?2:1;
   ctx.setLineDash(highlight?[3,4]:[2,5]);clipPath(ctx,real);ctx.stroke();
   if(highlight&&real.length){const p=real[Math.floor(real.length*.44)];
     ctx.setLineDash([]);ctx.fillStyle='#b45d43';ctx.font='bold 12px Arial,sans-serif';
     ctx.fillText(item.part,p[0]+7,p[1]-9);}
   ctx.restore();
 }
 return real;
}
export function paintAnatomyWord(canvas,recipe={},options={}){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D canvas unavailable');
 const raw=String(recipe.text||'HEXFIELD').slice(0,24),kind=recipe.type||'wordmark';
 const text=kind==='wordmark'?raw:(
   raw.includes(' ')?raw.split(/\s+/).map(part=>part[0]||'').join(''):raw
 ).slice(0,3).toUpperCase();
 const g=recipe.genome||{},program=editAnatomyProgram(options.program||recipe.anatomy||g.anatomy);
 const face=PROFILES[recipe.style]||PROFILES.anatomy;
 const colors=PALETTES[clamp(Math.floor((g.color||0)*PALETTES.length),0,PALETTES.length-1)];
 const [ink,accent,bg]=colors;
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 ctx.clearRect(0,0,W,H);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const letters=[...text];if(!letters.length)return {hitMap:[],applied:0};
 const glyphW=letters.map(ch=>glyphWidth(ch)),tracking=face.tracking+(Number(g.track)||.04)*.5;
 let wordWidth=glyphW.reduce((a,b)=>a+b,0);
 wordWidth+=(letters.length-1)*tracking;
 let em=Math.min(425,(W-175)/Math.max(.8,wordWidth*.77));
 em=clamp(em,26,425);
 const xscale=em*.77,yscale=em*1.08;
 const actualW=xscale*wordWidth;
 const x0=Math.max(10,(W-actualW)/2);
 const top=(H-yscale*(GUIDELINES.baseline-GUIDELINES.cap))/2-yscale*GUIDELINES.cap;
 const baseWidth=em*face.weight;
 const guide=options.guide??program.guide;
 if(guide){
   ctx.save();ctx.strokeStyle='#a4aaa3';ctx.lineWidth=1;
   ctx.setLineDash([9,8]);
   for(const [name,n] of Object.entries(GUIDELINES)){
     const y=top+n*yscale;
     ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(W-30,y);ctx.stroke();
     ctx.fillStyle='#567567';ctx.font='12px Arial,sans-serif';
     ctx.fillText(name.replace('_',' ').toUpperCase(),31,y-6);
   }
   ctx.restore();
 }
 const hitMap=[],affectedCount={},debugParts={};
 let at=x0,totalPainted=0,applied=0;
 const weightFactor=recipe.style==='elegant'?.82:1;
 for(let index=0;index<letters.length;index++){
   const char=letters[index],width=glyphW[index];
   if(char===' '){at+=xscale*(width+tracking);continue;}
   const anatomy=compileAnatomyGlyph(char,index,program);
   const glyphStart=at,form=g.letterForm||'upright';
   const localTop=top+(form==='stagger'?(index%3-1)*em*.045:0);
   for(const event of anatomy.affected){
     if(event.matched)affectedCount[event.target]=(affectedCount[event.target]||0)+1;
   }
   for(const rawComponent of anatomy.components){
     const component={...rawComponent,points:rawComponent.points.map(point=>{
       const p=[...point];
       if(form==='shear')p[0]+=(GUIDELINES.baseline-p[1])*.19;
       if(form==='squeeze')p[0]=.5+(p[0]-.5)*.80;
       if(form==='waist')p[0]=.5+(p[0]-.5)*(.83+.15*Math.abs(p[1]-.52));
       return p;
     })};
     if(g.terminal==='serif'&&['stem','ascender','descender'].includes(component.part))
       component.serifs=true;
     const rules=program.rules.filter(rule=>{
       const gMatch=rule.glyph==='all'||rule.glyph===char||rule.glyph==='first'&&index===0;
       return gMatch&&(component.part===rule.target||rule.target==='any'||
         anatomy.metrics.parts.includes(rule.target)&&
         // Geometry from compileAnatomyGlyph already contains the effect;
         // visually highlight all non-ink counters via their bowl components.
         ['counter','aperture','axis','baseline','sidebearing','terminal','join',
           'serif','overshoot','cap_height','x_height','apex','vertex'].includes(rule.target));
     });
     const highlight=guide&&rules.length>0;
     const stroke=baseWidth*(component.part==='diagonal'?face.contrast:1)*weightFactor;
     const pts=sampleCurve(component),hard=program.rules.some(r=>r.operation==='facet');
     const mode=g.letterStroke||'solid';
     let active={...component};
     if(mode==='stencil')active.fractured=true;
     if(mode==='double'){
       paintPart(ctx,{...active,invert:true},pts,xscale,yscale,
         glyphStart+stroke*.65,localTop+stroke*.65,stroke*1.12,ink,accent,
         {harsh:hard,guide:false,highlight:false});
     }
     if(mode==='inline'||mode==='outline'){
       // Two *structural* strokes, never font shadows: cut the interior of
       // every stem/bowl before adding the next anatomy component.
       paintPart(ctx,active,pts,xscale,yscale,
         glyphStart,localTop,stroke*(mode==='outline'?1.28:1.5),ink,accent,
         {harsh:hard,guide:false,highlight:false});
       const erased={...active,invert:false};
       paintPart(ctx,erased,pts,xscale,yscale,
         glyphStart,localTop,stroke*(mode==='outline'?.56:.48),bg,bg,
         {harsh:hard,guide:false,highlight:false});
     }
     const world=(mode==='inline'||mode==='outline')?
       pts.map(([px,py])=>[glyphStart+px*xscale,localTop+py*yscale]):
       paintPart(ctx,active,pts,xscale,yscale,
         glyphStart,localTop,stroke,ink,accent,{harsh:hard,guide,highlight});
     if((mode==='inline'||mode==='outline')&&guide&&world.length){
       ctx.save();ctx.strokeStyle=highlight?'#bb644a':'#789fa2';ctx.lineWidth=1;
       clipPath(ctx,world);ctx.stroke();ctx.restore();
     }
     if(world){
       const bound={minX:Math.min(...world.map(p=>p[0])),maxX:Math.max(...world.map(p=>p[0])),
         minY:Math.min(...world.map(p=>p[1])),maxY:Math.max(...world.map(p=>p[1]))};
       hitMap.push({char,index,part:component.part,points:world,box:bound,weight:stroke});
       totalPainted++;
       if(rules.length)applied++;
       debugParts[component.part]=(debugParts[component.part]||0)+1;
     }
   }
   at+=xscale*(width+tracking);
 }
 // Join rules are construction operators: they really connect independent
 // letters, so ligature experiments change topology rather than kerning.
 if(['ligature','shared'].includes(g.joint)&&letters.length>1){
   ctx.save();ctx.strokeStyle=ink;ctx.lineWidth=baseWidth*.55;ctx.lineCap='butt';
   for(let i=1;i<letters.length;i++){
     const here=hitMap.filter(p=>p.index===i),prev=hitMap.filter(p=>p.index===i-1);
     if(!here.length||!prev.length)continue;
     const x1=Math.max(...prev.map(p=>p.box.maxX));
     const x2=Math.min(...here.map(p=>p.box.minX));
     const y=g.joint==='shared'?top+yscale*.33:top+yscale*.70;
     if(x2>x1&&x2-x1<em*.55){
       ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
     }
   }ctx.restore();
 }
 const frame=kind==='emblem'&&(!g.letterFrame||g.letterFrame==='none')?'box':
   (g.letterFrame||'none');
 if(frame!=='none'){
   const x=x0-24,y=top+GUIDELINES.cap*yscale-27,
     w=actualW+48,h=yscale*(GUIDELINES.baseline-GUIDELINES.cap)+54;
   ctx.save();ctx.strokeStyle=ink;ctx.lineWidth=Math.max(2,em*.018);
   if(frame==='box'){ctx.strokeRect(x,y,w,h);}
   else if(frame==='rails'){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);
     ctx.moveTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.stroke();}
   else if(frame==='ring'){
     ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w*.57,h*.66,0,0,PI*2);ctx.stroke();
   }else if(frame==='brackets'){
     for(const side of [0,1]){
       const px=side?x+w:x,sign=side?-1:1;
       ctx.beginPath();ctx.moveTo(px+sign*34,y);ctx.lineTo(px,y);
       ctx.lineTo(px,y+h);ctx.lineTo(px+sign*34,y+h);ctx.stroke();
     }
   }ctx.restore();
 }
 // The guides are overlays, never part of the final stored logo when disabled.
 return {engine:'named-glyph-anatomy',text,program,glyphCount:letters.filter(x=>x!==' ').length,
   parts:debugParts,affected:affectedCount,paintedComponents:totalPainted,
   mutatedComponents:applied,hitMap,geometry:{
     cap:top+GUIDELINES.cap*yscale,baseline:top+GUIDELINES.baseline*yscale,
     xHeight:top+GUIDELINES.x*yscale,descender:top+GUIDELINES.descent*yscale,
     em,tracking,x0,width:actualW}};
}
export function hitTestAnatomy(result,x,y,tolerance=20){
 if(!result?.hitMap)return null;
 let best=null,near=Infinity;
 for(const component of result.hitMap){
   if(x<component.box.minX-tolerance||x>component.box.maxX+tolerance||
      y<component.box.minY-tolerance||y>component.box.maxY+tolerance)continue;
   for(let k=1;k<component.points.length;k++){
     const d=distToSegment(x,y,component.points[k-1],component.points[k]);
     if(d<near){near=d;best=component;}
   }
 }
 if(best&&near<=tolerance+best.weight*.5)
   return {char:best.char,index:best.index,part:best.part,distance:near,
     definition:ANATOMY[best.part]?.[1]||''};
 return null;
}
export function anatomyCoverage(word,target){
 const letters=[...String(word||'')];let count=0,lettersMatched=[];
 for(const char of new Set(letters)){
   if(glyphAnatomy(char).parts.includes(target)||target==='any'){
     count+=letters.filter(c=>c===char).length;lettersMatched.push(char);
   }
 }
 return {count,glyphs:lettersMatched.join(' '),total:letters.filter(c=>c!==' ').length};
}
