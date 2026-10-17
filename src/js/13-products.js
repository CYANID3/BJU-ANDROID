// Список продуктов, количество, форма продукта, норма
// Избранное (звёздочка) и недавние: при добавлении без поиска — разделы «Избранное», «Недавние», «Все продукты»
const isFav=n=>!!(S.fav&&S.fav[n]);
// недавние: последние добавленные продукты; если списка ещё нет — собрать из дневника
function rcList(){if(!S.rc){const r=[];for(const k of Object.keys(S.d).sort().reverse()){for(const e of S.d[k].slice().reverse())if(!r.includes(e.n))r.push(e.n);if(r.length>=10)break}S.rc=r.slice(0,10)}return S.rc}
function rcPush(n){S.rc=[n,...rcList().filter(x=>x!==n)].slice(0,10)}
function fav(el,i){const n=S.db[i][0];S.fav=Object.assign({},S.fav);if(S.fav[n])delete S.fav[n];else S.fav[n]=1;const on=!!S.fav[n];el.classList.toggle("on",on);el.setAttribute("aria-pressed",on);el.setAttribute("aria-label",on?"Убрать из избранного":"В избранное");hap(on?8:5);saveq()}
// фильтр в «Все продукты»: 0 — все, 1 — только продукты, 2 — только блюда (кнопки видны, если есть хотя бы одно блюдо)
let pFl=0;function setPf(v){pFl=v;lst();hap(5)}
function drawPf(){const has=mode==="mng"&&S.db.some(p=>p[5]);if(!has)pFl=0;$("pf").hidden=!has;if(has){const nD=S.db.filter(p=>p[5]).length;$("pf").innerHTML=[["Все",0,S.db.length],["Продукты",1,S.db.length-nD],["Блюда",2,nD]].map(([t,v,n])=>`<button class="${pFl===v?"on":""}" onmousedown="event.preventDefault()" onclick="setPf(${v})">${t}<small>${n}</small></button>`).join("")}}
function lst(){const q=W($("q").value);drawPf();IX=[];S.db.forEach((p,i)=>{if((!pFl||(pFl===2)===!!p[5])&&q.every(t=>W(p[0]).some(w=>w.startsWith(t))))IX.push(i)});let hd=null;
 if(mode!=="mng"){const u=S.uc||{},N=i=>S.db[i][0];IX.sort((a,b)=>isFav(N(b))-isFav(N(a))||(u[N(b)]||0)-(u[N(a)]||0));
  if(!q.length){const F=IX.filter(i=>isFav(N(i))),pos=new Map(S.db.map((p,i)=>[p[0],i]).reverse()),R=rcList().filter(n=>!isFav(n)&&pos.has(n)).slice(0,8).map(n=>pos.get(n));
   if(F.length||R.length){const rest=IX.filter(i=>!isFav(N(i))&&!R.includes(i));IX=[...F,...R,...rest];hd={0:F.length?"Избранное":null,[F.length]:R.length?"Недавние":null,[F.length+R.length]:"Все продукты"}}}}
 IX=IX.slice(0,hd?100:80);
 $("ls").innerHTML=IX.length?IX.map((i,k)=>{const p=S.db[i],f=isFav(p[0]);return (hd&&hd[k]?`<div class="lh">${hd[k]}</div>`:"")+`<button class="pk${p[5]?" dish":""}" onclick="pc(${k})">${p[5]?`<span class="dk">${ic("dish")}</span>`:""}<div><div class="n">${esc(p[0])}</div><div class="mu">${p[5]?`<span class="dt">Блюдо</span> · `:""}Б ${f1(p[1])} · Ж ${f1(p[2])} · У ${f1(p[3])} на 100 г</div></div><b>${kc(p[1],p[2],p[3])} ккал</b><span class="fv${f?" on":""}" role="button" aria-pressed="${f}" aria-label="${f?"Убрать из избранного":"В избранное"}" onclick="event.stopPropagation();fav(this,${i})">${ic("star")}</span></button>`}).join(""):(pFl===2?'<div class="mu">Блюд не найдено — создайте новое блюдо</div>':'<div class="mu">Ничего не найдено — создайте новый продукт</div>')}
