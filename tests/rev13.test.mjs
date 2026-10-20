// Ревизия 13: перелистывание дней по скорости жеста; приёмы пищи — заметные заголовки со значками, перекус — вторичная категория
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [entry(0, 'Овсянка', 60, 12, 6, 60), entry(1, 'Банан', 120, 1.5, .2, 21.8), entry(2, 'Гречка', 80, 12.6, 3.3, 57), entry(2, 'Курица', 200, 23, 2, 0), entry(4, 'Творог', 250, 17, 5, 3)] } };

// свайп настоящими касаниями: dist px за ms мс; back — в конце палец идёт обратно
async function swipe(a, dist, ms, { steps = 6, back = 0 } = {}) {
  const cdp = await a.pg.context().newCDPSession(a.pg), y = 520, x0 = 300;
  const T = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await T('touchStart', x0); let x = x0;
  for (let i = 1; i <= steps; i++) { await new Promise(r => setTimeout(r, ms / steps)); x = x0 - dist * i / steps; await T('touchMove', x) }
  for (let i = 1; i <= 3 && back; i++) { x += (dist > 0 ? 1 : -1) * back / 3; await T('touchMove', x) }
  await T('touchEnd', x);
}
const daysFromToday = a => a.ev(() => { let n = 0, c = today; while (c !== cur && n < 30) { c = shiftDay(c, -1); n++ } return n });

test('перелистывание: решение по скорости жеста (длина свайпа «Средняя»)', async () => {
  const a = await openApp({ data: DATA });
  const c = (dx, v, dt) => a.ev(([dx, v, dt]) => dayCommit(dx, v, dt), [dx, v, dt]);
  assert.equal(await c(-30, -0.8, 500), true, 'короткий, но быстрый взмах — листает');
  assert.equal(await c(-30, -0.05, 600), false, 'короткий медленный сдвиг — нет');
  assert.equal(await c(-12, -1.2, 60), false, 'дрожание (до 18 px) — не жест даже при скорости');
  assert.equal(await c(-80, 0.8, 400), false, 'дотянул до порога, но в конце махнул обратно — передумал');
  assert.equal(await c(-80, -0.1, 400), true, 'дотянул до порога медленно — листает');
  assert.equal(await c(-30, -0.1, 150), true, 'короткий быстрый жест по времени — листает, как раньше');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('перелистывание настоящими касаниями: взмах листает, возврат пальца отменяет, день остаётся видимым', async () => {
  const a = await openApp({ data: DATA });
  await swipe(a, -90, 60, { steps: 3 }); await a.wait(600);
  assert.equal(await daysFromToday(a), 1, 'взмах');
  await swipe(a, -120, 400, { steps: 8, back: 40 }); await a.wait(600);
  assert.equal(await daysFromToday(a), 1, 'возврат пальца в конце жеста');
  assert.equal(await a.ev(() => [getComputedStyle($('app')).opacity, getComputedStyle($('app')).transform].join()), '1,none');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('перелистывание: быстрый взмах — короче уход и появление; серия взмахов не теряется', async () => {
  const a = await openApp({ data: DATA });
  await a.ev(() => { window.__d = []; const A = Element.prototype.animate; Element.prototype.animate = function (k, o) { if (this.id === 'app') __d.push(typeof o === 'number' ? o : o.duration); return A.call(this, k, o) } });
  await swipe(a, 110, 500, { steps: 12 }); await a.wait(600);
  const slow = await a.ev(() => __d.splice(0));
  await swipe(a, 110, 45, { steps: 3 }); await a.wait(600);
  const fast = await a.ev(() => __d.splice(0));
  assert.ok(fast[0] < slow[0], `уход: быстрый ${fast[0]} < медленного ${slow[0]}`);
  assert.ok(fast[1] < slow[1], `появление: быстрое ${fast[1]} < медленного ${slow[1]}`);
  assert.ok(slow[1] <= 230 && fast[1] >= 150);
  // 4 взмаха подряд, каждый — пока предыдущий день ещё появляется: ни один не теряется
  const before = await a.ev(() => cur);
  for (let i = 0; i < 4; i++) { await swipe(a, 80, 50, { steps: 3 }); await a.wait(70) }
  await a.wait(800);
  assert.equal(await a.ev(b => { let n = 0, c = b; while (c !== cur && n < 10) { c = shiftDay(c, 1); n++ } return n }, before), 4);
  assert.equal(await a.ev(() => $('app').getAnimations().length), 0, 'анимации закончились');
  assert.deepEqual(a.errors, []);
  await a.close();
});

for (const scheme of ['light', 'dark']) test(`приёмы пищи: заголовок со значком крупнее записей, отделён отступом; перекус — меньше и без заливки «＋» (${scheme})`, async () => {
  const a = await openApp({ scheme, data: DATA });
  const r = await a.ev(() => {
    const m = document.querySelector('.meal[data-m="0"]'), h = m.querySelector(':scope>.mh'), sn = m.querySelector('.sns');
    const px = el => parseFloat(getComputedStyle(el).fontSize);
    return { icons: [...document.querySelectorAll('.meal>.mh .mi svg')].length, snIcon: !!sn.querySelector('.mh .mi svg'),
      title: px(h.querySelector('b')), item: px(m.querySelector('.it .n')), snTitle: px(sn.querySelector('.mh b')),
      firstLine: getComputedStyle(m.querySelector(':scope>.il>.it')).borderTopColor, addMain: getComputedStyle(h.querySelector('.add')).backgroundColor,
      addSnack: getComputedStyle(sn.querySelector('.add')).backgroundColor };
  });
  assert.equal(r.icons, 3, 'значки у завтрака, обеда, ужина'); assert.ok(r.snIcon, 'значок у перекуса');
  assert.ok(r.title >= r.item + 3, `заголовок ${r.title} заметно крупнее записи ${r.item}`);
  assert.ok(r.snTitle < r.title, 'заголовок перекуса — второго уровня');
  assert.match(r.firstLine, /rgba\(\d+, \d+, \d+, 0\)/, 'между заголовком и первой записью нет линии');
  assert.notEqual(r.addMain, 'rgba(0, 0, 0, 0)'); assert.equal(r.addSnack, 'rgba(0, 0, 0, 0)');
  assert.deepEqual(a.errors, []);
  await a.close();
});
