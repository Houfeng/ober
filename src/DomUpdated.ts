/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveError } from "./ObserveError";
import { nextTick } from "./NextTick";

export function domUpdated(fn: (...args: any[]) => any) {
  if (typeof fn !== "function") throw ObserveError("Invalid function");
  if (typeof requestAnimationFrame !== "undefined") {
    nextTick(() => requestAnimationFrame(fn));
  } else if (typeof setTimeout !== "undefined") {
    nextTick(() => setTimeout(fn, 0));
  } else {
    nextTick(() => fn());
  }
}
