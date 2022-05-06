/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyClass,
  AnyFunction,
  define,
  isFunction,
  isObject,
  isProxy,
} from "./ObserveUtil";
import { NativeProxy, createProxy, getProxyClass } from "./ObserveProxy";

import { ObserveFlags } from "./ObserveFlags";
import { ObserveSymbols } from "./ObserveSymbols";

export function isNativeProxy() {
  return NativeProxy === getProxyClass();
}

export function observable<T = any>(target: T): T {
  if (isProxy(target)) {
    return target;
  } else if (isFunction<AnyClass>(target)) {
    const ObservableClass = class extends target {
      constructor(...args: any[]) {
        super(...args);
        if (this.constructor !== ObservableClass) return this;
        return createProxy(this);
      }
    };
    define(ObservableClass, "name", target.name);
    if (target.displayName) {
      define(ObservableClass, "displayName", target.displayName);
    }
    define(ObservableClass, ObserveSymbols.Proxy, true);
    return ObservableClass;
  } else if (isObject(target)) {
    return createProxy(target);
  } else {
    return target;
  }
}

export function action<T extends AnyFunction>(target: T): T;
export function action(target: any, member?: string) {
  if (isFunction(target) && !member) {
    return function (...args: any[]) {
      ObserveFlags.action = true;
      const result = target.call(this, ...args);
      ObserveFlags.action = false;
      return result;
    };
  } else {
    const method = target[member];
    if (!isFunction(method)) return;
    target[member] = action(method);
  }
}
