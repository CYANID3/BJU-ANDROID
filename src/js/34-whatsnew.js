// «Что нового» после обновления и экран первого запуска (только APK).
// Список изменений — текст внутри приложения: записи по порядку, новая — в конце. Хранить не больше ~30 последних
// (старые удалять): каждая — около 1 КБ. Номер версии (1.0.N) GitHub присваивает при сборке, поэтому запись
// привязана к своему номеру n, а заголовок окна показывает версию сборки (BUILD).
// Что уже видели — номер последней показанной записи в памяти приложения (bju_wn), в файл данных не пишется.
const WN = [
  { n: 1, d: "6 ноября 2026", t: [
    ["up", "Обновления ставятся поверх", "Больше не нужно удалять приложение перед установкой новой версии"],
    ["list", "Окно «Что нового»", "Появляется после каждого обновления. Открыть снова: Настройки → Что нового"],
    ["file", "Быстрый старт", "После переустановки — одно касание, чтобы вернуть данные из файла"],
  ] },
];
const WN_LAST = WN[WN.length - 1].n;
const wnSeen = () => { try { return +localStorage.getItem("bju_wn") || 0 } catch (e) { return WN_LAST } };
const wnMark = () => { try { localStorage.setItem("bju_wn", WN_LAST) } catch (e) { } };
let wnFrom = 0;

// после запуска (данные прочитаны, заставка ушла): чистая установка — экран первого запуска; обновление — «Что нового»
function wnStart() {
  if (!NATIVE) return; const seen = wnSeen(); if (seen >= WN_LAST) return;
  const fresh = !seen && !dnc(S.d) && !S.db.length && !MF && !Object.keys(S.wt || {}).length;
  const go = () => { if (isOpen) return; wnMark(); fresh ? wlOpen() : wnOpen(WN.filter(e => e.n > seen)) };
  setTimeout(go, fresh ? 300 : 700);
}

// --- «Что нового»: последняя запись подробно, пропущенные — кратко ниже
const wnItem = ([i, t, s]) => `<li><span class="ic">${ic(i)}</span><span class="tx">${esc(t)}<small>${esc(s)}</small></span></li>`;
function wnOpen(list, from) {
  wnFrom = from || 0; const last = list[list.length - 1], older = list.slice(0, -1).reverse();
  $("v24").innerHTML = `<ul class="wnl">${last.t.map(wnItem).join("")}</ul>`
    + (older.length ? `<div class="gh">Раньше</div><div class="wno">${older.map(e => e.t.map(x => `<div>· ${esc(x[1])}</div>`).join("")).join("")}</div>` : "")
    + `<div class="hint">${esc(last.d)}</div>`;
  sv(24, "Что нового", "Версия " + BUILD); show()
}
// из настроек: последние записи (до 5), с возвратом в настройки
const wnShow = () => wnOpen(WN.slice(-5), 1);
const wnOk = () => wnFrom ? sets(1) : cl();

// --- экран первого запуска: вернуть данные из файла или начать с чистого листа
function wlOpen() {
  $("v23").innerHTML = `<button class="wlo pri" onclick="wlFile()"><span class="ic">${ic("file")}</span><span class="tx">У меня есть файл данных<small>После переустановки или с другого телефона — всё вернётся из файла</small></span></button>`
    + `<button class="wlo" onclick="cl()"><span class="ic">${ic("plus")}</span><span class="tx">Начать с чистого листа<small>Файл для автосохранения можно создать потом</small></span></button>`
    + `<div class="hint">Файл подключается и позже: Настройки → Файл данных</div>`;
  sv(23, "Добро пожаловать в БЖУ", "Дневник питания: калории, белки, жиры и углеводы"); show()
}
// выбор файла — то же, что «Выбрать существующий файл»; отмена или не тот файл — экран остаётся
const wlFile = () => nfOpen();
