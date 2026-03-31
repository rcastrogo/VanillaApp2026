import type { ComponentContext } from "../../components/component.model";
import { buildAndInterpolate } from "../../core/dom";
import { BaseComponent } from "../../core/types";

export default class AdminLayout extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="flex flex-col min-h-screen">
        <div class="flex items-center justify-between">
          <div class="flex flex-col items-start space-x-4">
            <div data-component="app-logo" class="ml-2">
              Admin Panel 5
            </div>          
          </div>
          <nav class="flex flex-cols items-center gap-1">  
            <div data-component="app-language-selector" class="p-0"></div>
            <div data-component="app-theme-toggle" class="pl-0 pr-2 py-4"></div>
          </nav>
        </div>
        <main id="router-outlet" class="grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        </main>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}