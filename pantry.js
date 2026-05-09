/* ── PANTRY PRO · pantry.js ───────────────────────────────────────────
   My Pantry tab: state, card builder, containers, stats math,
   delta log, snapshots, backfill, search, stats window rendering,
   history window.
   Depends on: app.js, tabs.js
── */

// ── Delta log v2 format: { itemId: { "YYYY-MM-DD": [[delta, cost?], ...] } }
// ── Usage log v2 format: { itemId: { "YYYY-MM-DD": totalAmount } }
// One-time migration runs on first load if old flat-array format detected.
(function migrateLogs(){
  if(ls('_log_v2', false)) return; // already migrated

  // Migrate pantry_delta_log
  const oldDL = ls('pantry_delta_log', null);
  if(Array.isArray(oldDL)){
    const newDL = {};
    oldDL.forEach(e=>{
      if(!e.id) return;
      const dateKey = ptDateKey(e.ts);
      if(!newDL[e.id]) newDL[e.id] = {};
      if(!newDL[e.id][dateKey]) newDL[e.id][dateKey] = [];
      const entry = e._placeholder ? [0] : (e.cost!=null ? [e.delta, e.cost] : [e.delta]);
      newDL[e.id][dateKey].push(entry);
    });
    lsSet('pantry_delta_log', newDL);
  } else if(!oldDL){
    lsSet('pantry_delta_log', {});
  }

  // Migrate pantry_usage_log
  const oldUL = ls('pantry_usage_log', null);
  if(Array.isArray(oldUL)){
    const newUL = {};
    oldUL.forEach(e=>{
      if(!e.id) return;
      const dateKey = ptDateKey(e.ts);
      if(!newUL[e.id]) newUL[e.id] = {};
      newUL[e.id][dateKey] = parseFloat(((newUL[e.id][dateKey]||0) + (e.amount||0)).toFixed(2));
    });
    lsSet('pantry_usage_log', newUL);
  } else if(!oldUL){
    lsSet('pantry_usage_log', {});
  }

  lsSet('_log_v2', true);
})();

// ── Delta log accessors ──
// Returns all entries for an item as flat [{delta, cost?, ts, dateKey}] for easy iteration
function dlGetEntries(itemId){
  const log = ls('pantry_delta_log', {});
  const itemLog = log[itemId] || {};
  const out = [];
  Object.keys(itemLog).forEach(dateKey=>{
    itemLog[dateKey].forEach(e=>{
      if(e[0]===0) return;
      const entry = {delta: e[0], dateKey};
      if(typeof e[1]==='number') entry.cost = e[1];
      if(e[2]==='w'||e[1]==='w') entry.waste = true;
      entry.ts = new Date(dateKey+'T00:00:00').getTime();
      out.push(entry);
    });
  });
  return out;
}

// Push a single delta entry — type 'w' = waste, omit for normal use/add
function dlPush(itemId, delta, cost, type){
  const log = ls('pantry_delta_log', {});
  if(!log[itemId]) log[itemId] = {};
  const dateKey = ptDateKey();
  if(!log[itemId][dateKey]) log[itemId][dateKey] = [];
  let entry = [parseFloat(delta.toFixed(3))];
  if(cost!=null) entry.push(parseFloat(cost.toFixed(4)));
  if(type==='w') entry = [...entry.slice(0,2), 'w']; // [delta, cost?, 'w']
  log[itemId][dateKey].push(entry);
  lsSet('pantry_delta_log', log);
}

// Get all entries for a specific date range (ts-based)
function dlGetEntriesInRange(itemId, fromTs, toTs){
  return dlGetEntries(itemId).filter(e=>e.ts>=fromTs&&e.ts<=toTs);
}

// Remove all entries for an item on a specific day (today unless dateKey given)
function dlClearDay(itemId, dir, dateKey){
  const key = dateKey || ptDateKey();
  const log = ls('pantry_delta_log', {});
  if(!log[itemId]||!log[itemId][key]) return;
  log[itemId][key] = log[itemId][key].filter(e=>{
    if(e[0]===0) return true;
    const isWaste = e[2]==='w'||e[1]==='w';
    if(dir==='used')  return e[0]>=0 || isWaste;
    if(dir==='added') return e[0]<=0;
    if(dir==='waste') return !isWaste;
    return false;
  });
  if(!log[itemId][key].length) delete log[itemId][key];
  lsSet('pantry_delta_log', log);
}

// Replace a full day's used or added entry (used by history editor)
function dlSetDay(itemId, dateKey, dir, amount, cost){
  const log = ls('pantry_delta_log', {});
  if(!log[itemId]) log[itemId] = {};
  // Remove existing entries for this day + direction
  log[itemId][dateKey] = (log[itemId][dateKey]||[]).filter(e=>{
    if(e[0]===0) return true;
    if(dir==='used') return e[0]>=0;
    return e[0]<=0;
  });
  if(amount>0){
    const delta = dir==='used' ? -amount : amount;
    const entry = cost>0 ? [parseFloat(delta.toFixed(3)), parseFloat(cost.toFixed(4))] : [parseFloat(delta.toFixed(3))];
    log[itemId][dateKey].push(entry);
  }
  if(!log[itemId][dateKey].length) delete log[itemId][dateKey];
  lsSet('pantry_delta_log', log);
}

// Add a placeholder date row (used by history "Add Date" button)
function dlAddPlaceholder(itemId, dateKey){
  const log = ls('pantry_delta_log', {});
  if(!log[itemId]) log[itemId] = {};
  if(!log[itemId][dateKey]) log[itemId][dateKey] = [[0]];
  lsSet('pantry_delta_log', log);
}

// Get all date keys for an item (sorted newest first)
function dlGetDays(itemId){
  const log = ls('pantry_delta_log', {});
  return Object.keys(log[itemId]||{}).sort((a,b)=>b.localeCompare(a));
}

// Check if item has any entry on a given date
function dlHasDay(itemId, dateKey){
  const log = ls('pantry_delta_log', {});
  return !!(log[itemId]&&log[itemId][dateKey]);
}

// ── Usage log accessors ──
function ulGet(itemId){
  const log = ls('pantry_usage_log', {});
  return log[itemId] || {};
}

function ulGetRecent(itemId, sinceTs){
  const dayLog = ulGet(itemId);
  return Object.keys(dayLog).some(dateKey=>{
    return new Date(dateKey+'T00:00:00').getTime() >= sinceTs;
  });
}

function ulGetTodayTotal(itemId){
  const key = ptDateKey();
  return ulGet(itemId)[key] || 0;
}

function ulSetToday(itemId, amount){
  const log = ls('pantry_usage_log', {});
  if(!log[itemId]) log[itemId] = {};
  if(amount>0) log[itemId][ptDateKey()] = parseFloat(amount.toFixed(2));
  else delete log[itemId][ptDateKey()];
  lsSet('pantry_usage_log', log);
}

function ulGetTotal(itemId){
  return Object.values(ulGet(itemId)).reduce((s,v)=>s+v,0);
}

let ptActiveFilter='all';
let ptViewMode='pantry';
let ptFilterSnapshot=[];
let ptCardRegistry=[];
let ptOpenSet=new Set();

function ptIsInPantry(item){
  const pd=getItemPantry(item.id);
  if(pd.containers.length>0) return true;
  const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
  return ulGetRecent(item.id, thirtyDaysAgo);
}

function ptBuildViewToggle(){
  const tog=document.createElement('div');
  tog.style.cssText=`border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;height:var(--drop-height);`;
  [['pantry','Pantry Mode'],['all','All Grocery Items']].forEach(([v,lbl],i,arr)=>{
    const active=ptViewMode===v;
    const btn=document.createElement('div');
    btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;background:${active?'var(--bg-2)':'var(--bg-3)'};color:${active?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
    btn.textContent=lbl;
    btn.onclick=e=>{ e.stopPropagation(); if(ptViewMode===v) return; ptViewMode=v; ptActiveFilter=v==='pantry'?'onhand':'all'; ptCardRegistry.forEach(c=>c.close()); ptCardRegistry=[]; ptOpenSet.clear(); ptRender(); };
    tog.appendChild(btn);
  });
  return tog;
}

function getPantryData(){ return ls('pantry_data',{}); }
function setPantryData(d){ lsSet('pantry_data',d); }
function getItemPantry(id){
  const d=getPantryData();
  if(!d[id]) d[id]={containers:[],totalCap:0,step:1};
  return d[id];
}
const VOLUMETRIC_UNITS=new Set(['fl oz','ml','l','cups','cup','tbsp','tsp','gallon','gal','pint','pt','quart','qt']);

// oz per 1 unit of measurement (for pantry stock → oz conversion)
const UNIT_OZ_CONV={
  'fl oz':1,'ml':0.03381,'l':33.814,
  'cups':8,'cup':8,'tbsp':0.5,'tsp':0.1667,
  'gallon':128,'gal':128,'pint':16,'pt':16,'quart':32,'qt':32,
  'oz':1,'lbs':16,'g':0.03527,'kg':35.274,
};

// Global liquid detection helpers
const LIQUID_KEYWORDS=['milk','cream','oil','water','juice','broth','stock','syrup','sauce','vinegar','extract','liquid','soup','tea','coffee','wine','beer','spirits','honey','molasses','agave','buttermilk','gravy','dressing','marinade','glaze','coulis','jus','brine','concentrate','nectar','smoothie','shake','blend','puree','drizzle','dripping','fat','lard','ketchup','mustard','mayo','mayonnaise','ranch','relish','salsa','jam','jelly','marmalade','curd','paste','spread','dip','hummus','tahini','miso','pesto','aioli','hollandaise','sriracha','tabasco','worcestershire','soy','teriyaki','hoisin','oyster','fish sauce','condensed','evaporated','whey','serum'];
function rxIsLiquid(name){ const n=(name||'').toLowerCase(); return LIQUID_KEYWORDS.some(k=>n.includes(k)); }
const RX_LIQUID_DEFAULT=8.5;

function needsConvCard(u){ const unit=u.toLowerCase(); return ['cups','cup','tbsp','tsp'].includes(unit); }
function openEditContainerWindow(msItem, pd, con, wrap, selectedCon, expandView){
  const ov=document.createElement('div'); ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:300;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';
  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-1);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; htitle.textContent='Edit Container';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hclose.textContent='\u00d7'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);
  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--margin);padding:var(--margin);';

  const UNIT_EXACT_CONV={'fl oz':8,'ml':236.6,'l':0.2366,'cups':1,'cup':1,'tbsp':16,'tsp':48,'gallon':0.0625,'gal':0.0625,'pint':0.5,'pt':0.5,'quart':0.25,'qt':0.25};
  const isVolumetric=pd.unit&&VOLUMETRIC_UNITS.has((pd.unit||'').toLowerCase());
  let chosenUnit=pd.unit||null;
  let ozType=pd.ozType||(isVolumetric?'liquid':(rxIsLiquid(msItem.name)?'liquid':'dry'));
  const _exactConvE=UNIT_EXACT_CONV[(pd.unit||'').toLowerCase()]||null;
  // oz+liquid = 8 (fl oz per cup); oz+dry = density table; all volumetric = exact
  let convValue=pd.ozPerUnit||_exactConvE||(((pd.unit||'').toLowerCase()==='oz'&&ozType==='liquid')?8:null)||rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?8.5:null);
  let priceMode=con.free?'free':'price'; let priceVal=con.free?0:(con.price||null);

  // Save button declared early so renderOzType can call it
  const saveBtn=document.createElement('div'); saveBtn.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:#1d3318;margin-top:4px;';
  const saveLbl=document.createElement('div'); saveLbl.style.cssText='font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#48a971;'; saveLbl.textContent='Save Changes';
  saveBtn.appendChild(saveLbl);

  // Name
  const nameWrap=document.createElement('div'); nameWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const nameLSide=document.createElement('div'); nameLSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; nameLSide.textContent='Name';
  const nameInp=document.createElement('input'); nameInp.type='text'; nameInp.value=con.label||''; nameInp.placeholder='Container name…'; nameInp.style.cssText='width:50%;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:600;padding:0 12px;outline:none;font-family:inherit;flex-shrink:0;';
  nameWrap.append(nameLSide,nameInp); body.appendChild(nameWrap);

  // Oz Type (weight oz only) — declared early so showEditUnit can reference it
  const ozTypeCard=document.createElement('div'); ozTypeCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const ozTypeLSide=document.createElement('div'); ozTypeLSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; ozTypeLSide.textContent='Type';
  const ozTypeRSide=document.createElement('div'); ozTypeRSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
  function renderOzType(){
    ozTypeRSide.innerHTML='';
    const dry=document.createElement('div'); dry.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${ozType==='dry'?'var(--bg-4)':'var(--bg-2)'};color:${ozType==='dry'?'#fff':'var(--muted)'};`; dry.textContent='DRY';
    const dv=document.createElement('div'); dv.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
    const liq=document.createElement('div'); liq.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${ozType==='liquid'?'var(--bg-4)':'var(--bg-2)'};color:${ozType==='liquid'?'#fff':'var(--muted)'};`; liq.textContent='LIQUID';
    dry.onclick=e=>{ e.stopPropagation(); ozType='dry'; if((chosenUnit||'').toLowerCase()==='oz'){ convValue=rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?8.5:null); } renderOzType(); updateConvCard(); };
    liq.onclick=e=>{ e.stopPropagation(); ozType='liquid'; if((chosenUnit||'').toLowerCase()==='oz') convValue=8; renderOzType(); updateConvCard(); };
    ozTypeRSide.append(dry,dv,liq);
  }
  ozTypeCard.append(ozTypeLSide,ozTypeRSide);
  renderOzType(); // populate before showEditUnit runs

  // Unit
  const unitCard=document.createElement('div'); unitCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const unitLSide=document.createElement('div'); unitLSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; unitLSide.textContent='Unit';
  const unitRSide=document.createElement('div'); unitRSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;';
  let convCard=null; // declared early so showEditUnit can reference it
  let editWeightCard=null; // declared early so showEditUnit can reference it
  function showEditUnit(){ unitRSide.innerHTML=''; const u=getUnit(chosenUnit||'unit'); const l=document.createElement('div'); l.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);background:var(--bg-2);'; l.textContent=(u.label||chosenUnit||'unit').toUpperCase(); const d=document.createElement('div'); d.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;'; const r=document.createElement('div'); r.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-2);'; r.textContent=(u.abbr||chosenUnit||'').toUpperCase(); unitRSide.append(l,d,r); ozTypeCard.style.display=TYPE_TOGGLE_UNITS.has((chosenUnit||'').toLowerCase())?'flex':'none'; if(convCard) convCard.style.display=needsConvCard(chosenUnit||'')?'flex':'none'; if(editWeightCard) editWeightCard.style.display=rxIsCountUnit(chosenUnit||'')?'flex':'none'; }
  unitRSide.onclick=()=>{ window._newItemUnit=chosenUnit||'unit'; window._newItemUnitCallback=(unitId)=>{ chosenUnit=unitId; const exact=UNIT_EXACT_CONV[(unitId||'').toLowerCase()]||null; const isVol=VOLUMETRIC_UNITS.has((unitId||'').toLowerCase()); if(isVol){ ozType='liquid'; convValue=exact; } else if((unitId||'').toLowerCase()==='oz'){ convValue=ozType==='liquid'?8:(rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?8.5:null)); } else { convValue=exact||rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?8.5:null); } renderOzType(); showEditUnit(); updateConvCard(); }; modalCtx='new-item-unit'; modalSelPend=null; modalDelPend.clear(); document.getElementById('modalTitle').textContent='Measurement Unit'; buildModalGrid(); document.getElementById('modalOverlay').classList.add('open'); };
  unitCard.append(unitLSide,unitRSide); showEditUnit(); body.appendChild(unitCard);

  // Amount
  const amtWrap=document.createElement('div'); amtWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const amtLSide=document.createElement('div'); amtLSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; amtLSide.textContent='Amount';
  const amtRSide=document.createElement('div'); amtRSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
  const amtInp=document.createElement('input'); amtInp.type='number'; amtInp.min='0'; amtInp.step='0.1'; amtInp.value=con.cap; amtInp.placeholder='0'; amtInp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 12px;outline:none;font-family:inherit;';
  const amtUnitLbl=document.createElement('div'); amtUnitLbl.style.cssText='padding:0 8px;display:flex;align-items:center;font-size:8px;font-weight:700;color:var(--muted);background:var(--bg-3);border-left:var(--border-width) solid var(--border-color);white-space:nowrap;'; amtUnitLbl.textContent=pd.unit||'units';
  amtRSide.append(amtInp,amtUnitLbl); amtWrap.append(amtLSide,amtRSide); body.appendChild(amtWrap);

  ozTypeCard.style.display=TYPE_TOGGLE_UNITS.has((chosenUnit||'').toLowerCase())?'flex':'none'; body.appendChild(ozTypeCard);

