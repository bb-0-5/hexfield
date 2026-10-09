/* Build 302 / archive rule constraint layer. Same executable painter
 * as the new Rule Studio. The historical field and museum stay intact;
 * its live output is the source for rule painting, and a ruled painting can
 * recursively become the next painting's source.
 */
import {LAWS,MARKS,REWORKS,makeRecipe,mutateRecipe,applyRules,
  noteRuleVerdict,noteLineage} from './rule-engine.js';
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
 const dimensions=()=>({w:1100,h:Math.max(120,Math.round(1100*(raw.height||500)/(raw.width||2200)))});
 function shot(source){
   const {w,h}=dimensions(),c=document.createElement('canvas');c.width=w;c.height=h;
   c.getContext('2d').drawImage(source,0,0,w,h);return c;
 }
 const selections=()=>({subject:'abstract',primary:$('legacyLaw').value,
   secondary:$('legacySecondary').value,mark:$('legacyMark').value,rework:$('legacyRework').value});
 function paint(recipe,source){
   if(!source)return;
   const {w,h}=dimensions();constrained.width=w;constrained.height=h;
   const metrics=applyRules(shot(source),constrained,recipe,{iteration:recipe.generation});
   constrained.style.display='block';
   current={recipe,output:shot(constrained),judged:false};noteLineage(recipe);
   status('EXECUTED '+metrics.strokes+' constrained marks, '+metrics.skipped+
     ' forbidden/negative-space marks. '+recipe.primary+' / '+recipe.mark+
     (recipe.parentId?' / child of '+recipe.parentId.slice(0,7):''));
 }
 function applyFresh(){
   try{savedReference=shot(raw);paint(makeRecipe(selections()),savedReference);}
   catch(e){status('Could not apply law: '+String(e.message||e).slice(0,130));}
 }
 function child(focus){
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
   if($('legacyAutoLaw').checked)applyFresh();
   else{constrained.style.display='none';status('Experimental field generated. APPLY LAW to render it under constraints.');}
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
   if(!current||current.judged){status('Make a new ruled version before voting again.');return;}
   noteRuleVerdict(current.recipe,liked,$('legacyCritique').value);
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
 window.__hexfieldRuleStudio={applyFresh,child,getCurrent:()=>current};
}
