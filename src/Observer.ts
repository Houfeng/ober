import { isArray, isFunction, isNull, isObject, copy, final } from "ntils";
import { EventEmitter } from "eify";
import { AutoRun } from "./AutoRun";
import { Watcher } from "./Watcher";
import { IObserveEvent } from "./IObserveEvent";

const OBSERVER_PROP_NAME = '_observer_';
const CHANGE_EVENT_NAME = 'change';
const GET_EVENT_NAME = 'get';
const EVENT_MAX_DISPATCH_LAYER = 10;
const IGNORE_REGEXPS = [/^\_(.*)\_$/, /^\_\_/, /^\$/];

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
export class Observer extends EventEmitter {

  /**
   * 观察一个对象
   * @param {Object} target 目标对象
   * @return {Observer} 观察者对象
   */
  public static observe = (target: any) => {
    return new Observer(target);
  };

  /**
   * 检查是不是忽略的属性名
   * @param {string} word 待检查的字符串
   * @returns {void} 无返回
   */
  public static isIgnore = (word: string) => {
    return IGNORE_REGEXPS.some(re => re.test(word));
  };

  public target: any;
  protected _wrapped_: boolean;
  public options: any;
  public parents: ({ parent: Observer, name: string })[];

  /**
   * 通过目标对象构造一个观察对象
   * @param {Object} target 目标对象
   * @param {Object} options 选项
   * @returns {void} 无返回
   */
  constructor(target: any, options?: any) {
    super();
    if (isNull(target)) {
      throw new Error('Invalid target');
    }
    options = options || {};
    const observer = target[OBSERVER_PROP_NAME];
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
    final(this, 'options', options);
    final(this, 'shadow', {});
    final(this, 'target', target);
    final(this, 'parents', []);
    final(target, OBSERVER_PROP_NAME, this);
    this.apply();
  }

