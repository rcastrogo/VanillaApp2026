import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolateDSL } from '@/core/template-compiler';
import { BaseComponent } from '@/core/types';

export class TemplateDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      title: 'VanillaApp2026',
      showExtra: false,
      items: ['Manzana', 'Plátano', 'Naranja', 'Uva'],
      user: { name: 'Copilot', role: 'admin' },
    });
  }

  toggleExtra() {
    this.state.showExtra = !this.state.showExtra;
  }

  render() {
    const dslTemplate = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="code" class="size-5 text-blue-500"></i>
          TemplateDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Interpolación con <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">{expr}</code>,
          directivas DSL <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">
          y <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">
        </p>

        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-2">
          <p class="text-sm"><span class="font-semibold">Título:</span> {state.title}</p>
          <p class="text-sm"><span class="font-semibold">Usuario:</span> {state.user.name} ({state.user.role})</p>
        </div>

        <div>
          <ul class="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
            @each(item in state.items)
              <li>{item}</li>
            @endeach
          </ul>
        </div>

        <div>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Condicional con <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">
         
          @if(state.user.role === 'admin')
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold rounded-full">
              <i data-icon="shield" class="size-3"></i> Admin
            </span>
          @else
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs font-bold rounded-full">
              Usuario estándar
            </span>
          @endif
        </div>

        <button on-click="toggleExtra"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          @if(state.showExtra) Ocultar extra @else Mostrar extra @endif
        </button>

        @if(state.showExtra)
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
            ¡Contenido condicional visible gracias a <strong>if / else / endif</strong>!
          </div>
        @endif
      </div>
    `;
    return buildAndInterpolateDSL(dslTemplate, this);
  }
}
