

import { build } from "../../../core/dom";
import { BaseComponent, type ComponentContext } from "../../../core/types";

export default class BaseComponentPage extends BaseComponent {
  
  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="min-h-screen bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-4xl font-bold text-blue-600 mb-6 text-center">Componentes que Heredan de BaseComponent</h1>
          <p class="text-lg text-gray-700 mb-8 text-center">Descubre las poderosas características de los componentes basados en BaseComponent</p>

          <div class="space-y-6">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">Element Ya Definido</h2>
              <p class="text-gray-600">Cada componente tiene su elemento DOM principal predefinido, facilitando la manipulación y el renderizado sin crear elementos manualmente.</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">State Reactivo</h2>
              <p class="text-gray-600">El objeto state es reactivo: se inicializa en el constructor y cualquier cambio desencadena automáticamente un re-render del componente, manteniendo la UI sincronizada.</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">PubSub para Comunicación</h2>
              <p class="text-gray-600">Integra el sistema PubSub para comunicación desacoplada entre componentes. Publica y suscribe eventos para una arquitectura modular y escalable.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return this.element = build('div', template, true);
  }

  mounted() {
    console.log("Home montado y listo");
  }
}
