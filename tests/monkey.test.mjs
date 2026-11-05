// Диагностика «обезьяной»: сотни случайных касаний, взмахов и долгих нажатий по всему экрану (медленный процессор).
// Ошибок быть не должно; после каждой серии закрытые слои не перехватывают касаний, а приложение откликается:
// «Назад» закрывает лист, касание нижней панели открывает «Настройки».
// Долгий (около 4 мин на серию), поэтому запускается отдельно: MONKEY=1 SEEDS=3,17 node --test tests/monkey.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

for (const seed0 of (process.env.SEEDS || '3,17').split(',').map(Number)) test(`случайные касания (seed ${seed0}): без ошибок и зависаний`, { skip: !process.env.MONKEY && 'долгий — MONKEY=1' }, async () => {
  const a = await openApp({ native: true, data: { g: { p: 200, f: 80, c: 350 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }, { m: 2, n: 'Гречка', g: 150, p: 18, f: 5, c: 90 }], [day(-1)]: [{ m: 4, n: 'Суп', g: 300, p: 9, f: 5, c: 20 }] }, wt: { [day()]: 80 }, nt: { [day()]: 'Заметка' }, set: { pf: { n: 'Тест', c: '#0d7f70' } }, db: [['Рис', 7, 1, 74], ['Гречка', 12, 3, 62], ['Суп', 3, 1.7, 6.7]] } });
  a.pg.on('pageerror', e => process.env.DBG && console.log('STACK', e.stack));
  const c = await a.ctx.newCDPSession(a.pg); await c.send('Emulation.setCPUThrottlingRate', { rate: 2 });
  // системные окна выбора файла в моке не открываются — «выбор» сразу возвращает файл; диалоги закрываются касаниями
  await a.ev(() => { window.__pick = 'content://x/old.json'; __P.files['content://x/old.json'] = ''; return 0 });
  let seed = seed0; const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n };
  const W = 412, H = 915, problems = [];
  const T = (type, x, y) => c.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  for (let round = 0; round < 25; round++) {
    for (let i = 0; i < 14; i++) {
      const k = rnd(10), x = 10 + rnd(W - 20), y = 30 + rnd(H - 60);
      if (k < 7) { await T('touchStart', x, y); await a.wait(30 + rnd(60)); await T('touchEnd') }
      else if (k < 9) { const dx = rnd(2) ? 1 : -1, hz = rnd(2); await T('touchStart', x, y); for (let s = 1; s <= 8; s++) { await T('touchMove', hz ? x + dx * s * 28 : x, hz ? y : y + dx * s * 40); await a.wait(12) } await T('touchEnd') }
      else { await T('touchStart', x, y); await a.wait(650); await T('touchEnd') }
      await a.wait([20, 80, 200, 400][rnd(4)]);
    }
    await a.wait(900);
    // пользователь закрывает всё «Назад» и проверяет, что приложение живое
    for (let i = 0; i < 8; i++) { await a.ev(i => { if ($('dg').classList.contains('on')) { $(i < 2 ? 'dgn' : 'dgy').click(); return 0 } if (window.REP) { togRep(0); return 0 } return window.BJU_onBack ? BJU_onBack() : 0 }, i); await a.wait(350) }
    const st = await a.ev(() => ({ v: (VWS.find(i => !$('v' + i).hidden) || 0), t: $('st').textContent, dgm: $('dgm').textContent.slice(0, 60), open: isOpen, dg: $('dg').classList.contains('on'), ovInert: $('ov').inert, lk: document.documentElement.classList.contains('lk'), layers: document.querySelectorAll('#ov > .svl, #ov > .sve, #ov > .hsg, #ov > .smh').length }));
    if (st.open || st.dg || !st.ovInert || st.lk || st.layers) { problems.push(`раунд ${round}: после «Назад» ` + JSON.stringify(st)); await a.ev(() => { closeUI(); return 0 }); await a.wait(400); continue }
    // касание кнопки «Настройки» на нижней панели открывает лист
    const b = await a.ev(() => { const e = [...document.querySelectorAll('.bt button')].find(x => /Настройки/.test(x.textContent)); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
    if (!b) { problems.push(`раунд ${round}: нет кнопки «Настройки»`); continue }
    await T('touchStart', b.x, b.y); await a.wait(50); await T('touchEnd'); await a.wait(700);
    if (!(await a.ev(() => isOpen && !$('v7').hidden))) problems.push(`раунд ${round}: касание «Настройки» не открыло лист`);
    await a.ev(() => { closeUI(); return 0 }); await a.wait(400);
  }
  assert.deepEqual(problems, []); assert.deepEqual(a.errors, []);
  await a.close();
});
