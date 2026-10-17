// Тема, акцент, оттенок фона, системные панели
function lum(h){const n=parseInt(h.slice(1),16),f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)};return .2126*f(n>>16&255)+.7152*f(n>>8&255)+.0722*f(n&255)}
function act(a){const d=(document.documentElement.dataset.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))==="dark",n=parseInt(a.slice(1),16),m=d?(lum(a)<.15?255:-1):(lum(a)>.3?0:-1);return m<0?a:"#"+[n>>16&255,n>>8&255,n&255].map(v=>Math.round(v*.45+m*.55).toString(16).padStart(2,"0")).join("")}
// Оттенок фона: фон, карточки, подложки и рамки с едва заметной примесью акцентного цвета (Выкл. / Лёгкий / Заметный)
// в тёмной теме три ступени глубины: фон → карточка → блок внутри карточки (светлее), чтобы элементы не сливались
const TNB={light:{bg:"#eef1f5",card:"#ffffff",sub:"#f4f6f9",bd:"#e1e5eb"},dark:{bg:"#10141c",card:"#1a202b",sub:"#232a37",bd:"#2c3442"}},
 TNK={soft:{bg:.06,card:.035,sub:.06,bd:.12},strong:{bg:.12,card:.075,sub:.12,bd:.22}};
const tnv=()=>{const v=S.set&&S.set.tn;return TNK[v]?v:"off"};
const hexMix=(a,b,t)=>{const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);return"#"+[16,8,0].map(k=>Math.round(((A>>k)&255)*t+((B>>k)&255)*(1-t)).toString(16).padStart(2,"0")).join("")};
function applyTint(){const r=document.documentElement,v=tnv(),dark=(r.dataset.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))==="dark",
 a=(S.set&&/^#[0-9a-f]{6}$/i.test(S.set.ac||"")&&S.set.ac)||(dark?"#5b9cf0":"#2f7de1"),base=TNB[dark?"dark":"light"];
 for(const k in base){if(v==="off")r.style.removeProperty("--"+k);else r.style.setProperty("--"+k,hexMix(a,base[k],TNK[v][k]))}}
function setTn(v){S.set=Object.assign({},S.set,{tn:v});saveq();applyAc();drawSet()}
function applyAc(){applyTh();applyTint();applyLay();try{scSync()}catch(e){}const r=document.documentElement,a=S.set&&S.set.ac;if(a&&/^#[0-9a-f]{6}$/i.test(a)){r.style.setProperty("--ac",a);r.style.setProperty("--act",act(a));r.style.setProperty("--on",lum(a)>.45?"#1d2330":"#fff");tc(a)}else{r.style.removeProperty("--ac");r.style.removeProperty("--act");r.style.removeProperty("--on");tc("#2f7de1")}}
function tc(){const m=document.querySelector('meta[name="theme-color"]'),bg=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()||"#f5f6f8";if(m)m.setAttribute("content",bg);const N=NX();if(N&&/^#[0-9a-f]{6}$/i.test(bg))N.bars(bg,lum(bg)>.5);try{wUpd()}catch(e){}}
