/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveEvent, subscribe, unsubscribe } from "./ObserveBus";
import { isPrivateKey, isSymbol } from "./Util";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveState } from "./ObserveState";
import { ObserveText } from "./ObserveError";

export type AnyFunction = (...args: any[]) => any;

export function track<T extends AnyFunction>(func: T, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = (data: ObserveData) => {
    dependencies.add(ObserveKey(data));
  };
  subscribe(ObserveEvent.get, collect);
  ObserveState.get = true;
  const result: ReturnType<T> = func(...args);
  ObserveState.get = false;
  unsubscribe(ObserveEvent.get, collect);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(ObserveText(`A single function has ${count} dependencies`));
  }
  return { result, dependencies };
}

export interface Trackable {
  dependencies?: Set<string>;
  destroy?: Function;
  (...args: any[]): any;
}

export function trackable<T extends Trackable>(func: T, onUpdate?: Function) {
  let onSet: ObserveHandler;
  const wrapper: Trackable = (...args: any[]) => {
    unsubscribe(ObserveEvent.set, onSet);
    const { result, dependencies } = track(func, ...args);
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
  return wrapper as T;
}

export function untrack<T extends AnyFunction>(func: T, ...args: any[]) {
  if (!func) return;
  const originSetState = ObserveState.set;
  ObserveState.set = false;
  ObserveState.get = false;
  const result = func(...args);
  ObserveState.set = originSetState;
  return result as ReturnType<T>;
}

export function untrackable<T extends AnyFunction>(func: T) {
  const wrapper: any = (...args: any[]) => untrack(func, ...args);
  return wrapper as T;
}
