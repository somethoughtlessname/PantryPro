/* -- SHIFT HAPPENS · jobhistory.js --
   Work / career history module. All symbols prefixed jh.
   Depends on: app.js (ls, lsSet, openWindow, closeWindow already defined).
   Month gridlines match .tl-gl: rgba(255,255,255,0.12)
-- */
'use strict';

// ── DATA ──────────────────────────────────────────────────────────────────────
var JH_JOBS = [];
try { JH_JOBS = JSON.parse(localStorage.getItem('wh_jobs') || '[]'); } catch(e) {}
var JH_ID   = JH_JOBS.reduce(function(m,j){ return Math.max(m,j.id||0); }, 0) + 1;
var JH_COLORS = [
  'var(--primary)','var(--secondary)','var(--accent)',
  'var(--swatch-1)','var(--swatch-2)','var(--swatch-3)',
  'var(--swatch-5)','var(--swatch-7)'
];
var JH_COLORS_HEX = [
  '#48a971','#5A8DB8','#8a7ca8',
  '#C85A5A','#C7824A','#B8B85A',
  '#5AB8A8','#8a7ca8'
];
var JH_MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


function jhSetBackSvg(){
  var isPxl=document.body.classList.contains('pxl-font');
  var svg=isPxl?'<svg width="20" height="20" viewBox="0 0 7 7" fill="none" shape-rendering="crispEdges"><rect x="4" y="0" width="1" height="1" fill="currentColor"/><rect x="3" y="1" width="1" height="1" fill="currentColor"/><rect x="2" y="2" width="1" height="1" fill="currentColor"/><rect x="1" y="3" width="1" height="1" fill="currentColor"/><rect x="2" y="4" width="1" height="1" fill="currentColor"/><rect x="3" y="5" width="1" height="1" fill="currentColor"/><rect x="4" y="6" width="1" height="1" fill="currentColor"/></svg>':'<svg width="22" height="22" viewBox="0 0 50 50" fill="none"><line x1="42" y1="10" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line x1="42" y1="40" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  ['jhWindowBack','jhFormBack'].forEach(function(id){
    var b=document.getElementById(id); if(b) b.innerHTML=svg;
  });
}
// ── PUBLIC API — defined first so onclick always finds it ─────────────────────
window.openJobHistoryWindow  = function(){
  jhSetBackSvg();
  jhSetView('companies');
  jhRenderCo();
  openWindow('jhWindow');
  requestAnimationFrame(function(){
    var w=document.getElementById('jhWindow'); if(w) w.scrollTop=0;
    if(typeof DrawnBorders!=='undefined'&&typeof appSettings!=='undefined'&&appSettings.drawnBorders){
      DrawnBorders._applyFormWindow('jhWindow');
    }
  });
};
window.closeJobHistoryWindow = function(){ closeWindow('jhWindow'); };

// ── INJECT STYLES ─────────────────────────────────────────────────────────────


// ── INJECT WINDOW HTML ────────────────────────────────────────────────────────


