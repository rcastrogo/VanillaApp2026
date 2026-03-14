import { build } from "./dom";
import { createIcon } from "./icons";
import { getValue, interpolate, resolveArgs } from "./template";
import type { BaseComponent, ComponentContext, ComponentElement } from "./types";
import { HeaderComponent } from "../components/header/header.component";
import { DashboardComponent } from "../components/test/dashboard.component";
import { UserListComponent } from "../components/test/user-list.component";
import { loader } from "../services/loader.service";
import { pubSub } from "../services/pubsub.service";
import { router, type ComponentProvider } from "../services/router.service";

const COMPONENT_REGISTRY: Record<string, ComponentProvider> = {
  'app-header': HeaderComponent,
  'app-dashboard': DashboardComponent,
  'app-user-list': UserListComponent,
  // 'app-counter': CounterComponent,
  'app-counter': () => import('../components/test/counter-component'),
};

export function hydrateIcons(root: HTMLElement = document.body): HTMLElement {
  const iconPlaceholders = root.querySelectorAll<HTMLElement>('[data-icon]');
  iconPlaceholders.forEach(el => {
    const name = el.dataset.icon!;
    const customClasses = el.className;
    const svg = createIcon(name, customClasses);
    if (svg) el.replaceWith(svg);
  });
  return root;
}

export function hydrateEventListeners(container: HTMLElement, ctx: ComponentContext) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let currentNode: Node | null = container;
  while (currentNode) {
    const el = currentNode as HTMLElement;
    Array.from(el.attributes).forEach(attr => {
      const attrName = attr.name;
      const attrValue = attr.value;
      // =======================================================================
      // 1. SUSCRIPCIÓN REACTIVA (on-publish)
      // =======================================================================
      if (attrName === 'on-publish') {
        const [topic, scope, action, ...extraArgs] = attrValue.split(':');  
        const instanceId = scope === 'local' ? ctx.instanceId : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsubscribe = pubSub.subscribe(topic, (payload: any) => {
          const isInternalPublish = payload && typeof payload === 'object' && 'args' in payload;
          const data = isInternalPublish ? payload.args[0] : payload;
          switch ((action || '').toLowerCase()) {
            case 'classname': el.className = data; break;
            case 'html':
            case 'innerhtml': el.innerHTML = data; break;
            case 'json':      el.innerHTML = JSON.stringify(getValue(data,ctx), null, 2); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'style':     (el.style as any)[extraArgs[0]] = data; break;
            case 'toggleclass': el.classList.toggle(extraArgs[0]); break;
            default:
              if (action && typeof ctx[action] === 'function') {
                ctx[action].call(ctx, el, payload, ...extraArgs);
              } else if (action && action.startsWith('attr.')) {
                const attrName = action.split('.')[1];
                const value = data;
                el.setAttribute(attrName, value);
              } else {
                el.innerHTML = getValue(data, ctx);
              }
          }
        }, instanceId);
        if (ctx.component) {
          ctx.component.addCleanup(unsubscribe);
        }
        el.removeAttribute(attrName);
      }
      // =======================================================================
      // 2. NAVEGACIÓN (route-to)
      // =======================================================================
      else if (attrName === 'route-to') {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const path = attrValue.startsWith('@') ? getValue(attrValue.slice(1), ctx) : attrValue;
          router.navigateTo(path);
        });
        el.removeAttribute(attrName);
      }
      // =======================================================================
      // 3. EVENTOS DEL DOM (on-click, on-change, on-input...)
      // =======================================================================
      else if (attrName.startsWith('on-')) {
        const eventName = attrName.replace('on-', '');    
        // Caso A: El evento dispara una publicación global
        if (attrValue.startsWith('publish')) {
          const [, topic, scope, ...extraArgs] = attrValue.split(':');
          if (!topic) {
            console.warn('Falta el topic en el publish:', attrValue);
            return;
          }
          const publisherId = scope === 'local' ? ctx.instanceId : undefined;
          el.addEventListener(eventName, (ev) => {
            const params = extraArgs.length > 0 ? resolveArgs(extraArgs, ctx) : [];
            pubSub.publish(topic, { 
              event: ev, 
              target: el, 
              args: params 
            }, publisherId);
          });
        } 
        // Caso B: El evento dispara un método del componente
        else {
          const [handlerName, ...eventArgs] = attrValue.split(':');
          const handler = ctx[handlerName] || ctx.handlers?.[handlerName];
          if (typeof handler === 'function') {
            const resolvedArgs = resolveArgs(eventArgs, ctx);
            el.addEventListener(eventName, (e) => {
              handler.call(ctx, el, e, ...resolvedArgs);
            });
          }
        }
        el.removeAttribute(attrName);
      }
    });
    currentNode = walker.nextNode();
  }
  return container;
}

