import type { ComponentContext, ComponentInitValue } from "./component.model";
import { $, buildAndInterpolate } from "../core/dom";
import { getValue } from "../core/template";
import { BaseComponent } from "../core/types";

import { FloatingPortal } from "@/core/floating-portal";
import { hydrateIcons } from "@/core/hydrate";

export interface MenuItem {
  /** Unique identifier for the item. */
  id: string | number;
  /** Text shown in the menu. */
  label: string;
  /** Optional lucide icon name (e.g. 'settings', 'trash'). */
  icon?: string;
  /** Render a visual separator ABOVE this item. */
  separator?: boolean;
  /** When true the item is shown but cannot be activated. */
  disabled?: boolean;
  /** Callback invoked when the item is selected (click or Enter). */
  action: () => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * MenuTriggerComponent
 *
 * Wraps any HTML content and turns the element marked with
 * [data-menu-trigger] (or the first child if missing) into a
 * button that opens a floating action-menu.
 *
 * HTML usage:
 * ```html
 * <div data-component="app-menu-trigger" data-items="myMenuItems">
 *   <button data-menu-trigger>Configuración</button>
 * </div>
 * ```
 *
 * The data-items attribute must point to an array of `MenuItem`
 * objects available in the page context.
 */
export class MenuTriggerComponent extends BaseComponent {

  private items: MenuItem[] = [];
  private portal: FloatingPortal | null = null;
  private triggerEl: HTMLElement | null = null;
  private readonly handleTriggerClick = () => this.open();
  private readonly handleKeyDown = (e: KeyboardEvent) => this.onTriggerKeyDown(e);

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.items = this.resolveItems();
    this.setState({ isOpen: false });
  }

  mounted(): void {
    this.triggerEl = (
      this.element?.querySelector('[data-menu-trigger]') as HTMLElement | null
    ) ?? (this.element?.firstElementChild as HTMLElement | null);

    if (!this.triggerEl) return;

    // Make trigger keyboard-accessible if it is not already a button/anchor.
    if (!['BUTTON', 'A'].includes(this.triggerEl.tagName)) {
      this.triggerEl.setAttribute('tabindex', '0');
      this.triggerEl.setAttribute('role', 'button');
    }

    this.triggerEl.addEventListener('click', this.handleTriggerClick);
    this.triggerEl.addEventListener('keydown', this.handleKeyDown);
  }

  destroy(): void {
    this.triggerEl?.removeEventListener('click', this.handleTriggerClick);
    this.triggerEl?.removeEventListener('keydown', this.handleKeyDown);
    this.portal?.close();
    super.destroy();
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
  }

  private resolveItems(): MenuItem[] {
    const key = this.props.items;
    if (!key) return [];
    const raw = getValue(key, this.ctx);
    return Array.isArray(raw) ? (raw as MenuItem[]) : [];
  }

  open(): void {
    if (this.state.isOpen || !this.triggerEl) return;
    this.state.isOpen = true;

    const menuEl = hydrateIcons(this.buildMenu());
    this.portal = new FloatingPortal(this.triggerEl, menuEl, {
      onClose: () => this.close(),
    });
    this.portal.open();

    requestAnimationFrame(() => {
      (menuEl.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'))?.focus();
    });
  }

  close(): void {
    if (!this.state.isOpen) return;
    this.state.isOpen = false;
    this.portal?.close();
    this.portal = null;
    this.triggerEl?.focus();
  }

  private onTriggerKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.open();
    }
  }

  private buildMenu(): HTMLElement {
    const template = `
      <div 
        role="menu"
        class="p-1 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-600 shadow-xl min-w-40">
        <div data-each="item in items">
          @if(item.separator)<div class="my-1 border-t border-slate-200 dark:border-slate-700"></div> @endif
          <button role="menuitem" type="button" @if(item.disabled) disabled="disabled" aria-disabled="true"@endif
            class="
              flex items-center gap-2 w-full px-3 py-2 text-sm text-left
              text-slate-700 dark:text-slate-200 rounded-lg      
              @if(item.disabled) opacity-40 cursor-not-allowed@endif
              @if(!item.disabled) hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer @endif"
            data-index="{index}"
            >
            @if(item.icon)<i data-icon="{item.icon}" class="inline-flex size-4 shrink-0"></i>@endif
            {item.label}
          </button>
        </div>
      </div>
    `;
    const wrapper = buildAndInterpolate(template, this);
    wrapper.addEventListener('keydown', (e) => this.onMenuKeyDown(e, wrapper));
    wrapper.addEventListener('click', (e) => this.onMenuItemClick(e));    
    return wrapper;
  }

  private onMenuItemClick(e: PointerEvent ): void {
    e.preventDefault();
    const btn = (e.target as HTMLElement).closest('[role="menuitem"]') as HTMLButtonElement | null;
    if (btn && !btn.disabled ){
      const idx = Number(btn.dataset.index);
      const item = this.items[idx];
      if (item) {
        item.action();
        this.close();
      }
    }
  }

  private onMenuKeyDown(e: KeyboardEvent, wrapper: HTMLElement): void {
    const items = $('[role="menuitem"]:not([aria-disabled="true"])', wrapper).all();
    const current = document.activeElement as HTMLElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
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
    `
    return buildAndInterpolate(template, this);
  }
}
