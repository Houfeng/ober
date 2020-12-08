/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { Symbols } from "./Symbols";

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNumber(value: any): value is number {
  return typeof value === "number";
}

export function isObject(value: any): value is object {
  return !isNullOrUndefined(value) && typeof value === "object";
}

export function isArray(value: any) {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function isFunction<T = Function>(value: any): value is T {
  return typeof value === "function";
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

export function isSymbol(value: any): value is Symbol | string {
  return (
    typeof value === "symbol" ||
    (isString(value) && /^Symbol\([\s\S]+\)$/.test(value))
  );
}

export function isPrivateKey(value: any): value is string {
  return isString(value) && value.substr(0, 2) === "__";
}

export function define(target: any, member: string | symbol, value: any) {
  Object.defineProperty(target, member, {
    configurable: true,
    enumerable: false,
    value
  });
}

export function isValidKey(key: any): key is string {
  return (
    (isString(key) || isNumber(key)) && !isSymbol(key) && !isPrivateKey(key)
  );
}

export function isDomNode(value: any) {
  return typeof Node !== "undefined" && value instanceof Node;
}

export function isEventTarget(value: any) {
  return typeof EventTarget !== "undefined" && value instanceof EventTarget;
}

export function isError(value: any) {
  return typeof Error !== "undefined" && value instanceof Error;
}

export function isDOMError(value: any) {
  return typeof DOMError !== "undefined" && value instanceof DOMError;
}

export function isEvent(value: any) {
  return typeof Event !== "undefined" && value instanceof Event;
}

export function isPromise(value: any) {
  return typeof Promise !== "undefined" && value instanceof Promise;
}

export function isDate(value: any) {
  return typeof Date !== "undefined" && value instanceof Date;
}

export function isURL(value: any) {
  return typeof URL !== "undefined" && value instanceof URL;
}

export function isValidValue(value: any): value is any {
  return (
    !isFunction(value) &&
    !isSymbol(value) &&
    !isDomNode(value) &&
    !isError(value) &&
    !isPromise(value) &&
    !isEvent(value) &&
    !isEventTarget(value) &&
    !isURL(value) &&
    !isDOMError(value)
  );
}

export function isSetLength(target: any, member: string | number | symbol) {
  return isArray(target) && member === "length";
}

export const hasOwn = (target: any, member: string | number | symbol) => {
  return Object.prototype.hasOwnProperty.call(target, member);
};

export const getOwnValue = (target: any, member: string | number | symbol) => {
  if (!hasOwn(target, member)) return;
  return target[member];
};

export function isProxy(target: any) {
  return !!(target && hasOwn(target, Symbols.Proxy));
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
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  // tslint:disable-next-line
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}
