/* ── PANTRY PRO · app.js ─────────────────────────────────────────────
   Core utilities, data, modal, page routing, focus/scroll,
   settings windows, data import/export, stats window, sales window.
   Shared by all other modules.
── */
'use strict';


'use strict';

/* ── STORAGE ── */
function ls(k,def){ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):def; }catch(e){ return def; } }
function lsSet(k,v){ localStorage.setItem(k,JSON.stringify(v)); }

/* ── CATEGORIES ── */
const DEFAULT_CATS = [
  {id:'other',      label:'Other',      color:'#7c94a4'},
  {id:'produce',    label:'Produce',    color:'#30a85a'},
  {id:'dairy',      label:'Dairy',      color:'#347ab8'},
  {id:'meat',       label:'Meat',       color:'#d94f4f'},
  {id:'seafood',    label:'Seafood',    color:'#18a898'},
  {id:'deli',       label:'Deli',       color:'#d97f30'},
  {id:'bakery',     label:'Bakery',     color:'#bf6015'},
  {id:'pasta',      label:'Pasta',      color:'#d4c030'},
  {id:'grains',     label:'Grains',     color:'#b8a018'},
  {id:'pantry',     label:'Pantry',     color:'#9f4a08'},
  {id:'canned',     label:'Canned',     color:'#a8b8c4'},
  {id:'condiments', label:'Condiments', color:'#e8a055'},
  {id:'spices',     label:'Spices',     color:'#c03535'},
  {id:'frozen',     label:'Frozen',     color:'#0a8878'},
  {id:'snacks',     label:'Snacks',     color:'#e8d54a'},
  {id:'cereal',     label:'Cereal',     color:'#7c58a8'},
  {id:'drinks',     label:'Drinks',     color:'#1c5c9a'},
  {id:'alcohol',    label:'Alcohol',    color:'#5e3888'},
  {id:'health',     label:'Health',     color:'#1a8a3e'},
  {id:'baby',       label:'Baby',       color:'#e07aa8'},
  {id:'pets',       label:'Pets',       color:'#5c9ed4'},
  {id:'cleaning',   label:'Cleaning',   color:'#5c9ed4'},
  {id:'personal',   label:'Personal',   color:'#b0306a'},
];
const ROOT_COLORS = [
  { name:'Red',    shades:['#f4a0a0','#e87070','#d94f4f','#c03535','#a02020','#7a1010'] },
  { name:'Coral',  shades:['#f4b8a0','#e89070','#d96840','#c04820','#9a3010','#721c06'] },
  { name:'Orange', shades:['#f4c08a','#e8a055','#d97f30','#bf6015','#9f4a08','#7a3400'] },
  { name:'Brown',  shades:['#d4b896','#b89060','#96683a','#7a4c22','#5e3410','#3e2008'] },
  { name:'Olive',  shades:['#d4d090','#bcb85a','#a0a030','#848418','#686808','#4c4c04'] },
  { name:'Yellow', shades:['#f5e87a','#e8d54a','#d4c030','#b8a018','#927c08','#6e5c00'] },
  { name:'Green',  shades:['#90e0b0','#58c880','#30a85a','#1a8a3e','#0e6c28','#074e18'] },
  { name:'Teal',   shades:['#80ddd5','#44c4b8','#18a898','#0a8878','#056860','#024844'] },
  { name:'Blue',   shades:['#90c4e8','#5c9ed4','#347ab8','#1c5c9a','#0e4278','#062c55'] },
  { name:'Purple', shades:['#c0aadc','#a080c4','#7c58a8','#5e3888','#44206c','#2c1050'] },
  { name:'Pink',   shades:['#f0a8c8','#e07aa8','#cc5088','#b0306a','#8c1850','#640a38'] },
  { name:'Grey',   shades:['#d0d8e0','#a8b8c4','#7c94a4','#587488','#385468','#1e384a'] },
];
const DEFAULT_UNITS=[
  {id:'unit',   label:'Unit',        plural:'Units',        abbr:'unit'},
  {id:'oz',     label:'Ounce',       plural:'Ounces',       abbr:'oz'},
  {id:'fl oz',  label:'Fl Ounce',    plural:'Fl Ounces',    abbr:'fl oz'},
  {id:'lbs',    label:'Pound',       plural:'Pounds',       abbr:'lbs'},
  {id:'g',      label:'Gram',        plural:'Grams',        abbr:'g'},
  {id:'kg',     label:'Kilogram',    plural:'Kilograms',    abbr:'kg'},
  {id:'ml',     label:'Milliliter',  plural:'Milliliters',  abbr:'ml'},
  {id:'l',      label:'Liter',       plural:'Liters',       abbr:'l'},
  {id:'cups',   label:'Cup',         plural:'Cups',         abbr:'cups'},
  {id:'tbsp',   label:'Tablespoon',  plural:'Tablespoons',  abbr:'tbsp'},
  {id:'tsp',    label:'Teaspoon',    plural:'Teaspoons',    abbr:'tsp'},
  {id:'each',   label:'Each',        plural:'Each',         abbr:'each'},
  {id:'dozen',  label:'Dozen',       plural:'Dozens',       abbr:'doz'},
  {id:'cans',   label:'Can',         plural:'Cans',         abbr:'cans'},
  {id:'cartons',label:'Carton',      plural:'Cartons',      abbr:'ctn'},
  {id:'gallon', label:'Gallon',      plural:'Gallons',      abbr:'gal'},
  {id:'pint',   label:'Pint',        plural:'Pints',        abbr:'pt'},
  {id:'quart',  label:'Quart',       plural:'Quarts',       abbr:'qt'},
];

// Returns the appropriate display form — abbr for metrics, singular/plural label for countables
function getUnitDisplay(unitId, qty){
  const u=getUnit(unitId);
  const n=parseFloat(qty)||0;
  const abbrSelfPlural=new Set(['oz','fl oz','lbs','g','kg','ml','l','tbsp','tsp','cups']);
  if(abbrSelfPlural.has(unitId)) return u.abbr||unitId;
  if(n===1) return u.label||u.abbr||unitId;
  return u.plural||(u.label+'s')||u.abbr||unitId;
}
function getUnitLabel(unitId, qty){
  const u=getUnit(unitId);
  const n=parseFloat(qty)||0;
  if(n===1) return u.label||u.abbr||unitId;
  return u.plural||(u.label+'s')||u.abbr||unitId;
}
function getUnitAbbr(unitId){ return getUnit(unitId).abbr||unitId; }

function getCats(){
  const del=ls('cat_deleted',[]), custom=ls('cat_custom',[]);
  const ov=ls('cat_color_overrides',{});
  const base=[DEFAULT_CATS[0],...DEFAULT_CATS.slice(1).filter(c=>!del.includes(c.id)),...custom];
  return base.map(c=>ov[c.id]?{...c,color:ov[c.id]}:c);
}
function getCat(id){
  const ov=ls('cat_color_overrides',{});
  const cat=getCats().find(c=>c.id===id)||DEFAULT_CATS[0];
  return ov[cat.id]?{...cat,color:ov[cat.id]}:cat;
}
function getCatColor(id, fallback){
  const ov=ls('cat_color_overrides',{});
  return ov[id]||fallback||'#9ca3af';
}
const CORE_UNITS=new Set(['oz','fl oz','lbs','g','kg','ml','l','cups','tbsp','tsp','each','cans','cartons','unit']);
function getUnits(){
  const del=ls('unit_deleted',[]), custom=ls('unit_custom',[]), ov=ls('unit_overrides',{});
  // core units can never be deleted
  const base=[DEFAULT_UNITS[0],...DEFAULT_UNITS.slice(1).filter(u=>CORE_UNITS.has(u.id)||!del.includes(u.id)),...custom];
  return base.map(u=>ov[u.id]?{...u,...ov[u.id]}:u);
}

// Units that should show the dry/liquid type toggle
const TYPE_TOGGLE_UNITS=new Set(['oz','fl oz','lbs','g','kg','ml','l','cups','cup','tbsp','tsp','each','cans','cartons','gallon','gallons','pint','pints','quart','quarts','dozen','unit']);
function getUnit(id){ return getUnits().find(u=>u.id===id)||DEFAULT_UNITS[0]; }

/* ── PAGE SWITCHING ── */
function setPage(p){
  focusDimHide(); ptScrollReset();
  window.scrollTo(0,0);
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.header-tab-btn').forEach(el=>el.classList.remove('active'));
  document.getElementById('page'+p).classList.add('active');
  document.getElementById('h'+p).classList.add('active');
  // clear search bars and quick-add state
  const gl=document.getElementById('glSearch'); if(gl) gl.value='';
  glQuickAddState=null; glQuickAddName=''; glThinkPhraseSet=false; glThinkCardEl=null;
  const cs=document.getElementById('csSearch'); if(cs) cs.value='';
  msQuickAddState=null; msQuickAddName=''; msQuickAddCat=null; msThinkPhraseSet=false; msThinkCardEl=null;
  csQuickAddState=null; csQuickAddName=''; csThinkPhraseSet=false; csThinkCardEl=null;
  glOpenState={}; csOpenState={}; msOpenState={};
  if(p==='Grocery'){ glActiveFilter='all'; setGlFilter('all'); glRender(); }
  if(p==='Pantry'){ ptCardRegistry.forEach(c=>c.close()); ptCardRegistry=[]; ptOpenSet.clear(); ptActiveFilter='onhand'; ptViewMode='pantry'; const pts=document.getElementById('ptSearch'); if(pts) pts.value=''; ptThinkPhraseSet=false; ptQuickAddState=null; ptQuickAddName=''; ptThinkCardEl=null; ptRender(); }
  if(p==='Stats'){ renderStatsPage(); }
}

/* ── MODAL ── */
let modalCtx=null, modalSelPend=null;
const modalDelPend=new Set();
let selectedRootIdx=0;
let newCatColor=ROOT_COLORS[0].shades[2];
let editingColorCatId=null;

function openModal(ctx){
  modalCtx=ctx; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
  document.getElementById('modalTitle').textContent=ctx==='unit'?'Unit':'Category';
  buildModalGrid();
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  if(modalCtx==='ms-quickadd'){ window._msQuickAddName=null; msQuickAddState='confirm'; msRender(); }
  if(modalCtx==='gl-quickadd'){ window._glQuickAddName=null; glQuickAddState='confirm'; glRender(); }
  if(modalCtx==='cs-quickadd-cat'){ csQuickAddState='confirm'; csRender(); }
  if(modalCtx==='cs-quickadd-unit'){ csQuickAddState='pick-unit'; csRender(); }
  if(modalCtx==='pt-quickadd-cat'){ ptQuickAddState='confirm'; const q=(document.getElementById('ptSearch')?.value||'').trim(); ptRenderThinkSlot(q); }
  if(modalCtx==='pt-quickadd-unit'){ ptQuickAddState='pick-unit'; const q=(document.getElementById('ptSearch')?.value||'').trim(); ptRenderThinkSlot(q); }
  modalCtx=null; modalSelPend=null; editingColorCatId=null;
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

function _openGridWindow(ctx, title, color){
  // Build a full-screen overlay window that reuses buildModalGrid
  const existing=document.getElementById('_gridWindow');
  if(existing) existing.remove();

  modalCtx=ctx; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];

  const ov=document.createElement('div'); ov.id='_gridWindow';
  ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:260;background:var(--bg-1);display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';

  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-2);';
  const htitle=document.createElement('div'); htitle.style.cssText=`flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${color||'#fff'};`;
  htitle.textContent=title;
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);font-size:22px;font-weight:900;color:#fff;cursor:pointer;';
  hclose.textContent='×';
  hclose.onclick=()=>{ ov.remove(); modalCtx=null; modalSelPend=null; editingColorCatId=null; };
  hdr.append(htitle,hclose); ov.appendChild(hdr);

  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;padding:var(--margin);';

  // Proxy grid element
  const grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:var(--margin);';
  body.appendChild(grid); ov.appendChild(body); document.body.appendChild(ov);

  // Temporarily rename the real modalGrid so getElementById finds ours
  const realGrid=document.getElementById('modalGrid');
  if(realGrid) realGrid.id='_modalGrid_hidden';
  grid.id='modalGrid';
  buildModalGrid();

  // Keep the swap active — restore real grid only when window closes
  // buildModalGrid always finds our grid while window is open
  hclose.onclick=()=>{
    grid.id='_windowGrid';
    if(realGrid) realGrid.id='modalGrid';
    ov.remove(); modalCtx=null; modalSelPend=null; editingColorCatId=null;
  };
}

