
import type { ComponentContext, ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { useState } from '@/core/state.utils';

const aboutPage: ComponentFactory = (_ctx: ComponentContext) => {
  
  let timeoutId: number;
  let element!: HTMLElement;
  let hasLoadedContent = false;

  const loadHtmlContent = () => {
    if(hasLoadedContent) return;
    hasLoadedContent = true;
    import('../../templates/about.html?raw').then((module) => {
      element.innerHTML = '';
      element.appendChild(buildAndInterpolate(module.default, {}));
    });
  }

  return {

    destroy() {
      clearInterval(timeoutId);
      console.log('About page destroyed');
    },

    render: () => {

      const WAIT_FOR_CONTENT_SECONDS = 10;
      const clock = useState({ times: 0 })
      timeoutId = setInterval(() => {
        clock.put('times', clock.store.times + 1);
      }, 1_000);

      const template = `
        <div class="min-h-1/2 flex items-center justify-center">
          <div class="max-w-xl w-full text-center">

            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              About Page (Lazy Loading Demo)
            </h1>

            <div 
              data-progress-background="bg-red-500 dark:bg-red-700"
              data-component="app-progress-bar" 
              class="mx-auto mb-4"
              ></div>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              Esta página demuestra la carga dinámica de contenido usando importación diferida.
              El contenido HTML se cargará automáticamente tras unos segundos, simulando una petición remota.
            </p>

            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Puedes esperar a que se cargue automáticamente o forzar la carga manualmente.
            </p>

            <div class="flex flex-col items-center gap-3">
              <button class="app-button px-4 py-2" on-click="loadHtmlContent">
                Cargar ahora
              </button>
              <div class="text-xs text-gray-400">
                (Carga automática en <span id="time-slot">{WAIT_FOR_CONTENT_SECONDS}</span> segundos)
              </div>
            </div>

          </div>
        </div>
      `;
      // ============================================================================
      // Contexto de ejemplo para interpolar datos y conectar eventos en el template.
      // ============================================================================
      const context = {          
        loadHtmlContent, 
        WAIT_FOR_CONTENT_SECONDS
      }
      element = buildAndInterpolate(template, context);
      // ============================================================================
      // Ejemplo de suscripción a un estado reactivo (clock) 
      // para actualizar el contador en el template.
      // ============================================================================
      const slot = element.querySelector('#time-slot');
      clock.on('times', (value) => {        
        if (slot) slot.textContent = String(WAIT_FOR_CONTENT_SECONDS - value);
      });
      setTimeout(() => loadHtmlContent(), WAIT_FOR_CONTENT_SECONDS * 1000);
      return element;
    }
  };
};

export default aboutPage;
