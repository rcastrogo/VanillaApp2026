import { TableComponent } from './table.component';
import type { ActionButton, Column } from './table.model';

import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { notificationService } from '@/core/services/notification.service';
import { BaseComponent, type Identifiable } from '@/core/types';

interface Country extends Identifiable {
  id: number;
  name: string;
  capital: string;
  region: string;
  population: number;
}


export default class TableBasicPage extends BaseComponent {

  actions: ActionButton[] = [];
  columns: Column<Country>[] = [];
  data: Country[] = []; 

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue) {
    super.init(ctx);
    this.setState({
      countries: this.loadSampleData(),
      title: 'Countries Table — Basic Example',
      actions : this.defineActions(),
      columns : this.defineColumns(),
      data : this.loadSampleData()
    }, false);
  }
  
  private loadSampleData(): Country[] {
    return [
      { id: 1, name: 'Spain', capital: 'Madrid', region: 'Europe', population: 47_560_000 },
      { id: 2, name: 'France', capital: 'Paris', region: 'Europe', population: 67_970_000 },
      { id: 3, name: 'Germany', capital: 'Berlin', region: 'Europe', population: 83_370_000 },
      { id: 4, name: 'Italy', capital: 'Rome', region: 'Europe', population: 58_940_000 },
      { id: 5, name: 'Portugal', capital: 'Lisbon', region: 'Europe', population: 10_880_000 },
      { id: 6, name: 'Japan', capital: 'Tokyo', region: 'Asia', population: 125_100_000 },
      { id: 7, name: 'China', capital: 'Beijing', region: 'Asia', population: 1_412_000_000 },
      { id: 8, name: 'Brazil', capital: 'Brasília', region: 'South America', population: 215_300_000 },
      { id: 9, name: 'Mexico', capital: 'Mexico City', region: 'North America', population: 128_900_000 },
      { id: 10, name: 'India', capital: 'New Delhi', region: 'Asia', population: 1_417_170_000 },
      { id: 11, name: 'USA', capital: 'Washington', region: 'North America', population: 338_290_000 },
      { id: 12, name: 'Canada', capital: 'Ottawa', region: 'North America', population: 39_740_000 },
    ];
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
        className: 'w-12 text-center',
        sorter: (a, b) => a.id - b.id,
      },
      {
        key: 'name',
        title: 'Country',
        className: 'text-left min-w-32',
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        key: 'capital',
        title: 'Capital',
        className: 'text-left',
        sorter: (a, b) => a.capital.localeCompare(b.capital),
      },
      {
        key: 'region',
        title: 'Region',
        className: 'text-left',
        sorter: (a, b) => a.region.localeCompare(b.region),
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

  onRefresh = () => {
    const table = BaseComponent.getInstance<TableComponent<Country>>('[app-table]');
    table?.setData(this.loadSampleData());
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

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div 
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
