
/**
 * Callback invoked by a publish/subscribe channel when an event is emitted.
 *
 * @typeParam T - The type of the optional payload passed to the subscriber.
 * @param payload - Optional data associated with the event; may be undefined if the publisher supplied no payload.
 * @returns void
 *
 * @remarks
 * Subscriber callbacks are typically invoked by the publisher when an event occurs. Implementations should
 * avoid throwing unhandled errors from subscribers and should minimize long-running synchronous work.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PubSubCallback<T = any> = (payload?: T) => void;

/**
 * A publish-subscribe (PubSub) event system for managing topic-based message distribution.
 * 
 * @class PubSub
 * @example
 * ```typescript
 * const pubsub = new PubSub();
 * 
 * // Subscribe to a topic
 * const unsubscribe = pubsub.subscribe('user:login', (payload) => {
 *   console.log('User logged in:', payload);
 * });
 * 
 * // Publish to a topic
 * pubsub.publish('user:login', { userId: 123, username: 'john' });
 * 
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
// export class PubSub {
//   private topics = new Map<string, Set<PubSubCallback>>();

//   subscribe<T>(topic: string, cb: PubSubCallback<T>): () => void {
//     if (!this.topics.has(topic)) this.topics.set(topic, new Set());
  
//     const subs = this.topics.get(topic)!;
//     subs.add(cb);
//     console.log('PubSub.subscribe')

//     return () => {
//       console.log('PubSub.unsubscribe');
//       subs.delete(cb);
//     }
//   }

//   publish<T>(topic: string, payload?: T) {
//     console.log('PubSub.publish ' + topic);
//     Promise.resolve().then(() => {
//       this.topics.get(topic)?.forEach(cb => cb(payload));
//     });
//   }
// }

// export const pubSub = new PubSub();

export class PubSub {
  // Topic -> ScopeKey -> Set de Callbacks
  private topics = new Map<string, Map<string | symbol, Set<PubSubCallback>>>();
  private readonly GLOBAL_SCOPE = Symbol('global');

  /**
   * Normaliza la clave de scope para asegurar consistencia (String o Symbol)
   */
  private getScopeKey(id?: string | number): string | symbol {
    return id !== undefined && id !== null ? String(id) : this.GLOBAL_SCOPE;
  }

  subscribe<T>(topic: string, cb: PubSubCallback<T>, instanceId?: string | number): () => void {
    // 1. Obtener o crear el mapa de scopes para este topic
    if (!this.topics.has(topic)) this.topics.set(topic, new Map());
    const scopeMap = this.topics.get(topic)!;

    // 2. Obtener o crear el set de suscriptores para este scope
    const key = this.getScopeKey(instanceId);
    if (!scopeMap.has(key)) scopeMap.set(key, new Set());
    
    const subs = scopeMap.get(key)!;
    subs.add(cb);

    return () => {
      subs.delete(cb);
      // Limpieza en cascada: si el scope está vacío, fuera.
      if (subs.size === 0) scopeMap.delete(key);
      // Si el topic no tiene más scopes, fuera también.
      if (scopeMap.size === 0) this.topics.delete(topic);
    };
  }

  publish<T>(topic: string, payload?: T, instanceId?: string | number): void {
    const scopeMap = this.topics.get(topic);
    if (!scopeMap) return;

    const key = this.getScopeKey(instanceId);

    // Usamos microtareas para no bloquear el hilo principal de la UI
    queueMicrotask(() => {
      if (key !== this.GLOBAL_SCOPE) {
        // Unicast: Solo al ID específico
        scopeMap.get(key)?.forEach(cb => cb(payload));
      } else {
        // Broadcast: A todos los scopes de este topic
        scopeMap.forEach(subs => subs.forEach(cb => cb(payload)));
      }
    });
  }
}

export const pubSub = new PubSub();