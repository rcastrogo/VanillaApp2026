import type { ComponentContext, ComponentFactory } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { pubSub } from "@/core/services/pubsub.service";
import { useState } from "@/core/state.utils";

export const KeepAlivePage: ComponentFactory = (_ctx: ComponentContext) => {

  const {store, put, on, effect} = useState({
    inputValue: '',
    isDirty: false
  });

  function handleInput(el: HTMLInputElement) {
    // console.log('Input changed:', el.value);
    put('inputValue', el.value);
    if(el.value.trim() !== '') {
      put('isDirty', true);
    } else {
      put('isDirty', false);
    }
  }

  on('inputValue', (value: string) => {
    console.log('on("inputValue")', value);
    pubSub.publish('INFO_MESSAGE_UPDATED', `Current input value: ${value}`);
  });

  effect(() => {
    console.log('1 Effect without dependencies triggered');
  });

  effect(
    () => {
      console.log('Effect triggered for [inputValue, isDirty]');
    }, 
    ['inputValue', 'isDirty']
);

  effect(() => {
    console.log('Effect triggered for isDirty');
  }, ['isDirty']);

  return {
    element: null,
    render: function() {
      const template = `
        <div class="min-h-1/2 flex items-center justify-center">
          <div class="max-w-xl w-full text-center">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Keep Alive Demo
            </h1>     
            <input 
              type="text" 
              class="app-input mb-4" 
              placeholder="Type something here..." 
              on-input="handleInput" />
            <div class="mb-4">
              <div class="font-semibold border p-2 text-center" on-state="toggle.hidden:isDirty">Sin cambios</div>
              <div class="font-semibold border p-2 text-center hidden" on-state="toggle.hidden:isDirty|not;text:inputValue"></div>
            </div>     
            <div class="mb-4">
              <div class="font-semibold border p-2 text-center" on-publish="INFO_MESSAGE_UPDATED:local:html"></div>
            </div>     
            
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              This page demonstrates the keep-alive feature. Type something in the input field, navigate away, and then come back to see that your input is preserved.
            </p>
          </div>
        </div>
      `;
      const ctx = { 
        handleInput, 
        on, 
        store
      };
      return this.element = buildAndInterpolate(template, ctx);
    }
  }

}