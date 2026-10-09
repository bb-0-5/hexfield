/* HEXFIELD BUILD 304 — topological glyph anatomy, not CSS styling.
 * Paths are named structures in a normalized em-square. A law transforms
 * ONLY matching parts. Guide metrics and virtual negative spaces are named
 * separately from ink strokes (a counter is NOT an inked component).
 * Native fallback fonts remain available for comparison in lettering.js.
 */
export const ANATOMY={
  stem:['Stem','Primary upright stroke'],diagonal:['Diagonal','Angled structural stroke'],
  arm:['Arm','Free horizontal or rising stroke'],leg:['Leg','Free descending stroke'],
  crossbar:['Crossbar','Bar connecting two other strokes'],
  cross_stroke:['Cross stroke','Line crossing a stem'],
  bowl:['Bowl','Curved enclosing stroke'],counter:['Counter','Enclosed unpainted space'],
  aperture:['Aperture','Opening into the negative interior'],
  shoulder:['Shoulder','Curved transition from a stem'],
  spine:['Spine','Main curving S-like stroke'],tail:['Tail','Projecting finishing stroke'],
  terminal:['Terminal','Free end of a stroke'],serif:['Serif','Finishing wedge or foot'],
  spur:['Spur','Short projection at a junction'],ear:['Ear','Small projecting stroke'],
  apex:['Apex','Top junction of diagonals'],vertex:['Vertex','Bottom junction'],
  join:['Join','Stroke intersection or connection'],loop:['Loop','Lower bowl or enclosed loop'],
  link:['Link','Connector between bowls'],dot:['Dot / tittle','Floating point above i or j'],
  ascender:['Ascender','Part above x-height'],descender:['Descender','Part below baseline'],
  baseline:['Baseline','Where the principal body sits'],
  cap_height:['Cap height','Top of capital letters'],
  x_height:['x-height','Top of lower-case body'],
  overshoot:['Overshoot','Round forms slightly overrun aligned lines'],
  sidebearing:['Sidebearing','Unpainted width on either side of a glyph'],
  axis:['Axis / stress','Angle of weight in rounded strokes']
};
export const PART_OPERATIONS={
  bend:'Bend / opposite bends on mirrored parts',
  facet:'Facet curves / forbid smooth contours',
  fracture:'Erase intervals of the selected component',
  lift:'Lift the selected part',drop:'Drop the selected part',
  widen:'Spread away from centre',compress:'Compress toward centre',
  open:'Open the counter or aperture',
  expand:'Enlarge counter / bowl space',
  pinch:'Pinch selected component',
  detach:'Detach from adjacent strokes',
  thicken:'Increase selected stroke weight',
  thin:'Reduce selected stroke weight',
  dots:'Reconstruct part using points',
  dashes:'Reconstruct part using short dashes',
  taper:'Alter stress from one end to the other',
  rotate:'Rotate this one component',
  invert:'Swap pigment role on this part',
  omit:'Do not draw selected component',
  serifs:'Graft terminal / serif fragments',
  shift_sidebearing:'Move letters apart without resizing strokes'
};
export const ANATOMY_PRESETS={
  opposite_stems:{target:'stem',operation:'bend',amount:.75},
  opened_counters:{target:'counter',operation:'open',amount:.65},
  faceted_bowls:{target:'bowl',operation:'facet',amount:.82},
  flying_crossbars:{target:'crossbar',operation:'lift',amount:.68},
  lost_terminals:{target:'terminal',operation:'fracture',amount:.70},
  separated_legs:{target:'leg',operation:'detach',amount:.62},
  punctuation_dots:{target:'dot',operation:'dots',amount:.75},
  antisymmetry:{target:'diagonal',operation:'bend',amount:.85},
  counter_collision:{target:'counter',operation:'expand',amount:.85},
  hatch_spines:{target:'spine',operation:'dashes',amount:.8},
  interrupted_stems:{target:'stem',operation:'fracture',amount:.65},
  ascending_forms:{target:'ascender',operation:'lift',amount:.68}
};
export const GUIDELINES={cap:0.13,x:0.38,baseline:0.86,descent:1.11};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const point=str=>str.split(',').map(Number);
const line=(part,points,side=0)=>({part,kind:'line',side,points:points.trim().split(/\s+/).map(point)});
const arc=(part,cx,cy,rx,ry,a=0,b=Math.PI*2,side=0)=>{
 const length=Math.abs(b-a),steps=Math.max(9,Math.ceil(length/Math.PI*22));
 const points=Array.from({length:steps+1},(_,i)=>{
  const t=a+(b-a)*i/steps;return [cx+rx*Math.cos(t),cy+ry*Math.sin(t)];
 });
 return {part,kind:'curve',side,points,closed:length>Math.PI*1.98};
};
const bezier=(part,a,b,c,d)=>{
 const p0=point(a),p1=point(b),p2=point(c),p3=point(d);
 const points=Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;
  return [0,1].map(j=>u*u*u*p0[j]+3*u*u*t*p1[j]+3*u*t*t*p2[j]+t*t*t*p3[j]);
 });
 return {part,kind:'curve',side:0,points};
};
const L=line,A=arc,B=bezier,PI=Math.PI;
const G={};
// All named components are owned by actual glyphs. Nothing here attempts to
// infer a counter from typeface pixels after the fact.
G.A=()=>[L('diagonal','.12,.86 .5,.13',-1),L('diagonal','.5,.13 .88,.86',1),L('crossbar','.30,.61 .70,.61')];
G.B=()=>[L('stem','.18,.13 .18,.86',-1),A('bowl',.29,.33,.48,.20,-PI/2,PI/2,1),A('bowl',.29,.65,.50,.22,-PI/2,PI/2,1)];
G.C=()=>[A('bowl',.52,.495,.36,.37,-PI*.33,PI*1.33)];
G.D=()=>[L('stem','.16,.13 .16,.86',-1),A('bowl',.22,.495,.59,.365,-PI/2,PI/2,1)];
G.E=()=>[L('stem','.17,.13 .17,.86',-1),L('arm','.17,.13 .83,.13'),L('arm','.17,.49 .72,.49'),L('arm','.17,.86 .84,.86')];
G.F=()=>[L('stem','.17,.13 .17,.86',-1),L('arm','.17,.13 .86,.13'),L('arm','.17,.47 .70,.47')];
G.G=()=>[A('bowl',.51,.49,.36,.36,-PI*.27,PI*1.35),L('spur','.85,.53 .85,.75'),L('crossbar','.61,.53 .85,.53')];
G.H=()=>[L('stem','.17,.13 .17,.86',-1),L('stem','.83,.13 .83,.86',1),L('crossbar','.17,.50 .83,.50')];
G.I=()=>[L('arm','.20,.13 .80,.13'),L('stem','.5,.13 .5,.86'),L('arm','.20,.86 .80,.86')];
G.J=()=>[L('arm','.29,.13 .83,.13'),L('stem','.76,.13 .76,.70',1),B('shoulder','.76,.70','.72,.96','.19,1.0','.19,.71')];
G.K=()=>[L('stem','.18,.13 .18,.86',-1),L('arm','.81,.13 .18,.55'),L('leg','.43,.44 .84,.86')];
G.L=()=>[L('stem','.17,.13 .17,.86',-1),L('arm','.17,.86 .83,.86')];
G.M=()=>[L('stem','.13,.86 .13,.13',-1),L('diagonal','.13,.13 .50,.56',-1),L('diagonal','.50,.56 .87,.13',1),L('stem','.87,.13 .87,.86',1)];
G.N=()=>[L('stem','.16,.86 .16,.13',-1),L('diagonal','.16,.13 .84,.86'),L('stem','.84,.86 .84,.13',1)];
G.O=()=>[A('bowl',.50,.495,.36,.375)];
G.P=()=>[L('stem','.18,.86 .18,.13',-1),A('bowl',.30,.34,.48,.21,-PI/2,PI/2,1)];
G.Q=()=>[A('bowl',.50,.495,.36,.375),L('tail','.59,.71 .94,.99',1)];
G.R=()=>[...G.P(),L('leg','.44,.53 .85,.86',1)];
G.S=()=>[B('spine','.80,.22','.26,-.06','.07,.39','.50,.50'),
 B('spine','.50,.50','.94,.59','.91,1.05','.18,.79')];