// ── HELPERS ───────────────────────────────────────────────────────────────────
function jhPm(s){ if(!s) return null; var p=s.split('-'); return [+p[0],+p[1]]; }
function jhPmDay(ms,ds){ if(!ms) return null; var a=jhPm(ms); var d=parseInt(ds); if(d>=1&&d<=31) a.push(d); return a; }
function jhToH(a){ return a ? a[0]+(a[1]-1)/12+((a[2]||1)-1)/(12*31) : 0; }
function jhFmt(a){ return a ? JH_MO[a[1]-1]+' '+a[0] : '?'; }
function jhFmtDay(a){ return a ? JH_MO[a[1]-1]+(a[2]?' '+String(a[2]).padStart(2,'0')+',':'')+' '+a[0] : '?'; }
// format years/months only (card info + total)
function jhFmtDur(mo){
  if(mo<0) mo=0;
  var y=Math.floor(mo/12), m=mo%12, parts=[];
  if(y>0) parts.push(String(y).padStart(2,'0')+' '+(y===1?'YEAR':'YEARS'));
  if(m>0||y===0) parts.push(String(m).padStart(2,'0')+' '+(m===1?'MONTH':'MONTHS'));
  return parts.join(', ');
}
// exact calendar diff — returns {y,m,d}
function jhCalcDiff(sd, ed){
  var y=ed.getFullYear()-sd.getFullYear();
  var m=ed.getMonth()-sd.getMonth();
  var d=ed.getDate()-sd.getDate();
  if(d<0){ m--; d+=new Date(ed.getFullYear(),ed.getMonth(),0).getDate(); }
  if(m<0){ y--; m+=12; }
  return {y:Math.max(0,y),m:Math.max(0,m),d:Math.max(0,d)};
}
// format with optional days (for dropdown role items)
function jhFmtDurDays(sd, ed, showDays){
  var diff=jhCalcDiff(sd,ed), parts=[];
  if(diff.y>0) parts.push(String(diff.y).padStart(2,'0')+' '+(diff.y===1?'YEAR':'YEARS'));
  if(diff.m>0||diff.y===0) parts.push(String(diff.m).padStart(2,'0')+' '+(diff.m===1?'MONTH':'MONTHS'));
  if(showDays&&diff.d>0) parts.push(String(diff.d).padStart(2,'0')+' '+(diff.d===1?'DAY':'DAYS'));
  return parts.join(', ');
}
// role duration — always shows days if non-zero
function jhDur(s,e){
  if(!s) return jhFmtDur(0);
  var sd=new Date(s[0],s[1]-1,s[2]||1);
  var ed=e?new Date(e[0],e[1]-1,e[2]||1):new Date();
  return jhFmtDurDays(sd,ed,true);
}
function jhTotalDur(job){
  var totalMo=0, totalDays=0;
  job.roles.forEach(function(r){
    if(!r.start) return;
    var sd=new Date(r.start[0],r.start[1]-1,r.start[2]||1);
    var ed=r.end?new Date(r.end[0],r.end[1]-1,r.end[2]||1):new Date();
    var diff=jhCalcDiff(sd,ed);
    totalMo+=diff.y*12+diff.m;
    totalDays+=diff.d;
  });
  totalMo+=Math.floor(totalDays/30);
  var remDays=totalDays%30;
  var y=Math.floor(totalMo/12), m=totalMo%12, parts=[];
  if(y>0) parts.push(String(y).padStart(2,'0')+' '+(y===1?'YEAR':'YEARS'));
  if(m>0||y===0) parts.push(String(m).padStart(2,'0')+' '+(m===1?'MONTH':'MONTHS'));
  if(remDays>0) parts.push(String(remDays).padStart(2,'0')+' '+(remDays===1?'DAY':'DAYS'));
  return parts.join(', ');
}
function jhCoStart(j){
  return j.roles.reduce(function(m,r){ return(r.start&&(!m||jhToH(r.start)<jhToH(m)))?r.start:m; },null)||j.roles[0].start;
}
function jhCoEnd(j){
  if(j.roles.some(function(r){ return !r.end; })) return null;
  return j.roles.reduce(function(m,r){ return(!m||jhToH(r.end)>jhToH(m))?r.end:m; },null);
}
function jhDarken(hex,p){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.round(r*(1-p)); g=Math.round(g*(1-p)); b=Math.round(b*(1-p));
  return '#'+[r,g,b].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
}
function jhSave(){ lsSet('wh_jobs', JH_JOBS); }
function jhSorted(){
  return JH_JOBS.slice().sort(function(a,b){
    var ae=jhCoEnd(a),be=jhCoEnd(b);
    if(!ae&&!be) return jhToH(jhCoStart(b))-jhToH(jhCoStart(a));
    if(!ae) return -1; if(!be) return 1;
    return jhToH(be)-jhToH(ae);
  });
}
function jhHexFor(idx){
  var cols=typeof getSwatchColors==='function'?getSwatchColors():JH_COLORS_HEX;
  return cols[idx % cols.length];
}

