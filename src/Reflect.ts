/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObjectMember } from "./util";

export function getOwnDescriptor(
  target: any,
  key: ObjectMember,
): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(target, key);
}

export function getDescriptor(
  target: any,
  key: ObjectMember,
): PropertyDescriptor | undefined {
  if (!target) return;
  return (
    getOwnDescriptor(target, key) ||
    getDescriptor(Object.getPrototypeOf(target), key)
  );
}

export function getValue(target: any, key: ObjectMember, receiver: any) {
  if (target === receiver) {
    return target[key];
  }
  const descriptor = getDescriptor(target, key);
  if (descriptor && descriptor.get) {
    return descriptor.get.call(receiver);
  } else {
    return target[key];
  }
}

export function setValue(
  target: any,
  key: ObjectMember,
  value: any,
  receiver: any,
) {
  if (target === receiver) {
    target[key] = value;
    return;
  }
  const descriptor = getDescriptor(target, key);
  if (descriptor && descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    target[key] = value;
  }
}
