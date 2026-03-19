
import type { Component, ComponentContext } from "../../../components/component.model";
import { buildAndInterpolate } from "../../../core/dom";

export default class TermsPage implements Component {

  private ctx!: ComponentContext;

  constructor(ctx: ComponentContext) {
    this.ctx = ctx;
  }

  render() {
    const template = `
      <div class="max-w-2xl mx-auto my-8 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">        
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
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this.ctx);
  }

  mounted() {
    console.log("TermsPage montado con usuarios cargados");
  }
}