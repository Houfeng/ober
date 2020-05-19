import { isPrivateKey, isSymbol } from "./Util";
import { ObserveData } from "./ObserveData";
import { ObserveHandler, ObserveHandlerStore } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { ObserveState } from "./ObserveState";

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
}

export function publish(name: string, data: ObserveData, matchKey = false) {
  if (!ObserveHandlers[name]) return;
  if (isSymbol(data.member) || isPrivateKey(data.member)) return;
  const originSetState = ObserveState.set;
  ObserveState.set = false;
  const observeKey = ObserveKey(data);
  if (ObserveHandlers[name][observeKey]) {
    ObserveHandlers[name][observeKey].forEach(handler => handler(data));
  }
  if (!matchKey && ObserveHandlers[name]["*"]) {
    ObserveHandlers[name]["*"].forEach(handler => handler(data));
  }
  ObserveState.set = originSetState;
}
