import assert from 'node:assert/strict';
import worker,{unpackModelPlan,apiImagination} from '../worker.js';
const site='https://hexfield.org';
const bearer='Bearer ey.test.token';
const request=(body,origin=site,authorization=bearer)=>new Request(site+'/api/imagine',{
  method:'POST',headers:{origin,authorization,'content-type':'application/json'},body:JSON.stringify(body)
});
const originalFetch=globalThis.fetch;
let quotaCalls=0,aiCalls=[];
globalThis.fetch=async (url,options)=>{
  assert.ok(String(url).includes('rpc/claim_hexfield_imagination'));
  assert.equal(options.headers.apikey.startsWith('sb_publishable_'),true);
  quotaCalls++;
  return Response.json(2);
};
const environment={AI:{async run(model,input){aiCalls.push({model,input});
  if(model.includes('llama-3.1-8b'))return {response:'{"title":"The copper salt flats","method":"impasto applied with a palette knife rather than digital gradients","prompt":"A vast salt flat through crystalline dust, viewed from ground level. Thick palette-knife oil paint, angular impasto pigment, fading eerie storm cloud formations, warm rusty colour on rough canvas."}'};
  assert.ok(input.multipart.body,'Multipart body must exist');
  assert.match(input.multipart.contentType,/multipart\/form-data; boundary=/);
  return {image:'SU1BR0VEQVRB'};
}}};
try{
  assert.equal(unpackModelPlan('bad','seashore',false).title,'An uncertain landscape');
  assert.equal((await apiImagination(request({request_id:crypto.randomUUID()},'https://evil.example'),environment)).status,403);
  assert.equal((await apiImagination(request({request_id:crypto.randomUUID()},site,'missing-token'),environment)).status,401);
  assert.equal(aiCalls.length,0);
  const id=crypto.randomUUID();
  const response=await worker.fetch(request({request_id:id,idea:'A flooded desert library',history:[{liked:false,critique:'Stop painting hills'}]}),environment);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.title,'The copper salt flats');
  assert.equal(result.credits_remaining,2);
  assert.equal(result.image,'data:image/png;base64,SU1BR0VEQVRB');
  assert.ok(result.prompt.includes('palette-knife'));
  assert.equal(quotaCalls,1);assert.equal(aiCalls.length,2);
  const edited=await worker.fetch(request({request_id:crypto.randomUUID(),idea:'A moonlit marsh',edit:true,
    image_b64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9UKIh+AAAAABJRU5ErkJggg=='}),environment);
  assert.equal(edited.status,200);
  assert.equal(aiCalls.length,4);
  const malformed=await worker.fetch(request({request_id:crypto.randomUUID(),edit:true,image_b64:'!!invalid!!'}),environment);
  assert.equal(malformed.status,400);
  assert.equal(quotaCalls,2,'Invalid inputs must not spend credits');
  const unavailable=await worker.fetch(request({request_id:crypto.randomUUID()}),{ASSETS:{fetch(){}}});
  assert.equal(unavailable.status,503);
  const status=await worker.fetch(new Request(site+'/api/imagine/status'),environment);
  assert.equal((await status.json()).ready,true);
  console.log('Worker security, bounded quota, image model and editing tests passed.');
}finally{globalThis.fetch=originalFetch;}
