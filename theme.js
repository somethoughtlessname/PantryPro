/* theme.js - Theme Builder
   Requires: app.js globals - jobs, appSettings, ls, lsSet, renderJobs,
             updateSettingsUI, openWindow, closeWindow
*/

/* ---------------------------------------
   CONSTANTS & DEFAULTS
--------------------------------------- */

const TB_BASE_VAR_MAP = {
  bg1:       '--bg-1',
  bg2:       '--bg-2',
  bg3:       '--bg-3',
  bg4:       '--bg-4',
  primary:   '--primary',
  secondary: '--secondary',
  accent:    '--accent',
  color1:    '--color-1',
  border:    '--border-color',
  textLight: '--text-light',
  textDark:  '--text-dark',
  textMid:   '--text-mid',
};const TB_JOB_VAR_MAP = {
  swatch1:  '--swatch-1',
  swatch2:  '--swatch-2',
  swatch3:  '--swatch-3',
  swatch4:  '--swatch-4',
  swatch5:  '--swatch-5',
  swatch6:  '--swatch-6',
  swatch7:  '--swatch-7',
  swatch8:  '--swatch-8',
  swatch9:  '--swatch-9',
  swatch10: '--swatch-10',
};const TB_BASE_LABELS = {
  bg1:       'BG 1 - Page',
  bg2:       'BG 2 - Cards',
  bg3:       'BG 3 - Header',
  primary:   'Primary',
  secondary: 'Secondary',
  accent:    'Accent',
  color1:    'Alert / Red',
  border:    'Border Color',
  bg4:       'BG 4 - White',
  textLight: 'Text - Light',
  textDark:  'Text - Dark',
  textMid:   'Text - Mid',
};const TB_JOB_LABELS = {
  swatch1: 'Red', swatch2: 'Orange', swatch3: 'Gold',
  swatch4: 'Green', swatch5: 'Teal', swatch6: 'Blue',
  swatch7: 'Purple', swatch8: 'Rose', swatch9: 'Pink', swatch10: 'Sage',
};const TB_DEFAULTS = {
  baseColors: {
    bg1: '#233040', bg2: '#4d5f72', bg3: '#1e2d3f', bg4: '#ffffff',
    primary: '#48a971', secondary: '#5A8DB8', accent: '#8a7ca8',
    color1: '#e07878', border: '#000000',
    textLight: '#ffffff', textMid: '#b4bcc8', textDark: '#000000',
  },
  jobColors: {
    swatch1: '#C85A5A', swatch2: '#C7824A', swatch3: '#B8B85A',
    swatch4: '#48a971', swatch5: '#5AB8A8', swatch6: '#5A8DB8',
    swatch7: '#8a7ca8', swatch8: '#B87390', swatch9: '#a06090', swatch10: '#7a9070',
  },
};/* ---------------------------------------
   CSS APPLICATION
--------------------------------------- */

function tbApplyCssVars(baseColors, jobColors) {
  const root = document.documentElement;
  delete baseColors.muted; delete baseColors.color10;
  Object.keys(baseColors).forEach(k => { const v = TB_BASE_VAR_MAP[k]; if (v) root.style.setProperty(v, baseColors[k]); });
  Object.keys(jobColors).forEach(k => { const v = TB_JOB_VAR_MAP[k]; if (v) root.style.setProperty(v, jobColors[k]); });
}

function tbRerender() {
  if (typeof refreshSwatchCards === 'function') refreshSwatchCards();
  if (typeof renderJobs === 'function') renderJobs();if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) {
    buildQuickSchedule(); renderQuickSchedule();}
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
}

/* ---------------------------------------
   INJECT STYLES
--------------------------------------- */

(function injectThemeStyles() {
  const s = document.createElement('style');s.textContent = `
  
  #themeBuilderWindow {
    z-index: 10000;--job-half: 21px;--card-height: 45px;--qs-hdr: 18px;}
  .tb-body {
    flex: 1; overflow-y: auto;padding: var(--margin);display: flex; flex-direction: column; gap: var(--margin);}

  .tb-card {
    border: var(--border-width) solid var(--border-color);border-radius: var(--radius); overflow: hidden; flex-shrink: 0;background: var(--bg-2);}
  .tb-card-hdr {
    height: var(--qs-hdr);display: flex; align-items: center; justify-content: center;background: var(--bg-3);border-bottom: var(--border-width) solid var(--border-color);font-size: var(--text-xs); font-weight: var(--fw-bold);letter-spacing: var(--ls-wider); text-transform: uppercase;color: var(--text-mid);}
  .tb-card-hdr-with-btns {
    display: flex; align-items: stretch;}
  .tb-card-hdr-text {
    flex: 1; display: flex; align-items: center; justify-content: center;}
  .tb-hdr-btn {
    width: 36px; flex-shrink: 0;background: var(--bg-3); border: none;border-left: var(--border-width) solid var(--border-color);color: var(--text-mid);font-size: var(--text-sm); font-weight: var(--fw-bold);cursor: pointer; display: flex; align-items: center; justify-content: center;}
  .tb-hdr-btn:first-child { border-left: none; border-right: var(--border-width) solid var(--border-color); }
  .tb-hdr-btn.disabled { opacity: 0.25; cursor: not-allowed; }
  .tb-hdr-btn:not(.disabled):active { background: var(--bg-2); color: var(--text-light); }

  .tb-swatch-row {
    display: flex; height: var(--job-half); flex-shrink: 0;}
  .tb-swatch {
    flex: 1; cursor: pointer; position: relative;border-right: var(--border-width) solid var(--border-color);}
  .tb-swatch:last-child { border-right: none; }
  .tb-swatch::after {
    content: ''; position: absolute; top: 50%; left: 50%;transform: translate(-50%, -50%) scale(0);width: 10px; height: 10px; border-radius: 50%; background: #fff;transition: transform 0.1s;}
  .tb-swatch.selected::after { transform: translate(-50%, -50%) scale(1); }
  .tb-readout {
    height: var(--qs-hdr);display: flex; align-items: center; justify-content: center;background: var(--bg-3);border-top: var(--border-width) solid var(--border-color);font-size: var(--text-xs); font-weight: var(--fw-bold);letter-spacing: var(--ls-wide); color: var(--text-mid);}

  .tb-harmony-row {
    display: flex; height: var(--qs-hdr);border-bottom: var(--border-width) solid var(--border-color);}
  .tb-harmony-btn {
    flex: 1; border: none; border-right: var(--border-width) solid var(--border-color);background: var(--bg-3); color: var(--text-mid);font-size: var(--text-xs); font-weight: var(--fw-bold);letter-spacing: var(--ls-tight); text-transform: uppercase;cursor: pointer; display: flex; align-items: center; justify-content: center;}
  .tb-harmony-btn:last-child { border-right: none; }
  .tb-harmony-btn.active { background: var(--primary); color: var(--text-light); }
  .tb-harmony-swatches { display: flex; height: var(--job-half); flex-shrink: 0; }
  .tb-harmony-swatch {
    flex: 1; cursor: pointer;border-right: var(--border-width) solid var(--border-color);transition: opacity 0.1s;}
  .tb-harmony-swatch:last-child { border-right: none; }
  .tb-harmony-swatch:active { opacity: 0.7; }

  .tb-color-preview-row {
    display: flex; align-items: center; gap: var(--margin);padding: var(--margin);border-bottom: var(--border-width) solid var(--border-color);background: var(--bg-3);}
  .tb-color-preview {
    width: 40px; height: var(--qs-hdr);border: var(--border-width) solid var(--border-color);border-radius: var(--radius); flex-shrink: 0;}
  .tb-hex-input {
    flex: 1; height: var(--qs-hdr);background: var(--bg-2); border: var(--border-width) solid var(--border-color);border-radius: var(--radius);color: var(--text-light); font-size: var(--text-xs); font-weight: var(--fw-bold);text-align: center; letter-spacing: var(--ls-wide);padding: 0 6px;}
  .tb-hex-input:focus { outline: none; border-color: var(--primary); }
  .tb-action-btn {
    height: var(--qs-hdr); padding: 0 8px; flex-shrink: 0;background: var(--bg-2); border: var(--border-width) solid var(--border-color);border-radius: var(--radius);color: var(--text-mid); font-size: 9px; font-weight: var(--fw-bold);letter-spacing: var(--ls-tight); text-transform: uppercase;cursor: pointer;}
  .tb-action-btn:active { background: var(--bg-3); color: var(--text-light); }

  .tb-slider-section {
    padding: var(--margin) 12px;background: var(--bg-3);border-bottom: var(--border-width) solid var(--border-color);}
  .tb-slider-section:last-child { border-bottom: none; }
  .tb-slider-row {
    display: flex; align-items: center; gap: 6px;margin-bottom: 4px;}
  .tb-slider-row:last-child { margin-bottom: 0; }
  .tb-slider-lbl {
    width: 18px; font-size: var(--text-xs); font-weight: var(--fw-bold);color: var(--text-mid); flex-shrink: 0;}
  .tb-slider {
    flex: 1; height: 4px;-webkit-appearance: none; appearance: none;background: var(--bg-2); border: none; border-radius: 2px; outline: none;}
  .tb-slider::-webkit-slider-thumb {
    -webkit-appearance: none;width: 16px; height: 16px;background: var(--primary); border: var(--border-width) solid var(--border-color);border-radius: 50%; cursor: pointer;}
  .tb-slider::-moz-range-thumb {
    width: 16px; height: 16px;background: var(--primary); border: var(--border-width) solid var(--border-color);border-radius: 50%; cursor: pointer;}
  .tb-slider-val {
    width: 28px; text-align: right;font-size: var(--text-xs); font-weight: var(--fw-bold); color: var(--text-light);flex-shrink: 0;}

  .tb-demo-section {
    padding: var(--margin); display: flex; flex-direction: column; gap: var(--margin);}

  .tb-tabs {
    display: flex; height: var(--card-height);border-bottom: var(--border-width) solid var(--border-color);}
  .tb-tab {
    flex: 1; border: none; border-right: var(--border-width) solid var(--border-color);background: var(--bg-3); color: var(--text-mid);font-size: var(--text-xs); font-weight: var(--fw-bold);letter-spacing: var(--ls-wider); text-transform: uppercase;cursor: pointer; display: flex; align-items: center; justify-content: center;}
  .tb-tab:last-child { border-right: none; }
  .tb-tab.active { background: var(--primary); color: var(--text-light); }
  .tb-tab-panel { display: none; flex-direction: column; }
  .tb-tab-panel.active { display: flex; }

  .tb-saved-item {
    border: var(--border-width) solid var(--border-color);border-radius: var(--radius); overflow: hidden;display: flex; gap: var(--margin); padding: var(--margin);}
  .tb-saved-card {
    flex: 1; border: var(--border-width) solid var(--border-color);border-radius: var(--radius); overflow: hidden; cursor: pointer;display: flex; flex-direction: column;}
  .tb-saved-card-top {
    height: var(--qs-hdr); flex-shrink: 0;border-bottom: var(--border-width) solid var(--border-color);}
  .tb-saved-card-bot {
    height: var(--qs-hdr); flex-shrink: 0;display: flex; align-items: center; justify-content: center;font-size: var(--text-xs); font-weight: var(--fw-bold);letter-spacing: var(--ls-wide); text-transform: uppercase;color: var(--text-light); background: var(--bg-4);white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 6px;}
  .tb-saved-swatches {
    display: flex; height: var(--job-half);}
  .tb-saved-swatch { flex: 1; border-right: var(--border-width) solid var(--border-color); }
  .tb-saved-swatch:last-child { border-right: none; }

  .tb-rand-chip {
    flex:1; min-width:0; cursor:pointer; position:relative;border-right:var(--border-width) solid var(--border-color);display:flex; align-items:center; justify-content:center;height:var(--job-half); font-size:8px; font-weight:900;color:var(--text-light); background:var(--bg-2);letter-spacing:0.06em; text-transform:uppercase;}
  .tb-rand-chip:last-child { border-right:none; }
  .tb-rc-hdr{display:flex;align-items:center;justify-content:space-between;background:var(--bg-3);border-bottom:var(--border-width) solid var(--border-color);height:var(--job-half);padding:0 8px}
  .tb-rc-lbl{font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)}
  .tb-rc-val{font-size:var(--text-xs);font-weight:700;text-transform:uppercase;color:var(--text-light)}
  .tb-rc-card{border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden}
  .tb-rc-chips{display:flex;flex-wrap:wrap}
  .tb-rslider{flex:1;min-width:0;height:100%;appearance:none;-webkit-appearance:none;outline:none;border:none;cursor:pointer;padding:0 6px}
  .tb-rc-primary{height:var(--job-half);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase}
  .tb-rc-btns{display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden}
  .tb-rc-btn{flex:1;height:calc(var(--job-half) + var(--border-width)*2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer}
  .tb-rc-slider-wrap{border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;height:calc(var(--job-half) + var(--border-width)*2)}
  `;document.head.appendChild(s);
})();/* ---------------------------------------
   THEME SYSTEM
--------------------------------------- */

