/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

export class ReflectShim {
  static getOwnPropertyDescriptor(
    target: any,
    property: PropertyKey,
  ): PropertyDescriptor | undefined {
    return Object.getOwnPropertyDescriptor(target, property);
  }

  private static getPropertyDescriptor(
    target: any,
    property: PropertyKey,
  ): PropertyDescriptor | undefined {
    if (!target) return;
    return (
      this.getOwnPropertyDescriptor(target, property) ||
      this.getPropertyDescriptor(Object.getPrototypeOf(target), property)
    );
  }

  static get(target: any, property: PropertyKey, receiver: any) {
    if (target === receiver) return target[property];
    const descriptor = this.getPropertyDescriptor(target, property);
    if (descriptor && descriptor.get) {
      return descriptor.get.call(receiver);
    } else {
      return target[property];
    }
  }

  static set(target: any, property: PropertyKey, value: any, receiver: any) {
    if (target === receiver) {
      target[property] = value;
      return;
    }
    const descriptor = this.getPropertyDescriptor(target, property);
    if (descriptor && descriptor.set) {
      descriptor.set.call(receiver, value);
    } else {
      target[property] = value;
    }
  }
}
