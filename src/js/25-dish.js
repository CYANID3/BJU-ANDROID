// Блюда из ингредиентов
const dtot=()=>dr.i.reduce((a,x)=>({g:a.g+x.g,p:a.p+x.p,f:a.f+x.f,c:a.c+x.c}),{g:0,p:0,f:0,c:0});
function dbt(){if(mode==="ing"){drawDish();return}ed=-1;pmode=mode;ik=-1;dr={n:"",i:[],w:0};drawDish()}
function drawDish(){$("dn").value=dr.n;$("dw").value=dr.w||"";$("ddl").hidden=ed<0;dlist();sv(8,ed<0?"Новое блюдо":"Изменить блюдо")}
function dlist(){$("di").innerHTML=dr.i.map((x,k)=>`<div class="it" data-k="${k}"><div><div class="n">${esc(x.n)}</div><div class="mu">${x.ul?x.q+" "+esc(x.ul)+" · ":""}${f1(x.g)} г</div></div><b>${kc(x.p,x.f,x.c)}<small>ккал</small></b><button class="x" onclick="dx(${k})" aria-label="Удалить">${ic("close")}</button></div>`).join("");$("dh").textContent=dr.i.length?"Дважды коснитесь ингредиента, чтобы изменить количество":"";dsum()}
function dx(k){dr.i.splice(k,1);dlist()}
function dsum(){const t=dtot(),w=num($("dw").value)||t.g;$("dw").placeholder=t.g?"Сумма: "+f1(t.g):"Вес, г";$("ds").textContent=t.g?`Всего ${kc(t.p,t.f,t.c)} ккал · на 100 г: Б ${f1(t.p/w*100)} · Ж ${f1(t.f/w*100)} · У ${f1(t.c/w*100)} · порция = ${f1(w)} г`:"Добавьте ингредиенты"}
function dring(){dsync();ik=-1;mode="ing";$("q").value="";lst();drawMc();sv(1,"Ингредиент")}
async function dsv(){const n=$("dn").value.trim(),t=dtot(),w=num($("dw").value)||t.g;if(!n)return toast("Введите название блюда");if(!dr.i.length)return toast("Добавьте ингредиенты");if(!(w>0))return;
 if(S.db.some((x,i)=>i!==ed&&nz(x[0])===nz(n))&&!await ask("Продукт «"+n+"» уже есть. Создать ещё один?","Создать"))return;
 const a=[n,r1(t.p/w*100),r1(t.f/w*100),r1(t.c/w*100),[["порция",r1(w)]],{w:r1(w),i:dr.i}];if(ed>=0)S.db[ed]=a;else S.db.unshift(a);save();mode=pmode;$("q").value="";lst();drawMc();if(mode==="add"&&ed<0){sel=a;gv(LBL[am],"",0)}else sv(1,vt())}
function dsync(){dr.n=$("dn").value;dr.w=num($("dw").value)}
try{localStorage.removeItem("bjudraft")}catch(e){}
function dedit(k){dsync();const x=dr.i[k],pr=S.db.find(p=>p[0]===x.n);mode="ing";ik=k;sel=[x.n,x.p/x.g*100,x.f/x.g*100,x.c/x.g*100,pr&&pr[4]];const u=x.ul&&sel[4]?sel[4].findIndex(a=>a[0]===x.ul):-1;gv("Ингредиент",u>=0?x.q:x.g,u)}
(()=>{let lk=null,lt=0;const d=$("di");
d.addEventListener("click",e=>{const r=e.target.closest(".it[data-k]");if(!r||e.target.closest(".x"))return;const k=r.dataset.k,n=Date.now();
 if(lk===k&&n-lt<600){lk=null;hap(10);dedit(+k)}else{lk=k;lt=n}})})();
