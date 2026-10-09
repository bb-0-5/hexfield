/* HEXFIELD 307: THE ACT OF MAKING IS THE ARTWORK
 * This theatre replays ACTUAL procedural decisions: candidate images that
 * were rendered and evaluated, named glyph paths from the chosen program,
 * or actual traced marks emitted by the rule renderer.
 *
 * It NEVER substitutes its theatre buffer for the underlying final canvas,
 * print export, visual scoring, or saved artwork. Finite motion, opt-out,
 * pause, replay, hidden-tab cancellation and reduced-motion support.
 */
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number.isFinite(v)?v:min));
const PLAN_LIMIT=15;
const safe=(value,n=110)=>String(value||'').slice(0,n);
const componentTitle=item=>{
  const char=item.char||'';
  return (char?char+' / ':'')+(item.part||'component').replace(/_/g,' ');
};
const cx=(tag,className,parent)=>{
  const el=document.createElement(tag);el.className=className;parent.append(el);return el;
};
export function performancePlan({kind='logo',trials=[],anatomy=null,trace=null,recipe=null}={}){
 const parts=Array.isArray(anatomy?.hitMap)?anatomy.hitMap:[];
 const marks=Array.isArray(trace?.marks)?trace.marks:[];
 const decisions=(Array.isArray(trials)?trials:[]).slice(0,PLAN_LIMIT)
  .filter(x=>x?.canvas&&x.canvas.width&&x.canvas.height)
  .map((x,i)=>({
    kind:'test',title:'TRY '+(i+1)+' / '+Math.min(PLAN_LIMIT,trials.length),
    detail:safe(x.label||x.rule?.target||x.method||'rendered counterfactual'),
    score:Number.isFinite(x.score)?x.score:null,
    selected:!!x.selected,canvas:x.canvas
  }));
 const rule=recipe?.anatomy?.rules?.[0]||recipe?.genome?.anatomy?.rules?.[0]||
   (recipe?.primary?{target:recipe.primary,operation:recipe.mark}:null);
 const theme=rule?(safe(rule.target)+' → '+safe(rule.operation)):'new form';
 return {
   kind:kind==='logo'?'logo':'rule',
   tests:decisions,
   parts,
   marks,
   phaseLabels:[
     {key:'remember',label:'REMEMBER / the previous work'},
     ...decisions.map((d,i)=>({key:'test-'+i,label:d.title+' · '+d.detail})),
     {key:'undo',label:'REMOVE / '+theme},
     {key:'construct',label:'REMAKE / '+theme},
     {key:'adopt',label:'BECOME / the surviving idea'}
   ],
   method:theme,seed:recipe?.seed??null
 };
}
function drawStrokes(ctx,parts,count,travel=0){
 const limit=Math.min(parts.length,Math.max(0,Math.ceil(count)));
 for(let i=0;i<limit;i++){
   const p=parts[i];if(!Array.isArray(p.points)||p.points.length<2)continue;
   const alpha=i===limit-1?.91:.40;
   ctx.save();ctx.globalAlpha=alpha;
   ctx.lineJoin='round';ctx.lineCap='round';
   ctx.strokeStyle=i===limit-1?'#bd714b':'#3b7774';
   ctx.lineWidth=Math.min(26,Math.max(2,p.weight*.4||5));
   const shift=travel?(i%2?1:-1)*travel*(1+(i%3))*.7:0;
   ctx.beginPath();ctx.moveTo(p.points[0][0]+shift,p.points[0][1]);
   // Animate named paths as the actual form is assembled/disassembled.
   const plen=p.points.length,partial=i===limit-1?Math.max(1,Math.floor((count-i)*plen)):plen;
   for(const point of p.points.slice(1,partial))
     ctx.lineTo(point[0]+shift,point[1]);
   ctx.stroke();ctx.restore();
 }
}
function drawMark(ctx,mark){
 ctx.save();
 ctx.fillStyle=mark.color||'#3d5d52';ctx.strokeStyle=ctx.fillStyle;
 const [type,x,y,a,b]=[mark.type,mark.x||0,mark.y||0,mark.a||0,mark.b||0];
 if(type==='rect')ctx.fillRect(x,y,a,b);
 else if(type==='circle'){ctx.beginPath();ctx.arc(x,y,Math.max(.5,a),0,Math.PI*2);ctx.fill();}
 else if(type==='line'){ctx.lineWidth=mark.width||2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
 ctx.restore();
}
export function createCreativePerformance({host,canvas,name='theatre',statusElement=null}={}){
 if(!host||!canvas)throw Error('Creative performance requires a canvas and its host');
 const existing=host.querySelector('[data-process-theatre]');
 if(existing)existing.remove();
 const panel=cx('div','creative-performance-panel',host);
 panel.dataset.processTheatre=name;panel.hidden=true;
 const overlay=cx('canvas','creative-performance-overlay',panel);
 overlay.width=canvas.width;overlay.height=canvas.height;
 overlay.setAttribute('aria-hidden','true');
 const info=cx('div','creative-performance-meta',panel);
 const action=cx('span','creative-performance-action',info);
 const method=cx('span','creative-performance-method',info);
 const controls=cx('div','creative-performance-controls',host);
 controls.dataset.processControls=name;
 const replay=cx('button','creative-performance-replay',controls);
 replay.type='button';replay.textContent='↺ REPLAY THE MAKING';replay.disabled=true;
 const pause=cx('button','creative-performance-pause',controls);
 pause.type='button';pause.textContent='Ⅱ PAUSE';pause.disabled=true;
 const skip=cx('button','creative-performance-skip',controls);
 skip.type='button';skip.textContent='SKIP →';skip.disabled=true;
 const timeline=cx('ol','creative-performance-ledger',controls);
 timeline.setAttribute('aria-label','Creative decisions made in order');
 const ctx=overlay.getContext('2d'),bounds={w:canvas.width,h:canvas.height};
 let current=null,serial=0,raf=0,last=null,paused=false,pausedAt=0,elapsed=0;
 let lastOptions=null,visible=false,clockStart=0;
 const reduce=()=>!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 function label(title,detail){
   action.textContent=safe(title,90);
   method.textContent=safe(detail,160);
   if(statusElement)statusElement.textContent=safe(title+' · '+detail,200);
 }
 function log(labelText){
   if(!labelText)return;
   const item=document.createElement('li');
   item.textContent=safe(labelText,140);
   timeline.append(item);
   while(timeline.children.length>7)timeline.firstElementChild.remove();
 }
 function clearFrame(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,bounds.w,bounds.h);}
 function fit(source,opacity=1){
   if(!source?.width||!source?.height)return;
   ctx.save();ctx.globalAlpha=opacity;
   ctx.drawImage(source,0,0,bounds.w,bounds.h);
   ctx.restore();
 }
 function mutedBase(){
   ctx.fillStyle='#e3e0d3';ctx.fillRect(0,0,bounds.w,bounds.h);
   ctx.strokeStyle='#91aaa0';ctx.lineWidth=1;
   for(let y=bounds.h*.15;y<bounds.h;y+=bounds.h*.15){
     ctx.globalAlpha=.24;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(bounds.w,y);ctx.stroke();
   }
   ctx.globalAlpha=1;
 }
 function finish(reason='completed'){
   if(raf)cancelAnimationFrame(raf);raf=0;serial++;
   panel.hidden=true;visible=false;
   replay.disabled=!lastOptions;pause.disabled=true;skip.disabled=true;
   pause.textContent='Ⅱ PAUSE';paused=false;
   if(current){
     const resolve=current.resolve;current=null;resolve(reason);
   }
 }
 function stop(){finish('stopped');}
 function draw(now){
   if(!current||paused||document.hidden)return;
   const data=current,plan=data.plan;
   const t=Math.max(0,now-clockStart+elapsed);
   const dur=data.duration;
   const phase=t/dur;
   clearFrame();
   if(phase<.16){
     mutedBase();fit(data.parent,.75);
     if(data.oldAnatomy?.hitMap?.length){
       drawStrokes(ctx,data.oldAnatomy.hitMap,data.oldAnatomy.hitMap.length,phase/.16*20);
     }
     label('01 / FIND THE OLD FORM','These are the actual parent pixels and anatomical paths');
   }else if(plan.tests.length&&phase<.16+.26){
     const within=(phase-.16)/.26,index=Math.min(plan.tests.length-1,
       Math.floor(within*plan.tests.length));
     const trial=plan.tests[index];
     mutedBase();fit(trial.canvas,1);
     label('02 / '+trial.title,(trial.selected?'ADOPT ':'CONSIDER ')+trial.detail+
       (trial.score===null?'':' · novelty score '+trial.score.toFixed(3)));
     if(data.currentTrial!==index){
       data.currentTrial=index;
       log((trial.selected?'SELECT ':'TEST ')+trial.detail+
         (trial.score===null?'':' / '+trial.score.toFixed(3)));
     }
   }else{
     const start=.16+(plan.tests.length?.26:0);
     const movement=clamp((phase-start)/(1-start),0,1);
     if(movement<.13){
       mutedBase();fit(data.parent,.42*(1-movement/.13));
       label('03 / UNDO A FORM',plan.method+' · subtracting the previous arrangement');
     }else if(movement<.82){
       const assembly=clamp((movement-.13)/.69,0,1);
       mutedBase();
       if(plan.kind==='logo'&&plan.parts.length){
         drawStrokes(ctx,plan.parts,assembly*plan.parts.length);
         // Finished ink arrives *only where the selected geometry was
         // constructed*. The final bitmap remains unmodified underneath.
         ctx.save();ctx.globalAlpha=assembly*.52;fit(data.final,1);ctx.restore();
         const index=Math.min(plan.parts.length-1,Math.floor(assembly*plan.parts.length));
         const part=plan.parts[index];
         label('04 / DRAW THE ACTUAL PARTS',
           part?componentTitle(part)+' · '+plan.method:'constructing named glyph segments');
       }else if(plan.marks.length){
         const count=Math.ceil(assembly*plan.marks.length);
         for(let i=0;i<count;i++)drawMark(ctx,plan.marks[i]);
         ctx.save();ctx.globalAlpha=assembly*.45;fit(data.final,1);ctx.restore();
         label('04 / MAKE EACH MARK',plan.method+' · '+count+' / '+plan.marks.length+' recorded marks');
       }else{
         ctx.save();ctx.globalAlpha=assembly;fit(data.final,1);ctx.restore();
         label('04 / RECONSTRUCT UNDER THE LAW',plan.method+' · source transformed by this actual rule');
       }
     }else{
       mutedBase();
       fit(data.final,1);
       label('05 / THE IDEA SURVIVES',plan.method+' · now available for the next mutation');
     }
   }
   if(t>=dur){
     log('KEPT AS NEXT REFERENCE · '+plan.method);
     finish();
     return;
   }
   raf=requestAnimationFrame(draw);
 }
 function play(options={}){
   stop();
   const plan=performancePlan(options);
   lastOptions={...options};
   if(options.reducedMotion||reduce()||document.hidden){
     log('STATIC STUDY / '+plan.method);
     return Promise.resolve('reduced-motion');
   }
   const speed=clamp(Number(options.duration)||1900,650,9500);
   return new Promise(resolve=>{
     timeline.replaceChildren();
     current={resolve,plan,duration:speed,parent:options.parent,
       final:options.final,oldAnatomy:options.oldAnatomy,currentTrial:-1};
     overlay.width=bounds.w;overlay.height=bounds.h;
     elapsed=0;clockStart=performance.now();serial++;
     paused=false;panel.hidden=false;visible=true;
     replay.disabled=true;pause.disabled=false;skip.disabled=false;
     log('START / '+plan.method);
     raf=requestAnimationFrame(draw);
   });
 }
 function pauseResume(){
   if(!current)return;
   if(!paused){
     paused=true;pausedAt=performance.now();
     if(raf)cancelAnimationFrame(raf);raf=0;
     pause.textContent='▶ RESUME';
     label('PAUSED / PROCESS FROZEN','The artwork beneath is unchanged');
   }else{
     paused=false;
     clockStart+=performance.now()-pausedAt;
     pause.textContent='Ⅱ PAUSE';
     raf=requestAnimationFrame(draw);
   }
 }
 replay.addEventListener('click',()=>{if(lastOptions)void play(lastOptions);});
 pause.addEventListener('click',pauseResume);
 skip.addEventListener('click',()=>finish('skipped'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish('hidden-tab');});
 function dispose(){stop();panel.remove();controls.remove();}
 return {play,stop,dispose,
   getState:()=>({running:!!current,paused,visible,events:timeline.children.length,
     plan:current?.plan?.phaseLabels.map(x=>x.label)||[]}),
   getCurrentPlan:()=>current?.plan||null};
}
