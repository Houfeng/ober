/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { FastMap, isPrivateKey, isSymbol } from "./ObserveUtil";
import { ObserveError, ObserveText } from "./ObserveError";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveEvents } from "./ObserveEvents";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveInspector as inspector } from "./ObserveDebug";

type ObserveListenerStore = {
  [T in keyof ObserveEvents]: FastMap<string, Set<ObserveEvents[T]>>;
};

const ObserveListeners: Partial<ObserveListenerStore> = Object.create(null);

export function subscribe<T extends keyof ObserveEvents>(
  type: T,
  listener: ObserveEvents[T]
) {
  if (!listener) throw ObserveError("Invalid ObserveHandler");
  if (!type) throw ObserveError("Invalid ObserveEvent");
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
  if (inspector.onSubscribe) inspector.onSubscribe({ type, listener });
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
  if (inspector.onUnsubscribe) inspector.onUnsubscribe({ type, listener });
}

function publish<T extends keyof ObserveEvents>(
  type: T,
  data: Parameters<ObserveEvents[T]>[0]
) {
  if (!ObserveListeners[type]) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const observeKey = ObserveKey(data);
  const listeners = Array.from(ObserveListeners[type]!.get(observeKey) || []);
  if (listeners.length > ObserveConfig.maxHandlers) {
    console.warn(ObserveText(`Trigger ${listeners.length} handlers`));
  }
  if (listeners.length > 0) {
    listeners.forEach((handler) => handler!(data));
  }
  if (inspector.onPublish) {
    inspector.onPublish({ type, data, listeners });
  }
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
