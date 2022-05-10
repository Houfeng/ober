/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveSymbols } from "./ObserveSymbols";

export type AnyFunction = (...args: any[]) => any;

export type AnyClass = (new (...args: any[]) => any) & {
  displayName?: string;
};

export type Member = string | number | symbol;

export const undef = "undefined";
export const obj = "object";

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNumber(value: any): value is number {
  return typeof value === "number";
}

export function isObject(value: any): value is object {
  return !isNullOrUndefined(value) && typeof value === obj;
}

export function isArray(value: any): value is Array<any> {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function isFunction<T = AnyFunction>(value: any): value is T {
  return typeof value === "function";
}

export function isArrowFunction<T = AnyFunction>(value: any): value is T {
  return (
    isFunction(value) &&
    value.prototype === undefined &&
    value.toString().indexOf("[native code]") < 0
  );
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isNullOrUndefined(value: any): value is undefined | null {
  return isNull(value) || isUndefined(value);
}

export function isSymbol(value: any): value is symbol | string {
  return (
    typeof value === "symbol" ||
    (isString(value) && /^Symbol\([\s\S]+\)$/.test(value))
  );
}

export function isPrivateKey(value: any): value is string {
  return isString(value) && value.substr(0, 2) === "__";
}

export function define(target: any, member: string | symbol, value: any) {
  if (!isExtensible(target)) return;
  Object.defineProperty(target, member, {
    configurable: true,
    enumerable: false,
    value,
  });
}

export function isValidKey(key: any): key is string {
  return (
    (isString(key) || isNumber(key)) && !isSymbol(key) && !isPrivateKey(key)
  );
}

export function isDomNode(value: any) {
  return typeof Node !== undef && value instanceof Node;
}

export function isEventTarget(value: any) {
  return typeof EventTarget !== undef && value instanceof EventTarget;
}

export function isError(value: any) {
  return typeof Error !== undef && value instanceof Error;
}

export function isDOMError(value: any) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return typeof DOMError !== undef && value instanceof DOMError;
}

export function isEvent(value: any) {
  return typeof Event !== undef && value instanceof Event;
}

export function isPromise(value: any) {
  return typeof Promise !== undef && value instanceof Promise;
}

export function isDate(value: any) {
  return typeof Date !== undef && value instanceof Date;
}

export function isURL(value: any) {
  return typeof URL !== undef && value instanceof URL;
}

export function isMap(value: any) {
  return typeof Map !== undef && value instanceof Map;
}

export function isSet(value: any) {
  return typeof Set !== undef && value instanceof Set;
}

export function isWeakMap(value: any) {
  return typeof WeakMap !== undef && value instanceof WeakMap;
}

export function isWeakSet(value: any) {
  return typeof WeakSet !== undef && value instanceof WeakSet;
}

export function isExtensible(value: any) {
  return !Object.isExtensible || Object.isExtensible(value);
}

export function isWholeValue(value: any): value is any {
  return (
    !isObject(value) ||
    !isExtensible(value) ||
    isFunction(value) ||
    isSymbol(value) ||
    isDomNode(value) ||
    isError(value) ||
    isPromise(value) ||
    isEvent(value) ||
    isEventTarget(value) ||
    isURL(value) ||
    isMap(value) ||
    isWeakMap(value) ||
    isSet(value) ||
    isWeakSet(value) ||
    isDOMError(value)
  );
}

export function isSetLength(target: any, member: Member) {
  return isArray(target) && member === "length";
}

export const hasOwn = (target: any, member: Member) => {
  return Object.prototype.hasOwnProperty.call(target, member);
};

export const getOwnValue = (target: any, member: Member) => {
  if (!hasOwn(target, member)) return;
  return target[member];
};

export function isProxy(target: any) {
  return !!(target && hasOwn(target, ObserveSymbols.Proxy));
}

export function is(x: any, y: any) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function shallowEqual(objA: any, objB: any) {
  if (is(objA, objB)) return true;
  if (
    typeof objA !== obj ||
    objA === null ||
    typeof objB !== obj ||
    objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

export function isDevelopment() {
  return process?.env?.NODE_ENV === "development";
}

export function isBindRequiredFunction<T extends AnyFunction>(
  value: T
): value is T {
  return value && (value as any)[ObserveSymbols.BindRequired];
}

export interface Defer<T> {
  readonly promise: PromiseLike<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (error: any) => void;
}

export function Defer<T = any>(): Defer<T> {
  let resolve: Defer<T>["resolve"];
  let reject: Defer<T>["reject"];
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}