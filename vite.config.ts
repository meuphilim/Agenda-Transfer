import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@heroicons/react', '@headlessui/react'],
          utils: ['date-fns', 'yup'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          toast: ['react-toastify'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    target: 'es2015',
    cssTarget: 'es2015',
    reportCompressedSize: true,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
  },
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
  css: {
    devSourcemap: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
