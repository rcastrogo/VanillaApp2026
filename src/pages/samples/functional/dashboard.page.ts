

import { buildAndInterpolateDSL } from '@/core/template-compiler';
import { APP_CONFIG } from '../../../app.config';
import type { ComponentContext, ComponentFactory } from '../../../components/component.model';
import { interpolate } from '../../../core//template';
import { $, build, buildAndInterpolate } from '../../../core/dom';
import { loader } from '../../../core/services/loader.service';
import type { StateCallback } from '../../../core/state.utils';
import { BaseComponent} from '../../../core/types';

const dashboardPage: ComponentFactory = (ctx: ComponentContext) => {

  let element!: HTMLElement;
  let subs: StateCallback<void>;

  function updateTranslations() {
    if (!element) return;
    $('[data-i18n-key]', element).all().forEach(el => {
      const key = el.getAttribute('data-i18n-key')!;
      el.textContent = APP_CONFIG.i18n.t(key, { name: 'Fulanito'});
    });
  }

  return {
    destroy : function(){
      subs?.();
    },
    init: function(){
      subs = APP_CONFIG.i18n.changed(() => updateTranslations());
    },
    render: () => {
      const template = `
        <div class="mx-auto text-center">
          <h1 data-t="dashboard" class="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">              
          </h1>

          <p 
            data-t="welcome" 
            class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          </p>

          <div class="flex justify-center gap-3 mb-12">
            <button 
              id="load-widget" 
              data-t="t:ui.actions.loadCounter"
              class="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Ver demo dinámica
            </button>
          </div>

          <div 
            class="mx-10"
            data-expanded="true"
            data-component="app-collapsible" 
            data-title="Carga dinámica de componentes">
            <div id="widget-container">
              Aquí se cargará el widget de contador al hacer clic en el botón, usando el sistema de componentes.
              <!-- El widget de contador se cargará aquí tras hacer clic en el botón -->
            </div>
          </div>
          <div class="mt-4 mx-10">
            <div class="slot">
              <!-- Aquí se cargará contenido adicional tras la carga inicial de la página -->
            </div>
          </div>

        </div>
      `;
      element = buildAndInterpolate(template, { name: 'Fulanito'}, false);
      return element;
    },
    mounted: async () => {
      // =======================================================================================
      // DEMO DE CARGA DINÁMICA DE CONTENIDO (simulando petición remota)
      // =======================================================================================
      const footerHtml = await loader.loadRaw(() => import('../../templates/info.html?raw'));
      const footerElement = $('.slot', element).one();
      if(footerElement){
        footerElement.innerHTML = '';
        footerElement.appendChild(buildAndInterpolate(footerHtml, ctx));
        // =====================================================================================
        // DEMO DE INTERPOLACIÓN DE TRADUCCIONES CON DIFERENTES SINTAXIS
        // =====================================================================================
        const i18nCtx = { 
          name: 'José', 
          id : 5, 
          sayHello: function(){ return 'hola ' + this.name; } 
        };
        const buffer: { text: string; value: string; }[] = [];
        [
          {text : "{'logout:@id:@location.hostname:@name'}", ctx: i18nCtx },
          {text : "{'ui.actions.yes:param1:param2:param3'}", ctx: i18nCtx },
          {text : "{'logout' | t}", ctx: i18nCtx },
          {text : "{t:logout | upper}", ctx: i18nCtx },
          {text : "{t:ui.actions.yes:param1:param2 | upper}", ctx: i18nCtx },
          {text : "{'ui.actions.yes' | t | upper}", ctx: i18nCtx },
          {text : "{'ui.actions.yes'}", ctx: i18nCtx },
          {text : "{'ui.actions.interpolate:@id:@location.hostname' | debug}", ctx: { ...i18nCtx, count: 25 } },
        ].forEach(test => {
          const value = interpolate(test.text, test.ctx);
          buffer.push( {text: test.text, value} );          
        })
        const template = `
          <div class="mt-6">
            <h3 class="text-lg font-semibold mb-3">
              Demo de interpolación de traducciones con diferentes sintaxis:
            </h3>
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 p-8 border rounded-4xl">
              @each(item in items)
                <code class="text-sm text-right text-gray-700 dark:text-gray-300">
                  {item.text}
                </code>
                <div class="text-sm text-left text-gray-900 dark:text-gray-100">
                  {item.value}
                </div>
              @endeach
            </div>
          </div>
        `;
        footerElement.appendChild(
          buildAndInterpolateDSL(template, { items: buffer }) 
        );
        footerElement.appendChild( 
          build(
            'pre', 
            {
              innerHTML: JSON.stringify({...i18nCtx, count: 25 }),
              className: 'mt-2 p-8 border rounded-4xl'
            }
            , false) 
          );
      }

      // =======================================================================================
      // carga de widget de contador al hacer clic en el botón, usando el sistema de componentes
      // =======================================================================================
      let cancelAction = false;
      $('#load-widget', element).one()?.addEventListener('click', async () => {
        if(cancelAction) return;
        cancelAction = true; // para evitar múltiples clics y cargas simultáneas
        const widget = await loader.resolve(() => import('../../../components/test/counter-component'), ctx );       
        const container = $('#widget-container').one();
        if (container && widget) {
          widget.init?.();
          container.innerHTML = '';
          container.appendChild(
            BaseComponent.renderAndBind(widget as BaseComponent)
          );
          widget.mounted?.();
        }
      });
    }
  };
};

export default dashboardPage;
