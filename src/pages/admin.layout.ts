import type { ComponentContext } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export default class AdminLayout extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        Admin
        <main id="router-outlet" class="grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        </main>

      </div>
    `;
    return  buildAndInterpolate(template, this);
  }
}