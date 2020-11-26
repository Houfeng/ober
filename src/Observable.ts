/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveConfig } from "./ObserveConfig";
import { Symbols } from "./Symbols";
import { createProxy } from "./ObserveProxy";
import { isObject } from "./Util";

export function observable<T extends object | Function>(target: T): T {
  if (typeof target === "function") {
    if (ObserveConfig.mode !== "proxy") {
      const func: any = target;
      const factory: any = function Class(...args: any[]) {
        return createProxy(new func(...args));
      };
      factory[Symbols.IsProxy] = true;
      return factory as T;
    }
    return new Proxy(target, {
      get(target: any, member: string | number | symbol) {
        if (member === Symbols.IsProxy) return true;
        return target[member];
      },
      construct(target: any, args: any[]) {
        return createProxy(new target(...args));
      }
    });
  } else if (isObject(target)) {
    return createProxy(target);
  } else {
    return target;
  }
}
