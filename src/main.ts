
import './styles.css';

import { initObserver } from './core/dom-observer';
import homePage from './pages/home.page';
import IndexPage from './pages/samples/component-based/index.page';
import { appEngine } from './services/app-engine.service';
import { router, type ComponentContext } from './services/router.service';

function configureRouter(){
  router
    .addRoute({ 
      name: 'home', 
      path: /^\/$/, 
      componentProvider: homePage
    })
    .addRoute({ 
      name: 'index', 
      path: /index$/, 
      componentProvider: IndexPage
    })
    // .addRoute({ 
    //   name: 'index-lazy', 
    //   path: /index-lazy/, 
    //   componentProvider:  () => import('./pages/index.page') 
    // })
    .addRoute({ 
      name: 'extend-base-component', 
      path: /extend-base-component$/, 
      componentProvider: () => import('./pages/samples/component-based/base-component.page') 
    })
    .addRoute({ 
      name: 'about', 
      path: /about$/, 
      componentProvider: () => import('./pages/samples/functional/about.page') 
    })
    .addRoute({
      name: 'dashboard',
      path: /dashboard$/,
      componentProvider: () => import('./pages/samples/functional/dashboard.page')
    })
    // =====================================================================
    // Carga asíncrona total de la página, incluyendo su lógica de negocio
    // =====================================================================
    .addRoute({
      name: 'usuarios',
      path: /usuarios$/,
      componentProvider: async () => {
        const [pageModule, logicModule] = await Promise.all([
          import('./pages/samples/async/terms.page'),
          import('./pages/samples/async/terms.logic')
        ]);
        const users = await logicModule.loadUsers();
        console.log('Usuarios cargados en el router:', users);
        const creator = (ctx: ComponentContext) => {
          const extendedCtx = { ...ctx, users };
          return new pageModule.default(extendedCtx);
        };
        return { default: creator };
      }      
    });

  router.sync();
}

function initApp(){

  appEngine.init();  
  configureRouter();
  initObserver();
  document.body.style.visibility = 'visible';

  // setTimeout(() => {
  //   router.navigateTo('/index');
  // }, 5_000);
}

document.addEventListener('DOMContentLoaded', initApp);