/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveConfig, ObserveMode, checkStrictMode } from "./ObserveConfig";
import { ObserveError, ObserveText } from "./ObserveError";
import { ObserveEvent, publish } from "./ObserveBus";
import {
  isArray,
  isObject,
  isProxy,
  isSetLength,
  isSymbol,
  isValidKey,
  isValidValue,
  undef,
} from "./ObserveUtil";

import { LowProxy } from "./ObserveShim";
import { ObserveReflect } from "./ObserveReflect";
import { ObserveState } from "./ObserveState";
import { ObserveSymbols } from "./ObserveSymbols";
import { observeInfo } from "./ObserveInfo";

export const NativeProxy = typeof Proxy !== undef ? Proxy : null;

export function getProxyClass() {
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
    !isSymbol(member) &&
    !(member in target) &&
    !isNaN(member) &&
    !isArray(target)
  );
}

export interface ProxyTraps {
  get?: (member: string | number | symbol) => any;
  set?: (member: string | number | symbol, value?: any) => any;
}

export function createProxy<T extends object>(
  target: T,
  traps?: ProxyTraps
): T {
  if (isProxy(target)) return target;
  const info = observeInfo(target);
  if (!info) return target;
  if (info.proxy) return info.proxy;
  const ObserveProxy = getProxyClass();
  if (!ObserveProxy) {
    const { mode } = ObserveConfig;
    throw ObserveError(`Current environment does not support '${mode}'`);
  }
  info.proxy = new ObserveProxy(target, {
    getOwnPropertyDescriptor(target: any, member: string | number | symbol) {
      if (member === ObserveSymbols.Proxy) {
        return { configurable: true, enumerable: false, value: true };
      }
      return Object.getOwnPropertyDescriptor(target, member);
    },

    get(target: any, member: string | number | symbol, receiver: any) {
      const value = ObserveReflect.get(target, member, receiver);
      if (!isValidKey(member) || !isValidValue(value)) return value;
      const wrappedValue = isObject(value) ? createProxy(value) : value;
      if (!ObserveState.get) return wrappedValue;
      publish(ObserveEvent.get, { id: info.id, member, value });
      if (traps && traps.get) traps.get(member);
      return wrappedValue;
    },

    set(
      target: any,
      member: string | number | symbol,
      value: any,
      receiver: any
    ) {
      checkStrictMode();
      if (info.shadow[member] === value && !isSetLength(target, member)) {
        return true;
      }
      if (isUninitializedMember(target, member)) {
        console.error(ObserveText(`Uninitialized member '${String(member)}'`));
        console.error(ObserveText(`Target Object`), target);
      }
      ObserveReflect.set(target, member, value, receiver);
      info.shadow[member] = value;
      if (!ObserveState.set) return true;
      if (!isValidKey(member) || !isValidValue(value)) return true;
      publish(ObserveEvent.set, { id: info.id, member, value });
      if (traps && traps.set) traps.set(member, value);
      return true;
    },
  }) as any;
  return info.proxy;
}
