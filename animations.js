// ── DOT GRID ENTER / EXIT ANIMATIONS ─────────────────────────────────────────
var _DG_CX=17,_DG_CY=17,_DG_OR=14,_DG_IR=7,_DG_N7=12,_DG_N5=6,_DG_DUR=600;
var _dgLastIdx=-1;

function _dgEaseIn(t){return t*t*t;}
function _dgEaseOut(t){return 1-Math.pow(1-t,3);}
function _dgBounce(t){var b=7.5625,d=2.75;if(t<1/d)return b*t*t;else if(t<2/d){t-=1.5/d;return b*t*t+0.75;}else if(t<2.5/d){t-=2.25/d;return b*t*t+0.9375;}else{t-=2.625/d;return b*t*t+0.984375;}}

function _dgGetDots(btn){
  var svg=btn.querySelector('svg'); if(!svg) return null;
  var cs=Array.from(svg.querySelectorAll('circle'));
  return {outer:cs.slice(0,_DG_N7), inner:cs.slice(_DG_N7)};
}
function _dgReset(o,i){
  o.forEach(function(c,j){
    var a=(2*Math.PI*j/_DG_N7)-Math.PI/2;
    c.setAttribute('cx',(_DG_CX+_DG_OR*Math.cos(a)).toFixed(2));
    c.setAttribute('cy',(_DG_CY+_DG_OR*Math.sin(a)).toFixed(2));
    c.setAttribute('r','2.2'); c.style.opacity='1'; c.style.transform='';
  });
  i.forEach(function(c,j){
    var a=(2*Math.PI*j/_DG_N5)-Math.PI/2;
    c.setAttribute('cx',(_DG_CX+_DG_IR*Math.cos(a)).toFixed(2));
    c.setAttribute('cy',(_DG_CY+_DG_IR*Math.sin(a)).toFixed(2));
    c.setAttribute('r','2.2'); c.style.opacity='1'; c.style.transform='';
  });
}
function _dgHide(o,i){ o.concat(i).forEach(function(c){c.style.opacity='0';}); }

function _dgAnimate(btn, fn, dur, onDone){
  if(btn._dgRunning) return;
  btn._dgRunning=true;
  var start=null;
  function step(ts){
    if(!start) start=ts;
    var t=Math.min((ts-start)/dur,1);
    fn(t);
    if(t<1) requestAnimationFrame(step);
    else { btn._dgRunning=false; if(onDone) onDone(); }
  }
  requestAnimationFrame(step);
}

// 10 CSS transform combos for pixel mode dot grid (whole-SVG animation)
var _DG_PX_EXITS=[
  'rotate(180deg) scale(0)',
  'rotate(-180deg) scale(0)',
  'translateY(-150%) scale(0.3)',
  'translateY(150%) scale(0.3)',
  'translateX(150%) scale(0.3)',
  'translateX(-150%) scale(0.3)',
  'rotate(360deg) scale(0)',
  'scale(2.5) rotate(60deg)',
  'rotate(-90deg) scale(0)',
  'scale(0) rotate(540deg)'
];
var _DG_PX_ENTERS=[
  'rotate(-180deg) scale(0)',
  'rotate(180deg) scale(0)',
  'translateY(150%) scale(0.3)',
  'translateY(-150%) scale(0.3)',
  'translateX(-150%) scale(0.3)',
  'translateX(150%) scale(0.3)',
  'rotate(-360deg) scale(0)',
  'scale(0) rotate(-60deg)',
  'rotate(90deg) scale(0)',
  'scale(0) rotate(-540deg)'
];

