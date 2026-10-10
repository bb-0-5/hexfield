/* Hexfield 328 — paint with a new mark grammar WITHOUT throwing away
 * the composition the artist is actually working on.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {Canvas}=createRequire(import.meta.url)('skia-canvas');
globalThis.document={hidden:false,createElement(type){
 assert.equal(type,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const {styleRecipe}=await import('../public/studio/style-presets.js');
const {applyRules}=await import('../public/studio/rule-engine.js');
const {previewRestyling,conserveComposition,STRUCTURE_STRENGTH}=
 await import('../public/studio/style-preservation.js');
const W=240,H=160;
const fresh=()=>new Canvas(W,H);
const original=fresh(),ctx=original.getContext('2d');
ctx.fillStyle='#e8d9b3';ctx.fillRect(0,0,W,H);
ctx.fillStyle='#cc3622';ctx.fillRect(15,24,90,101);
ctx.fillStyle='#1376be';ctx.fillRect(128,53,75,77);
ctx.fillStyle='#3a993b';ctx.fillRect(68,123,45,25);
const pix=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const initial=pix(original);
function discrepancy(a,b,area){
 const first=pix(a),second=pix(b);let error=0;
 for(let y=area.y;y<area.y+area.h;y++)
  for(let x=area.x;x<area.x+area.w;x++){
   const index=(y*W+x)*4;
   for(let c=0;c<3;c++)error+=Math.abs(first[index+c]-second[index+c]);
  }
 return error/(area.w*area.h*3);
}
const edge={x:14,y:24,w:5,h:104};
const areas=[edge,{x:35,y:40,w:35,h:42},
 {x:142,y:68,w:26,h:30}];
assert.ok(STRUCTURE_STRENGTH.gentle>STRUCTURE_STRENGTH.balanced);
assert.equal(STRUCTURE_STRENGTH.wild,0);
let contrast=0;
for(const style of ['ink','stipple','poster','engrave','expression']){
 const recipe=styleRecipe({style,abstraction:'gentle',seed:550101,
  subject:'coast'});
 const naked=fresh();const met=applyRules(original,naked,recipe,{
  iteration:1,trace:true});
 const raw=fresh();raw.getContext('2d').drawImage(naked,0,0);
 const result=conserveComposition(original,naked,{level:'gentle'});
 assert.equal(result.applied,true);
 assert.ok(result.meanRetention>=STRUCTURE_STRENGTH.gentle);
 assert.ok(result.protectedEdges>0);
 assert.notDeepEqual(pix(naked),pix(raw),
  'LOW must physically restore some ORIGINAL pixels under new ink');
 assert.notDeepEqual(pix(naked),initial,
  'LOW must not simply return the original with no style change');
 for(const region of areas){
  assert.ok(discrepancy(original,naked,region)<
   discrepancy(original,raw,region)+.02,
   'Recognisable shapes must be measurably closer to the original than raw abstraction');
 }
 const replay=fresh();
 const replayMetrics=applyRules(original,replay,recipe,{
  iteration:1,trace:true});
 conserveComposition(original,replay,{level:'gentle'});
 assert.deepEqual(pix(replay),pix(naked),
  'Restyling same frozen composition, seed and style is pixel-exact');
 assert.deepEqual(met,replayMetrics,'Same physical stroke language must replay');
 const medium=fresh();medium.getContext('2d').drawImage(raw,0,0);
 conserveComposition(original,medium,{level:'balanced'});
 assert.ok(discrepancy(original,naked,edge)<=
  discrepancy(original,medium,edge)+.02,
  'LOW holds source outlines more tightly than MEDIUM');
 const wild=fresh();wild.getContext('2d').drawImage(raw,0,0);
 assert.equal(conserveComposition(original,wild,{level:'wild'}).applied,false);
 assert.deepEqual(pix(wild),pix(raw),
  'HIGH retains all evaluated abstract marks without conservative mixing');
 const unchanged=fresh();
 assert.equal(conserveComposition(null,unchanged).applied,false);
 if(style==='stipple')contrast=discrepancy(original,naked,areas[1]);
}
assert.ok(contrast>1,'A new style must visibly change the brush texture');
const blank=fresh();blank.getContext('2d').fillStyle='#eee8d3';
blank.getContext('2d').fillRect(0,0,W,H);
const progress=fresh();
const p0=previewRestyling(original,blank,progress,{
 completedRows:0,cell:9,level:'gentle'});
assert.equal(p0,true);
assert.deepEqual(pix(progress),initial,
 'The painting must NEVER be blanked while style construction begins');
previewRestyling(original,blank,progress,{
 completedRows:3,cell:9,level:'gentle'});
const part=pix(progress);
const lowY=H-4,lowX=50,lowIndex=(lowY*W+lowX)*4;
assert.deepEqual([...part.subarray(lowIndex,lowIndex+4)],
 [...initial.subarray(lowIndex,lowIndex+4)],
 'Only REAL executed brush rows may alter the displayed composition');
assert.notDeepEqual(part,initial,
 'Actual finished rows must become visible progressively');
const topIndex=(25*W+30)*4;
assert.notDeepEqual([...part.subarray(topIndex,topIndex+4)],
 [...initial.subarray(topIndex,topIndex+4)]);
console.log('328: non-destructive actual style changes, real outline retention, unchanged unpainted area, pixel-exact repeated methods and higher-abstraction freedom PASS');
