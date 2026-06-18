function ls(k,d){ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d; }catch(e){ return d; } }
function lsSet(k,v){ localStorage.setItem(k,JSON.stringify(v)); }

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

let jobs            = ls('sch_jobs', []);
let nwSelectedColor = null;
let nwSelectedDow   = 1;
let activeWeek      = 'this';
let activeHours     = 'scheduled';
let activeFirstDow  = 1;
let activeJobId     = null;
let jsSelectedColor = null;
let tpShiftIndex = 0;
const _dcExpanded = {};

function getSwatchColors() {
  const s = getComputedStyle(document.documentElement);
  return [1,2,3,4,5,6,7,8,9,10].map(i => s.getPropertyValue('--swatch-' + i).trim());
}

// Called by rand.js after applying a new theme — maps each job to nearest new swatch
window.remapJobColors = function(newSwatches) {
  if (!newSwatches || !newSwatches.length) return;
  function hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  function colorDist(a, b) {
    const ra=hexToRgb(a), rb=hexToRgb(b);
    return Math.sqrt((ra[0]-rb[0])**2 + (ra[1]-rb[1])**2 + (ra[2]-rb[2])**2);
  }
  function nearestSwatch(color) {
    let best = 0, bestDist = Infinity;
    newSwatches.forEach((s, i) => {
      try { const d = colorDist(color, s); if (d < bestDist) { bestDist = d; best = i; } } catch(e) {}
    });
    return newSwatches[best];
  }
  let changed = false;
  jobs.forEach(job => {
    if (!job.color) return;
    const nearest = nearestSwatch(job.color);
    if (nearest && nearest !== job.color) { job.color = nearest; changed = true; }
  });
  if (changed) lsSet('sch_jobs', jobs);
};
function buildSwatches(onclickFn) {
  return getSwatchColors().map(c =>
    `<button class="nw-swatch" style="background:${c};" data-color="${c}" onclick="${onclickFn}(this)"></button>`
  ).join('');
}
function buildDowBtns(onclickFn) {
  return ['S','M','T','W','T','F','S'].map((d,i) =>
    `<button class="dow-btn${i===1?' active':''}" data-dow="${i}" onclick="${onclickFn}(this)">${d}</button>`
  ).join('');
}

