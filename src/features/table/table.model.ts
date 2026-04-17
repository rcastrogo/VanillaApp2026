/**
 * Table Feature — Type definitions and models
 * Migrated from AngularApp2026 table component
 */

export const TABLE_ACTIONS = {
  SELECT_ALL: 'select-all',
  CLEAR_ALL: 'clear-all',
  INVERT_SELECTION: 'invert-selection',
  SHOW_ONLY_SELECTED: 'show-only-selected',
} as const;

export type TableAction = (typeof TABLE_ACTIONS)[keyof typeof TABLE_ACTIONS];

export type SortDirection = 'asc' | 'desc' | null;
export type SortState = [string, SortDirection] | undefined;

export interface Identifiable {
  id: string | number;
}

/**
 * Column definition — describes a table column
 */
export interface Column<T extends Identifiable> {
  key: string;
  title: string; // Use `{key: 'i18n-key'}` for i18n later
  className?: string;
  isVisible?: boolean;
  /** Can be property name or custom sorter function */
  sorter?: keyof T | ((a: T, b: T) => number);
  /** Can be property name or custom accessor function */
  accessor?: keyof T | ((item: T) => string | number | boolean | null);
  /** Custom cell template function (returns HTML string) */
  cellRender?: (item: T, column: Column<T>) => string;
}

/**
 * Action button definition
 */
export interface ActionButton {
  key: string;
  label: string;
  icon?: string;
  show?: 'menu' | 'button' | 'both'; // Button toolbar vs context menu
  onClick?: () => void;
  enabledWhen?: (selected: Set<string | number>) => boolean;
}

/**
 * Action handlers — CRUD callbacks
 */
export interface ActionHandlers<T> {
  onCreate?: (callback: (item: T) => void) => void;
  onDelete?: (ids: (string | number)[], callback: () => void) => void;
  onEdit?: (item: T, callback: (updated: T) => void) => void;
  onCustomAction?: (action: string, payload?: unknown) => void;
}

/**
 * Table state snapshot
 */
export interface TableState<T extends Identifiable> {
  data: T[];
  selected: Set<string | number>;
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: SortDirection;
  visibleColumns: Set<string>;
}
