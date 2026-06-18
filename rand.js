// rand.js -- Randomize Tab for Theme Builder
// Loaded separately to keep theme.js under 100KB

// -- INJECT CSS ---------------------------------------------------------------
(function () {
  var s = document.createElement('style');
  s.textContent = `
  .tb-rand-chip {
    flex: 1; cursor: pointer; position: relative;
    border-right: var(--border-width) solid var(--border-color);
    display: flex; align-items: center; justify-content: center;
    height: var(--job-half); font-size: 8px; font-weight: 900;
    color: var(--text-mid); background: var(--bg-2);
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .tb-rand-chip:last-child { border-right: none; }
  .tb-rc-hdr {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-3);
    border-bottom: var(--border-width) solid var(--border-color);
    height: var(--job-half); padding: 0 8px;
  }
  .tb-rc-lbl {
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
    color: var(--text-mid);
  }
  .tb-rc-val {
    font-size: var(--text-xs); font-weight: 700;
    text-transform: uppercase; color: var(--text-mid);
  }
  .tb-rc-card {
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden;
  }
  .tb-rc-chips { display: flex; flex-wrap: wrap; }
  .tb-rslider {
    flex: 1; min-width: 0; height: 100%;
    appearance: none; -webkit-appearance: none;
    outline: none; border: none; cursor: pointer; padding: 0 6px;
  }
  .tb-rc-primary {
    height: var(--job-half);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
  }
  .tb-rc-btns {
    display: flex;
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden;
  }
  .tb-rc-btn {
    flex: 1;
    height: calc(var(--job-half) + var(--border-width) * 2);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
    cursor: pointer;
  }
  .tb-rc-slider-wrap {
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden; display: flex;
    height: calc(var(--job-half) + var(--border-width) * 2);
  }
  `;
  document.head.appendChild(s);
})();


// -- COLOR MATH ---------------------------------------------------------------
function _rHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

function _rHexToHsl(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, Math.round(l * 100)];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let hh = mx === r ? (g - b) / d + (g < b ? 6 : 0)
         : mx === g ? (b - r) / d + 2
         : (r - g) / d + 4;
  return [Math.round(hh / 6 * 360), Math.round(s * 100), Math.round(l * 100)];
}

