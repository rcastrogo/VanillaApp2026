import type { ComponentContext } from "./component.model";
import { buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

import { APP_CONFIG } from "@/app.config";

export class FooterComponent extends BaseComponent {
  
  constructor(ctx: ComponentContext) {
    super(ctx);
  }
  appIcons = Object.entries(APP_CONFIG.icons).map(([key]) => {
    return { 
      html : `<i data-icon="${key}" class="size-5"></i>`, 
      name: key 
    };
  });

  render() {
    const template = `
      <footer class="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div class="mx-auto px-6 py-6">        
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            <div class="col-span-1 md:col-span-1">
              <div data-component="app-logo" class="text-2xl justify-start">
                Construyendo el futuro de la web con vanilla JS y mucha cafeína.
              </div>
              <div data-each="icon in appIcons" class="flex flex-wrap gap-1 mt-4">
                <button route-to="/" title="{icon.name}" class="app-button p-2 rounded-full">
                  {icon.html}
                </button>                
              </div>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Plataforma</h4>
              <ul class="space-y-2">
                <li><a href="dashboard" route-to="dashboard" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="usuario" route-to="usuarios" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Usuarios</a></li>
                <li><a href="home" route-to="home" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Home</a></li>
                <li><a href="about" route-to="about" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="docs.html" target="_blank" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Documentación</a></li>
                </ul>
            </div>

            <div>
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Recursos</h4>
              <ul class="space-y-2">
                <li><a href="docs.html" target="_blank" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Documentación</a></li>
                <li><a href="docs.html" target="_blank" class="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-white transition-colors">Guía de Estilo</a></li>
              </ul>
            </div>

            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
               <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-2">¿Necesitas ayuda?</h4>
               <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Estamos aquí para ayudarte con tu arquitectura.</p>
               <button 
                on-click="publish:app-message:global:Solicitud de contacto"
                class="app-button w-full">
                  Contacto
               </button>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
              &copy; VanillaApp2026. Reservados todos los derechos.
            </p>
            <div class="flex gap-2">
              <buton class="app-button text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">Privacidad</buton>
              <buton class="app-button text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors">Términos</buton>
            </div>
          </div>
        </div>

      </footer>
    `;
    return buildAndInterpolate(template, this);
  }
}