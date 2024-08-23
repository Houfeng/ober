/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  define,
  isNativeArray,
  isExtensible,
  isObject,
  isSealed,
  isValidKey,
  logError,
} from "./util";

import { emitChange } from "./EventBus";
import { observeInfo } from "./ObserveInfo";
import { emitCollect } from "./Collector";
import { ReflectShim } from "./Reflect.shim";

const UsedReflect = typeof Reflect !== "undefined" ? Reflect : ReflectShim;

function createObservableMember<T extends object>(
  target: T,
  member: PropertyKey,
  handler: ProxyHandler<T>,
) {
  if (!target || !isValidKey(member)) return;
  const desc = UsedReflect.getOwnPropertyDescriptor(target, member);
  if (!desc || !("value" in desc)) return;
  const { shadow } = observeInfo(target);
  if (!(member in shadow)) shadow[member] = desc.value;
  Object.defineProperty(target, member, {
    get() {
      const value = handler.get
        ? handler.get(shadow, member, target)
        : shadow[member];
      return isNativeArray(value) && isExtensible(value)
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
  handler: ProxyHandler<T>,
) {
  if (!isObject(target)) return target;
  const info = observeInfo(target);
  if (info.object) return target;
  info.object = true;
  Object.keys(target).forEach((member: string) => {
    createObservableMember(target, member, handler);
  });
  return target;
}

function createObservableArray<T extends Array<any>>(
  target: T,
  handler: ProxyHandler<T>,
) {
  const info = observeInfo(target);
  const { id, shadow, array: isWrappedArray } = info;
  emitCollect({ id, member: "length", value: target });
  if (!isNativeArray(target) || isWrappedArray) return target;
  info.array = true;
  const methods = ["push", "pop", "shift", "unshift", "splice", "reverse"];
  methods.forEach((method: string) => {
    define(target, method, (...args: any[]) => {
      if (isSealed(target)) {
        return logError(`Cannot call ${method} of sealed object:`, target);
      }
      const func = (Array.prototype as any)[method] as AnyFunction;
      const result = func.apply(shadow, args);
      target.length = 0;
      for (let i = 0; i < shadow.length; i++) {
        target[i] = shadow[i];
        createObservableMember(target, i, handler);
      }
      emitChange({ id, member: "length", value: target });
      return result;
    });
  });
  return target;
}

export const ProxyShim = class ProxyShim {
  constructor(target: any, handler: ProxyHandler<any>) {
    if (isObject(target)) {
      return createObservableObject(target, handler);
    } else {
      throw new Error("Invalid LowProxy target");
    }
  }
} as unknown as ProxyConstructor;
