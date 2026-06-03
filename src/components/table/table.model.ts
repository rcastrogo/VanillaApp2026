import type { ColumnValueResolver } from "./table-resolver";

import type { Identifiable, SortDirection } from "@/core/types";



export const TABLE_ACTIONS = {
  SELECT_ALL: 'select-all',
  CLEAR_ALL: 'clear-all',
  INVERT_SELECTION: 'invert-selection',
  SHOW_ONLY_SELECTED: 'show-only-selected',
} as const;

export type TableAction = (typeof TABLE_ACTIONS)[keyof typeof TABLE_ACTIONS];

export interface ColumnGrouping {
  getGroupKey?: (
    value: string | number | boolean | null, 
    column: { key: string; title: string },
    rows: Identifiable[],
    data: Identifiable[],
  ) => string;
  getGroupCaption?: (
    value: string | number | boolean | null, 
    column: { key: string; title: string },
    rows: Identifiable[],
    data: Identifiable[],
    groupRows: Identifiable[],
  ) => string | { text: string; className?: string };
}
export const DEFAULT_GROUP_CLASS = 'p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-card border-b border-slate-300 dark:border-slate-600 tracking-wide';

export function numericRangeGrouping(ranges: { max: number; label: string }[] = [
  { max: 10, label: 'Menores que 10' },
  { max: 100, label: 'Del 11 al 99' },
]): ColumnGrouping {
  return {
    getGroupKey(value, column, _rows, _data) {
      const n = Number(value);
      if (Number.isNaN(n)) return column.title + ': N/A';
      for (const range of ranges)
        if (n < range.max) return column.title + ': ' + range.label;
      return `${column.title}: Mayores que ${ranges[ranges.length - 1]?.max ?? 0}`;
    },
  };
}

export function textInitialGrouping(): ColumnGrouping {
  return {
    getGroupKey(value, _column, _rows, _data) {
      const str = String(value ?? '').trim();
      return str.length > 0 ? str[0].toUpperCase() : '(vacío)';
    },
    getGroupCaption: (value, column, _rows, _data, groupRows) => {
      const str = String(value ?? '').trim();
      const displayValue = str.length > 0 ? str[0].toUpperCase() : '(vacío)';
      return {
        text: `${column.title}: ${displayValue} (${groupRows.length} Elementos)`,
        className: DEFAULT_GROUP_CLASS,
      }
    },
  };
}

export function valueGrouping(suffix = 'Elemento/s'): ColumnGrouping {
  return {
    getGroupCaption: (value, column, _rows, _data, groupRows) => ({
      text: `${column.title}: ${value ?? '(vacío)'} (${groupRows.length} ${suffix})`,
      className: DEFAULT_GROUP_CLASS,
    }),
  };
}

function parseDate(str: string): Date | null {
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d+))?)?)?$/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds, ms] = match;
    return new Date(+year, +month - 1, +day, +(hours ?? 0), +(minutes ?? 0), +(seconds ?? 0), +(ms ?? 0));
  }
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateRangeGrouping(ranges: { maxDaysAgo: number; label: string }[] = [
  { maxDaysAgo: 7, label: 'Última semana' },
  { maxDaysAgo: 30, label: 'Último mes' },
  { maxDaysAgo: 90, label: 'Últimos 3 meses' },
  { maxDaysAgo: 365, label: 'Último año' },
]): ColumnGrouping {

  // 1. Función auxiliar interna para eliminar la duplicidad
  const getLabel = (value: unknown): string => {
    const str = String(value ?? '').trim();
    if (!str || str === '-') return 'Sin fecha';
    
    const date = parseDate(str);
    if (!date) return 'Fecha inválida';

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Futuro';

    // Busca el primer rango aplicable, si no lo encuentra usa el fallback
    const matchedRange = ranges.find(r => diffDays <= r.maxDaysAgo);
    return matchedRange ? matchedRange.label : `Más de ${ranges[ranges.length - 1]?.maxDaysAgo ?? 0} días`;
  };

  return {
    getGroupKey(value, column, _rows, _data) {
      return `${column.title}: ${getLabel(value)}`;
    },
    getGroupCaption: (value, column, _rows, _data, groupRows) => {
      const suffix = groupRows.length === 1 ? 'Elemento' : 'Elementos';
      return {
        text: `${column.title}: ${getLabel(value)} (${groupRows.length} ${suffix})`,
        className: DEFAULT_GROUP_CLASS,
      };
    },
  };
}

export interface Column<T extends Identifiable> {
  key: string;
  title: string; 
  className?: string;
  isVisible?: boolean;
  sorter?: keyof T | ((a: T, b: T) => number);
  accessor?: keyof T | ((item: T) => string | number | boolean | null);
  cellRender?: (item: T, column: Column<T>) => string;
  options?: {
    shouldShowFilterButton?: boolean;
    shouldShowTextBox?: boolean;
    shouldShowValueList?: boolean;
    canBeRemoved?: boolean;
  };
  width?: number; // in pixels
  resolver?: ColumnValueResolver<T>;
  grouping?: ColumnGrouping;
}

export interface ActionButton {
  key: string;
  label: string;
  icon?: string;
  show?: 'menu' | 'button' | 'both';
  onClick?: () => void;
  enabledWhen?: (selected: Set<string | number>) => boolean;
}

export interface TableState<T extends Identifiable> {
  data: T[];
  actions: ActionButton[],
  columns: Column<T>[],
  selected: Set<string | number>;
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: SortDirection;
  visibleColumns: Set<string>;
  activeFiltersCount: 0;
}

export interface FilterCriteria {
  searchText: string;
  selectedValues: Set<string | number>;
}

export interface UniqueValue {
  name: string;
  value: string | number | null | undefined;
  isSelected?: boolean;
}

export interface TableComponentRef<T extends Identifiable> {
  setData(data: T[]): void;
  setColumns(columns: Column<T>[]): void;
  setActions(actions: ActionButton[]): void;
}

export interface TableUIUpdatePayload {
  toolbarContainer: HTMLElement | null;
  statusContainer: HTMLElement | null;
  buttonsContainer: HTMLElement | null;
  buttons: {
    crud: HTMLElement[],
    custom: HTMLElement[],
    pagination: HTMLElement[],
    menu: HTMLElement[],
  }
  status: string;
}