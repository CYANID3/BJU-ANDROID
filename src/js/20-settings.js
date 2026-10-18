// Настройки: жесты, длина свайпа, вибрация, оформление
// жест «потянуть вверх»: приём пищи по времени / новый продукт / статистика / вес (если вес включён) / выкл.
function swAct(){const v=(S.set&&S.set.sw)||"off";return v==="wt"&&!wton()?"off":v}
// действие жеста «потянуть вверх»: новый продукт / статистика / вес (будущий день — на сегодня) / приём пищи по времени
function swipeAct(){const a=swAct();if(a==="prod"){mode="mng";drawMc();nw();show()}else if(a==="stat")stats();else if(a==="wt"){if(cur>today){cur=today;head();render()}wtOpen()}else op(autoMeal())}

// Длина свайпа: множитель расстояния для жестов в стороны (дни, календарь, месяцы статистики, смахивание листа) + порог рывка.
// Сильнее всего уровни отличаются для жестов «потянуть вверх/вниз» — у них свои значения PLV (21-pull.js)
// [расстояние, скорость рывка px/мс, доля пути для рывка, старт распознавания px, строгость направления]
const SLV={short:[.5,.25,.3,9,1.25,"Короткий","Хватает лёгкого движения: дни листаются коротким взмахом, жесты вверх и вниз срабатывают от лёгкого движения."],
 mid:[1,.45,.45,14,1.5,"Средний","Баланс скорости и защиты от случайных срабатываний."],
 long:[1.8,1.1,.7,22,2,"Длинный","Нужно провести дальше и строго по направлению, а вверх и вниз — потянуть примерно на треть экрана. Случайные касания не срабатывают."]};
const slv=()=>{const v=S.set&&S.set.sl;return SLV[v]?v:"mid"},GF=()=>SLV[slv()][0],SL=i=>SLV[slv()][i];
// ползунок на три положения (длина свайпа): дорожка с точками над тремя подписями, бегунок плавно переезжает —
// касанием подписи, перетаскиванием или стрелками. o: {keys, labels, get(), set(v), aria}
function sldDraw(id,o){const el=$(id),K=o.keys,i=Math.max(0,K.indexOf(o.get()));el._o=o;
 if(!el.querySelector(".sldt")){el.innerHTML=`<div class="sldt" role="slider" aria-label="${o.aria}" aria-valuemin="0" aria-valuemax="${K.length-1}" tabindex="0"><i class="sldf"></i>${K.map((v,j)=>`<span class="sldd" style="left:${j*100/(K.length-1)}%"></span>`).join("")}<b class="sldk"></b></div><div class="sldl">${K.map((v,j)=>`<button>${o.labels[j]}</button>`).join("")}</div>`;sldBind(el)}
 const f=i/(K.length-1);el.style.setProperty("--slv",f);el.querySelectorAll(".sldl button").forEach((b,j)=>b.classList.toggle("on",j===i));el.querySelectorAll(".sldd").forEach((d,j)=>d.classList.toggle("in",j<=i));
 const t=el.querySelector(".sldt");t.setAttribute("aria-valuenow",i);t.setAttribute("aria-valuetext",o.labels[i])}
function sldBind(el){const t=el.querySelector(".sldt"),O=()=>el._o,n=()=>O().keys.length-1;let on=0,last=-1;
 const at=e=>{const r=t.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))},put=v=>{if(v!==O().get())O().set(v);else sldDraw(el.id,O())};
 el.querySelectorAll(".sldl button").forEach((b,j)=>b.onclick=()=>put(O().keys[j]));
 t.addEventListener("pointerdown",e=>{on=1;last=O().keys.indexOf(O().get());el.classList.add("drag");try{t.setPointerCapture(e.pointerId)}catch(_){}mv(e)});
 const mv=e=>{if(!on)return;const f=at(e),k=Math.round(f*n());el.style.setProperty("--slv",f);el.querySelectorAll(".sldd").forEach((d,j)=>d.classList.toggle("in",j/n()<=f+.001));if(k!==last){last=k;hap(4)}};
 t.addEventListener("pointermove",mv);
 t.addEventListener("pointerup",e=>{if(!on)return;on=0;el.classList.remove("drag");put(O().keys[Math.round(at(e)*n())])});
 t.addEventListener("pointercancel",()=>{on=0;el.classList.remove("drag");sldDraw(el.id,O())});
 t.addEventListener("keydown",e=>{const K=O().keys,i=K.indexOf(O().get()),k=e.key==="ArrowRight"?i+1:e.key==="ArrowLeft"?i-1:i;if(k!==i&&K[k]){e.preventDefault();put(K[k])}})}
