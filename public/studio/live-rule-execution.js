/* HEXFIELD 322 — advance the REAL rule generator in browser-sized chunks.
 * These marks are drawn by applyRulesSteps, the exact same program used for
 * scoring. The browser sees actual work BEFORE the candidate is complete.
 */
import {applyRulesSteps} from './rule-engine.js';
import {yieldToBrowser} from './render-governor.js';
export async function renderRuleLive(source,target,recipe,{
 options={},rowsPerTurn=3,yieldTurn=yieldToBrowser,
 isCancelled=()=>false,onProgress=()=>{}
}={}){
 const rows=applyRulesSteps(source,target,recipe,{...options,progress:true});
 let completed=0,turns=0,last=null,finished=false;
 const batch=Math.max(1,Math.min(12,Math.floor(rowsPerTurn)||3));
 try{
  while(true){
   if(isCancelled())return {cancelled:true,rows:completed,turns};
   for(let i=0;i<batch;i++){
    if(isCancelled())return {cancelled:true,rows:completed,turns};
    const result=rows.next(); // the ACTUAL source-data-guided painting
    if(result.done){
     finished=true;
     return {cancelled:false,metrics:result.value,rows:completed,turns};
    }
    completed++;
    last=result.value;
   }
   turns++;
   if(last)onProgress({...last,turn:turns,canvas:target});
   await yieldTurn(); // now the browser can actually display the drawn ink
  }
 }finally{
  // Generator finally restores Canvas2D save/clip on interruption too.
  if(!finished)rows.return();
 }
}
