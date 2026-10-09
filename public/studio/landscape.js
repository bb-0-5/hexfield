/* Hexfield Studio 295 — entirely procedural landscape painting.
 * No sampled images, reference drawings, harvested strokes, or external assets.
 * A recipe and seed deterministically produce the same composition at any size.
 */
const WIDTH = 1200;
const HEIGHT = 740;
export const SCENES = ['mountains', 'coast', 'forest', 'plains', 'hills', 'lake'];
export const MOODS = ['golden', 'mist', 'storm', 'twilight'];

function randomFrom(seed) {
  let n = Number(seed) >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (rng, lo, hi) => lo + (hi - lo) * rng();
const choose = (rng, a) => a[Math.floor(rng() * a.length)];
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const palettes = {
  golden: {
    sky: ['#354e6d', '#b58a82', '#f4c6a3'], earth: ['#80918c', '#607d6e', '#44584e', '#263f37'],
    water: ['#637f88', '#b8a695'], light: '#ffe2a0', mist: '#fae5bf', ink: '#1a3433',
  },
  mist: {
    sky: ['#5a7788', '#b6c4c5', '#e5dfd1'], earth: ['#a8b4ad', '#7d9b93', '#4d746d', '#314f4c'],
    water: ['#8faeb2', '#cbd8ce'], light: '#fff2dc', mist: '#e9efea', ink: '#2d5554',
  },
  storm: {
    sky: ['#283647', '#59677a', '#98a5a8'], earth: ['#738b8d', '#506b72', '#364f59', '#213842'],
    water: ['#546c7d', '#9baaae'], light: '#e9dbb9', mist: '#b7bec0', ink: '#172d39',
  },
  twilight: {
    sky: ['#272b50', '#735f82', '#d88c83'], earth: ['#85778b', '#64536d', '#403e59', '#282d49'],
    water: ['#665e86', '#bd8995'], light: '#ffd4ba', mist: '#c4a4b6', ink: '#1f2745',
  },
};
function toRGB(hex) { const n = parseInt(hex.slice(1),16); return [(n >> 16)&255,(n >> 8)&255,n&255]; }
function mixed(c1,c2,t) { const a=toRGB(c1),b=toRGB(c2); return `rgb(${a.map((v,i)=>Math.round(v*(1-t)+b[i]*t)).join(',')})`; }
function alpha(hex, opacity) {const a=toRGB(hex);return `rgba(${a[0]},${a[1]},${a[2]},${opacity})`;}
function hash01(n) { const a = Math.sin(n*127.1+78.233)*43758.5453; return a-Math.floor(a); }
function smoothNoise(x, seed) {
  const a = Math.floor(x),t=x-a,u=t*t*(3-2*t);
  return (hash01(a+seed*17)*(1-u)+hash01(a+1+seed*17)*u)*2-1;
}
function relief(x,seed,scale=1) {
  return (smoothNoise(x*0.003*scale,seed)*.60 + smoothNoise(x*.010*scale,seed+5)*.28 + smoothNoise(x*.035*scale,seed+10)*.12);
}
function profile(x,layer,scene,seed,horizon) {
  const t=layer/3;
  const n=relief(x,seed+layer*101,1+t*.8);
  if(scene==='mountains') {
    const peak1=Math.max(0,1-Math.abs(x-(220+hash01(seed)*140))/380);
    const peak2=Math.max(0,1-Math.abs(x-(740+hash01(seed+3)*120))/310);
    return horizon+75+layer*82-n*(76+layer*16)-(peak1*(215-layer*28)+peak2*(155-layer*20));
  }
  if(scene==='coast') return horizon + 70+layer*83 - n*(38+layer*11) - Math.exp(-Math.pow((x-975)/245,2))*150*(layer===2 ? 1:0.4);
  if(scene==='lake') return horizon+38+layer*82-n*(50+layer*8);
  if(scene==='forest') return horizon-12+layer*99-n*(53+layer*4);
  if(scene==='plains') return horizon+layer*90-n*(23+layer*7);
  return horizon-6+layer*87-n*(54+layer*16);
}
function ellipseBrush(ctx,x,y,rX,rY,col,opacity=1,angle=0) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=opacity;ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(0,0,rX,rY,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function paintSky(ctx,seed,p,horizon,signal) {
  const rng=randomFrom(seed ^ 0x13579ac);
  const sky=ctx.createLinearGradient(0,0,0,HEIGHT);
  sky.addColorStop(0,p.sky[0]);sky.addColorStop(.50,p.sky[1]);sky.addColorStop(1,p.sky[2]);
  ctx.fillStyle=sky;ctx.fillRect(0,0,WIDTH,HEIGHT);
  // Thin glowing atmosphere just over the horizon.
  const glow=ctx.createLinearGradient(0,horizon-130,0,horizon+135);
  glow.addColorStop(0,alpha(p.mist,0));glow.addColorStop(.46,alpha(p.mist,.28));glow.addColorStop(1,alpha(p.mist,0));
  ctx.fillStyle=glow;ctx.fillRect(0,horizon-130,WIDTH,270);
  const sunX=between(rng,WIDTH*.20,WIDTH*.82),sunY=between(rng,horizon*.2,horizon*.56);
  const radial=ctx.createRadialGradient(sunX,sunY,8,sunX,sunY,260);
  radial.addColorStop(0,alpha(p.light,.35));radial.addColorStop(.4,alpha(p.light,.12));radial.addColorStop(1,alpha(p.light,0));
  ctx.fillStyle=radial;ctx.fillRect(sunX-260,sunY-260,520,520);
  ellipseBrush(ctx,sunX,sunY,between(rng,22,37),between(rng,22,37),p.light,.8);
  // Cloud banks composed of varied translucent elongated brush marks.
  const clusters=12;
  for(let i=0;i<clusters;i++){
    if(signal?.aborted)return;
    const x=between(rng,-100,WIDTH+50),y=between(rng,15,horizon*.76),extent=between(rng,85,260);
    for(let j=0;j<10;j++) {
      ellipseBrush(ctx,x+between(rng,-extent,extent),y+between(rng,-14,14),
        between(rng,35,120),between(rng,2,12),p.mist,between(rng,.025,.13),between(rng,-.10,.10));
    }
  }
  // Broad horizontal, irregular bands of painterly sky texture.
  for(let i=0;i<110;i++) {
    const x=between(rng,-30,WIDTH),y=between(rng,3,horizon);
    ellipseBrush(ctx,x,y,between(rng,12,150),between(rng,.4,2.7),
      rng()>.4?p.mist:p.sky[0],between(rng,.015,.075));
  }
}
function fillRidge(ctx,fn,color) {
  ctx.beginPath();ctx.moveTo(0,HEIGHT);
  for(let x=0;x<=WIDTH+8;x+=8)ctx.lineTo(x,fn(x));
  ctx.lineTo(WIDTH,HEIGHT);ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function paintWater(ctx,rng,p,top) {
  const sea=ctx.createLinearGradient(0,top,0,HEIGHT);
  sea.addColorStop(0,p.water[1]);sea.addColorStop(.45,p.water[0]);sea.addColorStop(1,mixed(p.water[0],p.ink,.35));
  ctx.fillStyle=sea;ctx.fillRect(0,top,WIDTH,HEIGHT-top);
  // Thin horizontal reflections, progressively wider towards the viewer.
  for(let i=0;i<790;i++) {
    const x=between(rng,0,WIDTH),y=between(rng,top,HEIGHT),depth=(y-top)/(HEIGHT-top);
    const width=between(rng,4,24+depth*67);
    ctx.strokeStyle=alpha(rng()>.48?p.mist:p.ink,between(rng,.05,.25));
    ctx.lineWidth=between(rng,.5,1.5+depth);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();
  }
}
function paintGround(ctx,seed,p,scene,horizon,signal) {
  const rng=randomFrom(seed ^ 0x918377);
  const drawRidge = layer => {
    const fn=x=>profile(x,layer,scene,seed,horizon);
    const color=mixed(p.earth[layer],p.mist,[.22,.11,.05,0][layer]);
    fillRidge(ctx,fn,color);
    // Directional broken marks follow slopes instead of random canvas noise.
    const n=layer===3?420:layer===2?160:75;
    for(let i=0;i<n;i++) {
      const x=between(rng,0,WIDTH),terrain=fn(x),y=terrain+between(rng,5,Math.max(7,(HEIGHT-terrain)*.79));
      if(y>HEIGHT)continue;
      const slope=(fn(Math.min(WIDTH,x+5))-fn(Math.max(0,x-5)))/10;
      const len=between(rng,3,29)*(1+.15*layer);
      ctx.strokeStyle=alpha(rng()>.65?p.mist:p.ink,between(rng,.035,.16));
      ctx.lineWidth=between(rng,.6,2.9)*(1+.2*layer);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y+len*slope*.45);ctx.stroke();
    }
    if(layer<2){
      const g=ctx.createLinearGradient(0,horizon+layer*80-8,0,horizon+layer*80+110);
      g.addColorStop(0,alpha(p.mist,0));g.addColorStop(.62,alpha(p.mist,.08));g.addColorStop(1,alpha(p.mist,0));
      ctx.fillStyle=g;ctx.fillRect(0,horizon+layer*80-8,WIDTH,118);
    }
  };
  if(scene==='coast') {
    paintWater(ctx,rng,p,horizon+40);
    // Layered headlands flank an open ocean; do not bury the water in terrain.
    ctx.beginPath();ctx.moveTo(0,horizon+16);
    ctx.bezierCurveTo(110,horizon+4,170,horizon+55,300,horizon+95);
    ctx.bezierCurveTo(378,horizon+160,380,horizon+240,470,HEIGHT);
    ctx.lineTo(0,HEIGHT);ctx.closePath();ctx.fillStyle=p.earth[2];ctx.fill();
    ctx.beginPath();ctx.moveTo(WIDTH,horizon+55);
    ctx.bezierCurveTo(1130,horizon+60,1090,horizon+101,1050,horizon+110);
    ctx.bezierCurveTo(980,horizon+135,965,horizon+180,910,horizon+235);
    ctx.lineTo(WIDTH,HEIGHT);ctx.closePath();ctx.fillStyle=mixed(p.earth[1],p.mist,.35);ctx.fill();
    const islandX=between(rng,630,770);
    ellipseBrush(ctx,islandX,horizon+44,between(rng,85,145),between(rng,10,19),p.earth[0],.74);
    return;
  }
  if(scene==='lake') {
    drawRidge(0);drawRidge(1);
    paintWater(ctx,rng,p,horizon+128);
    // Nearest shoreline only: keep the central water plane uninterrupted.
    drawRidge(3);
    return;
  }
  for(let layer=0;layer<4;layer++){
    if(signal?.aborted)return;
    drawRidge(layer);
  }
}
function tree(ctx,x,y,s,rng,p,depth=0) {
  const dark=mixed(p.ink,p.earth[depth?1:3],depth?.52:.18);
  ctx.lineCap='round';ctx.strokeStyle=alpha(dark,.88);ctx.lineWidth=Math.max(.8,s*.09);
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s*.07,y-s*2.2);ctx.stroke();
  const crown=y-s*2.07;
  for(let i=0;i<7;i++){
    ellipseBrush(ctx,x+between(rng,-s*.85,s*.95),crown+between(rng,-s*.9,s*.38),
      between(rng,s*.35,s*.78),between(rng,s*.35,s*.7),
      rng()>.44?dark:p.earth[depth?1:2],between(rng,.53,.92));
  }
  ellipseBrush(ctx,x+s*.15,crown-s*.48,s*.6,s*.29,p.mist,.10);
}
function vegetation(ctx,seed,p,scene,horizon,signal) {
  if(!['forest','plains','hills','lake','mountains'].includes(scene))return;
  const rng=randomFrom(seed ^ 0xa9de3b);
  let count=scene==='forest'?125:scene==='plains'?17:scene==='mountains'?34:64;
  for(let i=0;i<count;i++) {
    if(signal?.aborted)return;
    const x=between(rng,-15,WIDTH+15),layer=rng()>.55?3:2;
    const base=profile(x,layer,scene,seed,horizon);
    if(base<0||base>HEIGHT-12)continue;
    const s=between(rng,5,scene==='forest'?24:17)*(layer===2?.65:1.15);
    tree(ctx,x,base,s,rng,p,layer===2?1:0);
  }
  for(let i=0;i<220;i++){
    const x=between(rng,0,WIDTH),y=between(rng,HEIGHT*.81,HEIGHT);
    ctx.strokeStyle=alpha(rng()>.5?p.mist:p.ink,between(rng,.06,.23));
    ctx.lineWidth=between(rng,.6,2.1);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+between(rng,-3,3),y-between(rng,3,13));ctx.stroke();
  }
}
function foreground(ctx,seed,p,scene,horizon) {
  const rng=randomFrom(seed ^ 0x13437d);
  // Atmospheric glaze ties unlike strokes together.
  const g=ctx.createLinearGradient(0,0,0,HEIGHT);
  g.addColorStop(0,alpha(p.mist,.015));g.addColorStop(.72,alpha(p.mist,.04));g.addColorStop(1,alpha(p.ink,.09));
  ctx.fillStyle=g;ctx.fillRect(0,0,WIDTH,HEIGHT);
  if(scene==='coast') {
    // A wedge of near shore and flashes of wet light.
    ctx.beginPath();ctx.moveTo(0,HEIGHT);ctx.lineTo(0,HEIGHT*.72);
    ctx.bezierCurveTo(180,HEIGHT*.68,290,HEIGHT*.87,520,HEIGHT);ctx.closePath();
    ctx.fillStyle=p.earth[3];ctx.fill();
    for(let i=0;i<125;i++){
      const x=between(rng,0,470),y=between(rng,HEIGHT*.73,HEIGHT);
      if(x>470*(y/HEIGHT-.63)*3)continue;
      ellipseBrush(ctx,x,y,between(rng,2,18),between(rng,.5,2),p.mist,between(rng,.06,.31));
    }
  }
  if(scene==='lake') {
    for(let i=0;i<140;i++){
      const x=between(rng,0,WIDTH),y=between(rng,horizon+140,HEIGHT*.88);
      ctx.strokeStyle=alpha(p.mist,between(rng,.055,.23));ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+between(rng,4,40),y);ctx.stroke();
    }
  }
  // Low-frequency fine grain at a scale independent of export size.
  for(let i=0;i<520;i++){
    const x=between(rng,0,WIDTH),y=between(rng,0,HEIGHT);
    ellipseBrush(ctx,x,y,between(rng,.25,1.5),between(rng,.2,.8),p.mist,between(rng,.02,.10));
  }
}

