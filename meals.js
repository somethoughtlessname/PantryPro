/* ── MEALS.JS ─────────────────────────────────────────────────────────────────
   Shelf + container grid for tracking pantry fill levels.
   Tab: "Meals" — toggled on/off via Settings sidebar.
   Renders into #pageShelf. All globals prefixed sh.
   Storage key: sh_data. Tab visibility: sh_tab_on.
────────────────────────────────────────────────────────────────────────────── */

/* ── Tab visibility ── */
var shTabOn = ls('sh_tab_on', false);

function shApplyTabVisibility(){
  var existing = document.getElementById('hShelf');
  if(shTabOn){
    if(!existing){
      var btn = document.createElement('button');
      btn.className = 'header-tab-btn';
      btn.id = 'hShelf';
      btn.textContent = 'Meals';
      btn.onclick = function(){ setPage('Shelf'); };
      var tabBar = document.querySelector('.header-tab');
      if(tabBar) tabBar.appendChild(btn);
    }
  } else {
    if(existing) existing.parentNode.removeChild(existing);
    if(document.getElementById('pageShelf') && document.getElementById('pageShelf').classList.contains('active')){
      setPage('Grocery');
    }
  }
}

function shToggleTab(on){
  shTabOn = on;
  lsSet('sh_tab_on', on);
  shApplyTabVisibility();
}

/* ── Constants ── */
var SH_KEY  = 'sh_data';
var SH_COLS = 8;
var SH_SHAPES = {
  h8:{ cs:8, rs:1, label:'Full Wide',    cells:[[1,1,8,1]] },
  h4:{ cs:4, rs:1, label:'Half Wide',    cells:[[1,1,4,1]] },
  h3:{ cs:3, rs:1, label:'Third Wide',   cells:[[1,1,3,1]] },
  h2:{ cs:2, rs:1, label:'Quarter Wide', cells:[[1,1,2,1]] },
  sq:{ cs:2, rs:2, label:'Square',       cells:[[1,1,2,2]] },
  tl:{ cs:1, rs:2, label:'Tall',         cells:[[1,1,1,2]] }
};

/* ── State ── */
var shShelves         = [];
var shShelfSeq        = 0;
var shSelShelfId      = null;
var shSelConId        = null;
var shActiveTab       = 'pct';
var shModalShelf      = null;
var shModalShape      = null;
var shModalDraw       = false;
var shModalMode       = 'insert';
var shMultiShelf      = null;
var shMultiCs         = 0;
var shMultiRs         = 0;
var shMultiName       = '';
var shMultiTotal      = null;
var shMultiSlot       = null;
var shEditShelf       = null;
var shBuilt           = false;

/* ── Persistence ── */
function shSave(){
  lsSet(SH_KEY, {
    shelfSeq: shShelfSeq,
    shelves: shShelves.map(function(s){
      return { id:s.id, name:s.name, open:s.open, conSeq:s.conSeq,
        items: s.items.map(function(c){
          return { id:c.id, name:c.name, cs:c.cs, rs:c.rs,
                   pct:c.pct, total:c.total, count:c.count, tens:c.tens, ones:c.ones };
        })
      };
    })
  });
}

function shLoad(){
  var d = ls(SH_KEY, null);
  if(!d){ shShelves=[]; shShelfSeq=0; return; }
  shShelfSeq = d.shelfSeq || 0;
  shShelves = (d.shelves||[]).map(function(s){
    return { id:s.id, name:s.name, open:!!s.open, conSeq:s.conSeq||0,
      items:(s.items||[]).map(function(c){
        return { id:c.id, name:c.name, cs:c.cs, rs:c.rs,
                 pct:c.pct||0, total:c.total||null, count:c.count!=null?c.count:null,
                 tens:c.tens, ones:c.ones };
      }),
      sel:new Set(), drawing:false, pendingName:null, pendingTotal:null,
      pendingMulti:false, deleteId:null };
  });
}



/* ── Color ── */
function shColor(t){
  var stops=['#C85A5A','#e0a050','#d4c840','#48a971'];
  var i=Math.min(3,Math.floor(t*3)), f=(t*3)-i;
  var h=function(s){return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];};
  var a=h(stops[i]), b=h(stops[Math.min(3,i+1)]);
  return 'rgb('+Math.round(a[0]+(b[0]-a[0])*f)+','+Math.round(a[1]+(b[1]-a[1])*f)+','+Math.round(a[2]+(b[2]-a[2])*f)+')';
}

/* ── Pack ── */
function shPack(arr){
  var occ={};
  function key(r,c){return r+','+c;}
  function isFree(r,c,cs,rs){for(var dr=0;dr<rs;dr++)for(var dc=0;dc<cs;dc++)if(occ[key(r+dr,c+dc)])return false;return true;}
  function occupy(r,c,cs,rs){for(var dr=0;dr<rs;dr++)for(var dc=0;dc<cs;dc++)occ[key(r+dr,c+dc)]=true;}
  var pos=[],r=1,c=0;
  for(var i=0;i<arr.length;i++){
    var cs2=arr[i].cs,rs2=arr[i].rs,safety=0;
    while(true){if(c+cs2<=SH_COLS&&isFree(r,c,cs2,rs2))break;c++;if(c+cs2>SH_COLS){c=0;r++;}if(++safety>100000)break;}
    pos.push({r:r,c:c,cs:cs2,rs:rs2}); occupy(r,c,cs2,rs2); c+=cs2; if(c>=SH_COLS){c=0;r++;}
  }
  return pos;
}

function shIsRect(sel){
  if(!sel.size)return null;
  var rows=[],cols=[];
  sel.forEach(function(k){var p=k.split(',');rows.push(+p[0]);cols.push(+p[1]);});
  var minR=Math.min.apply(null,rows),maxR=Math.max.apply(null,rows);
  var minC=Math.min.apply(null,cols),maxC=Math.max.apply(null,cols);
  var cs=maxC-minC+1,rs=maxR-minR+1;
  if(sel.size!==cs*rs)return null;
  return{cs:cs,rs:rs};
}

function shNextSlot(shelf,cs,rs){
  var trial=shelf.items.concat([{cs:cs,rs:rs}]);
  var pos=shPack(trial);
  return pos[pos.length-1];
}

/* ── Render entry point ── */
function shRender(){
  shLoad();
  if(!shBuilt){ shBuildPage(); shBuilt=true; }
  shRenderShelves();
  shRenderFooterIfSel();
}

