import { autorun } from "./AutoRun";

export function watch(clac: Function, handler: Function, immed = false) {
  let result: any;
  return autorun(() => {
    const next = JSON.stringify(clac());
    if (result !== next && (result !== undefined || immed)) handler();
    result = next;
  });
}
