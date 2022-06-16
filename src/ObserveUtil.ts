/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { OBJ, SMBL, SUPT_SMBL } from "./ObserveConstants";

import { ObserveSymbols } from "./ObserveSymbols";

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

export function startsWith(str: string, sub: string) {
  if (!str || !sub) return false;
  return str.startsWith
    ? str.startsWith(sub)
    : str.slice && str.slice(0, sub.length) === sub;
}

export function isSymbol(value: any): value is symbol {
  return SUPT_SMBL ? typeof value === "symbol" : startsWith(value, SMBL);
}

export function isPrivateKey(value: any): value is string {
  return startsWith(value, "__");
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

export function isExtensible(value: any) {
  return !Object.isExtensible || Object.isExtensible(value);
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

export type FastMap<K extends string, V> = {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  del: (key: K) => void;
};

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
