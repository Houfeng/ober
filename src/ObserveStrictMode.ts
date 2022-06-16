/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveConfig } from "./ObserveConfig";
import { ObserveFlags } from "./ObserveFlags";
import { throwError } from "./ObserveLogger";

export function checkStrictMode() {
  if (ObserveConfig.strict && !ObserveFlags.action) {
    throwError("Strict mode change model, must be in action");
  }
}
