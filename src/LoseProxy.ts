import { LoseProxyShadowSymbol, ArrayWrapedSymbol } from "./Symbols";
import { defineMember, isObject, isArray } from './Util';

export interface LoseProxyHandler {
  get: (target: any, member: string | number | symbol) => any;
  set: (target: any, member: string | number | symbol, value: any) => boolean;
}

export function createShadow(target: any) {
  if (!target[LoseProxyShadowSymbol]) {
    target[LoseProxyShadowSymbol] = Object.create(null);
  }
  return target[LoseProxyShadowSymbol];
}

export function createReactableMember(
  target: any,
  member: string | number | symbol,
  handler: LoseProxyHandler
) {
  Object.defineProperty(target, member, {
    get() {
      const shadow = createShadow(this);
      const value = shadow[member]
      handler.get(this, member);
      return isArray(value) || isObject(value) ? new LoseProxy(target, handler) : value;
    },
    set(value) {
      const shadow = createShadow(this);
      shadow[member] = value;
      handler.set(this, member, value);
    },
    configurable: true,
    enumerable: true
  });
}

export function createReactableObject(target: any, handler: LoseProxyHandler) {
  if (!isObject(target)) return target;
  Object.keys(target).forEach((member: string) => {
    const desc = Object.getOwnPropertyDescriptor(target, member);
    if (!("value" in desc)) return;
    createReactableMember(target, member, handler);
  });
  return target;
}

export function createReactableArray(target: any[], handler: LoseProxyHandler) {
  if (!isArray(target) || (target as any)[ArrayWrapedSymbol]) return target;
  defineMember(target, ArrayWrapedSymbol, true);
  createReactableObject(target, handler);
  const { push, pop, shift, unshift, splice } = Array.prototype;
  defineMember(target, "push", function () {
    const start = this.length;
    push.apply(this, arguments);
    for (let i = start; i < this.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i]);
    }
    handler.set(this, "length", this.length);
  });
  defineMember(target, "pop", function () {
    const item = pop.apply(this, arguments);
    handler.set(this, this.length, item);
    handler.set(this, "length", this.length);
    return item;
  });
  defineMember(target, "unshift", function () {
    unshift.apply(this, arguments);
    for (let i = 0; i < arguments.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i]);
    }
    handler.set(this, "length", this.length);
  });
  defineMember(target, "shift", function () {
    const item = shift.apply(this, arguments);
    handler.set(this, 0, item);
    handler.set(this, "length", this.length);
    return item;
  });
  defineMember(target, "splice", function (start: number, count: number, ...items: any[]) {
    const removeItems = splice.call(this, start, count, ...items);
    for (let i = start; i < items.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i]);
    }
    handler.set(this, "length", this.length);
    return removeItems;
  });
  return target;
}

export class LoseProxy {
  constructor(target: any, handler: LoseProxyHandler) {
    if (isArray(target)) return createReactableArray(target, handler)
    else if (isObject(target)) return createReactableObject(target, handler);
    else throw new Error('Invalid LoseProxy target');
  }
}