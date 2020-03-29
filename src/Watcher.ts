import { isFunction, isBoolean, getByPath } from "ntils";
import { AutoRun } from "./AutoRun";

export class Watcher {
  context: any;
  calculator: Function;
  handler: Function;
  value: any;
  autoRef: AutoRun;

  constructor(calculator: Function | string, handler: Function, context: any) {
    if (!isFunction(calculator) || !isFunction(handler)) {
      throw new Error("Invalid parameters");
    }
    this.context = context || this;
    this.calculator = isFunction(calculator)
      ? (calculator as Function)
      : () => {
          return getByPath(this.context, calculator as string);
        };
    this.handler = handler;
  }

  // force: true 强制执行，false 强制不执行，无参数根据计算结果决定
  calc = (force: boolean) => {
    let newValue = this.calculator.call(this.context);
    let newValueJson = JSON.stringify(newValue);
    let willExecute = isBoolean(force) ? force : !(newValueJson === this.value);
    if (willExecute) {
      this.handler.call(
        this.context,
        newValue,
        this.value && JSON.parse(this.value)
      );
    }
    this.value = newValueJson;
  };
}