var _DG_ANIMS=[

  // 0 — Orbit half-spin
  { exit: function(t,o,i){
      var e=_dgEaseIn(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2)+e*Math.PI; c.setAttribute('cx',(_DG_CX+_DG_OR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*Math.sin(a)).toFixed(2)); c.style.opacity=(1-_dgEaseIn(t)).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2)-e*Math.PI; c.setAttribute('cx',(_DG_CX+_DG_IR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*Math.sin(a)).toFixed(2)); c.style.opacity=(1-_dgEaseIn(t)).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgEaseOut(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2)-e*Math.PI; c.setAttribute('cx',(_DG_CX+_DG_OR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2)+e*Math.PI; c.setAttribute('cx',(_DG_CX+_DG_IR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
    }},

  // 1 — Explode outward / bounce in from center
  { exit: function(t,o,i){
      var s=1+_dgEaseIn(t)*2.5;
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*s*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*s*Math.sin(a)).toFixed(2)); c.style.opacity=(1-t).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*s*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*s*Math.sin(a)).toFixed(2)); c.style.opacity=(1-t).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgBounce(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
    }},

  // 2 — Stagger fade+shrink / stagger grow+fade
  { exit: function(t,o,i){
      o.concat(i).forEach(function(c,j){
        var d=j*0.04, lt=Math.max(0,Math.min((t-d)/(1-d*0.8),1));
        c.setAttribute('r',(2.2*(1-_dgEaseIn(lt)*0.95)).toFixed(2));
        c.style.opacity=(1-_dgEaseIn(lt)).toFixed(2);
      });
    },
    enter: function(t,o,i){
      o.concat(i).forEach(function(c,j){
        var d=j*0.04, lt=Math.max(0,Math.min((t-d)/(1-d*0.8),1));
        c.setAttribute('r',(2.2*_dgEaseOut(lt)).toFixed(2));
        c.style.opacity=_dgEaseOut(lt).toFixed(2);
      });
    }},

  // 3 — Spiral collapse / spiral expand
  { exit: function(t,o,i){
      var e=_dgEaseIn(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2)+e*Math.PI*3; c.setAttribute('cx',(_DG_CX+_DG_OR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2)-e*Math.PI*3; c.setAttribute('cx',(_DG_CX+_DG_IR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgEaseOut(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2)-(1-e)*Math.PI*3; c.setAttribute('cx',(_DG_CX+_DG_OR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*e*Math.sin(a)).toFixed(2)); c.style.opacity=e.toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2)+(1-e)*Math.PI*3; c.setAttribute('cx',(_DG_CX+_DG_IR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*e*Math.sin(a)).toFixed(2)); c.style.opacity=e.toFixed(2);});
    }},

  // 4 — Stagger drop out / stagger bounce in from top
  { exit: function(t,o,i){
      i.concat(o).forEach(function(c,j){
        var d=j/(_DG_N5+_DG_N7)*0.5, lt=Math.max(0,Math.min((t-d)/0.5,1)), e=_dgEaseIn(lt);
        var isI=j<_DG_N5, orig=isI?j:(j-_DG_N5);
        var tx=isI?_DG_CX+_DG_IR*Math.cos(2*Math.PI*orig/_DG_N5-Math.PI/2):_DG_CX+_DG_OR*Math.cos(2*Math.PI*orig/_DG_N7-Math.PI/2);
        var ty=isI?_DG_CY+_DG_IR*Math.sin(2*Math.PI*orig/_DG_N5-Math.PI/2):_DG_CY+_DG_OR*Math.sin(2*Math.PI*orig/_DG_N7-Math.PI/2);
        c.setAttribute('cx',tx.toFixed(2)); c.setAttribute('cy',(ty+14*e).toFixed(2)); c.style.opacity=(1-_dgEaseIn(lt)).toFixed(2);
      });
    },
    enter: function(t,o,i){
      o.concat(i).forEach(function(c,j){
        var d=j/(_DG_N7+_DG_N5)*0.5, lt=Math.max(0,Math.min((t-d)/0.5,1)), e=_dgBounce(lt);
        var isO=j<_DG_N7, orig=isO?j:(j-_DG_N7);
        var tx=isO?_DG_CX+_DG_OR*Math.cos(2*Math.PI*orig/_DG_N7-Math.PI/2):_DG_CX+_DG_IR*Math.cos(2*Math.PI*orig/_DG_N5-Math.PI/2);
        var ty=isO?_DG_CY+_DG_OR*Math.sin(2*Math.PI*orig/_DG_N7-Math.PI/2):_DG_CY+_DG_IR*Math.sin(2*Math.PI*orig/_DG_N5-Math.PI/2);
        c.setAttribute('cx',tx.toFixed(2)); c.setAttribute('cy',(ty-12*(1-e)).toFixed(2)); c.style.opacity=_dgEaseOut(lt).toFixed(2);
      });
    }},

  // 5 — Collapse to center / burst from center with bounce
  { exit: function(t,o,i){
      var e=_dgEaseIn(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgBounce(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
    }},

  // 6 — Scatter to fixed offsets / gather with bounce
  { _s: null,
    exit: function(t,o,i){
      if(!this._s){this._s=[];for(var k=0;k<_DG_N7+_DG_N5;k++)this._s.push({x:Math.sin(k*2.4)*22,y:Math.cos(k*1.7)*22});}
      var e=_dgEaseIn(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*Math.cos(a)+this._s[j].x*e).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*Math.sin(a)+this._s[j].y*e).toFixed(2)); c.style.opacity=(1-t).toFixed(2);}.bind(this));
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*Math.cos(a)+this._s[_DG_N7+j].x*e).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*Math.sin(a)+this._s[_DG_N7+j].y*e).toFixed(2)); c.style.opacity=(1-t).toFixed(2);}.bind(this));
    },
    enter: function(t,o,i){
      if(!this._s){this._s=[];for(var k=0;k<_DG_N7+_DG_N5;k++)this._s.push({x:Math.sin(k*2.4)*22,y:Math.cos(k*1.7)*22});}
      var e=_dgBounce(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); var tx=_DG_CX+_DG_OR*Math.cos(a),ty=_DG_CY+_DG_OR*Math.sin(a); c.setAttribute('cx',(tx-this._s[j].x*(1-e)).toFixed(2)); c.setAttribute('cy',(ty-this._s[j].y*(1-e)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);}.bind(this));
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); var tx=_DG_CX+_DG_IR*Math.cos(a),ty=_DG_CY+_DG_IR*Math.sin(a); c.setAttribute('cx',(tx-this._s[_DG_N7+j].x*(1-e)).toFixed(2)); c.setAttribute('cy',(ty-this._s[_DG_N7+j].y*(1-e)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);}.bind(this));
    }},

  // 7 — Warp grow+dissolve / shrink in
  { exit: function(t,o,i){
      var e=_dgEaseIn(t);
      o.forEach(function(c){c.setAttribute('r',(2.2+8*e).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
      i.forEach(function(c){c.setAttribute('r',(2.2+5*e).toFixed(2)); c.style.opacity=(1-e).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgEaseOut(t);
      o.forEach(function(c){c.setAttribute('r',(2.2+8*(1-e)).toFixed(2)); c.style.opacity=e.toFixed(2);});
      i.forEach(function(c){c.setAttribute('r',(2.2+5*(1-e)).toFixed(2)); c.style.opacity=e.toFixed(2);});
    }},

  // 8 — Wave ripple drain / wave ripple fill
  { exit: function(t,o,i){
      i.forEach(function(c,j){var d=j/_DG_N5*0.4, lt=Math.max(0,Math.min((t-d)/0.6,1)), e=_dgEaseIn(lt); var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-lt).toFixed(2);});
      o.forEach(function(c,j){var d=0.2+j/_DG_N7*0.4, lt=Math.max(0,Math.min((t-d)/0.6,1)), e=_dgEaseIn(lt); var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*(1-e)*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*(1-e)*Math.sin(a)).toFixed(2)); c.style.opacity=(1-lt).toFixed(2);});
    },
    enter: function(t,o,i){
      o.forEach(function(c,j){var d=j/_DG_N7*0.4, lt=Math.max(0,Math.min((t-d)/0.6,1)), e=_dgEaseOut(lt); var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*e*Math.sin(a)).toFixed(2)); c.style.opacity=e.toFixed(2);});
      i.forEach(function(c,j){var d=0.2+j/_DG_N5*0.4, lt=Math.max(0,Math.min((t-d)/0.6,1)), e=_dgEaseOut(lt); var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*e*Math.sin(a)).toFixed(2)); c.style.opacity=e.toFixed(2);});
    }},

  // 9 — Swap radii / bounce back
  { exit: function(t,o,i){
      var e=_dgEaseIn(t); var oR=_DG_OR+(_DG_IR-_DG_OR)*e, iR=_DG_IR+(_DG_OR-_DG_IR)*e;
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2)+e*Math.PI; c.setAttribute('cx',(_DG_CX+oR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+oR*Math.sin(a)).toFixed(2)); c.style.opacity=(1-Math.min(1,e*1.3)).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2)-e*Math.PI; c.setAttribute('cx',(_DG_CX+iR*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+iR*Math.sin(a)).toFixed(2)); c.style.opacity=(1-Math.min(1,e*1.3)).toFixed(2);});
    },
    enter: function(t,o,i){
      var e=_dgBounce(t);
      o.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N7-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_OR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_OR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
      i.forEach(function(c,j){var a=(2*Math.PI*j/_DG_N5-Math.PI/2); c.setAttribute('cx',(_DG_CX+_DG_IR*e*Math.cos(a)).toFixed(2)); c.setAttribute('cy',(_DG_CY+_DG_IR*e*Math.sin(a)).toFixed(2)); c.style.opacity=_dgEaseOut(t).toFixed(2);});
    }},
];

