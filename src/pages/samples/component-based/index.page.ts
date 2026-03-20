
import type { Component, ComponentContext } from "../../../components/component.model";

export default class IndexPage implements Component {
  
  private element!: HTMLElement;

  constructor(_ctx: ComponentContext) {
    this.element = document.createElement('div');
  }

  render() {
    this.element.innerHTML = `
      <div class="min-h-screen bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-4xl font-bold text-green-600 mb-6 text-center">Componentes que Implementan Component</h1>
          <p class="text-lg text-gray-700 mb-8 text-center">Explora las funcionalidades básicas de los componentes que implementan la interfaz Component</p>

          <div class="space-y-6">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">Método Render</h2>
              <p class="text-gray-600">Define cómo se renderiza el componente, devolviendo el elemento DOM principal. Permite control total sobre la estructura y contenido.</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">Método Mounted</h2>
              <p class="text-gray-600">Se ejecuta después de que el componente se inserta en el DOM, ideal para inicializaciones, event listeners o efectos secundarios.</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-gray-800 mb-3">Acceso al Contexto</h2>
              <p class="text-gray-600">Recibe un ComponentContext en el constructor, proporcionando acceso a router, pubsub, datos compartidos y otros servicios.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return this.element;
  }

  mounted() { /* empty */ }

}
