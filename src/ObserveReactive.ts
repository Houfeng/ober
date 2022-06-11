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

export function track<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, true, ...args);
}

export function untrack<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, false, ...args);
}

export function untrackable<T extends AnyFunction>(fn: T) {
  return (...args: any[]) => untrack(fn, ...args) as T;
}

export function trackable<T extends AnyFunction>(fn: T) {
  return (...args: any[]) => track(fn, ...args) as T;
}

export type CollectOptions<T extends AnyFunction> = {
  /**
   * arguments passed to the collection function
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

export function autorun<T extends AnyFunction>(
  fn: T,
  options?: Pick<ReactiveOptions, "batch">
) {
  const wrapper = reactivable(fn, { ...options, bind: true });
  wrapper();
  return wrapper.unsubscribe;
}

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
