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

export function collect<T extends AnyFunction>(fn: T, ...args: any[]) {
  const dependencies = new Set<string>();
  const collectHandler = (data: ObserveData) => {
    dependencies.add(ObserveKey(data));
  };
  subscribe("get", collectHandler);
  ObserveFlags.get = true;
  const result: ReturnType<T> = fn(...args);
  ObserveFlags.get = false;
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

const ReactiveOwner: Ref<ReactiveFunction> = {};

export function reactivable<T extends ReactiveFunction>(
  fn: T,
  onUpdate?: (data?: ObserveData) => any,
  lazyBind = false
) {
  let subscribed = !lazyBind; // eslint-disable-line prefer-const
  let setHandler: ObserveEventHandler<ObserveData>; // eslint-disable-line prefer-const
  const wrapper: ReactiveFunction = (...args: any[]) => {
    ReactiveOwner.value = wrapper;
    ObserveFlags.unref = false;
    unsubscribe("set", setHandler);
    ObserveFlags.unref = true;
    const { result, dependencies } = collect(fn, ...args);
    setHandler.dependencies = dependencies;
    wrapper.dependencies = dependencies;
    if (subscribed) subscribe("set", setHandler);
    ReactiveOwner.value = null;
    return result;
  };
  setHandler = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    return onUpdate ? onUpdate(data) : wrapper();
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

export function autorun<T extends AnyFunction>(fn: T) {
  const wrapper = reactivable(fn);
  wrapper();
  return wrapper.unsubscribe;
}

export function watch<T>(
  selector: () => T,
  fn: (newValue?: T, oldValue?: T) => void,
  immed = false
) {
  let oldValue: any = Nothing;
  return autorun(() => {
    const value = selector();
    const newValue = isObject(value) ? { ...value } : value;
    if (!shallowEqual(newValue, oldValue) && (oldValue !== Nothing || immed)) {
      fn(newValue, oldValue);
    }
    oldValue = newValue;
  });
}

export function computed<T extends ReactiveFunction>(fn: T, lazyBind = false) {
  let subscribed = !lazyBind; // eslint-disable-line prefer-const
  let ref: Ref<T>;
  const wrapper: ReactiveFunction = () => {
    if (!ref) {
      const target: Ref<T> = { value: null };
      const { id } = observeInfo(target);
      const refKey = `${id}.value`;
      ref = createProxy(target);
      const reactive = reactivable(() => (ref.value = fn()), null, lazyBind);
      reactive();
      const destroy = () => {
        if (!subscribed || ReactiveOwner.value === reactive) return;
        reactive.unsubscribe();
        unsubscribe("unref", destroy);
        subscribed = false;
      };
      destroy.dependencies = new Set([refKey]);
      const bind = () => {
        if (subscribed) return;
        reactive.subscribe();
        subscribe("unref", destroy);
        subscribed = true;
      };
      wrapper.subscribe = bind;
      wrapper.unsubscribe = destroy;
    }
    if (subscribed) wrapper.subscribe();
    return ref.value;
  };
  return wrapper as ReactiveFunction<T>;
}
