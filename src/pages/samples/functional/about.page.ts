import type { ComponentContext, ComponentFactory } from '../../../components/component.model';
import { build } from '../../../core/dom';

const aboutPage: ComponentFactory = (_ctx: ComponentContext) => {
  return {
    render: () => {
      const container = document.createElement('div');
      container.innerHTML = `<div class="loader">Cargando template...</div>`;

      setTimeout(() => {          
        import('../../templates/about.html?raw').then((module) => {
          container.innerHTML = '';
          container.appendChild(build('div', module.default, true, {}));
        });
      }, 2_000);
      return container;
    }
  };
};

export default aboutPage;