

import type { ActionButton, Column } from './table.model';
import { TABLE_ACTIONS } from './table.model';

import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { storage } from '@/core/storageUtil';
import { BaseComponent, type Identifiable } from '@/core/types';

export class TableComponent<T extends Identifiable> extends BaseComponent {

  private data: T[] = [];
  private actions: ActionButton[] = [];
  private columns: Column<T>[] = [];
  private tableKey = 'table';
  private readonly pageSizeOptions = [5, 10, 25, 50];
  private sortedData: T[] = [];
  private sortDirty = true;

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
      data: this.data || [] as T[],
      actions: this.actions || [] as ActionButton[],
      columns: this.columns || [] as Column<T>[],
      selected: new Set<string | number>(),
      currentPage: 1,
      pageSize: this.loadPageSize(),
      sortColumn: null as string | null,
      sortDirection: null as 'asc' | 'desc' | null,
      visibleColumns: new Set<string>(),
    });
    this.initColumns();
  }

  private initColumns(): void {
    const columns = this.state.columns as Column<T>[];
    const defaultVisible = columns.filter(c => c.isVisible !== false).map(c => c.key);
    const savedVisibleColumns = storage.readValue<string[]>(this.visibleColumnsStorageKey(), defaultVisible);
    const visible = new Set(Array.isArray(savedVisibleColumns) ? savedVisibleColumns : defaultVisible);
    this.setState({ 
      visibleColumns: visible,
      columns: columns.map(col => ({ ...col, isVisible: visible.has(col.key) })),
    });
    this.invalidateSort();
  }

  setColumns(columns: Column<T>[]): void {
    this.setState({ columns }, false);
    this.initColumns();
  }

  setData(rows: T[]): void {
    this.setState({
      data: rows ?? [],
      selected: new Set<string | number>(),
      currentPage: 1,
    });
    this.invalidateSort();
  }

  // ─── Toolbar action handlers ──────────────────────────────────

  refreshData(): void { this.onRefresh?.(); }

  createRow(): void { this.onCreate?.(); }

  deleteRows(): void {
    const ids = Array.from(this.state.selected as Set<string | number>);
    this.onDelete?.(ids);
  }

  editRow(): void {
    const ids = Array.from(this.state.selected as Set<string | number>);
    if (ids.length === 1) this.onEdit?.(ids[0]);
  }

  handleMenuAction(action: string): void {
    const data = this.state.data as T[];
    if (action === TABLE_ACTIONS.SELECT_ALL) {
      const ids = data.map(r => r.id);
      this.state.selected = new Set(ids);
      return;
    }
    if (action === TABLE_ACTIONS.CLEAR_ALL) {
      this.state.selected = new Set();
      return;
    }
    if (action === TABLE_ACTIONS.INVERT_SELECTION) {
      const current = this.state.selected as Set<string | number>;
      const all = data.map(r => r.id);
      const next = new Set<string | number>(all.filter(id => !current.has(id)));
      this.state.selected = next;
      return;
    }
    if (action === TABLE_ACTIONS.SHOW_ONLY_SELECTED) {
      const current = this.state.selected as Set<string | number>;
      this.setState({
        data: data.filter(r => current.has(r.id)),
        currentPage: 1,
      });
      this.invalidateSort();
      return;
    }
    if (action.startsWith('page-size-')) {
      const size = parseInt(action.split('-')[2], 10);
      if (!Number.isNaN(size)) {
        this.setState({ pageSize: size, currentPage: 1 });
        this.savePageSize();
      }
      return;
    }
    this.onAction?.(action);
  }

  handleToggleColumn(_el: HTMLElement, _e: Event, colKey: string): void {
    const next = new Set<string>(this.state.visibleColumns as Set<string>);
    if (next.has(colKey)) next.delete(colKey);
    else next.add(colKey);
    this.setState({ 
      visibleColumns: next,
      columns: (this.state.columns as Column<T>[] ).map(col => ({ ...col, isVisible: next.has(col.key) })),
    });
    this.saveVisibleColumns();
  }

  handleAction(_el: HTMLElement, _e: Event, actionKey: string): void {
    const actions = this.state.actions as ActionButton[];
    const action = actions.find(a => a.key === actionKey);
    if (action?.onClick) {
      action.onClick();
      return; 
    }
    this.handleMenuAction(actionKey);
  }

  handlePageSize(el: HTMLSelectElement, _e: Event, pageSize: string): void {
    Array
      .from(el.parentNode!.children)
      .forEach(el => {
        el.classList.remove('bg-slate-200', 'dark:bg-slate-600/50');
    });
    el.classList.add('bg-slate-200', 'dark:bg-slate-600/50');    
    this.handleMenuAction('page-size-' + parseInt(pageSize, 10));    
  }

  toggleSort(_el: HTMLElement, _e: Event, columnKey: string): void {
    const columns = this.state.columns as Column<T>[];
    const col = columns.find(c => c.key === columnKey);
    if (!col?.sorter) return;
    const current = this.state.sortColumn as string | null;
    if (current === columnKey) {
      const dir = this.state.sortDirection as 'asc' | 'desc' | null;
      this.setState({
        sortDirection: dir === 'asc' ? 'desc' : dir === 'desc' ? null : 'asc',
        currentPage: 1,
      });
    } else {
      this.setState({ 
        sortColumn: columnKey, 
        sortDirection: 'asc', 
        currentPage: 1 
      });
    }
    this.invalidateSort();    
  }

  firstPage(): void { this.state.currentPage = 1; }
  lastPage(): void { this.state.currentPage = this.getTotalPages(); }

  prevPage(): void {
    if ((this.state.currentPage as number) > 1) this.state.currentPage = (this.state.currentPage as number) - 1;
  }

  nextPage(): void {
    const total = this.getTotalPages();
    if ((this.state.currentPage as number) < total) this.state.currentPage = (this.state.currentPage as number) + 1;
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
    const data = this.state.data as T[];
    this.state.selected = el.checked
      ? new Set(data.map(r => r.id))
      : new Set<string | number>();
  }

  toggleColumn(_el: HTMLElement, _e: Event, columnKey: string): void {
    const next = new Set<string>(this.state.visibleColumns as Set<string>);
    if (next.has(columnKey)) next.delete(columnKey);
    else next.add(columnKey);
    this.setState({ 
      visibleColumns: next,
      columns: (this.state.columns as Column<T>[] ).map(col => ({ ...col, isVisible: next.has(col.key) })),
    });
    this.saveVisibleColumns();
  }

  render(changedProp?: string): HTMLElement {
    if (changedProp && this.element) {
      this.patchStatus();
      this.rebuildHeaders();
      this.rebuildRows();
      this.patchToolbar();
      this.updateBindings();
      return this.element;
    }
    requestAnimationFrame(() => this.setState({}));
    return buildAndInterpolate(this.buildTemplate(), this);
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
    const data = this.state.data as T[];
    const selected = this.state.selected as Set<string | number>;
    const allChecked = data.length > 0 && selected.size === data.length;
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
    const btn = (key: string) => this.element!.querySelector(`[data-btn="${key}"]`) as HTMLButtonElement | null;
    btn('first')?.toggleAttribute('disabled', isFirst);
    btn('prev')?.toggleAttribute('disabled', isFirst);
    btn('next')?.toggleAttribute('disabled', isLast);
    btn('last')?.toggleAttribute('disabled', isLast);
    btn('edit')?.toggleAttribute('disabled', selected.size !== 1);
    btn('delete')?.toggleAttribute('disabled', selected.size === 0);
    for (const action of this.state.actions as ActionButton[]) {
      if (action.show === 'button' || action.show === 'both') {
        btn(action.key)?.toggleAttribute('disabled', action.enabledWhen ? !action.enabledWhen(selected) : false);
      }
    }
    const pageInput = this.element.querySelector('[data-page-input]') as HTMLInputElement | null;
    if (pageInput) pageInput.value = String(currentPage);
  }

  clickInside = (e: Event): boolean => {
    const t = e.target as HTMLElement;
    if(t.closest('[data-btn]')) return true;
    // console.log('clickInside', t.tagName);
    return false;
  };

  onOpenMenu = (el: HTMLElement): void => {

    const rows = this.state.data as T[];
    const selected = this.state.selected as Set<string | number>;  
    const buttons = $('[data-btn]', el).all();
    const actions = this.state.actions as ActionButton[];

    buttons.forEach(btn => {
      const key = btn.getAttribute('data-btn');
      if (key === 'select-all') {
        btn.toggleAttribute('disabled', rows.length === 0 || selected.size === rows.length);
      } else if (key === 'clear-all') {
        btn.toggleAttribute('disabled', selected.size === 0);
      } else if (key === 'invert-selection') {  
        btn.toggleAttribute('disabled', selected.size === 0 || selected.size === rows.length);
      } else if (key === 'show-only-selected') {
        btn.toggleAttribute('disabled', selected.size === 0 || selected.size === rows.length);
      } else if (key && key.startsWith('page-size-')) {
        const size = parseInt(key.split('-')[2], 10);
        if(size === this.state.pageSize)
          btn.classList.add('bg-slate-200', 'dark:bg-slate-600/50');
        else
          btn.classList.remove('bg-slate-200', 'dark:bg-slate-600/50');
      }
      else {
        const action = actions.find(a => a.key === key);
        if (action) {          
          btn.toggleAttribute('disabled', action.enabledWhen ? !action.enabledWhen(selected) : false);
        }      
      }
    });
  }

  // ─── Template builders ────────────────────────────────────────

  private buildStatusHtml(): string {
    const data = this.state.data as T[];
    const totalRows = data.length;
    const selected = this.state.selected as Set<string | number>;
    const currentPage = this.state.currentPage as number;
    const totalPages = this.getTotalPages();
    return `${totalRows} elemento/s${selected.size ? ` (${selected.size} seleccionado/s)` : ''}<br>Página ${currentPage}/${totalPages}`;
  }

  private buildHeaderHtml(): string {
    const columns = this.state.columns as Column<T>[];
    const visibleColumnIds = this.state.visibleColumns as Set<string>;
    const sortColumn = this.state.sortColumn as string | null;
    const sortDirection = this.state.sortDirection as 'asc' | 'desc' | null;
    const visibleColumns = columns.filter(c => visibleColumnIds.has(c.key));
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
    const columns = this.state.columns as Column<T>[];
    const visibleColumnIds = this.state.visibleColumns as Set<string>;
    const visibleColumns = columns.filter(c => visibleColumnIds.has(c.key));
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

    return `
      <div class="space-y-2" app-table>

        <!-- Toolbar -->
        <div class="w-full overflow-x-auto">
          <div class="flex items-center gap-1 w-full min-w-max px-1 py-1 rounded border bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <!-- Status -->
            <span data-table-status class="hidden md:block flex-1 text-sm text-slate-600 dark:text-slate-400 px-2 whitespace-nowrap">
              
            </span>

            <!-- Buttons -->
            <div class="flex items-center gap-1 ml-auto">

              <!-- CRUD action buttons -->

              <button 
                data-btn="refresh" on-click="refreshData" class="app-button btn-ghost p-2! shrink-0" title="Refrescar">
                <i data-icon="refresh-ccw" class="size-4"></i>
              </button>
              <button data-btn="create" on-click="createRow" class="app-button btn-ghost p-2! shrink-0" title="Nuevo">
                <i data-icon="plus" class="size-4"></i>
              </button>
              <button disabled
                data-btn="delete" 
                on-click="deleteRows" 
                class="app-button btn-ghost p-2! shrink-0" title="Eliminar">
                <i data-icon="trash-2" class="size-4"></i>
              </button>
              <button disabled
                data-btn="edit" 
                on-click="editRow" class="app-button btn-ghost p-2! shrink-0" title="Editar">
                <i data-icon="edit" class="size-4"></i>
              </button>

              <!-- Custom action buttons -->

              @if(state.actions.length > 0)
                <div class="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>
              @endif
              <div class="contents" data-each="action in state.actions">
                @if(action.show === 'button' || action.show === 'both')
                  <button disabled
                    data-btn="{action.key}"
                    on-click="handleAction:@action.key"
                    class="app-button btn-ghost p-2! shrink-0"
                    title="{action.label}"
                  >
                    @if(action.icon)
                      <i data-icon="{action.icon}" class="size-4 shrink-0"></i>
                    @endif
                    @if(!action.icon)
                      {action.label}
                    @endif
                  </button>
                @endif
              </div>

              <!-- Pagination -->

              <div class="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>              
              <button disabled data-btn="first" on-click="firstPage" class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevrons-left" class="size-4"></i>
              </button>
              <button disabled data-btn="prev" on-click="prevPage" class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevron-left" class="size-4"></i>
              </button>
              <input disabled
                data-page-input
                value="1"
                on-change="goToPage"
                class="w-10 h-8 text-center text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
              />
              <button disabled data-btn="next" on-click="nextPage" class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevron-right" class="size-4"></i>
              </button>
              <button disabled data-btn="last" on-click="lastPage" class="app-button btn-ghost p-2! shrink-0">
                <i data-icon="chevrons-right" class="size-4"></i>
              </button>

              <!-- Menu trigger -->

              <div class="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>
              <div 
                data-component="app-popover-trigger"
                data-placement="top-end"
                (click-inside)="clickInside"
                (before-open)="onOpenMenu"
                class="mb-1">
                <button data-popover-trigger class="app-button px-2! btn-ghost shrink-0" title="Más opciones">
                  <i data-icon="menu" class="size-4"></i>
                </button>
                <div data-popover-content class="max-w-xs">

                  <!-- Custom action buttons -->
                  @if(state.actions.length > 0)
                    <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-1 pb-0.5">Acciones</p>
                  @endif
                  <div class="px-1 contents" data-each="action in state.actions">
                    @if(action.show === 'menu' || action.show === 'both')
                      <button disabled
                        data-btn="{action.key}"
                        on-click="handleAction:@action.key"
                        class="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 
                        disabled:opacity-40 transition text-left rounded"
                      >
                        @if(action.icon)
                          <i data-icon="{action.icon}" class="size-4 shrink-0"></i>
                        @endif
                        <span>{action.label}</span>
                      </button>
                    @endif
                  </div>


                  <!-- Standard selection actions -->
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-1 pb-0.5">Selección</p>
                  <div class="px-1">
                    <button disabled
                      data-btn="select-all"
                      on-click="handleAction:select-all"
                      class="
                        flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 
                        disabled:opacity-40 transition text-left rounded">
                      <i data-icon="check-square" class="size-4 shrink-0"></i>
                      <span>Seleccionar todos</span>
                    </button>
                    <button disabled
                      data-btn="clear-all"
                      on-click="handleAction:clear-all"
                      class="
                        flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 
                        disabled:opacity-40 transition text-left rounded">
                      <i data-icon="square" class="size-4 shrink-0"></i>
                      <span>Limpiar selección</span>
                    </button>
                    <button disabled
                      data-btn="invert-selection"
                      on-click="handleAction:invert-selection"
                      class="
                        flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 
                        disabled:opacity-40 transition text-left rounded">
                      <i data-icon="shuffle" class="size-4 shrink-0"></i>
                      <span>Invertir selección</span>
                    </button>
                    <button disabled 
                      data-btn="show-only-selected"
                      on-click="handleAction:show-only-selected"
                      class="
                        flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 
                        disabled:opacity-40 transition text-left rounded">
                      <i data-icon="filter" class="size-4 shrink-0"></i>
                      <span>Mostrar solo seleccionados</span>
                    </button>
                  </div>

                  <div class="border-t my-1 dark:border-slate-700"></div>


                  <!-- Column visibility -->
                  
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 pt-1 pb-0.5">Columnas</p>
                  <div 
                    class="p-1 border rounded-lg h-30 overflow-auto" 
                    data-each="col in state.columns">
                      <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 transition select-none rounded">
                      <input
                        type="checkbox"
                        on-change="handleToggleColumn:@col.key"
                        class="w-3 h-3 accent-indigo-500 cursor-pointer shrink-0"
                      />
                      <span class="text-sm">{col.title}</span>
                      </label>                
                  </div>

                  <!-- Page size -->
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-1 pb-0.5 dark:border-slate-700 border-b">Paginación</p>
                  <div 
                    data-a="${this.pageSizeOptions}"
                    data-each="size in pageSizeOptions"
                    class="mt-1 flex w-full gap-2">
                    <button 
                      data-btn="page-size-{size}"
                      class="
                        flex-1 app-button btn-ghost px-2 py-1 text-sm
                        hover:bg-slate-100 dark:hover:bg-slate-700 rounded
                        @if(state.pageSize === size) bg-slate-200 dark:bg-slate-600/50 @endif
                      " 
                      on-click="handlePageSize:{size}">
                      {size}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto border rounded-lg dark:border-slate-700">
          <table class="w-full border-collapse text-sm">
            <thead class="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th class="px-3 py-2 border-b w-10">
                  <input type="checkbox" on-change="selectAll" class="cursor-pointer"/>
                </th>
                <!-- Headers will be rendered here -->
              </tr>
            </thead>
            <tbody>
              <!-- Rows will be rendered here -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── Data utilities ───────────────────────────────────────────

  private getSortedData(): T[] {
    if (!this.sortDirty) return this.sortedData;

    const columns = this.state.columns as Column<T>[];
    const rows = [...(this.state.data as T[])];
    const sortColumn = this.state.sortColumn as string | null;
    const sortDirection = this.state.sortDirection as 'asc' | 'desc' | null;

    if (!sortColumn || !sortDirection) {
      this.sortedData = rows;
      this.sortDirty = false;
      return this.sortedData;
    }

    const column = columns.find(c => c.key === sortColumn);
    if (!column?.sorter) {
      this.sortedData = rows;
      this.sortDirty = false;
      return this.sortedData;
    }

    console.log('Sorting data by', column.title, sortDirection);  

    this.sortedData = rows.sort((a, b) => {
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

    this.sortDirty = false;
    return this.sortedData;
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
    if (column.accessor && typeof column.accessor === 'function') 
      return column.accessor(item);
    else if (column.accessor && typeof column.accessor === 'string') {
      return (item as Record<string, unknown>)[column.accessor as string] as string | number | boolean | null;
    }
    return (item as Record<string, unknown>)[column.key] as string | number | boolean | null;
  }

  private loadPageSize(): number {
    const saved = storage.readValue<number>(this.pageSizeStorageKey(), 10);
    return Number.isFinite(saved) ? saved : 10;
  }

  private savePageSize(): void {
    storage.writeValue(this.pageSizeStorageKey(), Number(this.state.pageSize));
  }

  private saveVisibleColumns(): void {
    const cols = Array.from(this.state.visibleColumns as Set<string>);
    storage.writeValue(this.visibleColumnsStorageKey(), cols);
  }

  private pageSizeStorageKey = () => `app-table-${this.tableKey}-page-size`;
  private visibleColumnsStorageKey = () => `app-table-${this.tableKey}-visible-columns`;

  private invalidateSort(): void {
    this.sortDirty = true;
  }
}

export default TableComponent;
