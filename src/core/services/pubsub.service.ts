
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PubSubCallback<T = any> = (payload?: T) => void;

export class PubSub {

  private topics = new Map<string, Map<string | symbol, Set<PubSubCallback>>>();
  private readonly GLOBAL_SCOPE = Symbol('global');

  private getScopeKey(id?: string | number): string | symbol {
    return id !== undefined && id !== null ? String(id) : this.GLOBAL_SCOPE;
  }

  subscribe<T>(topic: string, cb: PubSubCallback<T>, instanceId?: string | number): () => void {

    if (!this.topics.has(topic)) this.topics.set(topic, new Map());
    const scopeMap = this.topics.get(topic)!;

    const key = this.getScopeKey(instanceId);
    if (!scopeMap.has(key)) scopeMap.set(key, new Set());
    
    const subs = scopeMap.get(key)!;
    subs.add(cb);

    return () => {
      subs.delete(cb);
      if (subs.size === 0) scopeMap.delete(key);
      if (scopeMap.size === 0) this.topics.delete(topic);
    };
  }

  publish<T>(topic: string, payload?: T, instanceId?: string | number): void {
    const scopeMap = this.topics.get(topic);
    if (!scopeMap) return;

    const key = this.getScopeKey(instanceId);

    queueMicrotask(() => {
      if (key !== this.GLOBAL_SCOPE) {
        scopeMap.get(key)?.forEach(cb => cb(payload));
      } else {
        scopeMap.forEach(subs => subs.forEach(cb => cb(payload)));
      }
    });
  }
}

export const pubSub = new PubSub();