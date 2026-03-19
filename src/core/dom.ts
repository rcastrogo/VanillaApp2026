import { hydrateComponents, hydrateDirectives, hydrateEventListeners, hydrateIcons } from "./hydrate";
import { interpolate } from "./template";
import type { ComponentContext } from "../components/component.model";


export function build<T extends HTMLElement>(
  tagName: string,
  options: Partial<T> | string = {},
  returnFirstChild = false,
  ctx?: ComponentContext
): T | HTMLElement {
  const el = document.createElement(tagName);
  if (typeof options === 'string') {
    if (!options.trim()) {
      return el; 
    }
    el.innerHTML = options;
  } else {
    const { className, ...rest } = options;
    Object.assign(el, rest);
    if (className) el.className = className;
  }
  // 1. Primero las directivas: transforman el HTML crudo en múltiples nodos
  if (ctx) hydrateDirectives(el, ctx); 
  // 2. Hidratar iconos (cosas estéticas)
  hydrateIcons(el);
  // 3. Hidratar componentes (ya sobre los nodos finales generados por el each)
  if (ctx) hydrateComponents(el, ctx);
  // 4. Listeners (al final, para que los componentes hidratados no pierdan sus eventos)
  if (ctx) hydrateEventListeners(el, ctx);
  // Forzamos que siempre devuelva UN nodo
  if (returnFirstChild) return (el.firstElementChild as HTMLElement) || el;
  return el;
}

export function buildAndInterpolate<T extends HTMLElement>(
  template: string,
  ctx: ComponentContext = {},
  returnFirstChild = true,
  options: Partial<T> = {},  
): T | HTMLElement {
  const html = interpolate(template, ctx)
  return build(
    'div', 
    {
      ...options,
      innerHTML:html
    }, 
    returnFirstChild, 
    ctx
  );
}

export function $<T extends HTMLElement>(selector: string, context: HTMLElement | Document = document) {
  return {
    one: (): T | null => {
      return context.querySelector<T>(selector);
    },
    all: (): T[] => {
      return Array.from(context.querySelectorAll<T>(selector));
    },
    exists: (): boolean => {
      return context.querySelector(selector) !== null;
    }
  };
}

export function getQueryParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}
