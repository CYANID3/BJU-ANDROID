// Настройки: жесты, длина свайпа, вибрация, оформление
// жест «потянуть вверх»: приём пищи по времени / новый продукт / статистика / вес (если вес включён) / выкл.
function swAct(){const v=(S.set&&S.set.sw)||"off";return v==="wt"&&!wton()?"off":v}
function swipeAct(){const a=swAct();if(a==="prod"){mode="mng";drawMc();nw();show()}else if(a==="stat")stats();else if(a==="wt"){if(cur>today){cur=today;head();render()}wtOpen()}else op(autoMeal())}

// Длина свайпа: множитель расстояния для жестов в стороны (дни, календарь, месяцы статистики, смахивание листа) + порог рывка.
// Сильнее всего уровни отличаются для жестов «потянуть вверх/вниз» — у них свои значения PLV (21-pull.js)
// [расстояние, скорость рывка px/мс, доля пути для рывка, старт распознавания px, строгость направления]
const SLV={short:[.5,.25,.3,9,1.25,"Короткий","Хватает лёгкого движения: дни листаются коротким взмахом, жесты вверх и вниз срабатывают от лёгкого движения."],
 mid:[1,.45,.45,14,1.5,"Средний","Баланс скорости и защиты от случайных срабатываний."],
 long:[1.8,1.1,.7,22,2,"Длинный","Нужно провести дальше и строго по направлению, а вверх и вниз — потянуть примерно на треть экрана. Случайные касания не срабатывают."]};
const slv=()=>{const v=S.set&&S.set.sl;return SLV[v]?v:"mid"},GF=()=>SLV[slv()][0],SL=i=>SLV[slv()][i];
// «Длина свайпа» — ползунок на три положения: дорожка с точками, бегунок плавно переезжает (касанием подписи или перетаскиванием)
function sldDraw(){const el=$("slm"),K=Object.keys(SLV),l=slv(),i=K.indexOf(l);
 if(!el.querySelector(".sldt")){el.innerHTML=`<div class="sldt" role="slider" aria-label="Длина свайпа" aria-valuemin="0" aria-valuemax="2" tabindex="0"><i class="sldf"></i>${K.map((v,j)=>`<span class="sldd" style="left:${j*50}%"></span>`).join("")}<b class="sldk"></b></div><div class="sldl">${K.map(v=>`<button onclick="setSl('${v}')">${SLV[v][5]}</button>`).join("")}</div>`;sldBind(el)}
 el.style.setProperty("--v",i/2);el.querySelectorAll(".sldl button").forEach((b,j)=>b.classList.toggle("on",j===i));el.querySelectorAll(".sldd").forEach((d,j)=>d.classList.toggle("in",j<=i));
 const t=el.querySelector(".sldt");t.setAttribute("aria-valuenow",i);t.setAttribute("aria-valuetext",SLV[l][5])}
function sldBind(el){const t=el.querySelector(".sldt"),K=Object.keys(SLV);let on=0,last=-1;
 const at=e=>{const r=t.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))};
 t.addEventListener("pointerdown",e=>{on=1;last=K.indexOf(slv());el.classList.add("drag");try{t.setPointerCapture(e.pointerId)}catch(_){}mv(e)});
 const mv=e=>{if(!on)return;const f=at(e),n=Math.round(f*2);el.style.setProperty("--v",f);el.querySelectorAll(".sldd").forEach((d,j)=>d.classList.toggle("in",j/2<=f+.001));if(n!==last){last=n;hap(4)}};
 t.addEventListener("pointermove",mv);
 const up=e=>{if(!on)return;on=0;el.classList.remove("drag");const v=K[Math.round(at(e)*2)];if(v!==slv())setSl(v);else sldDraw()};
 t.addEventListener("pointerup",up);t.addEventListener("pointercancel",()=>{on=0;el.classList.remove("drag");sldDraw()});
 t.addEventListener("keydown",e=>{const i=K.indexOf(slv()),n=e.key==="ArrowRight"?i+1:e.key==="ArrowLeft"?i-1:i;if(n!==i&&K[n]){e.preventDefault();setSl(K[n])}})}
