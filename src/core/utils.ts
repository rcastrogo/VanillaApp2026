/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns a sanitized object from a FormData instance, trimming whitespace
 * from string values and preserving file entries as-is.
 *
 * @param {FormData} formData - The FormData object to process.
 * @returns {Record<string, string>} - A key-value object containing cleaned string values.
 *   Non-string values (e.g., File objects) are left unchanged.
 *
 * @example
 * const formData = new FormData();
 * formData.append('name', '  Alice  ');
 * formData.append('cv_file', new File([], 'cv.pdf'));
 *
 * const safeData = getSafeFormData(formData);
 * // → { name: "Alice", cv_file: File }
 */
const getSafeFormData = (formData: FormData): Record<string, string> => {
  const entries = Array.from(formData.entries());
  const cleanedEntries = entries.map(([key, value]) => {
    if (typeof value === 'string') return [key, value.trim()];
    return [key, value];
  });
  return Object.fromEntries(cleanedEntries);
};


/**
 * Creates a simple map (dictionary) from an array of objects.
 * Each entry maps `item[idKey]` → `item[nameKey]`.
 *
 * @template T
 * @param {T[]} array - The array of objects to convert.
 * @param {keyof T} [idKey='id'] - The property name to use as the key.
 * @param {keyof T} [nameKey='name'] - The property name to use as the value.
 * @returns {Record<string | number, string>} A map of IDs to names.
 *
 * @example
 * const roles = [
 *   { id: 1, name: "Developer" },
 *   { id: 2, name: "Manager" }
 * ];
 * const map = createMap(roles);
 * // map = { 1: "Developer", 2: "Manager" }
 */
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
function createMap(array: any[], idKey = 'id', nameKey = 'name'): { [k: string]: any; } {
  if (!Array.isArray(array)) return {};
  return Object.fromEntries(array.map(item => [item[idKey], getValueByPath(item, nameKey)]));
}

/**
 * Retrieves a value from an object using a dot-notation path string.
 * @param item - The object to retrieve the value from.
 * @param path - A dot-separated string path (e.g., 'user.profile.name'). If empty, returns the string representation of the item.
 * @returns The value at the specified path, or `undefined` if the path is invalid or any intermediate value is null or not an object.
 * @example
 * const obj = { user: { name: 'John', age: 30 } };
 * getValueByPath(obj, 'user.name'); // 'John'
 * getValueByPath(obj, 'user.age'); // 30
 * getValueByPath(obj, 'user.email'); // undefined
 */
function getValueByPath(item: any, path: string): any {
  if (!path) return item;
  if (!path.includes('.')) return item?.[path];
  let current = item;
  for (const part of path.split('.')) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export type NestedPaths<T> = T extends object
  ? {
    [K in keyof T]-?: K extends string
    ? `${K}` | `${K}.${NestedPaths<T[K]>}`
    : never;
  }[keyof T]
  : '';

/**
 * Compares two strings using locale-aware comparison with accent sensitivity and numeric ordering.
 * @param a - The first string to compare
 * @param b - The second string to compare
 * @returns A negative number if a comes before b, a positive number if a comes after b, or 0 if they are equal
 */
function accentNumericComparer(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'accent', numeric: true });
}

/**
 * Normalizes a string by removing diacritical marks and converting to lowercase.
 * 
 * @param value - The string to normalize
 * @returns The normalized string with diacritical marks removed and converted to lowercase
 * 
 * @example
 * normalizeNFD('Café') // returns 'cafe'
 * normalizeNFD('Naïve') // returns 'naive'
 */
const normalizeNFD = (value: string) => {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Formats a number according to the specified locale.
 * @param value - The number to format.
 * @param lng - The locale language code. Defaults to 'es' (Spanish).
 * @returns A formatted string representation of the number.
 */
const formatNumber = (value: number, lng = 'es') => new Intl.NumberFormat(lng).format(value);

/**
 * Extracts unique values from an array of objects based on a specified key.
 * @param data - The array of objects to process
 * @param key - The property key to extract unique values from
 * @returns An array of unique string values sorted in their original order of appearance
 */
function getUniqueValues(data: [], key: string) {
  return [...new Set(data.map((row) => String((row as any)[key])))];
}

function getUniqueValuesSorted<T>(
  values: T[],
  comparer?: (a: T, b: T) => number
): T[] {
  const set = new Set<T>();
  for (const v of values) {
    if (v !== null && v !== undefined) {
      set.add(v);
    }
  }
  return Array.from(set).sort(comparer);
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function groupByNested<T extends Record<string, any>>(
    array: T[],
    ...keys: (keyof T)[]
): Record<string, any> {
  if (keys.length === 0) throw new Error('Debes proporcionar al menos una clave para agrupar.');
  const result: Record<string, any> = {};
  for (const item of array) {
    let level = result;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as string;
      const value = String(item[key]);

      if (i === keys.length - 1) {
        if (!level[value]) level[value] = [];
        level[value].push(item);
      } else {
        if (!level[value]) level[value] = {};
        level = level[value];
      }
    }
  }

  return result;
}

/**
 * Builds a sorting function for an array of objects based on a specified property and direction.
 * The sorting handles undefined, null, and empty string values by ranking them before other values.
 * @template T - The type of objects to sort
 * @param {keyof T} prop - The property name to sort by
 * @param {'asc' | 'desc'} [direction='asc'] - The sorting direction, either 'asc' for ascending or 'desc' for descending
 * @returns {(a: T, b: T) => number} A comparison function that can be used with Array.prototype.sort()
 * @example
 * const data = [
 *  { name: 'Alice', age: 30 },
 *  { name: 'Bob', age: null }
 * ];
 * const sorter = buildSorter('age', 'asc');
 * data.sort(sorter);
 * // data is now sorted with Bob (null) before Alice (30)
 */
function buildSorter<T>(prop: keyof T, direction: 'asc' | 'desc' = 'asc') {
  const factor = direction === 'asc' ? 1 : -1;
  const rank = (v: unknown): number => {
    if (v === undefined) return 0;
    if (v === null) return 1;
    if (v === '') return 2;
    return 3;
  };
  return (a: T, b: T): number => {
    const av = a[prop];
    const bv = b[prop];
    // Rank comparison first
    const rdiff = rank(av) - rank(bv);
    if (rdiff !== 0) return rdiff * factor;
    // Boolean
    if (typeof av === 'boolean' && typeof bv === 'boolean') {
      return (Number(av) - Number(bv)) * factor;
    }
    // Number
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * factor;
    }
    const na = normalizeNFD(String(av));
    const nb = normalizeNFD(String(bv));
    return (
      na.localeCompare(nb, undefined, {
        sensitivity: 'base',
        numeric: true
      }) * factor
    );
  };
}

function clone<T>(obj: T): T {
  // return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function hasOwnProperty(target: any, prop: string){
  return Object.prototype.hasOwnProperty.call(target, prop)
}

export {
  getSafeFormData,
  createMap,
  accentNumericComparer,
  normalizeNFD,
  getValueByPath,
  formatNumber,
  getUniqueValues,
  getUniqueValuesSorted,
  debounce,
  groupByNested,
  buildSorter,
  clone,
  hasOwnProperty,
};
