/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  AnyObject,
  DecoratorContext,
  Ref,
  isFunction,
  isObject,
  isPrivateKey,
  isString,
  isSymbol,
  shallowEqual,
} from "./ObserveUtil";
import { subscribe, unsubscribe } from "./ObserveBus";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveEventHandler } from "./ObserveEvents";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveReflect } from "./ObserveReflect";
import { ObserveSymbols } from "./ObserveSymbols";
import { ObserveText } from "./ObserveError";
import { createProxy } from "./ObserveProxy";
import { isDecoratorContext } from "./ObserveUtil";
import { nextTick } from "./ObserveTick";
import { observeInfo } from "./ObserveInfo";

const { Nothing } = ObserveSymbols;

function trackSwitch<T extends AnyFunction>(
  fn: T,
  flag: boolean,
  ...args: any[]
) {
  if (!fn) return;
  const originSetFlag = ObserveFlags.set;
  const originGetFlag = ObserveFlags.get;
  ObserveFlags.set = flag;
  ObserveFlags.get = flag;
  const result = fn(...args);
  ObserveFlags.set = originSetFlag;
  ObserveFlags.get = originGetFlag;
  return result as ReturnType<T>;
}

/**
 * 执行一个函数，并在函数执行过程中启用依赖追踪
 * 通常在一个大的 untrack 函数中将启用一小部分处理时使用
 * @param fn 执行的函数
 * @param args 传递给执行函数的参数
 * @returns 执行结果
 */
export function track<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, true, ...args);
}

/**
 * 执行一个函数，并在函数执行过程中禁用依赖追踪
 * @param fn 执行的函数
 * @param args 传递给执行函数的参数
 * @returns 执行结果
 */
export function untrack<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, false, ...args);
}

export type CollectOptions<T extends AnyFunction> = {
  context?: any;
  /**
   * 传递给收集函数的参数
   */
  args?: Parameters<T>;
  /**
   * 收集标记，打上收集标记后，将阻止上层收集函数收集
   * 如果没有完全搞懂它，请不要使用它
   * @internal
   */
  mark?: string;
  /**
   * 要忽略收集的 key (格式 id.member)
   * 如果没有完全搞懂它，请不要使用它
   * @internal
   */
  ignore?: string[];
};

/**
 * 执行一个函数并收集其依赖
 *
 * ★特别注意★，一般情况下，不需要直接调用此 API，通常用于更上层 API 或 库，
 *
 * @param fn 将执行并收集依赖的数据
 * @param options 收集选项
 * @returns 执行结果和依赖清单
 */
export function collect<T extends AnyFunction>(
  fn: T,
  options?: CollectOptions<T>
) {
  const { mark, args, ignore = [] } = { ...options };
  const dependencies = new Set<string>();
  const collectHandler = (data: ObserveData) => {
    if (data.mark && data.mark !== mark) return;
    const key = ObserveKey(data);
    if (ignore && ignore.indexOf(key) > -1) return;
    dependencies.add(key);
  };
  subscribe("get", collectHandler);
  const originMark = ObserveFlags.mark;
  const originGetFlag = ObserveFlags.get;
  ObserveFlags.mark = mark || "";
  ObserveFlags.get = true;
  const result: ReturnType<T> = fn.call(context, ...(args || []));
  ObserveFlags.get = originGetFlag;
  ObserveFlags.mark = originMark;
  unsubscribe("get", collectHandler);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(ObserveText(`A single function has ${count} dependencies`));
  }
  return { result, dependencies };
}

export type ReactiveUnsubscribe = () => void;
export type ReactiveSubscribe = () => void;

export type ReactiveFunction<T extends AnyFunction = AnyFunction> = T & {
  dependencies?: Set<string>;
  subscribe?: ReactiveUnsubscribe;
  unsubscribe?: ReactiveSubscribe;
};

export type ReactiveOptions = {
  /**
   * 是否自动合并更新
   * 设置为 true 时，可观察对象的所有同步变更，都将同步触发 update
   * 默认为 false
   *
   * ★当 batch 为 true，将不会向 update 函数传递 data 参数
   *
   */
  batch?: boolean;
  /**
   * 触发更新的函数，默认为 reactivable 函数自身
   *
   * ★当 batch 为 true，将不会向 update 函数传递 data 参数
   *
   */
  update?: (data?: ObserveData) => any;
  /**
   * 是否自动绑定，设置为 false 时，在手动调用返回函数 .subscribe 方法才能激活
   * 默认为 true
   */
  bind?: boolean;
} & Omit<CollectOptions<any>, "args">;

