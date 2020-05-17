import { observe } from "./Observe";
import { ProxySymbol } from "./Symbols";

export function observable<T extends object>(taregt: T): T {
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
