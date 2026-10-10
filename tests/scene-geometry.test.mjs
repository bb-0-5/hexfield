/* Hexfield 316 — structural collision proof: do word outlines move actual
 * scene geometry and do scene edges in turn change letter outlines?
 * No screenshot mockups or external models. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Canvas}=require('skia-canvas');
const store=new Map();
globalThis.localStorage={
  getItem:key=>store.get(key)||null,
  setItem:(key,value)=>store.set(key,String(value))
};
globalThis.document={createElement(type){assert.equal(type,'canvas');return new Canvas(1,1)}};
const {GEOMETRY_RELATIONS,chooseGeometryRelation,noteGeometryVerdict,
  geometryTaste,coupleWordGeometry}=await import('../public/studio/geometry-coupling.js');
const {paintWordsOnCanvas}=await import('../public/studio/word-surface.js');
const {makeRecipe}=await import('../public/studio/rule-engine.js');
const W=240,H=150;
const source=new Uint8ClampedArray(W*H*4),letters=new Uint8ClampedArray(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const i=(y*W+x)*4;
  const block=(Math.floor(x/8)+Math.floor(y/8))%3;
  const col=block===0?[212,57,45]:block===1?[22,82,182]:[235,218,84];
  for(let c=0;c<3;c++)source[i+c]=col[c];
  source[i+3]=255;
  if(x>52&&x<183&&y>53&&y<98&&!(x>104&&x<125&&y>69&&y<85)){
    letters[y*W+x]=255;
  }
}
const original=new Uint8ClampedArray(source),oldMask=new Uint8ClampedArray(letters);
let allSceneShifts=0,occlusions=0,grafts=0;
for(const relation of GEOMETRY_RELATIONS){
  const a=coupleWordGeometry(source,letters,W,H,{
    seed:340,relation,bounds:{top:48,height:60},size:32
  });
  const b=coupleWordGeometry(source,letters,W,H,{
    seed:340,relation,bounds:{top:48,height:60},size:32
  });
  assert.deepEqual(a.stats,b.stats,relation+' must be reproducible');
  assert.deepEqual(a.scene,b.scene);
  assert.deepEqual(a.mask,b.mask);
  assert.equal(a.stats.relation,relation);
  assert.ok(a.stats.contactPixels>10,relation+' must measure actual scene/letter intersections');
  assert.ok(a.stats.sceneEdges>100);
  let outsideChanged=0;
  for(let p=0;p<W*H;p++){
    const i=p*4;
    if(letters[p]===0&&(
       Math.abs(a.scene[i]-source[i])+
       Math.abs(a.scene[i+1]-source[i+1])+
       Math.abs(a.scene[i+2]-source[i+2])>18))outsideChanged++;
  }
  assert.ok(outsideChanged>0,
    relation+' must physically displace some source pixels OUTSIDE the letters');
  allSceneShifts+=a.stats.displacedPixels;
  occlusions+=a.stats.occludedPixels;
  grafts+=a.stats.graftedPixels;
  for(let y=0;y<32;y++){
    const p=(y*W+15)*4;
    assert.equal(a.scene[p],source[p],'Geometry must not redraw the entire artwork');
  }
}
assert.ok(allSceneShifts>30,'Source geometry must flow around the letter, not remain wallpaper');
assert.ok(occlusions>0,'Scene contours must genuinely occlude ink and produce interleaving');
assert.ok(grafts>0,'Glyph contour and scene contour must physically join');
assert.deepEqual(source,original,'Source pixels are immutable inputs');
assert.deepEqual(letters,oldMask,'Source glyphs are immutable inputs');
const flat=new Uint8ClampedArray(W*H*4);
for(let p=0;p<W*H;p++){flat[p*4]=196;flat[p*4+1]=196;flat[p*4+2]=196;flat[p*4+3]=255;}
const still=coupleWordGeometry(flat,letters,W,H,{
 seed:100,relation:'repel',bounds:{top:48,height:60},size:32
});
assert.equal(still.stats.sceneEdges,0);
assert.equal(still.stats.displacedPixels,0,
 'Without real scene edges there is nothing to push around');
for(let i=0;i<9;i++)noteGeometryVerdict('repel',false);
assert.ok(geometryTaste().repel<=-9);
assert.notEqual(chooseGeometryRelation(13,5,'repel',0),'repel',
 'Highly disliked applications must not be forcibly inherited');
for(let i=0;i<8;i++)noteGeometryVerdict('thread',true);
assert.ok(geometryTaste().thread>=8);
const methods=new Set();
for(let i=0;i<150;i++)methods.add(chooseGeometryRelation(i*97,i%9,null,i%3));
assert.ok(methods.size>=4,'Automatic generation must still explore relationship families');
assert.equal(chooseGeometryRelation(731,3,'thread',0),'thread',
 'A liked method should survive as a parent candidate');
const make=()=>{
 const c=new Canvas(360,220),g=c.getContext('2d');
 g.fillStyle='#e0c7a6';g.fillRect(0,0,360,220);
 for(let j=0;j<35;j++){
   g.fillStyle=j%2?'#1861ae':'#e56a2a';
   g.fillRect(j*11,45+Math.round(Math.sin(j*.4)*16),9,120);
 }
 return c;
};
const a=make(),b=make(),parent=make();
const recipe=makeRecipe({seed:992,subject:'abstract',
  primary:'no_curves',mark:'invented',wordRelation:'braid'});
const applied=paintWordsOnCanvas(a,'INTERACT',{recipe,seed:992,iteration:3});
const applied2=paintWordsOnCanvas(b,'INTERACT',{recipe,seed:992,iteration:3});
assert.equal(applied.interaction.relation,'braid');
assert.ok(applied.interaction.contactPixels>0);
assert.ok(applied.interaction.bentPixels>0,
 'Real source edges must change the glyph mask geometry');
assert.ok(applied.interaction.displacedPixels>0,
 'The word must push actual background image pixels');
assert.deepEqual(a.getContext('2d').getImageData(0,0,360,220).data,
 b.getContext('2d').getImageData(0,0,360,220).data);
assert.notDeepEqual(a.getContext('2d').getImageData(0,0,360,220).data,
 parent.getContext('2d').getImageData(0,0,360,220).data);
const sources=readFileSync('public/studio/abstraction-loop.js','utf8');
assert.match(sources,/interaction:composite\?\.interaction/,
 'The ranker must include coupled geometry in method provenance');
assert.match(sources,/wordRelation=chooseGeometryRelation/,
 'Actual relation programs must be inherited and rivalled');
const style=readFileSync('public/index.html','utf8');
assert.doesNotMatch(style,/data-mode="/,'There must still be only one primary canvas');
console.log('316: two-way scene geometry and word interaction / six relations / chromatic painting / taste heredity PASS');
