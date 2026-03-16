
import {
  createElement,
  type IconNode,
} from 'lucide';

// Ya no hay iconos aquí. El core solo tiene la LÓGICA.
let registeredIcons: Record<string, IconNode> = {};

export function setupIcons(icons: Record<string, IconNode>) {
  registeredIcons = icons;
}

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export function renderIcon(name: string, customClass: string = 'w-6 h-6'): string {
  const svg = createIcon(name, customClass);
  return svg ? svg.outerHTML : '';
}

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export function createIcon(name: string, customClass: string = 'w-6 h-6'): SVGElement | undefined {
  const icon = registeredIcons[name];
  if (icon) {
    const svg = createElement(icon, { class: customClass, 'stroke-width': '2' });
    return svg;
  }
  return;
}