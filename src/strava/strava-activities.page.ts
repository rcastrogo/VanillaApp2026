
import type { ComponentBinding, ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { resolveBindingValue } from '@/core/hydrate';
import { router } from '@/core/services/router.service';
import { stravaService, type StravaActivity, type StravaAthlete } from './strava.service';

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2) + ' km';
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatSpeed(metersPerSecond: number): string {
  return (metersPerSecond * 3.6).toFixed(1) + ' km/h';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Swim: '🏊',
    Walk: '🚶',
    Hike: '🥾',
    VirtualRide: '🚴‍♂️',
    VirtualRun: '🏃‍♂️',
  };
  return icons[type] || '🏅';
}

const stravaActivitiesPage: ComponentFactory = () => {
  const context = {
    athlete: null as StravaAthlete | null,
    activities: [] as StravaActivity[],
    loading: true,
    currentPage: 1,
    hasMore: true,
    errorMessage: '',
    element: null as HTMLElement | null,
    bindings: null as ComponentBinding[] | null,

    render() {
      if (!stravaService.isAuthenticated()) {
        setTimeout(() => router.navigateTo('/strava'), 0);
        return buildAndInterpolate('<div></div>', this);
      }

      this.loadData();

      const template = `
        <div class="max-w-4xl mx-auto p-4">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <i data-icon="activity" class="inline-flex size-6 text-orange-500"></i>
              <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Mis Actividades</h1>
            </div>
            <div class="flex items-center gap-2">
              <button on-click="refreshActivities" class="app-button btn-secondary">
                <i data-icon="refresh-ccw" class="inline-flex size-4 mr-1"></i>
                Actualizar
              </button>
              <button on-click="logout" class="app-button">
                <i data-icon="power" class="inline-flex size-4 mr-1"></i>
                Desconectar
              </button>
            </div>
          </div>

          <!-- Athlete Info -->
          <div data-bind="show:athlete" class="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div class="flex items-center gap-4">
              <div data-ref="athleteAvatar" class="size-12 rounded-full bg-slate-300 overflow-hidden">
              </div>
              <div>
                <p data-ref="athleteName" class="font-bold text-lg text-slate-800 dark:text-white"></p>
                <p data-ref="athleteLocation" class="text-sm text-slate-500 dark:text-slate-400"></p>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div data-bind="show:errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p data-bind="text:errorMessage" class="text-red-700 dark:text-red-400"></p>
          </div>

          <!-- Loading -->
          <div data-bind="show:loading" class="text-center py-8">
            <p class="text-slate-500 dark:text-slate-400">Cargando actividades...</p>
          </div>

          <!-- Activities List -->
          <div data-ref="activitiesList" class="space-y-3"></div>

          <!-- Load More -->
          <div data-bind="show:hasMore" class="text-center mt-6 mb-8">
            <button on-click="loadMore" class="app-button btn-primary">
              <i data-icon="download" class="inline-flex size-4 mr-1"></i>
              Cargar más actividades
            </button>
          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    },

    async loadData() {
      try {
        const athlete = await stravaService.getAthlete();
        this.athlete = athlete;
        this.renderAthleteInfo();
        await this.fetchActivities();
      } catch (err) {
        this.errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;
        this.loading = false;
        this.updateBindings();
      }
    },

    async fetchActivities() {
      try {
        this.loading = true;
        this.updateBindings();
        const newActivities = await stravaService.getActivities(this.currentPage, 20);
        this.activities = [...this.activities, ...newActivities];
        this.hasMore = newActivities.length === 20;
        this.loading = false;
        this.renderActivities();
        this.updateBindings();
      } catch (err) {
        this.errorMessage = `Error al cargar actividades: ${err instanceof Error ? err.message : String(err)}`;
        this.loading = false;
        this.updateBindings();
      }
    },

    renderAthleteInfo() {
      if (!this.athlete || !this.element) return;
      const avatar = this.element.querySelector('[data-ref="athleteAvatar"]') as HTMLElement;
      const name = this.element.querySelector('[data-ref="athleteName"]') as HTMLElement;
      const location = this.element.querySelector('[data-ref="athleteLocation"]') as HTMLElement;

      if (avatar && this.athlete.profile_medium) {
        avatar.innerHTML = `<img src="${this.athlete.profile_medium}" alt="Avatar" class="size-12 rounded-full" />`;
      }
      if (name) {
        name.textContent = `${this.athlete.firstname} ${this.athlete.lastname}`;
      }
      if (location) {
        location.textContent = [this.athlete.city, this.athlete.state, this.athlete.country].filter(Boolean).join(', ');
      }
    },

    renderActivities() {
      if (!this.element) return;
      const list = this.element.querySelector('[data-ref="activitiesList"]') as HTMLElement;
      if (!list) return;

      list.innerHTML = this.activities.map((activity: StravaActivity) => `
        <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">${getActivityIcon(activity.type)}</span>
              <div>
                <h3 class="font-semibold text-slate-800 dark:text-white">${activity.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">${formatDate(activity.start_date_local)} · ${activity.type}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              ${activity.kudos_count ? `<span>👍 ${activity.kudos_count}</span>` : ''}
              ${activity.achievement_count ? `<span>🏆 ${activity.achievement_count}</span>` : ''}
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Distancia</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${formatDistance(activity.distance)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Tiempo</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${formatDuration(activity.moving_time)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Vel. media</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${formatSpeed(activity.average_speed)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Desnivel</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${activity.total_elevation_gain.toFixed(0)} m</p>
            </div>
          </div>
          ${activity.average_heartrate || activity.average_watts ? `
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            ${activity.average_heartrate ? `
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">FC media</p>
              <p class="font-semibold text-red-500">${Math.round(activity.average_heartrate)} bpm</p>
            </div>` : ''}
            ${activity.max_heartrate ? `
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">FC máx</p>
              <p class="font-semibold text-red-600">${Math.round(activity.max_heartrate)} bpm</p>
            </div>` : ''}
            ${activity.average_cadence ? `
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Cadencia</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${Math.round(activity.average_cadence)} rpm</p>
            </div>` : ''}
            ${activity.average_watts ? `
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Potencia</p>
              <p class="font-semibold text-slate-700 dark:text-slate-200">${Math.round(activity.average_watts)} W</p>
            </div>` : ''}
          </div>` : ''}
        </div>
      `).join('');
    },

    async refreshActivities() {
      this.activities = [];
      this.currentPage = 1;
      this.hasMore = true;
      this.errorMessage = '';
      await this.fetchActivities();
    },

    async loadMore() {
      this.currentPage++;
      await this.fetchActivities();
    },

    logout() {
      stravaService.logout();
      router.navigateTo('/strava');
    },

    updateBindings() {
      if (this.bindings) {
        this.bindings.forEach((binding: ComponentBinding) => resolveBindingValue(binding, this));
      }
    },
  };

  return context;
};

export default stravaActivitiesPage;
