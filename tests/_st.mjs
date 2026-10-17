import { openApp, day, entry } from './helpers.mjs';
const d={},wt={};for(let i=0;i<14;i++){d[day(-i)]=[entry(0,'Овсяные хлопья',60,7.4,3.7,35.7),entry(2,'Гречка (сухая)',80+i*4,10.1,2.6,49.7+i),entry(2,'Куриная грудка (сырая)',180,42.5,3.4,.7),entry(4,'Лосось',150,30,19.5,0),...(i%3?[entry(5,'Кефир 1%',200,6,2,8)]:[])];if(i%2==0)wt[day(-i)]=82-i*.1}
let k=0;for(const sc of ['dark','light']){const a=await openApp({scheme:sc,data:{g:{p:120,f:70,c:250},d,wt,set:{ac:'#14b8a6',tn:'soft',bb:'fix'}}});
 await a.ev(()=>scrollTo(0,400));await a.wait(300);await a.pg.screenshot({path:`/tmp/claude-0/ui/st${k}a.png`});
 await a.ev(()=>stats());await a.wait(600);await a.pg.screenshot({path:`/tmp/claude-0/ui/st${k}b.png`});
 for(const [n,y] of [['c',650],['d',1300],['e',1e5]]){await a.ev(y=>document.querySelector('#ov .sh').scrollTop=y,y);await a.wait(200);await a.pg.screenshot({path:`/tmp/claude-0/ui/st${k}${n}.png`})}
 k++;await a.close()}
process.exit(0)
