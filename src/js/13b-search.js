// Поиск продуктов: от точного к примерному. Для каждого слова запроса — лучшее совпадение в названии:
// 0 — название начинается с запроса, 1 — слово начинается, 2 — внутри слова (от 3 букв), 3 — совпала «латинская запись»
// (pepsi = пепси, exponenta = экспонента, coca = кока), 4 — одна опечатка (от 4 букв). Нет совпадения — -1.
// Все слова запроса должны найтись; итог продукта — худшее из его слов. Ничего не сохраняется: меняется только сравнение.
const SCY = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya" };
// «латинская запись»: кириллица → латиница, латиница упрощается по правилам набора — обе стороны дают одно и то же
function srSk(w) {
  let s = ""; for (const ch of w) s += SCY[ch] ?? ch;
  return s.replace(/sch/g, "sh").replace(/ch/g, "č").replace(/kh/g, "h").replace(/ts/g, "c").replace(/^x/, "h").replace(/x/g, "ks").replace(/w/g, "v").replace(/q/g, "k").replace(/ph/g, "f")
    .replace(/c(?=[eiy])/g, "s").replace(/ck/g, "k").replace(/c/g, "k").replace(/j(?=[aeiouy])/g, "i").replace(/j/g, "zh").replace(/y/g, "i").replace(/([a-zč])\1+/g, "$1"); // двойные — только буквы: «119» ≠ «19»
}
// не больше одной правки: лишняя, пропущенная, другая буква или две соседние переставлены
function srD1(a, b) {
  if (a === b) return 0; const la = a.length, lb = b.length; if (Math.abs(la - lb) > 1) return 2; let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) ? 1 : 2;
  return (la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)) ? 1 : 2;
}
// записи названий считаются один раз (ключ — само название: переименовали — посчитается заново)
const SRC = new Map();
function srName(n) { let r = SRC.get(n); if (!r) { if (SRC.size > 4000) SRC.clear(); const ws = W(n); r = { ws, wsk: ws.map(srSk), full: ws.join(" "), flat: ws.join("") }; SRC.set(n, r) } return r }
const srTy = (a, L) => a.length >= 4 && L.some(w => srD1(a, w.slice(0, a.length)) <= 1 || srD1(a, w.slice(0, a.length - 1)) <= 1 || srD1(a, w.slice(0, a.length + 1)) <= 1);
function srWord(t, ts, r) {
  if (r.full.startsWith(t)) return 0; if (r.ws.some(w => w.startsWith(t))) return 1;
  if (t.length >= 3 && r.flat.includes(t)) return 2;
  if (ts && r.wsk.some(w => w.startsWith(ts))) return 3;
  return srTy(t, r.ws) || srTy(ts, r.wsk) ? 4 : -1;
}
// запрос → слова и их записи (один раз на нажатие)
const srQ = q => W(q).map(t => [t, srSk(t)]);
// итог: худшее слово главное (сотни), сумма по словам — при равенстве («греч йог»: «Йогурт греческий» выше «TEOS Греческий йогурт»)
function srScore(n, Q) { const r = srName(n); let m = 0, sum = 0; for (const [t, ts] of Q) { const s = srWord(t, ts, r); if (s < 0) return -1; if (s > m) m = s; sum += s } return m * 100 + sum }
// выделение: только буквы, совпавшие как есть (начало слова или внутри); латинская запись и опечатки — без выделения
function srHl(n, Q) {
  const z = nz(n), m = new Uint8Array(z.length), sep = /[\s,()%.\-]/;
  for (const [t] of Q) { let i = -1; for (let k = z.indexOf(t); k >= 0; k = z.indexOf(t, k + 1)) if (!k || sep.test(z[k - 1])) { i = k; break } if (i < 0 && t.length >= 3) i = z.indexOf(t); if (i >= 0) m.fill(1, i, i + t.length) }
  let o = "", on = 0; for (let k = 0; k < n.length; k++) { if (m[k] !== on) { o += on ? "</b>" : '<b class="hl">'; on = m[k] } o += esc(n[k]) } return on ? o + "</b>" : o;
}
