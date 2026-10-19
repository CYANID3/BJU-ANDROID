// Календарь: месяцы, годы, свайп за пальцем
let cm=[0,0];const cap=s=>s[0].toUpperCase()+s.slice(1);
let cv=0,cb=0;
const MN=Array.from({length:12},(_,i)=>cap(new Date(2000,i,1).toLocaleDateString("ru-RU",{month:"long"})));
function cal(){const d=new Date(cur+"T12:00:00");cm=[d.getFullYear(),d.getMonth()];cv=0;SUB=0;sv(6,"","");drawCal();show()}
function vw(v){cb=cv;cv=v;drawCal();fade($("cg"))}
// касание заголовка: дни → месяцы → годы → обратно к дням
function calTitle(){vib("ui");if(cv===0)vw(1);else if(cv===1)vw(2);else{cv=cb===1?1:0;drawCal();fade($("cg"))}}
function mv(n){const el=$("cg");if(RM()||!el.animate){calStep(n);drawCal();return}if(el._co){el._co.finish()}calFlip(el,n,0,1)}
function pm(i){cm[1]=i;cv=0;drawCal();fade($("cg"))}
function py(y){cm[0]=y;cv=cb===1?1:0;drawCal();fade($("cg"))}
// день: число и калории цветом — в норме ±10 % (зелёный), перебор (красный), недобор (жёлтый); внизу — счётчики месяца
function drawCal(){const[y,m]=cm,gk=kc(S.g.p,S.g.f,S.g.c),g=$("cg"),ty=+today.slice(0,4),tmn=+today.slice(5,7)-1,mm=i=>String(i+1).padStart(2,"0");let h="";
 $("cwk").style.visibility=cv?"hidden":"";g.className="cg"+(cv?" m":"");
 if(cpm<0)$("ss").textContent=cv===0?"касание месяца — выбрать месяц и год":cv===1?"касание года — выбрать год":"";
 if(cv===0){const n=new Date(y,m+1,0).getDate(),off=(new Date(y,m,1).getDay()+6)%7,cnt={ok:0,o:0,lo:0};
  for(let i=0;i<off;i++)h+='<div class="cd e"></div>';
  for(let d=1;d<=n;d++){const k=y+"-"+mm(m)+"-"+String(d).padStart(2,"0"),E=S.d[k]||[],s=dk(E),st=E.length?dayStat(s,gk):"";if(st)cnt[st]++;
   h+=`<button class="cd${st?" "+st:""}${!E.length&&k>today?" n0":""}${k===today?" t":""}${k===cur?" s":""}" onclick="pd('${k}')" aria-label="${new Date(y,m,d).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}${k===today?", сегодня":""}${E.length?", "+s+" ккал"+(st==="ok"?", в норме":st==="o"?", перебор":st==="lo"?", недобор":""):", без записей"}"${k===cur?' aria-current="date"':""}>${d}<small>${E.length?s:"&nbsp;"}</small></button>`}
  for(let i=off+n;i<42;i++)h+='<div class="cd e"></div>';
  $("st").textContent=MN[m]+" "+y;
  $("cs").innerHTML=cnt.ok+cnt.o+cnt.lo?`<span><i style="background:var(--ok)"></i>в норме ${cnt.ok}</span><span><i style="background:var(--dg)"></i>перебор ${cnt.o}</span><span><i style="background:var(--wr)"></i>недобор ${cnt.lo}</span>`:"В этом месяце записей нет"}
 else if(cv===1){let all=0;for(let i=0;i<12;i++){const pre=y+"-"+mm(i),c=Object.keys(S.d).filter(k=>k.startsWith(pre)&&S.d[k].length).length;all+=c;
   h+=`<button class="cd${y===ty&&i===tmn?' t':''}${i===m?' s':''}" onclick="pm(${i})">${MN[i]}<small>${c?c+" дн.":"&nbsp;"}</small></button>`}
  $("st").textContent=String(y);$("cs").textContent=all?`Дней с записями за год: ${all}`:"В этом году записей нет"}
 else{const st=Math.floor(y/12)*12;for(let i=0;i<12;i++){const yr=st+i;h+=`<button class="cd${yr===ty?' t':''}${yr===y?' s':''}" onclick="py(${yr})">${yr}<small>&nbsp;</small></button>`}
  $("st").textContent=st+"–"+(st+11);$("cs").textContent=""}
 g.innerHTML=h}
function pd(k){if(cpm>=0){const mi=cpm,it=(S.d[cur]||[]).filter(e=>e.m===mi).map(e=>({...e}));cpm=-1;if(k===cur){cl();return}(S.d[k]=S.d[k]||[]).push(...it);cl();cur=k;vib("save");save();render();toast("Скопировано записей: "+it.length);return}if(k===cur){cl();return}const dir=k>cur?1:-1;cl();NABS=1;slide($("app"),dir,()=>{cur=k})}
function calStep(n){if(cv===0){cm[1]+=n;if(cm[1]<0){cm[1]=11;cm[0]--}if(cm[1]>11){cm[1]=0;cm[0]++}}else if(cv===1)cm[0]+=n;else cm[0]+=n*12}
function calFlip(el,dir,from,op){const w=el.offsetWidth||300;el.style.transition="";el.style.transform="";el.style.opacity="";
 if(el._co){el._co.cancel();el._co=null}if(el._ca){el._ca.cancel();el._ca=null}
 const out=el.animate([{transform:`translateX(${from}px)`,opacity:op},{transform:`translateX(${-dir*w*.5}px)`,opacity:0}],{duration:Math.max(90,150*(1-Math.abs(from)/w)),easing:MO.EI,fill:"forwards"});el._co=out;
 out.onfinish=()=>{calStep(dir);drawCal();out.cancel();el._co=null;el._ca=el.animate([{transform:`translateX(${dir*w*.5}px)`,opacity:0},{transform:"none",opacity:1}],{duration:MO.t3,easing:MO.E})}}
