// «Движение телефоном»: одно действие на выбор (по умолчанию выключено) и одно движение, которое его вызывает.
// Датчик слушается, только когда действие выбрано (или открыта «Проверка»). Остальные движения игнорируются.
// Движения (оси телефона: x — вправо, y — вдоль длинной стороны вверх, z — из экрана):
//  - «Дважды крутнуть» — кистью туда-обратно через угол, как при переключении камер на Pixel: частое вращение туда-обратно вокруг одной оси (любой, в том числе диагонали);
//  - «Дважды рубануть» — два коротких резких взмаха, как топориком: два рывка (толчок или резкий поворот), перед ними спокойно, после — тишина;
//  - «Наклонить» — наклонить телефон и сразу вернуть, как держали: по силе тяжести (самое надёжное, что умеют датчики).
// После срабатывания — пауза 1,5 с. Пока открыт лист или диалог — не срабатывает; на карточке дня работает только «Карточка дня».
const SKL=[["off","Выключено","close","Движение телефоном не используется"],["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],
 ["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],
 ["wt","Вес","scale","Записать вес за сегодня"],["rep","Карточка дня","layout","Открыть сводку дня; ещё раз — закрыть"]];
const SML=[["tw","Дважды крутнуть","mtw","Кистью туда-обратно через угол, как камеры на Pixel"],["ch","Дважды рубануть","mch","Два коротких резких взмаха, как топориком"],
 ["tl","Наклонить","mtl","Наклонить и сразу вернуть"]];
// сила: [множитель порогов, подпись]. «Обычное» — минимальный уровень
const SSV={norm:[1,"Обычное"],strong:[1.3,"Сильное"],max:[1.6,"Резкое"]};
const ssv=()=>{const v=S.set&&S.set.ss;return SSV[v]?v:"norm"},smv=()=>{const v=S.set&&S.set.sm;return v==="fl"?"tl":SML.some(x=>x[0]===v)?v:"tw"};
function setSs(v){S.set=Object.assign({},S.set,{ss:v});saveq();drawSet();hap(8)}
function setSm(v){S.set=Object.assign({},S.set,{sm:v});saveq();skReset();drawSet();hap(6)}
function skAct(){const v=S.set&&S.set.sk;return!SKL.some(x=>x[0]===v)||v==="wt"&&!wton()?"off":v}
function setSk(v){S.set=Object.assign({},S.set,{sk:v});saveq();drawSet();skBind();hap(6)}

// ===== распознавание =====
// пороги при «Обычном»: крутнуть — скорость вращения °/с и угол каждого полуоборота °; рубануть — толчок м/с²; перевернуть — наклон (g по z)
const SKB={twRate:140,twAng:22,chop:14,tilt:40};
let skOn=0,skLast=0,skTest=0,K={};
function skReset(){K={t:0,g:null,bs:0,ang:0,peak:0,dom:0,bursts:[],ch:null,chs:[],calm:0,pend:null,quiet:0,tl:null,gb:null,act:null,live:{a:0,r:0,z:0,tl:0}}}skReset();
function skFire(t){K.pend=null;K.bursts=[];K.chs=[];K.tl=null;skLast=t;skDo()}
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
 const k=SSV[ssv()][0],m=smv(),rm=Math.hypot(...rot);
 if(m==="tw")skTw(t,dt,rot,k,gz);else if(m==="ch")skCh(t,Math.max(am,rm/30),k);else if(m==="tl"&&K.g)skTl(t,rm,k)}
// дважды крутнуть: отрезки вращения в одну сторону вокруг одной оси. Ось — направление вектора вращения в начале отрезка, так что
// годится любая: вдоль телефона, поперёк или по диагонали «через угол» (как переключение камер на Pixel; телефоны ещё и называют оси по-разному).
// Нужно 3 чередующихся отрезка (туда-обратно-туда) вокруг той же оси за 1,2 с, экран не вниз
function skTw(t,dt,r,k,gz){const v=Math.hypot(...r),u=v>60?r.map(x=>x/v):null,dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
 if(gz<-3)K.bursts=[];
 if(u&&K.bu&&dot(u,K.bu)>.6){K.ang+=v*dt;K.peak=Math.max(K.peak,v);return}
 if(K.bu){const b={t,u:K.bu,ang:K.ang,peak:K.peak};K.bu=null;
  if(b.ang>=SKB.twAng*k&&b.peak>=SKB.twRate*k){const last=K.bursts[K.bursts.length-1];if(last&&dot(last.u,b.u)>-.5)K.bursts=[];
   K.bursts=K.bursts.filter(x=>t-x.t<1200);K.bursts.push(b);if(K.bursts.length>=3)return skFire(t)}}
 if(u){K.bu=u;K.ang=v*dt;K.peak=v}}
// дважды рубануть: сила взмаха — толчок (м/с²) или резкий поворот кисти (°/с ÷ 30 по всем осям: 420 °/с = 14), что больше —
// так засчитывается и прямой взмах, и взмах кистью через угол. Один взмах — это «рывок и удар при остановке», два пика рядом; поэтому пики, между которыми меньше 0,18 с,
// считаем одним взмахом. Нужно два взмаха (начала через 0,2–1 с), перед первым — 0,3 с спокойно, после второго — 0,25 с тишины;
// третий взмах следом или «взмах» дольше 0,5 с — это тряска, отмена
function skCh(t,m,k){const th=SKB.chop*k;
 if(t<K.quiet){if(m>th*.5)K.quiet=t+500;return}
 if(K.ch){if(m>th*.6)K.ch.hi=t;if(K.ch.hi-K.ch.t>500){K.ch=null;K.chs=[];K.pend=null;K.quiet=t+500;return}if(t-K.ch.hi<=180)return;
  const st=K.ch.t;K.ch=null;K.calm=t;K.chs=K.chs.filter(x=>t-x<1600);K.chs.push(st);
  if(K.chs.length===2){const gap=K.chs[1]-K.chs[0];if(gap>=200&&gap<=1000)K.pend={at:t+250};else K.chs=[K.chs[1]]}
  else if(K.chs.length>2){K.pend=null;K.chs=[];K.quiet=t+700}return}
 if(m>th){if(!K.chs.length&&K.calm&&t-K.calm<300){K.calm=t;return}K.ch={t,hi:t};if(K.pend){K.pend=null;K.chs=[];K.quiet=t+700}}}
// наклонить: насколько сила тяжести отклонилась от того, как телефон держат обычно (K.gb — медленно подстраивается, пока телефон спокоен).
// Наклон дальше 40° (×сила) и возврат ближе 15° — не дольше 1,5 с от начала. Оставили наклонённым дольше 2,5 с — это новое «как держат»
function skTl(t,rm,k){const n=Math.hypot(...K.g)||1,u=K.g.map(x=>x/n);if(!K.gb){K.gb=u;return}
 const ang=Math.acos(Math.max(-1,Math.min(1,u[0]*K.gb[0]+u[1]*K.gb[1]+u[2]*K.gb[2])))*180/Math.PI;
 if(!K.tl){if(ang>18){K.tl={s:t,out:0};return}
  if(rm<40){const b=K.gb.map((x,i)=>x*.97+u[i]*.03),m=Math.hypot(...b);K.gb=b.map(x=>x/m)}return}
 if(ang>Math.min(80,SKB.tilt*k))K.tl.out=1;
 if(ang<15){const ok=K.tl.out&&t-K.tl.s<=1500;K.tl=null;if(ok)skFire(t);return}
 if(t-K.tl.s>2500){K.tl=null;K.gb=u}}
function skBind(){const on=skAct()!=="off"||!!skTest;if(on===!!skOn)return;skOn=on;skReset();if(on)addEventListener("devicemotion",skMotion);else removeEventListener("devicemotion",skMotion)}
function skDo(){if(skTest)return dgHit();const a=skAct();if(a==="off"||isOpen||$("dg").classList.contains("on")||REP&&a!=="rep")return;hap(12);a==="rep"?togRep(!REP):actRun(a)}

// ===== «Проверка движения»: попробовать выбранное движение, увидеть, засчитано ли, и записать показания датчиков =====
let dgN=0,dgLog=[],dgInfo=null,dgRaf=0;
function dgOpen(){skTest=1;dgN=0;dgLog=[];dgInfo={n:0,t0:0,acc:0,rot:0,inc:0};skReset();skBind();$("dgn2").textContent="0";
 $("dgs2").textContent="Сделайте движение";$("dgs2").className="dgs";sv(13,"Проверка: "+SML.find(x=>x[0]===smv())[1]);dgTick()}
function dgClose(){skTest=0;cancelAnimationFrame(dgRaf);skBind()}
function dgHit(){dgN++;hap(12);$("dgn2").textContent=dgN;const s=$("dgs2");s.textContent="Засчитано!";s.className="dgs ok";mo(s,[{transform:"scale(1.12)"},{transform:"none"}],MO.t2);
 {const c=K.act||dgLog[dgLog.length-1];if(c)c.hit=1}clearTimeout(s._t);s._t=setTimeout(()=>{s.textContent="Сделайте движение";s.className="dgs"},1400)}
// живые полоски: толчок, вращение, наклон; и сводка по каждому движению (пики по осям) — для подстройки порогов
function dgSample(t,a,r,am,gz,e){const I=dgInfo;if(!I.t0)I.t0=t;I.n++;if(e.acceleration&&e.acceleration.x!=null)I.acc=1;if(e.rotationRate&&e.rotationRate.alpha!=null)I.rot=1;if(e.accelerationIncludingGravity&&e.accelerationIncludingGravity.x!=null)I.inc=1;
 const rm=Math.max(...r.map(Math.abs)),L=K.live;L.a=Math.max(am,L.a*.9);L.r=Math.max(rm,L.r*.9);L.z=gz;if(K.g){const n=Math.hypot(...K.g)||1,u=K.g.map(x=>x/n),g0=K.gb||L.g0||(L.g0=u);L.tl=Math.acos(Math.max(-1,Math.min(1,u[0]*g0[0]+u[1]*g0[1]+u[2]*g0[2])))*180/Math.PI}
 const busy=am>4||rm>60;let c=K.act;
 if(busy){if(!c)c=K.act={t,end:t,a:[0,0,0],r:[0,0,0],z0:gz,z1:gz,zs:gz,ze:gz,pk:[],hi:0,ax:""};c.end=t;if(am>10&&!c.hi)c.pk.push(Math.round(t-c.t));c.hi=am>10;{const ab=r.map(Math.abs),v=Math.max(...ab);if(v>100){const q="xyz"[ab.indexOf(v)]+(r[ab.indexOf(v)]>0?"+":"-");if(!c.ax.endsWith(q))c.ax+=q}}(a||[0,0,0]).forEach((v,i)=>c.a[i]=Math.max(c.a[i],Math.abs(v)));r.forEach((v,i)=>c.r[i]=Math.max(c.r[i],Math.abs(v)))}
 if(c){c.ze=gz;c.z0=Math.min(c.z0,gz);c.z1=Math.max(c.z1,gz);if(!busy&&t-c.end>400){dgLog.push(c);K.act=null;if(dgLog.length>40)dgLog.shift()}}}
function dgTick(){const L=K.live,bar=(id,v,max)=>{$(id).style.width=Math.min(100,Math.max(0,v/max*100))+"%"};
 bar("dgba",L.a,30);bar("dgbr",L.r,600);bar("dgbz",L.tl||0,90);
 const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0;
 $("dgi").textContent=I.n?`Датчики: ${hz} раз/с · ускорение ${I.acc?"есть":"считается"} · вращение ${I.rot?"есть":"нет"}`:"Ждём данные датчиков…";
 dgRaf=requestAnimationFrame(dgTick)}
// запись для разработчика: устройство, частота, по строке на каждое движение — пики ускорения и вращения по осям, наклон, засчитано ли
function dgText(){const I=dgInfo,hz=I.n>5?Math.round(I.n/((K.t-I.t0)/1000)):0,f=x=>Math.round(x);
 return [`БЖУ · проверка движения «${smv()}» · сила ${ssv()} · засчитано ${dgN}`,`${navigator.userAgent}`,`частота ${hz}/с · acc ${I.acc} · rot ${I.rot} · inc ${I.inc}`,
  "мс | a x,y,z | r β,γ,α | наклон мин..макс, начало→конец | толчки, мс | вращение | засчитано",...dgLog.map(c=>`${f(c.end-c.t)} | ${c.a.map(f)} | ${c.r.map(f)} | ${c.z0.toFixed(1)}..${c.z1.toFixed(1)}, ${c.zs.toFixed(1)}→${c.ze.toFixed(1)} | ${c.pk.slice(0,8).join(",")} | ${c.ax.slice(0,24)} | ${c.hit?"да":"нет"}`)].join("\n")}
async function dgCopy(){const t=dgText();try{await navigator.clipboard.writeText(t);toast("Запись скопирована — вставьте её в сообщение")}catch(e){say(t)}}
