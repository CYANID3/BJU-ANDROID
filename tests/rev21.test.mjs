// Ревизия 21: переход между текстовым полем (системная клавиатура) и числовым (своя клавиатура) — содержимое листа
// стоит на месте. Клавиатура Android имитируется так же, как её передаёт BjuNativePlugin: кадры анимации («live»)
// и конец («end»), значения — в CSS-переменную --kb (как applyInsets в capacitor-bridge.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [] }, db: [['Творог 1%', 18, 1, 1.3, [['Пачка', 180], ['Пакетик', 350]]]] };

// кадры клавиатуры: от h0 до h1 за n кадров, между кадрами — отрисовка; возвращает положение кнопки «Сохранить» в каждом кадре
async function kbAnim(a, h0, h1, n = 12) {
  return a.ev(async ([h0, h1, n]) => {
    const r = document.documentElement.style, put = (h, mode) => { r.setProperty('--kbd', '0ms'); const k = window.BJU_kbFilter ? window.BJU_kbFilter(h, mode) : h; r.setProperty('--kb', k + 'px'); window.BJU_onKeyboard(h, mode === 'live' ? -1 : 0) };
    const top = () => Math.round($('mkb').getBoundingClientRect().top), out = [top()];
    for (let i = 1; i <= n; i++) { put(Math.round(h0 + (h1 - h0) * (1 - Math.pow(1 - i / n, 2))), i === n ? 'end' : 'live'); await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f))); out.push(top()) }
    return out
  }, [h0, h1, n]);
}
const spread = v => Math.max(...v) - Math.min(...v);

test('название ↔ число в форме продукта: системная и своя клавиатуры сменяют друг друга без скачка листа', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(() => { mng(); pc(0); return 0 }); await a.wait(700);
  // своя клавиатура: её высота над системной полосой
  await a.ev(() => { $('np').focus(); return 0 }); await a.wait(400);
  const K = await a.ev(() => parseFloat(shEl().style.getPropertyValue('--kph')) || 0);
  assert.ok(K > 150, 'высота своей клавиатуры известна листу: ' + K);
  const H = Math.round(K + 24); // системная клавиатура обычно чуть выше своей
  // число → название: системная поднимается поверх своей
  await a.ev(() => { $('nn').focus(); return 0 });
  const up = await kbAnim(a, 0, H); await a.wait(100);
  assert.equal(await a.ev(() => shEl().classList.contains('kpo')), false, 'своя ушла, когда системная поднялась');
  console.log('up', up.join(','));
  assert.ok(spread(up) <= 30, 'кнопка «Сохранить» почти не двигается: ' + up.join(','));
  // название → число: системная уезжает, своя уже на месте под ней
  await a.ev(() => { $('np').focus(); return 0 });
  const down = await kbAnim(a, H, 0); await a.wait(100);
  assert.equal(await a.ev(() => shEl().classList.contains('kpo')), true);
  console.log('down', down.join(','));
  assert.ok(spread(down) <= 30, 'кнопка «Сохранить» почти не двигается: ' + down.join(','));
  // без клавиатур вообще (закрыли поле) — лист опускается как прежде
  assert.match(await a.ev(() => getComputedStyle(shEl()).translate), /^(none|0px)$/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('только системная клавиатура (поиск): лист поднимается на всю её высоту, как раньше', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(() => { mng(); return 0 }); await a.wait(600);
  await a.ev(() => { $('q').focus(); return 0 });
  await a.ev(() => { const r = document.documentElement.style; r.setProperty('--kbd', '0ms'); r.setProperty('--kb', '300px'); window.BJU_onKeyboard(300, 0); return 0 }); await a.wait(100);
  assert.equal(await a.ev(() => getComputedStyle(shEl()).translate), '0px -300px');
  assert.deepEqual(a.errors, []);
  await a.close();
});
