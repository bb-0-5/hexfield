/* Hexfield 296: landscapes are executed from a mutable procedure graph.
 * The grammar below is finite and validated, but its compositional expressions,
 * layering, mark instructions and scene topology can evolve/crossover independently.
 * This is not a hand-drawn reference library and not a shuffle of hill positions.
 */
import {randomFrom,makeGenome,methodDescription,evaluateSurface} from './evolution.js';
export const SCENES=['mountains','coast','forest','plains','hills','lake'];
export const MOODS=['golden','mist','storm','twilight'];
const W=1200,H=740,PI=Math.PI;
const palettes={
 golden:{sky:['#1e4261','#8e9caa','#efbf9b'],land:['#cad4c5','#889f95','#66796c','#344a42','#203a34'],water:['#7797a5','#d2b3a5'],light:'#ffe9bd',mist:'#f5dbbc',shade:'#172d35'},
 mist:{sky:['#829bad','#c5ced0','#f2e9d9'],land:['#c1c8c1','#8fa7a0','#779288','#4b7067','#365651'],water:['#84abae','#cedfd9'],light:'#fff0d3',mist:'#f2f4e7',shade:'#2a5555'},
 storm:{sky:['#1a2d40','#55697c','#9da9ab'],land:['#a9b2b3','#83989b','#586c72','#304955','#203542'],water:['#476777','#9cbbc3'],light:'#ffe0b3',mist:'#bacbd1',shade:'#142937'},
 twilight:{sky:['#222948','#726381','#e6a08b'],land:['#b0a0aa','#80758a','#685d77','#433c60','#28294b'],water:['#62607f','#b99ea9'],light:'#ffdeab',mist:'#d8afbf',shade:'#1e2341'}
};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const hash=(x,seed)=>{let v=Math.sin(x*127.1+seed*113.3)*43758.5453123;return v-Math.floor(v);};
const noise=(x,seed)=>{let i=Math.floor(x),t=x-i;t=t*t*(3-2*t);return (lerp(hash(i,seed),hash(i+1,seed),t)*2-1);};
const fbm=(x,seed)=>noise(x,seed)*.56+noise(x*2.18,seed+31)*.28+noise(x*5.63,seed+72)*.16;
const triangle=x=>1-Math.abs(2*(x-Math.floor(x)) -1);
function evalForm(n,x,seed,depth=0){
 if(!n||depth>6)return 0;
 const f=clamp(Number(n.f)||1,.2,12),t=x*f+(Number(n.p)||0);
 switch(n.o){
  case 'wave':return Math.sin(t*PI*2)*.72;
  case 'fbm':return fbm(t*3,seed);
  case 'ridge':return (1-Math.abs(fbm(t*3,seed))*2)*.95;
  case 'terrace':return (Math.round(fbm(t*4,seed)*5)/5);
  case 'dune':return .66*Math.cos(t*PI*2)+.28*Math.sin(t*PI*4+.4);
  case 'peak':return Math.pow(Math.max(0,triangle(t)),3)*2-1;
  case 'basin':return -Math.exp(-Math.pow(Math.sin(t*PI),2)*15)+.25;
  case 'steps':return (Math.floor((Math.sin(t*PI*2)+1)*4)/4)-1;
  case 'noise':return noise(t*15,seed)*.85;
 }
 const a=evalForm(n.a,t,seed+11,depth+1);
 if(n.o==='fold')return 1-Math.abs(a)*2;
 if(n.o==='bend')return Math.sin(a*PI*.9);
 if(n.o==='carve')return Math.sign(a)*Math.pow(Math.abs(a),2);
 if(n.o==='reverse')return -a;
 if(n.o==='quantize')return Math.round(a*4)/4;
 const b=evalForm(n.b,t*.73,seed+103,depth+1);
 if(n.o==='add')return clamp((a+b)*.68,-1.6,1.6);
 if(n.o==='blend')return lerp(a,b,.38);
 if(n.o==='cut')return clamp(a-b*.85,-1.6,1.6);
 if(n.o==='max')return Math.max(a,b);
 if(n.o==='multiply')return a*b*1.2;
 return 0;
}
const rgb=hex=>{const n=parseInt(hex.replace('#',''),16)||0;return [(n>>16)&255,(n>>8)&255,n&255];};
function gradePalette(p,g){
 // Atmospheric grading is a heritable *lighting method*, not a random filter.
 // It changes the underlying sky/land colours as well as the sky-mark grammar.
 const warmth=Math.sin(Number(g.lightAngle)||0)*30;
 const chroma=clamp(Number(g.chroma)||1,.45,1.65);
 const gradeHex=hex=>{
   const a=rgb(hex),lum=a[0]*.23+a[1]*.68+a[2]*.09;
   return '#'+a.map((v,i)=>{
      const warm=i===0?warmth:i===1?warmth*.22:-warmth*.68;
      return Math.round(clamp(lum+(v-lum)*chroma+warm,0,255)).toString(16).padStart(2,'0');
   }).join('');
 };
 return Object.fromEntries(Object.entries(p).map(([k,value])=>[k,Array.isArray(value)?value.map(gradeHex):gradeHex(value)]));
}
const mix=(a,b,t)=>{const c=rgb(a),d=rgb(b);return 'rgb('+c.map((v,i)=>Math.round(lerp(v,d[i],clamp(t)))).join(',')+')';};
const rgba=(h,a)=>{const c=rgb(h);return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;};
const random=(r,lo,hi)=>lerp(lo,hi,r());
const one=(r,list)=>list[Math.floor(r()*list.length)];
function blob(ctx,x,y,rx,ry,color,alpha=1,angle=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,2*PI);ctx.fill();ctx.restore();
}
function path(ctx,points,color,width,alpha=1){
 if(points.length<2)return;ctx.save();ctx.globalAlpha=alpha;
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 for(let i=0;i<points.length;i++){const [x,y]=points[i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
 ctx.stroke();ctx.restore();
}
function background(ctx,seed,p,g,skyY,quality){
 const r=randomFrom(seed^0x1357);
 const c=ctx.createLinearGradient(0,0,W,H*(g.sky==='radial'?.8:1));
 c.addColorStop(0,p.sky[0]);c.addColorStop(.56,p.sky[1]);c.addColorStop(1,p.sky[2]);
 ctx.fillStyle=c;ctx.fillRect(0,0,W,H);
 const lightX= W*(.48+.33*Math.sin(g.lightAngle)),lightY=skyY*(.18+.22*r());
 const rad=ctx.createRadialGradient(lightX,lightY,8,lightX,lightY,340);
 rad.addColorStop(0,rgba(p.light,.35));rad.addColorStop(.35,rgba(p.light,.14));rad.addColorStop(1,rgba(p.light,0));
 ctx.fillStyle=rad;ctx.fillRect(lightX-340,lightY-340,680,680);
 if(g.sky==='radial'||g.sky==='clouds')blob(ctx,lightX,lightY,26,25,p.light,.71);
 if(g.sky==='flat')return;
 const count=Math.floor((g.sky==='clouds'?110:g.sky==='veils'?140:g.sky==='bands'?55:90)*quality);
 for(let i=0;i<count;i++){
   const x=random(r,-220,W+220),y=random(r,6,skyY*.94);
   const scale=g.sky==='bands'?random(r,80,270):g.sky==='veils'?random(r,60,210):random(r,18,100);
   if(g.sky==='clouds') {
     blob(ctx,x,y,scale,random(r,4,25),p.mist,random(r,.055,.22),random(r,-.12,.12));
     if(i%4===0)blob(ctx,x+20,y-6,scale*.7,random(r,14,34),p.light,.065);
   } else if(g.sky==='bands'){
     path(ctx,[[x-scale,y+3],[x,y],[x+scale,y-random(r,1,16)]],p.mist,random(r,3,25),random(r,.04,.14));
   } else if(g.sky==='veils'){
     const bend=evalForm(g.detail,(x/W)+i*.031,seed+31);
     path(ctx,[[x-scale,y+14],[x,y-14*bend],[x+scale,y+22*bend]],p.mist,random(r,2,19),random(r,.045,.17));
   } else {
     path(ctx,[[lightX,lightY],[x,y],[x+random(r,-80,80),y+random(r,5,40)]],p.light,random(r,.4,5),random(r,.016,.042));
   }
 }
}
function heightAt(u,layer,g,scene,seed){
 const layers=clamp(Math.round(g.bands),2,5),t=layer/Math.max(1,layers-1);
 const x=u*1.25-.12,offset=layer*.21;
 const f=evalForm(g.terrain,x+offset,seed+layer*117);
 const detail=evalForm(g.detail,x*1.7+offset,seed+layer*19)*.18;
 const amplitude=(scene==='mountains'?190:scene==='plains'?38:scene==='forest'?86:scene==='coast'?88:128)*g.relief*(.9+t*.4);
 let layout=0;
 if(g.layout==='valley')layout=-Math.pow(Math.abs(u-.53)*2,.7)*.85;
 else if(g.layout==='escarpment')layout=1.05*Math.tanh((u-.42)*11);
 else if(g.layout==='sweep')layout=Math.sin((u*1.25+t*.55)*PI)*.75;
 else if(g.layout==='basin')layout=Math.exp(-Math.pow((u-.5)*4,2))*.85;
 else if(g.layout==='ridges')layout=Math.pow(Math.abs(Math.sin((u*2.8+t)*PI)),1.75)*.88;
 else if(g.layout==='islands')layout=Math.pow(Math.max(0,Math.cos((u-.49)*PI*2.2)),3)*1.05;
 const mountain=scene==='mountains'?52*Math.pow(Math.max(0,Math.cos(u*PI*3.4+layer)),4):0;
 const base=H*g.horizon+16+layer*(scene==='mountains'?63:scene==='plains'?83:69);
 return clamp(base - (f*.8+detail+layout*.75)*amplitude - mountain, H*.10, H*.98);
}
function region(ctx,profile,color){
 ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+12;x+=12)ctx.lineTo(x,profile(x/W));
 ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function surfaceMark(ctx,x,y,dy,color,light,r,g,scale){
 const n=clamp(scale*.4,.3,2.8),width=random(r,3,27)*g.brushSize*n;
 const angle=Math.atan(dy);
 if(g.brush==='contour'){
   path(ctx,[[x-width,y+random(r,-2,2)],[x,y],[x+width,y+width*dy]],color,random(r,.5,3)*n,light);
 }else if(g.brush==='hatch'){
   for(let k=0;k<2;k++)path(ctx,[[x+k*5,y-8*n],[x+10*n+k*5,y+6*n]],color,random(r,.6,2)*n,light*.75);
 }else if(g.brush==='mosaic'){
   ctx.save();ctx.globalAlpha=light;ctx.fillStyle=color;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y-3*n);ctx.lineTo(x+width*.85,y+7*n);ctx.lineTo(x-4*n,y+9*n);ctx.closePath();ctx.fill();ctx.restore();
 }else if(g.brush==='knife'){
   ctx.save();ctx.globalAlpha=light;ctx.translate(x,y);ctx.rotate(angle*.75);
   ctx.fillStyle=color;ctx.fillRect(0,0,width*1.5,random(r,2,8)*n);ctx.restore();
 }else if(g.brush==='wash'){
   blob(ctx,x,y,width*1.2,random(r,6,23)*n,color,light*.45,angle*.5);
 }else if(g.brush==='stipple'){
   const radius=random(r,1.8,7)*n;blob(ctx,x,y,radius,radius*.76,color,light);
   if(r()>.67)blob(ctx,x+radius*2,y-5*n,radius*.6,radius*.8,color,light*.5);
 }
}
function land(ctx,seed,p,g,scene,signal,quality){
 const r=randomFrom(seed^0x9ab),n=g.bands;
 const watery=scene==='coast'||scene==='lake';
 const waterY=H*(scene==='coast'?g.horizon+.045:g.horizon+.19);
 let lastProfiles=[];
 for(let layer=0;layer<n;layer++){
   if(signal?.aborted)return;
   // Water lies IN FRONT OF distant terrain, not behind filled foreground
   // polygons. Paint the latter as banks after the water plane.
   if(watery && (scene==='coast' || layer>=Math.min(2,n-1)))break;
   const f=x=>heightAt(x,layer,g,scene,seed);
   lastProfiles.push(f);
   let col=mix(p.land[Math.min(4,Math.round(layer*4/(n-1)))],p.mist, (1-layer/n)*g.atmosphere*.35);
   // The brush grammar chooses the *underpainting* as well as the later marks:
   // a change of technique must affect masses, not merely a few pixels.
   if(g.brush==='wash')col=mix(p.land[Math.min(4,Math.round(layer*4/(n-1)))],p.mist,.18+(1-layer/n)*g.atmosphere*.35);
   if(g.brush==='knife'||g.brush==='stipple')col=mix(p.land[Math.min(4,Math.round(layer*4/(n-1)))],p.shade,g.brush==='knife'?.13:.18);
   if(g.brush==='mosaic')col=mix(p.land[Math.min(4,Math.round(layer*4/(n-1)))],p.light,.09);
   region(ctx,f,col);
   const minMarks=layer===n-1?1900:layer===0?300:900;
   const strokes=Math.floor(minMarks*quality);
   for(let i=0;i<strokes;i++){
     const x=random(r,0,W),yy=f(x/W),y=yy+random(r,7,Math.max(10,H-yy)*.82);
     if(y>=H-2)continue;
     const slope=(f(clamp(x/W+.008))-f(clamp(x/W-.008)))/20;
     const sunDirection=Math.sin(g.lightAngle)*.25;
     const lit=(slope<sunDirection)!==(g.lightAngle<0);
     const tint=r()<.51 ? lit?p.mist:p.shade : layer%2?p.land[Math.min(layer,4)]:p.light;
     const opacity=random(r,.10,.47)*(layer===n-1?1.10:.78);
     surfaceMark(ctx,x,y,slope,tint,opacity,r,g,.52+layer/n);
   }
   const fog=ctx.createLinearGradient(0,f(.42)-40,0,f(.42)+145);
   fog.addColorStop(0,rgba(p.mist,0));fog.addColorStop(.48,rgba(p.mist,g.atmosphere*(1-layer/n)*.13));fog.addColorStop(1,rgba(p.mist,0));
   ctx.fillStyle=fog;ctx.fillRect(0,f(.42)-40,W,185);
 }
 if(watery){
   const c=ctx.createLinearGradient(0,waterY,0,H);
   c.addColorStop(0,p.water[1]);c.addColorStop(.62,p.water[0]);c.addColorStop(1,p.shade);
   ctx.fillStyle=c;ctx.fillRect(0,waterY,W,H-waterY);
   if(scene==='coast'){
     // Shorelines and headlands come from a second structural operator, not
     // from a hardcoded wave pasted over a fixed ground silhouette.
     const leftLimit=W*(.22+Math.abs(evalForm(g.detail,.19,seed))*.16);
     const rightLimit=W*(.77-Math.abs(evalForm(g.detail,.73,seed+44))*.15);
     ctx.fillStyle=p.land[3];ctx.beginPath();ctx.moveTo(0,waterY-45);
     for(let x=0;x<=leftLimit;x+=12){
       const t=x/leftLimit;ctx.lineTo(x,waterY+9+t*t*H*.5+evalForm(g.terrain,t,seed+28)*30);
     }
     ctx.lineTo(leftLimit,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
     ctx.fillStyle=p.land[2];ctx.beginPath();ctx.moveTo(W,waterY-16);
     for(let x=W;x>=rightLimit;x-=12){
       const t=(W-x)/(W-rightLimit);ctx.lineTo(x,waterY+25+t*t*H*.42+evalForm(g.detail,t,seed+37)*24);
     }
     ctx.lineTo(rightLimit,H);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
     // Far off-shore geology is a small separate program result.
     const ix=W*(.51+evalForm(g.terrain,.43,seed)*.17),iw=85+Math.abs(evalForm(g.detail,.81,seed))*95;
     ctx.fillStyle=mix(p.land[0],p.mist,.28);
     ctx.beginPath();ctx.moveTo(ix-iw,waterY+6);
     for(let x=ix-iw;x<=ix+iw;x+=8){const u=(x-(ix-iw))/(2*iw);
       ctx.lineTo(x,waterY+5-Math.max(0,Math.sin(u*PI))*random(r,12,40));}
     ctx.lineTo(ix+iw,waterY+6);ctx.closePath();ctx.fill();
   }else{
     const shore=x=>heightAt(x,n-1,g,scene,seed);
     lastProfiles.push(shore);region(ctx,shore,p.land[4]);
   }
   const marks=Math.floor(560*quality);
   for(let i=0;i<marks;i++){
     const x=random(r,0,W),y=random(r,waterY,H),depth=(y-waterY)/Math.max(1,H-waterY);
     if(scene==='lake' && lastProfiles.length && y>lastProfiles.at(-1)(x/W)-6)continue;
     const xsize=random(r,3,48)*(1+depth);
     const color=r()>.58?p.light:p.shade;
     const opacity=random(r,.04,.31);
     if(g.water==='none')continue;
     if(g.water==='blocks')surfaceMark(ctx,x,y,0,color,opacity,r,{...g,brush:'mosaic'},.8);
     else if(g.water==='mirror')path(ctx,[[x,y],[x+xsize,y]],color,random(r,.4,2.2),opacity);
     else path(ctx,[[x,y],[x+xsize/2,y+random(r,-2,2)],[x+xsize,y]],color,random(r,.6,2),opacity);
   }
 }
 return lastProfiles;
}
function plant(ctx,x,y,s,r,p,g,scene){
 const growth=g.growth;
 if(growth==='none')return;
 const base=scene==='forest'?p.land[3]:p.shade;
 const tint=one(r,[p.shade,p.land[3],p.land[4]]);
 if(growth==='grass'){
   for(let i=0;i<5;i++)path(ctx,[[x,y],[x+random(r,-s,s)*.65,y-random(r,s*.6,s*1.8)]],tint,Math.max(.6,s*.035),random(r,.18,.5));
   return;
 }
 if(growth==='spire'){
   path(ctx,[[x,y],[x+random(r,-s*.1,s*.1),y-s*2.4]],base,Math.max(1.3,s*.12),.6);
   for(let j=0;j<6;j++){
     const high=y-s*2.2+j*s*.3,width=s*(.2+j*.09);
     path(ctx,[[x,high-s*.25],[x-width,high+s*.2],[x+width,high+s*.2]],tint,Math.max(.7,s*.065),.62);
   }
   return;
 }
 const top=y-s*2.3,tx=x+random(r,-s*.22,s*.22);
 path(ctx,[[x,y],[tx,top]],base,Math.max(.8,s*.10),.78);
 if(growth==='fan'){
   for(let i=0;i<9;i++){
     const a=random(r,-PI*.88,-PI*.12),len=random(r,s*.5,s*1.5);
     path(ctx,[[tx,top+s*.5],[tx+Math.cos(a)*len,top+s*.5+Math.sin(a)*len]],tint,random(r,1,3),.72);
   }
 } else {
   let tips=[[tx,top+s*.2,0,s*1.1]];
   for(let depth=0;depth<3;depth++){
     const next=[];
     for(const [bx,by,ang,len] of tips){
       for(const side of [-1,1]){
         const a=ang+side*random(r,.28,.81),length=len*random(r,.47,.69);
         const ex=bx+Math.sin(a)*length,ey=by-Math.cos(a)*length;
         path(ctx,[[bx,by],[ex,ey]],depth===0?base:tint,Math.max(.7,s*.06*(1-depth*.23)),.65);
         if(depth<2)next.push([ex,ey,a,length]);
         else blob(ctx,ex,ey,random(r,2,6),random(r,1.5,4),p.land[2],.42);
       }
     }
     tips=next;
   }
 }
}
function vegetation(ctx,seed,p,g,scene,signal,quality){
 if(!['forest','plains','hills','lake','mountains'].includes(scene)||g.growth==='none')return;
 const r=randomFrom(seed^0x48abc),count=Math.floor((scene==='forest'?116:scene==='plains'?15:scene==='mountains'?36:66)*quality);
 for(let i=0;i<count;i++){
   if(signal?.aborted)return;
   const x=random(r,-20,W+20),depth=r()>.34?g.bands-1:g.bands-2;
   const y=heightAt(clamp(x/W),depth,g,scene,seed),size=random(r,9,28)*(depth===g.bands-1?1:.58);
   if(y<30||y>H*.94)continue;
   plant(ctx,x,y,size,r,p,g,scene);
 }
}
// A mutable composition operation can change the *kind* of landscape
// representation: a valley may acquire a perspective river, an escarpment a
// great cliff, a basin a crater pool. These are not overlays of stored images.
function compose(ctx,seed,p,g,scene,quality){
 const r=randomFrom(seed^0x7c933),h=H*g.horizon;
 if(g.layout==='valley' && scene!=='coast'){
   const vx=W*(.35+.29*r()),start=h+random(r,35,105);
   const waterish=scene==='lake'||scene==='forest'||r()>.55;
   const col=waterish?p.water[0]:p.land[1];
   ctx.save();ctx.globalAlpha=.86;ctx.fillStyle=col;ctx.beginPath();
   ctx.moveTo(vx-4,start);
   ctx.bezierCurveTo(vx-20,h+120,vx-W*.22,H*.70,vx-W*.31,H);
   ctx.lineTo(vx+W*.30,H);ctx.bezierCurveTo(vx+W*.14,H*.69,vx+24,h+130,vx+4,start);
   ctx.closePath();ctx.fill();ctx.restore();
   for(let i=0;i<Math.floor(140*quality);i++){
     const y=random(r,start,H),t=(y-start)/Math.max(1,H-start),mid=vx+Math.sin(t*PI*2)*W*.032;
     const x=random(r,mid-t*W*.20,mid+t*W*.21);
     path(ctx,[[x,y],[x+random(r,2,24)*(t+.15),y]],waterish?p.light:p.shade,random(r,.3,2),random(r,.05,.20));
   }
 } else if(g.layout==='escarpment'){
   const left=g.lightAngle>0,edge=left?W*.38:W*.62;
   const start=left?0:W,end=left?edge:edge;
   const top=h*.28;
   ctx.save();ctx.fillStyle=p.land[3];ctx.globalAlpha=.92;
   ctx.beginPath();ctx.moveTo(start,top);
   ctx.lineTo(end,top+random(r,60,120));
   ctx.lineTo(end+(left?80:-80),H*.90);
   ctx.lineTo(start,H);ctx.closePath();ctx.fill();ctx.restore();
   for(let i=0;i<Math.floor(250*quality);i++){
     const x=random(r,Math.min(start,end),Math.max(start,end)),y=random(r,top+145,H);
     if((left&&x>edge+(y/H)*42)||(!left&&x<edge-(y/H)*42))continue;
     const bend=evalForm(g.detail,y/H+i*.002,seed)*24;
     path(ctx,[[x,y],[x+bend,y+random(r,6,41)]],r()>.5?p.mist:p.shade,random(r,.5,3.2),random(r,.065,.25));
   }
 } else if(g.layout==='basin' && scene!=='coast'){
   const cx=W*(.38+.23*r()),cy=H*.82,rx=random(r,W*.25,W*.37),ry=random(r,54,116);
   ctx.save();ctx.globalAlpha=.85;ctx.fillStyle=p.land[2];
   ctx.beginPath();ctx.ellipse(cx,cy,rx+22,ry+20,0,0,2*PI);ctx.fill();
   ctx.fillStyle=scene==='plains'?p.land[0]:p.water[0];
   ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,2*PI);ctx.fill();ctx.restore();
   for(let i=0;i<Math.floor(95*quality);i++){
     const x=random(r,cx-rx*.8,cx+rx*.8),rel=(x-cx)/rx;
     const yy=cy+random(r,-1,1)*ry*Math.sqrt(Math.max(.1,1-rel*rel));
     path(ctx,[[x,yy],[x+random(r,7,40),yy]],p.light,random(r,.4,1.8),random(r,.07,.22));
   }
 } else if(g.layout==='islands' && scene!=='coast' && scene!=='lake'){
   // A lake/channel can arise in a surprising landscape, replacing foreground
   // geometry with reflective negative space instead of endlessly stacking hills.
   const y=H*.73;
   ctx.save();ctx.fillStyle=p.water[0];ctx.globalAlpha=.74;
   ctx.beginPath();ctx.moveTo(0,y+45);
   for(let x=0;x<=W;x+=20)ctx.lineTo(x,y+evalForm(g.terrain,x/W,seed+811)*32);
   ctx.lineTo(W,H*.93);
   for(let x=W;x>=0;x-=20)ctx.lineTo(x,H*.92+evalForm(g.detail,x/W,seed+911)*22);
   ctx.closePath();ctx.fill();ctx.restore();
 }
}
function finalGlaze(ctx,seed,p,g,quality){
 const r=randomFrom(seed^0xab451),count=Math.floor(300*quality);
 for(let i=0;i<count;i++){
   const x=random(r,0,W),y=random(r,0,H),col=r()>.38?p.mist:p.shade;
   blob(ctx,x,y,random(r,.2,1.7),random(r,.2,1.5),col,random(r,.014,.055));
 }
}
const nextFrame=()=>new Promise(resolve=>typeof requestAnimationFrame==='function'?requestAnimationFrame(resolve):setTimeout(resolve,0));
export async function renderLandscape(canvas,recipe,{onProgress,signal,animate=true,quality=1}={}){
 const g=recipe.genome || makeGenome('landscape',recipe.seed);
 if(evaluateSurface(g).length)throw Error('Invalid painting procedure');
 const scene=SCENES.includes(recipe.scene)?recipe.scene:'hills',mood=MOODS.includes(recipe.mood)?recipe.mood:'golden';
 const p=gradePalette(palettes[mood],g),seed=Number(recipe.seed)>>>0,ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Canvas 2D is unavailable');
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
 const tasks=[['painting the atmosphere',()=>background(ctx,seed,p,g,H*g.horizon,quality)],
   ['inventing the terrain',()=>land(ctx,seed,p,g,scene,signal,quality)],
   ['testing the composition',()=>compose(ctx,seed,p,g,scene,quality)],
   ['growing the foreground',()=>vegetation(ctx,seed,p,g,scene,signal,quality)],
   ['finishing the brushwork',()=>finalGlaze(ctx,seed,p,g,quality)]];
 for(let i=0;i<tasks.length;i++){
   if(signal?.aborted)return false;
   onProgress?.(tasks[i][0],i/tasks.length);tasks[i][1]();
   if(animate)await nextFrame();
 }
 if(signal?.aborted)return false;
 onProgress?.('finished',1);return true;
}
export function landscapeDescription(recipe){
 return `${recipe.mood} ${recipe.scene} · ${methodDescription(recipe.genome)}`;
}
export function landscapeFeatures(recipe){
 const g=recipe.genome;return {scene:recipe.scene,mood:recipe.mood, ...(g?importGeneFeatures(g):{}),discipline:'landscape'};
}
import {geneFeatures as importGeneFeatures} from './evolution.js';
