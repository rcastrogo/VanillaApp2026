
import { loader } from './loader.service';
import { pubSub } from './pubsub.service';
import { type Route } from './router.service';
import { APP_CONFIG } from '../../app.config';
import DefaultLayout from '../../pages/layouts/default.layout';
import { setupComponents } from '../component-registry';
import { initObserver } from '../dom-observer';
import { setupIcons } from '../icons';
import { BaseComponent } from '../types';

export const AppMessages = {
  Router: {
    ViewChanged: 'router:view-changed',
    Loading:     'router:loading',
    Loaded:      'router:loaded',
    Error:       'router:error'
  },
  Auth: {
    Login:       'auth:login',
    Logout:      'auth:logout'
  }
} as const;

class AppEngine {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentLayoutClass: any | null = null;
  private currentLayoutInstance: BaseComponent | null = null;

  private container = document.getElementById('app-container');
  private component!: BaseComponent;

  private initEventListeners() {
    pubSub.subscribe<Route>(AppMessages.Router.ViewChanged, route => {
      if(route) this.renderView(route);     
    });
  }

  private async renderView(route: Route) {
    if (!this.container) return;

    try {
      const LayoutClass = route.layout === null ? null : (route.layout || DefaultLayout);
   
      if (this.currentLayoutClass !== LayoutClass) {
        this.currentLayoutInstance?.destroy?.();
        this.currentLayoutClass = LayoutClass;
        if (LayoutClass) {
          this.currentLayoutInstance = new LayoutClass({}) as BaseComponent;
          this.container.innerHTML = '';
          this.currentLayoutInstance.init?.();
          this.container.appendChild(
            BaseComponent.renderAndBind(this.currentLayoutInstance)
          );
          this.currentLayoutInstance.mounted?.();
        } else {
          this.currentLayoutInstance = null;
          this.container.innerHTML = '';
        }
      }

      const outlet = LayoutClass ? this.container.querySelector('#router-outlet') : this.container;  
      if (!outlet) throw new Error("No se encontró el #router-outlet en el layout");

      requestAnimationFrame(async () => {
        pubSub.publish(AppMessages.Router.Loading)
        const viewFactory = await loader.resolve(route.componentProvider, {}) as BaseComponent;
        this.component?.destroy?.();
        this.component = viewFactory;      
        this.component.init?.();
        outlet.innerHTML = '';         
        outlet.appendChild(
          BaseComponent.renderAndBind(this.component)
        );
        this.component.mounted?.();
        pubSub.publish(AppMessages.Router.Loaded)           
      });

    } catch (error) {
      pubSub.publish(AppMessages.Router.Error)
      console.error("Router Error:", error);
    }
  }

  init() {
    console.log('AppEngine init');
    setupIcons(APP_CONFIG.icons);
    setupComponents(APP_CONFIG.components);
    this.initEventListeners();
    initObserver();
  }

}

export const appEngine = new AppEngine();