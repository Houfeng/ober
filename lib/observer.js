var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var _a = require('ntils'), isArray = _a.isArray, isFunction = _a.isFunction, isNull = _a.isNull, isObject = _a.isObject, copy = _a.copy, final = _a.final, each = _a.each;
var EventEmitter = require('eify');
var AutoRun = require('./autorun');
var Watcher = require('./watcher');
var OBSERVER_PROP_NAME = '_observer_';
var CHANGE_EVENT_NAME = 'change';
var GET_EVENT_NAME = 'get';
var EVENT_MAX_DISPATCH_LAYER = 10;
var IGNORE_REGEXPS = [/^\_(.*)\_$/, /^\_\_/, /^\$/];
/**
 * 对象观察类，可以监控对象变化
 * 目前方案问题:
 *   对于父子关系和事件冒泡，目前方案如果用 delete 删除一个属性，无关真实删除关系，
 *   即便调用 clearReference 也无法再清除关系，子对象的 parents 中会一直有一个引用，当前方案最高效
 * 其它方法一:
 *   将「关系」放入全局数组中，然后将 ob.parents 变成一个「属性」从全局数组件中 filter 出来，
 *   基本和目前方法类似，但是关系在外部存领教，所以 clearReference 可清除。
 * 其它方案二:
 *   构造时添加到全局数组，每一个 observer change 时都让放到全局的 observer 遍历自身的，
 *   检果事件源是不是自已的子对象，如果是则触发自身 change 事件，这样 ob 对象本身没有相关引用
 *   clearReference 时只从全局清除掉就行了，并且 delete 操作也不会影响，但效率稍差。
 * 其它方案三:
 *   给构造函数添加一个 deep 属性，只有 deep 的 ob 对象，才放入到全局数组中，检查时逻辑同方案二
 *   但是因为要检查的对象会少很多，效率会更高一点。
 */
