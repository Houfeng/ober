/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { Defer, undef } from "./ObserveUtil";

interface TickItem {
  readonly defer: Defer<any>;
  readonly callback: () => void;
}

interface TickOwner {
  readonly items: TickItem[];
  pending: boolean;
}

const tickOwner: TickOwner = {
  items: [],
  pending: false,
};

function executeTickItem(item: TickItem) {
  const { defer, callback } = item;
  try {
    defer.resolve(callback());
  } catch (err) {
    defer.reject(err);
  }
}

const execute = (fn: () => any) => fn();

function executeTickItems() {
  tickOwner.pending = false;
  const items = tickOwner.items.slice(0);
  tickOwner.items.length = 0;
  const { batch = execute } = nextTick;
  batch(() => items.forEach((it) => executeTickItem(it)));
}

function createTickResolver() {
  if (typeof Promise !== undef) {
    const promise = Promise.resolve();
    return () =>
      promise.then(executeTickItems).catch((err) => console.error(err));
  } else if (
    typeof MutationObserver !== undef ||
    // PhantomJS and iOS 7.x
    window.MutationObserver.toString() ===
      "[object MutationObserverConstructor]"
  ) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    let counter = 1;
    const observer = new MutationObserver(executeTickItems);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    return () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    return () => setTimeout(executeTickItems, 0);
  }
}

const resolveAllTickItems = createTickResolver();

/**
 * 在下一个 tick 中执行，当前同步任务执行完成后将立即触发
 * @param callback 待执行的函数
 * @param unique 是否唯一，
 *  当设置为 true 时同一个函数即使调用 nextTick 多次也只执行一次
 * @returns Promise 可 await callback 的执行完成
 */
export function nextTick(callback: () => void, unique?: boolean) {
  if (!callback) return;
  if (unique === true) {
    const item = tickOwner.items.find((it) => it.callback === callback);
    if (item) return item.defer.promise;
  }
  const defer = Defer();
  tickOwner.items.push({ defer, callback });
  if (!tickOwner.pending) {
    tickOwner.pending = true;
    resolveAllTickItems();
  }
  return defer.promise;
}

nextTick.batch = execute;
