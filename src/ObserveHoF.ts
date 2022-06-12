/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyClass,
  AnyFunction,
  AnyObject,
  DecoratorContext,
  define,
  isFunction,
  isObject,
  isProxy,
} from "./ObserveUtil";
import { isArrowFunction, isDecoratorContext, isString } from "./ObserveUtil";

import { ObserveError } from "./ObserveError";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveSymbols } from "./ObserveSymbols";
import { createProxy } from "./ObserveProxy";

/**
 * 创建一个可观察对象或类型
 *
 * ★ 也可作为类装饰器 @observable 使用，作类装饰器同时兼容 Stage-3/legacy 规范
 *
 * @param target 原始对象或类，也可以是一个返回对象的工场函数
 * @returns 可观察对象或类（类实列将自动是可观察的）
 */
export function observable<T = AnyObject | AnyClass | AnyFunction>(
  target: T
): T {
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
export function action<T extends AnyFunction>(fn: T): T;
/**
 * Action 还可作为类成员装饰器 @action 使用
 *
 * ★ legacy 模式的 @action
 *
 * @param prototype 类原型
 * @param member 类成员
 * @returns any
 */
export function action(prototype: AnyObject, member: string): any;
/**
 * Action 还可作为类成员装饰器 @action 使用
 *
 * ★ Stage-3 模式的 @action
 *
 * @param value 原始类成员函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function action(value: AnyFunction, context: DecoratorContext): any;
/**
 * usage 1: action(()=>{...});
 * usage 2: @action
 */
export function action(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext
): any {
  if (isFunction(target) && !context) {
    // 普通高阶函数用法
    return function (this: any, ...args: any[]) {
      ObserveFlags.action = true;
      const result = target.call(this, ...args);
      ObserveFlags.action = false;
      return result;
    };
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @action
    return action(target);
  } else if (!isFunction(target) && isString(context)) {
    // legacy 规范装饰器 @action
    const method = target[context];
    if (!isFunction(method)) return;
    target[context] = action(method);
  }
}

/**
 * 创建一个自动绑定 this 的函数，
 * 在 proxy 模式下，在可观察对象上声明箭头函数，箭头函数中将去响应，
 * 所以请在 proxy 模式下使用普通函数，如果想强制绑定 this 时才使用此 API
 * @param target 原始函数
 */
export function bind<T extends AnyFunction>(fn: T): T;
/**
 * bind 也可作为类成员装饰器 @bind 使用
 *
 * ★ legacy 模式的 @bind
 *
 * @param prototype 类原型
 * @param member 类成员
 * @returns void
 */
export function bind(prototype: AnyObject, member: string): any;
/**
 * bind 还可作为类成员装饰器 @bind 使用
 *
 * ★ Stage-3 模式的 @bind
 *
 * @param value 原始类成员函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function bind(value: AnyFunction, context: DecoratorContext): any;
/**
 * usage 1: bind(()=>{...});
 * usage 2: @bind
 */
export function bind(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext
): any {
  if (isFunction(target) && !context) {
    // 普通高阶函数用法
    if (isArrowFunction(target)) {
      throw ObserveError("Bind cannot be used for arrow functions");
    }
    define(target, ObserveSymbols.BindRequired, true);
    return target;
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @bind
    return bind(target);
  } else if (!isFunction(target) && isString(context)) {
    // legacy 规范装饰器 @bind
    const method = target[context];
    if (!isFunction(method)) return;
    target[context] = bind(method);
  }
}
