import type { TableMenuComponent } from './table-menu.component';
import type { Column, Identifiable } from './table.model';
import { TABLE_ACTIONS } from './table.model';

import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export class TableComponent<T extends Identifiable> extends BaseComponent {
  private columns: Column<T>[] = [];
  private tableKey = 'table';
  private menuComponent: TableMenuComponent<T> | null = null;

  // Output callbacks (CRUD actions from toolbar)
  public onRefresh?: () => void;
  public onCreate?: () => void;
  public onDelete?: (ids: (string | number)[]) => void;
  public onEdit?: (id: string | number) => void;
  public onAction?: (action: string) => void;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.tableKey = this.props.key || 'table';
    this.setState({
      data: [] as T[],
      selected: new Set<string | number>(),
      currentPage: 1,
      pageSize: this.loadPageSize(),
      sortColumn: null as string | null,
      sortDirection: null as 'asc' | 'desc' | null,
      visibleColumns: new Set<string>(),
    });
  }

  // ─── Public API ───────────────────────────────────────────────

  setColumns(columns: Column<T>[]): void {
    this.columns = columns;
    const savedRaw = localStorage.getItem(this.visibleColumnsStorageKey());
    const defaultVisible = columns.filter(c => c.isVisible !== false).map(c => c.key);
    let visible: Set<string>;
    if (!savedRaw) {
      visible = new Set(defaultVisible);
    } else {
      try {
        visible = new Set(JSON.parse(savedRaw) as string[]);
      } catch {
        visible = new Set(defaultVisible);
      }
    }
    this.state.visibleColumns = visible;
    this.invalidate();
  }

  setData(rows: T[]): void {
    this.setState({
      data: rows ?? [],
      selected: new Set<string | number>(),
      currentPage: 1,
    });
  }

  // ─── Toolbar action handlers ──────────────────────────────────

  refreshData(): void {
    this.onRefresh?.();
  }

  createRow(): void {
    this.onCreate?.();
  }

  deleteRows(): void {
    const ids = Array.from(this.state.selected as Set<string | number>);
    this.onDelete?.(ids);
  }

  editRow(): void {
    const ids = Array.from(this.state.selected as Set<string | number>);
    if (ids.length === 1) this.onEdit?.(ids[0]);
  }

  // ─── Menu action handler (output from app-table-menu) ─────────

  handleMenuAction(action: string): void {
    if (action === TABLE_ACTIONS.SELECT_ALL) {
      const ids = this.getPageRows().map(r => r.id);
      this.state.selected = new Set(ids);
      return;
    }
    if (action === TABLE_ACTIONS.CLEAR_ALL) {
      this.state.selected = new Set();
      return;
    }
    if (action === TABLE_ACTIONS.INVERT_SELECTION) {
      const current = this.state.selected as Set<string | number>;
      const all = this.getPageRows().map(r => r.id);
      const next = new Set<string | number>(all.filter(id => !current.has(id)));
      this.state.selected = next;
      return;
    }
    if (action === TABLE_ACTIONS.SHOW_ONLY_SELECTED) {
      const current = this.state.selected as Set<string | number>;
      const all = this.state.data as T[];
      this.state.data = all.filter(r => current.has(r.id));
      this.state.currentPage = 1;
      return;
    }
    if (action.startsWith('page-size:')) {
      const size = parseInt(action.split(':')[1], 10);
      if (!Number.isNaN(size)) {
        this.setState({ pageSize: size, currentPage: 1 });
        this.savePageSize();
      }
      return;
    }
    this.onAction?.(action);
  }

  handleMenuToggleColumn(colKey: string): void {
    const next = new Set<string>(this.state.visibleColumns as Set<string>);
    if (next.has(colKey)) next.delete(colKey);
    else next.add(colKey);
    this.state.visibleColumns = next;
    this.saveVisibleColumns();
  }

  // ─── Table event handlers ─────────────────────────────────────

  toggleSort(_el: HTMLElement, _e: Event, columnKey: string): void {
    const col = this.columns.find(c => c.key === columnKey);
    if (!col?.sorter) return;
    const current = this.state.sortColumn as string | null;
    if (current === columnKey) {
      const dir = this.state.sortDirection as 'asc' | 'desc' | null;
      this.setState({
        sortDirection: dir === 'asc' ? 'desc' : dir === 'desc' ? null : 'asc',
        currentPage: 1,
      });
    } else {
      this.setState({ sortColumn: columnKey, sortDirection: 'asc', currentPage: 1 });
    }
  }

  firstPage(): void {
    this.state.currentPage = 1;
  }

  prevPage(): void {
    if ((this.state.currentPage as number) > 1) this.state.currentPage = (this.state.currentPage as number) - 1;
  }

  nextPage(): void {
    const total = this.getTotalPages();
    if ((this.state.currentPage as number) < total) this.state.currentPage = (this.state.currentPage as number) + 1;
  }

  lastPage(): void {
    this.state.currentPage = this.getTotalPages();
  }

  goToPage(el: HTMLInputElement): void {
    const value = parseInt(el.value || '1', 10);
    const total = this.getTotalPages();
    if (value >= 1 && value <= total) this.state.currentPage = value;
  }

  setPageSize(el: HTMLSelectElement): void {
    const value = parseInt(el.value || '10', 10);
    this.setState({ pageSize: Number.isNaN(value) ? 10 : value, currentPage: 1 });
    this.savePageSize();
  }

  toggleRow(_el: HTMLElement, _e: Event, id: string | number): void {
    const next = new Set<string | number>(this.state.selected as Set<string | number>);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.state.selected = next;
  }

  selectAll(el: HTMLInputElement): void {
    this.state.selected = el.checked
      ? new Set(this.getPageRows().map(r => r.id))
      : new Set<string | number>();
  }

  toggleColumn(_el: HTMLElement, _e: Event, columnKey: string): void {
    const next = new Set<string>(this.state.visibleColumns as Set<string>);
    if (next.has(columnKey)) next.delete(columnKey);
    else next.add(columnKey);
    this.state.visibleColumns = next;
    this.saveVisibleColumns();
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  mounted(): void {
    setTimeout(() => {
        this.menuComponent = BaseComponent.getInstance<TableMenuComponent<T>>(
        '[app-table-menu]',
        this.element || undefined,
        );
        if (this.menuComponent) {
        this.menuComponent.configure({
            columns: this.columns,
            visibleColumnIds: this.state.visibleColumns as Set<string>,
            selectedRows: this.state.selected as Set<string | number>,
            pageSize: this.state.pageSize as number,
        });
        }        
    }, 1000);

  }

  // ─── Render ───────────────────────────────────────────────────

  render(changedProp?: string): HTMLElement {
    if (changedProp && this.element) {
      this.patchStatus();
      this.rebuildHeaders();
      this.rebuildRows();
      this.patchToolbar();
      this.syncMenu();
      return this.element;
    }
    const el = buildAndInterpolate(this.buildTemplate(), this);
    // After full re-render, child components are hydrated asynchronously;
    // schedule syncMenu so the new app-table-menu instance is available.
    // setTimeout(() => this.syncMenu());
    return el;
  }

  // ─── Incremental DOM patches ──────────────────────────────────

  private patchStatus(): void {
    const el = $('[data-table-status]', this.element || undefined).one() as HTMLElement | null;
    if (el) el.innerHTML = this.buildStatusHtml();
  }

  private rebuildHeaders(): void {
    if (!this.element) return;
    const thead = this.element.querySelector('thead');
    if (!thead) return;
    const rows = this.getPageRows();
    const selected = this.state.selected as Set<string | number>;
    const allChecked = rows.length > 0 && selected.size === rows.length;
    const newThead = buildAndInterpolate(
      `<table><thead><tr>
        <th class="px-3 py-2 border-b w-10">
          <input type="checkbox" on-change="selectAll" class="cursor-pointer" ${allChecked ? 'checked' : ''} />
        </th>
        ${this.buildHeaderHtml()}
      </tr></thead></table>`,
      this,
    );
    thead.replaceWith(newThead.querySelector('thead')!);
  }

  private rebuildRows(): void {
    if (!this.element) return;
    const tbody = this.element.querySelector('tbody');
    if (!tbody) return;
    const newTable = buildAndInterpolate(
      `<table><tbody>${this.buildBodyHtml()}</tbody></table>`,
      this,
    );
    tbody.replaceWith(newTable.querySelector('tbody')!);
  }

  private patchToolbar(): void {
    if (!this.element) return;
    const currentPage = this.state.currentPage as number;
    const totalPages = this.getTotalPages();
    const selected = this.state.selected as Set<string | number>;
    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;
    const btn = (key: string) =>
      this.element!.querySelector(`[data-btn="${key}"]`) as HTMLButtonElement | null;
    btn('first')?.toggleAttribute('disabled', isFirst);
    btn('prev')?.toggleAttribute('disabled', isFirst);
    btn('next')?.toggleAttribute('disabled', isLast);
    btn('last')?.toggleAttribute('disabled', isLast);
    btn('edit')?.toggleAttribute('disabled', selected.size !== 1);
    const pageInput = this.element.querySelector('[data-page-input]') as HTMLInputElement | null;
    if (pageInput) pageInput.value = String(currentPage);
  }

  private syncMenu(): void {
    // Always re-acquire: after a full re-render the old reference is stale.
    const menu = BaseComponent.getInstance<TableMenuComponent<T>>(
      '[app-table-menu]',
      this.element || undefined,
    );
    if (!menu) return;
    this.menuComponent = menu;
    menu.sync(
      this.columns,
      this.state.visibleColumns as Set<string>,
      this.state.selected as Set<string | number>,
      this.state.pageSize as number,
    );
  }

  // ─── Template builders ────────────────────────────────────────

  private buildStatusHtml(): string {
    const totalRows = this.getSortedData().length;
    const selected = this.state.selected as Set<string | number>;
    const currentPage = this.state.currentPage as number;
    const totalPages = this.getTotalPages();
    return `${totalRows} elemento/s${selected.size ? ` (${selected.size} seleccionado/s)` : ''}<br>Página ${currentPage}/${totalPages}`;
  }

  private buildHeaderHtml(): string {
    const visibleColumnIds = this.state.visibleColumns as Set<string>;
    const sortColumn = this.state.sortColumn as string | null;
    const sortDirection = this.state.sortDirection as 'asc' | 'desc' | null;
    const visibleColumns = this.columns.filter(c => visibleColumnIds.has(c.key));
    return visibleColumns
      .map(col => {
        const sortMarker =
          sortColumn === col.key && sortDirection
            ? `<i data-icon="${sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}" class="size-3 shrink-0 ml-1"></i>`
            : '';
        const sortableClass = col.sorter
          ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700'
          : '';
        return `
          <th on-click="toggleSort:${col.key}"
            class="px-3 py-2 text-left text-sm font-semibold border-b ${sortableClass} ${col.className || ''}">
            <div class="flex items-center">
              <span>${col.title}</span>${sortMarker}
            </div>
          </th>
        `;
      })
      .join('');
  }

  private buildBodyHtml(): string {
    const visibleColumnIds = this.state.visibleColumns as Set<string>;
    const visibleColumns = this.columns.filter(c => visibleColumnIds.has(c.key));
    const rows = this.getPageRows();
    const selected = this.state.selected as Set<string | number>;
    if (!rows.length) {
      return `<tr><td colspan="999" class="px-3 py-8 text-center text-slate-500">Sin registros</td></tr>`;
    }
    return rows
      .map(row => {
        const isSelected = selected.has(row.id);
        const cells = visibleColumns
          .map(col => {
            const cell = col.cellRender
              ? col.cellRender(row, col)
              : String(this.resolveCellValue(col, row) ?? '');
            return `<td class="px-3 py-2 text-sm border-b ${col.className || ''}">${cell}</td>`;
          })
          .join('');
        return `
          <tr class="${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}">
            <td class="px-3 py-2 border-b w-10">
              <input type="checkbox" on-change="toggleRow:${row.id}" class="cursor-pointer" ${isSelected ? 'checked' : ''} />
            </td>
            ${cells}
          </tr>
        `;
      })
      .join('');
  }

  private buildTemplate(): string {
    const rows = this.getPageRows();
    const selected = this.state.selected as Set<string | number>;
    const currentPage = this.state.currentPage as number;
    const totalPages = this.getTotalPages();
    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;
    const allChecked = rows.length > 0 && selected.size === rows.length;

    // Toolbar button buttons from columns — show === 'button' || 'both'

    return `
      <div class="space-y-2" app-table>

        <!-- Toolbar -->
        <div class="w-full overflow-x-auto">
          <div class="flex items-center gap-1 w-full min-w-max px-1 py-1 rounded border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <!-- Status -->
            <span data-table-status class="hidden md:block flex-1 text-sm text-slate-600 dark:text-slate-400 px-2 whitespace-nowrap">
              ${this.buildStatusHtml()}
            </span>
            <!-- Buttons -->
            <div class="flex items-center gap-1 ml-auto">
              <button on-click="refreshData" class="app-button btn-ghost p-2! shrink-0" title="Refrescar">
                <i data-icon="refresh-ccw" class="size-4"></i>
              </button>
              <button on-click="createRow" class="app-button btn-ghost p-2! shrink-0" title="Nuevo">
                <i data-icon="plus" class="size-4"></i>
              </button>
              <button on-click="deleteRows" class="app-button btn-ghost p-2! shrink-0" title="Eliminar">
                <i data-icon="trash-2" class="size-4"></i>
              </button>
              <button data-btn="edit" on-click="editRow" ${selected.size !== 1 ? 'disabled' : ''} class="app-button btn-ghost p-2! shrink-0" title="Editar">
                <i data-icon="edit" class="size-4"></i>
              </button>
              <div class="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>
              <!-- Pagination -->
              <button data-btn="first" on-click="firstPage" ${isFirst ? 'disabled' : ''} class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevrons-left" class="size-4"></i>
              </button>
              <button data-btn="prev" on-click="prevPage" ${isFirst ? 'disabled' : ''} class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevron-left" class="size-4"></i>
              </button>
              <input
                data-page-input
                type="number"
                min="1"
                max="${totalPages}"
                value="${currentPage}"
                on-change="goToPage"
                class="w-10 h-8 text-center text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
              />
              <button data-btn="next" on-click="nextPage" ${isLast ? 'disabled' : ''} class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevron-right" class="size-4"></i>
              </button>
              <button data-btn="last" on-click="lastPage" ${isLast ? 'disabled' : ''} class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevrons-right" class="size-4"></i>
              </button>
              <div class="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>
              <!-- Table menu (child component) -->
              <div
                data-component="app-table-menu"
                (action-triggered)="handleMenuAction"
                (toggle-column)="handleMenuToggleColumn"
              ></div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto border rounded-lg dark:border-slate-700">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th class="px-3 py-2 border-b w-10">
                  <input type="checkbox" on-change="selectAll" class="cursor-pointer" ${allChecked ? 'checked' : ''} />
                </th>
                ${this.buildHeaderHtml()}
              </tr>
            </thead>
            <tbody>
              ${this.buildBodyHtml()}
            </tbody>
          </table>
        </div>

      </div>
    `;
  }

  // ─── Data utilities ───────────────────────────────────────────

  private getSortedData(): T[] {
    const rows = [...(this.state.data as T[])];
    const sortColumn = this.state.sortColumn as string | null;
    const sortDirection = this.state.sortDirection as 'asc' | 'desc' | null;
    if (!sortColumn || !sortDirection) return rows;
    const column = this.columns.find(c => c.key === sortColumn);
    if (!column?.sorter) return rows;
    return rows.sort((a, b) => {
      let result = 0;
      if (typeof column.sorter === 'function') {
        result = column.sorter(a, b);
      } else {
        const va = this.resolveCellValue(column, a);
        const vb = this.resolveCellValue(column, b);
        if (va == null && vb == null) result = 0;
        else if (va == null) result = -1;
        else if (vb == null) result = 1;
        else if (typeof va === 'string' && typeof vb === 'string') result = va.localeCompare(vb);
        else result = va! < vb! ? -1 : va! > vb! ? 1 : 0;
      }
      return sortDirection === 'asc' ? result : -result;
    });
  }

  private getTotalPages(): number {
    return Math.max(1, Math.ceil(this.getSortedData().length / (this.state.pageSize as number)));
  }

  private getPageRows(): T[] {
    const sorted = this.getSortedData();
    const page = this.state.currentPage as number;
    const size = this.state.pageSize as number;
    return sorted.slice((page - 1) * size, page * size);
  }

  private resolveCellValue(column: Column<T>, item: T): string | number | boolean | null {
    if (column.accessor) {
      if (typeof column.accessor === 'function') return column.accessor(item);
      return (item as Record<string, unknown>)[column.accessor as string] as string | number | boolean | null;
    }
    return (item as Record<string, unknown>)[column.key] as string | number | boolean | null;
  }

  private loadPageSize(): number {
    const saved = localStorage.getItem(this.pageSizeStorageKey());
    const parsed = saved ? parseInt(saved, 10) : 10;
    return Number.isNaN(parsed) ? 10 : parsed;
  }

  private savePageSize(): void {
    localStorage.setItem(this.pageSizeStorageKey(), String(this.state.pageSize));
  }

  private saveVisibleColumns(): void {
    const cols = Array.from(this.state.visibleColumns as Set<string>);
    localStorage.setItem(this.visibleColumnsStorageKey(), JSON.stringify(cols));
  }

  private pageSizeStorageKey = () => `app-table-${this.tableKey}-page-size`;
  private visibleColumnsStorageKey = () => `app-table-${this.tableKey}-visible-columns`;
}

export default TableComponent;
