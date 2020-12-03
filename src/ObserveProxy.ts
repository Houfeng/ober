/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveConfig, ObserveMode } from "./ObserveConfig";
import { ObserveError, ObserveText } from "./ObserveError";
import { ObserveEvent, publish } from "./ObserveBus";
import {
  isArray,
  isObject,
  isSetLength,
  isValidKey,
  isValidValue
} from "./Util";

import { LowProxy } from "./LowProxy";
import { ObserveState } from "./ObserveState";
import { Symbols } from "./Symbols";
import { observeInfo } from "./ObserveInfo";
import { verifyStrictMode } from "./ObserveAction";

export const NativeProxy = typeof Proxy !== "undefined" ? Proxy : null;

function getProxyClass() {
  switch (ObserveConfig.mode) {
    case ObserveMode.property:
      return LowProxy;
    case ObserveMode.auto:
      return NativeProxy || LowProxy;
    case ObserveMode.proxy:
    default:
      return NativeProxy;
  }
}

function isUninitializedMember(target: any, member: string | symbol | number) {
  return (
    ObserveConfig.mode !== ObserveMode.proxy &&
    !(member in target) &&
    !isNaN(member as number) &&
    !isArray(target)
  );
}

export function createProxy<T extends object>(target: T): T {
  const info = observeInfo(target);
  if (info.proxy) return info.proxy;
  const ObserveProxy = getProxyClass();
  if (!ObserveProxy) {
    const { mode } = ObserveConfig;
    throw ObserveError(`Current environment does not support '${mode}'`);
  }
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
      if (target[member] === value && !isSetLength(target, member)) return true;
      if (isUninitializedMember(target, member)) {
        console.error(ObserveText(`Uninitialized member '${String(member)}'`));
        console.error(ObserveText(`Target Object`), target);
      }
      target[member] = value;
      if (!ObserveState.set) return true;
      if (!isValidKey(member) || !isValidValue(value)) return true;
      publish(ObserveEvent.set, { id: info.id, member, value });
      return true;
    }
  }) as any;
  return info.proxy;
}
