import { getComponent } from "./component-registry";
import { buildAndInterpolate } from "./dom";
import { createIcon } from "./icons";
import { getValue, resolveArgs } from "./template";
import { BaseComponent, type ComponentElement } from "./types";
import { APP_CONFIG } from "../app.config";
import type { BindingResolver, ComponentBinding, ComponentContext } from "../components/component.model";
import { loader } from "./services/loader.service";
import { pubSub } from "./services/pubsub.service";
import { router } from "./services/router.service";

const pendingHydrations = new WeakMap<object, Promise<void>>();

export function trackHydration(ctx: object, promise: Promise<void>) {
  const existing = pendingHydrations.get(ctx);
  pendingHydrations.set(ctx, existing ? existing.then(() => promise) : promise);
}

export function getHydrationPromise(ctx: object): Promise<void> {
  return pendingHydrations.get(ctx) || Promise.resolve();
}

export function hydrateElement(element: HTMLElement, ctx: ComponentContext) {
  hydrateIcons(element);
  hydrateEventListeners(element, ctx);
  hydrateComponents(element, ctx);
  hydrateDirectives(element, ctx)
}

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
  // =======================================================================
  // Aseguramos que el componente tenga un array para almacenar las bindings
  // =======================================================================
  if (!ctx.bindings) {
    ctx.bindings = [];
  }
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
            case 'json': el.innerHTML = JSON.stringify(getValue(data, ctx), null, 2); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'style': (el.style as any)[extraArgs[0]] = data; break;
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
      else if (attrName === 'data-bind') {
        // Formato: "tipo:path" o "tipo.propiedad:path".
        // Se permiten varios bindings separados por ';'.
        attrValue
          .split(';')
          .map(bindingDef => bindingDef.trim())
          .filter(Boolean)
          .forEach(bindingDef => {
            const [typeAndProp = '', ...pathTokens] = bindingDef.split(':').map(s => s.trim());
            const path = pathTokens.join(':');
            const [type, prop] = typeAndProp.includes('.')
              ? typeAndProp.split('.')
              : [typeAndProp, null];
            const binding = {
              element: el,
              type,
              prop,
              path
            };
            ctx.bindings.push(binding);
            resolveBindingValue(binding, ctx);
          });
        el.removeAttribute(attrName);
      }
    });
    currentNode = walker.nextNode();
  }
  return container;
}

// function toAttrName(value: string): string {
//   return value
//         .replace(/([A-Z])/g, '-$1')
//         .toLowerCase()
//         .replace(/^-/, '');
// }

