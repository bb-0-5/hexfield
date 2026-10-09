/* HEXFIELD 311: geometric visual inheritance.
 * Contours are extracted from real pixels, kept under stable ancestry IDs,
 * and re-rendered in new materials. No semantic object recognition claimed.
 * The original bitmap remains a separate archaeological layer in Build 310.
 */
import {evolveSeed} from './nonredundancy.js';
import {findMotifRegion} from './motif-memory.js';
export const HERITAGE_TTL=16,MAX_STRUCTURAL_IDEAS=2,SAMPLES=40;
export const MATERIALS=['outline','facets','dots','hatch','negative','spokes'];
export const HERITAGE_PREFERENCE_KEY='hexfield.visual-gene-taste.v1';
export function heritageTaste(){
 try{
   const value=JSON.parse(localStorage.getItem(HERITAGE_PREFERENCE_KEY)||'{}');
   const weights=value?.v===1&&value.weights||{};
   return {votes:Number(value.votes)||0,weights,
     habits:Object.entries(weights).filter(([key])=>key.startsWith('material:'))
       .sort((a,b)=>b[1]-a[1]).slice(0,4)
       .map(([name,weight])=>({material:name.slice(9),weight}))};
 }catch{return {votes:0,weights:{},habits:[]};}
}

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const cn=(x)=>+clamp(x,-10,10).toFixed(4);
const cvs=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const col=(d,i)=>[d[4*i],d[4*i+1],d[4*i+2]];
const dist=(a,b)=>Math.sqrt(.3*(a[0]-b[0])**2+.59*(a[1]-b[1])**2+.11*(a[2]-b[2])**2);
const adjacent=(i,w,h)=>{
 const x=i%w,y=Math.floor(i/w),a=[];
 if(x>0)a.push(i-1);if(x<w-1)a.push(i+1);
 if(y>0)a.push(i-w);if(y<h-1)a.push(i+w);
 return a;
};
const rgbHex=vals=>'#'+vals.map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('');
function estimateGround(data,w,h){
 const bins=new Map();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(x>=4&&x<w-4&&y>=3&&y<h-3)continue;
   const rgb=col(data,y*w+x),key=rgb.map(v=>v>>>5).join(',');
   const item=bins.get(key)||{n:0,sum:[0,0,0]};
   item.n++;rgb.forEach((v,i)=>item.sum[i]+=v);bins.set(key,item);
 }
 const main=[...bins.values()].sort((a,b)=>b.n-a.n)[0];
 return main?main.sum.map(v=>v/main.n):[227,226,222];
}
function largest(mask,w,h){
 const marked=new Uint8Array(mask.length);let best=[];
 for(let i=0;i<mask.length;i++){
   if(!mask[i]||marked[i])continue;
   const q=[i],part=[];marked[i]=1;
   for(let k=0;k<q.length;k++){
     const at=q[k];part.push(at);
     for(const j of adjacent(at,w,h)){
       if(mask[j]&&!marked[j]){marked[j]=1;q.push(j);}
     }
   }
   if(part.length>best.length)best=part;
 }
 return best;
}
function trace(group,w,h){
 const mask=new Uint8Array(w*h);
 let minx=w,miny=h,maxx=0,maxy=0,sumx=0,sumy=0;
 for(const i of group){
   mask[i]=1;
   const x=i%w,y=Math.floor(i/w);
   minx=Math.min(minx,x);maxx=Math.max(maxx,x);
   miny=Math.min(miny,y);maxy=Math.max(maxy,y);sumx+=x;sumy+=y;
 }
 const bw=Math.max(1,maxx-minx+1),bh=Math.max(1,maxy-miny+1);
 const cx=sumx/group.length,cy=sumy/group.length;
 const edge=[];
 for(const i of group){
   const x=i%w,y=Math.floor(i/w);
   if(x===0||x===w-1||y===0||y===h-1||
      adjacent(i,w,h).some(j=>!mask[j]))edge.push([x,y]);
 }
 const points=[];
 for(let k=0;k<SAMPLES;k++){
   const angle=2*Math.PI*k/SAMPLES;
   let winner=[cx,cy],best=-Infinity;
   for(const p of edge){
     const theta=Math.atan2(p[1]-cy,p[0]-cx);
     const off=Math.abs(Math.atan2(Math.sin(theta-angle),Math.cos(theta-angle)));
     const weight=Math.hypot(p[0]-cx,p[1]-cy)-off*Math.max(w,h)*.6;
     if(weight>best){best=weight;winner=p;}
   }
   points.push([cn((winner[0]-minx)/bw),cn((winner[1]-miny)/bh)]);
 }
 // Detect NEGATIVE-SPACE COUNTERS, not inferred semantic circles.
 const seen=new Uint8Array(w*h),holes=[];
 for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){
   const first=y*w+x;if(mask[first]||seen[first])continue;
   const q=[first];seen[first]=1;let touch=false,sx=0,sy=0;
   for(let i=0;i<q.length;i++){
     const at=q[i],px=at%w,py=Math.floor(at/w);
     sx+=px;sy+=py;
     if(px<=minx||px>=maxx||py<=miny||py>=maxy)touch=true;
     for(const n of adjacent(at,w,h)){
       const nx=n%w,ny=Math.floor(n/w);
       if(nx<minx||nx>maxx||ny<miny||ny>maxy||mask[n]||seen[n])continue;
       seen[n]=1;q.push(n);
     }
   }
   if(!touch&&q.length>=4)holes.push({
     x:cn((sx/q.length-minx)/bw),y:cn((sy/q.length-miny)/bh),
     r:cn(Math.sqrt(q.length/Math.PI)/Math.max(bw,bh))
   });
 }
 holes.sort((a,b)=>b.r-a.r);
 return {
   points,holes:holes.slice(0,2),
   crop:{x:minx/w,y:miny/h,w:bw/w,h:bh/h},
   edge:edge.length,occupancy:group.length/(bw*bh),
   aspect:+(bw/bh).toFixed(4),
   circularity:+clamp(4*Math.PI*group.length/Math.max(1,edge.length**2)).toFixed(4)
 };
}
export function extractStructuralIdea(canvas,{seed=1,cycle=0,region=null,
  ancestorId=null,exclude=[]}={}){
 if(!canvas?.getContext||!canvas.width||!canvas.height)return null;
 const source=region||findMotifRegion(canvas,{seed,exclude});
 if(!source)return null;
 const w=52,h=40,mini=cvs(w,h),ctx=mini.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(canvas,Math.floor(source.x*canvas.width),Math.floor(source.y*canvas.height),
   Math.max(1,Math.floor(source.w*canvas.width)),
   Math.max(1,Math.floor(source.h*canvas.height)),0,0,w,h);
 const data=ctx.getImageData(0,0,w,h).data,ground=estimateGround(data,w,h);
 const mask=new Uint8Array(w*h);
 for(let i=0;i<mask.length;i++)mask[i]=dist(col(data,i),ground)>34?1:0;
 const group=largest(mask,w,h);
 if(group.length<28||group.length>w*h*.87)return null;
 const form=trace(group,w,h);
 if(form.edge<15||form.occupancy<.11)return null;
 const color=[0,0,0];
 for(const i of group)col(data,i).forEach((v,j)=>color[j]+=v);
 const rect={
   x:clamp(source.x+form.crop.x*source.w),
   y:clamp(source.y+form.crop.y*source.h),
   w:clamp(form.crop.w*source.w,.035,.57),
   h:clamp(form.crop.h*source.h,.035,.57)
 };
 rect.x=clamp(rect.x,0,1-rect.w);rect.y=clamp(rect.y,0,1-rect.h);
 const id='idea-'+cycle+'-'+evolveSeed(seed,cycle+1,1,'geometry').toString(36);
 return {
   ...Object.fromEntries(Object.entries(rect).map(([k,v])=>[k,cn(v)])),
   id,sourceId:ancestorId||id,ancestorId,generation:0,
   seed:seed>>>0,born:cycle,age:0,ttl:HERITAGE_TTL,
   outline:form.points,holes:form.holes,
   ink:rgbHex(color.map(v=>v/group.length)),material:'original',trust:0,
   confidence:clamp(.45*Math.min(1,form.edge/52)+.55*clamp(form.occupancy/.6)),
   stats:{occupancy:+form.occupancy.toFixed(4),
     aspect:form.aspect,circularity:form.circularity},
   name:'Contour / '+(form.holes.length?'enclosed counter':
     form.circularity>.49?'rounded':'angular')+' geometry'
 };
}
function hueOf(hex){
 const m=/^#([0-9a-f]{6})$/i.exec(hex||'');
 if(!m)return 211;
 const s=m[1],r=parseInt(s.slice(0,2),16)/255,
   g=parseInt(s.slice(2,4),16)/255,b=parseInt(s.slice(4,6),16)/255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 if(!d)return 0;
 return (60*(max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4)+360)%360;
}
function materialOf(idea,seed,recipe){
 if(recipe?.primary==='negative_space')return 'negative';
 if(recipe?.mark==='dots')return 'dots';
 if(recipe?.mark==='hatch')return 'hatch';
 if(recipe?.mark==='cutout')return 'facets';
 const favourite=heritageTaste().habits.find(x=>x.weight>=1.4);
 const fallback=MATERIALS[(idea.age+(seed%MATERIALS.length))%MATERIALS.length];
 // The preferred material returns only occasionally: heritage must
 // not suppress new experiments or conflict with locked drawing laws.
 return favourite&&evolveSeed(seed,idea.age,2,'learned-habit')%4===0?
   favourite.material:fallback;
}
function paintForm(ctx,idea,{width,height,seed,cycle,recipe}){
 const drift=evolveSeed(seed,idea.age+1,0,idea.id);
 const scale=1+((drift%21)-10)/100;
 const dx=(((drift>>>8)%17)-8)*.0024*width,
   dy=(((drift>>>16)%17)-8)*.0024*height;
 const x=idea.x*width+dx,y=idea.y*height+dy,
   w=idea.w*width*scale,h=idea.h*height*scale;
 const points=idea.outline.map(p=>[x+p[0]*w,y+p[1]*h]);
 const material=materialOf(idea,seed,recipe);
 const hue=(hueOf(idea.ink)+(cycle%5)*137.507764)%360;
 const color=recipe?.primary==='blue_for_red'&&(hue<60||hue>330)?
   'hsl(218 72% 42%)':'hsl('+hue.toFixed(1)+' 72% 38%)';
 const inkWidth=clamp(Math.min(w,h)*.085,2,11),ground='#eae5d7';
 const polygon=material==='facets'?
   Array.from({length:8},(_,i)=>points[Math.floor(i*points.length/8)]):points;
 const path=()=>{
   ctx.beginPath();ctx.moveTo(...polygon[0]);
   for(let i=1;i<polygon.length;i++)ctx.lineTo(...polygon[i]);
   ctx.closePath();
 };
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 ctx.globalAlpha=clamp(.75+idea.trust*.055,.53,.94);
 ctx.lineWidth=inkWidth;ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle=color;ctx.fillStyle=color;
 if(material==='negative'){
   // Paint only the frame AROUND the inherited silhouette.
   ctx.fillStyle=ground;ctx.beginPath();
   ctx.rect(x-12,y-12,w+24,h+24);
   const reverse=[...polygon].reverse();
   ctx.moveTo(...reverse[0]);
   for(let j=1;j<reverse.length;j++)ctx.lineTo(...reverse[j]);
   ctx.closePath();ctx.fill('evenodd');
   path();ctx.stroke();
 }else if(material==='dots'){
   for(let i=0;i<points.length;i++){
     const radius=inkWidth*.46;
     if(recipe?.primary==='no_curves')
       ctx.fillRect(points[i][0]-radius,points[i][1]-radius,2*radius,2*radius);
     else {ctx.beginPath();ctx.arc(...points[i],radius,0,Math.PI*2);ctx.fill();}
   }
 }else if(material==='hatch'||material==='spokes'){
   path();ctx.save();ctx.clip();ctx.lineWidth=Math.max(1,inkWidth*.27);
   if(material==='hatch'){
     for(let k=-14;k<28;k++){
       const sx=x+k*w/14;ctx.beginPath();ctx.moveTo(sx,y-5);
       ctx.lineTo(sx+w*.46,y+h+5);ctx.stroke();
     }
   }else{
     for(let k=0;k<points.length;k+=2){
       ctx.beginPath();ctx.moveTo(x+w*.5,y+h*.5);
       ctx.lineTo(...points[k]);ctx.stroke();
     }
   }
   ctx.restore();path();ctx.stroke();
 }else{
   path();
   if(material==='facets'){ctx.globalAlpha=.34;ctx.fill();ctx.globalAlpha=.9;}
   ctx.stroke();
 }
 if(idea.holes?.length&&material!=='negative'&&material!=='dots'){
   ctx.beginPath();
   for(const hole of idea.holes){
     const cx=x+hole.x*w,cy=y+hole.y*h,
       radius=clamp(hole.r*Math.max(w,h),3,Math.min(w,h)*.32);
     const n=recipe?.primary==='no_curves'?7:18;
     ctx.moveTo(cx+radius,cy);
     for(let i=1;i<n;i++){
       const a=i*2*Math.PI/n;
       ctx.lineTo(cx+radius*Math.cos(a),cy+radius*Math.sin(a));
     }
     ctx.closePath();
   }
   ctx.fillStyle=ground;ctx.fill();
   ctx.lineWidth=Math.max(1,inkWidth*.45);ctx.stroke();
 }
 ctx.restore();
 return {
   id:idea.id,ancestorId:idea.ancestorId,sourceId:idea.sourceId,
   generation:idea.generation+1,
   material,was:idea.material,age:idea.age,trust:idea.trust,
   name:idea.name,outline:points,x,y,w,h,
   holes:idea.holes.length,color,topology:'closed',
   fidelity:clamp(1-Math.abs(1-scale)*1.7-
     Math.abs(dx)/width-Math.abs(dy)/height)
 };
}
function changedPixels(before,after,item){
 const x=clamp(Math.floor(item.x),0,before.width-1),
   y=clamp(Math.floor(item.y),0,before.height-1),
   w=clamp(Math.ceil(item.w),1,before.width-x),
   h=clamp(Math.ceil(item.h),1,before.height-y);
 const a=before.getContext('2d').getImageData(x,y,w,h).data;
 const b=after.getContext('2d').getImageData(x,y,w,h).data;
 let changed=0,total=0;
 for(let i=0;i<a.length;i+=32){
   if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
     Math.abs(a[i+2]-b[i+2])>35)changed++;
   total++;
 }
 return total?changed/total:0;
}
export function paintInheritedIdeas(target,ideas,{seed=1,cycle=0,recipe=null,
  inspect=true}={}){
 if(!target?.getContext)return {drawn:[],score:0,coverage:0};
 const valid=(ideas||[]).filter(x=>x?.outline?.length===SAMPLES&&x.age<x.ttl);
 if(!valid.length)return {drawn:[],score:0,coverage:0};
 const before=inspect?cvs(target.width,target.height):null;
 if(before)before.getContext('2d').drawImage(target,0,0);
 const ctx=target.getContext('2d');
 const drawn=valid.map(idea=>paintForm(ctx,idea,{
   width:target.width,height:target.height,seed,cycle,recipe
 }));
 for(const row of drawn){
   const impact=before?changedPixels(before,target,row):.1;
   row.visibleChange=+impact.toFixed(4);
   row.materialShift=Number(row.material!==row.was);
   row.score=+clamp(.58*row.fidelity+.20*row.materialShift+
     .22*clamp(impact/.25)).toFixed(4);
 }
 return {
   drawn,score:+(drawn.reduce((a,b)=>a+b.score,0)/drawn.length).toFixed(4),
   coverage:+(drawn.reduce((a,b)=>a+b.w*b.h,0)/
     Math.max(1,target.width*target.height)).toFixed(4)
 };
}
export function advanceStructuralIdeas(ideas,accepted,{seed=1,cycle=0,
  source=null,rendered=null}={}){
 let next=(ideas||[]).filter(x=>x.age+1<x.ttl).map(idea=>{
   const found=rendered?.drawn?.find(x=>x.id===idea.id);
   return {...idea,age:idea.age+1,generation:idea.generation+1,
     material:found?.material||idea.material,
     trust:clamp(idea.trust+((found?.visibleChange||0)>.03?.035:0),-2,2)
   };
 });
 if(!next.length&&source){
   const first=extractStructuralIdea(source,{seed,cycle:Math.max(0,cycle-1)});
   if(first)next=[first];
 }
 if(cycle>0&&cycle%4===0&&next.length<MAX_STRUCTURAL_IDEAS){
   const born=extractStructuralIdea(accepted,{seed,cycle,
     ancestorId:next.at(-1)?.id||null,
     exclude:next.map(x=>({x:x.x,y:x.y,w:x.w,h:x.h}))
   });
   if(born&&!next.some(x=>x.id===born.id))next.push(born);
 }
 return next.slice(-MAX_STRUCTURAL_IDEAS);
}
export function judgeStructuralIdeas(ideas,liked){
 const preferences=heritageTaste();
 const weights={...preferences.weights};
 for(const gene of ideas||[]){
   const material='material:'+(gene.material||'original');
   const shape='shape:'+(gene.holes?.length?'counter':
     gene.stats?.circularity>.49?'round':'angular');
   for(const key of [material,shape]){
     weights[key]=+clamp((weights[key]||0)+(liked?.42:-.50),-8,8).toFixed(2);
   }
 }
 try{
   localStorage.setItem(HERITAGE_PREFERENCE_KEY,JSON.stringify({
     v:1,weights,votes:preferences.votes+1
   }));
 }catch{}
 return (ideas||[]).map(x=>({...x,trust:clamp(x.trust+(liked?.35:-.45),-2,2)}))
   .filter(x=>x.trust>-1.35);
}
export function heritageEvidence(ideas){
 return (ideas||[]).map(x=>({
   id:x.id,sourceId:x.sourceId,ancestorId:x.ancestorId,
   generation:x.generation,age:x.age,ttl:x.ttl,material:x.material,
   trust:+x.trust.toFixed(3),name:x.name,
   confidence:+x.confidence.toFixed(3),
   x:x.x,y:x.y,w:x.w,h:x.h,holes:x.holes.length,
   shape:{aspect:x.stats.aspect,circularity:x.stats.circularity}
 }));
}
export function selectBalancedCandidate(candidates,{strict=false}={}){
 if(!candidates?.length)return null;
 const ranked=candidates.map(item=>{
   const novelty=clamp((item.assessment?.score||0)+.12);
   const harmony=clamp(item.golden?.combined||0);
   const heritage=clamp(item.heritage?.score||0);
   const stale=item.assessment?.redundant?.25:0;
   const score=.41*novelty+.29*harmony+.30*heritage-stale;
   return {...item,threeWay:{W:novelty,phi:harmony,H:heritage,
     score:+score.toFixed(4)}};
 });
 ranked.sort((a,b)=>{
   if(strict&&a.golden?.qualifies!==b.golden?.qualifies)
     return a.golden?.qualifies?-1:1;
   return b.threeWay.score-a.threeWay.score;
 });
 return ranked[0];
}
