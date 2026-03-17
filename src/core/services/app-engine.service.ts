
import { loader } from './loader.service';
import { pubSub } from './pubsub.service';
import { type Route } from './router.service';
import { APP_CONFIG } from '../../app.config';
import DefaultLayout from '../../pages/default.layout';
import { setupComponents } from '../component-registry';
import { initObserver } from '../dom-observer';
import { setupIcons } from '../icons';
import { BaseComponent } from '../types';

export const MESSAGE_APP_VIEW_CHANGE = 'APP_VIEW_CHANGE';

class AppEngine {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentLayoutClass: any | null = null;
  private currentLayoutInstance: BaseComponent | null = null;

  private container = document.getElementById('app-container');
  private component!: BaseComponent;

  private initEventListeners() {
    pubSub.subscribe<Route>(MESSAGE_APP_VIEW_CHANGE, route => {
      if(route){
        this.renderView(route);     
      }
    });
  }

  // private async renderView2(route: Route) {
  //   if (!this.container) return;

  //   try {
  //     const LayoutClass = route.layout || DefaultLayout;

  //     if (this.currentLayoutClass !== LayoutClass) {
  //       this.currentLayoutInstance?.destroy?.();
  //       this.currentLayoutClass = LayoutClass;      
  //       this.currentLayoutInstance = new LayoutClass({}) as BaseComponent;
  //       this.container.innerHTML = '';
  //       this.container.appendChild(this.currentLayoutInstance.render());           
  //       this.currentLayoutInstance.mounted?.();
  //     }
  //     const outlet = this.container.querySelector('#router-outlet') as HTMLElement;
  //     const renderTarget = outlet || this.container;
  //     const viewFactory = await loader.resolve(route.componentProvider, {});
  //     this.component?.destroy?.();
  //     this.component = viewFactory as BaseComponent;
  //     this.component.init?.();
  //     renderTarget.innerHTML = ''; 
  //     renderTarget.appendChild(this.component.render());    
  //     this.component.mounted?.();

  //   } catch (error) {
  //     console.error("Error cargando la página:", error);
  //     this.container.innerHTML = '<p class="text-red-500">Error al cargar la sección.</p>';
  //   }
  // }

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
          this.container.appendChild(this.currentLayoutInstance.render());
          this.currentLayoutInstance.mounted?.();
        } else {
          this.currentLayoutInstance = null;
          this.container.innerHTML = '';
        }
      }

      const outlet = LayoutClass 
        ? this.container.querySelector('#router-outlet') as HTMLElement 
        : this.container;

      if (!outlet) throw new Error("No se encontró el #router-outlet en el layout");

      const viewFactory = await loader.resolve(route.componentProvider, {});
      this.component?.destroy?.();
      this.component = viewFactory as BaseComponent;      
      outlet.innerHTML = '';
      // outlet.appendChild(this.component.render()); 
      const element = this.component.render();
      BaseComponent.bind(this.component, element);
      outlet.appendChild(element);
      this.component.init?.();
      this.component.mounted?.();

    } catch (error) {
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