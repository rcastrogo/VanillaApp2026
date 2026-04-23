
import type { ActionButton, Column, TableComponentRef } from '../components/table/table.model';

import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { notificationService } from '@/core/services/notification.service';
import { BaseComponent, type Identifiable } from '@/core/types';
import { CountriesService, type Country } from '@/services/countries.service';
import { getCharacters, type Character } from '@/services/the-simpsons.service';

const SIMPSONS_CDN = 'https://cdn.thesimpsonsapi.com/200';

export default class TableBasicPage extends BaseComponent {

  actions: ActionButton[] = [];
  columns: Column<Country>[] = [];
  data: Country[] = []; 
  private countriesService = new CountriesService();

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.setState({
      title: 'Countries Table — Basic Example',
      actions : this.defineActions(),
      columns : this.defineColumns(),
      characterColumns : this.defineCharacterColumns(),      
      data : [] as Country[],
      characterData: [] as Character[]
    }, false);
    
  }

  mounted(): void {
    setTimeout(() => {
      void this.loadCountriesTable();
      void this.loadSimpsonsTable();
    }, 1500);
  }

  private defineActions(): ActionButton[] {
    return [  
      { 
        key: 'export', label: 'Exportar datos', icon: 'text', show: 'menu', 
        enabledWhen : (selected) => selected.size === 2 
      },
      {
        key: 'duplicate', label: 'Duplicar', icon: 'timer', show: 'button',
        enabledWhen: (selected) => selected.size === 3
      },
      { 
        key: 'custom', 
        label: 'Alert',
        icon: 'sun', 
        show: 'both',
        onClick: () => alert('custom'),
        enabledWhen: (selected) => selected.size === 4
      },
    ];
  }

  private defineColumns(): Column<Country>[] {
    return [
      {
        key: 'id',
        title: 'ID',
        className: 'w-16 text-center',
        sorter: (a, b) => a.id - b.id,
        options: {
          shouldShowFilterButton: false,
          canBeRemoved: false,
        },
      },
      {
        key: 'flag',
        title: 'Bandera',
        className: 'w-20',
        options: {
          shouldShowFilterButton: false,
          canBeRemoved: false,
        },
        cellRender: (row) => {
          return `
            <img
              src="${row.flag}"
              alt="Bandera de ${row.name}"
              loading="lazy"
              class="h-10 w-14 rounded object-cover border border-slate-200 dark:border-slate-700"
            />
          `;
        },
      },
      {
        key: 'name',
        title: 'Country',
        className: 'text-left min-w-40',
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        key: 'capital',
        title: 'Capital',
        className: 'text-left min-w-32',
        sorter: (a, b) => a.capital.localeCompare(b.capital),
      },
      {
        key: 'region',
        title: 'Region',
        className: 'text-left min-w-28',
        sorter: (a, b) => a.region.localeCompare(b.region),
      },
      {
        key: 'subregion',
        title: 'Subregion',
        className: 'text-left min-w-32',
        accessor: (row) => row.subregion || '-',
        sorter: (a, b) => (a.subregion || '').localeCompare(b.subregion || ''),
      },
      {
        key: 'language',
        title: 'Language',
        className: 'text-left min-w-32',
        accessor: (row) => row.language || 'unknown',
        sorter: (a, b) => (a.language || '').localeCompare(b.language || ''),
      },
      {
        key: 'population',
        title: 'Population',
        className: 'text-right',
        sorter: (a, b) => a.population - b.population,
        cellRender: (row) => {
          return `<span class="font-mono text-sm">${row.population.toLocaleString()}</span>`;
        },
      },
    ];
  }

  private defineCharacterColumns(): Column<Character>[] {
    return [
      {
        key: 'id',
        title: 'ID',
        className: 'w-12 text-center',
        sorter: (a, b) => a.id - b.id,
        options: {
          shouldShowFilterButton: false,
          canBeRemoved: false,
        },
      },
      {
        key: 'name',
        title: 'Character',
        className: 'min-w-40',
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        key: 'occupation',
        title: 'Occupation',
        className: 'min-w-40',
        sorter: (a, b) => a.occupation.localeCompare(b.occupation),
      },
      {
        key: 'status',
        title: 'Status',
        sorter: (a, b) => a.status.localeCompare(b.status),
        cellRender: (row) => {
          const statusClass = row.status === 'Alive'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
          return `<span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass}">${row.status}</span>`;
        },
      },
      {
        key: 'age',
        title: 'Age',
        className: 'text-right',
        sorter: (a, b) => a.age - b.age,
        options: {
          shouldShowValueList: false,
          canBeRemoved: true,
        },
      },
      {
        key: 'gender',
        title: 'Gender',
        sorter: (a, b) => a.gender.localeCompare(b.gender),
        options: {
          shouldShowValueList: true,
          shouldShowTextBox: false,
          canBeRemoved: true,
        },
      },      
      {
        key: 'portrait_path',
        title: 'Portrait',
        className: 'w-20',
        cellRender: (row) => {
          const src = `${SIMPSONS_CDN}${row.portrait_path}`;
          return `
            <img
              src="${src}"
              alt="${row.name}"
              loading="lazy"
              class="h-14 w-14 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1"
            />
          `;
        },
        options: {
          shouldShowFilterButton: false
        },
      }
    ];
  }

  private getTable(selector: string): TableComponentRef<Identifiable> | null {
    if (!this.element) return null;
    return BaseComponent.getInstance<TableComponentRef<Identifiable>>(selector, this.element);
  }

  pageNumber = 1;
  characterData: Character[] = [];
  private async loadCountriesTable(): Promise<void> {
    const result = await this.countriesService.getAll();
    if (typeof result === 'string') {
      notificationService.error(`Error loading countries: ${result}`);
      return;
    }
    const table = this.getTable('#countries-table');
    table?.setData(result.data);
  }

  private async loadSimpsonsTable(): Promise<void> {
    const result = await getCharacters(this.pageNumber++);
    if (typeof result === 'string') {
      notificationService.error(`Error loading Simpsons characters: ${result}`);
      notificationService.info(`Error loading Simpsons characters: ${result}`);
      return;
    }
    this.characterData = this.characterData.concat(result.data);
    const table = this.getTable('#the-simpsons-table');
    table?.setData(this.characterData);
  }

  onRefresh = () => {
    void this.loadCountriesTable();
    notificationService.info('Countries refreshed from API');
  }

  onRefreshTheSimpson = () => {
    this.loadSimpsonsTable();
    notificationService.info('Page: Refresh action triggered');   
  }

  onCreate = () => {
    notificationService.info('Page: Create action triggered');
  }

  onDelete = (ids: (string | number)[]) => {
    notificationService.info('Page: Delete action triggered for IDs: ' + ids.join(', '));
  }

  onEdit = (id: string | number) => {
    notificationService.info('Page: Edit action triggered for ID: ' +  id);
  }

  onAction = (action: string) => {
    notificationService.info('Page: Custom action triggered:' + action);
  }

  render() {
    const template = `
      <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 md:p-10">
        <header class="mb-10">
          <h1 class="text-4xl font-black text-slate-800 dark:text-white mb-2">
            🗂️ Data Tables — Basic Example
          </h1>
          <p class="text-slate-500 dark:text-slate-400 max-w-2xl">
            Demonstrates table rendering from column definitions with sorting, pagination, and row selection.
            No filtering or context menus yet — those come in the next iteration.
          </p>
        </header>

        <div
            data-component="app-tab"
            data-selected="the-simpsons"
            data-variant="underline"
            class="w-full"
          >

          <div 
            class="p-4"
            data-id="countries" data-title="Países" data-icon-name="zap" data-table-slot="countries">
            <div 
              id="countries-table"
              data-component="app-table"
              data-key="countries-table"            
              (on-refresh)="onRefresh"
              (on-create)="onCreate"
              (on-delete)="onDelete"
              (on-edit)="onEdit"
              (on-action)="onAction"
              (actions)="state.actions"
              (columns)="state.columns"
              (data)="state.data"></div>
          </div>

          <div 
            class="p-4"
            data-id="the-simpsons" data-title="Los Simpsons" data-icon-name="zap" data-table-slot="simpsons">
            <div 
              id="the-simpsons-table"
              data-component="app-table"
              data-key="simpsons-table"
              (on-refresh)="onRefreshTheSimpson"
              (on-create)="onCreate"
              (on-delete)="onDelete"
              (on-edit)="onEdit"
              (on-action)="onAction"
              (actions)="state.actions"
              (columns)="state.characterColumns"
              (data)="state.characterData"></div>
          </div>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">Features (In Scope)</h3>
            <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>✅ Column definitions (title, accessor, sorter, className)</li>
              <li>✅ Render from data array</li>
              <li>✅ Click header to sort (asc / desc / none)</li>
              <li>✅ Pagination (prev/next, page size, jump to page)</li>
              <li>✅ Row selection (checkbox, select all)</li>
              <li>✅ Column visibility toggle</li>
              <li>✅ State persistence (localStorage)</li>
              <li>✅ Custom cell rendering via cellRender function</li>
            </ul>
          </section>

          <section class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">Next Iteration (Future)</h3>
            <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>🔜 Column filtering (search + multi-select)</li>
              <li>🔜 Quick filter button in toolbar</li>
              <li>🔜 Context menu for row actions</li>
              <li>🔜 Inline editing</li>
              <li>🔜 Export to CSV/JSON</li>
              <li>🔜 Keyboard navigation</li>
            </ul>
          </section>
        </div>

        <footer class="mt-12 text-center text-xs text-slate-400 dark:text-slate-600">
          <p class="max-w-2xl mx-auto">
            Table feature for VanillaApp2026 — Migrated from AngularApp2026.
            Focus on core functionality first, enhancements later.
          </p>
        </footer>
      </div>
    `;

    return buildAndInterpolate(template, this);
  }
}
