/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { observe } from "./Observe";
import { ProxySymbol } from "./Symbols";
import { ObserveConfig } from "./ObserveConfig";

export function observable<T extends object>(taregt: T): T {
  if (ObserveConfig.mode !== "proxy") return observe(taregt).proxy;
  if (typeof taregt === "function") {
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
