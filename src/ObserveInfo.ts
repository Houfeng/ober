/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { define, hasOwn, isArray, isObject } from "./util";

import { $Observable } from "./Symbols";

export type ObserveInfo<T extends object> = {
  id: string;
  proxy: T;
  shadow: any;
  object: boolean;
  array: boolean;
};

export let uuid = 0;

function createObserveId(target: object) {
  const ctor: any = target?.constructor || {};
  const alias = ctor.displayName || ctor.name || "Object";
  return `${alias}_${uuid++}`;
}

export function observeInfo<T extends object = any>(
  _target: T,
): ObserveInfo<T> {
  if (!_target || !isObject(_target)) throw new Error("Invalid observe target");
  const target: any = _target;
  if (!hasOwn(target, $Observable)) {
    const id = createObserveId(target);
    const shadow = isArray(target) ? target.slice(0) : {};
    define(target, $Observable, { id, shadow });
  }
  return target[$Observable] as ObserveInfo<T>;
}
