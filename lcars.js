// ── LCARS Interface for Shift Happens ────────────────────────────────────────
// Renders the main window in LCARS style when appSettings.lcarsMode is true.
// All data read from the same jobs/schedule structures used by the regular UI.

(function () {

// ── CSS ──────────────────────────────────────────────────────────────────────
const LCARS_CSS = `
#lcarsRoot {
  display:none;
  flex-direction:column;
  width:100%;
}
#lcarsRoot.active { display:flex; }
#lcarsRoot .frame { margin-bottom:0.8rem; }

/* hide entire regular app when LCARS active */
body.lcars-mode { background:#000 !important; }
body.lcars-mode .header-tab {
  background:#000 !important;
  border:none !important;
  gap:5px !important;
  padding:0 5px 5px !important;
}
body.lcars-mode .header-action-btn {
  color:#000 !important;
  border:none !important;
  border-radius:0 0 1.2em 1.2em !important;
  font-family:'Antonio','Arial Narrow',sans-serif !important;
  font-weight:700 !important;
  text-transform:uppercase !important;
  letter-spacing:0.08em !important;
  flex:1 !important;
}
body.lcars-mode .header-action-btn:nth-child(1) { background:var(--ly,#ffce63) !important; }
body.lcars-mode .header-action-btn:nth-child(2) { background:var(--lpk,#ce9cce) !important; }
body.lcars-mode .header-action-btn:nth-child(3) { background:var(--lpu,#9c639c) !important; }
body.lcars-mode .header-action-btn:nth-child(4) { background:var(--lrd,#ce6363) !important; }

/* ---- JOB WINDOW (LCARS) ---- */
#lcarsJobWin {
  display:none; position:fixed; inset:0; z-index:10400;
  background:#000; overflow-y:auto; padding:0.8rem;
  font-family:'Antonio','Arial Narrow',sans-serif;
}
#lcarsJobWin.open { display:block; }
#lcarsJobWin, #lcarsJobWin * { font-family:'Antonio','Arial Narrow',sans-serif !important;
  -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none; }
/* header drop tabs */
#lcarsJobWin .lj-tabs { display:flex; gap:0.4rem; }
#lcarsJobWin .lj-tabs > div {
  height:4.5rem; cursor:pointer;
  display:flex; align-items:flex-end; justify-content:center;
  padding:0 0.6rem 0.4rem; white-space:nowrap; overflow:hidden;
  border-radius:0 0 1.2rem 1.2rem;
  font-size:1.3rem; font-weight:700; letter-spacing:0.05em;
  text-transform:uppercase; color:#000;
}
/* elbows (scoped copy of kit geometry) */
#lcarsJobWin .e, #lcarsJobWin .e-thin {
  --ext-h:0rem; --ext-v:0rem; position:relative; flex-shrink:0;
  height:calc(3rem + var(--ext-v)); min-height:3rem;
}
#lcarsJobWin .e { width:calc(9.5rem + var(--ext-h)); min-width:9.5rem; }
#lcarsJobWin .e-thin { width:calc(3.75rem + var(--ext-h)); min-width:3.75rem; }
#lcarsJobWin .e.fluid, #lcarsJobWin .e-thin.fluid { width:auto; }
#lcarsJobWin .e::after, #lcarsJobWin .e-thin::after {
  content:''; position:absolute; height:calc(100% - 1.5rem + 1px); background:#000;
}
#lcarsJobWin .e::after { width:calc(100% - 7.5rem + 1px); }
#lcarsJobWin .e-thin::after { width:calc(100% - 1.75rem + 1px); }
#lcarsJobWin .e.lb, #lcarsJobWin .e-thin.lb { border-top-left-radius:3.75rem; }
#lcarsJobWin .e.lb::after, #lcarsJobWin .e-thin.lb::after { right:-1px; top:1.5rem; border-top-left-radius:1.875rem; }
#lcarsJobWin .e.lt, #lcarsJobWin .e-thin.lt { border-bottom-left-radius:3.75rem; }
#lcarsJobWin .e.lt::after, #lcarsJobWin .e-thin.lt::after { right:-1px; bottom:1.5rem; border-bottom-left-radius:1.875rem; }
#lcarsJobWin .e.rb, #lcarsJobWin .e-thin.rb { border-top-right-radius:3.75rem; }
#lcarsJobWin .e.rb::after, #lcarsJobWin .e-thin.rb::after { left:-1px; top:1.5rem; border-top-right-radius:1.875rem; }
#lcarsJobWin .e.rt, #lcarsJobWin .e-thin.rt { border-bottom-right-radius:3.75rem; }
#lcarsJobWin .e.rt::after, #lcarsJobWin .e-thin.rt::after { left:-1px; bottom:1.5rem; border-bottom-right-radius:1.875rem; }
/* content frame (full-size elbows) */
#lcarsJobWin .lj-frame .e, #lcarsJobWin .lj-frame .e-thin {
  height:calc(4.5rem + var(--ext-v)); min-height:4.5rem;
}
#lcarsJobWin .hrow { display:flex; gap:0.4rem; align-items:flex-start; }
#lcarsJobWin .hrow.bottom { align-items:flex-end; }
#lcarsJobWin .hrow .seg { height:1.5rem; min-width:1.5rem; flex-shrink:0; }
#lcarsJobWin .mid { display:flex; gap:0.4rem; align-items:stretch; margin:0.4rem 0; }
#lcarsJobWin .pcol { display:flex; flex-direction:column; gap:0.4rem; width:7.5rem; flex-shrink:0; }
#lcarsJobWin .rcol { display:flex; flex-direction:column; gap:0.4rem; width:1.75rem; flex-shrink:0; }
#lcarsJobWin .pcol>*, #lcarsJobWin .rcol>* { width:100%; }
#lcarsJobWin .blk.fill { min-height:1.5rem; }
#lcarsJobWin .sq { height:3rem; flex-shrink:0; }
#lcarsJobWin .screen { flex:1; min-width:0; position:relative; padding:0.8rem 0.4rem; }
#lcarsJobWin .bar-title {
  height:1.5rem; display:flex; align-items:center; padding:0 0.8rem;
  background:#000; flex-shrink:1; min-width:0; overflow:hidden;
  font-size:1.9rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; line-height:1; white-space:nowrap;
}
/* filter pieces */
#lcarsJobWin .ftab {
  height:1.5rem; min-width:0; flex:1; cursor:pointer; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  padding:0 0.8rem; white-space:nowrap; overflow:hidden;
  font-size:1.25rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000;
  background:var(--lpu,#9c639c);
}
#lcarsJobWin .ftab.on { background:var(--ly,#ffce63); }
#lcarsJobWin .wksel { cursor:pointer; background:var(--lpu,#9c639c); }
#lcarsJobWin .wksel.on { background:var(--ly,#ffce63); }
#lcarsJobWin .elbl {
  position:absolute; top:0; left:0; right:0; height:1.5rem;
  display:flex; align-items:center;
  font-size:1.25rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; z-index:1; white-space:nowrap;
}
#lcarsJobWin .e.lb .elbl { justify-content:flex-end; padding-right:0.8rem; }
#lcarsJobWin .e-thin.rb .elbl { justify-content:flex-start; padding-left:0.8rem; }
/* notch (date range) */
#lcarsJobWin .notch-bar { --th:1.8rem; display:flex; align-items:center; gap:0.4rem; height:calc(var(--th)*0.74); }
#lcarsJobWin .notch-bar .seg2 { height:100%; }
#lcarsJobWin .notch-bar .capl { border-radius:calc(var(--th)*0.37) 0 0 calc(var(--th)*0.37); }
#lcarsJobWin .notch-bar .capr { border-radius:0 calc(var(--th)*0.37) calc(var(--th)*0.37) 0; }
#lcarsJobWin .notch-bar .title {
  display:flex; align-items:center; padding:0 0.8rem; background:#000;
  font-size:1.8rem; font-weight:400; letter-spacing:0.08em;
  text-transform:uppercase; line-height:1; white-space:nowrap;
  font-variant-numeric:tabular-nums;
}
/* day card view */
#lcarsJobWin .dc { margin-bottom:0.9rem; }
#lcarsJobWin .dc .day {
  height:2.2rem; display:flex; align-items:center; justify-content:space-between;
  padding:0 0.8rem; white-space:nowrap;
  font-size:1.4rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000;
}
#lcarsJobWin .dc .body { display:flex; gap:0.4rem; margin-top:0.4rem; align-items:stretch; height:3rem; }
#lcarsJobWin .dc .pip { width:1.5rem; border-radius:1.5rem 0 0 1.5rem; flex-shrink:0; }
#lcarsJobWin .dc .times {
  flex:1; display:flex; align-items:center; justify-content:center; gap:0.6rem;
  font-size:2.2rem; font-weight:400; letter-spacing:0.06em;
  color:var(--ly,#ffce63); font-variant-numeric:tabular-nums; white-space:nowrap;
}
#lcarsJobWin .dc .times span { cursor:pointer; padding:0.2rem 0.3rem; }
#lcarsJobWin .dc .times .ph { color:var(--lgr,#848484); }
#lcarsJobWin .dc .hrs {
  width:7rem; flex-shrink:0; display:flex; align-items:center; justify-content:flex-end;
  padding:0 0.8rem; border-radius:0 1.5rem 1.5rem 0;
  font-size:1.5rem; font-weight:700; letter-spacing:0.06em; color:#000;
  font-variant-numeric:tabular-nums;
}
#lcarsJobWin .dc.off .times { color:var(--lgr,#848484); font-size:1.6rem; letter-spacing:0.2em; }
/* grid view */
#lcarsJobWin .day-bar {
  height:1.9rem; display:flex; align-items:center; justify-content:center;
  padding:0 0.8rem; white-space:nowrap;
  font-size:1.3rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; margin-top:0.7rem;
}
#lcarsJobWin .day-bar:first-child { margin-top:0; }
#lcarsJobWin .eventrow { position:relative; height:2.2rem; margin-top:0.4rem; }
#lcarsJobWin .eventrow .range {
  position:absolute; inset:0 4%;
  background:repeating-linear-gradient(90deg,#1a1a1a 0,#1a1a1a 1px,transparent 1px,transparent calc(100%/9));
  border-right:1px solid #1a1a1a;
}
#lcarsJobWin .eventrow .pill {
  position:absolute; top:0; height:100%; border-radius:1.1rem;
  display:flex; align-items:center; justify-content:center;
  font-size:1.2rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; white-space:nowrap; overflow:hidden;
}
#lcarsJobWin .norow {
  height:2.2rem; margin-top:0.4rem; display:flex; align-items:center; justify-content:center;
  font-size:1.25rem; font-weight:500; letter-spacing:0.06em;
  text-transform:uppercase; color:var(--lgr,#848484);
}
#lcarsJobWin .axis-bar {
  position:relative; margin-top:0.6rem; height:1.9rem; background:var(--lgr,#848484);
  font-size:1.1rem; font-weight:700; color:#000; font-variant-numeric:tabular-nums;
}
#lcarsJobWin .axis-bar .range { position:absolute; inset:0 4%; }
#lcarsJobWin .axis-bar span { position:absolute; top:50%; transform:translate(-50%,-50%); }
/* side col buttons */
#lcarsJobWin .vbtn {
  height:4.4rem; border:0; cursor:pointer;
  display:flex; align-items:flex-end; justify-content:flex-end;
  padding:0 0.6rem 0.3rem 0; white-space:nowrap;
  font-size:1.2rem; font-weight:700; letter-spacing:0.04em;
  text-transform:uppercase; color:#000;
}
#lcarsJobWin .vbtn.dim { opacity:0.4; }
/* totals readout */
#lcarsJobWin .readout { display:flex; align-items:center; justify-content:flex-end; gap:0.4rem; margin-top:1.2rem; }
#lcarsJobWin .readout .lbl { font-size:1.4rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--lgr,#848484); padding-right:0.6rem; }
#lcarsJobWin .readout .num { font-size:3.6rem; font-weight:400; line-height:1; letter-spacing:0.06em; color:var(--ly,#ffce63); text-align:right; font-variant-numeric:tabular-nums; }
#lcarsJobWin .readout .half { width:2rem; height:3.4rem; border-radius:0 1.7rem 1.7rem 0; flex-shrink:0; background:var(--lpa,#f6ef95); }
/* palette helpers */
#lcarsJobWin .bo  { background:var(--lo,#ff9c00); }
#lcarsJobWin .by  { background:var(--ly,#ffce63); }
#lcarsJobWin .bpa { background:var(--lpa,#f6ef95); }
#lcarsJobWin .bpu { background:var(--lpu,#9c639c); }
#lcarsJobWin .bpk { background:var(--lpk,#ce9cce); }
#lcarsJobWin .brd { background:var(--lrd,#ce6363); }
#lcarsJobWin .bgr { background:var(--lgr,#848484); }
#lcarsJobWin .co  { color:var(--lo,#ff9c00); }
#lcarsJobWin .cpa { color:var(--lpa,#f6ef95); }

/* ---- THEME WINDOW ---- */
#lcarsThemeWin {
  display:none;
  position:fixed; inset:0; z-index:10500;
  background:#000;
  font-family:'Antonio','Arial Narrow',sans-serif;
  padding:0.8rem;
  overflow-y:auto;
}
#lcarsThemeWin.open { display:block; }
#lcarsThemeWin, #lcarsThemeWin * { font-family:'Antonio','Arial Narrow',sans-serif !important; }
#lcarsThemeWin .thm-row {
  display:flex; align-items:center; gap:var(--lgap,0.4rem);
  height:4.4rem; margin-bottom:var(--lgap,0.4rem);
  cursor:pointer;
}
#lcarsThemeWin .thm-name {
  width:11rem; height:100%; flex-shrink:0;
  display:flex; align-items:center; justify-content:flex-end;
  padding:0 0.8rem; border-radius:2.2rem 0 0 2.2rem;
  font-size:1.5rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000;
}
#lcarsThemeWin .thm-sw {
  flex:1; height:100%; display:flex; gap:2px;
}
#lcarsThemeWin .thm-sw i { flex:1; }
#lcarsThemeWin .thm-pip {
  width:2rem; height:100%; flex-shrink:0;
  border-radius:0 2.2rem 2.2rem 0; background:#1a1a1a;
}
#lcarsThemeWin .thm-row.on .thm-pip { background:#fff; }
body.lcars-mode .app { display:none !important; }
body.lcars-mode #mainApp { display:none !important; }

/* ---- LCARS base tokens ---- */
#lcarsRoot, #lcarsRoot * {
  font-family:'Antonio','Arial Narrow',sans-serif !important;
}
#lcarsRoot {
  --lo:  #ff9c00;
  --ly:  #ffce63;
  --lpa: #f6ef95;
  --lpu: #9c639c;
  --lpk: #ce9cce;
  --lrd: #ce6363;
  --lgr: #848484;
  --lbk: #000;
  --lgap: 0.35rem;
  font-family: 'Antonio','Arial Narrow',sans-serif;
  color: var(--lo);
  background: #000;
  padding: 0.6rem;
  width: 100%;
}

/* ---- elbow shapes ---- */
#lcarsRoot .e,
#lcarsRoot .et {
  --ext-h:0rem; --ext-v:0rem;
  position:relative; flex-shrink:0;
  height:calc(4.5rem + var(--ext-v)); min-height:4.5rem;
}
#lcarsRoot .e  { width:calc(9.5rem + var(--ext-h)); min-width:9.5rem; }
#lcarsRoot .et { width:calc(3.75rem + var(--ext-h)); min-width:3.75rem; }
#lcarsRoot .e.fl, #lcarsRoot .et.fl { width:auto; }
#lcarsRoot .e::after, #lcarsRoot .et::after {
  content:''; position:absolute;
  height:calc(100% - 1.5rem + 1px); background:#000;
}
#lcarsRoot .e::after  { width:calc(100% - 7.5rem + 1px); }
#lcarsRoot .et::after { width:calc(100% - 1.75rem + 1px); }
#lcarsRoot .lb  { border-top-left-radius:3.75rem; }
#lcarsRoot .lb::after { right:-1px; top:1.5rem; border-top-left-radius:1.875rem; }
#lcarsRoot .lt  { border-bottom-left-radius:3.75rem; }
#lcarsRoot .lt::after { right:-1px; bottom:1.5rem; border-bottom-left-radius:1.875rem; }
#lcarsRoot .rb  { border-top-right-radius:3.75rem; }
#lcarsRoot .rb::after { left:-1px; top:1.5rem; border-top-right-radius:1.875rem; }
#lcarsRoot .rt  { border-bottom-right-radius:3.75rem; }
#lcarsRoot .rt::after { left:-1px; bottom:1.5rem; border-bottom-right-radius:1.875rem; }

/* ---- frame rows ---- */
#lcarsRoot .frame { width:100%; }
#lcarsRoot .hrow  { display:flex; gap:var(--lgap); align-items:flex-start; }
#lcarsRoot .hrow.bot { align-items:flex-end; }
#lcarsRoot .hrow .seg { height:1.5rem; min-width:1.5rem; }
#lcarsRoot .mid   { display:flex; gap:var(--lgap); align-items:stretch; margin:var(--lgap) 0; }
#lcarsRoot .pcol  { display:flex; flex-direction:column; gap:var(--lgap); width:7.5rem; }
#lcarsRoot .pcol .blk { width:100%; }
#lcarsRoot .blk.fill  { min-height:1.5rem; }
#lcarsRoot .blk.sq    { height:3rem; }
#lcarsRoot .screen { flex:1; min-width:0; padding:0.6rem 0.4rem; overflow:visible; }
#lcarsRoot .rcol  { display:flex; flex-direction:column; gap:var(--lgap); width:1.75rem; }
#lcarsRoot .rcol .blk { width:100%; }

#lcarsRoot .bar-title {
  height:1.5rem; display:flex; align-items:center; padding:0 0.8rem;
  background:#000; flex-shrink:1; min-width:0; overflow:hidden;
  font-size:2rem; font-weight:700;
  letter-spacing:0.06em; text-transform:uppercase; line-height:1; white-space:nowrap;
}

/* ---- colours ---- */
#lcarsRoot .bo { background:var(--lo); }
#lcarsRoot .by { background:var(--ly); }
#lcarsRoot .bpa{ background:var(--lpa); }
#lcarsRoot .bpu{ background:var(--lpu); }
#lcarsRoot .bpk{ background:var(--lpk); }
#lcarsRoot .brd{ background:var(--lrd); }
#lcarsRoot .bgr{ background:var(--lgr); }

/* ---- FRAME 1: NEXT SHIFT ---- */
#lcarsRoot .sn-who {
  height:3rem; display:flex; align-items:flex-end; justify-content:flex-end;
  padding:0 0.8rem 0.3rem; font-size:1.6rem; font-weight:700;
  letter-spacing:0.08em; text-transform:uppercase; color:#000;
}
#lcarsRoot .sn-when { display:flex; align-items:center; gap:var(--lgap); }
#lcarsRoot .sn-num  {
  font-size:4.6rem; font-weight:700; line-height:1;
  color:var(--ly); letter-spacing:0.06em;
  font-variant-numeric:tabular-nums;
}
#lcarsRoot .sn-half { width:2rem; height:3.6rem; border-radius:0 1.8rem 1.8rem 0; }
#lcarsRoot .sn-row { display:flex; align-items:center; gap:var(--lgap); }
#lcarsRoot .sn-btn {
  margin-left:auto; height:3rem; padding:0 1.4rem;
  border-radius:1.5rem; display:flex; align-items:center; justify-content:center;
  font-size:1.25rem; font-weight:700; letter-spacing:0.08em;
  text-transform:uppercase; color:#000; cursor:pointer; white-space:nowrap;
}
#lcarsRoot .sn-btn.idle    { background:var(--ly); }
#lcarsRoot .sn-btn.running { background:var(--lrd); color:#000; animation:lcarsPulse 1.6s ease-in-out infinite; }
#lcarsRoot .sn-btn.done    { background:var(--lgr); }
@keyframes lcarsPulse { 0%,100%{opacity:1;} 50%{opacity:0.55;} }

/* timeline */
#lcarsRoot .tl-track {
  position:relative; height:1.5rem; background:#222;
  border-radius:0.3rem; overflow:hidden;
}
#lcarsRoot .tl-hl { position:absolute; top:0; bottom:0; width:1px; background:#000; }
#lcarsRoot .tl-hours { position:relative; height:1.4rem; margin-top:0.3rem; }
#lcarsRoot .tl-hours span { position:absolute; transform:translateX(-50%); font-size:1.1rem; font-weight:700; color:var(--lgr); }
#lcarsRoot .tl-span { position:absolute; top:0; height:100%; border-radius:0.75rem; }
#lcarsRoot .tl-now  { position:absolute; top:-0.4rem; width:0.25rem; height:2.3rem; background:var(--lrd); }


/* ---- FRAME 2: QUICK SCHEDULE ---- */
#lcarsRoot .qs-day {
  height:1.9rem; display:flex; align-items:center; padding:0 0.8rem;
  font-size:1.3rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; margin-top:0.7rem;
}
#lcarsRoot .qs-day:first-child { margin-top:0; }
#lcarsRoot .qs-row {
  position:relative; height:2.2rem; margin-top:var(--lgap);
  background:#0c0c0c;
}
#lcarsRoot .qs-hl { position:absolute; top:0; bottom:0; width:1px; background:#222; }
#lcarsRoot .qs-pill {
  position:absolute; top:0; height:100%; border-radius:1.1rem;
  display:flex; align-items:center; justify-content:center;
  font-size:1.2rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; white-space:nowrap; overflow:hidden;
}
#lcarsRoot .qs-off {
  height:2.2rem; margin-top:var(--lgap); display:flex; align-items:center;
  font-size:1.2rem; font-weight:500; letter-spacing:0.06em;
  text-transform:uppercase; color:var(--lgr);
}
#lcarsRoot .qs-axis {
  position:relative; height:1.8rem; margin-top:0.4rem; overflow:visible;
}
#lcarsRoot .qs-axis span {
  position:absolute; top:0; transform:translateX(-50%);
  font-size:1.1rem; font-weight:700; color:var(--lgr);
  line-height:1.8rem; white-space:nowrap;
}

/* ---- FRAME 3: HISTORY — kit trend columns ---- */
#lcarsRoot .trend { display:flex; gap:var(--lgap); }
#lcarsRoot .trend .wk { flex:1; min-width:0; display:flex; flex-direction:column; }
#lcarsRoot .trend .wk.now { flex:1.6; }
#lcarsRoot .trend .hd, #lcarsRoot .trend .ft {
  height:2.8rem; display:flex; align-items:center; justify-content:center;
  padding:0 0.5rem; white-space:nowrap; overflow:hidden;
  font-size:1.7rem; font-weight:800; letter-spacing:0.06em;
  text-transform:uppercase; color:#000;
}
#lcarsRoot .trend .ft { margin-top:auto; font-variant-numeric:tabular-nums; }
#lcarsRoot .trend .val {
  font-weight:400; line-height:1; letter-spacing:0.06em;
  text-align:center; padding:0.2rem;
  font-size:1.7rem; min-height:2.8rem;
  color:var(--lgr); white-space:nowrap;
  display:flex; align-items:center; justify-content:center; flex:1;
  font-variant-numeric:tabular-nums;
}
#lcarsRoot .trend .wk.now .val { color:var(--ly); }
#lcarsRoot .logbar { display:flex; align-items:center; gap:0.8rem; margin-top:1.4rem; }
#lcarsRoot .logbar .lbl { font-size:1.3rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--lpa); white-space:nowrap; }
#lcarsRoot .logbar .trk { position:relative; flex:1; height:1.8rem; background:#222; border-radius:0.3rem; overflow:hidden; }
#lcarsRoot .logbar .fill { position:absolute; inset:0 auto 0 0; background:repeating-linear-gradient(90deg,var(--lo) 0,var(--lo) 3px,#222 3px,#222 6px); }
#lcarsRoot .logbar .val  { font-size:1.3rem; font-weight:700; letter-spacing:0.08em; font-variant-numeric:tabular-nums; text-transform:uppercase; color:var(--lpa); white-space:nowrap; }
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_L = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function _ldk(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _ptm(t) {
  if (!t || t==='OFF' || t==='NONE') return null;
  const m = t.match(/^(\d{2}):(\d{2}) (AM|PM)$/); if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]);
  if (m[3]==='AM' && h===12) h=0; if (m[3]==='PM' && h!==12) h+=12;
  return h*60+min;
}
function _dur(s, e) {
  const sm=_ptm(s), em=_ptm(e); if (sm===null||em===null) return null;
  let d=em-sm; if (d<=0) d+=1440; return d;
}
function _fmtHH(mins) {
  if (mins===null||mins===undefined) return '00.00';
  return String(Math.floor(mins/60)).padStart(2,'0')+'.'+String(Math.round(mins%60/60*100)).padStart(2,'0');
}
function _fmtCD(totalMins) {
  if (!totalMins||totalMins<=0) return '-- --';
  const h=Math.floor(totalMins/60), m=totalMins%60;
  return `${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M`;
}
function _weekMins(job, offset, mode) {
  // mode: 'scheduled' or 'worked'
  const now=new Date();
  const fdow = (job.firstDow!==undefined) ? job.firstDow : (typeof activeFirstDow!=='undefined' ? activeFirstDow : 1);
  const diff=(now.getDay()-fdow+7)%7;
  const start=new Date(now); start.setDate(now.getDate()-diff+offset*7); start.setHours(0,0,0,0);
  let total=0;
  const src = mode==='worked' ? job.worked : job.schedule;
  if (!src) return 0;
  for (let i=0;i<7;i++) {
    const d=new Date(start); d.setDate(start.getDate()+i);
    const entry=src[_ldk(d)];
    if (!entry||!entry.start||!entry.end) continue;
    const dur=_dur(entry.start,entry.end);
    if (dur) total+=dur;
  }
  return total;
}
function _shiftPct(timeStr, rangeStart, rangeEnd) {
  // convert a time string to % position within [rangeStart, rangeEnd] hours (0-24)
  const m=_ptm(timeStr); if (m===null) return null;
  const h=m/60;
  return Math.max(0, Math.min(1, (h-rangeStart)/(rangeEnd-rangeStart)));
}
function _weekRange(offset) {
  const now=new Date();
  const fdow=typeof activeFirstDow!=='undefined'?activeFirstDow:1;
  const diff=(now.getDay()-fdow+7)%7;
  const s=new Date(now); s.setDate(now.getDate()-diff+offset*7); s.setHours(0,0,0,0);
  const e=new Date(s); e.setDate(s.getDate()+6);
  return {s,e};
}
function _fmtRange(offset) {
  const {s,e}=_weekRange(offset);
  return `${MO[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
}
function _fmtRangeNum(offset) {
  const {s,e}=_weekRange(offset);
  const p=n=>String(n).padStart(2,'0');
  return `${p(s.getMonth()+1)}/${p(s.getDate())}-${p(e.getMonth()+1)}/${p(e.getDate())}`;
}

// Per-job LCARS colors (cycled by index)
const JOB_COLS=['bpk','by','bpa','bpu','brd','bgr'];
function jobCol(i){ return JOB_COLS[i % JOB_COLS.length]; }

// ── BUILD HTML ────────────────────────────────────────────────────────────────

function buildFrame1(job) {
  // --- per-job countdowns, sorted soonest first ---
  const entries=[];
  if (typeof jobs!=='undefined') {
    const now=new Date();
    jobs.forEach(function(j, idx){
      let diff=Infinity;
      if (j.schedule) {
        for (let d=0;d<14;d++) {
          const date=new Date(now); date.setDate(now.getDate()+d); date.setHours(0,0,0,0);
          const sched=j.schedule[_ldk(date)];
          if (!sched||!sched.start||sched.start==='OFF'||sched.start==='NONE') continue;
          const sm=_ptm(sched.start); if (sm===null) continue;
          const sd=new Date(date); sd.setHours(Math.floor(sm/60),sm%60,0,0);
          const df=sd-now;
          if (df>0){ diff=df; break; }
        }
      }
      entries.push({ idx, title:j.title, diff });
    });
    entries.sort((a,b)=>a.diff-b.diff);
  }
  window._lcarsNextJobIdx = entries.length ? entries[0].idx : 0;

  let jobBlocks='';
  if (!entries.length) {
    jobBlocks=`<div class="sn-who bpk">No Job</div>
      <div class="sn-when"><div class="sn-num">-- --</div><div class="sn-half by"></div></div>`;
  } else {
    entries.forEach(function(en, i){
      const cd=en.diff<Infinity?_fmtCD(Math.round(en.diff/60000)):'-- --';
      const mt=i>0?'margin-top:1.2rem;':'';
      const j=jobs[en.idx];
      const st=(typeof getTimerState==='function')?getTimerState(j):'idle';
      const btnLbl=st==='running'?'On Shift':st==='done'?'Complete':'Start Shift';
      jobBlocks+=`<div class="sn-who ${jobCol(en.idx)}" style="cursor:pointer;${mt}" onclick="lcarsOpenJobIdx(${en.idx})">${en.title}</div>
        <div class="sn-row">
          <div class="sn-when"><div class="sn-num">${cd}</div><div class="sn-half ${jobCol(en.idx)}"></div></div>
          <div class="sn-btn ${st}" onclick="lcarsTimerTap(${j.id}, event)">${btnLbl}</div>
        </div>`;
    });
  }

  // --- timeline: -1h to 25h scale (1h gap each end), hour lines, all jobs worked-first ---
  const now=new Date(), todayKey=_ldk(now);
  const TL_START=-1, TL_END=25, TL_RANGE=TL_END-TL_START; // 26h
  function tlPct(h){ return (h-TL_START)/TL_RANGE*100; }
  const nowPct=tlPct(now.getHours()+now.getMinutes()/60);
  let spans='';
  // hour lines every hour 0..24
  for (let h=0; h<=24; h++) {
    spans+=`<div class="tl-hl" style="left:${tlPct(h).toFixed(2)}%;"></div>`;
  }
  function addSpan(sm, em, col) {
    if (sm===null||em===null) return;
    if (em<=sm) em+=1440;
    const sp=tlPct(sm/60), ep=tlPct(Math.min(em,1500)/60);
    const w=Math.max(0.5,ep-sp);
    spans+=`<div class="tl-span ${col}" style="left:${sp.toFixed(1)}%;width:${w.toFixed(1)}%;"></div>`;
  }
  function collectEntry(entry, col) {
    if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
      addSpan(_ptm(entry.start), _ptm(entry.end), col);
    }
    const ex=entry&&entry.extra&&entry.extra[0];
    if (ex&&ex.start&&ex.start!=='NONE'&&ex.end) {
      addSpan(_ptm(ex.start), _ptm(ex.end), col);
    }
  }
  if (typeof jobs!=='undefined') {
    jobs.forEach(function(j, idx){
      const src=j.worked&&j.worked[todayKey]?j.worked:j.schedule;
      collectEntry(src&&src[todayKey], jobCol(idx));
    });
    // yesterday's overnight shifts spilling past midnight into today (-24h offset)
    const yest=new Date(); yest.setDate(yest.getDate()-1);
    const yKey=_ldk(yest);
    function spill(sm, em, col) {
      if (sm===null||em===null) return;
      if (em<=sm) em+=1440;
      if (em<=1440) return; // didn't cross midnight
      const sp=tlPct((sm-1440)/60), ep=tlPct((em-1440)/60);
      spans+=`<div class="tl-span ${col}" style="left:${sp.toFixed(1)}%;width:${Math.max(0.5,ep-sp).toFixed(1)}%;"></div>`;
    }
    jobs.forEach(function(j, idx){
      const ySrc=j.worked&&j.worked[yKey]?j.worked:j.schedule;
      const yEntry=ySrc&&ySrc[yKey];
      if (yEntry&&yEntry.start&&yEntry.start!=='OFF'&&yEntry.start!=='NONE'&&yEntry.end) {
        spill(_ptm(yEntry.start), _ptm(yEntry.end), jobCol(idx));
      }
      const yex=yEntry&&yEntry.extra&&yEntry.extra[0];
      if (yex&&yex.start&&yex.start!=='NONE'&&yex.end) {
        spill(_ptm(yex.start), _ptm(yex.end), jobCol(idx));
      }
    });
  }

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl bo" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--lo);">Time Until Next Shift</div>
    <div class="et rb bo"></div>
  </div>
  <div class="mid" style="min-height:14rem;">
    <div class="pcol">
      <div class="blk sq by"></div>
      <div class="blk sq bpk"></div>
      <div class="blk sq bgr"></div>
      <div class="blk fill bo" style="flex:1;"></div>
    </div>
    <div class="screen">
      ${jobBlocks}
      <div style="margin-top:1rem;">
        <div class="tl-track">
          ${spans}
          <div class="tl-now" style="left:${nowPct.toFixed(1)}%;"></div>
        </div>
        <div class="tl-hours">
          ${[0,3,6,9,12,15,18,21,24].map(h=>`<span style="left:${((h+1)/26*100).toFixed(2)}%;">${h}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="rcol">
      <div class="blk fill bo" style="flex:1;"></div>
      <div class="blk brd" style="height:3rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl bo" style="flex:1;"></div>
    <div class="seg by" style="width:4rem;"></div>
    <div class="et rt bo"></div>
  </div>
</div>`;
}

function buildFrame2(job) {
  const now=new Date();
  // QS range: derive from actual shifts across next 7 days
  let minH=24, maxH=0;
  const allJobs=(typeof jobs!=='undefined')?jobs:(job?[job]:[]);
  for (let d=0;d<7;d++) {
    const date=new Date(now); date.setDate(now.getDate()+d);
    const key=_ldk(date);
    allJobs.forEach(function(j){
      const entry=j.schedule&&j.schedule[key];
      if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
        const s=_ptm(entry.start), e=_ptm(entry.end);
        if (s!==null) minH=Math.min(minH, s/60);
        if (e!==null&&s!==null) {
          let eh=e/60; if (eh<=s/60) eh+=24;
          maxH=Math.max(maxH, eh);
        }
      }
    });
  }
  if (minH>=maxH) { minH=8; maxH=20; } // no shifts — fallback
  minH=Math.floor(minH)-1; maxH=Math.ceil(maxH)+1; // 1h gap both ends
  const qsRange=maxH-minH;
  function qsPct(h){ return (h-minH)/qsRange*100; }
  // hour gridlines for each row — line at every whole hour
  let qsLines='';
  for (let h=Math.ceil(minH); h<=Math.floor(maxH); h++) {
    qsLines+=`<div class="qs-hl" style="left:${qsPct(h).toFixed(2)}%;"></div>`;
  }
  let dayRows='';
  for (let d=0;d<7;d++) {
    const date=new Date(now); date.setDate(now.getDate()+d); date.setHours(0,0,0,0);
    const key=_ldk(date);
    const isToday=d===0;
    const label=isToday?`Today · ${DOW_S[date.getDay()]} ${MO[date.getMonth()]} ${date.getDate()}`
                       :`${DOW_L[date.getDay()]} ${MO[date.getMonth()]} ${date.getDate()}`;
    const hdrCls=isToday?'bpk':'bpu';
    dayRows+=`<div class="qs-day ${hdrCls}">${label}</div>`;
    let anyShift=false, anyOff=false;
    allJobs.forEach(function(j, idx){
      const entry=j.schedule&&j.schedule[key];
      if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
        const sm=_ptm(entry.start), em=_ptm(entry.end);
        if (sm===null||em===null) return;
        let sh=sm/60, eh=em/60; if (eh<=sh) eh+=24;
        const left=qsPct(sh).toFixed(1)+'%';
        const width=Math.max(0,qsPct(eh)-qsPct(sh)).toFixed(1)+'%';
        const lbl=allJobs.length>1?j.title:`${entry.start} – ${entry.end}`;
        dayRows+=`<div class="qs-row">${qsLines}<div class="qs-pill ${jobCol(idx)}" style="left:${left};width:${width};">${lbl}</div></div>`;
        anyShift=true;
      } else if (entry&&entry.start==='OFF') {
        anyOff=true;
      }
    });
    if (!anyShift) {
      const txt=anyOff?'Off Duty':'Missing Data';
      dayRows+=`<div class="qs-row">${qsLines}<div class="qs-off" style="position:absolute;left:0.8rem;top:0;bottom:0;display:flex;align-items:center;">${txt}</div></div>`;
    }
  }
  // axis labels: every hour EXCEPT the 1h gap ends
  let axisLabels='';
  for (let h=minH+1; h<=maxH-1; h++) {
    let hh=((h%24)+24)%24;
    const lbl=hh===0?12:(hh>12?hh-12:hh);
    axisLabels+=`<span style="left:${qsPct(h).toFixed(2)}%;">${lbl}</span>`;
  }

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl bpu" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--lpk);">Quick Schedule</div>
    <div class="et rb bpu"></div>
  </div>
  <div class="mid">
    <div class="pcol">
      <div class="blk bpk" style="height:3rem;"></div>
      <div class="blk sq bpk"></div>
      <div class="blk sq bgr"></div>
      <div class="blk fill bpu" style="flex:1;"></div>
      <div class="blk bgr" style="height:2rem;"></div>
    </div>
    <div class="screen">
      ${dayRows}
      <div class="qs-axis">${axisLabels}</div>
    </div>
    <div class="rcol">
      <div class="blk bpk" style="height:4rem;"></div>
      <div class="blk fill bpu" style="flex:1;"></div>
      <div class="blk bgr" style="height:2.5rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl bpu" style="flex:1;"></div>
    <div class="seg bpk" style="width:3rem;"></div>
    <div class="et rt bpu"></div>
  </div>
</div>`;
}

function buildFrame3(job) {
  const allJobs=(typeof jobs!=='undefined')?jobs:(job?[job]:[]);
  let lastMins=0, thisSched=0, thisWorked=0, nextMins=0, projMins=0;
  const _now=new Date(); _now.setHours(0,0,0,0);
  allJobs.forEach(function(j){
    lastMins  += _weekMins(j,-1,'worked');
    thisSched += _weekMins(j, 0,'scheduled');
    thisWorked+= _weekMins(j, 0,'worked');
    nextMins  += _weekMins(j, 1,'scheduled');
    // projection: worked entries where present, else scheduled for today/future
    const fdow=(j.firstDow!==undefined)?j.firstDow:(typeof activeFirstDow!=='undefined'?activeFirstDow:1);
    const diff=(_now.getDay()-fdow+7)%7;
    const ws=new Date(_now); ws.setDate(_now.getDate()-diff);
    for (let i=0;i<7;i++) {
      const d=new Date(ws); d.setDate(ws.getDate()+i);
      const key=_ldk(d);
      const w=j.worked&&j.worked[key];
      if (w&&w.start&&w.end) { const du=_dur(w.start,w.end); if(du) projMins+=du; }
      else if (d>=_now) {
        const s=j.schedule&&j.schedule[key];
        if (s&&s.start&&s.start!=='OFF'&&s.start!=='NONE'&&s.end) { const du=_dur(s.start,s.end); if(du) projMins+=du; }
      }
    }
  });

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl by" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--ly);">History · Hours</div>
    <div class="et rb by"></div>
  </div>
  <div class="mid">
    <div class="pcol">
      <div class="blk sq bo"></div>
      <div class="blk fill by" style="flex:1;"></div>
      <div class="blk brd" style="height:2rem;"></div>
    </div>
    <div class="screen">
      <div class="trend">
        <div class="wk">
          <div class="hd bpu">Last</div>
          <div class="val">${_fmtHH(lastMins)}</div>
          <div class="ft bpu">${_fmtRangeNum(-1)}</div>
        </div>
        <div class="wk now">
          <div class="hd bo">This Week</div>
          <div class="val">${_fmtHH(thisWorked)}/${_fmtHH(thisSched)} (${_fmtHH(projMins)})</div>
          <div class="ft bo">${_fmtRangeNum(0)}</div>
        </div>
        <div class="wk">
          <div class="hd bpu">Next</div>
          <div class="val">${_fmtHH(nextMins)}</div>
          <div class="ft bpu">${_fmtRangeNum(1)}</div>
        </div>
      </div>

    </div>
    <div class="rcol">
      <div class="blk fill by" style="flex:1;"></div>
      <div class="blk bo" style="height:3rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl by" style="flex:1;"></div>
    <div class="seg bgr" style="width:2.5rem;"></div>
    <div class="seg brd" style="width:2.5rem;"></div>
    <div class="et rt by"></div>
  </div>
</div>`;
}

// ── INIT & RENDER ─────────────────────────────────────────────────────────────

function injectCSS() {
  if (document.getElementById('lcars-style')) return;
  const s=document.createElement('style'); s.id='lcars-style'; s.textContent=LCARS_CSS;
  document.head.appendChild(s);
}

function getActiveJob() {
  if (typeof jobs==='undefined'||!jobs.length) return null;
  // prefer the job that has a shift today or soonest
  return jobs[0];
}

window.lcarsTimerTap = function(jobId, e) {
  if (e) e.stopPropagation();
  if (typeof timerTap==='function') timerTap(jobId, e);
  setTimeout(lcarsRender, 50);
};

// ── LCARS JOB WINDOW ─────────────────────────────────────────────────────────
const _lj = { idx:0, week:'this', hours:'scheduled', view:'dc' };

function _ljJob(){ return (typeof jobs!=='undefined') ? jobs[_lj.idx] : null; }

function _ljWeekStart(){
  const job=_ljJob();
  const fdow=(job&&job.firstDow!==undefined)?job.firstDow:1;
  const offset=_lj.week==='prev'?-1:_lj.week==='next'?1:0;
  const now=new Date();
  const diff=(now.getDay()-fdow+7)%7;
  const s=new Date(now); s.setDate(now.getDate()-diff+offset*7); s.setHours(0,0,0,0);
  return s;
}

function _ljDays(){
  const job=_ljJob(); if(!job) return [];
  const start=_ljWeekStart();
  const src=(typeof getSchedObj==='function')?getSchedObj(job,_lj.hours):null;
  const DN=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const out=[];
  for(let i=0;i<7;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=_ldk(d);
    const e=(src&&src[key])||{};
    const isOff=e.start==='OFF'||e.end==='OFF';
    const sV=(!isOff&&e.start&&e.start!=='NONE')?e.start:null;
    const eV=(!isOff&&e.end&&e.end!=='NONE')?e.end:null;
    let mins=0;
    if(sV&&eV){
      const sm=_ptm(sV), em0=_ptm(eV);
      if(sm!==null&&em0!==null){ let em=em0; if(em<=sm)em+=1440; mins=em-sm; }
    }
    out.push({d, name:DN[d.getDay()], date:String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0'),
      isOff, sV, eV, mins});
  }
  return out;
}

function _ljFmtT(v){ // "09:00 AM" -> "0900"
  const m=v&&v.match(/^(\d{2}):(\d{2}) (AM|PM)$/); if(!m) return v;
  let h=+m[1]; if(m[3]==='AM'&&h===12)h=0; if(m[3]==='PM'&&h!==12)h+=12;
  return String(h).padStart(2,'0')+m[2];
}

window.lcarsJobRender = function(){
  const win=document.getElementById('lcarsJobWin'); if(!win||!win.classList.contains('open')) return;
  const job=_ljJob(); if(!job) return;
  const days=_ljDays();
  const start=_ljWeekStart(); const end=new Date(start); end.setDate(start.getDate()+6);
  const p=n=>String(n).padStart(2,'0');
  const range=`${p(start.getMonth()+1)}/${p(start.getDate())} – ${p(end.getMonth()+1)}/${p(end.getDate())}`;
  const wkOn=w=>_lj.week===w?' on':'';
  const tyOn=t=>_lj.hours===t?' on':'';

  // day cards — uniform colors; only today differs
  const _todayKey=_ldk(new Date());
  let dc='';
  days.forEach(dd=>{
    const ms=dd.d.getTime();
    const isToday=_ldk(dd.d)===_todayKey;
    const dayCls=isToday?'bo':'bpk';
    let times;
    if (dd.isOff) {
      times=`<span class="ph" style="letter-spacing:0.2em;" onclick="lcarsJobPick(${ms},'start')">Off Duty</span>`;
    } else if (!dd.sV && !dd.eV) {
      times=`<span class="ph" style="letter-spacing:0.2em;" onclick="lcarsJobPick(${ms},'start')">Missing Data</span>`;
    } else {
      const sTxt=dd.sV?_ljFmtT(dd.sV):'START';
      const eTxt=dd.eV?_ljFmtT(dd.eV):'END';
      const sCls=dd.sV?'':' class="ph"';
      const eCls=dd.eV?'':' class="ph"';
      times=`<span${sCls} onclick="lcarsJobPick(${ms},'start')">${sTxt}</span><span style="cursor:default;">–</span><span${eCls} onclick="lcarsJobPick(${ms},'end')">${eTxt}</span>`;
    }
    dc+=`<div class="dc">
      <div class="day ${dayCls}"><span>${dd.name}</span><span>${dd.date}</span></div>
      <div class="body"><div class="pip bo"></div>
        <div class="times">${times}</div>
        <div class="hrs by">${_fmtHH(dd.mins)}</div></div></div>`;
  });

  // grid — 21 days, 3 week groups; past uses worked, today+future schedule
  const DN2=['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const today0=new Date(); today0.setHours(0,0,0,0);
  const fdow=(job.firstDow!==undefined)?job.firstDow:1;
  const dsf=(today0.getDay()-fdow+7)%7;
  const wkS=new Date(today0); wkS.setDate(today0.getDate()-dsf-7);
  const gdays=[];
  for(let i=0;i<21;i++){
    const d=new Date(wkS); d.setDate(wkS.getDate()+i);
    const key=_ldk(d);
    const rel=Math.round((d-today0)/86400000);
    const src=rel<0?(job.worked||{}):(job.schedule||{});
    const e=src[key]||{};
    const isOff=e.start==='OFF'||e.end==='OFF';
    let sm=null, em=null;
    if(!isOff&&e.start&&e.start!=='NONE'&&e.end&&e.end!=='NONE'){
      sm=_ptm(e.start); em=_ptm(e.end);
      if(sm!==null&&em!==null&&em<=sm) em+=1440;
      if(sm===null||em===null){sm=null;em=null;}
    }
    gdays.push({d, key, rel, isOff, sm, em,
      mode:rel<0?'worked':'scheduled',
      name:DN2[d.getDay()], date:String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0')});
  }
  let gMin=24, gMax=0, gAny=false;
  gdays.forEach(g=>{ if(g.sm!==null){ gMin=Math.min(gMin,g.sm/60); gMax=Math.max(gMax,g.em/60); gAny=true; }});
  if(!gAny){ gMin=6; gMax=24; }
  const D0=Math.max(0,Math.floor(gMin)-1), D1=Math.ceil(gMax)+1;
  const pct=h=>((h-D0)/(D1-D0))*100;
  let gAxis=`<div class="axis-bar"><div class="range">`;
  for(let h=D0;h<=D1;h+=3) gAxis+=`<span style="left:${pct(h).toFixed(1)}%;">${((h%24)+24)%24}</span>`;
  gAxis+=`</div></div>`;
  const WK_LBL=['Last Week','This Week','Next Week'];
  let gr='';
  for(let w=0;w<3;w++){
    let rows='';
    for(let i=0;i<7;i++){
      const g=gdays[w*7+i];
      const ms=g.d.getTime();
      const dayCls=g.rel===0?'bo':'bpu';
      rows+=`<div class="day-bar ${dayCls}" onclick="lcarsJobPickG(${ms},'${g.mode}')">${g.name} · ${g.date}</div>`;
      if(g.sm!==null){
        const l=pct(g.sm/60), wd=Math.max(2,pct(g.em/60)-pct(g.sm/60));
        rows+=`<div class="eventrow" onclick="lcarsJobPickG(${ms},'${g.mode}')"><div class="range">
          <div class="pill bpa" style="left:${l.toFixed(1)}%;width:${wd.toFixed(1)}%;">${_fmtHH(g.em-g.sm)}</div></div></div>`;
      } else {
        rows+=`<div class="norow" onclick="lcarsJobPickG(${ms},'${g.mode}')">${g.isOff?'Off Duty':'Missing Data'}</div>`;
      }
    }
    gr+=`<div class="lj-frame" style="margin-bottom:0.8rem;">
      <div class="hrow">
        <div class="e lb fluid bo" style="flex:1;"></div>
        <div class="bar-title co">${WK_LBL[w]}</div>
        <div class="seg bpk" style="width:3rem;"></div>
        <div class="e-thin rb bo"></div>
      </div>
      <div class="mid">
        <div class="rcol"><div class="blk fill bo" style="flex:1;"></div></div>
        <div class="screen">${rows}${gAxis}</div>
        <div class="rcol"><div class="blk fill bo" style="flex:1;"></div></div>
      </div>
      <div class="hrow bottom">
        <div class="e lt fluid bo" style="flex:1;"></div>
        <div class="e-thin rt bo"></div>
      </div>
    </div>`;
  }

  const tot=days.reduce((a,dd)=>a+dd.mins,0);
  const isGrid=_lj.view==='gr';

  win.innerHTML=`
  <div class="lj-tabs">
    <div class="brd" style="flex:0 0 9rem;" onclick="lcarsJobClose()">Back</div>
    <div class="by" style="flex:1;font-size:1.6rem;">${job.title}</div>
    <div class="bpk" style="flex:0 0 9rem;" onclick="lcarsJobSettings()">Settings</div>
  </div>
  <div style="height:0.8rem;"></div>

  <div id="ljFilterFrame" style="position:relative;${isGrid?'display:none;':''}">
    <div class="hrow">
      <div class="e lb wksel${wkOn('prev')}" style="--ext-h:calc((100% - 26.05rem)/2);" onclick="lcarsJobSetWeek('prev')"><span class="elbl">Last</span></div>
      <div class="ftab wksel${wkOn('this')}" style="flex:0 0 12rem;" onclick="lcarsJobSetWeek('this')">This Week</div>
      <div class="e-thin rb wksel${wkOn('next')}" style="--ext-h:calc((100% - 26.05rem)/2);" onclick="lcarsJobSetWeek('next')"><span class="elbl">Next</span></div>
    </div>
    <div style="position:absolute;left:calc(7.5rem + 0.8rem);right:calc(1.75rem + 0.8rem);top:50%;transform:translateY(-50%);z-index:1;">
      <div class="notch-bar" style="width:100%;">
        <div class="seg2 capl bgr" style="flex:1;"></div>
        <div class="title cpa">${range}</div>
        <div class="seg2 capr bgr" style="flex:1;"></div>
      </div>
    </div>
    <div class="hrow bottom" style="margin-top:0.4rem;">
      <div class="e lt bpu"></div>
      <div class="ftab${tyOn('scheduled')}" onclick="lcarsJobSetType('scheduled')">Scheduled</div>
      <div class="ftab${tyOn('worked')}" onclick="lcarsJobSetType('worked')">Worked</div>
      <div class="e-thin rt fluid bpu" style="flex:0 1 5rem;"></div>
    </div>
  </div>
  <div style="height:0.8rem;${isGrid?'display:none;':''}"></div>

  <div class="lj-tabs" style="margin-bottom:0.8rem;">
    <div class="${isGrid?'bpk':'by'}" style="flex:1;" onclick="lcarsJobSetView('dc')">Day Card</div>
    <div class="${isGrid?'by':'bpk'}" style="flex:1;" onclick="lcarsJobSetView('gr')">Grid</div>
  </div>
  ${isGrid ? gr : `
  <div class="lj-frame">
    <div class="hrow">
      <div class="e lb fluid bo" style="flex:1;"></div>
      <div class="bar-title co">Schedule</div>
      <div class="seg bpk" style="width:3rem;"></div>
      <div class="e-thin rb bo"></div>
    </div>
    <div class="mid">
      <div class="rcol"><div class="blk fill bo" style="flex:1;"></div></div>
      <div class="screen">
        ${dc}
        <div class="readout">
          <div class="lbl">Total Hours</div>
          <div class="num">${_fmtHH(tot)}</div>
          <div class="half"></div>
        </div>
      </div>
      <div class="rcol">
        <div class="blk fill bo" style="flex:1;"></div>
        <div class="blk bpu" style="height:2.5rem;"></div>
      </div>
    </div>
    <div class="hrow bottom">
      <div class="e lt fluid bo" style="flex:1;"></div>
      <div class="seg bgr" style="width:4rem;"></div>
      <div class="e-thin rt bo"></div>
    </div>
  </div>`}`;
};

window.lcarsJobOpen = function(idx){
  if (typeof jobs==='undefined' || !jobs[idx]) return;
  _lj.idx=idx; _lj.week='this'; _lj.hours='scheduled';
  _lj.view = (jobs[idx].defaultView==='grid') ? 'gr' : 'dc';
  // set app globals (activeJobId, _currentJob, activeFirstDow, week/hours)
  // via the standard opener, then immediately suppress its window
  if (typeof openJobWindow==='function') {
    openJobWindow(jobs[idx]);
    const jw=document.getElementById('jobWindow');
    if (jw) jw.classList.remove('open');
  }
  let win=document.getElementById('lcarsJobWin');
  if (!win) { win=document.createElement('div'); win.id='lcarsJobWin'; document.body.appendChild(win); }
  win.classList.add('open');
  lcarsJobRender();
};

window.lcarsJobClose = function(){
  const win=document.getElementById('lcarsJobWin');
  if (win) win.classList.remove('open');
  if (typeof lcarsRender==='function') lcarsRender();
};

window.lcarsJobSetWeek = function(w){
  _lj.week=w;
  _lj.hours = (w==='prev') ? 'worked' : 'scheduled';
  if (typeof setWeek==='function') setWeek(w); // sync app globals for the picker
  lcarsJobRender();
};

window.lcarsJobSetType = function(t){
  if (_lj.week==='next' && t==='worked') return; // mirror standard rule
  _lj.hours=t;
  if (typeof setHoursType==='function') setHoursType(t);
  lcarsJobRender();
};

window.lcarsJobSetView = function(v){
  _lj.view=v;
  if (v==='dc') { // re-sync picker globals with day-card filters
    if (typeof setWeek==='function') setWeek(_lj.week);
    if (typeof setHoursType==='function') setHoursType(_lj.hours);
  }
  const job=_ljJob();
  if (job) { job.defaultView = (v==='gr')?'grid':'daycard'; if (typeof lsSet==='function') lsSet('sch_jobs', jobs); }
  lcarsJobRender();
};

window.lcarsJobPick = function(ms, section){
  if (typeof openSchedModal==='function') openSchedModal(new Date(ms), section, 0);
};

window.lcarsJobPickG = function(ms, mode){
  // grid taps: route the picker to worked (past) or schedule (today/future)
  if (typeof setWeek==='function') setWeek('this');          // unblock hours switching
  if (typeof setHoursType==='function') setHoursType(mode);
  if (typeof openSchedModal==='function') openSchedModal(new Date(ms), 'start', 0);
};

window.lcarsJobSettings = function(){
  if (typeof openJobSettings==='function') openJobSettings();
  const sw=document.getElementById('jobSettingsWindow');
  if (sw) sw.style.zIndex='10450';
};

// picker confirm → refresh LCARS views automatically
if (typeof window.tpConfirm==='function' && !window._ljTpPatched) {
  window._ljTpPatched=true;
  const _origTpConfirm=window.tpConfirm;
  window.tpConfirm=function(){
    _origTpConfirm();
    const win=document.getElementById('lcarsJobWin');
    if (win && win.classList.contains('open')) lcarsJobRender();
    if (document.body.classList.contains('lcars-mode') && typeof lcarsRender==='function') lcarsRender();
  };
}

window.lcarsOpenJobIdx = function(idx) {
  lcarsJobOpen(idx);
};

window.lcarsOpenJob = function() {
  const idx=window._lcarsNextJobIdx||0;
  lcarsJobOpen((typeof jobs!=='undefined'&&jobs[idx])?idx:0);
};

window.lcarsRender = function() {
  const root=document.getElementById('lcarsRoot');
  if (!root) return;
  const job=getActiveJob();
  root.innerHTML = buildFrame1(job) + buildFrame2(job) + buildFrame3(job);
};

// ── THEMES ────────────────────────────────────────────────────────────────────
const LCARS_THEMES = {
  'DEFIANT':  { lo:'#ff9c00', ly:'#ffce63', lpa:'#f6ef95', lpu:'#9c639c', lpk:'#ce9cce', lrd:'#ce6363', lgr:'#848484' },
  '2369':     { lo:'#FF9933', ly:'#FFCC66', lpa:'#FFFF99', lpu:'#664466', lpk:'#CC99CC', lrd:'#CC6666', lgr:'#99CCFF' },
  'VOYAGER':  { lo:'#FF9900', ly:'#EE9955', lpa:'#FFCC99', lpu:'#774466', lpk:'#CC6699', lrd:'#DD6644', lgr:'#BBAA55' },
  'NEMESIS':  { lo:'#FF9966', ly:'#6688CC', lpa:'#CCDDFF', lpu:'#4455BB', lpk:'#9999FF', lrd:'#AA5533', lgr:'#9999CC' },
  'CERRITOS': { lo:'#FF9900', ly:'#FFCC33', lpa:'#F5E7C0', lpu:'#BB6622', lpk:'#BBAA55', lrd:'#BB4411', lgr:'#8A7A50' },
  'RED ALERT':{ lo:'#EE1100', ly:'#DD6644', lpa:'#EE9955', lpu:'#882211', lpk:'#CC6666', lrd:'#FF2200', lgr:'#664444' },
};

window.lcarsApplyTheme = function lcarsApplyTheme(name) {
  const t = LCARS_THEMES[name]; if (!t) return;
  const root = document.getElementById('lcarsRoot');
  for (const k in t) {
    if (root) root.style.setProperty('--' + k, t[k]);
    document.documentElement.style.setProperty('--' + k, t[k]); // header tabs + theme win
  }
  if (typeof appSettings !== 'undefined') {
    appSettings.lcarsTheme = name;
    if (typeof lsSet === 'function') lsSet('sch_settings', appSettings);
  }
  const win = document.getElementById('lcarsThemeWin');
  if (win && win.classList.contains('open')) lcarsBuildThemeWin();
}

function lcarsBuildThemeWin() {
  let win = document.getElementById('lcarsThemeWin');
  if (!win) {
    win = document.createElement('div');
    win.id = 'lcarsThemeWin';
    document.body.appendChild(win);
  }
  const cur = (typeof appSettings !== 'undefined' && appSettings.lcarsTheme) || 'DEFIANT';
  let rows = '';
  for (const name in LCARS_THEMES) {
    const t = LCARS_THEMES[name];
    const sws = ['lo','ly','lpa','lpu','lpk','lrd','lgr']
      .map(k => `<i style="background:${t[k]};"></i>`).join('');
    rows += `<div class="thm-row ${name===cur?'on':''}" onclick="lcarsApplyTheme('${name}')">
      <div class="thm-name" style="background:${t.lo};">${name}</div>
      <div class="thm-sw">${sws}</div>
      <div class="thm-pip"></div>
    </div>`;
  }
  win.innerHTML = `
    <div style="display:flex;align-items:stretch;gap:0.4rem;height:5rem;margin-bottom:0.4rem;">
      <div style="width:8rem;background:var(--lo,#ff9c00);border-radius:2.5rem 0 0 0;flex-shrink:0;"></div>
      <div style="flex:1;background:var(--lo,#ff9c00);display:flex;align-items:center;justify-content:space-between;padding:0 1.2rem;">
        <span style="font-size:2.2rem;font-weight:700;letter-spacing:0.14em;color:#000;text-transform:uppercase;">Theme Select</span>
        <span onclick="lcarsThemeWinClose()" style="font-size:1.5rem;font-weight:700;letter-spacing:0.1em;color:#000;text-transform:uppercase;cursor:pointer;border:2px solid #000;border-radius:1.4rem;padding:0.3rem 1.2rem;">Close</span>
      </div>
    </div>
    <div style="height:1rem;display:flex;gap:0.4rem;margin-bottom:1.2rem;">
      <div style="width:8rem;background:var(--lo,#ff9c00);border-radius:0 0 1.2rem 0;flex-shrink:0;"></div>
      <div style="flex:1;display:flex;gap:0.4rem;align-items:center;">
        <div style="height:0.8rem;width:4rem;border-radius:0.4rem;background:var(--lpk,#ce9cce);"></div>
        <div style="height:0.8rem;width:2.4rem;border-radius:0.4rem;background:var(--lpu,#9c639c);"></div>
        <div style="height:0.8rem;flex:1;border-radius:0.4rem;background:var(--lo,#ff9c00);opacity:0.25;"></div>
      </div>
    </div>
    ${rows}`;
}

window.lcarsThemeWinOpen = function() {
  lcarsBuildThemeWin();
  document.getElementById('lcarsThemeWin').classList.add('open');
};
window.lcarsThemeWinClose = function() {
  const win = document.getElementById('lcarsThemeWin');
  if (win) win.classList.remove('open');
};

function lcarsThemeTab(on) {
  let btn = document.getElementById('lcarsThemeTabBtn');
  if (on && !btn) {
    const bar = document.getElementById('headerTab');
    if (!bar) return;
    btn = document.createElement('button');
    btn.id = 'lcarsThemeTabBtn';
    btn.className = 'header-action-btn';
    btn.textContent = 'Theme';
    btn.onclick = lcarsThemeWinOpen;
    bar.appendChild(btn);
  } else if (!on && btn) {
    btn.remove();
    lcarsThemeWinClose();
  }
}

window.lcarsSetMode = function(on) {
  injectCSS();
  const root=document.getElementById('lcarsRoot');
  if (!root) return;
  if (on) {
    // rem units scale from html font-size — save original and shrink
    if (!window._lcarsPrevHtmlFs) window._lcarsPrevHtmlFs = document.documentElement.style.fontSize || '';
    document.documentElement.style.fontSize = (window.innerWidth <= 380) ? '6.5px' : '7px';
    root.classList.add('active');
    document.body.classList.add('lcars-mode');
    lcarsThemeTab(true);
    if (typeof appSettings!=='undefined' && appSettings.lcarsTheme) lcarsApplyTheme(appSettings.lcarsTheme);
    lcarsRender();
    if (window._lcarsInterval) clearInterval(window._lcarsInterval);
    window._lcarsInterval = setInterval(lcarsRender, 60000); // refresh every minute
  } else {
    document.documentElement.style.fontSize = window._lcarsPrevHtmlFs || '';
    window._lcarsPrevHtmlFs = null;
    root.classList.remove('active');
    document.body.classList.remove('lcars-mode');
    lcarsThemeTab(false);
    if (typeof lcarsJobClose==='function') { const _w=document.getElementById('lcarsJobWin'); if(_w) _w.classList.remove('open'); }
    if (window._lcarsInterval) { clearInterval(window._lcarsInterval); window._lcarsInterval=null; }
  }
};

// ── SETUP ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', function() {
  injectCSS();

  // Inject root container after the main content div
  if (!document.getElementById('lcarsRoot')) {
    const root=document.createElement('div');
    root.id='lcarsRoot';
    // Insert after main app content
    const ref=document.getElementById('mainApp')||document.querySelector('.app')||document.body.firstElementChild;
    if (ref&&ref.parentNode) ref.parentNode.insertBefore(root, ref.nextSibling);
    else document.body.appendChild(root);
  }

  // Activate if setting is already on
  if (typeof appSettings!=='undefined' && appSettings.lcarsMode) {
    lcarsSetMode(true);
  }
});

})();
