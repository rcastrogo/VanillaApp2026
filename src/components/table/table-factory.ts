
import type { ColumnValueResolver } from './table-resolver';
import { TableComponent } from './table.component';
import type { ActionButton, Column, ColumnGrouping } from './table.model';

import { BaseComponent, type Identifiable } from '@/core/types';
import { accentNumericComparer, toDate } from '@/core/utils';

export type ColumnDataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime';

/**
 * Declarative metadata used by `defineColumns` to generate a `Column<T>`.
 * When `type` is provided a sorter is auto-generated; pass `sorter` to override.
 */
export interface ColumnSchema<T extends Identifiable> {
  key: (keyof T & string) | (string & {});
  title: string;
  /** Data type used to derive an automatic sorter. */
  type?: ColumnDataType;
  className?: string;
  isVisible?: boolean;
  /** Explicit sorter — takes priority over the auto-generated one from `type`. */
  sorter?: (a: T, b: T) => number;
  accessor?: (item: T) => string | number | boolean | null;
  cellRender?: (item: T, column: Column<T>) => string;
  options?: Column<T>['options'];
  resolver?: ColumnValueResolver<T>
  grouping?: ColumnGrouping;
}

// ─── Mount configuration ──────────────────────────────────────────────────────

export interface MountTableConfig<T extends Identifiable> {
  /** DOM element that will receive the rendered table. */
  target: HTMLElement;
  /** Unique key for localStorage persistence (page-size, visible columns). */
  key: string;
  columns: Column<T>[];
  data?: T[];
  actions?: ActionButton[];
  onRefresh?: (sender: TableComponent<T>) => void;
  onCreate?: (sender: TableComponent<T>, callback: (newItem: T) => void) => void;
  onDelete?: (sender: TableComponent<T>, ids: (string | number)[], callback: () => void) => void;
  onEdit?: (sender: TableComponent<T>, item: T, callback: (updatedItem: T) => void) => void;
  onAction?: (sender: TableComponent<T>, action: string) => void;
  options?: Record<string, string>; // Additional data-* attributes for the synthetic host
}

// ─── Auto-sorter factory ──────────────────────────────────────────────────────

function buildSorter<T extends Identifiable>(
  key: string,
  type: ColumnDataType,
): (a: T, b: T) => number {
  const get = (item: T) => (item as Record<string, unknown>)[key];

  switch (type) {
    case 'number':
      return (a, b) => Number(get(a) ?? 0) - Number(get(b) ?? 0);
    case 'boolean':
      return (a, b) => (get(a) ? 1 : 0) - (get(b) ? 1 : 0);
    case 'date':
    case 'datetime': {
      const toMs = (v: unknown) => {
        const t = toDate(v as string)?.getTime();
        return t ?? 0;
      };
      return (a, b) => toMs(get(a)) - toMs(get(b));
    }
    case 'string':
    default:
      return (a, b) => 
        accentNumericComparer(String(get(a) ?? ''), String(get(b) ?? ''));
  }
}

// ─── Resolver-based sorter ────────────────────────────────────────────────────

function buildResolverSorter<T extends Identifiable>(
  key: string,
  resolver: ColumnValueResolver<T>,
): (a: T, b: T) => number {
  const col = { key, title: '' } as Column<T>;
  return (a, b) => {
    const va = resolver.resolve(a, col);
    const vb = resolver.resolve(b, col);
    return accentNumericComparer(String(va ?? ''), String(vb ?? ''));
  };
}

// ─── Column factory ───────────────────────────────────────────────────────────

/**
 * Converts an array of `ColumnSchema` descriptors into fully-typed `Column<T>`
 * objects, auto-generating sorters from the `type` field when no explicit
 * `sorter` is provided.
 *
 * @example
 * ```ts
 * const columns = defineColumns<Usuario>([
 *   { key: 'id',     title: 'ID',     type: 'number' },
 *   { key: 'nombre', title: 'Nombre', type: 'string' },
 * ]);
 * ```
 */
