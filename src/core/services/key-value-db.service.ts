import { IndexedDbStore } from "../storage/indexed-db-store";


interface AppDataRecord {
  key: string;
  value: unknown;
}
class KeyValueDbService {

  private store = new IndexedDbStore<AppDataRecord>(
    'app-db',
    'data'
  );

  async read<T = unknown>(key: string): Promise<T | null> {
    const record = await this.store.get(key);
    return record ? (record.value as T) : null;
  }

  async write(key: string, value: unknown): Promise<void> {
    await this.store.put({ key, value });
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async keys(): Promise<string[]> {
    const all = await this.store.getAll();
    return all.map(r => r.key);
  }

  async entries<T = unknown>(): Promise<[string, T][]> {
    const all = await this.store.getAll();
    return all.map(r => [r.key, r.value as T]);
  }

  async values<T = unknown>(): Promise<T[]> {
    const all = await this.store.getAll();
    return all.map(r => r.value as T);
  }

}

export const keyValueDbService = new KeyValueDbService();