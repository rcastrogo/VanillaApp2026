import { ComponentRegistry } from "@/app.components";
import type { ComponentContext, ComponentFactory, ComponentInitValue } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { pubSub } from "@/core/services/pubsub.service";
import { useState } from "@/core/state.utils";
import { BaseComponent } from "@/core/types";

class PocComponent extends BaseComponent {

  age = 0;
  email = '';

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
  }

  public setProp(name: string, value: string | number) {
    if(name === 'age') this.age = value as number;
    if(name === 'email') this.email = String(value);
    this.invalidate();
  }

  render() {
    const template = `
      <div class="flex items-center gap-2 text-2xl justify-center">
        <div>
          {email} - {age}
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

ComponentRegistry.registerComponent('poc-component', PocComponent);


export const KeepAlivePage: ComponentFactory = (_ctx: ComponentContext) => {

  const {store, put, on, effect} = useState({
    inputValue: '',
    isDirty: false,
    length: 0,
  });

  function handleInput(el: HTMLInputElement) {
    // console.log('Input changed:', el.value);
    put('inputValue', el.value);
    if(el.value.trim() !== '') {
      put('isDirty', true);
      put('length', el.value.length);
    } else {
      put('isDirty', false);
      put('length', 0);
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
        <div 
          on-state="prop.id:inputValue"
          class="min-h-1/2 flex items-center justify-center"
          >
          <div class="max-w-xl w-full text-center">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Keep Alive Demo
            </h1>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              This page demonstrates the keep-alive feature. Type something in the input field, navigate away, and then come back to see that your input is preserved.
            </p> 
            
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              The "on-state" directive
            </h1>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              You can type something in the input field below, and it will update the state and trigger effects accordingly.
              This is a example of how to use the "on-state" directive to bind state values to DOM elements. The input field is bound to the "inputValue" state, and the range input and text input are bound to the "length" state.
            </p>

            <input 
              type="text" 
              class="app-input mb-4" 
              placeholder="Type something here..." 
              on-input="handleInput" />
            <div class="mb-4">
              <div class="font-semibold border p-2 text-center" on-state="toggle.hidden:isDirty">Sin cambios</div>
              <div class="font-semibold border p-2 text-center hidden" on-state="toggle.hidden:isDirty|not;text:inputValue"></div>
              <input type="range" class="w-full" min="0" max="100" on-state="value:length" />
              <input type="text" class="w-full p-2 text-center" on-state="value:length" />
              <div 
                data-component="poc-component" 
                data-lines="1" 
                on-state="
                  prop.age:length;
                  prop.email:inputValue | upper">
              </div>
            </div>  
               
            <div class="mb-4">
              <div class="font-semibold border p-2 text-center" on-publish="INFO_MESSAGE_UPDATED:local:html"></div>
            </div>     
            
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