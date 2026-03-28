import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export class HydrationDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      count: 0,
      message: '',
      inputValue: '',
    });
  }

  increment() {
    this.state.count++;
  }

  reset() {
    this.state.count = 0;
    this.state.message = 'Contador restablecido';
  }

  handleInput(el: HTMLInputElement) {
    this.state.inputValue = el.value;
    this.state.message = `Texto: "${el.value}"`;
  }

  render() {
    // buildAndInterpolate calls hydrateIcons + hydrateEventListeners + hydrateComponents
    // automatically, connecting on-click / on-keyup attributes to component methods.
    const template = `
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="zap" class="size-5 text-yellow-500"></i>
          HydrationDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Muestra cómo <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">buildAndInterpolate</code>
          (que internamente llama a <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">hydrateElement</code>)
          conecta atributos <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">on-click</code>,
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">on-keyup</code> e iconos SVG al DOM.
        </p>

        <div class="flex items-center gap-3">
          <span class="text-3xl font-black text-indigo-600 dark:text-indigo-400 w-12 text-center">
            {state.count}
          </span>
          <button on-click="increment"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <i data-icon="plus" class="inline size-4 mr-1"></i> Incrementar
          </button>
          <button on-click="reset"
            class="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors">
            Reset
          </button>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
            Input con <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">on-keyup</code>:
          </label>
          <input
            type="text"
            value="{state.inputValue}"
            on-keyup="handleInput"
            placeholder="Escribe algo..."
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm
                   bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200
                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <p class="text-sm text-emerald-600 dark:text-emerald-400 min-h-[1.5rem]">
          {state.message}
        </p>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
