/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  isArray,
  isFunction,
  logWarn,
  canAutoProxy,
} from "./util";
import { needBind, isObject, isValidKey } from "./util";

import { isDevelopment, ObserveConfig } from "./ObserveConfig";
import { assertStrictMode } from "./Action";
import { ProxyShim } from "./Proxy.shim";
import { emitChange } from "./EventBus";
import { observeInfo } from "./ObserveInfo";
import { emitCollect } from "./Collector";
import { $Identify } from "./Symbols";
import { ReflectShim } from "./Reflect.shim";

const UsedReflect = typeof Reflect !== "undefined" ? Reflect : ReflectShim;

const isNativeProxySupported = typeof Proxy !== "undefined";

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

function bind(target: any, member: string, fn: AnyFunction, receiver: any) {
  const wrapper = fn.bind(receiver);
  target[member] = wrapper;
  return wrapper;
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
      if (isFunction(value)) {
        return needBind(value) ? bind(target, member, value, receiver) : value;
      }
      const proxy = canAutoProxy(value) ? createProxy(value) : value;
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