  /**
   * 添加一个属性，动态添中的属性，无法被观察，
   * 但是通过 set 方法添加的属性可能被观察。
   * @param {string} name 名称
   * @param {Object} value 值
   * @returns {void} 无返回
   */
  public set(name: string, value: any) {
    if (isFunction(value) || Observer.isIgnore(name)) {
      return;
    }
    Object.defineProperty(this.target, name, {
      get() {
        const observer = this[OBSERVER_PROP_NAME];
        observer.emitGet({ name: name, value: value });
        return observer.shadow[name];
      },
      set(value) {
        const observer = this[OBSERVER_PROP_NAME];
        const oldValue = observer.shadow[name];
        if (oldValue === value) return;
        if (isObject(value)) {
          const childObserver = new Observer(value);
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
  }

  /**
   * 自动应用所有动态添加的属性
   * @returns {void} 无返回
   */
  public apply() {
    if (isArray(this.target)) {
      this._wrapArray(this.target);
    }
    const names = this._getPropertyNames(this.target);
    names.forEach((name: string) => {
      const desc = Object.getOwnPropertyDescriptor(this.target, name);
      if (!('value' in desc)) return;
      this.set(name, this.target[name]);
    });
  }

  /**
   * 添子观察者对象
   * @param {Object} child 父对象
   * @param {String} name 属性名
   * @returns {void} 无返回
   */
  addChild(child: Observer, name: string) {
    if (isNull(child) || isNull(name)) {
      throw new Error('Invalid paramaters');
    }
    if (child.options.root) return;
    child.parents.push({ parent: this, name: name });
  }

  /**
   * 移除子对象
   * @param {Object} child 子对象
   * @param {String} name 属性名
   * @returns {void} 无返回
   */
  removeChild(child: Observer, name?: string) {
    if (isNull(child)) {
      throw new Error('Invalid paramaters');
    }
    const index = child.parents.findIndex((item) => {
      return name ? item.parent === this && item.name === name
        : item.parent === this;
    });
    if (index > -1) child.parents.splice(index, 1);
  }

  /**
   * 清除所有父子引用
   * @returns {void} 无返回
   */
  clearReference() {
    Object.values(this.target).forEach((value: any) => {
      if (isNull(value)) return;
      const child = value[OBSERVER_PROP_NAME];
      if (child) this.removeChild(child);
    });
  }

  /**
   * 触发 change 事件
   * @param {Object} event 事件对象
   * @returns {void} 无返回
   */
  emitChange(event: IObserveEvent) {
    event.path = event.name;
    this.dispatch(CHANGE_EVENT_NAME, event);
  }

  /**
   * 触发 change 事件
   * @param {Object} event 事件对象
   * @returns {void} 无返回
   */
  emitGet(event: IObserveEvent) {
    event.path = event.name;
    this.dispatch(GET_EVENT_NAME, event);
  }

  /**
   * 派发一个事件，事件会向父级对象冒泡
   * @param {string} eventName 事件名称
   * @param {Object} event 事件对象
   * @returns {void} 无返回
   */
  dispatch(eventName: string, event: IObserveEvent) {
    if (event.src === this) return;
    event.src = event.src || this;
    event.layer = event.layer || 0;
    if ((event.layer++) >= EVENT_MAX_DISPATCH_LAYER) return;
    this.emit(eventName, event);
    if (!this.parents || this.parents.length < 1) return;
    this.parents.forEach((item) => {
      if (!(item.name in item.parent.target)) {
        return item.parent.removeChild(this);
      }
      const parentEvent = copy(event);
      parentEvent.path = isNull(event.path) ? item.name :
        item.name + '.' + event.path;
      item.parent.dispatch(eventName, parentEvent);
    });
  }

  /**
   * 获取所有成员名称列表
   * @returns {Array} 所有成员名称列表
   */
  protected _getPropertyNames(target: any = this.target) {
    const names = isArray(target) ?
      this.target.map((_item: any, index: number) => {
        return index;
      }) : Object.keys(this.target);
    return names.filter((name: string) => {
      return name !== OBSERVER_PROP_NAME;
    });
  }

  /**
   * 包裹数组
   * @param {array} array 源数组
   */
  protected _wrapArray(array: any[]) {
    if ((array as any)._wrapped_) return;
    final(array, '_wrapped_', true);
    final(array, 'push', function () {
      const items: any[] = [].slice.call(arguments);
      const observer = this[OBSERVER_PROP_NAME];
      items.forEach((item) => {
        //这里也会触发对应 index 的 change 事件
        observer.set(array.length, item);
      });
      observer.emitChange({ name: 'length', value: this.length });
      observer.emitChange({ value: this.length });
    });
    final(array, 'pop', function () {
      const item = [].pop.apply(this, arguments);
      const observer = this[OBSERVER_PROP_NAME];
      observer.emitChange({ name: this.length, value: item });
      observer.emitChange({ name: 'length', value: this.length });
      observer.emitChange({ value: this.length });
      return item;
    });
    final(array, 'unshift', function () {
      [].unshift.apply(this, arguments);
      const items: any[] = [].slice.call(arguments);
      const observer = this[OBSERVER_PROP_NAME];
      items.forEach((item, index) => {
        //这里也会触发对应 index 的 change 事件
        observer.set(index, item);
      });
      observer.emitChange({ name: 'length', value: this.length });
      observer.emitChange({ value: this.length });
    });
    final(array, 'shift', function () {
      const item = [].shift.apply(this, arguments);
      const observer = this[OBSERVER_PROP_NAME];
      observer.emitChange({ name: 0, value: item });
      observer.emitChange({ name: 'length', value: this.length });
      observer.emitChange({ value: this.length });
      return item;
    });
    final(array, 'splice', function () {
      const delItems = [].splice.apply(this, arguments);
      const items: any[] = [].slice.call(arguments, 2);
      const observer = this[OBSERVER_PROP_NAME];
      items.forEach(item => {
        observer.set(this.indexOf(item), item);
      });
      observer.emitChange({ name: 'length', value: this.length });
      observer.emitChange({ value: this.length });
      return delItems;
    });
    final(array, 'set', function (index: number, value: any) {
      const observer = this[OBSERVER_PROP_NAME];
      if (index >= this.length) {
        observer.emitChange({ name: 'length', value: this.length });
        observer.emitChange({ value: this.length });
      }
      observer.set(index, value);
    });
  }

  run(handler: Function, options: any) {
    options = options || {};
    let { context, trigger, immed, deep } = options;
    context = context || this.target;
    const autoRun = new AutoRun(handler, context, trigger, deep);
    this.on('get', autoRun.onGet);
    this.on('change', autoRun.onChange);
    if (immed) autoRun.run();
    return autoRun;
  }

  stop(autoRef: any) {
    if (!autoRef) return;
    this.off('get', autoRef.onGet);
    this.off('change', autoRef.onChange);
  }

  watch(calculator: Function, handler: Function, options: any) {
    options = options || {};
    let { context } = options;
    context = context || this.target;
    const watcher = new Watcher(calculator, handler, context);
    watcher.autoRef = this.run(watcher.calc, options);
    return watcher;
  }

  unWatch(watcher: Watcher) {
    if (!watcher) return;
    this.stop(watcher.autoRef);
  }

}