
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
      const combo = BaseComponent.getInstance('[app-combo-box]') as { setDataSource(items: unknown[]): void } | undefined;
      combo?.setDataSource(this.codigos);
    },
    loadPremiumCodes() {
      const combo = BaseComponent.getInstance('[app-combo-box]') as { setDataSource(items: unknown[]): void } | undefined;
      combo?.setDataSource(this.codigosPremium);
    },
    handleTabChange(tab: TabEventDetail) {
      notificationService.show(`Tab activa: <b>${tab.title}</b> <small>(${tab.id}, #${tab.index + 1})</small>`, 2_000);
    },
    handleTabClose(tab: TabEventDetail) {
      notificationService.show(`Tab cerrada: <b>${tab.title}</b> <small>(${tab.id}, #${tab.index + 1})</small>`, 2_000);
    },
    cycleTabMode() {
      const tabRef = BaseComponent.getInstance('[app-tab]');
      tabRef?.cycleVariant();
      if(this.bindings) {
        this.bindings.forEach((binding: ComponentBinding) => {
            this.fecha = new Date().toLocaleTimeString();
            resolveBindingValue(binding, this);
        });
      }
    },
    addRandomTab() {
      const tab = BaseComponent.getInstance('[app-tab]');
      const id = `tab-${Math.random().toString(16).slice(2)}`;
      const close = () => {
        const tabRef = BaseComponent.getInstance('[app-tab]');
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
    menuItems: [
      { id: 'edit',    label: 'Editar',    icon: 'sun', action() { notificationService.show('Editar pulsado', 4_500); } },
      { id: 'dup',     label: 'Duplicar',  icon: 'timer', action() { notificationService.show('Duplicar pulsado', 4_500); } },
      { id: 'sep',     label: 'Config',    icon: 'settings', separator: true, action() { notificationService.show('Config pulsado', 1_500); } },
      { id: 'archive', label: 'Archivar',  icon: 'check',  disabled: true,  action() { /* disabled */ } },
      { id: 'delete',  label: 'Eliminar',  icon: 'trash',  separator: true, action() { notificationService.show('<b>Eliminar</b> pulsado', 1_500); } },
    ],
    onSelectCode(item: { id: string | number; label: string }) {
      notificationService.show(`Código seleccionado: <b>${item.label}</b> (id: ${item.id})`, 2_000);
    },
    customRender(data:{ id: string | number; label: string }) {
      if(data){
        console.log('Custom render invoked for item:', data);
        const {id, label} = data;
        const itemtemplate = `
          <div class="flex content-center gap-2">            
            <div class="flex-1">              
              {id} - {label | upper}
            </div>
            <i data-icon="database" class="size-5 inline-flex"></i>
          </div>
        `;
        return buildAndInterpolate(itemtemplate, {id, label}).outerHTML;        
      }
      return JSON.stringify(data);
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
            data-component="app-tab" 
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
              <div data-component="app-clock"></div>
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
              <div class="flex flex-wrap gap-2 mb-4">
                <div class="max-w-sm"
                     data-component="app-combo-box"
                     data-items="codigos"
                     data-placeholder="Elige un código…"
                     data-name="codigo"
                     (selected)="onSelectCode">
                </div>              
                <div class="max-w-sm"
                     data-component="app-combo-box"
                     data-items="codigos"
                     data-placeholder="Elige un código…"
                     data-name="codigo"
                     (selected)="onSelectCode"
                     (custom-render)="customRender">
                </div>              
              </div>

              <h2 class="text-2xl font-bold mb-2 mt-6">Menu Trigger</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Envuelve cualquier elemento HTML y lo convierte en disparador de un menú de acciones flotante.
              </p>
              <div class="flex flex-wrap gap-4">

                <div data-component="app-menu-trigger" data-items="menuItems">
                  <button data-menu-trigger class="app-button btn-primary">
                    <i data-icon="settings" class="inline-flex size-4 mr-1"></i>
                    Configuración
                  </button>
                </div>

                <div data-component="app-menu-trigger" data-items="menuItems">
                  <div>
                    <span class="text-slate-700 dark:text-slate-200 block truncate max-w-50">
                      Haz click en el icono de ajustes
                    </span>
                    <div data-menu-trigger
                        class="flex items-center gap-2 cursor-pointer rounded-full px-3 py-2 text-sm
                                bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                      <i data-icon="user" class="inline-flex size-4"></i>
                      <span>Usuario</span> <i data-icon="chevron-down" class="inline-flex size-3"></i>
                    </div>
                  </div>
                </div>

                <div data-component="app-popover-trigger" data-placement="bottom-end">
                  
                  <button data-popover-trigger class="app-button btn-secondary">
                    Ver Perfil
                  </button>

                  <div data-popover-content>
                    <div class="flex flex-col gap-3 w-64">
                      <div class="flex items-center gap-3">
                        <div class="size-10 bg-indigo-500 rounded-full"></div>
                        <div>
                          <p class="font-bold text-slate-900 dark:text-white">Admin User</p>
                          <p class="text-xs text-slate-500">admin@sistema.com</p>
                        </div>
                      </div>
                      <hr class="border-slate-200 dark:border-slate-700">
                      <p class="text-sm text-slate-600 dark:text-slate-400">
                        Este es un popover con contenido complejo y personalizado.
                      </p>
                      <button class="text-xs bg-slate-100 p-2 rounded hover:bg-slate-200 text-center">
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>

                </div>

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
