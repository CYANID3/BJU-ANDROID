// Ревизия 7: тема без скачка подписи, вкладки и месяцы одним движением, шапка листа не остаётся пустой, листание дней легче
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const dish = (n, k) => [n, 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6 * k, f: .2, c: 5 }] }];
const G = { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, db: [dish('Салат', 1), dish('Омлет', 2), ['Творог 5%', 17, 5, 1.8], ['Рис', 7, 1, 74], ['Гречка', 12, 3, 62]] };

test('«Тема»: выбор варианта не меняет высоту строк (галочка всегда занимает место)', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => { sets(); pick('th') }); await a.wait(600);
  const m = () => a.ev(() => [...document.querySelectorAll('#pko .row')].map(r => Math.round(r.getBoundingClientRect().height)).join() + '|' + Math.round(shEl().getBoundingClientRect().top));
  const before = await m();
  for (const v of ['light', 'dark', 'auto']) { await a.ev(v => { document.documentElement.classList.add('notr'); PK.th.set(v) }, v); await a.wait(450); assert.equal(await m(), before, `после «${v}» строки и лист на месте`) }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('вкладки продуктов: касание и взмах — одно движение без пустого кадра; копия без id и убирается', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => mng()); await a.wait(500);
  const r = await a.ev(async () => {
    setPf(2); const box = document.querySelector('#ov > .hsg'), during = { ghost: !!box, rows: box ? box.querySelectorAll('.pk').length : 0, ids: box ? box.querySelectorAll('[id]').length : -1, newRows: $('ls').querySelectorAll('.pk').length, anim: $('ls').getAnimations().length };
    await new Promise(r => setTimeout(r, 500)); return { during, left: document.querySelectorAll('#ov > .hsg').length, pFl };
  });
  assert.ok(r.during.ghost && r.during.rows === 5, 'старый список гаснет копией'); assert.equal(r.during.ids, 0);
  assert.equal(r.during.newRows, 2, 'новый список уже на месте'); assert.ok(r.during.anim >= 1, 'и въезжает');
  assert.equal(r.left, 0); assert.equal(r.pFl, 2);
  assert.equal(await a.ev(() => { setPf(2); return document.querySelectorAll('#ov > .hsg').length }), 0, 'та же вкладка — ничего не происходит');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('календарь: месяц меняется одним движением, подпись под сеткой не заезжает на кнопку «Сегодня»', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => cal()); await a.wait(500);
  const m0 = await a.ev(() => JSON.stringify(cm));
  const r = await a.ev(() => { mv(1); const f = shEl().querySelector('.shf'), cs = getComputedStyle(f); return { ghost: !!document.querySelector('#ov > .hsg'), z: cs.zIndex, pos: cs.position, bg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' } });
  assert.ok(r.ghost, 'старый месяц гаснет копией'); assert.deepEqual([r.z, r.pos, r.bg], ['1', 'relative', true], 'низ листа поверх едущего содержимого');
  await a.wait(500); assert.notEqual(await a.ev(() => JSON.stringify(cm)), m0);
  assert.equal(await a.ev(() => document.querySelectorAll('#ov > .hsg').length), 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('шапка листа не остаётся пустой: прерванный переход доводится до конца, в фоне переходов нет', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => { sets() }); await a.wait(500);
  const r = await a.ev(async () => {
    fp(1); await Promise.resolve(); await Promise.resolve();
    const hd = document.querySelector('#ov .hd'), was = hd.getAnimations().length;
    document.getAnimations().forEach(x => x.pause()); svKill();
    return { was, op: getComputedStyle(hd).opacity, left: document.querySelectorAll('#ov > .svl').length };
  });
  assert.ok(r.was >= 1, 'шапка проявлялась'); assert.equal(r.op, '1', 'после прерывания шапка видна'); assert.equal(r.left, 0);
  // страница скрыта (системное окно выбора файла) — экран меняется сразу, без анимаций
  const h = await a.ev(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); backStep(); const n = document.querySelector('#ov .hd').getAnimations().length + document.querySelectorAll('#ov > .svl').length; delete document.hidden; return n });
  assert.equal(h, 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('листание дней: шапка с датой — без лишней работы; сегменты листа не пересчитываются, пока он закрыт', async () => {
  const a = await openApp({ data: G });
  const r = await a.ev(async () => {
    let n = 0; const f = window.segSync; window.segSync = () => { n++; f() };
    for (let i = 0; i < 3; i++) { go(-1); await new Promise(r => setTimeout(r, 600)) }
    const t = performance.now(); for (let i = 0; i < 200; i++) head(shiftDay(today, -i)); const ms = performance.now() - t;
    return { n, ms, txt: $('dt').textContent };
  });
  assert.equal(r.n, 0, 'segSync не вызывается при листании дней'); assert.ok(r.ms < 200, `200 шапок за ${Math.round(r.ms)} мс`);
  assert.match(r.txt, /^[А-Я][а-я]+, \d+ [а-я]+/);
  assert.deepEqual(a.errors, []);
  await a.close();
});
