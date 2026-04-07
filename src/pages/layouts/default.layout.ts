import type { ComponentContext } from "../../components/component.model";
import { buildAndInterpolate } from "../../core/dom";
import { BaseComponent } from "../../core/types";

export default class DefaultLayout extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(): void { /* empty */ }

  render() {
    const template = `
      <div>
        <div class="flex flex-col min-h-screen">
          <div class="sm:sticky top-0 z-50 w-full">
            <div data-component="app-header"></div>
          </div>
          <main 
            id="router-outlet" 
            class="grow w-full max-w-7xl mx-auto py-4 my-4 overflow-hidden">
          </main>
          <footer class="mt-auto border-t">
            <div data-component="app-footer"></div>
          </footer>
        </div>
        <div data-component="app-loader"></div>
        <div data-component="app-notification-panel"></div>     
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}