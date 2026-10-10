import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
function visualDifference(left,right){
 const a=left.getContext('2d').getImageData(0,0,left.width,left.height).data;
 const b=right.getContext('2d').getImageData(0,0,right.width,right.height).data;
 let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
 return sum/(a.length*.75*255);
}
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,val)=>memory.set(key,String(val))};
globalThis.document={createElement(tag){assert.equal(tag,'canvas');return new Canvas(4,4);}};
const {LAWS,MARKS,makeRecipe,mutateRecipe,drawReality,applyRules,
 noteRuleVerdict,noteLineage,buildRulePrompt,validateRecipe,RULE_STORE}=await import('../public/studio/rule-engine.js');
assert.ok(Object.keys(LAWS).length>=10&&Object.keys(MARKS).length>=6);
assert.ok(MARKS.hybrid.includes('derived'));
const input=new Canvas(224,128);const g=input.getContext('2d');
g.fillStyle='#ff1010';g.fillRect(0,0,224,128);
const recipe=makeRecipe({subject:'sphere',primary:'blue_for_red',mark:'cutout',seed:19});
assert.equal(validateRecipe(recipe),true);
const output=new Canvas(224,128);
const result=applyRules(input,output,recipe);
assert.ok(result.strokes>100);
const pixel=output.getContext('2d').getImageData(20,20,1,1).data;
assert.ok(pixel[2]>pixel[0],'Red should be replaced with blue: '+[...pixel]);
const hybridRecipe=makeRecipe({subject:'sphere',primary:'no_curves',mark:'hybrid',seed:19});
const hybridCanvas=new Canvas(224,128);
const hybridContext=hybridCanvas.getContext('2d');
hybridContext.arc=()=>{throw Error('Hybrid attempted a forbidden curved mark');};
const hybridMetrics=applyRules(input,hybridCanvas,hybridRecipe,{iteration:3});
assert.equal(hybridMetrics.hybrid,true,'Hybrid execution must use the multi-mark painter');
assert.equal(hybridMetrics.noCurvedMarks,true);
assert.ok(visualDifference(input,hybridCanvas)>.02,'Hybrid painting must alter image pixels');
const dotRecipe=makeRecipe({subject:'sphere',primary:'no_curves',mark:'dots',seed:19});
const squareCanvas=new Canvas(224,128);
squareCanvas.getContext('2d').arc=()=>{throw Error('A curve was drawn despite no_curves law');};
const squareMetrics=applyRules(input,squareCanvas,dotRecipe);
assert.equal(squareMetrics.noCurvedMarks,true);
const contrast=new Canvas(224,128),cg=contrast.getContext('2d');
cg.fillStyle='#ddd9d2';cg.fillRect(0,0,224,128);cg.fillStyle='#182e49';cg.fillRect(120,0,104,128);
const neg=makeRecipe({subject:'room',primary:'negative_space',mark:'cutout',seed:19});
const erased=new Canvas(224,128);
const negMetrics=applyRules(contrast,erased,neg);
assert.equal(negMetrics.negativeSpace,true);
const left=erased.getContext('2d').getImageData(22,22,1,1).data;
const right=erased.getContext('2d').getImageData(160,22,1,1).data;
assert.notDeepEqual([...left],[...right],'Foreground must be excluded, not merely recoloured');
const scene=new Canvas(224,128);
drawReality(scene,'sphere',42);
const scene2=new Canvas(224,128);
drawReality(scene2,'bridge',42);
assert.notDeepEqual([...scene.getContext('2d').getImageData(70,70,1,1).data],
 [...scene2.getContext('2d').getImageData(70,70,1,1).data]);
const child=mutateRecipe(recipe,'law');
assert.equal(child.parentId,recipe.id);
assert.notEqual(child.primary,recipe.primary);
const repaint=new Canvas(224,128);
const rework=makeRecipe({subject:'sphere',primary:'opposite_bend',mark:'hatch',
 parentId:recipe.id,generation:1,rework:'abstract_masses',seed:recipe.seed});
applyRules(output,repaint,rework);
assert.notEqual(repaint.toBufferSync('png').toString('hex').slice(-300),
 output.toBufferSync('png').toString('hex').slice(-300),
 'Recursive paint must actually modify the previous image');
noteLineage(recipe);noteLineage(rework);
noteRuleVerdict(recipe,false,'too generic and repetitive colour');
noteRuleVerdict(rework,true,'interesting rule');
const stored=JSON.parse(memory.get(RULE_STORE));
assert.ok(stored.lineage.length===2);
assert.ok(stored.votes.length===2);
assert.ok(stored.weights['law:blue_for_red']<0);
assert.ok(buildRulePrompt(rework).includes('Mirrored coordinates bend'));
console.log('Executable rules, forbidden curves, red-to-blue substitution, negative space, recursive lineage and vote memory passed.');
