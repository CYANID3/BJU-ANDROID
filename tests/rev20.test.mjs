// Ревизия 20: чужие строки (из файла, от телефона при обмене, введённые вручную) не выполняются как разметка:
// названия продуктов, блюд, единиц, записей дня, имя профиля и имя собеседника выводятся как текст на всех экранах.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const P = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
const DB = [[P, 10, 5, 20, [[P, 50]]], ['Рис ' + P, 7, 1, 78], [P + ' блюдо', 9, 6, 18, [[P, 300]], { w: 300, i: [{ n: P, g: 100, p: 7, f: 1, c: 78 }] }]];
const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 0, n: P, g: 60, p: 7, f: 3, c: 36 }], [day(-1)]: [{ m: 1, n: P, g: 10, p: 1, f: 1, c: 1 }] }, db: DB, set: { pf: { n: P, c: '#6458dc' }, xi: 1, wt: 'on' } };

test('строки с разметкой выводятся как текст: день, продукты, продукт, блюдо, календарь, статистика, настройки, профиль, обмен, объединение', async () => {
  const a = await openApp({ data: DATA });
  const steps = ['', 'mng()', 'mng();pc(0)', 'mng();pc(2)', 'cal()', 'stats()', 'sets()', 'pfOpen()', 'fabDo()', 'op(0)'];
  for (const s of steps) { await a.ev(x => { try { cl() } catch (e) { } if (x) eval(x); return 0 }, s); await a.wait(500) }
  // обмен: имя собеседника и его продукты приходят от другого телефона
  await a.ev(() => {
    window.__L = {}; window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: { available: true, state: () => Promise.resolve({ perm: 'granted', bt: true, btExists: true, loc: true, coarse: true, fine: true, sdk: 34, model: 'X' }),
      requestPerms: () => Promise.resolve({ granted: true }), start: () => Promise.resolve(), stop: () => Promise.resolve(), pause: () => Promise.resolve(), connect: () => Promise.resolve(), send: () => Promise.resolve(),
      on: (e, f) => { (__L[e] = __L[e] || []).push(f) } } }); cl(); xOpen(); return 0 });
  await a.wait(400);
  const peer = `1|${P}|#6458dc|${P}|2|0`;
  await a.ev(n => { (__L.found || []).forEach(f => f({ id: 'e1', name: n })); return 0 }, peer); await a.wait(300);
  assert.equal(await a.ev(() => X.found.size), 1);
  await a.ev(n => { (__L.initiated || []).forEach(f => f({ id: 'e1', name: n, code: '1234' })); return 0 }, peer); await a.wait(300);
  // экран объединения с полученными продуктами
  await a.ev(n => { X.peer = xPeer('e1', n); X.s = 'go'; X.out = [1, 1]; X.meReady = { p: 1, d: 0 };
    X.data = [[n, 1, 2, 3], ['Новый ' + n, 4, 5, 6]]; xCheck(); return 0 }, P);
  await a.wait(500);
  assert.match(await a.pg.textContent('#v12'), /<img src=x/, 'название показано текстом');
  const r = await a.ev(() => ({ xss: window.__xss || 0, img: document.querySelectorAll('img[src="x"]').length }));
  assert.deepEqual(r, { xss: 0, img: 0 }, 'разметка из данных не попала в страницу');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('файл данных с пробелами в конце (запись без обрезки на части провайдеров дополняется пробелами) читается целиком', async () => {
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 0, n: 'Овсянка', g: 60, p: 7, f: 3, c: 36 }] }, db: [['Рис', 7, 1, 78]] } });
  const r = await a.ev(() => { const t = ser(), d = parseData(t + ' '.repeat(5000)); return [d.db.length, Object.keys(d.d).length, d.g.p] });
  assert.deepEqual(r, [1, 1, 140]);
  await a.close();
});
