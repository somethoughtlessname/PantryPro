/* ── PANTRY PRO · pantry.js ───────────────────────────────────────────
   My Pantry tab: state, card builder, containers, stats math,
   delta log, snapshots, backfill, search, stats window rendering,
   history window.
   Depends on: app.js, tabs.js
── */

let ptActiveFilter='all';
let ptViewMode='pantry';
let ptFilterSnapshot=[];
let ptCardRegistry=[];
let ptOpenSet=new Set();

function ptIsInPantry(item){
  const pd=getItemPantry(item.id);
  if(pd.containers.length>0) return true;
  const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
  return ls('pantry_usage_log',[]).some(e=>e.id===item.id&&e.ts>=thirtyDaysAgo);
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

function saveItemPantry(id,pd,prevStock,cost){
  ptRecordCurrent(id,pd,prevStock); // pass prevStock so snapshot captures pre-change stock
  if(prevStock!==undefined){
    const newStock=ptGetStock(pd);
    ptLogDelta(id,parseFloat((newStock-prevStock).toFixed(3)),cost!=null?parseFloat(cost.toFixed(4)):null);
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
function ptLogDelta(id,delta,cost){
  if(delta===0) return;
  const entry={id,delta:parseFloat(delta.toFixed(3)),ts:Date.now()};
  if(cost!=null) entry.cost=cost;
  const log=ls('pantry_delta_log',[]); log.push(entry); lsSet('pantry_delta_log',log);
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
  const log=ls('pantry_delta_log',[]).filter(e=>e.id===id&&(dir==='used'?e.delta<0:e.delta>0));
  const now=new Date(); const values=new Array(12).fill(0);
  if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    log.forEach(e=>{
      const d=new Date(e.ts);
      weeks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) values[i]+=Math.abs(e.delta); });
    });
  } else {
    log.forEach(e=>{
      const d=new Date(e.ts);
      if(mode==='daily'){
        const diffDays=Math.round((new Date(now.getFullYear(),now.getMonth(),now.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
        const idx=11-diffDays; if(idx>=0&&idx<=11) values[idx]+=Math.abs(e.delta);
      } else {
        const diffMonths=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
        const idx=11-diffMonths; if(idx>=0&&idx<=11) values[idx]+=Math.abs(e.delta);
      }
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
  const log=ls('pantry_delta_log',[]).filter(e=>e.id===id&&e.delta<0&&e.cost!=null);
  const now=new Date(); const values=new Array(12).fill(0);
  if(mode==='weekly'){
    const weeks=ptGet12Weeks(now);
    log.forEach(e=>{
      const d=new Date(e.ts);
      weeks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) values[i]+=e.cost; });
    });
  } else {
    log.forEach(e=>{
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

function ptFillColor(pd){ const st=ptGetStatus(pd); if(st==='ok') return '#48a971'; if(st==='partial') return '#C7824A'; if(st==='soon') return '#5A8DB8'; return '#C85A5A'; }
function ptConFillColor(con){ const ratio=con.cap>0?con.amount/con.cap:0; if(ratio<=1/6) return '#C85A5A'; if(ratio<=1/3) return '#5A8DB8'; return '#48a971'; }
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
    {key:'partial', label:'Partial', count:partial, color:'#C7824A',  show:ptViewMode==='pantry'&&en.partial},
    {key:'soon',    label:'Low',     count:soon,    color:'#5A8DB8',  show:ptViewMode==='pantry'&&en.low},
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
    const usedRecently=ls('pantry_usage_log',[]).some(e=>e.id===msItem.id&&e.ts>=thirtyDaysAgo);
    wrap._redTint.style.display=(ptGetStock(pd)===0&&(usedRecently||pd.containers.length>0))?'':'none';
  }
  const fb=document.querySelector('.pt-filter-bar'); if(fb){ const nfb=ptBuildFilterBar(); nfb.className='pt-filter-bar'; fb.replaceWith(nfb); }
  wrap._renderExpand();
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

  minBtn.onclick=e=>{ e.stopPropagation(); if(!selectedCon.id) return; const con=pd.containers.find(c=>c.id===selectedCon.id); if(!con) return; const prevS=ptGetStock(pd); const prev=con.amount; con.amount=Math.max(0,parseFloat((con.amount-pd.step).toFixed(1))); const used=prev-con.amount; if(used>0) trackPtUsage(msItem.id,used); const conCost=(!con.free&&con.price!=null&&con.cap>0)?(used/con.cap)*con.price:null; saveItemPantry(msItem.id,pd,prevS,conCost); if(con.amount===0&&prev>0) con._confirmEmpty=true; trackPtInteraction(msItem.id); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); };
  plusBtn.onclick=e=>{ e.stopPropagation(); if(!selectedCon.id) return; const con=pd.containers.find(c=>c.id===selectedCon.id); if(!con) return; const prevS=ptGetStock(pd); const prevConAmt=con.amount; con.amount=Math.min(con.cap,parseFloat((con.amount+pd.step).toFixed(1))); const addedAmt=con.amount-prevConAmt; const plusCost=(!con.free&&con.price!=null&&con.cap>0&&addedAmt>0)?(addedAmt/con.cap)*con.price:null; saveItemPantry(msItem.id,pd,prevS,plusCost); trackPtInteraction(msItem.id); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); };

  const center=document.createElement('div');
  center.style.cssText='flex:1;height:32px;min-height:32px;max-height:32px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#374151;';
  const fc=ptFillColor(pd); const vMax=Math.max(ptGetMax(pd),ptGetStock(pd))||1;
  const thirtyDaysAgo=Date.now()-(30*24*60*60*1000);
  const usedRecently=ls('pantry_usage_log',[]).some(e=>e.id===msItem.id&&e.ts>=thirtyDaysAgo);
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
  wrap._fillBase=fillBase; wrap._fillOver=fillOver; wrap._val=val;
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
    [['stats','Stats'],['containers','Containers'],['adjust','Adjust']].forEach(([mode,label],i,arr)=>{
      const t=document.createElement('div'); const isAct=expandView.mode===mode;
      t.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-3)'};color:${isAct?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:3px solid #000;':''}`;
      t.textContent=label; t.onclick=e=>{ e.stopPropagation(); expandView.mode=mode; renderExpand(); }; tabs.appendChild(t);
    }); body.appendChild(tabs);

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
        const lg=ls('pantry_delta_log',[]).filter(e=>e.id===id&&e.delta>0&&e.cost!=null);
        const v=new Array(12).fill(0);
        if(mode==='weekly'){ const wks=ptGet12Weeks(now2); lg.forEach(e=>{ const d=new Date(e.ts); wks.forEach((w,i)=>{ if(d>=w.start&&d<=w.end) v[i]+=e.cost; }); }); }
        else { lg.forEach(e=>{ const d=new Date(e.ts); const diff=(now2.getFullYear()-d.getFullYear())*12+(now2.getMonth()-d.getMonth()); const idx=11-diff; if(idx>=0&&idx<=11) v[idx]+=e.cost; }); }
        return v.map(x=>parseFloat(x.toFixed(2)));
      }

      const gCard=document.createElement('div'); gCard.style.cssText=`border:3px solid #000;border-radius:8px;overflow:hidden;background:var(--bg-3);flex-shrink:0;`;
      const hdr=document.createElement('div'); hdr.style.cssText='height:24px;display:flex;align-items:stretch;border-bottom:3px solid #000;flex-shrink:0;';
      [['used','Used'],['added','Added'],['stock','Stock']].forEach(([v,lbl],idx)=>{ const isAct=statSubView===v; const btn=document.createElement('div'); btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;background:${isAct?'var(--bg-4)':'var(--bg-2)'};color:${isAct?'var(--color-10)':'var(--muted)'};${idx<2?'border-right:3px solid #000;':''}`; btn.textContent=lbl; btn.onclick=e=>{ e.stopPropagation(); expandView.statSubView=v; renderExpand(); }; hdr.appendChild(btn); });
      gCard.appendChild(hdr);

      let displayVals, barLabels;
      let usedTotal=0,usedCostTotal=0,addedTotal=0,addedCostTotal=0;

      if(sv==='daily'){
        const allUsed=ptGetStatsValues(msItem.id,'daily');
        const allAdded=ptGetStatsValues(msItem.id,'daily','added');
        const allStock=ptGetStockEndValues(msItem.id,'daily');
        const allCosts=ptGetStatsCosts(msItem.id,'daily');
        const allAddedCosts=calcAddedCosts(msItem.id,'daily');
        function mapWeek(arr){ return weekDays.map(d=>{ const diff=Math.round((new Date(now2.getFullYear(),now2.getMonth(),now2.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5); const idx=11-diff; return (idx>=0&&idx<=11)?arr[idx]:null; }); }
        function mapWeekNum(arr){ return mapWeek(arr).map(v=>v!=null?v:0); }
        const weekUsed=mapWeekNum(allUsed); const weekAdded=mapWeekNum(allAdded);
        const weekStock=mapWeek(allStock); const weekCosts=mapWeekNum(allCosts);
        const weekAddedCosts=mapWeekNum(allAddedCosts);
        const weekStockNum=weekStock.map(v=>v!=null?v:0);
        displayVals=statSubView==='used'?weekUsed:statSubView==='added'?weekAdded:weekStockNum;
        barLabels=WEEK_LETTERS;
        usedTotal=weekUsed.reduce((s,v)=>s+v,0); usedCostTotal=weekCosts.reduce((s,v)=>s+v,0);
        addedTotal=weekAdded.reduce((s,v)=>s+v,0); addedCostTotal=weekAddedCosts.reduce((s,v)=>s+v,0);

        const maxV=Math.max(...displayVals.map(v=>v||0),0.1);
        const graph=document.createElement('div'); graph.className='pt-graph';
        displayVals.forEach((u,i)=>{
          const isToday=i===todayWeekIdx; const isSel=sb===i; const bw=document.createElement('div'); bw.className='pt-bar-wrap';
          const num=document.createElement('div'); num.style.cssText=`font-size:5px;font-weight:700;color:${isSel?'#fff':'rgba(255,255,255,0.5)'};margin-bottom:1px;`; num.textContent=u>0?u:'';
          const bar=document.createElement('div'); bar.className='pt-bar'; bar.style.cssText=`height:${Math.max(2,Math.round(((u||0)/maxV)*36))}px;background:${u>0?'#48a971':'rgba(255,255,255,0.08)'};opacity:${isSel?1:0.6};${isSel?'outline:2px solid rgba(255,255,255,0.6);outline-offset:-1px;':''}`;
          const day=document.createElement('div'); day.className='pt-day'; day.style.cssText=`color:${isToday?'#48a971':(isSel?'#fff':'')};font-weight:${isToday?'900':'600'};`; day.textContent=barLabels[i];
          bw.append(num,bar,day); bw.onclick=e=>{ e.stopPropagation(); expandView.selBar=expandView.selBar===i?null:i; renderExpand(); }; graph.appendChild(bw);
        }); gCard.appendChild(graph);

        const foot=document.createElement('div'); foot.style.cssText='height:32px;border-top:3px solid #000;display:flex;align-items:stretch;';
        const leftEl=document.createElement('div'); leftEl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:8px;font-weight:600;color:var(--muted);border-right:3px solid #000;padding:0 8px;text-align:center;';
        const midEl=document.createElement('div'); midEl.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:10px;font-weight:800;color:#48a971;padding:0 8px;${statSubView!=='stock'?'border-right:3px solid #000;':''}`;
        const costEl=document.createElement('div'); costEl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:10px;font-weight:800;color:#48a971;padding:0 8px;';
        if(sb!==null&&sb!==undefined){
          const wd=weekDays[sb]; leftEl.textContent=wd?wd.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'';
          const u=displayVals[sb]||0; midEl.textContent=parseFloat(u.toFixed(2))+' '+getUnitDisplay(_ptUnitId,u);
          const c=statSubView==='used'?weekCosts[sb]:statSubView==='added'?weekAddedCosts[sb]:0; costEl.textContent=c>0?'$'+parseFloat(c.toFixed(2)):'';
        } else {
          leftEl.textContent='This Week';
          const dispT=statSubView==='used'?usedTotal:statSubView==='added'?addedTotal:(weekStock[todayWeekIdx]||0);
          midEl.textContent=parseFloat(dispT.toFixed(1))+' '+getUnitDisplay(_ptUnitId,dispT);
          const dispC=statSubView==='used'?usedCostTotal:statSubView==='added'?addedCostTotal:0; costEl.textContent=dispC>0?'$'+parseFloat(dispC.toFixed(2)):'';
        }
        if(statSubView==='stock'){ foot.append(leftEl,midEl); } else { foot.append(leftEl,midEl,costEl); }
        gCard.appendChild(foot);

      } else {
        // weekly / monthly — 12 bars
        const labels12=sv==='weekly'?ptGet12Weeks(now2).map(w=>w.label):Array.from({length:12},(_,i)=>{ const d=new Date(now2.getFullYear(),now2.getMonth()-(11-i),1); return MONTH_LETTERS[d.getMonth()]; });
        const vals12=ptGetStatsValues(msItem.id,sv);
        const added12=ptGetStatsValues(msItem.id,sv,'added');
        const costs12=ptGetStatsCosts(msItem.id,sv);
        const addedCosts12=calcAddedCosts(msItem.id,sv);
        const stock12=ptGetStockEndValues(msItem.id,sv);
        const display12=statSubView==='used'?vals12:statSubView==='added'?added12:stock12.map(v=>v!=null?v:0);
        const maxV2=Math.max(...display12,0.1);
        usedTotal=vals12.reduce((s,v)=>s+v,0); usedCostTotal=costs12.reduce((s,v)=>s+v,0);
        addedTotal=added12.reduce((s,v)=>s+v,0); addedCostTotal=addedCosts12.reduce((s,v)=>s+v,0);

        const graph=document.createElement('div'); graph.className='pt-graph';
        display12.forEach((u,i)=>{
          const isSel=sb===i; const bw=document.createElement('div'); bw.className='pt-bar-wrap';
          const num=document.createElement('div'); num.style.cssText=`font-size:5px;font-weight:700;color:${isSel?'#fff':'rgba(255,255,255,0.5)'};margin-bottom:1px;`; num.textContent=u>0?u:'';
          const bar=document.createElement('div'); bar.className='pt-bar'; bar.style.cssText=`height:${Math.max(2,Math.round((u/maxV2)*36))}px;background:${u>0?'#48a971':'rgba(255,255,255,0.08)'};opacity:${isSel?1:0.6};${isSel?'outline:2px solid rgba(255,255,255,0.6);outline-offset:-1px;':''}`;
          const day=document.createElement('div'); day.className='pt-day'; day.style.color=isSel?'#fff':''; day.textContent=labels12[i];
          bw.append(num,bar,day); bw.onclick=e=>{ e.stopPropagation(); expandView.selBar=expandView.selBar===i?null:i; renderExpand(); }; graph.appendChild(bw);
        }); gCard.appendChild(graph);

        const foot=document.createElement('div'); foot.style.cssText='height:32px;border-top:3px solid #000;display:flex;align-items:stretch;';
        const leftEl=document.createElement('div'); leftEl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:8px;font-weight:600;color:var(--muted);border-right:3px solid #000;padding:0 8px;text-align:center;';
        const midEl=document.createElement('div'); midEl.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:10px;font-weight:800;color:#48a971;padding:0 8px;${statSubView!=='stock'?'border-right:3px solid #000;':''}`;
        const costEl=document.createElement('div'); costEl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:10px;font-weight:800;color:#48a971;padding:0 8px;';
        if(sb!==null&&sb!==undefined){
          let rt='';
          if(sv==='weekly'){ const w=ptGet12Weeks(now2)[sb]; rt=w.start.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+new Date(w.end.getFullYear(),w.end.getMonth(),w.end.getDate()).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
          else { const d=new Date(now2.getFullYear(),now2.getMonth()-(11-sb),1); rt=d.toLocaleDateString('en-US',{month:'short',year:'numeric'}); }
          const u=display12[sb]; midEl.textContent=parseFloat(u.toFixed(2))+' '+getUnitDisplay(_ptUnitId,u);
          const c=statSubView==='used'?costs12[sb]:statSubView==='added'?addedCosts12[sb]:0;
          leftEl.textContent=rt; costEl.textContent=c>0?'$'+parseFloat(c.toFixed(2)):'';
        } else {
          leftEl.textContent=statSubView==='stock'?(sv==='weekly'?'12 Weeks':'12 Months'):(sv==='weekly'?'12 Week Total':'12 Month Total');
          const dispT=statSubView==='used'?usedTotal:statSubView==='added'?addedTotal:(stock12[11]!=null?stock12[11]:0);
          midEl.textContent=parseFloat(dispT.toFixed(1))+' '+getUnitDisplay(_ptUnitId,dispT);
          const dispC=statSubView==='used'?usedCostTotal:statSubView==='added'?addedCostTotal:0; costEl.textContent=dispC>0?'$'+parseFloat(dispC.toFixed(2)):'';
        }
        if(statSubView==='stock'){ foot.append(leftEl,midEl); } else { foot.append(leftEl,midEl,costEl); }
        gCard.appendChild(foot);
      }

      body.appendChild(gCard);
      const tog=document.createElement('div'); tog.style.cssText=`height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;`;
      [['daily','Daily'],['weekly','Weekly'],['monthly','Monthly']].forEach(([v,lbl],i,arr)=>{ const btn=document.createElement('div'); const act=sv===v; btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;background:${act?'var(--bg-4)':'var(--bg-3)'};color:${act?'var(--color-10)':'var(--muted)'};${i<arr.length-1?'border-right:3px solid #000;':''}`;
      btn.textContent=lbl; btn.onclick=e=>{ e.stopPropagation(); expandView.statView=v; expandView.selBar=null; renderExpand(); }; tog.appendChild(btn); }); body.appendChild(tog);

      // View History card
      const histBtn=document.createElement('div'); histBtn.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:var(--bg-4);';
      const histLbl=document.createElement('div'); histLbl.style.cssText='font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-10);'; histLbl.textContent='View History';
      histBtn.appendChild(histLbl);
      histBtn.onclick=e=>{ e.stopPropagation(); openPantryHistoryWindow(msItem,pd,wrap,selectedCon,expandView); };
      body.appendChild(histBtn);

    } else if(expandView.mode==='containers'){
      const selCon=selectedCon.id?pd.containers.find(c=>c.id===selectedCon.id):null;
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
            const vM=Math.max(con.cap,con.amount)||1; const cPct=(con.amount/vM*100).toFixed(1);
            const card=document.createElement('div'); card.style.cssText=`flex:1;height:var(--card-height);border:3px solid ${isSel?'#fff':'#000'};border-radius:8px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;min-width:0;`;
            const fill=document.createElement('div'); fill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${cPct}%;background:${ptConFillColor(con)};opacity:0.3;transition:width 0.3s;pointer-events:none;`;
            const inner=document.createElement('div'); inner.style.cssText='position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:100%;padding:0 4px;box-sizing:border-box;';
            const nmEl=document.createElement('div'); nmEl.style.cssText='font-size:9px;font-weight:800;color:#fff;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center;line-height:1.1;'; nmEl.textContent=(con.label||'Container').toUpperCase();
            const amtEl=document.createElement('div'); amtEl.style.cssText='font-size:8px;font-weight:700;color:rgba(255,255,255,0.7);text-align:center;letter-spacing:0.06em;line-height:1.1;'; amtEl.textContent=`${con.amount} / ${con.cap}`;
            const prEl=document.createElement('div'); prEl.style.cssText='text-align:center;';
            if(con.free){ prEl.style.cssText+='font-size:9px;font-weight:800;color:#48a971;'; prEl.textContent='FREE'; prEl.style.textTransform='uppercase'; }
            else if(con.price!=null){ const ppu=con.cap>0?(con.price/con.cap).toFixed(2):'?'; prEl.style.cssText+='font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);'; prEl.textContent=('$'+ppu+'/'+(pd.unit||'unit')).toUpperCase(); }
            else { prEl.style.cssText+='font-size:9px;font-weight:700;color:#C85A5A;'; prEl.textContent='NO PRICE'; }
            inner.append(nmEl,amtEl,prEl);
            card.append(fill,inner);
            card.onclick=e=>{ e.stopPropagation(); selectedCon.id=selectedCon.id===con.id?null:con.id; updateBtnState(); renderExpand(); };
            if(con._confirmEmpty) pendingConfirm=con;
            rowEl.appendChild(card);
          });
          body.appendChild(rowEl);
        });
        if(pendingConfirm){ const con=pendingConfirm; const conf=document.createElement('div'); conf.style.cssText=`height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;`; const msg=document.createElement('div'); msg.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:#e08080;background:#2a1010;'; msg.textContent='Container empty?'; const yBtn=document.createElement('div'); yBtn.style.cssText='width:48px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;background:#502424;color:#fff;cursor:pointer;border-left:3px solid #000;'; yBtn.textContent='YES'; yBtn.onclick=e=>{ e.stopPropagation(); con._confirmEmpty=false; con._isEmptyChoice=true; saveItemPantry(msItem.id,pd); renderExpand(); }; const nBtn=document.createElement('div'); nBtn.style.cssText='width:48px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;background:#1d442d;color:#fff;cursor:pointer;border-left:3px solid #000;'; nBtn.textContent='NO'; nBtn.onclick=e=>{ e.stopPropagation(); con.amount=pd.step; con._confirmEmpty=false; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; conf.append(msg,yBtn,nBtn); body.appendChild(conf); }
        pd.containers.filter(c=>c._isEmptyChoice).forEach(con=>{ const ch=document.createElement('div'); ch.style.cssText=`border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`; const bR=document.createElement('div'); bR.style.cssText='height:32px;display:flex;align-items:stretch;'; const dBtn=document.createElement('div'); dBtn.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#502424;color:#fff;cursor:pointer;border-right:3px solid #000;'; dBtn.textContent='Delete Container'; dBtn.onclick=e=>{ e.stopPropagation(); pd.containers=pd.containers.filter(c=>c.id!==con.id); if(selectedCon.id===con.id) selectedCon.id=null; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; const kBtn=document.createElement('div'); kBtn.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#1d3318;color:#48a971;cursor:pointer;'; kBtn.textContent='Keep Empty'; kBtn.onclick=e=>{ e.stopPropagation(); con._isEmptyChoice=false; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; bR.append(dBtn,kBtn); ch.append(bR); body.appendChild(ch); });
      }
      // fraction card
      const fracColors={2:'#5A8DB8',3:'#8a7ca8',4:'#5A8DB8',5:'#48a971',8:'#C7824A'};
      const fracs=[{n:1,d:8},{n:1,d:5},{n:1,d:4},{n:1,d:3},{n:3,d:8},{n:2,d:5},{n:1,d:2},{n:3,d:5},{n:5,d:8},{n:2,d:3},{n:3,d:4},{n:4,d:5},{n:7,d:8}];
      const selCon2=selectedCon.id?pd.containers.find(c=>c.id===selectedCon.id):null;
      function makeDoubleTap(label,bgDef,color,onConfirm){ const s=document.createElement('div'); s._t=0; s._timer=null; s.style.cssText=`display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:${color};background:${bgDef};cursor:${selCon?'pointer':'default'};opacity:${selCon?'1':'0.3'};`; s.textContent=label; s.onclick=e=>{ e.stopPropagation(); if(!selCon) return; s._t++; clearTimeout(s._timer); if(s._t>=2){ s._t=0; s.style.background=bgDef; s.style.color=color; onConfirm(); } else{ s.style.background='#fff'; s.style.color='#C85A5A'; s._timer=setTimeout(()=>{ s._t=0; s.style.background=bgDef; s.style.color=color; },3000); } }; return s; }

      // fCard: [empty ×] [label] [fracs] [fill +]
      const fCard=document.createElement('div'); fCard.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;';
      const fLblRow=document.createElement('div'); fLblRow.style.cssText='height:20px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-bottom:3px solid #000;font-size:7px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);'; fLblRow.textContent='Set Fill To'; fCard.appendChild(fLblRow);
      const fRow=document.createElement('div'); fRow.style.cssText='height:22px;display:flex;align-items:stretch;';
      // empty button left
      const emptyBtn=makeDoubleTap('×','#C85A5A','#fff',()=>{ const prev=selCon.amount; const prevS=ptGetStock(pd); selCon.amount=0; selCon._confirmEmpty=false; selCon._isEmptyChoice=false; const eCost=(!selCon.free&&selCon.price!=null&&selCon.cap>0&&prev>0)?(prev/selCon.cap)*selCon.price:null; saveItemPantry(msItem.id,pd,prevS,eCost); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); });
      emptyBtn.style.cssText+='width:28px;min-width:28px;border-right:3px solid #000;';
      fRow.appendChild(emptyBtn);
      fracs.forEach(({n,d},i)=>{ const btn=document.createElement('div'); const fc2=fracColors[d]||'var(--bg-2)'; const isSelFrac=selCon2&&parseFloat((selCon2.amount/selCon2.cap).toFixed(4))===parseFloat((n/d).toFixed(4)); btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:${isSelFrac?fc2:'#fff'};background:${!selCon2?'var(--bg-4)':isSelFrac?'#fff':fc2};cursor:${selCon2?'pointer':'default'};${i<fracs.length-1?'border-right:3px solid #000;':''}`;  btn.innerHTML=`<sup style="font-size:6px;font-weight:900">${n}</sup><span style="font-size:8px;font-weight:900">/</span><sub style="font-size:6px;font-weight:900">${d}</sub>`; btn.onclick=e=>{ e.stopPropagation(); if(!selCon2) return; const prev=selCon2.amount; const prevS=ptGetStock(pd); const next=parseFloat((selCon2.cap*(n/d)).toFixed(1)); selCon2.amount=next; const fDiff=prev-next; const fCost=(!selCon2.free&&selCon2.price!=null&&selCon2.cap>0&&fDiff!==0)?(Math.abs(fDiff)/selCon2.cap)*selCon2.price:null; saveItemPantry(msItem.id,pd,prevS,fCost); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; fRow.appendChild(btn); });
      // fill button right
      const fillBtn=makeDoubleTap('+','#C85A5A','#fff',()=>{ const prevConAmt2=selCon.amount; const prevS=ptGetStock(pd); selCon.amount=selCon.cap; selCon._confirmEmpty=false; selCon._isEmptyChoice=false; const filledAmt=selCon.cap-prevConAmt2; const fillCost=(!selCon.free&&selCon.price!=null&&selCon.cap>0&&filledAmt>0)?(filledAmt/selCon.cap)*selCon.price:null; saveItemPantry(msItem.id,pd,prevS,fillCost); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); });
      fillBtn.style.cssText+='width:28px;min-width:28px;border-left:3px solid #000;';
      fRow.appendChild(fillBtn);
      fCard.appendChild(fRow); body.appendChild(fCard);
      if(!selCon){ fCard.style.display='none'; }

      // EDIT | DELETE card (shown when container selected)
      const actCard=document.createElement('div'); actCard.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
      const editSec=document.createElement('div'); editSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:var(--bg-2);cursor:pointer;'; editSec.textContent='Edit';
      editSec.onclick=e=>{ e.stopPropagation(); if(!selCon) return; openEditContainerWindow(msItem,pd,selCon,wrap,selectedCon,expandView); };
      const editDivider=document.createElement('div'); editDivider.style.cssText='width:3px;background:#000;flex-shrink:0;';
      const delSec=document.createElement('div'); delSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:#C85A5A;cursor:pointer;'; delSec.textContent='Delete'; delSec._t=0; delSec._timer=null;
      delSec.onclick=e=>{ e.stopPropagation(); if(!selCon) return; delSec._t++; clearTimeout(delSec._timer); if(delSec._t>=2){ delSec._t=0; pd.containers=pd.containers.filter(c=>c.id!==selCon.id); selectedCon.id=null; updateBtnState(); saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); } else{ delSec.style.background='#fff'; delSec.style.color='#C85A5A'; delSec._timer=setTimeout(()=>{ delSec._t=0; delSec.style.background='#C85A5A'; delSec.style.color='#fff'; },3000); } };
      actCard.append(editSec,editDivider,delSec); body.appendChild(actCard);
      if(!selCon){ actCard.style.display='none'; }

    } else {
      function makeAdjCard(label,getVal,setVal,minVal,getStep){ const card=document.createElement('div'); card.style.cssText=`display:flex;align-items:stretch;height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;flex-shrink:0;`; const m=document.createElement('div'); m.style.cssText='width:32px;min-width:32px;border:none;border-right:3px solid #000;background:var(--bg-2);color:var(--color-10);font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;'; m.textContent='−'; const ctr=document.createElement('div'); ctr.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);gap:1px;'; const vEl=document.createElement('div'); vEl.style.cssText='font-size:11px;font-weight:800;'; vEl.textContent=getVal(); const lEl=document.createElement('div'); lEl.style.cssText='font-size:7px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);'; lEl.textContent=label; ctr.append(vEl,lEl); const p=document.createElement('div'); p.style.cssText='width:32px;min-width:32px;border:none;border-left:3px solid #000;background:var(--bg-2);color:var(--color-10);font-size:18px;font-weight:700;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;'; p.textContent='+'; const step=()=>getStep?getStep():0.5; m.onclick=e=>{ e.stopPropagation(); const v=Math.max(minVal,parseFloat((getVal()-step()).toFixed(1))); setVal(v); vEl.textContent=v; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; p.onclick=e=>{ e.stopPropagation(); const v=parseFloat((getVal()+step()).toFixed(1)); setVal(v); vEl.textContent=v; saveItemPantry(msItem.id,pd); ptRefreshCard(msItem,pd,wrap,selectedCon,expandView); }; card.append(m,ctr,p); return card; }
      body.appendChild(makeAdjCard('Total Cap',()=>pd.totalCap,v=>{ pd.totalCap=v; },0,()=>pd.step));
      body.appendChild(makeAdjCard('Step',()=>pd.step,v=>{ pd.step=v; },0.5,()=>0.5));

      // today's usage adjuster — reads/writes pantry_usage_log for today only
      const todayMidnight=new Date(); todayMidnight.setHours(0,0,0,0);
      function getTodayUsage(){
        const log=ls('pantry_usage_log',[]);
        return parseFloat(log.filter(e=>e.id===msItem.id&&new Date(e.ts)>=todayMidnight).reduce((s,e)=>s+e.amount,0).toFixed(2));
      }
      function setTodayUsage(newVal){
        const log=ls('pantry_usage_log',[]);
        // remove all today's entries for this item and replace with one entry
        const filtered=log.filter(e=>!(e.id===msItem.id&&new Date(e.ts)>=todayMidnight));
        if(newVal>0) filtered.push({id:msItem.id,amount:newVal,ts:Date.now()});
        lsSet('pantry_usage_log',filtered);
        // sync pantry_usage total
        const u=getPtUsage();
        u[msItem.id]=parseFloat(ls('pantry_usage_log',[]).filter(e=>e.id===msItem.id).reduce((s,e)=>s+e.amount,0).toFixed(2));
        lsSet('pantry_usage',u);
      }

      function getTodayUsageSnap(){ const midnight=new Date(); midnight.setHours(0,0,0,0); return parseFloat(ls('pantry_delta_log',[]).filter(e=>e.id===msItem.id&&e.delta<0&&e.ts>=midnight.getTime()).reduce((s,e)=>s+Math.abs(e.delta),0).toFixed(2)); }
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
            const midnight=new Date(); midnight.setHours(0,0,0,0);
            const log=ls('pantry_delta_log',[]).filter(e=>!(e.id===msItem.id&&e.delta<0&&e.ts>=midnight.getTime()));
            if(target>0){ const cpuArr=pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0); const cpu=cpuArr.length?cpuArr.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr.length:null; const adjCost=cpu!=null?parseFloat((target*cpu).toFixed(4)):null; log.push({id:msItem.id,delta:-target,ts:Date.now(),cost:adjCost!=null?adjCost:undefined}); }
            lsSet('pantry_delta_log',log);
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
      adjRight.onclick=e=>{ e.stopPropagation(); const midnight=new Date(); midnight.setHours(0,0,0,0); const log=ls('pantry_delta_log',[]).filter(e=>!(e.id===msItem.id&&e.delta<0&&e.ts>=midnight.getTime())); lsSet('pantry_delta_log',log); const swEl=document.getElementById('statsWindow'); if(swEl&&swEl.style.display!=='none') renderStatsWindow(); renderAdjVal(false); };
      renderAdjVal(false);
      adjMid.onclick=e=>{ e.stopPropagation(); renderAdjVal(true); };
      adjUsageCard.append(adjLeft,adjMid,adjRight);
      body.appendChild(adjUsageCard);

      // Added Today — identical structure, purple, positive deltas
      function getTodayAddedSnap(){ const midnight=new Date(); midnight.setHours(0,0,0,0); return parseFloat(ls('pantry_delta_log',[]).filter(e=>e.id===msItem.id&&e.delta>0&&e.ts>=midnight.getTime()).reduce((s,e)=>s+e.delta,0).toFixed(2)); }
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
            const midnight=new Date(); midnight.setHours(0,0,0,0);
            const log=ls('pantry_delta_log',[]).filter(e=>!(e.id===msItem.id&&e.delta>0&&e.ts>=midnight.getTime()));
            if(target>0){ const cpuArr2=pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0); const cpu2=cpuArr2.length?cpuArr2.reduce((s,c)=>s+c.price/c.cap,0)/cpuArr2.length:null; const adjCost2=cpu2!=null?parseFloat((target*cpu2).toFixed(4)):null; log.push({id:msItem.id,delta:target,ts:Date.now(),cost:adjCost2!=null?adjCost2:undefined}); }
            lsSet('pantry_delta_log',log);
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
      addRight.onclick=e=>{ e.stopPropagation(); const midnight=new Date(); midnight.setHours(0,0,0,0); const log=ls('pantry_delta_log',[]).filter(e=>!(e.id===msItem.id&&e.delta>0&&e.ts>=midnight.getTime())); lsSet('pantry_delta_log',log); const swEl3=document.getElementById('statsWindow'); if(swEl3&&swEl3.style.display!=='none') renderStatsWindow(); renderAddVal(false); };
      renderAddVal(false);
      addMid.onclick=e=>{ e.stopPropagation(); renderAddVal(true); };
      adjAddCard.append(addLeft,addMid,addRight);
      body.appendChild(adjAddCard);
    }
    expand.appendChild(body);
  }
  wrap._renderExpand=renderExpand;

  const closeThisCard=()=>{ ptOpenSet.delete(msItem.id); expand.style.maxHeight='0'; expand.style.borderTop='none'; selectedCon.id=null; updateBtnState(); focusDimHide(); ptScrollBack(wrap._savedScrollY); wrap._savedScrollY=undefined; };
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
  cats.forEach(catId=>{ const catItems=ptSmartSortItems(ptFilterSnapshot.filter(i=>i.category===catId)); const cat=getCat(catId); itemsWrap.appendChild(ptDivider(cat.label,cat.color)); catItems.forEach(item=>itemsWrap.appendChild(ptBuildCard(item))); });
  page.appendChild(itemsWrap);
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

