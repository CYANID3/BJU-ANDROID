// Касания: привязка к элементу, смахивание листа вниз
const onEn2=e=>{if(e._f)return;e._f=1;if(dgd&&!e.touches.length){gd=0;undrag()}};addEventListener("touchend",onEn2,{passive:true});
// render() пересобирает #app и удаляет элемент, где началось касание: события тогда не доходят до window.
// Поэтому слушаем касание ещё и на самом элементе-старте.
function bindT(t){if(!t||!t.addEventListener||t===document||t===window)return;const rm=()=>{t.removeEventListener("touchmove",onMv);t.removeEventListener("touchend",fin);t.removeEventListener("touchcancel",fin)};const fin=e=>{onEn(e);onEn2(e);if(e.type==="touchcancel")onCn();if(!e.touches.length)rm()};t.addEventListener("touchmove",onMv,{passive:false});t.addEventListener("touchend",fin);t.addEventListener("touchcancel",fin)}
addEventListener("blur",()=>undrag(1));document.addEventListener("visibilitychange",()=>undrag(1));
(()=>{const s=document.querySelector("#ov .sh");let y0=null,x0=0,dy=0,on=0,st0=0,ly=0,lt=0,v=0;
 s.addEventListener("touchstart",e=>{if(e.touches.length>1||e.target.closest&&e.target.closest(".nodrag,.kpd")){y0=null;return}const t=e.touches[0];y0=t.clientY;x0=t.clientX;dy=0;on=0;v=0;ly=y0;lt=performance.now();st0=shBody().scrollTop},{passive:true});
 s.addEventListener("touchmove",e=>{if(y0===null)return;const t=e.touches[0],ddy=t.clientY-y0,ddx=t.clientX-x0;
  if(!on){if(Math.abs(ddx)>10&&Math.abs(ddx)>Math.abs(ddy)){y0=null;return}
   if(ddy>8&&st0<=0&&shBody().scrollTop<=0){on=1;y0=t.clientY;s.style.transition="none"}else if(Math.abs(ddy)>8){y0=null;return}else return}
  if(e.cancelable)e.preventDefault(); // лист тянем мы: прокрутка не запускается, следующее касание не уходит на её остановку
  dy=Math.max(0,t.clientY-y0);const n=performance.now();v=(t.clientY-ly)/Math.max(1,n-lt);ly=t.clientY;lt=n;s.style.transform=`translateY(${dy}px)`},{passive:false});
 // отпустили: не закрываем — лист плавно возвращается; закрываем — уезжает вниз с того места, где палец его отпустил (без возврата наверх)
 const end=()=>{y0=null;if(!on)return;on=0;s.style.transition="";
  if(!(dy>110*GF()||(v>SL(1)&&dy>110*GF()*SL(2)))){s.style.transform="";return}
  vib("pull");const ms=Math.round(Math.max(160,Math.min(320,(s.offsetHeight-dy)/Math.max(.8,v)))),done=()=>{if(!isOpen)s.style.transform=""};
  Promise.resolve(xcl()).then(()=>{if(isOpen){s.style.transform="";return}s.style.transition=`transform ${ms}ms cubic-bezier(.2,0,0,1)`;s.style.transform="translateY(100%)";setTimeout(()=>{s.style.transition="";done()},ms+60)})};
 s.addEventListener("touchend",end);s.addEventListener("touchcancel",()=>{dy=0;v=0;end()})})();
