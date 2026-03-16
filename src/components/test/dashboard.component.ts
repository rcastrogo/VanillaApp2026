import { buildAndInterpolate } from "../../core/dom";
import { pubSub } from "../../core/services/pubsub.service";
import { BaseComponent} from "../../core/types";
import type { ComponentContext, PublishContext } from "../component.model";

export class DashboardComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
    Object.assign(this.state, {
      showCounters: true,
      lastGlobalUpdate: 'Esperando actividad...'
    });
  }

  init() {
    
    // =================================================================================
    // Global
    // =================================================================================
    pubSub.subscribe('COUNT_UPDATED', (data: ({id:string, val:string}) | undefined) => { 
      const message = `Contador ${data?.id} subió a ${data?.val}`;
      console.log('GLOBAL_COUNT_UPDATED', data, message);
    });

    // =================================================================================
    // Local
    // =================================================================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.subscribe('COUNT_UPDATED', (data: any) => {
      console.log('LOCAL_COUNT_UPDATED', data);  
    });

  }

  toggleCounters() {
    this.state.showCounters = !this.state.showCounters;
  }

  ternary(val: string, yes: string, no: string) { return val ? yes : no; }
  display(val: string) { return val ? 'block' : 'none'; }
  upperCase(val: string) { return val?.toUpperCase() || ''; }
  addPercent(el: HTMLElement, ctx: PublishContext) { 
    const sender = ctx.target as HTMLProgressElement;
    if(sender) el.style.width = sender.value + '%'; 
  }

  render() {
    const template = `
      <div class="my-8 p-8 bg-slate-50 rounded-3xl border border-slate-200 shadow-xl">
        
        <header class="flex justify-between items-center mb-10">
          <h2 class="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>

          <button on-click="toggleCounters" 
            class="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all
            {state.showCounters | ternary : bg-rose-100 text-rose-600 : bg-indigo-100 text-indigo-600}">
            
            <i data-icon="{state.showCounters | ternary : power : zap}" class="size-5"></i>
            
            <span>{state.showCounters | ternary : Destruir : Inicializar}</span>
          </button>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6" 
             style="display: {state.showCounters | display}">       
          <div data-component="app-counter" class="bg-white p-4 rounded-xl shadow-sm border border-slate-100"></div>
          <div data-component="app-counter" class="bg-white p-4 rounded-xl shadow-sm border border-slate-100"></div>
          <button 
            on-click="publish:THEME_CHANGED:global:dark"
            class="flex w-full items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all bg-indigo-100 text-indigo-600">
            Message THEME_CHANGED
          </button>
          <div class="text-slate-400">
            Theme: <span on-publish="THEME_CHANGED:global:html"></spand>
          </div>
          <button 
            on-click="publish:COUNT_UPDATED:local:1:2:3:4"
            class="flex w-full items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all bg-indigo-100 text-indigo-600">
            Message COUNT_UPDATED
          </button>
        </div>

        <div class="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200"
             style="display: {state.showCounters | ternary : none : block}">
           <p class="text-slate-400 font-bold">Sistema en reposo</p>
        </div>

        <footer
          class="mt-8  text-slate-400 font-bold uppercase tracking-widest">
          Actividad: {state.lastGlobalUpdate}
        </footer>

        <footer class="mt-12 p-8 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl">
          <h3 class="text-slate-500  font-black uppercase tracking-[0.3em] mb-8 text-center">
            Laboratorio de Reactividad on-publish
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">1. innerHTML / Direct Data</p>
              <button on-click="publish:TEST_HTML:global:<strong>Hola!</strong>" 
                class="mb-3 w-full bg-slate-700 hover:bg-slate-600 text-white  py-2 rounded-lg transition-all">
                Enviar HTML Fuerte
              </button>
              <div on-publish="TEST_HTML:global:html" class="p-3 bg-slate-900 rounded-lg text-slate-300 text-sm min-h-10">
                Esperando...
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">2. Dynamic ClassName</p>
              <div class="flex gap-2 mb-3">
                <button on-click="publish:TEST_CLASS:global:text-emerald-400 font-black" class="flex-1 bg-emerald-900/30 text-emerald-400  p-1 rounded border border-emerald-500/30">Verde</button>
                <button on-click="publish:TEST_CLASS:global:text-rose-400 italic" class="flex-1 bg-rose-900/30 text-rose-400  p-1 rounded border border-rose-500/30">Rojo Italic</button>
              </div>
              <div on-publish="TEST_CLASS:global:classname" class="text-center p-2 text-slate-500 transition-all">
                Texto Camaleón
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">3. ToggleClass (Switch)</p>
              <button on-click="publish:TEST_TOGGLE:global:true" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg mb-3">
                Alternar Estado (Blink)
              </button>
              <div class="flex justify-center">
                <div on-publish="TEST_TOGGLE:global:toggleclass:bg-red-500" 
                    class="size-8 rounded-full bg-red-500 transition-all"></div>
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">4. JSON Pretty Print</p>
              <button on-click="publish:TEST_JSON:global:state" class="w-full bg-slate-700 text-white py-2 rounded-lg mb-3">
                Dumping State
              </button>
              <pre on-publish="TEST_JSON:global:json" class="bg-black p-2 rounded-lg text-emerald-500 overflow-auto max-h-24">
        {}
              </pre>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">5. Smart Attributes (attr.id)</p>
              <button on-click="publish:TEST_ATTR:global:dynamic-id-123" class="w-full bg-slate-700 text-white py-2 rounded-lg mb-3">
                Set ID de elemento
              </button>
              <div on-publish="TEST_ATTR:global:attr.id" class="p-2 bg-slate-900 rounded border border-dashed border-slate-700  text-slate-500 text-center">
                Inspeccioname: tengo ID dinámico
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">6. Pipes & Filters</p>
              <button on-click="publish:TEST_PIPE:global:state.lastGlobalUpdate" class="w-full bg-slate-700 text-white py-2 rounded-lg mb-3">
                Procesar Texto
              </button>
              <div on-publish="TEST_PIPE:global" class="text-center font-mono text-amber-400 tracking-tighter">
                esperando pipe...
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700 lg:col-span-2">
              <p class="text-indigo-400  font-bold uppercase mb-3">7. Style Direct Manipulation (Width)</p>
              <input type="range" min="0" max="100" value="30" 
                    on-input="publish:TEST_STYLE:global" 
                    class="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-4">
              <div class="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                <div on-publish="TEST_STYLE:global:addPercent" class="h-full bg-indigo-500 transition-all duration-300" style="width: 30%"></div>
              </div>
            </div>

            <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
              <p class="text-indigo-400  font-bold uppercase mb-3">8. Custom Method Call</p>
              <button on-click="publish:TEST_FUNC:global:Explosión!" class="w-full bg-rose-600 text-white py-2 rounded-lg">
                Llamar a miMetodoPersonalizado
              </button>
              <div on-publish="TEST_FUNC:global:miMetodoPersonalizado:arg_extra_123" class="mt-2  text-slate-500 text-center">
                Reacciona vía JS
              </div>
            </div>

          </div>

          <div class="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span class="text-slate-500 font-bold tracking-widest uppercase">PubSub Bus Online</span>
            </div>
            <span class="text-slate-600 font-medium italic">Framework v2.5 - Debug Mode</span>
          </div>
        </footer>

      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  miMetodoPersonalizado(el: HTMLElement, payload: PublishContext, extra: string) {
    const msg = payload.args ? payload.args[0] : payload;
    el.innerText = `Recibido: ${msg} con extra: ${extra}`;
    el.classList.add('text-white', 'font-bold');
  }
}