import { APP_CONFIG } from "../app.config";
import type { ComponentContext } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { pubSub } from "../core/services/pubsub.service";
import { BaseComponent } from "../core/types";

export class ThemeToggleComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(): void {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.setState({
      isDarkMode: isDark
    });
    this.addCleanup(
      [
        APP_CONFIG.i18n.changed(() => this.invalidate()),
        pubSub.subscribe(APP_CONFIG.messages.App.ThemeChanged, (isDarkMode) => {
          this.state.isDarkMode = Boolean(isDarkMode);
          this.invalidate();
        })
      ]
    );
  }

  toggleTheme() {
    this.state.isDarkMode = !this.state.isDarkMode;
    this.applyTheme(this.state.isDarkMode);
    pubSub.publish(APP_CONFIG.messages.App.ThemeChanged, this.state.isDarkMode);
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
      <div class="flex items-center justify-center">
        <button on-click="toggleTheme" 
          class="app-button
            relative flex items-center gap-2 px-3 py-2 rounded-md border 
            @if(state.isDarkMode)border-slate-700 text-yellow-200 @endif
            "
          >
        
          @if(state.isDarkMode)
            <i data-icon="sun" class="size-5"></i>
            <span class="text-sm hidden lg:block">{t:theme.light}</span>
          @endif

          @if(!state.isDarkMode)
            <i data-icon="moon" class="size-5 text-indigo-500"></i>
            <span class="text-sm hidden lg:block text-slate-700">{t:theme.dark}</span>
          @endif

        </button>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }
}