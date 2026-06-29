
export type StateCallback<V> = (value: V) => void;
export type SubscribeFn<T extends object> = <K extends keyof T>(prop: K, callback: StateCallback<T[K]>) => () => void;

export function useState<T extends object>(initial: T) {

  let isSilent = false;
  const subscribers: { [K in keyof T]?: StateCallback<T[K]>[] } = {};
  const globalSubscribers: StateCallback<T[keyof T]>[] = [];

  const state = new Proxy(initial, {
    get(target, prop) {
      return target[prop as keyof T];
    },
    set(target, prop, value) {
      const key = prop as keyof T;
      if (target[key] === value) return true;   
      target[key] = value;
      if(!isSilent) subscribers[key]?.forEach(cb => cb(value));
      if(!isSilent) globalSubscribers.forEach(cb => cb(value));
      return true;
    }
  });

  const setState = <K extends keyof T>(prop: K, value: T[K]): void => {
    state[prop] = value;
  };

  const changed = <K extends keyof T>(prop: K, callback: StateCallback<T[K]>): (() => void) => {
    if (!subscribers[prop]) {
      subscribers[prop] = [];
    }
    subscribers[prop]!.push(callback);
    return () => {
      if (subscribers[prop]) {
        // console.log('clean useState subscription');
        subscribers[prop] = subscribers[prop]!.filter(sub => sub !== callback);
        if (subscribers[prop]!.length === 0) {
          delete subscribers[prop];
        }
      }
    };
  };

  // =========================================================================================
  // 1. Sin dependencias: ejecutar una vez inmediatamente
  // 2. Array vacío: cualquier cambio dispara el efecto
  // 3. Con dependencias específicas: solo esas propiedades disparan el efecto
  // =========================================================================================
  const effect = (callback: () => void | (() => void), deps?: (keyof T)[]): (() => void) => {
    
    let cleanupFn: (() => void) | void;
    const run = () => {
      if (typeof cleanupFn === 'function') cleanupFn();
      cleanupFn = callback();
    };    

    // =========================================================================
    // 1. Sin dependencias: ejecutar una sola vez cuando el DOM esté listo
    // =========================================================================
    if (deps === undefined) {
      if (document.readyState === 'loading') {
        const handler = () => { cleanupFn = callback(); };
        document.addEventListener('DOMContentLoaded', handler, { once: true });
        return () => {
          document.removeEventListener('DOMContentLoaded', handler);
          if (typeof cleanupFn === 'function') cleanupFn();
        };
      }
      cleanupFn = callback();
      return () => { if (typeof cleanupFn === 'function') cleanupFn(); };
    }
    // ==========================================================
    // 2. Array vacío: cualquier cambio dispara el efecto
    // ==========================================================
    if (deps.length === 0) {
      const handler: StateCallback<T[keyof T]> = () => run();
      globalSubscribers.push(handler);
      return () => {
        const idx = globalSubscribers.indexOf(handler);
        if (idx >= 0) globalSubscribers.splice(idx, 1);
        if (typeof cleanupFn === 'function') cleanupFn();
      };
    }
    // ==========================================================
    // 3. Con dependencias específicas: disparan el efecto
    // ==========================================================
    const handler: StateCallback<T[keyof T]> = () => run();
    const unsubs = deps.map(dep => changed(dep, handler));
    return () => {
      unsubs.forEach(u => u());
      if (typeof cleanupFn === 'function') cleanupFn();
    };
  };

  const batch = (partialState: Partial<T>, silent = true): void => {
    isSilent = silent;
    try {
      Object.entries(partialState).forEach(([prop, value]) => {
        state[prop as keyof T] = value as T[keyof T];
      });
    } finally {
      isSilent = false;
    }
  };

  return { store : state, put : setState, on : changed, effect, batch };
}