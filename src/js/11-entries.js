// Двойное касание записи (изменить), копирование, удаление и отмена, уведомления
// Изменение — двойным касанием: одиночный свайп по строке листает дни, поэтому изменение не должно срабатывать от случайного касания
let lt = 0, lti = -1; function tp(i) { const n = Date.now(); if (lti === i && n - lt < 500) { lt = 0; lti = -1; vib("ui"); ee(i) } else { lt = n; lti = i } }
addEventListener("pointerup", e => { if (isOpen || e.button > 0) return; const t = e.target; if (!t.closest || t.closest("button")) return; const it = t.closest("#app .it"); if (it) tp(+it.dataset.i) });
// «Повторить вчерашний день?» → «Нет»: больше не предлагать для этого дня (помним последние 60 отказов)
function ncp() { S.ncp = [cur, ...(S.ncp || []).filter(x => x !== cur)].slice(0, 60); saveq(); vib("ui"); const b = $("app").querySelector(".bn"); if (b) moOut(b, render); else render() }
function cpy(k) { S.d[cur] = (S.d[k] || []).map(e => ({ ...e })); vib("save"); save(); render(); toast("Скопировано записей: " + S.d[cur].length) }
function del(i) { const [e] = S.d[cur].splice(i, 1); lastAdd = lastDb = null; lastDel = { e, i, k: cur }; vib("del"); save(); render(); toast("Удалено: " + e.n, 1) }
// «Отменить» в уведомлении: вернуть удалённую запись, убрать только что добавленную или вернуть список продуктов до слияния
let lastAdd = null;
function undo() {
  vib("del");
  // «Отменить» в уведомлении о нижней панели — только пока на экране именно оно (не старое)
  if (navUndo && $("tm").textContent === navUndo.m) { const o = navUndo.v; navUndo = null; $("tt").classList.remove("on"); return navSave(o) }
  if (lastDb) { S.db = lastDb; lastDb = null; save(); if (isOpen && !$("v1").hidden) lst(); $("tt").classList.remove("on"); return }
  if (lastAdd) { const { o, k } = lastAdd, E = S.d[k] || [], j = E.indexOf(o); lastAdd = null; if (j >= 0) { E.splice(j, 1); save(); render() } $("tt").classList.remove("on"); return }
  if (!lastDel) return; const { e, i, k } = lastDel; (S.d[k] = S.d[k] || []).splice(i, 0, e); lastDel = null; save(); render(); $("tt").classList.remove("on")
}
function toast(m, u, ms) { $("tm").textContent = m; $("tt").querySelector("button").style.display = u ? "" : "none"; $("tt").classList.add("on"); clearTimeout(tmr); tmr = setTimeout(() => $("tt").classList.remove("on"), ms || 4500) }
