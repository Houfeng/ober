import { $Bind } from "./Symbols";
import {
  AnyFunction,
  AnyObject,
  isDecoratorContext,
  isFunction,
  isString,
} from "./util";

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
  descriptor: PropertyDescriptor,
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
  context: DecoratorContext,
): T;
/**
 * usage 1: bind(()=>{...});
 * usage 2: @bind
 */
export function bind(
  target: AnyObject | AnyFunction,
  context?: string | DecoratorContext,
  descriptor?: PropertyDescriptor,
): any {
  if (isFunction(target) && !context) {
    // 高阶函数
    (target as any)[$Bind] = true;
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
