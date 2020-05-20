/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { autorun } from "./AutoRun";
import { isObject } from "./Util";
import { WatchInitialSymbol } from "./Symbols";

const hasOwn = Object.prototype.hasOwnProperty;

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
  // tslint:disable-next-line
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

export function watch(clac: Function, handler: Function, immed = false) {
  let prev: any = WatchInitialSymbol;
  return autorun(() => {
    const result = clac();
    const next = isObject(result) ? { ...result } : result;
    if (!shallowEqual(next, prev) && (prev !== WatchInitialSymbol || immed)) {
      handler();
    }
    prev = next;
  });
}
