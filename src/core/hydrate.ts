import { getComponent } from "./component-registry";
import { buildAndInterpolate } from "./dom";
import { createIcon } from "./icons";
import { getValue, resolveArgs } from "./template";
import type { BaseComponent, ComponentElement } from "./types";
import type { ComponentContext } from "../components/component.model";
import { loader } from "./services/loader.service";
import { pubSub } from "./services/pubsub.service";
import { router} from "./services/router.service";

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

export async function hydrateComponents(root: HTMLElement, ctx: ComponentContext): Promise<void> {
  const placeholders = root.querySelectorAll<HTMLElement>('[data-component]');

  for (const el of Array.from(placeholders)) {
    const componentName = el.dataset.component!;
    if (!componentName) continue;
    const provider = getComponent(componentName);
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

// export function hydrateDirectives(container: HTMLElement, ctx: ComponentContext) {
//   const loops = container.querySelectorAll<HTMLElement>('[data-each]');
//   loops.forEach(el => {
//     const expression = el.dataset.each!; // "user in users"
//     const [itemName, , listName] = expression.split(' ');
//     const list = getValue(listName, ctx) || [];
//     const template = el.innerHTML;
    
//     el.innerHTML = '';
//     el.removeAttribute('data-each');

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     list.forEach((item: any) => {
//       const itemCtx = Object.create(ctx);
//       itemCtx[itemName] = item; 
//       let html = preProcessTemplate(template, itemCtx);
//       html = interpolate(html, itemCtx);
//       const child = build('div', html, true, itemCtx);
//       el.appendChild(child);
//     });
//   });
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hydrateDirectives(container: HTMLElement, ctx: any) {
  // 1. Buscamos solo los bucles de PRIMER NIVEL (los que no tienen otro data-each encima)
  Array
    .from(container.querySelectorAll<HTMLElement>('[data-each]'))
    .filter(el => !el.parentElement?.closest('[data-each]'))
    .forEach(repeater => {
      const expression = repeater.dataset.each!; // "item in tasks"
      const [itemName, , listName] = expression.split(' ');
      const list = getValue(listName, ctx) || [];   
      const templateHTML = repeater.innerHTML;
      repeater.innerHTML = '';
      repeater.removeAttribute('data-each');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list.forEach((item: any, index: number) => {
        // Creamos un contexto que HEREDA del contexto padre (el componente)
        // Así, cualquier método como deleteUser se encontrará subiendo por la cadena
        const itemCtx = Object.create(ctx);   
        itemCtx[itemName] = item;
        itemCtx.index = index;
        itemCtx['#'] = ctx; // Parent context
        const instance = buildAndInterpolate(templateHTML, itemCtx, false);
        // RECURSIÓN: Buscamos si dentro de este item hay más bucles (anidados)
        hydrateDirectives(instance, itemCtx);
        // Movemos los hijos al contenedor real (el repeater)
        while (instance.firstChild) repeater.appendChild(instance.firstChild);
      });
    });
}