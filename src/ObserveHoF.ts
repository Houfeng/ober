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
  isBindRequiredFunction,
  isFunction,
  isObject,
  isProxy,
} from "./ObserveUtil";
import { ReactiveFunction, computable } from "./ObserveReactive";
import { isDecoratorContext, isNativeClass, isString } from "./ObserveUtil";

import { ObserveFlags } from "./ObserveFlags";
import { ObserveSymbols } from "./ObserveSymbols";
import { createProxy } from "./ObserveProxy";

/**
 * 8.1.14 之前的版本是直接 extends 原始类的
 * 如果上层应用不编译将一个 Native Class 传入，
 * 此处 Wrapper 被 ts 编译后 Function 在 extends 时
 * _supper 将引发 invoked without 'new' 错误，TS/Babel 编译的类代码均有此问题
 * 所以，在 8.1.14 及之后的版会检查是否转入了 Native class，
 * 如果是原始类，则也用 Native class 去 extends 它
 * 如下代码会检查是否原生支持 class，如果支持则动态创建生成 Observable 类的函数
 */
const createNativeObservableClass = (() => {
  try {
    // 反正都动态生成了，那重复的词换为变量，尽可能短
    const body = `return class O extends t{constructor(...a){super(...a);return this.constructor!==O?null:c(this)}}`;
    return new Function("t", "c", body);
  } catch {
    return null;
  }
})();

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
    // 8.1.14 之前的版本是直接 extends 原始类的
    // 如果上层应用不编译将一个 Native Class 传入，
    // 此处 Wrapper 被 ts 编译后 Function 在 extends 时
    // _supper 将引发 invoked without 'new' 错误，TS/Babel 编译的类代码均有此问题
    // 所以，在 8.1.14 及之后的版会检查是否转入了 Native class，
    // 如果是原始类，则也用 Native class 去 extends 它
    const willCreateNativeClass =
      isNativeClass(target) && createNativeObservableClass;
    const ObservableClass = willCreateNativeClass
      ? createNativeObservableClass(target, createProxy)
      : class ObservableClass extends target {
          constructor(...args: any[]) {
            super(...args);
            if (this.constructor !== ObservableClass) return;
            return createProxy(this);
          }
        };
    define(ObservableClass, "name", target.name);
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
export function action(
  prototype: AnyObject,
  member: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;
/**
 * Action 还可作为类成员装饰器 @action 使用
 *
 * ★ Stage-3 模式的 @action
 *
 * @param value 原始类成员函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function action<T extends AnyFunction>(
  value: T,
  context: DecoratorContext
): T;
/**
 * usage 1: action(()=>{...});
 * usage 2: @action
 */
export function action(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext,
  descriptor?: PropertyDescriptor
): any {
  if (isFunction(target) && !context) {
    // 普通高阶函数用法
    const wrapper = function (this: any, ...args: any[]) {
      ObserveFlags.action = true;
      const result = target.call(this, ...args);
      ObserveFlags.action = false;
      return result;
    };
    return isBindRequiredFunction(target) ? bind(wrapper) : wrapper;
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @action
    return action(target);
  } else if (!isFunction(target) && isString(context) && descriptor) {
    // legacy 规范装饰器 @action
    if (!descriptor?.value) return;
    return { ...descriptor, value: action(descriptor.value) };
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
export function bind(
  prototype: AnyObject,
  member: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;
/**
 * bind 还可作为类成员装饰器 @bind 使用
 *
 * ★ Stage-3 模式的 @bind
 *
 * @param value 原始类成员函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function bind<T extends AnyFunction>(
  value: T,
  context: DecoratorContext
): T;
/**
 * usage 1: bind(()=>{...});
 * usage 2: @bind
 */
export function bind(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext,
  descriptor?: PropertyDescriptor
): any {
  if (isFunction(target) && !context) {
    // 高阶函数
    define(target, ObserveSymbols.BindRequired, true);
    return target;
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @bind
    return bind(target);
  } else if (!isFunction(target) && isString(context) && descriptor) {
    // legacy 规范装饰器 @bind
    if (!descriptor?.value) return;
    return { ...descriptor, value: bind(descriptor.value) };
  }
}

/**
 * 将普通函数转换为一个具备缓存和计算能能力的函数
 *
 * ★特别注意★ 在计算函数没有被任何一个可响应函数使用时，
 * 将会自动退普普通函数，只要被任何一个可响应函数使用，它就会恢复为具备计算和缓存能力的函数。
 * 可响应函数包括「reactivable、autorun、watch」
 *
 * @param fn 计算函数
 * @param options 计算函数选项
 * @returns 具备缓存和计算能能力的函数
 */
export function computed<T>(fn: () => T): ReactiveFunction<() => T>;
/**
 * 作为一个类成员装饰器使用 (只可用于 Getter)
 *
 * ★ legacy 模式的 @computed
 *
 * @param prototype 类
 * @param member 类成员
 */
export function computed<T extends AnyObject>(
  prototype: T,
  member: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;
/**
 * computed 还可作为类 Getter 成员装饰器 @computed 使用 (只可用于 Getter)
 *
 * ★ Stage-3 模式的 @computed
 *
 * @param value Getter 函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function computed<T extends AnyFunction>(
  value: T,
  context: DecoratorContext
): ReactiveFunction<T>;
/**
 * usage 1: computed(()=>{...})
 * usage 2: @computed
 */
export function computed<T extends AnyObject | AnyFunction>(
  target: T,
  context?: DecoratorContext | string,
  descriptor?: PropertyDescriptor
): any {
  if (isFunction(target) && !context) {
    // 高阶函数，等价于没有 options 的 computable
    const wrapper = computable(target);
    return isBindRequiredFunction(target) ? bind(wrapper) : wrapper;
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @computed, getter 无需 isBindRequiredFunction 检查
    return computable(target);
  } else if (
    isObject(target) &&
    !isFunction(target) &&
    isString(context) &&
    descriptor
  ) {
    // legacy 规范装饰器 @computed，getter 无需 isBindRequiredFunction 检查
    if (!descriptor?.get) return;
    return { ...descriptor, get: computable(descriptor.get) };
  }
}
