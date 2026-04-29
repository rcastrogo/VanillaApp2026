import { resolveBindingValue } from "./hydrate";
import { pubSub } from "./services/pubsub.service";
import { getValue } from "./template";
import type { 
  Component, 
  ComponentBinding, 
  ComponentContext, 
  ComponentCreator, 
  ComponentInitValue 
} from "../components/component.model";

export type ArgType = 'string' | 'number' | 'boolean' | 'null' | 'undefined';
export type NavigateEventArg = {
  event: string;
  target: HTMLElement;
  args: ArgType[];
} | string;

export interface Identifiable { id: number | string }
export type SortDirection = 'asc' | 'desc' | null;
export type SortState = [string, SortDirection] | undefined;
export type SortProperties = string | string[];

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
  
  protected parent?: HTMLElement;
  protected props: Record<string, string | undefined> = {};
  protected children: Node[] = [];
  protected bindings: ComponentBinding[] = [];

  private cleanups: CleanupFn[] = [];
  private isInitializing = false;

  constructor(ctx?: ComponentContext) {
    this.parsePropsAndChildren(ctx);
    this.instanceId = ++BaseComponent.instance;
    this.bindMethods();
    this.ctx = ctx;
    this.state = new Proxy({}, {
      set: (target, prop, value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any)[prop] = value;
        if (!this.isInitializing) this.update(prop as string);
        return true;
      }
    });
  }

  protected setState(state: ComponentState, update = true) {
    this.isInitializing = true;
    Object.assign(this.state, state);
    this.isInitializing = false;
    if(update) this.update('state');
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

  protected invalidate() {
    this.update();
  }

  private update(changedProp?: string) {
    if (!this.element) return;
    this.element.__isUpdating = true;
    const newElement = this.render(changedProp);
    if(!newElement || newElement === this.element){
      this.element.__isUpdating = false;
      return;
    }
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
    this.mounted?.();

    Promise.resolve().then(() => {
      if (this.element) this.element.__isUpdating = false;
    });

  }

  updateBindings() {
    this.bindings.forEach(binding => {
      if (binding.element.isConnected) {
        resolveBindingValue(binding, this as Record<string, unknown>);
      } else {
        // console.log('Elemento desconectado', binding);        
        resolveBindingValue(binding, this as Record<string, unknown>);        
      }
    });    
  }

  abstract render(changedProp?: string): HTMLElement | null;
  setProp?(prop: string, value: string | number): void;

  mounted() { /* empty */ }
  init(ctx?: ComponentInitValue) { 
    this.parsePropsAndChildren(ctx);
  }

  private setupOutputs(ctx?: ComponentInitValue) {
    if (!ctx?.parent || !this.ctx) return;

    const hostElement = ctx.parent;
    const childInstance = this as Record<string, unknown>;
    const parentContext = this.ctx as Record<string, unknown>;

    Array.from(hostElement.attributes).forEach(attr => {
      if (!attr.name.startsWith('(') || !attr.name.endsWith(')')) return;
      const kebabName = attr.name.slice(1, -1);
      const outputName = kebabName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const handlerName = attr.value.trim();
      // ==========================================================================================
      // Support for array access in handler names, e.g. (on-action)="actions[edit]"
      // ==========================================================================================
      const arrayMatch = handlerName.match(/^([\w\\.]+)\[(.+)\]$/);
      let arrayValue;
      if (arrayMatch) {
        const [, name, idx] = arrayMatch;
        const target = getValue(name, parentContext);
        const resolvers = {
          Map: () => target.get(idx),
          Set: () => Array.from(target)[Number(idx)],
          Default: () => target?.[idx]
        };
        const type = target instanceof Map ? 'Map' : target instanceof Set ? 'Set' : 'Default';
        arrayValue = resolvers[type]();
      }
      const target = arrayValue || parentContext[handlerName] || getValue(handlerName, parentContext);
      // ==========================================================================================
      // If the target is a function, bind it to the parent context to preserve 'this'
      // ==========================================================================================
      if (typeof target === 'function') {
        childInstance[outputName] = target.bind(this.ctx);
        this.addCleanup(() => {
          childInstance[outputName] = undefined;
        });
        return;        
      }
      childInstance[outputName] = target;
    });
  }

  private parsePropsAndChildren(ctx?: ComponentInitValue){
    if (ctx && ctx.parent) {
      this.parent = ctx.parent;
      this.props = { ...ctx.parent.dataset };
      this.children = Array.from(ctx.parent.childNodes);
      this.setupOutputs(ctx);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.parent as any).__instance = this;
    }    
  }

  public destroy(): void {
    if (this.cleanups.length === 0 && !this.element) return;
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.bindings = [];
  }

   public static bind(component: BaseComponent, el: HTMLElement): ComponentElement {
    const element = el as ComponentElement;
    if(element){
      element.__componentInstance = component;
      component.element = element;
    }
    return element;
  }

  static renderAndBind<T extends BaseComponent>(instance: T): HTMLElement | null {
    const element = instance.render();
    if (!element) return null;
    instance.element = element;
    (element as ComponentElement).__componentInstance = instance;
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getInstance<T = any>(selector: string, root: HTMLElement | Document = document): T | null {
    const el = root.querySelector(selector) as ComponentElement | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (el as any)?.__componentInstance || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static waitForInstance<T = any>(
    selector: string, 
    root: HTMLElement, 
    timeout = 5000
  ): Promise<T | null> {
    const existing = BaseComponent.getInstance<T>(selector, root);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const instance = BaseComponent.getInstance<T>(selector, root);
        if (instance) {
          observer.disconnect();
          resolve(instance);
        }
      });
      observer.observe(root, { childList: true, subtree: true, attributes: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  protected bind(el: HTMLElement): ComponentElement {
    return BaseComponent.bind(this, el);
  }
  
}