var Observer = /** @class */ (function (_super) {
    __extends(Observer, _super);
    /**
     * 通过目标对象构造一个观察对象
     * @param {Object} target 目标对象
     * @param {Object} options 选项
     * @returns {void} 无返回
     */
    function Observer(target, options) {
        var _this = _super.call(this) || this;
        if (isNull(target)) {
            throw new Error('Invalid target');
        }
        options = options || {};
        var observer = target[OBSERVER_PROP_NAME];
        if (observer) {
            copy(options, observer.options);
            //当时一个组件 A 的为组件 B 的 prop 时，A 更新不会触发 B 更新
            //所在暂注释这里，另一种方法是更新 prop 指令，重写 excute 方法，而不是现在的 update 方法
            // if (observer.options.root) {
            //   observer.parents.length = 0;
            // }
            observer.apply();
            return observer;
        }
        final(_this, 'options', options);
        final(_this, 'shadow', {});
        final(_this, 'target', target);
        final(_this, 'parents', []);
        final(target, OBSERVER_PROP_NAME, _this);
        _this.apply();
        return _this;
    }
    /**
     * 添加一个属性，动态添中的属性，无法被观察，
     * 但是通过 set 方法添加的属性可能被观察。
     * @param {string} name 名称
     * @param {Object} value 值
     * @returns {void} 无返回
     */
    Observer.prototype.set = function (name, value) {
        if (isFunction(value) || Observer.isIgnore(name)) {
            return;
        }
        Object.defineProperty(this.target, name, {
            get: function () {
                var observer = this[OBSERVER_PROP_NAME];
                observer.emitGet({ name: name, value: value });
                return observer.shadow[name];
            },
            set: function (value) {
                var observer = this[OBSERVER_PROP_NAME];
                var oldValue = observer.shadow[name];
                if (oldValue === value)
                    return;
                if (isObject(value)) {
                    var childObserver = new Observer(value);
                    observer.addChild(childObserver, name);
                }
                //移除旧值的父引用
                //如果用 delete 删除属性将无法移除父子引用
                if (oldValue && oldValue[OBSERVER_PROP_NAME]) {
                    observer.removeChild(oldValue[OBSERVER_PROP_NAME], name);
                }
                observer.shadow[name] = value;
                observer.emitChange({ name: name, value: value });
            },
            configurable: true,
            enumerable: true
        });
        this.target[name] = value;
    };
    /**
     * 自动应用所有动态添加的属性
     * @returns {void} 无返回
     */
    Observer.prototype.apply = function () {
        if (isArray(this.target)) {
            this._wrapArray(this.target);
        }
        var names = this._getPropertyNames(this.target);
        names.forEach(function (name) {
            var desc = Object.getOwnPropertyDescriptor(this.target, name);
            if (!('value' in desc))
                return;
            this.set(name, this.target[name]);
        }, this);
    };
    /**
     * 添子观察者对象
     * @param {Object} child 父对象
     * @param {String} name 属性名
     * @returns {void} 无返回
     */
    Observer.prototype.addChild = function (child, name) {
        if (isNull(child) || isNull(name)) {
            throw new Error('Invalid paramaters');
        }
        if (child.options.root)
            return;
        child.parents.push({ parent: this, name: name });
    };
    /**
     * 移除子对象
     * @param {Object} child 父对象
     * @param {String} name 属性名
     * @returns {void} 无返回
     */
    Observer.prototype.removeChild = function (child, name) {
        if (isNull(child)) {
            throw new Error('Invalid paramaters');
        }
        var foundIndex = -1;
        child.parents.forEach(function (item, index) {
            if (item.parent === this && item.name === name) {
                foundIndex = index;
            }
        }, this);
        if (foundIndex > -1) {
            child.parents.splice(foundIndex, 1);
        }
    };
    /**
     * 清除所有父子引用
     * @returns {void} 无返回
     */
    Observer.prototype.clearReference = function () {
        each(this.target, function (name, value) {
            if (isNull(value))
                return;
            var child = value[OBSERVER_PROP_NAME];
            if (child)
                this.removeChild(child);
        }, this);
    };
    /**
     * 触发 change 事件
     * @param {Object} event 事件对象
     * @returns {void} 无返回
     */
    Observer.prototype.emitChange = function (event) {
        event.path = event.name;
        this.dispatch(CHANGE_EVENT_NAME, event);
    };
    /**
     * 触发 change 事件
     * @param {Object} event 事件对象
     * @returns {void} 无返回
     */
    Observer.prototype.emitGet = function (event) {
        event.path = event.name;
        this.dispatch(GET_EVENT_NAME, event);
    };
    /**
     * 派发一个事件，事件会向父级对象冒泡
     * @param {string} eventName 事件名称
     * @param {Object} event 事件对象
     * @returns {void} 无返回
     */
    Observer.prototype.dispatch = function (eventName, event) {
        if (event._src_ === this)
            return;
        event._src_ = event._src_ || this;
        event._layer_ = event._layer_ || 0;
        if ((event._layer_++) >= EVENT_MAX_DISPATCH_LAYER)
            return;
        this.emit(eventName, event);
        if (!this.parents || this.parents.length < 1)
            return;
        this.parents.forEach(function (item) {
            if (!(item.name in item.parent.target)) {
                return item.parent.removeChild(this);
            }
            var parentEvent = copy(event);
            parentEvent.path = isNull(event.path) ? item.name :
                item.name + '.' + event.path;
            item.parent.dispatch(eventName, parentEvent);
        }, this);
    };
    /**
     * 获取所有成员名称列表
     * @returns {Array} 所有成员名称列表
     */
    Observer.prototype._getPropertyNames = function () {
        var names = isArray(this.target) ?
            this.target.map(function (item, index) {
                return index;
            }) : Object.keys(this.target);
        return names.filter(function (name) {
            return name !== OBSERVER_PROP_NAME;
        });
    };
    /**
     * 包裹数组
     * @param {array} array 源数组
     * @returns {array} 处理后的数组
     */
    Observer.prototype._wrapArray = function (array) {
        if (array._wrapped_)
            return;
        final(array, '_wrapped_', true);
        final(array, 'push', function () {
            var items = [].slice.call(arguments);
            var observer = this[OBSERVER_PROP_NAME];
            items.forEach(function (item) {
                //这里也会触发对应 index 的 change 事件
                observer.set(array.length, item);
            }, this);
            observer.emitChange({ name: 'length', value: this.length });
            observer.emitChange({ value: this.length });
        });
        final(array, 'pop', function () {
            var item = [].pop.apply(this, arguments);
            var observer = this[OBSERVER_PROP_NAME];
            observer.emitChange({ name: this.length, value: item });
            observer.emitChange({ name: 'length', value: this.length });
            observer.emitChange({ value: this.length });
            return item;
        });
        final(array, 'unshift', function () {
            [].unshift.apply(this, arguments);
            var items = [].slice.call(arguments);
            var observer = this[OBSERVER_PROP_NAME];
            items.forEach(function (item, index) {
                //这里也会触发对应 index 的 change 事件
                observer.set(index, item);
            }, this);
            observer.emitChange({ name: 'length', value: this.length });
            observer.emitChange({ value: this.length });
        });
        final(array, 'shift', function () {
            var item = [].shift.apply(this, arguments);
            var observer = this[OBSERVER_PROP_NAME];
            observer.emitChange({ name: 0, value: item });
            observer.emitChange({ name: 'length', value: this.length });
            observer.emitChange({ value: this.length });
            return item;
        });
        final(array, 'splice', function () {
            var startIndex = arguments[0];
            var endIndex = isNull(arguments[1])
                ? startIndex + arguments[1]
                : this.length - 1;
            var observer = this[OBSERVER_PROP_NAME];
            var items = [].splice.apply(this, arguments);
            for (var i = startIndex; i <= endIndex; i++) {
                observer.emitChange({ name: i, value: items[i - startIndex] });
            }
            observer.emitChange({ name: 'length', value: this.length });
            observer.emitChange({ value: this.length });
            return items;
        });
        final(array, 'set', function (index, value) {
            var observer = this[OBSERVER_PROP_NAME];
            if (index >= this.length) {
                observer.emitChange({ name: 'length', value: this.length });
                observer.emitChange({ value: this.length });
            }
            observer.set(index, value);
        });
    };
    Observer.prototype.run = function (handler, options) {
        options = options || {};
        var context = options.context, trigger = options.trigger, immed = options.immed, deep = options.deep;
        context = context || this.target;
        var auto = new AutoRun(handler, context, trigger, deep);
        this.on('get', auto.onGet);
        this.on('change', auto.onChange);
        if (immed)
            auto.run();
        return auto;
    };
    Observer.prototype.stop = function (autoRef) {
        if (!autoRef)
            return;
        this.off('get', autoRef.onGet);
        this.off('change', autoRef.onChange);
    };
    Observer.prototype.watch = function (calculator, handler, options) {
        options = options || {};
        var context = options.context;
        context = context || this.target;
        var watcher = new Watcher(calculator, handler, context);
        watcher.autoRef = this.run(watcher.calc, options);
        return watcher;
    };
    Observer.prototype.unWatch = function (watcher) {
        if (!watcher)
            return;
        this.stop(watcher.autoRef);
    };
    return Observer;
}(EventEmitter));
/**
 * 观察一个对象
 * @param {Object} target 目标对象
 * @return {Observer} 观察者对象
 */
Observer.observe = function (target) {
    return new Observer(target);
};
/**
 * 检查是不是忽略的属性名
 * @param {string} word 待检查的字符串
 * @returns {void} 无返回
 */
Observer.isIgnore = function (word) {
    return IGNORE_REGEXPS.some(function (re) { return re.test(word); });
};
module.exports = Observer;
//# sourceMappingURL=observer.js.map