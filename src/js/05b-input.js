// Ввод чисел своей клавиатурой и «режим замены».
//
// Числовые поля (класс .num: количество, вес, норма, Б/Ж/У продукта, граммы единицы, вес блюда) — с inputmode="none":
// Android не открывает для них системную клавиатуру. Вместо неё у нижнего края листа — своя панель из 12 клавиш
// одной высоты во всех экранах, над клавишами — кнопка действия экрана («Добавить», «Сохранить», «Далее · Жиры»).
// Текстовые поля (поиск, названия, код цвета) — с системной клавиатурой. В каждый момент видна только одна из них:
// касание числа закрывает системную, касание текста убирает свою. Цифры с физической клавиатуры тоже работают.
//
// «Режим замены»: при открытии экрана значение не выделяется как текст — подсвечено всё поле, курсора нет,
// первая нажатая цифра заменяет значение целиком (⌫ — очищает поле). Касание самого поля выходит из режима.

// фокус в поле без прокрутки страницы; rp — сразу в режим замены. Если лист ещё не открыт — в следующем кадре
function fIn(id, rp) { const f = () => { const i = $(id); try { i.focus({ preventScroll: true }) } catch (e) { i.focus() } if (rp) rpOn(i) }; isOpen ? f() : requestAnimationFrame(f) }
function rpOn(i) { if (!i) return; i._rp = 1; i.classList.add("rp"); try { const n = i.value.length; i.setSelectionRange(n, n) } catch (e) { } }
function rpOff(i) { if (!i || !i._rp) return; i._rp = 0; i.classList.remove("rp") }

