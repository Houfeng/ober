/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export function ObserveError(message: string) {
  return new Error(`${ObserveError.prefix}: ${message}`);
}

ObserveError.prefix = "OBER";
