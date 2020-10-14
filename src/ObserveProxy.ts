/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { LoseProxy } from "./LoseProxy";
import { ObserveConfig } from "./ObserveConfig";
import { ObserveState } from "./ObserveState";
import { Symbols } from "./Symbols";
import { ObserveEvent, publish } from "./ObserveBus";
import { isObject, isValidKey, isValidValue } from "./Util";
import { observeInfo } from "./ObserveInfo";
import { verifyStrictMode } from "./ObserveAction";

export const ObserveProxy = (() => {
  if (typeof Proxy !== "undefined") return LoseProxy;
  return ObserveConfig.mode === "proxy" ? Proxy : LoseProxy;
})();

export function createProxy<T extends object>(target: T): T {
  const info = observeInfo(target);
  if (info.proxy) return info.proxy;
  info.proxy = new ObserveProxy(target, {
    get(target: any, member: string | number | symbol) {
      if (member === Symbols.IsProxy) return true;
      const value = target[member];
      if (!isValidKey(member) || !isValidValue(value)) return value;
      const wrappedValue = isObject(value) ? createProxy(value) : value;
      if (!ObserveState.get) return wrappedValue;
      publish(ObserveEvent.get, { id: info.id, member, value });
      return wrappedValue;
    },
    set(target: any, member: string | number | symbol, value: any) {
      verifyStrictMode();
      if (target[member] === value) return true;
      target[member] = value;
      if (!ObserveState.set) return true;
      if (!isValidKey(member) || !isValidValue(value)) return false;
      publish(ObserveEvent.set, { id: info.id, member, value });
      return true;
    }
  }) as any;
  return info.proxy;
}
