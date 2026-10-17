// Формат файла данных v3: toFile / fromFile
// ===== Формат файла данных (версия 3): понятные имена, удобно править вручную =====
// {
//   "format": "bju-diary", "version": 3, "savedAt": "2026-10-16T11:00:00.000Z",
//   "goals":    { "protein": 120, "fat": 70, "carbs": 250 },            — норма на день, г
//   "products": [ { "name": "Творог 5%", "per100g": { "protein": 17, "fat": 5, "carbs": 1.8 },
//                   "favorite": true,                                    — в избранном, необязательно
//                   "units": [ { "name": "пачка", "grams": 200 } ],      — необязательно
//                   "dish": { "cookedWeight": 350, "ingredients": [ …как записи дневника… ] } } ],  — только у блюд
//   "diary":    { "2026-10-16": { "breakfast": [ { "name": "Яблоко", "grams": 55, "protein": 0.2, "fat": 0.2, "carbs": 5.4,
//                                                  "unit": { "name": "шт", "count": 1 } } ],
//                                 "snack1": [], "lunch": [], "snack2": [], "dinner": [], "snack3": [] } },
//   "settings": { "theme": "auto|light|dark", "accentColor": "#22a06b", "pullUpAction": "meal|product|stats|weight|off",
//                 "pullDownAction": "calendar|today|off", "vibration": "on|exceptDays|off", "swipeLength": "short|medium|long",
//                 "backgroundTint": "off|soft|strong", "weightTracking": "on|off",
//                 "bottomBar": "page|fixed", "newButtons": "bottom|top" },
//   "weight":   { "2026-10-16": 72.4 },                                    — вес по дням, кг
//   "stats":    { "useCount": { "Яблоко": 12 }, "lastGrams": { "Яблоко": 55 }, "recent": [ "Яблоко" ] }   — для сортировки и подсказок
// }
// В products числа на 100 г можно не указывать (будет 0). Старые файлы (без "format") тоже открываются.
const MK=["breakfast","snack1","lunch","snack2","dinner","snack3"];
const STM={th:["theme",{}],tn:["backgroundTint",{}],ac:["accentColor",{}],sw:["pullUpAction",{prod:"product",stat:"stats",wt:"weight"}],dw:["pullDownAction",{cal:"calendar"}],hp:["vibration",{nodays:"exceptDays"}],sl:["swipeLength",{mid:"medium"}],wt:["weightTracking",{}],bb:["bottomBar",{fix:"fixed"}],nb:["newButtons",{}],sn:["snacks",{row:"row",tap:"doubleTap"}]};
const r3=x=>Math.round(x*1000)/1000,fnum=(x,d)=>x==null||x===""?d:typeof x==="number"?x:parseFloat(String(x).replace(",","."));
const entOut=e=>{const o={name:e.n,grams:r3(e.g),protein:r3(e.p),fat:r3(e.f),carbs:r3(e.c)};if(e.ul)o.unit={name:e.ul,count:e.q};return o};
const entIn=(o,w)=>{if(!o||typeof o!=="object")throw Error(w+": запись должна быть объектом");if(!o.name)throw Error(w+": нет названия (name)");
 const e={n:String(o.name),g:fnum(o.grams,NaN),p:fnum(o.protein,0),f:fnum(o.fat,0),c:fnum(o.carbs,0)};if(!(e.g>=0))throw Error(w+", «"+e.n+"»: нет массы (grams)");
 if(o.unit&&o.unit.name){e.ul=String(o.unit.name);e.q=fnum(o.unit.count,1)}return e};
