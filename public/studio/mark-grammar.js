/* Hexfield 313 — executable mark-application grammar.
 * Marks are procedures applied to sampled pigment and local image direction,
 * not adjectives, font names or prompts to an image generator.
 * All procedures have a straight-edge implementation for the no_curves law.
 */
export const DERIVED_MARKS=Object.freeze({
  contour:'Contour-following paired strokes',
  rake:'Parallel bristle rake',
  weave:'Interrupted over-under woven threads',
  ribbon:'Faceted variable-width ribbon',
  stipple:'Density-driven stipple clusters',
  echo:'Offset echoes of a single gesture',
  scratch:'Scraped and crossed drypoint',
  tessellate:'Alternating polygonal tesserae',
  lattice:'Connected directional lattice',
  orbit:'Concentric polygonal orbit marks'
});
export const ORIGINAL_MARKS=Object.freeze(['dashes','dots','hatch','cutout','carve']);
export const MARK_PALETTE=Object.freeze([...ORIGINAL_MARKS,...Object.keys(DERIVED_MARKS)]);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const frac=n=>n-Math.floor(n);
const pi=Math.PI;
export function markAtCell(x,y,seed=1,iteration=0,span=6){
  // Region-based choices allow distinctly different APPLICATION styles to
  // coexist; adding a mark does not multiply the number of UI controls.
  const bx=Math.floor(x/span),by=Math.floor(y/span);
  const lane=(((bx+by*3+(iteration|0)+(seed>>>4))%MARK_PALETTE.length)
    +MARK_PALETTE.length)%MARK_PALETTE.length;
  return MARK_PALETTE[lane];
}
export function paintDerivedMark(ctx,{
  mark,x,y,step,angle=0,colour='#293f4c',luminosity=.5,contrast=.5,
  seed=1,noCurves=false,emit=()=>{}
}={}){
  if(!(mark in DERIVED_MARKS))return false;
  const scale=Math.max(1,step),dark=clamp(1-luminosity,0,1);
  const weight=clamp(scale*(.09+dark*.20),.8,4);
  const noise=frac(Math.sin(x*12.9898+y*78.233+seed*1.731)*43758.5453123);
  const cos=Math.cos(angle),sin=Math.sin(angle),px=-sin,py=cos;
  const offset=(a,b)=>[x+cos*a+px*b,y+sin*a+py*b];
  const drawLine=(ax,ay,bx,by,width=weight,ink=colour)=>{
    ctx.lineWidth=width;ctx.strokeStyle=ink;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    emit({type:'line',x:ax,y:ay,a:bx,b:by,width,color:ink});
  };
  const line=(a,b,c,d,w=weight,ink=colour)=>{
    const A=offset(a,b),B=offset(c,d);
    drawLine(A[0],A[1],B[0],B[1],w,ink);
  };
  const polygon=(coords,ink=colour)=>{
    const pts=coords.map(([a,b])=>offset(a,b));
    ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(...pts[0]);
    for(const p of pts.slice(1))ctx.lineTo(...p);
    ctx.closePath();ctx.fill();
    emit({type:'polygon',points:pts,color:ink});
  };
  const dot=(a,b,size)=>{
    const p=offset(a,b),r=Math.max(.7,size);
    ctx.fillStyle=colour;
    if(noCurves){
      ctx.fillRect(p[0]-r,p[1]-r,2*r,2*r);
      emit({type:'rect',x:p[0]-r,y:p[1]-r,a:2*r,b:2*r,color:colour});
    }else{
      ctx.beginPath();ctx.arc(p[0],p[1],r,0,2*pi);ctx.fill();
      emit({type:'circle',x:p[0],y:p[1],a:r,color:colour});
    }
  };
  ctx.save();ctx.lineCap='butt';ctx.lineJoin='bevel';
  const half=scale*.46;
  switch(mark){
    case 'contour': {
      // Tangents follow measured source-image luminance gradients.
      const spread=scale*(.13+.2*contrast);
      line(-half,-spread,half,spread*.3,weight);
      line(-half,spread,half,-spread*.3,weight*.6);
      break;
    }
    case 'rake':
      for(let j=-2;j<=2;j++)line(-half,j*scale*.14,
        half*(.85+j*.025),j*scale*.14+(noise-.5)*scale*.22,
        weight*(j===0?1.3:.48));
      break;
    case 'weave': {
      // The deliberate interruption encodes which strand passes on top.
      const flip=((Math.floor(x/scale)+Math.floor(y/scale)+(seed|0))&1)?1:-1;
      line(-half,-scale*.19,-scale*.09,-scale*.19,weight*1.6);
      line(scale*.09,-scale*.19,half,-scale*.19,weight*1.6);
      line(-scale*.19,-half*flip,-scale*.19,-scale*.10*flip,weight);
      line(-scale*.19,scale*.10*flip,-scale*.19,half*flip,weight);
      break;
    }
    case 'ribbon': {
      const swell=scale*(.07+dark*.25),shift=(noise-.5)*scale*.25;
      polygon([[-half,-swell*.40],[-half,swell*.40],
        [0,swell+shift],[half,swell*.16],[half,-swell*.16],[0,-swell+shift]]);
      break;
    }
    case 'stipple': {
      const n=2+Math.floor(dark*6);
      for(let i=0;i<n;i++){
        const t=frac(noise+i*.61803398875),u=frac(noise*.73+i*.41421356237);
        dot((t-.5)*scale,(u-.5)*scale,scale*(.045+dark*.075));
      }
      break;
    }
    case 'echo':
      for(let i=0;i<4;i++){
        const sh=(i-1.5)*scale*.19;
        line(-half*(1-i*.12),sh,half*(1-i*.12),sh+(noise-.5)*scale*.24,
          weight*(1-i*.18));
      }
      break;
    case 'scratch': {
      const tilt=scale*(noise-.5)*.4;
      line(-half,-half*.35,half,half*.35+tilt,weight*.62);
      line(-half*.42,half,half*.28,-half,weight*.40);
      if(dark>.5)line(-half,-half*.15,half,half*.52,weight*.35);
      break;
    }
    case 'tessellate': {
      const a=half*.92,b=half*(.3+dark*.52);
      polygon([[-a,-b],[a*.1,-b],[a,b*.25],[-a*.2,b]]);
      if(contrast>.22)polygon([[a*.15,-b],[a*.95,-b*.68],[a*.4,b],[-a*.05,b*.78]]);
      break;
    }
    case 'lattice':
      line(-half,0,0,-half,weight*.7);
      line(0,-half,half,0,weight*.7);
      line(half,0,0,half,weight*.7);
      line(0,half,-half,0,weight*.7);
      if(dark>.42)line(-half,0,half,0,weight*.35);
      break;
    case 'orbit': {
      // Polygonal rings are a real mark form, including under no_curves.
      const rings=dark>.44?2:1;
      for(let r=0;r<rings;r++){
        const radius=scale*(.30-r*.14);
        let last=null,first=null;
        for(let j=0;j<8;j++){
          const a=(j/8)*2*pi+angle,point=[x+Math.cos(a)*radius,y+Math.sin(a)*radius];
          if(last)drawLine(...last,...point,weight*.55);
          else first=point;
          last=point;
        }
        drawLine(...last,...first,weight*.55);
      }
      break;
    }
  }
  ctx.restore();return true;
}
