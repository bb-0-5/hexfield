/* HEXFIELD RULE ENGINE / Build 302
 * Shared by the Rule Studio and the historical experimental painter.
 * These are executed canvas constraints, NOT style adjectives passed to AI.
 * Every rework starts from the preceding result, making its lineage inspectable.
 */
import {DERIVED_MARKS,markAtCell,paintDerivedMark} from './mark-grammar.js';
import {newMarkProgram,validMarkProgram,evolveMarkProgram,paintInventedMark} from './mark-program.js';
export const RULE_STORE = 'hexfield.rule-studio.memory.v1';
export const SUBJECTS = {
  sphere:'Ball on a table',stairwell:'Flooded stairwell',coast:'Coastline',
  tree:'Tree',bridge:'Bridge',room:'Interior',road:'Road',abstract:'Abstract field'
};
export const LAWS = {
  no_curves:'No curved marks: straight segments and quadrilateral forms only',
  opposite_bend:'Mirrored coordinates bend in opposite horizontal directions',
  blue_for_red:'Red-dominant pigment is replaced by blue, not merely tinted',
  negative_space:'Paint only regions classified as negative space; leave forms empty',
  no_shading:'No gradual shading: colours are reduced to discrete flat bands',
  fractured_horizon:'Every horizontal band breaks into opposing offsets',
  unclosed_forms:'Remove regularly spaced pieces of each contour or stroke field',
  bright_shadow:'Make low-luminance regions bright and bright regions dark',
  warm_cool_swap:'Exchange warm and cool colour roles',
  flatten_perspective:'Interrupt perspective by locally offsetting slice coordinates',
  density_contrast:'Express spatial depth only through the spacing of marks',
  orientation_colour:'Derive colour from local direction, not from natural material'
};
export const MARKS = {
  dashes:'Short separated strokes',dots:'Discrete points',hatch:'Directional hatching',
  cutout:'Flat cut-paper quadrilaterals',carve:'Subtractive marks in a dark ground',
  hybrid:'Hybrid field: original and derived mark procedures together',
  ...DERIVED_MARKS,
  invented:'Invent a mark procedure from two gestures and evolving operations'
};
export const REWORKS = {
  none:'No rework',abstract_masses:'Reabstract into coarse tonal masses',
  negative_repaint:'Repaint from negative-space map',
  misread:'Shift spatial interpretation before repainting',
  remove_strength:'Forbid the dominant mark behaviour from the previous study'
};
const keys=x=>Object.keys(x);
const randInt=n=>Math.floor(Math.random()*n);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function read(){
 try { const x=JSON.parse(localStorage.getItem(RULE_STORE)||'{}');
   return x && typeof x==='object'?x:{}; } catch{return {};}
}
function write(m){try{localStorage.setItem(RULE_STORE,JSON.stringify(m));}catch{}}
function ledger(){const m=read();return {weights:m.weights||{},choices:m.choices||{},votes:m.votes||[],lineage:m.lineage||[]};}
function chooseWeighted(list,group,rng=Math.random){
 const m=ledger(),weights=list.map(id=>{
   const score=clamp(Number(m.weights[group+':'+id])||0,-8,8);
   const repetitions=Number(m.choices[group+':'+id])||0;
   return .15+Math.exp(score*.19)/(1+repetitions*.035);
 });
 const total=weights.reduce((a,b)=>a+b,0);let pick=rng()*total;
 for(let i=0;i<list.length;i++){pick-=weights[i];if(pick<=0)return list[i];}
 return list[list.length-1];
}
function allowed(id,catalog,fallback){return typeof id==='string'&&id in catalog?id:fallback;}
export function makeRecipe(input={}){
 const rng=Number.isFinite(input.seed)?seeded(input.seed>>>0):Math.random;
 const primary=allowed(input.primary,LAWS,chooseWeighted(keys(LAWS),'law',rng));
 const secondary=allowed(input.secondary,LAWS,'none');
 let rework=allowed(input.rework,REWORKS,'none');
 const mark=allowed(input.mark,MARKS,chooseWeighted(keys(MARKS),'mark',rng));
 if(rework==='remove_strength' && !input.parentId)rework='none';
 const recipe={
   id:input.id||((globalThis.crypto?.randomUUID?.())||('r-'+Date.now()+'-'+randInt(1e8))),
   parentId:input.parentId||null,
   subject:allowed(input.subject,SUBJECTS,chooseWeighted(keys(SUBJECTS),'subject',rng)),
   primary,secondary:secondary===primary?'none':secondary,
   mark,rework,created:Date.now(),seed:Number.isFinite(input.seed)?input.seed:(Math.random()*4294967295)>>>0,
   // The rework lineage can continue beyond thirty-two revisions.
   generation:clamp(Number(input.generation)||0,0,1000000)
 };
 recipe.markProgram=validMarkProgram(input.markProgram)?input.markProgram:
   newMarkProgram(recipe.seed,recipe.generation);
 return recipe;
}
export function mutateRecipe(parent,focus='law',source='studio',seedOverride=null){
 const nextSeed=Number.isFinite(seedOverride)?(seedOverride>>>0):
   ((Math.imul((parent.seed>>>0)+parent.generation+1,1664525)+1013904223)>>>0);
 const rng=seeded(nextSeed),input={...parent,id:null,parentId:parent.id,
   generation:(parent.generation||0)+1,seed:nextSeed};
 if(focus==='subject')input.subject=chooseWeighted(keys(SUBJECTS).filter(x=>x!==parent.subject),'subject',rng);
 if(focus==='law'){
   input.primary=chooseWeighted(keys(LAWS).filter(x=>x!==parent.primary),'law',rng);
   input.secondary=parent.secondary;
 }
 if(focus==='mark')input.mark=chooseWeighted(keys(MARKS).filter(x=>x!==parent.mark),'mark',rng);
 if(focus==='rework')input.rework=chooseWeighted(keys(REWORKS).filter(x=>x!=='none'),'rework',rng);
 if(source==='archive')input.subject=parent.subject;
 if(focus==='mark'||focus==='rework')input.markProgram=evolveMarkProgram(parent.markProgram,{
   seed:nextSeed,branch:1
 });
 return makeRecipe(input);
}
export function noteRuleVerdict(recipe,liked,critique=''){
 if(!recipe)return;
 const m=ledger(),t=String(critique||'').toLowerCase();
 // More specific criticism changes the relevant dimension rather than
 // penalising every property of a painting that may have other merits.
 const aboutMarks=/stroke|dot|dash|brush|hatch|texture|marks/.test(t);
 const aboutSubject=/subject|scene|thing|object|landscape/.test(t);
 const aboutLaws=/constraint|rule|law|curve|colour|color|realistic|shade|perspective|same|generic/.test(t);
 const aboutRework=/rework|repaint|abstract|negative|reference/.test(t);
 const focus=(aboutMarks||aboutSubject||aboutLaws||aboutRework)?
   {mark:aboutMarks,subject:aboutSubject,law:aboutLaws,rework:aboutRework}:
   {mark:true,subject:true,law:true,rework:true};
 const adjust=(group,id,delta)=>{
   if(!id||id==='none')return;
   const key=group+':'+id;m.weights[key]=clamp((Number(m.weights[key])||0)+delta,-12,12);
   m.choices[key]=(Number(m.choices[key])||0)+1;
 };
 const sign=liked?1:-1;
 if(focus.law){adjust('law',recipe.primary,sign);adjust('law',recipe.secondary,sign*.65);}
 if(focus.mark)adjust('mark',recipe.mark,sign);
 if(focus.subject)adjust('subject',recipe.subject,sign*.65);
 if(focus.rework)adjust('rework',recipe.rework,sign);
 if(/too realistic|photoreal|shading|naturalistic/.test(t)){
   // Reward a *restriction* that eliminates the rejected affordance.
   adjust('law','no_shading',.8);adjust('law','flatten_perspective',.4);
 }
 if(/same again|repeat|generic/.test(t)){
   adjust('law',recipe.primary,-1.1);adjust('mark',recipe.mark,-.65);
 }
 m.votes.push({id:recipe.id,parentId:recipe.parentId,liked,critique:String(critique).slice(0,230),
   subject:recipe.subject,laws:[recipe.primary,recipe.secondary],mark:recipe.mark,rework:recipe.rework,at:Date.now()});
 m.votes=m.votes.slice(-100);write(m);
}
export function noteLineage(recipe){
 const m=ledger();
 m.lineage.push({id:recipe.id,parentId:recipe.parentId,subject:recipe.subject,
   laws:[recipe.primary,recipe.secondary],mark:recipe.mark,rework:recipe.rework,at:Date.now()});
 m.lineage=m.lineage.slice(-120);write(m);
}
export function describeRecipe(recipe){
 return (SUBJECTS[recipe.subject]||'Archive field')+' / '+
   (LAWS[recipe.primary]||recipe.primary)+
   (recipe.secondary!=='none'?' + '+LAWS[recipe.secondary]:'')+
   ' / '+MARKS[recipe.mark]+
   ((recipe.mark==='invented'||recipe.mark==='hybrid')&&validMarkProgram(recipe.markProgram)?
     ' / PROCEDURE '+recipe.markProgram.sources.join(' × ')+' → '+
     recipe.markProgram.operations.map(x=>x.type).join(' + '):'')+
   (recipe.rework!=='none'?' / '+REWORKS[recipe.rework]:'');
}
export function buildRulePrompt(recipe){
 return 'Depict '+(SUBJECTS[recipe.subject]||'an experimental scene')+
 '. The completed picture must obey formal laws: '+(LAWS[recipe.primary]||'')+
 (recipe.secondary!=='none'?'; '+LAWS[recipe.secondary]:'')+
 '. Only '+MARKS[recipe.mark]+'. Rework: '+REWORKS[recipe.rework]+
 '. Not photorealistic, no smooth realistic shading, no default cinematic lighting. '+
 'Treat laws as constraints, not suggestive style adjectives. An executable canvas painter will enforce them after the reference is produced.';
}
function seeded(seed){let a=(seed>>>0)||1;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function drawReality(canvas,subject='sphere',seed=12){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,r=seeded(seed);
 if(!ctx)throw Error('2D canvas unavailable');
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#dad5c8';ctx.fillRect(0,0,w,h);
 const rect=(x,y,a,b,col)=>{ctx.fillStyle=col;ctx.fillRect(x*w,y*h,a*w,b*h);};
 const poly=(points,col)=>{ctx.beginPath();ctx.moveTo(points[0][0]*w,points[0][1]*h);
   for(const p of points.slice(1))ctx.lineTo(p[0]*w,p[1]*h);ctx.closePath();ctx.fillStyle=col;ctx.fill();};
 if(subject==='sphere'){
   rect(0,.63,1,.37,'#8e6550');
   ctx.beginPath();ctx.arc(w*.49,h*.5,h*.21,0,Math.PI*2);ctx.fillStyle='#bc573a';ctx.fill();
   ctx.beginPath();ctx.ellipse(w*.49,h*.68,w*.24,h*.055,0,0,Math.PI*2);ctx.fillStyle='#433f57';ctx.fill();
 }else if(subject==='stairwell'){
   rect(0,0,1,.83,'#5d6273');poly([[.25,0],[.75,0],[.65,.38],[.35,.38]],'#d8be82');
   for(let i=0;i<8;i++){const y=.33+i*.075;const x=.34-i*.033;
     rect(x,y,1-2*x,.022,'#303543');rect(x,y+.023,1-2*x,.018,'#a3a9b4');}
   rect(0,.72,1,.28,'#729eac');
 }else if(subject==='coast'){
   rect(0,0,1,.54,'#8ca7bc');rect(0,.54,1,.46,'#456f79');
   poly([[0,.6],[.15,.55],[.44,.69],[.63,.83],[1,.8],[1,1],[0,1]],'#cfb28c');
   poly([[.59,.55],[.7,.32],[.84,.37],[1,.51],[1,.62]],'#374d58');
 }else if(subject==='tree'){
   rect(0,.69,1,.31,'#bcb078');poly([[.44,.84],[.48,.27],[.54,.27],[.59,.84]],'#67463a');
   for(let i=0;i<20;i++){const x=.5+(r()-.5)*.52,y=.12+r()*.47;
     ctx.beginPath();ctx.arc(w*x,h*y,h*(.07+r()*.055),0,7);ctx.fillStyle=i%3===0?'#b0a36c':i%3===1?'#456955':'#608573';ctx.fill();}
 }else if(subject==='bridge'){
   rect(0,.5,1,.5,'#63818e');poly([[0,.49],[.17,.47],[.5,.42],[.84,.47],[1,.49],[1,.56],[0,.56]],'#6d4b40');
   for(let i=0;i<7;i++)rect(.07+i*.14,.43,.014,.36,'#483b43');
   for(let i=0;i<4;i++)rect(.12+i*.26,.16,.025,.34,'#3d474b');
 }else if(subject==='room'){
   poly([[0,0],[.2,.18],[.2,.73],[0,1]],'#978f83');
   poly([[1,0],[.8,.18],[.8,.73],[1,1]],'#667a84');
   poly([[0,1],[.2,.73],[.8,.73],[1,1]],'#a7826e');
   rect(.34,.3,.32,.35,'#596d80');rect(.43,.3,.14,.35,'#bbaf89');
   rect(.26,.59,.19,.15,'#484c53');
 }else if(subject==='road'){
   rect(0,.6,1,.4,'#857d62');poly([[.47,.52],[.53,.52],[.98,1],[.02,1]],'#555b64');
   for(let i=0;i<7;i++){const y=.55+i*.052;rect(.5-(y-.5)*.013,y,.016,.02,'#e0c78c');}
   poly([[0,.61],[.25,.33],[.45,.52],[.5,.6]],'#61776b');
   poly([[.51,.6],[.75,.2],[1,.57],[1,.68]],'#4f6775');
 }else{
   for(let i=0;i<65;i++){const x=r(),y=r(),sz=.02+r()*.19;
     poly([[x,y],[x+sz,y+.04],[x+sz*.2,y+sz]],['#6e888b','#d5a788','#415875','#af6c61'][i%4]);}
 }
 return canvas;
}
function getPixel(data,w,h,x,y){
 const xi=clamp(Math.round(x),0,w-1),yi=clamp(Math.round(y),0,h-1),idx=(yi*w+xi)*4;
 return [data[idx],data[idx+1],data[idx+2]];
}
function remap(color,recipe,x,y,w,h){
 let [red,green,blue]=color;
 const laws=[recipe.primary,recipe.secondary];
 if(laws.includes('blue_for_red')&&red>green*1.18&&red>blue*1.1&&red>75){
   const old=blue;blue=red;red=Math.round(old*.4);green=Math.round(green*.8);
 }
 if(laws.includes('warm_cool_swap')){const t=red;red=blue;blue=t;}
 if(laws.includes('orientation_colour')){
   const strength=Math.round(125+110*Math.abs(Math.sin(x/w*8+y/h*5)));
   red=Math.round(strength*.4);green=Math.round(65+strength*.45);blue=strength;
 }
 let n=laws.includes('no_shading')||laws.includes('density_contrast')?2:5;
 if(laws.includes('bright_shadow'))[red,green,blue]=[255-red,255-green,255-blue];
 return [red,green,blue].map(v=>clamp(Math.round(v/255*n)*255/n,0,255));
}
export function applyRules(source,target,recipe,options={}){
 if(!source||!target)throw Error('Missing source or target canvas');
 const width=target.width,height=target.height;
 const sample=document.createElement('canvas');sample.width=width;sample.height=height;
 const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(source,0,0,width,height);
 const data=sc.getImageData(0,0,width,height).data,ctx=target.getContext('2d');
 // Other renderer families (especially landscape and typography) sometimes
 // leave a normalized-world transform on their canvas contexts. A rule pass
 // is *always* applied in physical pixel coordinates and must restore the
 // previous coordinate system once complete.
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 // Reabstraction is a genuine loss-of-information operation: first reduce
 // the input to spatial masses, then invent marks from that coarse image.
 // Applying only a wider dot size is not the same as abstracting a reference.
 let mass=null;
 if(recipe.rework==='abstract_masses'){
   const mw=Math.max(9,Math.ceil(width/35)),mh=Math.max(7,Math.ceil(height/35));
   const low=document.createElement('canvas');low.width=mw;low.height=mh;
   const lowCtx=low.getContext('2d',{willReadFrequently:true});
   lowCtx.drawImage(sample,0,0,mw,mh);
   mass={width:mw,height:mh,data:lowCtx.getImageData(0,0,mw,mh).data};
 }
 const laws=[recipe.primary,recipe.secondary];
 const has=id=>laws.includes(id);
 const abstract=recipe.rework==='abstract_masses',misread=recipe.rework==='misread';
 const negative=has('negative_space')||recipe.rework==='negative_repaint';
 const step=(abstract?20:recipe.mark==='cutout'?14:recipe.mark==='carve'||recipe.mark==='hybrid'?11:9);
 const back=getPixel(data,width,height,Math.max(1,width*.07),Math.max(1,height*.07));
 let strokes=0,skipped=0,inventedStamps=0,inventedPrimitives=0;
 const program=validMarkProgram(recipe.markProgram)?recipe.markProgram:
   newMarkProgram(recipe.seed,recipe.generation);
 // Optional bounded process score: sample the ACTUAL marks the renderer
 // executes, in actual rendering order. The theatre replays this score; it
 // does not invent unrelated flying dots over a finished image.
 const capture=options.trace===true,traceMarks=capture?[]:null;
 const traceStride=Math.max(1,Math.ceil(
   Math.ceil(width/step)*Math.ceil(height/step)/880
 ));
 const traceMark=item=>{
   if(capture&&strokes%traceStride===0&&traceMarks.length<900)traceMarks.push(item);
 };
 ctx.clearRect(0,0,width,height);
 ctx.fillStyle=negative?'#eee7d7':recipe.mark==='carve'?'#242c37':'#e5e0d3';
 ctx.fillRect(0,0,width,height);
 ctx.lineCap='butt';ctx.lineJoin='bevel';
 const random=seeded(recipe.seed+(Number(options.iteration)||0)*997);
 const markTypes=['dashes','dots','hatch','cutout','carve'];
 for(let y=0;y<height;y+=step){
   for(let x=0;x<width;x+=step){
     const order=Math.floor(y/step)*Math.ceil(width/step)+Math.floor(x/step);
     if(has('unclosed_forms')&&(order%9===0||order%17===2)){skipped++;continue;}
     const phi=y/height,center=x-width*.5,side=center>=0?1:-1;
     let dx=0;
     if(has('opposite_bend'))dx+=side*Math.sin(phi*Math.PI*2.7)*Math.min(width*.055,42);
     if(has('fractured_horizon'))dx+=((Math.floor(y/(step*4))%2)?1:-1)*Math.min(width*.033,24);
     if(has('flatten_perspective'))dx+=Math.sin(phi*15)*width*.025;
     if(misread)dx+=Math.sin(phi*9+x/width*7)*step*1.8;
     const sourceX=x+dx,sourceY=misread?height-y:y;
     const rgb=mass?
       getPixel(mass.data,mass.width,mass.height,sourceX/width*mass.width,sourceY/height*mass.height):
       getPixel(data,width,height,sourceX,sourceY);
     const dist=Math.hypot(rgb[0]-back[0],rgb[1]-back[1],rgb[2]-back[2]);
     // Foreground from colour contrast to a border sample. The negative-space
     // law forbids drawing this foreground, rather than just inverting colours.
     const foreground=dist>48;
     if(negative&&foreground){skipped++;continue;}
     const colour=remap(rgb,recipe,x,y,width,height);
     const luminosity=(colour[0]*.2126+colour[1]*.7152+colour[2]*.0722)/255;
     if(has('density_contrast')&&random()<luminosity*.58){skipped++;continue;}
     // A hybrid canvas combines the five original and ten new procedures. The
     // dominant mark changes by spatial region and generation. This is not
     // a single renderer recolouring one scene; the final stroke primitives
     // themselves vary within the same picture.
     const bx=Math.floor(x/Math.max(32,step*(6+(recipe.seed%4))));
     const by=Math.floor(y/Math.max(32,step*(5+(recipe.seed%3))));
     const localMark=recipe.mark==='hybrid'?
       markAtCell(bx,by,recipe.seed,Number(options.iteration)||0,1):recipe.mark;
     const role=localMark==='carve'?(luminosity>.48?'#eee9d9':'#202936'):
       'rgb('+colour.map(z=>Math.round(z)).join(',')+')';
     ctx.fillStyle=role;ctx.strokeStyle=role;
     const tx=x+dx,ty=y;
     const length=clamp(step*.7,2,14);
     // Executable application: gestures follow measured image structure.
     const nx=getPixel(data,width,height,sourceX+step,sourceY);
     const ny=getPixel(data,width,height,sourceX,sourceY+step);
     const lum=p=>p[0]*.213+p[1]*.715+p[2]*.072;
     const gx=lum(nx)-lum(rgb),gy=lum(ny)-lum(rgb);
     if(localMark==='invented'){
       const made=paintInventedMark(ctx,{program,x:tx,y:ty,step,
         angle:Math.hypot(gx,gy)>5?Math.atan2(gy,gx)+Math.PI*.5:(order%7)*Math.PI/7,
         colour:role,luminosity,contrast:Math.min(1,Math.hypot(gx,gy)/100),
         seed:recipe.seed,noCurves:has('no_curves'),emit:traceMark});
       if(made.used){inventedStamps++;inventedPrimitives+=made.primitives;strokes++;continue;}
     }
     if(paintDerivedMark(ctx,{mark:localMark,x:tx,y:ty,step,
       angle:Math.hypot(gx,gy)>5?Math.atan2(gy,gx)+Math.PI*.5:(order%7)*Math.PI/7,
       colour:role,luminosity,contrast:Math.min(1,Math.hypot(gx,gy)/100),
       seed:recipe.seed,noCurves:has('no_curves'),emit:traceMark})){
       strokes++;continue;
     }
     if(localMark==='dots'){
       const radius=clamp((1-luminosity)*step*.46+1,1,step*.5);
       if(has('no_curves')){
         ctx.fillRect(tx-radius,ty-radius,radius*2,radius*2);
         traceMark({type:'rect',x:tx-radius,y:ty-radius,
           a:radius*2,b:radius*2,color:role});
       }else{
         ctx.beginPath();ctx.arc(tx,ty,radius,0,Math.PI*2);ctx.fill();
         traceMark({type:'circle',x:tx,y:ty,a:radius,color:role});
       }
     }else if(localMark==='cutout'){
       // Flat, straight-sided masses — never trace realistic gradients.
       const tile=step*(has('no_shading')?1.15:.9);
       ctx.fillRect(tx,ty,tile,tile);
       traceMark({type:'rect',x:tx,y:ty,a:tile,b:tile,color:role});
     }else if(localMark==='carve'){
       const tile=clamp(step*(.28+luminosity),1,step);
       // Carve through dark ground; no naturalistic photographic highlights.
       const barHeight=has('no_curves')?tile:Math.max(2,tile*.4);
       ctx.fillRect(tx,ty,tile,barHeight);
       traceMark({type:'rect',x:tx,y:ty,a:tile,b:barHeight,color:role});
     }else {
       ctx.lineWidth=localMark==='hatch'?clamp(step*.2,1,3):clamp(step*.36,2,5);
       const theta=localMark==='hatch'?-Math.PI*.3:(Math.floor(x/step+y/step)%3)*Math.PI/3;
       const x1=tx-length*Math.cos(theta)*.5,y1=ty-length*Math.sin(theta)*.5;
       const x2=tx+length*Math.cos(theta)*.5,y2=ty+length*Math.sin(theta)*.5;
       ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
       traceMark({type:'line',x:x1,y:y1,a:x2,b:y2,
         width:ctx.lineWidth,color:role});
     }
     strokes++;
   }
 }
 ctx.restore();
 return {strokes,skipped,cell:step,negativeSpace:negative,noCurvedMarks:has('no_curves'),
  invented:{stamps:inventedStamps,primitives:inventedPrimitives,
    signature:program.signature,id:program.id,rootId:program.rootId},
  strictColourRemap:has('blue_for_red'),hybrid:recipe.mark==='hybrid',
  parentId:recipe.parentId,
  trace:capture?{marks:traceMarks,total:strokes,step,program:inventedStamps?{
    id:program.id,signature:program.signature,sources:program.sources,
    operations:program.operations}:null,background:negative?
    '#eee7d7':recipe.mark==='carve'?'#242c37':'#e5e0d3'}:undefined};
}
export function validateRecipe(recipe){
 if(!recipe||!(recipe.subject in SUBJECTS)||!(recipe.primary in LAWS)||!(recipe.mark in MARKS))return false;
 return recipe.secondary==='none'||recipe.secondary in LAWS;
}
