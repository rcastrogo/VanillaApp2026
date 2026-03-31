
import type { ComponentContext } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent } from "@/core/types";

export default class BaseComponentPage extends BaseComponent {
  
  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  render() {
    const template = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div class="max-w-4xl mx-auto">

          <h1 class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6 text-center">
            BaseComponent: Núcleo del Sistema
          </h1>

          <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center">
            Una base sólida para construir componentes reactivos, desacoplados y altamente eficientes en VanillaJS.
          </p>

          <div class="space-y-6">

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Renderizado Inteligente
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                El sistema actualiza únicamente el contenido necesario mediante un mecanismo de re-render controlado, preservando nodos críticos como <code>#router-outlet</code> y evitando recreaciones innecesarias del DOM.
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Estado Reactivo con Proxy
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                El estado interno utiliza <code>Proxy</code> para detectar cambios automáticamente. Cualquier mutación dispara un ciclo de actualización, manteniendo la UI sincronizada sin necesidad de frameworks externos.
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Sistema PubSub Integrado
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                Permite comunicación desacoplada entre componentes mediante publicación y suscripción de eventos, facilitando arquitecturas escalables y modulares.
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Gestión Automática del Ciclo de Vida
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                Incluye hooks como <code>init</code>, <code>mounted</code> y <code>destroy</code>, junto con un sistema de limpieza automática para evitar fugas de memoria en suscripciones y efectos.
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Binding Automático de Métodos
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                Todos los métodos del componente se enlazan automáticamente al contexto, eliminando problemas clásicos de <code>this</code> sin necesidad de configuraciones adicionales.
              </p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-3">
                Props y Children Nativos
              </h2>
              <p class="text-gray-600 dark:text-gray-300">
                Los componentes reciben propiedades desde atributos <code>data-*</code> y pueden acceder directamente a sus nodos hijos, permitiendo una composición flexible y natural del DOM.
              </p>
            </div>

          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  mounted() {
    console.log("BaseComponentPage montada en el DOM");
  }
}
