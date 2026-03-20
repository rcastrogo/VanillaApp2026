import { defineConfig } from 'vite'; // <--- ESTA ES LA LÍNEA QUE FALTA

export default defineConfig({
  build: {
    // Esto quita el warning visual de la consola
    chunkSizeWarningLimit: 1500, 
    
    rollupOptions: {
      output: {
        // Esto separa las librerías pesadas en archivos distintos
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // console.log('📦 Empaquetando dependencia:', id.split('node_modules/')[1].split('/')[0]);            
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