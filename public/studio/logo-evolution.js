/* Build 304 / continuously mutate the *construction* of named letter parts.
 * Unlike raster recursion this preserves the actual text as its reference.
 * Each child inherits the parent genome, mutating one area plus a construction
 * operation. No cloud inference is triggered by this loop.
 */
const $=id=>document.getElementById(id);
const FOCI=['structure','surface','light'];
const safe=(t)=>String(t||'').slice(0,170);
export function initLogoEvolution({getRecipe,paint,onFrame=()=>{},onError=()=>{}}){
 let running=false,active=false,timer=null,epoch=0,cycle=0,history=[];
 const summary=(extra='')=>{
   $('logoEvolutionStart').disabled=running;
   $('logoEvolutionStop').disabled=!running;
   $('logoEvolutionOnce').disabled=running||active;
   $('logoEvolutionStatus').textContent=(running?'LIVE':'PAUSED')+' / '+
     cycle+' mutating generations'+(extra?' / '+extra:'');
   const strip=$('logoEvolutionStrip');strip.replaceChildren();
   for(const item of history.slice(-9).reverse()){
     const fig=document.createElement('figure'),img=document.createElement('img'),
       cap=document.createElement('figcaption');
     img.src=item.thumb;img.alt='Anatomical logo generation '+item.generation;
     cap.textContent='#'+item.generation+' '+item.part+' : '+item.operation+
       (item.distance===null?'':' · Δ'+item.distance.toFixed(2));
     fig.append(img,cap);strip.append(fig);
   }
 };
 const speed=()=>Math.min(7000,Math.max(1500,Number($('logoEvolutionSpeed').value)||3500));
 function pause(message=''){
   running=false;epoch++;
   if(timer)clearTimeout(timer);timer=null;
   summary(message||'manually paused');
 }
 async function step(){
   if(active||document.hidden)return;
   active=true;const token=epoch;
   try{
     const parent=getRecipe();
     if(!parent?.genome||parent.mode!=='lettering')throw Error('Select LOGOS and paint an initial wordmark.');
     const focus=FOCI[cycle%FOCI.length];
     const child=await paint(parent,focus);
     if(token!==epoch)return;
     if(!child?.genome)throw Error('The letter designer could not finish a generation.');
     cycle++;
     const rule=child.anatomy?.rules?.[0]||child.genome.anatomy?.rules?.[0];
     const thumb=document.createElement('canvas');thumb.width=200;thumb.height=123;
     thumb.getContext('2d').drawImage($('artwork'),0,0,200,123);
     history.push({generation:cycle,part:rule?.target||'glyph',operation:rule?.operation||focus,
       distance:child._measuredDistance??null,
       thumb:thumb.toDataURL('image/webp',.55)});
     history=history.slice(-9);
     onFrame(child);
     summary((rule?.target||'whole letter')+' / '+(rule?.operation||focus)+
       ' / descendant of the previous procedure');
   }catch(error){
     onError(error);
     summary('renderer stopped: '+safe(error?.message||error));
     running=false;
   }finally{
     active=false;
     if(running&&token===epoch){
       timer=setTimeout(()=>{timer=null;void step();},speed());
     }
     summary();
   }
 }
 function start(){
   if(running)return;
   if(document.hidden){summary('page hidden — cannot start');return;}
   running=true;epoch++;summary('mutating font anatomy');
   void step();
 }
 function once(){
   if(active||running)return;
   epoch++;void step();
 }
 const visibility=()=>{if(document.hidden&&running)pause('hidden tab automatically paused');};
 document.addEventListener('visibilitychange',visibility);
 $('logoEvolutionStart').addEventListener('click',start);
 $('logoEvolutionStop').addEventListener('click',()=>pause());
 $('logoEvolutionOnce').addEventListener('click',once);
 summary('ready');
 return {start,once,pause,state:()=>({running,cycle,history:history.length}),
   dispose(){pause();document.removeEventListener('visibilitychange',visibility);}};
}