function pc(k){const i=IX[k];if(mode==="mng")return edit(i);sel=S.db[i];const u=sel[4]&&sel[4].length?0:-1;gv(mode==="ing"?"Ингредиент":MEALS[am],u<0?(S.lg||{})[sel[0]]:"",u)}
const UM=()=>uu<0?1:sel[4][uu][1];
// экран количества: единицы — сегментом, поле с единицей внутри, быстрые значения, превью КБЖУ порции
const nf=x=>String(x).replace(".",",");
function pv(){const q=num($("gr").value),g=q*UM(),el=$("pvw");
 el.innerHTML=g>0?`<b>${kc(sel[1]*g/100,sel[2]*g/100,sel[3]*g/100)}</b><small>ккал</small><span>Б ${nf(r1(sel[1]*g/100))}</span><span>Ж ${nf(r1(sel[2]*g/100))}</span><span>У ${nf(r1(sel[3]*g/100))}</span>${uu>=0?`<em>${nf(r1(g))} г</em>`:""}`:"";el.classList.toggle("on",g>0);
 $("ch").querySelectorAll("button").forEach(b=>b.classList.toggle("on",+b.dataset.v===q))}
function gv(t,v,u){uu=u==null?-1:u;$("pn").textContent=sel[0];$("gr").value=v?nf(v):"";$("ab").textContent=ei>=0||ik>=0?"Сохранить":"Добавить";drawU();svFocus=1;sv(2,t);const f=()=>{const g=$("gr");try{g.focus({preventScroll:true})}catch(e){g.focus()}g.select()};isOpen?f():requestAnimationFrame(f)}
function drawU(){const nd=`onmousedown="event.preventDefault()"`;
 $("em").innerHTML=ei>=0?LBL.map((m,i)=>`<button class="${i===am?"on":""}" ${nd} onclick="am=${i};drawU()">${m}</button>`).join(""):"";$("em").hidden=ei<0;
 $("pm").textContent=`Б ${nf(r1(sel[1]))} · Ж ${nf(r1(sel[2]))} · У ${nf(r1(sel[3]))} · ${kc(sel[1],sel[2],sel[3])} ккал на 100 г`;
 const us=sel[4]||[],lg=(S.lg||{})[sel[0]];$("un").hidden=!us.length;
 $("un").innerHTML=us.length?[["Граммы"],...us].map((x,i)=>`<button class="${i-1===uu?"on":""}" ${nd} onclick="su(${i-1})">${esc(x[0])}${i?`<small>${nf(r1(x[1]))} г</small>`:""}</button>`).join(""):"";
 $("un").classList.toggle("wr",us.length+1>3);
 $("gu").textContent=uu<0?"г":us[uu][0];{const w=Math.min(innerWidth*.38,$("gu").textContent.length*8.6);$("gr").style.paddingLeft=$("gr").style.paddingRight=Math.max(48,w+28)+"px"}
 const qs=uu<0?[...new Set([lg,50,100,150,200].filter(Boolean).map(r1))].slice(0,5):[.5,1,2,3];
 $("ch").innerHTML=qs.map(g=>`<button data-v="${g}" ${nd} onclick="qg(${g})">${uu<0&&g===r1(lg||0)?`<i>${ic("check")}</i>`:""}${nf(g)}${uu<0?"<small> г</small>":""}</button>`).join("");pv()}
function su(i){uu=i;$("gr").value="";drawU();try{$("gr").focus({preventScroll:true})}catch(e){}}
function qg(g){$("gr").value=nf(g);pv()}
function ee(i){const e=S.d[cur][i],pr=S.db.find(x=>x[0]===e.n);ei=i;am=e.m;sel=[e.n,e.p/e.g*100,e.f/e.g*100,e.c/e.g*100,pr&&pr[4]];const k=e.ul&&sel[4]?sel[4].findIndex(x=>x[0]===e.ul):-1;gv("Изменить: "+MEALS[am],k>=0?e.q:e.g,k);show()}
function ad(){const q=num($("gr").value),g=q*UM();if(!(g>0)){$("gr").focus();return toast("Введите количество")}const R=x=>Math.round(x*1e3)/1e3,o={m:am,n:sel[0],g:R(g),p:R(sel[1]*g/100),f:R(sel[2]*g/100),c:R(sel[3]*g/100)};if(uu>=0){o.q=q;o.ul=sel[4][uu][0]}
 if(mode==="ing"){delete o.m;if(ik>=0)dr.i[ik]=o;else dr.i.push(o);ik=-1;return drawDish()}
 if(ei>=0)S.d[cur][ei]=o;else{(S.d[cur]=S.d[cur]||[]).push(o);S.uc=S.uc||{};S.uc[sel[0]]=(S.uc[sel[0]]||0)+1;rcPush(sel[0])}
 if(uu<0){S.lg=S.lg||{};S.lg[sel[0]]=g}hap(8);save();cl();render()}
