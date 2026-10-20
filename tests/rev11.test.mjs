// Ревизия 11: перекус отделён от своего приёма подложкой, шапка с датой отделяется линией при прокрутке; новая иконка во всех ресурсах
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { openApp, day, entry } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [entry(0, 'Овсянка', 60, 12, 6, 60), entry(1, 'Банан', 120, 1.5, .2, 21.8), entry(2, 'Гречка', 80, 12.6, 3.3, 57), entry(2, 'Курица', 200, 23, 2, 0), entry(4, 'Творог', 250, 17, 5, 3)] } };

for (const scheme of ['light', 'dark']) test(`перекус — подраздел на своей подложке, шапка дня отделяется при прокрутке (${scheme})`, async () => {
  const a = await openApp({ scheme, data: DATA });
  const r = await a.ev(() => {
    const sn = document.querySelector('.meal .sns'), card = sn.closest('.meal'), cs = getComputedStyle(sn), rc = card.getBoundingClientRect(), rs = sn.getBoundingClientRect();
    // ревизия 14: перекус — вставленный блок со скруглением внутри карточки (отступ от краёв карточки 4–12 px)
    const inset = [rs.left - rc.left, rc.right - rs.right, rc.bottom - rs.bottom];
    return { bg: cs.backgroundColor, card: getComputedStyle(card).backgroundColor, full: inset.every(d => d >= 4 && d <= 12) && parseFloat(cs.borderTopLeftRadius) >= 12, bottom: inset[2] <= 12, nav0: document.querySelector('header.nav').classList.contains('sc') };
  });
  assert.notEqual(r.bg, r.card, 'подложка перекуса отличается от карточки');
  assert.ok(r.full, 'подложка — блок со скруглением внутри карточки'); assert.ok(r.bottom, 'у низа карточки');
  assert.equal(r.nav0, false, 'вверху страницы линии под шапкой нет');
  await a.ev(() => scrollTo(0, 300)); await a.wait(150);
  assert.equal(await a.ev(() => document.querySelector('header.nav').classList.contains('sc')), true, 'записи под шапкой — линия есть');
  await a.ev(() => scrollTo(0, 0)); await a.wait(150);
  assert.equal(await a.ev(() => document.querySelector('header.nav').classList.contains('sc')), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('иконка: монохромный слой, фон заставки и картинки одного варианта; в package.json выбран существующий вариант', async () => {
  const { VARIANTS } = await import('../scripts/icon-svg.mjs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')), v = VARIANTS[pkg.icon || 'dark'];
  assert.ok(v, `вариант «${pkg.icon}» есть в icon-svg.mjs`);
  assert.match(fs.readFileSync('native/android/res/values/bju_splash.xml', 'utf8'), new RegExp(`>${v.bg}<`, 'i'), 'фон заставки = фон иконки');
  const mono = fs.readFileSync('native/android/res/drawable/bju_ic_mono.xml', 'utf8');
  assert.match(mono, /<vector[^>]+android:viewportWidth="\d+"/); assert.ok((mono.match(/<path/g) || []).length >= 1);
  for (const f of ['public/icon-192.png', 'public/icon-512.png', 'public/favicon.png', 'native/android/res/drawable-nodpi/bju_splash_logo.png'])
    assert.ok(fs.statSync(f).size > 500, f);
  // патч сборки добавляет монохромный слой в адаптивную иконку
  assert.match(fs.readFileSync('scripts/patch-android.mjs', 'utf8'), /<monochrome android:drawable="@drawable\/bju_ic_mono"/);
});

test('копия данных в памяти браузера: пишется после нажатия (не в его кадре), одна на серию правок, сразу — при уходе из приложения', async () => {
  const a = await openApp({ data: DATA });
  const r = await a.ev(async () => {
    let n = 0; const f = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'bju2') n++; return f.call(this, k, v) };
    S.g = { ...S.g, p: 141 }; save(); S.g = { ...S.g, p: 142 }; save(); S.g = { ...S.g, p: 143 }; save();
    const sync = n; await new Promise(r => setTimeout(r, 900)); const later = n, kept = JSON.parse(localStorage.getItem('bju2')).g.p;
    S.g = { ...S.g, p: 144 }; save(); Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));
    const onHide = JSON.parse(localStorage.getItem('bju2')).g.p; delete document.hidden; Storage.prototype.setItem = f;
    return { sync, later, kept, onHide };
  });
  assert.deepEqual(r, { sync: 0, later: 1, kept: 143, onHide: 144 });
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('смена темы: цвет строки состояния — фон новой темы', async () => {
  const a = await openApp({ scheme: 'dark' });
  for (const th of ['light', 'dark', 'light']) {
    const r = await a.ev(th => { setTh(th); return [document.querySelector('meta[name="theme-color"]').content, getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()] }, th);
    assert.equal(r[0], r[1], th);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('закрытый лист выключен из расчёта стилей, при открытии — сразу включён и с правильной высотой', async () => {
  const db = Array.from({ length: 300 }, (_, i) => ['Продукт ' + i, 10, 5, 20]);
  const a = await openApp({ data: { ...DATA, db } });
  await a.ev(() => mng()); await a.wait(500);
  const h0 = await a.ev(() => Math.round(shEl().getBoundingClientRect().height));
  await a.ev(() => closeUI()); await a.wait(150);
  assert.equal(await a.ev(() => $('ov').classList.contains('idle')), false, 'пока идёт закрытие — содержимое на месте');
  await a.wait(400);
  assert.equal(await a.ev(() => getComputedStyle($('ov')).contentVisibility), 'hidden');
  const r = await a.ev(() => { mng(); return { idle: $('ov').classList.contains('idle'), h: Math.round(shEl().getBoundingClientRect().height) } });
  assert.equal(r.idle, false); assert.equal(r.h, h0, 'высота листа при повторном открытии та же');
  // быстрое повторное открытие до срабатывания таймера не выключает открытый лист
  await a.ev(() => { closeUI(); cal() }); await a.wait(700);
  assert.deepEqual(await a.ev(() => [$('ov').classList.contains('idle'), isOpen]), [false, true]);
  assert.deepEqual(a.errors, []);
  await a.close();
});
