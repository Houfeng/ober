var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var nextTick = require('./next-tick');
module.exports = /** @class */ (function () {
    function AutoRun(handler, context, trigger, deep) {
        var _this = this;
        this.onGet = function (event) {
            if (!_this.runing || !event || !_this.dependencies)
                return;
            _this.dependencies[event.path] = true;
        };
        this.isDependent = function (path) {
            if (!path)
                return false;
            if (!_this.dependencies || _this.dependencies[path])
                return true;
            if (!_this.deep)
                return false;
            var paths = path.split('.');
            paths.pop();
            return _this.isDependent(paths.join('.'));
        };
        this.onChange = function (event) {
            if (_this.runing || !event || !_this.isDependent(event.path))
                return;
            if (_this.isSync()) {
                return _this.trigger.call(_this.context);
            }
            var pending = nextTick(_this.trigger, _this.context, true);
            if (pending)
                pending.catch(function (err) {
                    throw err;
                });
        };
        this.run = function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.dependencies = {};
            _this.runing = true;
            var result = (_a = _this.handler).call.apply(_a, __spreadArrays([_this.context], args));
            _this.runing = false;
            return result;
        };
        this.handler = handler;
        this.context = context || this;
        this.trigger = trigger || this.run;
        this.deep = deep || false;
    }
    AutoRun.prototype.isSync = function () {
        return false;
    };
    return AutoRun;
}());
//# sourceMappingURL=autorun.js.map