function shBuildPage(){
  var page = document.getElementById('pageShelf');
  if(!page) return;
  page.innerHTML = '';
  page.style.cssText = 'padding:var(--margin);gap:var(--margin);display:block;overflow-y:auto;padding-bottom:220px;';

  var shelvesDiv = document.createElement('div');
  shelvesDiv.id = 'shShelvesDiv';
  page.appendChild(shelvesDiv);

  // Add shelf row
  var addRow = document.createElement('div');
  addRow.style.cssText = 'border:var(--border-width) dashed #636B76;border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;height:var(--card-height);margin-top:var(--margin);';
  var inp = document.createElement('input');
  inp.id = 'shShelfInp';
  inp.placeholder = 'New shelf name...';
  inp.style.cssText = 'flex:1;background:transparent;border:none;color:#fff;font-size:10px;font-weight:700;padding:0 10px;outline:none;-webkit-tap-highlight-color:transparent;';
  inp.oninput = function(){ document.getElementById('shShelfBtn').style.display = inp.value.trim() ? 'flex' : 'none'; };
  inp.onkeydown = function(e){ if(e.key==='Enter') shAddShelf(); };
  var btn = document.createElement('div');
  btn.id = 'shShelfBtn';
  btn.style.cssText = 'display:none;width:var(--card-height);align-items:center;justify-content:center;font-size:20px;cursor:pointer;border-left:var(--border-width) solid var(--border-color);background:#48a971;color:#fff;-webkit-tap-highlight-color:transparent;';
  btn.textContent = '+';
  btn.onclick = shAddShelf;
  addRow.append(inp, btn);
  page.appendChild(addRow);

  // Footer (fixed bottom)
  var footer = document.createElement('div');
  footer.id = 'shFooter';
  footer.style.cssText = 'position:fixed;bottom:0;left:0;right:0;border-top:var(--border-width) solid var(--border-color);background:var(--bg-3);overflow:hidden;max-height:0;z-index:400;transition:max-height 0.2s ease;';
  footer.innerHTML = shFooterHTML();
  page.appendChild(footer);

  // Add container modal
  var modal = document.createElement('div');
  modal.id = 'shAddModal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:var(--bg-1);z-index:500;overflow-y:auto;-webkit-tap-highlight-color:transparent;';
  modal.innerHTML = shModalHTML();
  page.appendChild(modal);

  // Edit modal
  var editModal = document.createElement('div');
  editModal.id = 'shEditModal';
  editModal.style.cssText = 'display:none;position:fixed;inset:0;background:var(--bg-1);z-index:500;overflow-y:auto;-webkit-tap-highlight-color:transparent;';
  editModal.innerHTML = shEditModalHTML();
  page.appendChild(editModal);
}

function shRenderShelves(){
  var div = document.getElementById('shShelvesDiv');
  if(!div) return;
  div.innerHTML = '';
  shShelves.forEach(function(s){ div.appendChild(shBuildShelf(s)); });
}

/* ── HTML helpers ── */
function shBW(){ return 'var(--border-width)'; }
function shBC(){ return 'var(--border-color)'; }
function shCH(){ return 'var(--card-height)'; }
function shM(){ return 'var(--margin)'; }
function shR(){ return 'var(--radius)'; }

function shFooterHTML(){
  var bw='var(--border-width)',bc='var(--border-color)',bg2='var(--bg-2)',bg3='var(--bg-3)';
  return '<div style="height:30px;display:flex;align-items:stretch;border-bottom:'+bw+' solid '+bc+';">'
    +'<div id="shTabPct" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;color:#fff;background:'+bg2+';border-right:'+bw+' solid '+bc+';" onclick="shSetTab(\'pct\')">Percent</div>'
    +'<div id="shTabFrac" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;color:#9ca3af;" onclick="shSetTab(\'frac\')">Fraction</div>'
    +'</div>'
    +'<div id="shCountBar" style="display:none;border-bottom:'+bw+' solid '+bc+';">'
    +'<div style="display:flex;align-items:stretch;height:38px;">'
    +'<div onclick="shAdjCount(-1)" style="width:52px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;cursor:pointer;border-right:'+bw+' solid '+bc+';color:#fff;user-select:none;-webkit-tap-highlight-color:transparent;">-</div>'
    +'<div id="shCountDisp" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;letter-spacing:0.06em;"></div>'
    +'<div onclick="shAdjCount(1)" style="width:52px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;cursor:pointer;border-left:'+bw+' solid '+bc+';color:#fff;user-select:none;-webkit-tap-highlight-color:transparent;">+</div>'
    +'</div></div>'
    +'<div id="shFootPct"><div style="display:flex;align-items:stretch;">'
    +'<div style="flex:1;display:flex;flex-direction:column;">'
    +'<div style="height:22px;display:flex;align-items:stretch;" id="shTensRow"></div>'
    +'<div style="height:22px;display:flex;align-items:stretch;border-top:'+bw+' solid '+bc+';" id="shOnesRow"></div>'
    +'</div>'
    +'<div id="shBtn100" onclick="shApplyPct(100)" style="width:23px;min-width:23px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;writing-mode:vertical-rl;border-left:'+bw+' solid '+bc+';cursor:pointer;background:#48a971;color:#fff;-webkit-tap-highlight-color:transparent;">100</div>'
    +'</div></div>'
    +'<div id="shFootFrac" style="display:none;"><div style="display:flex;align-items:stretch;">'
    +'<div onclick="shApplyPct(0)" style="width:22px;min-width:22px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;writing-mode:vertical-lr;cursor:pointer;background:#C85A5A;color:#fff;transform:rotate(180deg);-webkit-tap-highlight-color:transparent;">Empty</div>'
    +'<div style="flex:1;display:flex;flex-direction:column;border-left:'+bw+' solid '+bc+';border-right:'+bw+' solid '+bc+';">'
    +'<div style="height:22px;display:flex;align-items:stretch;" id="shFracR1"></div>'
    +'<div style="height:22px;display:flex;align-items:stretch;border-top:'+bw+' solid '+bc+';" id="shFracR2"></div>'
    +'</div>'
    +'<div onclick="shApplyPct(100)" style="width:22px;min-width:22px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;writing-mode:vertical-lr;cursor:pointer;background:#48a971;color:#fff;-webkit-tap-highlight-color:transparent;">Full</div>'
    +'</div></div>';
}

function shModalHTML(){
  var bw='var(--border-width)',bc='var(--border-color)',bg3='var(--bg-3)',ch='var(--card-height)',m='var(--margin)',r='var(--radius)';
  return '<div style="padding:'+m+';display:block;">'
    +'<div style="margin-bottom:'+m+';"><div style="display:flex;gap:'+m+';margin-bottom:'+m+';"><input id="shModalShelfName" style="flex:1;background:'+bg3+';border:'+bw+' solid '+bc+';border-radius:'+r+';color:#fff;font-size:10px;font-weight:700;padding:0 10px;height:'+ch+';outline:none;box-sizing:border-box;-webkit-tap-highlight-color:transparent;" /><div onclick="shModalSaveShelfName()" style="width:80px;height:'+ch+';display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #48a971;color:#48a971;-webkit-tap-highlight-color:transparent;flex-shrink:0;">Rename</div></div><div onclick="shModalDeleteShelf()" style="height:'+ch+';display:block;line-height:'+ch+';text-align:center;font-size:9px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #C85A5A;color:#C85A5A;-webkit-tap-highlight-color:transparent;">Delete Shelf</div></div>'
    +'<input id="shModalName" style="width:100%;background:'+bg3+';border:'+bw+' solid '+bc+';border-radius:'+r+';color:#fff;font-size:10px;font-weight:700;padding:0 10px;height:'+ch+';outline:none;display:block;margin-bottom:'+m+';box-sizing:border-box;-webkit-tap-highlight-color:transparent;" placeholder="Container name..." oninput="shUpdModalConf()" />'
    +'<input id="shModalNum" type="number" min="1" max="999" style="width:100%;background:'+bg3+';border:'+bw+' solid '+bc+';border-radius:'+r+';color:#fff;font-size:9px;font-weight:700;padding:0 10px;height:'+ch+';outline:none;display:block;margin-bottom:'+m+';box-sizing:border-box;" placeholder="Total amount (optional) - use if tracking servings or units" />'
    +'<div style="background:#c8d0d8;border-radius:'+r+';height:22px;display:block;line-height:22px;text-align:center;font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#000;margin-bottom:'+m+';">CHOOSE SHAPE</div>'
    +'<div id="shShapeCards" style="display:block;margin-bottom:'+m+';"></div>'
    +'<div style="background:#c8d0d8;border-radius:'+r+';height:22px;display:block;line-height:22px;text-align:center;font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#000;margin-bottom:'+m+';">CHOOSE MODE</div>'
    +'<div style="display:flex;gap:'+m+';margin-bottom:'+m+';">'
    +'<div id="shModeInsert" onclick="shPickMode(\'insert\')" style="flex:1;border:'+bw+' solid #fff;border-radius:'+r+';background:'+bg3+';cursor:pointer;padding:'+m+';display:block;-webkit-tap-highlight-color:transparent;">'
    +'<div style="font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#fff;display:block;margin-bottom:4px;">Insert</div>'
    +'<div style="font-size:7px;font-weight:700;color:#9ca3af;">Adds one container then closes</div></div>'
    +'<div id="shModeMulti" onclick="shPickMode(\'multi\')" style="flex:1;border:'+bw+' solid '+bc+';border-radius:'+r+';background:'+bg3+';cursor:pointer;padding:'+m+';display:block;-webkit-tap-highlight-color:transparent;">'
    +'<div style="font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:4px;">Multi</div>'
    +'<div style="font-size:7px;font-weight:700;color:#9ca3af;">Keep adding the same container</div></div></div>'
    +'<div id="shModalConf" onclick="shModalConf()" style="height:'+ch+';display:block;line-height:'+ch+';text-align:center;font-size:10px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';background:#48a971;color:#fff;opacity:0.3;pointer-events:none;margin-bottom:'+m+';-webkit-tap-highlight-color:transparent;">Add Container</div>'
    +'<div onclick="shCloseModal()" style="height:36px;display:block;line-height:36px;text-align:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;color:#9ca3af;-webkit-tap-highlight-color:transparent;">Cancel</div>'
    +'</div>';
}