// ── STATE ─────────────────────────────────────────────────────────────────────
var jhView='companies', jhEditId=null, jhSelColIdx=0, jhRoleN=0;

// ── OPEN / CLOSE ──────────────────────────────────────────────────────────────
function openJobHistoryWindow(){
  jhRenderCo();
  openWindow('jhWindow');
}
function closeJobHistoryWindow(){
  closeWindow('jhWindow');
}

// ── VIEW SWITCHING ────────────────────────────────────────────────────────────
function jhSetView(v){
  jhView=v;
  document.querySelectorAll('[data-jhview]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-jhview')===v);
  });
  document.getElementById('jhCoView').className=(v==='companies'?'on':'');
  document.getElementById('jhTlView').className=(v==='timeline'?'on':'');
  document.getElementById('jhDataView').className=(v==='data'?'on':'');
  var w=document.getElementById('jhWindow'); if(w) w.scrollTop=0;
  if(v==='timeline') requestAnimationFrame(function(){ requestAnimationFrame(jhRenderTL); });
  if(v==='data') jhRenderData();
}

// ── COMPANIES ─────────────────────────────────────────────────────────────────
function jhRenderCo(){
  var el=document.getElementById('jhCoView');
  if(!el) return;
  el.innerHTML='';
  var add=document.createElement('div'); add.className='jh-add-card'; add.id='jhBtnAdd';
  add.textContent='+ Add Career Entry'; el.appendChild(add);
  if(!JH_JOBS.length) return;
  jhSorted().forEach(function(job){
    var s=jhCoStart(job), e=jhCoEnd(job), cur=!e;
    var hex=jhHexFor(job.colorIdx||0);
    var card=document.createElement('div'); card.className='jh-card'; card.dataset.id=job.id;
    var hdr=document.createElement('div'); hdr.className='jh-card-hdr'; hdr.style.background=hex;
    hdr.innerHTML='<div class="jh-card-name">'+job.company+'</div>';
    var info=document.createElement('div'); info.className='jh-card-info';
    info.innerHTML='<div class="jh-card-dur">'+jhTotalDur(job)+'</div>'+
      '<div class="jh-card-dates">'+jhFmtDay(s)+' \u2013 '+(cur?'PRESENT':jhFmtDay(e))+'</div>';
    var roles=document.createElement('div'); roles.className='jh-card-roles';
    var idx=0;
    job.roles.forEach(function(r){
      var ri=document.createElement('div'); ri.className='jh-role';
      var bg=idx%2===0?hex:jhDarken(hex,0.2);
      ri.style.background=bg;
      ri.innerHTML='<div class="jh-role-title">'+r.title+'</div>'+
        '<div class="jh-role-dur">'+jhDur(r.start,r.end)+'</div>'+
        '<div class="jh-role-dates">'+jhFmtDay(r.start)+' \u2013 '+(r.end?jhFmtDay(r.end):'PRESENT')+'</div>';
      roles.appendChild(ri); idx++;
    });
    var acts=document.createElement('div'); acts.className='jh-actions';
    var eb=document.createElement('div'); eb.className='jh-edit-btn'; eb.textContent='Edit'; eb.dataset.editid=job.id;
    var db=document.createElement('div'); db.className='jh-del-btn'; db.textContent='\u2715 Remove'; db.dataset.delid=job.id;
    acts.appendChild(eb); acts.appendChild(db); roles.appendChild(acts);
    card.appendChild(hdr); card.appendChild(info); card.appendChild(roles);
    el.appendChild(card);
  });
}

