/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { UNDEF } from "./ObserveConstants";

type TickTask = (() => void) & { __pending: boolean };
type TickOwner = { readonly tasks: TickTask[]; pending: boolean };

const tickOwner: TickOwner = { tasks: [], pending: false };
const builtInBatch = (fn: () => void) => fn();

function executeTickTask(task: TickTask) {
  task();
  task.__pending = false;
}

function executeTickTasks() {
  tickOwner.pending = false;
  const tasks = tickOwner.tasks.slice(0);
  tickOwner.tasks.length = 0;
  const { batch = builtInBatch } = nextTick;
  batch(() => tasks.forEach((task) => executeTickTask(task)));
}

function createTickResolver() {
  if (typeof Promise !== UNDEF) {
    const promise = Promise.resolve();
    return () =>
      promise.then(executeTickTasks).catch((err) => console.error(err));
  } else if (
    typeof MutationObserver !== UNDEF ||
    // PhantomJS and iOS 7.x
    window.MutationObserver.toString() ===
      "[object MutationObserverConstructor]"
  ) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    let counter = 1;
    const observer = new MutationObserver(executeTickTasks);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    return () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    return () => setTimeout(executeTickTasks, 0);
  }
}

const resolveAllTickItems = createTickResolver();

/**
 * 在下一个 tick 中执行，当前同步任务执行完成后将立即触发
 * @param callback 待执行的函数，同时一函数引用调用多次 nextTick 只会执行一次
 * @returns void
 */
export function nextTick(callback: () => void): void {
  const task = callback as TickTask;
  if (!task || task.__pending) return;
  task.__pending = true;
  tickOwner.tasks.push(task);
  if (!tickOwner.pending) {
    tickOwner.pending = true;
    resolveAllTickItems();
  }
}

nextTick.batch = builtInBatch;
