import { defineConfig } from 'vite'; 

export default defineConfig({
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