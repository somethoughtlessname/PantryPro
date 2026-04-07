/* ── PANTRY PRO · tabs.js ─────────────────────────────────────────────
   Grocery List, Comp Shop, and My Store tabs:
   state, rendering, search, quick-add for all three tabs.
   Depends on: app.js
── */

let glSelectedCat='produce';
let glViewMode=ls('gl_view','simple');
let glOpenState={};
const glDelPend=new Set();

function updateGlBtn(){
  document.getElementById('glCatLabel').textContent=getCat(glSelectedCat).label;
}

function setView(v){
  glViewMode=v; lsSet('gl_view',v);
  glOpenState={};
  document.getElementById('vCat').classList.toggle('active',v==='cat');
  document.getElementById('vSimple').classList.toggle('active',v==='simple');
  glRender();
}

function glAdd(){
  const inp=document.getElementById('glInput'), name=inp.value.trim(); if(!name) return;
  const items=ls('gl_items',[]); items.push({id:'gl_'+Date.now()+Math.random(),name,category:glSelectedCat,checked:false});
  lsSet('gl_items',items);
  trackCatUsage(glSelectedCat);
  msPopulate(name,glSelectedCat);
  inp.value=''; inp.focus();
  glRender(); msRender();
}

function glToggle(id){
  const items=ls('gl_items',[]); const it=items.find(i=>i.id===id); if(it) it.checked=!it.checked;
  lsSet('gl_items',items); glRender();
}

function glDelete(id){
  glDelPend.delete(id);
  lsSet('gl_items',ls('gl_items',[]).filter(i=>i.id!==id));
  glRender();
}

let glClearAllPending = false;
let glClearAllTimeout = null;

function glFooterAction(){
  const items = ls('gl_items', []);
  const allUnchecked = items.length > 0 && items.every(i => !i.checked);

  if(allUnchecked){
    // two-tap delete all
    if(glClearAllPending){
      clearTimeout(glClearAllTimeout);
      glClearAllPending = false;
      lsSet('gl_items', []);
      glOpenState = {};
      glRender();
      updateGlFooterBtn();
    } else {
      glClearAllPending = true;
      updateGlFooterBtn();
      glClearAllTimeout = setTimeout(()=>{
        glClearAllPending = false;
        updateGlFooterBtn();
      }, 2000);
    }
  } else {
    // uncheck all
    items.forEach(i => i.checked = false);
    lsSet('gl_items', items);
    glOpenState = {};
    glRender();
    updateGlFooterBtn();
  }
}

const GL_EMPTY_MSGS = [
  'Nothing here. Either you\'re incredibly prepared or dangerously optimistic about what\'s in the fridge.',
  'The list is empty. The fridge, however, tells a different story. A sad, sad story.',
  'Wow, completely empty. You\'re either a minimalist genius or about to have cereal for dinner again.',
  'Nothing to buy! Unless you count the seventeen things you\'ll remember the moment you leave the store.',
  'Zero items. Absolute legend. Or you just forgot to add anything. Hard to tell.',
  'The void is empty and so is your fridge probably. Just a hunch.',
  'Clean list! This energy will last approximately until you open the fridge.',
  'Nothing here yet. The groceries are out there. Waiting. Judging you.',
  'Not a single item. Bold strategy. Let\'s see how the week plays out.',
  'This list is emptier than your promises to meal prep every Sunday.',
  'Nothing to buy, apparently. The mystery of what you\'ll eat tonight deepens.',
  'No items added. Scientists are baffled. Nutritionists are concerned.',
  'The list is blank. Somewhere, a grocery store is having a slow day.',
  'Nothing here. Just you, the app, and the quiet existential hum of an empty pantry.',
  'List cleared! You are either very organized or about to order delivery.',
  'A fresh, empty list. Full of hope. Completely devoid of actual groceries.',
  'Empty! Like the fridge, probably.',
  'Spooky. Nothing. Absolutely nothing.',
  'I checked twice. Still nothing. This is on you.',
  'Oh wow you really said no groceries today huh.',
  'The cupboards are whispering. They sound hungry.',
  'SELECT * FROM grocery_list — 0 rows returned.',
  'NULL. The whole thing is NULL.',
  'Array is empty. Consider pushing some items.',
  'No entries found. Have you tried turning the fridge on?',
  'HTTP 404: Groceries Not Found.',
  'All clear! Unfortunately \'all clear\' also means \'nothing to eat.\'',
  'The list is gone and so, soon, will be your snacks.',
  'I have searched every corner of this list. Nothing.',
  'You know what\'s great on an empty list? Items. Just saying.',
  'The shelves in here are very empty and also very disappointed.',
  'It\'s quiet. Too quiet.',
  'Wow look at all this nothing.',
  'Technically the list exists. Spiritually, it does not.',
  'Empty like my heart when there\'s no snacks.',
  'Have you considered... groceries?',
  'I can\'t work with nothing here. I\'m an app, not a magician.',
  'The ghost of a grocery list haunts these halls.',
  'Nothing to see here. Move along. Or... add something.',
  'Blank. Pure. Clean. Probably about to get very chaotic at dinner.',
  'I asked the universe and it said you need milk.',
  'No items. The ancient prophecy remains unfulfilled.',
  'The great grocery void stares back at you.',
  'Crickets. Literal crickets. On an empty list.',
  'This list has achieved a kind of minimalist enlightenment.',
  'Empty. Which is philosophically interesting but nutritionally concerning.',
  'Did you know the average person needs to eat? Something to think about.',
  'Zero. Zilch. Nada. The three horsemen of an empty fridge.',
  'The list has left the building. Please add items.',
  'Nothing here! Your future self is already annoyed.',
];

let GL_SESSION_EMPTY_MSG = GL_EMPTY_MSGS[Math.floor(Math.random()*GL_EMPTY_MSGS.length)];
let GL_LAST_EMPTY = false;

function glEmptyMsg(){
  if(!GL_LAST_EMPTY){
    GL_SESSION_EMPTY_MSG = GL_EMPTY_MSGS[Math.floor(Math.random()*GL_EMPTY_MSGS.length)];
    GL_LAST_EMPTY = true;
  }
  return GL_SESSION_EMPTY_MSG;
}