function playDotGridExit(btn){
  var isPxl=document.body.classList.contains('pxl-font');
  var idx;
  do { idx=Math.floor(Math.random()*_DG_ANIMS.length); } while(idx===_dgLastIdx && _DG_ANIMS.length>1);
  _dgLastIdx=idx; btn._dgAnimIdx=idx;
  if(isPxl){
    var svg=btn.querySelector('svg'); if(!svg) return;
    svg.style.transition='none'; svg.style.transform=''; svg.style.opacity='1';
    svg.style.transformOrigin='50% 50%';
    requestAnimationFrame(function(){
      svg.style.transition='transform '+_DG_DUR+'ms ease-in, opacity '+_DG_DUR+'ms ease-in';
      svg.style.transform=_DG_PX_EXITS[idx%_DG_PX_EXITS.length];
      svg.style.opacity='0';
    });
    return;
  }
  var p=_dgGetDots(btn); if(!p) return;
  _dgAnimate(btn, function(t){ _DG_ANIMS[idx].exit(t,p.outer,p.inner); }, _DG_DUR, function(){
    _dgHide(p.outer,p.inner);
  });
}

function playDotGridEnter(btn){
  var isPxl=document.body.classList.contains('pxl-font');
  var idx=btn._dgAnimIdx!==undefined ? btn._dgAnimIdx : 0;
  if(isPxl){
    var svg=btn.querySelector('svg'); if(!svg) return;
    svg.style.transition='none';
    svg.style.transform=_DG_PX_ENTERS[idx%_DG_PX_ENTERS.length];
    svg.style.opacity='0';
    svg.style.transformOrigin='50% 50%';
    requestAnimationFrame(function(){
      svg.style.transition='transform '+_DG_DUR+'ms ease-out, opacity '+_DG_DUR+'ms ease-out';
      svg.style.transform='';
      svg.style.opacity='';
    });
    return;
  }
  var p=_dgGetDots(btn); if(!p) return;
  _dgHide(p.outer,p.inner);
  _dgAnimate(btn, function(t){ _DG_ANIMS[idx].enter(t,p.outer,p.inner); }, _DG_DUR, function(){
    _dgReset(p.outer,p.inner);
  });
}

// ── BACK BUTTON ANIMATIONS ────────────────────────────────────────────────────
var _BB_LAST = -1;
var _BB_DUR = 560;

function _bbEI(t){return t*t*t;}
function _bbEO(t){return 1-Math.pow(1-t,3);}
function _bbEIO(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;}
function _bbBn(t){var b=7.5625,d=2.75;if(t<1/d)return b*t*t;else if(t<2/d){t-=1.5/d;return b*t*t+.75;}else if(t<2.5/d){t-=2.25/d;return b*t*t+.9375;}else{t-=2.625/d;return b*t*t+.984375;}}

function _bbRun(btn, fn, dur){
  var start=null;
  function step(ts){if(!start)start=ts;var t=Math.min((ts-start)/(dur||_BB_DUR),1);fn(t);if(t<1)requestAnimationFrame(step);else _bbReset(btn);}
  requestAnimationFrame(step);
}
function _bbReset(btn){
  var svg=btn.querySelector('svg'); if(!svg) return;
  svg.style.cssText='';
  var ls=svg.querySelectorAll('line');
  if(!ls.length) return; // pixel svg uses rects — transform reset is enough
  ls[0].setAttribute('x1','42');ls[0].setAttribute('y1','10');ls[0].setAttribute('x2','8');ls[0].setAttribute('y2','25');ls[0].setAttribute('stroke-width','5');
  ls[1].setAttribute('x1','42');ls[1].setAttribute('y1','40');ls[1].setAttribute('x2','8');ls[1].setAttribute('y2','25');ls[1].setAttribute('stroke-width','5');
}