window.ThemeSystem = {

  baseColors: {...TB_DEFAULTS.baseColors},
  jobColors:  {...TB_DEFAULTS.jobColors},

  selectedColor: { type: 'base', key: 'primary' },
  selectedHarmony: 'complementary',
  showSwatches: {},
  deleteConfirm: {},
  colorHistories: {},
  colorHistoryIndices: {},
  isUndoRedo: false,

  open() {
    if (typeof clearThemeFx === 'function') clearThemeFx();this.baseColors = {...TB_DEFAULTS.baseColors};this.jobColors  = {...TB_DEFAULTS.jobColors};const cs = getComputedStyle(document.documentElement);Object.keys(TB_BASE_VAR_MAP).forEach(k => {
      const v = cs.getPropertyValue(TB_BASE_VAR_MAP[k]).trim();if (v && v !== '') this.baseColors[k] = v;});Object.keys(TB_JOB_VAR_MAP).forEach(k => {
      const v = cs.getPropertyValue(TB_JOB_VAR_MAP[k]).trim();if (v && v !== '') this.jobColors[k] = v;});this.selectedColor = { type: 'base', key: 'primary' };this.selectedHarmony = 'complementary';this.colorHistories = {}; this.colorHistoryIndices = {};this.showSwatches = {}; this.deleteConfirm = {};this.isUndoRedo = false;tbCurrentAnimFilter = tbCurrentAnimFilter || 'none';tbCurrentStatFilter = tbCurrentStatFilter || 'none';openWindow('themeBuilderWindow');this.render();this.setupListeners();this.saveToHistory();if (typeof getOverlayCfg === 'function') {
      const cfg = getOverlayCfg();const activeId = cfg.overlay || 'none';document.querySelectorAll('#tbOverlaySel .tb-swatch').forEach(sw => {
        const isOn = sw.dataset.ov === activeId;sw.style.background = isOn ? 'var(--primary)' : 'var(--bg-3)';sw.style.color = isOn ? 'var(--text-light)' : 'var(--text-mid)';});const nameEl = document.getElementById('tbOverlayName');if (nameEl) nameEl.textContent = activeId === 'none' ? '-' : activeId.toUpperCase();if (typeof tbBuildLayerWrap === 'function') tbBuildLayerWrap(activeId);if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview(activeId);}
    const activeFontId = appSettings.customFont || 'def';document.querySelectorAll('#tbFontSel .tb-swatch').forEach(sw => {
      const isOn = sw.dataset.font === activeFontId;sw.style.background = isOn ? 'var(--primary)' : 'var(--bg-3)';sw.style.color = isOn ? 'var(--text-light)' : 'var(--text-mid)';});const fontNameEl = document.getElementById('tbFontName');if (fontNameEl && typeof CUSTOM_FONTS !== 'undefined') fontNameEl.textContent = (CUSTOM_FONTS[activeFontId] || CUSTOM_FONTS.def).label;},

  close() {
    closeWindow('themeBuilderWindow');if (typeof applyOverlay === 'function') applyOverlay();},

  render() {
    this.renderBaseSwatches();this.renderJobSwatches();this.renderHarmonySwatches();this.updateRgbPanel(this.currentColor());this.renderSavedList();this.updateUndoRedo();},

  currentColor() {
    return this.selectedColor.type === 'base'
      ? this.baseColors[this.selectedColor.key]
      : this.jobColors[this.selectedColor.key];},

  renderBaseSwatches() {
    const row = document.getElementById('tbBaseSwatches');if (!row) return;row.innerHTML = '';Object.keys(this.baseColors).forEach(k => {
      const d = document.createElement('div');d.className = 'tb-swatch' + (k === this.selectedColor.key && this.selectedColor.type === 'base' ? ' selected' : '');d.style.background = this.baseColors[k];d.onclick = () => this.selectColor('base', k);row.appendChild(d);});},

  renderJobSwatches() {
    const row = document.getElementById('tbJobSwatches');if (!row) return;row.innerHTML = '';Object.keys(this.jobColors).forEach(k => {
      const d = document.createElement('div');d.className = 'tb-swatch' + (k === this.selectedColor.key && this.selectedColor.type === 'job' ? ' selected' : '');d.style.background = this.jobColors[k];d.onclick = () => this.selectColor('job', k);row.appendChild(d);});},

  selectColor(type, key) {
    this.selectedColor = { type, key };const color = type === 'base' ? this.baseColors[key] : this.jobColors[key];if (type === 'base') {
      const readout = document.getElementById('tbColorReadout');if (readout) readout.textContent = TB_BASE_LABELS[key] || key;} else {
      const readout = document.getElementById('tbJobColorReadout');if (readout) readout.textContent = TB_JOB_LABELS[key] || key;}
    this.renderBaseSwatches();this.renderJobSwatches();this.updateRgbPanel(color);this.renderHarmonySwatches();this.updateUndoRedo();const hk = `${type}-${key}`;if (!this.colorHistories[hk]) {
      this.colorHistories[hk] = [color];this.colorHistoryIndices[hk] = 0;}
  },

  updateRgbPanel(hex) {
    const preview = document.getElementById('tbColorPreview');const hexInput = document.getElementById('tbHexInput');const hexDisplay = document.getElementById('tbHexDisplay');if (preview) preview.style.background = hex;if (hexInput) hexInput.value = hex.replace('#','').toUpperCase();if (hexDisplay) {
      const clean = hex.replace('#','');hexDisplay.textContent = '#' + clean.toUpperCase();const rr=parseInt(clean.slice(0,2),16)/255;const gg=parseInt(clean.slice(2,4),16)/255;const bb=parseInt(clean.slice(4,6),16)/255;const lum = 0.2126*rr + 0.7152*gg + 0.0722*bb;hexDisplay.style.color = lum > 0.45 ? '#000000' : '#ffffff';}
    const rgb = this.hexToRgb(hex);const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);this.syncSliders(rgb.r, rgb.g, rgb.b, hsl.l, hsl.s);},

  syncSliders(r, g, b, br, sa) {
    const set = (id, val) => {
      const el = document.getElementById(id); if (el) el.value = val;};const txt = (id, val) => {
      const el = document.getElementById(id); if (el) el.textContent = val;};set('tbSliderR', r); txt('tbValR', r);set('tbSliderG', g); txt('tbValG', g);set('tbSliderB', b); txt('tbValB', b);set('tbSliderBr', br !== undefined ? br : this.rgbToHsl(r,g,b).l);txt('tbValBr', br !== undefined ? br : this.rgbToHsl(r,g,b).l);set('tbSliderSa', sa !== undefined ? sa : this.rgbToHsl(r,g,b).s);txt('tbValSa', sa !== undefined ? sa : this.rgbToHsl(r,g,b).s);},

  applyHex(hex) {
    if (this.selectedColor.type === 'base') this.baseColors[this.selectedColor.key] = hex;else this.jobColors[this.selectedColor.key] = hex;const preview = document.getElementById('tbColorPreview');if (preview) preview.style.background = hex;const hexInput = document.getElementById('tbHexInput');if (hexInput) hexInput.value = hex.replace('#','').toUpperCase();const hexDisplay = document.getElementById('tbHexDisplay');if (hexDisplay) {
      const clean = hex.replace('#','');hexDisplay.textContent = '#' + clean.toUpperCase();const rr2=parseInt(clean.slice(0,2),16)/255,gg2=parseInt(clean.slice(2,4),16)/255,bb2=parseInt(clean.slice(4,6),16)/255;const lum2=0.2126*rr2+0.7152*gg2+0.0722*bb2;hexDisplay.style.color = lum2 > 0.45 ? '#000000' : '#ffffff';}
    tbApplyCssVars(this.baseColors, this.jobColors);this.renderBaseSwatches();this.renderJobSwatches();this.renderHarmonySwatches();this.updateDemoCards();const exportField = document.getElementById('tbExportField');if (exportField) exportField.value = tbEncodeTheme(this.baseColors, this.jobColors);},

  renderHarmonySwatches() {
    const row = document.getElementById('tbHarmonySwatches');if (!row) return;row.innerHTML = '';const colors = this.calcHarmony(this.currentColor(), this.selectedHarmony);colors.forEach(c => {
      const d = document.createElement('div');d.className = 'tb-harmony-swatch';d.style.background = c;d.onclick = () => {
        this.applyHex(c);this.updateRgbPanel(c);this.saveToHistory();};row.appendChild(d);});},

  updateDemoCards() {
    const bar = document.getElementById('tbDemoJobBar');if (bar) bar.style.background = this.baseColors.primary;const qsHdr = document.getElementById('tbDemoQsHdr');if (qsHdr) qsHdr.style.background = this.baseColors.accent;},

  getHk() { return `${this.selectedColor.type}-${this.selectedColor.key}`; },

  saveToHistory() {
    if (this.isUndoRedo) return;const hk = this.getHk();if (!this.colorHistories[hk]) { this.colorHistories[hk] = []; this.colorHistoryIndices[hk] = -1; }
    const hist = this.colorHistories[hk];const idx  = this.colorHistoryIndices[hk];const color = this.currentColor();const nh = hist.slice(0, idx + 1);nh.push(color);if (nh.length > 50) nh.shift();this.colorHistories[hk] = nh;this.colorHistoryIndices[hk] = nh.length - 1;this.updateUndoRedo();},

  updateUndoRedo() {
    const hk = this.getHk();const hist = this.colorHistories[hk] || [];const idx  = this.colorHistoryIndices[hk] !== undefined ? this.colorHistoryIndices[hk] : -1;const ub = document.getElementById('tbUndoBtn');const rb = document.getElementById('tbRedoBtn');if (ub) ub.classList.toggle('disabled', idx <= 0);if (rb) rb.classList.toggle('disabled', idx >= hist.length - 1);},

  undo() {
    const hk = this.getHk();const idx = this.colorHistoryIndices[hk];if (!idx || idx <= 0) return;this.isUndoRedo = true;const ni = idx - 1;this.colorHistoryIndices[hk] = ni;const c = this.colorHistories[hk][ni];this.applyHex(c); this.updateRgbPanel(c); this.updateUndoRedo();setTimeout(() => { this.isUndoRedo = false; }, 50);},

  redo() {
    const hk = this.getHk();const hist = this.colorHistories[hk] || [];const idx  = this.colorHistoryIndices[hk];if (idx >= hist.length - 1) return;this.isUndoRedo = true;const ni = idx + 1;this.colorHistoryIndices[hk] = ni;const c = hist[ni];this.applyHex(c); this.updateRgbPanel(c); this.updateUndoRedo();setTimeout(() => { this.isUndoRedo = false; }, 50);},

  setupListeners() {
    document.querySelectorAll('#tbOverlaySel .tb-swatch').forEach(sw => {
      sw.onclick = () => {
        const id = sw.dataset.ov;const cfg = typeof getOverlayCfg === 'function' ? getOverlayCfg() : null;if (id === 'crt' && cfg && cfg.overlay === 'crt') {
          const cols = ['green','green2','blue','amber','white','red'];const cur = (cfg.crt || {}).color || 'green';cfg.crt = cfg.crt || {};cfg.crt.color = cols[(cols.indexOf(cur) + 1) % cols.length];if (typeof lsSet === 'function') lsSet('sch_settings', appSettings);if (typeof applyOverlay === 'function') applyOverlay();if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview('crt');return;}
        document.querySelectorAll('#tbOverlaySel .tb-swatch').forEach(b => {
          b.style.background = 'var(--bg-3)'; b.style.color = 'var(--text-mid)';});sw.style.background = 'var(--primary)'; sw.style.color = 'var(--text-light)';const nameEl = document.getElementById('tbOverlayName');if (nameEl) nameEl.textContent = id === 'none' ? '-' : id.toUpperCase();if (cfg) cfg.overlay = id;if (typeof lsSet === 'function') lsSet('sch_settings', appSettings);if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview(id);if (typeof applyOverlay === 'function') applyOverlay();tbBuildLayerWrap(id);};});document.querySelectorAll('#tbFontSel .tb-swatch').forEach(sw => {
      sw.onclick = () => {
        const id = sw.dataset.font;document.querySelectorAll('#tbFontSel .tb-swatch').forEach(b => {
          b.style.background = 'var(--bg-3)'; b.style.color = 'var(--text-mid)';});sw.style.background = 'var(--primary)'; sw.style.color = 'var(--text-light)';const nameEl = document.getElementById('tbFontName');if (nameEl && typeof CUSTOM_FONTS !== 'undefined') nameEl.textContent = CUSTOM_FONTS[id].label;appSettings.customFont = id;if (typeof lsSet === 'function') lsSet('sch_settings', appSettings);if (typeof applyCustomFont === 'function') applyCustomFont(id);};});document.querySelectorAll('.tb-tab').forEach(tab => {
      tab.onclick = () => {
        const t = tab.dataset.tab;document.querySelectorAll('.tb-tab').forEach(b => b.classList.remove('active'));document.querySelectorAll('.tb-tab-panel').forEach(p => p.classList.remove('active'));tab.classList.add('active');const panel = document.getElementById('tbPanel-' + t);if (panel) panel.classList.add('active');if (t === 'saved') this.renderSavedList();if (t === 'io') tbPopulateExport();};});document.querySelectorAll('.tb-harmony-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tb-harmony-btn').forEach(b => b.classList.remove('active'));btn.classList.add('active');this.selectedHarmony = btn.dataset.h;this.renderHarmonySwatches();const harmonyNames = {
          complementary:'Complementary', analogous:'Analogous', triadic:'Triadic',
          tetradic:'Tetradic', split:'Split', accented:'Accented',
          fibonacci:'Fibonacci', monochromatic:'Monochromatic'
        };const modeEl = document.getElementById('tbHarmonyMode');if (modeEl) modeEl.textContent = harmonyNames[btn.dataset.h] || btn.dataset.h;};});const ub = document.getElementById('tbUndoBtn');const rb = document.getElementById('tbRedoBtn');if (ub) ub.onclick = () => { if (!ub.classList.contains('disabled')) this.undo(); };if (rb) rb.onclick = () => { if (!rb.classList.contains('disabled')) this.redo(); };const hexInput = document.getElementById('tbHexInput');if (hexInput) {
      hexInput.oninput = () => {
        let v = hexInput.value.replace(/[^0-9A-Fa-f]/g,'').substring(0, 6);hexInput.value = v.toUpperCase();if (v.length === 6) { this.applyHex('#' + v); this.updateRgbPanel('#' + v); }
      };hexInput.onblur = () => this.saveToHistory();}
    const copyBtn = document.getElementById('tbCopyBtn');if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText('#' + (document.getElementById('tbHexInput').value || ''));copyBtn.textContent = 'COPIED'; setTimeout(() => copyBtn.textContent = 'COPY', 1200);} catch(e) {}
      };}
    const pasteBtn = document.getElementById('tbPasteBtn');if (pasteBtn) {
      pasteBtn.onclick = async () => {
        try {
          const text = await navigator.clipboard.readText();let hex = text.trim().replace('#','').replace(/[^0-9A-Fa-f]/g,'').substring(0,6);if (hex.length === 6) {
            this.applyHex('#' + hex); this.updateRgbPanel('#' + hex);this.saveToHistory();pasteBtn.textContent = 'PASTED'; setTimeout(() => pasteBtn.textContent = 'PASTE', 1200);return;}
        } catch(e) {}
        const overlay = document.createElement('div');overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);background:rgba(0,0,0,0.4);';const box = document.createElement('div');box.style.cssText = 'background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:280px;overflow:hidden;';box.innerHTML = `<div style="height:var(--job-half);background:var(--bg-3);border-bottom:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">Paste Hex Color</div>
          <div style="padding:var(--margin);display:flex;gap:var(--margin);">
            <input id="tbPasteInput" type="text" placeholder="#48A971" maxlength="7"
              style="flex:1;height:var(--card-height);background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-md);font-weight:var(--fw-bold);text-align:center;font-family:monospace;padding:0 8px;">
            <button style="height:var(--card-height);padding:0 12px;background:var(--primary);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-xs);font-weight:var(--fw-bold);cursor:pointer;" id="tbPasteConfirm">OK</button>
          </div>`;overlay.appendChild(box);overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };document.body.appendChild(overlay);const inp = document.getElementById('tbPasteInput');inp.focus();inp.onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('tbPasteConfirm').click(); };document.getElementById('tbPasteConfirm').onclick = () => {
          let hex = inp.value.trim().replace('#','').replace(/[^0-9A-Fa-f]/g,'').substring(0,6);if (hex.length === 6) {
            this.applyHex('#' + hex); this.updateRgbPanel('#' + hex);this.saveToHistory();pasteBtn.textContent = 'PASTED'; setTimeout(() => pasteBtn.textContent = 'PASTE', 1200);}
          overlay.remove();};};}
    ['R','G','B'].forEach(ch => {
      const slider = document.getElementById('tbSlider' + ch);const val    = document.getElementById('tbVal' + ch);if (!slider) return;slider.oninput = () => {
        val.textContent = slider.value;const r = +document.getElementById('tbSliderR').value;const g = +document.getElementById('tbSliderG').value;const b = +document.getElementById('tbSliderB').value;const hsl = this.rgbToHsl(r, g, b);document.getElementById('tbSliderBr').value = hsl.l;document.getElementById('tbValBr').textContent = hsl.l;document.getElementById('tbSliderSa').value = hsl.s;document.getElementById('tbValSa').textContent = hsl.s;this.applyHex(this.rgbToHex(r, g, b));};slider.onmouseup = slider.ontouchend = () => this.saveToHistory();});const brSlider = document.getElementById('tbSliderBr');if (brSlider) {
      brSlider.oninput = () => {
        document.getElementById('tbValBr').textContent = brSlider.value;const r = +document.getElementById('tbSliderR').value;const g = +document.getElementById('tbSliderG').value;const b = +document.getElementById('tbSliderB').value;const hsl = this.rgbToHsl(r, g, b);hsl.l = +brSlider.value;hsl.s = +document.getElementById('tbSliderSa').value;const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);this.syncSliders(rgb.r, rgb.g, rgb.b, hsl.l, hsl.s);this.applyHex(this.rgbToHex(rgb.r, rgb.g, rgb.b));};brSlider.onmouseup = brSlider.ontouchend = () => this.saveToHistory();}
    const saSlider = document.getElementById('tbSliderSa');if (saSlider) {
      saSlider.oninput = () => {
        document.getElementById('tbValSa').textContent = saSlider.value;const r = +document.getElementById('tbSliderR').value;const g = +document.getElementById('tbSliderG').value;const b = +document.getElementById('tbSliderB').value;const hsl = this.rgbToHsl(r, g, b);hsl.s = +saSlider.value;hsl.l = +document.getElementById('tbSliderBr').value;const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);this.syncSliders(rgb.r, rgb.g, rgb.b, hsl.l, hsl.s);this.applyHex(this.rgbToHex(rgb.r, rgb.g, rgb.b));};saSlider.onmouseup = saSlider.ontouchend = () => this.saveToHistory();}
  },

  getSavedThemes() { return JSON.parse(localStorage.getItem('shift_themes') || '[]'); },

  saveTheme(name, overwrite = false) {
    const themes = this.getSavedThemes();const ei = themes.findIndex(t => t.name === name);const theme = {
      name,
      baseColors: {...this.baseColors},
      jobColors: {...this.jobColors},
      animFilter: tbCurrentAnimFilter || 'none',
      statFilter: tbCurrentStatFilter || 'none',
      date: new Date().toISOString(),
    };if (ei !== -1 && overwrite) themes[ei] = theme;else if (ei === -1) themes.push(theme);localStorage.setItem('shift_themes', JSON.stringify(themes));localStorage.setItem('shift_current_theme', name);this.renderSavedList();},

  loadTheme(index) {
    const themes = this.getSavedThemes();const theme = themes[index];if (!theme) return;this.baseColors = {...TB_DEFAULTS.baseColors, ...theme.baseColors};this.jobColors  = {...TB_DEFAULTS.jobColors,  ...theme.jobColors};tbApplyCssVars(this.baseColors, this.jobColors);tbRerender();localStorage.setItem('shift_current_theme', theme.name);if (theme.overlayCfg && typeof getOverlayCfg === 'function') {
      const cfg = getOverlayCfg();Object.assign(cfg, theme.overlayCfg);if (typeof applyOverlay === 'function') applyOverlay();const sel = document.getElementById('tbOverlaySel');if (sel) sel.querySelectorAll('.tb-swatch').forEach(sw => {
        const isOn = sw.dataset.ov === (cfg.overlay || 'none');sw.style.background = isOn ? 'var(--primary)' : 'var(--bg-3)';sw.style.color = isOn ? 'var(--text-light)' : 'var(--text-mid)';});const nameEl = document.getElementById('tbOverlayName');if (nameEl) nameEl.textContent = cfg.overlay && cfg.overlay !== 'none' ? cfg.overlay.toUpperCase() : '-';}
    this.colorHistories = {}; this.colorHistoryIndices = {};this.render();document.querySelectorAll('.tb-tab').forEach(b => b.classList.remove('active'));document.querySelectorAll('.tb-tab-panel').forEach(p => p.classList.remove('active'));const edTab = document.querySelector('.tb-tab[data-tab="editor"]');const edPanel = document.getElementById('tbPanel-editor');if (edTab) edTab.classList.add('active');if (edPanel) edPanel.classList.add('active');},

  deleteTheme(index) {
    const themes = this.getSavedThemes();themes.splice(index, 1);localStorage.setItem('shift_themes', JSON.stringify(themes));this.deleteConfirm = {};this.renderSavedList();},

  openSaveModal() {
    const modal = document.getElementById('tbSaveModal');
    if (modal) {
      if (modal.parentElement !== document.body) document.body.appendChild(modal);
      modal.style.display = 'flex';
      const inp = document.getElementById('tbThemeNameInput');
      if (inp) { inp.value = ''; inp.focus(); }
    }
  },

  closeSaveModal() {
    const modal = document.getElementById('tbSaveModal');
    if (modal) modal.style.display = 'none';
  },

  confirmSave() {
    const name = (document.getElementById('tbThemeNameInput').value || '').trim();if (!name) return;const exists = this.getSavedThemes().findIndex(t => t.name === name) !== -1;if (exists) {
      this.closeSaveModal();const over = document.getElementById('tbOverwriteModal');if (over) over.style.display = 'flex';} else {
      this.saveTheme(name);this.closeSaveModal();}
  },

  confirmOverwrite() {
    const name = (document.getElementById('tbThemeNameInput').value || '').trim();if (name) { this.saveTheme(name, true); }
    const over = document.getElementById('tbOverwriteModal');if (over) over.style.display = 'none';},

  cancelOverwrite() {
    const over = document.getElementById('tbOverwriteModal');if (over) over.style.display = 'none';this.openSaveModal();},

  renderSavedList() {
    const list = document.getElementById('tbSavedList');if (!list) return;const themes = this.getSavedThemes();if (themes.length === 0) {
      list.innerHTML = `<div style="padding:16px;text-align:center;font-size:var(--text-xs);color:var(--text-light);">No saved themes yet</div>`;return;}

    list.innerHTML = '';const bw = '3px';const BK = '#000000'; // all borders black
    for (let i = 0; i < themes.length; i += 2) {
      const row = document.createElement('div');row.style.cssText = 'display:flex;gap:var(--margin)';[themes[i], themes[i+1]].forEach((theme, slot) => {
        const idx = i + slot;if (!theme) {
          const ph = document.createElement('div');ph.style.cssText = 'flex:1';row.appendChild(ph);return;}

        const isDelConf = !!this.deleteConfirm[idx];const showSw    = !!this.showSwatches[idx];const bg1 = theme.baseColors.bg1       || '#233040';const bg4 = theme.baseColors.bg4       || '#ffffff';const pri = theme.baseColors.primary   || '#48a971';const sec = theme.baseColors.secondary || '#5A8DB8';const acc = theme.baseColors.accent    || '#8a7ca8';const tl  = theme.baseColors.textLight || '#ffffff';const tm  = theme.baseColors.textMid   || '#b4bcc8';const td  = theme.baseColors.textDark  || '#000000';const card = document.createElement('div');card.style.cssText = `flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;background:${bg1}`;let inner = '';if (isDelConf) {
          inner = `<div style="display:flex;border-bottom:${bw} solid ${BK}"><div style="flex:1;height:var(--qs-hdr);background:${pri};border-right:${bw} solid ${BK};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:${tl};cursor:pointer" onclick="ThemeSystem.deleteConfirm[${idx}]=false;ThemeSystem.renderSavedList()">NO</div><div style="flex:1;height:var(--qs-hdr);background:${sec};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:${tl}">DEL?</div></div><div style="display:flex"><div style="flex:1;height:var(--qs-hdr);background:${acc};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:${tl};cursor:pointer" onclick="ThemeSystem.deleteTheme(${idx})">YES</div></div>`;} else if (showSw) {
          inner = `<div style="display:flex;height:var(--qs-hdr);border-bottom:${bw} solid ${BK}">${Object.values(theme.jobColors||{}).map((c,k,arr) =>`<div style="flex:1;background:${c}${k<arr.length-1?`;border-right:${bw} solid ${BK}`:''}"></div>`).join('')}</div><div style="display:flex;border-top:none"><div style="flex:1;height:var(--qs-hdr);background:${pri};border-right:${bw} solid ${BK};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:${tl};cursor:pointer" onclick="ThemeSystem.showSwatches[${idx}]=false;ThemeSystem.renderSavedList()">BACK</div><div style="flex:1;height:var(--qs-hdr);background:${acc};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:${tl};cursor:pointer" onclick="ThemeSystem.loadTheme(${idx})">LOAD</div></div>`;} else {
          inner = `<div style="height:var(--qs-hdr);background:${sec};border-bottom:${bw} solid ${BK};display:flex;align-items:center;padding:0 8px;font-size:var(--text-xs);font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:${tl};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${theme.name}</div><div style="padding:var(--margin);display:flex;flex-direction:column;gap:var(--margin)"><div style="display:flex;gap:var(--margin);height:var(--qs-hdr)"><div style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;display:flex"><div style="width:var(--job-half);background:${pri};border-right:${bw} solid ${BK}"></div><div style="flex:1;background:${bg4}"></div></div><div style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;display:flex"><div style="width:var(--job-half);background:${acc};border-right:${bw} solid ${BK}"></div><div style="flex:1;background:${bg4}"></div></div></div><div style="display:flex;gap:var(--margin)"><div style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;height:var(--qs-hdr);background:${bg1};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tm};cursor:pointer" onclick="ThemeSystem.showSwatches[${idx}]=true;ThemeSystem.renderSavedList()">Colors</div><div style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;height:var(--qs-hdr);background:${acc};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tl};cursor:pointer" onclick="ThemeSystem.loadTheme(${idx})">Load</div><div style="flex:1;border:${bw} solid ${BK};border-radius:var(--radius);overflow:hidden;height:var(--qs-hdr);background:${bg1};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:${tm};opacity:0.5;cursor:pointer" onclick="ThemeSystem.deleteConfirm[${idx}]=true;ThemeSystem.renderSavedList()">Del</div></div></div>`;}

        card.innerHTML = inner;row.appendChild(card);});list.appendChild(row);}
  },

  applyToApp() {
    tbApplyCssVars(this.baseColors, this.jobColors);tbRerender();const themeSlot = document.getElementById('themePickerSlot');if (themeSlot) themeSlot.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));},

  resetToDefaults() {
    this.baseColors = {...TB_DEFAULTS.baseColors};this.jobColors  = {...TB_DEFAULTS.jobColors};tbApplyCssVars(this.baseColors, this.jobColors);tbRerender();this.colorHistories = {}; this.colorHistoryIndices = {};this.render();},

  hexToRgb(hex) {
    hex = hex.replace(/[^0-9A-Fa-f]/g,'');if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');const r = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return r ? {r:parseInt(r[1],16), g:parseInt(r[2],16), b:parseInt(r[3],16)} : {r:72,g:169,b:113};},
  rgbToHex(r, g, b) {
    return '#' + [r,g,b].map(x => Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');},
  rgbToHsl(r, g, b) {
    r/=255; g/=255; b/=255;const max=Math.max(r,g,b), min=Math.min(r,g,b);let h, s, l=(max+min)/2;if (max===min) { h=s=0; } else {
      const d=max-min;s = l>0.5 ? d/(2-max-min) : d/(max+min);switch(max) {
        case r: h=((g-b)/d+(g<b?6:0))/6; break;case g: h=((b-r)/d+2)/6; break;case b: h=((r-g)/d+4)/6; break;}
    }
    return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)};},
  hslToRgb(h, s, l) {
    h/=360; s/=100; l/=100;const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };if (s===0) { const v=Math.round(l*255); return {r:v,g:v,b:v}; }
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;return {r:Math.round(hue2rgb(p,q,h+1/3)*255), g:Math.round(hue2rgb(p,q,h)*255), b:Math.round(hue2rgb(p,q,h-1/3)*255)};},
  calcHarmony(hex, type) {
    const rgb = this.hexToRgb(hex);const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);const make = (offsets) => offsets.map(o => {
      const h = ((hsl.h + o) + 360) % 360;const r = this.hslToRgb(h, hsl.s, hsl.l);return {color: this.rgbToHex(r.r, r.g, r.b), h};}).sort((a,b)=>a.h-b.h).map(c=>c.color);switch(type) {
      case 'analogous':       return make([0,15,30,45,60,-15,-30,-45]);case 'complementary':   return make([0,30,-30,180,210,150]);case 'triadic':         return make([0,60,120,180,240,300]);case 'tetradic':        return make([0,45,90,135,180,225,270,315]);case 'split':           return make([0,30,-30,150,180,210]);case 'accented':        return make([0,20,-20,40,150,180]);case 'fibonacci': {
        const r=[]; for(let i=0;i<8;i++){const h=((hsl.h+137.508*i)%360+360)%360;const rgb=this.hslToRgb(h,hsl.s,hsl.l);r.push({color:this.rgbToHex(rgb.r,rgb.g,rgb.b),h});}
        return r.sort((a,b)=>a.h-b.h).map(c=>c.color);}
      case 'monochromatic': {
        return [10,20,30,40,50,60,70,80].map(l => {
          const r=this.hslToRgb(hsl.h, hsl.s, l); return this.rgbToHex(r.r,r.g,r.b);});}
      default: return make([0,30,-30,180,210,150]);}
  },
};/* ---------------------------------------
   BUILD WINDOW HTML
--------------------------------------- */

