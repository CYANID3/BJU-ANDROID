import { defineConfig } from 'vite';

// Номер сборки показывается в разделе «Файл». В CI задаётся через VITE_BUILD.
if (!process.env.VITE_BUILD) {
  const d = new Date();
  process.env.VITE_BUILD = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}`;
}

export default defineConfig({
  // относительные пути: работает и в Capacitor (https://localhost/), и в подпапке GitHub Pages
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020'
  }
});
