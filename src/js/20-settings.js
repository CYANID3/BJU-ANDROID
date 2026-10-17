// Настройки: жесты, длина свайпа, вибрация, оформление
// жест «потянуть вверх»: приём пищи по времени / новый продукт / статистика / вес (если вес включён) / выкл.
function swAct(){const v=(S.set&&S.set.sw)||"off";return v==="wt"&&!wton()?"off":v}
function swipeAct(){const a=swAct();if(a==="prod"){mode="mng";drawMc();nw();show()}else if(a==="stat")stats();else if(a==="wt"){if(cur>today){cur=today;head();render()}wtOpen()}else op(autoMeal())}
const SWD={meal:"Открывает добавление в приём пищи по времени суток.",prod:"Открывает создание нового продукта.",stat:"Открывает статистику за месяц.",wt:"Открывает запись веса за этот день. Кнопка «+ вес» в итоге дня тогда не нужна и скрыта — остаётся только записанный вес.",off:"Жест отключён."};
// Длина свайпа: множитель расстояния для жестов в стороны (дни, календарь, месяцы статистики, смахивание листа) + порог рывка.
// Сильнее всего уровни отличаются для жестов «потянуть вверх/вниз» — у них свои значения PLV (21-pull.js)
// [расстояние, скорость рывка px/мс, доля пути для рывка, старт распознавания px, строгость направления]
const SLV={short:[.5,.25,.3,9,1.25,"Короткий","Хватает лёгкого движения: дни листаются коротким взмахом, жесты вверх и вниз срабатывают от лёгкого движения."],
 mid:[1,.45,.45,14,1.5,"Средний","Баланс скорости и защиты от случайных срабатываний."],
 long:[1.8,1.1,.7,22,2,"Длинный","Нужно провести дальше и строго по направлению, а вверх и вниз — потянуть примерно на треть экрана. Случайные касания не срабатывают."]};
const slv=()=>{const v=S.set&&S.set.sl;return SLV[v]?v:"mid"},GF=()=>SLV[slv()][0],SL=i=>SLV[slv()][i];
function setSl(v){S.set=Object.assign({},S.set,{sl:v});saveq();drawSet();hap(8)}
const PRE=["","#22a06b","#14b8a6","#6366f1","#8b5cf6","#e5589a","#e5484d","#f08a24","#f5c518","#64748b"],SWL=[["meal","Приём пищи"],["prod","Новый продукт"],["stat","Статистика"],["wt","Вес"],["off","Выкл."]];
function sets(){drawSet();sv(7,"Настройки");show()}
function drawSet(k){$("dwd").textContent={cal:"Всегда открывает календарь.",today:"Возвращает к сегодняшнему дню. На сегодняшнем дне ничего не делает.",off:"Жест отключён."}[dwAct()];$("dwm").innerHTML=[["cal","Календарь"],["today","К сегодня"],["off","Выкл."]].map(([v,t])=>`<button class="${dwAct()===v?"on":""}" onclick="setDw('${v}')">${t}</button>`).join("");$("hpm").innerHTML=[["on","Вкл."],["nodays","Кроме дней"],["off","Выкл."]].map(([v,t])=>`<button class="${hpv()===v?"on":""}" onclick="setHp('${v}')">${t}</button>`).join("");const a=swAct(),c=(S.set&&S.set.ac)||"",th=(S.set&&S.set.th)||"auto";$("thm").innerHTML=[["auto","Авто"],["light","Светлая"],["dark","Тёмная"]].map(([v,t])=>`<button class="${th===v?"on":""}" onclick="setTh('${v}')">${t}</button>`).join("");
 {const l=slv();$("slm").innerHTML=Object.keys(SLV).map(v=>`<button class="${l===v?"on":""}" onclick="setSl('${v}')">${SLV[v][5]}</button>`).join("");$("sli").style.width=Math.round(PLV[l][0]/3.4*100)+"%";$("sld").textContent=SLV[l][6];$("sver").textContent="Версия "+BUILD}
 {const t=tnv();$("tnm").innerHTML=[["off","Выкл."],["soft","Лёгкий"],["strong","Заметный"]].map(([v,n])=>`<button class="${t===v?"on":""}" onclick="setTn('${v}')">${n}</button>`).join("")}
 $("wtd").textContent={on:"Плашка веса в итоге дня (касание — записать или изменить), вес на карточке дня и график в статистике.",off:"Строки, графика и веса на карточке нет. Уже сделанные записи не удаляются."}[wtm()];$("wtm").innerHTML=[["on","Вкл."],["off","Выкл."]].map(([v,t])=>`<button class="${wtm()===v?"on":""}" onclick="setWt('${v}')">${t}</button>`).join("");
 $("bbm").innerHTML=[["float","Плавающая"],["fix","Всегда видна"],["page","В конце дня"]].map(([v,t])=>`<button class="${bbv()===v?"on":""}" onclick="setBb('${v}')">${t}</button>`).join("");$("bbd").textContent={float:"У нижнего края экрана: прячется, когда листаете вниз, и появляется, как только листнёте вверх или дойдёте до конца дня.",fix:"Всегда у нижнего края экрана, страница прокручивается под ней.",page:"После приёмов пищи — видна, когда долистаете до конца дня."}[bbv()];
 $("nbm").innerHTML=[["bottom","Под списком"],["top","Под поиском"]].map(([v,t])=>`<button class="${nbv()===v?"on":""}" onclick="setNb('${v}')">${t}</button>`).join("");
 {const L=SWL.filter(([v])=>v!=="wt"||wton());$("sgm").classList.toggle("g3",L.length>4);$("sgm").classList.toggle("g2",L.length===4);$("sgm").innerHTML=L.map(([v,t])=>`<button class="${a===v?"on":""}" onclick="setSw('${v}')">${t}</button>`).join("");$("sgd").textContent=SWD[a]||""}
 $("swc").innerHTML=PRE.map(h=>`<button class="${c===h?"on":""}" style="background:${h||"#3b82f6"}" onclick="setAc('${h}')" aria-label="${h?"Цвет "+h:"Стандартный цвет"}">${ic("check")}</button>`).join("");
 if(!k)$("cp").value=c||"#3b82f6"}
function setHp(v){S.set=Object.assign({},S.set,{hp:v});saveq();drawSet();hap(10)}
function setSw(v){S.set=Object.assign({},S.set,{sw:v});saveq();drawSet();render();hap(6)}
function setAc(h,k){S.set=Object.assign({},S.set,{ac:h});saveq();applyAc();drawSet(k)}
