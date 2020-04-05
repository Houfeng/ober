import { nextTick } from "./Tick";
import { IObserveEvent } from "./IObserveEvent";

export class AutoRun {
  public handler: Function;
  public context: any;
  public trigger: Function;
  public deep: boolean;
  public dependencies: { [name: string]: boolean };
  public runing: boolean;

  constructor(
    handler: Function,
    context?: any,
    trigger?: Function,
    deep?: boolean
  ) {
    this.handler = handler;
    this.context = context || this;
    this.trigger = trigger || this.run;
    this.deep = deep || false;
  }

  isSync() {
    return false;
  }

  onGet = (event: IObserveEvent) => {
    if (!this.runing || !event || !this.dependencies) return;
    this.dependencies[event.path] = true;
  };

  isDependent: (path: string) => boolean = (path: string) => {
    if (!path) return false;
    if (!this.dependencies || this.dependencies[path]) return true;
    if (!this.deep) return false;
    const paths = path.split(".");
    paths.pop();
    return this.isDependent(paths.join("."));
  };

  onChange = (event: IObserveEvent) => {
    if (this.runing || !event || !this.isDependent(event.path)) return;
    if (this.isSync()) {
      return this.trigger.call(this.context);
    }
    const pending = nextTick(this.trigger, this.context, true);
    if (pending) {
      pending.catch((err: Error) => {
        throw err;
      });
    }
  };

  run = (...args: any[]) => {
    this.dependencies = {};
    this.runing = true;
    const result = this.handler.call(this.context, ...args);
    this.runing = false;
    return result;
  };
}