function tbBuildWindow() {
  const win = document.createElement('div');win.className = 'data-window';win.id = 'themeBuilderWindow';win.innerHTML = `
    <div class="data-window-header">
      <button class="data-window-back" onclick="ThemeSystem.close()" id="themeWindowBack"></button>
      <div class="data-window-title">Theme Builder</div>
    </div>

    <div class="tb-tabs">
      <div class="tb-tab active" data-tab="editor">Editor</div>
      <div class="tb-tab" data-tab="saved">Saved</div>
      <div class="tb-tab" data-tab="io">Import / Export</div>
      <div class="tb-tab" data-tab="randomize">Randomize</div>
    </div>

    <!-- EDITOR PANEL -->
    <div class="tb-tab-panel active tb-body" id="tbPanel-editor" style="overflow:hidden;">

      <!-- Base Colors -->
      <div class="tb-card">
        <div class="tb-card-hdr" style="display:flex;justify-content:space-between;padding:0 10px;">
          <span>Base Colors</span>
          <span id="tbColorReadout" style="color:var(--text-light);font-weight:var(--fw-bold);">Primary</span>
        </div>
        <div class="tb-swatch-row" id="tbBaseSwatches"></div>
      </div>

      <!-- Job Colors -->
      <div class="tb-card">
        <div class="tb-card-hdr" style="display:flex;justify-content:space-between;padding:0 10px;">
          <span>Job Colors</span>
          <span id="tbJobColorReadout" style="color:var(--text-light);font-weight:var(--fw-bold);">Red</span>
        </div>
        <div class="tb-swatch-row" id="tbJobSwatches"></div>
      </div>

      <!-- Overlay -->
      <div class="tb-card" id="tbOverlayCard">
        <div style="height:var(--job-half);background:var(--bg-3);border-bottom:var(--border-width) solid var(--border-color);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 10px;">
          <span style="font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">Overlay</span>
          <div id="tbLayerWrap" style="display:flex;align-items:center;justify-content:center;gap:4px;"></div>
          <span id="tbOverlayName" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-transform:uppercase;color:var(--text-light);text-align:right;">-</span>
        </div>
        <div class="tb-swatch-row" id="tbOverlaySel" style="height:var(--job-half);">
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);background:var(--primary);" data-ov="none">NON</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="grn">GRN</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="crt">CRT</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="stt">STT</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="glc">GLC</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="prx">PRX</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="dtr">DTR</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="vgn">VGN</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="crs">CRS</div>
<div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="tlt">TLT</div>
<div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="plm">PLM</div>
<div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);" data-ov="hlg">HLG</div>
        </div>
      </div>

      <!-- Text -->
      <div class="tb-card" id="tbTextCard">
        <div style="height:var(--job-half);background:var(--bg-3);border-bottom:var(--border-width) solid var(--border-color);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 10px;">
          <span style="font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">Font</span>
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;"></div>
          <span id="tbFontName" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-transform:uppercase;color:var(--text-light);text-align:right;">DEF</span>
        </div>
        <div class="tb-swatch-row" id="tbFontSel" style="height:var(--job-half);">
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);background:var(--primary);" data-font="def">DEF</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Courier New',monospace;" data-font="mono">MONO</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Trebuchet MS',sans-serif;" data-font="round">RND</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:Georgia,serif;" data-font="serif">SERIF</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Rockwell','Courier New',serif;" data-font="slab">SLAB</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Arial Narrow',Arial,sans-serif;letter-spacing:.12em;" data-font="cond">COND</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Overseer',system-ui,sans-serif;" data-font="ovsr">OVSR</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Nunito',system-ui,sans-serif;" data-font="nuni">NUN</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Pixelify',system-ui,sans-serif;" data-font="pxlf">PXL</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Orbitron',system-ui,sans-serif;" data-font="orbt">ORB</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Simpsons',system-ui,sans-serif;" data-font="somp">SMP</div>
          <div class="tb-swatch" style="display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:var(--text-light);font-family:'Limelight',system-ui,sans-serif;" data-font="lime">LIM</div>
        </div>
      </div>

      <!-- Harmony -->
      <div class="tb-card">
        <div class="tb-card-hdr" id="tbHarmonyHdr" style="display:flex;justify-content:space-between;padding:0 10px;"><span>Color Harmony</span><span id="tbHarmonyMode" style="color:var(--text-light);font-weight:var(--fw-bold);">Complementary</span></div>
        <div class="tb-harmony-row">
          <button class="tb-harmony-btn active" data-h="complementary">COM</button>
          <button class="tb-harmony-btn" data-h="analogous">ANA</button>
          <button class="tb-harmony-btn" data-h="triadic">TRI</button>
          <button class="tb-harmony-btn" data-h="tetradic">TET</button>
          <button class="tb-harmony-btn" data-h="split">SPL</button>
          <button class="tb-harmony-btn" data-h="accented">ACC</button>
          <button class="tb-harmony-btn" data-h="fibonacci">FIB</button>
          <button class="tb-harmony-btn" data-h="monochromatic">MON</button>
        </div>
        <div class="tb-harmony-swatches" id="tbHarmonySwatches"></div>
      </div>

      <!-- RGB Editor -->
      <div class="tb-card" style="flex:2;display:flex;flex-direction:column;overflow:hidden;">

        <!-- Row 1: header -->
        <div class="tb-card-hdr" style="flex-shrink:0;">
          <div class="tb-card-hdr-text">RGB Editor</div>
        </div>

        <!-- Row 2: undo | color preview with hex | redo -->
        <div style="display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;height:var(--job-half);">
          <button class="tb-hdr-btn disabled" id="tbUndoBtn"
            style="width:var(--job-half);font-size:16px;font-weight:900;border-right:var(--border-width) solid var(--border-color);border-left:none;border-top:none;border-bottom:none;flex-shrink:0;">&#9668;</button>
          <div id="tbColorPreview" style="flex:1;display:flex;align-items:center;justify-content:center;">
            <span id="tbHexDisplay" style="font-size:13px;font-weight:900;letter-spacing:0.12em;font-family:monospace;"></span>
          </div>
          <button class="tb-hdr-btn disabled" id="tbRedoBtn"
            style="width:var(--job-half);font-size:16px;font-weight:900;border-left:var(--border-width) solid var(--border-color);border-right:none;border-top:none;border-bottom:none;flex-shrink:0;">&#9658;</button>
        </div>

        <!-- Row 3: copy | paste -->
        <div style="display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;height:var(--qs-hdr);">
          <button class="tb-action-btn" id="tbCopyBtn"
            style="flex:1;height:auto;border:none;border-radius:0;border-right:var(--border-width) solid var(--border-color);font-size:var(--text-xs);">COPY</button>
          <button class="tb-action-btn" id="tbPasteBtn"
            style="flex:1;height:auto;border:none;border-radius:0;font-size:var(--text-xs);">PASTE</button>
        </div>

        <!-- Hidden hex input -->
        <input class="tb-hex-input" id="tbHexInput" type="text" maxlength="6" value="48A971" style="display:none;">

        <!-- Sliders - fill remaining height evenly -->
        <div class="tb-slider-section" style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;">
          <div class="tb-slider-row">
            <div class="tb-slider-lbl">R</div>
            <input type="range" class="tb-slider" id="tbSliderR" min="0" max="255" value="72">
            <div class="tb-slider-val" id="tbValR">72</div>
          </div>
          <div class="tb-slider-row">
            <div class="tb-slider-lbl">G</div>
            <input type="range" class="tb-slider" id="tbSliderG" min="0" max="255" value="169">
            <div class="tb-slider-val" id="tbValG">169</div>
          </div>
          <div class="tb-slider-row">
            <div class="tb-slider-lbl">B</div>
            <input type="range" class="tb-slider" id="tbSliderB" min="0" max="255" value="113">
            <div class="tb-slider-val" id="tbValB">113</div>
          </div>
          <div class="tb-slider-row">
            <div class="tb-slider-lbl">BR</div>
            <input type="range" class="tb-slider" id="tbSliderBr" min="0" max="100" value="47">
            <div class="tb-slider-val" id="tbValBr">47</div>
          </div>
          <div class="tb-slider-row">
            <div class="tb-slider-lbl">SA</div>
            <input type="range" class="tb-slider" id="tbSliderSa" min="0" max="100" value="40">
            <div class="tb-slider-val" id="tbValSa">40</div>
          </div>
        </div>

      </div>

      <!-- Demo Cards -->
      <div class="tb-card">
        <div class="tb-card-hdr">Preview</div>
        <div class="tb-demo-section" style="background:var(--bg-1);position:relative;overflow:hidden;">
          <div id="tbPreviewFxBack" style="position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;"></div>
          <div id="tbPreviewFxFore" style="position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden;"></div>
          <div style="position:relative;z-index:10;display:flex;flex-direction:column;gap:var(--margin);">

          <!-- label cards -->
          <div style="display:flex;gap:var(--margin);">
            <div class="label-card" style="flex:1;background:var(--bg-4);color:var(--text-dark);">Quick Schedule</div>
            <div class="label-card" style="flex:1;background:var(--bg-4);color:var(--text-dark);">History</div>
          </div>

          <!-- full width day card - one time, one OFF -->
          <div class="day-card" style="height:var(--job-half);">
            <div class="day-letter" style="font-size:var(--text-xs);">M</div>
            <div class="day-date" style="font-size:var(--text-xs);">27</div>
            <div class="day-body">
              <div class="day-body-half" style="font-size:var(--text-xs);">9:00 AM</div>
              <div class="day-body-half day-half-off" style="font-size:var(--text-xs);">OFF</div>
            </div>
            <div class="day-hours" style="font-size:var(--text-xs);">08.00</div>
          </div>

          <!-- job / QS / history - all same height side by side -->
          <div style="display:flex;gap:var(--margin);align-items:stretch;flex-shrink:0;min-height:64px;">

            <!-- job card -->
            <div style="flex:1;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;">
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--primary);border-bottom:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">DOMINO'S</div>
              <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-light);">19H 55M</div>
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--bg-2);border-top:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;gap:8px;">
                <svg width="10" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="var(--text-mid)"/></svg>
                <div style="display:flex;gap:3px;align-items:center;"><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px;"></div><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px;"></div></div>
                <div style="width:10px;height:7px;border-left:2px solid var(--primary);border-bottom:2px solid var(--primary);border-radius:1px;transform:rotate(-45deg) translate(1px,-1px);"></div>
              </div>
            </div>

            <!-- QS card -->
            <div style="flex:1;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;background:var(--accent);">
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--accent);border-bottom:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">Today</div>
              <div style="height:var(--job-half);background:var(--bg-2);position:relative;overflow:hidden;flex-shrink:0;">
                <div style="position:absolute;inset:0;display:flex;"><div style="flex:1;border-right:1px solid rgba(255,255,255,0.18);"></div><div style="flex:1;border-right:1px solid rgba(255,255,255,0.18);"></div><div style="flex:1;border-right:1px solid rgba(255,255,255,0.18);"></div><div style="flex:1;"></div></div>
                <div style="position:absolute;top:50%;left:10%;width:60%;transform:translateY(-50%);height:12px;background:var(--bg-4);border:2px solid var(--secondary);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:var(--text-dark);">9AM-5PM</div>
              </div>
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--accent);border-top:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:space-around;padding:0 4px;">
                <span style="font-size:8px;font-weight:800;color:var(--text-light);">9</span><span style="font-size:8px;font-weight:800;color:var(--text-light);">12</span><span style="font-size:8px;font-weight:800;color:var(--text-light);">3</span><span style="font-size:8px;font-weight:800;color:var(--text-light);">6</span>
              </div>
            </div>

            <!-- history card -->
            <div style="flex:1;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;">
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--secondary);border-bottom:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light);">This Week</div>
              <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-light);">MAY 25TH</div>
              <div style="height:var(--qs-hdr);box-sizing:border-box;flex-shrink:0;background:var(--secondary);border-top:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);color:var(--text-light);">38.50</div>
            </div>

          </div>
          </div><!-- end preview content -->
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:var(--margin);">
        <div class="delete-card" style="flex:1;height:var(--job-half);background:var(--primary);font-size:var(--text-xs);" onclick="ThemeSystem.openSaveModal()">Save Theme</div>
        <div class="delete-card" style="flex:1;height:var(--job-half);background:var(--bg-2);color:var(--text-light);font-size:var(--text-xs);" onclick="ThemeSystem.resetToDefaults()">Reset to Defaults</div>
      </div>

    </div>

    <!-- IMPORT/EXPORT PANEL -->
    <div class="tb-tab-panel tb-body" id="tbPanel-io">
      <div class="label-card">Export</div>
      <div style="font-size:var(--text-xs);color:var(--text-light);padding:2px 4px 4px;">Copy your theme data to share or back up</div>
      <textarea id="tbExportField" readonly
        style="flex:1;background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-xs);font-family:monospace;padding:8px;resize:none;outline:none;min-height:80px;"></textarea>
      <div class="delete-card" onclick="tbCopyExport()" style="background:var(--primary);flex-shrink:0;">Copy to Clipboard</div>
      <div id="tbExportStatus" style="font-size:var(--text-xs);color:var(--text-light);text-align:center;padding:2px;min-height:16px;"></div>

      <div class="label-card">Import</div>
      <div style="font-size:var(--text-xs);color:var(--text-light);padding:2px 4px 4px;">Paste theme data to load a shared theme</div>
      <textarea id="tbImportField"
        style="flex:1;background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-xs);font-family:monospace;padding:8px;resize:none;outline:none;min-height:80px;"
        placeholder='{"name":"My Theme","baseColors":{...},"jobColors":{...}}'></textarea>
      <div class="delete-card" onclick="tbDoImport()" style="background:var(--secondary);flex-shrink:0;">Import Theme</div>
      <div id="tbImportStatus" style="font-size:var(--text-xs);color:var(--text-light);text-align:center;padding:2px;min-height:16px;"></div>
    </div>

    <!-- SAVED PANEL -->
    <div class="tb-tab-panel tb-body" id="tbPanel-saved">
      <div id="tbSavedList" style="display:flex;flex-direction:column;gap:var(--margin);"></div>
    </div>

    <!-- SAVE MODAL -->
    <div id="tbSaveModal" style="display:none;position:fixed;inset:0;z-index:11000;align-items:center;justify-content:center;backdrop-filter:blur(6px);background:rgba(0,0,0,0.3);">
      <div style="background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:90%;max-width:320px;overflow:hidden;">
        <div class="label-card" style="border-radius:0;border:none;border-bottom:var(--border-width) solid var(--border-color);">Save Theme</div>
        <div style="padding:var(--margin);">
          <input id="tbThemeNameInput" type="text" placeholder="Theme name-"
            style="width:100%;height:var(--card-height);background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);color:var(--text-light);font-size:var(--text-sm);font-weight:var(--fw-bold);padding:0 12px;"
            onkeypress="if(event.key==='Enter')ThemeSystem.confirmSave()">
        </div>
        <div style="display:flex;gap:var(--margin);padding:0 var(--margin) var(--margin);">
          <div class="delete-card" style="flex:1;background:var(--bg-3);color:var(--text-light);" onclick="ThemeSystem.closeSaveModal()">Cancel</div>
          <div class="delete-card" style="flex:1;background:var(--primary);" onclick="ThemeSystem.confirmSave()">Save</div>
        </div>
      </div>
    </div>

    <div id="tbRandPanelSlot"></div>

        <!-- OVERWRITE MODAL -->
    <div id="tbOverwriteModal" style="display:none;position:fixed;inset:0;z-index:11000;align-items:center;justify-content:center;backdrop-filter:blur(6px);background:rgba(0,0,0,0.3);">
      <div style="background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:90%;max-width:320px;overflow:hidden;">
        <div class="label-card" style="border-radius:0;border:none;border-bottom:var(--border-width) solid var(--border-color);">Overwrite Theme?</div>
        <div style="padding:12px;text-align:center;font-size:var(--text-xs);color:var(--text-light);">A theme with this name already exists.</div>
        <div style="display:flex;gap:var(--margin);padding:0 var(--margin) var(--margin);">
          <div class="delete-card" style="flex:1;background:var(--bg-3);color:var(--text-light);" onclick="ThemeSystem.cancelOverwrite()">Cancel</div>
          <div class="delete-card" style="flex:1;background:var(--color-1);" onclick="ThemeSystem.confirmOverwrite()">Overwrite</div>
        </div>
      </div>
    </div>
  `;document.body.appendChild(win);(function(){var ns='http://www.w3.org/2000/svg';var svg=document.createElementNS(ns,'svg');svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('viewBox','0 0 50 50');var l1=document.createElementNS(ns,'line');var l2=document.createElementNS(ns,'line');[l1,l2].forEach(function(l){l.setAttribute('stroke','currentColor');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});l1.setAttribute('x1','42');l1.setAttribute('y1','10');l1.setAttribute('x2','8');l1.setAttribute('y2','25');l2.setAttribute('x1','42');l2.setAttribute('y1','40');l2.setAttribute('x2','8');l2.setAttribute('y2','25');svg.appendChild(l1);svg.appendChild(l2);var el=document.getElementById('themeWindowBack');if(el&&!el.querySelector('svg'))el.appendChild(svg);})();
}

