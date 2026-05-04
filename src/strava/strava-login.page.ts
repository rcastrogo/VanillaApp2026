
import type { ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';
import { stravaService } from './strava.service';

const stravaLoginPage: ComponentFactory = () => {
  return {
    render() {
      // If already authenticated, redirect to activities
      if (stravaService.isAuthenticated()) {
        setTimeout(() => router.navigateTo('/strava/activities'), 0);
      }

      const template = `
        <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-slate-800 dark:text-white mb-2">
              <i data-icon="activity" class="inline-flex size-8 mr-2"></i>
              Strava
            </h1>
            <p class="text-slate-600 dark:text-slate-400">
              Conecta tu cuenta de Strava para ver tus actividades deportivas.
            </p>
          </div>
          <div class="flex flex-col items-center gap-4">
            <button on-click="connectStrava" class="app-button btn-primary text-lg px-8 py-3">
              <i data-icon="power" class="inline-flex size-5 mr-2"></i>
              Conectar con Strava
            </button>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Se te redirigirá a Strava para autorizar el acceso a tu perfil y actividades.
            </p>
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    },
    connectStrava() {
      window.location.href = stravaService.getAuthorizationUrl();
    },
  };
};

export default stravaLoginPage;
