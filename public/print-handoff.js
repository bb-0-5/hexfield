/* Hexfield 306: the printer is the seller; Hexfield only prepares artwork.
 * No sale, payment collection, customer data, supplier orders, or automated
 * artwork transfer. Direct AU print sites currently require buyer file upload.
 */
export const PRINT_SUPPLIERS=Object.freeze({
  poster:{name:'PosterFactory',region:'Marrickville NSW',
    url:'https://posterfactory.com.au/product/custom-prints/',
    description:'Custom art paper, posters, and sizes; upload and pay at PosterFactory.'},
  framed:{name:'Frameshop',region:'Roselands NSW',
    url:'https://www.frameshop.com.au/shop/photo-printing/fine-art-prints',
    description:'Fine art paper and framing options; upload and pay at Frameshop.'}
});
export const HANDOFF_POLICY=Object.freeze({
  seller:'independent Australian printer',hexfieldAcceptsPayment:false,
  automaticFileTransfer:false,buyerUploadsFile:true,hexfieldCollectsShipping:false
});
const $=id=>document.getElementById(id);
let dialog=null,mode='studio',busy=false;
function mount(){
 if(dialog)return;
 const css=document.createElement('style');css.textContent=[
 '#auPrintDialog{position:fixed;max-width:min(530px,calc(100vw - 22px));width:530px;max-height:86vh;overflow:auto;border:1px solid #92a88e;background:#19251f;color:#ecf0e3;padding:22px;font:13px/1.55 Arial,sans-serif;box-shadow:0 20px 90px #0009}',
 '#auPrintDialog::backdrop{background:#000b}',
 '#auPrintDialog h2{font:normal 30px/1.15 Georgia,serif;margin:9px 35px 13px 0;color:#f3ead4}',
 '#auPrintClose{float:right;background:none;color:#d6e8dc;border:1px solid #87a98c;cursor:pointer;padding:6px 10px}',
 '#auPrintDialog .au-eyebrow{color:#b3dac0;font:bold 10px Arial;letter-spacing:.13em;margin:0}',
 '#auPrintDialog p{margin:12px 0;line-height:1.55}',
 '#auPrintDialog .au-printers{display:grid;gap:8px;margin:14px 0}',
 '#auPrintDialog [data-au-supplier]{background:#d5e8d0;color:#1d3225;border:0;text-align:left;padding:13px;cursor:pointer}',
 '#auPrintDialog [data-au-supplier]:last-child{background:#efe2c7}',
 '#auPrintDialog [data-au-supplier] strong,#auPrintDialog [data-au-supplier] span{display:block}',
 '#auPrintDialog [data-au-supplier] span{font-size:11px;margin-top:4px}',
 '#auPrintDialog [data-au-supplier]:disabled{opacity:.45;cursor:wait}',
 '#auPrintArchiveChoice{display:flex;align-items:start;gap:9px;margin:15px 0;color:#e5d7ba;font-size:12px}',
 '#auPrintArchiveChoice input{flex:none;width:16px;height:16px}',
 '#auPrintStatus{color:#f0dcb2;white-space:pre-line;overflow-wrap:anywhere}',
 '#auPrintStatus a{color:#b4e4bf}',
 '#auPrintFootnote{font-size:11px;color:#b5c0b6;border-top:1px solid #647565;padding-top:12px}',
 '.au-print-cta{display:flex;flex-direction:column;gap:5px;margin:12px 0}',
 '.au-print-cta p{font:11px/1.5 Arial,sans-serif;color:#99b4a7;margin:0}',
 '.au-print-cta button{min-height:40px}',
 '@media(max-width:640px){#auPrintDialog{padding:18px 14px}#auPrintDialog h2{font-size:26px}}'
 ].join('');document.head.append(css);
 dialog=document.createElement('dialog');dialog.id='auPrintDialog';
 dialog.setAttribute('aria-label','Print directly with an Australian manufacturer');
 dialog.innerHTML=[
 '<button id="auPrintClose" type="button" aria-label="Close">✕</button>',
 '<p class="au-eyebrow">HEXFIELD → AUSTRALIAN PRINT MANUFACTURER</p>',
 '<h2>Take this artwork straight to a printer.</h2>',
 '<p>Hexfield prepares your PNG. You buy directly from an independent Australian printer. The printer takes your payment and address, manufactures, ships and handles your order.</p>',
 '<div class="au-printers">',
 '<button type="button" data-au-supplier="poster"><strong>PRINT ON PAPER ↗</strong><span>PosterFactory · Custom fine art or poster print</span></button>',
 '<button type="button" data-au-supplier="framed"><strong>PRINT &amp; FRAME ↗</strong><span>Frameshop · Fine art printing and framing</span></button>',
 '</div>',
 '<label id="auPrintArchiveChoice" hidden><input type="checkbox" id="auPrintOriginal" checked> Use the archival high-resolution original instead of the lower-resolution rule overlay.</label>',
 '<p id="auPrintStatus" role="status" aria-live="polite">Choose your printer; the print file will download to your device. Upload it on the printer website to complete the purchase.</p>',
 '<p id="auPrintFootnote">No file is secretly sent to a printer, and no order is placed on Hexfield. The Australian sites currently require you to upload the downloaded artwork.</p>'
 ].join('');
 document.body.append(dialog);
 $('auPrintClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
   const b=event.target.closest?.('[data-au-supplier]');
   if(b)void handOff(b.dataset.auSupplier);
 });
 for(const b of document.querySelectorAll('[data-au-print]'))
   b.addEventListener('click',()=>open(b.dataset.auPrint));
}
function setStatus(message){$('auPrintStatus').textContent=message;}
async function pngCanvas(canvas){
 if(!canvas?.width||!canvas?.height)throw Error('Make a painting first.');
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('Could not encode the artwork as a PNG.');
 return {blob,width:canvas.width,height:canvas.height};
}
async function prepare(){
 if(mode==='legacy'){
   const overlay=$('legacyRuleCanvas');
   if($('auPrintOriginal')?.checked===false&&overlay&&overlay.style.display!=='none'){
     return {...await pngCanvas(overlay),name:'hexfield-ruled-archive.png'};
   }
   if(typeof renderPrintBlob!=='function'||typeof FORMATS!=='object')
     throw Error('The original archive print renderer has not initialized.');
   const chosen=$('format')?.value||'print',format=FORMATS[chosen]||FORMATS.print;
   if(!format)throw Error('Select an artwork print format.');
   const blob=await renderPrintBlob(format);
   if(!blob)throw Error('The archival print could not be rendered.');
   return {blob,width:format.ew||0,height:format.eh||0,
     name:'hexfield-archive-'+chosen+'.png'};
 }
 if(mode==='rules'){
   const raw=$('ruleArtwork');
   if(!raw||raw.hidden)throw Error('Generate a painting in RULES first.');
   // PosterFactory rejects files with either dimension below 1000 pixels.
   // Pixel resizing is only compatibility; it never invents print detail.
   const resized=document.createElement('canvas');
   resized.width=2400;resized.height=1500;
   const ctx=resized.getContext('2d');ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';ctx.drawImage(raw,0,0,resized.width,resized.height);
   return {...await pngCanvas(resized),sourceWidth:raw.width,sourceHeight:raw.height,
     name:'hexfield-rules-print.png'};
 }
 if(mode==='imagination'){
   const img=$('imaginePicture');
   if(!img?.complete||!img.naturalWidth)throw Error('Generate an image in IMAGINE first.');
   const out=document.createElement('canvas');out.width=img.naturalWidth;out.height=img.naturalHeight;
   out.getContext('2d').drawImage(img,0,0);
   return {...await pngCanvas(out),name:'hexfield-imagination-print.png'};
 }
 if(mode==='studio'){
   if(typeof globalThis.__hexfieldPrepareStudioPrint!=='function')
     throw Error('High-resolution procedural export is not ready.');
   return await globalThis.__hexfieldPrepareStudioPrint();
 }
 throw Error('Unknown painting type');
}
function saveFile({blob,name}){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name||'hexfield-artwork.png';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),75000);
}
async function handOff(key){
 const supplier=PRINT_SUPPLIERS[key];if(!supplier||busy)return;
 busy=true;const controls=[...dialog.querySelectorAll('[data-au-supplier]')];
 controls.forEach(x=>x.disabled=true);
 // Open synchronously before artwork conversion, for mobile popup blockers.
 let tab=null;try{tab=window.open('about:blank','_blank');if(tab)tab.opener=null;}catch{}
 try{
   setStatus('Preparing actual artwork PNG for direct purchase at '+supplier.name+'…');
   const artwork=await prepare();
   saveFile(artwork);
   const low=Math.min(artwork.sourceWidth||artwork.width||0,
     artwork.sourceHeight||artwork.height||0)<1600;
   setStatus('PNG saved: '+artwork.name+' · '+artwork.width+' × '+artwork.height+
     ' pixels.\n'+(artwork.sourceWidth?'Note: enlarged from '+artwork.sourceWidth+
     ' × '+artwork.sourceHeight+' pixels, which does not add original detail.\n':'')+
     (low?'Source detail is limited: choose a modest print size and check the printer’s resolution warning.\n':'')+
     'Upload this PNG at '+supplier.name+'. They will show their prices, take payment and ship.');
   if(tab&&!tab.closed)tab.location.replace(supplier.url);
   else{
     const link=document.createElement('a');
     link.href=supplier.url;link.target='_blank';link.rel='noopener noreferrer';
     link.textContent='Open '+supplier.name+' to upload the image ↗';
     $('auPrintStatus').append(document.createElement('br'),link);
   }
 }catch(error){
   if(tab&&!tab.closed)try{tab.close();}catch{}
   setStatus('Print preparation failed: '+String(error?.message||error)+
     '. Use EXPORT PNG, then upload the file directly at the printer website.');
 }finally{busy=false;controls.forEach(x=>x.disabled=false);}
}
export function open(nextMode='studio'){
 mount();mode=nextMode;
 const overlay=$('legacyRuleCanvas');
 const active=nextMode==='legacy'&&overlay&&overlay.style.display!=='none';
 $('auPrintArchiveChoice').hidden=!active;
 if(active)$('auPrintOriginal').checked=true;
 setStatus('Select an Australian printer. Hexfield downloads the PNG to your device; you upload it to their checkout. All payment, delivery and order support happen on the printer website.');
 if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
 else dialog.setAttribute('open','');
}
globalThis.HexfieldPrintHandoff={open,suppliers:PRINT_SUPPLIERS};
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