var _BB_ANIMS=[
  // 11 Pulse Up
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var sc;if(t<.4)sc=1+_bbEO(t/.4)*.7;else sc=1.7-_bbBn((t-.4)/.6)*.7;sv.style.transform='scale('+sc.toFixed(2)+')';});},
  // 13 Rubber
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var sx,sy;if(t<.22){var e=_bbEI(t/.22);sx=1-e*.38;sy=1+e*.38;}else if(t<.55){var e2=_bbEO((t-.22)/.33);sx=.62+e2*.58;sy=1.38-e2*.58;}else{var e3=_bbBn((t-.55)/.45);sx=1.2-e3*.2;sy=.8+e3*.2;}sv.style.transform='scaleX('+sx.toFixed(2)+') scaleY('+sy.toFixed(2)+')';},_BB_DUR*1.1);},
  // 14 Heartbeat
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var sc=1;if(t<.12)sc=1+_bbEO(t/.12)*.65;else if(t<.28)sc=1.65-_bbEI((t-.12)/.16)*.4;else if(t<.42)sc=1.25+_bbEO((t-.28)/.14)*.7;else if(t<.62)sc=1.95-_bbEI((t-.42)/.2)*.95;else sc=1+_bbBn((t-.62)/.38)*.12;sv.style.transform='scale('+sc.toFixed(2)+')';},_BB_DUR*1.2);},
  // 17 Jelly
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var sc=1+Math.sin(t*Math.PI*4)*.3*(1-t);var ss=1-Math.sin(t*Math.PI*4)*.3*(1-t);sv.style.transform='scaleX('+sc.toFixed(2)+') scaleY('+ss.toFixed(2)+')';},_BB_DUR*1.2);},
  // 18 Micro Pulse
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var sc=1+Math.sin(t*Math.PI*5)*.15*(1-t);sv.style.transform='scale('+sc.toFixed(2)+')';});},
  // 21 Spin 360
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){sv.style.transform='rotate('+(_bbEO(t)*-360).toFixed(1)+'deg)';},_BB_DUR*1.1);},
  // 22 Reverse 180
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var deg;if(t<.45)deg=_bbEI(t/.45)*180;else deg=180+_bbBn((t-.45)/.55)*180;sv.style.transform='rotate('+deg.toFixed(1)+'deg)';},_BB_DUR*1.3);},
  // 23 Tilt
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){var deg;if(t<.35)deg=_bbEO(t/.35)*-35;else deg=-35+_bbBn((t-.35)/.65)*35;sv.style.transform='rotate('+deg.toFixed(1)+'deg)';});},
  // 24 Wobble
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){sv.style.transform='rotate('+(Math.sin(t*Math.PI*4)*-22*(1-t)).toFixed(1)+'deg)';},_BB_DUR*1.1);},
  // 28 Fast Spin
  function(b){var sv=b.querySelector('svg');_bbRun(b,function(t){sv.style.transform='rotate('+(_bbEIO(t)*-720).toFixed(1)+'deg)';},_BB_DUR*1.2);},
  // 32 Pinch Close
  function(b){var ls=b.querySelectorAll('line');_bbRun(b,function(t){if(t<.4){var e=_bbEI(t/.4)*15;ls[0].setAttribute('y1',(10+e).toFixed(1));ls[1].setAttribute('y1',(40-e).toFixed(1));}else{var e2=_bbBn((t-.4)/.6)*15;ls[0].setAttribute('y1',(25-e2).toFixed(1));ls[1].setAttribute('y1',(25+e2).toFixed(1));}});},
  // 36 Close Shut
  function(b){var ls=b.querySelectorAll('line');_bbRun(b,function(t){if(t<.4){var e=_bbEO(t/.4);var y=25-e*16;ls[0].setAttribute('y1',y.toFixed(1));ls[1].setAttribute('y1',(50-y).toFixed(1));ls[0].setAttribute('y2',y.toFixed(1));ls[1].setAttribute('y2',(50-y).toFixed(1));}else{var e2=_bbBn((t-.4)/.6);var y2=9+e2*16;ls[0].setAttribute('y1',y2.toFixed(1));ls[1].setAttribute('y1',(50-y2).toFixed(1));ls[0].setAttribute('y2','25');ls[1].setAttribute('y2','25');}});},
  // 37 Tip Meet
  function(b){var ls=b.querySelectorAll('line');_bbRun(b,function(t){if(t<.4){var e=_bbEO(t/.4);ls[0].setAttribute('x2',(8+e*17).toFixed(1));ls[0].setAttribute('y2',(25-e*15).toFixed(1));ls[1].setAttribute('x2',(8+e*17).toFixed(1));ls[1].setAttribute('y2',(25+e*15).toFixed(1));}else{var e2=_bbBn((t-.4)/.6);ls[0].setAttribute('x2',(25-e2*17).toFixed(1));ls[0].setAttribute('y2',(10+e2*15).toFixed(1));ls[1].setAttribute('x2',(25-e2*17).toFixed(1));ls[1].setAttribute('y2',(40-e2*15).toFixed(1));}});},
  // 40 Thicken
  function(b){var ls=b.querySelectorAll('line');_bbRun(b,function(t){var sw;if(t<.4)sw=5+_bbEO(t/.4)*10;else sw=15-_bbBn((t-.4)/.6)*10;ls[0].setAttribute('stroke-width',sw.toFixed(1));ls[1].setAttribute('stroke-width',sw.toFixed(1));});},
];

