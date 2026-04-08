import type { ComponentContext } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { pubSub } from "../core/services/pubsub.service";
import { BaseComponent } from "../core/types";

import { APP_CONFIG } from "@/app.config";

export class LoaderComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      showLoader: false,
      message: 'Cargando...'
    });    
    this.addCleanup([
      pubSub.subscribe(APP_CONFIG.messages.httpClient.loading, () => this.state.showLoader = true),
      pubSub.subscribe(APP_CONFIG.messages.httpClient.loaded, () => this.state.showLoader = false),

      pubSub.subscribe(APP_CONFIG.messages.router.loading, () => this.state.showLoader = true),
      pubSub.subscribe(APP_CONFIG.messages.router.loaded, () => this.state.showLoader = false),
      pubSub.subscribe(APP_CONFIG.messages.router.error, () => this.state.showLoader = false)
    ]);
  }

  render() {
    const hidden = true;
    const template = `
      @if(showLoader)
        <div class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div class="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <span class="mt-4 text-lg font-medium text-white tracking-wide">{message}</span>
        </div>
      @endif
    `;
    return hidden ? null : buildAndInterpolate(template, this.state, false)
  }
}




