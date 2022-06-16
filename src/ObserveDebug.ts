/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveEventNames, ObserveEvents } from "./ObserveEvents";
import { log, table } from "./ObserveLogger";

import { ObserveData } from "./ObserveData";
import { ReactiveCurrent } from "./ObserveReactive";
import { isFunction } from "./ObserveUtil";
import { nextTick } from "./ObserveTick";

/**
 * 获取当前 reactive 依赖的数据（状态），并在控制台显示
 * 不要在生产环境使用，请在部署在生产环境前移除。
 * @param subject 摘要信息或自定义 take 函数
 */
export function takeDependencies(
  subject?: string | ((deps: string[]) => void)
) {
  const reactiver = ReactiveCurrent.value;
  nextTick(() => {
    if (!reactiver || !reactiver.dependencies) return;
    const list = Array.from(reactiver.dependencies || []);
    if (isFunction(subject)) subject(list);
    if (subject) log(`%c${subject as string}`, "color:red;");
    return table(list);
  });
}

type ObserveSpy<T extends ObserveEventNames = ObserveEventNames> = {
  publish?: (
    type: T,
    data: ObserveData,
    listeners: ArrayLike<ObserveEvents[T]>
  ) => void;
  subscribe?: (type: T, listener: ObserveEvents[T]) => void;
  unsubscribe?: (type: T, listener: ObserveEvents[T]) => void;
};

export const ObserveSpy: ObserveSpy = {};
