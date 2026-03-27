import { APP_CONFIG } from "../../app.config";
import { buildAndInterpolate } from "../../core/dom";
import { pubSub } from "../../core/services/pubsub.service";
import { BaseComponent} from "../../core/types";
import type { ComponentContext, ComponentInitValue } from "../component.model";

export class CounterComponent extends BaseComponent {
  
  // private subs!: StateCallback<void>;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    const count = ~~(this.props.value || 0); 
    super.setState({ count });    
    this.addCleanup(
      APP_CONFIG.i18n.changed(() => this.invalidate())
    );
  }

  increment() {
    this.state.count++;
    pubSub.publish('COUNT_UPDATED', { id: this.instanceId, val: this.state.count });
  }

  render(changedProp?: string): HTMLElement {
    if(changedProp) console.log(changedProp);
    const template = `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 m-2 transition-all hover:shadow-md">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Instancia #{instanceId}</h4>
          <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        <div class="text-center py-4">
          <span class="text-4xl font-black text-slate-800">{state.count}</span>
          <p class="text-sm text-slate-500 mt-1">{'clicks'}</p>
          <p class="text-sm text-slate-500 mt-1" data-t="clicks"></p>
        </div>
        <button 
          id="counter-button-{instanceId}"
          on-click="increment" 
          class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white 
          font-semibold rounded-lg shadow-md focus:outline-none 
          focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
          transition-colors">
          {t:ui.actions.increment}
        </button>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
