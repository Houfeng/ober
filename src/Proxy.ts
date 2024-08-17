/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  define,
  isArray,
  isFunction,
  logWarn,
  shouldAutoProxy,
} from "./util";
import {
  ObjectMember,
  isArrowFunction,
  isBindRequired,
  isObject,
  isValidKey,
} from "./util";
import { getOwnDescriptor, getValue, setValue } from "./Reflect";

import { ObserveConfig } from "./ObserveConfig";
import { assertStrictMode } from "./Action";
import { createLowProxy } from "./ProxyShim";
import { emitChange } from "./EventBus";
import { observeInfo } from "./ObserveInfo";
import { emitCollect } from "./Collector";
import { $BoundFunction, $Identify } from "./Symbols";

const isNativeProxySupported = typeof Proxy !== void 0;

function createNativeProxy<T extends object>(
  target: T,
  handler: ProxyHandler<T>,
): T {
  return new Proxy(target, handler);
}

const createProxyInstance = (() => {
  const { mode } = ObserveConfig;
  if (mode === "proxy" && !isNativeProxySupported) {
    logWarn(
      [
        "Proxy mode has been specified, but the current environment",
        "does not support proxy and has been downgraded to property mode",
      ].join(" "),
    );
  }
  return mode === "property" || !isNativeProxySupported
    ? createLowProxy
    : createNativeProxy;
})();

function isNativeProxy() {
  return createNativeProxy === createProxyInstance;
}

function useBoundMethod(
  target: any,
  member: string,
  value: AnyFunction,
  receiver: any,
) {
  if ((value as any)[$BoundFunction]) return value;
  const boundMethod = value.bind(receiver);
  define(boundMethod, $BoundFunction, true);
  define(target, member, boundMethod);
  return boundMethod;
}

function isSetArrayLength(target: any, member: ObjectMember) {
  return isArray(target) && member === "length";
}

export function createProxy<T extends object>(target: T): T {
  if (!isObject(target)) return target;
  const info = observeInfo(target);
  if (info.proxy) return info.proxy;
  //创建 proxy
  info.proxy = createProxyInstance(target, {
    //获取 descriptor 时
    getOwnPropertyDescriptor(target: any, member: ObjectMember) {
      if (member === $Identify) {
        return { configurable: true, enumerable: false, value: "Observable" };
      }
      return getOwnDescriptor(target, member);
    },
    //读到数据时
    get(target: any, member: ObjectMember, receiver: any) {
      const value = getValue(target, member, receiver);
      if (!isValidKey(member)) return value;
      if (isNativeProxy() && isArrowFunction(value)) {
        throw new Error(`Cannot have arrow function: ${member}`);
      }
      if (isBindRequired(value)) {
        return useBoundMethod(target, member, value, receiver);
      }
      if (isFunction(value)) return value;
      const proxy = shouldAutoProxy(value) ? createProxy(value) : value;
      emitCollect({ id: info.id, member, value });
      return proxy;
    },
    //更新数据时
    set(target: any, member: ObjectMember, value: any, receiver: any) {
      assertStrictMode();
      if (info.shadow[member] === value && !isSetArrayLength(target, member)) {
        return true;
      }
      setValue(target, member, value, receiver);
      info.shadow[member] = value;
      if (!isValidKey(member)) return true;
      emitChange({ id: info.id, member, value });
      return true;
    },
  }) as any;
  return info.proxy;
}
