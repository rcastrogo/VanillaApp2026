import type { Identifiable, SortDirection } from "@/core/types";


export const TABLE_ACTIONS = {
  SELECT_ALL: 'select-all',
  CLEAR_ALL: 'clear-all',
  INVERT_SELECTION: 'invert-selection',
  SHOW_ONLY_SELECTED: 'show-only-selected',
} as const;

export type TableAction = (typeof TABLE_ACTIONS)[keyof typeof TABLE_ACTIONS];

export interface Column<T extends Identifiable> {
  key: string;
  title: string; 
  className?: string;
  isVisible?: boolean;
  sorter?: keyof T | ((a: T, b: T) => number);
  accessor?: keyof T | ((item: T) => string | number | boolean | null);
  cellRender?: (item: T, column: Column<T>) => string;
}

export interface ActionButton {
  key: string;
  label: string;
  icon?: string;
  show?: 'menu' | 'button' | 'both';
  onClick?: () => void;
  enabledWhen?: (selected: Set<string | number>) => boolean;
}

export interface ActionHandlers<T> {
  onCreate?: (callback: (item: T) => void) => void;
  onDelete?: (ids: (string | number)[], callback: () => void) => void;
  onEdit?: (item: T, callback: (updated: T) => void) => void;
  onCustomAction?: (action: string, payload?: unknown) => void;
}

export interface TableState<T extends Identifiable> {
  data: T[];
  selected: Set<string | number>;
  currentPage: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: SortDirection;
  visibleColumns: Set<string>;
}