function setSl(v){S.set=Object.assign({},S.set,{sl:v});saveq();drawSet();hap(8)}
const PRE=["","#22a06b","#14b8a6","#6366f1","#8b5cf6","#e5589a","#e5484d","#f08a24","#f5c518","#64748b"],SWL=[["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],["wt","Вес","scale","Записать вес за день"],["off","Выключено","close","Жест не используется"]],
 DWL=[["cal","Календарь","cal","Выбрать день в календаре"],["today","К сегодня","today","Вернуться к сегодняшнему дню"],["off","Выключено","close","Жест не используется"]];
// список вариантов (жесты): свёрнут до выбранной строки со стрелкой; касание — раскрыть, выбор — свернуть
const olOpen=new Set();
function optList(id,L,cur,fn){const open=olOpen.has(id),el=$(id);el.classList.toggle("cl",!open);
 el.innerHTML=L.map(([v,t,i,d])=>`<button class="${cur===v?"on":""}" onclick="olTap('${id}','${fn}','${v}')" role="radio" aria-checked="${cur===v}"${cur===v?` aria-expanded="${open}"`:""}><span class="oi">${ic(i)}</span><span class="ot"><b>${t}</b><small>${d}</small></span><span class="oc">${ic("check")}</span><span class="od">${ic("chevR")}</span></button>`).join("")}
function olTap(id,fn,v){const el=$(id);if(el.classList.contains("cl")){olOpen.add(id);drawSet();hap(4);el.querySelectorAll("button:not(.on)").forEach((b,k)=>mo(b,[{opacity:0,transform:"translateY(-6px)"},{opacity:1,transform:"none"}],{delay:k*25,fill:"backwards"}));return}
 olOpen.delete(id);window[fn](v)}
// Настройки — четыре вкладки; открываются на той, где были в прошлый раз (за этот запуск)
const STABS=["Вид","Экран","Жесты","Прочее"];let stTab=0;
function sets(){olOpen.clear();drawSet();stShow(stTab);sv(7,"Настройки");show()}
function stShow(i){stTab=i;$("stb").innerHTML=STABS.map((t,j)=>`<button class="${j===i?"on":""}" role="tab" aria-selected="${j===i}" onclick="stGo(${j})">${t}</button>`).join("");
 STABS.forEach((t,j)=>$("sp"+j).hidden=j!==i)}
// смена вкладки: новая проявляется на месте, лист плавно меняет высоту, прокрутка — с начала
function stGo(i){if(i===stTab||i<0||i>=STABS.length)return;const sh=document.querySelector("#ov .sh"),h0=sh.offsetHeight;stShow(i);sh.scrollTop=0;hap(4);
 if(RM()||!sh.animate)return;const h1=svTargetH(sh,0);
 try{$("sp"+i).animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E});if(Math.abs(h1-h0)>4)sh.animate([{height:h0+"px"},{height:h1+"px"}],{duration:MO.t2,easing:MO.E})}catch(e){}}
