import type { ComponentConstructor, ComponentFactory, ComponentProvider } from "./router.service";
import type { Component, ComponentCreator } from "../components/component.model";
import type { ComponentContext, ModuleNamespace } from "../core/types";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isLazy(controller: any): boolean {
    return typeof controller === 'function' && 
           !/^\s*class\s+/.test(controller.toString()) &&
           (controller.toString().includes('import(') || controller.toString().includes('__variableDynamicImport'));
  }

  async loadRaw(importPromise: () => Promise<{ default: string }>): Promise<string> {
    const module = await importPromise();
    return module.default;
  }

}

export const loader = new ComponentLoaderService();









