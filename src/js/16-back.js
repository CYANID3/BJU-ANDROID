// «Назад»: шаги внутри листа, системная кнопка, popstate
const vt=()=>mode==="mng"?"Все продукты ("+S.db.length+")":mode==="ing"?"Ингредиент":"Добавить: "+LBL[am];
function step(){svBack=1;const r=step_();svBack=0;return r}
function step_(){const on=i=>!$("v"+i).hidden;
 if(on(2)){if(ik>=0){ik=-1;drawDish();return 1}if(ei>=0)return 0;lst();drawMc();sv(1,vt());return 1}
 if(on(3)){if(!v3from)return 0;$("q").value="";lst();drawMc();sv(1,vt());return 1}
 if(on(1)&&mode==="ing"){drawDish();return 1}
 if(on(11)){drawSet();sv(7,"Настройки");return 1}
 if(on(12)){mgS=null;fp();return 1}
 if(on(13)){dgClose();drawSet();sv(7,"Настройки");return 1}
 if(on(6)&&cv){cv=cb===1&&cv===2?1:0;drawCal();fade($("cg"));return 1}return 0}
addEventListener("popstate",async()=>{if(!isOpen)return;
 if(!$("v8").hidden&&($("dn").value.trim()||dr.i.length)){if(await ask("Закрыть без сохранения блюда?","Закрыть",1))closeUI();else try{history.pushState({o:1},"")}catch(e){}return}
 if(step()){try{history.pushState({o:1},"")}catch(e){}return}
 closeUI()});
// Системная кнопка/жест «Назад» в APK: диалог → шаг назад внутри листа → закрыть лист → свернуть приложение
window.BJU_onBack=()=>{if($("dg").classList.contains("on")){($("dgn").style.display==="none"?$("dgy"):$("dgn")).click();return true}
 if(isOpen){backStep();return true}
 if(REP){togRep(false);return true}
 return false};
async function backStep(){if(!$("v3").hidden&&v3sig()!==v3snap&&!await ask("Продукт не сохранён. Выйти без сохранения?","Выйти",1))return;v3ok=1;try{if(!step())await xcl()}finally{v3ok=0}}