function playBackBtnAnim(btn){
  if(!btn) return;
  var isPxl=document.body.classList.contains('pxl-font');
  var pool=isPxl?10:_BB_ANIMS.length; // pixel: transform-only (0-9); smooth: all 14
  var idx;
  do { idx=Math.floor(Math.random()*pool); } while(idx===_BB_LAST && pool>1);
  _BB_LAST=idx;
  _BB_ANIMS[idx](btn);
}


// ── TIMER MORPH ANIMATIONS ────────────────────────────────────────────────────
var _TM_NS='http://www.w3.org/2000/svg';
var _TM_PLAY =[[3,4,20,12],[3,20,20,12],[3,4,3,20]];
var _TM_PAUSE=[[7,5,7,19],[16,5,16,19],[7,5,7,19]];
var _TM_CHECK=[[3,14,9,20],[9,20,21,6],[3,14,9,20]];
var _TM_ST=[_TM_PLAY,_TM_PAUSE,_TM_CHECK];


// ── PIXEL BLOCK STATES (36 rects, ST=2, viewBox 0 0 24 18) ──────────────────
var _PX_ST=2; // each block = 2×2, flush
var _TM_COLS=['#9ca3af','#e07878','#48a971']; // state colours
function _pxB(col,row){return [col*_PX_ST, row*_PX_ST];}

var _PX_PLAY=[
  _pxB(3,0),_pxB(3,1),_pxB(3,2),_pxB(3,3),_pxB(3,4),_pxB(3,5),_pxB(3,6),_pxB(3,7),_pxB(3,8),
  _pxB(4,0),_pxB(4,1),_pxB(4,2),_pxB(4,3),_pxB(4,4),_pxB(4,5),_pxB(4,6),_pxB(4,7),_pxB(4,8),
  _pxB(5,1),_pxB(5,2),_pxB(5,3),_pxB(5,4),_pxB(5,5),_pxB(5,6),_pxB(5,7),
  _pxB(6,2),_pxB(6,3),_pxB(6,4),_pxB(6,5),_pxB(6,6),
  _pxB(7,3),_pxB(7,4),_pxB(7,5),_pxB(7,6),
  _pxB(8,4),_pxB(8,5)
];
var _PX_PAUSE=[
  _pxB(3,0),_pxB(3,1),_pxB(3,2),_pxB(3,3),_pxB(3,4),_pxB(3,5),_pxB(3,6),_pxB(3,7),_pxB(3,8),
  _pxB(4,0),_pxB(4,1),_pxB(4,2),_pxB(4,3),_pxB(4,4),_pxB(4,5),_pxB(4,6),_pxB(4,7),_pxB(4,8),
  _pxB(7,0),_pxB(7,1),_pxB(7,2),_pxB(7,3),_pxB(7,4),_pxB(7,5),_pxB(7,6),_pxB(7,7),_pxB(7,8),
  _pxB(8,0),_pxB(8,1),_pxB(8,2),_pxB(8,3),_pxB(8,4),_pxB(8,5),_pxB(8,6),_pxB(8,7),_pxB(8,8)
];
var _PX_CHECK=[
  _pxB(0,3),_pxB(0,4),_pxB(0,5),_pxB(1,4),_pxB(1,5),_pxB(1,6),_pxB(2,5),_pxB(2,6),_pxB(2,7),_pxB(3,6),_pxB(3,7),_pxB(3,8),
  _pxB(4,6),_pxB(4,7),_pxB(4,8),_pxB(5,5),_pxB(5,6),_pxB(5,7),_pxB(6,4),_pxB(6,5),_pxB(6,6),
  _pxB(7,3),_pxB(7,4),_pxB(7,5),_pxB(8,2),_pxB(8,3),_pxB(8,4),_pxB(9,1),_pxB(9,2),_pxB(9,3),
  _pxB(10,0),_pxB(10,1),_pxB(10,2),_pxB(11,0),_pxB(11,1),_pxB(11,2)
];
var _PX_STATES=[_PX_PLAY,_PX_PAUSE,_PX_CHECK];
// play→pause: Y first; pause→check: X first; check→play: Y first
var _PX_XFIRST=[false, true, false];

function buildTimerPxSvg(si){
  var svg=document.createElementNS(_TM_NS,'svg');
  svg.setAttribute('width','26');svg.setAttribute('height','20');
  svg.setAttribute('viewBox','-1 -1 26 20');svg.setAttribute('fill','none');
  svg.setAttribute('shape-rendering','crispEdges');svg.setAttribute('data-tm','1');
  var S=_PX_STATES[si],col=_TM_COLS[si];
  S.forEach(function(pos){
    var el=document.createElementNS(_TM_NS,'rect');
    el.setAttribute('x',pos[0]);el.setAttribute('y',pos[1]);
    el.setAttribute('width',_PX_ST);el.setAttribute('height',_PX_ST);
    el.setAttribute('fill',col);svg.appendChild(el);
  });
  return svg;
}

function buildTimerPxSvgStr(si){
  var S=_PX_STATES[si],col=_TM_COLS[si];
  var rs=S.map(function(pos){return '<rect x="'+pos[0]+'" y="'+pos[1]+'" width="'+_PX_ST+'" height="'+_PX_ST+'" fill="'+col+'"/>';}).join('');
  return '<svg width="26" height="20" viewBox="-1 -1 26 20" fill="none" shape-rendering="crispEdges" data-tm="1">'+rs+'</svg>';
}

// Save timer state without full re-render (for pixel morph)
function _pxSaveState(job,state,key,todayKey){
  if(state==='idle'){
    job.worked[todayKey]={start:nowTimeStr(),end:null}; lsSet('sch_jobs',jobs);
  } else if(state==='running'){
    job.worked[key].end=nowTimeStr(); lsSet('sch_jobs',jobs);
    if(typeof renderHistory==='function'){buildHistory();renderHistory();}
  } else {
    job.worked[todayKey]={start:nowTimeStr(),end:null}; lsSet('sch_jobs',jobs);
  }
}

