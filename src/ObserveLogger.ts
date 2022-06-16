/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveConfig } from "./ObserveConfig";

const { logPrefix } = ObserveConfig;

export function throwError(message: string): never {
  throw Error(`${logPrefix}: ${message}`);
}

export function log(...args: any) {
  console.log(logPrefix, ...args);
}

export function warn(...args: any) {
  console.warn(logPrefix, ...args);
}

export function error(...args: any) {
  console.error(logPrefix, ...args);
}

export function table(...args: any) {
  if (console.table) {
    console.table(...args);
  } else {
    console.log(...args);
  }
}
