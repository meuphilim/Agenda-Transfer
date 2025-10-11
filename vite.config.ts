import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1500, // aumenta o limite para evitar avisos falsos

    rollupOptions: {
      output: {
        manualChunks(id) {
          // separa dependências grandes em chunks específicos
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor'; // fallback geral para outros pacotes
          }
        },
      },
    },
  },
plugins: [
  react(),
  visualizer({ open: true }), // abre automaticamente no navegador após build
],
});

