/* HEXFIELD 308 / PHI TASTE — TWO MEASURABLE, INTERACTING LAWS.
 *
 * A composition is NOT declared objectively beautiful. This is a deliberately
 * inspectable, optional mathematical prior for candidate selection:
 *
 * G: golden geometry of structural ink distribution and occupied silhouette.
 * C: golden pigment share, palette hue spacing and spatial color distribution.
 * X: what happens when chroma is actually placed ON the geometry: an image
 * ablation test rotates the chroma field against the fixed structural field.
 *
 * A φ-qualified STUDY must pass three independent gates. User KEEP/REJECT
 * votes remain the ultimate judgement. No image model/AI credits involved.
 */
export const PHI=(1+Math.sqrt(5))/2;
export const GOLD=1/PHI;
export const GOLD_MINOR=1-GOLD;
export const GOLDEN_ANGLE=360/(PHI*PHI);
export const GOLDEN_THRESHOLDS=Object.freeze({
  geometry:.54,color:.50,coupling:.53,combined:.57
});
const W=54,H=34;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const fit=(value,target,tolerance=.22)=>Math.exp(-.5*((value-target)/tolerance)**2);
export const phiFit=(value,tolerance=.22)=>Math.max(
 fit(value,GOLD,tolerance),fit(value,GOLD_MINOR,tolerance)
);
const positive=(x)=>Math.max(0,x);
const luminance=(r,g,b)=>(.2126*r+.7152*g+.0722*b)/255;
const hueRgb=(r,g,b)=>{
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 if(d<1)return {h:0,s:0};
 let h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
 h=(h*60+360)%360;
 return {h,s:d/(max||1)};
};
const gdistance=(x,y)=>Math.min((x-y+360)%360,(y-x+360)%360);
function safeCanvas(canvas){
 if(!canvas?.width||!canvas?.height||typeof canvas.getContext!=='function')
   throw Error('Golden evaluation needs a rendered canvas');
 const mini=document.createElement('canvas');mini.width=W;mini.height=H;
 const ctx=mini.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('2D context unavailable for golden evaluation');
 // Preserve the full aspect ratio as a normalized field, with no raw files
 // persisted or sent to another service.
 ctx.fillStyle='#e9e5dc';ctx.fillRect(0,0,W,H);
 ctx.drawImage(canvas,0,0,W,H);
 return ctx.getImageData(0,0,W,H).data;
}
function scoreSamples(samples,mode='landscape'){
 const area=W*H, luma=new Float32Array(area),pigment=new Float32Array(area),
   hue=new Float32Array(area),saturation=new Float32Array(area),
   shape=new Float32Array(area);
 let borderL=0,borderN=0;
 for(let i=0;i<area;i++){
   const r=samples[i*4],g=samples[i*4+1],b=samples[i*4+2];
   luma[i]=luminance(r,g,b);
   const colour=hueRgb(r,g,b);
   hue[i]=colour.h;saturation[i]=colour.s;
   if(Math.floor(i/W)===0||Math.floor(i/W)===H-1||
     i%W===0||i%W===W-1){borderL+=luma[i];borderN++;}
 }
 borderL/=borderN;
 let totalGeom=0,totalPig=0,geomLeft=0,geomTop=0,pigLeft=0,pigTop=0,
   nonEmpty=0,minX=W,maxX=-1,minY=H,maxY=-1,shapeHue=0;
 const palette=new Float64Array(12);
 const xDivision=Math.floor(W*GOLD),yDivision=Math.floor(H*GOLD);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;
   const dx=x>0?Math.abs(luma[i]-luma[i-1]):0;
   const dy=y>0?Math.abs(luma[i]-luma[i-W]):0;
   const edge=clamp((dx+dy)*1.9);
   const bg=clamp(Math.abs(luma[i]-borderL)*2.4);
   const structural=clamp(.6*bg+.4*edge);
   const col=clamp(saturation[i]*(.20+.80*Math.max(edge,bg)));
   shape[i]=structural;pigment[i]=col;
   totalGeom+=structural;totalPig+=col;
   if(x<xDivision){geomLeft+=structural;pigLeft+=col;}
   if(y<yDivision){geomTop+=structural;pigTop+=col;}
   if(structural>.14){
     minX=Math.min(minX,x);maxX=Math.max(maxX,x);
     minY=Math.min(minY,y);maxY=Math.max(maxY,y);nonEmpty++;
   }
   if(col>.03){
     palette[Math.floor(hue[i]/30)%12]+=col;
     shapeHue+=col;
   }
 }
 const energy=clamp(totalGeom/(area*.20));
 const pigmentEnergy=clamp(totalPig/(area*.12));
 const occupiedRatio=nonEmpty/area;
 const widthPx=maxX<0?0:maxX-minX+1;
 const heightPx=maxY<0?0:maxY-minY+1;
 const normalizedAspect=heightPx?
   (widthPx/W)/(heightPx/H):0;
 const aspectPhi=normalizedAspect?
   Math.max(fit(normalizedAspect,PHI,.43),
     fit(normalizedAspect,GOLD,.21),
     fit(normalizedAspect,1,.34)*.65):0;
 // Geometry: proportions of structural ink on each side of φ dividers.
 const geomRatioX=totalGeom?geomLeft/totalGeom:0;
 const geomRatioY=totalGeom?geomTop/totalGeom:0;
 const distribution=(phiFit(geomRatioX,.19)+phiFit(geomRatioY,.19))*.5;
 const occupied=phiFit(occupiedRatio,.24);
 const geometry=clamp(energy*(
   .39*distribution+.38*aspectPhi+.23*occupied
 ));
 const pigmentRatioX=totalPig?pigLeft/totalPig:0;
 const pigmentRatioY=totalPig?pigTop/totalPig:0;
 const colorSpread=(phiFit(pigmentRatioX,.23)+phiFit(pigmentRatioY,.23))*.5;
 const ordered=[...palette].map((mass,i)=>({mass,i})).sort((a,b)=>b.mass-a.mass);
 const largest=ordered[0]?.mass||0,second=ordered[1]?.mass||0;
 const topShare=totalPig?largest/totalPig:0;
 const dominantPair=largest+second?largest/(largest+second):0;
 // 137.5077° is the golden ANGLE, not a gold pixel proportion.
 const firstHue=(ordered[0]?.i||0)*30+15,secondHue=(ordered[1]?.i||0)*30+15;
 const separation=gdistance(firstHue,secondHue);
 const goldenHue=fit(separation,GOLDEN_ANGLE,40);
 const diversity=clamp(second/(totalPig*.22));
 const color=clamp(pigmentEnergy*diversity*(
   .32*phiFit(dominantPair,.20)+.24*phiFit(topShare,.23)+
   .25*colorSpread+.19*goldenHue*diversity
 ));
 // The third independent judgement asks how the actual hue/saturation
 // placement affected the silhouette. Compare chroma overlap with structural
 // weight, and the same chroma field shifted around the canvas as an ablation.
 // This explicitly distinguishes good ratios from good RELATIONSHIPS.
 let overlap=0,shifted=0,reverseShift=0,focused=0,unfocused=0;
 const shiftX=Math.max(1,Math.round(W*GOLD_MINOR)),shiftY=Math.max(1,Math.round(H*GOLD));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,from=((y+shiftY)%H)*W+(x+shiftX)%W;
   overlap+=shape[i]*pigment[i];
   shifted+=shape[i]*pigment[from];
   reverseShift+=shape[from]*pigment[i];
   // Golden composition points, not only the overall total at the frame
   // boundary. Color and shape should reinforce those intersections.
   const fx=Math.min(Math.abs(x/W-GOLD),Math.abs(x/W-GOLD_MINOR));
   const fy=Math.min(Math.abs(y/H-GOLD),Math.abs(y/H-GOLD_MINOR));
   const goldenPoint=Math.exp(-.5*(fx*fx+fy*fy)/(.22*.22));
   focused+=shape[i]*pigment[i]*goldenPoint;
   unfocused+=shape[i]*pigment[i];
 }
 const maxProduct=Math.sqrt(
   shape.reduce((v,x)=>v+x*x,0)*
   pigment.reduce((v,x)=>v+x*x,0)
 )||1;
 const overlapNorm=clamp(overlap/maxProduct);
 const colorOnGeometry=(overlap-shifted)/(maxProduct||1);
 const geometryOnColor=(overlap-reverseShift)/(maxProduct||1);
 const delta=(colorOnGeometry+geometryOnColor)*.5;
 const goldenPointSupport=unfocused?focused/unfocused:0;
 // Reciprocal counterfactuals: move colour over unchanged shape, then
 // move the shape over unchanged colours. Neither score can hide inside
 // an averaged "colour harmony" number: retain BOTH signed effects.
 const coupling=clamp(pigmentEnergy*energy*(
   .29*overlapNorm+.235*clamp(.5+colorOnGeometry*.9)+
   .235*clamp(.5+geometryOnColor*.9)+
   .24*phiFit(goldenPointSupport,.23)
 ));
 // Both dimensions are independent prerequisites; compensating a colour
 // failure with perfect geometry is explicitly disallowed.
 const combined=clamp((geometry*color)**.5*(.54+.46*coupling));
 const qualifies=geometry>=GOLDEN_THRESHOLDS.geometry&&
   color>=GOLDEN_THRESHOLDS.color&&
   coupling>=GOLDEN_THRESHOLDS.coupling&&
   combined>=GOLDEN_THRESHOLDS.combined;
 return {
   version:1,phi:+PHI.toFixed(9),goldAngle:+GOLDEN_ANGLE.toFixed(6),
   geometry:+geometry.toFixed(4),
   color:+color.toFixed(4),
   coupling:+coupling.toFixed(4),
   combined:+combined.toFixed(4),
   qualifies,mode,
   ratios:{
     geometryLeft:+geomRatioX.toFixed(4),geometryTop:+geomRatioY.toFixed(4),
     occupied:+occupiedRatio.toFixed(4),
     aspect:+normalizedAspect.toFixed(4),
     dominantColor:+topShare.toFixed(4),
     dominantPair:+dominantPair.toFixed(4),
     colorLeft:+pigmentRatioX.toFixed(4),colorTop:+pigmentRatioY.toFixed(4),
     hueAngle:+separation.toFixed(2)
   },
   interaction:{
     alignment:+overlapNorm.toFixed(4),
     ablatedAlignment:+clamp(shifted/maxProduct).toFixed(4),
     reverseAblatedAlignment:+clamp(reverseShift/maxProduct).toFixed(4),
     colorOnGeometry:+colorOnGeometry.toFixed(4),
     geometryOnColor:+geometryOnColor.toFixed(4),
     effect:+delta.toFixed(4),
     goldenPointSupport:+goldenPointSupport.toFixed(4),
     verdict:delta>.025?'colour reinforces structure':
       delta<-.025?'colour disrupts structure':'colour effect nearly neutral'
   },
   constraints:{
     geometry:GOLDEN_THRESHOLDS.geometry,color:GOLDEN_THRESHOLDS.color,
     coupling:GOLDEN_THRESHOLDS.coupling,combined:GOLDEN_THRESHOLDS.combined
   }
 };
}
export function measureGoldenTaste(canvas,{mode='landscape'}={}){
 return scoreSamples(safeCanvas(canvas),mode);
}
export const GOLDEN_MODE_KEY='hexfield.phi.taste.mode.v1';
export function getGoldenMode(){
 try{
   const mode=localStorage.getItem(GOLDEN_MODE_KEY);
   return ['off','guide','strict'].includes(mode)?mode:'strict';
 }catch{return 'strict';}
}
export function setGoldenMode(value){
 const mode=['off','guide','strict'].includes(value)?value:'strict';
 try{localStorage.setItem(GOLDEN_MODE_KEY,mode);}catch{}
 return mode;
}
export function goldenPrior(s,{mode='guide'}={}){
 if(!s)return 0;
 if(mode==='off')return 0;
 const positive=(s.geometry*.31+s.color*.31+s.coupling*.28+s.combined*.1);
 const penalty=(mode==='strict'&&!s.qualifies)?-.85:0;
 return +(positive+penalty).toFixed(5);
}
export function explainGolden(s){
 if(!s)return 'No golden proportions measured';
 const pct=value=>(100*value).toFixed(0)+'%';
 const relation=s.interaction.effect>0?'reinforcing':
   s.interaction.effect<0?'disrupting':'neutral';
 return 'G '+pct(s.geometry)+' / C '+pct(s.color)+
   ' / X '+pct(s.coupling)+' / combined '+pct(s.combined)+
   ' · '+relation+' interaction ('+
   'colour→geometry '+(s.interaction.colorOnGeometry>=0?'+':'')+
   s.interaction.colorOnGeometry.toFixed(3)+', '+
   'geometry→colour '+(s.interaction.geometryOnColor>=0?'+':'')+
   s.interaction.geometryOnColor.toFixed(3)+
   ') · '+(s.qualifies?'φ-qualified study':'φ-constraints not all satisfied');
}
export function rankGoldenCandidates(candidates,{mode='guide',
  noveltyWeight=1,goldenWeight=1}={}){
 return candidates.map((item,index)=>{
   const taste=item.golden||measureGoldenTaste(item.canvas);
   const visual=Number(item.novelty?.score)||0;
   return {...item,index,golden:taste,
     score:(Number(item.score)||0)+noveltyWeight*visual+
       goldenWeight*goldenPrior(taste,{mode})};
 }).sort((a,b)=>{
   if(mode==='strict'&&a.golden.qualifies!==b.golden.qualifies)
     return a.golden.qualifies?-1:1;
   return b.score-a.score;
 });
}
