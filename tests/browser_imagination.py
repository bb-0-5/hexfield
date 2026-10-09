from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image,ImageDraw
from io import BytesIO
import base64,re,json,sys
root=Path(__file__).resolve().parents[1]/'public'
img=Image.new('RGB',(400,300),'#d6c3b0');ImageDraw.Draw(img).polygon([(0,260),(150,20),(400,250)],fill='#2d6a6a');bio=BytesIO();img.save(bio,format='PNG');encoded=base64.b64encode(bio.getvalue()).decode()
s=(root/'index.html').read_text();s=re.sub(r'<script[^>]+src="studio/studio-controller\.js"[^>]*></script>','',s)
s=re.sub(r'<link[^>]+stylesheet[^>]*>','',s)
js_names=['evolution.js','vision.js','landscape.js','lettering.js','imagination.js','studio-controller.js']
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1250,'height':900})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(s)
 page.add_style_tag(content=(root/'studio/studio.css').read_text())
 page.evaluate('''(encoded)=>{
 window._CALLS=[];window._SAVE=[];
 const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return storage.has(k)?storage.get(k):null},setItem(k,v){storage.set(k,String(v))},removeItem(k){storage.delete(k)}}});
 let i=0;Object.defineProperty(window.crypto,'randomUUID',{configurable:true,value:()=>`11111111-2222-4333-8444-${String(++i).padStart(12,'0')}`});
 const fakeImage='data:image/png;base64,'+encoded;
 window.fetch=async function(input,options={}){
  const u=String(input);
  if(u.includes('/api/imagine')){
    const b=JSON.parse(options.body);window._CALLS.push(b);
    return new Response(JSON.stringify({image:fakeImage,title:'A tidal library of stone',method:'Layered woven oil on black ground',prompt:'Model invented image '+window._CALLS.length,credits_remaining:3-window._CALLS.length}),{status:200,headers:{'content-type':'application/json'}});
  }
  if(u.includes('signup')||u.includes('grant_type=refresh_token'))return new Response(JSON.stringify({access_token:'FAKE.JWT',expires_at:9999999999,user:{id:'a4c4ddcd-0011-4223-aabb-bb4455667788'}}),{status:200,headers:{'content-type':'application/json'}});
  if(u.includes('hexfield_imagination_feedback')){
    if(options.method==='POST'){window._SAVE.push(JSON.parse(options.body));return new Response('{}',{status:201});}
    return new Response('[]',{status:200,headers:{'content-type':'application/json'}});
  }
  return new Response('[]',{status:200,headers:{'content-type':'application/json'}});
 }
 }''',encoded)
 # Blob module translation from imported .js refs to preconstructed blob URLs.
 for name in js_names:
  script=(root/'studio'/name).read_text()
  page.evaluate(r'''(args)=>{
   const [name,src]=args;
   const transformed=src.replaceAll(/(['"])\.\/([\w-]+\.js)\1/g,(_,q,filename)=>q+(window._MODULES?.[filename]||'./'+filename)+q);
   window._MODULES ||= {}; window._MODULES[name]=URL.createObjectURL(new Blob([transformed],{type:'text/javascript'}));
  }''',[name,script])
 page.evaluate('''async()=>{await import(window._MODULES['studio-controller.js']);}''')
 assert page.locator('#imaginationWorkspace').is_visible(), 'imagination not selected by default'
 assert page.locator('#proceduralWorkspace').is_hidden()
 assert page.locator('#imagineEmpty').is_visible()
 print('default imagination is visible')
 page.locator('#imagineIdea').fill('An abandoned glasshouse in a coastal storm')
 page.locator('#imaginePaint').click()
 page.wait_for_function('!document.getElementById("imaginePicture").hidden && !document.getElementById("imaginePaint").disabled',timeout=15000)
 assert 'tidal' in page.locator('#imagineTitle').inner_text().lower()
 print('first imagined image displayed:',page.locator('#imagineTitle').inner_text())
 page.locator('[data-critique="Generic and predictable"]').click()
 page.locator('#imagineReject').click()
 assert 'REJECTED' in page.locator('#imagineStatus').inner_text()
 page.locator('#imaginePaint').click()
 page.wait_for_function('!document.getElementById("imaginePaint").disabled',timeout=15000)
 calls=page.evaluate('window._CALLS');assert len(calls)==2, calls
 assert calls[-1]['history'][-1]['liked'] is False
 assert 'Generic' in calls[-1]['history'][-1]['critique']
 print('second model call received criticism:',calls[-1]['history'][-1]['critique'])
 page.locator('#imagineKeep').click()
 page.wait_for_function('window._SAVE.length >=2',timeout=8000)
 print('privacy-safe feedback uploads:',len(page.evaluate('window._SAVE')))
 page.locator('#imagineRevise').click()
 page.wait_for_function('!document.getElementById("imaginePaint").disabled',timeout=15000)
 calls=page.evaluate('window._CALLS');assert calls[-1]['edit'] is True and len(calls[-1]['image_b64'])>100
 print('edit submitted original scaled image bytes',len(calls[-1]['image_b64']))
 page.locator('[data-mode="landscape"]').click()
 page.wait_for_function('!document.getElementById("keep").disabled',timeout=30000)
 print('procedural fallback ready')
 page.locator('[data-mode="lettering"]').click()
 page.wait_for_function('!document.getElementById("keep").disabled',timeout=20000)
 print('logo mode ready')
 page.locator('[data-mode="imagination"]').click()
 assert page.locator('#imaginationWorkspace').is_visible()
 page.screenshot(path=str(root.parent/'browser_studio.png'),full_page=True)
 print('BROWSER PAGE ERRORS',errors)
 assert not errors,errors
 browser.close()
