/* ── PANTRY PRO · recipes.js ──────────────────────────────────────────
   Recipes and Meals: all rx helpers, ingredient matching, cost
   calculation, recipe cards, cook flow, meal tracking, history.
   Depends on: app.js, tabs.js, pantry.js
── */

function rxParseNum(str){ const m=(str||'').match(/[\d.]+/); return m?parseFloat(m[0]):0; }
function rxParseUnit(str){ return (str||'').replace(/[\d.\s¼½¾⅓⅔⅛⅜⅝⅞⅕⅖]+/g,'').trim().toLowerCase(); }
function rxToOz(val,unit){ const u=(unit||'').toLowerCase().replace(/s$/,''); const map={lbs:16,lb:16,g:0.03527,kg:35.27,ml:0.03381,l:33.81,'fl oz':1,oz:1}; return val*(map[u]||1); }

const COUNTABLE_UNITS=new Set(['each','count','piece','pieces','clove','cloves','dozen','dozens','head','heads','stalk','stalks','bunch','bunches','sprig','sprigs','sheet','sheets','slice','slices','strip','strips','fillet','fillets','can','cans','carton','cartons','bag','bags','pack','packs','packet','packets','bottle','bottles','jar','jars','unit','units']);
function rxIsCountUnit(unit){ return COUNTABLE_UNITS.has((unit||'').toLowerCase().replace(/s$/,'')); }

