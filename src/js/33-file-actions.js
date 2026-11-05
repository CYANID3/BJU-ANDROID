// «Файл данных» (APK): «Начать дневник заново» (новый файл без записей, что взять с собой, удалить ли старый)
// и «Отключить файл» с выбором — оставить данные в приложении или очистить его (продукты можно оставить)
let RS = null, OF = null;
// новое состояние: дневник, вес и заметки — пустые; k.p — продукты и блюда (с избранным и статистикой выбора),
// k.g — норма, k.s — настройки и профиль. Остальное — как в только что установленном приложении (список продуктов пуст)
function freshS(k) {
  const c = JSON.parse(JSON.stringify(S)), o = { v: STATE_VER, g: k.g ? c.g : { p: 120, f: 70, c: 250 }, d: {}, wt: {}, nt: {}, set: k.s ? c.set || {} : {}, saved: Date.now(), dirty: 0 };
  if (k.p) Object.assign(o, { db: c.db, fav: c.fav || {}, uc: c.uc || {}, lg: c.lg || {}, lu: c.lu || {}, rc: c.rc || [] }); else o.db = [];
  return o;
}
const fsProd = () => { const n = S.db.filter(p => !p[5]).length, d = S.db.length - n; return n + " " + plural(n, "продукт", "продукта", "продуктов") + (d ? " · " + d + " " + plural(d, "блюдо", "блюда", "блюд") : "") };
const fsDays = () => { const n = dnc(S.d); return n + " " + plural(n, "день", "дня", "дней") + " с записями" };
// строка-галочка: выбор хранится в obj[k]; переключается на месте, без перерисовки листа
const cbRow = (obj, nm, k, t, d, dg) => `<button class="row cbr${obj[k] ? " ck" : ""}${dg ? " dgc" : ""}" role="checkbox" aria-checked="${!!obj[k]}" onclick="cbT(this,${nm},'${k}')"><span class="ckb">${ic("check")}</span><span class="tx">${t}${d ? `<small>${esc(d)}</small>` : ""}</span></button>`;
function cbT(el, obj, k) { obj[k] = obj[k] ? 0 : 1; el.classList.toggle("ck", !!obj[k]); el.setAttribute("aria-checked", !!obj[k]); vib("ui"); if (obj === OF) ofBtn() }

function rsOpen() {
  RS = { p: 1, g: 1, s: 1, del: 0 };
  $("v21").innerHTML = `<div class="grp">${cbRow(RS, "RS", "p", "Продукты и блюда", fsProd())}${cbRow(RS, "RS", "g", "Норма на день", S.g.p + " · " + S.g.f + " · " + S.g.c + " г")}${cbRow(RS, "RS", "s", "Настройки и профиль", "Тема, панель, имя и картинка")}</div>`
    + (MF ? `<div class="grp" style="margin-top:var(--gap)">${cbRow(RS, "RS", "del", "Удалить старый файл", MF.name + " · " + fsDays(), 1)}</div>` : "")
    + `<div class="hint">Записи, вес и заметки в новый файл не попадут.${MF ? " Если старый файл не удалять — они останутся в нём." : ""} Перед этим сохранится резервная копия.</div>`;
  sv(21, "Начать дневник заново", "Новый файл · что взять с собой"); show()
}
async function rsGo() {
  const N = NX(); if (!N || !N.file.available) return say("Выбор файла недоступен в этой сборке");
  const o = freshS(RS), old = MF, del = RS.del; let r;
  try { r = await N.file.create("bju-data.json") } catch (e) { return }
  try { await N.file.write(r.uri, JSON.stringify(toFile(o), null, 2)) } catch (e) { return say("Не удалось записать в файл «" + r.name + "»") }
  bk(); let tail = "";
  if (del && old && old.uri !== r.uri) tail = (await N.file.remove(old.uri).catch(() => false)) ? " · старый файл удалён" : " · старый файл удалить не удалось";
  lastAdd = lastDel = lastDb = null; adopt(o); setMF({ uri: r.uri, name: r.name }); store(); await nativeFlush();
  cl(); render(); vib("save"); toast("Дневник начат заново · «" + r.name + "»" + tail, 0, 6000)
}

// «Отключить файл»: что будет с данными в приложении. Сам файл не удаляется и не меняется
function nfOff() {
  if (!MF) return; OF = { m: "keep", p: 1 };
  const opt = (m, t, d) => `<button class="row${OF.m === m ? " on" : ""}" role="radio" data-m="${m}" aria-checked="${OF.m === m}" onclick="ofSet('${m}')"><span class="tx">${t}<small>${d}</small></span><span class="ok">${ic("check")}</span></button>`;
  $("v22").innerHTML = `<div class="grp" role="radiogroup" aria-label="Что будет с данными">${opt("keep", "Оставить данные", "Дневник продолжится в приложении")}${opt("clear", "Очистить приложение", "Всё останется в файле")}<div id="ofp" class="ofp" hidden>${cbRow(OF, "OF", "p", "Кроме продуктов", fsProd())}</div></div>`
    + `<div class="hint">Файл на телефоне не удаляется и не меняется — его можно снова открыть через «Переключиться на другой файл».</div>`;
  ofBtn(); sv(22, "Отключить файл?", MF.name); show()
}
// галочка «Кроме продуктов» появляется и пропадает — лист меняет высоту плавно (край и шапка едут вместе)
function ofSet(m) { if (OF.m === m) return; OF.m = m; vib("ui"); shResize(() => { $("v22").querySelectorAll("[data-m]").forEach(b => { const on = b.dataset.m === m; b.classList.toggle("on", on); b.setAttribute("aria-checked", on) }); ofBtn() }) }
function ofBtn() { const c = OF.m === "clear"; $("ofp").hidden = !c; $("ofok").textContent = c ? "Отключить и очистить" : "Отключить" }
async function offGo() {
  if (!MF) return fp(); const n = MF.name, c = OF.m === "clear";
  if (c) { bk(); lastAdd = lastDel = lastDb = null; adopt(freshS({ p: OF.p })) }
  setMF(null); store(); await nativeFlush(); cl(); render(); vib("save");
  toast(c ? "Файл «" + n + "» отключён · приложение очищено" : "Файл «" + n + "» отключён · данные остались в приложении", 0, 5000)
}
