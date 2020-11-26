/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isObject, shallowEqual } from "./Util";

import { Symbols } from "./Symbols";
import { autorun } from "./AutoRun";

export function watch(calc: Function, handler: Function, immed = false) {
  let prev: any = Symbols.Nothing;
  return autorun(() => {
    const result = calc();
    const next = isObject(result) ? { ...result } : result;
    if (!shallowEqual(next, prev) && (prev !== Symbols.Nothing || immed)) {
      handler();
    }
    prev = next;
  });
}
