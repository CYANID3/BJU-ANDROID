// Двойное касание записи, копирование, удаление/отмена, тосты
let lt=0,lti=-1;function tp(i){const n=Date.now();if(lti===i&&n-lt<500){lt=0;lti=-1;ee(i)}else{lt=n;lti=i}}
addEventListener("pointerup",e=>{if(isOpen||e.button>0)return;const t=e.target;if(!t.closest||t.closest("button"))return;const it=t.closest("#app .it");if(it)tp(+it.dataset.i)});
// «Повторить предыдущий день?» → «Нет»: больше не предлагать для этого дня (помним последние 60 отказов)
function ncp(){S.ncp=[cur,...(S.ncp||[]).filter(x=>x!==cur)].slice(0,60);saveq();hap(5);const b=$("app").querySelector(".bn");if(b&&!RM()&&b.animate){const a=b.animate([{opacity:1,transform:"none"},{opacity:0,transform:"scale(.97)"}],{duration:MO.t1,easing:MO.EI});a.onfinish=()=>render()}else render()}
function cpy(k){S.d[cur]=(S.d[k]||[]).map(e=>({...e}));save();render();toast("Скопировано записей: "+S.d[cur].length)}
function del(i){const[e]=S.d[cur].splice(i,1);lastDel={e,i,k:cur};save();render();toast("Удалено: "+e.n,1)}
function undo(){if(!lastDel)return;const{e,i,k}=lastDel;(S.d[k]=S.d[k]||[]).splice(i,0,e);lastDel=null;save();render();$("tt").classList.remove("on")}
function toast(m,u,ms){$("tm").textContent=m;$("tt").querySelector("button").style.display=u?"":"none";$("tt").classList.add("on");clearTimeout(tmr);tmr=setTimeout(()=>$("tt").classList.remove("on"),ms||4500)}
