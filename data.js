/* data.js - Data management (import / export)
   Requires: app.js globals - jobs, appSettings, ls, lsSet, renderJobs
*/

function buildDataWindow() {
  const existing = document.getElementById('dataWindow');
  if (existing) return;

  const win = document.createElement('div');
  win.className = 'data-window';
  win.id = 'dataWindow';
  win.innerHTML = `
    <div class="data-window-header">
      <button class="data-window-back" onclick="closeWindow('dataWindow')" id="dataWindowBack"></button>
      <div class="data-window-title">Data</div>
    </div>
    <!-- tab bar -->
    <div class="filter-card" style="flex-shrink:0;border-radius:0;border-left:none;border-right:none;border-top:none;">
      <button class="filter-btn active" id="dataTabImport" onclick="dataShowTab('import')">Import</button>
      <button class="filter-btn" id="dataTabExport" onclick="dataShowTab('export')">Export</button>
    </div>

    <!-- import panel -->
    <div class="data-body" id="dataPanelImport">
      <div class="label-card" style="background:var(--bg-2);color:var(--text-mid);">Paste JSON data below</div>
      <textarea id="dataImportField"
        style="flex:1;background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);
               color:var(--text-light);font-size:var(--text-sm);font-family:monospace;padding:8px;resize:none;
               outline:none;min-height:200px;"
        placeholder='{"jobs":[...]}'></textarea>
      <div class="clear-card" id="dataImportBtn" onclick="dataImport()" style="background:var(--primary);">Import</div>
      <div id="dataImportStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--text-mid);padding:4px;"></div>
    </div>

    <!-- export panel -->
    <div class="data-body" id="dataPanelExport" style="display:none;">
      <div class="filter-card" style="flex-shrink:0;">
        <button class="filter-btn active" id="exportTabReadable" onclick="dataExportTab('readable')">Readable</button>
        <button class="filter-btn" id="exportTabJson" onclick="dataExportTab('json')">JSON</button>
        <button class="filter-btn" id="exportTabHistory" onclick="dataExportTab('history')">Add History</button>
      </div>
      <div id="dataHistoryPanel" style="display:none;flex-direction:column;gap:var(--margin);flex:1;overflow-y:auto;">
        <div class="label-card" style="background:var(--bg-2);color:var(--text-mid);">Add worked hours for a past week</div>
        <div style="display:flex;flex-direction:column;gap:var(--margin);">
          <select id="dataHistJob" style="height:var(--card-height);background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-sm);font-weight:var(--fw-bold);padding:0 8px;"></select>
          <select id="dataHistWeek" style="height:var(--card-height);background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-sm);font-weight:var(--fw-bold);padding:0 8px;"></select>
          <input id="dataHistHours" type="number" step="0.01" min="0" placeholder="Hours (e.g. 38.50)"
            style="height:var(--card-height);background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-sm);font-weight:var(--fw-bold);padding:0 8px;">
        </div>
        <div class="clear-card" onclick="dataAddHistory()" style="background:var(--primary);">Save History</div>
        <div id="dataHistStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--text-mid);padding:4px;"></div>
      </div>
      <textarea id="dataExportField" readonly
        style="flex:1;background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);
               color:var(--text-light);font-size:var(--text-sm);font-family:monospace;padding:8px;resize:none;
               outline:none;min-height:200px;"></textarea>
      <div class="clear-card" onclick="dataCopyClipboard()" style="background:var(--primary);">Copy to Clipboard</div>
      <div id="dataExportStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--text-mid);padding:4px;"></div>
    </div>
  `;
  document.body.appendChild(win);
  (function(){var ns='http://www.w3.org/2000/svg';var svg=document.createElementNS(ns,'svg');svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('viewBox','0 0 50 50');var l1=document.createElementNS(ns,'line');var l2=document.createElementNS(ns,'line');[l1,l2].forEach(function(l){l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});l1.setAttribute('x1','42');l1.setAttribute('y1','10');l1.setAttribute('x2','8');l1.setAttribute('y2','25');l2.setAttribute('x1','42');l2.setAttribute('y1','40');l2.setAttribute('x2','8');l2.setAttribute('y2','25');svg.appendChild(l1);svg.appendChild(l2);var el=document.getElementById('dataWindowBack');if(el&&!el.querySelector('svg'))el.appendChild(svg);})();
}


