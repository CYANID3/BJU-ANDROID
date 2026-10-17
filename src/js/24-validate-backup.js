// Проверка данных, резервная копия, пищевая ценность
function chk(o){if(!o||typeof o!=="object"||!o.g||!o.d||typeof o.d!=="object")throw Error("нет данных дневника");
 if(o.v>VER)throw Error("файл создан в более новой версии приложения");
 ["p","f","c"].forEach(k=>{if(!isN(o.g[k]))throw Error("неверная норма")});
 for(const k in o.d){if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!Array.isArray(o.d[k]))throw Error("неверная дата "+k);o.d[k].forEach(e=>{if(!e||typeof e.n!=="string"||!(e.m>=0&&e.m<6)||![e.g,e.p,e.f,e.c].every(isN))throw Error("неверная запись за "+k)})}
 if(o.db&&(!Array.isArray(o.db)||!o.db.every(p=>Array.isArray(p)&&typeof p[0]==="string"&&[p[1],p[2],p[3]].every(isN)&&(p[4]==null||Array.isArray(p[4])&&p[4].every(u=>Array.isArray(u)&&typeof u[0]==="string"&&u[1]>0))&&(p[5]==null||Array.isArray(p[5].i)))))throw Error("неверный список продуктов");
 return o}
function bk(){const j=ser();try{localStorage.setItem("bju2bak",j)}catch(e){}if(NATIVE){const N=NX();if(N)N.writeBackup(j).catch(()=>{});return}try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([j],{type:"application/json"}));a.download="bju-backup-"+today+".json";a.click()}catch(e){}}
function nkc(){const p=num($("np").value),f=num($("nf").value),c=num($("nc").value),s=p+f+c;$("nk").innerHTML=s?`≈ ${kc(p,f,c)} ккал на 100 г`+(s>100.5?` <span style="color:var(--dg)">· Б+Ж+У = ${f1(s)} г, больше 100 г — проверьте</span>`:""):""}
