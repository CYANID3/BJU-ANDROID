// Диалоги и запуск приложения
// ask(текст, кнопка, опасное действие, только одна кнопка, заголовок) → Promise<boolean>
function ask(m, y, dg, one, title) {
  return new Promise(ok => {
    const e = $("dg"), Y = $("dgy"), N = $("dgn"), k = ev => { if (ev.key === "Escape") f(false) }, f = v => { e.classList.remove("on"); Y.onclick = N.onclick = null; document.removeEventListener("keydown", k); ok(v) };
    $("dgt").textContent = title || ""; $("dgm").textContent = m; Y.textContent = y || "ОК"; Y.classList.toggle("dg", !!dg); N.style.display = one ? "none" : "";
    Y.onclick = () => f(true); N.onclick = () => f(false); document.addEventListener("keydown", k); e.classList.add("on"); if (dg) vib("ui");
    const a = document.activeElement; if (!isTxtF(a)) Y.focus()
  })
}
const say = m => ask(m, "ОК", 0, 1);
document.addEventListener("visibilitychange", () => { if (document.hidden) return; const n = iso(new Date()); if (n !== today) { const f = cur === today; today = n; if (f) cur = n; if (isOpen) cl(); render() } });
// касание затемнения закрывает лист — только если и нажатие началось на затемнении (лист мог сместиться под пальцем)
let ovDown = 0; $("ov").addEventListener("pointerdown", e => { ovDown = e.target === $("ov") }); $("ov").addEventListener("click", e => { if (e.target === $("ov") && ovDown && Date.now() - oa > 450) xcl() }); addEventListener("keydown", e => { if (e.key === "Escape" && isOpen && !$("dg").classList.contains("on")) xcl() }, true);
try { matchMedia("(prefers-color-scheme:dark)").addEventListener("change", () => applyAc()) } catch (e) { }
// локальная копия была повреждена — восстановить резервную (в APK затем ещё сверяются файлы)
if (LOCAL_BAD && !NATIVE) { try { const b = localStorage.getItem("bju2bak"); if (b && adopt(parseData(b), false)) { store(); setTimeout(() => toast("Данные в памяти были повреждены — восстановлена резервная копия", 0, 6000), 800) } } catch (e) { } }
// APK: заставка держится, пока день не готов — данные прочитаны (initH), системные отступы применены, кадр нарисован
function appUp() { const N = NX(); if (!N || !N.ready) return; const t0 = Date.now(), go = () => { if (!window.BJU_insetsOk && Date.now() - t0 < 1500) return setTimeout(go, 30); requestAnimationFrame(() => requestAnimationFrame(() => N.ready())) }; go() }
// один раз после обновления: убрать стандартные продукты прежних версий, которыми не пользовались — не изменённые, не в
// избранном, не в блюдах, ни разу не записанные. Остальное (и всё своё) остаётся. «Отменить» в уведомлении возвращает список
function b0Clean() {
  try { if (localStorage.getItem("bju_b0")) return; localStorage.setItem("bju_b0", "1") } catch (e) { return }
  const B = new Set(BASE.map(x => JSON.stringify(x))), ing = new Set(), uc = S.uc || {}, fav = S.fav || {};
  S.db.forEach(p => p[5] && (p[5].i || []).forEach(e => ing.add(e.n))); for (const k in S.d) S.d[k].forEach(e => ing.add(e.n));
  const keep = S.db.filter(p => !B.has(JSON.stringify(p)) || fav[p[0]] || uc[p[0]] > 0 || ing.has(p[0]));
  const n = S.db.length - keep.length; if (!n) return;
  lastAdd = lastDel = null; lastDb = S.db; S.db = keep; save();
  setTimeout(() => toast("Убраны стандартные продукты, которыми вы не пользовались: " + n, 1, 8000), 900)
}
applyAc(); render(); Promise.resolve(initH()).finally(() => { scSync(); b0Clean(); appUp() });
{ const m = new URLSearchParams(location.search).get("m"); if (/^[0-5]$/.test(m || "")) { try { history.replaceState(history.state, "", location.pathname) } catch (e) { } op(+m) } }