function rxGetIngRatio(ing){
  const haveUnit=rxParseUnit(ing.haveAmt||'');
  const needUnit=rxParseUnit(ing.needAmt||'');
  const haveNum=rxParseNum(ing.haveAmt);
  const needNum=rxParseNum(ing.needAmt);
  // both sides countable — compare directly
  if(rxIsCountUnit(haveUnit)&&(rxIsCountUnit(needUnit)||!needUnit)){
    return needNum>0?haveNum/needNum:Infinity;
  }
  // oz-based comparison via needConverted
  const nc=rxParseNum(ing.needConverted);
  if(nc>0){ return rxToOz(haveNum,haveUnit||'oz')/nc; }
  // fallback: direct numeric ratio
  return needNum>0?haveNum/needNum:Infinity;
}
function rxIngOk(ing){ return rxGetIngRatio(ing)>=1; }
function rxComputeStatus(r){ let hasZero=false,hasShort=false; r.ingredients.forEach(ing=>{ if(rxGetIngRatio(ing)<1){ if(rxParseNum(ing.haveAmt)===0) hasZero=true; else hasShort=true; } }); if(hasZero) return 'missing'; if(hasShort) return 'partial'; return 'ready'; }
function rxOzToVolume(oz){ if(!oz||oz<=0) return '—'; const fracs=[[1,'1'],[7/8,'⅞'],[3/4,'¾'],[2/3,'⅔'],[5/8,'⅝'],[1/2,'½'],[2/5,'⅖'],[3/8,'⅜'],[1/3,'⅓'],[1/4,'¼'],[1/5,'⅕'],[1/8,'⅛']]; function bf(val){ const w=Math.floor(val),r=val-w; const f=fracs.reduce((a,b)=>Math.abs(b[0]-r)<Math.abs(a[0]-r)?b:a); if(Math.abs(f[0]-r)>0.06) return val>=0.95?Math.round(val).toString():val.toFixed(2); const ws=w>0?w.toString():'',fs=f[1]==='1'?'':f[1]==='0'?'':f[1]; return (ws&&fs)?ws+fs:(ws||fs||'0'); } const cups=oz/8; if(cups>=0.24) return bf(cups)+' cup'+(cups>=1.9?'s':''); const tbsp=oz/0.5; if(tbsp>=0.9) return bf(tbsp)+' tbsp'; return bf(oz/0.167)+' tsp'; }
function rxGetScaledDisplay(ing,frac){ const qty=rxParseNum(ing.needAmt); const unit=ing.needAmt.replace(/[\d.¼½¾⅓⅔⅛⅜⅝⅞⅕⅖\s]+/,'').trim(); const scaled=qty*frac; const fracs2=[[1,'1'],[7/8,'⅞'],[3/4,'¾'],[2/3,'⅔'],[5/8,'⅝'],[1/2,'½'],[2/5,'⅖'],[3/8,'⅜'],[1/3,'⅓'],[1/4,'¼'],[1/5,'⅕'],[1/8,'⅛'],[0,'0']]; function bf(val){ const w=Math.floor(val),r=val-w; const f=fracs2.reduce((a,b)=>Math.abs(b[0]-r)<Math.abs(a[0]-r)?b:a); if(Math.abs(f[0]-r)>0.04) return r>0?(w>0?w+val.toFixed(2).slice(1):val.toFixed(2)):w.toString(); const ws=w>0?w.toString():'',fs=f[1]==='1'?'':f[1]==='0'?'':f[1]; return (ws&&fs)?ws+fs:(ws||fs||'0'); } if(unit==='cups'||unit==='cup'){ if(scaled>=1||scaled===0) return bf(scaled)+' cups'; const tb=scaled*16; if(tb>=1) return bf(tb)+' tbsp'; return bf(tb*3)+' tsp'; } if(unit==='tbsp'){ if(scaled>=1) return bf(scaled)+' tbsp'; return bf(scaled*3)+' tsp'; } return bf(scaled)+(unit?' '+unit:''); }
function rxGetRecipes(){ return ls('rx_recipes',[]); }
function rxSetRecipes(d){ lsSet('rx_recipes',d); }
function rxGetMeals(){ return ls('rx_meals',[]); }
function rxSetMeals(d){ lsSet('rx_meals',d); }
function rxGetHistory(){ return ls('rx_history',[]); }
function rxSetHistory(d){ lsSet('rx_history',d); }
function openRecipesWindow(){ closeSettings(); renderRecipesBody(); document.getElementById('recipesWindow').classList.add('open'); }
function closeRecipesWindow(){ document.getElementById('recipesWindow').classList.remove('open'); }
function openMealsWindow(){ closeSettings(); renderMealsBody(); document.getElementById('mealsWindow').classList.add('open'); }
function closeMealsWindow(){ document.getElementById('mealsWindow').classList.remove('open'); }
const RX_STATUS_ICON={ready:'✓',partial:'~',missing:'✗'};
const RX_STATUS_COLOR={ready:'#48a971',partial:'#5A8DB8',missing:'#C85A5A'};
const RX_FRAC_COLORS={3:'#8a7ca8',4:'#5A8DB8',5:'#48a971',8:'#C7824A'};
const RX_FRACS=[{n:1,d:8},{n:1,d:5},{n:1,d:4},{n:1,d:3},{n:3,d:8},{n:2,d:5},{n:1,d:2},{n:3,d:5},{n:5,d:8},{n:2,d:3},{n:3,d:4},{n:4,d:5},{n:7,d:8}];
const RX_UNITS=['oz','lbs','g','kg','ml','l','fl oz','cups','tbsp','tsp','cans','cartons','each','cloves','pinch'];
function rxDiv(label,color){ const d=document.createElement('div'); d.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 2px 2px;flex-shrink:0;'; const l1=document.createElement('div'); l1.style.cssText='flex:1;height:3px;background:#000;'; const sp=document.createElement('span'); sp.style.cssText=`font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${color||'var(--muted)'};flex-shrink:0;`; sp.textContent=label; const l2=document.createElement('div'); l2.style.cssText='flex:1;height:3px;background:#000;'; d.append(l1,sp,l2); return d; }

// 50-item cup→oz conversion table (word-match keys)
// Suggested recipe unit per ingredient type — used to auto-set unit when name is selected
const RX_UNIT_SUGGEST={
  'salt':'tsp','pepper':'tsp','black pepper':'tsp','white pepper':'tsp','cayenne':'tsp',
  'cinnamon':'tsp','nutmeg':'tsp','turmeric':'tsp','ginger':'tsp','cardamom':'tsp',
  'cumin':'tsp','coriander':'tsp','paprika':'tsp','smoked paprika':'tsp',
  'oregano':'tsp','thyme':'tsp','basil':'tsp','rosemary':'tsp','sage':'tsp',
  'bay leaf':'each','bay leaves':'each',
  'chili powder':'tsp','garlic powder':'tsp','onion powder':'tsp',
  'baking powder':'tsp','baking soda':'tsp','cream of tartar':'tsp',
  'vanilla':'tsp','vanilla extract':'tsp',
  'oil':'tbsp','olive oil':'tbsp','vegetable oil':'tbsp','butter':'tbsp',
  'flour':'cups','sugar':'cups','brown sugar':'cups','powdered sugar':'cups',
  'milk':'cups','cream':'cups','water':'cups','broth':'cups','stock':'cups',
  'eggs':'each','egg':'each',
  'garlic':'each','clove':'each','cloves':'each',
};
function rxSuggestUnit(name){ const n=(name||'').toLowerCase(); for(const key of Object.keys(RX_UNIT_SUGGEST)){ if(n===key||n.includes(key)) return RX_UNIT_SUGGEST[key]; } return null; }

const RX_CUP_TO_OZ={
  // ── Grains & starches
  'flour':4.4,'bread flour':4.8,'whole wheat':4.8,'almond flour':3.4,'cornstarch':4.5,
  'rice':6.5,'brown rice':6.8,'oats':3.2,'rolled oats':3.2,'breadcrumbs':4.0,
  'cornmeal':5.0,'pasta':3.5,'quinoa':6.4,'couscous':6.0,
  // ── Sweeteners
  'sugar':7.1,'brown sugar':7.8,'powdered sugar':4.0,'honey':12.0,'maple syrup':11.5,
  'molasses':11.6,'corn syrup':11.5,'agave':11.4,
  // ── Leavening & dry baking
  'baking soda':9.6,'baking powder':6.9,'cocoa':3.4,'unsweetened cocoa':3.4,
  'chocolate chips':6.0,'shredded coconut':2.6,'coconut':2.6,
  'cream of tartar':5.0,'tapioca starch':4.5,'arrowroot':4.5,'xanthan gum':5.2,
  'powdered milk':4.2,'dry milk':4.2,'malted milk':5.0,
  // ── Fats & dairy
  'butter':8.0,'shortening':6.8,'lard':7.2,'coconut oil':7.6,
  'olive oil':7.7,'vegetable oil':7.7,'canola oil':7.7,
  'milk':8.6,'cream':8.4,'yogurt':8.6,'sour cream':8.5,'buttermilk':8.5,
  'heavy cream':8.2,'half and half':8.4,
  // ── Liquids
  'water':8.3,'stock':8.4,'broth':8.4,'soy sauce':9.0,'tomato paste':9.2,
  'vinegar':8.5,'apple cider vinegar':8.5,'lemon juice':8.6,'orange juice':8.7,
  // ── Proteins & legumes
  'peanut butter':9.0,'tahini':9.2,'almond butter':9.0,
  'lentils':6.9,'chickpeas':6.7,'black beans':6.7,'beans':5.8,
  // ── Nuts & seeds
  'almonds':5.1,'walnuts':3.5,'peanuts':5.2,'pecans':3.8,'cashews':4.4,
  'sesame':5.1,'sunflower':5.1,'chia':5.9,'flax':5.4,'hemp seeds':5.4,
  'poppy seeds':5.9,'pumpkin seeds':4.8,
  // ── Cheese & other dairy
  'cheese':4.0,'parmesan':3.5,'shredded cheese':3.4,
  // ── 25 Common Spices (oz per cup)
  'salt':10.2,'kosher salt':6.0,'sea salt':9.6,
  'black pepper':4.0,'pepper':4.0,'white pepper':4.5,'cayenne':3.6,
  'garlic powder':5.1,'onion powder':4.8,'paprika':3.8,'smoked paprika':3.8,
  'cumin':4.3,'ground cumin':4.3,'coriander':3.4,'ground coriander':3.4,
  'cinnamon':4.8,'ground cinnamon':4.8,'nutmeg':4.4,'ground nutmeg':4.4,
  'turmeric':4.8,'ground turmeric':4.8,'ginger':4.4,'ground ginger':4.4,
  'chili powder':4.3,'curry powder':4.1,'allspice':4.6,'cloves':4.3,
  'cardamom':3.8,'ground cardamom':3.8,'oregano':2.0,'dried oregano':2.0,
  'thyme':2.4,'dried thyme':2.4,'basil':2.0,'dried basil':2.0,
  'rosemary':2.4,'dried rosemary':2.4,'sage':2.0,'dried sage':2.0,
  'dill':3.0,'dried dill':3.0,'celery seed':4.4,'mustard powder':3.6,
  'fennel seed':4.0,'caraway':3.8,'bay leaves':1.8,'marjoram':2.0,
  'tarragon':2.4,'dried tarragon':2.4,'chives':1.6,'dried chives':1.6,
  // ── 25 Common Baking Ingredients (oz per cup)
  'cake flour':4.0,'pastry flour':4.2,'self-rising flour':4.4,
  'oat flour':3.0,'rice flour':5.0,'buckwheat flour':4.2,'spelt flour':4.0,
  'coconut flour':4.0,'chickpea flour':3.4,'rye flour':3.6,
  'vital wheat gluten':5.4,'psyllium husk':3.2,
  'vanilla extract':8.5,'almond extract':8.5,
  'instant yeast':4.8,'active dry yeast':5.0,
  'gelatin':5.6,'unflavored gelatin':5.6,
  'powdered sugar substitute':4.0,'monk fruit sweetener':7.0,'erythritol':7.2,
  'protein powder':4.2,'whey protein':3.8,
  'dark chocolate':5.5,'cocoa butter':7.6,
  'marzipan':9.0,'almond paste':9.0,
  'matcha':2.8,'espresso powder':3.6,
  'fleur de sel':8.4,'maldon salt':4.8,
  // ── Liquids & condiments
  'chicken stock':8.4,'beef stock':8.4,'vegetable stock':8.4,'chicken broth':8.4,'beef broth':8.4,
  'fish sauce':9.0,'oyster sauce':9.6,'worcestershire':9.2,'hot sauce':8.6,'sriracha':9.6,
  'ketchup':9.6,'mustard':9.0,'hoisin sauce':9.6,'tahini':9.2,'miso paste':9.6,
  'coconut milk':8.8,'heavy cream':8.2,'half and half':8.4,'evaporated milk':9.0,'condensed milk':11.2,
  'olive oil brine':8.4,'sesame oil':7.6,'peanut oil':7.7,'avocado oil':7.6,
  'red wine':8.5,'white wine':8.4,'bourbon':7.7,'rum':7.9,'brandy':7.9,
  'apple juice':8.7,'pineapple juice':8.7,'pomegranate juice':9.0,'cranberry juice':8.7,
  'alfredo sauce':8.6,'spaghetti sauce':8.8,'pasta sauce':8.8,'marinara':8.8,'marinara sauce':8.8,'arrabbiata':8.8,'vodka sauce':8.8,
  'bechamel':8.8,'white sauce':8.8,'cream sauce':8.4,'cheese sauce':8.8,'nacho cheese':9.2,
  'tikka masala sauce':9.0,'curry sauce':8.8,'enchilada sauce':8.6,'mole':9.2,
  'bbq sauce':9.6,'teriyaki sauce':9.2,'sweet and sour':9.6,'general tso':9.0,
  'pad thai sauce':9.2,'satay sauce':9.0,'buffalo sauce':8.6,'hollandaise':8.8,
  'gravy':8.8,'au jus':8.6,'demi glace':9.6,'tomato sauce':8.8,
  // ── Fresh produce (chopped/diced/minced — cup measurements)
  'onion':5.6,'chopped onion':5.6,'diced onion':5.6,'minced onion':5.6,
  'garlic':5.3,'minced garlic':5.3,'chopped garlic':5.3,
  'tomato':6.0,'diced tomato':6.0,'chopped tomato':6.0,'cherry tomato':5.6,
  'mushroom':2.5,'sliced mushroom':2.5,'chopped mushroom':2.5,
  'bell pepper':5.3,'chopped pepper':5.3,'diced pepper':5.3,
  'celery':4.3,'chopped celery':4.3,'sliced celery':4.3,
  'carrot':4.6,'shredded carrot':4.3,'chopped carrot':4.6,'diced carrot':4.6,
  'cucumber':5.2,'sliced cucumber':4.8,'diced cucumber':5.2,
  'zucchini':4.3,'shredded zucchini':4.3,'diced zucchini':4.3,
  'spinach':1.5,'baby spinach':1.2,'shredded cabbage':3.0,'cabbage':3.0,
  'kale':2.0,'arugula':1.5,'mixed greens':1.5,'lettuce':2.0,
  'broccoli':2.8,'cauliflower':3.5,'peas':5.2,'corn':5.5,'edamame':5.3,
  'avocado':5.0,'mashed avocado':8.6,'potato':6.4,'sweet potato':5.6,'butternut squash':5.0,
  // ── Dried fruits
  'raisins':5.6,'golden raisins':5.4,'cranberries':4.4,'dried cranberries':4.4,
  'dates':5.9,'chopped dates':5.9,'apricots':5.1,'dried apricots':5.1,
  'cherries':5.3,'dried cherries':5.3,'blueberries':5.1,'dried blueberries':5.1,
  'currants':4.9,'dried currants':4.9,'figs':5.6,'dried figs':5.6,
  'prunes':5.9,'mango':4.9,'dried mango':4.9,'papaya':5.3,'dried papaya':5.3,
  'goji berries':4.2,'mulberries':4.6,'barberries':4.2,'acai':4.0,
  'coconut flakes':2.6,'toasted coconut':2.8,'candied ginger':5.9,
  // ── Cheeses
  'mozzarella':4.0,'shredded mozzarella':3.4,'fresh mozzarella':8.6,
  'cheddar':4.0,'shredded cheddar':3.4,'sharp cheddar':4.0,
  'parmesan':3.5,'grated parmesan':3.2,'pecorino':3.5,
  'ricotta':8.8,'cream cheese':8.4,'mascarpone':8.8,'goat cheese':5.6,
  'feta':5.0,'crumbled feta':4.2,'blue cheese':4.8,'brie':8.0,
  'gruyere':3.6,'shredded gruyere':3.4,'swiss cheese':4.0,
  'monterey jack':3.6,'pepper jack':3.6,'provolone':4.0,
  'cottage cheese':8.0,'queso fresco':5.0,'halloumi':6.4,
  // ── Frozen items (thawed cup weights)
  'frozen peas':5.2,'frozen corn':5.5,'frozen edamame':5.3,
  'frozen blueberries':5.1,'frozen raspberries':4.6,'frozen strawberries':5.9,
  'frozen mango':5.3,'frozen spinach':6.0,'frozen broccoli':3.0,
  // ── Pasta & grains (dry, per cup)
  'elbow pasta':3.5,'penne':3.5,'orzo':6.8,'farro':6.4,'millet':6.7,
  'amaranth':6.7,'teff':6.9,'sorghum':6.7,'freekeh':5.6,'bulgur':6.2,
  'barley':7.1,'wild rice':6.0,'arborio rice':7.0,'jasmine rice':6.7,'basmati rice':6.4,
  // ── Sweeteners & syrups
  'golden syrup':11.5,'rice syrup':11.2,'date syrup':11.0,'coconut sugar':6.7,
  'turbinado sugar':7.5,'raw sugar':7.5,'stevia':3.2,'monk fruit':6.8,
  'coconut nectar':11.0,'sorghum syrup':11.5,'pomegranate molasses':10.8,
  'glucose syrup':11.2,'treacle':12.0,'palm sugar':7.0,
  // ── Thickeners & specialty
  'agar agar':3.2,'arrowroot powder':4.5,'modified starch':4.5,
  'nutritional yeast':1.5,'miso':9.6,'white miso':9.6,'red miso':9.6,
  'tomato paste':9.2,'harissa':9.0,'gochujang':9.6,'sambal':9.0,
  'dulce de leche':11.0,'caramel sauce':10.8,'jam':10.4,'jelly':10.4,
  'pesto':8.8,'chimichurri':7.6,'tzatziki':8.8,'hummus':9.2,
  'tahini sauce':8.8,'ranch dressing':8.6,'balsamic glaze':10.4,
  'fish paste':9.6,'anchovy paste':9.6,'marmite':11.0,'vegemite':11.0
};
function rxWordMatch(name){ const n=(name||'').toLowerCase(); for(const key of Object.keys(RX_CUP_TO_OZ)){ if(n.includes(key)||key.split(' ').some(kw=>kw.length>3&&n.includes(kw))) return RX_CUP_TO_OZ[key]; } return null; }
function rxCookingUnitToOz(amount,unit,itemName){ const cupOz=rxWordMatch(itemName); if(!cupOz) return null; const u=(unit||'').toLowerCase(); if(u==='cup'||u==='cups') return amount*cupOz; if(u==='tbsp') return amount*(cupOz/16); if(u==='tsp') return amount*(cupOz/48); if(u==='fl oz') return amount*(cupOz/8); return null; }

// Fuzzy pantry item lookup — exact first, then word-stem match
function rxFindPantryItem(ingName){
  const msItems=ls('ms_items',[]);
  const n=ingName.toLowerCase().trim();
  const nw=n.split(/[\s\-,]+/).filter(w=>w.length>1);
  // exact match
  let m=msItems.find(i=>i.name.toLowerCase()===n);
  if(m) return m;
  // plural/singular exact: egg→eggs, eggs→egg
  m=msItems.find(i=>{ const iLow=i.name.toLowerCase(); return iLow===n+'s'||iLow+'s'===n||iLow===n.replace(/ies$/,'y')||iLow.replace(/ies$/,'y')===n; });
  if(m) return m;
  // multi-word only below — single word ingredients stop here to avoid false matches
  if(nw.length<2) return null;
  // bidirectional word-stem: both sides must be covered
  m=msItems.find(i=>{ const iw=i.name.toLowerCase().split(/[\s\-,]+/).filter(w=>w.length>1); const ingCovered=nw.every(w=>iw.some(iword=>iword.startsWith(w)||w.startsWith(iword))); const itemCovered=iw.every(w=>nw.some(nword=>nword.startsWith(w)||w.startsWith(nword))); return ingCovered&&itemCovered; });
  if(m) return m;
  // single key-word fallback — whole words only, multi-word ingredients only
  m=msItems.find(i=>{ const iWords=i.name.toLowerCase().split(/[\s\-,]+/); return nw.some(w=>w.length>3&&iWords.some(iw=>iw===w)); });
  return m||null;
}

function rxSyncIngHave(r){
  const pantryData=ls('pantry_data',{});
  r.ingredients.forEach(ing=>{
    const msItem=rxFindPantryItem(ing.name);
    if(!msItem){ ing.haveAmt='—'; return; }
    const pd=pantryData[msItem.id];
      const stock=pd?pd.containers.reduce((s,c)=>s+(c.amount||0),0):0;
      const pantryUnit=pd?.unit||'oz';
      // countable units — compare as count, no oz conversion
      if(rxIsCountUnit(pantryUnit)){ ing.haveAmt=stock+' '+pantryUnit; ing.needConverted=''; return; }
      // ── HAVE: pantry stock → oz
      // Weight units: exact conversion, density (ozPerUnit) is IGNORED
      // Volumetric dry (cups/tbsp/tsp): use density (ozPerUnit) to get weight oz
      // Volumetric liquid (fl oz/ml/l/gallon etc): use exact volume conversion
      const WEIGHT_CONV={'oz':1,'lbs':16,'g':0.03527,'kg':35.274};
      const VOL_EXACT={'fl oz':1,'ml':0.03381,'l':33.814,'gallon':128,'gal':128,'pint':16,'pt':16,'quart':32,'qt':32};
      const VOL_DRY=new Set(['cups','cup','tbsp','tsp']);
      const density=ing.ozPerUnit||pd?.ozPerUnit||rxWordMatch(ing.name)||null;
      let stockInOz;
      if(WEIGHT_CONV[pantryUnit]!=null) stockInOz=parseFloat((stock*WEIGHT_CONV[pantryUnit]).toFixed(2));
      else if(VOL_EXACT[pantryUnit]!=null) stockInOz=parseFloat((stock*VOL_EXACT[pantryUnit]).toFixed(2));
      else if(VOL_DRY.has(pantryUnit)&&density){ const mul=pantryUnit==='tbsp'?density/16:pantryUnit==='tsp'?density/48:density; stockInOz=parseFloat((stock*mul).toFixed(2)); }
      else stockInOz=parseFloat(rxToOz(stock,pantryUnit).toFixed(2));
      ing.haveAmt=stockInOz+' oz';
      // ── NEED: recipe amount → oz (must use same oz type as have)
      const needNum=rxParseNum(ing.needAmt);
      const needUnit=ing.needAmt.replace(/[\d.¼½¾⅓⅔⅛⅜⅝⅞⅕⅖\s]+/,'').trim().toLowerCase();
      let calcOz=null;
      if(WEIGHT_CONV[needUnit]!=null) calcOz=parseFloat((needNum*WEIGHT_CONV[needUnit]).toFixed(3));
      else if(VOL_EXACT[needUnit]!=null) calcOz=parseFloat((needNum*VOL_EXACT[needUnit]).toFixed(3));
      else if(needUnit==='cup'||needUnit==='cups') calcOz=density?parseFloat((needNum*density).toFixed(3)):null;
      else if(needUnit==='tbsp') calcOz=density?parseFloat((needNum*(density/16)).toFixed(3)):null;
      else if(needUnit==='tsp') calcOz=density?parseFloat((needNum*(density/48)).toFixed(3)):null;
      if(calcOz!=null) ing.needConverted=String(calcOz);
  });
}

function rxCalcIngOz(amt, unit, ozPerUnit){
  const u=(unit||'').toLowerCase();
  if(u==='oz') return amt;
  if(u==='fl oz') return amt;
  if(u==='lbs') return parseFloat((amt*16).toFixed(3));
  if(u==='g') return parseFloat((amt*0.03527).toFixed(3));
  if(u==='kg') return parseFloat((amt*35.27).toFixed(3));
  if(u==='ml') return parseFloat((amt*0.03381).toFixed(3));
  if(u==='l') return parseFloat((amt*33.81).toFixed(3));
  if(u==='cup'||u==='cups') return ozPerUnit?parseFloat((amt*ozPerUnit).toFixed(3)):null;
  if(u==='tbsp') return ozPerUnit?parseFloat((amt*(ozPerUnit/16)).toFixed(3)):null;
  if(u==='tsp') return ozPerUnit?parseFloat((amt*(ozPerUnit/48)).toFixed(3)):null;
  return ozPerUnit?parseFloat((amt*ozPerUnit).toFixed(3)):null;
}

function rxOpenNewRecipeOverlay(){
  const winEl=document.getElementById('recipesWindow');
  const ov=document.createElement('div'); ov.style.cssText='position:absolute;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:10;display:flex;flex-direction:column;overflow:hidden;';
  const hdr=document.createElement('div'); hdr.style.cssText='height:45px;display:flex;align-items:stretch;border-bottom:3px solid #000;flex-shrink:0;background:var(--bg-1);';
  const ht=document.createElement('div'); ht.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; ht.textContent='New Recipe';
  const hx=document.createElement('button'); hx.style.cssText='width:45px;min-width:45px;background:#502424;border:none;border-left:3px solid #000;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hx.textContent='×'; hx.onclick=()=>ov.remove();
  hdr.append(ht,hx);
  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding:4px;background:var(--bg-2);';
  const nameWrap=document.createElement('div'); nameWrap.style.cssText='height:32px;min-height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;flex-shrink:0;';
  const nameInp=document.createElement('input'); nameInp.type='text'; nameInp.placeholder='Recipe name…'; nameInp.style.cssText='flex:1;background:#c8cdd4;border:none;color:#1a1a1a;font-size:12px;font-weight:600;padding:0 10px;outline:none;font-family:inherit;';
  nameWrap.appendChild(nameInp); body.appendChild(nameWrap);
  body.appendChild(rxDiv('Ingredients','#48a971'));
  const ingList=document.createElement('div'); ingList.style.cssText='display:flex;flex-direction:column;gap:4px;'; body.appendChild(ingList);
  let ings=[]; const msItemNames=ls('ms_items',[]).map(i=>i.name);
  function renderIngs(){
    ingList.innerHTML='';
    ings.forEach((ing,idx)=>{
      const row=document.createElement('div'); row.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;';
      const top=document.createElement('div'); top.style.cssText='height:32px;display:flex;align-items:stretch;';
      const ai=document.createElement('input'); ai.type='number'; ai.placeholder='Amt'; ai.value=ing.amt||''; ai.style.cssText='width:52px;background:#c8cdd4;border:none;border-right:3px solid #000;color:#1a1a1a;font-size:11px;font-weight:700;padding:0 6px;outline:none;font-family:inherit;'; ai.oninput=e=>{ ings[idx].amt=e.target.value; const calcOz=rxCalcIngOz(parseFloat(e.target.value)||0, ings[idx].unit, ings[idx].ozPerUnit); ings[idx].converted=calcOz!=null?String(calcOz):''; if(totalOzEl) totalOzEl.textContent=calcOz!=null&&parseFloat(e.target.value)>0?(calcOz+' oz total'):'— total oz'; };
      const us=document.createElement('select'); us.style.cssText='width:56px;background:var(--bg-2);border:none;border-right:3px solid #000;color:#fff;font-size:9px;font-weight:700;padding:0 2px;outline:none;font-family:inherit;cursor:pointer;appearance:none;text-align:center;'; RX_UNITS.forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; if(u===ing.unit) o.selected=true; us.appendChild(o); }); us.onchange=e=>{ ings[idx].unit=e.target.value; const calcOz=rxCalcIngOz(parseFloat(ings[idx].amt)||0, e.target.value, ings[idx].ozPerUnit); ings[idx].converted=calcOz!=null?String(calcOz):''; renderIngs(); };
      const ni=document.createElement('input'); ni.type='text'; ni.placeholder='Ingredient name…'; ni.value=ing.name||''; ni.style.cssText='flex:1;background:var(--bg-3);border:none;color:#fff;font-size:10px;font-weight:600;padding:0 8px;outline:none;font-family:inherit;';
      function applyIngName(name){
        ings[idx].name=name;
        const msItem=ls('ms_items',[]).find(m=>m.name.toLowerCase()===name.toLowerCase());
        if(msItem){
          const pd=ls('pantry_data',{})[msItem.id];
          if(pd&&pd.ozPerUnit) ings[idx].ozPerUnit=pd.ozPerUnit;
        }
        if(!ings[idx].ozPerUnit){ const wm=rxWordMatch(name); if(wm) ings[idx].ozPerUnit=wm; }
        // auto-suggest unit if still at default 'oz'
        if(ings[idx].unit==='oz'||!ings[idx].unit){
          const suggested=rxSuggestUnit(name);
          if(suggested) ings[idx].unit=suggested;
        }
        const calc=rxCalcIngOz(parseFloat(ings[idx].amt)||0, ings[idx].unit, ings[idx].ozPerUnit);
        ings[idx].converted=calc!=null?String(calc):'';
        renderIngs();
      }
      ni.oninput=e=>{ ings[idx].name=e.target.value; const q=e.target.value.toLowerCase(); let ac=row.querySelector('.rx-ac'); if(ac) ac.remove(); const sugg=msItemNames.filter(n=>n.toLowerCase().startsWith(q)&&q.length>1); if(sugg.length){ ac=document.createElement('div'); ac.className='rx-ac'; ac.style.cssText='background:var(--bg-2);border-top:2px solid #000;'; sugg.slice(0,3).forEach(s=>{
        const msItem=ls('ms_items',[]).find(m=>m.name.toLowerCase()===s.toLowerCase());
        const pd=msItem?ls('pantry_data',{})[msItem.id]:null;
        const stock=pd?pd.containers.reduce((t,c)=>t+(c.amount||0),0):0;
        const UNIT_EXACT_CONV={'fl oz':8,'ml':236.6,'l':0.2366,'cups':1,'cup':1,'tbsp':16,'tsp':48,'gallon':0.0625,'gal':0.0625,'pint':0.5,'pt':0.5,'quart':0.25,'qt':0.25};
        const isVol=pd&&VOLUMETRIC_UNITS.has((pd.unit||'').toLowerCase());
        const exactConv=pd?UNIT_EXACT_CONV[(pd.unit||'').toLowerCase()]||null:null;
        const ozPerUnit=pd?.ozPerUnit||exactConv||rxWordMatch(s)||(rxIsLiquid(s)?8.5:null);
        const stockOz=stock>0?(isVol||ozPerUnit?parseFloat((stock*(ozPerUnit||1)).toFixed(1)):parseFloat(rxToOz(stock,pd?.unit||'oz').toFixed(1))):0;
        const inStock=stock>0;
        const si=document.createElement('div'); si.style.cssText='height:32px;display:flex;align-items:stretch;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.3);';
        const nm=document.createElement('div'); nm.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:600;color:#fff;background:var(--bg-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; nm.textContent=s;
        const d1=document.createElement('div'); d1.style.cssText='width:2px;background:#000;flex-shrink:0;';
        const stockSec=document.createElement('div'); stockSec.style.cssText=`width:52px;min-width:52px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:${inStock?'#1d3318':'#2a1010'};color:${inStock?'#48a971':'#C85A5A'};flex-shrink:0;`; stockSec.textContent=inStock?'IN STOCK':'NONE';
        const d2=document.createElement('div'); d2.style.cssText='width:2px;background:#000;flex-shrink:0;';
        const ozSec=document.createElement('div'); ozSec.style.cssText=`width:52px;min-width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:${inStock?'#fff':'var(--muted)'};background:var(--bg-3);flex-shrink:0;gap:1px;`;
        const ozVal=document.createElement('div'); ozVal.style.cssText='font-size:9px;font-weight:800;'; ozVal.textContent=inStock?stockOz+'oz':'—';
        const ozLbl=document.createElement('div'); ozLbl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;'; ozLbl.textContent='in pantry';
        ozSec.append(ozVal,ozLbl);
        si.append(nm,d1,stockSec,d2,ozSec);
        si.onmousedown=ev=>{ ev.preventDefault(); ings[idx].name=s; applyIngName(s); }; ac.appendChild(si); });
        // "use as typed" if no exact match exists
        const exactMatch=sugg.some(s=>s.toLowerCase()===q);
        if(!exactMatch){ const useAs=document.createElement('div'); useAs.style.cssText='height:28px;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:var(--muted);cursor:pointer;border-top:1px solid rgba(0,0,0,0.3);font-style:italic;'; useAs.textContent='Use "'+ni.value+'" (not in store)'; useAs.onmousedown=ev=>{ ev.preventDefault(); ings[idx].name=ni.value; ac.remove(); }; ac.appendChild(useAs); }
        row.appendChild(ac); } else if(q.length>1){ ac=document.createElement('div'); ac.className='rx-ac'; ac.style.cssText='background:var(--bg-2);border-top:2px solid #000;'; const useAs=document.createElement('div'); useAs.style.cssText='height:28px;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:var(--muted);cursor:pointer;font-style:italic;'; useAs.textContent='Use "'+ni.value+'" (not in store)'; useAs.onmousedown=ev=>{ ev.preventDefault(); ings[idx].name=ni.value; ac.remove(); }; ac.appendChild(useAs); row.appendChild(ac); } };
      const dx=document.createElement('div'); dx.style.cssText='width:32px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;background:#502424;color:#fff;cursor:pointer;border-left:3px solid #000;'; dx.textContent='×'; dx.onclick=()=>{ ings.splice(idx,1); renderIngs(); };
      const bot=document.createElement('div'); bot.style.cssText='height:28px;display:flex;align-items:stretch;border-top:2px solid #000;flex-shrink:0;';
      const isVolUnit=['cup','cups','tbsp','tsp'].includes((ing.unit||'').toLowerCase());
      const ci=document.createElement('input'); ci.type='number'; ci.step='0.01'; ci.placeholder='oz per cup…'; ci.value=ing.ozPerUnit||''; ci.style.cssText='width:50%;background:var(--bg-3);border:none;color:var(--muted);font-size:9px;font-weight:600;padding:0 8px;outline:none;font-family:inherit;box-sizing:border-box;';
      ci.oninput=e=>{ const v=parseFloat(e.target.value)||null; ings[idx].ozPerUnit=v; const calc=rxCalcIngOz(parseFloat(ings[idx].amt)||0,ings[idx].unit,v); ings[idx].converted=calc!=null?String(calc):''; if(totalOzEl) totalOzEl.textContent=calc!=null&&parseFloat(ings[idx].amt)>0?(calc+' oz total'):'— total oz'; };
      const divEl=document.createElement('div'); divEl.style.cssText='width:2px;background:#000;flex-shrink:0;';
      const totalOzEl=document.createElement('div'); totalOzEl.style.cssText='width:50%;display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);box-sizing:border-box;';
      const calcOz=rxCalcIngOz(parseFloat(ing.amt)||0,ing.unit,ing.ozPerUnit);
      totalOzEl.textContent=calcOz!=null&&parseFloat(ing.amt)>0?(calcOz+' oz total'):'— total oz';
      bot.append(ci,divEl,totalOzEl); top.append(ai,us,ni,dx); row.append(top,bot); ingList.appendChild(row);
    });
    const addBtn=document.createElement('div'); addBtn.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;cursor:pointer;'; const ai2=document.createElement('div'); ai2.style.cssText='width:32px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;background:var(--bg-2);color:#48a971;border-right:3px solid #000;'; ai2.textContent='+'; const al=document.createElement('div'); al.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);'; al.textContent='Add Ingredient'; addBtn.append(ai2,al); addBtn.onclick=()=>{ ings.push({name:'',amt:'',unit:'oz',converted:''}); renderIngs(); setTimeout(()=>{ const ins=ingList.querySelectorAll('input[type=text]'); if(ins.length) ins[ins.length-1].focus(); },50); }; ingList.appendChild(addBtn);
  }
  renderIngs();
  const saveRow=document.createElement('div'); saveRow.style.cssText='height:45px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;margin-top:8px;cursor:pointer;'; const saveLbl=document.createElement('div'); saveLbl.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;background:#1d3318;color:#48a971;'; saveLbl.textContent='Save Recipe'; const errMsg=document.createElement('div'); errMsg.style.cssText='font-size:9px;color:var(--color-1);padding:4px 8px;text-align:center;min-height:20px;'; saveRow.appendChild(saveLbl);
  saveRow.onclick=()=>{ const name=nameInp.value.trim(); if(!name){ errMsg.textContent='Please enter a name.'; return; } const validIngs=ings.filter(i=>i.name.trim()); if(!validIngs.length){ errMsg.textContent='Add at least one ingredient.'; return; } const recipes=rxGetRecipes(); recipes.push({id:'rx_'+Date.now(),name,ingredients:validIngs.map(i=>({name:i.name.trim(),needAmt:i.amt+' '+i.unit,needConverted:i.converted||'',ozPerUnit:i.ozPerUnit||null,haveAmt:'—'})),cookLog:[],totalCost:0,costBreakdown:[]}); rxSetRecipes(recipes); ov.remove(); renderRecipesBody(); };
  body.append(saveRow,errMsg); ov.append(hdr,body); winEl.appendChild(ov);
}

