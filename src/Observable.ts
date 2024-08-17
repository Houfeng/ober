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
  isArrowFunction,
  isFunction,
  isObject,
  logError,
} from "./util";

import { createProxy, isNativeProxyUsed } from "./Proxy";
import { $Identify, $Observable } from "./Symbols";
import { getOwnValue } from "./util";

const OB_MARK = "Observable";

export function isObservable(target: unknown) {
  if (!isObject(target) && !isFunction(target)) return false;
  return (
    getOwnValue(target, $Identify) === OB_MARK ||
    !!getOwnValue(target, $Observable)
  );
}

function checkArrowFunction(target: unknown) {
  // 只检查加了将要加 observable 的类
  if (!isNativeProxyUsed() || !isObject(target)) return;
  Object.entries(target).some(([key, value]) => {
    if (isArrowFunction(value)) {
      return logError(
        `Cannot have arrow function '${key}',`,
        `The bind decorator (also a high-order function)`,
        `should be used to mark the method as bound to this`,
      );
    }
  });
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
        // 只直接通过当前类他建实例时，才生成 Observable 实例
        if (this.constructor !== ObservableClass) return;
        // 如果是开发模式 & 使用了 Native proxy，检查类中是否使用了箭头函数
        checkArrowFunction(this);
        // ----
        return createProxy(this);
      }
    }
    define(ObservableClass, "name", target.name);
    define(ObservableClass, $Identify, OB_MARK);
    return ObservableClass;
  } else if (isObject(target)) {
    // 如果是开发模式 & 使用了 Native proxy，检查类中是否使用了箭头函数
    checkArrowFunction(target);
    return createProxy(target);
  } else {
    return target;
  }
}