function buildDotGrid() {
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox','0 0 34 34');svg.setAttribute('overflow','hidden');svg.style.display='block';
  const cx=17,cy=17,outerR=14,innerR=7,dotR=2.2,n7=12,n5=6;
  for(let i=0;i<n7;i++){const a=(2*Math.PI*i/n7)-Math.PI/2;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',(cx+outerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+outerR*Math.sin(a)).toFixed(2));c.setAttribute('r',dotR);c.style.fill=i%2===0?'var(--primary)':'var(--secondary)';svg.appendChild(c);}
  for(let i=0;i<n5;i++){const a=(2*Math.PI*i/n5)-Math.PI/2;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',(cx+innerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+innerR*Math.sin(a)).toFixed(2));c.setAttribute('r',dotR);c.style.fill='var(--accent)';svg.appendChild(c);}
  return svg;
}
function spinDotGrid(btn, cb) {
  if(btn._spinning) return;
  btn._spinning = true;
  var svg = btn.querySelector('svg'); if(!svg) return;
  var isPixel = !!svg.querySelector('rect');
  var cx=17,cy=17,OR=14,IR=7,sw=4,sh=4,n7=12,n5=6,dur=1000; var start=null;
  var outer,inner;
  if(isPixel){
    var rects=Array.from(svg.querySelectorAll('rect'));
    outer=rects.slice(0,n7); inner=rects.slice(n7);
  } else {
    var circles=Array.from(svg.querySelectorAll('circle'));
    outer=circles.slice(0,n7); inner=circles.slice(n7);
  }
  function ease(t){return 1-Math.pow(1-t,3);}
  function step(ts){
    if(!start)start=ts;
    var t=Math.min((ts-start)/dur,1),e=ease(t);
    if(isPixel){
      outer.forEach(function(r,i){var a=(2*Math.PI*i/n7-Math.PI/2)+e*Math.PI*2;r.setAttribute('x',(cx+OR*Math.cos(a)-sw/2).toFixed(2));r.setAttribute('y',(cy+OR*Math.sin(a)-sh/2).toFixed(2));});
      inner.forEach(function(r,i){var a=(2*Math.PI*i/n5-Math.PI/2)-e*Math.PI*2;r.setAttribute('x',(cx+IR*Math.cos(a)-sw/2).toFixed(2));r.setAttribute('y',(cy+IR*Math.sin(a)-sh/2).toFixed(2));});
    } else {
      outer.forEach(function(c,i){var a=(2*Math.PI*i/n7-Math.PI/2)+e*Math.PI*2;c.setAttribute('cx',(cx+OR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+OR*Math.sin(a)).toFixed(2));});
      inner.forEach(function(c,i){var a=(2*Math.PI*i/n5-Math.PI/2)-e*Math.PI*2;c.setAttribute('cx',(cx+IR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+IR*Math.sin(a)).toFixed(2));});
    }
    if(t<1)requestAnimationFrame(step);else{btn._spinning=false;if(cb)cb();}
  }
  requestAnimationFrame(step);
}
const DOT_GRID = '';

function buildPixelDotGrid() {
  var ns='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox','0 0 34 34');svg.setAttribute('overflow','hidden');svg.style.display='block';
  var cx=17,cy=17,OR=14,IR=7,sw=4,sh=4,n7=12,n5=6;
  for(var i=0;i<n7;i++){
    var a=(2*Math.PI*i/n7)-Math.PI/2;
    var r=document.createElementNS(ns,'rect');
    r.setAttribute('width',sw);r.setAttribute('height',sh);
    r.setAttribute('x',(cx+OR*Math.cos(a)-sw/2).toFixed(2));
    r.setAttribute('y',(cy+OR*Math.sin(a)-sh/2).toFixed(2));
    r.setAttribute('rx','0.5');
    r.style.fill=i%2===0?'var(--primary)':'var(--secondary)';
    svg.appendChild(r);
  }
  for(var i=0;i<n5;i++){
    var a=(2*Math.PI*i/n5)-Math.PI/2;
    var r=document.createElementNS(ns,'rect');
    r.setAttribute('width',sw);r.setAttribute('height',sh);
    r.setAttribute('x',(cx+IR*Math.cos(a)-sw/2).toFixed(2));
    r.setAttribute('y',(cy+IR*Math.sin(a)-sh/2).toFixed(2));
    r.setAttribute('rx','0.5');
    r.style.fill='var(--accent)';
    svg.appendChild(r);
  }
  return svg;
}

function buildWindows() {
  const html = `
    <!-- NEW JOB WINDOW -->
    <div class="data-window" id="newWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('newWindow')" id="newWindowBack"></button>
        <div class="data-window-title">New Job</div>
      </div>
      <div class="data-body">
        <div class="label-card">Enter Job Title</div>
        <div class="nw-title-card">
          <input class="nw-title-input" id="nwTitleInput" type="text" placeholder="Job title" oninput="nwCheckReady()" maxlength="80">
        </div>
        <div class="label-card">Select Job Color</div>
        <div class="nw-color-card" id="nwColorCard">${buildSwatches('nwPickColor')}</div>
        <div class="label-card">Select First Day of Work Week</div>
        <div class="dow-card" id="nwDowCard">${buildDowBtns('nwPickDow')}</div>
      </div>
      <div class="nw-footer" id="nwFooter" onclick="nwCreate()">Create New Job Entry</div>
    </div>

    <!-- JOB WINDOW -->
    <div class="data-window" id="jobWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('jobWindow')" id="jobWindowBack"></button>
        <div class="data-window-title" id="jobWindowTitle"></div>
        <button class="data-window-settings" onclick="playDotGridExit(this);setTimeout(openJobSettings,100)" id="jobSettingsBtn"></button>
      </div>
      <div class="data-body" id="jobWindowBody">
        <div class="filter-card" id="weekFilterCard">
          <button class="filter-btn" id="fwPrev" onclick="setWeek('prev')">Last Week</button>
          <button class="filter-btn active" id="fwThis" onclick="setWeek('this')">This Week</button>
          <button class="filter-btn" id="fwNext" onclick="setWeek('next')">Next Week</button>
        </div>
        <div class="filter-card" id="hoursCard">
          <button class="filter-btn active secondary" id="fhScheduled" onclick="setHoursType('scheduled')">Scheduled Hours</button>
          <button class="filter-btn secondary" id="fhWorked" onclick="setHoursType('worked')">Worked Hours</button>
        </div>
        <div class="date-range-card" id="dateRangeCard"></div>
        <div id="dayCards" style="display:flex;flex-direction:column;gap:var(--margin);"></div>
        <div id="gridView" style="display:none;flex-direction:column;gap:var(--margin);"></div>
        <div class="totals-card" id="totalsCard">
          <div class="totals-label">Total Hours</div>
          <div class="totals-value" id="totalsValue">00 Hours  00 Minutes</div>
        </div>
      </div>
      <div class="clear-card-wrap">
        <div class="view-toggle-card">
          <button class="filter-btn active" id="btnViewDayCard" onclick="switchJobView('daycard')">Day Card</button>
          <button class="filter-btn" id="btnViewGrid" onclick="switchJobView('grid')">Grid</button>
        </div>
        <div class="clear-card" id="clearSchedCard" onclick="clearCurrentSchedule()">Clear Schedule</div>
      </div>
    </div>

    <!-- JOB SETTINGS WINDOW -->
    <div class="data-window" id="jobSettingsWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('jobSettingsWindow')" id="jobSettingsWindowBack"></button>
        <div class="data-window-title">Job Settings</div>
      </div>
      <div class="data-body">
        <div class="label-card">Change Job Title</div>
        <div class="nw-title-card">
          <input class="nw-title-input" id="jsTitleInput" type="text" placeholder="Job title" oninput="jsUpdateTitle()" maxlength="80">
        </div>
        <div class="label-card">Select Job Color</div>
        <div class="nw-color-card" id="jsColorCard">${buildSwatches('jsPickColor')}</div>
        <div class="label-card">Select First Day of Work Week</div>
        <div class="dow-card" id="dowCard">${buildDowBtns('jsPickDow')}</div>
        <div class="toggle-card" id="toggleJs_showSecondShift" onclick="jobSettingToggle('showSecondShift')"><div class="toggle-check"><svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg></div><div class="toggle-content"><div class="toggle-label">Second Shift</div><div class="toggle-blurb">Show extra shift slot on each day card</div></div></div>
        <div class="toggle-card" id="toggleJs_showGridLegend" onclick="jobSettingToggle('showGridLegend')"><div class="toggle-check"><svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg></div><div class="toggle-content"><div class="toggle-label">Grid Legend</div><div class="toggle-blurb">Show color legend below the grid view</div></div></div>
        <div class="clear-card" id="clearFullCard" onclick="clearFullSchedule()">Clear Full Schedule</div>
        <div class="delete-card" id="deleteCard" onclick="jsDeleteJob()">Delete Job</div>
      </div>
    </div>

    <!-- SETTINGS WINDOW -->
    <div class="data-window" id="settingsWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('settingsWindow')" id="settingsWindowBack"></button>
        <div class="data-window-title">Settings</div>
      </div>
      <div class="filter-card" style="flex-shrink:0;border-radius:0;border-left:none;border-right:none;border-top:none;">
        <button class="filter-btn active" id="stab-display"  onclick="settingsTab('display')">Display</button>
        <button class="filter-btn"        id="stab-cards"    onclick="settingsTab('cards')">Cards</button>
        <button class="filter-btn"        id="stab-other"    onclick="settingsTab('other')">Other</button>
        <button class="filter-btn"        id="stab-theme"    onclick="settingsTab('theme')">Theme</button>
      </div>
      <div class="data-body" id="spanel-display">
        <div class="label-card">What shows in the main window</div>
        <div class="toggle-card" id="toggleJobCards" onclick="settingToggle('showJobCards')"><div class="toggle-check"><svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg></div><div class="toggle-content"><div class="toggle-label">Job Cards</div><div class="toggle-blurb">Shows each job as a card with your next shift countdown</div></div></div>
        <div id="quickScheduleToggleSlot"></div>
        <div id="historyToggleSlot"></div>
        <div id="jobHistoryToggleSlot"></div>
        <div id="timelineToggleSlot"></div>
      </div>
      <div class="data-body" id="spanel-cards" style="display:none;">
        <div class="label-card">Job Card Sections</div>
        <div id="timerSectionsToggleSlot"></div>
        <div id="miniGraphToggleSlot"></div>
        <div id="timeDotToggleSlot"></div>
      </div>
        <div id="spanel-theme" class="data-body" style="display:none;">

          <!-- Always visible: Create + Builder cards -->
          <div id="sRandCreateBtn" onclick="sRandCreate()" style="height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);background:var(--primary);color:var(--text-light);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;">Tap to Create Random Theme</div>
          <div id="sRandBuilderBtn" onclick="ThemeSystem.open()" style="height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);background:var(--bg-2);color:var(--text-mid);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;">Tap to Enter Theme Builder</div>

          <!-- Revealed after first tap -->
          <div id="sRandArray" style="display:none;flex-direction:column;gap:var(--border-width);">
            <!-- Randomize + Name -->
            <div style="border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;">
              <div onclick="sRandAgain()" style="height:var(--job-half);background:var(--secondary);border-bottom:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;color:var(--text-light);">Randomize</div>
              <div id="sRandName" style="height:var(--job-half);background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wide);text-transform:uppercase;text-align:center;padding:0 8px;color:var(--text-light);"></div>
            </div>
            <!-- Preview injected here by sRandCreate -->
            <!-- Actions: Save / Builder / Export / Reset -->
            <div style="height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;">
              <div onclick="sRandSave()" style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Save</div>
              <div onclick="sRandEdit()" id="sRandEditBtn" style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Builder</div>
              <div id="sRandExportBtn" onclick="sRandExport()" style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Export</div>
              <div onclick="sRandReset()" style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;">Reset</div>
            </div>
          </div>

          <!-- Saved themes -->
          <div class="label-card" style="margin-top:var(--margin);text-align:center">Pick a Theme</div>
          <div id="settingsSavedThemesList"></div>
        </div>
      <div class="data-body" id="spanel-other" style="display:none;">
        <div class="label-card">Interface</div>
        <div class="toggle-card" id="toggleLcarsMode" onclick="lcarsToggle()"><div class="toggle-check"><svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg></div><div class="toggle-content"><div class="toggle-label">LCARS Mode</div><div class="toggle-blurb">Star Trek LCARS style interface</div></div></div>
        <div class="label-card">Style</div>
        <div class="toggle-card" id="toggleDrawnBorders" onclick="settingToggle('drawnBorders')"><div class="toggle-check"><svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg></div><div class="toggle-content"><div class="toggle-label">Drawn Borders</div><div class="toggle-blurb">Hand-drawn pen style borders on job cards</div></div></div>
        <div class="label-card">Notifications</div>
        <div style="font-size:var(--text-xs);color:var(--text-mid);padding:2px 4px 6px;">Test that push notifications are working on your device</div>
        <div class="toggle-card" id="notifTestBtn" onclick="testNotification()" style="cursor:pointer;">
          <div class="toggle-check" style="background:var(--secondary);">
            <svg width="12" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="var(--text-light)"/></svg>
          </div>
          <div class="toggle-content">
            <div class="toggle-label">Send Test Notification</div>
            <div class="toggle-blurb">Test that push notifications are working on this device</div>
          </div>
        </div>
        <div id="notifStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--text-mid);padding:4px;min-height:18px;"></div>
      </div>
    </div>

    <!-- SCHEDULE MODAL -->
    <div class="sched-modal-overlay" id="schedModal">
      <div class="sched-modal">
        <div class="sched-modal-header">
          <button class="sched-modal-back" onclick="closeSchedModal()">&#9664;</button>
          <div class="sched-modal-title" id="schedModalTitle"></div>
        </div>
        <div class="sched-modal-body" id="schedModalBody"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

const _settingsDefaults = { showJobHistory: true, showJobCards: true, showQuickSchedule: true, showTimeDot: true, showHistory: true, showTimerSections: true, showMiniGraph: true, miniGraphDays: 3, theme: 'none', showSecondShift: true, customFont: 'def', drawnBorders: false, showTimelineCard: true, timelineRollover: false, timeline24h: false, timelineNightMode: '6pm6am', qsColor: '', qsDays: 7, histColor: '', histWeeks: 10, lcarsMode: false };
let appSettings = Object.assign({}, _settingsDefaults, ls('sch_settings', {}));

function updateDaySqVar() {
  if(appSettings.showSecondShift===false) {
    document.documentElement.style.setProperty('--day-sq','30px');
  } else {
    document.documentElement.style.removeProperty('--day-sq');
  }
}
function settingToggle(key) {
  appSettings[key] = !appSettings[key];
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderJobs();
  if(key==='showSecondShift'){updateDaySqVar();renderDayCards();}
  if(key==='drawnBorders'){renderJobs();if(appSettings.drawnBorders)requestAnimationFrame(function(){if(typeof DrawnBorders!=='undefined')DrawnBorders.applyJobWindow();});else if(typeof DrawnBorders!=='undefined')DrawnBorders.clearJobWindow();}
  var _gv=document.getElementById('gridView');if(_gv&&_gv.style.display==='flex'&&typeof buildGridView==='function')buildGridView(window._currentJob);
}

function jobSettingToggle(key) {
  if(!window._currentJob) return;
  window._currentJob[key] = !window._currentJob[key];
  lsSet('sch_jobs', jobs);
  // Sync toggle active state
  const el = document.getElementById('toggleJs_'+key); if(el) el.classList.toggle('active', !!window._currentJob[key]);
  if(key==='showSecondShift'){updateDaySqVar();renderDayCards();}
  var _gv=document.getElementById('gridView');if(_gv&&_gv.style.display==='flex'&&typeof buildGridView==='function')buildGridView(window._currentJob);
}

function updateSettingsUI() {
  const CHK = `<svg width="20" height="14" viewBox="0 0 11 8" fill="none"><path class="ck-s" d="M1 4 L4.1 6.8 L10 0.9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/><rect class="ck-p" x="0" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="1" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="2" y="6" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="3" y="5" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="4" y="4" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="5" y="3" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="6" y="2" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="7" y="1" width="2" height="1" fill="currentColor"/><rect class="ck-p" x="8" y="0" width="2" height="1" fill="currentColor"/></svg>`;
  function makeToggle(id, onclick, label, blurb) {
    return `<div class="toggle-card" id="${id}" onclick="${onclick}"><div class="toggle-check">${CHK}</div><div class="toggle-content"><div class="toggle-label">${label}</div><div class="toggle-blurb">${blurb}</div></div></div>`;
  }
  function makeDropdownToggle(id, onclick, blurb) {
    return `<div class="dd-toggle" id="${id}" onclick="${onclick}"><div class="toggle-check">${CHK}</div><div class="dd-toggle-blurb">${blurb}</div></div>`;
  }
  const tsSlot = document.getElementById('timerSectionsToggleSlot');
  if (tsSlot) tsSlot.innerHTML = makeToggle('toggleTimerSections', "settingToggle('showTimerSections')", 'Quick Shift Timer', 'Timer button on the right side of each job card');
  const jhSlot = document.getElementById('jobHistoryToggleSlot');
  if (jhSlot) jhSlot.innerHTML = makeToggle('toggleJobHistory', "settingToggle('showJobHistory')", 'Job History', 'History button in the header to access work history');
  var _jhBtn = document.getElementById('headerHistoryBtn');
  if (_jhBtn) _jhBtn.style.display = appSettings.showJobHistory === false ? 'none' : '';
  const mgSlot = document.getElementById('miniGraphToggleSlot');
  if (mgSlot) {
    const mgOn = appSettings.showMiniGraph !== false;
    const mgWasOpen = document.getElementById('mgExpandBody') && document.getElementById('mgExpandBody').classList.contains('open');
    const mgCur = appSettings.miniGraphDays || 3;
    const BSVG3 = `<svg width="18" height="18" viewBox="0 0 50 50" fill="none"><line class="tl-chev-l" x1="10" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line class="tl-chev-r" x1="40" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
    const mgDaysHTML = [3,5,7].map(d =>
      `<button class="dd-num-cell${d===mgCur?' selected':''}" style="${d===mgCur?'background:var(--primary);color:#fff;':''}" onclick="event.stopPropagation();mgPickDays(${d})">${d}</button>`
    ).join('');
    mgSlot.innerHTML =
      `<div class="setting-expand-card">` +
        `<div class="toggle-card" id="toggleMiniGraph" onclick="settingToggle('showMiniGraph')">` +
          `<div class="toggle-check">${CHK}</div>` +
          `<div class="toggle-content"><div class="toggle-label">Weekly Graph</div><div class="toggle-blurb">Daily bars showing worked and scheduled hours</div></div>` +
          (mgOn ? `<div class="tl-expand-btn${mgWasOpen?' open':''}" id="mgExpandBtn" onclick="event.stopPropagation();toggleMgDropdown()">${BSVG3}</div>` : '') +
        `</div>` +
        `<div class="setting-expand-body${mgWasOpen?' open':''}" id="mgExpandBody" onclick="event.stopPropagation()">` +
          `<div class="dd-label-card">How Many Past &amp; Future Days?</div>` +
          `<div class="dd-num-card" style="flex-shrink:0;">${mgDaysHTML}</div>` +
        `</div>` +
      `</div>`;
  }
  const mgDays = document.getElementById('miniGraphDaysSlot');
  if (mgDays) mgDays.innerHTML = '';
  const qsSlot = document.getElementById('quickScheduleToggleSlot');
  if (qsSlot && typeof renderQuickSchedule === 'function') {
    const qsOn = appSettings.showQuickSchedule !== false;
    const qsWasOpen = document.getElementById('qsExpandBody') && document.getElementById('qsExpandBody').classList.contains('open');
    const swatchCols = getSwatchColors();
    const _rawQsCol = appSettings.qsColor || '--swatch-7';
    const curCol = _rawQsCol.startsWith('--')
      ? getComputedStyle(document.documentElement).getPropertyValue(_rawQsCol).trim() || swatchCols[6]
      : _rawQsCol;
    const curDays = appSettings.qsDays || 7;
    const BSVG = `<svg width="18" height="18" viewBox="0 0 50 50" fill="none"><line class="tl-chev-l" x1="10" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line class="tl-chev-r" x1="40" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
    const swatchHTML = swatchCols.map((c,i) =>
      `<button class="nw-swatch dd-h-swatch${('--swatch-'+(i+1))===(appSettings.qsColor||'--swatch-7')?' selected':''}" style="background:${c};" data-var="--swatch-${i+1}" onclick="event.stopPropagation();qsPickColor(this)"></button>`
    ).join('');
    const daysHTML = Array.from({length:14},(_,i)=>i+1).map(d =>
      `<button class="dd-num-cell${d===curDays?' selected':''}" style="${d===curDays?'background:'+curCol+';color:#fff;':''}" onclick="event.stopPropagation();qsPickDays(this,${d})">${d}</button>`
    ).join('');
    qsSlot.innerHTML =
      `<div class="setting-expand-card">` +
        `<div class="toggle-card" id="toggleQuickSchedule" onclick="settingToggle('showQuickSchedule')">` +
          `<div class="toggle-check">${CHK}</div>` +
          `<div class="toggle-content"><div class="toggle-label">Quick Schedule</div><div class="toggle-blurb">Shift timeline across all jobs</div></div>` +
          (qsOn ? `<div class="tl-expand-btn${qsWasOpen?' open':''}" id="qsExpandBtn" onclick="event.stopPropagation();toggleQsDropdown()">${BSVG}</div>` : '') +
        `</div>` +
        `<div class="setting-expand-body${qsWasOpen?' open':''}" id="qsExpandBody" onclick="event.stopPropagation()">` +
          `<div class="dd-label-card">Pick a Color</div>` +
          `<div class="dd-h-color-card">${swatchHTML}</div>` +
          `<div class="dd-label-card">How Many Days?</div>` +
          `<div class="dd-num-card">${daysHTML}</div>` +
          `<div class="dd-label-card">Current Time Indicator</div>` +
          makeDropdownToggle('toggleTimeDot', "settingToggle('showTimeDot')", 'Triangle marking where you are now') +
          `<div class="dd-label-card">Activate Shaded Hours</div>` +
          `<div class="dd-num-card">${[['Off','off'],['6pm - 6am','6pm6am'],['12pm - 12am','12pm12am']].map(function(o){var isOn=(appSettings.timelineNightMode||'6pm6am')===o[1];return '<button class="dd-num-cell'+(isOn?' selected':'')+'" style="'+(isOn?'background:var(--primary);color:#fff;':'')+'" onclick="event.stopPropagation();setTimelineNight(\''+o[1]+'\')">'+o[0]+'</button>';}).join('')}</div>` +
        `</div>` +
      `</div>`;
  }
  const tdSlot = document.getElementById('timeDotToggleSlot');
  if (tdSlot) tdSlot.innerHTML = '';
  const slot = document.getElementById('historyToggleSlot');
  if (slot && typeof renderHistory === 'function') {
    const histOn = appSettings.showHistory !== false;
    const histWasOpen = document.getElementById('histExpandBody') && document.getElementById('histExpandBody').classList.contains('open');
    const swatchCols2 = getSwatchColors();
    const _rawHistCol = appSettings.histColor || '--swatch-6';
    const histCol = _rawHistCol.startsWith('--')
      ? getComputedStyle(document.documentElement).getPropertyValue(_rawHistCol).trim() || swatchCols2[5]
      : _rawHistCol;
    const BSVG2 = `<svg width="18" height="18" viewBox="0 0 50 50" fill="none"><line class="tl-chev-l" x1="10" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line class="tl-chev-r" x1="40" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
    const histSwatchHTML = swatchCols2.map((c,i) =>
      `<button class="nw-swatch dd-h-swatch${('--swatch-'+(i+1))===(appSettings.histColor||'--swatch-6')?' selected':''}" style="background:${c};" data-var="--swatch-${i+1}" onclick="event.stopPropagation();histPickColor(this)"></button>`
    ).join('');
    slot.innerHTML =
      `<div class="setting-expand-card">` +
        `<div class="toggle-card" id="toggleHistory" onclick="settingToggle('showHistory')">` +
          `<div class="toggle-check">${CHK}</div>` +
          `<div class="toggle-content"><div class="toggle-label">History</div><div class="toggle-blurb">Weekly and historical hours view</div></div>` +
          (histOn ? `<div class="tl-expand-btn${histWasOpen?' open':''}" id="histExpandBtn" onclick="event.stopPropagation();toggleHistDropdown()">${BSVG2}</div>` : '') +
        `</div>` +
        `<div class="setting-expand-body${histWasOpen?' open':''}" id="histExpandBody" onclick="event.stopPropagation()">` +
          `<div class="dd-label-card">Pick a Color</div>` +
          `<div class="dd-h-color-card">${histSwatchHTML}</div>` +
          `<div class="dd-label-card">How Many Past Weeks?</div>` +
          `<div class="dd-num-card">${Array.from({length:11},(_,i)=>i).map(d=>`<button class="dd-num-cell${d===(appSettings.histWeeks!==undefined?appSettings.histWeeks:10)?' selected':''}" style="${d===(appSettings.histWeeks!==undefined?appSettings.histWeeks:10)?'background:'+histCol+';color:#fff;':''}" onclick="event.stopPropagation();histPickWeeks(${d})">${d}</button>`).join('')}</div>` +
        `</div>` +
      `</div>`;
  } else if (slot) { slot.innerHTML = ''; }
  const tlSlot = document.getElementById('timelineToggleSlot');
  if (tlSlot) {
    const isOn = appSettings.showTimelineCard !== false;
    const wasOpen = document.getElementById('tlExpandBody') && document.getElementById('tlExpandBody').classList.contains('open');
    const BSVG = `<svg width="18" height="18" viewBox="0 0 50 50" fill="none"><line class="tl-chev-l" x1="10" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line class="tl-chev-r" x1="40" y1="8" x2="25" y2="42" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
    tlSlot.innerHTML =
      `<div class="setting-expand-card">` +
        `<div class="toggle-card" id="toggleTimelineCard" onclick="settingToggle('showTimelineCard')">` +
          `<div class="toggle-check">${CHK}</div>` +
          `<div class="toggle-content"><div class="toggle-label">Timeline Card</div><div class="toggle-blurb">24-hour view of today with shifts</div></div>` +
          (isOn ? `<div class="tl-expand-btn${wasOpen ? ' open' : ''}" id="tlExpandBtn" onclick="event.stopPropagation();toggleTlDropdown()">${BSVG}</div>` : '') +
        `</div>` +
        `<div class="setting-expand-body${wasOpen ? ' open' : ''}" id="tlExpandBody" onclick="event.stopPropagation()">` +
          makeDropdownToggle('toggleTimelineRollover', "settingToggle('timelineRollover')", 'Extend past midnight for night shifts') +
          makeDropdownToggle('toggleTimeline24h', "settingToggle('timeline24h')", 'Show hours in 24-hour format') +
          `<div class="dd-label-card">Activate Shaded Hours</div>` +
          `<div class="dd-num-card">${[['Off','off'],['6pm - 6am','6pm6am'],['12pm - 12am','12pm12am']].map(function(o){var isOn=(appSettings.timelineNightMode||'6pm6am')===o[1];return '<button class="dd-num-cell'+(isOn?' selected':'')+'" style="'+(isOn?'background:var(--primary);color:#fff;':'')+'" onclick="event.stopPropagation();setTimelineNight(\''+o[1]+'\')">'+o[0]+'</button>';}).join('')}</div>` +
        `</div>` +
      `</div>`;
  }
  const stList = document.getElementById('settingsSavedThemesList');
  if (stList && typeof ThemeSystem !== 'undefined') {
    const themes = ThemeSystem.getSavedThemes();
    if (themes.length === 0) {
      stList.innerHTML = '<div style="font-size:var(--text-xs);color:var(--text-mid);padding:4px 8px;">No saved themes yet - use the Theme Builder to create one</div>';
    } else {
      stList.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-top:4px';
      stList.innerHTML = '';
      const BK = '#000000';
      const bw = '3px';
      const _stDelTimers = {};
      function _stRenderCard(stList, themes) {
        stList.innerHTML = '';
        for (let i = 0; i < themes.length; i += 2) {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:4px';
          [themes[i], themes[i+1]].forEach((theme, slot) => {
            const idx = i + slot;
            if (!theme?.baseColors) {
              const ph = document.createElement('div'); ph.style.flex = '1'; row.appendChild(ph); return;
            }
            const bg1 = theme.baseColors.bg1       || '#233040';
            const pri = theme.baseColors.primary   || '#48a971';
            const sec = theme.baseColors.secondary || '#5A8DB8';
            const acc = theme.baseColors.accent    || '#8a7ca8';
            const tl  = theme.baseColors.textLight || '#ffffff';
            const isDelConf = !!ThemeSystem.deleteConfirm[idx];
            const card = document.createElement('div');
            card.style.cssText = `flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;background:${bg1}`;
            if (isDelConf) {
              card.innerHTML =
                `<div style="height:var(--qs-hdr);background:${sec};border-bottom:${bw} solid ${BK};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:${tl}">Are You Sure?</div>` +
                `<div style="padding:4px"><div style="display:flex;gap:4px;height:var(--qs-hdr)">` +
                  `<div class="_st-yes" style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);background:${pri};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer">Yes</div>` +
                  `<div class="_st-sure" style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);background:${sec};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl}">Delete?</div>` +
                  `<div class="_st-no" style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);background:${acc};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer">No</div>` +
                `</div></div>`;
              card.querySelector('._st-yes').onclick = () => {
                clearTimeout(_stDelTimers[idx]);
                Object.keys(_stDelTimers).forEach(k => clearTimeout(_stDelTimers[k]));
                ThemeSystem.deleteConfirm = {};
                ThemeSystem.deleteTheme(idx);
                _stRenderCard(stList, ThemeSystem.getSavedThemes());
                if (typeof updateSettingsUI === 'function') updateSettingsUI();
              };
              card.querySelector('._st-no').onclick = () => {
                clearTimeout(_stDelTimers[idx]);
                ThemeSystem.deleteConfirm[idx] = false;
                _stRenderCard(stList, ThemeSystem.getSavedThemes());
              };
            } else {
              card.innerHTML =
                `<div style="height:var(--qs-hdr);background:${sec};border-bottom:${bw} solid ${BK};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:${tl};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 8px">${theme.name}</div>` +
                `<div style="padding:4px"><div style="display:flex;gap:4px;height:var(--qs-hdr)">` +
                  `<div class="_st-edit" style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);background:${pri};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer">Edit</div>` +
                  `<div class="_st-load" style="flex:2;border:${bw} solid ${BK};border-radius:var(--radius);background:${sec};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer">Load</div>` +
                  `<div class="_st-del" style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);background:${acc};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer">Delete</div>` +
                `</div></div>`;
              card.querySelector('._st-edit').onclick = () => {
                ThemeSystem.loadTheme(idx);
                ThemeSystem.open();
              };
              card.querySelector('._st-load').onclick = () => {
                ThemeSystem.loadTheme(idx);
                if (typeof updateSettingsUI === 'function') updateSettingsUI();
              };
              card.querySelector('._st-del').onclick = () => {
                ThemeSystem.deleteConfirm[idx] = true;
                _stRenderCard(stList, ThemeSystem.getSavedThemes());
                // Auto-revert after 2 seconds
                _stDelTimers[idx] = setTimeout(() => {
                  ThemeSystem.deleteConfirm[idx] = false;
                  _stRenderCard(stList, ThemeSystem.getSavedThemes());
                }, 2000);
              };
            }
            row.appendChild(card);
          });
          stList.appendChild(row);
        }
      }
      _stRenderCard(stList, themes);
    }
  }
  const toggleMap = {
    showJobCards: 'toggleJobCards', showQuickSchedule: 'toggleQuickSchedule',
    showTimeDot: 'toggleTimeDot', showHistory: 'toggleHistory', showJobHistory: 'toggleJobHistory',
    showTimerSections: 'toggleTimerSections', showMiniGraph: 'toggleMiniGraph',
    showSecondShift: 'toggleSecondShift', drawnBorders: 'toggleDrawnBorders',
    showTimelineCard: 'toggleTimelineCard', timelineRollover: 'toggleTimelineRollover', timeline24h: 'toggleTimeline24h',
  };
  Object.keys(toggleMap).forEach(k => {
    const card = document.getElementById(toggleMap[k]);
    if (card) card.classList.toggle('active', !!appSettings[k]);
  });
}

function openWindow(id) {
  if (id === 'newWindow') { refreshSwatchCards(); nwAutoSelect(); }
  const win = document.getElementById(id);
  win.style.opacity = '0';
  win.classList.add('open');
  if (id !== 'themeBuilderWindow') {
    injectWindowFx(id);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      win.style.transition = 'opacity 0.6s ease';
      win.style.opacity = '1';
      setTimeout(() => { win.style.transition = ''; }, 700);
      if(typeof appSettings!=='undefined'&&appSettings.drawnBorders&&typeof DrawnBorders!=='undefined'){
        if(id==='newWindow') DrawnBorders.applyNewWindow();
        if(id==='jobSettingsWindow') DrawnBorders.applyJobSettingsWindow();
      }
    });
  });
}