let rxOpenId=null, rxExpandTab={};
function rxBuildCard(r){
  rxSyncIngHave(r); const status=rxComputeStatus(r);
  const wrap=document.createElement('div'); wrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
  const main=document.createElement('div'); main.style.cssText='height:32px;display:flex;align-items:stretch;position:relative;overflow:hidden;cursor:pointer;background:var(--bg-2);';
  const fill=document.createElement('div'); fill.style.cssText='position:absolute;left:0;top:0;bottom:0;width:0%;pointer-events:none;';
  const icon=document.createElement('div'); icon.style.cssText=`width:32px;min-width:32px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${RX_STATUS_COLOR[status]};border-right:var(--border-width) solid var(--border-color);z-index:2;flex-shrink:0;`; icon.textContent=RX_STATUS_ICON[status];
  const center=document.createElement('div'); center.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:2;overflow:hidden;';
  const nm=document.createElement('div'); nm.style.cssText='font-size:10px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;padding:0 6px;line-height:1;'; nm.textContent=r.name;
  const mt=document.createElement('div'); mt.style.cssText='font-size:8px;font-weight:600;color:rgba(255,255,255,0.55);line-height:1;margin-top:2px;'; mt.textContent=`${r.ingredients.filter(rxIngOk).length}/${r.ingredients.length} ready`;
  center.append(nm,mt);
  const ce=document.createElement('div'); ce.style.cssText='width:52px;min-width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:var(--border-width) solid var(--border-color);background:var(--bg-3);z-index:2;flex-shrink:0;gap:1px;'; const cvv=document.createElement('div'); cvv.style.cssText='font-size:9px;font-weight:800;color:#48a971;'; cvv.textContent=r.totalCost>0?'$'+r.totalCost.toFixed(2):'—'; const cll=document.createElement('div'); cll.style.cssText='font-size:6px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);'; cll.textContent='batch'; ce.append(cvv,cll); main.append(fill,icon,center,ce);
  const expand=document.createElement('div'); expand.className='pt-expand-animated'; expand.style.cssText='background:var(--bg-2);overflow:hidden;max-height:0;';
  function renderExpand(){
    rxSyncIngHave(r); // always use fresh pantry data
    const status=rxComputeStatus(r); // recompute live
    expand.innerHTML=''; const body=document.createElement('div'); body.style.cssText='display:flex;flex-direction:column;gap:4px;padding:4px;background:var(--bg-2);'; const tab=rxExpandTab[r.id]||'ingredients';
    const ts=document.createElement('div'); ts.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;flex-shrink:0;';
    [['ingredients','Ingredients'],['steps','Steps'],['cost','Cost'],['log','Log']].forEach(([t,l],i,arr)=>{ const btn=document.createElement('div'); btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;background:${tab===t?'var(--bg-4)':'var(--bg-3)'};color:${tab===t?'#fff':'var(--muted)'};${i<arr.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`; btn.textContent=l; btn.onclick=e=>{ e.stopPropagation(); rxExpandTab[r.id]=t; renderExpand(); }; ts.appendChild(btn); }); body.appendChild(ts);
    if(tab==='ingredients'){
      const rc=document.createElement('div'); rc.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;position:relative;flex-shrink:0;'; const rfill=document.createElement('div'); rfill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${r.ingredients.filter(rxIngOk).length/r.ingredients.length*100}%;background:${RX_STATUS_COLOR[status]};opacity:0.25;pointer-events:none;`; const rtxt=document.createElement('div'); rtxt.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;position:relative;z-index:2;'; rtxt.textContent=`${r.ingredients.filter(rxIngOk).length} of ${r.ingredients.length} ingredients available`; rc.append(rfill,rtxt); body.appendChild(rc);
      r.ingredients.forEach(ing=>{ const ok=rxIngOk(ing); const row=document.createElement('div'); row.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;position:relative;'; const ifill=document.createElement('div'); ifill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${ok?100:10}%;background:${ok?'#48a971':'#C85A5A'};opacity:0.15;pointer-events:none;`; const nc=document.createElement('div'); nc.style.cssText='width:64px;min-width:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);position:relative;z-index:2;gap:1px;'; const nv=document.createElement('div'); nv.style.cssText='font-size:9px;font-weight:800;color:#fff;'; nv.textContent=ing.needAmt; const nl=document.createElement('div'); nl.style.cssText='font-size:7px;font-weight:700;color:rgba(255,255,255,0.4);'; nl.textContent=ing.needConverted?rxParseNum(ing.needConverted)+'oz':''; nc.append(nv,nl); const inm=document.createElement('div'); inm.style.cssText='flex:1;display:flex;align-items:center;padding:0 8px;font-size:9px;font-weight:700;color:#fff;position:relative;z-index:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'; inm.textContent=ing.name; const hc=document.createElement('div'); hc.style.cssText=`width:64px;min-width:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:var(--border-width) solid var(--border-color);position:relative;z-index:2;gap:1px;background:${ok?'rgba(72,169,113,0.15)':'rgba(200,90,90,0.15)'};`; const hv=document.createElement('div'); hv.style.cssText=`font-size:9px;font-weight:800;color:${ok?'#48a971':'#C85A5A'};`; hv.textContent=ing.haveAmt; const hl=document.createElement('div'); hl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;'; hl.textContent='in pantry'; hc.append(hv,hl); row.append(ifill,nc,inm,hc); body.appendChild(row); });
      const addIngCard=document.createElement('div'); addIngCard.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:#fff;'; const addIngLbl=document.createElement('div'); addIngLbl.style.cssText='font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#1d3318;'; addIngLbl.textContent='Add More Ingredients'; addIngCard.appendChild(addIngLbl); addIngCard.onclick=e=>{ e.stopPropagation(); openEditRecipeWindow(r,()=>{ renderRecipesBody(); }); }; body.appendChild(addIngCard);
      if(status!=='ready'){ const glBtn=document.createElement('div'); glBtn.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;'; const glI=document.createElement('div'); glI.style.cssText='width:32px;background:#fff;border-right:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#48a971;'; glI.textContent='+'; const glL=document.createElement('div'); glL.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#fff;background:var(--bg-3);'; glL.textContent='Add Missing to Grocery List'; glBtn.append(glI,glL); glBtn.onclick=e=>{ e.stopPropagation(); const gl=ls('gl_items',[]); r.ingredients.filter(i=>!rxIngOk(i)).forEach(ing=>{ if(!gl.find(g=>g.name.toLowerCase()===ing.name.toLowerCase())){ const msItem=ls('ms_items',[]).find(m=>m.name.toLowerCase()===ing.name.toLowerCase()); if(msItem) gl.push({id:'gl_'+Date.now()+Math.random(),name:ing.name,category:msItem.category,checked:false}); } }); lsSet('gl_items',gl); glRender(); }; body.appendChild(glBtn); }
      if(status==='partial'){ const ratios=r.ingredients.map(ing=>({ing,ratio:rxGetIngRatio(ing)})).filter(x=>isFinite(x.ratio)&&x.ratio>=0); const sf=ratios.length>0?Math.max(0,Math.min(1,parseFloat(Math.min(...ratios.map(x=>x.ratio)).toFixed(4)))):1; const sp=Math.round(sf*100); const limIng=ratios.length>0?ratios.reduce((a,b)=>a.ratio<b.ratio?a:b).ing:null; if(sp>0&&sf>0){ const scCard=document.createElement('div'); scCard.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;'; const scHdr=document.createElement('div'); scHdr.style.cssText='height:32px;display:flex;align-items:stretch;position:relative;overflow:hidden;'; const scFill=document.createElement('div'); scFill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${sp}%;background:#5A8DB8;opacity:0.25;pointer-events:none;`; const scL=document.createElement('div'); scL.style.cssText='flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:0 10px;position:relative;z-index:2;gap:1px;'; const scT=document.createElement('div'); scT.style.cssText='font-size:9px;font-weight:800;color:#fff;'; scT.textContent=`Scale to ${sp}% batch`; const scS=document.createElement('div'); scS.style.cssText='font-size:7px;font-weight:600;color:rgba(255,255,255,0.5);'; scS.textContent=limIng?`Limited by: ${limIng.name}`:''; scL.append(scT,scS); scHdr.append(scFill,scL); scCard.appendChild(scHdr); const scIW=document.createElement('div'); scIW.style.cssText='border-top:var(--border-width) solid var(--border-color);'; r.ingredients.forEach((ing,idx)=>{ const needUnit=rxParseUnit(ing.needAmt||''); const isCount=rxIsCountUnit(needUnit)||rxIsCountUnit(rxParseUnit(ing.haveAmt||'')); const scaledOz=(!isCount&&ing.needConverted)?parseFloat((rxParseNum(ing.needConverted)*sf).toFixed(3)):null; const scRow=document.createElement('div'); scRow.style.cssText=`height:32px;display:flex;align-items:stretch;${idx<r.ingredients.length-1?'border-bottom:var(--border-width) solid var(--border-color);':''}`; const scN=document.createElement('div'); scN.style.cssText='width:72px;min-width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);gap:1px;'; const snv=document.createElement('div'); snv.style.cssText=`font-size:9px;font-weight:800;color:${ing===limIng?'#C7824A':'#fff'};`; snv.textContent=isCount?rxGetScaledDisplay(ing,sf):(scaledOz!==null?rxOzToVolume(scaledOz):rxGetScaledDisplay(ing,sf)); const snl=document.createElement('div'); snl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);letter-spacing:0.06em;'; snl.textContent=isCount?'':(scaledOz!==null?scaledOz+' oz':'—'); scN.append(snv,snl); const scNm=document.createElement('div'); scNm.style.cssText='flex:1;display:flex;align-items:center;padding:0 8px;font-size:9px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'; scNm.textContent=ing.name; const hvn=rxParseNum(ing.haveAmt); const nsn=isCount?rxParseNum(ing.needAmt)*sf:(scaledOz||rxParseNum(ing.needAmt)*sf); const ok2=hvn>=nsn; const scH=document.createElement('div'); scH.style.cssText=`width:72px;min-width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:var(--border-width) solid var(--border-color);gap:1px;background:${ok2?'rgba(72,169,113,0.15)':'rgba(200,90,90,0.15)'};`; const shv=document.createElement('div'); shv.style.cssText=`font-size:9px;font-weight:800;color:${ok2?'#48a971':'#C85A5A'};`; shv.textContent=ing.haveAmt; const shl=document.createElement('div'); shl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;'; shl.textContent='in pantry'; scH.append(shv,shl); scRow.append(scN,scNm,scH); scIW.appendChild(scRow); }); scCard.appendChild(scIW); body.appendChild(scCard); } }
      const canCook=status==='ready'; const isPartial=status==='partial'; const ratios2=r.ingredients.map(ing=>({ing,ratio:rxGetIngRatio(ing)})).filter(x=>isFinite(x.ratio)&&x.ratio>=0); const sf2=ratios2.length>0?Math.max(0,Math.min(1,parseFloat(Math.min(...ratios2.map(x=>x.ratio)).toFixed(4)))):0; const sp2=Math.round(sf2*100);
      const cookCard=document.createElement('div'); cookCard.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;'; const cookLbl=document.createElement('div'); cookLbl.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);'; cookLbl.textContent=canCook?'Full batch — all ingredients ready':isPartial?`Cook at ${sp2}% — max available`:'Missing ingredients — cannot cook'; const cookBtn=document.createElement('div'); cookBtn.style.cssText=`width:72px;min-width:72px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;border-left:var(--border-width) solid var(--border-color);background:${canCook||isPartial?'#1d3318':'var(--bg-4)'};color:${canCook||isPartial?'#48a971':'var(--muted)'};cursor:${canCook||isPartial?'pointer':'default'};`; cookBtn.textContent='COOK'; cookBtn.onclick=e=>{ e.stopPropagation(); if(!canCook&&!isPartial) return;
      const frac=canCook?1:sf2;
      const label=canCook?r.name:`${r.name} (${sp2}%)`;
      // deduct pantry stock and calculate cost
      const pantryData=ls('pantry_data',{});
      let totalCost=0; const costBreakdown=[];
      r.ingredients.forEach(ing=>{
        const msItem=rxFindPantryItem(ing.name); if(!msItem) return;
        const pd=pantryData[msItem.id]; if(!pd||!pd.containers.length) return;
        const ingUnit=rxParseUnit(ing.needAmt||'');
        const isCountIng=rxIsCountUnit(ingUnit);
        const needOz=isCountIng?rxParseNum(ing.needAmt)*frac:(rxParseNum(ing.needConverted)*frac||rxParseNum(ing.needAmt)*frac);
        if(!needOz) return;
        // sort oldest first, then most depleted
        const sorted=[...pd.containers].sort((a,b)=>{ if((a.addedTs||0)!==(b.addedTs||0)) return (a.addedTs||0)-(b.addedTs||0); return a.amount-b.amount; });
        let remaining=needOz; let ingCost=0;
        const isLiqDed=pd.ozType==='liquid'||(['fl oz','ml','l','gallon','gal','pint','pt','quart','qt'].includes((pd.unit||'').toLowerCase()));
        const WCONV={'oz':1,'lbs':16,'g':0.03527,'kg':35.274};
        const VCONV={'fl oz':1,'ml':0.03381,'l':33.814,'gallon':128,'gal':128,'pint':16,'pt':16,'quart':32,'qt':32};
        const dedDry=new Set(['cups','cup','tbsp','tsp']);
        const dedDensity=pd.ozPerUnit||rxWordMatch(msItem.name)||null;
        let dedUnitOz;
        if(WCONV[(pd.unit||'').toLowerCase()]!=null) dedUnitOz=WCONV[(pd.unit||'').toLowerCase()];
        else if(VCONV[(pd.unit||'').toLowerCase()]!=null) dedUnitOz=VCONV[(pd.unit||'').toLowerCase()];
        else if(dedDry.has((pd.unit||'').toLowerCase())&&dedDensity){ const u=(pd.unit||'').toLowerCase(); dedUnitOz=u==='tbsp'?dedDensity/16:u==='tsp'?dedDensity/48:dedDensity; }
        else dedUnitOz=1;
        sorted.forEach(con=>{
          if(remaining<=0||con.amount<=0) return;
          const conOz=con.amount*dedUnitOz;
          const take=Math.min(conOz,remaining);
          const takeFrac=take/conOz;
          if(con.free){ /* $0 */ }
          else if(con.price!=null){ ingCost+=con.price*takeFrac; }
          con.amount=parseFloat(Math.max(0,con.amount-take/dedUnitOz).toFixed(4));
          if(con.amount<0.0005) con.amount=0; // clamp float residue
          remaining-=take;
        });
        if(ingCost>0){ totalCost+=ingCost; costBreakdown.push({name:ing.name,cost:'$'+ingCost.toFixed(2)}); }
        pantryData[msItem.id]=pd;
      });
      lsSet('pantry_data',pantryData);
      // update recipe cost history
      const recipes=rxGetRecipes(); const ri=recipes.findIndex(rx=>rx.id===r.id);
      if(ri>=0){ recipes[ri].totalCost=parseFloat(totalCost.toFixed(2)); recipes[ri].costBreakdown=costBreakdown; if(!recipes[ri].cookLog) recipes[ri].cookLog=[]; recipes[ri].cookLog.unshift({date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}),note:'Cooked'}); rxSetRecipes(recipes); }
      const meals=rxGetMeals(); meals.unshift({id:'meal_'+Date.now(),recipeId:r.id,recipeName:label,cookedDate:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}),cookedTs:Date.now(),remaining:1.0,batchSize:parseFloat((frac*100).toFixed(0)),cost:parseFloat(totalCost.toFixed(2)),confirmFinished:false});
      rxSetMeals(meals); ptRender();
      const updatedRecipe=rxGetRecipes().find(rx=>rx.id===r.id);
      if(updatedRecipe){ Object.assign(r,updatedRecipe); rxSyncIngHave(r); renderExpand(); }
    }; cookCard.append(cookLbl,cookBtn); body.appendChild(cookCard);
    } else if(tab==='cost'){
      const breakdown=r.costBreakdown||[];
      const knownCost=r.totalCost||0;

      // Live estimate: calculate cost per ingredient from pantry container prices
      function liveIngCost(ing){
        const msItem=rxFindPantryItem(ing.name); if(!msItem) return null;
        const pd=ls('pantry_data',{})[msItem.id]; if(!pd||!pd.containers.length) return null;
        const needOz=rxParseNum(ing.needConverted)||null; if(!needOz) return null;
        const ozPerUnit=pd.ozPerUnit||1;
        // find cheapest non-free container with stock, or any priced container for price-per-oz
        const priced=pd.containers.filter(c=>!c.free&&c.price!=null&&c.cap>0);
        if(!priced.length) return 0; // all free
        // weighted avg price per oz across all priced containers
        const totalOz=priced.reduce((s,c)=>s+c.cap*ozPerUnit,0);
        const totalCost=priced.reduce((s,c)=>s+c.price,0);
        if(!totalOz) return null;
        const pricePerOz=totalCost/totalOz;
        return parseFloat((pricePerOz*needOz).toFixed(2));
      }

      // Build display rows
      const cc=document.createElement('div'); cc.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
      let liveTotal=0; let liveTotalValid=true;
      const rows=r.ingredients.map(ing=>{
        const cooked=breakdown.find(b=>b.name===ing.name);
        const est=liveIngCost(ing);
        const costVal=cooked?parseFloat(cooked.cost.replace('$','')):(est!=null?est:null);
        if(costVal==null) liveTotalValid=false; else liveTotal+=costVal;
        return {ing, cooked, est, costVal};
      });

      const displayTotal=knownCost>0?knownCost:(liveTotalValid?liveTotal:null);
      const ch=document.createElement('div'); ch.style.cssText='height:32px;display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);background:var(--bg-2);';
      const ct=document.createElement('div'); ct.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);'; ct.textContent=knownCost>0?'Last Cook Cost':'Estimated Cost';
      const ctot=document.createElement('div'); ctot.style.cssText='padding:0 14px;display:flex;align-items:center;font-size:13px;font-weight:800;color:#48a971;border-left:var(--border-width) solid var(--border-color);'; ctot.textContent=displayTotal!=null?'$'+displayTotal.toFixed(2):'—';
      ch.append(ct,ctot); cc.appendChild(ch);

      rows.forEach(({ing,cooked,est,costVal},idx)=>{
        const row=document.createElement('div'); row.style.cssText=`height:32px;display:flex;align-items:stretch;${idx<rows.length-1?'border-bottom:var(--border-width) solid var(--border-color)':''}`;
        const ci=document.createElement('div'); ci.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:600;color:#fff;background:var(--bg-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'; ci.textContent=ing.name;
        const ca=document.createElement('div'); ca.style.cssText=`width:72px;min-width:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${costVal!=null?'#48a971':'var(--muted)'};border-left:var(--border-width) solid var(--border-color);background:var(--bg-2);gap:1px;`;
        const cv=document.createElement('div'); cv.textContent=costVal!=null?'$'+costVal.toFixed(2):'—';
        const cl=document.createElement('div'); cl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;'; cl.textContent=cooked?'last cook':est!=null?'estimate':'no data';
        ca.append(cv,cl); row.append(ci,ca); cc.appendChild(row);
      });
      body.appendChild(cc);
      if(!liveTotalValid&&!knownCost){ const note=document.createElement('div'); note.style.cssText='font-size:8px;color:var(--muted);padding:3px 4px;font-style:italic;'; note.textContent='Some ingredients missing price or conversion data'; body.appendChild(note); }
    } else if(tab==='steps'){
      if(!r.steps) r.steps=[];
      r.steps.forEach((step,idx)=>{
        const stepRow=document.createElement('div'); stepRow.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;align-items:stretch;min-height:32px;';
        const num=document.createElement('div'); num.style.cssText='width:28px;min-width:28px;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;font-size:9px;font-weight:800;color:var(--muted);background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);flex-shrink:0;'; num.textContent=idx+1;
        const txt=document.createElement('div'); txt.style.cssText='flex:1;padding:8px 10px;font-size:9px;font-weight:600;color:#fff;background:var(--bg-2);line-height:1.5;word-break:break-word;'; txt.textContent=step;
        stepRow.append(num,txt); body.appendChild(stepRow);
      });
      const addStep=document.createElement('div'); addStep.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff;flex-shrink:0;';
      const addStepLbl=document.createElement('div'); addStepLbl.style.cssText='font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#1d3318;'; addStepLbl.textContent='Add Step';
      addStep.appendChild(addStepLbl);
      addStep.onclick=e=>{ e.stopPropagation(); openAddStepWindow(r, ()=>{ renderExpand(); }); };
      body.appendChild(addStep);
    } else if(tab==='log'){
      if(!r.cookLog||!r.cookLog.length){ const e=document.createElement('div'); e.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;background:var(--bg-2);font-size:9px;color:var(--muted);font-style:italic;'; e.textContent='No cook history yet'; body.appendChild(e); }
      else r.cookLog.forEach((entry,eIdx)=>{ const row=document.createElement('div'); row.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;'; const ld=document.createElement('div'); ld.style.cssText='width:64px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:var(--muted);background:var(--bg-2);border-right:var(--border-width) solid var(--border-color);'; ld.textContent=entry.date; const ll=document.createElement('div'); ll.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:600;color:#fff;background:var(--bg-3);'; ll.textContent=entry.note||'Cooked'; const dx=document.createElement('div'); dx.style.cssText='width:36px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:#C85A5A;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; dx.textContent='×'; dx._t=0; dx._timer=null; dx.onclick=e=>{ e.stopPropagation(); dx._t++; clearTimeout(dx._timer); if(dx._t>=2){ dx._t=0; r.cookLog.splice(eIdx,1); const hist=rxGetHistory(); const filteredHist=hist.filter(h=>!(h.recipeName===r.name&&h.cookedDate===entry.date)); rxSetHistory(filteredHist); const recipes=rxGetRecipes(); const ri=recipes.findIndex(rx=>rx.id===r.id); if(ri>=0){ recipes[ri].cookLog=r.cookLog; rxSetRecipes(recipes); } renderExpand(); } else { dx.style.background='#fff'; dx.style.color='#C85A5A'; dx._timer=setTimeout(()=>{ dx._t=0; dx.style.background='#C85A5A'; dx.style.color='#fff'; },3000); } }; row.append(ld,ll,dx); body.appendChild(row); });
      // delete recipe — at bottom of log tab, two-tap
      const delCard=document.createElement('div'); delCard.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;margin-top:4px;';
      const rxEditSec=document.createElement('div'); rxEditSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:var(--bg-2);cursor:pointer;'; rxEditSec.textContent='Edit';
      rxEditSec.onclick=e=>{ e.stopPropagation(); openEditRecipeWindow(r,()=>{ renderRecipesBody(); }); };
      const rxDelDiv=document.createElement('div'); rxDelDiv.style.cssText='width:var(--border-width);background:var(--border-color);flex-shrink:0;';
      const rxDelSec=document.createElement('div'); rxDelSec.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;background:#C85A5A;cursor:pointer;'; rxDelSec.textContent='Delete'; rxDelSec._t=0; rxDelSec._timer=null;
      rxDelSec.onclick=e=>{ e.stopPropagation(); rxDelSec._t++; clearTimeout(rxDelSec._timer); if(rxDelSec._t>=2){ rxSetRecipes(rxGetRecipes().filter(rx=>rx.id!==r.id)); rxOpenId=null; renderRecipesBody(); } else { rxDelSec.style.background='#fff'; rxDelSec.style.color='#C85A5A'; rxDelSec._timer=setTimeout(()=>{ rxDelSec._t=0; rxDelSec.style.background='#C85A5A'; rxDelSec.style.color='#fff'; },3000); } };
      delCard.append(rxEditSec,rxDelDiv,rxDelSec); body.appendChild(delCard);
    }
    expand.appendChild(body);
  }
  main.addEventListener('click',()=>{ if(rxOpenId===r.id){ rxOpenId=null; expand.style.maxHeight='0'; expand.style.borderTop='none'; focusDimHide(); ptScrollBack(wrap._savedScrollY); wrap._savedScrollY=undefined; } else { document.querySelectorAll('.rx-exp-open').forEach(e=>{ e.style.maxHeight='0'; e.style.borderTop='none'; e.classList.remove('rx-exp-open'); }); rxOpenId=r.id; wrap.classList.add('pt-card-wrap'); renderExpand(); expand.style.maxHeight='900px'; expand.style.borderTop='var(--border-width) solid var(--border-color)'; expand.classList.add('rx-exp-open'); wrap._savedScrollY=window.scrollY; focusDimShow(wrap); } });
  wrap.append(main,expand); return wrap;
}

function openAddStepWindow(r, onSave){
  const ov=document.createElement('div'); ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:350;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';
  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-1);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; htitle.textContent='Edit Steps';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hclose.textContent='×'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);

  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;padding:var(--margin);gap:var(--margin);';

  // working copy of steps
  let steps=[...(r.steps||[])];

  function renderSteps(){
    body.innerHTML='';
    steps.forEach((step,idx)=>{
      const wrap=document.createElement('div'); wrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;';
      const topBar=document.createElement('div'); topBar.style.cssText='height:28px;display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-3);';
      const numLbl=document.createElement('div'); numLbl.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);'; numLbl.textContent='Step '+(idx+1);
      const dx=document.createElement('div'); dx.style.cssText='width:36px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;background:#C85A5A;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; dx.textContent='×';
      dx.onclick=()=>{ steps.splice(idx,1); renderSteps(); };
      topBar.append(numLbl,dx);
      const ta=document.createElement('textarea'); ta.value=step; ta.placeholder='Describe this step…'; ta.style.cssText='background:var(--bg-2);border:none;color:var(--color-10);font-size:11px;font-weight:600;padding:10px 12px;outline:none;font-family:inherit;resize:none;line-height:1.6;min-height:72px;width:100%;box-sizing:border-box;';
      ta.oninput=()=>{ steps[idx]=ta.value; };
      wrap.append(topBar,ta); body.appendChild(wrap);
    });

    // Add Step card
    const addCard=document.createElement('div'); addCard.style.cssText='height:var(--drop-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff;flex-shrink:0;';
    const addLbl=document.createElement('div'); addLbl.style.cssText='font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#1d3318;'; addLbl.textContent='Add Step';
    addCard.appendChild(addLbl);
    addCard.onclick=()=>{ steps.push(''); renderSteps(); setTimeout(()=>{ const tas=body.querySelectorAll('textarea'); if(tas.length) tas[tas.length-1].focus(); },30); };
    body.appendChild(addCard);

    // Save Steps card
    const saveCard=document.createElement('div'); saveCard.style.cssText='height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:#1d3318;';
    const saveLbl=document.createElement('div'); saveLbl.style.cssText='font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#48a971;'; saveLbl.textContent='Save Steps';
    saveCard.appendChild(saveLbl);
    saveCard.onclick=()=>{
      r.steps=steps.map(s=>s.trim()).filter(s=>s);
      const recipes=rxGetRecipes(); const ri=recipes.findIndex(rx=>rx.id===r.id);
      if(ri>=0){ recipes[ri].steps=r.steps; rxSetRecipes(recipes); }
      ov.remove(); if(onSave) onSave();
    };
    body.appendChild(saveCard);
  }

  renderSteps();
  ov.append(hdr,body);
  document.getElementById('recipesWindow').appendChild(ov);
}

function openEditRecipeWindow(r, onSave){
  const ov=document.createElement('div'); ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg-3);z-index:350;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;';
  const hdr=document.createElement('div'); hdr.style.cssText='height:var(--card-height);display:flex;align-items:stretch;border-bottom:var(--border-width) solid var(--border-color);flex-shrink:0;background:var(--bg-1);';
  const htitle=document.createElement('div'); htitle.style.cssText='flex:1;display:flex;align-items:center;padding:0 14px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#fff;'; htitle.textContent='Edit Recipe';
  const hclose=document.createElement('button'); hclose.style.cssText='width:var(--card-height);min-width:var(--card-height);background:#502424;border:none;border-left:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;cursor:pointer;'; hclose.textContent='×'; hclose.onclick=()=>ov.remove();
  hdr.append(htitle,hclose);

  const body=document.createElement('div'); body.style.cssText='flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--margin);padding:var(--margin);';

  // Recipe name
  const nameWrap=document.createElement('div'); nameWrap.style.cssText='height:var(--card-height);border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;';
  const nameInp=document.createElement('input'); nameInp.type='text'; nameInp.value=r.name||''; nameInp.placeholder='Recipe name…'; nameInp.style.cssText='flex:1;background:#c8cdd4;border:none;color:#1a1a1a;font-size:13px;font-weight:700;padding:0 14px;outline:none;font-family:inherit;';
  nameWrap.appendChild(nameInp); body.appendChild(nameWrap);

  // Ingredients list — working copy
  let ings=r.ingredients.map(i=>({name:i.name,amt:i.needAmt.replace(/[a-zA-Z\s\/]+$/,'').trim(),unit:i.needAmt.replace(/^[\d.\s¼½¾⅓⅔⅛⅜⅝⅞⅕⅖]+/,'').trim()||'oz',converted:i.needConverted||'',ozPerUnit:i.ozPerUnit||null}));
  const ingList=document.createElement('div'); ingList.style.cssText='display:flex;flex-direction:column;gap:var(--margin);';
  const msItemNames=ls('ms_items',[]).map(i=>i.name);

  function renderIngsEdit(){
    ingList.innerHTML='';
    ings.forEach((ing,idx)=>{
      const row=document.createElement('div'); row.style.cssText='border:3px solid #000;border-radius:8px;overflow:hidden;';
      const top=document.createElement('div'); top.style.cssText='height:32px;display:flex;align-items:stretch;';
      const ai=document.createElement('input'); ai.type='number'; ai.placeholder='Amt'; ai.value=ing.amt||''; ai.style.cssText='width:52px;background:#c8cdd4;border:none;border-right:3px solid #000;color:#1a1a1a;font-size:11px;font-weight:700;padding:0 6px;outline:none;font-family:inherit;'; ai.oninput=e=>{ ings[idx].amt=e.target.value; const calc=rxCalcIngOz(parseFloat(e.target.value)||0,ings[idx].unit,ings[idx].ozPerUnit); if(calc!=null) ings[idx].converted=String(calc); };
      const us=document.createElement('select'); us.style.cssText='width:56px;background:var(--bg-2);border:none;border-right:3px solid #000;color:#fff;font-size:9px;font-weight:700;padding:0 2px;outline:none;font-family:inherit;cursor:pointer;appearance:none;text-align:center;'; RX_UNITS.forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; if(u===ing.unit) o.selected=true; us.appendChild(o); }); us.onchange=e=>{ ings[idx].unit=e.target.value; const calc=rxCalcIngOz(parseFloat(ings[idx].amt)||0,e.target.value,ings[idx].ozPerUnit); if(calc!=null) ings[idx].converted=String(calc); };
      const ni=document.createElement('input'); ni.type='text'; ni.placeholder='Ingredient name…'; ni.value=ing.name||''; ni.style.cssText='flex:1;background:var(--bg-3);border:none;color:#fff;font-size:10px;font-weight:600;padding:0 8px;outline:none;font-family:inherit;'; ni.oninput=e=>{ ings[idx].name=e.target.value; };
      const ci=document.createElement('input'); ci.type='text'; ci.step='0.01'; ci.placeholder='oz conversion'; ci.value=ing.converted||''; ci.style.cssText='flex:1;background:var(--bg-3);border:none;color:var(--muted);font-size:9px;font-weight:600;padding:0 8px;outline:none;font-family:inherit;'; ci.oninput=e=>ings[idx].converted=e.target.value;
      const dx=document.createElement('div'); dx.style.cssText='width:32px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;background:#502424;color:#fff;cursor:pointer;border-left:3px solid #000;'; dx.textContent='×'; dx.onclick=()=>{ ings.splice(idx,1); renderIngsEdit(); };
      const bot=document.createElement('div'); bot.style.cssText='height:28px;display:flex;align-items:stretch;border-top:2px solid #000;';
      const cl=document.createElement('div'); cl.style.cssText='padding:0 8px;display:flex;align-items:center;font-size:7px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;background:var(--bg-3);border-left:2px solid #000;white-space:nowrap;'; cl.textContent='oz conversion';
      bot.append(ci,cl); top.append(ai,us,ni,dx); row.append(top,bot); ingList.appendChild(row);
    });
    const addIngBtn=document.createElement('div'); addIngBtn.style.cssText='height:32px;border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:stretch;cursor:pointer;'; const ai2=document.createElement('div'); ai2.style.cssText='width:32px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;background:var(--bg-2);color:#48a971;border-right:3px solid #000;'; ai2.textContent='+'; const al=document.createElement('div'); al.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);'; al.textContent='Add Ingredient'; addIngBtn.append(ai2,al); addIngBtn.onclick=()=>{ ings.push({name:'',amt:'',unit:'oz',converted:''}); renderIngsEdit(); }; ingList.appendChild(addIngBtn);
  }
  renderIngsEdit();
  body.appendChild(ingList);

  const saveBtn=document.createElement('div'); saveBtn.style.cssText='height:var(--card-height);border:3px solid #000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;background:#1d3318;margin-top:4px;';
  const saveLbl=document.createElement('div'); saveLbl.style.cssText='font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#48a971;'; saveLbl.textContent='Save Recipe';
  saveBtn.appendChild(saveLbl);
  saveBtn.onclick=()=>{
    const name=nameInp.value.trim(); if(!name) return;
    const validIngs=ings.filter(i=>i.name.trim()).map(i=>{ const calc=rxCalcIngOz(parseFloat(i.amt)||0,i.unit,i.ozPerUnit); return { name:i.name.trim(), needAmt:i.amt+' '+i.unit, needConverted:calc!=null?String(calc):(i.converted||''), ozPerUnit:i.ozPerUnit||null, haveAmt:r.ingredients.find(ri=>ri.name===i.name)?.haveAmt||'—' }; });
    const recipes=rxGetRecipes(); const ri=recipes.findIndex(rx=>rx.id===r.id);
    if(ri>=0){ recipes[ri].name=name; recipes[ri].ingredients=validIngs; rxSetRecipes(recipes); }
    ov.remove(); if(onSave) onSave();
  };
  body.appendChild(saveBtn);
  ov.append(hdr,body); document.getElementById('recipesWindow').appendChild(ov);
}

