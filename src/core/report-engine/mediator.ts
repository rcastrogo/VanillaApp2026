
import type { Mediator, MediatorSendValue } from "./types";

export interface DefaultMediatorValue {
  html: string;
  documentFragment: DocumentFragment,
  hasComponents: boolean;
}
export class DefaultMediator implements Mediator {

  private hasComponents = false;
  private buffer = '';
  private documentFragment: DocumentFragment;

  update: (value: DefaultMediatorValue) => void = () => ''

  constructor(update: (value: DefaultMediatorValue) => void) {
    this.hasComponents = false;
    this.update = update;
    this.documentFragment = document.createDocumentFragment();
  }

  send(content: MediatorSendValue) {
    if (Array.isArray(content)) {
      this.buffer += content.join('');
    }
    else if (typeof content === 'string'){
      this.buffer += content;
    } else if (content.component){
      this.hasComponents = true;
      const el = content.component.render?.();
      if(el) this.documentFragment.appendChild(el);      
      this.buffer += `<div data-replace-locator=""></div>`;  
    }
  }

  flush() {
    this.update({ 
      html: this.buffer,
      documentFragment: this.documentFragment,
      hasComponents: this.hasComponents
    });
  }

  clear() {
    this.hasComponents = false;
    this.buffer = '';
    this.documentFragment = document.createDocumentFragment();
    this.flush();
  }
  
  applyResult(
    container: HTMLElement,
    value: DefaultMediatorValue,
    hydrate?: () => void
  ) {
    container.innerHTML = value.html;
    const fragment = value.documentFragment;
    const hasNodes = fragment && fragment.hasChildNodes();
    // ===================================================================
    // Caso: solo html
    // ===================================================================
    if (!hasNodes) {
      hydrate?.();
      return;
    }
    // ===================================================================
    // Caso: solo components
    // ===================================================================
    if (!value.html) {
      container.append(fragment);
      return;
    }
    // ===================================================================
    // Caso: HTML + components
    // ===================================================================
    hydrate?.();
    const targets = container.querySelectorAll('[data-replace-locator]');
    targets.forEach(target => {
      const child = fragment.firstChild;
      if (!child) return;
      target.replaceWith(child);
    });
  }

}
