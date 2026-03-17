import type { ComponentContext } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export default class DefaultLayout extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header class="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div data-component="app-header"></div>
        </header>

        <main id="router-outlet" class="grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          </main>

        <footer class="mt-auto border-t border-slate-200 dark:border-slate-800">
          <div data-component="app-footer"></div>
        </footer>
      </div>
    `;
    return  buildAndInterpolate(template, this);
  }
}