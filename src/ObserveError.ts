/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveConfig } from "./ObserveConfig";

export function ObserveText(message: string) {
  return `${ObserveConfig.logPrefix}: ${message}`;
}

export function ObserveError(message: string) {
  return new Error(ObserveText(message));
}
