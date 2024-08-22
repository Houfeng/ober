import { bind } from "./Bind";
import { observeInfo } from "./ObserveInfo";
import { createProxy } from "./Proxy";
import {
  reactivable,
  ReactiveFunction,
  ReactiveOptions,
  ReactiveOwner,
} from "./Reactive";
import {
  AnyFunction,
  AnyObject,
  needBind,
  isDecoratorContext,
  isFunction,
  isObject,
  isString,
  Ref,
} from "./util";
import { subscribe, unsubscribe } from "./EventBus";

export type ComputableOptions = Pick<ReactiveOptions, "bind" | "batch">;

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
export function computable<T>(fn: () => T, options?: ComputableOptions) {
  const { bind = true, batch = false } = options || {};
  let subscribed = false;
  let ref: Ref<T> = null!;
  let reactive: ReactiveFunction;
  const wrapper = function () {
    if (!ReactiveOwner.current() && !subscribed) return fn();
    if (!ref || !reactive) {
      const target: Ref<T> = { value: null! };
      const { id } = observeInfo(target);
      const keys = [`${id}.value`];
      ref = createProxy(target);
      const reactiveOpts = { batch, bind: false };
      reactive = reactivable(() => (ref.value = fn()), reactiveOpts);
      // 取消订阅处理
      const destroy = () => {
        if (!subscribed) return;
        reactive.unsubscribe!();
        unsubscribe("unref", destroy);
        subscribed = false;
      };
      destroy.dependencies = new Set(keys);
      wrapper.unsubscribe = destroy;
      // 建立订阅处理
      wrapper.subscribe = () => {
        if (subscribed) return;
        reactive();
        reactive.subscribe?.();
        subscribe("unref", destroy);
        subscribed = true;
      };
    }
    if (bind) {
      wrapper.subscribe!();
    } else {
      reactive();
    }
    return ref.value;
  } as ReactiveFunction<() => T>;
  return wrapper;
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
    return needBind(target) ? bind(wrapper) : wrapper;
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
