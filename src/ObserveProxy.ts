/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { AnyFunction, define, isArray, isFunction } from "./ObserveUtil";
import {
  Member,
  isArrowFunction,
  isBindRequiredFunction,
  isObject,
  isProxy,
  isValidKey,
  isWholeValue,
} from "./ObserveUtil";
import { ObserveConfig, checkStrictMode } from "./ObserveConfig";
import { getOwnDescriptor, getValue, setValue } from "./ObserveReflect";

import { LowProxy } from "./ObserveShim";
import { ObserveError } from "./ObserveError";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveSymbols } from "./ObserveSymbols";
import { UNDEF } from "./ObserveConstants";
import { observeInfo } from "./ObserveInfo";
import { publish } from "./ObserveBus";
import { report } from "./ObserveCollect";

export const NativeProxy = typeof Proxy !== UNDEF ? Proxy : null;

function useProxyClass() {
  switch (ObserveConfig.mode) {
    case "property":
      return LowProxy;
    case "auto":
      return NativeProxy || LowProxy;
    case "proxy":
    default:
      return NativeProxy;
  }
}

function isNativeProxy() {
  return NativeProxy === useProxyClass();
}

function useBoundMethod(
  target: any,
  member: string,
  value: AnyFunction,
  receiver: any
) {
  if ((value as any)[ObserveSymbols.BoundMethod]) return value;
  const boundMethod = value.bind(receiver);
  define(boundMethod, ObserveSymbols.BoundMethod, true);
  define(target, member, boundMethod);
  return boundMethod;
}

function isSetArrayLength(target: any, member: Member) {
  return isArray(target) && member === "length";
}

export function createProxy<T extends object>(target: T): T {
  if (isProxy(target)) return target;
  const info = observeInfo(target);
  if (!info) return target;
  if (info.proxy) return info.proxy;
  const ObserveProxy = useProxyClass();
  if (!ObserveProxy) {
    const { mode } = ObserveConfig;
    throw ObserveError(`Current environment does not support '${mode}'`);
  }
  info.proxy = new ObserveProxy(target, {
    getOwnPropertyDescriptor(target: any, member: Member) {
      if (member === ObserveSymbols.Proxy) {
        return { configurable: true, enumerable: false, value: true };
      }
      return getOwnDescriptor(target, member);
    },
    get(target: any, member: Member, receiver: any) {
      const value = getValue(target, member, receiver);
      if (!isValidKey(member)) return value;
      if (isNativeProxy() && isArrowFunction(value)) {
        throw ObserveError(`Proxy mode cannot have arrow function: ${member}`);
      }
      if (isBindRequiredFunction(value)) {
        return useBoundMethod(target, member, value, receiver);
      }
      if (isFunction(value)) return value;
      const proxyValue =
        isObject(value) && !isWholeValue(value) ? createProxy(value) : value;
      report({ id: info.id, member, value });
      return proxyValue;
    },
    set(target: any, member: Member, value: any, receiver: any) {
      checkStrictMode();
      if (info.shadow[member] === value && !isSetArrayLength(target, member)) {
        return true;
      }
      setValue(target, member, value, receiver);
      info.shadow[member] = value;
      if (!ObserveFlags.set || !isValidKey(member)) return true;
      publish("set", { id: info.id, member, value });
      return true;
    },
  }) as any;
  return info.proxy;
}
