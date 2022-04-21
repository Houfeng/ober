/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isObject, shallowEqual } from "./Util";

import { Symbols } from "./Symbols";
import { autorun } from "./AutoRun";

export function watch(selector: () => any, handler: () => void, immed = false) {
  let prevResult: any = Symbols.Nothing;
  return autorun(() => {
    const result = selector();
    const latestResult = isObject(result) ? { ...result } : result;
    if (
      !shallowEqual(latestResult, prevResult) &&
      (prevResult !== Symbols.Nothing || immed)
    ) {
      handler();
    }
    prevResult = latestResult;
  });
}
