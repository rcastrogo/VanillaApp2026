import { 
  Activity, Globe, Moon, Plus, Minus, Settings, Sun, Timer, Trash, User, Users, Power, Zap,
  ChevronDown, ChevronUp
} from 'lucide';

import { CollapsibleComponent } from './components/collapsible.component';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LanguageSelector } from './components/language-selector.component';
import { LoaderComponent } from './components/loader.component';
import { UserListComponent } from './components/test/user-list.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import type { ComponentProvider } from './core/services/router.service';
import { i18nService } from './i18n';

export const APP_CONFIG = {
  icons: {
    timer: Timer,
    settings: Settings,
    activity: Activity,
    globe: Globe,
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
  i18n : i18nService,
  components: {
    'app-footer': FooterComponent,
    'app-header': HeaderComponent,
    'app-user-list': UserListComponent,
    'app-theme-toggle': ThemeToggleComponent,
    'app-language-selector': LanguageSelector,
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