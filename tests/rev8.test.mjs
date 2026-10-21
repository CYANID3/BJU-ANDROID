// Ревизия 8: тему можно переключать быстро подряд; подпись «Файл данных» на месте; анимации короче и без провала
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

test('тема: второе нажатие сразу после первого (через 30 мс) доходит до строки и срабатывает', async () => {
  const a = await openApp();
  await a.ev(() => { sets(); pick('th') }); await a.wait(600);
  const pts = await a.ev(() => [...document.querySelectorAll('#pko .row')].map(r => { const b = r.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2] }));
  await a.ev(() => { window.__c = []; document.addEventListener('click', e => __c.push(e.target.closest('.row') ? 'row' : e.target.tagName), true) });
  // касания по координатам, без ожидания (как палец): раньше во время смены кадра второе уходило «в никуда»
  await a.pg.touchscreen.tap(...pts[1]); await a.wait(30); await a.pg.touchscreen.tap(...pts[2]); await a.wait(400);
  assert.deepEqual(await a.ev(() => [__c, S.set.th]), [['row', 'row'], 'dark']);
  assert.equal(await a.ev(() => document.documentElement.classList.contains('thx')), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('строка «Файл данных»: состояние файла видно и при подключённом файле (зелёная подпись)', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(500);
  const r = await a.ev(() => { const sm = [...document.querySelectorAll('#v7 .row')].find(x => x.textContent.includes('Файл данных')).querySelector('small'); sm.className = 'ok'; return 0 }); await a.wait(400);
  const r2 = await a.ev(() => { const sm = [...document.querySelectorAll('#v7 .row')].find(x => x.textContent.includes('Файл данных')).querySelector('small'), cs = getComputedStyle(sm); return [cs.visibility, cs.opacity, cs.display] });
  assert.deepEqual(r2, ['visible', '1', 'block']);
  // галочка выбора в меню по-прежнему появляется только у выбранной строки
  await a.ev(() => pick('th')); await a.wait(500);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#pko .row > .ok')].map(x => getComputedStyle(x).visibility)), ['visible', 'hidden', 'hidden']);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('темп: переход листа целиком ≤ 0,3 с, новое содержимое проявляется без паузы после старого', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(500);
  const r = await a.ev(async () => { pick('th'); await Promise.resolve(); await Promise.resolve();
    const all = document.getAnimations().filter(x => x instanceof Animation && !(x instanceof CSSTransition) && !(x instanceof CSSAnimation)).map(x => { const t = x.effect.getComputedTiming(); return [t.delay || 0, t.endTime] });
    const L = [document.querySelector('#ov > .svl'), ...document.querySelectorAll('#ov > .svl .svl')].flatMap(e => e.getAnimations()).filter(x => x.effect.getKeyframes().some(k => k.opacity != null)).map(x => x.effect.getComputedTiming().endTime);
    const v = $('v13').getAnimations().filter(x => x.effect.getKeyframes().some(k => k.opacity != null)).length, sh = shEl().querySelectorAll('.hd, .shf').length && [...shEl().querySelectorAll('.hd, .hd *, .shf')].reduce((n, e) => n + e.getAnimations().filter(x => !(x instanceof CSSTransition) && x.effect.getKeyframes().some(k => k.opacity != null)).length, 0);
    const Lbg = [...document.querySelectorAll('#ov .svl')].map(e => getComputedStyle(e).backgroundColor).find(c => c !== 'rgba(0, 0, 0, 0)') || 'rgba(0, 0, 0, 0)';
    return { end: Math.max(...all.map(x => x[1])), oldEnd: Math.max(...L), v, sh, Lbg } });
  assert.ok(r.end <= 300, `весь переход ${r.end} мс`); assert.ok(r.oldEnd <= 120, 'старое гаснет быстро');
  assert.equal(r.v + r.sh, 0, 'новый экран сразу виден целиком: ничто не делает его прозрачным'); assert.notEqual(r.Lbg, 'rgba(0, 0, 0, 0)', 'копия старого непрозрачна — текст двух экранов не смешивается');
  assert.deepEqual(a.errors, []);
  await a.close();
});
