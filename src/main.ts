
import '@maptiler/sdk/dist/maptiler-sdk.css';
import './styles.css';

import { configureRouter } from './app.routes';
import { appEngine } from './core/services/app-engine.service';
import { storage } from './core/storageUtil';

function initApp(){
  appEngine.init();
  // ============================================================================
  // Motrar la pantalla de carga
  // ============================================================================
  if(storage.readValue('shownSplashScreen') === 'true'){  
    const initialRoue = {  
      name: 'Welcome page', 
      path: /.*/, 
      componentProvider: () => import('./pages/splash-screen.page'), 
      layout: null 
    }
    appEngine.handleRoute(initialRoue);
    return;
  }
  configureRouter();
}

document.addEventListener('DOMContentLoaded', initApp);