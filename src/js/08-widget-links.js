// Виджет рабочего стола и ссылки bju://add (ярлыки, «+» виджета)
// Виджет рабочего стола: итог именно за сегодня, цвет акцента и тема приложения
let wSig="";function wUpd(){const N=NX();if(!N||!N.widget)return;const E=S.d[today]||[],t=E.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0}),G=S.g,cs=getComputedStyle(document.documentElement),bg=cs.getPropertyValue("--bg").trim(),ac=cs.getPropertyValue("--ac").trim();
 const o={date:today,eaten:kc(t.p,t.f,t.c),goal:kc(G.p,G.f,G.c),p:r1(t.p),f:r1(t.f),c:r1(t.c),gp:G.p,gf:G.f,gc:G.c,accent:/^#[0-9a-f]{6}$/i.test(ac)?ac:"#22a565",bg:(c=>/^#[0-9a-f]{6}$/i.test(c)?c:"")(cs.getPropertyValue("--card").trim()),dark:/^#[0-9a-f]{6}$/i.test(bg)?lum(bg)<.5:true},sig=JSON.stringify(o);
 if(sig!==wSig){wSig=sig;N.widget(o)}}
// Ярлыки (долгое нажатие на иконку) и «+» на виджете: bju://add?m=0..5 | snack | auto
let lastU="",lastUT=0;window.BJU_onUrl=u=>{try{if(u===lastU&&Date.now()-lastUT<2500)return;lastU=u;lastUT=Date.now();const q=new URL(u);if((q.hostname||q.pathname.replace(/\//g,""))!=="add")return;
 const a=autoMeal();let m=q.searchParams.get("m");m=m==null||m==="auto"?a:m==="snack"?(a<=1?1:a<=3?3:5):+m;if(!(m>=0&&m<6))return;
 if(isOpen)closeUI();if(cur!==today){cur=today;render()}op(m)}catch(e){}};
