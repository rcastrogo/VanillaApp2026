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

export function $<T extends HTMLElement>(selector: string, context?: HTMLElement | undefined | null) {
  return {
    one: (): T | null => {
      return (context || document).querySelector<T>(selector);
    },
    all: (): T[] => {
      return Array.from((context || document).querySelectorAll<T>(selector));
    },
    exists: (): boolean => {
      return (context || document).querySelector(selector) !== null;
    }
  };
}

export function getQueryParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}


export function setupFocusTrap(container: HTMLElement) {
  if (!container) return;

  const SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
    'iframe'
  ].join(', ');

  const getVisibleControls = () => {
    const elements = container.querySelectorAll<HTMLElement>(SELECTOR);
    return Array.from(elements).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const targets = getVisibleControls();
    if (targets.length === 0) {
      e.preventDefault();
      return;
    }

    const first = targets[0];
    const last = targets[targets.length - 1];
    const active = document.activeElement;

    if (!e.shiftKey && active === last) {
      first.focus();
      e.preventDefault();
    } 

    else if (e.shiftKey && (active === first || !container.contains(active))) {
      last.focus();
      e.preventDefault();
    }
  };

  const initialTargets = getVisibleControls();
  if (initialTargets.length > 0) {
    initialTargets[0].focus();
  }

  window.addEventListener("keydown", onKeyDown, true);

  return function cleanup() {
    window.removeEventListener("keydown", onKeyDown, true);
  };
  
}