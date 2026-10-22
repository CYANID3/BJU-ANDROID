// Ревизия 17: профиль и обмен продуктами с телефоном рядом. Связь между телефонами заменена имитацией (тот же набор
// методов и событий, что у native/android/BjuExchangePlugin.java): тест сам «присылает» события второго телефона.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const DB = [['Овсянка', 12, 6, 60], ['Гречка', 12.6, 3.3, 57, [['Пакетик', 80]]], ['Творог 5%', 17, 5, 3], ['Плов', 9, 6, 18, [['порция', 300]], { w: 300, i: [{ n: 'Рис', g: 100, p: 7, f: 1, c: 78 }] }]];
const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 0, n: 'Овсянка', g: 60, p: 7, f: 3, c: 36 }] }, db: DB };
// имитация связи: вызовы записываются, события присылает тест
const FAKE = (st = {}) => {
  const S0 = Object.assign({ perm: 'granted', bt: true, btExists: true, wifi: true, model: 'Pixel 8' }, st);
  window.__x = { calls: [], L: {} }; const c = (k, r) => (...a) => { __x.calls.push([k, ...a]); return Promise.resolve(r) };
  window.__emit = (ev, d) => (__x.L[ev] || []).forEach(f => f(d));
  window.BJU_NATIVE = Object.assign({}, window.BJU_NATIVE, { exchange: {
    available: true, state: c('state', S0), requestPerms: c('requestPerms', { granted: S0.perm !== 'denied' }), enableBt: c('enableBt', { enabled: true }), openSettings: c('openSettings'),
    start: c('start'), pause: c('pause'), stop: c('stop'), connect: c('connect'), accept: c('accept'), reject: c('reject'), disconnect: c('disconnect'), send: c('send'),
    on: (ev, fn) => { (__x.L[ev] = __x.L[ev] || []).push(fn) } } });
};
const calls = (a, k) => a.ev(k => __x.calls.filter(c => c[0] === k), k);
const view = a => a.ev(() => [19, 18, 12, 7].find(i => !$('v' + i).hidden) || 0);

