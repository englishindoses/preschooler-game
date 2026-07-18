import { defineConfig } from 'vite';

// base: './' keeps asset paths relative, so the built game works both at a
// domain root and in a GitHub Pages subfolder without extra config.
export default defineConfig({
  base: './',
  server: {
    open: true,
  },
  build: {
    // Output the finished, browser-ready files into docs/ so GitHub Pages can
    // serve them directly (Pages set to "deploy from branch: main /docs").
    // GitHub only hosts these built files — no build happens on GitHub.
    outDir: 'docs',
    emptyOutDir: true,
  },
});
