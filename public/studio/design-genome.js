/* HEXFIELD 331 / an evolving, reusable design language for real work.
 * An "advertisement" is a spatial purpose, not invented advertising copy.
 * Templates inherit accepted geometry; each child actually re-typesets
 * and reshapes the ONE evaluated canvas. No saved rigid image layouts.
 */
export const DESIGN_PURPOSES=Object.freeze(['art','promo','advert','logo']);
const ORNAMENTS=Object.freeze(['ribbon','brackets','halo','bars','rule']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const hash=value=>{
 let h=2166136261>>>0;
 for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 return h>>>0;
};
const frac=(seed,tag)=>hash(seed+'|'+tag)/4294967296;
const base={
 art:{x:.5,zone:.5,width:.91,height:.23,ornament:'rule',strength:0},
 promo:{x:.49,zone:.32,width:.83,height:.30,ornament:'ribbon',strength:.73},
 advert:{x:.39,zone:.28,width:.65,height:.25,ornament:'brackets',strength:.55},
 logo:{x:.5,zone:.48,width:.70,height:.34,ornament:'halo',strength:.60}
};
const bounds={x:[.24,.76],zone:[.20,.77],width:[.46,.94],height:[.15,.38],strength:[0,.9]};
export function newDesignGenome(purpose='art',seed=1){
 const p=DESIGN_PURPOSES.includes(purpose)?purpose:'art',b=base[p];
 return {v:1,root:'layout-'+hash(p+seed).toString(36),
  purpose:p,seed:seed>>>0,generation:0,
  x:b.x,zone:b.zone,width:b.width,height:b.height,
  ornament:b.ornament,strength:b.strength};
}
export const validDesignGenome=g=>!!g&&g.v===1&&
 DESIGN_PURPOSES.includes(g.purpose)&&ORNAMENTS.includes(g.ornament)&&
 typeof g.root==='string'&&g.root.length<=48&&
 Object.keys(bounds).every(k=>Number.isFinite(g[k])&&g[k]>=bounds[k][0]&&g[k]<=bounds[k][1]);
const TASTE_KEY='hexfield.design-taste.331';
export function designTaste(){
 try{
  const raw=JSON.parse(localStorage.getItem(TASTE_KEY)||'null');
  return raw?.v===1&&raw.scores&&typeof raw.scores==='object'?raw.scores:{};
 }catch{return {};}
}
export function noteDesignVerdict(g,liked){
 if(!validDesignGenome(g)||g.purpose==='art')return false;
 const scores=designTaste(),k=g.purpose+':'+g.ornament;
 scores[k]=clamp((Number(scores[k])||0)+(liked?1:-1),-10,10);
 try{localStorage.setItem(TASTE_KEY,JSON.stringify({v:1,scores}));return true;}
 catch{return false;}
}
export function evolveDesignGenome(parent,{
 purpose='art',seed=1,cycle=0,branch=0,gentle=false
}={}){
 const p=DESIGN_PURPOSES.includes(purpose)?purpose:'art';
 const previous=validDesignGenome(parent)&&parent.purpose===p?
  parent:newDesignGenome(p,seed);
 const child={...previous,generation:Math.min(100000,(previous.generation||0)+1),seed:seed>>>0};
 if(p==='art')return child;
 const genes=['x','zone','width','height','strength'];
 const index=(Math.max(0,cycle)+branch*3+hash(previous.root))%genes.length;
 const key=genes[index], [min,max]=bounds[key];
 const variation=(frac(seed,key)>.5?1:-1)*(max-min)*(gentle?.06:.12);
 child[key]=+clamp(previous[key]+variation,min,max).toFixed(4);
 // Actual KEEP/REJECT votes guide which physical accent is inherited.
 if(branch===2&&cycle%3===2){
  const current=ORNAMENTS.indexOf(previous.ornament);
  const options=[ORNAMENTS[(current+1)%ORNAMENTS.length],
    ORNAMENTS[(current+3)%ORNAMENTS.length]];
  const taste=designTaste();
  options.sort((a,b)=>(taste[p+':'+b]||0)-(taste[p+':'+a]||0));
  child.ornament=options[0];
 }
 return child;
}
const brightness=(rgb,i)=>.2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2];
/** Choose a nearby quieter band, not a blind top/middle/bottom preset. */
export function designBounds(before,w,h,genome,seed=1){
 if(!validDesignGenome(genome)||genome.purpose==='art')return null;
 const height=Math.max(18,Math.round(h*genome.height)),
  width=Math.max(22,Math.round(w*genome.width)),
  centerX=Math.round(w*genome.x);
 const desired=Math.round(h*genome.zone-height/2);
 const candidates=[-2,-1,0,1,2].map((shift,i)=>{
  const top=Math.round(clamp(desired+shift*h*.034,4,h-height-4));
  let change=0,samples=0;
  const x0=Math.round(clamp(centerX-width/2,0,w-1)),x1=Math.round(clamp(centerX+width/2,1,w));
  for(let y=top+4;y<top+height-3;y+=7)
   for(let x=x0+4;x<x1-3;x+=11){
    const j=(y*w+x)*4,k=((y-3)*w+x)*4;
    change+=Math.abs(brightness(before,j)-brightness(before,k))/255;
    samples++;
   }
  return {top,score:change/Math.max(1,samples)+
   Math.abs(shift)*.023+frac(seed,'place'+i)*.012};
 });
 candidates.sort((a,b)=>a.score-b.score);
 return {top:candidates[0].top,height,centerX,widthRatio:genome.width,
  activity:+candidates[0].score.toFixed(4),purpose:genome.purpose};
}
/** Original pigment controls accent contrast. These are real image pixels. */
export function paintDesignAccent(ctx,before,w,h,bounds,genome){
 if(!bounds||!validDesignGenome(genome)||genome.purpose==='art')return false;
 const x=Math.round(clamp(bounds.centerX-w*bounds.widthRatio*.52,3,w-5)),
  rw=Math.round(Math.min(w-x-3,w*bounds.widthRatio*1.04)),
  y=bounds.top,rh=bounds.height;
 const probe=((clamp(Math.round(y+rh/2),0,h-1)*w)+
   clamp(Math.round(bounds.centerX),0,w-1))*4;
 const dark=brightness(before,probe)>125;
 const r=dark?28:237,g=dark?39:223,b=dark?47:198;
 const ink='rgb('+r+','+g+','+b+')';
 const opposite=dark?'rgb(229,118,67)':'rgb(82,210,172)';
 ctx.save();ctx.globalAlpha=clamp(genome.strength*.77,0,.72);
 ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=Math.max(2,Math.round(w*.003));
 const unit=Math.max(3,Math.round(h*.009));
 switch(genome.ornament){
  case 'ribbon':
   ctx.fillRect(x,y+rh+unit,rw,unit*2);
   ctx.fillRect(x,y-unit*2,Math.round(rw*.28),unit);break;
  case 'brackets':
   for(const side of [x,x+rw]){
    const dir=side===x?1:-1;
    ctx.beginPath();ctx.moveTo(side+dir*unit*3,y);
    ctx.lineTo(side,y);ctx.lineTo(side,y+rh);
    ctx.lineTo(side+dir*unit*3,y+rh);ctx.stroke();
   }break;
  case 'halo':
   ctx.beginPath();ctx.ellipse(bounds.centerX,y+rh*.5,
    Math.max(10,rw*.51),Math.max(8,rh*.79),0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle=opposite;ctx.fillRect(x+rw*.46,y+rh+unit*3,rw*.08,unit);break;
  case 'bars':
   for(let i=0;i<5;i++)ctx.fillRect(x+i*rw/5,y+rh+unit,
    rw*.12,unit*(i%2+1));break;
  default:
   ctx.fillRect(x,y-unit*2,rw,unit);
   ctx.fillRect(x,y+rh+unit,rw,unit);break;
 }
 ctx.restore();return true;
}
/** A few percent influence from REAL composited legibility, never a
 * replacement for global novelty, golden geometry or structural heritage.
 */
export function rankDesignCandidates(ranked,{purpose='art',strict=false}={}){
 if(purpose==='art'||!Array.isArray(ranked)||ranked.length<2)return ranked;
 return [...ranked].map(entry=>{
  const legibility=clamp(entry.composite?.legibility??0,0,1);
  const measure=entry.composite?.painted?
   (entry.threeWay?.score||0)+.04*(legibility-.5):
   (entry.threeWay?.score||0)-.02;
  return {...entry,designJudgement:{legibility,
   score:+measure.toFixed(5)}};
 }).sort((a,b)=>{
  if(strict&&!!a.golden?.qualifies!==!!b.golden?.qualifies)
   return a.golden?.qualifies?-1:1;
  return b.designJudgement.score-a.designJudgement.score;
 });
}
