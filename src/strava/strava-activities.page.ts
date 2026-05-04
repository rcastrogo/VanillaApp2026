
import { 
  stravaService, 
  type StravaActivity, 
  type StravaAthlete 
} from './strava.service';

import { APP_CONFIG } from '@/app.config';
import type { ComponentBinding, ComponentContext, ComponentFactory, ComponentInitValue } from '@/components/component.model';
import { $, build, buildAndInterpolate } from '@/core/dom';
import { hydrateComponents, resolveBindingValue } from '@/core/hydrate';
import { router } from '@/core/services/router.service';
import { BaseComponent } from '@/core/types';


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

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttribute(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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

function decodePolyline(encoded: string, precision = 5): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

function buildPolylineSvg(encoded: string): string {
  if (!encoded) return '';

  const coords = decodePolyline(encoded);
  if (coords.length < 2) return '';

  const width = 760;
  const height = 180;
  const padding = 10;

  const lats = coords.map(([lat]) => lat);
  const lngs = coords.map(([, lng]) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  const points = coords
    .map(([lat, lng]) => {
      const x = padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
      const y = padding + (1 - (lat - minLat) / latSpan) * (height - padding * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const staticMapUrl = getMapTilerStaticMapUrl(coords, width, height);

  return `
    <svg 
      viewBox="0 0 ${width} ${height}" 
      class="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" 
      role="img" 
      aria-label="Ruta de la actividad">
        ${staticMapUrl ? `
        <image href="${staticMapUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" opacity="0.8"></image>
        ` : ''}
        <polyline 
          points="${points}" 
          fill="none" 
          stroke="#f97316" 
          stroke-width="3.5" 
          stroke-linecap="round" 
          stroke-linejoin="round">
        </polyline>
    </svg>
  `;
}

function getMapTilerStaticMapUrl(coords: [number, number][], width: number, height: number): string {
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
  if (!apiKey) return '';

  const lats = coords.map(([lat]) => lat);
  const lngs = coords.map(([, lng]) => lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const zoom = getStaticMapZoom(minLat, maxLat, minLng, maxLng, width, height);

  const size = `${width}x${height}`;
  return `https://api.maptiler.com/maps/streets-v2/static/${centerLng},${centerLat},${zoom}/${size}.png?key=${encodeURIComponent(apiKey)}`;
}

function getStaticMapZoom(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  width: number,
  height: number
): number {
  const WORLD_DIM = 256;
  const ZOOM_MAX = 18;
  const ZOOM_MIN = 2;
  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };

  const latFraction = Math.max((latRad(maxLat) - latRad(minLat)) / Math.PI, 1e-6);
  const lngDiff = maxLng - minLng;
  const lngFraction = Math.max(((lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360), 1e-6);

  const zoomLat = Math.log2(height / WORLD_DIM / latFraction);
  const zoomLng = Math.log2(width / WORLD_DIM / lngFraction);
  const zoom = Math.floor(Math.min(zoomLat, zoomLng) - 0.5);

  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number.isFinite(zoom) ? zoom : 12));
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
      const avatar = $('[data-ref="athleteAvatar"]', this.element).one();
      const name = $('[data-ref="athleteName"]', this.element).one();
      const location = $('[data-ref="athleteLocation"]', this.element).one();

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
      const list = $('[data-ref="activitiesList"]', this.element).one();
      if (!list) return;

      list.innerHTML = this.activities.map((activity: StravaActivity) => `
        <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">${getActivityIcon(activity.type)}</span>
              <div>
                <h3 class="font-semibold text-slate-800 dark:text-white">${escapeHtml(activity.name)}</h3>
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

          <div 
            data-component="app-polyline-viewer"
            data-polyline="${escapeAttribute(activity.map?.summary_polyline || '')}"
            class="mt-4">
          </div>
        </div>
      `).join('');

      hydrateComponents(list, this);
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


class PolylineViewerComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
  }

  render(): HTMLElement {
    const polyline = this.props.polyline || '';
    const svg = buildPolylineSvg(polyline);
    const hasMapTilerKey = Boolean(import.meta.env.VITE_MAPTILER_API_KEY);
    const template = `
      <div>
        ${svg || `
          <div class="
            h-20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs
            text-slate-500 dark:text-slate-400
            grid place-items-center
          ">
            Sin ruta disponible
          </div>
        `}
        ${svg && !hasMapTilerKey ? `
          <p class="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            Falta VITE_MAPTILER_API_KEY: se muestra solo la ruta SVG sin imagen de fondo.
          </p>
        ` : ''}
      </div>
    `;
    return build('div', template);
  }
}

Promise.resolve().then(() => {
  APP_CONFIG.registerComponent(
    'app-polyline-viewer', 
    PolylineViewerComponent
  );
});

export default stravaActivitiesPage;
