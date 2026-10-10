/* HEXFIELD 316 — physical coupling between procedural letters and a live
 * painted scene. Pure pixel geometry: no separate viewer, style model,
 * manual collision parameters or hidden image-generation request.
 *
 * The source colour discontinuities are measured from actual canvas pixels.
 * Word contours bend around them, occlude/interlace with scene shapes, and
 * displace the ORIGINAL scene near their outlines. Those displaced scene pixels
 * survive in the returned artwork and the next abstraction frame.
 */
export const GEOMETRY_RELATIONS=Object.freeze([
  'repel','thread','graft','carve','braid','orbit'
]);
export const GEOMETRY_TASTE_KEY='hexfield.word-geometry-taste.v1';
const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
const mix=s=>{
 let h=2166136261>>>0;
 for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 return h>>>0;
};
export function geometryTaste(){
 try{
  const v=JSON.parse(localStorage.getItem(GEOMETRY_TASTE_KEY)||'null');
  return v?.version===1&&typeof v.scores==='object'?
   Object.fromEntries(GEOMETRY_RELATIONS.map(m=>[m,
     limit(Number(v.scores[m])||0,-10,10)])):{};
 }catch{return {};}
}
export function noteGeometryVerdict(method,liked){
 if(!GEOMETRY_RELATIONS.includes(method))return geometryTaste();
 const scores=geometryTaste();scores[method]=limit((scores[method]||0)+(liked?1:-1),-10,10);
 try{localStorage.setItem(GEOMETRY_TASTE_KEY,JSON.stringify({version:1,scores}));}catch{}
 return scores;
}
export function chooseGeometryRelation(seed=1,generation=0,prior=null,branch=1){
 const scores=geometryTaste(),s=mix(seed+'|'+generation+'|'+branch);
 // Parent method competes unchanged against alternative ways of interacting.
 // A disliked parent can no longer lock an entire lineage into a bad collision.
 if(branch===0&&GEOMETRY_RELATIONS.includes(prior)&&
   (scores[prior]||0)>-2)return prior;
 // Strong repeated REJECT must exclude the parent from its conservation
 // trial, rather than accidentally re-elect it on a weighted redraw.
 const available=branch===0&&GEOMETRY_RELATIONS.includes(prior)&&
   (scores[prior]||0)<=-2?GEOMETRY_RELATIONS.filter(m=>m!==prior):GEOMETRY_RELATIONS;
 const candidate=available.map((method,i)=>({
   method,weight:.5+Math.exp(limit(scores[method]||0,-8,8)*.24)+
      (method===prior ? .6 : 0),index:i
 }));
 const sum=candidate.reduce((n,x)=>n+x.weight,0);
 let n=(s/4294967296)*sum;
 for(const item of candidate){n-=item.weight;if(n<=0)return item.method;}
 return candidate.at(-1).method;
}
const colourDelta=(source,i,j)=>
 (Math.abs(source[i]-source[j])+Math.abs(source[i+1]-source[j+1])+
  Math.abs(source[i+2]-source[j+2]))/765;
const alphaAt=(mask,w,h,x,y)=>
 x>=0&&y>=0&&x<w&&y<h?mask[y*w+x]/255:0;
function gradient(source,w,h,x,y){
 const l=(y*w+limit(x-2,0,w-1))*4,
  r=(y*w+limit(x+2,0,w-1))*4,
  u=(limit(y-2,0,h-1)*w+x)*4,
  d=(limit(y+2,0,h-1)*w+x)*4;
 const xSign=((source[r]-source[l])*.213+(source[r+1]-source[l+1])*.715+
   (source[r+2]-source[l+2])*.072)/255;
 const ySign=((source[d]-source[u])*.213+(source[d+1]-source[u+1])*.715+
   (source[d+2]-source[u+2])*.072)/255;
 return {x:xSign,y:ySign,edge:Math.max(colourDelta(source,l,r),colourDelta(source,u,d))};
}
/** @param {Uint8ClampedArray} before RGBA canvas colours
 * @param {Uint8ClampedArray} letters existing antialiased glyph occupancy
 * @returns New glyph geometry + NEW actual RGB scene. No source mutation.
 */
