
import {
  createElement,
  type IconNode,
  Timer,
  Settings,
  Activity,
  User,
  Users,
  Trash,
  Plus,
  Power,
  Zap
} from 'lucide';

export const APP_ICONS: Record<string, IconNode> = {
  timer: Timer,
  settings: Settings,
  activity: Activity,
  user: User,
  users: Users,
  trash: Trash,
  plus: Plus,
  power: Power,
  zap: Zap
};

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export function renderIcon(name: string, customClass: string = 'w-6 h-6'): string {
  const svg = createIcon(name, customClass);
  return svg ? svg.outerHTML : '';
}

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export function createIcon(name: string, customClass: string = 'w-6 h-6'): SVGElement | undefined {
  const icon = APP_ICONS[name];
  if (icon) {
    const svg = createElement(icon, { class: customClass, 'stroke-width': '2' });
    return svg;
  }
  return;
}