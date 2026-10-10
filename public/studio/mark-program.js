/* HEXFIELD 314 — evolving grammar of mark application.
 * An invented mark is a bounded executable composition of source gestures and
 * transformations. This is not a style prompt, model imitation, or a random
 * filename attached to an unchanged renderer.
 */
import {DERIVED_MARKS,paintDerivedMark} from './mark-grammar.js';
export const MARK_PROGRAM_VERSION=1;
export const MARK_PROGRAM_MEMORY='hexfield.invented-marks.v1';
export const MAX_MARK_OPERATIONS=3,MAX_MARK_PRIMITIVES=40,MAX_REMEMBERED_PROGRAMS=4;
export const PROGRAM_OPERATORS=Object.freeze([
  'branch','interrupt','echo','facet','scatter','twist','pressure'
]);
export const SOURCE_GESTURES=Object.freeze(Object.keys(DERIVED_MARKS));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const mix=n=>{
  n=Math.imul(n^(n>>>16),0x7feb352d);
  n=Math.imul(n^(n>>>15),0x846ca68b);
  return (n^(n>>>16))>>>0;
};
const hash=value=>{
  let h=2166136261;
  for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);
  return mix(h);
};
const pick=(arr,n)=>arr[(n>>>0)%arr.length];
const number=(n)=>+clamp(Number(n),.15,.9).toFixed(3);
const record=(seed,parent,root,generation,sources,operations,parents=[])=>{
  const cleanSources=sources.slice(0,2);
  const cleanOps=operations.slice(0,MAX_MARK_OPERATIONS);
  const signature=[...cleanSources,':',...cleanOps.map(op=>op.type+'-'+Math.round(op.amount*10))].join('/');
  const id='mp-'+hash([seed,parent||'',generation,signature,parents.join(':')].join('|')).toString(36);
  return {v:1,id,rootId:root||id,parentId:parent||null,
    parents:parents.slice(0,2),generation:Math.max(0,Math.min(1000000,generation|0)),
    seed:seed>>>0,sources:cleanSources,
    operations:cleanOps,signature};
};
export function validMarkProgram(p){
  return !!(p&&p.v===1&&typeof p.id==='string'&&p.id.length<56&&
    typeof p.rootId==='string'&&p.rootId.length<56&&
    (p.parentId==null||(typeof p.parentId==='string'&&p.parentId.length<56))&&
    Number.isInteger(p.generation)&&p.generation>=0&&p.generation<1000001&&
    Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=4294967295&&
    Array.isArray(p.sources)&&p.sources.length===2&&
    p.sources.every(x=>SOURCE_GESTURES.includes(x))&&
    Array.isArray(p.operations)&&p.operations.length>=1&&p.operations.length<=MAX_MARK_OPERATIONS&&
    p.operations.every(x=>x&&PROGRAM_OPERATORS.includes(x.type)&&
      typeof x.amount==='number'&&Number.isFinite(x.amount)&&x.amount>=.15&&x.amount<=.9)&&
    typeof p.signature==='string'&&p.signature.length<=160);
}
export function newMarkProgram(seed=1,generation=0){
  const s=seed>>>0;
  const a=pick(SOURCE_GESTURES,mix(s^0x13579bdf));
  const b=pick(SOURCE_GESTURES.filter(x=>x!==a),mix(s^0x2468ace0));
  const first=pick(PROGRAM_OPERATORS,mix(s^0x56126));
  const second=pick(PROGRAM_OPERATORS.filter(x=>x!==first),mix(s^0x98513));
  return record(s,null,null,generation,[a,b],[
    {type:first,amount:number(.2+(mix(s^61)%650)/1000)},
    {type:second,amount:number(.2+(mix(s^93)%650)/1000)}
  ]);
}
export function evolveMarkProgram(parent,{seed=1,branch=1,mate=null}={}){
  if(!validMarkProgram(parent))return newMarkProgram(seed);
  const s=seed>>>0,mode=((branch%3)+3)%3;
  const sources=[...parent.sources],operations=parent.operations.map(op=>({...op}));
  const parents=[parent.id];
  if(mode===1){
    const slot=mix(s^0x5ad4)%2;
    sources[slot]=pick(SOURCE_GESTURES.filter(x=>x!==sources[slot]),mix(s^0xc001));
    const index=mix(s^0x7123)%operations.length;
    // The procedure, not merely its seed or pigment, is genuinely changed.
    operations[index]={type:pick(PROGRAM_OPERATORS.filter(x=>x!==operations[index].type),
      mix(s^0x9e37)),amount:number(.2+(mix(s^0x3123)%650)/1000)};
  }else if(mode===2){
    const partner=validMarkProgram(mate)?mate:newMarkProgram(mix(s^0x51ac));
    sources[1]=partner.sources[(s>>>3)%2];
    if(sources[1]===sources[0])
      sources[1]=pick(SOURCE_GESTURES.filter(x=>x!==sources[0]),mix(s^26));
    const donor=partner.operations[mix(s^0x909)%partner.operations.length];
    const index=mix(s^0x814)%operations.length;
    operations[index]={...donor};
    if(operations.length<MAX_MARK_OPERATIONS)
      operations.push({type:pick(PROGRAM_OPERATORS,mix(s^0x74)),
        amount:number(.2+(mix(s^0x611)%650)/1000)});
    parents.push(partner.id);
  }
  return record(s,parent.id,parent.rootId,parent.generation+1,
    sources,operations,parents);
}
export function rememberedMarkPrograms(){
  try{
    const p=JSON.parse(localStorage.getItem(MARK_PROGRAM_MEMORY)||'null');
    return p?.v===1&&Array.isArray(p.programs)?
      p.programs.filter(validMarkProgram).slice(0,MAX_REMEMBERED_PROGRAMS):[];
  }catch{return [];}
}
export function rememberMarkVerdict(program,liked=true){
  if(!validMarkProgram(program))return rememberedMarkPrograms();
  let entries=rememberedMarkPrograms().filter(p=>p.id!==program.id);
  if(liked)entries=[program,...entries].slice(0,MAX_REMEMBERED_PROGRAMS);
  else entries=entries.filter(p=>p.rootId!==program.rootId);
  try{localStorage.setItem(MARK_PROGRAM_MEMORY,
    JSON.stringify({v:1,programs:entries}));}catch{}
  return entries;
}
// A lightweight canvas-like sink receives the *actual vector primitives*
// made by the source gestures. We operate on those before depositing any ink.
const sink=()=>({
  save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
  fill(){},fillRect(){},arc(){},closePath(){},setLineDash(){}
});
const shift=(p,dx,dy)=>{
  if(p.type==='polygon')return {...p,points:p.points.map(([x,y])=>[x+dx,y+dy])};
  if(p.type==='line')return {...p,x:p.x+dx,y:p.y+dy,a:p.a+dx,b:p.b+dy};
  return {...p,x:p.x+dx,y:p.y+dy};
};
const rotate=(p,x,y,a)=>{
  const turn=(u,v)=>[x+(u-x)*Math.cos(a)-(v-y)*Math.sin(a),
    y+(u-x)*Math.sin(a)+(v-y)*Math.cos(a)];
  if(p.type==='polygon')return {...p,points:p.points.map(v=>turn(...v))};
  if(p.type==='line'){
    const [x1,y1]=turn(p.x,p.y),[x2,y2]=turn(p.a,p.b);
    return {...p,x:x1,y:y1,a:x2,b:y2};
  }
  const [x1,y1]=turn(p.x,p.y);return {...p,x:x1,y:y1};
};
function operate(items,op,{x,y,step,seed}){
  const k=op.amount,added=[];
  for(let i=0;i<items.length&&added.length<MAX_MARK_PRIMITIVES;i++){
    const p=items[i];
    const h=mix(seed^Math.imul(i+1,41977)),sign=(h&1)?1:-1;
    if(op.type==='scatter'){
      added.push(shift(p,((h%101)/100-.5)*step*k,
        ((h>>>8)%101/100-.5)*step*k));continue;
    }
    if(op.type==='twist'){
      added.push(rotate(p,x,y,sign*k*.8));continue;
    }
    if(op.type==='pressure'){
      added.push(p.type==='line'?{...p,width:clamp((p.width||1)*
        (.5+k*1.8),.5,15)}:p);continue;
    }
    if(p.type!=='line'){
      added.push(p);
      if(op.type==='echo'&&i%2===0)
        added.push(shift(p,step*k*.25,-step*k*.25));
      continue;
    }
    const dx=p.a-p.x,dy=p.b-p.y,len=Math.hypot(dx,dy);
    if(len<.1){added.push(p);continue;}
    const nx=-dy/len,ny=dx/len;
    if(op.type==='interrupt'){
      const margin=.1+.21*k;
      added.push({...p,a:p.x+dx*(.5-margin),b:p.y+dy*(.5-margin)});
      added.push({...p,x:p.x+dx*(.5+margin),y:p.y+dy*(.5+margin)});
    }else if(op.type==='branch'){
      added.push(p);
      const cx=(p.x+p.a)/2,cy=(p.y+p.b)/2;
      added.push({...p,x:cx,y:cy,a:cx+nx*len*k*.7*sign,
        b:cy+ny*len*k*.7*sign,width:Math.max(.6,(p.width||1)*.67)});
    }else if(op.type==='echo'){
      added.push(p);
      added.push(shift({...p,width:Math.max(.5,(p.width||1)*.55)},
        nx*step*k*.33,ny*step*k*.33));
    }else if(op.type==='facet'){
      const thickness=clamp(step*k*.17,.6,step*.4);
      added.push({type:'polygon',
        points:[[p.x+nx*thickness,p.y+ny*thickness],
          [p.a+nx*thickness*.4,p.b+ny*thickness*.4],
          [p.a-nx*thickness,p.b-ny*thickness],
          [p.x-nx*thickness*.4,p.y-ny*thickness*.4]],color:p.color});
    }else added.push(p);
  }
  return added.slice(0,MAX_MARK_PRIMITIVES);
}
function deposit(ctx,p,noCurves){
  const colour=p.color||'#2b3440';
  ctx.fillStyle=colour;ctx.strokeStyle=colour;
  if(p.type==='line'){
    ctx.lineWidth=clamp(p.width||1,.4,17);
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.a,p.b);ctx.stroke();
  }else if(p.type==='polygon'&&p.points?.length>=3){
    ctx.beginPath();ctx.moveTo(...p.points[0]);
    for(const xy of p.points.slice(1))ctx.lineTo(...xy);
    ctx.closePath();ctx.fill();
  }else if(p.type==='rect')ctx.fillRect(p.x,p.y,p.a,p.b);
  else if(p.type==='circle'){
    if(noCurves)ctx.fillRect(p.x-p.a,p.y-p.a,p.a*2,p.a*2);
    else{ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.4,p.a),0,2*Math.PI);ctx.fill();}
  }
}
export function paintInventedMark(ctx,{program,x,y,step,angle=0,colour,
  luminosity=.5,contrast=.5,seed=1,noCurves=false,emit=()=>{}}={}){
  if(!validMarkProgram(program))return {used:false,primitives:0};
  const base=[],collector=sink();
  const options={x,y,step,angle,colour,luminosity,contrast,
    seed:(seed^program.seed)>>>0,noCurves,
    emit:p=>{if(base.length<MAX_MARK_PRIMITIVES)base.push(p);}};
  for(const [i,gesture] of program.sources.entries()){
    paintDerivedMark(collector,{...options,mark:gesture,seed:(options.seed+Math.imul(i+1,2654435761))>>>0,
      angle:angle+(i===0?-.11:.17)});
  }
  let produced=base;
  for(const [j,operation] of program.operations.entries()){
    produced=operate(produced,operation,{x,y,step,
      seed:mix(program.seed^seed^Math.imul(j+1,977))});
  }
  ctx.save();ctx.lineCap='butt';ctx.lineJoin='bevel';
  for(const p of produced){
    deposit(ctx,p,noCurves);
    // The theatre gets the exact final transformed geometry, not parent
    // gestures or a fabricated movement animation.
    emit(p);
  }
  ctx.restore();
  return {used:true,primitives:produced.length,signature:program.signature};
}
