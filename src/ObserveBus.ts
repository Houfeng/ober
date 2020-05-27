/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { isPrivateKey, isSymbol } from "./Util";
import { ObserveData } from "./ObserveData";
import { ObserveHandler, ObserveHandlerStore } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveConfig } from "./ObserveConfig";
import { ObservePerf as perf } from "./ObservePerf";

export const ObserveHandlers: ObserveHandlerStore = {};

export function subscribe(type: string, handler: ObserveHandler) {
  if (!handler) throw new Error("Invalid ObserveHandler");
  if (!type) throw new Error("Invalid ObserveName");
  if (!ObserveHandlers[type]) ObserveHandlers[type] = {};
  if (handler.dependencies) {
    handler.dependencies.forEach(key => {
      if (!ObserveHandlers[type][key]) ObserveHandlers[type][key] = new Set();
      ObserveHandlers[type][key].add(handler);
    });
  } else {
    if (!ObserveHandlers[type]["*"]) ObserveHandlers[type]["*"] = new Set();
    ObserveHandlers[type]["*"].add(handler);
  }
  if (perf.onSubscribe) perf.onSubscribe({ type, handler });
}

export function unsubscribe(type: string, handler: ObserveHandler) {
  if (!ObserveHandlers[type] || !handler) return;
  if (handler.dependencies) {
    handler.dependencies.forEach(key => {
      if (!ObserveHandlers[type][key]) return;
      ObserveHandlers[type][key].delete(handler);
    });
  } else if (ObserveHandlers[type]["*"]) {
    ObserveHandlers[type]["*"].delete(handler);
  }
  if (perf.onUnsubscribe) perf.onUnsubscribe({ type, handler });
}

export function publish(type: string, data: ObserveData, matchOnly = false) {
  if (!ObserveHandlers[type]) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const observeKey = ObserveKey(data);
  const matchedHandlers = new Set(ObserveHandlers[type][observeKey]);
  const matchedCount = (matchedHandlers && matchedHandlers.size) || 0;
  if (matchedCount > ObserveConfig.maxHandlers) {
    console.warn(
      `Find ${matchedCount} handlers to trigger execution, and confirm whether there is a performance problem`
    );
  }
  if (matchedHandlers && matchedCount > 0) {
    matchedHandlers.forEach(handler => handler(data));
  }
  if (!matchOnly && ObserveHandlers[type]["*"]) {
    ObserveHandlers[type]["*"].forEach(handler => handler(data));
  }
  if (perf.onPublish) {
    perf.onPublish({ type, data, matchedHandlers, matchOnly });
  }
}
