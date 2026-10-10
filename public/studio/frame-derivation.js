/* HEXFIELD 313 / Frame-to-frame derivation.
 * The previous ACCEPTED painting and a freshly rendered proposal are both
 * actual pixel sources. Bounded editing masks create an intermediate painting
 * with conserved, grafted, abraded and newly invented regions.
 * No semantic object tracking or purported psychological beauty metric.
 */
export const DERIVATION_METHODS=Object.freeze([
  'conserve','graft','palimpsest','weft','abrade'
]);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const frac=n=>n-Math.floor(n);
const smooth=t=>t*t*(3-2*t);
const create=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const sample=(source,w,h)=>{
  const c=create(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,0,0,w,h);return ctx.getImageData(0,0,w,h);
};
function noise(x,y,seed){
  let n=Math.imul((x+2017)|0,374761393)^Math.imul((y+679)|0,668265263)^(seed|0);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
}
export function derivationMethod(seed=1,cycle=0,branch=0){
  return DERIVATION_METHODS[(Math.imul((seed>>>7),3)+(cycle|0)+(branch|0)*2>>>0)%DERIVATION_METHODS.length];
}
export function deriveBetweenFrames(parent,proposal,{
  seed=1,cycle=0,branch=0,method=null
}={}){
  if(!parent||!proposal)throw Error('Derivation needs both actual painting frames');
  const w=proposal.width,h=proposal.height;
  if(!w||!h)throw Error('Cannot derive empty canvas');
  const chosen=DERIVATION_METHODS.includes(method)?method:derivationMethod(seed,cycle,branch);
  const old=sample(parent,w,h).data,neo=sample(proposal,w,h).data;
  const out=create(w,h),ctx=out.getContext('2d',{willReadFrequently:true});
  const dst=ctx.createImageData(w,h),pix=dst.data;
  const tile=24,cols=Math.ceil(w/tile)+2,rows=Math.ceil(h/tile)+2;
  const grid=new Float32Array(cols*rows);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)
    grid[y*cols+x]=noise(x,y,seed^Math.imul(cycle+1,11639));
  let retained=0,hybrid=0,changed=0,sourceContribution=0;
  const off=(Math.round((noise(9,3,seed)-.5)*Math.min(20,w*.05)))|0;
  for(let y=0;y<h;y++){
    const gy=Math.floor(y/tile),dy=smooth((y%tile)/tile);
    for(let x=0;x<w;x++){
      const gx=Math.floor(x/tile),dx=smooth((x%tile)/tile);
      const n00=grid[gy*cols+gx],n10=grid[gy*cols+gx+1];
      const n01=grid[(gy+1)*cols+gx],n11=grid[(gy+1)*cols+gx+1];
      const field=(n00+(n10-n00)*dx)*(1-dy)+(n01+(n11-n01)*dx)*dy;
      const i=(y*w+x)*4;
      const oldLum=(old[i]*.213+old[i+1]*.715+old[i+2]*.072)/255;
      const diff=(Math.abs(old[i]-neo[i])+Math.abs(old[i+1]-neo[i+1])+
        Math.abs(old[i+2]-neo[i+2]))/765;
      let keep=0,ix=i;
      switch(chosen){
        case 'conserve':
          // Continuous anchored areas are literally retained; new marks
          // invade their boundaries instead of erasing the old picture.
          keep=clamp((field-.42)*11);break;
        case 'graft':
          // Old material migrates to a neighbouring area before union.
          ix=(y*w+Math.max(0,Math.min(w-1,x+off)))*4;
          keep=clamp((field-.39)*8);break;
        case 'palimpsest':
          // Previous pigment shines through under thin translucent strata.
          keep=clamp(.12+field*.68+(.5-oldLum)*.26);break;
        case 'weft': {
          // Alternating local stripes pass different frames over one another.
          const strand=((Math.floor((x+y*.37)/Math.max(4,w*.017))+
            Math.floor(y/Math.max(5,h*.065)))&1);
          keep=clamp((strand?.86:.12)+(field-.5)*.31);break;
        }
        case 'abrade':
          // Recover preceding work preferentially where the new proposal
          // conflicts with it; let unchallenged new marks through.
          keep=clamp((field-.44)*4+diff*.55+(.5-oldLum)*.1);break;
      }
      if(keep>=.90)retained++;
      if(keep>.10&&keep<.90)hybrid++;
      sourceContribution+=keep;
      let different=0;
      for(let c=0;c<3;c++){
        pix[i+c]=Math.round(neo[i+c]*(1-keep)+old[ix+c]*keep);
        different+=Math.abs(pix[i+c]-old[i+c]);
      }
      pix[i+3]=255;
      if(different>36)changed++;
    }
  }
  ctx.putImageData(dst,0,0);
  const count=w*h;
  return {canvas:out,method:chosen,retained:retained/count,
    interwoven:hybrid/count,changed:changed/count,
    parentContribution:sourceContribution/count,
    // Labels describe measurable pixel operations, not semantic decisions.
    label:chosen+' / '+Math.round(retained/count*100)+'% intact parent pixels'};
}