const ReactiveOwner: Ref<ReactiveFunction> = {};

/**
 * 创建一个可响应函数
 *
 * ★特别注意★：返回的可响应函数，当不在使用时必须调用销毁方法进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题
 * 如果你不确认在干什么，请不要直接使用 reactivable api，
 *
 * @param fn 原始函数
 * @param options 响应选项
 * @returns 可响应函数 (调用 <ReturnFunc>.unsubscribe() 可销毁)
 */
export function reactivable<T extends ReactiveFunction>(
  fn: T,
  options?: ReactiveOptions
) {
  const { bind = true, batch, mark, ignore, update } = { ...options };
  let subscribed = bind !== false;
  let setHandler: ObserveEventHandler<ObserveData> = null!;
  const wrapper: ReactiveFunction = function (
    this: any,
    ...args: Parameters<T>
  ) {
    ReactiveOwner.value = wrapper;
    ObserveFlags.unref = false;
    unsubscribe("set", setHandler);
    ObserveFlags.unref = true;
    const collectOptions = { context: this, args, mark, ignore };
    const { result, dependencies } = collect(fn, collectOptions);
    setHandler.dependencies = dependencies;
    wrapper.dependencies = dependencies;
    if (subscribed) subscribe("set", setHandler);
    ReactiveOwner.value = null!;
    return result;
  };
  const requestUpdate = (it?: ObserveData) => (update ? update(it) : wrapper());
  setHandler = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    return batch ? nextTick(requestUpdate, true) : requestUpdate(data);
  };
  wrapper.subscribe = () => {
    if (subscribed) return;
    subscribe("set", setHandler);
    subscribed = true;
  };
  wrapper.unsubscribe = () => {
    if (!subscribed) return;
    unsubscribe("set", setHandler);
    subscribed = false;
  };
  return wrapper as ReactiveFunction<T>;
}

/**
 * 启动一个自执行函数，当函数中用到的数据发生变化时它将自动重新执行
 *
 * ★特别注意★：返回值是销毁函数，当不在使用时必须调用销毁函数进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题
 *
 * 因为需要必需的销毁处理，所以不支持作为装饰器使用，
 * 但上层配合一些库的生命周期可封装装饰器风格的 API，比如 React 在卸载时自动销毁
 *
 * @param fn 将执行的函数
 * @param options 自执行函数选项（★其中 batch 默认为 true）
 * @returns 销毁函数
 */
export function autorun<T extends AnyFunction>(
  fn: T,
  options?: Pick<ReactiveOptions, "batch"> | boolean
) {
  options = isObject(options) ? { ...options } : { batch: options };
  const wrapper = reactivable(fn, { batch: true, ...options, bind: true });
  wrapper();
  return wrapper.unsubscribe;
}

/**
 * 创建一个观察器，每当用到的数据发生变化时，将重新计算
 *
 * ★特别注意★：返回值是销毁函数，当不在使用时必须调用销毁函数进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题
 *
 * 因为需要必需的销毁处理，所以不支持作为装饰器使用，
 * 但上层配合一些库的生命周期可封装装饰器风格的 API，比如 React 在卸载时自动销毁
 *
 * @param selector 计算函数，需返回一个值，将对新旧值进行浅对比，决定是否调用执行函数
 * @param fn 执行函数，由 selector 的计算结果决定是否重新执行
 * @param options 观察器选项（★其中 batch 默认为 true）
 * @returns 销毁函数
 */
export function watch<T>(
  selector: () => T,
  fn: (newValue?: T, oldValue?: T) => void,
  options?: (Pick<ReactiveOptions, "batch"> & { immed?: boolean }) | boolean
) {
  options = isObject(options) ? { ...options } : { immed: options };
  const { immed, ...others } = options;
  let oldValue: any = Nothing;
  return autorun(() => {
    const value = selector();
    const newValue = isObject(value) ? { ...value } : value;
    if (!shallowEqual(newValue, oldValue) && (oldValue !== Nothing || immed)) {
      fn(newValue, oldValue);
    }
    oldValue = newValue;
  }, others);
}