export async function hydrateComponents(root: HTMLElement, ctx: ComponentContext): Promise<void> {
  const placeholders = root.querySelectorAll<HTMLElement>('[data-component]');

  for (const el of Array.from(placeholders)) {
    const componentName = el.dataset.component!;
    if (!componentName) continue;
    const provider = getComponent(componentName);
    if (provider) {
      const component = await loader.resolve(provider, ctx) as BaseComponent;
      el.removeAttribute('data-component');
      const customClasses = el.className.trim();
      component.init?.({ parent: el });
      const element = component.render() as ComponentElement;
      if (element) {
        BaseComponent.bind(component, element);
        if (!element.id) {
          element.setAttribute('id', el.id);
        }
        element.setAttribute(componentName, '');
        if (customClasses) {
          const classesArray = customClasses.split(/\s+/).filter(c => c.length > 0);
          element.classList.add(...classesArray);
        }
      }
      el.replaceWith(
        element || document.createComment(`Component ${componentName} rendered an empty element`)
      );
      component.mounted?.();
    } else {
      console.error(`Componente ${componentName} no encontrado en el registro.`);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hydrateDirectives(container: HTMLElement, ctx: any) {
  // LÓGICA PARA TRADUCCIONES
  container.querySelectorAll<HTMLElement>('[data-t]').forEach(el => {
    const key = el.dataset.t!;
    const cleanKey = key.startsWith('t:') ? key.slice(2) : key;
    el.textContent = APP_CONFIG.i18n.t(cleanKey, ctx);
    el.setAttribute('data-i18n-key', cleanKey);
  });
  // 1. Buscamos solo los bucles de PRIMER NIVEL (los que no tienen otro data-each encima)
  Array
    .from(container.querySelectorAll<HTMLElement>('[data-each]'))
    .filter(el => !el.parentElement?.closest('[data-each]'))
    .forEach(repeater => {
      const expression = repeater.dataset.each!; // "item in tasks"
      const [itemName, , ...listParts] = expression.split(' ');
      const listExpression = listParts.join(' ').trim();
      let list: unknown[] = [];
      if (listExpression.startsWith('[') && listExpression.endsWith(']')) {
        try {
          list = JSON.parse(listExpression.replace(/'/g, '"'));
        } catch (e) {
          console.error("Error parseando array estático en data-each:", e);
        }
      } else {
        list = getValue(listExpression, ctx) || [];
      }

      const templateHTML = repeater.innerHTML.replaceAll('~', '|');
      repeater.innerHTML = '';
      repeater.removeAttribute('data-each');
      // Si la lista está vacía, dejamos un ancla invisible      
      if (list.length === 0) {
        repeater.appendChild(
          document.createComment(`anchor:each-${listExpression}`)
        );
        return;
      }
      // 1. Creamos el saco virtual fuera del bucle
      const fragment = document.createDocumentFragment();
      list.forEach((item: unknown, index: number) => {
        // Si el item es un elemento del DOM, lo añadimos directamente
        if (item instanceof Node) {
          fragment.appendChild(item);
          return;
        }
        const itemCtx = Object.create(ctx);
        itemCtx[itemName] = item;
        itemCtx.index = index;
        itemCtx['#'] = ctx;
        const instance = buildAndInterpolate(templateHTML, itemCtx, false);

        assingLocalCtxToElement(instance, itemCtx);

        hydrateDirectives(instance, itemCtx);
        while (instance.firstChild) {
          fragment.appendChild(instance.firstChild);
        }
      });
      repeater.appendChild(fragment);
    });
}


export function getResolver(binding: ComponentBinding): BindingResolver {
  const { type, prop } = binding;
  const resolvers: Record<string, BindingResolver> = {
    fn: (el, value) => {
      if (typeof value === 'function') {
        value(el);
      } else {
        console.warn(`La función '${binding.path}' no se encontró en el contexto.`);
      }
    },
    text: (el, value) => el.innerText = value ?? '',
    html: (el, value) => el.innerHTML = value ?? '',
    value: (el, value) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = (el as any).__instance;
      if (ref) 
        ref.setProp?.('value', value);
      else
        (el as HTMLInputElement).value = value ?? '';
    },
    checked: (el, value) => (el as HTMLInputElement).checked = !!value,
    attr: (el, value) => value === null || value === undefined ? el.removeAttribute(prop!) : el.setAttribute(prop!, String(value)),
    class: (el, value) => el.className = value ?? '',
    toggle: (el, value) => el.classList.toggle(prop!, !!value),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style: (el, value) => (el.style as any)[prop!] = value,
    show: (el, value) => el.style.display = value ? '' : 'none',
    hide: (el, value) => el.style.display = value ? 'none' : '',
    disabled: (el, value) => (el as HTMLButtonElement | HTMLInputElement).disabled = !!value
  };
  return resolvers[type] || resolvers.text;
}

type ElementWithCtx = HTMLElement & { __localCtx__?: ComponentContext };

function assingLocalCtxToElement(element: HTMLElement, ctx: ComponentContext) {
  if (element.firstElementChild) {
    (element.firstElementChild as ElementWithCtx).__localCtx__ = ctx;
  }
}

function findLocalCtx(element: HTMLElement): ComponentContext | null {
  let current: ElementWithCtx | null = element;
  while (current) {
    const localCtx = current.__localCtx__;
    if (localCtx) return localCtx;
    current = current.parentElement;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveBindingValue(binding: ComponentBinding, ctx: Record<string, unknown>): any {
  const resolver = getResolver(binding);
  const value = getValue(binding.path, ctx);
  if (value !== undefined) {
    resolver(binding.element, value);
    return;
  }
  const localCtx = findLocalCtx(binding.element);
  const localValue = getValue(binding.path, localCtx);
  // console.log(`Resolviendo binding:`, { path: binding.path, value, localCtx });
  resolver(binding.element, localValue);
}
