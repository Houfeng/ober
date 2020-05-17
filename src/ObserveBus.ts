import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveState } from "./ObserveState";

export const ObserveHandlers = new Map<string, Set<ObserveHandler>>();

export function subscribe(name: string, handler: ObserveHandler) {
  if (!handler) throw new Error("Invalid ObserveHandler");
  if (!name) throw new Error("Invalid ObserveName");
  if (!ObserveHandlers.has(name)) {
    ObserveHandlers.set(name, new Set<ObserveHandler>());
  }
  ObserveHandlers.get(name).add(handler);
}

export function unsubscribe(name: string, handler: ObserveHandler) {
  if (!ObserveHandlers.has(name)) return;
  ObserveHandlers.get(name).delete(handler);
}

export function publish(name: string, data: ObserveData) {
  if (!ObserveHandlers.has(name)) return;
  ObserveHandlers.get(name).forEach((handler: ObserveHandler) => {
    if (!handler.dependencies || handler.dependencies.has(ObserveKey(data))) {
      const originSetState = ObserveState.set;
      ObserveState.set = false;
      handler(data);
      ObserveState.set = originSetState;
    }
  });
}

export function track(func: Function, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = (data: ObserveData) => dependencies.add(ObserveKey(data));
  subscribe("get", collect);
  const result = func(...args);
  unsubscribe("get", collect);
  return { result, dependencies };
}