export function coupleWordGeometry(before,letters,w,h,{seed=1,relation='repel',bounds,
  size=20}={}){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0||
   before?.length!==w*h*4||letters?.length!==w*h)
   throw Error('Word and scene must have matching raster dimensions');
 const method=GEOMETRY_RELATIONS.includes(relation)?relation:'repel';
 const mask=new Uint8ClampedArray(letters);
 const scene=new Uint8ClampedArray(before);
 const radius=limit(Math.round(size*.15),2,7);
 const top=limit(Math.floor((bounds?.top??0)-radius*2),0,h);
 const bottom=limit(Math.ceil((bounds?.top??0)+(bounds?.height??h)+radius*2),0,h);
 const sigma=(mix(seed+'|'+method)%2)?1:-1;
 const stats={relation:method,sceneEdges:0,contactPixels:0,
  bentPixels:0,occludedPixels:0,graftedPixels:0,
  displacedPixels:0,sceneShiftPx:radius,region:[top,bottom]};
 const warpStrength=method==='carve'?.6:method==='orbit'?1.3:
   method==='thread'?.9:method==='graft'?.8:1;
 // 1 / The glyph itself responds to what it is crossing. A local scene
 // contour deflects ink sideways, in actual raster geometry.
 for(let y=top;y<bottom;y++)for(let x=radius+1;x<w-radius-1;x++){
  const p=y*w+x,g=gradient(before,w,h,x,y),value=letters[p];
  if(g.edge<.065)continue;
  stats.sceneEdges++;
  if(value>20)stats.contactPixels++;
  if(value===0&&method!=='graft'&&method!=='braid')continue;
  const flowX=limit(Math.round(sigma*g.x*radius*2.6*warpStrength),-radius,radius);
  const flowY=limit(Math.round(-sigma*g.y*radius*2*warpStrength),-radius,radius);
  let moved=alphaAt(letters,w,h,x-flowX,y-flowY)*255;
  // Layer crossings have genuine depth: at every other strand the existing
  // source object passes OVER the letter, rather than applying a grey effect.
  const stripe=((Math.floor(x/Math.max(4,size*.32))+
    Math.floor(y/Math.max(4,size*.26)))&1)===0;
  if((method==='thread'||method==='braid'||method==='carve')&&
     g.edge>.10&&stripe&&moved>0){
    const cut=method==='carve'?.12:method==='thread'?.37:.22;
    moved*=cut;
    stats.occludedPixels++;
  }
  // A bridge JOINING letter and scene appears where a live scene edge
  // is just outside a glyph boundary, not at arbitrary random x/y coords.
  if((method==='graft'||method==='braid')&&value<64&&g.edge>.10){
    const neighbor=Math.max(
      alphaAt(letters,w,h,x-radius,y),
      alphaAt(letters,w,h,x+radius,y),
      alphaAt(letters,w,h,x,y-radius),
      alphaAt(letters,w,h,x,y+radius));
    if(neighbor>.35){
      moved=Math.max(moved,neighbor*255*(method==='graft'?.68:.48));
      if(moved>value+30)stats.graftedPixels++;
    }
  }
  const adjusted=limit(Math.round(moved),0,255);
  if(Math.abs(adjusted-value)>28)stats.bentPixels++;
  mask[p]=adjusted;
 }
 // 2 / The scene also RESPONDS TO THE LETTER, instead of being a passive
 // wallpaper behind text. Around the actual glyph silhouette we push nearby
 // source colours and silhouettes outward. A source uniform patch remains
 // unchanged — there must be real scene structure to move.
 for(let y=top;y<bottom;y++)for(let x=radius+1;x<w-radius-1;x++){
  const p=y*w+x,inside=mask[p]/255;
  if(inside>.60)continue;
  const left=alphaAt(mask,w,h,x-radius,y),
   right=alphaAt(mask,w,h,x+radius,y),
   up=alphaAt(mask,w,h,x,y-radius),
   down=alphaAt(mask,w,h,x,y+radius);
  const towardX=left-right,towardY=up-down;
  const near=Math.hypot(towardX,towardY);
  if(near<.16)continue;
  const g=gradient(before,w,h,x,y);
  if(g.edge<.065)continue;
  // Source objects may flow in opposite directions in consecutive geometry
  // relationships; every method has one specific physical effect.
  const direction=method==='orbit'||method==='thread'?-1:1;
  const sw=Math.max(1,Math.round(radius*(method==='repel'?1:
    method==='carve'?.45:method==='braid'?.8:.65)*
    Math.min(1,near)*Math.min(1,g.edge*3+0.5)));
  let sx=limit(x-Math.round(direction*towardX*sw),0,w-1),
   sy=limit(y-Math.round(direction*towardY*sw),0,h-1);
  if(method==='orbit'){
    sx=limit(x-Math.round(towardY*sw),0,w-1);
    sy=limit(y+Math.round(towardX*sw),0,h-1);
  }
  const from=(sy*w+sx)*4,to=p*4;
  const amount=.35+.38*Math.min(1,near);
  let delta=0;
  for(let c=0;c<3;c++){
    const colour=Math.round(before[to+c]*(1-amount)+before[from+c]*amount);
    delta+=Math.abs(colour-before[to+c]);scene[to+c]=colour;
  }
  if(delta>18)stats.displacedPixels++;
 }
 return {mask,scene,stats};
}
