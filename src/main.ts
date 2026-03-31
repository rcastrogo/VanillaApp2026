
import '@maptiler/sdk/dist/maptiler-sdk.css';
import './styles.css';


import { configureRouter } from './app.routes';
import { appEngine } from './core/services/app-engine.service';

function initApp(){
  appEngine.init();
  configureRouter();
  // ============================================================================
  // Simulamos una carga inicial de 3 segundos para mostrar la pantalla de carga
  // ============================================================================
  // const initialRoue = { 
  //   name: 'Welcome page', 
  //   path: /.*/, 
  //   componentProvider: () => import('./pages/splash-screen.page'), 
  //   layout: null 
  // }
  // appEngine.handleRoute(initialRoue);
}

document.addEventListener('DOMContentLoaded', initApp);