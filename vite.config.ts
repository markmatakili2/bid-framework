import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
      },
    },
  },
  appType: 'mpa',
});
