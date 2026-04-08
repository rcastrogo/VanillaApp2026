import { configureRouter } from "@/app.routes";
import { buildAndInterpolate } from "@/core/dom";
import { router } from "@/core/services/router.service";
import { BaseComponent } from "@/core/types";

export default class SplashScreenPage extends BaseComponent {

  template = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div class="text-center max-w-md border rounded-2xl shadow-lg p-4 bg-card dark:bg-gray-800">
        <div data-component="app-logo" class="text-5xl mb-4">
          Por Rafael Castro Gómez
        </div>
        <div data-component="app-progress-bar" class="mb-6 px-12"></div>
        <div class="mb-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Un micro-framework moderno construido en JavaScript puro, diseñado para ofrecer rendimiento, simplicidad y control total sin dependencias innecesarias.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-4 mb-6">
          <span class="flex flex-col items-center justify-center px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <i data-icon="activity" class="mb-1"></i>
            <span>Sin dependencias</span>
          </span>
          <span class="flex flex-col items-center justify-center px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <i data-icon="share-2" class="mb-1"></i>
            <span>Reactive-ready</span>
          </span>
          <span class="flex flex-col items-center justify-center px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <i data-icon="tv" class="mb-1"></i>
            <span>Componentes</span>
          </span>
          <span class="flex flex-col items-center justify-center px-3 py-2 text-xs rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <i data-icon="rocket" class="mb-1"></i>
            <span>Ultra rápido</span>
          </span>
        </div>
        <div class="border-b pb-4">
          <p class="text-sm italic text-gray-500 dark:text-gray-400">
            “Menos magia. Más control. Mejor rendimiento.”
          </p>
        </div>
        <button class="app-button mt-4" 
          on-click="continueToApp">
          Continuar
        </button>        

        <div class="border-t mt-4 pt-2 text-center">
          <p class="text-sm text-gray-400">© 2026 VanillaApp2026. Reservados todos los derechos.</p>
        </div>

      </div>
    </div>
  `;

  init(): void {
    document.addEventListener('keydown', this.handleEscapeKey);
    this.addCleanup(() => {
      document.removeEventListener('keydown', this.handleEscapeKey);
      console.log('SplashScreenPage destroyed, event listener removed.');
    });
  }

  render() {    
    return buildAndInterpolate(this.template, this);
  }

  continueToApp = () => {
    if(location.pathname === '/splash-screen') {
      router.navigateTo('/');
    }
    if(router.routes.length < 1) configureRouter();       
  };

  handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.continueToApp();
    }
  };

};


