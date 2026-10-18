// «Режим замены» для полей количества и веса: при открытии значение не выделяется как текст — подсвечивается всё поле,
// курсора нет, а первое нажатие цифры заменяет значение целиком (стереть — очищает поле). Как обычное выделение, только без синей заливки.
// Касание самого поля выходит из режима: значение выделяется как обычно, дальше поле ведёт себя стандартно.
function rpOn(i){if(!i)return;i._rp=1;i.classList.add("rp");try{const n=i.value.length;i.setSelectionRange(n,n)}catch(e){}}
function rpOff(i){if(!i||!i._rp)return;i._rp=0;i.classList.remove("rp")}
(()=>{const fire=i=>{i.dispatchEvent(new Event("input",{bubbles:true}));const n=i.value.length;try{i.setSelectionRange(n,n)}catch(e){}};
 document.addEventListener("beforeinput",e=>{const i=e.target;if(!i||!i._rp)return;rpOff(i);const t=e.inputType||"";
  if(t==="insertText"&&e.data!=null&&e.cancelable){e.preventDefault();i.value=e.data;fire(i)}
  else if(t.startsWith("delete")&&e.cancelable){e.preventDefault();i.value="";fire(i)}
  // набор через композицию клавиатуры (отменить нельзя): очищаем поле, ввод ляжет в пустое
  else if(t.startsWith("insert")){i.value=""}},true);
 // касание поля: обычное выделение значения (как раньше); дальнейшие касания — стандартный курсор
 document.addEventListener("pointerup",e=>{const i=e.target;if(!i||!i._rp||i.tagName!=="INPUT")return;rpOff(i);setTimeout(()=>{try{i.select()}catch(_){}},0)},true);
 document.addEventListener("keydown",e=>{const i=e.target;if(i&&i._rp&&/^Arrow|^Home|^End/.test(e.key))rpOff(i)},true);
 document.addEventListener("focusout",e=>rpOff(e.target),true)})();
