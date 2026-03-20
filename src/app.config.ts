import { 
  Activity, Moon, Plus, Minus, Settings, Sun, Timer, Trash, User, Users, Power, Zap,
  ChevronDown, ChevronUp
} from 'lucide';

import { CollapsibleComponent } from './components/collapsible.component';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LoaderComponent } from './components/loader.component';
import { UserListComponent } from './components/test/user-list.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import type { ComponentProvider } from './core/services/router.service';
import { useState } from './core/state.utils';


const translations = {
  es: {
    welcome: "Bienvenido, {name}!",
    logout: "Cerrar sesión",
    items: "Tienes {count} productos"
  },
  en: {
    welcome: "Welcome, {name}!",
    logout: "Log out",
    items: "You have {count} items"
  }
};

const lng = useState({ lng : 'es' });

export const APP_CONFIG = {
  icons: {
    timer: Timer,
    settings: Settings,
    activity: Activity,
    sun: Sun,
    moon: Moon,
    plus: Plus,
    minus: Minus,
    trash: Trash,
    user: User,
    users:Users,
    power:Power,
    zap:Zap,
    'chevron-down': ChevronDown, 
    'chevron-up': ChevronUp
  },
  i18n : {
    ...translations,
    lng
  },
  components: {
    'app-footer': FooterComponent,
    'app-header': HeaderComponent,
    'app-user-list': UserListComponent,
    'app-theme-toggle': ThemeToggleComponent,
    'app-loader': LoaderComponent,
    'app-collapsible': CollapsibleComponent,
    'app-dashboard': () => import('./components/test/dashboard.component'),
    'app-counter': () => import('./components/test/counter-component'),
  } as Record<string, ComponentProvider>,
  registerComponent(name: string, componentProvider: ComponentProvider){
    if (!this.components[name]) {
      this.components[name] = componentProvider;
      console.log(`[Registry] Componente '${name}' registrado con éxito.`);
    }
  }
};