function closeWindow(id) {
  var win = document.getElementById(id);
  if(!win) return;
  // animate back button while fading
  var backBtn = win.querySelector('.data-window-back');
  if(backBtn && typeof playBackBtnAnim === 'function') playBackBtnAnim(backBtn);
  // 150ms fade out then remove
  win.style.transition = 'opacity 0.6s ease';
  win.style.opacity = '0';
  setTimeout(function(){
    win.classList.remove('open');
    win.style.transition = '';
    win.style.opacity = '';
    removeWindowFx(id);
    if(id==='jobSettingsWindow'){ var _b=document.getElementById('jobSettingsBtn'); if(_b) setTimeout(function(){ playDotGridEnter(_b); }, 80); }
  }, 600);
}
function nwAutoSelect() {
  const first = document.querySelector('#nwColorCard .nw-swatch');
  if (first) nwPickColor(first);
}
function nwPickColor(el) {
  document.querySelectorAll('#nwColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  nwSelectedColor = el.dataset.color;
  const activeDow = document.querySelector('#nwDowCard .dow-btn.active');
  if (activeDow && nwSelectedColor) { activeDow.style.background = nwSelectedColor; activeDow.style.color = 'var(--text-mid)'; }
  const titleCard = document.querySelector('.nw-title-card');
  if (titleCard && nwSelectedColor) { titleCard.style.background = nwSelectedColor;; }
  nwCheckReady();
}
function nwPickDow(el) {
  document.querySelectorAll('#nwDowCard .dow-btn').forEach(b => { b.classList.remove('active'); b.style.background = ''; b.style.color = ''; });
  el.classList.add('active');
  if (nwSelectedColor) { el.style.background = nwSelectedColor; el.style.color = 'var(--text-mid)'; }
  nwSelectedDow = parseInt(el.dataset.dow);
}
function nwCheckReady() {
  const title = document.getElementById('nwTitleInput').value.trim();
  document.getElementById('nwFooter').classList.toggle('ready', title.length > 0 && !!nwSelectedColor);
}
function nwCreate() {
  if (!document.getElementById('nwFooter').classList.contains('ready')) return;
  const title = document.getElementById('nwTitleInput').value.trim();
  const job = { id: Date.now(), title, color: nwSelectedColor, firstDow: nwSelectedDow };
  jobs.push(job);
  lsSet('sch_jobs', jobs);
  renderJobs();
  document.getElementById('nwTitleInput').value = '';
  nwSelectedColor = null;
  document.querySelectorAll('#nwColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  document.querySelectorAll('#nwDowCard .dow-btn').forEach((b,i) => b.classList.toggle('active', i === 1));
  nwSelectedDow = 1;
  document.getElementById('nwFooter').classList.remove('ready');
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  closeWindow('newWindow');
}

function formatCountdown(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function getNextShiftCountdown(job) {
  if (!job.schedule) return null;
  const now = new Date();
  for (let d = 0; d < 14; d++) {
    const date = new Date(now); date.setDate(now.getDate() + d); date.setHours(0,0,0,0);
    const sched = job.schedule[localDateKey(date)];
    if (!sched || !sched.start || sched.start === 'OFF' || sched.start === 'NONE') continue;
    const startMins = parseTimeToMins(sched.start); if (startMins === null) continue;
    const shiftDate = new Date(date); shiftDate.setHours(Math.floor(startMins/60), startMins%60, 0, 0);
    const diffMs = shiftDate - now; if (diffMs > 0) return formatCountdown(Math.round(diffMs/60000));
  }
  return null;
}


function lcarsToggle() {
  appSettings.lcarsMode = !appSettings.lcarsMode;
  lsSet('sch_settings', appSettings);
  document.getElementById('toggleLcarsMode').classList.toggle('active', appSettings.lcarsMode);
  if (typeof lcarsSetMode === 'function') lcarsSetMode(appSettings.lcarsMode);
}

function settingsTab(tab) {
  ['display','cards','other','theme'].forEach(t => {
    document.getElementById('spanel-' + t).style.display = t === tab ? 'flex' : 'none';
    document.getElementById('stab-'   + t).classList.toggle('active', t === tab);
  });
  // Always close expand dropdowns on tab change
  var body = document.getElementById('tlExpandBody');
  var btn  = document.getElementById('tlExpandBtn');
  if (body) body.classList.remove('open');
  if (btn)  btn.classList.remove('open');
  var qsBody = document.getElementById('qsExpandBody');
  var qsBtn  = document.getElementById('qsExpandBtn');
  if (qsBody) qsBody.classList.remove('open');
  if (qsBtn)  qsBtn.classList.remove('open');
  var histBody = document.getElementById('histExpandBody');
  var histBtn  = document.getElementById('histExpandBtn');
  if (histBody) histBody.classList.remove('open');
  if (histBtn)  histBtn.classList.remove('open');
  var mgBody2 = document.getElementById('mgExpandBody');
  var mgBtn2  = document.getElementById('mgExpandBtn');
  if (mgBody2) mgBody2.classList.remove('open');
  if (mgBtn2)  mgBtn2.classList.remove('open');
}

function setMiniGraphDays(n) {
  appSettings.miniGraphDays = n; lsSet('sch_settings', appSettings); updateSettingsUI(); renderJobs();
}

function nowTimeStr() {
  const now = new Date(); let h = now.getHours(), m = now.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ' ' + ap;
}

function getTimerKey(job) {
  const today = localDateKey(new Date());
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yKey = localDateKey(yesterday);
  // Running overnight shift takes priority -- must resolve before declaring today active
  if (job.worked && job.worked[yKey] && job.worked[yKey].start && !job.worked[yKey].end) return yKey;
  if (job.worked && job.worked[today]) return today;
  return today;
}
function getTimerState(job) {
  const key = getTimerKey(job); const w = job.worked && job.worked[key];
  if (!w || !w.start) return 'idle'; if (w.start && !w.end) return 'running'; return 'done';
}

function timerIcon(state, job) {
  var isPxl=document.body.classList.contains('pxl-font');
  var si = state==='running'?1:state==='done'?2:0;
  if(typeof buildTimerSvgStr==='function'){
    return isPxl ? buildTimerPxSvgStr(si) : buildTimerSvgStr(si);
  }
  // fallback (animations.js not yet loaded)
  if (state === 'running') return '<div class="job-card-pause"><div class="job-card-pause-bar"></div><div class="job-card-pause-bar"></div></div>';
  else if (state === 'done') return isPxl ? '<svg width="20" height="14" viewBox="0 0 11 8" fill="none" shape-rendering="crispEdges"><rect x="0" y="4" width="2" height="1" fill="currentColor"/><rect x="1" y="5" width="2" height="1" fill="currentColor"/><rect x="2" y="6" width="2" height="1" fill="currentColor"/><rect x="3" y="5" width="2" height="1" fill="currentColor"/><rect x="4" y="4" width="2" height="1" fill="currentColor"/><rect x="5" y="3" width="2" height="1" fill="currentColor"/><rect x="6" y="2" width="2" height="1" fill="currentColor"/><rect x="7" y="1" width="2" height="1" fill="currentColor"/><rect x="8" y="0" width="2" height="1" fill="currentColor"/></svg>' : '<div class="job-card-check"></div>';
  if(isPxl) return '<svg width="10" height="16" viewBox="0 0 5 9" fill="none" shape-rendering="crispEdges"><rect x="0" y="0" width="1" height="9" fill="currentColor"/><rect x="1" y="1" width="1" height="7" fill="currentColor"/><rect x="2" y="2" width="1" height="5" fill="currentColor"/><rect x="3" y="3" width="1" height="3" fill="currentColor"/><rect x="4" y="4" width="1" height="1" fill="currentColor"/></svg>';
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="currentColor" style="color:var(--text-mid)" stroke="var(--text-mid)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

function getElapsedStr(job) {
  const key = getTimerKey(job); const w = job.worked && job.worked[key];
  if (!w || !w.start) return null;
  const startMins = parseTimeToMins(w.start); if (startMins === null) return null;
  const now = new Date(); const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayKey = localDateKey(new Date());
  // For overnight shifts stored under yesterday's key, calculate across the midnight boundary
  let diff = (key !== todayKey)
    ? (nowMins + 1440 - startMins) % 1440 || 1440  // handles >24h shifts too
    : nowMins - startMins;
  if (diff < 0) diff += 1440;
  return String(Math.floor(diff/60)).padStart(2,'0') + 'h ' + String(diff%60).padStart(2,'0') + 'm';
}

function timerTap(jobId, e, el) {
  e.stopPropagation(); const job = jobs.find(j => j.id === jobId); if (!job) return;
  const key = getTimerKey(job); if (!job.worked) job.worked = {};
  const state = getTimerState(job);
  const todayKey = localDateKey(new Date());

  // done + same day → show modal, no animation
  if(state==='done' && key===todayKey){ showTimerResetModal(job, key); return; }

  function doChange(){
    if(state==='idle'){
      job.worked[todayKey]={start:nowTimeStr(),end:null}; lsSet('sch_jobs',jobs); renderJobs();
    } else if(state==='running'){
      job.worked[key].end=nowTimeStr(); lsSet('sch_jobs',jobs); renderJobs();
      if(typeof renderHistory==='function'){buildHistory();renderHistory();}
    } else {
      job.worked[todayKey]={start:nowTimeStr(),end:null}; lsSet('sch_jobs',jobs); renderJobs();
    }
  }

  // Try morph animation — swap existing icon for morph SVG, animate, then re-render
  var timerEl = el;
  var fromSi = state==='running'?1:state==='done'?2:0;
  var toSi   = state==='idle'?1:state==='running'?2:0;
  var _isPxl = document.body.classList.contains('pxl-font');
  if(timerEl && typeof buildTimerSvg==='function' && typeof playTimerMorph==='function'){
    try{
      var _svg=_isPxl?buildTimerPxSvg(fromSi):buildTimerSvg(fromSi);
      timerEl.innerHTML=''; timerEl.appendChild(_svg);
      if(_isPxl){
        playTimerMorph(timerEl, fromSi, toSi, function(){
          if(typeof _pxSaveState==='function') _pxSaveState(job,state,key,todayKey);
          // Surgical update — don't touch job card DOM at all (avoids blink)
          // 1. Update bottom text on this card only
          var allCards=document.querySelectorAll('.job-card');
          for(var _ci=0;_ci<allCards.length;_ci++){
            if(allCards[_ci].querySelector('[data-timer-job="'+jobId+'"]')){
              var _bot=allCards[_ci].querySelector('.job-card-bottom');
              var _nts=getTimerState(job);
              if(_bot) _bot.textContent=_nts==='running'?(getElapsedStr(job)||'00h 00m'):(getNextShiftCountdown(job)||'-- h -- m');
              break;
            }
          }
          // 2. Rebuild quick schedule section (shift card appears there)
          if(typeof buildQuickSchedule==='function'&&typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){
            buildQuickSchedule(); renderQuickSchedule();
          }
          // 3. Update history
          if(typeof renderHistory==='function'){buildHistory();renderHistory();}
        });
      } else {
        // smooth: morph then full re-render (new icon fades in via CSS)
        playTimerMorph(timerEl, fromSi, toSi, doChange);
      }
    }catch(err){ doChange(); }
  } else {
    doChange();
  }
}


function _animTimerReset(jobId, doneFn) {
  var cardEl = document.querySelector('.job-card-right[data-timer-job="'+jobId+'"]');
  if(cardEl && typeof buildTimerPxSvg==='function' && typeof playPxMorph==='function' && document.body.classList.contains('pxl-font')){
    var svg = buildTimerPxSvg(2); // CHECK state
    cardEl.innerHTML=''; cardEl.appendChild(svg);
    var rects = Array.from(svg.querySelectorAll('rect'));
    playPxMorph(rects,2,0,700,doneFn); // CHECK→PLAY
  } else if(cardEl && typeof buildTimerSvg==='function' && typeof playTimerMorph==='function'){
    var svg2 = buildTimerSvg(2);
    cardEl.innerHTML=''; cardEl.appendChild(svg2);
    playTimerMorph(cardEl,2,0,doneFn);
  } else {
    doneFn();
  }
}

function showTimerResetModal(job, key) {
  let modal = document.getElementById('timerResetModal');
  if (!modal) {
    modal = document.createElement('div'); modal.id = 'timerResetModal'; modal.className = 'modal-blur-overlay';
    modal.innerHTML = '<div style="background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:100%;max-width:320px;overflow:hidden;">'
      + '<div style="padding:16px;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);text-align:center;letter-spacing:var(--ls-wider);text-transform:uppercase;">Shift Done</div>'
      + '<div style="display:flex;flex-direction:column;border-top:var(--border-width) solid var(--border-color);">'
      + '<div id="timerResetNew" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);cursor:pointer;border-bottom:var(--border-width) solid var(--border-color);background:var(--secondary);">Start New Shift</div>'
      + '<div style="display:flex;border-top:none;">'
      + '<div id="timerResetNo" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-mid);cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Cancel</div>'
      + '<div id="timerResetYes" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--color-1);cursor:pointer;">Reset</div>'
      + '</div></div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('timerResetNo').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('timerResetNew').onclick = () => {
    const todayKey = localDateKey(new Date());
    _animTimerReset(job.id, function(){
      if (!job.worked) job.worked = {};
      if (key !== todayKey && job.worked[key]) {
        job.worked[todayKey] = { start: nowTimeStr(), end: null };
      } else {
        if (!job.worked[todayKey]) job.worked[todayKey] = {};
        if (!job.worked[todayKey].extra) job.worked[todayKey].extra = [];
        job.worked[todayKey].extra.push({ start: nowTimeStr(), end: null });
      }
      lsSet('sch_jobs', jobs);
      modal.style.display = 'none'; renderJobs();
    });
  };
  document.getElementById('timerResetYes').onclick = () => {
    const key = getTimerKey(job);
    _animTimerReset(job.id, function(){
      if (!job.worked) job.worked = {}; delete job.worked[key]; lsSet('sch_jobs', jobs);
      modal.style.display = 'none'; renderJobs();
      if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
    });
  };
}

let _graphAnimDone = false;

function buildMiniGraph(job, container) {
  const cs=getComputedStyle(document.documentElement);
  const green=cs.getPropertyValue('--primary').trim();
  const blue=cs.getPropertyValue('--secondary').trim();
  const acc=cs.getPropertyValue('--accent').trim();
  const n=appSettings.miniGraphDays||3; const today=new Date(); today.setHours(0,0,0,0); const days=[];
  for(let i=-n;i<=n;i++){
    const d=new Date(today); d.setDate(today.getDate()+i); const key=localDateKey(d);
    const when=i<0?'past':i===0?'today':'future'; const src=when==='past'?job.worked:job.schedule; const entry=src&&src[key];
    let hours=0,hasShift=false;
    if(entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end){const s=parseTimeToMins(entry.start),e=parseTimeToMins(entry.end);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=1440;hours=diff/60;hasShift=true;}}
    days.push({when,hasShift,hours});
  }
  container.style.gap='1px';
  const maxH=Math.max(...days.map(d=>d.hours),1);
  const barEls=[];
  var _isPxlMg=document.body.classList.contains('pxl-font');
  days.forEach(d=>{
    const col=document.createElement('div');
    col.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;min-width:0;';
    const barColor=d.when==='past'?blue:d.when==='today'?green:acc;
    if(_isPxlMg && !d.hasShift){
      // pixel diamond for off/unscheduled
      const ns='http://www.w3.org/2000/svg';
      const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','100%');svg.setAttribute('height','8');svg.setAttribute('viewBox','0 0 6 6');svg.setAttribute('shape-rendering','crispEdges');
      [[2,0,2,2],[0,2,6,2],[2,4,2,2]].forEach(function(r){const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',r[0]);rect.setAttribute('y',r[1]);rect.setAttribute('width',r[2]);rect.setAttribute('height',r[3]);rect.setAttribute('fill',barColor);svg.appendChild(rect);});
      col.appendChild(svg);
      container.appendChild(col);
      barEls.push({el:svg,d,targetH:3,grows:false});
      return;
    }
    const el=document.createElement('div');
    el.style.width='100%';
    el.style.background=barColor;
    el.style.height='3px';
    el.style.borderRadius=_isPxlMg?'0':'2px';
    if(d.when==='today' && getOverlayCfg().overlay==='crt') {
      el.style.animation='crt-blink 1.8s ease-in-out infinite';
    }
    col.appendChild(el);
    container.appendChild(col);
    barEls.push({el,d,targetH:d.hasShift?Math.max(3,Math.round((d.hours/maxH)*30)):3,grows:d.hasShift});
  });
  if(!_graphAnimDone) {
    function easeInOut(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
    const configs=barEls.map(b=>({dur:1000+Math.random()*800,delay:Math.random()*250}));
    setTimeout(function(){
      barEls.forEach(function(b,i){if(b.grows){if(_isPxlMg){var cap=document.createElement('div');cap.style.cssText='width:calc(100% - 4px);margin:0 auto;height:2px;background:'+b.el.style.background+';';b.el.parentNode.insertBefore(cap,b.el);}else{b.el.style.borderRadius='2px 2px 0 0';}}});
      const t0=performance.now();
      function step(ts){
        const el=ts-t0; let done=true;
        barEls.forEach(function(b,i){
          if(!b.grows)return;
          const t=Math.max(0,Math.min((el-configs[i].delay)/configs[i].dur,1));
          b.el.style.height=Math.max(3,Math.round(b.targetH*easeInOut(t)))+'px';
          if(t<1)done=false;
        });
        if(!done)requestAnimationFrame(step);
        else barEls.forEach(function(b){b.el.style.height=b.targetH+'px';});
      }
      requestAnimationFrame(step);
    },400);
  } else {
    barEls.forEach(function(b){
      b.el.style.height=b.targetH+'px';
      if(b.grows){if(_isPxlMg){var cap=document.createElement('div');cap.style.cssText='width:calc(100% - 4px);margin:0 auto;height:2px;background:'+b.el.style.background+';';b.el.parentNode.insertBefore(cap,b.el);}else{b.el.style.borderRadius='2px 2px 0 0';}}
    });
  }
}

function buildExpandedGraph(job, container) {
  const cs=getComputedStyle(document.documentElement);
  const COL={past:cs.getPropertyValue('--secondary').trim(),today:cs.getPropertyValue('--primary').trim(),future:cs.getPropertyValue('--accent').trim()};
  const today=new Date();today.setHours(0,0,0,0);
  const DAY=86400000;
  const mon=new Date(today);mon.setDate(mon.getDate()-((mon.getDay()+6)%7)-7);
  const days=[];
  for(let i=0;i<21;i++){
    const d=new Date(mon.getTime()+i*DAY);const key=localDateKey(d);const rel=Math.round((d-today)/DAY);
    const when=rel<0?'past':rel===0?'today':'future';const src=when==='past'?job.worked:job.schedule;const entry=src&&src[key];
    let hours=0,dayType='none';
    if(entry){
      if(entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end){const s=parseTimeToMins(entry.start),e=parseTimeToMins(entry.end);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=1440;hours=diff/60;dayType='worked';}}
      else{dayType='off';}
    }
    days.push({when,hours,dayType});
  }
  const maxH=Math.max(...days.map(d=>d.hours),1);
  for(let w=0;w<3;w++){
    const week=document.createElement('div');week.className='ex-week';
    for(let d=0;d<7;d++){
      const day=days[w*7+d];const col=document.createElement('div');col.className='ex-col';
      const el=document.createElement('div');
      const c=COL[day.when];
      const ns='http://www.w3.org/2000/svg';
      var _isPxlEx=document.body.classList.contains('pxl-font');
      if(day.dayType==='worked'){
        if(_isPxlEx){
          const h=Math.max(2,Math.round((day.hours/maxH)*31));
          const cap=document.createElement('div');cap.style.cssText='width:calc(100% - 4px);margin:0 auto;height:2px;background:'+c+';';
          const bar=document.createElement('div');bar.style.cssText='width:100%;height:'+Math.max(2,h-2)+'px;background:'+c+';';
          col.appendChild(cap);col.appendChild(bar);
        } else {
          el.className='ex-bar';el.style.height=Math.max(2,Math.round((day.hours/maxH)*31))+'px';el.style.background=c;
          col.appendChild(el);
        }
      } else if(day.dayType==='off'){
        const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','100%');
        if(_isPxlEx){
          svg.setAttribute('viewBox','0 0 10 10');svg.setAttribute('shape-rendering','crispEdges');
          [[3, 0, 4, 1], [1, 1, 8, 1], [0, 2, 10, 1], [0, 3, 10, 1], [0, 4, 10, 1], [0, 5, 10, 1], [0, 6, 10, 1], [0, 7, 10, 1], [1, 8, 8, 1], [3, 9, 4, 1]].forEach(function(r){const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',r[0]);rect.setAttribute('y',r[1]);rect.setAttribute('width',r[2]);rect.setAttribute('height',r[3]);rect.setAttribute('fill',c);svg.appendChild(rect);});
        } else {
          svg.setAttribute('viewBox','0 0 10 10');
          const ci=document.createElementNS(ns,'circle');ci.setAttribute('cx','5');ci.setAttribute('cy','5');ci.setAttribute('r','5');ci.setAttribute('fill',c);svg.appendChild(ci);
        }
        col.appendChild(svg);
      } else {
        const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','100%');
        if(_isPxlEx){
          svg.setAttribute('viewBox','0 0 7 3');svg.setAttribute('shape-rendering','crispEdges');
          [[3,0,1,1],[2,1,3,1],[1,2,5,1]].forEach(function(r){const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',r[0]);rect.setAttribute('y',r[1]);rect.setAttribute('width',r[2]);rect.setAttribute('height',r[3]);rect.setAttribute('fill',c);svg.appendChild(rect);});
        } else {
          svg.setAttribute('viewBox','0 0 10 8.66');
          const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points','0,8.66 10,8.66 5,0');poly.setAttribute('fill',c);svg.appendChild(poly);
        }
        col.appendChild(svg);
      }
      week.appendChild(col);
    }
    container.appendChild(week);
  }
}

const CUSTOM_FONTS = {
  def:   {label:'DEF',   family:'system-ui,-apple-system,BlinkMacSystemFont,sans-serif'},
  mono:  {label:'MONO',  family:"'Courier New',Courier,monospace"},
  round: {label:'RND',   family:"'Trebuchet MS',Tahoma,'Gill Sans',sans-serif"},
  serif: {label:'SERIF', family:"Georgia,'Times New Roman',serif"},
  slab:  {label:'SLAB',  family:"'Rockwell','Courier New',serif"},
  cond:  {label:'COND',  family:"'Arial Narrow',Arial,sans-serif"},
  ovsr:  {label:'OVSR',  family:"'Overseer',system-ui,sans-serif"},
  nuni:  {label:'NUN',   family:"'Nunito',system-ui,sans-serif"},
  pxlf:  {label:'PXL',   family:"'Pixelify',system-ui,sans-serif"},
  orbt:  {label:'ORB',   family:"'Orbitron',system-ui,sans-serif"},
  somp:  {label:'SMP',   family:"'Simpsons',system-ui,sans-serif"},
  lime:  {label:'LIM',   family:"'Limelight',system-ui,sans-serif"},
};
function applyCustomFont(id) {
  let s = document.getElementById('_customFontStyle');
  if (!s) { s = document.createElement('style'); s.id = '_customFontStyle'; document.head.appendChild(s); }
  const f = CUSTOM_FONTS[id || 'def'];
  const isPxl = id === 'pxlf';
  s.textContent = (id && id !== 'def') ? `*{font-family:${f.family}!important;}` + (isPxl ? `:root{--text-xs:13px;--text-sm:16px;--text-md:19px;}` : '') : '';
  document.body.classList.toggle('pxl-font', isPxl);
  var _backSvg = isPxl
    ? '<svg width="20" height="20" viewBox="0 0 7 7" fill="none" shape-rendering="crispEdges"><rect x="4" y="0" width="1" height="1" fill="currentColor"/><rect x="3" y="1" width="1" height="1" fill="currentColor"/><rect x="2" y="2" width="1" height="1" fill="currentColor"/><rect x="1" y="3" width="1" height="1" fill="currentColor"/><rect x="2" y="4" width="1" height="1" fill="currentColor"/><rect x="3" y="5" width="1" height="1" fill="currentColor"/><rect x="4" y="6" width="1" height="1" fill="currentColor"/></svg>'
    : '<svg width="22" height="22" viewBox="0 0 50 50" fill="none"><line x1="42" y1="10" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line x1="42" y1="40" x2="8" y2="25" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  document.querySelectorAll('.data-window-back').forEach(function(b){ b.innerHTML = _backSvg; });
  var btn=document.getElementById('jobSettingsBtn');
  if(btn){ btn.innerHTML=''; btn.appendChild(isPxl?buildPixelDotGrid():buildDotGrid()); }
}






function buildTimelineCard() {
  var card = document.createElement('div'); card.className = 'tl-card';
  var rollover = appSettings.timelineRollover;

  // Collect today's shifts
  var todayKey = localDateKey(new Date());
  var shifts = [];
  function collectEntry(entry, color, jobId) {
    if (entry && entry.start && entry.start!=='OFF' && entry.start!=='NONE' && entry.end) {
      var sm=parseTimeToMins(entry.start), em=parseTimeToMins(entry.end);
      if (sm!==null && em!==null) { if(em<=sm) em+=1440; shifts.push({s:sm/60,e:em/60,col:color,jobId:jobId}); }
    }
    var ex = entry && entry.extra && entry.extra[0];
    if (ex && ex.start && ex.start!=='NONE' && ex.end) {
      var sm2=parseTimeToMins(ex.start), em2=parseTimeToMins(ex.end);
      if (sm2!==null && em2!==null) { if(em2<=sm2) em2+=1440; shifts.push({s:sm2/60,e:em2/60,col:color,jobId:jobId}); }
    }
  }
  jobs.forEach(function(job){
    var src = job.worked && job.worked[todayKey] ? job.worked : job.schedule;
    collectEntry(src && src[todayKey], job.color, job.id);
  });

  // Yesterday's overnight shifts (crosses midnight into today) -- offset by -24h to map to today's scale
  if (rollover) {
    var yest = new Date(); yest.setDate(yest.getDate()-1);
    var yKey = localDateKey(yest);
    jobs.forEach(function(job){
      var ySrc = job.worked && job.worked[yKey] ? job.worked : job.schedule;
      var yEntry = ySrc && ySrc[yKey];
      if (yEntry && yEntry.start && yEntry.start!=='OFF' && yEntry.start!=='NONE' && yEntry.end) {
        var ysm=parseTimeToMins(yEntry.start), yem=parseTimeToMins(yEntry.end);
        if (ysm!==null && yem!==null) { if(yem<=ysm) yem+=1440; if(yem>1440) shifts.push({s:(ysm-1440)/60,e:(yem-1440)/60,col:job.color}); }
      }
      var yex = yEntry && yEntry.extra && yEntry.extra[0];
      if (yex && yex.start && yex.start!=='NONE' && yex.end) {
        var ysm2=parseTimeToMins(yex.start), yem2=parseTimeToMins(yex.end);
        if (ysm2!==null && yem2!==null) { if(yem2<=ysm2) yem2+=1440; if(yem2>1440) shifts.push({s:(ysm2-1440)/60,e:(yem2-1440)/60,col:job.color}); }
      }
    });
  }

  // Determine timeline end: 24h normally, extended if rollover and any shift crosses midnight
  var maxEnd = 24;
  if (rollover) shifts.forEach(function(sh){ if (sh.e > 24) maxEnd = Math.max(maxEnd, Math.ceil(sh.e)); });
  // Running jobs are absent from shifts[] (no end yet) — extend maxEnd from their scheduled span
  if (rollover) {
    jobs.forEach(function(job){
      if (getTimerState(job) !== 'running') return;
      var sEntry = job.schedule && job.schedule[todayKey];
      if (!sEntry || !sEntry.start || sEntry.start==='OFF' || sEntry.start==='NONE' || !sEntry.end) return;
      var ssm=parseTimeToMins(sEntry.start), sem=parseTimeToMins(sEntry.end);
      if (ssm===null || sem===null) return;
      if (sem<=ssm) sem+=1440;
      if (sem/60 > 24) maxEnd = Math.max(maxEnd, Math.ceil(sem/60));
    });
  }
  var DSTART = -1, DEND = maxEnd + 1, DSPAN = DEND - DSTART;
  function pct(h){ return ((h-DSTART)/DSPAN*100).toFixed(3)+'%'; }
  function pctN(h){ return (h-DSTART)/DSPAN*100; }
  var now = new Date(); var nowH = now.getHours() + now.getMinutes()/60;

  // Adaptive grid line color based on --bg-2 luminance
  var _cs2 = getComputedStyle(document.documentElement);
  var _bg2 = _cs2.getPropertyValue('--bg-2').trim();
  var _r=parseInt(_bg2.slice(1,3),16)||0, _g=parseInt(_bg2.slice(3,5),16)||0, _b=parseInt(_bg2.slice(5,7),16)||0;
  var _lum = (0.299*_r + 0.587*_g + 0.114*_b) / 255;
  var _adj = _lum < 0.5 ? 30 : -30;
  function _clamp(v){return Math.max(0,Math.min(255,v));}
  var _glCol = 'rgb('+_clamp(_r+_adj)+','+_clamp(_g+_adj)+','+_clamp(_b+_adj)+')';

  // Hourly grid lines
  for (var h=0; h<=maxEnd; h++) {
    var gl=document.createElement('div'); gl.className='tl-gl'; gl.style.left=pct(h); gl.style.background=_glCol; card.appendChild(gl);
  }
  // Night zones based on timelineNightMode setting
  var nightMode = appSettings.timelineNightMode || '6pm6am';
  function addNightZone(from, to) {
    if(from >= to || to <= DSTART || from >= DEND) return;
    var f = Math.max(from, DSTART), t = Math.min(to, DEND);
    if(f >= t) return;
    var nz = document.createElement('div'); nz.className = 'tl-night';
    nz.style.left = pct(f);
    if(t >= DEND) { nz.style.right = '0'; }
    else { nz.style.width = 'calc('+pct(t)+' - '+pct(f)+')'; }
    card.appendChild(nz);
  }
  if (nightMode !== 'off') {
    if (nightMode === '6pm6am') {
      addNightZone(DSTART, 0);  // left gap (11pm)
      for (var nDay = 0; nDay <= Math.ceil(maxEnd / 24); nDay++) {
        addNightZone(nDay * 24, nDay * 24 + 6);
        addNightZone(nDay * 24 + 18, nDay * 24 + 24);
      }
    } else {
      // 12pm12am: noon-midnight per day, no left gap, right gap only at midnight boundary
      for (var nDay2 = 0; nDay2 <= Math.ceil(maxEnd / 24); nDay2++) {
        addNightZone(nDay2 * 24 + 12, nDay2 * 24 + 24);
      }
      if (maxEnd % 24 === 0) addNightZone(maxEnd, DEND);
    }
  }

  // Hour labels every 3h - wrap past midnight back to 0-23
  for (var lh=0; lh<=maxEnd; lh+=3) {
    var t=document.createElement('div'); t.className='tl-hour'; t.style.left=pct(lh);
    var h24 = ((lh % 24) + 24) % 24;
    var label = appSettings.timeline24h
      ? String(h24)
      : (h24===0 ? '12' : h24 < 12 ? String(h24) : h24===12 ? '12' : String(h24-12));
    t.textContent = label; card.appendChild(t);
  }

  // Detect overlaps
  var hasOverlap = false;
  for (var i=0; i<shifts.length; i++) for (var j=i+1; j<shifts.length; j++)
    if (Math.max(shifts[i].s,shifts[j].s) < Math.min(shifts[i].e,shifts[j].e)) hasOverlap=true;

  var sh = hasOverlap ? 7 : 14;

  // ── Pre-compute ghost state per job ──
  var _tlExpired = {};   // job.id -> true (idle, scheduled time passed)
  var _tlRunning = {};   // job.id -> {actualStartH, schedStartH, schedEndH}
  var todayKeyTL = localDateKey(new Date());

  jobs.forEach(function(job){
    var timerState = getTimerState(job);
    var tKey = getTimerKey(job);
    var wEntry = job.worked && job.worked[tKey];
    var actualStartH = null;
    if (wEntry && wEntry.start && wEntry.start!=='OFF' && wEntry.start!=='NONE'){
      var asm = parseTimeToMins(wEntry.start); if(asm!==null) actualStartH = asm/60;
    }
    var sEntry = job.schedule && job.schedule[todayKeyTL];
    var schedStartH = null, schedEndH = null;
    if(sEntry && sEntry.start && sEntry.start!=='OFF' && sEntry.start!=='NONE' && sEntry.end){
      var ssm2=parseTimeToMins(sEntry.start), sem2=parseTimeToMins(sEntry.end);
      if(ssm2!==null && sem2!==null){ if(sem2<=ssm2) sem2+=1440; schedStartH=ssm2/60; schedEndH=sem2/60; }
    }
    if(timerState==='idle' && schedEndH!==null && nowH>=schedEndH) _tlExpired[job.id]=true;
    if(timerState==='running' && actualStartH!==null && schedStartH!==null)
      _tlRunning[job.id]={actualStartH:actualStartH, schedStartH:schedStartH, schedEndH:schedEndH, color:job.color};
  });

  // ── Regular shift bars — skip expired today-shifts (drawn as ghost below) ──
  shifts.forEach(function(shift, idx){
    if(shift.jobId !== undefined && _tlExpired[shift.jobId]) return; // expired: ghost replaces
    var b=document.createElement('div'); b.className='tl-shift';
    b.style.left=pct(shift.s); b.style.width='calc('+pct(shift.e)+' - '+pct(shift.s)+')';
    b.style.background=shift.col; b.style.height=sh+'px';
    b.style.top = hasOverlap ? (3 + idx*(sh+1))+'px' : '3px';
    card.appendChild(b);
  });

  // ── Ghost + live overlays ──
  jobs.forEach(function(job){
    var info = _tlRunning[job.id];
    var isExpired = _tlExpired[job.id];
    if(!info && !isExpired) return;

    var sEntry = job.schedule && job.schedule[todayKeyTL];
    if(!sEntry || !sEntry.start || sEntry.start==='OFF' || sEntry.start==='NONE' || !sEntry.end) return;
    var ssm3=parseTimeToMins(sEntry.start), sem3=parseTimeToMins(sEntry.end);
    if(ssm3===null||sem3===null) return;
    if(sem3<=ssm3) sem3+=1440;
    var schedStartH=ssm3/60, schedEndH=sem3/60;

    if(isExpired){
      // Missed shift: faded fill, solid border
      var gexp=document.createElement('div'); gexp.className='tl-ghost show expired';
      gexp.style.color=job.color;
      gexp.style.left=pct(schedStartH); gexp.style.width='calc('+pct(schedEndH)+' - '+pct(schedStartH)+')';
      gexp.style.height=sh+'px'; gexp.style.top='3px';
      card.appendChild(gexp);
      return;
    }

    // Running job
    var actualStartH=info.actualStartH;
    var inGhostZone = nowH >= schedStartH-1; // live bar within 1h of scheduled start

    if(inGhostZone){
      // Scheduled bar becomes dashed ghost
      var ghost=document.createElement('div'); ghost.className='tl-ghost show';
      ghost.style.color=job.color;
      ghost.style.left=pct(schedStartH); ghost.style.width='calc('+pct(schedEndH)+' - '+pct(schedStartH)+')';
      ghost.style.height=sh+'px'; ghost.style.top='3px';
      card.appendChild(ghost);
    } else {
      // Live shift started early: scheduled bar still shows solid
      var bs=document.createElement('div'); bs.className='tl-shift';
      bs.style.left=pct(schedStartH); bs.style.width='calc('+pct(schedEndH)+' - '+pct(schedStartH)+')';
      bs.style.background=job.color; bs.style.height=sh+'px'; bs.style.top='3px';
      card.appendChild(bs);
    }

    // Live bar: starts at actualStart, right edge tracks now
    var live=document.createElement('div'); live.className='tl-live';
    live.style.display='block'; live.style.background=job.color;
    var liveEndH=Math.min(nowH, maxEnd+1);
    var lStart=pct(actualStartH), lEnd=pct(Math.max(actualStartH, liveEndH));
    live.style.left=lStart;
    live.style.width='max(7px, calc('+lEnd+' - '+lStart+'))';
    live.style.top='6px';
    card.appendChild(live);
  });

  // Triangle cursor
  var tri=document.createElement('div'); tri.className='tl-tri'; tri.style.left=pctN(nowH).toFixed(3)+'%'; card.appendChild(tri);
  var triPx=document.createElement('div'); triPx.className='tl-tri-px'; triPx.style.left=pctN(nowH).toFixed(3)+'%'; triPx.innerHTML='<svg width="14" height="6" viewBox="0 0 14 6" fill="none" shape-rendering="crispEdges"><rect x="6" y="0" width="2" height="2" fill="currentColor"/><rect x="4" y="2" width="6" height="2" fill="currentColor"/><rect x="2" y="4" width="10" height="2" fill="currentColor"/></svg>'; card.appendChild(triPx);
  return card;
}

function renderJobs() {
  const app = document.getElementById('mainApp'); app.innerHTML = '';
  if (appSettings.showJobCards) {
    if (jobs.length === 0) {
      const placeholder = document.createElement('div'); placeholder.className = 'label-card';
      placeholder.textContent = 'Tap New to Add a Job'; placeholder.style.cursor = 'pointer';
      placeholder.onclick = () => openWindow('newWindow'); app.appendChild(placeholder);
    } else {
      if (appSettings.showTimelineCard !== false) app.appendChild(buildTimelineCard());
      const lbl = document.createElement('div'); lbl.className = 'label-card';
      lbl.textContent = 'Time Until Next Shift'; app.appendChild(lbl);
    }
  }
  if (appSettings.showJobCards) jobs.forEach(job => {
    const countdown = getNextShiftCountdown(job); const card = document.createElement('div'); card.className = 'job-card';
    const timerState = getTimerState(job);
    const bottomText = timerState === 'running' ? (getElapsedStr(job) || '00h 00m') : (countdown || '-- h -- m');
    const showTimer = appSettings.showTimerSections !== false; const showGraph = appSettings.showMiniGraph !== false;
    card.innerHTML =
      `<div class="jc-normal">` +
      (showGraph ? `<div class="job-card-left" id="graph-${job.id}" style="display:flex;flex-direction:row;align-items:flex-end;padding:3px 4px;gap:1px;"></div>` : '') +
      `<div class="job-card-center"><div class="job-card-top" style="background:${job.color}"><span class="job-card-title">${job.title}</span></div><div class="job-card-bottom">${bottomText}</div></div>` +
      (showTimer ? `<div class="job-card-right" data-timer-job="${job.id}" onclick="timerTap(${job.id}, event, this)">${timerIcon(timerState, job)}</div>` : '') +
      `</div>` +
      (showGraph ? `<div class="jc-expanded" id="exp-${job.id}"></div>` : '');
    if (showGraph) {
      const graphEl = card.querySelector('#graph-' + job.id);
      if (graphEl) {
        buildMiniGraph(job, graphEl);
        const expEl = card.querySelector('#exp-' + job.id);
        if (expEl) buildExpandedGraph(job, expEl);
        graphEl.addEventListener('click', e => { e.stopPropagation(); card.classList.toggle('graph-expanded'); });
      }
    }
    card.onclick = e => {
      if (card.classList.contains('graph-expanded')) { card.classList.remove('graph-expanded'); return; }
      openJobWindow(job);
    };
    app.appendChild(card);
  });
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  if (appSettings.drawnBorders) requestAnimationFrame(function(){ if(typeof applyDrawnBorders==='function') applyDrawnBorders(); });
  else if (typeof clearDrawnBorders === 'function') clearDrawnBorders();
}

function refreshSwatchCards() {
  const nw = document.getElementById('nwColorCard'); const js = document.getElementById('jsColorCard');
  if (nw) nw.innerHTML = buildSwatches('nwPickColor'); if (js) js.innerHTML = buildSwatches('jsPickColor');
}

function openJobWindow(job) {
  for(const k in _dcExpanded)delete _dcExpanded[k];  refreshSwatchCards(); activeJobId = job.id; activeFirstDow = job.firstDow !== undefined ? job.firstDow : 1;
  const titleEl = document.getElementById('jobWindowTitle'); titleEl.textContent = job.title;
  titleEl.style.cssText = `background:${job.color};color:var(--text-light);font-size:var(--text-md);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);`;
  window._currentJob = job;
  var _savedView = job.defaultView || 'daycard';
  if(_savedView==='grid'){
    var _gv=document.getElementById('gridView');if(_gv){_gv.style.display='flex';}
    var _dc=document.getElementById('dayCards');if(_dc){_dc.style.display='none';}
    var _wf=document.getElementById('weekFilterCard');if(_wf){_wf.style.display='none';}
    var _hf=document.getElementById('hoursCard');if(_hf){_hf.style.display='none';}
    var _dr=document.getElementById('dateRangeCard');
    var _tc=document.getElementById('totalsCard');if(_tc){_tc.style.display='none';}
    var _b1=document.getElementById('btnViewDayCard');if(_b1){_b1.classList.remove('active');}
    var _b2=document.getElementById('btnViewGrid');if(_b2){_b2.classList.add('active');}
    requestAnimationFrame(function(){buildGridView(job);if(_dr){_dr.style.display='';var _j=job;var _fdow=(_j.firstDow!==undefined)?_j.firstDow:1;var _td=new Date();_td.setHours(0,0,0,0);var _db=(_td.getDay()-_fdow+7)%7+7;var _st=new Date(_td.getTime()-_db*86400000);var _en=new Date(_st.getTime()+20*86400000);var _mo=typeof MONTHS!=='undefined'?MONTHS:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];_dr.textContent=_mo[_st.getMonth()]+' '+_st.getDate()+' - '+_mo[_en.getMonth()]+' '+_en.getDate();}});
  } else {
    var _gv=document.getElementById('gridView');if(_gv){_gv.style.display='none';}
    var _dc=document.getElementById('dayCards');if(_dc){_dc.style.display='flex';}
    var _wf=document.getElementById('weekFilterCard');if(_wf){_wf.style.display='';}
    var _hf=document.getElementById('hoursCard');if(_hf){_hf.style.display='';}
    var _dr=document.getElementById('dateRangeCard');if(_dr){_dr.style.display='';}
    var _tc=document.getElementById('totalsCard');if(_tc){_tc.style.display='';}
    var _b1=document.getElementById('btnViewDayCard');if(_b1){_b1.classList.add('active');}
    var _b2=document.getElementById('btnViewGrid');if(_b2){_b2.classList.remove('active');}
  }
  activeWeek = 'this'; activeHours = 'scheduled'; updateWeekUI();
  const jw = document.getElementById('jobWindow');
  jw.style.opacity = '0';
  jw.classList.add('open');
  injectWindowFx('jobWindow');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      jw.style.transition = 'opacity 0.6s ease';
      jw.style.opacity = '1';
      setTimeout(() => { jw.style.transition = ''; }, 700);
    });
  });
  const hoursCard = document.getElementById('hoursCard');
  if(appSettings.drawnBorders&&typeof DrawnBorders!=='undefined')
    requestAnimationFrame(function(){DrawnBorders.applyJobWindow();});
}

function openJobSettings() {
  const job = jobs.find(j => j.id === activeJobId); if (!job) return;
  refreshSwatchCards();
  document.getElementById('jsTitleInput').value = job.title;
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => { s.classList.toggle('selected', s.dataset.color === job.color); });
  jsSelectedColor = job.color;
  const savedDow = job.firstDow !== undefined ? job.firstDow : 1;
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => {
    const isActive = parseInt(b.dataset.dow) === savedDow;
    b.classList.toggle('active', isActive); b.style.background = isActive ? job.color : ''; b.style.color = isActive ? 'var(--text-light)' : '';
  });
  // Sync per-job toggles
  ['showSecondShift','showGridLegend'].forEach(function(k){
    var el=document.getElementById('toggleJs_'+k);
    if(el) el.classList.toggle('active', job[k]!==false);
  });
  document.getElementById('deleteCard').classList.remove('confirm'); document.getElementById('deleteCard').textContent = 'Delete Job';
  openWindow('jobSettingsWindow');
  requestAnimationFrame(() => {
    const titleCard = document.getElementById('jobSettingsWindow') && document.getElementById('jobSettingsWindow').querySelector('.nw-title-card');
    if (titleCard && job) { titleCard.style.background = job.color; }
  });
}
function jsUpdateTitle() {
  const job = jobs.find(j => j.id === activeJobId); if (!job) return;
  const val = document.getElementById('jsTitleInput').value.trim(); if (!val) return;
  job.title = val; lsSet('sch_jobs', jobs); document.getElementById('jobWindowTitle').textContent = val; renderJobs();
}
function jsPickColor(el) {
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected'); jsSelectedColor = el.dataset.color;
  const job = jobs.find(j => j.id === activeJobId);
  if (job) { job.color = jsSelectedColor; lsSet('sch_jobs', jobs); renderJobs(); const titleEl = document.getElementById('jobWindowTitle'); if (titleEl) titleEl.style.background = jsSelectedColor; }
  const titleCard = document.getElementById('jobSettingsWindow') && document.getElementById('jobSettingsWindow').querySelector('.nw-title-card');
  if (titleCard && jsSelectedColor) { titleCard.style.background = jsSelectedColor;; }
}
function jsPickDow(el) {
  const job = jobs.find(j => j.id === activeJobId);
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => { b.classList.remove('active'); b.style.background = ''; b.style.color = ''; });
  el.classList.add('active'); if (job) { el.style.background = job.color; el.style.color = 'var(--text-mid)'; }
  activeFirstDow = parseInt(el.dataset.dow); if (job) { job.firstDow = activeFirstDow; lsSet('sch_jobs', jobs); } updateDateRange();
}
let deleteConfirmPending = false;
function jsDeleteJob() {
  const card = document.getElementById('deleteCard');
  if (!deleteConfirmPending) {
    deleteConfirmPending = true; card.classList.add('confirm'); card.textContent = 'Tap Again to Confirm Delete';
    setTimeout(() => { deleteConfirmPending = false; card.classList.remove('confirm'); card.textContent = 'Delete Job'; }, 3000); return;
  }
  jobs = jobs.filter(j => j.id !== activeJobId); lsSet('sch_jobs', jobs); renderJobs();
  closeWindow('jobSettingsWindow'); closeWindow('jobWindow'); deleteConfirmPending = false;
}

function setWeek(w) { activeWeek = w; activeHours = w === 'prev' ? 'worked' : 'scheduled'; updateWeekUI(); }
function setHoursType(t) { if (activeWeek === 'next') return; activeHours = t; updateHoursUI(); }
function updateWeekUI() {
  ['fwPrev','fwThis','fwNext'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById({ prev:'fwPrev', this:'fwThis', next:'fwNext' }[activeWeek]).classList.add('active');
  const fhWorked = document.getElementById('fhWorked');
  if (activeWeek === 'next') {
    fhWorked.style.display = 'none';
  } else {
    fhWorked.style.display = '';
  }
  updateHoursUI(); updateDateRange();
}
function updateHoursUI() {
  document.getElementById('fhScheduled').classList.toggle('active', activeHours === 'scheduled');
  document.getElementById('fhWorked').classList.toggle('active', activeHours === 'worked');
  renderDayCards();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getWeekRange(offset) {
  const now = new Date(); const diff = (now.getDay() - activeFirstDow + 7) % 7;
  const start = new Date(now); start.setDate(now.getDate() - diff + offset * 7); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate() + 6); return { mon: start, sun: end };
}
function fmtDate(d) { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function updateDateRange() {
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon, sun } = getWeekRange(offset);
  document.getElementById('dateRangeCard').textContent = `${fmtDate(mon)}  -  ${fmtDate(sun)}`;
  renderDayCards();
}

function parseTimeToMins(t) {
  if (!t || t === 'OFF' || t === 'NONE') return null;
  const m = t.match(/^(\d{2}):(\d{2}) (AM|PM)$/); if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]);
  if (m[3] === 'AM' && h === 12) h = 0; if (m[3] === 'PM' && h !== 12) h += 12;
  return h * 60 + min;
}
function calcDuration(s, e) {
  const sm = parseTimeToMins(s), em = parseTimeToMins(e); if (sm === null || em === null) return '00.00';
  let diff = em - sm; if (diff <= 0) diff += 24 * 60;
  return `${String(Math.floor(diff/60)).padStart(2,'0')}.${String(Math.round(diff%60/60*100)).padStart(2,'00')}`;
}