export function defineColumns<T extends Identifiable>(
  schemas: ColumnSchema<T>[],
): Column<T>[] {
  return schemas.map(schema => {
    const sorter: Column<T>['sorter'] =
      schema.sorter
      ?? (schema.type ? buildSorter<T>(schema.key, schema.type) : undefined)
      ?? (schema.resolver ? buildResolverSorter<T>(schema.key, schema.resolver) : undefined);

    const col: Column<T> = {
      key: schema.key,
      title: schema.title,
      ...(schema.className !== undefined && { className: schema.className }),
      ...(schema.isVisible !== undefined && { isVisible: schema.isVisible }),
      ...(sorter !== undefined && { sorter }),
      ...(schema.accessor !== undefined && { accessor: schema.accessor }),
      ...(schema.cellRender !== undefined && { cellRender: schema.cellRender }),
      ...(schema.options !== undefined && { options: schema.options }),
      ...(schema.resolver !== undefined && { resolver: schema.resolver }),
      ...(schema.grouping !== undefined && { grouping: schema.grouping }),
    };

    return col;
  });
}

// ─── Host creation ────────────────────────────────────────────────────────────

/**
 * Creates a synthetic host element that mimics the placeholder
 * `[data-component]` element used in the declarative hydration flow.
 * The host carries `data-*` attributes that `BaseComponent.init({ parent })`
 * reads as `this.props`.
 *
 * @param key   Value for `data-key` (used as the table's localStorage key).
 * @param options Additional `data-*` key/value pairs.
 */
export function createTableHost(
  key: string,
  options: Record<string, string> = {},
): HTMLElement {
  const host = document.createElement('div');
  host.dataset.key = key;
  Object.entries(options).forEach(([k, v]) => {
    host.dataset[k] = v;
  });
  return host;
}

// ─── Imperative mount ─────────────────────────────────────────────────────────

/**
 * Creates, initialises, and mounts a `TableComponent` imperatively without
 * needing a declarative `[data-component]` placeholder in the markup.
 *
 * Internally this function:
 * 1. Creates a synthetic host element so `init({ parent })` can read props.
 * 2. Calls `init`, `setColumns`, `setData`, and `setActions` on the instance.
 * 3. Renders and binds the component element.
 * 4. Appends the element to `config.target`.
 * 5. Calls `mounted()` to complete the lifecycle.
 *
 * @returns The fully initialised `TableComponent` instance.  Call
 *   `instance.setData(rows)` later to load data asynchronously.
 *
 * @example
 * ```ts
 * const table = mountTable<Usuario>({
 *   target: containerEl,
 *   key: 'usuarios-table',
 *   columns: defineColumns<Usuario>([...]),
 *   onRefresh: () => loadData(),
 * });
 * const result = await usuariosService.getAll();
 * if (typeof result !== 'string') table.setData(result.data);
 * ```
 */
export function mountTable<T extends Identifiable>(
  config: MountTableConfig<T>,
): TableComponent<T> {
  // 1. Synthetic host — carries props that init() reads via dataset
  const host = createTableHost(config.key, config.options);

  // 2. Instantiate and initialise
  const component = new TableComponent<T>({});
  component.init({ parent: host });

  // 3. Wire output callbacks
  component.onRefresh = config.onRefresh;
  component.onCreate = config.onCreate;
  component.onDelete = config.onDelete;
  component.onEdit = config.onEdit;
  component.onAction = config.onAction;

  // 4. Apply columns, actions, and initial data (before first render
  //    so the DOM is built with the correct structure immediately)
  component.setColumns(config.columns);
  if (config.actions?.length) component.setActions(config.actions);
  if (config.data?.length)    component.setData(config.data);

  // 5. Render → bind → mount
  const element = component.render();
  BaseComponent.bind(component, element);
  config.target.appendChild(element);
  component.mounted();

  return component;
}
