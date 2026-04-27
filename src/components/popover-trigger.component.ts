import type { ComponentContext, ComponentInitValue } from "./component.model";
import { $, buildAndInterpolate, setupFocusTrap } from "../core/dom";
import { BaseComponent } from "../core/types";

import { FloatingPortal } from "@/core/floating-portal";

export class PopoverTriggerComponent extends BaseComponent {

  private portal: FloatingPortal | null = null;
  private triggerEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;
  private portalEl: HTMLElement | null = null;
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private releaseFocusTrap?: () => void;

  private readonly handleTriggerClick = () => this.toggle();
  private readonly handleMouseEnter = () => {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    if (!this.state.isOpen) this.open();
  };

  private readonly handleMouseLeave = () => {
    this.scheduleClose();
  };

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

  private get openMode(): 'click' | 'hover' {
    const raw = (this.props.mode || this.props.trigger || 'click').toLowerCase();
    return raw === 'hover' ? 'hover' : 'click';
  }

  private get isHoverMode(): boolean {
    return this.openMode === 'hover';
  }

  private scheduleClose(): void {
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
    this.closeTimeout = setTimeout(() => {
      this.close();
    }, 150);
  }

  private bindPortalHoverEvents(el: HTMLElement): void {
    this.portalEl = el;
    el.addEventListener('mouseenter', this.handleMouseEnter);
    el.addEventListener('mouseleave', this.handleMouseLeave);
  }

  private unbindPortalHoverEvents(): void {
    if (!this.portalEl) return;
    this.portalEl.removeEventListener('mouseenter', this.handleMouseEnter);
    this.portalEl.removeEventListener('mouseleave', this.handleMouseLeave);
    this.portalEl = null;
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
    if (this.isHoverMode) {
      this.triggerEl.addEventListener('mouseenter', this.handleMouseEnter);
      this.triggerEl.addEventListener('mouseleave', this.handleMouseLeave);
    } else {
      this.triggerEl.addEventListener('click', this.handleTriggerClick);
    }
    document.addEventListener('keydown', this.handleKeyDown);
    this.addCleanup(() => {
      this.triggerEl?.removeEventListener('click', this.handleTriggerClick);
      this.triggerEl?.removeEventListener('mouseenter', this.handleMouseEnter);
      this.triggerEl?.removeEventListener('mouseleave', this.handleMouseLeave);
      this.unbindPortalHoverEvents();
      if (this.closeTimeout) clearTimeout(this.closeTimeout);
      document.removeEventListener('keydown', this.handleKeyDown);
    });
  }

  destroy(): void {
    this.unbindPortalHoverEvents();
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
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
          if (this.isHoverMode) {
            this.bindPortalHoverEvents(el);
          }
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
    if (!this.isHoverMode) {
      requestAnimationFrame(() => {
        const portalEl = this.portal?.getPortalElement();
        if (portalEl) this.releaseFocusTrap = setupFocusTrap(portalEl);
      });
    }
  }

  close(): void {
    if (!this.state.isOpen) return;
    this.releaseFocusTrap?.();
    this.releaseFocusTrap = undefined;
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.state.isOpen = false;
    this.unbindPortalHoverEvents();
    this.portal?.close();
    this.portal = null;
    if (!this.isHoverMode) this.triggerEl?.focus();
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
