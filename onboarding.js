/* ── PANTRY PRO · onboarding.js ──────────────────────────────────────
   Step-by-step first-run guide. Uses the Grocery List search flow
   entirely — My Store is never opened.
   Steps:
     1. Search   — type in the Grocery List search bar
     2. Confirm  — tap YES on the confirm card
     3. Category — pick from modal (double tap)
     4. Unit     — pick from modal (double tap)
     5. Save     — tap Add to My Store
── */

(function(){

  let _step = 0;
  let _hooksInstalled = false;

  function obIsActive(){
    return !ls('onboarded', false) || ls('onboarding_mode', false);
  }

  function obDismiss(){
    lsSet('onboarded', true); lsSet('onboarding_mode', false);
    _step = 0; _teardown();
  }

  function _obComplete(newItem){
    lsSet('onboarded', true); lsSet('onboarding_mode', false);
    _step = 0; _teardown();
    const t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:calc(60px + var(--margin));left:var(--margin);right:var(--margin);z-index:600;background:#0f1a12;border:3px solid #48a971;border-radius:var(--radius);padding:16px;transition:opacity 0.4s ease;';
    t.innerHTML='<div style="font-size:15px;font-weight:900;color:#48a971;letter-spacing:0.02em;">'+(newItem?'"'+newItem.name+'" added':'Item added')+'</div><div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.55);margin-top:5px;line-height:1.45;">It\'s on your grocery list and in your store. Open My Pantry to start tracking stock.</div>';
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),400); },3500);
  }

  /* ── Teardown ── */
  function _teardown(){
    document.body.style.overflow='';
    ['obTop','obBottom','obLeft','obRight','obHint'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.remove();
    });
  }

  /* ── Spotlight ── */
  function _spotlight(rect, title, body, zBase, padding){
    _teardown();
    document.body.style.overflow='hidden';
    const P=padding||8, Z=zBase||490;
    const t=Math.max(0,rect.top-P), b=Math.min(window.innerHeight,rect.bottom+P);
    const l=Math.max(0,rect.left-P), r=Math.min(window.innerWidth,rect.right+P);
    const DIM='rgba(0,0,0,0.82)';
    const base='position:fixed;z-index:'+Z+';background:'+DIM+';pointer-events:all;touch-action:none;';
    function pane(id,s){ const d=document.createElement('div'); d.id=id; d.style.cssText=base+s; document.body.appendChild(d); }
    pane('obTop',    'top:0;left:0;right:0;height:'+t+'px;');
    pane('obBottom', 'top:'+b+'px;left:0;right:0;bottom:0;');
    pane('obLeft',   'top:'+t+'px;left:0;width:'+l+'px;height:'+(b-t)+'px;');
    pane('obRight',  'top:'+t+'px;left:'+r+'px;right:0;height:'+(b-t)+'px;');
    _showHint(title, body, Z+1, b);
  }

  /* ── Hint card ── */
  function _showHint(title, body, z, spotlightBottom){
    const old=document.getElementById('obHint'); if(old) old.remove();
    const H=window.innerHeight;
    const card=document.createElement('div');
    card.id='obHint';
    card.style.cssText='position:fixed;z-index:'+(z||491)+';pointer-events:all;left:var(--margin);right:var(--margin);background:#0f1a12;border:3px solid #48a971;border-radius:var(--radius);overflow:hidden;';

    const inner=document.createElement('div');
    inner.style.cssText='padding:16px 16px 14px;';

    const titleEl=document.createElement('div');
    titleEl.style.cssText='font-size:16px;font-weight:900;color:#48a971;line-height:1.2;letter-spacing:0.02em;';
    titleEl.textContent=title;

    const bodyEl=document.createElement('div');
    bodyEl.style.cssText='font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);margin-top:7px;line-height:1.5;';
    bodyEl.textContent=body;

    const foot=document.createElement('div');
    foot.style.cssText='display:flex;align-items:center;gap:5px;margin-top:12px;';
    for(let i=1;i<=5;i++){
      const d=document.createElement('div');
      d.style.cssText='height:6px;border-radius:999px;background:'+(i===_step?'#48a971':'rgba(255,255,255,0.18)')+';width:'+(i===_step?'20px':'6px')+';flex-shrink:0;';
      foot.appendChild(d);
    }
    const skip=document.createElement('div');
    skip.style.cssText='margin-left:auto;font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.22);cursor:pointer;';
    skip.textContent='Skip';
    skip.onclick=obDismiss;
    foot.appendChild(skip);

    inner.append(titleEl,bodyEl,foot);
    card.appendChild(inner);
    document.body.appendChild(card);

    // Position below spotlight if space, else above footer
    requestAnimationFrame(()=>{
      const cardH=card.offsetHeight||120;
      const sb=spotlightBottom||0;
      if(sb>0 && H-sb-8>=cardH){
        card.style.top=(sb+8)+'px';
      } else {
        card.style.bottom='calc(60px + 8px)';
      }
    });
  }

  /* ── Steps ── */

  function _setStep(n){ _step=n;
    if(n===1) _step1(); else if(n===2) _step2();
    else if(n===3) _step3(); else if(n===4) _step4();
    else if(n===5) _step5();
  }

  function _step1(){
    const wrap=document.querySelector('#pageGrocery .ms-search-wrap');
    const inp=document.getElementById('glSearch');
    if(!wrap||!inp) return;
    const rect=wrap.getBoundingClientRect();
    _spotlight(rect,
      'Search for an item you buy regularly',
      'Type something like "milk", "bread" or "coffee" — tap the search bar above to start',
      490, 6
    );
    function _onInput(){
      if(_step!==1||!inp.value.trim()) return;
      inp.removeEventListener('input',_onInput);
      _teardown();
      document.body.style.overflow='hidden';
      _showHint('Keep typing...','A confirm card will appear — wait a moment after you stop typing',491,0);
    }
    inp.addEventListener('input',_onInput);
  }

  function _step2(){
    function _try(){
      const slot=document.getElementById('glThinkSlot');
      const child=slot&&slot.firstElementChild;
      if(!child||child.offsetHeight===0){ setTimeout(_try,150); return; }
      _spotlight(child.getBoundingClientRect(),
        'Tap YES to add it to your list',
        'This adds the item to your grocery list and saves it to your store',
        490, 6
      );
    }
    _try();
  }

  function _step3(){
    setTimeout(()=>{
      let target=null;
      document.querySelectorAll('div').forEach(el=>{
        if(el.textContent.trim()==='TAP TO PICK CATEGORY'&&el.offsetParent) target=el.parentElement||el;
      });
      if(!target){ setTimeout(()=>_step3(),150); return; }
      _spotlight(target.getBoundingClientRect(),
        'Pick a category for this item',
        'Tap once to highlight, tap again to confirm',
        490, 6
      );
    },200);
  }

  function _step4(){
    setTimeout(()=>{
      // Check if modal just opened
      const mo=document.getElementById('modalOverlay');
      if(mo&&mo.classList.contains('open')){
        const modal=mo.querySelector('.modal');
        if(modal){
          _spotlight(modal.getBoundingClientRect(),
            'Pick a unit of measurement',
            'Tap once to highlight, tap again to confirm',
            410, 0
          );
          return;
        }
      }
      let target=null;
      document.querySelectorAll('div').forEach(el=>{
        if(el.textContent.trim()==='TAP TO PICK UNIT'&&el.offsetParent) target=el.parentElement||el;
      });
      if(!target){ setTimeout(()=>_step4(),150); return; }
      _spotlight(target.getBoundingClientRect(),
        'Now pick a unit of measurement',
        'Tap to open units — tap once to highlight, again to confirm',
        490, 6
      );
    },200);
  }

  function _step5(){
    setTimeout(()=>{
      let target=null;
      document.querySelectorAll('div').forEach(el=>{
        if(el.textContent.trim()==='Add to My Store'&&el.offsetParent) target=el.closest('[style*="card-height"]')||el.parentElement||el;
      });
      if(!target){ setTimeout(()=>_step5(),150); return; }
      _spotlight(target.getBoundingClientRect(),
        'Tap to save the item',
        'Once saved it will be available in your grocery list, pantry, and comp shop',
        490, 6
      );
    },150);
  }

  /* ── Hooks ── */

  function _installHooks(){
    if(_hooksInstalled) return;
    _hooksInstalled=true;

    // openNewItemOverlay — YES tapped → step 3
    const _origOverlay=window.openNewItemOverlay;
    window.openNewItemOverlay=function(prefillName,onSave){
      const wrappedSave=function(newItem){
        _obComplete(newItem);
        if(onSave) onSave(newItem);
      };
      _origOverlay.call(this,prefillName,wrappedSave);
      if(_step<=2) setTimeout(()=>_setStep(3),200);
    };

    // closeModal — detect category (→ step 4) and unit (→ step 5) confirmations
    const _origClose=window.closeModal;
    window.closeModal=function(){
      const ctx=modalCtx;
      _origClose.apply(this,arguments);
      if(!obIsActive()||_step===0) return;
      if(ctx==='new-item-cat'&&_step===3) setTimeout(()=>_setStep(4),250);
      else if(ctx==='new-item-unit'&&_step===4) setTimeout(()=>_setStep(5),250);
    };

    // glRender — detect confirm card appearing → step 2
    const _origGlRender=window.glRender;
    window.glRender=function(){
      _origGlRender&&_origGlRender.apply(this,arguments);
      if(!obIsActive()||_step===0) return;
      if(typeof glQuickAddState!=='undefined'&&glQuickAddState==='confirm'&&_step===1){
        _setStep(2);
      }
    };

    // MutationObserver — spotlight modal when it opens at step 3/4
    const mo=document.getElementById('modalOverlay');
    if(mo){
      new MutationObserver(()=>{
        if(!obIsActive()||_step===0) return;
        if(mo.classList.contains('open')){
          const modal=mo.querySelector('.modal');
          if(!modal) return;
          if(_step===3) _spotlight(modal.getBoundingClientRect(),'Pick a category','Tap once to highlight, tap again to confirm',410,0);
          else if(_step===4) _spotlight(modal.getBoundingClientRect(),'Pick a unit of measurement','Tap once to highlight, tap again to confirm',410,0);
        }
      }).observe(mo,{attributes:true,attributeFilter:['class']});
    }
  }

  /* ── Public entry ── */

  window.obInit=function(){
    if(!obIsActive()) return;
    _teardown();
    _step=0;
    _installHooks();
    if(window.setPage) setPage('Grocery');
    setTimeout(()=>{
      _setStep(1);
      const inp=document.getElementById('glSearch');
      if(inp) inp.focus();
    },200);
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{ if(obIsActive()) window.obInit(); },350);
  });

})();
