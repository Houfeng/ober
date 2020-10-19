/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { Symbols } from "./Symbols";
import { define, hasOwn, isObject, isArray } from "./Util";
import { ObserveId } from "./ObserveId";

export interface ObserveInfo<T extends object> {
  id: number;
  proxy: T;
  target: T;
  shadow: any;
  isWrappedObject: boolean;
  isWrappedArray: boolean;
}

export function observeInfo<T extends object>(target: T): ObserveInfo<T> {
  if (!target || !isObject(target)) throw new Error("Invalid observe target");
  if (!hasOwn.call(target, Symbols.Observable)) {
    const id = ObserveId();
    // @ts-ignore
    const shadow = isArray(target) ? target.slice(0) : Object.create(null);
    define(target, Symbols.Observable, { id, shadow, target });
  }
  return (target as any)[Symbols.Observable] as ObserveInfo<T>;
}
