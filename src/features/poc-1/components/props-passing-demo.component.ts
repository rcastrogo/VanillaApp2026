import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

// ─── Child component ────────────────────────────────────────────────────────

export class PropsChildComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 space-y-2">
        <p class="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-3">
          Props recibidas por el hijo
        </p>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span class="text-slate-500 dark:text-slate-400">title</span>
          <span class="font-medium text-slate-800 dark:text-slate-100">{props.title}</span>
          <span class="text-slate-500 dark:text-slate-400">color</span>
          <span class="font-medium text-slate-800 dark:text-slate-100">{props.color}</span>
          <span class="text-slate-500 dark:text-slate-400">count</span>
          <span class="font-medium text-slate-800 dark:text-slate-100">{props.count}</span>
          <span class="text-slate-500 dark:text-slate-400">active</span>
          <span class="font-medium text-slate-800 dark:text-slate-100">{props.active}</span>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-500 pt-2">
          Las props provienen de los atributos <code class="bg-indigo-100 dark:bg-indigo-900 px-1 rounded">data-*</code>
          del elemento padre a través de <code class="bg-indigo-100 dark:bg-indigo-900 px-1 rounded">this.props</code>.
        </p>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

// ─── Parent component ───────────────────────────────────────────────────────

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
    // Build the child manually with props passed via dataset
    const childContainer = document.createElement('div');
    childContainer.dataset.title = this.state.title;
    childContainer.dataset.color = this.state.color;
    childContainer.dataset.count = String(this.state.count);
    childContainer.dataset.active = String(this.state.active);

    const child = new PropsChildComponent({ parent: childContainer });
    child.init({ parent: childContainer });
    const childEl = child.render();

    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4';

    const header = buildAndInterpolate(`
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
              on-keyup="handleTitle"
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
                on-input="handleCount"
                class="w-full accent-indigo-500"
              />
            </div>
            <div>
              <button on-click="toggleActive"
                class="px-3 py-2 text-sm font-semibold rounded-lg transition-colors
                  {state.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'}">
                active: {state.active}
              </button>
            </div>
          </div>
        </div>
      </div>
    `, this) as HTMLElement;

    wrapper.appendChild(header);
    wrapper.appendChild(childEl);
    this.bind(wrapper);
    return wrapper;
  }
}