function shEditModalHTML(){
  var bw='var(--border-width)',bc='var(--border-color)',bg3='var(--bg-3)',ch='var(--card-height)',m='var(--margin)',r='var(--radius)';
  return '<div style="padding:'+m+';display:block;">'
    +'<input id="shEditName" style="width:100%;background:'+bg3+';border:'+bw+' solid '+bc+';border-radius:'+r+';color:#fff;font-size:10px;font-weight:700;padding:0 10px;height:'+ch+';outline:none;display:block;margin-bottom:'+m+';box-sizing:border-box;" placeholder="Container name..." oninput="shUpdEditConf()" />'
    +'<input id="shEditNum" type="number" min="1" max="999" style="width:100%;background:'+bg3+';border:'+bw+' solid '+bc+';border-radius:'+r+';color:#fff;font-size:9px;font-weight:700;padding:0 10px;height:'+ch+';outline:none;display:block;margin-bottom:'+m+';box-sizing:border-box;" placeholder="Total amount (optional)" />'
    +'<div id="shEditConf" onclick="shDoEdit()" style="height:'+ch+';display:block;line-height:'+ch+';text-align:center;font-size:10px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';background:#48a971;color:#fff;opacity:0.3;pointer-events:none;margin-bottom:'+m+';-webkit-tap-highlight-color:transparent;">Save</div>'
    +'<div onclick="shCloseEditModal()" style="height:36px;display:block;line-height:36px;text-align:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;color:#9ca3af;-webkit-tap-highlight-color:transparent;">Cancel</div>'
    +'</div>';
}

/* ── Add shelf ── */
function shAddShelf(){
  var inp = document.getElementById('shShelfInp');
  var name = inp ? inp.value.trim() : ''; if(!name) return;
  shShelfSeq++;
  shShelves.push({id:shShelfSeq,name:name,open:false,items:[],conSeq:0,
    sel:new Set(),drawing:false,pendingName:null,pendingTotal:null,pendingMulti:false,deleteId:null});
  if(inp) inp.value = '';
  var btn = document.getElementById('shShelfBtn');
  if(btn) btn.style.display = 'none';
  shSave();
  shRenderShelves();
}

/* ── Build shelf ── */
function shBuildShelf(shelf){
  var bw='var(--border-width)',bc='var(--border-color)',bg2='var(--bg-2)',bg3='var(--bg-3)',ch='var(--card-height)',m='var(--margin)',r='var(--radius)';

  var wrap = document.createElement('div');
  wrap.style.cssText = 'border:'+bw+' solid '+bc+';border-radius:'+r+';overflow:hidden;margin-bottom:'+m+';';

  // Header — label taps toggle, + opens modal
  var hdr = document.createElement('div');
  hdr.style.cssText = 'height:'+ch+';display:flex;align-items:stretch;background:'+bg2+';user-select:none;';
  var lbl = document.createElement('div');
  lbl.style.cssText = 'flex:1;display:flex;align-items:center;padding:0 12px;font-size:10px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;-webkit-tap-highlight-color:transparent;';
  lbl.textContent = shelf.name;
  var plus = document.createElement('div');
  plus.style.cssText = 'width:'+ch+';display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;background:#48a971;border-left:'+bw+' solid '+bc+';flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent;';
  plus.textContent = '+';

  ;(function(shelf){
    plus.onclick = function(e){ e.stopPropagation(); shOpenModal(shelf); };
    lbl.onclick = function(){
      if(!shelf.items.length) return;
      var opening = !shelf.open;
      if(opening){
        shShelves.forEach(function(other){
          if(other.id===shelf.id||!other.open) return;
          other.open = false;
          var ob = document.getElementById('shbody-'+other.id);
          if(ob) ob.style.display = 'none';
          var os = document.getElementById('shsum-'+other.id);
          if(os){ shRenderSum(other,os); os.style.display = other.items.length ? 'block' : 'none'; }
          if(shSelShelfId===other.id){ shSelShelfId=null; shSelConId=null; shCloseFooter(); shRenderGrid(other); }
        });
      }
      shelf.open = opening;
      var body = document.getElementById('shbody-'+shelf.id);
      if(body) body.style.display = shelf.open ? 'block' : 'none';
      var sum = document.getElementById('shsum-'+shelf.id);
      if(sum){
        if(shelf.open) sum.style.display = 'none';
        else { shRenderSum(shelf,sum); sum.style.display = shelf.items.length ? 'block' : 'none'; }
      }
      if(!shelf.open){ shSelShelfId=null; shSelConId=null; shCloseFooter(); shRenderGrid(shelf); }
    };
  })(shelf);
  hdr.append(lbl,plus);
  wrap.appendChild(hdr);

  // Summary (collapsed view)
  var sum = document.createElement('div');
  sum.id = 'shsum-'+shelf.id;
  sum.style.display = (!shelf.open&&shelf.items.length) ? 'block' : 'none';
  shRenderSum(shelf, sum);
  wrap.appendChild(sum);

  // Body
  var body = document.createElement('div');
  body.id = 'shbody-'+shelf.id;
  body.style.cssText = 'background:'+bg2+';display:'+(shelf.open&&shelf.items.length?'block':'none')+';border-top:'+bw+' solid '+bc+';';

  var grid = document.createElement('div');
  grid.id = 'shgrid-'+shelf.id;
  body.appendChild(grid);

  var status = document.createElement('div');
  status.id = 'shst-'+shelf.id;
  status.style.cssText = 'font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;text-align:center;padding:4px;display:none;background:'+bg3+';border-top:'+bw+' solid '+bc+';';
  body.appendChild(status);

  var actions = document.createElement('div');
  actions.id = 'shact-'+shelf.id;
  actions.style.cssText = 'display:none;gap:'+m+';padding:'+m+';background:'+bg3+';border-top:'+bw+' solid '+bc+';';
  var cancelBtn = document.createElement('div');
  cancelBtn.style.cssText = 'flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #9ca3af;color:#9ca3af;-webkit-tap-highlight-color:transparent;';
  cancelBtn.textContent = 'Cancel';
  var confirmBtn = document.createElement('div');
  confirmBtn.id = 'shconf-'+shelf.id;
  confirmBtn.style.cssText = 'flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #48a971;color:#48a971;opacity:0.3;pointer-events:none;-webkit-tap-highlight-color:transparent;';
  confirmBtn.textContent = 'Place';
  ;(function(shelf){ cancelBtn.onclick=function(){shCancelDraw(shelf);}; confirmBtn.onclick=function(){shConfirmFreehand(shelf);}; })(shelf);
  actions.append(cancelBtn,confirmBtn);
  body.appendChild(actions);

  var delBar = document.createElement('div');
  delBar.id = 'shdel-'+shelf.id;
  delBar.style.cssText = 'display:none;gap:'+m+';padding:'+m+';background:'+bg3+';border-top:'+bw+' solid '+bc+';';
  var emptyBtn=document.createElement('div'); emptyBtn.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #9ca3af;color:#9ca3af;-webkit-tap-highlight-color:transparent;'; emptyBtn.textContent='Empty';
  var editBtn=document.createElement('div');  editBtn.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #5A8DB8;color:#5A8DB8;-webkit-tap-highlight-color:transparent;'; editBtn.textContent='Edit';
  var delBtn=document.createElement('div');   delBtn.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #C85A5A;color:#C85A5A;-webkit-tap-highlight-color:transparent;'; delBtn.textContent='Delete';
  var delCancel=document.createElement('div'); delCancel.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #9ca3af;color:#9ca3af;-webkit-tap-highlight-color:transparent;'; delCancel.textContent='Cancel';
  ;(function(shelf){ emptyBtn.onclick=function(){shDoEmpty(shelf);}; editBtn.onclick=function(){shOpenEdit(shelf);}; delBtn.onclick=function(){shDoDelete(shelf);}; delCancel.onclick=function(){shClearDel(shelf);}; })(shelf);
  delBar.append(emptyBtn,editBtn,delBtn,delCancel);
  body.appendChild(delBar);

  wrap.appendChild(body);
  shRenderGrid(shelf, grid);
  return wrap;
}

