/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { Trackable, trackable } from "./ObserveTrack";

export function autorun<T extends Trackable>(func: T, immed = true) {
  const wrapper = trackable(func);
  if (immed !== false) wrapper();
  return wrapper;
}
