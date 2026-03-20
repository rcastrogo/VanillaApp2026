import type { ComponentContext } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

export class FooterComponent extends BaseComponent {
  
  constructor(ctx: ComponentContext) {
    super(ctx);
    super.setState({
      currentYear: new Date().getFullYear()
    });
  }

  render() {
    const template = `
      <footer class="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div class="max-w-7xl mx-auto px-6 py-12">
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div class="col-span-1 md:col-span-1">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-indigo-500 rounded-lg">
                  <i data-icon="zap" class="size-5 text-white"></i>
                </div>
                <span class="text-xl font-black tracking-tighter text-slate-800 dark:text-white">
                  Vanilla<span class="text-indigo-500">2026</span>
                </span>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Construyendo el futuro de la web con vanilla JS y mucha cafeína.
              </p>
              <div class="flex gap-4">
                 <a href="#" class="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors">
                    <i data-icon="activity" class="size-5"></i>
                 </a>
                 <a href="#" class="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors">
                    <i data-icon="settings" class="size-5"></i>
                 </a>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Plataforma</h4>
              <ul class="space-y-4">
                <li><a route-to="/dashboard" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Dashboard</a></li>
                <li><a route-to="/usuarios" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Usuarios</a></li>
                <li><a route-to="/home" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Home</a></li>
                <li><a route-to="/about" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">About</a></li>
              
                </ul>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Recursos</h4>
              <ul class="space-y-4">
                <li><a href="#" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Guía de Estilo</a></li>
              </ul>
            </div>

            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
               <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-2">¿Necesitas ayuda?</h4>
               <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Estamos aquí para ayudarte con tu arquitectura.</p>
               <button class="w-full py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Contacto
               </button>
            </div>
          </div>

          <div class="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">
              &copy; {state.currentYear} VanillaApp Engine. Reservados todos los derechos.
            </p>
            <div class="flex gap-8">
              <a href="#" class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">Privacidad</a>
              <a href="#" class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">Términos</a>
            </div>
          </div>

        </div>
      </footer>
    `;
    return buildAndInterpolate(template, this);
  }
}