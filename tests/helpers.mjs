// Общие помощники автотестов: статический сервер для www/, телефон Pixel 7 в Chromium, касания через CDP.
import { chromium, devices } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { after } from 'node:test';

const ROOT = path.resolve(process.env.BJU_WWW || 'www');
if (!fs.existsSync(path.join(ROOT, 'index.html'))) throw new Error(`нет сборки ${ROOT}/index.html — сначала npm run build`);

const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
let server, port, browser;

async function start() {
  if (server) return;
  server = http.createServer((q, r) => {
    let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    fs.readFile(p, (e, d) => {
      if (e) { r.writeHead(404); r.end(); return; }
      const t = TYPES[path.extname(p)]; if (t) r.setHeader('Content-Type', t);
      r.end(d);
    });
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  port = server.address().port;
  // локально может стоять готовый Chromium (CHROMIUM_PATH), в CI — тот, что поставил `playwright install`
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
}
after(async () => { await browser?.close(); server?.close(); });

/** Мок нативной части APK (window.BJU_NATIVE): внутренний файл, SAF-файлы, виджет — всё в памяти страницы. */
export const nativeMock = () => {
  window.Capacitor = { isNativePlatform: () => true };
  const P = JSON.parse(sessionStorage.getItem('phone') || '{"local":null,"files":{},"perm":{}}');
  const sv = () => sessionStorage.setItem('phone', JSON.stringify(P));
  window.__P = P; window.__W = []; window.__H = [];
  const mock = {
    native: true, readLocal: async () => P.local, writeLocal: async t => { P.local = t; sv(); }, writeBackup: async () => {}, readLegacy: async () => null,
    haptic: async ms => { window.__H.push(ms); return true; }, bars: async () => {}, widget: async o => { window.__W.push(o); },
    file: {
      available: true,
      create: async n => { const uri = 'content://x/' + n; P.files[uri] = ''; P.perm[uri] = 1; sv(); return { uri, name: n, writable: true }; },
      open: async () => { const uri = window.__pick; P.perm[uri] = 1; sv(); return { uri, name: uri.split('/').pop(), writable: true }; },
      read: async u => { if (!P.perm[u]) throw Error('no access'); return P.files[u]; },
      write: async (u, t) => { if (!P.perm[u]) throw Error('no access'); P.files[u] = t; sv(); },
      check: async u => ({ read: !!P.perm[u], write: !!P.perm[u], name: u.split('/').pop() }),
      release: async u => { delete P.perm[u]; sv(); }
    }
  };
  Object.defineProperty(window, 'BJU_NATIVE', { get: () => mock, set: () => {}, configurable: true });
};

/**
 * Открыть приложение. opts.native — как в APK (мок), opts.data — содержимое localStorage «bju2»,
 * opts.scheme — dark/light. Возвращает помощники; ошибки страницы собираются в errors.
 */
export async function openApp(opts = {}) {
  await start();
  const ctx = await browser.newContext({ ...devices['Pixel 7'], colorScheme: opts.scheme || 'dark', serviceWorkers: 'block' });
  if (opts.native) await ctx.addInitScript(nativeMock);
  if (opts.data) await ctx.addInitScript(d => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('bju2', JSON.stringify(d)); sessionStorage.setItem('seeded', '1'); } }, opts.data);
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(e.message));
  pg.on('console', m => m.type() === 'error' && !/favicon|404/.test(m.text()) && errors.push(m.text()));
  await pg.goto(`http://127.0.0.1:${port}/`);
  await pg.waitForFunction(() => document.querySelector('#app .sum'));
  await pg.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(pg);
  const T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const wait = ms => pg.waitForTimeout(ms);
  return {
    pg, ctx, errors, wait,
    ev: (f, a) => pg.evaluate(f, a),
    /** провести пальцем от (x0,y0) до (x1,y1); end=false — не отпускать */
    async drag(x0, y0, x1, y1, { steps = 10, ms = 14, end = true } = {}) {
      await T('touchStart', x0, y0);
      for (let i = 1; i <= steps; i++) { await T('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await wait(ms); }
      if (end) await T('touchEnd');
    },
    touchEnd: () => T('touchEnd'),
    async tapN(sel, n, pos = { x: 150, y: 30 }) { for (let i = 0; i < n; i++) { await pg.tap(sel, { position: pos }); await wait(90); } },
    close: () => ctx.close()
  };
}

/** Дата ГГГГ-ММ-ДД со сдвигом от сегодня (как в приложении — по местному времени). */
export function day(shift = 0) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + shift);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const entry = (m, n, g, p, f, c) => ({ m, n, g, p, f, c });
