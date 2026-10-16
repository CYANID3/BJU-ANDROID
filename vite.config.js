import { defineConfig } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Номер сборки показывается в разделе «Файл». В CI задаётся через VITE_BUILD.
if (!process.env.VITE_BUILD) {
  const d = new Date();
  process.env.VITE_BUILD = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}`;
}

/**
 * Сборка страницы из частей: маркер <!-- @parts js src/js --> заменяется на один встроенный
 * <script> из всех файлов папки по порядку имён (01-…, 02-…), <!-- @parts css src/css --> — на <style>.
 * Скрипт остаётся одним обычным (не модульным): общие переменные и onclick="…" в разметке работают как раньше.
 */
export function parts(dir) {
  return readdirSync(dir).filter(f => /\.(js|css)$/.test(f)).sort()
    .map(f => readFileSync(join(dir, f), 'utf8').replace(/\n$/, '')).join('\n');
}
export function assemble(html, root = '.') {
  return html.replace(/<!-- @parts (js|css) (\S+) -->/g, (_, kind, dir) => {
    const body = parts(join(root, dir));
    return kind === 'js' ? `<script>\n${body}\n</script>` : `<style>\n${body}\n</style>`;
  });
}
const pagePartsPlugin = {
  name: 'bju-page-parts',
  transformIndexHtml: { order: 'pre', handler: html => assemble(html) },
  // при правке части в dev-режиме — перезагрузить страницу
  handleHotUpdate({ file, server }) {
    if (/[\\/]src[\\/](js|css)[\\/]/.test(file)) { server.ws.send({ type: 'full-reload' }); return []; }
  }
};

export default defineConfig({
  // относительные пути: работает и в Capacitor (https://localhost/), и в подпапке GitHub Pages
  base: './',
  publicDir: 'public',
  plugins: [pagePartsPlugin],
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020'
  }
});
