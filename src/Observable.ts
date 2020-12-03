/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { NativeProxy, createProxy } from "./ObserveProxy";
import { ObserveConfig, ObserveMode } from "./ObserveConfig";
import { isFunction, isObject } from "./Util";

import { Symbols } from "./Symbols";

export type Class = new (...args: any[]) => any;

export function observable<T = any>(target: T): T {
  if (isFunction<Class>(target)) {
    if (
      ObserveConfig.mode === ObserveMode.property ||
      (ObserveConfig.mode === ObserveMode.auto && !NativeProxy)
    ) {
      const factory: any = function Class(...args: any[]) {
        return createProxy(new target(...args));
      };
      Object.setPrototypeOf(factory, target);
      factory.prototype = target.prototype;
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
