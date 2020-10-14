/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { Symbols } from "./Symbols";

export function isString(value: any) {
  return typeof value === "string";
}

export function isNumber(value: any) {
  return typeof value === "number";
}

export function isObject(value: any) {
  return !isNullOrUndefined(value) && typeof value === "object";
}

export function isArray(value: any) {
  return Array.isArray ? Array.isArray(value) : value instanceof Array;
}

export function isFunction(value: any) {
  return typeof value === "function";
}

export function isUndefined(value: any) {
  return value === undefined;
}

export function isNull(value: any) {
  return value === null;
}

export function isNullOrUndefined(value: any) {
  return isNull(value) || isUndefined(value);
}

export function isSymbol(value: any) {
  return (
    typeof value === "symbol" ||
    (isString(value) && /^Symbol\([\s\S]+\)$/.test(value))
  );
}

export function isPrivateKey(value: any) {
  return isString(value) && value.substr(0, 2) === "__";
}

export function define(target: any, member: string | symbol, value: any) {
  Object.defineProperty(target, member, {
    configurable: true,
    enumerable: false,
    value
  });
}

export function isValidKey(key: any) {
  return (
    (isString(key) || isNumber(key)) && !isSymbol(key) && !isPrivateKey(key)
  );
}

export function isValidValue(value: any) {
  return !isFunction(value) && !isSymbol(value);
}

export function throwError(err: Error) {
  throw err;
}

export const hasOwn = Object.prototype.hasOwnProperty;

export function isProxy(target: any) {
  return target && target[Symbols.IsProxy];
}
