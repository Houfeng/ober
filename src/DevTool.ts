/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ReactiveOwner } from "./Reactive";
import { isFunction, logInfo, logTable } from "./util";
import { nextTick } from "./Tick";
import {
  type ObserveEvents,
  type ObserveEvent,
  type ObserveEventNames,
} from "./EventBus";

/**
 * 获取当前 reactive 依赖的数据（状态），并在控制台显示
 * 不要在生产环境使用，请在部署在生产环境前移除。
 * @param subject 摘要信息或自定义 take 函数
 */
export function takeDependencies(
  subject?: string | ((deps: string[]) => void),
) {
  const reactive = ReactiveOwner.current();
  nextTick(() => {
    if (!reactive || !reactive.dependencies) return;
    const list = Array.from(reactive.dependencies || []);
    if (isFunction(subject)) subject(list);
    if (subject) logInfo(`%c${subject as string}`, "color:red;");
    return logTable(list);
  });
}

type ObserveSpy<T extends ObserveEventNames = ObserveEventNames> = {
  publish?: (
    type: T,
    data: ObserveEvent,
    listeners: ArrayLike<ObserveEvents[T]>,
  ) => void;
  subscribe?: (type: T, listener: ObserveEvents[T]) => void;
  unsubscribe?: (type: T, listener: ObserveEvents[T]) => void;
};

export const spy: ObserveSpy = {};
