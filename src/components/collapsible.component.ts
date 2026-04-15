import type { ComponentContext, ComponentInitValue } from "./component.model";
import { APP_CONFIG } from "../app.config";
import { build, buildAndInterpolate } from "../core/dom";
import { useState } from "../core/state.utils";
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
          <div data-component="app-collapsible-clock" class="m-2"></div>     
        @endif    
        @if(state.expanded === false) 
        @endif    
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

class ClockComponent extends BaseComponent {

  private _state = useState({ seconds: 0, date: '' });

  init(): void {
    const { put : update } = this._state;
    const intervalId = setInterval(() => {
      update('date', new Date().toTimeString().split(' ')[0])
    }, 1_000);
    this.addCleanup(() => clearInterval(intervalId));
  }

  render(): HTMLElement {

    const { on } = this._state;

    const view = build('div', `
      <div class="rounded-lg p-1.5 border bg-background">
        <div class="flex items-center gap-3 mx-1">
          <i data-icon="timer" class="size-6 hidden lg:block"></i>
          <span class="font-mono text-slate-700 dark:text-slate-100" id="date-slot">
            --:--:--
          </span>
        </div>
      </div>
    `, true);

    on(
      'date', 
      value => {
        view.querySelector('#date-slot')!.textContent = value;
      });

    return view;
  }

}

Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-collapsible-clock', ClockComponent);
});