import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/ 
export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }), // abre automaticamente no navegador após build
  ],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
