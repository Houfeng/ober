/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  Member,
  define,
  isArray,
  isObject,
  isValidKey,
} from "./ObserveUtil";

import { ObserveSymbols } from "./ObserveSymbols";
import { checkStrictMode } from "./ObserveStrictMode";
import { getOwnDescriptor } from "./ObserveReflect";
import { notify } from "./ObserveBus";
import { observeInfo } from "./ObserveInfo";
import { report } from "./ObserveCollect";
import { throwError } from "./ObserveLogger";

function createObservableMember<T extends object>(
  target: T,
  member: Member,
  handler: ProxyHandler<T>
) {
  if (!target || !isValidKey(member)) return;
  const desc = getOwnDescriptor(target, member);
  if (!desc || !("value" in desc)) return;
  const { shadow } = observeInfo(target);
  if (!(member in shadow)) shadow[member] = desc.value;
  Object.defineProperty(target, member, {
    get() {
      const value = handler.get
        ? handler.get(shadow, member, target)
        : shadow[member];
      return isArray(value)
        ? createObservableArray(value, handler as ProxyHandler<Array<any>>)
        : value;
    },
    set(value) {
      const success = handler.set && handler.set(shadow, member, value, target);
      if (!success) shadow[member] = value;
    },
    configurable: true,
    enumerable: true,
  });
}

function createObservableObject<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (!isObject(target)) return target;
  const info = observeInfo(target);
  if (info.isWrappedObject) return target;
  info.isWrappedObject = true;
  Object.keys(target).forEach((member: string) => {
    createObservableMember(target, member, handler);
  });
  return target;
}

function createObservableArray<T extends Array<any>>(
  target: T,
  handler: ProxyHandler<T>
) {
  const info = observeInfo(target);
  const { id, shadow, isWrappedArray } = info;
  report({ id, member: "length", value: target });
  if (!isArray(target) || isWrappedArray) return target;
  info.isWrappedArray = true;
  const methods = ["push", "pop", "shift", "unshift", "splice", "reverse"];
  methods.forEach((method: string) => {
    define(target, method, (...args: any[]) => {
      checkStrictMode();
      const func = (Array.prototype as any)[method] as AnyFunction;
      const result = func.apply(shadow, args);
      target.length = 0;
      for (let i = 0; i < shadow.length; i++) {
        target[i] = shadow[i];
        createObservableMember(target, i, handler);
      }
      notify({ id, member: "length", value: target });
      return result;
    });
  });
  return target;
}

export function createLowProxy<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (isObject(target)) {
    define(target, ObserveSymbols.Proxy, true);
    return createObservableObject(target, handler);
  } else {
    throwError("Invalid LowProxy target");
  }
}
