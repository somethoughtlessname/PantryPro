/* ── PANTRY PRO · styles.js ── */
(function(){
  const s = document.createElement('style');
  s.textContent = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }

:root {
  --margin: 4px;
  --card-height: 45px;
  --drop-height: 32px;
  --border-width: 3px;
  --border-color: #000;
  --radius: 8px;
  --bg-1: #111920;
  --bg-2: #374151;
  --bg-3: #0f1520;
  --bg-4: #636B76;
  --color-1: #C85A5A;
  --color-4: #48a971;
  --color-4-2: #3a875a;
  --color-10: #ffffff;
  --muted: #9ca3af;
}

html, body {
  width: 100%; min-height: 100vh;
  background: var(--bg-1); color: var(--color-10);
  font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px;
  overscroll-behavior-y: none;
}
body {
  display: flex; flex-direction: column; align-items: center;
  padding: calc(var(--card-height) + var(--margin)) var(--margin) 60px;
}

/* DATA WINDOW */
.data-window {
  display: none;
  position: fixed; top:0; left:0; right:0; bottom:0;
  background: var(--bg-1);
  z-index: 200;
  flex-direction: column;
}
.data-window.open { display: flex; }
.data-window-header {
  height: var(--card-height);
  display: flex; align-items: stretch;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
  flex-shrink: 0;
}
.data-window-title {
  flex:1; display:flex; align-items:center; padding:0 12px;
  font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase;
}
.data-window-close {
  width:45px; min-width:45px;
  background: #502424; border:none;
  border-left: var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; font-weight:900; color:#fff; cursor:pointer;
}
.data-tabs {
  height: var(--card-height); display:flex; flex-shrink:0;
  border-bottom: var(--border-width) solid var(--border-color);
}
.data-tab {
  flex:1; background:var(--bg-3); border:none;
  border-right: var(--border-width) solid var(--border-color);
  color:var(--muted); font-size:11px; font-weight:800;
  letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
}
.data-tab:last-child { border-right:none; }
.data-tab.active { background:var(--bg-2); color:var(--color-10); }
.data-body {
  flex:1; overflow-y:auto; padding:var(--margin);
  display:flex; flex-direction:column; gap:var(--margin);
  display:flex; flex-direction:column; gap:var(--margin);
}
.data-textarea {
  flex:1; width:100%;
  background:var(--bg-3); border:var(--border-width) solid var(--border-color);
  border-radius:var(--radius); color:var(--color-10);
  font-size:10px; font-family:monospace; padding:8px;
  outline:none; resize:none; min-height:200px;
}
.data-btn {
  height:var(--drop-height); background:var(--bg-2);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  color:var(--color-10); font-size:11px; font-weight:800;
  letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
}
.data-btn.green { background:var(--color-4); color:#000; }
.data-status {
  font-size:10px; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:var(--color-4); text-align:center;
  min-height:16px;
}


.settings-overlay {
  display: none;
  position: fixed; top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.8);
  z-index: 150;
}
.settings-overlay.open { display: block; }

.settings-drawer {
  position: fixed; top:0; left:0; bottom:0;
  width: 66.666%;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
  border-radius: 0 var(--radius) var(--radius) 0;
  transform: translateX(-100%);
  transition: transform 0.15s ease;
  z-index: 151;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.settings-drawer.open { transform: translateX(0); }

@keyframes sidebarCardIn {
  from { opacity:0; transform:translateX(-18px); }
  to   { opacity:1; transform:translateX(0); }
}
.sidebar-card-anim {
  opacity:0;
  animation: sidebarCardIn 0.18s ease forwards;
}

.settings-header {
  height: var(--card-height);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
  flex-shrink: 0;
  font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
}
.settings-close {
  width: 45px; min-width: 45px; height: 100%;
  background: var(--bg-3);
  border: none;
  border-left: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: var(--muted);
  cursor: pointer;
}
.settings-body {
  flex: 1; overflow-y: auto;
  padding: var(--margin);
  display: flex; flex-direction: column;
  gap: var(--margin);
}


.header-tab {
  position: fixed; top:0; left:0; right:0;
  height: var(--card-height);
  display: flex;
  border-bottom: var(--border-width) solid var(--border-color);
  z-index: 100;
}
.header-tab-btn {
  flex: 1; background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  color: var(--muted); font-size: 10px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
}
.header-tab-btn:last-child { border-right: none; }
.header-tab-btn.active { background: var(--bg-2); color: var(--color-10); }

/* APP */
.app { width: 100%; max-width: 540px; display: flex; flex-direction: column; gap: var(--margin); }

.page { display: none; flex-direction: column; gap: 4px; width: 100%; }
.page.active { display: flex; }

/* ADD PANEL */
.add-panel {
  background: var(--bg-2); border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); padding: var(--margin);
  display: flex; flex-direction: column; gap: var(--margin);
}
.add-panel input {
  width: 100%; height: var(--drop-height);
  background: var(--bg-3); border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--color-10);
  font-size: 12px; font-weight: 600; padding: 0 10px; outline: none;
}
.add-row { display: flex; gap: var(--margin); }
.picker-btn {
  flex: 1; min-width: 0; height: var(--drop-height);
  background: var(--bg-3); border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--color-10);
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; padding: 0 10px; cursor: pointer;
  display: flex; align-items: center; gap: 7px; overflow: hidden;
}
.picker-dot { width:9px; height:9px; border-radius:50%; border:2px solid #000; flex-shrink:0; }
.picker-label { flex:1; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.picker-arrow { font-size:9px; font-weight:900; color:var(--muted); flex-shrink:0; }
.btn-add {
  height: var(--drop-height); background: var(--color-4); color: #000;
  border: var(--border-width) solid var(--border-color); border-radius: var(--radius);
  font-size: 11px; font-weight: 800; letter-spacing: 0.09em;
  padding: 0 16px; cursor: pointer; text-transform: uppercase; flex-shrink: 0;
}

/* VIEW TOGGLE */
.view-toggle {
  height: var(--drop-height); display: flex;
  border: var(--border-width) solid var(--border-color); border-radius: var(--radius); overflow: hidden;
}
.view-btn {
  flex:1; background:var(--bg-2); border:none;
  border-right:var(--border-width) solid var(--border-color);
  color:var(--muted); font-size:11px; font-weight:800;
  letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:7px;
}
.view-btn:last-child { border-right:none; }
.view-btn.active { background:var(--bg-4); color:var(--color-10); }

/* LIST WRAP */
.list-wrap { display:flex; flex-direction:column; gap:var(--margin); width:100%; }

/* CAT SECTION */
.cat-section { border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; }
.cat-header {
  height:var(--card-height); display:flex; align-items:center; gap:9px; padding:0 10px;
  background:var(--bg-2); border-bottom:var(--border-width) solid var(--border-color);
  cursor:pointer; user-select:none; flex-shrink:0;
}
.cat-section.ms .cat-header {
  height:var(--drop-height) !important;
  min-height:0 !important;
}
.cat-section.ms .cat-body .item-row {
  height:var(--drop-height);
  min-height:var(--drop-height);
  max-height:var(--drop-height);
}
.cat-section.closed .cat-header { border-bottom:none; }
.cat-section.closed .cat-body  { display:none; }
.cat-dot { width:9px; height:9px; border-radius:50%; border:2px solid #000; flex-shrink:0; }
.cat-label { flex:1; font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; }
.cat-count { font-size:10px; font-weight:700; color:var(--muted); flex-shrink:0; }
.cat-arrow { font-size:8px; color:var(--muted); font-weight:900; transition:transform 0.15s; }
.cat-body { display:flex; flex-direction:column; gap:var(--margin); padding:var(--margin); background:var(--bg-2); }

/* ITEM ROW */
.item-row {
  height:var(--drop-height); display:flex; align-items:stretch;
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; flex-shrink:0;
}
.item-check {
  width:32px; min-width:32px; background:#fff;
  border-right:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; cursor:pointer; flex-shrink:0;
}
.item-name {
  flex:1; min-width:0; background:var(--bg-4);
  display:flex; align-items:center; padding:0 8px;
  font-size:10px; font-weight:600;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;
}
.item-del {
  width:32px; min-width:32px; background:var(--color-1); border:none;
  border-left:var(--border-width) solid var(--border-color);
  color:#fff; font-size:14px; font-weight:700;
  cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
}
.item-del.pending { background:#fff; color:var(--color-1); }

/* EMPTY */
.empty-state {
  min-height:80px; display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:500; color:var(--muted); opacity:0.8;
  text-align:center; padding:24px 20px; line-height:1.7;
  background:var(--bg-2); border-radius:var(--radius);
}

/* FOOTER */
.footer { width:100%; }
.btn-ghost {
  width:100%; height:var(--card-height); background:var(--bg-2); color:var(--muted);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
}

/* MODAL */
.modal-overlay {
  display:none; position:fixed; top:0; left:0; right:0; bottom:0;
  background:rgba(0,0,0,0.85); z-index:400;
}
.modal-overlay.open { display:block; }
.modal {
  position:absolute; top:var(--margin); left:var(--margin); right:var(--margin); bottom:var(--margin);
  background:var(--bg-2); border:var(--border-width) solid var(--border-color);
  border-radius:var(--radius); display:flex; flex-direction:column; overflow:hidden;
}
.modal-header {
  height:var(--card-height); display:flex; align-items:stretch;
  background:var(--bg-3);
  border-bottom:var(--border-width) solid var(--border-color); flex-shrink:0;
  overflow:hidden;
}
.modal-title {
  flex:1; display:flex; align-items:center; padding:0 12px;
  font-size:11px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase;
}
.modal-close {
  width:45px; min-width:45px;
  background:#502424;
  border-left:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:22px; font-weight:900; color:#fff;
  cursor:pointer; flex-shrink:0;
}
.modal-close:hover { background:#6b2f2f; }
.modal-grid {
  display:grid; grid-template-columns:1fr 1fr; gap:var(--margin);
  padding:var(--margin); overflow-y:auto; flex:1; background:var(--bg-1); align-content:start;
}
.modal-cat-btn {
  height:var(--drop-height); background:var(--bg-2);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  font-size:10px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;
  padding:0; cursor:pointer; display:flex; align-items:stretch; overflow:hidden; color:var(--color-10);
}
.modal-cat-btn.sel-active { border-color:var(--cat-color,#5A8DB8); background:var(--bg-3); }
.modal-cat-btn.sel-pending { border-color:var(--cat-color,#5A8DB8); background:var(--bg-4); }
.modal-cat-label {
  flex:1; display:flex; align-items:center; justify-content:center;
  padding:0 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.modal-cat-label[style*="flex-direction:column"] {
  flex-direction:column; gap:2px; white-space:normal;
}
.modal-del-sq {
  width:32px; min-width:32px; background:var(--bg-3);
  border-left:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; flex-shrink:0;
}
.modal-del-sq.pending { background:var(--color-10); color:var(--color-1); }
.add-cat-panel {
  grid-column:1/-1; background:var(--bg-2);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  padding:var(--margin); display:flex; flex-direction:column; gap:var(--margin);
}
.add-cat-input {
  height:var(--drop-height); background:var(--bg-3);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  color:var(--color-10); font-size:10px; font-weight:700; letter-spacing:0.06em;
  padding:0 8px; outline:none; width:100%; text-transform:uppercase;
}
.swatches { display:flex; flex-wrap:wrap; gap:var(--margin); }
.swatch { width:24px; height:24px; border-radius:50%; border:3px solid #000; cursor:pointer; }
.swatch.active { border-color:#fff; }
.add-cat-btn {
  height:var(--drop-height); background:var(--bg-3);
  border:var(--border-width) solid var(--border-color); border-radius:var(--radius);
  color:var(--color-10); font-size:10px; font-weight:800; letter-spacing:0.08em;
  text-transform:uppercase; cursor:pointer;
}

.simple-cat-divider {
  display:flex; align-items:center; gap:8px;
  padding:6px 4px 2px;
  flex-shrink:0;
}
.simple-cat-divider-line {
  flex:1; height:var(--border-width); background:var(--border-color);
}
.simple-cat-divider-label {
  font-size:9px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;
  flex-shrink:0;
}


#csThinkSlot, #msThinkSlot, #glThinkSlot, #ptThinkSlot {
  display: flex; flex-direction: column;
  gap: var(--margin);
}
#csThinkSlot:empty, #msThinkSlot:empty, #glThinkSlot:empty, #ptThinkSlot:empty {
  display: none;
}
.thinking-dots span {
  animation: thinkDot 1.2s infinite;
  opacity: 0;
}
.thinking-dots span:nth-child(2) { animation-delay: 0.4s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.8s; }
@keyframes thinkDot {
  0%, 100% { opacity: 0; }
  50%       { opacity: 1; }
}

.ms-search-wrap {
  display:flex; align-items:stretch;
  height:var(--drop-height);
  border:var(--border-width) solid var(--border-color);
  border-radius:var(--radius); overflow:hidden;
}
.ms-search {
  flex:1; min-width:0;
  background: #c8cdd4; border:none;
  color: #1a1a1a;
  font-size:13px; font-weight:600;
  padding:0 10px; outline:none;
}
.ms-search::placeholder { color: #6b7280; }
.ms-search-clear {
  width:32px; min-width:32px;
  background: #8896a8; border:none;
  border-left:var(--border-width) solid var(--border-color);
  color:#fff; font-size:16px; font-weight:700;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
}


.cs-section { border:var(--border-width) solid var(--border-color); border-radius:var(--radius); overflow:hidden; }
.cs-header {
  height:var(--card-height); display:flex; align-items:stretch;
  background:var(--bg-2); border-bottom:var(--border-width) solid var(--border-color);
  cursor:pointer; user-select:none; overflow:hidden;
}
.cs-section.closed .cs-header { border-bottom:none; }
.cs-section.closed .cs-body { display:none; }
.cs-header-main {
  flex:1; min-width:0; display:flex; flex-direction:column;
  justify-content:center; padding:0 10px; gap:0;
  overflow:hidden;
}
.cs-item-name { font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cs-item-sub  { font-size:9px; font-weight:700; color:var(--color-4); letter-spacing:0.04em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cs-unit-badge { font-size:9px; font-weight:700; color:var(--muted); }
.cs-header-right { display:flex; align-items:center; gap:8px; padding-right:10px; flex-shrink:0; }
.cs-arrow { font-size:8px; color:var(--muted); font-weight:900; }
.cs-del-sq {
  width:32px; min-width:32px; background:var(--bg-3);
  border-left:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; flex-shrink:0;
}
.cs-del-sq.pending { background:var(--color-10); color:var(--color-1); }
.cs-body { display:flex; flex-direction:column; gap:var(--margin); padding:var(--margin); background:var(--bg-2); }
.cs-entry {
  display:flex; flex-direction:column;
  border:var(--border-width) solid var(--border-color);
  border-radius:5px; overflow:hidden; flex-shrink:0;
}
.cs-entry-top {
  height:var(--drop-height); display:flex; align-items:stretch;
}
.cs-entry-sale {
  height:var(--drop-height); display:flex; align-items:stretch;
  border-top:var(--border-width) solid var(--border-color);
}
.cs-sale-saving {
  flex: 1 1 0; min-width:0; background:var(--bg-3);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700; color:var(--color-4);
  border-right:var(--border-width) solid var(--border-color);
}
.cs-sale-price {
  flex: 1 1 0; min-width:0; background:var(--bg-2);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700; color:var(--color-4);
  border-right:var(--border-width) solid var(--border-color);
}
.cs-sale-enddate {
  flex: 1 1 0; min-width:0; background:var(--bg-3);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700; color:var(--muted);
}
.cs-store {
  flex: 1 1 0; min-width:0; background:var(--bg-4);
  display:flex; align-items:center; padding:0 8px;
  font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  border-right:var(--border-width) solid var(--border-color);
}
.cs-up {
  flex: 1 1 0; min-width:0; background:var(--bg-2);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700;
  border-right:var(--border-width) solid var(--border-color);
}
.cs-up.best { background:var(--color-4); color:#000; }
.cs-up.tied { background:var(--color-4-2); color:var(--color-10); }
.cs-date {
  flex: 1 1 0; min-width:0; background:var(--bg-3);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700; color:var(--muted);
  border-right:var(--border-width) solid var(--border-color);
}
.cs-entry-del {
  width:32px; min-width:32px; background:var(--bg-3); border:none;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; flex-shrink:0;
}
.cs-entry-del.pending { background:var(--color-10); color:var(--color-1); }
.cs-divider {
  height:0; border-bottom:var(--border-width) solid var(--border-color);
  margin:0 calc(-1 * var(--margin)); width:calc(100% + 2 * var(--margin));
}
.cs-add-row {
  height:var(--drop-height); display:flex;
  border:var(--border-width) solid var(--border-color); border-radius:5px; overflow:hidden; flex-shrink:0;
}
.cs-input {
  background:var(--bg-3); border:none;
  border-right:var(--border-width) solid var(--border-color);
  color:var(--color-10); font-size:10px; font-weight:600;
  padding:0 6px; outline:none; height:100%;
}
.cs-input-store { flex:2; min-width:0; }
.cs-input-qty   { flex:1; min-width:0; text-align:center; }
.cs-input-price { flex:1; min-width:0; text-align:center; }
.cs-add-btn {
  width:32px; min-width:32px; background:var(--color-4); border:none;
  color:#000; font-size:16px; font-weight:900; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.cs-sale-trigger {
  width:44px; min-width:44px; background:var(--bg-3);
  border-left:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:8px; font-weight:900; letter-spacing:0.08em;
  color:var(--color-4); cursor:pointer; flex-shrink:0;
}
.cs-sale-trigger:hover { background:var(--bg-2); }
.cs-sale-card {
  height:var(--drop-height); display:flex; align-items:stretch;
  border:var(--border-width) solid var(--border-color);
  border-radius:5px; overflow:hidden; flex-shrink:0;
}
.cs-sale-label {
  width:48px; min-width:48px; background:var(--bg-3);
  display:flex; align-items:center; justify-content:center;
  font-size:8px; font-weight:900; letter-spacing:0.1em;
  color:var(--color-4); border-right:var(--border-width) solid var(--border-color);
  flex-shrink:0;
}
.cs-sale-up {
  flex:1; background:var(--bg-2);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:800; color:var(--color-4);
  border-right:var(--border-width) solid var(--border-color);
}
.cs-sale-ends {
  width:72px; min-width:72px; background:var(--bg-3);
  display:flex; align-items:center; justify-content:center;
  font-size:9px; font-weight:600; color:var(--muted);
  border-right:var(--border-width) solid var(--border-color); flex-shrink:0;
}
.cs-sale-del {
  width:32px; min-width:32px; background:var(--bg-3); border:none;
  display:flex; align-items:center; justify-content:center;
  font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; flex-shrink:0;
}
.cs-sale-del.pending { background:var(--color-10); color:var(--color-1); }
.cs-sale-add-row {
  height:var(--drop-height); display:flex;
  border:var(--border-width) solid var(--border-color);
  border-radius:5px; overflow:hidden; flex-shrink:0;
}
.cs-entry-edit {
  width:32px; min-width:32px; background:var(--bg-3);
  border-right:var(--border-width) solid var(--border-color);
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:900; color:var(--muted);
  cursor:pointer; flex-shrink:0; letter-spacing:-1px;
}
.cs-entry-edit.pending { background:var(--bg-4); color:var(--color-10); }

.unit-picker-btn {
  flex:1; min-width:0; height:var(--drop-height);
  background:var(--bg-3); border:var(--border-width) solid var(--border-color);
  border-radius:var(--radius); color:var(--color-10);
  font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;
  padding:0 10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
}
/* ── PANTRY TAB ── */
#pagePantry {
  flex-direction: column; gap: var(--margin);
  overflow-y: auto;
}
.pt-card {
  border: 3px solid #000;
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
  width: 100%;
}
.pt-main {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  box-sizing: border-box;
  display: flex; align-items: stretch;
  position: relative; overflow: hidden; cursor: pointer;
}
.pt-btn {
  width: 32px; min-width: 32px; max-width: 32px;
  height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700;
  z-index: 2; flex-shrink: 0; cursor: pointer;
  border: none; background: var(--bg-3); color: var(--color-10);
  position: relative; box-sizing: border-box;
}
.pt-btn.left  { border-right: 3px solid #000; }
.pt-btn.right { border-left:  3px solid #000; }
.pt-center {
  flex: 1; height: 32px; box-sizing: border-box;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 2; position: relative;
  pointer-events: none; background: var(--bg-2); overflow: hidden;
}
.pt-name {
  font-size: 10px; font-weight: 700; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 100%; padding: 0 6px; line-height: 1; margin: 0;
}
.pt-value {
  font-size: 8px; font-weight: 600; letter-spacing: 0.04em;
  color: rgba(255,255,255,0.7); text-align: center; line-height: 1; margin: 0;
}
.pt-expand {
  background: var(--bg-3); overflow: hidden;
  max-height: 0;
}
.pt-expand.open {
  max-height: 600px;
  border-top: var(--border-width) solid var(--border-color);
}
/* Focus mode — dim background when a dropdown is open */
#focusDim { position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:50;pointer-events:none;opacity:0;transition:opacity 0.35s ease; }
#focusDim.active { opacity:1; }
.pt-card-wrap { position:relative; }
.pt-card-wrap.focus-active { z-index:55; }
.cs-section.focus-active, .cat-section.focus-active { position:relative; z-index:55; }
/* Expand animation — no transition, instant open/close */
.pt-expand-animated { overflow:hidden; }

.pt-graph {
  height: 80px; display: flex; align-items: flex-end;
  padding: 8px 10px 6px; gap: 4px;
}
.pt-bar-wrap {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end; gap: 3px; cursor: pointer;
}
.pt-bar { width: 100%; border-radius: 2px 2px 0 0; min-height: 2px; }
.pt-day { font-size: 6px; font-weight: 600; color: var(--muted); }
  `;
  document.head.appendChild(s);
})();


