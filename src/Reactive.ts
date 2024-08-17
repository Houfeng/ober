/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

import {
  AnyFunction,
  isObject,
  isPrivateKey,
  isSymbol,
  shallowEqual,
} from "./util";
import { collect } from "./Collector";
import {
  ObserveEvent,
  ObserveListener,
  subscribe,
  unrefFlag,
  unsubscribe,
} from "./EventBus";

import { nextTick } from "./Tick";
import { $None } from "./Symbols";
import { Flag } from "./Flag";

export type ReactiveFunction<T extends () => any = () => any> = T & {
  dependencies: Set<string>;
  subscribe: () => void;
  unsubscribe: () => void;
};

export type ReactiveOptions = {
  /**
   * 是否自动合并更新
   * 设置为 true 时，可观察对象的所有同步变更，都将同步触发 update
   * 默认为 false
   *
   * ★当 batch 为 true，将不会向 update 函数传递 data 参数
   *
   */
  batch?: boolean;
  /**
   * 触发更新的函数，默认为 reactivable 函数自身
   *
   * ★当 batch 为 true，将不会向 update 函数传递 data 参数
   *
   */
  update?: () => any;
  /**
   * 是否自动绑定，设置为 false 时，在手动调用返回函数 .subscribe 方法才能激活
   * 默认为 true
   */
  bind?: boolean;
};

export const ReactiveOwner = Flag<ReactiveFunction | void>(void 0);

/**
 * 创建一个可响应函数
 *
 * ★特别注意★：返回的可响应函数，当不在使用时必须调用销毁方法进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题
 * 如果你不确认在干什么，请不要直接使用 reactivable api，
 *
 * @param fn 原始函数
 * @param options 响应选项
 * @returns 可响应函数 (调用 <ReturnFunc>.unsubscribe() 可销毁)
 */
export function reactivable<T extends AnyFunction>(
  fn: T,
  options?: ReactiveOptions,
) {
  const { bind = true, batch, update } = { ...options };
  let subscribed = bind !== false;
  let listener: ObserveListener = null!;
  const wrapper = function () {
    ReactiveOwner.run(wrapper, () => {
      unrefFlag.run(false, () => unsubscribe("change", listener));
      const [result, dependencies] = collect(fn);
      listener.dependencies = dependencies;
      wrapper.dependencies = dependencies;
      if (subscribed) subscribe("change", listener);
      return result;
    });
  } as ReactiveFunction<T>;
  const requestUpdate = () => (update ? update() : wrapper());
  listener = (data: ObserveEvent) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    return batch ? nextTick(requestUpdate) : requestUpdate();
  };
  wrapper.subscribe = () => {
    if (subscribed) return;
    subscribe("change", listener);
    subscribed = true;
  };
  wrapper.unsubscribe = () => {
    if (!subscribed) return;
    unsubscribe("change", listener);
    subscribed = false;
  };
  return wrapper;
}

/**
 * 启动一个自执行函数，当函数中用到的数据发生变化时它将自动重新执行
 *
 * ★特别注意★：返回值是销毁函数，当不在使用时必须调用销毁函数进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题，
 * 因为需要必需的销毁处理，所以不支持直接作为装饰器使用。
 *
 * @param handler 将执行的函数
 * @returns 销毁函数
 */
export function autorun(handler: () => void) {
  const wrapper = reactivable(handler, { batch: true, bind: true });
  wrapper();
  return wrapper.unsubscribe;
}

/**
 * 创建一个观察器，每当用到的数据发生变化时，将重新计算
 *
 * ★特别注意★：返回值是销毁函数，当不在使用时必须调用销毁函数进行释放，
 * 否则，将带来不必要的重复执行，因为不释放还可能导致程序的内存泄露问题，
 * 因为需要必需的销毁处理，所以不支持作为装饰器使用。
 *
 * @param selector 计算函数，需返回一个值，将对新旧值进行浅对比，决定是否调用执行函数
 * @param handler 执行函数，由 selector 的计算结果决定是否重新执行
 * @param immed 是否立即执行一次 handler
 * @returns 销毁函数
 */
export function watch<T>(
  selector: () => T,
  handler: (newValue?: T, oldValue?: T) => void,
  immed = false,
) {
  let oldValue: any = $None;
  return autorun(() => {
    const value = selector();
    const newValue = isObject(value) ? { ...value } : value;
    if (!shallowEqual(newValue, oldValue) && (oldValue !== $None || immed)) {
      handler(newValue, oldValue);
    }
    oldValue = newValue;
  });
}
