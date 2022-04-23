/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ReactiveDestroy, reactivable } from "./ObserveReactive";

import { AnyFunction } from "./Util";

export function autorun<T extends AnyFunction>(fn: T): ReactiveDestroy {
  const wrapper = reactivable(fn);
  wrapper();
  return wrapper.destroy;
}
