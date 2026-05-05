
import { stravaService } from './strava.service';

import type { ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';


const stravaAuthPage: ComponentFactory = () => {
  const context = {
    message: 'Autorizando con Strava...',
    isError: false,

    render() {
      
      // Process OAuth callback
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        this.message = `Error de autorización: ${error}`;
        this.isError = true;
      } else if (code) {
        this.exchangeCode(code);
      } else {
        this.message = 'No se recibió código de autorización.';
        this.isError = true;
      }

      const template = `
        <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-4">
              <i data-icon="activity" class="inline-flex size-6 mr-2"></i>
              Strava - Autorización
            </h1>
            <p data-bind="text:message" class="text-slate-600 dark:text-slate-400 text-lg">
              {message}
            </p>
            @if(isError)
            <div class="mt-6">
              <button on-click="goToLogin" class="app-button btn-primary">
                <i data-icon="arrow-left" class="inline-flex size-4 mr-2"></i>
                Volver al login
              </button>
            </div>
            @endif
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    },

    async exchangeCode(code: string) {
      const result = await stravaService.exchangeToken(code);
      if(typeof result === 'string') {
        this.message = `Error al obtener token: ${result}`;
        this.isError = true;
        return;
      } 
      this.message = '¡Autorización exitosa! Redirigiendo...';
      setTimeout(() => router.navigateTo('/strava/activities'), 1000);
    },

    goToLogin() {
      router.navigateTo('/strava');
    },
  };

  return context;
};

export default stravaAuthPage;