// ── TIMELINE ──────────────────────────────────────────────────────────────────
function jhRenderTL(){
  var wrap=document.getElementById('jhTlWrap'); if(!wrap) return;
  wrap.innerHTML='';
  if(!JH_JOBS.length) return;
  var _d=new Date(), now=_d.getFullYear()+(_d.getMonth()+(_d.getDate()-1)/31)/12;
  var s=now, e=now;
  JH_JOBS.forEach(function(j){
    var js=jhToH(jhCoStart(j)), je=jhCoEnd(j)?jhToH(jhCoEnd(j)):now;
    if(js<s) s=js; if(je>e) e=je;
  });
  var firstYr=Math.floor(s), lastYr=Math.floor(now);
  var TL_E=lastYr+1, numYears=TL_E-firstYr;
  var LW=52, avail=wrap.offsetHeight||wrap.getBoundingClientRect().height||400;
  var PXY=avail/numYears;
  function y(h){ return (TL_E-h)*PXY; }
  var moCount=numYears>10?3:11;

  // label col border
  var lcb=document.createElement('div');
  lcb.style.cssText='position:absolute;left:'+LW+'px;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:2;';
  wrap.appendChild(lcb);

  for(var yr=firstYr; yr<=lastYr+1; yr++){
    var yt=y(yr);
    if(yr<=lastYr){
      var bl=document.createElement('div');
      bl.style.cssText='position:absolute;left:0;right:0;top:'+yt.toFixed(1)+'px;height:var(--border-width);background:var(--border-color);z-index:1;';
      wrap.appendChild(bl);
      var bg2=document.createElement('div');
      bg2.style.cssText='position:absolute;left:'+(LW+3)+'px;right:0;top:'+yt.toFixed(1)+'px;height:'+PXY.toFixed(1)+'px;background:'+(yr%2===0?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.12)')+';';
      wrap.appendChild(bg2);
      var lbl=document.createElement('div');
      lbl.style.cssText='position:absolute;left:0;width:'+LW+'px;top:'+(yt-PXY/2).toFixed(1)+'px;transform:translateY(-50%);text-align:center;font-size:11px;font-weight:800;color:var(--text-mid);z-index:2;';
      lbl.textContent=yr; wrap.appendChild(lbl);
    }
    // month ticks — rgba(255,255,255,0.12) matches .tl-gl in styles.js
    for(var mo=1; mo<=moCount; mo++){
      var mt=document.createElement('div');
      mt.style.cssText='position:absolute;left:'+(LW+3)+'px;right:0;top:'+(yt-mo/(moCount+1)*PXY).toFixed(1)+'px;height:1px;background:rgba(255,255,255,0.12);z-index:1;';
      wrap.appendChild(mt);
    }
  }

  var cw=wrap.offsetWidth||320;
  var sx=LW+3+Math.round((cw-LW-3)/2);
  var sp=document.createElement('div');
  sp.style.cssText='position:absolute;left:'+sx+'px;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:2;';
  wrap.appendChild(sp);

  // NOW line
  var nl=document.createElement('div');
  nl.style.cssText='position:absolute;left:'+(LW+3)+'px;right:0;top:'+y(now).toFixed(1)+'px;height:2px;background:var(--primary);opacity:0.85;z-index:3;';
  wrap.appendChild(nl);

  var BW=13, BG=6, TG=5;
  jhSorted().forEach(function(job,i){
    var right=i%2===0;
    var hex=jhHexFor(job.colorIdx||0);
    var js=jhToH(jhCoStart(job)), je=jhCoEnd(job)?jhToH(jhCoEnd(job)):now;
    var bt=y(je), bh=Math.max(6,y(js)-bt);
    var bx=right?sx+BG:sx-BG-BW;

    var sRoles=job.roles.slice().filter(function(r){ return r.start; }).sort(function(a,b){ return jhToH(a.start)-jhToH(b.start); });
    var merged=[];
    sRoles.forEach(function(r){
      var rs=jhToH(r.start), re2=r.end?jhToH(r.end):null;
      if(!merged.length){ merged.push({s:rs,e:re2}); return; }
      var last=merged[merged.length-1];
      var gapMo=last.e!==null?Math.round((rs-last.e)*12):0;
      if(gapMo<=1&&last.e!==null) last.e=re2; else merged.push({s:rs,e:re2});
    });

    if(merged.length===1){
      var bar=document.createElement('div');
      bar.style.cssText='position:absolute;left:'+bx+'px;top:'+bt.toFixed(1)+'px;width:'+BW+'px;height:'+bh.toFixed(1)+'px;background:'+hex+';border:2px solid var(--border-color);border-radius:3px;z-index:3;';
      wrap.appendChild(bar);
    } else {
      merged.forEach(function(seg){
        var se=seg.e!==null?seg.e:now, st=y(se), sh=Math.max(4,y(seg.s)-st);
        var sg=document.createElement('div');
        sg.style.cssText='position:absolute;left:'+bx+'px;top:'+st.toFixed(1)+'px;width:'+BW+'px;height:'+sh.toFixed(1)+'px;background:'+hex+';border:2px solid var(--border-color);border-radius:3px;z-index:3;';
        wrap.appendChild(sg);
      });
      for(var mi=0; mi<merged.length-1; mi++){
        if(merged[mi].e!==null){
          var gt=y(merged[mi+1].s), gh=Math.max(2,y(merged[mi].e)-gt);
          var conn=document.createElement('div');
          conn.style.cssText='position:absolute;left:'+(bx+Math.floor(BW/2)-1)+'px;top:'+gt.toFixed(1)+'px;width:2px;height:'+gh.toFixed(1)+'px;background:rgba(255,255,255,0.25);z-index:3;';
          wrap.appendChild(conn);
        }
      }
    }
    sRoles.slice(1).forEach(function(r){
      var ry=y(jhToH(r.start));
      merged.forEach(function(seg){
        var se=seg.e!==null?seg.e:now, st=y(se), sh=Math.max(4,y(seg.s)-st);
        if(ry>st+1&&ry<st+sh-1){
          var rd=document.createElement('div');
          rd.style.cssText='position:absolute;left:'+bx+'px;top:'+ry.toFixed(1)+'px;width:'+BW+'px;height:2px;background:var(--border-color);z-index:4;';
          wrap.appendChild(rd);
        }
      });
    });

    var tag=document.createElement('div');
    tag.style.cssText='position:absolute;top:'+(bt+bh/2-11).toFixed(1)+'px;background:'+hex+';border:2px solid var(--border-color);border-radius:4px;padding:2px 8px;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text-dark);white-space:nowrap;z-index:4;cursor:pointer;';
    tag.textContent=job.company;
    if(right) tag.style.left=(bx+BW+TG)+'px';
    else       tag.style.right=(cw-bx+TG)+'px';
    wrap.appendChild(tag);
  });
}

