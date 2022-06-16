/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";

export type ObserveListener<T> = {
  (data: T): any;
  dependencies?: Array<string>;
};

export type ObserveEvents = {
  change: ObserveListener<ObserveData>;
  // 在最后一个监听移除时触发
  unref: ObserveListener<ObserveData>;
  // 在第一个监听建立时触发
  ref: ObserveListener<ObserveData>;
};

export type ObserveEventNames = keyof ObserveEvents;