function openCategoriesWindow(){ _openGridWindow('ms','Categories','#C7824A'); }
function openUnitsWindow(){ _openGridWindow('unit','Units of Measurement','#5A8DB8'); }

function getUsedColors(){ return getCats().map(c=>c.color.toLowerCase()); }

function updateCatColor(catId, color){
  const custom=ls('cat_custom',[]);
  const ci=custom.findIndex(c=>c.id===catId);
  if(ci>-1){ custom[ci].color=color; lsSet('cat_custom',custom); }
  else { const ov=ls('cat_color_overrides',{}); ov[catId]=color; lsSet('cat_color_overrides',ov); }
  glRender(); msRender();
}

function buildModalGrid(){
  const grid=document.getElementById('modalGrid');
  grid.innerHTML='';
  grid.style.gridTemplateColumns='1fr 1fr';
  const isUnit = modalCtx==='unit' || modalCtx==='ms-unit' || modalCtx==='cs-quickadd-unit' || modalCtx==='pt-quickadd-unit' || modalCtx==='new-item-unit';
  const list=isUnit?getUnits():getCats();

  let curSel;
  if(modalCtx==='unit') curSel=csSelectedUnit;
  else if(modalCtx==='ms-unit'){ const it=ls('ms_items',[]).find(i=>i.id===msEditItemId); curSel=it?.unit||'unit'; }
  else if(modalCtx==='ms-cat'){ const it=ls('ms_items',[]).find(i=>i.id===msEditItemId); curSel=it?.category||'other'; }
  else if(modalCtx==='cs-quickadd-unit') curSel=csQuickAddUnit||'unit';
  else if(modalCtx==='pt-quickadd-unit') curSel=ptQuickAddUnit||'unit';
  else if(modalCtx==='new-item-unit') curSel=window._newItemUnit||'unit';
  else if(modalCtx==='pt-quickadd-cat') curSel=ptQuickAddCat||'other';
  else if(modalCtx==='cs-quickadd-cat') curSel=csQuickAddCat||'other';
  else curSel=modalCtx==='gl'?glSelectedCat:msSelectedCat;

  list.forEach(item=>{
    const isSel=item.id===curSel, isPend=modalSelPend===item.id;
    const isDelPend=modalDelPend.has(item.id);
    const isDeletable=item.id!=='other'&&item.id!=='unit';

    const btn=document.createElement('button');
    btn.className='modal-cat-btn'+(isSel?' sel-active':'')+(isPend?' sel-pending':'');
    const catColor = getCatColor(item.id, item.color);
    if(!isUnit) btn.style.setProperty('--cat-color',catColor);
    if(item.id==='other'||item.id==='unit') btn.style.gridColumn='1/-1';

    if(isUnit){
      const UNIT_NAMES={'oz':'Ounces','lbs':'Pounds','g':'Grams','kg':'Kilograms','ml':'Millilitres','l':'Litres','fl oz':'Fluid Oz','cartons':'Cartons','cans':'Cans','each':'Each','unit':'Unit','pinch':'Pinch','tbsp':'Tablespoon','tsp':'Teaspoon','cups':'Cups'};
      const inner=document.createElement('span'); inner.className='modal-cat-label'; inner.style.cssText='flex-direction:column;gap:2px;';
      const nameEl=document.createElement('span'); nameEl.style.cssText='font-size:10px;font-weight:800;'; nameEl.textContent=UNIT_NAMES[item.id]||item.label;
      const abbrEl=document.createElement('span'); abbrEl.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.6;'; abbrEl.textContent=item.abbr||item.id;
      inner.append(nameEl,abbrEl); btn.appendChild(inner);
    } else {
      const lbl=document.createElement('span');
      lbl.className='modal-cat-label';
      if(!isUnit) lbl.style.color=catColor;
      lbl.textContent=item.label;
      btn.appendChild(lbl);
    }

    btn.onclick=e=>{
      if(e.target.closest('.modal-del-sq')) return;
      if(isUnit){
        if(modalSelPend===item.id){
          modalSelPend=null;
          if(modalCtx==='ms-unit'){ msSetUnit(msEditItemId,item.id); closeModal(); }
          else if(modalCtx==='cs-quickadd-unit'){ csQuickAddUnit=item.id; closeModal(); csQuickAddState='done'; csQuickAddFinalise(); }
          else if(modalCtx==='pt-quickadd-unit'){ ptQuickAddUnit=item.id; closeModal(); ptQuickAddState='done'; ptQuickAddFinalise(); }
          else if(modalCtx==='new-item-unit'){ window._newItemUnit=item.id; closeModal(); if(window._newItemUnitCallback) window._newItemUnitCallback(item.id); }
          else { csSelectedUnit=item.id; updateUnitBtn(); closeModal(); }
        } else {
          modalSelPend=item.id; buildModalGrid();
          if(!isUnit) setTimeout(()=>{ if(modalSelPend===item.id){ modalSelPend=null; buildModalGrid(); } },3000);
        }
      } else {
        if(modalSelPend===item.id){
          modalSelPend=null;
          if(modalCtx==='gl-quickadd'){
            const name=window._glQuickAddName||'';
            if(name){
              const newItem={id:'gl_'+Date.now()+Math.random(),name,category:item.id,checked:false};
              const gl=ls('gl_items',[]); gl.push(newItem); lsSet('gl_items',gl);
              msPopulate(name,item.id);
              trackCatUsage(item.id);
              window._glQuickAddName=null; glQuickAddState='success'; glQuickAddName='';
              closeModal(); glRender();
            }
          } else if(modalCtx==='ms-quickadd'){
            msQuickAddCat=item.id;
            closeModal(); msQuickAddState='pick-buysize'; msRender();
          } else if(modalCtx==='cs-quickadd-cat'){
            csQuickAddCat=item.id; closeModal(); csQuickAddState='pick-unit'; csRender();
          } else if(modalCtx==='pt-quickadd-cat'){
            ptQuickAddCat=item.id; closeModal(); ptQuickAddState='pick-unit'; const q=(document.getElementById('ptSearch')?.value||'').trim(); ptRenderThinkSlot(q);
          } else if(modalCtx==='ms-cat'){ msSetCat(msEditItemId,item.id); closeModal(); }
          else if(modalCtx==='new-item-cat'){ const cat=getCat(item.id); closeModal(); if(window._newItemCatCallback) window._newItemCatCallback(item.id, cat.label, cat.color); }
          else if(modalCtx==='gl'){ glSelectedCat=item.id; updateGlBtn(); closeModal(); }
          else { msSelectedCat=item.id; updateMsBtn(); closeModal(); }
        } else {
          modalSelPend=item.id;
          editingColorCatId=item.id;
          selectedRootIdx=0;
          buildModalGrid();
          setTimeout(()=>{ if(modalSelPend===item.id){ modalSelPend=null; editingColorCatId=null; buildModalGrid(); } },4000);
        }
      }
    };

    if(isDeletable){
      const d=document.createElement('div');
      d.className='modal-del-sq'+(isDelPend?' pending':'');
      d.textContent='×';
      d.onclick=e=>{
        e.stopPropagation();
        if(modalDelPend.has(item.id)){
          modalDelPend.delete(item.id);
          if(isUnit) deleteUnit(item.id); else deleteCat(item.id);
        } else {
          modalDelPend.add(item.id); buildModalGrid();
          setTimeout(()=>{ modalDelPend.delete(item.id); buildModalGrid(); },2000);
        }
      };
      btn.appendChild(d);
    }
    grid.appendChild(btn);
  });

  // Add panel
  const panel=document.createElement('div');
  panel.className='add-cat-panel';

  if(isUnit && modalSelPend){
    // Edit panel for pending unit
    const pendUnit=list.find(u=>u.id===modalSelPend);
    if(pendUnit){
      const editLbl=document.createElement('div'); editLbl.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);'; editLbl.textContent='Editing: '+pendUnit.label;
      panel.appendChild(editLbl);
      const nameInpE=document.createElement('input'); nameInpE.className='add-cat-input'; nameInpE.placeholder='Full name…'; nameInpE.value=pendUnit.label; nameInpE.maxLength=30;
      const abbrInpE=document.createElement('input'); abbrInpE.className='add-cat-input'; abbrInpE.placeholder='Abbreviation (e.g. lbs)…'; abbrInpE.value=pendUnit.abbr||pendUnit.id; abbrInpE.maxLength=10;
      const editBtnRow=document.createElement('div'); editBtnRow.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const saveE=document.createElement('div'); saveE.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;background:#1d3318;color:#48a971;cursor:pointer;'; saveE.textContent='Update Unit';
      saveE.onclick=()=>{
        const newLabel=nameInpE.value.trim(); if(!newLabel) return;
        const newAbbr=abbrInpE.value.trim()||newLabel.toLowerCase().slice(0,3);
        const custom=ls('unit_custom',[]); const cu=custom.find(u=>u.id===pendUnit.id);
        if(cu){ cu.label=newLabel; cu.abbr=newAbbr; lsSet('unit_custom',custom); }
        else {
          // default unit — store override
          const ov=ls('unit_overrides',{}); ov[pendUnit.id]={label:newLabel,abbr:newAbbr}; lsSet('unit_overrides',ov);
        }
        modalSelPend=null; buildModalGrid();
      };
      const divider=document.createElement('div'); divider.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
      const deselCard=document.createElement('div'); deselCard.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;background:var(--bg-3);color:var(--muted);cursor:pointer;'; deselCard.textContent='Deselect';
      deselCard.onclick=()=>{ modalSelPend=null; buildModalGrid(); };
      editBtnRow.append(saveE,divider,deselCard);
      panel.append(nameInpE,abbrInpE,editBtnRow);
    }
  } else {
    // New unit add panel
    const inp=document.createElement('input'); inp.className='add-cat-input'; inp.placeholder=isUnit?'Full name (e.g. Pounds)…':'New category name…'; inp.maxLength=30; panel.appendChild(inp);
    let abbrInp=null;
    if(isUnit){
      abbrInp=document.createElement('input'); abbrInp.className='add-cat-input'; abbrInp.placeholder='Abbreviation (e.g. lbs)…'; abbrInp.maxLength=10; panel.appendChild(abbrInp);
    }

    if(!isUnit){
      if(editingColorCatId){
        const editLbl=document.createElement('div');
        const editCat=getCat(editingColorCatId);
        editLbl.style.cssText='font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:'+editCat.color+';';
        editLbl.textContent='Editing: '+editCat.label;
        panel.appendChild(editLbl);
      }
      const rootRow=document.createElement('div'); rootRow.className='swatches'; rootRow.style.justifyContent='space-between';
      ROOT_COLORS.forEach((root,ri)=>{
        const s=document.createElement('div'); s.className='swatch'+(selectedRootIdx===ri?' active':''); s.style.background=root.shades[2]; s.style.border='3px solid '+(selectedRootIdx===ri?'#fff':'#000'); s.onclick=()=>{ selectedRootIdx=ri; buildModalGrid(); }; rootRow.appendChild(s);
      }); panel.appendChild(rootRow);
      const div=document.createElement('div'); div.style.cssText='height:0;border-bottom:var(--border-width) solid var(--border-color);margin:2px 0;'; panel.appendChild(div);
      const used=getUsedColors(); const shadeRow=document.createElement('div'); shadeRow.className='swatches'; shadeRow.style.justifyContent='space-between';
      ROOT_COLORS[selectedRootIdx].shades.forEach(shade=>{
        const isUsed=used.includes(shade.toLowerCase()) && shade.toLowerCase()!==newCatColor.toLowerCase();
        const s=document.createElement('div'); s.style.cssText=`width:24px;height:24px;border-radius:50%;background:${shade};border:3px solid ${shade===newCatColor.toLowerCase()||shade.toLowerCase()===newCatColor.toLowerCase()?'#fff':'#000'};cursor:${isUsed?'default':'pointer'};position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
        if(isUsed){ const x=document.createElement('span'); x.textContent='×'; x.style.cssText='color:#fff;font-size:16px;font-weight:900;line-height:1;'; s.appendChild(x); }
        else { s.onclick=()=>{ newCatColor=shade; if(editingColorCatId){ updateCatColor(editingColorCatId,shade); editingColorCatId=null; modalSelPend=null; } buildModalGrid(); }; }
        shadeRow.appendChild(s);
      }); panel.appendChild(shadeRow);
    }

    const addBtn=document.createElement('button'); addBtn.className='add-cat-btn'; addBtn.textContent=isUnit?'+ Add Unit':'+ Add Category';
    addBtn.onclick=()=>{
      const name=inp.value.trim(); if(!name) return;
      if(isUnit){
        const abbr=(abbrInp?.value.trim()||name.toLowerCase().slice(0,3)).toLowerCase();
        const id='cu_'+Date.now();
        const c=ls('unit_custom',[]); c.push({id,label:name,abbr}); lsSet('unit_custom',c);
      } else {
        const c=ls('cat_custom',[]); c.push({id:'cc_'+Date.now(),label:name,color:newCatColor}); lsSet('cat_custom',c);
      }
      inp.value=''; if(abbrInp) abbrInp.value=''; buildModalGrid();
    };
    panel.appendChild(addBtn);
  }
  grid.appendChild(panel);
}

function deleteCat(id){
  const gl=ls('gl_items',[]); gl.forEach(i=>{ if(i.category===id) i.category='other'; }); lsSet('gl_items',gl);
  const ms=ls('ms_items',[]); ms.forEach(i=>{ if(i.category===id) i.category='other'; }); lsSet('ms_items',ms);
  const custom=ls('cat_custom',[]);
  if(custom.find(c=>c.id===id)){ lsSet('cat_custom',custom.filter(c=>c.id!==id)); }
  else { const d=ls('cat_deleted',[]); if(!d.includes(id)){d.push(id);lsSet('cat_deleted',d);} }
  if(glSelectedCat===id){ glSelectedCat='other'; updateGlBtn(); }
  if(msSelectedCat===id){ msSelectedCat='other'; updateMsBtn(); }
  buildModalGrid(); glRender(); msRender();
}

function deleteUnit(id){
  // update ms_items that use this unit to fallback
  const ms=ls('ms_items',[]); ms.forEach(i=>{ if(i.unit===id) i.unit='unit'; }); lsSet('ms_items',ms);
  const custom=ls('unit_custom',[]);
  if(custom.find(u=>u.id===id)){ lsSet('unit_custom',custom.filter(u=>u.id!==id)); }
  else { const d=ls('unit_deleted',[]); if(!d.includes(id)){d.push(id);lsSet('unit_deleted',d);} }
  if(csSelectedUnit===id){ csSelectedUnit='unit'; updateUnitBtn(); }
  buildModalGrid(); csRender();
}

/* ── SHARED CAT SECTION BUILDER ── */
function buildCatSection(cat,items,stage,onHeader,buildBody,headerHeight){
  const section=document.createElement('div');
  section.className='cat-section'+(stage===0?' closed':'');

  const header=document.createElement('div');
  header.className='cat-header';
  if(headerHeight) header.style.height=headerHeight;
  header.onclick=onHeader;

  const lbl=document.createElement('div'); lbl.className='cat-label'; lbl.style.color=cat.color; lbl.textContent=cat.label;
  const cnt=document.createElement('div'); cnt.className='cat-count'; cnt.textContent=items.length;
  const arr=document.createElement('div'); arr.className='cat-arrow'; arr.textContent='▼';
  if(stage===0) arr.style.transform='rotate(-90deg)';
  header.append(lbl,cnt,arr);
  section.appendChild(header);

  if(stage>0){
    const body=document.createElement('div'); body.className='cat-body';
    buildBody(body);
    section.appendChild(body);
  }
  return section;
}

function showEmpty(container,msg){
  const s=document.createElement('div'); s.className='cat-section'; s.style.cssText='background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;';
  const e=document.createElement('div'); e.className='empty-state'; e.style.background='transparent'; e.style.borderRadius='0'; e.textContent=msg;
  s.appendChild(e); container.appendChild(s);
}

/* ── GROCERY LIST ── */

let smartSort = ls('setting_smart_sort', true);
let focusDimLevel = parseInt(ls('setting_focus_dim',0))||0; // 0=off, 60/70/80/90/100
let autoScrollOpen = ls('setting_auto_scroll', false);

function focusDimShow(activeWrap){
  if(focusDimLevel){
    const el=document.getElementById('focusDim'); if(el){
      el.style.background='rgba(0,0,0,'+(focusDimLevel/100)+')';
      el.classList.add('active');
    }
    document.querySelectorAll('.pt-card-wrap').forEach(w=>w.classList.remove('focus-active'));
    if(activeWrap) activeWrap.classList.add('focus-active');
  }
  if(autoScrollOpen&&activeWrap) ptScrollToCard(activeWrap);
}
const PT_ANIM_MS=350;
function ptEasedScroll(targetY, durationMs){
  const startY=window.scrollY; const diff=targetY-startY;
  if(Math.abs(diff)<2) return;
  const startTime=performance.now();
  function ease(t){ return t<0.5?2*t*t:-1+(4-2*t)*t; } // ease in-out quad
  function step(now){
    const t=Math.min(1,(now-startTime)/durationMs);
    window.scrollTo(0,startY+diff*ease(t));
    if(t<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function ptScrollToCard(el){
  if(!el||!autoScrollOpen) return;
  const headerEl=document.querySelector('.header-tab');
  const headerH=headerEl?headerEl.getBoundingClientRect().bottom:0;
  const app=document.querySelector('.app');
  if(app) app.style.paddingBottom='100vh';
  requestAnimationFrame(()=>{
    const rect=el.getBoundingClientRect();
    const currentScrollY=window.scrollY||document.documentElement.scrollTop;
    const targetY=rect.top+currentScrollY-headerH-4;
    ptEasedScroll(targetY, PT_ANIM_MS);
  });
}
function ptScrollBack(savedScrollY){
  if(!autoScrollOpen||savedScrollY===undefined) return;
  ptEasedScroll(savedScrollY, PT_ANIM_MS);
  setTimeout(()=>{ const app=document.querySelector('.app'); if(app) app.style.paddingBottom=''; }, PT_ANIM_MS+50);
}
function ptScrollReset(){
  const app=document.querySelector('.app');
  if(app) app.style.paddingBottom='';
}
// After-render scroll for cs/ms sections (called after csRender/msRender)
function focusDimShowById(id,containerSelector){
  setTimeout(()=>{
    const container=document.querySelector(containerSelector);
    const activeEl=container?.querySelector('.cs-section:not(.closed),.cat-section:not(.closed)');
    if(focusDimLevel){
      const el=document.getElementById('focusDim'); if(el){
        el.style.background='rgba(0,0,0,'+(focusDimLevel/100)+')';
        el.classList.add('active');
      }
      document.querySelectorAll('.pt-card-wrap').forEach(w=>w.classList.remove('focus-active'));
      if(activeEl){ activeEl.classList.add('pt-card-wrap'); activeEl.classList.add('focus-active'); }
    }
    if(autoScrollOpen&&activeEl){
      // store saved scroll on the element itself for GL (CS/MS use state objects)
      if(!activeEl._savedScrollY) activeEl._savedScrollY=window.scrollY;
      ptScrollToCard(activeEl);
    }
  },30);
}
function focusDimHide(){
  document.getElementById('focusDim')?.classList.remove('active');
  document.querySelectorAll('.pt-card-wrap').forEach(w=>w.classList.remove('focus-active'));
  document.querySelectorAll('.cs-section,.cat-section').forEach(e=>e.classList.remove('focus-active','pt-card-wrap'));
}

function trackCatUsage(catId){
  const usage = ls('cat_usage', {});
  usage[catId] = (usage[catId]||0) + 1;
  lsSet('cat_usage', usage);
}

let csCachedSortedCats = null;
let csSortedCatIds = null;
let msSortedCatIds = null;

function csInvalidateSortCache(){
  csCachedSortedCats = null;
  csSortedCatIds = null;
}

function msInvalidateSortCache(){
  msSortedCatIds = null;
}

function msGetSortedCats(){
  if(!msSortedCatIds){
    const sorted = smartSortCats([...getCats()].sort((a,b)=>a.label.localeCompare(b.label)));
    msSortedCatIds = sorted.map(c=>c.id);
  }
  const allCats = getCats();
  return msSortedCatIds.map(id=>allCats.find(c=>c.id===id)).filter(Boolean);
}

function csGetSortedCats(displayItems){
  // build the locked order once per tab visit
  if(!csSortedCatIds){
    const sorted = smartSortCats(getCats());
    csSortedCatIds = sorted.map(c=>c.id);
  }
  // return cats in locked order, filtered to only those with items
  const allCats = getCats();
  return csSortedCatIds
    .map(id=>allCats.find(c=>c.id===id))
    .filter(c=>c && displayItems.some(i=>i.category===c.id));
}

function smartSortCats(cats){
  if(!smartSort) return cats;
  const usage = ls('cat_usage', {});
  return [...cats].sort((a,b) => {
    const diff = (usage[b.id]||0) - (usage[a.id]||0);
    if(diff !== 0) return diff;
    return a.label.localeCompare(b.label); // alphabetical tiebreak
  });
}

/* ── GROCERY LIST SEARCH + QUICK ADD ── */
let glQuickAddState = null;

let csPreviewCount = parseInt(ls('setting_cs_preview', 1));

function renderSettingsBody(){
  const body = document.getElementById('settingsBody');
  body.innerHTML = '';

  // color palette for sections
  const GL_COLOR  = '#1d442d'; // GT50 color-4-4 charcoal green
  const CS_COLOR  = '#24384a'; // GT50 color-5-4 charcoal blue
  const MS_COLOR  = '#373243'; // GT50 color-6-4 charcoal purple
  const DATA_COLOR= '#1d4040'; // teal, GT50 palette style

  function makeSimpleCard(label, bgColor, textColor, handler){
    const card=document.createElement('div');
    card.className='item-row';
    card.style.cssText='cursor:pointer;border-radius:var(--radius);';
    const nm=document.createElement('div');
    nm.className='item-name';
    nm.style.cssText=`background:${bgColor};color:${textColor};justify-content:center;font-weight:800;letter-spacing:0.06em;`;
    nm.textContent=label;
    card.appendChild(nm);
    card.onclick=handler;
    return card;
  }

  function makeSettingDivider(label, color){
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 2px 2px;flex-shrink:0;';
    const la=document.createElement('div'); la.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    const sp=document.createElement('span'); sp.style.cssText=`font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${color||'var(--muted)'};flex-shrink:0;`;
    sp.textContent=label;
    const lb=document.createElement('div'); lb.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    d.append(la,sp,lb); return d;
  }

  function makeOnOffCard(labelHtml, value, onToggle, headerBg){
    const wrap=document.createElement('div');
    wrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;height:var(--drop-height);box-sizing:border-box;display:flex;flex-direction:column;';
    const lbl=document.createElement('div');
    lbl.style.cssText=`flex:1;padding:0 8px;display:flex;align-items:center;justify-content:center;background:${headerBg||'var(--bg-2)'};border-bottom:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    lbl.innerHTML=labelHtml; wrap.appendChild(lbl);
    const row=document.createElement('div'); row.style.cssText='flex:1;display:flex;';
    ['On','Off'].forEach((t,i)=>{
      const on=i===0; const active=on?value:!value;
      const btn=document.createElement('button');
      btn.style.cssText=`flex:1;border:none;border-right:${on?'var(--border-width) solid var(--border-color)':'none'};font-size:9px;font-weight:800;cursor:pointer;background:${active?'var(--bg-4)':'var(--bg-3)'};color:${active?'var(--color-10)':'var(--muted)'};`;
      btn.textContent=t;
      btn.onclick=()=>onToggle(on);
      row.appendChild(btn);
    });
    wrap.appendChild(row); return wrap;
  }

  function hexWithOpacity(hex, opacity){
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${opacity})`;
  }

  // Shop — Blue
  function closeAllOverlayWindows(){
    document.getElementById('pageShop').style.display='none';
    document.getElementById('pageMyShop').style.display='none';
    const rw=document.getElementById('recipesWindow'); if(rw) rw.classList.remove('open');
    const mw=document.getElementById('mealsWindow'); if(mw) mw.classList.remove('open');
    const sw=document.getElementById('salesWindow'); if(sw) sw.classList.remove('open');
    document.getElementById('settingsWindow').style.display='none';
    document.getElementById('dataWindow').classList.remove('open');
    const gw=document.getElementById('_gridWindow'); if(gw){ gw.remove(); modalCtx=null; modalSelPend=null; editingColorCatId=null; }
    const hg=document.getElementById('_modalGrid_hidden'); if(hg) hg.id='modalGrid';
  }
  function openFromSidebar(fn){ closeAllOverlayWindows(); closeSettings(); fn(); }

  body.appendChild(makeSettingDivider('Shop','#5A8DB8'));
  body.appendChild(makeSimpleCard('Comp Shop',   hexWithOpacity('#5A8DB8',1.0), '#fff', ()=>{ openFromSidebar(()=>{ csInvalidateSortCache(); document.getElementById('pageShop').style.display='flex'; csRender(); }); }));
  body.appendChild(makeSimpleCard('My Store',    hexWithOpacity('#5A8DB8',0.6), '#fff', ()=>{ openFromSidebar(()=>{ msInvalidateSortCache(); document.getElementById('pageMyShop').style.display='flex'; msRender(); }); }));

  // Cook — Green
  body.appendChild(makeSettingDivider('Cook','#48a971'));
  body.appendChild(makeSimpleCard('Recipes',     hexWithOpacity('#48a971',1.0), '#fff', ()=>{ openFromSidebar(openRecipesWindow); }));
  body.appendChild(makeSimpleCard('Meals',       hexWithOpacity('#48a971',0.6), '#fff', ()=>{ openFromSidebar(openMealsWindow); }));

  // Manage — Orange
  body.appendChild(makeSettingDivider('Manage','#C7824A'));
  body.appendChild(makeSimpleCard('My List of Sales',       hexWithOpacity('#C7824A',1.0), '#fff', ()=>{ openFromSidebar(openSalesWindow); }));
  body.appendChild(makeSimpleCard('Categories',             hexWithOpacity('#C7824A',0.65),'#fff', ()=>{ openFromSidebar(openCategoriesWindow); }));
  body.appendChild(makeSimpleCard('Units of Measurement',   hexWithOpacity('#C7824A',0.35),'#fff', ()=>{ openFromSidebar(openUnitsWindow); }));

  // App — Purple
  body.appendChild(makeSettingDivider('App','#8a7ca8'));
  body.appendChild(makeSimpleCard('Settings',      hexWithOpacity('#8a7ca8',1.0), '#fff', ()=>{ openFromSidebar(openSettingsWindow); }));
  body.appendChild(makeSimpleCard('Export / Import',hexWithOpacity('#8a7ca8',0.6),'#fff', ()=>{ openFromSidebar(openDataWindow); }));
}

/* ── DATA WINDOW ── */
let dataTab = 'export';

const DATA_KEYS = [
  // Grocery List
  'gl_items', 'gl_view',
  // My Store
  'ms_items',
  // Categories & Units
  'cat_custom', 'cat_deleted', 'cat_color_overrides',
  'unit_custom', 'unit_deleted', 'unit_overrides',
  // Comp Shop
  'cs_items', 'cs_entries',
  'setting_cs_preview', 'cs_view',
  // Settings
  'setting_ms_inline_add',
  'setting_ms_add_panel',
  'setting_gl_add_panel',
  'setting_smart_sort', 'cat_usage',
  'setting_focus_dim',
  'setting_auto_scroll',
  // Pantry
  'pantry_data',
  'pantry_delta_log',
  'pantry_snapshots',
  // Recipes & Meals
  'rx_recipes', 'rx_meals', 'rx_history',
  // Sales
  'my_sales',
  // NOTE: pantry_usage intentionally excluded — sort/display only
  // pantry_item_taps also excluded — interaction frequency, resets naturally
];

function exportData(){
  const obj = {};
  DATA_KEYS.forEach(k=>{ const v=localStorage.getItem(k); if(v!==null) obj[k]=JSON.parse(v); });
  return JSON.stringify(obj, null, 2);
}

function importData(json){
  try {
    const obj = JSON.parse(json);
    DATA_KEYS.forEach(k=>{ if(obj[k]!==undefined) localStorage.setItem(k, JSON.stringify(obj[k])); });
    return true;
  } catch(e){ return false; }
}

/* ── New Item Overlay (shared by all search bars) ── */
function openNewItemOverlay(prefillName, onSave){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:320;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';
  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-1);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; htitle.textContent='New Item';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hclose.textContent='×'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);
  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--margin);padding:var(--margin);background:var(--bg-3);';

  // Name
  const nameWrap=document.createElement('div'); nameWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-shrink:0;';
  const nameInp=document.createElement('input'); nameInp.type='text'; nameInp.placeholder='Item name…'; nameInp.value=prefillName||''; nameInp.style.cssText='flex:1;background:#c8cdd4;border:none;color:#1a1a1a;font-size:13px;font-weight:600;padding:0 10px;outline:none;font-family:inherit;text-align:center;';
  nameWrap.appendChild(nameInp); body.appendChild(nameWrap);

  // Category — full width, grey bg, no arrow, taps open modal
  let selectedCatId=null;
  const catCard=document.createElement('div'); catCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:var(--bg-2);';
  const catLbl=document.createElement('div'); catLbl.style.cssText='font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);'; catLbl.textContent='TAP TO PICK CATEGORY';
  catCard.appendChild(catLbl);
  catCard.onclick=()=>{
    modalCtx='new-item-cat'; modalSelPend=null; modalDelPend.clear();
    editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
    document.getElementById('modalTitle').textContent='Category';
    buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
  };
  window._newItemCatCallback=(catId,catLabel,catColor)=>{
    selectedCatId=catId;
    catCard.style.background='var(--bg-2)';
    catLbl.textContent=catLabel.toUpperCase();
    catLbl.style.color=catColor||'var(--color-10)';
  };
  body.appendChild(catCard);

  // Buy unit only
  let buyUnit=null;
  const sizeCard=document.createElement('div'); sizeCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:var(--bg-2);';
  function updateUnitDisplay(){
    sizeCard.innerHTML='';
    if(!buyUnit){
      const lbl=document.createElement('div'); lbl.style.cssText='font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);'; lbl.textContent='TAP TO PICK UNIT';
      sizeCard.appendChild(lbl);
    } else {
      sizeCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;';
      const u=getUnit(buyUnit);
      const left=document.createElement('div'); left.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);background:var(--bg-2);'; left.textContent=(u.label||buyUnit).toUpperCase();
      const div=document.createElement('div'); div.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
      const right=document.createElement('div'); right.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-2);'; right.textContent=(u.abbr||buyUnit).toUpperCase();
      sizeCard.append(left,div,right);
    }
  }
  updateUnitDisplay();
  const unitBtn=sizeCard;
  unitBtn.onclick=e=>{ e.stopPropagation();
    window._newItemUnit=buyUnit;
    window._newItemUnitCallback=(unitId)=>{ buyUnit=unitId; updateUnitDisplay(); };
    modalCtx='new-item-unit'; modalSelPend=null; modalDelPend.clear();
    document.getElementById('modalTitle').textContent='Unit';
    buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
  };
  body.appendChild(sizeCard);

  // Error
  const errMsg=document.createElement('div'); errMsg.style.cssText='font-size:9px;color:var(--color-1);padding:2px 4px;min-height:16px;'; body.appendChild(errMsg);

  // Save
  const saveBtn=document.createElement('div'); saveBtn.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;';
  const saveLbl=document.createElement('div'); saveLbl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;background:#1d3318;color:#48a971;'; saveLbl.textContent='Add to My Store';
  saveBtn.appendChild(saveLbl);
  saveBtn.onclick=()=>{
    const name=nameInp.value.trim();
    if(!name){ errMsg.textContent='Please enter a name.'; return; }
    if(!selectedCatId){ errMsg.textContent='Please pick a category.'; return; }
    const newItem={id:'ms_'+Date.now()+Math.random(),name,category:selectedCatId,unit:buyUnit||'unit',buySize:{unit:buyUnit||null}};
    const ms=ls('ms_items',[]); ms.push(newItem); lsSet('ms_items',ms);
    ov.remove();
    if(onSave) onSave(newItem);
    msRender();
  };
  body.appendChild(saveBtn);
  ov.append(hdr,body);
  document.body.appendChild(ov);
}

function openDataWindow(){
  closeSettings();
  dataTab='export';
  document.getElementById('dataWindow').classList.add('open');
  renderDataBody();
}

function closeDataWindow(){
  document.getElementById('dataWindow').classList.remove('open');
}

function setDataTab(t){
  dataTab=t;
  document.getElementById('dtExport').classList.toggle('active', t==='export');
  document.getElementById('dtImport').classList.toggle('active', t==='import');
  renderDataBody();
}

function renderDataBody(){
  const body = document.getElementById('dataBody');
  body.innerHTML='';

  const status = document.createElement('div'); status.className='data-status'; status.id='dataStatus';
  body.appendChild(status);

  if(dataTab==='export'){
    const ta = document.createElement('textarea'); ta.className='data-textarea'; ta.readOnly=true;
    ta.value = exportData();
    body.appendChild(ta);

    const btn = document.createElement('button'); btn.className='data-btn green'; btn.textContent='Copy to Clipboard';
    btn.onclick=()=>{
      navigator.clipboard.writeText(ta.value).then(()=>{
        status.textContent='Copied!';
        setTimeout(()=>status.textContent='', 2000);
      }).catch(()=>{
        ta.select(); document.execCommand('copy');
        status.textContent='Copied!';
        setTimeout(()=>status.textContent='', 2000);
      });
    };
    body.appendChild(btn);
  } else {
    const ta = document.createElement('textarea'); ta.className='data-textarea';
    ta.placeholder='Paste exported JSON here…';
    body.appendChild(ta);

    const btn = document.createElement('button'); btn.className='data-btn green'; btn.textContent='Import Data';
    btn.onclick=()=>{
      const ok = importData(ta.value.trim());
      if(ok){
        status.textContent='Imported successfully — reload to apply';
        status.style.color='var(--color-4)';
      } else {
        status.textContent='Invalid data — check your JSON';
        status.style.color='var(--color-1)';
      }
    };
    body.appendChild(btn);
  }
}

function clearAllData(){
  DATA_KEYS.forEach(k=>localStorage.removeItem(k));
  document.getElementById('clearConfirmOverlay').classList.remove('open');
  closeSettings();
  glOpenState={}; msOpenState={}; csOpenState={};
  glRender(); csRender(); msRender();
  updateGlFooterBtn();
}

/* ── SALES WINDOW ── */
function openSalesWindow(){
  closeSettings();
  renderSalesBody();
  document.getElementById('salesWindow').classList.add('open');
}

function closeSalesWindow(){
  document.getElementById('salesWindow').classList.remove('open');
}

function renderSalesBody(){
  const body = document.getElementById('salesBody');
  body.innerHTML = '';
  const items = ls('ms_items', []);
  const entries = ls('cs_entries', []);

  const saleEntries = entries.filter(e => isSaleActive(e))
    .sort((a,b)=>{
      const na=items.find(i=>i.id===a.itemId)?.name||'';
      const nb=items.find(i=>i.id===b.itemId)?.name||'';
      return na.localeCompare(nb);
    });

  if(!saleEntries.length){
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No active sales right now.';
    body.appendChild(empty);
    return;
  }

  saleEntries.forEach(entry=>{
    const item = items.find(i=>i.id===entry.itemId);
    if(!item) return;
    const unit = getUnit(item.unit||'unit');
    const regularUp = entry.qty>0 ? entry.price/entry.qty : null;
    const saleUp = entry.sale.price/entry.qty;
    const saving = regularUp!==null ? regularUp-saleUp : null;
    const endD = new Date(entry.sale.ends+'T00:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    const diff = Math.round((endD-now)/(1000*60*60*24));
    let endStr;
    if(diff<=0) endStr='Ends Today';
    else if(diff===1) endStr='Ends Tomorrow';
    else endStr='Ends '+(endD.getMonth()+1)+'/'+endD.getDate()+'/'+String(endD.getFullYear()).slice(2);

    const card = document.createElement('div');
    card.style.cssText = `border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;background:var(--bg-2);`;

    // top — item name + store name centered
    const nameRow = document.createElement('div');
    nameRow.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 12px;border-bottom:var(--border-width) solid var(--border-color);gap:3px;`;
    const itemName = document.createElement('div');
    itemName.style.cssText = 'font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);';
    itemName.textContent = item.name;
    const storeName = document.createElement('div');
    storeName.style.cssText = 'font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);';
    storeName.textContent = entry.store;
    nameRow.append(itemName, storeName);
    card.appendChild(nameRow);

    // data row — price | savings | date
    const dataRow = document.createElement('div');
    dataRow.style.cssText = `display:flex;align-items:stretch;`;

    // left — regular crossed out + sale price in orange
    const priceCol = document.createElement('div');
    priceCol.style.cssText = 'flex:1;background:var(--bg-3);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px;gap:3px;border-right:var(--border-width) solid var(--border-color);';
    const regPrice = document.createElement('div');
    regPrice.style.cssText = 'font-size:9px;font-weight:600;color:var(--muted);text-decoration:line-through;';
    regPrice.textContent = regularUp!==null ? '$'+regularUp.toFixed(2)+'/'+unit.label : '—';
    const salePriceEl = document.createElement('div');
    salePriceEl.style.cssText = 'font-size:11px;font-weight:800;color:#d97f30;';
    salePriceEl.textContent = '$'+saleUp.toFixed(2)+'/'+unit.label;
    priceCol.append(regPrice, salePriceEl);

    // middle — SAVINGS! + amount
    const savCol = document.createElement('div');
    savCol.style.cssText = 'flex:1;background:#374151;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px;gap:3px;border-right:var(--border-width) solid var(--border-color);';
    const savLabel = document.createElement('div');
    savLabel.style.cssText = 'font-size:8px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#7dd4a8;';
    savLabel.textContent = 'SAVINGS!';
    const savAmt = document.createElement('div');
    savAmt.style.cssText = 'font-size:11px;font-weight:800;color:#7dd4a8;';
    savAmt.textContent = saving!==null ? '$'+saving.toFixed(2)+'/'+unit.label : '—';
    savCol.append(savLabel, savAmt);

    // right — end date
    const dateCol = document.createElement('div');
    dateCol.style.cssText = `flex:1;background:var(--bg-3);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px;gap:3px;`;
    const dateVal = document.createElement('div');
    dateVal.style.cssText = `font-size:10px;font-weight:800;color:${diff<=1?'#d97f30':'var(--muted)'};white-space:nowrap;`;
    const dateStr = diff<=0?'Today':diff===1?'Tomorrow':(endD.getMonth()+1)+'/'+endD.getDate()+'/'+String(endD.getFullYear()).slice(2);
    dateVal.textContent = 'SALE ENDS ' + dateStr;
    const daysEl = document.createElement('div');
    daysEl.style.cssText = `font-size:8px;font-weight:600;color:${diff<=1?'#d97f30':'var(--muted)'};`;
    daysEl.textContent = diff<=0?'(today)':diff===1?'(1 day)':'('+diff+' days)';
    dateCol.append(dateVal, daysEl);

    dataRow.append(priceCol, savCol, dateCol);
    card.appendChild(dataRow);

    // add to grocery list row
    const glItems = ls('gl_items', []);
    const alreadyInList = glItems.some(g => g.name.toLowerCase() === item.name.toLowerCase());
    const glRow = document.createElement('div');
    glRow.style.cssText = `height:var(--drop-height);display:flex;align-items:center;justify-content:center;border-top:var(--border-width) solid var(--border-color);background:${alreadyInList ? '#1d442d' : '#4f3010'};cursor:${alreadyInList ? 'default' : 'pointer'};font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;`;
    glRow.textContent = alreadyInList ? 'Added to Grocery List' : 'Add to Grocery List';
    if(!alreadyInList){
      glRow.onclick = ()=>{
        const gl = ls('gl_items', []);
        if(!gl.some(g=>g.name.toLowerCase()===item.name.toLowerCase())){
          gl.push({id:'gl_'+Date.now()+Math.random(), name:item.name, category:item.category||'other', checked:false});
          lsSet('gl_items', gl);
          trackCatUsage(item.category||'other');
        }
        glRender();
        renderSalesBody();
      };
    }
    card.appendChild(glRow);
    body.appendChild(card);
  });
}

