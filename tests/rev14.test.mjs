// Ревизия 14: лист (модальное окно) не пропадает после смахивания вниз и быстрого повторного открытия
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [entry(0, 'Овсянка', 60, 12, 6, 60), entry(1, 'Банан', 120, 1.5, .2, 21.8), entry(2, 'Гречка', 80, 12.6, 3.3, 57)] } };

// смахнуть открытый лист вниз настоящими касаниями (за «ручку» вверху листа)
async function swipeDown(a) {
  const cdp = await a.pg.context().newCDPSession(a.pg);
  const r = await a.ev(() => { const b = shEl().getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 8 } });
  const T = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: r.x, y, id: 1 }] });
  await T('touchStart', r.y);
  for (let i = 1; i <= 8; i++) { await new Promise(res => setTimeout(res, 16)); await T('touchMove', r.y + i * 30) }
  await T('touchEnd', r.y + 240);
}
const sheetVisible = a => a.ev(() => { const s = shEl(), b = s.getBoundingClientRect(), cs = getComputedStyle(s);
  return { open: isOpen, on: $('ov').classList.contains('on'), inView: b.top < innerHeight - 40 && b.bottom > innerHeight - 4, inline: s.style.transform, cv: getComputedStyle($('ov')).contentVisibility, op: cs.opacity } });

test('смахнул лист вниз и сразу открыл другой — лист виден (раньше оставалось одно затемнение до перезапуска)', async () => {
  const a = await openApp({ data: DATA });
  for (const reopen of [() => cal(), () => mng(), () => stats(), () => sets()]) {
    await a.ev(() => cal()); await a.wait(450);
    await swipeDown(a); await a.wait(40);
    assert.equal(await a.ev(() => isOpen), false, 'смахивание закрыло лист');
    await a.ev(reopen); await a.wait(700);
    const v = await sheetVisible(a);
    assert.deepEqual(v, { open: true, on: true, inView: true, inline: '', cv: 'visible', op: '1' }, 'лист на экране, без застрявшего сдвига');
    // и дальше всё работает: закрыть и открыть ещё раз
    await a.ev(() => closeUI()); await a.wait(500); await a.ev(() => goals()); await a.wait(600);
    assert.equal((await sheetVisible(a)).inView, true);
    await a.ev(() => closeUI()); await a.wait(500);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('палец увёл лист вниз, но касание оборвалось (приложение свернули) — при следующем открытии лист на месте', async () => {
  const a = await openApp({ data: DATA });
  await a.ev(() => cal()); await a.wait(450);
  const cdp = await a.pg.context().newCDPSession(a.pg);
  const r = await a.ev(() => { const b = shEl().getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 8 } });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y, id: 1 }] });
  for (let i = 1; i <= 5; i++) { await new Promise(res => setTimeout(res, 16)); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x, y: r.y + i * 20, id: 1 }] }) }
  // касание так и не закончилось: система свернула приложение, лист закрыт кнопкой «Назад»
  await a.ev(() => { document.dispatchEvent(new Event('visibilitychange')); closeUI() }); await a.wait(450);
  await a.ev(() => mng()); await a.wait(600);
  const v = await sheetVisible(a);
  assert.equal(v.inView, true); assert.equal(v.inline, '');
  assert.deepEqual(a.errors, []);
  await a.close();
});
