/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { bind } from "./Bind";
import { Flag } from "./Flag";
import { isDevelopment, ObserveConfig } from "./ObserveConfig";
import {
  AnyFunction,
  AnyObject,
  needBind,
  isDecoratorContext,
  isFunction,
  isString,
} from "./util";

export const actionFlag = Flag(false);

export function assertStrictMode() {
  if (ObserveConfig.strict && isDevelopment() && !actionFlag.current()) {
    throw new Error("Update outside of Action");
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
  descriptor: PropertyDescriptor,
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
  context: DecoratorContext,
): T;
/**
 * usage 1: action(()=>{...});
 * usage 2: @action
 */
export function action(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext,
  descriptor?: PropertyDescriptor,
): any {
  if (isFunction(target) && !context) {
    // 普通高阶函数用法
    const wrapper = function (this: any, ...args: any[]) {
      return actionFlag.run(
        true,
        function (this: any) {
          target.call(this, ...args);
        }.bind(this),
      );
    };
    return needBind(target) ? bind(wrapper) : wrapper;
  } else if (isFunction(target) && isDecoratorContext(context)) {
    // stage-3 规范装饰器 @action
    return action(target);
  } else if (!isFunction(target) && isString(context) && descriptor) {
    // legacy 规范装饰器 @action
    if (!descriptor?.value) return;
    return { ...descriptor, value: action(descriptor.value) };
  }
}
