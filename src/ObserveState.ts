export const ObserveState = {
  get: true,
  set: true
};

export function disableObserve() {
  ObserveState.get = false;
  ObserveState.set = false;
}

export function enableObserve() {
  ObserveState.get = true;
  ObserveState.set = true;
}