/* ── Summary ── */
function shRenderSum(shelf, el){
  if(!el) el=document.getElementById('shsum-'+shelf.id);
  if(!el) return;
  el.innerHTML = '';
  if(!shelf.items.length) return;
  var bw='var(--border-width)',bc='var(--border-color)',m='var(--margin)',r='var(--radius)',bg3='var(--bg-3)';
  var nameMap={};
  shelf.items.forEach(function(c){ if(!nameMap[c.name]) nameMap[c.name]={pct:0,n:0}; nameMap[c.name].pct+=c.pct; nameMap[c.name].n++; });
  var names=Object.keys(nameMap), total=names.length;
  var cols=total===1?1:total===2?2:total===4?2:3;
  var outer=document.createElement('div');
  outer.style.cssText='padding:'+m+';border-top:'+bw+' solid '+bc+';';
  var curRow=null;
  names.forEach(function(name,ni){
    var avg=nameMap[name].pct/nameMap[name].n;
    var color=shColor(Math.max(avg,1)/100);
    var card=document.createElement('div');
    card.style.cssText='position:relative;overflow:hidden;height:22px;border:'+bw+' solid '+bc+';border-radius:'+r+';flex:1;background:'+bg3+';display:block;';
    var fill=document.createElement('div');
    fill.style.cssText='position:absolute;left:0;top:0;bottom:0;opacity:0.5;pointer-events:none;';
    if(avg<=0){fill.style.width='100%';fill.style.background='rgba(200,90,90,0.35)';}
    else{fill.style.width=avg+'%';fill.style.background=color;}
    var lbl=document.createElement('div');
    lbl.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.05em;text-transform:uppercase;color:rgba(255,255,255,0.9);text-align:center;padding:0 3px;overflow:hidden;';
    lbl.textContent=name;
    card.append(fill,lbl);
    if(ni%cols===0){
      curRow=document.createElement('div');
      curRow.style.cssText='display:flex;gap:'+m+';margin-bottom:'+m+';';
      outer.appendChild(curRow);
    }
    curRow.appendChild(card);
  });
  if(outer.lastChild) outer.lastChild.style.marginBottom='0';
  el.appendChild(outer);
}

/* ── Sub-grid ── */
function shRenderGrid(shelf, grid){
  var bw='var(--border-width)',bc='var(--border-color)',bg3='var(--bg-3)',ch='var(--card-height)',m='var(--margin)',r='var(--radius)';
  if(!grid) grid=document.getElementById('shgrid-'+shelf.id);
  if(!grid) return;
  grid.innerHTML='';
  grid.style.cssText='display:grid;grid-template-columns:repeat(8,1fr);grid-auto-rows:'+ch+';gap:'+m+';padding:'+m+';';

  var pos=shPack(shelf.items);
  var occ={};
  pos.forEach(function(p){for(var dr=0;dr<p.rs;dr++)for(var dc=0;dc<p.cs;dc++)occ[(p.r+dr)+','+(p.c+dc)]=true;});
  var maxP=0; pos.forEach(function(p){if(p.r+p.rs-1>maxP)maxP=p.r+p.rs-1;});
  var maxS=0; shelf.sel.forEach(function(k){var rv=+k.split(',')[0];if(rv>maxS)maxS=rv;});
  var rows=Math.max(maxP+1,maxS+1,1);
  var rect=shIsRect(shelf.sel);

  if(shelf.drawing&&shelf.pendingMulti&&!shelf.sel.size){
    var hint=document.createElement('div');
    hint.style.cssText='grid-column:1/-1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;text-align:center;padding:8px;';
    hint.textContent='Tap cells to draw your shape template';
    grid.appendChild(hint);
  }

  for(var rv=1;rv<=rows;rv++) for(var c=0;c<SH_COLS;c++){
    if(occ[rv+','+(c+1)]) continue;
    var cell=document.createElement('div');
    var k=rv+','+(c+1);
    var isSel=shelf.sel.has(k);
    cell.style.cssText='background:'+(isSel?(rect?'#1e3a2f':'#3a1e1e'):'#161f2c')+';border:'+bw+' solid '+(isSel?(rect?'#48a971':'#C85A5A'):'#1c2b3a')+';border-radius:'+r+';min-width:0;min-height:0;-webkit-tap-highlight-color:transparent;';
    cell.style.gridColumn=(c+1)+'/span 1';
    cell.style.gridRow=rv+'/span 1';
    if(!shelf.drawing) cell.style.display='none';
    else cell.style.cursor='pointer';
    ;(function(shelf,k){ cell.onclick=function(){ if(shelf.sel.has(k))shelf.sel.delete(k);else shelf.sel.add(k); shUpdStatus(shelf); shRenderGrid(shelf); }; })(shelf,k);
    grid.appendChild(cell);
  }

  pos.forEach(function(p,idx){
    var item=shelf.items[idx];
    var color=shColor(Math.max(item.pct,1)/100);
    var isWide=(item.rs===1);
    var isSel=(shSelShelfId===shelf.id&&shSelConId===item.id);
    var isDel=(shelf.deleteId===item.id);
    var div=document.createElement('div');
    div.style.cssText='position:relative;overflow:hidden;border:'+bw+' solid '+(isDel?'#C85A5A':isSel?'#fff':bc)+';border-radius:'+r+';background:'+(item.pct<=0?'rgba(200,90,90,0.2)':bg3)+';display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);text-align:center;padding:4px;min-width:0;min-height:0;cursor:pointer;word-break:break-word;overflow-wrap:break-word;line-height:1.2;-webkit-tap-highlight-color:transparent;';
    div.style.gridColumn=(p.c+1)+'/span '+p.cs;
    div.style.gridRow=p.r+'/span '+p.rs;
    var fill=document.createElement('div');
    fill.id='shfill-'+shelf.id+'-'+item.id;
    fill.style.background=color;
    fill.style.opacity='0.4';
    fill.style.pointerEvents='none';
    fill.style.position='absolute';
    fill.style.left='0';
    if(item.pct<=0){fill.style.width='0%';fill.style.height='0%';fill.style.top='0';fill.style.bottom='0';}
    else if(isWide){fill.style.top='0';fill.style.bottom='0';fill.style.right='auto';fill.style.width=item.pct+'%';}
    else{fill.style.bottom='0';fill.style.right='0';fill.style.height=item.pct+'%';}
    var isTall=(item.rs>1&&item.cs===1);
    var nameSpan=document.createElement('span');
    nameSpan.style.display='block';
    nameSpan.textContent=item.name;
    if(isTall) nameSpan.style.cssText='display:block;writing-mode:vertical-rl;transform:rotate(180deg);';
    div.append(fill,nameSpan);
    if(item.total){
      var countSpan=document.createElement('span');
      countSpan.style.cssText='display:block;font-size:7px;opacity:0.7;margin-top:2px;'+(isTall?'writing-mode:vertical-rl;transform:rotate(180deg);':'');
      countSpan.id='shcnt-'+shelf.id+'-'+item.id;
      countSpan.textContent=(item.count||0)+' / '+item.total;
      div.appendChild(countSpan);
    }
    ;(function(shelf,item){
      div.onclick=function(e){
        e.stopPropagation();
        if(shelf.deleteId===item.id){ shClearDel(shelf); }
        else if(shSelShelfId===shelf.id&&shSelConId===item.id){
          shelf.deleteId=item.id; shSelShelfId=null; shSelConId=null; shCloseFooter();
          var bar=document.getElementById('shdel-'+shelf.id); if(bar)bar.style.display='flex';
          shRenderGrid(shelf);
        } else {
          if(shelf.deleteId) shClearDel(shelf);
          shSelShelfId=shelf.id; shSelConId=item.id; shOpenFooter(); shRenderGrid(shelf); shRenderFooter();
        }
      };
    })(shelf,item);
    grid.appendChild(div);
  });
}

