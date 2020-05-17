import { observe } from "./Observe";
import { ProxySymbol } from "./Symbols";

export function observable(taregt: any) {
  if (typeof taregt === "function") {
    return new Proxy(taregt, {
      get(_target, member) {
        if (member === ProxySymbol) return true;
      },
      construct(taregt, args) {
        return observe(new taregt(...args)).proxy;
      }
    });
  } else {
    return observe(taregt).proxy;
  }
}
