import type { ComponentContext, ComponentInitValue } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export class ThemeToggleComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(): void {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    super.setState({
      isDarkMode: isDark
    });  
  }

  toggleTheme() {
    this.state.isDarkMode = !this.state.isDarkMode;
    this.applyTheme(this.state.isDarkMode);
  }

  private applyTheme(isDark: boolean) {
    const root = document.documentElement;
    const css = document.createElement('style');
    css.appendChild(
      document.createTextNode(`* {
         -webkit-transition: none !important;
         -moz-transition: none !important;
         -o-transition: none !important;
         -ms-transition: none !important;
         transition: none !important;
      }`)
    );
    document.head.appendChild(css);
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.getComputedStyle(css).opacity;
    document.head.removeChild(css);
  }

  render() {
    const template = `
      <div class="flex items-center justify-center p-4">
        <button on-click="toggleTheme" 
          class="relative flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300
          {
            state.isDarkMode | 
              iif: bg-slate-800 border-slate-700 text-yellow-200 
                 : bg-white border-slate-200 text-slate-600 hover:bg-slate-50
          }">
          
          @if(state.isDarkMode)
            <i data-icon="sun" class="size-5"></i>
            <span class="hidden text-sm font-bold">Modo Claro</span>
          @endif

          @if(!state.isDarkMode)
            <i data-icon="moon" class="size-5 text-indigo-500"></i>
            <span class="hidden text-sm font-bold text-slate-700">Modo Oscuro</span>
          @endif

        </button>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }
}