/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isProxy } from "./Util";

export const ObserveReflect = {
  getPropertyDescriptor(target: any, key: string | number | symbol) {
    if (!target) return;
    return (
      Object.getOwnPropertyDescriptor(target, key) ||
      this.getPropertyDescriptor(Object.getPrototypeOf(target), key)
    );
  },

  get(target: any, key: string | number | symbol, receiver: any) {
    if (!isProxy(receiver) || target === receiver) {
      return target[key];
    }
    const descriptor = this.getPropertyDescriptor(target, key);
    if (descriptor && descriptor.get) {
      return descriptor.get.call(receiver, key);
    } else {
      return target[key];
    }
  },

  set(target: any, key: string | number | symbol, value: any, receiver: any) {
    if (!isProxy(receiver) || target === receiver) {
      target[key] = value;
      return;
    }
    const descriptor = this.getPropertyDescriptor(target, key);
    if (descriptor && descriptor.set) {
      descriptor.set.call(receiver, value);
    } else {
      target[key] = value;
    }
  }
};
