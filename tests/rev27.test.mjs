// Ревизия 27: аудит — свайп по вкладкам картинки профиля, повторные нажатия, устойчивость листов
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

test('профиль: взмах влево/вправо переключает «Буква · Значки · Цветные», за краями — не переключает; поле имени не мешает', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: {}, set: { pf: { n: 'Данил', c: '#0d7f70' } } } });
  await a.ev(() => { pfOpen(); return 0 }); await a.wait(700);
  const k = () => a.ev(() => pfDraft.k + '|' + document.querySelector('#pft .on').textContent);
  assert.equal(await k(), 'l|Буква');
  const y = await a.ev(() => { const r = $('pfw').getBoundingClientRect(); return Math.round(r.top + 30) });
  await a.drag(330, y, 90, y + 6); await a.wait(600);
  assert.equal(await k(), 'w|Значки');
  const y2 = await a.ev(() => { const r = $('pfw').getBoundingClientRect(); return Math.round(r.top + 60) });
  await a.drag(330, y2, 90, y2 + 6); await a.wait(600);
  assert.equal(await k(), 'c|Цветные');
  await a.drag(330, y2, 90, y2 + 6); await a.wait(600);
  assert.equal(await k(), 'c|Цветные', 'дальше «Цветных» вкладок нет');
  await a.drag(80, y2, 330, y2 + 6); await a.wait(600);
  assert.equal(await k(), 'w|Значки');
  // взмах по полю имени — не переключает
  const yn = await a.ev(() => { const r = $('pfn').getBoundingClientRect(); return Math.round(r.top + r.height / 2) });
  await a.drag(330, yn, 120, yn); await a.wait(600);
  assert.equal(await k(), 'w|Значки');
  // ничего не осталось сдвинутым или полупрозрачным; лишних копий нет
  assert.deepEqual(await a.ev(() => [$('pfw').style.transform, $('pfw').style.opacity, document.querySelectorAll('#ov > .hsg').length]), ['', '', 0]);
  // касание вкладки работает как раньше, выбранная картинка сохраняется
  await a.pg.click('#pft button:nth-child(3)'); await a.wait(500);
  await a.ev(() => { pfIcon('fox'); pfSave(); return 0 }); await a.wait(400);
  assert.deepEqual(await a.ev(() => ({ k: S.set.pf.k, i: S.set.pf.i })), { k: 'c', i: 'fox' });
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('статистика: подсказка графика гаснет без ошибки, если месяц перелистнули или лист закрыли', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: { [new Date().toISOString().slice(0, 10)]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] } } });
  await a.ev(() => { stats(); return 0 }); await a.wait(700);
  for (const after of ['stMv(-1)', 'closeUI()']) {
    if (after === 'closeUI()') { await a.ev(() => { stats(); return 0 }); await a.wait(700) }
    await a.ev(() => { const w = $('ch1'), r = w.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + 20, pointerId: 1 }; w.dispatchEvent(new PointerEvent('pointerdown', o)); w.dispatchEvent(new PointerEvent('pointerup', o)); return 0 });
    await a.ev(f => { eval(f); return 0 }, after); await a.wait(1900);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('выбор файла: двойное касание не открывает второе системное окно', async () => {
  const a = await openApp({ native: true });
  const r = await a.ev(async () => { let n = 0; const f = BJU_NATIVE.file, c0 = f.create, o0 = f.open;
    f.create = async x => { n++; await new Promise(r => setTimeout(r, 300)); return c0(x) }; f.open = async () => { n++; await new Promise(r => setTimeout(r, 300)); throw Error('Отменено') };
    fp(); await Promise.all([fc2(), fc2(), nfOpen(), mgPick()]); const one = n; n = 0;
    await nfCreate(); MF && setMF(null); RS = { p: 1, g: 1, s: 1, del: 0 }; await Promise.all([rsGo(), rsGo()]); return [one, n] });
  assert.deepEqual(r, [1, 2], 'по одному окну на серию касаний; после ответа — снова можно');
  assert.deepEqual(a.errors, []);
  await a.close();
});