test('профиль: строка вверху «Настроек», имя и цвет, пустое имя не сохраняется; в файле — profile', async () => {
  const a = await openApp({ data: DATA });
  await a.ev(() => sets()); await a.wait(400);
  assert.match(await a.ev(() => document.querySelector('#v7 .grp .row .tx').textContent), /^ПрофильИмя и цвет/);
  await a.ev(() => pfOpen()); await a.wait(400);
  assert.equal(await a.ev(() => $('st').textContent), 'Профиль');
  await a.ev(() => pfSave()); assert.match(await a.ev(() => $('tm').textContent), /Введите имя/);
  await a.pg.fill('#pfn', 'Алексей'); await a.ev(() => pfColor('#0d7f70'));
  assert.equal(await a.ev(() => [document.querySelector('#v18 .pfh .xav').textContent, document.querySelector('#v18 .pfh .xav').style.background, $('pfv').textContent].join()), 'А,rgb(13, 127, 112),Алексей');
  assert.notEqual(await a.ev(() => document.activeElement.id), 'pfn', 'выбор цвета убирает фокус с имени — клавиатура не открывается снова');
  await a.ev(() => { $('pfn').focus(); pfColor('#6458dc'); pfColor('#0d7f70') });
  assert.notEqual(await a.ev(() => document.activeElement.id), 'pfn', 'и при повторных касаниях цвета');
  await a.pg.click('#pfok'); await a.wait(400);
  assert.equal(await view(a), 7, 'после «Сохранить» — снова «Настройки»');
  assert.match(await a.ev(() => document.querySelector('#v7 .grp .row').textContent), /^ААлексейТак вас видят при обмене/);
  assert.deepEqual(await a.ev(() => JSON.parse(ser()).settings.profile), { n: 'Алексей', c: '#0d7f70' });
  assert.deepEqual(await a.ev(() => { const d = parseData(ser()); return [d.set.pf.n, d.db.length] }), ['Алексей', 4]);
  // в «Данные» — «Обмен продуктами», в каталоге панели и в жесте — тоже
  assert.match(await a.pg.textContent('#v7'), /Файл данных.*Обмен продуктамиС телефоном рядом/);
  assert.equal(await a.ev(() => [!!NA.xch, SWL.some(x => x[0] === 'xch')].join()), 'true,true');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен в браузере: понятное сообщение вместо поиска', async () => {
  const a = await openApp({ data: DATA });
  await a.ev(() => xOpen()); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Обмен работает в приложении на Android/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен целиком: поиск → код → выбор (без блюд) → передача в обе стороны → сразу импорт; дневник и цели не уходят', async () => {
  const a = await openApp({ data: { ...DATA, set: { pf: { n: 'Алексей', c: '#6458dc' } } } });
  await a.ev(FAKE);
  await a.ev(() => naRun('xch')); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Android один раз спросит разрешения «Устройства поблизости» и, на многих телефонах, точное «Местоположение»/, 'первый раз — объяснение');
  await a.pg.click('#x1'); await a.wait(400);
  const st = await calls(a, 'start'); assert.equal(st.length, 1); assert.equal(st[0][1], '1|Алексей|#6458dc|Pixel 8|3|1', 'имя для поиска: имя, цвет, модель, продукты, блюда');
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  await a.ev(() => __emit('found', { id: 'e1', name: '1|Марина|#0d7f70|Pixel 8|186|7' })); await a.wait(200);
  assert.match(await a.pg.textContent('#v19'), /МаринаPixel 8 · 186 продуктовОбменяться/);
  await a.ev(() => xConnect('e1')); await a.wait(300);
  assert.deepEqual((await calls(a, 'connect'))[0], ['connect', 'e1']);
  await a.ev(() => __emit('initiated', { id: 'e1', name: '1|Марина|#0d7f70|Pixel 8|186|7', code: '4827', incoming: false })); await a.wait(400);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#v19 .xcd b')].map(b => b.textContent).join('')), '4827');
  await a.pg.click('#x1'); await a.wait(200); // «Совпадает»
  assert.deepEqual((await calls(a, 'accept'))[0], ['accept', 'e1']);
  assert.match(await a.pg.textContent('#v19'), /Ждём подтверждения: Марина/);
  await a.ev(() => __emit('connected', { id: 'e1' })); await a.wait(400);
  assert.equal(await a.ev(() => $('st').textContent), 'Обмен: Марина');
  assert.match(await a.pg.textContent('#v19'), /Марина ещё выбирает/);
  await a.pg.click('#xod'); await a.wait(200); // блюда не отправлять
  await a.pg.click('#x1'); await a.wait(200); // «Обменяться»
  const r1 = (await calls(a, 'send')).map(c => JSON.parse(c[2]));
  assert.deepEqual(r1, [{ t: 'ready', p: 3, d: 0 }]);
  assert.match(await a.pg.textContent('#v19'), /Начнём, когда Марина тоже нажмёт/);
  await a.ev(() => __emit('message', { id: 'e1', data: JSON.stringify({ t: 'ready', p: 3, d: 0 }) })); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Обмениваемся/);
  const sent = (await calls(a, 'send')).map(c => JSON.parse(c[2])).find(m => m.t === 'data');
  assert.deepEqual(sent.products.map(p => p.name), ['Овсянка', 'Гречка', 'Творог 5%'], 'только продукты, блюда выключены');
  assert.deepEqual(Object.keys(sent).sort(), ['products', 't'], 'ни дневника, ни целей, ни настроек');
  assert.deepEqual(sent.products[1].units, [{ name: 'Пакетик', grams: 80 }]);
  // прогресс и данные от второго телефона
  await a.ev(() => __emit('progress', { id: 'e1', dir: 'out', done: 50, total: 100 })); await a.wait(100);
  assert.equal(await a.ev(() => document.querySelector('#v19 [data-t="out"]').textContent), '50 %');
  const their = [{ name: 'Авокадо', per100g: { protein: 2, fat: 14.7, carbs: 1.8 }, units: [{ name: 'Штука', grams: 160 }] }, { name: 'Гречка', per100g: { protein: 12.6, fat: 3.3, carbs: 57 } }, { name: 'Творог 5%', per100g: { protein: 16, fat: 5, carbs: 2.8 } }];
  await a.ev(t => __emit('message', { id: 'e1', data: JSON.stringify({ t: 'data', products: t }) }), their); await a.wait(100);
  assert.equal(await view(a), 19, 'ждём, пока уйдёт своё');
  await a.ev(() => __emit('progress', { id: 'e1', dir: 'out', done: 100, total: 100 })); await a.wait(500);
  assert.equal(await view(a), 12, 'сразу экран импорта');
  assert.equal(await a.ev(() => $('st').textContent), 'Продукты: Марина');
  assert.match(await a.pg.textContent('#mgl'), /Обмен завершён/);
  assert.ok((await calls(a, 'stop')).length >= 1, 'связь закрыта');
  await a.pg.click('#mgok'); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), false, 'после «Добавить» лист закрывается');
  assert.deepEqual(await a.ev(() => S.db.map(p => p[0])), ['Овсянка', 'Гречка', 'Творог 5%', 'Плов', 'Авокадо']);
  assert.deepEqual(await a.ev(() => Object.keys(S.d)), [await a.ev(() => today)], 'дневник не тронут');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('входящий запрос: окно «… хочет обменяться», «Отклонить» и «Принять»; код не совпал — назад к поиску', async () => {
  const a = await openApp({ data: { ...DATA, set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } } });
  await a.ev(FAKE); await a.ev(() => xOpen()); await a.wait(500);
  assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/, 'второй раз — сразу поиск');
  await a.ev(() => __emit('initiated', { id: 'e2', name: '1|Марина|#0d7f70|Pixel 8|186|7', code: '1234', incoming: true })); await a.wait(300);
  assert.equal(await a.ev(() => [$('dg').classList.contains('on'), $('dgt').textContent, $('dgn').textContent, $('dgy').textContent].join()), 'true,Марина хочет обменяться,Отклонить,Принять');
  await a.pg.click('#dgn'); await a.wait(300);
  assert.deepEqual((await calls(a, 'reject'))[0], ['reject', 'e2']); assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  await a.ev(() => __emit('initiated', { id: 'e2', name: '1|Марина|#0d7f70|Pixel 8|186|7', code: '1234', incoming: true })); await a.wait(300);
  await a.pg.click('#dgy'); await a.wait(400);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#v19 .xcd b')].map(b => b.textContent).join('')), '1234');
  await a.pg.click('#x2'); await a.wait(400); // «Не совпадает»
  assert.equal((await calls(a, 'reject')).length, 2); assert.match(await a.pg.textContent('#v19'), /Ищем телефоны рядом/);
  assert.match(await a.ev(() => $('tm').textContent), /Код не совпал/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('ошибки: нет разрешения, Bluetooth выключен, связь прервалась; закрыть лист — обмен остановлен', async () => {
  const a = await openApp({ data: { ...DATA, set: { pf: { n: 'Алексей', c: '#6458dc' }, xi: 1 } } });
  await a.ev(FAKE, { perm: 'denied' }); await a.ev(() => xOpen()); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Нет разрешения/); assert.equal(await a.ev(() => $('x1').textContent), 'Открыть настройки');
  await a.pg.click('#x1'); assert.equal((await calls(a, 'openSettings')).length, 1);
  await a.ev(FAKE, { bt: false }); await a.ev(() => xOpen()); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Bluetooth выключен/); await a.pg.click('#x1'); await a.wait(300);
  assert.equal((await calls(a, 'enableBt')).length, 1);
  await a.ev(FAKE); await a.ev(() => xOpen()); await a.wait(400);
  await a.ev(() => { __emit('found', { id: 'e1', name: '1|Марина|#0d7f70|Pixel 8|5|0' }); xConnect('e1'); __emit('initiated', { id: 'e1', name: '', code: '1111', incoming: false }); xCodeOk(); __emit('connected', { id: 'e1' }) }); await a.wait(300);
  await a.ev(() => { xReady(); __emit('message', { id: 'e1', data: '{"t":"ready","p":5,"d":0}' }) }); await a.wait(300);
  await a.ev(() => __emit('disconnected', { id: 'e1' })); await a.wait(400);
  assert.match(await a.pg.textContent('#v19'), /Связь прервалась.*ничего не сохранено|Связь прерваласьНичего не сохранено/i);
  const n0 = (await calls(a, 'stop')).length; await a.ev(() => cl()); await a.wait(300);
  assert.equal((await calls(a, 'stop')).length, n0 + 1, 'закрыли лист — поиск и связь остановлены');
  assert.deepEqual(await a.ev(() => S.db.length), 4, 'ничего не добавилось');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обмен с панели: «Обмен» на месте 4 открывает экран обмена; без профиля — сначала имя', async () => {
  const a = await openApp({ data: { ...DATA, set: { nav: { n: 5, big: true, s: ['cal', 'prod', 'meal', 'xch', 'set'] } } } });
  await a.ev(FAKE);
  assert.equal(await a.ev(() => document.querySelector('.bt>button:nth-child(4)').textContent), 'Обмен');
  await a.pg.click('.bt>button:nth-child(4)'); await a.wait(400);
  assert.equal(await view(a), 19); assert.equal(await a.ev(() => $('x1').textContent), 'Указать имя');
  await a.pg.click('#x1'); await a.wait(400); assert.equal(await view(a), 18);
  await a.pg.fill('#pfn', 'Оля'); await a.pg.click('#pfok'); await a.wait(400);
  assert.equal(await view(a), 19, 'после имени — снова обмен'); assert.equal(await a.ev(() => $('x1').textContent), 'Продолжить');
  assert.deepEqual(a.errors, []);
  await a.close();
});
