/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { define, hasOwn, isArray, isObject } from "./ObserveUtil";

import { ObserveError } from "./ObserveError";
import { ObserveId } from "./ObserveId";
import { ObserveSymbols } from "./ObserveSymbols";

export interface ObserveInfo<T extends object> {
  id: string;
  proxy: T;
  target: T;
  shadow: any;
  isWrappedObject: boolean;
  isWrappedArray: boolean;
}

export function observeInfo<T extends object = any>(
  _target: T
): ObserveInfo<T> {
  if (!_target || !isObject(_target)) {
    throw ObserveError("Invalid observe target");
  }
  const target: any = _target;
  if (!hasOwn(target, ObserveSymbols.Observable)) {
    const specified =
      target?.[ObserveSymbols.DisplayName] || target?.__displayName;
    const ctor: any = target?.constructor || {};
    const alias = specified || ctor.displayName || ctor.name || "Object";
    const id = `${alias}_${ObserveId()}`;
    const shadow = isArray(target) ? target.slice(0) : {};
    define(target, ObserveSymbols.Observable, { id, shadow, target });
  }
  return target[ObserveSymbols.Observable] as ObserveInfo<T>;
}
