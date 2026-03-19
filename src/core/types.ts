import type { Component, ComponentContext, ComponentCreator, ComponentInitValue } from "../components/component.model";
import { pubSub } from "./services/pubsub.service";

export interface ModuleNamespace { 
  default?: ComponentCreator; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any 
};

export type CleanupFn = () => void;

export interface ComponentElement extends HTMLElement {
  __componentInstance?: BaseComponent;
  __isUpdating?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentState = Record<string, any>;

export abstract class BaseComponent implements Component {
  
  private static instance = 0;

  public element: ComponentElement | null = null;
  protected instanceId = 0;
  protected state: ComponentState = {};
  protected ctx: ComponentContext;

  protected props: Record<string, string | undefined> = {};
  protected children: Node[] = [];

  private cleanups: CleanupFn[] = [];
  private isInitializing = false;

  constructor(ctx: ComponentContext) {
    this.instanceId = ++BaseComponent.instance;
    this.bindMethods();
    this.ctx = ctx;
    this.state = new Proxy({}, {
      set: (target, prop, value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any)[prop] = value;
        if (!this.isInitializing) {
          this.update();
        }
        return true;
      }
    });
  }

  protected setState(state: ComponentState){
    this.isInitializing = true;
    Object.assign(this.state, state);
    this.isInitializing = false;
    if (this.element) {
      this.update();
    }
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

  protected addCleanup(fn: CleanupFn | CleanupFn[]): void {
    this.cleanups = this.cleanups.concat(fn);
  }

  private bindMethods() {
    const proto = Object.getPrototypeOf(this);
    Object.getOwnPropertyNames(proto).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (this as any)[key];
      if (key !== 'constructor' && typeof val === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[key] = val.bind(this);
      }
    });
  }

  private update() {
    if (!this.element) return;
    this.element.__isUpdating = true;
    const newElement = this.render();
    const currentOutlet = this.element.querySelector('#router-outlet');
    const newOutlet = newElement.querySelector('#router-outlet');
    if (currentOutlet && newOutlet) {
      newOutlet.replaceWith(currentOutlet);
    }
 
    const fragment = document.createDocumentFragment();
    while (newElement.firstChild) {
      fragment.appendChild(newElement.firstChild);
    }

    this.element.innerHTML = '';
    this.element.appendChild(fragment);
    this.bind(this.element);
    this.mounted?.();

    Promise.resolve().then(() => {
      if (this.element) this.element.__isUpdating = false;
    });

  }

  abstract render(): HTMLElement;

  mounted() { /* empty */ }
  init(_ctx?: ComponentInitValue) { /* empty */ }

  public destroy(): void {
    if (this.cleanups.length === 0 && !this.element) return;
    // console.log(`[Cleanup] Destruyendo: ${this.constructor.name}`);
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }

   public static bind(component: BaseComponent, el: HTMLElement): ComponentElement {
    const element = el as ComponentElement;
    if(element){
      element.__componentInstance = component;
      component.element = element;
    }
    return element;
  }

  static renderAndBind<T extends BaseComponent>(instance: T): HTMLElement {
    const element = instance.render();
    instance.element = element;
    (element as ComponentElement).__componentInstance = instance;
    return element;
  }

  protected bind(el: HTMLElement): ComponentElement {
    return BaseComponent.bind(this, el);
  }
  
}
