// APK: внутренний файл, основной файл (SAF), синхронизация при запуске
// ===== APK: хранение данных =====
// 1) localStorage, 2) внутренний файл приложения, 3) основной файл, выбранный пользователем (MF, постоянный доступ через SAF).
let nativeSaveTimer=0,MF=null,mfOk=true;
try{MF=JSON.parse(localStorage.getItem("bju_file"))||null}catch(e){}
const NX=()=>window.BJU_NATIVE&&window.BJU_NATIVE.native?window.BJU_NATIVE:null;
const dnc=d=>Object.keys(d).filter(k=>d[k].length).length;
function setMF(f){const N=NX();if(MF&&N&&(!f||f.uri!==MF.uri))N.file.release(MF.uri).catch(()=>{});MF=f;mfOk=true;try{f?localStorage.setItem("bju_file",JSON.stringify(f)):localStorage.removeItem("bju_file")}catch(e){}}
async function nativeFlush(){clearTimeout(nativeSaveTimer);nativeSaveTimer=0;const N=NX();if(!N)return;
 S.saved=Date.now();const t=ser();let ok=true;
 try{await N.writeLocal(t)}catch(e){ok=false}
 if(MF&&N.file.available){const was=mfOk;try{await N.file.write(MF.uri,t);mfOk=true}catch(e){mfOk=false;ok=false}if(was!==mfOk)render()}
 if(ok)S.dirty=0;store()}
function queueNativeSave(){if(!NX())return;clearTimeout(nativeSaveTimer);nativeSaveTimer=setTimeout(nativeFlush,300)}
window.BJU_onPause=()=>{if(nativeSaveTimer)nativeFlush()};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&nativeSaveTimer)nativeFlush()});
async function initNative(){const N=NX();if(!N)return;const cand=[];
 const add=(t,src)=>{if(!t)return;try{cand.push({o:parseData((t)),src})}catch(e){}};
 add(await N.readLocal(),"local");
 if(MF&&N.file.available){try{const c=await N.file.check(MF.uri);if(c.read){add(await N.file.read(MF.uri),"file");if(c.name)MF.name=c.name;mfOk=!!c.write}else mfOk=false}catch(e){mfOk=false}}
 if(!cand.length)add(await N.readLegacy(),"legacy");
 let best=null;for(const c of cand)if(!best||(c.o.saved||0)>(best.o.saved||0))best=c;
 if(best&&(best.o.saved||0)>(S.saved||0)){if(S.dirty&&dnc(S.d))bk();adopt(best.o);store()}
 // кто-то отстаёт (или файла ещё нет) — дописываем актуальные данные везде
 if(!cand.some(c=>c.src==="local")||cand.some(c=>(c.o.saved||0)!==(S.saved||0))||(MF&&mfOk&&!cand.some(c=>c.src==="file")))await nativeFlush();
 render()}
async function nfCreate(){const N=NX();if(!N||!N.file.available)return say("Выбор файла недоступен в этой сборке");let r;try{r=await N.file.create("bju-data.json")}catch(e){return}
 setMF({uri:r.uri,name:r.name});await nativeFlush();cl();render();toast(mfOk?"Файл «"+r.name+"» создан · автосохранение включено":"Не удалось записать в файл «"+r.name+"»")}
async function nfOpen(){const N=NX();if(!N||!N.file.available)return $("fin").click();let r,o;try{r=await N.file.open()}catch(e){return}
 try{o=parseData((await N.file.read(r.uri)))}catch(e){return say("Не удалось прочитать файл: "+(e.message||"неверный формат"))}
 const a=dnc(S.d),b=dnc(o.d);
 if(a&&JSON.stringify(o.d)!==JSON.stringify(S.d)&&!await ask("Заменить текущие данные (дней с записями: "+a+") данными из файла «"+r.name+"» (дней: "+b+")?\nПеред заменой будет сохранена резервная копия.","Заменить",1))return;
 if(a)bk();adopt(o);store();setMF(r.writable?{uri:r.uri,name:r.name}:null);await nativeFlush();cl();render();
 toast(r.writable?"Файл «"+r.name+"» подключён как основной · автосохранение включено":"Данные загружены, но файл доступен только для чтения")}
async function nfOff(){if(!MF)return;if(!await ask("Отключить файл «"+MF.name+"»?\nДанные останутся в приложении, но файл перестанет обновляться.","Отключить"))return;setMF(null);fp();render()}