function _pxMorphTwoPhase(rects,fi,ti,dur,cb){
  var fS=_PX_STATES[fi],tS=_PX_STATES[ti];
  var xFirst=_PX_XFIRST[fi];
  var fC=_TM_COLS[fi],tC=_TM_COLS[ti];
  var half=Math.round(dur*0.5)+'ms';

  // Set each rect at its FROM position via x/y attrs, clear any transform
  rects.forEach(function(r,i){
    r.setAttribute('x',fS[i][0]); r.setAttribute('y',fS[i][1]);
    r.setAttribute('fill',fC); r.style.transform=''; r.style.transition='';
  });

  // Phase 1: slide each rect to its intermediate position (Y or X axis first)
  requestAnimationFrame(function(){
    rects.forEach(function(r,i){
      var dx=xFirst ? tS[i][0]-fS[i][0] : 0;
      var dy=xFirst ? 0 : tS[i][1]-fS[i][1];
      r.style.transition='transform '+half+' ease-in-out, fill '+half+' ease';
      r.style.transform='translate('+dx+'px,'+dy+'px)';
      r.setAttribute('fill',tC);
    });

    // Phase 2: after phase 1 completes, snap X or Y attr then slide the remaining axis
    setTimeout(function(){
      rects.forEach(function(r,i){
        r.style.transition='';
        if(xFirst){
          r.setAttribute('x',tS[i][0]); r.style.transform='';
        } else {
          r.setAttribute('y',tS[i][1]); r.style.transform='';
        }
      });
      requestAnimationFrame(function(){
        rects.forEach(function(r,i){
          var dx=xFirst ? 0 : tS[i][0]-fS[i][0];
          var dy=xFirst ? tS[i][1]-fS[i][1] : 0;
          r.style.transition='transform '+half+' ease-in-out';
          r.style.transform='translate('+dx+'px,'+dy+'px)';
        });
        setTimeout(function(){
          rects.forEach(function(r,i){
            r.style.transition=''; r.style.transform='';
            r.setAttribute('x',tS[i][0]); r.setAttribute('y',tS[i][1]);
          });
          if(cb)cb();
        }, dur*0.5+50);
      });
    }, dur*0.5+50);
  });
}

// String versions for use inside innerHTML template strings
function buildTimerSvgStr(si){
  var S=_TM_ST[si],col=_TM_COLS[si];
  var lines=S.map(function(c){return '<line x1="'+c[0]+'" y1="'+c[1]+'" x2="'+c[2]+'" y2="'+c[3]+'" stroke="'+col+'" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>';}).join('');
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" data-tm="1">'+lines+'</svg>';
}

// Build 3-line smooth SVG element at a given state
function buildTimerSvg(si){
  var svg=document.createElementNS(_TM_NS,'svg');
  svg.setAttribute('width','22');svg.setAttribute('height','22');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
  svg.setAttribute('data-tm','1');
  var S=_TM_ST[si],col=_TM_COLS[si];
  S.forEach(function(coords){
    var l=document.createElementNS(_TM_NS,'line');
    l.setAttribute('x1',coords[0]);l.setAttribute('y1',coords[1]);
    l.setAttribute('x2',coords[2]);l.setAttribute('y2',coords[3]);
    l.setAttribute('stroke',col);l.setAttribute('stroke-width','2.8');
    l.setAttribute('stroke-linecap','round');l.setAttribute('stroke-linejoin','round');
    svg.appendChild(l);
  });
  return svg;
}

