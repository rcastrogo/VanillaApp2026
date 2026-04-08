import { APP_CONFIG } from '@/app.config';
import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { pubSub } from '@/core/services/pubsub.service';
import { BaseComponent } from '@/core/types';
import { getAllAsync, type SecureEndPoint } from '@/services/endpoint.service';

export class EndpointServiceDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      endpoints: [] as SecureEndPoint[],
      status: 'idle',
      error: '',
    });
  }

  async load() {
    this.state.status = 'loading';
    this.state.error = '';
    pubSub.publish( APP_CONFIG.messages.httpClient.loading);
    const result = await getAllAsync();
    pubSub.publish( APP_CONFIG.messages.httpClient.loaded);
    if (typeof result === 'string') {
      this.state.status = 'error';
      this.state.error = result;
      return;
    }
    this.state.endpoints = result.data;
    this.state.status = 'done';
  }

  render() {
    const endpoints: SecureEndPoint[] = this.state.endpoints ?? [];
    const rows = endpoints
      .map(ep => `
        <tr class="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <td class="py-2 px-3 text-xs font-mono text-slate-600 dark:text-slate-400">${ep.id}</td>
          <td class="py-2 px-3 text-sm font-semibold text-slate-800 dark:text-slate-200">${ep.name}</td>
          <td class="py-2 px-3 text-xs text-slate-500 dark:text-slate-400 break-all">${ep.url}</td>
          <td class="py-2 px-3">
            <span class="px-2 py-0.5 text-xs rounded-full ${ep.env === 'PRO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}">
              ${ep.env}
            </span>
          </td>
          <td class="py-2 px-3 text-center text-xs">
            ${ep.favorite ? '★' : ''}
          </td>
        </tr>
      `)
      .join('');

    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="server" class="size-5 text-violet-500"></i>
          EndpointServiceDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Usa <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">endpoint.service.ts</code>
          → <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">getAllAsync()</code>
          para cargar datos desde <em>assets/apps.server.json</em>.
        </p>

        <div class="flex items-center gap-4">
          <button on-click="load"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <i data-icon="refresh-cw" class="inline size-4 mr-1"></i> Cargar endpoints
          </button>
          <span class="text-sm text-slate-500 dark:text-slate-400">{state.status}</span>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 max-h-64 overflow-y-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-100 dark:bg-slate-700 sticky top-0">
              <tr>
                <th class="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">ID</th>
                <th class="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Nombre</th>
                <th class="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">URL</th>
                <th class="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Entorno</th>
                <th class="py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">★</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="5" class="py-8 text-center text-sm text-slate-400">Sin datos</td></tr>`}
            </tbody>
          </table>
        </div>

        <p class="text-red-500 text-sm min-h-[1.25rem]">{state.error}</p>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