/* ---------------------------------------
   INIT
--------------------------------------- */

(function tbEarlyApply() {
  const savedName = localStorage.getItem('shift_current_theme');if (!savedName) return;const themes = JSON.parse(localStorage.getItem('shift_themes') || '[]');const theme = themes.find(t => t.name === savedName);if (!theme) return;const root = document.documentElement;const bc = Object.assign({}, TB_DEFAULTS.baseColors, theme.baseColors);const jc = Object.assign({}, TB_DEFAULTS.jobColors, theme.jobColors);Object.keys(bc).forEach(k => { const v = TB_BASE_VAR_MAP[k]; if (v) root.style.setProperty(v, bc[k]); });Object.keys(jc).forEach(k => { const v = TB_JOB_VAR_MAP[k]; if (v) root.style.setProperty(v, jc[k]); });
})();
(function(){
function _H(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r,g,b;if(h<60){r=c;g=x;b=0}else if(h<120){r=x;g=c;b=0}else if(h<180){r=0;g=c;b=x}else if(h<240){r=0;g=x;b=c}else if(h<300){r=x;g=0;b=c}else{r=c;g=0;b=x}return'#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
function _hexHsl(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return[0,0,Math.round(l*100)];const d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn);let hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;return[Math.round(hh/6*360),Math.round(s*100),Math.round(l*100)];}
function _lum(hex){const[r,g,b]=[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255].map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*r+0.7152*g+0.0722*b;}
function _ratio(a,b){const la=_lum(a),lb=_lum(b);return(Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);}
function _rnd(a,b){return a+Math.random()*(b-a);}
function _pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

let _tbBgRel='random', _tbHarm='random', _tbSurf='random', _tbTone='mix';function _setBgChip(id,val){document.querySelectorAll('#'+id+' .tb-swatch').forEach(c=>{c.style.background='';c.style.color='';});}

window.tbRandSetBg=function(v,el){_tbBgRel=v;document.querySelectorAll('#tbRandBgChips .tb-rand-chip').forEach(c=>{c.style.background='';c.style.color='';});el.style.background='var(--primary)';el.style.color='var(--text-light)';document.getElementById('tbRandBgLabel').textContent=el.dataset.val;};
window.tbRandSetHarm=function(v,el){_tbHarm=v;document.querySelectorAll('#tbRandHarmChips .tb-rand-chip').forEach(c=>{c.style.background='';c.style.color='';});el.style.background='var(--primary)';el.style.color='var(--text-light)';document.getElementById('tbRandHarmLabel').textContent=el.dataset.val;};
window.tbRandSetSurf=function(v,el){_tbSurf=v;document.querySelectorAll('#tbRandSurfChips .tb-rand-chip').forEach(c=>{c.style.background='';c.style.color='';});el.style.background='var(--primary)';el.style.color='var(--text-light)';document.getElementById('tbRandSurfLabel').textContent=el.dataset.val;};
window.tbRandSetTone=function(v,el){_tbTone=v;document.querySelectorAll('#tbRandToneChips .tb-rand-chip').forEach(c=>{c.style.background='';c.style.color='';});el.style.background='var(--primary)';el.style.color='var(--text-light)';document.getElementById('tbRandToneLabel').textContent=el.dataset.val;};function _tbGetPrimary(fixed){
  const hue=+(document.getElementById('tbHueS')||{value:140}).value;const bri=+(document.getElementById('tbBriS')||{value:48}).value;const sat=+(document.getElementById('tbSatS')||{value:65}).value;return _H(hue,sat||1,bri||1);
}

function _tbUpdatePrimaryCard(){
  const hex=_tbGetPrimary();const el=document.getElementById('tbRandPrimary');if(!el)return;el.style.background=hex;el.style.color=_lum(hex)>0.25?'#111':'#f2f2f2';el.textContent=hex.toUpperCase();
}

['tbHueS','tbBriS','tbSatS'].forEach(function(id){
  setTimeout(function(){
    const el=document.getElementById(id);if(el)el.addEventListener('input',_tbUpdatePrimaryCard);},500);
});function _tbMakeTheme(primaryHex,fixed){
  const [h,s,l]=_hexHsl(primaryHex);const bri=fixed?+(document.getElementById('tbBriS')||{value:48}).value:Math.round(_rnd(8,60));const sat=fixed?+(document.getElementById('tbSatS')||{value:65}).value:Math.round(_rnd(12,88));const m=_tbTone==='mix'?_pick(['dark','mid','light']):_tbTone;const harmSchemes={complementary:[180,150],analogous:[30,-30],triadic:[120,240],tetradic:[90,270],split:[150,210],accented:[20,150],fibonacci:[137.508,275.016],monochromatic:[0,0],'double-comp':[180,90],'near-comp':[160,200],rectangle:[60,180]};const harmKeys=Object.keys(harmSchemes);const schemeName=_tbHarm==='random'?_pick(harmKeys):_tbHarm;const offsets=harmSchemes[schemeName]||harmSchemes.complementary;const secH=(h+offsets[0]+_rnd(-8,8)+360)%360;const accH=schemeName==='monochromatic'?h:(h+offsets[1]+_rnd(-8,8)+360)%360;const priS=Math.min(sat,95);const priSatMod=fixed?sat:(Math.random()<0.15?Math.min(sat*0.2,15):sat);const clampL=v=>Math.max(5,Math.min(95,v));const pri=fixed?primaryHex:_H(h,priSatMod,clampL(bri));const sec=_H(secH,schemeName==='monochromatic'?priS*0.8:Math.min(priS*0.9,88),clampL(schemeName==='monochromatic'?bri+14:bri));const acc=_H(accH,schemeName==='monochromatic'?priS*0.6:Math.min(priS*0.8,80),clampL(schemeName==='monochromatic'?bri-12:bri));const c1=_H(355,_tbTone==='dark'?70:_tbTone==='mid'?65:60,_tbTone==='dark'?52:_tbTone==='mid'?48:44);const bgStrats={'primary-dark':()=>({bgH:h+_rnd(-8,8),bgS:_rnd(16,30),isPrimaryDark:true}),'complement':()=>({bgH:(h+180+_rnd(-10,10))%360,bgS:_rnd(7,16)}),'analogous':()=>({bgH:(h+_pick([30,-30,45,-45])+_rnd(-8,8)+360)%360,bgS:_rnd(7,16)}),'contrast90':()=>({bgH:(h+_pick([90,270])+_rnd(-8,8)+360)%360,bgS:_rnd(5,14)}),'warm-neutral':()=>({bgH:_pick([25,30,35,20])+_rnd(-5,5),bgS:_rnd(7,16)}),'cool-neutral':()=>({bgH:_pick([200,210,220,195])+_rnd(-5,5),bgS:_rnd(7,16)}),'true-grey':()=>({bgH:_rnd(0,30),bgS:_rnd(0,3)}),'earthy':()=>({bgH:_pick([22,28,35,18,40])+_rnd(-5,5),bgS:_rnd(10,22)}),'triadic-bg':()=>({bgH:(h+120+_rnd(-8,8))%360,bgS:_rnd(8,16)}),'split-bg':()=>({bgH:(h+150+_rnd(-8,8))%360,bgS:_rnd(8,16)}),'secondary-bg':()=>({bgH:(h+35+_rnd(-6,6))%360,bgS:_rnd(10,18)})};const bgKey=_tbBgRel==='random'?_pick(Object.keys(bgStrats)):_tbBgRel;const bgPick=(bgStrats[bgKey]||bgStrats.complement)();const {bgH,bgS,isPrimaryDark}=bgPick;const bg1Strat=_pick([()=>({h:isPrimaryDark?h:bgH,s:bgS+2}),()=>({h:h,s:Math.min(priS*0.5,40)}),()=>({h:secH,s:Math.min(priS*0.45,40)}),()=>({h:0,s:0})]);const b1=bg1Strat();const b1H=b1.h,b1S=b1.s;const w=()=>_rnd(-2,2);let bg1,bg2,bg3;if(m==='dark'){bg1=_H(b1H,b1S,12+w());bg2=_H(b1H,b1S-2+w(),20+w());bg3=_H(b1H,b1S+1+w(),7+w());}
  else if(m==='mid'){bg1=_H(b1H,b1S,26+w());bg2=_H(b1H,b1S-2+w(),34+w());bg3=_H(b1H,b1S+1+w(),18+w());}
  else{bg1=_H(b1H,b1S,93+w());bg2=_H(b1H,b1S-2+w(),85+w());bg3=_H(b1H,b1S+1+w(),77+w());}
  const WHITE='#f2f2f2',BLACK='#111111';const actions=[pri,sec,acc];const worstW=Math.min(...actions.map(c=>_ratio(WHITE,c)));const worstB=Math.min(...actions.map(c=>_ratio(BLACK,c)));const tl=worstW>=worstB?WHITE:BLACK;const tm=_lum(bg2)>0.3?_H(b1H,20,35):_H(b1H,12,65);let border;if(m==='light'){border=_pick(['#000000',_H(b1H,15,20),_H(b1H,12,28)]);}
  else{border=_pick([_H(b1H,Math.max(b1S,5),4),'#000000',_H(h,Math.min(priS*0.3,20),5)]);}
  const surfNames=['white','off-white','light primary','dark primary','light secondary','dark secondary','light accent','tinted neutral','light complement','pure grey','4th harmony','dark accent'];const surfFns=[()=>({bg4:'#ffffff',td:_H(b1H,bgS+4,5)}),()=>({bg4:_H(b1H,bgS+4,_rnd(94,98)),td:_H(b1H,bgS+4,5)}),()=>({bg4:_H(h,Math.min(priS*0.5,40),_rnd(88,94)),td:_H(h,priS*0.6,8)}),()=>({bg4:_H(h,Math.min(priS*0.7,60),_rnd(20,32)),td:_H(b1H,6,92)}),()=>({bg4:_H(secH,Math.min(priS*0.5,40),_rnd(86,93)),td:_H(secH,priS*0.5,8)}),()=>({bg4:_H(secH,Math.min(priS*0.7,60),_rnd(20,32)),td:_H(b1H,6,92)}),()=>({bg4:_H(accH,Math.min(priS*0.4,35),_rnd(88,94)),td:_H(accH,priS*0.5,8)}),()=>({bg4:_H(b1H,bgS+_rnd(2,6),_rnd(78,86)),td:_H(b1H,bgS+4,8)}),()=>({bg4:_H((h+180)%360,Math.min(priS*0.4,35),_rnd(86,93)),td:_H((h+180)%360,priS*0.5,8)}),()=>({bg4:_H(b1H,0,_rnd(90,96)),td:_H(b1H,0,8)}),()=>{const q=(h+offsets[1]*1.5+360)%360;return{bg4:_H(q,Math.min(priS*0.55,50),48),td:_lum(_H(q,Math.min(priS*0.55,50),48))>0.35?_H(q,20,8):_H(q,8,94)};},()=>({bg4:_H(accH,Math.min(priS*0.7,60),_rnd(20,32)),td:_H(b1H,6,92)})];const surfIdx=_tbSurf==='random'?Math.floor(Math.random()*surfFns.length):Math.max(0,surfNames.indexOf(_tbSurf));let{bg4,td}=surfFns[surfIdx]();if(_ratio(td,bg4)<4)td=_lum(bg4)>0.5?_H(b1H,bgS+4,4):_H(b1H,6,92);const swHues=[0,...offsets,60,90,120,150,180,210,270].slice(0,10).map(o=>_H((h+o+360)%360,Math.min(sat*0.9,82),bri));return{bg1,bg2,bg3,bg4,pri,sec,acc,c1,border,tl,tm,td,sw:swHues};
}

window.tbRandRandom=function(){
  const randHue=Math.floor(Math.random()*360);const randBri=Math.round(_rnd(8,60));const randSat=Math.round(_rnd(12,88));const hu=document.getElementById('tbHueS');const br=document.getElementById('tbBriS');const sa=document.getElementById('tbSatS');if(hu)hu.value=randHue;if(br)br.value=randBri;if(sa)sa.value=randSat;_tbUpdatePrimaryCard();const t=_tbMakeTheme(_H(randHue,randSat,randBri),true);_tbApplyRandTheme(t);
};window.tbRandApply=function(){
  const t=_tbMakeTheme(_tbGetPrimary(),true);_tbApplyRandTheme(t);
};function _tbApplyRandTheme(t){
  const bc={bg1:t.bg1,bg2:t.bg2,bg3:t.bg3,bg4:t.bg4,primary:t.pri,secondary:t.sec,accent:t.acc,color1:t.c1,border:t.border,textLight:t.tl,textMid:t.tm,textDark:t.td};const jc=Object.fromEntries(t.sw.map((c,i)=>['swatch'+(i+1),c]));ThemeSystem.baseColors={...ThemeSystem.baseColors,...bc};ThemeSystem.jobColors={...ThemeSystem.jobColors,...jc};tbApplyCssVars(ThemeSystem.baseColors,ThemeSystem.jobColors);ThemeSystem.renderBaseSwatches();ThemeSystem.renderJobSwatches();
}

setTimeout(_tbUpdatePrimaryCard,600);
})();function tbEncodeTheme(baseColors, jobColors) {
  const parts = [];Object.keys(baseColors).forEach(k => parts.push(k + ':' + baseColors[k].replace('#','')));Object.keys(jobColors).forEach(k  => parts.push(k + ':' + jobColors[k].replace('#','')));if (typeof getOverlayCfg === 'function') {
    const oc = getOverlayCfg();if (oc.overlay && oc.overlay !== 'none') {
      parts.push('overlay:' + oc.overlay);const ovCfg = oc[oc.overlay] || {};Object.keys(ovCfg).forEach(k => parts.push('ov_' + k + ':' + ovCfg[k]));}
  }
  return parts.join('|');
}

