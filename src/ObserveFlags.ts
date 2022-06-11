/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

export const ObserveFlags = {
  /**
   * 是否触发 get 事件
   */
  get: false,
  /**
   * 是否触发 set 事件
   */
  set: true,
  /**
   * 是否触发 unref 事件
   */
  unref: true,
  /**
   * 当前是否正在 action 执行中
   */
  action: false,
  /**
   * 当前集收函数标记
   */
  mark: "",
};
