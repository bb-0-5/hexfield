/* Hexfield 329 — autonomous auditions of executable painting techniques.
 * The user gives the painter a visual direction, not five more sliders.
 * Coarse trials are already budgeted: auditioning styles never adds
 * previews or full-size canvases, and a manual repeat never uses this path.
 */
import {STYLE_PRESETS,styleById} from './style-presets.js';
const ids=STYLE_PRESETS.map(x=>x.id);
const valid=id=>ids.includes(id)?id:ids[0];
const rotate=(id,steps)=>ids[(ids.indexOf(valid(id))+steps)%ids.length];

/** A deterministic, bounded rotation among REAL mark grammars. */
export function styleAuditions({
 selected='ink',previous=null,cycle=0,count=3,locked=false
}={}){
 const total=Math.max(0,Math.min(3,Math.floor(Number(count)||0)));
 const anchor=valid(previous||selected);
 if(locked)return Array(total).fill(null);
 const chapter=Math.floor(Math.max(0,cycle)/3);
 const near=rotate(anchor,1+(chapter%2));
 const far=rotate(anchor,3+(chapter%2));
 return Array.from({length:total},(_,i)=>
  i===0?anchor:i===1?near:cycle%3===0?far:anchor);
}
/** Keep a credible different technique in an EXISTING full-render slot.
 * With a single hot-phone slot, the primary preview winner remains king.
 */
export function reserveStyleFinalist(proposals,finalists,{
 cycle=0,previous=null,locked=false,strict=false
}={}){
 if(locked||cycle%3!==2||!previous||finalists.length<2)
  return finalists;
 const lead=[...finalists].sort((a,b)=>
  b.preflight.score-a.preflight.score)[0];
 const options=proposals.filter(x=>x.recipe?.styleId&&
   x.recipe.styleId!==previous&&!finalists.includes(x));
 options.sort((a,b)=>b.preflight.score-a.preflight.score);
 const credible=options.find(x=>
   x.preflight.score>=lead.preflight.score-.055&&
   (!strict||!lead.preflight.golden?.qualifies||
      x.preflight.golden?.qualifies));
 if(!credible)return finalists;
 const kept=[...finalists];
 kept[kept.length-1]=credible;
 return kept;
}
/** Finalists have ALREADY been judged on physical W/φ/H pixels.
 * Novelty cannot replace an artwork merely because its brush name differs.
 */
export function chooseStyleWinner(ranked,{
 cycle=0,previous=null,locked=false,strict=false
}={}){
 const leader=ranked[0];
 if(!leader)return {winner:null,reason:'no-finalist'};
 if(locked||!previous||cycle%3!==2||
  leader.recipe?.styleId!==previous)
   return {winner:leader,reason:'best-evaluated'};
 const challenger=ranked.find(x=>
  x.recipe?.styleId&&x.recipe.styleId!==previous&&
  x.threeWay?.score>=leader.threeWay.score-.027&&
  x.threeWay.H>=leader.threeWay.H-.075&&
  x.threeWay.phi>=leader.threeWay.phi-.075&&
  (!strict||!leader.golden?.qualifies||x.golden?.qualifies));
 return challenger?{winner:challenger,reason:'credible-new-technique'}:
  {winner:leader,reason:'protect-stronger-artwork'};
}
export const readableStyle=id=>styleById(id).name;
