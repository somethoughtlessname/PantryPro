const ALL_DAY_LETTERS = ['S','M','T','W','T','F','S'];
function dcDelExtra(dk) {
  const job = jobs.find(j => j.id === activeJobId);
  if(job && job.schedule && job.schedule[dk]) {
    job.schedule[dk].extra = [];
    lsSet('sch_jobs', jobs);
  }
  delete _dcExpanded[dk];
  renderDayCards();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
}
function renderDayCards() {
  updateDaySqVar();
  const container = document.getElementById('dayCards'); if (!container) return;
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon: start } = getWeekRange(offset); container.innerHTML = '';
  const todayNow = new Date(); let totalMins = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const letter = ALL_DAY_LETTERS[d.getDay()]; const dateNum = String(d.getDate()).padStart(2,'0');
    const isToday = d.getFullYear()===todayNow.getFullYear()&&d.getMonth()===todayNow.getMonth()&&d.getDate()===todayNow.getDate();
    const todayCls = isToday ? ' day-sq-today' : '';
    const job = jobs.find(j => j.id === activeJobId); const dateKey = localDateKey(d);
    const dayData = getSchedObj(job, activeHours); const daySched = dayData && dayData[dateKey];
    const startVal = daySched && daySched.start; const endVal = daySched && daySched.end;
    const isOff = startVal === 'OFF' || endVal === 'OFF';
    const startTxt = isOff ? 'OFF' : (startVal && startVal !== 'NONE' ? startVal : 'START');
    const endTxt   = isOff ? 'OFF' : (endVal   && endVal   !== 'NONE' ? endVal   : 'END');
    const startCls = isOff ? ' day-half-off' : ''; const endCls = isOff ? ' day-half-off' : '';
    const ex0=(daySched&&daySched.extra&&daySched.extra[0])||{};
    const hasExtra=!!(ex0.start||ex0.end);
    // If day is OFF but has second shift data, migrate it into primary slot
    if(isOff && hasExtra) {
      const job2 = jobs.find(j => j.id === activeJobId);
      if(job2 && job2.schedule && job2.schedule[dateKey]) {
        const slot = job2.schedule[dateKey];
        slot.start = ex0.start; slot.end = ex0.end;
        slot.extra = [];
        lsSet('sch_jobs', jobs);
        // refresh local refs
        daySched.start = slot.start; daySched.end = slot.end;
        ex0.start = null; ex0.end = null;
      }
    }
    const _jobSS = window._currentJob ? window._currentJob.showSecondShift : appSettings.showSecondShift;
