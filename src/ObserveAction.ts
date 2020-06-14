import { isFunction } from "./Util";
import { ObserveState } from "./ObserveState";
import { ObserveConfig } from "./ObserveConfig";

export function action<T extends Function>(target: T, ctx?: any): T;
export function action(target: any, ctx: string) {
  if (isFunction(target)) {
    return (...args: any[]) => {
      ObserveState.action = true;
      const result = target.call(ctx, ...args);
      ObserveState.action = false;
      return result;
    };
  }
  const originMethod = target[ctx];
  if (!isFunction(originMethod)) return;
  target[ctx] = function(...args: any[]) {
    return action(() => originMethod.call(this, ...args))();
  };
}

export function verifyStrictMode() {
  if (ObserveConfig.strict && !ObserveState.action) {
    throw new Error("Strict mode change model, must be in action");
  }
}

export function mutation<T = any>(func: () => T): T {
  return action(func)();
}
