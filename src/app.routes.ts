import type { ComponentContext } from './components/component.model';
import { router } from './core/services/router.service';
import homePage from './pages/home.page';
import IndexPage from './pages/samples/component-based/index.page';
import TemplatePage from './pages/samples/functional/template.page';

export function configureRouter(){
  router
    .addRoute({ 
      name: 'home', 
      path: /^\/$/, 
      componentProvider: homePage
    })
    .addRoute({ 
      name: 'template', 
      path: /template$/, 
      componentProvider: TemplatePage
    })
    .addRoute({ 
      name: 'index', 
      path: /index$/, 
      componentProvider: IndexPage
    })
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
}