function tbDecodeTheme(str) {
  const baseKeys = Object.keys(TB_BASE_VAR_MAP);const jobKeys  = Object.keys(TB_JOB_VAR_MAP);const baseColors = {}, jobColors = {}, overlayData = {};str.split('|').forEach(part => {
    const [k, ...rest] = part.split(':');const v = rest.join(':');if (!k || v === undefined) return;if (k === 'overlay') { overlayData.overlay = v; return; }
    if (k.startsWith('ov_')) { overlayData[k.slice(3)] = v; return; }
    const hex = '#' + v.replace(/[^0-9A-Fa-f]/g,'').substring(0,6);if (hex.length !== 7) return;if (baseKeys.includes(k))      baseColors[k] = hex;else if (jobKeys.includes(k))  jobColors[k]  = hex;});return { baseColors, jobColors, overlayData };
}

function tbPopulateExport() {
  const field = document.getElementById('tbExportField');if (!field || typeof ThemeSystem === 'undefined') return;field.value = tbEncodeTheme(ThemeSystem.baseColors, ThemeSystem.jobColors);
}

function tbCopyExport() {
  const field = document.getElementById('tbExportField');const status = document.getElementById('tbExportStatus');if (!field || !field.value) return;navigator.clipboard.writeText(field.value).then(() => {
    if (status) { status.textContent = 'Copied!'; status.style.color = 'var(--primary)'; setTimeout(() => status.textContent = '', 2000); }
  }).catch(() => {
    field.select(); document.execCommand('copy');if (status) { status.textContent = 'Copied!'; status.style.color = 'var(--primary)'; setTimeout(() => status.textContent = '', 2000); }
  });
}

