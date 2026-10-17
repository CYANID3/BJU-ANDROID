// Даты, $(), экранирование, калории, вибрация, перелистывание дня
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
let today=iso(new Date());let cur=today;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const r1=x=>Math.round(x*10)/10,f1=x=>String(r1(x)).replace(".",","),kc=(p,f,c)=>Math.round(p*4+f*9+c*4),dk=E=>kc(E.reduce((a,e)=>a+e.p,0),E.reduce((a,e)=>a+e.f,0),E.reduce((a,e)=>a+e.c,0));
function shiftDay(c,n){const d=new Date(c+"T12:00:00");d.setDate(d.getDate()+n);return iso(d)}
function hpv(){const v=S.set&&S.set.hp;return v==="off"||v==="nodays"?v:"on"}
function hap(ms,d){const v=hpv();if(v==="off"||(d&&v==="nodays"))return;try{if(window.BJU_NATIVE&&window.BJU_NATIVE.native){window.BJU_NATIVE.haptic(ms);return}navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
function go(n){if(!GQ)hap(6,1);if(!NABS){NP=shiftDay(NP||cur,n);head(NP)}slide($("app"),n,()=>{cur=shiftDay(cur,n)})}
