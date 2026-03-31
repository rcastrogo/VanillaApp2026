import template from './header.template.html?raw';
import { buildAndInterpolate } from '../../core/dom';
import { BaseComponent} from '../../core/types';

import { APP_CONFIG } from '@/app.config';
import { pubSub } from '@/core/services/pubsub.service';

export class HeaderComponent extends BaseComponent {


  init() { 
    this.setState({});
  }

  showMessage(el: HTMLElement, e: Event, id: string) {
    console.log(el, e, id);
    pubSub.publish(APP_CONFIG.messages.App.message, `Configuración abierta para ID: ${id} a las ${new Date().toLocaleTimeString()}`);
  }

  // Handler especial para on-publish (el motor lo detecta como función)
  statusColor(el: HTMLElement, data: string){
    el.className = `p-2 rounded-full transition-all ${data}`;
    setTimeout(() => el.classList.remove('animate-bounce'), 2000);
  }

  render(){
    return buildAndInterpolate(template, this);
  }

}