/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { observe } from "./Observe";
import { ProxySymbol } from "./Symbols";
import { ObserveConfig } from "./ObserveConfig";

export function observable<T extends object | Function>(taregt: T): T {
  if (typeof taregt === "function") {
    if (ObserveConfig.mode !== "proxy") {
      const func: any = taregt;
      const factory: any = function Class(...args: any[]) {
        return observe(new func(...args)).proxy;
      };
      return factory as T;
    }
    return new Proxy(taregt, {
      get(_target, member) {
        if (member === ProxySymbol) return true;
      },
      construct(taregt: any, args: any[]) {
        return observe(new taregt(...args)).proxy;
      }
    });
  } else {
    return observe(taregt).proxy;
  }
}
