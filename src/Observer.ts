import { isArray, isFunction, isNull, isObject, copy, final } from "ntils";
import { AutoRun } from "./AutoRun";
import { Watcher } from "./Watcher";
import { ObserveId } from "./ObserveId";
import { publish, subscribe, unsubscribe } from "./ObserveBus";

const OBSERVER_PROP_NAME = "_observer_";
const IGNORE_REGEXPS = [/^\_(.*)\_$/, /^\_\_/, /^\$/];

export class Observer {
  public static state = true;

  public static pause() {
    Observer.state = false;
  }

  public static resume() {
    Observer.state = true;
  }

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
  public static isIgnore = (word: string | number) => {
    return IGNORE_REGEXPS.some(re => re.test(String(word)));
  };

  protected _wrapped_: boolean;
  public id = ObserveId();
  public target: any;
  public options: any;
  public shadow: any;

  /**
   * 通过目标对象构造一个观察对象
   * @param {Object} target 目标对象
   * @param {Object} options 选项
   * @returns {void} 无返回
   */
  constructor(target: any, options?: any) {
    if (isNull(target)) {
      throw new Error("Invalid target");
    }
    options = options || {};
    const observer = target[OBSERVER_PROP_NAME];
    if (observer) {
      copy(options, observer.options);
      observer.apply();
      return observer;
    }
    final(this, "options", options);
    final(this, "shadow", {});
    final(this, "target", target);
    final(target, OBSERVER_PROP_NAME, this);
    this.apply();
  }

  /**
   * 添加一个属性，动态添中的属性，无法被观察，
   * 但是通过 set 方法添加的属性可能被观察。
   * @param {string} member 名称
   * @param {Object} value 值
   * @returns {void} 无返回
   */
  public set(member: string | number, value: any) {
    if (isFunction(value) || Observer.isIgnore(member)) return;
    Object.defineProperty(this.target, member, {
      get() {
        const observer: Observer = this[OBSERVER_PROP_NAME];
        const id = observer.id;
        if (Observer.state) publish("get", { id, member, value });
        return observer.shadow[member];
      },
      set(value) {
        const observer: Observer = this[OBSERVER_PROP_NAME];
        const oldValue = observer.shadow[member];
        if (oldValue === value || !Observer.state) return;
        if (isObject(value)) Observer.observe(value);
        observer.shadow[member] = value;
        const id = observer.id;
        publish("set", { id, member, value });
      },
      configurable: true,
      enumerable: true
    });
    this.target[member] = value;
  }

  /**
   * 自动应用所有动态添加的属性
   * @returns {void} 无返回
   */
  public apply() {
    if (isArray(this.target)) {
      this._wrapArray(this.target);
    }
    const names = this._getPropertyNames();
    names.forEach((name: string) => {
      const desc = Object.getOwnPropertyDescriptor(this.target, name);
      if (!("value" in desc)) return;
      this.set(name, this.target[name]);
    });
  }

  /**
   * 获取所有成员名称列表
   * @returns {Array} 所有成员名称列表
   */
  protected _getPropertyNames() {
    const names = isArray(this.target)
      ? this.target.map((_item: any, index: number) => {
          return index;
        })
      : Object.keys(this.target);
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
    final(array, "_wrapped_", true);
    final(array, "push", function() {
      const items: any[] = [].slice.call(arguments);
      const observer: Observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      items.forEach(item => {
        // 这里也会触发对应 index 的 change 事件
        observer.set(array.length, item);
      });
      publish("set", { id, member: "length", value: this.length });
    });
    final(array, "pop", function() {
      const item = [].pop.apply(this, arguments);
      const observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      publish("set", { id, member: this.length, value: item });
      publish("set", { id, member: "length", value: this.length });
      return item;
    });
    final(array, "unshift", function() {
      [].unshift.apply(this, arguments);
      const items: any[] = [].slice.call(arguments);
      const observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      items.forEach((item, index) => {
        // 这里也会触发对应 index 的 change 事件
        observer.set(index, item);
      });
      publish("set", { id, member: "length", value: this.length });
    });
    final(array, "shift", function() {
      const item = [].shift.apply(this, arguments);
      const observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      publish("set", { id, member: 0, value: item });
      publish("set", { id, member: "length", value: this.length });
      return item;
    });
    final(array, "splice", function() {
      const delItems = [].splice.apply(this, arguments);
      const items: any[] = [].slice.call(arguments, 2);
      const observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      items.forEach(item => {
        observer.set(this.indexOf(item), item);
      });
      publish("set", { id, member: "length", value: this.length });
      return delItems;
    });
    final(array, "set", function(index: number, value: any) {
      const observer = this[OBSERVER_PROP_NAME];
      const id = observer.id;
      if (index >= this.length) {
        publish("set", { id, member: "length", value: this.length });
      }
      observer.set(index, value);
    });
  }

  run(handler: Function, options: any) {
    options = options || {};
    let { context, trigger, immed } = options;
    context = context || this.target;
    const autoRun = new AutoRun(handler, context, trigger);
    subscribe("get", autoRun.onGet);
    subscribe("set", autoRun.onChange);
    if (immed) autoRun.run();
    return autoRun;
  }

  stop(autoRef: any) {
    if (!autoRef) return;
    unsubscribe("get", autoRef.onGet);
    unsubscribe("set", autoRef.onChange);
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
