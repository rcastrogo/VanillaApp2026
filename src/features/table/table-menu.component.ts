import type { ActionButton, Column, Identifiable } from './table.model';
import { TABLE_ACTIONS } from './table.model';

import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { FloatingPortal } from '@/core/floating-portal';
import { BaseComponent } from '@/core/types';

export class TableMenuComponent<T extends Identifiable = Identifiable> extends BaseComponent {
  // Data inputs (set by parent table)
  private columns: Column<T>[] = [];
  private visibleColumnIds = new Set<string>();
  private selectedRows = new Set<string | number>();
  private menuItems: ActionButton[] = [];
  private pageSizeValue = 10;

  // Output callbacks (bound by parent table via output pattern)
  public toggleColumn?: (colKey: string) => void;
  public actionTriggered?: (action: string) => void;

  private portal: FloatingPortal | null = null;
  private triggerEl: HTMLElement | null = null;
  private readonly handleTriggerClick = () => this.toggle();

  // Keep portal open on checkbox / select interactions
  public clickInside = (e: Event): boolean => {
    const t = e.target as HTMLElement;
    return !(
      t.tagName === 'INPUT' ||
      t.tagName === 'SELECT' ||
      t.tagName === 'OPTION' ||
      t.closest('label') !== null
    );
  };

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ isOpen: false });
  }

  mounted(): void {
    setTimeout(() => {
        if (!this.element) return;
        this.triggerEl = $('[data-menu-trigger]', this.element).one();
        if (!this.triggerEl) return;
        this.triggerEl.addEventListener('click', this.handleTriggerClick);
        this.addCleanup(() => {
        this.triggerEl?.removeEventListener('click', this.handleTriggerClick);
        });        
    }, 500);
  }

  destroy(): void {
    this.portal?.close();
    super.destroy();
  }

  /** Called by parent table once to set columns and menu items. */
  configure(options: {
    columns: Column<T>[];
    visibleColumnIds: Set<string>;
    selectedRows: Set<string | number>;
    menuItems?: ActionButton[];
    pageSize?: number;
  }): void {
    this.columns = options.columns;
    this.visibleColumnIds = new Set(options.visibleColumnIds);
    this.selectedRows = new Set(options.selectedRows);
    this.menuItems = options.menuItems ?? [];
    this.pageSizeValue = options.pageSize ?? 10;
  }

  /** Called by parent table on each state change to keep menu data fresh. */
  sync(columns: Column<T>[], visibleColumnIds: Set<string>, selectedRows: Set<string | number>, pageSize: number): void {
    this.columns = columns;
    this.visibleColumnIds = new Set(visibleColumnIds);
    this.selectedRows = new Set(selectedRows);
    this.pageSizeValue = pageSize;
    // If portal is open, refresh its content
    if (this.state.isOpen && this.portal) {
      this.portal.close();
      this.portal = null;
      this.openPortal();
    }
  }

  // ─── Toggle portal ────────────────────────────────────────────
  private toggle(): void {
    if (this.state.isOpen) this.closePortal();
    else this.openPortal();
  }

  private openPortal(): void {
    if (!this.triggerEl) return;
    const inner = this.buildMenuContent();
    const wrapper = document.createElement('div');
    wrapper.className =
      'rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[80vh]';
    wrapper.appendChild(inner);
    this.portal = new FloatingPortal(this.triggerEl, wrapper, {
      onClose: () => this.closePortal(),
      onClickInside: (e: MouseEvent) => {
        if (this.clickInside(e)) this.closePortal();
      },
    });
    this.state.isOpen = true;
    this.portal.open();
  }

  private closePortal(): void {
    if (!this.state.isOpen) return;
    this.state.isOpen = false;
    this.portal?.close();
    this.portal = null;
  }

  // ─── Event handlers (called from menu content template) ───────

  handleToggleColumn(_el: HTMLElement, _e: Event, colKey: string): void {
    const next = new Set(this.visibleColumnIds);
    if (next.has(colKey)) next.delete(colKey);
    else next.add(colKey);
    this.visibleColumnIds = next;
    this.toggleColumn?.(colKey);
    // Refresh portal content to show updated checkboxes
    if (this.portal) {
      this.portal.close();
      this.portal = null;
      this.openPortal();
    }
  }

  handleAction(_el: HTMLElement, _e: Event, action: string): void {
    this.actionTriggered?.(action);
    this.closePortal();
  }

  handlePageSize(el: HTMLSelectElement): void {
    const value = parseInt(el.value, 10);
    this.pageSizeValue = Number.isNaN(value) ? 10 : value;
    this.actionTriggered?.(`page-size:${this.pageSizeValue}`);
  }

  // ─── Build menu content ───────────────────────────────────────

  private buildMenuContent(): HTMLElement {
    const hasSelected = this.selectedRows.size > 0;

    const customButtons = this.menuItems.filter(
      b => b.show === 'menu' || b.show === 'both',
    );

    const customHtml = customButtons
      .map(btn => {
        const enabled = btn.enabledWhen ? btn.enabledWhen(this.selectedRows) : true;
        const iconHtml = btn.icon
          ? `<i data-icon="${btn.icon}" class="size-4 shrink-0"></i>`
          : '';
        return `
          <button
            on-click="handleAction:${btn.key}"
            ${!enabled ? 'disabled' : ''}
            class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition text-left rounded"
          >
            ${iconHtml}
            <span>${btn.label}</span>
          </button>
        `;
      })
      .join('');

    const columnToggles = this.columns
      .map(col => {
        const isVisible = this.visibleColumnIds.has(col.key);
        return `
          <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 transition select-none rounded">
            <input
              type="checkbox"
              on-change="handleToggleColumn:${col.key}"
              ${isVisible ? 'checked' : ''}
              class="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
            />
            <span class="text-sm">${col.title}</span>
          </label>
        `;
      })
      .join('');

    const pageSizeOptions = [5, 10, 25, 50]
      .map(
        n =>
          `<option value="${n}" ${this.pageSizeValue === n ? 'selected' : ''}>${n} filas/pág.</option>`,
      )
      .join('');

    const template = `
      <div class="min-w-[200px] py-1 text-slate-700 dark:text-slate-200">

        ${
          customHtml
            ? `
          <div class="px-1">${customHtml}</div>
          <div class="border-t my-1 dark:border-slate-700"></div>
        `
            : ''
        }

        <!-- Standard selection actions -->
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-1 pb-0.5">Selección</p>
        <div class="px-1">
          <button on-click="handleAction:${TABLE_ACTIONS.SELECT_ALL}"
            class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition text-left rounded">
            <i data-icon="check-square" class="size-4 shrink-0"></i>
            <span>Seleccionar todos</span>
          </button>
          <button on-click="handleAction:${TABLE_ACTIONS.CLEAR_ALL}"
            ${!hasSelected ? 'disabled' : ''}
            class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition text-left rounded">
            <i data-icon="square" class="size-4 shrink-0"></i>
            <span>Limpiar selección</span>
          </button>
          <button on-click="handleAction:${TABLE_ACTIONS.INVERT_SELECTION}"
            class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition text-left rounded">
            <i data-icon="shuffle" class="size-4 shrink-0"></i>
            <span>Invertir selección</span>
          </button>
          <button on-click="handleAction:${TABLE_ACTIONS.SHOW_ONLY_SELECTED}"
            ${!hasSelected ? 'disabled' : ''}
            class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition text-left rounded">
            <i data-icon="filter" class="size-4 shrink-0"></i>
            <span>Mostrar solo seleccionados</span>
          </button>
        </div>

        <div class="border-t my-1 dark:border-slate-700"></div>

        <!-- Column visibility -->
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-1 pb-0.5">Columnas</p>
        <div class="px-1">${columnToggles}</div>

        <!-- Page size -->
        <div class="border-t mt-1 dark:border-slate-700 px-3 pb-2 pt-2">
          <select on-change="handlePageSize" class="w-full text-xs border rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600">
            ${pageSizeOptions}
          </select>
        </div>

      </div>
    `;

    return buildAndInterpolate(template, this);
  }

  // ─── Render ───────────────────────────────────────────────────

  render(changedProp?: string): HTMLElement | null {
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }
    const template = `
      <div class="inline-flex" app-table-menu>
        <button
          data-menu-trigger
          class="app-button btn-ghost p-2! shrink-0"
          title="Menú de tabla"
        >
          <i data-icon="menu" class="size-4"></i>
        </button>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}

export default TableMenuComponent;
