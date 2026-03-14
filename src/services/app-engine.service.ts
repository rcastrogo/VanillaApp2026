
import { loader } from './loader.service';
import { pubSub } from './pubsub.service';
import { type Route } from './router.service';
import type { BaseComponent } from '../core/types';

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
    this.container.innerHTML = '<div class="loader">Cargando...</div>';
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
    this.initEventListeners();
  }

}

export const appEngine = new AppEngine();