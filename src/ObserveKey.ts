/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveData } from "./ObserveData";

export function ObserveKey(data: ObserveData) {
  return data.id + "." + (data.member as string);
}
