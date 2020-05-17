import { ObserveData } from "./ObserveData";

export const ObserveHandlers = new Map<string, Set<Function>>();

export function subscribe(name: string, handler: Function) {
  if (!ObserveHandlers.has(name)) {
    ObserveHandlers.set(name, new Set<Function>());
  }
  ObserveHandlers.get(name).add(handler);
}

export function unsubscribe(name: string, handler: Function) {
  if (!ObserveHandlers.has(name)) return;
  ObserveHandlers.get(name).delete(handler);
}

export function publish(name: string, data: ObserveData) {
  if (!ObserveHandlers.has(name)) return;
  ObserveHandlers.get(name).forEach((handler: Function) => handler(data));
}

export function track(func: Function, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = ({ id, member }: ObserveData) => {
    const key = `${id}.${String(member)}`;
    dependencies.add(key);
  }
  subscribe('get', collect);
  const result = func(...args);
  unsubscribe('get', collect);
  return { result, dependencies };
}