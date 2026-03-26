


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
        <div data-component="app-language-selector"></div>     
        <h1 class="text-3xl" data-t="dashboard"></h1>
        <p data-t="welcome"></p>
        <button id="load-widget" data-t="t:ui.actions.loadCounter"></button>        
        <div id="widget-container"></div>
        <div class="footer"></div>
      `;
      element = buildAndInterpolate(template, { name: 'Fulanito'}, false);
      return element;
    },
    mounted: async () => {
      const footerHtml = await loader.loadRaw(() => import('../../templates/footer-extra.html?raw'));
      const footerElement = $('.footer', element).one();
      if(footerElement){
        footerElement.innerHTML = '';
        footerElement.appendChild(build('div', footerHtml, true, ctx));

        const i18nCtx = { 
          name: 'José', 
          id : 5, 
          sayHello: function(){ return 'hola ' + this.name; } 
        };
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
          const text = interpolate(test.text, test.ctx);
          const node = build('div', text, false);
          footerElement.appendChild(node);
        })
      }

      $('#load-widget', element).one()?.addEventListener('click', async () => {
        const widget = await loader.resolve(() => import('../../../components/test/counter-component'), ctx );       
        const container = $('#widget-container').one();
        if (container && widget) {
          widget.init?.();
          container.replaceWith(BaseComponent.renderAndBind(widget as BaseComponent));
          widget.mounted?.();
        }

      });
    }
  };
};

export default dashboardPage;
