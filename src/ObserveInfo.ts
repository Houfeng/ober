/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { define, hasOwn, isArray, isObject } from "./Util";

import { ObserveError } from "./ObserveError";
import { ObserveId } from "./ObserveId";
import { Symbols } from "./Symbols";

export interface ObserveInfo<T extends object> {
  id: number;
  proxy: T;
  target: T;
  shadow: any;
  isWrappedObject: boolean;
  isWrappedArray: boolean;
}

export function observeInfo<T extends object>(target: T): ObserveInfo<T> {
  if (!target || !isObject(target)) {
    throw ObserveError("Invalid observe target");
  }
  if (!hasOwn(target, Symbols.Observable)) {
    const id = ObserveId();
    /// @ts-ignore
    const shadow = isArray(target) ? target.slice(0) : {};
    define(target, Symbols.Observable, { id, shadow, target });
  }
  return (target as any)[Symbols.Observable] as ObserveInfo<T>;
}