/* ── Multi grid ── */
function shRenderMultiGrid(shelf){
  var bw='var(--border-width)',bc='var(--border-color)',bg3='var(--bg-3)',ch='var(--card-height)',m='var(--margin)',r='var(--radius)';
  var grid=document.getElementById('shgrid-'+shelf.id);
  if(!grid) return;
  grid.innerHTML='';
  grid.style.cssText='display:grid;grid-template-columns:repeat(8,1fr);grid-auto-rows:'+ch+';gap:'+m+';padding:'+m+';';

  var pos=shPack(shelf.items);
  var occ={};
  pos.forEach(function(p){for(var dr=0;dr<p.rs;dr++)for(var dc=0;dc<p.cs;dc++)occ[(p.r+dr)+','+(p.c+dc)]=true;});
  var maxP=0; pos.forEach(function(p){if(p.r+p.rs-1>maxP)maxP=p.r+p.rs-1;});
  var slotMax=shMultiSlot?shMultiSlot.r+shMultiRs-1:0;
  var rows=Math.max(maxP+1,slotMax+1,1);
  var slotCells={};
  if(shMultiSlot){ for(var dr=0;dr<shMultiRs;dr++) for(var dc=0;dc<shMultiCs;dc++) slotCells[(shMultiSlot.r+dr)+','+(shMultiSlot.c+1+dc)]=true; }

  for(var rv=1;rv<=rows;rv++) for(var c=0;c<SH_COLS;c++){
    var k=rv+','+(c+1);
    if(occ[k]) continue;
    var isSlot=slotCells[k];
    var cell=document.createElement('div');
    cell.style.cssText='background:'+(isSlot?'#1e3a2f':'#161f2c')+';border:'+bw+' solid '+(isSlot?'#48a971':'#1c2b3a')+';border-radius:'+r+';cursor:'+(isSlot?'pointer':'default')+';min-width:0;min-height:0;-webkit-tap-highlight-color:transparent;';
    cell.style.gridColumn=(c+1)+'/span 1';
    cell.style.gridRow=rv+'/span 1';
    if(isSlot){;(function(){cell.onclick=function(){shPlaceMulti();};})(shelf);}
    grid.appendChild(cell);
  }

  pos.forEach(function(p,idx){
    var item=shelf.items[idx];
    var color=shColor(Math.max(item.pct,1)/100);
    var isWide=(item.rs===1);
    var div=document.createElement('div');
    div.style.cssText='position:relative;overflow:hidden;border:'+bw+' solid '+bc+';border-radius:'+r+';background:'+(item.pct<=0?'rgba(200,90,90,0.2)':bg3)+';display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);text-align:center;padding:4px;min-width:0;min-height:0;cursor:pointer;word-break:break-word;-webkit-tap-highlight-color:transparent;';
    div.style.gridColumn=(p.c+1)+'/span '+p.cs;
    div.style.gridRow=p.r+'/span '+p.rs;
    var fill=document.createElement('div');
    fill.style.background=color;
    fill.style.opacity='0.4'; fill.style.pointerEvents='none'; fill.style.position='absolute'; fill.style.left='0';
    if(item.pct<=0){fill.style.width='0%';fill.style.height='0%';fill.style.top='0';fill.style.bottom='0';}
    else if(isWide){fill.style.top='0';fill.style.bottom='0';fill.style.right='auto';fill.style.width=item.pct+'%';}
    else{fill.style.bottom='0';fill.style.right='0';fill.style.height=item.pct+'%';}
    var isTall2=(item.rs>1&&item.cs===1);
    var ns=document.createElement('span');
    ns.textContent=item.name;
    if(isTall2) ns.style.cssText='writing-mode:vertical-rl;transform:rotate(180deg);';
    div.append(fill,ns);
    ;(function(shelf,item){ div.onclick=function(e){ e.stopPropagation(); shelf.items=shelf.items.filter(function(x){return x.id!==item.id;}); shMultiSlot=shNextSlot(shelf,shMultiCs,shMultiRs); shSave(); shRenderMultiGrid(shelf); }; })(shelf,item);
    grid.appendChild(div);
  });

  var st=document.getElementById('shst-'+shelf.id);
  if(st){st.textContent='Tap the green slot to place another. Tap a placed container to remove it. Tap Done when finished.';st.style.display='block';st.style.color='#9ca3af';}
  var doneRow=document.getElementById('shact-'+shelf.id);
  if(doneRow){
    doneRow.style.display='flex'; doneRow.innerHTML='';
    var doneBtn=document.createElement('div');
    doneBtn.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #9ca3af;color:#9ca3af;-webkit-tap-highlight-color:transparent;';
    doneBtn.textContent='Done';
    ;(function(shelf){doneBtn.onclick=function(){shStopMulti(shelf);};})(shelf);
    doneRow.appendChild(doneBtn);
  }
}

