import type { ComponentContext, ComponentInitValue } from "./component.model";
import { $, buildAndInterpolate } from "../core/dom";
import { BaseComponent } from "../core/types";

import { FloatingPortal } from "@/core/floating-portal";

export class PopoverTriggerComponent extends BaseComponent {

  private portal: FloatingPortal | null = null;
  private triggerEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;

  private readonly handleTriggerClick = () => this.toggle();
  private readonly handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.state.isOpen) this.close();
  };
  private clickInside : ((e: Event) => boolean) | null = null;
  private beforeOpen : ((e: HTMLElement) => void) | null = null;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ isOpen: false });
  }

  mounted(): void {
    if(!this.element) return;
   
    this.triggerEl = $('[data-popover-trigger]', this.element).one();
    this.contentEl =  $('[data-popover-content]', this.element).one();

    if (!this.triggerEl || !this.contentEl) {
      console.warn("PopoverTrigger: Faltan data-popover-trigger o data-popover-content");
      return;
    }
    this.contentEl.style.display = 'none';
    this.triggerEl.addEventListener('click', this.handleTriggerClick);
    document.addEventListener('keydown', this.handleKeyDown);
    this.addCleanup(() => {
      this.triggerEl?.removeEventListener('click', this.handleTriggerClick);
      document.removeEventListener('keydown', this.handleKeyDown);
    });
  }

  destroy(): void {
    this.portal?.close();
    super.destroy();
  }

  toggle(): void {
    if(this.state.isOpen)
       this.close();
    else 
      this.open();
  }

  open(): void {
    if (this.state.isOpen || !this.triggerEl || !this.contentEl) return;
    const template = `
      <div
        class="p-4 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700
                shadow-2xl">
        <div data-each="child in children"></div>
      </div>
    `;
    this.portal = new FloatingPortal(
      this.triggerEl, 
      buildAndInterpolate(template, { children: [this.contentEl]}), 
      {
        onClose: () => this.close(),
        onClickInside: (e: MouseEvent) => {
          const shouldClose = this.clickInside?.(e);
          if(shouldClose) this.close();
        },
        onOpen: (el: HTMLElement) => {
          setTimeout(() => {
            this.beforeOpen?.(el);
          }, 0)
        },
        placement: this.props.placement || '',
        offset: this.props.offset ? parseInt(this.props.offset) : 4,
      }
    );
    this.contentEl.style.display = '';
    this.state.isOpen = true;
    this.portal.open();
  }

  close(): void {
    if (!this.state.isOpen) return;
    this.state.isOpen = false;
    this.portal?.close();
    this.portal = null;
    this.triggerEl?.focus();
  }

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const template = `
      <div class="contents">
        <div data-each="child in children"></div>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
  
}
