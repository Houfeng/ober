export function Defer<T = any>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolve = resolve;
    reject = reject;
  });
  return { promise, resolve, reject };
}
