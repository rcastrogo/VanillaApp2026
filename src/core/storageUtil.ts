 
 
 const LOCAL_STORAGE_ROOT = 'VanillaApp2026:';

/**
 * A utility interface for managing data in the browser's `localStorage`
 * under a specific application namespace.
 *
 * Provides methods to write, read, remove, and clear stored values safely.
 */
export interface StorageUtil {
  /**
   * Writes a key-value pair to `localStorage` under the application namespace.
   *
   * @typeParam T - The type of the value being stored.
   * @param key - The storage key.
   * @param value - The value to store.
   */
  writeValue: <T>(key: string, value: T) => StorageUtil;

  /**
   * Reads a value from `localStorage` by its key.
   *
   * @typeParam T - The expected type of the returned value.
   * @param key - The storage key to read.
   * @param defaultValue - A default value returned if the key is not found or parsing fails.
   * @returns The stored value or the provided default value.
   */
  readValue: <T>(key: string, defaultValue?: T) => T;

  /**
   * Reads all key-value pairs stored under the application namespace.
   *
   * @returns An object containing all stored values indexed by their subkeys.
   */
  readAll: () => Record<string, unknown>;

  /**
   * Removes a specific key and its value from `localStorage`.
   *
   * @param key - The storage key to remove.
   */
  removeValue: (key: string) => StorageUtil;

  /**
   * Clears all entries in `localStorage` that belong to the application namespace.
   */
  clearAppData: () => StorageUtil;

}

const buildKey = (key: string) => LOCAL_STORAGE_ROOT + key;

/**
 * Implementation of the {@link StorageUtil} interface that manages `localStorage`
 * operations scoped to the `"learning-ground:"` namespace.
 */
export const storage: StorageUtil = {
  /** @inheritdoc */
  writeValue: function <T>(key: string, value: T): StorageUtil {
    try {
      localStorage.setItem(buildKey(key), JSON.stringify({ value }));
    } catch (error) {
      console.error(`StorageUtil.writeValue error [${key}]:`, error);
    }
    return this;
  },

  /** @inheritdoc */
  readValue: function <T>(key: string, defaultValue?: T): T {
    try {
      const item = localStorage.getItem(buildKey(key));
      if (item) {
        const parsed = JSON.parse(item);
        return parsed.value as T;
      }
    } catch (error) {
      console.error(`StorageUtil.readValue error [${key}]:`, error);
    }
    return defaultValue as T;
  },

  /** @inheritdoc */
  readAll: function (): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const rootLength = LOCAL_STORAGE_ROOT.length;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey && fullKey.startsWith(LOCAL_STORAGE_ROOT)) {
          const item = localStorage.getItem(fullKey);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              const subKey = fullKey.substring(rootLength);
              data[subKey] = parsed.value;
            } catch (parseError) {
              console.warn(
                `StorageUtil.readAll: Failed to parse item for key ${fullKey}`,
                parseError
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('StorageUtil.readAll error:', error);
    }
    return data;
  },

  /** @inheritdoc */
  removeValue: function (key: string): StorageUtil {
    try {
      localStorage.removeItem(buildKey(key));
    } catch (error) {
      console.error(`StorageUtil.removeValue error [${key}]:`, error);
    }
    return this;
  },

  /** @inheritdoc */
  clearAppData: function (): StorageUtil {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const fullKey = localStorage.key(i);
        if (fullKey && fullKey.startsWith(LOCAL_STORAGE_ROOT)) {
          keysToRemove.push(fullKey);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('StorageUtil.clearAppData error:', error);
    }
    return this;
  }
};