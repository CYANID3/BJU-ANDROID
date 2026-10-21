// Ревизия 18: файл с настройками из другой версии (или правленый вручную) — «Настройки» не пустые, экраны открываются без ошибок
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';
test('настройки из файла с неожиданными значениями: «Настройки» и все экраны выбора открываются (200 случайных наборов)', async () => {
  const a = await openApp();
  const r = await a.ev(() => {
    const bad = []; const vals = [null, 0, 1, -5, '', 'x', 'system', 'on', 'off', 'hidden', true, false, [], [1, 2], {}, { n: 5 }, { s: 'a' }, { s: [1, 'zz'], n: 9, big: 'yes' }, { n: '', c: 'red' }, 'light', 'dark', 'auto'];
    const names = Object.values(STM).map(x => x[0]); let seed = 3; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    for (let i = 0; i < 200; i++) {
      const st = {}; names.forEach(nm => { if (rnd(3)) st[nm] = vals[rnd(vals.length)] });
      let D; try { D = parseData(JSON.stringify({ format: 'bju-diary', version: 3, settings: st })) } catch (e) { continue }
      S.set = D.set;
      for (const f of ['sets()', 'lookOpen()', 'navOpen()', 'navPick(-1)', 'pfOpen()', "pick('sw')", "pick('dw')", "pick('dc')", "pick('sn')", "pick('nb')", "pick('ac')", "pick('sl')", 'vibOpen()', 'render()', 'barSync()']) {
        try { eval(f); svKill() } catch (e) { bad.push(f + ': ' + e.message + ' ' + JSON.stringify(st)); break }
      }
      try { sets(); if ($('v7').querySelectorAll('.row').length < 10) bad.push('пусто ' + JSON.stringify(st)) } catch (e) { bad.push('sets: ' + e.message + ' ' + JSON.stringify(st)) }
      if (bad.length > 4) break;
    }
    return bad });
  assert.deepEqual(r, []);
  await a.close();
});

// имитация связи (как в rev17): геолокация выключена; поиск отклонён с кодом 8034 (Google требует местоположение)
const FAKE = (st) => {
  const S0 = Object.assign({ perm: 'granted', bt: true, btExists: true, wifi: true, loc: true, model: 'Pixel 8' }, st || {});
  window.__x = { calls: [] }; const c = (k, r) => (...a) => { __x.calls.push(k); return Promise.resolve(r) };
  window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: { available: true, state: c('state', S0), requestPerms: c('requestPerms', { granted: true }), openLocation: c('openLocation'), openSettings: c('openSettings'),
    start: S0.fail ? (...a) => { __x.calls.push('start'); return Promise.reject(Object.assign(new Error('x'), { code: S0.fail })) } : c('start'), stop: c('stop'), pause: c('pause'), on: () => { } } });
};
test('обмен: геолокация выключена или поиск отклонён с кодом 8034 — экран «Включите геолокацию», кнопка открывает её настройки', async () => {
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } } });
  await a.ev(FAKE, { loc: false }); await a.ev(() => xOpen()); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Включите геолокацию/); assert.equal(await a.ev(() => __x.calls.includes('start')), false, 'поиск не начинали');
  await a.pg.click('#x1'); assert.equal(await a.ev(() => __x.calls.includes('openLocation')), true);
  await a.ev(FAKE, { fail: '8034' }); await a.ev(() => xOpen()); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Включите геолокацию/);
  await a.ev(FAKE); await a.pg.click('#x2'); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/, '«Ещё раз» — поиск пошёл');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен: 8034 при «Приблизительно» — экран «Нужно точное местоположение», запрос точного, подробности; при всех разрешениях — совет про Сервисы Google Play', async () => {
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } } });
  await a.ev(FAKE, { fail: '8034', coarse: true, fine: false, nearby: true, sdk: 34, gms: '24.40.33' });
  await a.ev(() => { __x.fine = 0; BJU_NATIVE.exchange.requestPrecise = () => { __x.calls.push('requestPrecise'); return Promise.resolve({}) } });
  await a.ev(() => xOpen()); await a.wait(400);
  const t = await a.pg.textContent('#v19');
  assert.match(t, /Нужно точное местоположение/); assert.match(t, /Код 8034/); assert.match(t, /приблизительное/); assert.match(t, /24\.40\.33/);
  assert.equal(await a.pg.textContent('#x1'), 'Разрешить точное');
  await a.pg.click('#x1'); await a.wait(300);
  assert.equal(await a.ev(() => __x.calls.includes('requestPrecise')), true);
  // пользователь не дал точное (окно не показалось) — путь через настройки
  assert.equal(await a.pg.textContent('#x1'), 'Открыть настройки'); assert.match(await a.pg.textContent('#v19'), /Точное местоположение/);
  await a.pg.click('#x1'); assert.equal(await a.ev(() => __x.calls.includes('openSettings')), true);
  // всё разрешено и геолокация включена, но 8034 — не «включите геолокацию», а подсказка про Сервисы Google Play
  await a.ev(FAKE, { fail: '8034', coarse: true, fine: true, nearby: true, sdk: 34 }); await a.ev(() => { xStop(); xGo() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Сервисы Google Play не дают начать поиск/);
  // точное получено — поиск начинается
  await a.ev(FAKE, { coarse: true, fine: true, sdk: 34 }); await a.pg.click('#x1'); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен: экран не бывает пустым — пока идёт проверка «Проверяем…», повторный запуск отменяет предыдущий, сбой отрисовки даёт «Ещё раз»', async () => {
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } } });
  // состояние «зависает» (как при системном окне разрешений)
  await a.ev(() => { window.__rs = []; window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: { available: true, state: () => new Promise(r => __rs.push(r)), requestPerms: () => Promise.resolve({ granted: true }), start: () => Promise.resolve(), stop: () => Promise.resolve(), pause: () => Promise.resolve(), openSettings: () => Promise.resolve(), on: () => { } } }) });
  await a.ev(() => { xOpen() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Проверяем/);
  // вернулись в приложение — второй запуск; первый (устаревший) ответ ничего не меняет
  await a.ev(() => { xGo() }); await a.wait(100);
  await a.ev(() => __rs[1]({ perm: 'granted', bt: true, btExists: true, loc: true, coarse: true, fine: true, sdk: 34 })); await a.wait(300);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  await a.ev(() => __rs[0]({ perm: 'denied', bt: false, btExists: true })); await a.wait(300);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/, 'устаревший ответ проигнорирован');
  // неизвестное состояние — не пустой экран
  await a.ev(() => { X.s = 'нечто'; xDraw() }); await a.wait(300);
  assert.match(await a.pg.textContent('#v19'), /Не получилось/); assert.equal(await a.ev(() => !document.getElementById('x1').hidden), true);
  assert.deepEqual(a.errors, []);
  await a.close();
});
