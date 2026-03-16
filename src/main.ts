
import './styles.css';

import { configureRouter } from './app.routes';
import { appEngine } from './core/services/app-engine.service';
import { router } from './core/services/router.service';

function initApp(){
  appEngine.init();  
  configureRouter();
  router.sync();
}

document.addEventListener('DOMContentLoaded', initApp);