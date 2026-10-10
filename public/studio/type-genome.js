/* Hexfield 330 — executable hereditary typography, not font selection.
 * Every letter receives a reproducible shape grammar; offspring mutate
 * one bounded dimension of their parent's actual accepted type program.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const mix=s=>{
 let h=2166136261>>>0;
 for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;
};
const u=(seed,label)=>mix(seed+'|'+label)/4294967296;
export const TYPE_GRAMMARS=Object.freeze(['rounded','split','kinetic','architectural']);
export function typeGenome(seed=1,grammar=null){
 const style=TYPE_GRAMMARS.includes(grammar)?grammar:
  TYPE_GRAMMARS[mix(seed)%TYPE_GRAMMARS.length];
 const defaults={
  rounded:[1.05,.02,.08,1.18,1.06,.015],
  split:[.98,.04,.028,1.52,.69,.065],
  kinetic:[.94,.115,.025,.92,1.18,-.055],
  architectural:[1.09,-.025,.01,1.23,.95,.025]
 }[style];
 return {v:1,root:'type-'+mix(seed+'root').toString(36),
  grammar:style,seed:seed>>>0,
  width:defaults[0],slant:defaults[1],bubble:defaults[2],
  top:defaults[3],bottom:defaults[4],split:defaults[5],
  tracking:.035,chromatic:.5,generation:0};
}
export function validTypeGenome(g){
 return !!g&&g.v===1&&TYPE_GRAMMARS.includes(g.grammar)&&
  ['width','slant','bubble','top','bottom','split','tracking','chromatic'].
   every(k=>Number.isFinite(g[k]))&&
  typeof g.root==='string'&&g.root.length<64;
}
const BOUNDS={
 width:[.72,1.3],slant:[-.18,.18],bubble:[0,.105],
 top:[.62,1.8],bottom:[.62,1.8],split:[-.11,.11],
 tracking:[-.015,.14],chromatic:[0,1]
};
const genes=Object.keys(BOUNDS);
export function evolveTypeGenome(parent,{seed=1,cycle=0,branch=0,gentle=false}={}){
 const base=validTypeGenome(parent)?parent:typeGenome(seed);
 // A direct relative, not a random new font every frame. Preview branches
 // are deterministically distinct and only the accepted one is inherited.
 const g={...base,seed:seed>>>0,
  generation:Math.min(100000,(base.generation||0)+1)};
 const gene=genes[(Math.max(0,cycle)+Math.max(0,branch)*3+
   (mix(base.root)%genes.length))%genes.length];
 const [a,b]=BOUNDS[gene];
 const step=(b-a)*(gentle?.085:.18)*(u(seed, gene)>0.5?1:-1);
 g[gene]=+clamp(base[gene]+step,a,b).toFixed(4);
 // Occasionally a new grammar wins a *measured* candidate; its structural
 // root survives and its dimensions remain locally inherited.
 if(!gentle&&cycle%7===6&&branch===2)
  g.grammar=TYPE_GRAMMARS[(TYPE_GRAMMARS.indexOf(base.grammar)+1)%TYPE_GRAMMARS.length];
 return g;
}
export function glyphTraits(genome,char,index=0){
 const g=validTypeGenome(genome)?genome:typeGenome(1);
 const variation=u(g.seed,char+':'+index),s=(variation-.5)*2;
 const indexBeat=(index%3)-1;
 return {
  width:clamp(g.width+s*.09+indexBeat*.025,.7,1.34),
  slant:clamp(g.slant+s*.055,-.22,.22),
  bubble:clamp(g.bubble+(g.grammar==='rounded'?Math.abs(s)*.016:0),0,.12),
  top:clamp(g.top+s*.18,.52,1.88),
  bottom:clamp(g.bottom-s*.14,.52,1.88),
  split:clamp(g.split+indexBeat*.014,-.12,.12),
  tracking:clamp(g.tracking+s*.016,-.02,.16),
  pigment:clamp(g.chromatic+s*.28,0,1)
 };
}
export const typeFingerprint=g=>validTypeGenome(g)?
 g.root+'/'+g.grammar+'/'+g.generation+'/'+g.seed.toString(16):'none';
