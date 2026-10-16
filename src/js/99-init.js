// Диалоги и запуск приложения
function ask(m,y,dg,one){return new Promise(ok=>{const e=$("dg"),Y=$("dgy"),N=$("dgn"),k=ev=>{if(ev.key==="Escape")f(false)},f=v=>{e.classList.remove("on");Y.onclick=N.onclick=null;document.removeEventListener("keydown",k);ok(v)};$("dgm").textContent=m;Y.textContent=y||"ОК";Y.style.background=dg?"var(--dg)":"";N.style.display=one?"none":"";Y.onclick=()=>f(true);N.onclick=()=>f(false);document.addEventListener("keydown",k);e.classList.add("on");const a=document.activeElement;if(!(a&&a.tagName==="INPUT"))Y.focus()})}
const say=m=>ask(m,"ОК",0,1);
document.addEventListener("visibilitychange",()=>{if(document.hidden)return;const n=iso(new Date());if(n!==today){const f=cur===today;today=n;if(f)cur=n;if(isOpen)cl();render()}});
$("ov").addEventListener("click",e=>{if(e.target===$("ov")&&Date.now()-oa>450)xcl()});addEventListener("keydown",e=>{if(e.key==="Escape"&&isOpen&&!$("dg").classList.contains("on"))xcl()},true);
try{matchMedia("(prefers-color-scheme:dark)").addEventListener("change",()=>applyAc())}catch(e){}
applyAc();render();initH();
{const m=new URLSearchParams(location.search).get("m");if(/^[0-5]$/.test(m||"")){try{history.replaceState(history.state,"",location.pathname)}catch(e){}op(+m)}}
