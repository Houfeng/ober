import { bind } from "./Bind";
import { computable, ReactiveFunction } from "./Reactive";
import {
  AnyFunction,
  AnyObject,
  isBindRequired,
  isDecoratorContext,
  isFunction,
  isObject,
  isString,
} from "./util";

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
  descriptor: PropertyDescriptor,
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
  context: DecoratorContext,
): ReactiveFunction<T>;
/**
 * usage 1: computed(()=>{...})
 * usage 2: @computed
 */
export function computed<T extends AnyObject | AnyFunction>(
  target: T,
  context?: DecoratorContext | string,
  descriptor?: PropertyDescriptor,
): any {
  if (isFunction(target) && !context) {
    // 高阶函数，等价于没有 options 的 computable
    const wrapper = computable(target);
    return isBindRequired(target) ? bind(wrapper) : wrapper;
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
