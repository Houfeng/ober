/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isPrivateKey, isSymbol } from "./Util";
import { ObserveData } from "./ObserveData";
import { ObserveHandler, ObserveHandlerStore } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveState } from "./ObserveState";
import { ObserveConfig } from "./ObserveConfig";
import { ObservePerf } from "./ObservePerf";

const { onSubscribe, onUnsubscribe, onPublish } = ObservePerf;

export const ObserveHandlers: ObserveHandlerStore = {};

export function subscribe(name: string, handler: ObserveHandler) {
  if (!handler) throw new Error("Invalid ObserveHandler");
  if (!name) throw new Error("Invalid ObserveName");
  if (!ObserveHandlers[name]) ObserveHandlers[name] = {};
  if (handler.dependencies) {
    handler.dependencies.forEach(key => {
      if (!ObserveHandlers[name][key]) ObserveHandlers[name][key] = new Set();
      ObserveHandlers[name][key].add(handler);
    });
  } else {
    if (!ObserveHandlers[name]["*"]) ObserveHandlers[name]["*"] = new Set();
    ObserveHandlers[name]["*"].add(handler);
  }
  if (onSubscribe) onSubscribe({ name, handler });
}

export function unsubscribe(name: string, handler: ObserveHandler) {
  if (!ObserveHandlers[name] || !handler) return;
  if (handler.dependencies) {
    handler.dependencies.forEach(key => {
      if (!ObserveHandlers[name][key]) return;
      ObserveHandlers[name][key].delete(handler);
    });
  } else if (ObserveHandlers[name]["*"]) {
    ObserveHandlers[name]["*"].delete(handler);
  }
  if (onUnsubscribe) onUnsubscribe({ name, handler });
}

export function publish(name: string, data: ObserveData, matchOnly = false) {
  if (!ObserveHandlers[name]) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const originSetState = ObserveState.set;
  ObserveState.set = false;
  const observeKey = ObserveKey(data);
  const matchedHandlers = ObserveHandlers[name][observeKey];
  const matchedCount = (matchedHandlers && matchedHandlers.size) || 0;
  if (matchedCount > ObserveConfig.maxHandlers) {
    console.warn(
      `Find ${matchedCount} handlers to trigger execution, and confirm whether there is a performance problem`
    );
  }
  if (matchedHandlers) matchedHandlers.forEach(handler => handler(data));
  if (!matchOnly && ObserveHandlers[name]["*"]) {
    ObserveHandlers[name]["*"].forEach(handler => handler(data));
  }
  ObserveState.set = originSetState;
  if (onPublish) onPublish({ name, data, matchedHandlers, matchOnly });
}
