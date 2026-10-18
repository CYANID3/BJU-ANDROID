// «Движение телефоном»: одно действие на выбор (по умолчанию выключено) и одно движение, которое его вызывает.
// Датчик слушается, только когда действие выбрано. Остальные движения игнорируются — так меньше случайных срабатываний.
// Движения (оси телефона: x — вправо, y — вдоль длинной стороны вверх, z — из экрана):
//  - «Вверх-вниз» — потрясти вдоль длинной стороны: несколько резких толчков с чередованием направления по оси y;
//  - «Резко вниз» — одно короткое движение вниз с остановкой (вниз — по направлению силы тяжести, как бы ни держали телефон);
//    срабатывает с задержкой 0,35 с: если за ним последовали ещё толчки, это была тряска, а не «вниз»;
//  - «Поворот» — повернуть телефон в плоскости экрана (как руль) одним движением;
//  - «Покачивание» — повернуть туда-обратно несколько раз.
// После срабатывания — пауза 1,5 с. Пока открыт лист или диалог — не срабатывает; на карточке дня работает только «Карточка дня».
const SKL=[["off","Выключено","close","Движение телефоном не используется"],["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],
 ["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],
 ["wt","Вес","scale","Записать вес за сегодня"],["rep","Карточка дня","layout","Открыть сводку дня; ещё раз — закрыть"]];
const SML=[["ud","Вверх-вниз","mud","Потрясти телефон вдоль длинной стороны"],["dn","Резко вниз","mdn","Одно короткое движение вниз с остановкой"],
 ["rot","Поворот","mrot","Повернуть в плоскости экрана, как руль"],["wig","Покачивание","mwig","Повернуть туда-обратно несколько раз"]];
// сила: [множитель порогов, сколько толчков / покачиваний, подпись]. «Обычное» — минимальный уровень
const SSV={norm:[1,3,"Обычное"],strong:[1.35,3,"Сильное"],max:[1.7,4,"Резкое"]};
const ssv=()=>{const v=S.set&&S.set.ss;return SSV[v]?v:"norm"},smv=()=>{const v=S.set&&S.set.sm;return SML.some(x=>x[0]===v)?v:"ud"};
function setSs(v){S.set=Object.assign({},S.set,{ss:v});saveq();drawSet();hap(8)}
function setSm(v){S.set=Object.assign({},S.set,{sm:v});saveq();skReset();drawSet();hap(6)}
function skAct(){const v=S.set&&S.set.sk;return!SKL.some(x=>x[0]===v)||v==="wt"&&!wton()?"off":v}
function setSk(v){S.set=Object.assign({},S.set,{sk:v});saveq();drawSet();skBind();hap(6)}

// ===== распознавание =====
// базовые пороги (при «Обычном»): толчок м/с², скорость поворота °/с, угол поворота °
const SKB={ud:12,dnGo:10,dnStop:7,rotRate:220,rotAng:50,wigRate:180,wigAng:18};
let skOn=0,skLast=0,K={};
function skReset(){K={t:0,g:null,pk:[],calm:0,dn:null,pend:null,bs:0,ang:0,peak:0,dom:0,quiet:0,bursts:[]}}skReset();
function skFire(t){K.pend=null;K.pk=[];K.bursts=[];skLast=t;skDo()}
function skMotion(e){const t=e.timeStamp||performance.now(),dt=K.t?Math.min(.05,Math.max(0,(t-K.t)/1000)):0;K.t=t;
 const I=e.accelerationIncludingGravity,L=e.acceleration,R=e.rotationRate||{},ok=v=>v&&v.x!=null;
 // сила тяжести: из «с гравитацией» минус линейное, иначе — сглаживанием; линейное ускорение — разница
 let g=null,a=null;if(ok(I)&&ok(L)){g=[I.x-L.x,I.y-L.y,I.z-L.z];a=[L.x,L.y,L.z]}
 else if(ok(I)){K.g=K.g?K.g.map((v,i)=>v*.85+[I.x,I.y,I.z][i]*.15):[I.x,I.y,I.z];g=K.g;a=[I.x-g[0],I.y-g[1],I.z-g[2]]}
 else if(ok(L))a=[L.x,L.y,L.z];
 if(g)K.g=g;
 if(K.pend&&t>=K.pend.at){const p=K.pend;K.pend=null;if(t-skLast>=1500)return skFire(t)}
 if(t-skLast<1500)return;
 const[k,cnt]=SSV[ssv()],m=smv();
 if(m==="ud"&&a)skUD(t,a,k,cnt);else if(m==="dn"&&a)skDN(t,a,k);else if(m==="rot"||m==="wig")skRot(t,dt,R,k,cnt,m)}
// вверх-вниз: пики по оси y, которые заметно сильнее остальных осей, с чередованием знака
function skUD(t,a,k,cnt){const y=a[1],side=Math.hypot(a[0],a[2]),th=SKB.ud*k;if(Math.abs(y)<th||Math.abs(y)<side*1.5)return;
 const s=Math.sign(y),last=K.pk[K.pk.length-1];if(last&&last.s===s){if(Math.abs(y)>last.v)last.v=Math.abs(y);return}
 if(last&&t-last.t<70)return;K.pk=K.pk.filter(p=>t-p.t<900*(cnt/3));K.pk.push({t,s,v:Math.abs(y)});if(K.pk.length>=cnt)skFire(t)}
// резко вниз: разгон вдоль силы тяжести, затем остановка; перед этим — спокойствие, после — ничего резкого
function skDN(t,a,k){const g=K.g;if(!g)return;const gl=Math.hypot(...g)||1,d=g.map(v=>-v/gl),v=a[0]*d[0]+a[1]*d[1]+a[2]*d[2],side=Math.hypot(a[0]-v*d[0],a[1]-v*d[1],a[2]-v*d[2]),mag=Math.hypot(...a);
 // после остановки: пока длится торможение — продлеваем его; новый резкий толчок позже — это тряска, отменяем
 if(K.pend){if(v<-SKB.dnStop*k*.5){K.pend.stop=t;K.pend.at=Math.max(K.pend.at,t+250)}else if(mag>SKB.dnStop*k&&t-K.pend.stop>120)K.pend=null;return}
 if(!K.dn){if(mag>SKB.dnGo*k*.6&&!(v>SKB.dnGo*k&&side<v*.8))K.calm=t;
  if(v>SKB.dnGo*k&&side<v*.8&&t-K.calm>300)K.dn={t};return}
 const el=t-K.dn.t;if(el>400){K.dn=null;return}
 if(v<-SKB.dnStop*k&&el>=40){K.dn=null;K.pend={at:t+350,stop:t}}}
// поворот / покачивание: вращение вокруг оси z (в плоскости экрана), отрезками одного направления
function skRot(t,dt,R,k,cnt,m){const z=R.alpha||0,o=Math.max(Math.abs(R.beta||0),Math.abs(R.gamma||0)),s=Math.abs(z)>40?Math.sign(z):0;
 if(s&&s===K.bs){K.ang+=z*dt;K.peak=Math.max(K.peak,Math.abs(z));K.dom+=Math.abs(z)>o*1.3?1:-1;return}
 // отрезок закончился (смена направления или остановка)
 if(K.bs){const b={t,s:K.bs,ang:Math.abs(K.ang),peak:K.peak,dom:K.dom>0};K.bs=0;if(b.dom)skBurst(t,b,k,cnt,m)}
 if(s){K.bs=s;K.ang=z*dt;K.peak=Math.abs(z);K.dom=Math.abs(z)>o*1.3?1:-1}}
function skBurst(t,b,k,cnt,m){
 // поворот: одно резкое вращение; такое же резкое обратное сразу следом — это покачивание, тогда молчим, пока не успокоится
 if(m==="rot"){if(t<K.quiet){K.quiet=t+600;return}
  if(K.pend){if(b.s!==K.pend.s&&b.peak>=SKB.rotRate*k){K.pend=null;K.quiet=t+600}return}
  if(b.ang>=SKB.rotAng*k&&b.peak>=SKB.rotRate*k)K.pend={at:t+250,s:b.s};return}
 if(b.ang<SKB.wigAng*k||b.peak<SKB.wigRate*k)return;const last=K.bursts[K.bursts.length-1];
 if(last&&last.s===b.s)K.bursts=[];K.bursts=K.bursts.filter(x=>t-x.t<1000*(cnt/3));K.bursts.push(b);if(K.bursts.length>=cnt)skFire(t)}
function skBind(){const on=skAct()!=="off";if(on===!!skOn)return;skOn=on;skReset();if(on)addEventListener("devicemotion",skMotion);else removeEventListener("devicemotion",skMotion)}
function skDo(){const a=skAct();if(a==="off"||isOpen||$("dg").classList.contains("on")||REP&&a!=="rep")return;hap(12);a==="rep"?togRep(!REP):actRun(a)}
