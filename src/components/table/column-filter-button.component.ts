import type { Column, FilterCriteria, UniqueValue } from "./table.model";
import type { ComponentContext, ComponentInitValue } from "../component.model";

import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent, type Identifiable } from "@/core/types";
import { accentNumericComparer, debounce, getUniqueValues } from "@/core/utils";


export default class ColumnFilterButtonComponent extends BaseComponent {

  private rendered = false;
  private uniqueValues: UniqueValue[] = [];
  private selectedValues = new Set<string | number>();
  private searchText = '';
  private column: Column<Identifiable> | null = null;
  private data: Identifiable[] = [];
  private filter: FilterCriteria | null = null;
  private debouncedNotifyFilterChange: (searchText: string) => void;
  private filterChanged?: (key: string, searchText: string, values: Set<string | number>) => void;

  constructor(ctx: ComponentContext) {
    super(ctx);
    this.debouncedNotifyFilterChange = debounce((searchText: string) => {
      this.searchText = searchText;
      this.notifyFilterChange();
    }, 300);
  }

  init(ctx?: ComponentInitValue): void {
    super.init(ctx);
    if(this.filter) {
      this.selectedValues = new Set(this.filter.selectedValues || []);
      this.searchText = this.filter.searchText || '';
    } 
    this.setState({
      hasActiveFilter: this.isFilterActive,
    });    
  }

  public destroy(): void { /* empty */ }

  clickInside = (e: Event): boolean => {
    const t = e.target as HTMLElement;
    if(t.closest('[data-btn]')) return true;
    return false;
  };

  onOpenMenu = (): void => {
    this.uniqueValues = this.shouldShowValueList ? this.getUniqueValues() : [];
    this.updateBindings();
  }

  get shouldShowValueList(): boolean {
    return this.column?.options?.shouldShowValueList !== false;
  }

  renderUniqueValueList(el: HTMLElement){
    if (!this.shouldShowValueList) {
      el.innerHTML = '';
      return;
    }
    if(this.uniqueValues.length === 0) {
      el.innerHTML = `<div class="px-2 py-1 text-xs text-slate-600 dark:text-slate-300">No hay valores únicos</div>`;
      return;
    }
    if(this.rendered) return
    this.rendered = true;
    const template = `
      <div data-each="val in uniqueValues">
        <div          
          on-click="handleUniqueValueClick:@val.name"
          class="
            @if(val.isSelected) bg-indigo-100 dark:bg-indigo-900/50 @endif
            px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50
            dark:hover:bg-slate-700/50 
            rounded cursor-pointer truncate">
          {val.name}
        </div>
      </div>   
    `;
    const list = buildAndInterpolate(template, this);
    el.innerHTML = '';
    while (list.firstChild) {
      el.appendChild(list.firstChild);
    } 
  }

  handleMenuClick = (_el: HTMLElement, e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
  }

  handleSearchInput(el: HTMLInputElement): void {
    this.debouncedNotifyFilterChange(el.value);
  }

  handleUniqueValueClick(el: HTMLElement, _e: Event, value: string): void {
    if (this.selectedValues.has(value)) {
      this.selectedValues.delete(value);
      el.classList.remove('bg-indigo-100', 'dark:bg-indigo-900/50');
    } else {
      this.selectedValues.add(value);
      el.classList.add('bg-indigo-100', 'dark:bg-indigo-900/50');
    }
    this.notifyFilterChange();
  }

  private notifyFilterChange(): void {
    if (!this.column) return;
    this.filterChanged?.(
      this.column.key, 
      this.searchText, 
      this.selectedValues
    );
    this.state.hasActiveFilter = this.isFilterActive;
  }

  get isFilterActive(): boolean {
    return this.selectedValues?.size > 0 || this.searchText?.length > 0;
  }

  private getUniqueValues() {
    if (!this.column || !this.data.length) return [];
    const uniqueValues = getUniqueValues(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.data as any,
      this.column.accessor && typeof this.column.accessor === 'string' 
        ? this.column.accessor 
        : this.column.key
    );
    if(uniqueValues.length && typeof uniqueValues[0] === 'string') {
      uniqueValues.sort(accentNumericComparer);
    } else {
      uniqueValues.sort((a, b) => {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        if (typeof a === 'string' && typeof b === 'string') 
          return accentNumericComparer(a, b);
        return a < b ? -1 : a > b ? 1 : 0;
      });
    }
    return uniqueValues.map(val => ({
      name: String(val),
      value: val,
      isSelected: this.selectedValues.has(String(val)),
    }));
  }

  render(changedProp?: string): HTMLElement | null {  
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const template = `
      <div 
        data-component="app-popover-trigger"
        data-placement="top-end"
        (click-inside)="clickInside"
        (before-open)="onOpenMenu"
        class="inline-block">
          <button
            data-popover-trigger
            type="button"
            on-click="handleMenuClick"
            class="app-buton relative flex h-5 w-6 items-center justify-center 
            rounded-sm transition-colors hover:bg-slate-300 dark:hover:bg-slate-800">
            <i data-icon="menu" class="size-4"></i>
            <span
              data-bind="show:state.hasActiveFilter"
              class="absolute left-4.5 top-0.5 block h-1.5 w-1.5 rounded-sm bg-yellow-400">
            </span>
          </button>
          <div data-popover-content class="max-w-sm">
            <p class="
                text-xs font-semibold text-slate-400 
                uppercase tracking-wide pt-1 pb-2 text-center 
                border-b dark:border-slate-700
              ">
              Filtrar: {column.title}
            </p>
            
            <!-- Search Input -->

            <div class="">
              <input
                type="text"
                data-bind="hide:column.options.shouldShowTextBox | equal : false"
                placeholder="Buscar..."
                value="{searchText}"
                on-input="handleSearchInput"
                class="w-full px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600 
                      text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
                      focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <!-- Unique Values List -->

            @if(shouldShowValueList)
              <div class="mt-2">
                <p class="text-xs text-slate-500 dark:text-slate-400 py-1 text-center">
                  Valores únicos (<span data-bind="text:uniqueValues.length">{uniqueValues.length}</span>):
                </p>
                <div 
                  class="space-y-0 rounded-sm overflow-hidden border dark:border-slate-700">
                  <div
                    data-bind="fn:renderUniqueValueList"
                    class="max-h-40 overflow-auto space-y-1">
                    <!-- Unique values will be rendered here -->
                  </div>               
                </div>
              </div>
            @endif

          </div>
      </div>
    `;
    
    return buildAndInterpolate(template, this);
  }
}