const showSplit = _jobSS===false && hasExtra;
    const hoursHtml = showSplit
      ? `<div class="day-hours${todayCls}" style="flex-direction:column;align-items:stretch;padding:0;">` +
        `<div style="flex:1;display:flex;align-items:center;justify-content:center;border-bottom:var(--border-width) solid var(--border-color);">${calcDuration(startVal,endVal)}</div>` +
        `<div style="flex:1;display:flex;align-items:center;justify-content:center;">${calcDuration(ex0.start,ex0.end)}</div></div>`
      : `<div class="day-hours${todayCls}">${calcDuration(startVal, endVal)}</div>`;
    const card = document.createElement('div'); card.className = 'day-card';
    card.innerHTML =
      `<div class="day-letter${todayCls}">${letter}</div>` +
      `<div class="day-date${todayCls}">${dateNum}</div>` +
      `<div class="day-body"><div class="day-body-half${startCls}" data-section="start">${startTxt}</div><div class="day-body-half${endCls}" data-section="end">${endTxt}</div></div>` +
      hoursHtml;
    const capturedDate = new Date(d);
    card.querySelectorAll('.day-body-half').forEach(half => {
      half.style.cursor = 'pointer';
      half.addEventListener('click', () => openSchedModal(capturedDate, half.dataset.section));
    });
    if(!isOff){const s=parseTimeToMins(startVal),e=parseTimeToMins(endVal);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=24*60;totalMins+=diff;}}
    if(hasExtra&&ex0.start&&ex0.end){const s=parseTimeToMins(ex0.start),e=parseTimeToMins(ex0.end);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=24*60;totalMins+=diff;}}
    if(_jobSS !== false) {
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--margin')) || 4;
    const sqW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-height')) || 45;
    const rowW = container.clientWidth > 10 ? container.clientWidth : (window.innerWidth - gap*2);
    // cardW: card fills row minus plusBtn, gap between them, and 4px right margin
    const cardW  = rowW - sqW - gap - 4;
    // card2W: same but minus two squares
    const card2W = rowW - sqW*2 - gap*2 - 4;
    // tx: how far track slides = card width + gap after it
    const tx = cardW + gap;
    // total track width = view1 + view2 (each = rowW - 4)
    const trackW = cardW + gap + sqW + gap + card2W + gap + sqW;
    const dcRow = document.createElement('div');
    dcRow.className = 'dc-row'; dcRow.dataset.dcRow = '1';
    const dcTrack = document.createElement('div');
    dcTrack.style.cssText = 'display:flex;align-items:stretch;gap:'+gap+'px;height:var(--card-height);transition:none;width:'+trackW+'px;';
    card.style.cssText += ';flex-shrink:0;flex:none;width:'+cardW+'px;';
    dcTrack.appendChild(card);

    // Plus button
    const ex0s2 = ex0.start&&ex0.start!=='NONE'?ex0.start:'START';
    const ex0e2 = ex0.end&&ex0.end!=='NONE'?ex0.end:'END';
    const _svgNS='http://www.w3.org/2000/svg';
    const _svg=document.createElementNS(_svgNS,'svg');
    _svg.setAttribute('width','26');_svg.setAttribute('height','26');_svg.setAttribute('viewBox','0 0 50 50');
    const _pl1=document.createElementNS(_svgNS,'line');
    const _pl2=document.createElementNS(_svgNS,'line');
    [_pl1,_pl2].forEach(function(l){l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    const _pStates={plus:{l1:[25,8,25,42],l2:[8,25,42,25]},back:{l1:[8,25,42,10],l2:[8,25,42,40]},fwd:{l1:[8,10,42,25],l2:[8,40,42,25]}};
    function _pSet(s){var st=_pStates[s];_pl1.setAttribute('x1',st.l1[0]);_pl1.setAttribute('y1',st.l1[1]);_pl1.setAttribute('x2',st.l1[2]);_pl1.setAttribute('y2',st.l1[3]);_pl2.setAttribute('x1',st.l2[0]);_pl2.setAttribute('y1',st.l2[1]);_pl2.setAttribute('x2',st.l2[2]);_pl2.setAttribute('y2',st.l2[3]);}
    function _pMorph(fromS,toS,dur,fromCol,toCol){var from=_pStates[fromS],to=_pStates[toS],start=null;function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}function hx(c){return parseInt(c,16);}function parseCol(v){var m=v.replace('#','');return[hx(m.slice(0,2)),hx(m.slice(2,4)),hx(m.slice(4,6))];}function step(ts){if(!start)start=ts;var t=Math.min((ts-start)/dur,1),e=ease(t);function lp(a,b){return a+(b-a)*e;}_pl1.setAttribute('x1',lp(from.l1[0],to.l1[0]));_pl1.setAttribute('y1',lp(from.l1[1],to.l1[1]));_pl1.setAttribute('x2',lp(from.l1[2],to.l1[2]));_pl1.setAttribute('y2',lp(from.l1[3],to.l1[3]));_pl2.setAttribute('x1',lp(from.l2[0],to.l2[0]));_pl2.setAttribute('y1',lp(from.l2[1],to.l2[1]));_pl2.setAttribute('x2',lp(from.l2[2],to.l2[2]));_pl2.setAttribute('y2',lp(from.l2[3],to.l2[3]));if(fromCol&&toCol){var fc=parseCol(fromCol),tc=parseCol(toCol);plusBtn.style.background='rgb('+Math.round(lp(fc[0],tc[0]))+','+Math.round(lp(fc[1],tc[1]))+','+Math.round(lp(fc[2],tc[2]))+')'}if(t<1)requestAnimationFrame(step);else if(toCol)plusBtn.style.background='rgb('+tc[0]+','+tc[1]+','+tc[2]+')';}requestAnimationFrame(step);}
    _pSet(hasExtra?'fwd':'plus');
    _svg.appendChild(_pl1);_svg.appendChild(_pl2);
    const plusBtn = document.createElement('div');
    plusBtn.className = 'day-card-plus';
    plusBtn.style.color = 'var(--text-light)';
    if(hasExtra)plusBtn.style.background='var(--accent)';
    plusBtn.appendChild(_svg);
    dcTrack.appendChild(plusBtn);

    // Card 2
    const card2 = document.createElement('div');
    card2.className = 'day-card';
    card2.style.cssText = 'flex-shrink:0;width:'+card2W+'px;overflow:hidden;';
    card2.innerHTML = '<div class="day-body" style="flex:1"><div class="day-body-half" data-section="start" style="max-width:calc(50% - 1px)">'+ex0s2+'</div><div class="day-body-half" data-section="end">'+ex0e2+'</div></div><div class="day-hours'+todayCls+'">'+calcDuration(ex0.start,ex0.end)+'</div>';
    card2.querySelectorAll('.day-body-half').forEach(function(b){b.style.cursor='pointer';b.onclick=function(){openSchedModal(capturedDate,b.dataset.section,1);};});
    dcTrack.appendChild(card2);

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.style.cssText = 'flex-shrink:0;width:var(--card-height);height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);background:var(--color-1);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:var(--text-light);cursor:pointer;';
    const _xsvg=document.createElementNS(_svgNS,'svg');
    _xsvg.setAttribute('width','26');_xsvg.setAttribute('height','26');_xsvg.setAttribute('viewBox','0 0 50 50');
    const _xl1=document.createElementNS(_svgNS,'line');const _xl2=document.createElementNS(_svgNS,'line');
    [_xl1,_xl2].forEach(function(l){l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    _xl1.setAttribute('x1','12');_xl1.setAttribute('y1','12');_xl1.setAttribute('x2','38');_xl1.setAttribute('y2','38');
    _xl2.setAttribute('x1','38');_xl2.setAttribute('y1','12');_xl2.setAttribute('x2','12');_xl2.setAttribute('y2','38');
    _xsvg.appendChild(_xl1);_xsvg.appendChild(_xl2);closeBtn.appendChild(_xsvg);
    dcTrack.appendChild(closeBtn);
    dcRow.appendChild(dcTrack);
    container.appendChild(dcRow);

    // Color morph for close button
    function _cMorph(toSwap, dur) {
      var cs = getComputedStyle(document.documentElement);
      function ph(v){var m=v.replace('#','');return[parseInt(m.slice(0,2),16),parseInt(m.slice(2,4),16),parseInt(m.slice(4,6),16)];}
      var c1=ph(cs.getPropertyValue('--color-1').trim());
      var tl=ph(cs.getPropertyValue('--text-light').trim());
      var fbg=toSwap?c1:tl, tbg=toSwap?tl:c1;
      var fst=toSwap?tl:c1, tst=toSwap?c1:tl;
      var s=null;
      function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
      function step(ts){
        if(!s)s=ts;
        var t=Math.min((ts-s)/dur,1),e=ease(t);
        function lp(a,b){return Math.round(a+(b-a)*e);}
        closeBtn.style.background='rgb('+lp(fbg[0],tbg[0])+','+lp(fbg[1],tbg[1])+','+lp(fbg[2],tbg[2])+')';
        var sc='rgb('+lp(fst[0],tst[0])+','+lp(fst[1],tst[1])+','+lp(fst[2],tst[2])+')';
        _xl1.style.stroke=sc;_xl2.style.stroke=sc;
        if(t<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // Slide helpers
    const T = 'transform 1.12s cubic-bezier(0.4,0,0.2,1)';
    function dcOpen() {
      dcTrack.style.transition = T;
      dcTrack.style.transform = 'translateX(-'+tx+'px)';
    }
    function dcClose(then) {
      dcTrack.style.transition = T;
      dcTrack.style.transform = '';
      dcTrack.addEventListener('transitionend', function h(){ dcTrack.removeEventListener('transitionend',h); if(then)then(); });
    }

    // Plus button click
    plusBtn.onclick = function() {
      if(isOff) {
        var cs2=getComputedStyle(document.documentElement);
        function ph2(v){var m=v.replace('#','');return[parseInt(m.slice(0,2),16),parseInt(m.slice(2,4),16),parseInt(m.slice(4,6),16)];}
        var cur=ph2(cs2.getPropertyValue(hasExtra?'--accent':'--secondary').trim());
        var grey=ph2(cs2.getPropertyValue('--muted').trim());
        function flash(fc,tc,dur,then){var s=null;function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}function step(ts){if(!s)s=ts;var t=Math.min((ts-s)/dur,1),e=ease(t);function lp(a,b){return Math.round(a+(b-a)*e);}plusBtn.style.background='rgb('+lp(fc[0],tc[0])+','+lp(fc[1],tc[1])+','+lp(fc[2],tc[2])+')';if(t<1)requestAnimationFrame(step);else if(then)then();}requestAnimationFrame(step);}
        flash(cur,grey,200,function(){setTimeout(function(){flash(grey,cur,300,null);},2500);});
        return;
      }
      const open = plusBtn._dcOpen === true;
      plusBtn._dcOpen = !open;
      _dcExpanded[dateKey] = !open;
      var forceplus = !!(open && plusBtn._forceplus);
      if(forceplus) delete plusBtn._forceplus;
      if(hasExtra && !forceplus){
        var cs=getComputedStyle(document.documentElement);
        var sec=cs.getPropertyValue('--secondary').trim();
        var acc=cs.getPropertyValue('--accent').trim();
        var fromCol=open?sec:acc;
        var toCol=open?(forceplus?sec:acc):sec;
        _pMorph(open?'back':'fwd',open?(forceplus?'plus':'fwd'):'back',1120,fromCol,toCol);
      } else {
        _pMorph(open?'back':'plus',open?'plus':'back',1120);
        plusBtn.style.background='';
      }
      if(open) {
        dcClose(null);
      } else {
        dcOpen();
      }
    };

    // Close button click
    closeBtn.dataset.dk = dateKey;
    closeBtn.onclick = function() {
      if(closeBtn.dataset.confirm==='1') {
        closeBtn.dataset.confirm='';
        plusBtn._forceplus = true;
        plusBtn.onclick();
        dcTrack.addEventListener('transitionend', function h(){
          dcTrack.removeEventListener('transitionend', h);
          setTimeout(function(){ dcDelExtra(closeBtn.dataset.dk); }, 50);
        });
      } else {
        closeBtn.dataset.confirm='1';
        closeBtn.style.background='var(--color-1)';
        _xl1.style.stroke='white';_xl2.style.stroke='white';
        _cMorph(true, 300);
        setTimeout(function(){
          if(closeBtn.dataset.confirm==='1'){
            closeBtn.dataset.confirm='';
            _cMorph(false, 300);
          }
        },2500);
      }
    };

    // Restore expanded state instantly
    if(_dcExpanded[dateKey]){
      if(hasExtra){
        plusBtn._dcOpen = true;
        _pSet('back');
        plusBtn.style.background = 'var(--secondary)';
        dcTrack.style.transition = 'none';
        dcTrack.style.transform = 'translateX(-'+tx+'px)';
      } else {
        delete _dcExpanded[dateKey];
        plusBtn.style.background='';
        _pSet('plus');
      }
    }
    } else {
      container.appendChild(card);
    } // end showSecondShift
  }
  const totEl = document.getElementById('totalsValue');
  if (totEl) totEl.innerHTML = `<span class="totals-h">${String(Math.floor(totalMins/60)).padStart(2,'0')} Hours</span><span class="totals-m">${String(totalMins%60).padStart(2,'0')} Minutes</span>`;
  // If grid view is currently active, rebuild it too
  var gv=document.getElementById('gridView');
  if(gv&&gv.style.display==='flex'){
    buildGridView(window._currentJob);
    // Restore 21-day span on dateRangeCard (renderDayCards may have overwritten it)
    var _dr2=document.getElementById('dateRangeCard');
    if(_dr2&&window._currentJob){
      var _j=window._currentJob;var _fdow=(_j.firstDow!==undefined)?_j.firstDow:1;
      var _td=new Date();_td.setHours(0,0,0,0);
      var _db=(_td.getDay()-_fdow+7)%7+7;
      var _st=new Date(_td.getTime()-_db*86400000);
      var _en=new Date(_st.getTime()+20*86400000);
      var _mo=typeof MONTHS!=='undefined'?MONTHS:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      _dr2.textContent=_mo[_st.getMonth()]+' '+_st.getDate()+' - '+_mo[_en.getMonth()]+' '+_en.getDate();
    }
  }
  if(typeof appSettings!=='undefined'&&appSettings.drawnBorders&&typeof DrawnBorders!=='undefined')
    requestAnimationFrame(function(){DrawnBorders.applyJobWindow();});
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let tpDigits=[],tpAmPm='AM',tpSpecial=null,tpDate=null,tpSection=null,tpHoursMode='scheduled',tpSmartPresets=[];

function openSchedModal(dateObj, section, si) {
  tpDate=dateObj; tpSection=section; tpShiftIndex=si||0; tpDigits=[]; tpSpecial=null; tpHoursMode=activeHours;
  const job=jobs.find(j=>j.id===activeJobId); const dateKey=localDateKey(dateObj);
  const dayData=getSchedObj(job,tpHoursMode); const dayEntry=dayData&&dayData[dateKey];
  const slot=tpShiftIndex===0?dayEntry:(dayEntry&&dayEntry.extra?dayEntry.extra[tpShiftIndex-1]:null);
  const saved=slot&&slot[section];
  if(saved&&saved!=='OFF'&&saved!=='NONE'){const parts=saved.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);if(parts){const hh=parts[1].padStart(2,'0');tpDigits=[+hh[0],+hh[1],+parts[2][0],+parts[2][1]];tpAmPm=parts[3];}}
  else if(saved==='OFF'||saved==='NONE'){tpSpecial=saved;}
  else{tpAmPm='AM';}
  document.getElementById('schedModalTitle').textContent = `${DAY_NAMES[dateObj.getDay()]}  ${MONTHS[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2,'0')}  -  ${section==='start'?'Start':'End'}`;
  renderTimePicker(); document.getElementById('schedModal').classList.add('open');
}

function getSmartPresets(job) {
  if(!job||!job.schedule)return[]; const counts={};
  Object.values(job.schedule).forEach(day=>{if(!day||!day.start||!day.end)return;if(day.start==='OFF'||day.start==='NONE')return;if(day.end==='OFF'||day.end==='NONE')return;const key=day.start+'|'+day.end;counts[key]=(counts[key]||0)+1;});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([key])=>{const[s,e]=key.split('|');return{start:s,end:e};});
}

function tpLoadSmartRange(idx) {
  const p=tpSmartPresets[idx]; if(!p)return; const job=jobs.find(j=>j.id===activeJobId); if(!job)return;
  const dayObj=ensureSchedObj(job,'scheduled',localDateKey(tpDate)); if(dayObj.start==='OFF'){dayObj.start=undefined;dayObj.end=undefined;}
  dayObj.start=p.start; dayObj.end=p.end; lsSet('sch_jobs',jobs); renderDayCards(); renderJobs();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
  if(typeof renderHistory==='function'){buildHistory();renderHistory();}
  closeSchedModal();
}

function renderTimePicker() {
  const job=jobs.find(j=>j.id===activeJobId); tpSmartPresets=(tpHoursMode==='scheduled')?getSmartPresets(job):[];
  const hasPresets=tpSmartPresets.length>0; const rows=hasPresets?5:4;
  const presetsHtml=hasPresets?tpSmartPresets.map((p,i)=>`<button class="tp-preset" onclick="tpLoadSmartRange(${i})" style="flex-direction:column;gap:2px;font-size:var(--text-xs);"><span>${p.start}</span><span style="color:var(--text-mid);">-</span><span>${p.end}</span></button>`).join(''):'';
  document.getElementById('schedModalBody').innerHTML = `
    <div class="tp-wrap">
      <div class="tp-display" id="tpDisplay"></div>
      <div class="tp-grid" style="grid-template-rows:repeat(${rows},var(--card-height));">
        <button class="tp-btn tp-red" onclick="tpBack()">&#9664;</button>
        <button class="tp-btn tp-blue" onclick="tpSetSpecial('OFF')">OFF</button>
        <button class="tp-btn tp-purple" onclick="tpSetSpecial('NONE')">NONE</button>
        <button class="tp-btn tp-red" onclick="tpClear()">C</button>
        <button class="tp-btn" onclick="tpDigit(1)">1</button><button class="tp-btn" onclick="tpDigit(2)">2</button><button class="tp-btn" onclick="tpDigit(3)">3</button>
        <button class="tp-btn tp-ampm" id="tpAM" onclick="tpSetAmPm('AM')">AM</button>
        <button class="tp-btn" onclick="tpDigit(4)">4</button><button class="tp-btn" onclick="tpDigit(5)">5</button><button class="tp-btn" onclick="tpDigit(6)">6</button>
        <button class="tp-btn tp-ampm" id="tpPM" onclick="tpSetAmPm('PM')">PM</button>
        <button class="tp-btn" onclick="tpDigit(7)">7</button><button class="tp-btn" onclick="tpDigit(8)">8</button><button class="tp-btn" onclick="tpDigit(9)">9</button><button class="tp-btn" onclick="tpDigit(0)">0</button>
        ${presetsHtml}
      </div>
      <div class="tp-footer">
        <button class="tp-cancel" onclick="closeSchedModal()">Cancel</button>
        <button class="tp-set" onclick="tpConfirm()">Set Time</button>
      </div>
    </div>`;
  tpRefreshDisplay();
}

function tpRefreshDisplay() {
  const el=document.getElementById('tpDisplay'); if(!el)return;
  if(tpSpecial){el.textContent=tpSpecial;el.classList.add('tp-special');}
  else{el.classList.remove('tp-special');const d=tpDigits;el.textContent=`${d[0]??'-'}${d[1]??'-'} : ${d[2]??'-'}${d[3]??'-'}  ${tpAmPm}`;}
  const amEl=document.getElementById('tpAM'); const pmEl=document.getElementById('tpPM');
  if(amEl)amEl.classList.toggle('active',tpAmPm==='AM'); if(pmEl)pmEl.classList.toggle('active',tpAmPm==='PM');
}

function tpDigit(n){
  if(tpSpecial){tpSpecial=null;tpDigits=[];} if(tpDigits.length>=4)tpDigits=[];
  const pos=tpDigits.length;
  if(pos===0){if(n>=2)tpDigits.push(0,n);else tpDigits.push(n);}
  else if(pos===1){if(tpDigits[0]===0&&n===0)return;if(tpDigits[0]===1&&n>2)return;tpDigits.push(n);}
  else if(pos===2){if(n>5)return;tpDigits.push(n);}
  else{tpDigits.push(n);}
  tpRefreshDisplay();
}
function tpBack(){if(tpSpecial){tpSpecial=null;tpRefreshDisplay();return;}tpDigits.pop();tpRefreshDisplay();}
function tpClear(){tpDigits=[];tpSpecial=null;tpRefreshDisplay();}
function tpSetAmPm(ap){tpAmPm=ap;tpSpecial=null;tpRefreshDisplay();}
function tpSetSpecial(s){tpSpecial=s;tpDigits=[];tpRefreshDisplay();tpConfirm();}

function tpConfirm() {
  const job=jobs.find(j=>j.id===activeJobId); if(!job){closeSchedModal();return;}
  const dayObj=ensureSchedObj(job,tpHoursMode,localDateKey(tpDate));
  let slot;
  if(tpShiftIndex===0){slot=dayObj;}else{if(!dayObj.extra)dayObj.extra=[];while(dayObj.extra.length<tpShiftIndex)dayObj.extra.push({});slot=dayObj.extra[tpShiftIndex-1];}
  if(tpSpecial==='OFF'){slot.start='OFF';slot.end='OFF';}
  else if(tpSpecial==='NONE'){delete slot[tpSection];}
  else if(tpDigits.length>=1){
    let d=[...tpDigits];
    if(d.length===1)d=[0,d[0],0,0];else if(d.length===2)d=[...d,0,0];else if(d.length===3)d=[...d,0];
    const hh=d[0]*10+d[1],mm=d[2]*10+d[3];
    if(hh<1||hh>12||mm>59){tpRefreshDisplay();return;}
    if(tpShiftIndex===0&&slot.start==='OFF'){slot.start=undefined;slot.end=undefined;}
    slot[tpSection]=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${tpAmPm}`;
  } else{closeSchedModal();return;}
  lsSet('sch_jobs',jobs); renderDayCards(); renderJobs();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
  if(typeof renderHistory==='function'){buildHistory();renderHistory();}
  closeSchedModal();
}
function closeSchedModal(){document.getElementById('schedModal').classList.remove('open');}

let _appInitDone = false;
document.getElementById('mainApp').style.opacity = '0';
buildWindows();
document.getElementById('jobSettingsBtn').appendChild(buildDotGrid());
(function(){
  const ns='http://www.w3.org/2000/svg';
  function makeBackArrow(){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('viewBox','0 0 50 50');
    const l1=document.createElementNS(ns,'line');const l2=document.createElementNS(ns,'line');
    [l1,l2].forEach(function(l){l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    l1.setAttribute('x1','42');l1.setAttribute('y1','10');l1.setAttribute('x2','8');l1.setAttribute('y2','25');
    l2.setAttribute('x1','42');l2.setAttribute('y1','40');l2.setAttribute('x2','8');l2.setAttribute('y2','25');
    svg.appendChild(l1);svg.appendChild(l2);
    return svg;
  }
  ['jobWindowBack','newWindowBack','jobSettingsWindowBack','settingsWindowBack'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.appendChild(makeBackArrow());
  });
})();
updateSettingsUI();
renderJobs();
applyTheme();
if (typeof applyCustomFont === 'function') applyCustomFont(appSettings.customFont);
requestAnimationFrame(() => {
  document.getElementById('mainApp').style.transition = 'opacity 0.15s';
  document.getElementById('mainApp').style.opacity = '1';
  _appInitDone = true;
  setTimeout(function(){ _graphAnimDone = true; }, 2000);
});
setInterval(() => { renderJobs(); }, 60000);

function switchJobView(view) {
  var dc=document.getElementById('dayCards');
  var gv=document.getElementById('gridView');
  var b1=document.getElementById('btnViewDayCard');
  var b2=document.getElementById('btnViewGrid');
  var wf=document.getElementById('weekFilterCard');
  var hf=document.getElementById('hoursCard');
  var dr=document.getElementById('dateRangeCard');
  var tc=document.getElementById('totalsCard');
  // Save preference to job
  if(window._currentJob){window._currentJob.defaultView=view;lsSet('sch_jobs',jobs);}
  if(view==='grid'){
    if(dc)dc.style.display='none';
    if(gv){gv.style.display='flex';buildGridView(window._currentJob);}
    if(b1)b1.classList.remove('active');
    if(b2)b2.classList.add('active');
    if(wf)wf.style.display='none';
    if(hf)hf.style.display='none';
    if(dr){
      dr.style.display='';
      // Update to show full 21-day span
      var _today=new Date();_today.setHours(0,0,0,0);
      var _fdow=(window._currentJob&&window._currentJob.firstDow!==undefined)?window._currentJob.firstDow:1;
      var _daysBack=(_today.getDay()-_fdow+7)%7+7;
      var _start=new Date(_today.getTime()-_daysBack*86400000);
      var _end=new Date(_start.getTime()+20*86400000);
      var _mo=typeof MONTHS!=='undefined'?MONTHS:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      dr.textContent=_mo[_start.getMonth()]+' '+_start.getDate()+' - '+_mo[_end.getMonth()]+' '+_end.getDate();
    }
    if(tc)tc.style.display='none';
  } else {
    if(dc)dc.style.display='flex';
    if(gv)gv.style.display='none';
    if(b1)b1.classList.add('active');
    if(b2)b2.classList.remove('active');
    if(wf)wf.style.display='';
    if(hf)hf.style.display='';
    if(dr){dr.style.display='';}
    if(tc)tc.style.display='';
    if(typeof updateDateRange==='function') updateDateRange(); else renderDayCards();
  }
}

function buildGridView(job) {
  var gv=document.getElementById('gridView');
  if(!gv||!job)return;
  gv.innerHTML='';
  var DAY=86400000,DOW=['S','M','T','W','T','F','S'];
  var today=new Date();today.setHours(0,0,0,0);
  var firstDow=(job.firstDow!==undefined)?job.firstDow:1;
  var daysSinceFirst=(today.getDay()-firstDow+7)%7;
  var weekStart=new Date(today.getTime()-daysSinceFirst*DAY);
  var mon=new Date(weekStart.getTime()-7*DAY); // last week start
  var cs=getComputedStyle(document.documentElement);
  var COL={past:cs.getPropertyValue('--secondary').trim(),today:cs.getPropertyValue('--primary').trim(),future:cs.getPropertyValue('--accent').trim()};
  var _bg2gv=cs.getPropertyValue('--bg-2').trim();
  var _rg=parseInt(_bg2gv.slice(1,3),16)||0,_gg=parseInt(_bg2gv.slice(3,5),16)||0,_bg=parseInt(_bg2gv.slice(5,7),16)||0;
  var _lumgv=(0.299*_rg+0.587*_gg+0.114*_bg)/255;
  var _adjgv=_lumgv<0.5?30:-30;
  function _cg(v){return Math.max(0,Math.min(255,v));}
  var GV_GRID_COL='rgb('+_cg(_rg+_adjgv)+','+_cg(_gg+_adjgv)+','+_cg(_bg+_adjgv)+')';
  var NIGHT='rgba(0,0,0,0.35)';
  var days=[];
  for(var i=0;i<21;i++){
    var d=new Date(mon.getTime()+i*DAY);
    var key=localDateKey(d),rel=Math.round((d-today)/DAY);
    var w=rel<0?'past':rel===0?'today':'future';
    var src=w==='past'?job.worked:job.schedule;
    var entry=src&&src[key],startH=null,endH=null;
    var isOff=entry&&entry.start&&(entry.start==='OFF'||entry.start==='NONE');
    if(entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end){
      var sm=parseTimeToMins(entry.start),em=parseTimeToMins(entry.end);
      if(sm!==null&&em!==null){if(em<=sm)em+=1440;startH=sm/60;endH=em/60;}
    }
    var extra2S=null,extra2E=null;
    var ex=(entry&&entry.extra&&entry.extra[0])||null;
    if(ex&&ex.start&&ex.start!=='NONE'&&ex.end){
      var sm2=parseTimeToMins(ex.start),em2=parseTimeToMins(ex.end);
      if(sm2!==null&&em2!==null){if(em2<=sm2)em2+=1440;extra2S=sm2/60;extra2E=em2/60;}
    }
    days.push({d:d,rel:rel,w:w,startH:startH,endH:endH,extra2S:extra2S,extra2E:extra2E,isOff:!!isOff});
  }
  var allS=days.filter(function(x){return x.startH!==null;}).map(function(x){return x.startH;});
  var allE=days.filter(function(x){return x.endH!==null;}).map(function(x){return x.endH;});
  days.forEach(function(x){if(x.extra2S!==null){allS.push(x.extra2S);allE.push(x.extra2E);}});
  if(!allS.length){gv.innerHTML='<div style="padding:16px;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-widest);text-transform:uppercase;color:var(--text-mid);">Nothing Scheduled</div>';return;}
  var TSTART=Math.floor(Math.min.apply(null,allS)),TEND=Math.ceil(Math.max.apply(null,allE));
  var DSTART=TSTART-1,DEND=TEND+1,DSPAN=DEND-DSTART;
  function pct(h){return((h-DSTART)/DSPAN*100).toFixed(2)+'%';}
  function isNight(h){return h<6||h>=18;}
  function jit(s,r){var x=Math.sin(s*9301+49297)*233280;return(x-Math.floor(x)-0.5)*r;}
  var WEEK_LABELS=['Last Week','This Week','Next Week'];
  var ns='http://www.w3.org/2000/svg';
  var labW='calc(var(--day-sq)*2)',hrsW='calc(var(--day-sq)*2 + var(--border-width))';

  function buildAxis(){
    var axis=document.createElement('div');axis.className='tw-axis';
    var sp=document.createElement('div');sp.className='tw-axis-spacer';
    sp.style.cssText='width:'+labW+';background:'+(isNight(TSTART)?NIGHT:'')+'';
    var tk=document.createElement('div');tk.className='tw-axis-ticks';
    for(var h=TSTART;h<=TEND;h++){
      var t=document.createElement('div');t.className='tw-tick';t.style.left=pct(h);
      t.textContent=h>12?String(h-12):String(h);tk.appendChild(t);
    }
    if(TSTART<6){var o=document.createElement('div');o.style.cssText='position:absolute;top:0;left:0;width:'+pct(6)+';height:100%;background:'+NIGHT+';pointer-events:none;';tk.appendChild(o);}
    if(TEND>18){var o2=document.createElement('div');o2.style.cssText='position:absolute;top:0;left:'+pct(18)+';right:0;height:100%;background:'+NIGHT+';pointer-events:none;';tk.appendChild(o2);}
    var ar=document.createElement('div');ar.style.cssText='width:'+hrsW+';flex-shrink:0;background:'+(isNight(TEND)?NIGHT:'var(--secondary)')+';';
    axis.appendChild(sp);axis.appendChild(tk);axis.appendChild(ar);
    return axis;
  }

  for(var w=0;w<3;w++){
    var card=document.createElement('div');card.className='tw-card';
    for(var di=0;di<7;di++){
      var i=w*7+di;
      var day=days[i];
      var row=document.createElement('div');row.className='tw-row'+(day.rel===0?' tw-today':'');
      var dl=document.createElement('div');dl.className='tw-day-lbl';dl.textContent=DOW[day.d.getDay()];row.appendChild(dl);
      var dn=document.createElement('div');dn.className='tw-date-lbl';dn.textContent=String(day.d.getDate()).padStart(2,'0');row.appendChild(dn);
      var tl=document.createElement('div');tl.className='tw-timeline';
      var dur=0;
      if(day.startH!==null){
        for(var h=TSTART;h<=TEND;h++){var gl=document.createElement('div');gl.className='tw-gl';gl.style.left=pct(h);gl.style.background=GV_GRID_COL;tl.appendChild(gl);}
        var js=day.rel<0?jit(i*3+1,0.6):0,je=day.rel<0?jit(i*3+2,0.6):0;
        var s=day.startH+js,e=day.endH+je;dur=e-s;
        var blk=document.createElement('div');blk.className='tw-shift';
        blk.style.left=pct(s);blk.style.width='calc('+pct(e)+' - '+pct(s)+')';
        blk.style.background=COL[day.w];tl.appendChild(blk);
      } else {
        var offEl=document.createElement('div');offEl.className='tw-off';
        offEl.textContent=day.isOff?'Off':'Not Scheduled';
        tl.appendChild(offEl);
      }
      row.appendChild(tl);
      var hrs=document.createElement('div');hrs.className='tw-hours';hrs.textContent=(dur>0?(dur<10?'0':'')+dur.toFixed(2):'00.00');row.appendChild(hrs);
      card.appendChild(row);

      if(day.startH!==null&&day.extra2S!==null){
        var js2=day.rel<0?jit(i*3+3,0.6):0,je2=day.rel<0?jit(i*3+4,0.6):0;
        var s2=day.extra2S+js2,e2=day.extra2E+je2,dur2=e2-s2;
        var overlaps=Math.max(s,s2)<Math.min(e,e2);
        var blk2=document.createElement('div');blk2.className='tw-shift';
        blk2.style.left=pct(s2);blk2.style.width='calc('+pct(e2)+' - '+pct(s2)+')';
        blk2.style.background=COL[day.w];
        if(!overlaps){
          tl.appendChild(blk2);
          var _t=dur+dur2;hrs.textContent=(_t<10?'0':'')+_t.toFixed(2);
        } else {
          var row2=document.createElement('div');row2.className='tw-row'+(day.rel===0?' tw-today':'');
          var dl2=document.createElement('div');dl2.className='tw-day-lbl';row2.appendChild(dl2);
          var dn2=document.createElement('div');dn2.className='tw-date-lbl';row2.appendChild(dn2);
          var tl2=document.createElement('div');tl2.className='tw-timeline';
          for(var h2=TSTART;h2<=TEND;h2++){var gl2=document.createElement('div');gl2.className='tw-gl';gl2.style.left=pct(h2);gl2.style.background=GV_GRID_COL;tl2.appendChild(gl2);}
          tl2.appendChild(blk2);row2.appendChild(tl2);
          var hrs2=document.createElement('div');hrs2.className='tw-hours';hrs2.textContent=(dur2<10?'0':'')+dur2.toFixed(2);row2.appendChild(hrs2);
          card.appendChild(row2);
        }
      }
    }
    if(w===0) card.insertBefore(buildAxis(), card.firstChild);
    if(w===2) card.appendChild(buildAxis());
    gv.appendChild(card);
  }

  // Legend card
  if(job.showGridLegend!==false){
    var legend=document.createElement('div');
    legend.style.cssText='height:var(--card-height);border:var(--bw) solid var(--bc);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;'
      .replace('var(--bw)','var(--border-width)').replace('var(--bc)','var(--border-color)').replace('var(--radius)','var(--radius)');
    legend.style.height='var(--card-height)';
    legend.style.border='var(--border-width) solid var(--border-color)';
    legend.style.borderRadius='var(--radius)';
    legend.style.overflow='hidden';
    legend.style.display='flex';
    legend.style.alignItems='stretch';
    legend.style.flexShrink='0';
    [['Past',COL.past],['Today',COL.today],['Future',COL.future]].forEach(function(item,i){
      var sec=document.createElement('div');
      sec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:'+item[1]+';;'+(i<2?'border-right:var(--border-width) solid var(--border-color);':'');
      sec.style.flex='1';sec.style.display='flex';sec.style.alignItems='center';sec.style.justifyContent='center';
      sec.style.background=item[1];
      if(i<2)sec.style.borderRight='var(--border-width) solid var(--border-color)';
      var lbl=document.createElement('span');
      lbl.style.cssText='font-size:var(--text-sm);font-weight:var(--fw-heavy);letter-spacing:var(--ls-widest);text-transform:uppercase;color:var(--text-light);';
      lbl.textContent=item[0];sec.appendChild(lbl);legend.appendChild(sec);
    });
    gv.appendChild(legend);
  }
}