function updateGlFooterBtn(){
  const items = ls('gl_items', []);
  const footer = document.querySelector('#pageGrocery .footer');
  const btn = document.getElementById('glFooterBtn');
  if(!btn) return;
  if(items.length===0){ if(footer) footer.style.display='none'; return; }
  if(footer) footer.style.display='';
  const allUnchecked = items.every(i => !i.checked);
  if(allUnchecked && glClearAllPending){
    btn.textContent = 'Confirm Clear All';
    btn.style.color = 'var(--color-1)';
    btn.style.borderColor = 'var(--color-1)';
  } else if(allUnchecked){
    btn.textContent = 'Clear All';
    btn.style.color = '';
    btn.style.borderColor = '';
  } else {
    btn.textContent = 'Uncheck All';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

function glGetStage(catId,uc,ch){
  if(glOpenState[catId]!==undefined) return glOpenState[catId];
  return uc>0?1:0;
}

function glToggleCat(catId,uc,ch){
  const cur=glGetStage(catId,uc,ch);
  let next;
  if(ch===0) next=cur===0?1:0;
  else if(uc===0) next=cur===0?2:0;
  else next=cur===0?1:cur===1?2:0;
  const isOpening=next>0;
  glOpenState[catId]=next;
  if(isOpening){ glRender(); focusDimShowById(catId,'#glList'); }
  else {
    const container=document.querySelector('#glList');
    const activeEl=container?.querySelector('.cat-section:not(.closed)');
    const savedY=activeEl?activeEl._savedScrollY:undefined;
    focusDimHide(); glRender(); ptScrollBack(savedY);
    document.querySelectorAll('.cat-section').forEach(e=>{e.classList.remove('focus-active','pt-card-wrap'); e._savedScrollY=undefined;});
  }
}

function makeGlRow(item, catColor, showDot){
  const row=document.createElement('div'); row.className='item-row';
  const chk=document.createElement('div'); chk.className='item-check';
  if(item.checked){
    chk.style.background='var(--color-4)'; chk.style.color='#fff'; chk.textContent='✓';
  } else if(showDot){
    chk.style.background='#fff';
    const dot=document.createElement('div');
    dot.style.cssText='width:12px;height:12px;border-radius:50%;background:var(--color-4);flex-shrink:0;';
    chk.appendChild(dot);
  } else {
    chk.style.background='#fff';
  }

  const nm=document.createElement('div'); nm.className='item-name';
  if(item.checked){ nm.style.textDecoration='line-through'; nm.style.opacity='0.5'; }
  // check if this item has an active sale in cs_entries
  const glMsItem = ls('ms_items',[]).find(i=>i.name.toLowerCase()===item.name.toLowerCase());
  const glEntries = ls('cs_entries',[]);
  const hasSale = glMsItem && glEntries.some(e=>e.itemId===glMsItem.id && isSaleActive(e));
  const glSaleEntry = hasSale ? glEntries.find(e=>e.itemId===glMsItem.id && isSaleActive(e)) : null;
  if(hasSale){
    nm.innerHTML = item.name + ' &nbsp;<strong style="color:#ff8c00;font-size:9px;letter-spacing:0.08em;">SALE!</strong>' + (glSaleEntry ? ' &nbsp;<span style="color:#fff;font-size:9px;font-weight:600;">('+glSaleEntry.store+')</span>' : '');
  } else {
    nm.textContent = item.name;
  }

  const del=document.createElement('button');
  del.className='item-del'+(glDelPend.has(item.id)?' pending':'');
  del.textContent='×';
  del.onclick=e=>{
    e.stopPropagation();
    if(glDelPend.has(item.id)){ glDelete(item.id); }
    else { glDelPend.add(item.id); del.className='item-del pending'; setTimeout(()=>{ glDelPend.delete(item.id); glRender(); },2000); }
  };

  row.onclick=e=>{ if(!e.target.classList.contains('item-del')) glToggle(item.id); };
  row.append(chk,nm,del);
  return row;
}

/* ── SMART SORT ── */

let glQuickAddName = '';
let glSearchIdleTimer = null;
let glThinkPhraseSet = false;
let glCurrentThinkPhrase = null;
let glThinkCardEl = null;

function glPickNextThinkPhrase(){
  const available = MS_THINK_PHRASES.filter(p=>p!==glCurrentThinkPhrase);
  glCurrentThinkPhrase = available[Math.floor(Math.random()*available.length)];
  glThinkCardEl = null;
}

function glGetOrCreateThinkCard(){
  if(glThinkCardEl) return glThinkCardEl;
  const card=document.createElement('div');
  card.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;
  const txt=document.createElement('div');
  txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;';
  const phraseText=(glCurrentThinkPhrase||MS_THINK_PHRASES[0]).replace(/[.…]+$/,'');
  txt.innerHTML=phraseText+'<span class="thinking-dots" style="font-style:normal;margin-left:1px;"><span>.</span><span>.</span><span>.</span></span>';
  card.appendChild(txt);
  glThinkCardEl=card;
  return card;
}

function glSearchInput(){
  clearTimeout(glSearchIdleTimer);
  const q=(document.getElementById('glSearch')?.value||'').trim();
  if(!q){ glThinkPhraseSet=false; glQuickAddState=null; glQuickAddName=''; glThinkCardEl=null; glRender(); return; }
  if(glQuickAddState && glQuickAddState!=='pick-cat'){
    glQuickAddState=null; glThinkCardEl=null; glPickNextThinkPhrase();
  }
  if(!glThinkPhraseSet){ glPickNextThinkPhrase(); glThinkPhraseSet=true; }
  glRender();
  glSearchIdleTimer=setTimeout(()=>{
    const allMsItems=ls('ms_items',[]);
    const qWords=q.toLowerCase().split(/\s+/);
    const exists=allMsItems.some(i=>{ const nw=i.name.toLowerCase().split(/\s+/); return qWords.every(qw=>nw.includes(qw)); });
    glQuickAddState=exists?'found':'confirm';
    glQuickAddName=q;
    glRender();
  },2000);
}

function glRender(){
  const ap=document.getElementById('glAddPanel');
  if(ap) ap.style.display=glShowAddPanel?'':'none';
  const container=document.getElementById('glList'); container.innerHTML='';
  const items=ls('gl_items',[]);

  const glQuery=(document.getElementById('glSearch')?.value||'').trim().toLowerCase();
  const viewToggle=document.querySelector('#pageGrocery .view-toggle');
  const footer=document.querySelector('#pageGrocery .footer');
  updateGlFooterBtn();
  if(glQuery && footer) footer.style.display='none';
  const glThinkSlot=document.getElementById('glThinkSlot');

  // hide view toggle and footer while searching
  if(viewToggle) viewToggle.style.display=glQuery?'none':'';
  // footer visibility always controlled by updateGlFooterBtn, not here

  // manage think slot
  if(glQuery && !glQuickAddState){
    const card=glGetOrCreateThinkCard();
    if(glThinkSlot && !glThinkSlot.contains(card)){ glThinkSlot.innerHTML=''; glThinkSlot.appendChild(card); }
  } else if(glQuery && glQuickAddState){
    if(glThinkSlot) glThinkSlot.innerHTML='';
    const displayName=document.getElementById('glSearch')?.value.trim()||glQuery;
    const queryWords=glQuery.split(/\s+/);
    const exactExists=items.some(i=>{ const nw=i.name.toLowerCase().split(/\s+/); return queryWords.every(qw=>nw.includes(qw)); });

    const qaCard=document.createElement('div');
    qaCard.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;

    if(glQuickAddState==='success'){
      const ph=MS_SUCCESS_PHRASES[Math.floor(Math.random()*MS_SUCCESS_PHRASES.length)];
      const txt=document.createElement('div');
      txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
      txt.textContent=ph; qaCard.appendChild(txt);
    } else if(exactExists||glQuickAddState==='found'){
      const ph=MS_FOUND_PHRASES[Math.floor(Math.random()*MS_FOUND_PHRASES.length)];
      const txt=document.createElement('div');
      txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
      txt.textContent=ph; qaCard.appendChild(txt);
    } else if(glQuickAddState==='confirm'){
      const txt=document.createElement('div');
      txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      txt.innerHTML=`Add <strong style="color:var(--color-10);margin:0 4px;">"${displayName}"</strong> to your list?`;
      const yesBtn=document.createElement('div');
      yesBtn.style.cssText='width:48px;min-width:48px;background:#347ab8;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#fff;cursor:pointer;flex-shrink:0;';
      yesBtn.textContent='YES!';
      yesBtn.onclick=e=>{ e.stopPropagation(); openNewItemOverlay(displayName, ()=>{ glQuickAddState='success'; glRender(); }); };
      qaCard.append(txt,yesBtn);
    } else if(glQuickAddState==='pick-cat'){
      const txt=document.createElement('div');
      txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);';
      txt.textContent='Pick your category';
      const okBtn=document.createElement('div');
      okBtn.style.cssText='width:48px;min-width:48px;background:var(--color-4);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#000;cursor:pointer;flex-shrink:0;';
      okBtn.textContent='OK!';
      okBtn.onclick=e=>{
        e.stopPropagation();
        window._glQuickAddName=glQuickAddName;
        modalCtx='gl-quickadd'; modalSelPend=null; modalDelPend.clear();
        editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
        document.getElementById('modalTitle').textContent='Category';
        buildModalGrid();
        document.getElementById('modalOverlay').classList.add('open');
      };
      qaCard.append(txt,okBtn);
    }
    container.appendChild(qaCard);
  } else {
    if(glThinkSlot) glThinkSlot.innerHTML='';
  }

  if(glQuery){
    const msItems=ls('ms_items',[]);
    const glItems2=ls('gl_items',[]);
    const results=msItems.filter(i=>{ const ws=i.name.toLowerCase().split(/\s+/); return ws.some(w=>w.startsWith(glQuery)); }).sort((a,b)=>a.name.localeCompare(b.name));

    // also check exact match against ms_items for idle timer
    const exactExistsInMs=msItems.some(i=>{ const nw=i.name.toLowerCase().split(/\s+/); return glQuery.split(/\s+/).every(qw=>nw.includes(qw)); });

    results.forEach(msItem=>{
      const onList=glItems2.some(g=>g.name.toLowerCase()===msItem.name.toLowerCase());
      const cat=getCats().find(c=>c.id===msItem.category);

      // build a gl-style row
      const row=document.createElement('div'); row.className='item-row';
      row.style.cursor=onList?'default':'pointer';

      const addSq=document.createElement('div'); addSq.className='item-check';
      addSq.style.cssText=`width:var(--check-size,32px);min-width:var(--check-size,32px);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;cursor:${onList?'default':'pointer'};background:${onList?'var(--color-4)':'var(--bg-3)'};border-right:var(--border-width) solid var(--border-color);color:${onList?'#fff':'var(--muted)'};flex-shrink:0;`;
      addSq.textContent=onList?'✓':'+';

      const nm=document.createElement('div'); nm.className='item-name';
      nm.style.background=onList?'var(--bg-3)':'var(--bg-2)';
      nm.style.color=onList?'var(--muted)':'var(--color-10)';
      // check sale
      const glSaleEntry2=ls('cs_entries',[]).find(e=>e.itemId===msItem.id&&isSaleActive(e));
      if(glSaleEntry2){
        nm.innerHTML=msItem.name+' &nbsp;<strong style="color:#ff8c00;font-size:9px;letter-spacing:0.08em;">SALE!</strong> &nbsp;<span style="color:#fff;font-size:9px;font-weight:600;">('+glSaleEntry2.store+')</span>';
      } else {
        nm.textContent=msItem.name;
      }

      const catBadge=document.createElement('div');
      catBadge.style.cssText=`width:25%;min-width:0;background:var(--bg-3);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${cat?.color||'var(--muted)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;flex-shrink:0;`;
      catBadge.textContent=cat?.label||'';

      row.append(addSq,nm,catBadge);

      if(!onList){
        row.onclick=()=>{
          const gl=ls('gl_items',[]);
          if(!gl.some(g=>g.name.toLowerCase()===msItem.name.toLowerCase())){
            gl.push({id:'gl_'+Date.now()+Math.random(),name:msItem.name,category:msItem.category,checked:false});
            lsSet('gl_items',gl);
            trackCatUsage(msItem.category);
          }
          glRender();
        };
      }
      container.appendChild(row);
    });
    return;
  }

  if(items.length > 0) GL_LAST_EMPTY = false;
  if(items.length===0){ showEmpty(container, glEmptyMsg()); return; }

  if(glViewMode==='simple'){
    const activeCats = getCats().filter(c=>items.some(i=>i.category===c.id));
    activeCats.forEach(cat=>{
      const catItems = items.filter(i=>i.category===cat.id)
        .sort((a,b)=>a.name.localeCompare(b.name));

      // category divider — line with label
      const div=document.createElement('div'); div.className='simple-cat-divider';
      const line1=document.createElement('div'); line1.className='simple-cat-divider-line';
      const lbl=document.createElement('span'); lbl.className='simple-cat-divider-label'; lbl.textContent=cat.label; lbl.style.color=cat.color;
      const line2=document.createElement('div'); line2.className='simple-cat-divider-line';
      div.append(line1,lbl,line2);
      container.appendChild(div);

      // flat rows — no wrapper card
      catItems.forEach(item=>{
        container.appendChild(makeGlRow(item, cat.color, false));
      });
    });
    return;
  }

  getCats().filter(c=>items.some(i=>i.category===c.id)).forEach(cat=>{
    const catItems=items.filter(i=>i.category===cat.id);
    const uc=catItems.filter(i=>!i.checked).sort((a,b)=>a.name.localeCompare(b.name));
    const ch=catItems.filter(i=>i.checked).sort((a,b)=>a.name.localeCompare(b.name));
    const rawStage=glGetStage(cat.id,uc.length,ch.length);
    // if we're in "unchecked only" mode but none are left, collapse
    const stage = (rawStage===1 && uc.length===0) ? 0 : rawStage;
    if(stage===0 && rawStage===1) glOpenState[cat.id]=0;
    const toShow=stage===1?uc:[...uc,...ch];
    const section=buildCatSection(cat,catItems,stage,()=>glToggleCat(cat.id,uc.length,ch.length),body=>{
      toShow.forEach(item=>body.appendChild(makeGlRow(item, cat.color, false)));
    });
    container.appendChild(section);
  });
  updateGlFooterBtn();
}

document.getElementById('glInput').addEventListener('keydown',e=>{ if(e.key==='Enter') glAdd(); });

/* ── COMP SHOP ── */
let csSelectedUnit='unit';
let csOpenState={};
let csViewMode=ls('cs_view','simple');
const csItemDelPend=new Set(), csEntDelPend=new Set();

function setCsView(v){
  csViewMode=v; lsSet('cs_view',v);
  csOpenState={};
  document.getElementById('csVSimple').classList.toggle('active',v==='simple');
  document.getElementById('csVCat').classList.toggle('active',v==='cat');
  csRender();
}

function updateUnitBtn(){
  const el=document.getElementById('csUnitLabel');
  if(el) el.textContent=getUnit(csSelectedUnit).label;
}


function csDeleteItem(id){
  // items now managed via My Store — just remove entries
  csItemDelPend.delete(id);
  lsSet('cs_entries',ls('cs_entries',[]).filter(e=>e.itemId!==id));
  csRender();
}

function csAddEntry(itemId,store,qty,price,salePrice,saleEnds){
  if(!store||!qty||!price) return;
  const entries=ls('cs_entries',[]);
  if(csEditingId){
    const idx=entries.findIndex(e=>e.id===csEditingId);
    if(idx>-1){
      entries[idx].store=store; entries[idx].qty=parseFloat(qty);
      entries[idx].price=parseFloat(price); entries[idx].updated=Date.now();
      if(salePrice&&saleEnds) entries[idx].sale={price:parseFloat(salePrice),ends:saleEnds};
      lsSet('cs_entries',entries); csEditingId=null; csRender(); focusDimShowById(itemId,'#csList'); return;
    }
    csEditingId=null;
  }
  const entry={id:'cse_'+Date.now(),itemId,store,qty:parseFloat(qty),price:parseFloat(price),updated:Date.now()};
  if(salePrice&&saleEnds) entry.sale={price:parseFloat(salePrice),ends:saleEnds};
  entries.push(entry); lsSet('cs_entries',entries); csRender(); focusDimShowById(itemId,'#csList');
}

function csDeleteEntry(id){
  csEntDelPend.delete(id);
  lsSet('cs_entries',ls('cs_entries',[]).filter(e=>e.id!==id));
  csRender();
}

const csEditPend = new Set();
let csEditingId = null;

function csEditEntry(entryId, itemId){
  const entries = ls('cs_entries',[]);
  const entry = entries.find(e=>e.id===entryId);
  if(!entry) return;
  csEditingId = entryId;

  requestAnimationFrame(()=>{
    const storeInp = document.querySelector('input[data-item-id="'+itemId+'"]');
    const qtyInp   = document.querySelector('input[data-qty-id="'+itemId+'"]');
    const priceInp = document.querySelector('input[data-price-id="'+itemId+'"]');
    const spInp    = document.querySelector('input[data-sale-price-id="'+itemId+'"]');
    const edInp    = document.querySelector('input[data-sale-end-id="'+itemId+'"]');
    if(storeInp) storeInp.value = entry.store;
    if(qtyInp)   qtyInp.value   = entry.qty;
    if(priceInp) priceInp.value = entry.price;
    if(spInp&&entry.sale)  spInp.value = entry.sale.price;
    if(edInp&&entry.sale)  edInp.value = entry.sale.ends;
  });
}



function getCsStage(id){ return csOpenState[id]!==undefined?csOpenState[id]:0; }

function csToggle(id){
  const cur=getCsStage(id);
  if(cur===0){
    Object.keys(csOpenState).forEach(k=>{ if(!k.startsWith('cat_')) csOpenState[k]=0; });
    csOpenState[id]=1;
    csOpenState._savedScrollY=window.scrollY;
    csRender(); focusDimShowById(id,'#csList');
  } else {
    csOpenState[id]=0; focusDimHide();
    document.querySelectorAll('.cs-section,.cat-section').forEach(e=>{e.classList.remove('focus-active','pt-card-wrap');});
    ptScrollBack(csOpenState._savedScrollY); csOpenState._savedScrollY=undefined;
    csRender();
  }
}

const csSaleDelPend = new Set();
const csSaleAddOpen = new Set(); // entry IDs where sale add form is showing

function isSaleActive(entry){
  if(!entry.sale) return false;
  const parts = entry.sale.ends.split('-');
  const end = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]), 23, 59, 59, 999);
  return new Date() <= end;
}