function schedKey(mode) { return mode === 'worked' ? 'worked' : 'schedule'; }
function getSchedObj(job, mode) { return job && job[schedKey(mode)]; }
function ensureSchedObj(job, mode, dateKey) {
  const k = schedKey(mode); if (!job[k]) job[k] = {}; if (!job[k][dateKey]) job[k][dateKey] = {}; return job[k][dateKey];
}

function testNotification(){
  const status=document.getElementById('notifStatus');
  if(!('Notification' in window)){status.textContent='Notifications not supported';status.style.color='var(--color-1)';return;}
  if(Notification.permission==='granted'){fireTestNotification();}
  else if(Notification.permission==='denied'){status.textContent='Notifications blocked - enable in browser settings';status.style.color='var(--color-1)';}
  else{Notification.requestPermission().then(perm=>{if(perm==='granted')fireTestNotification();else{status.textContent='Permission denied';status.style.color='var(--color-1)';}});}
}
function fireTestNotification(){
  const status=document.getElementById('notifStatus');
  if('serviceWorker' in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>{reg.showNotification('Shift Happens',{body:'Your shift starts in 30 minutes',icon:'icon-192.png',badge:'icon-192.png',tag:'shift-test',vibrate:[200,100,200]});status.textContent='Notification sent!';status.style.color='var(--primary)';});}
  else{new Notification('Shift Happens',{body:'Your shift starts in 30 minutes',icon:'icon-192.png'});status.textContent='Notification sent!';status.style.color='var(--primary)';}
}

