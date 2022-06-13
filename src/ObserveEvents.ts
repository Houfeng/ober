/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";

export interface ObserveEventHandler<T> {
  (data: T): any;
  dependencies?: Set<string>;
}

export type ObserveEvents = {
  get: ObserveEventHandler<ObserveData>;
  set: ObserveEventHandler<ObserveData>;
  // 在最后一个监听移除时触发
  unref: ObserveEventHandler<ObserveData & { type?: keyof ObserveEvents }>;
  // 在第一个监听建立时触发
  ref: ObserveEventHandler<ObserveData & { type?: keyof ObserveEvents }>;
};
