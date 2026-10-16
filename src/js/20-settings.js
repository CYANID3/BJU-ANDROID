// Настройки: жесты, длина свайпа, вибрация, оформление
function swAct(){return(S.set&&S.set.sw)||"off"}
function swipeAct(){if(swAct()==="prod"){mode="mng";drawMc();nw();show()}else op(autoMeal())}
// Длина свайпа: множитель расстояния для всех жестов + порог скорости для резкого рывка
// [расстояние, скорость рывка px/мс, доля пути для рывка, старт распознавания px, строгость направления]
const SLV={short:[.5,.25,.3,9,1.25,"Короткий","Хватает лёгкого движения: дни листаются коротким взмахом, жесты вверх и вниз срабатывают почти сразу."],
 mid:[1,.45,.45,14,1.5,"Средний","Баланс скорости и защиты от случайных срабатываний."],
 long:[1.8,1.1,.7,22,2,"Длинный","Нужно провести дальше и строго по направлению, а вверх и вниз — потянуть почти на четверть экрана. Случайные касания не срабатывают."]};
const slv=()=>{const v=S.set&&S.set.sl;return SLV[v]?v:"mid"},GF=()=>SLV[slv()][0],SL=i=>SLV[slv()][i];
function setSl(v){S.set=Object.assign({},S.set,{sl:v});saveq();drawSet();hap(8)}
const PRE=["","#22a06b","#14b8a6","#6366f1","#8b5cf6","#e5589a","#e5484d","#f08a24","#f5c518","#64748b"],SWL=[["meal","Приём пищи"],["prod","Новый продукт"],["off","Выкл."]];
function sets(){drawSet();sv(7,"Настройки");show()}
function drawSet(k){$("dwd").textContent={cal:"Всегда открывает календарь.",today:"Возвращает к сегодняшнему дню. На сегодняшнем дне ничего не делает.",off:"Жест отключён."}[dwAct()];$("dwm").innerHTML=[["cal","Календарь"],["today","К сегодня"],["off","Выкл."]].map(([v,t])=>`<button class="${dwAct()===v?"on":""}" onclick="setDw('${v}')">${t}</button>`).join("");$("hpm").innerHTML=[["on","Вкл."],["nodays","Кроме дней"],["off","Выкл."]].map(([v,t])=>`<button class="${hpv()===v?"on":""}" onclick="setHp('${v}')">${t}</button>`).join("");const a=swAct(),c=(S.set&&S.set.ac)||"",th=(S.set&&S.set.th)||"auto";$("thm").innerHTML=[["auto","Авто"],["light","Светлая"],["dark","Тёмная"]].map(([v,t])=>`<button class="${th===v?"on":""}" onclick="setTh('${v}')">${t}</button>`).join("");
 {const l=slv();$("slm").innerHTML=Object.keys(SLV).map(v=>`<button class="${l===v?"on":""}" onclick="setSl('${v}')">${SLV[v][5]}</button>`).join("");$("sli").style.width=Math.round(SLV[l][0]/1.8*100)+"%";$("sld").textContent=SLV[l][6];$("sver").textContent="Версия "+BUILD}
 {const t=tnv();$("tnm").innerHTML=[["off","Выкл."],["soft","Лёгкий"],["strong","Заметный"]].map(([v,n])=>`<button class="${t===v?"on":""}" onclick="setTn('${v}')">${n}</button>`).join("")}
 $("wtd").textContent={on:"Строка «Вес» внизу каждого дня, вес на карточке дня и график в статистике.",dyn:"Сама цифра нигде не показывается — только изменение: «−0,6 кг за неделю». Для тех, кого расстраивает или отвлекает цифра на весах.",off:"Строки, графика и веса на карточке нет. Уже сделанные записи не удаляются."}[wtm()];$("wtm").innerHTML=[["on","Вкл."],["dyn","Динамика"],["off","Выкл."]].map(([v,t])=>`<button class="${wtm()===v?"on":""}" onclick="setWt('${v}')">${t}</button>`).join("");
 $("sgm").innerHTML=SWL.map(([v,t])=>`<button class="${a===v?"on":""}" onclick="setSw('${v}')">${t}</button>`).join("");
 $("swc").innerHTML=PRE.map(h=>`<button class="${c===h?"on":""}" style="background:${h||"#3b82f6"}" onclick="setAc('${h}')" aria-label="${h?"Цвет "+h:"Стандартный цвет"}">${ic("check")}</button>`).join("");
 if(!k)$("cp").value=c||"#3b82f6"}
function setHp(v){S.set=Object.assign({},S.set,{hp:v});saveq();drawSet();hap(10)}
function setSw(v){S.set=Object.assign({},S.set,{sw:v});saveq();drawSet()}
function setAc(h,k){S.set=Object.assign({},S.set,{ac:h});saveq();applyAc();drawSet(k)}
