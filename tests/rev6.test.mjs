// Ревизия 6: переходы листа без сдвига, настройки без «мигания», плавное закрытие жестом, календарь без фризов, виджет
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openApp, day } from './helpers.mjs';

const G = { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, wt: { [day()]: 72.4 } };

test('переходы в «Ещё» и обратно: старый экран гаснет точно на своём месте (сдвиг 0 px)', async () => {
  const a = await openApp({ data: G });
  const cases = [['sets()', "pick('th')"], ["sets();pick('ac')", 'backStep()'], ['sets()', 'vibOpen()'], ["sets();vibOpen()", 'backStep()'], ["sets();pick('dw')", 'backStep()'], ['op(2)', 'pc(1)'], ['op(2);pc(1)', 'backStep()']];
  for (const [open, go] of cases) {
    await a.ev('if(isOpen)closeUI()'); await a.wait(300); await a.ev(open); await a.wait(700);
    const r = await a.ev(async go => {
      const sel = '.hd .ht, .row, .pk, .seg, .kpd button, .pb, .vf, .fs', pos = e => { const r = e.getBoundingClientRect(); return [e.className, r.top, r.left, r.width] };
      const before = [...shEl().querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return e.offsetParent && r.height && r.top < innerHeight && r.bottom > 0 }).map(pos);
      eval(go); await Promise.resolve(); await Promise.resolve();
      const L = document.querySelector('#ov > .svl'); if (!L) return 'нет слоя';
      document.getAnimations().forEach(x => x.pause());
      const after = [...L.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().height).map(pos);
      let worst = 0, miss = 0; before.forEach(b => { const c = after.find(x => x[0] === b[0] && Math.abs(x[1] - b[1]) < 30 && Math.abs(x[2] - b[2]) < 30); if (!c) miss++; else worst = Math.max(worst, Math.abs(c[1] - b[1]), Math.abs(c[2] - b[2]), Math.abs(c[3] - b[3])) });
      document.getAnimations().forEach(x => x.play()); return { n: before.length, miss, worst: Math.round(worst * 10) / 10 };
    }, go);
    assert.ok(r.n > 0, go); assert.equal(r.miss, 0, `${open} → ${go}: все строки на месте`); assert.ok(r.worst <= .5, `${open} → ${go}: сдвиг ${r.worst} px`);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('настройки меняются без View Transitions (касания не теряются, меню не мигает); гаснущие копии — без id', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => { window.__vt = 0; const f = document.startViewTransition.bind(document); document.startViewTransition = x => { window.__vt++; return f(x) } });
  await a.ev(() => sets()); await a.wait(500);
  for (const act of ["setTn('soft')", "setTn('off')", "setAc('#e0567a')", "setWt('off')", "setWt('on')", "setSn('tap')", "setSn('row')", "setDc('row')", "setDc('tap')"]) { await a.ev(act); await a.wait(450) }
  assert.equal(await a.ev(() => window.__vt), 0, 'ни одной смены кадра');
  assert.equal(await a.ev(() => document.documentElement.classList.contains('notr')), false);
  // вибрация: выключение — лист плавно меняет высоту, старые строки не находятся по id
  await a.ev(() => vibOpen()); await a.wait(500);
  const v = await a.ev(() => { setVb(false); return { anim: shBody().getAnimations().length, dup: [...document.querySelectorAll('[id]')].filter((e, i, A) => A.findIndex(x => x.id === e.id) !== i && !e.closest('.svl')).length, vsm: $('vsm') === null } });
  assert.ok(v.anim >= 1, 'содержимое едет вместе с краем листа'); assert.equal(v.dup, 0, 'нет повторяющихся id'); assert.equal(v.vsm, true);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('закрытие жестом вниз: лист уезжает с того места, где его отпустили (без скачка вверх)', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => sets()); await a.wait(600);
  const top = await a.ev(() => document.querySelector('#ov .hd').getBoundingClientRect().top);
  await a.drag(200, top + 20, 200, top + 260, { steps: 12, ms: 12, end: false });
  const held = await a.ev(() => document.querySelector('#ov .sh').getBoundingClientRect().top);
  await a.touchEnd();
  const ys = await a.ev(async () => { const s = document.querySelector('#ov .sh'), out = []; for (let i = 0; i < 8; i++) { out.push(s.getBoundingClientRect().top); await new Promise(r => requestAnimationFrame(r)) } return out });
  assert.ok(ys.every((y, i) => y >= held - 1 && (i === 0 || y >= ys[i - 1] - .5)), `лист только опускается: ${held} → ${ys.map(Math.round)}`);
  await a.wait(500); assert.equal(await a.ev(() => isOpen), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('календарь: листание не даёт листу прокручиваться вбок; подписи дат на месте', async () => {
  const a = await openApp({ data: G });
  await a.ev(() => cal()); await a.wait(500);
  const r = await a.ev(() => { const b = shBody(); $('cg').style.transform = 'translateX(120px)'; const o = b.scrollWidth > b.clientWidth; $('cg').style.transform = ''; return [getComputedStyle(b).overflowX, o] });
  assert.deepEqual(r, ['hidden', true], 'во время взмаха вправо лист не прокручивается вбок (прокрутку пришлось бы «останавливать» касанием)');
  assert.match(await a.ev(() => document.querySelector('#cg button.cd').getAttribute('aria-label')), /^1 [а-я]+ \d{4}/);
  // шапка не перерисовывается без изменений (касание «К сегодня» не попадает в удалённую надпись)
  assert.equal(await a.ev(() => { const n = $('dt').firstChild; head(); head(); return $('dt').firstChild === n }), true);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('кольцо карточки дня: зазоры между долями меньше; возврат из фона — без transform у body', async () => {
  const a = await openApp({ data: { ...G, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 20, f: 10, c: 60 }] } } });
  await a.ev(() => togRep(true)); await a.wait(600);
  const gap = await a.ev(() => { const c = [...document.querySelectorAll('#app .rep circle[stroke-dasharray]')].filter(x => +x.getAttribute('stroke-dasharray').split(' ')[0] < 100); const o = c.map(x => -x.getAttribute('stroke-dashoffset')), l = c.map(x => +x.getAttribute('stroke-dasharray').split(' ')[0]); return Math.round((o[1] - o[0] - l[0]) * 100) / 100 });
  assert.equal(gap, .5, 'зазор 0,5 % окружности (было 0,9)');
  await a.ev(() => togRep(false)); await a.wait(500);
  await a.ev(() => document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await a.ev(() => document.body.style.transform), '', 'закреплённые панели не сдвигаются');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('виджет: в 3 колонки — средняя раскладка, короткая шапка, плашка 1×1 квадратная', () => {
  const java = fs.readFileSync('native/android/BjuWidget.java', 'utf8');
  const MIN = java.match(/MIN = \{(.*?)\};/s)[1].match(/\{[^}]*\}/g).map(x => x.slice(1, -1).split(',').map(Number));
  const pick = (w, h) => { let b = 0, ar = 0; MIN.forEach(([x, y], k) => { if (w >= x && h >= y && x * y > ar) { b = k; ar = x * y } }); return b };
  const L = ['t1', 'n2', 'w3', 'w4', 's', 'm', 'L', 'sx', 'lx', 'v2'];
  assert.equal(L[pick(270, 190)], 'm', '3×2'); assert.equal(L[pick(270, 72)], 'w3', '3×1'); assert.equal(L[pick(300, 190)], 'L', '4×2');
  assert.equal(L[pick(300, 72)], 'w4', '4×1'); assert.equal(L[pick(300, 280)], 'L', '4×3 на узком телефоне'); assert.equal(L[pick(75, 190)], 'v2', '1×2 — ревизия 10: кольцо и Б / Ж / У столбиком'); assert.equal(L[pick(75, 120)], 't1', 'чуть выше 1×1 — по-прежнему кольцо');
  assert.match(java, /"Съедено " \+ d\.kcal \+ " из " \+ d\.kcalGoal/);
  const t1 = fs.readFileSync('native/android/res/layout/bju_widget_t1.xml', 'utf8');
  assert.match(t1, /scaleType="fitCenter" android:src="@drawable\/bju_widget_tile"/);
  assert.match(fs.readFileSync('native/android/res/drawable/bju_widget_tile.xml', 'utf8'), /<size android:width="96dp" android:height="96dp"/);
  // 2×1: калории слева, Б / Ж / У столбиком справа (без полосок — их в этой раскладке не красят)
  const n2 = fs.readFileSync('native/android/res/layout/bju_widget_n2.xml', 'utf8');
  assert.ok(n2.indexOf('bju_k_val') < n2.indexOf('bju_p_lbl') && n2.indexOf('bju_p_val') < n2.indexOf('bju_f_lbl'), 'порядок: калории, затем Б, Ж, У');
  assert.doesNotMatch(n2, /ProgressBar/);
  assert.match(fs.readFileSync('native/android/MainActivity.java', 'utf8'), /onWindowFocusChanged[\s\S]*redraw\(\)/, 'перерисовка после разблокировки');
});
