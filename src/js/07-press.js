// Подсветка нажатия на строки
// Подсветка нажатия: с небольшой задержкой (не мигает при прокрутке), снимается, как только палец сдвинулся
(()=>{let el=null,tm=0,x0=0,y0=0;const SEL="#app .it,.pk,#di .it";
 const clr=d=>{clearTimeout(tm);if(!el)return;const e=el;el=null;d?setTimeout(()=>e.classList.remove("pr"),d):e.classList.remove("pr")};
 addEventListener("pointerdown",e=>{clr();const t=e.target.closest&&e.target.closest(SEL);if(!t||e.target.closest(".x,.fv"))return;el=t;x0=e.clientX;y0=e.clientY;tm=setTimeout(()=>{if(el)el.classList.add("pr")},70)},true);
 addEventListener("pointermove",e=>{if(el&&Math.hypot(e.clientX-x0,e.clientY-y0)>8)clr()},true);
 addEventListener("pointerup",()=>{if(el){el.classList.add("pr");clr(160)}},true);
 addEventListener("pointercancel",()=>clr(),true);addEventListener("scroll",()=>clr(),true)})();
