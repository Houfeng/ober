/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { define, isFunction, isObject, isProxy } from "./Util";

import { Symbols } from "./Symbols";
import { createProxy } from "./ObserveProxy";

type Class = new (...args: any[]) => any;

export function observable<T = any>(target: T): T {
  if (isProxy(target)) {
    return target;
  } else if (isFunction<Class>(target)) {
    class Factory extends target {
      constructor(...args: any[]) {
        super(...args);
        return this.constructor === Factory ? createProxy(this) : this;
      }
    }
    define(Factory, Symbols.Proxy, true);
    return Factory;
  } else if (isObject(target)) {
    // proxy object
    return createProxy(target);
  } else {
    // others
    return target;
  }
}
