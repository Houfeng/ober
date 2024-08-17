/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { define, hasOwn, isArray, isObject } from "./util";

import { $Observable } from "./Symbols";

export type ObserveInfo<T extends object> = {
  /** 当前对象唯一标识 */
  id: string;
  /** 当前对象的 Proxy 对象，如果是 property 模式 proxy 是自身 */
  proxy: T;
  /** 当前对象的 shadow 对象，如果是 proxy 模式 shadow 无用 */
  shadow: any;
  /** Property 模式，标记对象类型为 object **/
  object: boolean;
  /** Property 模式，标记对象类型为 array **/
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