function nextFrame() {return new Promise(resolve=>requestAnimationFrame(resolve));}
export async function renderLandscape(canvas,recipe,{onProgress,signal,animate=true}={}) {
  const seed=Number(recipe.seed)>>>0,scene=SCENES.includes(recipe.scene)?recipe.scene:'hills';
  const mood=MOODS.includes(recipe.mood)?recipe.mood:'golden',p=palettes[mood];
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('2D canvas unavailable');
  const W=canvas.width,H=canvas.height;
  ctx.setTransform(W/WIDTH,0,0,H/HEIGHT,0,0);
  const horizon=between(randomFrom(seed ^ 0x114),285,390);
  const tasks=[
    ['laying light',()=>paintSky(ctx,seed,p,horizon,signal)],
    ['building distance',()=>paintGround(ctx,seed,p,scene,horizon,signal)],
    ['finding detail',()=>vegetation(ctx,seed,p,scene,horizon,signal)],
    ['finishing surface',()=>foreground(ctx,seed,p,scene,horizon)],
  ];
  for(let i=0;i<tasks.length;i++){
    if(signal?.aborted)return false;
    onProgress?.(tasks[i][0],i/tasks.length);
    tasks[i][1]();
    if(animate)await nextFrame();
  }
  if(signal?.aborted)return false;
  onProgress?.('finished',1);
  return true;
}
export function landscapeDescription(recipe) {
  return `${recipe.mood} / ${recipe.scene}`;
}
export function landscapeFeatures(recipe) {
  return {scene:recipe.scene,mood:recipe.mood,discipline:'landscape'};
}
