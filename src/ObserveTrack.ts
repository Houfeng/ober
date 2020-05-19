import { isPrivateKey, isSymbol } from "./Util";
import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { subscribe, unsubscribe } from "./ObserveBus";

export function track(func: Function, ...args: any[]) {
  const dependencies = new Set<string>();
  const collect = (data: ObserveData) => {
    dependencies.add(ObserveKey(data));
  };
  subscribe("get", collect);
  const result = func(...args);
  unsubscribe("get", collect);
  return { result, dependencies };
}

export interface Trackable {
  dependencies?: Set<string>;
  destory?: Function;
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
  wapper.destory = () => unsubscribe("set", onSet);
  return wapper;
}
