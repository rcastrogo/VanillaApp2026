
type StateCallback<V> = (value: V) => void;

export function useState<T extends object>(initial: T) {

  const subscribers: { [K in keyof T]?: StateCallback<T[K]>[] } = {};

  const state = new Proxy(initial, {
    get(target, prop) {
      return target[prop as keyof T];
    },
    set(target, prop, value) {
      const key = prop as keyof T;
      if (target[key] === value) return true;   
      target[key] = value;
      subscribers[key]?.forEach(cb => cb(value));
      return true;
    }
  });

  const setState = <K extends keyof T>(prop: K, value: T[K]): void => {
    state[prop] = value;
  };

  const changed = <K extends keyof T>(prop: K, callback: StateCallback<T[K]>): void => {
    if (!subscribers[prop]) {
      subscribers[prop] = [];
    }
    subscribers[prop]!.push(callback);
  };

  return { strore : state, put : setState, on : changed };
}