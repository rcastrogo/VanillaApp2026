import { pubSub } from "./pubsub.service";
import type { ComponentElement } from "../types";

import { APP_CONFIG } from "@/app.config";
import {
  AlertComponent,
} from "@/components/alert/alert.component";
import {
  type afterOpenCallback,
  type AlertOptions,
  type AlertRef
} from "@/components/alert/alert.model";

class DialogService {

  private dialogStack = 0;
  private backdropElement?: HTMLElement;
  private readonly BASE_Z_INDEX = 6000;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeLastByEscape();
    });
    pubSub.subscribe(
      APP_CONFIG.messages.app.dialogClosed, () => this.removeDialog()
    );
  }

  // =====================================================
  // API pública
  // =====================================================
  showProgressBar(duration?: number) {
    pubSub.publish(APP_CONFIG.messages.httpClient.loading);
    if (duration && duration > 0) {
      setTimeout(this.hideProgressBar, duration);
    }
  }

  hideProgressBar = () => pubSub.publish(APP_CONFIG.messages.httpClient.loaded);

  private createRef(options: Partial<AlertOptions>): AlertRef {
    let callback: afterOpenCallback = null;
    const instance = this.show({
      ...options,
      onAfterOpen: (data) => callback?.(data),
    } as AlertOptions);

    return {
      afterOpen: (cb) => callback = cb,
      instance
    };
  }

  showDialog(options?: Partial<AlertOptions>) {
    return this.createRef({ icon: undefined, showFooter: true, ...options });
  }

  showInfo(message: string, options?: Partial<AlertOptions>) {
    return this.createRef({ ...options, message, icon: 'info', showFooter: false });
  }

  showSuccess(message: string, options?: Partial<AlertOptions>) {
    return this.createRef({ ...options, message, icon: 'check', showFooter: options?.showFooter || false });
  }

  showWarning(message: string, options?: Partial<AlertOptions>) {
    return this.createRef({ ...options, message, icon: 'warning', showFooter: true });
  }

  showError(message: string, options?: Partial<AlertOptions>) {
    return this.createRef({ ...options, message, icon: 'circle-x', showFooter: true });
  }

  showLoading(message: string, options?: Partial<AlertOptions>) {
    const html = `
      <div class="flex flex-col items-center gap-2 justify-center">
        ${message}  
        <div class="h-1 w-40 overflow-hidden rounded-full bg-red-700">
          <div class="h-full w-full origin-left animate-[progress_2.5s_infinite_linear] bg-primary"></div>        
        </div>
        <div class="h-px"></div>
      </div>
    `;
    return this.createRef({
      ...options, message: html, asHtml: true, disableClose: true, size: 'none'
    });
  }

  showQuestion(message: string, options?: Partial<AlertOptions>): AlertRef {
    return this.createRef({
      ...options,
      message,
      icon: 'question',
      showFooter: true,
      showConfirmButton: true,
    });
  }

  confirm(message: string, options?: Partial<AlertOptions>): Promise<boolean> {
    return new Promise(resolve => {
      this.show({
        ...options,
        message,
        showFooter: true,
        icon: 'question',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        showConfirmButton: true,
      });
    });
  }

  // =======================================================================
  // Core
  // =======================================================================
  private show(options: AlertOptions): AlertComponent {
    this.ensureBackdrop();
    const currentZIndex = this.BASE_Z_INDEX + (this.dialogStack * 2);
    this.backdropElement!.style.zIndex = currentZIndex.toString();
    // ===========================================================
    // Crear instancia del componente y agregar al DOM
    // ===========================================================
    const instance = new AlertComponent();
    instance.init({ data: options});
    const element = instance.render();
    element.style.zIndex = (currentZIndex + 1).toString();    
    document.body.appendChild(element);
    this.dialogStack++;
    return instance;
  }

  private ensureBackdrop() {
    if (!this.backdropElement) {
      this.backdropElement = document.createElement('div');
      this.backdropElement.className = 'fixed inset-0 bg-black/60 transition-opacity duration-300';
      this.backdropElement.style.pointerEvents = 'auto';
      document.body.appendChild(this.backdropElement);
    }
    this.backdropElement.style.display = 'block';
  }

  private removeDialog() {
    this.dialogStack--;
    if (this.dialogStack > 0) {
      const prevZIndex = this.BASE_Z_INDEX + ((this.dialogStack - 1) * 2);
      this.backdropElement!.style.zIndex = prevZIndex.toString();
    } else {
      this.backdropElement?.remove();
      this.backdropElement = undefined;
    }
  }

  private getLast(): AlertComponent | null {
    if (this.dialogStack === 0) return null;
    const elements = document.querySelectorAll('.app-alert-wrapper');
    if(elements.length === 0) return null;
    const lastElement = elements[elements.length - 1] as HTMLElement;
    const instance = (lastElement as ComponentElement).__componentInstance as AlertComponent;
    return instance ?? null;
  } 

  private closeLastByEscape() {
    const last = this.getLast();
    if (last && last.canClose()) last.close();
  }

  close(): AlertComponent | null {
    const last = this.getLast();
    if (last) last.close();
    return last
  }

  forceClose() {
    while (this.close()) { /* empty */ }
  }
}

export const dialogService = new DialogService();
