
import { CollapsibleComponent } from './components/collapsible.component';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LanguageSelector } from './components/language-selector.component';
import { LoaderComponent } from './components/loader.component';
import { LogoComponent } from './components/logo.component';
import NotificationPanel from './components/notification-panel/notification-panel.component';
import { ProgressBarComponent } from './components/progress-bar.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import type { ComponentProvider } from './core/services/router.service';

const components = {
  'app-logo': LogoComponent,
  'app-progress-bar': ProgressBarComponent,
  'app-footer': FooterComponent,
  'app-header': HeaderComponent,
  'app-notification-panel': NotificationPanel,
  'app-user-list': () => import('./components/test/user-list.component'),
  'app-theme-toggle': ThemeToggleComponent,
  'app-language-selector': LanguageSelector,
  'app-loader': LoaderComponent,
  'app-collapsible': CollapsibleComponent,
  'app-dashboard': () => import('./components/test/dashboard.component'),
  'app-binding-reference': () => import('./components/test/binding-reference.component'),
  'app-entity-master-detail': () => import('./components/test/entity-master-detail.component'),
  'app-combo-box': () => import('./components/combo-box.component'),
  'app-menu-trigger': () => import('./components/menu-trigger.component'),
  'app-counter': () => import('./components/test/counter-component'),
  'app-the-simpsons': () => import('./components/test/the-simpsons-component'),
  'app-tab-component': () => import('./components/tab.component'),
} as Record<string, ComponentProvider>

function registerComponent(name: string, componentProvider: ComponentProvider){
  if (!components[name]) {
    components[name] = componentProvider;
    console.log(`[Registry] Componente '${name}' registrado con éxito.`);
  }
}

function registerComponents(...entries: [string, ComponentProvider][]) {
  entries.forEach(([name, provider]) => {
    registerComponent(name, provider);
  });
}

const componentFiles = import.meta.glob('./components/**/*.component.ts');
Object.entries(componentFiles).forEach(([path, resolver]) => {
  const fileName = path.split('/').pop()?.replace('.component.ts', '');
  if (fileName) {
    const tagName = `app-${fileName}`;
    if (components[tagName]) {
      console.warn(`El componente '${tagName}' ya está registrado. Omitiendo '${path}'.`);
      return;
    }
    components[tagName] = resolver as ComponentProvider;
    console.log(`Registrando componente '${tagName}' desde '${path}'`);
  }
});

export const ComponentRegistry = {
  components,
  registerComponent,
  registerComponents
};