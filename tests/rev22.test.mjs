// Ревизия 22: заметка к дню (в конце дня, лист с полем, выключатель в «Настройках», файл данных) и картинка профиля
// (буква, белый значок, цветная наклейка; в файле и в имени для обмена).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 4, n: 'Плов', g: 300, p: 20, f: 25, c: 80 }] }, db: [['Рис', 7, 1, 78]], set: { pf: { n: 'Данил', c: '#0d7f70' } } };

test('заметка к дню: подсказка → лист → сохранить → карточка; изменить, удалить; файл данных', async () => {
  const a = await openApp({ data: DATA });
  assert.match(await a.pg.textContent('#app .ntq'), /Заметка к дню/);
  await a.pg.click('#app .ntq'); await a.wait(500);
  assert.equal(await a.ev(() => $('st').textContent), 'Заметка');
  assert.equal(await a.ev(() => document.activeElement.id), 'ntx', 'поле сразу в фокусе');
  assert.equal(await a.ev(() => $('ntd').hidden), true, 'удалять нечего');
  await a.pg.fill('#ntx', '  В гостях,\nплов на глаз  ');
  await a.pg.click('#nts'); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), false);
  assert.equal(await a.ev(() => S.nt[cur]), 'В гостях,\nплов на глаз');
  assert.match(await a.pg.textContent('#app .nte'), /ЗаметкаВ гостях,\nплов на глаз/);
  // в файле — notes, при чтении — обратно
  const f = await a.ev(() => JSON.parse(ser()));
  assert.deepEqual(f.notes, { [day(0)]: 'В гостях,\nплов на глаз' });
  assert.equal(await a.ev(() => parseData(ser()).nt[cur]), 'В гостях,\nплов на глаз');
  // неподходящее в файле отбрасывается
  assert.deepEqual(await a.ev(() => parseData(JSON.stringify({ format: 'bju-diary', version: 3, notes: { 'bad': 'x', '2026-01-01': 5, '2026-01-02': '  ok ' } })).nt), { '2026-01-02': 'ok' });
  // удалить
  await a.pg.click('#app .nte'); await a.wait(500);
  assert.equal(await a.pg.inputValue('#ntx'), 'В гостях,\nплов на глаз');
  await a.pg.click('#ntd'); await a.wait(500);
  assert.equal(await a.ev(() => cur in (S.nt || {})), false); assert.equal(await a.ev(() => !!document.querySelector('#app .ntq')), true);
  // пустой текст = удалить
  await a.ev(() => { S.nt = { [cur]: 'x' }; ntOpen(); return 0 }); await a.wait(400); await a.pg.fill('#ntx', '   '); await a.pg.click('#nts'); await a.wait(400);
  assert.equal(await a.ev(() => cur in (S.nt || {})), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('заметки выключаются в «Настройках»: строка пропадает, текст сохраняется и возвращается при включении', async () => {
  const a = await openApp({ data: { ...DATA, nt: { [day(0)]: 'Плохо спал' } } });
  assert.match(await a.pg.textContent('#app .nte'), /Плохо спал/);
  await a.ev(() => { sets(); return 0 }); await a.wait(500);
  assert.equal(await a.ev(() => $('ntm').getAttribute('aria-checked')), 'true');
  await a.pg.click('#ntm'); await a.wait(700);
  assert.equal(await a.ev(() => $('ntm').getAttribute('aria-checked')), 'false');
  assert.equal(await a.ev(() => !!document.querySelector('#app [data-fk="nt"]')), false);
  assert.equal(await a.ev(() => JSON.parse(ser()).settings.dayNotes), 'off');
  assert.equal(await a.ev(() => S.nt[cur]), 'Плохо спал', 'текст не удалён');
  await a.pg.click('#ntm'); await a.wait(700);
  assert.match(await a.pg.textContent('#app .nte'), /Плохо спал/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('профиль: буква · значки · цветные; цвет для каждой вкладки свой; сохраняется в файл и в имя для обмена', async () => {
  const a = await openApp({ data: DATA });
  await a.ev(() => { pfOpen(); return 0 }); await a.wait(500);
  assert.match(await a.pg.textContent('#v18 .pft'), /БукваЗначкиЦветные/);
  assert.equal(await a.ev(() => document.querySelector('#pfa .xav').textContent), 'Д');
  await a.ev(() => { pfMode('w'); return 0 }); await a.wait(400);
  assert.equal(await a.ev(() => document.querySelectorAll('#v18 .pfg button').length), 20);
  await a.pg.click('#v18 .pfg button[aria-label="Лиса"]'); await a.wait(200);
  assert.equal(await a.ev(() => !!document.querySelector('#pfa .xav.pic svg')), true);
  await a.pg.click('#v18 .pfc button[aria-label="Синий"]');
  await a.ev(() => { pfMode('c'); return 0 }); await a.wait(400);
  assert.match(await a.pg.textContent('#v18'), /Фон под наклейкой/);
  await a.pg.click('#v18 .pfc button[aria-label="Персиковый"]');
  await a.pg.click('#pfok'); await a.wait(500);
  assert.deepEqual(await a.ev(() => S.set.pf), { n: 'Данил', c: '#fddcc8', k: 'c', i: 'fox' });
  assert.deepEqual(await a.ev(() => JSON.parse(ser()).settings.profile), { n: 'Данил', c: '#fddcc8', k: 'c', i: 'fox' });
  assert.deepEqual(await a.ev(() => parseData(ser()).set.pf), { n: 'Данил', c: '#fddcc8', k: 'c', i: 'fox' });
  // имя для обмена: седьмое поле — картинка; собеседник видит её
  assert.equal(await a.ev(() => xEp().split('|')[6]), 'c.fox');
  assert.deepEqual(await a.ev(() => xPeer('e', '1|Оля|#fddcc8|Pixel|3|0|c.fox').av), { k: 'c', i: 'fox' });
  assert.equal(await a.ev(() => xPeer('e', '1|Оля|#6458dc|Pixel|3|0').av), null, 'старая версия — буква');
  // «Настройки»: строка профиля с картинкой
  await a.ev(() => { sets(); return 0 }); await a.wait(400);
  assert.equal(await a.ev(() => !!document.querySelector('#v7 .grp .row .xav.pic svg')), true);
  // неизвестный значок или чужой цвет — безопасные значения
  assert.deepEqual(await a.ev(() => { S.set.pf = { n: 'А', c: '#123456', k: 'w', i: 'zzz' }; return xpf() }), { n: 'А', c: '#6458dc', k: 'w', i: 'dino' });
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('все 20 значков рисуются в обоих видах без ошибок (белый на цвете и наклейка)', async () => {
  const a = await openApp({ data: DATA });
  const r = await a.ev(() => AVI.map(x => { const d = document.createElement('div'); d.innerHTML = avSvg(x.k, 'w', '#0d7f70') + avSvg(x.k, 'c'); document.body.appendChild(d); const ok = [...d.querySelectorAll('svg')].every(s => { const b = s.getBBox(); return b.width > 6 && b.height > 6 && b.x >= -1 && b.y >= -1 && b.x + b.width <= 25 && b.y + b.height <= 25 }); d.remove(); return ok ? '' : x.k }).filter(Boolean));
  assert.deepEqual(r, [], 'значки в пределах 24×24');
  assert.deepEqual(a.errors, []);
  await a.close();
});