function toggleTlDropdown() {
  var body = document.getElementById('tlExpandBody');
  var btn  = document.getElementById('tlExpandBtn');
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
}

function toggleQsDropdown() {
  var body = document.getElementById('qsExpandBody');
  var btn  = document.getElementById('qsExpandBtn');
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
}

function qsPickColor(el) {
  var col = el.getAttribute('data-var');
  if (!col) return;
  appSettings.qsColor = col;
  lsSet('sch_settings', appSettings);
  var body = document.getElementById('qsExpandBody');
  if (body) {
    var hex = getComputedStyle(document.documentElement).getPropertyValue(col).trim();
    body.querySelectorAll('.dd-h-swatch,.nw-swatch').forEach(function(s){ s.classList.toggle('selected', s.getAttribute('data-var')===col); });
    body.querySelectorAll('.dd-num-cell').forEach(function(c){ if(c.classList.contains('selected')){ c.style.background=hex; } });
  }
  if (typeof renderQuickSchedule === 'function') { buildQuickSchedule(); renderQuickSchedule(); }
}

function qsPickDays(el, d) {
  appSettings.qsDays = d;
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderQuickSchedule();
}

function toggleHistDropdown() {
  var body = document.getElementById('histExpandBody');
  var btn  = document.getElementById('histExpandBtn');
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
}

