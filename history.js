/* history.js - History feature
   Requires: app.js globals - jobs, parseTimeToMins, localDateKey, MONTHS
*/

function buildHistory() {
  const mainApp = document.getElementById('mainApp');
  if (!mainApp) return;
  let wrap = document.getElementById('historyWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'historyWrap';
    wrap.style.cssText = 'width:100%;max-width:540px;display:flex;flex-direction:column;gap:var(--margin);';
    mainApp.appendChild(wrap);
  } else if (!wrap.parentNode || wrap.parentNode !== mainApp) {
    mainApp.appendChild(wrap);
  }
}

/* -- helpers -- */
function hOrdinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function hFmtDate(d) {
  return `${MONTHS[d.getMonth()].toUpperCase()} ${hOrdinal(d.getDate()).toUpperCase()}`;
}

function hFmtHours(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2,'0')}.${String(Math.round(m / 60 * 100)).padStart(2,'0')}`;
}

function hGetWeekRange(anchorDow, offset) {
  const now  = new Date();
  const diff = (now.getDay() - anchorDow + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff + offset * 7);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return { start, end };
}

function hSumHours(store, start, end) {
  // sum all jobs' store (schedule or worked) between start and end dates
  let total = 0;
  const d = new Date(start);
  while (d <= end) {
    const key = localDateKey(d);
    jobs.forEach(job => {
      const dayData = job[store] && job[store][key];
      if (!dayData || !dayData.start || !dayData.end) { d.setDate(d.getDate()+0); return; }
      if (dayData.start === 'OFF' || dayData.start === 'NONE') return;
      const s = parseTimeToMins(dayData.start);
      const e = parseTimeToMins(dayData.end);
      if (s === null || e === null) return;
      let diff2 = e - s;
      if (diff2 <= 0) diff2 += 24 * 60;
      total += diff2;
      if (Array.isArray(dayData.extra)) dayData.extra.forEach(ex => {
        if (!ex.start || !ex.end) return;
        const es = parseTimeToMins(ex.start), ee = parseTimeToMins(ex.end);
        if (es === null || ee === null) return;
        let ed = ee - es; if (ed <= 0) ed += 24*60; total += ed;
      });
    });
    d.setDate(d.getDate() + 1);
  }
  return total;
}

function hProjected(start, end) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let total = 0;
  const d = new Date(start);
  while (d <= end) {
    const key = localDateKey(d);
    const isToday = localDateKey(d) === localDateKey(now);
    const isFuture = d > now;
    jobs.forEach(job => {
      if (!job.schedule || !job.schedule[key]) return;
      const dayData = job.schedule[key];
      if (!dayData.start || dayData.start === 'OFF' || dayData.start === 'NONE') return;
      const s = parseTimeToMins(dayData.start);
      const e = parseTimeToMins(dayData.end);
      if (s === null || e === null) return;
      let dur = e - s;
      if (dur <= 0) dur += 24 * 60;

      if (isFuture) {
        total += dur;
        if (Array.isArray(dayData.extra)) dayData.extra.forEach(ex => {
          if (!ex.start || !ex.end) return;
          const es = parseTimeToMins(ex.start), ee = parseTimeToMins(ex.end);
          if (es === null || ee === null) return;
          let ed = ee - es; if (ed <= 0) ed += 24*60; total += ed;
        });
      } else if (isToday) {
        if (nowMins < s) {
          total += dur; // shift not started yet - count full
        } else if (nowMins < s + dur) {
          total += (s + dur) - nowMins; // shift in progress - count remaining
        }
        // also count any extra shifts that haven't started yet
        if (Array.isArray(dayData.extra)) dayData.extra.forEach(ex => {
          if (!ex.start || !ex.end) return;
          const es = parseTimeToMins(ex.start), ee = parseTimeToMins(ex.end);
          if (es === null || ee === null) return;
          let ed = ee - es; if (ed <= 0) ed += 24*60;
          if (nowMins < es) total += ed;
          else if (nowMins < es + ed) total += (es + ed) - nowMins;
        });
      }
      // past days and in-progress shifts not counted
    });
    // add worked hours for past days and today
    if (!isFuture) {
      const wd = job => {
        if (!job.worked || !job.worked[key]) return 0;
        const wd2 = job.worked[key];
        if (!wd2.start || wd2.start === 'OFF' || wd2.start === 'NONE') return 0;
        const s2 = parseTimeToMins(wd2.start);
        const e2 = parseTimeToMins(wd2.end);
        if (s2 === null || e2 === null) return 0;
        let dur2 = e2 - s2;
        if (dur2 <= 0) dur2 += 24 * 60;
        return dur2;
      };
      jobs.forEach(job => { total += wd(job); });
    }
    d.setDate(d.getDate() + 1);
  }
  return total;
}

/* -- build a week card -- */
function hWeekCard(label, offset, anchorDow) {
  const { start, end } = hGetWeekRange(anchorDow, offset);
  const isThisWeek = offset === 0;
  const isLastWeek = offset === -1;

  const schedMins  = hSumHours('schedule', start, end);
  const workedMins = isLastWeek || isThisWeek ? hSumHours('worked', start, end) : 0;
  const projMins   = isThisWeek ? hProjected(start, end) : 0;

  const _csH = getComputedStyle(document.documentElement);
  const _histRaw = (typeof appSettings !== 'undefined' && appSettings.histColor) || '--swatch-6';
  const green = _histRaw.startsWith('--') ? _csH.getPropertyValue(_histRaw).trim() : (_histRaw || 'var(--secondary)');
  const darkBg  = 'var(--bg-2)';
  const textCol = 'var(--text-mid)';
  const _bg2h=getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim();
  const _rh=parseInt(_bg2h.slice(1,3),16)||0,_gh=parseInt(_bg2h.slice(3,5),16)||0,_bh=parseInt(_bg2h.slice(5,7),16)||0;
  const _lumh=(0.299*_rh+0.587*_gh+0.114*_bh)/255;
  const _adjh=_lumh<0.5?40:-40;
  const _ch=v=>Math.max(0,Math.min(255,v));
  const mutedCol=`rgb(${_ch(_rh+_adjh)},${_ch(_gh+_adjh)},${_ch(_bh+_adjh)})`;
  const bdrW    = 'var(--border-width)';
  const bdrC    = 'var(--border-color)';
  const radius  = 'var(--radius)';

  const card = document.createElement('div');
  card.className = 'hist-card';
  card.style.cssText = `flex:1;border:${bdrW} solid ${bdrC};border-radius:${radius};overflow:hidden;display:flex;flex-direction:column;min-width:0;`;

  // header row
  const hdr = document.createElement('div');
  hdr.style.cssText = `background:${green};height:var(--qs-hdr);box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);`;
  hdr.textContent = label;
  card.appendChild(hdr);

  // start date
  const startEl = document.createElement('div');
  startEl.style.cssText = `background:${darkBg};height:var(--job-half);box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-mid);border-top:${bdrW} solid ${bdrC};`;
  startEl.textContent = hFmtDate(start);
  card.appendChild(startEl);

  // divider line -- CSS pill
  const divWrap = document.createElement('div');
  divWrap.style.cssText = `background:${darkBg};padding:3px 0;`;
  const divPill = document.createElement('div');
  divPill.style.cssText = `height:3px;width:75%;margin:0 auto;background:${mutedCol};border-radius:99px;`;
  divWrap.appendChild(divPill);
  card.appendChild(divWrap);

  // end date
  const endEl = document.createElement('div');
  endEl.style.cssText = `background:${darkBg};height:var(--job-half);display:flex;align-items:center;justify-content:center;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-mid);`;
  endEl.textContent = hFmtDate(end);
  card.appendChild(endEl);

  // hours row
  const hrs = document.createElement('div');
  hrs.style.cssText = `background:${green};height:var(--job-half);box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-light);border-top:${bdrW} solid ${bdrC};`;

  if (isLastWeek) {
    hrs.textContent = hFmtHours(workedMins);
  } else if (isThisWeek) {
    hrs.textContent = `${hFmtHours(workedMins)} / ${hFmtHours(schedMins)} (${hFmtHours(projMins)})`;
  } else {
    hrs.textContent = hFmtHours(schedMins);
  }
  card.appendChild(hrs);

  return card;
}

/* -- main render -- */
function renderHistory() {
  if (typeof appSettings === 'undefined' || typeof jobs === 'undefined') return;
  let wrap = document.getElementById('historyWrap');
  if (!wrap) { buildHistory(); wrap = document.getElementById('historyWrap'); if (!wrap) return; }
  wrap.innerHTML = '';
  if (!appSettings.showHistory) return;

  // title
  const title = document.createElement('div');
  title.className = 'label-card';
  title.textContent = 'History';
  wrap.appendChild(title);

  const numWeeks = (typeof appSettings !== 'undefined' && appSettings.histWeeks !== undefined ? appSettings.histWeeks : 10);
  const anchorDow = (jobs.length > 0 && jobs[0].firstDow !== undefined) ? jobs[0].firstDow : 1;

  if (numWeeks === 0) {
    // Just this week + next week, evenly flexed
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:var(--margin);';
    const curr = hWeekCard('This Week', 0, anchorDow);
    const next = hWeekCard('Next Week', 1, anchorDow);
    curr.style.flex = '1'; next.style.flex = '1';
    row.appendChild(curr); row.appendChild(next);
    wrap.appendChild(row);
  } else if (numWeeks === 1) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:var(--margin);';
    const last = hWeekCard('Last Week', -1, anchorDow);
    const curr = hWeekCard('This Week',  0, anchorDow);
    const next = hWeekCard('Next Week',  1, anchorDow);
    last.style.flex = '1'; curr.style.flex = '1.4'; next.style.flex = '1';
    row.appendChild(last); row.appendChild(curr); row.appendChild(next);
    wrap.appendChild(row);
  } else {
    // This week + next week row
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:var(--margin);';
    row.appendChild(hWeekCard('This Week',  0, anchorDow));
    row.appendChild(hWeekCard('Next Week',  1, anchorDow));
    wrap.appendChild(row);

    // last N weeks grid
    wrap.appendChild(hLast10Card(anchorDow));
  }
}

window.addEventListener('load', function() {
  buildHistory();
  renderHistory();
  if (typeof updateSettingsUI === 'function') updateSettingsUI();
});

/* -- last 10 weeks grid -- */
function hFmtShortDate(d) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function hLast10Card(anchorDow) {
  const _csH = getComputedStyle(document.documentElement);
  const _histRaw = (typeof appSettings !== 'undefined' && appSettings.histColor) || '--swatch-6';
  const green = _histRaw.startsWith('--') ? _csH.getPropertyValue(_histRaw).trim() : (_histRaw || 'var(--secondary)');
  const darkBg  = 'var(--bg-2)';
  const textCol = 'var(--text-mid)';
  const _bg2h=getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim();
  const _rh=parseInt(_bg2h.slice(1,3),16)||0,_gh=parseInt(_bg2h.slice(3,5),16)||0,_bh=parseInt(_bg2h.slice(5,7),16)||0;
  const _lumh=(0.299*_rh+0.587*_gh+0.114*_bh)/255;
  const _adjh=_lumh<0.5?40:-40;
  const _ch=v=>Math.max(0,Math.min(255,v));
  const mutedCol=`rgb(${_ch(_rh+_adjh)},${_ch(_gh+_adjh)},${_ch(_bh+_adjh)})`;
  const bdrW    = 'var(--border-width)';
  const bdrC    = 'var(--border-color)';
  const radius  = 'var(--radius)';

  const card = document.createElement('div');
  card.className = 'hist-card';
  card.style.cssText = `border:${bdrW} solid ${bdrC};border-radius:${radius};overflow:hidden;`;

  // header
  const hdr = document.createElement('div');
  hdr.style.cssText = `background:${green};height:var(--qs-hdr);box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);`;
  const numWeeks = (typeof appSettings !== 'undefined' && appSettings.histWeeks) || 10;
  hdr.textContent = numWeeks === 1 ? 'Last Week' : 'Last ' + numWeeks + ' Weeks';
  card.appendChild(hdr);

  // grid row
  const grid = document.createElement('div');
  grid.style.cssText = `display:flex;border-top:${bdrW} solid ${bdrC};`;

  for (let i = 1; i <= numWeeks; i++) {
    const { start, end } = hGetWeekRange(anchorDow, -i);
    const workedMins = hSumHours('worked', start, end);

    const col = document.createElement('div');
    col.style.cssText = `flex:1;display:flex;flex-direction:column;min-width:0;`
      + (i < numWeeks ? `border-right:${bdrW} solid ${bdrC};` : '');

    // start date
    const sEl = document.createElement('div');
    sEl.style.cssText = `background:${darkBg};padding:calc(var(--margin) / 2) 1px;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-mid);white-space:nowrap;overflow:hidden;`;
    sEl.textContent = hFmtShortDate(start);
    col.appendChild(sEl);

    // divider
    const divWrap = document.createElement('div');
    divWrap.style.cssText = `background:${darkBg};padding:2px 0;`;
    const divPill = document.createElement('div');
    divPill.style.cssText = `height:3px;width:75%;margin:0 auto;background:${mutedCol};border-radius:99px;`;
    divWrap.appendChild(divPill);
    col.appendChild(divWrap);

    // end date
    const eEl = document.createElement('div');
    eEl.style.cssText = `background:${darkBg};padding:calc(var(--margin) / 2) 1px;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-mid);white-space:nowrap;overflow:hidden;`;
    eEl.textContent = hFmtShortDate(end);
    col.appendChild(eEl);

    // hours
    const hEl = document.createElement('div');
    hEl.style.cssText = `background:${green};padding:2px 1px;text-align:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-light);border-top:${bdrW} solid ${bdrC};white-space:nowrap;overflow:hidden;`;
    hEl.textContent = hFmtHours(workedMins);
    col.appendChild(hEl);

    grid.appendChild(col);
  }

  card.appendChild(grid);
  return card;
}

/* -- self-init -- */
window.addEventListener('load', function() {
  buildHistory();
  renderHistory();
  if (typeof updateSettingsUI === 'function') updateSettingsUI();
});
