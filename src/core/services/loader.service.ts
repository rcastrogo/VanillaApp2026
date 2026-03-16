import type { ComponentProvider } from "./router.service";
import type { Component, ComponentConstructor, ComponentContext, ComponentCreator, ComponentFactory } from "../../components/component.model";
import type { ModuleNamespace } from "../types";

class ComponentLoaderService {
  
  async resolve(componentProvider: ComponentProvider, ctx: ComponentContext): Promise<Component> {
    let creator: ComponentCreator;
    if (this.isLazy(componentProvider)) {  
      const module = await (componentProvider as () => Promise<ModuleNamespace>)();  
      creator = module.default || 
                Object.values(module).find(exp => typeof exp === 'function');
    } else {
      creator = componentProvider as ComponentCreator;
    }
    return this.instantiate(creator, ctx);
  }

  private instantiate(creator: ComponentCreator, ctx: ComponentContext): Component {
    const isClass = typeof creator === 'function' && /^\s*class\s+/.test(creator.toString());
    if (isClass) {
      return new (creator as ComponentConstructor)(ctx);
    }
    return (creator as ComponentFactory)(ctx);
  }

  private isLazy(componentProvider: ComponentProvider): boolean {
    return typeof componentProvider === 'function' && 
           !/^\s*class\s+/.test(componentProvider.toString()) &&
           (
            componentProvider.toString().includes('import(') || 
            componentProvider.toString().includes('__variableDynamicImport')
          );
  }

  async loadRaw(importPromise: () => Promise<{ default: string }>): Promise<string> {
    const module = await importPromise();
    return module.default;
  }

}

export const loader = new ComponentLoaderService();
