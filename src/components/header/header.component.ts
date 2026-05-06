import template from './header.template.html?raw';
import { buildAndInterpolate } from '../../core/dom';
import { BaseComponent } from '../../core/types';
import type { Runnable } from '../component.model';

import { APP_CONFIG } from '@/app.config';
import { pubSub } from '@/core/services/pubsub.service';


export class HeaderComponent extends BaseComponent {

  progressEl: HTMLElement | null = null;

  init() {
    this.setState({});
    this.addCleanup([
      pubSub.subscribe(APP_CONFIG.messages.httpClient.loading, () => this.showProgressBar(true)),
      pubSub.subscribe(APP_CONFIG.messages.httpClient.loaded, () => this.showProgressBar(false)),

      pubSub.subscribe(APP_CONFIG.messages.router.loading, () => this.showProgressBar(true)),
      pubSub.subscribe(APP_CONFIG.messages.router.loaded, () => this.showProgressBar(false)),
      pubSub.subscribe(APP_CONFIG.messages.router.error, () => this.showProgressBar(false))
    ]);
  }

  showMessage(el: HTMLElement, e: Event, id: string) {
    console.log(el, e, id);
    pubSub.publish(APP_CONFIG.messages.app.message, `Configuración abierta para ID: ${id} a las ${new Date().toLocaleTimeString()}`);
  }

  showProgressBar(show: boolean) {
    const selector = '#logo-progress-bar';
    const instace = BaseComponent.getInstance(selector, this.element!) as Runnable | null;     
    if (instace && show)
      instace.start();  
    else if(instace)
      instace.stop();
  }

  // Handler especial para on-publish (el motor lo detecta como función)
  statusColor(el: HTMLElement, data: string) {
    el.className = `p-2 rounded-full transition-all ${data}`;
    setTimeout(() => el.classList.remove('animate-bounce'), 2000);
  }

  render() {
    return buildAndInterpolate(template, this);
  }

}