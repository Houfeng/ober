/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { $Pending } from "./Symbols";
import { logError } from "./util";

type TickTask = (() => void) & { [$Pending]: boolean };
type TickOwner = { readonly tasks: TickTask[]; [$Pending]: boolean };

const tickOwner: TickOwner = { tasks: [], [$Pending]: false };
const builtInBatch = (fn: () => void) => fn();

function executeTickTask(task: TickTask) {
  task();
  task[$Pending] = false;
}

function executeTickTasks() {
  tickOwner[$Pending] = false;
  const tasks = tickOwner.tasks.slice(0);
  tickOwner.tasks.length = 0;
  const { batch = builtInBatch } = nextTick;
  batch(() => tasks.forEach((task) => executeTickTask(task)));
}

function createTickResolver() {
  if (typeof Promise !== "undefined") {
    const promise = Promise.resolve();
    return () => promise.then(executeTickTasks).catch(logError);
  } else if (typeof MutationObserver !== "undefined") {
    let counter = 1;
    const observer = new MutationObserver(executeTickTasks);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    return () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    return () => setTimeout(executeTickTasks, 0);
  }
}

const resolveAllTickTasks = createTickResolver();

/**
 * 在下一个 tick 中执行，当前同步任务执行完成后将立即触发
 * @param callback 待执行的函数，同时一函数引用调用多次 nextTick 只会执行一次
 * @returns void
 */
export function nextTick(callback: () => void): void {
  const task = callback as TickTask;
  if (!task || task[$Pending]) return;
  task[$Pending] = true;
  tickOwner.tasks.push(task);
  if (!tickOwner[$Pending]) {
    tickOwner[$Pending] = true;
    resolveAllTickTasks();
  }
}

nextTick.batch = builtInBatch;
