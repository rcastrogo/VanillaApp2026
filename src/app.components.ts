import { CollapsibleComponent } from './components/collapsible.component';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LanguageSelector } from './components/language-selector.component';
import { LoaderComponent } from './components/loader.component';
import { LogoComponent } from './components/logo.component';
import { ProgressBarComponent } from './components/progress-bar.component';
import { ThemeToggleComponent } from './components/theme-toggle.component';
import type { ComponentProvider } from './core/services/router.service';

const components = {
  'app-logo': LogoComponent,
  'app-progress-bar': ProgressBarComponent,
  'app-footer': FooterComponent,
  'app-header': HeaderComponent,
  'app-user-list': () => import('./components/test/user-list.component'),
  'app-theme-toggle': ThemeToggleComponent,
  'app-language-selector': LanguageSelector,
  'app-loader': LoaderComponent,
  'app-collapsible': CollapsibleComponent,
  'app-dashboard': () => import('./components/test/dashboard.component'),
  'app-counter': () => import('./components/test/counter-component'),
  'app-the-simpsons': () => import('./components/test/the-simpsons-component'),
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

export const ComponentRegistry = {
  components,
  registerComponent,
  registerComponents
};