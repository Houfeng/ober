const { isFunction, isBoolean, getByPath } = require('ntils');

class Watcher {

  constructor(calculator, handler, context) {
    if (!isFunction(calculator) || !isFunction(handler)) {
      throw new Error('Invalid parameters');
    }
    this.context = context || this;
    this.calculator = isFunction(calculator) ? calculator : () => {
      return getByPath(this.context, calculator);
    };
    this.handler = handler;
  }

  //force: true 强制执行，false 强制不执行，无参数根据计算结果决定
  calc = force => {
    let newValue = this.calculator.call(this.context);
    let newValueJson = JSON.stringify(newValue);
    let willExecute = isBoolean(force) ? force :
      !newValueJson === this.value;
    if (willExecute) {
      this.handler.call(this.context, newValue,
        this.value && JSON.parse(this.value));
    }
    this.value = newValueJson;
  };

}

module.exports = Watcher;