// Conv card: [OZ PER CUP label 50%] | [conv rate 25%] | [total oz 25%]
  const convWrap=document.createElement('div'); convWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const convLbl=document.createElement('div'); convLbl.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; convLbl.textContent='oz per cup';
  const convRateEl=document.createElement('div'); convRateEl.style.cssText='width:25%;display:flex;align-items:center;justify-content:center;background:var(--bg-2);border-right:var(--border-width) solid var(--border-color);font-size:11px;font-weight:700;color:#fff;flex-shrink:0;';
  const convTotalEl=document.createElement('div'); convTotalEl.style.cssText='width:25%;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);flex-shrink:0;';
  convWrap.append(convLbl,convRateEl,convTotalEl);
  convCard=convWrap;
  function updateConvCard(){
    const ALWAYS_LIQUID_UNITS=new Set(['fl oz','ml','l','gallon','gal','pint','pt','quart','qt']);
    const isAlwaysLiq=ALWAYS_LIQUID_UNITS.has((chosenUnit||'').toLowerCase());
    const isLiqOz=((chosenUnit||'').toLowerCase()==='oz'||(chosenUnit||'').toLowerCase()==='lbs'||(chosenUnit||'').toLowerCase()==='g'||(chosenUnit||'').toLowerCase()==='kg')&&ozType==='liquid';
    const isVolLiq=VOLUMETRIC_UNITS.has((chosenUnit||'').toLowerCase())&&ozType==='liquid';
    const locked=isAlwaysLiq||isLiqOz||isVolLiq;
    const stdOzUnit=UNIT_OZ_CONV[(chosenUnit||'').toLowerCase()]||null;
    if(locked&&stdOzUnit!=null) convValue=stdOzUnit;
    // conv rate cell — input if editable, plain text if locked
    convRateEl.innerHTML='';
    if(locked){
      convRateEl.textContent=convValue!=null?String(convValue):'—';
    } else {
      const inp=document.createElement('input'); inp.type='text'; inp.value=convValue||''; inp.placeholder='—'; inp.style.cssText='width:100%;background:transparent;border:none;color:#fff;font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;';
      inp.oninput=e=>{ convValue=parseFloat(e.target.value)||null; updateConvCard(); };
      convRateEl.appendChild(inp);
    }
    // total oz cell
    const cap=parseFloat(amtInp.value)||con.cap||0;
    const total=convValue!=null&&cap?parseFloat((cap*convValue).toFixed(2)):null;
    convTotalEl.textContent=total!=null?total+' oz':'—';
  }
  amtInp.addEventListener('input',()=>updateConvCard());
  updateConvCard();
  convCard.style.display=needsConvCard(chosenUnit||'')?'flex':'none';
  body.appendChild(convWrap);

  // Price
  const priceWrap=document.createElement('div'); priceWrap.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const priceLSide=document.createElement('div'); priceLSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; priceLSide.textContent='Price';
  const priceRSide=document.createElement('div'); priceRSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
  const priceInpWrap=document.createElement('div'); priceInpWrap.style.cssText='width:50%;display:flex;align-items:stretch;border-right:var(--border-width) solid var(--border-color);flex-shrink:0;';
  const priceInp=document.createElement('input'); priceInp.type='number'; priceInp.min='0'; priceInp.step='0.01'; priceInp.placeholder='$ paid'; if(!con.free&&con.price!=null) priceInp.value=con.price; priceInp.disabled=con.free; priceInp.style.cssText=`flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 8px;outline:none;font-family:inherit;opacity:${con.free?'0.3':'1'};`;
  priceInp.oninput=e=>{ priceMode='price'; priceVal=parseFloat(e.target.value)||null; };
  priceInpWrap.appendChild(priceInp);
  const freeEl=document.createElement('div'); freeEl.style.cssText=`width:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#48a971;background:${con.free?'#1d3318':'var(--bg-3)'};cursor:pointer;flex-shrink:0;border-left:var(--border-width) solid var(--border-color);`; freeEl.textContent='FREE';
  freeEl.onclick=()=>{ priceMode=priceMode==='free'?'price':'free'; priceVal=priceMode==='free'?0:null; freeEl.style.background=priceMode==='free'?'#1d3318':'var(--bg-3)'; priceInp.disabled=priceMode==='free'; priceInp.style.opacity=priceMode==='free'?'0.3':'1'; if(priceMode==='free') priceInp.value=''; };
  priceRSide.append(priceInpWrap,freeEl); priceWrap.append(priceLSide,priceRSide); body.appendChild(priceWrap);

  // Optional weight card for countable units
  editWeightCard=document.createElement('div'); editWeightCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const ewLS=document.createElement('div'); ewLS.style.cssText='width:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);flex-shrink:0;gap:1px;';
  const ewLT=document.createElement('div'); ewLT.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);text-align:center;'; ewLT.textContent='Total Weight or Volume';
  const ewLS2=document.createElement('div'); ewLS2.style.cssText='font-size:7px;font-weight:600;color:rgba(255,255,255,0.3);'; ewLS2.textContent='(optional)';
  ewLS.append(ewLT,ewLS2);
  const ewRS=document.createElement('div'); ewRS.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
  const ewNumSide=document.createElement('div'); ewNumSide.style.cssText='width:50%;display:flex;align-items:stretch;border-right:var(--border-width) solid var(--border-color);flex-shrink:0;';
  const ewInp=document.createElement('input'); ewInp.type='number'; ewInp.min='0'; ewInp.step='0.01'; ewInp.placeholder='0'; ewInp.value=con.totalWeightOz||''; ewInp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 8px;outline:none;font-family:inherit;';
  ewNumSide.appendChild(ewInp);
  const ewUnitSide=document.createElement('div'); ewUnitSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;border-left:var(--border-width) solid var(--border-color);';
  const ewUnitSel=document.createElement('select'); ewUnitSel.style.cssText='flex:1;background:var(--bg-3);border:none;color:var(--muted);font-size:8px;font-weight:700;padding:0 2px;outline:none;font-family:inherit;cursor:pointer;appearance:none;text-align:center;';
  ['oz','lbs','g','kg','ml','l','fl oz','cups'].forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; if(u==='oz') o.selected=true; ewUnitSel.appendChild(o); });
  ewUnitSide.appendChild(ewUnitSel);
  ewRS.append(ewNumSide,ewUnitSide); editWeightCard.append(ewLS,ewRS);
  editWeightCard.style.display=rxIsCountUnit(chosenUnit||'')?'flex':'none';
  body.appendChild(editWeightCard);

  body.appendChild(saveBtn);
  saveBtn.onclick=()=>{
    const label=(nameInp.value||'').trim()||con.label;
    const newCap=parseFloat(amtInp.value)||con.cap;
    const price=priceMode==='free'?null:priceVal;
    const free=priceMode==='free';
    const prevSEdit=ptGetStock(pd); // capture before changes
    // if this container was previously emptied, give it a new ID so past delta log entries remain isolated
    if(con._isEmptyChoice||con.amount===0) con.id=Date.now()+'_'+Math.random().toString(36).slice(2);
    con.label=label; con.cap=newCap; con.price=price; con.free=free;
    if(chosenUnit) pd.unit=chosenUnit;
    if(ozType) pd.ozType=ozType;
    if(convValue!=null) pd.ozPerUnit=convValue;
    if(con.amount>newCap) con.amount=newCap;
    const ewVal=parseFloat(ewInp.value)||null;
    if(rxIsCountUnit(chosenUnit||con.unit||'')&&ewVal){ const wOz=rxToOz(ewVal,ewUnitSel.value||'oz'); con.totalWeightOz=parseFloat(wOz.toFixed(3)); con.ozPerItem=newCap>0?parseFloat((wOz/newCap).toFixed(3)):null; } else { con.totalWeightOz=null; con.ozPerItem=null; }
    saveItemPantry(msItem.id,pd,prevSEdit,null); ov.remove(); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
  };
  ov.append(hdr,body); document.body.appendChild(ov);
}

function openAddContainerWindow(msItem, pd, wrap, selectedCon, expandView){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:300;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';

  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-1);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; htitle.textContent='New Container';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hclose.textContent='×'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);

  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--margin);padding:var(--margin);';

  const OZ_UNIT=new Set(['oz','fl oz']);

  let chosenUnit=pd.unit||null;
  let amtValue=null;
  // For volumetric units, conversion is exact and type is always liquid
  const UNIT_EXACT_CONV={'fl oz':8,'ml':236.6,'l':0.2366,'cups':1,'cup':1,'tbsp':16,'tsp':48,'gallon':0.0625,'gal':0.0625,'pint':0.5,'pt':0.5,'quart':0.25,'qt':0.25};
  const isVolumetric=pd.unit&&VOLUMETRIC_UNITS.has((pd.unit||'').toLowerCase());
  const exactConv=pd.unit?UNIT_EXACT_CONV[(pd.unit||'').toLowerCase()]||null:null;
  // volumetric = always liquid; weight oz = detect from name
  let ozType=pd.ozType||(isVolumetric?'liquid':(rxIsLiquid(msItem.name)?'liquid':'dry'));
  let convValue=pd.ozPerUnit||exactConv||(((chosenUnit||'').toLowerCase()==='oz'&&ozType==='liquid')?8:null)||rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?RX_LIQUID_DEFAULT:null);
  let priceMode=null;
  let priceVal=null;

  function isComplete(){
    const isOz=chosenUnit&&OZ_UNIT.has(chosenUnit);
    const ozOk=!isOz||(ozType!==null);
    const hasAmt=amtValue!==null&&amtValue>0;
    const priceOk=priceMode==='free'||(priceMode==='price'&&priceVal!==null&&priceVal>=0);
    return !!chosenUnit&&ozOk&&hasAmt&&priceOk;
  }

  // helper: make a 50/50 split card
  function makeSplitCard(label, buildRight){
    const card=document.createElement('div'); card.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
    const lSide=document.createElement('div'); lSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);padding:0 8px;text-align:center;flex-shrink:0;'; lSide.textContent=label;
    const rSide=document.createElement('div'); rSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
    buildRight(rSide); card.append(lSide,rSide); return card;
  }

  // ── Name
  const nameCard=makeSplitCard('Name', rSide=>{
    const inp=document.createElement('input'); inp.type='text'; inp.placeholder='Container name…'; inp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:600;padding:0 12px;outline:none;font-family:inherit;';
    inp.oninput=()=>refreshSave(); rSide.appendChild(inp);
  });
  body.appendChild(nameCard);

  // ── Add Container button (declared early so refreshSave can reference saveLbl)
  const saveBtn=document.createElement('div'); saveBtn.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;cursor:default;margin-top:4px;';
  const saveLbl=document.createElement('div'); saveLbl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;background:var(--bg-3);color:var(--muted);'; saveLbl.textContent='Add Container';
  saveBtn.appendChild(saveLbl);

  function refreshSave(){
    const ok=isComplete();
    saveLbl.style.background=ok?'#1d3318':'var(--bg-3)';
    saveLbl.style.color=ok?'#48a971':'var(--muted)';
    saveBtn.style.cursor=ok?'pointer':'default';
  }

  // ── Unit Type card (declared early so showChosenUnit can reference it)
  const ozTypeCard=document.createElement('div'); ozTypeCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:none;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:var(--bg-2);';

  // ── Measurement unit
  function showChosenUnit(card, unitId){
    const u=getUnit(unitId);
    card.innerHTML=''; card.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;background:var(--bg-2);cursor:pointer;';
    const l=document.createElement('div'); l.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);background:var(--bg-2);'; l.textContent=(u.label||unitId).toUpperCase();
    const d=document.createElement('div'); d.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
    const r=document.createElement('div'); r.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-2);'; r.textContent=(u.abbr||unitId).toUpperCase();
    card.append(l,d,r);
    card.onclick=()=>openUnitPicker(card);
    ozTypeCard.style.display=TYPE_TOGGLE_UNITS.has((unitId||'').toLowerCase())?'flex':'none'; // show for all relevant units
    refreshSave();
  }
  function openUnitPicker(){
    window._newItemUnit=chosenUnit||'unit';
    window._newItemUnitCallback=(unitId)=>{ chosenUnit=unitId; const exact=UNIT_EXACT_CONV[(unitId||'').toLowerCase()]||null; const isVol=VOLUMETRIC_UNITS.has((unitId||'').toLowerCase()); if(isVol){ ozType='liquid'; convValue=exact; } else if((unitId||'').toLowerCase()==='oz'){ convValue=ozType==='liquid'?8:(rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?RX_LIQUID_DEFAULT:null)); } else { convValue=exact||rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?RX_LIQUID_DEFAULT:null); } renderOzTypeCard(); if(convCard&&convCard._updateLbl) convCard._updateLbl(); showChosenUnitInCard(); refreshSave(); };
    modalCtx='new-item-unit'; modalSelPend=null; modalDelPend.clear();
    document.getElementById('modalTitle').textContent='Measurement Unit';
    buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
  }
  let unitRSideRef=null;
  let convCard; // declared early — referenced in showChosenUnitInCard
  let weightCard; // declared early — referenced in showChosenUnitInCard
  const unitCard=makeSplitCard('Unit', rSide=>{ rSide.style.cursor='pointer'; rSide.style.justifyContent='center'; rSide.style.alignItems='center'; rSide.style.fontSize='10px'; rSide.style.fontWeight='800'; rSide.style.color='var(--muted)'; rSide.style.background='var(--bg-2)'; rSide.style.letterSpacing='0.06em'; rSide.style.textTransform='uppercase'; rSide.textContent='TAP TO PICK'; rSide.onclick=()=>openUnitPicker(); unitRSideRef=rSide; });
  function showChosenUnitInCard(){ const u=getUnit(chosenUnit||'unit'); const rSide=unitRSideRef; rSide.innerHTML=''; rSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;'; const l=document.createElement('div'); l.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);background:var(--bg-2);'; l.textContent=(u.label||chosenUnit||'').toUpperCase(); const d=document.createElement('div'); d.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;'; const r=document.createElement('div'); r.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-2);'; r.textContent=(u.abbr||chosenUnit||'').toUpperCase(); rSide.append(l,d,r); ozTypeCard.style.display=TYPE_TOGGLE_UNITS.has((chosenUnit||'').toLowerCase())?'flex':'none'; if(convCard) convCard.style.display=needsConvCard(chosenUnit||'')?'flex':'none'; if(typeof weightCard!=='undefined') weightCard.style.display=rxIsCountUnit(chosenUnit||'')?'flex':'none'; refreshSave(); }
  if(chosenUnit){ showChosenUnitInCard(); }
  body.appendChild(unitCard);

  // ── Unit Amount
  const amtCard=makeSplitCard('Amount', rSide=>{
    const inp=document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='0.1'; inp.placeholder='0'; inp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 12px;outline:none;font-family:inherit;';
    inp.oninput=e=>{ amtValue=parseFloat(e.target.value)||0; if(typeof updateConvDisplay==='function') updateConvDisplay(); refreshSave(); }; rSide.appendChild(inp);
  });
  body.appendChild(amtCard);

  // ── Unit Type (liquid or dry) — only for weight oz
  function renderOzTypeCard(){
    ozTypeCard.innerHTML='';
    ozTypeCard.style.cssText=`height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:${ozTypeCard.style.display||'none'};align-items:stretch;flex-shrink:0;`;
    const lSide=document.createElement('div'); lSide.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; lSide.textContent='Type';
    const rSide=document.createElement('div'); rSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
    const dry=document.createElement('div'); dry.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${ozType==='dry'?'var(--bg-4)':'var(--bg-2)'};color:${ozType==='dry'?'#fff':'var(--muted)'};`; dry.textContent='DRY';
    const divEl=document.createElement('div'); divEl.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
    const liq=document.createElement('div'); liq.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${ozType==='liquid'?'var(--bg-4)':'var(--bg-2)'};color:${ozType==='liquid'?'#fff':'var(--muted)'};`; liq.textContent='LIQUID';
    dry.onclick=e=>{ e.stopPropagation(); ozType='dry'; if((chosenUnit||'').toLowerCase()==='oz'){ convValue=rxWordMatch(msItem.name)||(rxIsLiquid(msItem.name)?8.5:null); } renderOzTypeCard(); if(convCard&&convCard._updateLbl) convCard._updateLbl(); refreshSave(); };
    liq.onclick=e=>{ e.stopPropagation(); ozType='liquid'; if((chosenUnit||'').toLowerCase()==='oz') convValue=8; renderOzTypeCard(); if(convCard&&convCard._updateLbl) convCard._updateLbl(); refreshSave(); };
    rSide.append(dry,divEl,liq); ozTypeCard.append(lSide,rSide);
  }
  renderOzTypeCard();
  body.appendChild(ozTypeCard);

  // ── Unit Conversion
  // Conv card: [OZ PER CUP label 50%] | [conv rate 25%] | [total oz 25%]
  convCard=document.createElement('div'); convCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const convLbl=document.createElement('div'); convLbl.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);flex-shrink:0;'; convLbl.textContent='oz per cup';
  const convRateEl=document.createElement('div'); convRateEl.style.cssText='width:25%;display:flex;align-items:center;justify-content:center;background:var(--bg-2);border-right:var(--border-width) solid var(--border-color);font-size:11px;font-weight:700;color:#fff;flex-shrink:0;';
  const convTotalEl=document.createElement('div'); convTotalEl.style.cssText='width:25%;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);flex-shrink:0;';
  convCard.append(convLbl,convRateEl,convTotalEl);
  function updateConvDisplay(){
    const ALWAYS_LIQUID_UNITS=new Set(['fl oz','ml','l','gallon','gal','pint','pt','quart','qt']);
    const isAlwaysLiq=ALWAYS_LIQUID_UNITS.has((chosenUnit||'').toLowerCase());
    const isLiqOz=((chosenUnit||'').toLowerCase()==='oz'||(chosenUnit||'').toLowerCase()==='lbs'||(chosenUnit||'').toLowerCase()==='g'||(chosenUnit||'').toLowerCase()==='kg')&&ozType==='liquid';
    const isVolLiq=VOLUMETRIC_UNITS.has((chosenUnit||'').toLowerCase())&&ozType==='liquid';
    const locked=isAlwaysLiq||isLiqOz||isVolLiq;
    const stdOzUnit=UNIT_OZ_CONV[(chosenUnit||'').toLowerCase()]||null;
    if(locked&&stdOzUnit!=null) convValue=stdOzUnit;
    convRateEl.innerHTML='';
    if(locked){
      convRateEl.textContent=convValue!=null?String(convValue):'—';
    } else {
      const inp=document.createElement('input'); inp.type='text'; inp.value=convValue||''; inp.placeholder='—'; inp.style.cssText='width:100%;background:transparent;border:none;color:#fff;font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;';
      inp.oninput=e=>{ convValue=parseFloat(e.target.value)||null; updateConvDisplay(); refreshSave(); };
      convRateEl.appendChild(inp);
    }
    const total=convValue!=null&&amtValue?parseFloat((amtValue*convValue).toFixed(2)):null;
    convTotalEl.textContent=total!=null?total+' oz':'—';
  }
  convCard._updateLbl=()=>updateConvDisplay();
  updateConvDisplay();
  convCard.style.display=needsConvCard(chosenUnit||'')?'flex':'none';
  body.appendChild(convCard);

  // ── Price
  const priceCard=makeSplitCard('Price', rSide=>{
    priceMode='price'; refreshSave();
    const inpWrap=document.createElement('div'); inpWrap.style.cssText='width:50%;display:flex;align-items:stretch;border-right:var(--border-width) solid var(--border-color);flex-shrink:0;';
    const inp=document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='0.01'; inp.placeholder='$ paid'; inp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 8px;outline:none;font-family:inherit;';
    inp.oninput=e=>{ const v=parseFloat(e.target.value); priceVal=isNaN(v)?null:v; refreshSave(); };
    inpWrap.appendChild(inp);
    const freeEl=document.createElement('div'); freeEl.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#48a971;background:var(--bg-3);cursor:pointer;flex-shrink:0;border-left:var(--border-width) solid var(--border-color);'; freeEl.textContent='FREE';
    freeEl.onclick=e=>{ e.stopPropagation(); priceMode=priceMode==='free'?'price':'free'; priceVal=priceMode==='free'?0:null; freeEl.style.background=priceMode==='free'?'#1d3318':'var(--bg-3)'; inp.disabled=priceMode==='free'; inp.style.opacity=priceMode==='free'?'0.3':'1'; if(priceMode==='free') inp.value=''; refreshSave(); };
    rSide.append(inpWrap,freeEl);
  });
  body.appendChild(priceCard);

  // ── Optional weight card (for countable items bought by weight e.g. bananas)
  // Weight card — custom layout: left has two-line label, right is split number | unit selector
  weightCard=document.createElement('div'); weightCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const wLSide=document.createElement('div'); wLSide.style.cssText='width:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);flex-shrink:0;gap:1px;';
  const wLTop=document.createElement('div'); wLTop.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);text-align:center;'; wLTop.textContent='Total Weight or Volume';
  const wLSub=document.createElement('div'); wLSub.style.cssText='font-size:7px;font-weight:600;color:rgba(255,255,255,0.3);'; wLSub.textContent='(optional)';
  wLSide.append(wLTop,wLSub);
  const wRSide=document.createElement('div'); wRSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;';
  const wNumSide=document.createElement('div'); wNumSide.style.cssText='width:50%;display:flex;align-items:stretch;border-right:var(--border-width) solid var(--border-color);flex-shrink:0;';
  const wInp=document.createElement('input'); wInp.type='number'; wInp.min='0'; wInp.step='0.01'; wInp.placeholder='0'; wInp.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:700;padding:0 8px;outline:none;font-family:inherit;';
  wInp.oninput=e=>{ weightValue=parseFloat(e.target.value)||null; };
  wNumSide.appendChild(wInp);
  const wUnitSide=document.createElement('div'); wUnitSide.style.cssText='width:50%;display:flex;align-items:stretch;flex-shrink:0;border-left:var(--border-width) solid var(--border-color);';
  const wUnitSel=document.createElement('select'); wUnitSel.style.cssText='flex:1;background:var(--bg-3);border:none;color:var(--muted);font-size:8px;font-weight:700;padding:0 2px;outline:none;font-family:inherit;cursor:pointer;appearance:none;text-align:center;';
  ['oz','lbs','g','kg','ml','l','fl oz','cups'].forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; wUnitSel.appendChild(o); });
  wUnitSide.appendChild(wUnitSel);
  wRSide.append(wNumSide,wUnitSide); weightCard.append(wLSide,wRSide);
  let weightValue=null;
  weightCard.style.display=rxIsCountUnit(chosenUnit||'')?'flex':'none';
  body.appendChild(weightCard);

  // show/hide weight card when unit changes
  const origShowChosen=showChosenUnitInCard;
  window._addConShowUnit=()=>{ weightCard.style.display=rxIsCountUnit(chosenUnit||'')?'flex':'none'; };
  // hook into openUnitPicker callback
  const _origPicker=window._newItemUnitCallback;

  refreshSave();

  const errMsg=document.createElement('div'); errMsg.style.cssText='font-size:9px;color:var(--color-1);padding:2px 4px;min-height:16px;'; body.appendChild(errMsg);
  body.appendChild(saveBtn);

  // ── Past containers for quick re-add
  // ── Past container presets (persist even after containers deleted)
  // Migrate any containers not yet in presets
  if(!pd.containerPresets) pd.containerPresets=[];
  pd.containers.forEach(con=>{
    const key=`${(con.label||'').toLowerCase()}|${con.cap}|${con.free?'free':(con.price??'')}`;
    const exists=pd.containerPresets.some(p=>{ const pk=`${(p.label||'').toLowerCase()}|${p.cap}|${p.free?'free':(p.price??'')}`; return pk===key; });
    if(!exists) pd.containerPresets.push({label:con.label,cap:con.cap,price:con.price,free:con.free,ozPerUnit:pd.ozPerUnit||null});
  });
  saveItemPantry(msItem.id,pd); // persist migration
  if(pd.containerPresets.length>0){
    const pastDiv=document.createElement('div'); pastDiv.style.cssText='display:flex;flex-direction:column;gap:var(--margin);margin-top:8px;';
    const pastLbl=document.createElement('div'); pastLbl.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);padding:2px 0;text-align:center;'; pastLbl.textContent='Quick Re-add Past Container';
    pastDiv.appendChild(pastLbl);
    // deduplicate: same label + cap + price/free = one preset
    const seen=new Set(); const presets=[];
    pd.containerPresets.forEach(con=>{
      const key=`${(con.label||'').toLowerCase()}|${con.cap}|${con.free?'free':(con.price??'')}`;
      if(!seen.has(key)){ seen.add(key); presets.push(con); }
    });
    presets.forEach(con=>{
      const ppu=(!con.free&&con.price!=null&&con.cap>0)?(con.price/con.cap).toFixed(2):null;
      const row=document.createElement('div'); row.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const info=document.createElement('div'); info.style.cssText='flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:0 12px;gap:2px;cursor:pointer;background:var(--bg-2);';
      const nm=document.createElement('div'); nm.style.cssText='font-size:11px;font-weight:700;color:#fff;'; nm.textContent=con.label||'Container';
      const sub=document.createElement('div'); sub.style.cssText='font-size:9px;font-weight:600;color:rgba(255,255,255,0.45);';
      sub.textContent=con.free?`${con.cap} ${pd.unit||''} · FREE`:`${con.cap} ${pd.unit||''}`+(ppu?' · $'+ppu+'/'+pd.unit:'');
      info.append(nm,sub);
      info.onclick=()=>{
        // pre-fill name (no focus)
        const nameInpEl=nameCard.querySelector('input');
        if(nameInpEl){ nameInpEl.value=con.label||''; } else { nameCard.onclick(); setTimeout(()=>{ const ni=nameCard.querySelector('input'); if(ni){ ni.value=con.label||''; ni.blur(); } },20); }
        // pre-fill amount (no focus)
        amtValue=con.cap;
        amtCard.innerHTML=''; amtCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
        const ai=document.createElement('input'); ai.type='number'; ai.min='0'; ai.step='0.1'; ai.value=con.cap; ai.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:14px;font-weight:700;padding:0 14px;outline:none;font-family:inherit;'; ai.oninput=e=>{ amtValue=parseFloat(e.target.value)||0; refreshSave(); }; ai.onclick=e=>e.stopPropagation(); amtCard.appendChild(ai); amtCard.onclick=null;
        // pre-fill price (no focus)
        priceMode=con.free?'free':'price'; priceVal=con.free?0:(con.price||null);
        priceCard.innerHTML=''; priceCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
        const pi=document.createElement('input'); pi.type='number'; pi.min='0'; pi.step='0.01'; pi.style.cssText='flex:1;background:var(--bg-2);border:none;color:var(--color-10);font-size:14px;font-weight:700;padding:0 14px;outline:none;font-family:inherit;'; if(!con.free&&con.price!=null) pi.value=con.price; pi.disabled=con.free; pi.style.opacity=con.free?'0.3':'1'; pi.oninput=e=>{ priceMode='price'; priceVal=parseFloat(e.target.value)||0; refreshSave(); };
        const fe=document.createElement('div'); fe.style.cssText=`padding:0 18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#48a971;background:${con.free?'#1d3318':'var(--bg-2)'};cursor:pointer;border-left:var(--border-width) solid var(--border-color);white-space:nowrap;`; fe.textContent='FREE';
        fe.onclick=e=>{ e.stopPropagation(); priceMode=priceMode==='free'?'price':'free'; priceVal=priceMode==='free'?0:null; fe.style.background=priceMode==='free'?'#1d3318':'var(--bg-2)'; pi.disabled=priceMode==='free'; pi.style.opacity=priceMode==='free'?'0.3':'1'; if(priceMode==='free') pi.value=''; refreshSave(); };
        priceCard.append(pi,fe); priceCard.onclick=null;
        refreshSave();
      };
      // two-tap delete
      const del=document.createElement('div'); del.style.cssText='width:48px;min-width:48px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;background:var(--color-1);color:#fff;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; del.textContent='×'; del._t=0; del._timer=null;
      // only show delete if no containers matching this preset have remaining stock
      const matchKey=`${(con.label||'').toLowerCase()}|${con.cap}|${con.free?'free':(con.price??'')}`;
      const matchingCons=pd.containers.filter(c=>{ const ck=`${(c.label||'').toLowerCase()}|${c.cap}|${c.free?'free':(c.price??'')}`; return ck===matchKey; });
      const hasStock=matchingCons.some(c=>c.amount>0);
      del.style.opacity=hasStock?'0.3':'1'; del.style.cursor=hasStock?'default':'pointer';
      del.onclick=e=>{ e.stopPropagation(); if(hasStock) return; del._t++; clearTimeout(del._timer); if(del._t>=2){ del._t=0; const key=`${(con.label||'').toLowerCase()}|${con.cap}|${con.free?'free':(con.price??'')}`; if(pd.containerPresets) pd.containerPresets=pd.containerPresets.filter(p=>{ const pk=`${(p.label||'').toLowerCase()}|${p.cap}|${p.free?'free':(p.price??'')}`; return pk!==key; }); pd.containers=pd.containers.filter(c=>{ const ck=`${(c.label||'').toLowerCase()}|${c.cap}|${c.free?'free':(c.price??'')}`; return ck!==key; }); saveItemPantry(msItem.id,pd); row.remove(); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); } else { del.style.background='#fff'; del.style.color='var(--color-1)'; del._timer=setTimeout(()=>{ del._t=0; del.style.background='var(--color-1)'; del.style.color='#fff'; },2000); } };
      row.append(info,del); pastDiv.appendChild(row);
    });
    body.appendChild(pastDiv);
  }

  saveBtn.onclick=()=>{
    if(!isComplete()) return;
    const unit=chosenUnit||(pd.unit||'oz');
    pd.unit=unit;
    if(ozType) pd.ozType=ozType;
    if(convValue!=null) pd.ozPerUnit=convValue;
    const price=priceMode==='free'?null:priceVal;
    const free=priceMode==='free';
    const nameInp=nameCard.querySelector('input');
    const label=(nameInp?.value||'').trim()||('Container '+(pd.containers.length+1));
    const newCon={id:Date.now(),label,amount:amtValue,cap:amtValue,addedTs:Date.now(),price,free};
    // weight data for countable items
    if(rxIsCountUnit(unit)&&weightValue){ const weightOz=rxToOz(weightValue, wUnitSel?wUnitSel.value:'oz'); newCon.totalWeightOz=parseFloat(weightOz.toFixed(3)); newCon.ozPerItem=parseFloat((weightOz/amtValue).toFixed(3)); }
    const prevS=ptGetStock(pd); // capture BEFORE push
    pd.containers.push(newCon);
    // save to persistent presets (survives container deletion)
    if(!pd.containerPresets) pd.containerPresets=[];
    const key=`${label.toLowerCase()}|${amtValue}|${free?'free':(price??'')}`;
    const alreadyPreset=pd.containerPresets.some(p=>{ const pk=`${(p.label||'').toLowerCase()}|${p.cap}|${p.free?'free':(p.price??'')}`; return pk===key; });
    if(!alreadyPreset) pd.containerPresets.push({label,cap:amtValue,price,free,ozPerCup:convValue||null,ozType:ozType||null});
    // pass prevStock so a positive delta is logged (added stock), cost = container price if not free
    const addCost=(!free&&price!=null)?price:null;
    saveItemPantry(msItem.id,pd,prevS,addCost);
    ov.remove();
    ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
  };
  ov.append(hdr,body);
  document.body.appendChild(ov);
}