// export function hydrateComponents(root: HTMLElement, ctx: ComponentContext): void {
//   const placeholders = root.querySelectorAll<HTMLElement>('[data-component]');

//   placeholders.forEach(el => {
//     const componentName = el.dataset.component!;
//     el.removeAttribute('data-component');
//     // const dataId = el.dataset.props;
//     const customClasses = el.className.trim();

//     const creator = COMPONENT_REGISTRY[componentName];

//     if (creator) {
//       let component: BaseComponent;
//       if (typeof creator === 'function' && creator.prototype && creator.prototype.constructor.name) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         component = new (creator as any)(ctx);
//       } else {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//         component = (creator as Function)(ctx);
//       }
//       // const props = dataId ? DataRegistry.consume(dataId) : {};
//       component.init?.();
//       const element = component.render() as ComponentElement;
//       if (customClasses) {
//         const classesArray = customClasses.split(/\s+/).filter(c => c.length > 0);
//         element.classList.add(...classesArray);
//       }
//       // Asegurar vinculación
//       if (!element.__componentInstance) {
//         element.__componentInstance = component;
//         component.element = element;
//       }
        
//       el.replaceWith(element);
//       component.mounted?.();
//     }
//   });
// }

export async function hydrateComponents(root: HTMLElement, ctx: ComponentContext): Promise<void> {
  const placeholders = root.querySelectorAll<HTMLElement>('[data-component]');

  for (const el of Array.from(placeholders)) {
    const componentName = el.dataset.component!;
    const provider = COMPONENT_REGISTRY[componentName];
    if (provider) {
      const component = await loader.resolve(provider, ctx);
      el.removeAttribute('data-component');
      const customClasses = el.className.trim();
      component.init?.();
      const element = component.render() as ComponentElement;

      if (customClasses) {
        const classesArray = customClasses.split(/\s+/).filter(c => c.length > 0);
        element.classList.add(...classesArray);
      }
      if (!element.__componentInstance) {
        element.__componentInstance = component as BaseComponent;
        component.element = element;
      }
      el.replaceWith(element);
      component.mounted?.();
      
    } else {
      console.error(`Componente ${componentName} no encontrado en el registro.`);
    }
  }
}

export function hydrateDirectives(container: HTMLElement, ctx: ComponentContext) {
  const loops = container.querySelectorAll<HTMLElement>('[data-each]');
  loops.forEach(el => {
    const expression = el.dataset.each!; // "user in users"
    const [itemName, , listName] = expression.split(' ');
    const list = getValue(listName, ctx) || [];
    const template = el.innerHTML;
    
    el.innerHTML = '';
    el.removeAttribute('data-each');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list.forEach((item: any) => {
      const itemCtx = Object.create(ctx);
      itemCtx[itemName] = item; 
      const html = interpolate(template, itemCtx);
      const child = build('div', html, true, itemCtx);
      el.appendChild(child);
    });
  });
}


// /**
//  * 1. REGISTRO DE DATOS (Para pasar objetos reales por HTML)
//  */
// const DataRegistry = {
//   _storage: new Map<string, any>(),
//   register(data: any): string {
//     const id = `data_${Math.random().toString(36).substr(2, 9)}`;
//     this._storage.set(id, data);
//     return id;
//   },
//   consume(id: string): any {
//     const data = this._storage.get(id);
//     this._storage.delete(id);
//     return data;
//   }
// };

// export function buildAndHydrate(template: string, ctx: ComponentContext): HTMLElement {
  
//   const html = interpolate(template, ctx);
//   const container = build('div', html, true, ctx);

//   const hydrateNode = (parent: HTMLElement) => {
//     const placeholders = parent.querySelectorAll('[data-component]');
    
//     placeholders.forEach(placeholder => {
//       const name = placeholder.getAttribute('data-component');
//       const dataId = placeholder.getAttribute('data-props'); // El ID del objeto real
      
//       const ComponentClass = registry[name || ''];
//       if (ComponentClass) {
//         // Recuperamos el objeto real del mapa temporal
//         const props = dataId ? DataRegistry.consume(dataId) : {};
        
//         const instance = new ComponentClass(ctx, props);
//         const newEl = instance.render();

//         // Asegurar vinculación
//         if (!newEl.__componentInstance) {
//           (newEl as any).__componentInstance = instance;
//           (instance as any).element = newEl;
//         }

//         // Si el nuevo elemento tiene hijos que hidratar, recursión
//         hydrateNode(newEl);
        
//         placeholder.replaceWith(newEl);
//       }
//     });
//   };

//   hydrateNode(container);
//   return container.firstElementChild as HTMLElement;
// }