function csGetEffectiveUp(entry){
  if(isSaleActive(entry)) return entry.sale.price / entry.qty;
  return entry.qty > 0 ? entry.price / entry.qty : null;
}

function csPurgeSales(){
  const entries = ls('cs_entries',[]);
  let changed = false;
  entries.forEach(e=>{
    if(e.sale && !isSaleActive(e)){ delete e.sale; changed=true; }
  });
  if(changed) lsSet('cs_entries', entries);
}

function csDeleteSale(entryId){
  csSaleDelPend.delete(entryId);
  const entries = ls('cs_entries',[]);
  const e = entries.find(e=>e.id===entryId);
  if(e){ delete e.sale; lsSet('cs_entries', entries); }
  csRender();
}

function csAddSale(entryId, salePrice, endsStr){
  if(!salePrice || !endsStr) return;
  const entries = ls('cs_entries',[]);
  const e = entries.find(e=>e.id===entryId);
  if(e){
    e.sale = { price: parseFloat(salePrice), ends: endsStr };
    lsSet('cs_entries', entries);
  }
  csSaleAddOpen.delete(entryId);
  csRender();
}




/* ── COMP SHOP SEARCH + QUICK ADD ── */
let csQuickAddState = null;
let csQuickAddName = '';
let csQuickAddCat = null;
let csQuickAddUnit = null;
let csSearchIdleTimer = null;
let csThinkTimer = null;
let csThinkPhraseSet = false;
let csCurrentThinkPhrase = null; // set after MS_THINK_PHRASES is declared
let csThinkCardEl = null;

