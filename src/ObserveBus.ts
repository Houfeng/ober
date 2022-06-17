/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { FastMap, isPrivateKey, isSymbol } from "./ObserveUtil";
import { ObserveEventNames, ObserveEvents } from "./ObserveEvents";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveSpy as spy } from "./ObserveDebug";
import { warn } from "./ObserveLogger";

const ObserveListenerStores = {
  change: FastMap<string, Set<ObserveEvents["change"]>>(),
  ref: FastMap<string, Set<ObserveEvents["ref"]>>(),
  unref: FastMap<string, Set<ObserveEvents["unref"]>>(),
};

export function subscribe<T extends ObserveEventNames>(
  type: T,
  listener: ObserveEvents[T]
) {
  const store = ObserveListenerStores[type];
  if (!store || !listener) return;
  (listener.dependencies || []).forEach((key) => {
    if (store.has(key)) {
      store.get(key)!.add(listener);
    } else {
      store.set(key, new Set([listener]));
      notifyRef(key);
    }
  });
  if (spy.subscribe) spy.subscribe(type, listener);
}

export function unsubscribe<T extends keyof ObserveEvents>(
  type: T,
  listener: ObserveEvents[T]
) {
  const store = ObserveListenerStores[type];
  if (!store || !listener) return;
  (listener.dependencies || []).forEach((key) => {
    if (!store.has(key)) return;
    const listeners = store.get(key);
    if (!listeners || !listeners.has(listener)) return;
    if (listeners.size === 1) {
      store.del(key);
      notifyUnref(key);
    } else {
      listeners.delete(listener);
    }
  });
  if (spy.unsubscribe) spy.unsubscribe(type, listener);
}

function publish<T extends ObserveEventNames>(
  type: T,
  data: Parameters<ObserveEvents[T]>[0]
) {
  const store = ObserveListenerStores[type];
  if (!store || isSymbol(data.member) || isPrivateKey(data.member)) return;
  const key = ObserveKey(data);
  const listeners = Array.from(store.get(key) || []);
  if (listeners.length > ObserveConfig.maxListeners) {
    warn(`Found ${listeners.length} listeners of ${key}`);
  }
  listeners.forEach((handler) => handler!(data));
  if (spy.publish) spy.publish(type, data, listeners);
}

function notifyUnref(key: string) {
  if (ObserveFlags.unref) {
    const [id, member] = key.split(".");
    publish("unref", { id, member });
  }
}

function notifyRef(key: string) {
  if (ObserveFlags.ref) {
    const [id, member] = key.split(".");
    publish("ref", { id, member });
  }
}

export function notify(data: ObserveData) {
  if (ObserveFlags.change) publish("change", data);
}
