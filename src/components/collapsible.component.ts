import type { ComponentContext, ComponentInitValue } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export class CollapsibleComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) { 
    if(ctx && ctx.parent){
      this.props = { ...ctx.parent.dataset };
      this.children = Array.from(ctx.parent.childNodes); 
    }
    this.setState({
      expanded: this.props.expanded === 'true' || false,
      title : this.props.title || 'Texto por defecto'
    });
  }

  toggle() {
    this.state.expanded = !this.state.expanded;
  }

  render() {
    const template = `
      <div class="my-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
        <button 
          on-click="toggle"
          class="flex w-full items-center justify-between p-4 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center gap-3">            
            <span class="font-semibold text-slate-700 dark:text-slate-200">
              {state.title}
            </span>
          </div>
          <i data-icon="{state.expanded | iif : chevron-up : chevron-down}" class="size-9"></i>
        </button>
        <div 
          data-each="child in children" 
          class="animate-fade-in border-t border-slate-100
            bg-slate-50/30 p-4 text-slate-600
            dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400
            {state.expanded | iif : hidden-none : hidden}"
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




