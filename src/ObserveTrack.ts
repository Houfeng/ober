/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isPrivateKey, isSymbol } from "./Util";
import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { subscribe, unsubscribe } from "./ObserveBus";
import { ObserveConfig } from "./ObserveConfig";
import { ObserveState } from "./ObserveState";

export type AnyFunction = (...args: any[]) => any;

export function track<T extends AnyFunction>(func: T, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = (data: ObserveData) => {
    dependencies.add(ObserveKey(data));
  };
  subscribe("get", collect);
  ObserveState.get = true;
  const result: ReturnType<T> = func(...args);
  ObserveState.get = false;
  unsubscribe("get", collect);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(
      `A single function has ${count} dependencies to confirm whether there is a performance problem`
    );
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
    const { result, dependencies } = track(func, ...args);
    unsubscribe("set", onSet);
    wrapper.dependencies = dependencies;
    onSet.dependencies = dependencies;
    subscribe("set", onSet);
    return result;
  };
  onSet = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    if (!wrapper.dependencies) return;
    if (!wrapper.dependencies.has(ObserveKey(data))) return;
    if (onUpdate) onUpdate(data);
  };
  wrapper.destroy = () => unsubscribe("set", onSet);
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
