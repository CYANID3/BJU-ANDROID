// Резервная копия, скачивание файла, пищевая ценность продукта (проверка данных — chk в 01-data.js)
// резервная копия перед заменой данных. В APK — только во внутренний файл приложения (без отступов): в памяти WebView
// место ограничено (~5 МБ), там остаётся одна рабочая копия. В браузере — как раньше: память браузера + скачивание файла
function bk(){if(NATIVE){const N=NX();if(N)N.writeBackup(JSON.stringify(toFile(S))).catch(()=>{});return}const j=ser();try{localStorage.setItem("bju2bak",j)}catch(e){}try{dlFile(new Blob([j],{type:"application/json"}),"bju-backup-"+today+".json")}catch(e){}}
// скачать файл в браузере (в APK файлы пишет нативная часть)
function dlFile(b,name){const a=document.createElement("a"),u=URL.createObjectURL(b);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
function nkc(){const p=num($("np").value),f=num($("nf").value),c=num($("nc").value),s=p+f+c;$("nk").innerHTML=s?`≈ <b>${kc(p,f,c)} ккал</b> на 100 г`+(s>100.5?` <span style="color:var(--dg)">· Б+Ж+У = ${f1(s)} г, больше 100 г — проверьте</span>`:""):"Калории посчитаются по Б / Ж / У";try{kpLabel()}catch(e){}}
