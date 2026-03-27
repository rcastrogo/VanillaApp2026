import { router, type ComponentProvider } from "./router.service";

import type { ComponentConstructor } from "@/components/component.model";


export class RouteBuilder {

  private normalizePath(path: string): string {
    return (path || "").replace(/^\/+|\/+$/g, "");
  }

  private buildPathRegex(path: string): RegExp {
    const clean = this.normalizePath(path);
    return clean ? new RegExp(`^/${clean}$`) : /^\/$/;
  }

  add(path: string, componentProvider: ComponentProvider, layout?: ComponentConstructor | null) : this {
    const cleanPath = this.normalizePath(path);
    router.addRoute({
      name : cleanPath || "home",
      path: this.buildPathRegex(cleanPath),
      componentProvider,
      layout: layout
    }); 
    return this;
  }
  
  addNamed(name: string, path: string, componentProvider: ComponentProvider, layout?: ComponentConstructor | null) : this {
    const cleanPath = this.normalizePath(path);
    router.addRoute({
      name,
      path: this.buildPathRegex(cleanPath),
      componentProvider,
      layout: layout
    }); 
    return this;
  }

  root(componentProvider: ComponentProvider, layout? : ComponentConstructor | null): this {
    router.addRoute({
      name: 'home',
      path: /^\/$/,
      componentProvider,
      layout: layout
    });
    return this;
  }

  notFound(componentProvider: ComponentProvider, layout?: ComponentConstructor | null, name = "404"): this {
    router.setFallback(componentProvider, layout, name);
    return this;
  }
}
