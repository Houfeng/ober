/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveData } from "./ObserveData";

export function ObserveKey(data: ObserveData) {
  const { id, member } = data;
  return `${id}.${String(member)}`;
}
