/* Hexfield Build 303 / A true parent→child abstracting process.
 * At every iteration combine renderers at pixel level, enforce new formal
 * visual laws, then use the ACTUAL result as the next source image.
 * Explicit start/stop. Never invokes a paid image model automatically.
 */
import {makeRecipe,mutateRecipe,applyRules,noteLineage,LAWS,MARKS} from './rule-engine.js';
import {createSourceBank,mixSources,cloneCanvas} from './source-mixer.js';
export const REWORK_SEQUENCE=['abstract_masses','negative_repaint','misread','remove_strength'];
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const choice=a=>a[Math.floor(Math.random()*a.length)];
const freshCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function visualDelta(a,b){
 if(!a||!b)return 1;
 const w=48,h=30;
 const sample=canvas=>{
   const c=freshCanvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(canvas,0,0,w,h);return ctx.getImageData(0,0,w,h).data;
 };
 const x=sample(a),y=sample(b);let dist=0;
 for(let i=0;i<x.length;i+=4)dist+=
   (Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]))/765;
 return dist/(w*h);
}
export function nextAbstractRecipe(parent,{cycle=0,subject='abstract',lockLaw=false,
  law='surprise',secondary='none',mark='surprise'}={}){
 const options={subject:subject==='surprise'?'abstract':subject};
 let recipe;
 if(!parent)recipe=makeRecipe({
   ...options,primary:law,secondary,mark,
   rework:'abstract_masses',seed:(Math.random()*4294967295)>>>0
 });
 else {
   const focus=cycle%5===1?'mark':cycle%4===0?'law':'rework';
   recipe=mutateRecipe(parent,focus);
   recipe.rework=REWORK_SEQUENCE[cycle%REWORK_SEQUENCE.length];
   recipe.parentId=parent.id;
   recipe.generation=(parent.generation||0)+1;
   if(cycle%9===0)recipe.seed=((parent.seed>>>0)+cycle*9973)>>>0;
   if(lockLaw&&law!=='surprise'){recipe.primary=law;recipe.secondary=secondary==='none'?'none':secondary;}
   if(lockLaw&&mark!=='surprise')recipe.mark=mark;
   if(recipe.rework==='remove_strength'){
     if(lockLaw&&mark!=='surprise'){
       // The user explicitly locked the brush. Do a subtractive rebuild
       // rather than silently violating that lock.
       recipe.rework='negative_repaint';
     }else{
       recipe.forbiddenMark=parent.mark;
       if(recipe.mark===parent.mark)
         recipe.mark=choice(Object.keys(MARKS).filter(x=>x!==parent.mark));
     }
   }
 }
 if(recipe.primary===recipe.secondary)recipe.secondary='none';
 if(!(recipe.primary in LAWS))recipe.primary=choice(Object.keys(LAWS));
 if(!(recipe.mark in MARKS))recipe.mark=choice(Object.keys(MARKS));
 return recipe;
}
export function createAbstractionLoop({
  width=720,height=450,
  getArchive=()=>null,getUploaded=()=>null,getParent=()=>null,
  onFrame=()=>{},onState=()=>{},onError=()=>{}
}={}){
 const bank=createSourceBank({width,height,getArchive,getUploaded,getParent});
 let running=false,waiting=false,timer=null,activeStep=false;
 let cycle=0,seed=Math.floor(Math.random()*4294967295),last=null;
 let lastRecipe=null,config={},lastMix=null,lastError=null;
 let stamps=[],stamp=0,forceFreshSources=true;
 const state=()=>({
   running,waiting,cycle,recipe:lastRecipe,
   sourceNames:lastMix?.sources||[],method:lastMix?.mode||null,
   lastError,history:stamps.map(x=>({...x})),
   waitingReason:waiting?'Page hidden':''
 });
 const status=()=>onState(state());
 function delay(ms){
   if(timer)clearTimeout(timer);
   if(!running||document.hidden){waiting=!!running;status();return;}
   waiting=false;
   timer=setTimeout(()=>{timer=null;void step();},ms);
 }
 function pause(){
   running=false;waiting=false;stamp++;
   if(timer)clearTimeout(timer);timer=null;
   status();
 }
 function reset(){
   pause();cycle=0;last=null;lastRecipe=null;lastMix=null;stamps=[];seed=Math.floor(Math.random()*4294967295);
   bank.clear();forceFreshSources=true;status();
 }
 function configure(newConfig={}){
   config={...config,...newConfig};
   if(typeof config.speed!=='number'||!Number.isFinite(config.speed))config.speed=3000;
   config.speed=clamp(config.speed,1200,12000);
   status();
 }
 async function step(){
   if(activeStep||document.hidden)return;
   activeStep=true;
   const currentStamp=stamp;
   try{
     const previous=last||getParent();
     const recipe=nextAbstractRecipe(lastRecipe,{cycle,subject:config.subject||'abstract',
       lockLaw:!!config.lockLaw,law:config.law||'surprise',
       secondary:config.secondary||'none',mark:config.mark||'surprise'});
     // Every 6th generation, rebuild the landscape / typography donors. Both
     // create their own new procedure trees, not just recolour an old image.
     if(cycle===0||cycle%6===0||forceFreshSources){
       const refreshSeed=(seed+Math.imul(cycle+1,2654435761))>>>0;
       try{
         await bank.refresh(refreshSeed,recipe.subject,{force:true});
         forceFreshSources=false;
       }catch(error){
         forceFreshSources=true;
         lastError='One renderer unavailable: '+String(error.message||error).slice(0,120);
       }
     }
     if(currentStamp!==stamp)return;
     const inputs=bank.sources(previous);
     if(!inputs.length)throw Error('No renderer produced an image');
     const mixed=mixSources(inputs,{width,height,cycle,seed,
       mode:config.mixMode||'auto'});
     const output=freshCanvas(width,height);
     const metrics=applyRules(mixed.canvas,output,recipe,{iteration:cycle});
     if(currentStamp!==stamp)return;
     const novelty=visualDelta(previous,output);
     // A monotonous feedback loop gets a new reality/terrain source next pass.
     // This is a mechanical novelty guard, not an aesthetic quality score.
     const stalled=cycle>2&&novelty<.035;
     const result={canvas:output,recipe,cycle:cycle+1,metrics,
       blend:mixed.mode,sources:mixed.sources,novelty,stalled};
     last=output;lastRecipe=recipe;lastMix=mixed;cycle++;lastError=null;
     noteLineage(recipe);
     const frame=freshCanvas(164,104);frame.getContext('2d').drawImage(output,0,0,164,104);
     stamps.push({cycle,thumb:frame.toDataURL('image/webp',.60),
       id:recipe.id,parentId:recipe.parentId,
       mark:recipe.mark,law:recipe.primary,blend:mixed.mode,novelty});
     stamps=stamps.slice(-10);
     try{onFrame(result)}catch(error){onError(error)}
     status();
     if(stalled){
       // Never leave the next cycle with only its parent. Rebuild REALITY,
       // TERRAIN, and LETTERING before executing the next generation.
       bank.clear();
       forceFreshSources=true;
       seed=(seed+0x9E3779B9)>>>0;
     }
   }catch(error){
     lastError=String(error.message||error).slice(0,240);
     onError(error);status();
   }finally{
     activeStep=false;
     if(running)delay(config.speed||3000);
   }
 }
 function start(options={}){
   configure(options);
   if(running)return;
   running=true;waiting=false;stamp++;
   if(!document.hidden){void step();}
   else{waiting=true;status();}
 }
 function once(options={}){
   configure(options);
   if(activeStep)return;
   stamp++;
   void step();
 }
 function onVisibility(){
   if(!running)return;
   if(document.hidden){
     waiting=true;if(timer)clearTimeout(timer);timer=null;
     status();
   }else if(!activeStep){
     delay(120);
   }
 }
 document.addEventListener('visibilitychange',onVisibility);
 function dispose(){
   pause();document.removeEventListener('visibilitychange',onVisibility);
   bank.clear();
 }
 return {start,pause,once,reset,configure,state,dispose,
   isRunning:()=>running,getLast:()=>last,getRecipe:()=>lastRecipe};
}
