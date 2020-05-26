/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { ObserveId } from "./ObserveId";
import { ObserveProxy } from "./ObserveProxy";
import { ObserveState } from "./ObserveState";
import { ObserveSymbol, ProxySymbol } from "./Symbols";
import { publish } from "./ObserveBus";
import { defineMember, isObject, isValidMember, isValidValue } from "./Util";

export interface ObserveInfo<T> {
  id: number;
  proxy: T;
  target: T;
}

const hasOwn = Object.prototype.hasOwnProperty;

export function observe<T extends object>(target: T): ObserveInfo<T> {
  if (!target || !isObject(target)) throw new Error("Invalid observe target");
  if (!hasOwn.call(target, ObserveSymbol)) {
    const id = ObserveId();
    const proxy = new ObserveProxy(target, {
      get(target: any, member: string | number | symbol) {
        if (member === ProxySymbol) return true;
        const value = target[member];
        if (!ObserveState.get) return value;
        if (!isValidMember(member) || !isValidValue(value)) return value;
        publish("get", { id, member, value });
        return isObject(value) ? observe(value).proxy : value;
      },
      set(target: any, member: string | number | symbol, value: any) {
        if (target[member] === value) return true;
        target[member] = value;
        if (!ObserveState.set) return true;
        if (!isValidMember(member) || !isValidValue(value)) return false;
        publish("set", { id, member, value });
        return true;
      }
    });
    defineMember(target, ObserveSymbol, { id, proxy, target });
  }
  return (target as any)[ObserveSymbol];
}
