/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { Member, isProxy } from "./ObserveUtil";

export const ObserveReflect = {
  getDescriptor(target: any, key: Member): PropertyDescriptor | undefined {
    if (!target) return;
    return (
      Object.getOwnPropertyDescriptor(target, key) ||
      this.getDescriptor(Object.getPrototypeOf(target), key)
    );
  },

  get(target: any, key: Member, receiver: any) {
    if (!isProxy(receiver) || target === receiver) {
      return target[key];
    }
    const descriptor = this.getDescriptor(target, key);
    if (descriptor && descriptor.get) {
      return descriptor.get.call(receiver);
    } else {
      return target[key];
    }
  },

  set(target: any, key: Member, value: any, receiver: any) {
    if (!isProxy(receiver) || target === receiver) {
      target[key] = value;
      return;
    }
    const descriptor = this.getDescriptor(target, key);
    if (descriptor && descriptor.set) {
      descriptor.set.call(receiver, value);
    } else {
      target[key] = value;
    }
  },
};
