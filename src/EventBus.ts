/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { isPrivateKey, isSymbol, logWarn, ObjectMember } from "./util";
import { ObserveConfig } from "./ObserveConfig";
import { Flag } from "./Flag";
import { FastMap } from "./FastMap";
import { spy } from "./DevTool";

/**
 * 是否触发 change 事件
 */
export const changeFlag = Flag(true);

/**
 * 是否触发 unref 事件
 */
export const unrefFlag = Flag(true);

/**
 * 是否触发 ref 事件
 */
export const refFlag = Flag(true);

export type ObserveEvent = {
  id: string;
  member: ObjectMember;
  value?: any;
};

export function ObserveKey(event: ObserveEvent) {
  return `${event.id}.${event.member as string}`;
}

export type ObserveListener = {
  (event: ObserveEvent): void;
  dependencies?: Set<string>;
};

export type ObserveEvents = {
  /**
   * 在属性值发生变化时触发
   */
  change: ObserveListener;

  /**
   * 在最后一个监听移除时触发
   */
  unref: ObserveListener;

  /**
   * 在第一个监听建立时触发
   **/
  ref: ObserveListener;
};

export type ObserveEventNames = keyof ObserveEvents;

const listenerStores = {
  change: FastMap<string, Set<ObserveEvents["change"]>>(),
  ref: FastMap<string, Set<ObserveEvents["ref"]>>(),
  unref: FastMap<string, Set<ObserveEvents["unref"]>>(),
};

export function subscribe<T extends ObserveEventNames>(
  type: T,
  listener: ObserveEvents[T],
) {
  const store = listenerStores[type];
  if (!store || !listener) return;
  (listener.dependencies || []).forEach((key) => {
    if (store.has(key)) {
      store.get(key)!.add(listener);
    } else {
      store.set(key, new Set([listener]));
      emitRef(key);
    }
  });
  spy.subscribe?.(type, listener);
}

export function unsubscribe<T extends keyof ObserveEvents>(
  type: T,
  listener: ObserveEvents[T],
) {
  const store = listenerStores[type];
  if (!store || !listener) return;
  (listener.dependencies || []).forEach((key) => {
    if (!store.has(key)) return;
    const listeners = store.get(key);
    if (!listeners || !listeners.has(listener)) return;
    if (listeners.size === 1) {
      store.del(key);
      emitUnref(key);
    } else {
      listeners.delete(listener);
    }
  });
  spy.unsubscribe?.(type, listener);
}

function publish<T extends ObserveEventNames>(
  type: T,
  data: Parameters<ObserveEvents[T]>[0],
) {
  const store = listenerStores[type];
  if (!store || isSymbol(data.member) || isPrivateKey(data.member)) return;
  const key = ObserveKey(data);
  const listeners = Array.from(store.get(key) || []);
  if (listeners.length > ObserveConfig.maxListeners) {
    logWarn(`Found ${listeners.length} listeners of ${key}`);
  }
  listeners.forEach((handler) => handler!(data));
  spy.publish?.(type, data, listeners);
}

function emitUnref(key: string) {
  if (!unrefFlag.current()) return;
  const [id, member] = key.split(".");
  publish("unref", { id, member });
}

function emitRef(key: string) {
  if (!refFlag.current()) return;
  const [id, member] = key.split(".");
  publish("ref", { id, member });
}

export function emitChange(event: ObserveEvent) {
  if (changeFlag.current()) publish("change", event);
}
