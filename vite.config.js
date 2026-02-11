import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
  plugins: [
    {
      name: 'copy-sw',
      closeBundle() {
        try {
          copyFileSync('sw.js', 'dist/sw.js');
          console.log('✅ Copied sw.js to dist/');
        } catch (err) {
          console.warn('⚠️ Failed to copy sw.js:', err.message);
        }
      }
    }
  ]
});