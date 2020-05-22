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
import { disableObserve, enableObserve } from "./ObserveState";

export function track(func: Function, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = (data: ObserveData) => {
    dependencies.add(ObserveKey(data));
  };
  subscribe("get", collect);
  const result = func(...args);
  unsubscribe("get", collect);
  const count = dependencies && dependencies.size;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(
      `A single function has ${count} dependencies to confirm whether there is a performance problem`
    );
  }
  return { result, dependencies };
}

export function untrack(func: Function, ...args: any[]) {
  if (!func) return;
  disableObserve();
  const result = func(...args);
  enableObserve();
  return result;
}

export function untrackable(func: Function) {
  return (...args: any) => untrack(func, ...args);
}

export interface Trackable {
  dependencies?: Set<string>;
  destroy?: Function;
  (): any;
}

export function trackable(func: Function, onUpdate: Function) {
  let onSet: ObserveHandler;
  let wapper: Trackable;
  wapper = () => {
    unsubscribe("set", onSet);
    const { result, dependencies } = track(func);
    wapper.dependencies = dependencies;
    onSet.dependencies = dependencies;
    subscribe("set", onSet);
    return result;
  };
  onSet = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    if (!wapper.dependencies.has(ObserveKey(data))) return;
    if (onUpdate) onUpdate(data);
  };
  wapper.destroy = () => unsubscribe("set", onSet);
  return wapper;
}
