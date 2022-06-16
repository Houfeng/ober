/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { AnyFunction, Ref } from "./ObserveUtil";

import { ObserveConfig } from "./ObserveConfig";
import { ObserveData } from "./ObserveData";
import { ObserveFlags } from "./ObserveFlags";
import { ObserveKey } from "./ObserveKey";
import { ObserveText } from "./ObserveError";

export type CollectFunction = (data: ObserveData) => void;

const CollectCurrent: Ref<CollectFunction> = {};

export function report(data: ObserveData) {
  if (ObserveFlags.report && CollectCurrent.value) {
    data.mark = ObserveFlags.reportMark;
    CollectCurrent.value(data);
  }
}

function trackSwitch<T extends AnyFunction>(
  fn: T,
  flag: boolean,
  ...args: any[]
) {
  if (!fn) return;
  const originSetFlag = ObserveFlags.change;
  const originGetFlag = ObserveFlags.report;
  ObserveFlags.change = flag;
  ObserveFlags.report = flag;
  const result = fn(...args);
  ObserveFlags.change = originSetFlag;
  ObserveFlags.report = originGetFlag;
  return result as ReturnType<T>;
}

/**
 * 执行一个函数，并在函数执行过程中启用依赖追踪
 * 通常在一个大的 untrack 函数中将启用一小部分处理时使用
 * @param fn 执行的函数
 * @param args 传递给执行函数的参数
 * @returns 执行结果
 */
export function track<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, true, ...args);
}

/**
 * 执行一个函数，并在函数执行过程中禁用依赖追踪
 * @param fn 执行的函数
 * @param args 传递给执行函数的参数
 * @returns 执行结果
 */
export function untrack<T extends AnyFunction>(fn: T, ...args: any[]) {
  return trackSwitch(fn, false, ...args);
}

export type CollectOptions<T extends AnyFunction> = {
  /**
   * 指定 this 对象
   */
  context?: any;
  /**
   * 传递给收集函数的参数
   */
  args?: Parameters<T>;
  /**
   * 收集标记，打上收集标记后，将阻止上层收集函数收集
   * 如果没有完全搞懂它，请不要使用它
   * @internal
   */
  mark?: string;
  /**
   * 要忽略收集的 key (格式 id.member)
   * 如果没有完全搞懂它，请不要使用它
   * @internal
   */
  ignore?: string[];
};

/**
 * 执行一个函数并收集其依赖
 *
 * ★特别注意★，一般情况下，不需要直接调用此 API，通常用于更上层 API 或 库，
 *
 * @param fn 将执行并收集依赖的数据
 * @param options 收集选项
 * @returns 执行结果和依赖清单
 */
export function collect<T extends AnyFunction>(
  fn: T,
  options?: CollectOptions<T>
) {
  const { mark, context, args, ignore = [] } = { ...options };
  const dependencies: string[] = [];
  const appendDependencies: Record<string, boolean> = {};
  const prevCollectFunction = CollectCurrent.value;
  CollectCurrent.value = (data: ObserveData) => {
    if (data.mark && data.mark !== mark) return;
    const key = ObserveKey(data);
    if (ignore && ignore.indexOf(key) > -1) return;
    if (!appendDependencies[key]) dependencies.push(key);
    appendDependencies[key] = true;
  };
  const prevReportMark = ObserveFlags.reportMark;
  const prevReporting = ObserveFlags.report;
  ObserveFlags.reportMark = mark || "";
  ObserveFlags.report = true;
  const result: ReturnType<T> = fn.call(context, ...(args || []));
  ObserveFlags.report = prevReporting;
  ObserveFlags.reportMark = prevReportMark;
  CollectCurrent.value = prevCollectFunction;
  const count = dependencies.length;
  if (count > ObserveConfig.maxDependencies) {
    console.warn(ObserveText(`A single function has ${count} dependencies`));
  }
  return { result, dependencies };
}
