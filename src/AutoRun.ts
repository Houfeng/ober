import { subscribe, unsubscribe, track } from "./ObserveBus";
import { ObserveData } from './ObserveData';
import { nextTick } from "./Tick";

export interface AutorunWrapper {
  dependencies?: Set<string>;
  destory?: Function;
  (): any;
}

export function autorun(handler: Function, immed = true) {
  const func: AutorunWrapper = () => {
    const { result, dependencies } = track(handler);
    func.dependencies = dependencies;
    return result;
  };
  const onSet = ({ id, member }: ObserveData) => {
    if (typeof member === 'symbol') return;
    if (!func.dependencies.has(`${id}.${member}`)) return;
    const pending = nextTick(func, null, true);
    if (pending) pending.catch((err) => { throw err; });
  };
  subscribe('set', onSet);
  func.destory = () => {
    unsubscribe('set', onSet);
  };
  if (immed !== false) func();
  return func;
}