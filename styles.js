(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `

@font-face {
  font-family: 'Overseer';
  src: url('./fonts/overseer.ttf') format('truetype');
  font-display: swap;
}
@font-face {
  font-family: 'Nunito';
  src: url('./fonts/Nunito-Variable.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'Pixelify';
  src: url('./fonts/Pixelify-Variable.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'Orbitron';
  src: url('./fonts/Orbitron-Variable.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'Simpsons';
  src: url('./fonts/Simpsons.ttf');
  font-display: swap;
}
@font-face {
  font-family: 'Limelight';
  src: url('./fonts/Limelight.ttf') format('truetype');
  font-weight: 100 900;
  font-display: swap;
}

/* -------------------------------------------------------
   RESET
------------------------------------------------------- */
*, *::before, *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
}
button, input { outline: none; -webkit-tap-highlight-color: transparent; }


/* -------------------------------------------------------
   DESIGN TOKENS
------------------------------------------------------- */
:root {

  /* -- Spacing & Geometry -- */
  --margin:        4px;
  --card-height:   45px;
  --drop-height:   32px;
  --border-width:  3px;
  --border-color:  #000;
  --radius:        8px;
  --day-sq:        calc(var(--card-height) / 2);
  --job-half:      calc((var(--card-height) - var(--border-width)) / 2);

  /* -- Backgrounds -- */
  --bg-1:   #233040;  /* page background */
  --bg-2:   #4d5f72;  /* card / panel background */
  --bg-3:   #1e2d3f;  /* header / dark panel */
  --bg-4:   #ffffff;  /* white surfaces - label cards, day squares, QS shift bars */

  /* -- Text -- */
  /* -- Text Colors -- */
  --text-light: #ffffff;   /* light text - on dark backgrounds */
  --text-dark:  #000000;   /* dark text - on light/bg-4 backgrounds */
  --text-mid:   #b4bcc8;   /* mid text - inactive, secondary labels */
  --color-10:   var(--text-light);   /* alias - kept for legacy themes */
  --muted:     var(--text-light);  /* alias - kept for backwards compat */  /* alias - kept for backwards compat */
  --modal-btn: #738494;  /* number pad button background */

  /* -- Semantic Colors -- */
  --color-1:    #e07878;  /* red - error / delete / timer running */
  --primary:    #48a971;  /* green - main action, confirm, success */
  --secondary:  #5A8DB8;  /* blue - secondary action, active filter tabs, off days */
  --accent:     #8a7ca8;  /* purple - quick schedule headers, accent */

  /* -- Job Color Swatches (color picker) -- */
  --swatch-1:   #C85A5A;  /* red     */
  --swatch-2:   #C7824A;  /* orange  */
  --swatch-3:   #B8B85A;  /* gold    */
  --swatch-4:   #48a971;  /* green   */
  --swatch-5:   #5AB8A8;  /* teal    */
  --swatch-6:   #5A8DB8;  /* blue    */
  --swatch-7:   #8a7ca8;  /* purple  */
  --swatch-8:   #B87390;  /* brown   */
  --swatch-9:   #a06090;  /* rose    */
  --swatch-10:  #7a9070;  /* sage    */

  /* -- Typography -- */
  --text-xs:   10px;
  --text-sm:   12px;
  --text-md:   14px;
  --text-lg:   38px;
  --fw-semi:   600;
  --fw-bold:   800;
  --fw-heavy:  900;

  /* -- Letter Spacing -- */
  --ls-tight:   0.02em;
  --ls-normal:  0.04em;
  --ls-wide:    0.08em;
  --ls-wider:   0.1em;
  --ls-widest:  0.12em;

  /* -- Quick Schedule -- */
  --qs-row:     18px;  /* timeline row and axis height */
  --qs-hdr:     18px;  /* day header height */
  --qs-job-bdr: var(--border-width);  /* job card border width */
  --qs-grid:    rgba(255,255,255,0.18);  /* vertical grid line color */
}


/* -------------------------------------------------------
   BASE
------------------------------------------------------- */
html, body {
  --fx-over-active: 0;
  width: 100%; min-height: 100vh;
  background: var(--bg-1); color: var(--text-light);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: var(--text-md);
}
body {
  --fx-over-active: 0;
  display: flex; flex-direction: column; align-items: center;
  padding: calc(var(--card-height) + var(--margin)) var(--margin) var(--margin);
}


/* -------------------------------------------------------
   MAIN HEADER
------------------------------------------------------- */
.header-tab {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--card-height);
  display: flex;
  border-bottom: var(--border-width) solid var(--border-color);
  background: var(--bg-3);
  z-index: 50;
}
.header-action-btn {
  flex: 1;
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  color: var(--text-mid);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.header-action-btn:last-child { border-right: none; }


/* -------------------------------------------------------
   APP SHELL
------------------------------------------------------- */
.app {
  width: 100%; max-width: 540px;
  display: flex; flex-direction: column; gap: var(--margin);
  position: relative; z-index: 2;
}
/* when overlay is 'over', elevate text and borders above fx-fore */
body.overlay-over .app { z-index: 10003; }
body.overlay-over .data-window { z-index: 10203; }
body.overlay-over .header-tab { z-index: 10100; }


/* -------------------------------------------------------
   LABEL CARD  (white section header)
------------------------------------------------------- */
.label-card {
  height: calc(var(--job-half) + var(--border-width) * 2);
  display: flex; align-items: center; justify-content: center;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--bg-4);
  font-size: var(--text-sm); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-dark);
}


/* -------------------------------------------------------
   JOB CARD  (main window)
------------------------------------------------------- */
.job-card {
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  display: flex; flex-direction: row; align-items: stretch;
  cursor: pointer; position: relative; height: var(--card-height);
}
.jc-normal {
  display: flex; align-items: stretch; width: 100%;
  transition: opacity 0.18s ease;
}
.job-card.graph-expanded .jc-normal { opacity: 0; pointer-events: none; }
.jc-expanded {
  position: absolute; inset: 0;
  display: flex; flex-direction: row; align-items: stretch;
  background: var(--bg-2);
  opacity: 0; pointer-events: none;
  transition: opacity 0.18s ease;
}
.job-card.graph-expanded .jc-expanded { opacity: 1; pointer-events: all; }
.ex-week { flex: 1; display: flex; flex-direction: row; align-items: flex-end; gap: 3px; padding: 5px 5px 3px; }
.ex-week + .ex-week { border-left: var(--border-width) solid var(--border-color); }
.ex-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; min-width: 0; }
.ex-bar { width: 100%; border-radius: 99px 99px 0 0; }
.ex-dot { width: 100%; aspect-ratio: 1; border-radius: 50%; margin-bottom: 1px; }
.job-card-left {
  width: var(--card-height); flex-shrink: 0;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
}
.job-card-center {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
}
.job-card-right {
  width: var(--card-height); flex-shrink: 0;
  background: var(--bg-2);
  border-left: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
}
.job-card-top {
  height: var(--job-half);
  display: flex; align-items: center; justify-content: center;
}
.job-card-title {
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-light);
}
.job-card-bottom {
  height: calc(var(--job-half) - var(--border-width));
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2);
  border-top: var(--border-width) solid var(--border-color);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide);
  color: var(--text-mid);
}

/* -- Timer button - right section states -- */
.job-card-arrow { display: flex; align-items: center; justify-content: center; }

@keyframes tmAppear {
  from { opacity: 0; transform: scale(0.3); }
  to   { opacity: 1; transform: scale(1); }
}
svg[data-tm] {
  animation: tmAppear 0.3s ease forwards;
}


.job-card-pause { display: flex; gap: 4px; align-items: center; }
.job-card-pause-bar {
  width: 4px; height: 14px;
  background: var(--color-1);
  border-radius: 2px;
  animation: timerBlink 1.4s ease-in-out infinite;
}
.job-card-pause-bar:nth-child(2) { animation-delay: 0.2s; }

.job-card-check {
  width: 14px; height: 10px;
  border-left: 3px solid var(--primary);
  border-bottom: 3px solid var(--primary);
  border-radius: 1px;
  transform: rotate(-45deg) translate(2px, -2px);
}

body.pxl-font .job-card-pause { gap: 3px; }
body.pxl-font .job-card-check { display: none; }
body.pxl-font .job-card-pause-bar { width: 5px; height: 14px; border-radius: 0; }

@keyframes timerBlink {
  0%, 100% { filter: brightness(1); }
  50%       { filter: brightness(0.4); }
}


/* -------------------------------------------------------
   DATA WINDOW  (full-screen overlay panel)
------------------------------------------------------- */
.data-window {
  display: none; position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-1);
  z-index: 100; flex-direction: column;
}
.data-window.open { display: flex; }
.data-window > *:not(.win-fx-back):not(.win-fx-fore) { position: relative; z-index: 1; }

.data-window-header {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: stretch; position: relative;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
}
.data-window-back {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  color: var(--text-mid); cursor: pointer; flex-shrink: 0; z-index: 1;
}
.data-window-back:active { background: var(--bg-2); color: var(--text-light); }

.data-window-title {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-mid); pointer-events: none;
}
.data-window-settings {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-left: var(--border-width) solid var(--border-color);
  margin-left: auto;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; z-index: 1;
}
.data-window-settings:active { background: var(--bg-2); }

.data-body {
  --fx-over-active: 0;
  flex: 1; overflow-y: auto;
  padding: var(--margin);
  display: flex; flex-direction: column; gap: var(--margin);
}


/* -------------------------------------------------------
   MODAL OVERLAY  (blur backdrop)
------------------------------------------------------- */
.modal-blur-overlay {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: center; justify-content: center;
  padding: var(--margin);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(0,0,0,0.3);
}


/* -------------------------------------------------------
   FORM ELEMENTS
------------------------------------------------------- */

/* Title input */
.nw-title-card {
  position: relative;
  height: var(--card-height);
  background: var(--bg-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.nw-title-input {
  width: 100%; height: 100%;
  background: var(--bg-2); border: none;
  color: var(--text-light);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  text-align: center; padding: 0 12px;
}
.nw-title-input::placeholder { color: var(--text-mid); }

/* Color swatch picker */
.nw-color-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.nw-swatch {
  flex: 1; border: none; cursor: pointer;
  border-right: var(--border-width) solid var(--border-color);
  position: relative;
}
.nw-swatch:last-child { border-right: none; }
.nw-swatch:active { filter: none; }
.nw-swatch::after {
  content: '';
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--text-mid);
  transition: transform 0.12s;
}
.nw-swatch.selected::after { transform: translate(-50%, -50%) scale(1); }

/* New/edit window footer */
.nw-footer {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-3);
  border-top: var(--border-width) solid var(--border-color);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-mid); cursor: default; user-select: none;
  transition: background 0.15s, color 0.15s;
}
.nw-footer.ready { background: var(--primary); color: var(--text-light); cursor: pointer; }
.nw-footer.ready:active { filter: none; }

/* Day of week picker */
.dow-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.dow-btn {
  flex: 1; border: none; cursor: pointer;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
  color: var(--text-mid);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  display: flex; align-items: center; justify-content: center;
}
.dow-btn:last-child { border-right: none; }
.dow-btn.active { color: var(--text-light); }  /* background set inline via job color */
.dow-btn:active { filter: none; }


/* -------------------------------------------------------
   FILTER / TAB CARDS
------------------------------------------------------- */
.filter-card {
  position: relative;
  height: var(--card-height);
  background: var(--bg-2);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.filter-btn {
  position: relative;
  flex: 1; border: none; cursor: pointer;
  background: var(--bg-2);
  border-left: var(--border-width) solid var(--border-color);
  color: var(--text-mid);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, color 0.1s;
}
.filter-btn:first-child { border-left: none; }
.filter-btn.active          { background: var(--primary);   color: var(--text-light); }
.filter-btn.active.secondary { background: var(--secondary);  color: var(--text-light); }
.filter-btn:active { filter: none; }


/* -------------------------------------------------------
   JOB WINDOW - DAY CARDS
------------------------------------------------------- */
.date-range-card {
  position: relative; z-index: 0;
  height: var(--card-height);
  display: flex; align-items: center; justify-content: center;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--accent);
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-light);
}
@keyframes crt-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.day-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--bg-2);
}
.day-card-plus {
  flex-shrink: 0;
  width: var(--card-height);
  height: var(--card-height);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  background: var(--secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 900; color: var(--text-light);
  cursor: pointer;
}
.dc-row {
  overflow: hidden;
  height: var(--card-height);
}
.day-letter {
  position: relative;
  width: var(--day-sq); min-width: var(--day-sq); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-4);
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-dark);
}
.day-date {
  position: relative;
  width: var(--day-sq); min-width: var(--day-sq); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-4);
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal);
  color: var(--text-dark);
}
.day-body {
  --fx-over-active: 0;
  flex: 1; display: flex; align-items: stretch;
  background: var(--bg-2);
}
.day-body-half {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); color: var(--text-mid);
  border-right: var(--border-width) solid var(--border-color);
}
.day-body-half:last-child { border-right: none; }
.day-half-off {
  background: var(--secondary) !important;  /* OFF day - blue */
  color: var(--text-light) !important;
}
.day-hours {
  position: relative;
  width: calc(var(--day-sq) * 2 + var(--border-width));
  min-width: calc(var(--day-sq) * 2 + var(--border-width));
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-4);
  border-left: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); color: var(--text-dark);
}
.day-sq-today {
  background: var(--primary) !important;  /* today highlight - dark green */
  color: var(--text-light) !important;
}


/* -------------------------------------------------------
   TOTALS CARD
------------------------------------------------------- */
.totals-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.totals-label {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: var(--secondary);
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-light);
}
.totals-value {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--primary);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-light); gap: 1px;
}
.totals-h { font-size: var(--text-sm); font-weight: var(--fw-bold); letter-spacing: var(--ls-wide); text-transform: uppercase; line-height: 1.3; }
.totals-m { font-size: var(--text-sm); font-weight: var(--fw-bold); letter-spacing: var(--ls-wide); text-transform: uppercase; line-height: 1.3; }


/* -------------------------------------------------------
   ACTION CARDS  (delete / clear)
------------------------------------------------------- */
.delete-card {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-light); cursor: pointer; user-select: none;
}
.delete-card:active { filter: none; }
.delete-card.confirm { background: #fff; color: var(--color-1); }

.clear-card {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-light); cursor: pointer; user-select: none; flex-shrink: 0;
}
.clear-card:active { filter: none; }
.clear-card.confirm { background: #fff; color: var(--color-1); }
.clear-card-wrap { padding: var(--margin); flex-shrink: 0; }


/* -------------------------------------------------------
   SCHEDULE MODAL
------------------------------------------------------- */
.sched-modal-overlay {
  display: none; position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
  z-index: 10500;
  align-items: center; justify-content: center;
  padding: 15px; overflow-y: auto;
}
.sched-modal-overlay.open { display: flex; }
.sched-modal {
  width: 100%; height: auto;
  background: var(--bg-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  display: flex; flex-direction: column; overflow: hidden;
}
.sched-modal-header {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: stretch; position: relative;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
}
.sched-modal-back {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  color: var(--text-mid); cursor: pointer; flex-shrink: 0; z-index: 1;
}
.sched-modal-back:active { background: var(--bg-2); color: var(--text-light); }
.sched-modal-title {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-mid); pointer-events: none;
}
.sched-modal-body {
  --fx-over-active: 0;
  padding: var(--margin);
  display: flex; flex-direction: column; gap: var(--margin);
}


/* -------------------------------------------------------
   TIME PICKER
------------------------------------------------------- */
.tp-wrap { display: flex; flex-direction: column; gap: var(--margin); padding: var(--margin); }

.tp-display {
  background: var(--bg-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-lg); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wide); color: var(--text-light);
  flex-shrink: 0; height: 72px;
}
.tp-display.tp-special { font-size: var(--text-md); color: var(--text-mid); }

.tp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, var(--card-height));
  gap: var(--margin);
}
.tp-btn {
  background: var(--modal-btn);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--text-light);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tp-btn:active { filter: none; }
.tp-btn.tp-red    { background: var(--color-1); }
.tp-btn.tp-blue   { background: var(--secondary); font-size: var(--text-sm); letter-spacing: var(--ls-wide); }
.tp-btn.tp-purple { background: var(--accent);    font-size: var(--text-sm); letter-spacing: var(--ls-wide); }
.tp-btn.tp-ampm   { background: var(--modal-btn); font-size: var(--text-md); }
.tp-btn.tp-ampm.active { background: var(--primary); }

.tp-preset {
  background: var(--bg-3);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--text-light);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tp-preset:active { filter: none; }

.tp-footer { display: flex; gap: var(--margin); height: var(--card-height); flex-shrink: 0; }
.tp-cancel {
  flex: 1; background: var(--bg-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--text-mid);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase; cursor: pointer;
}
.tp-set {
  flex: 1; background: var(--primary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--text-light);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase; cursor: pointer;
}
.tp-cancel:active, .tp-set:active { filter: none; }


/* -------------------------------------------------------
   DOT GRID  (settings icon)
------------------------------------------------------- */
.dot-grid {
  display: grid;
  grid-template-columns: repeat(3, 5px);
  grid-template-rows: repeat(3, 5px);
  gap: 3px;
}
.dot { width: 5px; height: 5px; border-radius: 50%; background: var(--text-mid); }
.dot.green { background: var(--primary); }


/* -------------------------------------------------------
   QUICK SCHEDULE
------------------------------------------------------- */
.qs-wrap {
  width: 100%; max-width: 540px;
  display: flex; flex-direction: column; gap: var(--margin);
}
.qs-card {
  width: 100%;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  background: var(--accent);  /* card bg = accent purple (fills corner gaps) */
  display: flex; flex-direction: column;
}
.qs-day-hdr {
  /* height set inline per day - QS_HDR_PX or QS_ROW_PX for today */
  display: flex; align-items: center; justify-content: center;
  background: var(--accent);
  border-top: var(--border-width) solid var(--border-color);
  border-bottom: var(--border-width) solid var(--border-color);
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-light);
}
.qs-day-hdr.qs-first {
  border-top: none;
  border-radius: calc(var(--radius) - var(--border-width)) calc(var(--radius) - var(--border-width)) 0 0;
  overflow: hidden;
}
.qs-job-row {
  position: relative;
  height: var(--qs-row);
  background: var(--bg-2);
}
.qs-row-off {
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-mid);
}
.qs-grid-line {
  position: absolute;
  top: 0; bottom: 0; width: 1px;
  background: var(--qs-grid);
  transform: translateX(-50%);
  pointer-events: none;
}
.qs-job-card {
  position: absolute;
  top: 0; height: var(--qs-row);
  display: flex; align-items: center; justify-content: center;
  border: var(--qs-job-bdr) solid;
  border-radius: var(--radius);
  background: var(--bg-4);
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-dark);
  cursor: pointer; overflow: hidden;
  white-space: nowrap; text-overflow: ellipsis;
  padding: 0 4px; box-sizing: border-box;
}
.qs-job-card:active { filter: none; }
.qs-axis {
  position: relative;
  height: var(--qs-row);
  background: var(--bg-2);
  border-top: var(--border-width) solid var(--border-color);
  border-radius: 0 0 calc(var(--radius) - var(--border-width)) calc(var(--radius) - var(--border-width));
  overflow: hidden;
}
.qs-tick-label {
  position: absolute;
  top: 50%; transform: translate(-50%, -50%);
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal);
  color: var(--text-light);
}


/* -------------------------------------------------------
   SETTINGS TOGGLE CARD
------------------------------------------------------- */
.toggle-card {
  height: var(--card-height);
  display: flex; flex-direction: row; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--bg-2); cursor: pointer;
}
.toggle-check {
  width: var(--card-height); flex-shrink: 0;
  border-right: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-3); transition: background 0.15s;
}
.toggle-card.active .toggle-check { background: var(--primary); color: var(--text-light); }
.toggle-check svg { display: none; }
.toggle-check .ck-p { display: none; }
body.pxl-font .toggle-check .ck-s { display: none; }
body.pxl-font .toggle-check .ck-p { display: inline; }
.toggle-card.active .toggle-check svg { display: block; }
.toggle-content {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
}
.toggle-label {
  height: var(--job-half); flex-shrink: 0;
  display: flex; align-items: center; padding: 0 10px;
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-mid);
  border-bottom: var(--border-width) solid var(--border-color);
}
.toggle-blurb {
  flex: 1; display: flex; align-items: center; padding: 0 10px;
  font-size: var(--text-xs); font-weight: var(--fw-semi);
  color: var(--text-mid); line-height: 1.3;
}



/* -------------------------------------------------------
   THEME OVERLAYS
------------------------------------------------------- */

/* CRT scanline overlay */
body.theme-crt::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) 2px,
    rgba(0,0,0,0.25) 2px,
    rgba(0,0,0,0.25) 4px
  );
  animation: crtFlicker 0.15s infinite;
}
body.theme-crt { filter: brightness(0.9) contrast(1.1); }
@keyframes crtFlicker {
  0%   { opacity: 1; }
  92%  { opacity: 1; }
  93%  { opacity: 0.85; }
  94%  { opacity: 1; }
  98%  { opacity: 1; }
  99%  { opacity: 0.9; }
  100% { opacity: 1; }
}

/* Black & white */
body.theme-bw { filter: grayscale(1) contrast(1.1); }

/* Sepia */
body.theme-sepia { filter: sepia(0.85) contrast(1.05) brightness(0.95); }

/* Neon - high contrast glow */
body.theme-neon { filter: brightness(1.1) saturate(2) contrast(1.2); }
body.theme-neon::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: rgba(0,255,180,0.04);
  mix-blend-mode: screen;
}

/* Dusk - warm amber tint */
body.theme-dusk::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: rgba(255, 160, 40, 0.18);
  mix-blend-mode: multiply;
}
body.theme-dusk { filter: brightness(0.95) contrast(0.95) saturate(0.8); }


/* ------- THREE-WEEK GRID VIEW ------- */
.view-toggle-card { display:flex; height:var(--card-height); flex-shrink:0; border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; margin-bottom:var(--margin); }
.tw-card { border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; background:var(--border-color); display:flex; flex-direction:column; flex-shrink:0; gap:3px; }
.tw-row { display:flex; flex-direction:row; align-items:center; background:var(--bg-2); height:18px; }
.tw-day-lbl,.tw-date-lbl { width:var(--day-sq); min-width:var(--day-sq); flex-shrink:0; align-self:stretch; display:flex; align-items:center; justify-content:center; background:var(--bg-4); color:var(--text-dark); font-size:var(--text-xs); font-weight:var(--fw-bold); letter-spacing:var(--ls-wide); text-transform:uppercase; }
.tw-day-lbl { border-right:var(--border-width) solid var(--border-color); }
.tw-date-lbl { border-right:var(--border-width) solid var(--border-color); }
.tw-row.tw-today .tw-day-lbl,.tw-row.tw-today .tw-date-lbl { background:var(--primary); color:var(--text-light); }
.tw-timeline { flex:1; position:relative; align-self:stretch; }
.tw-gl { position:absolute; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.18); transform:translateX(-50%); pointer-events:none; }
.tw-shift { position:absolute; top:50%; transform:translateY(-50%); height:14px; border:var(--border-width) solid var(--border-color); border-radius:99px; }
.tw-off { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:var(--text-xs); font-weight:var(--fw-bold); letter-spacing:var(--ls-widest); text-transform:uppercase; color:var(--text-mid); }
.tw-hours { width:calc(var(--day-sq)*2 + var(--border-width)); min-width:calc(var(--day-sq)*2 + var(--border-width)); flex-shrink:0; align-self:stretch; display:flex; align-items:center; justify-content:center; background:var(--bg-4); color:var(--text-dark); border-left:var(--border-width) solid var(--border-color); font-size:var(--text-xs); font-weight:var(--fw-bold); letter-spacing:var(--ls-wide); }
.tw-row.tw-today .tw-hours { background:var(--primary); color:var(--text-light); }
.tw-axis { display:flex; flex-direction:row; background:var(--secondary); flex-shrink:0; }
.tw-axis-spacer { flex-shrink:0; }
.tw-axis-ticks { flex:1; position:relative; height:var(--qs-row); overflow:hidden; background:var(--secondary); }
.tw-tick { position:absolute; top:0; bottom:0; display:flex; align-items:center; transform:translateX(-50%); font-size:8px; font-weight:var(--fw-bold); color:var(--text-light); white-space:nowrap; user-select:none; z-index:3; }

/* ------- TIMELINE CARD ------- */
.tl-card { height:var(--card-height); border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; position:relative; background:var(--bg-2); flex-shrink:0; }
.tl-gl { position:absolute; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.12); transform:translateX(-50%); pointer-events:none; z-index:1; }
.tl-night { position:absolute; top:0; bottom:0; background:rgba(0,0,0,0.32); pointer-events:none; z-index:2; }
.tl-hour { position:absolute; bottom:10px; transform:translateX(-50%); font-size:9px; font-weight:800; color:var(--text-mid); z-index:4; pointer-events:none; }
.tl-elapsed { position:absolute; top:0; bottom:0; left:0; background:rgba(255,255,255,0.06); z-index:2; }
.tl-shift { position:absolute; top:3px; height:14px; border:var(--border-width) solid var(--border-color); border-radius:99px; z-index:5; }
.tl-ghost { position:absolute; top:3px; height:14px; border-radius:99px; z-index:6; border:2px dashed currentColor; opacity:0; pointer-events:none; }
.tl-ghost.show { opacity:0.28; }
.tl-ghost.expired { border-style:solid; opacity:1; background:transparent !important; }
.tl-ghost.expired::before { content:''; position:absolute; inset:0; border-radius:99px; background:currentColor; opacity:0.25; }
.tl-live { position:absolute; top:6px; height:8px; border:2px solid var(--border-color); border-radius:99px; z-index:7; display:none; pointer-events:none; }
.tl-tri { position:absolute; bottom:0; width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-bottom:9px solid var(--primary); transform:translateX(-50%); z-index:6; }
.tl-tri-px { position:absolute; bottom:0; transform:translateX(-50%); z-index:6; color:var(--primary); display:none; line-height:0; }
body.pxl-font .tl-tri { display:none; }
body.pxl-font .tl-tri-px { display:block; }
.tl-tri-px { position:absolute; bottom:0; transform:translateX(-50%); z-index:6; color:var(--primary); display:none; line-height:0; }
body.pxl-font .tl-tri { display:none; }
body.pxl-font .tl-tri-px { display:block; }

/* ------- SETTING EXPAND CARD (Pantry Pro style dropdown) ------- */
.setting-expand-card { border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; flex-shrink:0; }
.setting-expand-card > .toggle-card { border:none; border-radius:0; height:calc(var(--card-height) - var(--border-width) * 2); }
.setting-expand-body { background:var(--bg-3); overflow:hidden; max-height:0; display:flex; flex-direction:column; gap:var(--margin); padding:0; }
.setting-expand-body.open { max-height:800px; border-top:var(--border-width) solid var(--border-color); padding:var(--margin); }
.setting-expand-body .toggle-card { border:var(--border-width) solid var(--border-color); border-radius:var(--radius); }

/* ------- DROPDOWN TOGGLE CARD ------- */
.dd-toggle { height:calc(var(--card-height)/2); display:flex; flex-direction:row; align-items:stretch; border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; flex-shrink:0; background:var(--bg-1); cursor:pointer; }
.dd-toggle.active { background:var(--primary); }
.dd-toggle .toggle-check { width:calc(var(--card-height)/2); min-width:calc(var(--card-height)/2); flex-shrink:0; border-right:var(--border-width) solid var(--border-color); display:flex; align-items:center; justify-content:center; background:var(--bg-3); }
.dd-toggle.active .toggle-check { background:var(--primary); color:var(--text-light); }
.dd-toggle .toggle-check svg { display:none; }
.dd-toggle.active .toggle-check svg { display:block; }
.dd-toggle-blurb { flex:1; font-size:var(--text-xs); color:var(--text-mid); padding:0 var(--margin); display:flex; align-items:center; }
.dd-toggle.active .dd-toggle-blurb { color:var(--text-light); }

/* ------- TIMELINE EXPAND CHEVRON ------- */
.tl-expand-btn { width:var(--card-height); min-width:var(--card-height); flex-shrink:0; align-self:stretch; display:flex; align-items:center; justify-content:center; border-left:var(--border-width) solid var(--border-color); cursor:pointer; color:var(--text-mid); }
.tl-chev-l { transform-origin:17.5px 25px; transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); }
.tl-chev-r { transform-origin:32.5px 25px; transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); }
.tl-expand-btn.open .tl-chev-l,.tl-expand-btn.open .tl-chev-r { transform:rotate(180deg); }

/* ------- QS DROPDOWN HALF-HEIGHT CARDS ------- */
.dd-label-card { height:calc(var(--card-height) / 2); border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--bg-4); flex-shrink:0; font-size:var(--text-xs); font-weight:var(--fw-bold); letter-spacing:var(--ls-widest); text-transform:uppercase; color:var(--text-dark); }
.dd-h-color-card { height:calc(var(--card-height) / 2); border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; display:flex; align-items:stretch; flex-shrink:0; }
.dd-h-swatch { flex:1; border:none; border-right:var(--border-width) solid var(--border-color); cursor:pointer; position:relative; }
.dd-h-swatch:last-child { border-right:none; }
.dd-h-swatch::after { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(0); width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.9); transition:transform 0.12s; }
.dd-h-swatch.selected::after { transform:translate(-50%,-50%) scale(1); }
.dd-num-card { height:calc(var(--card-height) / 2); border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; display:flex; align-items:stretch; flex-shrink:0; }
.dd-num-cell { flex:1; border:none; border-right:var(--border-width) solid var(--border-color); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:var(--text-xs); font-weight:var(--fw-bold); color:var(--text-dark); background:var(--bg-4); }
.dd-num-cell:last-child { border-right:none; }
  `;
  document.head.appendChild(style);
})();