// ===== своя клавиатура =====
// порядок полей для «Далее» по экранам листа; последнее поле — кнопка экрана сохраняет
const KPO = { 3: ["nn", "np", "nf", "nc"], 4: ["gp", "gf", "gc"] }, KPN = { np: "Белки", nf: "Жиры", nc: "Углеводы", gp: "Белки", gf: "Жиры", gc: "Углеводы" };
// экраны, где клавиатура видна сразу (единственное поле — числовое)
const KPV = new Set([2, 4, 10]);
let kpF = null;
const isNum = el => !!(el && el.tagName === "INPUT" && el.classList.contains("num"));
function kpBuild() {
  const k = d => `<button type="button" data-k="${d}" aria-label="${d}">${d}</button>`;
  $("kp").innerHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(k).join("") + `<button type="button" class="fn" data-k="," aria-label="Запятая">,</button>` + k("0") + `<button type="button" class="fn" data-k="bk" aria-label="Стереть (удерживать — стереть всё)">${ic("back")}</button>`;
  $("kp").hidden = true;
}
function kpShow(on) {
  const sh = shEl(), was = sh.classList.contains("kpo"); sh.classList.toggle("kpo", !!on); $("kp").hidden = !on;
  if (on && !was && isOpen && !RM()) { const k = $("kp"); k.classList.remove("in"); void k.offsetWidth; k.classList.add("in") }
}
// при смене экрана: клавиатура сразу — где поле одно и числовое; в форме продукта и блюда — по касанию числа
function kpView(n) { kpF = null; kpShow(KPV.has(n)); kpLabel() }
// подпись кнопки экрана: «Далее · Жиры» или «Сохранить»
function kpLabel() {
  const v = VWS.find(i => !$("v" + i).hidden), o = KPO[v]; if (!o) return;
  const a = document.activeElement, i = o.indexOf(a && a.id), nx = i >= 0 && i < o.length - 1 ? o[i + 1] : null;
  const b = v === 3 ? $("mkb") : $("sgb");
  b.textContent = nx ? "Далее · " + KPN[nx] : v === 3 ? (ed >= 0 ? "Сохранить" : "Сохранить продукт") : "Сохранить";
}
// кнопка экрана / Enter: следующее поле или сохранить
function kpNext() {
  const v = VWS.find(i => !$("v" + i).hidden), o = KPO[v], a = document.activeElement, i = o ? o.indexOf(a && a.id) : -1;
  if (o && i >= 0 && i < o.length - 1) { vib("ui"); fIn(o[i + 1], 1); return }
  if (v === 3) mk(); else if (v === 4) sg(); else if (v === 2) ad(); else if (v === 10) wSave(); else if (v === 8) dsv()
}
// значение допустимо: цифры и одна запятая; до запятой — не больше data-int (по умолчанию 4), после — data-dec (2)
function kpOk(v, i) { const m = /^(\d*)(,(\d*))?$/.exec(v); return !!m && m[1].length <= (+i.dataset.int || 4) && (m[3] || "").length <= (+i.dataset.dec || 2) }
function kpKey(k) {
  const i = kpF && document.contains(kpF) ? kpF : isNum(document.activeElement) ? document.activeElement : null; if (!i) return;
  let v = i.value, s = i.selectionStart ?? v.length, e = i.selectionEnd ?? v.length;
  if (i._rp) { rpOff(i); s = 0; e = v.length }
  if (k === "clr") { v = ""; s = 0 }
  else if (k === "bk") { if (s === e && s > 0) s--; v = v.slice(0, s) + v.slice(e) }
  else {
    if (k === ",") { if ((v.slice(0, s) + v.slice(e)).includes(",")) return vib("err"); if (s === 0) k = "0," }
    let nv = v.slice(0, s) + k + v.slice(e), ns = s + k.length;
    if (/^0\d/.test(nv)) { nv = nv.slice(1); ns-- }
    if (!kpOk(nv, i)) return vib("err");
    v = nv; s = ns
  }
  vib("kb"); i.value = v; try { i.setSelectionRange(s, s) } catch (x) { }
  i.classList.remove("all"); i.dispatchEvent(new Event("input", { bubbles: true }))
}
(() => {
  kpBuild();
  const kp = $("kp"); let hold = 0;
  // клавиша срабатывает сразу при нажатии (как у системной клавиатуры) и не забирает фокус у поля;
  // удерживать ⌫ — стереть всё значение
  kp.addEventListener("pointerdown", e => {
    const b = e.target.closest("button[data-k]"); if (!b) return; e.preventDefault();
    b.classList.add("dn"); setTimeout(() => b.classList.remove("dn"), 120);
    const k = b.dataset.k; kpKey(k);
    clearTimeout(hold); if (k === "bk") hold = setTimeout(() => { kpKey("clr"); vib("del") }, 480);
  });
  const up = () => clearTimeout(hold); kp.addEventListener("pointerup", up); kp.addEventListener("pointercancel", up); kp.addEventListener("pointerleave", up);
  kp.addEventListener("mousedown", e => e.preventDefault());
  // какое поле в фокусе — такая и клавиатура
  document.addEventListener("focusin", e => {
    const t = e.target; if (!t || t.tagName !== "INPUT" || !shEl().contains(t)) return;
    if (isNum(t)) { clearTimeout(kpHide); kpF = t; kpShow(true); requestAnimationFrame(ensureVis) }
    else if (shEl().classList.contains("kpo")) {
      kpF = null;
      // текст: своя клавиатура уходит, когда системная начала подниматься (в APK) — низ листа не «проваливается» между ними
      clearTimeout(kpHide); if (NATIVE && window.BJU_NATIVE && window.BJU_NATIVE.native) kpHide = setTimeout(() => kpShow(false), 320); else kpShow(false)
    }
    kpLabel()
  }, true);
})();
let kpHide = 0;
// физическая клавиатура и вставка в числовых полях: только цифры, запятая (точка становится запятой)
document.addEventListener("beforeinput", e => {
  const i = e.target; if (!isNum(i)) return; const t = e.inputType || "";
  if (t === "insertText" && e.data != null) { e.preventDefault(); [...e.data.replace(/\./g, ",")].forEach(c => /[\d,]/.test(c) && kpKey(c)) }
  else if (t.startsWith("delete") && e.cancelable) { e.preventDefault(); kpKey("bk") }
  else if ((t === "insertFromPaste" || t.startsWith("insert")) && e.cancelable) e.preventDefault()
}, true);
// касание поля: обычное выделение значения; дальнейшие касания — стандартный курсор
document.addEventListener("pointerup", e => { const i = e.target; if (!i || !i._rp || i.tagName !== "INPUT") return; rpOff(i); setTimeout(() => { try { i.select() } catch (_) { } }, 0) }, true);
document.addEventListener("keydown", e => { const i = e.target; if (i && i._rp && /^Arrow|^Home|^End/.test(e.key)) rpOff(i) }, true);
document.addEventListener("focusout", e => rpOff(e.target), true);
// поле ввода: значение выделено целиком — курсор прячется (класс .all), начали печатать или сдвинули курсор — снова виден
(() => {
  const chk_ = e => { const i = e.target; if (!i || i.tagName !== "INPUT") return; try { const n = i.value.length; i.classList.toggle("all", n > 0 && i.selectionStart === 0 && i.selectionEnd === n) } catch (_) { } };
  ["select", "input", "keyup", "pointerup", "focusin"].forEach(t => document.addEventListener(t, chk_, true)); document.addEventListener("selectionchange", () => chk_({ target: document.activeElement }));
  document.addEventListener("focusout", e => { if (e.target && e.target.classList) e.target.classList.remove("all") }, true)
})();

// единица («г», «кг», «шт») стоит сразу за числом в крупном поле значения, а не у края поля
const vfCtx = document.createElement("canvas").getContext("2d");
function vfUnit(i) {
  const f = i && i.closest(".vf"); if (!f || f.classList.contains("sm")) return; const u = f.querySelector("span"); if (!u) return; if (f.classList.contains("un")) { u.style.left = u.style.right = u.style.transform = ""; return }
  const cs = getComputedStyle(i); vfCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const w = vfCtx.measureText(i.value || i.placeholder || "0").width + (parseFloat(cs.letterSpacing) || 0) * (i.value || "0").length;
  u.style.right = "auto"; u.style.left = Math.round(i.offsetLeft + i.offsetWidth / 2 + w / 2 + 6) + "px"; u.style.transform = "translateY(-30%)";
}
document.addEventListener("input", e => { if (isNum(e.target)) vfUnit(e.target) }, true);
document.addEventListener("focusin", e => { if (isNum(e.target)) vfUnit(e.target) }, true);