function openStatsWindow(){
  _statsBodyId='statsWindowBody';
  const body=document.getElementById('statsWindowBody');
  body._sw='daily';
  body._sv='used';
  body._selBar=null;
  body._focusItemId=null;
  body._focusItemIds=new Set();
  renderStatsWindow();
  document.getElementById('statsWindow').style.display='flex';
}
function closeStatsWindow(){
  document.getElementById('statsWindow').style.display='none';
  _statsBodyId='statsWindowBody';
}

let _statsBodyId='statsWindowBody';

function renderStatsPage(){
  const body=document.getElementById('statsPageBody');
  if(!body) return;
  if(!body._sw){ body._sw='daily'; body._sv='used'; body._selBar=null; body._focusItemId=null; body._focusItemIds=new Set(); }
  _statsBodyId='statsPageBody';
  renderStatsWindow();
}

function renderStatsWindow(){
  const body=document.getElementById(_statsBodyId); if(!body) return; body.innerHTML='';
  const sw=body._sw||'daily';
  const sv=body._sv||'used';
  const selBar=body._selBar!==undefined?body._selBar:null;
  const focusItemId=body._focusItemId||null;
  // multi-select: _focusItemIds is a Set (stored as array for serialization compat)
  if(!body._focusItemIds) body._focusItemIds=new Set();
  const focusIds=body._focusItemIds;
  const multiColor=focusIds.size>1?'#5A8DB8':'#48a971';
  const MONTH_LETTERS=['J','F','M','A','M','J','J','A','S','O','N','D'];
  const now=new Date();

  const N=sw==='daily'?7:12; // daily=7 (Mon-Sun), weekly/monthly=12

  const activeWeeks=ptGet12Weeks(now);

  // Week layout — declared before getItemVals so they're in scope
  const WEEK_LETTERS_SW=['M','T','W','T','F','S','S'];
  const todayDowSW=now.getDay(); const todayWiSW=todayDowSW===0?6:todayDowSW-1;
  const weekStartSW=new Date(now); weekStartSW.setHours(0,0,0,0); weekStartSW.setDate(now.getDate()-todayWiSW);
  const weekDaysSW=Array.from({length:7},(_,i)=>{ const d=new Date(weekStartSW); d.setDate(weekStartSW.getDate()+i); return d; });

  function getItemVals(itemId,mode,dir){
    const log=ls('pantry_delta_log',[]).filter(e=>e.id===itemId&&(dir==='used'?e.delta<0&&e.cost!=null:e.delta>0&&e.cost!=null));
    const vals=new Array(N).fill(0);
    if(mode==='weekly'){
      log.forEach(e=>{ const d=new Date(e.ts); activeWeeks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) vals[i]+=e.cost; }); });
    } else if(mode==='daily'){
      log.forEach(e=>{
        const d=new Date(e.ts);
        const diff=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
        const dayWi=todayWiSW-diff;
        if(dayWi>=0&&dayWi<7) vals[dayWi]+=e.cost;
      });
    } else {
      log.forEach(e=>{
        const d=new Date(e.ts);
        const diff=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
        const idx=(N-1)-diff; if(idx>=0&&idx<N) vals[idx]+=e.cost;
      });
    }
    return vals.map(v=>parseFloat(v.toFixed(2)));
  }

  function getAllTotals(mode,dir){
    if(focusIds.size>0){
      const combined=new Array(N).fill(0);
      focusIds.forEach(id=>{ getItemVals(id,mode,dir).forEach((v,i)=>combined[i]+=v); });
      return combined.map(v=>parseFloat(v.toFixed(2)));
    }
    const all=ls('ms_items',[]);
    const combined=new Array(N).fill(0);
    all.forEach(item=>{ getItemVals(item.id,mode,dir).forEach((v,i)=>combined[i]+=v); });
    return combined.map(v=>parseFloat(v.toFixed(2)));
  }

  function getItemPeriodTotal(itemId,mode,dir,idx){
    const v=getItemVals(itemId,mode,dir);
    return idx!==null?v[idx]||0:v.reduce((s,x)=>s+x,0);
  }

  // Used | Added toggle
  const svRow=document.createElement('div'); svRow.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-shrink:0;';
  [['used','Used (Cost)'],['added','Purchased']].forEach(([v,lbl],i,arr)=>{
    const isAct=sv===v; const btn=document.createElement('div');
    btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
    btn.textContent=lbl; btn.onclick=()=>{ body._sv=v; body._selBar=null; body._focusItemId=null; renderStatsWindow(); }; svRow.appendChild(btn);
  }); body.appendChild(svRow);

  const isUsed=sv==='used';
  const vals=getAllTotals(sw,sv);
  const maxV=Math.max(...vals,0.01);

  const labels=sw==='daily'?WEEK_LETTERS_SW:sw==='weekly'?activeWeeks.map(w=>w.label):Array.from({length:N},(_,i)=>{ const d=new Date(now.getFullYear(),now.getMonth()-(N-1-i),1); return MONTH_LETTERS[d.getMonth()]; });

  // Graph card
  const gCard=document.createElement('div'); gCard.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;background:var(--bg-2);flex-shrink:0;';
  const gHdrRow=document.createElement('div'); gHdrRow.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);';
  const gHdrLbl=document.createElement('div'); gHdrLbl.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#48a971;background:var(--bg-3);';
  gHdrLbl.textContent=focusIds.size===1?(ls('ms_items',[]).find(m=>m.id===[...focusIds][0])?.name||'Item'):focusIds.size>1?`${focusIds.size} items`:(isUsed?'Total Spend':'Total Added');
  gHdrLbl.style.color=focusIds.size>0?multiColor:'#48a971';
  if(focusIds.size>0){
    const clrBtn=document.createElement('div'); clrBtn.style.cssText='width:var(--card-height);display:flex;align-items:center;justify-content:center;background:#502424;font-size:14px;font-weight:900;color:#fff;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; clrBtn.textContent='×';
    clrBtn.onclick=()=>{ body._focusItemIds=new Set(); body._selBar=null; renderStatsWindow(); };
    gHdrRow.append(gHdrLbl,clrBtn);
  } else { gHdrRow.appendChild(gHdrLbl); }
  gCard.appendChild(gHdrRow);

  const graph=document.createElement('div'); graph.className='pt-graph';
  vals.forEach((v,i)=>{
    const isToday=sw==='daily'&&i===todayWiSW; const isSel=selBar===i; const bw=document.createElement('div'); bw.className='pt-bar-wrap';
    const num=document.createElement('div'); num.style.cssText=`font-size:5px;font-weight:700;color:${isSel?'#fff':'rgba(255,255,255,0.5)'};margin-bottom:1px;`; num.textContent=v>0?'$'+v.toFixed(2):'';
    const bar=document.createElement('div'); bar.className='pt-bar'; bar.style.cssText=`height:${Math.max(2,Math.round((v/maxV)*36))}px;background:${v>0?multiColor:'rgba(255,255,255,0.08)'};opacity:${isSel?1:0.6};${isSel?'box-shadow:inset 2px 0 0 #fff,inset -2px 0 0 #fff,inset 0 -2px 0 #fff,0 -2px 0 #fff;':''}`;
    const lbl=document.createElement('div'); lbl.className='pt-day'; lbl.style.cssText=`color:${isToday?'#48a971':(isSel?'#fff':'')};font-weight:${isToday?'900':'600'};`; lbl.textContent=labels[i];
    bw.append(num,bar,lbl); bw.onclick=()=>{ body._selBar=body._selBar===i?null:i; renderStatsWindow(); }; graph.appendChild(bw);
  }); gCard.appendChild(graph);

  const foot=document.createElement('div'); foot.style.cssText='height:32px;border-top:var(--border-width) solid var(--border-color);display:flex;align-items:stretch;';
  const leftEl=document.createElement('div'); leftEl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:8px;font-weight:600;color:var(--muted);border-right:var(--border-width) solid var(--border-color);padding:0 8px;text-align:center;';
  const rightEl=document.createElement('div'); rightEl.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:11px;font-weight:800;color:${multiColor};padding:0 8px;`;
  if(selBar!==null){
    let rt='';
    if(sw==='daily'){ const wd=weekDaysSW[selBar]; rt=wd?wd.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):''; }
    else if(sw==='weekly'){ const w=ptGet12Weeks(now)[selBar]; rt=w.start.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+new Date(w.end.getFullYear(),w.end.getMonth(),w.end.getDate()).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
    else { const d=new Date(now.getFullYear(),now.getMonth()-(11-selBar),1); rt=d.toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
    leftEl.textContent=rt; rightEl.textContent=vals[selBar]>0?'$'+vals[selBar].toFixed(2):'—';
  } else {
    leftEl.textContent=sw==='daily'?'This Week':sw==='weekly'?'12 Week Total':'12 Month Total';
    const total=vals.reduce((s,v)=>s+v,0);
    rightEl.textContent=total>0?'$'+total.toFixed(2):'—';
  }
  foot.append(leftEl,rightEl); gCard.appendChild(foot);

  // Daily/Weekly/Monthly attached to bottom of graph card
  const modeRow=document.createElement('div'); modeRow.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-top:var(--border-width) solid var(--border-color);';
  [['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']].forEach(([v,lbl],i,arr)=>{
    const isAct=sw===v; const btn=document.createElement('div');
    btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
    btn.textContent=lbl; btn.onclick=()=>{ body._sw=v; body._selBar=null; renderStatsWindow(); }; modeRow.appendChild(btn);
  });
  gCard.appendChild(modeRow);
  body.appendChild(gCard);

  const msItems=ls('ms_items',[]);
  const periodLabel=selBar!==null?'This Period':'Period Total';
  const itemTotals=msItems.map(item=>{
    const usedCost=parseFloat(getItemPeriodTotal(item.id,sw,'used',selBar).toFixed(2));
    const purchasedCost=parseFloat(getItemPeriodTotal(item.id,sw,'added',selBar).toFixed(2));
    const costTotal=isUsed?usedCost:purchasedCost;

    function getItemQty(itemId,mode,dir,idx){
      const log2=ls('pantry_delta_log',[]).filter(e=>e.id===itemId&&(dir==='used'?e.delta<0:e.delta>0));
      const v2=new Array(N).fill(0);
      if(mode==='weekly'){
        const weeks=ptGet12Weeks(now); log2.forEach(e=>{ const d=new Date(e.ts); weeks.forEach((w,ii)=>{ if(d>=w.start&&d<=w.end) v2[ii]+=Math.abs(e.delta); }); });
      } else if(mode==='daily'){
        log2.forEach(e=>{ const d=new Date(e.ts); const diff=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5); const ii=todayWiSW-diff; if(ii>=0&&ii<7) v2[ii]+=Math.abs(e.delta); });
      } else {
        log2.forEach(e=>{ const d=new Date(e.ts); const diff=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()); const ii=(N-1)-diff; if(ii>=0&&ii<N) v2[ii]+=Math.abs(e.delta); });
      }
      return idx!==null?parseFloat(v2[idx].toFixed(1)):parseFloat(v2.reduce((s,x)=>s+x,0).toFixed(1));
    }
    const amtTotal=getItemQty(item.id,sw,sv,selBar);
    return {item,costTotal,amtTotal};
  }).filter(x=>x.costTotal>0||x.amtTotal>0).sort((a,b)=>b.costTotal-a.costTotal);

  if(itemTotals.length>0){
    const divLbl=document.createElement('div'); divLbl.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 2px 2px;flex-shrink:0;';
    const la=document.createElement('div'); la.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    const sp=document.createElement('span'); sp.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; sp.textContent='By Item · '+periodLabel;
    const lb=document.createElement('div'); lb.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    divLbl.append(la,sp,lb); body.appendChild(divLbl);
    itemTotals.forEach(({item,costTotal,amtTotal})=>{
      const isFocused=focusIds.has(item.id);
      const itemColor=focusIds.size>1?'#5A8DB8':'#48a971';
      const itemVals=getItemVals(item.id,sw,sv);
      const itemMax=Math.max(...itemVals,0.01);
      const row=document.createElement('div'); row.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const spark=document.createElement('div'); spark.style.cssText=`width:52px;min-width:52px;display:flex;align-items:flex-end;justify-content:center;gap:1px;padding:5px 6px;background:${isFocused?(focusIds.size>1?'#1d2d3f':'#1d3a28'):'var(--bg-3)'};border-right:var(--border-width) solid var(--border-color);cursor:pointer;`;
      itemVals.forEach(v=>{ const b=document.createElement('div'); const h=Math.max(2,Math.round((v/itemMax)*18)); b.style.cssText=`flex:1;height:${h}px;background:${isFocused?itemColor:'rgba(255,255,255,0.35)'};border-radius:1px 1px 0 0;max-width:4px;`; spark.appendChild(b); });
      spark.onclick=()=>{
        if(focusIds.has(item.id)) focusIds.delete(item.id);
        else focusIds.add(item.id);
        body._selBar=null; renderStatsWindow();
      };
      const nm=document.createElement('div'); nm.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:700;color:var(--color-10);background:var(--bg-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; nm.textContent=item.name;
      const costEl=document.createElement('div'); costEl.style.cssText=`width:60px;min-width:60px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);font-size:10px;font-weight:800;color:${isFocused?itemColor:'#48a971'};border-left:var(--border-width) solid var(--border-color);`; costEl.textContent=costTotal>0?'$'+costTotal.toFixed(2):'—';
      const amtEl=document.createElement('div'); amtEl.style.cssText='width:52px;min-width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);border-left:var(--border-width) solid var(--border-color);gap:1px;';
      const amtNum=document.createElement('div'); amtNum.style.cssText='font-size:10px;font-weight:800;color:var(--color-10);line-height:1;'; amtNum.textContent=amtTotal>0?(isUsed?'-':'+')+''+amtTotal:'—';
      const msItm=ls('ms_items',[]).find(m=>m.id===item.id);
      const ptData=ls('pantry_data',{})[item.id];
      const itemUnit=(ptData?.unit)||msItm?.unit||'unit';
      const amtUnit=document.createElement('div'); amtUnit.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);line-height:1;'; amtUnit.textContent=getUnitDisplay(itemUnit,amtTotal);
      amtEl.append(amtNum,amtUnit);
      row.append(spark,nm,costEl,amtEl); body.appendChild(row);
    });
  }
  // Reset Stats Data — double-tap
  const rstDiv=document.createElement('div'); rstDiv.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 2px 2px;flex-shrink:0;';
  const rstLa=document.createElement('div'); rstLa.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
  const rstSp=document.createElement('span'); rstSp.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; rstSp.textContent='Data';
  const rstLb=document.createElement('div'); rstLb.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
  rstDiv.append(rstLa,rstSp,rstLb); body.appendChild(rstDiv);

  const rstCard=document.createElement('div'); rstCard._t=0; rstCard._timer=null;
  rstCard.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#2a1010;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#C85A5A;flex-shrink:0;';
  rstCard.textContent='Reset Stats Data';
  rstCard.onclick=()=>{
    rstCard._t++;
    clearTimeout(rstCard._timer);
    if(rstCard._t>=2){
      rstCard._t=0;
      lsSet('pantry_delta_log',[]);
      lsSet('pantry_snapshots',{});
      ptBackfillSnapshots(); // re-seed today's snapshot with current live stock
      rstCard.style.background='#502424'; rstCard.textContent='Stats Cleared';
      setTimeout(()=>{ renderStatsWindow(); },800);
    } else {
      rstCard.style.background='#fff'; rstCard.style.color='#C85A5A'; rstCard.textContent='Tap again to confirm';
      rstCard._timer=setTimeout(()=>{ rstCard._t=0; rstCard.style.background='#2a1010'; rstCard.style.color='#C85A5A'; rstCard.textContent='Reset Stats Data'; },3000);
    }
  };
  body.appendChild(rstCard);
}

function openPantryHistoryWindow(msItem,pd,wrap,selectedCon,expandView){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:300;background:var(--bg-1);display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';

  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-2);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;';
  htitle.textContent=msItem.name+' · History';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);font-size:22px;font-weight:900;color:#fff;cursor:pointer;';
  hclose.textContent='×'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);

  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--margin);padding:var(--margin);';

  function renderHistory(){
    body.innerHTML='';
    const log=ls('pantry_delta_log',[]).filter(e=>e.id===msItem.id);

    const dayMap={};
    log.forEach(e=>{
      const d=new Date(e.ts); const key=ptDateKey(d);
      if(!dayMap[key]) dayMap[key]={used:0,usedCost:0,added:0,addedCost:0,entries:[]};
      if(e._placeholder) return;
      if(e.delta<0){ dayMap[key].used+=Math.abs(e.delta); if(e.cost) dayMap[key].usedCost+=e.cost; }
      else if(e.delta>0){ dayMap[key].added+=e.delta; if(e.cost) dayMap[key].addedCost+=e.cost; }
      dayMap[key].entries.push(e);
    });

    const days=Object.keys(dayMap).sort((a,b)=>b.localeCompare(a));

    if(days.length===0){
      const empty=document.createElement('div'); empty.style.cssText='display:flex;align-items:center;justify-content:center;padding:40px;font-size:12px;color:var(--muted);font-style:italic;'; empty.textContent='No history recorded yet';
      body.appendChild(empty);
    }

    // Add Date card — rejects today and existing dates
    const todayStr=ptDateKey();
    const addCard=document.createElement('div'); addCard.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;height:var(--drop-height);display:flex;align-items:stretch;';
    const addLbl=document.createElement('div'); addLbl.style.cssText='width:33%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);font-size:7px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);border-right:var(--border-width) solid var(--border-color);'; addLbl.textContent='Add Date';
    const dateInp=document.createElement('input'); dateInp.type='date'; dateInp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;color-scheme:dark;padding:0 8px;border-right:var(--border-width) solid var(--border-color);';
    dateInp.value=todayStr; dateInp.max=todayStr;
    const addBtn=document.createElement('div'); addBtn.style.cssText='width:64px;min-width:64px;display:flex;align-items:center;justify-content:center;background:var(--bg-4);font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-10);cursor:pointer;';
    addBtn.textContent='Add';
    addBtn.onclick=e=>{
      e.stopPropagation();
      const chosen=dateInp.value; if(!chosen) return;
      if(dayMap[chosen]||chosen===todayStr){ dateInp.style.outline='2px solid #C85A5A'; setTimeout(()=>dateInp.style.outline='',1500); return; }
      const midnight=new Date(chosen+'T00:00:00').getTime();
      const lg=ls('pantry_delta_log',[]); lg.push({id:msItem.id,delta:0,ts:midnight+1,_placeholder:true});
      lsSet('pantry_delta_log',lg); renderHistory();
    };
    addCard.append(addLbl,dateInp,addBtn); body.appendChild(addCard);

    days.forEach(dateKey=>{
      const day=dayMap[dateKey];
      const d=new Date(dateKey+'T00:00:00');
      const dayLabel=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});

      const card=document.createElement('div'); card.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';

      const dHdr=document.createElement('div'); dHdr.style.cssText='height:var(--card-height);display:flex;align-items:center;padding:0 12px;background:var(--bg-3);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);border-bottom:var(--border-width) solid var(--border-color);';
      dHdr.textContent=dayLabel; card.appendChild(dHdr);

      function makeRow(label,bgColor,textColor,initAmt,initCost,isUsed){
        const isToday=dateKey===ptDateKey();
        const row=document.createElement('div'); row.style.cssText=`height:var(--drop-height);display:flex;align-items:stretch;${isUsed?'border-bottom:var(--border-width) solid var(--border-color);':''}`;
        const lbl=document.createElement('div'); lbl.style.cssText=`width:33%;display:flex;align-items:center;justify-content:center;background:${bgColor};font-size:7px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${textColor};border-right:var(--border-width) solid var(--border-color);`;
        lbl.textContent=label;
        const amtWrap=document.createElement('div'); amtWrap.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);';
        const amtInp=document.createElement('input'); amtInp.type='number'; amtInp.min='0'; amtInp.step='0.1'; amtInp.value=parseFloat(initAmt.toFixed(2))||''; amtInp.placeholder='0';
        amtInp.style.cssText=`width:100%;background:transparent;border:none;color:${isToday?'var(--muted)':'var(--color-10)'};font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;`;
        amtInp.readOnly=isToday; amtInp.style.pointerEvents=isToday?'none':'auto';
        amtInp.onclick=e=>e.stopPropagation(); amtWrap.appendChild(amtInp);
        const costWrap=document.createElement('div'); costWrap.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-3);';
        const costInp=document.createElement('input'); costInp.type='number'; costInp.min='0'; costInp.step='0.01'; costInp.value=initCost>0?parseFloat(initCost.toFixed(2)):''; costInp.placeholder='$0.00';
        costInp.style.cssText=`width:100%;background:transparent;border:none;color:${isToday?'var(--muted)':'#48a971'};font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;`;
        costInp.readOnly=isToday; costInp.style.pointerEvents=isToday?'none':'auto';
        costInp.onclick=e=>e.stopPropagation(); costWrap.appendChild(costInp);

        const save=()=>{
          if(isToday) return;
          const newAmt=parseFloat(amtInp.value)||0;
          const newCost=parseFloat(costInp.value)||0;
          const midnight=new Date(dateKey+'T00:00:00').getTime();
          const dayEnd=midnight+86399999;
          let lg=ls('pantry_delta_log',[]).filter(e=>{
            if(e.id===msItem.id&&e._placeholder&&e.ts>=midnight&&e.ts<=dayEnd) return false;
            if(e.id===msItem.id&&(isUsed?e.delta<0:e.delta>0)&&e.ts>=midnight&&e.ts<=dayEnd) return false;
            return true;
          });
          if(newAmt>0) lg.push({id:msItem.id,delta:isUsed?-newAmt:newAmt,ts:midnight+1,cost:newCost>0?newCost:undefined});
          lsSet('pantry_delta_log',lg);
          const sw=document.getElementById('statsWindow'); if(sw&&sw.style.display!=='none') renderStatsWindow();
          ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
          renderHistory();
        };
        amtInp.onblur=save; costInp.onblur=save;
        amtInp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); amtInp.blur(); } };
        costInp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); costInp.blur(); } };
        row.append(lbl,amtWrap,costWrap); return row;
      }

      card.appendChild(makeRow('Used',  '#1a2a3a','#5A8DB8', day.used,  day.usedCost,  true));
      card.appendChild(makeRow('Added', '#221a2a','#8a7ca8', day.added, day.addedCost, false));
      body.appendChild(card);
    }); // end days.forEach
  } // end renderHistory

  renderHistory();
  ov.append(hdr,body); document.body.appendChild(ov);
}

function openSettingsWindow(){
  renderSettingsWindowBody();
  const w=document.getElementById('settingsWindow');
  w.style.display='flex';
}
function closeSettingsWindow(){
  document.getElementById('settingsWindow').style.display='none';
}

function renderSettingsWindowBody(){
  const body=document.getElementById('settingsWindowBody'); body.innerHTML='';
  const CS_COLOR='#24384a';
  if(!body._tab) body._tab='pantry';
  const activeTab=body._tab;

  const TABS=[
    {key:'pantry',label:'Pantry',color:'#C7824A'},
    {key:'app',   label:'App',   color:'#5A8DB8'},
    {key:'data',  label:'Data',  color:'#C85A5A'},
  ];

  // Tab row
  const tabRow=document.createElement('div'); tabRow.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-shrink:0;';
  TABS.forEach(({key,label,color},i,arr)=>{
    const active=activeTab===key;
    const btn=document.createElement('div');
    btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${active?color:'var(--bg-3)'};color:${active?'#fff':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
    btn.textContent=label;
    btn.onclick=()=>{ body._tab=key; renderSettingsWindowBody(); };
    tabRow.appendChild(btn);
  });
  body.appendChild(tabRow);

  function makeSettingDivider(label){
    const d=document.createElement('div'); d.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 2px 2px;flex-shrink:0;';
    const la=document.createElement('div'); la.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    const sp=document.createElement('span'); sp.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; sp.textContent=label;
    const lb=document.createElement('div'); lb.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
    d.append(la,sp,lb); return d;
  }
  function makeOnOffCard(labelHtml,value,onToggle,headerBg){
    const wrap=document.createElement('div'); wrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;height:var(--drop-height);box-sizing:border-box;display:flex;flex-direction:column;';
    const lbl=document.createElement('div'); lbl.style.cssText=`flex:1;padding:0 8px;display:flex;align-items:center;justify-content:center;background:${headerBg||'var(--bg-2)'};border-bottom:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`; lbl.innerHTML=labelHtml; wrap.appendChild(lbl);
    const row=document.createElement('div'); row.style.cssText='flex:1;display:flex;';
    ['On','Off'].forEach((t,i)=>{ const on=i===0; const active=on?value:!value; const btn=document.createElement('button'); btn.style.cssText=`flex:1;border:none;border-right:${on?'var(--border-width) solid var(--border-color)':'none'};font-size:9px;font-weight:800;cursor:pointer;background:${active?'var(--bg-4)':'var(--bg-3)'};color:${active?'var(--color-10)':'var(--muted)'};`; btn.textContent=t; btn.onclick=()=>onToggle(on); row.appendChild(btn); });
    wrap.appendChild(row); return wrap;
  }

  if(activeTab==='pantry'){
    body.appendChild(makeSettingDivider('Pantry Thresholds'));
    (function(){
      const t=ptGetThresholds(); const en=ptGetThreshEnabled(); const snap=ptGetThreshSnap();
      const barWrap=document.createElement('div'); barWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;position:relative;flex-shrink:0;';
      let cursor=0;
      const activeThresh=[];
      if(en.critical) activeThresh.push({pct:t.critical,color:'#C85A5A',lbl:'CRIT'});
      if(en.low)      activeThresh.push({pct:t.low,     color:'#C7824A',lbl:'LOW'});
      if(en.partial)  activeThresh.push({pct:t.partial, color:'#5A8DB8',lbl:'PART'});
      activeThresh.forEach(th=>{ if(th.pct>cursor){ const s=document.createElement('div'); s.style.cssText=`position:absolute;left:${cursor}%;top:0;bottom:0;width:${th.pct-cursor}%;background:${th.color};`; barWrap.appendChild(s); if(cursor>0){ const d=document.createElement('div'); d.style.cssText=`position:absolute;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:3;left:${cursor}%;`; barWrap.appendChild(d); } cursor=th.pct; } });
      const okSeg=document.createElement('div'); okSeg.style.cssText=`position:absolute;left:${cursor}%;top:0;bottom:0;width:${100-cursor}%;background:#48a971;`; barWrap.appendChild(okSeg);
      if(cursor>0){ const d=document.createElement('div'); d.style.cssText=`position:absolute;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:3;left:${cursor}%;`; barWrap.appendChild(d); }
      const barLbl=document.createElement('div'); barLbl.style.cssText='position:absolute;inset:0;display:flex;align-items:center;z-index:2;pointer-events:none;';
      let lCursor=0;
      activeThresh.forEach(th=>{ const midPct=lCursor+(th.pct-lCursor)/2; const w=th.pct-lCursor; if(w>6){ const sp=document.createElement('span'); sp.style.cssText=`position:absolute;left:${midPct}%;transform:translateX(-50%);font-size:7px;font-weight:900;letter-spacing:0.1em;color:rgba(0,0,0,0.55);text-transform:uppercase;`; sp.textContent=th.lbl; barLbl.appendChild(sp); } lCursor=th.pct; });
      if(100-lCursor>4){ const sp=document.createElement('span'); sp.style.cssText=`position:absolute;left:${lCursor+(100-lCursor)/2}%;transform:translateX(-50%);font-size:7px;font-weight:900;letter-spacing:0.1em;color:rgba(0,0,0,0.55);text-transform:uppercase;`; sp.textContent='OK'; barLbl.appendChild(sp); }
      barWrap.appendChild(barLbl); body.appendChild(barWrap);
      if(!document.getElementById('pt-thresh-style')){ const st=document.createElement('style'); st.id='pt-thresh-style'; st.textContent='.pt-thresh-inp{position:absolute;left:0;top:0;width:100%;height:100%;background:transparent;outline:none;cursor:pointer;margin:0;padding:0;-webkit-appearance:none;appearance:none;z-index:3;}.pt-thresh-inp::-webkit-slider-runnable-track{background:transparent;height:100%;}.pt-thresh-inp::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:var(--drop-height);border-radius:4px;border:var(--border-width) solid var(--border-color);background:#fff;cursor:grab;margin-top:0;}.pt-thresh-inp:active::-webkit-slider-thumb{cursor:grabbing;}.pt-thresh-inp::-moz-range-thumb{width:14px;height:var(--drop-height);border-radius:4px;border:var(--border-width) solid var(--border-color);background:#fff;cursor:grab;}.pt-thresh-inp::-moz-range-track{background:transparent;}.pt-thresh-inp:disabled{pointer-events:none;}'; document.head.appendChild(st); }
      function rebuildBar(){ const ct=ptGetThresholds(); const cen=ptGetThreshEnabled(); barWrap.innerHTML=''; let c2=0; const at2=[]; if(cen.critical) at2.push({pct:ct.critical,color:'#C85A5A',lbl:'CRIT'}); if(cen.low) at2.push({pct:ct.low,color:'#C7824A',lbl:'LOW'}); if(cen.partial) at2.push({pct:ct.partial,color:'#5A8DB8',lbl:'PART'}); at2.forEach(th=>{ if(th.pct>c2){ const s=document.createElement('div'); s.style.cssText=`position:absolute;left:${c2}%;top:0;bottom:0;width:${th.pct-c2}%;background:${th.color};`; barWrap.appendChild(s); if(c2>0){ const d=document.createElement('div'); d.style.cssText=`position:absolute;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:3;left:${c2}%;`; barWrap.appendChild(d); } c2=th.pct; } }); const ok2=document.createElement('div'); ok2.style.cssText=`position:absolute;left:${c2}%;top:0;bottom:0;width:${100-c2}%;background:#48a971;`; barWrap.appendChild(ok2); if(c2>0){ const d=document.createElement('div'); d.style.cssText=`position:absolute;top:0;bottom:0;width:var(--border-width);background:var(--border-color);z-index:3;left:${c2}%;`; barWrap.appendChild(d); } const bl=document.createElement('div'); bl.style.cssText='position:absolute;inset:0;display:flex;align-items:center;z-index:2;pointer-events:none;'; let lc2=0; at2.forEach(th=>{ const m=lc2+(th.pct-lc2)/2; if(th.pct-lc2>6){ const sp=document.createElement('span'); sp.style.cssText=`position:absolute;left:${m}%;transform:translateX(-50%);font-size:7px;font-weight:900;letter-spacing:0.1em;color:rgba(0,0,0,0.55);text-transform:uppercase;`; sp.textContent=th.lbl; bl.appendChild(sp); } lc2=th.pct; }); if(100-lc2>4){ const sp=document.createElement('span'); sp.style.cssText=`position:absolute;left:${lc2+(100-lc2)/2}%;transform:translateX(-50%);font-size:7px;font-weight:900;letter-spacing:0.1em;color:rgba(0,0,0,0.55);text-transform:uppercase;`; sp.textContent='OK'; bl.appendChild(sp); } barWrap.appendChild(bl); }
      function addSlider(key,label,color){
        const sd=document.createElement('div'); sd.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 0 0;flex-shrink:0;'; const sl1=document.createElement('div'); sl1.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);'; const ssp=document.createElement('span'); ssp.style.cssText=`font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${color};flex-shrink:0;`; ssp.textContent=label; const sl2=document.createElement('div'); sl2.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);'; sd.append(sl1,ssp,sl2); body.appendChild(sd);
        const isOn=en[key]; const row=document.createElement('div'); row.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;position:relative;';
        const toggleCell=document.createElement('div'); toggleCell.style.cssText=`width:var(--drop-height);min-width:var(--drop-height);display:flex;align-items:center;justify-content:center;background:${isOn?'var(--bg-2)':'var(--bg-3)'};border-right:var(--border-width) solid var(--border-color);cursor:pointer;flex-shrink:0;z-index:4;`; const dot=document.createElement('div'); dot.style.cssText=`width:10px;height:10px;border-radius:2px;border:var(--border-width) solid var(--border-color);background:${isOn?color:'var(--bg-4)'};`; toggleCell.appendChild(dot); toggleCell.onclick=()=>{ const cur=ptGetThreshEnabled(); cur[key]=!cur[key]; lsSet('pt_thresh_enabled',cur); if(!cur[key]&&ptActiveFilter===key){ptActiveFilter='onhand';} renderSettingsWindowBody(); ptRender(); };
        const track=document.createElement('div'); track.style.cssText='flex:1;position:relative;background:var(--bg-3);overflow:hidden;'; const fill=document.createElement('div'); fill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${t[key]}%;background:${color};opacity:${isOn?'0.35':'0.12'};pointer-events:none;z-index:1;`; const inp=document.createElement('input'); inp.type='range'; inp.min=0; inp.max=100; inp.step=snap; inp.value=t[key]; inp.disabled=!isOn; inp.className='pt-thresh-inp';
        inp.oninput=()=>{ const cur=ptGetThresholds(); const curEn=ptGetThreshEnabled(); const curSnap=ptGetThreshSnap(); let v=parseInt(inp.value); if(key==='critical'){ if(curEn.low) cur.low=Math.max(cur.low,v+curSnap); if(curEn.partial) cur.partial=Math.max(cur.partial,cur.low+curSnap); } else if(key==='low'){ if(curEn.critical) v=Math.max(v,cur.critical+curSnap); if(curEn.partial) cur.partial=Math.max(cur.partial,v+curSnap); } else if(key==='partial'){ if(curEn.low) v=Math.max(v,cur.low+curSnap); if(curEn.critical) v=Math.max(v,cur.critical+curSnap); v=Math.min(v,100-curSnap); } cur[key]=v; inp.value=v; lsSet('pt_thresholds',cur); fill.style.width=v+'%'; pctCell.textContent=v+'%'; rebuildBar(); ptRender(); };
        if(!isOn) track.style.opacity='0.4'; track.append(fill,inp);
        const pctCell=document.createElement('div'); pctCell.style.cssText=`width:var(--drop-height);min-width:var(--drop-height);display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-left:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;color:${isOn?color:'var(--bg-4)'};flex-shrink:0;z-index:4;`; pctCell.textContent=isOn?t[key]+'%':'—';
        row.append(toggleCell,track,pctCell); body.appendChild(row);
      }
      addSlider('partial','Partial','#5A8DB8'); addSlider('low','Low','#C7824A'); addSlider('critical','Critical','#C85A5A');
      const snapSd=document.createElement('div'); snapSd.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 0 0;flex-shrink:0;'; const sL1=document.createElement('div'); sL1.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);'; const sSp=document.createElement('span'); sSp.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; sSp.textContent='Snap'; const sL2=document.createElement('div'); sL2.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);'; snapSd.append(sL1,sSp,sL2); body.appendChild(snapSd);
      const snapRow=document.createElement('div'); snapRow.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-shrink:0;'; [5,10].forEach((s,i)=>{ const btn=document.createElement('div'); btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;${i<1?'border-right:var(--border-width) solid var(--border-color);':''}background:${snap===s?'var(--bg-4)':'var(--bg-3)'};color:${snap===s?'#fff':'var(--muted)'};`; btn.textContent='Snap '+s; btn.onclick=()=>{ lsSet('pt_thresh_snap',s); renderSettingsWindowBody(); }; snapRow.appendChild(btn); }); body.appendChild(snapRow);
    })();
    body.appendChild(makeSettingDivider('Sorting'));
    let resetCountsPending=false;
    const ssWrap=document.createElement('div'); ssWrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;';
    const ssLbl=document.createElement('div'); ssLbl.style.cssText='flex:1;min-height:calc((var(--drop-height) - var(--border-width)) / 2);padding:0 8px;display:flex;align-items:center;justify-content:center;background:#1d3a3a;border-bottom:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;white-space:nowrap;'; ssLbl.textContent='Smart Sort';
    const ssRow=document.createElement('div'); ssRow.style.cssText='min-height:calc((var(--drop-height) - var(--border-width)) / 2);display:flex;border-bottom:var(--border-width) solid var(--border-color);';
    ['On','Off'].forEach((t,i)=>{ const on=i===0; const active=on?smartSort:!smartSort; const btn=document.createElement('button'); btn.style.cssText=`flex:1;border:none;border-right:${on?'var(--border-width) solid var(--border-color)':'none'};font-size:9px;font-weight:800;cursor:pointer;background:${active?'var(--bg-4)':'var(--bg-3)'};color:${active?'var(--color-10)':'var(--muted)'};`; btn.textContent=t; btn.onclick=()=>{ smartSort=on; lsSet('setting_smart_sort',on); csInvalidateSortCache(); msInvalidateSortCache(); csRender(); msRender(); renderSettingsWindowBody(); }; ssRow.appendChild(btn); });
    const ssReset=document.createElement('div'); ssReset.style.cssText='min-height:calc((var(--drop-height) - var(--border-width)) / 2);padding:0 8px;display:flex;align-items:center;justify-content:center;background:#1d4040;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);cursor:pointer;white-space:nowrap;'; ssReset.textContent='Reset Sort Counts';
    ssReset.onclick=()=>{ if(resetCountsPending){ lsSet('cat_usage',{}); lsSet('pantry_item_taps',{}); csInvalidateSortCache(); msInvalidateSortCache(); resetCountsPending=false; ssReset.style.background='#1d4040'; ssReset.style.color='rgba(255,255,255,0.6)'; ssReset.textContent='Reset Sort Counts'; } else { resetCountsPending=true; ssReset.style.background='#fff'; ssReset.style.color='var(--color-1)'; ssReset.textContent='Confirm? Tap again to wipe'; setTimeout(()=>{ if(resetCountsPending){ resetCountsPending=false; ssReset.style.background='#1d4040'; ssReset.style.color='rgba(255,255,255,0.6)'; ssReset.textContent='Reset Sort Counts'; }},3000); } };
    ssWrap.append(ssLbl,ssRow,ssReset); body.appendChild(ssWrap);

  } else if(activeTab==='app'){
    body.appendChild(makeSettingDivider('Comp Shop'));
    const pw=document.createElement('div'); pw.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;height:var(--drop-height);box-sizing:border-box;display:flex;flex-direction:column;';
    const pl=document.createElement('div'); pl.style.cssText=`flex:1;padding:0 8px;display:flex;align-items:center;justify-content:center;background:${CS_COLOR};border-bottom:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`; pl.innerHTML='Price Previews on Closed Cards'; pw.appendChild(pl);
    const tr=document.createElement('div'); tr.style.cssText='flex:1;display:flex;';
    [1,2,3].forEach(n=>{ const btn=document.createElement('button'); btn.style.cssText=`flex:1;border:none;border-right:${n<3?'var(--border-width) solid var(--border-color)':'none'};font-size:11px;font-weight:800;cursor:pointer;background:${csPreviewCount===n?'var(--bg-4)':'var(--bg-3)'};color:${csPreviewCount===n?'var(--color-10)':'var(--muted)'};`; btn.textContent=String(n); btn.onclick=()=>{ csPreviewCount=n; lsSet('setting_cs_preview',n); csRender(); renderSettingsWindowBody(); }; tr.appendChild(btn); });
    pw.appendChild(tr); body.appendChild(pw);
    body.appendChild(makeSettingDivider('Display'));
    body.appendChild(makeOnOffCard('Auto-Scroll on Open',autoScrollOpen,v=>{ autoScrollOpen=v; lsSet('setting_auto_scroll',v); renderSettingsWindowBody(); },'#5A8DB8'));
    const fdCard=document.createElement('div'); fdCard.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
    const fdHdr=document.createElement('div'); fdHdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);'; const fdLbl=document.createElement('div'); fdLbl.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;background:var(--bg-3);'; fdLbl.textContent='Focus Dim on Open'; fdHdr.appendChild(fdLbl); fdCard.appendChild(fdHdr);
    const fdRow=document.createElement('div'); fdRow.style.cssText='height:var(--card-height);display:flex;align-items:stretch;';
    [['Off',0],['60%',60],['70%',70],['80%',80],['90%',90],['100%',100]].forEach(([lbl,val],i)=>{ const btn=document.createElement('div'); const isAct=focusDimLevel===val; btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${isAct?'#5A8DB8':'var(--bg-2)'};color:${isAct?'#fff':'var(--muted)'};${i<5?'border-right:var(--border-width) solid var(--border-color);':''}`; btn.textContent=lbl; btn.onclick=()=>{ focusDimLevel=val; lsSet('setting_focus_dim',val); if(!val) focusDimHide(); renderSettingsWindowBody(); }; fdRow.appendChild(btn); });
    fdCard.appendChild(fdRow); body.appendChild(fdCard);

  } else {
    body.appendChild(makeSettingDivider('Data'));
    const clearCard=document.createElement('div'); clearCard.className='item-row'; clearCard.style.cssText='cursor:pointer;border-radius:var(--radius);';
    const clearNm=document.createElement('div'); clearNm.className='item-name'; clearNm.style.cssText='background:#502424;color:#fff;font-weight:800;justify-content:center;letter-spacing:0.06em;'; clearNm.textContent='Clear All Data';
    clearCard.appendChild(clearNm); clearCard.onclick=()=>{ document.getElementById('clearConfirmOverlay').classList.add('open'); };
    body.appendChild(clearCard);
  }
}

/* ── SETTINGS ── */
function openSettings(fromRight){
  renderSettingsBody();
  const drawer=document.getElementById('settingsDrawer');
  // Set side silently — no transition during repositioning
  drawer.style.transition='none';
  drawer.classList.toggle('right', !!fromRight);
  void drawer.offsetWidth; // force reflow so position commits before transition restores
  drawer.style.transition='';
  drawer.classList.add('open');
  document.getElementById('settingsOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  // Stagger cards after drawer finishes (150ms)
  const items=document.querySelectorAll('#settingsBody > *');
  items.forEach((el,i)=>{
    el.classList.add('sidebar-card-anim');
    if(fromRight) el.classList.add('from-right');
    el.style.animationDelay=(0.15 + i*0.04)+'s';
  });
}
function closeSettings(){
  const drawer=document.getElementById('settingsDrawer');
  drawer.classList.remove('open');
  document.getElementById('settingsOverlay').classList.remove('open');
  setTimeout(()=>{
    document.body.style.overflow='';
    // Remove right class silently after drawer is fully hidden
    drawer.style.transition='none';
    drawer.classList.remove('right');
    // Force reflow then restore transition
    void drawer.offsetWidth;
    drawer.style.transition='';
  }, 150);
}
(function(){
  let startX=0, startY=0;
  document.addEventListener('touchstart',e=>{
    startX=e.touches[0].clientX; startY=e.touches[0].clientY;
  },{passive:true});
  document.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-startX;
    const dy=Math.abs(e.changedTouches[0].clientY-startY);
    if(dy>80) return;
    const isOpen=document.getElementById('settingsDrawer').classList.contains('open');
    const fromRight=document.getElementById('settingsDrawer').classList.contains('right');
    const W=window.innerWidth;
    if(!isOpen && startX<24 && dx>60) openSettings(false);           // swipe right from left edge
    if(!isOpen && startX>W-24 && dx<-60) openSettings(true);         // swipe left from right edge
    if(isOpen && !fromRight && dx<-60) closeSettings();               // swipe left to close left drawer
    if(isOpen && fromRight && dx>60) closeSettings();                  // swipe right to close right drawer
  },{passive:true});
})();

/* ── INIT (app.js-only) ── */
ls('gl_items',[]).forEach(i=>msPopulate(i.name,i.category));
updateGlBtn(); updateUnitBtn(); updateMsBtn();
/* ══════════════════════════════════════
   MY PANTRY TAB
══════════════════════════════════════ */


