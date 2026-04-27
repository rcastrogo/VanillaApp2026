
import type { ComponentContext, ComponentInitValue, PublishContext } from '../component.model';
import {
  type NotificationPosition,
  type NotificationType,
} from './notification-panel.model';

import { APP_CONFIG } from '@/app.config';
import { $, buildAndInterpolate } from '@/core/dom';
import { pubSub } from '@/core/services/pubsub.service';
import { buildAndInterpolateDSL } from '@/core/template-compiler';
import { BaseComponent } from '@/core/types';

interface NotificationInput {
  message: string;
  autoCloseMs?: number;
  type?: NotificationType;
  id?: number;
}

const POSITION_CLASS_MAP: Record<NotificationPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

let notificationId = 1;

export default class NotificationPanel extends BaseComponent {

  constructor(ctx?: ComponentContext) {
    super(ctx);
  }

  init(ctx?: ComponentInitValue): void {
    super.init(ctx);
    this.addCleanup([
      pubSub.subscribe<string | NotificationInput>( 
        APP_CONFIG.messages.app.showNotification, (payload) => payload && this.show(payload)
      ),
      pubSub.subscribe<number>( 
        APP_CONFIG.messages.app.closeNotification, (id) => id && this.close(id)
      )
    ]);    
  }

  render() {
    const positionClass = POSITION_CLASS_MAP[APP_CONFIG.notificationPosition || 'top-right']  ;
    const template = `
      <div data-app-notification-panel="" class="fixed z-9999 w-96 max-w-[95dvw] flex flex-col gap-2 select-none ${positionClass}">
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  // ======================================================
  // API interna
  // ======================================================
  private show(payload: string | NotificationInput | PublishContext) {    
    // ======================================================
    // Normalizar input
    // ======================================================
    let input: NotificationInput;
    if(typeof payload === 'string'){
      input = { message: payload, type: '' };
    } else if('message' in payload){
      input = payload as NotificationInput;      
    } else {
      input = {
        type: payload.args[0] as NotificationType || '',
        message: payload.args[1] as string,
        autoCloseMs: payload.args[2] as number | undefined,
      };
    }
    // ======================================================
    // Crear objeto de notificación
    // ====================================================== 
    const notification: NotificationInput = {
      id: notificationId++,
      message: input.message,
      autoCloseMs: input.autoCloseMs ?? 4000,
      type: input.type
    };
    // ======================================================
    // Configurar auto-cierre
    // ======================================================
    if ((notification.autoCloseMs || 0) > 0) {
      setTimeout(
        () => this.close(notification.id || 0),
        notification.autoCloseMs
      );
    }
    // ======================================================
    // Renderizar la notificación
    // ======================================================
    const instance = new Notification();
    instance.init({ data: notification });
    this.element?.append(instance.render());
  }

  private close(id: number | PublishContext) {
    const toastId = typeof id === 'number' ? id : id.args[0];
    const toast = $(`#toas-${toastId}`, this.element).one();
    if (toast) {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300', 'animate-slide-out-x');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }
  }
}

// ======================================================
// Componente de notificación individual
// ====================================================== 
class Notification extends BaseComponent {

  private startX = 0;
  private currentX = 0;
  private swiping = false;  
  private notification!: NotificationInput;

  init(ctx?: ComponentInitValue): void {
    super.init(ctx);
    this.notification = ctx?.data as NotificationInput;
  }

  private resolveIcon(type: NotificationType): string{
    if (type) {
      if (type === 'error') return 'x';
      if (type === 'info') return 'info';
      if (type === 'warning') return 'warning';
      if (type === 'success') return 'check';
    }
    return ''; 
  }

  render(): HTMLElement {
    const icon = this.resolveIcon(this.notification.type || '');
    const template = `
      <div 
        id="toas-{notification.id}"
        class="relative bg-white dark:bg-gray-800
               border border-gray-300 dark:border-gray-700
               rounded-lg shadow-lg p-4"
        style="touch-action: pan-y"
        on-pointerdown="onPointerDown" 
        on-pointermove="onPointerMove" 
        on-pointerup="onPointerUp" 
        on-pointercancel="onPointerUp"
        >
          <button
            data-close-btn
            on-click="publish:app-close-notification:global:@notification.id"
            class="
              group absolute top-3 right-3 w-8 h-8 flex items-center justify-center               
              rounded-md
              text-slate-500 hover:text-slate-900
              hover:bg-slate-100
              dark:text-slate-400 dark:hover:text-white
              dark:hover:bg-slate-900
            "
            aria-label="Close notification"
          >
            <i data-icon="x" class="size-5 shrink-0"></i>
          </button>
          <div class="pr-8 flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
            @if(notification.type)
              <i data-icon="${icon}"
                class="size-6 shrink-0"
              ></i>
            @endif
            @if(notification.asHtml)
              <div class="w-full overflow-auto">
                {notification.message}
              </div>            
            @else
              <div class="w-full wrap-break-word whitespace-pre-wrap">{notification.message | asParagraph}</div>
          </div>
        </div>
    `;
    return buildAndInterpolateDSL(template, this);
  }

  onPointerDown(el: HTMLElement, ev: PointerEvent) {
    if (ev.target instanceof Element && ev.target.closest('[data-close-btn]')) return;
    this.startX = ev.clientX;
    this.swiping = true;
    el.setPointerCapture(ev.pointerId);
  }

  onPointerMove(el: HTMLElement, ev: PointerEvent) {
    if (!this.swiping) return;
    const delta = ev.clientX - this.startX;
    const offsetX = Math.max(-300, Math.min(300, delta));
    this.currentX = offsetX;
    el.style.transform = `translateX(${offsetX}px)`;
  }

  onPointerUp(el: HTMLElement) {
    if (!this.swiping) return;
    this.swiping = false;
    const threshold = 100;
    const abs = Math.abs(this.currentX);
    if (abs > threshold) {
      const direction = this.currentX > 0 ? 'right' : 'left';
      this.animateSwipeClose(el, direction);
    } else {
      el.style.transition = 'transform 0.2s ease';
      el.style.transform = 'translateX(0)';
    }
  }

  animateSwipeClose(el: HTMLElement, direction: 'left' | 'right') {
    el.style.setProperty('--target', direction === 'right' ? '100vw' : '-100vw');
    el.style.setProperty('--offset', `${this.currentX}px`);
    el.classList.add('animate-slide-out-x');
    setTimeout(() => {
     pubSub.publish(APP_CONFIG.messages.app.closeNotification, this.notification.id);
    }, 200);
  }

  asParagraph(text: string): string {
    const lines = (text || '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return '';
    if (lines.length === 1) return lines[0];
    return lines
      .map(line => `<p class="indent-2">${line}</p>`)
      .join('');
  }

}