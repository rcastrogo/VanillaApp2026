

import type { ComponentInitValue } from "../component.model";
import template from "./alert.template.html?raw";

import { APP_CONFIG } from "@/app.config";
import { pubSub } from "@/core/services/pubsub.service";
import { buildAndInterpolateDSL } from "@/core/template-compiler";
import { BaseComponent } from "@/core/types";

export const literals = {
  noYes : ['ui.actions.no', 'ui.actions.yes' ],
  cancelYes : ['ui.actions.cancel', 'ui.actions.yes' ]
}

export type AlertSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'fullscreen' 
  | 'none'
  | 'image';

const ALERT_SIZE_CLASS_MAP: Record<AlertSize, string> = {
  sm: 'w-[400px] max-w-[85vw] max-h-[90vh]',
  md: 'w-[600px] max-w-[75vw] max-h-[90vh]',
  lg: 'w-[75vw] max-h-[75vh]',
  xl: 'w-[90vw] max-h-[90vh]',
  fullscreen: 'fixed inset-0 w-screen h-screen max-w-none rounded-none',
  none: '',
  image : 'w-[80vw] !p-1'
};

export interface AlertRef {
  afterOpen: (callback: (sender: AlertComponent) => void) => void;
  instance?: AlertComponent
}
export type afterOpenCallback = ((data: AlertComponent) => void ) | null;

export interface confirmParams {
  element: HTMLElement;
  setFeedback: (text: string) => void;
  data: AlertComponent;
}

export interface AlertOptions {
  title?: string;
  subTitle?: string;
  message?: string;
  asHtml?: boolean;
  onAfterOpen?: afterOpenCallback ;
  context?: unknown; 
  icon?: string;
  showFooter?: boolean;
  showConfirmButton?:boolean;
  autoCloseMs?: number;
  onConfirm?: (sender: AlertComponent) => boolean | void;
  onCancel?: () => void;
  onClose?: () => void;
  literals?: string[];
  disableClose?: boolean;
  size?: AlertSize;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAlertOptions(obj: any): obj is AlertOptions {
  return obj && typeof obj === 'object' && 'message' in obj;
}

export class AlertComponent extends BaseComponent {

  private onClose!: () => void;
  private onCancel!: () => void;
  private onConfirm!: (sender: AlertComponent) => boolean;

  private disableClose = false;
  showFooter = false;
  showConfirmButton = false;

  title = '';
  subTitle = '';
  message = '';
  icon = '';
  infoMessage = '';
  size:AlertSize = 'md';

  literals = [
    APP_CONFIG.i18n.t('ui.actions.close'),
    APP_CONFIG.i18n.t('ui.actions.accept'),
  ];

  get sizeClass(){
    return ALERT_SIZE_CLASS_MAP[this.size];
  }

  init(ctx?: ComponentInitValue): void {
    super.init(ctx);
    if(isAlertOptions(ctx?.data)){
      Object.assign(this, ctx.data);
      if ( ctx.data.autoCloseMs) {
        setTimeout(() => this.close(), ctx.data.autoCloseMs);
      }      
    }
    this.literals = (this.literals || literals.noYes).map(text => APP_CONFIG.i18n.t(text))
  } 

  render(){
    this.element = buildAndInterpolateDSL(template, this);
    return this.bind(this.element);
  }

  onBackdropClick(_e: HTMLDivElement, event: MouseEvent){
    if(this.disableClose) return;
    if ((event.target as HTMLElement).classList.contains('js-back-drop')) {
      this.close();
    }
  }

  close(){
    if(this.onClose) this.onClose();
    if(this.element){
      this.element.remove();
    }
    pubSub.publish(APP_CONFIG.messages.app.dialogClosed, this)
  }

  canClose(){
    return !this.disableClose;
  }

  cancel(){
    if(this.onCancel) this.onCancel();
    this.close();
  }

  confirm(){
    if(this.onConfirm && this.onConfirm(this) == false) return;
    this.close();
  }

  getContainer(): HTMLElement | null{
    return this.element
  }

  setFeedback = (text: string) => {
    this.infoMessage = text;
    this.publish('INFO_MESSAGE_UPDATED', text);
  }

}