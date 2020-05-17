import { isPrivateKey, isSymbol, throwError } from "./Util";
import { nextTick } from "./Tick";
import { ObserveData } from "./ObserveData";
import { ObserveHandler } from "./ObserveHandler";
import { ObserveKey } from "./ObserveKey";
import { subscribe, track, unsubscribe } from "./ObserveBus";

export interface AutorunWrapper {
  dependencies?: Set<string>;
  destory?: Function;
  (): any;
}

export function autorun(handler: Function, immed = true) {
  let onSet: ObserveHandler;
  let func: AutorunWrapper;
  func = () => {
    const { result, dependencies } = track(handler);
    func.dependencies = dependencies;
    onSet.dependencies = dependencies;
    return result;
  };
  onSet = (data: ObserveData) => {
    if (isSymbol(data.member) || isPrivateKey(data.member)) return;
    if (!func.dependencies?.has(ObserveKey(data))) return;
    const pending = nextTick(func, null, true);
    if (pending) pending.catch(err => throwError(err));
  };
  subscribe("set", onSet);
  func.destory = () => unsubscribe("set", onSet);
  if (immed !== false) func();
  return func;
}