function dFmtDate(d) {
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const yy = String(d.getFullYear()).slice(-2);
  return mm+'/'+dd+'/'+yy;
}

function dFmtTime24(t) {
  // Convert "HH:MM AM/PM" to "HH:MM" 24hr
  if (!t || t === 'OFF' || t === 'NONE') return null;
  const parts = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!parts) return null;
  let h = parseInt(parts[1]);
  const m = parts[2];
  const ap = parts[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return String(h).padStart(2,'0') + ':' + m;
}

function dGetWeekDays(anchorDow, offset) {
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = (now.getDay() - anchorDow + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff + offset * 7);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function dFmtShort(d) {
  // MMDDYY no slashes for history key
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const yy = String(d.getFullYear()).slice(-2);
  return mm+dd+yy;
}

function dHoursWorked(start, end) {
  // returns HH.MM string from week start/end
  let total = 0;
  const d = new Date(start);
  const endD = new Date(end);
  while (d <= endD) {
    const key = localDateKey(d);
    jobs.forEach(job => {
      if (!job.worked || !job.worked[key]) return;
      const w = job.worked[key];
      if (!w.start || w.start === 'OFF' || w.start === 'NONE') return;
      const s = parseTimeToMins(w.start), e = parseTimeToMins(w.end);
      if (s === null || e === null) return;
      let dur = e - s; if (dur <= 0) dur += 1440;
      total += dur;
    });
    d.setDate(d.getDate() + 1);
  }
  const hh = String(Math.floor(total/60)).padStart(2,'0');
  const mm2 = String(Math.round((total%60)/60*100)).padStart(2,'0');
  return hh+'.'+mm2;
}

function dataExportTab(tab) {
  document.getElementById('exportTabReadable').classList.toggle('active', tab === 'readable');
  document.getElementById('exportTabJson').classList.toggle('active', tab === 'json');
  document.getElementById('exportTabHistory').classList.toggle('active', tab === 'history');
  document.getElementById('dataExportField').style.display = tab === 'history' ? 'none' : '';
  document.getElementById('dataHistoryPanel').style.display = tab === 'history' ? 'flex' : 'none';
  if (tab === 'readable') {
    document.getElementById('dataExportField').value = buildExportText();
  } else if (tab === 'json') {
    document.getElementById('dataExportField').value = JSON.stringify({ jobs: ls('sch_jobs', []), settings: ls('sch_settings', {}) }, null, 2);
  } else {
    // populate job selector and week options
    const sel = document.getElementById('dataHistJob');
    sel.innerHTML = jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
    sel.onchange = dataPopulateWeeks;
    dataPopulateWeeks();
  }
}

function dataPopulateWeeks() {
  const jobId = parseInt(document.getElementById('dataHistJob').value);
  const job = jobs.find(j => j.id === jobId);
  const anchorDow = job && job.firstDow !== undefined ? job.firstDow : 1;
  const weekSel = document.getElementById('dataHistWeek');
  weekSel.innerHTML = '';

  const now = new Date(); now.setHours(0,0,0,0);
  const diff = (now.getDay() - anchorDow + 7) % 7;

  // generate last 52 weeks
  for (let w = 1; w <= 52; w++) {
    const start = new Date(now);
    start.setDate(now.getDate() - diff - w * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const label = dFmtDate(start) + ' - ' + dFmtDate(end);
    const val = localDateKey(start) + '|' + localDateKey(end);
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    weekSel.appendChild(opt);
  }
}

function dataAddHistory() {
  const status = document.getElementById('dataHistStatus');
  const jobId    = parseInt(document.getElementById('dataHistJob').value);
  const weekVal  = document.getElementById('dataHistWeek').value;
  const hoursVal = parseFloat(document.getElementById('dataHistHours').value);

  if (!weekVal || isNaN(hoursVal)) {
    status.textContent = 'Please fill in all fields'; status.style.color = 'var(--color-1)'; return;
  }

  const [startKey, endKey] = weekVal.split('|');
  const job = jobs.find(j => j.id === jobId);
  if (!job) { status.textContent = 'Job not found'; status.style.color = 'var(--color-1)'; return; }

  // parse as local time to avoid UTC offset shifting dates
  const [sy,sm,sd] = startKey.split("-").map(Number);
  const [ey,em,ed] = endKey.split("-").map(Number);
  const startD = new Date(sy,sm-1,sd);
  const endD   = new Date(ey,em-1,ed);
  const dayCount = Math.round((endD - startD) / 86400000) + 1;
  const minsPerDay = Math.round((hoursVal * 60) / dayCount);

  if (!job.worked) job.worked = {};
  const d = new Date(startD);
  while (d <= endD) {
    const key = localDateKey(d);
    // Store as a worked entry: 09:00 AM to 09:00 AM + minsPerDay
    const endMins = 9 * 60 + minsPerDay;
    const endH = Math.floor(endMins / 60) % 12 || 12;
    const endM = String(endMins % 60).padStart(2,'0');
    const endAp = Math.floor(endMins / 60) >= 12 ? 'PM' : 'AM';
    job.worked[key] = { start: '09:00 AM', end: `${String(endH).padStart(2,'0')}:${endM} ${endAp}` };
    d.setDate(d.getDate() + 1);
  }

  lsSet('sch_jobs', jobs);
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }

  status.textContent = `Saved ${hoursVal} hours across ${dayCount} day(s)`;
  status.style.color = 'var(--primary)';
  document.getElementById('dataHistHours').value = '';
}

function buildExportText() {
  const now = new Date();
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2,'0');
  const mi = String(now.getMinutes()).padStart(2,'0');
  let out = `SHIFT HAPPENS - ${mm}/${dd}/${yy} ${hh}:${mi}\n`;

  const anchorDow = (jobs.length > 0 && jobs[0].firstDow !== undefined) ? jobs[0].firstDow : 1;

  jobs.forEach(job => {
    out += `\n${job.title.toUpperCase()}\n`;

    // Last week, This week, Next week
    [[-1,'Last Week'],[0,'This Week'],[1,'Next Week']].forEach(([offset, label]) => {
      const days = dGetWeekDays(anchorDow, offset);
      const start = days[0], end = days[6];
      out += `${label}  ${dFmtDate(start)}-${dFmtDate(end)}\n`;

      days.forEach(d => {
        const key = localDateKey(d);
        const sched = job.schedule && job.schedule[key];
        const worked = job.worked && job.worked[key];
        const dateStr = dFmtDate(d);

        if (offset === -1) {
          // Last week: scheduled/worked, no entry = OFF
          if (!sched || sched.start === 'OFF') {
            out += `${dateStr}  OFF\n`;
          } else {
            const ss = dFmtTime24(sched.start), se = dFmtTime24(sched.end);
            const ws = dFmtTime24(worked && worked.start), we2 = dFmtTime24(worked && worked.end);
            const schedStr = ss && se ? `${ss}-${se}` : 'OFF';
            const workStr  = ws && we2 ? `${ws}-${we2}` : '00:00-00:00';
            out += `${dateStr}  ${schedStr} / ${workStr}\n`;
          }
        } else if (offset === 0) {
          // This week: if no sched = NO SHIFT (no worked), if OFF = OFF, else sched/worked
          if (!sched || sched.start === 'NONE') {
            out += `${dateStr}  NO SHIFT\n`;
          } else if (sched.start === 'OFF') {
            out += `${dateStr}  OFF\n`;
          } else {
            const ss = dFmtTime24(sched.start), se = dFmtTime24(sched.end);
            const ws = dFmtTime24(worked && worked.start), we2 = dFmtTime24(worked && worked.end);
            const schedStr = ss && se ? `${ss}-${se}` : 'NO SHIFT';
            const workStr  = ws && we2 ? `${ws}-${we2}` : '00:00-00:00';
            out += `${dateStr}  ${schedStr} / ${workStr}\n`;
          }
        } else {
          // Next week: scheduled only
          if (!sched || sched.start === 'NONE') {
            out += `${dateStr}  NO SHIFT\n`;
          } else if (sched.start === 'OFF') {
            out += `${dateStr}  OFF\n`;
          } else {
            const ss = dFmtTime24(sched.start), se = dFmtTime24(sched.end);
            out += `${dateStr}  ${ss}-${se}\n`;
          }
        }
      });
      out += '\n';
    });

    // History - condensed string going back 10 weeks
    let histStr = 'History\n';
    let histLine = '';
    for (let w = 2; w <= 11; w++) {
      const days = dGetWeekDays(anchorDow, -w);
      const start = days[0], end = days[6];
      const hrs = dHoursWorked(start, end);
      histLine += `d${dFmtShort(start)}/${dFmtShort(end)}h${hrs}`;
    }
    out += histStr + histLine + '\n';
  });

  return out;
}

