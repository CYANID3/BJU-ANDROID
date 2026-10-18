// «Движение телефоном»: одно действие на выбор (по умолчанию выключено) и одно движение, которое его вызывает.
// Датчик слушается, только когда действие выбрано (или открыта «Проверка»). Остальные движения игнорируются.
// Движения (оси телефона: x — вправо, y — вдоль длинной стороны вверх, z — из экрана):
//  - «Дважды крутнуть» — кистью туда-обратно, как отвёрткой (как переключение камер на Pixel): вращение вокруг длинной оси (y);
//  - «Дважды рубануть» — два коротких резких движения, как топориком: два сильных толчка подряд, перед ними спокойно, после — тишина;
//  - «Перевернуть» — экраном вниз и обратно за пару секунд: по силе тяжести (самое надёжное, что умеют датчики).
// После срабатывания — пауза 1,5 с. Пока открыт лист или диалог — не срабатывает; на карточке дня работает только «Карточка дня».
const SKL=[["off","Выключено","close","Движение телефоном не используется"],["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],
 ["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],
 ["wt","Вес","scale","Записать вес за сегодня"],["rep","Карточка дня","layout","Открыть сводку дня; ещё раз — закрыть"]];
const SML=[["tw","Дважды крутнуть","mtw","Кистью туда-обратно два раза, как отвёрткой"],["ch","Дважды рубануть","mch","Два коротких резких взмаха, как топориком"],
 ["fl","Перевернуть","mfl","Экраном вниз и сразу обратно"]];
// сила: [множитель порогов, подпись]. «Обычное» — минимальный уровень
const SSV={norm:[1,"Обычное"],strong:[1.3,"Сильное"],max:[1.6,"Резкое"]};
const ssv=()=>{const v=S.set&&S.set.ss;return SSV[v]?v:"norm"},smv=()=>{const v=S.set&&S.set.sm;return SML.some(x=>x[0]===v)?v:"tw"};
function setSs(v){S.set=Object.assign({},S.set,{ss:v});saveq();drawSet();hap(8)}
function setSm(v){S.set=Object.assign({},S.set,{sm:v});saveq();skReset();drawSet();hap(6)}
function skAct(){const v=S.set&&S.set.sk;return!SKL.some(x=>x[0]===v)||v==="wt"&&!wton()?"off":v}
function setSk(v){S.set=Object.assign({},S.set,{sk:v});saveq();drawSet();skBind();hap(6)}

// ===== распознавание =====
// пороги при «Обычном»: крутнуть — скорость вращения °/с и угол каждого полуоборота °; рубануть — толчок м/с²; перевернуть — наклон (g по z)
const SKB={twRate:140,twAng:22,chop:14,flip:6};
let skOn=0,skLast=0,skTest=0,K={};
function skReset(){K={t:0,g:null,bs:0,ang:0,peak:0,dom:0,bursts:[],ch:null,chs:[],calm:0,pend:null,quiet:0,fl:null,up:0,act:null,live:{a:0,r:0,z:0}}}skReset();
function skFire(t){K.pend=null;K.bursts=[];K.chs=[];K.fl=null;skLast=t;skDo()}
function skMotion(e){const t=e.timeStamp||performance.now(),dt=K.t?Math.min(.06,Math.max(0,(t-K.t)/1000)):0;K.t=t;
 const I=e.accelerationIncludingGravity,L=e.acceleration,R=e.rotationRate||{},ok=v=>v&&v.x!=null;
 // сила тяжести: «с гравитацией» минус линейное; если линейного нет — сглаживанием; линейное — разница
 let a=null;if(ok(I)&&ok(L)){K.g=[I.x-L.x,I.y-L.y,I.z-L.z];a=[L.x,L.y,L.z]}
 else if(ok(I)){const v=[I.x,I.y,I.z];K.g=K.g?K.g.map((g,i)=>g*.8+v[i]*.2):v;a=v.map((x,i)=>x-K.g[i])}
 else if(ok(L))a=[L.x,L.y,L.z];
 const rot=[R.beta||0,R.gamma||0,R.alpha||0],am=a?Math.hypot(...a):0,gz=K.g?K.g[2]/(Math.hypot(...K.g)||1)*9.81:0;
 if(skTest)dgSample(t,a,rot,am,gz,e);
 if(K.pend&&t>=K.pend.at){K.pend=null;if(t-skLast>=1500)return skFire(t)}
 if(t-skLast<1500)return;
 const k=SSV[ssv()][0],m=smv();
 if(m==="tw")skTw(t,dt,rot,k);else if(m==="ch"&&a)skCh(t,am,k);else if(m==="fl"&&K.g)skFl(t,gz,k)}
// дважды крутнуть: отрезки вращения одного направления вокруг длинной оси; нужно 3 чередующихся (туда-обратно-туда) за 1,2 с
function skTw(t,dt,r,k){const y=r[1],o=Math.max(Math.abs(r[0]),Math.abs(r[2])),s=Math.abs(y)>50?Math.sign(y):0;
 if(s&&s===K.bs){K.ang+=Math.abs(y)*dt;K.peak=Math.max(K.peak,Math.abs(y));K.dom+=Math.abs(y)>=o*.8?1:-1;return}
 if(K.bs){const b={t,s:K.bs,ang:K.ang,peak:K.peak,dom:K.dom>=0};K.bs=0;
  if(b.dom&&b.ang>=SKB.twAng*k&&b.peak>=SKB.twRate*k){const last=K.bursts[K.bursts.length-1];if(last&&last.s===b.s)K.bursts=[];
   K.bursts=K.bursts.filter(x=>t-x.t<1200);K.bursts.push(b);if(K.bursts.length>=3)return skFire(t)}}
 if(s){K.bs=s;K.ang=Math.abs(y)*dt;K.peak=Math.abs(y);K.dom=Math.abs(y)>=o*.8?1:-1}}
// дважды рубануть: два сильных толчка через 0,15–0,8 с; перед первым — 0,3 с спокойно; третий толчок следом — это тряска, отмена
function skCh(t,m,k){const th=SKB.chop*k;
 if(t<K.quiet){if(m>th*.5)K.quiet=t+500;return}
 if(K.ch){if(m>K.ch.v)K.ch.v=m;if(m<th*.45){K.chs.push(K.ch.t);K.ch=null;K.calm=t;
   K.chs=K.chs.filter(x=>t-x<1200);if(K.chs.length===2){const gap=K.chs[1]-K.chs[0];if(gap>=150&&gap<=800)K.pend={at:t+300};else K.chs=[K.chs[1]]}
   else if(K.chs.length>2){K.pend=null;K.chs=[];K.quiet=t+700}}return}
 // начало толчка; первый — только после 0,3 с без толчков (K.calm — конец предыдущего)
 if(m>th){if(!K.chs.length&&K.calm&&t-K.calm<300){K.calm=t;return}K.ch={t,v:m};if(K.pend){K.pend=null;K.chs=[];K.quiet=t+700}}}
// перевернуть: экран к себе (как обычно держат) → экраном вниз → снова к себе, не дольше 3 с от последнего «к себе»
function skFl(t,gz,k){const lo=-Math.min(8.8,SKB.flip*k);
 if(gz>4){if(K.fl&&K.fl.down&&t-K.fl.t<=3000)return skFire(t);K.fl={t,down:0};return}
 if(gz<lo&&K.fl)K.fl.down=1;
 if(K.fl&&t-K.fl.t>3000)K.fl=null}
function skBind(){const on=skAct()!=="off"||!!skTest;if(on===!!skOn)return;skOn=on;skReset();if(on)addEventListener("devicemotion",skMotion);else removeEventListener("devicemotion",skMotion)}
function skDo(){if(skTest)return dgHit();const a=skAct();if(a==="off"||isOpen||$("dg").classList.contains("on")||REP&&a!=="rep")return;hap(12);a==="rep"?togRep(!REP):actRun(a)}

// ===== «Проверка движения»: попробовать выбранное движение, увидеть, засчитано ли, и записать показания датчиков =====
let dgN=0,dgLog=[],dgInfo=null,dgRaf=0;
function dgOpen(){skTest=1;dgN=0;dgLog=[];dgInfo={n:0,t0:0,acc:0,rot:0,inc:0};skReset();skBind();$("dgn2").textContent="0";
 $("dgs2").textContent="Сделайте движение";$("dgs2").className="dgs";sv(13,"Проверка: "+SML.find(x=>x[0]===smv())[1]);dgTick()}
function dgClose(){skTest=0;cancelAnimationFrame(dgRaf);skBind()}
function dgHit(){dgN++;hap(12);$("dgn2").textContent=dgN;const s=$("dgs2");s.textContent="Засчитано!";s.className="dgs ok";mo(s,[{transform:"scale(1.12)"},{transform:"none"}],MO.t2);
 if(dgLog.length)dgLog[dgLog.length-1].hit=1;clearTimeout(s._t);s._t=setTimeout(()=>{s.textContent="Сделайте движение";s.className="dgs"},1400)}
// живые полоски: толчок, вращение, наклон; и сводка по каждому движению (пики по осям) — для подстройки порогов
function dgSample(t,a,r,am,gz,e){const I=dgInfo;if(!I.t0)I.t0=t;I.n++;if(e.acceleration&&e.acceleration.x!=null)I.acc=1;if(e.rotationRate&&e.rotationRate.alpha!=null)I.rot=1;if(e.accelerationIncludingGravity&&e.accelerationIncludingGravity.x!=null)I.inc=1;
 const rm=Math.max(...r.map(Math.abs)),L=K.live;L.a=Math.max(am,L.a*.9);L.r=Math.max(rm,L.r*.9);L.z=gz;
 const busy=am>4||rm>60;let c=K.act;
 if(busy){if(!c)c=K.act={t,end:t,a:[0,0,0],r:[0,0,0],z0:gz,z1:gz};c.end=t;(a||[0,0,0]).forEach((v,i)=>c.a[i]=Math.max(c.a[i],Math.abs(v)));r.forEach((v,i)=>c.r[i]=Math.max(c.r[i],Math.abs(v)))}
 if(c){c.z0=Math.min(c.z0,gz);c.z1=Math.max(c.z1,gz);if(!busy&&t-c.end>400){dgLog.push(c);K.act=null;if(dgLog.length>40)dgLog.shift()}}}
function dgTick(){const L=K.live,bar=(id,v,max)=>{$(id).style.width=Math.min(100,Math.max(0,v/max*100))+"%"};
 bar("dgba",L.a,30);bar("dgbr",L.r,600);bar("dgbz",(9.81-L.z)/19.62*30,30);
 const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0;
 $("dgi").textContent=I.n?`Датчики: ${hz} раз/с · ускорение ${I.acc?"есть":"считается"} · вращение ${I.rot?"есть":"нет"}`:"Ждём данные датчиков…";
 dgRaf=requestAnimationFrame(dgTick)}
// запись для разработчика: устройство, частота, по строке на каждое движение — пики ускорения и вращения по осям, наклон, засчитано ли
function dgText(){const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0,f=x=>Math.round(x);
 return [`БЖУ · проверка движения «${smv()}» · сила ${ssv()} · засчитано ${dgN}`,`${navigator.userAgent}`,`частота ${hz}/с · acc ${I.acc} · rot ${I.rot} · inc ${I.inc}`,
  "мс | a x,y,z | r β,γ,α | наклон | засчитано",...dgLog.map(c=>`${f(c.end-c.t)} | ${c.a.map(f)} | ${c.r.map(f)} | ${c.z0.toFixed(1)}..${c.z1.toFixed(1)} | ${c.hit?"да":"нет"}`)].join("\n")}
async function dgCopy(){const t=dgText();try{await navigator.clipboard.writeText(t);toast("Запись скопирована — вставьте её в сообщение")}catch(e){say(t)}}
