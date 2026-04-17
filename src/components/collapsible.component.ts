import type { ComponentContext, ComponentInitValue } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export class CollapsibleComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.setState({
      expanded: this.props.expanded === 'true' || false,
      title: this.props.title || 'Texto por defecto'
    });
  }

  toggle() {
    console.log(this.children.length)
    this.state.expanded = !this.state.expanded;
  }

  render(changedProp?: string) {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }

    const template = `
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
        <button 
          on-click="toggle"
          class="flex w-full items-center justify-between p-4 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center gap-3">            
            <span class="font-semibold text-slate-700 dark:text-slate-200">
              {state.title}
            </span>
          </div>
          <span data-bind="show:state.expanded"><i data-icon="chevron-up" class="size-9"></i></span>
          <span data-bind="hide:state.expanded"><i data-icon="chevron-down" class="size-9"></i></span>
        </button>
        <div 
          data-each="child in children" 
          data-bind="toggle.hidden:state.expanded | not"
          class="animate-fade-in border-t border-slate-100
            bg-slate-50/30 p-4 text-slate-600
            dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400"
        >
        </div>
        @if(state.expanded)    
        @endif    
        @if(state.expanded === false) 
        @endif    
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
