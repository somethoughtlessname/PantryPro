let fxIntervals = [];
let fxRAFs = [];
let fxGen = 0;

const OVERLAY_CFG_DEFAULTS = {
  overlay:'none',
  grn:{layer:'over',intensity:'high',size:'coarse'},
  crt:{layer:'under',color:'green',lines:'light'},
  stt:{layer:'over',intensity:'high',speed:'fast'},
  glc:{speed:'slow',intensity:'high'},
  prx:{layer:'mixed',speed:'fast',density:'dense'},
  dtr:{layer:'over',intensity:'heavy',size:'coarse'},
  vgn:{layer:'over',strength:'med',spread:'tight'},
  crs:{layer:'under',spacing:'med',opacity:'heavy'},
  tlt:{},
  plm:{layer:'under'},
  hlg:{layer:'over'},
};

const LAYER_FILTERS_APP=['grn','crt','stt','dtr','vgn','crs','plm','hlg'];
const LAYER_MIXED_APP=['prx'];

const OVERLAY_SETTINGS_DEF = {
  non:[],grn:[],crt:[],stt:[],glc:[],prx:[],dtr:[],vgn:[],crs:[],tlt:[],plm:[],hlg:[],
};

function getOverlayCfg() {
  if (!appSettings.overlayCfg) appSettings.overlayCfg = JSON.parse(JSON.stringify(OVERLAY_CFG_DEFAULTS));
  return appSettings.overlayCfg;
}

