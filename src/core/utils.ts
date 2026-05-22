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
  return [...new Set(data.map((row) => (row as any)[key]))];
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

function hasOwnProperty(target: any, prop: string) {
  return Object.prototype.hasOwnProperty.call(target, prop)
}

/**
 * Filters an array of objects based on a condition specified as either a function or an object.
 * If the condition is a function, it is used directly as the filter predicate.
 * If the condition is an object, each key-value pair is treated as a property and expected value to match.
 * The function supports nested properties using dot notation and can handle computed properties (functions) on the items.
 * @template T - The type of objects in the array
 * @param {T[]} array - The array of objects to filter
 * @param {(item: T) => boolean | Record<string, unknown>} sentence - The filtering condition, either a function or an object with key-value pairs to match
 * @returns {T[]} A new array containing only the objects that match the specified condition
 *
 * @example
 * // 1. Filtro con función predicado
 * const adults = where(users, (user) => user.age >= 18);
 *
 * // 2. Filtro por valor exacto
 * const admins = where(users, { role: "admin" });
 *
 * // 3. Filtro por múltiples propiedades
 * const activeAdmins = where(users, { role: "admin", active: true });
 *
 * // 4. Filtro con RegExp
 * const gmailUsers = where(users, { email: /@gmail\.com$/ });
 *
 * // 5. Filtro con función por campo (predicado por propiedad)
 * const richUsers = where(users, {
 *   salary: (val) => (val as number) > 50_000,
 * });
 *
 * // 6. Filtro con propiedad computada (método en el objeto)
 * const expiredSessions = where(sessions, {
 *   isExpired: true, // llama a session.isExpired() si es función
 * });
 *
 * // 7. Combinación: RegExp + valor exacto + predicado
 * const results = where(products, {
 *   name: /^laptop/i,
 *   inStock: true,
 *   price: (val) => (val as number) < 1_000,
 * });
 *
 * // 8. Sin filtros → devuelve el array original
 * const all = where(users, {});
 *
 * // 9. Array vacío → devuelve vacío sin errores
 * const none = where([], { role: "admin" });
 */
function where<T extends Record<string, unknown>>(
  array: T[],
  sentence: ((item: T) => boolean) | Record<string, unknown>
): T[] {

  if (typeof sentence === "function")
    return array.filter(sentence);

  if (sentence !== null && typeof sentence === "object") {
    const entries = Object.entries(sentence);
    if (entries.length === 0) return array;

    return array.filter((item) =>
      entries.every(([key, expected]) => {
        let actual = item[key];

        if (typeof actual === "function") {
          try {
            actual = (actual as () => unknown).call(item);
          } catch (e) {
            console.error(
              `Error al ejecutar la propiedad computada '${key}' en el item:`,
              item,
              e
            );
            return false;
          }
        }

        if (typeof expected === "function")
          return (expected as (val: unknown, item: T) => boolean)(actual, item);

        if (expected instanceof RegExp)
          return typeof actual === "string" && expected.test(actual);

        return Object.is(actual, expected);
      })
    );
  }

  return array;
}

/**
 * Converts an array of items into a Set of values derived from those items.
 * If a valueSelector is provided, it determines how to extract the value from each item; otherwise, the items themselves are used as values.
 *
 * @template T - The type of items in the input array
 * @template TValue - The type of values to be stored in the resulting Set
 * @param {readonly T[]} array - The array of items to convert into a Set
 * @param {keyof T | ((item: T) => TValue)} [valueSelector] - An optional key or function to select the value from each item. If a key is provided, 
 * it will be used to access the property on each item; if a function is provided, it will be called with the item to compute the value.
 * @return {Set<TValue | T>} A Set containing the unique values derived from the input array, either directly from the items or through the valueSelector.
 *
 * @example
 * // Using a value selector function
 * const users = [
 *  { id: 1, name: 'Alice' },
 *  { id: 2, name: 'Bob' },
 *  { id: 3, name: 'Alice' }
 * ];
 * const uniqueNames = toSet(users, user => user.name);
 * // uniqueNames is a Set containing 'Alice' and 'Bob'
 *
 * // Using a key as value selector
 * const uniqueIds = toSet(users, 'id');
 * // uniqueIds is a Set containing 1, 2, and 3
 * // Without a value selector (items themselves are used)
 * const uniqueUsers = toSet(users);
 * // uniqueUsers is a Set containing the three user objects (with duplicates if they are not reference-equal)
 */ 
function toSet<T, TValue>(
  array: readonly T[],
  valueSelector?: keyof T | ((item: T) => TValue)
): Set<TValue | T> {
  return new Set(
    array.map((item) =>
      valueSelector === undefined ? item
      : typeof valueSelector === "function" ? valueSelector(item)
      : item[valueSelector as keyof T]
    )
  ) as Set<TValue | T>;
}

/**
 * Converts an array of items into a Map, where each key-value pair is derived from the items using specified selectors.
 * The keySelector determines how to extract the key from each item, while the valueSelector determines how to extract the value.
 * If the valueSelector is not provided, the items themselves are used as values in the Map.
 *
 * @template T - The type of items in the input array
 * @template TKey - The type of keys in the resulting Map
 * @template TValue - The type of values in the resulting Map
 * @param {readonly T[]} array - The array of items to convert into a Map
 * @param {keyof T | ((item: T) => TKey)} keySelector - A key or function to select the key from each item. If a key is provided, it will be used to access the property on each item; if a function is provided, it will be called with the item to compute the key.
 * @param {keyof T | ((item: T) => TValue)} [valueSelector] - An optional key or function to select the value from each item. If a key is provided, it will be used to access the property on each item; if a function is provided, it will be called with the item to compute the value. If not provided, the items themselves are used as values.
 * @return {Map<TKey, TValue | T>} A Map containing key-value pairs derived from the input array based on the provided selectors.
 * @example
 * // Using function selectors for both keys and values
 * const users = [
 *  { id: 1, name: 'Alice' },
 *  { id: 2, name: 'Bob' }
 * ];
 * const userMap = toMap(users, user => user.id, user => user.name);
 * // userMap is a Map where 1 maps to 'Alice' and 2 maps to 'Bob'
 * // Using a key as the key selector and a function for the value selector
 * const userMap2 = toMap(users, 'id', user => user.name);
 * // userMap2 is the same as userMap
 * // Using a function for the key selector and a key for the value selector
 * const userMap3 = toMap(users, user => user.id, 'name');
 * // userMap3 is the same as userMap
 * // Using keys for both selectors
 * const userMap4 = toMap(users, 'id', 'name');
 * // userMap4 is the same as userMap
 * // Using only a key selector (values are the items themselves)
 * const userMap5 = toMap(users, 'id');
 * // userMap5 is a Map where 1 maps to { id: 1, name: 'Alice' } and 2 maps to { id: 2, name: 'Bob' }
 */ 
function toMap<T, TKey, TValue>(
  array: readonly T[],
  keySelector: keyof T | ((item: T) => TKey),
  valueSelector?: keyof T | ((item: T) => TValue)
): Map<TKey, TValue | T> {
  return new Map(
    array.map((item) => {
      const key = typeof keySelector === "function"
        ? keySelector(item)
        : (item[keySelector] as TKey);
      const value = valueSelector === undefined ? item
        : typeof valueSelector === "function" ? valueSelector(item)
        : item[valueSelector as keyof T];
      return [key, value] as [TKey, TValue | T];
    })
  );
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
  where,
  toSet,
  toMap
};
