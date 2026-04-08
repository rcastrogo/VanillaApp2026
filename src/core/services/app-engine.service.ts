
import { loader } from './loader.service';
import { pubSub } from './pubsub.service';
import { type Route } from './router.service';
import { APP_CONFIG } from '../../app.config';
import DefaultLayout from '../../pages/layouts/default.layout';
import { setupComponents } from '../component-registry';
import { $ } from '../dom';
import { initObserver } from '../dom-observer';
import { setupIcons } from '../icons';
import { setupReports } from '../report-registry';
import { BaseComponent } from '../types';

import type { ComponentConstructor } from '@/components/component.model';

class LayoutManager {

  private currentLayoutClass: ComponentConstructor | null = null;
  private currentLayoutInstance: BaseComponent | null = null;

  renderLayout(route: Route, container: HTMLElement): HTMLElement {
    const LayoutClass = route.layout === null ? null : (route.layout || DefaultLayout);
    if (this.currentLayoutClass !== LayoutClass) {
      this.currentLayoutInstance?.destroy?.();
      this.currentLayoutClass = LayoutClass;
      if (LayoutClass) {
        this.currentLayoutInstance = new LayoutClass({}) as BaseComponent;
        container.innerHTML = '';
        this.currentLayoutInstance.init?.();
        const routeElement = BaseComponent.renderAndBind(this.currentLayoutInstance);
        if (routeElement) {
          container.appendChild(routeElement);
        }
        this.currentLayoutInstance.mounted?.();
      } else {
        this.currentLayoutInstance = null;
        container.innerHTML = '';
      }
    }
    const outlet = LayoutClass ? $('#router-outlet', container).one() : container;
    if (!outlet) throw new Error("No outlet");
    return outlet;
  }
}

class ViewRenderer {

  private currentComponent: BaseComponent | null = null;
  private cache = new Map<string, BaseComponent>();

  async render(route: Route, outlet: HTMLElement) {
    const cacheKey = route.name;
    let component: BaseComponent;
    // ===============================================================================
    // Si la ruta tiene keepAlive y el componente ya está en cache, reutilizarlo
    // ===============================================================================
    if (route.keepAlive && this.cache.has(cacheKey)) {
      component = this.cache.get(cacheKey)!;
    } 
    // ===============================================================================
    // Si no, cargar el componente normalmente
    // ===============================================================================
    else {
      component = await loader.resolve(route.componentProvider, {}) as BaseComponent;
      if (route.keepAlive) {
        this.cache.set(cacheKey, component);
      }
    }
    // ===============================================================================
    // Si hay un componente actual diferente al nuevo, destruirlo (si no es keepAlive)
    // ===============================================================================  
    if (this.currentComponent && this.currentComponent !== component) {
      if (!route.keepAlive) this.currentComponent.destroy?.();
    }
    outlet.innerHTML = '';
    this.currentComponent = component;
    // ===============================================================================
    // Si el componente ya tiene un elemento renderizado reutilizarlo
    // ===============================================================================  
    if(this.currentComponent.element) {
      outlet.appendChild(this.currentComponent.element);
      return;
    }
    // ===============================================================================
    // Inicializar, renderizar y montar el nuevo componente
    // ===============================================================================
    this.currentComponent.init?.(); 
    const routeElement = BaseComponent.renderAndBind(component);
    if(routeElement){
      outlet.appendChild(routeElement);
    } 
    this.currentComponent.mounted?.();
  }
}

class TransitionManager {
  async transition(outlet: HTMLElement, renderFn: () => Promise<void>) {
    outlet.classList.add('route-exit-active');
    await this.wait(350);
    await renderFn();
    outlet.classList.remove('route-exit-active');    
    outlet.classList.add('route-enter');
    
    outlet.getBoundingClientRect();

    requestAnimationFrame(() => {
      outlet.classList.add('route-enter-active');
      outlet.classList.remove('route-enter');
    });
    await this.wait(300);
    outlet.classList.remove('route-enter-active');
  }
  wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}

class AppEngine {

  private container = document.getElementById('app-container');
  private renderer = new ViewRenderer();
  private layoutManager = new LayoutManager();
  private transitionManager = new TransitionManager();

  private initEventListeners() {
    pubSub.subscribe<Route>(APP_CONFIG.messages.router.viewChanged, route => {
      if(route) this.handleRoute(route);     
    });
  }

  async handleRoute(route: Route) {
    if (!this.container) return;
    try {
      pubSub.publish(APP_CONFIG.messages.router.loading);
      const outlet = this.layoutManager.renderLayout(route, this.container);
      await this.transitionManager.transition(outlet, async () => {
        await this.renderer.render(route, outlet);
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
      pubSub.publish(APP_CONFIG.messages.router.loaded);
    } catch (error) {
      pubSub.publish(APP_CONFIG.messages.router.error);
      console.error(error);
    }
  }

  init() {
    console.log('AppEngine init');
    setupIcons(APP_CONFIG.icons);
    setupComponents(APP_CONFIG.components);
    setupReports(APP_CONFIG.reports);
    this.initEventListeners();
    initObserver();
  }

}

export const appEngine = new AppEngine();