// ── DATA VIEW ─────────────────────────────────────────────────────────────────
function jhRenderData(){
  var el=document.getElementById('jhDataView'); if(!el) return;
  el.innerHTML='';
  var exlbl=document.createElement('div'); exlbl.className='label-card'; exlbl.textContent='Export';
  var exta=document.createElement('textarea'); exta.className='jh-data-ta'; exta.readOnly=true; exta.id='jhExportTa';
  exta.value=JSON.stringify(JH_JOBS,null,2);
  var exbtn=document.createElement('button'); exbtn.className='jh-data-btn-export'; exbtn.id='jhBtnCopy'; exbtn.textContent='Copy to Clipboard';
  var imlbl=document.createElement('div'); imlbl.className='label-card'; imlbl.style.marginTop='var(--margin)'; imlbl.textContent='Import';
  var imta=document.createElement('textarea'); imta.className='jh-data-ta jh-import'; imta.id='jhImportTa'; imta.placeholder='Paste exported data here...';
  var imbtn=document.createElement('button'); imbtn.className='jh-data-btn-import'; imbtn.id='jhBtnImport'; imbtn.textContent='Load Data';
  var msg=document.createElement('div'); msg.className='jh-data-msg'; msg.id='jhDataMsg';
  [exlbl,exta,exbtn,imlbl,imta,imbtn,msg].forEach(function(n){ el.appendChild(n); });
}
function jhCopyExport(){
  var ta=document.getElementById('jhExportTa'); if(!ta) return;
  var ok=function(){ jhDataMsg('Copied!','var(--primary)'); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).then(ok).catch(function(){ ta.select(); document.execCommand('copy'); ok(); });
  } else { ta.select(); document.execCommand('copy'); ok(); }
}
function jhImportData(){
  var raw=(document.getElementById('jhImportTa')||{}).value||''; raw=raw.trim();
  if(!raw){ jhDataMsg('Nothing to import','var(--color-1)'); return; }
  try{
    var parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)){ jhDataMsg('Invalid format','var(--color-1)'); return; }
    JH_JOBS=parsed;
    JH_ID=JH_JOBS.reduce(function(m,j){ return Math.max(m,j.id||0); },0)+1;
    jhSave(); jhRenderCo(); jhDataMsg('Imported '+JH_JOBS.length+' entr'+(JH_JOBS.length===1?'y':'ies'),'var(--primary)');
  } catch(e){ jhDataMsg('Invalid JSON','var(--color-1)'); }
}
function jhDataMsg(txt,col){
  var el=document.getElementById('jhDataMsg'); if(!el) return;
  el.textContent=txt; el.style.color=col;
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function jhBuildSw(selIdx){
  jhSelColIdx=selIdx||0;
  var el=document.getElementById('jhSwatches'); if(!el) return;
  el.innerHTML='';
  var cols=typeof getSwatchColors==='function'?getSwatchColors():JH_COLORS_HEX;
  cols.forEach(function(col,i){
    var d=document.createElement('button'); d.className='jh-sw'+(i===jhSelColIdx?' on selected':'');
    d.style.background=col; d.dataset.ci=i; el.appendChild(d);
  });
}
function jhAddRole(data){
  jhRoleN++;
  var card=document.createElement('div'); card.className='jh-role-card';
  card.innerHTML='<div class="jh-role-card-hdr"><span>Role '+jhRoleN+'</span><span class="jh-role-card-del">\u2715</span></div>'+
    '<div class="jh-role-body">'+
      '<input type="text" placeholder="Title e.g. Developer" class="jh-rt">'+
      '<div class="jh-role-row">'+
        '<input type="month" style="color-scheme:dark" class="jh-rs" placeholder="Start">'+
        '<input type="month" style="color-scheme:dark" class="jh-re" placeholder="End">'+
      '</div>'+
      '<div class="jh-role-row jh-day-row">'+
        '<input type="number" min="1" max="31" class="jh-rsd" placeholder="Start day (opt)">'+
        '<input type="number" min="1" max="31" class="jh-red" placeholder="End day (opt)">'+
      '</div>'+
    '</div>';
  if(data){
    card.querySelector('.jh-rt').value=data.title||'';
    if(data.start){
      card.querySelector('.jh-rs').value=data.start[0]+'-'+String(data.start[1]).padStart(2,'0');
      if(data.start[2]) card.querySelector('.jh-rsd').value=data.start[2];
    }
    if(data.end){
      card.querySelector('.jh-re').value=data.end[0]+'-'+String(data.end[1]).padStart(2,'0');
      if(data.end[2]) card.querySelector('.jh-red').value=data.end[2];
    }
  }
  card.querySelector('.jh-rt').addEventListener('input',jhChkReady);
  card.querySelector('.jh-rs').addEventListener('change',jhChkReady);
  document.getElementById('jhRolesWrap').appendChild(card);
  // no auto-focus
  jhChkReady();
}
function jhChkReady(){
  var name=(document.getElementById('jhCompanyInp')||{}).value||''; name=name.trim();
  var ok=[].slice.call(document.querySelectorAll('.jh-rt')).some(function(i){ return i.value.trim(); });
  var ft=document.getElementById('jhFormFoot'); if(ft) ft.className='jh-form-foot'+(name&&ok?' ready':'');
}
function jhOpenNew(){
  jhEditId=null; jhRoleN=0;
  var t=document.getElementById('jhFormTitle'); if(t) t.textContent='New Career Entry';
  var inp=document.getElementById('jhCompanyInp'); if(inp) inp.value='';
  var rw=document.getElementById('jhRolesWrap'); if(rw) rw.innerHTML='';
  jhBuildSw(0); jhChkReady();
  jhSetBackSvg();
  var fw=document.getElementById('jhFormWindow');
  fw.classList.add('open');
  fw.setAttribute('tabindex','-1');
  fw.focus();
  if(typeof DrawnBorders!=='undefined'&&typeof appSettings!=='undefined'&&appSettings.drawnBorders){
    requestAnimationFrame(function(){ DrawnBorders._applyFormWindow('jhFormWindow'); });
  }
  jhAddRole();
}
function jhOpenEdit(id){
  var job=null;
  for(var i=0;i<JH_JOBS.length;i++){ if(JH_JOBS[i].id==id){ job=JH_JOBS[i]; break; } }
  if(!job) return;
  jhEditId=job.id; jhRoleN=0;
  var t=document.getElementById('jhFormTitle'); if(t) t.textContent='Edit Career Entry';
  var inp=document.getElementById('jhCompanyInp'); if(inp) inp.value=job.company;
  var rw=document.getElementById('jhRolesWrap'); if(rw) rw.innerHTML='';
  jhBuildSw(job.colorIdx||0);
  job.roles.forEach(function(r){ jhAddRole(r); });
  jhChkReady();
  document.getElementById('jhFormWindow').classList.add('open');
  if(typeof DrawnBorders!=='undefined'&&typeof appSettings!=='undefined'&&appSettings.drawnBorders){
    requestAnimationFrame(function(){ DrawnBorders._applyFormWindow('jhFormWindow'); });
  }
}
function jhCloseForm(){
  jhEditId=null;
  document.getElementById('jhFormWindow').classList.remove('open');
}
function jhSaveJob(){
  var ft=document.getElementById('jhFormFoot'); if(!ft||!ft.classList.contains('ready')) return;
  var roles=[].slice.call(document.querySelectorAll('.jh-role-card')).map(function(c){
    return { title:c.querySelector('.jh-rt').value.trim(), start:jhPmDay(c.querySelector('.jh-rs').value,c.querySelector('.jh-rsd').value), end:jhPmDay(c.querySelector('.jh-re').value,c.querySelector('.jh-red').value) };
  }).filter(function(r){ return r.title; });
  if(!roles.length) return;
  var now=new Date();
  roles.forEach(function(r){ if(!r.start) r.start=[now.getFullYear(),now.getMonth()+1]; });
  var name=(document.getElementById('jhCompanyInp')||{}).value.trim();
  if(jhEditId!==null){
    for(var i=0;i<JH_JOBS.length;i++){
      if(JH_JOBS[i].id===jhEditId){ JH_JOBS[i].company=name; JH_JOBS[i].colorIdx=jhSelColIdx; JH_JOBS[i].roles=roles; break; }
    }
  } else {
    JH_JOBS.unshift({id:JH_ID++, company:name, colorIdx:jhSelColIdx, roles:roles});
  }
  jhSave(); jhCloseForm(); jhRenderCo();
  if(jhView==='timeline') requestAnimationFrame(function(){ requestAnimationFrame(jhRenderTL); });
}

// ── EVENT DELEGATION ──────────────────────────────────────────────────────────
document.addEventListener('click', function(e){
  var win=document.getElementById('jhWindow'), form=document.getElementById('jhFormWindow');
  if(!win||(!win.contains(e.target)&&!form.contains(e.target))) return;
  var t=e.target;
  for(var i=0;i<10&&t&&t!==document;i++,t=t.parentElement){
    var dv=t.getAttribute&&t.getAttribute('data-jhview');
    if(dv){ jhSetView(dv); return; }
    if(t.id==='jhWindowBack'){ closeJobHistoryWindow(); return; }
    if(t.id==='jhBtnAdd'){ jhOpenNew(); return; }
    if(t.id==='jhFormBack'||t.classList.contains('jh-form-back')){ jhCloseForm(); return; }
    if(t.id==='jhBtnRole'){ jhAddRole(); return; }
    if(t.id==='jhFormFoot'){ jhSaveJob(); return; }
    if(t.id==='jhBtnCopy'){ jhCopyExport(); return; }
    if(t.id==='jhBtnImport'){ jhImportData(); return; }
    if(t.classList&&t.classList.contains('jh-sw')){
      document.querySelectorAll('.jh-sw').forEach(function(s){ s.classList.remove('on','selected'); });
      t.classList.add('on','selected'); jhSelColIdx=+t.dataset.ci; return;
    }
    if(t.classList&&t.classList.contains('jh-role-card-del')){
      t.closest('.jh-role-card').remove(); jhChkReady(); return;
    }
    if(t.classList&&t.classList.contains('jh-edit-btn')&&t.dataset.editid){
      jhOpenEdit(t.dataset.editid); return;
    }
    if(t.classList&&t.classList.contains('jh-del-btn')&&t.dataset.delid){
      if(t.dataset.armed){
        JH_JOBS=JH_JOBS.filter(function(j){ return j.id!=t.dataset.delid; });
        jhSave(); jhRenderCo();
        if(jhView==='timeline') requestAnimationFrame(function(){ requestAnimationFrame(jhRenderTL); });
      } else {
        t.dataset.armed='1'; t.textContent='Tap again to confirm';
        setTimeout(function(){ t.dataset.armed=''; t.textContent='\u2715 Remove'; },2500);
      }
      return;
    }
    if(t.classList&&t.classList.contains('jh-card')){
      var r=t.querySelector('.jh-card-roles');
      if(r){
        var wasOpen=r.classList.contains('open');
        document.querySelectorAll('.jh-card-roles.open').forEach(function(el){ el.classList.remove('open'); });
        if(!wasOpen) r.classList.add('open');
      }
      return;
    }
  }
}, true);

document.getElementById('jhCompanyInp').addEventListener('input', jhChkReady);

// ── FINAL BACK BUTTON INIT ────────────────────────────────────────────────────
// Run after all scripts (data.js, theme.js etc.) have created their windows
(function(){
  var isPxl=document.body.classList.contains('pxl-font');
  var svg=isPxl?'<svg width="20" height="20" viewBox="0 0 7 7" fill="none" shape-rendering="crispEdges"><rect x="4" y="0" width="1" height="1" fill="currentColor"/><rect x="3" y="1" width="1" height="1" fill="currentColor"/><rect x="2" y="2" width="1" height="1" fill="currentColor"/><rect x="1" y="3" width="1" height="1" fill="currentColor"/><rect x="2" y="4" width="1" height="1" fill="currentColor"/><rect x="3" y="5" width="1" height="1" fill="currentColor"/><rect x="4" y="6" width="1" height="1" fill="currentColor"/></svg>':'<svg width="22" height="22" viewBox="0 0 50 50" fill="none"><line x1="42" y1="10" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line x1="42" y1="40" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  document.querySelectorAll('.data-window-back').forEach(function(b){ b.innerHTML=svg; });
})();
