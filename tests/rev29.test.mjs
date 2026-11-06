// Ревизия 29: аудит — мелкие цели касания: кружки цвета в профиле и выбор приёма пищи ловят касание и в промежутках;
// на узком экране кружки цвета — в два ряда, не мельче 36 px
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const gapHit = (sel) => { const b = [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width); const a = b[0].getBoundingClientRect(), c = b[1].getBoundingClientRect();
  const x = (a.right + c.left) / 2, y = (a.top + a.bottom) / 2, h = document.elementFromPoint(x, y); return [Math.round(c.left - a.right), !!h && h.matches(sel), h && (h.id || h.className || h.tagName), b.length] };

test('профиль: касание между кружками цвета попадает в кружок; на 320 px — два ряда по пять, ≥36 px', async () => {
  const a = await openApp({ data: { g: { p: 1, f: 1, c: 1 }, d: {}, set: { pf: { n: 'Тест', c: '#6458dc' } } } });
  await a.ev(() => { pfOpen(); return 0 }); await a.wait(800);
  await a.ev(() => { document.querySelector('.pfc').scrollIntoView({ block: 'center' }); return 0 }); await a.wait(200);
  const [gap, hit] = await a.ev(gapHit, '.pfc button'); assert.ok(gap > 0); assert.equal(hit, true);
  await a.pg.setViewportSize({ width: 320, height: 760 }); await a.wait(300);
  const r = await a.ev(() => { const b = [...document.querySelectorAll('.pfc button')].map(e => e.getBoundingClientRect()); return { w: Math.min(...b.map(x => x.width)), rows: new Set(b.map(x => Math.round(x.top))).size, over: Math.max(...b.map(x => x.right)) <= innerWidth } });
  assert.deepEqual([r.w >= 36, r.rows, r.over], [true, 2, true]);
  await a.close();
});

test('выбор приёма пищи: касание в промежутке между кнопками выбирает приём', async () => {
  const a = await openApp();
  await a.ev(() => { fabDo(); return 0 }); await a.wait(800);
  const R = await a.ev(gapHit, '#mc button'); assert.ok(R[0] > 0); assert.equal(R[1], true, 'попало в ' + R[2]);
  await a.close();
});
