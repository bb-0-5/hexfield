/* HEXFIELD 332 — legible, reproducible typographic construction.
 * Bubble rounds and inflates outlines; block builds hard, weighty contours.
 * Mutation is bounded and keeps the accepted genome's formal identity.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const mix=s=>{
 let h=2166136261>>>0;
 for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;
};
const u=(seed,label)=>mix(seed+'|'+label)/4294967296;
export const TYPE_GRAMMARS=Object.freeze([
 'rounded','split','kinetic','architectural','bubble','block'
]);
const DEFAULTS=Object.freeze({
 rounded:[1.05,.02,.07,1.18,1.06,.012,.062,.15],
 split:[.98,.035,.027,1.36,.88,.035,.035,.40],
 kinetic:[.97,.065,.025,1.02,1.15,-.032,.043,.35],
 architectural:[1.06,-.02,.01,1.24,1.08,.01,.058,.88],
 bubble:[1.11,0,.095,1.25,1.17,.003,.083,.04],
 block:[1.03,0,.008,1.36,1.28,0,.082,.97]
});
const BOUNDS={
 width:[.78,1.26],slant:[-.11,.11],bubble:[0,.105],
 top:[.84,1.48],bottom:[.84,1.48],split:[-.042,.042],
 tracking:[.02,.14],chromatic:[0,1],
 outline:[.02,.11],boxiness:[0,1]
};
export function typeGenome(seed=1,grammar=null){
 const style=TYPE_GRAMMARS.includes(grammar)?grammar:
  TYPE_GRAMMARS[mix(seed)%TYPE_GRAMMARS.length],
 d=DEFAULTS[style];
 return {v:1,root:'type-'+mix(seed+'root').toString(36),
  grammar:style,seed:seed>>>0,width:d[0],slant:d[1],bubble:d[2],
  top:d[3],bottom:d[4],split:d[5],outline:d[6],boxiness:d[7],
  tracking:.055,chromatic:.7,generation:0};
}
export function validTypeGenome(g){
 return !!g&&g.v===1&&TYPE_GRAMMARS.includes(g.grammar)&&
  ['width','slant','bubble','top','bottom','split','tracking','chromatic'].
   every(k=>Number.isFinite(g[k]))&&
  (g.outline===undefined||Number.isFinite(g.outline))&&
  (g.boxiness===undefined||Number.isFinite(g.boxiness))&&
  typeof g.root==='string'&&g.root.length<64;
}
const genes=Object.keys(BOUNDS);
const normal=(g,key)=>{
 if(Number.isFinite(g[key]))return clamp(g[key],...BOUNDS[key]);
 const d=DEFAULTS[g.grammar]||DEFAULTS.bubble;
 return key==='outline'?d[6]:key==='boxiness'?d[7]:0;
};
export function evolveTypeGenome(parent,{
 seed=1,cycle=0,branch=0,gentle=false,mode='auto'
}={}){
 const base=validTypeGenome(parent)?parent:typeGenome(seed,'bubble');
 const g={...base,seed:seed>>>0,
  generation:Math.min(100000,(base.generation||0)+1)};
 for(const key of genes)g[key]=normal(base,key);
 const gene=genes[(Math.max(0,cycle)+Math.max(0,branch)*3+
   mix(base.root)%genes.length)%genes.length];
 const [a,b]=BOUNDS[gene];
 const step=(b-a)*(gentle?.065:.13)*(u(seed,gene)>.5?1:-1);
 g[gene]=+clamp(g[gene]+step,a,b).toFixed(4);
 // The existing thumbnail/finalist slots audition distinct real grammars,
 // without adding renders. Branch zero retains the inherited character.
 const chosen=mode==='bubble'||mode==='block'?mode:
  mode==='auto'&&branch===1?(cycle%2?'block':'bubble'):
  mode==='auto'&&branch===2?(cycle%2?'bubble':'block'):null;
 if(chosen&&chosen!==g.grammar){
  g.grammar=chosen;
  // Preserve the root and accumulated proportions, but ensure a real
  // bubble/block change has distinct executable round/square geometry.
  const d=DEFAULTS[chosen];
  g.bubble=clamp((g.bubble+d[2])*.5,...BOUNDS.bubble);
  g.outline=clamp((g.outline+d[6])*.5,...BOUNDS.outline);
  g.boxiness=d[7];
  g.split=clamp(g.split*.3,...BOUNDS.split);
 }
 return g;
}
export function glyphTraits(genome,char,index=0){
 const g=validTypeGenome(genome)?genome:typeGenome(1,'bubble');
 const variation=u(g.seed,char+':'+index),s=(variation-.5)*2;
 const beat=(index%3)-1;
 return {
  width:clamp(g.width+s*.045+beat*.012,.77,1.30),
  slant:clamp(g.slant+s*.018,-.12,.12),
  bubble:clamp(g.bubble+Math.abs(s)*.008,0,.11),
  top:clamp(g.top+s*.075,.82,1.5),
  bottom:clamp(g.bottom-s*.065,.82,1.5),
  split:clamp(g.split+beat*.005,-.045,.045),
  tracking:clamp(g.tracking+s*.012,.015,.15),
  pigment:clamp(g.chromatic+s*.18,0,1),
  outline:clamp(normal(g,'outline')+s*.007,.02,.12),
  boxiness:clamp(normal(g,'boxiness'),0,1)
 };
}
export const typeFingerprint=g=>validTypeGenome(g)?
 g.root+'/'+g.grammar+'/'+g.generation+'/'+g.seed.toString(16):'none';