function unRow(l,g){return `<div class="ur"><input placeholder="Единица, напр. банка" value="${esc(l)}" autocomplete="off" enterkeyhint="next"><input placeholder="Граммы" inputmode="decimal" value="${g||""}" autocomplete="off"><button class="x" onclick="unDel(this)" aria-label="Удалить единицу">${ic("close")}</button></div>`}
function unDraw(a){$("unr").innerHTML=(a&&a.length?a:[["",""]]).map(x=>unRow(x[0],x[1])).join("")}
function unAdd(){$("unr").insertAdjacentHTML("beforeend",unRow("",""));$("unr").lastElementChild.firstElementChild.focus()}
function unDel(b){const r=b.closest(".ur");if($("unr").children.length>1)r.remove();else r.querySelectorAll("input").forEach(i=>i.value="")}
function unGet(){return[...$("unr").children].map(r=>{const i=r.querySelectorAll("input");return[i[0].value.trim(),num(i[1].value)]}).filter(x=>x[0]&&x[1]>0)}
let v3from=0,v3snap="",v3ok=0;const v3sig=()=>JSON.stringify([["nn","np","nf","nc"].map(i=>$(i).value.trim()),unGet()]);
function nw(){v3from=isOpen&&!$("v1").hidden?1:0;ed=-1;["nn","np","nf","nc"].forEach(i=>$(i).value="");unDraw();nkc();$("dl").hidden=true;v3snap=v3sig();svFocus=1;sv(3,"Новый продукт");const f=()=>{try{$("nn").focus({preventScroll:true})}catch(e){}};isOpen?f():requestAnimationFrame(f)}
function edit(i){const p0=S.db[i];if(p0[5]){ed=i;pmode=mode;ik=-1;dr={n:p0[0],i:p0[5].i.map(x=>({...x})),w:p0[5].w};return drawDish()}ed=i;const p=S.db[i];$("nn").value=p[0];$("np").value=p[1];$("nf").value=p[2];$("nc").value=p[3];unDraw(p[4]);nkc();$("dl").hidden=false;v3from=1;v3snap=v3sig();sv(3,"Изменить продукт")}
async function mk(){const n=$("nn").value.trim();if(!n){$("nn").focus();return toast("Введите название")}const a=[n,nn($("np").value),nn($("nf").value),nn($("nc").value)],un=unGet();if(un.length)a[4]=un;
 if(a[1]+a[2]+a[3]>100.5&&!await ask("Б+Ж+У больше 100 г на 100 г. Сохранить как есть?","Сохранить"))return;
 if(S.db.some((x,i)=>i!==ed&&nz(x[0])===nz(n))&&!await ask("Продукт «"+n+"» уже есть. Создать ещё один?","Создать"))return;
 if(ed>=0){const o=S.db[ed][0];if(o!==a[0])for(const m of["uc","lg","fav"])if(S[m]&&o in S[m]){S[m][a[0]]=S[m][o];delete S[m][o]}if(S.rc)S.rc=S.rc.map(x=>x===o?a[0]:x);S.db[ed]=a}else S.db.unshift(a);save();
 if((mode==="add"||mode==="ing")&&ed<0){sel=a;gv(mode==="ing"?"Ингредиент":MEALS[am],"",a[4]?0:-1)}else{$("q").value="";lst();sv(1,"Все продукты ("+S.db.length+")")}}
async function rm(){if(ed<0||!await ask("Удалить «"+S.db[ed][0]+"» из списка? Записи в дневнике останутся.","Удалить",1))return;{const n=S.db[ed][0];S.db.splice(ed,1);if(!S.db.some(x=>x[0]===n)){if(S.fav)delete S.fav[n];if(S.rc)S.rc=S.rc.filter(x=>x!==n)}}save();$("q").value="";lst();sv(1,"Все продукты ("+S.db.length+")")}
function gk2(){$("gkc").textContent="≈ "+kc(nn($("gp").value),nn($("gf").value),nn($("gc").value))+" ккал в день"}
function goals(){$("gp").value=S.g.p;$("gf").value=S.g.f;$("gc").value=S.g.c;gk2();sv(4,"Норма на день");show()}
function sg(){S.g={p:nn($("gp").value),f:nn($("gf").value),c:nn($("gc").value)};save();cl();render()}
