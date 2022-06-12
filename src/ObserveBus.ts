/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveError, ObserveText } from "./ObserveError";
import { ObserveEventHandlerStore, ObserveEvents } from "./ObserveEvents";
import { isPrivateKey, isSymbol } from "./ObserveUtil";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveInspector as inspector } from "./ObserveInspector";

export const ObserveHandlers: Partial<ObserveEventHandlerStore> = {};

const GENERIC_KEY = "*";
const GENERIC_DEPENDENCIES = new Set([GENERIC_KEY]);

export function subscribe<T extends keyof ObserveEvents>(
  type: T,
  handler: ObserveEvents[T]
) {
  if (!handler) throw ObserveError("Invalid ObserveHandler");
  if (!type) throw ObserveError("Invalid ObserveEvent");
  if (!ObserveHandlers[type]) ObserveHandlers[type] = new Map();
  (handler.dependencies || GENERIC_DEPENDENCIES).forEach((key) => {
    let list: Set<any> | undefined;
    if (ObserveHandlers[type]!.has(key)) {
      list = ObserveHandlers[type]!.get(key);
      list!.add(handler);
    } else {
      list = new Set([handler]);
      ObserveHandlers[type]!.set(key, list);
    }
    if (ObserveFlags.ref && key !== GENERIC_KEY && list!.size === 1) {
      const [id, member] = key.split(".");
      publish("ref", { type, id, member });
    }
  });
  if (inspector.onSubscribe) inspector.onSubscribe({ type, handler });
}

export function unsubscribe<T extends keyof ObserveEvents>(
  type: T,
  handler: ObserveEvents[T]
) {
  if (!ObserveHandlers[type] || !handler) return;
  (handler.dependencies || GENERIC_DEPENDENCIES).forEach((key) => {
    if (!ObserveHandlers[type]!.has(key)) return;
    const list = ObserveHandlers[type]!.get(key);
    if (!list || !list.has(handler)) return;
    list.delete(handler);
    if (ObserveFlags.unref && key !== GENERIC_KEY && list.size < 1) {
      const [id, member] = key.split(".");
      publish("unref", { type, id, member });
    }
  });
  if (inspector.onUnsubscribe) inspector.onUnsubscribe({ type, handler });
}

export function publish<T extends keyof ObserveEvents>(
  type: T,
  data: Parameters<ObserveEvents[T]>[0],
  matchOnly = false
) {
  if (!ObserveHandlers[type]) return;
  if (!ObserveFlags.get && type === "get") return;
  if (!ObserveFlags.set && type === "set") return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  data.mark = ObserveFlags.mark;
  const observeKey = ObserveKey(data);
  const matchedHandlers = new Set(ObserveHandlers[type]!.get(observeKey));
  const matchedCount = (matchedHandlers && matchedHandlers.size) || 0;
  if (matchedCount > ObserveConfig.maxHandlers) {
    console.warn(ObserveText(`Trigger ${matchedCount} handlers`));
  }
  if (matchedHandlers && matchedCount > 0) {
    matchedHandlers.forEach((handler) => handler!(data));
  }
  const commonHandlers = new Set(ObserveHandlers[type]!.get(GENERIC_KEY));
  if (!matchOnly && commonHandlers && commonHandlers.size > 0) {
    commonHandlers.forEach((handler) => handler!(data));
  }
  if (inspector.onPublish) {
    const info = { type, data, matchedHandlers, commonHandlers, matchOnly };
    inspector.onPublish(info);
  }
}
