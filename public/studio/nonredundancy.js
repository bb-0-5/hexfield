/* HEXFIELD 305 / GLOBAL NON-REDUNDANCY
 * Shared across Rule Studio, landscape, logo anatomy, and legacy archive.
 * Encodes VISUAL observations and METHODS in one bounded local browser record.
 * Deterministic descendant seeds are derived from the current seed.
 * This is a novelty guard and complexity proxy, NOT an aesthetic oracle.
 */
import {measureGoldenTaste,goldenPrior,getGoldenMode} from './golden-taste.js';
export const NOVELTY_STORAGE='hexfield.global-nonredundancy.v1';
export const OBSERVATION_LIMIT=84;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const FINGERPRINT_WIDTH=24,FINGERPRINT_HEIGHT=16;
const VERSION=1;
const encode=(v)=>Math.max(0,Math.min(15,Math.round(v/17)));
export function evolveSeed(seed,generation=1,branch=0,tag='canvas'){
 let x=((Number(seed)>>>0)^0x9E3779B9)>>>0;
 for(const c of String(tag).slice(0,45)){
   x=Math.imul((x^c.charCodeAt(0))>>>0,0x85ebca6b)>>>0;
   x^=x>>>13;
 }
 x=(x+Math.imul((Number(generation)||1)>>>0,0x27d4eb2d)+
   Math.imul((Number(branch)||0)+1,0x165667b1))>>>0;
 x^=x>>>16;x=Math.imul(x,0x7feb352d)>>>0;
 x^=x>>>15;x=Math.imul(x,0x846ca68b)>>>0;
 return ((x^(x>>>16))>>>0)||1;
}
export function canvasFingerprint(canvas){
 if(!canvas?.getContext)throw Error('Cannot fingerprint a non-canvas value');
 const small=document.createElement('canvas');
 small.width=FINGERPRINT_WIDTH;small.height=FINGERPRINT_HEIGHT;
 const ctx=small.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('2D canvas unavailable for novelty measurement');
 ctx.fillStyle='#edece6';ctx.fillRect(0,0,small.width,small.height);
 ctx.drawImage(canvas,0,0,small.width,small.height);
 const data=ctx.getImageData(0,0,FINGERPRINT_WIDTH,FINGERPRINT_HEIGHT).data;
 let light='',chroma='',edges='',hist=new Array(16).fill(0),
  sum=0,colours=[0,0,0],changes=0,gridVariance=0;
 const all=[];
 for(let i=0;i<data.length;i+=4){
   const l=Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);
   const index=i/4;
   all.push(l);sum+=l;hist[encode(l)]++;
   colours[0]+=data[i];colours[1]+=data[i+1];colours[2]+=data[i+2];
   light+=encode(l).toString(16);
   const max=Math.max(data[i],data[i+1],data[i+2]);
   const min=Math.min(data[i],data[i+1],data[i+2]);
   chroma+=((max-min)<20?'0':max===data[i]?'1':max===data[i+1]?'2':'3');
 }
 let highEdges=0,edgeSum=0;
 for(let y=0;y<FINGERPRINT_HEIGHT;y++)for(let x=0;x<FINGERPRINT_WIDTH;x++){
   const i=y*FINGERPRINT_WIDTH+x,px=all[i];
   const dx=x?Math.abs(px-all[i-1]):0,dy=y?Math.abs(px-all[i-FINGERPRINT_WIDTH]):0;
   const e=clamp((dx+dy)*.5,0,255);
   const digit=encode(e);
   edges+=digit.toString(16);
   edgeSum+=e;
   if(e>28)highEdges++;
 }
 const mean=sum/all.length,variance=all.reduce((acc,l)=>acc+(l-mean)**2,0)/all.length;
 const entropy=hist.reduce((a,b)=>b? a-(b/all.length)*Math.log2(b/all.length):a,0)/4;
 // Entropy without spatial edge contrast is frequently just a smooth wash.
 // Do not mistake increased pixel noise for progress; both must contribute.
 const edgeDensity=highEdges/all.length;
 const active=all.filter(l=>Math.abs(l-mean)>25).length/all.length;
 const structure=clamp(.36*entropy+.38*edgeDensity+.26*Math.sqrt(variance)/110,0,1);
 const hash=light+edges+chroma;
 return {
   v:VERSION,w:FINGERPRINT_WIDTH,h:FINGERPRINT_HEIGHT,
   light,edges,chroma,
   mean:Math.round(mean),rgb:colours.map(v=>Math.round(v/all.length)),
   structure:+structure.toFixed(4),entropy:+entropy.toFixed(4),
   edgeDensity:+edgeDensity.toFixed(4),active:+active.toFixed(4),
   hash:hash.length
 };
}
function valid(fp){
 return fp?.v===1&&typeof fp.light==='string'&&fp.light.length===384&&
   typeof fp.edges==='string'&&fp.edges.length===384&&
   typeof fp.chroma==='string'&&fp.chroma.length===384;
}
export function fingerprintDistance(a,b){
 if(!valid(a)||!valid(b))return 1;
 let l=0,e=0,c=0;
 for(let i=0;i<384;i++){
   l+=Math.abs(parseInt(a.light[i],16)-parseInt(b.light[i],16))/15;
   e+=Math.abs(parseInt(a.edges[i],16)-parseInt(b.edges[i],16))/15;
   c+=a.chroma[i]===b.chroma[i]?0:1;
 }
 // Coarse image content dominates. Edge topology prevents flat
 // recolouring from being mistaken for a new composition.
 return clamp(.52*l/384+.30*e/384+.12*c/384+
   .06*Math.abs(a.structure-b.structure),0,1);
}
export function methodSignature({
  mode='',genome='',primary='',secondary='',mark='',rework='',blend='',scene='',
  subject='',text='',style='',type='',parents='',application='',markProgram='',interaction=''
}={}){
 return [mode,genome,primary,secondary,mark,rework,blend,scene,subject,
   text,style,type,parents,application,markProgram,interaction].map(x=>String(x??'').slice(0,140)).join('|').slice(0,760);
}
function empty(){return {v:1,records:[],tally:0};}
function read(){
 try{
   const obj=JSON.parse(localStorage.getItem(NOVELTY_STORAGE)||'null');
   return obj?.v===1&&Array.isArray(obj.records)?
     {v:1,tally:Number(obj.tally)||0,records:obj.records.filter(x=>valid(x.fp)).slice(-OBSERVATION_LIMIT)}:empty();
 }catch{return empty();}
}
function write(memory){
 try{localStorage.setItem(NOVELTY_STORAGE,JSON.stringify({
   v:VERSION,tally:memory.tally,records:memory.records.slice(-OBSERVATION_LIMIT)
 }));return true;}catch{return false;}
}
export function noveltyAssessment(fp,{mode='global',method='',parent=null,history=null}={}){
 const records=Array.isArray(history)?history:read().records;
 const sameMode=records.filter(r=>r.mode===mode);
 const nearest=list=>list.reduce((best,r)=>{
   const distance=fingerprintDistance(fp,r.fp);
   return distance<best.distance?{distance,method:r.method,mode:r.mode,serial:r.serial}:best;
 },{distance:1,method:'',mode:'',serial:null});
 const local=nearest(sameMode),global=nearest(records);
 const parentFp=parent?.getContext?canvasFingerprint(parent):
   valid(parent)?parent:null;
 const parentDistance=parentFp?fingerprintDistance(fp,parentFp):1;
 const repeated=records.slice(-28).filter(r=>r.method&&method&&r.method===method).length;
 const exact=sameMode.some(r=>fingerprintDistance(fp,r.fp)<.021);
 // Soft global guard: two disciplines can legitimately share a motif.
 const nearestDistance=Math.min(local.distance,.50*global.distance+.50);
 const complexityGain=parentFp?fp.structure-parentFp.structure:0;
 const score=clamp(
   .58*local.distance+
   .17*global.distance+
   .20*parentDistance+
   .12*clamp(complexityGain,-.4,.4)-
   .028*Math.min(5,repeated),-1,1);
 return {
   novelty:+local.distance.toFixed(4),globalNovelty:+global.distance.toFixed(4),
   parentNovelty:+parentDistance.toFixed(4),
   complexity:+fp.structure.toFixed(4),
   complexityGain:+complexityGain.toFixed(4),
   methodRepeats:repeated,exact,nearest:local.serial,
   score:+score.toFixed(4),
   redundant:exact||(
     local.distance<.055&&parentDistance<.065&&repeated>=1
   ),
   observed:records.length,
   nearestDistance:+nearestDistance.toFixed(4)
 };
}
export function assessCanvas(canvas,options={}){
 const fp=canvasFingerprint(canvas);
 return {...noveltyAssessment(fp,options),fingerprint:fp};
}
export function commitCanvas(canvas,{mode='global',method='',seed=0,parentId=null,
  evaluation=null}={}){
 const fp=evaluation?.fingerprint||canvasFingerprint(canvas);
 if(!valid(fp))throw Error('Invalid novelty observation');
 const memory=read();
 const stats=noveltyAssessment(fp,{mode,method,history:memory.records});
 // Global memory is append-only within a bounded ring, and duplicate
 // renders may be observed when users explicitly request exact copies.
 memory.tally++;
 memory.records.push({
   fp,mode:String(mode).slice(0,32),method:String(method).slice(0,550),
   seed:Number(seed)>>>0,parentId:parentId||null,
   serial:memory.tally
 });
 memory.records=memory.records.slice(-OBSERVATION_LIMIT);
 write(memory);
 return {...stats,count:memory.tally};
}
export function snapshotNoveltyMemory(){
 const m=read();return {count:m.tally,stored:m.records.length,
   modes:[...new Set(m.records.map(r=>r.mode))],
   last:m.records.at(-1)||null};
}
export function rankNoveltyCandidates(candidates,{mode='global',parent=null,
  goldenMode=getGoldenMode()}={}){
 // The caller owns the candidate canvases. Neither scores nor trial images
 // are recorded before the chosen candidate has been rendered in full.
 // Golden geometry, color proportions and color↔structure coupling are
 // separate, observable constraints; W novelty remains a second objective.
 const ranked=candidates.map((candidate,index)=>{
   const assessment=assessCanvas(candidate.canvas,
     {mode,method:candidate.method||'',parent,history:candidate.history});
   const golden=measureGoldenTaste(candidate.canvas,{mode});
   const weighted=assessment.score+
     goldenPrior(golden,{mode:goldenMode})*.60;
   return {...candidate,index,assessment,golden,weighted};
 });
 ranked.sort((a,b)=>{
   if(goldenMode==='strict'&&a.golden.qualifies!==b.golden.qualifies)
     return a.golden.qualifies?-1:1;
   if(a.assessment.redundant!==b.assessment.redundant)
     return a.assessment.redundant?1:-1;
   return b.weighted-a.weighted;
 });
 return ranked;
}
