import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import surfaceIndexPlugin from './tools/design-library/surface-vite-plugin.mjs';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));
const appRoot = fileURLToPath(new URL('./app', import.meta.url));

export default defineConfig({
  root: appRoot,
  plugins: [react(), surfaceIndexPlugin()],
  server: {
    fs: {
      allow: [repositoryRoot],
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
  },
});