function _rLum(hex) {
  const cv = (o) => {
    const v = parseInt(hex.slice(o, o+2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * cv(1) + 0.7152 * cv(3) + 0.0722 * cv(5);
}

function _rRatio(a, b) {
  const la = _rLum(a), lb = _rLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function _rRnd(a, b)  { return a + Math.random() * (b - a); }
function _rPick(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
function _rGv(id, df) { return +((document.getElementById(id) || { value: df }).value); }
function _rClamp(v)   { return Math.max(5, Math.min(95, v)); }


// -- STATE --------------------------------------------------------------------
var _rBgSel   = 'random';
var _rHarmSel = 'random';
var _rSurfSel = 'random';
var _rToneSel = 'mix';

window._rBgDescs = {
  'random':        'Picks a background strategy randomly each time',
  'primary-dark':  'Background uses a dark shade of the primary hue',
  'complement':    'Background hue sits opposite primary on the wheel',
  'analogous':     'Background hue sits adjacent to primary, harmonious',
  'contrast90':    'Background hue is 90 degrees away from primary',
  'warm-neutral':  'Background is a warm neutral tone, unrelated to primary',
  'cool-neutral':  'Background is a cool neutral tone, unrelated to primary',
  'true-grey':     'Background is a near-zero saturation grey tone',
  'earthy':        'Background uses a warm earthy brown-orange hue',
  'triadic-bg':    'Background hue is the triadic partner of primary',
  'split-bg':      'Background uses the split complement of primary hue',
  'secondary-bg':  'Background hue sits close to secondary action color',
};
window._rHarmDescs = {
  'random':        'Picks a color harmony scheme randomly each time',
  'complementary': 'Secondary and accent are opposite primary on the wheel',
  'analogous':     'Colors sit adjacent to each other, calm and cohesive',
  'triadic':       'Three colors equally spaced, vibrant and balanced',
  'tetradic':      'Four colors in a rectangle, rich color variety',
  'split':         'Primary plus two colors flanking its complement',
  'accented':      'Analogous pair with a distant accent for contrast',
  'fibonacci':     'Colors spaced by the golden angle, naturally varied',
  'monochromatic': 'Single hue at different lightness and saturation',
  'double-comp':   'Two complementary pairs, maximum contrast variety',
  'near-comp':     'Colors near the complement, softer than full opposite',
  'rectangle':     'Four colors at 60 and 180 degree intervals',
};
window._rSurfDescs = {
  'random':           'Picks a surface color strategy randomly each time',
  'white':            'Pure white surface for maximum contrast and clarity',
  'off-white':        'Slightly tinted white, softer than pure white',
  'light primary':    'Washed-out tint of primary hue, light and subtle',
  'dark primary':     'Deep shade of primary hue, bold surface contrast',
  'light secondary':  'Washed-out tint of secondary hue for soft variety',
  'dark secondary':   'Deep shade of secondary hue, rich surface tone',
  'light accent':     'Washed-out tint of accent hue, gentle highlight',
  'dark accent':      'Deep shade of accent hue for bold surface tone',
  'tinted neutral':   'Neutral bg hue at medium-light lightness, subtle',
  'light complement': 'Washed complement hue, contrasts primary gently',
  'pure grey':        'Zero saturation grey surface, completely neutral',
  '4th harmony':      'A fourth color stepped further around the wheel',
};
window._rToneDescs = {
  'mix':   'Picks dark, mid, or light tone randomly each time',
  'dark':  'Deep dark backgrounds, vivid action colors stand out',
  'mid':   'Medium depth backgrounds, balanced contrast throughout',
  'light': 'Pale light backgrounds, action colors provide contrast',
};


// -- CHIP SELECTION -----------------------------------------------------------
function _rSelectChip(groupId, el, labelId) {
  document.querySelectorAll('#' + groupId + ' .tb-rand-chip').forEach(c => {
    c.style.background = '';
    c.style.color = '';
  });
  el.style.background = 'var(--primary)';
  el.style.color = 'var(--text-light)';
  const lbl = document.getElementById(labelId);
  if (lbl) lbl.textContent = el.dataset.val;
}

window.tbRandSetBg = (v, el) => {
  _rBgSel = v;
  _rSelectChip('tbRandBgChips', el, 'tbRandBgLabel');
  const desc = document.getElementById('tbRandBgDesc');
  if (desc && window._rBgDescs) desc.textContent = window._rBgDescs[v] || '';
};
window.tbRandSetHarm = (v, el) => {
  _rHarmSel = v; _rSelectChip('tbRandHarmChips', el, 'tbRandHarmLabel');
  const d = document.getElementById('tbRandHarmDesc');
  if (d && window._rHarmDescs) d.textContent = window._rHarmDescs[v] || '';
};
window.tbRandSetSurf = (v, el) => {
  _rSurfSel = v; _rSelectChip('tbRandSurfChips', el, 'tbRandSurfLabel');
  const d = document.getElementById('tbRandSurfDesc');
  if (d && window._rSurfDescs) d.textContent = window._rSurfDescs[v] || '';
};
window.tbRandSetTone = (v, el) => {
  _rToneSel = v; _rSelectChip('tbRandToneChips', el, 'tbRandToneLabel');
  const d = document.getElementById('tbRandToneDesc');
  if (d && window._rToneDescs) d.textContent = window._rToneDescs[v] || '';
};


// -- PRIMARY CARD -------------------------------------------------------------
function _rGetPrimary() {
  return _rHsl(_rGv('tbHueS', 140), _rGv('tbSatS', 65) || 1, _rGv('tbBriS', 48) || 1);
}

function _rUpdatePrimaryCard() {
  const hex = _rGetPrimary();
  const el  = document.getElementById('tbRandPrimary');
  if (!el) return;
  el.style.background = hex;
  el.style.color = _rLum(hex) > 0.25 ? '#111' : '#f2f2f2';
  el.textContent = hex.toUpperCase();
}


// -- HARMONY OFFSETS ----------------------------------------------------------
// Each scheme is a function so mini branches can randomize within the scheme's spirit
function _rHarmOffsets(scheme) {
  switch (scheme) {
    case 'complementary': {
      // Mini branch: pure opposite + near-opposite, or opposite + split near
      const v = _rPick(['classic','near-split','wide-split']);
      return v === 'classic'     ? [180, 210]
           : v === 'near-split'  ? [180, 155]
           :                       [180, 140];
    }
    case 'analogous': {
      // Mini branch: tight (20/40), standard (30/60), wide (45/75)
      const v = _rPick(['tight','standard','wide']);
      return v === 'tight'    ? [20,  40]
           : v === 'standard' ? [30,  60]
           :                    [45,  75];
    }
    case 'triadic': {
      // Mini branch: equal triangle (120/240) or shifted triadic
      const v = _rPick(['equal','warm-shift','cool-shift']);
      return v === 'equal'      ? [120, 240]
           : v === 'warm-shift' ? [110, 230]
           :                      [130, 250];
    }
    case 'tetradic': {
      // Mini branch: square (90/270), wide rectangle (60/240), narrow rectangle (30/210)
      const v = _rPick(['square','wide-rect','narrow-rect']);
      return v === 'square'      ? [90,  270]
           : v === 'wide-rect'   ? [60,  240]
           :                       [30,  210];
    }
    case 'split': {
      // Mini branch: standard split (150/210), tight split (160/200), wide split (140/220)
      const v = _rPick(['standard','tight','wide']);
      return v === 'standard' ? [150, 210]
           : v === 'tight'    ? [160, 200]
           :                    [140, 220];
    }
    case 'accented': {
      // Mini branch: accent far (20/150), accent very far (15/180), accent close (25/120)
      const v = _rPick(['far','very-far','close']);
      return v === 'far'      ? [20,  150]
           : v === 'very-far' ? [15,  180]
           :                    [25,  120];
    }
    case 'fibonacci': {
      // Mini branch: forward spiral, reverse spiral, double step
      const v = _rPick(['forward','reverse','double']);
      return v === 'forward' ? [137.508, 275.016]
           : v === 'reverse' ? [222.492, 84.984]
           :                   [137.508, 137.508 * 3 % 360];
    }
    case 'monochromatic': {
      // Mini branch: same hue (pure mono), very slight warm drift, very slight cool drift
      const v = _rPick(['pure','warm-drift','cool-drift']);
      return v === 'pure'       ? [0,   0]
           : v === 'warm-drift' ? [8,   15]
           :                      [-8, -15];
    }
    case 'double-comp': {
      // Mini branch: 180+90, 180+60, 180+120
      const v = _rPick(['square','close','far']);
      return v === 'square' ? [180, 90]
           : v === 'close'  ? [180, 60]
           :                  [180, 120];
    }
    case 'near-comp': {
      // Mini branch: slight offset from complement (160/200), medium (150/210), large (140/220)
      const v = _rPick(['slight','medium','large']);
      return v === 'slight' ? [160, 200]
           : v === 'medium' ? [150, 210]
           :                  [140, 220];
    }
    case 'rectangle': {
      // Mini branch: standard (60/180), wide (80/180), narrow (40/180)
      const v = _rPick(['standard','wide','narrow']);
      return v === 'standard' ? [60,  180]
           : v === 'wide'     ? [80,  180]
           :                    [40,  180];
    }
    default: return [180, 150];
  }
}

const _rBgStrategies = {
  // Primary hue darkened  - mini branch: lighter dark, medium dark, very dark
  'primary-dark': h => {
    const shade = _rPick(['light-dark','mid-dark','deep-dark']);
    const bgS = shade === 'light-dark' ? _rRnd(10,18) : shade === 'mid-dark' ? _rRnd(18,28) : _rRnd(28,40);
    return { bgH: h, bgS };
  },

  // Complement  - mini branch: exact opposite, slightly warm offset, slightly cool offset
  'complement': h => {
    const variant = _rPick(['exact','warm-shift','cool-shift']);
    const offset  = variant === 'exact' ? 180 : variant === 'warm-shift' ? 170 : 190;
    return { bgH: (h + offset + _rRnd(-6, 6)) % 360, bgS: _rRnd(7, 16) };
  },

  // Analogous  - mini branch: warm side (+), cool side (-), wide angle (+-45)
  'analogous': h => {
    const side = _rPick(['warm','cool','wide-warm','wide-cool']);
    const angle = side === 'warm' ? 30 : side === 'cool' ? -30 : side === 'wide-warm' ? 45 : -45;
    return { bgH: (h + angle + _rRnd(-6, 6) + 360) % 360, bgS: _rRnd(7, 16) };
  },

  // 90deg contrast  - mini branch: clockwise 90, counter 90, or 270 (same as -90)
  'contrast90': h => {
    const dir = _rPick(['cw90','ccw90','cw270']);
    const angle = dir === 'cw90' ? 90 : dir === 'ccw90' ? -90 : 270;
    return { bgH: (h + angle + _rRnd(-8, 8) + 360) % 360, bgS: _rRnd(5, 14) };
  },

  // Warm neutral  - fixed hue family, no primary dependency
  'warm-neutral': h => ({ bgH: _rPick([20, 25, 30, 35, 38]), bgS: _rRnd(7, 16) }),

  // Cool neutral  - fixed hue family, no primary dependency
  'cool-neutral': h => ({ bgH: _rPick([195, 200, 205, 210, 220]), bgS: _rRnd(7, 16) }),

  // True grey  - mini branch: pure zero sat, or barely warm, or barely cool tint
  'true-grey': h => {
    const tint = _rPick(['pure','warm-tint','cool-tint']);
    return { bgH: tint === 'warm-tint' ? 30 : tint === 'cool-tint' ? 210 : 0, bgS: tint === 'pure' ? 0 : _rRnd(1, 4) };
  },

  // Earthy  - mini branch: red-earthy, orange-earthy, yellow-earthy
  'earthy': h => {
    const tone = _rPick(['red-earth','orange-earth','yellow-earth']);
    const bgH  = tone === 'red-earth' ? _rPick([10, 15, 18]) : tone === 'orange-earth' ? _rPick([22, 28, 32]) : _rPick([35, 40, 45]);
    return { bgH, bgS: _rRnd(10, 22) };
  },

  // Triadic bg  - mini branch: first triadic (+120) or second triadic (+240)
  'triadic-bg': h => {
    const which = _rPick(['first','second']);
    const angle = which === 'first' ? 120 : 240;
    return { bgH: (h + angle + _rRnd(-8, 8)) % 360, bgS: _rRnd(8, 16) };
  },

  // Split bg  - mini branch: left split (+150) or right split (+210)
  'split-bg': h => {
    const which = _rPick(['left','right']);
    const angle = which === 'left' ? 150 : 210;
    return { bgH: (h + angle + _rRnd(-8, 8)) % 360, bgS: _rRnd(8, 16) };
  },

  // Secondary bg  - mini branch: close neighbor (+30 to +45) or far neighbor (+315 to +330)
  'secondary-bg': h => {
    const which = _rPick(['near-warm','near-cool','far-warm','far-cool']);
    const angle = which === 'near-warm' ? _rRnd(25,45) : which === 'near-cool' ? _rRnd(-45,-25) : which === 'far-warm' ? _rRnd(315,335) : _rRnd(25,55);
    return { bgH: (h + angle + 360) % 360, bgS: _rRnd(10, 18) };
  },

  // Vivid primary — high saturation, bg hue = primary hue
  'vivid-primary': h => ({ bgH: h, bgS: _rRnd(55, 85), vivid: true }),

  // Vivid complement — saturated opposite hue
  'vivid-complement': h => ({ bgH: (h + 180 + _rRnd(-15,15) + 360) % 360, bgS: _rRnd(50, 80), vivid: true }),

  // Vivid contrast — saturated 90° or 120° offset
  'vivid-contrast': h => ({ bgH: (h + _rPick([90,-90,120,-120]) + _rRnd(-15,15) + 360) % 360, bgS: _rRnd(45, 75), vivid: true }),

  // Vivid wild — completely random saturated hue, no relation to primary
  'vivid-wild': h => ({ bgH: Math.floor(_rRnd(0, 360)), bgS: _rRnd(40, 90), vivid: true }),

  // Vivid warm — saturated warm hues (red/orange/amber)
  'vivid-warm': h => ({ bgH: _rPick([0,10,20,30,40,50]), bgS: _rRnd(50, 80), vivid: true }),

  // Vivid cool — saturated cool hues (teal/blue/cyan)
  'vivid-cool': h => ({ bgH: _rPick([180,190,200,210,220,240]), bgS: _rRnd(50, 80), vivid: true }),
};


// -- THEME ENGINE -------------------------------------------------------------
function _rMakeTheme(primaryHex, fixedPrimary) {
  const [h, s] = _rHexToHsl(primaryHex);
  const bri = fixedPrimary ? _rGv('tbBriS', 48) : Math.round(_rRnd(8, 60));
  const sat = fixedPrimary ? _rGv('tbSatS', 65) : Math.round(_rRnd(12, 88));
  const pS  = Math.min(sat, 95);

  // Tone
  const tone = _rToneSel === 'mix' ? _rPick(['dark', 'mid', 'light']) : _rToneSel;

  // Harmony
  const harmKeys   = Object.keys({complementary:1,analogous:1,triadic:1,tetradic:1,split:1,accented:1,fibonacci:1,monochromatic:1,'double-comp':1,'near-comp':1,rectangle:1});
  const schemeName = _rHarmSel === 'random' ? _rPick(harmKeys) : _rHarmSel;
  const offsets    = _rHarmOffsets(schemeName);
  const secH = (h + offsets[0] + _rRnd(-8, 8) + 360) % 360;
  const accH = schemeName === 'monochromatic' ? h : (h + offsets[1] + _rRnd(-8, 8) + 360) % 360;

  // Action colors
  const pri = fixedPrimary ? primaryHex : _rHsl(h, pS, _rClamp(bri));
  const sec = _rHsl(secH, Math.min(pS * 0.9, 88), _rClamp(bri));
  const acc = _rHsl(accH, Math.min(pS * 0.8, 80), _rClamp(bri));
  const c1  = _rHsl(355, 65, tone === 'dark' ? 48 : 44);

  // Background
  const bgKeys = Object.keys(_rBgStrategies);
  const bgKey  = _rBgSel === 'random' ? _rPick(bgKeys) : _rBgSel;
  const bgPick = (_rBgStrategies[bgKey] || _rBgStrategies.complement)(h);
  const bH     = bgKey === 'primary-dark' ? h : bgPick.bgH;
  const bS     = bgPick.bgS;
  const vivid  = !!bgPick.vivid;
  const w      = () => _rRnd(-2, 2);

  let bg1, bg2, bg3;
  if (vivid) {
    const vL = tone === 'dark' ? _rRnd(18, 38) : tone === 'mid' ? _rRnd(30, 50) : _rRnd(55, 72);
    bg1 = _rHsl(bH, bS, vL + w());
    bg2 = _rHsl(bH, Math.max(20, bS - 10), vL + 10 + w());
    bg3 = _rHsl(bH, bS, vL - 10 + w());
  } else if (tone === 'dark') {
    bg1 = _rHsl(bH, bS, 12 + w()); bg2 = _rHsl(bH, bS, 20 + w()); bg3 = _rHsl(bH, bS, 7 + w());
  } else if (tone === 'mid') {
    bg1 = _rHsl(bH, bS, 26 + w()); bg2 = _rHsl(bH, bS, 34 + w()); bg3 = _rHsl(bH, bS, 18 + w());
  } else {
    bg1 = _rHsl(bH, bS, 93 + w()); bg2 = _rHsl(bH, bS, 85 + w()); bg3 = _rHsl(bH, bS, 77 + w());
  }

  // -- NEW CONTRAST RULES ------------------------------------------
  // Walk lightness until contrast passes -- stays in hue family
  function _rWalk(h, s, startL, surfaces, minR) {
    const goLight = startL > 50;
    const step = goLight ? 1 : -1;
    let l = startL;
    for (let i = 0; i < 90; i++) {
      const c = _rHsl(h, s, l);
      if (surfaces.every(sf => _rRatio(c, sf) >= minR)) return c;
      l += step;
      if (l >= 98 || l <= 2) break;
    }
    return goLight ? _rHsl(h, Math.min(s, 15), 96) : _rHsl(h, Math.min(s, 15), 4);
  }

  // text-light -- must pass 4.5:1 on pri, sec, acc, bg3
  const tlSurfaces = [pri, sec, acc, bg3];
  const tlLumAvg = tlSurfaces.reduce((a, c) => a + _rLum(c), 0) / tlSurfaces.length;
  const tlGoLight = tlLumAvg < 0.35;
  const tlStartL = tlGoLight ? 88 : 12;
  const tlStartS = Math.min(bS * 1.5, 30);
  const tl = _rWalk(bH, tlStartS, tlStartL, tlSurfaces, 4.5);

  // border -- always dark, occasionally dark-colored
  const tlIsDark = _rLum(tl) < 0.2;
  let border;
  if (tlIsDark) {
    border = tl;
  } else {
    const useDarkColor = Math.random() < 0.1;
    if (useDarkColor) {
      const brdH = _rPick([h, (h + 180) % 360, bH]);
      border = _rHsl(brdH, Math.min(pS * 0.6, 45), Math.round(_rRnd(8, 16)));
    } else {
      border = _rHsl(bH, Math.min(bS * 0.5, 10), Math.round(_rRnd(3, 10)));
    }
  }

  // text-mid -- bg hue family, walk to 4.5:1 on hardest bg
  const tmHard = tone === 'light' ? bg3 : bg2;
  const tmGoLight = _rLum(tmHard) < 0.35;
  const tmStartS = Math.min(bS * 2, 30);
  const tm = _rWalk(bH, tmStartS, tmGoLight ? 72 : 28, [tmHard], 4.5);

  // Surface (bg4)
  const surfaceNames = [
    'white', 'off-white', 'light primary', 'dark primary',
    'light secondary', 'dark secondary', 'light accent', 'tinted neutral',
    'light complement', 'pure grey', '4th harmony', 'dark accent',
  ];
  const surfaceFns = [
    // white - pure or near-pure
    () => ({ bg4: '#ffffff', td4: _rHsl(bH, bS + 4, 5) }),

    // off-white - mini branch: warm tint, cool tint, or neutral
    () => {
      const v = _rPick(['warm','cool','neutral']);
      const tH = v === 'warm' ? 30 : v === 'cool' ? 210 : bH;
      return { bg4: _rHsl(tH, v === 'neutral' ? bS + 4 : _rRnd(6, 12), _rRnd(93, 98)), td4: _rHsl(tH, 8, 5) };
    },

    // light primary - mini branch: very washed, moderately washed, or hinted
    () => {
      const v = _rPick(['very-washed','moderate','hinted']);
      const sat2 = v === 'very-washed' ? Math.min(pS * 0.3, 25) : v === 'moderate' ? Math.min(pS * 0.5, 40) : Math.min(pS * 0.15, 15);
      const lgt  = v === 'very-washed' ? _rRnd(91, 96) : v === 'moderate' ? _rRnd(87, 93) : _rRnd(93, 97);
      return { bg4: _rHsl(h, sat2, lgt), td4: _rHsl(h, pS * 0.6, 8) };
    },

    // dark primary - mini branch: deep, medium-deep, very deep
    () => {
      const v = _rPick(['deep','medium','very-deep']);
      const lgt = v === 'deep' ? _rRnd(22, 30) : v === 'medium' ? _rRnd(30, 40) : _rRnd(12, 22);
      return { bg4: _rHsl(h, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },

    // light secondary - mini branch: washed or hinted
    () => {
      const v = _rPick(['washed','hinted']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.5, 40) : Math.min(pS * 0.2, 18);
      return { bg4: _rHsl(secH, sat2, _rRnd(86, 94)), td4: _rHsl(secH, pS * 0.5, 8) };
    },

    // dark secondary - mini branch: deep or medium
    () => {
      const v = _rPick(['deep','medium']);
      const lgt = v === 'deep' ? _rRnd(16, 26) : _rRnd(26, 36);
      return { bg4: _rHsl(secH, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },

    // light accent - mini branch: washed or hinted
    () => {
      const v = _rPick(['washed','hinted']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.4, 35) : Math.min(pS * 0.18, 15);
      return { bg4: _rHsl(accH, sat2, _rRnd(88, 95)), td4: _rHsl(accH, pS * 0.5, 8) };
    },

    // tinted neutral - mini branch: bg hue tint, primary hue tint, or complement tint
    () => {
      const v = _rPick(['bg-tint','primary-tint','complement-tint']);
      const tH = v === 'primary-tint' ? h : v === 'complement-tint' ? (h + 180) % 360 : bH;
      return { bg4: _rHsl(tH, _rRnd(6, 14), _rRnd(78, 88)), td4: _rHsl(tH, bS, 8) };
    },

    // light complement - mini branch: washed, hinted, or medium
    () => {
      const v = _rPick(['washed','hinted','medium']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.4, 35) : v === 'hinted' ? Math.min(pS * 0.2, 18) : Math.min(pS * 0.55, 48);
      const lgt  = v === 'medium' ? _rRnd(80, 88) : _rRnd(86, 94);
      return { bg4: _rHsl((h + 180) % 360, sat2, lgt), td4: _rHsl((h + 180) % 360, pS * 0.5, 8) };
    },

    // pure grey - mini branch: true zero, barely warm, barely cool (no primary influence)
    () => {
      const v = _rPick(['pure','warm-ghost','cool-ghost']);
      return { bg4: _rHsl(v === 'warm-ghost' ? 28 : v === 'cool-ghost' ? 208 : 0, v === 'pure' ? 0 : _rRnd(1, 3), _rRnd(90, 96)), td4: _rHsl(0, 0, 8) };
    },

    // 4th harmony - uses next step around wheel from accent
    () => {
      const q = (h + offsets[1] * 1.5 + 360) % 360;
      const c = _rHsl(q, Math.min(pS * 0.55, 50), 48);
      return { bg4: c, td4: _rLum(c) > 0.35 ? _rHsl(q, 20, 8) : _rHsl(q, 8, 94) };
    },

    // dark accent - mini branch: deep or medium
    () => {
      const v = _rPick(['deep','medium']);
      const lgt = v === 'deep' ? _rRnd(16, 26) : _rRnd(26, 36);
      return { bg4: _rHsl(accH, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },
  ];

  const surfIdx = _rSurfSel === 'random'
    ? Math.floor(Math.random() * surfaceFns.length) % surfaceFns.length
    : Math.max(0, Math.min(surfaceNames.indexOf(_rSurfSel), surfaceFns.length - 1));
  let { bg4, td4 } = surfaceFns[surfIdx]();
  if (!bg4) { bg4 = '#ffffff'; td4 = '#000000'; }
  // Walk td4 to pass 4.5:1 on bg4 -- keep hue tinted
  const [td4H, td4S] = [bH, Math.min(bS * 1.5, 20)];
  td4 = _rWalk(td4H, td4S, _rLum(bg4) > 0.5 ? 5 : 90, [bg4], 4.5);

  // Swatches
  const sw = [0, ...offsets, 60, 90, 120, 150, 180, 210, 270]
    .slice(0, 10)
    .map(o => _rHsl((h + o + 360) % 360, Math.min(sat * 0.9, 82), bri));

  return {
    bg1, bg2, bg3, bg4, pri, sec, acc, c1,
    border, tl, tm, td: td4, sw,
    _schemeName: schemeName,
    _bgKey:      bgKey,
    _surfName:   surfaceNames[surfIdx],
    _tone:       tone,
  };
}


// -- THEME NAME GENERATOR ----------------------------------------------------
function _rClassifyColor(hex) {
  const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  const s = mx===mn ? 0 : l>0.5 ? (mx-mn)/(2-mx-mn) : (mx-mn)/(mx+mn);
  const sl=Math.round(s*100), ll=Math.round(l*100);
  if (ll < 8) return 'black';
  if (ll > 90 && sl < 20) return 'white';
  const thresh = ll > 70 ? 22 : ll < 25 ? 18 : 14;
  if (sl < thresh) return ll < 40 ? 'grey-dark' : ll > 65 ? 'grey-light' : 'grey';
  let hh = 0;
  if (mx !== mn) {
    const d = mx-mn;
    hh = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4;
    hh = Math.round(hh/6*360);
  }
  if (hh < 15 || hh >= 345) return 'red';
  if (hh < 45)  return 'orange';
  if (hh < 75)  return 'yellow';
  if (hh < 100) return 'yellow-green';
  if (hh < 155) return 'green';
  if (hh < 195) return 'teal';
  if (hh < 255) return 'blue';
  if (hh < 295) return 'purple';
  return 'pink';
}

function _rAnalyzeTheme(t) {
  const weighted = [
    [t.bg1,4],[t.bg2,3],[t.bg3,2.5],[t.bg4,1.5],
    [t.primary,2],[t.secondary,1.5],[t.accent,1],[t.border,0.5],
  ];
  const totals = {}, total = weighted.reduce((s,[,w])=>s+w,0);
  weighted.forEach(([hex,w])=>{ const cat=_rClassifyColor(hex); totals[cat]=(totals[cat]||0)+w; });
  return Object.entries(totals).map(([k,v])=>({cat:k,pct:Math.round(v/total*100)})).sort((a,b)=>b.pct-a.pct);
}

function _rHueWords(h, s) {
  h=((h%360)+360)%360;
  if(s!==undefined&&s<8) return ['Ash','Smoke','Slate','Stone','Fog','Cinder'];
  const bands=[
    ['Garnet','Carmine','Claret','Vermeil','Lacquer'],
    ['Scarlet','Flame','Blaze','Flare','Cinnabar'],
    ['Ember','Cinder','Smolder','Char','Burn'],
    ['Rust','Oxide','Tarnish','Patina','Wrought'],
    ['Terra','Clay','Adobe','Loam','Tilework'],
    ['Sienna','Ochre','Umber','Warm','Raw'],
    ['Copper','Bronze','Metal','Forge','Foundry'],
    ['Amber','Resin','Honey','Sap','Gold'],
    ['Gold','Gilded','Bullion','Sovereign','Doubloon'],
    ['Harvest','Grain','Field','Straw','Wheat'],
    ['Solar','Sunlit','Bright','Noon','Peak'],
    ['Flax','Lemon','Citron','Pale','Yellow'],
    ['Lime','Absin','Acid','Tonic','Cloud'],
    ['Lime','Citrus','Zest','Rind','Peel'],
    ['Sprout','Shoot','Bud','Seedling','Tender'],
    ['Leaf','Blade','Frond','Canopy','Green'],
    ['Fern','Brush','Scrub','Glade','Dapple'],
    ['Forest','Timber','Grove','Copse','Thicket'],
    ['Pine','Spruce','Branch','Bough','Needle'],
    ['Moss','Lichen','Peat','Bog','Marsh'],
    ['Jade','Sage','Copper','Stone','Patina'],
    ['Emerald','Viridian','Beryl','Tourmaline','Verdure'],
    ['Seafoam','Surf','Brine','Kelp','Saltwater'],
    ['Teal','Shore','Shallow','Estuary','Inlet'],
    ['Lagoon','Island','Cove','Reef','Atoll'],
    ['Turquoise','Glacial','Fjord','Thaw','Ice'],
    ['Aqua','Pool','Robin','Clear','Crystal'],
    ['Harbor','Marina','Port','Mooring','Dock'],
    ['Azure','Sky','Cirrus','Horizon','Canopy'],
    ['Cerulean','Powder','Haze','Vapor','Air'],
    ['Cornflower','Peri','Delphinium','Bell','Bluebell'],
    ['Cobalt','Lapis','Majorelle','Klein','Ultra'],
    ['Ocean','Pelagic','Deep','Dark','Floor'],
    ['Storm','Tempest','Squall','Gale','Maelstrom'],
    ['Slate','Gunmetal','Flint','Steel','Iron'],
    ['Sapphire','Regal','Royal','Celestial','Lapis'],
    ['Navy','Night','Sailor','Admiral','Deep'],
    ['Indigo','Shade','Indigo','Pigment','Blue'],
    ['Wisteria','Iris','Violet','Lupine','Bell'],
    ['Amethyst','Geode','Crystal','Stone','Quartz'],
    ['Plum','Dark','Sloe','Berry','Nightfall'],
    ['Mulberry','Grape','Wine','Bramble','Claret'],
    ['Orchid','Heather','Bloom','Thistle','Lavender'],
    ['Fuchsia','Magenta','Shocking','Bright','Vivid'],
    ['Hibiscus','Cerise','Bloom','Dragon','Punch'],
    ['Rose','Peony','Damask','Floret','Petal'],
    ['Berry','Raspberry','Bramble','Briar','Thornwood'],
    ['Crimson','Madder','Red','Carmine','Lake'],
    ['Oxblood','Burgundy','Bordeaux','Merlot','Wine'],
    ['Maroon','Cardinal','Ruby','Carnelian','Garnet'],
  ];
  return bands[Math.min(Math.floor(h/7.2),49)]||bands[0];
}

function _rToneWords(tone, vivid) {
  if(vivid) return ['Electric','Neon','Vivid','Charged','Radiant','Blazing'];
  if(tone==='dark')  return ['Midnight','Shadow','Obsidian','Abyss','Noir','Void'];
  if(tone==='mid')   return ['Dusk','Smoke','Haze','Twilight','Fog','Ash'];
  return ['Dawn','Frost','Pearl','Ivory','Linen','Mist'];
}

function _rFixArticles(name) {
  return name
    .replace(/\bA ([aeiouAEIOU])/g,'An $1')
    .replace(/\ba ([aeiouAEIOU])/g,'an $1')
    .replace(/\bAn ([^aeiouAEIOU])/g,'A $1')
    .replace(/\ban ([^aeiouAEIOU])/g,'a $1');
}

function _rMakeName(t, tone) {
  const neutralCats = new Set(['grey','grey-dark','grey-light','black','white']);
  const bucketHueMap = {red:5,orange:30,yellow:55,'yellow-green':88,green:125,teal:170,blue:220,purple:270,pink:320};
  const analysis = _rAnalyzeTheme(t);
  const colored = analysis.filter(x=>!neutralCats.has(x.cat));
  function wordsFor(b){ return b?_rHueWords(bucketHueMap[b.cat]||0,60):_rHueWords(Math.floor(Math.random()*360),60); }
  const used = new Set();
  function fp(pool){ const f=pool.filter(w=>!used.has(w)); const w=_rPick(f.length?f:pool); used.add(w); return w; }
  const A=()=>fp(wordsFor(colored[0]));
  const B=()=>fp(wordsFor(colored[1]||colored[0]));
  const C=()=>fp(wordsFor(colored[2]||colored[0]));
  const D=()=>fp(_rToneWords(tone, t._tone==='vivid'));
  const adjDark=['Dark','Deep','Rich','Heavy','Dim','Smoky','Dense','Dusky'];
  const adjLight=['Soft','Pale','Faint','Clear','Airy','Washed','Gentle','Hushed'];
  const adjMid=['Muted','Worn','Faded','Quiet','Still','Bare','Warm','Cool'];
  const allAdj=tone==='dark'?[...adjDark,...adjMid]:tone==='light'?[...adjLight,...adjMid]:[...adjMid,...adjDark,...adjLight];
  const E=()=>fp(allAdj);
  const moods=['Reverie','Elegy','Solace','Longing','Vigil','Lament','Rapture','Ache','Bliss'];
  const phen=['Thunder','Monsoon','Solstice','Eclipse','Tempest','Torrent','Cascade','Aurora','Gloaming'];
  const places=['Summit','Canyon','Vale','Glade','Hollow','Ridge','Delta','Gorge','Cavern','Moor'];
  const music=['Nocturne','Aria','Fugue','Sonata','Requiem','Cantata','Dirge','Ballad','Hymn'];
  const abst=['Whisper','Echo','Phantom','Specter','Mirage','Secret','Omen','Veil','Shroud','Shadow'];
  const W=()=>fp([...moods,...phen,...places,...music,...abst]);
  const sig=colored.filter(x=>x.pct>=8);
  const actionsSimilar=sig.length<2;
  const isGreyDom=!colored.length||colored[0].pct<10;
  const templates=[
    ()=>B()+" of the "+D(), ()=>A()+" in the "+D(), ()=>D()+" of "+B(),
    ()=>B()+" a la "+C(), ()=>B()+" meets "+C(), ()=>"A "+D()+" "+B(),
    ()=>B()+" after "+D(), ()=>C()+" at "+D(), ()=>D()+" over "+A(),
    ()=>B()+" beyond the "+D(), ()=>A()+" and "+B(), ()=>B()+" through "+D(),
    ()=>C()+" in "+A(), ()=>B()+" "+C()+" in Moonlight", ()=>A()+" "+B()+" at Dusk",
    ()=>"Somewhere Between "+B()+" and "+C(), ()=>"Born of "+B()+" and "+C(),
    ()=>B()+" Steeped in "+D(), ()=>"The "+B()+" "+C()+" Hour",
    ()=>"Where "+B()+" Meets "+C(), ()=>B()+" Before the "+D(),
    ()=>B()+" Painted in "+C(), ()=>"Once "+D()+", Always "+B(),
    ()=>B()+", "+C()+", and "+D(), ()=>A()+", "+B()+", and "+C(),
    ()=>"My "+D()+" "+B()+" "+C(), ()=>"A Time of "+B()+" and "+C(),
    ()=>"The Last "+B()+" "+D(),
    ()=>B()+"'s "+C(), ()=>B()+"'s "+D(), ()=>"The "+B()+" of "+C(),
    ()=>"The "+D()+" of "+B(), ()=>"Let "+B()+" be "+C(), ()=>"Let "+D()+" be "+B(),
    ()=>B()+" for "+C(), ()=>B()+" against "+D(), ()=>B()+" beside "+C(),
    ()=>B()+" without "+C(), ()=>B()+" chasing "+C(), ()=>B()+" becoming "+D(),
    ()=>B()+" carrying "+C(), ()=>B()+" or "+C(), ()=>B()+" always "+D(),
    ()=>B()+" still "+D(), ()=>B()+" within "+D(),
    ()=>E()+" "+B()+" "+C(), ()=>E()+" "+B()+" "+D(), ()=>E()+" "+A()+" "+B(),
    ()=>"The "+E()+" "+B(), ()=>E()+" "+B()+" of the "+D(),
    ()=>B()+" and "+E()+" "+C(), ()=>E()+" and "+B(), ()=>B()+", "+E()+" "+C(),
    ()=>B()+" of the "+W(), ()=>W()+" of "+B(), ()=>B()+" in "+W(),
    ()=>"A "+W()+" of "+B(), ()=>W()+" over "+B(), ()=>B()+" through the "+W(),
    ()=>"The "+B()+" "+W(), ()=>W()+" in "+B()+" Light",
    ()=>W()+" of the "+W(), ()=>W()+" and "+W(), ()=>"The "+W()+" "+W(),
  ];
  const singleColor=[
    ()=>"Just "+B(), ()=>"Pure "+B(), ()=>"All "+B(), ()=>"The "+B(),
    ()=>"Only "+B(), ()=>B()+" Alone", ()=>"A Study in "+B(), ()=>"Nothing but "+B(),
  ];
  const pool=actionsSimilar||isGreyDom?[...singleColor,...templates.slice(50)]:templates;
  let best=null;
  for(let i=0;i<6;i++){
    used.clear();
    const cand=_rFixArticles(_rPick(pool)());
    if(!best||cand.length<best.length) best=cand;
    if(best.length<=25) break;
  }
  return best||'';
}

// -- APPLY THEME --------------------------------------------------------------
function _rApplyTheme(t) {
  const bc = {
    bg1: t.bg1, bg2: t.bg2, bg3: t.bg3, bg4: t.bg4,
    primary: t.pri, secondary: t.sec, accent: t.acc, color1: t.c1,
    muted: t.tm, border: t.border,
    textLight: t.tl, textMid: t.tm,
    textDark: _rLum(t.bg4) > 0.35 ? '#0a0a0a' : '#f0f0f0',
  };
  const jc = {};
  t.sw.forEach((c, i) => { jc['swatch' + (i + 1)] = c; });

  // Capture old swatches before applying (unused now, kept for safety)
  const oldSwatches = typeof getSwatchColors === 'function' ? getSwatchColors() : [];

  ThemeSystem.baseColors = Object.assign({}, ThemeSystem.baseColors, bc);
  ThemeSystem.jobColors  = Object.assign({}, ThemeSystem.jobColors, jc);
  tbApplyCssVars(ThemeSystem.baseColors, ThemeSystem.jobColors);

  // Remap job colors to nearest new swatches via app.js helper
  const newSwatches = typeof getSwatchColors === 'function' ? getSwatchColors() : [];
  if (typeof window.remapJobColors === 'function') window.remapJobColors(newSwatches);

  if (typeof tbRerender === 'function') tbRerender();
  ThemeSystem.renderBaseSwatches();
  ThemeSystem.renderJobSwatches();

  // Generate and display theme name
  const nameEl = document.getElementById('tbRandNameDisplay');
  if (nameEl) {
    const name = _rMakeName(bc, t._tone);
    nameEl.textContent = name;
    nameEl.style.background = t.pri;
    nameEl.style.color = t.tl;
  }

  // Highlight used/selected choices in each chip group
  const pairs = [
    { group: 'tbRandBgChips',   sel: _rBgSel,   used: t._bgKey,      lbl: 'tbRandBgLabel'   },
    { group: 'tbRandHarmChips', sel: _rHarmSel,  used: t._schemeName, lbl: 'tbRandHarmLabel' },
    { group: 'tbRandSurfChips', sel: _rSurfSel,  used: t._surfName,   lbl: 'tbRandSurfLabel' },
    { group: 'tbRandToneChips', sel: _rToneSel,  used: t._tone,       lbl: 'tbRandToneLabel' },
  ];
  // Update bg footer to show used strategy description
  [
    ['tbRandBgDesc',   window._rBgDescs,   _rBgSel,   t._bgKey],
    ['tbRandHarmDesc', window._rHarmDescs, _rHarmSel, t._schemeName],
    ['tbRandSurfDesc', window._rSurfDescs, _rSurfSel, t._surfName],
    ['tbRandToneDesc', window._rToneDescs, _rToneSel, t._tone],
  ].forEach(([elId, descs, sel, used]) => {
    const el = document.getElementById(elId);
    if (!el || !descs) return;
    const key = (sel === 'random' || sel === 'mix') ? used : sel;
    el.textContent = descs[key] || '';
  });
  pairs.forEach(({ group, sel, used, lbl }) => {
    const isRandom = sel === 'random' || sel === 'mix';
    document.querySelectorAll('#' + group + ' .tb-rand-chip').forEach(c => {
      c.style.background = '';
      c.style.color = '';
      const val = c.dataset.val;
      const isRndChip = val === 'random' || val === 'mix';
      if (isRandom) {
        if (isRndChip) {
          // RND chip always stays primary when random mode is active
          c.style.background = t.pri;
          c.style.color = t.tl;
        } else if (used && val === used) {
          // actually chosen option highlighted in secondary
          c.style.background = t.sec;
          c.style.color = t.tl;
        }
      } else if (!isRandom && sel && val === sel) {
        c.style.background = t.pri;
        c.style.color = t.tl;
      }
    });
  });
}


// -- PUBLIC ACTIONS -----------------------------------------------------------
window.tbRandRandom = function () {
  const randHue = Math.floor(Math.random() * 360);
  const randBri = Math.round(_rRnd(8, 60));
  const randSat = Math.round(_rRnd(12, 88));
  const hu = document.getElementById('tbHueS');
  const br = document.getElementById('tbBriS');
  const sa = document.getElementById('tbSatS');
  if (hu) hu.value = randHue;
  if (br) br.value = randBri;
  if (sa) sa.value = randSat;
  _rUpdatePrimaryCard();
  const t = _rMakeTheme(_rHsl(randHue, randSat, randBri), true);
  _rApplyTheme(t);
  return t;
};

window.tbRandApply = function () {
  const t = _rMakeTheme(_rGetPrimary(), true);
  _rApplyTheme(t);
};


// -- SETTINGS TAB ACTIONS -----------------------------------------------------
var _rPreRandColors = null; // snapshot of theme before first random

// -- SETTINGS THEME TAB RANDOMIZER -------------------------------------------
let _sRandTheme = null; // holds last generated theme for save/edit/export

window.sRandCreate = function () {
  _sRandTheme = tbRandRandom();
  const arr     = document.getElementById('sRandArray');
  const btn     = document.getElementById('sRandCreateBtn');
  const builder = document.getElementById('sRandBuilderBtn');
  if (btn)     btn.style.display     = 'none';
  if (builder) builder.style.display = 'none';
  if (arr) {
    if (!document.getElementById('sRandPreview')) {
      const prev = document.createElement('div');
      prev.id = 'sRandPreview';
      prev.innerHTML = _rPreviewHTML();
      const firstChild = arr.firstElementChild;
      if (firstChild && firstChild.nextSibling) {
        arr.insertBefore(prev, firstChild.nextSibling);
      } else {
        arr.appendChild(prev);
      }
    }
    arr.style.display = 'flex';
  }
  _sRandUpdateName();
};

window.sRandAgain = function () {
  _sRandTheme = tbRandRandom();
  _sRandUpdateName();
};

function _sRandUpdateName() {
  const el = document.getElementById('sRandName');
  if (!el || !_sRandTheme) return;
  const bc = ThemeSystem.baseColors;
  const name = _rMakeName(bc, _sRandTheme._tone || 'dark');
  el.textContent = name;
  el.style.background = bc.primary;
  el.style.color = bc.textLight;
  // Also update the Randomize button color
  const btn = el.previousElementSibling;
  if (btn) { btn.style.background = bc.secondary; btn.style.color = bc.textLight; }
  _sRandTheme._name = name;
}

window.sRandSave = function () {
  if (!_sRandTheme) return;
  ThemeSystem.openSaveModal();
  const inp = document.getElementById('tbThemeNameInput');
  if (inp && _sRandTheme._name) {
    inp.value = _sRandTheme._name;
    inp.dispatchEvent(new Event('input'));
  }
};

window.sRandEdit = function () {
  if (!_sRandTheme) return;
  // Open theme builder — current random theme is already applied
  ThemeSystem.open();
};

window.sRandExport = function () {
  const bc = ThemeSystem.baseColors;
  const jc = ThemeSystem.jobColors;
  const parts = Object.entries(bc).map(([k,v]) => k+':'+v.replace('#',''));
  Object.entries(jc).forEach(([k,v]) => parts.push(k+':'+v.replace('#','')));
  const str = parts.join('|');
  if (navigator.clipboard) navigator.clipboard.writeText(str);
  const btn = document.getElementById('sRandExportBtn');
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = 'Copied';
  setTimeout(() => { btn.textContent = orig; }, 1500);
};

window.sRandReset = function () {
  // Restore pre-rand theme from localStorage
  const savedName = localStorage.getItem('shift_current_theme');
  if (savedName) {
    const themes = JSON.parse(localStorage.getItem('shift_themes') || '[]');
    const theme = themes.find(t => t.name === savedName);
    if (theme) {
      ThemeSystem.baseColors = Object.assign({}, TB_DEFAULTS.baseColors, theme.baseColors);
      ThemeSystem.jobColors  = Object.assign({}, TB_DEFAULTS.jobColors, theme.jobColors);
      tbApplyCssVars(ThemeSystem.baseColors, ThemeSystem.jobColors);
      tbRerender();
    }
  }
  const arr     = document.getElementById('sRandArray');
  const btn     = document.getElementById('sRandCreateBtn');
  const builder = document.getElementById('sRandBuilderBtn');
  if (arr)     arr.style.display     = 'none';
  if (btn)     btn.style.display     = 'flex';
  if (builder) builder.style.display = 'flex';
  _sRandTheme = null;
};

// Legacy — kept for any old callers
window.tbRandFromSettings = window.sRandCreate;
window.tbRandReset = window.sRandReset;


function _rInitChips() {
  ['tbRandBgChips', 'tbRandHarmChips', 'tbRandSurfChips', 'tbRandToneChips'].forEach(id => {
    const chips = document.querySelectorAll('#' + id + ' .tb-rand-chip');
    chips.forEach(c => { c.style.background = ''; c.style.color = ''; });
    if (chips[0]) {
      chips[0].style.background = 'var(--primary)';
      chips[0].style.color = 'var(--text-light)';
    }
  });
}


function _rPreviewHTML() {
  const BD = 'var(--border-width) solid var(--border-color)';
  const R  = 'var(--radius)';
  return `<div style="flex-shrink:0;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden">
      <div class="tb-card-hdr" style="color:var(--text-light)">Preview</div>
      <div style="background:var(--bg-1);padding:var(--margin);display:flex;flex-direction:column;gap:var(--margin);border-radius:calc(var(--radius) - 1px)">
        <div style="display:flex;gap:var(--margin)">
          <div class="label-card" style="flex:1;background:var(--bg-4);color:var(--text-dark)">Quick Schedule</div>
          <div style="flex:1;display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden">
            <div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--primary);border-right:var(--border-width) solid var(--border-color);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Tab 1</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-3);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-mid)">Tab A</div>
          </div>
        </div>
        <div class="day-card" style="height:var(--job-half)">
          <div class="day-letter" style="font-size:var(--text-xs)">M</div>
          <div class="day-date"   style="font-size:var(--text-xs)">27</div>
          <div class="day-body">
            <div class="day-body-half day-half-off" style="font-size:var(--text-xs)">OFF</div>
            <div class="day-body-half"              style="font-size:var(--text-xs)">9:00 AM</div>
          </div>
          <div class="day-hours" style="font-size:var(--text-xs)">08.00</div>
        </div>
        <div style="display:flex;gap:var(--margin);height:72px">
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--primary);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">JOB</div>
            <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-mid)">19H 55M</div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--bg-2);border-top:${BD};display:flex;align-items:center;justify-content:center;gap:8px">
              <svg width="9" height="10" viewBox="0 0 16 16" fill="none"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="var(--text-mid)" stroke="var(--text-light)" stroke-width="1.5" stroke-linejoin="round"/></svg>
              <div style="display:flex;gap:3px;align-items:center"><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px"></div><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px"></div></div>
              <div style="width:9px;height:7px;border-left:2.5px solid var(--primary);border-bottom:2.5px solid var(--primary);border-radius:1px;transform:rotate(-45deg) translate(1px,-1px)"></div>
            </div>
          </div>
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--secondary);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Week</div>
            <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-mid)">38.50</div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--secondary);border-top:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-light)">HRS</div>
          </div>
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--accent);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Today</div>
            <div style="flex:1;background:var(--bg-2);position:relative;overflow:hidden">
              <div style="position:absolute;inset:0;display:flex">
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1"></div>
              </div>
              <div style="position:absolute;top:50%;left:10%;width:58%;transform:translateY(-50%);height:11px;background:var(--bg-4);border:2px solid var(--secondary);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;font-weight:900;color:var(--text-dark)">9AM-5PM</div>
            </div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--accent);border-top:${BD};display:flex;align-items:center;justify-content:space-around;padding:0 4px">
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">9</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">12</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">3</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">6</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// -- INJECT PANEL HTML --------------------------------------------------------
window.addEventListener('load', function () {
  setTimeout(function () {
    const slot = document.getElementById('tbRandPanelSlot');
    if (!slot) return;

    const BD = 'var(--border-width) solid var(--border-color)';
    const R  = 'var(--radius)';

    function chipRow(id, labelText, labelId, fn, items) {
      const chips = items.map(([val, txt]) =>
        `<div class="tb-rand-chip" onclick="${fn}('${val}',this)" data-val="${val}">${txt}</div>`
      ).join('');
      return `<div class="tb-rc-card">
        <div class="tb-rc-hdr">
          <div class="tb-rc-lbl">${labelText}</div>
          <div class="tb-rc-val" id="${labelId}">Random</div>
        </div>
        <div class="tb-rc-chips" id="${id}">${chips}</div>
      </div>`;
    }

    const sliders = `<div class="tb-rc-slider-wrap">
      <input type="range" id="tbHueS" min="0" max="359" value="140" class="tb-rslider"
        style="background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);border-right:${BD}">
      <input type="range" id="tbBriS" min="0" max="100" value="48" class="tb-rslider"
        style="background:linear-gradient(to right,#000,#fff);border-right:${BD}">
      <input type="range" id="tbSatS" min="0" max="100" value="65" class="tb-rslider"
        style="background:linear-gradient(to right,#888,#f4f)">
    </div>`;

    const primaryCard = `<div class="tb-rc-card" onclick="tbRandApply()" style="cursor:pointer">
      <div id="tbRandPrimary" class="tb-rc-primary">#48A971</div>
      <div style="background:var(--primary);border-top:var(--border-width) solid var(--border-color);padding:8px;text-align:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">
        Tap to Randomize Using This as the Primary Color
      </div>
    </div>`;

    function chipRowWithFooter(id, labelText, labelId, fn, items, footerId, descObj) {
      const chips = items.map(([val, txt]) =>
        `<div class="tb-rand-chip" onclick="${fn}('${val}',this)" data-val="${val}">${txt}</div>`
      ).join('');
      return `<div class="tb-rc-card">
        <div class="tb-rc-hdr">
          <div class="tb-rc-lbl">${labelText}</div>
          <div class="tb-rc-val" id="${labelId}">Random</div>
        </div>
        <div class="tb-rc-chips" id="${id}">${chips}</div>
        <div id="${footerId}" style="background:var(--bg-3);border-top:var(--border-width) solid var(--border-color);padding:4px 8px;font-size:var(--text-xs);font-weight:700;letter-spacing:0.04em;color:var(--text-mid);min-height:var(--job-half);display:flex;align-items:center;justify-content:center;text-align:center">${(descObj && descObj['random']) || ''}</div>
      </div>`;
    }

    const bgChips = chipRowWithFooter('tbRandBgChips', 'Background', 'tbRandBgLabel', 'tbRandSetBg', [
      ['random','RND'], ['primary-dark','PRI'], ['complement','COM'], ['analogous','ANA'],
      ['contrast90','90D'], ['warm-neutral','WRM'], ['cool-neutral','COL'], ['true-grey','GRY'],
      ['earthy','ETH'], ['triadic-bg','TRI'], ['split-bg','SPL'], ['secondary-bg','SEC'],
    ], 'tbRandBgDesc', window._rBgDescs);

    const harmChips = chipRowWithFooter('tbRandHarmChips', 'Harmony', 'tbRandHarmLabel', 'tbRandSetHarm', [
      ['random','RND'], ['complementary','COM'], ['analogous','ANA'], ['triadic','TRI'],
      ['tetradic','TET'], ['split','SPL'], ['accented','ACC'], ['fibonacci','FIB'],
      ['monochromatic','MON'], ['double-comp','DBL'], ['near-comp','NRC'], ['rectangle','RCT'],
    ], 'tbRandHarmDesc', window._rHarmDescs);

    const surfChips = chipRowWithFooter('tbRandSurfChips', 'Surface', 'tbRandSurfLabel', 'tbRandSetSurf', [
      ['random','RND'], ['white','WHT'], ['off-white','OFW'], ['light primary','LPR'],
      ['dark primary','DPR'], ['light secondary','LSC'], ['dark secondary','DSC'],
      ['light accent','LAC'], ['dark accent','DAC'], ['tinted neutral','TND'],
      ['light complement','LCM'], ['pure grey','GRY'], ['4th harmony','4TH'],
    ], 'tbRandSurfDesc', window._rSurfDescs);

    const toneChips = chipRowWithFooter('tbRandToneChips', 'Tone', 'tbRandToneLabel', 'tbRandSetTone', [
      ['mix','RND'], ['dark','DRK'], ['mid','MID'], ['light','LGT'],
    ], 'tbRandToneDesc', window._rToneDescs);


    const preview = _rPreviewHTML();

    const btns = `<div onclick="tbRandRandom()"
      style="border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;padding:10px;text-align:center">
      Tap to Randomize
    </div>`;

    const nameCard = `<div id="tbRandNameDisplay" style="height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:var(--text-sm);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;background:var(--primary);color:var(--text-light);flex-shrink:0;">Theme Name</div>`;

    const panel = document.createElement('div');
    panel.className = 'tb-tab-panel tb-body';
    panel.id        = 'tbPanel-randomize';
    panel.style.gap = 'var(--margin)';
    panel.innerHTML = sliders + primaryCard + nameCard + bgChips + harmChips + surfChips + toneChips + preview + btns;
    slot.replaceWith(panel);

    // Wire sliders
    ['tbHueS', 'tbBriS', 'tbSatS'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', _rUpdatePrimaryCard);
    });
    _rUpdatePrimaryCard();
    _rInitChips();
  }, 200);
});
