/* Hexfield Build 303 — interoperate with every available painter.
 * Canvas pixel interchange is deliberately independent from each painter's
 * private procedure graph. Cloud AI is READ ONLY here: no automatic inferences.
 */
import {drawReality} from './rule-engine.js';
import {renderLandscape,SCENES,MOODS} from './landscape.js';
import {renderLettering} from './lettering.js';
import {makeGenome} from './evolution.js';

export const SOURCE_KEYS = [
  'parent','reality','terrain','lettering','archive','imagination','upload','kept'
];
export const MIX_METHODS = {
  auto:'Evolve composition',quilt:'Spatial quilt / every renderer',
  cutaway:'Negative-space cutaways',dissonance:'Channel disagreement',
  relief:'One renderer displaces another',edges:'Edge-directed repaint'
};
export const CROSS_STUDIO_KEYS = Object.freeze({
  archive:'hexfield.archive.rule.source.v1',
  rules:'hexfield.rule-studio.source.v1'
});
const WIDTH=720,HEIGHT=450;
const pick=(a,i)=>a[(Math.abs(i)|0)%a.length];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const randint=n=>Math.floor(Math.random()*n);
const canvasOf=(w=WIDTH,h=HEIGHT)=>{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;
};
const own=(ob,key)=>Object.prototype.hasOwnProperty.call(ob,key);
export function cloneCanvas(source,w=WIDTH,h=HEIGHT){
  const c=canvasOf(w,h);const ctx=c.getContext('2d');
  ctx.fillStyle='#eee8dc';ctx.fillRect(0,0,w,h);
  if(source)ctx.drawImage(source,0,0,w,h);
  return c;
}
function memoryImage(key){
  try{
    const record=JSON.parse(localStorage.getItem(key)||'null');
    if(record&&typeof record.image==='string'&&record.image.startsWith('data:image/')&&record.image.length<650000)return record.image;
  }catch{}
  return null;
}
function decode(url){
  return new Promise(resolve=>{
    if(!url)return resolve(null);
    const img=new Image();
    const timeout=setTimeout(()=>resolve(null),11000);
    img.onload=()=>{clearTimeout(timeout);resolve(img);};
    img.onerror=()=>{clearTimeout(timeout);resolve(null);};
    img.src=url;
  });
}
async function storedImagination(){
  if(typeof indexedDB==='undefined')return null;
  let db;
  try{
    db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open('hexfield-imagination-images-v1');
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      req.onupgradeneeded=()=>{ /* Avoid creating a second store on old user devices. */ };
    });
    if(!db.objectStoreNames.contains('artwork'))return null;
    const row=await new Promise((resolve,reject)=>{
      const t=db.transaction('artwork','readonly'),q=t.objectStore('artwork').get('latest');
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    return typeof row?.image==='string'&&row.image.length<5000000?row.image:null;
  }catch{return null}finally{try{db?.close()}catch{}}
}
export async function loadCachedPictures(){
  const [a,b,c]=await Promise.all([
    decode(memoryImage(CROSS_STUDIO_KEYS.archive)),
    decode(memoryImage(CROSS_STUDIO_KEYS.rules)),
    storedImagination().then(decode)
  ]);
  const bank={};
  if(a)bank.archive=a;
  if(b)bank.kept=b;
  if(c)bank.imagination=c;
  return bank;
}
export function publishSource(canvas,key,recipe=null){
  if(!canvas||!key)return false;
  const name=CROSS_STUDIO_KEYS[key];if(!name)return false;
  try{
    const scaled=cloneCanvas(canvas,360,225);
    localStorage.setItem(name,JSON.stringify({image:scaled.toDataURL('image/webp',.60),
      recipe:recipe?{id:recipe.id,parentId:recipe.parentId,primary:recipe.primary,mark:recipe.mark}:null,
      updated:Date.now()}));
    return true;
  }catch{return false}
}
export function createSourceBank({width=WIDTH,height=HEIGHT,getArchive=()=>null,getUploaded=()=>null,getParent=()=>null}={}){
  let cached={};let refreshCount=0;
  let busy=false;
  async function refresh(seed=1,subject='coast',{force=false}={}){
    if(busy)return cached;
    busy=true;
    try{
      // Other modes never have to rerender during every 1.5-second interval.
      if(force||refreshCount%7===0||!cached.terrain){
        const land=canvasOf(width,height),which=SCENES[Math.abs(seed)%SCENES.length],
          mood=MOODS[Math.abs(Math.floor(seed/7))%MOODS.length];
        await renderLandscape(land,{mode:'landscape',seed,scene:which,mood,
          genome:makeGenome('landscape',seed)}, {animate:false,quality:.24});
        cached.terrain=land;
        const lettering=canvasOf(width,height);
        renderLettering(lettering,{mode:'lettering',seed:seed+53,text:'HEXFIELD',
          type:'wordmark',style:['geometric','experimental','heavy'][Math.abs(seed)%3],
          genome:makeGenome('lettering',seed+53)});
        cached.lettering=lettering;
      }
      const reality=canvasOf(width,height);
      drawReality(reality,subject,seed+10);
      cached.reality=reality;
      const archive=getArchive();
      if(archive)cached.archive=cloneCanvas(archive,width,height);
      const uploaded=getUploaded();
      if(uploaded)cached.upload=cloneCanvas(uploaded,width,height);
      const persisted=await loadCachedPictures();
      for(const [key,image] of Object.entries(persisted)){
        // A live archive canvas is fresher than its last stored snapshot.
        if(key==='archive'&&archive)continue;
        cached[key]=cloneCanvas(image,width,height);
      }
      refreshCount++;
      return cached;
    }finally{busy=false;}
  }
  function sources(parent=null){
    const all={...cached},live=getArchive(),upload=getUploaded();
    if(live)all.archive=cloneCanvas(live,width,height);
    if(upload)all.upload=cloneCanvas(upload,width,height);
    const previous=parent||getParent();
    if(previous)all.parent=cloneCanvas(previous,width,height);
    return Object.entries(all).filter(([name,canvas])=>
      SOURCE_KEYS.includes(name)&&canvas?.getContext&&canvas.width>0&&canvas.height>0)
      .map(([name,canvas])=>({name,canvas}));
  }
  return {refresh,sources,
    clear(){cached={};refreshCount=0;},
    available(){return Object.keys(cached).filter(x=>SOURCE_KEYS.includes(x));}};
}
const hash=(x,y,seed)=>{
  let n=(Math.imul(x+11,73856093)^Math.imul(y+101,19349663)^Math.imul(seed+1,83492791))>>>0;
  n^=n>>>13;n=Math.imul(n,1274126177);return (n^(n>>>16))>>>0;
};
const intensity=(data,i)=>Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);
export function mixSources(inputs,{width=WIDTH,height=HEIGHT,cycle=0,mode='auto',seed=1}={}){
  if(!Array.isArray(inputs)||inputs.length<1)throw Error('Mixer requires at least one rendered source');
  const usable=inputs.filter(s=>s?.canvas?.getContext).slice(0,10);
  if(!usable.length)throw Error('No valid rendered sources');
  const sample=usable.map(({name,canvas})=>{
    const sheet=cloneCanvas(canvas,width,height),context=sheet.getContext('2d',{willReadFrequently:true});
    return {name,data:context.getImageData(0,0,width,height).data};
  });
  // Ensure the recursive previous frame and every available renderer have a
  // real chance to influence the picture. This is not a mode-selection lottery.
  const parent=sample.find(s=>s.name==='parent')||sample[0];
  const donors=sample.filter(s=>s!==parent);
  const active=mode==='auto'?pick(['quilt','cutaway','dissonance','relief','edges'],cycle):mode;
  const canvas=canvasOf(width,height);
  const ctx=canvas.getContext('2d'),out=ctx.createImageData(width,height);
  const d=out.data,prev=parent.data;
  const pool=donors.length?donors:[parent];
  const cell=clamp(Math.floor(Math.min(width,height)/(5+cycle%4)),18,86);
  const ncols=Math.ceil(width/cell);
  let sampled=0,cut=0;
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      const i=(y*width+x)*4;
      const gx=Math.floor(x/cell),gy=Math.floor(y/cell);
      const tile=(gy*ncols+gx+cycle+seed)%pool.length;
      const a=pool[tile];
      const b=pool[(tile+1+cycle%Math.max(1,pool.length))%pool.length];
      let bi=i,pi=i,ai=i;
      const useEdge=(buffer,index)=>{
        const above=index>=width*4?index-width*4:index;
        const left=index>=4?index-4:index;
        return clamp((Math.abs(intensity(buffer,index)-intensity(buffer,above))+
          Math.abs(intensity(buffer,index)-intensity(buffer,left)))*2,0,255);
      };
      if(active==='relief'){
        const light=intensity(b.data,i);
        const shift=Math.round(((light-128)/128)*cell*.55);
        const xx=clamp(x+shift,0,width-1),yy=clamp(y-shift,0,height-1);
        ai=(yy*width+xx)*4;
      }
      if(active==='edges'){
        const edge=useEdge(b.data,i);
        if(edge>65){bi=i;sampled++}
        else bi=(y*width+clamp(x+Math.round(Math.sin(y*.03+cycle)*cell*.4),0,width-1))*4;
      }
      const l=intensity(prev,i),la=intensity(a.data,ai),lb=intensity(b.data,bi);
      const slice=(gx+gy*3+cycle)%4;
      for(let channel=0;channel<3;channel++){
        const va=a.data[ai+channel],vb=b.data[bi+channel],vp=prev[i+channel];
        let colour;
        if(active==='quilt'){
          // Tiles are sourced from every renderer; each has a translucent
          // contribution from the previously painted canvas.
          colour=va*.69+vp*.31;
          if(slice===3)colour=va*.43+vb*.34+vp*.23;
        }else if(active==='cutaway'){
          const background=la>135;
          colour=background?va*.78+vp*.22:vb*.63+vp*.37;
          if(!background)cut++;
        }else if(active==='dissonance'){
          colour=channel===0?va*.84+vp*.16:
            channel===1?vp*.68+vb*.32:
            vb*.84+vp*.16;
          if((gx+gy+cycle)%5===0)colour=255-Math.abs(va-vp);
        }else if(active==='relief'){
          colour=va*.62+vb*.18+vp*.20;
        }else if(active==='edges'){
          colour=lb>130?va*.68+vp*.32:vb*.65+vp*.35;
        }else{
          colour=va*.6+vp*.4;
        }
        d[i+channel]=clamp(Math.round(colour),0,255);
      }
      d[i+3]=255;
    }
  }
  ctx.putImageData(out,0,0);
  return {canvas,mode:active,sources:sample.map(s=>s.name),
    stats:{pixels:width*height,cutPixels:cut,edgePixels:sampled,donorCount:pool.length}};
}
