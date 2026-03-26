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
    if (ctx && ctx.parent) {
      this.props = { ...ctx.parent.dataset };
      this.children = Array.from(ctx.parent.childNodes);
    }
    this.setState({
      expanded: this.props.expanded === 'true' || false,
      title: this.props.title || 'Texto por defecto'
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
          <div data-component="app-collapsible-clock"></div>
        @endif    
        @if(state.expanded === false) 
        @endif    
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export function useSelector(stateProxy: any, prop: string, callback: (val: any) => void) {
//   if (!stateProxy.__subscribers) {
//     stateProxy.__subscribers = {};
//   }

//   if (!stateProxy.__subscribers[prop]) {
//     stateProxy.__subscribers[prop] = [];
//   }
//   stateProxy.__subscribers[prop].push(callback);
// }

// export function createReactiveState<T extends object>(initial: T): T {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//   const subscribers: Record<string, Function[]> = {};

//   return new Proxy(initial, {
//     get(target, prop) {
//       if (prop === '__subscribers') return subscribers;
//       return target[prop as keyof T];
//     },
//     set(target, prop, value) {
//       if (target[prop as keyof T] === value) return true;
//       target[prop as keyof T] = value;
//       if (subscribers[prop as string]) {
//         subscribers[prop as string].forEach(cb => cb(value));
//       }
//       return true;
//     }
//   });
// }

class ClockComponent extends BaseComponent {


  private _state = useState({ seconds: 0, date: '' });

  init(): void {
    const { put } = this._state;
    const intervalId = setInterval(() => {
      put('date', new Date().toTimeString().split(' ')[0])
    }, 1_000);
    this.addCleanup(() => clearInterval(intervalId));
  }

  render(): HTMLElement {

    const { on } = this._state;

    const view = build('div', `
      <div class="p-4 rounded-lg shadow-md border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-lg">
        <div class="flex items-center gap-3">
          <i data-icon="timer" class="text-blue-500 dark:text-blue-400 size-6"></i>
          <span class="font-mono text-xl font-bold text-slate-700 dark:text-slate-100" id="date-slot">
            --:--:--
          </span>
        </div>
      </div>
    `);

    on(
      'date', 
      value => {
        view.querySelector('#date-slot')!.textContent = value;
      });

    return view;
  }

}

// Registro explícito fuera de la clase
Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-collapsible-clock', ClockComponent);
});