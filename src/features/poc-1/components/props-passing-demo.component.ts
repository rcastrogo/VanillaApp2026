import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export class PropsPassingDemoComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      title: 'Hola desde el padre',
      color: 'indigo',
      count: 42,
      active: true,
    });
  }

  handleTitle(el: HTMLInputElement) {
    this.state.title = el.value;
  }

  handleCount(el: HTMLInputElement) {
    this.state.count = Number(el.value);
  }

  toggleActive() {
    this.state.active = !this.state.active;
  }

  render() {
   
    const temlate  = `
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i data-icon="share-2" class="size-5 text-indigo-500"></i>
          PropsPassingDemoComponent
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          El componente padre pasa datos al hijo mediante atributos
          <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">data-*</code>
          que el hijo lee como <code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">this.props</code>.
        </p>

        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Controles del padre
          </p>
          <div class="space-y-2">
            <label class="text-sm text-slate-600 dark:text-slate-400">title</label>
            <input
              type="text"
              value="{state.title}"
              on-change="handleTitle"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm
                     bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex-1 space-y-1">
              <label class="text-sm text-slate-600 dark:text-slate-400">count: {state.count}</label>
              <input
                type="range"
                min="0"
                max="100"
                value="{state.count}"
                on-change="handleCount"
                class="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>
        <div 
          data-component="props-child-component"
          data-title="{state.title}"
          data-color="{state.color}"
          data-count="{state.count}"
          data-active="{state.active}"
          >
        </div>
      </div>
    `;
    
    return buildAndInterpolate(temlate, this);

  }
}