function buildFullExportText() {
  const readable = buildExportText();
  const json = JSON.stringify({ jobs: ls('sch_jobs', []), settings: ls('sch_settings', {}) });
  return readable + '\n---JSON---\n' + json;
}

function openDataWindow() {
  buildDataWindow();
  dataShowTab('import');
  document.getElementById('dataWindow').classList.add('open');
}

function dataShowTab(tab) {
  document.getElementById('dataPanelImport').style.display = tab === 'import' ? 'flex' : 'none';
  document.getElementById('dataPanelExport').style.display = tab === 'export' ? 'flex' : 'none';
  document.getElementById('dataTabImport').classList.toggle('active', tab === 'import');
  document.getElementById('dataTabExport').classList.toggle('active', tab === 'export');

  if (tab === 'export') {
    dataExportTab('readable');
  }
}

function dataImport() {
  const status = document.getElementById('dataImportStatus');
  const rawFull = document.getElementById('dataImportField').value.trim();
  if (!rawFull) { status.textContent = 'Nothing to import'; status.style.color = 'var(--color-1)'; return; }
  // extract JSON section if readable format is pasted
  const marker = rawFull.indexOf('---JSON---');
  const raw = marker !== -1 ? rawFull.slice(marker + 10).trim() : rawFull;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.jobs || !Array.isArray(parsed.jobs)) throw new Error('Invalid format - missing jobs array');

    lsSet('sch_jobs', parsed.jobs);
    if (parsed.settings) lsSet('sch_settings', parsed.settings);

    jobs = parsed.jobs;
    if (parsed.settings) Object.assign(appSettings, parsed.settings);

    renderJobs();
    if (typeof renderQuickSchedule === 'function') renderQuickSchedule();
    if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
    if (typeof updateSettingsUI === 'function') updateSettingsUI();

    document.getElementById('dataImportField').value = '';
    status.textContent = `Imported ${parsed.jobs.length} job(s) successfully`;
    status.style.color = 'var(--primary)';
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
    status.style.color = 'var(--color-1)';
  }
}

function dataCopyClipboard() {
  const status = document.getElementById('dataExportStatus');
  const text = document.getElementById('dataExportField').value;
  if (!text) { status.textContent = 'Nothing to copy'; status.style.color = 'var(--color-1)'; return; }

  navigator.clipboard.writeText(text).then(() => {
    status.textContent = 'Copied to clipboard!';
    status.style.color = 'var(--primary)';
    setTimeout(() => { status.textContent = ''; }, 3000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.getElementById('dataExportField');
    ta.select();
    document.execCommand('copy');
    status.textContent = 'Copied!';
    status.style.color = 'var(--primary)';
    setTimeout(() => { status.textContent = ''; }, 3000);
  });
}