function tbDoImport() {
  const field  = document.getElementById('tbImportField');const status = document.getElementById('tbImportStatus');if (!field || !field.value.trim()) return;try {
    const raw = field.value.trim();if (typeof ThemeSystem === 'undefined') return;let baseColors, jobColors, overlayData = {};if (raw.includes(':') && raw.includes('|')) {
      const decoded = tbDecodeTheme(raw);baseColors = decoded.baseColors;jobColors  = decoded.jobColors;overlayData = decoded.overlayData || {};} else {
      const data = JSON.parse(raw);if (!data.baseColors && !data.jobColors) throw new Error('Invalid theme data');baseColors = data.baseColors;jobColors  = data.jobColors;overlayData = data.overlayData || {};}
    ThemeSystem.baseColors = Object.assign({}, TB_DEFAULTS.baseColors, baseColors);ThemeSystem.jobColors  = Object.assign({}, TB_DEFAULTS.jobColors,  jobColors);tbApplyCssVars(ThemeSystem.baseColors, ThemeSystem.jobColors);tbRerender();ThemeSystem.render();if (overlayData && overlayData.overlay && typeof setOverlay === 'function') {
      setOverlay(overlayData.overlay);const cfg = typeof getOverlayCfg === 'function' ? getOverlayCfg() : {};const ovId = overlayData.overlay;if (!cfg[ovId]) cfg[ovId] = {};Object.keys(overlayData).forEach(k => { if (k !== 'overlay') cfg[ovId][k] = overlayData[k]; });if (typeof applyOverlay === 'function') applyOverlay();}
    field.value = '';if (status) { status.textContent = 'Theme imported!'; status.style.color = 'var(--primary)'; setTimeout(() => status.textContent = '', 2000); }
    document.querySelectorAll('.tb-tab').forEach(b => b.classList.remove('active'));document.querySelectorAll('.tb-tab-panel').forEach(p => p.classList.remove('active'));const edTab = document.querySelector('.tb-tab[data-tab="editor"]');const edPanel = document.getElementById('tbPanel-editor');if (edTab) edTab.classList.add('active');if (edPanel) edPanel.classList.add('active');} catch(e) {
    if (status) { status.textContent = 'Error: ' + e.message; status.style.color = 'var(--color-1)'; }
  }
}

