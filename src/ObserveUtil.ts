/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { OBJ, UNDEF } from "./ObserveConstants";
import { ObserveSymbols, isSymbol } from "./ObserveSymbols";

export type AnyClass = (new (...args: any[]) => any) & {
  displayName?: string;
};

export type AnyFunction = (...args: any[]) => any;

export type AnyObject = Record<string, any>;

export type Member = string | number | symbol;

export function isString(value: any): value is string {
  return typeof value === "string";
}

function isNumber(value: any): value is number {
  return typeof value === "number";
}

export function isObject(value: any): value is object {
  return !isNullOrUndefined(value) && typeof value === OBJ;
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

function isUndefined(value: any): value is undefined {
  return value === undefined;
}

function isNull(value: any): value is null {
  return value === null;
}

export function isNullOrUndefined(value: any): value is undefined | null {
  return isNull(value) || isUndefined(value);
}

export function isPrivateKey(value: any): value is string {
  return isString(value) && value.slice(0, 2) === "__";
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

function isDomNode(value: any): value is Node {
  return typeof Node !== UNDEF && value instanceof Node;
}

function isEventTarget(value: any): value is EventTarget {
  return typeof EventTarget !== UNDEF && value instanceof EventTarget;
}

function isError(value: any): value is Error {
  return typeof Error !== UNDEF && value instanceof Error;
}

function isDOMError(value: any) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return typeof DOMError !== UNDEF && value instanceof DOMError;
}

function isEvent(value: any): value is Event {
  return typeof Event !== UNDEF && value instanceof Event;
}

function isPromise(value: any): value is Promise<any> {
  return typeof Promise !== UNDEF && value instanceof Promise;
}

function isDate(value: any): value is Date {
  return typeof Date !== UNDEF && value instanceof Date;
}

function isURL(value: any): value is URL {
  return typeof URL !== UNDEF && value instanceof URL;
}

function isMap(value: any): value is Map<any, any> {
  return typeof Map !== UNDEF && value instanceof Map;
}

function isSet(value: any): value is Set<any> {
  return typeof Set !== UNDEF && value instanceof Set;
}

function isWeakMap(value: any): value is WeakMap<any, any> {
  return typeof WeakMap !== UNDEF && value instanceof WeakMap;
}

function isWeakSet(value: any): value is WeakSet<any> {
  return typeof WeakSet !== UNDEF && value instanceof WeakSet;
}

function isExtensible(value: any) {
  return !Object.isExtensible || Object.isExtensible(value);
}

function isTypedArray(value: any) {
  return ArrayBuffer.isView(value);
}

export function isWholeValue(value: any): value is any {
  return (
    !isObject(value) ||
    !isExtensible(value) ||
    isFunction(value) ||
    isDate(value) ||
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
    isTypedArray(value) ||
    isDOMError(value)
  );
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
    typeof objA !== OBJ ||
    objA === null ||
    typeof objB !== OBJ ||
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
  value: T | undefined
): value is T {
  return value && (value as any)[ObserveSymbols.BindRequired];
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

export interface FastMap<K extends string, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  del: (key: K) => void;
}

/**
 * 原生 Map 性能相较 object 作为 map 性能有明显差距
 * 同时不需要 key 为字符串之外的类型，所以用 object 模似 map
 * @returns Map instance
 */
export function FastMap<K extends string, V>(): FastMap<K, V> {
  const store: Record<K, V | undefined> = Object.create(null);
  const get = (key: K) => store[key];
  const set = (key: K, value: V) => (store[key] = value);
  const has = (key: K) => store[key] !== void 0;
  const del = (key: K) => (store[key] = void 0);
  return { get, set, has, del };
}
