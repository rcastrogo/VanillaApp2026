
export interface DbRecord {
  key: IDBValidKey;
}

export class IndexedDbStore<T extends DbRecord> {

  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private version = 1;
  private dbName: string;
  private storeName: string;

  constructor(
    dbName: string,
    storeName: string,
    version?: number
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
    if (version !== undefined) {
      this.version = version;
    }
  }

  // ------------------------------------------------------------------------
  // CONNECTION
  // ------------------------------------------------------------------------
  private openDb(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'key'
          });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };

        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });

    return this.initPromise;
  }

  // ------------------------------------------------------------------------
  // TRANSACTION HELPERS
  // ------------------------------------------------------------------------
  private async tx(
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore> {
    const db = await this.openDb();
    const transaction = db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  // ------------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------------
  async get(key: IDBValidKey): Promise<T | undefined> {
    const store = await this.tx('readonly');

    return new Promise((resolve, reject) => {
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(): Promise<T[]> {
    const store = await this.tx('readonly');

    return new Promise((resolve, reject) => {
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(value: T): Promise<T> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put(value);

      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(key: IDBValidKey): Promise<void> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
    this.initPromise = null;
  }
  
}