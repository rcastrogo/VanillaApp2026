
import type { ComponentProvider } from './core/services/router.service';

// =========================================================================================
// Este archivo se encarga de registrar los componentes personalizados 
// que pueden ser utilizados en las vistas.
// Se pueden registrar componentes de forma manual.
// Los componentes de carpeta de componentes se registran automáticamente por convención, 
// tomando el nombre del archivo y convirtiéndolo en un tag de componente.
// =========================================================================================
const components = {
  // Componentes registrados manualmente
  // 'app-language-selector': LanguageSelector,
  // 'app-loader': LoaderComponent,
  // 'app-collapsible': CollapsibleComponent,
  // Componentes registrados manualmente para carga asíncrona perezosa o lazy loading
  'app-combo-box': () => import('./components/combo-box.component'),
  'app-tab': () => import('./components/tab.component'),
  'app-counter': () => import('./components/test/counter-component'),
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