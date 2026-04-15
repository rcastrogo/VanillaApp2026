import type { ComponentContext, ComponentInitValue } from "./component.model";
import { $, build, buildAndInterpolate } from "../core/dom";
import { getValue } from "../core/template";
import { BaseComponent } from "../core/types";

import { FloatingPortal } from "@/core/floating-portal";

interface ComboItem {
  id: string | number;
  label: string;
}

export class ComboBoxComponent extends BaseComponent {

  public selected?: (item: ComboItem) => void;
  public customRender?: (item: ComboItem) => HTMLElement;

  private items: ComboItem[] = [];
  private highlightIndex = -1;
  private liItems: HTMLButtonElement[] = [];
  private portal: FloatingPortal | null = null;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  private normalizeItems(raw: unknown[]): ComboItem[] {
    return (raw ?? []).map((item, i) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: item, label: String(item) };
      }
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const id = obj['id'] ?? obj['code'] ?? obj['value'] ?? i;
        const label = obj['label'] ?? obj['name'] ?? obj['description'] ?? String(id);
        return { id: id as string | number, label: String(label) };
      }
      return { id: i, label: String(item) };
    });
  }

  private resolveDataSource(): ComboItem[] {
    const key = this.props.items;
    if (!key) return [];
    const raw = getValue(key, this.ctx);
    return Array.isArray(raw) ? this.normalizeItems(raw) : [];
  }

  setDataSource(items: unknown[]) {
    this.items = this.normalizeItems(items);
    this.highlightIndex = -1;
    this.setState({
      isOpen: false,
      selectedLabel: '',
      selectedId: '',
    });
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.items = this.resolveDataSource();
    this.setState({
      isOpen: false,
      selectedLabel: '',
      selectedId: '',
    });
  }

  toggleOpen() {
    const selId = this.state.selectedId;
    this.highlightIndex = selId !== '' ? this.items.findIndex(it => String(it.id) === selId) : -1;
    this.state.isOpen = !this.state.isOpen;
  }

  selectOption(_el: HTMLElement, _ev: Event, index: string) {
    const idx = Number(index);
    const item = this.items[idx];
    if (!item) return;
    this.highlightIndex = -1;
    this.setState({
      selectedLabel: item.label,  
      selectedId: String(item.id),
      isOpen: false,
    });
    requestAnimationFrame(() => {
      const input = $('input[type="text"]', this.element).one();
      input?.focus();
    });
    this.selected?.({ id: item.id, label: item.label });
  }

  handleKeyDown(_el: HTMLElement, ev: KeyboardEvent) {
    const key = ev.key;
    const isOpen = this.state.isOpen;
    const len = this.items.length;

    if (!isOpen) {
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown') {
        ev.preventDefault();
        this.state.isOpen = true;
        this.highlightIndex = 0;
        return;
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        ev.preventDefault();
        this.highlightIndex = (this.highlightIndex + 1) % len;
        this.applyHighlight();
        break;
      case 'ArrowUp':
        ev.preventDefault();
        this.highlightIndex = (this.highlightIndex - 1 + len) % len;
        this.applyHighlight();
        break;
      case 'Home':
      case 'PageUp':
        ev.preventDefault();
        this.highlightIndex = 0;
        this.applyHighlight();
        break;
      case 'End':
      case 'PageDown':
        ev.preventDefault();
        this.highlightIndex = len - 1;
        this.applyHighlight();
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        if (this.highlightIndex >= 0) {
          const item = this.items[this.highlightIndex];
          this.setState({
            isOpen: false,
            selectedLabel: item.label,  
            selectedId: String(item.id),
          });
          this.highlightIndex = -1;
        }
        break;
      case 'Escape':
        ev.preventDefault();
        this.state.isOpen = false;
        this.highlightIndex = -1;
        break;
    }
  }

  private scrollToHighlighted() {
    if (this.element && this.liItems){
      const target = this.liItems[this.highlightIndex];
      target?.scrollIntoView({ block: 'nearest' });     
    }
  }

  private applyHighlight() {
    if (this.element && this.liItems) {
      this.liItems.forEach((el, i) => {
        el.classList.toggle('bg-indigo-100', i === this.highlightIndex);
        el.classList.toggle('dark:bg-indigo-900', i === this.highlightIndex);
      });
      this.scrollToHighlighted();
    }
  }

  render(changedProp?: string): HTMLElement | null {

    if (this.state.isOpen) {
      this.initFloatingList();
    } else {
      this.portal?.close();
      this.portal = null;
    }

    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }

    const placeholder = this.props.placeholder ?? 'Seleccione…';
    const template = `
      <div class="relative">
        <input
          type="text"
          readonly
          data-bind="value:state.selectedLabel"
          on-click="toggleOpen"
          on-keydown="handleKeyDown"
          placeholder="${placeholder}"
          class="
            w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm
            text-slate-700 caret-transparent select-none
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200
          "
        />
        <span data-bind="hide:state.isOpen">
          <i data-icon="chevron-down" 
            class="absolute right-3 top-5 -translate-y-1/2 size-5 pointer-events-none text-slate-400"
            ></i>        
        </span>
        <span data-bind="show:state.isOpen">
          <i data-icon="chevron-up" 
            class="absolute right-3 top-5 -translate-y-1/2 size-5 pointer-events-none text-slate-400"
            ></i>        
        </span>
        <input type="hidden" data-bind="value:state.selectedId" name="${this.props.name ?? 'combo'}" />
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  private renderList(el: HTMLElement) {
    if (!this.element) return;
    const listTemplate = `
      <div
        class="max-h-30 overflow-auto">
          <ul data-each="item in items" class="text-left">
            <li>
              <button type="button"
                class="px-3 py-2 text-sm w-full text-left
                text-slate-700 hover:bg-indigo-50 
                dark:text-slate-200 dark:hover:bg-indigo-900/40"
                data-combo-idx="{item.index}"
                on-click="selectOption:@index">
                  @if(!customRender){item.label}@endif
                  @if(customRender){item | customRender}@endif
                </button>
            </li>
          </ul>          
        </div>
      </div>
    `;
    const div = buildAndInterpolate(listTemplate, this);
    this.liItems = $<HTMLButtonElement>('[data-combo-idx]', div).all();   
    el.appendChild(div);

    this.applyHighlight();
  }

  private initFloatingList() {
    if (this.portal) return;
    const listElement = build('div', { 
      className: "overflow-auto rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-600 shadow-xl" 
    });
    this.renderList(listElement);
    this.portal = new FloatingPortal(this.element!, listElement, {
      onClose: () => this.state.isOpen = false
    });
    this.portal.open();
  }

  destroy() {
    this.portal?.close();
    super.destroy();
  }

}
