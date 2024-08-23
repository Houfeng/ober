/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ReflectShim } from "./Reflect.shim";
import { $Bind } from "./Symbols";

const UsedReflect = typeof Reflect !== "undefined" ? Reflect : ReflectShim;

export type AnyClass = (new (...args: any[]) => any) & {
  displayName?: string;
};

export type AnyFunction = (...args: any[]) => any;

export type AnyObject = Record<string, any>;

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNumber(value: any): value is number {
  return typeof value === "number";
}

export function isObject(value: any): value is object {
  return !isNullOrUndefined(value) && typeof value === "object";
}

export function isArray(value: any): value is Array<any> {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function isFunction<T = AnyFunction>(value: any): value is T {
  return typeof value === "function";
}

export function isNativeClass<T = AnyFunction>(value: any): value is T {
  return (
    isFunction(value) &&
    !UsedReflect.getOwnPropertyDescriptor(value, "prototype")?.writable
  );
}

export function isArrowFunction<T = AnyFunction>(value: any): value is T {
  return (
    isFunction(value) &&
    value.prototype === undefined &&
    value.toString().indexOf("=>") > 0
  );
}

function isUndefined(value: any): value is undefined {
  return value === undefined;
}

function isNull(value: any): value is null {
  return value === null;
}

export function isNullOrUndefined(value: any): value is undefined | null {
  return isNull(value) || isUndefined(value);
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
  const ctor = key.constructor;
  return (
    (ctor === Number || (ctor === String && key.indexOf("__") !== 0)) &&
    ctor !== Symbol
  );
}

export function isExtensible(value: any) {
  return !Object.isExtensible || Object.isExtensible(value);
}

export function isSealed(value: any) {
  return Object.isSealed && Object.isSealed(value);
}

export const hasOwn = (target: any, member: PropertyKey) => {
  if (Object.hasOwn) return Object.hasOwn(target, member);
  return Object.prototype.hasOwnProperty.call(target, member);
};

export const getOwnValue = (target: any, member: PropertyKey) => {
  if (!hasOwn(target, member)) return;
  return target[member];
};

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
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

export function canAutoProxy(value: any): value is any {
  if (!value) return false;
  const ctor = value.constructor;
  return (!ctor || ctor === Object || ctor === Array) && isExtensible(value);
}

export function needBind<T extends AnyFunction>(
  value: T | undefined,
): value is T {
  return value && (value as any)[$Bind];
}

export type Ref<T> = { value?: T };

export type DecoratorContext = {
  kind: string;
  name: string | symbol;
  access: {
    get?(): unknown;
    set?(value: unknown): void;
  };
  isPrivate?: boolean;
  isStatic?: boolean;
  addInitializer?(initializer: () => void): void;
};

export function isDecoratorContext(value: any): value is DecoratorContext {
  return value && value.kind && value.name;
}

export function logError(...args: any) {
  if (typeof console !== "undefined") {
    console.error(...args);
  }
}

export function logWarn(...args: any) {
  if (typeof console !== "undefined") {
    console.warn(...args);
  }
}

export function logInfo(...args: any) {
  if (typeof console !== "undefined") {
    console.info(...args);
  }
}

export function logTable(...args: any) {
  if (typeof console !== "undefined") {
    console.table(...args);
  }
}
