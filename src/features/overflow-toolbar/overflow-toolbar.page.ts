
import { APP_CONFIG } from '@/app.config';
import { buildAndInterpolate } from '@/core/dom';
import { router } from '@/core/services/router.service';
import { BaseComponent } from '@/core/types';

import type { ToolbarAction } from './overflow-toolbar.component';

const DEMO_ACTIONS: ToolbarAction[] = [
  { id: 'new',     label: 'Nuevo',      icon: 'plus',     tooltip: 'Crear nuevo elemento' },
  { id: 'edit',    label: 'Editar',     icon: 'settings', tooltip: 'Editar elemento seleccionado' },
  { id: 'delete',  label: 'Eliminar',   icon: 'trash',    tooltip: 'Eliminar elemento seleccionado' },
  { id: 'share',   label: 'Compartir',  icon: 'share-2',  tooltip: 'Compartir elemento' },
  { id: 'users',   label: 'Usuarios',   icon: 'users',    tooltip: 'Gestionar usuarios' },
  { id: 'info',    label: 'Info',       icon: 'info',     tooltip: 'Ver información detallada' },
  { id: 'power',   label: 'Power',      icon: 'power',    tooltip: 'Acción deshabilitada', disabled: true },
  { id: 'code',    label: 'Código',     icon: 'code',     tooltip: 'Ver código fuente' },
];

// Pre-serialized JSON for safe embedding in HTML templates
const DEMO_ACTIONS_JSON = JSON.stringify(DEMO_ACTIONS);

export default class OverflowToolbarPage extends BaseComponent {

  init() {
    APP_CONFIG.registerComponent(
      'app-overflow-toolbar',
      () => import('./overflow-toolbar.component')
    );
    this.setState({
      lastAction: null as ToolbarAction | null,
      containerWidth: 580,
    });
  }

  goBack(): void {
    router.navigateTo('landing');
  }

  handleActionClick(action: ToolbarAction): void {
    this.state.lastAction = action;
  }

  updateWidth(el: HTMLInputElement): void {
    this.state.containerWidth = Number(el.value);
  }

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const template = `
      <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div class="max-w-4xl mx-auto space-y-8">

          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black text-slate-900 dark:text-white">
                <span class="text-indigo-500">Overflow Toolbar</span>
              </h1>
              <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Los botones que no caben en el contenedor se colapsan automáticamente en un menú.
              </p>
            </div>
            <button
              on-click="goBack"
              class="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400
                     hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <i data-icon="arrow-left" class="size-4"></i>
              <span class="hidden sm:inline">Volver</span>
            </button>
          </div>

          <!-- Interactive width control -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Demo interactivo — ancho ajustable
            </h2>
            <div>
              <label class="text-sm text-slate-600 dark:text-slate-400">
                Ancho del contenedor:
                <span class="font-semibold text-indigo-500" data-bind="text:state.containerWidth">{state.containerWidth}</span>px
              </label>
              <input
                type="range"
                min="80"
                max="800"
                value="{state.containerWidth}"
                on-input="updateWidth"
                class="w-full mt-2 accent-indigo-500"
              />
            </div>
            <div
              class="border border-slate-200 dark:border-slate-700 rounded-lg p-2 transition-all"
              data-bind="style.width:state.containerWidth"
              style="max-width: 100%;"
            >
              <div
                data-component="app-overflow-toolbar"
                data-actions='${DEMO_ACTIONS_JSON}'
                (actionclick)="handleActionClick"
              ></div>
            </div>

            @if(state.lastAction)
              <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
                <i data-icon="{state.lastAction.icon}" class="size-4 text-indigo-500 shrink-0"></i>
                <div class="text-sm">
                  <span class="font-medium text-indigo-700 dark:text-indigo-300">{state.lastAction.label}</span>
                  <span class="text-slate-500 dark:text-slate-400 ml-2">{state.lastAction.tooltip}</span>
                </div>
              </div>
            @endif
          </div>

          <!-- Fixed width examples -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Distintos tamaños fijos
            </h2>

            <div class="space-y-3">
              <div>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">100% — todos los botones visibles</p>
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2 w-full">
                  <div
                    data-component="app-overflow-toolbar"
                    data-actions='${DEMO_ACTIONS_JSON}'
                  ></div>
                </div>
              </div>

              <div>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">400px — overflow parcial</p>
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2" style="width: 400px; max-width: 100%;">
                  <div
                    data-component="app-overflow-toolbar"
                    data-actions='${DEMO_ACTIONS_JSON}'
                  ></div>
                </div>
              </div>

              <div>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-1">200px — overflow máximo</p>
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-2" style="width: 200px; max-width: 100%;">
                  <div
                    data-component="app-overflow-toolbar"
                    data-actions='${DEMO_ACTIONS_JSON}'
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }

}
