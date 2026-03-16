import type { ComponentContext, ComponentFactory } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";

const homePage: ComponentFactory = (ctx:  ComponentContext) => {
  console.log(ctx);
  return {
    render: () => {
      const template = `
        <div class="my-8 p-8 bg-background  rounded-3xl border border-slate-200 shadow-xl">
          <div data-component="app-theme-toggle"></div>
          <header class="mb-8">
            <h1 class="text-3xl font-bold text-slate-800" on-publish="USER_UPDATED:global:name | welcome">
              Bienvenido al Sistema
            </h1>
            <p class="text-slate-500 mt-2">Gestión de operaciones y monitorización de red.</p>
          </header>
          <div data-component="app-header"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">         
            <div data-component="app-counter"></div>
            <div data-component="app-user-list"></div>  
          </div>

          <div class="flex flex-wrap gap-4">
            <button 
              on-click="publish:NAVIGATE:global:dashboard"
              class="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
              Panel de Control
            </button>
            
            <button 
              on-click="publish:MODAL_OPEN:global:settings"
              class="px-6 py-3 bg-white text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
              Configuración
            </button>
          </div>
          <div data-component="app-dashboard"></div>
        </div>
      `;

      return buildAndInterpolate(template, this);
    },
    mounted: () => {
      // document.getElementById('5555')?.addEventListener('click', () => alert('Ok!'));
    }
  };
};

export default homePage;