function saveItemPantry(id,pd,prevStock,cost,isWaste){
  ptRecordCurrent(id,pd,prevStock); // pass prevStock so snapshot captures pre-change stock
  if(prevStock!==undefined){
    const newStock=ptGetStock(pd);
    ptLogDelta(id,parseFloat((newStock-prevStock).toFixed(3)),cost!=null?parseFloat(cost.toFixed(4)):null,isWaste);
  }
  const d=getPantryData(); d[id]=pd; setPantryData(d);
  // live-update stats window if open
  const sw=document.getElementById('statsWindow');
  if(sw&&sw.style.display!=='none') renderStatsWindow();
}

function getPtUsage(){ return ls('pantry_usage',{}); }
function trackPtUsage(id,amount){
  if(amount<=0) return;
  const u=getPtUsage(); u[id]=(u[id]||0)+amount; lsSet('pantry_usage',u);
}

function getPtInteractions(){ return ls('pantry_item_taps',{}); }
function trackPtInteraction(id){
  if(!id) return;
  const t=getPtInteractions(); t[id]=(t[id]||0)+1; lsSet('pantry_item_taps',t);
}

// Delta log system — logs every stock change as signed delta
// negative = consumed, positive = restocked
// Stats = abs(sum of negative deltas) per period
function ptDateKey(ts){ const d=ts?new Date(ts):new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function ptLogDelta(id,delta,cost,isWaste){
  if(delta===0) return;
  dlPush(id, delta, cost!=null?cost:null, isWaste?'w':undefined);
}
function ptRecordCurrent(id,pd,prevStock){
  // Records start-of-day snapshot ONCE using prevStock (stock before today's first change)
  // If no prevStock provided, falls back to current stock (e.g. on first ever open)
  const snaps=ptGetSnapshots(); const key=ptDateKey(); if(!snaps[key]) snaps[key]={};
  if(snaps[key][id]===undefined){
    const stockVal=prevStock!==undefined?parseFloat(prevStock.toFixed(2)):parseFloat(ptGetStock(pd).toFixed(2));
    snaps[key][id]=stockVal; lsSet('pantry_snapshots',snaps);
  }
}
function ptGetSnapshots(){ return ls('pantry_snapshots',{}); }

// ISO week: W1 = first full Mon-Sun week of the year (starts on Monday)
function ptWeekStart(date){
  // Monday of the ISO week containing `date`
  const d=new Date(date); d.setHours(0,0,0,0);
  const day=d.getDay(); // 0=Sun
  const diff=day===0?-6:1-day; // shift to Monday
  d.setDate(d.getDate()+diff);
  return d;
}
function ptYearW1Start(year){
  // first Monday on or after Jan 1 that starts a full week (Mon-Sun) within the year
  const jan1=new Date(year,0,1);
  const day=jan1.getDay();
  // First Monday of the year
  const offset=day===0?1:(day===1?0:8-day);
  const fm=new Date(year,0,1+offset);
  return fm;
}
function ptGetWeekLabel(date){
  const ws=ptWeekStart(date);
  const w1=ptYearW1Start(ws.getFullYear());
  const weekNum=Math.floor((ws-w1)/604800000)+1;
  if(weekNum<1) return 'W'+ptGetWeekLabel_prev(date);
  return 'W'+weekNum;
}
function ptGetWeekLabel_prev(date){
  // week is in prior year
  const ws=ptWeekStart(date);
  const w1=ptYearW1Start(ws.getFullYear()-1);
  return Math.floor((ws-w1)/604800000)+1;
}
// Get the 12 weekly buckets anchored to ISO weeks, newest last
function ptGetStatsValuesForMonth(id, year, month, direction){
  const dir=direction||'used';
  if(dir==='waste'){
    const wasteLog=ls('pantry_waste_log',{});
    const daysInMonth=new Date(year,month+1,0).getDate();
    const values=new Array(daysInMonth).fill(0);
    for(let i=0;i<daysInMonth;i++){
      const key=ptDateKey(new Date(year,month,i+1));
      values[i]=wasteLog[key]?.[id]||0;
    }
    return values.map(v=>parseFloat(v.toFixed(2)));
  }
  let entries;
  if(dir==='used') entries=dlGetEntries(id).filter(e=>e.delta<0&&!e.waste);
  else entries=dlGetEntries(id).filter(e=>e.delta>0&&!e.waste);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const values=new Array(daysInMonth).fill(0);
  entries.forEach(e=>{
    const d=new Date(e.ts);
    if(d.getFullYear()===year&&d.getMonth()===month){
      const idx=d.getDate()-1;
      if(idx>=0&&idx<daysInMonth) values[idx]+=Math.abs(e.delta);
    }
  });
  return values.map(v=>parseFloat(v.toFixed(2)));
}

/* ── WASTE COSTS: computes cost from waste log × avg price-per-unit ── */
function ptGetWasteCosts(id,mode){
  const wasteLog=ls('pantry_waste_log',{});
  const pd=ls('pantry_data',{})[id];
  const cpuArr=pd?pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0):[];
  const cpu=cpuArr.length?cpuArr.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr.length:null;
  if(!cpu) return new Array(12).fill(0);
  const now=new Date(); const values=new Array(12).fill(0);
  if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    weeks.forEach((w,i)=>{ const key=ptDateKey(w.start); values[i]=parseFloat(((wasteLog[key]?.[id]||0)*cpu).toFixed(2)); });
  } else if(mode==='daily'){
    for(let i=0;i<12;i++){
      const d=new Date(now); d.setDate(d.getDate()-(11-i));
      const key=ptDateKey(d); values[i]=parseFloat(((wasteLog[key]?.[id]||0)*cpu).toFixed(2));
    }
  } else {
    for(let i=0;i<12;i++){
      const d=new Date(now.getFullYear(),now.getMonth()-(11-i),1);
      const key=ptDateKey(d); values[i]=parseFloat(((wasteLog[key]?.[id]||0)*cpu).toFixed(2));
    }
  }
  return values;
}
function ptGetWasteCostsForMonth(id,year,month){
  const wasteLog=ls('pantry_waste_log',{});
  const pd=ls('pantry_data',{})[id];
  const cpuArr=pd?pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0):[];
  const cpu=cpuArr.length?cpuArr.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr.length:null;
  if(!cpu) return new Array(new Date(year,month+1,0).getDate()).fill(0);
  const daysInMonth=new Date(year,month+1,0).getDate();
  return Array.from({length:daysInMonth},(_,i)=>{
    const key=ptDateKey(new Date(year,month,i+1));
    return parseFloat(((wasteLog[key]?.[id]||0)*cpu).toFixed(2));
  });
}

function ptGetStatsCostsForMonth(id, year, month){
  const entries=dlGetEntries(id).filter(e=>e.delta<0&&e.cost!=null&&!e.waste);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const values=new Array(daysInMonth).fill(0);
  entries.forEach(e=>{ const d=new Date(e.ts); if(d.getFullYear()===year&&d.getMonth()===month){ const idx=d.getDate()-1; if(idx>=0&&idx<daysInMonth) values[idx]+=e.cost; } });
  return values.map(v=>parseFloat(v.toFixed(2)));
}

/* ── DAILY WASTE LOG — stores net waste per item per day ── */
function wlGet(itemId,dateKey){ return (ls('pantry_waste_log',{})[dateKey||ptDateKey()]||{})[itemId]||0; }
function wlSet(itemId,amount,dateKey){
  const key=dateKey||ptDateKey();
  const log=ls('pantry_waste_log',{});
  if(!log[key]) log[key]={};
  log[key][itemId]=parseFloat(Math.max(0,amount).toFixed(3));
  lsSet('pantry_waste_log',log);
}

function ptGet12Weeks(now){
  // current week start (Monday)
  const curWS=ptWeekStart(now);
  const weeks=[];
  for(let i=11;i>=0;i--){
    const ws=new Date(curWS); ws.setDate(ws.getDate()-i*7);
    const we=new Date(ws); we.setDate(we.getDate()+6); we.setHours(23,59,59,999);
    const w1=ptYearW1Start(ws.getFullYear());
    let wNum=Math.floor((ws-w1)/604800000)+1;
    if(wNum<1){ const w1p=ptYearW1Start(ws.getFullYear()-1); wNum=Math.floor((ws-w1p)/604800000)+1; }
    weeks.push({start:ws,end:we,label:'W'+wNum});
  }
  return weeks;
}

function ptGetStatsValues(id,mode,direction){
  const dir=direction||'used';
  let entries;
  if(dir==='waste'){
    // Waste reads from dedicated daily waste store, not delta entries
    const wasteLog=ls('pantry_waste_log',{});
    const now=new Date(); const values=new Array(12).fill(0);
    if(mode==='weekly'){
      const weeks=ptGet12Weeks(now);
      weeks.forEach((w,i)=>{
        const key=ptDateKey(w.start);
        values[i]=wasteLog[key]?.[id]||0;
      });
    } else if(mode==='daily'){
      for(let i=0;i<12;i++){
        const d=new Date(now); d.setDate(d.getDate()-(11-i));
        const key=ptDateKey(d); values[i]=wasteLog[key]?.[id]||0;
      }
    } else {
      for(let i=0;i<12;i++){
        const d=new Date(now.getFullYear(),now.getMonth()-(11-i),1);
        const key=ptDateKey(d); values[i]=wasteLog[key]?.[id]||0;
      }
    }
    return values.map(v=>parseFloat(v.toFixed(2)));
  } else if(dir==='used'){
    entries=dlGetEntries(id).filter(e=>e.delta<0&&!e.waste);
  } else {
    entries=dlGetEntries(id).filter(e=>e.delta>0&&!e.waste);
  }
  const now=new Date(); const values=new Array(12).fill(0);
  if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    entries.forEach(e=>{ const d=new Date(e.ts); weeks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) values[i]+=Math.abs(e.delta); }); });
  } else {
    entries.forEach(e=>{ const d=new Date(e.ts);
      if(mode==='daily'){ const diffDays=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5); const idx=11-diffDays; if(idx>=0&&idx<=11) values[idx]+=Math.abs(e.delta); }
      else { const diffMonths=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()); const idx=11-diffMonths; if(idx>=0&&idx<=11) values[idx]+=Math.abs(e.delta); }
    });
  }
  return values.map(v=>parseFloat(v.toFixed(2)));
}

