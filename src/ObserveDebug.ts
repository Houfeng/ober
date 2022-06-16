/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";
import { ObserveListener } from "./ObserveEvents";
import { ObserveText } from "./ObserveError";
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
    if (subject) {
      console.log(`%c${ObserveText(subject as string)}`, "color:red;");
    }
    return console.table ? console.table(list) : console.log(list);
  });
}

export const ObserveInspector: {
  onPublish?: (info: {
    type: string;
    data: ObserveData;
    listeners: ArrayLike<ObserveListener<any>>;
  }) => void;
  onSubscribe?: (info: {
    type: string;
    listener: ObserveListener<any>;
  }) => void;
  onUnsubscribe?: (info: {
    type: string;
    listener: ObserveListener<any>;
  }) => void;
} = {};
