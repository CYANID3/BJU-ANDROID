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
function setSl(v){S.set=Object.assign({},S.set,{sl:v});saveq();drawSet();hap(8)}
const PRE=["","#22a06b","#14b8a6","#6366f1","#8b5cf6","#e5589a","#e5484d","#f08a24","#f5c518","#64748b"],SWL=[["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],["wt","Вес","scale","Записать вес за день"],["off","Выключено","close","Жест не используется"]],
 DWL=[["cal","Календарь","cal","Выбрать день в календаре"],["today","К сегодня","today","Вернуться к сегодняшнему дню"],["off","Выключено","close","Жест не используется"]];
// список вариантов (жесты): свёрнут до выбранной строки со стрелкой; касание — раскрыть, выбор — свернуть
const olOpen=new Set();
function optList(id,L,cur,fn){const open=olOpen.has(id),el=$(id);el.classList.toggle("cl",!open);
 el.innerHTML=L.map(([v,t,i,d])=>`<button class="${cur===v?"on":""}" onclick="olTap('${id}','${fn}','${v}')" role="radio" aria-checked="${cur===v}"${cur===v?` aria-expanded="${open}"`:""}><span class="oi">${ic(i)}</span><span class="ot"><b>${t}</b><small>${d}</small></span><span class="oc">${ic("check")}</span><span class="od">${ic("chevR")}</span></button>`).join("")}
function olTap(id,fn,v){const el=$(id);if(el.classList.contains("cl")){olOpen.add(id);drawSet();hap(4);if(!RM())el.querySelectorAll("button:not(.on)").forEach((b,k)=>{try{b.animate([{opacity:0,transform:"translateY(-6px)"},{opacity:1,transform:"none"}],{duration:200,delay:k*25,easing:"cubic-bezier(.22,1,.36,1)",fill:"backwards"})}catch(e){}});return}
 olOpen.delete(id);window[fn](v)}
function sets(){olOpen.clear();drawSet();sv(7,"Настройки");show()}
function drawSet(k){optList("dwm",DWL,dwAct(),"setDw");$("hpm").innerHTML=[["on","Вкл."],["nodays","Кроме дней"],["off","Выкл."]].map(([v,t])=>`<button class="${hpv()===v?"on":""}" onclick="setHp('${v}')">${t}</button>`).join("");const a=swAct(),c=(S.set&&S.set.ac)||"",th=(S.set&&S.set.th)||"auto";$("thm").innerHTML=[["auto","Авто"],["light","Светлая"],["dark","Тёмная"]].map(([v,t])=>`<button class="${th===v?"on":""}" onclick="setTh('${v}')">${t}</button>`).join("");
 {const l=slv();$("slm").innerHTML=Object.keys(SLV).map(v=>`<button class="${l===v?"on":""}" onclick="setSl('${v}')">${SLV[v][5]}</button>`).join("");$("sli").style.width=Math.round(PLV[l][0]/3.4*100)+"%";$("sld").textContent=SLV[l][6];$("sver").textContent="Версия "+BUILD}
 {const t=tnv();$("tnm").innerHTML=[["off","Выкл."],["soft","Лёгкий"],["strong","Заметный"]].map(([v,n])=>`<button class="${t===v?"on":""}" onclick="setTn('${v}')">${n}</button>`).join("")}
 $("wtd").textContent={on:"Плитка «Вес» под итогом дня (касание — записать или изменить), вес на карточке дня и график в статистике.",off:"Строки, графика и веса на карточке нет. Уже сделанные записи не удаляются."}[wtm()];$("wtm").innerHTML=[["on","Вкл."],["off","Выкл."]].map(([v,t])=>`<button class="${wtm()===v?"on":""}" onclick="setWt('${v}')">${t}</button>`).join("");
 $("uim").innerHTML=[["comfy","Удобный"],["compact","Компактный"]].map(([v,t])=>`<button class="${uiv()===v?"on":""}" onclick="setUi('${v}')">${t}</button>`).join("");$("uid").textContent=uiv()==="compact"?"Элементы чуть меньше и плотнее — на экран помещается больше.":"Крупные элементы и просторные отступы — удобно попадать пальцем.";
 $("snm").innerHTML=[["row","Тонкой строкой"],["tap","По двойному касанию"]].map(([v,t])=>`<button class="${snv()===v?"on":""}" onclick="setSn('${v}')">${t}</button>`).join("");$("snd").textContent=snv()==="tap"?"Пустых перекусов не видно. Два касания по названию приёма (например, «Обед») — под ним появится «+ Перекус», ещё два — уберут. С записями перекус виден всегда.":"Пустой перекус — тонкая строка «+ Перекус N» между приёмами пищи.";
 $("bbm").innerHTML=[["page","В конце дня"],["fix","Всегда видна"]].map(([v,t])=>`<button class="${bbv()===v?"on":""}" onclick="setBb('${v}')">${t}</button>`).join("");$("bbd").textContent=bbv()==="fix"?"Всегда у нижнего края экрана, страница прокручивается под ней.":"После приёмов пищи — видна, когда долистаете до конца дня.";
 $("nbm").innerHTML=[["bottom","Под списком"],["top","Под поиском"]].map(([v,t])=>`<button class="${nbv()===v?"on":""}" onclick="setNb('${v}')">${t}</button>`).join("");
 optList("sgm",SWL.filter(([v])=>v!=="wt"||wton()),a,"setSw");
 $("swc").innerHTML=PRE.map(h=>`<button class="${c===h?"on":""}" style="background:${h||"#3b82f6"}" onclick="setAc('${h}')" aria-label="${h?"Цвет "+h:"Стандартный цвет"}">${ic("check")}</button>`).join("");
 if(!k)$("cp").value=c||"#3b82f6"}
function setHp(v){S.set=Object.assign({},S.set,{hp:v});saveq();drawSet();hap(10)}
function setSw(v){S.set=Object.assign({},S.set,{sw:v});saveq();drawSet();render();hap(6)}
function setAc(h,k){S.set=Object.assign({},S.set,{ac:h});saveq();applyAc();drawSet(k)}
