/* Build 325: real visual identity survives generations; no saved pixels or new UI.
 * Tests bounded colour inheritance, organic form survival, root continuity,
 * winner-only adoption, storage hardening, and neighbour relationship recall.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
const storage=new Map();
globalThis.document={hidden:false,createElement(tag){
 assert.equal(tag,'canvas');return new Canvas(1,1);
}};
globalThis.localStorage={
 getItem:k=>storage.get(k)||null,
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k)
};
const {
 createVisualIdentity,loadVisualIdentity,saveVisualIdentity,
 measureIdentityPalette,adoptVisualIdentity,
 identitySafeguards,inheritVisualIdentity,IDENTITY_KEY
}=await import('../public/studio/living-identity.js');
const {selectNegotiation,createCompositionMemory}=
 await import('../public/studio/composition-negotiation.js');
const {createRegionMemory}=await import('../public/studio/regional-judgement.js');
const W=360,H=240;
const scene=(shift=0)=>{
 const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#ded3b4';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#ca3937';ctx.fillRect(23+shift,21,100,88);
 ctx.fillStyle='#2775c7';ctx.fillRect(214+shift,81,99,121);
 ctx.fillStyle='#31a17e';ctx.fillRect(132,130,55,71);
 ctx.fillStyle='#513ba1';ctx.fillRect(90,186,110,23);
 return c;
};
const blank=()=>{const c=new Canvas(W,H),ctx=c.getContext('2d');
 ctx.fillStyle='#272933';ctx.fillRect(0,0,W,H);return c;
};
const bytes=c=>Buffer.from(c.getContext('2d',{willReadFrequently:true}).
 getImageData(0,0,W,H).data);
const parent=scene(),measured=measureIdentityPalette(parent);
assert.equal(measured.length,9);
assert.ok(measured.every(c=>c.length===3&&c.every(v=>v>=0&&v<=255)));
assert.notDeepEqual(measured[0],measured[8],
 'Measured identity palette must retain nine distinct spatial colours');
const empty=createVisualIdentity();
assert.equal(empty.root,null);
let life=adoptVisualIdentity(empty,parent);
assert.match(life.root,/^vision-[a-z0-9]+$/);
assert.equal(life.generation,1);
assert.equal(life.palette.length,9);
assert.ok(life.anchors.length>=1&&life.anchors.length<=2,
 'Root artwork should establish up to two enduring actual material forms');
assert.ok(life.anchors.every(a=>a.id.startsWith('form-')));
assert.ok(identitySafeguards(life).length>=1);
assert.equal(saveVisualIdentity(life),true);
assert.deepEqual(loadVisualIdentity(),life,
 'Only compact real visual lineage metadata is saved and restored');
const persisted=storage.get(IDENTITY_KEY);
assert.ok(persisted.length<2500,'Never store bitmaps or bulky per-pixel state');
assert.ok(!persisted.includes('data:image'));
const old=scene(0),child=scene(7);
const oldPosition=life.anchors[0].box.x,
 oldColour=life.palette[0][0],newColour=measureIdentityPalette(child)[0][0];
let next=adoptVisualIdentity(life,child,{
 composition:{accepted:true,from:'region-0-1',to:'region-1-1'}
});
assert.equal(next.root,life.root,'One visual identity must survive evolution');
assert.equal(next.generation,2);
assert.equal(next.anchors[0].id,life.anchors[0].id);
assert.ok(Math.abs(next.anchors[0].box.x-oldPosition)<.04,
 'Forms cannot teleport during a compositional mutation');
assert.ok(Math.abs(next.palette[0][0]-oldColour)<=
 Math.abs(newColour-oldColour)+1,
 'A new palette must adapt toward actual pixels without immediate replacement');
assert.equal(next.relations[0].from,'region-0-1');
const again=adoptVisualIdentity(next,child,{
 composition:{accepted:true,from:'region-0-1',to:'region-1-1'}
});
assert.equal(again.relations[0].count,2);
assert.equal(life.relations.length,0,
 'A losing candidate must not mutate earlier adopted visual memory');
assert.ok(again.anchors.every(a=>a.age>life.anchors[0].age));
const working=blank(),original=bytes(working),visible=[];
const summary=inheritVisualIdentity(working,old,life,{
 cycle:1,onStep:step=>visible.push(step)
});
assert.equal(summary.root,life.root);
assert.ok(summary.forms>0,'Previously accepted REAL pixels must physically recur');
assert.ok(summary.coverage<=.15);
assert.ok(visible.some(x=>x.type==='form'));
assert.notDeepEqual(bytes(working),original);
const after=bytes(working);
const at=(x,y)=>((y*W+x)*4);
const bottomRight=at(W-4,H-4);
assert.deepEqual([...after.subarray(bottomRight,bottomRight+4)],
 [...original.subarray(bottomRight,bottomRight+4)],
 'Unrelated parts of canvas must retain their actual candidate material');
const stop=blank(),saved=bytes(stop);
assert.equal(inheritVisualIdentity(stop,old,life,{locked:true}).forms,0);
assert.deepEqual(bytes(stop),saved,'Explicit artistic laws override identity');
assert.equal(inheritVisualIdentity(stop,old,life,{
 dirtyTiles:[{x:0,y:0,w:50,h:50}]}).forms,0);
assert.deepEqual(bytes(stop),saved,
 'Sparse rendering conservation must override identity copying');
const relationTarget=createRegionMemory();
const choice=selectNegotiation({canvas:old,memory:relationTarget,
 compositionMemory:createCompositionMemory(),identity:again});
assert.ok(choice&&choice.leader&&choice.follower,
 'Long-term relationships should be eligible in normal neighbour negotiation');
storage.set(IDENTITY_KEY,JSON.stringify({
 version:1,root:'../malformed',palette:measured,anchors:[],relations:[]
}));
assert.equal(loadVisualIdentity().root,null,
 'Malformed local storage must never become an accepted identity');
storage.set(IDENTITY_KEY,JSON.stringify({
 ...life,anchors:[{id:'form-0',box:{x:-5,y:0,w:10,h:10},ink:[1,2,3]}]
}));
assert.equal(loadVisualIdentity().anchors.length,0,
 'Untrusted impossible anchor geometry is refused');
console.log('325: persistent real-pixel form and measured nine-zone palette identity, slow morphing, historical treaties, sparse/lock protections and safe compact storage PASS');