function csPickNextThinkPhrase(){
  const available = MS_THINK_PHRASES.filter(p=>p!==csCurrentThinkPhrase);
  csCurrentThinkPhrase = available[Math.floor(Math.random()*available.length)];
  csThinkCardEl = null;
}

function csGetOrCreateThinkCard(){
  if(csThinkCardEl) return csThinkCardEl;
  const card=document.createElement('div');
  card.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;
  const txt=document.createElement('div');
  txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;';
  const phraseText=csCurrentThinkPhrase.replace(/[.…]+$/,'');
  txt.innerHTML=phraseText+'<span class="thinking-dots" style="font-style:normal;margin-left:1px;"><span>.</span><span>.</span><span>.</span></span>';
  card.appendChild(txt);
  csThinkCardEl=card;
  return card;
}

function csSearchInput(){
  clearTimeout(csSearchIdleTimer);
  clearInterval(csThinkTimer);
  const q=(document.getElementById('csSearch')?.value||'').trim();
  if(!q){ csThinkPhraseSet=false; csQuickAddState=null; csQuickAddName=''; csThinkCardEl=null; csRender(); return; }
  // if user types again after idle fired, reset back to thinking
  if(csQuickAddState && csQuickAddState!=='pick-cat' && csQuickAddState!=='pick-unit'){
    csQuickAddState=null; csThinkCardEl=null; csPickNextThinkPhrase();
  }
  if(!csThinkPhraseSet){ csPickNextThinkPhrase(); csThinkPhraseSet=true; }
  csRender();
  csSearchIdleTimer=setTimeout(()=>{
    clearInterval(csThinkTimer);
    const allItems=ls('ms_items',[]);
    const qWords=q.toLowerCase().split(/\s+/);
    const exists=allItems.some(i=>{ const nw=i.name.toLowerCase().split(/\s+/); return qWords.every(qw=>nw.includes(qw)); });
    csQuickAddState=exists?'found':'confirm';
    csQuickAddName=q;
    csRender();
  },2000);
}

function csOpenUnitModalForQuickAdd(){
  modalCtx='cs-quickadd-unit'; modalSelPend=null; modalDelPend.clear();
  document.getElementById('modalTitle').textContent='Unit';
  buildModalGrid();
  document.getElementById('modalOverlay').classList.add('open');
}

function csOpenCatModalForQuickAdd(){
  modalCtx='cs-quickadd-cat'; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
  document.getElementById('modalTitle').textContent='Category';
  buildModalGrid();
  document.getElementById('modalOverlay').classList.add('open');
}

function csQuickAddFinalise(){
  if(!csQuickAddName || !csQuickAddCat || !csQuickAddUnit) return;
  const newItem={id:'ms_'+Date.now()+Math.random(), name:csQuickAddName, category:csQuickAddCat, unit:csQuickAddUnit};
  const ms=ls('ms_items',[]); ms.push(newItem); lsSet('ms_items',ms);
  csQuickAddState='success'; csQuickAddName=''; csQuickAddCat=null; csQuickAddUnit=null;
  csThinkPhraseSet=false; csThinkCardEl=null;
  csRender(); msRender();
}