/* ── Status ── */
function shUpdStatus(shelf){
  var rect=shIsRect(shelf.sel);
  var st=document.getElementById('shst-'+shelf.id);
  var conf=document.getElementById('shconf-'+shelf.id);
  var act=document.getElementById('shact-'+shelf.id);
  if(!st) return;
  if(!shelf.sel.size){
    if(shelf.drawing&&shelf.pendingMulti){
      st.textContent='Tap grid cells to draw a shape. Once saved, tap the highlighted slot to keep placing copies.';
      st.style.display='block'; st.style.color='#9ca3af';
      if(act) act.style.display='none'; return;
    }
    st.style.display='none'; if(act) act.style.display='none';
  } else if(rect){
    st.textContent=shelf.pendingMulti?(rect.cs+'x'+rect.rs+' shape ready - tap Save Shape to start placing'):(rect.cs+'x'+rect.rs+' valid');
    st.style.display='block'; st.style.color='#48a971';
    if(act) act.style.display='flex';
    if(conf){conf.style.opacity='1';conf.style.pointerEvents='all';conf.textContent=shelf.pendingMulti?'Save Shape':'Place';}
  } else {
    st.textContent=shelf.pendingMulti?'Shape must be a rectangle - adjust your selection':'Not a rectangle';
    st.style.display='block'; st.style.color='#C85A5A';
    if(act) act.style.display='flex';
    if(conf){conf.style.opacity='0.3';conf.style.pointerEvents='none';}
  }
}

/* ── Draw ── */
function shCancelDraw(shelf){
  shelf.drawing=false; shelf.sel=new Set(); shelf.pendingName=null; shelf.pendingTotal=null; shelf.pendingMulti=false;
  var a=document.getElementById('shact-'+shelf.id); if(a) a.style.display='none';
  var s=document.getElementById('shst-'+shelf.id); if(s){s.style.display='none';s.textContent='';}
  shRenderGrid(shelf);
}

function shConfirmFreehand(shelf){
  var rect=shIsRect(shelf.sel); if(!rect) return;
  shelf.conSeq++;
  shelf.items.push({id:shelf.conSeq,name:shelf.pendingName||('Container '+shelf.conSeq),
    cs:rect.cs,rs:rect.rs,pct:100,total:shelf.pendingTotal,count:shelf.pendingTotal,tens:undefined,ones:undefined});
  var wasMulti=shelf.pendingMulti, pCs=rect.cs, pRs=rect.rs, pName=shelf.pendingName, pTotal=shelf.pendingTotal;
  shSave(); shCancelDraw(shelf);
  if(wasMulti){
    shMultiShelf=shelf; shMultiCs=pCs; shMultiRs=pRs; shMultiName=pName; shMultiTotal=pTotal;
    shMultiSlot=shNextSlot(shelf,pCs,pRs); shRenderMultiGrid(shelf);
  } else {
    shSelShelfId=shelf.id; shSelConId=shelf.conSeq; shOpenFooter(); shRenderGrid(shelf); shRenderFooter();
  }
}

/* ── Multi ── */
function shPlaceMulti(){
  if(!shMultiShelf||!shMultiSlot) return;
  shMultiShelf.conSeq++;
  shMultiShelf.items.push({id:shMultiShelf.conSeq,name:shMultiName,cs:shMultiCs,rs:shMultiRs,
    pct:100,total:shMultiTotal,count:shMultiTotal,tens:undefined,ones:undefined});
  shMultiSlot=shNextSlot(shMultiShelf,shMultiCs,shMultiRs);
  shSave(); shRenderMultiGrid(shMultiShelf);
}

function shStopMulti(shelf){
  var r='var(--radius)',bw='var(--border-width)',bc='var(--border-color)';
  shMultiShelf=null; shMultiSlot=null;
  var st=document.getElementById('shst-'+shelf.id); if(st){st.style.display='none';st.textContent='';}
  var act=document.getElementById('shact-'+shelf.id);
  if(act){
    act.style.display='none'; act.innerHTML='';
    var cb=document.createElement('div'); cb.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #9ca3af;color:#9ca3af;-webkit-tap-highlight-color:transparent;'; cb.textContent='Cancel'; cb.onclick=function(){shCancelDraw(shelf);};
    var cf=document.createElement('div'); cf.id='shconf-'+shelf.id; cf.style.cssText='flex:1;height:30px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:'+r+';border:'+bw+' solid #48a971;color:#48a971;opacity:0.3;pointer-events:none;-webkit-tap-highlight-color:transparent;'; cf.textContent='Place'; cf.onclick=function(){shConfirmFreehand(shelf);};
    act.append(cb,cf);
  }
  shRenderGrid(shelf);
}

/* ── Delete / empty / edit ── */
function shClearDel(shelf){
  shelf.deleteId=null;
  var bar=document.getElementById('shdel-'+shelf.id); if(bar) bar.style.display='none';
  shRenderGrid(shelf); shRenderSum(shelf);
}

function shDoEmpty(shelf){
  if(!shelf.deleteId) return;
  var item=shelf.items.find(function(x){return x.id===shelf.deleteId;});
  if(item){item.pct=0;item.tens=0;item.ones=0;if(item.count!==undefined)item.count=0;}
  shSave(); shClearDel(shelf);
}

function shDoDelete(shelf){
  if(!shelf.deleteId) return;
  shelf.items=shelf.items.filter(function(x){return x.id!==shelf.deleteId;});
  if(!shelf.items.length){
    shelf.open=false; shelf.deleteId=null;
    var body=document.getElementById('shbody-'+shelf.id); if(body) body.style.display='none';
    var bar=document.getElementById('shdel-'+shelf.id); if(bar) bar.style.display='none';
    var sum=document.getElementById('shsum-'+shelf.id); if(sum) sum.style.display='none';
  } else { shClearDel(shelf); }
  shSave();
}

function shOpenEdit(shelf){
  shEditShelf=shelf;
  var item=shelf.items.find(function(x){return x.id===shelf.deleteId;});
  if(!item) return;
  document.getElementById('shEditName').value=item.name||'';
  document.getElementById('shEditNum').value=item.total||'';
  shUpdEditConf();
  document.getElementById('shEditModal').style.display='block';
}

function shCloseEditModal(){ document.getElementById('shEditModal').style.display='none'; shEditShelf=null; }

function shUpdEditConf(){
  var name=document.getElementById('shEditName').value.trim();
  var btn=document.getElementById('shEditConf');
  if(btn){btn.style.opacity=name?'1':'0.3';btn.style.pointerEvents=name?'all':'none';}
}

function shDoEdit(){
  if(!shEditShelf) return;
  var item=shEditShelf.items.find(function(x){return x.id===shEditShelf.deleteId;});
  if(!item) return;
  var name=document.getElementById('shEditName').value.trim(); if(!name) return;
  var num=parseInt(document.getElementById('shEditNum').value)||null;
  item.name=name; item.total=num; if(num&&item.count===undefined) item.count=num;
  var shelf=shEditShelf;
  shSave(); shCloseEditModal(); shClearDel(shelf);
}

/* ── Modal ── */
function shOpenModal(shelf){
  shModalShelf=shelf; shModalShape=null; shModalDraw=false; shModalMode='insert';
  document.getElementById('shModalName').value='';
  document.getElementById('shModalNum').value='';
  var conf=document.getElementById('shModalConf');
  if(conf){conf.style.opacity='0.3';conf.style.pointerEvents='none';conf.textContent='Add Container';}
  var ins=document.getElementById('shModeInsert'); var mul=document.getElementById('shModeMulti');
  if(ins){ins.style.borderColor='#fff'; ins.querySelector('div').style.color='#fff';}
  if(mul){mul.style.borderColor='var(--border-color)'; mul.querySelector('div').style.color='#9ca3af';}
  shBuildShapeCards();
  // Populate shelf name input
  var shelfNameInp=document.getElementById('shModalShelfName');
  if(shelfNameInp) shelfNameInp.value=shelf.name;
  document.getElementById('shAddModal').style.display='block';
  setTimeout(function(){var n=document.getElementById('shModalName');if(n)n.focus();},100);
}

