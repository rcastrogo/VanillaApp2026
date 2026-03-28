import type { ComponentContext } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';


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
