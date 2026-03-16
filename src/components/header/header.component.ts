import template from './header.template.html?raw';
import { build } from '../../core/dom';
import { interpolate } from '../../core/template';
import { BaseComponent} from '../../core/types';
import type { ComponentContext } from '../component.model';

export class HeaderComponent extends BaseComponent {


  appDescription = {
    profilePath: '/user/settings',    
    user: {
      name: 'Gemini User',
      balance: 1250.50
    },
    router: {
      navigateTo: (path: string) => {
        console.log(`🚀 [Router] Navegando a: ${path}`, this.instanceId);
        this.publish('SYSTEM_MSG', `Ruta actual: <b>${path}</b>`);
      }
    },
    toUpperCase: (val: string) => val?.toUpperCase() || '',  
    currency: (val: number, symbol: '$', decimals: 2) => {
      return `${val.toFixed(Number(decimals))}${symbol}`;
    },
    showMessage: (el: HTMLElement, _e: Event, id: string) => {
      console.log('Settings clicked!', { element: el, instance: id });      
      // Disparamos cambios reactivos
      this.publish('SYSTEM_MSG', `Configuración abierta para ID: ${id}`);
      this.publish('NOTIFICATIONS_COUNT', 'bg-yellow-400 text-black animate-bounce');
    },

    // Handler especial para on-publish (el motor lo detecta como función)
    statusColor: (el: HTMLElement, data: string) => {
      el.className = `p-2 rounded-full transition-all ${data}`;
      setTimeout(() => el.classList.remove('animate-bounce'), 2000);
    }
  };
  
  constructor(ctx: ComponentContext) {
    super(ctx)
    console.log(this.instanceId);
  }

  init() {
    console.log('Inicializando componente HeaderComponent: ' + this.instanceId);
  }

  render(): HTMLElement {
    const cxt = {
      ...this.appDescription,
      instanceId: this.instanceId,
      title : 'HeaderComponent instance ' + this.instanceId,
      component: this,
    }
    this.element = build('div', interpolate(template, cxt), true, cxt );
    return this.element;
  }

  mounted() { /* empty */ }
}

export default (ctx: ComponentContext) => new HeaderComponent(ctx);


// export class HeaderComponent extends BaseComponent {
  
//   init() {
//     this.state.notifications = ['Bienvenido', 'Tienes un mensaje'];
    
//     // Suscripción auto-gestionada (se limpiará sola en destroy)
//     this.subscribe('NEW_NOTIF', (msg) => {
//       this.state.notifications = [...this.state.notifications, msg];
//     });
//   }

//   render() {
//     const ctx = { ...this.ctx, ...this.state };
//     const html = `
//       <div class="header">
//         <span>Notif: {notifications.length}</span>
//         <ul data-each="n in notifications">
//           <li class="p-1 text-xs border-b">{n}</li>
//         </ul>
//       </div>
//     `;
//     return build('div', interpolate(html, ctx), true, ctx);
//   }
// }