/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveConfig } from "./ObserveConfig";
import { ObserveError } from "./ObserveError";
import { ObserveState } from "./ObserveState";
import { isFunction } from "./Util";

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
    throw ObserveError("Strict mode change model, must be in action");
  }
}

export function mutation<T = any>(func: () => T): T {
  return action(func)();
}
