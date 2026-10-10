/* HEXFIELD 317 — cheap preflight so candidate evaluation has a
 * predictable render budget. No candidate receives a full render until
 * its REAL low-resolution preview has been measured.
 */
import {measureGoldenTaste} from './golden-taste.js';
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export const PREVIEW_WIDTH=240,PREVIEW_HEIGHT=150;
export const MAX_FULL_CANDIDATES=2;
export function scorePreflight(preview,{novelty=0,continuity=.5,
  taste=.5}={}){
 const golden=measureGoldenTaste(preview,{mode:'abstraction'});
 const N=clamp(novelty),H=clamp(continuity),T=clamp(taste);
 const score=.47*N+.36*clamp(golden.combined)+.12*H+.05*T;
 return {golden,novelty:N,score:+score.toFixed(5),
   agreement:(N>.09&&H>.25&&golden.combined>.40)};
}
export function chooseFullRenderCandidates(previews,{
 cycle=0,mobile=false,strict=false
}={}){
 if(!Array.isArray(previews)||!previews.length)return [];
 const rows=[...previews].sort((a,b)=>{
  if(strict&&a.preflight.golden.qualifies!==b.preflight.golden.qualifies)
   return a.preflight.golden.qualifies?-1:1;
  return b.preflight.score-a.preflight.score;
 });
 if(rows.length===1)return rows;
 const first=rows[0],second=rows[1],
   margin=first.preflight.score-second.preflight.score;
 // Allow one full-resolution render only with material evidence and a
 // sufficiently decisive lead. Do not early-accept a merely bright preview.
 const confident=cycle>=2&&first.preflight.agreement&&
   margin>(mobile?.12:.18)&&(!strict||first.preflight.golden.qualifies);
 return rows.slice(0,confident?1:MAX_FULL_CANDIDATES);
}
export function budgetEvidence(previews,finalists){
 return {predicted:previews.length,full:finalists.length,
   fullAvoided:Math.max(0,previews.length-finalists.length),
   scale:PREVIEW_WIDTH+'×'+PREVIEW_HEIGHT,
   reason:finalists.length===1?'confident preflight':'two finalists'};
}
