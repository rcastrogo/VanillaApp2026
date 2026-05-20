import type { Column } from './table.model';

import type { Identifiable } from '@/core/types';
import { getValueByPath } from '@/core/utils';


/**
 * Encapsulates the lookup logic for resolving master-table IDs to their
 * display labels inside table columns.
 *
 * @example
 * ```ts
 * const paisResolver = new MasterTableResolver(paises, 'id', 'descripcion');
 *
 * // Use in defineColumns:
 * { key: 'paisId', title: 'País', valueResolver: paisResolver }
 *
 * // Access the full object when needed:
 * const pais = paisResolver.get(42);
 * ```
 */
export class ColumnValueResolver<
  TRow extends Identifiable,
  TSource extends object = Record<string, unknown>,
> {

  private map: Map<string | number, string>;
  private sourceMap: Map<string | number, TSource>;
  private idField: string;
  private labelField: string;
  private fallback: string;

  /**
   * @param data      Array of master-table records.
   * @param idField   Field used as the unique identifier (e.g. `'id'`, `'key'`).
   * @param labelField Field used as the display value (e.g. `'descripcion'`, `'name'`).
   * @param fallback  Value returned when no match is found. Defaults to `'-'`.
   */
  constructor(
    data: object[],
    idField: string,
    labelField: string,
    fallback = '-',
  ) {
    this.idField = idField;
    this.labelField = labelField;
    this.fallback = fallback;
    this.map = new Map();
    this.sourceMap = new Map();
    this.load(data);
  }

  load(data: object[]): void {
    this.map.clear();
    this.sourceMap.clear();
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const id = record[this.idField] as string | number;
      const label = getValueByPath(record, this.labelField) ?? this.fallback;
      this.map.set(id, label);
      this.sourceMap.set(id, item as TSource);
    }
  }

  resolve(item: TRow, column: Column<TRow>): string {
    const fieldValue = (item as unknown as Record<string, string | number>)[column.key];
    return this.map.get(fieldValue) ?? this.fallback;
  }

  label(id: string | number): string {
    return this.map.get(id) ?? this.fallback;
  }

  get(id: string | number): TSource | undefined {
    return this.sourceMap.get(id);
  }

  entries(): [string | number, string][] {
    return [...this.map.entries()];
  }

  get size(): number {
    return this.map.size;
  }
}
