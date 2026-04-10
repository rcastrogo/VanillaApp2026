
import type { ComponentFactory } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";

import { notificationService } from "@/core/services/notification.service";
import { BaseComponent} from "@/core/types";

const homePage: ComponentFactory = () => {
  return {
    innerHTML: `
      Este es un ejemplo de cómo evitar xss <img src="x" onerror="alert('XSS')">
    `,
    cycleTabMode() {
      const tabRef = BaseComponent.getInstance('[data-app-tab-component]');
      tabRef?.cycleVariant();
    },
    addRandomTab() {
      const tab = BaseComponent.getInstance('[data-app-tab-component]');
      const id = `tab-${Math.random().toString(16).slice(2)}`;
      const close = () => {
        const tabRef = BaseComponent.getInstance('[data-app-tab-component]');
        tabRef?.removeTab(id);
      }
      const template = `
        Contenido del ${id} 
        <button class="app-button" on-click="close"><i data-icon="x" class="inline-flex size-4"></i></button>
      `;
      const element = buildAndInterpolate(template, { close }, false, { className: 'p-8' });
      const newTab = { 
        id, 
        title: `Tab ${id.slice(-4)}`, 
        icon: ['power', 'zap', 'rocket', 'timer', 'sun'][Math.floor(Math.random() * 5)]
      }
      tab?.addTab(newTab, element, true);
    },
    render: function () {
      notificationService.show('¡Bienvenido a <b>VanillaApp2026!</b>', 2_000);
      const template = `
        <div class="min-h-[50vh] mb-12 text-center">
          <span class="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">
            VanillaApp<span class="text-indigo-500">2026</span>
          </span>
          <div>
            <h1 class="text-3xl font-black tracking-tight">DOM + Hydrate + Template Engine</h1>
            <p class="text-slate-600 dark:text-slate-400">Sistema de renderizado de VanillaApp2026</p>
             <p class="text-slate-600 dark:text-slate-400">
              {innerHTML | safeHTML}
             </p>
          </div>

          <div 
            data-component="app-tab-component" 
            data-selected="overview" 
            data-variant="segmented" 
            class="mt-8">

            <div data-id="sin-icono" data-title="Texto">
              <h3 class="font-bold text-lg">Sin icono</h3>
              <p>
                Este tab no tiene icono, solo texto. Puedes usarlo para secciones donde el icono no es necesario o para mantener un diseño más limpio.
              </p>
            </div>
            <div data-id="perfil" data-title="Mi Perfil" data-icon-name="user">
              <h3 class="font-bold text-lg">Información Personal</h3>
              <p>Aquí va un formulario o texto para el perfil del usuario.</p>
              <button on-click="cycleTabMode" class="app-button btn-primary mt-2">Cambiar</button>
              <button on-click="addRandomTab" class="app-button btn-primary mt-2">Add</button>
            </div>

            <div data-id="seguridad" data-title="Seguridad" data-icon-name="rocket">
              <div data-component="app-collapsible-clock"></div>
              <p class="mt-4">Cambia tu contraseña aquí.</p>
            </div>

            <div data-id="suscripcion" data-title="Plan Anual" data-icon-name="sun">
              <p>Estás en el plan Pro.</p>
            </div>

            <div data-id="overview" data-title="Overview" data-icon-name="settings">
              <h2 class="text-2xl font-bold mb-2">Overview</h2>
              <p class="text-gray-700 dark:text-gray-300">
                Esta es la pestaña de overview. Aquí puedes poner un resumen o información general.
              </p>
            </div>

            <div data-id="counter" data-title="Counter" data-icon-name="timer">
              <h2 class="text-2xl font-bold mb-2">Counter</h2>
              <p class="text-gray-700 dark:text-gray-300">
                Esta es la pestaña del contador. Aquí puedes mostrar un contador o cualquier otro componente interactivo.
              </p>
              <div data-component="app-counter"></div>
            </div>

            <div data-id="solo-icono" data-alt="Solo el icono" data-icon-name="zap">
              <h3 class="font-bold text-lg">Sin icono</h3>
              <p>
                Este tab no tiene icono, solo texto. Puedes usarlo para secciones donde el icono no es necesario o para mantener un diseño más limpio.
              </p>
            </div>

          </div>
        </div>
      `;
      return buildAndInterpolate(template, this);
    }
  };
};

export default homePage;
