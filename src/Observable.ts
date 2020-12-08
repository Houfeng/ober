/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { define, getOwnValue, isFunction, isObject } from "./Util";

import { Symbols } from "./Symbols";
import { createProxy } from "./ObserveProxy";

type Class = new (...args: any[]) => any;

export function observable<T = any>(target: T): T {
  if (isFunction<Class>(target)) {
    const factory: any = function Class(...args: any[]) {
      // Subclasses do not automatically proxy
      return getOwnValue(this.constructor, Symbols.Factory) === factory
        ? createProxy(new target(...args))
        : new target(...args);
    };
    Object.setPrototypeOf(factory, target);
    factory.prototype = target.prototype;
    define(factory, Symbols.Proxy, true);
    define(target, Symbols.Factory, factory);
    return factory as T;
  } else if (isObject(target)) {
    // proxy object
    return createProxy(target);
  } else {
    // others
    return target;
  }
}