type ComputableOptions = Pick<ReactiveOptions, "bind" | "batch">;

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
export function computable<T extends ReactiveFunction>(
  fn: T,
  options?: ComputableOptions
) {
  const { bind = true, batch = false, ...others } = { ...options };
  let subscribed = bind !== false;
  let ref: Ref<T> = null!;
  const wrapper: ReactiveFunction = function (this: any) {
    if (!ReactiveOwner.value && !subscribed) return fn();
    if (!ref) {
      const target: Ref<T> = { value: null! };
      const { id: mark } = observeInfo(target);
      const refKeys = [`${mark}.value`];
      ref = createProxy(target);
      const reactOpts = { ...others, bind, batch, mark, ignore: refKeys };
      const reactive = reactivable(
        () => (ref.value = fn.call(this)),
        reactOpts
      );
      reactive();
      const destroy = () => {
        if (!subscribed) return;
        reactive.unsubscribe!();
        unsubscribe("unref", destroy);
        subscribed = false;
        ref = null!;
      };
      destroy.dependencies = new Set(refKeys);
      if (subscribed) subscribe("unref", destroy);
      const init = () => {
        if (subscribed) return;
        reactive.subscribe?.();
        subscribe("unref", destroy);
        subscribed = true;
      };
      wrapper.subscribe = init;
      wrapper.unsubscribe = destroy;
    }
    if (!subscribed) wrapper.subscribe!();
    return ref.value;
  };
  return wrapper as ReactiveFunction<T>;
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
export function computed<T extends ReactiveFunction>(
  fn: T,
  options?: ComputableOptions
): ReactiveFunction<T>;
/**
 * 作为一个类成员装饰器使用 (只可用于 Getter)
 *
 * ★ legacy 模式的 @computed
 *
 * @param prototype 类
 * @param member 类成员
 */
export function computed<T extends AnyObject>(prototype: T, member: string): T;
/**
 * computed 还可作为类 Getter 成员装饰器 @computed 使用 (只可用于 Getter)
 *
 * ★ Stage-3 模式的 @computed
 *
 * @param value Getter 函数
 * @param context 装饰器上下文对象
 * @returns any
 */
export function computed(value: AnyFunction, context: DecoratorContext): any;
/**
 * 作为一个支持选项的类成员装饰器使用
 * ★ Stage-3 & legacy (只可用于 Getter)
 */
export function computed(
  options?: ComputableOptions
): <T extends AnyObject | AnyFunction>(
  value: T,
  context: DecoratorContext | string
) => T;
/**
 * usage 1: computed(()=>{...})
 * usage 2: computed(()=>{...},options)
 * usage 3: @computed
 * usage 4: @computed(options)
 */
export function computed<T extends AnyObject | ComputableOptions | AnyFunction>(
  target: T,
  options?: ComputableOptions | DecoratorContext | string
): any {
  if (
    isFunction(target) &&
    !isString(options) &&
    !isDecoratorContext(options)
  ) {
    // 作为高阶函数命名用，待价于 computable
    return computable(target, options);
  } else if ((!target || !isFunction(target)) && !options) {
    // 作为带选项的类成员装饰器使用，返回一个装饰器函数
    return (
      value: AnyObject | AnyFunction,
      context: DecoratorContext | string
    ): any => {
      if (isFunction(value) && isDecoratorContext(context)) {
        // stage-3 规范装饰器 @computed(options), target is options
        return computable(value, target);
      } else if (isObject(value) && isString(context)) {
        // legacy 规范装饰器 @computed(options), target is options
        const descriptor = ObserveReflect.getPropertyDescriptor(value, context);
        if (!descriptor?.get) return;
        const getter = computable(descriptor?.get, target);
        descriptor.get = getter;
      }
    };
  } else if (isFunction(target) && isDecoratorContext(options)) {
    // stage-3 规范装饰器 @computed
    return computable(target);
  } else if (!isFunction(target) && isString(options)) {
    // legacy 规范装饰器 @computed ，options is member
    return computed()(target, options);
  }
}