// End-of-day stock per period — current stock for today, start-of-next-day snapshot for past days
function ptGetStockEndValues(id,mode){
  const snaps=ptGetSnapshots(); const now=new Date();
  const pd=ls('pantry_data',{})[id];
  const currentStock=pd?ptGetStock(pd):0;
  const todayKey=ptDateKey();
  const values=new Array(12).fill(null);
  if(mode==='daily'){
    for(let i=0;i<12;i++){
      const d=new Date(now); d.setDate(d.getDate()-(11-i));
      const isToday=(11-i)===0;
      if(isToday){ values[i]=currentStock; continue; }
      // use that day's OWN snapshot — avoids borrowing from today
      const dayKey=ptDateKey(d);
      const dayStock=snaps[dayKey]?.[id];
      values[i]=dayStock!=null?dayStock:null;
    }
  } else if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    weeks.forEach((w,i)=>{
      if(i===11){ values[i]=currentStock; return; }
      // use the week-start snapshot for that week
      const dayStock=snaps[ptDateKey(w.start)]?.[id];
      values[i]=dayStock!=null?dayStock:null;
    });
  } else {
    for(let i=0;i<12;i++){
      const isCurrentMonth=i===11;
      if(isCurrentMonth){ values[i]=currentStock; continue; }
      const monthStart=new Date(now.getFullYear(),now.getMonth()-(11-i),1);
      const dayStock=snaps[ptDateKey(monthStart)]?.[id];
      values[i]=dayStock!=null?dayStock:null;
    }
  }
  return values;
}

function ptGetStatsCosts(id,mode){
  const entries=dlGetEntries(id).filter(e=>e.delta<0&&e.cost!=null&&!e.waste);
  const now=new Date(); const values=new Array(12).fill(0);
  if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    entries.forEach(e=>{
      const d=new Date(e.ts);
      weeks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) values[i]+=e.cost; });
    });
  } else {
    entries.forEach(e=>{
      const d=new Date(e.ts);
      if(mode==='daily'){
        const diffDays=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
        const idx=11-diffDays; if(idx>=0&&idx<=11) values[idx]+=e.cost;
      } else {
        const diffMonths=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
        const idx=11-diffMonths; if(idx>=0&&idx<=11) values[idx]+=e.cost;
      }
    });
  }
  return values.map(v=>parseFloat(v.toFixed(2)));
}
function ptGetStock(pd){ return parseFloat(pd.containers.reduce((s,c)=>s+c.amount,0).toFixed(1)); }
function ptGetMax(pd){ return pd.totalCap; }

// ── Threshold state (persisted in localStorage) ───────────────────
function ptGetThresholds(){ return ls('pt_thresholds',{partial:70,low:40,critical:15}); }
function ptGetThreshEnabled(){ return ls('pt_thresh_enabled',{partial:true,low:true,critical:true}); }
function ptGetThreshSnap(){ return ls('pt_thresh_snap',5); }

function ptGetStatus(pd){
  const max=ptGetMax(pd); if(max<=0) return 'ok';
  const ratio=ptGetStock(pd)/max*100;
  const t=ptGetThresholds(); const en=ptGetThreshEnabled();
  if(en.critical && ratio<=t.critical) return 'low';
  if(en.low      && ratio<=t.low)      return 'soon';
  if(en.partial  && ratio<=t.partial)  return 'partial';
  return 'ok';
}

function ptFillColor(pd){ const st=ptGetStatus(pd); if(st==='ok') return '#48a971'; if(st==='partial') return '#5A8DB8'; if(st==='soon') return '#C7824A'; return '#C85A5A'; }
function ptConFillColor(con){
  if(!con.cap||con.cap<=0) return '#48a971';
  const ratio=con.amount/con.cap*100;
  const t=ptGetThresholds(); const en=ptGetThreshEnabled();
  if(en.critical && ratio<=t.critical) return '#C85A5A';
  if(en.low      && ratio<=t.low)      return '#C7824A';
  if(en.partial  && ratio<=t.partial)  return '#5A8DB8';
  return '#48a971';
}
function ptDarken(hex,pct){ let c=hex.replace('#',''); if(c.length===3) c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2]; const r=Math.max(0,Math.round(parseInt(c.slice(0,2),16)*(1-pct))); const g=Math.max(0,Math.round(parseInt(c.slice(2,4),16)*(1-pct))); const b=Math.max(0,Math.round(parseInt(c.slice(4,6),16)*(1-pct))); return `rgb(${r},${g},${b})`; }

function ptSmartSortItems(items){
  if(!smartSort) return items;
  const taps=getPtInteractions();
  return [...items].sort((a,b)=>(taps[b.id]||0)-(taps[a.id]||0));
}

function ptSmartSortCats(catIds, allItems){
  if(!smartSort) return catIds;
  const taps=getPtInteractions();
  return [...catIds].sort((a,b)=>{
    const scoreA=allItems.filter(i=>i.category===a).reduce((s,i)=>s+(taps[i.id]||0),0);
    const scoreB=allItems.filter(i=>i.category===b).reduce((s,i)=>s+(taps[i.id]||0),0);
    return scoreB-scoreA;
  });
}

function ptApplyFilter(){
  const msItems=ls('ms_items',[]);
  const base=ptViewMode==='pantry' ? msItems.filter(i=>ptIsInPantry(i)) : msItems;
  ptFilterSnapshot=base.filter(item=>{
    if(ptActiveFilter==='all') return true;
    if(ptActiveFilter==='onhand'){
      const pd=getItemPantry(item.id);
      return ptIsInPantry(item) && ptGetStock(pd)>0;
    }
    const pd=getItemPantry(item.id);
    return ptGetStatus(pd)===ptActiveFilter;
  });
}

