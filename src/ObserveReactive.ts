/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  Ref,
  isObject,
  isPrivateKey,
  isSymbol,
  shallowEqual,
} from "./ObserveUtil";
import { subscribe, unsubscribe } from "./ObserveBus";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveEventHandler } from "./ObserveEvents";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveSymbols } from "./ObserveSymbols";
import { ObserveText } from "./ObserveError";
import { createProxy } from "./ObserveProxy";
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

/**
 * 创建一个禁用依赖追踪的函数
 * @param fn 原始函数
 * @returns 禁用依赖追踪的函数
 */
export function untrackable<T extends AnyFunction>(fn: T) {
  return (...args: any[]) => untrack(fn, ...args) as T;
}

/**
 * 创建一个开启依赖追踪的函数
 * @param fn 原始函数
 * @returns 开启依赖追踪的函数
 */
export function trackable<T extends AnyFunction>(fn: T) {
  return (...args: any[]) => track(fn, ...args) as T;
}

export type CollectOptions<T extends AnyFunction> = {
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
  const result: ReturnType<T> = fn(...(args || []));
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
   */
  batch?: boolean;
  /**
   * 触发更新的函数，默认为 reactivable 函数自身
   */
  update?: () => any;
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
  const wrapper: ReactiveFunction = (...args: Parameters<T>) => {
    ReactiveOwner.value = wrapper;
    ObserveFlags.unref = false;
    unsubscribe("set", setHandler);
    ObserveFlags.unref = true;
    const { result, dependencies } = collect(fn, { args, mark, ignore });
    setHandler.dependencies = dependencies;
    wrapper.dependencies = dependencies;
    if (subscribed) subscribe("set", setHandler);
    ReactiveOwner.value = null!;
    return result;
  };
  const requestUpdate = () => (update ? update() : wrapper());
  setHandler = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    return batch ? nextTick(requestUpdate, true) : requestUpdate();
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
 * @param fn 将执行的函数
 * @param options 自执行函数选项（★其中 batch 默认为 true）
 * @returns 销毁函数
 */
export function autorun<T extends AnyFunction>(
  fn: T,
  options?: Pick<ReactiveOptions, "batch">
) {
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
  const normalizeOptions = isObject(options)
    ? { ...options }
    : { immed: options };
  const { immed, ...others } = normalizeOptions;
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
  options?: Pick<ReactiveOptions, "bind" | "batch">
) {
  const { bind = true, batch = false, ...others } = { ...options };
  let subscribed = bind !== false;
  let ref: Ref<T> = null!;
  const wrapper: ReactiveFunction = () => {
    if (!ReactiveOwner.value && !subscribed) return fn();
    if (!ref) {
      const target: Ref<T> = { value: null! };
      const { id: mark } = observeInfo(target);
      const refKeys = [`${mark}.value`];
      ref = createProxy(target);
      const reactOpts = { ...others, bind, batch, mark, ignore: refKeys };
      const reactive = reactivable(() => (ref.value = fn()), reactOpts);
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
