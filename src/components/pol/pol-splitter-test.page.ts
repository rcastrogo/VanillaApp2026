import { createSplitter, type SplitterOptions } from './pol-splitter.component';

import type { ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';

const splitterTestPage: ComponentFactory = () => {

  return {
    render() {
      const template = `
      <div>
        <div class="flex flex-col gap-6 p-4 h-[calc(100vh-16rem)]">

          <div class="shrink-0">
            <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Splitter Component</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Arrastra la barra para redimensionar. Doble clic para cambiar entre horizontal y vertical.
            </p>
          </div>

          <div class="flex-1 min-h-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div data-component="app-pol-splitter" data-key="main-splitter" class="h-full">

              <div data-slot-left class="h-full p-4 bg-slate-50 dark:bg-slate-800/50">
                <h2 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">Panel Izquierdo</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Este es el panel izquierdo (o superior en modo vertical). 
                  Puedes arrastrar la barra divisoria para ajustar el tamaño.
                </p>
                <ul class="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Arrastrar la barra para redimensionar</li>
                  <li>• Doble clic en la barra para cambiar de modo</li>
                  <li>• Horizontal ↔ Vertical</li>
                </ul>
              </div>

              <div data-slot-right class="h-full w-full bg-white dark:bg-slate-900">

                <div 
                  data-component="app-pol-splitter"
                  data-key="inner-splitter"
                  data-mode="vertical"
                  class="h-full w-full"
                >

                  <div data-slot-right class="p-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      Este es el panel derecho (o inferior en modo vertical). 
                      Puedes anidar splitters para crear diseños más complejos.
                      Ademas, el splitter anidado en este panel es vertical por defecto, pero puedes cambiarlo a horizontal haciendo doble clic en su barra.
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel sapien eget nunc faucibus commodo. 
                      Curabitur ac ligula quis metus efficitur tincidunt. Sed at felis eget nunc efficitur varius.
                    </p>
                  </div>

                  <div data-slot-left class="p-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      Este es el panel izquierdo del splitter anidado.
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel sapien eget nunc faucibus commodo. 
                      Curabitur ac ligula quis metus efficitur tincidunt. Sed at felis eget nunc efficitur varius.
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

        <div class="w-full flex flex-col gap-6 p-4">
          <button 
            class="app-button"
            on-click="addRandomSplitter"
            >Añadir Splitter aleatorio</button>
          <div data-container class="w-full flex flex-col gap-4">
          </div>
        </div>

      </div>
      `;
      return buildAndInterpolate(template, { addRandomSplitter });
    }
  };

  function addRandomSplitter(el: HTMLElement) {
    const container = el.nextElementSibling;
    if (container) {
      const splitter = createSplitter(randomSplitterOptions());
      container.appendChild(splitter);
    }    
  }

};

export default splitterTestPage;


const HEIGHTS = ['h-30', 'h-64', 'h-72', 'h-80'];
const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
  'Duis aute irure dolor in reprehenderit in voluptate velit.',
  'Excepteur sint occaecat cupidatat non proident.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;

function randomSplitterOptions(): SplitterOptions {
  counter++;
  const mode = Math.random() > 0.5 ? 'vertical' : 'horizontal';
  return {
    key: `imperative-${counter}`,
    mode,
    height: pick(HEIGHTS),
    className: '',
    leftHtml: `<div class="h-full rounded p-3"><strong>#${counter}L</strong> · ${mode}<br>${pick(LOREM)}</div>`,
    rightHtml: `<div class="h-full rounded p-3"><strong>#${counter}R</strong><br>${pick(LOREM)}</div>`,
  };
}
