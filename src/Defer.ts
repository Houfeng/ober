/**
 * Copyright (c) 2014-present Houfeng
 * @homepage https://github.com/Houfeng/ober
 * @author Houfeng <admin@xhou.net>
 */

export function Defer<T = any>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolve = resolve;
    reject = reject;
  });
  return { promise, resolve, reject };
}
