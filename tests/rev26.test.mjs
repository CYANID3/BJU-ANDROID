// Ревизия 26: закрытый лист и диалог прячутся прозрачностью и inert, а не visibility — Android WebView после переустановки
// мог не передать унаследованную видимость содержимому листа (пустой лист, пока не сменишь тему).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const hiddenUp = () => { const out = []; for (const e of document.querySelectorAll('#ov, #ov *, #dg, #dg *')) if (getComputedStyle(e).visibility === 'hidden' && !(e.parentElement && getComputedStyle(e.parentElement).visibility === 'hidden')) out.push(e.id || e.className); return out };

test('лист: закрытый — прозрачный, не ловит касаний и фокус (inert), без visibility; открытый — всё видно', async () => {
  const a = await openApp({ native: true, empty: true });
  const st = () => a.ev(() => ({ inert: $('ov').inert, op: getComputedStyle($('ov')).opacity, vis: getComputedStyle($('ov')).visibility, hit: !!document.elementFromPoint(200, 700).closest('#ov') }));
  assert.deepEqual(await st(), { inert: true, op: '0', vis: 'visible', hit: false });
  for (const f of ['xOpen()', 'sets()', 'pfOpen()', 'op(0)', 'fp()']) {
    await a.ev(f => { eval(f); return 0 }, f); await a.wait(600);
    const r = await st(); assert.equal(r.inert, false, f); assert.equal(r.op, '1', f); assert.equal(r.hit, true, f);
    // в листе нет элементов, спрятанных унаследованной видимостью (своя visibility — только у галочек выбора)
    const hid = await a.ev(hiddenUp); assert.ok(hid.every(c => /\bok\b|\be\b/.test(c)), f + ': ' + hid.join());
    await a.ev(() => { closeUI(); return 0 }); await a.wait(400);
    assert.deepEqual(await st(), { inert: true, op: '0', vis: 'visible', hit: false });
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('диалог: закрытый — inert, открытый — доступен; кнопки работают', async () => {
  const a = await openApp();
  assert.equal(await a.ev(() => $('dg').inert), true);
  const p = a.ev(() => ask('Проверка?', 'Да')); await a.wait(300);
  assert.equal(await a.ev(() => $('dg').inert), false);
  await a.pg.click('#dgy'); assert.equal(await p, true);
  assert.equal(await a.ev(() => $('dg').inert), true);
  await a.close();
});
