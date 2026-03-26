

import type { SortDirection } from "../types";
import { buildSorter, getUniqueValuesSorted } from "../utils";
import type { SummaryDefinition } from "./types";

export function computeSummary<T>(
  rows: T[], 
  definition?: SummaryDefinition<T>
) : Record<string, Record<string, number | number[]>> {
  if (!rows.length || !definition) return {};
  const result: Record<string, Record<string, number | number[]>> = {};
  for (const field in definition) {
    const functions = definition[field];
    if (!functions?.length) continue;
    const values = rows.map(r => Number(r[field as keyof T]) || 0);
    result[field] = {};
    for (const fn of functions) {
      switch (fn) {
        case 'values':
          result[field]['values'] = values;
          break;
        case 'distinct':
          result[field]['distinct'] = getUniqueValuesSorted(values.map(v => v));
          break;
        case 'sum':
          result[field]['sum'] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[field]['avg'] =
            values.length
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
          break;
        case 'min':
          result[field]['min'] = Math.min(...values);
          break;
        case 'max':
          result[field]['max'] = Math.max(...values);
          break;
        case 'median': {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          result[field]['median'] =
            sorted.length % 2
              ? sorted[mid]
              : (sorted[mid - 1] + sorted[mid]) / 2;
          }
          break;
      }
    }
  }
  return result;
}

export function sortBy<T>(
  array: T[],
  properties: string | string[],
  overrideDirection?: SortDirection
): T[] {

  const tokens = Array.isArray(properties) ? properties : properties.split(',');
  const comparators = tokens.map((token, index) => {
    const [propRaw, dirRaw] = token.trim().split(/\s+/);
    const direction: SortDirection =
      index === 0 && overrideDirection
        ? overrideDirection
        : (dirRaw?.toLowerCase() === 'desc' ? 'desc' : 'asc');

    return buildSorter<T>(propRaw as keyof T, direction);
  });

  return [...array].sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}