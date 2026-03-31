

import { APP_CONFIG } from "@/app.config";
import type { Component } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";

export default class IndexPage implements Component {

  components = Object.keys(import.meta.glob('@/components/**/*.ts', { eager: true }));
  registeredComponents = Object.keys(APP_CONFIG.components)
    .filter(tag => ['app-loader', 'app-modal', 'app-loader-small'].indexOf(tag) === -1);
  
  render() {
    const template = `
      <div class="px-4">
        <div class="max-w-4xl mx-auto">

          <div data-component="app-theme-toggle" class="fixed top-4 right-4"></div>

          <div data-component="app-logo" class="text-4xl my-6">
            Index Page
          </div>          
          <p class="text-lg text-gray-700 mb-8 text-center">Explora las funcionalidades básicas de los componentes que implementan la interfaz Component</p>

          <div class="space-y-6">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-primary mb-3">Método Render</h2>
              <p class="text-gray-600">Define cómo se renderiza el componente, devolviendo el elemento DOM principal. Permite control total sobre la estructura y contenido.</p>
            </div>
          </div>

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-primary mb-3">Método Mounted</h2>
              <p class="text-gray-600">Se ejecuta después de que el componente se ha insertado en el DOM. Ideal para inicializar funcionalidades que requieren acceso al DOM o para configurar eventos.</p>
            </div>
          </div>

          <div class="mt-2">
            <div class="bg-card p-4 rounded-lg shadow-md">
               <div 
                data-component="app-collapsible" 
                data-title="Páginas de componentes"
                class="">
                <ul data-each="component in components" class="space-y-2 test-sm text-gray-600">
                  <li>
                    <div class="text-sm border-b pb-2">{component}</div>
                  </li>
                </ul>               
               </div>
            </div>
          </div>

          <div class="mt-2">
            <div class="bg-card p-4 rounded-lg shadow-md">
              <div 
                data-component="app-collapsible" 
                data-title="Componentes registrados en APP_CONFIG"
                class="mb-4">        
                  <ul data-each="tag in registeredComponents" class="space-y-2 test-sm text-gray-600">
                    <li>
                      <div class="text-2xl border-b pb-2 text-center">{tag}</div>
                      <div data-component="{tag}" class="mt-4"></div>
                    </li>
                  </ul>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

}
