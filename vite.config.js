import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {           
            if (id.includes('@maptiler')) return 'vendor-maptiler';
            if (id.includes('jquery')) return 'vendor-jquery';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('maplibre-gl')) return 'vendor-maplibre-gl';            
            return 'vendor';
          }
        }
      }
    }
  }
});