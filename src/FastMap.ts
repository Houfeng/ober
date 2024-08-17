export type FastMap<K extends string, V> = {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  del: (key: K) => void;
};

/**
 * 原生 Map 性能相较 object 作为 map 性能有明显差距
 * 同时不需要 key 为字符串之外的类型，所以用 object 模似 map
 * @returns Map instance
 */
export function FastMap<K extends string, V>(): FastMap<K, V> {
  const store: Record<K, V | undefined> = Object.create(null);
  const get = (key: K) => store[key];
  const set = (key: K, value: V) => (store[key] = value);
  const has = (key: K) => store[key] !== void 0;
  const del = (key: K) => (store[key] = void 0);
  return { get, set, has, del };
}