/* --------------------------------------
   THEME BUILDER FILTER ENGINE
-------------------------------------- */
let tbFilterIntervals = [], tbFilterRAFs = [];
let tbCurrentAnimFilter = 'none';
let tbCurrentStatFilter = 'none';function tbClearFilters() {
  tbFilterIntervals.forEach(id => { clearInterval(id); clearTimeout(id); });tbFilterIntervals = [];tbFilterRAFs.forEach(cancelAnimationFrame);tbFilterRAFs = [];const fx = document.getElementById('tbFx');if (fx) fx.innerHTML = '';document.getElementById('themeBuilderWindow').style.filter = '';
}

function tbGetFx() {
  let fx = document.getElementById('tbFx');if (!fx) {
    fx = document.createElement('div');fx.id = 'tbFx';fx.style.cssText = 'position:fixed;inset:0;z-index:9500;pointer-events:none;overflow:hidden;';document.getElementById('themeBuilderWindow').appendChild(fx);}
  return fx;
}

function tbSetAnimFilter(name) {
  tbCurrentAnimFilter = name;tbClearFilters();['none','grain','crt','static','neon','phosphor'].forEach(n => {
    const el = document.getElementById('af' + n.charAt(0).toUpperCase() + n.slice(1));if (el) el.style.background = n === name ? 'var(--primary)' : 'var(--bg-3)';if (el) el.style.color = n === name ? 'var(--text-light)' : 'var(--text-mid)';});const nameEl = document.getElementById('tbAnimFilterName');const names = {none:'None',grain:'Film Grain',crt:'CRT',static:'Static',neon:'Neon Glow',phosphor:'Phosphor'};if (nameEl) nameEl.textContent = names[name] || name;tbApplyStatFilter(tbCurrentStatFilter);if (name === 'grain')    tbStartGrain();if (name === 'crt')      tbStartCRT();if (name === 'static')   tbStartStatic();if (name === 'neon')     tbStartNeon();if (name === 'phosphor') tbStartPhosphor();
}

function tbSetStatFilter(name) {
  tbCurrentStatFilter = name;['none','comic','dither','paper','halftone'].forEach(n => {
    const el = document.getElementById('sf' + n.charAt(0).toUpperCase() + n.slice(1));if (el) el.style.background = n === name ? 'var(--secondary)' : 'var(--bg-3)';if (el) el.style.color = n === name ? 'var(--text-light)' : 'var(--text-mid)';});const nameEl = document.getElementById('tbStatFilterName');const names = {none:'None',comic:'Comic',dither:'Dither',paper:'Paper',halftone:'Halftone'};if (nameEl) nameEl.textContent = names[name] || name;tbApplyStatFilter(name);
}