function renderRecipesBody(){
  const container=document.getElementById('recipesBody'); container.innerHTML='';
  const sw=document.createElement('div'); sw.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;'; const si=document.createElement('input'); si.type='text'; si.placeholder='Search recipes…'; si.style.cssText='flex:1;background:#c8cdd4;border:none;color:#1a1a1a;font-size:13px;font-weight:600;padding:0 10px;outline:none;font-family:inherit;'; const sx=document.createElement('div'); sx.style.cssText='width:32px;background:#8896a8;border-left:var(--border-width) solid var(--border-color);color:#fff;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;'; sx.textContent='×'; sx.onclick=()=>{ si.value=''; renderRecipesBody(); }; sw.append(si,sx); container.appendChild(sw); si.oninput=()=>{ const q=si.value.trim().toLowerCase(); container.querySelectorAll('.rx-rc').forEach(c=>{ c.style.display=!q||c.dataset.name.toLowerCase().includes(q)?'':'none'; }); };
  const recipes=rxGetRecipes(); const addCard=document.createElement('div'); addCard.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;cursor:pointer;'; const ai=document.createElement('div'); ai.style.cssText='width:32px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;background:var(--bg-2);color:#48a971;border-right:var(--border-width) solid var(--border-color);'; ai.textContent='+'; const al=document.createElement('div'); al.style.cssText='flex:1;display:flex;align-items:center;padding:0 12px;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);'; al.textContent='New Recipe'; addCard.append(ai,al); addCard.onclick=rxOpenNewRecipeOverlay; container.appendChild(addCard);
  if(!recipes.length){ const e=document.createElement('div'); e.style.cssText='display:flex;align-items:center;justify-content:center;padding:40px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;text-align:center;'; e.textContent='No recipes yet. Tap + to add your first.'; container.appendChild(e); return; }
  container.appendChild(rxDiv('My Recipes','var(--muted)'));
  recipes.forEach(r=>{ const card=rxBuildCard(r); card.classList.add('rx-rc'); card.dataset.name=r.name; container.appendChild(card); });
}

