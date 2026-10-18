// Сохранение; браузерная версия: File System Access, импорт/экспорт; раздел «Файл»
function save(){S.dirty=(S.dirty||0)+1;store();queueNativeSave();if(H){clearTimeout(tm);tm=setTimeout(wr,400)}}
function saveq(){store();queueNativeSave();if(H){clearTimeout(tm);tm=setTimeout(wr,400)}}
async function wr(){try{if((await H.queryPermission({mode:"readwrite"}))!=="granted"){perm=false;render();return}const w=await H.createWritable();S.saved=Date.now();await w.write(ser());await w.close();perm=true;S.dirty=0;store();render()}catch(e){perm=false;render()}}
let rq=0;async function resume(){if(rq)return;rq=1;try{if((await H.requestPermission({mode:"readwrite"}))==="granted"){perm=true;await wr()}}catch(e){}rq=0}
const idb=(m,v)=>new Promise((ok,no)=>{const q=indexedDB.open("bju",1);q.onupgradeneeded=()=>q.result.createObjectStore("h");q.onsuccess=()=>{const s=q.result.transaction("h",m==="get"?"readonly":"readwrite").objectStore("h"),r=m==="get"?s.get("f"):s.put(v,"f");r.onsuccess=()=>ok(r.result);r.onerror=()=>no()};q.onerror=()=>no()});
const FT={types:[{description:"Данные БЖУ",accept:{"application/json":[".json"]}}]};
async function initH(){try{await Promise.race([window.BJU_NATIVE_READY,new Promise(r=>setTimeout(r,3000))]);if(NATIVE){tc();await initNative();return}}catch(e){try{toast("Не удалось прочитать данные")}catch(_){}if(NATIVE)return}try{const h=await idb("get");if(!h)return;H=h;perm=(await h.queryPermission({mode:"readwrite"}))==="granted";if(perm){const o=parseData((await(await h.getFile()).text()));if(!S.dirty&&(o.saved||0)>(S.saved||0)){adopt(o);store()}else if(S.dirty){if((o.saved||0)>(S.saved||0)&&await ask("Файл данных новее, чем данные в браузере, а в браузере есть несохранённые изменения.\nВзять данные из файла? Если отказаться, файл будет перезаписан данными браузера.","Взять из файла")){bk();adopt(o);store()}else wr()}}render()}catch(e){}}
async function pf(){try{H=await showSaveFilePicker({suggestedName:"bju-data.json",...FT});await idb("put",H);await wr();cl();toast("Файл создан: "+H.name+". Автосохранение включено")}catch(e){}}
async function of(){try{const[h]=await showOpenFilePicker(FT);const o=pRead(await(await h.getFile()).text());if(!o||!await askRepl(o,h.name,"Подключить файл и заменить"))return;adopt(o);H=h;await idb("put",h);store();cl();render();toast("Файл подключён: "+h.name+" · дней с записями: "+dnc(o.d))}catch(e){}}
async function sh(){try{if(NATIVE)return nfCreate();const f=new File([ser()],"bju-data.json",{type:"text/plain"});if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f]});else dlFile(f,"bju-data.json");S.dirty=0;S.saved=Date.now();store();render();toast("Копия сохранена")}catch(e){say("Не удалось сохранить копию: "+(e.message||e))}}
function im(el){const f=el.files[0];el.value="";if(!f)return;f.text().then(async t=>{const o=pRead(t);if(!o||!await askRepl(o,f.name))return;
 adopt(o);store();queueNativeSave();if(H)wr();cl();render()})}
let fch=0,cpm=-1,oa=0;
function cm1(mi){cpm=mi;cal();$("st").textContent="Копировать «"+MEALS[mi]+"» в день:"}
function fc2(){if(NATIVE)return nfCreate();window.showSaveFilePicker?pf():sh()}
function fo2(){if(NATIVE)return nfOpen();window.showSaveFilePicker?of():$("fin").click()}
function fp(){const t=S.saved?new Date(S.saved).toLocaleString("ru-RU",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"ещё не сохранялось";
 $("fi").textContent=NATIVE?(MF?(mfOk?"Основной файл: «"+MF.name+"» · автосохранение включено":"Нет доступа к файлу «"+MF.name+"» — выберите его заново"):"Файл не выбран: данные хранятся только внутри приложения и пропадут при его удалении")+" · сохранено "+t+" · версия "+BUILD
  :(H?(perm?"Автосохранение включено · ":"Автосохранение на паузе · ")+(H.name||"файл"):"Файл не подключён")+" · "+t+" · сборка "+BUILD;
 $("foff").hidden=!(NATIVE&&MF);$("mgb").hidden=!mgOn();sv(5,"Файл с данными");show()}