G.T=()=>[L('crossbar','.09,.13 .91,.13'),L('stem','.50,.13 .50,.86')];
G.U=()=>[L('stem','.16,.13 .16,.62',-1),A('bowl',.50,.62,.34,.24,PI,0),L('stem','.84,.62 .84,.13',1)];
G.V=()=>[L('diagonal','.13,.13 .50,.86',-1),L('diagonal','.50,.86 .87,.13',1)];
G.W=()=>[L('diagonal','.08,.13 .27,.86',-1),L('diagonal','.27,.86 .50,.40',-1),
 L('diagonal','.50,.40 .73,.86',1),L('diagonal','.73,.86 .92,.13',1)];
G.X=()=>[L('diagonal','.16,.13 .84,.86',-1),L('diagonal','.84,.13 .16,.86',1)];
G.Y=()=>[L('arm','.15,.13 .50,.51',-1),L('arm','.85,.13 .50,.51',1),L('stem','.50,.51 .50,.86')];
G.Z=()=>[L('arm','.15,.13 .85,.13'),L('diagonal','.85,.13 .15,.86'),L('arm','.15,.86 .85,.86')];
G['0']=()=>[A('bowl',.50,.495,.34,.365),L('diagonal','.30,.70 .68,.29')];
G['1']=()=>[L('arm','.30,.32 .55,.13'),L('stem','.55,.13 .55,.86'),L('arm','.22,.86 .81,.86')];
G['2']=()=>[A('bowl',.50,.34,.34,.20,PI*.94,PI*1.98),L('leg','.81,.35 .18,.86'),L('arm','.18,.86 .85,.86')];
G['3']=()=>[A('bowl',.40,.31,.38,.20,-PI*.6,PI*.55),A('bowl',.40,.68,.4,.19,-PI*.56,PI*.62)];
G['4']=()=>[L('diagonal','.68,.13 .19,.64'),L('crossbar','.19,.64 .85,.64'),L('stem','.68,.13 .68,.86')];
G['5']=()=>[L('stem','.77,.13 .22,.13'),L('stem','.22,.13 .22,.50'),A('bowl',.43,.68,.39,.19,-PI*.67,PI*.68)];
G['6']=()=>[A('bowl',.53,.66,.32,.21),B('spine','.22,.66','.16,.38','.45,.09','.77,.15')];
G['7']=()=>[L('arm','.16,.13 .85,.13'),L('diagonal','.85,.13 .39,.86')];
G['8']=()=>[A('bowl',.50,.31,.29,.19),A('bowl',.50,.68,.36,.19)];
G['9']=()=>[A('bowl',.49,.33,.32,.20),B('spine','.81,.32','.89,.55','.67,.90','.27,.84')];
G['.']=()=>[A('dot',.50,.81,.055,.055)];
G[':']=()=>[A('dot',.50,.45,.055,.055),A('dot',.50,.81,.055,.055)];
G['!']=()=>[L('stem','.50,.13 .50,.68'),A('dot',.50,.82,.06,.055)];
G['?']=()=>[A('shoulder',.50,.33,.29,.22,-PI*.92,PI*.05),
 L('spine','.75,.30 .50,.61'),A('dot',.50,.81,.06,.06)];
