/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyClass,
  AnyFunction,
  AnyObject,
  define,
  isFunction,
  isObject,
} from "./util";

import { createProxy } from "./Proxy";
import { $Identify, $Observable } from "./Symbols";
import { getOwnValue } from "./util";

const mark = "Observable";

export function isObservable(target: unknown) {
  if (!isObject(target) && !isFunction(target)) return false;
  return (
    getOwnValue(target, $Identify) === mark ||
    !!getOwnValue(target, $Observable)
  );
}

/**
 * 创建一个可观察对象或类型
 *
 * ★ 也可作为类装饰器 @observable 使用，作类装饰器同时兼容 Stage-3/legacy 规范
 *
 * @param target 原始对象或类，也可以是一个返回对象的工场函数
 * @returns 可观察对象或类（类实列将自动是可观察的）
 */
export function observable<T = AnyObject | AnyClass | AnyFunction>(
  target: T,
): T {
  if (isObservable(target)) {
    return target;
  } else if (isFunction<AnyClass>(target)) {
    // 从 v9 开始不再提供 es5 版本，恢复直接 extends（无论原生类或 Function）
    class ObservableClass extends target {
      constructor(...args: any[]) {
        super(...args);
        if (this.constructor !== ObservableClass) return;
        return createProxy(this);
      }
    }
    define(ObservableClass, "name", target.name);
    define(ObservableClass, $Identify, mark);
    return ObservableClass;
  } else if (isObject(target)) {
    return createProxy(target);
  } else {
    return target;
  }
}
