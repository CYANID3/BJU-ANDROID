// Ревизия 19: темы — смена системной темы без перезапуска (в браузере и по сигналу Android), сохранение после перезапуска,
// обмен — разрешения по версии Android (Android 12: точное местоположение; 12L+: местоположение только после отказа 8034)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const bg = a => a.ev(() => [getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), document.querySelector('meta[name="theme-color"]').content]);
const lum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) + (n >> 8 & 255) + (n & 255)) / 3 };

test('тема «Как в системе»: смена темы телефона применяется сразу (фон, строка состояния), выбранная вручную — не меняется', async () => {
  const a = await openApp({ scheme: 'light', data: { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: {} } });
  let [b, m] = await bg(a); assert.ok(lum(b) > 128, 'светлая'); assert.equal(m, b, 'цвет строки состояния = фон');
  await a.pg.emulateMedia({ colorScheme: 'dark' }); await a.wait(300);
  [b, m] = await bg(a); assert.ok(lum(b) < 128, 'стала тёмной без перезапуска'); assert.equal(m, b);
  // сигнал от Android (WebView мог не заметить смену темы): в режиме «Как в системе» побеждает он
  await a.ev(() => { window.BJU_SYSDARK = false; window.BJU_onSysTheme(false) }); await a.wait(200);
  [b, m] = await bg(a); assert.ok(lum(b) > 128, 'Android сообщил «светлая»'); assert.equal(m, b);
  assert.equal(await a.ev(() => document.documentElement.dataset.theme), 'light');
  // выбранная вручную тема сигнал не трогает
  await a.ev(() => setTh('dark')); await a.wait(500);
  await a.ev(() => { window.BJU_SYSDARK = false; window.BJU_onSysTheme(false) }); await a.wait(200);
  [b] = await bg(a); assert.ok(lum(b) < 128, 'ручная тёмная осталась');
  // снова «как в системе» — берётся последнее, что сообщил Android
  await a.ev(() => setTh('auto')); await a.wait(500);
  [b] = await bg(a); assert.ok(lum(b) > 128);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('тема сохраняется после перезапуска; до запуска скрипта строка состояния — цвет фона темы, а не акцент', async () => {
  const a = await openApp({ scheme: 'dark', data: { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: {} } });
  await a.ev(() => { S.set = Object.assign({}, S.set, { ac: '#e0457b' }); setTh('light') }); await a.wait(600);
  await a.ev(() => store());
  // разметка до запуска приложения: что ставит ранний скрипт
  const early = await a.ev(() => JSON.parse(localStorage.getItem('bju2')).set.th);
  assert.equal(early, 'light');
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(300);
  assert.equal(await a.ev(() => document.documentElement.dataset.theme), 'light');
  const [b, m] = await bg(a); assert.ok(lum(b) > 128); assert.equal(m, b);
  // ранний скрипт: на светлой теме цвет строки состояния — светлый фон, не розовый акцент
  const html = await (await a.pg.request.get(a.pg.url())).text();
  assert.match(html, /content=d\?"#10141c":"#eef1f5"/);
  assert.doesNotMatch(html, /theme-color"\]'\)\.content=s\.ac/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

const FAKE = (st) => {
  const S0 = Object.assign({ perm: 'granted', bt: true, btExists: true, wifi: true, loc: true, model: 'Pixel 8' }, st.s);
  window.__x = { calls: [], st: S0 };
  const c = (k, r) => (...a) => { __x.calls.push(k); return Promise.resolve(typeof r === 'function' ? r() : r) };
  window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: { available: true, state: c('state', () => __x.st), requestPerms: c('requestPerms', () => ({ granted: __x.st.perm === 'granted' })),
    requestPrecise: c('requestPrecise', () => { if (__x.onPrecise) Object.assign(__x.st, __x.onPrecise); return {} }), openLocation: c('openLocation'), openSettings: c('openSettings'),
    start: (...a) => { __x.calls.push('start'); return __x.st.fail ? Promise.reject(Object.assign(new Error('x'), { code: __x.st.fail })) : Promise.resolve() }, stop: c('stop'), pause: c('pause'), on: () => { } } });
};
const PF = { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } };

test('обмен, Android 12 (API 31): выбрано «Приблизительно» — объясняем и просим точное, после «Точно» поиск начинается', async () => {
  const a = await openApp({ data: PF });
  await a.ev(FAKE, { s: { sdk: 31, perm: 'prompt', coarse: true, fine: false, nearby: true } });
  await a.ev(() => { xOpen() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Нужно точное местоположение/);
  assert.match(await a.pg.textContent('#v19'), /координаты не получает/);
  assert.equal(await a.ev(() => __x.calls.includes('start')), false, 'поиск без точного не начинаем — он упал бы с 8034');
  await a.ev(() => { __x.onPrecise = { perm: 'granted', fine: true } }); await a.pg.click('#x1'); await a.wait(400);
  assert.equal(await a.ev(() => __x.calls.includes('requestPrecise')), true);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен, Android 13+ (API 34): местоположение не спрашиваем и выключенная геолокация поиск не блокирует; при 8034 — просим доступ отдельно', async () => {
  const a = await openApp({ data: PF });
  await a.ev(FAKE, { s: { sdk: 34, loc: false, coarse: false, fine: false, nearby: true } });
  await a.ev(() => { xOpen() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/, 'без местоположения поиск идёт');
  // Сервисы Google Play всё же отказали (8034) при включённой геолокации — нужен доступ к местоположению
  await a.ev(() => { Object.assign(__x.st, { loc: true, fail: '8034' }); xStop(); xGo() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Нужен доступ к местоположению/);
  assert.equal(await a.pg.textContent('#x1'), 'Разрешить');
  // дали приблизительное — пробуем снова; Google снова отказал — путь в настройки, без бесконечных окон
  await a.ev(() => { __x.onPrecise = { coarse: true } }); await a.pg.click('#x1'); await a.wait(500);
  assert.match(await a.pg.textContent('#v19'), /Нужно точное местоположение/);
  assert.equal(await a.pg.textContent('#x1'), 'Открыть настройки');
  // 8034 при выключенной геолокации — экран «Включите геолокацию»
  await a.ev(() => { Object.assign(__x.st, { loc: false }); xOpen() }); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Включите геолокацию/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен: 8036 (MISSING_PERMISSION_ACCESS_FINE_LOCATION, Android 17 с «Приблизительно») — экран «Нужно точное местоположение», не общая ошибка', async () => {
  const a = await openApp({ data: PF });
  await a.ev(FAKE, { s: { sdk: 37, coarse: true, fine: false, nearby: true, gms: '26.40.32' } });
  await a.ev(() => { BJU_NATIVE.exchange.start = () => __x.st.fine ? Promise.resolve() : Promise.reject(Object.assign(new Error('8036: MISSING_PERMISSION_ACCESS_FINE_LOCATION'), { code: '8036' })) });
  await a.ev(() => { xOpen() }); await a.wait(400);
  const t = await a.pg.textContent('#v19');
  assert.match(t, /Нужно точное местоположение/); assert.match(t, /Код 8036 \(MISSING_PERMISSION_ACCESS_FINE_LOCATION\)/);
  assert.equal(await a.pg.textContent('#x1'), 'Разрешить точное');
  await a.ev(() => { __x.onPrecise = { fine: true } }); await a.pg.click('#x1'); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  assert.deepEqual(a.errors, []);
  await a.close();
});
