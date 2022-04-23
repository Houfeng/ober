/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";

export interface ObserveHandler {
  dependencies?: Set<string>;
  (data: ObserveData): any;
}

export interface ObserveHandlerMap {
  [key: string]: Set<ObserveHandler>;
}

export interface ObserveHandlerStore {
  [name: string]: ObserveHandlerMap;
}
