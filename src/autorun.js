const nextTick = require('./next-tick');

module.exports = class AutoRun {

  constructor(handler, context, trigger, deep) {
    this.handler = handler;
    this.context = context || this;
    this.trigger = trigger || this.run;
    this.deep = deep || false;
  }

  isSync() {
    return false;
  }

  onGet = event => {
    if (!this.runing || !event || !this.dependencies) return;
    this.dependencies[event.path] = true;
  };

  isDependent = path => {
    if (!path) return false;
    if (!this.dependencies || this.dependencies[path]) return true;
    if (!this.deep) return false;
    let paths = path.split('.');
    paths.pop();
    return this.isDependent(paths.join('.'));
  };

  onChange = event => {
    if (this.runing || !event || !this.isDependent(event.path)) return;
    if (this.isSync()) {
      return this.trigger.call(this.context);
    }
    if (!nextTick.handlers.some(handler => handler == this.trigger)) {
      nextTick(this.trigger, this.context, true).catch(err => {
        throw err;
      });
    }
  };

  run = (...args) => {
    this.dependencies = {};
    this.runing = true;
    let result = this.handler.call(this.context, ...args);
    this.runing = false;
    return result;
  };

};