/* HEXFIELD 319: deadline-aware paint scheduling. We do not claim
 * Canvas 2D work is magically asynchronous; explicit browser turns BETWEEN
 * expensive stages allow input, DOM paint, and Pause to be observed.
 */
export const BUDGET_THRESHOLDS={slow:950,hot:1750};
export function renderPlan({mobile=false,emaMs=0,samples=0}={}){
 const slow=mobile&&samples>=2&&emaMs>BUDGET_THRESHOLDS.slow;
 const hot=mobile&&samples>=2&&emaMs>BUDGET_THRESHOLDS.hot;
 return {previews:slow?2:3,finalists:hot?1:2,
   speed:hot?'cool':slow?'balanced':'quality',
   recentMs:Math.max(0,Math.round(emaMs||0))};
}
export function recordRenderTime(state={emaMs:0,samples:0},elapsedMs){
 const value=Math.max(0,Math.min(30000,Number(elapsedMs)||0));
 if(!value)return state;
 const samples=(state.samples||0)+1;
 const emaMs=samples===1?value:
   (state.emaMs||value)*.63+value*.37;
 return {emaMs:+emaMs.toFixed(1),samples};
}
// Browser rAF may be suspended for hidden pages; caller checks visibility and
// token freshness after every turn. Node regression suites use setTimeout.
export async function yieldToBrowser(){
 if(typeof requestAnimationFrame==='function'&&
   (typeof document==='undefined'||!document.hidden)){
  await new Promise(resolve=>requestAnimationFrame(()=>{
   setTimeout(resolve,0);
  }));
 }else await new Promise(resolve=>setTimeout(resolve,0));
}
