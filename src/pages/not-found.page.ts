import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent } from "@/core/types";

export default class NotFoundErrorPage extends BaseComponent {
  template = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div class="text-center max-w-md">
        <div data-component="app-logo" class="border-b text-5xl pb-4 mb-4"></div>
        <img 
          src="https://cdn.thesimpsonsapi.com/200/character/37.webp"
          alt="Nelson HA-HA"
          class="mx-auto w-48 h-auto mb-6 rounded-lg shadow-lg"
        />
        <h1 class="text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Error 404
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-2">
          AHJAJAJA!! 😂
        </p>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Esta página no existe... ¡y se están riendo de ti!
        </p>
        <a href="/" 
           route-to="/"
           class="app-button bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-300">
          Volver al inicio
        </a>
        <div class="border-t border-gray-700 mt-4 pt-2 text-center">
          <p class="text-gray-400">&copy; 2026 VanillaApp2026. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;
  render() {
    return buildAndInterpolate(this.template, this);
  }

};


