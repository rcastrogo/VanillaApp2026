import { MESSAGE_APP_VIEW_CHANGE } from "./app-engine.service";
import { pubSub } from "./pubsub.service";
import type { Component } from "../components/component.model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentContext = any; 
// Un constructor que devuelve un Component
export type ComponentConstructor = new (ctx: ComponentContext) => Component;
// Una función que devuelve un Component
export type ComponentFactory = (ctx: ComponentContext) => Component;
// El "Creador" puede ser la Clase o la Función
export type ComponentCreator = ComponentConstructor | ComponentFactory;
// El controlador de la ruta puede ser el Creador directo o la Promesa (lazy)
export type ComponentProvider = 
  | ComponentCreator 
  | (() => Promise<{ default: ComponentCreator } | Record<string, ComponentCreator>>);

export interface Route {
  name: string;
  path: RegExp;
  componentProvider: ComponentProvider; 
  isView?: boolean;
  params?: string[];
  queryValues?: Record<string, string>;
}

class RouterService {

  private static instance: RouterService;

  public routes: Route[] = [];
  public currentRoute?: Route;

  private constructor() {
    window.onpopstate = () => this.sync();
  }

  static getInstance(): RouterService {
    if (!RouterService.instance) RouterService.instance = new RouterService();
    return RouterService.instance;
  }

  addRoute(route: Route): this {
    this.routes.push(route);
    return this;
  }

  private getRoute(urlPath: string): Route | undefined {
    for (const route of this.routes) {
      const match = route.path.exec(urlPath);
      if (match) {
        route.params = [...match];
        return route;
      }
    }
    return undefined;
  }

  navigateTo(path: string) {
    const route = this.getRoute(path);
    if (route) {
      window.history.pushState('', path, path);
      this.sync();
    }
  }

  sync() {
    const path = window.location.pathname.replace(document.baseURI, '');
    const route = this.getRoute(path || '/');
    if (route) {
      this.currentRoute = route;
      // Aquí puedes parsear los query strings si tienes la utilidad pol.parseQueryString
      pubSub.publish(MESSAGE_APP_VIEW_CHANGE, route);
    }
  }
}

export const router = RouterService.getInstance();