function csRender(){
  csPurgeSales();
  const container=document.getElementById('csList'); container.innerHTML='';
  const items=ls('ms_items',[]), entries=ls('cs_entries',[]);
  if(items.length===0){ showEmpty(container,'Add items in My Store first.'); return; }

  const csVS=document.getElementById('csVSimple'), csVC=document.getElementById('csVCat');
  const viewToggle=document.querySelector('#pageShop .view-toggle');
  const csQuery=(document.getElementById('csSearch')?.value||'').trim().toLowerCase();

  // hide view tabs while searching
  if(viewToggle) viewToggle.style.display=csQuery?'none':'';
  if(csVS) csVS.classList.toggle('active',csViewMode==='simple');
  if(csVC) csVC.classList.toggle('active',csViewMode==='cat');

  const csThinkSlot=document.getElementById('csThinkSlot');

  // manage think slot — both think card and qa card go here
  if(csThinkSlot){
    if(csQuery && !csQuickAddState){
      const card=csGetOrCreateThinkCard();
      if(!csThinkSlot.contains(card)){ csThinkSlot.innerHTML=''; csThinkSlot.appendChild(card); }
    } else if(csQuery && csQuickAddState && csQuickAddState!=='done'){
      csThinkSlot.innerHTML='';
      const displayName=document.getElementById('csSearch')?.value.trim()||csQuery;
      const queryWords=csQuery.split(/\s+/);
      const exactExists=items.some(i=>{ const nw=i.name.toLowerCase().split(/\s+/); return queryWords.every(qw=>nw.includes(qw)); });

      const qaCard=document.createElement('div');
      qaCard.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;

      if(csQuickAddState==='success'){
        const ph=MS_SUCCESS_PHRASES[Math.floor(Math.random()*MS_SUCCESS_PHRASES.length)];
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
        txt.textContent=ph; qaCard.appendChild(txt);
      } else if(exactExists || csQuickAddState==='found'){
        const ph=MS_FOUND_PHRASES[Math.floor(Math.random()*MS_FOUND_PHRASES.length)];
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
        txt.textContent=ph; qaCard.appendChild(txt);
      } else if(csQuickAddState==='confirm'){
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        txt.innerHTML=`Add <strong style="color:var(--color-10);margin:0 4px;">"${displayName}"</strong> to Comp Shop?`;
        const yesBtn=document.createElement('div');
        yesBtn.style.cssText='width:48px;min-width:48px;background:#347ab8;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#fff;cursor:pointer;flex-shrink:0;';
        yesBtn.textContent='YES!';
        yesBtn.onclick=e=>{ e.stopPropagation(); openNewItemOverlay(displayName, ()=>{ csQuickAddState='success'; csRender(); }); };
        qaCard.append(txt,yesBtn);
      } else if(csQuickAddState==='pick-cat'){
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);';
        txt.textContent='Pick your category';
        const okBtn=document.createElement('div');
        okBtn.style.cssText='width:48px;min-width:48px;background:var(--color-4);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#000;cursor:pointer;flex-shrink:0;';
        okBtn.textContent='OK!';
        okBtn.onclick=e=>{ e.stopPropagation(); csOpenCatModalForQuickAdd(); };
        qaCard.append(txt,okBtn);
      } else if(csQuickAddState==='pick-unit'){
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);';
        txt.textContent='Choose your unit of measurement';
        const ofBtn=document.createElement('div');
        ofBtn.style.cssText='width:64px;min-width:64px;background:#7c58a8;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;color:#fff;cursor:pointer;flex-shrink:0;text-align:center;padding:0 4px;';
        ofBtn.textContent='OF COURSE!';
        ofBtn.onclick=e=>{ e.stopPropagation(); csOpenUnitModalForQuickAdd(); };
        qaCard.append(txt,ofBtn);
      }
      csThinkSlot.appendChild(qaCard);
    } else {
      csThinkSlot.innerHTML='';
    }
  }

  // filter items by search
  let displayItems=items;
  if(csQuery){
    displayItems=items.filter(i=>{ const ws=i.name.toLowerCase().split(/\s+/); return ws.some(w=>w.startsWith(csQuery)); });
    // show as simple flat list, no category dividers
    const cats=csGetSortedCats(displayItems);
    cats.forEach(cat=>{
      const catItems=displayItems.filter(i=>i.category===cat.id);
      catItems.forEach(item=>container.appendChild(buildCsItem(item)));
    });
    return;
  }

  if(displayItems.length===0){ showEmpty(container,'Add items in My Store first.'); return; }
  const cats=csGetSortedCats(displayItems);

  // shared: build a full cs item section (header + body)
  function buildCsItem(item){
    const unit=getUnit(item.unit);
    const itemEntries=entries.filter(e=>e.itemId===item.id);
    const stage=getCsStage(item.id);
    const sorted=[...itemEntries].sort((a,b)=>{ const ua=csGetEffectiveUp(a)??Infinity,ub=csGetEffectiveUp(b)??Infinity; return ua-ub; });
    const validUPs=sorted.map(e=>csGetEffectiveUp(e)).filter(u=>u!==null);
    const minUp=validUPs.length?Math.min(...validUPs):null;
    const tieCount=minUp!==null?validUPs.filter(u=>parseFloat(u.toFixed(2))===parseFloat(minUp.toFixed(2))).length:0;

    const section=document.createElement('div'); section.className='cs-section'+(stage===0?' closed':'');
    const hdr=document.createElement('div'); hdr.className='cs-header'; hdr.onclick=e=>{ e.stopPropagation(); csToggle(item.id); };
    const main=document.createElement('div'); main.className='cs-header-main';
    const nameEl=document.createElement('div'); nameEl.className='cs-item-name'; nameEl.textContent=item.name;
    main.appendChild(nameEl);

    if(stage===0&&minUp!==null){
      const RANK_COLORS=[{solo:'#30a85a',tied:'#90e0b0'},{solo:'#347ab8',tied:'#90c4e8'},{solo:'#7c58a8',tied:'#c0aadc'}];
      function fmtUp(u){ return u!==null?parseFloat(u.toFixed(2)):null; }
      function isTiedPrice(u){ const f=fmtUp(u); return sorted.filter(x=>fmtUp(csGetEffectiveUp(x))===f).length>1; }
      const count=Math.min(csPreviewCount,sorted.length);
      let displayRank=0,lastFmt=null;
      for(let i=0;i<count;i++){
        const e=sorted[i]; const up=csGetEffectiveUp(e); if(up===null) continue;
        const fmt=fmtUp(up); if(lastFmt!==null&&fmt!==lastFmt) displayRank++;
        lastFmt=fmt;
        const isTied=isTiedPrice(up); const col=RANK_COLORS[Math.min(displayRank,2)]; const color=isTied?col.tied:col.solo;
        const sub=document.createElement('div');
        sub.style.cssText=`font-size:9px;font-weight:700;color:${color};letter-spacing:0.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
        let saleText = '';
        if(isSaleActive(e)){
          const endD=new Date(e.sale.ends+'T00:00:00');
          const now=new Date(); now.setHours(0,0,0,0);
          const diff=Math.round((endD-now)/(1000*60*60*24));
          if(diff<=0) saleText='Ends Today';
          else if(diff===1) saleText='Ends Tomorrow';
          else saleText='Ends '+(endD.getMonth()+1)+'/'+endD.getDate()+'/'+String(endD.getFullYear()).slice(2);
        }
        sub.textContent=e.store+' · $'+up.toFixed(2)+'/'+unit.label;
        if(saleText){
          const saleSuffix=document.createElement('span');
          saleSuffix.style.cssText='color:#d97f30;font-weight:800;';
          saleSuffix.textContent=' (SALE! '+saleText+')';
          sub.appendChild(saleSuffix);
        }
        main.appendChild(sub);
      }
    } else if(stage>0){
      const badge=document.createElement('div'); badge.className='cs-unit-badge';
      badge.textContent=unit.label+(itemEntries.length?' · '+itemEntries.length:''); main.appendChild(badge);
    }

    const right=document.createElement('div'); right.className='cs-header-right';
    const arr=document.createElement('div'); arr.className='cs-arrow'; arr.textContent=stage===0?'▼':'▲'; right.appendChild(arr);
    hdr.append(main,right); section.appendChild(hdr);

    if(stage>0){
      const body=document.createElement('div'); body.className='cs-body';
      // cat/unit card
      const cuRow=document.createElement('div');
      cuRow.style.cssText='height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
      const catBtn=document.createElement('button');
      catBtn.style.cssText=`flex:1;min-width:0;border:none;border-right:var(--border-width) solid var(--border-color);background:var(--bg-2);color:${getCat(item.category).color};font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 8px;`;
      catBtn.textContent=getCat(item.category).label; catBtn.onclick=()=>openMsCatModal(item.id);
      const unitBtn=document.createElement('button');
      unitBtn.style.cssText='flex:1;min-width:0;border:none;background:var(--bg-2);color:var(--muted);font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 8px;';
      unitBtn.textContent=getUnit(item.unit||'unit').label; unitBtn.onclick=()=>openMsUnitModal(item.id);
      cuRow.append(catBtn,unitBtn); body.appendChild(cuRow);
      // add entry row
      const addRow=document.createElement('div'); addRow.className='cs-add-row';
      const sI=document.createElement('input'); sI.className='cs-input cs-input-store'; sI.placeholder='Store'; sI.maxLength=30; sI.dataset.itemId=item.id;
      const qI=document.createElement('input'); qI.className='cs-input cs-input-qty'; qI.placeholder='Quantity'; qI.type='number'; qI.min='0'; qI.step='any'; qI.dataset.qtyId=item.id;
      const pI=document.createElement('input'); pI.className='cs-input cs-input-price'; pI.placeholder='Price'; pI.type='number'; pI.min='0'; pI.step='any'; pI.dataset.priceId=item.id;
      const aBtn=document.createElement('button'); aBtn.className='cs-add-btn'; aBtn.textContent='+';
      addRow.append(sI,qI,pI,aBtn); body.appendChild(addRow);
      // sale add row
      const saleAddRow=document.createElement('div'); saleAddRow.className='cs-sale-add-row';
      const slbl=document.createElement('div'); slbl.className='cs-sale-label'; slbl.textContent='SALE';
      const spI=document.createElement('input'); spI.className='cs-input'; spI.placeholder='Sale Price'; spI.type='number'; spI.min='0'; spI.step='any'; spI.style.cssText='flex:1;min-width:0;'; spI.dataset.salePriceId=item.id;
      const todayLocal=new Date(); const pad=n=>String(n).padStart(2,'0');
      const todayStr=todayLocal.getFullYear()+'-'+pad(todayLocal.getMonth()+1)+'-'+pad(todayLocal.getDate());
      const edI=document.createElement('input'); edI.className='cs-input'; edI.type='date'; edI.min=todayStr; edI.style.cssText='flex:2;min-width:0;color-scheme:dark;'; edI.dataset.saleEndId=item.id;
      const clrBtn=document.createElement('button'); clrBtn.className='cs-entry-del'; clrBtn.textContent='×';
      clrBtn.onclick=()=>{ spI.value=''; edI.value=''; const ents=ls('cs_entries',[]); ents.forEach(e=>{ if(e.itemId===item.id&&e.sale) delete e.sale; }); lsSet('cs_entries',ents); csRender(); };
      saleAddRow.append(slbl,spI,edI,clrBtn); body.appendChild(saleAddRow);
      // doAdd defined after spI/edI so closure captures them correctly
      const doAdd=()=>csAddEntry(item.id,sI.value.trim(),qI.value,pI.value,spI.value,edI.value.trim());
      aBtn.onclick=doAdd; [sI,qI,pI].forEach(i=>i.addEventListener('keydown',e=>{ if(e.key==='Enter') doAdd(); }));

      if(sorted.length>0){
        const divEl=document.createElement('div'); divEl.className='cs-divider'; body.appendChild(divEl);
        sorted.forEach(entry=>{
          const up=csGetEffectiveUp(entry);
          const hasSale=isSaleActive(entry);
          const isBest=up!==null&&minUp!==null&&parseFloat(up.toFixed(2))===parseFloat(minUp.toFixed(2));
          const isTied=isBest&&tieCount>1;
          const row=document.createElement('div'); row.className='cs-entry';
          const top=document.createElement('div'); top.className='cs-entry-top';
          const editSq=document.createElement('div'); editSq.className='cs-entry-edit'+(csEditPend.has(entry.id)?' pending':''); editSq.textContent='≡'; editSq.dataset.id=entry.id;
          editSq.onclick=e=>{ e.stopPropagation(); const id=e.currentTarget.dataset.id;
            if(csEditPend.has(id)){ csEditPend.delete(id); csEditEntry(id,item.id); }
            else { csEditPend.add(id); editSq.className='cs-entry-edit pending'; setTimeout(()=>{ csEditPend.delete(id); editSq.className='cs-entry-edit'; },2000); }
          };
          const regularUp=entry.qty>0?entry.price/entry.qty:null;
          const st=document.createElement('div'); st.className='cs-store'; st.textContent=entry.store;
          const upEl=document.createElement('div'); upEl.className='cs-up'+(isTied?' tied':isBest?' best':'');
          upEl.textContent=regularUp!==null?'$'+regularUp.toFixed(2)+'/'+unit.label:'—';
          const dt=document.createElement('div'); dt.className='cs-date';
          if(entry.updated){ const d=new Date(entry.updated); dt.textContent=(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2); } else dt.textContent='—';
          const dBtn=document.createElement('button'); dBtn.className='cs-entry-del'+(csEntDelPend.has(entry.id)?' pending':''); dBtn.textContent='×';
          dBtn.onclick=()=>{ if(csEntDelPend.has(entry.id)){ csDeleteEntry(entry.id); } else { csEntDelPend.add(entry.id); dBtn.className='cs-entry-del pending'; setTimeout(()=>{ csEntDelPend.delete(entry.id); csRender(); },2000); } };
          top.append(editSq,st,upEl,dt,dBtn); row.appendChild(top);
          if(hasSale){
            const saleUp=entry.sale.price/entry.qty;
            const saving=regularUp!==null?(regularUp-saleUp):null;
            const saleRow=document.createElement('div'); saleRow.className='cs-entry-sale';
            const sv=document.createElement('div'); sv.className='cs-sale-saving'; sv.textContent=saving!==null?'SAVE $'+saving.toFixed(2)+'/'+unit.label:'—';
            const sp=document.createElement('div'); sp.className='cs-sale-price'; sp.textContent='$'+saleUp.toFixed(2)+'/'+unit.label;
            const ed=document.createElement('div'); ed.className='cs-sale-enddate';
            const endD=new Date(entry.sale.ends+'T00:00:00');
            ed.textContent='ENDS '+(endD.getMonth()+1)+'/'+endD.getDate()+'/'+String(endD.getFullYear()).slice(2);
            saleRow.append(sv,sp,ed); row.appendChild(saleRow);
          }
          body.appendChild(row);
        });
      }
      section.appendChild(body);
    }
    return section;
  }

  // SIMPLE — flat item cards under category dividers
  if(csViewMode==='simple'){
    cats.forEach(cat=>{
      const catItems=displayItems.filter(i=>i.category===cat.id);
      const div=document.createElement('div'); div.className='simple-cat-divider';
      const l1=document.createElement('div'); l1.className='simple-cat-divider-line';
      const lbl=document.createElement('span'); lbl.className='simple-cat-divider-label'; lbl.textContent=cat.label; lbl.style.color=cat.color;
      const l2=document.createElement('div'); l2.className='simple-cat-divider-line';
      div.append(l1,lbl,l2); container.appendChild(div);
      catItems.forEach(item=>container.appendChild(buildCsItem(item)));
    });
    return;
  }

  // CATEGORY — items nested inside category dropdown cards
  cats.forEach(cat=>{
    const catItems=displayItems.filter(i=>i.category===cat.id);
    const cStage=getCsStage('cat_'+cat.id);
    const catSection=buildCatSection(cat,catItems,cStage,()=>{
      const cur=getCsStage('cat_'+cat.id);
      if(cur===0){ Object.keys(csOpenState).forEach(k=>{ if(k.startsWith('cat_')) csOpenState[k]=0; }); csOpenState['cat_'+cat.id]=1; }
      else csOpenState['cat_'+cat.id]=0;
      csRender();
    }, body=>{
      catItems.forEach(item=>body.appendChild(buildCsItem(item)));
    });
    container.appendChild(catSection);
  });
}

/* ── MY SHOP ── */
let msSelectedCat='produce';
let msOpenState={};
let msEditItemId=null;

function openMsCatModal(itemId){
  msEditItemId=itemId; modalCtx='ms-cat'; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
  document.getElementById('modalTitle').textContent='Category';
  buildModalGrid(); document.getElementById('modalOverlay').classList.add('open');
}

function openMsUnitModal(itemId){
  msEditItemId=itemId; modalCtx='ms-unit'; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null;
  document.getElementById('modalTitle').textContent='Unit';
  buildModalGrid();
  document.getElementById('modalOverlay').classList.add('open');
}

function openMsCatModal(itemId){
  msEditItemId=itemId; modalCtx='ms-cat'; modalSelPend=null; modalDelPend.clear();
  editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
  document.getElementById('modalTitle').textContent='Category';
  buildModalGrid();
  document.getElementById('modalOverlay').classList.add('open');
}
const msDelPend=new Set();
const msAddedSet=new Set();

function updateMsBtn(){
  document.getElementById('msCatLabel').textContent=getCat(msSelectedCat).label;
}

function msPopulate(name,category){
  const items=ls('ms_items',[]);
  if(items.some(i=>i.name.toLowerCase()===name.toLowerCase())) return;
  items.push({id:'ms_'+Date.now()+Math.random(),name,category,unit:'unit'});
  lsSet('ms_items',items);
}

function msAdd(){
  const inp=document.getElementById('msInput'), name=inp.value.trim(); if(!name) return;
  msPopulate(name,msSelectedCat); inp.value=''; inp.focus(); msRender(); csRender();
}

function msDelete(id){
  msDelPend.delete(id);
  const item=ls('ms_items',[]).find(i=>i.id===id);
  const itemName=item?.name?.toLowerCase()||'';
  // Remove from My Store
  lsSet('ms_items',ls('ms_items',[]).filter(i=>i.id!==id));
  // Remove from Comp Shop entries
  lsSet('cs_entries',ls('cs_entries',[]).filter(e=>e.itemId!==id));
  // Remove from Grocery List (match by name since gl uses name not id)
  if(itemName) lsSet('gl_items',ls('gl_items',[]).filter(i=>i.name.toLowerCase()!==itemName));
  // Remove from Pantry data
  const pd=ls('pantry_data',{}); delete pd[id]; lsSet('pantry_data',pd);
  // Remove from pantry usage logs
  lsSet('pantry_usage',ls('pantry_usage',{})[id]?Object.fromEntries(Object.entries(ls('pantry_usage',{})).filter(([k])=>k!==id)):{});
  lsSet('pantry_usage_log',ls('pantry_usage_log',[]).filter(e=>e.id!==id));
  msRender(); csRender(); glRender(); ptRender();
}

function msSetUnit(id, unitId){
  const items=ls('ms_items',[]);
  const item=items.find(i=>i.id===id); if(!item) return;
  item.unit=unitId; lsSet('ms_items',items);
  msRender(); csRender();
}

function msSetCat(id, catId){
  const items=ls('ms_items',[]);
  const item=items.find(i=>i.id===id); if(!item) return;
  item.category=catId; lsSet('ms_items',items);
  // sync grocery list items with matching name
  const gl=ls('gl_items',[]);
  let changed=false;
  gl.forEach(g=>{ if(g.name.toLowerCase()===item.name.toLowerCase()){ g.category=catId; changed=true; } });
  if(changed) lsSet('gl_items',gl);
  msRender(); glRender();
}

function msAddToGrocery(id){
  const item=ls('ms_items',[]).find(i=>i.id===id); if(!item) return;
  const gl=ls('gl_items',[]);
  if(!gl.some(i=>i.name.toLowerCase()===item.name.toLowerCase()&&!i.checked)){
    gl.push({id:'gl_'+Date.now()+Math.random(),name:item.name,category:item.category,checked:false});
    lsSet('gl_items',gl);
    trackCatUsage(item.category);
    glRender();
  }
  msAddedSet.add(id); msRender();
  setTimeout(()=>{ msAddedSet.delete(id); msRender(); },1500);
}

function getMsStage(catId){ return msOpenState[catId]!==undefined?msOpenState[catId]:0; }

function msToggleCat(catId){
  const cur=getMsStage(catId);
  if(cur===0){ Object.keys(msOpenState).forEach(k=>msOpenState[k]=0); msOpenState[catId]=1;
    msOpenState._savedScrollY=window.scrollY;
    msRender(); focusDimShowById(catId,'#msList');
  } else { msOpenState[catId]=0; focusDimHide();
    document.querySelectorAll('.cs-section,.cat-section').forEach(e=>{e.classList.remove('focus-active','pt-card-wrap');});
    ptScrollBack(msOpenState._savedScrollY); msOpenState._savedScrollY=undefined;
    msRender(); }
}

const msEditPend = new Set();
const msEditingId = {current: null};

function msSaveName(id, newName){
  newName = newName.trim();
  if(!newName) return;
  const items = ls('ms_items',[]);
  const item = items.find(i=>i.id===id); if(!item) return;
  const oldName = item.name;
  item.name = newName;
  lsSet('ms_items', items);
  // sync grocery list
  const gl = ls('gl_items',[]);
  gl.forEach(g=>{ if(g.name.toLowerCase()===oldName.toLowerCase()) g.name=newName; });
  lsSet('gl_items', gl);
  msEditingId.current = null;
  msRender(); glRender();
}

function msBuildRow(item){
  const isAdded=msAddedSet.has(item.id), isPend=msDelPend.has(item.id);
  const onList=ls('gl_items',[]).some(i=>i.name.toLowerCase()===item.name.toLowerCase()&&!i.checked);
  const cat=getCat(item.category);
  const unit=getUnit(item.unit||'unit');
  const isEditing = msEditingId.current === item.id;

  const row=document.createElement('div'); row.className='item-row';

  // add to grocery check
  const addSq=document.createElement('div'); addSq.className='item-check';
  if(isAdded){
    addSq.style.background='var(--color-4)'; addSq.style.color='#fff'; addSq.textContent='✓';
  } else if(onList){
    addSq.style.background='#fff';
    const dot=document.createElement('div');
    dot.style.cssText='width:12px;height:12px;border-radius:50%;background:var(--color-4);flex-shrink:0;';
    addSq.appendChild(dot);
  } else {
    addSq.style.background='#fff'; addSq.style.color='var(--color-4)';
    addSq.style.fontSize='16px'; addSq.style.fontWeight='700'; addSq.textContent='+';
  }
  addSq.style.cursor='pointer';
  addSq.dataset.id=item.id;
  addSq.onclick=e=>{ e.stopPropagation(); msAddToGrocery(e.currentTarget.dataset.id); };

  // name — tapping directly enters edit mode
  let nm;
  if(isEditing){
    nm=document.createElement('input');
    nm.style.cssText='flex:1;min-width:0;background:var(--bg-4);border:none;color:var(--color-10);font-size:10px;font-weight:600;padding:0 8px;outline:none;height:100%;';
    nm.value=item.name;
    nm.onclick=e=>e.stopPropagation();
    nm.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.stopPropagation(); msSaveName(item.id,nm.value); } });
    nm.addEventListener('blur',()=>msSaveName(item.id,nm.value));
    setTimeout(()=>nm.focus(),50);
  } else {
    nm=document.createElement('div'); nm.className='item-name';
    nm.textContent=isAdded?item.name+'  — Added':item.name;
    if(isAdded) nm.style.color='var(--color-4)';
    nm.style.cursor='text';
    nm.onclick=e=>{ e.stopPropagation(); msEditingId.current=item.id; msRender(); };
  }

  // category badge — shows cat name in cat color, taps to change category
  const catBadge=document.createElement('div');
  catBadge.style.cssText=`width:20%;min-width:0;background:var(--bg-2);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${cat.color||'var(--muted)'};cursor:pointer;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;`;
  catBadge.textContent=cat.label;
  catBadge.dataset.id=item.id;
  catBadge.onclick=e=>{ e.stopPropagation(); openMsCatModal(e.currentTarget.dataset.id); };

  // unit badge
  const unitBadge=document.createElement('div');
  unitBadge.style.cssText=`width:20%;min-width:0;background:var(--bg-4);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#fff;cursor:pointer;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;`;
  unitBadge.textContent=unit.label;
  unitBadge.dataset.id=item.id;
  unitBadge.onclick=e=>{ e.stopPropagation(); openMsUnitModal(e.currentTarget.dataset.id); };

  // delete
  const del=document.createElement('button'); del.className='item-del'+(isPend?' pending':''); del.textContent='×';
  del.dataset.id=item.id;
  del.onclick=e=>{
    e.stopPropagation();
    const id=e.currentTarget.dataset.id;
    if(msDelPend.has(id)){ msDelete(id); }
    else { msDelPend.add(id); del.className='item-del pending'; setTimeout(()=>{ msDelPend.delete(id); msRender(); },2000); }
  };

  row.append(addSq,nm,catBadge,unitBadge,del);
  return row;
}

const MS_THINK_PHRASES = [
  'Hmm, let me think about that',
  'Searching the depths of the pantry',
  'Rifling through the shelves',
  'One moment, consulting the grocery gods',
  'Checking every aisle',
  'Scanning the stockroom',
  'Cross-referencing with the pantry oracle',
  'Squinting at the inventory',
  'Flipping through the catalogue',
  'On the hunt',
  'Hang on, I\'m thinking',
  'Give me a second here',
  'Ugh, where did I put that',
  'Oh come ON, it has to be here somewhere',
  'I swear I saw this five minutes ago',
  'Are you kidding me right now',
  'WHY is this so hard',
  'Fine. FINE. Looking.',
  'I don\'t even work here',
  'SELECT * FROM pantry WHERE patience > 0',
  'Running query against the snack database',
  'Indexing the fridge',
  'Compiling results, please stand by',
  'Packet sent, awaiting response',
  'Scanning barcode... beep... beep...',
  'Initiating grocery search protocol',
  'Memory address not found, retrying',
  'Cache miss. Going to disk.',
  'I\'m not drunk, YOU\'re drunk',
  'Hold on the shelf is spinning',
  'The items are all friends here',
  'Every product has a soul you know',
  'What if the grocery list... listed US',
  'I once knew a can of beans. Good times.',
  'Shhh the tomatoes are sleeping',
  'The flour told me to take my time',
  'Time is a flat circle and so is this cracker',
  'Looking for it in the fourth dimension',
  'Communing with the ancient spirits of aisle 7',
  'Asking the universe for guidance',
  'Checking between the couch cushions',
  'Did you try turning the pantry off and on',
  'Have you considered just eating air',
  'Searching... searching... still searching',
  'One moment, adjusting my monocle',
  'Fascinating query, I shall investigate',
  'Dispatching search gnomes immediately',
  'My psychic says it\'s in the back',
  'Consulting the ancient scrolls',
  'Rummaging with great purpose',
];

const MS_FOUND_PHRASES = [
  'Found it! That\'s a solid pick.',
  'There it is. Good taste.',
  'Already on the list! You\'re on top of it.',
  'Yep, that\'s in there. Nice.',
  'Found! Your pantry is well stocked.',
  'Oh that one\'s already here. Well done.',
  'Already accounted for. You\'re ahead of the game.',
  'In the store already. Impressive organization.',
  'That\'s a match. You\'ve got this.',
  'Found and filed. Nothing gets past you.',
];

const MS_SUCCESS_PHRASES = [
  'Added! Your pantry grows stronger.',
  'Done! One more thing you\'ll never forget to buy.',
  'Boom. Added to your store.',
  'In it goes. Good call.',
  'Added! You\'re basically a professional shopper now.',
  'Nice. That\'s now officially in your store.',
  'Done and dusted. It\'s in there.',
  'Added with extreme efficiency.',
  'Locked in. Your future self thanks you.',
  'Noted! Your pantry is leveling up.',
];

let msQuickAddState = null;
let msQuickAddName = '';
let msQuickAddCat = null;
let msQuickAddBuyAmt = '';
let msQuickAddBuyUnit = 'oz';
const MS_BUY_UNITS = ['oz','lbs','g','kg','ml','l','cartons','cans','each'];
let msSearchIdleTimer = null;
let msThinkTimer = null;
let msCurrentThinkPhrase = MS_THINK_PHRASES[0];
csCurrentThinkPhrase = MS_THINK_PHRASES[0];
glCurrentThinkPhrase = MS_THINK_PHRASES[0];

let msThinkCardEl = null;

function msGetOrCreateThinkCard(){
  if(msThinkCardEl) return msThinkCardEl;
  const qaCard=document.createElement('div');
  qaCard.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;
  const txt=document.createElement('div');
  txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;';
  const phraseText = msCurrentThinkPhrase.replace(/[.…]+$/, '');
  txt.innerHTML = phraseText + '<span class="thinking-dots" style="font-style:normal;margin-left:1px;"><span>.</span><span>.</span><span>.</span></span>';
  qaCard.appendChild(txt);
  msThinkCardEl = qaCard;
  return qaCard;
}

function msPickNextThinkPhrase(){
  const available = MS_THINK_PHRASES.filter(p=>p!==msCurrentThinkPhrase);
  msCurrentThinkPhrase = available[Math.floor(Math.random()*available.length)];
  msThinkCardEl = null;
}

let msThinkPhraseSet = false;

function msSearchInput(){
  clearTimeout(msSearchIdleTimer);
  clearInterval(msThinkTimer);
  const q = (document.getElementById('msSearch')?.value||'').trim();
  if(!q){ msThinkPhraseSet=false; msQuickAddState=null; msQuickAddName=''; msThinkCardEl=null; msRender(); return; }
  // if user types again after idle fired, reset back to thinking
  if(msQuickAddState && msQuickAddState!=='pick-cat' && msQuickAddState!=='confirm' && msQuickAddState!=='pick-buysize'){
    msQuickAddState=null; msThinkCardEl=null; msPickNextThinkPhrase();
  }
  if(!msThinkPhraseSet){ msPickNextThinkPhrase(); msThinkPhraseSet=true; }
  msRender();
  msSearchIdleTimer = setTimeout(()=>{
    clearInterval(msThinkTimer);
    const allItems = ls('ms_items',[]);
    const qWords = q.toLowerCase().split(/\s+/);
    const exists = allItems.some(i=>{
      const nWords = i.name.toLowerCase().split(/\s+/);
      return qWords.every(qw=>nWords.includes(qw));
    });
    msQuickAddState = exists ? 'found' : 'confirm';
    msQuickAddName = q;
    msRender();
  }, 2000);
}


function msRender(){
  const ap=document.getElementById('msAddPanel');
  if(ap) ap.style.display=msShowAddPanel?'':'none';
  const container=document.getElementById('msList'); container.innerHTML='';
  const items=ls('ms_items',[]);
  const query=(document.getElementById('msSearch')?.value||'').trim().toLowerCase();

  const thinkSlot = document.getElementById('msThinkSlot');
  if(thinkSlot && !query) thinkSlot.innerHTML = '';
  if(query){
    const results=items.filter(i=>{
      const words=i.name.toLowerCase().split(/\s+/);
      return words.some(w=>w.startsWith(query));
    }).sort((a,b)=>a.name.localeCompare(b.name));

    // reset quick-add if query changed
    if(msQuickAddName.toLowerCase() !== query){ msQuickAddState=null; msQuickAddName=query; }

    // exact match — all words in query must exactly match words in item name
    const queryWords=query.toLowerCase().split(/\s+/);
    const exactExists=items.some(i=>{
      const nameWords=i.name.toLowerCase().split(/\s+/);
      return queryWords.every(qw=>nameWords.includes(qw));
    });
    const displayName=document.getElementById('msSearch')?.value.trim()||query;

    // show card always while query active
    const qaCard=document.createElement('div');
    qaCard.style.cssText=`height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;`;

    if(!msQuickAddState){
      // put think card in slot outside list so innerHTML='' never destroys it
      const slot = document.getElementById('msThinkSlot');
      const card = msGetOrCreateThinkCard();
      if(slot && !slot.contains(card)) slot.appendChild(card);
    } else {
      // clear think slot
      const slot = document.getElementById('msThinkSlot');
      if(slot) slot.innerHTML = '';
      if(msQuickAddState==='success'){
        const ph=MS_SUCCESS_PHRASES[Math.floor(Math.random()*MS_SUCCESS_PHRASES.length)];
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
        txt.textContent=ph; qaCard.appendChild(txt);
      } else if(exactExists || msQuickAddState==='found'){
        const ph=MS_FOUND_PHRASES[Math.floor(Math.random()*MS_FOUND_PHRASES.length)];
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--color-4);';
        txt.textContent=ph;
        qaCard.appendChild(txt);
      } else if(msQuickAddState==='confirm'){
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        txt.innerHTML=`Add <strong style="color:var(--color-10);margin:0 4px;">"${displayName}"</strong> to your store?`;
        const yesBtn=document.createElement('div');
        yesBtn.style.cssText='width:48px;min-width:48px;background:#347ab8;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#fff;cursor:pointer;flex-shrink:0;';
        yesBtn.textContent='YES!';
        yesBtn.onclick=e=>{ e.stopPropagation(); openNewItemOverlay(displayName, ()=>{ msQuickAddState='success'; msRender(); }); };
        qaCard.append(txt,yesBtn);
      } else if(msQuickAddState==='pick-buysize'){
        const bsLbl=document.createElement('div'); bsLbl.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);flex-shrink:0;white-space:nowrap;'; bsLbl.textContent='Buy size:';
        const amtInp=document.createElement('input'); amtInp.type='number'; amtInp.min='0'; amtInp.step='0.1'; amtInp.placeholder='0'; amtInp.value=msQuickAddBuyAmt; amtInp.style.cssText='width:52px;min-width:52px;background:var(--bg-3);border:none;border-left:var(--border-width) solid var(--border-color);color:var(--color-10);font-size:11px;font-weight:700;padding:0 6px;outline:none;font-family:inherit;'; amtInp.oninput=e=>msQuickAddBuyAmt=e.target.value;
        const unitSel=document.createElement('select'); unitSel.style.cssText='width:52px;background:var(--bg-2);border:none;border-left:var(--border-width) solid var(--border-color);color:var(--color-10);font-size:9px;font-weight:700;padding:0 4px;outline:none;font-family:inherit;cursor:pointer;appearance:none;text-align:center;'; MS_BUY_UNITS.forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; if(u===msQuickAddBuyUnit) o.selected=true; unitSel.appendChild(o); }); unitSel.onchange=e=>msQuickAddBuyUnit=e.target.value;
        const saveBtn=document.createElement('div'); saveBtn.style.cssText='width:56px;min-width:56px;background:#1d3318;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#48a971;cursor:pointer;'; saveBtn.textContent='SAVE!';
        saveBtn.onclick=e=>{ e.stopPropagation(); const name=msQuickAddName||displayName; const buyAmt=parseFloat(msQuickAddBuyAmt)||0; const newItem={id:'ms_'+Date.now()+Math.random(),name,category:msQuickAddCat,buySize:{amount:buyAmt,unit:msQuickAddBuyUnit}}; const ms=ls('ms_items',[]); ms.push(newItem); lsSet('ms_items',ms); msQuickAddState='success'; msQuickAddName=''; msQuickAddCat=null; msQuickAddBuyAmt=''; msRender(); };
        qaCard.append(bsLbl,amtInp,unitSel,saveBtn);
        const txt=document.createElement('div');
        txt.style.cssText='flex:1;min-width:0;background:var(--bg-2);display:flex;align-items:center;padding:0 10px;font-size:10px;font-weight:600;color:var(--muted);';
        txt.textContent='Pick your category';
        const okBtn=document.createElement('div');
        okBtn.style.cssText='width:48px;min-width:48px;background:var(--color-4);border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#000;cursor:pointer;flex-shrink:0;';
        okBtn.textContent='OK!';
        okBtn.onclick=e=>{
          e.stopPropagation();
          window._msQuickAddName=msQuickAddName;
          modalCtx='ms-quickadd'; modalSelPend=null; modalDelPend.clear();
          editingColorCatId=null; selectedRootIdx=0; newCatColor=ROOT_COLORS[0].shades[2];
          document.getElementById('modalTitle').textContent='Category';
          buildModalGrid();
          document.getElementById('modalOverlay').classList.add('open');
        };
        qaCard.append(txt,okBtn);
      }
      container.appendChild(qaCard);
    }
    if(results.length) results.forEach(item=>container.appendChild(msBuildRow(item)));
    return;
  }
  msQuickAddState=null; msQuickAddName='';

  // all cats alphabetically, including empty ones
  const allCats=msGetSortedCats();
  allCats.forEach(cat=>{
    const catItems=items.filter(i=>i.category===cat.id).sort((a,b)=>a.name.localeCompare(b.name));
    const stage=getMsStage(cat.id);
    const section=buildCatSection(cat,catItems,stage,()=>msToggleCat(cat.id),body=>{
      if(msInlineAdd){
        const addRow=document.createElement('div');
        addRow.style.cssText='height:var(--drop-height);display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
        const inp=document.createElement('input');
        inp.style.cssText='flex:1;min-width:0;background:var(--bg-3);border:none;color:var(--color-10);font-size:10px;font-weight:600;padding:0 8px;outline:none;';
        inp.placeholder='Add item…'; inp.maxLength=80;
        const addBtn=document.createElement('button');
        addBtn.style.cssText='width:32px;min-width:32px;background:var(--bg-2);border:none;border-left:var(--border-width) solid var(--border-color);color:var(--color-10);font-size:16px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;';
        addBtn.textContent='+';
        const doAdd=()=>{ const name=inp.value.trim(); if(!name) return; msPopulate(name,cat.id); inp.value=''; msRender(); };
        addBtn.onclick=doAdd;
        inp.addEventListener('keydown',e=>{ if(e.key==='Enter') doAdd(); });
        addRow.append(inp,addBtn); body.appendChild(addRow);
      }
      catItems.forEach(item=>body.appendChild(msBuildRow(item)));
    }, '32px');
    section.classList.add('ms');
    container.appendChild(section);
  });
}

document.getElementById('msInput').addEventListener('keydown',e=>{ if(e.key==='Enter') msAdd(); });


