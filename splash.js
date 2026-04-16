/* ── PANTRY PRO · splash.js ──────────────────────────────────────────
   Splash screen — shown once on every load if enabled in settings.
   Renders on a canvas overlay, dismisses after one full loop.
── */

(function(){

function splashEnabled(){ return ls('setting_splash', true); }

const ML=[
  {dome:[[0,'#888'],[.12,'#f0f0f0'],[.28,'#c8c8c8'],[.5,'#e8e8e8'],[.72,'#a0a0a0'],[.88,'#d8d8d8'],[1,'#787878']],knurl:'rgba(60,60,60,0.22)',hi:'rgba(255,255,255,0.80)',edge:'rgba(40,40,40,0.45)'},
  {dome:[[0,'#7a5c12'],[.12,'#e0b030'],[.28,'#c89820'],[.5,'#f0d060'],[.72,'#b08818'],[.88,'#d8aa28'],[1,'#6a4e0e']],knurl:'rgba(60,40,0,0.25)',hi:'rgba(255,240,180,0.75)',edge:'rgba(40,28,0,0.5)'},
  {dome:[[0,'#5a3010'],[.12,'#c07838'],[.28,'#a05828'],[.5,'#d09050'],[.72,'#885020'],[.88,'#b87030'],[1,'#4a2808']],knurl:'rgba(40,20,0,0.28)',hi:'rgba(240,200,140,0.6)',edge:'rgba(30,15,0,0.55)'},
  {dome:[[0,'#1e2228'],[.12,'#4a5260'],[.28,'#383e48'],[.5,'#5a6270'],[.72,'#2e3440'],[.88,'#424a58'],[1,'#181e24']],knurl:'rgba(0,0,0,0.35)',hi:'rgba(180,200,220,0.45)',edge:'rgba(0,0,0,0.6)'},
  {dome:[[0,'#7a4840'],[.12,'#e0a090'],[.28,'#c88070'],[.5,'#f0b8a8'],[.72,'#b07060'],[.88,'#d89080'],[1,'#6a3830']],knurl:'rgba(50,20,18,0.22)',hi:'rgba(255,220,210,0.7)',edge:'rgba(40,16,14,0.45)'},
];

function buildJarData(){
  const rf=()=>Math.round((0.20+Math.random()*0.75)*100)/100;
  const rm=prev=>{let m=Math.floor(Math.random()*5);if(m===prev)m=(m+1)%5;return m;};
  const j=(l,col,prev)=>{const m=rm(prev);return{l,fill:rf(),col,m};};
  const P=[];
  P.push(j('P','#48a971',-1));P.push(j('A','#5A8DB8',P[0].m));
  P.push(j('N','#C7824A',P[1].m));P.push(j('T','#48a971',P[2].m));
  P.push(j('R','#C85A5A',P[3].m));P.push(j('Y','#5A8DB8',P[4].m));
  const R=[];
  R.push(j('P','#48a971',-1));R.push(j('R','#C7824A',R[0].m));
  R.push(j('O','#5A8DB8',R[1].m));
  return{P,R};
}

function seededShuffle(arr,seed){
  const a=[...arr]; let s=seed|0;
  for(let i=a.length-1;i>0;i--){
    s=(s*1664525+1013904223)&0xffffffff;
    const j=Math.abs(s)%(i+1);
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const prog=(s,e,n)=>clamp((n-s)/(e-s),0,1);
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut4=t=>1-Math.pow(1-t,4);
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

function dropBounce(t){
  if(t<=0)return 0;if(t>=1)return 1;
  if(t<0.60)return Math.min(1,Math.pow(t/0.60,2.2));
  const bt=(t-0.60)/0.40;
  return 1.0-0.10*Math.sin(bt*Math.PI);
}

function drawShelf(ctx,x,y,w,alpha){
  if(alpha<=0)return;
  ctx.save();ctx.globalAlpha=alpha;
  const h=Math.max(6,w*0.014);
  ctx.fillStyle='#1e2d3d';ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.roundRect(x,y,w,h,h*0.4);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(x+4,y+1);ctx.lineTo(x+w-4,y+1);ctx.stroke();
  const sg=ctx.createLinearGradient(0,y+h,0,y+h*4);
  sg.addColorStop(0,'rgba(0,0,0,0.22)');sg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sg;ctx.fillRect(x,y+h,w,h*3);
  ctx.restore();
}

function drawJar(ctx,cx,cy,jW,jH,letter,fillPct,col,metal,alpha,letterAlpha){
  if(alpha<=0)return;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx,cy);
  const x=-jW/2,lidH=jH*0.16,bodyY=lidH,bodyH=jH-lidH,br=jW*0.11;
  if(fillPct>0){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x+br,bodyY);ctx.lineTo(x+jW-br,bodyY);ctx.quadraticCurveTo(x+jW,bodyY,x+jW,bodyY+br);
    ctx.lineTo(x+jW,bodyY+bodyH-br);ctx.quadraticCurveTo(x+jW,bodyY+bodyH,x+jW-br,bodyY+bodyH);
    ctx.lineTo(x+br,bodyY+bodyH);ctx.quadraticCurveTo(x,bodyY+bodyH,x,bodyY+bodyH-br);
    ctx.lineTo(x,bodyY+br);ctx.quadraticCurveTo(x,bodyY,x+br,bodyY);
    ctx.closePath();ctx.clip();
    const fH=bodyH*fillPct,fY=bodyY+bodyH-fH;
    const g=ctx.createLinearGradient(0,fY,0,fY+fH);
    g.addColorStop(0,col+'55');g.addColorStop(1,col+'99');
    ctx.fillStyle=g;ctx.fillRect(x,fY,jW,fH);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(x+br,bodyY);ctx.lineTo(x+jW-br,bodyY);ctx.quadraticCurveTo(x+jW,bodyY,x+jW,bodyY+br);
  ctx.lineTo(x+jW,bodyY+bodyH-br);ctx.quadraticCurveTo(x+jW,bodyY+bodyH,x+jW-br,bodyY+bodyH);
  ctx.lineTo(x+br,bodyY+bodyH);ctx.quadraticCurveTo(x,bodyY+bodyH,x,bodyY+bodyH-br);
  ctx.lineTo(x,bodyY+br);ctx.quadraticCurveTo(x,bodyY,x+br,bodyY);
  ctx.closePath();
  ctx.fillStyle='rgba(15,24,32,0.65)';ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1.5;ctx.stroke();
  const capW=jW*0.90,capH=lidH,capX=-capW/2,capR=capH*0.45;
  const dg=ctx.createLinearGradient(capX,0,capX+capW,0);
  metal.dome.forEach(([p,c])=>dg.addColorStop(p,c));
  ctx.fillStyle=dg;ctx.strokeStyle=metal.edge;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.roundRect(capX,0,capW,capH,[capR,capR,2,2]);ctx.fill();ctx.stroke();
  const rg=ctx.createRadialGradient(-capW*0.1,capH*0.22,0,0,capH*0.5,capW*0.5);
  rg.addColorStop(0,'rgba(255,255,255,0.18)');rg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rg;ctx.beginPath();ctx.roundRect(capX,0,capW,capH,[capR,capR,2,2]);ctx.fill();
  ctx.save();ctx.beginPath();ctx.roundRect(capX,capH*0.6,capW,capH*0.4,[0,0,2,2]);ctx.clip();
  ctx.strokeStyle=metal.knurl;ctx.lineWidth=0.8;
  for(let i=0;i<13;i++){const lx=capX+1+i*(capW-2)/13;ctx.beginPath();ctx.moveTo(lx,capH*0.6);ctx.lineTo(lx,capH);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle=metal.hi;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(capX+capW*0.12,capH*0.18);ctx.lineTo(capX+capW*0.72,capH*0.18);ctx.stroke();
  if(letter&&(letterAlpha??1)>0){
    ctx.save();ctx.globalAlpha*=(letterAlpha??1);
    ctx.font=`700 ${jW*0.78}px 'DM Mono', monospace`;
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=3;
    ctx.fillText(letter,0,bodyY+bodyH*0.47);
    ctx.shadowBlur=0;ctx.restore();
  }
  ctx.restore();
}

// Block app from showing immediately — insert dark overlay synchronously
(function(){
  try { const v=localStorage.getItem('setting_splash'); if(v==='false') return; } catch(e){}
  function insertBlocker(){
    if(document.getElementById('splashBlocker')) return;
    const b = document.createElement('div');
    b.id = 'splashBlocker';
    b.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#0c1117;';
    document.body.appendChild(b);
  }
  if(document.body) insertBlocker();
  else document.addEventListener('DOMContentLoaded', insertBlocker);
})();

window.splashShow = function(){
  if(!splashEnabled()) return;

  // Remove the plain blocker if present
  const blocker = document.getElementById('splashBlocker');
  if(blocker) blocker.remove();
  overlay.id = 'splashOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#0c1117;';

  const cv = document.createElement('canvas');
  const DPR = window.devicePixelRatio || 1;
  cv.style.cssText = 'display:block;width:100%;height:100%;';
  overlay.appendChild(cv);

  // Skip tap
  overlay.addEventListener('click', dismiss);

  document.body.appendChild(overlay);

  let W, H;
  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W*DPR; cv.height = H*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  const ctx = cv.getContext('2d');
  resize();

  const TARGET=480, FALL_DUR=Math.round(TARGET*0.20), HOLD_END=TARGET-FALL_DUR;
  const STAGGER=7, DROP=40, LETTER_FADE=30;
  let frame=0, jarsP, jarsR, dropSeeds, rafId;

  function initJars(){
    const d=buildJarData(); jarsP=d.P; jarsR=d.R;
    dropSeeds={top:Math.random()*99999|0, bot:Math.random()*99999|0};
  }
  initJars();

  function dismiss(){
    cancelAnimationFrame(rafId);
    overlay.style.transition='opacity 0.4s';
    overlay.style.opacity='0';
    setTimeout(()=>overlay.remove(), 400);
  }

  function tick(){
    const lf = frame % TARGET;
    if(lf === 0 && frame > 0){
      dismiss();
      return;
    }

    ctx.fillStyle='#0c1117'; ctx.fillRect(0,0,W,H);

    const jW=Math.min(W/(jarsP.length+2),H*0.14,72);
    const jH=jW*1.6, gap=jW*0.18, unit=jW+gap;

    const shelfSpacing=jH*0.55, shelfH=Math.max(6,W*0.014);
    const blockH=jH+shelfH+shelfSpacing+jH+shelfH;
    const blockTop=H/2-blockH/2;
    const topShelfY=blockTop+jH, botShelfY=topShelfY+jH+shelfH+shelfSpacing;
    const topRestY=topShelfY-jH, botRestY=botShelfY-jH;

    const totalJars=Math.ceil(W/unit)+2;
    const shelfX=W/2-(totalJars*unit)/2;
    const pantryFirstX=W/2-(jarsP.length-1)/2*unit;
    const proFirstX=W/2-(jarsR.length-1)/2*unit;
    const topNamedStart=Math.round((pantryFirstX-(shelfX+unit/2))/unit);
    const botNamedStart=Math.round((proFirstX-(shelfX+unit/2))/unit);
    const topGridOrigin=pantryFirstX-topNamedStart*unit;
    const botGridOrigin=proFirstX-botNamedStart*unit;

    const inFall=lf>=HOLD_END;
    const shelfFadeOut=inFall?Math.max(0,1-easeIO(prog(HOLD_END,HOLD_END+FALL_DUR*0.55,lf))):1;
    const botOrderIdx=seededShuffle(Array.from({length:totalJars},(_,i)=>i),dropSeeds.bot);
    const topOrderIdx=seededShuffle(Array.from({length:totalJars},(_,i)=>i),dropSeeds.top);
    const botLastStep=totalJars-1;
    const topShelfDelay=botLastStep*STAGGER+DROP+8;
    const topShelfAlpha=easeIO(prog(topShelfDelay,topShelfDelay+DROP*1.2,lf))*shelfFadeOut;
    const botShelfAlpha=easeIO(prog(0,DROP*1.2,lf))*shelfFadeOut;
    const botDropAt=new Array(totalJars); botOrderIdx.forEach((pos,step)=>{botDropAt[pos]=step;});
    const topDropAt=new Array(totalJars); topOrderIdx.forEach((pos,step)=>{topDropAt[pos]=step;});

    drawShelf(ctx,topGridOrigin-unit*0.5,topShelfY,totalJars*unit,topShelfAlpha);
    drawShelf(ctx,botGridOrigin-unit*0.5,botShelfY,totalJars*unit,botShelfAlpha);

    const topLastLand=topShelfDelay+(totalJars-1)*STAGGER+DROP;
    const botLastLand=(totalJars-1)*STAGGER+DROP;
    const allLanded=Math.max(topLastLand,botLastLand);
    const letterAlpha=easeOut4(prog(allLanded,allLanded+LETTER_FADE,lf));

    // Bottom shelf
    for(let ji=0;ji<totalJars;ji++){
      const namedI=ji-botNamedStart, isNamed=namedI>=0&&namedI<jarsR.length;
      const jar=isNamed?jarsR[namedI]:null;
      const step=botDropAt[ji], startF=step*STAGGER;
      const t=prog(startF,startF+DROP,lf); if(t<=0)continue;
      const finalX=botGridOrigin+ji*unit, jarY=lerp(-jH,botRestY,dropBounce(t));
      const m=isNamed?jar.m:((ji*3+1)%5+5)%5, col=isNamed?jar.col:'#48a971';
      let fallY=0; if(inFall){const ft=clamp((lf-HOLD_END-ji*1.5)/(FALL_DUR*0.45),0,1);fallY=ft*ft*ft*(H+jH*2);}
      drawJar(ctx,finalX,jarY+fallY,jW,jH,isNamed?jar.l:'',isNamed?jar.fill:0,col,ML[m]||ML[0],1,letterAlpha);
    }
    // Top shelf
    for(let ji=0;ji<totalJars;ji++){
      const namedI=ji-topNamedStart, isNamed=namedI>=0&&namedI<jarsP.length;
      const jar=isNamed?jarsP[namedI]:null;
      const step=topDropAt[ji], startF=topShelfDelay+step*STAGGER;
      const t=prog(startF,startF+DROP,lf); if(t<=0)continue;
      const finalX=topGridOrigin+ji*unit, jarY=lerp(-jH,topRestY,dropBounce(t));
      const m=isNamed?jar.m:((ji*5+3)%5+5)%5, col=isNamed?jar.col:'#48a971';
      let fallY=0; if(inFall){const ft=clamp((lf-HOLD_END-FALL_DUR*0.1-ji*1.5)/(FALL_DUR*0.45),0,1);fallY=ft*ft*ft*(H+jH*2);}
      drawJar(ctx,finalX,jarY+fallY,jW,jH,isNamed?jar.l:'',isNamed?jar.fill:0,col,ML[m]||ML[0],1,letterAlpha);
    }

    frame++;
    rafId = requestAnimationFrame(tick);
  }

  // Load font then start
  document.fonts.ready.then(()=>{ rafId=requestAnimationFrame(tick); });
};

// Auto-show on load
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>{ if(splashEnabled()) window.splashShow(); }, 100);
});

})();
