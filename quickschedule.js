/* quickschedule.js - Quick Schedule feature
   Requires: app.js globals - jobs, parseTimeToMins, localDateKey, MONTHS, DAY_NAMES, openJobWindow
*/

const QS_DAYS    = 7;
const QS_ROW_PX  = 18;  // matches --qs-row
const QS_HDR_PX  = 18;  // matches --qs-hdr
const QS_BDR_PX  = 3;    // matches --border-width
const QS_RADIUS  = '8px'; // matches --radius

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const d = v => Math.round(v * factor).toString(16).padStart(2,'0');
  return '#' + d(r) + d(g) + d(b);
}

function buildQuickSchedule() {
  const mainApp = document.getElementById('mainApp');
  if (!mainApp) return;
  let wrap = document.getElementById('quickSchedule');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'quickSchedule';
    wrap.className = 'qs-wrap';
    mainApp.appendChild(wrap);
  } else if (!wrap.parentNode || wrap.parentNode !== mainApp) {
    mainApp.appendChild(wrap);
  }
}

function renderQuickSchedule() {
  let wrap = document.getElementById('quickSchedule');
  if (!wrap) {
    buildQuickSchedule();
    wrap = document.getElementById('quickSchedule');
    if (!wrap) return;
  }
  wrap.innerHTML = '';
  if (!jobs || jobs.length === 0) return;

  /* -- collect days -- */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];

  for (let di = 0; di < ((appSettings && appSettings.qsDays) || QS_DAYS); di++) {
    const date = new Date(today);
    date.setDate(today.getDate() + di);
    const key = localDateKey(date);
    const shifts = [];
    jobs.forEach(job => {
      if (!job.schedule || !job.schedule[key]) return;
      const s    = job.schedule[key];
      const isOff = s.start === 'OFF' || s.start === 'NONE' || (!s.start && !s.end);
      const startMins = (!isOff && s.start && s.start !== 'NONE') ? parseTimeToMins(s.start) : null;
      const endMins   = (!isOff && s.end   && s.end   !== 'NONE') ? parseTimeToMins(s.end)   : null;
      const normEnd = (endMins !== null && startMins !== null && endMins < startMins)
        ? endMins + 1440 : endMins;
      shifts.push({ job, startMins, endMins: normEnd, isOff });
      // Extra shifts for same job/day
      if (!isOff && Array.isArray(s.extra)) {
        s.extra.forEach(ex => {
          const exStart = (ex.start && ex.start !== 'NONE') ? parseTimeToMins(ex.start) : null;
          const exEnd   = (ex.end   && ex.end   !== 'NONE') ? parseTimeToMins(ex.end)   : null;
          if (exStart === null || exEnd === null) return;
          const exNormEnd = exEnd < exStart ? exEnd + 1440 : exEnd;
          shifts.push({ job, startMins: exStart, endMins: exNormEnd, isOff: false });
        });
      }
    });
    days.push({ date, shifts });
  }

  /* -- axis range -- */
  let axisMin = Infinity, axisMax = -Infinity;
  days.forEach(({ shifts }) => shifts.forEach(s => {
    if (s.isOff || s.startMins === null || s.endMins === null) return;
    axisMin = Math.min(axisMin, s.startMins);
    axisMax = Math.max(axisMax, s.endMins);
  }));
  if (axisMin === Infinity) {
    axisMin = 12 * 60;      // default: 12PM
    axisMax = 24 * 60;      // default: 12AM midnight
  }
  const axisLeft  = Math.floor(axisMin / 60) * 60;
  const axisRight = Math.ceil(axisMax  / 60) * 60;
  const bufLeft   = axisLeft;
  const bufRight  = axisRight;
  const totalSpan = bufRight - bufLeft;

  const ticks = [];
  for (let m = axisLeft; m <= axisRight; m += 60) ticks.push(m);


  function pct(m) { return ((m - bufLeft) / totalSpan) * 100; }
  function hr12(m) { const h = Math.floor(m / 60) % 24; return h > 12 ? h - 12 : (h === 0 ? 12 : h); }


  const cs = getComputedStyle(document.documentElement);
  const _qsRaw = (appSettings && appSettings.qsColor) || '--swatch-7';
  const QS_PURPLE = _qsRaw.startsWith('--') ? cs.getPropertyValue(_qsRaw).trim() : (_qsRaw || cs.getPropertyValue('--accent').trim());
  const QS_PURPLE_DK = darkenColor(QS_PURPLE, 0.8);
  const QS_NIGHT_MODE = (appSettings && appSettings.timelineNightMode) || '6pm6am';

  // Adaptive grid line color from --bg-2
  const _bg2qs = cs.getPropertyValue('--bg-2').trim();
  const _rq=parseInt(_bg2qs.slice(1,3),16)||0,_gq=parseInt(_bg2qs.slice(3,5),16)||0,_bq=parseInt(_bg2qs.slice(5,7),16)||0;
  const _lumq=(0.299*_rq+0.587*_gq+0.114*_bq)/255;
  const _adjq=_lumq<0.5?30:-30;
  const _clampq=v=>Math.max(0,Math.min(255,v));
  const QS_GRID_COL=`rgb(${_clampq(_rq+_adjq)},${_clampq(_gq+_adjq)},${_clampq(_bq+_adjq)})`;

  function addNightOverlay(container, s, e) {
    const oLeft  = Math.max(s, bufLeft);
    const oRight = Math.min(e, bufRight);
    if (oLeft >= oRight) return;
    const ol = pct(oLeft);
    const ow = pct(oRight) - ol;
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;top:0;left:${ol}%;width:${ow}%;height:100%;`
      + `background:rgba(0,0,0,0.32);pointer-events:none;z-index:1;`;
    container.appendChild(overlay);
  }

  function addQSNightZones(container) {
    if (QS_NIGHT_MODE === 'off') return;
    if (QS_NIGHT_MODE === '6pm6am') {
      addNightOverlay(container, 0,    6*60);    // midnight-6am
      addNightOverlay(container, 18*60, 24*60);  // 6pm-midnight
    } else {
      addNightOverlay(container, 12*60, 24*60);  // noon-midnight
    }
  }

  /* -- title -- */
  const title = document.createElement('div');
  title.className = 'label-card';
  title.textContent = 'Quick Schedule';
  wrap.appendChild(title);

  /* -- unified card -- */
  const card = document.createElement('div');
  card.className = 'qs-card';
  wrap.appendChild(card);

  let todayHasShifts = false;
  days.forEach(({ date, shifts }, idx) => {
    const isToday     = date.getTime() === today.getTime();
    const validShifts = shifts.filter(s => !s.isOff && s.startMins !== null && s.endMins !== null);
    const allOff      = shifts.length > 0 && shifts.every(s => s.isOff);
    const hasShifts   = validShifts.length > 0;
    if (isToday && hasShifts && !allOff) todayHasShifts = true;

    const dayLabel = isToday
      ? 'TODAY'
      : `${DAY_NAMES[date.getDay()].toUpperCase()}  ${MONTHS[date.getMonth()].toUpperCase()} ${date.getDate()}`;

    /* day header - inline height to guarantee render */
    const hdrHeight = isToday ? QS_ROW_PX : QS_HDR_PX;
    const hdr = document.createElement('div');
    hdr.className = 'qs-day-hdr' + (idx === 0 ? ' qs-first' : '');
    hdr.style.cssText = `background:${QS_PURPLE};height:${hdrHeight}px;position:relative;overflow:visible;`;

    const hdrText = document.createElement('span');
    hdrText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);white-space:nowrap;';
    hdrText.textContent = dayLabel;
    hdr.appendChild(hdrText);

    card.appendChild(hdr);

    if (hasShifts) {
      const rows = qsAssignRows(validShifts);
      rows.forEach((row, rowIdx) => {
        const rowHeight = QS_ROW_PX;
        const rowEl = document.createElement('div');
        rowEl.className      = 'qs-job-row';
        rowEl.style.height   = rowHeight + 'px';
        rowEl.style.position = 'relative';
        rowEl.style.borderTop = 'none';

        /* inner container with QS_ROW_PX margin each side */
        const rowInner = document.createElement('div');
        rowInner.style.cssText = `position:absolute;top:0;height:${rowHeight}px;left:${QS_ROW_PX}px;right:${QS_ROW_PX}px;`;

        /* grid lines */
        ticks.forEach(tick => {
          const line = document.createElement('div');
          line.style.cssText = `position:absolute;top:0;height:${rowHeight}px;width:1px;background:${QS_GRID_COL};left:${pct(tick)}%;transform:translateX(-50%);pointer-events:none;z-index:0;`;
          rowInner.appendChild(line);
        });

        /* job cards */
        row.forEach(shift => {
          const jc = document.createElement('div');
          const l  = pct(shift.startMins);
          const w  = pct(shift.endMins) - l;
          jc.style.cssText = `position:absolute;top:0;height:${rowHeight}px;left:${l}%;width:${w}%;z-index:2;`
            + `border:${QS_BDR_PX}px solid ${shift.job.color};border-radius:${QS_RADIUS};`
            + `background:var(--bg-4);color:var(--text-dark);font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;`
            + `display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`
            + `padding:0 4px;box-sizing:border-box;cursor:pointer;`;
          jc.textContent = shift.job.title;
          jc.onclick = () => openJobWindow(shift.job);
          rowInner.appendChild(jc);
        });

        rowEl.appendChild(rowInner);
        card.appendChild(rowEl);
      });


    } else {
      /* empty row */
      const emptyRow = document.createElement('div');
      emptyRow.className    = 'qs-job-row qs-row-off';
      emptyRow.style.height = QS_ROW_PX + 'px';
      if (allOff) {
        emptyRow.textContent = 'YOU HAVE THE DAY OFF!';
        emptyRow.style.color = 'var(--text-mid)';
      } else {
        emptyRow.textContent = 'NO SHIFTS SCHEDULED YET';
      }
      card.appendChild(emptyRow);

    }
  });

  /* -- today time indicator - triangle pointing down, only within content hours -- */
  if (typeof appSettings !== "undefined" && appSettings.showTimeDot && todayHasShifts) {
    const nowMins2 = new Date().getHours() * 60 + new Date().getMinutes();
    // Only show within the actual hour range, not in the gap margins
    if (nowMins2 > axisLeft && nowMins2 < axisRight) {
      const cp = pct(nowMins2);
      const dotLeft = 'calc(' + QS_ROW_PX + 'px + ' + cp.toFixed(2) + '% - ' + (cp / 100 * QS_ROW_PX * 2).toFixed(2) + 'px)';
      const dotTop = QS_ROW_PX;
      card.style.position = 'relative';
      const dot = document.createElement('div');
      dot.id = 'qsTimeDot';
      dot.style.cssText = 'position:absolute;pointer-events:none;z-index:20;'
        + 'width:0;height:0;'
        + 'border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--border-color);'
        + 'left:' + dotLeft + ';'
        + 'top:' + (dotTop-1) + 'px;transform:translateX(-50%);';
      card.appendChild(dot);
    }
  }

  /* -- axis -- */
  const axis = document.createElement('div');
  axis.className    = 'qs-axis';
  axis.style.height = QS_ROW_PX + 'px';

  function isNight(m) {
    if (QS_NIGHT_MODE === 'off') return false;
    const t = m % 1440;
    if (QS_NIGHT_MODE === '12pm12am') return t >= 720;
    return t >= 1080 || t < 360;
  }

  /* multi-day gradient background for axis */
  function toFullPct(cp) {
    return `calc(${(QS_ROW_PX*(1-2*cp/100)).toFixed(2)}px + ${cp.toFixed(2)}%)`;
  }
  const M = QS_ROW_PX;
  const lmColor = isNight(axisLeft)  ? QS_PURPLE_DK : QS_PURPLE;
  const rmColor = isNight(axisRight) ? QS_PURPLE_DK : QS_PURPLE;

  // Collect all night ranges within [bufLeft, bufRight]
  var nightRanges = [];
  if (QS_NIGHT_MODE !== 'off') {
    var nightS60 = QS_NIGHT_MODE === '12pm12am' ? 12*60 : 18*60;
    var nightE60 = QS_NIGHT_MODE === '12pm12am' ? 24*60 : 30*60;
    var totalMins = bufRight - bufLeft + 1440;
    for (var nd = -1; nd <= Math.ceil(totalMins / 1440); nd++) {
      var ns = nd * 1440 + nightS60, ne = nd * 1440 + nightE60;
      // For 6pm6am also add early morning
      if (QS_NIGHT_MODE === '6pm6am') {
        var ms = nd * 1440, me = nd * 1440 + 6*60;
        var cl = Math.max(ms, bufLeft), cr = Math.min(me, bufRight);
        if (cl < cr) nightRanges.push([cl, cr]);
      }
      var l = Math.max(ns, bufLeft), r = Math.min(ne, bufRight);
      if (l < r) nightRanges.push([l, r]);
    }
    nightRanges.sort(function(a,b){return a[0]-b[0];});
  }

  // Build gradient stops
  var stops = [`${lmColor} 0,${lmColor} ${M}px`];
  var cur = bufLeft; var prevColor = QS_PURPLE;
  nightRanges.forEach(function(nr) {
    var l = nr[0], r = nr[1];
    if (l > cur) stops.push(`${QS_PURPLE} ${toFullPct(pct(cur))},${QS_PURPLE} ${toFullPct(pct(l))}`);
    stops.push(`${QS_PURPLE_DK} ${toFullPct(pct(l))},${QS_PURPLE_DK} ${toFullPct(pct(r))}`);
    cur = r;
  });
  if (cur < bufRight) stops.push(`${QS_PURPLE} ${toFullPct(pct(cur))},${QS_PURPLE} calc(100% - ${M}px)`);
  else stops.push(`${QS_PURPLE} calc(100% - ${M}px)`);
  stops.push(`${rmColor} calc(100% - ${M}px),${rmColor} 100%`);
  const bg = `linear-gradient(to right,${stops.join(',')})`;

  const axisBg = document.createElement('div');
  axisBg.style.cssText = `position:absolute;inset:0;background:${bg};`;
  axis.appendChild(axisBg);

  /* tick labels */
  const axisInner = document.createElement('div');
  axisInner.style.cssText = `position:absolute;top:0;bottom:0;left:${M}px;right:${M}px;overflow:visible;`;
  ticks.forEach(tick => {
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:${pct(tick)}%;top:50%;transform:translate(-50%,-50%);`
      + `font-size:10px;font-weight:800;color:var(--text-light);letter-spacing:0.04em;z-index:1;`;
    lbl.textContent = hr12(tick);
    axisInner.appendChild(lbl);
  });
  axis.appendChild(axisInner);

  card.appendChild(axis);
}

function qsAssignRows(shifts) {
  const sorted = [...shifts].sort((a, b) => a.startMins - b.startMins);
  const rows = [];
  sorted.forEach(shift => {
    let placed = false;
    for (const row of rows) {
      if (row[row.length - 1].endMins <= shift.startMins) {
        row.push(shift); placed = true; break;
      }
    }
    if (!placed) rows.push([shift]);
  });
  return rows;
}

/* -- init -- */
window.addEventListener('load', function() {
  buildQuickSchedule();
  renderQuickSchedule();
  if (typeof updateSettingsUI === 'function') updateSettingsUI();
});
