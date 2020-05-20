/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import {
  ReactableArraySymbol,
  ReactableShadowSymbol,
  ReactableObjectSymbol
} from "./Symbols";
import { defineMember, isArray, isObject } from "./Util";

export function createShadow(target: any) {
  if (!target[ReactableShadowSymbol]) {
    defineMember(target, ReactableShadowSymbol, Object.create(null));
  }
  return target[ReactableShadowSymbol];
}

export function createReactableMember<T extends object>(
  target: T,
  member: string | number | symbol,
  handler: ProxyHandler<T>
) {
  const desc = Object.getOwnPropertyDescriptor(target, member);
  if (!("value" in desc)) return;
  const shadow = createShadow(target);
  if (!(member in shadow)) shadow[member] = (target as any)[member];
  Object.defineProperty(target, member, {
    get() {
      const value = handler.get
        ? handler.get(shadow, member, shadow)
        : shadow[member];
      if (isArray(value)) {
        return wrapReactableArray(value, handler, () => {
          handler.get(this, member, this);
        });
      } else {
        return value;
      }
    },
    set(value) {
      const shadow = createShadow(this);
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
  if ((target as any)[ReactableObjectSymbol]) return target;
  defineMember(target, ReactableObjectSymbol, true);
  Object.keys(target).forEach((member: string) => {
    createReactableMember(target, member, handler);
  });
  return target;
}

export function wrapReactableArray<T extends object>(
  target: T,
  handler: ProxyHandler<T>,
  triggerParent?: Function
) {
  if (!isArray(target) || (target as any)[ReactableArraySymbol]) return target;
  defineMember(target, ReactableArraySymbol, true);
  const { push, pop, shift, unshift, splice } = Array.prototype;
  defineMember(target, "push", function() {
    const start = this.length;
    push.apply(this, arguments);
    for (let i = start; i < this.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i], this);
    }
    handler.set(this, "length", this.length, this);
    if (triggerParent) triggerParent();
  });
  defineMember(target, "pop", function() {
    const item = pop.apply(this, arguments);
    handler.set(this, this.length, item, this);
    handler.set(this, "length", this.length, this);
    if (triggerParent) triggerParent();
    return item;
  });
  defineMember(target, "unshift", function() {
    unshift.apply(this, arguments);
    for (let i = 0; i < arguments.length; i++) {
      createReactableMember(this, i, handler);
      handler.set(this, i, this[i], this);
    }
    handler.set(this, "length", this.length, this);
    if (triggerParent) triggerParent();
  });
  defineMember(target, "shift", function() {
    const item = shift.apply(this, arguments);
    handler.set(this, 0, item, this);
    handler.set(this, "length", this.length, this);
    if (triggerParent) triggerParent();
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
    if (triggerParent) triggerParent();
    return removeItems;
  });
  return target;
}

export class LoseProxy<T extends object> {
  constructor(target: T, handler: ProxyHandler<T>) {
    if (isObject(target)) return createReactableObject(target, handler);
    else throw new Error("Invalid LoseProxy target");
  }
}
