/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { FastMap, isPrivateKey, isSymbol } from "./ObserveUtil";
import { ObserveEventNames, ObserveEvents } from "./ObserveEvents";
import { throwError, warn } from "./ObserveLogger";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveSpy as spy } from "./ObserveDebug";

type ObserveListenerStore = {
  [T in ObserveEventNames]: FastMap<string, Set<ObserveEvents[T]>>;
};

const ObserveListeners: Partial<ObserveListenerStore> = Object.create(null);

export function subscribe<T extends ObserveEventNames>(
  type: T,
  listener: ObserveEvents[T]
) {
  if (!listener) throwError("Invalid ObserveHandler");
  if (!type) throwError("Invalid ObserveEvent");
  if (!ObserveListeners[type]) ObserveListeners[type] = FastMap();
  (listener.dependencies || []).forEach((key) => {
    let list: Set<any> | undefined;
    if (ObserveListeners[type]!.has(key)) {
      list = ObserveListeners[type]!.get(key);
      list!.add(listener);
    } else {
      list = new Set([listener]);
      ObserveListeners[type]!.set(key, list);
    }
    if (list!.size === 1) notifyRef(key);
  });
  if (spy.subscribe) spy.subscribe(type, listener);
}

export function unsubscribe<T extends keyof ObserveEvents>(
  type: T,
  listener: ObserveEvents[T]
) {
  if (!ObserveListeners[type] || !listener) return;
  (listener.dependencies || []).forEach((key) => {
    if (!ObserveListeners[type]!.has(key)) return;
    const list = ObserveListeners[type]!.get(key);
    if (!list || !list.has(listener)) return;
    list.delete(listener);
    if (list.size < 1) notifyUnref(key);
  });
  if (spy.unsubscribe) spy.unsubscribe(type, listener);
}

function publish<T extends ObserveEventNames>(
  type: T,
  data: Parameters<ObserveEvents[T]>[0]
) {
  if (!ObserveListeners[type]) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const observeKey = ObserveKey(data);
  const listeners = Array.from(ObserveListeners[type]!.get(observeKey) || []);
  if (listeners.length > ObserveConfig.maxListeners) {
    warn(`Trigger ${listeners.length} handlers`);
  }
  if (listeners.length > 0) {
    listeners.forEach((handler) => handler!(data));
  }
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
