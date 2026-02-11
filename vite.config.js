import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL for production
  base: '/',
  
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Asset handling
    assetsDir: 'assets',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true
      }
    },
    
    // Source maps for debugging
    sourcemap: false,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          vendor: []
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview server
  preview: {
    port: 4173
  },
  
  // Plugins
  plugins: [],
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify('3.0.0')
  }
});