let rxMealOpenId=null;
function rxBuildMealGroupCard(batches){
  const first=batches[0]; const wrap=document.createElement('div'); wrap.style.cssText='border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;';
  const avgRem=batches.reduce((s,b)=>s+b.remaining,0)/batches.length; const totalCost=batches.reduce((s,b)=>s+b.cost,0);
  const main=document.createElement('div'); main.style.cssText='height:32px;display:flex;align-items:stretch;position:relative;overflow:hidden;cursor:pointer;background:var(--bg-2);';
  const fill=document.createElement('div'); fill.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${avgRem*100}%;background:#48a971;opacity:0.4;transition:width 0.35s;pointer-events:none;z-index:0;`;
  const nm=document.createElement('div'); nm.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:2;gap:1px;'; const nt=document.createElement('div'); nt.style.cssText='font-size:10px;font-weight:700;color:#fff;'; nt.textContent=first.recipeName; const ns=document.createElement('div'); ns.style.cssText='font-size:8px;font-weight:600;color:rgba(255,255,255,0.55);'; ns.textContent=batches.length===1?`${Math.round(batches[0].remaining*100)}% left · ${batches[0].cookedDate}`:`${batches.length} batches`; nm.append(nt,ns);
  const ce=document.createElement('div'); ce.style.cssText='width:52px;min-width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:var(--border-width) solid var(--border-color);background:var(--bg-3);z-index:2;flex-shrink:0;gap:1px;'; const cvv=document.createElement('div'); cvv.style.cssText='font-size:9px;font-weight:800;color:#48a971;'; cvv.textContent=totalCost>0?'$'+totalCost.toFixed(2):'—'; const cll=document.createElement('div'); cll.style.cssText='font-size:6px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);'; cll.textContent=batches.length>1?'total':'batch'; ce.append(cvv,cll); main.append(fill,nm,ce);
  const expand=document.createElement('div'); expand.className='pt-expand-animated'; expand.style.cssText='background:var(--bg-2);overflow:hidden;max-height:0;';
  const activeBatchesInit=batches.filter(b=>!b.confirmFinished); const sel={id:activeBatchesInit.length===1?activeBatchesInit[0].id:null}; let fracPending={idx:null,timer:null};
  function re(){
    expand.innerHTML=''; const body=document.createElement('div'); body.style.cssText='display:flex;flex-direction:column;gap:4px;padding:4px;background:var(--bg-2);'; const selBatch=sel.id?batches.find(b=>b.id===sel.id):null;
    batches.filter(b=>b.confirmFinished).forEach(batch=>{
      const conf=document.createElement('div'); conf.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;'; const msg=document.createElement('div'); msg.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:#e08080;background:#2a1010;'; msg.textContent=batches.length>1?`"${batch.cookedDate}" all finished?`:'All finished?'; const yBtn=document.createElement('div'); yBtn.style.cssText='width:48px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#502424;color:#fff;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; yBtn.textContent='YES'; yBtn.onclick=e=>{ e.stopPropagation(); const days=Math.max(1,Math.round((Date.now()-batch.cookedTs)/86400000)); const hist=rxGetHistory(); hist.unshift({id:'h_'+Date.now(),recipeName:batch.recipeName,cookedDate:batch.cookedDate,finishedDate:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}),days,cost:batch.cost}); rxSetHistory(hist); rxSetMeals(rxGetMeals().filter(m=>m.id!==batch.id)); if(sel.id===batch.id) sel.id=null; renderMealsBody(); }; const nBtn=document.createElement('div'); nBtn.style.cssText='width:48px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;background:#1d442d;color:#fff;cursor:pointer;border-left:var(--border-width) solid var(--border-color);'; nBtn.textContent='NO'; nBtn.onclick=e=>{ e.stopPropagation(); batch.remaining=0.125; batch.confirmFinished=false; const meals=rxGetMeals(); const m=meals.find(m=>m.id===batch.id); if(m){ m.remaining=0.125; m.confirmFinished=false; rxSetMeals(meals); } re(); }; conf.append(msg,yBtn,nBtn); body.appendChild(conf);
    });
    const activeBatches=batches.filter(b=>!b.confirmFinished).sort((a,b)=>a.cookedTs!==b.cookedTs?a.cookedTs-b.cookedTs:a.remaining-b.remaining);
    if(activeBatches.length>1){
      // balanced grid: max 3 per row, same logic as container cards
      const perRow=activeBatches.length<=3?activeBatches.length:activeBatches.length<=4?2:3;
      const rows=[]; for(let i=0;i<activeBatches.length;i+=perRow) rows.push(activeBatches.slice(i,i+perRow));
      rows.forEach(rowBatches=>{
        const barRow=document.createElement('div'); barRow.style.cssText='display:flex;gap:4px;';
        rowBatches.forEach((batch,bIdx)=>{ const isSel=sel.id===batch.id; const batchNum=activeBatches.indexOf(batch)+1; const b=document.createElement('div'); b.style.cssText=`flex:1;height:var(--card-height);border:${isSel?'3px solid #fff':'var(--border-width) solid var(--border-color)'};border-radius:var(--radius);overflow:hidden;position:relative;display:flex;align-items:stretch;cursor:pointer;min-width:0;`; const bF=document.createElement('div'); bF.style.cssText=`position:absolute;left:0;top:0;bottom:0;width:${batch.remaining*100}%;background:#48a971;opacity:0.3;pointer-events:none;`; const bV=document.createElement('div'); bV.style.cssText='position:relative;z-index:2;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;'; const bN=document.createElement('div'); bN.style.cssText=`font-size:9px;font-weight:800;color:${isSel?'#fff':'rgba(255,255,255,0.85)'};`; bN.textContent='Batch '+batchNum; const bS=document.createElement('div'); bS.style.cssText='font-size:8px;font-weight:600;color:rgba(255,255,255,0.55);'; bS.textContent='(batch size: %'+(batch.batchSize||100)+')'; const bD=document.createElement('div'); bD.style.cssText='font-size:7px;font-weight:600;color:rgba(255,255,255,0.35);'; bD.textContent=batch.cookedDate; bV.append(bN,bS,bD); b.append(bF,bV); b.onclick=e=>{ e.stopPropagation(); sel.id=isSel?null:batch.id; re(); }; barRow.appendChild(b); });
        body.appendChild(barRow);
      });
    }
    const fCard=document.createElement('div'); fCard.style.cssText='height:45px;box-sizing:border-box;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;'; const fLbl=document.createElement('div'); fLbl.style.cssText='height:21px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-bottom:var(--border-width) solid var(--border-color);font-size:7px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);'; fLbl.textContent=selBatch?'This Much Remains':'← Select a Batch'; const fRow=document.createElement('div'); fRow.style.cssText='height:21px;display:flex;align-items:stretch;';
    const emptyBtn=document.createElement('div'); emptyBtn.style.cssText=`width:28px;min-width:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;background:${selBatch?'#502424':'var(--bg-4)'};cursor:${selBatch?'pointer':'default'};border-right:var(--border-width) solid var(--border-color);`; emptyBtn.textContent='×'; emptyBtn.onclick=e=>{ e.stopPropagation(); if(!selBatch) return; selBatch.remaining=0; selBatch.confirmFinished=true; sel.id=null; const meals=rxGetMeals(); const m=meals.find(m=>m.id===selBatch.id); if(m){ m.remaining=0; m.confirmFinished=true; rxSetMeals(meals); } fill.style.width='0%'; ns.textContent=batches.length===1?'0% left':'done'; re(); }; fRow.appendChild(emptyBtn);
    RX_FRACS.forEach(({n,d},i)=>{ const fc2=RX_FRAC_COLORS[d]||'var(--bg-2)'; const available=selBatch&&!selBatch.confirmFinished&&(n/d)<=selBatch.remaining; const isPending=fracPending.idx===i; const btn=document.createElement('div'); btn.style.cssText=`flex:1;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;color:${isPending?fc2:'#fff'};background:${available||isPending?fc2:'var(--bg-4)'};cursor:pointer;${i<RX_FRACS.length-1?'border-right:var(--border-width) solid var(--border-color);':''}`; btn.innerHTML=`<sup style="font-size:5px">${n}</sup><span style="font-size:7px">/</span><sub style="font-size:5px">${d}</sub>`; btn.onclick=e=>{ e.stopPropagation(); if(!selBatch||selBatch.confirmFinished) return; if(available){ selBatch.remaining=parseFloat((n/d).toFixed(4)); const meals=rxGetMeals(); const m=meals.find(m=>m.id===selBatch.id); if(m){ m.remaining=selBatch.remaining; rxSetMeals(meals); } if(selBatch.remaining<=0){ selBatch.remaining=0; selBatch.confirmFinished=true; if(m){ m.remaining=0; m.confirmFinished=true; rxSetMeals(meals); } sel.id=null; } const na=batches.reduce((s,b)=>s+b.remaining,0)/batches.length; fill.style.width=(na*100)+'%'; ns.textContent=batches.length===1?`${Math.round(batches[0].remaining*100)}% left · ${batches[0].cookedDate}`:`${batches.length} batches`; re(); } else { if(fracPending.idx===i){ clearTimeout(fracPending.timer); fracPending={idx:null,timer:null}; selBatch.remaining=parseFloat((n/d).toFixed(4)); selBatch.confirmFinished=false; const meals=rxGetMeals(); const m=meals.find(mm=>mm.id===selBatch.id); if(m){ m.remaining=selBatch.remaining; m.confirmFinished=false; rxSetMeals(meals); } const na=batches.reduce((s,b)=>s+b.remaining,0)/batches.length; fill.style.width=(na*100)+'%'; ns.textContent=batches.length===1?`${Math.round(batches[0].remaining*100)}% left · ${batches[0].cookedDate}`:`${batches.length} batches`; re(); } else { if(fracPending.timer) clearTimeout(fracPending.timer); fracPending.idx=i; fracPending.timer=setTimeout(()=>{ fracPending={idx:null,timer:null}; re(); },3000); re(); } } }; fRow.appendChild(btn); });
    fCard.append(fLbl,fRow); body.appendChild(fCard); expand.appendChild(body);
  }
  main.addEventListener('click',()=>{ if(rxMealOpenId===first.recipeId){ rxMealOpenId=null; expand.style.maxHeight='0'; expand.style.borderTop='none'; focusDimHide(); ptScrollBack(wrap._savedScrollY); wrap._savedScrollY=undefined; } else { document.querySelectorAll('.rx-meal-open').forEach(e=>{ e.style.maxHeight='0'; e.style.borderTop='none'; e.classList.remove('rx-meal-open'); }); rxMealOpenId=first.recipeId; wrap.classList.add('pt-card-wrap'); re(); expand.style.maxHeight='600px'; expand.style.borderTop='var(--border-width) solid var(--border-color)'; expand.classList.add('rx-meal-open'); wrap._savedScrollY=window.scrollY; focusDimShow(wrap); } });
  wrap.append(main,expand); return wrap;
}

