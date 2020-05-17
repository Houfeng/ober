import { ArrayWrapedSymbol, LoseProxyShadowSymbol } from "./Symbols";
import { defineMember, isArray, isObject } from "./Util";

export function createShadow(target: any) {
  if (!target[LoseProxyShadowSymbol]) {
    target[LoseProxyShadowSymbol] = Object.create(null);
  }
  return target[LoseProxyShadowSymbol];
}

export function createReactableMember<T extends object>(
  target: T,
  member: string | number | symbol,
  handler: ProxyHandler<T>
) {
  Object.defineProperty(target, member, {
    get() {
      const shadow = createShadow(this);
      const value = shadow[member];
      handler.get(this, member, this);
      return isArray(value) || isObject(value)
        ? new LoseProxy(target, handler)
        : value;
    },
    set(value) {
      const shadow = createShadow(this);
      shadow[member] = value;
      handler.set(this, member, value, this);
    },
    configurable: true,
    enumerable: true
  });
}

export function createReactableObject<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (!isObject(target)) return target;
  Object.keys(target).forEach((member: string) => {
    const desc = Object.getOwnPropertyDescriptor(target, member);
    if (!("value" in desc)) return;
    createReactableMember(target, member, handler);
  });
  return target;
}

export function createReactableArray<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (!isArray(target) || (target as any)[ArrayWrapedSymbol]) return target;
  defineMember(target, ArrayWrapedSymbol, true);
  createReactableObject(target, handler);
  const { push, pop, shift, unshift, splice } = Array.prototype;
  defineMember(target, "push", function() {
    const start = this.length;
    push.apply(this, arguments);
    for (let i = start; i < this.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i], this);
    }
    handler.set(this, "length", this.length, this);
  });
  defineMember(target, "pop", function() {
    const item = pop.apply(this, arguments);
    handler.set(this, this.length, item, this);
    handler.set(this, "length", this.length, this);
    return item;
  });
  defineMember(target, "unshift", function() {
    unshift.apply(this, arguments);
    for (let i = 0; i < arguments.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i], this);
    }
    handler.set(this, "length", this.length, this);
  });
  defineMember(target, "shift", function() {
    const item = shift.apply(this, arguments);
    handler.set(this, 0, item, this);
    handler.set(this, "length", this.length, this);
    return item;
  });
  defineMember(target, "splice", function(
    start: number,
    count: number,
    ...items: any[]
  ) {
    const removeItems = splice.call(this, start, count, ...items);
    for (let i = start; i < items.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i], this);
    }
    handler.set(this, "length", this.length, this);
    return removeItems;
  });
  return target;
}

export class LoseProxy<T extends object> {
  constructor(target: T, handler: ProxyHandler<T>) {
    if (isArray(target)) return createReactableArray(target, handler);
    else if (isObject(target)) return createReactableObject(target, handler);
    else throw new Error("Invalid LoseProxy target");
  }
}
