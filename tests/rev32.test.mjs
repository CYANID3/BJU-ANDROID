// Ревизия 32: «Нужно точное местоположение» — мини-окно Android с тем, что выбрать; подробности свёрнуты
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const FAKE = (st) => {
  const S0 = Object.assign({ perm: 'granted', bt: true, btExists: true, wifi: true, loc: true, model: 'Pixel 8' }, st.s);
  window.__x = { calls: [], st: S0 };
  const c = (k, r) => (...a) => { __x.calls.push(k); return Promise.resolve(typeof r === 'function' ? r() : r) };
  window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: { available: true, state: c('state', () => __x.st), requestPerms: c('requestPerms', () => ({ granted: __x.st.perm === 'granted' })),
    requestPrecise: c('requestPrecise', () => { if (__x.onPrecise) Object.assign(__x.st, __x.onPrecise); return {} }), openLocation: c('openLocation'), openSettings: c('openSettings'),
    start: (...a) => { __x.calls.push('start'); return __x.st.fail ? Promise.reject(Object.assign(new Error('x'), { code: __x.st.fail })) : Promise.resolve() }, stop: c('stop'), pause: c('pause'), on: () => { } } });
};
const PF = { g: { p: 140, f: 70, c: 230 }, d: {}, db: [], set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } };

for (const [name, st, want, btn] of [
  ['нет доступа', { sdk: 37, coarse: false, fine: false, nearby: true, code: '8034' }, /В окне Android выберите.*местоположению устройства\?.*Точно.*При использовании приложения.*Не разрешать/s, 'Разрешить'],
  ['«Приблизительно»', { sdk: 37, coarse: true, fine: false, nearby: true, code: '8036' }, /Сейчас разрешено «Приблизительно».*В окне Android нажмите.*точному местоположению\?.*Изменить на точное/s, 'Разрешить точное'],
]) test(`местоположение (${name}): мини-окно Android, подробности свёрнуты, кнопка «${btn}»`, async () => {
  const a = await openApp({ data: PF });
  await a.ev(FAKE, { s: st });
  await a.ev(c => { BJU_NATIVE.exchange.start = () => __x.st.fine ? Promise.resolve() : Promise.reject(Object.assign(new Error(c + ': MISSING_PERMISSION'), { code: c })); return 0 }, st.code);
  await a.ev(() => { xOpen(); return 0 }); await a.wait(500);
  const t = await a.pg.textContent('#v19');
  assert.match(t, /Нужно точное местоположение/); assert.match(t, want);
  assert.equal(await a.ev(() => document.querySelector('#v19 .xdt').open), false, 'подробности свёрнуты');
  assert.equal(await a.ev(() => document.querySelector('#v19 .xdt .xn').checkVisibility()), false);
  await a.pg.click('#v19 .xdt summary'); await a.wait(200);
  assert.equal(await a.ev(() => document.querySelector('#v19 .xdt').open && document.querySelector('#v19 .xdt .xn').checkVisibility()), true, 'раскрываются касанием');
  assert.equal(await a.ev(() => $('x1').textContent), btn);
  assert.deepEqual(a.errors, []);
  await a.close();
});
