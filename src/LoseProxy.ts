/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveEvent, publish } from "./ObserveBus";
import { untrack } from "./ObserveTrack";
import { isValidKey, isValidValue, define, isArray, isObject } from "./Util";
import { observeInfo } from "./ObserveInfo";
import { verifyStrictMode } from "./ObserveAction";

export function createObservableMember<T extends object>(
  target: T,
  member: string | number | symbol,
  handler: ProxyHandler<T>
) {
  if (!target || !isValidKey(member)) return;
  const desc = Object.getOwnPropertyDescriptor(target, member);
  if (!desc || !("value" in desc) || !isValidValue(desc.value)) return;
  const { shadow } = observeInfo(target);
  if (!(member in shadow)) shadow[member] = desc.value;
  Object.defineProperty(target, member, {
    get() {
      const value = handler.get
        ? handler.get(shadow, member, shadow)
        : shadow[member];
      return isArray(value) ? createObservableArray(value, handler) : value;
    },
    set(value) {
      const success = handler.set && handler.set(shadow, member, value, shadow);
      if (!success) shadow[member] = value;
    },
    configurable: true,
    enumerable: true
  });
}

export function createObservableObject<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  if (!isObject(target)) return target;
  const info = observeInfo(target);
  if (info.isWrappedObject) return target;
  info.isWrappedObject = true;
  Object.keys(target).forEach((member: string) => {
    createObservableMember(target, member, handler);
  });
  return target;
}

export function createObservableArray<T extends object>(
  target: T,
  handler: ProxyHandler<T>
) {
  const info = observeInfo(target);
  const { id, isWrappedArray } = info;
  publish(ObserveEvent.get, { id, member: "length", value: target });
  if (!isArray(target) || isWrappedArray) return target;
  info.isWrappedArray = true;
  const triggerMember = (member: string | number, value: any) =>
    publish(ObserveEvent.set, { id, member, value });
  const triggerWhole = () => triggerMember("length", target);
  const { push, pop, shift, unshift, splice, reverse } = Array.prototype;
  define(target, "push", function(...args: any[]) {
    verifyStrictMode();
    const start = this.length;
    const result = untrack(() => push.apply(this, args));
    for (let i = start; i < this.length; i++) {
      createObservableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return result;
  });
  define(target, "pop", function(...args: any[]) {
    verifyStrictMode();
    const item = untrack(() => pop.apply(this, args));
    triggerMember(this.length, item);
    triggerWhole();
    return item;
  });
  define(target, "unshift", function(...args: any[]) {
    verifyStrictMode();
    const result = untrack(() => unshift.apply(this, args));
    for (let i = 0; i < args.length; i++) {
      createObservableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return result;
  });
  define(target, "shift", function(...args: any[]) {
    verifyStrictMode();
    const item = untrack(() => shift.apply(this, args));
    triggerMember(0, item);
    triggerWhole();
    return item;
  });
  define(target, "splice", function(
    start: number,
    count: number,
    ...items: any[]
  ) {
    verifyStrictMode();
    const delItems = untrack(() => splice.call(this, start, count, ...items));
    const insertEndIndex = start + (items ? items.length : 0);
    for (let i = start; i < insertEndIndex; i++) {
      createObservableMember(this, i, handler);
      triggerMember(i, this[i]);
    }
    triggerWhole();
    return delItems;
  });
  define(target, "reverse", function(...args: any[]) {
    verifyStrictMode();
    const result = untrack(() => reverse.apply(this, args));
    this.forEach((item: any, index: number) => triggerMember(index, item));
    triggerWhole();
    return result;
  });
  return target;
}

export class LoseProxy<T extends object> {
  constructor(target: T, handler: ProxyHandler<T>) {
    if (isObject(target)) return createObservableObject(target, handler);
    else throw new Error("Invalid LoseProxy target");
  }
}
