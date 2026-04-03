

import { APP_CONFIG } from "@/app.config";
import { literals, type AlertComponent, type AlertSize } from "@/components/alert/alert.component";
import type { Component } from "@/components/component.model";
import { buildAndInterpolate } from "@/core/dom";
import { dialogService } from "@/core/services/dialog.service";

export default class IndexPage implements Component {

  components = Object.keys(import.meta.glob('@/components/**/*.ts', { eager: true }));
  registeredComponents = Object.keys(APP_CONFIG.components)
    .filter(tag => ['app-loader', 'app-modal', 'app-loader-small'].indexOf(tag) === -1);
  
  render() {
    const template = `
      <div class="px-4">
        <div class="max-w-4xl mx-auto">

          <div data-component="app-logo" class="text-4xl my-6">
            Index Page
          </div>          
          <p class="text-lg text-gray-700 mb-8 text-center">Explora las funcionalidades básicas de los componentes que implementan la interfaz Component</p>

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-3xl font-bold my-4">Alerts</h2>
              <div class="flex flex-wrap gap-3">

                <button
                  class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  on-click="showInfo">
                  Info (autoclose)
                </button>

                <button
                  class="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                  on-click="showWarning">
                  Warning (confirm)
                </button>

                <button
                  class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  on-click="showError">
                  Error
                </button>

                <button
                  class="px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-900"
                  on-click="showConfirmPromise">
                  Confirm (Promise)
                </button>

                <button
                  class="px-4 py-2 rounded bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAlert">
                  Template
                </button>         
              </div>
            </div>
          </div>

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-3xl font-bold my-4">Diálogos</h2>
              <div class="flex flex-wrap gap-3">
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAlert:sm">
                  sm
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAlert:md">
                  md
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAlert:lg">
                  lg
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAler:xl">
                  xl
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showTemplateAlert:fullscreen">
                  fullscreen
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showHtmlAlert:xl">
                  Html xl
                </button>
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="showHtmlAlert:fullscreen">
                  Html fullscreen
                </button>                             
              </div>
            </div> 
          </div>

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">                
              <h2 class="text-3xl font-bold my-4">Diálogos (new)</h2>
              <div class="flex flex-wrap gap-3">
                <button
                  class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
                  on-click="openSettings">
                  Configuración
                </button> 
              </div>
            </div> 
          </div> 

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-primary mb-3">Método Render</h2>
              <p class="text-gray-600">Define cómo se renderiza el componente, devolviendo el elemento DOM principal. Permite control total sobre la estructura y contenido.</p>
            </div>
          </div>

          <div class="space-y-6 mt-2">
            <div class="bg-card p-6 rounded-lg shadow-md">
              <h2 class="text-2xl font-semibold text-primary mb-3">Método Mounted</h2>
              <p class="text-gray-600">Se ejecuta después de que el componente se ha insertado en el DOM. Ideal para inicializar funcionalidades que requieren acceso al DOM o para configurar eventos.</p>
            </div>
          </div>

          <div class="mt-2">
            <div class="bg-card p-4 rounded-lg shadow-md">
               <div 
                data-component="app-collapsible" 
                data-title="Páginas de componentes"
                class="">
                <ul data-each="component in components" class="space-y-2 test-sm text-gray-600">
                  <li>
                    <div class="text-sm border-b pb-2">{component}</div>
                  </li>
                </ul>               
               </div>
            </div>
          </div>

          <div class="mt-2">
            <div class="bg-card p-4 rounded-lg shadow-md">
              <div 
                data-component="app-collapsible" 
                data-title="Componentes registrados en APP_CONFIG"
                class="mb-4">        
                  <ul data-each="tag in registeredComponents" class="space-y-2 test-sm text-gray-600">
                    <li>
                      <div class="text-2xl border-b pb-2 text-center">{tag}</div>
                      <div data-component="{tag}" class="mt-4"></div>
                    </li>
                  </ul>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  showInfo() {
    dialogService.showInfo(
      'This is an informational alert that closes automatically.',
      {
        autoCloseMs: 1500,
        onClose: () => console.log('Info closed'),
      }
    );
  }

  readonly large_message = 'Are you sure you want to continue?\n\n' +
    'This action may have important consequences and cannot be undone once it is completed.\n\n' +
    'Please take a moment to review the following considerations:\n\n' +
    '- Any unsaved changes will be permanently lost.\n' +
    '- Active processes related to this operation will be stopped immediately.\n' +
    '- Users currently depending on this resource may experience interruptions.\n\n' +
    'If you are unsure, it is recommended to cancel this action and review the configuration again.\n\n' +
    'Do you still want to proceed?';

  showWarning() {
    dialogService.showWarning(
      this.large_message,
      {
        title: 'Confirmation required',
        showConfirmButton: true,
        onConfirm: () => console.log('User confirmed'),
        onCancel: () => console.log('User cancelled'),
        size: 'md',
      }
    );
  }

  showError() {
    dialogService.showError(
      'Something went wrong while saving data.',
      {
        title: 'Error',
        onClose: () => {
          setTimeout(() => this.showHtml(), 500); 
        },
      }
    );
    dialogService.showError(
      'Something went wrong while saving data 55555.',
      {
        title: 'Error 5555'
      }
    );
  }

  showHtml(){
    const html = `
      <div class="flex w-full flex-col items-center gap-4">
        <h2 class="text-4xl font-bold text-center text-slate-900 dark:text-white">
          Esto es HTML
        </h2>

        <p class="w-full rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>

        <div class="relative h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="absolute left-0 top-0 h-full w-1/3
                  animate-[progress-two_1.5s_linear_infinite]
                  bg-slate-900 dark:bg-slate-100">
          </div>
        </div>
      </div>
    `;
    dialogService.showDialog(
      {
        title: 'Prueba html',
        message: html,
        asHtml: true,
        autoCloseMs: 5500,
        icon: '', 
      }
    );
  }

  async showConfirmPromise() {
    const result = await dialogService.confirm(
      'Do you really want to delete this item?',
      {
        title: 'Delete item',        
        literals: literals.noYes.map(text => APP_CONFIG.i18n.t(text)),
      }
    );

    console.log('Confirm result:', result);
  }



  showTemplateAlert(_e : HTMLElement, _ev: Event, size: AlertSize = 'sm') {
    dialogService.showDialog({
      message: `
        <div data-component="app-red-progress-bar"></div>
        <p class="text-center text-gray-700">This is a template-based alert with size ${size}.</p>
      `,
      title: 'Template mode',
      showFooter: true,
      size:size,
    });
  }

  showHtmlAlert(_e : HTMLElement, _ev: Event, size: AlertSize = 'sm') {
    const html = `
      <div class="flex flex-col gap-3 p-4">
        <ul class="divide-y divide-slate-200 dark:divide-slate-700 ">
          ${Array.from({ length: 12 })
            .map(
              (_, i) => `
            <li class="py-3 flex items-center gap-3">
              <button type="button" 
                class="online-flex items-center justify-center rounded-md text-sm font-medium transition-colors
                bg-slate-900 dark:bg-slate-100
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-200
                py-2 px-6">
                  ${i + 1}
              </button>                 
              <div class="flex-1 justify-items-start text-left">
                <p class="font-medium text-slate-800 dark:text-slate-100">
                  Elemento ${i + 1}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Descripción larga del elemento ${i + 1}. Este texto está aquí
                  para forzar el crecimiento vertical del contenido y comprobar
                  cómo responde el scroll dentro del diálogo.
                </p>
              </div>
            </li>
          `
            )
            .join('')}
        </ul>

      </div>
      `;

    dialogService.showDialog({
      message: html,
      asHtml: true, 
      icon: '', 
      disableClose: true,
      title: 'Html mode',
      subTitle: 'Este diálogo contiene una lista larga para probar el scroll vertical.',
      size:size,
      showFooter:true,
    });
  }

  openSettings() {
    const html = `
      <div class="flex w-full flex-col items-center gap-4">
        <h2 class="text-4xl font-bold text-center text-slate-900 dark:text-white">
          Esto es HTML
        </h2>
        <p class="w-full rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>
        <p class="w-full rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>
        <p class="w-full rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>
        <p class="w-full mb-4 rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>
      </div>
    `;
    dialogService.showDialog({
      title: 'Configuración de Usuario',
      message: html,
      asHtml: true,
      showConfirmButton: true,
      literals: literals.cancelYes.map(text => APP_CONFIG.i18n.t(text)),
      onConfirm: (sender) => {
        this.confirmSave(sender);
        return false;
      }
    });
  }

  private confirmSave(opener: AlertComponent) {
    dialogService.confirm('¿Estás seguro de que quieres sobreescribir los datos?', {
      title: 'Confirmación Crítica',
      literals: literals.noYes.map(text => APP_CONFIG.i18n.t(text)),
    }).then((confirmed) => {
      if (confirmed) {
        dialogService.showLoading('Grabando', 
          { 
            autoCloseMs: 5_000,
            onClose: () => opener.close(),
          }
        );        
      }
    });
  }

}

