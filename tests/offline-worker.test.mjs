import assert from 'node:assert/strict';
import worker from '../worker.js';
const env={AI:{run(){throw Error('AI must not run')}},ASSETS:{fetch(){throw Error('Assets must not run')}}};
for (const path of ['/','/index.html','/studio.html','/legacy.html','/api/imagine','/api/imagine/status','/studio/rule-studio.js','/assets/anything']) {
  for (const method of ['GET','HEAD','POST']) {
    const res=await worker.fetch(new Request('https://hexfield.org'+path,{method}),env);
    assert.equal(res.status,404,method+' '+path);
    assert.equal(res.headers.get('X-Hexfield-Status'),'offline');
    assert.match(res.headers.get('Cache-Control'),/no-store/);
    const body=await res.text();
    if(method==='HEAD')assert.equal(body,'');else assert.match(body,/Hexfield is offline/);
  }
}
console.log('Hexfield shutdown PASS');