function tbApplyStatFilter(name) {
  const win = document.getElementById('themeBuilderWindow');if (!win) return;['tbStatCanvas'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });win.style.filter = '';if (name === 'none') return;if (name === 'comic') {
    const c = document.createElement('canvas');c.id = 'tbStatCanvas';c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9400;opacity:0.12;mix-blend-mode:multiply;';c.width = window.innerWidth; c.height = window.innerHeight;const ctx = c.getContext('2d');ctx.fillStyle = '#ff6b6b';for (let y=0;y<c.height;y+=8) for (let x=0;x<c.width;x+=8) { const o=(Math.floor(y/8)%2)*4; ctx.beginPath(); ctx.arc(x+o,y,2.5,0,Math.PI*2); ctx.fill(); }
    win.appendChild(c);win.style.filter = 'contrast(1.15)';}

  if (name === 'dither') {
    const c = document.createElement('canvas');c.id = 'tbStatCanvas';c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9400;opacity:0.15;';c.width = window.innerWidth; c.height = window.innerHeight;const ctx = c.getContext('2d');const img = ctx.createImageData(c.width, c.height);const m = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];for (let y=0;y<c.height;y++) for (let x=0;x<c.width;x++) {
      const t = m[y%4][x%4]/16;const v = t > 0.5 ? 255 : 0;const i = (y*c.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=60;}
    ctx.putImageData(img,0,0);win.appendChild(c);win.style.filter = 'grayscale(0.3) contrast(1.1)';}

  if (name === 'paper') {
    const c = document.createElement('canvas');c.id = 'tbStatCanvas';c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9400;opacity:0.18;mix-blend-mode:multiply;';c.width = window.innerWidth; c.height = window.innerHeight;const ctx = c.getContext('2d');ctx.strokeStyle = 'rgba(180,140,90,0.4)'; ctx.lineWidth = 1;for (let i=0;i<40;i++) {
      ctx.beginPath();const x1=Math.random()*c.width, y1=Math.random()*c.height;const x2=x1+(Math.random()-0.5)*200, y2=y1+(Math.random()-0.5)*200;ctx.moveTo(x1,y1); ctx.bezierCurveTo(x1+(Math.random()-0.5)*60,y1+(Math.random()-0.5)*60,x2+(Math.random()-0.5)*60,y2+(Math.random()-0.5)*60,x2,y2);ctx.stroke();}
    const img = ctx.createImageData(c.width, c.height);for (let i=0;i<img.data.length;i+=4) { const v=200+Math.random()*55; img.data[i]=v;img.data[i+1]=v-20;img.data[i+2]=v-40;img.data[i+3]=20; }
    ctx.putImageData(img,0,0);win.appendChild(c);win.style.filter = 'sepia(0.15) contrast(1.05)';}

  if (name === 'halftone') {
    const c = document.createElement('canvas');c.id = 'tbStatCanvas';c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9400;opacity:0.12;';c.width = window.innerWidth; c.height = window.innerHeight;const ctx = c.getContext('2d');const layers = [{col:'rgba(0,180,220,1)',angle:15,sp:10},{col:'rgba(220,0,100,1)',angle:75,sp:10},{col:'rgba(220,180,0,1)',angle:45,sp:12}];layers.forEach(({col,angle,sp}) => {
      ctx.fillStyle = col; ctx.save();ctx.translate(c.width/2,c.height/2); ctx.rotate(angle*Math.PI/180);for (let y=-c.height;y<c.height*2;y+=sp) for (let x=-c.width;x<c.width*2;x+=sp) { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }
      ctx.restore();});win.appendChild(c);win.style.filter = 'contrast(1.1)';}
}

function tbStartGrain() {
  const fx = tbGetFx();const c = document.createElement('canvas');c.width=window.innerWidth; c.height=window.innerHeight;c.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0.22;';fx.appendChild(c);const ctx = c.getContext('2d');function draw() {
    if (tbCurrentAnimFilter !== 'grain') return;const img=ctx.createImageData(c.width,c.height);for (let y=0;y<c.height;y+=3) for (let x=0;x<c.width;x+=3) {
      const v=Math.random()*255;for (let dy=0;dy<3;dy++) for (let dx=0;dx<3;dx++) { const i=((y+dy)*c.width+(x+dx))*4; if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*60;} }
    }
    ctx.putImageData(img,0,0);tbFilterRAFs.push(requestAnimationFrame(draw));}
  draw();
}

function tbStartCRT() {
  const win = document.getElementById('themeBuilderWindow');win.style.filter = 'brightness(0.75) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)';const fx = tbGetFx();const sl = document.createElement('div');sl.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2px,rgba(0,0,0,0.4) 2px,rgba(0,0,0,0.4) 3px);';fx.appendChild(sl);const vg = document.createElement('div');vg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.92) 100%);';fx.appendChild(vg);const glow = document.createElement('div');glow.style.cssText = 'position:absolute;inset:0;background:rgba(0,255,60,0.18);mix-blend-mode:screen;';fx.appendChild(glow);let wave = document.createElement('div');wave.style.cssText = 'position:absolute;left:0;right:0;height:40px;background:linear-gradient(to bottom,transparent,rgba(0,255,60,0.06),transparent);top:0;';fx.appendChild(wave);let wy=0, crtB=0.75, crtT=0.75;tbFilterIntervals.push(setInterval(() => { wy=(wy+2)%window.innerHeight; wave.style.top=wy+'px'; },16));tbFilterIntervals.push(setInterval(() => {
    if (tbCurrentAnimFilter!=='crt') return;if (Math.random()<0.04) crtT=0.68+Math.random()*0.14;crtB+=(crtT-crtB)*0.06;win.style.filter=`brightness(${crtB.toFixed(3)}) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)`;},16));
}

function tbStartStatic() {
  const fx = tbGetFx();const c = document.createElement('canvas');c.width=window.innerWidth; c.height=window.innerHeight;c.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0.18;';fx.appendChild(c);const ctx=c.getContext('2d');const win=document.getElementById('themeBuilderWindow');function draw() {
    if (tbCurrentAnimFilter!=='static') return;const img=ctx.createImageData(c.width,c.height);for (let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=180;}
    ctx.putImageData(img,0,0);tbFilterRAFs.push(requestAnimationFrame(draw));}
  draw();let bwB=0.9, bwT=0.9, bwFading=false;tbFilterIntervals.push(setInterval(()=>{
    if (!bwFading&&Math.random()<0.06){bwFading=true;bwT=0.45+Math.random()*0.35;c.style.transition=`opacity ${300+Math.random()*400}ms ease`;c.style.opacity=0.45+Math.random()*0.35;setTimeout(()=>{bwT=0.9;c.style.transition=`opacity ${400+Math.random()*500}ms ease`;c.style.opacity='0.18';setTimeout(()=>{bwFading=false;},600);},300+Math.random()*800);}
  },800));tbFilterIntervals.push(setInterval(()=>{if(tbCurrentAnimFilter!=='static')return;bwB+=(bwT-bwB)*0.08;win.style.filter=`grayscale(1) contrast(1.1) brightness(${bwB.toFixed(3)})`;},16));
}

function tbStartNeon() {
  const fx = tbGetFx();const gl = document.createElement('div');gl.style.cssText='position:absolute;inset:0;background:rgba(0,255,180,0.04);mix-blend-mode:screen;';fx.appendChild(gl);function spawnBurst() {
    if (tbCurrentAnimFilter!=='neon') return;const b=document.createElement('div');const size=40+Math.random()*120;const cols=['rgba(0,255,180,0.35)','rgba(180,0,255,0.3)','rgba(0,180,255,0.3)','rgba(255,0,180,0.25)'];b.style.cssText=`position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,${cols[Math.floor(Math.random()*4)]} 0%,transparent 70%);filter:blur(${size*0.3}px);opacity:0;`;fx.appendChild(b);setTimeout(()=>{b.style.transition='opacity 0.05s';b.style.opacity='1';},10);setTimeout(()=>{b.style.opacity='0';setTimeout(()=>b.remove(),100);},50+Math.random()*150);tbFilterIntervals.push(setTimeout(spawnBurst,200+Math.random()*800));}
  spawnBurst();document.getElementById('themeBuilderWindow').style.filter='brightness(1.05) saturate(2) contrast(1.2)';tbFilterIntervals.push(setInterval(()=>{if(tbCurrentAnimFilter!=='neon')return;const b=0.9+Math.random()*0.25;document.getElementById('themeBuilderWindow').style.filter=`brightness(${b}) saturate(2) contrast(1.2)`;},120));
}

function tbStartPhosphor() {
  const win=document.getElementById('themeBuilderWindow');const fx=tbGetFx();const wave=document.createElement('div');wave.style.cssText='position:absolute;left:0;right:0;height:60px;background:linear-gradient(to bottom,transparent,rgba(0,255,100,0.08),transparent);top:0;';fx.appendChild(wave);let wy=0,pB=0.95,pT=0.95;tbFilterIntervals.push(setInterval(()=>{wy=(wy+1.5)%window.innerHeight;wave.style.top=wy+'px';},16));tbFilterIntervals.push(setInterval(()=>{if(tbCurrentAnimFilter!=='phosphor')return;if(Math.random()<0.04)pT=0.88+Math.random()*0.14;pB+=(pT-pB)*0.07;win.style.filter=`brightness(${pB.toFixed(3)})`;},16));
}

function tbBuildLayerWrap(id) {
  const wrap = document.getElementById('tbLayerWrap');if (!wrap) return;wrap.innerHTML = '';const LAYER_F = ['grn','crt','stt','dtr','crs','vgn','plm','hlg'];const LAYER_M = ['prx'];if (![...LAYER_F,...LAYER_M].includes(id)) return;const cfg = typeof getOverlayCfg === 'function' ? getOverlayCfg() : {};const opts = LAYER_M.includes(id) ? ['under','mixed','over'] : ['under','over'];opts.forEach(v => {
    const b = document.createElement('button');b.textContent = v.charAt(0).toUpperCase() + v.slice(1);const isOn = (cfg[id]||{}).layer === v;b.style.cssText = `height:13px;padding:0 8px;border:var(--border-width) solid var(--border-color);border-radius:99px;background:${isOn?'var(--secondary)':'var(--bg-2)'};color:${isOn?'var(--text-light)':'var(--text-light)'};font-size:9px;font-weight:800;text-transform:uppercase;cursor:pointer;`;b.onclick = () => {
      if (cfg[id]) cfg[id].layer = v;if (typeof lsSet === 'function') lsSet('sch_settings', appSettings);tbBuildLayerWrap(id);if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview(id);if (typeof applyOverlay === 'function') applyOverlay();};wrap.appendChild(b);});
}

window.addEventListener('load', function () {
  tbBuildWindow();const savedName = localStorage.getItem('shift_current_theme');if (savedName) {
    const themes = JSON.parse(localStorage.getItem('shift_themes') || '[]');const theme = themes.find(t => t.name === savedName);if (theme && typeof jobs !== 'undefined') {
      const jc = Object.assign({}, TB_DEFAULTS.jobColors, theme.jobColors);const swatchMap = {};Object.keys(jc).forEach(k => {
        const oldHex = (TB_DEFAULTS.jobColors[k] || '').toLowerCase();const newHex = jc[k].toLowerCase();if (oldHex && oldHex !== newHex) swatchMap[oldHex] = newHex;});if (Object.keys(swatchMap).length > 0) {
        let changed = false;jobs.forEach(job => {
          if (!job.color) return;const mapped = swatchMap[job.color.toLowerCase()];if (mapped) { job.color = mapped; changed = true; }
        });if (changed && typeof lsSet === 'function') lsSet('sch_jobs', jobs);}
    }
  }
  const savedThemeName2 = localStorage.getItem('shift_current_theme');if (savedThemeName2) {
    const themes2 = JSON.parse(localStorage.getItem('shift_themes') || '[]');const theme2 = themes2.find(t => t.name === savedThemeName2);if (theme2 && typeof tbApplyThemeFilters === 'function') {
      tbApplyThemeFilters(theme2.animFilter || 'none', theme2.statFilter || 'none');}
  }
  tbRerender();if (typeof updateSettingsUI === 'function') updateSettingsUI();
});
