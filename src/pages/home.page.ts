
import type { ComponentBinding, ComponentFactory } from "../components/component.model";
import { buildAndInterpolate } from "../core/dom";

import type { TabEventDetail } from "@/components/tab.component";
import { resolveBindingValue } from "@/core/hydrate";
import { notificationService } from "@/core/services/notification.service";
import { BaseComponent} from "@/core/types";

const homePage: ComponentFactory = () => {
  return {
    fecha: new Date().toLocaleTimeString(),
    innerHTML: `
      Este es un ejemplo de cómo evitar xss <img src="x" onerror="alert('XSS')">
    `,
    codigos: [
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Bravo' },
      { id: 3, label: 'Charlie' },
      { id: 4, label: 'Delta' },
      { id: 5, label: 'Echo' },
      { id: 6, label: 'Foxtrot' },
      { id: 7, label: 'Golf' },
      { id: 8, label: 'Hotel' },
    ],
    codigosPremium: [
      { id: 'P1', label: 'Premium Uno' },
      { id: 'P2', label: 'Premium Dos' },
      { id: 'P3', label: 'Premium Tres' },
    ],
    loadDefaultCodes() {
      const combo = BaseComponent.getInstance('[app-combo-box-component]') as { setDataSource(items: unknown[]): void } | undefined;
      combo?.setDataSource(this.codigos);
    },
    loadPremiumCodes() {
      const combo = BaseComponent.getInstance('[app-combo-box-component]') as { setDataSource(items: unknown[]): void } | undefined;
      combo?.setDataSource(this.codigosPremium);
    },
    handleTabChange(tab: TabEventDetail) {
      notificationService.show(`Tab activa: <b>${tab.title}</b> <small>(${tab.id}, #${tab.index + 1})</small>`, 2_000);
    },
    handleTabClose(tab: TabEventDetail) {
      notificationService.show(`Tab cerrada: <b>${tab.title}</b> <small>(${tab.id}, #${tab.index + 1})</small>`, 2_000);
    },
    cycleTabMode() {
      const tabRef = BaseComponent.getInstance('[data-app-tab-component]');
      tabRef?.cycleVariant();
      if(this.bindings) {
        this.bindings.forEach((binding: ComponentBinding) => {
            this.fecha = new Date().toLocaleTimeString();
            resolveBindingValue(binding, this);
        });
      }
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
            (tabchange)="handleTabChange"
            (tabclose)="handleTabClose"
            class="mt-8">

            <div data-id="sin-icono" data-title="Texto">
              <h3 class="font-bold text-lg">Sin icono</h3>
              <p>
                Este tab no tiene icono, solo texto. <span data-bind="text:fecha">66666</span> Puedes usarlo para secciones donde el icono no es necesario o para mantener un diseño más limpio.
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
              <h2 class="text-2xl font-bold mb-2">Ejemplo reactivo</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Este tab muestra un ejemplo de componente con bindings reactivos. 
                El componente "app-binding-reference" tiene un contador que se actualiza y un botón que se habilita o deshabilita. 
                Además, muestra notificaciones al hacer clic en el botón.              
              </p>
              <div data-component="app-binding-reference"></div>
            </div>

            <div data-id="catalogo" data-title="Catálogo" data-icon-name="layers">
              <h2 class="text-2xl font-bold mb-2">Master detail con bindings</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Esta demo muestra una lista de entidades con panel de edición reactivo, combinando inputs, selectores, checks y acciones visuales.
              </p>
              <div data-component="app-entity-master-detail" class="mt-4"></div>
            </div>

            <div data-id="combo" data-title="Combo Box" data-icon-name="zap" class="h-100">
              <h2 class="text-2xl font-bold mb-2">Combo Box reactivo</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Componente select con data-items, setDataSource imperativo, teclado y valor oculto.
              </p>
              <div class="flex flex-wrap gap-2 mb-4">
                <button on-click="loadDefaultCodes" class="app-button btn-primary">Cargar códigos</button>
                <button on-click="loadPremiumCodes" class="app-button btn-secondary">Cargar premium</button>
              </div>
              <div class="max-w-xs">
                <div data-component="app-combo-box"
                     data-items="codigos"
                     data-placeholder="Elige un código…"
                     data-name="codigo"></div>
              </div>
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
