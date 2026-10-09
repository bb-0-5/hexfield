import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Simulate pre-DOM-ready browser import, so the module exposes its
// supplier allowlist without requiring a real user checkout.
let registered=false;
globalThis.document={readyState:'loading',
  addEventListener(type){if(type==='DOMContentLoaded')registered=true;}};
const {PRINT_SUPPLIERS,HANDOFF_POLICY,open}=await import('../public/print-handoff.js');
assert.equal(registered,true);
assert.equal(typeof open,'function');
assert.equal(HANDOFF_POLICY.hexfieldAcceptsPayment,false);
assert.equal(HANDOFF_POLICY.automaticFileTransfer,false);
assert.equal(HANDOFF_POLICY.buyerUploadsFile,true);
assert.equal(HANDOFF_POLICY.hexfieldCollectsShipping,false);
const providers=Object.values(PRINT_SUPPLIERS);
assert.equal(providers.length,2);
for(const vendor of providers){
  const url=new URL(vendor.url);
  assert.equal(url.protocol,'https:');
  assert.ok(['posterfactory.com.au','www.frameshop.com.au'].includes(url.hostname));
  assert.ok(vendor.name&&vendor.region&&vendor.description);
}
const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
for(const mode of ['rules','studio','imagination'])
 assert.ok(index.includes('data-au-print="'+mode+'"'),
   'Direct buyer-owned print option missing for '+mode);
assert.ok(index.includes('src="print-handoff.js"'));
const legacy=readFileSync(new URL('../public/legacy.html',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../public/hexfield-integrations.js',import.meta.url),'utf8');
assert.ok(legacy.includes('src="print-handoff.js"'),'The historical archive must load vendor referral UI');
assert.ok(bridge.includes('handoff.open("legacy")'),'The old Shopify/Stripe BUY button must redirect to direct printer workflow');
assert.ok(bridge.includes('event.stopImmediatePropagation()'),'Legacy Shopify listener must not create an order');
assert.ok(bridge.includes('if (!testing)'),'Live checkout must have the direct-printer path');
const ctrl=readFileSync(new URL('../public/studio/studio-controller.js',import.meta.url),'utf8');
assert.ok(ctrl.includes('globalThis.__hexfieldPrepareStudioPrint=prepareStudioPrintFile;'),
  'Procedural studies must use the existing genuine high-resolution renderer');
console.log('Australian direct printer handoff: no merchant account, no shipping capture, two supported providers, live Shopify suppression and all studio sources verified.');
