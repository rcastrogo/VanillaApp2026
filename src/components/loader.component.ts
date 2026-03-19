import type { ComponentContext } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { AppMessages } from "../core/services/app-engine.service";
import { pubSub } from "../core/services/pubsub.service";
import { BaseComponent } from "../core/types";

export class LoaderComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init() {
    this.setState({
      showLoader: false,
      title: 'Hola'
    });    
    this.addCleanup([
      pubSub.subscribe(AppMessages.Router.Loading, () => this.state.showLoader = true),
      pubSub.subscribe(AppMessages.Router.Loaded, () => this.state.showLoader = false),
      pubSub.subscribe(AppMessages.Router.Error, () => this.state.showLoader = false)
    ]);
  }

  render() {
    const template = `
      @if(showLoader)
        <div class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div class="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <span class="mt-4 text-lg font-medium text-white tracking-wide">Cargando...</span>
        </div>
      @endif
    `;
    return buildAndInterpolate(template, this.state, false)
  }
}




