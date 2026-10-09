/* Hexfield 296 — evolvable *procedures*, not a picker for six immutable pictures.
 * Genomes are bounded, declarative programs: no eval, no arbitrary user code.
 * Their typed operation trees can replace subtrees, recombine and change their
 * rendering grammar. A seed controls sampling, not the painting method.
 */
export const FOCI = ['structure', 'surface', 'light'];
export const LAND_STROKES = ['contour', 'hatch', 'mosaic', 'knife', 'wash', 'stipple'];
export const SKY_METHODS = ['clouds', 'veils', 'bands', 'radial', 'flat'];
export const LAYOUTS = ['valley', 'escarpment', 'sweep', 'basin', 'ridges', 'islands'];
export const GROWTH = ['branch', 'spire', 'fan', 'grass', 'none'];
export const LETTER_STROKES = ['solid', 'inline', 'outline', 'stencil', 'double'];
export const LETTER_FORMS = ['upright', 'shear', 'squeeze', 'stagger', 'bridge', 'waist'];
export const LETTER_FRAMES = ['none', 'box', 'ring', 'brackets', 'rails'];
const LEAVES = ['wave', 'fbm', 'ridge', 'terrace', 'dune', 'peak', 'basin', 'steps', 'noise'];
const UNARY = ['fold', 'bend', 'carve', 'reverse', 'quantize'];
const BINARY = ['add', 'blend', 'cut', 'max', 'multiply'];
const GEOMETRY = [...LEAVES, ...UNARY, ...BINARY];
const choice = (r, a) => a[Math.floor(r() * a.length)];
const number = (r, a, b) => a + r() * (b - a);
const other = (r, a, value) => choice(r, a.filter(x => x !== value));
const clone = v => JSON.parse(JSON.stringify(v));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function randomFrom(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return () => { s += 0x6d2b79f5; let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function leaf(r) { return {o:choice(r, LEAVES), f:+number(r, .6, 6).toFixed(2), p:+number(r, -3, 3).toFixed(2)}; }
export function makeTree(r, depth=2) {
  if(depth<=0 || r()<.43) return leaf(r);
  const o=choice(r, [...UNARY,...BINARY]);
  const node={o,a:makeTree(r,depth-1),f:+number(r,.5,3).toFixed(2),p:+number(r,-2,2).toFixed(2)};
  if(BINARY.includes(o))node.b=makeTree(r,depth-1);
  return node;
}
function mutateTree(original,r,depth=0) {
  if(!original || depth>3 || r()<.52) return makeTree(r,Math.max(0,2-depth));
  const node=clone(original);
  if(r()<.36){node.o=other(r,GEOMETRY,node.o);if(LEAVES.includes(node.o)){delete node.a;delete node.b;}
    else {node.a=node.a||makeTree(r,1);if(BINARY.includes(node.o))node.b=node.b||makeTree(r,1);else delete node.b;}}
  if(node.a && r()<.78)node.a=mutateTree(node.a,r,depth+1);
  else if(node.b)node.b=mutateTree(node.b,r,depth+1);
  node.f=+clamp((Number(node.f)||1)*number(r,.58,1.65),.4,9).toFixed(2);
  node.p=+clamp((Number(node.p)||0)+number(r,-.9,.9),-4,4).toFixed(2);
  return node;
}
function treeOps(tree, result=[]) {
  if(!tree || typeof tree.o!=='string')return result;
  result.push(tree.o); if(tree.a)treeOps(tree.a,result); if(tree.b)treeOps(tree.b,result);
  return result;
}
export function dominantOp(tree) {
  const ops=treeOps(tree);return ops.find(x=>GEOMETRY.includes(x))||'ridge';
}
export function treeDepth(t) {return !t?0:1+Math.max(treeDepth(t.a),treeDepth(t.b));}
export function programKey(g) {
  if(!g || !g.kind)return 'missing';
  const ops = g.kind==='landscape' ? [g.layout,g.brush,g.sky,g.growth,...treeOps(g.terrain),...treeOps(g.detail)] :
    [g.letterForm,g.letterStroke,g.letterFrame,g.joint,g.terminal];
  return [g.kind, ...ops].join('|');
}
// Full method identity includes numeric parameters and nested node structure.
// The older programKey only includes operator names; use it for describing
// families, not for rejecting or preserving a specific learned descendant.
export function methodFingerprint(genome){
  if(!genome?.kind)return 'missing';
  const {generation,origin,...core}=genome;
  const source=JSON.stringify(core);
  let h=2166136261;
  for(let i=0;i<source.length;i++){
    h=Math.imul(h^source.charCodeAt(i),16777619)>>>0;
  }
  return genome.kind+'-'+h.toString(16).padStart(8,'0');
}
export function geneFeatures(g) {
  if(!g || !g.kind)return {};
  return g.kind==='landscape'
    ? {terrain:dominantOp(g.terrain),brush:g.brush,sky:g.sky,layout:g.layout,growth:g.growth}
    : {construction:g.letterForm,stroke:g.letterStroke,frame:g.letterFrame,joint:g.joint};
}
export function makeGenome(kind='landscape', seed=1) {
  const r=randomFrom(seed);
  if(kind==='lettering')return {
    v:1,kind,letterForm:choice(r,LETTER_FORMS),letterStroke:choice(r,LETTER_STROKES),
    letterFrame:choice(r,LETTER_FRAMES),joint:choice(r,['discrete','ligature','shared']),
    terminal:choice(r,['round','square','serif']),angle:+number(r,-.1,.1).toFixed(2),
    track:+number(r,.015,.14).toFixed(2),mass:+number(r,.65,1.28).toFixed(2),
    color:+number(r,0,1).toFixed(2),generation:0,origin:'invented',
  };
  return {
    v:1,kind:'landscape',terrain:makeTree(r,2),detail:makeTree(r,1),
    layout:choice(r,LAYOUTS),brush:choice(r,LAND_STROKES),sky:choice(r,SKY_METHODS),
    growth:choice(r,GROWTH),water:choice(r,['mirror','ripples','blocks','none']),
    bands:Math.floor(number(r,2,6)),horizon:+number(r,.34,.59).toFixed(3),
    relief:+number(r,.15,.7).toFixed(2),brushSize:+number(r,.4,1.5).toFixed(2),
    atmosphere:+number(r,.1,.85).toFixed(2),chroma:+number(r,.55,1.35).toFixed(2),
    lightAngle:+number(r,-2.5,2.5).toFixed(2),generation:0,origin:'invented',
  };
}
function mutateProperty(g,r,key,options){g[key]=other(r,options,g[key]);}
export function mutateGenome(parent,focus,seed,mate=null) {
  if(!parent||!['landscape','lettering'].includes(parent.kind))return makeGenome('landscape',seed);
  const r=randomFrom(seed),g=clone(parent);
  g.generation=Math.min(999,(parent.generation||0)+1);g.origin=mate?'recombined':'mutated';
  if(g.kind==='landscape') {
    if(focus==='structure'||focus==='wild') {
      const first=r()<.65?'terrain':'detail';
      g[first]=mate?.kind==='landscape'&&r()<.5 ? clone(mate[first]) : mutateTree(g[first],r);
      mutateProperty(g,r,'layout',LAYOUTS);
      g.bands=Math.floor(number(r,2,6));
      g.relief=+clamp(g.relief*number(r,.6,1.7),.12,.89).toFixed(2);
    } else if(focus==='surface') {
      mutateProperty(g,r,'brush',LAND_STROKES);
      mutateProperty(g,r,'growth',GROWTH);
      g.detail=mate?.kind==='landscape'&&r()<.5?clone(mate.detail):mutateTree(g.detail,r);
      g.brushSize=+clamp(g.brushSize*number(r,.6,1.5),.35,1.8).toFixed(2);
    } else if(focus==='light') {
      mutateProperty(g,r,'sky',SKY_METHODS);
      mutateProperty(g,r,'water',['mirror','ripples','blocks','none']);
      g.atmosphere=+clamp(g.atmosphere+number(r,-.42,.42),.08,.95).toFixed(2);
      g.lightAngle=+clamp(g.lightAngle+number(r,-2,2),-3,3).toFixed(2);
      g.chroma=+clamp(g.chroma+number(r,-.45,.45),.45,1.65).toFixed(2);
    } else {
      return mutateGenome(g,choice(r,FOCI),seed+419,mate);
    }
  } else {
    if(focus==='structure'||focus==='wild') {
      mutateProperty(g,r,'letterForm',LETTER_FORMS);
      mutateProperty(g,r,'joint',['discrete','ligature','shared']);
      g.angle=+clamp(g.angle+number(r,-.18,.18),-.3,.3).toFixed(2);
    } else if(focus==='surface') {
      mutateProperty(g,r,'letterStroke',LETTER_STROKES);
      mutateProperty(g,r,'terminal',['round','square','serif']);
      g.mass=+clamp(g.mass*number(r,.75,1.34),.48,1.8).toFixed(2);
    } else if(focus==='light') {
      mutateProperty(g,r,'letterFrame',LETTER_FRAMES);
      g.color=+number(r,0,1).toFixed(2);
      g.track=+clamp(g.track*number(r,.5,1.85),.004,.25).toFixed(2);
    } else return mutateGenome(g,choice(r,FOCI),seed+461,mate);
    if(mate?.kind==='lettering'&&r()<.45){g.letterFrame=mate.letterFrame;g.letterStroke=mate.letterStroke;}
  }
  return g;
}
export function methodDistance(a,b){
  if(!a||!b || a.kind!==b.kind)return 1;
  const ka=programKey(a).split('|'),kb=programKey(b).split('|');
  let score=0;const length=Math.max(ka.length,kb.length);
  for(let i=0;i<length;i++)if(ka[i]!==kb[i])score++;
  return score/length;
}
export function proposeExperiments(parent,seed,nearby=[]) {
  const out=[],used=new Set([programKey(parent)]),r=randomFrom(seed);
  for(const focus of FOCI){
    let next=null;
    for(let i=0;i<12;i++){
      const mate=nearby.length&&r()<.28?choice(r,nearby):null;
      const proposed=mutateGenome(parent,focus,(seed+out.length*997+i*173)>>>0,mate);
      if(!used.has(programKey(proposed)) && methodDistance(parent,proposed)>.12){next=proposed;break;}
    }
    next ||= mutateGenome(parent,focus,seed+out.length*351);
    used.add(programKey(next));out.push({focus,genome:next});
  }
  return out;
}
export function methodDescription(g){
  if(!g)return 'an untested painting method';
  if(g.kind==='lettering')return `${g.letterForm} construction · ${g.letterStroke} strokes · ${g.joint} joins`;
  return `${g.layout} composition · ${dominantOp(g.terrain)} landform · ${g.brush} brushwork`;
}
export function evaluateSurface(g) {
  const violations=[];
  if(!g||!['landscape','lettering'].includes(g.kind))violations.push('unknown discipline');
  if(g?.kind==='landscape') {
    if(treeDepth(g.terrain)>5||treeDepth(g.detail)>5)violations.push('procedure exceeds depth limit');
    if(!LAYOUTS.includes(g.layout)||!LAND_STROKES.includes(g.brush)||!SKY_METHODS.includes(g.sky))violations.push('unknown landscape operator');
  }
  if(g?.kind==='lettering'&&!LETTER_STROKES.includes(g.letterStroke))violations.push('unknown lettering operator');
  return violations;
}
export function sampleGenome(pool,kind,seed){
  const r=randomFrom(seed),eligible=Array.isArray(pool)?pool.filter(v=>v?.genome?.kind===kind&&evaluateSurface(v.genome).length===0):[];
  if(!eligible.length||r()<.29)return makeGenome(kind,seed);
  const sorted=[...eligible].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,24);
  let total=0;const weights=sorted.map(x=>{const w=Math.max(.25,1+(x.score||0));total+=w;return w;});
  let target=r()*total;let parent=sorted[0];for(let i=0;i<sorted.length;i++){target-=weights[i];if(target<=0){parent=sorted[i];break;}}
  const mate=sorted.length>1&&r()<.38?choice(r,sorted).genome:null;
  return mutateGenome(parent.genome,choice(r,FOCI),seed+755,mate);
}
