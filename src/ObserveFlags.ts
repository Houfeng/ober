/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <houzhanfeng@gmail.com>
 */

export const ObserveFlags = {
  /**
   * 是否打开依赖使用 report
   */
  reporting: false,
  /**
   * 当前 report 标记
   */
  reportMark: "",
  /**
   * 是否触发 set 事件
   */
  set: true,
  /**
   * 是否触发 unref 事件
   */
  unref: true,
  /**
   * 是否触发 ref 事件
   */
  ref: true,
  /**
   * 当前是否正在 action 执行中
   */
  action: false,
};
