/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import { changeFlag, ObserveEvent, ObserveKey } from "./EventBus";
import { Flag } from "./Flag";

const depsFlag = Flag<Set<string> | void>(void 0);
const collectFlag = Flag(false);

export function emitCollect(event: ObserveEvent) {
  if (!changeFlag.current()) return;
  const deps = depsFlag.current();
  if (deps) deps.add(ObserveKey(event));
}

/**
 * 执行一个函数，并在函数执行过程中启用追踪
 * 通常在一个大的 untrack 函数中将启用一小部分处理时使用
 * @param fn 执行的函数
 * @returns 执行结果
 */
export function track<T extends () => any>(fn: T) {
  return collectFlag.run(true, () => changeFlag.run(true, fn));
}

/**
 * 执行一个函数，并在函数执行过程中禁用追踪
 * @param fn 执行的函数
 * @returns 执行结果
 */
export function untrack<T extends () => any>(fn: T) {
  return collectFlag.run(false, () => changeFlag.run(false, fn));
}

/**
 * 执行一个函数并收集其依赖
 *
 * ★特别注意★，一般情况下，不需要直接调用此 API，通常用于更上层 API 或 库，
 *
 * @param fn 将执行并收集依赖的数据
 * @returns [执行结果，依赖集合]
 */
export function collect<T extends () => any>(
  fn: T,
): [ReturnType<T>, Set<string>] {
  const deps = new Set<string>();
  const result: ReturnType<T> = depsFlag.run(deps, fn);
  return [result, deps];
}
