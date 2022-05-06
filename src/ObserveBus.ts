/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { ObserveError, ObserveText } from "./ObserveError";
import { ObserveHandler, ObserveHandlerStore } from "./ObserveHandler";
import { isPrivateKey, isSymbol } from "./ObserveUtil";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveInspector as inspector } from "./ObserveInspector";

export const ObserveHandlers: ObserveHandlerStore = {};

export enum ObserveEvent {
  get = "get",
  set = "set",
}

export function subscribe(type: ObserveEvent, handler: ObserveHandler) {
  if (!handler) throw ObserveError("Invalid ObserveHandler");
  if (!type) throw ObserveError("Invalid ObserveEvent");
  if (!ObserveHandlers[type]) ObserveHandlers[type] = {};
  if (handler.dependencies) {
    handler.dependencies.forEach((key) => {
      if (!ObserveHandlers[type][key]) ObserveHandlers[type][key] = new Set();
      ObserveHandlers[type][key].add(handler);
    });
  } else {
    if (!ObserveHandlers[type]["*"]) ObserveHandlers[type]["*"] = new Set();
    ObserveHandlers[type]["*"].add(handler);
  }
  if (inspector.onSubscribe) inspector.onSubscribe({ type, handler });
}

export function unsubscribe(type: ObserveEvent, handler: ObserveHandler) {
  if (!ObserveHandlers[type] || !handler) return;
  if (handler.dependencies) {
    handler.dependencies.forEach((key) => {
      if (!ObserveHandlers[type][key]) return;
      ObserveHandlers[type][key].delete(handler);
    });
  } else if (ObserveHandlers[type]["*"]) {
    ObserveHandlers[type]["*"].delete(handler);
  }
  if (inspector.onUnsubscribe) inspector.onUnsubscribe({ type, handler });
}

export function publish(
  type: ObserveEvent,
  data: ObserveData,
  matchOnly = false
) {
  if (!ObserveHandlers[type]) return;
  if (!ObserveFlags.get && type === ObserveEvent.get) return;
  if (!ObserveFlags.set && type === ObserveEvent.set) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const observeKey = ObserveKey(data);
  const matchedHandlers = new Set(ObserveHandlers[type][observeKey]);
  const matchedCount = (matchedHandlers && matchedHandlers.size) || 0;
  if (matchedCount > ObserveConfig.maxHandlers) {
    console.warn(ObserveText(`Trigger ${matchedCount} handlers`));
  }
  if (matchedHandlers && matchedCount > 0) {
    matchedHandlers.forEach((handler) => handler(data));
  }
  const commonHandlers = new Set(ObserveHandlers[type]["*"]);
  if (!matchOnly && commonHandlers && commonHandlers.size > 0) {
    commonHandlers.forEach((handler) => handler(data));
  }
  if (inspector.onPublish) {
    inspector.onPublish({
      type,
      data,
      matchedHandlers,
      commonHandlers,
      matchOnly,
    });
  }
}
