import { 
  Activity, Moon, Plus, Settings, Sun, Timer, Trash, User, Users, Power, Zap
} from 'lucide';

import { HeaderComponent } from './components/header/header.component';
import { UserListComponent } from './components/test/user-list.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';

export const APP_CONFIG = {
  icons: {
    timer: Timer,
    settings: Settings,
    activity: Activity,
    sun: Sun,
    moon: Moon,
    plus: Plus,
    trash: Trash,
    user: User,
    users:Users,
    power:Power,
    zap:Zap,
  },
  components: {
    'app-header': HeaderComponent,
    'app-user-list': UserListComponent,
    'app-theme-toggle': ThemeToggleComponent,
    'app-counter': () => import('./components/test/counter-component'),
  }
};