function histPickColor(el) {
  var col = el.getAttribute('data-var');
  if (!col) return;
  appSettings.histColor = col;
  lsSet('sch_settings', appSettings);
  var body = document.getElementById('histExpandBody');
  if (body) {
    var hex = getComputedStyle(document.documentElement).getPropertyValue(col).trim();
    // Update swatch selected state
    body.querySelectorAll('.dd-h-swatch').forEach(function(s){ s.classList.toggle('selected', s.getAttribute('data-var')===col); });
    // Update weeks picker selected color
    var hw = appSettings.histWeeks !== undefined ? appSettings.histWeeks : 10;
    body.querySelectorAll('.dd-num-cell').forEach(function(c,i){ if(c.classList.contains('selected')){ c.style.background=hex; } });
  }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
}

function histPickWeeks(n) {
  appSettings.histWeeks = n;
  lsSet('sch_settings', appSettings);
  // Update selected state directly in DOM -- no slot rebuild needed
  var body = document.getElementById('histExpandBody');
  if (body) {
    var cells = body.querySelectorAll('.dd-num-cell');
    var histCol = (appSettings.histColor||'').startsWith('--')
      ? getComputedStyle(document.documentElement).getPropertyValue(appSettings.histColor).trim()
      : (getSwatchColors()[5]);
    cells.forEach(function(el,i){ var isOn=i===n; el.classList.toggle('selected',isOn); el.style.background=isOn?histCol:''; el.style.color=isOn?'#fff':''; });
  }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
}

