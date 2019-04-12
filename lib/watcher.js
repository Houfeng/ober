var _a = require('ntils'), isFunction = _a.isFunction, isBoolean = _a.isBoolean, getByPath = _a.getByPath;
var Watcher = /** @class */ (function () {
    function Watcher(calculator, handler, context) {
        var _this = this;
        //force: true 强制执行，false 强制不执行，无参数根据计算结果决定
        this.calc = function (force) {
            var newValue = _this.calculator.call(_this.context);
            var newValueJson = JSON.stringify(newValue);
            var willExecute = isBoolean(force) ? force :
                !(newValueJson === _this.value);
            if (willExecute) {
                _this.handler.call(_this.context, newValue, _this.value && JSON.parse(_this.value));
            }
            _this.value = newValueJson;
        };
        if (!isFunction(calculator) || !isFunction(handler)) {
            throw new Error('Invalid parameters');
        }
        this.context = context || this;
        this.calculator = isFunction(calculator) ? calculator : function () {
            return getByPath(_this.context, calculator);
        };
        this.handler = handler;
    }
    return Watcher;
}());
module.exports = Watcher;
//# sourceMappingURL=watcher.js.map