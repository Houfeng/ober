/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { AnyFunction, isPrivateKey, isSymbol } from "./Util";
import { ObserveEvent, subscribe, unsubscribe } from "./ObserveBus";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveState } from "./ObserveState";
import { ObserveText } from "./ObserveError";

function trackSwitch<T extends AnyFunction>(
  fn: T,
  state: boolean,
  ...args: any[]
) {
  if (!fn) return;
  const originSetState = ObserveState.set;
  const originGetState = ObserveState.get;
  ObserveState.set = state;
  ObserveState.get = state;
  const result = fn(...args);
  ObserveState.set = originSetState;
  ObserveState.get = originGetState;
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
  ObserveState.get = true;
  const result: ReturnType<T> = fn(...args);
  ObserveState.get = false;
  unsubscribe(ObserveEvent.get, collectHandler);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(ObserveText(`A single function has ${count} dependencies`));
  }
  return { result, dependencies };
}

export type ReactiveDestroy = () => void;

export interface ReactiveFunction {
  dependencies?: Set<string>;
  destroy?: ReactiveDestroy;
  (...args: any[]): any;
}

export function reactivable<T extends ReactiveFunction>(
  fn: T,
  onUpdate?: (data?: ObserveData) => any
) {
  let onSet: ObserveHandler;
  const wrapper: ReactiveFunction = (...args: any[]) => {
    unsubscribe(ObserveEvent.set, onSet);
    const { result, dependencies } = collect(fn, ...args);
    onSet.dependencies = dependencies;
    subscribe(ObserveEvent.set, onSet);
    wrapper.dependencies = dependencies;
    return result;
  };
  onSet = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    if (!wrapper.dependencies) return;
    if (!wrapper.dependencies.has(ObserveKey(data))) return;
    return onUpdate ? onUpdate(data) : wrapper();
  };
  wrapper.destroy = () => unsubscribe(ObserveEvent.set, onSet);
  return wrapper as T & ReactiveFunction;
}