function ptBuildFilterBar(){
  const msItems=ls('ms_items',[]);
  const base=ptViewMode==='pantry' ? msItems.filter(i=>ptIsInPantry(i)) : msItems;
  const total=base.length;
  const onhand=base.filter(i=>{ const pd=getItemPantry(i.id); return ptIsInPantry(i)&&ptGetStock(pd)>0; }).length;
  const ok=base.filter(i=>ptGetStatus(getItemPantry(i.id))==='ok').length;
  const partial=base.filter(i=>ptGetStatus(getItemPantry(i.id))==='partial').length;
  const soon=base.filter(i=>ptGetStatus(getItemPantry(i.id))==='soon').length;
  const low=base.filter(i=>ptGetStatus(getItemPantry(i.id))==='low').length;
  const en=ptGetThreshEnabled();
  const bar=document.createElement('div');
  bar.style.cssText=`border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;height:var(--drop-height);`;
  bar.className='pt-filter-bar';
  const tabs=[
    {key:'all',     label:'All',     count:total,   color:null,       show:true},
    {key:'onhand',  label:'On-Hand', count:onhand,  color:'#C7824A',  show:true},
    {key:'ok',      label:'OK',      count:ok,      color:'#48a971',  show:ptViewMode==='pantry'},
    {key:'partial', label:'Partial', count:partial, color:'#5A8DB8',  show:ptViewMode==='pantry'&&en.partial},
    {key:'soon',    label:'Low',     count:soon,    color:'#C7824A',  show:ptViewMode==='pantry'&&en.low},
    {key:'low',     label:'Critical',count:low,     color:'#C85A5A',  show:ptViewMode==='pantry'&&en.critical},
  ].filter(t=>t.show);
  tabs.forEach(({key,label,count,color},i,arr)=>{
    const active=ptActiveFilter===key;
    const btn=document.createElement('div');
    btn.style.cssText=`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:1px;background:${active?'var(--bg-4)':'var(--bg-2)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
    const v=document.createElement('div'); v.style.cssText=`font-size:11px;font-weight:800;color:${active?'#fff':color||'rgba(255,255,255,0.4)'};`; v.textContent=count;
    const l=document.createElement('div'); l.style.cssText='font-size:6px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);'; l.textContent=label;
    btn.append(v,l);
    btn.onclick=e=>{ e.stopPropagation(); if(ptActiveFilter===key) return; ptActiveFilter=key; ptCardRegistry.forEach(c=>c.close()); ptCardRegistry=[]; ptOpenSet.clear(); ptRender(); };
    bar.appendChild(btn);
  });
  return bar;
}

function ptDivider(label,color){
  const d=document.createElement('div'); d.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 2px 2px;flex-shrink:0;';
  const l1=document.createElement('div'); l1.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
  const lbl=document.createElement('span'); lbl.style.cssText=`font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;flex-shrink:0;color:${color};`; lbl.textContent=label;
  const l2=document.createElement('div'); l2.style.cssText='flex:1;height:var(--border-width);background:var(--border-color);';
  d.append(l1,lbl,l2); return d;
}

function ptRefreshCard(msItem,pd,wrap,selectedCon,expandView){
  const newFc=ptFillColor(pd); const vMax=Math.max(ptGetMax(pd),ptGetStock(pd))||1;
  const bPct=ptGetStock(pd)/vMax; const oPct=ptGetStock(pd)>ptGetMax(pd)?(ptGetStock(pd)-ptGetMax(pd))/vMax:0;
  wrap._fillBase.style.width=(bPct*100).toFixed(1)+'%'; wrap._fillBase.style.background=newFc;
  wrap._fillOver.style.width=(oPct*100).toFixed(1)+'%'; wrap._fillOver.style.background=ptDarken(newFc,0.5);
  wrap._val.textContent=`${ptGetStock(pd)}/${ptGetMax(pd)}`;
  // update red tint
  if(wrap._redTint){
    const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
    const usedRecently=ulGetRecent(msItem.id, thirtyDaysAgo);
    wrap._redTint.style.display=(ptGetStock(pd)===0&&(usedRecently||pd.containers.length>0))?'':'none';
  }
  const fb=document.querySelector('.pt-filter-bar'); if(fb){ const nfb=ptBuildFilterBar(); nfb.className='pt-filter-bar'; fb.replaceWith(nfb); }
  wrap._renderExpand();
  if(wrap._updateBtnState) wrap._updateBtnState();
  ptRefreshWorthCard();
}

function ptBuildCard(msItem){
  const pd=getItemPantry(msItem.id);
  const selectedCon={id:null};
  const expandView={mode:'containers',statView:'daily',selBar:null};

  const wrap=document.createElement('div'); wrap.className='pt-card';
  const main=document.createElement('div'); main.className='pt-main';
  main.style.cssText='height:32px;min-height:32px;max-height:32px;display:flex;align-items:stretch;position:relative;overflow:hidden;cursor:pointer;background:var(--bg-3);box-sizing:border-box;';

  const minBtn=document.createElement('button'); minBtn.className='pt-btn left'; minBtn.textContent='';
  const plusBtn=document.createElement('button'); plusBtn.className='pt-btn right'; plusBtn.textContent='';

  function updateBtnState(){ const a=!!selectedCon.id; minBtn.textContent=a?'−':''; plusBtn.textContent=a?'+':''; }
  wrap._updateBtnState=updateBtnState;

  minBtn.onclick=e=>{
    e.stopPropagation(); if(!selectedCon.id) return;
    const con=pd.containers.find(c=>c.id===selectedCon.id); if(!con) return;
    if(expandView.mode==='waste'){
      const curW=wlGet(msItem.id); const floor=expandView._wasteFloor!==undefined?expandView._wasteFloor:curW;
      if(expandView._wasteFloor===undefined) expandView._wasteFloor=curW;
      if(con.amount<=0) return;
      const newW=parseFloat(Math.min(curW+pd.step, (wlGet(msItem.id)||0)+con.amount).toFixed(2));
      const diff=parseFloat((newW-curW).toFixed(2)); if(diff<=0) return;
      con.amount=parseFloat(Math.max(0,con.amount-diff).toFixed(2));
      wlSet(msItem.id,newW); const dw=getPantryData(); dw[msItem.id]=pd; setPantryData(dw);
    } else {
      const prev=con.amount; con.amount=Math.max(0,parseFloat((con.amount-pd.step).toFixed(1)));
      const used=prev-con.amount; if(used>0) trackPtUsage(msItem.id,used);
      const conCost=(!con.free&&con.price!=null&&con.cap>0)?(used/con.cap)*con.price:null;
      saveItemPantry(msItem.id,pd,ptGetStock(pd)+used,conCost);
      if(con.amount===0&&prev>0) con._confirmEmpty=true; trackPtInteraction(msItem.id);
    }
    ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
  };
  plusBtn.onclick=e=>{
    e.stopPropagation(); if(!selectedCon.id) return;
    const con=pd.containers.find(c=>c.id===selectedCon.id); if(!con) return;
    if(expandView.mode==='waste'){
      const curW=wlGet(msItem.id); const floor=expandView._wasteFloor!==undefined?expandView._wasteFloor:curW;
      if(curW<=floor) return;
      const newW=parseFloat(Math.max(floor,curW-pd.step).toFixed(2));
      const diff=curW-newW;
      con.amount=parseFloat(Math.min(con.cap,con.amount+diff).toFixed(2));
      wlSet(msItem.id,newW); const dw=getPantryData(); dw[msItem.id]=pd; setPantryData(dw);
    } else {
      const prevConAmt=con.amount; con.amount=Math.min(con.cap,parseFloat((con.amount+pd.step).toFixed(1)));
      const addedAmt=con.amount-prevConAmt;
      const plusCost=(!con.free&&con.price!=null&&con.cap>0&&addedAmt>0)?(addedAmt/con.cap)*con.price:null;
      saveItemPantry(msItem.id,pd,ptGetStock(pd)-addedAmt,plusCost); trackPtInteraction(msItem.id);
    }
    ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
  };

  const center=document.createElement('div');
  center.style.cssText='flex:1;height:32px;min-height:32px;max-height:32px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#374151;';
  const fc=ptFillColor(pd); const vMax=Math.max(ptGetMax(pd),ptGetStock(pd))||1;
  const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
  const usedRecently=ulGetRecent(msItem.id, thirtyDaysAgo);
  const emptyAndUsed=ptGetStock(pd)===0&&(usedRecently||pd.containers.length>0);
  const fillBase=document.createElement('div'); fillBase.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${(ptGetStock(pd)/vMax*100).toFixed(1)}%;background:${fc};opacity:0.5;transition:width 0.35s cubic-bezier(0.4,0,0.2,1);z-index:0;pointer-events:none;`;
  const fillOver=document.createElement('div'); fillOver.style.cssText=`position:absolute;right:0;top:0;bottom:0;width:${(ptGetStock(pd)>ptGetMax(pd)?(ptGetStock(pd)-ptGetMax(pd))/vMax:0)*100}%;background:${ptDarken(fc,0.5)};opacity:0.7;transition:width 0.35s;z-index:1;pointer-events:none;`;
  if(emptyAndUsed){
    const redTint=document.createElement('div');
    redTint.style.cssText='position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(200,90,90,0.15);z-index:0;pointer-events:none;';
    center.appendChild(redTint);
    wrap._redTint=redTint;
  } else {
    const redTint=document.createElement('div');
    redTint.style.cssText='position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(200,90,90,0.15);z-index:0;pointer-events:none;display:none;';
    center.appendChild(redTint);
    wrap._redTint=redTint;
  }
  const nm=document.createElement('div');
  nm.style.cssText='position:relative;z-index:2;font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;max-width:100%;padding:0 6px;line-height:1;';
  nm.textContent=msItem.name;
  const val=document.createElement('div');
  val.style.cssText='position:relative;z-index:2;font-size:10px;font-weight:800;color:rgba(255,255,255,0.7);line-height:1;margin-top:1px;';
  val.textContent=`${ptGetStock(pd)}/${ptGetMax(pd)}`;
  center.append(fillBase,fillOver,nm,val);
  const fillGhost=document.createElement('div'); fillGhost.style.cssText='position:absolute;top:0;bottom:0;opacity:0.3;z-index:1;pointer-events:none;display:none;transition:left 0.15s,width 0.15s;';
  center.appendChild(fillGhost);
  wrap._fillBase=fillBase; wrap._fillOver=fillOver; wrap._val=val; wrap._fillGhost=fillGhost;
  wrap._fillBase=fillBase; wrap._fillOver=fillOver; wrap._val=val;

  main.append(minBtn, center, plusBtn);

  const expand=document.createElement('div');
  expand.className='pt-expand-animated'; expand.style.cssText=`background:var(--bg-2);overflow:hidden;max-height:0;`;

  function renderExpand(){
    expand.innerHTML='';
    const body=document.createElement('div'); body.style.cssText='display:flex;flex-direction:column;gap:4px;padding:4px;background:var(--bg-2);';

    // combined top card: [Add to Grocery List] | [Add New Container]
    const glItems=ls('gl_items',[]); const inList=glItems.some(i=>i.name.toLowerCase()===msItem.name.toLowerCase()&&!i.checked);
    const topCard=document.createElement('div'); topCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
    const glSide=document.createElement('div'); glSide.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:${inList?'default':'pointer'};background:${inList?'#48a971':'var(--bg-4)'};color:${inList?'#fff':'var(--color-10)'};border-right:3px solid #000;text-align:center;padding:0 4px;`; glSide.textContent=inList?'Added to Grocery List':'Add to Grocery List';
    if(!inList){ glSide.onclick=e=>{ e.stopPropagation(); glSide.textContent='Added to Grocery List'; glSide.style.background='#48a971'; glSide.style.color='#fff'; glSide.style.cursor='default'; glSide.onclick=null; const gl=ls('gl_items',[]); if(!gl.some(i=>i.name.toLowerCase()===msItem.name.toLowerCase()&&!i.checked)){ gl.push({id:'gl_'+Date.now()+Math.random(),name:msItem.name,category:msItem.category,checked:false}); lsSet('gl_items',gl); trackCatUsage(msItem.category); } glRender(); }; }
    const acSide=document.createElement('div'); acSide.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:var(--bg-4);color:var(--color-10);text-align:center;padding:0 4px;'; acSide.textContent='Add New Container';
    acSide.onclick=e=>{ e.stopPropagation(); openAddContainerWindow(msItem,pd,wrap,selectedCon,expandView); };
    topCard.append(glSide,acSide); body.appendChild(topCard);

    // tabs
    const tabs=document.createElement('div'); tabs.style.cssText=`height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;`;
    [['stats','Stats'],['containers','Containers'],['waste','Waste'],['adjust','Adjust']].forEach(([mode,label],i,arr)=>{
      const t=document.createElement('div'); const isAct=expandView.mode===mode;
      t.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:3px solid #000;':''}`;
      t.textContent=label; t.onclick=e=>{ e.stopPropagation(); if(expandView.mode!==mode) { revertPendingFill(); expandView._wasteFloor=undefined; selectedCon.id=null; updateBtnState(); } expandView.mode=mode; renderExpand(); }; tabs.appendChild(t);
    }); body.appendChild(tabs);

    // ── Shared fill UI constants (used by containers + waste modes) ──
    const fillFC={2:'#5A8DB8',3:'#8a7ca8',4:'#5A8DB8',5:'#48a971',8:'#C7824A',6:'#5AACB8',9:'#9E6BA8',12:'#A68428'};
    const fillFRACS=[[1,8],[1,5],[1,4],[1,3],[3,8],[2,5],[1,2],[3,5],[5,8],[2,3],[3,4],[4,5],[7,8]];
    const fillFRACS2=[[1,12],[1,9],[1,6],[5,12],[5,9],[7,12],[7,9],[5,6],[11,12]];
    const fillTENS=[0,10,20,30,40,50,60,70,80,90];
    const fillONES=[0,1,2,3,4,5,6,7,8,9];
    function fillLerp4(t){const stops=[[0,[0xC8,0x5A,0x5A]],[.33,[0xC7,0x82,0x4A]],[.66,[0xC8,0xB8,0x28]],[1,[0x48,0xA9,0x71]]];for(let i=0;i<stops.length-1;i++){const[t0,c0]=stops[i],[t1,c1]=stops[i+1];if(t<=t1){const f=(t-t0)/(t1-t0);return`rgb(${c0.map((v,j)=>Math.round(v+(c1[j]-v)*f)).join(',')})`;}}return`rgb(${stops[stops.length-1][1].join(',')})`;}

    if(expandView.mode==='stats'){
      const sv=expandView.statView||'daily'; const sb=expandView.selBar;
      const statSubView=expandView.statSubView||'used';
      const WEEK_LETTERS=['M','T','W','T','F','S','S'];
      const MONTH_LETTERS=['J','F','M','A','M','J','J','A','S','O','N','D'];
      const now2=new Date();
      const todayDow=now2.getDay();
      const todayWeekIdx=todayDow===0?6:todayDow-1;
      const weekStart=new Date(now2); weekStart.setHours(0,0,0,0);
      weekStart.setDate(now2.getDate()-todayWeekIdx);
      const weekDays=Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });
      const _ptUnitId=(ls('pantry_data',{})[msItem.id]?.unit)||msItem.unit||'unit';

      function calcAddedCosts(id,mode){
        const lg=dlGetEntries(id).filter(e=>e.delta>0&&e.cost!=null);
        const v=new Array(12).fill(0);
        if(mode==='weekly'){ const wks=ptGet12Weeks(now2); lg.forEach(e=>{ const d=new Date(e.ts); wks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) v[i]+=e.cost; }); }); }
        else { lg.forEach(e=>{ const d=new Date(e.ts); const diff=(now2.getFullYear()-d.getFullYear())*12+(now2.getMonth()-d.getMonth()); const idx=11-diff; if(idx>=0&&idx<=11) v[idx]+=e.cost; }); }
        return v.map(x=>parseFloat(x.toFixed(2)));
      }

      const gCard=document.createElement('div'); gCard.style.cssText=`border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;background:var(--bg-3);flex-shrink:0;position:relative;`;

      // sv = used | added | waste  /  sw = daily | thismonth | weekly | monthly
      if(!expandView.sv) expandView.sv='used';
      if(!expandView.sw) expandView.sw='daily';
      if(expandView.weekOffset===undefined) expandView.weekOffset=0;
      if(expandView.monthOffset===undefined) expandView.monthOffset=0;
      const sv2=expandView.sv, sw2=expandView.sw;
      const weekOffset2=expandView.weekOffset, monthOffset2=expandView.monthOffset;
      const svRow2=document.createElement('div'); svRow2.style.cssText='height:var(--drop-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);';
      [['used','Used (Cost)'],['added','Purchased'],['waste','Wasted']].forEach(([v,lbl],i)=>{
        const isAct=sv2===v; const isWaste=v==='waste'; const btn=document.createElement('div');
        btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${isAct?(isWaste?'#2a1010':'var(--bg-4)'):'var(--bg-3)'};color:${isAct?(isWaste?'#C85A5A':'var(--color-10)'):'var(--muted)'};${i<2?'border-right:var(--border-width) solid var(--border-color);':''}`;
        btn.textContent=lbl; btn.onclick=e=>{ e.stopPropagation(); expandView.sv=v; expandView.selBar=null; renderExpand(); }; svRow2.appendChild(btn);
      }); gCard.appendChild(svRow2);

      // ── Compute data ──
      const todayDow2=now2.getDay(); const todayWi2=todayDow2===0?6:todayDow2-1;
      const weekStart2=new Date(now2); weekStart2.setHours(0,0,0,0); weekStart2.setDate(now2.getDate()-todayWi2+(weekOffset2*7));
      const weekEnd2=new Date(weekStart2); weekEnd2.setDate(weekStart2.getDate()+6);
      const weekDays2=Array.from({length:7},(_,i)=>{ const d=new Date(weekStart2); d.setDate(weekStart2.getDate()+i); return d; });
      const viewDate2=monthOffset2===0?now2:new Date(now2.getFullYear(),now2.getMonth()+monthOffset2,1);
      const daysInMonth2=new Date(viewDate2.getFullYear(),viewDate2.getMonth()+1,0).getDate();

      let displayVals2=[], barLabels2=[], displayCosts2=[];
      if(sw2==='daily'){
        const allVals=ptGetStatsValues(msItem.id,'daily',sv2==='waste'?'waste':sv2==='added'?'added':'used');
        const allCosts=sv2==='used'?ptGetStatsCosts(msItem.id,'daily'):sv2==='added'?calcAddedCosts(msItem.id,'daily'):ptGetWasteCosts(msItem.id,'daily');
        function mapWeek2(arr){ return weekDays2.map(d=>{ const diff=Math.round((weekStart2-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5); const idx=11+diff; return (idx>=0&&idx<=11)?arr[idx]:0; }); }
        displayVals2=mapWeek2(allVals); displayCosts2=mapWeek2(allCosts);
        barLabels2=['M','T','W','T','F','S','S'];
      } else if(sw2==='thismonth'){
        displayVals2=ptGetStatsValuesForMonth(msItem.id,viewDate2.getFullYear(),viewDate2.getMonth(),sv2==='waste'?'waste':sv2==='added'?'added':'used');
        displayCosts2=sv2==='used'?ptGetStatsCostsForMonth(msItem.id,viewDate2.getFullYear(),viewDate2.getMonth()):sv2==='added'?new Array(daysInMonth2).fill(0):ptGetWasteCostsForMonth(msItem.id,viewDate2.getFullYear(),viewDate2.getMonth());
        barLabels2=Array.from({length:daysInMonth2},(_,i)=>i%5===0?String(i+1):'');
      } else if(sw2==='weekly'){
        const wks=ptGet12Weeks(now2);
        displayVals2=ptGetStatsValues(msItem.id,'weekly',sv2==='waste'?'waste':sv2==='added'?'added':'used');
        displayCosts2=sv2==='used'?ptGetStatsCosts(msItem.id,'weekly'):sv2==='added'?calcAddedCosts(msItem.id,'weekly'):ptGetWasteCosts(msItem.id,'weekly');
        barLabels2=wks.map(w=>w.label);
      } else {
        displayVals2=ptGetStatsValues(msItem.id,'monthly',sv2==='waste'?'waste':sv2==='added'?'added':'used');
        displayCosts2=sv2==='used'?ptGetStatsCosts(msItem.id,'monthly'):sv2==='added'?calcAddedCosts(msItem.id,'monthly'):ptGetWasteCosts(msItem.id,'monthly');
        barLabels2=Array.from({length:12},(_,i)=>{ const d=new Date(now2.getFullYear(),now2.getMonth()-(11-i),1); return MONTH_LETTERS[d.getMonth()]; });
      }

      // ── Graph ──
      const maxV2=Math.max(...displayVals2.map(v=>v||0),0.1);
      const hasNav2=sw2==='daily'||sw2==='thismonth';
      const graph2=document.createElement('div'); graph2.className='pt-graph'; graph2.style.cssText=`flex:1;min-width:0;${hasNav2?'padding-left:26px;padding-right:26px;':''}`;
      const graphWrap2=document.createElement('div'); graphWrap2.style.cssText='display:flex;align-items:stretch;width:100%;position:relative;';
      if(hasNav2){
        const pb=document.createElement('div'); pb.style.cssText='position:absolute;left:0;top:4px;bottom:4px;transform:translateX(-50%);width:44px;display:flex;align-items:center;justify-content:flex-end;padding-right:2px;cursor:pointer;background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);font-size:13px;font-weight:900;color:#fff;z-index:4;';
        pb.textContent='◀'; pb.onclick=e=>{ e.stopPropagation(); if(sw2==='daily') expandView.weekOffset=(expandView.weekOffset||0)-1; else expandView.monthOffset=(expandView.monthOffset||0)-1; expandView.selBar=null; renderExpand(); }; graphWrap2.appendChild(pb);
        const canFwd=(sw2==='daily'&&weekOffset2<0)||(sw2==='thismonth'&&monthOffset2<0);
        const nb=document.createElement('div'); nb.style.cssText=`position:absolute;right:0;top:4px;bottom:4px;transform:translateX(50%);width:44px;display:flex;align-items:center;justify-content:flex-start;padding-left:2px;cursor:pointer;background:var(--bg-3);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);font-size:13px;font-weight:900;color:${canFwd?'#fff':'var(--muted)'};z-index:4;`;
        nb.textContent='▶'; nb.onclick=e=>{ e.stopPropagation(); if(sw2==='daily'&&weekOffset2<0){ expandView.weekOffset++; expandView.selBar=null; renderExpand(); } else if(sw2==='thismonth'&&monthOffset2<0){ expandView.monthOffset++; expandView.selBar=null; renderExpand(); } }; graphWrap2.appendChild(nb);
      }
      graphWrap2.appendChild(graph2);
      displayVals2.forEach((u,i)=>{
        const isSel=sb===i;
        const isToday=(sw2==='daily')&&weekOffset2===0&&i===todayWi2;
        const barColor=sv2==='waste'?'#C85A5A':sv2==='added'?'#5A8DB8':'#48a971';
        const bw=document.createElement('div'); bw.className='pt-bar-wrap';
        const isFutureDay=(sw2==='daily'&&weekOffset2===0&&i>todayWi2)||(sw2==='thismonth'&&monthOffset2===0&&i>now2.getDate()-1);
        const showNum2=(sw2==='thismonth')?isSel:(sw2==='daily')?!isFutureDay:true;
        const numSize2=(sw2==='daily'||sw2==='thismonth')?'8px':'7px';
        const numEl2=document.createElement('div'); numEl2.style.cssText=`height:28px;min-width:${isSel?'32px':'0'};width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;margin-bottom:1px;overflow:${isSel?'visible':'hidden'};position:relative;z-index:${isSel?'2':'1'};`;
        if(showNum2&&u>0){
          const cv=displayCosts2[i]||0;
          const dSpan=document.createElement('div'); dSpan.style.cssText=`font-size:${numSize2};font-weight:900;color:${isSel?'#fff':'rgba(255,255,255,0.5)'};line-height:1;white-space:nowrap;`; dSpan.textContent=cv>0?'$'+cv.toFixed(2):'—';
          const div3=document.createElement('div'); div3.style.cssText=`width:60%;height:2px;background:${isSel?'#fff':'rgba(255,255,255,0.35)'};margin:1px auto;flex-shrink:0;border-radius:999px;`;
          const qSpan=document.createElement('div'); qSpan.style.cssText=`font-size:${numSize2};font-weight:900;color:${isSel?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.4)'};line-height:1;white-space:nowrap;`; qSpan.textContent=u.toFixed(1);
          numEl2.append(dSpan,div3,qSpan);
        }
        const bar=document.createElement('div'); bar.className='pt-bar'; bar.style.cssText=`height:${Math.max(2,Math.round(((u||0)/maxV2)*36))}px;background:${u>0?barColor:'rgba(255,255,255,0.08)'};opacity:${isSel?1:0.6};${isSel?'box-shadow:inset 2px 0 0 #fff,inset -2px 0 0 #fff,inset 0 -2px 0 #fff,0 -2px 0 #fff;':''}`;
        const showLbl2=(sw2==='thismonth')?(isSel||isToday):true;
        const lbl=document.createElement('div'); lbl.className='pt-day'; lbl.style.cssText=`color:${isToday?barColor:isSel?'#fff':''};font-weight:${isToday?'900':'600'};font-size:${isToday?'9px':'7px'};`; lbl.textContent=showLbl2?(sw2==='thismonth'?(isSel||isToday?String(i+1):''):(barLabels2[i]||'')):'';
        bw.append(numEl2,bar,lbl); bw.onclick=e=>{ e.stopPropagation(); expandView.selBar=expandView.selBar===i?null:i; renderExpand(); }; graph2.appendChild(bw);
      }); gCard.appendChild(graphWrap2);

      // ── Footer ──
      const foot2=document.createElement('div'); foot2.style.cssText='height:var(--drop-height);border-top:var(--border-width) solid var(--border-color);display:flex;align-items:stretch;';
      const leftEl2=document.createElement('div'); leftEl2.style.cssText='flex:1;min-width:0;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:8px;font-weight:800;color:var(--muted);border-right:var(--border-width) solid var(--border-color);padding:0 4px;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;';
      const rightEl2=document.createElement('div'); rightEl2.style.cssText=`flex:1;min-width:0;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:8px;font-weight:800;color:${sv2==='waste'?'#C85A5A':sv2==='added'?'#5A8DB8':'#48a971'};padding:0 4px;overflow:hidden;white-space:nowrap;`;
      if(sb!==null&&sb!==undefined){
        let rt2='';
        if(sw2==='daily'){ rt2=weekDays2[sb]?weekDays2[sb].toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):''; }
        else if(sw2==='thismonth'){ rt2=new Date(viewDate2.getFullYear(),viewDate2.getMonth(),sb+1).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
        else if(sw2==='weekly'){ const w=ptGet12Weeks(now2)[sb]; rt2=w.start.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+new Date(w.end.getFullYear(),w.end.getMonth(),w.end.getDate()).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
        else { const d=new Date(now2.getFullYear(),now2.getMonth()-(11-sb),1); rt2=d.toLocaleDateString('en-US',{month:'long',year:'numeric'}); }
        leftEl2.textContent=rt2;
        const cv=displayCosts2[sb]||0; const uv=displayVals2[sb]||0;
        rightEl2.textContent=cv>0?'$'+cv.toFixed(2):(uv>0?uv.toFixed(1)+' '+getUnitDisplay(_ptUnitId,uv):'—');
      } else {
        if(sw2==='daily') leftEl2.textContent=weekStart2.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+weekEnd2.toLocaleDateString('en-US',{month:'short',day:'numeric'});
        else if(sw2==='thismonth') leftEl2.textContent=viewDate2.toLocaleDateString('en-US',{month:'long',year:'numeric'});
        else if(sw2==='weekly') leftEl2.textContent='12 Week Total';
        else leftEl2.textContent='12 Month Total';
        const totalCost=displayCosts2.reduce((s,v)=>s+v,0); const totalUnits=displayVals2.reduce((s,v)=>s+v,0);
        rightEl2.textContent=totalCost>0?'$'+totalCost.toFixed(2):(totalUnits>0?totalUnits.toFixed(1)+' '+getUnitDisplay(_ptUnitId,totalUnits):'—');
      }
      foot2.append(leftEl2,rightEl2); gCard.appendChild(foot2);

      // ── Mode row (This Week / This Month / Weekly / Monthly) ──
      const MONTH_NAMES_SHORT2=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const thisMonthLbl2=monthOffset2===0?'This Month':`${MONTH_NAMES_SHORT2[viewDate2.getMonth()]} ${viewDate2.getFullYear()}`;
      const modeRow2=document.createElement('div'); modeRow2.style.cssText='height:var(--drop-height);display:flex;align-items:stretch;border-top:var(--border-width) solid var(--border-color);';
      [['daily','This Week'],['thismonth',thisMonthLbl2],['weekly','Weekly'],['monthly','Monthly']].forEach(([v,lbl],i,arr)=>{
        const isAct=sw2===v; const btn=document.createElement('div');
        btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;overflow:hidden;white-space:nowrap;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`;
        btn.textContent=lbl; btn.onclick=e=>{ e.stopPropagation(); expandView.sw=v; expandView.selBar=null; if(v!=='daily') expandView.weekOffset=0; if(v!=='thismonth') expandView.monthOffset=0; renderExpand(); }; modeRow2.appendChild(btn);
      }); gCard.appendChild(modeRow2);

      body.appendChild(gCard);

      // View History card
      const histBtn=document.createElement('div'); histBtn.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:var(--bg-4);';
      const histLbl=document.createElement('div'); histLbl.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);'; histLbl.textContent='View History';
      histBtn.appendChild(histLbl);
      histBtn.onclick=e=>{ e.stopPropagation(); openPantryHistoryWindow(msItem,pd,wrap,selectedCon,expandView); };
      body.appendChild(histBtn);

    } else if(expandView.mode==='containers'){
      const selCon=selectedCon.id?pd.containers.find(c=>c.id===selectedCon.id):null;
      if(selCon&&expandView.fillConId!==selCon.id){ expandView.fillStart=selCon.amount; expandView.fillConId=selCon.id; }
      if(!selCon){ expandView.fillStart=undefined; expandView.fillConId=undefined; }
      const sorted=[...pd.containers].sort((a,b)=>(a.amount===0&&b.amount>0)?1:(b.amount===0&&a.amount>0)?-1:0);
      let pendingConfirm=null;
      if(pd.containers.length===0){ const emptyMsg=document.createElement('div'); emptyMsg.style.cssText='height:var(--card-height);border:3px solid #000;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:9px;font-weight:600;color:var(--muted);font-style:italic;'; emptyMsg.textContent='No containers — add one below'; body.appendChild(emptyMsg); }
      else {
        // split into rows of max 3, balanced: e.g. 4→[2,2], 5→[3,2], 7→[3,3,1]
        function chunkContainers(arr){
          const total=arr.length, rows=Math.ceil(total/3), chunks=[];
          let rem=total;
          for(let r=0;r<rows;r++){
            const rowsLeft=rows-r;
            const size=Math.ceil(rem/rowsLeft);
            chunks.push(arr.slice(total-rem,total-rem+size));
            rem-=size;
          }
          return chunks;
        }
        chunkContainers(sorted).forEach(rowCons=>{
          const rowEl=document.createElement('div'); rowEl.style.cssText='display:flex;gap:4px;';
          rowCons.forEach(con=>{
            const isSel=selectedCon.id===con.id;
            const hasPending=isSel&&expandView.fillStart!==undefined&&con.amount!==expandView.fillStart;
            const vM=Math.max(con.cap,con.amount,expandView.fillStart||0)||1;
            const cPct=(con.amount/vM*100).toFixed(1);
            const card=document.createElement('div'); card.style.cssText=`flex:1;height:var(--card-height);border:3px solid ${isSel?'#fff':'#000'};border-radius:8px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;min-width:0;`;
            const fill=document.createElement('div'); fill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${cPct}%;background:${ptConFillColor(con)};opacity:0.3;transition:width 0.3s;pointer-events:none;`;
            card.appendChild(fill);
            if(hasPending){
              const startPct=(expandView.fillStart/vM*100);
              const nowPct=(con.amount/vM*100);
              const isUsed=nowPct<startPct;
              const ghostLeft=Math.min(startPct,nowPct);
              const ghostWidth=Math.abs(startPct-nowPct);
              const ghostColor=ptDarken(ptConFillColor(con),0.7);
              const ghost=document.createElement('div');
              ghost.style.cssText=`position:absolute;top:0;bottom:0;left:${ghostLeft}%;width:${ghostWidth}%;background:${ghostColor};opacity:0.6;pointer-events:none;transition:left 0.15s,width 0.15s;`;
              card.appendChild(ghost);
            }
            const inner=document.createElement('div'); inner.style.cssText='position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:100%;padding:0 4px;box-sizing:border-box;';
            const nmEl=document.createElement('div'); nmEl.style.cssText='font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center;line-height:1.1;'; nmEl.textContent=(con.label||'Container').toUpperCase();
            const amtEl=document.createElement('div'); amtEl.style.cssText='font-size:8px;font-weight:700;color:rgba(255,255,255,0.7);text-align:center;letter-spacing:0.06em;line-height:1.1;'; amtEl.textContent=`${con.amount} / ${con.cap}`;
            const prEl=document.createElement('div'); prEl.style.cssText='text-align:center;';
            if(con.free){ prEl.style.cssText+='font-size:9px;font-weight:800;color:#48a971;'; prEl.textContent='FREE'; prEl.style.textTransform='uppercase'; }
            else if(con.price!=null){ const ppu=con.cap>0?(con.price/con.cap).toFixed(2):'?'; prEl.style.cssText+='font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);'; prEl.textContent=('$'+ppu+'/'+(pd.unit||'unit')).toUpperCase(); }
            else { prEl.style.cssText+='font-size:9px;font-weight:700;color:#C85A5A;'; prEl.textContent='NO PRICE'; }
            inner.append(nmEl,amtEl,prEl);
            card.appendChild(inner);
            card.onclick=e=>{ e.stopPropagation(); revertPendingFill(); selectedCon.id=selectedCon.id===con.id?null:con.id; updateBtnState(); renderExpand(); };
            if(con._confirmEmpty) pendingConfirm=con;
            rowEl.appendChild(card);
          });
          body.appendChild(rowEl);
        });
        if(pendingConfirm){ const con=pendingConfirm; const conf=document.createElement('div'); conf.style.cssText=`height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;`;
          const msg=document.createElement('div'); msg.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:#e08080;background:#2a1010;'; msg.textContent='Container empty?';
          const usedBtn=document.createElement('div'); usedBtn.style.cssText='width:72px;min-width:72px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#1d3318;color:#48a971;cursor:pointer;border-left:3px solid #000;text-align:center;padding:0 4px;'; usedBtn.textContent='Used It Up'; usedBtn.onclick=e=>{ e.stopPropagation(); con._confirmEmpty=false; con._isEmptyChoice=true; saveItemPantry(msItem.id,pd); renderExpand(); };
          const wasteBtn=document.createElement('div'); wasteBtn.style.cssText='width:72px;min-width:72px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#502424;color:#C85A5A;cursor:pointer;border-left:3px solid #000;text-align:center;padding:0 4px;'; wasteBtn.textContent='Threw It Away'; wasteBtn.onclick=e=>{ e.stopPropagation(); const wAmt=con.cap; const wCost=(!con.free&&con.price!=null&&con.cap>0)?con.price:null; con._confirmEmpty=false; con._isEmptyChoice=true; dlPush(msItem.id,-wAmt,wCost,'w'); saveItemPantry(msItem.id,pd); renderExpand(); };
          const hereBtn=document.createElement('div'); hereBtn.style.cssText='width:54px;min-width:54px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#1a2a3a;color:var(--muted);cursor:pointer;border-left:3px solid #000;text-align:center;padding:0 4px;'; hereBtn.textContent='Still Here'; hereBtn.onclick=e=>{ e.stopPropagation(); con.amount=pd.step; con._confirmEmpty=false; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); };
          conf.append(msg,usedBtn,wasteBtn,hereBtn); body.appendChild(conf); }
        pd.containers.filter(c=>c._isEmptyChoice).forEach(con=>{ const ch=document.createElement('div'); ch.style.cssText=`border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`; const bR=document.createElement('div'); bR.style.cssText='height:32px;display:flex;align-items:stretch;'; const dBtn=document.createElement('div'); dBtn.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#502424;color:#fff;cursor:pointer;border-right:3px solid #000;'; dBtn.textContent='Delete Container'; dBtn.onclick=e=>{ e.stopPropagation(); pd.containers=pd.containers.filter(c=>c.id!==con.id); if(selectedCon.id===con.id) selectedCon.id=null; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; const kBtn=document.createElement('div'); kBtn.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#1d3318;color:#48a971;cursor:pointer;'; kBtn.textContent='Keep Empty'; kBtn.onclick=e=>{ e.stopPropagation(); con._isEmptyChoice=false; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; bR.append(dBtn,kBtn); ch.append(bR); body.appendChild(ch); });
      }
      // ── Fill UI: Percent / Fraction tabs ──
      if(!expandView.fillTab) expandView.fillTab='pct';
      function doFillApply(pct){
        if(!selCon) return;
        const next=parseFloat((selCon.cap*Math.max(0,Math.min(100,pct))/100).toFixed(1));
        selCon.amount=next;
        saveItemPantry(msItem.id,pd); // silent — no prevStock, no delta logged
        ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
      }

      // EDIT | DELETE card
      const actCard=document.createElement('div'); actCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const editSec=document.createElement('div'); editSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:#48a971;cursor:pointer;'; editSec.textContent='Edit';
      editSec.onclick=e=>{ e.stopPropagation(); if(!selCon) return; openEditContainerWindow(msItem,pd,selCon,wrap,selectedCon,expandView); };
      const edDiv=document.createElement('div'); edDiv.style.cssText='width:3px;background:#000;flex-shrink:0;';
      const delSec=document.createElement('div'); delSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:#C85A5A;cursor:pointer;'; delSec.textContent='Delete'; delSec._t=0; delSec._timer=null;
      delSec.onclick=e=>{ e.stopPropagation(); if(!selCon) return; delSec._t++; clearTimeout(delSec._timer); if(delSec._t>=2){ delSec._t=0; expandView.fillStart=undefined; expandView.fillConId=undefined; pd.containers=pd.containers.filter(c=>c.id!==selCon.id); selectedCon.id=null; updateBtnState(); saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); } else{ delSec.style.background='#fff'; delSec.style.color='#C85A5A'; delSec._timer=setTimeout(()=>{ delSec._t=0; delSec.style.background='#C85A5A'; delSec.style.color='#fff'; },3000); } };
      actCard.append(editSec,edDiv,delSec); body.appendChild(actCard);
      if(!selCon){ actCard.style.display='none'; }
      const ctrlDivider=document.createElement('div'); ctrlDivider.style.cssText='height:3px;background:#000;margin:0 -4px;flex-shrink:0;';
      body.appendChild(ctrlDivider);
      if(!selCon){ ctrlDivider.style.display='none'; }

      // Fill tab switcher (Percent / Fraction)
      const fillTabBar=document.createElement('div'); fillTabBar.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;';
      [['pct','Percent'],['frac','Fraction']].forEach(([tv,tlbl],i)=>{
        const t=document.createElement('div'); const isAct=expandView.fillTab===tv;
        t.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'#fff':'var(--muted)'};${i===0?'border-right:3px solid #000;':''}`;
        t.textContent=tlbl;
        t.onclick=e=>{ e.stopPropagation(); expandView.fillTab=tv; renderExpand(); };
        fillTabBar.appendChild(t);
      });
      body.appendChild(fillTabBar);
      if(!selCon){ fillTabBar.style.display='none'; }

      // Percent panel — innerHTML for performance
      const curFillPct=selCon?parseFloat((selCon.amount/selCon.cap*100).toFixed(2)):0;
      const curFillR=Math.round(curFillPct);
      const curFillTens=Math.floor(curFillR/10)*10;
      const curFillOnes=curFillR%10;
      const fillAt100=(curFillR>=100);
      const pctPanel=document.createElement('div'); pctPanel.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;';
      const btn100bg=fillAt100?'#fff':'#48a971'; const btn100col=fillAt100?'#48a971':'#fff';
      pctPanel.innerHTML=`<div style="display:flex;align-items:stretch;">
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;">
          <div data-role="tens" style="height:22px;display:flex;align-items:stretch;">${fillTENS.map((p,i)=>{const on=(p===curFillTens&&!fillAt100);const c=fillLerp4(Math.max(p,1)/100);return`<div data-p="${p}" style="${i===0?'width:20px;min-width:20px;flex-shrink:0;':'flex:1;min-width:0;'}display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:8px;font-weight:900;user-select:none;background:${on?'#fff':c};color:${on?c:'#fff'};${i>0?'border-left:3px solid #000;':''}">${p===0?'00':p}</div>`;}).join('')}</div>
          <div data-role="ones" style="height:22px;display:flex;align-items:stretch;border-top:3px solid #000;">${fillONES.map((o,i)=>{const on=(!fillAt100&&o===curFillOnes);const fp=Math.min(100,curFillTens+o);const c=fillLerp4(Math.max(fp,1)/100);return`<div data-o="${o}" data-fp="${fp}" style="${i===0?'width:20px;min-width:20px;flex-shrink:0;':'flex:1;min-width:0;'}display:flex;align-items:center;justify-content:center;cursor:${fillAt100?'default':'pointer'};font-size:8px;font-weight:900;user-select:none;background:${fillAt100?'#1e2a35':on?'#fff':c};color:${fillAt100?'#4a5568':on?c:'#fff'};${i>0?'border-left:3px solid #000;':''}">${o}</div>`;}).join('')}</div>
        </div>
        <div data-role="btn100" style="width:23px;min-width:23px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:900;writing-mode:vertical-rl;border-left:3px solid #000;background:${btn100bg};color:${btn100col};">100</div>
      </div>`;
      pctPanel.querySelector('[data-role="tens"]').onclick=e=>{ e.stopPropagation(); const el=e.target.closest('[data-p]'); if(el) doFillApply(+el.dataset.p); };
      pctPanel.querySelector('[data-role="ones"]').onclick=e=>{ e.stopPropagation(); if(fillAt100) return; const el=e.target.closest('[data-o]'); if(el) doFillApply(+el.dataset.fp); };
      pctPanel.querySelector('[data-role="btn100"]').onclick=e=>{ e.stopPropagation(); doFillApply(100); };
      body.appendChild(pctPanel);
      if(!selCon||expandView.fillTab!=='pct'){ pctPanel.style.display='none'; }

      // Fraction panel — innerHTML for performance
      const isFracEmpty=(selCon&&selCon.amount===0);
      const isFracFull=(selCon&&selCon.amount>=selCon.cap);
      const fracPanel=document.createElement('div'); fracPanel.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;';
      fracPanel.innerHTML=`<div style="display:flex;align-items:stretch;">
        <div data-role="fempty" style="width:20px;min-width:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:900;writing-mode:vertical-lr;transform:rotate(180deg);background:${isFracEmpty?'#fff':'#C85A5A'};color:${isFracEmpty?'#C85A5A':'#fff'};">Empty</div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;border-left:3px solid #000;border-right:3px solid #000;">
          <div data-role="frow1" style="height:22px;display:flex;align-items:stretch;">${fillFRACS.map(([n,d],i)=>{const fc2=fillFC[d]||'#374151';const isSel=selCon&&Math.abs((selCon.amount/selCon.cap)-(n/d))<0.001;return`<div data-n="${n}" data-d="${d}" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:${isSel?fc2:'#fff'};background:${!selCon?'var(--bg-4)':isSel?'#fff':fc2};cursor:${selCon?'pointer':'default'};${i>0?'border-left:3px solid #000;':''}"><sup style="font-size:6px;font-weight:900">${n}</sup><span style="font-size:8px;font-weight:900">/</span><sub style="font-size:6px;font-weight:900">${d}</sub></div>`;}).join('')}</div>
          <div data-role="frow2" style="height:22px;display:flex;align-items:stretch;border-top:3px solid #000;">${fillFRACS2.map(([n,d],i)=>{const fc2=fillFC[d]||'#374151';const isSel=selCon&&Math.abs((selCon.amount/selCon.cap)-(n/d))<0.001;return`<div data-n="${n}" data-d="${d}" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:${isSel?fc2:'#fff'};background:${!selCon?'var(--bg-4)':isSel?'#fff':fc2};cursor:${selCon?'pointer':'default'};${i>0?'border-left:3px solid #000;':''}"><sup style="font-size:6px;font-weight:900">${n}</sup><span style="font-size:8px;font-weight:900">/</span><sub style="font-size:6px;font-weight:900">${d}</sub></div>`;}).join('')}</div>
        </div>
        <div data-role="ffull" style="width:20px;min-width:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:900;writing-mode:vertical-rl;background:${isFracFull?'#fff':'#48a971'};color:${isFracFull?'#48a971':'#fff'};">Full</div>
      </div>`;
      fracPanel.querySelector('[data-role="fempty"]').onclick=e=>{ e.stopPropagation(); doFillApply(0); };
      fracPanel.querySelector('[data-role="ffull"]').onclick=e=>{ e.stopPropagation(); doFillApply(100); };
      const fracClickHandler=e=>{ e.stopPropagation(); if(!selCon) return; const el=e.target.closest('[data-n]'); if(el) doFillApply((+el.dataset.n/+el.dataset.d)*100); };
      fracPanel.querySelector('[data-role="frow1"]').onclick=fracClickHandler;
      fracPanel.querySelector('[data-role="frow2"]').onclick=fracClickHandler;
      body.appendChild(fracPanel);
      if(!selCon||expandView.fillTab!=='frac'){ fracPanel.style.display='none'; }

      // Confirm card — shown when fill has changed since container was selected
      if(selCon&&expandView.fillStart!==undefined&&selCon.amount!==expandView.fillStart){
        const nowPct=Math.round(selCon.amount/selCon.cap*100);
        const startPct=Math.round(expandView.fillStart/selCon.cap*100);
        const deltaPct=nowPct-startPct;
        const isUsed=deltaPct<0;
        const confirmEl=document.createElement('div'); confirmEl.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
        const confLeft=document.createElement('div'); confLeft.style.cssText='flex:1;min-width:0;display:flex;align-items:center;justify-content:center;background:#374151;font-size:11px;font-weight:900;color:#fff;';
        confLeft.textContent=`${nowPct}% (${deltaPct>0?'+':''}${deltaPct}%)`;
        const confRight=document.createElement('div'); confRight.style.cssText=`flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#fff;border-left:3px solid #000;cursor:pointer;background:${isUsed?'#C85A5A':'#48a971'};`;
        confRight.textContent=isUsed?'Tap to Log as Used':'Tap to Log as Added';
        confRight.onclick=e=>{ e.stopPropagation(); const netDelta=selCon.amount-expandView.fillStart; const prevS=ptGetStock(pd)-netDelta; const cost=(!selCon.free&&selCon.price!=null&&selCon.cap>0&&netDelta!==0)?(Math.abs(netDelta)/selCon.cap)*selCon.price:null; saveItemPantry(msItem.id,pd,prevS,cost); expandView.fillStart=selCon.amount; expandView.fillConId=selCon.id; if(!isUsed&&expandView._wasteCeilings){ expandView._wasteCeilings[selCon.id]=Math.max(expandView._wasteCeilings[selCon.id]??0,selCon.amount); } ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); };
        confirmEl.append(confLeft,confRight); body.appendChild(confirmEl);
      }

    } else if(expandView.mode==='waste'){
      const sorted=[...pd.containers].sort((a,b)=>(a.amount===0&&b.amount>0)?1:(b.amount===0&&a.amount>0)?-1:0);
      if(pd.containers.length===0){
        const emptyMsg=document.createElement('div'); emptyMsg.style.cssText='height:var(--card-height);border:3px solid #000;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:9px;font-weight:600;color:var(--muted);font-style:italic;'; emptyMsg.textContent='No containers to log waste from'; body.appendChild(emptyMsg);
      } else {
        const todayMid=new Date(); todayMid.setHours(0,0,0,0);
        const todayUsed=dlGetEntriesInRange(msItem.id,todayMid.getTime(),Date.now()).filter(e=>e.delta<0&&!e.waste).reduce((s,e)=>s+Math.abs(e.delta),0);
        const selCon=selectedCon.id?pd.containers.find(c=>c.id===selectedCon.id):null;
        // Session floor: current waste level when waste tab was opened — cannot go below this
        if(expandView._wasteFloor===undefined) expandView._wasteFloor=wlGet(msItem.id);
        if(!expandView._wasteCeilings) expandView._wasteCeilings={};
        pd.containers.forEach(c=>{ if(!(c.id in expandView._wasteCeilings)) expandView._wasteCeilings[c.id]=c.amount; });
        const wasteFloor=expandView._wasteFloor;
        const currentWaste=wlGet(msItem.id);
        const maxWaste=selCon?parseFloat(Math.min(selCon.amount+(currentWaste-wasteFloor),todayUsed).toFixed(2)):0;
        // initialize fillStart for waste mode
        if(selCon&&expandView.fillConId!==selCon.id){ expandView.fillStart=selCon.amount; expandView.fillConId=selCon.id; }
        if(!selCon){ expandView.fillStart=undefined; expandView.fillConId=undefined; }
        function chunkWaste(arr){ const total=arr.length,rows=Math.ceil(total/3),chunks=[]; let rem=total; for(let r=0;r<rows;r++){ const rowsLeft=rows-r; const size=Math.ceil(rem/rowsLeft); chunks.push(arr.slice(total-rem,total-rem+size)); rem-=size; } return chunks; }
        chunkWaste(sorted).forEach(rowCons=>{
          const rowEl=document.createElement('div'); rowEl.style.cssText='display:flex;gap:4px;';
          rowCons.forEach(con=>{
            const isSel=selectedCon.id===con.id;
            const hasPending=isSel&&expandView.fillStart!==undefined&&con.amount!==expandView.fillStart;
            const vM=Math.max(con.cap,con.amount,expandView.fillStart||0)||1; const cPct=(con.amount/vM*100).toFixed(1);
            const card=document.createElement('div'); card.style.cssText=`flex:1;height:var(--card-height);border:3px solid ${isSel?'#fff':'#000'};border-radius:8px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;min-width:0;`;
            const fill=document.createElement('div'); fill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${cPct}%;background:#C85A5A;opacity:0.25;transition:width 0.3s;pointer-events:none;`;
            card.appendChild(fill);
            if(hasPending){
              const startPct=(expandView.fillStart/vM*100);
              const nowPct=(con.amount/vM*100);
              const ghostLeft=Math.min(startPct,nowPct);
              const ghostWidth=Math.abs(startPct-nowPct);
              const ghostColor=ptDarken(ptConFillColor(con),0.7);
              const ghost=document.createElement('div');
              ghost.style.cssText=`position:absolute;top:0;bottom:0;left:${ghostLeft}%;width:${ghostWidth}%;background:${ghostColor};opacity:0.6;pointer-events:none;transition:left 0.15s,width 0.15s;`;
              card.appendChild(ghost);
            }
            const inner=document.createElement('div'); inner.style.cssText='position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:100%;padding:0 4px;box-sizing:border-box;';
            const nmEl=document.createElement('div'); nmEl.style.cssText='font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center;line-height:1.1;'; nmEl.textContent=(con.label||'Container').toUpperCase();
            const amtEl=document.createElement('div'); amtEl.style.cssText='font-size:8px;font-weight:700;color:rgba(255,255,255,0.7);text-align:center;'; amtEl.textContent=`${con.amount} / ${con.cap}`;
            inner.append(nmEl,amtEl); card.appendChild(inner);
            card.onclick=e=>{ e.stopPropagation(); revertPendingFill(); selectedCon.id=selectedCon.id===con.id?null:con.id; updateBtnState(); renderExpand(); };
            rowEl.appendChild(card);
          });
          body.appendChild(rowEl);
        });

        // Waste fill UI — same percent/fraction tabs, confirm logs as waste
        function doWasteFillApply(pct){
          if(!selCon) return;
          const next=parseFloat((selCon.cap*Math.max(0,Math.min(100,pct))/100).toFixed(1));
          selCon.amount=next;
          saveItemPantry(msItem.id,pd); // silent — confirm card logs waste
          ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
        }
        if(!expandView.fillTab) expandView.fillTab='pct';

        // Tab switcher
        const wFillTabBar=document.createElement('div'); wFillTabBar.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;';
        [['pct','Percent'],['frac','Fraction']].forEach(([tv,tlbl],i)=>{
          const t=document.createElement('div'); const isAct=expandView.fillTab===tv;
          t.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'#fff':'var(--muted)'};${i===0?'border-right:3px solid #000;':''}`;
          t.textContent=tlbl;
          t.onclick=e=>{ e.stopPropagation(); expandView.fillTab=tv; renderExpand(); };
          wFillTabBar.appendChild(t);
        });
        body.appendChild(wFillTabBar);
        if(!selCon){ wFillTabBar.style.display='none'; }

        // Percent panel — innerHTML for performance
        const wCurPct=selCon?parseFloat((selCon.amount/selCon.cap*100).toFixed(2)):0;
        const wCurR=Math.round(wCurPct); const wCurTens=Math.floor(wCurR/10)*10; const wCurOnes=wCurR%10; const wAt100=(wCurR>=100);
        const wFloorPct=selCon&&expandView._wasteCeilings?Math.round((expandView._wasteCeilings[selCon.id]??selCon.amount)/selCon.cap*100):wCurR;
        const wCeiling=selCon&&expandView._wasteCeilings?(expandView._wasteCeilings[selCon.id]??selCon.amount):selCon?.amount??0;
        const wIsEmpty=(selCon&&selCon.amount===0);
        const wPctPanel=document.createElement('div'); wPctPanel.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;';
        wPctPanel.innerHTML=`<div style="display:flex;align-items:stretch;">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;">
            <div data-role="wtens" style="height:22px;display:flex;align-items:stretch;">${fillTENS.map((p,i)=>{const blocked=p>wFloorPct;const on=(!blocked&&p===wCurTens&&!wAt100);const c=fillLerp4(Math.max(p,1)/100);return`<div data-p="${p}" data-blocked="${blocked}" style="${i===0?'width:20px;min-width:20px;flex-shrink:0;':'flex:1;min-width:0;'}display:flex;align-items:center;justify-content:center;cursor:${blocked?'default':'pointer'};font-size:8px;font-weight:900;user-select:none;background:${blocked?'#1e2a35':on?'#fff':c};color:${blocked?'#4a5568':on?c:'#fff'};${i>0?'border-left:3px solid #000;':''}">${p===0?'00':p}</div>`;}).join('')}</div>
            <div data-role="wones" style="height:22px;display:flex;align-items:stretch;border-top:3px solid #000;">${fillONES.map((o,i)=>{const fp=Math.min(100,wCurTens+o);const blocked=fp>wFloorPct;const on=(!blocked&&!wAt100&&o===wCurOnes);const c=fillLerp4(Math.max(fp,1)/100);return`<div data-fp="${fp}" data-blocked="${blocked}" style="${i===0?'width:20px;min-width:20px;flex-shrink:0;':'flex:1;min-width:0;'}display:flex;align-items:center;justify-content:center;cursor:${blocked?'default':'pointer'};font-size:8px;font-weight:900;user-select:none;background:${blocked?'#1e2a35':on?'#fff':c};color:${blocked?'#4a5568':on?c:'#fff'};${i>0?'border-left:3px solid #000;':''}">${o}</div>`;}).join('')}</div>
          </div>
          <div style="width:23px;min-width:23px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:default;font-size:9px;font-weight:900;writing-mode:vertical-rl;border-left:3px solid #000;background:#1e2a35;color:#4a5568;">100</div>
        </div>`;
        wPctPanel.querySelector('[data-role="wtens"]').onclick=e=>{ e.stopPropagation(); const el=e.target.closest('[data-p]'); if(el&&el.dataset.blocked!=='true') doWasteFillApply(+el.dataset.p); };
        wPctPanel.querySelector('[data-role="wones"]').onclick=e=>{ e.stopPropagation(); const el=e.target.closest('[data-fp]'); if(el&&el.dataset.blocked!=='true') doWasteFillApply(+el.dataset.fp); };
        body.appendChild(wPctPanel);
        if(!selCon||expandView.fillTab!=='pct'){ wPctPanel.style.display='none'; }

        // Fraction panel — innerHTML for performance
        const wFracPanel=document.createElement('div'); wFracPanel.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;';
        wFracPanel.innerHTML=`<div style="display:flex;align-items:stretch;">
          <div data-role="wfempty" style="width:20px;min-width:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:900;writing-mode:vertical-lr;transform:rotate(180deg);background:${wIsEmpty?'#fff':'#C85A5A'};color:${wIsEmpty?'#C85A5A':'#fff'};">Empty</div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;border-left:3px solid #000;border-right:3px solid #000;">
            <div data-role="wfrow1" style="height:22px;display:flex;align-items:stretch;">${fillFRACS.map(([n,d],i)=>{const fc2=fillFC[d]||'#374151';const ratio=n/d;const blocked=selCon&&ratio>(wCeiling/selCon.cap)+0.001;const isSel2=!blocked&&selCon&&Math.abs((selCon.amount/selCon.cap)-ratio)<0.001;return`<div data-n="${n}" data-d="${d}" data-blocked="${blocked}" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:${blocked?'#4a5568':isSel2?fc2:'#fff'};background:${blocked?'#1e2a35':!selCon?'var(--bg-4)':isSel2?'#fff':fc2};cursor:${blocked||!selCon?'default':'pointer'};${i>0?'border-left:3px solid #000;':''}"><sup style="font-size:6px;font-weight:900">${n}</sup><span style="font-size:8px;font-weight:900">/</span><sub style="font-size:6px;font-weight:900">${d}</sub></div>`;}).join('')}</div>
            <div data-role="wfrow2" style="height:22px;display:flex;align-items:stretch;border-top:3px solid #000;">${fillFRACS2.map(([n,d],i)=>{const fc2=fillFC[d]||'#374151';const ratio=n/d;const blocked=selCon&&ratio>(wCeiling/selCon.cap)+0.001;const isSel2=!blocked&&selCon&&Math.abs((selCon.amount/selCon.cap)-ratio)<0.001;return`<div data-n="${n}" data-d="${d}" data-blocked="${blocked}" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:${blocked?'#4a5568':isSel2?fc2:'#fff'};background:${blocked?'#1e2a35':!selCon?'var(--bg-4)':isSel2?'#fff':fc2};cursor:${blocked||!selCon?'default':'pointer'};${i>0?'border-left:3px solid #000;':''}"><sup style="font-size:6px;font-weight:900">${n}</sup><span style="font-size:8px;font-weight:900">/</span><sub style="font-size:6px;font-weight:900">${d}</sub></div>`;}).join('')}</div>
          </div>
          <div data-role="wffull" style="width:20px;min-width:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:default;font-size:9px;font-weight:900;writing-mode:vertical-rl;background:#1e2a35;color:#4a5568;">Full</div>
        </div>`;
        wFracPanel.querySelector('[data-role="wfempty"]').onclick=e=>{ e.stopPropagation(); doWasteFillApply(0); };
        const wFracClick=e=>{ e.stopPropagation(); const el=e.target.closest('[data-n]'); if(el&&el.dataset.blocked!=='true'&&selCon) doWasteFillApply((+el.dataset.n/+el.dataset.d)*100); };
        wFracPanel.querySelector('[data-role="wfrow1"]').onclick=wFracClick;
        wFracPanel.querySelector('[data-role="wfrow2"]').onclick=wFracClick;
        body.appendChild(wFracPanel);
        if(!selCon||expandView.fillTab!=='frac'){ wFracPanel.style.display='none'; }

        // Confirm card — waste only logs on confirm
        if(selCon&&expandView.fillStart!==undefined&&selCon.amount!==expandView.fillStart){
          const wNowPct=Math.round(selCon.amount/selCon.cap*100);
          const wStartPct=Math.round(expandView.fillStart/selCon.cap*100);
          const wDeltaPct=wNowPct-wStartPct;
          const wConfirm=document.createElement('div'); wConfirm.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
          const wConfLeft=document.createElement('div'); wConfLeft.style.cssText='flex:1;min-width:0;display:flex;align-items:center;justify-content:center;background:#374151;font-size:11px;font-weight:900;color:#fff;';
          wConfLeft.textContent=`${wNowPct}% (${wDeltaPct>0?'+':''}${wDeltaPct}%)`;
          const wConfRight=document.createElement('div'); wConfRight.style.cssText='flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#fff;border-left:3px solid #000;cursor:pointer;background:#C85A5A;';
          wConfRight.textContent='Tap to Log as Waste';
          wConfRight.onclick=e=>{
            e.stopPropagation();
            const wasteDelta=expandView.fillStart-selCon.amount; // positive = waste
            const newWaste=parseFloat((currentWaste+wasteDelta).toFixed(2));
            const wCost=(!selCon.free&&selCon.price!=null&&selCon.cap>0&&wasteDelta!==0)?(Math.abs(wasteDelta)/selCon.cap)*selCon.price:null;
            if(wasteDelta>0){ dlPush(msItem.id,-wasteDelta,wCost,'w'); }
            wlSet(msItem.id,Math.max(wasteFloor,newWaste));
            saveItemPantry(msItem.id,pd);
            expandView.fillStart=selCon.amount; expandView.fillConId=selCon.id;
            ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
          };
          wConfirm.append(wConfLeft,wConfRight); body.appendChild(wConfirm);
        }
        // legacy clear/wasteAll buttons no longer needed — handled by confirm card
      }

    } else {
      function makeAdjCard(label,getVal,setVal,minVal,getStep){ const card=document.createElement('div'); card.style.cssText=`display:flex;align-items:stretch;height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`; const m=document.createElement('div'); m.style.cssText='width:32px;min-width:32px;border:none;border-right:3px solid #000;background:var(--bg-2);color:var(--color-10);font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;'; m.textContent='−'; const ctr=document.createElement('div'); ctr.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);gap:1px;'; const vEl=document.createElement('div'); vEl.style.cssText='font-size:11px;font-weight:800;'; vEl.textContent=getVal(); const lEl=document.createElement('div'); lEl.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);'; lEl.textContent=label; ctr.append(vEl,lEl); const p=document.createElement('div'); p.style.cssText='width:32px;min-width:32px;border:none;border-left:3px solid #000;background:var(--bg-2);color:var(--color-10);font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;'; p.textContent='+'; const step=()=>getStep?getStep():0.5; m.onclick=e=>{ e.stopPropagation(); const v=Math.max(minVal,parseFloat((getVal()-step()).toFixed(1))); setVal(v); vEl.textContent=v; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; p.onclick=e=>{ e.stopPropagation(); const v=parseFloat((getVal()+step()).toFixed(1)); setVal(v); vEl.textContent=v; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; card.append(m,ctr,p); return card; }
      body.appendChild(makeAdjCard('Total Cap',()=>pd.totalCap,v=>{ pd.totalCap=v; },0,()=>pd.step));
      body.appendChild(makeAdjCard('Step',()=>pd.step,v=>{ pd.step=v; },0.5,()=>0.5));

      // today's usage adjuster — reads/writes pantry_usage_log for today only
      const todayMidnight=new Date(); todayMidnight.setHours(0,0,0,0);
      function getTodayUsage(){ return ulGetTodayTotal(msItem.id); }
      function setTodayUsage(newVal){
        ulSetToday(msItem.id, newVal);
        const u=getPtUsage(); u[msItem.id]=parseFloat(ulGetTotal(msItem.id).toFixed(2));
        lsSet('pantry_usage',u);
      }

      function getTodayUsageSnap(){ const midnight=new Date(); midnight.setHours(0,0,0,0); return parseFloat(dlGetEntriesInRange(msItem.id,midnight.getTime(),Date.now()).filter(e=>e.delta<0&&!e.waste).reduce((s,e)=>s+Math.abs(e.delta),0).toFixed(2)); }
      // Used Today — 3-way even split: [USED TODAY] | [number field] | [TAP TO RESET]
      const adjUsageCard=document.createElement('div'); adjUsageCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const adjLeft=document.createElement('div'); adjLeft.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:#1a2a3a;border-right:3px solid #000;font-size:7px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#5A8DB8;flex-shrink:0;text-align:center;'; adjLeft.textContent='Used Today';
      const adjMid=document.createElement('div'); adjMid.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:3px solid #000;flex-shrink:0;';
      const adjRight=document.createElement('div'); adjRight.style.cssText='width:33.34%;display:flex;align-items:center;justify-content:center;background:#1a2a3a;font-size:7px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#5A8DB8;cursor:pointer;flex-shrink:0;text-align:center;'; adjRight.textContent='Tap to Reset';
      function renderAdjVal(editing){
        adjMid.innerHTML='';
        const cur=getTodayUsageSnap();
        if(editing){
          const inp=document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='0.1'; inp.value=cur||''; inp.placeholder='0'; inp.style.cssText='flex:1;width:100%;background:transparent;border:none;color:var(--color-10);font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;';
          inp.onclick=e=>e.stopPropagation();
          inp.onblur=e=>{
            const target=parseFloat(inp.value)||0;
            dlClearDay(msItem.id,'used');
            if(target>0){ const cpuArr=pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0); const cpu=cpuArr.length?cpuArr.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr.length:null; const adjCost=cpu!=null?parseFloat((target*cpu).toFixed(4)):null; dlPush(msItem.id,-target,adjCost); }
            const swEl=document.getElementById('statsWindow'); if(swEl&&swEl.style.display!=='none') renderStatsWindow();
            renderAdjVal(false);
          };
          inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } };
          adjMid.appendChild(inp); setTimeout(()=>inp.focus(),30);
        } else {
          const vEl=document.createElement('div'); vEl.style.cssText='font-size:11px;font-weight:700;color:var(--color-10);'; vEl.textContent=cur>0?cur:'—';
          adjMid.appendChild(vEl);
        }
      }
      adjRight.onclick=e=>{ e.stopPropagation(); dlClearDay(msItem.id,'used'); const swEl=document.getElementById('statsWindow'); if(swEl&&swEl.style.display!=='none') renderStatsWindow(); renderAdjVal(false); };
      renderAdjVal(false);
      adjMid.onclick=e=>{ e.stopPropagation(); renderAdjVal(true); };
      adjUsageCard.append(adjLeft,adjMid,adjRight);
      body.appendChild(adjUsageCard);

      // Added Today — identical structure, purple, positive deltas
      function getTodayAddedSnap(){ const midnight=new Date(); midnight.setHours(0,0,0,0); return parseFloat(dlGetEntriesInRange(msItem.id,midnight.getTime(),Date.now()).filter(e=>e.delta>0).reduce((s,e)=>s+e.delta,0).toFixed(2)); }
      const adjAddCard=document.createElement('div'); adjAddCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const addLeft=document.createElement('div'); addLeft.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:#221a2a;border-right:3px solid #000;font-size:7px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#8a7ca8;flex-shrink:0;text-align:center;'; addLeft.textContent='Added Today';
      const addMid=document.createElement('div'); addMid.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:3px solid #000;flex-shrink:0;';
      const addRight=document.createElement('div'); addRight.style.cssText='width:33.34%;display:flex;align-items:center;justify-content:center;background:#221a2a;font-size:7px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#8a7ca8;cursor:pointer;flex-shrink:0;text-align:center;'; addRight.textContent='Tap to Reset';
      function renderAddVal(editing){
        addMid.innerHTML='';
        const cur=getTodayAddedSnap();
        if(editing){
          const inp=document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='0.1'; inp.value=cur||''; inp.placeholder='0'; inp.style.cssText='flex:1;width:100%;background:transparent;border:none;color:var(--color-10);font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;';
          inp.onclick=e=>e.stopPropagation();
          inp.onblur=e=>{
            const target=parseFloat(inp.value)||0;
            dlClearDay(msItem.id,'added');
            if(target>0){ const cpuArr2=pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0); const cpu2=cpuArr2.length?cpuArr2.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr2.length:null; const adjCost2=cpu2!=null?parseFloat((target*cpu2).toFixed(4)):null; dlPush(msItem.id,target,adjCost2); }
            const swEl2=document.getElementById('statsWindow'); if(swEl2&&swEl2.style.display!=='none') renderStatsWindow();
            renderAddVal(false);
          };
          inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } };
          addMid.appendChild(inp); setTimeout(()=>inp.focus(),30);
        } else {
          const vEl=document.createElement('div'); vEl.style.cssText='font-size:11px;font-weight:700;color:var(--color-10);'; vEl.textContent=cur>0?cur:'—';
          addMid.appendChild(vEl);
        }
      }
      addRight.onclick=e=>{ e.stopPropagation(); dlClearDay(msItem.id,'added'); const swEl3=document.getElementById('statsWindow'); if(swEl3&&swEl3.style.display!=='none') renderStatsWindow(); renderAddVal(false); };
      renderAddVal(false);
      addMid.onclick=e=>{ e.stopPropagation(); renderAddVal(true); };
      adjAddCard.append(addLeft,addMid,addRight);
      body.appendChild(adjAddCard);

      // Wasted Today — red, same pattern as Used/Added
      function getTodayWasteSnap(){ return wlGet(msItem.id)||0; }
      const adjWasteCard=document.createElement('div'); adjWasteCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const wasteLeft=document.createElement('div'); wasteLeft.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:#2a1010;border-right:3px solid #000;font-size:7px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#C85A5A;flex-shrink:0;text-align:center;'; wasteLeft.textContent='Wasted Today';
      const wasteMid=document.createElement('div'); wasteMid.style.cssText='width:33.33%;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:3px solid #000;flex-shrink:0;';
      const wasteRight=document.createElement('div'); wasteRight.style.cssText='width:33.34%;display:flex;align-items:center;justify-content:center;background:#2a1010;font-size:7px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#C85A5A;cursor:pointer;flex-shrink:0;text-align:center;'; wasteRight.textContent='Tap to Reset';
      function renderWasteVal(editing){
        wasteMid.innerHTML='';
        const cur=getTodayWasteSnap();
        if(editing){
          const inp=document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='0.1'; inp.value=cur||''; inp.placeholder='0'; inp.style.cssText='flex:1;width:100%;background:transparent;border:none;color:var(--color-10);font-size:11px;font-weight:700;text-align:center;outline:none;font-family:inherit;';
          inp.onclick=e=>e.stopPropagation();
          inp.onblur=e=>{
            const target=parseFloat(inp.value)||0;
            let remaining=target; let prevConAmts=pd.containers.map(c=>c.amount);
            pd.containers.forEach((con,ci)=>{
              if(remaining<=0){ con.amount=prevConAmts[ci]; return; }
              const take=Math.min(con.amount,parseFloat(remaining.toFixed(1)));
              con.amount=parseFloat((con.amount-take).toFixed(1));
              remaining=parseFloat((remaining-take).toFixed(1));
            });
            wlSet(msItem.id,target);
            const dw=getPantryData(); dw[msItem.id]=pd; setPantryData(dw);
            ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
            const swEl4=document.getElementById('statsWindow'); if(swEl4&&swEl4.style.display!=='none') renderStatsWindow();
            renderWasteVal(false);
          };
          inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } };
          wasteMid.appendChild(inp); setTimeout(()=>inp.focus(),30);
        } else {
          const vEl=document.createElement('div'); vEl.style.cssText='font-size:11px;font-weight:700;color:var(--color-10);'; vEl.textContent=cur>0?cur:'—';
          wasteMid.appendChild(vEl);
        }
      }
      wasteRight.onclick=e=>{ e.stopPropagation(); wlSet(msItem.id,0); const swEl4=document.getElementById('statsWindow'); if(swEl4&&swEl4.style.display!=='none') renderStatsWindow(); renderWasteVal(false); };
      renderWasteVal(false);
      wasteMid.onclick=e=>{ e.stopPropagation(); renderWasteVal(true); };
      adjWasteCard.append(wasteLeft,wasteMid,wasteRight);
      body.appendChild(adjWasteCard);
    }
    expand.appendChild(body);
  }
  wrap._renderExpand=renderExpand;

  function revertPendingFill(){
    if(!ptOpenSet.has(msItem.id)) return;
    if(expandView.fillStart!==undefined&&selectedCon.id!==null){
      const sc=pd.containers.find(c=>c.id===selectedCon.id);
      if(sc&&sc.amount!==expandView.fillStart){ sc.amount=expandView.fillStart; const d=getPantryData(); d[msItem.id]=pd; setPantryData(d); }
    }
    expandView.fillStart=undefined; expandView.fillConId=undefined;
    ptRefreshCard(msItem,pd,wrap,selectedCon,expandView);
  }

  const closeThisCard=()=>{ if(!ptOpenSet.has(msItem.id)) return; revertPendingFill(); ptOpenSet.delete(msItem.id); expand.style.maxHeight='0'; expand.style.borderTop='none'; selectedCon.id=null; updateBtnState(); focusDimHide(); ptScrollBack(wrap._savedScrollY); wrap._savedScrollY=undefined; };
  ptCardRegistry.push({close:closeThisCard});
  wrap.classList.add('pt-card-wrap');
  main.addEventListener('click',()=>{
    if(ptOpenSet.has(msItem.id)){ closeThisCard(); }
    else { ptCardRegistry.forEach(c=>{ if(c.close!==closeThisCard) c.close(); }); ptOpenSet.add(msItem.id); expandView.mode='containers'; expandView.selBar=null; selectedCon.id=null; updateBtnState(); renderExpand(); expand.style.maxHeight='600px'; expand.style.borderTop='3px solid #000'; wrap._savedScrollY=window.scrollY; focusDimShow(wrap); trackPtInteraction(msItem.id); }
  });
  wrap.appendChild(main);
  wrap.appendChild(expand);
  return wrap;
}

const PT_CRITICAL_EMPTY_MSGS = [
  'Nothing critical. Your pantry is suspiciously well-stocked.',
  'Zero critical items. Are you okay? This is unprecedented.',
  'Critical list empty. The apocalypse is not today.',
  'All clear. Either you\'re very organized or very in denial.',
  'No critical items. The fridge would like a word though.',
  'Nothing to panic about. Statistically, this never lasts.',
  'Critical: 0. Personal best? Probably personal best.',
  'Your pantry is thriving. Sickeningly so.',
  'Nothing critical. Enjoy it. It won\'t last.',
  'All items accounted for. Whoever you are, teach us your ways.',
  'No red flags in the pantry. Plenty elsewhere, presumably.',
  'Empty critical list. You\'re either very prepared or this just refreshed.',
  'Nothing running low enough to be a problem. Today.',
  'Pantry looking healthy. Refrigerator unavailable for comment.',
  'Critical section empty. A moment of disbelief, please.',
  'You\'ve got nothing critical. That\'s either great news or a data error.',
  'Not a single critical item. The bar was low and you cleared it.',
  'All good here. The universe remains suspicious.',
  'Zero emergencies. Save this screenshot for later.',
  'Nothing critical detected. Carry on, you pantry genius.',
  'This section intentionally left empty. By you. Somehow.',
  'No critical items. Is this a simulation?',
  'Pantry status: thriving. Chef status: unknown.',
  'Zero critical. You have achieved the impossible or just restocked.',
  'Nothing to worry about here. Worry elsewhere. There\'s plenty.',
  'Critical shelf is empty. The shelves themselves, however, are not.',
  'All clear. Bask in it. Just for a moment.',
  'No items critically low. Your past self really came through.',
  'Critical items: none. Suspicious items: also none. Miraculous.',
  'Not one critical item. This is peak pantry performance.',
  'The critical zone is a ghost town today.',
  'Nothing critical. Buy a lottery ticket.',
  'Zero red alerts. The pantry gods smile upon you.',
  'Clean slate. Enjoy the calm before the soy sauce runs out.',
  'Nothing here. Either impressive or deeply suspicious.',
  'All items have acceptable levels. You did that.',
  'Not a single thing is critically low. Incredible scenes.',
  'Your pantry is operating at full capacity. Respect.',
  'Zero items in crisis. The kitchen is at peace.',
  'Nothing critical. Somewhere, a chef is weeping with joy.',
  'Pantry morale: high. Critical count: zero.',
  'Empty here. As it should be, ideally, always, forever.',
  'No critical items. History will remember this day.',
  'You\'ve got nothing critical. Genuinely impressive.',
  'This is what peak performance looks like apparently.',
  'Nothing critical. Light a candle. Say a prayer. It could change.',
  'Zero emergencies detected. Scanners are functioning correctly.',
  'Critical list: empty. Grocery list: probably not. Balance.',
  'Nothing critical. Don\'t get cocky. The olive oil is watching.',
  'All items holding. For now. For now.',
];
let ptLastCriticalMsgIdx = -1;
function ptGetCriticalMsg(){
  let idx; do { idx = Math.floor(Math.random() * PT_CRITICAL_EMPTY_MSGS.length); } while(idx === ptLastCriticalMsgIdx && PT_CRITICAL_EMPTY_MSGS.length > 1);
  ptLastCriticalMsgIdx = idx;
  return PT_CRITICAL_EMPTY_MSGS[idx];
}

/* ── Pantry search ── */
let ptQuickAddState=null;
let ptQuickAddName='';
let ptQuickAddCat=null;
let ptQuickAddUnit=null;
let ptSearchIdleTimer=null;
let ptThinkPhraseSet=false;
let ptCurrentThinkPhrase=null;
let ptThinkCardEl=null;

function ptPickNextThinkPhrase(){
  const available=MS_THINK_PHRASES.filter(p=>p!==ptCurrentThinkPhrase);
  ptCurrentThinkPhrase=available[Math.floor(Math.random()*available.length)];
  ptThinkCardEl=null;
}

function ptGetOrCreateThinkCard(){
  if(ptThinkCardEl) return ptThinkCardEl;
  const card=document.createElement('div');
  card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
  const txt=document.createElement('div');
  txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;';
  const phraseText=ptCurrentThinkPhrase.replace(/[.…]+$/,'');
  txt.innerHTML=phraseText+'<span class="thinking-dots" style="font-style:normal;margin-left:1px;"><span>.</span><span>.</span><span>.</span></span>';
  card.appendChild(txt); ptThinkCardEl=card; return card;
}

function ptSearchInput(){
  clearTimeout(ptSearchIdleTimer);
  const q=(document.getElementById('ptSearch')?.value||'').trim();
  if(!q){
    ptThinkPhraseSet=false; ptQuickAddState=null; ptQuickAddName=''; ptThinkCardEl=null;
    ptShowSearchMode(false); return;
  }
  if(ptQuickAddState && ptQuickAddState!=='pick-cat' && ptQuickAddState!=='pick-unit'){
    ptQuickAddState=null; ptThinkCardEl=null; ptPickNextThinkPhrase();
  }
  if(!ptThinkPhraseSet){ ptPickNextThinkPhrase(); ptThinkPhraseSet=true; }
  ptShowSearchMode(true, q);
  ptSearchIdleTimer=setTimeout(()=>{
    const allItems=ls('ms_items',[]);
    const qLower=q.toLowerCase().trim();
    const exists=allItems.some(i=>i.name.toLowerCase().trim()===qLower);
    ptQuickAddState=exists?'found':'confirm';
    ptQuickAddName=q;
    ptRenderThinkSlot(q);
  },2000);
}

// show/hide search mode without rebuilding DOM
function ptShowSearchMode(searching, q){
  const page=document.getElementById('pagePantry');
  const viewTog=page.querySelector('.pt-view-toggle');
  const filterBar=page.querySelector('.pt-filter-bar');
  const itemsWrap=page.querySelector('.pt-items-wrap');
  if(!searching){
    if(viewTog) viewTog.style.display='';
    if(filterBar) filterBar.style.display='';
    if(itemsWrap) itemsWrap.style.display='';
    const slot=document.getElementById('ptThinkSlot'); if(slot) slot.innerHTML='';
    return;
  }
  if(viewTog) viewTog.style.display='none';
  if(filterBar) filterBar.style.display='none';

  // update think slot — show thinking card immediately
  ptRenderThinkSlot(q);

  if(itemsWrap){
    itemsWrap.innerHTML='';
    itemsWrap.style.cssText='display:flex;flex-direction:column;gap:4px;';
    const allItems=ls('ms_items',[]);
    const qLower=(q||'').toLowerCase();
    const matches=allItems.filter(i=>{
      const words=i.name.toLowerCase().split(/\s+/);
      return words.some(w=>w.startsWith(qLower));
    });
    if(matches.length===0){ itemsWrap.style.display='none'; }
    else { matches.forEach(item=>itemsWrap.appendChild(ptBuildCard(item))); }
  }
}

function ptRenderThinkSlot(q){
  const slot=document.getElementById('ptThinkSlot'); if(!slot) return;
  const items=ls('ms_items',[]);
  slot.innerHTML='';
  if(!q){ return; }
  if(!ptQuickAddState){
    slot.appendChild(ptGetOrCreateThinkCard()); return;
  }
  if(ptQuickAddState==='success'){
    const card=document.createElement('div'); card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
    const txt=document.createElement('div'); txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
    txt.textContent=MS_SUCCESS_PHRASES[Math.floor(Math.random()*MS_SUCCESS_PHRASES.length)]; card.appendChild(txt); slot.appendChild(card); return;
  }
  if(ptQuickAddState==='found'){
    const card=document.createElement('div'); card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
    const txt=document.createElement('div'); txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
    txt.textContent=MS_FOUND_PHRASES[Math.floor(Math.random()*MS_FOUND_PHRASES.length)]; card.appendChild(txt); slot.appendChild(card); return;
  }
  if(ptQuickAddState==='confirm'){
    const card=document.createElement('div'); card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
    const txt=document.createElement('div'); txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-10);';
    txt.textContent=`Add "${q}"?`;
    const yesBtn=document.createElement('div'); yesBtn.style.cssText='width:56px;min-width:56px;background:#1d3f5c;border-left:3px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;cursor:pointer;';
    yesBtn.textContent='YES!'; yesBtn.onclick=e=>{ e.stopPropagation(); openNewItemOverlay(q||ptQuickAddName, newItem=>{ ptQuickAddState='success'; ptQuickAddName=''; ptRender(); ptShowSearchMode(true,(document.getElementById('ptSearch')?.value||'').trim()); }); };
    card.append(txt,yesBtn); slot.appendChild(card); return;
  }
  if(ptQuickAddState==='pick-cat'){
    const card=document.createElement('div'); card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
    const txt=document.createElement('div'); txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-10);'; txt.textContent='Pick a category...';
    const btn=document.createElement('div'); btn.style.cssText='width:72px;min-width:72px;background:#1d442d;border-left:3px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;cursor:pointer;'; btn.textContent='OK!'; btn.onclick=e=>{ e.stopPropagation(); ptOpenCatModal(); };
    card.append(txt,btn); slot.appendChild(card); return;
  }
  if(ptQuickAddState==='pick-unit'){
    const card=document.createElement('div'); card.style.cssText=`height:32px;display:flex;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`;
    const txt=document.createElement('div'); txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-10);'; txt.textContent='Pick a unit...';
    const btn=document.createElement('div'); btn.style.cssText='width:72px;min-width:72px;background:#3d1a5c;border-left:3px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;cursor:pointer;'; btn.textContent='OF COURSE!'; btn.onclick=e=>{ e.stopPropagation(); ptOpenUnitModal(); };
    card.append(txt,btn); slot.appendChild(card); return;
  }
}

function ptOpenCatModal(){
  modalCtx='pt-quickadd-cat'; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
  document.getElementById('modalTitle').textContent='Category';
  buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
}

function ptOpenUnitModal(){
  modalCtx='pt-quickadd-unit'; modalSelPend=null; modalDelPend.clear();
  document.getElementById('modalTitle').textContent='Unit';
  buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
}

function ptQuickAddFinalise(){
  if(!ptQuickAddName||!ptQuickAddCat||!ptQuickAddUnit) return;
  const newItem={id:'ms_'+Date.now()+Math.random(),name:ptQuickAddName,category:ptQuickAddCat,unit:ptQuickAddUnit};
  const ms=ls('ms_items',[]); ms.push(newItem); lsSet('ms_items',ms);
  ptQuickAddState='success'; ptQuickAddName=''; ptQuickAddCat=null; ptQuickAddUnit=null;
  ptThinkPhraseSet=false; ptThinkCardEl=null;
  const q=(document.getElementById('ptSearch')?.value||'').trim();
  ptRender();
  if(q){ ptRenderThinkSlot(q); ptShowSearchMode(true,q); }
  msRender();
}

function ptRender(){
  ptCardRegistry=[];
  ptApplyFilter();
  const page=document.getElementById('pagePantry');
  // preserve search wrap and think slot, clear only content below
  const searchWrap=page.querySelector('.ms-search-wrap');
  const thinkSlot=page.querySelector('#ptThinkSlot');
  page.innerHTML='';
  if(searchWrap) page.appendChild(searchWrap);
  if(thinkSlot){ page.appendChild(thinkSlot); const q=(document.getElementById('ptSearch')?.value||'').trim(); ptRenderThinkSlot(q); }
  else { const ts=document.createElement('div'); ts.id='ptThinkSlot'; page.appendChild(ts); }

  const msItems=ls('ms_items',[]);
  if(msItems.length===0){ const empty=document.createElement('div'); empty.style.cssText='display:flex;align-items:center;justify-content:center;padding:40px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;text-align:center;'; empty.textContent='No items in My Store yet. Add items there to track them here.'; page.appendChild(empty); return; }
  const q=(document.getElementById('ptSearch')?.value||'').trim();
  if(!q){
    const tog=ptBuildViewToggle(); tog.className+=' pt-view-toggle'; page.appendChild(tog);
    const fb=ptBuildFilterBar(); page.appendChild(fb);
  }
  if(ptFilterSnapshot.length===0 && !q){
    const empty=document.createElement('div');
    empty.style.cssText='display:flex;align-items:center;justify-content:center;padding:20px 16px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;text-align:center;border:3px solid #000;border-radius:8px;background:var(--bg-2);';
    empty.textContent=ptActiveFilter==='low' ? ptGetCriticalMsg() : 'No items in this category';
    page.appendChild(empty); return;
  }
  if(q) return;
  const itemsWrap=document.createElement('div'); itemsWrap.className='pt-items-wrap'; itemsWrap.style.cssText='display:flex;flex-direction:column;gap:4px;';
  const rawCats=[...new Set(ptFilterSnapshot.map(i=>i.category))];
  const cats=ptSmartSortCats(rawCats, ptFilterSnapshot);
  const renderQueue=[];
  cats.forEach(catId=>{ const catItems=ptSmartSortItems(ptFilterSnapshot.filter(i=>i.category===catId)); const cat=getCat(catId); renderQueue.push(['cat',cat]); catItems.forEach(item=>renderQueue.push(['item',item])); });
  page.appendChild(itemsWrap); // append immediately — no blank-out
  ptRender._token=(ptRender._token||0)+1; const myToken=ptRender._token;
  let rqIdx=0;
  function renderChunk(){
    if(ptRender._token!==myToken) return; // cancelled by a newer ptRender call
    const end=Math.min(rqIdx+8, renderQueue.length);
    for(;rqIdx<end;rqIdx++){
      const [type,data]=renderQueue[rqIdx];
      if(type==='cat') itemsWrap.appendChild(ptDivider(data.label,data.color));
      else itemsWrap.appendChild(ptBuildCard(data));
    }
    if(rqIdx<renderQueue.length){ requestAnimationFrame(renderChunk); }
    else if(ptActiveFilter==='onhand'){ page.appendChild(ptBuildWorthCard()); }
  }
  requestAnimationFrame(renderChunk);
}

function ptCalcWorth(){
  let totalCost=0, itemCount=0;
  ptFilterSnapshot.forEach(item=>{
    const pd=getItemPantry(item.id);
    const hasStock=pd.containers.some(con=>con.amount>0);
    if(!hasStock) return;
    itemCount++;
    pd.containers.forEach(con=>{
      if(con.amount>0&&!con.free&&con.price!=null&&con.cap>0)
        totalCost+=parseFloat(((con.amount/con.cap)*con.price).toFixed(4));
    });
  });
  return {totalCost, itemCount};
}

function ptBuildWorthCard(){
  const {totalCost, itemCount}=ptCalcWorth();
  const worth=document.createElement('div');
  worth.id='ptWorthCard';
  worth.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;height:var(--card-h);margin-top:8px;background:var(--bg-2);';
  const left=document.createElement('div');
  left.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;';
  const leftLbl=document.createElement('div'); leftLbl.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);';
  leftLbl.textContent='On Hand';
  const leftVal=document.createElement('div'); leftVal.id='ptWorthCount'; leftVal.style.cssText='font-size:22px;font-weight:700;color:#fff;line-height:1;';
  leftVal.textContent=itemCount;
  left.append(leftLbl,leftVal);
  const divider=document.createElement('div');
  divider.style.cssText='width:var(--border-width);background:var(--border-color);align-self:stretch;flex-shrink:0;';
  const right=document.createElement('div');
  right.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;';
  const rightLbl=document.createElement('div'); rightLbl.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);';
  rightLbl.textContent='Worth';
  const rightVal=document.createElement('div'); rightVal.id='ptWorthVal'; rightVal.style.cssText='font-size:22px;font-weight:700;color:#48a971;line-height:1;letter-spacing:-0.02em;';
  rightVal.textContent=totalCost>0?'$'+totalCost.toFixed(2):'—';
  right.append(rightLbl,rightVal);
  worth.append(left,divider,right);
  return worth;
}

function ptRefreshWorthCard(){
  if(ptActiveFilter!=='onhand') return;
  const existing=document.getElementById('ptWorthCard');
  if(!existing) return;
  const {totalCost,itemCount}=ptCalcWorth();
  const cv=document.getElementById('ptWorthCount'); if(cv) cv.textContent=itemCount;
  const vv=document.getElementById('ptWorthVal'); if(vv) vv.textContent=totalCost>0?'$'+totalCost.toFixed(2):'—';
}

// Backfill snapshots for days missed since last open
function ptBackfillSnapshots(){
  const pantryData=getPantryData();
  const snaps=ptGetSnapshots();
  const today=ptDateKey();
  const todayDate=new Date(); todayDate.setHours(0,0,0,0);
  const yesterdayMs=todayDate.getTime()-1; // just before today midnight

  Object.entries(pantryData).forEach(([id,pd])=>{
    if(!pd||!pd.containers) return;
    const currentStock=ptGetStock(pd);
    const allDates=Object.keys(snaps).sort();
    const lastDate=allDates.filter(d=>snaps[d]&&snaps[d][id]!==undefined).pop();

    if(!lastDate){
      // no history at all — just seed today
      if(!snaps[today]) snaps[today]={};
      snaps[today][id]=currentStock;
      return;
    }

    const lastVal=snaps[lastDate][id];
    // fill missing days from day after lastDate UP TO AND INCLUDING yesterday
    let d=new Date(lastDate+'T00:00:00'); d.setDate(d.getDate()+1);
    while(d.getTime()<=yesterdayMs){
      const key=ptDateKey(d);
      if(!snaps[key]) snaps[key]={};
      if(snaps[key][id]===undefined) snaps[key][id]=lastVal;
      d.setDate(d.getDate()+1);
    }

    // today always gets current live stock (overwrite if stale)
    if(!snaps[today]) snaps[today]={};
    snaps[today][id]=currentStock;
  });
  lsSet('pantry_snapshots',snaps);
}
ptBackfillSnapshots();

glRender(); csRender(); msRender();

/* ══════════════════════════════════════
   RECIPES & MEALS
══════════════════════════════════════ */

