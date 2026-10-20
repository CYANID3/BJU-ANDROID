// Виджет рабочего стола и ссылки bju://add (ярлыки, «+» виджета)
// Виджет рабочего стола: итог именно за сегодня, цвета и тема приложения
// Виджет получает обе палитры (светлую и тёмную) и режим темы: при «Как в системе» он сам переключается вместе с телефоном
let wSig="";function wUpd(){const N=NX();if(!N||!N.widget)return;const E=S.d[today]||[],t=sumE(E),G=S.g,th=(S.set&&S.set.th)||"auto";
 const pal=d=>{const T=palette(d);return{bg:T.card,tx:T.tx,mu:T.mu,trk:T.bd,ac:T.ac,on:T.onw,acs:T.acs}};
 const o={date:today,eaten:kc(t.p,t.f,t.c),goal:kc(G.p,G.f,G.c),p:r1(t.p),f:r1(t.f),c:r1(t.c),gp:G.p,gf:G.f,gc:G.c,theme:th==="light"||th==="dark"?th:"auto",light:pal(false),dark:pal(true)},sig=JSON.stringify(o);
 if(sig!==wSig){wSig=sig;N.widget(o)}}
// Ярлыки (долгое нажатие на иконку) и «+» на виджете: bju://add?m=0..5 | snack | auto
let lastU="",lastUT=0;window.BJU_onUrl=u=>{try{if(u===lastU&&Date.now()-lastUT<2500)return;lastU=u;lastUT=Date.now();const q=new URL(u),h=q.hostname||q.pathname.replace(/\//g,"");
 // «＋» на виджете — то же, что «＋» в панели (по настройке); «Скрыть кнопку» — приём пищи по времени
 if(h==="fab"){if(isOpen)closeUI();if(cur!==today){cur=today;render()}if(fabAct()==="hide")op(autoMeal());else fabDo();return}
 if(h==="weight"){if(!wton())return;if(isOpen)closeUI();if(cur!==today){cur=today;render()}wtOpen();return}
 if(h!=="add")return;
 const a=autoMeal();let m=q.searchParams.get("m");m=m==null||m==="auto"?a:m==="snack"?(a<=1?1:a<=3?3:5):+m;if(!(m>=0&&m<6))return;
 if(isOpen)closeUI();if(cur!==today){cur=today;render()}op(m)}catch(e){}};
