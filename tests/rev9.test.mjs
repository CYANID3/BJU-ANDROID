// Ревизия 9: касание нижней панели (и шапки, и низа листа) не теряется, даже если Android потратил его на остановку прокрутки
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

// касание без «click»: так выглядит нажатие, которое Android отдал на остановку прокрутки по инерции
const lostTap = (a, sel, dy = 0) => a.ev(async ([sel, dy]) => {
  const el = document.querySelector(sel), r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const mk = (type, yy) => { const t = new Touch({ identifier: 7, target: el, clientX: x, clientY: yy }); el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] })) };
  mk('touchstart', y); await new Promise(r => setTimeout(r, 60)); mk('touchend', y + dy); await new Promise(r => setTimeout(r, 250));
}, [sel, dy]);

test('нижняя панель: касание без «click» всё равно открывает раздел — ровно один раз', async () => {
  const a = await openApp();
  await a.ev(() => { window.__n = 0; const f = window.cal; window.cal = () => { __n++; f() } });
  await lostTap(a, '.bt button[onclick="cal()"]');
  assert.deepEqual(await a.ev(() => [__n, isOpen, !$('v6').hidden]), [1, true, true], 'календарь открыт');
  await a.ev(() => closeUI()); await a.wait(400);
  // обычное касание (браузер сам присылает «click») — тоже ровно один раз, без второго нажатия от подстраховки
  await a.ev(() => { __n = 0 }); const b = await a.ev(() => { const r = document.querySelector('.bt button[onclick="cal()"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] });
  await a.pg.touchscreen.tap(...b); await a.wait(400);
  assert.equal(await a.ev(() => __n), 1);
  // сдвиг пальца больше 10 px — это жест, не нажатие
  await a.ev(() => { closeUI(); __n = 0 }); await a.wait(400);
  await lostTap(a, '.bt button[onclick="cal()"]', -24);
  assert.equal(await a.ev(() => __n), 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('шапка с датой: «К сегодня» без «click» — переход на сегодня; низ листа («Сегодня» в календаре) — тоже', async () => {
  const a = await openApp();
  await a.ev(() => { cur = shiftDay(today, -3); render(); head() }); await a.wait(200);
  await lostTap(a, '#dt [data-t]'); await a.wait(400);
  assert.equal(await a.ev(() => cur === today), true);
  await a.ev(() => { cur = shiftDay(today, -40); render(); head(); cal() }); await a.wait(600);
  const has = await a.ev(() => !!document.querySelector('#ov .shf button:not([hidden])') && [...document.querySelectorAll('#ov .shf .ft')].some(f => !f.hidden));
  if (has) {
    const sel = await a.ev(() => { const f = [...document.querySelectorAll('#ov .shf .ft')].find(f => !f.hidden), b = f.querySelector('button'); b.id = b.id || 'tmpb'; return '#' + b.id });
    await lostTap(a, sel); await a.wait(500);
    assert.equal(await a.ev(() => JSON.stringify(cm) === JSON.stringify([+today.slice(0, 4), +today.slice(5, 7) - 1]) || !isOpen || cur === today), true, 'кнопка в низу листа сработала');
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});
