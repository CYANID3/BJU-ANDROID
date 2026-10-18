// «Встряхнуть телефон»: одно действие на выбор (по умолчанию выключено). Датчик слушается, только когда действие выбрано.
// Встряхивание — несколько резких толчков подряд (сколько и насколько резких — по «Силе встряхивания»); после срабатывания — пауза 1,5 с, чтобы одно движение не сработало дважды.
// Пока открыт лист или диалог — не срабатывает; на карточке дня работает только «Карточка дня» (закрывает её).
const SKL=[["off","Выключено","close","Встряхивание не используется"],["meal","Приём пищи","plus","Добавить в приём пищи по времени суток"],
 ["prod","Новый продукт","box","Сразу открыть создание продукта"],["stat","Статистика","chart","Открыть статистику за месяц"],
 ["wt","Вес","scale","Записать вес за сегодня"],["rep","Карточка дня","layout","Открыть сводку дня; встряхнуть ещё раз — закрыть"]];
// сила встряхивания: [порог толчка м/с², сколько толчков, за сколько мс, подпись]. «Обычное» — минимальный уровень,
// «Сильное» и «Резкое» защищают от случайных срабатываний на ходу, в транспорте, при беге
const SSV={norm:[14,3,1000,"Обычное"],strong:[20,3,900,"Сильное"],max:[26,4,1100,"Резкое"]};
const ssv=()=>{const v=S.set&&S.set.ss;return SSV[v]?v:"norm"};
function setSs(v){S.set=Object.assign({},S.set,{ss:v});saveq();drawSet();hap(8)}
function skAct(){const v=S.set&&S.set.sk;return!SKL.some(x=>x[0]===v)||v==="wt"&&!wton()?"off":v}
function setSk(v){S.set=Object.assign({},S.set,{sk:v});saveq();drawSet();skBind();hap(6)}
let skOn=0,skT=[],skLast=0;
function skMotion(e){const a=e.acceleration&&e.acceleration.x!=null?e.acceleration:null,g=e.accelerationIncludingGravity;let m;
 if(a)m=Math.hypot(a.x,a.y,a.z);else if(g&&g.x!=null)m=Math.abs(Math.hypot(g.x,g.y,g.z)-9.81);else return;
 const[th,cnt,win]=SSV[ssv()],n=e.timeStamp||performance.now();if(m<th||n-skLast<1500)return;if(skT.length&&n-skT[skT.length-1]<110)return;
 skT=skT.filter(t=>n-t<win);skT.push(n);if(skT.length>=cnt){skT=[];skLast=n;skDo()}}
function skBind(){const on=skAct()!=="off";if(on===!!skOn)return;skOn=on;if(on)addEventListener("devicemotion",skMotion);else removeEventListener("devicemotion",skMotion)}
function skDo(){const a=skAct();if(a==="off"||isOpen||$("dg").classList.contains("on")||REP&&a!=="rep")return;hap(12);a==="rep"?togRep(!REP):actRun(a)}