function renderMealsBody(){
  const container=document.getElementById('mealsBody'); container.innerHTML=''; const meals=rxGetMeals(); const history=rxGetHistory();
  if(!meals.length&&!history.length){ const e=document.createElement('div'); e.style.cssText='display:flex;align-items:center;justify-content:center;padding:40px;font-size:10px;font-weight:600;color:var(--muted);font-style:italic;text-align:center;'; e.textContent='No meals yet. Cook a recipe to get started.'; container.appendChild(e); return; }
  if(meals.length){ container.appendChild(rxDiv('Active Meals','#48a971')); const groups={}; meals.forEach(m=>{ if(!groups[m.recipeId]) groups[m.recipeId]=[]; groups[m.recipeId].push(m); }); Object.values(groups).forEach(batches=>container.appendChild(rxBuildMealGroupCard(batches))); }
  if(history.length){ container.appendChild(rxDiv('History','var(--muted)')); history.forEach(h=>{ const row=document.createElement('div'); row.style.cssText='height:32px;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;display:flex;align-items:stretch;flex-shrink:0;'; const ne=document.createElement('div'); ne.style.cssText='flex:1;display:flex;align-items:center;padding:0 10px;font-size:9px;font-weight:700;color:#fff;background:var(--bg-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'; ne.textContent=h.recipeName; const de=document.createElement('div'); de.style.cssText='width:56px;min-width:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-2);border-left:var(--border-width) solid var(--border-color);gap:1px;'; const dv=document.createElement('div'); dv.style.cssText='font-size:11px;font-weight:800;color:#48a971;'; dv.textContent=h.days+'d'; const dl=document.createElement('div'); dl.style.cssText='font-size:6px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;'; dl.textContent='lasted'; de.append(dv,dl); const dte=document.createElement('div'); dte.style.cssText='width:88px;min-width:88px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-left:var(--border-width) solid var(--border-color);font-size:8px;font-weight:700;color:var(--muted);'; dte.textContent=h.cookedDate+'–'+h.finishedDate; row.append(ne,de,dte); container.appendChild(row); }); }
}


