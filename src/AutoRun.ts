import { nextTick } from "./Tick";
import { throwError } from "./Util";
import { trackable } from "./ObserveTrack";

export function autorun(func: Function, immed = true) {
  const wrapper = trackable(func, () => {
    const pending = nextTick(wrapper, null, true);
    if (pending) pending.catch(err => throwError(err));
  });
  if (immed !== false) wrapper();
  return wrapper;
}
