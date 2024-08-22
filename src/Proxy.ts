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
  canProxy,
} from "./util";
import { needBind, isObject, isValidKey } from "./util";

import { isDevelopment, ObserveConfig } from "./ObserveConfig";
import { assertStrictMode } from "./Action";
import { ProxyShim } from "./Proxy.shim";
import { emitChange } from "./EventBus";
import { observeInfo } from "./ObserveInfo";
import { emitCollect } from "./Collector";
import { $BoundFunction, $Identify } from "./Symbols";
import { ReflectShim } from "./Reflect.shim";

const UsedReflect = typeof Reflect !== void 0 ? Reflect : ReflectShim;

const isNativeProxySupported = typeof Proxy !== void 0;

const UsedProxy = (() => {
  const { mode } = ObserveConfig;
  if (isDevelopment() && mode === "proxy" && !isNativeProxySupported) {
    logWarn(
      "Proxy mode has been specified, but the current environment",
      "does not support proxy and has been downgraded to property mode",
    );
  }
  return mode === "property" || !isNativeProxySupported ? ProxyShim : Proxy;
})();

export function isNativeProxyUsed() {
  return isNativeProxySupported && Proxy === UsedProxy;
}

function bindFunc(
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

export function createProxy<T extends object>(target: T): T {
  if (!isObject(target)) return target;
  const info = observeInfo(target);
  if (info.proxy) return info.proxy;
  // 创建 proxy
  info.proxy = new UsedProxy(target, {
    // 获取 descriptor 时
    getOwnPropertyDescriptor(target: any, member: PropertyKey) {
      if (member === $Identify) {
        return { configurable: true, enumerable: false, value: "Observable" };
      }
      return UsedReflect.getOwnPropertyDescriptor(target, member);
    },
    // 读到数据时
    get(target: any, member: PropertyKey, receiver: any) {
      const value = UsedReflect.get(target, member, receiver);
      if (!isValidKey(member)) return value;
      if (needBind(value)) return bindFunc(target, member, value, receiver);
      if (isFunction(value)) return value;
      const proxy = canProxy(value) ? createProxy(value) : value;
      emitCollect({ id: info.id, member, value });
      return proxy;
    },
    // 更新数据时
    set(target: any, member: PropertyKey, value: any, receiver: any) {
      assertStrictMode();
      const isArrLen = member === "length" && isArray(target);
      if (isNativeProxyUsed()) {
        if (!isArrLen && target[member] === value) return true;
      } else {
        const { shadow } = info;
        if (!isArrLen && shadow[member] === value) return true;
        shadow[member] = value;
      }
      UsedReflect.set(target, member, value, receiver);
      if (!isValidKey(member)) return true;
      emitChange({ id: info.id, member, value });
      return true;
    },
  }) as any;
  return info.proxy;
}
