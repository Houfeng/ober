export interface Flag<T> {
  run<H extends () => any>(value: T, handler: H): ReturnType<H>;
  current(): T;
}

export function Flag<T>(initialValue: T): Flag<T> {
  const stack: T[] = [initialValue];
  function run<H extends () => any>(value: T, handler: H): ReturnType<H> {
    stack.unshift(value);
    try {
      return handler();
    } finally {
      stack.shift();
    }
  }
  function current(): T {
    return stack[0];
  }
  return { run, current };
}
