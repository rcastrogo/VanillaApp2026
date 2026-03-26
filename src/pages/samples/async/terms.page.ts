

import { APP_CONFIG } from "../../../app.config";
import type { Component, ComponentContext } from "../../../components/component.model";
import { $, build, buildAndInterpolate } from "../../../core/dom";
import { buildAndInterpolateDSL } from "../../../core/template-compiler";
import { BaseComponent } from "../../../core/types";

export default class TermsPage implements Component {

  private ctx!: ComponentContext;

  constructor(ctx: ComponentContext) {
    this.ctx = ctx;
  }

  render() {
    const template = `

      <div class="mx-auto my-8 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div class="bg-linear-to-r from-slate-800 to-slate-900 p-6">
          <h1 class="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <i data-icon="users" class="size-6 text-indigo-400"></i>
            Lista de Usuarios
          </h1>
          <p class="text-slate-400 mt-1 uppercase tracking-widest font-medium">
            Directorio interno v2026
          </p>
        </div>

        <div class="p-2">
          <ul data-each="user in users" class="divide-y divide-slate-50">
            <li class="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
              <div class="flex items-center gap-4">
                <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                  A
                </div>
                
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {user.name}
                  </span>
                  <span class="text-slate-400 font-mono">
                    {user.email}
                  </span>
                </div>
              </div>

              <span class="text-[10px] font-black px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                ONLINE
              </span>
            </li>
          </ul>
          @if(users.length===3)
            <div class="py-12 text-center">
              <p class="text-slate-400 text-sm italic">No hay registros cargados</p>
            </div>
          @endif

          <div data-component="app-dsl-sample"></div>

          <div data-component="app-the-simpsons"></div>

          <div data-component="app-map">
          </div>
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this.ctx);
  }

  mounted() {
    console.log("TermsPage montado con usuarios cargados");
  }
}

class MapComponent extends BaseComponent {

  init(): void { /* empty */ }

  render(): HTMLElement {
    const template = `
      <div class="p-4 rounded-lg shadow-md 
        border
        transition-colors duration-300
        border-slate-200 bg-white 
        dark:border-slate-700 dark:bg-slate-800 
        dark:shadow-lg">
        <div class="h-80" id="map-container"></div>
      </div>
    `;
    return build('div', template)
  }

  async mounted() {
    const maptiler = await import('@maptiler/sdk');
    maptiler.config.apiKey = 'WTPEuorKYkIIZEuHL6x8';
    const container = $('#map-container', this.element).one();

    if (container) {
      const map = new maptiler.Map({
        container: container, 
        style: maptiler.MapStyle.TOPO,
        center: [-3.70379, 40.41678],
        zoom: 14
      });
      console.log('Mapa inicializado correctamente' + map.getPrimaryLanguage());
    }   
    
    return; 
  }

}

// Registrar el componente
Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-map', MapComponent);
});

export class SampleDSL extends BaseComponent {

  init() {
    this.addCleanup(APP_CONFIG.i18n.changed(() => this.invalidate()) );
    this.setState({
      title: "Panel de Control Alpha",
      projects: [
        {
          id: 1,
          name: "Rediseño Web",
          active: true,
          tasks: [
            { 
              desc: "Header", 
              done: true,
              tags: ["Urgent", "UI"] 
            },
            { 
              desc: "Filtros DSL", 
              done: false,
              tags: ["Core", "R&D"] 
            }
          ]
        },
        {
          id: 2,
          name: "App Móvil",
          active: false,
          tasks: [
            { 
              desc: "Login", 
              done: false,
              tags: ["Security"] 
            }
          ]
        }
      ]
    });
  }

  render(): HTMLElement {
    const template = `
      <div class="p-8 bg-slate-900 text-slate-100 min-h-screen font-sans">
        <h1 class="text-3xl font-bold text-sky-400 mb-8 border-b border-slate-700 pb-4">
          { state.title | upper}
        </h1>

        <div class="space-y-6">
          @each(project in state.projects)
            <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
              <div class="flex items-center gap-3 mb-4">
                <h2 class="text-xl font-semibold text-white">{ project.name }</h2>
                @if(project.active)
                  <span class="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full uppercase tracking-wider">
                    Activo
                  </span>
                @else
                  {t:ui.actions.increment}
                @endif
                @if(project.id === 1)
                  - proyect.id = 1
                @endif
              </div>

              <div class="grid gap-3 ml-4 border-l-2 border-slate-700 pl-6">
                @each(task in project.tasks)
                  <div class="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-lg">
                    <div class="flex items-center gap-2">
                      <input type="checkbox" @if(task.done) checked @endif class="accent-sky-500">
                      <span class="@if(task.done) line-through text-slate-500 @endif">
                        { task.desc }
                      </span>
                    </div>
                    <div class="flex gap-2 ml-6">
                      @each(tag in task.tags)
                        <span class="text-[9px] px-2 py-0.5 bg-sky-900/40 text-sky-300 border border-sky-500/30 rounded">
                          # { tag | upper }
                        </span>
                      @endeach
                    </div>
                  </div>
                @endeach
              </div>
            </section>
          @endeach
        </div>
      </div>
    `;
    
    return buildAndInterpolateDSL(template, this);
  }
}

// Registrar el componente
Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-dsl-sample', SampleDSL);
});