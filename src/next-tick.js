const handlers = [];
let pending = false;

function execHandlers() {
  pending = false;
  const copies = handlers.slice(0);
  handlers.length = 0;
  copies.forEach(callback => callback());
}

function createTimer() {
  if (typeof Promise !== 'undefined') {
    const promise = Promise.resolve();
    return () => {
      promise.then(execHandlers).catch(err => console.error(err));
    };
  } else if (typeof MutationObserver !== 'undefined' ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  ) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    let counter = 1;
    let observer = new MutationObserver(execHandlers);
    let textNode = document.createTextNode(String(counter));
    observer.observe(textNode, { characterData: true });
    return () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    return () => {
      setTimeout(execHandlers, 0);
    };
  }
}

const timer = createTimer();

function nextTick(callback, ctx, unique) {
  if (unique === true) {
    const exists = handlers.find(h => h.callback === callback);
    if (exists) return exists.promise;
  }
  let resolve, reject;
  const handler = () => {
    try {
      const result = callback ? callback.call(ctx) : null;
      if (resolve) resolve(result);
    } catch (err) {
      if (reject) reject(err);
    }
  };
  handler.callback = callback;
  handler.promise = typeof Promise !== 'undefined' ?
    new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    }) : null;
  handlers.push(handler);
  if (!pending) {
    pending = true;
    timer();
  }
  return handler.promise;
}

module.exports = nextTick;