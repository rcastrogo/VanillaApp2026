
import { loader } from './loader.service';
import { pubSub } from './pubsub.service';
import { type Route } from './router.service';
import { APP_CONFIG } from '../../app.config';
import { setupComponents } from '../component-registry';
import { initObserver } from '../dom-observer';
import { setupIcons } from '../icons';
import type { BaseComponent } from '../types';

export const MESSAGE_APP_VIEW_CHANGE = 'APP_VIEW_CHANGE';

class AppEngine {

  private container = document.getElementById('app-container');
  private component!: BaseComponent;

  private initEventListeners() {
    pubSub.subscribe<Route>(MESSAGE_APP_VIEW_CHANGE, route => {
      if(route){
        this.renderView(route);
        this.updateLayout(route);        
      }
    });
  }

  private async renderView(route: Route) {
    if (!this.container) return;
    this.component?.destroy?.()
    this.container.innerHTML = '';
    try {
      const viewFactory = await loader.resolve(route.componentProvider, {});
      this.component?.destroy?.(); 
      this.component = viewFactory as BaseComponent;
      this.component.init?.();      
      this.container.innerHTML = ''
      this.container.appendChild(this.component.render());      
      this.component.mounted?.();
    } catch (error) {
      console.error("Error cargando la página:", error);
      this.container.innerHTML = '<p class="text-red-500">Error al cargar la sección.</p>';
    }
  }

  private updateLayout(route: Route) {
    console.log('route', route)
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