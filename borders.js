// borders.js -- Drawn Borders system
// ============================================================
// ADDING A NEW BORDER TYPE
// 1. Add to DrawnBorders.TYPES: { box(ctx,x,y,w,h,s), div(ctx,ax,ay,bx,by,s) }
// 2. Set appSettings.drawnBorderType = 'myStyle'; DrawnBorders.apply();
//
// ADDING A NEW CARD TYPE
// 1. Write a descriptor: { strip(card), draw(ctx,card,W,H,seed,T) }
// 2. Add querySelectorAll + descriptor to apply() / applyJobWindow()
// 3. Add selector to clear() / clearJobWindow()
// ============================================================
(function(){
  var PAD=3;

  function _rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967295;};}

  function _stroke(ctx,ax,ay,bx,by,seed,os,bow,lw){
    var rand=_rng(seed),dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);
    if(len<1)return;
    var ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    for(var i=0;i<2;i++){
      var off=(rand()-.5)*1.6,os1=os*(0.7+rand()*0.5),os2=os*(0.7+rand()*0.5);
      var sx=ax-ux*os1+nx*off,sy=ay-uy*os1+ny*off,ex=bx+ux*os2+nx*off,ey=by+uy*os2+ny*off;
      var bv=(rand()-.5)*bow,cx=(sx+ex)/2+nx*bv,cy=(sy+ey)/2+ny*bv;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(cx,cy,ex,ey);
      ctx.strokeStyle='#0d0d0d';ctx.lineWidth=lw*(0.9+rand()*0.2);
      ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=0.88+rand()*0.12;ctx.stroke();
    }
  }

  var TYPES={
    pen:{
      box:function(ctx,x,y,w,h,s){
        _stroke(ctx,x,y,x+w,y,s,1.2,2,2.2);_stroke(ctx,x+w,y,x+w,y+h,s+111,1.2,2,2.2);
        _stroke(ctx,x+w,y+h,x,y+h,s+222,1.2,2,2.2);_stroke(ctx,x,y+h,x,y,s+333,1.2,2,2.2);
      },
      div:function(ctx,ax,ay,bx,by,s){_stroke(ctx,ax,ay,bx,by,s,0,1.2,2.0);}
    }
  };

  function _wrap(el){
    if(el.parentNode&&el.parentNode.classList.contains('_db_wrap'))return el.parentNode;
    var w=document.createElement('div'),cs=el.style;
    var ws='position:relative;overflow:visible;';
    if(cs.flex)ws+='flex:'+cs.flex+';';
    if(cs.flexShrink&&cs.flexShrink!=='1')ws+='flex-shrink:'+cs.flexShrink+';';
    if(cs.flexGrow&&cs.flexGrow!=='0')ws+='flex-grow:'+cs.flexGrow+';';
    if(cs.minWidth)ws+='min-width:'+cs.minWidth+';';
    if(cs.width&&cs.width!=='100%')ws+='width:'+cs.width+';';
    w.className='_db_wrap';w.style.cssText=ws;
    el.parentNode.insertBefore(w,el);w.appendChild(el);
    el.style.width='100%';return w;
  }

  function _unwrap(el){
    var w=el.parentNode;
    if(w&&w.classList.contains('_db_wrap')){el.style.width='';w.parentNode.insertBefore(el,w);w.remove();}
  }

  function _strip(el,divFn){
    el.dataset.dbBorder=el.style.border;
    el.dataset.dbRadius=el.style.borderRadius;
    el.style.border='none';el.style.borderRadius='0';
    if(divFn)divFn.strip(el);
  }

  function _restore(el){
    if(el.dataset.dbBorder!==undefined)el.style.border=el.dataset.dbBorder;
    if(el.dataset.dbRadius!==undefined)el.style.borderRadius=el.dataset.dbRadius;
    delete el.dataset.dbBorder;delete el.dataset.dbRadius;
    el.querySelectorAll('[data-db-stripped]').forEach(function(ch){
      var sv=JSON.parse(ch.dataset.dbStripped||'{}');
      Object.keys(sv).forEach(function(p){ch.style[p]=sv[p];});
      delete ch.dataset.dbStripped;
    });
  }

  function _clean(el){
    el.parentNode&&el.parentNode.classList.contains('_db_wrap')
      ?el.parentNode.querySelectorAll('canvas._db_cv').forEach(function(c){c.remove();})
      :el.querySelectorAll('canvas._db_cv').forEach(function(c){c.remove();});
    _restore(el);_unwrap(el);
  }

  // Standard card: wrapped so canvas can overflow freely
  function _applyCard(el,divFn,seed,T){
    _clean(el);_strip(el,divFn);
    var wrap=_wrap(el);
    var W=Math.ceil(wrap.getBoundingClientRect().width);
    var H=Math.ceil(el.getBoundingClientRect().height);
    var cv=document.createElement('canvas');
    cv.className='_db_cv';cv.width=W+PAD*2;cv.height=H+PAD*2;
    cv.style.cssText='position:absolute;top:'+-PAD+'px;left:'+-PAD+'px;width:'+(W+PAD*2)+'px;height:'+(H+PAD*2)+'px;pointer-events:none;z-index:10;';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');ctx.translate(PAD,PAD);
    if(divFn&&divFn.box)divFn.box(ctx,el,W,H,seed,T);else T.box(ctx,1,1,W-2,H-2,seed);
    if(divFn&&divFn.draw)divFn.draw(ctx,el,W,H,seed,T);
  }

  // Inner card: canvas on element itself (for fixed/clipped containers)
  function _applyInner(el,divFn,seed,T){
    _clean(el);_strip(el,divFn);
    if(getComputedStyle(el).position==='static')el.style.position='relative';
    var W=Math.ceil(el.getBoundingClientRect().width);
    var H=Math.ceil(el.getBoundingClientRect().height);
    var cv=document.createElement('canvas');
    cv.className='_db_cv';cv.width=W;cv.height=H;
    cv.style.cssText='position:absolute;top:0;left:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:10;';
    el.appendChild(cv);
    var ctx=cv.getContext('2d');
    if(divFn&&divFn.box)divFn.box(ctx,el,W,H,seed,T);else T.box(ctx,1,1,W-2,H-2,seed);
    if(divFn&&divFn.draw)divFn.draw(ctx,el,W,H,seed,T);
  }

  // ---- Divider descriptors ------------------------------------------------
  var _jobDiv={
    strip:function(card){
      ['.job-card-left','.job-card-right','.job-card-top','.job-card-bottom'].forEach(function(sel){
        var ch=card.querySelector(sel);if(!ch)return;
        var sv={borderRight:ch.style.borderRight,borderLeft:ch.style.borderLeft,borderBottom:ch.style.borderBottom,borderTop:ch.style.borderTop};
        ch.dataset.dbStripped=JSON.stringify(sv);
        ch.style.borderRight='none';ch.style.borderLeft='none';ch.style.borderBottom='none';ch.style.borderTop='none';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var L=card.querySelector('.job-card-left'),R=card.querySelector('.job-card-right'),Top=card.querySelector('.job-card-top');
      if(L)  T.div(ctx,L.offsetWidth,0,L.offsetWidth,H,s+444);
      if(R)  T.div(ctx,W-R.offsetWidth,0,W-R.offsetWidth,H,s+555);
      if(Top)T.div(ctx,L?L.offsetWidth:0,Top.offsetHeight,W-(R?R.offsetWidth:0),Top.offsetHeight,s+666);
    }
  };

  var _qsDiv={
    strip:function(card){
      card.querySelectorAll('.qs-day-hdr,.qs-axis').forEach(function(ch){
        var sv={borderTop:ch.style.borderTop,borderBottom:ch.style.borderBottom,borderRadius:ch.style.borderRadius};
        ch.dataset.dbStripped=JSON.stringify(sv);
        ch.style.borderTop='none';ch.style.borderBottom='none';ch.style.borderRadius='0';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var seen={};
      card.querySelectorAll('.qs-day-hdr,.qs-axis').forEach(function(ch){
        var yt=ch.offsetTop;if(!seen[yt]){seen[yt]=1;T.div(ctx,0,yt,W,yt,s+yt*7);}
        if(ch.classList.contains('qs-day-hdr')){var yb=ch.offsetTop+ch.offsetHeight;if(!seen[yb]){seen[yb]=1;T.div(ctx,0,yb,W,yb,s+yb*7+333);}}
      });
    }
  };

  var _histDiv={
    strip:function(card){
      (function walk(el){
        if(el!==card&&(el.style.borderTop||el.style.borderRight)){
          var sv={};
          if(el.style.borderTop){sv.borderTop=el.style.borderTop;el.style.borderTop='none';}
          if(el.style.borderRight){sv.borderRight=el.style.borderRight;el.style.borderRight='none';}
          el.dataset.dbStripped=JSON.stringify(sv);
        }
        Array.from(el.children).forEach(walk);
      })(card);
    },
    draw:function(ctx,card,W,H,s,T){
      var cr=card.getBoundingClientRect(),seenH={},seenV={};
      card.querySelectorAll('[data-db-stripped]').forEach(function(el){
        var sv=JSON.parse(el.dataset.dbStripped||'{}'),er=el.getBoundingClientRect();
        if(sv.borderTop){var y=Math.round(er.top-cr.top);if(!seenH[y]){seenH[y]=1;T.div(ctx,0,y,W,y,s+y*7);}}
        if(sv.borderRight){var x=Math.round(er.right-cr.left),yt=Math.round(er.top-cr.top);if(!seenV[x]){seenV[x]=1;T.div(ctx,x,yt,x,H,s+x*7+555);}}
      });
    }
  };

  var _filterDiv={
    strip:function(card){
      card.querySelectorAll('.filter-btn').forEach(function(btn,idx){
        if(idx===0)return;
        var sv={borderLeft:btn.style.borderLeft};btn.dataset.dbStripped=JSON.stringify(sv);btn.style.borderLeft='none';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var cr=card.getBoundingClientRect();
      var btns=card.querySelectorAll('.filter-btn');
      btns.forEach(function(btn,idx){
        if(idx<btns.length-1){var x=Math.round(btn.getBoundingClientRect().right-cr.left);T.div(ctx,x,0,x,H,s+idx*111);}
      });
    }
  };

  var _dayCardDiv={
    strip:function(card){
      ['.day-letter','.day-date','.day-hours'].forEach(function(sel){
        var ch=card.querySelector(sel);if(!ch)return;
        var sv={borderRight:ch.style.borderRight,borderLeft:ch.style.borderLeft};
        ch.dataset.dbStripped=JSON.stringify(sv);ch.style.borderRight='none';ch.style.borderLeft='none';
      });
      card.querySelectorAll('.day-body-half').forEach(function(ch){
        var sv={borderRight:ch.style.borderRight};ch.dataset.dbStripped=JSON.stringify(sv);ch.style.borderRight='none';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var letter=card.querySelector('.day-letter'),date=card.querySelector('.day-date'),hours=card.querySelector('.day-hours'),halves=card.querySelectorAll('.day-body-half');
      var lw=letter?letter.offsetWidth:0,dw=date?date.offsetWidth:0;
      if(letter)T.div(ctx,lw,0,lw,H,s+111);
      if(date)  T.div(ctx,lw+dw,0,lw+dw,H,s+222);
      if(hours) T.div(ctx,W-hours.offsetWidth,0,W-hours.offsetWidth,H,s+333);
      if(halves.length>=2)T.div(ctx,lw+dw+halves[0].offsetWidth,0,lw+dw+halves[0].offsetWidth,H,s+444);
    }
  };

  var _totalsDiv={
    strip:function(card){var lbl=card.querySelector('.totals-label');if(!lbl)return;var sv={borderRight:lbl.style.borderRight};lbl.dataset.dbStripped=JSON.stringify(sv);lbl.style.borderRight='none';},
    draw:function(ctx,card,W,H,s,T){var lbl=card.querySelector('.totals-label');if(lbl)T.div(ctx,lbl.offsetWidth,0,lbl.offsetWidth,H,s+111);}
  };

  var _hdrTabDiv={
    box:function(ctx,el,W,H,s,T){T.div(ctx,0,H-1,W,H-1,s);},
    strip:function(el){
      el.querySelectorAll('.header-action-btn').forEach(function(btn){var sv={borderRight:btn.style.borderRight};btn.dataset.dbStripped=JSON.stringify(sv);btn.style.borderRight='none';});
    },
    draw:function(ctx,el,W,H,s,T){
      var x=0,btns=el.querySelectorAll('.header-action-btn');
      btns.forEach(function(btn,idx){x+=btn.offsetWidth;if(idx<btns.length-1)T.div(ctx,x,0,x,H,s+idx*111);});
    }
  };

  var _dataWinHdrDiv={
    box:function(ctx,el,W,H,s,T){T.div(ctx,0,H-1,W,H-1,s);},
    strip:function(el){
      ['.data-window-back','.data-window-settings'].forEach(function(sel){
        var ch=el.querySelector(sel);if(!ch)return;
        var sv={borderRight:ch.style.borderRight,borderLeft:ch.style.borderLeft};
        ch.dataset.dbStripped=JSON.stringify(sv);ch.style.borderRight='none';ch.style.borderLeft='none';
      });
    },
    draw:function(ctx,el,W,H,s,T){
      var back=el.querySelector('.data-window-back'),sett=el.querySelector('.data-window-settings');
      if(back)T.div(ctx,back.offsetWidth,0,back.offsetWidth,H,s+111);
      if(sett)T.div(ctx,W-sett.offsetWidth,0,W-sett.offsetWidth,H,s+222);
    }
  };

  // ---- Two-pass apply: strip+wrap all, then measure+draw after layout settles
  function _batchApply(items,T){
    // Phase 1: strip + wrap
    items.forEach(function(item){
      _clean(item.el);_strip(item.el,item.divFn);item.wrap=_wrap(item.el);
    });
    // Phase 2: measure + draw (layout fully settled)
    items.forEach(function(item){
      var el=item.el,wrap=item.wrap,divFn=item.divFn,seed=item.seed;
      var W=Math.ceil(wrap.getBoundingClientRect().width);
      var H=Math.ceil(el.getBoundingClientRect().height);
      var cv=document.createElement('canvas');
      cv.className='_db_cv';cv.width=W+PAD*2;cv.height=H+PAD*2;
      cv.style.cssText='position:absolute;top:'+-PAD+'px;left:'+-PAD+'px;width:'+(W+PAD*2)+'px;height:'+(H+PAD*2)+'px;pointer-events:none;z-index:10;';
      wrap.appendChild(cv);
      var ctx=cv.getContext('2d');ctx.translate(PAD,PAD);
      if(divFn&&divFn.box)divFn.box(ctx,el,W,H,seed,T);else T.box(ctx,1,1,W-2,H-2,seed);
      if(divFn&&divFn.draw)divFn.draw(ctx,el,W,H,seed,T);
    });
  }

  function _getT(){return TYPES[(appSettings&&appSettings.drawnBorderType)||'pen']||TYPES.pen;}
  function _item(el,divFn,seed){return {el:el,divFn:divFn,seed:seed};}
  var _i=0;function _s(mult){return(++_i*mult+Math.random()*999)|0;}

  var _nwColorDiv={
    strip:function(card){
      card.querySelectorAll('.nw-swatch').forEach(function(sw,idx,all){
        if(idx===all.length-1)return;
        var sv={borderRight:sw.style.borderRight};sw.dataset.dbStripped=JSON.stringify(sv);sw.style.borderRight='none';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var cr=card.getBoundingClientRect();
      var sws=card.querySelectorAll('.nw-swatch');
      sws.forEach(function(sw,idx){
        if(idx<sws.length-1){var x=Math.round(sw.getBoundingClientRect().right-cr.left);T.div(ctx,x,0,x,H,s+idx*97);}
      });
    }
  };

  var _dowDiv={
    strip:function(card){
      card.querySelectorAll('.dow-btn').forEach(function(btn,idx,all){
        if(idx===all.length-1)return;
        var sv={borderRight:btn.style.borderRight};btn.dataset.dbStripped=JSON.stringify(sv);btn.style.borderRight='none';
      });
    },
    draw:function(ctx,card,W,H,s,T){
      var cr=card.getBoundingClientRect();
      var btns=card.querySelectorAll('.dow-btn');
      btns.forEach(function(btn,idx){
        if(idx<btns.length-1){var x=Math.round(btn.getBoundingClientRect().right-cr.left);T.div(ctx,x,0,x,H,s+idx*97);}
      });
    }
  };

  window.DrawnBorders={
    TYPES:TYPES,

    apply:function(){
      var ma=document.getElementById('mainApp');if(!ma)return;
      var T=_getT();_i=0;
      var ht=document.getElementById('headerTab');
      if(ht)_applyInner(ht,_hdrTabDiv,_s(9001),T);
      var items=[];
      ma.querySelectorAll('.job-card').forEach(function(el){items.push(_item(el,_jobDiv,_s(4371)));});
      ma.querySelectorAll('.label-card').forEach(function(el){items.push(_item(el,null,_s(8113)));});
      ma.querySelectorAll('.qs-card').forEach(function(el){items.push(_item(el,_qsDiv,_s(6271)));});
      ma.querySelectorAll('.hist-card').forEach(function(el){items.push(_item(el,_histDiv,_s(5939)));});
      _batchApply(items,T);
    },

    applyNewWindow:function(){DrawnBorders._applyFormWindow('newWindow');},
    clearNewWindow:function(){DrawnBorders._clearFormWindow('newWindow');},
    applyJobSettingsWindow:function(){DrawnBorders._applyFormWindow('jobSettingsWindow');},
    clearJobSettingsWindow:function(){DrawnBorders._clearFormWindow('jobSettingsWindow');},

    _applyFormWindow:function(id){
      var win=document.getElementById(id);if(!win)return;
      var T=_getT();_i=0;
      var hdr=win.querySelector('.data-window-header');
      if(hdr)_applyInner(hdr,_dataWinHdrDiv,_s(8221),T);
      var items=[];
      win.querySelectorAll('.label-card').forEach(function(el){items.push(_item(el,null,_s(8113)));});
      win.querySelectorAll('.nw-title-card').forEach(function(el){items.push(_item(el,null,_s(3311)));});
      win.querySelectorAll('.nw-color-card').forEach(function(el){items.push(_item(el,_nwColorDiv,_s(5517)));});
      win.querySelectorAll('.dow-card').forEach(function(el){items.push(_item(el,_dowDiv,_s(4423)));});
      win.querySelectorAll('.toggle-card').forEach(function(el){items.push(_item(el,null,_s(6631)));});
      win.querySelectorAll('.clear-card').forEach(function(el){items.push(_item(el,null,_s(4447)));});
      win.querySelectorAll('.delete-card').forEach(function(el){items.push(_item(el,null,_s(3359)));});
      win.querySelectorAll('.nw-footer').forEach(function(el){items.push(_item(el,null,_s(7771)));});
      _batchApply(items,T);
    },

    _clearFormWindow:function(id){
      var win=document.getElementById(id);if(!win)return;
      var hdr=win.querySelector('.data-window-header');if(hdr){hdr.querySelectorAll('canvas._db_cv').forEach(function(c){c.remove();});_restore(hdr);}
      win.querySelectorAll('.label-card,.nw-title-card,.nw-color-card,.dow-card,.toggle-card,.clear-card,.delete-card,.nw-footer').forEach(function(el){_clean(el);});
    },

    applyJobWindow:function(){
      var jw=document.getElementById('jobWindow');if(!jw)return;
      var T=_getT();_i=0;
      var hdr=jw.querySelector('.data-window-header');
      if(hdr)_applyInner(hdr,_dataWinHdrDiv,_s(8221),T);
      var items=[];
      jw.querySelectorAll('.filter-card').forEach(function(el){items.push(_item(el,_filterDiv,_s(5501)));});
      jw.querySelectorAll('.day-card').forEach(function(el){items.push(_item(el,_dayCardDiv,_s(3719)));});
      jw.querySelectorAll('.day-card-plus').forEach(function(el){items.push(_item(el,null,_s(2311)));});
      jw.querySelectorAll('.dc-row>div>div:last-child').forEach(function(el){items.push(_item(el,null,_s(1999)));});
      jw.querySelectorAll('.totals-card').forEach(function(el){items.push(_item(el,_totalsDiv,_s(7211)));});
      jw.querySelectorAll('.label-card').forEach(function(el){items.push(_item(el,null,_s(8113)));});
      jw.querySelectorAll('.date-range-card').forEach(function(el){items.push(_item(el,null,_s(6133)));});
      jw.querySelectorAll('.clear-card').forEach(function(el){items.push(_item(el,null,_s(4447)));});
      _batchApply(items,T);
    },

    clearJobWindow:function(){
      var jw=document.getElementById('jobWindow');if(!jw)return;
      var hdr=jw.querySelector('.data-window-header');if(hdr){hdr.querySelectorAll('canvas._db_cv').forEach(function(c){c.remove();});_restore(hdr);}
      jw.querySelectorAll('.filter-card,.day-card,.day-card-plus,.totals-card,.label-card,.date-range-card,.clear-card').forEach(function(el){_clean(el);});
      jw.querySelectorAll('.dc-row>div>div:last-child').forEach(function(el){_clean(el);});
    },

    clear:function(){
      var ht=document.getElementById('headerTab');if(ht){ht.querySelectorAll('canvas._db_cv').forEach(function(c){c.remove();});_restore(ht);}
      var ma=document.getElementById('mainApp');if(!ma)return;
      ma.querySelectorAll('.job-card,.label-card,.qs-card,.hist-card').forEach(function(el){_clean(el);});
      DrawnBorders.clearJobWindow();
      DrawnBorders.clearNewWindow();
      DrawnBorders.clearJobSettingsWindow();
    }
  };

  window.applyDrawnBorders=function(){DrawnBorders.apply();};
  window.clearDrawnBorders =function(){DrawnBorders.clear();};
})();
