/* Hexfield 304 — the interactive letter-part editor. The inspector is
 * connected to the actual procedural glyph geometry, not a guessed overlay.
 */
import {ANATOMY,PART_OPERATIONS,editAnatomyProgram,normalizePartRule,
 mutateAnatomyProgram,partsForWord} from './glyph-anatomy.js';
import {hitTestAnatomy,anatomyCoverage} from './anatomy-renderer.js';
const $=id=>document.getElementById(id);
const STORAGE='hexfield.logo.anatomy.editor.v1';
const defaultRule={target:'crossbar',operation:'lift',amount:.65,glyph:'all'};
const safely=(s,n=150)=>String(s||'').slice(0,n);
const signature=rule=>(rule?.target||'?')+'/'+(rule?.operation||'?')+'@'+(Number(rule?.amount)||0).toFixed(2);
const float=n=>Math.max(.10,Math.min(1,Number(n)||.65));
const options=(values)=>Object.entries(values).map(([id,row])=>{
 const label=Array.isArray(row)?row[0]:row;
 return '<option value="'+id+'">'+label+'</option>';
}).join('');
const rand=()=>Math.floor(Math.random()*0xffffffff);
export function initAnatomyControls({onApply=()=>{},getText=()=>''}={}){
 if(!$('logoAnatomyPart'))return null;
 $('logoAnatomyPart').innerHTML=options(ANATOMY);
 $('logoAnatomyEffect').innerHTML=options(PART_OPERATIONS);
 let previous=null,meta=null,manual=null,editing=false;
 try{
   const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');
   if(saved?.v===1&&Array.isArray(saved.rules))manual=editAnatomyProgram(saved);
 }catch{}
 const status=(message)=>{$('logoAnatomyStatus').textContent=message;};
 const selected=()=>normalizePartRule({
   target:$('logoAnatomyPart').value,
   operation:$('logoAnatomyEffect').value,
   amount:float($('logoAnatomyAmount').value),
   glyph:$('logoGlyphScope').value
 });
 function updateDisplay(rule=defaultRule){
   const r=normalizePartRule(rule);
   $('logoAnatomyPart').value=r.target;
   $('logoAnatomyEffect').value=r.operation;
   $('logoAnatomyAmount').value=String(r.amount);
   $('logoAmountValue').value=Math.round(r.amount*100)+'%';
   $('logoAmountValue').textContent=$('logoAmountValue').value;
   if([...$('logoGlyphScope').options].some(o=>o.value===r.glyph))
     $('logoGlyphScope').value=r.glyph;
 }
 function glossary(){
   const word=safely(getText(),24),available=partsForWord(word),parts=$('logoAnatomyPart');
   for(const option of parts.options){
     const has=!!available[option.value]?.length;
     option.disabled=!has && option.value!=='any';
   }
   if(parts.selectedOptions[0]?.disabled)parts.value='stem' in available?'stem':'any';
   const scope=$('logoGlyphScope'),last=scope.value||'all';
   scope.replaceChildren();
   const put=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;scope.append(o);};
   put('all','All eligible letters');put('first','First letter');
   for(const ch of [...new Set([...word])]){
     if(ch===' ')continue;
     put(ch,ch+' / '+(ANATOMY[Object.keys(available).find(x=>available[x].includes(ch))]?.[0]||'letter'));
   }
   scope.value=[...scope.options].some(o=>o.value===last)?last:'all';
   const root=$('logoAnatomyGlossary');
   root.replaceChildren();
   for(const [part,[name,meaning]] of Object.entries(ANATOMY)){
     const chip=document.createElement('button');
     chip.type='button';chip.className='glyph-term';
     const applicable=available[part]||[];
     if(!applicable.length)chip.classList.add('absent');
     chip.disabled=!applicable.length;
     chip.title=meaning;
     chip.textContent=name+(applicable.length?' · '+applicable.join(''):'');
     chip.addEventListener('click',()=>{
       $('logoAnatomyPart').value=part;editing=true;
       status(name+': '+meaning+' Applies to '+applicable.join(', ')+'. Choose an operation, then APPLY.');
     });
     root.append(chip);
   }
   const target=$('logoAnatomyPart').value;
   const coverage=anatomyCoverage(word,target);
   status((ANATOMY[target]?.[0]||target)+' exists in '+coverage.count+'/'+coverage.total+
     ' letters. '+(ANATOMY[target]?.[1]||'Select a specific region.')+
     ' Click APPLY to reconstruct only that part.');
 }
 function validRule(rule){
   const coverage=anatomyCoverage(getText(),rule.target);
   if(coverage.count<1){
     status('No '+(ANATOMY[rule.target]?.[0]||rule.target)+
       ' in this word. Select a part shown in the glossary, or change the word.');
     return false;
   }
   return true;
 }
 function captureFromFields(mode='replace'){
   const primary=selected();if(!validRule(primary))return;
   const prior=editAnatomyProgram(manual||previous||{rules:[defaultRule]});
   let rules=prior.rules.slice();
   if(mode==='stack'){
     if(rules.length>=3){status('A maximum of three simultaneous anatomical laws can be inspected. Undo one to add another.');return;}
     rules.push(primary);
   }else{
     if(!rules.length)rules=[primary];else rules[0]=primary;
   }
   manual=editAnatomyProgram({...prior,rules},{
     enabled:$('logoAnatomyEnabled').checked,guide:$('logoAnatomyGuide').checked
   });
   save();editing=false;
   onApply(manual,mode);
 }
 function save(){
   try{localStorage.setItem(STORAGE,JSON.stringify(manual||previous));}catch{}
 }
 function mutateSelected(){
   const target=$('logoAnatomyPart').value;
   const prior=editAnatomyProgram(manual||previous||{rules:[selected()]});
   manual=mutateAnatomyProgram(prior,rand(),{forcePart:target});
   manual.enabled=$('logoAnatomyEnabled').checked;
   manual.guide=$('logoAnatomyGuide').checked;
   updateDisplay(manual.rules[0]);
   editing=false;save();
   onApply(manual,'mutate');
 }
 function undoRule(){
   const original=editAnatomyProgram(manual||previous||{rules:[defaultRule]});
   original.rules.pop();
   manual=editAnatomyProgram(original);
   save();editing=false;
   if(manual.rules.length)updateDisplay(manual.rules[0]);
   onApply(manual,'undo');
 }
 function programForGenome(genome,hasParent=false){
   const incoming=editAnatomyProgram(genome||{rules:[defaultRule]});
   const locked=$('logoAnatomyLock').checked;
   const base=locked&&(manual||previous)?editAnatomyProgram(manual||previous):incoming;
   return editAnatomyProgram({...base},{
     enabled:$('logoAnatomyEnabled').checked,
     guide:$('logoAnatomyGuide').checked
   });
 }
 function updateAfterRender(metadata,recipe){
   if(!metadata||metadata.engine!=='named-glyph-anatomy'){
     meta=null;status('Classic font outline selected. Turn on named anatomy to mutate strokes.');
     return;
   }
   meta=metadata;previous=editAnatomyProgram(recipe.anatomy||recipe.genome?.anatomy);
   if(!editing){
     // A user may want to inspect a new mutation without losing the
     // ability to manually override that rule for the next study.
     updateDisplay(previous.rules[0]||defaultRule);
   }
   const lines=Object.entries(metadata.affected||{})
     .map(([key,count])=>key+' ('+count+' glyph'+(count===1?'':'s')+')');
   status(metadata.mutatedComponents+' named components changed; '+
     metadata.paintedComponents+' visible parts. Applied: '+
     (lines.join(', ')||'no matching components')+
     '. Click any stroke to select it, or inspect the glossary.');
 }
 $('logoText').addEventListener('input',()=>{glossary();editing=true;});
 $('logoAnatomyAmount').addEventListener('input',()=>{
   $('logoAmountValue').textContent=Math.round(float($('logoAnatomyAmount').value)*100)+'%';
   editing=true;
 });
 for(const id of ['logoAnatomyPart','logoAnatomyEffect','logoGlyphScope'])
   $(id).addEventListener('change',()=>{editing=true;
     const rule=selected(),coverage=anatomyCoverage(getText(),rule.target);
     status((ANATOMY[rule.target]?.[0]||rule.target)+
       ' / '+PART_OPERATIONS[rule.operation]+' / '+coverage.count+' matching glyphs. Apply to change their actual strokes.');
   });
 $('logoAnatomyApply').addEventListener('click',()=>captureFromFields());
 $('logoAnatomyStack').addEventListener('click',()=>captureFromFields('stack'));
 $('logoAnatomyMutate').addEventListener('click',mutateSelected);
 $('logoAnatomyUndo').addEventListener('click',undoRule);
 for(const id of ['logoAnatomyEnabled','logoAnatomyGuide'])
   $(id).addEventListener('change',()=>{
     const base=editAnatomyProgram(manual||previous||{rules:[selected()]});
     manual=editAnatomyProgram({...base},{
       enabled:$('logoAnatomyEnabled').checked,
       guide:$('logoAnatomyGuide').checked
     });
     save();onApply(manual,'visibility');
   });
 $('artwork').addEventListener('click',event=>{
   if(!$('letteringControls')||$('letteringControls').hidden||!meta)return;
   const rectangle=$('artwork').getBoundingClientRect();
   const x=(event.clientX-rectangle.left)/rectangle.width*1200;
   const y=(event.clientY-rectangle.top)/rectangle.height*740;
   const hit=hitTestAnatomy(meta,x,y,16);
   if(!hit)return;
   if($('logoAnatomyPart').querySelector('option[value="'+hit.part+'"]')?.disabled){
     status('Selected '+hit.char+' stroke '+hit.part+', but this part is not editable here.');return;
   }
   $('logoAnatomyPart').value=hit.part;
   $('logoGlyphScope').value=hit.char;
   editing=true;
   status('Selected '+hit.char+' → '+hit.part+'. '+hit.definition+
     '. Modify only this anatomy using the rule and APPLY.');
 });
 glossary();
 updateDisplay(manual?.rules?.[0]||defaultRule);
 return {programForGenome,updateAfterRender,glossary,
   guides:()=>$('logoAnatomyGuide').checked,
   lock:()=>$('logoAnatomyLock').checked,
   current:()=>manual||previous,
   readEditor:selected};
}