G['-']=()=>[L('cross_stroke','.20,.54 .80,.54')];
G['_']=()=>[L('crossbar','.13,1.04 .87,1.04')];
G['/']=()=>[L('diagonal','.18,.91 .82,.10')];
G['&']=()=>[A('bowl',.42,.34,.25,.20),B('spine','.64,.38','.34,.52','.25,.65','.24,.74'),
 B('tail','.24,.74','.43,1.0','.83,.83','.89,.47')];
G['+']=()=>[L('stem','.50,.29 .50,.74'),L('cross_stroke','.22,.52 .78,.52')];
G["'"]=()=>[L('terminal','.53,.13 .47,.30')];
// Lowercase is structurally distinct: x-height, extenders and tittle are
// genuine regions, not capital letters shrunk without named anatomy.
const lower={
 a:()=>[A('bowl',.43,.63,.30,.23),L('stem','.74,.40 .74,.86',1)],
 b:()=>[L('ascender','.20,.13 .20,.86',-1),A('bowl',.47,.63,.29,.23)],
 c:()=>[A('bowl',.50,.63,.33,.23,-PI*.30,PI*1.32)],
 d:()=>[L('ascender','.78,.13 .78,.86',1),A('bowl',.49,.63,.29,.23)],
 e:()=>[A('bowl',.49,.63,.32,.23,-PI*.19,PI*1.44),L('crossbar','.21,.62 .78,.62')],
 f:()=>[L('ascender','.46,.86 .48,.25'),A('shoulder',.63,.25,.20,.12,PI*.90,PI*1.92),L('cross_stroke','.23,.45 .75,.45')],
 g:()=>[A('bowl',.47,.59,.28,.19),L('descender','.75,.42 .75,.96'),
        A('loop',.48,.98,.27,.15,-PI*.20,PI*.98)],
 h:()=>[L('ascender','.20,.13 .20,.86',-1),A('shoulder',.47,.60,.27,.20,PI,PI*2),L('stem','.74,.59 .74,.86',1)],
 i:()=>[L('stem','.50,.39 .50,.86'),A('dot',.50,.21,.07,.065)],
 j:()=>[L('descender','.65,.39 .65,1.0'),A('shoulder',.47,.99,.18,.14,0,PI),A('dot',.65,.21,.07,.065)],
 k:()=>[L('ascender','.20,.13 .20,.86',-1),L('arm','.75,.38 .22,.66'),L('leg','.42,.57 .78,.86')],
 l:()=>[L('ascender','.50,.13 .50,.86')],
 m:()=>[L('stem','.12,.40 .12,.86',-1),A('shoulder',.32,.60,.20,.20,PI,PI*2),L('stem','.52,.60 .52,.86'),
        A('shoulder',.69,.60,.17,.20,PI,PI*2),L('stem','.86,.60 .86,.86',1)],
 n:()=>[L('stem','.20,.40 .20,.86',-1),A('shoulder',.48,.60,.28,.20,PI,PI*2),L('stem','.76,.60 .76,.86',1)],
 o:()=>[A('bowl',.50,.63,.32,.23)],
 p:()=>[L('descender','.20,.41 .20,1.11',-1),A('bowl',.48,.62,.29,.22)],
 q:()=>[L('descender','.77,.41 .77,1.11',1),A('bowl',.49,.62,.29,.22)],
 r:()=>[L('stem','.25,.40 .25,.86',-1),A('shoulder',.52,.54,.26,.15,PI,PI*1.78)],
 s:()=>[B('spine','.77,.46','.33,.25','.20,.58','.50,.64'),
        B('spine','.50,.64','.84,.72','.68,.93','.19,.81')],
 t:()=>[L('ascender','.50,.20 .50,.76'),L('cross_stroke','.22,.45 .78,.45'),A('terminal',.62,.76,.12,.10,0,PI)],
 u:()=>[L('stem','.20,.40 .20,.68',-1),A('shoulder',.49,.67,.29,.19,PI,0),L('stem','.78,.40 .78,.86',1)],
 v:()=>[L('diagonal','.17,.40 .50,.86',-1),L('diagonal','.50,.86 .83,.40',1)],
 w:()=>[L('diagonal','.09,.40 .30,.86',-1),L('diagonal','.30,.86 .50,.54',-1),L('diagonal','.50,.54 .70,.86',1),L('diagonal','.70,.86 .91,.40',1)],
 x:()=>[L('diagonal','.20,.40 .80,.86',-1),L('diagonal','.80,.40 .20,.86',1)],
 y:()=>[L('diagonal','.16,.40 .49,.86',-1),L('descender','.82,.40 .39,1.11',1)],
 z:()=>[L('arm','.19,.40 .82,.40'),L('diagonal','.82,.40 .19,.86'),L('arm','.19,.86 .82,.86')]
};
Object.assign(G,lower);
const COUNTERS=new Set('ABDOPQR0689abdegopq'.split(''));
const APERTURES=new Set('CGSacefrs356'.split(''));
const SECTIONS=new Set('abdegopqBOPR89'.split(''));
const EXTENDERS=new Set('bdfghijklpqty'.split(''));
const DESCENDERS=new Set('gjpqy'.split(''));
const WIDE=new Set('MmWw'.split(''));
const NARROW=new Set('Iilj1'.split(''));
export function glyphWidth(char){if(char===' ')return .42;if(WIDE.has(char))return 1.18;if(NARROW.has(char))return .55;return 1;}
export function glyphAnatomy(char){
 const fn=G[char];const components=fn?fn():[];
 const parts=new Set(components.map(p=>p.part));
 if(components.length){parts.add('terminal');parts.add('join');parts.add('baseline');
   parts.add('sidebearing');parts.add('axis');}
 if(/[A-Z0-9]/.test(char))parts.add('cap_height');
 if(/[a-z]/.test(char))parts.add('x_height');
 if(COUNTERS.has(char))parts.add('counter');
 if(APERTURES.has(char))parts.add('aperture');
 if(SECTIONS.has(char))parts.add('overshoot');
 if(EXTENDERS.has(char))parts.add('ascender');
 if(DESCENDERS.has(char))parts.add('descender');
 if(components.some(p=>p.part==='stem'||p.part==='ascender'))parts.add('serif');
 if('AVMW'.includes(char))parts.add('apex');
 if('VW'.includes(char))parts.add('vertex');
 return {char,components,parts:[...parts],width:glyphWidth(char),baseline:GUIDELINES.baseline,
   xHeight:GUIDELINES.x,capHeight:GUIDELINES.cap,descenderLine:GUIDELINES.descent};
}
export function partsForWord(word){
 const glyphs=[...String(word||'')].filter(c=>c!==' ');
 const out={};
 for(const glyph of glyphs)for(const part of glyphAnatomy(glyph).parts){
   out[part]||=[];if(!out[part].includes(glyph))out[part].push(glyph);
 }
 return out;
}
export function supportsPart(char,part){
 return part==='any'||glyphAnatomy(char).parts.includes(part);
}
export function applicableComponents(anatomy,target){
 if(target==='any')return anatomy.components;
 if(target==='counter'||target==='overshoot')
   return anatomy.components.filter(c=>['bowl','loop','shoulder'].includes(c.part));
 if(target==='aperture')return anatomy.components.filter(c=>['bowl','spine','shoulder'].includes(c.part));
 if(target==='serif'||target==='sidebearing'||target==='cap_height'||target==='baseline'||
    target==='x_height'||target==='axis')
   return anatomy.components;
 if(target==='terminal')return anatomy.components.filter(c=>c.kind!=='curve'||!c.closed);
 if(target==='join')return anatomy.components;
 if(target==='apex'||target==='vertex')
   return anatomy.components.filter(c=>c.part==='diagonal');
 if(target==='ascender')return anatomy.components.filter(c=>c.part==='ascender'||c.part==='stem'&&/[bdfhkl]/.test(anatomy.char));
 if(target==='descender')return anatomy.components.filter(c=>c.part==='descender'||c.part==='loop');
 return anatomy.components.filter(c=>c.part===target);
}
export function normalizePartRule(value={}){
 const target=value.target in ANATOMY||value.target==='any'?value.target:'any';
 const operation=value.operation in PART_OPERATIONS?value.operation:'bend';
 const amount=clamp(Number(value.amount)||.60,.08,1);
 const glyph=typeof value.glyph==='string'&&value.glyph.length<=2?value.glyph:'all';
 return {target,operation,amount,glyph};
}
export function editAnatomyProgram(program=null,overrides={}){
 const explicitlySet=Array.isArray(program?.rules);
 const rules=(explicitlySet?program.rules:[]).slice(0,3).map(normalizePartRule);
 if(overrides.rule)rules[0]=normalizePartRule(overrides.rule);
 return {v:1,enabled:overrides.enabled??program?.enabled??true,
   // Explicit empty list means the last law has been UNDONE. Fresh genomes
   // (with no prior list) get a single useful editable default.
   rules:rules.length||explicitlySet?rules:[normalizePartRule({target:'crossbar',operation:'lift'})],
   guide:!!(overrides.guide??program?.guide),seed:(overrides.seed??program?.seed??11)>>>0};
}
function mutateChoice(r,values,previous){const other=values.filter(x=>x!==previous);return other[Math.floor(r()*other.length)];}
export function mutateAnatomyProgram(program,seed=1,{forcePart=null,mate=null}={}){
 const input=editAnatomyProgram(program),r=(()=>{let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}})();
 const rules=input.rules.map(x=>({...x}));
 if(r()<.20&&rules.length<3){
   rules.push(normalizePartRule({target:forcePart||mutateChoice(r,Object.keys(ANATOMY),'any'),
     operation:mutateChoice(r,Object.keys(PART_OPERATIONS),'bend'),amount:.45+r()*.5}));
 }else{
   const index=Math.floor(r()*rules.length),edit=rules[index];
   if(forcePart)edit.target=forcePart;
   else if(r()<.48)edit.target=mutateChoice(r,Object.keys(ANATOMY),edit.target);
   if(r()<.73)edit.operation=mutateChoice(r,Object.keys(PART_OPERATIONS),edit.operation);
   edit.amount=clamp(edit.amount+(r()-.5)*.5,.08,1);
   if(mate?.rules?.length&&r()<.24)rules[index]={...mate.rules[index%mate.rules.length]};
 }
 return {v:1,enabled:true,rules:rules.map(normalizePartRule),guide:input.guide,seed:seed>>>0};
}
export function ruleMatchesGlyph(rule,char,index){
 return (rule.glyph==='all'||rule.glyph===char||rule.glyph==='first'&&index===0)&&supportsPart(char,rule.target);
}
export function componentMask(rule,char,index,component){
 if(!ruleMatchesGlyph(rule,char,index))return false;
 const an=glyphAnatomy(char);
 return applicableComponents(an,rule.target).some(x=>x===component||x.part===component.part);
}
const LOCAL_REGIONS=new Set([
 'terminal','serif','apex','vertex','join','baseline','cap_height','x_height',
 'ascender','descender','sidebearing','overshoot'
]);
export function anatomyZoneWeight(region,point,t){
 const [x,y]=point;
 const fade=(distance,radius)=>clamp(1-distance/radius,0,1);
 if(region==='terminal'||region==='serif')return Math.max(
   fade(t,.24),fade(1-t,.24));
 if(region==='apex')return fade(Math.abs(y-.13),.32);
 if(region==='vertex')return fade(Math.abs(y-.86),.30);
 if(region==='baseline')return fade(Math.abs(y-GUIDELINES.baseline),.20);
 if(region==='cap_height')return fade(Math.abs(y-GUIDELINES.cap),.22);
 if(region==='x_height')return fade(Math.abs(y-GUIDELINES.x),.22);
 if(region==='ascender')return clamp((.43-y)/.28,0,1);
 if(region==='descender')return clamp((y-.78)/.28,0,1);
 if(region==='sidebearing')return Math.max(fade(x,.34),fade(1-x,.34));
 if(region==='overshoot')return Math.max(fade(y,.18),fade(1-y,.16));
 if(region==='join')return fade(Math.abs(t-.5),.28);
 return 1;
}
export function transformedComponent(component,rule,{char='A'}={}){
 const effect=rule.operation,local=LOCAL_REGIONS.has(rule.target);
 // Bent stems and terminal-only rules must have interior control points;
 // moving the two endpoints of a line isn't the same as bending a stroke.
 let points=component.points.map(p=>[...p]);
 if((local||['bend','fracture','dots','dashes','taper','open'].includes(effect))&&points.length<8){
   const dense=[];
   for(let j=1;j<points.length;j++){
     const a=points[j-1],b=points[j];
     for(let i=0;i<16;i++){
       const t=i/16;dense.push([a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t]);
     }
   }
   dense.push([...points.at(-1)]);points=dense;
 }
 const amount=clamp(Number(rule.amount)||.55,.08,1);
 const cx=points.reduce((sum,p)=>sum+p[0],0)/points.length,
   cy=points.reduce((sum,p)=>sum+p[1],0)/points.length;
 const side=component.side||((cx>=.5)?1:-1);
 let omit=!!component.omit,dotted=!!component.dotted,dashed=!!component.dashed,
   fractured=!!component.fractured,faceted=!!component.faceted;
 let width=component.width||1,invert=!!component.invert,serifs=!!component.serifs,
   open=!!component.open;
 let skipLocal=Array.isArray(component.skipLocal)?component.skipLocal.slice():null;
 let localWeights=Array.isArray(component.localWeights)?component.localWeights.slice():null;
 let localInverts=Array.isArray(component.localInverts)?component.localInverts.slice():null;
 const isTerm=rule.target==='terminal'||rule.target==='serif';
 for(let i=0;i<points.length;i++){
   const p=points[i],t=i/Math.max(1,points.length-1);
   const original=[...p],weight=local?anatomyZoneWeight(rule.target,original,t):1;
   if(effect==='bend')p[0]+=side*.19*amount*Math.sin(Math.PI*t)*weight;
   if(effect==='lift')p[1]-=.21*amount*weight;
   if(effect==='drop')p[1]+=.21*amount*weight;
   if(effect==='widen')p[0]+=(p[0]-.5)*amount*.35*weight;
   if(effect==='compress')p[0]-=(p[0]-.5)*amount*.30*weight;
   if(effect==='expand'){
     p[0]+=(p[0]-cx)*amount*.34*weight;
     p[1]+=(p[1]-cy)*amount*.21*weight;
   }
   if(effect==='pinch')p[0]+=(cx-p[0])*amount*.46*weight;
   if(effect==='detach')p[0]+=side*amount*.21*weight;
   if(effect==='rotate'){
     const theta=amount*.55,dx=p[0]-cx,dy=p[1]-cy;
     const px=cx+Math.cos(theta)*dx-Math.sin(theta)*dy;
     const py=cy+Math.sin(theta)*dx+Math.cos(theta)*dy;
     p[0]+=weight*(px-p[0]);p[1]+=weight*(py-p[1]);
   }
   if(effect==='shift_sidebearing')p[0]+=side*.15*amount*weight;
   if(local&&['thin','thicken','taper'].includes(effect)){
     localWeights||=Array(points.length).fill(1);
     localWeights[i]=(localWeights[i]??1)*
       (effect==='thin'?1-.68*amount*weight:
       effect==='thicken'?1+1.2*amount*weight:
       .9+.45*amount*weight);
   }
   if(local&&effect==='invert'){
     localInverts||=Array(points.length).fill(false);
     if(weight>.5)localInverts[i]=!localInverts[i];
   }
   if(local&&['omit','fracture','open'].includes(effect)){
     skipLocal||=Array(points.length).fill(false);
     if(weight>.55)skipLocal[i]=true;
   }
 }
 if(effect==='omit'&&!local)omit=true;
 if(effect==='dots')dotted=true;
 if(effect==='dashes')dashed=true;
 if(effect==='fracture'&&!local)fractured=true;
 if(effect==='facet')faceted=true;
 if(effect==='thin'&&!local)width*=1-amount*.7;
 if(effect==='thicken'&&!local)width*=1+amount*1.3;
 if(effect==='taper'&&!local)width*=.55+amount*.48;
 if(effect==='invert'&&!local)invert=!invert;
 if(effect==='serifs')serifs=true;
 if(effect==='open'&&component.closed&&!local)open=true;
 if(effect==='open'&&!component.closed&&!local)fractured=true;
 return {...component,points,omit,dotted,dashed,fractured,faceted,
   width,open,invert,serifs,isTerm:isTerm||component.isTerm,amount,
   skipLocal,localWeights,localInverts};
}

export function compileAnatomyGlyph(char,index,program){
 const anatomy=glyphAnatomy(char);
 const commands=anatomy.components.map(component=>{
   let item={...component,points:component.points.map(p=>[...p]),width:1};
   for(const original of program?.rules||[]){
     const rule=normalizePartRule(original);
     if(!componentMask(rule,char,index,component))continue;
     item=transformedComponent(item,rule,{char});
   }
   return item;
 });
 const affected=(program?.rules||[]).map(original=>{
   const rule=normalizePartRule(original),matching=anatomy.components.filter(c=>componentMask(rule,char,index,c));
   return {target:rule.target,operation:rule.operation,components:matching.length,matched:!!matching.length};
 });
 return {char,components:commands,parts:anatomy.parts,affected,metrics:anatomy};
}
