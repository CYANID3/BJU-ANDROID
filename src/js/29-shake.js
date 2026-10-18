// «Движение телефоном»: одно действие на выбор (по умолчанию выключено), вызывается жестом «дважды наклонить»:
// наклонить телефон в любую сторону и вернуть, как держали, — два раза подряд. Считается по силе тяжести (самое надёжное, что умеют датчики).
// Датчик слушается, только когда действие выбрано (или открыта «Проверка»). Пока открыт лист или диалог — не срабатывает;
// на карточке дня работает только «Карточка дня». Паузы после срабатывания почти нет: карточку дня можно сразу закрыть тем же жестом.
const SKL=[["off","Выключено","close","Движение телефоном не используется"],["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],
 ["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],
 ["wt","Вес","scale","Записать вес за сегодня"],["rep","Карточка дня","layout","Открыть сводку дня; ещё раз — закрыть"]];
// сила: [угол наклона °, подпись]. «Обычное» — минимальный уровень
const SSV={norm:[40,"Обычное"],strong:[52,"Сильное"],max:[64,"Резкое"]};
const ssv=()=>{const v=S.set&&S.set.ss;return SSV[v]?v:"norm"};
function setSs(v){S.set=Object.assign({},S.set,{ss:v});saveq();drawSet();hap(8)}
function skAct(){const v=S.set&&S.set.sk;return!SKL.some(x=>x[0]===v)||v==="wt"&&!wton()?"off":v}
function setSk(v){S.set=Object.assign({},S.set,{sk:v});saveq();drawSet();skBind();hap(6)}

// ===== распознавание =====
// Наклон — угол между силой тяжести сейчас и «как телефон держат обычно» (K.gb: медленно подстраивается, пока телефон спокоен).
// Один наклон: дальше порога силы и обратно ближе 15° не дольше 1,5 с. Два наклона, второй закончился не позже 3 с от начала первого, — срабатывание.
// Оставили наклонённым дольше 2,5 с (положили, повернулись) — это новое «как держат»
const SK={back:15,start:18,one:1500,two:3000,stay:2500,gap:300};
let skOn=0,skLast=0,skTest=0,K={};
function skReset(){K={t:0,g:null,gb:null,tl:null,n:[],ang:0,live:{r:0,ang:0},act:null}}skReset();
function skAng(u,b){return Math.acos(Math.max(-1,Math.min(1,u[0]*b[0]+u[1]*b[1]+u[2]*b[2])))*180/Math.PI}
function skMotion(e){const t=e.timeStamp||performance.now();K.t=t;
 const I=e.accelerationIncludingGravity,L=e.acceleration,R=e.rotationRate||{},ok=v=>v&&v.x!=null;
 // сила тяжести: «с гравитацией» минус линейное; если линейного нет — сглаживанием
 if(ok(I)&&ok(L))K.g=[I.x-L.x,I.y-L.y,I.z-L.z];
 else if(ok(I)){const v=[I.x,I.y,I.z];K.g=K.g?K.g.map((g,i)=>g*.8+v[i]*.2):v}
 if(!K.g)return;
 const n=Math.hypot(...K.g)||1,u=K.g.map(x=>x/n),rm=Math.max(Math.abs(R.alpha||0),Math.abs(R.beta||0),Math.abs(R.gamma||0));
 if(!K.gb)K.gb=u;
 const ang=K.ang=skAng(u,K.gb);
 if(skTest)dgSample(t,ang,rm);
 if(t-skLast<SK.gap)return;
 if(!K.tl){if(ang>SK.start){K.tl={s:t,out:0};return}
  if(rm<40){const b=K.gb.map((x,i)=>x*.97+u[i]*.03),m=Math.hypot(...b);K.gb=b.map(x=>x/m)}return}
 if(ang>SSV[ssv()][0])K.tl.out=1;
 if(ang<SK.back){const s=K.tl.s,ok=K.tl.out&&t-s<=SK.one;K.tl=null;
  if(!ok){K.n=[];return}
  K.n=K.n.filter(x=>t-x<=SK.two);K.n.push(s);if(skTest)dgStep(K.n.length);
  if(K.n.length>=2){K.n=[];skLast=t;skDo()}return}
 if(t-K.tl.s>SK.stay){K.tl=null;K.n=[];K.gb=u}}
function skBind(){const on=skAct()!=="off"||!!skTest;if(on===!!skOn)return;skOn=on;skReset();if(on)addEventListener("devicemotion",skMotion);else removeEventListener("devicemotion",skMotion)}
function skDo(){if(skTest)return dgHit();const a=skAct();if(a==="off"||isOpen||$("dg").classList.contains("on")||REP&&a!=="rep")return;hap(12);a==="rep"?togRep(!REP):actRun(a)}

// ===== «Проверка движения»: попробовать жест, увидеть, засчитан ли, и записать показания датчиков =====
let dgN=0,dgLog=[],dgInfo=null,dgRaf=0;
function dgOpen(){skTest=1;dgN=0;dgLog=[];dgInfo={n:0,t0:0,rot:0,inc:0,acc:0};skReset();skBind();$("dgn2").textContent="0";dgStep(0);
 dgMsg("Дважды наклоните телефон");$("dgbm").style.left=SSV[ssv()][0]/90*100+"%";sv(13,"Проверка движения");dgTick()}
function dgClose(){skTest=0;cancelAnimationFrame(dgRaf);skBind()}
function dgMsg(t,on){const s=$("dgs2");s.textContent=t;s.className="dgs"+(on?" ok":"")}
// точки «первый наклон / второй наклон»
function dgStep(n){$("dgp").querySelectorAll("i").forEach((d,j)=>d.classList.toggle("on",j<n));if(n===1)dgMsg("Ещё раз");
 clearTimeout(dgStep._t);if(n===1)dgStep._t=setTimeout(()=>{if(skTest&&K.n.length<2){dgStep(0);dgMsg("Дважды наклоните телефон")}},SK.two)}
function dgHit(){dgN++;hap(12);$("dgn2").textContent=dgN;dgMsg("Засчитано!",1);dgStep(2);mo($("dgs2"),[{transform:"scale(1.12)"},{transform:"none"}],MO.t2);
 {const c=K.act||dgLog[dgLog.length-1];if(c)c.hit=1}clearTimeout(dgHit._t);dgHit._t=setTimeout(()=>{dgStep(0);dgMsg("Дважды наклоните телефон")},1400)}
// живые полоски: наклон (с отметкой порога) и скорость поворота; по строке на каждую попытку — для подстройки порогов
function dgSample(t,ang,rm){const I=dgInfo,L=K.live;if(!I.t0)I.t0=t;I.n++;L.ang=ang;L.r=Math.max(rm,L.r*.9);if(rm)I.rot=1;
 const busy=ang>SK.start||rm>60;let c=K.act;
 if(busy){if(!c)c=K.act={t,end:t,max:0,r:0,tilts:0,out:0};c.end=t;c.r=Math.max(c.r,rm);c.max=Math.max(c.max,ang);
  if(ang>SSV[ssv()][0]&&!c.out){c.out=1;c.tilts++}if(ang<SK.back)c.out=0}
 if(c&&!busy&&t-c.end>500){dgLog.push(c);K.act=null;if(dgLog.length>40)dgLog.shift()}}
function dgTick(){const L=K.live,bar=(id,v,max)=>{$(id).style.width=Math.min(100,Math.max(0,v/max*100))+"%"};
 bar("dgbz",L.ang,90);bar("dgbr",L.r,600);
 const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0;
 $("dgi").textContent=I.n?`Датчики: ${hz} раз/с · вращение ${I.rot?"есть":"нет"}`:"Ждём данные датчиков…";
 dgRaf=requestAnimationFrame(dgTick)}
// запись для разработчика: устройство, частота, сила; по строке на попытку — длительность, наибольший наклон, скорость поворота, сколько наклонов, засчитано ли
function dgText(){const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0,f=x=>Math.round(x);
 return [`БЖУ · проверка «дважды наклонить» · сила ${ssv()} (${SSV[ssv()][0]}°) · засчитано ${dgN}`,navigator.userAgent,`частота ${hz}/с · вращение ${I.rot}`,
  "мс | наклон до, ° | поворот до, °/с | наклонов | засчитано",...dgLog.map(c=>`${f(c.end-c.t)} | ${f(c.max)} | ${f(c.r)} | ${c.tilts} | ${c.hit?"да":"нет"}`)].join("\n")}
async function dgCopy(){const t=dgText();try{await navigator.clipboard.writeText(t);toast("Запись скопирована — вставьте её в сообщение")}catch(e){say(t)}}
