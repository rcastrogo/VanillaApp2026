
import type { ComponentContext, ComponentFactory } from '../../../components/component.model';
import { $, build } from '../../../core/dom';
import type { BaseComponent, ComponentElement } from '../../../core/types';
import { loader } from '../../../core/services/loader.service';

const dashboardPage: ComponentFactory = (ctx: ComponentContext) => {

  let element: HTMLElement;

  return {
    render: () => {
      element = document.createElement('div');
      element.innerHTML = `
        <h1>Dashboard</h1>
        <button id="load-widget">Cargar Counter</button>        
        <div id="widget-container"></div>
        <div class="footer">
        </div>
      `;
      return element;
    },
    mounted: async () => {

      const footerHtml = await loader.loadRaw(() => import('../../templates/footer-extra.html?raw'));
      const footerElement = $('.footer', element).one();
      if(footerElement){
        footerElement.innerHTML = '';
        footerElement.appendChild(build('div', footerHtml, true, ctx));
      }

      $('#load-widget', element).one()?.addEventListener('click', async () => {
        const widget = await loader.resolve(() => import('../../../components/test/counter-component'), ctx );       
        const container = $('#widget-container').one();
        if (container && widget) {
          widget.init?.();
          const element = widget.render() as ComponentElement;
          if (!element.__componentInstance) {
            element.__componentInstance = widget as BaseComponent;
            widget.element = element;
          }
          container.replaceWith(element);
          widget.mounted?.();
        }

      });
    }
  };
};

export default dashboardPage;
