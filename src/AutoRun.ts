import { nextTick } from "./Tick";
import { IObserveEvent } from "./IObserveEvent";

export class AutoRun {
  public handler: Function;
  public context: any;
  public trigger: Function;
  public dependencies: { [name: string]: boolean };
  public runing: boolean;

  constructor(handler: Function, context?: any, trigger?: Function) {
    this.handler = handler;
    this.context = context || this;
    this.trigger = trigger || this.run;
  }

  isSync() {
    return false;
  }

  onGet = (event: IObserveEvent) => {
    if (!this.runing || !event || !this.dependencies) return;
    const key = `${event.id}.${event.member}`;
    this.dependencies[key] = true;
  };

  isDependent: (key: string) => boolean = (key: string) => {
    if (!key) return false;
    return !this.dependencies || this.dependencies[key];
  };

  onChange = (event: IObserveEvent) => {
    const key = `${event.id}.${event.member}`;
    if (this.runing || !event || !this.isDependent(key)) return;
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
