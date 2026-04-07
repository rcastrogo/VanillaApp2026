import type { ComponentContext, ComponentFactory } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";

export const KeepAlivePage: ComponentFactory = (_ctx: ComponentContext) => {


  function handleInput(el: HTMLInputElement) {
    console.log('Input changed:', el.value);
  }

  return {
    element: null,
    render: function() {
      const template = `
        <div class="min-h-1/2 flex items-center justify-center">
          <div class="max-w-xl w-full text-center">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Keep Alive Demo
            </h1>     
            <input type="text" class="app-input mb-4" placeholder="Type something here..." on-input="handleInput" />
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              This page demonstrates the keep-alive feature. Type something in the input field, navigate away, and then come back to see that your input is preserved.
            </p>
          </div>
        </div>
      `;
      return this.element = buildAndInterpolate(template, { handleInput });
    }
  }

}