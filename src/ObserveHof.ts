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

import { ObserveError } from "./ObserveError";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveSymbols } from "./ObserveSymbols";
import { createProxy } from "./ObserveProxy";
import { isArrowFunction } from "./ObserveUtil";

/**
 * 创建一个可观察的对象或类
 * @param 原始对象或类，也可以是一个返回对象的工场函数
 * @returns 可观察对象或类（类实列将自动是可观察的）
 */
export function observable<T = any>(target: T): T {
  if (isProxy(target)) {
    return target;
  } else if (isFunction<AnyClass>(target)) {
    const ObservableClass = class extends target {
      constructor(...args: any[]) {
        super(...args);
        if (this.constructor !== ObservableClass) return;
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

/**
 * 创建一个 Action 函数，在严格模式下必须在 Action 中才能变更可观察对象
 * @param target 原始函数
 */
export function action<T extends AnyFunction>(target: T): T;
export function action(target: any, member?: string): any {
  if (isFunction(target) && !member) {
    return function (this: any, ...args: any[]) {
      ObserveFlags.action = true;
      const result = target.call(this, ...args);
      ObserveFlags.action = false;
      return result;
    };
  } else if (target && member) {
    const method = target[member];
    if (!isFunction(method)) return;
    target[member] = action(method);
  }
}

/**
 * 创建一个自动绑定 this 的函数，
 * 在 proxy 模式下，在可观察对象上声明箭头函数，箭头函数中将去响应，
 * 所以请在 proxy 模式下使用普通函数，如果想强制绑定 this 时才使用此 API
 * @param target 原始函数
 */
export function bind<T extends AnyFunction>(target: T): T;
export function bind(target: any, member?: string): any {
  if (isFunction(target) && !member) {
    if (isArrowFunction(target)) {
      throw ObserveError("Bind cannot be used for arrow functions");
    }
    define(target, ObserveSymbols.BindRequired, true);
    return target;
  } else if (target && member) {
    const method = target[member];
    if (!isFunction(method)) return;
    target[member] = bind(method);
  }
}
