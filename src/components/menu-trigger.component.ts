import type { ComponentContext, ComponentInitValue } from "./component.model";
import { $, buildAndInterpolate, setupFocusTrap } from "../core/dom";
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
  action?: () => void;
  /** Nested sub-menu items. Opens a child menu to the right. */
  children?: MenuItem[];
  /** Custom popover content. String is rendered as HTML; function returns an element. */
  popover?: string | (() => HTMLElement);
}

/**
 * MenuTriggerComponent
 *
 * Wraps any HTML content and turns the element marked with
 * [data-menu-trigger] (or the first child if missing) into a
 * button that opens a floating action-menu.
 *
 * Supports nested sub-menus (`children`) and inline popovers (`popover`).
 *
 * HTML usage:
 * ```html
 * <div data-component="app-menu-trigger" data-items="myMenuItems">
 *   <button data-menu-trigger>Configuración</button>
 * </div>
 * ```
 */
export class MenuTriggerComponent extends BaseComponent {

  private items: MenuItem[] = [];
  private portal: FloatingPortal | null = null;
  private triggerEl: HTMLElement | null = null;
  private readonly handleTriggerClick = () => this.open();
  private readonly handleKeyDown = (e: KeyboardEvent) => this.onTriggerKeyDown(e);
  /** Stack of open child portals (sub-menus / popovers) for proper cleanup. */
  private childEntries: { portal: FloatingPortal; contentEl: HTMLElement; anchorEl: HTMLElement; cleanup?: () => void }[] = [];

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

    if (!['BUTTON', 'A'].includes(this.triggerEl.tagName)) {
      this.triggerEl.setAttribute('tabindex', '0');
      this.triggerEl.setAttribute('role', 'button');
    }

