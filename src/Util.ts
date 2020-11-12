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

export function isFunction(value: any): value is Function {
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

export function isValidValue(value: any): value is any {
  return !isFunction(value) && !isSymbol(value);
}

export function isSetLength(target: any, member: string | number | symbol) {
  return isArray(target) && member === "length";
}

export const hasOwn = Object.prototype.hasOwnProperty;

export function isProxy(target: any) {
  return target && target[Symbols.IsProxy];
}
