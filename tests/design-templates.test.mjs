/* 331 — generic design purposes are evolving, pixel-evaluated systems. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(type){assert.equal(type,'canvas');return new Canvas(1,1)}};
const data=new Map();
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
const {DESIGN_PURPOSES,newDesignGenome,validDesignGenome,evolveDesignGenome,
 designBounds,noteDesignVerdict,designTaste,rankDesignCandidates}=
 await import('../public/studio/design-genome.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const {typeGenome}=await import('../public/studio/type-genome.js');
assert.deepEqual(DESIGN_PURPOSES,['art','promo','advert','logo']);
for(const purpose of DESIGN_PURPOSES){
 const root=newDesignGenome(purpose,9001);
 assert.ok(validDesignGenome(root));
 let parent=root;
 const seen=new Set();
 for(let cycle=0;cycle<12;cycle++){
  const g=evolveDesignGenome(parent,{purpose,seed:cycle+44,cycle,branch:cycle%3});
  assert.equal(g.root,root.root);
  assert.equal(g.purpose,purpose);
  assert.equal(g.generation,cycle+1);
  assert.ok(validDesignGenome(g));
  assert.deepEqual(g,evolveDesignGenome(parent,
    {purpose,seed:cycle+44,cycle,branch:cycle%3}),
    'A known seed and accepted ancestor must produce an exact repeat');
  seen.add(JSON.stringify([g.x,g.zone,g.width,g.height,g.ornament]));
  parent=g;
 }
 if(purpose!=='art')assert.ok(seen.size>=7,'Actual layout genes must keep mutating');
}
const fav=newDesignGenome('advert',12);
assert.equal(noteDesignVerdict(fav,true),true);
assert.equal(designTaste()['advert:brackets'],1);
assert.equal(noteDesignVerdict(fav,false),true);
assert.equal(designTaste()['advert:brackets'],0);
const W=360,H=225;
const image=()=>{
 const c=new Canvas(W,H),g=c.getContext('2d');
 g.fillStyle='#dbd7be';g.fillRect(0,0,W,H);
 g.fillStyle='#152c70';g.fillRect(45,31,76,170);
 g.fillStyle='#d64040';g.fillRect(206,24,125,82);
 g.fillStyle='#4b9f60';g.fillRect(207,130,112,67);return c;
};
const pixels=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const input='SALE | 30% OFF | VISIT TODAY',all=[];
for(const purpose of DESIGN_PURPOSES){
 const genome=newDesignGenome(purpose,414);
 const receipt=makeRecipe({subject:'coast',primary:'no_shading',
   mark:'hatch',seed:904,generation:1});
 const recipe={...receipt,purpose,designGenome:genome,typeGenome:typeGenome(20,'split')};
 const first=image(),second=image();
 const one=paintWordsOnCanvas(first,input,{recipe,seed:904,iteration:1});
 const two=paintWordsOnCanvas(second,input,{recipe,seed:904,iteration:1});
 assert.deepEqual(pixels(first),pixels(second),
   'The same copy + template + type + painting must reproduce exact pixels');
 assert.deepEqual(one,two);
 assert.ok(one.painted&&one.count>50);
 assert.ok(one.legibility>=0&&one.legibility<=1);
 assert.equal(one.design.purpose,purpose);
 assert.ok(one.typeAnatomy.includes('split'));
 if(purpose!=='art'){
  assert.equal(one.text,input,'Source copy is kept verbatim; no fake promotion generated');
  assert.equal(one.glyphs,input.replace(/\s*\|\s*/g,'').length,
   'Headline/detail/CTA have independently executed real glyphs');
  assert.ok(one.design.activity!==null);
  const region=designBounds(pixels(image()),W,H,genome,904);
  assert.ok(region.top>=0&&region.height>=20);
 }
 all.push(pixels(first));
}
assert.ok(!all[0].equals(all[1]));
assert.ok(!all[1].equals(all[2]));
assert.ok(!all[2].equals(all[3]));
const qualified={golden:{qualifies:true},threeWay:{score:.60},
 composite:{painted:true,legibility:.15}};
const readable={golden:{qualifies:true},threeWay:{score:.585},
 composite:{painted:true,legibility:.85}};
assert.equal(rankDesignCandidates([qualified,readable],
 {purpose:'promo'})[0].designJudgement.legibility,.85,
 'A readable real layout may defeat a slightly better raw W/phi/H score');
assert.equal(rankDesignCandidates([qualified,readable],
 {purpose:'art'})[0],qualified,
 'Default autonomous art must preserve the original scoring unchanged');
assert.equal(rankDesignCandidates([{...qualified,golden:{qualifies:true}},
 {...readable,golden:{qualifies:false}}],{purpose:'promo',strict:true})[0].
 golden.qualifies,true,'Strict golden qualification is authoritative');
const html=readFileSync('public/index.html','utf8');
const ctrl=readFileSync('public/studio/rule-studio.js','utf8');
const loop=readFileSync('public/studio/abstraction-loop.js','utf8');
assert.match(html,/id="rulePurpose"/);
assert.match(html,/value="promo"/);
assert.match(html,/value="advert"/);
assert.match(html,/value="logo"/);
assert.match(ctrl,/noteDesignVerdict\(current\.recipe\.designGenome,liked\)/);
assert.match(ctrl,/purpose:\$\('rulePurpose'\)\.value/);
assert.match(loop,/recipe\.designGenome=evolveDesignGenome/);
assert.match(loop,/rankDesignCandidates\(rankBalancedCandidates/);
assert.match(loop,/const composite=postProcess\(output,recipe,metrics/,
 'A purpose layout must be physically drawn before global artwork judgement');
console.log('331: graphic templates evolve in real raster, purpose-specific compositional geometry, preserved real copy, legible-ink ranking and deterministic repeat PASS');
