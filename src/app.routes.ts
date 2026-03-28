

import { RouteBuilder } from './core/services/route-builder';
import { router } from './core/services/router.service';
import homePage from './pages/home.page';
import AdminLayout from './pages/layouts/admin.layout';
import { asyncLoaderSample } from './pages/loaders/loaders';
import IndexPage from './pages/samples/component-based/index.page';
import TemplatePage from './pages/samples/functional/template.page';
import testPage from './pages/test.page';

export function configureRouter(){

  const routeBuilder = new RouteBuilder();
  routeBuilder
    .root(homePage)
    .add('home', homePage)
    .add('test', testPage, null)
    .add('template', TemplatePage)
    .add('index', IndexPage)
    .add('index-1', IndexPage, null)
    .add('index-2', IndexPage, AdminLayout)
    .add('extend-base-component', () => import('./pages/samples/component-based/base-component.page') )
    .add('about', () => import('./pages/samples/functional/about.page') )
    .add('dashboard', () => import('./pages/samples/functional/dashboard.page') )    
    .add('simpson', () => import('./components/test/the-simpsons-component') )
    .addNamed('IndexPage', 'index', IndexPage)
    .add('usuarios', asyncLoaderSample)
    .add('component/test/list', () => import('./components/test/user-list.component'))
    .add('landing', () => import('./features/landing/landing.page'))
    .notFound(() => import('./pages/not-found.page'));

  router.addRoute({
    name: 'admin', 
    path: /^\/admin(\/.*)?$/,
    componentProvider: () => import('./pages/samples/functional/about.page'),
    layout: AdminLayout
  });

  router.sync();
  
}