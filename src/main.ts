
import '@maptiler/sdk/dist/maptiler-sdk.css';
import './styles.css';

import { configureRouter } from './app.routes';
import { appEngine } from './core/services/app-engine.service';

function initApp(){
  appEngine.init();  
  configureRouter();
}

document.addEventListener('DOMContentLoaded', initApp);