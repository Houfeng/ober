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
  args?: Parameters<T>;
  mark?: string;
};

export function collect<T extends AnyFunction>(
  fn: T,
  options?: CollectOptions<T>
) {
  const { mark, args } = { ...options };
  const dependencies = new Set<string>();
  const collectHandler = (data: ObserveData) => {
    if (data.mark && data.mark !== mark) return;
    dependencies.add(ObserveKey(data));
  };
  subscribe("get", collectHandler);
  const originMark = ObserveFlags.mark;
  const originGetFlag = ObserveFlags.get;
  ObserveFlags.mark = mark;
  ObserveFlags.get = true;
  const result: ReturnType<T> = fn(...args);
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
  callback?: () => any;
  bind?: boolean;
  batch?: boolean;
} & Pick<CollectOptions<any>, "mark">;

const ReactiveOwner: Ref<ReactiveFunction> = {};

export function reactivable<T extends ReactiveFunction>(
  fn: T,
  options?: ReactiveOptions
) {
  const { bind = true, batch, mark, callback } = { ...options };
  let subscribed = bind !== false;
  let setHandler: ObserveEventHandler<ObserveData> = null;
  const requestUpdate = () => (callback ? callback() : wrapper());
  const wrapper: ReactiveFunction = (...args: Parameters<T>) => {
    ReactiveOwner.value = wrapper;
    ObserveFlags.unref = false;
    unsubscribe("set", setHandler);
    ObserveFlags.unref = true;
    const { result, dependencies } = collect(fn, { args, mark });
    setHandler.dependencies = dependencies;
    wrapper.dependencies = dependencies;
    if (subscribed) subscribe("set", setHandler);
    ReactiveOwner.value = null;
    return result;
  };
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
    console.log("wrapper.unsubscribe", setHandler);
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
  options?: Pick<ReactiveOptions, "batch"> & { immed?: boolean }
) {
  const { immed, ...others } = { ...options };
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

export function computed<T extends ReactiveFunction>(
  fn: T,
  options?: Omit<ReactiveOptions, "callback">
) {
  const { bind = true, batch = false, ...others } = { ...options };
  let subscribed = bind !== false;
  let ref: Ref<T> = null;
  const wrapper: ReactiveFunction = () => {
    console.log("entry1");
    if (!ReactiveOwner.value && !subscribed) return fn();
    console.log("entry2");
    if (!ref) {
      const target: Ref<T> = { value: null };
      const { id } = observeInfo(target);
      const refKey = `${id}.value`;
      ref = createProxy(target);
      const reactiveOptions = { ...others, bind, batch, mark: refKey };
      const reactive = reactivable(() => {
        ref.value = fn();
      }, reactiveOptions);
      reactive();
      const destroy = () => {
        console.log("destroy+++++++++");
        reactive.unsubscribe();
        unsubscribe("unref", destroy);
        subscribed = false;
        ref = null;
      };
      destroy.dependencies = new Set([refKey]);
      const init = () => {
        console.log("init+++++++++");
        if (subscribed) return;
        reactive.subscribe();
        subscribe("unref", destroy);
        subscribed = true;
      };
      console.log("first create", subscribed);
      if (subscribed) subscribe("unref", destroy);
      wrapper.subscribe = init;
      wrapper.unsubscribe = destroy;
    }
    if (!subscribed) wrapper.subscribe();
    return ref.value;
  };
  return wrapper as ReactiveFunction<T>;
}
