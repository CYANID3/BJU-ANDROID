// Ревизия 5: календарь по неделям, взмах вкладок по пустому месту, смена кадра (тема, карточка дня), плавная высота листа
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const flickAt = (a, x, y, dx, ms) => a.ev(async ([x, y, dx, ms]) => {
  const el = document.elementFromPoint(x, y), mk = (type, cx) => { const t = new Touch({ identifier: 1, target: el, clientX: cx, clientY: y }); el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] })) };
  mk('touchstart', x); for (let i = 1; i <= 8; i++) { await new Promise(r => setTimeout(r, ms / 8)); mk('touchmove', x + dx * i / 8) } mk('touchend', x + dx); await new Promise(r => setTimeout(r, 650));
}, [x, y, dx, ms]);

test('календарь: строк столько, сколько недель в месяце; без строки-подсказки; заголовок — кнопка со стрелкой', async () => {
  const a = await openApp();
  await a.ev(() => cal()); await a.wait(400);
  const weeks = (y, m) => Math.ceil(((new Date(y, m, 1).getDay() + 6) % 7 + new Date(y, m + 1, 0).getDate()) / 7);
  for (const [y, m] of [[2026, 9], [2026, 10], [2026, 1], [2027, 1]]) {
    const r = await a.ev(([y, m]) => { cm = [y, m]; drawCal(); const g = $('cg'); return { cells: g.children.length, rows: getComputedStyle(g).gridTemplateRows.split(' ').length, h: g.offsetHeight } }, [y, m]);
    assert.equal(r.cells, weeks(y, m) * 7, `${y}-${m + 1}: только нужные недели`); assert.equal(r.rows, weeks(y, m));
    assert.equal(r.h, weeks(y, m) * 56 - 4, 'высота — по числу недель');
  }
  assert.equal(await a.ev(() => $('ss').textContent), '', 'нет строки «касание месяца — …»');
  assert.equal(await a.ev(() => document.querySelector('#ov .hd').classList.contains('cal') && getComputedStyle($('st'), '::after').content), '""', 'стрелка у заголовка');
  await a.pg.click('#st'); await a.wait(300);
  assert.equal(await a.ev(() => cv), 1, 'нажатие на заголовок — выбор месяца');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('вкладки «Все / Продукты / Блюда»: взмах работает и по пустому месту под коротким списком', async () => {
  const dish = ['Салат', 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }];
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: [dish, ['Творог 5%', 17, 5, 1.8]] } });
  await a.ev(() => mng()); await a.wait(400); await a.ev(() => { pFl = 2; lst() }); await a.wait(200);
  for (const y of [600, 760]) {
    assert.equal(await a.ev(([y]) => document.elementFromPoint(200, y).closest('#ls') === null, [y]), true, 'точка — не в списке');
    await flickAt(a, 150, y, 80, 120);
    assert.equal(await a.ev(() => pFl), 1, `y=${y}: вкладка сменилась`);
    await a.ev(() => { pFl = 2; lst() }); await a.wait(150);
  }
  // в календаре и статистике этот же взмах по листу вкладки не трогает
  await a.ev(() => { cl() }); await a.wait(400); await a.ev(() => cal()); await a.wait(400);
  const m0 = await a.ev(() => JSON.stringify(cm)), cy = await a.ev(() => { const r = $('cg').getBoundingClientRect(); return r.top + r.height / 2 }); await flickAt(a, 150, cy, 80, 120);
  assert.notEqual(await a.ev(() => JSON.stringify(cm)), m0, 'календарь листается своим взмахом');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('смена темы и карточки дня — одним кадром: переходы цвета на время смены выключены, затем включаются обратно', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, set: { dc: 'row' } } });
  const r = await a.ev(async () => {
    const has = !!document.startViewTransition; setTh('light');
    const during = document.documentElement.classList.contains('notr'), names = !!document.querySelector('#app>[data-fk]').style.viewTransitionName;
    await new Promise(r => setTimeout(r, 600));
    return { has, during, names, after: document.documentElement.classList.contains('notr'), left: [...document.querySelectorAll('[style*="view-transition-name"]')].length, bg: getComputedStyle(document.querySelector('.sum')).backgroundColor };
  });
  assert.ok(r.has, 'в Chromium есть View Transitions'); assert.ok(r.during, 'во время смены переходы цвета выключены'); assert.ok(r.names, 'карточки переезжают сами');
  assert.equal(r.after, false); assert.equal(r.left, 0, 'имена убраны после смены'); assert.equal(r.bg, 'rgb(255, 255, 255)');
  // карточка дня — тоже сменой кадра
  await a.ev(() => togRep(true)); await a.wait(600);
  assert.equal(await a.ev(() => [REP, document.documentElement.classList.contains('repm'), !!document.querySelector('#app .rep')].join()), 'true,true,true');
  await a.ev(() => togRep(false)); await a.wait(600);
  assert.equal(await a.ev(() => !!document.querySelector('#app .rep')), false);
  // без View Transitions (старый WebView) — сразу, но тоже без запоздалых переходов
  const old = await a.ev(async () => { const v = document.startViewTransition; document.startViewTransition = undefined; setTh('dark'); const c = document.documentElement.classList.contains('notr'); await new Promise(r => setTimeout(r, 100)); document.startViewTransition = v; return [c, document.documentElement.classList.contains('notr'), document.documentElement.dataset.theme].join() });
  assert.equal(old, 'true,false,dark');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('экран жеста: подсказка уходит и появляется плавно, строки едут вместе с краем листа', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { dw: 'cal' } } });
  await a.ev(() => { sets(); pick('dw') }); await a.wait(500);
  const off = await a.ev(() => { setDw('off'); const g = [...document.querySelectorAll('#ov > .smh')], body = shBody().getAnimations().flatMap(x => x.effect.getKeyframes().map(k => k.transform).filter(Boolean));
    return { ghost: g.length, body: body[0] || '' } });
  assert.equal(off.ghost, 1, 'ушедшая подсказка гаснет на месте'); assert.match(off.body, /translateY\(-\d/, 'содержимое едет вниз вместе с краем');
  await a.wait(500);
  assert.equal(await a.ev(() => document.querySelectorAll('#ov > .smh, #ov > .sve').length), 0, 'копии убраны');
  const on = await a.ev(() => { setDw('cal'); return $('dwh').getAnimations().length });
  assert.ok(on >= 1, 'новая подсказка проявляется');
  assert.deepEqual(a.errors, []);
  await a.close();
});
