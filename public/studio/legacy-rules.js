/* Build 302 / archive rule constraint layer. Same executable painter
 * as the new Rule Studio. The historical field and museum stay intact;
 * its live output is the source for rule painting, and a ruled painting can
 * recursively become the next painting's source.
 */
import {LAWS,MARKS,REWORKS,makeRecipe,mutateRecipe,applyRules,
  noteRuleVerdict,noteLineage} from './rule-engine.js';
import {createAbstractionLoop} from './abstraction-loop.js';
import {publishSource} from './source-mixer.js';
import {evolveSeed,rankNoveltyCandidates,assessCanvas,commitCanvas,
  methodSignature} from './nonredundancy.js';
const $=id=>document.getElementById(id);
const stage=$('stage'),raw=$('view'),mount=$('legacyRulesMount');
if(stage&&raw&&mount){
 const option=(items,auto=false)=>(auto?'<option value="surprise">Invent from memory</option>':'')+
   Object.entries(items).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('');
 mount.innerHTML=[
 '<label for="legacyLaw">LAW / FORBIDDEN AFFORDANCE</label><select id="legacyLaw">',option(LAWS,true),'</select>',
 '<label for="legacySecondary">SECOND LAW</label><select id="legacySecondary"><option value="none">None</option>',option(LAWS),'</select>',
 '<label for="legacyMark">MARK-MAKING</label><select id="legacyMark">',option(MARKS,true),'</select>',
 '<label for="legacyRework">REWORK PASS</label><select id="legacyRework">',option(REWORKS),'</select>',
 '<label class="hex-check"><input id="legacyAutoLaw" type="checkbox" checked> CONSTRAIN EACH NEW ARCHIVE FIELD</label>',
 '<div class="legacy-loop-controls"><strong>∞ CONTINUOUS ABSTRACTION / COMBINE RENDERERS</strong>',
 '<label for="legacyLoopMode">MIX MODE</label><select id="legacyLoopMode">',
 '<option value="auto">Evolve mixing strategies</option>',
 '<option value="quilt">Quilt / every renderer</option>',
 '<option value="cutaway">Negative-space cutaways</option>',
 '<option value="dissonance">Colour-channel collisions</option>',
 '<option value="relief">Relief / displacement</option>',
 '<option value="edges">Edge-driven repaint</option></select>',
 '<label for="legacyLoopSpeed">SECONDS BETWEEN REWORKS</label>',
 '<select id="legacyLoopSpeed"><option value="1500">1.5 (fast)</option>',
 '<option value="3000">3</option><option value="5000" selected>5 (steady)</option>',
 '<option value="8000">8 (slow)</option></select>',
 '<label class="hex-check"><input id="legacyLoopLock" type="checkbox"> Lock my chosen law &amp; mark system</label>',
 '<div class="hex-rule-buttons"><button id="legacyLoopStart" type="button">▶ CONTINUOUSLY ABSTRACT</button>',
 '<button id="legacyLoopPause" type="button" disabled>Ⅱ PAUSE LOOP</button>',
 '<button id="legacyLoopOnce" type="button">ONE MORE PASS</button></div>',
 '<p id="legacyLoopStatus" role="status">Every step will blend previous output + actual archive field + terrain + typography + saved references.</p>',
 '<div id="legacyLoopStrip" aria-label="Recent generations"></div></div>',
 '<div class="hex-rule-buttons"><button id="legacyApplyLaw" type="button">APPLY LAW</button>',
 '<button id="legacyChangeLaw" type="button">NEW LAW / SAME FIELD</button>',
 '<button id="legacyRework" type="button">REPAINT RULED RESULT</button>',
 '<button id="legacyViewOriginal" type="button">ORIGINAL / RULED</button>',
 '<button id="legacySaveLaw" type="button">SAVE RULED PNG</button></div>',
 '<label for="legacyCritique">IF REJECTED, WHAT FAILED?</label><input id="legacyCritique" maxlength="230" placeholder="same marks / wrong law / too realistic">',
 '<div class="hex-rule-buttons"><button id="legacyKeepLaw" type="button">♥ KEEP METHOD</button>',
 '<button id="legacyRejectLaw" type="button">✕ REJECT METHOD</button></div>',
 '<p id="legacyRuleStatus" role="status" aria-live="polite">Old generator supplies reality; the rules are executable. Museum and raw print data stay untouched.</p>'
 ].join('');
 const constrained=document.createElement('canvas');
 constrained.id='legacyRuleCanvas';constrained.width=1100;constrained.height=250;
 constrained.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;background:transparent;border:0;display:none;';
 stage.append(constrained);
 let current=null,savedReference=null,observedRevision=null,autoTimer=null;
 const status=s=>{$('legacyRuleStatus').textContent=s;};
 function paintStrip(history){
   const strip=$('legacyLoopStrip');strip.replaceChildren();
   for(const item of history.slice(-8).reverse()){
     const fig=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
     img.src=item.thumb;img.alt='Abstract generation '+item.cycle;
     caption.textContent='#'+item.cycle+' '+item.blend+' / '+item.law;
     fig.append(img,caption);strip.append(fig);
   }
 }
 const controls=()=>({
   speed:Number($('legacyLoopSpeed').value)||5000,
   mixMode:$('legacyLoopMode').value,
   lockLaw:$('legacyLoopLock').checked,
   subject:'abstract',
   law:$('legacyLaw').value,secondary:$('legacySecondary').value,
   mark:$('legacyMark').value
 });
 const loop=createAbstractionLoop({
   width:880,height:200,
   getArchive:()=>raw,
   getParent:()=>current?.output||null,
   onFrame(result){
     constrained.width=880;constrained.height=200;
     constrained.getContext('2d').drawImage(result.canvas,0,0,880,200);
     constrained.style.display='block';
     current={recipe:result.recipe,output:shot(constrained),judged:false};
     status('GEN '+result.cycle+' / '+result.blend+' / '+result.sources.join(' + ')+
       ' / '+result.metrics.strokes+' marks / global novelty '+
       ((result.nonredundancy?.globalNovelty||0)*100).toFixed(1)+
       '% / complexity '+((result.nonredundancy?.complexity||0)*100).toFixed(1)+'%');
     if(result.cycle%4===0)publishSource(constrained,'archive',result.recipe);
   },
   onState(state){
     $('legacyLoopStart').disabled=state.running;
     $('legacyLoopPause').disabled=!state.running;
     $('legacyLoopOnce').disabled=state.running;
     $('legacyLoopStatus').textContent=(state.running?'LIVE':'PAUSED')+' / '+state.cycle+
       ' revisions / '+(state.method||'not yet mixed')+
       ' / renderers '+(state.sourceNames?.join(', ')||'awaiting first pass')+
       (state.waiting?' / hidden tab paused':'')+
       (state.nonredundancy?' / W novelty '+
         (state.nonredundancy.novelty*100).toFixed(1)+
         '% · complexity '+(state.nonredundancy.complexity*100).toFixed(1)+'%':'')+
       (state.lastError?' / '+state.lastError:'');
     paintStrip(state.history||[]);
   },
   onError(error){status('Recovered from one renderer error: '+String(error?.message||error).slice(0,150));}
 });
 const dimensions=()=>({w:1100,h:Math.max(120,Math.round(1100*(raw.height||500)/(raw.width||2200)))});
 function shot(source){
   const {w,h}=dimensions(),c=document.createElement('canvas');c.width=w;c.height=h;
   c.getContext('2d').drawImage(source,0,0,w,h);return c;
 }
 const selections=()=>({subject:'abstract',primary:$('legacyLaw').value,
   secondary:$('legacySecondary').value,mark:$('legacyMark').value,rework:$('legacyRework').value});
 function paint(recipe,source){
   if(!source)return;
   const old=current?.output||null,{w,h}=dimensions();
   constrained.width=w;constrained.height=h;
   const metrics=applyRules(shot(source),constrained,recipe,{iteration:recipe.generation});
   const method=methodSignature({mode:'archive',primary:recipe.primary,
     secondary:recipe.secondary,mark:recipe.mark,rework:recipe.rework});
   const measured=assessCanvas(constrained,{mode:'archive',method,parent:old});
   const W=commitCanvas(constrained,{
     mode:'archive',method,seed:recipe.seed,parentId:recipe.parentId,evaluation:measured
   });
   constrained.style.display='block';
   current={recipe,output:shot(constrained),judged:false,nonredundancy:W};
   noteLineage(recipe);
   publishSource(constrained,'archive',recipe);
   status('EXECUTED '+metrics.strokes+' constrained marks, '+metrics.skipped+
     ' forbidden/negative-space marks. '+recipe.primary+' / '+recipe.mark+
     ' / global W novelty '+(W.globalNovelty*100).toFixed(1)+
     '%; structure '+(W.complexity*100).toFixed(1)+'%'+
     (W.redundant?' / repeated image — mutate the law':'')+
     (recipe.parentId?' / child of '+recipe.parentId.slice(0,7):''));
 }
 function applyFresh(){
   loop.pause();
   try{
     savedReference=shot(raw);
     const values=selections(),options=[];
     const parent=current?.recipe||null;
     const rootSeed=parent?.seed??(
       Number(window.__hexfield?.getCurrent?.()?.seed)||
       ((Math.random()*4294967295)>>>0)
     );
     for(let i=0;i<3;i++){
       const derived=evolveSeed(rootSeed,(parent?.generation||0)+1,i,'legacy-raw');
       const recipe=makeRecipe({...values,seed:derived,
         parentId:parent?.id||null,generation:(parent?.generation||0)+1});
       const candidate=document.createElement('canvas');
       candidate.width=savedReference.width;candidate.height=savedReference.height;
       applyRules(savedReference,candidate,recipe,{iteration:recipe.generation});
       const method=methodSignature({mode:'archive',primary:recipe.primary,
         secondary:recipe.secondary,mark:recipe.mark,rework:recipe.rework});
       options.push({canvas:candidate,recipe,method});
     }
     const [best]=rankNoveltyCandidates(options,{
       mode:'archive',parent:current?.output||null
     });
     paint(best.recipe,savedReference);
   }catch(e){status('Could not apply law: '+String(e.message||e).slice(0,130));}
 }
 function child(focus){
   loop.pause();
   try{
     if(!current){applyFresh();return;}
     const recipe=mutateRecipe(current.recipe,focus,'archive');
     if(focus==='law'&&savedReference){
       recipe.mark=current.recipe.mark;recipe.secondary=current.recipe.secondary;
       paint(recipe,savedReference);
     }else{
       recipe.rework=$('legacyRework').value==='none'?'abstract_masses':$('legacyRework').value;
       paint(recipe,current.output);
     }
   }catch(e){status('Rule repaint failed: '+String(e.message||e).slice(0,130));}
 }
 function update(){
   if(loop.isRunning())return; // Every subsequent pass reads the live archive canvas as a source.
   if($('legacyAutoLaw').checked)applyFresh();
   else{constrained.style.display='none';status('Experimental field generated. APPLY LAW to render it under constraints.');}
 }
 $('legacyLoopStart').addEventListener('click',()=>loop.start(controls()));
 $('legacyLoopPause').addEventListener('click',()=>{
   loop.pause();
   if(current)publishSource(constrained,'archive',current.recipe);
 });
 $('legacyLoopOnce').addEventListener('click',()=>loop.once(controls()));
 for(const id of ['legacyLoopMode','legacyLoopSpeed','legacyLoopLock']){
   $(id).addEventListener('change',()=>loop.configure(controls()));
 }
 $('legacyApplyLaw').addEventListener('click',applyFresh);
 $('legacyChangeLaw').addEventListener('click',()=>child('law'));
 $('legacyRework').addEventListener('click',()=>child('rework'));
 $('legacyViewOriginal').addEventListener('click',()=>{
   constrained.style.display=constrained.style.display==='none'?'block':'none';
   status(constrained.style.display==='none'?'Showing original field.':'Showing rule-constrained field.');
 });
 $('legacySaveLaw').addEventListener('click',()=>{
   if(!current){status('Constrain a field first.');return;}
   const a=document.createElement('a');a.href=constrained.toDataURL('image/png');
   a.download='hexfield-archive-ruled-'+current.recipe.id+'.png';document.body.append(a);a.click();a.remove();
 });
 function vote(liked){
   loop.pause();
   if(!current||current.judged){status('Make a new ruled version before voting again.');return;}
   noteRuleVerdict(current.recipe,liked,$('legacyCritique').value);
   publishSource(constrained,'archive',current.recipe);
   current.judged=true;
   status(liked?'Kept — this method influences BOTH studios.':
     'Rejected — this method influences BOTH studios.');
 }
 $('legacyKeepLaw').addEventListener('click',()=>vote(true));
 $('legacyRejectLaw').addEventListener('click',()=>vote(false));
 function schedule(){
   if(autoTimer)clearTimeout(autoTimer);
   autoTimer=setTimeout(()=>{autoTimer=null;update();},3100);
 }
 new MutationObserver(()=>{
   const rev=raw.dataset.paintRevision||'';
   if(rev!==observedRevision){observedRevision=rev;schedule();}
 }).observe(raw,{attributes:true,attributeFilter:['data-paint-revision','width','height']});
 for(const id of ['go','again','perturb','reseedNow','perturbNow'])
   $(id)?.addEventListener('click',schedule);
 setTimeout(()=>{if(window.__hexfield?.getCurrent?.()&&constrained.style.display==='none')schedule();},1600);
 window.__hexfieldRuleStudio={applyFresh,child,getCurrent:()=>current,
   loopState:()=>loop.state(),start:()=>loop.start(controls()),pause:()=>loop.pause()};
}
