import { build } from 'vite';
await build({
  configFile: false,
  build: {
    target: 'es2022', outDir: 'dist', emptyOutDir: false, copyPublicDir: false,
    lib: { entry: 'api/pages.ts', formats: ['es'], fileName: () => '_worker.js' },
    minify: true,
  },
});
