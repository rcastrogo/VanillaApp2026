import { AppMessages } from "./app-engine.service";
import { pubSub } from "./pubsub.service";
import type { ComponentConstructor, ComponentCreator } from "../../components/component.model";
import type { NavigateEventArg } from "../types";

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
  layout?: ComponentConstructor | null;
}

class RouterService {

  private static instance: RouterService;

  public routes: Route[] = [];
  public currentRoute?: Route;
  private fallbackRoute?: Route;

  private constructor() {
    window.onpopstate = ()=> this.sync();
    pubSub.subscribe<NavigateEventArg>(AppMessages.Router.Navigate, arg => {
      if (typeof arg === 'string') {
        this.navigateTo(arg);
      } else if(arg) {       
        this.navigateTo(arg.args[0]);  
      }
    });
  }

  static getInstance(): RouterService {
    if (!RouterService.instance) RouterService.instance = new RouterService();
    return RouterService.instance;
  }

  addRoute(route: Route): this {
    this.routes.push(route);
    return this;
  }

  setFallback(componentProvider: ComponentProvider, layout?: ComponentConstructor | null, name = "404"): this {
    this.fallbackRoute = {
      name,
      path: /^.*$/,
      componentProvider,
      layout: layout ?? null
    };
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
    // Cambiado: siempre navega y deja que sync resuelva (ruta o fallback)
    window.history.pushState(null, "", path);
    this.sync();
  }

  sync() {
    // const path = window.location.pathname.replace(document.baseURI, '');
    const path = window.location.pathname || "/";
    const route = this.getRoute(path);
    const resolvedRoute = route ?? this.fallbackRoute;
    if (resolvedRoute) {
      this.currentRoute = route;
      const searchParams = new URLSearchParams(window.location.search);
      resolvedRoute.queryValues = Object.fromEntries(searchParams.entries());
      document.title = resolvedRoute.name;
      // Aquí puedes parsear los query strings si tienes la utilidad pol.parseQueryString
      pubSub.publish(AppMessages.Router.ViewChanged, resolvedRoute);
    }
  }
}

export const router = RouterService.getInstance();