function toggleMgDropdown() {
  var body = document.getElementById('mgExpandBody');
  var btn  = document.getElementById('mgExpandBtn');
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
}

function mgPickDays(n) {
  appSettings.miniGraphDays = n;
  lsSet('sch_settings', appSettings);
  var body = document.getElementById('mgExpandBody');
  if (body) {
    body.querySelectorAll('.dd-num-cell').forEach(function(c,i){
      var d=[3,5,7][i];
      var isOn=d===n;
      c.classList.toggle('selected',isOn);
      c.style.background=isOn?'var(--primary)':'';
      c.style.color=isOn?'#fff':'';
    });
  }
  renderJobs();
}

function setTimelineNight(mode) {
  appSettings.timelineNightMode = mode;
  lsSet('sch_settings', appSettings);
  var modes = ['off','6pm6am','12pm12am'];
  // Update all night mode pickers (timeline + QS dropdowns)
  document.querySelectorAll('.dd-num-card .dd-num-cell').forEach(function(c,i){});
  [document.getElementById('tlExpandBody'), document.getElementById('qsExpandBody')].forEach(function(body){
    if (!body) return;
    var cells = body.querySelectorAll('.dd-num-card:last-of-type .dd-num-cell');
    if (!cells.length) cells = body.querySelectorAll('.dd-num-cell');
    cells.forEach(function(c,i){ var isOn=modes[i]===mode; c.classList.toggle('selected',isOn); c.style.background=isOn?'var(--primary)':''; c.style.color=isOn?'#fff':''; });
  });
  renderJobs();
  if (typeof renderQuickSchedule === 'function') { buildQuickSchedule(); renderQuickSchedule(); }
}
