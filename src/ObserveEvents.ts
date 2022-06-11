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
  unref: ObserveEventHandler<ObserveData & { type?: keyof ObserveEvents }>;
};

export type ObserveEventHandlerStore = {
  [T in keyof ObserveEvents]: Map<string, Set<ObserveEvents[T]>>;
};
