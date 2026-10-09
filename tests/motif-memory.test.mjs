/* Hexfield 310 — surviving physical motifs are not just a textual
 * genealogy. Actual captured pixels remain inside subsequent paintings.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Canvas}=require('skia-canvas');
globalThis.document={createElement(type){assert.equal(type,'canvas');return new Canvas(1,1);}};
const {findMotifRegion,captureMotif,paintHeldMotifs,advanceMotifMemory,
 motifEvidence,MOTIF_TTL,MAX_MOTIFS}=await import('../public/studio/motif-memory.js');
const image=(fill='#dedcd0')=>{
 const c=new Canvas(320,200),ctx=c.getContext('2d');ctx.fillStyle=fill;
 ctx.fillRect(0,0,320,200);return c;
};
const parent=image(),ctx=parent.getContext('2d');
ctx.fillStyle='#173956';ctx.fillRect(80,44,130,101);
ctx.fillStyle='#c65432';
for(let i=0;i<16;i++)ctx.fillRect(85+(i%4)*29,48+Math.floor(i/4)*23,11,9);
ctx.strokeStyle='#efbe4e';ctx.lineWidth=9;
ctx.beginPath();ctx.moveTo(90,130);ctx.lineTo(200,53);ctx.stroke();
const r1=findMotifRegion(parent,{seed:17});
const r2=findMotifRegion(parent,{seed:17});
assert.ok(r1&&r1.detail>.1);
assert.deepEqual(r1,r2,'Same seed and image identify the same motif island');
const patch=captureMotif(parent,{seed:17,cycle:1});
assert.ok(patch?.image);
assert.equal(patch.age,0);
assert.equal(patch.ttl,MOTIF_TTL);
const changed=image('#18a55b');
const before=changed.getContext('2d').getImageData(160,100,1,1).data;
const kept=paintHeldMotifs(changed,[patch],{cycle:2,opacity:1});
assert.equal(kept.held.length,1);
assert.ok(kept.coverage>.01&&kept.coverage<.35);
const middle=kept.held[0];
const sx=Math.floor(middle.x+middle.w/2),sy=Math.floor(middle.y+middle.h/2);
const now=changed.getContext('2d').getImageData(sx,sy,1,1).data;
const original=parent.getContext('2d').getImageData(sx,sy,1,1).data;
assert.ok([0,1,2].reduce((total,i)=>total+Math.abs(now[i]-original[i]),0)<30,
 'Protected centre must retain virtually the exact ancestor paint');
const outside=changed.getContext('2d').getImageData(0,0,1,1).data;
assert.deepEqual(Array.from(outside),Array.from(image('#18a55b').getContext('2d')
 .getImageData(0,0,1,1).data),'Unprotected regions must remain free to evolve');
let motifs=[];
motifs=advanceMotifMemory(motifs,parent,{seed:17,cycle:1,parent});
assert.equal(motifs.length,1);
const first=motifs[0].id;
for(let cycle=2;cycle<=7;cycle++){
 const out=image(cycle%2?'#325bcc':'#bc6943');
 paintHeldMotifs(out,motifs,{cycle});
 motifs=advanceMotifMemory(motifs,out,{seed:17+cycle,cycle,parent});
 assert.ok(motifs.length<=MAX_MOTIFS);
 assert.ok(motifs.some(m=>m.id===first),
  'Original discovered shape must survive through pass '+cycle);
}
assert.ok(motifs.length>=2,'Other motifs enter while the old one lives');
for(let cycle=8;cycle<=20;cycle++)
 motifs=advanceMotifMemory(motifs,image('#e4cfb3'),{seed:17+cycle,cycle,parent});
assert.ok(!motifs.some(m=>m.id===first),
 'Old motifs must eventually exit to make room for genuine novelty');
assert.ok(motifEvidence(motifs).every(x=>x.age<x.ttl));
console.log('Motif preservation: meaningful image feature selection, deterministic anchors, physical pixel survival, gradual entry/exit and bounded memory verified.');
