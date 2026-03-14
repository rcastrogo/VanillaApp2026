import type { Component, ComponentCreator } from "../components/component.model";
import { pubSub } from "../services/pubsub.service";

export interface ModuleNamespace { 
  default?: ComponentCreator; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any 
};

export interface ComponentContext{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type CleanupFn = () => void;

export interface ComponentElement extends HTMLElement {
  __componentInstance?: BaseComponent;
  __isUpdating?: boolean;
}

export abstract class BaseComponent implements Component {
  
  private static instance = 0;

  public element: ComponentElement | null = null;
  protected instanceId = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected state: Record<string, any> = {};
  protected ctx: ComponentContext;

  private cleanups: CleanupFn[] = [];

  constructor(ctx: ComponentContext) {
    this.instanceId = ++BaseComponent.instance;
    // this.bindMethods();
    this.ctx = ctx;
    this.state = new Proxy({}, {
      set: (target, prop, value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any)[prop] = value;
        this.update();
        return true;
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected publish(topic: string, data?: any): void {
    pubSub.publish(topic, data, this.instanceId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscribe(topic: string, callback: (data: any) => void): void {
    const unsubscribe = pubSub.subscribe(topic, callback, this.instanceId);
    this.addCleanup(unsubscribe);
  }

  protected addCleanup(fn: CleanupFn): void {
    this.cleanups.push(fn);
  }

  // private bindMethods() {
  //   const proto = Object.getPrototypeOf(this);
  //   Object.getOwnPropertyNames(proto).forEach(key => {
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     const val = (this as any)[key];
  //     if (key !== 'constructor' && typeof val === 'function') {
  //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       (this as any)[key] = val.bind(this);
  //     }
  //   });
  // }

  private update() {
    if (!this.element) return;
    const activeElement = document.activeElement as HTMLElement;
    
    const targetId = activeElement?.id || '';

    this.element.__isUpdating = true; 
    const newElement = this.render();
    this.element.replaceWith(newElement);
    this.bind(newElement);

    if (targetId) {
      const target = this.element.querySelector('#' + targetId) as HTMLInputElement;
      if (target) {
        target.focus();
        const len = target.value.length;
        target.setSelectionRange(len, len);
      }
    }

    this.mounted?.();
  }

  abstract render(): HTMLElement;

  mounted() { /* empty */ }
  init() { /* empty */ }

  public destroy(): void {
    if (this.cleanups.length === 0 && !this.element) return;
    console.log(`[Cleanup] Destruyendo: ${this.constructor.name}`);
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    if (this.element) {
      delete this.element.__componentInstance;
      this.element = null;
    }
  }

  protected bind(el: ComponentElement): HTMLElement {
    this.element = el;
    this.element.__componentInstance = this;
    return this.element;
  }

}