function shModalSaveShelfName(){
  if(!shModalShelf) return;
  var inp=document.getElementById('shModalShelfName');
  var name=inp?inp.value.trim():''; if(!name) return;
  shModalShelf.name=name;
  shSave();
  // Update header label live
  var lbl=document.querySelector('#shbody-'+shModalShelf.id) && document.querySelector('[id="shbody-'+shModalShelf.id+'"]');
  shRenderShelves();
}

function shModalDeleteShelf(){
  if(!shModalShelf) return;
  shShelves=shShelves.filter(function(s){return s.id!==shModalShelf.id;});
  if(shSelShelfId===shModalShelf.id){shSelShelfId=null;shSelConId=null;shCloseFooter();}
  shSave();
  shCloseModal();
  shRenderShelves();
}

function shCloseModal(){ document.getElementById('shAddModal').style.display='none'; shModalShelf=null; }

function shBuildShapeCards(){
  var container=document.getElementById('shShapeCards'); if(!container) return;
  container.innerHTML='';
  var bw='var(--border-width)',bc='var(--border-color)',bg3='var(--bg-3)',m='var(--margin)',r='var(--radius)';

  function makeRow(keys){
    var row=document.createElement('div'); row.style.cssText='display:flex;gap:'+m+';margin-bottom:'+m+';';
    keys.forEach(function(key){
      var sh=SH_SHAPES[key];
      var card=document.createElement('div'); card.id='shsc-'+key;
      card.style.cssText='flex:1;border:'+bw+' solid '+bc+';border-radius:'+r+';background:'+bg3+';cursor:pointer;padding:'+m+';display:block;-webkit-tap-highlight-color:transparent;';
      var lbl=document.createElement('div'); lbl.id='shscl-'+key;
      lbl.style.cssText='font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:4px;';
      lbl.textContent=sh.label; card.appendChild(lbl);
      var prev=document.createElement('div'); prev.style.cssText='display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(2,10px);gap:2px;';
      for(var rv=1;rv<=2;rv++) for(var c=1;c<=8;c++){
        var cell=document.createElement('div');
        var filled=(rv>=sh.cells[0][1]&&rv<sh.cells[0][1]+sh.cells[0][3]&&c>=sh.cells[0][0]&&c<sh.cells[0][0]+sh.cells[0][2]);
        cell.style.cssText='background:'+(filled?'#48a971':'#1c2b3a')+';border-radius:2px;height:10px;';
        prev.appendChild(cell);
      }
      card.appendChild(prev);
      ;(function(key,card,lbl){
        card.onclick=function(){
          shModalShape=key; shModalDraw=false;
          document.querySelectorAll('[id^="shsc-"],[id="shDrawOwn"]').forEach(function(c){c.style.borderColor='var(--border-color)'; var l=c.querySelector('[id^="shscl-"],[id="shDrawOwnLbl"]'); if(l)l.style.color='#9ca3af';});
          card.style.borderColor='#fff'; lbl.style.color='#fff';
          shUpdModalConf();
        };
      })(key,card,lbl);
      row.appendChild(card);
    });
    container.appendChild(row);
  }

  // Draw your own
  var drawRow=document.createElement('div'); drawRow.style.cssText='margin-bottom:'+m+';';
  var dc=document.createElement('div'); dc.id='shDrawOwn';
  dc.style.cssText='border:'+bw+' solid '+bc+';border-radius:'+r+';background:'+bg3+';cursor:pointer;padding:'+m+';display:block;-webkit-tap-highlight-color:transparent;';
  var dl=document.createElement('div'); dl.id='shDrawOwnLbl';
  dl.style.cssText='font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:4px;'; dl.textContent='Draw your own';
  var dp=document.createElement('div'); dp.style.cssText='display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(2,10px);gap:2px;';
  for(var rv=1;rv<=2;rv++) for(var c=1;c<=8;c++){ var cell=document.createElement('div'); cell.style.cssText='background:#1c2b3a;border-radius:2px;height:10px;'; dp.appendChild(cell); }
  dc.append(dl,dp);
  dc.onclick=function(){ shModalDraw=true; shModalShape=null; document.querySelectorAll('[id^="shsc-"],[id="shDrawOwn"]').forEach(function(c){c.style.borderColor='var(--border-color)'; var l=c.querySelector('[id^="shscl-"],[id="shDrawOwnLbl"]'); if(l)l.style.color='#9ca3af';}); dc.style.borderColor='#fff'; dl.style.color='#fff'; shUpdModalConf(); };
  drawRow.appendChild(dc); container.appendChild(drawRow);

  makeRow(['h8','h4']);
  makeRow(['h3','h2']);
  makeRow(['sq','tl']);
}

function shPickMode(mode){
  shModalMode=mode;
  var ins=document.getElementById('shModeInsert'); var mul=document.getElementById('shModeMulti');
  if(ins){var l=ins.querySelector('div'); ins.style.borderColor=mode==='insert'?'#fff':'var(--border-color)'; if(l)l.style.color=mode==='insert'?'#fff':'#9ca3af';}
  if(mul){var l=mul.querySelector('div'); mul.style.borderColor=mode==='multi'?'#fff':'var(--border-color)'; if(l)l.style.color=mode==='multi'?'#fff':'#9ca3af';}
  var conf=document.getElementById('shModalConf'); if(conf) conf.textContent=mode==='multi'?'Add + Keep Adding':'Add Container';
}

function shUpdModalConf(){
  var name=document.getElementById('shModalName')?document.getElementById('shModalName').value.trim():'';
  var has=shModalShape||shModalDraw;
  var btn=document.getElementById('shModalConf');
  if(btn){btn.style.opacity=(name&&has)?'1':'0.3'; btn.style.pointerEvents=(name&&has)?'all':'none';}
}

function shModalConf(){
  var name=document.getElementById('shModalName').value.trim(); if(!name) return;
  var num=parseInt(document.getElementById('shModalNum').value)||null;
  var shelf=shModalShelf;
  if(shModalDraw){
    shelf.pendingName=name; shelf.pendingTotal=num; shelf.pendingMulti=(shModalMode==='multi');
    shelf.drawing=true; shelf.sel=new Set(); shelf.open=true;
    shCloseModal();
    var body=document.getElementById('shbody-'+shelf.id); if(body) body.style.display='block';
    shRenderGrid(shelf); shUpdStatus(shelf);
  } else if(shModalShape){
    var sh=SH_SHAPES[shModalShape];
    shelf.conSeq++;
    shelf.items.push({id:shelf.conSeq,name:name,cs:sh.cs,rs:sh.rs,pct:100,total:num,count:num,tens:undefined,ones:undefined});
    var newId=shelf.conSeq, wasMulti=(shModalMode==='multi');
    shSave();
    if(wasMulti){
      shMultiShelf=shelf; shMultiCs=sh.cs; shMultiRs=sh.rs; shMultiName=name; shMultiTotal=num;
      shCloseModal(); shelf.open=true;
      var body=document.getElementById('shbody-'+shelf.id); if(body) body.style.display='block';
      shMultiSlot=shNextSlot(shelf,sh.cs,sh.rs); shRenderMultiGrid(shelf);
    } else {
      shCloseModal(); shelf.open=true;
      var body=document.getElementById('shbody-'+shelf.id); if(body) body.style.display='block';
      shSelShelfId=shelf.id; shSelConId=newId; shRenderGrid(shelf); shOpenFooter(); shRenderFooter();
    }
  }
}

/* ── Footer ── */
function shOpenFooter(){ var f=document.getElementById('shFooter'); if(f) f.style.maxHeight='200px'; }
function shCloseFooter(){ var f=document.getElementById('shFooter'); if(f) f.style.maxHeight='0'; shSelShelfId=null; shSelConId=null; }

