
import type { TabComponent, TabVariant } from '@/components/tab.component';
import { $, buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export default class PipeTesterPage extends BaseComponent {

  tabComponent: TabComponent | null = null;

  setVariant(_el: HTMLElement, _e: Event, variant: TabVariant) {
    this.tabComponent?.setVariant?.(variant);
  }

  clickInside = (e: Event): boolean => {
    const target = e.target as HTMLElement;
    return target.tagName === 'BUTTON' || target.closest('button') !== null;
  }

  async clonePipesDocumentation(container: HTMLElement): Promise<void> {
    if(!this.element) return;
    const comp = await BaseComponent.waitForInstance('[app-pipe-tester]', this.element!);
    const original = $<HTMLElement>('[data-pipes-documentation]', comp.element).one();
    if (!original) return;
    const clone = original.cloneNode(true) as HTMLElement;
    clone.removeAttribute('data-pipes-documentation');
    container.innerHTML = '';
    container.appendChild(clone);
  }

  render(): HTMLElement {
    const template = `
      <div class="min-h-screen p-4">
        <div class="max-w-5xl mx-auto">

          <div class="mb-1 border-b pb-1">
            <div data-component="app-logo" class="mb-2 border-b pb-2"></div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
              🧪 Pipes <span class="text-indigo-500">Tester</span>
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Herramientas de desarrollo para explorar el sistema de pipes de VanillaApp2026
            </p>
          </div>

          <div
            data-component="app-tab"
            data-selected="pipe-tester"
            data-variant="boxed"
            class="w-full"
          >
            <div data-id="pipe-tester" data-title="Probador de Pipes" data-icon-name="zap">          
              <div class="border-0 rounded-md overflow-hidden"> 
                <div class="flex flex-col gap-3 overflow-auto p-2">
                  <div class="flex justify-end items-end gap-1 my-1"> 

                    <div 
                      data-component="app-popover-trigger"
                      class="mb-1">
                      <button data-popover-trigger class="app-button btn-secondary">
                        <i data-icon="info" class="size-4 mr-1"></i>
                      </button>
                      <div data-popover-content class="max-w-xs p-3">
                        <p class="text-sm text-slate-700 dark:text-slate-300">
                          En el panel de la izquierda puedes ingresar un objeto JSON que servirá como contexto para evaluar la expresión de pipes. En el panel derecho, escribe una expresión utilizando la sintaxis de pipes de VanillaApp2026, por ejemplo: <code>name | upper | t</code>. El resultado se mostrará en tiempo real debajo del campo de expresión.
                        </p>
                      </div>
                    </div>

                    <div 
                      data-component="app-popover-trigger" 
                      (click-inside)="clickInside"
                      class="mb-1">
                      <button data-popover-trigger class="app-button btn-secondary">
                        <i data-icon="settings" class="size-4 mr-1"></i>
                      </button>
                      <div data-popover-content class="max-w-xs">
                        <p class="text-sm text-slate-700 dark:text-slate-300 mb-2">
                          Cambia el estilo visual de las pestañas del probador de pipes:
                        </p>                  
                        <button on-click="setVariant:segmented" class="app-button btn-sm btn-primary mb-2">Segmented</button>
                        <button on-click="setVariant:boxed" class="app-button btn-sm btn-primary mb-2">Boxed</button>
                        <button on-click="setVariant:underline" class="app-button btn-sm btn-primary mb-2">Underline</button>
                        <button on-click="setVariant:pills" class="app-button btn-sm btn-primary mb-2">Pills</button>
                        <button on-click="setVariant:soft" class="app-button btn-sm btn-primary mb-2">Soft</button>
                        <div data-component="app-theme-toggle" class="mb-2 border-t pt-2" ></div>                     
                      </div>
                    </div>
                  </div> 
                  <div data-component="app-pipe-tester"></div>
                </div>
              </div>
            </div>
            <div data-id="documentation" data-title="Documentación" data-icon-name="book">
              <div class="p-3">
                <h2 class="text-lg font-bold mb-2">Pipes disponibles</h2>   
                <div class="flex flex-col gap-2" data-bind="fn:clonePipesDocumentation">
                </div>
              </div>
          </div>

        </div>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }

   async mounted(): Promise<void> {
    this.tabComponent = await BaseComponent.waitForInstance('[app-tab]', this.element!);
    this.tabComponent?.setVariant('segmented');

    setTimeout(() => {
      this.updateBindings();    
    }, 100);

  }
}