function setSl(v){S.set=Object.assign({},S.set,{sl:v});saveq();drawSet();hap(8)}
const PRE=["","#22a06b","#14b8a6","#6366f1","#8b5cf6","#e5589a","#e5484d","#f08a24","#f5c518","#64748b"],SWL=[["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],["wt","Вес","scale","Записать вес за день"],["off","Выключено","close","Жест не используется"]],
 DWL=[["cal","Календарь","cal","Выбрать день в календаре"],["today","К сегодня","today","Вернуться к сегодняшнему дню"],["off","Выключено","close","Жест не используется"]];
// список вариантов (жесты): свёрнут до выбранной строки со стрелкой; касание — раскрыть, выбор — свернуть
const olOpen=new Set();
function optList(id,L,cur,fn){const open=olOpen.has(id),el=$(id);el.classList.toggle("cl",!open);
 el.innerHTML=L.map(([v,t,i,d])=>`<button class="${cur===v?"on":""}" onclick="olTap('${id}','${fn}','${v}')" role="radio" aria-checked="${cur===v}"${cur===v?` aria-expanded="${open}"`:""}><span class="oi">${ic(i)}</span><span class="ot"><b>${t}</b><small>${d}</small></span><span class="oc">${ic("check")}</span><span class="od">${ic("chevR")}</span></button>`).join("")}
function olTap(id,fn,v){const el=$(id);if(el.classList.contains("cl")){olOpen.add(id);drawSet();hap(4);if(!RM())el.querySelectorAll("button:not(.on)").forEach((b,k)=>{try{b.animate([{opacity:0,transform:"translateY(-6px)"},{opacity:1,transform:"none"}],{duration:MO.t2,delay:k*25,easing:MO.E,fill:"backwards"})}catch(e){}});return}
 olOpen.delete(id);window[fn](v)}
function sets(){olOpen.clear();drawSet();sv(7,"Настройки");show()}
function drawSet(k){optList("dwm",DWL,dwAct(),"setDw");$("hpm").innerHTML=[["on","Вкл."],["nodays","Кроме дней"],["off","Выкл."]].map(([v,t])=>`<button class="${hpv()===v?"on":""}" onclick="setHp('${v}')">${t}</button>`).join("");const a=swAct(),c=(S.set&&S.set.ac)||"",th=(S.set&&S.set.th)||"auto";$("thm").innerHTML=[["auto","Авто"],["light","Светлая"],["dark","Тёмная"]].map(([v,t])=>`<button class="${th===v?"on":""}" onclick="setTh('${v}')">${t}</button>`).join("");
 {sldDraw();$("sver").textContent="Версия "+BUILD}
 {const t=tnv();$("tnm").innerHTML=[["off","Выкл."],["soft","Лёгкий"],["strong","Заметный"]].map(([v,n])=>`<button class="${t===v?"on":""}" onclick="setTn('${v}')">${n}</button>`).join("")}
 // переключатели «да / нет»
 [["wtm",wton()],["bbm",bbv()==="fix"],["nbm",nbv()==="top"]].forEach(([id,on])=>{const b=$(id);b.classList.toggle("on",on);b.setAttribute("aria-checked",on)});
 $("snm").innerHTML=[["row","Строкой"],["tap","Двойным касанием"]].map(([v,t])=>`<button class="${snv()===v?"on":""}" onclick="setSn('${v}')">${t}</button>`).join("");$("snd").textContent=snv()==="tap"?"Два касания по названию приёма — показать или скрыть его перекус.":"";$("snd").hidden=snv()!=="tap";
 optList("sgm",SWL.filter(([v])=>v!=="wt"||wton()),a,"setSw");
 $("swc").innerHTML=PRE.map(h=>`<button class="${c===h?"on":""}" style="background:${h||"#3b82f6"}" onclick="setAc('${h}')" aria-label="${h?"Цвет "+h:"Стандартный цвет"}">${ic("check")}</button>`).join("");
 if(!k)$("cp").value=c||"#3b82f6"}
function setHp(v){S.set=Object.assign({},S.set,{hp:v});saveq();drawSet();hap(10)}
function setSw(v){S.set=Object.assign({},S.set,{sw:v});saveq();drawSet();render();hap(6)}
function setAc(h,k){S.set=Object.assign({},S.set,{ac:h});saveq();applyAc();drawSet(k)}
