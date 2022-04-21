/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

import { Defer } from "./Defer";

export interface TickHandler {
  (): void;
  promise: Promise<any>;
  callback: Function;
}

export interface TickOwner {
  handlers: TickHandler[];
  pending: boolean;
  transaction?: (fn: () => any) => void;
}

export const tickOwner: TickOwner = {
  handlers: [],
  pending: false
};

function execTickHandlers() {
  tickOwner.pending = false;
  const copies = tickOwner.handlers.slice(0);
  tickOwner.handlers.length = 0;
  if (tickOwner.transaction) {
    tickOwner.transaction(() => {
      copies.forEach(handler => handler());
    });
  } else {
    copies.forEach(handler => handler());
  }
}

function createTickTimer() {
  if (typeof Promise !== "undefined") {
    const promise = Promise.resolve();
    return () => {
      promise.then(execTickHandlers).catch(err => console.error(err));
    };
  } else if (
    typeof MutationObserver !== "undefined" ||
    // PhantomJS and iOS 7.x
    window.MutationObserver.toString() ===
      "[object MutationObserverConstructor]"
  ) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    let counter = 1;
    const observer = new MutationObserver(execTickHandlers);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    return () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    return () => {
      setTimeout(execTickHandlers, 0);
    };
  }
}

const tickTimer = createTickTimer();

export function nextTick(callback: () => void, unique?: boolean) {
  if (unique === true) {
    const exists = tickOwner.handlers.find(
      handler => handler.callback === callback
    );
    if (exists) return exists.promise;
  }
  const defer = Defer();
  const handler: TickHandler = () => {
    try {
      const result = callback ? callback() : null;
      if (defer.resolve) defer.resolve(result);
    } catch (err) {
      if (defer.reject) defer.reject(err);
    }
  };
  handler.callback = callback;
  handler.promise = defer.promise;
  tickOwner.handlers.push(handler);
  if (!tickOwner.pending) {
    tickOwner.pending = true;
    tickTimer();
  }
  return defer.promise;
}

nextTick.owner = tickOwner;