    this.triggerEl.addEventListener('click', this.handleTriggerClick);
    this.triggerEl.addEventListener('keydown', this.handleKeyDown);
    this.addCleanup(() => {
      this.triggerEl?.removeEventListener('click', this.handleTriggerClick);
      this.triggerEl?.removeEventListener('keydown', this.handleKeyDown);
    });
  }

  destroy(): void {
    this.closeAllChildren();
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

    const menuEl = hydrateIcons(this.buildMenu(this.items));
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
    this.closeAllChildren();
    this.portal?.close();
    this.portal = null;
    this.triggerEl?.focus();
  }

  private closeAllChildren(): void {
    this.closeChildrenFrom(0);
  }

  /** Close child portals from the given index onwards, unregistering them from ancestors. */
  private closeChildrenFrom(startIndex: number): void {
    const toClose = this.childEntries.splice(startIndex);
    for (const { portal, contentEl, anchorEl, cleanup } of toClose) {
      cleanup?.();
      this.portal?.removeAssociatedElement(contentEl);
      for (const entry of this.childEntries) {
        entry.portal.removeAssociatedElement(contentEl);
      }
      anchorEl.setAttribute('aria-expanded', 'false');
      portal.close();
    }
  }

  /** Tell all ancestor portals (root + existing children) about a new child element. */
  private registerChildElement(contentEl: HTMLElement): void {
    this.portal?.addAssociatedElement(contentEl);
    for (const entry of this.childEntries) {
      entry.portal.addAssociatedElement(contentEl);
    }
  }

  private onTriggerKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.open();
    }
  }

  /* ──────────────────────────────── Menu builder ──────────── */

  private buildMenu(items: MenuItem[]): HTMLElement {
    const menuEl = document.createElement('div');
    menuEl.setAttribute('role', 'menu');
    menuEl.className = 'p-1 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-600 shadow-xl min-w-44';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'my-1 border-t border-slate-200 dark:border-slate-700';
        menuEl.appendChild(sep);
      }

      const btn = document.createElement('button');
      btn.setAttribute('role', 'menuitem');
      btn.type = 'button';
      btn.dataset.index = String(i);

      const hasSubmenu = !!(item.children && item.children.length);
      const hasPopover = !!item.popover;

      if (item.disabled) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      if (hasSubmenu) {
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }

      btn.className = [
        'flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-lg',
        'text-slate-700 dark:text-slate-200',
        item.disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer',
      ].join(' ');

      if (item.icon) {
        const icon = document.createElement('i');
        icon.setAttribute('data-icon', item.icon);
        icon.className = 'inline-flex size-4 shrink-0';
        btn.appendChild(icon);
      }

      const labelSpan = document.createElement('span');
      labelSpan.className = 'flex-1';
      labelSpan.textContent = item.label;
      btn.appendChild(labelSpan);

      if (hasSubmenu) {
        const chevron = document.createElement('i');
        chevron.setAttribute('data-icon', 'chevron-right');
        chevron.className = 'inline-flex size-3.5 shrink-0 opacity-50';
        btn.appendChild(chevron);
      } else if (hasPopover) {
        const indicator = document.createElement('i');
        indicator.setAttribute('data-icon', 'more-horizontal');
        indicator.className = 'inline-flex size-3.5 shrink-0 opacity-50';
        btn.appendChild(indicator);
      }

      menuEl.appendChild(btn);
    }

    hydrateIcons(menuEl);

    menuEl.addEventListener('keydown', (e) => this.onMenuKeyDown(e, menuEl, items));
    menuEl.addEventListener('click', (e) => this.onMenuItemClick(e, items));

    return menuEl;
  }

  /* ──────────────────────── Item click / activation ───────── */

  private onMenuItemClick(e: Event, items: MenuItem[]): void {
    e.preventDefault();
    const btn = (e.target as HTMLElement).closest('[role="menuitem"]') as HTMLButtonElement | null;
    if (!btn || btn.disabled) return;

    const idx = Number(btn.dataset.index);
    const item = items[idx];
    if (!item) return;

    if (item.children?.length) {
      this.openSubmenu(btn, item.children);
      return;
    }
    if (item.popover) {
      this.openItemPopover(btn, item);
      return;
    }
    item.action?.();
    this.close();
  }

  /* ──────────────────────── Sub-menu logic ────────────────── */

  private openSubmenu(anchorBtn: HTMLElement, children: MenuItem[]): void {
    // Find the parent level: which existing child contains this anchor?
    const parentIndex = this.childEntries.findIndex(({ contentEl }) => contentEl.contains(anchorBtn));
    // Close only portals deeper than the parent (keep ancestors intact)
    this.closeChildrenFrom(parentIndex + 1);

    anchorBtn.setAttribute('aria-expanded', 'true');

    const subMenu = this.buildMenu(children);

    // Register with all ancestors BEFORE opening so their click-outside ignores it
    this.registerChildElement(subMenu);

    const subPortal = new FloatingPortal(anchorBtn, subMenu, {
      placement: 'right-start',
      offset: 2,
      onClose: () => {
        const idx = this.childEntries.findIndex(e => e.portal === subPortal);
        if (idx !== -1) this.closeChildrenFrom(idx);
      },
    });
    this.childEntries.push({ portal: subPortal, contentEl: subMenu, anchorEl: anchorBtn });
    subPortal.open();

    requestAnimationFrame(() => {
      (subMenu.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'))?.focus();
    });
  }

  /* ──────────────────────── Popover logic ─────────────────── */

  private openItemPopover(anchorBtn: HTMLElement, item: MenuItem): void {
    const parentIndex = this.childEntries.findIndex(({ contentEl }) => contentEl.contains(anchorBtn));
    this.closeChildrenFrom(parentIndex + 1);

    let content: HTMLElement;
    if (typeof item.popover === 'function') {
      content = item.popover();
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'p-4 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl min-w-56 max-w-sm';
      wrapper.innerHTML = item.popover!;
      content = wrapper;
    }

    this.registerChildElement(content);

    const popPortal = new FloatingPortal(anchorBtn, content, {
      placement: 'right-start',
      offset: 4,
      onClose: () => {
        const idx = this.childEntries.findIndex(e => e.portal === popPortal);
        if (idx !== -1) this.closeChildrenFrom(idx);
      },
    });
    this.childEntries.push({ portal: popPortal, contentEl: content, anchorEl: anchorBtn });
    popPortal.open();

    // Keyboard handling: trap focus inside the popover and handle Escape
    content.setAttribute('tabindex', '-1');
    const onPopoverKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        const idx = this.childEntries.findIndex(entry => entry.portal === popPortal);
        if (idx !== -1) {
          const { anchorEl } = this.childEntries[idx];
          this.closeChildrenFrom(idx);
          anchorEl?.focus();
        }
      }
    };
    content.addEventListener('keydown', onPopoverKeyDown);

    requestAnimationFrame(() => {
      const releaseTrap = setupFocusTrap(content);
      if (!content.contains(document.activeElement)) {
        content.focus();
      }
      const entryIdx = this.childEntries.findIndex(entry => entry.portal === popPortal);
      if (entryIdx !== -1) {
        this.childEntries[entryIdx].cleanup = () => {
          content.removeEventListener('keydown', onPopoverKeyDown);
          releaseTrap?.();
        };
      }
    });
  }

  /* ──────────────────────── Keyboard navigation ──────────── */

  private onMenuKeyDown(e: KeyboardEvent, wrapper: HTMLElement, items: MenuItem[]): void {
    const focusable = $('[role="menuitem"]:not([aria-disabled="true"])', wrapper).all();
    const current = document.activeElement as HTMLElement;
    const idx = focusable.indexOf(current);

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusable[(idx + 1) % focusable.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
        break;
      case 'ArrowRight': {
        e.preventDefault();
        const itemIdx = Number(current?.dataset?.index);
        const item = items[itemIdx];
        if (item?.children?.length) {
          this.openSubmenu(current, item.children);
        } else if (item?.popover) {
          this.openItemPopover(current, item);
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const lvl = this.childEntries.findIndex(({ contentEl }) => contentEl === wrapper);
        if (lvl !== -1) {
          const { anchorEl } = this.childEntries[lvl];
          this.closeChildrenFrom(lvl);
          anchorEl?.focus();
        }
        break;
      }
      case 'Home':
        e.preventDefault();
        focusable[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        focusable[focusable.length - 1]?.focus();
        break;
      case 'Escape': {
        e.preventDefault();
        const escLvl = this.childEntries.findIndex(({ contentEl }) => contentEl === wrapper);
        if (escLvl !== -1) {
          const { anchorEl } = this.childEntries[escLvl];
          this.closeChildrenFrom(escLvl);
          anchorEl?.focus();
        } else {
          this.close();
        }
        break;
      }
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
