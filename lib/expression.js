var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var VARIABLE_FILTER = /(\(|\[|\{|\+|\-|\*|\/|\>|\<|\=|\!|\,|\;|\?|\:|\&|\|)\s*([a-z\_0-9\$]+)/ig;
var VARIABLE_NAME = /^[a-z\$\_]/i;
var ALLOWED_WORD = /^(\$scope|true|false|null|undefined|Date|Number|String|Object|Boolean|Array|RegExp|Math|JSON|parseInt|parseFloat|isNaN|isFinite)$/; //eslint-disable-line
var EXPRESSION_BLOCK = /\{\{([\s\S]+?)\}\}/;
var EXPRESSION_CACHE = {};
var TEMPLATE_CACHE = {};
function findVariables(expr) {
    expr = "(" + expr + ")";
    VARIABLE_FILTER.lastIndex = 0;
    var variables = {};
    var info;
    while (info = VARIABLE_FILTER.exec(expr)) { //eslint-disable-line
        var name_1 = info[2];
        if (VARIABLE_NAME.test(name_1) && !ALLOWED_WORD.test(name_1)) {
            variables[name_1] = true;
        }
    }
    return Object.keys(variables);
}
function getValue(scope, name) {
    var value = scope[name];
    return (value instanceof Function) ? value.bind(scope) : value;
}
function expression(expr) {
    var cacheItem = EXPRESSION_CACHE[expr];
    if (cacheItem)
        return cacheItem;
    var keys = findVariables(expr);
    var func = new (Function.bind.apply(Function, __spreadArrays([void 0, '$scope'], keys, ["return(" + expr + ")"])))();
    function exec(scope) {
        var values = keys.map(function (name) { return getValue(scope, name); });
        return func.apply(void 0, __spreadArrays([scope], values));
    }
    EXPRESSION_CACHE[expr] = exec;
    return exec;
}
function template(str) {
    var cacheItem = TEMPLATE_CACHE[str];
    if (cacheItem)
        return cacheItem;
    var blocks = str.split(EXPRESSION_BLOCK);
    for (var i = 1; i < blocks.length; i += 2) {
        blocks[i] = expression(blocks[i]);
    }
    function exec(scope) {
        var result = '';
        blocks.forEach(function (block) {
            result += (block instanceof Function) ? block(scope) : block;
        });
        return result;
    }
    TEMPLATE_CACHE[str] = exec;
    return exec;
}
function compile(str, mixed) {
    return mixed ? template(str) : expression(str);
}
compile.expression = expression;
compile.template = template;
module.exports = compile;
//# sourceMappingURL=expression.js.map