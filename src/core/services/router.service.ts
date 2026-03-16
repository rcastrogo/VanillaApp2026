import { MESSAGE_APP_VIEW_CHANGE } from "./app-engine.service";
import { pubSub } from "./pubsub.service";
import type { ComponentCreator } from "../../components/component.model";

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
      window.history.pushState(null, route.name, path);
      this.sync();
    }
  }

  sync() {
    const path = window.location.pathname.replace(document.baseURI, '');
    const route = this.getRoute(path || '/');
    if (route) {
      this.currentRoute = route;
      const searchParams = new URLSearchParams(window.location.search);
      route.queryValues = Object.fromEntries(searchParams.entries());
      document.title = route.name;
      // Aquí puedes parsear los query strings si tienes la utilidad pol.parseQueryString
      pubSub.publish(MESSAGE_APP_VIEW_CHANGE, route);
    }
  }
}

export const router = RouterService.getInstance();