import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // keep the PDF libraries out of the main bundle; they load on first export
        manualChunks(id) {
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
});
