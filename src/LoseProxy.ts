/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { publish } from "./ObserveBus";
import { untrack } from "./ObserveTrack";
import {
  ObserveSymbol,
  ReactableArraySymbol,
  ReactableShadowSymbol,
  ReactableObjectSymbol
} from "./Symbols";
import {
  isValidMember,
  isValidValue,
  defineMember,
  isArray,
  isObject
} from "./Util";

const hasOwn = Object.prototype.hasOwnProperty;

export function createShadow(target: any) {
  if (!hasOwn.call(target, ReactableShadowSymbol)) {
    defineMember(target, ReactableShadowSymbol, Object.create(null));
  }
  return target[ReactableShadowSymbol];
}

export function createReactableMember<T extends object>(
  target: T,
  member: string | number | symbol,
  handler: ProxyHandler<T>
) {
  if (!target || !isValidMember(member)) return;
  const desc = Object.getOwnPropertyDescriptor(target, member);
  if (!desc || !("value" in desc) || !isValidValue(desc.value)) return;
  const shadow = createShadow(target);
  if (!(member in shadow)) shadow[member] = (target as any)[member];
  Object.defineProperty(target, member, {
    get() {
      const value = handler.get
        ? handler.get(shadow, member, shadow)
        : shadow[member];
      if (isArray(value)) {
        const { id } = value[ObserveSymbol] || {};
        publish("get", { id, member: "length", value });
        return wrapReactableArray(value, handler);
      } else {
        return value;
      }
    },
    set(value) {
      const success = handler.set && handler.set(shadow, member, value, shadow);
      if (!success) shadow[member] = value;
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
  if (hasOwn.call(target, ReactableObjectSymbol)) return target;
  defineMember(target, ReactableObjectSymbol, true);
  Object.keys(target).forEach((member: string) => {
    createReactableMember(target, member, handler);
  });
  return target;
}

export function wrapReactableArray<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (!isArray(target) || hasOwn.call(target, ReactableArraySymbol)) {
    return target;
  }
  defineMember(target, ReactableArraySymbol, true);
  const { id } = (target as any)[ObserveSymbol] || {};
  const triggerMember = (member: string | number, value: any) =>
    publish("set", { id, member, value });
  const triggerWhole = () => triggerMember("length", target);
  const { push, pop, shift, unshift, splice, reverse } = Array.prototype;
  defineMember(target, "push", function(...args: any[]) {
    const start = this.length;
    const result = untrack(() => push.apply(this, args));
    for (let i = start; i < this.length; i++) {
      createReactableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return result;
  });
  defineMember(target, "pop", function(...args: any[]) {
    const item = untrack(() => pop.apply(this, args));
    triggerMember(this.length, item);
    triggerWhole();
    return item;
  });
  defineMember(target, "unshift", function(...args: any[]) {
    const result = untrack(() => unshift.apply(this, args));
    for (let i = 0; i < args.length; i++) {
      createReactableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return result;
  });
  defineMember(target, "shift", function(...args: any[]) {
    const item = untrack(() => shift.apply(this, args));
    triggerMember(0, item);
    triggerWhole();
    return item;
  });
  defineMember(target, "splice", function(
    start: number,
    count: number,
    ...items: any[]
  ) {
    const delItems = untrack(() => splice.call(this, start, count, ...items));
    const insertEndIndex = start + (items ? items.length : 0);
    for (let i = start; i < insertEndIndex; i++) {
      createReactableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return delItems;
  });
  defineMember(target, "reverse", function(...args: any[]) {
    const result = untrack(() => reverse.apply(this, args));
    this.forEach((item: any, index: number) => triggerMember(index, item));
    triggerWhole();
    return result;
  });
  return target;
}

export class LoseProxy<T extends object> {
  constructor(target: T, handler: ProxyHandler<T>) {
    if (isObject(target)) return createReactableObject(target, handler);
    else throw new Error("Invalid LoseProxy target");
  }
}
