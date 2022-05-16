/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  isObject,
  isPrivateKey,
  isSymbol,
  shallowEqual,
} from "./ObserveUtil";
import { ObserveEvent, subscribe, unsubscribe } from "./ObserveBus";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveSymbols } from "./ObserveSymbols";
import { ObserveText } from "./ObserveError";

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
  subscribe(ObserveEvent.get, collectHandler);
  ObserveFlags.get = true;
  const result: ReturnType<T> = fn(...args);
  ObserveFlags.get = false;
  unsubscribe(ObserveEvent.get, collectHandler);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(ObserveText(`A single function has ${count} dependencies`));
  }
  return { result, dependencies };
}

export type ReactiveUnsubscribe = () => void;
export type ReactiveSubscribe = () => void;

export interface ReactiveFunction {
  dependencies?: Set<string>;
  subscribe?: ReactiveUnsubscribe;
  unsubscribe?: ReactiveSubscribe;
  (...args: any[]): any;
}

export function reactivable<T extends ReactiveFunction>(
  fn: T,
  onUpdate?: (data?: ObserveData) => any,
  lazySubscribe = false
) {
  let subscribed = !lazySubscribe; // eslint-disable-line prefer-const
  let setHandler: ObserveHandler; // eslint-disable-line prefer-const
  const wrapper: ReactiveFunction = (...args: any[]) => {
    unsubscribe(ObserveEvent.set, setHandler);
    const { result, dependencies } = collect(fn, ...args);
    setHandler.dependencies = dependencies;
    wrapper.dependencies = dependencies;
    if (subscribed) subscribe(ObserveEvent.set, setHandler);
    return result;
  };
  setHandler = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    return onUpdate ? onUpdate(data) : wrapper();
  };
  wrapper.subscribe = () => {
    if (subscribed) return;
    subscribe(ObserveEvent.set, setHandler);
    subscribed = true;
  };
  wrapper.unsubscribe = () => {
    if (!subscribed) return;
    unsubscribe(ObserveEvent.set, setHandler);
    subscribed = false;
  };
  return wrapper as T & ReactiveFunction;
}

export function autorun<T extends AnyFunction>(fn: T) {
  const wrapper = reactivable(fn);
  wrapper();
  return wrapper.unsubscribe;
}

export function watch(selector: () => any, fn: () => void, immed = false) {
  let prevResult: any = ObserveSymbols.Nothing;
  return autorun(() => {
    const result = selector();
    const latestResult = isObject(result) ? { ...result } : result;
    if (
      !shallowEqual(latestResult, prevResult) &&
      (prevResult !== ObserveSymbols.Nothing || immed)
    ) {
      fn();
    }
    prevResult = latestResult;
  });
}
