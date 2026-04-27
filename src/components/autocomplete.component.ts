
import type { ComponentContext, ComponentInitValue } from "./component.model";

import { $, buildAndInterpolate } from "@/core/dom";
import { FloatingPortal } from "@/core/floating-portal";
import { BaseComponent } from "@/core/types";
import { debounce } from "@/core/utils";

export interface AutocompleteItem {
  id: string | number;
  label: string;
  raw?: unknown;
}

export class AutocompleteComponent extends BaseComponent {

  public selected?: (item: AutocompleteItem) => void;
  public customRender?: (item: AutocompleteItem) => string | HTMLElement;
  public dataProvider?: (query: string) => Promise<AutocompleteItem[]>;

  private items: AutocompleteItem[] = [];
  private highlightIndex = -1;
  private listEl: HTMLElement | null = null;
  private portal: FloatingPortal | null = null;
  private debouncedSearch!: (value: string) => void;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({
      selectedId: '',
      selectedLabel: '',
    });
    const delay = Number(this.props.delayMs ?? 300);
    this.debouncedSearch = debounce((value: string) => this.search(value), delay);
  }

  /* ──────────────── Input / search ──────────────── */
  onInput(el: HTMLInputElement) {
    const value = (el as HTMLInputElement).value.trim();
    const min = Number(this.props.minLength ?? 2);

    if (value.length < min) {
      this.close();
      return;
    }
    this.debouncedSearch(value);
  }

  private async search(term: string) {
    if(this.dataProvider){
      try {
        this.items = await this.dataProvider(term);
      } catch (error) {
        console.error('Error en dataProvider:', error);
        this.items = [];
      }
      if (this.items.length === 0) {
        this.close();
        return;
      }
    }
    this.highlightIndex = -1;
    this.updateList();
  }

  /* ──────────────── Selection ──────────────── */

  private selectByTarget(el:HTMLElement){
    const idx = el.getAttribute('data-idx');
    if(idx){
      this.selectByIndex(Number(idx));
    } 
  }

  private selectByIndex(index: number) {
    const item = this.items[index];
    if (!item) return;

    this.setState({
      selectedId: item.id,
      selectedLabel: item.label,
    });
    this.selected?.(item);
    this.close();
  }

  /* ──────────────── Keyboard ──────────────── */

  handleKeyDown(el: HTMLElement, ev: KeyboardEvent) {
    const term = (el as HTMLInputElement).value.trim();

    if(ev.key === 'ArrowDown' && !this.portal){
      this.debouncedSearch(term);
      return;
    }

    if (!this.portal) return;

    const len = this.items.length;
    if (len === 0) return;

    switch (ev.key) {
      case 'Tab':
        this.close();
        break;
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
      case 'Enter':
        ev.preventDefault();
        if (this.highlightIndex >= 0) {
          this.selectByIndex(this.highlightIndex);
        }
        break;
      case 'Escape':
        ev.preventDefault();
        this.close();
        break;
    }
  }

  /* ──────────────── Render ──────────────── */

  render(changed?: string): HTMLElement | null {
    if (changed && this.element) {
      this.updateBindings();
      return this.element;
    }

    const template = `
      <div class="relative">
        <input
          type="text"
          on-input="onInput"
          on-focus="onInput"
          on-keydown="handleKeyDown"
          data-bind="value:state.selectedLabel"
          placeholder="${this.props?.placeholder ?? 'Buscar…'}"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600 
                 bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autocomplete="off"
        />
        <input type="hidden"
          name="${this.props?.name ?? 'autocomplete'}"
          data-bind="value:state.selectedId"
        />
      </div>
    `;
    return buildAndInterpolate(template, this);
  }

  /* ──────────────── Floating list ──────────────── */

  private open() {
    if (this.portal || !this.element) return;

    this.listEl = document.createElement('div');
    this.listEl.className = 'rounded-lg border border-slate-200 dark:border-slate-600 shadow-xl bg-white dark:bg-slate-800 overflow-hidden';
    this.listEl.setAttribute('role', 'listbox');

    this.portal = new FloatingPortal(this.element, this.listEl, {
      onClose: () => this.close(),
    });
    this.portal.open();
  }

  private updateList() {
    if (!this.portal) this.open();
    if (!this.listEl) return;

    this.listEl.innerHTML = '';
    const listTemplate = `
      <div class="p-2 text-sm text-slate-500 overflow-auto max-h-60">
        <div class="px-2 border-b">{items.length} resultado@if(items.length > 1)s@endif</div>
        <div data-each="item in items">
          <button 
            type="button" 
            role="option" 
            data-idx="{index}"
            on-click="selectByTarget"
            class="
              flex items-center gap-2 w-full px-3 py-2 text-sm text-left
            text-slate-700 dark:text-slate-200 hover:bg-indigo-50 
            dark:hover:bg-indigo-900/40 cursor-pointer
            ">        
              {item.label}
          </button>
        </div>
      </div>
    `;
    const rendered = buildAndInterpolate(listTemplate, {items: this.items, selectByTarget: this.selectByTarget});
    if(this.customRender){
      const buttons = $('[role="option"]', rendered).all();
      buttons.forEach((btn, i) => {
        const item = this.items[i];
        const customContent = this.customRender!(item); 
        if(typeof customContent === 'string'){
          btn.innerHTML = customContent;
        } else {
          btn.innerHTML = '';
          btn.appendChild(customContent);
        } 
      });
    }
    this.listEl.appendChild(rendered);
    this.applyHighlight();
  }

  private applyHighlight() {
    if (!this.listEl) return;
    const buttons = $<HTMLButtonElement>('[role="option"]', this.listEl).all();
    buttons.forEach((el, i) => {
      el.classList.toggle('bg-indigo-100', i === this.highlightIndex);
      el.classList.toggle('dark:bg-indigo-900/60', i === this.highlightIndex);
      if (i === this.highlightIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  private close() {
    this.portal?.close();
    this.portal = null;
    this.listEl = null;
    this.highlightIndex = -1;
    this.items = [];
  }

  destroy() {
    this.close();
    super.destroy();
  }
}