function clearThemeFx() {
  fxGen++;
  fxIntervals.forEach(id => { clearInterval(id); clearTimeout(id); });
  fxIntervals = []; fxRAFs.forEach(cancelAnimationFrame); fxRAFs = [];
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');
  const fxb = document.getElementById('fx-back');
  const fxf = document.getElementById('fx-fore');
  if (!tbOpen) {
    if (fxb) { fxb.innerHTML = ''; fxb.style.zIndex = '1'; }
    if (fxf) { fxf.innerHTML = ''; fxf.style.zIndex = '1'; }
  }
  const pback = document.getElementById('tbPreviewFxBack'); if (pback) pback.innerHTML = '';
  const pfore = document.getElementById('tbPreviewFxFore'); if (pfore) pfore.innerHTML = '';
  if (!(document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open'))) document.body.style.filter = '';
  const demoEl = document.querySelector('.tb-demo-section'); if (demoEl) demoEl.style.filter = '';
  document.querySelectorAll('[data-tlt]').forEach(el=>{el.style.transform='';el.style.zIndex='';delete el.dataset.tlt;});
  const _ma=document.getElementById('mainApp'); if(_ma&&_ma._tltFn){_ma.removeEventListener('click',_ma._tltFn);delete _ma._tltFn;}
  if(demoEl&&demoEl._tltFn){demoEl.removeEventListener('click',demoEl._tltFn);delete demoEl._tltFn;}
  document.querySelectorAll('.data-body').forEach(b=>{if(b._tltOvf!==undefined){b.style.overflow=b._tltOvf;delete b._tltOvf;}});
}

function setOverlay(id) {
  const cfg = getOverlayCfg();
  cfg.overlay = id;
  appSettings.overlay = id;
  lsSet('sch_settings', appSettings);
  applyOverlay();
  const slot = document.getElementById('themePickerSlot');
  if (slot) slot.querySelectorAll('.filter-btn').forEach(btn => {
    const m = btn.getAttribute('onclick').match(/setOverlay\('(.*?)'\)/);
    if (m) btn.classList.toggle('active', m[1] === id);
  });
  buildOverlaySettings(id);
}

function buildOverlaySettings(id) {
  const nameEl = document.getElementById('overlaySettingsName');
  if (nameEl) nameEl.textContent = id === 'none' ? '-' : id.toUpperCase();
  const layerWrap = document.getElementById('overlayLayerWrap');
  if (layerWrap) {
    layerWrap.innerHTML = '';
    const cfg = getOverlayCfg();
    const hasLayer = LAYER_FILTERS_APP.includes(id) || LAYER_MIXED_APP.includes(id);
    if (hasLayer) {
      const opts = LAYER_MIXED_APP.includes(id) ? ['under','mixed','over'] : ['under','over'];
      opts.forEach(v => {
        const b = document.createElement('button');
        b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        b.style.cssText = `height:13px;padding:0 8px;border:var(--border-width) solid var(--border-color);border-radius:99px;background:${(cfg[id]||{}).layer===v?'var(--secondary)':'var(--bg-2)'};color:${(cfg[id]||{}).layer===v?'var(--text-light)':'var(--muted)'};font-size:9px;font-weight:800;text-transform:uppercase;cursor:pointer;`;
        b.onclick = () => { if (cfg[id]) cfg[id].layer = v; lsSet('sch_settings', appSettings); applyOverlay(); buildOverlaySettings(id); };
        layerWrap.appendChild(b);
      });
    }
  }
  const body = document.getElementById('tbOverlaySettings') || document.getElementById('overlaySettingsBody');
  if (!body) return;
  body.innerHTML = '';
  body.style.background = 'var(--bg-2)';
  const defs = OVERLAY_SETTINGS_DEF[id] || [];
  if (!defs.length) {
    body.innerHTML =
      `<div style="height:var(--job-half);display:flex;align-items:stretch;pointer-events:none;">
        <div style="width:64px;flex-shrink:0;border-right:var(--border-width) solid transparent;background:var(--bg-3);"></div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);color:var(--muted);letter-spacing:var(--ls-wide);">${id === 'none' ? 'SELECT AN OVERLAY' : ''}</div>
      </div>
      <div style="height:var(--job-half);display:flex;align-items:stretch;pointer-events:none;border-top:var(--border-width) solid var(--border-color);">
        <div style="width:64px;flex-shrink:0;border-right:var(--border-width) solid transparent;background:var(--bg-3);"></div>
        <div style="flex:1;"></div>
      </div>`;
    return;
  }
  const cfg = getOverlayCfg();
  defs.forEach((def, defIdx) => {
    const row = document.createElement('div');
    const isLast = defIdx === defs.length - 1;
    row.style.cssText = `display:flex;align-items:stretch;height:var(--job-half);${isLast ? '' : 'border-bottom:var(--border-width) solid var(--border-color);'}`;
    const lbl = document.createElement('div');
    lbl.style.cssText = 'width:64px;flex-shrink:0;border-right:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);';
    lbl.textContent = def.lbl;
    const opts = document.createElement('div');
    opts.style.cssText = 'display:flex;flex:1;';
    def.opts.forEach((opt, i) => {
      const isOn = (cfg[id]||{})[def.key] === opt.v;
      const b = document.createElement('div');
      b.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;border-right:var(--border-width) solid var(--border-color);cursor:pointer;background:${isOn?'var(--secondary)':'var(--bg-2)'};color:${isOn?'var(--text-light)':'var(--muted)'};font-size:9px;font-weight:800;text-transform:uppercase;`;
      if (i === def.opts.length - 1) b.style.borderRight = 'none';
      if (def.isColor) {
        const dot = document.createElement('span');
        dot.style.cssText = `width:13px;height:13px;border-radius:50%;background:${opt.col};border:2px solid ${isOn?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.4)'};${isOn?`box-shadow:0 0 6px 2px ${opt.col};`:''};display:inline-block;`;
        b.appendChild(dot);
      } else { b.textContent = opt.l; }
      b.onclick = () => { if (cfg[id]) cfg[id][def.key] = opt.v; lsSet('sch_settings', appSettings); buildOverlaySettings(id); applyOverlay(); if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview(id); };
      opts.appendChild(b);
    });
    row.append(lbl, opts);
    body.appendChild(row);
  });
}

function injectWindowFx(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  removeWindowFx(windowId);
  const cfg = getOverlayCfg();
  const id = cfg.overlay || 'none';
  if (id === 'none') return;
  const c = cfg[id] || {};
  const layer = c.layer || 'under';
  const wb = document.createElement('div');
  wb.className = 'win-fx-back';
  wb.style.cssText = `position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:${layer==='over'?'9999':'0'};`;
  const wf = document.createElement('div');
  wf.className = 'win-fx-fore';
  wf.style.cssText = `position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:${layer==='over'?'10000':'0'};`;
  win.style.position = 'fixed';
  win.appendChild(wb);
  win.appendChild(wf);
  applyOverlayInWindow(id, c, wb, wf);
}

function removeWindowFx(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  win.querySelectorAll('.win-fx-back,.win-fx-fore').forEach(el => el.remove());
  if (win._winFxGen !== undefined) win._winFxGen++;
  const body = win.querySelector('.data-body, .data-window-body');
  if (body) body.style.position = '';
}

function applyOverlayInWindow(id, c, backEl, foreEl) {
  const win = backEl.closest('.data-window');
  if (!win) return;
  if (win._winFxGen === undefined) win._winFxGen = 0;
  win._winFxGen++;
  const myGen = win._winFxGen;
  const layer = c.layer || 'under';
  const target = layer === 'over' ? foreEl : backEl;
  function mkWinC(el, op, blend) {
    const c2 = document.createElement('canvas');
    const r = el.getBoundingClientRect();
    c2.width = r.width || 300; c2.height = r.height || window.innerHeight;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`;
    if (blend) s += `mix-blend-mode:${blend};`;
    c2.style.cssText = s;
    el.appendChild(c2);
    return c2;
  }
  const rgbs = getThemeRGBs();
  if (id === 'grn') {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkWinC(target,op,null); const ctx=cv.getContext('2d');
    function d(){if(win._winFxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  } else if (id === 'crt') {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    win.style.filter=colMap[col];
    const sl=document.createElement('div'); sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`; target.appendChild(sl);
    const gt=document.createElement('div'); gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`; foreEl.appendChild(gt);
    const wave=document.createElement('div'); wave.style.cssText=`position:absolute;left:0;right:0;height:45px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`; foreEl.appendChild(wave);
    let wy=0; const iv=setInterval(()=>{if(win._winFxGen!==myGen){clearInterval(iv);win.style.filter='';return;}wy=(wy+2)%(win.offsetHeight||800);wave.style.top=wy+'px';},16);
  } else if (id === 'stt') {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkWinC(target,op,null); const ctx=cv.getContext('2d');
    function d(){if(win._winFxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  } else if (id === 'glc') {
    const body2=win.querySelector('.data-body')||win; const kids=()=>Array.from(body2.children).filter(el=>!el.classList.contains('win-fx-back')&&!el.classList.contains('win-fx-fore'));
    const delay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300); const maxSh={low:10,med:22,high:40}[c.intensity||'med'];
    function spawn(){if(win._winFxGen!==myGen)return;const r=Math.random();const els=kids();
      if(r<.5&&els.length){const el=els[Math.floor(Math.random()*els.length)];el.style.transform=`translateX(${(Math.random()-.5)*maxSh*2}px)`;setTimeout(()=>{if(el)el.style.transform='';},25+Math.random()*60);}
      else if(els.length){els.forEach(el=>{el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>els.forEach(el=>{if(el)el.style.transform='';}),20);}
      setTimeout(spawn,delay());}
    spawn();
  } else if (id === 'dtr') {
    const opMap={light:.2,med:.35,heavy:.55}; const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkWinC(target,opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  } else if (id === 'vgn') {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp2={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkWinC(foreEl,1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp2,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  } else if (id === 'crs') {
    const sp3={tight:4,med:7,wide:13}[c.spacing||'med']; const op2={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkWinC(target,op2,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  } else if (id === 'plm') {
    function _hslRgbW(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1)));};return[f(0),f(8),f(4)];}
    const cv=mkWinC(target,.6,null);const ctx=cv.getContext('2d');let t=0;
    function dP(){if(win._winFxGen!==myGen)return;const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const px=img.data;for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const v=Math.sin(x*.06+t)+Math.sin(y*.05)+Math.sin((x+y)*.04+t*.8)+Math.sin(Math.sqrt((x-W/2)**2+(y-H/2)**2)*.05);const[r,g,b]=_hslRgbW((v+4)/8*360,.7,.4);const i=(y*W+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=255;if(x+1<W){px[i+4]=r;px[i+5]=g;px[i+6]=b;px[i+7]=255;}if(y+1<H){const j=((y+1)*W+x)*4;px[j]=r;px[j+1]=g;px[j+2]=b;px[j+3]=255;}}ctx.putImageData(img,0,0);t+=.04;requestAnimationFrame(dP);}
    dP();
  } else if (id === 'hlg') {
    const cv=mkWinC(foreEl,.5,'overlay');const ctx=cv.getContext('2d');let t=0;
    function dH(){if(win._winFxGen!==myGen)return;ctx.clearRect(0,0,cv.width,cv.height);for(let y=0;y<cv.height;y+=3){const ph=y*.08+t;const a=(.5+Math.sin(ph)*.5)*.35;const hue=(y*3+t*2865)%360;ctx.fillStyle=`hsla(${hue},90%,65%,${a})`;ctx.fillRect(0,y,cv.width,2);}t+=.03;requestAnimationFrame(dH);}
    dH();
  } else if (id === 'prx') {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:30,med:70,dense:140}[c.density||'med'];
    [{el:backEl,n,minSz:.5,maxSz:2,sp:spd*.2,op:.18},{el:foreEl,n:Math.round(n*.15),minSz:4,maxSz:9,sp:spd*1.3,op:.4}].forEach(({el,n:cn,minSz,maxSz,sp,op})=>{
      const cv2=mkWinC(el,op,null); const ctx2=cv2.getContext('2d');
      const pts=Array.from({length:cn},()=>({x:Math.random()*cv2.width,y:Math.random()*cv2.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      function d(){if(win._winFxGen!==myGen)return;ctx2.clearRect(0,0,cv2.width,cv2.height);ctx2.fillStyle='#fff';pts.forEach(p=>{p.y+=p.spd;if(p.y>cv2.height)p.y=-p.sz;ctx2.beginPath();ctx2.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx2.fill();});requestAnimationFrame(d);}
      d();});
  } else if (id === 'tlt') {
    const WIN_SEL='.label-card,.filter-card,.date-range-card,.totals-card,.clear-card,.day-card,.day-card-plus,.nw-title-card,.nw-color-card,.dow-card';
    // overflow:visible lets rotated card corners render freely; scroll in the window while tilt is active is a non-issue
    const body=win.querySelector('.data-body');
    if(body){body._tltOvf=body.style.overflow;body.style.overflow='visible';}
    function _tiltWin(){Array.from(win.querySelectorAll(WIN_SEL)).forEach((el,i)=>{const hw=Math.max(el.offsetWidth/2,10);const md=Math.max(Math.asin(Math.min(0.8/hw,.9))*180/Math.PI,0.4);const deg=(0.35+Math.random()*.65)*md*(Math.random()<.5?1:-1);el.dataset.tlt=deg.toFixed(2);el.style.transform=`rotate(${deg.toFixed(2)}deg)`;el.style.position='relative';el.style.zIndex=String(i%2===0?3:1);});}
    setTimeout(_tiltWin,350);
    if(win._tltFn)win.removeEventListener('click',win._tltFn);
    win._tltFn=_tiltWin; win.addEventListener('click',win._tltFn);
  }
}

function applyOverlayToPreview(id) {
  if (window._previewGen === undefined) window._previewGen = 0;
  window._previewGen++;
  const myPreviewGen = window._previewGen;
  const pback = document.getElementById('tbPreviewFxBack');
  const pfore = document.getElementById('tbPreviewFxFore');
  if (pback) pback.innerHTML = '';
  if (pfore) pfore.innerHTML = '';
  const demoEl = document.querySelector('.tb-demo-section');
  if (demoEl) demoEl.style.filter = '';
  if (!id || id === 'none') return;
  const cfg = getOverlayCfg();
  const c = cfg[id] || {};
  const layer = c.layer || 'under';
  if (pback) pback.style.zIndex = layer === 'over' ? '20' : '0';
  if (pfore) pfore.style.zIndex = (layer === 'over' || layer === 'mixed') ? '30' : '0';
  function mkPreviewC(target, op, blend) {
    const el = target === 'fx-back' ? pback : pfore;
    if (!el) return document.createElement('canvas');
    const rect = el.getBoundingClientRect();
    const w = rect.width > 0 ? Math.round(rect.width) : 300;
    const hh = rect.height > 0 ? Math.round(rect.height) : 200;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = hh;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`;
    if (blend) s += `mix-blend-mode:${blend};`;
    cv.style.cssText = s;
    el.appendChild(cv);
    return cv;
  }
  const rgbs = getThemeRGBs();
  if (id === 'grn') {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkPreviewC('fx-back',op,null); const ctx=cv.getContext('2d');
    function drawGrn(){if(window._previewGen!==myPreviewGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(drawGrn);}
    drawGrn();
  } else if (id === 'crt') {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    if (demoEl) demoEl.style.filter=colMap[col];
    const tgtEl=layer==='over'?pfore:pback;
    if(tgtEl){const sl=document.createElement('div');sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`;tgtEl.appendChild(sl);}
    if(pfore){const vg=document.createElement('div');vg.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,0.92) 100%);';pfore.appendChild(vg);
      const gt=document.createElement('div');gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`;pfore.appendChild(gt);
      const wave=document.createElement('div');wave.style.cssText=`position:absolute;left:0;right:0;height:30px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`;pfore.appendChild(wave);
      let wy=0;
      function animCRTWave(){if(window._previewGen!==myPreviewGen)return;const h2=pfore.offsetHeight||200;wy=(wy+2)%h2;wave.style.top=wy+'px';requestAnimationFrame(animCRTWave);}
      animCRTWave();}
  } else if (id === 'stt') {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkPreviewC('fx-back',op,null); const ctx=cv.getContext('2d');
    function drawStt(){if(window._previewGen!==myPreviewGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(drawStt);}
    drawStt();
  } else if (id === 'glc') {
    const appEl=demoEl; if(!appEl)return;
    const kids=()=>Array.from(appEl.querySelectorAll('[style],.label-card,.day-card,.job-card-top,.job-card-bottom'));
    const delay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300); const maxSh={low:8,med:18,high:30}[c.intensity||'med'];
    function spawnGlc(){if(window._previewGen!==myPreviewGen)return;const r=Math.random();const els=kids();
      if(r<0.5&&els.length){const el=els[Math.floor(Math.random()*els.length)];const sh=(Math.random()-.5)*maxSh*2;el.style.transform=`translateX(${sh}px)`;setTimeout(()=>{if(el)el.style.transform='';},20+Math.random()*60);}
      else if(els.length){els.forEach(el=>{el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>els.forEach(el=>{if(el)el.style.transform='';}),15+Math.random()*40);}
      setTimeout(spawnGlc,delay());}
    spawnGlc();
  } else if (id === 'prx') {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:20,med:40,dense:70}[c.density||'med'];
    [{target:'fx-back',n,minSz:.5,maxSz:2,sp:spd*.3,op:.25},{target:'fx-fore',n:Math.round(n*.2),minSz:3,maxSz:6,sp:spd*1.2,op:.4}].forEach(({target,n:cn,minSz,maxSz,sp,op})=>{
      const cv=mkPreviewC(target,op,null); const ctx=cv.getContext('2d');
      const pts=Array.from({length:cn},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      function drawPrx(){if(window._previewGen!==myPreviewGen)return;ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#fff';pts.forEach(p=>{p.y+=p.spd;if(p.y>cv.height)p.y=-p.sz;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();});requestAnimationFrame(drawPrx);}
      drawPrx();});
  } else if (id === 'dtr') {
    const opMap={light:.2,med:.35,heavy:.55}; const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkPreviewC('fx-back',opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  } else if (id === 'vgn') {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp2={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkPreviewC(layer==='under'?'fx-back':'fx-fore',1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp2,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  } else if (id === 'crs') {
    const sp3={tight:4,med:7,wide:13}[c.spacing||'med']; const op2={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkPreviewC('fx-back',op2,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  } else if (id==='tlt') {
    const root=demoEl||document.getElementById('mainApp'); if(!root)return;
    const SEL2='.day-card,.label-card,.qs-card,.hist-card,.job-card,.day-card-plus,.day-sq';
    function _tiltEl2(el){const hw=Math.max(el.offsetWidth/2,10);const md=Math.max(Math.asin(Math.min(1.2/hw,.9))*180/Math.PI,0.6);const deg=(0.35+Math.random()*.65)*md*(Math.random()<.5?1:-1);el.dataset.tlt=deg.toFixed(2);el.style.transform=`rotate(${deg.toFixed(2)}deg)`;el.style.zIndex=String(Math.floor(Math.random()*5));}
    function _applyTlt(){Array.from(root.querySelectorAll(SEL2)).forEach(_tiltEl2);}
    requestAnimationFrame(_applyTlt);
    if(root._tltFn)root.removeEventListener('click',root._tltFn);
    root._tltFn=_applyTlt; root.addEventListener('click',root._tltFn);
  } else if (id==='plm') {
    function _hslRgb(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1)));};return[f(0),f(8),f(4)];}
    const cv=mkPreviewC((c.layer||'under')==='over'?'fx-fore':'fx-back',.6,null);const ctx=cv.getContext('2d');let t=0;
    function drawPlm(){if(window._previewGen!==myPreviewGen)return;const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const px=img.data;
      for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const v=Math.sin(x*.08+t)+Math.sin(y*.07)+Math.sin((x+y)*.05+t*.8)+Math.sin(Math.sqrt((x-W/2)**2+(y-H/2)**2)*.07);const[r,g,b]=_hslRgb((v+4)/8*360,.7,.4);const i=(y*W+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=255;if(x+1<W){px[i+4]=r;px[i+5]=g;px[i+6]=b;px[i+7]=255;}if(y+1<H){const j=((y+1)*W+x)*4;px[j]=r;px[j+1]=g;px[j+2]=b;px[j+3]=255;}}
      ctx.putImageData(img,0,0);t+=.04;requestAnimationFrame(drawPlm);}
    drawPlm();
  } else if (id==='hlg') {
    const cv=mkPreviewC((c.layer||'over')==='under'?'fx-back':'fx-fore',.5,'overlay');const ctx=cv.getContext('2d');let t=0;
    function drawHlg(){if(window._previewGen!==myPreviewGen)return;ctx.clearRect(0,0,cv.width,cv.height);for(let y=0;y<cv.height;y+=3){const ph=y*.08+t;const a=(.5+Math.sin(ph)*.5)*.35;const hue=(y*3+t*2865)%360;ctx.fillStyle=`hsla(${hue},90%,65%,${a})`;ctx.fillRect(0,y,cv.width,2);}t+=.03;requestAnimationFrame(drawHlg);}
    drawHlg();
  }
}

function applyOverlay() {
  clearThemeFx();
  const cfg = getOverlayCfg();
  const id = cfg.overlay || 'none';
  if (id !== 'none') {
    const layer = (cfg[id] || {}).layer || 'under';
    const fxb = document.getElementById('fx-back');
    const fxf = document.getElementById('fx-fore');
    const pback = document.getElementById('tbPreviewFxBack');
    const pfore = document.getElementById('tbPreviewFxFore');
    if (layer === 'over') {
      if (fxb) fxb.style.zIndex = '9999';
      if (fxf) fxf.style.zIndex = '9999';
      if (pback) pback.style.zIndex = '20';
      if (pfore) pfore.style.zIndex = '25';
    } else if (layer === 'under') {
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '1';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '0';
    } else {
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '9999';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '25';
    }
  }
  const OVERLAYS = getOverlayFns();
  if (OVERLAYS[id]) OVERLAYS[id](cfg[id]||{});
}

function overlayTarget(layer) { return layer === 'over' ? 'fx-fore' : 'fx-back'; }

function mkFxC(target, op, blend) {
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');
  function makeCanvas(parent, w, h) {
    if (!parent) return document.createElement('canvas');
    const c = document.createElement('canvas');
    c.width = w || window.innerWidth; c.height = h || window.innerHeight;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`; if (blend) s += `mix-blend-mode:${blend};`;
    c.style.cssText = s; parent.appendChild(c); return c;
  }
  if (tbOpen) {
    const previewId = target === 'fx-back' ? 'tbPreviewFxBack' : 'tbPreviewFxFore';
    const preview = document.getElementById(previewId);
    const pw = (preview && preview.offsetWidth > 0) ? preview.offsetWidth : 300;
    const ph = (preview && preview.offsetHeight > 0) ? preview.offsetHeight : 200;
    return makeCanvas(preview, pw, ph);
  } else {
    return makeCanvas(document.getElementById(target), window.innerWidth, window.innerHeight);
  }
}

function getThemeRGBs() {
  const cs = getComputedStyle(document.documentElement);
  return ['--primary','--secondary','--accent','--swatch-1','--swatch-2','--swatch-3','--swatch-4','--swatch-5','--swatch-6','--swatch-7','--swatch-8'].map(v => {
    const hex = cs.getPropertyValue(v).trim().replace('#','');
    return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  }).filter(([r]) => !isNaN(r));
}



const _crtColMap={green:'brightness(0.65) contrast(1.3) saturate(0) sepia(1) hue-rotate(76deg) saturate(8) brightness(1.0)',green2:'brightness(0.65) contrast(1.3) saturate(0) sepia(1) hue-rotate(106deg) saturate(6) brightness(1.0)',blue:'brightness(0.65) contrast(1.3) saturate(0) sepia(1) hue-rotate(146deg) saturate(6) brightness(1.0)',amber:'brightness(0.65) contrast(1.3) saturate(0) sepia(1) hue-rotate(11deg) saturate(5) brightness(1.0)',white:'brightness(0.65) contrast(1.2) saturate(0) brightness(1.0)',red:'brightness(0.65) contrast(1.3) saturate(0) sepia(1) hue-rotate(319deg) saturate(6) brightness(1.0)'};
const _crtTintMap={green:'rgba(18,255,21,0.08)',green2:'rgba(26,255,128,0.08)',blue:'rgba(46,207,255,0.08)',amber:'rgba(255,191,0,0.08)',white:'rgba(255,255,255,0.06)',red:'rgba(255,32,0,0.08)'};
function getOverlayFns() { return {
  non: () => {},
  grn: (c) => {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const myGen=fxGen;
    function d(){if(fxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  },
  crt: (c) => {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    const tbOpenNow=document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    if(!tbOpenNow) document.body.style.filter=colMap[col];
    else{const demoEl=document.querySelector('.tb-demo-section');if(demoEl)demoEl.style.filter=colMap[col];}
    const tgt=overlayTarget(c.layer||'under');
    const realTgt=tbOpenNow?(tgt==='fx-back'?'tbPreviewFxBack':'tbPreviewFxFore'):tgt;
    const realFore=tbOpenNow?'tbPreviewFxFore':'fx-fore';
    const rtEl=document.getElementById(realTgt);
    const rfEl=document.getElementById(realFore);
    // Scanlines
    const sl=document.createElement('div'); sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.28) ${sp}px,rgba(0,0,0,0.28) ${sp+1}px);`;
    if(rtEl)rtEl.appendChild(sl);
    // Vignette
    const vg=document.createElement('div'); vg.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.15) 35%,rgba(0,0,0,0.38) 65%,rgba(0,0,0,0.58) 85%,rgba(0,0,0,0.68) 100%);';
    if(rfEl)rfEl.appendChild(vg);
    // Tint
    const gt=document.createElement('div'); gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`; if(rfEl)rfEl.appendChild(gt);
    // Rolling scanline bar
    const wave=document.createElement('div'); wave.style.cssText='position:absolute;left:0;right:0;height:60px;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.04),transparent);';
    if(rfEl)rfEl.appendChild(wave);
    const wrapH=tbOpenNow?(document.getElementById('tbPreviewFxBack')||{}).offsetHeight||200:window.innerHeight;
    let wy=0; const crtGen=fxGen;
    fxIntervals.push(setInterval(()=>{if(fxGen!==crtGen)return;wy=(wy+1.5)%wrapH;wave.style.top=wy+'px';},16));
    // Flicker
    let b=1.0,bt=1.0;
    fxIntervals.push(setInterval(()=>{if(fxGen!==crtGen)return;if(Math.random()<0.03)bt=0.85+Math.random()*0.18;b+=(bt-b)*0.05;if(!tbOpenNow)document.body.style.filter=colMap[col].replace(/brightness\([^)]+\)$/,`brightness(${b.toFixed(3)})`);},16));
  },
  stt: (c) => {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const myGen=fxGen;
    function d(){if(fxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
    const delay={slow:1400,med:900,fast:350}[c.speed||'med'];
    fxIntervals.push(setInterval(()=>{if(fxGen!==myGen)return;if(Math.random()<0.06){cv.style.transition='opacity 0.25s';cv.style.opacity=''+(.35+Math.random()*.35);setTimeout(()=>cv.style.opacity=''+op,300+Math.random()*600);}},delay));
  },
  glc: (c) => {
    const tbOpenNow=document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    const glitchTarget=tbOpenNow?document.querySelector('.tb-demo-section'):document.getElementById('mainApp');
    const appEl=glitchTarget; if(!appEl)return;
    const kids=()=>Array.from(appEl.children);
    const baseDelay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300);
    const maxSh={low:18,med:40,high:70}[c.intensity||'med']; const myGen=fxGen;
    function spawn(){if(fxGen!==myGen)return;const r=Math.random();
      if(r<.38){const els=kids();const start=Math.floor(Math.random()*els.length);const targets=els.slice(start,start+1+Math.floor(Math.random()*3));const sh=(Math.random()-.5)*maxSh*2;targets.forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${sh}px)`;});setTimeout(()=>targets.forEach(el=>el.style.transform=''),20+Math.random()*60);}
      else if(r<.62){kids().forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>kids().forEach(el=>el.style.transform=''),15+Math.random()*40);}
      else if(r<.8){const els=kids();const el=els[Math.floor(Math.random()*els.length)];if(el){el.style.filter='drop-shadow(3px 0 rgba(255,0,60,0.75)) drop-shadow(-3px 0 rgba(0,255,240,0.75))';setTimeout(()=>el.style.filter='',35+Math.random()*70);}}
      else{appEl.style.transition='none';appEl.style.transform=`translateY(${(Math.random()-.5)*maxSh*.18}px) translateX(${(Math.random()-.5)*maxSh*.12}px)`;setTimeout(()=>appEl.style.transform='',25);}
      fxIntervals.push(setTimeout(spawn,baseDelay()));}
    spawn();
  },
  prx: (c) => {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:30,med:70,dense:140}[c.density||'med'];
    const layer=c.layer||'mixed'; const t1=layer==='over'?'fx-fore':'fx-back'; const t3=layer==='under'?'fx-back':'fx-fore';
    function spdForSz(sz){return spd*(0.07+(sz-0.3)/8.7*1.25);}
    function alphaForSz(sz){return 0.10+(sz-0.3)/8.7*0.55;}
    // Two canvases at opacity:1 -- alpha set per particle so size=brightness
    // Overlapping size ranges blur the back/front boundary
    [{t:t1,nFrac:.70,minSz:.3,maxSz:6.0},{t:t3,nFrac:.30,minSz:3.0,maxSz:9.0}].forEach(({t,nFrac,minSz,maxSz})=>{
      const cn=Math.round(n*nFrac);
      const cv=mkFxC(t,1,null); const ctx=cv.getContext('2d');
      // Jittered grid: divide canvas into cells, one particle per cell -- even spread
      const cols=Math.max(1,Math.round(Math.sqrt(cn*cv.width/cv.height)));
      const rows=Math.max(1,Math.ceil(cn/cols));
      const cw=cv.width/cols; const ch=cv.height/rows;
      const pts=[];
      for(let r=0;r<rows&&pts.length<cn;r++) for(let col=0;col<cols&&pts.length<cn;col++){
        const sz=minSz+Math.random()*(maxSz-minSz);
        pts.push({x:(col+Math.random())*cw,y:(r+Math.random())*ch,spd:spdForSz(sz)*(0.8+Math.random()*.4),sz,a:alphaForSz(sz)});
      }
      const myGen=fxGen;
      ctx.fillStyle='#fff';
      function d(){if(fxGen!==myGen)return;ctx.clearRect(0,0,cv.width,cv.height);pts.forEach(p=>{p.y+=p.spd;if(p.y>cv.height)p.y=-p.sz;ctx.globalAlpha=p.a;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;requestAnimationFrame(d);}
      d();
    });
  },
  dtr: (c) => {
    const opMap={light:.2,med:.35,heavy:.55};
    const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkFxC(overlayTarget(c.layer||'under'),opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  },

  vgn: (c) => {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'over'),1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  },
  tlt: (c) => {
    const tbOpen=document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    const root=tbOpen?document.querySelector('.tb-demo-section'):document.getElementById('mainApp');
    if(!root)return;
    const SEL='.day-card,.label-card,.qs-card,.hist-card,.job-card,.day-card-plus,.day-sq';
    function _tiltEl(el){const hw=Math.max(el.offsetWidth/2,10);const md=Math.max(Math.asin(Math.min(1.2/hw,.9))*180/Math.PI,0.6);const deg=(0.35+Math.random()*.65)*md*(Math.random()<.5?1:-1);el.dataset.tlt=deg.toFixed(2);el.style.transform=`rotate(${deg.toFixed(2)}deg)`;el.style.zIndex=String(Math.floor(Math.random()*5));}
    function _tlt(){Array.from(root.querySelectorAll(SEL)).forEach(_tiltEl);}
    setTimeout(_tlt,350);
    if(root._tltFn)root.removeEventListener('click',root._tltFn);
    root._tltFn=()=>Array.from(root.querySelectorAll(SEL)).forEach(_tiltEl);
    root.addEventListener('click',root._tltFn);
  },
  plm: (c) => {
    function _hslRgb(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1)));};return[f(0),f(8),f(4)];}
    const cv=mkFxC(overlayTarget(c.layer||'under'),.6,null);const ctx=cv.getContext('2d');const myGen=fxGen;let t=0;
    function d(){if(fxGen!==myGen)return;const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const px=img.data;for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const v=Math.sin(x*.06+t)+Math.sin(y*.05)+Math.sin((x+y)*.04+t*.8)+Math.sin(Math.sqrt((x-W/2)**2+(y-H/2)**2)*.05);const[r,g,b]=_hslRgb((v+4)/8*360,.7,.4);const i=(y*W+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=255;if(x+1<W){px[i+4]=r;px[i+5]=g;px[i+6]=b;px[i+7]=255;}if(y+1<H){const j=((y+1)*W+x)*4;px[j]=r;px[j+1]=g;px[j+2]=b;px[j+3]=255;}}ctx.putImageData(img,0,0);t+=.04;requestAnimationFrame(d);}
    d();
  },
  hlg: (c) => {
    const cv=mkFxC(overlayTarget(c.layer||'over'),.5,'overlay');const ctx=cv.getContext('2d');const myGen=fxGen;let t=0;
    function d(){if(fxGen!==myGen)return;ctx.clearRect(0,0,cv.width,cv.height);for(let y=0;y<cv.height;y+=3){const ph=y*.08+t;const a=(.5+Math.sin(ph)*.5)*.35;const hue=(y*3+t*2865)%360;ctx.fillStyle=`hsla(${hue},90%,65%,${a})`;ctx.fillRect(0,y,cv.width,2);}t+=.03;requestAnimationFrame(d);}
    d();
  },
  crs: (c) => {
    const sp={tight:4,med:7,wide:13}[c.spacing||'med']; const op={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  },
}; }

function setTheme(id) { setOverlay(id); }
function applyTheme() { applyOverlay(); }
