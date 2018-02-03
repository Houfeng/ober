var handlers = [];
var pending = false;
function execHandlers() {
    pending = false;
    var copies = handlers.slice(0);
    handlers.length = 0;
    copies.forEach(function (callback) { return callback(); });
}
function createTimer() {
    if (typeof Promise !== 'undefined') {
        var promise_1 = Promise.resolve();
        return function () {
            promise_1.then(execHandlers).catch(function (err) { return console.error(err); });
        };
    }
    else if (typeof MutationObserver !== 'undefined' ||
        // PhantomJS and iOS 7.x
        MutationObserver.toString() === '[object MutationObserverConstructor]') {
        // use MutationObserver where native Promise is not available,
        // e.g. PhantomJS IE11, iOS7, Android 4.4
        var counter_1 = 1;
        var observer = new MutationObserver(execHandlers);
        var textNode_1 = document.createTextNode(String(counter_1));
        observer.observe(textNode_1, { characterData: true });
        return function () {
            counter_1 = (counter_1 + 1) % 2;
            textNode_1.data = String(counter_1);
        };
    }
    else {
        // fallback to setTimeout
        /* istanbul ignore next */
        return function () {
            setTimeout(execHandlers, 0);
        };
    }
}
var timer = createTimer();
function nextTick(callback, ctx, unique) {
    if (unique === true) {
        var exists = handlers.find(function (h) { return h.callback === callback; });
        if (exists)
            return exists.promise;
    }
    var resolve, reject;
    var handler = function () {
        try {
            var result = callback ? callback.call(ctx) : null;
            if (resolve)
                resolve(result);
        }
        catch (err) {
            if (reject)
                reject(err);
        }
    };
    handler.callback = callback;
    handler.promise = typeof Promise !== 'undefined' ?
        new Promise(function (_resolve, _reject) {
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
//# sourceMappingURL=next-tick.js.map