// 11 smooth animation variants
var _TM_ANIMS=[
  function(ls,fS,tS,fC,tC,d,cb){_tmMorph(ls,fS,tS,_tmEO,d,fC,tC,0,cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmMorph(ls,fS,tS,_tmBack,d,fC,tC,0,cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmMorph(ls,fS,tS,function(t){return t;},d,fC,tC,0,cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmMorph(ls,fS,tS,_tmEIO,d,fC,tC,0,cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmMorph(ls,fS,tS,_tmEO,d,fC,tC,0.25,cb);},
  function(ls,fS,tS,fC,tC,d,cb){var step=d/3;function go(i){if(i>=3){cb();return;}var cOff=i/3;_tmTw(step,function(t){var e=_tmEIO(t);_tmSetLine(ls[i],_tmLp(fS[i][0],tS[i][0],e),_tmLp(fS[i][1],tS[i][1],e),_tmLp(fS[i][2],tS[i][2],e),_tmLp(fS[i][3],tS[i][3],e),_tmLc(fC,tC,cOff+e/3));},function(){go(i+1);});}go(0);},
  function(ls,fS,tS,fC,tC,d,cb){_tmTw(d,function(t){var e=_tmEO(t),osc=Math.sin(t*Math.PI*5)*Math.pow(0.3,t*4)*10;ls.forEach(function(l,i){_tmSetLine(l,_tmLp(fS[i][0],tS[i][0],e)+osc,_tmLp(fS[i][1],tS[i][1],e)+osc*.4,_tmLp(fS[i][2],tS[i][2],e)-osc*.4,_tmLp(fS[i][3],tS[i][3],e)-osc,_tmLc(fC,tC,e));});},cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmTw(d,function(t){var e=t<.18?-_tmEO(t/.18)*.2:_tmEO((t-.18)/.82);ls.forEach(function(l,i){_tmSetLine(l,_tmLp(fS[i][0],tS[i][0],e),_tmLp(fS[i][1],tS[i][1],e),_tmLp(fS[i][2],tS[i][2],e),_tmLp(fS[i][3],tS[i][3],e),_tmLc(fC,tC,Math.max(0,e)));});},cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmTw(d,function(t){ls.forEach(function(l,i){var mx=(_tmLp(fS[i][0],fS[i][2],.5)),my=(_tmLp(fS[i][1],fS[i][3],.5));var x1,y1,x2,y2;if(t<.28){var e=_tmEI(t/.28);x1=_tmLp(fS[i][0],mx,e);y1=_tmLp(fS[i][1],my,e);x2=_tmLp(fS[i][2],mx,e);y2=_tmLp(fS[i][3],my,e);}else{var e2=_tmBn((t-.28)/.72);x1=_tmLp(mx,tS[i][0],e2);y1=_tmLp(my,tS[i][1],e2);x2=_tmLp(mx,tS[i][2],e2);y2=_tmLp(my,tS[i][3],e2);}_tmSetLine(l,x1,y1,x2,y2,_tmLc(fC,tC,_tmEIO(t)));});},cb);},
  function(ls,fS,tS,fC,tC,d,cb){_tmTw(d,function(t){var e=_tmEIO(t);ls.forEach(function(l,i){var fx=(fS[i][0]+fS[i][2])/2,fy=(fS[i][1]+fS[i][3])/2,tx=(tS[i][0]+tS[i][2])/2,ty=(tS[i][1]+tS[i][3])/2;var cx=_tmLp(fx,tx,e),cy=_tmLp(fy,ty,e),ang=_tmEI(t)*Math.PI*(i%2===0?1:-1),ca=Math.cos(ang),sa=Math.sin(ang);var r1x=_tmLp(fS[i][0]-fx,tS[i][0]-tx,e),r1y=_tmLp(fS[i][1]-fy,tS[i][1]-ty,e),r2x=_tmLp(fS[i][2]-fx,tS[i][2]-tx,e),r2y=_tmLp(fS[i][3]-fy,tS[i][3]-ty,e);_tmSetLine(l,cx+r1x*ca-r1y*sa,cy+r1x*sa+r1y*ca,cx+r2x*ca-r2y*sa,cy+r2x*sa+r2y*ca,_tmLc(fC,tC,e));});},cb);},
  function(ls,fS,tS,fC,tC,d,cb){var WX=12,WY=12;_tmTw(d*.42,function(t){var e=_tmEI(t);ls.forEach(function(l,i){_tmSetLine(l,_tmLp(fS[i][0],WX,e),_tmLp(fS[i][1],WY,e),_tmLp(fS[i][2],WX,e),_tmLp(fS[i][3],WY,e),_tmLc(fC,tC,e*.5));});},function(){_tmTw(d*.58,function(t){var e=_tmBn(t);ls.forEach(function(l,i){_tmSetLine(l,_tmLp(WX,tS[i][0],e),_tmLp(WY,tS[i][1],e),_tmLp(WX,tS[i][2],e),_tmLp(WY,tS[i][3],e),_tmLc(fC,tC,.5+e*.5));});},cb);});},
];

var _tmLastAnim=[-1,-1,-1];


// ── PIXEL MORPH VARIANTS ─────────────────────────────────────────────────────
var _pxLastVar=[-1,-1,-1];

function _pxApplyCSS(rects,fS,tS,fC,tC,dur,ease,stagger,cb){
  rects.forEach(function(r,i){
    r.setAttribute('x',fS[i][0]);r.setAttribute('y',fS[i][1]);
    r.setAttribute('fill',fC);r.style.transform='';r.style.transition='';
  });
  requestAnimationFrame(function(){
    var maxD=stagger*(rects.length-1);
    rects.forEach(function(r,i){
      var d=stagger?i*stagger:0;
      var dx=tS[i][0]-fS[i][0],dy=tS[i][1]-fS[i][1];
      r.style.transition='transform '+dur+'ms '+ease+' '+d+'ms,fill '+Math.round(dur*0.5)+'ms ease '+d+'ms';
      r.style.transform='translate('+dx+'px,'+dy+'px)';
      r.setAttribute('fill',tC);
    });
    setTimeout(function(){
      rects.forEach(function(r,i){r.setAttribute('x',tS[i][0]);r.setAttribute('y',tS[i][1]);r.style.transition='';r.style.transform='';});
      if(cb)cb();
    },dur+maxD+60);
  });
}

function _pxWormhole(rects,fS,tS,fi,ti,dur,cb){
  var CX=6*_PX_ST,CY=4*_PX_ST;
  var fC=_TM_COLS[fi],tC=_TM_COLS[ti];
  rects.forEach(function(r,i){r.setAttribute('x',fS[i][0]);r.setAttribute('y',fS[i][1]);r.setAttribute('fill',fC);r.style.transform='';r.style.transition='';});
  requestAnimationFrame(function(){
    var h1=Math.round(dur*0.4)+'ms';
    rects.forEach(function(r,i){r.style.transition='transform '+h1+' ease-in';r.style.transform='translate('+(CX-fS[i][0])+'px,'+(CY-fS[i][1])+'px)';});
    setTimeout(function(){
      rects.forEach(function(r,i){r.style.transition='';r.style.transform='';r.setAttribute('x',CX);r.setAttribute('y',CY);r.setAttribute('fill',tC);});
      requestAnimationFrame(function(){
        var h2=Math.round(dur*0.6)+'ms';
        rects.forEach(function(r,i){r.style.transition='transform '+h2+' ease-out';r.style.transform='translate('+(tS[i][0]-CX)+'px,'+(tS[i][1]-CY)+'px)';});
        setTimeout(function(){rects.forEach(function(r,i){r.setAttribute('x',tS[i][0]);r.setAttribute('y',tS[i][1]);r.style.transition='';r.style.transform='';});if(cb)cb();},dur*0.6+60);
      });
    },dur*0.4+60);
  });
}

function _pxScatter(rects,fS,tS,fi,ti,dur,cb){
  var seeds=rects.map(function(_,i){return{x:Math.sin(i*2.4)*20,y:Math.cos(i*1.7)*20};});
  var fC=_TM_COLS[fi],tC=_TM_COLS[ti];
  rects.forEach(function(r,i){r.setAttribute('x',fS[i][0]);r.setAttribute('y',fS[i][1]);r.setAttribute('fill',fC);r.style.transform='';r.style.transition='';});
  requestAnimationFrame(function(){
    var h1=Math.round(dur*0.35)+'ms';
    rects.forEach(function(r,i){r.style.transition='transform '+h1+' ease-in';r.style.transform='translate('+seeds[i].x+'px,'+seeds[i].y+'px)';});
    setTimeout(function(){
      rects.forEach(function(r,i){var sx=fS[i][0]+seeds[i].x,sy=fS[i][1]+seeds[i].y;r.setAttribute('x',sx.toFixed(1));r.setAttribute('y',sy.toFixed(1));r.setAttribute('fill',tC);r.style.transition='';r.style.transform='';});
      requestAnimationFrame(function(){
        var h2=Math.round(dur*0.65)+'ms';
        rects.forEach(function(r,i){var sx=fS[i][0]+seeds[i].x,sy=fS[i][1]+seeds[i].y;r.style.transition='transform '+h2+' ease-out';r.style.transform='translate('+(tS[i][0]-sx).toFixed(1)+'px,'+(tS[i][1]-sy).toFixed(1)+'px)';});
        setTimeout(function(){rects.forEach(function(r,i){r.setAttribute('x',tS[i][0]);r.setAttribute('y',tS[i][1]);r.style.transition='';r.style.transform='';});if(cb)cb();},dur*0.65+60);
      });
    },dur*0.35+60);
  });
}

var _PX_VARIANTS=[
  // 0 Two-phase Y→X (play→pause, check→play)
  function(rs,fS,tS,fi,ti,d,cb){_pxMorphTwoPhase(rs,fi,ti,d,cb);},
  // 1 Two-phase X→Y (pause→check)
  function(rs,fS,tS,fi,ti,d,cb){_pxMorphTwoPhase(rs,fi,ti,d,cb);},
  // 2 Diagonal ease-in-out
  function(rs,fS,tS,fi,ti,d,cb){_pxApplyCSS(rs,fS,tS,_TM_COLS[fi],_TM_COLS[ti],d,'ease-in-out',0,cb);},
  // 3 Back overshoot
  function(rs,fS,tS,fi,ti,d,cb){_pxApplyCSS(rs,fS,tS,_TM_COLS[fi],_TM_COLS[ti],d,'cubic-bezier(0.68,-0.55,0.265,1.55)',0,cb);},
  // 4 Stagger left→right
  function(rs,fS,tS,fi,ti,d,cb){_pxApplyCSS(rs,fS,tS,_TM_COLS[fi],_TM_COLS[ti],Math.round(d*0.7),'ease-out',15,cb);},
  // 5 Stagger right→left
  function(rs,fS,tS,fi,ti,d,cb){var rr=rs.slice().reverse(),ff=fS.slice().reverse(),tt=tS.slice().reverse();_pxApplyCSS(rr,ff,tt,_TM_COLS[fi],_TM_COLS[ti],Math.round(d*0.7),'ease-out',15,cb);},
  // 6 Wormhole
  function(rs,fS,tS,fi,ti,d,cb){_pxWormhole(rs,fS,tS,fi,ti,d,cb);},
  // 7 Scatter
  function(rs,fS,tS,fi,ti,d,cb){_pxScatter(rs,fS,tS,fi,ti,d,cb);},
  // 8 Fast snap with back ease
  function(rs,fS,tS,fi,ti,d,cb){_pxApplyCSS(rs,fS,tS,_TM_COLS[fi],_TM_COLS[ti],Math.round(d*0.6),'cubic-bezier(0.34,1.56,0.64,1)',0,cb);},
  // 9 Ease-out simple
  function(rs,fS,tS,fi,ti,d,cb){_pxApplyCSS(rs,fS,tS,_TM_COLS[fi],_TM_COLS[ti],d,'ease-out',0,cb);},
];

function playPxMorph(rects,fi,ti,dur,cb){
  var idx;
  do{idx=Math.floor(Math.random()*_PX_VARIANTS.length);}while(idx===_pxLastVar[fi]&&_PX_VARIANTS.length>1);
  _pxLastVar[fi]=idx;
  _PX_VARIANTS[idx](rects,rects.map(function(_,i){return _PX_STATES[fi][i];}),rects.map(function(_,i){return _PX_STATES[ti][i];}),fi,ti,dur,cb);
}

function playTimerMorph(el, fromSi, toSi, cb){
  var svg=el.querySelector('svg[data-tm]');
  if(!svg){if(cb)cb();return;}
  var isPxl=document.body.classList.contains('pxl-font');
  if(isPxl){
    var rects=Array.from(svg.querySelectorAll('rect'));
    if(rects.length===36){ playPxMorph(rects,fromSi,toSi,700,cb); }
    else{if(cb)cb();}
  } else {
    // Smooth: CSS scale exit then re-render grows in
    svg.style.transition='transform 0.25s ease,opacity 0.25s ease';
    svg.style.transform='scale(0)';
    svg.style.opacity='0';
    setTimeout(function(){ if(cb)cb(); }, 260);
  }
}
