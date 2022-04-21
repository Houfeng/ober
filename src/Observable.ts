/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { NativeProxy, createProxy, getProxyClass } from "./ObserveProxy";
import { define, hasOwn, isFunction, isObject, isProxy } from "./Util";

import { Symbols } from "./Symbols";

export type AnyClass = (new (...args: any[]) => any) & {
  displayName?: string;
};

export function isNativeProxy() {
  return NativeProxy === getProxyClass();
}

export function observable<T = any>(target: T): T {
  if (isProxy(target)) {
    return target;
  } else if (isFunction<AnyClass>(target)) {
    const ObservableClass = class extends target {
      constructor(...args: any[]) {
        super(...args);
        if (this.constructor !== ObservableClass) return this;
        // ---- 这个分支下的处理，用来使类成员方法为箭头函数时，也能响应 ----
        if (isNativeProxy()) {
          const newProto = Object.create(Object.getPrototypeOf(this));
          const attachProperty = (
            proxyProto: any,
            key: string | number | symbol
          ) => {
            if (hasOwn(this, key)) return;
            Object.defineProperty(this, key, {
              enumerable: true,
              get: () => proxyProto[key],
              set: (value: any) => (proxyProto[key] = value)
            });
          };
          const proxyProto = createProxy(newProto, {
            set: member => {
              attachProperty(proxyProto, member);
            }
          });
          Object.getOwnPropertyNames(this).forEach(key => {
            const descriptor = Object.getOwnPropertyDescriptor(this, key);
            Object.defineProperty(newProto, key, descriptor);
            delete this[key];
            attachProperty(proxyProto, key);
          });
          define(this, Symbols.Proxy, true);
          Object.setPrototypeOf(this, proxyProto);
          return this;
        }
        // ----------------------------------------------------------
        return createProxy(this);
      }
    };
    define(ObservableClass, "name", target.name);
    if (target.displayName) {
      define(ObservableClass, "displayName", target.displayName);
    }
    define(ObservableClass, Symbols.Proxy, true);
    return ObservableClass;
  } else if (isObject(target)) {
    // proxy object
    return createProxy(target);
  } else {
    // others
    return target;
  }
}