function shGetCon(){
  if(!shSelShelfId||!shSelConId) return null;
  var shelf=shShelves.find(function(s){return s.id===shSelShelfId;}); if(!shelf) return null;
  return shelf.items.find(function(c){return c.id===shSelConId;});
}

function shApplyPct(pct){
  var c=shGetCon(); if(!c) return;
  c.pct=Math.max(0,Math.min(100,pct));
  if(pct>=100){c.tens=undefined;c.ones=undefined;}
  var color=shColor(Math.max(c.pct,1)/100);
  var fill=document.getElementById('shfill-'+shSelShelfId+'-'+shSelConId);
  if(fill){
    if(c.pct<=0){fill.style.width='0%';fill.style.height='0%';}
    else{if(c.rs===1)fill.style.width=c.pct+'%';else fill.style.height=c.pct+'%';fill.style.background=color;}
    var con=fill.parentNode; if(con) con.style.background=c.pct<=0?'rgba(200,90,90,0.2)':'var(--bg-3)';
  }
  shSave(); shRenderFooter();
  var shelf=shSelShelfId?shShelves.find(function(s){return s.id===shSelShelfId;}):null;
  if(shelf) shRenderSum(shelf);
}

function shAdjCount(delta){
  var c=shGetCon(); if(!c||!c.total) return;
  c.count=Math.max(0,Math.min(c.total,(c.count||0)+delta));
  c.pct=Math.round(c.count/c.total*100);
  var color=shColor(Math.max(c.pct,1)/100);
  var fill=document.getElementById('shfill-'+shSelShelfId+'-'+shSelConId);
  if(fill){
    if(c.pct<=0){fill.style.width='0%';fill.style.height='0%';}
    else{if(c.rs===1)fill.style.width=c.pct+'%';else fill.style.height=c.pct+'%';fill.style.background=color;}
    var con=fill.parentNode; if(con) con.style.background=c.pct<=0?'rgba(200,90,90,0.2)':'var(--bg-3)';
  }
  var ce=document.getElementById('shcnt-'+shSelShelfId+'-'+shSelConId); if(ce) ce.textContent=c.count+' / '+c.total;
  var disp=document.getElementById('shCountDisp'); if(disp){disp.textContent=c.count+' / '+c.total;disp.style.color=color;}
  shSave(); shRenderFooter();
  var shelf=shSelShelfId?shShelves.find(function(s){return s.id===shSelShelfId;}):null;
  if(shelf) shRenderSum(shelf);
}

function shSetTab(tab){
  shActiveTab=tab;
  var tp=document.getElementById('shTabPct'), tf=document.getElementById('shTabFrac');
  var fp=document.getElementById('shFootPct'), ff=document.getElementById('shFootFrac');
  var bg2='var(--bg-2)';
  if(tp){tp.style.background=tab==='pct'?bg2:'transparent';tp.style.color=tab==='pct'?'#fff':'#9ca3af';}
  if(tf){tf.style.background=tab==='frac'?bg2:'transparent';tf.style.color=tab==='frac'?'#fff':'#9ca3af';}
  if(fp) fp.style.display=tab==='pct'?'block':'none';
  if(ff) ff.style.display=tab==='frac'?'block':'none';
}

function shRenderFooterIfSel(){ if(shSelShelfId&&shSelConId){ shOpenFooter(); shRenderFooter(); } }

function shRenderFooter(){
  var c=shGetCon(); if(!c) return;
  var bw='var(--border-width)',bc='var(--border-color)';
  var cb=document.getElementById('shCountBar'), cd=document.getElementById('shCountDisp');
  if(c.total&&cb&&cd){cb.style.display='block';cd.textContent=(c.count||0)+' / '+c.total;cd.style.color=shColor(Math.max(c.pct,1)/100);}
  else if(cb) cb.style.display='none';
  var curTens=c.tens!==undefined?c.tens:Math.floor(Math.round(c.pct)/10)*10;
  var curOnes=c.ones!==undefined?c.ones:Math.round(c.pct)%10;
  var at100=c.pct>=100;
  var b100=document.getElementById('shBtn100'); if(b100){b100.style.background=at100?'#fff':'#48a971';b100.style.color=at100?'#48a971':'#fff';}
  var tensEl=document.getElementById('shTensRow'), onesEl=document.getElementById('shOnesRow');
  if(!tensEl||!onesEl) return;
  tensEl.innerHTML=''; onesEl.innerHTML='';
  [0,10,20,30,40,50,60,70,80,90].forEach(function(p,i){
    var on=p===curTens&&!at100,above=p>c.pct&&!on,col=shColor(Math.max(p,1)/100);
    var cell=document.createElement('div');
    cell.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;cursor:pointer;user-select:none;background:'+(on?'#fff':above?'#1e2a35':col)+';color:'+(on?col:above?col:'#fff')+';-webkit-tap-highlight-color:transparent;'+(i===0?'width:20px;min-width:20px;flex:none;':'')+(i>0?'border-left:'+bw+' solid '+bc+';':'');
    cell.textContent=p===0?'00':p;
    ;(function(p){cell.onclick=function(){c.tens=p;c.ones=0;shApplyPct(p);};})(p);
    tensEl.appendChild(cell);
  });
  [0,1,2,3,4,5,6,7,8,9].forEach(function(o,i){
    var fp=Math.min(100,curTens+o),on=o===curOnes&&!at100,above=fp>c.pct&&!on,col=shColor(Math.max(fp,1)/100);
    var cell=document.createElement('div');
    cell.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;cursor:pointer;user-select:none;background:'+(on?'#fff':above?'#1e2a35':col)+';color:'+(on?col:above?col:'#fff')+';-webkit-tap-highlight-color:transparent;'+(i===0?'width:20px;min-width:20px;flex:none;':'')+(i>0?'border-left:'+bw+' solid '+bc+';':'');
    cell.textContent=o;
    ;(function(o,ct){cell.onclick=function(){c.ones=o;shApplyPct(Math.min(100,ct+o));};})(o,curTens);
    onesEl.appendChild(cell);
  });
  var FR1=[[1,4],[1,3],[1,2],[2,3],[3,4]],FR2=[[1,8],[1,6],[1,5],[2,5],[3,5],[4,5],[7,8]];
  var FC={2:'#374151',3:'#4a5568',4:'#2d6a8a',5:'#5A8DB8',6:'#3a6b5a',8:'#2d5a6b'};
  var ratio=c.pct/100;
  [FR1,FR2].forEach(function(fracs,ri){
    var row=document.getElementById('shFracR'+(ri+1)); if(!row) return; row.innerHTML='';
    fracs.forEach(function(nd,i){
      var n=nd[0],d=nd[1],isSel=Math.abs(n/d-ratio)<0.06,fc=FC[d]||'#374151',above=!isSel&&(n/d)>ratio;
      var cell=document.createElement('div');
      cell.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;cursor:pointer;background:'+(isSel?'#fff':above?'#1e2a35':fc)+';color:'+(isSel?fc:above?fc:'#fff')+';-webkit-tap-highlight-color:transparent;'+(i>0?'border-left:'+bw+' solid '+bc+';':'');
      cell.innerHTML='<sup>'+n+'</sup><span style="font-size:8px">/</span><sub>'+d+'</sub>';
      ;(function(n,d){cell.onclick=function(){var p=Math.round(n/d*100);c.tens=Math.floor(p/10)*10;c.ones=p%10;shApplyPct(p);};})(n,d);
      row.appendChild(cell);
    });
  });
}




/* ── Hook setPage for Meals tab ── */
;(function(){
  var _origSetPage = setPage;
  setPage = function(p){
    _origSetPage(p);
    if(p === 'Shelf') shRender();
  };
})();