// вкладки листаются и пальцем вбок (кроме ползунков)
(()=>{const v=$("v7");let x0=null,y0=0;v.addEventListener("touchstart",e=>{x0=e.touches.length===1&&!e.target.closest(".sld,.nodrag")?e.touches[0].clientX:null;y0=e.touches[0].clientY},{passive:true});
 v.addEventListener("touchend",e=>{if(x0===null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;if(Math.abs(dx)>64*GF()&&Math.abs(dx)>Math.abs(dy)*1.6)stGo(stTab+(dx<0?1:-1))},{passive:true})})();
function drawSet(k){optList("dwm",DWL,dwAct(),"setDw");$("hpm").innerHTML=[["on","Вкл."],["nodays","Кроме дней"],["off","Выкл."]].map(([v,t])=>`<button class="${hpv()===v?"on":""}" onclick="setHp('${v}')">${t}</button>`).join("");const a=swAct(),c=(S.set&&S.set.ac)||"",th=(S.set&&S.set.th)||"auto";$("thm").innerHTML=[["auto","Авто"],["light","Светлая"],["dark","Тёмная"]].map(([v,t])=>`<button class="${th===v?"on":""}" onclick="setTh('${v}')">${t}</button>`).join("");
 sldDraw("slm",{keys:Object.keys(SLV),labels:Object.values(SLV).map(x=>x[5]),get:slv,set:setSl,aria:"Длина свайпа"});

 $("sver").textContent="Версия "+BUILD
 {const t=tnv();$("tnm").innerHTML=[["off","Выкл."],["soft","Лёгкий"],["strong","Заметный"]].map(([v,n])=>`<button class="${t===v?"on":""}" onclick="setTn('${v}')">${n}</button>`).join("")}
 // переключатели «да / нет»
 [["wtm",wton()],["mgm",mgOn()],["ghm",ghOn()]].forEach(([id,on])=>{const b=$(id);b.classList.toggle("on",on);b.setAttribute("aria-checked",on)});
 $("snm").innerHTML=[["row","Строкой"],["tap","Двойным касанием"]].map(([v,t])=>`<button class="${snv()===v?"on":""}" onclick="setSn('${v}')">${t}</button>`).join("");$("snd").textContent=snv()==="tap"?"Два касания по названию приёма — показать или скрыть его перекус.":"";$("snd").hidden=snv()!=="tap";
 optList("sgm",SWL.filter(([v])=>v!=="wt"||wton()),a,"setSw");
 // «Экран»: нижняя панель и кнопки создания — выбором с понятными подписями
 {const b=bbv();$("bbm").innerHTML=[["page","В конце дня"],["fix","Всегда видна"]].map(([v,t])=>`<button class="${b===v?"on":""}" onclick="setBb('${v}')">${t}</button>`).join("");
  $("bbd").textContent=b==="fix"?"Панель всегда внизу экрана, поверх списка":"Панель — после приёмов пищи, в конце дня";
  const n=nbv();$("nbm").innerHTML=[["bottom","Под списком"],["top","Под поиском"]].map(([v,t])=>`<button class="${n===v?"on":""}" onclick="setNb('${v}')">${t}</button>`).join("")}
 // откуда тянуть вверх и подсказка под выбранный вариант
 {const fx=bbv()==="fix",e=sfv()==="edge";$("sfr").hidden=a==="off";
  $("sfm").innerHTML=[["edge",fx?"От панели":"От низа экрана"],["end","В конце списка"]].map(([v,t])=>`<button class="${sfv()===v?"on":""}" onclick="setSf('${v}')">${t}</button>`).join("");
  const h=$("sgh");h.classList.toggle("edge",e);h.classList.toggle("fx",fx);
  h.querySelector(".smt").innerHTML=e?(fx?"Потяните вверх <b>от нижней панели</b> — где угодно в списке":"Потяните вверх <b>от низа экрана</b>, чуть выше края, — где угодно в списке"):"Долистайте до конца дня и <b>потяните вверх</b>"}ghSync();
 $("swc").innerHTML=PRE.map(h=>`<button class="${c===h?"on":""}" style="background:${h||"#3b82f6"}" onclick="setAc('${h}')" aria-label="${h?"Цвет "+h:"Стандартный цвет"}">${ic("check")}</button>`).join("");
 $("cpd").style.background=c||"var(--ac)";$("cpn").textContent=c&&!PRE.includes(c)?c.toUpperCase():""}
// подсказки к жестам («Показывать подсказки» во вкладке «Жесты»): мини-телефон с анимацией под каждым включённым жестом
const ghOn=()=>S.set&&S.set.gh==="on",GHS=[["dwh",()=>dwAct()!=="off"],["sgh",()=>swAct()!=="off"]];
function ghSync(anim){const on=ghOn(),b=$("ghm");b.classList.toggle("on",on);b.setAttribute("aria-checked",on);
 GHS.forEach(([id,f])=>{const el=$(id),show=on&&f();if(el._gh===show&&show===!el.hidden)return;el._gh=show;
  // быстрое двойное касание: прошлую анимацию — прочь, итог решает последнее состояние
  el.getAnimations().forEach(x=>x.cancel());if(!anim){el.hidden=!show;return}
  if(show){el.hidden=false;moH(el,1)}else moH(el,0,()=>{if(el._gh)return;el.hidden=true;el.getAnimations().forEach(x=>x.cancel())})})}
function togGh(){S.set=Object.assign({},S.set,{gh:ghOn()?"off":"on"});saveq();ghSync(1);hap(6)}
function setHp(v){S.set=Object.assign({},S.set,{hp:v});saveq();drawSet();hap(10)}
function setSw(v){S.set=Object.assign({},S.set,{sw:v});saveq();drawSet();render();hap(6)}
function setAc(h,k){S.set=Object.assign({},S.set,{ac:h});saveq();applyAc();drawSet(k)}

// «Свой цвет»: свой экран в листе — квадрат насыщенности и яркости, полоса оттенка, поле для кода; «Готово» применяет цвет
let cpH=210,cpS=.7,cpV=.9;
const hsv2hex=(h,s,v)=>{const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return"#"+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("")};
function hex2hsv(x){const n=parseInt(x.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;
 let h=0;if(d){h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,M?d/M:0,M]}
const CPS=["#e11d48","#f97316","#eab308","#16a34a","#0d9488","#0891b2","#2563eb","#7c3aed","#c026d3","#57534e"];
function cpOpen(){const c=(S.set&&/^#[0-9a-f]{6}$/i.test(S.set.ac||"")&&S.set.ac)||getComputedStyle(document.documentElement).getPropertyValue("--ac").trim()||"#2f7de1";
 [cpH,cpS,cpV]=hex2hsv(c);$("cps").innerHTML=CPS.map(h=>`<button style="background:${h}" onclick="cpSet('${h}')" aria-label="Цвет ${h}"></button>`).join("");cpDraw(1);sv(11,"Свой цвет")}
function cpSet(h){[cpH,cpS,cpV]=hex2hsv(h);cpDraw(1);hap(4)}
function cpDraw(hx){const c=hsv2hex(cpH,cpS,cpV),a=$("cpa");a.style.setProperty("--cph",cpH);a.style.setProperty("--cpx",cpS);a.style.setProperty("--cpy",1-cpV);$("cph").style.setProperty("--cpx",cpH/360);
 $("cpak").style.background=c;$("cphk").style.background=`hsl(${cpH} 100% 50%)`;$("cpv").style.background=c;if(hx)$("cpx").value=c.toUpperCase();
 const ok=$("cpok");ok.style.background=c;ok.style.color=crt("#ffffff",c)>=3.1?"#fff":"#141922";
 $("cps").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.getAttribute("onclick").includes(c)))}
function cpHex(v){v=v.trim();if(v&&v[0]!=="#")v="#"+v;if(/^#[0-9a-f]{6}$/i.test(v)){[cpH,cpS,cpV]=hex2hsv(v.toLowerCase());cpDraw(0)}}
function cpOk(){setAc(hsv2hex(cpH,cpS,cpV));hap(8);drawSet();sv(7,"Настройки")}
(()=>{const drag=(el,fn)=>{let on=0;const at=e=>{const r=el.getBoundingClientRect();fn(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)));cpDraw(1)};
  el.addEventListener("pointerdown",e=>{on=1;el.classList.add("drag");try{el.setPointerCapture(e.pointerId)}catch(_){}at(e)});
  el.addEventListener("pointermove",e=>{if(on)at(e)});const up=()=>{on=0;el.classList.remove("drag")};el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)};
 drag($("cpa"),(x,y)=>{cpS=x;cpV=1-y});drag($("cph"),x=>{cpH=Math.min(359.9,x*360)})})();