function toFile(D){
 const diary={};for(const k of Object.keys(D.d).sort()){const E=D.d[k];if(!E.length)continue;const day={};E.forEach(e=>(day[MK[e.m]]=day[MK[e.m]]||[]).push(entOut(e)));const o={};MK.forEach(m=>{if(day[m])o[m]=day[m]});diary[k]=o}
 const settings={};for(const k in D.set||{}){const t=STM[k];if(t&&D.set[k]!=null)settings[t[0]]=t[1][D.set[k]]||D.set[k]}
 return{format:"bju-diary",version:3,savedAt:D.saved?new Date(D.saved).toISOString():null,
  goals:{protein:D.g.p,fat:D.g.f,carbs:D.g.c},
  products:D.db.map(p=>{const o={name:p[0],per100g:{protein:p[1],fat:p[2],carbs:p[3]}};if(D.fav&&D.fav[p[0]])o.favorite=true;if(p[4]&&p[4].length&&!p[5])o.units=p[4].map(u=>({name:u[0],grams:u[1]}));if(p[5])o.dish={cookedWeight:p[5].w,ingredients:p[5].i.map(entOut)};return o}),
  diary,weight:Object.fromEntries(Object.keys(D.wt||{}).sort().map(k=>[k,D.wt[k]])),settings,stats:{useCount:D.uc||{},lastGrams:D.lg||{},recent:D.rc||[]}}}
function fromFile(o){if(!o||typeof o!=="object"||o.format!=="bju-diary")return o;
 if(o.version>3)throw Error("файл создан в более новой версии приложения");
 const g=o.goals||{},D={v:VER,g:{p:fnum(g.protein,0),f:fnum(g.fat,0),c:fnum(g.carbs,0)},db:[],d:{},saved:Date.parse(o.savedAt)||0,set:{},uc:(o.stats&&o.stats.useCount)||{},lg:(o.stats&&o.stats.lastGrams)||{},fav:{},wt:{}};if(o.stats&&Array.isArray(o.stats.recent))D.rc=o.stats.recent.map(String).slice(0,10);
 if(!Array.isArray(o.products||[]))throw Error("«products» должен быть списком");
 (o.products||[]).forEach((p,i)=>{const w="продукт №"+(i+1);if(!p||!p.name)throw Error(w+": нет названия (name)");const h=p.per100g||{};
  const a=[String(p.name),fnum(h.protein,0),fnum(h.fat,0),fnum(h.carbs,0)];if(p.favorite)D.fav[a[0]]=1;
  if(Array.isArray(p.units)&&p.units.length)a[4]=p.units.map((u,j)=>{if(!u||!u.name||!(fnum(u.grams,0)>0))throw Error(w+", единица №"+(j+1)+": нужны name и grams > 0");return[String(u.name),fnum(u.grams,0)]});
  if(p.dish){const cw=fnum(p.dish.cookedWeight,0);a[4]=[["порция",cw]];a[5]={w:cw,i:(p.dish.ingredients||[]).map((x,j)=>entIn(x,w+", ингредиент №"+(j+1)))}}
  D.db.push(a)});
 for(const k in o.diary||{}){const day=o.diary[k]||{},bad=Object.keys(day).find(x=>!MK.includes(x));if(bad)throw Error("день "+k+": неизвестный приём пищи «"+bad+"» (можно: "+MK.join(", ")+")");
  const E=[];MK.forEach((m,mi)=>(day[m]||[]).forEach((x,j)=>{const e=entIn(x,k+", "+m+" №"+(j+1));e.m=mi;E.push(e)}));D.d[k]=E}
 if(o.weight!=null&&typeof o.weight!=="object")throw Error("«weight» должен быть объектом { \"ГГГГ-ММ-ДД\": кг }");
 for(const k in o.weight||{}){const v=fnum(o.weight[k],NaN);if(!/^\d{4}-\d{2}-\d{2}$/.test(k))throw Error("вес: неверная дата «"+k+"»");if(!(v>0&&v<1000))throw Error("вес за "+k+": нужно число в кг");D.wt[k]=v}
 const st=o.settings||{};for(const k in STM){const[nm,map]=STM[k];if(nm in st){const v=st[nm];D.set[k]=Object.keys(map).find(x=>map[x]===v)||v}}
 return D}
const ser=()=>JSON.stringify(toFile(S),null,2),parseData=t=>chk(fromFile(JSON.parse(t)));
